#!/usr/bin/env node
// The monthly re-check: re-observes what the site claims and reports what changed. Read docs/monthly-check.md first.
//
//   node scripts/monthly-check.mjs                 all three checks
//   node scripts/monthly-check.mjs --confirm       the confirming pass, at least 48 hours later: re-reads only the road
//                                                  stops seen GONE once, and suspends the ones that are GONE again
//   options: --only a,b,c   --sample-b N   --sample-c N   --data-dir DIR   --date YYYY-MM-DD   --listings-file FILE
//            --accept-baseline (a person accepts a first directory or link run that the sanity floor refused)
//
// A. Road stops: every listed stop's cited sources are read again. CONFIRMED, GONE or COULD NOT OBSERVE.
// B. Directory status: every open listing is asked about (an internal lead; detail goes only under <data>/internal/).
// C. Website links: every open listing's website link is fetched and classified.
//
// It only reads: no listing is retired, no stop is added, no address, hours or quote is edited, the database is never
// written. The one change it may make to the site is to suspend a road stop after two valid GONE readings at least 48
// hours apart, and it pushes that only with MONTHLY_AUTOPUBLISH=1 and every pre-publish check passing.
// Exit 0 only when every check asked for observed validly; otherwise 2. The last line of output is a one-sentence summary.
// Needs Node 23.6 or later (it loads the TypeScript libraries directly). No packages beyond the repo's own.
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve } from 'node:path';
import dns from 'node:dns/promises';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2), flag = (n) => argv.includes(n), opt = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
const L = await import(join(root, 'src/lib/monthly-check.ts'));
const R = await import(join(root, 'src/lib/road-trip.ts'));

const UA = 'BreweryTripBot/1.0 (+https://brewerytrip.com/about)';
const now = new Date(), nowIso = now.toISOString(), date = opt('--date') || nowIso.slice(0, 10);
const confirm = flag('--confirm');
const only = new Set((opt('--only') || (confirm ? 'a' : 'a,b,c')).split(',').map((x) => x.trim().toLowerCase()));
const dataDir = opt('--data-dir') ? resolve(process.cwd(), opt('--data-dir')) : join(root, 'data/monthly');
const dirs = { state: join(dataDir, 'state'), internal: join(dataDir, 'internal'), reports: join(dataDir, 'reports'), proposed: join(dataDir, 'proposed') };
for (const d of Object.values(dirs)) mkdirSync(d, { recursive: true });
// A rehearsal of the suspension path without waiting for a real stop to go: MONTHLY_DRILL_GONE="slug/key,slug/key"
// makes those stops read as GONE. Honoured only with a --data-dir of its own and with autopublish off, so a drill can
// never reach the real state or the site; the report says DRILL at the top.
const drill = new Set(opt('--data-dir') && process.env.MONTHLY_AUTOPUBLISH !== '1' ? String(process.env.MONTHLY_DRILL_GONE || '').split(',').map((x) => x.trim()).filter(Boolean) : []);
const readJson = (f, fallback) => (existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : fallback);
const writeJson = (f, v) => writeFileSync(f, JSON.stringify(v, null, 1) + '\n');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);

// ---------------------------------------------------------------------------------------------------------------------
// Reading a page: one honest request, at most one retry, nothing that gets around a refusal.

