import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  classifyStop, pageHealth, isParked, floorTripped, applyRoadRun, pendingKeys, suspensionsByRoad, stopStateKey,
  parseMapsStatus, directoryChanges, directoryRunValid, mergeDirectoryState,
  classifyLink, newLinkProblems, linkRunValid, mergeLinkState,
  publishDecision, exitCode, summaryLine,
  MIN_REAL_TEXT, SANITY_FLOOR, CONFIRM_AFTER_HOURS, STATUS_REQUEST_CAP, PLAIN_NO_HOURS, PLAIN_NO_SITE, PLAIN_PARKED, PLAIN_NO_NOTICE,
  type Observation, type RoadsState, type StopRun, type LinkRun,
} from '../../src/lib/monthly-check';

const HOURS = 'Mon 3-9 Tue 3-9';
const long = (extra = '') => `${'A brewery page with a good deal of real text on it. '.repeat(15)}${extra}`;
const page = (o: Partial<Extract<Observation, { kind: 'page' }>> = {}): Observation => ({ kind: 'page', status: 200, text: long(), meta: '', title: 'Fixture Brewing', finalUrl: 'https://fixture.example/', ...o });
const gone: Observation = { kind: 'no-such-domain' }, timeout: Observation = { kind: 'error', why: 'timed out' };

describe('monthly check A: classifying a road stop', () => {
  const stop = (evidencePage: Observation, evidenceFound: boolean, more: Partial<Parameters<typeof classifyStop>[0]> = {}) => classifyStop({ evidencePage, evidenceFound, address: null, ...more });
  it('CONFIRMED needs the evidence, and the address when there is one', () => {
    expect(stop(page(), true).status).toBe('CONFIRMED');
    expect(stop(page(), true, { address: { page: page(), found: true } }).status).toBe('CONFIRMED');
    expect(stop(page({ text: 'short' }), true).status).toBe('CONFIRMED');           // found is found, however short the page
  });
  it('GONE needs a healthy page: HTTP 200, real content, and the evidence not on it', () => {
    expect(long().length).toBeGreaterThan(MIN_REAL_TEXT);
    expect(stop(page(), false)).toEqual({ status: 'GONE', reason: 'the cited page loaded normally and the evidence text is not on it', plain: PLAIN_NO_HOURS });
    expect(stop(page(), false, { evidenceKind: 'notice' }).plain).toBe(PLAIN_NO_NOTICE);
    // Everything short of a healthy page concludes nothing.
    const unhealthy: Observation[] = [timeout, { kind: 'error', why: 'network error (ECONNRESET)' }, page({ status: 403 }), page({ status: 429 }), page({ status: 500 }), page({ status: 503 }), page({ status: 404 }),
      page({ text: 'Loading...' }), page({ text: '' }), page({ title: 'Just a moment...' }), page({ title: 'Attention Required! | Cloudflare' }), page({ title: 'Page not found' }), page({ title: '404' }),
      page({ text: `Verify you are human ${long()}` })];
    for (const o of unhealthy) { const r = stop(o, false); expect(r.status, JSON.stringify(o).slice(0, 80)).toBe('COULD_NOT_OBSERVE'); expect(r.plain).toBeUndefined(); expect(pageHealth(o).healthy).toBe(false); }
    expect(pageHealth(page()).healthy).toBe(true);
    // A found flag on a page that did not load normally is not trusted either.
    expect(stop(page({ status: 500 }), true).status).toBe('COULD_NOT_OBSERVE'); expect(stop(timeout, true).status).toBe('COULD_NOT_OBSERVE');
  });
  it('GONE also when the domain no longer exists, or is parked', () => {
    expect(stop(gone, false)).toMatchObject({ status: 'GONE', plain: PLAIN_NO_SITE });
    const parked = page({ title: 'fixturebrewing.com is for sale | HugeDomains', text: 'Buy this domain.' });
    expect(isParked(parked)).toBe(true); expect(stop(parked, false)).toMatchObject({ status: 'GONE', plain: PLAIN_PARKED });
    expect(isParked(page({ finalUrl: 'https://www.hugedomains.com/domain_profile.cfm?d=fixture.com' }))).toBe(true);
    expect(isParked(page())).toBe(false); expect(isParked(page({ status: 404, title: 'domain for sale' }))).toBe(false);
  });
  it('a page a person had to read in a browser is never GONE on this script\'s reading', () => {
    const r = stop(page({ text: '' }), false, { browserChecked: '2026-11-22' });
    expect(r.status).toBe('COULD_NOT_OBSERVE'); expect(r.reason).toContain('a person read this page in a browser on 2026-11-22');
    expect(stop(page(), false, { browserChecked: '2026-11-22' }).status).toBe('COULD_NOT_OBSERVE');     // even a page with text: the script never could read its hours
    expect(stop(gone, false, { browserChecked: '2026-11-22' }).status).toBe('GONE');                    // but a domain that no longer exists is gone for anyone
  });
  it('an address that can no longer be found is flagged for a person, and concludes nothing', () => {
    expect(stop(page(), true, { address: { page: page(), found: false } })).toMatchObject({ status: 'COULD_NOT_OBSERVE', flag: 'address' });
    const r = stop(page(), true, { address: { page: timeout, found: false } });
    expect(r.status).toBe('COULD_NOT_OBSERVE'); expect(r.flag).toBeUndefined(); expect(r.reason).toContain('timed out');
  });
});

