/**
 * Reciprocal Rank Fusion (RRF) Reranking Utility
 * 
 * RRF is a technique for combining multiple ranking signals into a unified score.
 * It's commonly used in hybrid search to merge vector similarity results with
 * keyword/BM25 results without requiring score normalization.
 * 
 * Formula: RRF(d) = Σ (1 / (k + rank_i(d)))
 * Where:
 *   - d is a document
 *   - k is a constant (typically 60) that mitigates the impact of high rankings
 *   - rank_i(d) is the rank of document d in the i-th ranking list
 * 
 * Benefits:
 * - No need to normalize different scoring systems
 * - Documents that rank well in multiple lists get boosted
 * - Robust to outliers in individual ranking lists
 * 
 * Usage:
 *   import { reciprocalRankFusion, hybridSearch } from '@/lib/rrfRerank';
 *   
 *   const fused = reciprocalRankFusion([
 *     vectorResults.map(r => ({ id: r.chunk_id, ...r })),
 *     keywordResults.map(r => ({ id: r.chunk_id, ...r })),
 *   ]);
 * 
 * @module lib/rrfRerank
 */

/**
 * Reciprocal Rank Fusion - combines multiple ranking signals
 * 
 * @param {Array<Array<{id: string, [key: string]: any}>>} rankedLists - Multiple ranked result lists
 * @param {number} k - Ranking constant (default 60, higher values give more weight to lower ranks)
 * @returns {Array<{id: string, rrfScore: number, ranks: Object}>} Fused results sorted by RRF score
 */
export function reciprocalRankFusion(rankedLists, k = 60) {
  if (!rankedLists || rankedLists.length === 0) {
    return [];
  }

  // Map to accumulate RRF scores and track ranks
  const scores = new Map();
  const ranks = new Map();

  for (let listIndex = 0; listIndex < rankedLists.length; listIndex++) {
    const list = rankedLists[listIndex];
    if (!Array.isArray(list)) continue;

    list.forEach((item, rank) => {
      if (!item?.id) return;
      
      const id = item.id;
      const currentScore = scores.get(id) || 0;
      const currentRanks = ranks.get(id) || {};
      
      // RRF formula: 1 / (k + rank + 1)
      // rank is 0-indexed, so we add 1 to make it 1-indexed
      scores.set(id, currentScore + (1 / (k + rank + 1)));
      ranks.set(id, { ...currentRanks, [`list_${listIndex}`]: rank + 1 });
    });
  }

  // Convert to array and sort by RRF score
  return Array.from(scores.entries())
    .map(([id, rrfScore]) => ({
      id,
      rrfScore,
      ranks: ranks.get(id),
    }))
    .sort((a, b) => b.rrfScore - a.rrfScore);
}

/**
 * Merge RRF results with original document data
 * 
 * @param {Array<{id: string, rrfScore: number}>} rrfResults - RRF fusion results
 * @param {Map<string, Object>|Object} idToDocument - Map or object mapping IDs to full documents
 * @param {number} limit - Maximum results to return
 * @returns {Array<Object>} Documents sorted by RRF score with rrfScore attached
 */
export function mergeRRFWithDocuments(rrfResults, idToDocument, limit = 10) {
  const docMap = idToDocument instanceof Map 
    ? idToDocument 
    : new Map(Object.entries(idToDocument));

  return rrfResults
    .slice(0, limit)
    .map(({ id, rrfScore, ranks }) => {
      const doc = docMap.get(id);
      if (!doc) return null;
      return {
        ...doc,
        rrfScore,
        rrfRanks: ranks,
      };
    })
    .filter(Boolean);
}

/**
 * Deduplicate results by ID, keeping the first occurrence
 * Useful before RRF when lists might have duplicates
 * 
 * @param {Array<{id: string}>} results - Results with ID field
 * @returns {Array} Deduplicated results
 */
export function deduplicateById(results) {
  if (!Array.isArray(results)) return [];
  
  const seen = new Set();
  return results.filter(item => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

/**
 * Helper to run hybrid search and fuse results
 * This is a convenience function that combines common patterns
 * 
 * @param {Object} options - Search options
 * @param {Function} options.vectorSearch - Async function that returns vector search results
 * @param {Function} options.keywordSearch - Async function that returns keyword search results
 * @param {string} options.idField - Field name for document ID (default 'chunk_id')
 * @param {number} options.limit - Final result limit
 * @param {number} options.overfetch - Multiplier for initial fetch (default 3x limit)
 * @returns {Promise<Array>} Fused and ranked results
 */
export async function hybridSearchWithRRF({
  vectorSearch,
  keywordSearch,
  idField = 'chunk_id',
  limit = 6,
  overfetch = 3,
}) {
  // Run both searches in parallel
  const [vectorResults, keywordResults] = await Promise.all([
    vectorSearch(limit * overfetch),
    keywordSearch(limit * overfetch),
  ]);

  // Build ID mapping for document lookup
  const idToDoc = new Map();
  
  const normalizeResult = (r) => {
    const id = r[idField] || r.id;
    if (id && !idToDoc.has(id)) {
      idToDoc.set(id, { ...r, id });
    }
    return { id, ...r };
  };

  const vectorList = (vectorResults || []).map(normalizeResult);
  const keywordList = (keywordResults || []).map(normalizeResult);

  // Fuse rankings
  const rrfResults = reciprocalRankFusion([vectorList, keywordList]);

  // Merge with full documents
  return mergeRRFWithDocuments(rrfResults, idToDoc, limit);
}

/**
 * Weighted RRF - allows different weights for different ranking lists
 * 
 * @param {Array<{list: Array, weight: number}>} weightedLists - Lists with weights
 * @param {number} k - Ranking constant
 * @returns {Array<{id: string, rrfScore: number}>}
 */
export function weightedReciprocalRankFusion(weightedLists, k = 60) {
  const scores = new Map();

  for (const { list, weight = 1 } of weightedLists) {
    if (!Array.isArray(list)) continue;

    list.forEach((item, rank) => {
      if (!item?.id) return;
      
      const id = item.id;
      const currentScore = scores.get(id) || 0;
      // Apply weight to the RRF contribution
      scores.set(id, currentScore + (weight * (1 / (k + rank + 1))));
    });
  }

  return Array.from(scores.entries())
    .map(([id, rrfScore]) => ({ id, rrfScore }))
    .sort((a, b) => b.rrfScore - a.rrfScore);
}

const rrfRerank = {
  reciprocalRankFusion,
  mergeRRFWithDocuments,
  deduplicateById,
  hybridSearchWithRRF,
  weightedReciprocalRankFusion,
};

export default rrfRerank;
