/**
 * Generate Embedding Vectors for Semantic Search
 * 
 * This script generates OpenAI embeddings for all cars and stores them in the database.
 * These embeddings enable semantic search - finding cars by meaning, not just keywords.
 * 
 * Prerequisites:
 * 1. Add OPENAI_API_KEY to your .env.local file
 * 2. Run: node scripts/generate-embeddings.mjs
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const EMBEDDING_MODEL = 'text-embedding-ada-002'; // 1536 dimensions

if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY not found in .env.local');
  console.log('\nTo generate embeddings for semantic search:');
  console.log('1. Get an API key from https://platform.openai.com/api-keys');
  console.log('2. Add to .env.local: OPENAI_API_KEY=sk-...');
  console.log('3. Run this script again\n');
  process.exit(1);
}

/**
 * Generate embedding from OpenAI
 */
async function generateEmbedding(text) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

/**
 * Build rich searchable text for a car
 */
function buildSearchableText(car) {
  const parts = [
    car.name,
    car.brand,
    car.category,
    car.essence,
    car.highlight,
    car.ideal_owner,
    car.buyers_summary,
    car.engine,
    car.drivetrain,
    `${car.hp} horsepower`,
    `${car.torque} lb-ft torque`,
    `${car.zero_to_sixty} seconds 0-60`,
    `$${car.price_avg} average price`,
    car.years,
    car.pros?.join(', '),
    car.cons?.join(', '),
  ].filter(Boolean);

  return parts.join(' ').substring(0, 8000); // OpenAI limit ~8K tokens
}

async function main() {
  console.log('🚀 Starting embedding generation...\n');

  // Fetch all cars
  const { data: cars, error } = await supabase
    .from('cars')
    .select('slug, name, brand, category, essence, highlight, ideal_owner, buyers_summary, engine, drivetrain, hp, torque, zero_to_sixty, price_avg, years, pros, cons')
    .order('slug');

  if (error) {
    console.error('❌ Error fetching cars:', error.message);
    process.exit(1);
  }

  console.log(`📊 Found ${cars.length} cars to process\n`);

  let processed = 0;
  let failed = 0;
  const batchSize = 5; // Process 5 at a time to avoid rate limits

  for (let i = 0; i < cars.length; i += batchSize) {
    const batch = cars.slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (car) => {
      try {
        const searchText = buildSearchableText(car);
        const embedding = await generateEmbedding(searchText);

        // Store embedding in database
        const { error: updateError } = await supabase
          .from('cars')
          .update({ embedding: embedding })
          .eq('slug', car.slug);

        if (updateError) {
          throw updateError;
        }

        processed++;
        console.log(`✅ [${processed}/${cars.length}] ${car.name}`);
      } catch (err) {
        failed++;
        console.error(`❌ Failed: ${car.name} - ${err.message}`);
      }
    }));

    // Small delay between batches to respect rate limits
    if (i + batchSize < cars.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Successfully processed: ${processed}`);
  if (failed > 0) {
    console.log(`❌ Failed: ${failed}`);
  }
  console.log('='.repeat(50));
  
  // Verify
  const { count } = await supabase
    .from('cars')
    .select('*', { count: 'exact', head: true })
    .not('embedding', 'is', null);

  console.log(`\n📊 Cars with embeddings: ${count}/98`);
  console.log('🔍 Semantic search is now enabled!\n');
}

main().catch(console.error);






