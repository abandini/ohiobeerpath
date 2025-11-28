/**
 * Import real brewery website URLs from Open Brewery DB
 *
 * This script:
 * 1. Fetches all Ohio breweries from Open Brewery DB API
 * 2. Matches them to our D1 database by name (fuzzy) + city
 * 3. Generates SQL UPDATE statements for matching breweries
 * 4. Outputs statistics on match rate
 */

import * as fs from 'fs';

interface OpenBreweryDBBrewery {
  id: string;
  name: string;
  brewery_type: string;
  address_1: string | null;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
  longitude: string | null;
  latitude: string | null;
  phone: string | null;
  website_url: string | null;
}

interface OurBrewery {
  id: number;
  name: string;
  city: string;
}

// Normalize brewery name for matching
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[&]/g, 'and')
    .replace(/brewing\s*(company|co\.?)?$/i, '')
    .replace(/brewery$/i, '')
    .replace(/brewpub$/i, '')
    .replace(/beer\s*(company|co\.?)?$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Normalize city for matching
function normalizeCity(city: string): string {
  return city.toLowerCase().trim();
}

// Calculate similarity between two strings (Levenshtein-based)
function similarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshtein(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshtein(s1: string, s2: string): number {
  const costs: number[] = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

async function fetchAllOhioBreweries(): Promise<OpenBreweryDBBrewery[]> {
  const allBreweries: OpenBreweryDBBrewery[] = [];
  let page = 1;
  const perPage = 50;

  console.log('Fetching breweries from Open Brewery DB...');

  while (true) {
    const url = `https://api.openbrewerydb.org/v1/breweries?by_state=ohio&per_page=${perPage}&page=${page}`;
    const response = await fetch(url);
    const breweries: OpenBreweryDBBrewery[] = await response.json();

    if (breweries.length === 0) break;

    allBreweries.push(...breweries);
    console.log(`  Page ${page}: fetched ${breweries.length} breweries (total: ${allBreweries.length})`);
    page++;

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return allBreweries;
}

async function main() {
  // 1. Fetch all Ohio breweries from Open Brewery DB
  const openBreweries = await fetchAllOhioBreweries();
  console.log(`\nTotal from Open Brewery DB: ${openBreweries.length}`);

  // Filter to only those with website URLs
  const withWebsites = openBreweries.filter(b => b.website_url && b.website_url.length > 0);
  console.log(`With website URLs: ${withWebsites.length}`);

  // 2. Load our breweries from the export JSON
  const ourDataPath = './data/breweries-export.json';
  if (!fs.existsSync(ourDataPath)) {
    console.error('Error: breweries-export.json not found. Run the PHP export script first.');
    process.exit(1);
  }

  const ourBreweries: OurBrewery[] = JSON.parse(fs.readFileSync(ourDataPath, 'utf-8'));
  console.log(`Our breweries: ${ourBreweries.length}`);

  // 3. Match breweries
  const matches: { ourId: number; ourName: string; openName: string; websiteUrl: string; confidence: number }[] = [];
  const noMatch: string[] = [];

  for (const openBrew of withWebsites) {
    const openNameNorm = normalizeName(openBrew.name);
    const openCityNorm = normalizeCity(openBrew.city);

    let bestMatch: OurBrewery | null = null;
    let bestScore = 0;

    for (const ourBrew of ourBreweries) {
      const ourNameNorm = normalizeName(ourBrew.name);
      const ourCityNorm = normalizeCity(ourBrew.city);

      // City must match exactly (or be very close)
      const citySim = similarity(openCityNorm, ourCityNorm);
      if (citySim < 0.8) continue;

      // Calculate name similarity
      const nameSim = similarity(openNameNorm, ourNameNorm);

      // Also check if one contains the other
      const containsBonus = openNameNorm.includes(ourNameNorm) || ourNameNorm.includes(openNameNorm) ? 0.2 : 0;

      const score = nameSim + containsBonus;

      if (score > bestScore && score > 0.7) {
        bestScore = score;
        bestMatch = ourBrew;
      }
    }

    if (bestMatch) {
      matches.push({
        ourId: bestMatch.id,
        ourName: bestMatch.name,
        openName: openBrew.name,
        websiteUrl: openBrew.website_url!,
        confidence: Math.min(bestScore, 1.0)
      });
    } else {
      noMatch.push(`${openBrew.name} (${openBrew.city})`);
    }
  }

  console.log(`\nMatched: ${matches.length}`);
  console.log(`No match: ${noMatch.length}`);

  // 4. Generate SQL UPDATE statements
  const sqlStatements: string[] = [];

  // High confidence matches (>= 0.9)
  const highConf = matches.filter(m => m.confidence >= 0.9);
  const medConf = matches.filter(m => m.confidence >= 0.7 && m.confidence < 0.9);

  console.log(`\nHigh confidence (>= 0.9): ${highConf.length}`);
  console.log(`Medium confidence (0.7-0.9): ${medConf.length}`);

  for (const match of matches) {
    const escapedUrl = match.websiteUrl.replace(/'/g, "''");
    sqlStatements.push(
      `-- ${match.ourName} <- ${match.openName} (confidence: ${match.confidence.toFixed(2)})\n` +
      `UPDATE breweries SET website_url = '${escapedUrl}' WHERE id = ${match.ourId};`
    );
  }

  // 5. Write SQL migration file
  const migrationContent = `-- Import website URLs from Open Brewery DB
-- Generated: ${new Date().toISOString()}
-- Matches: ${matches.length} of ${withWebsites.length} breweries with websites

${sqlStatements.join('\n\n')}
`;

  const migrationPath = './migrations/0003_import_website_urls.sql';
  fs.writeFileSync(migrationPath, migrationContent);
  console.log(`\nGenerated migration: ${migrationPath}`);

  // 6. Write no-match report for manual review
  const reportContent = `# Unmatched Breweries from Open Brewery DB

These breweries have website URLs but couldn't be matched to our database.
Consider adding them or manually updating.

${noMatch.map(n => `- ${n}`).join('\n')}
`;

  fs.writeFileSync('./data/unmatched-breweries.md', reportContent);
  console.log('Generated unmatched report: ./data/unmatched-breweries.md');

  // 7. Print sample matches for verification
  console.log('\n--- Sample Matches (first 10) ---');
  for (const match of matches.slice(0, 10)) {
    console.log(`  ${match.ourName}`);
    console.log(`    <- ${match.openName}`);
    console.log(`    URL: ${match.websiteUrl}`);
    console.log(`    Confidence: ${(match.confidence * 100).toFixed(0)}%\n`);
  }

  console.log('\nNext steps:');
  console.log('1. Review the migration file');
  console.log('2. Apply locally: npm run db:migrate:local');
  console.log('3. Apply to production: wrangler d1 migrations apply ohio-beer-path-db --remote');
}

main().catch(console.error);
