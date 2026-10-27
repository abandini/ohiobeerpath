// /blog/ohio-ipa-breweries: ten Ohio IPAs, each quoted from its brewery's own site (data in src/data/ipa-guide.ts).
// Replaces the unsourced 2024 post (301 from /blog/best-ohio-ipa-breweries-2024). Uses the trail page styles
// (trail-hero, trail-stats, trail-stop) like /cleveland-beer-of-the-month.
import { layout } from './layout';
import { escapeAttr as e, jsonLd } from './utils';
import type { SubdomainContext } from '../types';
import { IPA_GUIDE, sourcesOf, type IpaPick, type Source } from '../data/ipa-guide';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const longDate = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return `${MONTHS[m - 1]} ${d}, ${y}`; };
const host = (u: string) => new URL(u).hostname.replace(/^www\./, '');
const cite = (s: Source) => `<a href="${e(s.url)}" rel="noopener" target="_blank">${e(host(s.url))}</a>, checked ${e(longDate(s.checked))}`;
const quote = (s: Source) => `<blockquote class="mb-1 border-start ps-2">“${e(s.quote)}”</blockquote><div class="small text-muted mb-2">${cite(s)}</div>`;
const labelled = (label: string, s?: Source) => s ? `<p class="small mb-1"><strong>${e(label)}:</strong></p>${quote(s)}` : '';
const breweryLink = (name: string, id?: number) => id ? `<a href="/brewery/${id}" class="text-dark">${e(name)}</a>` : e(name);

// Tags only claim what a quote on the card says.
export const isYearRound = (p: IpaPick) => !!p.availability && /year[- ]round/i.test(p.availability.quote);
export function tagsFor(p: IpaPick): string[] {
  const tags: string[] = [];
  if (p.flagship && /flagship/i.test(p.flagship.quote)) tags.push('<span class="badge bg-warning text-dark">Flagship, in the brewery’s words</span>');
  if (isYearRound(p)) tags.push('<span class="badge bg-success">Year-round, per the brewery</span>');
  if (p.award) tags.push('<span class="badge bg-info text-dark">Award listed by the brewery</span>');
  tags.push(`<span class="badge bg-secondary">Listed on the brewery’s site ${e(longDate(IPA_GUIDE.checked))}</span>`);
  return tags;
}

function pickCard(p: IpaPick, i: number): string {
  return `
          <div class="trail-stop" id="ipa-${i + 1}">
            <div class="stop-number">${i + 1}</div>
            <div class="stop-info">
              <h3 class="h4">${e(p.beer)}</h3>
              <p class="stop-meta mb-1">${breweryLink(p.brewery, p.breweryId)} · <i class="bi bi-geo-alt" aria-hidden="true"></i> ${e(p.town)} · <a href="https://${e(p.site)}/" rel="noopener" target="_blank">${e(p.site)}</a></p>
              <p class="mb-2">${tagsFor(p).join(' ')}</p>
              ${p.identity ? quote(p.identity) : ''}${p.flagship ? quote(p.flagship) : ''}${quote(p.about)}
              ${labelled('As the brewery lists it', p.specs)}${labelled('Availability, in the brewery’s words', p.availability)}${labelled('Award the brewery lists', p.award)}${labelled('Location, from the brewery’s site', p.location)}
            </div>
          </div>`;
}