const noName = (e) => ['ENOTFOUND', 'ENODATA'].includes(e?.code);
/** True only when DNS says the name does not exist AND names known to be good resolve at that same moment. */
async function noSuchDomain(host) {
  const tries = await Promise.allSettled([dns.resolve4(host), dns.resolve6(host)]);
  if (!tries.every((t) => t.status === 'rejected' && noName(t.reason))) return false;
  const good = await Promise.allSettled([dns.resolve4('brewerytrip.com'), dns.resolve4('example.com')]);
  return good.every((t) => t.status === 'fulfilled');
}
async function readPage(url, timeout = 30000) {
  let last = { kind: 'error', why: 'not tried' };
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const r = await fetch(/^[a-z][a-z0-9+.-]*:\/\//i.test(url) ? url : `http://${url}`, { headers: { 'user-agent': UA, accept: 'text/html,*/*;q=0.5' }, redirect: 'follow', signal: AbortSignal.timeout(timeout) });
      const type = r.headers.get('content-type') || '';
      if (r.status === 200 && type && !/html|text/i.test(type)) return { kind: 'error', why: `not a text page (${type})` };
      // The whole page or nothing: a page cut short would make text near its end look as if it had gone.
      const html = await r.text();
      if (html.length > 25000000) return { kind: 'error', why: 'the page is too large to read whole' };
      const title = R.pageText((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '').slice(0, 300);
      const meta = [...html.matchAll(/<meta\b[^>]*\b(?:name|property)=["'](?:description|og:description)["'][^>]*>/gi)].map((m) => R.pageText((m[0].match(/\bcontent=(["'])([\s\S]*?)\1/i) || [])[2] || '')).join(' \n ');
      last = { kind: 'page', status: r.status, text: R.pageText(html), meta, title, finalUrl: r.url || url };
      if (r.status < 500) return last;                                 // a refusal (403, 429) is an answer: no retry
    } catch (e) {
      const cause = e?.cause;
      if (noName(cause) || cause?.code === 'EAI_AGAIN') { if (await noSuchDomain(L.hostOfUrl(url))) return { kind: 'no-such-domain' }; last = { kind: 'error', why: 'the name did not resolve, and neither did our known-good names (network?)' }; }
      else last = { kind: 'error', why: e?.name === 'TimeoutError' ? 'timed out' : `network error${cause?.code ? ` (${cause.code})` : ''}` };
    }
    if (attempt === 1) await sleep(2000);
  }
  return last;
}
/** Are we on the network at all? Our own site answers and a known name resolves. */
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
      const mine = before.then(() => work(items[i], i)).catch((e) => ({ failed: String(e?.message || e) }));
      busy.set(h, mine.then(() => sleep(300)));
      out[i] = await mine;
    }
  };
  await Promise.all(Array.from({ length: size }, one));
  return out;
}

// ---------------------------------------------------------------------------------------------------------------------
// The roads, as built

async function loadRoads() {
  const roads = [];
  for (const f of readdirSync(join(root, 'src/data/roads')).filter((x) => /\.built\.ts$/.test(x)).sort()) {
    const slug = f.replace(/\.built\.ts$/, '');
    const built = Object.values(await import(join(root, 'src/data/roads', f))).find((v) => v && Array.isArray(v.stops));
    const config = Object.values(await import(join(root, `src/data/roads/${slug}.ts`))).find((v) => v && typeof v === 'object' && v.slug === slug);
    if (built && config?.publish === true) roads.push({ slug, name: config.shortName || slug, stops: built.stops });
  }
  return roads;
}

// ---------------------------------------------------------------------------------------------------------------------
// Check A

