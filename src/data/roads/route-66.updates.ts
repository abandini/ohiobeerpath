// RECORDS, written once each by scripts/record-road-update.mjs. Each entry is a completed, dated update to a page that
// was already public: the list before and after, why each stop left or joined, and what was re-measured. The page
// renders its dated notice and entry from these alone. Do not edit an entry and do not regenerate one that has been
// published: a later change to the page gets a new dated entry.
import type { UpdateEvent } from '../../lib/road-trip';

export const ROUTE_66_UPDATES: UpdateEvent[] = [
 {
  "date": "2026-11-23",
  "what": "We replaced the operating evidence quoted for Benny Boy Brewing in Los Angeles: the earlier excerpt included a dated event line that has since left its page, and the excerpt now is the hours block alone, which is still there. No stop was added or removed.",
  "before": [
   {
    "key": "haymarket-brewery-haymarket-pub-and-brewery-chicago",
    "name": "Haymarket Brewery (Haymarket Pub and Brewery)",
    "town": "Chicago",
    "mile": 1.2,
    "detourMiles": 0.34
   },
   {
    "key": "off-color-brewing-mousetrap-taproom-chicago",
    "name": "Off Color Brewing (Mousetrap taproom)",
    "town": "Chicago",
    "mile": 1.4,
    "detourMiles": 2.02
   },
   {
    "key": "greenstar-brewing-at-uncommon-ground-chicago",
    "name": "Greenstar Brewing at Uncommon Ground",
    "town": "Chicago",
    "mile": 1.8,
    "detourMiles": 4.98
   },
   {
    "key": "all-rise-brewing-co-chicago",
    "name": "All Rise Brewing Co",
    "town": "Chicago",
    "mile": 2.2,
    "detourMiles": 0.52
   },
   {
    "key": "goose-island-beer-co-fulton-street-brewery-and-taproom-chicago",
    "name": "Goose Island Beer Co. Fulton Street Brewery and Taproom",
    "town": "Chicago",
    "mile": 2.4,
    "detourMiles": 0.58
   },
   {
    "key": "piece-brewery-chicago",
    "name": "Piece Brewery",
    "town": "Chicago",
    "mile": 2.4,
    "detourMiles": 2.2
   },
   {
    "key": "maplewood-brewery-and-distillery-the-lounge-chicago-chicago",
    "name": "Maplewood Brewery & Distillery (The Lounge, Chicago)",
    "town": "Chicago",
    "mile": 2.4,
    "detourMiles": 3.76
   },
   {
    "key": "revolution-brewing-taproom-production-brewery-kedzie-chicago",
    "name": "Revolution Brewing Taproom + Production Brewery (Kedzie)",
    "town": "Chicago",
    "mile": 2.4,
    "detourMiles": 3.98
   },
   {
    "key": "kinslahger-brewing-company-oak-park",
    "name": "Kinslahger Brewing Company",
    "town": "Oak Park",
    "mile": 8.7,
    "detourMiles": 2.4
   },
   {
    "key": "flapjack-brewery-berwyn",
    "name": "Flapjack Brewery",
    "town": "Berwyn",
    "mile": 9.6,
    "detourMiles": 0.43
   },
   {
    "key": "buckledown-brewing-lyons",
    "name": "BuckleDown Brewing",
    "town": "Lyons",
    "mile": 11.1,
    "detourMiles": 0.52
   },
   {
    "key": "imperial-oak-brewing-willow-springs-willow-springs",
    "name": "Imperial Oak Brewing (Willow Springs)",
    "town": "Willow Springs",
    "mile": 17.8,
    "detourMiles": 2.43
   },
   {
    "key": "black-horizon-brewing-company-willowbrook",
    "name": "Black Horizon Brewing Company",
    "town": "Willowbrook",
    "mile": 19.4,
    "detourMiles": 0.45
   },
   {
    "key": "skeleton-key-brewery-woodridge",
    "name": "Skeleton Key Brewery",
    "town": "Woodridge",
    "mile": 22.9,
    "detourMiles": 1.61
   },
   {
    "key": "pollyanna-brewing-company-lemont",
    "name": "Pollyanna Brewing Company",
    "town": "Lemont",
    "mile": 24.9,
    "detourMiles": 2.58
   },
   {
    "key": "destihl-brewery-beer-hall-and-barrel-room-normal-normal",
    "name": "DESTIHL Brewery + Beer Hall & Barrel Room (Normal)",
    "town": "Normal",
    "mile": 125.7,
    "detourMiles": 0.23
   },
   {
    "key": "white-oak-brewing-normal",
    "name": "White Oak Brewing",
    "town": "Normal",
    "mile": 130,
    "detourMiles": 1.44
   },
   {
    "key": "keg-grove-brewing-company-bloomington-bloomington",
    "name": "Keg Grove Brewing Company (Bloomington)",
    "town": "Bloomington",
    "mile": 130.8,
    "detourMiles": 0.58
   },
   {
    "key": "lil-beaver-brewery-bloomington",
    "name": "Lil Beaver Brewery",
    "town": "Bloomington",
    "mile": 132.7,
    "detourMiles": 0.83
   },
   {
    "key": "engrained-brewing-co-springfield",
    "name": "Engrained Brewing Co",
    "town": "Springfield",
    "mile": 196.2,
    "detourMiles": 0.26
   },
   {
    "key": "schlafly-tap-room-st-louis",
    "name": "Schlafly Tap Room",
    "town": "St. Louis",
    "mile": 0,
    "detourMiles": 9.22
   },
   {
    "key": "4-hands-brewery-and-tasting-room-st-louis",
    "name": "4 Hands Brewery & Tasting Room",
    "town": "St. Louis",
    "mile": 0,
    "detourMiles": 10.27
   },
   {
    "key": "square-one-brewery-and-distillery-st-louis",
    "name": "Square One Brewery & Distillery",
    "town": "St. Louis",
    "mile": 0,
    "detourMiles": 10.34
   },
   {
    "key": "blue-jay-brewing-company-st-louis",
    "name": "Blue Jay Brewing Company",
    "town": "St. Louis",
    "mile": 1.9,
    "detourMiles": 9.18
   },
   {
    "key": "six-mile-bridge-brewery-maryland-heights",
    "name": "Six Mile Bridge Brewery",
    "town": "Maryland Heights",
    "mile": 16.3,
    "detourMiles": 1.27
   },
   {
    "key": "urban-chestnut-brewing-company-grove-bierhall-st-louis",
    "name": "Urban Chestnut Brewing Company, Grove Bierhall",
    "town": "St. Louis",
    "mile": 22.4,
    "detourMiles": 7.82
   },
   {
    "key": "rockwell-beer-company-the-grove-taproom-and-brewery-st-louis",
    "name": "Rockwell Beer Company, The Grove Taproom & Brewery",
    "town": "St. Louis",
    "mile": 22.4,
    "detourMiles": 8.33
   },
   {
    "key": "2nd-shift-brewing-st-louis",
    "name": "2nd Shift Brewing",
    "town": "St. Louis",
    "mile": 22.6,
    "detourMiles": 6.76
   },
   {
    "key": "side-project-brewing-maplewood",
    "name": "Side Project Brewing",
    "town": "Maplewood",
    "mile": 23.3,
    "detourMiles": 4.52
   },
   {
    "key": "schlafly-bottleworks-maplewood",
    "name": "Schlafly Bottleworks",
    "town": "Maplewood",
    "mile": 23.3,
    "detourMiles": 4.92
   },
   {
    "key": "alpha-brewing-company-st-louis",
    "name": "Alpha Brewing Company",
    "town": "St. Louis",
    "mile": 24.2,
    "detourMiles": 7.77
   },
   {
    "key": "civil-life-brewing-co-st-louis",
    "name": "Civil Life Brewing Co.",
    "town": "St. Louis",
    "mile": 24.9,
    "detourMiles": 8
   },
   {
    "key": "bluewood-brewing-st-louis",
    "name": "Bluewood Brewing",
    "town": "St. Louis",
    "mile": 24.9,
    "detourMiles": 10.18
   },
   {
    "key": "4-hands-kirkwood-kirkwood",
    "name": "4 Hands Kirkwood",
    "town": "Kirkwood",
    "mile": 25.5,
    "detourMiles": 0.05
   },
   {
    "key": "beer-outside-brewery-valley-park-2",
    "name": "Beer Outside Brewery",
    "town": "Valley Park",
    "mile": 32.5,
    "detourMiles": 0.15
   },
   {
    "key": "pacific-brew-haus-pacific",
    "name": "Pacific Brew Haus",
    "town": "Pacific",
    "mile": 47.5,
    "detourMiles": 1.12
   },
   {
    "key": "point-labaddie-brewery-labadie",
    "name": "Point Labaddie Brewery",
    "town": "Labadie",
    "mile": 50.9,
    "detourMiles": 1
   },
   {
    "key": "muddy-banks-brewing-company-sullivan",
    "name": "Muddy Banks Brewing Company",
    "town": "Sullivan",
    "mile": 81,
    "detourMiles": 0.26
   },
   {
    "key": "public-house-brewing-company-st-james-taproom-saint-james",
    "name": "Public House Brewing Company (St. James Taproom)",
    "town": "Saint James",
    "mile": 113.7,
    "detourMiles": 0.86
   },
   {
    "key": "public-house-brewing-company-rolla-r-and-d-brewpub-rolla",
    "name": "Public House Brewing Company (Rolla R&D Brewpub)",
    "town": "Rolla",
    "mile": 123.8,
    "detourMiles": 0.26
   },
   {
    "key": "boat-town-brewing-phillipsburg",
    "name": "Boat Town Brewing",
    "town": "Lebanon",
    "mile": 186.7,
    "detourMiles": 0.41
   },
   {
    "key": "before-and-after-brewing-springfield",
    "name": "Before and After Brewing",
    "town": "Springfield",
    "mile": 236.8,
    "detourMiles": 4.05
   },
   {
    "key": "tie-and-timber-beer-company-springfield",
    "name": "Tie and Timber Beer Company",
    "town": "Springfield",
    "mile": 238.7,
    "detourMiles": 2.52
   },
   {
    "key": "hold-fast-brewing-springfield",
    "name": "Hold Fast Brewing",
    "town": "Springfield",
    "mile": 239.7,
    "detourMiles": 1.62
   },
   {
    "key": "springfield-brewing-company-brewco-taproom-springfield",
    "name": "Springfield Brewing Company (BrewCo Taproom)",
    "town": "Springfield",
    "mile": 240.2,
    "detourMiles": 2.28
   },
   {
    "key": "mothers-brewing-co-springfield",
    "name": "Mother's Brewing Co",
    "town": "Springfield",
    "mile": 240.4,
    "detourMiles": 2.27
   },
   {
    "key": "heirloom-rustic-ales-tulsa",
    "name": "Heirloom Rustic Ales",
    "town": "Tulsa",
    "mile": 106.7,
    "detourMiles": 0.16
   },
   {
    "key": "marshall-brewing-co-llc-tulsa",
    "name": "Marshall Brewing Co, LLC",
    "town": "Tulsa",
    "mile": 106.9,
    "detourMiles": 0.26
   },
   {
    "key": "dead-armadillo-brewery-tulsa",
    "name": "Dead Armadillo Brewery",
    "town": "Tulsa",
    "mile": 107.7,
    "detourMiles": 0.15
   },
   {
    "key": "new-era-fine-fermentations-neff-brewing-tulsa",
    "name": "New Era Fine Fermentations (Neff Brewing)",
    "town": "Tulsa",
    "mile": 107.9,
    "detourMiles": 0.12
   },
   {
    "key": "cabin-boys-brewpub-tulsa",
    "name": "Cabin Boys Brewpub",
    "town": "Tulsa",
    "mile": 108.5,
    "detourMiles": 0.38
   },
   {
    "key": "nothings-left-brewing-co-tulsa",
    "name": "Nothing's Left Brewing Co.",
    "town": "Tulsa",
    "mile": 108.6,
    "detourMiles": 0.35
   },
   {
    "key": "frenzy-brewing-company-edmond",
    "name": "Frenzy Brewing Company",
    "town": "Edmond",
    "mile": 212.1,
    "detourMiles": 0.11
   },
   {
    "key": "roughtail-brewing-oklahoma-city",
    "name": "Roughtail Brewing",
    "town": "Oklahoma City",
    "mile": 215.5,
    "detourMiles": 1.3
   },
   {
    "key": "prairie-artisan-ales-okc-taproom-oklahoma-city",
    "name": "Prairie Artisan Ales (OKC taproom)",
    "town": "Oklahoma City",
    "mile": 224.2,
    "detourMiles": 1.16
   },
   {
    "key": "skydance-brewing-company-oklahoma-city",
    "name": "Skydance Brewing Company",
    "town": "Oklahoma City",
    "mile": 224.2,
    "detourMiles": 1.25
   },
   {
    "key": "core4-brewing-company-oklahoma-city",
    "name": "Core4 Brewing Company",
    "town": "Oklahoma City",
    "mile": 224.8,
    "detourMiles": 1.84
   },
   {
    "key": "stonecloud-brewing-co-okc-taproom-oklahoma-city",
    "name": "Stonecloud Brewing Co. (OKC taproom)",
    "town": "Oklahoma City",
    "mile": 225.1,
    "detourMiles": 1.7
   },
   {
    "key": "anthem-brewing-co-oklahoma-city",
    "name": "Anthem Brewing Co",
    "town": "Oklahoma City",
    "mile": 225.1,
    "detourMiles": 2.23
   },
   {
    "key": "okie-beer-co-oklahoma-city",
    "name": "Okie Beer Co.",
    "town": "Oklahoma City",
    "mile": 229.8,
    "detourMiles": 0.15
   },
   {
    "key": "old-tascosa-brewing-company-amarillo",
    "name": "Old Tascosa Brewing Company",
    "town": "Amarillo",
    "mile": 110.4,
    "detourMiles": 0.01
   },
   {
    "key": "pondaseta-brewing-co-amarillo-taproom-amarillo",
    "name": "Pondaseta Brewing Co. (Amarillo Taproom)",
    "town": "Amarillo",
    "mile": 114,
    "detourMiles": 2.05
   },
   {
    "key": "canteen-taproom-albuquerque",
    "name": "Canteen Taproom",
    "town": "Albuquerque",
    "mile": 207.1,
    "detourMiles": 0.24
   },
   {
    "key": "boxing-bear-brewing-bridges-on-tramway-taproom-albuquerque",
    "name": "Boxing Bear Brewing - Bridges on Tramway Taproom",
    "town": "Albuquerque",
    "mile": 207.8,
    "detourMiles": 3.25
   },
   {
    "key": "bombs-away-beer-company-albuquerque",
    "name": "Bombs Away Beer Company",
    "town": "Albuquerque",
    "mile": 209.5,
    "detourMiles": 0.12
   },
   {
    "key": "high-and-dry-brewing-albuquerque",
    "name": "High and Dry Brewing",
    "town": "Albuquerque",
    "mile": 212.8,
    "detourMiles": 0.51
   },
   {
    "key": "tractor-brewing-nob-hill-albuquerque",
    "name": "Tractor Brewing - Nob Hill",
    "town": "Albuquerque",
    "mile": 213.4,
    "detourMiles": 0.02
   },
   {
    "key": "santa-fe-brewing-abq-at-green-jeans-albuquerque",
    "name": "Santa Fe Brewing - ABQ at Green Jeans",
    "town": "Albuquerque",
    "mile": 213.5,
    "detourMiles": 1.81
   },
   {
    "key": "flock-of-moons-brewing-albuquerque",
    "name": "Flock of Moons Brewing",
    "town": "Albuquerque",
    "mile": 214.2,
    "detourMiles": 0.01
   },
   {
    "key": "sidetrack-brewing-company-albuquerque",
    "name": "Sidetrack Brewing Company",
    "town": "Albuquerque",
    "mile": 215.9,
    "detourMiles": 0.13
   },
   {
    "key": "ex-novo-brewing-albuquerque-taproom-and-restaurant-albuquerque",
    "name": "Ex Novo Brewing - Albuquerque Taproom and Restaurant",
    "town": "Albuquerque",
    "mile": 216.2,
    "detourMiles": 0
   },
   {
    "key": "santa-fe-brewing-the-brakeroom-santa-fe",
    "name": "Santa Fe Brewing - The Brakeroom",
    "town": "Santa Fe",
    "mile": 120.2,
    "detourMiles": 0.1
   },
   {
    "key": "rowley-farmhouse-ales-santa-fe",
    "name": "Rowley Farmhouse Ales",
    "town": "Santa Fe",
    "mile": 123,
    "detourMiles": 0.08
   },
   {
    "key": "second-street-brewery-rufina-taproom-santa-fe",
    "name": "Second Street Brewery - Rufina Taproom",
    "town": "Santa Fe",
    "mile": 123.4,
    "detourMiles": 0.17
   },
   {
    "key": "santa-fe-brewing-co-the-beer-hall-at-hq-santa-fe",
    "name": "Santa Fe Brewing Co. (The Beer Hall at HQ)",
    "town": "Santa Fe",
    "mile": 129,
    "detourMiles": 0.04
   },
   {
    "key": "ex-novo-brewing-corrales-brewery-taproom-and-corral-corrales",
    "name": "Ex Novo Brewing - Corrales Brewery, Taproom and Corral",
    "town": "Corrales",
    "mile": 171.3,
    "detourMiles": 1.35
   },
   {
    "key": "boxing-bear-brewing-firestone-taproom-and-brewery-albuquerque",
    "name": "Boxing Bear Brewing - Firestone Taproom & Brewery",
    "town": "Albuquerque",
    "mile": 174.4,
    "detourMiles": 1.62
   },
   {
    "key": "steel-bender-brewyard-los-ranchos-de-albuquerque",
    "name": "Steel Bender Brewyard",
    "town": "Los Ranchos de Albuquerque",
    "mile": 175.4,
    "detourMiles": 0.32
   },
   {
    "key": "tractor-brewing-westside-albuquerque",
    "name": "Tractor Brewing - Westside",
    "town": "Albuquerque",
    "mile": 175.8,
    "detourMiles": 4.4
   },
   {
    "key": "la-cumbre-brewing-west-side-taproom-albuquerque",
    "name": "La Cumbre Brewing - West Side Taproom",
    "town": "Albuquerque",
    "mile": 178.1,
    "detourMiles": 2.76
   },
   {
    "key": "bow-and-arrow-brewing-co-albuquerque",
    "name": "Bow & Arrow Brewing Co.",
    "town": "Albuquerque",
    "mile": 180.6,
    "detourMiles": 0.18
   },
   {
    "key": "rio-bravo-brewing-company-albuquerque",
    "name": "Rio Bravo Brewing Company",
    "town": "Albuquerque",
    "mile": 180.7,
    "detourMiles": 0.14
   },
   {
    "key": "tractor-brewing-co-wells-park-albuquerque",
    "name": "Tractor Brewing Co (Wells Park)",
    "town": "Albuquerque",
    "mile": 180.8,
    "detourMiles": 0.02
   },
   {
    "key": "marble-brewery-downtown-111-marble-ave-nw-albuquerque",
    "name": "Marble Brewery Downtown (111 Marble Ave NW)",
    "town": "Albuquerque",
    "mile": 181.4,
    "detourMiles": 0.19
   },
   {
    "key": "flagstaff-brewing-company-flagstaff",
    "name": "Flagstaff Brewing Company",
    "town": "Flagstaff",
    "mile": 157.2,
    "detourMiles": 2.55
   },
   {
    "key": "historic-brewing-company-eastside-taproom-flagstaff-flagstaff",
    "name": "Historic Brewing Company - Eastside Taproom (Flagstaff)",
    "town": "Flagstaff",
    "mile": 161.1,
    "detourMiles": 0.18
   },
   {
    "key": "wanderlust-brewing-company-flagstaff",
    "name": "Wanderlust Brewing Company",
    "town": "Flagstaff",
    "mile": 163.2,
    "detourMiles": 0.02
   },
   {
    "key": "lumberyard-brewing-co-taproom-and-grille-flagstaff",
    "name": "Lumberyard Brewing Co. Taproom and Grille",
    "town": "Flagstaff",
    "mile": 165.2,
    "detourMiles": 0.06
   },
   {
    "key": "historic-brewing-company-barrel-house-flagstaff-flagstaff",
    "name": "Historic Brewing Company - Barrel House (Flagstaff)",
    "town": "Flagstaff",
    "mile": 165.2,
    "detourMiles": 0.14
   },
   {
    "key": "beaver-street-brewery-flagstaff",
    "name": "Beaver Street Brewery",
    "town": "Flagstaff",
    "mile": 165.3,
    "detourMiles": 0.09
   },
   {
    "key": "grand-canyon-brewing-and-distillery-flagstaff-brewpub-flagstaff",
    "name": "Grand Canyon Brewing & Distillery - Flagstaff Brewpub",
    "town": "Flagstaff",
    "mile": 166.6,
    "detourMiles": 0.49
   },
   {
    "key": "historic-brewing-company-barrel-house-williams-williams",
    "name": "Historic Brewing Company - Barrel House (Williams)",
    "town": "Williams",
    "mile": 197.9,
    "detourMiles": 0
   },
   {
    "key": "grand-canyon-brewing-and-distillery-williams-williams",
    "name": "Grand Canyon Brewing & Distillery (Williams)",
    "town": "Williams",
    "mile": 198.2,
    "detourMiles": 0.17
   },
   {
    "key": "rowdys-brewing-company-rancho-cucamonga",
    "name": "Rowdy's Brewing Company",
    "town": "Rancho Cucamonga",
    "mile": 265.2,
    "detourMiles": 1.48
   },
   {
    "key": "hamilton-family-brewery-rancho-cucamonga",
    "name": "Hamilton Family Brewery",
    "town": "Rancho Cucamonga",
    "mile": 265.5,
    "detourMiles": 0.96
   },
   {
    "key": "kings-brewing-company-rancho-cucamonga",
    "name": "Kings Brewing Company",
    "town": "Upland",
    "mile": 268.7,
    "detourMiles": 0.67
   },
   {
    "key": "rescue-brewing-co-upland",
    "name": "Rescue Brewing Co",
    "town": "Upland",
    "mile": 268.7,
    "detourMiles": 0.77
   },
   {
    "key": "dragons-tale-brewery-montclair",
    "name": "Dragon's Tale Brewery",
    "town": "Montclair",
    "mile": 270.9,
    "detourMiles": 1.03
   },
   {
    "key": "mt-baldy-brewery-formerly-last-name-brewing-upland",
    "name": "Mt. Baldy Brewery (formerly Last Name Brewing)",
    "town": "Upland",
    "mile": 271.2,
    "detourMiles": 0.1
   },
   {
    "key": "claremont-craft-ales-claremont",
    "name": "Claremont Craft Ales",
    "town": "Claremont",
    "mile": 271.8,
    "detourMiles": 0.17
   },
   {
    "key": "homage-brewing-pomona",
    "name": "Homage Brewing",
    "town": "Pomona",
    "mile": 274.3,
    "detourMiles": 3.46
   },
   {
    "key": "old-stump-brewery-pomona",
    "name": "Old Stump Brewery",
    "town": "Pomona",
    "mile": 274.5,
    "detourMiles": 0.77
   },
   {
    "key": "smog-city-brewing-co-glendora-public-market-taproom-glendora",
    "name": "Smog City Brewing Co. - Glendora Public Market taproom",
    "town": "Glendora",
    "mile": 280.3,
    "detourMiles": 1.53
   },
   {
    "key": "arrow-lodge-brewing-covina",
    "name": "Arrow Lodge Brewing",
    "town": "Covina",
    "mile": 282.1,
    "detourMiles": 1.62
   },
   {
    "key": "alosta-brewing-co-covina",
    "name": "Alosta Brewing Co",
    "town": "Covina",
    "mile": 282.1,
    "detourMiles": 1.73
   },
   {
    "key": "campsite-brewing-company-covina",
    "name": "Campsite Brewing Company",
    "town": "Covina",
    "mile": 282.5,
    "detourMiles": 2.54
   },
   {
    "key": "nova-brewing-co-covina",
    "name": "Nova Brewing Co",
    "town": "Covina",
    "mile": 285,
    "detourMiles": 3.11
   },
   {
    "key": "mt-lowe-brewing-company-arcadia",
    "name": "Mt Lowe Brewing Company",
    "town": "Arcadia",
    "mile": 290.9,
    "detourMiles": 0.22
   },
   {
    "key": "wild-parrot-brewing-company-pasadena",
    "name": "Wild Parrot Brewing Company",
    "town": "Pasadena",
    "mile": 295.6,
    "detourMiles": 0
   },
   {
    "key": "stone-brewing-tap-room-pasadena-pasadena",
    "name": "Stone Brewing Tap Room - Pasadena",
    "town": "Pasadena",
    "mile": 298.4,
    "detourMiles": 0.07
   },
   {
    "key": "cerveceria-del-pueblo-pasadena",
    "name": "Cerveceria Del Pueblo",
    "town": "Pasadena",
    "mile": 298.6,
    "detourMiles": 0.33
   },
   {
    "key": "ohana-brewing-company-los-angeles",
    "name": "Ohana Brewing Company",
    "town": "Alhambra",
    "mile": 300,
    "detourMiles": 2.08
   },
   {
    "key": "benny-boy-brewing-los-angeles",
    "name": "Benny Boy Brewing",
    "town": "Los Angeles",
    "mile": 306.6,
    "detourMiles": 1.18
   },
   {
    "key": "highland-park-brewery-chinatown-taproom-los-angeles",
    "name": "Highland Park Brewery (Chinatown taproom)",
    "town": "Los Angeles",
    "mile": 306.7,
    "detourMiles": 0.26
   },
   {
    "key": "homage-brewing-los-angeles",
    "name": "Homage Brewing",
    "town": "Los Angeles",
    "mile": 306.7,
    "detourMiles": 0.37
   },
   {
    "key": "boomtown-brewery-los-angeles",
    "name": "Boomtown Brewery",
    "town": "Los Angeles",
    "mile": 307.4,
    "detourMiles": 1.11
   },
   {
    "key": "karl-strauss-brewing-co-downtown-los-angeles-los-angeles",
    "name": "Karl Strauss Brewing Co - Downtown Los Angeles",
    "town": "Los Angeles",
    "mile": 307.4,
    "detourMiles": 1.16
   },
   {
    "key": "frogtown-brewery-los-angeles",
    "name": "Frogtown Brewery",
    "town": "Los Angeles",
    "mile": 310.3,
    "detourMiles": 1.86
   },
   {
    "key": "golden-road-brewing-atwater-village-brewpub-los-angeles",
    "name": "Golden Road Brewing (Atwater Village brewpub)",
    "town": "Los Angeles",
    "mile": 310.6,
    "detourMiles": 3.98
   },
   {
    "key": "brewyard-beer-company-llc-glendale",
    "name": "Brewyard Beer Company LLC",
    "town": "Glendale",
    "mile": 311.8,
    "detourMiles": 4.75
   },
   {
    "key": "santa-monica-brew-works-santa-monica",
    "name": "Santa Monica Brew Works",
    "town": "Santa Monica",
    "mile": 323.5,
    "detourMiles": 0.29
   },
   {
    "key": "firestone-walker-brewing-co-propagator-venice-taproom-marina-del-rey",
    "name": "Firestone Walker Brewing Co (Propagator / Venice Taproom)",
    "town": "Marina del Rey",
    "mile": 324.7,
    "detourMiles": 2.78
   }
  ],
  "after": [
   {
    "key": "haymarket-brewery-haymarket-pub-and-brewery-chicago",
    "name": "Haymarket Brewery (Haymarket Pub and Brewery)",
    "town": "Chicago",
    "mile": 1.2,
    "detourMiles": 0.34
   },
   {
    "key": "off-color-brewing-mousetrap-taproom-chicago",
    "name": "Off Color Brewing (Mousetrap taproom)",
    "town": "Chicago",
    "mile": 1.4,
    "detourMiles": 2.02
   },
   {
    "key": "greenstar-brewing-at-uncommon-ground-chicago",
    "name": "Greenstar Brewing at Uncommon Ground",
    "town": "Chicago",
    "mile": 1.8,
    "detourMiles": 4.98
   },
   {
    "key": "all-rise-brewing-co-chicago",
    "name": "All Rise Brewing Co",
    "town": "Chicago",
    "mile": 2.2,
    "detourMiles": 0.52
   },
   {
    "key": "goose-island-beer-co-fulton-street-brewery-and-taproom-chicago",
    "name": "Goose Island Beer Co. Fulton Street Brewery and Taproom",
    "town": "Chicago",
    "mile": 2.4,
    "detourMiles": 0.58
   },
   {
    "key": "piece-brewery-chicago",
    "name": "Piece Brewery",
    "town": "Chicago",
    "mile": 2.4,
    "detourMiles": 2.2
   },
   {
    "key": "maplewood-brewery-and-distillery-the-lounge-chicago-chicago",
    "name": "Maplewood Brewery & Distillery (The Lounge, Chicago)",
    "town": "Chicago",
    "mile": 2.4,
    "detourMiles": 3.76
   },
   {
    "key": "revolution-brewing-taproom-production-brewery-kedzie-chicago",
    "name": "Revolution Brewing Taproom + Production Brewery (Kedzie)",
    "town": "Chicago",
    "mile": 2.4,
    "detourMiles": 3.98
   },
   {
    "key": "kinslahger-brewing-company-oak-park",
    "name": "Kinslahger Brewing Company",
    "town": "Oak Park",
    "mile": 8.7,
    "detourMiles": 2.4
   },
   {
    "key": "flapjack-brewery-berwyn",
    "name": "Flapjack Brewery",
    "town": "Berwyn",
    "mile": 9.6,
    "detourMiles": 0.43
   },
   {
    "key": "buckledown-brewing-lyons",
    "name": "BuckleDown Brewing",
    "town": "Lyons",
    "mile": 11.1,
    "detourMiles": 0.52
   },
   {
    "key": "imperial-oak-brewing-willow-springs-willow-springs",
    "name": "Imperial Oak Brewing (Willow Springs)",
    "town": "Willow Springs",
    "mile": 17.8,
    "detourMiles": 2.43
   },
   {
    "key": "black-horizon-brewing-company-willowbrook",
    "name": "Black Horizon Brewing Company",
    "town": "Willowbrook",
    "mile": 19.4,
    "detourMiles": 0.45
   },
   {
    "key": "skeleton-key-brewery-woodridge",
    "name": "Skeleton Key Brewery",
    "town": "Woodridge",
    "mile": 22.9,
    "detourMiles": 1.61
   },
   {
    "key": "pollyanna-brewing-company-lemont",
    "name": "Pollyanna Brewing Company",
    "town": "Lemont",
    "mile": 24.9,
    "detourMiles": 2.58
   },
   {
    "key": "destihl-brewery-beer-hall-and-barrel-room-normal-normal",
    "name": "DESTIHL Brewery + Beer Hall & Barrel Room (Normal)",
    "town": "Normal",
    "mile": 125.7,
    "detourMiles": 0.23
   },
   {
    "key": "white-oak-brewing-normal",
    "name": "White Oak Brewing",
    "town": "Normal",
    "mile": 130,
    "detourMiles": 1.44
   },
   {
    "key": "keg-grove-brewing-company-bloomington-bloomington",
    "name": "Keg Grove Brewing Company (Bloomington)",
    "town": "Bloomington",
    "mile": 130.8,
    "detourMiles": 0.58
   },
   {
    "key": "lil-beaver-brewery-bloomington",
    "name": "Lil Beaver Brewery",
    "town": "Bloomington",
    "mile": 132.7,
    "detourMiles": 0.83
   },
   {
    "key": "engrained-brewing-co-springfield",
    "name": "Engrained Brewing Co",
    "town": "Springfield",
    "mile": 196.2,
    "detourMiles": 0.26
   },
   {
    "key": "schlafly-tap-room-st-louis",
    "name": "Schlafly Tap Room",
    "town": "St. Louis",
    "mile": 0,
    "detourMiles": 9.22
   },
   {
    "key": "4-hands-brewery-and-tasting-room-st-louis",
    "name": "4 Hands Brewery & Tasting Room",
    "town": "St. Louis",
    "mile": 0,
    "detourMiles": 10.27
   },
   {
    "key": "square-one-brewery-and-distillery-st-louis",
    "name": "Square One Brewery & Distillery",
    "town": "St. Louis",
    "mile": 0,
    "detourMiles": 10.34
   },
   {
    "key": "blue-jay-brewing-company-st-louis",
    "name": "Blue Jay Brewing Company",
    "town": "St. Louis",
    "mile": 1.9,
    "detourMiles": 9.18
   },
   {
    "key": "six-mile-bridge-brewery-maryland-heights",
    "name": "Six Mile Bridge Brewery",
    "town": "Maryland Heights",
    "mile": 16.3,
    "detourMiles": 1.27
   },
   {
    "key": "urban-chestnut-brewing-company-grove-bierhall-st-louis",
    "name": "Urban Chestnut Brewing Company, Grove Bierhall",
    "town": "St. Louis",
    "mile": 22.4,
    "detourMiles": 7.82
   },
   {
    "key": "rockwell-beer-company-the-grove-taproom-and-brewery-st-louis",
    "name": "Rockwell Beer Company, The Grove Taproom & Brewery",
    "town": "St. Louis",
    "mile": 22.4,
    "detourMiles": 8.33
   },
   {
    "key": "2nd-shift-brewing-st-louis",
    "name": "2nd Shift Brewing",
    "town": "St. Louis",
    "mile": 22.6,
    "detourMiles": 6.76
   },
   {
    "key": "side-project-brewing-maplewood",
    "name": "Side Project Brewing",
    "town": "Maplewood",
    "mile": 23.3,
    "detourMiles": 4.52
   },
   {
    "key": "schlafly-bottleworks-maplewood",
    "name": "Schlafly Bottleworks",
    "town": "Maplewood",
    "mile": 23.3,
    "detourMiles": 4.92
   },
   {
    "key": "alpha-brewing-company-st-louis",
    "name": "Alpha Brewing Company",
    "town": "St. Louis",
    "mile": 24.2,
    "detourMiles": 7.77
   },
   {
    "key": "civil-life-brewing-co-st-louis",
    "name": "Civil Life Brewing Co.",
    "town": "St. Louis",
    "mile": 24.9,
    "detourMiles": 8
   },
   {
    "key": "bluewood-brewing-st-louis",
    "name": "Bluewood Brewing",
    "town": "St. Louis",
    "mile": 24.9,
    "detourMiles": 10.18
   },
   {
    "key": "4-hands-kirkwood-kirkwood",
    "name": "4 Hands Kirkwood",
    "town": "Kirkwood",
    "mile": 25.5,
    "detourMiles": 0.05
   },
   {
    "key": "beer-outside-brewery-valley-park-2",
    "name": "Beer Outside Brewery",
    "town": "Valley Park",
    "mile": 32.5,
    "detourMiles": 0.15
   },
   {
    "key": "pacific-brew-haus-pacific",
    "name": "Pacific Brew Haus",
    "town": "Pacific",
    "mile": 47.5,
    "detourMiles": 1.12
   },
   {
    "key": "point-labaddie-brewery-labadie",
    "name": "Point Labaddie Brewery",
    "town": "Labadie",
    "mile": 50.9,
    "detourMiles": 1
   },
   {
    "key": "muddy-banks-brewing-company-sullivan",
    "name": "Muddy Banks Brewing Company",
    "town": "Sullivan",
    "mile": 81,
    "detourMiles": 0.26
   },
   {
    "key": "public-house-brewing-company-st-james-taproom-saint-james",
    "name": "Public House Brewing Company (St. James Taproom)",
    "town": "Saint James",
    "mile": 113.7,
    "detourMiles": 0.86
   },
   {
    "key": "public-house-brewing-company-rolla-r-and-d-brewpub-rolla",
    "name": "Public House Brewing Company (Rolla R&D Brewpub)",
    "town": "Rolla",
    "mile": 123.8,
    "detourMiles": 0.26
   },
   {
    "key": "boat-town-brewing-phillipsburg",
    "name": "Boat Town Brewing",
    "town": "Lebanon",
    "mile": 186.7,
    "detourMiles": 0.41
   },
   {
    "key": "before-and-after-brewing-springfield",
    "name": "Before and After Brewing",
    "town": "Springfield",
    "mile": 236.8,
    "detourMiles": 4.05
   },
   {
    "key": "tie-and-timber-beer-company-springfield",
    "name": "Tie and Timber Beer Company",
    "town": "Springfield",
    "mile": 238.7,
    "detourMiles": 2.52
   },
   {
    "key": "hold-fast-brewing-springfield",
    "name": "Hold Fast Brewing",
    "town": "Springfield",
    "mile": 239.7,
    "detourMiles": 1.62
   },
   {
    "key": "springfield-brewing-company-brewco-taproom-springfield",
    "name": "Springfield Brewing Company (BrewCo Taproom)",
    "town": "Springfield",
    "mile": 240.2,
    "detourMiles": 2.28
   },
   {
    "key": "mothers-brewing-co-springfield",
    "name": "Mother's Brewing Co",
    "town": "Springfield",
    "mile": 240.4,
    "detourMiles": 2.27
   },
   {
    "key": "heirloom-rustic-ales-tulsa",
    "name": "Heirloom Rustic Ales",
    "town": "Tulsa",
    "mile": 106.7,
    "detourMiles": 0.16
   },
   {
    "key": "marshall-brewing-co-llc-tulsa",
    "name": "Marshall Brewing Co, LLC",
    "town": "Tulsa",
    "mile": 106.9,
    "detourMiles": 0.26
   },
   {
    "key": "dead-armadillo-brewery-tulsa",
    "name": "Dead Armadillo Brewery",
    "town": "Tulsa",
    "mile": 107.7,
    "detourMiles": 0.15
   },
   {
    "key": "new-era-fine-fermentations-neff-brewing-tulsa",
    "name": "New Era Fine Fermentations (Neff Brewing)",
    "town": "Tulsa",
    "mile": 107.9,
    "detourMiles": 0.12
   },
   {
    "key": "cabin-boys-brewpub-tulsa",
    "name": "Cabin Boys Brewpub",
    "town": "Tulsa",
    "mile": 108.5,
    "detourMiles": 0.38
   },
   {
    "key": "nothings-left-brewing-co-tulsa",
    "name": "Nothing's Left Brewing Co.",
    "town": "Tulsa",
    "mile": 108.6,
    "detourMiles": 0.35
   },
   {
    "key": "frenzy-brewing-company-edmond",
    "name": "Frenzy Brewing Company",
    "town": "Edmond",
    "mile": 212.1,
    "detourMiles": 0.11
   },
   {
    "key": "roughtail-brewing-oklahoma-city",
    "name": "Roughtail Brewing",
    "town": "Oklahoma City",
    "mile": 215.5,
    "detourMiles": 1.3
   },
   {
    "key": "prairie-artisan-ales-okc-taproom-oklahoma-city",
    "name": "Prairie Artisan Ales (OKC taproom)",
    "town": "Oklahoma City",
    "mile": 224.2,
    "detourMiles": 1.16
   },
   {
    "key": "skydance-brewing-company-oklahoma-city",
    "name": "Skydance Brewing Company",
    "town": "Oklahoma City",
    "mile": 224.2,
    "detourMiles": 1.25
   },
   {
    "key": "core4-brewing-company-oklahoma-city",
    "name": "Core4 Brewing Company",
    "town": "Oklahoma City",
    "mile": 224.8,
    "detourMiles": 1.84
   },
   {
    "key": "stonecloud-brewing-co-okc-taproom-oklahoma-city",
    "name": "Stonecloud Brewing Co. (OKC taproom)",
    "town": "Oklahoma City",
    "mile": 225.1,
    "detourMiles": 1.7
   },
   {
    "key": "anthem-brewing-co-oklahoma-city",
    "name": "Anthem Brewing Co",
    "town": "Oklahoma City",
    "mile": 225.1,
    "detourMiles": 2.23
   },
   {
    "key": "okie-beer-co-oklahoma-city",
    "name": "Okie Beer Co.",
    "town": "Oklahoma City",
    "mile": 229.8,
    "detourMiles": 0.15
   },
   {
    "key": "old-tascosa-brewing-company-amarillo",
    "name": "Old Tascosa Brewing Company",
    "town": "Amarillo",
    "mile": 110.4,
    "detourMiles": 0.01
   },
   {
    "key": "pondaseta-brewing-co-amarillo-taproom-amarillo",
    "name": "Pondaseta Brewing Co. (Amarillo Taproom)",
    "town": "Amarillo",
    "mile": 114,
    "detourMiles": 2.05
   },
   {
    "key": "canteen-taproom-albuquerque",
    "name": "Canteen Taproom",
    "town": "Albuquerque",
    "mile": 207.1,
    "detourMiles": 0.24
   },
   {
    "key": "boxing-bear-brewing-bridges-on-tramway-taproom-albuquerque",
    "name": "Boxing Bear Brewing - Bridges on Tramway Taproom",
    "town": "Albuquerque",
    "mile": 207.8,
    "detourMiles": 3.25
   },
   {
    "key": "bombs-away-beer-company-albuquerque",
    "name": "Bombs Away Beer Company",
    "town": "Albuquerque",
    "mile": 209.5,
    "detourMiles": 0.12
   },
   {
    "key": "high-and-dry-brewing-albuquerque",
    "name": "High and Dry Brewing",
    "town": "Albuquerque",
    "mile": 212.8,
    "detourMiles": 0.51
   },
   {
    "key": "tractor-brewing-nob-hill-albuquerque",
    "name": "Tractor Brewing - Nob Hill",
    "town": "Albuquerque",
    "mile": 213.4,
    "detourMiles": 0.02
   },
   {
    "key": "santa-fe-brewing-abq-at-green-jeans-albuquerque",
    "name": "Santa Fe Brewing - ABQ at Green Jeans",
    "town": "Albuquerque",
    "mile": 213.5,
    "detourMiles": 1.81
   },
   {
    "key": "flock-of-moons-brewing-albuquerque",
    "name": "Flock of Moons Brewing",
    "town": "Albuquerque",
    "mile": 214.2,
    "detourMiles": 0.01
   },
   {
    "key": "sidetrack-brewing-company-albuquerque",
    "name": "Sidetrack Brewing Company",
    "town": "Albuquerque",
    "mile": 215.9,
    "detourMiles": 0.13
   },
   {
    "key": "ex-novo-brewing-albuquerque-taproom-and-restaurant-albuquerque",
    "name": "Ex Novo Brewing - Albuquerque Taproom and Restaurant",
    "town": "Albuquerque",
    "mile": 216.2,
    "detourMiles": 0
   },
   {
    "key": "santa-fe-brewing-the-brakeroom-santa-fe",
    "name": "Santa Fe Brewing - The Brakeroom",
    "town": "Santa Fe",
    "mile": 120.2,
    "detourMiles": 0.1
   },
   {
    "key": "rowley-farmhouse-ales-santa-fe",
    "name": "Rowley Farmhouse Ales",
    "town": "Santa Fe",
    "mile": 123,
    "detourMiles": 0.08
   },
   {
    "key": "second-street-brewery-rufina-taproom-santa-fe",
    "name": "Second Street Brewery - Rufina Taproom",
    "town": "Santa Fe",
    "mile": 123.4,
    "detourMiles": 0.17
   },
   {
    "key": "santa-fe-brewing-co-the-beer-hall-at-hq-santa-fe",
    "name": "Santa Fe Brewing Co. (The Beer Hall at HQ)",
    "town": "Santa Fe",
    "mile": 129,
    "detourMiles": 0.04
   },
   {
    "key": "ex-novo-brewing-corrales-brewery-taproom-and-corral-corrales",
    "name": "Ex Novo Brewing - Corrales Brewery, Taproom and Corral",
    "town": "Corrales",
    "mile": 171.3,
    "detourMiles": 1.35
   },
   {
    "key": "boxing-bear-brewing-firestone-taproom-and-brewery-albuquerque",
    "name": "Boxing Bear Brewing - Firestone Taproom & Brewery",
    "town": "Albuquerque",
    "mile": 174.4,
    "detourMiles": 1.62
   },
   {
    "key": "steel-bender-brewyard-los-ranchos-de-albuquerque",
    "name": "Steel Bender Brewyard",
    "town": "Los Ranchos de Albuquerque",
    "mile": 175.4,
    "detourMiles": 0.32
   },
   {
    "key": "tractor-brewing-westside-albuquerque",
    "name": "Tractor Brewing - Westside",
    "town": "Albuquerque",
    "mile": 175.8,
    "detourMiles": 4.4
   },
   {
    "key": "la-cumbre-brewing-west-side-taproom-albuquerque",
    "name": "La Cumbre Brewing - West Side Taproom",
    "town": "Albuquerque",
    "mile": 178.1,
    "detourMiles": 2.76
   },
   {
    "key": "bow-and-arrow-brewing-co-albuquerque",
    "name": "Bow & Arrow Brewing Co.",
    "town": "Albuquerque",
    "mile": 180.6,
    "detourMiles": 0.18
   },
   {
    "key": "rio-bravo-brewing-company-albuquerque",
    "name": "Rio Bravo Brewing Company",
    "town": "Albuquerque",
    "mile": 180.7,
    "detourMiles": 0.14
   },
   {
    "key": "tractor-brewing-co-wells-park-albuquerque",
    "name": "Tractor Brewing Co (Wells Park)",
    "town": "Albuquerque",
    "mile": 180.8,
    "detourMiles": 0.02
   },
   {
    "key": "marble-brewery-downtown-111-marble-ave-nw-albuquerque",
    "name": "Marble Brewery Downtown (111 Marble Ave NW)",
    "town": "Albuquerque",
    "mile": 181.4,
    "detourMiles": 0.19
   },
   {
    "key": "flagstaff-brewing-company-flagstaff",
    "name": "Flagstaff Brewing Company",
    "town": "Flagstaff",
    "mile": 157.2,
    "detourMiles": 2.55
   },
   {
    "key": "historic-brewing-company-eastside-taproom-flagstaff-flagstaff",
    "name": "Historic Brewing Company - Eastside Taproom (Flagstaff)",
    "town": "Flagstaff",
    "mile": 161.1,
    "detourMiles": 0.18
   },
   {
    "key": "wanderlust-brewing-company-flagstaff",
    "name": "Wanderlust Brewing Company",
    "town": "Flagstaff",
    "mile": 163.2,
    "detourMiles": 0.02
   },
   {
    "key": "lumberyard-brewing-co-taproom-and-grille-flagstaff",
    "name": "Lumberyard Brewing Co. Taproom and Grille",
    "town": "Flagstaff",
    "mile": 165.2,
    "detourMiles": 0.06
   },
   {
    "key": "historic-brewing-company-barrel-house-flagstaff-flagstaff",
    "name": "Historic Brewing Company - Barrel House (Flagstaff)",
    "town": "Flagstaff",
    "mile": 165.2,
    "detourMiles": 0.14
   },
   {
    "key": "beaver-street-brewery-flagstaff",
    "name": "Beaver Street Brewery",
    "town": "Flagstaff",
    "mile": 165.3,
    "detourMiles": 0.09
   },
   {
    "key": "grand-canyon-brewing-and-distillery-flagstaff-brewpub-flagstaff",
    "name": "Grand Canyon Brewing & Distillery - Flagstaff Brewpub",
    "town": "Flagstaff",
    "mile": 166.6,
    "detourMiles": 0.49
   },
   {
    "key": "historic-brewing-company-barrel-house-williams-williams",
    "name": "Historic Brewing Company - Barrel House (Williams)",
    "town": "Williams",
    "mile": 197.9,
    "detourMiles": 0
   },
   {
    "key": "grand-canyon-brewing-and-distillery-williams-williams",
    "name": "Grand Canyon Brewing & Distillery (Williams)",
    "town": "Williams",
    "mile": 198.2,
    "detourMiles": 0.17
   },
   {
    "key": "rowdys-brewing-company-rancho-cucamonga",
    "name": "Rowdy's Brewing Company",
    "town": "Rancho Cucamonga",
    "mile": 265.2,
    "detourMiles": 1.48
   },
   {
    "key": "hamilton-family-brewery-rancho-cucamonga",
    "name": "Hamilton Family Brewery",
    "town": "Rancho Cucamonga",
    "mile": 265.5,
    "detourMiles": 0.96
   },
   {
    "key": "kings-brewing-company-rancho-cucamonga",
    "name": "Kings Brewing Company",
    "town": "Upland",
    "mile": 268.7,
    "detourMiles": 0.67
   },
   {
    "key": "rescue-brewing-co-upland",
    "name": "Rescue Brewing Co",
    "town": "Upland",
    "mile": 268.7,
    "detourMiles": 0.77
   },
   {
    "key": "dragons-tale-brewery-montclair",
    "name": "Dragon's Tale Brewery",
    "town": "Montclair",
    "mile": 270.9,
    "detourMiles": 1.03
   },
   {
    "key": "mt-baldy-brewery-formerly-last-name-brewing-upland",
    "name": "Mt. Baldy Brewery (formerly Last Name Brewing)",
    "town": "Upland",
    "mile": 271.2,
    "detourMiles": 0.1
   },
   {
    "key": "claremont-craft-ales-claremont",
    "name": "Claremont Craft Ales",
    "town": "Claremont",
    "mile": 271.8,
    "detourMiles": 0.17
   },
   {
    "key": "homage-brewing-pomona",
    "name": "Homage Brewing",
    "town": "Pomona",
    "mile": 274.3,
    "detourMiles": 3.46
   },
   {
    "key": "old-stump-brewery-pomona",
    "name": "Old Stump Brewery",
    "town": "Pomona",
    "mile": 274.5,
    "detourMiles": 0.77
   },
   {
    "key": "smog-city-brewing-co-glendora-public-market-taproom-glendora",
    "name": "Smog City Brewing Co. - Glendora Public Market taproom",
    "town": "Glendora",
    "mile": 280.3,
    "detourMiles": 1.53
   },
   {
    "key": "arrow-lodge-brewing-covina",
    "name": "Arrow Lodge Brewing",
    "town": "Covina",
    "mile": 282.1,
    "detourMiles": 1.62
   },
   {
    "key": "alosta-brewing-co-covina",
    "name": "Alosta Brewing Co",
    "town": "Covina",
    "mile": 282.1,
    "detourMiles": 1.73
   },
   {
    "key": "campsite-brewing-company-covina",
    "name": "Campsite Brewing Company",
    "town": "Covina",
    "mile": 282.5,
    "detourMiles": 2.54
   },
   {
    "key": "nova-brewing-co-covina",
    "name": "Nova Brewing Co",
    "town": "Covina",
    "mile": 285,
    "detourMiles": 3.11
   },
   {
    "key": "mt-lowe-brewing-company-arcadia",
    "name": "Mt Lowe Brewing Company",
    "town": "Arcadia",
    "mile": 290.9,
    "detourMiles": 0.22
   },
   {
    "key": "wild-parrot-brewing-company-pasadena",
    "name": "Wild Parrot Brewing Company",
    "town": "Pasadena",
    "mile": 295.6,
    "detourMiles": 0
   },
   {
    "key": "stone-brewing-tap-room-pasadena-pasadena",
    "name": "Stone Brewing Tap Room - Pasadena",
    "town": "Pasadena",
    "mile": 298.4,
    "detourMiles": 0.07
   },
   {
    "key": "cerveceria-del-pueblo-pasadena",
    "name": "Cerveceria Del Pueblo",
    "town": "Pasadena",
    "mile": 298.6,
    "detourMiles": 0.33
   },
   {
    "key": "ohana-brewing-company-los-angeles",
    "name": "Ohana Brewing Company",
    "town": "Alhambra",
    "mile": 300,
    "detourMiles": 2.08
   },
   {
    "key": "benny-boy-brewing-los-angeles",
    "name": "Benny Boy Brewing",
    "town": "Los Angeles",
    "mile": 306.6,
    "detourMiles": 1.18
   },
   {
    "key": "highland-park-brewery-chinatown-taproom-los-angeles",
    "name": "Highland Park Brewery (Chinatown taproom)",
    "town": "Los Angeles",
    "mile": 306.7,
    "detourMiles": 0.26
   },
   {
    "key": "homage-brewing-los-angeles",
    "name": "Homage Brewing",
    "town": "Los Angeles",
    "mile": 306.7,
    "detourMiles": 0.37
   },
   {
    "key": "boomtown-brewery-los-angeles",
    "name": "Boomtown Brewery",
    "town": "Los Angeles",
    "mile": 307.4,
    "detourMiles": 1.11
   },
   {
    "key": "karl-strauss-brewing-co-downtown-los-angeles-los-angeles",
    "name": "Karl Strauss Brewing Co - Downtown Los Angeles",
    "town": "Los Angeles",
    "mile": 307.4,
    "detourMiles": 1.16
   },
   {
    "key": "frogtown-brewery-los-angeles",
    "name": "Frogtown Brewery",
    "town": "Los Angeles",
    "mile": 310.3,
    "detourMiles": 1.86
   },
   {
    "key": "golden-road-brewing-atwater-village-brewpub-los-angeles",
    "name": "Golden Road Brewing (Atwater Village brewpub)",
    "town": "Los Angeles",
    "mile": 310.6,
    "detourMiles": 3.98
   },
   {
    "key": "brewyard-beer-company-llc-glendale",
    "name": "Brewyard Beer Company LLC",
    "town": "Glendale",
    "mile": 311.8,
    "detourMiles": 4.75
   },
   {
    "key": "santa-monica-brew-works-santa-monica",
    "name": "Santa Monica Brew Works",
    "town": "Santa Monica",
    "mile": 323.5,
    "detourMiles": 0.29
   },
   {
    "key": "firestone-walker-brewing-co-propagator-venice-taproom-marina-del-rey",
    "name": "Firestone Walker Brewing Co (Propagator / Venice Taproom)",
    "town": "Marina del Rey",
    "mile": 324.7,
    "detourMiles": 2.78
   }
  ],
  "removed": [],
  "added": [],
  "measured": [],
  "slight": 0,
  "towns": []
 }
];