describe('monthly check: the sanity floor', () => {
  it('more than 15% bad in one run is a broken run', () => {
    expect(SANITY_FLOOR).toBe(0.15);
    expect(floorTripped(15, 100)).toBe(false); expect(floorTripped(16, 100)).toBe(true);
    expect(floorTripped(12, 79)).toBe(true); expect(floorTripped(11, 79)).toBe(false);
    expect(floorTripped(0, 0)).toBe(false); expect(floorTripped(2, 79)).toBe(false);      // a confirm pass over two stops, measured against the road
  });
});

describe('monthly check A: state, and suspension only on a repeated valid observation', () => {
  const T0 = '2026-12-01T09:20:00.000Z', plus = (h: number) => new Date(Date.parse(T0) + h * 3600000).toISOString();
  const run = (key: string, status: StopRun['status'], plain?: string): StopRun => ({ slug: 'r', key, status, reason: `${status} in test`, ...(plain ? { plain } : {}) });
  const empty: RoadsState = { stops: {} };
  it('a run that could not be believed leaves the state exactly as it was', () => {
    const before: RoadsState = { stops: { 'r/1': { lastConfirmed: '2026-11-01' }, 'r/2': { goneFirst: { at: T0, reason: 'x', plain: PLAIN_NO_HOURS } } } };
    const snapshot = JSON.stringify(before);
    const r = applyRoadRun(before, [run('1', 'GONE'), run('2', 'GONE'), run('3', 'CONFIRMED')], plus(72), false);
    expect(r.state).toBe(before); expect(JSON.stringify(before)).toBe(snapshot); expect(r.suspend).toEqual([]); expect(r.goneOnce).toEqual([]);
  });
  it('a stop that could not be observed keeps its entry and its dates', () => {
    const before: RoadsState = { stops: { 'r/1': { lastConfirmed: '2026-11-01' }, 'r/2': { goneFirst: { at: T0, reason: 'x', plain: PLAIN_NO_HOURS } } } };
    const r = applyRoadRun(before, [run('1', 'COULD_NOT_OBSERVE'), run('2', 'COULD_NOT_OBSERVE'), run('9', 'COULD_NOT_OBSERVE')], plus(96), true);
    expect(r.state.stops).toEqual(before.stops); expect(r.suspend).toEqual([]); expect(r.state.stops['r/9']).toBeUndefined();
  });
  it('CONFIRMED records the day it was last re-confirmed, in state only', () => {
    const r = applyRoadRun(empty, [run('1', 'CONFIRMED')], T0, true);
    expect(r.state.stops['r/1']).toEqual({ lastConfirmed: '2026-12-01' }); expect(empty.stops).toEqual({});
  });
  it('one GONE reading suspends nothing: it is a first sighting', () => {
    const r = applyRoadRun({ stops: { 'r/1': { lastConfirmed: '2026-11-01' } } }, [run('1', 'GONE', PLAIN_NO_HOURS)], T0, true);
    expect(r.suspend).toEqual([]); expect(r.goneOnce.map((x) => x.key)).toEqual(['1']);
    expect(r.state.stops['r/1']).toEqual({ lastConfirmed: '2026-11-01', goneFirst: { at: T0, reason: 'GONE in test', plain: PLAIN_NO_HOURS } });
    expect(pendingKeys(r.state)).toEqual(['r/1']);
  });
  it('a second GONE reading counts only at least 48 hours after the first', () => {
    expect(CONFIRM_AFTER_HOURS).toBe(48);
    const first = applyRoadRun(empty, [run('1', 'GONE', PLAIN_NO_SITE)], T0, true).state;
    for (const h of [0.1, 24, 47.9]) {
      const r = applyRoadRun(first, [run('1', 'GONE', PLAIN_NO_SITE)], plus(h), true);
      expect(r.suspend, `${h} hours`).toEqual([]); expect(r.state.stops['r/1'].goneFirst!.at).toBe(T0);   // the first sighting stands; the clock does not restart
    }
    for (const h of [48, 72, 24 * 31]) {
      const r = applyRoadRun(first, [run('1', 'GONE', PLAIN_NO_SITE)], plus(h), true);
      expect(r.suspend, `${h} hours`).toEqual([{ slug: 'r', key: '1', plain: PLAIN_NO_SITE, firstSeen: T0, confirmed: plus(h) }]);
      expect(pendingKeys(r.state)).toEqual([]);
    }
  });
  it('found again on the confirming pass: the sighting is cleared and nothing is suspended', () => {
    const first = applyRoadRun(empty, [run('1', 'GONE')], T0, true).state;
    const r = applyRoadRun(first, [run('1', 'CONFIRMED')], plus(72), true);
    expect(r.suspend).toEqual([]); expect(r.cleared.map((x) => x.key)).toEqual(['1']); expect(r.state.stops['r/1']).toEqual({ lastConfirmed: '2026-12-04' });
    // and a later GONE starts again from a first sighting
    expect(applyRoadRun(r.state, [run('1', 'GONE')], plus(96), true).suspend).toEqual([]);
  });
  it('unobservable on the confirming pass: still pending, not suspended', () => {
    const first = applyRoadRun(empty, [run('1', 'GONE')], T0, true).state;
    const r = applyRoadRun(first, [run('1', 'COULD_NOT_OBSERVE')], plus(72), true);
    expect(r.suspend).toEqual([]); expect(pendingKeys(r.state)).toEqual(['r/1']);
  });
  it('a stop on two roads is suspended on both from the one record', () => {
    const roads = [
      { slug: 'i-71', stops: [{ key: '130', breweryId: 130, name: 'Goldhorn' }, { key: '51', breweryId: 51, name: 'Other' }] },
      { slug: 'us-422', stops: [{ key: '130', breweryId: 130, name: 'Goldhorn' }] },
      { slug: 'route-66', stops: [{ key: 'a-brewery-town', name: 'A Brewery' }, { key: '130', name: 'Not the same: no directory id' }] },
    ];
    const order = { slug: 'us-422', key: '130', plain: PLAIN_NO_HOURS, firstSeen: T0, confirmed: plus(72) };
    expect(suspensionsByRoad([order], roads).map((x) => [x.slug, x.id])).toEqual([['i-71', 130], ['us-422', 130]]);
    expect(suspensionsByRoad([{ ...order, slug: 'route-66', key: 'a-brewery-town' }], roads).map((x) => [x.slug, x.id])).toEqual([['route-66', 'a-brewery-town']]);
    expect(suspensionsByRoad([order, { ...order, slug: 'i-71' }], roads)).toHaveLength(2);       // seen on both roads: still one record each
    expect(suspensionsByRoad([{ ...order, key: 'nope' }], roads)).toEqual([]);
    expect(stopStateKey('us-422', '130')).toBe('us-422/130');
  });
});

