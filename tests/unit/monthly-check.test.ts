import { describe, it, expect } from 'vitest';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, symlinkSync, existsSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  classifyStop, presenceProblem, shellReason, isParked, fingerprintOf, pageChanged, titleSimilarity, floorTripped, cohortFloorTripped,
  applyRoadsRun, pendingKeys, suspensionsByRoad, stopStateKey, citeOf,
  parseMapsStatus, nameMatches, judgeMapsAnswer, directoryTransitions, transitionCounts, directoryVerdict, mergeDirectoryState, initMayAccept,
  classifyLink, newLinkProblems, newLinkLeads, linkVerdict, mergeLinkState,
  exitCode, summaryLine, insideDir, lockIsStale,
  MIN_REAL_TEXT, SANITY_FLOOR, CONFIRM_AFTER_HOURS, STATUS_REQUEST_CAP, PLAIN_NO_HOURS, PLAIN_NO_DOMAIN, PLAIN_PARKED, PLAIN_NO_NOTICE,
  type Observation, type RoadsState, type StopRun, type LinkRun, type DirectoryRun, type DirectoryState, type LinksState, type Baseline, type PageFingerprint,
} from '../../src/lib/monthly-check';

const AT = '2026-12-01T09:20:00.000Z';
const HOURS = 'Mon 3-9 Tue 3-9 Wed 3-9';
const body = (hours = HOURS) => `Fixture Brewing ${'A brewery page with a good deal of real text on it. '.repeat(24)} Visit the taproom. Our hours are ${hours} Find us at 1 Fixture St. ${'More words about beer and food. '.repeat(8)}`;
type Page = Extract<Observation, { kind: 'page' }>;
const page = (o: Partial<Page> = {}): Page => ({ kind: 'page', at: AT, status: 200, text: body(), meta: '', title: 'Hours | Fixture Brewing', finalUrl: 'https://www.fixturebrewing.com/visit/', ...o });
const gone: Observation = { kind: 'no-such-domain', at: AT }, timeout: Observation = { kind: 'error', at: AT, why: 'timed out' };
const FP: PageFingerprint = fingerprintOf(page(), HOURS);

describe('monthly check A: a positive match needs a page that loaded normally', () => {
  const stop = (evidencePage: Observation, evidenceFound: boolean, more: Partial<Parameters<typeof classifyStop>[0]> = {}) => classifyStop({ evidencePage, evidenceFound, address: null, ...more });
  it('CONFIRMED needs the evidence, and the address when there is one, each on a healthy page', () => {
    expect(stop(page(), true).status).toBe('CONFIRMED');
    expect(stop(page(), true, { address: { page: page(), found: true } }).status).toBe('CONFIRMED');
    expect(stop(page({ text: `Hours ${HOURS}` }), true).status).toBe('CONFIRMED');   // a short page is fine for showing presence
  });
  it('matching text inside a 404, a 500, a consent page or a challenge page does not confirm', () => {
    const shells: Observation[] = [page({ status: 404 }), page({ status: 500 }), page({ status: 403 }), page({ title: 'Just a moment...' }), page({ title: 'Page not found' }),
      page({ text: `We use cookies. Accept all cookies to continue. ${HOURS}` }), page({ text: `Are you 21 or older? Yes No ${HOURS}` }), page({ text: `Verify you are human. ${body()}` }),
      page({ text: `Checking your browser before accessing. ${HOURS}` }), page({ text: `This account has been suspended. ${HOURS}` }), timeout];
    for (const o of shells) {
      expect(presenceProblem(o), JSON.stringify(o).slice(0, 90)).not.toBe('');
      const r = stop(o, true); expect(r.status, JSON.stringify(o).slice(0, 90)).toBe('COULD_NOT_OBSERVE');
      // and the same for the address page: an address echoed by an error page confirms nothing
      const a = stop(page(), true, { address: { page: o, found: true } }); expect(a.status, `address: ${JSON.stringify(o).slice(0, 80)}`).toBe('COULD_NOT_OBSERVE'); expect(a.flag).toBeUndefined();
    }
    expect(presenceProblem(page({ text: `${body()} This form is protected by reCAPTCHA.` }))).toBe('');   // a contact form's captcha notice is not a challenge page
    expect(presenceProblem(page())).toBe(''); expect(shellReason(page({ text: `${body()} We use cookies.` }))).toBe('');   // a real page with a cookie line is not a shell
  });
  it('an address that can no longer be found on a healthy page is flagged for a person, and concludes nothing', () => {
    expect(stop(page(), true, { address: { page: page(), found: false } })).toMatchObject({ status: 'COULD_NOT_OBSERVE', flag: 'address' });
  });
});

