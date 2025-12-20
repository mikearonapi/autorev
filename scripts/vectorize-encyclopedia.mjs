/**
 * Vectorize Encyclopedia Topics
 * 
 * Processes 136 encyclopedia topics into document_chunks with embeddings
 * for semantic search via AL's search_encyclopedia tool.
 * 
 * This enables AL to semantically search educational content like:
 *   "how does a turbo work?" → turbo-fundamentals topic
 *   "what is bore and stroke?" → bore, stroke topics
 * 
 * Env (.env.local):
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY  
 *   - OPENAI_API_KEY
 *   - (optional) OPENAI_EMBEDDING_MODEL (default: text-embedding-3-small)
 * 
 * Usage:
 *   node scripts/vectorize-encyclopedia.mjs              # Full run
 *   node scripts/vectorize-encyclopedia.mjs --dry-run    # Preview only
 *   node scripts/vectorize-encyclopedia.mjs --force      # Re-vectorize all
 *   node scripts/vectorize-encyclopedia.mjs --limit=10   # Process first 10
 * 
 * @module scripts/vectorize-encyclopedia
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Load environment
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';

// Parse CLI args
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FORCE = args.includes('--force');
const limitArg = args.find(a => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : null;

// Validate environment
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}
if (!OPENAI_API_KEY) {
  console.error('❌ Missing OPENAI_API_KEY in .env.local (required for embeddings)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// =============================================================================
// EMBEDDING UTILITIES
// =============================================================================

async function generateEmbedding(text) {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_EMBEDDING_MODEL,
      input: text.slice(0, 8000),
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `OpenAI embeddings failed (${res.status})`);
  }

  const data = await res.json();
  const embedding = data?.data?.[0]?.embedding;
  if (!Array.isArray(embedding)) throw new Error('OpenAI returned no embedding vector');
  return embedding;
}

function toPgVectorLiteral(vec) {
  return `[${vec.join(',')}]`;
}

function computeChecksum(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

// =============================================================================
// TOPIC LOADING
// =============================================================================

/**
 * Dynamically import encyclopedia topics.
 * We can't use regular imports because this is an ES module script.
 */
async function loadEncyclopediaTopics() {
  // Import each topic file
  const [
    { engineTopics },
    { coolingTopics },
    { drivetrainTopics },
    { fuelSystemTopics },
    { engineManagementTopics },
    { intakeTopics },
    { exhaustTopics },
    { suspensionTopics },
    { aeroTopics },
    { brakeTopics },
  ] = await Promise.all([
    import('../lib/encyclopediaTopics/engineTopics.js'),
    import('../lib/encyclopediaTopics/coolingTopics.js'),
    import('../lib/encyclopediaTopics/drivetrainTopics.js'),
    import('../lib/encyclopediaTopics/fuelSystemTopics.js'),
    import('../lib/encyclopediaTopics/engineManagementTopics.js'),
    import('../lib/encyclopediaTopics/intakeTopics.js'),
    import('../lib/encyclopediaTopics/exhaustTopics.js'),
    import('../lib/encyclopediaTopics/suspensionTopics.js'),
    import('../lib/encyclopediaTopics/aeroTopics.js'),
    import('../lib/encyclopediaTopics/brakeTopics.js'),
  ]);

  const allTopics = [
    ...engineTopics,
    ...coolingTopics,
    ...drivetrainTopics,
    ...fuelSystemTopics,
    ...engineManagementTopics,
    ...intakeTopics,
    ...exhaustTopics,
    ...suspensionTopics,
    ...aeroTopics,
    ...brakeTopics,
  ];

  return allTopics;
}

// =============================================================================
// TOPIC PROCESSING
// =============================================================================

/**
 * Build a rich text representation of a topic for embedding.
 * Combines all content fields into a single cohesive chunk.
 */