describe('monthly check B: directory status (internal lead)', () => {
  it('reads one status in the form asked for, and nothing else', () => {
    expect(parseMapsStatus('STATUS: OPERATIONAL\nNAME_ON_MAPS: X\nNOTE: open')).toBe('OPERATIONAL');
    expect(parseMapsStatus('STATUS: CLOSED_PERMANENTLY')).toBe('CLOSED_PERMANENTLY'); expect(parseMapsStatus('  STATUS:   NOT_FOUND  ')).toBe('NOT_FOUND');
    for (const bad of ['', 'It is open.', 'STATUS: OPEN', 'STATUS: OPERATIONAL | CLOSED_TEMPORARILY', 'STATUS: OPERATIONAL\nSTATUS: CLOSED_PERMANENTLY', 'The STATUS: OPERATIONAL is likely']) expect(parseMapsStatus(bad), bad).toBeNull();
  });
  const prev = Object.fromEntries(Array.from({ length: 100 }, (_, i) => [String(i + 1), { status: 'OPERATIONAL', date: '2026-11-01' }]));
  const all = (f: (id: number) => 'OPERATIONAL' | 'CLOSED_PERMANENTLY' | 'CLOSED_TEMPORARILY' | 'NOT_FOUND' | null) => Array.from({ length: 100 }, (_, i) => ({ id: i + 1, status: f(i + 1) }));
  it('reports only changes against the last good status', () => {
    const c = directoryChanges({ ...prev, 5: { status: 'CLOSED_TEMPORARILY', date: '2026-11-01' }, 6: { status: 'NOT_FOUND', date: '2026-11-01' } },
      [...all((id) => (id === 1 ? 'CLOSED_PERMANENTLY' : id === 2 ? 'NOT_FOUND' : id === 3 ? null : id === 5 ? 'OPERATIONAL' : id === 6 ? 'NOT_FOUND' : 'OPERATIONAL')), { id: 500, status: 'CLOSED_PERMANENTLY' }]);
    expect(c).toMatchObject({ newlyClosed: [1], newlyNotFound: [2], operationalAgain: [5], unparsed: 1, firstSeen: 1 });
  });
  it('too many closed at once, or too many unreadable answers, is a failed run that changes no state', () => {
    expect(directoryRunValid(prev, all((id) => (id <= 15 ? 'CLOSED_PERMANENTLY' : 'OPERATIONAL'))).valid).toBe(true);
    const many = all((id) => (id <= 16 ? 'CLOSED_PERMANENTLY' : 'OPERATIONAL')), v = directoryRunValid(prev, many);
    expect(v).toEqual({ valid: false, why: '16 of 100 listings turned closed in one run' });
    expect(mergeDirectoryState(prev, many, '2026-12-01', v.valid)).toBe(prev);
    expect(directoryRunValid(prev, all((id) => (id <= 16 ? null : 'OPERATIONAL')))).toEqual({ valid: false, why: '16 of 100 answers could not be read' });
    expect(directoryRunValid({}, all((id) => (id <= 16 ? 'CLOSED_TEMPORARILY' : 'OPERATIONAL'))).valid).toBe(false);   // a first run is held to the same floor
    expect(directoryRunValid({}, []).valid).toBe(false);
    expect(STATUS_REQUEST_CAP).toBe(2000);
  });
  it('a valid run updates only the listings whose answers could be read', () => {
    const next = mergeDirectoryState(prev, [{ id: 1, status: 'CLOSED_PERMANENTLY' }, { id: 2, status: null }], '2026-12-01', true);
    expect(next['1']).toEqual({ status: 'CLOSED_PERMANENTLY', date: '2026-12-01' }); expect(next['2']).toEqual({ status: 'OPERATIONAL', date: '2026-11-01' }); expect(prev['1'].status).toBe('OPERATIONAL');
  });
});