describe('monthly check A: an absence needs a complete observation of the same page', () => {
  const absent = (o: Observation, more: Partial<Parameters<typeof classifyStop>[0]> = {}) => classifyStop({ evidencePage: o, evidenceFound: false, address: null, fingerprint: FP, ...more });
  const changedHours = page({ text: body('Thu 4-10 Fri 4-11') });
  it('GONE: the page is still recognisably the page we read, and the evidence is not on it', () => {
    expect(FP).toMatchObject({ host: 'fixturebrewing.com', path: '/visit', title: 'Hours | Fixture Brewing' }); expect(FP.before).toContain('our hours are'); expect(FP.after).toContain('find us at');
    expect(pageChanged(FP, changedHours)).toBe('');
    expect(absent(changedHours)).toEqual({ status: 'GONE', reason: 'the cited page is still recognisably the page we read before, and the evidence is not on it', plain: PLAIN_NO_HOURS });
    expect(PLAIN_NO_HOURS).toBe('the visiting-hours evidence we cited was not found on the cited page');
    expect(absent(changedHours, { evidenceKind: 'notice' }).plain).toBe(PLAIN_NO_NOTICE);
  });
  it('a page that changed is "page changed; a person should look", never GONE', () => {
    const cases: [Page, RegExp][] = [
      [page({ text: body('x'), finalUrl: 'https://www.otherbrewing.com/visit/' }), /redirects to otherbrewing\.com/],
      [page({ text: body('x'), finalUrl: 'https://www.fixturebrewing.com/' }), /redirects to another page/],
      [page({ text: body('x'), title: 'Welcome to our new online store' }), /title is different/],
      [page({ text: body('x').slice(0, 620) }), /much shorter/],
      [page({ text: body('x').repeat(3) }), /much longer/],
      [page({ text: `Fixture Brewing ${'An entirely new layout with other words in it. '.repeat(20)}` }), /layout has changed/],
    ];
    for (const [o, why] of cases) {
      const r = absent(o);
      expect(r.status, why.source).toBe('COULD_NOT_OBSERVE'); expect(r.reason).toMatch(/^page changed \(.*\); a person should look$/); expect(r.reason).toMatch(why); expect(r.flag).toBe('page-changed'); expect(r.plain).toBeUndefined();
    }
    expect(titleSimilarity('Hours | Fixture Brewing', 'Hours - Fixture Brewing')).toBe(1); expect(titleSimilarity('Hours | Fixture Brewing', 'Shop')).toBe(0); expect(titleSimilarity('', '')).toBe(1);
  });
  it('without an earlier confirmed reading of the page, an absence concludes nothing', () => {
    const r = classifyStop({ evidencePage: changedHours, evidenceFound: false, address: null });
    expect(r.status).toBe('COULD_NOT_OBSERVE'); expect(r.reason).toContain('no earlier confirmed reading');
    // nor with a fingerprint that has no record of the text around the evidence (found only in a description tag, say)
    expect(absent(changedHours, { fingerprint: { ...FP, before: '', after: '' } }).status).toBe('COULD_NOT_OBSERVE');
  });
  it('a page that did not load normally, or is thin, concludes nothing', () => {
    expect(body().length).toBeGreaterThan(MIN_REAL_TEXT);
    const unhealthy: Observation[] = [timeout, { kind: 'error', at: AT, why: 'network error (ECONNRESET)' }, page({ status: 403 }), page({ status: 429 }), page({ status: 500 }), page({ status: 503 }), page({ status: 404 }),
      page({ text: 'Loading...' }), page({ text: '' }), page({ title: 'Just a moment...' }), page({ title: 'Attention Required! | Cloudflare' }), page({ title: '404' }), page({ text: 'Coming soon.' }), page({ text: 'This site is temporarily unavailable.' })];
    for (const o of unhealthy) { const r = absent(o); expect(r.status, JSON.stringify(o).slice(0, 80)).toBe('COULD_NOT_OBSERVE'); expect(r.plain).toBeUndefined(); }
  });
  it('a page a person had to read in a browser is never GONE on this script\'s reading', () => {
    expect(absent(page({ text: '' }), { browserChecked: '2026-11-22' }).reason).toContain('a person read this page in a browser on 2026-11-22');
    expect(absent(changedHours, { browserChecked: '2026-11-22' }).status).toBe('COULD_NOT_OBSERVE');
  });
  it('a domain that no longer exists, or a domain seller\'s page, is GONE; an outage or maintenance page is not', () => {
    expect(absent(gone)).toMatchObject({ status: 'GONE', plain: PLAIN_NO_DOMAIN });
    const forSale = page({ title: 'fixturebrewing.com is for sale | HugeDomains', text: 'Buy this domain.' });
    expect(isParked(forSale)).toBe(true); expect(absent(forSale)).toMatchObject({ status: 'GONE', plain: PLAIN_PARKED });
    expect(isParked(page({ finalUrl: 'https://www.hugedomains.com/domain_profile.cfm?d=fixture.com' }))).toBe(true);
    for (const text of ['Account Suspended. Contact your hosting provider.', 'Coming soon', 'This site is not available', 'Website expired', 'Under maintenance', 'This site can’t be reached']) {
      const o = page({ title: text, text });
      expect(isParked(o), text).toBe(false); expect(absent(o).status, text).toBe('COULD_NOT_OBSERVE');
    }
    expect(isParked(page())).toBe(false); expect(isParked(page({ status: 404, title: 'this domain is for sale' }))).toBe(false);
  });
});

describe('monthly check: the sanity floors', () => {
  it('more than 15% bad in one run is a broken run', () => {
    expect(SANITY_FLOOR).toBe(0.15);
    expect(floorTripped(15, 100)).toBe(false); expect(floorTripped(16, 100)).toBe(true);
    expect(floorTripped(12, 79)).toBe(true); expect(floorTripped(11, 79)).toBe(false);
    expect(floorTripped(0, 0)).toBe(false); expect(floorTripped(2, 79)).toBe(false);      // a confirming pass over two stops, measured against the road
  });
  it('a group seen for the first time has its own floor, small or large', () => {
    expect(cohortFloorTripped(2, 5)).toBe(false); expect(cohortFloorTripped(3, 5)).toBe(true); expect(cohortFloorTripped(2, 10)).toBe(true); expect(cohortFloorTripped(1, 10)).toBe(false); expect(cohortFloorTripped(0, 0)).toBe(false);
  });
});