export function ipaGuidePage(subdomain?: SubdomainContext): string {
  const g = IPA_GUIDE;
  const baseUrl = subdomain?.baseUrl || 'https://brewerytrip.com';
  const url = `${baseUrl}/blog/${g.slug}`;
  const ordered = g.regions.flatMap((r) => g.picks.filter((p) => p.region === r));
  const cities = new Set(g.picks.map((p) => p.town)).size;
  const yearRound = g.picks.filter(isYearRound).length;
  const abvs = g.picks.map((p) => p.abv).filter((a): a is number => typeof a === 'number');
  const abvRange = abvs.length ? `${Math.min(...abvs)}–${Math.max(...abvs)}%` : '';
  let n = 0;

  const content = `
  <div class="trail-hero">
    <div class="container">
      <nav aria-label="breadcrumb">
        <ol class="breadcrumb mb-3">
          <li class="breadcrumb-item"><a href="/" class="text-white-50">Home</a></li>
          <li class="breadcrumb-item"><a href="/blog" class="text-white-50">Blog</a></li>
          <li class="breadcrumb-item active text-white" aria-current="page">Ohio IPA breweries</li>
        </ol>
      </nav>
      <p class="mb-1" style="opacity: 0.85; text-transform: uppercase; letter-spacing: .08em;">Guide · Updated ${e(longDate(g.dateModified))}</p>
      <h1 style="color: #fff;">${e(g.title)}</h1>
      <p style="opacity: 0.9; max-width: 640px;">Ohio IPAs worth a trip: ${g.picks.length} breweries from Cleveland to Cincinnati and the IPA each one lists, described in the brewery’s own words with a link to the page we quoted.</p>
      <div class="trail-stats">
        <div class="trail-stat"><div class="trail-stat-value">${g.picks.length}</div><div class="trail-stat-label">IPAs</div></div>
        <div class="trail-stat"><div class="trail-stat-value">${cities}</div><div class="trail-stat-label">Towns</div></div>
        <div class="trail-stat"><div class="trail-stat-value">${yearRound}</div><div class="trail-stat-label">Listed year-round</div></div>
        ${abvRange ? `<div class="trail-stat"><div class="trail-stat-value">${e(abvRange)}</div><div class="trail-stat-label">ABV range (our calculation)</div></div>` : ''}
      </div>
    </div>
  </div>

  <div class="container my-5">
    <div class="row">
      <div class="col-lg-8">
        <p class="small text-muted"><strong>How to read this list:</strong> this is a selection, not a ranking; the numbers are only for reference. Every beer description, ABV, availability note and award is quoted from the brewery’s own website, with the date we checked it. A tag appears only when a quote on that card says so. None of the quotes we cite gives a 2026 release date, so beers are described as the brewery listed them on ${e(longDate(g.checked))}; check with the brewery before you go. Each town comes from an address or location line on the brewery’s own site, quoted on its card; the region headings are our grouping, and the counts and ABV range are our calculation from the quotes.</p>
        ${g.regions.map((r) => {
          const inRegion = ordered.filter((p) => p.region === r);
          if (!inRegion.length) return '';
          return `
        <h2 class="h3 mb-4 mt-5">${e(r)} IPAs</h2>
        ${inRegion.map((p) => pickCard(p, n++)).join('')}`;
        }).join('')}
      </div>

      <div class="col-lg-4">
        <div class="sticky-top" style="top: 100px;">
          <div class="card">
            <div class="card-body">
              <h2 class="h5 card-title">Plan an IPA trip</h2>
              <p class="small text-muted mb-2">Each brewery name links to its page in our brewery directory. Sources for every beer are linked on its card.</p>
              <p class="small mb-0"><a href="/breweries">Browse all breweries</a> · <a href="/plan">Plan a route</a> · <a href="/cleveland-beer-of-the-month">Cleveland Beer of the Month</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <script type="application/ld+json">${jsonLd({
    '@context': 'https://schema.org', '@type': 'Article', headline: g.title, description: g.excerpt, url,
    datePublished: g.datePublished, dateModified: g.dateModified,
    author: { '@type': 'Organization', name: 'Brewery Trip', url: 'https://brewerytrip.com' },
    publisher: { '@type': 'Organization', name: 'Brewery Trip', url: 'https://brewerytrip.com' },
    articleSection: 'Guides', mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  })}</script>
  <script type="application/ld+json">${jsonLd({
    '@context': 'https://schema.org', '@type': 'ItemList', name: g.title, url,
    itemListElement: ordered.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: `${p.beer} (${p.brewery})`, url: p.breweryId ? `${baseUrl}/brewery/${p.breweryId}` : undefined })),
  })}</script>
  <script type="application/ld+json">${jsonLd({
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${baseUrl}/` },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${baseUrl}/blog` },
      { '@type': 'ListItem', position: 3, name: g.title },
    ],
  })}</script>`;

  return layout(g.title, content, {
    description: `Looking for Ohio IPAs? ${g.picks.length} IPAs from breweries in Cleveland, Columbus, Cincinnati, Akron, Dayton and the Toledo area, each described in the brewery’s own words.`,
    url,
    subdomain,
  });
}
