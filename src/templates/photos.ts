// Public-domain photos used across the site, with captions in four parts:
//   story   - our own description of what is in the frame (only what is visible; no inferred relationships or motives)
//   archive - the archive's own words, quoted, with what part of the record they come from
//   credit  - photographer and collection, as the archive asks to be credited
//   where   - what the record says about place and date
// Rights basis per file: docs/image-rights.md. Files live in R2 under assets/images/photos/.
import { escapeAttr, escapeHtml } from './utils';

export interface SitePhoto {
  file: string; w: number; h: number;
  alt: string;
  story: string;          // plain text
  storyLink?: { href: string; text: string };
  archiveLabel: string;   // e.g. "The archive's title"
  archive: string;        // verbatim excerpt
  credit: string;
  rights: string;
  src: string;            // the archive record
  where: string;
}

export const PHOTOS: Record<string, SitePhoto> = {
  pedalWagon: {
    file: 'pedal-wagon-cincinnati-highsmith.webp', w: 2000, h: 1333,
    alt: 'A pedal-powered bar wagon full of people rolls through a downtown Cincinnati intersection. The riders sit on bike-seat stools around a wooden counter under a sign reading "Pedal Wagon".',
    story: 'A Pedal Wagon carrying riders through downtown Cincinnati, with bike-seat stools set around a wooden counter.',
    archiveLabel: 'The archive’s title',
    archive: 'Visitors to Cincinnati, Ohio provide their own pedaling power on the Pedal Wagon, a moving beer bar that travels through the downtown area and, along the way, stops at several establishments that serve stronger spirits',
    credit: 'Carol M. Highsmith Archive, Library of Congress, Prints and Photographs Division',
    rights: 'no known restrictions on publication',
    src: 'https://www.loc.gov/item/2016632945/',
    where: 'Downtown Cincinnati, Ohio, October 15, 2016.'
  },
  northCountry: {
    file: 'north-country-brewing-slippery-rock-highsmith.webp', w: 1024, h: 764,
    alt: 'A two-story yellow clapboard building on a street corner with a large painted sign, green trim, a vine-covered porch and a wooden deck.',
    story: 'A yellow clapboard brewpub on a corner, with a big painted sign and a porch half hidden by vines.',
    storyLink: { href: 'https://brewerytrip.com/brewery/1161', text: 'North Country Brewing Co. is in our directory' },
    archiveLabel: 'The archive’s title',
    archive: 'The North Country Brewing Company, a craft-beer maker and brewpub in Slippery Rock, Pennsylvania',
    credit: 'Carol M. Highsmith Archive, Library of Congress, Prints and Photographs Division',
    rights: 'no known restrictions on publication',
    src: 'https://www.loc.gov/item/2019690976/',
    where: 'Slippery Rock, Pennsylvania, June 29, 2019.'
  },
  latrobe: {
    file: 'city-brewing-latrobe-vats-highsmith.webp', w: 960, h: 1024,
    alt: 'A cluster of tall, weathered metal storage tanks rising above a green-walled building, with cars parked in front, under a blue sky.',
    story: 'The tall storage tanks at the brewery in Latrobe, Pennsylvania, weathered to rust in places.',
    archiveLabel: 'The archive’s note, on Rolling Rock',
    archive: 'Launched here in 1939 as a local beer, it was marketed aggressively and eventually became a national product.',
    credit: 'Carol M. Highsmith Archive, Library of Congress, Prints and Photographs Division',
    rights: 'no known restrictions on publication',
    src: 'https://www.loc.gov/item/2019691124/',
    where: 'City Brewing Company, Latrobe, Pennsylvania, July 2, 2019. The same note says the Rolling Rock brand was sold in 2006 and brewed elsewhere after that.'
  },
  zoar: {
    file: 'zoar-brewery-1936-habs.webp', w: 960, h: 678,
    alt: 'Black-and-white photo of a long, dark wooden building with a shingled roof and chimneys, two old cars parked in front, bare trees around it and water beyond.',
    story: 'The old brewery at Zoar, Ohio: a long timber building, two old cars out front, bare trees and water behind.',
    archiveLabel: 'The survey’s caption',
    archive: 'Historic American Buildings Survey, Carl Waite, Photographer December 1, 1936 NORTH ELEVATION.',
    credit: 'Carl Waite for the Historic American Buildings Survey, Library of Congress',
    rights: 'a U.S. government work',
    src: 'https://www.loc.gov/item/oh0332/',
    where: 'Fifth and Park Streets, Zoar, Tuscarawas County, Ohio. The survey record gives 1830 for the building’s initial construction and lists the Society of Separatists of Zoar.'
  }
};

export function photoCaption(p: SitePhoto): string {
  const link = p.storyLink ? ` <a href="${escapeAttr(p.storyLink.href)}">${escapeHtml(p.storyLink.text)}</a>.` : '';
  return `<span class="story">${escapeHtml(p.story)}${link}</span> `
    + `${escapeHtml(p.archiveLabel)}: <q>${escapeHtml(p.archive)}</q> `
    + `Photo: ${escapeHtml(p.credit)}, ${escapeHtml(p.rights)} (<a href="${escapeAttr(p.src)}" rel="noopener">record</a>). `
    + `${escapeHtml(p.where)}`;
}

export function photoFigure(key: string): string {
  const p = PHOTOS[key];
  return `<figure class="bt-photo"><img src="/assets/images/photos/${p.file}" width="${p.w}" height="${p.h}" alt="${escapeAttr(p.alt)}" loading="lazy" decoding="async">
<figcaption>${photoCaption(p)}</figcaption></figure>`;
}
