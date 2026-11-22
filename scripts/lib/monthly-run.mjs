// The monthly re-check: everything that reads the network and writes files. The rules are in src/lib/monthly-check.ts;
// the two entry points are scripts/monthly-check.mjs (production) and scripts/monthly-check-drill.mjs (trials).
// Read docs/monthly-check.md first.
//
// Version 1 publishes nothing and edits no file in the checkout. It reads the roads as built, reads the directory with
// one SELECT, fetches pages, and writes only under its data directory (outside the checkout): state, reports, the
// internal directory-status files, kept page texts, backups and proposals. A proposal's patch is built in a
// disposable git worktree, never in the live checkout.
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, renameSync, rmSync, realpathSync, cpSync, symlinkSync, mkdtempSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve, basename } from 'node:path';
import { homedir, tmpdir, userInfo, hostname } from 'node:os';
import dns from 'node:dns/promises';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const UA = 'BreweryTripBot/1.0 (+https://brewerytrip.com/about)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toISOString();
class Stop extends Error {}                                            // a hard stop: said plainly, exit 2, nothing written

/** The production data directory: MONTHLY_DATA_DIR, else ~/brewerytrip-monthly. Outside the checkout on purpose. */
export const productionDir = () => resolve(process.env.MONTHLY_DATA_DIR || join(homedir(), 'brewerytrip-monthly'));
const real = (p) => { mkdirSync(p, { recursive: true }); return realpathSync(p); };
/** The canonical form of a path that may not exist yet: the real path of its nearest existing ancestor, plus the rest. Creates nothing. */
const canon = (p) => { let at = resolve(p); const rest = []; while (!existsSync(at) && dirname(at) !== at) { rest.unshift(basename(at)); at = dirname(at); } return join(realpathSync(at), ...rest); };

export async function main({ drill }) {
  try { process.exitCode = await run({ drill }); }
  catch (e) {
    if (!(e instanceof Stop)) throw e;
    console.log(`monthly check stopped: ${e.message}`);
    console.log(`Brewery Trip monthly check: STOPPED before observing. ${e.message}`.slice(0, 299));
    process.exitCode = 2;
  }
}