describe('monthly check C: website links', () => {
  const link = (o: Observation, url = 'http://www.fixturebrewing.com', name = 'Fixture Brewing Company') => classifyLink(name, url, o).cls;
  it('classifies what the link shows', () => {
    expect(link(page({ title: 'Fixture Brewing', finalUrl: 'https://www.fixturebrewing.com/' }))).toBe('OK');
    expect(link(gone)).toBe('DEAD'); expect(link(page({ status: 404 }))).toBe('DEAD'); expect(link(page({ status: 500 }))).toBe('DEAD');
    expect(link(page({ title: 'fixturebrewing.com is for sale', text: 'Buy this domain' }))).toBe('PARKED');
    expect(link(page({ title: 'Situs Judi Slot Gacor Maxwin', text: long('slot gacor togel') }))).toBe('HIJACKED');
    expect(link(page({ title: 'Acme Web Design', text: long().replace(/brewery/g, 'studio'), finalUrl: 'https://acme-design.example/' }))).toBe('OFF_DOMAIN');
    expect(link(page({ title: 'Fixture Brewing | Order online', finalUrl: 'https://fixture-brewing.square.site/' }))).toBe('MOVED');
    expect(link(page(), 'https://www.facebook.com/fixturebrewing')).toBe('SOCIAL');
  });
  it('a refusal, a timeout or a page too thin to judge concludes nothing', () => {
    for (const o of [timeout, page({ status: 403 }), page({ status: 429 }), page({ title: 'Just a moment...' }), page({ text: '', title: '', finalUrl: 'https://www.fixturebrewing.com/' }), page({ status: 302 })]) expect(link(o), JSON.stringify(o).slice(0, 60)).toBe('COULD_NOT_OBSERVE');
  });
  const runs = (f: (id: number) => LinkRun['cls'], note = '') => Array.from({ length: 100 }, (_, i): LinkRun => ({ id: i + 1, url: `http://s${i + 1}.example`, cls: f(i + 1), note }));
  const prev = mergeLinkState({}, runs(() => 'OK'), '2026-11-01', true);
  it('reports problems that are new, not ones already known', () => {
    const known = { ...prev, 1: { cls: 'DEAD' as const, date: '2026-11-01', url: 'http://s1.example' } };
    const now = runs((id) => (id <= 2 ? 'DEAD' : id === 3 ? 'PARKED' : id === 4 ? 'MOVED' : 'OK'));
    expect(newLinkProblems(known, now).map((r) => r.id)).toEqual([2, 3]);
    expect(newLinkProblems(known, [{ id: 1, url: 'http://new-address.example', cls: 'DEAD', note: '' }])).toHaveLength(1);   // a changed link is a new observation
  });
  it('too many new problems, or too many unobservable, is a failed run that changes no state', () => {
    expect(linkRunValid(prev, runs((id) => (id <= 15 ? 'DEAD' : 'OK'))).valid).toBe(true);
    const bad = runs((id) => (id <= 16 ? 'DEAD' : 'OK')), v = linkRunValid(prev, bad);
    expect(v).toEqual({ valid: false, why: '16 of 100 links turned into problems in one run' }); expect(mergeLinkState(prev, bad, '2026-12-01', v.valid)).toBe(prev);
    expect(linkRunValid(prev, runs((id) => (id <= 31 ? 'COULD_NOT_OBSERVE' : 'OK'))).valid).toBe(false);
    expect(linkRunValid({}, runs((id) => (id <= 16 ? 'DEAD' : 'OK'), 'the domain does not resolve')).valid).toBe(false);
    expect(linkRunValid({}, []).valid).toBe(false);
  });
  it('a link that could not be observed keeps its last good entry', () => {
    const next = mergeLinkState(prev, [{ id: 1, url: 'http://s1.example', cls: 'COULD_NOT_OBSERVE', note: 'timed out' }, { id: 2, url: 'http://s2.example', cls: 'DEAD', note: '' }], '2026-12-01', true);
    expect(next['1']).toEqual(prev['1']); expect(next['2']).toEqual({ cls: 'DEAD', date: '2026-12-01', url: 'http://s2.example' });
  });
});

