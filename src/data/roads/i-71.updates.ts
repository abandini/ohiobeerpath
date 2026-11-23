// RECORDS, written once each by scripts/record-road-update.mjs. Each entry is a completed, dated update to a page that
// was already public: the list before and after, why each stop left or joined, and what was re-measured. The page
// renders its dated notice and entry from these alone. Do not edit an entry and do not regenerate one that has been
// published: a later change to the page gets a new dated entry.
import type { UpdateEvent } from '../../lib/road-trip';

export const I_71_UPDATES: UpdateEvent[] = [
 {
  "date": "2026-11-23",
  "what": "A person opened a brewery page that loads its hours by script, in a browser, and the stop was added: the page shows a weekly schedule. We also asked the US Census geocoder again about every printed address it had not matched; none matched, so the date beside those names changed and nothing else.",
  "before": [
   {
    "breweryId": 120,
    "name": "Forest City Brewery",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 0.45
   },
   {
    "breweryId": 136,
    "name": "Great Lakes Brewing Company",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 0.66
   },
   {
    "breweryId": 2356,
    "name": "Hansa Brewery",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 0.66
   },
   {
    "breweryId": 207,
    "name": "Market Garden Brewpub",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 0.66
   },
   {
    "breweryId": 51,
    "name": "Brick and Barrel",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 0.83
   },
   {
    "breweryId": 280,
    "name": "Saucy Brew Works",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 1.14
   },
   {
    "breweryId": 62,
    "name": "Butcher & the Brewer",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 1.37
   },
   {
    "breweryId": 296,
    "name": "Southern Tier Brewing Co. Cleveland",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 1.38
   },
   {
    "breweryId": 72,
    "name": "Collision Bend Brewing Company",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 1.46
   },
   {
    "breweryId": 208,
    "name": "Masthead Brewing Company",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 1.6
   },
   {
    "breweryId": 154,
    "name": "Hofbräuhaus Cleveland",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 1.75
   },
   {
    "breweryId": 308,
    "name": "Terrestrial Brewing Company",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 2.31
   },
   {
    "breweryId": 130,
    "name": "Goldhorn Brewery",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 3.71
   },
   {
    "breweryId": 182,
    "name": "The Jolly Scholar",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 4.79
   },
   {
    "breweryId": 284,
    "name": "Schnitz Ale Brewery",
    "town": "Parma",
    "mile": 4,
    "detourMiles": 2.81
   },
   {
    "breweryId": 2322,
    "name": "BottleHouse Brewery",
    "town": "Lakewood",
    "mile": 6,
    "detourMiles": 2.2
   },
   {
    "breweryId": 173,
    "name": "Immigrant Son Brewery",
    "town": "Lakewood",
    "mile": 7.6,
    "detourMiles": 3.4
   },
   {
    "breweryId": 272,
    "name": "Rocky River Brewing Company",
    "town": "Rocky River",
    "mile": 7.9,
    "detourMiles": 2.87
   },
   {
    "breweryId": 110,
    "name": "Fat Head’s North Olmsted",
    "town": "North Olmsted",
    "mile": 8.9,
    "detourMiles": 3.86
   },
   {
    "breweryId": 108,
    "name": "Fat Head’s Middleburg Heights",
    "town": "Middleburg Heights",
    "mile": 12.2,
    "detourMiles": 0.13
   },
   {
    "breweryId": 2444,
    "name": "The Brew Kettle, Taproom and Smokehouse",
    "town": "Strongsville",
    "mile": 14.2,
    "detourMiles": 0.23
   },
   {
    "breweryId": 169,
    "name": "Ignite Brewing Company - Brunswick",
    "town": "Brunswick",
    "mile": 21.6,
    "detourMiles": 0.42
   },
   {
    "breweryId": 31,
    "name": "Blue Heron Brewery",
    "town": "Medina",
    "mile": 30.9,
    "detourMiles": 0.4
   },
   {
    "breweryId": 200,
    "name": "MAD Brewing Company",
    "town": "Medina",
    "mile": 30.9,
    "detourMiles": 3.76
   },
   {
    "breweryId": 2371,
    "name": "Lager Heads Brewing Co.",
    "town": "Medina",
    "mile": 31.1,
    "detourMiles": 3.36
   },
   {
    "breweryId": 325,
    "name": "Uniontown Brewing Co.",
    "town": "Ashland",
    "mile": 63.8,
    "detourMiles": 2.41
   },
   {
    "breweryId": 160,
    "name": "Hoof Hearted Brewing",
    "town": "Marengo",
    "mile": 107.8,
    "detourMiles": 0.95
   },
   {
    "breweryId": 148,
    "name": "Henmick Farm & Brewery",
    "town": "Delaware",
    "mile": 114,
    "detourMiles": 2.64
   },
   {
    "breweryId": 300,
    "name": "Standardized Brewing Company",
    "town": "Lewis Center",
    "mile": 124,
    "detourMiles": 3
   },
   {
    "breweryId": 138,
    "name": "Grizzlybird Brewing Company",
    "town": "Westerville",
    "mile": 124.1,
    "detourMiles": 2.21
   },
   {
    "breweryId": 249,
    "name": "Olentangy River Brewing Company",
    "town": "Lewis Center",
    "mile": 125.8,
    "detourMiles": 2.25
   },
   {
    "breweryId": 297,
    "name": "Spires Social Brewing Co.",
    "town": "Columbus",
    "mile": 126.5,
    "detourMiles": 1.01
   },
   {
    "breweryId": 2441,
    "name": "Temperance Row Brewing and Uptown Deli",
    "town": "Westerville",
    "mile": 127.4,
    "detourMiles": 2.12
   },
   {
    "breweryId": 119,
    "name": "Forbidden Root (Columbus)",
    "town": "Columbus",
    "mile": 131.4,
    "detourMiles": 4.21
   },
   {
    "breweryId": 349,
    "name": "Yellow Springs Brewery - Columbus",
    "town": "Columbus",
    "mile": 135.1,
    "detourMiles": 0.35
   },
   {
    "breweryId": 89,
    "name": "Derive Brewing Company",
    "town": "Columbus",
    "mile": 135.2,
    "detourMiles": 0.92
   },
   {
    "breweryId": 161,
    "name": "Hoof Hearted Brewing - 5th Ave.",
    "town": "Columbus",
    "mile": 137.6,
    "detourMiles": 1
   },
   {
    "breweryId": 2430,
    "name": "Seventh Son Brewing Co",
    "town": "Columbus",
    "mile": 137.7,
    "detourMiles": 0.74
   },
   {
    "breweryId": 282,
    "name": "Saucy Brew Works Columbus",
    "town": "Columbus",
    "mile": 137.7,
    "detourMiles": 1.68
   },
   {
    "breweryId": 244,
    "name": "Ohio Brewing Company - Columbus",
    "town": "Columbus",
    "mile": 138,
    "detourMiles": 0.47
   },
   {
    "breweryId": 178,
    "name": "Jackie O's On Fourth",
    "town": "Columbus",
    "mile": 139,
    "detourMiles": 0.7
   },
   {
    "breweryId": 343,
    "name": "Wolf’s Ridge Brewing",
    "town": "Columbus",
    "mile": 139,
    "detourMiles": 0.7
   },
   {
    "breweryId": 126,
    "name": "Gemut Biergarten",
    "town": "Columbus",
    "mile": 139.4,
    "detourMiles": 0.13
   },
   {
    "breweryId": 2344,
    "name": "Elevator Brewery and Draught Haus",
    "town": "Columbus",
    "mile": 0.2,
    "detourMiles": 0.87
   },
   {
    "breweryId": 188,
    "name": "Land-Grant Brewing Company",
    "town": "Columbus",
    "mile": 0.5,
    "detourMiles": 0.34
   },
   {
    "breweryId": 2361,
    "name": "Hofbrauhaus Columbus",
    "town": "Columbus",
    "mile": 0.6,
    "detourMiles": 1.67
   },
   {
    "breweryId": 316,
    "name": "Thunderwing Brewing",
    "town": "Columbus",
    "mile": 0.8,
    "detourMiles": 2.96
   },
   {
    "breweryId": 2338,
    "name": "Columbus Brewing Co",
    "town": "Columbus",
    "mile": 0.8,
    "detourMiles": 3.17
   },
   {
    "breweryId": 139,
    "name": "Grove City Brewing Company",
    "town": "Grove City",
    "mile": 7.9,
    "detourMiles": 2.03
   },
   {
    "breweryId": 88,
    "name": "Depot Brewing Company, LLC",
    "town": "Morrow",
    "mile": 73.7,
    "detourMiles": 4.1
   },
   {
    "breweryId": 22,
    "name": "BC's Brewing Company",
    "town": "Mason",
    "mile": 81.1,
    "detourMiles": 1.51
   },
   {
    "breweryId": 76,
    "name": "The Common Beer Company",
    "town": "Mason",
    "mile": 82.9,
    "detourMiles": 2.02
   },
   {
    "breweryId": 132,
    "name": "Grainworks Brewing Company",
    "town": "West Chester",
    "mile": 83.4,
    "detourMiles": 4.77
   },
   {
    "breweryId": 293,
    "name": "Sonder Brewing",
    "town": "Mason",
    "mile": 85.5,
    "detourMiles": 0.41
   },
   {
    "breweryId": 230,
    "name": "Narrow Path Brewing Company",
    "town": "Loveland",
    "mile": 86.1,
    "detourMiles": 3.36
   },
   {
    "breweryId": 95,
    "name": "DVD Brew",
    "town": "Loveland",
    "mile": 87.6,
    "detourMiles": 3.17
   },
   {
    "breweryId": 203,
    "name": "March First Brewing",
    "town": "Cincinnati",
    "mile": 89,
    "detourMiles": 0.35
   },
   {
    "breweryId": 123,
    "name": "Fretboard Brewing Company",
    "town": "Blue Ash",
    "mile": 90.5,
    "detourMiles": 0.33
   },
   {
    "breweryId": 196,
    "name": "Little Miami Brewing Company",
    "town": "Milford",
    "mile": 94.8,
    "detourMiles": 4.59
   },
   {
    "breweryId": 150,
    "name": "HighGrain Brewing Company",
    "town": "Cincinnati",
    "mile": 96.1,
    "detourMiles": 0.63
   },
   {
    "breweryId": 113,
    "name": "Fifty West Brewing Company",
    "town": "Cincinnati",
    "mile": 97.1,
    "detourMiles": 3.31
   },
   {
    "breweryId": 2382,
    "name": "MadTree Brewing",
    "town": "Cincinnati",
    "mile": 98.8,
    "detourMiles": 0.64
   },
   {
    "breweryId": 2460,
    "name": "Wiedemann Brewing Co, LLC",
    "town": "Cincinnati",
    "mile": 99.1,
    "detourMiles": 3.73
   },
   {
    "breweryId": 121,
    "name": "Fretboard Brewing at Factory 52",
    "town": "Norwood",
    "mile": 99.7,
    "detourMiles": 0.28
   },
   {
    "breweryId": 304,
    "name": "Streetside Brewery",
    "town": "Cincinnati",
    "mile": 101.1,
    "detourMiles": 2.76
   },
   {
    "breweryId": 2395,
    "name": "Northern Row Brewery & Distillery",
    "town": "Cincinnati",
    "mile": 104.5,
    "detourMiles": 1.08
   },
   {
    "breweryId": 269,
    "name": "Rhinegeist",
    "town": "Cincinnati",
    "mile": 104.7,
    "detourMiles": 1.08
   },
   {
    "breweryId": 908,
    "name": "Darkness Brewing",
    "town": "Bellevue",
    "mile": 104.9,
    "detourMiles": 0.96
   },
   {
    "breweryId": 212,
    "name": "mellotone beer project",
    "town": "Cincinnati",
    "mile": 105.2,
    "detourMiles": 0.77
   },
   {
    "breweryId": 921,
    "name": "Hofbrauhaus Newport",
    "town": "Newport",
    "mile": 105.7,
    "detourMiles": 0.61
   },
   {
    "breweryId": 946,
    "name": "Wooden Cask Brewing Company",
    "town": "Newport",
    "mile": 105.7,
    "detourMiles": 0.84
   },
   {
    "breweryId": 902,
    "name": "Braxton Brewing Company",
    "town": "Covington",
    "mile": 0.7,
    "detourMiles": 0.65
   },
   {
    "breweryId": 922,
    "name": "Holsopple Brewing",
    "town": "Lyndon",
    "mile": 89.5,
    "detourMiles": 2.78
   },
   {
    "breweryId": 897,
    "name": "Apocalypse Brew Works",
    "town": "Louisville",
    "mile": 95.4,
    "detourMiles": 0.41
   },
   {
    "breweryId": 894,
    "name": "Akasha Brewing Company",
    "town": "Louisville",
    "mile": 96,
    "detourMiles": 0.59
   },
   {
    "breweryId": 913,
    "name": "Falls City Brewing Company",
    "town": "Louisville",
    "mile": 96,
    "detourMiles": 0.78
   },
   {
    "breweryId": 930,
    "name": "Mile Wide Beer Co.",
    "town": "Louisville",
    "mile": 96,
    "detourMiles": 1.08
   },
   {
    "breweryId": 932,
    "name": "Monnik Beer Company",
    "town": "Louisville",
    "mile": 96,
    "detourMiles": 2.65
   },
   {
    "breweryId": 933,
    "name": "Old Louisville Brewery",
    "town": "Louisville",
    "mile": 96,
    "detourMiles": 2.8
   }
  ],
  "after": [
   {
    "breweryId": 120,
    "name": "Forest City Brewery",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 0.45
   },
   {
    "breweryId": 136,
    "name": "Great Lakes Brewing Company",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 0.66
   },
   {
    "breweryId": 2356,
    "name": "Hansa Brewery",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 0.66
   },
   {
    "breweryId": 207,
    "name": "Market Garden Brewpub",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 0.66
   },
   {
    "breweryId": 51,
    "name": "Brick and Barrel",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 0.83
   },
   {
    "breweryId": 280,
    "name": "Saucy Brew Works",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 1.14
   },
   {
    "breweryId": 62,
    "name": "Butcher & the Brewer",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 1.37
   },
   {
    "breweryId": 296,
    "name": "Southern Tier Brewing Co. Cleveland",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 1.38
   },
   {
    "breweryId": 72,
    "name": "Collision Bend Brewing Company",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 1.46
   },
   {
    "breweryId": 208,
    "name": "Masthead Brewing Company",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 1.6
   },
   {
    "breweryId": 154,
    "name": "Hofbräuhaus Cleveland",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 1.75
   },
   {
    "breweryId": 235,
    "name": "Noble Beast Brewing Co.",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 1.98
   },
   {
    "breweryId": 308,
    "name": "Terrestrial Brewing Company",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 2.31
   },
   {
    "breweryId": 130,
    "name": "Goldhorn Brewery",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 3.71
   },
   {
    "breweryId": 182,
    "name": "The Jolly Scholar",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 4.79
   },
   {
    "breweryId": 284,
    "name": "Schnitz Ale Brewery",
    "town": "Parma",
    "mile": 4,
    "detourMiles": 2.81
   },
   {
    "breweryId": 2322,
    "name": "BottleHouse Brewery",
    "town": "Lakewood",
    "mile": 6,
    "detourMiles": 2.2
   },
   {
    "breweryId": 173,
    "name": "Immigrant Son Brewery",
    "town": "Lakewood",
    "mile": 7.6,
    "detourMiles": 3.4
   },
   {
    "breweryId": 272,
    "name": "Rocky River Brewing Company",
    "town": "Rocky River",
    "mile": 7.9,
    "detourMiles": 2.87
   },
   {
    "breweryId": 110,
    "name": "Fat Head’s North Olmsted",
    "town": "North Olmsted",
    "mile": 8.9,
    "detourMiles": 3.86
   },
   {
    "breweryId": 108,
    "name": "Fat Head’s Middleburg Heights",
    "town": "Middleburg Heights",
    "mile": 12.2,
    "detourMiles": 0.13
   },
   {
    "breweryId": 2444,
    "name": "The Brew Kettle, Taproom and Smokehouse",
    "town": "Strongsville",
    "mile": 14.2,
    "detourMiles": 0.23
   },
   {
    "breweryId": 169,
    "name": "Ignite Brewing Company - Brunswick",
    "town": "Brunswick",
    "mile": 21.6,
    "detourMiles": 0.42
   },
   {
    "breweryId": 31,
    "name": "Blue Heron Brewery",
    "town": "Medina",
    "mile": 30.9,
    "detourMiles": 0.4
   },
   {
    "breweryId": 200,
    "name": "MAD Brewing Company",
    "town": "Medina",
    "mile": 30.9,
    "detourMiles": 3.76
   },
   {
    "breweryId": 2371,
    "name": "Lager Heads Brewing Co.",
    "town": "Medina",
    "mile": 31.1,
    "detourMiles": 3.36
   },
   {
    "breweryId": 325,
    "name": "Uniontown Brewing Co.",
    "town": "Ashland",
    "mile": 63.8,
    "detourMiles": 2.41
   },
   {
    "breweryId": 160,
    "name": "Hoof Hearted Brewing",
    "town": "Marengo",
    "mile": 107.8,
    "detourMiles": 0.95
   },
   {
    "breweryId": 148,
    "name": "Henmick Farm & Brewery",
    "town": "Delaware",
    "mile": 114,
    "detourMiles": 2.64
   },
   {
    "breweryId": 300,
    "name": "Standardized Brewing Company",
    "town": "Lewis Center",
    "mile": 124,
    "detourMiles": 3
   },
   {
    "breweryId": 138,
    "name": "Grizzlybird Brewing Company",
    "town": "Westerville",
    "mile": 124.1,
    "detourMiles": 2.21
   },
   {
    "breweryId": 249,
    "name": "Olentangy River Brewing Company",
    "town": "Lewis Center",
    "mile": 125.8,
    "detourMiles": 2.25
   },
   {
    "breweryId": 297,
    "name": "Spires Social Brewing Co.",
    "town": "Columbus",
    "mile": 126.5,
    "detourMiles": 1.01
   },
   {
    "breweryId": 2441,
    "name": "Temperance Row Brewing and Uptown Deli",
    "town": "Westerville",
    "mile": 127.4,
    "detourMiles": 2.12
   },
   {
    "breweryId": 119,
    "name": "Forbidden Root (Columbus)",
    "town": "Columbus",
    "mile": 131.4,
    "detourMiles": 4.21
   },
   {
    "breweryId": 349,
    "name": "Yellow Springs Brewery - Columbus",
    "town": "Columbus",
    "mile": 135.1,
    "detourMiles": 0.35
   },
   {
    "breweryId": 89,
    "name": "Derive Brewing Company",
    "town": "Columbus",
    "mile": 135.2,
    "detourMiles": 0.92
   },
   {
    "breweryId": 161,
    "name": "Hoof Hearted Brewing - 5th Ave.",
    "town": "Columbus",
    "mile": 137.6,
    "detourMiles": 1
   },
   {
    "breweryId": 2430,
    "name": "Seventh Son Brewing Co",
    "town": "Columbus",
    "mile": 137.7,
    "detourMiles": 0.74
   },
   {
    "breweryId": 282,
    "name": "Saucy Brew Works Columbus",
    "town": "Columbus",
    "mile": 137.7,
    "detourMiles": 1.68
   },
   {
    "breweryId": 244,
    "name": "Ohio Brewing Company - Columbus",
    "town": "Columbus",
    "mile": 138,
    "detourMiles": 0.47
   },
   {
    "breweryId": 178,
    "name": "Jackie O's On Fourth",
    "town": "Columbus",
    "mile": 139,
    "detourMiles": 0.7
   },
   {
    "breweryId": 343,
    "name": "Wolf’s Ridge Brewing",
    "town": "Columbus",
    "mile": 139,
    "detourMiles": 0.7
   },
   {
    "breweryId": 126,
    "name": "Gemut Biergarten",
    "town": "Columbus",
    "mile": 139.4,
    "detourMiles": 0.13
   },
   {
    "breweryId": 2344,
    "name": "Elevator Brewery and Draught Haus",
    "town": "Columbus",
    "mile": 0.2,
    "detourMiles": 0.87
   },
   {
    "breweryId": 188,
    "name": "Land-Grant Brewing Company",
    "town": "Columbus",
    "mile": 0.5,
    "detourMiles": 0.34
   },
   {
    "breweryId": 2361,
    "name": "Hofbrauhaus Columbus",
    "town": "Columbus",
    "mile": 0.6,
    "detourMiles": 1.67
   },
   {
    "breweryId": 316,
    "name": "Thunderwing Brewing",
    "town": "Columbus",
    "mile": 0.8,
    "detourMiles": 2.96
   },
   {
    "breweryId": 2338,
    "name": "Columbus Brewing Co",
    "town": "Columbus",
    "mile": 0.8,
    "detourMiles": 3.17
   },
   {
    "breweryId": 139,
    "name": "Grove City Brewing Company",
    "town": "Grove City",
    "mile": 7.9,
    "detourMiles": 2.03
   },
   {
    "breweryId": 88,
    "name": "Depot Brewing Company, LLC",
    "town": "Morrow",
    "mile": 73.7,
    "detourMiles": 4.1
   },
   {
    "breweryId": 22,
    "name": "BC's Brewing Company",
    "town": "Mason",
    "mile": 81.1,
    "detourMiles": 1.51
   },
   {
    "breweryId": 76,
    "name": "The Common Beer Company",
    "town": "Mason",
    "mile": 82.9,
    "detourMiles": 2.02
   },
   {
    "breweryId": 132,
    "name": "Grainworks Brewing Company",
    "town": "West Chester",
    "mile": 83.4,
    "detourMiles": 4.77
   },
   {
    "breweryId": 293,
    "name": "Sonder Brewing",
    "town": "Mason",
    "mile": 85.5,
    "detourMiles": 0.41
   },
   {
    "breweryId": 230,
    "name": "Narrow Path Brewing Company",
    "town": "Loveland",
    "mile": 86.1,
    "detourMiles": 3.36
   },
   {
    "breweryId": 95,
    "name": "DVD Brew",
    "town": "Loveland",
    "mile": 87.6,
    "detourMiles": 3.17
   },
   {
    "breweryId": 203,
    "name": "March First Brewing",
    "town": "Cincinnati",
    "mile": 89,
    "detourMiles": 0.35
   },
   {
    "breweryId": 123,
    "name": "Fretboard Brewing Company",
    "town": "Blue Ash",
    "mile": 90.5,
    "detourMiles": 0.33
   },
   {
    "breweryId": 196,
    "name": "Little Miami Brewing Company",
    "town": "Milford",
    "mile": 94.8,
    "detourMiles": 4.59
   },
   {
    "breweryId": 150,
    "name": "HighGrain Brewing Company",
    "town": "Cincinnati",
    "mile": 96.1,
    "detourMiles": 0.63
   },
   {
    "breweryId": 113,
    "name": "Fifty West Brewing Company",
    "town": "Cincinnati",
    "mile": 97.1,
    "detourMiles": 3.31
   },
   {
    "breweryId": 2382,
    "name": "MadTree Brewing",
    "town": "Cincinnati",
    "mile": 98.8,
    "detourMiles": 0.64
   },
   {
    "breweryId": 2460,
    "name": "Wiedemann Brewing Co, LLC",
    "town": "Cincinnati",
    "mile": 99.1,
    "detourMiles": 3.73
   },
   {
    "breweryId": 121,
    "name": "Fretboard Brewing at Factory 52",
    "town": "Norwood",
    "mile": 99.7,
    "detourMiles": 0.28
   },
   {
    "breweryId": 304,
    "name": "Streetside Brewery",
    "town": "Cincinnati",
    "mile": 101.1,
    "detourMiles": 2.76
   },
   {
    "breweryId": 2395,
    "name": "Northern Row Brewery & Distillery",
    "town": "Cincinnati",
    "mile": 104.5,
    "detourMiles": 1.08
   },
   {
    "breweryId": 269,
    "name": "Rhinegeist",
    "town": "Cincinnati",
    "mile": 104.7,
    "detourMiles": 1.08
   },
   {
    "breweryId": 908,
    "name": "Darkness Brewing",
    "town": "Bellevue",
    "mile": 104.9,
    "detourMiles": 0.96
   },
   {
    "breweryId": 212,
    "name": "mellotone beer project",
    "town": "Cincinnati",
    "mile": 105.2,
    "detourMiles": 0.77
   },
   {
    "breweryId": 921,
    "name": "Hofbrauhaus Newport",
    "town": "Newport",
    "mile": 105.7,
    "detourMiles": 0.61
   },
   {
    "breweryId": 946,
    "name": "Wooden Cask Brewing Company",
    "town": "Newport",
    "mile": 105.7,
    "detourMiles": 0.84
   },
   {
    "breweryId": 902,
    "name": "Braxton Brewing Company",
    "town": "Covington",
    "mile": 0.7,
    "detourMiles": 0.65
   },
   {
    "breweryId": 922,
    "name": "Holsopple Brewing",
    "town": "Lyndon",
    "mile": 89.5,
    "detourMiles": 2.78
   },
   {
    "breweryId": 897,
    "name": "Apocalypse Brew Works",
    "town": "Louisville",
    "mile": 95.4,
    "detourMiles": 0.41
   },
   {
    "breweryId": 894,
    "name": "Akasha Brewing Company",
    "town": "Louisville",
    "mile": 96,
    "detourMiles": 0.59
   },
   {
    "breweryId": 913,
    "name": "Falls City Brewing Company",
    "town": "Louisville",
    "mile": 96,
    "detourMiles": 0.78
   },
   {
    "breweryId": 930,
    "name": "Mile Wide Beer Co.",
    "town": "Louisville",
    "mile": 96,
    "detourMiles": 1.08
   },
   {
    "breweryId": 932,
    "name": "Monnik Beer Company",
    "town": "Louisville",
    "mile": 96,
    "detourMiles": 2.65
   },
   {
    "breweryId": 933,
    "name": "Old Louisville Brewery",
    "town": "Louisville",
    "mile": 96,
    "detourMiles": 2.8
   }
  ],
  "removed": [],
  "added": [
   {
    "breweryId": 235,
    "name": "Noble Beast Brewing Co.",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 1.98,
    "laterCheck": false
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
    "breweryId": 120,
    "name": "Forest City Brewery",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 0.45
   },
   {
    "breweryId": 136,
    "name": "Great Lakes Brewing Company",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 0.66
   },
   {
    "breweryId": 2356,
    "name": "Hansa Brewery",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 0.66
   },
   {
    "breweryId": 207,
    "name": "Market Garden Brewpub",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 0.66
   },
   {
    "breweryId": 51,
    "name": "Brick and Barrel",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 0.83
   },
   {
    "breweryId": 280,
    "name": "Saucy Brew Works",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 1.14
   },
   {
    "breweryId": 62,
    "name": "Butcher & the Brewer",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 1.37
   },
   {
    "breweryId": 296,
    "name": "Southern Tier Brewing Co. Cleveland",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 1.38
   },
   {
    "breweryId": 72,
    "name": "Collision Bend Brewing Company",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 1.46
   },
   {
    "breweryId": 208,
    "name": "Masthead Brewing Company",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 1.6
   },
   {
    "breweryId": 154,
    "name": "Hofbräuhaus Cleveland",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 1.75
   },
   {
    "breweryId": 235,
    "name": "Noble Beast Brewing Co.",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 1.98
   },
   {
    "breweryId": 308,
    "name": "Terrestrial Brewing Company",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 2.31
   },
   {
    "breweryId": 130,
    "name": "Goldhorn Brewery",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 3.71
   },
   {
    "breweryId": 182,
    "name": "The Jolly Scholar",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 4.79
   },
   {
    "breweryId": 284,
    "name": "Schnitz Ale Brewery",
    "town": "Parma",
    "mile": 4,
    "detourMiles": 2.81
   },
   {
    "breweryId": 2322,
    "name": "BottleHouse Brewery",
    "town": "Lakewood",
    "mile": 6,
    "detourMiles": 2.2
   },
   {
    "breweryId": 173,
    "name": "Immigrant Son Brewery",
    "town": "Lakewood",
    "mile": 7.6,
    "detourMiles": 3.4
   },
   {
    "breweryId": 272,
    "name": "Rocky River Brewing Company",
    "town": "Rocky River",
    "mile": 7.9,
    "detourMiles": 2.87
   },
   {
    "breweryId": 110,
    "name": "Fat Head’s North Olmsted",
    "town": "North Olmsted",
    "mile": 8.9,
    "detourMiles": 3.86
   },
   {
    "breweryId": 108,
    "name": "Fat Head’s Middleburg Heights",
    "town": "Middleburg Heights",
    "mile": 12.2,
    "detourMiles": 0.13
   },
   {
    "breweryId": 2444,
    "name": "The Brew Kettle, Taproom and Smokehouse",
    "town": "Strongsville",
    "mile": 14.2,
    "detourMiles": 0.23
   },
   {
    "breweryId": 169,
    "name": "Ignite Brewing Company - Brunswick",
    "town": "Brunswick",
    "mile": 21.6,
    "detourMiles": 0.42
   },
   {
    "breweryId": 31,
    "name": "Blue Heron Brewery",
    "town": "Medina",
    "mile": 30.9,
    "detourMiles": 0.4
   },
   {
    "breweryId": 200,
    "name": "MAD Brewing Company",
    "town": "Medina",
    "mile": 30.9,
    "detourMiles": 3.76
   },
   {
    "breweryId": 2371,
    "name": "Lager Heads Brewing Co.",
    "town": "Medina",
    "mile": 31.1,
    "detourMiles": 3.36
   },
   {
    "breweryId": 325,
    "name": "Uniontown Brewing Co.",
    "town": "Ashland",
    "mile": 63.8,
    "detourMiles": 2.41
   },
   {
    "breweryId": 160,
    "name": "Hoof Hearted Brewing",
    "town": "Marengo",
    "mile": 107.8,
    "detourMiles": 0.95
   },
   {
    "breweryId": 148,
    "name": "Henmick Farm & Brewery",
    "town": "Delaware",
    "mile": 114,
    "detourMiles": 2.64
   },
   {
    "breweryId": 300,
    "name": "Standardized Brewing Company",
    "town": "Lewis Center",
    "mile": 124,
    "detourMiles": 3
   },
   {
    "breweryId": 138,
    "name": "Grizzlybird Brewing Company",
    "town": "Westerville",
    "mile": 124.1,
    "detourMiles": 2.21
   },
   {
    "breweryId": 249,
    "name": "Olentangy River Brewing Company",
    "town": "Lewis Center",
    "mile": 125.8,
    "detourMiles": 2.25
   },
   {
    "breweryId": 297,
    "name": "Spires Social Brewing Co.",
    "town": "Columbus",
    "mile": 126.5,
    "detourMiles": 1.01
   },
   {
    "breweryId": 2441,
    "name": "Temperance Row Brewing and Uptown Deli",
    "town": "Westerville",
    "mile": 127.4,
    "detourMiles": 2.12
   },
   {
    "breweryId": 119,
    "name": "Forbidden Root (Columbus)",
    "town": "Columbus",
    "mile": 131.4,
    "detourMiles": 4.21
   },
   {
    "breweryId": 349,
    "name": "Yellow Springs Brewery - Columbus",
    "town": "Columbus",
    "mile": 135.1,
    "detourMiles": 0.35
   },
   {
    "breweryId": 89,
    "name": "Derive Brewing Company",
    "town": "Columbus",
    "mile": 135.2,
    "detourMiles": 0.92
   },
   {
    "breweryId": 161,
    "name": "Hoof Hearted Brewing - 5th Ave.",
    "town": "Columbus",
    "mile": 137.6,
    "detourMiles": 1
   },
   {
    "breweryId": 2430,
    "name": "Seventh Son Brewing Co",
    "town": "Columbus",
    "mile": 137.7,
    "detourMiles": 0.74
   },
   {
    "breweryId": 282,
    "name": "Saucy Brew Works Columbus",
    "town": "Columbus",
    "mile": 137.7,
    "detourMiles": 1.68
   },
   {
    "breweryId": 244,
    "name": "Ohio Brewing Company - Columbus",
    "town": "Columbus",
    "mile": 138,
    "detourMiles": 0.47
   },
   {
    "breweryId": 178,
    "name": "Jackie O's On Fourth",
    "town": "Columbus",
    "mile": 139,
    "detourMiles": 0.7
   },
   {
    "breweryId": 343,
    "name": "Wolf’s Ridge Brewing",
    "town": "Columbus",
    "mile": 139,
    "detourMiles": 0.7
   },
   {
    "breweryId": 126,
    "name": "Gemut Biergarten",
    "town": "Columbus",
    "mile": 139.4,
    "detourMiles": 0.13
   },
   {
    "breweryId": 2344,
    "name": "Elevator Brewery and Draught Haus",
    "town": "Columbus",
    "mile": 0.2,
    "detourMiles": 0.87
   },
   {
    "breweryId": 188,
    "name": "Land-Grant Brewing Company",
    "town": "Columbus",
    "mile": 0.5,
    "detourMiles": 0.34
   },
   {
    "breweryId": 2361,
    "name": "Hofbrauhaus Columbus",
    "town": "Columbus",
    "mile": 0.6,
    "detourMiles": 1.67
   },
   {
    "breweryId": 316,
    "name": "Thunderwing Brewing",
    "town": "Columbus",
    "mile": 0.8,
    "detourMiles": 2.96
   },
   {
    "breweryId": 2338,
    "name": "Columbus Brewing Co",
    "town": "Columbus",
    "mile": 0.8,
    "detourMiles": 3.17
   },
   {
    "breweryId": 139,
    "name": "Grove City Brewing Company",
    "town": "Grove City",
    "mile": 7.9,
    "detourMiles": 2.03
   },
   {
    "breweryId": 88,
    "name": "Depot Brewing Company, LLC",
    "town": "Morrow",
    "mile": 73.7,
    "detourMiles": 4.1
   },
   {
    "breweryId": 22,
    "name": "BC's Brewing Company",
    "town": "Mason",
    "mile": 81.1,
    "detourMiles": 1.51
   },
   {
    "breweryId": 76,
    "name": "The Common Beer Company",
    "town": "Mason",
    "mile": 82.9,
    "detourMiles": 2.02
   },
   {
    "breweryId": 132,
    "name": "Grainworks Brewing Company",
    "town": "West Chester",
    "mile": 83.4,
    "detourMiles": 4.77
   },
   {
    "breweryId": 293,
    "name": "Sonder Brewing",
    "town": "Mason",
    "mile": 85.5,
    "detourMiles": 0.41
   },
   {
    "breweryId": 230,
    "name": "Narrow Path Brewing Company",
    "town": "Loveland",
    "mile": 86.1,
    "detourMiles": 3.36
   },
   {
    "breweryId": 95,
    "name": "DVD Brew",
    "town": "Loveland",
    "mile": 87.6,
    "detourMiles": 3.17
   },
   {
    "breweryId": 203,
    "name": "March First Brewing",
    "town": "Cincinnati",
    "mile": 89,
    "detourMiles": 0.35
   },
   {
    "breweryId": 123,
    "name": "Fretboard Brewing Company",
    "town": "Blue Ash",
    "mile": 90.5,
    "detourMiles": 0.33
   },
   {
    "breweryId": 196,
    "name": "Little Miami Brewing Company",
    "town": "Milford",
    "mile": 94.8,
    "detourMiles": 4.59
   },
   {
    "breweryId": 150,
    "name": "HighGrain Brewing Company",
    "town": "Cincinnati",
    "mile": 96.1,
    "detourMiles": 0.63
   },
   {
    "breweryId": 113,
    "name": "Fifty West Brewing Company",
    "town": "Cincinnati",
    "mile": 97.1,
    "detourMiles": 3.31
   },
   {
    "breweryId": 2382,
    "name": "MadTree Brewing",
    "town": "Cincinnati",
    "mile": 98.8,
    "detourMiles": 0.64
   },
   {
    "breweryId": 2460,
    "name": "Wiedemann Brewing Co, LLC",
    "town": "Cincinnati",
    "mile": 99.1,
    "detourMiles": 3.73
   },
   {
    "breweryId": 121,
    "name": "Fretboard Brewing at Factory 52",
    "town": "Norwood",
    "mile": 99.7,
    "detourMiles": 0.28
   },
   {
    "breweryId": 304,
    "name": "Streetside Brewery",
    "town": "Cincinnati",
    "mile": 101.1,
    "detourMiles": 2.76
   },
   {
    "breweryId": 2395,
    "name": "Northern Row Brewery & Distillery",
    "town": "Cincinnati",
    "mile": 104.5,
    "detourMiles": 1.08
   },
   {
    "breweryId": 269,
    "name": "Rhinegeist",
    "town": "Cincinnati",
    "mile": 104.7,
    "detourMiles": 1.08
   },
   {
    "breweryId": 908,
    "name": "Darkness Brewing",
    "town": "Bellevue",
    "mile": 104.9,
    "detourMiles": 0.96
   },
   {
    "breweryId": 212,
    "name": "mellotone beer project",
    "town": "Cincinnati",
    "mile": 105.2,
    "detourMiles": 0.77
   },
   {
    "breweryId": 921,
    "name": "Hofbrauhaus Newport",
    "town": "Newport",
    "mile": 105.7,
    "detourMiles": 0.61
   },
   {
    "breweryId": 946,
    "name": "Wooden Cask Brewing Company",
    "town": "Newport",
    "mile": 105.7,
    "detourMiles": 0.84
   },
   {
    "breweryId": 902,
    "name": "Braxton Brewing Company",
    "town": "Covington",
    "mile": 0.7,
    "detourMiles": 0.65
   },
   {
    "breweryId": 922,
    "name": "Holsopple Brewing",
    "town": "Lyndon",
    "mile": 89.5,
    "detourMiles": 2.78
   },
   {
    "breweryId": 897,
    "name": "Apocalypse Brew Works",
    "town": "Louisville",
    "mile": 95.4,
    "detourMiles": 0.41
   },
   {
    "breweryId": 894,
    "name": "Akasha Brewing Company",
    "town": "Louisville",
    "mile": 96,
    "detourMiles": 0.59
   },
   {
    "breweryId": 913,
    "name": "Falls City Brewing Company",
    "town": "Louisville",
    "mile": 96,
    "detourMiles": 0.78
   },
   {
    "breweryId": 930,
    "name": "Mile Wide Beer Co.",
    "town": "Louisville",
    "mile": 96,
    "detourMiles": 1.08
   },
   {
    "breweryId": 932,
    "name": "Monnik Beer Company",
    "town": "Louisville",
    "mile": 96,
    "detourMiles": 2.65
   },
   {
    "breweryId": 933,
    "name": "Old Louisville Brewery",
    "town": "Louisville",
    "mile": 96,
    "detourMiles": 2.8
   }
  ],
  "after": [
   {
    "breweryId": 120,
    "name": "Forest City Brewery",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 0.45
   },
   {
    "breweryId": 136,
    "name": "Great Lakes Brewing Company",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 0.66
   },
   {
    "breweryId": 2356,
    "name": "Hansa Brewery",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 0.66
   },
   {
    "breweryId": 207,
    "name": "Market Garden Brewpub",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 0.66
   },
   {
    "breweryId": 44,
    "name": "BrewDog Cleveland Outpost",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 0.68
   },
   {
    "breweryId": 51,
    "name": "Brick and Barrel",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 0.83
   },
   {
    "breweryId": 280,
    "name": "Saucy Brew Works",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 1.14
   },
   {
    "breweryId": 62,
    "name": "Butcher & the Brewer",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 1.37
   },
   {
    "breweryId": 296,
    "name": "Southern Tier Brewing Co. Cleveland",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 1.38
   },
   {
    "breweryId": 72,
    "name": "Collision Bend Brewing Company",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 1.46
   },
   {
    "breweryId": 208,
    "name": "Masthead Brewing Company",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 1.6
   },
   {
    "breweryId": 154,
    "name": "Hofbräuhaus Cleveland",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 1.75
   },
   {
    "breweryId": 235,
    "name": "Noble Beast Brewing Co.",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 1.98
   },
   {
    "breweryId": 308,
    "name": "Terrestrial Brewing Company",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 2.31
   },
   {
    "breweryId": 130,
    "name": "Goldhorn Brewery",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 3.71
   },
   {
    "breweryId": 182,
    "name": "The Jolly Scholar",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 4.79
   },
   {
    "breweryId": 284,
    "name": "Schnitz Ale Brewery",
    "town": "Parma",
    "mile": 4,
    "detourMiles": 2.81
   },
   {
    "breweryId": 2322,
    "name": "BottleHouse Brewery",
    "town": "Lakewood",
    "mile": 6,
    "detourMiles": 2.2
   },
   {
    "breweryId": 173,
    "name": "Immigrant Son Brewery",
    "town": "Lakewood",
    "mile": 7.6,
    "detourMiles": 3.4
   },
   {
    "breweryId": 272,
    "name": "Rocky River Brewing Company",
    "town": "Rocky River",
    "mile": 7.9,
    "detourMiles": 2.87
   },
   {
    "breweryId": 110,
    "name": "Fat Head’s North Olmsted",
    "town": "North Olmsted",
    "mile": 8.9,
    "detourMiles": 3.86
   },
   {
    "breweryId": 108,
    "name": "Fat Head’s Middleburg Heights",
    "town": "Middleburg Heights",
    "mile": 12.2,
    "detourMiles": 0.13
   },
   {
    "breweryId": 2444,
    "name": "The Brew Kettle, Taproom and Smokehouse",
    "town": "Strongsville",
    "mile": 14.2,
    "detourMiles": 0.23
   },
   {
    "breweryId": 169,
    "name": "Ignite Brewing Company - Brunswick",
    "town": "Brunswick",
    "mile": 21.6,
    "detourMiles": 0.42
   },
   {
    "breweryId": 31,
    "name": "Blue Heron Brewery",
    "town": "Medina",
    "mile": 30.9,
    "detourMiles": 0.4
   },
   {
    "breweryId": 200,
    "name": "MAD Brewing Company",
    "town": "Medina",
    "mile": 30.9,
    "detourMiles": 3.76
   },
   {
    "breweryId": 2371,
    "name": "Lager Heads Brewing Co.",
    "town": "Medina",
    "mile": 31.1,
    "detourMiles": 3.36
   },
   {
    "breweryId": 325,
    "name": "Uniontown Brewing Co.",
    "town": "Ashland",
    "mile": 63.8,
    "detourMiles": 2.41
   },
   {
    "breweryId": 160,
    "name": "Hoof Hearted Brewing",
    "town": "Marengo",
    "mile": 107.8,
    "detourMiles": 0.95
   },
   {
    "breweryId": 148,
    "name": "Henmick Farm & Brewery",
    "town": "Delaware",
    "mile": 114,
    "detourMiles": 2.64
   },
   {
    "breweryId": 300,
    "name": "Standardized Brewing Company",
    "town": "Lewis Center",
    "mile": 124,
    "detourMiles": 3
   },
   {
    "breweryId": 138,
    "name": "Grizzlybird Brewing Company",
    "town": "Westerville",
    "mile": 124.1,
    "detourMiles": 2.21
   },
   {
    "breweryId": 249,
    "name": "Olentangy River Brewing Company",
    "town": "Lewis Center",
    "mile": 125.8,
    "detourMiles": 2.25
   },
   {
    "breweryId": 297,
    "name": "Spires Social Brewing Co.",
    "town": "Columbus",
    "mile": 126.5,
    "detourMiles": 1.01
   },
   {
    "breweryId": 2441,
    "name": "Temperance Row Brewing and Uptown Deli",
    "town": "Westerville",
    "mile": 127.4,
    "detourMiles": 2.12
   },
   {
    "breweryId": 119,
    "name": "Forbidden Root (Columbus)",
    "town": "Columbus",
    "mile": 131.4,
    "detourMiles": 4.21
   },
   {
    "breweryId": 349,
    "name": "Yellow Springs Brewery - Columbus",
    "town": "Columbus",
    "mile": 135.1,
    "detourMiles": 0.35
   },
   {
    "breweryId": 89,
    "name": "Derive Brewing Company",
    "town": "Columbus",
    "mile": 135.2,
    "detourMiles": 0.92
   },
   {
    "breweryId": 161,
    "name": "Hoof Hearted Brewing - 5th Ave.",
    "town": "Columbus",
    "mile": 137.6,
    "detourMiles": 1
   },
   {
    "breweryId": 2430,
    "name": "Seventh Son Brewing Co",
    "town": "Columbus",
    "mile": 137.7,
    "detourMiles": 0.74
   },
   {
    "breweryId": 282,
    "name": "Saucy Brew Works Columbus",
    "town": "Columbus",
    "mile": 137.7,
    "detourMiles": 1.68
   },
   {
    "breweryId": 244,
    "name": "Ohio Brewing Company - Columbus",
    "town": "Columbus",
    "mile": 138,
    "detourMiles": 0.47
   },
   {
    "breweryId": 178,
    "name": "Jackie O's On Fourth",
    "town": "Columbus",
    "mile": 139,
    "detourMiles": 0.7
   },
   {
    "breweryId": 343,
    "name": "Wolf’s Ridge Brewing",
    "town": "Columbus",
    "mile": 139,
    "detourMiles": 0.7
   },
   {
    "breweryId": 126,
    "name": "Gemut Biergarten",
    "town": "Columbus",
    "mile": 139.4,
    "detourMiles": 0.13
   },
   {
    "breweryId": 2344,
    "name": "Elevator Brewery and Draught Haus",
    "town": "Columbus",
    "mile": 0.2,
    "detourMiles": 0.87
   },
   {
    "breweryId": 188,
    "name": "Land-Grant Brewing Company",
    "town": "Columbus",
    "mile": 0.5,
    "detourMiles": 0.34
   },
   {
    "breweryId": 2361,
    "name": "Hofbrauhaus Columbus",
    "town": "Columbus",
    "mile": 0.6,
    "detourMiles": 1.67
   },
   {
    "breweryId": 316,
    "name": "Thunderwing Brewing",
    "town": "Columbus",
    "mile": 0.8,
    "detourMiles": 2.96
   },
   {
    "breweryId": 2338,
    "name": "Columbus Brewing Co",
    "town": "Columbus",
    "mile": 0.8,
    "detourMiles": 3.17
   },
   {
    "breweryId": 139,
    "name": "Grove City Brewing Company",
    "town": "Grove City",
    "mile": 7.9,
    "detourMiles": 2.03
   },
   {
    "breweryId": 88,
    "name": "Depot Brewing Company, LLC",
    "town": "Morrow",
    "mile": 73.7,
    "detourMiles": 4.1
   },
   {
    "breweryId": 22,
    "name": "BC's Brewing Company",
    "town": "Mason",
    "mile": 81.1,
    "detourMiles": 1.51
   },
   {
    "breweryId": 76,
    "name": "The Common Beer Company",
    "town": "Mason",
    "mile": 82.9,
    "detourMiles": 2.02
   },
   {
    "breweryId": 132,
    "name": "Grainworks Brewing Company",
    "town": "West Chester",
    "mile": 83.4,
    "detourMiles": 4.77
   },
   {
    "breweryId": 293,
    "name": "Sonder Brewing",
    "town": "Mason",
    "mile": 85.5,
    "detourMiles": 0.41
   },
   {
    "breweryId": 230,
    "name": "Narrow Path Brewing Company",
    "town": "Loveland",
    "mile": 86.1,
    "detourMiles": 3.36
   },
   {
    "breweryId": 95,
    "name": "DVD Brew",
    "town": "Loveland",
    "mile": 87.6,
    "detourMiles": 3.17
   },
   {
    "breweryId": 203,
    "name": "March First Brewing",
    "town": "Cincinnati",
    "mile": 89,
    "detourMiles": 0.35
   },
   {
    "breweryId": 123,
    "name": "Fretboard Brewing Company",
    "town": "Blue Ash",
    "mile": 90.5,
    "detourMiles": 0.33
   },
   {
    "breweryId": 196,
    "name": "Little Miami Brewing Company",
    "town": "Milford",
    "mile": 94.8,
    "detourMiles": 4.59
   },
   {
    "breweryId": 150,
    "name": "HighGrain Brewing Company",
    "town": "Cincinnati",
    "mile": 96.1,
    "detourMiles": 0.63
   },
   {
    "breweryId": 113,
    "name": "Fifty West Brewing Company",
    "town": "Cincinnati",
    "mile": 97.1,
    "detourMiles": 3.31
   },
   {
    "breweryId": 2382,
    "name": "MadTree Brewing",
    "town": "Cincinnati",
    "mile": 98.8,
    "detourMiles": 0.64
   },
   {
    "breweryId": 2460,
    "name": "Wiedemann Brewing Co, LLC",
    "town": "Cincinnati",
    "mile": 99.1,
    "detourMiles": 3.73
   },
   {
    "breweryId": 121,
    "name": "Fretboard Brewing at Factory 52",
    "town": "Norwood",
    "mile": 99.7,
    "detourMiles": 0.28
   },
   {
    "breweryId": 304,
    "name": "Streetside Brewery",
    "town": "Cincinnati",
    "mile": 101.1,
    "detourMiles": 2.76
   },
   {
    "breweryId": 2395,
    "name": "Northern Row Brewery & Distillery",
    "town": "Cincinnati",
    "mile": 104.5,
    "detourMiles": 1.08
   },
   {
    "breweryId": 269,
    "name": "Rhinegeist",
    "town": "Cincinnati",
    "mile": 104.7,
    "detourMiles": 1.08
   },
   {
    "breweryId": 908,
    "name": "Darkness Brewing",
    "town": "Bellevue",
    "mile": 104.9,
    "detourMiles": 0.96
   },
   {
    "breweryId": 212,
    "name": "mellotone beer project",
    "town": "Cincinnati",
    "mile": 105.2,
    "detourMiles": 0.77
   },
   {
    "breweryId": 921,
    "name": "Hofbrauhaus Newport",
    "town": "Newport",
    "mile": 105.7,
    "detourMiles": 0.61
   },
   {
    "breweryId": 946,
    "name": "Wooden Cask Brewing Company",
    "town": "Newport",
    "mile": 105.7,
    "detourMiles": 0.84
   },
   {
    "breweryId": 902,
    "name": "Braxton Brewing Company",
    "town": "Covington",
    "mile": 0.7,
    "detourMiles": 0.65
   },
   {
    "breweryId": 922,
    "name": "Holsopple Brewing",
    "town": "Lyndon",
    "mile": 89.5,
    "detourMiles": 2.78
   },
   {
    "breweryId": 897,
    "name": "Apocalypse Brew Works",
    "town": "Louisville",
    "mile": 95.4,
    "detourMiles": 0.41
   },
   {
    "breweryId": 894,
    "name": "Akasha Brewing Company",
    "town": "Louisville",
    "mile": 96,
    "detourMiles": 0.59
   },
   {
    "breweryId": 913,
    "name": "Falls City Brewing Company",
    "town": "Louisville",
    "mile": 96,
    "detourMiles": 0.78
   },
   {
    "breweryId": 930,
    "name": "Mile Wide Beer Co.",
    "town": "Louisville",
    "mile": 96,
    "detourMiles": 1.08
   },
   {
    "breweryId": 932,
    "name": "Monnik Beer Company",
    "town": "Louisville",
    "mile": 96,
    "detourMiles": 2.65
   },
   {
    "breweryId": 933,
    "name": "Old Louisville Brewery",
    "town": "Louisville",
    "mile": 96,
    "detourMiles": 2.8
   }
  ],
  "removed": [],
  "added": [
   {
    "breweryId": 44,
    "name": "BrewDog Cleveland Outpost",
    "town": "Cleveland",
    "mile": 0,
    "detourMiles": 0.68,
    "laterCheck": false,
    "via": "google-maps"
   }
  ],
  "measured": [],
  "slight": 0,
  "towns": []
 }
];