describe('monthly check A: state, and a proposal only on a repeated valid observation', () => {
  const plus = (h: number) => new Date(Date.parse(AT) + h * 3600000).toISOString();
  const CITE = citeOf('r', '1', 'https://x.example/hours', HOURS);
  const run = (key: string, status: StopRun['status'], at = AT, cite = CITE): StopRun => ({ slug: 'r', key, cite, at, status, reason: `${status} in test`, ...(status === 'GONE' ? { plain: PLAIN_NO_HOURS, kept: `/pages/${key}-${at}.txt` } : {}), ...(status === 'CONFIRMED' ? { page: FP } : {}) });
  const empty: RoadsState = { stops: {} };
  it('all or nothing: an invalid check leaves the state exactly as it was and makes nothing eligible', () => {
    const before: RoadsState = { stops: { 'r/1': { cite: CITE, confirmedAt: AT, page: FP }, 'r/2': { cite: CITE, gone: [{ at: AT, reason: 'x', plain: PLAIN_NO_HOURS }] } } };
    const snapshot = JSON.stringify(before);
    const r = applyRoadsRun(before, [run('1', 'GONE', plus(72)), run('2', 'GONE', plus(72)), run('3', 'CONFIRMED', plus(72))], false);
    expect(r.state).toBe(before); expect(JSON.stringify(before)).toBe(snapshot); expect(r.eligible).toEqual([]); expect(r.goneOnce).toEqual([]); expect(r.cleared).toEqual([]);
  });
  it('a stop that could not be observed keeps its entry and its dates', () => {
    const before: RoadsState = { stops: { 'r/1': { cite: CITE, confirmedAt: AT, page: FP }, 'r/2': { cite: CITE, gone: [{ at: AT, reason: 'x', plain: PLAIN_NO_HOURS }] } } };
    const r = applyRoadsRun(before, [run('1', 'COULD_NOT_OBSERVE', plus(96)), run('2', 'COULD_NOT_OBSERVE', plus(96)), run('9', 'COULD_NOT_OBSERVE', plus(96))], true);
    expect(r.state.stops).toEqual(before.stops); expect(r.eligible).toEqual([]); expect(r.state.stops['r/9']).toBeUndefined();
  });
  it('CONFIRMED records when it was read and what the page looked like', () => {
    const r = applyRoadsRun(empty, [run('1', 'CONFIRMED', plus(1))], true);
    expect(r.state.stops['r/1']).toEqual({ cite: CITE, confirmedAt: plus(1), page: FP }); expect(empty.stops).toEqual({});
  });
  it('one GONE observation proposes nothing: it is a first sighting, with its page text kept', () => {
    const r = applyRoadsRun({ stops: { 'r/1': { cite: CITE, confirmedAt: plus(-700), page: FP } } }, [run('1', 'GONE')], true);
    expect(r.eligible).toEqual([]); expect(r.goneOnce.map((x) => x.key)).toEqual(['1']);
    expect(r.state.stops['r/1']).toEqual({ cite: CITE, confirmedAt: plus(-700), page: FP, gone: [{ at: AT, reason: 'GONE in test', plain: PLAIN_NO_HOURS, kept: `/pages/1-${AT}.txt` }] });
    expect(pendingKeys(r.state)).toEqual(['r/1']);
  });
  it('two distinct observations at least 48 hours apart, by their own timestamps', () => {
    expect(CONFIRM_AFTER_HOURS).toBe(48);
    const first = applyRoadsRun(empty, [run('1', 'GONE')], true).state;
    expect(applyRoadsRun(first, [run('1', 'GONE')], true).eligible).toEqual([]);                       // the same observation again is not a second one
    for (const h of [0.1, 24, 47.9]) {
      const r = applyRoadsRun(first, [run('1', 'GONE', plus(h))], true);
      expect(r.eligible, `${h} hours`).toEqual([]); expect(r.state.stops['r/1'].gone![0].at).toBe(AT);   // the first sighting stands; the clock does not restart
    }
    for (const h of [48, 72, 24 * 31]) {
      const r = applyRoadsRun(first, [run('1', 'GONE', plus(h))], true);
      expect(r.eligible, `${h} hours`).toHaveLength(1);
      expect(r.eligible[0]).toMatchObject({ slug: 'r', key: '1', plain: PLAIN_NO_HOURS, firstSeen: AT, confirmed: plus(h) }); expect(r.eligible[0].records.map((g) => g.at)).toEqual([AT, plus(h)]);
    }
    // A run that began 48 hours after the first run began, but read this stop only 47 hours after it was first read: not yet.
    const late = applyRoadsRun(empty, [run('1', 'GONE', plus(2))], true).state;
    expect(applyRoadsRun(late, [run('1', 'GONE', plus(49))], true).eligible).toEqual([]);
  });
  it('an eligible stop stays eligible and is proposed again for as long as it stays gone and nobody has acted', () => {
    let s = applyRoadsRun(empty, [run('1', 'GONE')], true).state;
    for (const h of [72, 24 * 31, 24 * 34, 24 * 62]) {
      const r = applyRoadsRun(s, [run('1', 'GONE', plus(h))], true); s = r.state;
      expect(r.eligible.map((x) => [x.key, x.firstSeen]), `${h} hours`).toEqual([['1', AT]]); expect(pendingKeys(s)).toEqual(['r/1']);
    }
    expect(s.stops['r/1'].gone!.length).toBeLessThanOrEqual(6); expect(s.stops['r/1'].gone![0].at).toBe(AT);
    // unobservable on a later pass: nothing proposed that time, still pending
    const u = applyRoadsRun(s, [run('1', 'COULD_NOT_OBSERVE', plus(24 * 65))], true);
    expect(u.eligible).toEqual([]); expect(pendingKeys(u.state)).toEqual(['r/1']);
  });
  it('found again: the sightings are cleared and a later GONE starts from a first sighting', () => {
    const first = applyRoadsRun(empty, [run('1', 'GONE')], true).state;
    const r = applyRoadsRun(first, [run('1', 'CONFIRMED', plus(72))], true);
    expect(r.eligible).toEqual([]); expect(r.cleared.map((x) => x.key)).toEqual(['1']); expect(r.state.stops['r/1']).toEqual({ cite: CITE, confirmedAt: plus(72), page: FP });
    expect(applyRoadsRun(r.state, [run('1', 'GONE', plus(200))], true).eligible).toEqual([]);
  });
  it('a sighting is bound to the stop, the source page and the cited evidence: change one and it no longer counts', () => {
    const first = applyRoadsRun(empty, [run('1', 'GONE')], true).state;
    for (const other of [citeOf('r', '1', 'https://x.example/visit', HOURS), citeOf('r', '1', 'https://x.example/hours', 'Mon 4-9'), citeOf('r2', '1', 'https://x.example/hours', HOURS)]) {
      expect(other).not.toBe(CITE);
      const r = applyRoadsRun(first, [run('1', 'GONE', plus(72), other)], true);
      expect(r.eligible).toEqual([]); expect(r.state.stops['r/1']).toMatchObject({ cite: other }); expect(r.state.stops['r/1'].gone).toHaveLength(1);
    }
    expect(citeOf('r', '1', 'https://x.example/hours', HOURS)).toBe(CITE);
  });
  it('a stop on two roads is proposed for both from the one record', () => {
    const roads = [
      { slug: 'i-71', stops: [{ key: '130', breweryId: 130, name: 'Goldhorn' }, { key: '51', breweryId: 51, name: 'Other' }] },
      { slug: 'us-422', stops: [{ key: '130', breweryId: 130, name: 'Goldhorn' }] },
      { slug: 'route-66', stops: [{ key: 'a-brewery-town', name: 'A Brewery' }, { key: '130', name: 'Not the same: no directory id' }] },
    ];
    const order = { slug: 'us-422', key: '130', plain: PLAIN_NO_HOURS, firstSeen: AT, confirmed: plus(72), records: [] };
    expect(suspensionsByRoad([order], roads).map((x) => [x.slug, x.id])).toEqual([['i-71', 130], ['us-422', 130]]);
    expect(suspensionsByRoad([{ ...order, slug: 'route-66', key: 'a-brewery-town' }], roads).map((x) => [x.slug, x.id])).toEqual([['route-66', 'a-brewery-town']]);
    expect(suspensionsByRoad([order, { ...order, slug: 'i-71' }], roads)).toHaveLength(2);       // seen on both roads: still one record each
    expect(suspensionsByRoad([{ ...order, key: 'nope' }], roads)).toEqual([]);
    expect(stopStateKey('us-422', '130')).toBe('us-422/130');
  });
});

