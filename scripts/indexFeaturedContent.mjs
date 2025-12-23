/**
 * Index Featured Content into `document_chunks` with embeddings.
 *
 * Enables AL tool: search_knowledge (pgvector similarity + citations)
 * for educational/technical content in the featured_content table.
 *
 * Env (.env.local):
 *  - NEXT_PUBLIC_SUPABASE_URL
 *  - SUPABASE_SERVICE_ROLE_KEY
 *  - OPENAI_API_KEY
 *  - (optional) OPENAI_EMBEDDING_MODEL (default: text-embedding-3-small)
 *
 * Run:
 *  node scripts/indexFeaturedContent.mjs              # Index new content
 *  node scripts/indexFeaturedContent.mjs --force     # Re-index all
 *  node scripts/indexFeaturedContent.mjs --limit=50  # Limit to 50 items
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';

// Parse CLI args
const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const limitArg = args.find(a => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : 500;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}
if (!OPENAI_API_KEY) {
  console.error('Missing OPENAI_API_KEY in .env.local (required for embeddings)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

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
  if (!Array.isArray(embedding)) throw new Error('OpenAI embeddings returned no vector');
  return embedding;
}

function toPgVectorLiteral(vec) {
  return `[${vec.join(',')}]`;
}

function chunkText(text, { maxChars = 1400, overlapChars = 200 } = {}) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return [];

  const chunks = [];
  let start = 0;
  while (start < clean.length) {
    const end = Math.min(clean.length, start + maxChars);
    const chunk = clean.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    if (end >= clean.length) break;
    start = Math.max(0, end - overlapChars);
  }
  return chunks;
}

async function getOrCreateSourceDocument({ checksum, sourceUrl, sourceTitle, rawText, rawJson, metadata }) {
  const existing = await supabase
    .from('source_documents')
    .select('id')
    .eq('checksum', checksum)
    .maybeSingle();

  if (!existing.error && existing.data?.id) return existing.data.id;

  const inserted = await supabase
    .from('source_documents')
    .insert({
      source_type: 'featured_content',
      source_url: sourceUrl,
      source_title: sourceTitle,
      retrieved_at: new Date().toISOString(),
      checksum,
      raw_text: rawText,
      raw_json: rawJson,
      metadata,
    })
    .select('id')
    .single();

  if (inserted.error) throw inserted.error;
  return inserted.data.id;
}

/**
 * Check if content is already indexed.
 */
async function isContentAlreadyIndexed(videoId) {
  const { count, error } = await supabase
    .from('document_chunks')
    .select('id', { count: 'exact', head: true })
    .eq('topic', 'featured_content')
    .contains('metadata', { video_id: videoId });
  
  if (error) return false;
  return (count || 0) > 0;
}

async function indexContent(content) {
  const transcript = content.transcript_text?.trim();
  if (!transcript) return { skipped: true, reason: 'no transcript' };

  const videoId = content.source_video_id;
  const url = content.source_url;
  const title = content.title || videoId;

  const checksum = `featured_content:${videoId}:transcript_v1`;
  
  // Build rich context for the document
  const rawText = [
    `Title: ${title}`,
    content.channel_name ? `Channel: ${content.channel_name}` : null,
    content.category ? `Category: ${content.category}` : null,
    content.brands_featured?.length ? `Brands: ${content.brands_featured.join(', ')}` : null,
    content.topics?.length ? `Topics: ${content.topics.join(', ')}` : null,
    url ? `URL: ${url}` : null,
    '',
    transcript,
  ].filter(Boolean).join('\n');

  const documentId = await getOrCreateSourceDocument({
    checksum,
    sourceUrl: url,
    sourceTitle: title,
    rawText,
    rawJson: { 
      videoId, 
      url, 
      channelName: content.channel_name, 
      category: content.category,
      brands: content.brands_featured,
      topics: content.topics,
    },
    metadata: { 
      video_id: videoId, 
      channel_name: content.channel_name, 
      category: content.category,
      brands: content.brands_featured,
      topics: content.topics,
    },
  });

  // Re-index: remove existing chunks for this doc
  const del = await supabase.from('document_chunks').delete().eq('document_id', documentId);
  if (del.error) throw del.error;

  const chunks = chunkText(transcript, { maxChars: 1400, overlapChars: 200 });
  let chunkRowCount = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = await generateEmbedding(chunk);
    const pgVec = toPgVectorLiteral(embedding);

    const { error } = await supabase.from('document_chunks').insert({
      document_id: documentId,
      car_id: null,
      car_slug: null,
      chunk_index: i,
      chunk_text: chunk,
      chunk_tokens: Math.ceil(chunk.length / 4),
      topic: 'featured_content',
      embedding_model: OPENAI_EMBEDDING_MODEL,
      embedding: pgVec,
      metadata: {
        video_id: videoId,
        url,
        source_type: 'featured_content',
        channel_name: content.channel_name,
        category: content.category,
        brands: content.brands_featured,
        topics: content.topics,
      },
    });
    if (error) throw error;
    chunkRowCount++;
  }

  return { skipped: false, documentId, chunkRowCount };
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('  Featured Content Knowledge Base Indexer');
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log(`  Force re-index: ${FORCE}`);
  console.log(`  Limit: ${LIMIT}`);
  console.log(`  Embedding model: ${OPENAI_EMBEDDING_MODEL}`);
  console.log('═══════════════════════════════════════════════════════════════════════\n');

  console.log('📚 Fetching featured content with transcripts...');

  const { data: contents, error: cErr } = await supabase
    .from('featured_content')
    .select('id,source_video_id,source_url,title,channel_name,category,brands_featured,topics,transcript_text')
    .not('transcript_text', 'is', null)
    .order('created_at', { ascending: false })
    .limit(LIMIT);
  if (cErr) throw cErr;

  console.log(`   Found ${contents?.length || 0} items with transcripts.\n`);

  let indexed = 0;
  let skipped = 0;
  let alreadyIndexed = 0;
  let errors = 0;

  for (let i = 0; i < (contents || []).length; i++) {
    const content = contents[i];
    const prefix = `[${i + 1}/${contents.length}]`;
    
    try {
      // Skip if already indexed (unless --force)
      if (!FORCE) {
        const exists = await isContentAlreadyIndexed(content.source_video_id);
        if (exists) {
          alreadyIndexed++;
          continue;
        }
      }

      const res = await indexContent(content);
      if (res.skipped) {
        skipped++;
        console.log(`${prefix} ⏭️  ${(content.title || content.source_video_id).slice(0, 50)}... (no transcript)`);
        continue;
      }
      indexed++;
      console.log(`${prefix} ✅ ${(content.title || content.source_video_id).slice(0, 50)}... (${res.chunkRowCount} chunks)`);
      
      // Rate limit: pause every 20 items
      if (indexed > 0 && indexed % 20 === 0) {
        console.log('   💤 Pausing briefly to avoid rate limits...');
        await new Promise(r => setTimeout(r, 2000));
      }
    } catch (err) {
      errors++;
      console.error(`${prefix} ❌ ${(content.title || content.source_video_id).slice(0, 50)}... — ${err?.message || err}`);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════════════');
  console.log('  Summary');
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log(`  New content indexed:     ${indexed}`);
  console.log(`  Already indexed:         ${alreadyIndexed}`);
  console.log(`  Skipped (no transcript): ${skipped}`);
  console.log(`  Errors:                  ${errors}`);
  console.log(`  Total processed:         ${contents?.length || 0}`);
  console.log('═══════════════════════════════════════════════════════════════════════');
}

main().catch((err) => {
  console.error('Fatal:', err?.message || err);
  process.exit(1);
});

