// /blog/dog-friendly-ohio-breweries: fifteen Ohio breweries whose own sites welcome dogs, each policy quoted (data in
// src/data/dog-guide.ts). Same URL as the old unsourced post, new body. Uses the trail page styles (trail-hero,
// trail-stats, trail-stop) like /blog/ohio-ipa-breweries.
import { layout } from './layout';
import { escapeAttr as e, jsonLd } from './utils';
import type { SubdomainContext } from '../types';
import { DOG_GUIDE, type DogArea, type DogPick, type Source } from '../data/dog-guide';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const longDate = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return `${MONTHS[m - 1]} ${d}, ${y}`; };
const host = (u: string) => new URL(u).hostname.replace(/^www\./, '');
const cite = (s: Source) => `<a href="${e(s.url)}" rel="noopener" target="_blank">${e(host(s.url))}</a>, checked ${e(longDate(s.checked))}`;
const quote = (s: Source) => `<blockquote class="mb-1 border-start ps-2">“${e(s.quote)}”</blockquote><div class="small text-muted mb-2">${cite(s)}</div>`;
const breweryLink = (name: string, id: number) => `<a href="/brewery/${id}" class="text-dark">${e(name)}</a>`;

// The area tag only restates what a quote on the card says (tests check the wording backs it).
export const AREA_LABEL: Record<DogArea, string> = {
  'outdoor': 'Outdoor areas, per the brewery',
  'indoor-and-outdoor': 'Inside and out, per the brewery',
  'taproom': 'Taproom, per the brewery',
  'unstated': 'Area not stated; ask the brewery',
};
export const AREA_EVIDENCE: Record<DogArea, RegExp> = {
  'outdoor': /patio|outdoor|outside|biergarten|beer garden/i,
  'indoor-and-outdoor': /inside and out/i,
  'taproom': /taproom/i,
  'unstated': /./,
};
const quotesOf = (p: DogPick) => [p.policy, ...(p.rules || [])];
export const hasLeashRule = (p: DogPick) => quotesOf(p).some((s) => /leash/i.test(s.quote));
// Counted for the "Mention outdoor access" stat: the brewery's policy or rule quotes name an outdoor space.
export const mentionsOutdoor = (p: DogPick) => quotesOf(p).some((s) => AREA_EVIDENCE.outdoor.test(s.quote));

function pickCard(p: DogPick, i: number): string {
  return `
          <div class="trail-stop" id="dog-${i + 1}">
            <div class="stop-number">${i + 1}</div>
            <div class="stop-info">
              <h3 class="h4">${breweryLink(p.brewery, p.breweryId)}</h3>
              <p class="stop-meta mb-1"><i class="bi bi-geo-alt" aria-hidden="true"></i> ${e(p.town)} · <a href="https://${e(p.site)}/" rel="noopener" target="_blank">${e(p.site)}</a></p>
              <p class="mb-2"><span class="badge bg-success">${e(AREA_LABEL[p.area])}</span>${hasLeashRule(p) ? ' <span class="badge bg-secondary">Leash rule posted</span>' : ''}</p>
              <p class="small mb-1"><strong>Dog policy, in the brewery’s words:</strong></p>${quote(p.policy)}
              ${p.rules?.length ? `<p class="small mb-1"><strong>Rules and extras, in the brewery’s words:</strong></p>${p.rules.map(quote).join('')}` : ''}
              <p class="small mb-1"><strong>Location, from the brewery’s site:</strong></p>${quote(p.location)}
            </div>
          </div>`;
}