async function run({ drill }) {
  const argv = process.argv.slice(2), flag = (n) => argv.includes(n), opt = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
  const L = await import(join(root, 'src/lib/monthly-check.ts'));
  const R = await import(join(root, 'src/lib/road-trip.ts'));
  const date = stamp().slice(0, 10), confirm = flag('--confirm'), init = opt('--init-baseline');

  // --- Where this run keeps its files -------------------------------------------------------------------------------
  // Production: the production directory, always. A drill: a directory of its own that is not the production
  // directory or inside it, compared as canonical paths so that a symlink or a relative spelling cannot pass.
  const allowed = drill ? ['--confirm', '--only', '--sample-b', '--sample-c', '--data-dir', '--listings-file', '--pretend-gone', '--pretend-first-sighting', '--init-baseline', '--from'] : ['--confirm', '--only', '--listings-file', '--init-baseline', '--from'];
  for (const a of argv.filter((x) => x.startsWith('--'))) if (!allowed.includes(a)) throw new Stop(`${a} is not an option of the ${drill ? 'drill' : 'production'} run${drill ? '' : ' (samples, other data directories and pretended observations belong to scripts/monthly-check-drill.mjs)'}`);
  const prod = canon(productionDir()), prodDefault = canon(join(homedir(), 'brewerytrip-monthly'));
  let dataDir = '';
  if (drill) {
    if (!opt('--data-dir')) throw new Stop('a drill needs --data-dir, a directory of its own');
    const wanted = canon(resolve(process.cwd(), opt('--data-dir')));   // judged before anything is created
    for (const p of [prod, prodDefault]) if (L.insideDir(wanted, p) || L.insideDir(p, wanted)) throw new Stop(`a drill may not use the production data directory (${p}) or anything inside or around it`);
    if (L.insideDir(wanted, realpathSync(root))) throw new Stop('a drill may not keep its files inside the checkout');
    dataDir = real(wanted);
  }
  if (!drill && L.insideDir(canon(prod), realpathSync(root))) throw new Stop(`the data directory (${prod}) is inside the checkout. It must be outside it`);
  if (!drill) dataDir = real(prod);

  // --- The source revision ------------------------------------------------------------------------------------------
  // What is observed is what is in this checkout, so the checkout must be exactly one commit: the production run needs
  // a clean working tree and index (untracked files included), and records the commit. The wrapper has already brought
  // the checkout level with origin/main and passes the commit it left it at; if HEAD is anything else, stop.
  const gitOut = (...a) => execFileSync('git', a, { cwd: root, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  let sourceSha = '', dirty = '';
  try { sourceSha = gitOut('rev-parse', 'HEAD'); dirty = gitOut('status', '--porcelain'); } catch { throw new Stop('this is not a git checkout, so the revision observed cannot be recorded'); }
  /** Called once the lock is held and the state has been read, before anything is observed. */
  const requireOneCommit = () => {
    if (!drill && dirty) throw new Stop(`the checkout has uncommitted or untracked changes (${dirty.split('\n').length} paths, the first: ${dirty.split('\n')[0].trim()}). The production run observes one commit exactly: give the job a checkout of its own that nobody works in`);
    if (process.env.MONTHLY_SOURCE_SHA && process.env.MONTHLY_SOURCE_SHA !== sourceSha) throw new Stop(`the wrapper prepared commit ${process.env.MONTHLY_SOURCE_SHA}, but the checkout is at ${sourceSha}`);
  };
  const sourceLine = `Source revision observed: ${sourceSha}${dirty ? ' WITH UNCOMMITTED CHANGES (a drill; a proposal is built from the commit alone)' : ''}`;

  const dirs = Object.fromEntries(['state', 'internal', 'reports', 'proposals', 'pages', 'backups', 'observations'].map((d) => [d, join(dataDir, d)]));
  for (const d of Object.values(dirs)) mkdirSync(d, { recursive: true });
  const only = new Set((opt('--only') || (confirm ? 'a' : 'a,b,c')).split(',').map((x) => x.trim().toLowerCase()));
  const log = (...a) => console.log(...a);

  // --- One run at a time --------------------------------------------------------------------------------------------
  // The wrapper takes the lock before it pulls and holds it to the end (MONTHLY_LOCK_HELD names the directory it
  // holds). Run by hand, the lock is taken here. A stale lock is reported, never broken.
  const lock = join(dataDir, 'lock');
  for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sig, () => process.exit(2));   // so that the lock is released on the way out
  // The wrapper's claim to hold the lock is believed only if the lock is there and names our parent process.
  let wrapperHolds = false;
  if (process.env.MONTHLY_LOCK_HELD === lock) { try { wrapperHolds = Number(JSON.parse(readFileSync(join(lock, 'info.json'), 'utf8')).pid) === process.ppid; } catch { /* not held */ } if (!wrapperHolds) throw new Stop(`MONTHLY_LOCK_HELD names ${lock}, but that lock is not held by the process that started this run`); }
  if (!wrapperHolds) {
    try { mkdirSync(lock); } catch {
      let info = {}; try { info = JSON.parse(readFileSync(join(lock, 'info.json'), 'utf8')); } catch { /* no details */ }
      const started = info.started || (existsSync(lock) ? statSync(lock).mtime.toISOString() : stamp());
      throw new Stop(L.lockIsStale(started, stamp()) ? `a lock from ${started} (pid ${info.pid ?? 'unknown'}) is still at ${lock}. It is more than ${L.STALE_LOCK_HOURS} hours old and was not removed: check that no run is going, then delete that directory by hand` : `another run holds the lock at ${lock} (pid ${info.pid ?? 'unknown'}, since ${started})`);
    }
    writeFileSync(join(lock, 'info.json'), JSON.stringify({ pid: process.pid, started: stamp(), by: 'monthly-run.mjs' }));
    process.on('exit', () => { try { rmSync(lock, { recursive: true, force: true }); } catch { /* nothing more to do */ } });
  }

  // --- State: read strictly, written atomically, backed up at the start of each run -------------------------------
  const files = { roads: join(dirs.state, 'roads.json'), links: join(dirs.state, 'links.json'), directory: join(dirs.internal, 'directory-state.json'), marker: join(dirs.state, 'INITIALISED.json') };
  const writeJson = (f, v) => { const tmp = `${f}.tmp-${process.pid}`; writeFileSync(tmp, JSON.stringify(v, null, 1) + '\n'); renameSync(tmp, f); };
  let marker = {};
  if (existsSync(files.marker)) { try { marker = JSON.parse(readFileSync(files.marker, 'utf8')); } catch { throw new Stop(`${files.marker} cannot be read. Restore it from ${dirs.backups} before running again`); } }
  if (!!marker.drill !== !!drill && Object.keys(marker).length) throw new Stop(`${files.marker} ${marker.drill ? 'was written by a drill: a production run does not use it' : 'was not written by a drill: a drill does not touch it'}`);
  /** The state of one check. Missing or unreadable state where state is known to have existed is a hard stop, never a new start. */
  const readState = (name, empty) => {
    const f = files[name];
    if (!existsSync(f)) { if (marker[name]) throw new Stop(`the ${name} state (${f}) is missing, though it was initialised on ${marker[name].date}. Restore it from ${dirs.backups}; a new baseline is never started silently`); return empty; }
    let s; try { s = JSON.parse(readFileSync(f, 'utf8')); } catch { throw new Stop(`the ${name} state (${f}) cannot be read. Restore it from ${dirs.backups}`); }
    const part = { roads: 'stops', directory: 'listings', links: 'links' }[name];
    if (!s || typeof s !== 'object' || !s[part] || typeof s[part] !== 'object' || Array.isArray(s[part])) throw new Stop(`the ${name} state (${f}) is not in the form expected. Restore it from ${dirs.backups}`);
    if (s.drill && !drill) throw new Stop(`the ${name} state (${f}) was written by a drill. A production run does not read drill state`);
    if (!s.drill && drill) throw new Stop(`the ${name} state (${f}) was not written by a drill. A drill does not touch it`);
    return s;
  };
  const writeState = (name, s) => {
    writeJson(files[name], { ...(drill ? { drill: true } : {}), ...s });
    if (!marker[name]) { marker = { ...(drill ? { drill: true } : {}), ...marker, [name]: { date } }; writeJson(files.marker, marker); }
  };
  const state = { roads: readState('roads', { stops: {} }), directory: readState('directory', { listings: {} }), links: readState('links', { links: {} }) };
  requireOneCommit();
  {
    const have = Object.values(files).filter((f) => existsSync(f));
    if (have.length) {
      const to = join(dirs.backups, stamp().replace(/[:.]/g, '-')); mkdirSync(to, { recursive: true });
      for (const f of have) cpSync(f, join(to, basename(f)));
      for (const old of readdirSync(dirs.backups).sort().slice(0, -12)) rmSync(join(dirs.backups, old), { recursive: true, force: true });
    }
  }

  // --- Reading a page: one honest request, at most one retry, nothing that gets around a refusal -------------------
  /** True only when DNS answers "no such name" (NXDOMAIN) for the host AND names known to be good resolve at that moment. "No data" is not that claim. */
  async function noSuchDomain(host) {
    const tries = await Promise.allSettled([dns.resolve4(host), dns.resolve6(host)]);
    if (!tries.every((t) => t.status === 'rejected' && t.reason?.code === 'ENOTFOUND')) return false;
    const good = await Promise.allSettled([dns.resolve4('brewerytrip.com'), dns.resolve4('example.com')]);
    return good.every((t) => t.status === 'fulfilled');
  }
  async function readPage(url, timeout = 30000) {
    let last = { kind: 'error', at: stamp(), why: 'not tried' };
    for (let attempt = 1; attempt <= 2; attempt++) {
      const at = stamp();
      try {
        const r = await fetch(/^[a-z][a-z0-9+.-]*:\/\//i.test(url) ? url : `http://${url}`, { headers: { 'user-agent': UA, accept: 'text/html,*/*;q=0.5' }, redirect: 'follow', signal: AbortSignal.timeout(timeout) });
        const type = r.headers.get('content-type') || '';
        if (r.status === 200 && type && !/html|text/i.test(type)) return { kind: 'error', at, why: `not a text page (${type})` };
        // The whole page or nothing: a page cut short would make text near its end look as if it had gone.
        const html = await r.text();
        if (html.length > 25000000) return { kind: 'error', at, why: 'the page is too large to read whole' };
        const title = R.pageText((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '').slice(0, 300);
        const meta = [...html.matchAll(/<meta\b[^>]*\b(?:name|property)=["'](?:description|og:description)["'][^>]*>/gi)].map((m) => R.pageText((m[0].match(/\bcontent=(["'])([\s\S]*?)\1/i) || [])[2] || '')).join(' \n ');
        last = { kind: 'page', at, status: r.status, text: R.pageText(html), meta, title, finalUrl: r.url || url };
        if (r.status < 500) return last;                               // a refusal (403, 429) is an answer: no retry
      } catch (e) {
        const code = e?.cause?.code;
        if (code === 'ENOTFOUND' || code === 'EAI_AGAIN' || code === 'ENODATA') { if (await noSuchDomain(L.hostOfUrl(url))) return { kind: 'no-such-domain', at }; last = { kind: 'error', at, why: 'the name did not resolve, but DNS did not say it does not exist (no address on record, or our own network)' }; }
        else last = { kind: 'error', at, why: e?.name === 'TimeoutError' ? 'timed out' : `network error${code ? ` (${code})` : ''}` };
      }
      if (attempt === 1) await sleep(2000);
    }
    return last;
  }
  /** Are we on the network at all? Our own site answers and a known name resolves. '' when we are. */
  async function canary() {
    try {
      const r = await fetch('https://brewerytrip.com/robots.txt', { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(20000) });
      await dns.resolve4('example.com');
      return r.status === 200 ? '' : `our own site answered HTTP ${r.status}`;
    } catch (e) { return `no network (${e?.cause?.code || e?.code || e?.name})`; }
  }
  /** Runs jobs with a small pool, never two at once for the same site. */
  async function pool(items, size, hostOf, work) {
    const out = new Array(items.length), busy = new Map(); let next = 0;
    const one = async () => {
      for (;;) {
        const i = next++; if (i >= items.length) return;
        const h = hostOf(items[i]), before = busy.get(h) ?? Promise.resolve();
        const mine = before.then(() => work(items[i], i));
        busy.set(h, mine.then(() => sleep(300), () => sleep(300)));
        out[i] = await mine;
      }
    };
    await Promise.all(Array.from({ length: size }, one));
    return out;
  }

  // --- The roads, as built -----------------------------------------------------------------------------------------
  const roads = [];
  for (const f of readdirSync(join(root, 'src/data/roads')).filter((x) => /\.built\.ts$/.test(x)).sort()) {
    const slug = f.replace(/\.built\.ts$/, '');
    const built = Object.values(await import(join(root, 'src/data/roads', f))).find((v) => v && Array.isArray(v.stops));
    const config = Object.values(await import(join(root, `src/data/roads/${slug}.ts`))).find((v) => v && typeof v === 'object' && v.slug === slug);
    if (built && config?.publish === true) roads.push({ slug, name: config.shortName || slug, stops: built.stops });
  }

  // --- Check A ------------------------------------------------------------------------------------------------------
  // Drill only: stops made to read as GONE, and a pretended first sighting some hours in the past.
  const pretendGone = new Set(drill ? String(opt('--pretend-gone') || '').split(',').map((x) => x.trim()).filter(Boolean) : []);
  const pretendFirst = drill ? Number(opt('--pretend-first-sighting')) || 0 : 0;
  async function checkRoads() {
    const out = { ran: true, valid: true, why: '', roads: [], eligible: [], goneOnce: [], cleared: [] };
    const net = await canary();
    if (net) return { ...out, valid: false, why: `could not observe: ${net}` };
    const pending = new Set(L.pendingKeys(state.roads));
    const pages = new Map(), page = async (u) => { if (!pages.has(u)) pages.set(u, await readPage(u)); return pages.get(u); };
    const found = (o, quote) => o.kind === 'page' && (R.excerptFound(o.text, quote) || R.excerptFound(o.meta, quote));
    const keep = (road, s, o) => {                                     // the fetched text of a GONE reading, kept beside the report
      const dir = join(dirs.pages, date); mkdirSync(dir, { recursive: true });
      const f = join(dir, `${road.slug}__${s.key}__${o.at.replace(/[:.]/g, '-')}.txt`);
      writeFileSync(f, [`cited URL: ${s.evidenceUrl}`, `read at: ${o.at}`, o.kind === 'page' ? `final URL: ${o.finalUrl}\nHTTP status: ${o.status}\ntitle: ${o.title}` : `result: ${o.kind}`, `cited evidence: ${s.evidence}`, '', o.kind === 'page' ? o.text : ''].join('\n'));
      return f;
    };
    const runs = [];
    for (const road of roads) {
      const stops = confirm ? road.stops.filter((s) => pending.has(L.stopStateKey(road.slug, s.key))) : road.stops, mine = [];
      for (const s of stops) {
        const k = L.stopStateKey(road.slug, s.key), cite = L.citeOf(road.slug, s.key, s.evidenceUrl, s.evidence);
        const e = await page(s.evidenceUrl), a = s.address ? await page(s.addressSourceUrl) : null;
        const was = state.roads.stops[k], fingerprint = was?.cite === cite ? was.page : undefined, hit = found(e, s.evidence);
        const r = pretendGone.has(k) ? { status: 'GONE', reason: 'DRILL: pretended gone', plain: L.PLAIN_NO_HOURS }
          : L.classifyStop({ evidencePage: e, evidenceFound: hit, evidenceKind: s.evidenceKind, address: s.address ? { page: a, found: found(a, s.address) } : null, browserChecked: s.browserChecked, fingerprint });
        const run = { slug: road.slug, key: s.key, cite, source: L.sourceOf(s.evidenceUrl, s.evidence), at: e.at, name: s.name, town: s.town, breweryId: s.breweryId, url: s.evidenceUrl, evidence: s.evidence,
          known: !!s.browserChecked && R.unreadVerdict(s.browserChecked, date) === 'browser-checked', ...r,
          ...(r.status === 'CONFIRMED' && e.kind === 'page' && R.excerptFound(e.text, s.evidence) ? { page: L.fingerprintOf(e, s.evidence) } : {}),
          ...(r.status === 'GONE' ? { kept: keep(road, s, e) } : {}) };
        mine.push(run);
        log(`  ${road.slug} ${r.status.padEnd(17)} ${s.key} ${s.name}${r.status === 'CONFIRMED' ? '' : `: ${r.reason}`}`);
      }
      const gone = mine.filter((r) => r.status === 'GONE').length, unobserved = mine.filter((r) => r.status === 'COULD_NOT_OBSERVE' && !r.known).length;
      // Both floors are measured against the whole road, so a confirming pass over two stops is not "100% gone".
      const why = L.floorTripped(gone, road.stops.length) ? `${gone} of ${road.stops.length} stops came back GONE in one run: treated as a broken run`
        : L.floorTripped(unobserved, road.stops.length, L.UNOBSERVED_MAX) ? `${unobserved} of ${road.stops.length} stops could not be observed` : '';
      out.roads.push({ slug: road.slug, name: road.name, total: road.stops.length, read: mine.length, why, runs: mine });
      runs.push(...mine);
      if (why) { out.valid = false; out.why = [out.why, `${road.slug}: ${why}`].filter(Boolean).join('; '); }
    }
    const after = await canary();
    if (after) { out.valid = false; out.why = `could not observe: ${after} by the end of the run`; }
    // All or nothing: one road that cannot be believed, and check A writes no state and makes no proposal.
    let before = state.roads;
    if (out.valid && pretendFirst) {                                   // drill only: as if these stops had been seen GONE that long ago
      const stops = { ...before.stops };
      for (const r of runs.filter((x) => pretendGone.has(L.stopStateKey(x.slug, x.key)))) stops[L.stopStateKey(r.slug, r.key)] = { cite: r.cite, gone: [{ at: new Date(Date.parse(r.at) - pretendFirst * 3600000).toISOString(), reason: 'DRILL: pretended first sighting', plain: L.PLAIN_NO_HOURS }] };
      before = { ...before, stops };
    }
    const applied = L.applyRoadsRun(before, runs, out.valid);
    if (out.valid) { state.roads = applied.state; writeState('roads', applied.state); }
    return { ...out, eligible: applied.eligible, goneOnce: applied.goneOnce, cleared: applied.cleared, runs };
  }

  // --- The directory's open listings (read only: this SELECT is the only statement the job sends) ------------------
  function readListings() {
    const file = opt('--listings-file');
    const sql = 'SELECT id, name, street, city, state, latitude, longitude, website_url FROM breweries WHERE closed_at IS NULL ORDER BY id';
    const raw = file ? readFileSync(file, 'utf8') : execFileSync('npx', ['wrangler', 'd1', 'execute', 'ohio-beer-path-db', '--remote', '--json', '--command', sql], { cwd: root, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
    const rows = JSON.parse(raw.slice(raw.indexOf('[')))[0]?.results;
    if (!Array.isArray(rows) || rows.length < 100) throw new Error(`the directory read returned ${Array.isArray(rows) ? rows.length : 'no'} rows`);
    return rows;
  }
  /** Drill only: an even spread of n rows, the same ones every time for the same list. */
  const sample = (rows, n) => (!drill || !n || n >= rows.length ? rows : Array.from({ length: n }, (_, i) => rows[Math.floor((i * rows.length) / n)]));
  const hashFile = (f) => createHash('sha256').update(readFileSync(f)).digest('hex');
  /**
   * The record of the run that produced an observations file, written beside it only when the check ran to its end:
   * the file's hash, how many listings the directory held and how many were looked at, the commit, and whether the
   * check completed (both canaries passed, the key was accepted, the cap was not reached). A baseline can only be
   * initialised from a file with such a record that says the run completed, whose hash still matches.
   */
  const recordRun = (obsFile, o) => writeJson(`${obsFile}.run.json`, { ...(drill ? { drill: true } : {}), file: obsFile, sha256: hashFile(obsFile), date, source: sourceSha, ...o });
  const who = () => `${userInfo().username}@${hostname()}`;
  const count = (list, key) => list.reduce((c, x) => { const k = String(key(x)); c[k] = (c[k] || 0) + 1; return c; }, {});

  // --- Check B. An internal lead: its detail is written only under <data>/internal/ ------------------------------
  const STATUS_URL = 'https://generativelanguage.googleapis.com/v1beta/interactions';
  const statusPost = (key, input, tool) => fetch(STATUS_URL, { method: 'POST', headers: { 'x-goog-api-key': key, 'content-type': 'application/json', 'Api-Revision': '2026-05-20' }, body: JSON.stringify({ model: 'gemini-4-hydrogen', input, tools: [tool] }), signal: AbortSignal.timeout(120000) });
  /** A response that says the key itself was refused (never one that says the question was bad). */
  async function keyRefused(res) {
    if (res.status === 401 || res.status === 403) return `HTTP ${res.status}`;
    if (res.status === 400) { const t = await res.clone().text().catch(() => ''); if (/API_KEY_INVALID|API key not valid/i.test(t)) return 'HTTP 400, key not valid'; }
    return '';
  }
  /** The key, read here and never printed or logged: GEMINI_API_KEY first, then the Keychain item gemini-veo. The first the service accepts is used. */
  async function statusKey() {
    const keys = [];
    if (process.env.GEMINI_API_KEY?.trim()) keys.push({ from: 'GEMINI_API_KEY', key: process.env.GEMINI_API_KEY.trim() });
    try { const k = execFileSync('security', ['find-generic-password', '-s', 'gemini-veo', '-w'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); if (k && !keys.some((x) => x.key === k)) keys.push({ from: 'the Keychain item gemini-veo', key: k }); } catch { /* no Keychain item */ }
    const tried = []; let requests = 0;
    for (const k of keys) {
      requests++;
      try {
        const res = await statusPost(k.key, 'Reply with the single word READY.', { type: 'google_maps' });
        const refused = await keyRefused(res);
        if (!refused && res.ok) return { key: k.key, requests, why: '' };
        tried.push(`${k.from}: ${refused || `HTTP ${res.status}`}`);
      } catch (e) { tried.push(`${k.from}: ${e?.name === 'TimeoutError' ? 'timed out' : 'network error'}`); }
    }
    return { key: '', requests, why: keys.length ? `no key was accepted (${tried.join('; ')})` : 'no key for the status service (GEMINI_API_KEY, or the Keychain item gemini-veo)' };
  }
  const directoryRuns = (answers) => answers.map((a) => ({ id: a.id, outcome: a.outcome, status: a.status ?? null }));
  async function checkDirectory(listings) {
    const fail = (why) => ({ ran: true, valid: false, why, asked: 0 });
    const rows = sample(listings, Number(opt('--sample-b')) || 0);
    if (rows.length > L.STATUS_REQUEST_CAP) return fail(`${rows.length} listings would need more than the ${L.STATUS_REQUEST_CAP} requests one run may make: not started`);
    const net = await canary();
    if (net) return fail(`could not observe: ${net}`);
    const found = await statusKey(), key = found.key;
    if (!key) return fail(`could not observe: ${found.why}`);
    let requests = found.requests, refused = '';
    const ask = async (r) => {
      const base = { id: r.id, name: r.name, city: r.city, state: r.state };
      if (refused) return { ...base, at: stamp(), outcome: 'UNOBSERVABLE', status: null, why: refused };
      const addr = [r.street, r.city, r.state].filter(Boolean).join(', ');
      const q = `Using Google Maps, find the business "${r.name}" at or near ${addr}. Reply in exactly this form and nothing else:\nSTATUS: OPERATIONAL | CLOSED_TEMPORARILY | CLOSED_PERMANENTLY | NOT_FOUND\nNAME_ON_MAPS: <name>\nADDRESS_ON_MAPS: <address>\nNOTE: <one short sentence, e.g. renamed, moved, or what now occupies the address>`;
      const tool = { type: 'google_maps', ...(r.latitude && r.longitude ? { latitude: r.latitude, longitude: r.longitude } : {}) };
      let answer = '', error = '', shapeOk = false, at = stamp(); const sources = [];
      for (let attempt = 1; attempt <= 2; attempt++) {
        if (requests >= L.STATUS_REQUEST_CAP) { error = 'request cap reached'; break; }
        requests++; at = stamp();
        try {
          const res = await statusPost(key, q, tool);
          const no = await keyRefused(res);
          if (no) { refused = no; error = no; break; }
          if (res.status === 400) { error = 'HTTP 400'; break; }
          if (!res.ok) { error = `HTTP ${res.status}`; await sleep(10000); continue; }
          const j = await res.json(); error = '';
          const outputs = Array.isArray(j?.steps) ? j.steps.filter((st) => st?.type === 'model_output' && Array.isArray(st.content)) : [];
          shapeOk = outputs.length > 0;
          for (const st of outputs) for (const c of st.content) if (c?.type === 'text') { answer += c.text ?? ''; for (const an of c.annotations ?? []) sources.push({ name: String(an?.name ?? an?.title ?? ''), url: String(an?.url ?? '') }); }
          break;
        } catch (e) { error = e?.name === 'TimeoutError' ? 'timed out' : 'network error'; await sleep(5000); }
      }
      const j = error ? { outcome: 'UNOBSERVABLE', status: null, nameOnMaps: '', addressOnMaps: '', source: '', why: error } : L.judgeMapsAnswer({ listingName: r.name, shapeOk, answer, sources });
      return { ...base, at, outcome: j.outcome, status: j.status, name_on_maps: j.nameOnMaps, address_on_maps: j.addressOnMaps, source: j.source, sources: sources.slice(0, 3), why: j.why, note: (answer.match(/^\s*NOTE:\s*(.*)$/m) || [])[1] || '' };
    };
    // Four at a time to the status service, as the one-off sweep this was ported from did (a metered API, not a
    // brewery's site). At about 15 seconds an answer, one at a time would take a full run past five hours.
    const answers = await pool(rows, 4, (r) => `status-service-${r.id}`, ask);
    const obsFile = join(dirs.internal, `${date}-directory.jsonl`);
    writeFileSync(obsFile, answers.map((a) => JSON.stringify(a)).join('\n') + '\n');
    const incomplete = (why) => { recordRun(obsFile, { check: 'b', complete: false, why, directory: listings.length, looked: rows.length }); return fail(why); };
    if (refused) return incomplete(`could not observe: the status service refused our key (${refused})`);
    if (answers.some((a) => a.why === 'request cap reached')) return incomplete(`stopped at the cap of ${L.STATUS_REQUEST_CAP} requests before every listing was asked about`);
    const after = await canary();
    if (after) return incomplete(`could not observe: ${after} by the end of the run`);
    recordRun(obsFile, { check: 'b', complete: true, why: '', directory: listings.length, looked: rows.length });
    const runs = directoryRuns(answers), verdict = L.directoryVerdict(state.directory, runs);
    const transitions = L.directoryTransitions(state.directory.listings, runs), counts = L.transitionCounts(transitions);
    const by = new Map(answers.map((a) => [a.id, a])), named = (a) => `${a.id} ${a.name} (${a.city}, ${a.state})`;
    const others = answers.filter((a) => a.outcome === 'OTHER_BUSINESS_AT_ADDRESS'), unread = answers.filter((a) => a.outcome === 'UNOBSERVABLE');
    writeFileSync(join(dirs.internal, `${date}-directory.md`), [`# Directory status ${date} (internal lead, not for publication)`, '', verdict.valid ? 'The run is valid.' : `The run did NOT update the state: ${verdict.why}. Nothing below is a conclusion.`, '',
      `Observations: ${obsFile} (sha256 ${hashFile(obsFile)})`, `Statuses accepted: ${JSON.stringify(count(answers.filter((a) => a.outcome === 'STATUS'), (a) => a.status))}`, '',
      `## Every change of status (${transitions.length})`, ...transitions.map((t) => { const a = by.get(t.id); return `- ${named(a)}: ${t.from} -> ${t.to}. On Maps: "${a.name_on_maps}", ${a.address_on_maps}. ${a.source} ${a.note}`; }), '',
      `## Another business at the address (${others.length}): a lead, not a status`, ...others.map((a) => `- ${named(a)}: Maps returned "${a.name_on_maps}", ${a.address_on_maps}. ${a.source} ${a.note}`), '',
      `## Not accepted (${unread.length})`, ...unread.map((a) => `- ${named(a)}: ${a.why}`), ''].join('\n'));
    if (verdict.valid) { state.directory = L.mergeDirectoryState(state.directory, runs, date, true); writeState('directory', state.directory); }
    return { ran: true, valid: verdict.valid, why: verdict.why, code: verdict.code, asked: rows.length, requests, counts, transitions: transitions.length, others: others.length, unread: unread.length, accepted: answers.length - others.length - unread.length, obsFile };
  }

  // --- Check C ------------------------------------------------------------------------------------------------------
  async function checkLinks(listings) {
    const net = await canary();
    if (net) return { ran: true, valid: false, why: `could not observe: ${net}`, runs: [], fresh: [], leads: [] };
    const rows = sample(listings.filter((r) => String(r.website_url || '').trim()), Number(opt('--sample-c')) || 0);
    const runs = await pool(rows, 6, (r) => L.registrable(L.hostOfUrl(r.website_url)), async (r) => {
      const url = String(r.website_url).trim(), o = L.isSocialUrl(url) ? { kind: 'error', at: stamp(), why: '' } : await readPage(url, 20000);
      return { id: r.id, name: r.name, city: r.city, state: r.state, url, at: o.at, ...L.classifyLink(r.name, url, o) };
    });
    const obsFile = join(dirs.observations, `${date}-links.jsonl`);
    writeFileSync(obsFile, runs.map((a) => JSON.stringify(a)).join('\n') + '\n');
    const after = await canary();
    if (after) { recordRun(obsFile, { check: 'c', complete: false, why: after, directory: listings.length, looked: rows.length }); return { ran: true, valid: false, why: `could not observe: ${after} by the end of the run`, runs, fresh: [], leads: [], obsFile }; }
    recordRun(obsFile, { check: 'c', complete: true, why: '', directory: listings.length, looked: rows.length });
    const verdict = L.linkVerdict(state.links, runs);
    const fresh = verdict.valid ? L.newLinkProblems(state.links.links, runs) : [], leads = verdict.valid ? L.newLinkLeads(state.links.links, runs) : [];
    if (verdict.valid) { state.links = L.mergeLinkState(state.links, runs, date, true); writeState('links', state.links); }
    return { ran: true, valid: verdict.valid, why: verdict.why, code: verdict.code, runs, fresh, leads, obsFile };
  }

  // --- Initialising a baseline, by a person, from observations they have read ------------------------------------
  // Allowed only when the check has no state. It takes a named observations file from an earlier run in this data
  // directory (nothing is fetched), and sets aside only the first-run prevalence floor: an observations file that was
  // unreadable, short or empty is refused like any run.
  if (init) {
    if (!['b', 'c'].includes(init)) throw new Stop('--init-baseline takes b (directory status) or c (website links)');
    const name = init === 'b' ? 'directory' : 'links', from = opt('--from');
    if (!from) throw new Stop('--init-baseline needs --from, the observations file you reviewed');
    const file = realpathSync(resolve(process.cwd(), from));
    if (!L.insideDir(file, dataDir)) throw new Stop(`the observations file must be one this data directory holds (${dataDir})`);
    if (existsSync(files[name]) || marker[name]) throw new Stop(`the ${name} check already has state: a baseline is initialised once`);
    // The file must be the untouched output of a check that ran to its end: its run record says so and its hash matches.
    let rec; try { rec = JSON.parse(readFileSync(`${file}.run.json`, 'utf8')); } catch { throw new Stop(`${file} has no run record beside it (${basename(file)}.run.json): it is not the output of a completed check`); }
    if (rec.check !== init) throw new Stop(`${file} is the output of check ${String(rec.check).toUpperCase()}, not ${init.toUpperCase()}`);
    if (!rec.complete) throw new Stop(`the run that wrote ${file} did not complete (${rec.why}): it cannot be a baseline`);
    if (rec.sha256 !== hashFile(file)) throw new Stop(`${file} has changed since the run that wrote it: it cannot be a baseline`);
    if (!!rec.drill !== !!drill) throw new Stop(`${file} was ${rec.drill ? '' : 'not '}written by a drill`);
    if (!drill && rec.looked !== rec.directory) throw new Stop(`${file} covers ${rec.looked} of ${rec.directory} listings: a production baseline is the whole directory`);
    const rows = readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
    const runs = init === 'b' ? directoryRuns(rows) : rows, verdict = init === 'b' ? L.directoryVerdict({ listings: {} }, runs) : L.linkVerdict({ links: {} }, runs);
    if (!L.initMayAccept(verdict)) throw new Stop(`these observations cannot be a baseline: ${verdict.why}`);
    const baseline = { date, by: who(), file, hash: hashFile(file), source: rec.source, directory: rec.directory, listings: runs.length, counts: count(rows, (x) => (init === 'b' ? (x.outcome === 'STATUS' ? x.status : x.outcome) : x.cls)) };
    const obsDate = (basename(file).match(/^\d{4}-\d{2}-\d{2}/) || [date])[0];
    writeState(name, init === 'b' ? L.mergeDirectoryState({ baseline, listings: {} }, runs, obsDate, true) : L.mergeLinkState({ baseline, links: {} }, runs, obsDate, true));
    log(`baseline initialised for the ${name} check from ${file}`);
    log(`  by ${baseline.by} on ${date}; ${runs.length} observations; sha256 ${baseline.hash}`);
    log(`  ${JSON.stringify(baseline.counts)}${verdict.code === 'first-run-prevalence' ? `\n  set aside: ${verdict.why}` : ''}`);
    log(`Brewery Trip monthly check ${date}: baseline initialised for the ${name} check from ${runs.length} reviewed observations.`);
    return 0;
  }

  // --- A proposal: the suspension as a patch, built in a disposable worktree, with the evidence beside it ---------
  function propose(eligible) {
    // Which stops may be named: see proposalItems. A brewery whose roads cite different evidence, not all of it gone, is a conflict and is left out.
    const { items: list, conflicts } = L.proposalItems(eligible, roads.map((r) => ({ slug: r.slug, stops: r.stops.map((s) => ({ key: s.key, breweryId: s.breweryId, name: s.name, source: L.sourceOf(s.evidenceUrl, s.evidence) })) })));
    const slugs = [...new Set(list.map((x) => x.slug))];
    const out = join(dirs.proposals, date); mkdirSync(out, { recursive: true });
    const tmp = mkdtempSync(join(tmpdir(), 'brewerytrip-proposal-')), wt = join(tmp, 'checkout'), checks = [];
    const git = (...a) => execFileSync('git', a, { cwd: root, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
    const step = (cmd, args) => { const name = `${cmd} ${args.join(' ')}`; try { execFileSync(cmd, args, { cwd: wt, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 256 * 1024 * 1024, timeout: 30 * 60 * 1000 }); checks.push(`PASSED  ${name}`); return true; } catch (e) { checks.push(`FAILED  ${name} (exit ${e.status ?? '?'})\n${String(e.stdout || '').slice(-6000)}\n${String(e.stderr || '').slice(-3000)}`); return false; } };
    let patch = '', failed = []; const base = sourceSha;               // the proposal is built from the very commit that was observed
    try {
      if (!list.length) throw new Error('every eligible stop is in an evidence conflict');
      git('worktree', 'add', '--detach', wt, base);                    // its own files and its own index: the live checkout is not touched
      if (existsSync(join(root, 'node_modules'))) symlinkSync(realpathSync(join(root, 'node_modules')), join(wt, 'node_modules'));
      const paths = [];
      for (const slug of slugs) {
        const dir = join(wt, 'data/roads', slug), before = `data/roads/${slug}/listed-before-${date}-monthly.json`, file = join(dir, 'suspended.json');
        const had = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : [];
        writeFileSync(join(wt, before), JSON.stringify(roads.find((r) => r.slug === slug).stops.map((s) => ({ ...(s.breweryId !== undefined ? { breweryId: s.breweryId } : { key: s.key }), name: s.name, town: s.town, mile: s.mile, detourMiles: s.detourMiles })), null, 1) + '\n');
        writeFileSync(file, JSON.stringify([...had, ...list.filter((x) => x.slug === slug).map((x) => ({ id: x.id, name: x.name, date, reason: x.order.plain, firstSeen: x.order.firstSeen, confirmed: x.order.confirmed }))], null, 1) + '\n');
        paths.push(before, `data/roads/${slug}/suspended.json`, `src/data/roads/${slug}.built.ts`, `src/data/roads/${slug}.updates.ts`);
      }
      // The first pass is expected to fail its gate for a shared stop until the other road is rebuilt: only the second counts.
      for (const slug of slugs) { try { execFileSync('node', ['scripts/build-road-trip.mjs', slug], { cwd: wt, stdio: 'ignore' }); } catch { /* see the second pass */ } }
      const ok = [];
      for (const slug of slugs) ok.push(step('node', ['scripts/build-road-trip.mjs', slug]));
      for (const slug of slugs) ok.push(step('node', ['scripts/record-road-update.mjs', slug, date, 'A monthly re-check re-read the page each stop cites.', `data/roads/${slug}/listed-before-${date}-monthly.json`]));
      for (const r of roads) ok.push(step('node', ['scripts/build-road-trip.mjs', r.slug, '--check']));
      ok.push(step('npx', ['tsc', '--noEmit']), step('npx', ['vitest', 'run']));
      failed = checks.filter((c) => c.startsWith('FAILED')).map((c) => c.split('\n')[0]);
      execFileSync('git', ['add', '-A', '--', ...paths], { cwd: wt, stdio: 'ignore' });
      patch = execFileSync('git', ['diff', '--cached', 'HEAD', '--', ...paths], { cwd: wt, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
    } catch (e) { failed.push(`the proposal could not be built: ${String(e?.message || e).split('\n')[0]}`); }
    finally {
      try { git('worktree', 'remove', '--force', wt); } catch { /* removed below */ }
      rmSync(tmp, { recursive: true, force: true });
      try { git('worktree', 'prune'); } catch { /* nothing to prune */ }
    }
    if (patch && list.length) writeFileSync(join(out, 'suspension.patch'), patch);
    writeFileSync(join(out, 'checks.log'), checks.join('\n\n') + '\n');
    const stopOf = (o) => roads.find((r) => r.slug === o.slug).stops.find((s) => s.key === o.key);
    writeFileSync(join(out, 'evidence.md'), [`# Proposed suspension, ${date}${drill ? ' (DRILL: not an observation)' : ''}`, '',
      'A person reviews this and applies it through the normal reviewed process. The job has published nothing and changed no file in the checkout.', '', sourceLine, '',
      `Patch: suspension.patch, against commit ${base}. Checks run on the patched copy: checks.log (${failed.length ? `${failed.length} FAILED` : 'all passed'}). The source verifiers were not run on it; run them after applying.`, '',
      ...eligible.flatMap((o) => { const s = stopOf(o); return [`## ${s.name} (${s.town})`, '', `- proposed on: ${list.filter((x) => x.order === o).map((x) => `${x.slug} (${x.id}; ${x.basis === 'observed' ? 'observed there' : 'that road cites the very same page and text, so this is the same evidence'})`).join(', ') || 'no road: evidence conflict, see below'}`, `- cited page: ${s.evidenceUrl}`, `- cited evidence: "${s.evidence}"`, `- the narrow fact: ${o.plain}`,
        `- observations, at least ${L.CONFIRM_AFTER_HOURS} hours apart (${((Date.parse(o.confirmed) - Date.parse(o.firstSeen)) / 3600000).toFixed(1)} hours from first to latest):`, ...o.records.map((g) => `  - ${g.at}: ${g.reason}${g.kept ? `. Page text kept at ${g.kept}` : ''}`), '']; }),
      ...(conflicts.length ? ['## Evidence conflicts: nothing is proposed for these', ...conflicts.map((c) => `- ${c.breweryId} ${c.name}: ${c.why}. A person should look at both citations.`), ''] : []),
      ...(failed.length ? ['## Checks that failed on the patched copy', ...failed.map((f) => `- ${f}`), ''] : [])].join('\n'));
    return { dir: out, list, failed, conflicts, patch: !!patch };
  }

  // --- Run ----------------------------------------------------------------------------------------------------------
  const report = [`# Brewery Trip monthly check, ${date}${confirm ? ' (confirming pass)' : ''}`, '', sourceLine, '', ...(drill ? ['**DRILL: a trial run in its own data directory. Nothing here is a production observation.**', ''] : [])];
  const say = (...lines) => report.push(...lines);
  const status = (c) => (c.valid ? 'ran' : `FAILED: ${c.why}`);
  const outcomes = []; let A = null, B = null, C = null, listings = null, listingsError = '', proposal = null;

  if (only.has('a')) { log(`Check A: road stops${confirm ? ' (confirming pass)' : ''}`); A = await checkRoads(); outcomes.push(A); }
  if (only.has('b') || only.has('c')) { try { listings = readListings(); } catch (e) { listingsError = `could not read the directory (${String(e?.message || e).split('\n')[0].slice(0, 120)})`; } }
  if (only.has('b')) { log('Check B: directory status'); B = listings ? await checkDirectory(listings) : { ran: true, valid: false, why: listingsError }; outcomes.push(B); }
  if (only.has('c')) { log('Check C: website links'); C = listings ? await checkLinks(listings) : { ran: true, valid: false, why: listingsError, runs: [], fresh: [], leads: [] }; outcomes.push(C); }

  if (A) {
    if (A.valid && A.eligible.length) proposal = propose(A.eligible);
    const all = A.roads.flatMap((r) => r.runs), n = (s) => all.filter((r) => r.status === s).length;
    say('## A. Road stops', '', `Status: ${status(A)}${A.valid ? '' : '. Check A wrote no state and made no proposal.'}`, '', ...A.roads.map((r) => `- ${r.name}: ${r.why ? `NOT VALID (${r.why}). ` : ''}${r.read} of ${r.total} stops read; ${r.runs.filter((x) => x.status === 'CONFIRMED').length} confirmed, ${r.runs.filter((x) => x.status === 'GONE').length} gone, ${r.runs.filter((x) => x.status === 'COULD_NOT_OBSERVE').length} could not be observed`), '');
    const item = (r) => `- ${r.slug} ${r.key} ${r.name} (${r.town}): ${r.reason}. ${r.url}${r.kept ? ` (page text kept at ${r.kept})` : ''}`;
    say(`### Gone once (${A.goneOnce.length}): a person should look; the confirming pass re-reads these`, ...(A.goneOnce.length ? A.goneOnce.map(item) : ['- none']), '');
    say(`### Proposed for suspension: GONE on two observations at least 48 hours apart (${A.eligible.length})`, ...(proposal ? proposal.list.map((x) => `- ${x.slug} ${x.id} ${x.name}: ${x.order.plain} (first seen ${x.order.firstSeen}, seen again ${x.order.confirmed})`) : ['- none']), '');
    if (proposal) say(`Nothing was published and no file in the checkout was changed. The proposal is in ${proposal.dir}: suspension.patch${proposal.patch ? '' : ' (NOT written)'}, evidence.md and checks.log. ${proposal.failed.length ? `Checks that failed on the patched copy: ${proposal.failed.join('; ')}.` : 'Builds, tsc and vitest passed on the patched copy.'} A person reviews and applies it; until then each run re-reads these stops and proposes again while they stay gone.`, '', ...(proposal.conflicts.length ? [`Evidence conflicts, nothing proposed (${proposal.conflicts.length}):`, ...proposal.conflicts.map((c) => `- ${c.breweryId} ${c.name}: ${c.why}`), ''] : []));
    if (A.cleared.length) say(`### Seen gone before, found again this time (${A.cleared.length})`, ...A.cleared.map(item), '');
    const flagged = all.filter((r) => r.flag === 'address'), changed = all.filter((r) => r.flag === 'page-changed'), unseen = all.filter((r) => r.status === 'COULD_NOT_OBSERVE' && !r.flag);
    say(`### Page changed, evidence not found (${changed.length}): nothing is concluded; a person should look`, ...(changed.length ? changed.map(item) : ['- none']), '');
    say(`### Address no longer on its page, evidence still there (${flagged.length}): a person should re-read`, ...(flagged.length ? flagged.map(item) : ['- none']), '');
    say(`### Could not observe (${unseen.length}): nothing is concluded about these`, ...(unseen.length ? unseen.map(item) : ['- none']), '');
    A.counts = { confirmed: n('CONFIRMED'), goneOnce: A.goneOnce.length, proposed: A.eligible.length, unobserved: n('COULD_NOT_OBSERVE') };
  }
  const needsInit = (c, letter, file) => (c.code === 'no-baseline' || c.code === 'first-run-prevalence' ? [`No state was written. After reading the observations, a person may initialise the baseline once: \`--init-baseline ${letter} --from ${file}\`.`, ''] : []);
  if (B) {
    say('## B. Directory status', '', `Status: ${status(B)}`, '');
    if (B.asked) say(`${B.asked} listings asked about in ${B.requests} requests: ${B.accepted} statuses accepted, ${B.others} with another business at the address, ${B.unread} not accepted. Counts only; the detail is an internal lead and is kept out of this file.`, '',
      ...(B.valid ? [`- changes of status: ${B.transitions}`, `- newly closed: ${B.counts.newlyClosed}`, `- newly not found: ${B.counts.newlyNotFound}`, `- operational again: ${B.counts.operationalAgain}`, `- other changes (between temporarily and permanently closed, and the like): ${B.counts.other}`] : ['- changes: not concluded']), '', ...needsInit(B, 'b', B.obsFile));
  }
  if (C) {
    say('## C. Website links', '', `Status: ${status(C)}`, '');
    if (C.runs.length) {
      const k = (c) => C.runs.filter((r) => r.cls === c).length, item = (r) => `- ${r.id} ${r.name} (${r.city}, ${r.state}): ${r.cls}. ${r.note}. ${r.url}`;
      say(`${C.runs.length} links: ${['OK', 'MOVED', 'DEAD', 'PARKED', 'HIJACKED', 'OFF_DOMAIN', 'POSSIBLE_TAKEOVER', 'POSSIBLY_MOVED', 'SOCIAL', 'COULD_NOT_OBSERVE'].map((c) => `${k(c)} ${c}`).join(', ')}.`, '', ...needsInit(C, 'c', C.obsFile));
      say(`### New problems (${C.fresh.length})`, ...(C.valid ? (C.fresh.length ? C.fresh.map(item) : ['- none']) : ['- not concluded: the run did not update the state']), '');
      say(`### Leads to review: possible takeover, possibly moved (${C.leads.length} new)`, ...(C.valid ? (C.leads.length ? C.leads.map(item) : ['- none']) : ['- not concluded']), '');
      if (!C.valid) say('### What this run saw (not conclusions)', ...C.runs.filter((r) => [...L.LINK_PROBLEMS, ...L.LINK_LEADS].includes(r.cls)).map(item), '');
      const moved = C.runs.filter((r) => r.cls === 'MOVED'), unseen = C.runs.filter((r) => r.cls === 'COULD_NOT_OBSERVE');
      say(`### Now at another address that names the brewery (${moved.length}): worth a look, not a problem`, ...(moved.length ? moved.map(item) : ['- none']), '');
      say(`### Could not observe (${unseen.length}): nothing is concluded about these`, ...(unseen.length ? unseen.map(item) : ['- none']), '');
    }
  }

  const code = L.exitCode(outcomes);
  const summary = L.summaryLine({ date, a: A ? { ok: A.valid, ...A.counts } : undefined, b: B ? { ok: B.valid, newlyClosed: B.counts?.newlyClosed ?? 0, newlyNotFound: B.counts?.newlyNotFound ?? 0 } : undefined, c: C ? { ok: C.valid, fresh: C.fresh.length } : undefined });
  say('---', '', summary, '');
  const reportFile = join(dirs.reports, `${date}${confirm ? '-confirm' : ''}.md`);
  writeFileSync(reportFile, report.join('\n'));
  log(`report: ${reportFile}`);
  log(summary);
  return code;
}
