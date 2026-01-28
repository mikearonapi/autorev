/**
 * Cohere Reranking Service
 * 
 * Uses Cohere's rerank-v3.0 model to re-score search results based on
 * query relevance. This is a post-retrieval step that can significantly
 * improve result quality, especially for complex queries.
 * 
 * Benefits:
 * - Cross-encoder architecture (considers query-document interaction)
 * - Better semantic understanding than bi-encoder retrieval
 * - Language-aware relevance scoring
 * 
 * Usage:
 *   import { rerankDocuments, RERANK_CONFIG } from '@/lib/cohereRerank';
 *   
 *   const reranked = await rerankDocuments({
 *     query: "How do I install a turbo on a BMW M3?",
 *     documents: searchResults,
 *     topN: 5,
 *   });
 * 
 * @module lib/cohereRerank
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

const COHERE_API_KEY = process.env.COHERE_API_KEY;
const COHERE_API_URL = 'https://api.cohere.ai/v1/rerank';

/**
 * Reranking configuration
 */
export const RERANK_CONFIG = {
  // Model to use for reranking
  model: 'rerank-english-v3.0',
  
  // Minimum number of documents to trigger reranking
  minDocsForRerank: 3,
  
  // Maximum documents to send to reranker (API limit + cost control)
  maxDocsForRerank: 100,
  
  // Minimum relevance score to include in results (0-1)
  minRelevanceScore: 0.1,
  
  // Request timeout in ms
  timeoutMs: 10000,
};

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Check if Cohere reranking is configured
 * @returns {boolean}
 */
export function isRerankConfigured() {
  return Boolean(COHERE_API_KEY);
}

/**
 * Extract text content from a document for reranking
 * @param {Object} doc - Document object
 * @returns {string} Text to use for reranking
 */
function extractDocText(doc) {
  // Try different possible text fields
  if (doc.chunk_text) return doc.chunk_text;
  if (doc.excerpt) return doc.excerpt;
  if (doc.text) return doc.text;
  if (doc.content) return doc.content;
  if (doc.summary) return doc.summary;
  if (doc.details) return doc.details;
  
  // Fallback: combine multiple fields
  const parts = [doc.title, doc.summary, doc.details].filter(Boolean);
  return parts.join(' ').trim() || '';
}

// =============================================================================
// MAIN RERANKING FUNCTION
// =============================================================================

/**
 * Rerank documents using Cohere's rerank model
 * 
 * @param {Object} params
 * @param {string} params.query - Search query
 * @param {Array<Object>} params.documents - Documents to rerank
 * @param {number} [params.topN] - Number of results to return (default: all)
 * @param {string} [params.textField] - Field name containing document text
 * @param {boolean} [params.returnScores=true] - Include relevance scores
 * @returns {Promise<{success: boolean, results?: Array, error?: string, reranked: boolean}>}
 */
export async function rerankDocuments({
  query,
  documents,
  topN,
  textField,
  returnScores = true,
}) {
  // Validation
  if (!query || typeof query !== 'string') {
    return { success: false, error: 'Query is required', reranked: false };
  }
  
  if (!Array.isArray(documents) || documents.length === 0) {
    return { success: true, results: [], reranked: false };
  }
  
  // If not enough documents or not configured, return as-is
  if (!isRerankConfigured()) {
    console.warn('[Cohere Rerank] COHERE_API_KEY not configured, skipping reranking');
    return {
      success: true,
      results: documents.slice(0, topN || documents.length),
      reranked: false,
    };
  }
  
  if (documents.length < RERANK_CONFIG.minDocsForRerank) {
    return {
      success: true,
      results: documents,
      reranked: false,
      reason: 'Not enough documents to rerank',
    };
  }
  
  // Prepare documents for reranking
  const docsToRerank = documents.slice(0, RERANK_CONFIG.maxDocsForRerank);
  const texts = docsToRerank.map(doc => {
    if (textField && doc[textField]) return doc[textField];
    return extractDocText(doc);
  }).filter(t => t.length > 0);
  
  if (texts.length === 0) {
    return { success: false, error: 'No text content found in documents', reranked: false };
  }
  
  try {
    // Call Cohere rerank API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), RERANK_CONFIG.timeoutMs);
    
    const response = await fetch(COHERE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COHERE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: RERANK_CONFIG.model,
        query,
        documents: texts,
        top_n: topN || texts.length,
        return_documents: false, // We'll map back ourselves
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Cohere Rerank] API error:', response.status, errorText);
      
      // Fall back to original order on API error
      return {
        success: true,
        results: documents.slice(0, topN || documents.length),
        reranked: false,
        error: `Cohere API error: ${response.status}`,
      };
    }
    
    const data = await response.json();
    
    // Map results back to original documents
    const rerankedResults = data.results
      .filter(r => r.relevance_score >= RERANK_CONFIG.minRelevanceScore)
      .map(result => {
        const originalDoc = docsToRerank[result.index];
        return {
          ...originalDoc,
          ...(returnScores && {
            relevanceScore: result.relevance_score,
            originalRank: result.index + 1,
          }),
        };
      });
    
    return {
      success: true,
      results: rerankedResults,
      reranked: true,
      model: RERANK_CONFIG.model,
      inputCount: texts.length,
      outputCount: rerankedResults.length,
    };
    
  } catch (error) {
    console.error('[Cohere Rerank] Error:', error);
    
    // On error, fall back to original order
    return {
      success: true,
      results: documents.slice(0, topN || documents.length),
      reranked: false,
      error: error.message,
    };
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Rerank AL search results specifically
 * Handles the AL tools result format
 * 
 * @param {string} query - User's query
 * @param {Array} results - Results from searchKnowledge or similar
 * @param {number} [topN=5] - Number of results to return
 * @returns {Promise<{results: Array, reranked: boolean}>}
 */
export async function rerankALResults(query, results, topN = 5) {
  if (!results || results.length === 0) {
    return { results: [], reranked: false };
  }
  
  const reranked = await rerankDocuments({
    query,
    documents: results,
    topN,
    textField: 'excerpt', // AL results use 'excerpt' field
    returnScores: true,
  });
  
  return {
    results: reranked.results || results,
    reranked: reranked.reranked,
  };
}

/**
 * Rerank community insights
 * 
 * @param {string} query - User's query
 * @param {Array} insights - Results from searchCommunityInsights
 * @param {number} [topN=5] - Number of results to return
 * @returns {Promise<{results: Array, reranked: boolean}>}
 */
export async function rerankCommunityInsights(query, insights, topN = 5) {
  if (!insights || insights.length === 0) {
    return { results: [], reranked: false };
  }
  
  // Community insights have different structure
  const docsWithText = insights.map(insight => ({
    ...insight,
    _rerankText: [insight.title, insight.summary, insight.details]
      .filter(Boolean)
      .join(' '),
  }));
  
  const reranked = await rerankDocuments({
    query,
    documents: docsWithText,
    topN,
    textField: '_rerankText',
    returnScores: true,
  });
  
  // Clean up temp field
  const results = (reranked.results || insights).map(r => {
    const { _rerankText, ...rest } = r;
    return rest;
  });
  
  return {
    results,
    reranked: reranked.reranked,
  };
}

const cohereRerank = {
  rerankDocuments,
  rerankALResults,
  rerankCommunityInsights,
  isRerankConfigured,
  RERANK_CONFIG,
};

export default cohereRerank;
