// Renders the /roads pages to plain HTML files so they can be looked at without wrangler or a database:
//   npx tsx scripts/preview-roads.ts <out-dir> [--fixtures]
//   python3 -m http.server 8799 --directory <out-dir>      then open http://localhost:8799/roads/
// Writes <out-dir>/roads/index.html and <out-dir>/roads/<slug>/index.html from the real data in src/data/roads, and
// links the repo's assets/ into <out-dir> so the site's own CSS loads.
// --fixtures also writes <out-dir>/fixture/: every directory candidate treated as if it had been checked, with made-up
// quotes, to look at the layout at full density. Those pages carry a banner and must never be published.
import { mkdirSync, writeFileSync, readFileSync, symlinkSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { availableRoads } from '../src/data/roads';
import { US_422 } from '../src/data/roads/us-422';
import { buildRoad, viewRoad, type CandidateRow, type VerifiedRow } from '../src/lib/road-trip';
import { roadTripPage, roadsIndexPage } from '../src/templates/road-trip';

const out = resolve(process.argv[2] || '');
if (!process.argv[2]) { console.error('usage: npx tsx scripts/preview-roads.ts <out-dir> [--fixtures]'); process.exit(2); }
const root = resolve(__dirname, '..');
const write = (path: string, html: string) => { const f = join(out, path, 'index.html'); mkdirSync(join(out, path), { recursive: true }); writeFileSync(f, html); console.log(`wrote ${f}`); };
mkdirSync(out, { recursive: true });
if (!existsSync(join(out, 'assets'))) symlinkSync(join(root, 'assets'), join(out, 'assets'));

const roads = availableRoads();
if (!roads.length) console.log('no road has checked stops yet: /roads would answer 404');
else { write('roads', roadsIndexPage(roads)); for (const r of roads) write(`roads/${r.config.slug}`, roadTripPage(r)); }

if (process.argv.includes('--fixtures')) {
  const dir = join(root, 'data/roads/us-422');
  const candidates: CandidateRow[] = JSON.parse(readFileSync(join(dir, 'candidates.json'), 'utf8'));
  const rows: VerifiedRow[] = candidates.map((c) => ({
    id: c.id, name: c.name, status: 'OPEN', official_url: 'https://example.com/', address_as_printed: c.id % 5 ? `${c.id} Fixture Street, ${c.city}, ${c.state}` : null, address_source_url: 'https://example.com/visit',
    quote: 'FIXTURE: this is not a real quote. It stands in for the sentence a checker would copy from the brewery site.', quote_source_url: 'https://example.com/about', checked: '2026-11-22',
  }));
  const view = viewRoad(US_422, buildRoad(US_422, JSON.parse(readFileSync(join(dir, 'osm-ways.json'), 'utf8')), candidates, rows, '2026-11-22').road);
  const banner = '<div role="alert" style="background:#9e3b26;color:#fff;padding:.75rem 1rem;font-weight:700;text-align:center">PREVIEW WITH FIXTURE DATA: these breweries have NOT been checked and the quotes are made up. Not for publication.</div>';
  const tapLists = new Map<number, string | null>([[218, new Date(Date.now() - 3 * 86_400_000).toISOString()]]);
  const mark = (html: string) => html.replace(/<body[^>]*>/, (m) => m + banner);
  write('fixture/roads', mark(roadsIndexPage([view])));
  write('fixture/roads/us-422', mark(roadTripPage(view, { tapLists })));
}
