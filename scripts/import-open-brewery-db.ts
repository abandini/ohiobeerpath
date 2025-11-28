/**
 * Import breweries from Open Brewery DB API
 *
 * Usage:
 *   npx tsx scripts/import-open-brewery-db.ts michigan   # Import single state
 *   npx tsx scripts/import-open-brewery-db.ts all        # Import all supported states
 *   npx tsx scripts/import-open-brewery-db.ts neighbors  # Import Ohio neighbors
 */

import * as fs from 'fs';

const BATCH_SIZE = 100;
const API_BASE = 'https://api.openbrewerydb.org/v1/breweries';
const RATE_LIMIT_MS = 1000; // 1 second between requests

// State configuration (matching subdomain.ts)
const STATES: Record<string, { name: string; abbreviation: string }> = {
  'ohio': { name: 'Ohio', abbreviation: 'OH' },
  'michigan': { name: 'Michigan', abbreviation: 'MI' },
  'indiana': { name: 'Indiana', abbreviation: 'IN' },
  'kentucky': { name: 'Kentucky', abbreviation: 'KY' },
  'pennsylvania': { name: 'Pennsylvania', abbreviation: 'PA' },
  'west-virginia': { name: 'West Virginia', abbreviation: 'WV' },
  'new-york': { name: 'New York', abbreviation: 'NY' },
  'illinois': { name: 'Illinois', abbreviation: 'IL' },
  'wisconsin': { name: 'Wisconsin', abbreviation: 'WI' },
  'minnesota': { name: 'Minnesota', abbreviation: 'MN' },
  'iowa': { name: 'Iowa', abbreviation: 'IA' },
  'missouri': { name: 'Missouri', abbreviation: 'MO' },
  'tennessee': { name: 'Tennessee', abbreviation: 'TN' },
  'north-carolina': { name: 'North Carolina', abbreviation: 'NC' },
  'virginia': { name: 'Virginia', abbreviation: 'VA' },
  'maryland': { name: 'Maryland', abbreviation: 'MD' },
  'california': { name: 'California', abbreviation: 'CA' },
  'colorado': { name: 'Colorado', abbreviation: 'CO' },
  'oregon': { name: 'Oregon', abbreviation: 'OR' },
  'washington': { name: 'Washington', abbreviation: 'WA' },
  'texas': { name: 'Texas', abbreviation: 'TX' },
  'florida': { name: 'Florida', abbreviation: 'FL' },
  'georgia': { name: 'Georgia', abbreviation: 'GA' },
  'arizona': { name: 'Arizona', abbreviation: 'AZ' },
  'nevada': { name: 'Nevada', abbreviation: 'NV' },
};

// Ohio's neighbors for initial import
const OHIO_NEIGHBORS = ['michigan', 'indiana', 'kentucky', 'pennsylvania', 'west-virginia'];

interface OpenBreweryDBBrewery {
  id: string;
  name: string;
  brewery_type: string;
  address_1: string;
  address_2: string | null;
  address_3: string | null;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
  longitude: string | null;
  latitude: string | null;
  phone: string | null;
  website_url: string | null;
  state: string;
  street: string;
}

interface LocalBrewery {
  name: string;
  brewery_type: string | null;
  street: string | null;
  address_2: string | null;
  address_3: string | null;
  city: string;
  state_province: string;
  postal_code: string | null;
  country: string;
  longitude: number | null;
  latitude: number | null;
  phone: string | null;
  website_url: string | null;
  state: string;
  region: string | null;
  amenities: string;
  description: string | null;
  hours: string;
  image_url: string | null;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchBreweriesForState(stateName: string): Promise<OpenBreweryDBBrewery[]> {
  const breweries: OpenBreweryDBBrewery[] = [];
  let page = 1;
  const perPage = 200;

  console.log(`Fetching breweries for ${stateName}...`);

  while (true) {
    const url = `${API_BASE}?by_state=${encodeURIComponent(stateName)}&per_page=${perPage}&page=${page}`;
    console.log(`  Page ${page}...`);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: OpenBreweryDBBrewery[] = await response.json();

      if (data.length === 0) {
        break;
      }

      breweries.push(...data);

      if (data.length < perPage) {
        break;
      }

      page++;
      await sleep(RATE_LIMIT_MS);
    } catch (error) {
      console.error(`Error fetching page ${page}: ${error}`);
      break;
    }
  }

  console.log(`  Found ${breweries.length} breweries in ${stateName}`);
  return breweries;
}

function transformBrewery(brewery: OpenBreweryDBBrewery): LocalBrewery {
  return {
    name: brewery.name,
    brewery_type: brewery.brewery_type || null,
    street: brewery.address_1 || brewery.street || null,
    address_2: brewery.address_2 || null,
    address_3: brewery.address_3 || null,
    city: brewery.city,
    state_province: brewery.state_province,
    postal_code: brewery.postal_code || null,
    country: brewery.country || 'United States',
    longitude: brewery.longitude ? parseFloat(brewery.longitude) : null,
    latitude: brewery.latitude ? parseFloat(brewery.latitude) : null,
    phone: brewery.phone || null,
    website_url: brewery.website_url || null,
    state: brewery.state || brewery.state_province.substring(0, 2).toUpperCase(),
    region: null, // Will need to be set based on state geography
    amenities: '[]',
    description: null,
    hours: '{}',
    image_url: null
  };
}

