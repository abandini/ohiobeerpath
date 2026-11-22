// Competition medals shown on brewery pages. Every medal is a line on the competition's own published winners list:
// `printed` is the entry exactly as that list prints it, `url` is the list, `checked` the day it was read.
// Re-check with: node scripts/verify-medals.mjs (it imports this file, so keep it free of imports and of anything
// beyond types and plain data).
// (Great American Beer Festival medals for the Downtown Cleveland walk stops live with the walk data, in tours/.)

export type MedalRank = 'Gold' | 'Silver' | 'Bronze';
export interface CompetitionMedal {
  year: number;
  medal: MedalRank;
  beer: string;      // the beer's name as we show it
  category: string;  // the category heading on the list
  printed: string;   // the winners-list entry, character for character
  url: string;       // the official winners list for that year
  checked: string;   // YYYY-MM-DD
  note?: string;     // shown with the medal, e.g. when the list's spelling differs from the name we show
}
export interface MedalSet {
  competition: string;   // "Ohio Craft Brewers Cup"
  site: string;          // the competition's own site, shown as the source
  medals: CompetitionMedal[];
}

const CUP = 'https://www.ohiocraftbrewerscup.com';
const C = '2026-11-22';

export const BREWERY_MEDALS: Record<number, MedalSet[]> = {
  // Modern Methods Brewing Company, Warren, Ohio
  218: [{
    competition: 'Ohio Craft Brewers Cup',
    site: `${CUP}/`,
    medals: [
      { year: 2021, medal: 'Gold', beer: 'Percolator', category: 'Coffee Beer', printed: 'MODERN METHODS - PERCOLATOR', url: `${CUP}/winners/2021`, checked: C },
      { year: 2021, medal: 'Silver', beer: 'Fresh Pots', category: 'Specialty/Adjunct Stout', printed: 'MODERN METHODS - FRESH POTS', url: `${CUP}/winners/2021`, checked: C },
      { year: 2019, medal: 'Gold', beer: 'Roast Beast', category: 'Stout', printed: 'MODERN METHODS ROAST BEAST', url: `${CUP}/winners-2019`, checked: C },
      { year: 2019, medal: 'Silver', beer: 'Headcase', category: 'European Pale', printed: 'MODERN METHODS HEADCASE', url: `${CUP}/winners-2019`, checked: C },
      { year: 2019, medal: 'Bronze', beer: 'Farmhouse 908', category: 'Belgian/French Saison', printed: 'MODERN METHODS FARMHOUS 908', url: `${CUP}/winners-2019`, checked: C, note: 'The 2019 list prints it as “FARMHOUS 908”; the 2018 list prints “FARMHOUSE 908”.' },
      { year: 2018, medal: 'Gold', beer: 'Farmhouse 908', category: 'Belgian/French Saison', printed: 'MODERN METHODS FARMHOUSE 908', url: `${CUP}/winners-2018`, checked: C },
      { year: 2018, medal: 'Bronze', beer: 'Roast Beast', category: 'Stout', printed: 'MODERN METHODS ROAST BEAST', url: `${CUP}/winners-2018`, checked: C },
    ],
  }],
};

export const medalsFor = (breweryId: number): MedalSet[] => (BREWERY_MEDALS[breweryId] || []).filter((s) => s.medals.length > 0);
