/**
 * Shared Embedding Utilities
 * 
 * Consolidates text chunking and embedding generation logic used across:
 * - lib/knowledgeIndexService.js
 * - app/api/internal/knowledge/ingest/route.js
 * - scripts/indexEditorialReviews.mjs
 * - scripts/indexKnowledgeBase.mjs
 * - scripts/generate-embeddings.mjs
 * 
 * @module lib/embeddingUtils
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';

/**
 * Split text into overlapping chunks suitable for embedding.
 * @param {string} text - Raw text to chunk
 * @param {Object} options
 * @param {number} [options.maxChars=1200] - Maximum characters per chunk
 * @param {number} [options.overlapChars=150] - Overlap between consecutive chunks
 * @returns {string[]} Array of text chunks
 */
export function chunkText(text, { maxChars = 1200, overlapChars = 150 } = {}) {
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

/**
 * Generate embedding vector for text using OpenAI API.
 * @param {string} text - Text to embed
 * @returns {Promise<{embedding: number[]|null, model: string, error: string|null}>}
 */
export async function generateEmbedding(text) {
  if (!OPENAI_API_KEY) {
    return { 
      embedding: null, 
      model: OPENAI_EMBEDDING_MODEL, 
      error: 'OPENAI_API_KEY not configured' 
    };
  }

  if (!text || typeof text !== 'string') {
    return { 
      embedding: null, 
      model: OPENAI_EMBEDDING_MODEL, 
      error: 'Text is required' 
    };
  }

  try {
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
      return { 
        embedding: null, 
        model: OPENAI_EMBEDDING_MODEL, 
        error: err?.error?.message || `OpenAI embeddings failed (${res.status})` 
      };
    }

    const data = await res.json();
    const embedding = data?.data?.[0]?.embedding;
    
    if (!Array.isArray(embedding)) {
      return { 
        embedding: null, 
        model: OPENAI_EMBEDDING_MODEL, 
        error: 'OpenAI embeddings returned no vector' 
      };
    }

    return { embedding, model: OPENAI_EMBEDDING_MODEL, error: null };
  } catch (err) {
    return { 
      embedding: null, 
      model: OPENAI_EMBEDDING_MODEL, 
      error: err.message || 'Embedding generation failed' 
    };
  }
}

/**
 * Convert a JavaScript array vector to PostgreSQL vector literal format.
 * @param {number[]} vec - Embedding vector array
 * @returns {string|null} PostgreSQL vector literal (e.g., "[0.1,0.2,...]") or null
 */
export function toPgVectorLiteral(vec) {
  if (!Array.isArray(vec) || vec.length === 0) return null;
  return `[${vec.join(',')}]`;
}

/**
 * Get the current embedding model name.
 * @returns {string}
 */
export function getEmbeddingModel() {
  return OPENAI_EMBEDDING_MODEL;
}

/**
 * Check if OpenAI embedding API is configured.
 * @returns {boolean}
 */
export function isEmbeddingConfigured() {
  return Boolean(OPENAI_API_KEY);
}

export default {
  chunkText,
  generateEmbedding,
  toPgVectorLiteral,
  getEmbeddingModel,
  isEmbeddingConfigured,
};














