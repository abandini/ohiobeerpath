// The monthly re-check: the rules, with no network, files or clock in them (scripts/lib/monthly-run.mjs does the
// reading and writing). Import-free and written in erasable TypeScript so that Node can load it directly.
//
// Version 1 observes, keeps state and writes a report. It publishes nothing and edits no file in the checkout. When
// a road stop has two valid GONE observations at least 48 hours apart it writes a proposal for a person to review.
//
// The point of the job is valid data, so the rules lean one way:
//  - an observation that failed is never a pass, and never replaces what was last observed well;
//  - a positive match counts only on a page that loaded normally; an absence counts only on a page that is still
//    recognisably the page we read before; anything else is "could not observe";
//  - a run where too much changed at once is treated as our fault (network, parser, an API change) and concludes nothing;
//  - each check is all-or-nothing: a check that is not valid writes no state at all.

// ---------------------------------------------------------------------------------------------------------------------
// What was seen when a page was asked for. `at` is when that reading was made, not when the run began.

export type Observation =
  | { kind: 'page'; at: string; status: number; text: string; meta: string; title: string; finalUrl: string }
  | { kind: 'no-such-domain'; at: string }     // DNS answered "no such name" (NXDOMAIN), while known-good names resolved
  | { kind: 'error'; at: string; why: string }; // a timeout, a refusal, a network error, a page that is not text

/** A page with less text than this cannot show that something is missing from it. */
export const MIN_REAL_TEXT = 500;
/** More than this share GONE, newly closed or newly not found in one run means the run is broken, not the world. */
export const SANITY_FLOOR = 0.15;
/** More than this share that could not be observed means the check did not observe validly. */
export const UNOBSERVED_MAX = 0.15;
/** Links refuse robots more often than cited pages do. */
export const LINKS_UNOBSERVED_MAX = 0.3;
/** A stop is proposed for suspension only on two GONE observations at least this far apart. */
export const CONFIRM_AFTER_HOURS = 48;
/** The most requests one run may make to the status service. */
export const STATUS_REQUEST_CAP = 2000;
/** A run that sees fewer than this share of the listings its baseline saw did not read the whole directory. */
export const COVERAGE_MIN = 0.8;

