// Import breweries from JSON to D1 database

import * as fs from 'fs';

const BATCH_SIZE = 100;

interface Brewery {
  id?: number;
  name: string;
  brewery_type?: string;
  street?: string;
  address_2?: string;
  address_3?: string;
  city: string;
  state_province?: string;
  postal_code?: string;
  country?: string;
  longitude?: number | string;
  latitude?: number | string;
  phone?: string;
  website_url?: string;
  state?: string;
  region?: string;
  amenities?: any;
  description?: string;
  hours?: any;
  image_url?: string;
}

async function importBreweries() {
  console.log('Loading breweries data...');
  const data = fs.readFileSync('./data/breweries-export.json', 'utf-8');
  const breweries: Brewery[] = JSON.parse(data);

  console.log(`Found ${breweries.length} breweries to import`);

  // Generate SQL INSERT statements
  const batches: string[] = [];

  for (let i = 0; i < breweries.length; i += BATCH_SIZE) {
    const batch = breweries.slice(i, i + BATCH_SIZE);
    const values = batch.map(b => {
      // Escape single quotes and handle NULL values
      const escape = (val: any) => {
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'number') return val;
        if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
        return `'${String(val).replace(/'/g, "''")}'`;
      };

      return `(
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
      )`;
    }).join(',\n');

    const sql = `INSERT INTO breweries (
      name, brewery_type, street, address_2, address_3,
      city, state_province, postal_code, country,
      longitude, latitude, phone, website_url,
      state, region, amenities, description, hours, image_url
    ) VALUES ${values};`;

    batches.push(sql);
  }

  // Write SQL file
  const sqlContent = batches.join('\n\n');
  fs.writeFileSync('./migrations/0002_import_breweries.sql', sqlContent);

  console.log(`Generated migration file with ${batches.length} batches`);
  console.log('Run: wrangler d1 migrations apply ohio-beer-path-db --local');
}

importBreweries().catch(console.error);