const BASE: Baseline = { date: '2026-11-01', by: 'tester@host', file: '/data/internal/2026-11-01-directory.jsonl', hash: 'abc', listings: 100, counts: {} };

describe('monthly check B: directory status (internal lead)', () => {
  const maps = [{ name: 'Fixture Brewing - Google Maps', url: 'https://maps.google.com/maps?cid=1' }];
  const answer = (status: string, name = 'Fixture Brewing Co.') => `STATUS: ${status}\nNAME_ON_MAPS: ${name}\nADDRESS_ON_MAPS: 1 Fixture St, Alpha, PA\nNOTE: open`;
  const judge = (o: Partial<Parameters<typeof judgeMapsAnswer>[0]> = {}) => judgeMapsAnswer({ listingName: 'Fixture Brewing Company', shapeOk: true, answer: answer('OPERATIONAL'), sources: maps, ...o });
  it('reads one status in the form asked for, and nothing else', () => {
    expect(parseMapsStatus('STATUS: OPERATIONAL\nNAME_ON_MAPS: X\nNOTE: open')).toBe('OPERATIONAL');
    expect(parseMapsStatus('STATUS: CLOSED_PERMANENTLY')).toBe('CLOSED_PERMANENTLY'); expect(parseMapsStatus('  STATUS:   NOT_FOUND  ')).toBe('NOT_FOUND');
    for (const bad of ['', 'It is open.', 'STATUS: OPEN', 'STATUS: OPERATIONAL | CLOSED_TEMPORARILY', 'STATUS: OPERATIONAL\nSTATUS: CLOSED_PERMANENTLY', 'The STATUS: OPERATIONAL is likely']) expect(parseMapsStatus(bad), bad).toBeNull();
  });
  it('accepts a status only with grounding and a name that matches the listing', () => {
    expect(judge()).toEqual({ outcome: 'STATUS', status: 'OPERATIONAL', nameOnMaps: 'Fixture Brewing Co.', addressOnMaps: '1 Fixture St, Alpha, PA', source: 'https://maps.google.com/maps?cid=1', why: '' });
    expect(judge({ answer: answer('CLOSED_PERMANENTLY') }).status).toBe('CLOSED_PERMANENTLY');
    // no grounding, an unexpected shape, a malformed answer, no place named: unobservable, never a status
    expect(judge({ sources: [] })).toMatchObject({ outcome: 'UNOBSERVABLE', status: null }); expect(judge({ sources: [{ name: 'A blog', url: 'https://example.com/post' }] }).outcome).toBe('UNOBSERVABLE');
    expect(judge({ shapeOk: false }).outcome).toBe('UNOBSERVABLE'); expect(judge({ answer: 'It looks open to me.' }).outcome).toBe('UNOBSERVABLE');
    expect(judge({ answer: answer('OPERATIONAL', 'N/A') }).outcome).toBe('UNOBSERVABLE'); expect(judge({ answer: 'STATUS: OPERATIONAL' }).outcome).toBe('UNOBSERVABLE');
    // a different business at the address is a lead with both names, not a status
    const other = judge({ answer: answer('OPERATIONAL', 'Corner Pizza & Subs') });
    expect(other).toMatchObject({ outcome: 'OTHER_BUSINESS_AT_ADDRESS', status: null, nameOnMaps: 'Corner Pizza & Subs' }); expect(other.why).toBe('the place returned is "Corner Pizza & Subs", not "Fixture Brewing Company"');
    // not found is a status when the answer is grounded, and unobservable when it is not
    expect(judge({ answer: answer('NOT_FOUND', 'N/A') })).toMatchObject({ outcome: 'STATUS', status: 'NOT_FOUND' }); expect(judge({ answer: answer('NOT_FOUND', 'N/A'), sources: [] }).outcome).toBe('UNOBSERVABLE');
  });
  it('compares names with the generic words set aside', () => {
    for (const [a, b] of [['Great Lakes Brewing Company', 'Great Lakes Brewing Co'], ['The Jolly Scholar', 'Jolly Scholar Brewing Company'], ['Hofbräuhaus Cleveland', 'Hofbrauhaus Cleveland'], ['Saucy Brew Works', 'Saucy Brew Works - Ohio City'], ['Brick and Barrel', 'Brick & Barrel']]) expect(nameMatches(a, b), `${a} / ${b}`).toBe(true);
    for (const [a, b] of [['Fixture Brewing Company', 'Corner Pizza'], ['Great Lakes Brewing Company', 'Lakeshore Brewing'], ['Brewing Company', 'The Brewery'], ['Fixture Brewing', '']]) expect(nameMatches(a, b), `${a} / ${b}`).toBe(false);
  });
  const listings = Object.fromEntries(Array.from({ length: 100 }, (_, i) => [String(i + 1), { status: 'OPERATIONAL', date: '2026-11-01' }]));
  const state: DirectoryState = { baseline: BASE, listings };
  const all = (f: (id: number) => DirectoryRun['status'] | 'OTHER', n = 100): DirectoryRun[] => Array.from({ length: n }, (_, i) => { const s = f(i + 1); return s === 'OTHER' ? { id: i + 1, outcome: 'OTHER_BUSINESS_AT_ADDRESS', status: null } : s ? { id: i + 1, outcome: 'STATUS', status: s } : { id: i + 1, outcome: 'UNOBSERVABLE', status: null }; });
  it('reports every change between validated statuses with both values, and counts from that list', () => {
    const prev = { ...listings, 5: { status: 'CLOSED_TEMPORARILY', date: '2026-11-01' }, 6: { status: 'NOT_FOUND', date: '2026-11-01' }, 7: { status: 'CLOSED_TEMPORARILY', date: '2026-11-01' }, 8: { status: 'CLOSED_PERMANENTLY', date: '2026-11-01' } };
    const runs = [...all((id) => (id === 1 ? 'CLOSED_PERMANENTLY' : id === 2 ? 'NOT_FOUND' : id === 3 ? null : id === 4 ? 'OTHER' : id === 5 ? 'OPERATIONAL' : id === 6 ? 'NOT_FOUND' : id === 7 ? 'CLOSED_PERMANENTLY' : id === 8 ? 'CLOSED_TEMPORARILY' : 'OPERATIONAL')), { id: 500, outcome: 'STATUS' as const, status: 'CLOSED_PERMANENTLY' as const }];
    const t = directoryTransitions(prev, runs);
    expect(t).toEqual([{ id: 1, from: 'OPERATIONAL', to: 'CLOSED_PERMANENTLY' }, { id: 2, from: 'OPERATIONAL', to: 'NOT_FOUND' }, { id: 5, from: 'CLOSED_TEMPORARILY', to: 'OPERATIONAL' }, { id: 7, from: 'CLOSED_TEMPORARILY', to: 'CLOSED_PERMANENTLY' }, { id: 8, from: 'CLOSED_PERMANENTLY', to: 'CLOSED_TEMPORARILY' }]);
    expect(transitionCounts(t)).toEqual({ newlyClosed: 1, newlyNotFound: 1, operationalAgain: 1, other: 2 });
    const c = transitionCounts(t); expect(c.newlyClosed + c.newlyNotFound + c.operationalAgain + c.other).toBe(t.length);
  });
  it('too much turning closed or not found at once is a failed run that changes no state', () => {
    expect(directoryVerdict(state, all((id) => (id <= 15 ? 'CLOSED_PERMANENTLY' : 'OPERATIONAL'))).valid).toBe(true);
    const closed = all((id) => (id <= 16 ? 'CLOSED_PERMANENTLY' : 'OPERATIONAL'));
    expect(directoryVerdict(state, closed)).toEqual({ valid: false, code: 'floor-closed', why: '16 of 100 listings turned closed in one run' });
    expect(mergeDirectoryState(state, closed, '2026-12-01', false)).toBe(state);
    // an API change that turns everything into a well-formed NOT_FOUND does not replace the baseline
    expect(directoryVerdict(state, all(() => 'NOT_FOUND'))).toMatchObject({ valid: false, code: 'floor-not-found' });
    expect(directoryVerdict(state, all((id) => (id <= 16 ? 'NOT_FOUND' : 'OPERATIONAL'))).code).toBe('floor-not-found');
    expect(directoryVerdict(state, all((id) => (id <= 16 ? null : 'OPERATIONAL')))).toMatchObject({ valid: false, code: 'unreadable' });
    expect(directoryVerdict(state, all(() => 'OPERATIONAL', 79))).toMatchObject({ valid: false, code: 'coverage' });   // the directory read was short
    expect(directoryVerdict(state, [])).toMatchObject({ valid: false, code: 'empty' });
    expect(STATUS_REQUEST_CAP).toBe(2000);
  });
  it('listings seen for the first time are their own cohort, even beside listings with state', () => {
    const fresh = (bad: number, n: number): DirectoryRun[] => Array.from({ length: n }, (_, i) => ({ id: 1000 + i, outcome: 'STATUS', status: i < bad ? 'CLOSED_PERMANENTLY' : 'OPERATIONAL' }));
    expect(directoryVerdict(state, [...all(() => 'OPERATIONAL'), ...fresh(2, 20)]).valid).toBe(true);
    expect(directoryVerdict(state, [...all(() => 'OPERATIONAL'), ...fresh(4, 20)])).toMatchObject({ valid: false, code: 'floor-new-cohort' });
    expect(directoryVerdict(state, [...all(() => 'OPERATIONAL'), ...fresh(3, 4)]).code).toBe('floor-new-cohort');
  });
  it('a first run never becomes the baseline by itself; initialising sets aside only the prevalence floor', () => {
    const none: DirectoryState = { listings: {} };
    const quiet = directoryVerdict(none, all(() => 'OPERATIONAL')), busy = directoryVerdict(none, all((id) => (id <= 20 ? 'CLOSED_PERMANENTLY' : 'OPERATIONAL')));
    expect(quiet).toMatchObject({ valid: false, code: 'no-baseline' }); expect(busy).toMatchObject({ valid: false, code: 'first-run-prevalence' });
    expect(initMayAccept(quiet)).toBe(true); expect(initMayAccept(busy)).toBe(true);
    // never anything about how well we observed
    for (const v of [directoryVerdict(none, all(() => null)), directoryVerdict(none, []), directoryVerdict(state, all(() => 'OPERATIONAL', 50)), directoryVerdict(state, all(() => 'NOT_FOUND'))]) { expect(v.valid).toBe(false); expect(initMayAccept(v), v.code).toBe(false); }
  });
  it('a valid run updates only the listings with an accepted status', () => {
    const next = mergeDirectoryState(state, [{ id: 1, outcome: 'STATUS', status: 'CLOSED_PERMANENTLY' }, { id: 2, outcome: 'UNOBSERVABLE', status: null }, { id: 3, outcome: 'OTHER_BUSINESS_AT_ADDRESS', status: null }], '2026-12-01', true);
    expect(next.listings['1']).toEqual({ status: 'CLOSED_PERMANENTLY', date: '2026-12-01' }); expect(next.listings['2']).toEqual(listings['2']); expect(next.listings['3']).toEqual(listings['3']);
    expect(listings['1'].status).toBe('OPERATIONAL'); expect(next.baseline).toBe(BASE);
  });
});

