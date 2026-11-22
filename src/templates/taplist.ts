import type { TapList } from '../services/taplist';
import { escapeHtml, escapeAttr } from './utils';

/** "November 14, 2026" in US Eastern time, where the breweries are. */
export function tapListDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: 'long', day: 'numeric' }).format(d);
}

function strength(abv: number | null): string {
  return abv === null ? '' : `${String(abv)}% ABV`;
}

/**
 * The "On tap" card for a brewery page. Returns '' when there is no list, so the page shows nothing
 * at all (no empty box). Every value comes from outside this site and is escaped.
 */
export function tapListSection(tapList?: TapList | null): string {
  if (!tapList || !Array.isArray(tapList.beers) || tapList.beers.length === 0) return '';
  const date = tapListDate(tapList.updatedAt);
  if (!date) return '';
  const time = `<time datetime="${escapeAttr(tapList.updatedAt)}">${escapeHtml(date)}</time>`;
  const dateLine = tapList.stale
    ? `<p class="taplist-date taplist-stale"><strong>Last updated ${time}.</strong> This list may have changed since then.</p>`
    : `<p class="taplist-date">Updated ${time}.</p>`;
  const items = tapList.beers.map((b) => {
    const style = b.style ? `<span class="taplist-style">${escapeHtml(b.style)}</span>` : '';
    const notes = b.notes && b.notes.toLowerCase() !== (b.style || '').toLowerCase() ? `<span class="taplist-style">${escapeHtml(b.notes)}</span>` : '';
    const abv = strength(b.abv);
    return `<li><span class="taplist-beer"><span class="taplist-name">${escapeHtml(b.name)}</span>${style}${notes}</span>${abv ? `<span class="taplist-abv">${escapeHtml(abv)}</span>` : ''}</li>`;
  }).join('\n              ');
  const source = tapList.source.replace(/[.\s]+$/, '');

  return `
          <!-- On tap: the brewery's own board, read from a photo. The source line below says where the photo came from. Shown only when an approved list exists. -->
          <section class="content-card brewery-taplist" aria-labelledby="on-tap-heading">
            <style>
              .taplist{list-style:none;margin:0;padding:0;columns:2 17rem;column-gap:2.5rem}
              .taplist li{display:flex;justify-content:space-between;align-items:baseline;gap:1rem;padding:.55rem 0;border-bottom:1px solid var(--bt-line,#e2d5bf);break-inside:avoid}
              .taplist-beer{min-width:0}
              .taplist-name{display:block;font-weight:600;overflow-wrap:anywhere}
              .taplist-style{display:block;font-size:.9rem;color:var(--bt-muted,#6b5546);overflow-wrap:anywhere}
              .taplist-abv{white-space:nowrap;font-variant-numeric:tabular-nums}
              .taplist-date{margin:0 0 .75rem;color:var(--bt-muted,#6b5546)}
              .taplist-date.taplist-stale{color:var(--bt-ink,#241a14);background:#fbeee6;border-left:4px solid var(--bt-brick,#9e3b26);padding:.6rem .8rem}
            </style>
            <h2 id="on-tap-heading"><i class="bi bi-cup-straw text-warning" aria-hidden="true"></i> On tap</h2>
            ${dateLine}
            <ul class="taplist">
              ${items}
            </ul>
            <p class="photo-credit">${escapeHtml(source)}. Beers change, so check with the brewery before you go.</p>
          </section>`;
}
