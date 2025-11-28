/**
 * Seed Embeddings Script
 *
 * This script generates embeddings for all breweries and upserts them
 * into the Vectorize index. Run this once to populate the index,
 * and then the cron job will keep it updated.
 *
 * Usage:
 *   npx wrangler dev --remote
 *   # In another terminal:
 *   curl http://localhost:8787/api/admin/seed-embeddings
 *
 * Or deploy and hit the endpoint directly.
 */

import type { Env, Brewery } from '../src/types';

interface EmbeddingVector {
  id: string;
  values: number[];
  metadata: Record<string, string>;
}

export async function seedEmbeddings(env: Env): Promise<{ success: boolean; processed: number; errors: string[] }> {
  const errors: string[] = [];
  let processed = 0;

  try {
    // Fetch all breweries
    const { results: breweries } = await env.DB.prepare(
      'SELECT id, name, city, region, brewery_type, description FROM breweries'
    ).all<Brewery>();

    if (!breweries || breweries.length === 0) {
      return { success: false, processed: 0, errors: ['No breweries found'] };
    }

    console.log(`Processing ${breweries.length} breweries...`);

    // Process in batches of 10 to avoid rate limits
    const batchSize = 10;
    const vectors: EmbeddingVector[] = [];

    for (let i = 0; i < breweries.length; i += batchSize) {
      const batch = breweries.slice(i, i + batchSize);

      for (const brewery of batch) {
        try {
          // Create text to embed - combine name, city, region, type, description
          const textToEmbed = [
            brewery.name,
            brewery.city,
            brewery.region,
            brewery.brewery_type,
            brewery.description
          ].filter(Boolean).join(' | ');

          // Generate embedding
          const embeddingResponse = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
            text: textToEmbed
          }) as any;

          const embeddingData = embeddingResponse?.data || embeddingResponse;
          const vector = Array.isArray(embeddingData) ? embeddingData[0] : embeddingData;

          if (Array.isArray(vector) && vector.length === 768) {
            vectors.push({
              id: String(brewery.id),
              values: vector,
              metadata: {
                name: brewery.name || '',
                city: brewery.city || '',
                region: brewery.region || ''
              }
            });
            processed++;
          } else {
            errors.push(`Invalid embedding for brewery ${brewery.id}: ${brewery.name}`);
          }
        } catch (err: any) {
          errors.push(`Error processing brewery ${brewery.id}: ${err.message}`);
        }
      }

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Upsert vectors to Vectorize
    if (vectors.length > 0) {
      console.log(`Upserting ${vectors.length} vectors to Vectorize...`);

      // Upsert in batches of 100
      for (let i = 0; i < vectors.length; i += 100) {
        const batch = vectors.slice(i, i + 100);
        await env.VECTORIZE.upsert(batch);
      }
    }

    return { success: true, processed, errors };

  } catch (err: any) {
    return { success: false, processed, errors: [...errors, err.message] };
  }
}

export default seedEmbeddings;
