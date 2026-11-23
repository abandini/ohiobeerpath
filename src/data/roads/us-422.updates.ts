// RECORDS, written once each by scripts/record-road-update.mjs. Each entry is a completed, dated update to a page that
// was already public: the list before and after, why each stop left or joined, and what was re-measured. The page
// renders its dated notice and entry from these alone. Do not edit an entry and do not regenerate one that has been
// published: a later change to the page gets a new dated entry.
import type { UpdateEvent } from '../../lib/road-trip';

export const US_422_UPDATES: UpdateEvent[] = [
 {
  "date": "2026-11-22",
  "what": "We revised how we locate breweries using their published addresses.",
  "before": [
   {
    "breweryId": 208,
    "name": "Masthead Brewing Company",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 0.32
   },
   {
    "breweryId": 72,
    "name": "Collision Bend Brewing Company",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 0.57
   },
   {
    "breweryId": 280,
    "name": "Saucy Brew Works",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 1.11
   },
   {
    "breweryId": 308,
    "name": "Terrestrial Brewing Company",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 2.4
   },
   {
    "breweryId": 51,
    "name": "Brick and Barrel",
    "town": "Cleveland",
    "mile": 0.2,
    "detourMiles": 0.72
   },
   {
    "breweryId": 207,
    "name": "Market Garden Brewpub",
    "town": "Cleveland",
    "mile": 0.2,
    "detourMiles": 1.04
   },
   {
    "breweryId": 120,
    "name": "Forest City Brewery",
    "town": "Cleveland",
    "mile": 0.2,
    "detourMiles": 1.05
   },
   {
    "breweryId": 136,
    "name": "Great Lakes Brewing Company",
    "town": "Cleveland",
    "mile": 0.2,
    "detourMiles": 1.11
   },
   {
    "breweryId": 2356,
    "name": "Hansa Brewery",
    "town": "Cleveland",
    "mile": 0.2,
    "detourMiles": 1.17
   },
   {
    "breweryId": 296,
    "name": "Southern Tier Brewing Co. Cleveland",
    "town": "Cleveland",
    "mile": 0.3,
    "detourMiles": 0.23
   },
   {
    "breweryId": 154,
    "name": "Hofbräuhaus Cleveland",
    "town": "Cleveland",
    "mile": 0.4,
    "detourMiles": 0.61
   },
   {
    "breweryId": 130,
    "name": "Goldhorn Brewery",
    "town": "Cleveland",
    "mile": 1.8,
    "detourMiles": 2.25
   },
   {
    "breweryId": 182,
    "name": "The Jolly Scholar",
    "town": "Cleveland",
    "mile": 3.5,
    "detourMiles": 2.45
   },
   {
    "breweryId": 82,
    "name": "Crooked Pecker Brewing Company",
    "town": "Newbury",
    "mile": 22.4,
    "detourMiles": 1.86
   },
   {
    "breweryId": 261,
    "name": "Pompatus Brewing Co",
    "town": "Chagrin Falls",
    "mile": 25.6,
    "detourMiles": 0.71
   },
   {
    "breweryId": 60,
    "name": "Bummin' Beaver Brewery",
    "town": "Auburn Twp.",
    "mile": 29.1,
    "detourMiles": 0.24
   },
   {
    "breweryId": 218,
    "name": "Modern Methods Brewing Company",
    "town": "Warren",
    "mile": 54.1,
    "detourMiles": 0.11
   },
   {
    "breweryId": 26,
    "name": "Biker Brewhouse",
    "town": "Austintown",
    "mile": 63.6,
    "detourMiles": 4.27
   },
   {
    "breweryId": 259,
    "name": "Penguin City Brewing Company",
    "town": "Youngstown",
    "mile": 67,
    "detourMiles": 0.55
   },
   {
    "breweryId": 2394,
    "name": "Noble Creature Cask House",
    "town": "Youngstown",
    "mile": 67.8,
    "detourMiles": 0.42
   },
   {
    "breweryId": 992,
    "name": "Brew 32",
    "town": "Pulaski",
    "mile": 77.5,
    "detourMiles": 3.59
   },
   {
    "breweryId": 1030,
    "name": "Crooked Tongue Brewing",
    "town": "Edinburg",
    "mile": 81.2,
    "detourMiles": 2.07
   },
   {
    "breweryId": 1184,
    "name": "Recon Brewing",
    "town": "Butler",
    "mile": 115.1,
    "detourMiles": 1.31
   },
   {
    "breweryId": 1122,
    "name": "Levity Brewing Co",
    "town": "Indiana",
    "mile": 166.7,
    "detourMiles": 3.63
   },
   {
    "breweryId": 1261,
    "name": "Troegs Brewing Co",
    "town": "Hershey",
    "mile": 2.5,
    "detourMiles": 0.04
   },
   {
    "breweryId": 1197,
    "name": "Rotunda Brewing",
    "town": "Annville",
    "mile": 10.2,
    "detourMiles": 0
   },
   {
    "breweryId": 1218,
    "name": "Snitz Creek Brewery",
    "town": "Lebanon",
    "mile": 15.2,
    "detourMiles": 0.02
   },
   {
    "breweryId": 1082,
    "name": "Hidden River Brewing Co",
    "town": "Douglassville",
    "mile": 57.3,
    "detourMiles": 0.01
   },
   {
    "breweryId": 1217,
    "name": "Sly Fox Brewing Co",
    "town": "Pottstown",
    "mile": 60.8,
    "detourMiles": 1.47
   },
   {
    "breweryId": 1196,
    "name": "Root Down Brewing Company",
    "town": "Phoenixville",
    "mile": 73.4,
    "detourMiles": 2.4
   },
   {
    "breweryId": 1228,
    "name": "Stable 12 Brewing Company",
    "town": "Phoenixville",
    "mile": 73.4,
    "detourMiles": 2.72
   },
   {
    "breweryId": 1216,
    "name": "Sly Fox Brewhouse and Eatery",
    "town": "Phoenixville",
    "mile": 73.5,
    "detourMiles": 2.77
   },
   {
    "breweryId": 1115,
    "name": "La Cabra Brewing",
    "town": "Berwyn",
    "mile": 82.4,
    "detourMiles": 3.02
   },
   {
    "breweryId": 1020,
    "name": "Conshohocken Brewing - Bridgeport",
    "town": "Bridgeport",
    "mile": 82.4,
    "detourMiles": 3.66
   }
  ],
  "after": [
   {
    "breweryId": 208,
    "name": "Masthead Brewing Company",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 0.32
   },
   {
    "breweryId": 72,
    "name": "Collision Bend Brewing Company",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 0.56
   },
   {
    "breweryId": 280,
    "name": "Saucy Brew Works",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 1.11
   },
   {
    "breweryId": 308,
    "name": "Terrestrial Brewing Company",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 2.4
   },
   {
    "breweryId": 2322,
    "name": "BottleHouse Brewery",
    "town": "Lakewood",
    "mile": 0,
    "detourMiles": 4.96
   },
   {
    "breweryId": 62,
    "name": "Butcher & the Brewer",
    "town": "Cleveland",
    "mile": 0.1,
    "detourMiles": 0.13
   },
   {
    "breweryId": 51,
    "name": "Brick and Barrel",
    "town": "Cleveland",
    "mile": 0.2,
    "detourMiles": 0.68
   },
   {
    "breweryId": 120,
    "name": "Forest City Brewery",
    "town": "Cleveland",
    "mile": 0.2,
    "detourMiles": 1.06
   },
   {
    "breweryId": 207,
    "name": "Market Garden Brewpub",
    "town": "Cleveland",
    "mile": 0.2,
    "detourMiles": 1.06
   },
   {
    "breweryId": 136,
    "name": "Great Lakes Brewing Company",
    "town": "Cleveland",
    "mile": 0.2,
    "detourMiles": 1.08
   },
   {
    "breweryId": 2356,
    "name": "Hansa Brewery",
    "town": "Cleveland",
    "mile": 0.2,
    "detourMiles": 1.17
   },
   {
    "breweryId": 296,
    "name": "Southern Tier Brewing Co. Cleveland",
    "town": "Cleveland",
    "mile": 0.3,
    "detourMiles": 0.22
   },
   {
    "breweryId": 154,
    "name": "Hofbräuhaus Cleveland",
    "town": "Cleveland",
    "mile": 0.4,
    "detourMiles": 0.62
   },
   {
    "breweryId": 130,
    "name": "Goldhorn Brewery",
    "town": "Cleveland",
    "mile": 1.6,
    "detourMiles": 2.35
   },
   {
    "breweryId": 182,
    "name": "The Jolly Scholar",
    "town": "Cleveland",
    "mile": 3.5,
    "detourMiles": 2.42
   },
   {
    "breweryId": 82,
    "name": "Crooked Pecker Brewing Company",
    "town": "Chagrin Falls",
    "mile": 22.4,
    "detourMiles": 1.81
   },
   {
    "breweryId": 218,
    "name": "Modern Methods Brewing Company",
    "town": "Warren",
    "mile": 54,
    "detourMiles": 0.11
   },
   {
    "breweryId": 2394,
    "name": "Noble Creature Cask House",
    "town": "Youngstown",
    "mile": 67.8,
    "detourMiles": 0.41
   },
   {
    "breweryId": 992,
    "name": "Brew 32",
    "town": "Pulaski",
    "mile": 77.1,
    "detourMiles": 2.69
   },
   {
    "breweryId": 1030,
    "name": "Crooked Tongue Brewing",
    "town": "Edinburg",
    "mile": 80.6,
    "detourMiles": 0
   },
   {
    "breweryId": 1184,
    "name": "Recon Brewing",
    "town": "Butler",
    "mile": 115.1,
    "detourMiles": 1.31
   },
   {
    "breweryId": 1122,
    "name": "Levity Brewing Co",
    "town": "Indiana",
    "mile": 161.9,
    "detourMiles": 1.03
   },
   {
    "breweryId": 1261,
    "name": "Troegs Brewing Co",
    "town": "Hershey",
    "mile": 2.5,
    "detourMiles": 0.04
   },
   {
    "breweryId": 1197,
    "name": "Rotunda Brewing",
    "town": "Annville",
    "mile": 10.2,
    "detourMiles": 0
   },
   {
    "breweryId": 1218,
    "name": "Snitz Creek Brewery",
    "town": "Lebanon",
    "mile": 15.2,
    "detourMiles": 0.01
   },
   {
    "breweryId": 1082,
    "name": "Hidden River Brewing Co",
    "town": "Douglassville",
    "mile": 57.3,
    "detourMiles": 0.01
   },
   {
    "breweryId": 1217,
    "name": "Sly Fox Brewing Co",
    "town": "Pottstown",
    "mile": 60.8,
    "detourMiles": 1.46
   },
   {
    "breweryId": 1216,
    "name": "Sly Fox Brewhouse and Eatery",
    "town": "Phoenixville",
    "mile": 72.2,
    "detourMiles": 3.73
   },
   {
    "breweryId": 1196,
    "name": "Root Down Brewing Company",
    "town": "Phoenixville",
    "mile": 73.4,
    "detourMiles": 2.35
   },
   {
    "breweryId": 1228,
    "name": "Stable 12 Brewing Company",
    "town": "Phoenixville",
    "mile": 73.4,
    "detourMiles": 2.81
   },
   {
    "breweryId": 1115,
    "name": "La Cabra Brewing",
    "town": "Berwyn",
    "mile": 82.4,
    "detourMiles": 2.94
   },
   {
    "breweryId": 1020,
    "name": "Conshohocken Brewing - Bridgeport",
    "town": "Bridgeport",
    "mile": 82.4,
    "detourMiles": 3.81
   }
  ],
  "removed": [
   {
    "breweryId": 261,
    "name": "Pompatus Brewing Co",
    "town": "Chagrin Falls",
    "mile": 25.6,
    "detourMiles": 0.71,
    "why": "notPlaced",
    "reason": "it prints no street address, so no location can be tied to one"
   },
   {
    "breweryId": 60,
    "name": "Bummin' Beaver Brewery",
    "town": "Auburn Twp.",
    "mile": 29.1,
    "detourMiles": 0.24,
    "why": "notPlaced",
    "reason": "the geocoder matched a slightly different address (11610 E WASHINGTON ST, CHAGRIN FALLS, OH, 44023); flagged for review, and not used without a recorded decision"
   },
   {
    "breweryId": 26,
    "name": "Biker Brewhouse",
    "town": "Austintown",
    "mile": 63.6,
    "detourMiles": 4.27,
    "why": "notPlaced",
    "reason": "the geocoder found no match for its printed address, and the directory holds no matching street address"
   },
   {
    "breweryId": 259,
    "name": "Penguin City Brewing Company",
    "town": "Youngstown",
    "mile": 67,
    "detourMiles": 0.55,
    "why": "notPlaced",
    "reason": "the geocoder matched a different address (460 FEDERAL PLZ E, YOUNGSTOWN, OH, 44503), 0.94 miles from the directory's point"
   }
  ],
  "added": [
   {
    "breweryId": 2322,
    "name": "BottleHouse Brewery",
    "town": "Lakewood",
    "mile": 0,
    "detourMiles": 4.96,
    "laterCheck": true
   },
   {
    "breweryId": 62,
    "name": "Butcher & the Brewer",
    "town": "Cleveland",
    "mile": 0.1,
    "detourMiles": 0.13,
    "laterCheck": true
   }
  ],
  "measured": [
   {
    "breweryId": 992,
    "name": "Brew 32",
    "was": {
     "mile": 77.5,
     "detourMiles": 3.59
    },
    "is": {
     "mile": 77.1,
     "detourMiles": 2.69
    }
   },
   {
    "breweryId": 1030,
    "name": "Crooked Tongue Brewing",
    "was": {
     "mile": 81.2,
     "detourMiles": 2.07
    },
    "is": {
     "mile": 80.6,
     "detourMiles": 0
    }
   },
   {
    "breweryId": 1122,
    "name": "Levity Brewing Co",
    "was": {
     "mile": 166.7,
     "detourMiles": 3.63
    },
    "is": {
     "mile": 161.9,
     "detourMiles": 1.03
    }
   },
   {
    "breweryId": 1216,
    "name": "Sly Fox Brewhouse and Eatery",
    "was": {
     "mile": 73.5,
     "detourMiles": 2.77
    },
    "is": {
     "mile": 72.2,
     "detourMiles": 3.73
    }
   }
  ],
  "slight": 18,
  "towns": [
   {
    "breweryId": 82,
    "name": "Crooked Pecker Brewing Company",
    "was": "Newbury",
    "is": "Chagrin Falls"
   }
  ]
 },
 {
  "date": "2026-11-23",
  "what": "A person opened a Cleveland brewery page that loads its hours by script, in a browser, and the stop was added: the page shows a weekly schedule. We also asked the US Census geocoder again about every printed address it had not matched; none matched, so the date beside those names changed and nothing else.",
  "before": [
   {
    "breweryId": 208,
    "name": "Masthead Brewing Company",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 0.32
   },
   {
    "breweryId": 72,
    "name": "Collision Bend Brewing Company",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 0.56
   },
   {
    "breweryId": 280,
    "name": "Saucy Brew Works",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 1.11
   },
   {
    "breweryId": 308,
    "name": "Terrestrial Brewing Company",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 2.4
   },
   {
    "breweryId": 2322,
    "name": "BottleHouse Brewery",
    "town": "Lakewood",
    "mile": 0,
    "detourMiles": 4.96
   },
   {
    "breweryId": 62,
    "name": "Butcher & the Brewer",
    "town": "Cleveland",
    "mile": 0.1,
    "detourMiles": 0.13
   },
   {
    "breweryId": 51,
    "name": "Brick and Barrel",
    "town": "Cleveland",
    "mile": 0.2,
    "detourMiles": 0.68
   },
   {
    "breweryId": 120,
    "name": "Forest City Brewery",
    "town": "Cleveland",
    "mile": 0.2,
    "detourMiles": 1.06
   },
   {
    "breweryId": 207,
    "name": "Market Garden Brewpub",
    "town": "Cleveland",
    "mile": 0.2,
    "detourMiles": 1.06
   },
   {
    "breweryId": 136,
    "name": "Great Lakes Brewing Company",
    "town": "Cleveland",
    "mile": 0.2,
    "detourMiles": 1.08
   },
   {
    "breweryId": 2356,
    "name": "Hansa Brewery",
    "town": "Cleveland",
    "mile": 0.2,
    "detourMiles": 1.17
   },
   {
    "breweryId": 296,
    "name": "Southern Tier Brewing Co. Cleveland",
    "town": "Cleveland",
    "mile": 0.3,
    "detourMiles": 0.22
   },
   {
    "breweryId": 154,
    "name": "Hofbräuhaus Cleveland",
    "town": "Cleveland",
    "mile": 0.4,
    "detourMiles": 0.62
   },
   {
    "breweryId": 130,
    "name": "Goldhorn Brewery",
    "town": "Cleveland",
    "mile": 1.6,
    "detourMiles": 2.35
   },
   {
    "breweryId": 182,
    "name": "The Jolly Scholar",
    "town": "Cleveland",
    "mile": 3.5,
    "detourMiles": 2.42
   },
   {
    "breweryId": 82,
    "name": "Crooked Pecker Brewing Company",
    "town": "Chagrin Falls",
    "mile": 22.4,
    "detourMiles": 1.81
   },
   {
    "breweryId": 218,
    "name": "Modern Methods Brewing Company",
    "town": "Warren",
    "mile": 54,
    "detourMiles": 0.11
   },
   {
    "breweryId": 2394,
    "name": "Noble Creature Cask House",
    "town": "Youngstown",
    "mile": 67.8,
    "detourMiles": 0.41
   },
   {
    "breweryId": 992,
    "name": "Brew 32",
    "town": "Pulaski",
    "mile": 77.1,
    "detourMiles": 2.69
   },
   {
    "breweryId": 1030,
    "name": "Crooked Tongue Brewing",
    "town": "Edinburg",
    "mile": 80.6,
    "detourMiles": 0
   },
   {
    "breweryId": 1184,
    "name": "Recon Brewing",
    "town": "Butler",
    "mile": 115.1,
    "detourMiles": 1.31
   },
   {
    "breweryId": 1122,
    "name": "Levity Brewing Co",
    "town": "Indiana",
    "mile": 161.9,
    "detourMiles": 1.03
   },
   {
    "breweryId": 1261,
    "name": "Troegs Brewing Co",
    "town": "Hershey",
    "mile": 2.5,
    "detourMiles": 0.04
   },
   {
    "breweryId": 1197,
    "name": "Rotunda Brewing",
    "town": "Annville",
    "mile": 10.2,
    "detourMiles": 0
   },
   {
    "breweryId": 1218,
    "name": "Snitz Creek Brewery",
    "town": "Lebanon",
    "mile": 15.2,
    "detourMiles": 0.01
   },
   {
    "breweryId": 1082,
    "name": "Hidden River Brewing Co",
    "town": "Douglassville",
    "mile": 57.3,
    "detourMiles": 0.01
   },
   {
    "breweryId": 1217,
    "name": "Sly Fox Brewing Co",
    "town": "Pottstown",
    "mile": 60.8,
    "detourMiles": 1.46
   },
   {
    "breweryId": 1216,
    "name": "Sly Fox Brewhouse and Eatery",
    "town": "Phoenixville",
    "mile": 72.2,
    "detourMiles": 3.73
   },
   {
    "breweryId": 1196,
    "name": "Root Down Brewing Company",
    "town": "Phoenixville",
    "mile": 73.4,
    "detourMiles": 2.35
   },
   {
    "breweryId": 1228,
    "name": "Stable 12 Brewing Company",
    "town": "Phoenixville",
    "mile": 73.4,
    "detourMiles": 2.81
   },
   {
    "breweryId": 1115,
    "name": "La Cabra Brewing",
    "town": "Berwyn",
    "mile": 82.4,
    "detourMiles": 2.94
   },
   {
    "breweryId": 1020,
    "name": "Conshohocken Brewing - Bridgeport",
    "town": "Bridgeport",
    "mile": 82.4,
    "detourMiles": 3.81
   }
  ],
  "after": [
   {
    "breweryId": 208,
    "name": "Masthead Brewing Company",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 0.32
   },
   {
    "breweryId": 72,
    "name": "Collision Bend Brewing Company",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 0.56
   },
   {
    "breweryId": 235,
    "name": "Noble Beast Brewing Co.",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 0.68
   },
   {
    "breweryId": 280,
    "name": "Saucy Brew Works",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 1.11
   },
   {
    "breweryId": 308,
    "name": "Terrestrial Brewing Company",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 2.4
   },
   {
    "breweryId": 2322,
    "name": "BottleHouse Brewery",
    "town": "Lakewood",
    "mile": 0,
    "detourMiles": 4.96
   },
   {
    "breweryId": 62,
    "name": "Butcher & the Brewer",
    "town": "Cleveland",
    "mile": 0.1,
    "detourMiles": 0.13
   },
   {
    "breweryId": 51,
    "name": "Brick and Barrel",
    "town": "Cleveland",
    "mile": 0.2,
    "detourMiles": 0.68
   },
   {
    "breweryId": 120,
    "name": "Forest City Brewery",
    "town": "Cleveland",
    "mile": 0.2,
    "detourMiles": 1.06
   },
   {
    "breweryId": 207,
    "name": "Market Garden Brewpub",
    "town": "Cleveland",
    "mile": 0.2,
    "detourMiles": 1.06
   },
   {
    "breweryId": 136,
    "name": "Great Lakes Brewing Company",
    "town": "Cleveland",
    "mile": 0.2,
    "detourMiles": 1.08
   },
   {
    "breweryId": 2356,
    "name": "Hansa Brewery",
    "town": "Cleveland",
    "mile": 0.2,
    "detourMiles": 1.17
   },
   {
    "breweryId": 296,
    "name": "Southern Tier Brewing Co. Cleveland",
    "town": "Cleveland",
    "mile": 0.3,
    "detourMiles": 0.22
   },
   {
    "breweryId": 154,
    "name": "Hofbräuhaus Cleveland",
    "town": "Cleveland",
    "mile": 0.4,
    "detourMiles": 0.62
   },
   {
    "breweryId": 130,
    "name": "Goldhorn Brewery",
    "town": "Cleveland",
    "mile": 1.6,
    "detourMiles": 2.35
   },
   {
    "breweryId": 182,
    "name": "The Jolly Scholar",
    "town": "Cleveland",
    "mile": 3.5,
    "detourMiles": 2.42
   },
   {
    "breweryId": 82,
    "name": "Crooked Pecker Brewing Company",
    "town": "Chagrin Falls",
    "mile": 22.4,
    "detourMiles": 1.81
   },
   {
    "breweryId": 218,
    "name": "Modern Methods Brewing Company",
    "town": "Warren",
    "mile": 54,
    "detourMiles": 0.11
   },
   {
    "breweryId": 2394,
    "name": "Noble Creature Cask House",
    "town": "Youngstown",
    "mile": 67.8,
    "detourMiles": 0.41
   },
   {
    "breweryId": 992,
    "name": "Brew 32",
    "town": "Pulaski",
    "mile": 77.1,
    "detourMiles": 2.69
   },
   {
    "breweryId": 1030,
    "name": "Crooked Tongue Brewing",
    "town": "Edinburg",
    "mile": 80.6,
    "detourMiles": 0
   },
   {
    "breweryId": 1184,
    "name": "Recon Brewing",
    "town": "Butler",
    "mile": 115.1,
    "detourMiles": 1.31
   },
   {
    "breweryId": 1122,
    "name": "Levity Brewing Co",
    "town": "Indiana",
    "mile": 161.9,
    "detourMiles": 1.03
   },
   {
    "breweryId": 1261,
    "name": "Troegs Brewing Co",
    "town": "Hershey",
    "mile": 2.5,
    "detourMiles": 0.04
   },
   {
    "breweryId": 1197,
    "name": "Rotunda Brewing",
    "town": "Annville",
    "mile": 10.2,
    "detourMiles": 0
   },
   {
    "breweryId": 1218,
    "name": "Snitz Creek Brewery",
    "town": "Lebanon",
    "mile": 15.2,
    "detourMiles": 0.01
   },
   {
    "breweryId": 1082,
    "name": "Hidden River Brewing Co",
    "town": "Douglassville",
    "mile": 57.3,
    "detourMiles": 0.01
   },
   {
    "breweryId": 1217,
    "name": "Sly Fox Brewing Co",
    "town": "Pottstown",
    "mile": 60.8,
    "detourMiles": 1.46
   },
   {
    "breweryId": 1216,
    "name": "Sly Fox Brewhouse and Eatery",
    "town": "Phoenixville",
    "mile": 72.2,
    "detourMiles": 3.73
   },
   {
    "breweryId": 1196,
    "name": "Root Down Brewing Company",
    "town": "Phoenixville",
    "mile": 73.4,
    "detourMiles": 2.35
   },
   {
    "breweryId": 1228,
    "name": "Stable 12 Brewing Company",
    "town": "Phoenixville",
    "mile": 73.4,
    "detourMiles": 2.81
   },
   {
    "breweryId": 1115,
    "name": "La Cabra Brewing",
    "town": "Berwyn",
    "mile": 82.4,
    "detourMiles": 2.94
   },
   {
    "breweryId": 1020,
    "name": "Conshohocken Brewing - Bridgeport",
    "town": "Bridgeport",
    "mile": 82.4,
    "detourMiles": 3.81
   }
  ],
  "removed": [],
  "added": [
   {
    "breweryId": 235,
    "name": "Noble Beast Brewing Co.",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 0.68,
    "laterCheck": true
   }
  ],
  "measured": [],
  "slight": 0,
  "towns": []
 },
 {
  "date": "2026-11-23",
  "what": "BrewDog Cleveland Outpost was added under a rule that is new today: opening hours may be taken from Google's Maps-grounded Gemini service, citing Google Maps, where a brewery's own page cannot be re-read by our checks. The hours shown under the stop are the service's output, named and linked there; a person saw the same hours on the brewery's page in a browser. Its address is from the brewery's own site.",
  "nth": 2,
  "before": [
   {
    "breweryId": 208,
    "name": "Masthead Brewing Company",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 0.32
   },
   {
    "breweryId": 72,
    "name": "Collision Bend Brewing Company",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 0.56
   },
   {
    "breweryId": 235,
    "name": "Noble Beast Brewing Co.",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 0.68
   },
   {
    "breweryId": 280,
    "name": "Saucy Brew Works",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 1.11
   },
   {
    "breweryId": 308,
    "name": "Terrestrial Brewing Company",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 2.4
   },
   {
    "breweryId": 2322,
    "name": "BottleHouse Brewery",
    "town": "Lakewood",
    "mile": 0,
    "detourMiles": 4.96
   },
   {
    "breweryId": 62,
    "name": "Butcher & the Brewer",
    "town": "Cleveland",
    "mile": 0.1,
    "detourMiles": 0.13
   },
   {
    "breweryId": 51,
    "name": "Brick and Barrel",
    "town": "Cleveland",
    "mile": 0.2,
    "detourMiles": 0.68
   },
   {
    "breweryId": 120,
    "name": "Forest City Brewery",
    "town": "Cleveland",
    "mile": 0.2,
    "detourMiles": 1.06
   },
   {
    "breweryId": 207,
    "name": "Market Garden Brewpub",
    "town": "Cleveland",
    "mile": 0.2,
    "detourMiles": 1.06
   },
   {
    "breweryId": 136,
    "name": "Great Lakes Brewing Company",
    "town": "Cleveland",
    "mile": 0.2,
    "detourMiles": 1.08
   },
   {
    "breweryId": 2356,
    "name": "Hansa Brewery",
    "town": "Cleveland",
    "mile": 0.2,
    "detourMiles": 1.17
   },
   {
    "breweryId": 296,
    "name": "Southern Tier Brewing Co. Cleveland",
    "town": "Cleveland",
    "mile": 0.3,
    "detourMiles": 0.22
   },
   {
    "breweryId": 154,
    "name": "Hofbräuhaus Cleveland",
    "town": "Cleveland",
    "mile": 0.4,
    "detourMiles": 0.62
   },
   {
    "breweryId": 130,
    "name": "Goldhorn Brewery",
    "town": "Cleveland",
    "mile": 1.6,
    "detourMiles": 2.35
   },
   {
    "breweryId": 182,
    "name": "The Jolly Scholar",
    "town": "Cleveland",
    "mile": 3.5,
    "detourMiles": 2.42
   },
   {
    "breweryId": 82,
    "name": "Crooked Pecker Brewing Company",
    "town": "Chagrin Falls",
    "mile": 22.4,
    "detourMiles": 1.81
   },
   {
    "breweryId": 218,
    "name": "Modern Methods Brewing Company",
    "town": "Warren",
    "mile": 54,
    "detourMiles": 0.11
   },
   {
    "breweryId": 2394,
    "name": "Noble Creature Cask House",
    "town": "Youngstown",
    "mile": 67.8,
    "detourMiles": 0.41
   },
   {
    "breweryId": 992,
    "name": "Brew 32",
    "town": "Pulaski",
    "mile": 77.1,
    "detourMiles": 2.69
   },
   {
    "breweryId": 1030,
    "name": "Crooked Tongue Brewing",
    "town": "Edinburg",
    "mile": 80.6,
    "detourMiles": 0
   },
   {
    "breweryId": 1184,
    "name": "Recon Brewing",
    "town": "Butler",
    "mile": 115.1,
    "detourMiles": 1.31
   },
   {
    "breweryId": 1122,
    "name": "Levity Brewing Co",
    "town": "Indiana",
    "mile": 161.9,
    "detourMiles": 1.03
   },
   {
    "breweryId": 1261,
    "name": "Troegs Brewing Co",
    "town": "Hershey",
    "mile": 2.5,
    "detourMiles": 0.04
   },
   {
    "breweryId": 1197,
    "name": "Rotunda Brewing",
    "town": "Annville",
    "mile": 10.2,
    "detourMiles": 0
   },
   {
    "breweryId": 1218,
    "name": "Snitz Creek Brewery",
    "town": "Lebanon",
    "mile": 15.2,
    "detourMiles": 0.01
   },
   {
    "breweryId": 1082,
    "name": "Hidden River Brewing Co",
    "town": "Douglassville",
    "mile": 57.3,
    "detourMiles": 0.01
   },
   {
    "breweryId": 1217,
    "name": "Sly Fox Brewing Co",
    "town": "Pottstown",
    "mile": 60.8,
    "detourMiles": 1.46
   },
   {
    "breweryId": 1216,
    "name": "Sly Fox Brewhouse and Eatery",
    "town": "Phoenixville",
    "mile": 72.2,
    "detourMiles": 3.73
   },
   {
    "breweryId": 1196,
    "name": "Root Down Brewing Company",
    "town": "Phoenixville",
    "mile": 73.4,
    "detourMiles": 2.35
   },
   {
    "breweryId": 1228,
    "name": "Stable 12 Brewing Company",
    "town": "Phoenixville",
    "mile": 73.4,
    "detourMiles": 2.81
   },
   {
    "breweryId": 1115,
    "name": "La Cabra Brewing",
    "town": "Berwyn",
    "mile": 82.4,
    "detourMiles": 2.94
   },
   {
    "breweryId": 1020,
    "name": "Conshohocken Brewing - Bridgeport",
    "town": "Bridgeport",
    "mile": 82.4,
    "detourMiles": 3.81
   }
  ],
  "after": [
   {
    "breweryId": 208,
    "name": "Masthead Brewing Company",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 0.32
   },
   {
    "breweryId": 72,
    "name": "Collision Bend Brewing Company",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 0.56
   },
   {
    "breweryId": 235,
    "name": "Noble Beast Brewing Co.",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 0.68
   },
   {
    "breweryId": 280,
    "name": "Saucy Brew Works",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 1.11
   },
   {
    "breweryId": 308,
    "name": "Terrestrial Brewing Company",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 2.4
   },
   {
    "breweryId": 2322,
    "name": "BottleHouse Brewery",
    "town": "Lakewood",
    "mile": 0,
    "detourMiles": 4.96
   },
   {
    "breweryId": 62,
    "name": "Butcher & the Brewer",
    "town": "Cleveland",
    "mile": 0.1,
    "detourMiles": 0.13
   },
   {
    "breweryId": 51,
    "name": "Brick and Barrel",
    "town": "Cleveland",
    "mile": 0.2,
    "detourMiles": 0.68
   },
   {
    "breweryId": 44,
    "name": "BrewDog Cleveland Outpost",
    "town": "Cleveland",
    "mile": 0.2,
    "detourMiles": 0.69
   },
   {
    "breweryId": 120,
    "name": "Forest City Brewery",
    "town": "Cleveland",
    "mile": 0.2,
    "detourMiles": 1.06
   },
   {
    "breweryId": 207,
    "name": "Market Garden Brewpub",
    "town": "Cleveland",
    "mile": 0.2,
    "detourMiles": 1.06
   },
   {
    "breweryId": 136,
    "name": "Great Lakes Brewing Company",
    "town": "Cleveland",
    "mile": 0.2,
    "detourMiles": 1.08
   },
   {
    "breweryId": 2356,
    "name": "Hansa Brewery",
    "town": "Cleveland",
    "mile": 0.2,
    "detourMiles": 1.17
   },
   {
    "breweryId": 296,
    "name": "Southern Tier Brewing Co. Cleveland",
    "town": "Cleveland",
    "mile": 0.3,
    "detourMiles": 0.22
   },
   {
    "breweryId": 154,
    "name": "Hofbräuhaus Cleveland",
    "town": "Cleveland",
    "mile": 0.4,
    "detourMiles": 0.62
   },
   {
    "breweryId": 130,
    "name": "Goldhorn Brewery",
    "town": "Cleveland",
    "mile": 1.6,
    "detourMiles": 2.35
   },
   {
    "breweryId": 182,
    "name": "The Jolly Scholar",
    "town": "Cleveland",
    "mile": 3.5,
    "detourMiles": 2.42
   },
   {
    "breweryId": 82,
    "name": "Crooked Pecker Brewing Company",
    "town": "Chagrin Falls",
    "mile": 22.4,
    "detourMiles": 1.81
   },
   {
    "breweryId": 218,
    "name": "Modern Methods Brewing Company",
    "town": "Warren",
    "mile": 54,
    "detourMiles": 0.11
   },
   {
    "breweryId": 2394,
    "name": "Noble Creature Cask House",
    "town": "Youngstown",
    "mile": 67.8,
    "detourMiles": 0.41
   },
   {
    "breweryId": 992,
    "name": "Brew 32",
    "town": "Pulaski",
    "mile": 77.1,
    "detourMiles": 2.69
   },
   {
    "breweryId": 1030,
    "name": "Crooked Tongue Brewing",
    "town": "Edinburg",
    "mile": 80.6,
    "detourMiles": 0
   },
   {
    "breweryId": 1184,
    "name": "Recon Brewing",
    "town": "Butler",
    "mile": 115.1,
    "detourMiles": 1.31
   },
   {
    "breweryId": 1122,
    "name": "Levity Brewing Co",
    "town": "Indiana",
    "mile": 161.9,
    "detourMiles": 1.03
   },
   {
    "breweryId": 1261,
    "name": "Troegs Brewing Co",
    "town": "Hershey",
    "mile": 2.5,
    "detourMiles": 0.04
   },
   {
    "breweryId": 1197,
    "name": "Rotunda Brewing",
    "town": "Annville",
    "mile": 10.2,
    "detourMiles": 0
   },
   {
    "breweryId": 1218,
    "name": "Snitz Creek Brewery",
    "town": "Lebanon",
    "mile": 15.2,
    "detourMiles": 0.01
   },
   {
    "breweryId": 1082,
    "name": "Hidden River Brewing Co",
    "town": "Douglassville",
    "mile": 57.3,
    "detourMiles": 0.01
   },
   {
    "breweryId": 1217,
    "name": "Sly Fox Brewing Co",
    "town": "Pottstown",
    "mile": 60.8,
    "detourMiles": 1.46
   },
   {
    "breweryId": 1216,
    "name": "Sly Fox Brewhouse and Eatery",
    "town": "Phoenixville",
    "mile": 72.2,
    "detourMiles": 3.73
   },
   {
    "breweryId": 1196,
    "name": "Root Down Brewing Company",
    "town": "Phoenixville",
    "mile": 73.4,
    "detourMiles": 2.35
   },
   {
    "breweryId": 1228,
    "name": "Stable 12 Brewing Company",
    "town": "Phoenixville",
    "mile": 73.4,
    "detourMiles": 2.81
   },
   {
    "breweryId": 1115,
    "name": "La Cabra Brewing",
    "town": "Berwyn",
    "mile": 82.4,
    "detourMiles": 2.94
   },
   {
    "breweryId": 1020,
    "name": "Conshohocken Brewing - Bridgeport",
    "town": "Bridgeport",
    "mile": 82.4,
    "detourMiles": 3.81
   }
  ],
  "removed": [],
  "added": [
   {
    "breweryId": 44,
    "name": "BrewDog Cleveland Outpost",
    "town": "Cleveland",
    "mile": 0.2,
    "detourMiles": 0.69,
    "laterCheck": true,
    "via": "google-maps"
   }
  ],
  "measured": [],
  "slight": 0,
  "towns": []
 }
];