async function checkRoads(roads) {
  const stateFile = join(dirs.state, 'roads.json'), state = readJson(stateFile, { stops: {} });
  const out = { ran: true, valid: true, why: '', roads: [], suspend: [], state, stateFile, changed: false };
  const net = await canary();
  if (net) return { ...out, valid: false, why: `could not observe: ${net}` };
  const pending = new Set(L.pendingKeys(state));
  const pages = new Map(), page = async (u) => { if (!pages.has(u)) pages.set(u, await readPage(u)); return pages.get(u); };
  const found = (o, quote) => o.kind === 'page' && (R.excerptFound(o.text, quote) || R.excerptFound(o.meta, quote));
  let next = state;
  for (const road of roads) {
    const stops = confirm ? road.stops.filter((s) => pending.has(L.stopStateKey(road.slug, s.key))) : road.stops;
    const runs = [];
    for (const s of stops) {
      const e = await page(s.evidenceUrl), a = s.address ? await page(s.addressSourceUrl) : null;
      const r = drill.has(L.stopStateKey(road.slug, s.key)) ? { status: 'GONE', reason: 'DRILL: pretended gone', plain: L.PLAIN_NO_HOURS } : L.classifyStop({ evidencePage: e, evidenceFound: found(e, s.evidence), evidenceKind: s.evidenceKind, address: s.address ? { page: a, found: found(a, s.address) } : null, browserChecked: s.browserChecked });
      runs.push({ slug: road.slug, key: s.key, name: s.name, town: s.town, breweryId: s.breweryId, url: s.evidenceUrl, known: !!s.browserChecked && R.unreadVerdict(s.browserChecked, date) === 'browser-checked', ...r });
      log(`  ${road.slug} ${r.status.padEnd(17)} ${s.key} ${s.name}${r.status === 'CONFIRMED' ? '' : `: ${r.reason}`}`);
    }
    const gone = runs.filter((r) => r.status === 'GONE').length, unobserved = runs.filter((r) => r.status === 'COULD_NOT_OBSERVE' && !r.known).length;
    // Both floors are measured against the whole road, so a confirm pass over two stops is not "100% gone".
    const why = L.floorTripped(gone, road.stops.length) ? `${gone} of ${road.stops.length} stops came back GONE in one run: treated as a broken run, nothing concluded`
      : L.floorTripped(unobserved, road.stops.length, L.UNOBSERVED_MAX) ? `${unobserved} of ${road.stops.length} stops could not be observed` : '';
    const applied = L.applyRoadRun(next, runs, nowIso, !why);
    next = applied.state;
    out.roads.push({ slug: road.slug, name: road.name, total: road.stops.length, read: runs.length, valid: !why, why, runs, goneOnce: why ? [] : applied.goneOnce, cleared: applied.cleared, suspend: applied.suspend });
    out.suspend.push(...applied.suspend);
    if (why) { out.valid = false; out.why = [out.why, `${road.slug}: ${why}`].filter(Boolean).join('; '); }
  }
  const after = await canary();
  if (after) return { ...out, roads: out.roads.map((r) => ({ ...r, valid: false, why: `could not observe: ${after} by the end of the run`, goneOnce: [], suspend: [] })), suspend: [], valid: false, why: `could not observe: ${after} by the end of the run` };
  out.state = next; out.changed = next !== state;
  return out;
}

// ---------------------------------------------------------------------------------------------------------------------
// The directory's open listings (read only)