function buildTopicChunkText(topic) {
  const parts = [
    `Topic: ${topic.name}`,
    `System: ${topic.system}`,
    '',
    `What is it: ${topic.definition}`,
    '',
    `How it works: ${topic.howItWorks}`,
    '',
    `Why it matters: ${topic.whyItMatters}`,
  ];

  // Add modification potential if available
  if (topic.modPotential) {
    if (typeof topic.modPotential === 'string') {
      parts.push('', `Modification potential: ${topic.modPotential}`);
    } else if (typeof topic.modPotential === 'object') {
      parts.push('', 'Modification potential:');
      if (topic.modPotential.summary) parts.push(`  Summary: ${topic.modPotential.summary}`);
      if (topic.modPotential.gains) parts.push(`  Gains: ${topic.modPotential.gains}`);
      if (topic.modPotential.considerations) parts.push(`  Considerations: ${topic.modPotential.considerations}`);
    }
  }

  // Add common types if available
  if (topic.commonTypes && topic.commonTypes.length > 0) {
    parts.push('', `Common types: ${topic.commonTypes.join('; ')}`);
  }

  // Add key specs if available
  if (topic.keySpecs && topic.keySpecs.length > 0) {
    parts.push('', `Key specifications: ${topic.keySpecs.join('; ')}`);
  }

  // Add related topics for context
  if (topic.relatedTopics && topic.relatedTopics.length > 0) {
    parts.push('', `Related topics: ${topic.relatedTopics.join(', ')}`);
  }

  // Add related upgrade keys for cross-reference
  if (topic.relatedUpgradeKeys && topic.relatedUpgradeKeys.length > 0) {
    parts.push('', `Related modifications: ${topic.relatedUpgradeKeys.join(', ')}`);
  }

  return parts.join('\n');
}

/**
 * Create or update source document for encyclopedia topic.
 */
async function ensureSourceDocument(topic, chunkText) {
  const checksum = `encyclopedia:topic:${topic.slug}:v2`;
  const sourceUrl = `/encyclopedia/topic/${topic.slug}`;
  const sourceTitle = `Encyclopedia: ${topic.name}`;

  // Check for existing document
  const { data: existing } = await supabase
    .from('source_documents')
    .select('id, checksum')
    .eq('checksum', checksum)
    .maybeSingle();

  if (existing?.id) {
    // Update existing document
    await supabase
      .from('source_documents')
      .update({
        raw_text: chunkText,
        metadata: {
          topic_slug: topic.slug,
          topic_name: topic.name,
          system: topic.system,
          status: topic.status,
          related_topics: topic.relatedTopics || [],
          related_upgrades: topic.relatedUpgradeKeys || [],
          vectorized_at: new Date().toISOString(),
        },
      })
      .eq('id', existing.id);
    return existing.id;
  }

  // Insert new document
  const { data: inserted, error } = await supabase
    .from('source_documents')
    .insert({
      source_type: 'encyclopedia',
      source_url: sourceUrl,
      source_title: sourceTitle,
      retrieved_at: new Date().toISOString(),
      checksum,
      raw_text: chunkText,
      metadata: {
        topic_slug: topic.slug,
        topic_name: topic.name,
        system: topic.system,
        status: topic.status,
        related_topics: topic.relatedTopics || [],
        related_upgrades: topic.relatedUpgradeKeys || [],
        vectorized_at: new Date().toISOString(),
      },
    })
    .select('id')
    .single();

  if (error) throw error;
  return inserted.id;
}

/**
 * Check if topic already has embeddings (skip if not forcing).
 */
async function hasExistingEmbeddings(topicSlug) {
  const { count, error } = await supabase
    .from('document_chunks')
    .select('id', { count: 'exact', head: true })
    .eq('topic', `encyclopedia:${topicSlug}`);

  if (error) return false;
  return (count || 0) > 0;
}

/**
 * Index a single topic into document_chunks.
 */