function generateSQL(breweries: LocalBrewery[], stateName: string): string {
  if (breweries.length === 0) {
    return `-- No breweries found for ${stateName}\n`;
  }

  const escape = (val: any): string => {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number') {
      if (isNaN(val)) return 'NULL';
      return String(val);
    }
    if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
    return `'${String(val).replace(/'/g, "''")}'`;
  };

  const batches: string[] = [];

  for (let i = 0; i < breweries.length; i += BATCH_SIZE) {
    const batch = breweries.slice(i, i + BATCH_SIZE);
    const values = batch.map(b => `(
      ${escape(b.name)},
      ${escape(b.brewery_type)},
      ${escape(b.street)},
      ${escape(b.address_2)},
      ${escape(b.address_3)},
      ${escape(b.city)},
      ${escape(b.state_province)},
      ${escape(b.postal_code)},
      ${escape(b.country)},
      ${escape(b.longitude)},
      ${escape(b.latitude)},
      ${escape(b.phone)},
      ${escape(b.website_url)},
      ${escape(b.state)},
      ${escape(b.region)},
      ${escape(b.amenities)},
      ${escape(b.description)},
      ${escape(b.hours)},
      ${escape(b.image_url)}
    )`).join(',\n');

    batches.push(`INSERT INTO breweries (
      name, brewery_type, street, address_2, address_3,
      city, state_province, postal_code, country,
      longitude, latitude, phone, website_url,
      state, region, amenities, description, hours, image_url
    ) VALUES ${values};`);
  }

  return `-- ${stateName} breweries (${breweries.length} total)\n` + batches.join('\n\n');
}

async function main() {
  const args = process.argv.slice(2);
  const target = args[0]?.toLowerCase();

  if (!target) {
    console.log('Usage:');
    console.log('  npx tsx scripts/import-open-brewery-db.ts michigan   # Import single state');
    console.log('  npx tsx scripts/import-open-brewery-db.ts all        # Import all supported states');
    console.log('  npx tsx scripts/import-open-brewery-db.ts neighbors  # Import Ohio neighbors');
    console.log('');
    console.log('Available states:', Object.keys(STATES).join(', '));
    process.exit(1);
  }

  let statesToImport: string[] = [];

  if (target === 'all') {
    statesToImport = Object.keys(STATES);
  } else if (target === 'neighbors') {
    statesToImport = OHIO_NEIGHBORS;
  } else if (STATES[target]) {
    statesToImport = [target];
  } else {
    console.error(`Unknown state: ${target}`);
    console.log('Available states:', Object.keys(STATES).join(', '));
    process.exit(1);
  }

  console.log(`Importing breweries for: ${statesToImport.join(', ')}`);
  console.log('');

  const allBreweries: LocalBrewery[] = [];
  const sqlParts: string[] = [];

  for (const stateKey of statesToImport) {
    const stateInfo = STATES[stateKey];
    const rawBreweries = await fetchBreweriesForState(stateInfo.name);

    // Transform and fix state abbreviation
    const transformed = rawBreweries.map(b => {
      const local = transformBrewery(b);
      // Ensure correct state abbreviation
      local.state = stateInfo.abbreviation;
      return local;
    });

    allBreweries.push(...transformed);
    sqlParts.push(generateSQL(transformed, stateInfo.name));

    // Save JSON for this state
    const jsonPath = `./data/${stateKey}-breweries.json`;
    fs.mkdirSync('./data', { recursive: true });
    fs.writeFileSync(jsonPath, JSON.stringify(transformed, null, 2));
    console.log(`Saved ${transformed.length} breweries to ${jsonPath}`);

    await sleep(RATE_LIMIT_MS);
  }

  // Generate migration file
  const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const migrationPath = `./migrations/import_${target}_${timestamp}.sql`;

  const sqlContent = `-- Open Brewery DB Import
-- Generated: ${new Date().toISOString()}
-- States: ${statesToImport.join(', ')}
-- Total breweries: ${allBreweries.length}

${sqlParts.join('\n\n')}
`;

  fs.writeFileSync(migrationPath, sqlContent);
  console.log('');
  console.log(`Generated migration: ${migrationPath}`);
  console.log(`Total breweries: ${allBreweries.length}`);
  console.log('');
  console.log('To import locally:');
  console.log(`  wrangler d1 execute ohio-beer-path-db --local --file=${migrationPath}`);
  console.log('');
  console.log('To import to production:');
  console.log(`  wrangler d1 execute ohio-beer-path-db --remote --file=${migrationPath}`);
}

main().catch(console.error);