describe('monthly check C: website links', () => {
  const site = (o: Partial<Page> = {}) => page({ finalUrl: 'https://www.fixturebrewing.com/', title: 'Fixture Brewing', ...o });
  const link = (o: Observation, url = 'http://www.fixturebrewing.com', name = 'Fixture Brewing Company') => classifyLink(name, url, o).cls;
  const elsewhere = `Acme Web Design ${'We build websites for small firms in the city. '.repeat(15)}`;
  it('classifies what the link shows', () => {
    expect(link(site())).toBe('OK');
    expect(link(gone)).toBe('DEAD'); expect(link(site({ status: 404 }))).toBe('DEAD'); expect(link(site({ status: 410 }))).toBe('DEAD');
    expect(link(site({ title: 'fixturebrewing.com is for sale', text: 'Buy this domain' }))).toBe('PARKED');
    expect(link(site({ title: 'Acme Web Design', text: elsewhere, finalUrl: 'https://acme-design.example/' }))).toBe('OFF_DOMAIN');
    expect(link(site({ title: 'Fixture Brewing | Order online', finalUrl: 'https://fixture-brewing.square.site/' }))).toBe('MOVED');
    expect(link(site(), 'https://www.facebook.com/fixturebrewing')).toBe('SOCIAL');
  });
  it('a server error, a refusal, a challenge, a timeout or a page too thin to judge concludes nothing', () => {
    const cases: Observation[] = [timeout, site({ status: 500 }), site({ status: 502 }), site({ status: 503 }), site({ status: 403 }), site({ status: 429 }), site({ title: 'Just a moment...' }),
      site({ title: 'Fixture Brewing', text: `Verify you are human by completing the action below. ${body()}` }), site({ title: 'Fixture Brewing', text: 'Access denied' }), site({ text: '', title: '' }), site({ status: 302 })];
    for (const o of cases) expect(link(o), JSON.stringify(o).slice(0, 70)).toBe('COULD_NOT_OBSERVE');
  });
  it('gambling words alone are a lead; HIJACKED needs the brewery\'s name gone from the page as well', () => {
    const casino = 'Situs Judi Slot Gacor Maxwin';
    expect(classifyLink('Fixture Brewing Company', 'http://www.fixturebrewing.com', site({ title: casino, text: `slot gacor togel ${elsewhere}` }))).toMatchObject({ cls: 'HIJACKED' });
    const lead = classifyLink('Fixture Brewing Company', 'http://www.fixturebrewing.com', site({ title: 'Fixture Brewing | Casino Night this Friday', text: body() }));
    expect(lead.cls).toBe('POSSIBLE_TAKEOVER'); expect(lead.note).toMatch(/^possible takeover: review\./);
    expect(link(site({ title: 'Fixture Brewing', text: `${body()} hidden: slot gacor togel judi` }))).not.toBe('HIJACKED');
    expect(link(site({ title: 'Fixture Brewing', text: `${body()} Join our sweepstakes.` }))).toBe('OK');           // one word in the body is nothing
  });
  const runs = (f: (id: number) => LinkRun['cls'], n = 100): LinkRun[] => Array.from({ length: n }, (_, i) => ({ id: i + 1, url: `http://s${i + 1}.example`, cls: f(i + 1), note: '' }));
  const state: LinksState = mergeLinkState({ baseline: BASE, links: {} }, runs(() => 'OK'), '2026-11-01', true);
  it('reports problems and leads that are new, not ones already known', () => {
    const known = { ...state.links, 1: { cls: 'DEAD' as const, date: '2026-11-01', url: 'http://s1.example' } };
    const now = runs((id) => (id <= 2 ? 'DEAD' : id === 3 ? 'PARKED' : id === 4 ? 'MOVED' : id === 5 ? 'POSSIBLE_TAKEOVER' : 'OK'));
    expect(newLinkProblems(known, now).map((r) => r.id)).toEqual([2, 3]); expect(newLinkLeads(known, now).map((r) => r.id)).toEqual([5]);
    expect(newLinkProblems(known, [{ id: 1, url: 'http://new-address.example', cls: 'DEAD', note: '' }])).toHaveLength(1);   // a changed link is a new observation
  });
  it('too many new problems, too many unobservable or a short read is a failed run that changes no state', () => {
    expect(linkVerdict(state, runs((id) => (id <= 15 ? 'DEAD' : 'OK'))).valid).toBe(true);
    const bad = runs((id) => (id <= 16 ? 'PARKED' : 'OK'));
    expect(linkVerdict(state, bad)).toEqual({ valid: false, code: 'floor-new-problems', why: '16 of 100 links turned into problems in one run' }); expect(mergeLinkState(state, bad, '2026-12-01', false)).toBe(state);
    expect(linkVerdict(state, runs((id) => (id <= 31 ? 'COULD_NOT_OBSERVE' : 'OK'))).code).toBe('unreadable');
    expect(linkVerdict(state, runs(() => 'OK', 79)).code).toBe('coverage'); expect(linkVerdict(state, []).code).toBe('empty');
    const fresh: LinkRun[] = Array.from({ length: 20 }, (_, i) => ({ id: 1000 + i, url: `http://n${i}.example`, cls: i < 4 ? 'DEAD' : 'OK', note: '' }));
    expect(linkVerdict(state, [...runs(() => 'OK'), ...fresh]).code).toBe('floor-new-cohort');
  });
  it('a first run has a floor over every problem class, and never becomes the baseline by itself', () => {
    const none: LinksState = { links: {} };
    for (const cls of ['DEAD', 'PARKED', 'HIJACKED', 'OFF_DOMAIN'] as const) expect(linkVerdict(none, runs((id) => (id <= 16 ? cls : 'OK'))), cls).toMatchObject({ valid: false, code: 'first-run-prevalence' });
    const quiet = linkVerdict(none, runs(() => 'OK'));
    expect(quiet).toMatchObject({ valid: false, code: 'no-baseline' }); expect(initMayAccept(quiet)).toBe(true);
    expect(initMayAccept(linkVerdict(none, runs(() => 'COULD_NOT_OBSERVE')))).toBe(false); expect(initMayAccept(linkVerdict(none, []))).toBe(false);
  });
  it('a link that could not be observed keeps its last good entry', () => {
    const next = mergeLinkState(state, [{ id: 1, url: 'http://s1.example', cls: 'COULD_NOT_OBSERVE', note: 'server error (HTTP 503)' }, { id: 2, url: 'http://s2.example', cls: 'DEAD', note: '' }], '2026-12-01', true);
    expect(next.links['1']).toEqual(state.links['1']); expect(next.links['2']).toEqual({ cls: 'DEAD', date: '2026-12-01', url: 'http://s2.example' });
  });
});