// Phrases a challenge or refusal page uses. The bare word "captcha" is not one: contact forms on real pages carry it.
const CHALLENGE = /just a moment|attention required|verify (that )?you are (a )?human|(complete|solve|pass) the captcha|captcha challenge|access denied|are you a robot|checking your browser|request blocked|403 forbidden|unusual traffic|enable javascript and cookies/i;
const NOT_FOUND_TITLE = /\b404\b|page (was )?not found|not found\b|page (can(?:no|')t|could not) be found|\berror\b/i;
// A page that is only a gate, a notice or an outage: it says nothing about what the real page holds.
const SHELL = /cookie|consent|are you (over |of )?(21|legal)|legal drinking age|age verification|verify your age|coming soon|under construction|maintenance|account (has been )?suspended|suspendedpage|(site|website|page) (is )?(not|no longer|temporarily) (available|published)|temporarily unavailable|website (is |has )?expired|enable javascript|web server.s default page|default web page/i;
// Positive evidence of a domain seller's or parking page. Outages and maintenance pages are NOT here (see SHELL).
const PARKING = /this domain (name )?(is|may be|might be) for sale|domain (name )?(is )?for sale|buy this domain|make an offer on this domain|this domain is parked|parked (free|domain)|domain parking|hugedomains|sedo\.com|sedoparking|afternic|dan\.com|buydomains|is available for purchase/i;
const PARKING_HOSTS = ['atom.com', 'expireddomains.com', 'maxbranded.com', 'sedo.com', 'dan.com', 'hugedomains.com', 'afternic.com', 'buydomains.com', 'sedoparking.com', 'parkingcrew.net', 'bodis.com'];

const parsed = (u: string): URL | null => { try { return new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(u) ? u : `http://${u}`); } catch { return null; } };
export const hostOfUrl = (u: string): string => parsed(u)?.hostname.toLowerCase() ?? '';
const bareHost = (u: string) => hostOfUrl(u).replace(/^www\./, '');
const pathOfUrl = (u: string) => (parsed(u)?.pathname ?? '').replace(/\/+$/, '').toLowerCase();
/** The last two labels of a host name: enough to tell "the same site" from "another site" for the hosts in this directory. */
export const registrable = (host: string): string => { const p = host.replace(/^www\./, '').split('.'); return p.length >= 2 ? p.slice(-2).join('.') : host; };

/** A domain seller's or parking page: positive markers only. A hosting outage or a maintenance notice is not one. */
export function isParked(o: Observation): boolean {
  if (o.kind !== 'page' || o.status !== 200) return false;
  return PARKING.test(o.title) || (o.text.length < 600 && PARKING.test(o.text)) || PARKING_HOSTS.includes(registrable(hostOfUrl(o.finalUrl)));
}
/** Why a page is only a shell (a challenge, a refusal, an error page, a consent or age gate, an outage notice), or ''. */
export function shellReason(o: Observation): string {
  if (o.kind !== 'page') return '';
  if (CHALLENGE.test(o.title) || CHALLENGE.test(o.text.slice(0, 800)) || (o.text.length < MIN_REAL_TEXT && CHALLENGE.test(o.text))) return 'a challenge or refusal page';
  if (NOT_FOUND_TITLE.test(o.title)) return `an error page (it titles itself "${o.title.slice(0, 60)}")`;
  if (o.text.length < MIN_REAL_TEXT && (SHELL.test(o.text) || SHELL.test(o.title))) return 'a consent, age-gate, maintenance or outage page with almost nothing else on it';
  return '';
}
/** Can a match on this page be believed? Only a page that answered 200 and is not a shell. '' when it can. */
export function presenceProblem(o: Observation): string {
  if (o.kind === 'no-such-domain') return 'the domain does not exist';
  if (o.kind === 'error') return o.why;
  if (o.status !== 200) return `HTTP ${o.status}`;
  return shellReason(o);
}

// ---------------------------------------------------------------------------------------------------------------------
// Check A: road stops

/** What a page looked like when the evidence was last found on it. An absence is only believed on a page that still looks like this. */
export interface PageFingerprint { host: string; path: string; title: string; length: number; before: string; after: string }
const NEIGHBOUR = 60;
const squash = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
/**
 * The fingerprint of a page on which the evidence was just found. `before` and `after` are the text on either side of
 * the evidence (the neighbours of the hours block); they are empty when the evidence could not be located verbatim.
 */
export function fingerprintOf(o: Extract<Observation, { kind: 'page' }>, evidence: string): PageFingerprint {
  const text = squash(o.text), parts = evidence.split(/\s*(?:\.\.\.|…)\s*/).map(squash).filter(Boolean);
  const start = parts.length ? text.indexOf(parts[0]) : -1, lastAt = parts.length ? text.lastIndexOf(parts[parts.length - 1]) : -1;
  const end = lastAt >= 0 ? lastAt + parts[parts.length - 1].length : -1;
  return { host: bareHost(o.finalUrl), path: pathOfUrl(o.finalUrl), title: o.title, length: o.text.length,
    before: start > 0 ? text.slice(Math.max(0, start - NEIGHBOUR), start).trim() : '', after: end > 0 ? text.slice(end, end + NEIGHBOUR).trim() : '' };
}
const words = (s: string) => new Set(s.toLowerCase().match(/[a-z0-9]+/g) ?? []);
/** Shared words over all words: 1 for the same title, 0 for nothing in common. Two empty titles are the same. */
export function titleSimilarity(a: string, b: string): number {
  const x = words(a), y = words(b); if (!x.size && !y.size) return 1;
  let both = 0; for (const w of x) if (y.has(w)) both++;
  return both / (x.size + y.size - both);
}
/** Is this still recognisably the page we read before? '' when it is; otherwise what changed. */
export function pageChanged(fp: PageFingerprint, o: Extract<Observation, { kind: 'page' }>): string {
  if (bareHost(o.finalUrl) !== fp.host) return `it now redirects to ${bareHost(o.finalUrl) || 'another address'}`;
  if (pathOfUrl(o.finalUrl) !== fp.path) return `it now redirects to another page (${pathOfUrl(o.finalUrl) || '/'})`;
  if (titleSimilarity(fp.title, o.title) < 0.5) return 'its title is different';
  if (o.text.length < fp.length * 0.5) return 'it is much shorter than it was';
  if (o.text.length > fp.length * 2) return 'it is much longer than it was';
  const text = squash(o.text), near = [fp.before, fp.after].filter(Boolean);
  if (!near.length) return 'we have no record of the text around the evidence to compare with';
  if (!near.some((n) => text.includes(n))) return 'the text that surrounded the evidence is gone too, so the layout has changed';
  return '';
}

export type StopStatus = 'CONFIRMED' | 'GONE' | 'COULD_NOT_OBSERVE';
export interface StopInput {
  evidencePage: Observation; evidenceFound: boolean; evidenceKind?: string;
  /** null when the stop shows no address. */
  address: { page: Observation; found: boolean } | null;
  /** The date a person read the page in a browser, for a page this script cannot read. */
  browserChecked?: string;
  /** The page as it was when the evidence was last found on it by this job; without one, no absence is believed. */
  fingerprint?: PageFingerprint;
}
export interface StopResult { status: StopStatus; reason: string; /** for GONE: the narrow fact, in plain words fit for a page */ plain?: string; /** something a person should look at though nothing is concluded */ flag?: 'address' | 'page-changed' }
export const PLAIN_NO_HOURS = 'the visiting-hours evidence we cited was not found on the cited page', PLAIN_NO_NOTICE = 'the notice we cited was not found on the cited page',
  PLAIN_NO_DOMAIN = 'the domain name of the cited page no longer exists', PLAIN_PARKED = 'the cited address shows a domain-for-sale or parking page';

/**
 * CONFIRMED: the operating evidence, and the address when there is one, were found again, each on a page that
 * answered 200 and is not a shell. GONE: the evidence is absent from a page that loaded normally with real content
 * and is still recognisably the page it was last found on; or the domain no longer exists; or the address shows a
 * domain seller's page. Everything else is COULD_NOT_OBSERVE and concludes nothing.
 */
export function classifyStop(i: StopInput): StopResult {
  const e = i.evidencePage;
  if (e.kind === 'no-such-domain') return { status: 'GONE', reason: 'DNS says the domain of the cited page does not exist', plain: PLAIN_NO_DOMAIN };
  if (isParked(e)) return { status: 'GONE', reason: 'the cited address shows a domain-for-sale or parking page', plain: PLAIN_PARKED };
  const bad = presenceProblem(e);
  if (!bad && i.evidenceFound) {
    if (!i.address) return { status: 'CONFIRMED', reason: 'evidence found' };
    const a = presenceProblem(i.address.page);
    if (a) return { status: 'COULD_NOT_OBSERVE', reason: `the evidence is still there, but the address page could not be read (${a})` };
    if (i.address.found) return { status: 'CONFIRMED', reason: 'evidence and address found' };
    return { status: 'COULD_NOT_OBSERVE', reason: 'the evidence is still there, but the address is no longer on the page it was read from', flag: 'address' };
  }
  if (bad) return { status: 'COULD_NOT_OBSERVE', reason: i.evidenceFound ? `matching text was returned, but not by a page that loaded normally (${bad})` : bad };
  if (i.browserChecked) return { status: 'COULD_NOT_OBSERVE', reason: `a person read this page in a browser on ${i.browserChecked}; this script cannot read it` };
  if (e.kind !== 'page' || e.text.length < MIN_REAL_TEXT) return { status: 'COULD_NOT_OBSERVE', reason: 'almost no text (script-rendered?)' };
  if (!i.fingerprint) return { status: 'COULD_NOT_OBSERVE', reason: 'the evidence was not found, and this job has no earlier confirmed reading of the page to compare with; a person should look', flag: 'page-changed' };
  const changed = pageChanged(i.fingerprint, e);
  if (changed) return { status: 'COULD_NOT_OBSERVE', reason: `page changed (${changed}); a person should look`, flag: 'page-changed' };
  return { status: 'GONE', reason: 'the cited page is still recognisably the page we read before, and the evidence is not on it', plain: i.evidenceKind === 'notice' ? PLAIN_NO_NOTICE : PLAIN_NO_HOURS };
}

/** True when the share is too large to believe: the run is broken and nothing is concluded from it. */
export const floorTripped = (bad: number, total: number, max: number = SANITY_FLOOR): boolean => total > 0 && bad / total > max;
/** The same for a group seen for the first time, which may be small: under ten, more than two is too many. */
export const cohortFloorTripped = (bad: number, total: number): boolean => (total >= 10 ? floorTripped(bad, total) : bad > 2);

/** A short, stable fingerprint of a string (two 32-bit FNV-1a hashes and the length). Not secret; only for "is it the same". */
export function fingerprintText(s: string): string {
  let a = 0x811c9dc5, b = 0x01000193;
  for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); a = Math.imul(a ^ c, 0x01000193) >>> 0; b = Math.imul(b ^ (c + i), 0x811c9dc5) >>> 0; }
  return `${a.toString(16).padStart(8, '0')}${b.toString(16).padStart(8, '0')}-${s.length}`;
}
/** What a sighting is bound to: this stop, this source page, this cited text. Change any of them and earlier sightings no longer count. */
export const citeOf = (slug: string, key: string, evidenceUrl: string, evidence: string) => fingerprintText(`${slug}\n${key}\n${evidenceUrl}\n${evidence}`);