describe('monthly check: publishing, exit code and summary', () => {
  const ready = { suspensions: 1, gatesPassed: true, onMain: true, upToDate: true };
  it('autopublish is off unless MONTHLY_AUTOPUBLISH is exactly 1', () => {
    for (const v of [undefined, '', '0', 'true', 'yes', ' 1', '01']) expect(publishDecision({ ...ready, autopublish: v }).decision, String(v)).toBe('propose');
    expect(publishDecision({ ...ready, autopublish: '1' })).toEqual({ decision: 'push', why: '' });
  });
  it('never pushes on a failed check, off main, behind main, or with nothing to publish', () => {
    expect(publishDecision({ ...ready, autopublish: '1', gatesPassed: false }).decision).toBe('blocked');
    expect(publishDecision({ ...ready, autopublish: '1', onMain: false }).decision).toBe('propose');
    expect(publishDecision({ ...ready, autopublish: '1', upToDate: false }).decision).toBe('propose');
    expect(publishDecision({ ...ready, autopublish: '1', suspensions: 0 }).decision).toBe('nothing');
  });
  it('exit 0 only when every check observed validly', () => {
    const ok = { ran: true, valid: true, why: '' }, bad = { ran: true, valid: false, why: 'x' };
    expect(exitCode([ok, ok, ok])).toBe(0); expect(exitCode([ok, bad, ok])).toBe(2); expect(exitCode([])).toBe(2); expect(exitCode([{ ran: false, valid: true, why: '' }])).toBe(2);
  });
  it('the summary is one sentence under 300 characters and names no brewery', () => {
    const s = summaryLine({ date: '2026-12-01', a: { ok: true, confirmed: 229, goneOnce: 2, suspended: 0, unobserved: 2 }, b: { ok: false, newlyClosed: 0, newlyNotFound: 0 }, c: { ok: true, fresh: 7 }, published: 'nothing' });
    expect(s).toBe('Brewery Trip monthly check 2026-12-01: roads 229 confirmed, 2 gone once, 0 to suspend, 2 unobserved; directory FAILED; links 7 new problems.');
    expect(s.length).toBeLessThan(300);
    expect(summaryLine({ date: '2026-12-04', a: { ok: true, confirmed: 0, goneOnce: 0, suspended: 1, unobserved: 0 }, published: 'propose' })).toMatch(/Suspension proposed, not published\.$/);
  });
});

