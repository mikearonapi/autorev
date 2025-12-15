/**
 * Index `car_expert_reviews` into `source_documents` + `document_chunks` with embeddings.
 *
 * This gives AL citeable editorial sources (Car and Driver, MotorTrend, etc.)
 * through the existing `search_knowledge` tool (pgvector search).
 *
 * Env (.env.local):
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - OPENAI_API_KEY
 * - (optional) OPENAI_EMBEDDING_MODEL (default: text-embedding-3-small)
 *
 * Run:
 *   node scripts/indexEditorialReviews.mjs
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small'; // 1536 dims

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

function buildReviewText(r) {
  const lines = [];
  lines.push(`Title: ${r.title || 'Expert review'}`);
  lines.push(`Source: ${r.source}`);
  if (r.review_date) lines.push(`Date: ${r.review_date}`);
  if (r.source_url) lines.push(`URL: ${r.source_url}`);
  if (r.overall_rating) lines.push(`Rating: ${r.overall_rating}/10`);

  const metrics = [];
  if (r.zero_to_sixty) metrics.push(`0-60: ${r.zero_to_sixty}s`);
  if (r.quarter_mile) metrics.push(`1/4: ${r.quarter_mile}s`);
  if (r.quarter_mile_speed) metrics.push(`Trap: ${r.quarter_mile_speed} mph`);
  if (r.braking_70_to_0) metrics.push(`70-0: ${r.braking_70_to_0} ft`);
  if (r.skidpad_g) metrics.push(`Skidpad: ${r.skidpad_g} g`);
  if (metrics.length) lines.push(`Instrumented: ${metrics.join(' | ')}`);

  if (Array.isArray(r.pros) && r.pros.length) lines.push(`Pros: ${r.pros.join(' | ')}`);
  if (Array.isArray(r.cons) && r.cons.length) lines.push(`Cons: ${r.cons.join(' | ')}`);
  if (r.verdict) lines.push(`Verdict: ${r.verdict}`);

  return lines.join('\n');
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
      source_type: 'editorial_review',
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

async function indexReview(r) {
  const url = r.source_url;
  const urlHash = crypto.createHash('sha256').update(String(url || r.id)).digest('hex').slice(0, 16);
  const checksum = `expert_review:${r.source}:${r.car_slug}:${urlHash}`;

  const rawText = buildReviewText(r);
  const docId = await getOrCreateSourceDocument({
    checksum,
    sourceUrl: url,
    sourceTitle: r.title || `${r.source} review`,
    rawText,
    rawJson: {
      ...r,
      // avoid huge payloads
      pros: r.pros || null,
      cons: r.cons || null,
    },
    metadata: {
      car_slug: r.car_slug,
      car_id: r.car_id,
      source: r.source,
      review_type: r.review_type,
    },
  });

  // deterministic re-index
  const del = await supabase.from('document_chunks').delete().eq('document_id', docId);
  if (del.error) throw del.error;

  const chunks = chunkText(rawText, { maxChars: 1200, overlapChars: 150 });
  let chunkCount = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = await generateEmbedding(chunk);
    const pgVec = toPgVectorLiteral(embedding);

    const { error } = await supabase.from('document_chunks').insert({
      document_id: docId,
      car_id: r.car_id,
      car_slug: r.car_slug,
      chunk_index: i,
      chunk_text: chunk,
      chunk_tokens: Math.ceil(chunk.length / 4),
      topic: 'editorial_review',
      embedding_model: OPENAI_EMBEDDING_MODEL,
      embedding: pgVec,
      metadata: {
        source: r.source,
        source_url: url,
        review_type: r.review_type,
      },
    });
    if (error) throw error;
    chunkCount++;
  }

  return chunkCount;
}

async function main() {
  const { data: reviews, error } = await supabase
    .from('car_expert_reviews')
    .select('*')
    .order('fetched_at', { ascending: false })
    .limit(25);
  if (error) throw error;

  if (!reviews || reviews.length === 0) {
    console.log('No car_expert_reviews found. Run scripts/enrichEditorialReviewsPilot.mjs first.');
    return;
  }

  let indexed = 0;
  for (const r of reviews) {
    try {
      const chunks = await indexReview(r);
      indexed++;
      console.log(`✅ Indexed: ${r.car_slug} ${r.source} (${chunks} chunks)`);
    } catch (e) {
      console.error(`❌ Failed: ${r.car_slug} ${r.source} - ${e?.message || e}`);
    }
  }

  console.log(`Done. Indexed ${indexed}/${reviews.length} reviews.`);
}

main().catch((err) => {
  console.error('Fatal:', err?.message || err);
  process.exit(1);
});