export function dogGuidePage(subdomain?: SubdomainContext): string {
  const g = DOG_GUIDE;
  const baseUrl = subdomain?.baseUrl || 'https://brewerytrip.com';
  const url = `${baseUrl}/blog/${g.slug}`;
  const ordered = g.regions.flatMap((r) => g.picks.filter((p) => p.region === r));
  const towns = new Set(g.picks.map((p) => p.town)).size;
  const outdoor = g.picks.filter(mentionsOutdoor).length;
  const leash = g.picks.filter(hasLeashRule).length;
  const checked = longDate(g.checked);
  let n = 0;

  const content = `
  <div class="trail-hero">
    <div class="container">
      <nav aria-label="breadcrumb">
        <ol class="breadcrumb mb-3">
          <li class="breadcrumb-item"><a href="/" class="text-white-50">Home</a></li>
          <li class="breadcrumb-item"><a href="/blog" class="text-white-50">Blog</a></li>
          <li class="breadcrumb-item active text-white" aria-current="page">Dog-friendly Ohio breweries</li>
        </ol>
      </nav>
      <p class="mb-1" style="opacity: 0.85; text-transform: uppercase; letter-spacing: .08em;">Guide · Updated ${e(longDate(g.dateModified))}</p>
      <h1 style="color: #fff;">${e(g.title)}</h1>
      <p style="opacity: 0.9; max-width: 640px;">Dog-friendly breweries in Ohio: ${g.picks.length} breweries from Cleveland to Cincinnati whose own websites say dogs are welcome, with where dogs may go and the rules each one posts, quoted with a link to the page.</p>
      <div class="trail-stats">
        <div class="trail-stat"><div class="trail-stat-value">${g.picks.length}</div><div class="trail-stat-label">Breweries</div></div>
        <div class="trail-stat"><div class="trail-stat-value">${towns}</div><div class="trail-stat-label">Towns (our calculation)</div></div>
        <div class="trail-stat"><div class="trail-stat-value">${outdoor}</div><div class="trail-stat-label">Mention outdoor access (our calculation)</div></div>
        <div class="trail-stat"><div class="trail-stat-value">${leash}</div><div class="trail-stat-label">Post a leash rule (our calculation)</div></div>
      </div>
    </div>
  </div>

  <div class="container my-5">
    <div class="row">
      <div class="col-lg-8">
        <p class="small text-muted"><strong>How to read this list:</strong> this is a selection, not a ranking; the numbers are only for reference. Each dog policy, rule and address is quoted from the brewery’s own website, as posted when we checked on ${e(checked)}. The tag on each card only restates where that brewery’s quote says dogs may go. Dog rules change with the seasons, the weather and events, so check with the brewery before you go. The region headings are our grouping, and the counts are our calculation from the quotes.</p>
        ${g.regions.map((r) => {
          const inRegion = ordered.filter((p) => p.region === r);
          if (!inRegion.length) return '';
          return `
        <h2 class="h3 mb-4 mt-5">${e(r)}</h2>
        ${inRegion.map((p) => pickCard(p, n++)).join('')}`;
        }).join('')}

        <h2 class="h3 mb-3 mt-5">Before you bring your dog</h2>
        <p>Every policy above is as posted when we checked on ${e(checked)}. Patio seasons, special events and food-service rules can change where dogs are allowed, so look at the brewery’s site or call before you go, and follow the rules each brewery posts.</p>
        <p class="mb-0">Celebrating your dog’s adoption anniversary? <a href="https://happygotchadays.com/" rel="nofollow noopener" target="_blank">HappyGotchaDays</a> keeps track of gotcha days.</p>
      </div>

      <div class="col-lg-4">
        <div class="sticky-top" style="top: 100px;">
          <div class="card">
            <div class="card-body">
              <h2 class="h5 card-title">Plan a trip with your dog</h2>
              <p class="small text-muted mb-2">Each brewery name links to its page in our brewery directory. Sources for every policy are linked on its card.</p>
              <p class="small mb-0"><a href="/breweries">Browse all breweries</a> · <a href="/plan">Plan a route</a> · <a href="/blog/ohio-ipa-breweries">Ohio IPA breweries</a></p>
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
    itemListElement: ordered.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.brewery, url: `${baseUrl}/brewery/${p.breweryId}` })),
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
    description: `Dog-friendly breweries in Ohio: ${g.picks.length} breweries in Cleveland, Akron, Columbus, Dayton, Cincinnati, Toledo and Athens, with each dog policy and its rules quoted from the brewery’s own site.`,
    url,
    subdomain,
  });
}