describe('monthly check: what is in the repository', () => {
  const root = join(__dirname, '../..'), read = (f: string) => readFileSync(join(root, f), 'utf8');
  it('the directory-status detail is kept out of git, and the job only reads', () => {
    expect(read('.gitignore')).toContain('data/monthly/internal/');
    const script = read('scripts/monthly-check.mjs');
    expect(script).toContain("'BreweryTripBot/1.0 (+https://brewerytrip.com/about)'");
    expect(script).not.toMatch(/\b(UPDATE|INSERT|DELETE|ALTER|DROP)\b\s+\w/);                       // no statement that writes to the database
    expect(script.match(/'d1', 'execute'/g)).toHaveLength(1); expect(script).toContain("'SELECT id, name, street, city, state, latitude, longitude, website_url FROM breweries WHERE closed_at IS NULL ORDER BY id'");
    expect(script).not.toMatch(/console\.log\([^)]*key\b/); expect(script).not.toMatch(/wrangler', 'deploy|r2 /);
  });
  it('the launchd job runs on the 1st and the 4th at 04:20, with autopublish off', () => {
    const plist = read('scripts/ops/com.brewerytrip.monthly-check.plist');
    expect(plist.match(/<key>Day<\/key><integer>(\d+)<\/integer><key>Hour<\/key><integer>4<\/integer><key>Minute<\/key><integer>20<\/integer>/g)).toHaveLength(2);
    expect(plist).toContain('<key>Day</key><integer>1</integer>'); expect(plist).toContain('<key>Day</key><integer>4</integer>');
    expect(plist.replace(/<!--[\s\S]*?-->/, '')).not.toContain('MONTHLY_AUTOPUBLISH');
    expect(read('scripts/ops/monthly-check.sh')).not.toMatch(/^\s*(export\s+)?MONTHLY_AUTOPUBLISH=/m);
  });
});