export interface GoneRecord { at: string; reason: string; plain: string; /** where the fetched text of that reading was kept */ kept?: string }
export interface StopState { cite: string; confirmedAt?: string; page?: PageFingerprint; gone?: GoneRecord[] }
export interface RoadsState { stops: Record<string, StopState> }
export interface StopRun { slug: string; key: string; cite: string; at: string; status: StopStatus; reason: string; plain?: string; page?: PageFingerprint; kept?: string }
export interface Eligible { slug: string; key: string; plain: string; firstSeen: string; confirmed: string; records: GoneRecord[] }
export const stopStateKey = (slug: string, key: string) => `${slug}/${key}`;
const hoursBetween = (a: string, b: string) => (Date.parse(b) - Date.parse(a)) / 3600000;

/**
 * What one run of check A does to the state, and which stops it makes eligible for a suspension proposal.
 * All or nothing: when the check is not valid (any road failed) the state is returned untouched and nothing is eligible.
 * In a valid run, by each observation's own timestamp:
 *  - CONFIRMED records when, and what the page looked like, and clears earlier GONE sightings;
 *  - GONE adds a sighting record; with a first record at least 48 hours older than this one, the stop is eligible.
 *    It stays eligible, and is proposed again, for as long as it keeps being observed GONE and nobody has acted;
 *  - COULD_NOT_OBSERVE leaves the entry exactly as it was;
 *  - a stop whose citation changed (another page, other evidence) starts again from nothing.
 */