async function indexTopic(topic) {
  const chunkText = buildTopicChunkText(topic);
  
  // Get or create source document
  const documentId = await ensureSourceDocument(topic, chunkText);

  // Remove existing chunks for this topic (deterministic re-index)
  await supabase
    .from('document_chunks')
    .delete()
    .eq('document_id', documentId);

  // Generate embedding
  const embedding = await generateEmbedding(chunkText);
  const pgVec = toPgVectorLiteral(embedding);

  // Insert chunk
  const { error } = await supabase.from('document_chunks').insert({
    document_id: documentId,
    car_id: null,
    car_slug: null,
    chunk_index: 0,
    chunk_text: chunkText,
    chunk_tokens: Math.ceil(chunkText.length / 4),
    topic: `encyclopedia:${topic.slug}`,
    embedding_model: OPENAI_EMBEDDING_MODEL,
    embedding: pgVec,
    metadata: {
      source_type: 'encyclopedia',
      topic_slug: topic.slug,
      topic_name: topic.name,
      system: topic.system,
      status: topic.status,
      related_topics: topic.relatedTopics || [],
      related_upgrades: topic.relatedUpgradeKeys || [],
    },
  });

  if (error) throw error;
  return { documentId, chunkLength: chunkText.length };
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('  Encyclopedia Vectorization Script');
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log(`  Mode: ${DRY_RUN ? 'DRY RUN (preview only)' : 'LIVE'}`);
  console.log(`  Force re-index: ${FORCE}`);
  console.log(`  Limit: ${LIMIT || 'None'}`);
  console.log(`  Embedding model: ${OPENAI_EMBEDDING_MODEL}`);
  console.log('═══════════════════════════════════════════════════════════════════════\n');

  // Load topics
  console.log('📚 Loading encyclopedia topics...');
  const allTopics = await loadEncyclopediaTopics();
  console.log(`   Found ${allTopics.length} topics\n`);

  // Apply limit
  let topics = LIMIT ? allTopics.slice(0, LIMIT) : allTopics;

  // Group by system for logging
  const bySystem = {};
  for (const t of topics) {
    bySystem[t.system] = (bySystem[t.system] || 0) + 1;
  }
  console.log('📊 Topics by system:');
  for (const [sys, count] of Object.entries(bySystem)) {
    console.log(`   • ${sys}: ${count}`);
  }
  console.log('');

  // Processing stats
  let processed = 0;
  let skipped = 0;
  let errors = 0;

  // Process each topic
  for (const topic of topics) {
    const prefix = `[${processed + skipped + errors + 1}/${topics.length}]`;

    try {
      // Check for existing (unless forcing)
      if (!FORCE) {
        const exists = await hasExistingEmbeddings(topic.slug);
        if (exists) {
          console.log(`${prefix} ⏭️  ${topic.name} (${topic.system}) — already indexed`);
          skipped++;
          continue;
        }
      }

      if (DRY_RUN) {
        const chunkText = buildTopicChunkText(topic);
        console.log(`${prefix} 🔍 ${topic.name} (${topic.system})`);
        console.log(`       Would create chunk: ${chunkText.length} chars, ~${Math.ceil(chunkText.length / 4)} tokens`);
        processed++;
      } else {
        const result = await indexTopic(topic);
        console.log(`${prefix} ✅ ${topic.name} (${topic.system}) — ${result.chunkLength} chars`);
        processed++;
      }
    } catch (err) {
      console.error(`${prefix} ❌ ${topic.name} (${topic.system}) — ${err.message}`);
      errors++;
    }

    // Rate limit: ~1 request per second to avoid OpenAI rate limits
    if (!DRY_RUN && processed > 0 && processed % 10 === 0) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════════════');
  console.log('  Summary');
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log(`  Processed: ${processed}`);
  console.log(`  Skipped:   ${skipped}`);
  console.log(`  Errors:    ${errors}`);
  console.log(`  Total:     ${topics.length}`);
  console.log('═══════════════════════════════════════════════════════════════════════');

  if (DRY_RUN) {
    console.log('\n💡 This was a dry run. Run without --dry-run to actually vectorize.\n');
  }
}

main().catch(err => {
  console.error('\n💥 Fatal error:', err.message);
  process.exit(1);
});











