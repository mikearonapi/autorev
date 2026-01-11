#!/usr/bin/env node
/**
 * Backfill Missing Community Insights Embeddings
 * 
 * Generates OpenAI embeddings for community_insights rows that are missing them.
 * Uses text-embedding-3-small (1536 dimensions) to match existing embeddings.
 * 
 * Usage:
 *   node scripts/backfill-community-insights-embeddings.mjs
 *   node scripts/backfill-community-insights-embeddings.mjs --dry-run
 *   node scripts/backfill-community-insights-embeddings.mjs --limit 10
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const EMBEDDING_MODEL = 'text-embedding-3-small'; // 1536 dimensions - matches existing

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!OPENAI_API_KEY) {
  console.error('❌ Missing OPENAI_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Parse CLI args
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const limitIndex = args.indexOf('--limit');
const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : null;

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
      input: text.slice(0, 8000), // OpenAI limit
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
 * Build embedding text from insight
 */
function buildEmbeddingText(insight) {
  const parts = [
    insight.title,
    insight.summary,
    insight.details,
    insight.insight_type,
    insight.source_forum,
  ].filter(Boolean);
  
  return parts.join(' ').trim();
}

/**
 * Format vector for Postgres
 */
function vectorToPgLiteral(vector) {
  return `[${vector.join(',')}]`;
}

async function main() {
  console.log('🔍 Finding community_insights without embeddings...\n');
  
  // Find insights without embeddings
  let query = supabase
    .from('community_insights')
    .select('id, title, summary, details, insight_type, source_forum')
    .is('embedding', null)
    .order('created_at', { ascending: false });
  
  if (limit) {
    query = query.limit(limit);
  }
  
  const { data: insights, error } = await query;
  
  if (error) {
    console.error('❌ Error fetching insights:', error.message);
    process.exit(1);
  }
  
  console.log(`📊 Found ${insights.length} insights without embeddings\n`);
  
  if (insights.length === 0) {
    console.log('✅ All insights have embeddings!');
    return;
  }
  
  if (dryRun) {
    console.log('🔍 DRY RUN - Would process these insights:');
    insights.slice(0, 10).forEach((i, idx) => {
      console.log(`  ${idx + 1}. ${i.title}`);
    });
    if (insights.length > 10) {
      console.log(`  ... and ${insights.length - 10} more`);
    }
    return;
  }
  
  let processed = 0;
  let failed = 0;
  const batchSize = 5; // Respect rate limits
  
  for (let i = 0; i < insights.length; i += batchSize) {
    const batch = insights.slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (insight) => {
      try {
        const embeddingText = buildEmbeddingText(insight);
        
        if (!embeddingText || embeddingText.length < 10) {
          console.warn(`⚠️ Skipping ${insight.id} - insufficient text`);
          failed++;
          return;
        }
        
        const embedding = await generateEmbedding(embeddingText);
        
        // Update the row with embedding
        const { error: updateError } = await supabase
          .from('community_insights')
          .update({ 
            embedding: vectorToPgLiteral(embedding),
          })
          .eq('id', insight.id);
        
        if (updateError) {
          throw updateError;
        }
        
        processed++;
        console.log(`✅ [${processed}/${insights.length}] ${insight.title.slice(0, 60)}...`);
      } catch (err) {
        failed++;
        console.error(`❌ Failed: ${insight.title.slice(0, 40)}... - ${err.message}`);
      }
    }));
    
    // Small delay between batches
    if (i + batchSize < insights.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Successfully processed: ${processed}`);
  if (failed > 0) {
    console.log(`❌ Failed: ${failed}`);
  }
  console.log('='.repeat(60));
  
  // Verify
  const { count } = await supabase
    .from('community_insights')
    .select('*', { count: 'exact', head: true })
    .not('embedding', 'is', null);
  
  const { count: total } = await supabase
    .from('community_insights')
    .select('*', { count: 'exact', head: true });
  
  console.log(`\n📊 Community insights with embeddings: ${count}/${total}`);
}

main().catch(console.error);