describe('monthly check: exit code, summary, paths and locks', () => {
  it('exit 0 only when every check observed validly', () => {
    const ok = { ran: true, valid: true, why: '' }, bad = { ran: true, valid: false, why: 'x' };
    expect(exitCode([ok, ok, ok])).toBe(0); expect(exitCode([ok, bad, ok])).toBe(2); expect(exitCode([])).toBe(2); expect(exitCode([{ ran: false, valid: true, why: '' }])).toBe(2);
  });
  it('the summary is one sentence under 300 characters, names no brewery and never says published', () => {
    const s = summaryLine({ date: '2026-12-01', a: { ok: true, confirmed: 229, goneOnce: 2, proposed: 0, unobserved: 2 }, b: { ok: false, newlyClosed: 0, newlyNotFound: 0 }, c: { ok: true, fresh: 7 } });
    expect(s).toBe('Brewery Trip monthly check 2026-12-01: roads 229 confirmed, 2 gone once, 0 proposed for suspension, 2 unobserved; directory FAILED; links 7 new problems.');
    const p = summaryLine({ date: '2026-12-04', a: { ok: true, confirmed: 0, goneOnce: 0, proposed: 1, unobserved: 0 } });
    expect(p).toMatch(/1 proposed for suspension, 0 unobserved\. A proposal is waiting for review\.$/);
    for (const x of [s, p]) { expect(x.length).toBeLessThan(300); expect(x).not.toMatch(/publish/i); }
  });
  it('a path is inside the production directory by its canonical form, and a lock goes stale after 12 hours', () => {
    expect(insideDir('/Users/a/brewerytrip-monthly', '/Users/a/brewerytrip-monthly')).toBe(true); expect(insideDir('/Users/a/brewerytrip-monthly/state', '/Users/a/brewerytrip-monthly')).toBe(true);
    expect(insideDir('/Users/a/brewerytrip-monthly-trial', '/Users/a/brewerytrip-monthly')).toBe(false); expect(insideDir('/tmp/x', '/Users/a/brewerytrip-monthly')).toBe(false);
    expect(lockIsStale('2026-12-01T04:20:00Z', '2026-12-01T16:19:00Z')).toBe(false); expect(lockIsStale('2026-12-01T04:20:00Z', '2026-12-01T16:20:00Z')).toBe(true); expect(lockIsStale('not a date', '2026-12-01T16:20:00Z')).toBe(true);
  });
});

