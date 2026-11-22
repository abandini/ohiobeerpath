// The monthly re-check: the rules, with no network, files or clock in them (scripts/monthly-check.mjs does the reading
// and writing). Import-free and written in erasable TypeScript so that Node can load it directly.
//
// The point of the job is valid data, so the rules lean one way:
//  - an observation that failed is never a pass, and never replaces what was last observed well;
//  - GONE needs a page that loaded normally, or a domain that no longer exists; anything else is "could not observe";
//  - a run where too much went wrong at once is treated as our fault (network, parser, an API change) and concludes nothing;
//  - the only thing the job may change on the public site is to suspend a road stop, and only after two valid
//    observations at least 48 hours apart.

// ---------------------------------------------------------------------------------------------------------------------
// What was seen when a page was asked for

export type Observation =
  | { kind: 'page'; status: number; text: string; meta: string; title: string; finalUrl: string }
  | { kind: 'no-such-domain' }             // DNS says the name does not exist, while known-good names still resolved
  | { kind: 'error'; why: string };        // a timeout, a refusal, a network error, a page that is not text

/** A page with less text than this cannot show that something is missing from it. */
export const MIN_REAL_TEXT = 500;
/** More than this share GONE or CLOSED in one run means the run is broken, not the world. */
export const SANITY_FLOOR = 0.15;
/** More than this share that could not be observed means the check did not observe validly. */
export const UNOBSERVED_MAX = 0.15;
/** A stop is suspended only when it was GONE on two valid readings at least this far apart. */
export const CONFIRM_AFTER_HOURS = 48;
/** The most requests one run may make to the status service. */
export const STATUS_REQUEST_CAP = 2000;