function readListings() {
  const file = opt('--listings-file');
  const sql = 'SELECT id, name, street, city, state, latitude, longitude, website_url FROM breweries WHERE closed_at IS NULL ORDER BY id';
  const raw = file ? readFileSync(file, 'utf8') : execFileSync('npx', ['wrangler', 'd1', 'execute', 'ohio-beer-path-db', '--remote', '--json', '--command', sql], { cwd: root, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
  const rows = JSON.parse(raw.slice(raw.indexOf('[')))[0]?.results;
  if (!Array.isArray(rows) || rows.length < 100) throw new Error(`the directory read returned ${Array.isArray(rows) ? rows.length : 'no'} rows`);
  return rows;
}
/** An even spread of n rows, the same ones every time for the same list. */
const sample = (rows, n) => (!n || n >= rows.length ? rows : Array.from({ length: n }, (_, i) => rows[Math.floor((i * rows.length) / n)]));

// ---------------------------------------------------------------------------------------------------------------------
// Check B. An internal lead: its detail is written only under <data>/internal/, which git ignores.

const STATUS_URL = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const statusPost = (key, input, tool) => fetch(STATUS_URL, { method: 'POST', headers: { 'x-goog-api-key': key, 'content-type': 'application/json', 'Api-Revision': '2026-05-20' }, body: JSON.stringify({ model: 'gemini-4-hydrogen', input, tools: [tool] }), signal: AbortSignal.timeout(120000) });
/** A response that says the key itself was refused (never one that says the question was bad). */
async function keyRefused(res) {
  if (res.status === 401 || res.status === 403) return `HTTP ${res.status}`;
  if (res.status === 400) { const t = await res.clone().text().catch(() => ''); if (/API_KEY_INVALID|API key not valid/i.test(t)) return 'HTTP 400, key not valid'; }
  return '';
}
/**
 * The key, read here and never printed or logged: the environment's GEMINI_API_KEY first, then the macOS Keychain
 * item gemini-veo. Each candidate is tried with one small request; the first the service accepts is used.
 */
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
async function checkDirectory(listings) {
  const stateFile = join(dirs.internal, 'directory-state.json'), prev = readJson(stateFile, {});
  const fail = (why) => ({ ran: true, valid: false, why, asked: 0, changes: null, first: !Object.keys(prev).length });
  const rows = sample(listings, Number(opt('--sample-b')) || 0);
  if (rows.length > L.STATUS_REQUEST_CAP) return fail(`${rows.length} listings would need more than the ${L.STATUS_REQUEST_CAP} requests one run may make: not started`);
  const found = await statusKey(), key = found.key;
  if (!key) return fail(`could not observe: ${found.why}`);
  let requests = found.requests, refused = '';
  const ask = async (r) => {
    if (refused) return { id: r.id, status: null, error: refused };
    const addr = [r.street, r.city, r.state].filter(Boolean).join(', ');
    const q = `Using Google Maps, find the business "${r.name}" at or near ${addr}. Reply in exactly this form and nothing else:\nSTATUS: OPERATIONAL | CLOSED_TEMPORARILY | CLOSED_PERMANENTLY | NOT_FOUND\nNAME_ON_MAPS: <name>\nADDRESS_ON_MAPS: <address>\nNOTE: <one short sentence, e.g. renamed, moved, or what now occupies the address>`;
    const tool = { type: 'google_maps', ...(r.latitude && r.longitude ? { latitude: r.latitude, longitude: r.longitude } : {}) };
    let answer = '', error = '';
    for (let attempt = 1; attempt <= 2; attempt++) {
      if (requests >= L.STATUS_REQUEST_CAP) { error = 'request cap reached'; break; }
      requests++;
      try {
        const res = await statusPost(key, q, tool);
        const no = await keyRefused(res);
        if (no) { refused = no; error = no; break; }
        if (res.status === 400) { error = 'HTTP 400'; break; }
        if (!res.ok) { error = `HTTP ${res.status}`; await sleep(10000); continue; }
        const j = await res.json(); error = '';
        for (const st of j.steps ?? []) if (st.type === 'model_output') for (const c of st.content ?? []) if (c.type === 'text') answer += c.text ?? '';
        break;
      } catch (e) { error = e?.name === 'TimeoutError' ? 'timed out' : 'network error'; await sleep(5000); }
    }
    return { id: r.id, name: r.name, city: r.city, state: r.state, status: L.parseMapsStatus(answer), answer: answer.trim(), error };
  };
  // Four at a time to the status service, as the one-off sweep this was ported from did (a metered API, not a brewery's
  // site). At about 15 seconds an answer, one at a time would take a full run past five hours.
  const answers = await pool(rows, 4, (r) => `status-service-${r.id}`, ask);
  if (refused) return fail(`could not observe: the status service refused our key (${refused})`);
  if (requests >= L.STATUS_REQUEST_CAP && answers.some((a) => a?.error === 'request cap reached')) return fail(`stopped at the cap of ${L.STATUS_REQUEST_CAP} requests before every listing was asked about`);
  const runs = answers.map((a) => ({ id: a.id, status: a.status ?? null }));
  let verdict = L.directoryRunValid(prev, runs);
  if (!verdict.valid && flag('--accept-baseline') && !Object.keys(prev).length) verdict = { valid: true, why: '' };
  const changes = L.directoryChanges(prev, runs);
  // Internal detail: answers and the names behind the counts. Never committed (see .gitignore).
  writeFileSync(join(dirs.internal, `${date}-directory.jsonl`), answers.map((a) => JSON.stringify(a)).join('\n') + '\n');
  const by = new Map(answers.map((a) => [a.id, a])), line = (id) => { const a = by.get(id); return `- ${id} ${a.name} (${a.city}, ${a.state}): was ${prev[String(id)]?.status}, now ${a.status}. ${(a.answer.match(/NOTE:\s*(.*)/) || [])[1] || ''}`; };
  writeFileSync(join(dirs.internal, `${date}-directory.md`), [`# Directory status ${date} (internal lead, not for publication)`, '', verdict.valid ? 'The run is valid.' : `The run is NOT valid: ${verdict.why}. Nothing below is a conclusion.`, '',
    `## Newly closed (${changes.newlyClosed.length})`, ...changes.newlyClosed.map(line), '', `## Newly not found (${changes.newlyNotFound.length})`, ...changes.newlyNotFound.map(line), '', `## Operational again (${changes.operationalAgain.length})`, ...changes.operationalAgain.map(line), '',
    `## Could not be read (${changes.unparsed})`, ...answers.filter((a) => !a.status).map((a) => `- ${a.id} ${a.name}: ${a.error || 'answer not in the form asked for'}`), ''].join('\n'));
  if (verdict.valid) writeJson(stateFile, L.mergeDirectoryState(prev, runs, date, true));
  return { ran: true, valid: verdict.valid, why: verdict.why, asked: rows.length, requests, changes, first: !Object.keys(prev).length };
}

// ---------------------------------------------------------------------------------------------------------------------
// Check C

async function checkLinks(listings) {
  const stateFile = join(dirs.state, 'links.json'), prev = readJson(stateFile, {});
  const net = await canary();
  if (net) return { ran: true, valid: false, why: `could not observe: ${net}`, runs: [], fresh: [], first: !Object.keys(prev).length };
  const rows = sample(listings.filter((r) => String(r.website_url || '').trim()), Number(opt('--sample-c')) || 0);
  const runs = await pool(rows, 6, (r) => L.registrable(L.hostOfUrl(r.website_url)), async (r) => {
    const url = String(r.website_url).trim();
    const c = L.isSocialUrl(url) ? L.classifyLink(r.name, url, { kind: 'error', why: '' }) : L.classifyLink(r.name, url, await readPage(url, 20000));
    return { id: r.id, name: r.name, city: r.city, state: r.state, url, ...c };
  });
  const after = await canary();
  if (after) return { ran: true, valid: false, why: `could not observe: ${after} by the end of the run`, runs, fresh: [], first: !Object.keys(prev).length };
  let verdict = L.linkRunValid(prev, runs);
  if (!verdict.valid && flag('--accept-baseline') && !Object.keys(prev).length) verdict = { valid: true, why: '' };
  if (verdict.valid) writeJson(stateFile, L.mergeLinkState(prev, runs, date, true));
  return { ran: true, valid: verdict.valid, why: verdict.why, runs, fresh: verdict.valid ? L.newLinkProblems(prev, runs) : [], first: !Object.keys(prev).length };
}

// ---------------------------------------------------------------------------------------------------------------------
// Suspending: the one change the job may make. Files are changed, every pre-publish check is run, and then the change
// is pushed, or written out as a proposal and undone. Nothing is published on a failed check.

const git = (...a) => execFileSync('git', a, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const checksLog = [];
/** Runs one command of the pre-publish checks. '' when it passed; otherwise what failed. Its output is kept for the checks log. */
function run(cmd, args) {
  const name = `${cmd} ${args.join(' ')}`;
  try { execFileSync(cmd, args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 256 * 1024 * 1024, timeout: 30 * 60 * 1000 }); checksLog.push(`PASSED  ${name}`); return ''; }
  catch (e) { checksLog.push(`FAILED  ${name} (exit ${e.status ?? '?'})\n${String(e.stdout || '').slice(-6000)}\n${String(e.stderr || '').slice(-3000)}`); return `${name}: exit ${e.status ?? '?'}`; }
}

function suspend(orders, roads) {
  const list = L.suspensionsByRoad(orders, roads), slugs = [...new Set(list.map((x) => x.slug))];
  // Every file about to change is remembered exactly as it is now (or as absent), so the change can be undone
  // whatever git knows about it.
  const was = new Map(), keep = (f) => { if (!was.has(f)) was.set(f, existsSync(f) ? readFileSync(f) : null); };
  const problems = [];
  for (const slug of slugs) {
    const dir = join(root, 'data/roads', slug), before = join(dir, `listed-before-${date}-monthly.json`), file = join(dir, 'suspended.json');
    for (const f of [before, file, join(root, `src/data/roads/${slug}.built.ts`), join(root, `src/data/roads/${slug}.updates.ts`)]) keep(f);
    if (existsSync(before)) { problems.push(`${relative(root, before)} is already there: a monthly update was already prepared for this road today`); continue; }
    writeJson(before, roads.find((r) => r.slug === slug).stops.map((s) => ({ ...(s.breweryId !== undefined ? { breweryId: s.breweryId } : { key: s.key }), name: s.name, town: s.town, mile: s.mile, detourMiles: s.detourMiles })));
    writeJson(file, [...readJson(file, []), ...list.filter((x) => x.slug === slug).map((x) => ({ id: x.id, name: x.name, date, reason: x.order.plain, firstSeen: x.order.firstSeen, confirmed: x.order.confirmed }))]);
  }
  const allSlugs = roads.map((r) => r.slug);
  if (!problems.length) {
    // Each road once (a shared stop leaves the first build disagreeing with the road not yet rebuilt), then the gates.
    // The first pass is expected to fail its gate for a shared stop until the other road is rebuilt: only the second counts.
    for (const slug of slugs) { try { execFileSync('node', ['scripts/build-road-trip.mjs', slug], { cwd: root, stdio: 'ignore' }); } catch { /* see the second pass */ } }
    for (const slug of slugs) problems.push(run('node', ['scripts/build-road-trip.mjs', slug]));
    for (const slug of slugs) problems.push(run('node', ['scripts/record-road-update.mjs', slug, date, 'A monthly re-check re-read the page each stop cites.', `data/roads/${slug}/listed-before-${date}-monthly.json`]));
    for (const slug of allSlugs) problems.push(run('node', ['scripts/build-road-trip.mjs', slug, '--check']));
    problems.push(run('npx', ['tsc', '--noEmit']), run('npx', ['vitest', 'run']));
    for (const slug of allSlugs) problems.push(run('node', ['scripts/verify-road-sources.mjs', slug]));
  }
  const failed = problems.filter(Boolean);
  let onMain = false, upToDate = false;
  try { onMain = git('rev-parse', '--abbrev-ref', 'HEAD') === 'main'; git('fetch', '--quiet', 'origin', 'main'); upToDate = git('rev-parse', 'HEAD') === git('rev-parse', 'origin/main'); } catch { /* no remote: stays false */ }
  const decision = L.publishDecision({ autopublish: process.env.MONTHLY_AUTOPUBLISH, suspensions: list.length, gatesPassed: !failed.length, onMain, upToDate });
  writeFileSync(join(dirs.proposed, `${date}-checks.log`), checksLog.join('\n\n') + '\n');
  return { list, slugs, was, paths: [...was.keys()].map((f) => relative(root, f)), failed, ...decision };
}
/** Writes the change out as a patch for a person, then puts every file back exactly as it was. */
function proposeAndUndo(s) {
  const patch = join(dirs.proposed, `${date}-suspension.patch`);
  try {
    // An index of its own, so the real index is never touched: the patch is the difference from HEAD for these paths.
    const env = { ...process.env, GIT_INDEX_FILE: join(dirs.proposed, `.index-${process.pid}`) };
    const g = (...a) => execFileSync('git', a, { cwd: root, encoding: 'utf8', env, maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
    g('read-tree', 'HEAD'); g('add', '-A', '--', ...s.paths.filter((p) => existsSync(join(root, p))));
    writeFileSync(patch, g('diff', '--cached', 'HEAD', '--', ...s.paths));
    unlinkSync(env.GIT_INDEX_FILE);
  } catch (e) { writeFileSync(patch, `could not write the patch: ${String(e?.message || e).split('\n')[0]}\n`); }
  for (const [f, content] of s.was) { if (content === null) { if (existsSync(f)) unlinkSync(f); } else writeFileSync(f, content); }
  return patch;
}

// ---------------------------------------------------------------------------------------------------------------------
// Run

const report = [`# Brewery Trip monthly check, ${date}${confirm ? ' (confirming pass)' : ''}`, '', ...(drill.size ? ['**DRILL: some stops were made to read as GONE on purpose. Nothing here is an observation.**', ''] : [])];
const say = (...lines) => report.push(...lines);
const status = (c) => (c.valid ? 'ran' : `FAILED: ${c.why}`);
const outcomes = []; let A = null, B = null, C = null, listings = null, listingsError = '', pub = { decision: 'nothing', why: '' }, suspended = null;

const roads = await loadRoads();
if (only.has('a')) {
  log(`Check A: road stops${confirm ? ' (confirming pass)' : ''}`);
  A = await checkRoads(roads); outcomes.push(A);
}
if (only.has('b') || only.has('c')) {
  try { listings = readListings(); } catch (e) { listingsError = `could not read the directory (${String(e?.message || e).split('\n')[0].slice(0, 120)})`; }
}
if (only.has('b')) { log('Check B: directory status'); B = listings ? await checkDirectory(listings) : { ran: true, valid: false, why: listingsError }; outcomes.push(B); }
if (only.has('c')) { log('Check C: website links'); C = listings ? await checkLinks(listings) : { ran: true, valid: false, why: listingsError, runs: [], fresh: [] }; outcomes.push(C); }

if (A) {
  // State first: sightings and re-confirmations from valid roads. A road that could not be observed changed nothing.
  if (A.changed) writeJson(A.stateFile, A.state);
  if (A.suspend.length) {
    suspended = suspend(A.suspend, roads); pub = { decision: suspended.decision, why: suspended.why };
  }
  const all = A.roads.flatMap((r) => r.runs), n = (s) => all.filter((r) => r.status === s).length;
  say('## A. Road stops', '', `Status: ${status(A)}`, '', ...A.roads.map((r) => `- ${r.name}: ${r.valid ? '' : `NOT VALID (${r.why}). `}${r.read} of ${r.total} stops read; ${r.runs.filter((x) => x.status === 'CONFIRMED').length} confirmed, ${r.runs.filter((x) => x.status === 'GONE').length} gone, ${r.runs.filter((x) => x.status === 'COULD_NOT_OBSERVE').length} could not be observed`), '');
  const item = (r) => `- ${r.slug} ${r.key} ${r.name} (${r.town}): ${r.reason}. ${r.url}`;
  const once = A.roads.flatMap((r) => r.goneOnce);
  say(`### Gone once (${once.length}): a person should look; the confirming pass re-reads these`, ...(once.length ? once.map(item) : ['- none']), '');
  say(`### To suspend after a second reading at least 48 hours later (${A.suspend.length})`, ...(suspended ? suspended.list.map((x) => `- ${x.slug} ${x.id} ${x.name}: ${x.order.plain} (first seen ${x.order.firstSeen.slice(0, 10)}, confirmed ${x.order.confirmed.slice(0, 10)})`) : ['- none']), '');
  if (suspended) say(`Publishing: ${pub.decision}${pub.why ? ` (${pub.why})` : ''}.`, ...(suspended.failed.length ? ['Pre-publish checks that failed:', ...suspended.failed.map((f) => `- ${f}`)] : ['Every pre-publish check passed.']), '');
  const back = A.roads.flatMap((r) => r.cleared);
  if (back.length) say(`### Seen gone before, found again this time (${back.length})`, ...back.map(item), '');
  const flagged = all.filter((r) => r.flag === 'address'), unseen = all.filter((r) => r.status === 'COULD_NOT_OBSERVE' && r.flag !== 'address');
  say(`### Address no longer on its page, evidence still there (${flagged.length}): a person should re-read`, ...(flagged.length ? flagged.map(item) : ['- none']), '');
  say(`### Could not observe (${unseen.length}): nothing is concluded about these`, ...(unseen.length ? unseen.map(item) : ['- none']), '');
  A.counts = { confirmed: n('CONFIRMED'), goneOnce: once.length, suspended: A.suspend.length, unobserved: n('COULD_NOT_OBSERVE') };
}
if (B) {
  say('## B. Directory status', '', `Status: ${status(B)}`, '');
  if (B.changes) say(`${B.asked} listings asked about in ${B.requests} requests. ${B.first ? 'First run: this is the baseline, so no change can be reported. ' : ''}Counts only; the detail is an internal lead and is kept out of this file.`, '',
    `- newly closed: ${B.valid ? B.changes.newlyClosed.length : 'not concluded'}`, `- newly not found: ${B.valid ? B.changes.newlyNotFound.length : 'not concluded'}`, `- operational again: ${B.valid ? B.changes.operationalAgain.length : 'not concluded'}`, `- answers that could not be read: ${B.changes.unparsed}`, '');
}
if (C) {
  say('## C. Website links', '', `Status: ${status(C)}`, '');
  if (C.runs.length) {
    const k = (c) => C.runs.filter((r) => r.cls === c).length, item = (r) => `- ${r.id} ${r.name} (${r.city}, ${r.state}): ${r.cls}. ${r.note}. ${r.url}`;
    say(`${C.runs.length} links: ${['OK', 'MOVED', 'DEAD', 'PARKED', 'HIJACKED', 'OFF_DOMAIN', 'SOCIAL', 'COULD_NOT_OBSERVE'].map((c) => `${k(c)} ${c}`).join(', ')}.${C.first ? ' First run: every problem found is listed as new.' : ''}`, '');
    say(`### New problems (${C.fresh.length})`, ...(C.valid ? (C.fresh.length ? C.fresh.map(item) : ['- none']) : ['- not concluded: the run was not valid']), '');
    const moved = C.runs.filter((r) => r.cls === 'MOVED');
    say(`### Now at another address that names the brewery (${moved.length}): worth a look, not a problem`, ...(moved.length ? moved.map(item) : ['- none']), '');
    const unseen = C.runs.filter((r) => r.cls === 'COULD_NOT_OBSERVE');
    say(`### Could not observe (${unseen.length}): nothing is concluded about these`, ...(unseen.length ? unseen.map(item) : ['- none']), '');
  }
}

// Publish or propose. The report is written first so that a published commit carries it.
let proposal = '';
if (suspended && pub.decision !== 'push') proposal = proposeAndUndo(suspended);
if (proposal) say(`The suspension was not published. The proposed change is in ${proposal} (the output of the pre-publish checks is beside it); apply it with \`git apply\` after review. The files were put back as they were.`, '');
const code = L.exitCode(outcomes);
const summary = L.summaryLine({ date, a: A ? { ok: A.valid, ...A.counts } : undefined, b: B ? { ok: B.valid, newlyClosed: B.changes?.newlyClosed.length ?? 0, newlyNotFound: B.changes?.newlyNotFound.length ?? 0 } : undefined, c: C ? { ok: C.valid, fresh: C.fresh.length } : undefined, published: pub.decision });
say('---', '', summary, '');
const reportFile = join(dirs.reports, `${date}${confirm ? '-confirm' : ''}.md`);
writeFileSync(reportFile, report.join('\n'));
if (suspended && pub.decision === 'push') {
  try {
    // State and report ride along when they live inside the repository (the default data directory).
    git('add', '-A', '--', ...suspended.paths, ...[dirs.state, reportFile].map((p) => relative(root, p)).filter((p) => !p.startsWith('..')));
    git('commit', '--quiet', '-m', `roads: suspend ${suspended.list.length} stop listing(s) after the monthly re-check of ${date}, pending review\n\nTwo valid readings at least 48 hours apart found that the cited page no longer supports each listing.\nTesting: builds --check, tsc, vitest and the source verifiers for every road passed in this run.\nRisk: low; a suspended stop is taken off a page and can be put back.\nHow to revert: git revert this commit.`);
    git('push', 'origin', 'main');
  } catch (e) { log(`PUBLISH FAILED after the commit step: ${String(e?.message || e).split('\n')[0]}. Nothing more was attempted.`); }
}
log(`report: ${relative(process.cwd(), reportFile)}`);
log(summary);
process.exit(code);