describe('monthly check: what the programs may do', () => {
  const root = join(__dirname, '../..'), read = (f: string) => readFileSync(join(root, f), 'utf8');
  const code = ['scripts/lib/monthly-run.mjs', 'scripts/monthly-check.mjs', 'scripts/monthly-check-drill.mjs', 'scripts/ops/monthly-check.sh', 'scripts/ops/com.brewerytrip.monthly-check.plist'].map(read).join('\n');
  it('version 1 cannot publish: no commit, no push, no autopublish switch, and one read-only statement', () => {
    expect(code).not.toMatch(/MONTHLY_AUTOPUBLISH/); expect(code).not.toMatch(/'push'|git push|'commit'|git commit|wrangler', 'deploy|wrangler deploy/);
    const run = read('scripts/lib/monthly-run.mjs');
    expect(run).toContain("'BreweryTripBot/1.0 (+https://brewerytrip.com/about)'");
    expect(run).not.toMatch(/\b(UPDATE|INSERT|DELETE|ALTER|DROP)\b\s+\w/);                           // no statement that writes to the database
    expect(run.match(/'d1', 'execute'/g)).toHaveLength(1); expect(run).toContain("'SELECT id, name, street, city, state, latitude, longitude, website_url FROM breweries WHERE closed_at IS NULL ORDER BY id'");
    expect(run).not.toMatch(/console\.log\([^)]*\bkey\b/);
    // every file it writes is under its data directory or its throwaway worktree: nothing is written by a path from the checkout root
    expect(run).not.toMatch(/write(File|Json)Sync?\(\s*join\(root/); expect(run).toContain("git('worktree', 'add', '--detach', wt, base)");
    expect(read('docs/monthly-check.md')).not.toMatch(/MONTHLY_AUTOPUBLISH|autopublish/i);
  });
  it('the launchd job runs on the 1st and the 4th at 04:20, and the wrapper locks before it pulls', () => {
    const plist = read('scripts/ops/com.brewerytrip.monthly-check.plist');
    expect(plist.match(/<key>Day<\/key><integer>(\d+)<\/integer><key>Hour<\/key><integer>4<\/integer><key>Minute<\/key><integer>20<\/integer>/g)).toHaveLength(2);
    expect(plist).toContain('<key>Day</key><integer>1</integer>'); expect(plist).toContain('<key>Day</key><integer>4</integer>');
    const sh = read('scripts/ops/monthly-check.sh');
    expect(sh.indexOf('mkdir "$LOCK"')).toBeGreaterThan(0); expect(sh.indexOf('mkdir "$LOCK"')).toBeLessThan(sh.indexOf('git pull'));
    expect(sh).toContain("trap 'rm -rf \"$LOCK\"' EXIT"); expect(sh).not.toMatch(/rm -rf "\$LOCK"[^']/);            // the lock is released only by the run that took it
  });
});

// The two entry points, run for real against a throwaway home directory. No network: each case stops before any
// request, or runs --init-baseline, which fetches nothing.
describe('monthly check: the entry points keep drills and production apart', () => {
  const root = join(__dirname, '../..');
  const home = mkdtempSync(join(tmpdir(), 'monthly-test-home-')), prod = join(home, 'brewerytrip-monthly');
  const node = (script: string, args: string[], env: Record<string, string> = {}) => { const r = spawnSync(process.execPath, [join(root, 'scripts', script), ...args], { cwd: root, encoding: 'utf8', env: { PATH: process.env.PATH ?? '', HOME: home, ...env }, timeout: 60000 }); return { code: r.status, out: `${r.stdout}${r.stderr}` }; };
  it('a drill refuses the production directory, by any spelling, and the checkout', () => {
    mkdirSync(prod, { recursive: true }); symlinkSync(prod, join(home, 'alias'));
    for (const dir of [prod, join(prod, 'trial'), join(home, 'alias'), join(home, 'alias', 'x'), home, join(home, 'brewerytrip-monthly', '..', 'brewerytrip-monthly')]) {
      const r = node('monthly-check-drill.mjs', ['--data-dir', dir, '--only', 'a']);
      expect(r.code, dir).toBe(2); expect(r.out, dir).toContain('a drill may not use the production data directory');
    }
    expect(node('monthly-check-drill.mjs', ['--data-dir', join(root, 'data/monthly-trial'), '--only', 'a']).out).toContain('a drill may not keep its files inside the checkout');
    expect(existsSync(join(root, 'data/monthly-trial'))).toBe(false);
    expect(node('monthly-check-drill.mjs', ['--only', 'a']).out).toContain('a drill needs --data-dir');
    expect(readdirSync(prod)).toEqual([]);                             // nothing was written there
  });
  it('the production run takes no samples, no other directory and no pretended observations', () => {
    for (const args of [['--sample-b', '5'], ['--sample-c', '5'], ['--data-dir', join(home, 'other')], ['--pretend-gone', 'us-422/130'], ['--accept-baseline']]) {
      const r = node('monthly-check.mjs', args); expect(r.code, args[0]).toBe(2); expect(r.out, args[0]).toContain(`${args[0]} is not an option of the production run`);
    }
  });
  it('the production run refuses state written by a drill, and a drill refuses production state', () => {
    const trial = join(home, 'trial');
    mkdirSync(join(prod, 'state'), { recursive: true }); writeFileSync(join(prod, 'state', 'roads.json'), JSON.stringify({ drill: true, stops: {} }));
    const r = node('monthly-check.mjs', ['--only', 'a']);
    expect(r.code).toBe(2); expect(r.out).toContain('was written by a drill. A production run does not read drill state');
    mkdirSync(join(trial, 'state'), { recursive: true }); writeFileSync(join(trial, 'state', 'roads.json'), JSON.stringify({ stops: {} }));
    expect(node('monthly-check-drill.mjs', ['--data-dir', trial, '--only', 'a']).out).toContain('was not written by a drill');
    writeFileSync(join(prod, 'state', 'roads.json'), JSON.stringify({ stops: {} }));
  });
  it('missing or unreadable state that is known to have existed is a hard stop, never a new baseline', () => {
    writeFileSync(join(prod, 'state', 'INITIALISED.json'), JSON.stringify({ links: { date: '2026-11-01' } }));
    const missing = node('monthly-check.mjs', ['--only', 'a']);
    expect(missing.code).toBe(2); expect(missing.out).toContain('the links state'); expect(missing.out).toContain('is missing, though it was initialised on 2026-11-01'); expect(missing.out).toContain('a new baseline is never started silently');
    writeFileSync(join(prod, 'state', 'links.json'), '{ "links": { "1": ');
    expect(node('monthly-check.mjs', ['--only', 'a']).out).toContain('cannot be read. Restore it from');
    expect(existsSync(join(prod, 'lock'))).toBe(false);                // a stopped run does not leave its lock behind
  });
  it('one run at a time: a held lock stops the run, and a stale one is reported and left alone', () => {
    const trial = join(home, 'locked'); mkdirSync(join(trial, 'lock'), { recursive: true });
    writeFileSync(join(trial, 'lock', 'info.json'), JSON.stringify({ pid: 1, started: new Date().toISOString() }));
    const held = node('monthly-check-drill.mjs', ['--data-dir', trial, '--only', 'a']);
    expect(held.code).toBe(2); expect(held.out).toContain('another run holds the lock');
    writeFileSync(join(trial, 'lock', 'info.json'), JSON.stringify({ pid: 1, started: '2026-01-01T00:00:00.000Z' }));
    const stale = node('monthly-check-drill.mjs', ['--data-dir', trial, '--only', 'a']);
    expect(stale.code).toBe(2); expect(stale.out).toContain('more than 12 hours old and was not removed'); expect(existsSync(join(trial, 'lock', 'info.json'))).toBe(true);
  });
  it('a baseline is initialised once, from a reviewed observations file, and only the prevalence floor is set aside', () => {
    const trial = join(home, 'baseline'), obs = join(trial, 'observations'); mkdirSync(obs, { recursive: true });
    const rows = (bad: number, unseen: number) => Array.from({ length: 100 }, (_, i) => JSON.stringify({ id: i + 1, name: `B${i}`, url: `http://s${i}.example`, cls: i < bad ? 'DEAD' : i < bad + unseen ? 'COULD_NOT_OBSERVE' : 'OK', note: '' })).join('\n') + '\n';
    writeFileSync(join(obs, '2026-12-01-links.jsonl'), rows(20, 5)); writeFileSync(join(obs, '2026-12-02-links.jsonl'), rows(5, 60)); writeFileSync(join(home, 'outside.jsonl'), rows(0, 0));
    const init = (file: string) => node('monthly-check-drill.mjs', ['--data-dir', trial, '--init-baseline', 'c', '--from', file]);
    expect(init(join(obs, '2026-12-02-links.jsonl')).out).toContain('these observations cannot be a baseline: 60 of 100 links could not be observed');   // not a prevalence failure: refused
    expect(init(join(home, 'outside.jsonl')).out).toContain('the observations file must be one this data directory holds');
    expect(existsSync(join(trial, 'state', 'links.json'))).toBe(false);
    const done = init(join(obs, '2026-12-01-links.jsonl'));
    expect(done.code).toBe(0); expect(done.out).toContain('set aside: 20 of 95 links came back as problems');
    const state = JSON.parse(readFileSync(join(trial, 'state', 'links.json'), 'utf8'));
    expect(state.drill).toBe(true); expect(state.baseline).toMatchObject({ listings: 100, counts: { DEAD: 20, COULD_NOT_OBSERVE: 5, OK: 75 } });
    expect(state.baseline.hash).toMatch(/^[0-9a-f]{64}$/); expect(state.baseline.by).toMatch(/@/); expect(state.baseline.file).toContain('2026-12-01-links.jsonl');
    expect(Object.keys(state.links)).toHaveLength(95); expect(state.links['1']).toEqual({ cls: 'DEAD', date: '2026-12-01', url: 'http://s0.example' });
    expect(JSON.parse(readFileSync(join(trial, 'state', 'INITIALISED.json'), 'utf8')).links).toBeTruthy();
    expect(init(join(obs, '2026-12-01-links.jsonl')).out).toContain('already has state: a baseline is initialised once');
    expect(readdirSync(join(trial, 'state')).filter((f) => f.includes('.tmp-'))).toEqual([]);          // written by rename: no half-written file left
  });
});