const CHALLENGE = /just a moment|attention required|verify you are human|captcha|access denied|are you a robot|checking your browser|request blocked|forbidden/i;
const NOT_FOUND_TITLE = /\b404\b|page (was )?not found|not found\b|page (can(?:no|')t|could not) be found|error\b/i;
const PARK = /domain (name )?(is |may be |might be )?(for sale|available)|for sale\b.*domain|buy this domain|this domain (is|may be) (for sale|parked)|domain (is )?parked|parked (free|domain)|hugedomains|sedo\.com|afternic|dan\.com|godaddy.{0,40}(parked|domain)|account suspended|suspendedpage|site (is )?(not|no longer) (available|published)|website (is )?(expired|coming soon)|this site can.t be reached|web server.s default page|domain has expired|recently registered/i;
const PARKING_HOSTS = ['atom.com', 'expireddomains.com', 'maxbranded.com', 'sedo.com', 'dan.com', 'hugedomains.com', 'afternic.com', 'buydomains.com', 'sedoparking.com', 'parkingcrew.net', 'bodis.com'];

export const hostOfUrl = (u: string): string => { try { return new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(u) ? u : `http://${u}`).hostname.toLowerCase(); } catch { return ''; } };
/** The last two labels of a host name: enough to tell "the same site" from "another site" for the hosts in this directory. */
export const registrable = (host: string): string => { const p = host.replace(/^www\./, '').split('.'); return p.length >= 2 ? p.slice(-2).join('.') : host; };

/** A parked or for-sale page: the address answers, but with a domain seller's page, not the brewery's. */
export function isParked(o: Observation): boolean {
  if (o.kind !== 'page' || o.status !== 200) return false;
  return PARK.test(o.title) || (o.text.length < 300 && PARK.test(o.text)) || PARKING_HOSTS.includes(registrable(hostOfUrl(o.finalUrl)));
}
/** A page that loaded normally with real content: the only kind of page that can show something is no longer there. */
export function pageHealth(o: Observation): { healthy: boolean; why: string } {
  if (o.kind === 'no-such-domain') return { healthy: false, why: 'the domain does not resolve' };
  if (o.kind === 'error') return { healthy: false, why: o.why };
  if (o.status !== 200) return { healthy: false, why: `HTTP ${o.status}` };
  if (CHALLENGE.test(o.title) || CHALLENGE.test(o.text.slice(0, 300))) return { healthy: false, why: 'a challenge or refusal page' };
  if (NOT_FOUND_TITLE.test(o.title)) return { healthy: false, why: `the page titles itself "${o.title.slice(0, 60)}"` };
  if (o.text.length < MIN_REAL_TEXT) return { healthy: false, why: 'almost no text (script-rendered?)' };
  return { healthy: true, why: '' };
}

// ---------------------------------------------------------------------------------------------------------------------
// Check A: road stops

export type StopStatus = 'CONFIRMED' | 'GONE' | 'COULD_NOT_OBSERVE';
export interface StopInput {
  evidencePage: Observation; evidenceFound: boolean; evidenceKind?: string;
  /** null when the stop shows no address. */
  address: { page: Observation; found: boolean } | null;
  /** The date a person read the page in a browser, for a page this script cannot read. */
  browserChecked?: string;
}
export interface StopResult { status: StopStatus; reason: string; /** for GONE: plain words fit for the page */ plain?: string; /** something a person should look at though nothing is concluded */ flag?: 'address' }
export const PLAIN_NO_HOURS = 'its site no longer shows visiting hours', PLAIN_NO_NOTICE = 'its site no longer shows the notice we cited',
  PLAIN_NO_SITE = 'its website no longer loads', PLAIN_PARKED = 'its website address now shows a parked or for-sale page';

/**
 * CONFIRMED: the operating evidence and the address (when there is one) were found again. GONE: the cited page loaded
 * normally with real content and the evidence is not on it; or the site's domain no longer exists, or is parked.
 * Everything else, a page a person had to read in a browser included, is COULD_NOT_OBSERVE and concludes nothing.
 */
export function classifyStop(i: StopInput): StopResult {
  const e = i.evidencePage;
  if (e.kind === 'no-such-domain') return { status: 'GONE', reason: 'the domain of the cited page does not resolve', plain: PLAIN_NO_SITE };
  if (isParked(e)) return { status: 'GONE', reason: 'the cited address shows a parked or for-sale page', plain: PLAIN_PARKED };
  const found = e.kind === 'page' && e.status === 200 && i.evidenceFound;
  if (!found) {
    const h = pageHealth(e);
    if (i.browserChecked) return { status: 'COULD_NOT_OBSERVE', reason: `a person read this page in a browser on ${i.browserChecked}; this script cannot read it${h.healthy ? '' : ` (${h.why})`}` };
    if (!h.healthy) return { status: 'COULD_NOT_OBSERVE', reason: h.why };
    return { status: 'GONE', reason: 'the cited page loaded normally and the evidence text is not on it', plain: i.evidenceKind === 'notice' ? PLAIN_NO_NOTICE : PLAIN_NO_HOURS };
  }
  if (!i.address || i.address.found) return { status: 'CONFIRMED', reason: i.address ? 'evidence and address found' : 'evidence found' };
  const a = pageHealth(i.address.page);
  if (a.healthy) return { status: 'COULD_NOT_OBSERVE', reason: 'the evidence is still there, but the address is no longer on the page it was read from', flag: 'address' };
  return { status: 'COULD_NOT_OBSERVE', reason: `the evidence is still there, but the address page could not be read (${a.why})` };
}

/** True when the share is too large to believe: the run is broken and nothing is concluded from it. */
export const floorTripped = (bad: number, total: number, max: number = SANITY_FLOOR): boolean => total > 0 && bad / total > max;

export interface StopState { lastConfirmed?: string; goneFirst?: { at: string; reason: string; plain: string }; goneConfirmed?: string }
export interface RoadsState { stops: Record<string, StopState> }
export interface StopRun { slug: string; key: string; status: StopStatus; reason: string; plain?: string }
export interface SuspendOrder { slug: string; key: string; plain: string; firstSeen: string; confirmed: string }
export const stopStateKey = (slug: string, key: string) => `${slug}/${key}`;
const hoursBetween = (a: string, b: string) => (Date.parse(b) - Date.parse(a)) / 3600000;

/**
 * What one valid run of one road does to the state, and which stops it says to suspend. `now` is an ISO timestamp.
 * A run that is not valid returns the state it was given, untouched. In a valid run: CONFIRMED sets the date it was
 * last re-confirmed and clears any earlier sighting; GONE records the first sighting, or, when a first sighting is at
 * least 48 hours old, orders the suspension; COULD_NOT_OBSERVE leaves the entry and its dates exactly as they were.
 */
export function applyRoadRun(state: RoadsState, runs: StopRun[], now: string, valid: boolean): { state: RoadsState; suspend: SuspendOrder[]; goneOnce: StopRun[]; cleared: StopRun[] } {
  if (!valid) return { state, suspend: [], goneOnce: [], cleared: [] };
  const stops = { ...state.stops }, suspend: SuspendOrder[] = [], goneOnce: StopRun[] = [], cleared: StopRun[] = [];
  for (const r of runs) {
    const k = stopStateKey(r.slug, r.key), was = stops[k] ?? {};
    if (r.status === 'CONFIRMED') { if (was.goneFirst) cleared.push(r); stops[k] = { lastConfirmed: now.slice(0, 10) }; }
    else if (r.status === 'GONE') {
      const plain = r.plain ?? PLAIN_NO_HOURS;
      if (was.goneFirst && hoursBetween(was.goneFirst.at, now) >= CONFIRM_AFTER_HOURS) {
        stops[k] = { ...was, goneConfirmed: now };
        suspend.push({ slug: r.slug, key: r.key, plain, firstSeen: was.goneFirst.at, confirmed: now });
      } else if (!was.goneFirst) { stops[k] = { ...was, goneFirst: { at: now, reason: r.reason, plain } }; goneOnce.push(r); }
      else goneOnce.push(r);                                           // seen again too soon to count as a confirmation
    }
  }
  return { state: { ...state, stops }, suspend, goneOnce, cleared };
}
/** The stops a confirm pass must re-read: those with a first sighting that has not led to a suspension. */
export const pendingKeys = (state: RoadsState): string[] => Object.entries(state.stops).filter(([, v]) => v.goneFirst && !v.goneConfirmed).map(([k]) => k);

/**
 * One brewery, one record: a stop to suspend is suspended on every road that lists the same directory listing. `id`
 * is what data/roads/<slug>/suspended.json is keyed by (the directory id, or the key on a road of stand-alone stops).
 */
export function suspensionsByRoad(orders: SuspendOrder[], roads: { slug: string; stops: { key: string; breweryId?: number; name: string }[] }[]): { slug: string; id: number | string; name: string; order: SuspendOrder }[] {
  const out: { slug: string; id: number | string; name: string; order: SuspendOrder }[] = [], seen = new Set<string>();
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
// Check B: directory status (an internal lead; nothing here is ever published)

export type MapsStatus = 'OPERATIONAL' | 'CLOSED_TEMPORARILY' | 'CLOSED_PERMANENTLY' | 'NOT_FOUND';
const MAPS: MapsStatus[] = ['OPERATIONAL', 'CLOSED_TEMPORARILY', 'CLOSED_PERMANENTLY', 'NOT_FOUND'];
/** The status in an answer of the form we ask for, or null when the answer does not say one and only one. */
export function parseMapsStatus(answer: string): MapsStatus | null {
  const m = [...String(answer ?? '').matchAll(/^\s*STATUS:\s*([A-Z_]+)\s*$/gm)].map((x) => x[1]);
  return m.length === 1 && (MAPS as string[]).includes(m[0]) ? (m[0] as MapsStatus) : null;
}
export interface ListingState { status: string; date: string }
export interface DirectoryRun { id: number; status: MapsStatus | null }
export interface DirectoryChanges { newlyClosed: number[]; newlyNotFound: number[]; operationalAgain: number[]; firstSeen: number; unparsed: number; closedNow: number; parsed: number }
const isClosed = (s: string | undefined) => s === 'CLOSED_PERMANENTLY' || s === 'CLOSED_TEMPORARILY';
/** Changes against the last good status of each listing. A listing seen for the first time is counted, not reported as a change. */
export function directoryChanges(prev: Record<string, ListingState>, runs: DirectoryRun[]): DirectoryChanges {
  const c: DirectoryChanges = { newlyClosed: [], newlyNotFound: [], operationalAgain: [], firstSeen: 0, unparsed: 0, closedNow: 0, parsed: 0 };
  for (const r of runs) {
    if (!r.status) { c.unparsed++; continue; }
    c.parsed++; if (isClosed(r.status)) c.closedNow++;
    const was = prev[String(r.id)]?.status;
    if (!was) { c.firstSeen++; continue; }
    if (isClosed(r.status) && !isClosed(was)) c.newlyClosed.push(r.id);
    else if (r.status === 'NOT_FOUND' && was !== 'NOT_FOUND') c.newlyNotFound.push(r.id);
    else if (r.status === 'OPERATIONAL' && was !== 'OPERATIONAL') c.operationalAgain.push(r.id);
  }
  return c;
}
/**
 * Is the directory run believable? Not when too many answers could not be parsed, and not when too many listings
 * turned closed at once: among listings with a last good status, those newly closed; on a first run, all those closed.
 */
export function directoryRunValid(prev: Record<string, ListingState>, runs: DirectoryRun[]): { valid: boolean; why: string } {
  const c = directoryChanges(prev, runs), known = runs.filter((r) => r.status && prev[String(r.id)]).length;
  if (!runs.length) return { valid: false, why: 'no listing was asked about' };
  if (floorTripped(c.unparsed, runs.length, UNOBSERVED_MAX)) return { valid: false, why: `${c.unparsed} of ${runs.length} answers could not be read` };
  if (known && floorTripped(c.newlyClosed.length, known)) return { valid: false, why: `${c.newlyClosed.length} of ${known} listings turned closed in one run` };
  const fresh = runs.filter((r) => r.status && !prev[String(r.id)]);
  if (!known && floorTripped(fresh.filter((r) => isClosed(r.status ?? undefined)).length, fresh.length)) return { valid: false, why: `${fresh.filter((r) => isClosed(r.status ?? undefined)).length} of ${fresh.length} listings came back closed on a first run` };
  return { valid: true, why: '' };
}
/** The last good status per listing after a run: unchanged when the run is not valid, and unchanged for any answer that could not be read. */
export function mergeDirectoryState(prev: Record<string, ListingState>, runs: DirectoryRun[], date: string, valid: boolean): Record<string, ListingState> {
  if (!valid) return prev;
  const next = { ...prev };
  for (const r of runs) if (r.status) next[String(r.id)] = { status: r.status, date };
  return next;
}

// ---------------------------------------------------------------------------------------------------------------------
// Check C: website links

export type LinkClass = 'OK' | 'MOVED' | 'DEAD' | 'PARKED' | 'HIJACKED' | 'OFF_DOMAIN' | 'SOCIAL' | 'COULD_NOT_OBSERVE';
export const LINK_PROBLEMS: LinkClass[] = ['DEAD', 'PARKED', 'HIJACKED', 'OFF_DOMAIN'];
const SOCIAL = ['facebook.com', 'instagram.com', 'untappd.com', 'twitter.com', 'x.com', 'linktr.ee', 'yelp.com', 'tiktok.com', 'youtube.com', 'linkedin.com', 'tripadvisor.com'];
export const isSocialUrl = (u: string): boolean => { const h = hostOfUrl(u); return SOCIAL.some((s) => h === s || h.endsWith(`.${s}`)); };
const GAMBLING = /slot ?(gacor|online|\d{2,3}|88)|\bslot\b.*(gacor|rtp|maxwin|pragmatic)|togel|\btoto\b|judi\b|situs (judi|slot|toto|togel)|gacor|maxwin|rtp live|pragmatic play|bandar|bocoran|keluaran|pengeluaran|\bcasino\b|kasino|sweepstakes|sportsbook|\bbetting\b|bet88|\d+bet\b|sbobet/gi;
const ADULT = /porn|xxx|escort|adult video|sex cam|viagra|cialis|payday loan|buy cheap|replica watches/i;
const BREWISH = /brew|beer|ale\b|ales\b|lager|pub\b|taproom|tap room|tavern|cider|distill|winery|wine|ipa\b|hops?\b|stout|restaurant|bar\b|grill|brasserie|biergarten|meadery|mead\b/i;
const GENERIC = new Set(['brewing', 'brewery', 'brew', 'co', 'company', 'the', 'and', 'beer', 'brewpub', 'brewhouse', 'works', 'craft', 'ales', 'ale', 'of', 'at', 'inc', 'llc', 'house', 'restaurant', 'pub', 'tap', 'taproom', 'distillery', 'winery', 'cellars', 'bar', 'grill', 'a', 'on']);
const nameTokens = (n: string) => (n.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((t) => !GENERIC.has(t) && t.length > 2);

/**
 * What a listing's website link shows. DEAD: the domain does not exist, or the page answers 404, 410 or a server
 * error. PARKED and HIJACKED: the address answers with a domain seller's page, or with gambling or adult content.
 * OFF_DOMAIN: it redirects to another site that does not name the brewery. MOVED: it redirects to another site that
 * does (worth a look, not a problem). A refusal, a timeout or a page too thin to judge is COULD_NOT_OBSERVE.
 */
export function classifyLink(name: string, listedUrl: string, o: Observation): { cls: LinkClass; note: string } {
  if (isSocialUrl(listedUrl)) return { cls: 'SOCIAL', note: 'a social page; not fetched' };
  if (o.kind === 'no-such-domain') return { cls: 'DEAD', note: 'the domain does not resolve' };
  if (o.kind === 'error') return { cls: 'COULD_NOT_OBSERVE', note: o.why };
  if ([401, 403, 429].includes(o.status) || CHALLENGE.test(o.title)) return { cls: 'COULD_NOT_OBSERVE', note: `refused (HTTP ${o.status})` };
  const head = `${o.title} ${o.text.slice(0, 1500)}`, from = hostOfUrl(listedUrl), to = hostOfUrl(o.finalUrl);
  if ((head.match(GAMBLING) ?? []).length >= 2 || (o.title.match(GAMBLING) ?? []).length > 0 || ADULT.test(o.title)) return { cls: 'HIJACKED', note: `gambling or adult content: ${o.title.slice(0, 80)}` };
  if ([404, 410].includes(o.status) || o.status >= 500) return { cls: 'DEAD', note: `HTTP ${o.status}` };
  if (o.status !== 200) return { cls: 'COULD_NOT_OBSERVE', note: `HTTP ${o.status}` };
  if (isParked(o)) return { cls: 'PARKED', note: `parked or for sale: ${o.title.slice(0, 80)}` };
  const tokens = nameTokens(name), hay = `${head.toLowerCase()} ${to}`, squeezed = hay.replace(/[^a-z0-9]/g, '');
  const match = tokens.some((t) => hay.includes(t)) || (tokens.length > 0 && squeezed.includes(tokens.join('')));
  if (registrable(to) !== registrable(from)) return match ? { cls: 'MOVED', note: `now at ${to}` } : o.text.length < 200 ? { cls: 'COULD_NOT_OBSERVE', note: `redirects to ${to}, a page with almost no text` } : { cls: 'OFF_DOMAIN', note: `redirects to ${to}, which does not name the brewery` };
  if (o.text.trim().length < 200) return { cls: 'COULD_NOT_OBSERVE', note: o.text.trim() ? 'too little text to judge' : 'no server-rendered text' };
  if (match || BREWISH.test(head)) return { cls: 'OK', note: '' };
  return { cls: 'COULD_NOT_OBSERVE', note: o.text.trim() ? 'could not tell from the page text that this is the brewery' : 'no server-rendered text' };
}
export interface LinkState { cls: LinkClass; date: string; url: string }
export interface LinkRun { id: number; url: string; cls: LinkClass; note: string }
/** Problems that are new: a problem now, on a link that was not that same problem (for that same URL) when last observed well. */
export const newLinkProblems = (prev: Record<string, LinkState>, runs: LinkRun[]): LinkRun[] =>
  runs.filter((r) => LINK_PROBLEMS.includes(r.cls) && !(prev[String(r.id)]?.cls === r.cls && prev[String(r.id)]?.url === r.url));
/** Believable? Not when too many links could not be observed, and not when too many turned into problems at once. */
export function linkRunValid(prev: Record<string, LinkState>, runs: LinkRun[]): { valid: boolean; why: string } {
  const fetched = runs.filter((r) => r.cls !== 'SOCIAL'), unobserved = fetched.filter((r) => r.cls === 'COULD_NOT_OBSERVE').length;
  if (!fetched.length) return { valid: false, why: 'no link was fetched' };
  const known = fetched.filter((r) => prev[String(r.id)]), fresh = newLinkProblems(prev, known);
  if (known.length && floorTripped(fresh.length, known.length)) return { valid: false, why: `${fresh.length} of ${known.length} links turned into problems in one run` };
  // A first run has nothing to compare with; what it must not be is mostly network failure.
  const dead = fetched.filter((r) => r.cls === 'DEAD' && /does not resolve/.test(r.note)).length;
  if (!known.length && floorTripped(dead, fetched.length)) return { valid: false, why: `${dead} of ${fetched.length} domains did not resolve on a first run` };
  if (floorTripped(unobserved, fetched.length, 0.3)) return { valid: false, why: `${unobserved} of ${fetched.length} links could not be observed` };
  return { valid: true, why: '' };
}
export function mergeLinkState(prev: Record<string, LinkState>, runs: LinkRun[], date: string, valid: boolean): Record<string, LinkState> {
  if (!valid) return prev;
  const next = { ...prev };
  for (const r of runs) if (r.cls !== 'COULD_NOT_OBSERVE') next[String(r.id)] = { cls: r.cls, date, url: r.url };
  return next;
}

// ---------------------------------------------------------------------------------------------------------------------
// Publishing, and the words of the report

export type PublishDecision = 'nothing' | 'propose' | 'blocked' | 'push';
/**
 * Whether a suspension may be pushed. Only with MONTHLY_AUTOPUBLISH set to exactly "1"; only when every gate passed;
 * only from an up-to-date main. Anything else writes the proposed change for a person and stops.
 */
export function publishDecision(i: { autopublish: string | undefined; suspensions: number; gatesPassed: boolean; onMain: boolean; upToDate: boolean }): { decision: PublishDecision; why: string } {
  if (!i.suspensions) return { decision: 'nothing', why: 'nothing to suspend' };
  if (!i.gatesPassed) return { decision: 'blocked', why: 'a pre-publish check failed' };
  if (i.autopublish !== '1') return { decision: 'propose', why: 'MONTHLY_AUTOPUBLISH is not 1' };
  if (!i.onMain) return { decision: 'propose', why: 'not on the main branch' };
  if (!i.upToDate) return { decision: 'propose', why: 'this checkout is not level with origin/main' };
  return { decision: 'push', why: '' };
}

export interface CheckOutcome { ran: boolean; valid: boolean; why: string }
/** Exit 0 only when every check that was asked for observed validly. */
export const exitCode = (checks: CheckOutcome[]): 0 | 2 => (checks.length > 0 && checks.every((c) => c.ran && c.valid) ? 0 : 2);
/** One sentence, under 300 characters, for a text message. Counts only: no brewery is named. */
export function summaryLine(s: { date: string; a?: { ok: boolean; confirmed: number; goneOnce: number; suspended: number; unobserved: number }; b?: { ok: boolean; newlyClosed: number; newlyNotFound: number }; c?: { ok: boolean; fresh: number }; published: PublishDecision }): string {
  const part = (label: string, ok: boolean | undefined, text: string) => (ok === undefined ? '' : ok ? `${label} ${text}` : `${label} FAILED`);
  const out = [
    part('roads', s.a?.ok, `${s.a?.confirmed} confirmed, ${s.a?.goneOnce} gone once, ${s.a?.suspended} to suspend, ${s.a?.unobserved} unobserved`),
    part('directory', s.b?.ok, `${s.b?.newlyClosed} newly closed, ${s.b?.newlyNotFound} newly not found`),
    part('links', s.c?.ok, `${s.c?.fresh} new problems`),
  ].filter(Boolean).join('; ');
  const tail = s.published === 'push' ? ' Suspension published.' : s.published === 'propose' ? ' Suspension proposed, not published.' : s.published === 'blocked' ? ' Suspension blocked by a failed check.' : '';
  return `Brewery Trip monthly check ${s.date}: ${out}.${tail}`.slice(0, 299);
}
