import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { 
  chunkText, 
  generateEmbedding as generateEmbeddingUtil, 
  toPgVectorLiteral, 
  getEmbeddingModel,
  isEmbeddingConfigured 
} from '@/lib/embeddingUtils';
import { requireAdmin } from '@/lib/adminAuth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const OPENAI_EMBEDDING_MODEL = getEmbeddingModel();

const supabase = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

/**
 * Wrapper for embedding generation that throws on error.
 * @param {string} text
 * @returns {Promise<number[]>}
 */
async function generateEmbedding(text) {
  const result = await generateEmbeddingUtil(text);
  if (result.error) throw new Error(result.error);
  return result.embedding;
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
    if (!isEmbeddingConfigured()) {
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


