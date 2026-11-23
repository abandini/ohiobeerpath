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
// A page that is only a gate, a notice or an outage says nothing about what the real page holds. Three kinds of signal:
//  - a title that IS a gate, at any page length (a gate can be long, and can even carry the text we are looking for);
//  - a short title that is nothing but a notice ("Coming soon", "Maintenance", "Consent");
//  - structure: the visible text opens with the gate's own question or notice and little follows, or the page is thin
//    and carries a gate phrase. A cookie line on a real page is none of these.
const GATE_TITLE = /age verification|verify your age|age[\s-]?gate|are you (over |of |at least )?(21|legal)|legal drinking age|before you continue|just a moment|attention required|access denied|account (has been )?suspended|site (is )?(under )?maintenance|maintenance mode|cookie consent|privacy consent|temporarily unavailable|service unavailable/i;
const NOTICE_TITLE = /^\W*(coming soon|under construction|maintenance|consent|website expired|site not found|default web page|suspended)\W*$/i;
const GATE_OPENING = /are you (over |of |at least )?(21|legal)|legal drinking age|verify your age|age verification|you must be (21|of legal)|please confirm your age|enter your (date of birth|birthday)|this site is under maintenance|account (has been )?suspended/i;
const THIN_SHELL = /are you (over |of |at least )?(21|legal)|legal drinking age|age verification|verify your age|coming soon|under construction|maintenance|account (has been )?suspended|suspendedpage|(site|website|page) (is )?(not|no longer|temporarily) (available|published)|temporarily unavailable|website (is |has )?expired|enable javascript|web server.s default page|default web page|cookie consent|accept (all )?cookies/i;
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
/** Why a page is only a shell (a challenge, a refusal, an error page, a consent or age gate, an outage notice), or ''. Not a question of length alone. */
export function shellReason(o: Observation): string {
  if (o.kind !== 'page') return '';
  if (CHALLENGE.test(o.title) || CHALLENGE.test(o.text.slice(0, 800)) || (o.text.length < MIN_REAL_TEXT && CHALLENGE.test(o.text))) return 'a challenge or refusal page';
  if (NOT_FOUND_TITLE.test(o.title)) return `an error page (it titles itself "${o.title.slice(0, 60)}")`;
  if (GATE_TITLE.test(o.title) || NOTICE_TITLE.test(o.title)) return `a gate or notice page (it titles itself "${o.title.slice(0, 60)}")`;
  // The text opens with the gate's question and the gate is most of the page.
  if (GATE_OPENING.test(o.text.slice(0, 300)) && o.text.length < 3 * MIN_REAL_TEXT) return 'a page that opens with an age gate or notice and holds little else';
  if (o.text.length < MIN_REAL_TEXT && THIN_SHELL.test(o.text)) return 'a consent, age-gate, maintenance or outage page with almost nothing else on it';
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
  // Could the page be seen at all? That is settled before anything is concluded from it, parking included: a challenge
  // served from a parking company's host is a challenge, not a parking page.
  const bad = presenceProblem(e);
  if (bad) return { status: 'COULD_NOT_OBSERVE', reason: i.evidenceFound ? `matching text was returned, but not by a page that loaded normally (${bad})` : bad };
  if (isParked(e)) return { status: 'GONE', reason: 'the cited address shows a domain-for-sale or parking page', plain: PLAIN_PARKED };
  if (i.evidenceFound) {
    if (!i.address) return { status: 'CONFIRMED', reason: 'evidence found' };
    const a = presenceProblem(i.address.page);
    if (a) return { status: 'COULD_NOT_OBSERVE', reason: `the evidence is still there, but the address page could not be read (${a})` };
    if (i.address.found) return { status: 'CONFIRMED', reason: 'evidence and address found' };
    return { status: 'COULD_NOT_OBSERVE', reason: 'the evidence is still there, but the address is no longer on the page it was read from', flag: 'address' };
  }
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
    const k = stopStateKey(r.slug, r.key), old = stops[k];
    // A changed citation wipes the entry at once, whatever this observation is: old sightings can never count again.
    if (old && old.cite !== r.cite) stops[k] = { cite: r.cite };
    const was: StopState = stops[k] ?? { cite: r.cite };
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

/** The cited source, whatever road cites it: the same page and the same cited text. */
export const sourceOf = (evidenceUrl: string, evidence: string) => fingerprintText(`${evidenceUrl}\n${evidence}`);
export interface RoadStopRef { key: string; breweryId?: number; name: string; source: string }
export interface ProposalItem { slug: string; id: number | string; name: string; order: Eligible; /** why this road's stop is in the proposal */ basis: 'observed' | 'same-citation' }
/**
 * Which stops a proposal may name. An eligible stop is proposed on its own road. The same directory listing on
 * another road is added only when that road cites the very same source (same page, same text: one piece of evidence,
 * and the relationship is recorded) or is itself eligible on its own two observations. If another road cites
 * something else for the brewery and that is not itself eligible (it was confirmed, could not be observed, was seen
 * gone only once, or was not read), nothing is proposed for the brewery: it is an evidence conflict for a person.
 * `id` is what data/roads/<slug>/suspended.json is keyed by (the directory id, or the key on a road of stand-alone stops).
 */
export function proposalItems(orders: Eligible[], roads: { slug: string; stops: RoadStopRef[] }[]): { items: ProposalItem[]; conflicts: { breweryId: number; name: string; why: string }[] } {
  const items: ProposalItem[] = [], conflicts: { breweryId: number; name: string; why: string }[] = [], done = new Set<string>();
  const stopOf = (o: Eligible) => roads.find((r) => r.slug === o.slug)?.stops.find((s) => s.key === o.key);
  for (const o of orders) {
    const stop = stopOf(o); if (!stop) continue;
    if (stop.breweryId === undefined) { const tag = `${o.slug}/${o.key}`; if (!done.has(tag)) { done.add(tag); items.push({ slug: o.slug, id: o.key, name: stop.name, order: o, basis: 'observed' }); } continue; }
    if (done.has(`id:${stop.breweryId}`)) continue;
    done.add(`id:${stop.breweryId}`);
    const mine: ProposalItem[] = []; let conflict = '';
    for (const road of roads) for (const s of road.stops.filter((x) => x.breweryId === stop.breweryId)) {
      const own = orders.find((x) => x.slug === road.slug && x.key === s.key);
      if (own) mine.push({ slug: road.slug, id: stop.breweryId, name: s.name, order: own, basis: 'observed' });
      else if (s.source === stop.source) mine.push({ slug: road.slug, id: stop.breweryId, name: s.name, order: o, basis: 'same-citation' });
      else conflict = `${road.slug} cites a different source for it, and that source is not gone on two observations of its own`;
    }
    if (conflict) conflicts.push({ breweryId: stop.breweryId, name: stop.name, why: conflict }); else items.push(...mine);
  }
  return { items, conflicts };
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
const nameWords = (n: string) => (n.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/&/g, ' and ').match(/[a-z0-9]+/g) ?? []).filter((w) => !NAME_NOISE.has(w));
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
/**
 * Is this a Google Maps address? Parsed, never matched as a substring: https only, and the host and path must be one
 * of the forms listed. The first two are the forms the service's own source annotations use (1,362 kept answers:
 * https://maps.google.com/maps?cid=... and https://www.google.com/maps/...).
 */
export function isMapsUrl(u: string): boolean {
  let x: URL; try { x = new URL(u); } catch { return false; }
  if (x.protocol !== 'https:' || x.username || x.password || x.port) return false;
  const host = x.hostname.toLowerCase(), path = x.pathname, under = (p: string) => path === p || path.startsWith(`${p}/`);
  if (host === 'maps.google.com' || host === 'maps.app.goo.gl') return true;
  if (host === 'google.com' || host === 'www.google.com' || host === 'goo.gl') return under('/maps');
  return false;
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
  const maps = (i.sources ?? []).filter((s) => isMapsUrl(String(s?.url ?? '')));
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
  // Every answer without an accepted status counts, another business at the address included: it validated no status.
  const good = runs.filter((r) => r.outcome === 'STATUS' && r.status), unaccepted = runs.length - good.length;
  if (!good.length) return no('unreadable', `none of the ${runs.length} answers gave an accepted status`);
  if (floorTripped(unaccepted, runs.length, UNOBSERVED_MAX)) return no('unreadable', `${unaccepted} of ${runs.length} answers gave no accepted status (not grounded, not in the form asked for, another business at the address, or no answer)`);
  const bad = (r: DirectoryRun) => isClosed(r.status) || r.status === 'NOT_FOUND';
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

export type LinkClass = 'OK' | 'MOVED' | 'DEAD' | 'PARKED' | 'HIJACKED' | 'OFF_DOMAIN' | 'POSSIBLE_TAKEOVER' | 'POSSIBLY_MOVED' | 'SOCIAL' | 'COULD_NOT_OBSERVE';
/** The established problems. */
export const LINK_PROBLEMS: LinkClass[] = ['DEAD', 'PARKED', 'HIJACKED', 'OFF_DOMAIN'];
/** Leads for a person to review. Not problems, and never counted as such. */
export const LINK_LEADS: LinkClass[] = ['POSSIBLE_TAKEOVER', 'POSSIBLY_MOVED'];
const SOCIAL = ['facebook.com', 'instagram.com', 'untappd.com', 'twitter.com', 'x.com', 'linktr.ee', 'yelp.com', 'tiktok.com', 'youtube.com', 'linkedin.com', 'tripadvisor.com'];
export const isSocialUrl = (u: string): boolean => { const h = hostOfUrl(u); return SOCIAL.some((s) => h === s || h.endsWith(`.${s}`)); };
const GAMBLING = /slot ?(gacor|online|\d{2,3}|88)|\bslot\b.*(gacor|rtp|maxwin|pragmatic)|togel|\btoto\b|judi\b|situs (judi|slot|toto|togel)|gacor|maxwin|rtp live|pragmatic play|bandar|bocoran|keluaran|pengeluaran|\bcasino\b|kasino|sweepstakes|sportsbook|\bbetting\b|bet88|\d+bet\b|sbobet/gi;
const ADULT = /porn|xxx|escort|adult video|sex cam|viagra|cialis|payday loan|buy cheap|replica watches/i;

/**
 * Does this text name the brewery? Its distinctive name is the name with the generic words (brewing, brewery,
 * company, co, beer, taproom, the, and ...) removed; EVERY remaining word must appear in the text as a whole word.
 * One word of several is not the name, and a word inside another word is not that word. A name with no distinctive
 * word cannot be recognised this way.
 */
export function namesBrewery(name: string, text: string): boolean {
  const want = nameWords(name); if (!want.length) return false;
  const have = new Set(nameWords(text));
  return want.every((w) => have.has(w));
}
/** Does the host carry the distinctive name as one whole label ("fixture" in fixture.com or fixture-brewing.com, never in prefixture.com)? A lead, not proof. */
export function hostNamesBrewery(name: string, host: string): boolean {
  const want = nameWords(name); if (!want.length) return false;
  const labels = host.toLowerCase().replace(/^www\./, '').split('.').slice(0, -1).flatMap((l) => [l, ...l.split('-')]);
  const all = (name.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').match(/[a-z0-9]+/g) ?? []);
  // the distinctive words run together, alone or followed by the name's own generic words ("fixturebrewing", "fixturebrewingco")
  const forms = new Set([want.join('')]);
  for (let n = all.length; n > 0; n--) { const head = all.slice(0, n); if (nameWords(head.join(' ')).join('') === want.join('')) forms.add(head.join('')); }
  return labels.some((l) => forms.has(l));
}

/**
 * What a listing's website link shows. First: could we see the page at all? A refusal, a challenge, a server error
 * (5xx), a timeout, a gate or notice page, or a page too thin to judge is COULD_NOT_OBSERVE, and nothing below is
 * concluded from it. Then: DEAD (the domain does not exist, or the page answers 404 or 410); PARKED (a domain
 * seller's page); HIJACKED (gambling or adult content AND the brewery's name absent from title and body);
 * POSSIBLE_TAKEOVER (such content, name still there: a lead); MOVED (a redirect to another site whose page names the
 * brewery); POSSIBLY_MOVED (a redirect to a host that carries the name, on a page that does not: a lead);
 * OFF_DOMAIN (a redirect to another site that does neither); OK (the same site, and its page names the brewery).
 */
export function classifyLink(name: string, listedUrl: string, o: Observation): { cls: LinkClass; note: string } {
  if (isSocialUrl(listedUrl)) return { cls: 'SOCIAL', note: 'a social page; not fetched' };
  if (o.kind === 'no-such-domain') return { cls: 'DEAD', note: 'the domain does not exist' };
  if (o.kind === 'error') return { cls: 'COULD_NOT_OBSERVE', note: o.why };
  if ([401, 403, 429].includes(o.status)) return { cls: 'COULD_NOT_OBSERVE', note: `refused (HTTP ${o.status})` };
  if (o.status >= 500) return { cls: 'COULD_NOT_OBSERVE', note: `server error (HTTP ${o.status})` };
  if ([404, 410].includes(o.status)) return { cls: 'DEAD', note: `HTTP ${o.status}` };
  if (o.status !== 200) return { cls: 'COULD_NOT_OBSERVE', note: `HTTP ${o.status}` };
  // A shell is settled before anything is concluded: parking, identity, takeover or where the link now leads.
  const shell = shellReason(o);
  if (shell) return { cls: 'COULD_NOT_OBSERVE', note: shell };
  if (isParked(o)) return { cls: 'PARKED', note: `domain for sale or parked: ${o.title.slice(0, 80)}` };   // a positive parking page may be short
  const head = `${o.title} ${o.text.slice(0, 1500)}`, from = hostOfUrl(listedUrl), to = hostOfUrl(o.finalUrl);
  const named = namesBrewery(name, `${o.title} ${o.text}`), elsewhere = registrable(to) !== registrable(from);
  const keywords = (head.match(GAMBLING) ?? []).length >= 2 || (o.title.match(GAMBLING) ?? []).length > 0 || ADULT.test(o.title);
  if (o.text.trim().length < 200) return { cls: 'COULD_NOT_OBSERVE', note: `${elsewhere ? `redirects to ${to}: ` : ''}${o.text.trim() ? 'too little text to judge' : 'no server-rendered text'}` };
  if (keywords) return named ? { cls: 'POSSIBLE_TAKEOVER', note: `possible takeover: review. Gambling or adult words on a page that still names the brewery: ${o.title.slice(0, 80)}` } : { cls: 'HIJACKED', note: `gambling or adult content, and the brewery's name is nowhere on the page: ${o.title.slice(0, 80)}` };
  if (elsewhere) return named ? { cls: 'MOVED', note: `now at ${to}, on a page that names the brewery` }
    : hostNamesBrewery(name, to) ? { cls: 'POSSIBLY_MOVED', note: `possibly moved: review. Redirects to ${to}, whose address carries the name but whose page does not name the brewery` }
      : { cls: 'OFF_DOMAIN', note: `redirects to ${to}, which does not name the brewery` };
  if (named) return { cls: 'OK', note: '' };
  return { cls: 'COULD_NOT_OBSERVE', note: 'the page does not name the brewery in full, so we cannot tell that this is its site' };
}
export interface LinkState { cls: LinkClass; date: string; url: string }
export interface LinksState { baseline?: Baseline; links: Record<string, LinkState> }
export interface LinkRun { id: number; url: string; cls: LinkClass; note: string }
const sameAsBefore = (prev: Record<string, LinkState>, r: LinkRun) => prev[String(r.id)]?.cls === r.cls && prev[String(r.id)]?.url === r.url;
/** Problems that are new: a problem now, on a link that was not that same problem (for that same URL) when last observed well. */
export const newLinkProblems = (prev: Record<string, LinkState>, runs: LinkRun[]): LinkRun[] => runs.filter((r) => LINK_PROBLEMS.includes(r.cls) && !sameAsBefore(prev, r));
/** Leads that are new: possible takeovers and possible moves not seen as that before. */
export const newLinkLeads = (prev: Record<string, LinkState>, runs: LinkRun[]): LinkRun[] => runs.filter((r) => LINK_LEADS.includes(r.cls) && !sameAsBefore(prev, r));
/** Believable, and may it update the state? The same tests as the directory's, over every problem class. */
export function linkVerdict(state: LinksState, runs: LinkRun[]): Verdict {
  const fetched = runs.filter((r) => r.cls !== 'SOCIAL');
  if (!fetched.length) return no('empty', 'no link was fetched');
  const unobserved = fetched.filter((r) => r.cls === 'COULD_NOT_OBSERVE').length, seen = fetched.filter((r) => r.cls !== 'COULD_NOT_OBSERVE'), problem = (r: LinkRun) => LINK_PROBLEMS.includes(r.cls);
  if (floorTripped(unobserved, fetched.length, LINKS_UNOBSERVED_MAX)) return no('unreadable', `${unobserved} of ${fetched.length} links could not be observed`);
  if (!seen.length) return no('unreadable', `none of the ${fetched.length} links could be observed`);
  if (!state.baseline) {
    const n = seen.filter(problem).length;
    return floorTripped(n, seen.length) ? no('first-run-prevalence', `${n} of ${seen.length} links came back as problems and there is no baseline to compare with`) : no('no-baseline', 'there is no baseline yet');
  }
  if (runs.length < state.baseline.listings * COVERAGE_MIN) return no('coverage', `only ${runs.length} links were looked at; the baseline had ${state.baseline.listings}`);
  // A cohort is a listing AND its URL: a known listing with a new address is a link seen for the first time.
  const known = seen.filter((r) => state.links[String(r.id)]?.url === r.url), fresh = seen.filter((r) => state.links[String(r.id)]?.url !== r.url);
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
/** What building a proposal produced. `patch` is true only when a suspension patch was written. */
export interface ProposalResult { dir: string; patch: boolean; list: { slug: string; id: number | string; name: string; order: Eligible }[]; failed: string[]; conflicts: { breweryId: number; name: string; why: string }[] }
/**
 * The report's lines about proposals. The count and the list are of stops named in a patch that was written, never of
 * stops that were merely eligible. Evidence conflicts and build failures are said separately.
 */
export function proposalSection(eligible: number, proposal: ProposalResult | null): string[] {
  const proposed = proposedCount(proposal), out: string[] = [];
  out.push(`### Proposed for suspension: GONE on two observations at least 48 hours apart (${proposed})`,
    ...(proposal?.patch ? proposal.list.map((x) => `- ${x.slug} ${x.id} ${x.name}: ${x.order.plain} (first seen ${x.order.firstSeen}, seen again ${x.order.confirmed})`) : ['- none']), '');
  if (!proposal) return out;
  if (proposal.patch) out.push(`Nothing was published and no file in the checkout was changed. The proposal is in ${proposal.dir}: suspension.patch, evidence.md and checks.log. ${proposal.failed.length ? `Checks that failed on the patched copy: ${proposal.failed.join('; ')}.` : 'Builds, tsc and vitest passed on the patched copy.'} A person reviews and applies it; until then each run re-reads these stops and proposes again while they stay gone.`, '');
  else out.push(`${eligible} ${eligible === 1 ? 'stop was' : 'stops were'} GONE on two observations at least 48 hours apart, but no suspension patch was written, so nothing is proposed. The evidence is in ${proposal.dir} (evidence.md, checks.log).`, '');
  if (!proposal.patch && proposal.failed.length) out.push(`The proposal could not be built (${proposal.failed.length}):`, ...proposal.failed.map((f) => `- ${f}`), '');
  if (proposal.conflicts.length) out.push(`Evidence conflicts, nothing proposed (${proposal.conflicts.length}):`, ...proposal.conflicts.map((c) => `- ${c.breweryId} ${c.name}: ${c.why}`), '');
  return out;
}
/** How many stops were really proposed: the ones named in a patch that was written. An eligible stop left out by an evidence conflict, or a patch that could not be built, proposes nothing. */
export const proposedCount = (proposal: { patch: boolean; list: unknown[] } | null | undefined): number => (proposal?.patch ? proposal.list.length : 0);
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