export function applyRoadsRun(state: RoadsState, runs: StopRun[], valid: boolean): { state: RoadsState; eligible: Eligible[]; goneOnce: StopRun[]; cleared: StopRun[] } {
  if (!valid) return { state, eligible: [], goneOnce: [], cleared: [] };
  const stops = { ...state.stops }, eligible: Eligible[] = [], goneOnce: StopRun[] = [], cleared: StopRun[] = [];
  for (const r of runs) {
    const k = stopStateKey(r.slug, r.key), old = stops[k], was: StopState = old && old.cite === r.cite ? old : { cite: r.cite };
    if (r.status === 'CONFIRMED') { if (was.gone?.length) cleared.push(r); stops[k] = { cite: r.cite, confirmedAt: r.at, page: r.page ?? was.page }; }
    else if (r.status === 'GONE') {
      const record: GoneRecord = { at: r.at, reason: r.reason, plain: r.plain ?? PLAIN_NO_HOURS, ...(r.kept ? { kept: r.kept } : {}) };
      const earlier = (was.gone ?? []).filter((g) => g.at !== r.at);     // two records are two distinct observations
      const gone = [...earlier, record].sort((x, y) => Date.parse(x.at) - Date.parse(y.at));
      stops[k] = { ...was, gone: gone.length > 6 ? [gone[0], ...gone.slice(-5)] : gone };
      if (gone.length >= 2 && hoursBetween(gone[0].at, r.at) >= CONFIRM_AFTER_HOURS) eligible.push({ slug: r.slug, key: r.key, plain: record.plain, firstSeen: gone[0].at, confirmed: r.at, records: gone });
      else goneOnce.push(r);
    }
  }
  return { state: { ...state, stops }, eligible, goneOnce, cleared };
}
/** The stops a confirming pass must re-read: every stop with a GONE sighting on record, eligible ones included. */
export const pendingKeys = (state: RoadsState): string[] => Object.entries(state.stops).filter(([, v]) => (v.gone?.length ?? 0) > 0).map(([k]) => k);

/**
 * One brewery, one record: a stop to suspend is suspended on every road that lists the same directory listing. `id`
 * is what data/roads/<slug>/suspended.json is keyed by (the directory id, or the key on a road of stand-alone stops).
 */
