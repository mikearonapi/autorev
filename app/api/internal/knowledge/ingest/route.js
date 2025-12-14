import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const INTERNAL_ADMIN_KEY = process.env.INTERNAL_ADMIN_KEY;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small'; // 1536 dims

const supabase = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

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

async function generateEmbedding(text) {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_EMBEDDING_MODEL,
      input: String(text || '').slice(0, 8000),
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

function requireAdmin(request) {
  if (!INTERNAL_ADMIN_KEY) {
    return { ok: false, error: 'INTERNAL_ADMIN_KEY not configured' };
  }
  const provided = request.headers.get('x-internal-admin-key');
  if (!provided || provided !== INTERNAL_ADMIN_KEY) {
    return { ok: false, error: 'Unauthorized' };
  }
  return { ok: true };
}

/**
 * POST /api/internal/knowledge/ingest
 *
 * Body:
 * - sourceType: string (e.g. "editorial_review", "forum_post", "whitepaper")
 * - sourceUrl: string (optional but recommended for citation)
 * - sourceTitle: string (optional)
 * - carSlug: string (optional)
 * - topic: string (optional)
 * - text: string (required) raw textual content to index
 * - metadata: object (optional)
 */
export async function POST(request) {
  try {
    const auth = requireAdmin(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === 'Unauthorized' ? 401 : 500 });
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }
    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 503 });
    }

    const body = await request.json();
    const {
      sourceType,
      sourceUrl,
      sourceTitle,
      carSlug,
      topic,
      text,
      metadata,
    } = body || {};

    if (!sourceType || typeof sourceType !== 'string') {
      return NextResponse.json({ error: 'sourceType is required' }, { status: 400 });
    }
    if (!text || typeof text !== 'string' || text.trim().length < 200) {
      return NextResponse.json({ error: 'text is required (min 200 chars)' }, { status: 400 });
    }

    let carId = null;
    if (carSlug) {
      const { data: carRow } = await supabase
        .from('cars')
        .select('id')
        .eq('slug', carSlug)
        .maybeSingle();
      carId = carRow?.id || null;
    }

    const checksumInput = JSON.stringify({
      sourceType,
      sourceUrl: sourceUrl || null,
      sourceTitle: sourceTitle || null,
      carSlug: carSlug || null,
      topic: topic || null,
      textHash: crypto.createHash('sha256').update(text).digest('hex'),
    });
    const checksum = crypto.createHash('sha256').update(checksumInput).digest('hex');

    // Upsert source_document by checksum (manual get-or-create)
    const { data: existingDoc } = await supabase
      .from('source_documents')
      .select('id')
      .eq('checksum', checksum)
      .maybeSingle();

    let documentId = existingDoc?.id || null;
    if (!documentId) {
      const { data: inserted, error: insErr } = await supabase
        .from('source_documents')
        .insert({
          source_type: sourceType,
          source_url: sourceUrl || null,
          source_title: sourceTitle || null,
          retrieved_at: new Date().toISOString(),
          checksum,
          raw_text: text,
          raw_json: null,
          metadata: {
            ...(metadata || {}),
            car_slug: carSlug || null,
            car_id: carId,
            topic: topic || null,
            ingested_by: 'internal_knowledge_ingest',
          },
        })
        .select('id')
        .single();
      if (insErr) throw insErr;
      documentId = inserted.id;
    } else {
      // Refresh raw_text/metadata if document already exists
      await supabase
        .from('source_documents')
        .update({
          raw_text: text,
          metadata: {
            ...(metadata || {}),
            car_slug: carSlug || null,
            car_id: carId,
            topic: topic || null,
            ingested_by: 'internal_knowledge_ingest',
          },
        })
        .eq('id', documentId);
    }

    // Re-index deterministically
    await supabase.from('document_chunks').delete().eq('document_id', documentId);

    const chunks = chunkText(text, { maxChars: 1200, overlapChars: 150 });
    let insertedChunks = 0;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await generateEmbedding(chunk);
      const pgVec = toPgVectorLiteral(embedding);

      const { error } = await supabase
        .from('document_chunks')
        .insert({
          document_id: documentId,
          car_id: carId,
          car_slug: carSlug || null,
          chunk_index: i,
          chunk_text: chunk,
          chunk_tokens: Math.ceil(chunk.length / 4),
          topic: topic || sourceType,
          embedding_model: OPENAI_EMBEDDING_MODEL,
          embedding: pgVec,
          metadata: {
            source_type: sourceType,
            source_url: sourceUrl || null,
            source_title: sourceTitle || null,
          },
        });
      if (error) throw error;
      insertedChunks++;
    }

    return NextResponse.json({
      success: true,
      documentId,
      chunks: insertedChunks,
      checksum,
    });
  } catch (err) {
    console.error('[internal/knowledge/ingest] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

