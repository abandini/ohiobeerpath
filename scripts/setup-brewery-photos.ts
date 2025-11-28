/**
 * Setup brewery photos using Picsum (Lorem Picsum) API
 *
 * Uses Picsum for high-quality placeholder images
 * Each brewery gets a consistent image based on its ID
 */

import * as fs from 'fs';

interface Brewery {
  id: number;
  name: string;
  city: string;
  brewery_type?: string;
}

async function main() {
  // Load our breweries
  const dataPath = './data/breweries-export.json';
  const breweries: Brewery[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  console.log(`Generating photo URLs for ${breweries.length} breweries...`);

  // Generate SQL updates using Picsum URLs
  // Picsum provides consistent images by ID: https://picsum.photos/seed/{seed}/800/600
  // We'll use brewery ID + offset to get nice landscape photos

  const sqlUpdates: string[] = [];

  // Curated Picsum photo IDs that look good for brewery/food contexts
  // These are actual photo IDs from picsum.photos that have warm, inviting aesthetics
  const goodPhotoIds = [
    1060, // rustic wood
    312,  // bar/restaurant
    425,  // atmospheric
    429,  // cozy interior
    431,  // warm lighting
    447,  // food/drink setting
    488,  // bar setting
    490,  // restaurant
    493,  // evening ambiance
    513,  // cafe style
    514,  // warm interior
    534,  // social setting
    572,  // evening vibe
    755,  // outdoor setting
    766,  // food setting
    774,  // warm tones
    835,  // atmospheric
    859,  // evening
    866,  // social
    901,  // warm
    932,  // cozy
    1031, // interior
    1043, // rustic
    1047, // warm light
    1062, // atmospheric
    1067, // social gathering
    1074, // evening ambiance
  ];

  for (const brewery of breweries) {
    // Pick a photo ID based on brewery ID for consistency
    const photoId = goodPhotoIds[brewery.id % goodPhotoIds.length];

    // Use Picsum's deterministic URL format
    // The seed ensures each brewery gets the same photo consistently
    const imageUrl = `https://picsum.photos/id/${photoId}/800/600`;

    sqlUpdates.push(
      `-- ${brewery.name} (${brewery.city})\n` +
      `UPDATE breweries SET image_url = '${imageUrl}' WHERE id = ${brewery.id};`
    );
  }

  // Write SQL migration
  const migrationContent = `-- Assign brewery placeholder photos
-- Generated: ${new Date().toISOString()}
-- Uses Picsum for high-quality placeholder images
-- Total: ${sqlUpdates.length} breweries

${sqlUpdates.join('\n\n')}
`;

  fs.writeFileSync('./migrations/0004_assign_brewery_photos.sql', migrationContent);
  console.log('Generated: ./migrations/0004_assign_brewery_photos.sql');

  console.log(`
=== Summary ===
Breweries to update: ${breweries.length}
Photo source: Picsum (Lorem Picsum)
Photo size: 800x600

Next step:
  wrangler d1 migrations apply ohio-beer-path-db --remote

Note: These are placeholder images. For production, consider:
1. Google Places API photos (if API key available)
2. User-submitted brewery photos
3. Scraped social media images (with permission)
`);
}

main().catch(console.error);