export function suspensionsByRoad(orders: Eligible[], roads: { slug: string; stops: { key: string; breweryId?: number; name: string }[] }[]): { slug: string; id: number | string; name: string; order: Eligible }[] {
  const out: { slug: string; id: number | string; name: string; order: Eligible }[] = [], seen = new Set<string>();
  for (const o of orders) {
    const stop = roads.find((r) => r.slug === o.slug)?.stops.find((s) => s.key === o.key);
    if (!stop) continue;
    for (const road of roads) for (const s of road.stops) {
      const same = stop.breweryId !== undefined ? s.breweryId === stop.breweryId : road.slug === o.slug && s.key === o.key;
      const id = s.breweryId ?? s.key, tag = `${road.slug}/${id}`;
      if (same && !seen.has(tag)) { seen.add(tag); out.push({ slug: road.slug, id, name: s.name, order: o }); }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------------------
// Baselines. Checks B and C compare with a baseline that a person initialised once from observations they reviewed.

export interface Baseline { date: string; by: string; file: string; hash: string; listings: number; counts: Record<string, number> }
export interface Verdict { valid: boolean; code: '' | 'empty' | 'unreadable' | 'coverage' | 'no-baseline' | 'first-run-prevalence' | 'floor-closed' | 'floor-not-found' | 'floor-new-problems' | 'floor-new-cohort'; why: string }
const OK: Verdict = { valid: true, code: '', why: '' };
const no = (code: Verdict['code'], why: string): Verdict => ({ valid: false, code, why });
/** The only failure `--init-baseline` may set aside: how common closures or problems are on a first run. Never anything about how well we observed. */
export const initMayAccept = (v: Verdict): boolean => v.valid || v.code === 'no-baseline' || v.code === 'first-run-prevalence';

// ---------------------------------------------------------------------------------------------------------------------
// Check B: directory status (an internal lead; nothing here is ever published)

export type MapsStatus = 'OPERATIONAL' | 'CLOSED_TEMPORARILY' | 'CLOSED_PERMANENTLY' | 'NOT_FOUND';
const MAPS: MapsStatus[] = ['OPERATIONAL', 'CLOSED_TEMPORARILY', 'CLOSED_PERMANENTLY', 'NOT_FOUND'];
/** The status in an answer of the form we ask for, or null when the answer does not say one and only one. */
export function parseMapsStatus(answer: string): MapsStatus | null {
  const m = [...String(answer ?? '').matchAll(/^\s*STATUS:\s*([A-Z_]+)\s*$/gm)].map((x) => x[1]);
  return m.length === 1 && (MAPS as string[]).includes(m[0]) ? (m[0] as MapsStatus) : null;
}
const field = (answer: string, name: string) => { const m = [...answer.matchAll(new RegExp(`^\\s*${name}:\\s*(.*?)\\s*$`, 'gm'))]; return m.length === 1 ? m[0][1] : ''; };
const NAME_NOISE = new Set(['the', 'and', 'of', 'at', 'co', 'company', 'inc', 'llc', 'brewing', 'brewery', 'brewpub', 'brewhouse', 'brew', 'beer', 'works', 'craft', 'taproom', 'tap', 'room', 'house', 'pub', 'bar', 'grill', 'restaurant', 'kitchen', 'ales', 'ale', 'a', 'on']);
const nameWords = (n: string) => (n.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' and ').match(/[a-z0-9]+/g) ?? []).filter((w) => !NAME_NOISE.has(w));
/**
 * Is the name the service returned a reasonable match for the listing's name? The distinctive words of the shorter
 * name must all be in the longer one (so "Great Lakes Brewing Co" is "Great Lakes Brewing Company", and a second
 * branch name is tolerated), or the names are the same run together. Names with no distinctive word never match.
 */
export function nameMatches(listing: string, returned: string): boolean {
  const a = nameWords(listing), b = nameWords(returned);
  if (!a.length || !b.length) return false;
  const [short, long] = a.length <= b.length ? [a, new Set(b)] : [b, new Set(a)];
  return short.every((w) => long.has(w)) || a.join('') === b.join('');
}
export type DirectoryOutcome = 'STATUS' | 'OTHER_BUSINESS_AT_ADDRESS' | 'UNOBSERVABLE';
export interface MapsJudgement { outcome: DirectoryOutcome; status: MapsStatus | null; nameOnMaps: string; addressOnMaps: string; source: string; why: string }
/**
 * What one answer establishes. A status is accepted only when the response had the shape we expect, carried grounding
 * (at least one Maps source), and named a place that is a reasonable match for the listing. A different business at
 * the address is a lead with both names, not a status. Everything else is unobservable.
 */
export function judgeMapsAnswer(i: { listingName: string; shapeOk: boolean; answer: string; sources: { name: string; url: string }[] }): MapsJudgement {
  const out = (outcome: DirectoryOutcome, status: MapsStatus | null, why: string): MapsJudgement => ({ outcome, status, nameOnMaps: field(i.answer, 'NAME_ON_MAPS'), addressOnMaps: field(i.answer, 'ADDRESS_ON_MAPS'), source: maps[0]?.url ?? '', why });
  const maps = (i.sources ?? []).filter((s) => /(^|\.)google\.[a-z.]+\/maps|maps\.google\.|maps\.app\.goo\.gl|goo\.gl\/maps/i.test(String(s?.url ?? '')));
  if (!i.shapeOk) return out('UNOBSERVABLE', null, 'the response was not in the shape we expect');
  const status = parseMapsStatus(i.answer);
  if (!status) return out('UNOBSERVABLE', null, 'the answer does not state one status in the form asked for');
  if (!maps.length) return out('UNOBSERVABLE', null, 'the answer carries no Maps source: it is not grounded');
  if (status === 'NOT_FOUND') return out('STATUS', status, '');
  const name = field(i.answer, 'NAME_ON_MAPS');
  if (!name || /^n\/?a$/i.test(name)) return out('UNOBSERVABLE', null, 'the answer names no place');
  if (!nameMatches(i.listingName, name)) return out('OTHER_BUSINESS_AT_ADDRESS', null, `the place returned is "${name}", not "${i.listingName}"`);
  return out('STATUS', status, '');
}
export interface ListingState { status: string; date: string }
export interface DirectoryState { baseline?: Baseline; listings: Record<string, ListingState> }
export interface DirectoryRun { id: number; outcome: DirectoryOutcome; status: MapsStatus | null }
export interface Transition { id: number; from: string; to: string }
const isClosed = (s: string | null | undefined) => s === 'CLOSED_PERMANENTLY' || s === 'CLOSED_TEMPORARILY';
/** Every listing whose validated status differs from its last validated status, with both values. */
export const directoryTransitions = (prev: Record<string, ListingState>, runs: DirectoryRun[]): Transition[] =>
  runs.filter((r) => r.outcome === 'STATUS' && r.status && prev[String(r.id)] && prev[String(r.id)].status !== r.status).map((r) => ({ id: r.id, from: prev[String(r.id)].status, to: r.status as string }));
/** The summary counts, derived from the transitions and from nothing else. */
export function transitionCounts(t: Transition[]): { newlyClosed: number; newlyNotFound: number; operationalAgain: number; other: number } {
  const c = { newlyClosed: 0, newlyNotFound: 0, operationalAgain: 0, other: 0 };
  for (const x of t) { if (isClosed(x.to) && !isClosed(x.from)) c.newlyClosed++; else if (x.to === 'NOT_FOUND') c.newlyNotFound++; else if (x.to === 'OPERATIONAL') c.operationalAgain++; else c.other++; }
  return c;
}
/**
 * Is the directory run believable, and may it update the state? Not when answers were unreadable, the directory read
 * was short, there is no baseline, or too much turned closed or not found at once: among listings with a last good
 * status, and separately among listings seen for the first time.
 */
export function directoryVerdict(state: DirectoryState, runs: DirectoryRun[]): Verdict {
  if (!runs.length) return no('empty', 'no listing was asked about');
  const unreadable = runs.filter((r) => r.outcome === 'UNOBSERVABLE').length;
  if (floorTripped(unreadable, runs.length, UNOBSERVED_MAX)) return no('unreadable', `${unreadable} of ${runs.length} answers could not be accepted (not grounded, not in the form asked for, or no answer)`);
  const good = runs.filter((r) => r.outcome === 'STATUS' && r.status), bad = (r: DirectoryRun) => isClosed(r.status) || r.status === 'NOT_FOUND';
  if (!state.baseline) {
    const n = good.filter(bad).length;
    return floorTripped(n, good.length) ? no('first-run-prevalence', `${n} of ${good.length} listings came back closed or not found and there is no baseline to compare with`) : no('no-baseline', 'there is no baseline yet');
  }
  if (runs.length < state.baseline.listings * COVERAGE_MIN) return no('coverage', `only ${runs.length} listings were asked about; the baseline had ${state.baseline.listings}`);
  const known = good.filter((r) => state.listings[String(r.id)]), fresh = good.filter((r) => !state.listings[String(r.id)]);
  const c = transitionCounts(directoryTransitions(state.listings, runs));
  if (floorTripped(c.newlyClosed, known.length)) return no('floor-closed', `${c.newlyClosed} of ${known.length} listings turned closed in one run`);
  if (floorTripped(c.newlyNotFound, known.length)) return no('floor-not-found', `${c.newlyNotFound} of ${known.length} listings turned "not found" in one run`);
  if (cohortFloorTripped(fresh.filter(bad).length, fresh.length)) return no('floor-new-cohort', `${fresh.filter(bad).length} of ${fresh.length} listings seen for the first time came back closed or not found`);
  return OK;
}
/** The state after a run: unchanged unless the run is valid, and unchanged for any listing without an accepted status. */
export function mergeDirectoryState(state: DirectoryState, runs: DirectoryRun[], date: string, valid: boolean): DirectoryState {
  if (!valid) return state;
  const listings = { ...state.listings };
  for (const r of runs) if (r.outcome === 'STATUS' && r.status) listings[String(r.id)] = { status: r.status, date };
  return { ...state, listings };
}

// ---------------------------------------------------------------------------------------------------------------------
// Check C: website links

export type LinkClass = 'OK' | 'MOVED' | 'DEAD' | 'PARKED' | 'HIJACKED' | 'OFF_DOMAIN' | 'POSSIBLE_TAKEOVER' | 'SOCIAL' | 'COULD_NOT_OBSERVE';
/** The established problems. POSSIBLE_TAKEOVER is a lead for review, not one of them. */
export const LINK_PROBLEMS: LinkClass[] = ['DEAD', 'PARKED', 'HIJACKED', 'OFF_DOMAIN'];
const SOCIAL = ['facebook.com', 'instagram.com', 'untappd.com', 'twitter.com', 'x.com', 'linktr.ee', 'yelp.com', 'tiktok.com', 'youtube.com', 'linkedin.com', 'tripadvisor.com'];
export const isSocialUrl = (u: string): boolean => { const h = hostOfUrl(u); return SOCIAL.some((s) => h === s || h.endsWith(`.${s}`)); };
const GAMBLING = /slot ?(gacor|online|\d{2,3}|88)|\bslot\b.*(gacor|rtp|maxwin|pragmatic)|togel|\btoto\b|judi\b|situs (judi|slot|toto|togel)|gacor|maxwin|rtp live|pragmatic play|bandar|bocoran|keluaran|pengeluaran|\bcasino\b|kasino|sweepstakes|sportsbook|\bbetting\b|bet88|\d+bet\b|sbobet/gi;
const ADULT = /porn|xxx|escort|adult video|sex cam|viagra|cialis|payday loan|buy cheap|replica watches/i;
const BREWISH = /brew|beer|ale\b|ales\b|lager|pub\b|taproom|tap room|tavern|cider|distill|winery|wine|ipa\b|hops?\b|stout|restaurant|bar\b|grill|brasserie|biergarten|meadery|mead\b/i;

/**
 * What a listing's website link shows. DEAD: the domain does not exist, or the page answers 404 or 410. PARKED: a
 * domain seller's page. HIJACKED: gambling or adult content AND the brewery's name gone from title and body.
 * POSSIBLE_TAKEOVER: such content with the name still there (a lead to review). OFF_DOMAIN: it redirects to another
 * site that does not name the brewery. MOVED: it redirects to another site that does. A refusal, a challenge, a
 * server error (5xx), a timeout or a page too thin to judge is COULD_NOT_OBSERVE.
 */
export function classifyLink(name: string, listedUrl: string, o: Observation): { cls: LinkClass; note: string } {
  if (isSocialUrl(listedUrl)) return { cls: 'SOCIAL', note: 'a social page; not fetched' };
  if (o.kind === 'no-such-domain') return { cls: 'DEAD', note: 'the domain does not exist' };
  if (o.kind === 'error') return { cls: 'COULD_NOT_OBSERVE', note: o.why };
  if ([401, 403, 429].includes(o.status)) return { cls: 'COULD_NOT_OBSERVE', note: `refused (HTTP ${o.status})` };
  if (o.status >= 500) return { cls: 'COULD_NOT_OBSERVE', note: `server error (HTTP ${o.status})` };
  if (CHALLENGE.test(o.title) || CHALLENGE.test(o.text.slice(0, 800)) || (o.text.length < MIN_REAL_TEXT && CHALLENGE.test(o.text))) return { cls: 'COULD_NOT_OBSERVE', note: 'a challenge or refusal page' };
  if ([404, 410].includes(o.status)) return { cls: 'DEAD', note: `HTTP ${o.status}` };
  if (o.status !== 200) return { cls: 'COULD_NOT_OBSERVE', note: `HTTP ${o.status}` };
  const head = `${o.title} ${o.text.slice(0, 1500)}`, from = hostOfUrl(listedUrl), to = hostOfUrl(o.finalUrl);
  const tokens = nameWords(name), page = `${o.title} ${o.text}`.toLowerCase(), named = tokens.length > 0 && (tokens.some((t) => page.includes(t)) || page.replace(/[^a-z0-9]/g, '').includes(tokens.join('')));
  const keywords = (head.match(GAMBLING) ?? []).length >= 2 || (o.title.match(GAMBLING) ?? []).length > 0 || ADULT.test(o.title);
  if (keywords) return named ? { cls: 'POSSIBLE_TAKEOVER', note: `possible takeover: review. Gambling or adult words on a page that still names the brewery: ${o.title.slice(0, 80)}` } : { cls: 'HIJACKED', note: `gambling or adult content, and the brewery's name is nowhere on the page: ${o.title.slice(0, 80)}` };
  if (isParked(o)) return { cls: 'PARKED', note: `domain for sale or parked: ${o.title.slice(0, 80)}` };
  const match = named || (tokens.length > 0 && tokens.some((t) => to.includes(t)));
  if (registrable(to) !== registrable(from)) return match ? { cls: 'MOVED', note: `now at ${to}` } : o.text.length < 200 ? { cls: 'COULD_NOT_OBSERVE', note: `redirects to ${to}, a page with almost no text` } : { cls: 'OFF_DOMAIN', note: `redirects to ${to}, which does not name the brewery` };
  if (o.text.trim().length < 200) return { cls: 'COULD_NOT_OBSERVE', note: o.text.trim() ? 'too little text to judge' : 'no server-rendered text' };
  if (shellReason(o)) return { cls: 'COULD_NOT_OBSERVE', note: shellReason(o) };
  if (match || BREWISH.test(head)) return { cls: 'OK', note: '' };
  return { cls: 'COULD_NOT_OBSERVE', note: 'could not tell from the page text that this is the brewery' };
}
export interface LinkState { cls: LinkClass; date: string; url: string }
export interface LinksState { baseline?: Baseline; links: Record<string, LinkState> }
export interface LinkRun { id: number; url: string; cls: LinkClass; note: string }
const sameAsBefore = (prev: Record<string, LinkState>, r: LinkRun) => prev[String(r.id)]?.cls === r.cls && prev[String(r.id)]?.url === r.url;
/** Problems that are new: a problem now, on a link that was not that same problem (for that same URL) when last observed well. */
export const newLinkProblems = (prev: Record<string, LinkState>, runs: LinkRun[]): LinkRun[] => runs.filter((r) => LINK_PROBLEMS.includes(r.cls) && !sameAsBefore(prev, r));
/** Leads that are new: possible takeovers not seen as that before. */
export const newLinkLeads = (prev: Record<string, LinkState>, runs: LinkRun[]): LinkRun[] => runs.filter((r) => r.cls === 'POSSIBLE_TAKEOVER' && !sameAsBefore(prev, r));
/** Believable, and may it update the state? The same tests as the directory's, over every problem class. */
export function linkVerdict(state: LinksState, runs: LinkRun[]): Verdict {
  const fetched = runs.filter((r) => r.cls !== 'SOCIAL');
  if (!fetched.length) return no('empty', 'no link was fetched');
  const unobserved = fetched.filter((r) => r.cls === 'COULD_NOT_OBSERVE').length, seen = fetched.filter((r) => r.cls !== 'COULD_NOT_OBSERVE'), problem = (r: LinkRun) => LINK_PROBLEMS.includes(r.cls);
  if (floorTripped(unobserved, fetched.length, LINKS_UNOBSERVED_MAX)) return no('unreadable', `${unobserved} of ${fetched.length} links could not be observed`);
  if (!state.baseline) {
    const n = seen.filter(problem).length;
    return floorTripped(n, seen.length) ? no('first-run-prevalence', `${n} of ${seen.length} links came back as problems and there is no baseline to compare with`) : no('no-baseline', 'there is no baseline yet');
  }
  if (runs.length < state.baseline.listings * COVERAGE_MIN) return no('coverage', `only ${runs.length} links were looked at; the baseline had ${state.baseline.listings}`);
  const known = seen.filter((r) => state.links[String(r.id)]), fresh = seen.filter((r) => !state.links[String(r.id)]);
  const turned = newLinkProblems(state.links, known).length;
  if (floorTripped(turned, known.length)) return no('floor-new-problems', `${turned} of ${known.length} links turned into problems in one run`);
  if (cohortFloorTripped(fresh.filter(problem).length, fresh.length)) return no('floor-new-cohort', `${fresh.filter(problem).length} of ${fresh.length} links seen for the first time came back as problems`);
  return OK;
}
export function mergeLinkState(state: LinksState, runs: LinkRun[], date: string, valid: boolean): LinksState {
  if (!valid) return state;
  const links = { ...state.links };
  for (const r of runs) if (r.cls !== 'COULD_NOT_OBSERVE') links[String(r.id)] = { cls: r.cls, date, url: r.url };
  return { ...state, links };
}

// ---------------------------------------------------------------------------------------------------------------------
// The exit code and the words of the summary

export interface CheckOutcome { ran: boolean; valid: boolean; why: string }
/** Exit 0 only when every check that was asked for observed validly. */
export const exitCode = (checks: CheckOutcome[]): 0 | 2 => (checks.length > 0 && checks.every((c) => c.ran && c.valid) ? 0 : 2);
/** One sentence, under 300 characters, for a text message. Counts only: no brewery is named, and nothing is ever said to be published. */
export function summaryLine(s: { date: string; a?: { ok: boolean; confirmed: number; goneOnce: number; proposed: number; unobserved: number }; b?: { ok: boolean; newlyClosed: number; newlyNotFound: number }; c?: { ok: boolean; fresh: number } }): string {
  const part = (label: string, ok: boolean | undefined, text: string) => (ok === undefined ? '' : ok ? `${label} ${text}` : `${label} FAILED`);
  const out = [
    part('roads', s.a?.ok, `${s.a?.confirmed} confirmed, ${s.a?.goneOnce} gone once, ${s.a?.proposed} proposed for suspension, ${s.a?.unobserved} unobserved`),
    part('directory', s.b?.ok, `${s.b?.newlyClosed} newly closed, ${s.b?.newlyNotFound} newly not found`),
    part('links', s.c?.ok, `${s.c?.fresh} new problems`),
  ].filter(Boolean).join('; ');
  const tail = s.a?.ok && s.a.proposed ? ' A proposal is waiting for review.' : '';
  return `Brewery Trip monthly check ${s.date}: ${out}.${tail}`.slice(0, 299);
}

// ---------------------------------------------------------------------------------------------------------------------
// Where a run may keep its files

/** Is `dir` the production data directory, or inside it? Both must already be canonical (real) paths. */
export const insideDir = (dir: string, parent: string): boolean => dir === parent || dir.startsWith(parent.endsWith('/') ? parent : `${parent}/`);
/** A lock older than this is reported as stale. It is never broken by the job. */
export const STALE_LOCK_HOURS = 12;
export const lockIsStale = (startedIso: string, nowIso: string): boolean => !(hoursBetween(startedIso, nowIso) < STALE_LOCK_HOURS);
