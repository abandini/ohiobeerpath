// /cleveland-beer-of-the-month: one seasonal tradition and the Northeast Ohio beers that carry it (data in
// src/data/beer-of-the-month.ts). Uses the trail page styles (trail-hero, trail-stats, trail-stop).
import { layout } from './layout';
import { escapeAttr as e, jsonLd } from './utils';
import type { SubdomainContext } from '../types';
import { BEER_OF_THE_MONTH, type Pour, type Source } from '../data/beer-of-the-month';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const longDate = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return `${MONTHS[m - 1]} ${d}, ${y}`; };
const host = (u: string) => new URL(u).hostname.replace(/^www\./, '');
const cite = (s: Source) => `<a href="${e(s.url)}" rel="noopener" target="_blank">${e(s.publisher || host(s.url))}</a>, checked ${e(longDate(s.checked))}`;
const quote = (s: Source) => `<blockquote class="mb-1 border-start ps-2">“${e(s.quote)}”</blockquote><div class="small text-muted mb-2">${cite(s)}</div>`;
const breweryLink = (name: string, id?: number) => id ? `<a href="/brewery/${id}" class="text-dark">${e(name)}</a>` : e(name);

function pourCard(p: Pour, i: number): string {
  const status = p.confirmed2026
    ? '<span class="badge bg-success">2026 release confirmed</span>'
    : '<span class="badge bg-secondary">2026 release not confirmed</span>';
  return `
          <div class="trail-stop" id="beer-${i + 1}">
            <div class="stop-number">${i + 1}</div>
            <div class="stop-info">
              <h3 class="h4">${e(p.beer)}</h3>
              <p class="stop-meta mb-1">${breweryLink(p.brewery, p.breweryId)} · <i class="bi bi-geo-alt" aria-hidden="true"></i> ${e(p.town)}</p>
              <p class="mb-2">${status}</p>
              ${p.identity ? quote(p.identity) : ''}${quote(p.about)}
              ${p.when ? `<p class="small mb-1"><strong>${e(p.whenLabel || (p.confirmed2026 ? 'Release' : 'Season the brewery lists'))}:</strong></p>${quote(p.when)}` : ''}
            </div>
          </div>`;
}

export function beerOfTheMonthPage(subdomain?: SubdomainContext): string {
  const b = BEER_OF_THE_MONTH;
  const confirmed = b.pours.filter((p) => p.confirmed2026), listed = b.pours.filter((p) => !p.confirmed2026);
  const breweries = new Set(b.pours.map((p) => p.brewery)).size;
  const baseUrl = subdomain?.baseUrl || 'https://brewerytrip.com';
  const url = `${baseUrl}/${b.slug}`;
  const ordered = [...confirmed, ...listed];

  const content = `
  <div class="trail-hero">
    <div class="container">
      <nav aria-label="breadcrumb">
        <ol class="breadcrumb mb-3">
          <li class="breadcrumb-item"><a href="/" class="text-white-50">Home</a></li>
          <li class="breadcrumb-item active text-white" aria-current="page">Cleveland Beer of the Month</li>
        </ol>
      </nav>
      <p class="mb-1" style="opacity: 0.85; text-transform: uppercase; letter-spacing: .08em;">Cleveland Beer of the Month · ${e(b.covers)}</p>
      <h1 style="color: #fff;">${e(b.feature)}</h1>
      <p style="opacity: 0.9; max-width: 640px;">${e(b.intro)}</p>
      <div class="trail-stats">
        <div class="trail-stat"><div class="trail-stat-value">${b.pours.length}</div><div class="trail-stat-label">Holiday beers</div></div>
        <div class="trail-stat"><div class="trail-stat-value">${breweries}</div><div class="trail-stat-label">Breweries</div></div>
        <div class="trail-stat"><div class="trail-stat-value">${confirmed.length}</div><div class="trail-stat-label">2026 confirmed</div></div>
      </div>
    </div>
  </div>

  <div class="container my-5">
    <div class="row">
      <div class="col-lg-8">
        <section class="mb-4" aria-labelledby="tradition-h">
          <h2 class="h4" id="tradition-h">The tradition</h2>
          ${b.tradition.map(quote).join('')}
        </section>
        <p class="small text-muted"><strong>How to read this list:</strong> a green tag means a quote from the brewery gives the beer's 2026 release or the 2026 date of the announcement. A gray tag means the brewery's page listed the beer when we checked, but the quotes we cite don't confirm a 2026 release, so check with the brewery before you go. Beer descriptions are quoted from the brewery's own site, with the date we checked. Towns are from our brewery directory, and the counts are ours.</p>

        <h2 class="h3 mb-4 mt-4"><i class="bi bi-snow" aria-hidden="true"></i> Holiday beers</h2>
        ${ordered.map(pourCard).join('')}

        <h2 class="h3 mb-3 mt-5">Holiday beer events</h2>
        ${b.events.map((ev) => `
          <div class="content-card p-3 mb-3">
            <h3 class="h5 mb-1">${e(ev.name)}</h3>
            <p class="mb-2">${breweryLink(ev.where, ev.breweryId)} · ${e(longDate(ev.date))}</p>
            ${quote(ev.source)}
            ${quote(ev.dateSource)}
          </div>`).join('')}
      </div>

      <div class="col-lg-4">
        <div class="sticky-top" style="top: 100px;">
          <div class="card">
            <div class="card-body">
              <h2 class="h5 card-title">A selection</h2>
              <p class="small text-muted mb-2">This is a selection, not a complete list of local holiday beers. Sources for every beer listed are linked on its card.</p>
              <p class="small mb-0"><a href="/breweries">Browse all breweries</a> · <a href="/trails/downtown-cleveland">Downtown Cleveland brewery walk</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <script type="application/ld+json">${jsonLd({
    '@context': 'https://schema.org', '@type': 'ItemList', name: b.title, url,
    itemListElement: ordered.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: `${p.beer} (${p.brewery})`, url: p.breweryId ? `${baseUrl}/brewery/${p.breweryId}` : undefined })),
  })}</script>`;

  return layout(b.title, content, {
    description: `Christmas Ale season in Northeast Ohio: ${b.pours.length} holiday beers from ${breweries} breweries, from Great Lakes Christmas Ale on, each quoted from the brewery's own site.`,
    url,
    subdomain,
  });
}
