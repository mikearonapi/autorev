/**
 * AL Tools Service
 *
 * Implements all the tool functions that AL can call via Claude's tool use.
 * These functions provide AL with access to:
 * - Car database (search, details, comparisons)
 * - Expert reviews (YouTube content)
 * - Encyclopedia (mods, systems, guides)
 * - Known issues database
 * - Maintenance specifications
 * - Forum/web search
 */

import { upgradeDetails, upgradeCategories } from '@/data/upgradeEducation';
import { fetchCars, fetchCarBySlug } from '@/lib/carsClient';

import { getCached, hashCacheKey, setCached, stableStringify } from './alToolCache';
import { resolveCarId, getSlugFromCarId } from './carResolver';
import { rerankDocuments, isRerankConfigured } from './cohereRerank';
import {
  searchEncyclopedia,
  getModificationArticle,
  getBuildGuideArticle,
  getTopicsForUpgrade,
} from './encyclopediaData';
import { calculateSmartHpGain, estimateZeroToSixty } from './performanceCalculator';
import { reciprocalRankFusion, mergeRRFWithDocuments } from './rrfRerank';
import { supabase, supabaseServiceRole, isSupabaseConfigured } from './supabase';
import { fetchVideosForCar, calculateCarConsensus } from './youtubeClient';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small'; // 1536 dims

function getDbClient({ requireServiceRole = false } = {}) {
  // For server-side AL tool execution, prefer service role for:
  // - RLS-bypassed reads (faster / fewer failures)
  // - access to service-only tables and SECURITY DEFINER functions
  if (requireServiceRole) return supabaseServiceRole || supabase;
  return supabaseServiceRole || supabase;
}

function vectorToPgVectorLiteral(vector) {
  if (!Array.isArray(vector) || vector.length === 0) return null;
  return `[${vector.join(',')}]`;
}

// Embedding cache TTL: 30 minutes (embeddings are expensive and stable for identical queries)
const EMBEDDING_CACHE_TTL_MS = 30 * 60 * 1000;

async function generateQueryEmbedding(queryText) {
  if (!OPENAI_API_KEY) {
    return { error: 'OPENAI_API_KEY not configured on server', embedding: null, model: null };
  }
  if (!queryText || typeof queryText !== 'string') {
    return { error: 'Query text is required', embedding: null, model: null };
  }

  // Normalize and create cache key
  const normalizedQuery = queryText.toLowerCase().trim().slice(0, 8000);
  const cacheKey = `embed:${hashCacheKey(normalizedQuery)}`;

  // Check cache first
  const cached = getCached(cacheKey);
  if (cached.hit && cached.value?.embedding) {
    return { ...cached.value, fromCache: true };
  }

  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_EMBEDDING_MODEL,
      input: normalizedQuery,
    }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    return {
      error: error?.error?.message || `Embedding request failed (${res.status})`,
      embedding: null,
      model: OPENAI_EMBEDDING_MODEL,
    };
  }

  const data = await res.json();
  const embedding = data?.data?.[0]?.embedding;
  if (!Array.isArray(embedding)) {
    return {
      error: 'Embedding response missing embedding vector',
      embedding: null,
      model: OPENAI_EMBEDDING_MODEL,
    };
  }

  const result = { error: null, embedding, model: OPENAI_EMBEDDING_MODEL };

  // Cache successful embeddings
  setCached(cacheKey, result, EMBEDDING_CACHE_TTL_MS);

  return result;
}

// =============================================================================
// CAR SEARCH & DATABASE
// =============================================================================

/**
 * Search cars by various criteria
 * @param {Object} params - Search parameters
 * @returns {Object} Search results with matching cars
 */
export async function searchCars({ query, filters = {}, sort_by = 'value', limit = 5 }) {
  // Prefer DB full-text search when available (faster + richer + consistent with production truth)
  //
  // NOTE: Database has two search_cars_fts overloads:
  // - (text) → SETOF cars (legacy)
  // - (text, integer) → TABLE with rank (used here via max_results param)
  if (isSupabaseConfigured && supabase && query) {
    try {
      const { data: ftsResults, error: ftsError } = await supabase.rpc('search_cars_fts', {
        search_query: query,
        max_results: Math.max(limit * 5, 25),
      });

      if (!ftsError && Array.isArray(ftsResults) && ftsResults.length > 0) {
        let cars = ftsResults.map((r) => ({
          name: r.name,
          slug: r.slug,
          year: r.year,
          hp: r.hp,
          engineType: r.engine_type,
          msrp: r.msrp,
          category: r.category,
          driveType: r.drive_type,
          highlight: r.highlight,
          scores: {},
        }));

        // Apply the subset of filters we can safely evaluate from this payload
        if (filters.hp_min) cars = cars.filter((c) => (c.hp || 0) >= filters.hp_min);
        if (filters.hp_max) cars = cars.filter((c) => (c.hp || 0) <= filters.hp_max);
        if (filters.category) cars = cars.filter((c) => c.category === filters.category);

        // Sort (best-effort; FTS rank already orders by relevance)
        const sortFunctions = {
          hp: (a, b) => (b.hp || 0) - (a.hp || 0),
        };
        if (sortFunctions[sort_by]) cars.sort(sortFunctions[sort_by]);

        cars = cars.slice(0, limit);

        return {
          count: cars.length,
          cars,
          source: 'db_fts',
        };
      }
    } catch (err) {
      console.warn('[AL Tools] search_cars_fts failed, falling back to carsClient:', err);
    }
  }

  // Fallback to carsClient (fetches from DB with local fallback)
  const allCars = await fetchCars();
  let results = [...allCars];

  // Apply filters
  if (filters.budget_min) {
    results = results.filter((c) => (c.msrp || 0) >= filters.budget_min);
  }
  if (filters.budget_max) {
    results = results.filter((c) => (c.msrp || 0) <= filters.budget_max);
  }
  if (filters.hp_min) {
    results = results.filter((c) => (c.hp || 0) >= filters.hp_min);
  }
  if (filters.hp_max) {
    results = results.filter((c) => (c.hp || 0) <= filters.hp_max);
  }
  if (filters.category) {
    results = results.filter((c) => c.category === filters.category);
  }
  if (filters.drivetrain) {
    results = results.filter((c) => c.driveType === filters.drivetrain);
  }
  if (filters.tier) {
    results = results.filter((c) => c.tier === filters.tier);
  }
  if (filters.brand) {
    const brandLower = filters.brand.toLowerCase();
    results = results.filter(
      (c) =>
        c.make?.toLowerCase().includes(brandLower) || c.name?.toLowerCase().includes(brandLower)
    );
  }
  if (filters.manual_available !== undefined) {
    results = results.filter((c) => c.manualAvailable === filters.manual_available);
  }

  // Text search on query
  if (query) {
    const queryLower = query.toLowerCase();
    const queryTerms = queryLower.split(/\s+/);

    results = results.filter((car) => {
      const searchText = [
        car.name,
        car.make,
        car.category,
        car.engineType,
        car.notes,
        car.highlight,
        car.tagline,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return queryTerms.some((term) => searchText.includes(term));
    });
  }

  // Sort results
  const sortFunctions = {
    hp: (a, b) => (b.hp || 0) - (a.hp || 0),
    price: (a, b) => (a.msrp || 0) - (b.msrp || 0),
    value: (a, b) => (b.value || b.score_value || 5) - (a.value || a.score_value || 5),
    track: (a, b) => (b.track || b.score_track || 5) - (a.track || a.score_track || 5),
    reliability: (a, b) =>
      (b.reliability || b.score_reliability || 5) - (a.reliability || a.score_reliability || 5),
    sound: (a, b) => (b.sound || b.score_sound || 5) - (a.sound || a.score_sound || 5),
  };

  if (sortFunctions[sort_by]) {
    results.sort(sortFunctions[sort_by]);
  }

  // Limit results
  results = results.slice(0, limit);

  // Format for AL
  return {
    count: results.length,
    cars: results.map((car) => ({
      name: car.name,
      slug: car.slug,
      year: car.year,
      hp: car.hp,
      engineType: car.engineType,
      msrp: car.msrp,
      category: car.category,
      driveType: car.driveType,
      highlight: car.highlight,
      scores: {
        sound: car.sound || car.score_sound,
        track: car.track || car.score_track,
        reliability: car.reliability || car.score_reliability,
        value: car.value || car.score_value,
        driverFun: car.driverFun || car.score_driver_fun,
      },
    })),
  };
}

/**
 * Get AI-optimized car context (single DB call).
 * Uses get_car_ai_context_v2 which resolves slug→id once for efficient queries.
 * @param {Object} params
 * @returns {Object}
 */
export async function getCarAIContext({ car_slug, include = null }) {
  const client = getDbClient({ requireServiceRole: true });
  if (!isSupabaseConfigured || !client) {
    return { error: 'Supabase not configured', car_slug };
  }
  if (!car_slug) {
    return { error: 'car_slug is required' };
  }

  try {
    // Use optimized v2 RPC that uses car_id exclusively after slug resolution
    // Falls back to v1 if v2 doesn't exist yet (deployment in progress)
    let data, error;
    const v2Result = await client.rpc('get_car_ai_context_v2', { p_car_slug: car_slug });
    if (v2Result.error?.code === '42883') {
      // Function doesn't exist yet, fall back to v1
      const v1Result = await client.rpc('get_car_ai_context', { p_car_slug: car_slug });
      data = v1Result.data;
      error = v1Result.error;
    } else {
      data = v2Result.data;
      error = v2Result.error;
    }
    if (error) throw error;

    const payload = data || {};
    const requested = Array.isArray(include) ? new Set(include) : null;

    // Compact/pruned response by default to keep AL fast.
    const car = payload.car || {};

    const compact = {
      car: {
        id: car.id,
        slug: car.slug,
        name: car.name,
        year: car.year,
        make: car.make,
        tier: car.tier,
        category: car.category,
        engineType: car.engine_type,
        hp: car.hp,
        torque: car.torque,
        transmission: car.transmission,
        driveType: car.drive_type,
        curb_weight: car.curb_weight,
        zero_to_sixty: car.zero_to_sixty,
        msrp: car.msrp,
        // Scores (core)
        score_sound: car.score_sound,
        score_interior: car.score_interior,
        score_track: car.score_track,
        score_reliability: car.score_reliability,
        score_value: car.score_value,
        score_driver_fun: car.score_driver_fun,
        score_aftermarket: car.score_aftermarket,
        // Enrichment rollups
        expert_review_count: car.expert_review_count,
        expert_consensus_summary: car.expert_consensus_summary,
        external_consensus: car.external_consensus,
        // DEPRECATED: upgrade_recommendations removed - use get_car_tuning_context for tuning data from car_tuning_profiles
      },
      safety: payload.safety || null,
      marketPricing: payload.marketPricing || null,
      fuelEconomy: payload.fuelEconomy || null,
      issuesCount: payload.issuesCount ?? null,
      maintenanceSummary: payload.maintenanceSummary || null,
      youtube: payload.youtube || null,
      priceHistorySample: payload.priceHistorySample || [],
      recallsSample: payload.recallsSample || [],
    };

    if (!requested) return compact;

    // If include[] provided, return only selected sections.
    const filtered = {};
    if (requested.has('car')) filtered.car = compact.car;
    if (requested.has('fuel')) filtered.fuelEconomy = compact.fuelEconomy;
    if (requested.has('safety')) filtered.safety = compact.safety;
    if (requested.has('pricing')) filtered.marketPricing = compact.marketPricing;
    if (requested.has('price_history')) filtered.priceHistorySample = compact.priceHistorySample;
    if (requested.has('recalls')) filtered.recallsSample = compact.recallsSample;
    if (requested.has('issues')) filtered.issuesCount = compact.issuesCount;
    if (requested.has('maintenance')) filtered.maintenanceSummary = compact.maintenanceSummary;
    if (requested.has('youtube')) filtered.youtube = compact.youtube;
    filtered.car_id = car_id;

    return filtered;
  } catch (err) {
    console.error('[AL Tools] Error fetching get_car_ai_context:', err);
    return { error: err.message || 'Failed to fetch car AI context', car_id };
  }
}

/**
 * Search proprietary knowledge base with citations (document_chunks).
 *
 * Uses HYBRID SEARCH combining:
 * - Vector similarity search (semantic understanding)
 * - Keyword/BM25 search (exact term matching)
 * - Reciprocal Rank Fusion (RRF) to merge results
 *
 * This typically improves precision by 10-20% over vector-only search.
 *
 * @param {Object} params
 * @param {string} params.query - Search query (required)
 * @param {string} [params.car_id] - Optional car UUID to filter results
 * @param {string} [params.topic] - Optional topic filter
 * @param {number} [params.limit] - Max results (default 6)
 * @returns {Object}
 */
export async function searchKnowledge({ query, car_id = null, topic = null, limit = 6 }) {
  const client = getDbClient({ requireServiceRole: true });
  if (!isSupabaseConfigured || !client) {
    return { error: 'Supabase not configured' };
  }
  if (!query) return { error: 'query is required' };

  try {
    // car_id is already a UUID, use directly
    const carId = car_id || null;
    const safeLimit = Math.max(1, Math.min(Number(limit) || 6, 12));

    // Over-fetch for RRF fusion (get more candidates to rank)
    const overfetchLimit = Math.min(safeLimit * 3, 25);

    // Generate embedding for vector search
    const { embedding, error: embedErr, model } = await generateQueryEmbedding(query);

    // If embeddings unavailable, fall back to keyword-only search
    if (embedErr) {
      console.warn(
        '[AL Tools] searchKnowledge: Embedding failed, using keyword-only search:',
        embedErr
      );

      const { data: keywordMatches, error: kwErr } = await client.rpc(
        'search_document_chunks_keyword',
        {
          p_query: query,
          p_car_id: carId,
          p_topic: topic || null,
          p_limit: safeLimit,
        }
      );

      if (kwErr) throw kwErr;

      const results = Array.isArray(keywordMatches) ? keywordMatches : [];

      return {
        query,
        car_id,
        searchMethod: 'keyword_only',
        count: results.length,
        results: results.map((r) => ({
          relevance: r.rank,
          topic: r.topic,
          excerpt: r.chunk_text,
          headline: r.headline,
          source: {
            type: r.source_type,
            url: r.source_url,
          },
        })),
        instruction: 'Use these excerpts as evidence. If you cite a claim, include the source URL.',
      };
    }

    const pgVec = vectorToPgVectorLiteral(embedding);
    if (!pgVec) return { error: 'Failed to format embedding vector' };

    // Run both searches in parallel for speed
    const [vectorResult, keywordResult] = await Promise.all([
      // Vector similarity search
      client.rpc('search_document_chunks', {
        p_embedding: pgVec,
        p_car_id: carId,
        p_limit: overfetchLimit,
      }),
      // Keyword/BM25 search
      client.rpc('search_document_chunks_keyword', {
        p_query: query,
        p_car_id: carId,
        p_topic: topic || null,
        p_limit: overfetchLimit,
      }),
    ]);

    if (vectorResult.error) {
      console.warn('[AL Tools] searchKnowledge: Vector search failed:', vectorResult.error);
    }
    if (keywordResult.error) {
      console.warn('[AL Tools] searchKnowledge: Keyword search failed:', keywordResult.error);
    }

    const vectorMatches = Array.isArray(vectorResult.data) ? vectorResult.data : [];
    const keywordMatches = Array.isArray(keywordResult.data) ? keywordResult.data : [];

    // If only one search worked, use its results
    if (vectorMatches.length === 0 && keywordMatches.length === 0) {
      return {
        query,
        car_id,
        searchMethod: 'hybrid',
        count: 0,
        results: [],
        instruction:
          'No matching documents found. Try rephrasing the query or using different terms.',
      };
    }

    if (vectorMatches.length === 0) {
      // Use keyword results only
      let results = keywordMatches;
      if (topic) {
        const topicLower = String(topic).toLowerCase();
        results = results.filter((r) => (r.topic || '').toLowerCase().includes(topicLower));
      }
      return formatKnowledgeResults(
        query,
        car_id,
        results.slice(0, safeLimit),
        'keyword_only',
        null
      );
    }

    if (keywordMatches.length === 0) {
      // Use vector results only
      let results = vectorMatches;
      if (topic) {
        const topicLower = String(topic).toLowerCase();
        results = results.filter((r) => (r.topic || '').toLowerCase().includes(topicLower));
      }
      return formatKnowledgeResults(
        query,
        car_id,
        results.slice(0, safeLimit),
        'vector_only',
        model
      );
    }

    // Build ID-to-document maps for RRF merge
    const idToDoc = new Map();

    vectorMatches.forEach((r) => {
      const id = r.chunk_id;
      if (id && !idToDoc.has(id)) {
        idToDoc.set(id, {
          ...r,
          id,
          vectorSimilarity: r.similarity,
        });
      }
    });

    keywordMatches.forEach((r) => {
      const id = r.chunk_id;
      if (idToDoc.has(id)) {
        // Merge keyword rank into existing doc
        idToDoc.get(id).keywordRank = r.rank;
        idToDoc.get(id).headline = r.headline;
      } else {
        idToDoc.set(id, {
          ...r,
          id,
          keywordRank: r.rank,
        });
      }
    });

    // Prepare ranked lists for RRF (using chunk_id as the id field)
    const vectorList = vectorMatches.map((r) => ({ id: r.chunk_id, ...r }));
    const keywordList = keywordMatches.map((r) => ({ id: r.chunk_id, ...r }));

    // Apply Reciprocal Rank Fusion
    const rrfResults = reciprocalRankFusion([vectorList, keywordList], 60);

    // Merge RRF scores with full documents
    let fusedResults = mergeRRFWithDocuments(rrfResults, idToDoc, safeLimit * 2);

    // Apply topic filter if specified
    if (topic) {
      const topicLower = String(topic).toLowerCase();
      fusedResults = fusedResults.filter((r) => (r.topic || '').toLowerCase().includes(topicLower));
    }

    // Take candidates for reranking (more than final limit)
    let candidates = fusedResults.slice(0, safeLimit * 2);
    let reranked = false;
    let rerankModel = null;

    // Apply Cohere reranking if configured and enough candidates
    if (isRerankConfigured() && candidates.length >= 3) {
      try {
        const rerankResult = await rerankDocuments({
          query,
          documents: candidates.map((r) => ({ ...r, text: r.chunk_text })),
          topN: safeLimit,
          textField: 'text',
          returnScores: true,
        });

        if (rerankResult.success && rerankResult.reranked) {
          candidates = rerankResult.results;
          reranked = true;
          rerankModel = 'rerank-english-v3.0';
        }
      } catch (rerankErr) {
        console.warn('[AL Tools] Cohere rerank failed, using RRF order:', rerankErr.message);
      }
    }

    // Take final limit
    const finalResults = candidates.slice(0, safeLimit);

    return {
      query,
      car_id,
      embeddingModel: model,
      searchMethod: reranked ? 'hybrid_rrf_reranked' : 'hybrid_rrf',
      rerankModel,
      count: finalResults.length,
      results: finalResults.map((r) => ({
        rrfScore: r.rrfScore,
        relevanceScore: r.relevanceScore || null, // From Cohere rerank
        vectorSimilarity: r.vectorSimilarity || null,
        keywordRank: r.keywordRank || null,
        topic: r.topic,
        excerpt: r.chunk_text,
        headline: r.headline || null,
        source: {
          type: r.source_type,
          url: r.source_url,
        },
      })),
      instruction: 'Use these excerpts as evidence. If you cite a claim, include the source URL.',
    };
  } catch (err) {
    console.error('[AL Tools] Error searching knowledge base:', err);
    return { error: err.message || 'Knowledge search failed' };
  }
}

/**
 * Helper to format knowledge search results consistently
 */
function formatKnowledgeResults(query, car_id, results, searchMethod, embeddingModel) {
  return {
    query,
    car_id,
    embeddingModel,
    searchMethod,
    count: results.length,
    results: results.map((r) => ({
      similarity: r.similarity || null,
      relevance: r.rank || null,
      topic: r.topic,
      excerpt: r.chunk_text,
      headline: r.headline || null,
      source: {
        type: r.source_type,
        url: r.source_url,
      },
    })),
    instruction: 'Use these excerpts as evidence. If you cite a claim, include the source URL.',
  };
}

/**
 * Get track lap times for a car (citeable).
 * @param {Object} params
 * @param {string} params.car_id - Car UUID identifier (required)
 * @param {number} [params.limit] - Max results (default 6)
 * @returns {Object}
 */
export async function getTrackLapTimes({ car_id, limit = 6 }) {
  const client = getDbClient({ requireServiceRole: true });
  if (!isSupabaseConfigured || !client) return { error: 'Supabase not configured' };
  if (!car_id) return { error: 'car_id is required' };

  try {
    // Resolve car_id to slug for RPC function
    const carSlug = await getSlugFromCarId(car_id);
    if (!carSlug) {
      return { error: `Car not found: ${car_id}` };
    }

    const safeLimit = Math.max(1, Math.min(Number(limit) || 6, 15));
    const { data, error } = await client.rpc('get_car_track_lap_times', {
      p_car_slug: carSlug,
      p_limit: safeLimit,
    });
    if (error) throw error;

    const rows = Array.isArray(data) ? data : [];
    return {
      car_id,
      count: rows.length,
      laps: rows.map((r) => ({
        track: {
          slug: r.track_slug,
          name: r.track_name,
          layout_key: r.layout_key,
          layout_name: r.layout_name,
        },
        lap_time_ms: r.lap_time_ms,
        lap_time_text: r.lap_time_text,
        session_date: r.session_date,
        is_stock: r.is_stock,
        tires: r.tires,
        conditions: r.conditions,
        modifications: r.modifications,
        notes: r.notes,
        verified: r.verified,
        confidence: r.confidence,
        source_url: r.source_url,
      })),
      instruction:
        'When citing a lap time, include the source_url and mention conditions/tires when provided.',
    };
  } catch (err) {
    console.error('[AL Tools] get_track_lap_times failed:', err);
    return { error: err.message || 'get_track_lap_times failed', car_id };
  }
}

/**
 * Get dyno runs for a car (citeable).
 * @param {Object} params
 * @param {string} params.car_id - Car UUID identifier (required)
 * @param {number} [params.limit] - Max results (default 6)
 * @param {boolean} [params.include_curve] - Include curve JSON (default false)
 * @returns {Object}
 */
export async function getDynoRuns({ car_id, limit = 6, include_curve = false }) {
  const client = getDbClient({ requireServiceRole: true });
  if (!isSupabaseConfigured || !client) return { error: 'Supabase not configured' };
  if (!car_id) return { error: 'car_id is required' };

  try {
    // Resolve car_id to slug for RPC function
    const carSlug = await getSlugFromCarId(car_id);
    if (!carSlug) {
      return { error: `Car not found: ${car_id}` };
    }

    const safeLimit = Math.max(1, Math.min(Number(limit) || 6, 15));
    const { data, error } = await client.rpc('get_car_dyno_runs', {
      p_car_slug: carSlug,
      p_limit: safeLimit,
      p_include_curve: Boolean(include_curve),
    });
    if (error) throw error;

    const rows = Array.isArray(data) ? data : [];
    return {
      car_id,
      count: rows.length,
      runs: rows.map((r) => ({
        run_kind: r.run_kind,
        recorded_at: r.recorded_at,
        dyno_type: r.dyno_type,
        correction: r.correction,
        fuel: r.fuel,
        is_wheel: r.is_wheel,
        peaks: {
          peak_whp: r.peak_whp,
          peak_wtq: r.peak_wtq,
          peak_hp: r.peak_hp,
          peak_tq: r.peak_tq,
          boost_psi_max: r.boost_psi_max,
        },
        conditions: r.conditions,
        modifications: r.modifications,
        notes: r.notes,
        curve: r.curve,
        verified: r.verified,
        confidence: r.confidence,
        source_url: r.source_url,
      })),
      instruction:
        'When citing dyno numbers, include the source_url and mention dyno type/correction/fuel if provided. Avoid claiming universal gains; call out variability.',
    };
  } catch (err) {
    console.error('[AL Tools] get_dyno_runs failed:', err);
    return { error: err.message || 'get_dyno_runs failed', car_id };
  }
}

/**
 * Get price history and market trends for a car.
 *
 * Use this when users ask about:
 * - "Has the 997 GT3 appreciated?"
 * - "What's the price trend for this car?"
 * - "How much has this car depreciated?"
 *
 * @param {Object} params
 * @param {string} params.car_id - Car UUID identifier (required)
 * @param {string} [params.period] - Time period: '1y', '3y', '5y', 'all' (default: '3y')
 * @returns {Object} Price history with trends
 */
export async function getPriceHistory({ car_id, period = '3y' }) {
  const client = getDbClient({ requireServiceRole: true });
  if (!isSupabaseConfigured || !client) return { error: 'Supabase not configured' };
  if (!car_id) return { error: 'car_id is required' };

  try {
    // car_id is already a UUID, use directly
    const carId = car_id;

    // Calculate date range based on period
    const periodMonths = {
      '1y': 12,
      '3y': 36,
      '5y': 60,
      all: 120, // 10 years max
    };
    const months = periodMonths[period] || 36;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Fetch price history
    const { data: history, error: histErr } = await client
      .from('car_price_history')
      .select('price, recorded_at, source, condition')
      .eq('car_id', carId)
      .gte('recorded_at', startDate.toISOString())
      .order('recorded_at', { ascending: true })
      .limit(100);

    if (histErr) throw histErr;

    // Also get current market pricing for context
    const { data: currentPricing } = await client
      .from('car_market_pricing')
      .select('median_price, average_price, min_price, max_price, listing_count, last_updated')
      .eq('car_id', carId)
      .single();

    if (!history || history.length === 0) {
      return {
        car_id,
        period,
        has_history: false,
        current_pricing: currentPricing
          ? {
              median: currentPricing.median_price,
              average: currentPricing.average_price,
              range: `$${currentPricing.min_price?.toLocaleString()} - $${currentPricing.max_price?.toLocaleString()}`,
              listing_count: currentPricing.listing_count,
              as_of: currentPricing.last_updated,
            }
          : null,
        message:
          'No historical price data available for this car. Only current market pricing shown.',
      };
    }

    // Calculate trends
    const prices = history.map((h) => h.price).filter((p) => p > 0);
    const oldestPrice = prices[0];
    const newestPrice = prices[prices.length - 1];
    const percentChange =
      oldestPrice > 0 ? Math.round(((newestPrice - oldestPrice) / oldestPrice) * 100) : 0;
    const trend =
      percentChange > 5 ? 'appreciating' : percentChange < -5 ? 'depreciating' : 'stable';

    // Sample points for charting (monthly averages)
    const monthlyData = {};
    for (const h of history) {
      const monthKey = h.recorded_at.substring(0, 7); // YYYY-MM
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { prices: [], count: 0 };
      }
      monthlyData[monthKey].prices.push(h.price);
      monthlyData[monthKey].count++;
    }

    const pricePoints = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        average_price: Math.round(data.prices.reduce((a, b) => a + b, 0) / data.prices.length),
        sample_count: data.count,
      }))
      .slice(-12); // Last 12 months for display

    return {
      car_id,
      period,
      has_history: true,

      // Trend analysis
      trend,
      percent_change: percentChange,
      trend_description:
        percentChange > 0
          ? `Up ${percentChange}% over ${period}`
          : percentChange < 0
            ? `Down ${Math.abs(percentChange)}% over ${period}`
            : `Stable over ${period}`,

      // Price range over period
      period_low: Math.min(...prices),
      period_high: Math.max(...prices),
      period_average: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),

      // Current market context
      current_pricing: currentPricing
        ? {
            median: currentPricing.median_price,
            average: currentPricing.average_price,
            range: `$${currentPricing.min_price?.toLocaleString()} - $${currentPricing.max_price?.toLocaleString()}`,
            listing_count: currentPricing.listing_count,
            as_of: currentPricing.last_updated,
          }
        : null,

      // Data points for reference
      data_points: history.length,
      price_points: pricePoints,

      instruction:
        'Use this data to discuss price trends. Note that used car prices can vary significantly based on condition, mileage, and market conditions.',
    };
  } catch (err) {
    console.error('[AL Tools] get_price_history failed:', err);
    return { error: err.message || 'get_price_history failed', car_id };
  }
}

/**
 * @deprecated Use getCarAIContext instead. This function internally calls getCarAIContext
 * and adds minimal value. Deprecated 2026-01-26.
 * @param {Object} params
 * @param {string} params.car_id - Car UUID identifier (required)
 * @param {string[]} [params.include] - Sections to include (default: ['specs', 'scores'])
 */
export async function getCarDetails({ car_id, include = ['specs', 'scores'] }) {
  console.warn('[AL Tools] DEPRECATED: get_car_details called - use get_car_ai_context instead');

  // Resolve car_id to slug for fetchCarBySlug
  const carSlug = await getSlugFromCarId(car_id);
  if (!carSlug) {
    return { error: `Car not found: ${car_id}` };
  }

  // Find car in database via carsClient
  const car = await fetchCarBySlug(carSlug);
  if (!car) {
    return { error: `Car not found: ${car_id}` };
  }

  const result = {
    name: car.name,
    slug: car.slug,
    year: car.year,
    category: car.category,
    tier: car.tier,
  };

  // Prefer DB-derived canonical facts when available (faster + more accurate than local-only)
  let aiCtx = null;
  if (isSupabaseConfigured) {
    try {
      const includeSections = ['car'];
      if (include.includes('maintenance')) includeSections.push('maintenance');
      if (include.includes('buyer_guide')) includeSections.push('pricing', 'price_history');
      aiCtx = await getCarAIContext({ car_id, include: includeSections });

      if (aiCtx?.car?.name) {
        result.name = aiCtx.car.name;
        result.year = aiCtx.car.year || result.year;
        result.category = aiCtx.car.category || result.category;
        result.tier = aiCtx.car.tier || result.tier;
      }
    } catch (err) {
      // Non-fatal; local data remains available
      console.warn('[AL Tools] get_car_ai_context failed inside get_car_details:', err);
    }
  }

  if (include.includes('specs')) {
    result.specs = {
      engineType: aiCtx?.car?.engineType ?? car.engineType,
      hp: aiCtx?.car?.hp ?? car.hp,
      torque: aiCtx?.car?.torque ?? car.torque,
      transmission: aiCtx?.car?.transmission ?? car.transmission,
      driveType: aiCtx?.car?.driveType ?? car.driveType,
      curbWeight: aiCtx?.car?.curb_weight ?? car.curbWeight,
      zeroToSixty: aiCtx?.car?.zero_to_sixty ?? car.zeroToSixty,
      topSpeed: car.topSpeed,
      quarterMile: car.quarterMile,
      braking60To0: car.braking60To0,
      lateralG: car.lateralG,
    };
  }

  if (include.includes('scores')) {
    result.scores = {
      sound: aiCtx?.car?.score_sound ?? (car.sound || car.score_sound),
      interior: aiCtx?.car?.score_interior ?? (car.interior || car.score_interior),
      track: aiCtx?.car?.score_track ?? (car.track || car.score_track),
      reliability: aiCtx?.car?.score_reliability ?? (car.reliability || car.score_reliability),
      value: aiCtx?.car?.score_value ?? (car.value || car.score_value),
      driverFun: aiCtx?.car?.score_driver_fun ?? (car.driverFun || car.score_driver_fun),
      aftermarket: aiCtx?.car?.score_aftermarket ?? (car.aftermarket || car.score_aftermarket),
    };
    result.highlight = car.highlight;
    result.notes = car.notes;
  }

  if (include.includes('buyer_guide')) {
    result.buyerGuide = {
      msrp: aiCtx?.car?.msrp ?? car.msrp,
      msrpNew:
        car.msrpNewLow && car.msrpNewHigh
          ? `$${car.msrpNewLow.toLocaleString()} - $${car.msrpNewHigh.toLocaleString()}`
          : null,
      bestFor: car.bestFor,
      pros: car.pros,
      cons: car.cons,
      idealOwner: car.idealOwner,
      notIdealFor: car.notIdealFor,
      yearsToAvoid: car.yearsToAvoid,
      recommendedYears: car.recommendedYearsNote,
      buyersSummary: car.buyersSummary,
    };
  }

  if (include.includes('ownership_costs')) {
    result.ownership = {
      annualCost: car.annualOwnershipCost,
      majorServiceCosts: car.majorServiceCosts,
      partsAvailability: car.partsAvailability,
      dealerVsIndependent: car.dealerVsIndependent,
      diyFriendliness: car.diyFriendliness,
      insuranceNotes: car.insuranceNotes,
      maintenanceCostIndex: car.maintenanceCostIndex,
    };
  }

  // Try to get additional data from Supabase
  const client = getDbClient({ requireServiceRole: true });
  if (isSupabaseConfigured && client) {
    const promises = [];

    if (include.includes('known_issues')) {
      promises.push(
        (async () => {
          try {
            // Prefer unified canonical issues table with car_id for efficient queries
            let issuesQuery = client
              .from('car_issues')
              .select(
                'title, kind, severity, affected_years_text, description, symptoms, prevention, fix_description, estimated_cost_text, estimated_cost_low, estimated_cost_high, source_url'
              );

            // car_id is required - car_slug column no longer exists on car_issues
            if (!car?.id) {
              console.warn('[AL Tools] Cannot fetch issues: car.id not available');
              return;
            }
            issuesQuery = issuesQuery.eq('car_id', car.id);

            issuesQuery = issuesQuery.order('severity', { ascending: true }).limit(25);

            const { data: canonicalIssues, error: canonicalError } = await issuesQuery;

            // car_issues is the source of truth for known issues
            // NOTE: vehicle_known_issues is DEPRECATED as of 2026-01-15
            if (!canonicalError && canonicalIssues && canonicalIssues.length > 0) {
              result.knownIssues = canonicalIssues.map((issue) => ({
                name: issue.title,
                kind: issue.kind,
                severity: issue.severity,
                affectedYears: issue.affected_years_text,
                description: issue.description,
                symptoms: issue.symptoms,
                prevention: issue.prevention,
                fix: issue.fix_description,
                estimatedCost:
                  issue.estimated_cost_text ||
                  (issue.estimated_cost_low || issue.estimated_cost_high
                    ? `$${issue.estimated_cost_low || ''}-${issue.estimated_cost_high || ''}`
                    : null),
                sourceUrl: issue.source_url,
              }));
            }
          } catch (err) {
            console.warn('[AL Tools] Error fetching known issues:', err);
          }
        })()
      );
    }

    if (include.includes('maintenance')) {
      promises.push(
        (async () => {
          try {
            if (aiCtx?.maintenanceSummary) {
              result.maintenance = aiCtx.maintenanceSummary;
              return;
            }

            const { data, error } = await client.rpc('get_car_maintenance_summary', {
              p_car_slug: carSlug,
            });
            if (!error && data) result.maintenance = data;
          } catch (err) {
            console.warn('[AL Tools] Error fetching maintenance summary:', err);
          }
        })()
      );
    }

    if (promises.length > 0) {
      await Promise.all(promises);
    }
  }

  return result;
}

/**
 * Get expert YouTube reviews for a car
 * @param {Object} params
 * @param {string} params.car_id - Car UUID identifier (required)
 * @param {number} [params.limit] - Max reviews (default 3)
 * @param {boolean} [params.include_quotes] - Include quotes (default true)
 * @returns {Object} Expert reviews and consensus
 */
export async function getExpertReviews({ car_id, limit = 3, include_quotes = true }) {
  // Resolve car_id to slug for fetchVideosForCar
  const carSlug = await getSlugFromCarId(car_id);
  if (!carSlug) {
    return { error: `Car not found: ${car_id}` };
  }

  // Try to get from database
  if (isSupabaseConfigured) {
    try {
      const videos = await fetchVideosForCar(carSlug, { limit, carId: car_id });

      if (videos && videos.length > 0) {
        const consensus = await calculateCarConsensus(carSlug);

        return {
          reviewCount: videos.length,
          reviews: videos.map((v) => ({
            title: v.youtube_videos?.title,
            channel: v.youtube_videos?.channel_name,
            url: v.youtube_videos?.url,
            summary: v.youtube_videos?.summary,
            oneLiner: v.youtube_videos?.one_line_take,
            keyPoints: v.youtube_videos?.key_points,
            pros: v.youtube_videos?.pros_mentioned,
            cons: v.youtube_videos?.cons_mentioned,
            quotes: include_quotes ? v.youtube_videos?.notable_quotes : undefined,
          })),
          consensus: consensus
            ? {
                overallStrengths: consensus.strengths?.map((s) => s.tag).slice(0, 3),
                overallWeaknesses: consensus.weaknesses?.map((w) => w.tag).slice(0, 3),
                frequentlyComparedTo: consensus.comparisons?.map((c) => c.slug).slice(0, 3),
              }
            : null,
        };
      }
    } catch (err) {
      console.warn('[AL Tools] Error fetching expert reviews:', err);
    }
  }

  // Return placeholder if no data
  return {
    reviewCount: 0,
    message: 'No expert reviews found in database for this car.',
  };
}

/**
 * Get known issues for a car
 * @param {Object} params
 * @param {string} params.car_id - Car UUID identifier (required)
 * @param {string} [params.severity_filter] - Filter by severity: 'Critical', 'Major', 'Minor', 'All' (default: 'All')
 * @returns {Object} Known issues
 */
export async function getKnownIssues({ car_id, severity_filter = 'All' }) {
  if (!car_id) {
    return { error: 'car_id is required' };
  }

  // Resolve car_id to slug for fetchCarBySlug
  const carSlug = await getSlugFromCarId(car_id);

  // First check car data from database for common issues
  const car = carSlug ? await fetchCarBySlug(carSlug) : null;
  let localIssues = [];

  if (car?.commonIssuesDetailed) {
    localIssues = car.commonIssuesDetailed;
  } else if (car?.commonIssues) {
    localIssues = car.commonIssues.map((issue) => ({ issue, severity: 'Unknown' }));
  }

  // car_id is already a UUID, use directly
  const carId = car_id;

  // Try database
  if (isSupabaseConfigured && supabase) {
    try {
      // Prefer canonical issues table with car_id for efficient index usage
      let canonicalQuery = supabase
        .from('car_issues')
        .select(
          'title, kind, severity, affected_years_text, description, symptoms, prevention, fix_description, estimated_cost_text, estimated_cost_low, estimated_cost_high, source_url'
        );

      // car_id is required - car_slug column no longer exists on car_issues
      canonicalQuery = canonicalQuery.eq('car_id', carId);

      canonicalQuery = canonicalQuery
        .order('severity', { ascending: true })
        .order('sort_order', { ascending: true });

      if (severity_filter !== 'All') {
        // Map legacy filters if caller uses old labels
        canonicalQuery = canonicalQuery.eq('severity', severity_filter.toLowerCase());
      }

      // car_issues is the source of truth for known issues
      // NOTE: vehicle_known_issues is DEPRECATED as of 2026-01-15
      const { data: canonicalIssues, error: canonicalError } = await canonicalQuery;
      if (!canonicalError && canonicalIssues && canonicalIssues.length > 0) {
        return {
          carName: car?.name || car_id,
          car_id,
          issueCount: canonicalIssues.length,
          issues: canonicalIssues.map((issue) => ({
            name: issue.title,
            kind: issue.kind,
            severity: issue.severity,
            affectedYears: issue.affected_years_text,
            description: issue.description,
            symptoms: issue.symptoms,
            prevention: issue.prevention,
            fix: issue.fix_description,
            estimatedCost:
              issue.estimated_cost_text ||
              (issue.estimated_cost_low || issue.estimated_cost_high
                ? `$${issue.estimated_cost_low || ''}-${issue.estimated_cost_high || ''}`
                : null),
            sourceUrl: issue.source_url,
          })),
          source: 'car_issues',
        };
      }
    } catch (err) {
      console.warn('[AL Tools] Error fetching known issues from DB:', err);
    }
  }

  // Return local issues if DB fetch failed
  if (localIssues.length > 0) {
    return {
      carName: car?.name || car_id,
      car_id,
      issueCount: localIssues.length,
      issues: localIssues,
      source: 'local_data',
    };
  }

  return {
    carName: car?.name || car_id,
    car_id,
    issueCount: 0,
    message: 'No known issues documented for this car in our database.',
  };
}

/**
 * Compare multiple cars
 * @param {Object} params
 * @param {string[]} params.car_ids - Array of car UUIDs to compare (required, 2-4 cars)
 * @param {string[]} [params.focus_areas] - Focus areas for comparison
 * @returns {Object} Comparison data
 */
export async function compareCars({ car_ids, focus_areas = [] }) {
  if (!car_ids || !Array.isArray(car_ids) || car_ids.length < 2) {
    return { error: 'At least 2 car_ids required for comparison' };
  }

  // Resolve car_ids to slugs for fetchCars lookup
  const carSlugs = await Promise.all(car_ids.map((carId) => getSlugFromCarId(carId)));

  // Fetch all cars from database and filter by slugs
  const allCars = await fetchCars();
  const cars = carSlugs
    .map((slug) => (slug ? allCars.find((c) => c.slug === slug) : null))
    .filter(Boolean);

  if (cars.length < 2) {
    return { error: 'At least 2 valid cars required for comparison' };
  }

  const comparison = {
    cars: cars.map((car) => ({
      name: car.name,
      slug: car.slug,
      year: car.year,
      hp: car.hp,
      torque: car.torque,
      engineType: car.engineType,
      curbWeight: car.curbWeight,
      zeroToSixty: car.zeroToSixty,
      msrp: car.msrp,
      category: car.category,
      driveType: car.driveType,
      transmission: car.transmission,
    })),
    scores: {},
    analysis: {},
  };

  // Build score comparisons
  const scoreFields = [
    { key: 'sound', label: 'Sound & Emotion' },
    { key: 'interior', label: 'Interior Quality' },
    { key: 'track', label: 'Track Capability' },
    { key: 'reliability', label: 'Reliability' },
    { key: 'value', label: 'Value' },
    { key: 'driverFun', label: 'Driver Fun' },
    { key: 'aftermarket', label: 'Aftermarket Support' },
  ];

  for (const field of scoreFields) {
    comparison.scores[field.key] = cars.map((car) => ({
      name: car.name,
      score: car[field.key] || car[`score_${field.key}`] || null,
    }));
  }

  // Focus area analysis
  if (focus_areas.includes('performance') || focus_areas.length === 0) {
    const powerWinner = cars.reduce((a, b) => ((a.hp || 0) > (b.hp || 0) ? a : b));
    const quickestCar = cars.reduce((a, b) =>
      (a.zeroToSixty || 99) < (b.zeroToSixty || 99) ? a : b
    );

    comparison.analysis.performance = {
      mostPowerful: { name: powerWinner.name, hp: powerWinner.hp },
      quickest: { name: quickestCar.name, zeroToSixty: quickestCar.zeroToSixty },
    };
  }

  if (focus_areas.includes('value') || focus_areas.length === 0) {
    const bestValue = cars.reduce((a, b) => {
      const aValue = a.value || a.score_value || 5;
      const bValue = b.value || b.score_value || 5;
      return aValue > bValue ? a : b;
    });
    const lowestPrice = cars.reduce((a, b) => ((a.msrp || 999999) < (b.msrp || 999999) ? a : b));

    comparison.analysis.value = {
      bestValue: { name: bestValue.name, score: bestValue.value || bestValue.score_value },
      lowestPrice: { name: lowestPrice.name, msrp: lowestPrice.msrp },
    };
  }

  if (focus_areas.includes('reliability') || focus_areas.length === 0) {
    const mostReliable = cars.reduce((a, b) => {
      const aRel = a.reliability || a.score_reliability || 5;
      const bRel = b.reliability || b.score_reliability || 5;
      return aRel > bRel ? a : b;
    });

    comparison.analysis.reliability = {
      mostReliable: {
        name: mostReliable.name,
        score: mostReliable.reliability || mostReliable.score_reliability,
      },
    };
  }

  return comparison;
}

// =============================================================================
// ENCYCLOPEDIA & KNOWLEDGE
// =============================================================================

/**
 * Semantic search for encyclopedia topics using vector embeddings.
 * This enables natural language queries like "how does a turbo work?"
 * to find relevant educational content.
 *
 * @param {Object} params
 * @param {string} params.query - Natural language query
 * @param {number} [params.limit=6] - Max results
 * @returns {Object} Vector search results with topic metadata
 */
async function searchEncyclopediaVectorized({ query, limit = 6 }) {
  const client = getDbClient({ requireServiceRole: true });
  if (!isSupabaseConfigured || !client) {
    return { error: 'Supabase not configured', vectorSearch: false };
  }

  try {
    const { embedding, error: embedErr, model } = await generateQueryEmbedding(query);
    if (embedErr) {
      return { error: embedErr, vectorSearch: false };
    }

    const pgVec = vectorToPgVectorLiteral(embedding);
    if (!pgVec) return { error: 'Failed to format embedding', vectorSearch: false };

    // Search document_chunks for encyclopedia content
    // Using the same RPC as search_knowledge but filtering to encyclopedia topics
    const { data: matches, error: searchErr } = await client.rpc('search_document_chunks', {
      p_embedding: pgVec,
      p_car_id: null,
      p_limit: Math.max(1, Math.min(Number(limit) || 6, 15)),
    });
    if (searchErr) throw searchErr;

    // Filter to encyclopedia topics only (topic format: "encyclopedia:{slug}")
    const encyclopediaMatches = (matches || []).filter(
      (r) => r.topic?.startsWith('encyclopedia:') || r.metadata?.source_type === 'encyclopedia'
    );

    if (encyclopediaMatches.length === 0) {
      return { vectorSearch: true, found: false, results: [] };
    }

    return {
      vectorSearch: true,
      found: true,
      embeddingModel: model,
      count: encyclopediaMatches.length,
      results: encyclopediaMatches.map((r) => {
        // Extract topic slug from topic field (e.g., "encyclopedia:turbo-fundamentals")
        const topicSlug = r.topic?.replace('encyclopedia:', '') || r.metadata?.topic_slug || null;

        return {
          similarity: r.similarity,
          topicSlug,
          topicName: r.metadata?.topic_name || topicSlug,
          system: r.metadata?.system || null,
          excerpt: r.chunk_text?.slice(0, 500) + '...',
          relatedTopics: r.metadata?.related_topics || [],
          relatedUpgrades: r.metadata?.related_upgrades || [],
          url: `/encyclopedia/topic/${topicSlug}`,
        };
      }),
    };
  } catch (err) {
    console.error('[AL Tools] searchEncyclopediaVectorized failed:', err);
    return { error: err.message, vectorSearch: false };
  }
}

/**
 * Search the encyclopedia for educational content, mods, and guides.
 *
 * NOW SUPPORTS SEMANTIC SEARCH: When embeddings are available, this tool
 * performs vector similarity search for natural language queries like
 * "how does a turbo work?" or "what is bore and stroke?"
 *
 * Falls back to keyword matching when vector search is unavailable.
 *
 * Categories (updated for new hierarchy):
 * - all: Search everything
 * - automotive: Automotive systems and topics (engine, drivetrain, etc.)
 * - topics: Individual educational topics (bore, stroke, cam profiles, etc.)
 * - modifications: Performance upgrades and mods
 * - build_guides: Goal-based build paths
 * - systems: Legacy technical reference (from connectedTissueMatrix)
 * - components: Legacy components (from connectedTissueMatrix nodes)
 *
 * @param {Object} params - Search parameters
 * @returns {Object} Search results
 */
export async function searchEncyclopediaContent({ query, category = 'all' }) {
  // Try semantic search first for topic queries
  // This gives much better results for educational questions
  if (category === 'all' || category === 'topics' || category === 'automotive') {
    const vectorResults = await searchEncyclopediaVectorized({ query, limit: 8 });

    if (vectorResults.vectorSearch && vectorResults.found && vectorResults.results?.length > 0) {
      // Vector search succeeded - return rich results
      return {
        query,
        category,
        searchMethod: 'semantic',
        embeddingModel: vectorResults.embeddingModel,
        resultCount: vectorResults.count,
        results: vectorResults.results.map((r) => ({
          id: `topic.${r.topicSlug}`,
          title: r.topicName,
          subtitle: r.excerpt?.slice(0, 150) + '...',
          type: 'topic',
          section: r.system,
          similarity: r.similarity,
          url: r.url,
          relatedTopics: r.relatedTopics?.slice(0, 3),
          relatedUpgrades: r.relatedUpgrades?.slice(0, 3),
        })),
        availableCategories: ['all', 'automotive', 'topics', 'modifications', 'build_guides'],
        instruction:
          'Results found via semantic search. Use the topic URLs to cite sources. Related topics and upgrades can provide deeper context.',
      };
    }
    // Fall through to keyword search if vector search returned no results or failed
  }

  // Keyword-based fallback search
  const results = searchEncyclopedia(query);

  // Filter by category if specified
  let filtered = results;
  if (category !== 'all') {
    const categoryMap = {
      // New hierarchy categories
      automotive: ['automotiveSystem', 'automotiveComponent', 'topic'],
      topics: ['topic'],
      // Existing categories
      modifications: ['modification', 'category'],
      build_guides: ['buildGuide'],
      // Legacy categories (still supported for backward compatibility)
      systems: ['system', 'automotiveSystem'],
      components: ['component', 'automotiveComponent', 'topic'],
    };

    // System-specific category filters (filter topics by system slug)
    const systemCategories = [
      'engine',
      'drivetrain',
      'fuel_system',
      'engine_management',
      'intake_forced_induction',
      'exhaust',
      'suspension_steering',
      'aerodynamics',
      'brakes',
    ];

    // Map category param to system slug (handle underscores vs hyphens)
    const categoryToSystemSlug = {
      fuel_system: 'fuel-system',
      engine_management: 'engine-management',
      intake_forced_induction: 'air-intake',
      suspension_steering: 'suspension',
    };

    if (systemCategories.includes(category)) {
      // Filter by specific system
      const systemSlug = categoryToSystemSlug[category] || category;
      filtered = results.filter(
        (r) =>
          r.type === 'topic' &&
          r.id?.startsWith(`topic.`) &&
          // Check if result's section matches system name
          r.section?.toLowerCase().includes(systemSlug.replace('-', ' ').split(' ')[0])
      );
    } else {
      const types = categoryMap[category] || [];
      filtered = results.filter((r) => types.includes(r.type));
    }
  }

  return {
    query,
    category,
    searchMethod: 'keyword',
    resultCount: filtered.length,
    results: filtered.slice(0, 10).map((r) => ({
      id: r.id,
      title: r.title,
      subtitle: r.subtitle,
      type: r.type,
      section: r.section,
    })),
    // Provide category hints for AL
    availableCategories: ['all', 'automotive', 'topics', 'modifications', 'build_guides'],
  };
}

/**
 * Get detailed upgrade/modification info
 * @param {Object} params
 * @param {string} params.upgrade_key - Upgrade identifier (required)
 * @param {string} [params.car_id] - Optional car UUID for car-specific recommendations
 * @returns {Object} Detailed upgrade information
 */
export async function getUpgradeInfo({ upgrade_key, car_id = null }) {
  // Try to find in upgrade details
  const upgrade = upgradeDetails[upgrade_key];

  if (!upgrade) {
    // Try article lookup
    const article = getModificationArticle(upgrade_key);
    if (article) {
      return {
        name: article.title,
        description: article.summary,
        sections: article.sections,
        metadata: article.metadata,
      };
    }
    return { error: `Upgrade not found: ${upgrade_key}` };
  }

  const category = upgradeCategories[upgrade.category];

  // Get related educational topics from the new hierarchy
  const relatedTopics = getTopicsForUpgrade(upgrade_key);

  const result = {
    name: upgrade.name,
    category: category?.name || upgrade.category,
    shortDescription: upgrade.shortDescription,
    fullDescription: upgrade.fullDescription,
    howItWorks: upgrade.howItWorks,
    expectedGains: upgrade.expectedGains,
    cost: upgrade.cost,
    difficulty: upgrade.difficulty,
    installTime: upgrade.installTime,
    requiresTune: upgrade.requiresTune,
    streetLegal: upgrade.streetLegal,
    pros: upgrade.pros,
    cons: upgrade.cons,
    bestFor: upgrade.bestFor,
    worksWellWith: upgrade.worksWellWith,
    considerations: upgrade.considerations,
    popularBrands: upgrade.brands,
    // NEW: Related educational topics for deeper learning
    relatedTopics:
      relatedTopics.length > 0
        ? relatedTopics.map((t) => ({
            slug: t.slug,
            name: t.name,
            system: t.system,
            definition: t.definition,
          }))
        : null,
  };

  // Add car-specific info if requested
  if (car_id) {
    const carSlug = await getSlugFromCarId(car_id);
    const car = carSlug ? await fetchCarBySlug(carSlug) : null;
    if (car) {
      result.carContext = {
        carName: car.name,
        engineType: car.engineType?.includes('Turbo') ? 'turbo' : 'naturally_aspirated',
        aftermarketScore: car.aftermarket || car.score_aftermarket,
        note:
          car.aftermarket >= 8
            ? 'This car has excellent aftermarket support for this upgrade.'
            : car.aftermarket >= 6
              ? 'Good aftermarket options available for this car.'
              : 'Limited aftermarket options - consider OEM or universal parts.',
      };
    }
  }

  return result;
}

/**
 * Calculate the performance impact of specific modifications on a car.
 *
 * Use this for quick answers to questions like:
 * - "How much HP will an intake add to my 911?"
 * - "What's the 0-60 improvement from a tune?"
 * - "What will downpipe + tune do for my GTI?"
 *
 * This is LIGHTER than recommend_build - just calculations, no full build plans.
 *
 * @param {Object} params
 * @param {string} params.car_id - Car UUID identifier (required)
 * @param {string[]} params.mods - Array of mod keys: 'cold-air-intake', 'ecu-tune', 'downpipe', etc.
 * @returns {Object} Performance impact calculations
 */
export async function calculateModImpact({ car_id, mods }) {
  if (!car_id) {
    return { error: 'car_id is required' };
  }
  if (!mods || !Array.isArray(mods) || mods.length === 0) {
    return { error: 'mods array is required (e.g., ["cold-air-intake", "ecu-tune"])' };
  }

  // Resolve car_id to slug for fetchCarBySlug
  const carSlug = await getSlugFromCarId(car_id);
  if (!carSlug) {
    return { error: `Car not found: ${car_id}` };
  }

  const car = await fetchCarBySlug(carSlug);
  if (!car) {
    return { error: `Car not found: ${car_id}` };
  }

  try {
    // Use performanceCalculator to get accurate HP gains
    const hpResult = calculateSmartHpGain(car, mods);

    // Calculate 0-60 improvement if we have stock data
    let zeroToSixtyImprovement = null;
    if (car.zeroToSixty && hpResult.projectedHp) {
      const stockZeroToSixty = car.zeroToSixty;
      const newZeroToSixty = estimateZeroToSixty({
        hp: hpResult.projectedHp,
        weight: car.curbWeight || car.curb_weight,
        drivetrain: car.driveType,
        stockZeroToSixty,
      });
      zeroToSixtyImprovement = stockZeroToSixty - newZeroToSixty;
    }

    // Format mod breakdown for readability
    const modBreakdown = mods.map((mod) => {
      const gain = hpResult.breakdown?.[mod];
      return {
        mod,
        hp_gain: gain?.appliedGain || gain?.baseGain || 0,
        notes: gain?.notes || null,
      };
    });

    return {
      car: {
        name: car.name,
        slug: car.slug,
        stock_hp: hpResult.stockHp,
        engine: car.engine,
        aspiration: hpResult.aspiration,
      },

      // HP calculations
      stock_hp: hpResult.stockHp,
      projected_hp: hpResult.projectedHp,
      total_hp_gain: hpResult.totalGain,

      // 0-60 calculations
      stock_zero_to_sixty: car.zeroToSixty,
      projected_zero_to_sixty:
        car.zeroToSixty && zeroToSixtyImprovement
          ? (car.zeroToSixty - zeroToSixtyImprovement).toFixed(2)
          : null,
      zero_to_sixty_improvement: zeroToSixtyImprovement
        ? `${zeroToSixtyImprovement.toFixed(2)}s faster`
        : null,

      // Breakdown
      mods_applied: mods.length,
      mod_breakdown: modBreakdown,

      // Confidence
      confidence: hpResult.confidence,
      confidence_label: hpResult.confidenceLabel,

      // Warnings
      conflicts: hpResult.conflicts?.length > 0 ? hpResult.conflicts : null,
      adjustment_reason:
        hpResult.adjustmentAmount > 0
          ? `Reduced ${hpResult.adjustmentAmount} HP due to diminishing returns/overlap`
          : null,

      instruction:
        'These are estimates based on typical gains. Actual results vary by tune quality, supporting mods, and conditions. Recommend dyno testing for verification.',
    };
  } catch (err) {
    console.error('[AL Tools] calculate_mod_impact failed:', err);
    return { error: err.message || 'Calculation failed', car_id, mods };
  }
}

/**
 * Get build recommendations for a goal
 * Uses get_car_tuning_context RPC for optimized parts and tuning data access
 * @param {Object} params
 * @param {string} params.car_id - Car UUID identifier (required)
 * @param {string} params.goal - Build goal (required)
 * @param {number} [params.budget] - Budget in dollars
 * @param {boolean} [params.maintain_warranty] - Prioritize warranty-safe mods (default false)
 * @returns {Object} Build recommendations
 */
export async function recommendBuild({ car_id, goal, budget = null, maintain_warranty = false }) {
  if (!car_id) {
    return { error: 'car_id is required' };
  }

  // Resolve car_id to slug for fetchCarBySlug and RPC
  const carSlug = await getSlugFromCarId(car_id);
  if (!carSlug) {
    return { error: `Car not found: ${car_id}` };
  }

  const car = await fetchCarBySlug(carSlug);
  if (!car) {
    return { error: `Car not found: ${car_id}` };
  }
  const client = getDbClient({ requireServiceRole: true });

  // Try to get optimized tuning context from new RPC
  let tuningContext = null;
  if (isSupabaseConfigured && client) {
    try {
      const { data, error } = await client.rpc('get_car_tuning_context', { p_car_slug: carSlug });
      if (!error && data && !data.error) {
        tuningContext = data;
      }
    } catch (err) {
      // RPC may not exist yet during deployment - continue with fallback
      console.warn('[AL Tools] get_car_tuning_context unavailable, using fallback:', err.message);
    }
  }

  // Get the build guide for this goal
  const guide = getBuildGuideArticle(goal);

  // Define upgrade tiers for each goal
  const goalUpgrades = {
    street_fun: {
      stage1: ['cold-air-intake', 'cat-back-exhaust', 'short-shifter'],
      stage2: ['coilovers', 'sway-bars', 'wheels-tires'],
      stage3: ['ecu-tune', 'headers', 'big-brake-kit'],
    },
    weekend_track: {
      stage1: ['brake-pads', 'brake-fluid', 'alignment'],
      stage2: ['coilovers', 'track-tires', 'big-brake-kit'],
      stage3: ['roll-bar', 'harness', 'bucket-seats'],
    },
    time_attack: {
      stage1: ['full-suspension', 'aero-package', 'lightweight-wheels'],
      stage2: ['engine-tune', 'race-brakes', 'cooling-upgrades'],
      stage3: ['forced-induction', 'cage', 'data-logging'],
    },
    canyon_carver: {
      stage1: ['suspension-upgrade', 'quality-tires', 'brake-upgrade'],
      stage2: ['coilovers', 'sway-bars', 'wheels'],
      stage3: ['ecu-tune', 'intake-exhaust', 'lsd'],
    },
    daily_plus: {
      stage1: ['intake', 'exhaust-tips', 'quality-tires'],
      stage2: ['lowering-springs', 'wheels', 'tune'],
      stage3: ['coilovers', 'intake-exhaust', 'big-brake-kit'],
    },
  };

  const upgrades = goalUpgrades[goal] || goalUpgrades.street_fun;

  // Filter warranty-safe mods if requested
  const warrantySafe = ['intake', 'exhaust-tips', 'wheels', 'tires', 'brake-pads'];

  const recommendation = {
    carName: car.name,
    goal: goal,
    budget: budget,
    maintainWarranty: maintain_warranty,
    stages: [],
  };

  // If we have parts fitment data for this car, include concrete parts as options.
  // This is what makes AutoRev AL more useful than generic chatbots.
  const partsByCategory = new Map();

  // Use tuning context if available (optimized single RPC call)
  if (tuningContext?.availableParts && Array.isArray(tuningContext.availableParts)) {
    for (const partData of tuningContext.availableParts) {
      const cat = partData.category || 'other';
      if (!partsByCategory.has(cat)) partsByCategory.set(cat, []);
      partsByCategory.get(cat).push({
        part: {
          id: partData.part_id,
          name: partData.name,
          brand_name: partData.brand,
          category: partData.category,
          quality_tier: partData.quality_tier,
        },
        fitment: {
          verified: partData.fitment?.verified,
          requires_tune: partData.fitment?.requires_tune,
          install_difficulty: partData.fitment?.install_difficulty,
          estimated_labor_hours: partData.fitment?.estimated_labor_hours,
        },
      });
    }
    // Sort and limit
    for (const [cat, arr] of partsByCategory.entries()) {
      arr.sort((a, b) => {
        const av = a.fitment.verified ? 1 : 0;
        const bv = b.fitment.verified ? 1 : 0;
        if (av !== bv) return bv - av;
        return 0;
      });
      partsByCategory.set(cat, arr.slice(0, 8));
    }
  } else if (isSupabaseConfigured && client) {
    // Fallback: direct query if RPC not available
    try {
      // Use carResolver for consistent car_id resolution (cached, indexed)
      const carId = await resolveCarId(car_slug);
      if (carId) {
        const { data: fitments, error: fErr } = await client
          .from('part_fitments')
          .select(
            'part_id,fitment_notes,requires_tune,install_difficulty,estimated_labor_hours,verified,confidence,source_url, parts(id,name,brand_name,part_number,category,description,quality_tier,street_legal,source_urls)'
          )
          .eq('car_id', carId)
          .limit(250);
        if (!fErr && fitments?.length) {
          // Attach latest pricing for all candidate parts (single query)
          const partIds = [...new Set(fitments.map((r) => r.part_id).filter(Boolean))];
          const { data: snapshots } = await client
            .from('part_pricing_snapshots')
            .select('part_id,price_cents,currency,recorded_at,product_url,vendor_name')
            .in('part_id', partIds)
            .order('recorded_at', { ascending: false })
            .limit(800);
          const latestByPartId = new Map();
          for (const s of snapshots || []) {
            if (!latestByPartId.has(s.part_id)) latestByPartId.set(s.part_id, s);
          }

          for (const row of fitments) {
            const cat = row?.parts?.category || 'other';
            if (!partsByCategory.has(cat)) partsByCategory.set(cat, []);
            partsByCategory.get(cat).push({
              part: {
                id: row.parts.id,
                name: row.parts.name,
                brand_name: row.parts.brand_name,
                part_number: row.parts.part_number,
                category: row.parts.category,
                quality_tier: row.parts.quality_tier,
                street_legal: row.parts.street_legal,
                source_urls: row.parts.source_urls,
                latest_price: latestByPartId.get(row.part_id)
                  ? {
                      vendor: latestByPartId.get(row.part_id).vendor_name,
                      product_url: latestByPartId.get(row.part_id).product_url,
                      price_cents: latestByPartId.get(row.part_id).price_cents,
                      currency: latestByPartId.get(row.part_id).currency,
                      recorded_at: latestByPartId.get(row.part_id).recorded_at,
                    }
                  : null,
              },
              fitment: {
                notes: row.fitment_notes,
                requires_tune: row.requires_tune,
                install_difficulty: row.install_difficulty,
                estimated_labor_hours: row.estimated_labor_hours,
                verified: row.verified,
                confidence: row.confidence,
                source_url:
                  row.source_url ||
                  (Array.isArray(row.parts?.source_urls) ? row.parts.source_urls[0] : null),
              },
            });
          }

          // Sort within category by verified/confidence and keep it small
          for (const [cat, arr] of partsByCategory.entries()) {
            arr.sort((a, b) => {
              const av = a.fitment.verified ? 1 : 0;
              const bv = b.fitment.verified ? 1 : 0;
              if (av !== bv) return bv - av;
              return Number(b.fitment.confidence || 0) - Number(a.fitment.confidence || 0);
            });
            partsByCategory.set(cat, arr.slice(0, 8));
          }
        }
      }
    } catch (err) {
      console.warn('[AL Tools] recommend_build parts enrichment failed:', err);
    }
  }

  // Map conceptual mod strings -> parts categories (best-effort)
  const modToPartsCategory = (mod) => {
    const m = String(mod || '').toLowerCase();
    if (m.includes('intake') || m.includes('inlet')) return 'intake';
    if (
      m.includes('exhaust') ||
      m.includes('cat-back') ||
      m.includes('catback') ||
      m.includes('downpipe') ||
      m.includes('header')
    )
      return 'exhaust';
    if (
      m.includes('tune') ||
      m.includes('ecu') ||
      m.includes('engine-tune') ||
      m.includes('software')
    )
      return 'tune';
    if (
      m.includes('coilover') ||
      m.includes('suspension') ||
      m.includes('sway') ||
      m.includes('alignment') ||
      m.includes('subframe')
    )
      return 'suspension';
    if (m.includes('brake')) return 'brakes';
    if (
      m.includes('cooling') ||
      m.includes('intercooler') ||
      m.includes('heat exchanger') ||
      m.includes('radiator') ||
      m.includes('oil cooler')
    )
      return 'cooling';
    if (m.includes('forced') || m.includes('turbo') || m.includes('supercharger'))
      return 'forced_induction';
    if (m.includes('fuel') || m.includes('ethanol') || m.includes('hpfp') || m.includes('injector'))
      return 'fuel_system';
    if (m.includes('wheel') || m.includes('tire')) return 'wheels_tires';
    return null;
  };

  for (const [stage, mods] of Object.entries(upgrades)) {
    const stageMods = mods
      .filter((mod) => !maintain_warranty || warrantySafe.some((safe) => mod.includes(safe)))
      .map((mod) => {
        const modInfo = upgradeDetails[mod];
        const partsCategory = modToPartsCategory(mod);
        const partOptions = partsCategory ? partsByCategory.get(partsCategory) || [] : [];
        return {
          name: modInfo?.name || mod,
          cost: modInfo?.cost?.range || 'Varies',
          expectedGains: modInfo?.expectedGains,
          difficulty: modInfo?.difficulty,
          partsCategory,
          partOptions: partOptions.slice(0, 3),
        };
      });

    recommendation.stages.push({
      name: stage,
      mods: stageMods,
    });
  }

  // Add car-specific notes
  recommendation.carNotes = {
    aftermarketSupport: car.aftermarket || car.score_aftermarket,
    trackCapability: car.track || car.score_track,
    reliability: car.reliability || car.score_reliability,
    recommendation:
      car.aftermarket >= 8
        ? 'Excellent aftermarket support - many options available for all upgrades.'
        : 'Consider researching specific parts availability for this platform.',
  };

  // Add tuning profile data if available from RPC
  if (tuningContext?.tuningProfile) {
    recommendation.tuningProfile = {
      platformStrengths: tuningContext.tuningProfile.platform_strengths,
      platformWeaknesses: tuningContext.tuningProfile.platform_weaknesses,
      performancePotential: tuningContext.tuningProfile.performance_potential,
      communityNotes: tuningContext.tuningProfile.tuning_community_notes,
    };
  }

  // Add dyno baseline if available
  if (tuningContext?.dynoBaseline) {
    recommendation.dynoBaseline = {
      peakWhp: tuningContext.dynoBaseline.peak_whp,
      peakWtq: tuningContext.dynoBaseline.peak_wtq,
      fuel: tuningContext.dynoBaseline.fuel,
      sourceUrl: tuningContext.dynoBaseline.source_url,
    };
  }

  if (guide) {
    recommendation.guideInfo = {
      name: guide.title,
      description: guide.summary,
    };
  }

  return recommendation;
}

// =============================================================================
// MAINTENANCE
// =============================================================================

/**
 * Get maintenance schedule and specs
 * @param {Object} params
 * @param {string} params.car_id - Car UUID identifier (required)
 * @param {string} [params.car_variant_key] - Optional car variant key
 * @param {number} [params.mileage] - Current mileage for relevant maintenance
 * @returns {Object} Maintenance information
 */
export async function getMaintenanceSchedule({ car_id, car_variant_key = null, mileage = null }) {
  if (!car_id) {
    return { error: 'car_id is required' };
  }

  // Resolve car_id to slug for fetchCarBySlug and RPC
  const carSlug = await getSlugFromCarId(car_id);
  if (!carSlug) {
    return { error: `Car not found: ${car_id}` };
  }

  const car = await fetchCarBySlug(carSlug);
  if (!car) {
    return { error: `Car not found: ${car_id}` };
  }

  const result = {
    carName: car.name,
    mileage,
    car_id,
    car_variant_key: car_variant_key || null,
  };

  // Try database for detailed specs (prefer summary RPC)
  /** @type {any} */
  let maintenanceSummary = null;
  if (isSupabaseConfigured && supabase) {
    try {
      if (car_variant_key) {
        const { data, error } = await supabase.rpc('get_car_maintenance_summary_variant', {
          p_variant_key: car_variant_key,
        });
        if (!error && data) maintenanceSummary = data;
      }

      if (!maintenanceSummary) {
        const { data, error } = await supabase.rpc('get_car_maintenance_summary', {
          p_car_slug: carSlug,
        });
        if (!error && data) maintenanceSummary = data;
      }
    } catch (err) {
      console.warn('[AL Tools] Error fetching maintenance summary:', err);
    }

    // Fallback: raw row (older environments)
    // Uses car.id since car_slug column no longer exists on vehicle_maintenance_specs
    if (!maintenanceSummary && car?.id) {
      try {
        const MAINT_COLS =
          'car_id, oil_type, oil_viscosity, oil_spec, oil_capacity_liters, oil_capacity_quarts, oil_change_interval_miles, oil_change_interval_months, oil_filter_oem_part, coolant_type, coolant_color, coolant_spec, coolant_capacity_liters, coolant_change_interval_miles, coolant_change_interval_years, brake_fluid_type, brake_fluid_spec, brake_fluid_change_interval_miles, brake_fluid_change_interval_years, fuel_type, fuel_octane_minimum, fuel_octane_recommended, trans_fluid_type, trans_fluid_spec, trans_fluid_interval_miles, diff_fluid_type, diff_fluid_spec, diff_fluid_interval_miles, spark_plug_type, spark_plug_gap, spark_plug_interval_miles, tire_pressure_front, tire_pressure_rear, air_filter_interval_miles, cabin_filter_interval_miles';
        const { data: specs } = await supabase
          .from('vehicle_maintenance_specs')
          .select(MAINT_COLS)
          .eq('car_id', car.id)
          .single();

        if (specs) {
          maintenanceSummary = {
            oil: {
              type: specs.oil_type || null,
              viscosity: specs.oil_viscosity || null,
              spec: specs.oil_spec || null,
              capacity_liters: specs.oil_capacity_liters ?? null,
              capacity_quarts: specs.oil_capacity_quarts ?? null,
              interval_miles: specs.oil_change_interval_miles ?? null,
              interval_months: specs.oil_change_interval_months ?? null,
              filter_oem_part: specs.oil_filter_oem_part || null,
            },
            coolant: {
              type: specs.coolant_type || null,
              color: specs.coolant_color || null,
              spec: specs.coolant_spec || null,
              capacity_liters: specs.coolant_capacity_liters ?? null,
              interval_miles: specs.coolant_change_interval_miles ?? null,
              interval_years: specs.coolant_change_interval_years ?? null,
            },
            brake_fluid: {
              type: specs.brake_fluid_type || null,
              spec: specs.brake_fluid_spec || null,
              interval_miles: specs.brake_fluid_change_interval_miles ?? null,
              interval_years: specs.brake_fluid_change_interval_years ?? null,
            },
            fuel: {
              type: specs.fuel_type || null,
              octane_minimum: specs.fuel_octane_minimum ?? null,
              octane_recommended: specs.fuel_octane_recommended ?? null,
              tank_capacity_gallons: specs.fuel_tank_capacity_gallons ?? null,
              tank_capacity_liters: specs.fuel_tank_capacity_liters ?? null,
            },
            tires: {
              size_front: specs.tire_size_front || null,
              size_rear: specs.tire_size_rear || null,
              pressure_front_psi: specs.tire_pressure_front_psi ?? null,
              pressure_rear_psi: specs.tire_pressure_rear_psi ?? null,
            },
          };
        }
      } catch (err) {
        console.warn('[AL Tools] Error fetching maintenance specs fallback:', err);
      }
    }
  }

  if (maintenanceSummary) {
    result.maintenanceSummary = maintenanceSummary;

    const oil = maintenanceSummary?.oil || null;
    const coolant = maintenanceSummary?.coolant || null;
    const brakeFluid = maintenanceSummary?.brake_fluid || null;
    const fuel = maintenanceSummary?.fuel || null;
    const tires = maintenanceSummary?.tires || null;

    result.fluids = {
      oil: oil
        ? {
            type: oil.type || null,
            viscosity: oil.viscosity || null,
            spec: oil.spec || null,
            capacity_liters: oil.capacity_liters ?? null,
            capacity_quarts: oil.capacity_quarts ?? null,
            interval_miles: oil.interval_miles ?? null,
            interval_months: oil.interval_months ?? null,
            filter_oem_part: oil.filter_oem_part || null,
          }
        : null,
      coolant: coolant
        ? {
            type: coolant.type || null,
            spec: coolant.spec || null,
            capacity_liters: coolant.capacity_liters ?? null,
            interval_miles: coolant.interval_miles ?? null,
            interval_years: coolant.interval_years ?? null,
          }
        : null,
      brake_fluid: brakeFluid
        ? {
            type: brakeFluid.type || null,
            spec: brakeFluid.spec || null,
            interval_years: brakeFluid.interval_years ?? null,
          }
        : null,
    };

    result.fuel = fuel
      ? {
          type: fuel.type || null,
          octane_minimum: fuel.octane_minimum ?? null,
          octane_recommended: fuel.octane_recommended ?? null,
          tank_capacity_gallons: fuel.tank_capacity_gallons ?? null,
        }
      : null;

    result.tires = tires
      ? {
          size_front: tires.size_front || null,
          size_rear: tires.size_rear || null,
          pressure_front_psi: tires.pressure_front_psi ?? null,
          pressure_rear_psi: tires.pressure_rear_psi ?? null,
        }
      : null;
  }

  // Add general schedule based on mileage
  if (mileage) {
    result.upcomingService = [];

    const intervals = [
      { interval: 7500, service: 'Oil Change', priority: 'high' },
      { interval: 15000, service: 'Brake Inspection', priority: 'medium' },
      {
        interval: 30000,
        service: 'Major Service (spark plugs, filters, fluids)',
        priority: 'high',
      },
      { interval: 60000, service: 'Timing/Accessory Belt Check', priority: 'high' },
    ];

    for (const item of intervals) {
      const nextDue = Math.ceil(mileage / item.interval) * item.interval;
      const milesUntilDue = nextDue - mileage;

      if (milesUntilDue <= item.interval) {
        result.upcomingService.push({
          service: item.service,
          dueAtMiles: nextDue,
          milesUntilDue,
          priority: milesUntilDue < 1000 ? 'urgent' : item.priority,
        });
      }
    }

    result.upcomingService.sort((a, b) => a.milesUntilDue - b.milesUntilDue);
  }

  // Add ownership cost info if available
  if (car.majorServiceCosts) {
    result.serviceCosts = car.majorServiceCosts;
  }
  if (car.annualOwnershipCost) {
    result.annualCost = car.annualOwnershipCost;
  }

  return result;
}

// =============================================================================
// COMMUNITY INSIGHTS (Forum Intelligence)
// =============================================================================

/**
 * Search community insights extracted from enthusiast forums.
 * These insights include known issues, maintenance tips, mod guides, buying advice,
 * and real-world ownership data from forums like Rennlist, Bimmerpost, etc.
 *
 * @param {Object} params - Search parameters
 * @param {string} params.query - Natural language query about the car topic
 * @param {string} [params.car_slug] - Optional car slug to filter results
 * @param {string[]} [params.insight_types] - Optional filter by type (known_issue, maintenance_tip, etc.)
 * @param {number} [params.limit] - Max results (default 5, max 10)
 * @returns {Object} Community insights with source citations
 */
export async function searchCommunityInsights({
  query,
  car_id = null,
  insight_types = null,
  limit = 5,
}) {
  const client = getDbClient({ requireServiceRole: true });
  if (!isSupabaseConfigured || !client) {
    return { error: 'Supabase not configured' };
  }
  if (!query) return { error: 'query is required' };

  const safeLimit = Math.max(1, Math.min(Number(limit) || 5, 10));

  try {
    // Resolve car_id to slug for RPC function
    const carSlug = car_id ? await getSlugFromCarId(car_id) : null;

    // Generate embedding for semantic search
    const { embedding, error: embedErr, model } = await generateQueryEmbedding(query);
    if (embedErr) {
      return {
        error: embedErr,
        message: 'Embeddings not available for community insights search.',
        query,
        car_id,
      };
    }

    const pgVec = vectorToPgVectorLiteral(embedding);
    if (!pgVec) return { error: 'Failed to format embedding vector' };

    // Call the semantic search RPC
    const { data: matches, error: searchErr } = await client.rpc('search_community_insights', {
      p_query_embedding: pgVec,
      p_car_slug: carSlug,
      p_insight_types: insight_types,
      p_limit: safeLimit,
      p_min_confidence: 0.5,
    });

    if (searchErr) throw searchErr;

    const results = Array.isArray(matches) ? matches : [];

    // Build fallback forum suggestions based on car context
    const forumsByBrand = {
      porsche: [
        {
          name: 'Rennlist',
          url: 'https://rennlist.com',
          description: 'Premier Porsche enthusiast community',
        },
        { name: 'Planet-9', url: 'https://planet-9.com', description: 'Cayman & Boxster focused' },
      ],
      bmw: [
        {
          name: 'Bimmerpost',
          url: 'https://bimmerpost.com',
          description: 'BMW M and enthusiast models',
        },
        {
          name: 'E46Fanatics',
          url: 'https://e46fanatics.com',
          description: 'E46 3-series specialists',
        },
      ],
      mazda: [
        { name: 'Miata.net', url: 'https://forum.miata.net', description: 'MX-5 Miata community' },
      ],
      toyota: [
        { name: 'FT86Club', url: 'https://ft86club.com', description: 'GR86/BRZ community' },
        { name: 'SupraMKV', url: 'https://supramkv.com', description: 'A90/A91 Supra focused' },
      ],
      chevrolet: [
        {
          name: 'Corvette Forum',
          url: 'https://corvetteforum.com',
          description: 'All generations of Corvette',
        },
      ],
      nissan: [
        { name: '370Z Forum', url: 'https://the370z.com', description: 'Z-car enthusiasts' },
        { name: 'GT-R Life', url: 'https://gtrlife.com', description: 'R35 GT-R community' },
      ],
    };

    // Detect brand from car slug for forum suggestions
    let suggestedForums = [];
    if (carSlug) {
      const slugLower = carSlug.toLowerCase();
      for (const [brand, forums] of Object.entries(forumsByBrand)) {
        if (
          slugLower.includes(brand) ||
          (brand === 'porsche' &&
            (slugLower.includes('911') ||
              slugLower.includes('cayman') ||
              slugLower.includes('boxster') ||
              slugLower.includes('gt4') ||
              slugLower.includes('gt3'))) ||
          (brand === 'bmw' &&
            (slugLower.includes('m3') || slugLower.includes('m4') || slugLower.includes('m2'))) ||
          (brand === 'mazda' && slugLower.includes('miata')) ||
          (brand === 'toyota' && (slugLower.includes('supra') || slugLower.includes('gr86'))) ||
          (brand === 'chevrolet' && slugLower.includes('corvette'))
        ) {
          suggestedForums = forums;
          break;
        }
      }
    }

    // Add general forums as fallback
    const generalForums = [
      {
        name: 'Reddit r/cars',
        url: 'https://reddit.com/r/cars',
        description: 'General automotive discussion',
      },
      {
        name: '6SpeedOnline',
        url: 'https://6speedonline.com',
        description: 'Sports car enthusiasts',
      },
    ];

    // Include fallback guidance when results are sparse
    const hasNoResults = results.length === 0;
    const fallbackGuidance = hasNoResults
      ? {
          noResultsReason:
            'Our community insights database may not have indexed discussions on this specific topic yet.',
          suggestedForums:
            suggestedForums.length > 0
              ? [...suggestedForums, ...generalForums.slice(0, 1)]
              : generalForums,
          searchTip: `Try searching "${query}${carSlug ? ' ' + carSlug : ''}" on the suggested forums for real owner experiences.`,
        }
      : null;

    return {
      query,
      car_id,
      embeddingModel: model,
      count: results.length,
      results: results.map((r) => ({
        id: r.id,
        type: r.insight_type,
        title: r.title,
        summary: r.summary,
        details: r.details,
        car: r.car_slug,
        confidence: r.confidence,
        consensus: r.consensus_strength,
        forum: r.source_forum,
        sourceUrls: r.source_urls,
        similarity: r.similarity,
      })),
      ...(fallbackGuidance && { fallback: fallbackGuidance }),
      instruction: hasNoResults
        ? 'No indexed insights found. Guide the user to the suggested forums for this topic, or try broadening the query.'
        : 'These insights come from enthusiast forum discussions. When citing, mention the source forum and link to source URLs when available. Note the confidence level.',
      availableTypes: [
        'known_issue', // Common problems, failure patterns
        'maintenance_tip', // Service intervals, DIY procedures
        'modification_guide', // How-to guides for mods
        'troubleshooting', // Diagnostic steps, solutions
        'buying_guide', // PPI checklists, what to look for
        'performance_data', // Dyno numbers, lap times
        'reliability_report', // Long-term ownership experiences
        'cost_insight', // Real maintenance/repair costs
        'comparison', // Owner comparisons between models
      ],
    };
  } catch (err) {
    console.error('[AL Tools] search_community_insights failed:', err);
    return { error: err.message || 'Community insights search failed' };
  }
}

// =============================================================================
// WEB SEARCH (Exa AI)
// =============================================================================

const EXA_API_KEY = process.env.EXA_API_KEY;

/**
 * Search the web using Exa AI for real-time automotive information.
 *
 * Use this for questions requiring current/recent information that may not
 * be in our database, such as:
 * - Recent news about a car model
 * - Current market conditions or pricing trends
 * - New product announcements
 * - Recent recalls or issues
 *
 * @param {Object} params - Search parameters
 * @param {string} params.query - Search query (required)
 * @param {string} [params.car_context] - Car name/slug for context
 * @param {number} [params.limit] - Max results (default 5, max 10)
 * @returns {Object} Web search results with source URLs
 */
export async function searchWeb({ query, car_context = null, limit = 5 }) {
  if (!query) {
    return { error: 'query is required' };
  }

  if (!EXA_API_KEY) {
    return {
      error: 'Web search not configured',
      message: 'EXA_API_KEY not set. Web search is unavailable.',
      suggestion: 'Use search_community_insights for forum-sourced information instead.',
    };
  }

  const searchQuery = car_context ? `${query} ${car_context}` : query;
  const safeLimit = Math.max(1, Math.min(Number(limit) || 5, 10));

  try {
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': EXA_API_KEY,
      },
      body: JSON.stringify({
        query: `${searchQuery} automotive car`,
        num_results: safeLimit,
        use_autoprompt: true,
        type: 'auto',
        contents: {
          text: { max_characters: 800 },
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Exa API error: ${response.status}`);
    }

    const data = await response.json();
    const results = data.results || [];

    if (results.length === 0) {
      return {
        query: searchQuery,
        count: 0,
        results: [],
        message:
          'No results found. Try rephrasing your query or use search_community_insights for forum-sourced data.',
      };
    }

    return {
      query: searchQuery,
      count: results.length,
      results: results.map((r) => ({
        title: r.title,
        url: r.url,
        excerpt: r.text?.slice(0, 500) || r.snippet,
        publishedDate: r.published_date,
        score: r.score,
      })),
      instruction:
        'These are live web results. Always cite the source URL when using this information. Verify critical claims against our database.',
    };
  } catch (err) {
    console.error('[AL Tools] search_web failed:', err);
    return {
      error: err.message || 'Web search failed',
      suggestion: 'Try using search_community_insights or search_knowledge instead.',
    };
  }
}

/**
 * Read and extract content from a specific URL.
 *
 * Use this when a user shares a link and wants you to read/summarize it.
 * Examples:
 * - "Can you read this article?" + URL
 * - "What does this forum thread say about X?" + URL
 * - "Summarize this page for me" + URL
 *
 * Uses Exa's /contents endpoint which handles:
 * - Live crawling with cache fallback
 * - Clean text extraction
 * - Optional AI-powered summary
 *
 * @param {Object} params - Parameters
 * @param {string} params.url - The URL to read (required)
 * @param {string} [params.focus] - Optional focus topic for summary
 * @param {boolean} [params.include_summary] - Include AI summary (default: true)
 * @returns {Object} Extracted content with title, text, and optional summary
 */
export async function readUrl({ url, focus = null, include_summary = true }) {
  if (!url) {
    return { error: 'url is required' };
  }

  // Validate URL format
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return { error: 'Invalid URL: must be http or https' };
    }
  } catch {
    return { error: 'Invalid URL format' };
  }

  if (!EXA_API_KEY) {
    return {
      error: 'URL reading not configured',
      message: 'EXA_API_KEY not set. Cannot read URLs.',
      suggestion: 'Try using search_web to find information about this topic instead.',
    };
  }

  try {
    // Build request body for Exa /contents endpoint
    const requestBody = {
      urls: [url],
      text: {
        max_characters: 15000, // Enough for most articles, keeps token cost reasonable
      },
      livecrawl: 'preferred', // Try live crawl first, fall back to cache
      livecrawlTimeout: 15000, // 15 second timeout
    };

    // Add summary if requested
    if (include_summary) {
      requestBody.summary = focus ? { query: focus } : true;
    }

    const response = await fetch('https://api.exa.ai/contents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': EXA_API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Exa API error: ${response.status}`);
    }

    const data = await response.json();

    // Check status for the URL
    const status = data.statuses?.find((s) => s.id === url);
    if (status?.status === 'error') {
      const errorTag = status.error?.tag || 'UNKNOWN';
      const httpCode = status.error?.httpStatusCode;

      if (errorTag === 'CRAWL_NOT_FOUND' || httpCode === 404) {
        return {
          error: 'Page not found',
          url,
          message: 'The URL returned a 404 error. The page may have been moved or deleted.',
        };
      }
      if (errorTag === 'CRAWL_BLOCKED' || httpCode === 403) {
        return {
          error: 'Access blocked',
          url,
          message: 'The website blocked access. This is common for paywalled or protected content.',
        };
      }
      return {
        error: `Failed to fetch URL: ${errorTag}`,
        url,
        httpStatusCode: httpCode,
      };
    }

    const result = data.results?.[0];
    if (!result) {
      return {
        error: 'No content extracted',
        url,
        message:
          'Could not extract content from this URL. The page may be empty or use unsupported formatting.',
      };
    }

    // Format the response
    const content = {
      url: result.url || url,
      title: result.title || 'Untitled',
      author: result.author || null,
      publishedDate: result.publishedDate || null,
      text: result.text || null,
      summary: result.summary || null,
      wordCount: result.text ? result.text.split(/\s+/).length : 0,
    };

    // Truncate very long text to keep token costs reasonable
    if (content.text && content.text.length > 12000) {
      content.text =
        content.text.slice(0, 12000) + '\n\n[Content truncated - full article is longer]';
      content.truncated = true;
    }

    return {
      success: true,
      ...content,
      instruction:
        'This is the extracted content from the URL. Always cite the source URL when referencing this information. If the user asked about a specific topic, focus your response on that aspect of the content.',
    };
  } catch (err) {
    console.error('[AL Tools] read_url failed:', err);
    return {
      error: err.message || 'Failed to read URL',
      url,
      suggestion:
        'The page may be unavailable or protected. Try using search_web to find similar information.',
    };
  }
}

// =============================================================================
// LIVE PARTS RESEARCH - Simplified AI-First Approach
// =============================================================================
//
// DESIGN PHILOSOPHY:
// 1. Cast a wide net via web search - no domain restrictions
// 2. Let AI analyze and curate results - no hardcoded scoring
// 3. Persist discovered parts to database for organic growth
// 4. Return raw results with context for AI to process
//

/**
 * Map upgrade types to database categories (simplified)
 */
const UPGRADE_CATEGORY_MAP = {
  // Intake
  intake: 'intake',
  'cold air intake': 'intake',
  'cold-air-intake': 'intake',
  cai: 'intake',

  // Exhaust
  exhaust: 'exhaust',
  'cat-back': 'exhaust',
  catback: 'exhaust',
  downpipe: 'exhaust',
  headers: 'exhaust',

  // Forced Induction
  turbo: 'forced_induction',
  supercharger: 'forced_induction',
  intercooler: 'cooling',

  // Suspension
  coilovers: 'suspension',
  suspension: 'suspension',
  'lowering springs': 'suspension',
  shocks: 'suspension',
  sway: 'suspension',

  // Brakes
  brakes: 'brakes',
  'big brake kit': 'brakes',
  'brake pads': 'brakes',
  rotors: 'brakes',

  // Wheels
  wheels: 'wheels_tires',
  tires: 'wheels_tires',

  // Tune
  tune: 'tune',
  'ecu tune': 'tune',
  tuner: 'tune',
  'stage 1': 'tune',
  'stage 1 tune': 'tune',
  'stage 2': 'tune',
  'stage 2 tune': 'tune',
};

/**
 * Query existing parts from database for a car and upgrade type
 * Returns parts we already know about for context
 */
async function queryExistingParts(carId, upgradeType) {
  if (!carId) return [];

  const client = getDbClient();
  const category = UPGRADE_CATEGORY_MAP[upgradeType?.toLowerCase()] || upgradeType;

  try {
    const { data, error } = await client
      .from('part_fitments')
      .select(
        `
        id,
        fitment_notes,
        confidence,
        verified,
        source_url,
        parts!inner(
          id,
          name,
          brand_name,
          part_number,
          category,
          description,
          quality_tier,
          source_urls
        )
      `
      )
      .eq('car_id', carId)
      .eq('parts.category', category)
      .eq('parts.is_active', true)
      .order('confidence', { ascending: false })
      .limit(20);

    if (error) {
      console.warn('[queryExistingParts] Error:', error.message);
      return [];
    }

    // Get latest pricing for these parts
    const partIds = data?.map((d) => d.parts?.id).filter(Boolean) || [];
    const priceMap = new Map();

    if (partIds.length > 0) {
      const { data: prices } = await client
        .from('part_pricing_snapshots')
        .select('part_id, price_cents, vendor_name, product_url, recorded_at')
        .in('part_id', partIds)
        .order('recorded_at', { ascending: false });

      for (const p of prices || []) {
        if (!priceMap.has(p.part_id)) {
          priceMap.set(p.part_id, p);
        }
      }
    }

    return (data || []).map((d) => {
      const price = priceMap.get(d.parts?.id);
      return {
        id: d.parts?.id,
        name: d.parts?.name,
        brand: d.parts?.brand_name,
        part_number: d.parts?.part_number,
        category: d.parts?.category,
        quality_tier: d.parts?.quality_tier,
        description: d.parts?.description,
        confidence: d.confidence,
        verified: d.verified,
        price: price ? price.price_cents / 100 : null,
        price_url: price?.product_url,
        vendor: price?.vendor_name,
        source: 'database',
      };
    });
  } catch (err) {
    console.error('[queryExistingParts] Error:', err);
    return [];
  }
}

/**
 * Extract friendly site names from search results for progress display
 * @param {Array} results - Array of search results with URLs
 * @returns {Array<string>} Array of friendly site names
 */
function extractSiteNames(results) {
  const siteNames = new Set();
  const friendlyNames = {
    'reddit.com': 'Reddit',
    'audizine.com': 'Audizine',
    'bimmerpost.com': 'Bimmerpost',
    'rennlist.com': 'Rennlist',
    'e90post.com': 'E90Post',
    '6speedonline.com': '6SpeedOnline',
    'mustang6g.com': 'Mustang6G',
    'camaro6.com': 'Camaro6',
    'civicx.com': 'CivicX',
    'ft86club.com': 'FT86Club',
    'fabspeed.com': 'Fabspeed',
    'ecs-tuning.com': 'ECS Tuning',
    'ecstuning.com': 'ECS Tuning',
    'fcpeuro.com': 'FCP Euro',
    'milltek.co.uk': 'Milltek',
    'milltek.com': 'Milltek',
    'akrapovic.com': 'Akrapovic',
    'borla.com': 'Borla',
    'awe-tuning.com': 'AWE Tuning',
    'awetuning.com': 'AWE Tuning',
    '034motorsport.com': '034 Motorsport',
    'unitronic-chipped.com': 'Unitronic',
    'goapr.com': 'APR',
    'integrated-engineering.com': 'IE',
    'cobb.com': 'COBB',
    'cobbtuning.com': 'COBB',
    'summitracing.com': 'Summit Racing',
    'amazon.com': 'Amazon',
    'youtube.com': 'YouTube',
    'carid.com': 'CARiD',
    'moddedeuros.com': 'ModdedEuros',
    'turnermotorsport.com': 'Turner',
    'kiesracing.com': 'Kies Racing',
  };

  for (const r of results || []) {
    try {
      if (!r?.url) continue;
      const url = new URL(r.url);
      const domain = url.hostname.replace('www.', '').toLowerCase();

      // Check for exact match first
      if (friendlyNames[domain]) {
        siteNames.add(friendlyNames[domain]);
      } else {
        // Try to find partial match (e.g., fcpeuro.com matches fcpeuro)
        const matchedKey = Object.keys(friendlyNames).find((key) =>
          domain.includes(key.split('.')[0])
        );
        if (matchedKey) {
          siteNames.add(friendlyNames[matchedKey]);
        } else {
          // Capitalize first part of domain as fallback
          const siteName = domain.split('.')[0];
          if (siteName.length > 2) {
            siteNames.add(siteName.charAt(0).toUpperCase() + siteName.slice(1));
          }
        }
      }
    } catch (e) {
      // Skip invalid URLs
    }
  }

  return Array.from(siteNames).slice(0, 4); // Return top 4 site names
}

/**
 * User-friendly labels for search types
 */
const SEARCH_LABELS = {
  best_recommendations: 'Finding recommendations',
  forum_discussions: 'Searching forums',
  shopping_results: 'Checking vendors',
  product_listings: 'Finding products',
  platform_specific: 'Platform-specific search',
};

/**
 * Do wide-net web research via Exa - no domain restrictions
 * Searches multiple angles to find comprehensive results
 * @param {Object} carInfo - Car information
 * @param {string} upgradeType - Type of upgrade to search for
 * @param {number} budgetMin - Minimum budget
 * @param {number} budgetMax - Maximum budget
 * @param {Function} onProgress - Optional callback for progress updates
 */
async function doWebResearch(carInfo, upgradeType, budgetMin, budgetMax, onProgress) {
  if (!EXA_API_KEY) {
    return { error: 'EXA_API_KEY not configured', results: [] };
  }

  const carContext = [carInfo.year, carInfo.make, carInfo.model].filter(Boolean).join(' ');
  const budgetHint = budgetMax ? ` under $${budgetMax}` : '';

  // Include platform code in searches when available (e.g., "S550", "E46", "987")
  const platformCode = carInfo.platformCode || '';
  const platformHint = platformCode ? ` ${platformCode}` : '';

  // 5 parallel searches - cast a wide net with platform-specific query
  const searches = [
    // 1. General "best" search - reviews and recommendations
    {
      query: `best ${upgradeType} for ${carContext}${platformHint} 2024 2025`,
      num_results: 15,
      label: 'best_recommendations',
    },
    // 2. Comparison/review search - forum discussions
    {
      query: `${carContext}${platformHint} ${upgradeType} comparison review reddit forum`,
      num_results: 12,
      label: 'forum_discussions',
    },
    // 3. Shopping search - find actual products with prices
    {
      query: `${carContext}${platformHint} ${upgradeType} buy price${budgetHint}`,
      num_results: 12,
      label: 'shopping_results',
    },
    // 4. Specific product search with fitment focus
    {
      query: `${upgradeType} ${carInfo.model || carInfo.make}${platformHint} compatible fits`,
      num_results: 10,
      label: 'product_listings',
    },
    // 5. Platform-specific search (if we have a platform code)
    ...(platformCode
      ? [
          {
            query: `${platformCode} ${upgradeType} ${carInfo.make} performance parts`,
            num_results: 10,
            label: 'platform_specific',
          },
        ]
      : []),
  ];

  console.log(
    `[doWebResearch] Searching ${searches.length} queries for: ${carContext} ${upgradeType}` +
      (platformCode ? ` (Platform: ${platformCode})` : '')
  );

  try {
    // Execute searches with progress reporting
    // We run searches in PARALLEL for speed (~2-3s total instead of 8-10s sequential)
    // But we only report each search when it COMPLETES - this creates a natural
    // "items appearing one by one" effect without artificial "all starting at once" spinners
    //
    // UX flow:
    // 1. Parent tool "Searching parts vendors..." shows with spinner
    // 2. As each search completes, it appears as a sub-step with checkmark
    // 3. No fake "all starting at once" spinners - only show what's actually done
    const searchResults = [];
    const completedSearches = new Set();

    // Create promises that report progress only when complete
    // Each search runs in parallel but reports completion independently
    const searchPromises = searches.map(async (s) => {
      try {
        const response = await fetch('https://api.exa.ai/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': EXA_API_KEY,
          },
          body: JSON.stringify({
            query: s.query,
            num_results: s.num_results,
            use_autoprompt: true,
            type: 'auto',
            contents: { text: { max_characters: 1200 } },
          }),
        });
        const r = await response.json();
        const result = {
          source: s.label,
          query: s.query,
          results: r.results || [],
          error: r.error,
        };

        // Report COMPLETION for this search (not "running" - only completed states)
        // This creates a natural "items appearing one by one" effect
        completedSearches.add(s.label);
        if (onProgress) {
          const sites = extractSiteNames(result.results);
          onProgress({
            step: s.label,
            stepLabel: SEARCH_LABELS[s.label] || s.label,
            status: 'completed',
            sites: sites,
            resultCount: result.results?.length || 0,
            completedCount: completedSearches.size,
            totalCount: searches.length,
          });
        }

        return result;
      } catch (e) {
        completedSearches.add(s.label);
        if (onProgress) {
          onProgress({
            step: s.label,
            stepLabel: SEARCH_LABELS[s.label] || s.label,
            status: 'error',
            error: e.message,
            completedCount: completedSearches.size,
            totalCount: searches.length,
          });
        }
        return {
          source: s.label,
          query: s.query,
          results: [],
          error: e.message,
        };
      }
    });

    // Run all searches in parallel - each reports when done
    const results = await Promise.all(searchPromises);
    searchResults.push(...results);

    // Flatten and normalize results
    const allResults = [];
    const seenUrls = new Set();

    for (const search of searchResults) {
      for (const result of search.results) {
        // Deduplicate by URL
        if (result.url && !seenUrls.has(result.url)) {
          seenUrls.add(result.url);
          allResults.push({
            title: result.title || '',
            url: result.url,
            text: result.text || '',
            published_date: result.publishedDate,
            source_type: search.source,
            search_query: search.query,
          });
        }
      }
    }

    return {
      car_context: carContext,
      upgrade_type: upgradeType,
      searches_performed: searches.length,
      total_results: allResults.length,
      results: allResults,
      search_details: searchResults.map((s) => ({
        source: s.source,
        query: s.query,
        count: s.results?.length || 0,
        error: s.error,
      })),
    };
  } catch (err) {
    console.error('[doWebResearch] Error:', err);
    return {
      error: err.message,
      results: [],
    };
  }
}

/**
 * Extract parts data from AI response and save to database.
 * Looks for <parts_to_save> JSON block in the response.
 * This is the canonical function for parts extraction - used by both multi-agent and monolithic paths.
 *
 * IMPORTANT: This function can resolve the car ID from the car_slug in the response
 * if carId is not provided directly. This enables parts saving even when the user
 * isn't on a specific car page.
 *
 * @param {string} responseText - The full AI response text (BEFORE formatting/stripping)
 * @param {string|null} carId - The car ID for fitment (optional - will resolve from car_slug if not provided)
 * @param {string} correlationId - For logging
 * @param {string} [conversationId] - Optional conversation ID for recommendation tracking
 */
export async function extractAndSavePartsFromResponse(
  responseText,
  carId,
  correlationId,
  conversationId
) {
  if (!responseText) return;

  try {
    // Look for <parts_to_save> JSON block
    const partsMatch = responseText.match(/<parts_to_save>\s*([\s\S]*?)\s*<\/parts_to_save>/i);

    // If no <parts_to_save> block, try fallback extraction from response content
    if (!partsMatch || !partsMatch[1]) {
      // Check if response looks like it has parts recommendations
      const hasPartsContent =
        /\*\*\d\)\s+[A-Za-z].+\*\*/m.test(responseText) &&
        /\*\*Price:\*\*\s*\$[\d,]+/i.test(responseText);

      if (hasPartsContent) {
        console.warn(
          `[alTools:${correlationId}] MISSING <parts_to_save> block - response has parts content but AI did not output JSON. ` +
            `Attempting fallback extraction...`
        );

        // Try fallback extraction from markdown format
        const fallbackParts = extractPartsFromMarkdown(responseText, correlationId);
        if (fallbackParts && fallbackParts.length > 0) {
          console.log(
            `[alTools:${correlationId}] Fallback extraction found ${fallbackParts.length} parts from markdown`
          );

          // Use the fallback data
          await processParsedParts(fallbackParts, null, null, carId, correlationId, conversationId);
        } else {
          console.warn(
            `[alTools:${correlationId}] Fallback extraction failed - no parts recovered. ` +
              `Consider improving prompt compliance for <parts_to_save>.`
          );
        }
      }
      return;
    }

    let parsedData;
    try {
      parsedData = JSON.parse(partsMatch[1].trim());
    } catch (parseErr) {
      console.warn(
        `[alTools:${correlationId}] Failed to parse parts_to_save JSON:`,
        parseErr.message
      );
      return;
    }

    // Handle both old format (array) and new format (object with upgrade_key and car_slug)
    let partsData;
    let upgradeKey;
    let carSlug;

    if (Array.isArray(parsedData)) {
      // Old format: just an array of parts
      partsData = parsedData;
      upgradeKey = null;
      carSlug = null;
    } else if (parsedData && typeof parsedData === 'object') {
      // New format: { car_slug: "...", upgrade_key: "...", parts: [...] }
      partsData = parsedData.parts || [];
      upgradeKey = parsedData.upgrade_key || null;
      carSlug = parsedData.car_slug || null;
    } else {
      console.warn(`[alTools:${correlationId}] Unexpected parts_to_save format`);
      return;
    }

    if (!partsData || partsData.length === 0) return;

    await processParsedParts(partsData, upgradeKey, carSlug, carId, correlationId, conversationId);
  } catch (err) {
    // Non-critical - don't throw
    console.warn(`[alTools:${correlationId}] Parts extraction error:`, err.message);
  }
}

/**
 * Process parsed parts data and save to database
 * Used by both <parts_to_save> extraction and fallback markdown extraction
 */
async function processParsedParts(
  partsData,
  upgradeKey,
  carSlug,
  carId,
  correlationId,
  conversationId
) {
  // Resolve car ID if not provided directly but car_slug is available
  let resolvedCarId = carId;
  if (!resolvedCarId && carSlug) {
    console.log(
      `[alTools:${correlationId}] No carId provided, resolving from car_slug: ${carSlug}`
    );
    try {
      resolvedCarId = await resolveCarId(carSlug);
      if (resolvedCarId) {
        console.log(
          `[alTools:${correlationId}] Resolved car_slug "${carSlug}" to carId: ${resolvedCarId}`
        );
      } else {
        console.warn(
          `[alTools:${correlationId}] Could not resolve car_slug "${carSlug}" to a car ID`
        );
      }
    } catch (resolveErr) {
      console.warn(`[alTools:${correlationId}] Error resolving car_slug:`, resolveErr.message);
    }
  }

  // If we still don't have a car ID, we can't save fitments - log and return
  if (!resolvedCarId) {
    console.warn(
      `[alTools:${correlationId}] Cannot save parts - no car ID available. ` +
        `carId: ${carId}, car_slug: ${carSlug}`
    );
    return;
  }

  console.log(
    `[alTools:${correlationId}] Extracting ${partsData.length} parts to save for car ${resolvedCarId}` +
      (upgradeKey ? ` (upgrade: ${upgradeKey})` : '')
  );

  // Save parts async (don't await - fire and forget)
  persistResearchResults(resolvedCarId, partsData, { upgradeKey, conversationId })
    .then((result) => {
      if (result.saved > 0) {
        console.log(`[alTools:${correlationId}] Saved ${result.saved} new parts to database`);
      }
      if (result.recommendations > 0) {
        console.log(
          `[alTools:${correlationId}] Saved ${result.recommendations} recommendations for ${upgradeKey}`
        );
      }
      if (result.errors?.length > 0) {
        console.warn(`[alTools:${correlationId}] Part save errors:`, result.errors);
      }
    })
    .catch((err) => {
      console.error(`[alTools:${correlationId}] Failed to persist parts:`, err.message);
    });
}

/**
 * Fallback extraction: Parse parts from markdown response when <parts_to_save> is missing
 *
 * Expected format:
 * **1) Brand Product Name** - LABEL
 * - **Price:** $XXX
 * - **Buy here:** [Vendor](url)
 * - **Why:** Reason
 */
function extractPartsFromMarkdown(responseText, correlationId) {
  const parts = [];

  try {
    // Match product entries like "**1) Borla ATAK Cat-Back Exhaust** - TOP CHOICE"
    // or "### **1) Brand Product** - RECOMMENDED"
    const productPattern = /(?:###?\s*)?\*\*(\d)\)\s*([^*]+)\*\*\s*-?\s*([A-Z\s]+)?/gm;
    let match;

    while ((match = productPattern.exec(responseText)) !== null) {
      const rank = parseInt(match[1], 10);
      const fullName = match[2].trim();

      // Extract the section for this product (until next product or end)
      const sectionStart = match.index;
      const nextMatch = productPattern.exec(responseText);
      const sectionEnd = nextMatch ? nextMatch.index : responseText.length;
      productPattern.lastIndex = match.index + match[0].length; // Reset to continue from current

      const section = responseText.slice(sectionStart, sectionEnd);

      // Parse brand and product name (e.g., "Borla ATAK Cat-Back Exhaust")
      // Common brands to help with parsing
      const knownBrands = [
        'Borla',
        'MBRP',
        'AWE',
        'Flowmaster',
        'MagnaFlow',
        'Akrapovic',
        'APR',
        'Unitronic',
        'IE',
        '034',
        'Cobb',
        'K&N',
        'AEM',
        'HKS',
        'Injen',
        'AFE',
        'KW',
        'Bilstein',
        'Ohlins',
        'BC Racing',
        'Fortune Auto',
        'Brembo',
        'StopTech',
        'ECS',
        'Milltek',
        'Downstar',
        'Forge',
        'GFB',
        'Turbosmart',
        'DeatschWerks',
        'Aeromotive',
        'Walbro',
        'BBK',
        'Fore',
      ];

      let brandName = '';
      let productName = fullName;

      for (const brand of knownBrands) {
        if (fullName.toLowerCase().startsWith(brand.toLowerCase())) {
          brandName = brand;
          productName = fullName.slice(brand.length).trim();
          break;
        }
      }

      // If no known brand matched, try to split on first space
      if (!brandName && fullName.includes(' ')) {
        const parts = fullName.split(' ');
        brandName = parts[0];
        productName = parts.slice(1).join(' ');
      }

      // Extract price: **Price:** $1,260-$1,345 or **Price:** $1,299
      const priceMatch = section.match(/\*\*Price:\*\*\s*\$?([\d,]+)(?:\s*-\s*\$?([\d,]+))?/i);
      let price = null;
      if (priceMatch) {
        // Use the first (lowest) price
        price = parseInt(priceMatch[1].replace(/,/g, ''), 10);
      }

      // Extract URL: [Vendor](url) or **Buy here:** [Text](url)
      const urlMatch = section.match(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/);
      let sourceUrl = null;
      if (urlMatch) {
        sourceUrl = urlMatch[2];
      }

      // Extract "Why" explanation
      const whyMatch = section.match(/\*\*Why:\*\*\s*([^\n*]+)/i);
      const whyRecommended = whyMatch ? whyMatch[1].trim() : null;

      // Extract "Best for"
      const bestForMatch = section.match(/\*\*Best for:\*\*\s*([^\n*]+)/i);
      const bestFor = bestForMatch ? bestForMatch[1].trim() : null;

      // Only add if we have meaningful data
      if (brandName && productName && (price || sourceUrl)) {
        parts.push({
          brand_name: brandName,
          product_name: productName,
          price: price,
          source_url: sourceUrl,
          why_recommended: whyRecommended,
          best_for: bestFor,
          rank: rank,
          quality_tier: 'mid', // Default, can't reliably extract
          category: 'other', // Would need context to determine
        });
      }
    }

    console.log(`[alTools:${correlationId}] Markdown extraction found ${parts.length} parts`);
    return parts;
  } catch (err) {
    console.warn(`[alTools:${correlationId}] Markdown extraction error:`, err.message);
    return [];
  }
}

/**
 * Persist discovered parts to database for organic growth
 * Called async after returning response to user
 *
 * Saves to all 4 tables:
 * 1. parts - Core part info
 * 2. part_fitments - Links part to car
 * 3. part_pricing_snapshots - Price at vendor
 * 4. al_part_recommendations - Ranked recommendations for display in tiles
 *
 * @param {string} carId - The car UUID
 * @param {Array} extractedParts - Array of part objects from AI response
 * @param {Object} options - Additional options
 * @param {string} [options.upgradeKey] - The upgrade key (e.g., "cold-air-intake")
 * @param {string} [options.conversationId] - The conversation UUID that generated these recommendations
 */
export async function persistResearchResults(carId, extractedParts, options = {}) {
  const { upgradeKey, conversationId } = options;

  if (!carId || !extractedParts?.length) {
    return { saved: 0, errors: [], recommendations: 0 };
  }

  const client = getDbClient({ requireServiceRole: true });
  const saved = [];
  const errors = [];
  const recommendationsSaved = [];

  for (const part of extractedParts) {
    try {
      // Skip if missing essential data
      if (!part.brand_name || !part.product_name) {
        console.warn('[persistResearchResults] Skipping part - missing brand_name or product_name');
        continue;
      }

      // Normalize the product name for consistent matching
      const normalizedName = part.product_name.trim();
      const normalizedBrand = part.brand_name.trim();

      // 1. Check if part already exists (robust deduplication)
      // First try exact match on brand + name
      let { data: existingPart } = await client
        .from('parts')
        .select('id, source_urls, attributes, description')
        .eq('brand_name', normalizedBrand)
        .ilike('name', normalizedName)
        .limit(1)
        .maybeSingle();

      // If not found and we have a part_number, try that
      if (!existingPart && part.part_number) {
        const { data: byPartNumber } = await client
          .from('parts')
          .select('id, source_urls, attributes, description')
          .eq('brand_name', normalizedBrand)
          .eq('part_number', part.part_number)
          .limit(1)
          .maybeSingle();
        existingPart = byPartNumber;
      }

      // If still not found, try fuzzy match on name (first 25 chars)
      if (!existingPart) {
        const { data: fuzzyMatch } = await client
          .from('parts')
          .select('id, source_urls, attributes, description')
          .eq('brand_name', normalizedBrand)
          .ilike('name', `${normalizedName.slice(0, 25)}%`)
          .limit(1)
          .maybeSingle();
        existingPart = fuzzyMatch;
      }

      let partId;

      if (existingPart) {
        // Part exists - update with new data if available
        partId = existingPart.id;

        // Build update object with any new data
        const updateData = {};

        // Update source_urls if we have a new URL
        if (part.source_url && !existingPart.source_urls?.includes(part.source_url)) {
          updateData.source_urls = [...(existingPart.source_urls || []), part.source_url];
        }

        // Enrich with AL research data if we have it and part is missing it
        if (part.why_recommended || part.differentiator || part.best_for) {
          const existingAttrs = existingPart.attributes || {};
          const newAttrs = { ...existingAttrs };

          // Only add new data, don't overwrite existing
          if (part.why_recommended && !existingAttrs.why_recommended) {
            newAttrs.why_recommended = part.why_recommended;
          }
          if (part.differentiator && !existingAttrs.differentiator) {
            newAttrs.differentiator = part.differentiator;
          }
          if (part.best_for && !existingAttrs.best_for) {
            newAttrs.best_for = part.best_for;
          }
          if (part.fitment_confidence && !existingAttrs.fitment_confidence) {
            newAttrs.fitment_confidence = part.fitment_confidence;
          }
          if (part.platform_codes?.length && !existingAttrs.platform_codes) {
            newAttrs.platform_codes = part.platform_codes;
          }

          // Only update if we added something new
          if (Object.keys(newAttrs).length > Object.keys(existingAttrs).length) {
            newAttrs.enriched_at = new Date().toISOString();
            updateData.attributes = newAttrs;
          }

          // Update description if missing
          if (part.why_recommended && !existingPart.description) {
            updateData.description = part.why_recommended;
          }
        }

        // Apply updates if any
        if (Object.keys(updateData).length > 0) {
          await client.from('parts').update(updateData).eq('id', partId);
          console.log(
            `[persistResearchResults] Enriched existing part: ${normalizedBrand} ${normalizedName}`
          );
        } else {
          console.log(
            `[persistResearchResults] Found existing part (no updates): ${normalizedBrand} ${normalizedName}`
          );
        }
      } else {
        // Insert new part with rich AL research data
        const category =
          UPGRADE_CATEGORY_MAP[part.category?.toLowerCase()] || part.category || 'other';

        // Build attributes object with rich research data
        const attributes = {};
        if (part.why_recommended) attributes.why_recommended = part.why_recommended;
        if (part.differentiator) attributes.differentiator = part.differentiator;
        if (part.best_for) attributes.best_for = part.best_for;
        if (part.fitment_confidence) attributes.fitment_confidence = part.fitment_confidence;
        if (part.platform_codes?.length) attributes.platform_codes = part.platform_codes;
        if (part.build_stage) attributes.build_stage = part.build_stage;
        attributes.discovered_via = 'al_research';
        attributes.discovered_at = new Date().toISOString();

        const { data: newPart, error: insertError } = await client
          .from('parts')
          .insert({
            brand_name: normalizedBrand,
            name: normalizedName,
            part_number: part.part_number || null,
            category,
            quality_tier: part.quality_tier || 'mid',
            description: part.why_recommended || null,
            source_urls: part.source_url ? [part.source_url] : [],
            is_active: true,
            attributes: attributes,
          })
          .select('id')
          .single();

        if (insertError) {
          console.error(
            `[persistResearchResults] Insert error for ${normalizedName}:`,
            insertError.message
          );
          errors.push({ part: normalizedName, error: insertError.message });
          continue;
        }
        partId = newPart?.id;
        console.log(
          `[persistResearchResults] Created new part: ${normalizedBrand} ${normalizedName}`
        );
      }

      if (!partId) {
        errors.push({ part: normalizedName, error: 'Failed to get part ID' });
        continue;
      }

      // 2. Upsert to part_fitments table (link part to car)
      const { error: fitmentError } = await client.from('part_fitments').upsert(
        {
          part_id: partId,
          car_id: carId,
          confidence: 0.6,
          source_url: part.source_url || null,
          metadata: {
            source: 'al_research',
            extracted_at: new Date().toISOString(),
          },
        },
        {
          onConflict: 'part_id,car_id',
          ignoreDuplicates: true,
        }
      );

      if (fitmentError) {
        console.warn('[persistResearchResults] Fitment error:', fitmentError.message);
      }

      // 3. Insert pricing snapshot if price available (avoid duplicates)
      if (part.price && part.source_url) {
        const vendorName = extractVendorFromUrl(part.source_url);
        const priceCents = Math.round(part.price * 100);

        // Check for recent price from same vendor (within last 24 hours)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: recentPrice } = await client
          .from('part_pricing_snapshots')
          .select('id, price_cents')
          .eq('part_id', partId)
          .eq('vendor_name', vendorName)
          .gte('recorded_at', oneDayAgo)
          .limit(1)
          .maybeSingle();

        // Only insert if no recent price or price changed
        if (!recentPrice || recentPrice.price_cents !== priceCents) {
          await client.from('part_pricing_snapshots').insert({
            part_id: partId,
            price_cents: priceCents,
            vendor_name: vendorName,
            product_url: part.source_url,
            currency: 'USD',
            metadata: { source: 'al_research' },
          });
          console.log(`[persistResearchResults] Saved price $${part.price} from ${vendorName}`);
        }
      }

      // Track the rank from the part data (AI should include this)
      const rank = part.rank || saved.length + 1;
      saved.push({ part_id: partId, name: normalizedName, brand: normalizedBrand, rank });
    } catch (err) {
      errors.push({ part: part.product_name, error: err.message });
    }
  }

  // 4. Save to al_part_recommendations if we have upgrade_key
  // This enables showing recommendations in part tiles on the parts page
  if (upgradeKey && saved.length > 0) {
    try {
      // First, clear existing recommendations for this car + upgrade combo
      // (new research replaces old recommendations)
      await client
        .from('al_part_recommendations')
        .delete()
        .eq('car_id', carId)
        .eq('upgrade_key', upgradeKey);

      // Insert new recommendations with ranks
      const recommendations = saved.map((s, index) => ({
        car_id: carId,
        upgrade_key: upgradeKey,
        part_id: s.part_id,
        rank: s.rank || index + 1,
        conversation_id: conversationId || null,
        source: 'al_research',
      }));

      const { error: recError } = await client
        .from('al_part_recommendations')
        .insert(recommendations);

      if (recError) {
        console.warn('[persistResearchResults] Recommendation save error:', recError.message);
      } else {
        recommendationsSaved.push(...recommendations);
        console.log(
          `[persistResearchResults] Saved ${recommendations.length} recommendations for ${upgradeKey}`
        );
      }
    } catch (recErr) {
      console.warn('[persistResearchResults] Failed to save recommendations:', recErr.message);
    }
  }

  console.log(`[persistResearchResults] Saved ${saved.length} parts, ${errors.length} errors`);
  return { saved: saved.length, errors, recommendations: recommendationsSaved.length };
}

/**
 * Extract vendor name from URL
 */
function extractVendorFromUrl(url) {
  if (!url) return 'Unknown';
  try {
    const host = new URL(url).hostname.replace('www.', '');
    // Common vendor mappings
    const vendorMap = {
      'summitracing.com': 'Summit Racing',
      'amazon.com': 'Amazon',
      'ecstuning.com': 'ECS Tuning',
      'fcpeuro.com': 'FCP Euro',
      '034motorsport.com': '034 Motorsport',
      'goapr.com': 'APR',
      'cobbtuning.com': 'Cobb Tuning',
      'getunitronic.com': 'Unitronic',
    };
    return (
      vendorMap[host] || host.split('.')[0].charAt(0).toUpperCase() + host.split('.')[0].slice(1)
    );
  } catch {
    return 'Unknown';
  }
}

/**
 * Research parts via web search - simplified AI-first approach
 *
 * NEW APPROACH:
 * 1. Query existing database for context (parts we already know)
 * 2. Do wide-net web research via Exa (no domain restrictions)
 * 3. Return raw results for AI to analyze and curate
 * 4. AI extracts structured data, we persist to database for growth
 *
 * @param {Object} params - Search parameters
 * @param {number} [params.car_year] - Model year
 * @param {string} [params.car_make] - Make (e.g., "Audi")
 * @param {string} [params.car_model] - Model (e.g., "RS5")
 * @param {string} [params.car_slug] - Optional AutoRev car slug
 * @param {string} params.upgrade_type - Type of upgrade (required)
 * @param {number} [params.budget_min] - Min budget USD
 * @param {number} [params.budget_max] - Max budget USD
 * @returns {Object} Research results for AI to analyze
 */
// =============================================================================
// PLATFORM CODE DETECTION - For accurate parts fitment
// =============================================================================

/**
 * Detect platform code from vehicle info for accurate parts search
 * Returns platform code(s) that should be used when searching for parts
 */
function detectPlatformCode(make, model, year) {
  const m = (make || '').toLowerCase();
  const mod = (model || '').toLowerCase();
  const y = parseInt(year) || 0;

  // Ford Mustang generations
  if (m === 'ford' && mod.includes('mustang')) {
    if (y >= 2024) return { code: 'S650', years: '2024+', incompatible: ['S550', 'S197', 'SN95'] };
    if (y >= 2015)
      return { code: 'S550', years: '2015-2023', incompatible: ['S650', 'S197', 'SN95'] };
    if (y >= 2005)
      return { code: 'S197', years: '2005-2014', incompatible: ['S550', 'S650', 'SN95'] };
    if (y >= 1994)
      return { code: 'SN95', years: '1994-2004', incompatible: ['S197', 'S550', 'S650'] };
  }

  // BMW 3-Series / M3
  if (m === 'bmw' && (mod.includes('3') || mod.includes('m3'))) {
    if (y >= 2019) return { code: 'G20/G80', years: '2019+', incompatible: ['F30', 'E90', 'E46'] };
    if (y >= 2012)
      return { code: 'F30/F80', years: '2012-2019', incompatible: ['G20', 'E90', 'E46'] };
    if (y >= 2007)
      return { code: 'E90/E92', years: '2007-2013', incompatible: ['F30', 'G20', 'E46'] };
    if (y >= 1999) return { code: 'E46', years: '1999-2006', incompatible: ['E90', 'F30', 'G20'] };
  }

  // Porsche 911
  if (m === 'porsche' && mod.includes('911')) {
    if (y >= 2020) return { code: '992', years: '2020+', incompatible: ['991', '997', '996'] };
    if (y >= 2012) return { code: '991', years: '2012-2019', incompatible: ['992', '997', '996'] };
    if (y >= 2005) return { code: '997', years: '2005-2012', incompatible: ['991', '992', '996'] };
    if (y >= 1999) return { code: '996', years: '1999-2004', incompatible: ['997', '991', '992'] };
  }

  // Porsche Cayman/Boxster
  if (m === 'porsche' && (mod.includes('cayman') || mod.includes('boxster'))) {
    if (y >= 2017) return { code: '718', years: '2017+', incompatible: ['981', '987'] };
    if (y >= 2013) return { code: '981', years: '2013-2016', incompatible: ['718', '987'] };
    if (y >= 2005) return { code: '987', years: '2005-2012', incompatible: ['981', '718'] };
  }

  // Subaru WRX/STI
  if (m === 'subaru' && (mod.includes('wrx') || mod.includes('sti'))) {
    if (y >= 2022) return { code: 'VB', years: '2022+', incompatible: ['VA', 'GR', 'GD'] };
    if (y >= 2015) return { code: 'VA', years: '2015-2021', incompatible: ['VB', 'GR', 'GD'] };
    if (y >= 2008) return { code: 'GR/GV', years: '2008-2014', incompatible: ['VA', 'VB', 'GD'] };
    if (y >= 2002) return { code: 'GD', years: '2002-2007', incompatible: ['GR', 'VA', 'VB'] };
  }

  // Chevy Camaro
  if ((m === 'chevrolet' || m === 'chevy') && mod.includes('camaro')) {
    if (y >= 2016) return { code: '6th Gen', years: '2016-2024', incompatible: ['5th Gen'] };
    if (y >= 2010) return { code: '5th Gen', years: '2010-2015', incompatible: ['6th Gen'] };
  }

  // Honda Civic
  if (m === 'honda' && mod.includes('civic')) {
    if (y >= 2022) return { code: 'FL/FE', years: '2022+', incompatible: ['FC/FK', 'FB/FG'] };
    if (y >= 2016) return { code: 'FC/FK', years: '2016-2021', incompatible: ['FL/FE', 'FB/FG'] };
    if (y >= 2012) return { code: 'FB/FG', years: '2012-2015', incompatible: ['FC/FK', 'FL/FE'] };
  }

  // Dodge Challenger/Charger
  if (m === 'dodge' && (mod.includes('challenger') || mod.includes('charger'))) {
    if (y >= 2015) return { code: 'LC/LD', years: '2015-2023', incompatible: ['LX'] };
    if (y >= 2006) return { code: 'LX', years: '2006-2014', incompatible: ['LC/LD'] };
  }

  // Ram TRX
  if ((m === 'ram' || m === 'dodge') && mod.includes('trx')) {
    return { code: 'DT TRX', years: '2021-2024', incompatible: ['DT 1500', 'DS'] };
  }

  // Audi RS/S models
  if (m === 'audi') {
    if (mod.includes('rs5') || mod.includes('s5') || mod.includes('a5')) {
      if (y >= 2018) return { code: 'B9', years: '2018+', incompatible: ['B8', 'B8.5'] };
      if (y >= 2013) return { code: 'B8.5', years: '2013-2017', incompatible: ['B9', 'B8'] };
      if (y >= 2008) return { code: 'B8', years: '2008-2012', incompatible: ['B8.5', 'B9'] };
    }
  }

  return null; // Unknown platform
}

export async function researchPartsLive(
  {
    car_year,
    car_make,
    car_model,
    car_slug,
    upgrade_type,
    budget_min,
    budget_max,
    // NEW: Build context for smarter recommendations
    existing_mods = [],
    estimated_hp = null,
    target_hp = null,
    build_stage = null,
  },
  { onProgress } = {}
) {
  const startTime = Date.now();

  if (!upgrade_type) {
    return { error: 'upgrade_type is required' };
  }

  if (!EXA_API_KEY) {
    return {
      error: 'Live parts research not configured',
      message: 'EXA_API_KEY not set. Live vendor search is unavailable.',
      suggestion: 'Use search_parts to search our internal parts database instead.',
    };
  }

  // =========================================================================
  // STEP 1: Resolve car information
  // =========================================================================
  let carInfo = { year: car_year, make: car_make, model: car_model };
  let carId = null;

  if (car_slug) {
    try {
      const car = await fetchCarBySlug(car_slug);
      if (car) {
        carId = car.id;

        // Extract year from new schema (year integer) or fallback to years string
        let parsedYear = car_year || car.year;
        if (!parsedYear && car.years) {
          const yearMatch = car.years.match(/(\d{4})(?:-(\d{4}))?/);
          if (yearMatch) {
            const startYear = parseInt(yearMatch[1]);
            const endYear = yearMatch[2] ? parseInt(yearMatch[2]) : startYear;
            parsedYear = Math.floor((startYear + endYear) / 2);
          }
        }

        // Extract make/model
        let parsedMake = car_make || car.make;
        let parsedModel = car_model || car.model;

        if ((!parsedMake || !parsedModel) && car.name) {
          const nameParts = car.name.split(' ');
          if (!parsedMake && nameParts.length > 0) parsedMake = nameParts[0];
          if (!parsedModel && nameParts.length > 1) parsedModel = nameParts.slice(1).join(' ');
        }

        carInfo = {
          id: carId,
          year: parsedYear,
          make: parsedMake,
          model: parsedModel,
          fullName: car.name,
        };
      }
    } catch (e) {
      console.warn('[researchPartsLive] Could not fetch car info:', e.message);
    }
  }

  if (!carInfo.year && !carInfo.make && !carInfo.model) {
    return {
      error: 'Car information required',
      message: 'Please provide car_year, car_make, and car_model (or car_slug).',
    };
  }

  // =========================================================================
  // STEP 1.5: Detect platform code for accurate fitment
  // =========================================================================
  const platformInfo = detectPlatformCode(carInfo.make, carInfo.model, carInfo.year);

  const carContext = carInfo.fullName
    ? `${carInfo.year || ''} ${carInfo.fullName}`.trim()
    : [carInfo.year, carInfo.make, carInfo.model].filter(Boolean).join(' ');

  console.log(
    `[researchPartsLive] Researching ${upgrade_type} for: ${carContext}` +
      (platformInfo ? ` (Platform: ${platformInfo.code})` : '')
  );

  try {
    // =========================================================================
    // STEP 2: Query existing database for context
    // =========================================================================
    const existingParts = await queryExistingParts(carId, upgrade_type);
    console.log(`[researchPartsLive] Found ${existingParts.length} existing parts in database`);

    // =========================================================================
    // STEP 3: Do wide-net web research (include platform code for better results)
    // =========================================================================
    const webResearch = await doWebResearch(
      { ...carInfo, platformCode: platformInfo?.code },
      upgrade_type,
      budget_min,
      budget_max,
      onProgress
    );

    const researchTime = Date.now() - startTime;
    console.log(`[researchPartsLive] Research completed in ${researchTime}ms`);

    // =========================================================================
    // STEP 4: Build context summary for AI (helps with filtering)
    // =========================================================================
    const buildContext = {
      existing_mods: existing_mods || [],
      mod_count: (existing_mods || []).length,
      estimated_hp: estimated_hp,
      target_hp: target_hp,
      build_stage: build_stage || (existing_mods?.length > 0 ? 'modified' : 'stock'),
    };

    // =========================================================================
    // STEP 5: Return results for AI to analyze
    // =========================================================================
    return {
      success: true,

      // Car context
      car: {
        id: carId,
        year: carInfo.year,
        make: carInfo.make,
        model: carInfo.model,
        display_name: carContext,
      },

      // CRITICAL: Platform fitment info for the AI to validate parts
      platform: platformInfo
        ? {
            code: platformInfo.code,
            years: platformInfo.years,
            incompatible_platforms: platformInfo.incompatible,
            fitment_warning: `ONLY recommend parts for ${platformInfo.code} (${platformInfo.years}). Parts labeled ${platformInfo.incompatible.join(', ')} will NOT fit.`,
          }
        : null,

      // User's build context (helps prioritize recommendations)
      build_context: buildContext,

      // What we're researching
      upgrade_type: upgrade_type,
      category: UPGRADE_CATEGORY_MAP[upgrade_type?.toLowerCase()] || upgrade_type,
      budget: { min: budget_min, max: budget_max },

      // Existing database knowledge (for context/comparison)
      existing_parts: existingParts,
      existing_count: existingParts.length,

      // Fresh web research results (for AI to analyze)
      web_research: webResearch,

      // Timing
      research_time_ms: researchTime,

      // Instructions for AI on how to process these results
      analysis_instructions: `
You have received parts research results. Your job is to:

**CRITICAL FITMENT CHECK (DO THIS FIRST):**
${
  platformInfo
    ? `This vehicle is a ${platformInfo.code} platform (${platformInfo.years}).
- ONLY recommend parts explicitly compatible with ${platformInfo.code}
- REJECT any parts labeled for: ${platformInfo.incompatible.join(', ')}
- Example: If a part says "S197" and this is an S550, DO NOT recommend it`
    : 'No specific platform code detected. Verify year/make/model fitment carefully.'
}

**BUILD STAGE CONTEXT:**
${
  buildContext.mod_count > 0
    ? `User has ${buildContext.mod_count} existing mods. ${buildContext.estimated_hp ? `Estimated power: ~${buildContext.estimated_hp}hp.` : ''} Recommend parts appropriate for their build stage.`
    : 'User appears to have a stock vehicle. Prioritize entry-level/Stage 1 appropriate parts unless they specify otherwise.'
}

1. ANALYZE the web_research.results to identify specific products
   - Look for product names, brands, prices, and URLs
   - **CHECK FOR PLATFORM CODES** in product names (S197, E46, 987, etc.)
   - Cross-reference with existing_parts to see what we already know

2. FILTER results by fitment:
   - Does the platform code match? (If S197 and this is S550, REJECT)
   - Is this appropriate for the user's build stage?

3. For each VALIDATED product, EXTRACT:
   - brand_name (e.g., "034 Motorsport", "APR", "Unitronic")
   - product_name (e.g., "Stage 1 ECU Tune")
   - part_number (if found)
   - price (numeric, in USD)
   - source_url (the URL where you found it - REQUIRED for purchase link)
   - category (tune, intake, exhaust, etc.)
   - quality_tier (premium, mid, budget)
   - platform_fit (confirmed/likely/verify - how certain is fitment?)
   - build_stage_fit (stock/stage1/stage2/stage3/high-hp)
   - why_recommended (1-2 sentences including fitment confidence)

4. RANK your top 5 recommendations by:
   1. Fitment certainty (platform match)
   2. Build-stage appropriateness
   3. Value for money
   4. Brand reputation

5. FORMAT your response with fitment confirmation:

**1) [Brand] [Product Name]** - RECOMMENDED
- **Fits:** ${carContext} (${platformInfo?.code || 'verify fitment'})
- **Best for:** [Build stage, e.g., "Stage 2-3 builds, 400-600whp"]
- **Price:** $XXX
- **Buy here:** [Vendor](url)
- **Why:** [Include fitment confidence]

6. **MANDATORY:** At the END, you MUST include the JSON block for database persistence. This is NOT optional - without it, your research is lost:

<parts_to_save>
{
  "car_slug": "${car_slug || ''}",
  "upgrade_key": "${upgrade_type}",
  "parts": [
    {
      "brand_name": "...",
      "product_name": "...",
      "price": 1299,
      "source_url": "https://...",
      "category": "tune",
      "platform_codes": ["${platformInfo?.code || 'verify'}"],
      "build_stage": "stage2",
      "rank": 1,
      "why_recommended": "1-2 sentences explaining why this part is recommended",
      "differentiator": "What makes this unique vs competitors",
      "best_for": "Stock to Stage 1 builds",
      "fitment_confidence": "confirmed|likely|verify"
    }
  ]
}
</parts_to_save>
      `.trim(),
    };
  } catch (err) {
    console.error('[researchPartsLive] Error:', err);
    return {
      error: err.message || 'Parts research failed',
      suggestion: 'Use search_parts to search our internal database instead.',
    };
  }
}

/**
 * Internal helper for parts recommendation mode (when upgrade_type is provided)
 */
async function searchPartsRecommendation({ car_id, upgrade_type, budget, limit, client }) {
  if (!car_id) {
    return { error: 'car_id is required when using upgrade_type recommendations' };
  }

  // car_id is already a UUID, use directly
  const carId = car_id;

  // Map upgrade types to part categories
  const categoryMap = {
    downpipe: 'exhaust',
    catback: 'exhaust',
    exhaust: 'exhaust',
    'cold-air-intake': 'intake',
    intake: 'intake',
    intercooler: 'cooling',
    turbo: 'forced-induction',
    'turbo-kit': 'forced-induction',
    supercharger: 'forced-induction',
    'ecu-tune': 'ecu',
    tune: 'ecu',
    coilovers: 'suspension',
    suspension: 'suspension',
    'big-brake-kit': 'brakes',
    brakes: 'brakes',
    wheels: 'wheels',
  };

  const partCategory = categoryMap[upgrade_type.toLowerCase()] || upgrade_type.toLowerCase();

  // Query parts with fitment for this car and category
  const { data: fitmentData, error: fitmentErr } = await client
    .from('part_fitments')
    .select(
      `
      id,
      fitment_notes,
      requires_tune,
      install_difficulty,
      estimated_labor_hours,
      verified,
      confidence,
      source_url,
      parts!inner(
        id,
        name,
        brand_name,
        part_number,
        category,
        description,
        quality_tier,
        street_legal,
        source_urls
      )
    `
    )
    .eq('car_id', carId)
    .eq('parts.category', partCategory)
    .eq('parts.is_active', true)
    .limit(limit * 3);

  if (fitmentErr) {
    console.error('[AL Tools] searchParts recommendation error:', fitmentErr);
    return { error: 'Failed to query parts fitment' };
  }

  if (!fitmentData || fitmentData.length === 0) {
    return {
      car_id,
      upgrade_type,
      count: 0,
      results: [],
      message: `No verified parts found for ${upgrade_type} on this vehicle.`,
    };
  }

  // Get latest pricing
  const partIds = [...new Set(fitmentData.map((f) => f.parts?.id).filter(Boolean))];
  const { data: priceData } = await client
    .from('part_pricing_snapshots')
    .select('part_id, price_cents, currency, vendor_name, product_url, recorded_at')
    .in('part_id', partIds)
    .order('recorded_at', { ascending: false })
    .limit(partIds.length * 5);

  const priceMap = new Map();
  for (const p of priceData || []) {
    if (!priceMap.has(p.part_id)) {
      priceMap.set(p.part_id, p);
    }
  }

  // Score and sort parts
  const scoredParts = fitmentData
    .filter((f) => f.parts)
    .map((f) => {
      const part = f.parts;
      const price = priceMap.get(part.id);

      let score = 0;
      if (f.verified) score += 30;
      if (f.confidence === 'high') score += 20;
      else if (f.confidence === 'medium') score += 10;
      if (price) score += 15;
      if (part.quality_tier === 'premium') score += 10;
      else if (part.quality_tier === 'mid') score += 5;

      const priceCents = price?.price_cents || 0;
      if (budget === 'value' && priceCents < 50000) score += 15;
      else if (budget === 'mid' && priceCents >= 30000 && priceCents <= 100000) score += 15;
      else if (budget === 'premium' && priceCents > 75000) score += 15;

      return { score, fitment: f, part, price };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return {
    car_id,
    upgrade_type,
    budget,
    mode: 'recommendation',
    count: scoredParts.length,
    results: scoredParts.map(({ fitment, part, price }) => ({
      part: {
        id: part.id,
        name: part.name,
        brand_name: part.brand_name,
        part_number: part.part_number,
        category: part.category,
        quality_tier: part.quality_tier,
        street_legal: part.street_legal !== false,
        latest_price: price
          ? {
              vendor: price.vendor_name,
              product_url: price.product_url,
              price_cents: price.price_cents,
              currency: price.currency,
            }
          : null,
      },
      fitment: {
        verified: fitment.verified,
        confidence: fitment.confidence,
        notes: fitment.fitment_notes,
        requires_tune: fitment.requires_tune,
        install_difficulty: fitment.install_difficulty,
        estimated_labor_hours: fitment.estimated_labor_hours,
        source_url:
          fitment.source_url || (Array.isArray(part.source_urls) ? part.source_urls[0] : null),
      },
    })),
  };
}

/**
 * Search parts catalog and find best parts for upgrades.
 *
 * Two modes:
 * 1. Text search (query provided): Search by part name/number
 * 2. Recommendation (upgrade_type provided, no query): Find best parts for an upgrade category
 *
 * @param {Object} params
 * @param {string} [params.query] - Text search query (part name, brand, part number)
 * @param {string} [params.car_id] - Car UUID to filter parts for fitment
 * @param {string} [params.category] - Part category filter
 * @param {string} [params.upgrade_type] - Upgrade type for recommendations (e.g., 'intake', 'exhaust', 'coilovers')
 * @param {string} [params.budget] - Budget tier: 'value', 'mid', 'premium' (default: 'mid')
 * @param {number} [params.limit] - Max results (default 8)
 * @returns {Object}
 */
export async function searchParts({
  query,
  car_id = null,
  category = null,
  upgrade_type = null,
  budget = 'mid',
  limit = 8,
}) {
  const client = getDbClient({ requireServiceRole: true });
  if (!isSupabaseConfigured || !client) return { error: 'Supabase not configured' };

  // Either query or upgrade_type is required
  if (!query && !upgrade_type) {
    return { error: 'Either query (text search) or upgrade_type (recommendations) is required' };
  }

  const safeLimit = Math.max(1, Math.min(Number(limit) || 8, 20));

  // If upgrade_type is provided, use recommendation mode
  if (upgrade_type && !query) {
    return searchPartsRecommendation({ car_id, upgrade_type, budget, limit: safeLimit, client });
  }

  try {
    // car_id is already a UUID, use directly
    const carId = car_id || null;

    const q = String(query).trim();

    const attachLatestPricing = async (rows) => {
      const partIds = [...new Set(rows.map((r) => r?.parts?.id || r?.id).filter(Boolean))];
      if (partIds.length === 0) return { priceByPartId: new Map() };

      const { data: snapshots, error: snapErr } = await client
        .from('part_pricing_snapshots')
        .select('part_id,price_cents,currency,recorded_at,product_url,vendor_name')
        .in('part_id', partIds)
        .order('recorded_at', { ascending: false })
        .limit(400);
      if (snapErr) return { priceByPartId: new Map() };

      const latest = new Map();
      for (const s of snapshots || []) {
        if (!latest.has(s.part_id)) latest.set(s.part_id, s);
      }
      return { priceByPartId: latest };
    };

    if (carId) {
      let fitmentQuery = client
        .from('part_fitments')
        .select(
          'fitment_notes,requires_tune,install_difficulty,estimated_labor_hours,verified,confidence,source_url, parts(id,name,brand_name,part_number,category,description,quality_tier,street_legal,source_urls)'
        )
        .eq('car_id', carId)
        .limit(safeLimit);

      if (category) fitmentQuery = fitmentQuery.eq('parts.category', category);

      // Supabase doesn't support OR across related tables cleanly; use two passes.
      const byName = await fitmentQuery.ilike('parts.name', `%${q}%`);
      const byPn = await fitmentQuery.ilike('parts.part_number', `%${q}%`);

      const combined = [...(byName.data || []), ...(byPn.data || [])];
      const dedup = new Map();
      for (const row of combined) {
        const pid = row?.parts?.id;
        if (pid) dedup.set(pid, row);
      }

      const rows = [...dedup.values()].slice(0, safeLimit);
      const { priceByPartId } = await attachLatestPricing(rows);
      return {
        query: q,
        car_id,
        count: rows.length,
        results: rows.map((r) => ({
          part: {
            ...r.parts,
            latest_price: priceByPartId.get(r.parts.id)
              ? {
                  vendor: priceByPartId.get(r.parts.id).vendor_name,
                  product_url: priceByPartId.get(r.parts.id).product_url,
                  price_cents: priceByPartId.get(r.parts.id).price_cents,
                  currency: priceByPartId.get(r.parts.id).currency,
                  recorded_at: priceByPartId.get(r.parts.id).recorded_at,
                }
              : null,
          },
          fitment: {
            notes: r.fitment_notes,
            requires_tune: r.requires_tune,
            install_difficulty: r.install_difficulty,
            estimated_labor_hours: r.estimated_labor_hours,
            verified: r.verified,
            confidence: r.confidence,
            source_url:
              r.source_url || (Array.isArray(r.parts?.source_urls) ? r.parts.source_urls[0] : null),
          },
        })),
      };
    }

    let partsQuery = client
      .from('parts')
      .select(
        'id,name,brand_name,part_number,category,description,quality_tier,street_legal,source_urls,confidence'
      )
      .eq('is_active', true)
      .limit(safeLimit);

    if (category) partsQuery = partsQuery.eq('category', category);

    // Two passes: name then part number
    const byName = await partsQuery.ilike('name', `%${q}%`);
    const byPn = await partsQuery.ilike('part_number', `%${q}%`);

    const combined = [...(byName.data || []), ...(byPn.data || [])];
    const dedup = new Map();
    for (const row of combined) dedup.set(row.id, row);

    const rows = [...dedup.values()].slice(0, safeLimit);
    const { priceByPartId } = await attachLatestPricing(rows);
    return {
      query: q,
      car_id: null,
      count: rows.length,
      results: rows.map((p) => ({
        ...p,
        latest_price: priceByPartId.get(p.id)
          ? {
              vendor: priceByPartId.get(p.id).vendor_name,
              product_url: priceByPartId.get(p.id).product_url,
              price_cents: priceByPartId.get(p.id).price_cents,
              currency: priceByPartId.get(p.id).currency,
              recorded_at: priceByPartId.get(p.id).recorded_at,
            }
          : null,
      })),
    };
  } catch (err) {
    console.error('[AL Tools] search_parts failed:', err);
    return { error: err.message || 'search_parts failed' };
  }
}

/**
 * @deprecated Use searchParts with upgrade_type parameter instead.
 * Example: searchParts({ car_slug: '...', upgrade_type: 'intake', budget: 'mid' })
 * Deprecated 2026-01-26.
 *
 * Find the best parts for a specific upgrade type.
 */
export async function findBestParts({ car_id, upgrade_type, budget = 'mid', limit = 5 }) {
  console.warn(
    '[AL Tools] DEPRECATED: find_best_parts called - use search_parts with upgrade_type instead'
  );

  // Delegate to searchParts
  return searchParts({
    car_id,
    upgrade_type,
    budget,
    limit,
  });
}

// =============================================================================
// EVENTS SEARCH
// =============================================================================

/**
 * Search for car events (track days, Cars & Coffee, car shows, etc.)
 *
 * @param {Object} params - Search parameters
 * @param {string} [params.query] - Search by event name (e.g., "SEMA", "Detroit Auto Show")
 * @param {string} [params.location] - Location to search near (ZIP, city, or state)
 * @param {number} [params.radius] - Search radius in miles (for ZIP searches only)
 * @param {string} [params.event_type] - Filter by event type slug
 * @param {boolean} [params.is_track_event] - Only return track events
 * @param {string} [params.brand] - Filter by car brand affinity
 * @param {string} [params.car_slug] - Filter by specific car affinity
 * @param {string} [params.start_after] - Only events after this date (ISO format)
 * @param {number} [params.limit] - Max results (default 5, max 20)
 * @returns {Object} Search results with events
 */
export async function searchEvents({
  query,
  location,
  radius,
  event_type,
  is_track_event,
  brand,
  car_id,
  start_after,
  limit = 5,
}) {
  // At least one search criterion required
  if (!query && !location && !event_type && !brand) {
    return { error: 'At least one of query, location, event_type, or brand is required' };
  }

  const safeLimit = Math.max(1, Math.min(Number(limit) || 5, 20));

  try {
    // Resolve car_id to slug for API call
    const carSlug = car_id ? await getSlugFromCarId(car_id) : null;

    // Build query parameters
    const params = new URLSearchParams();

    // Event name search (e.g., "SEMA", "Detroit Auto Show")
    if (query && query.trim()) {
      params.set('query', query.trim());
    }

    // Location-based search
    if (location && location.trim()) {
      const trimmedLocation = location.trim();
      const isZip = /^\d{5}$/.test(trimmedLocation);

      if (isZip) {
        params.set('zip', trimmedLocation);
        // Only apply radius for ZIP-based searches (local event discovery)
        // Don't apply radius when searching by event name
        if (!query && radius !== undefined) {
          const safeRadius = Math.max(10, Math.min(Number(radius) || 50, 500));
          params.set('radius', safeRadius.toString());
        }
      } else if (trimmedLocation.includes(',')) {
        // City, State format
        const parts = trimmedLocation.split(',').map((p) => p.trim());
        if (parts[0]) params.set('city', parts[0]);
        if (parts[1]) params.set('state', parts[1]);
      } else if (trimmedLocation.length === 2) {
        // State code
        params.set('state', trimmedLocation.toUpperCase());
      } else {
        // Could be city or state name - try as city first
        params.set('city', trimmedLocation);
      }
    }

    if (event_type) params.set('type', event_type);
    if (is_track_event) params.set('is_track_event', 'true');
    if (brand) params.set('brand', brand);
    if (carSlug) params.set('car_slug', carSlug);
    if (start_after) params.set('start_after', start_after);
    params.set('limit', safeLimit.toString());

    // Use internal API call
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/events?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Events API returned ${response.status}`);
    }

    const data = await response.json();

    // Format events for AL response
    const formattedEvents = (data.events || []).map((event) => {
      const eventDate = new Date(event.start_date + 'T00:00:00');
      const formattedDate = eventDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      const result = {
        name: event.name,
        type: event.event_type?.name || 'Event',
        type_slug: event.event_type?.slug || 'other',
        date: formattedDate,
        location: `${event.city}${event.state ? `, ${event.state}` : ''}`,
        cost: event.is_free ? 'Free' : event.cost_text || 'See event page',
        url: event.source_url,
        slug: event.slug,
        autorev_url: `/events/${event.slug}`,
      };

      // Add distance if available (from radius search)
      if (event.distance_miles !== undefined) {
        result.distance = `${event.distance_miles} mi`;
      }

      // Add car affinities if any
      if (event.car_affinities && event.car_affinities.length > 0) {
        result.car_affinities = event.car_affinities
          .map((a) => a.car_name || a.brand)
          .filter(Boolean);
      }

      return result;
    });

    // Build search summary
    let searchSummary = `Found ${formattedEvents.length} event${formattedEvents.length !== 1 ? 's' : ''}`;

    if (event_type) {
      const typeName = event_type.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      searchSummary += ` (${typeName})`;
    } else if (is_track_event) {
      searchSummary += ' (track events)';
    }

    // Describe what was searched
    if (query && query.trim()) {
      searchSummary += ` matching "${query.trim()}"`;
    }

    if (data.searchCenter && location) {
      searchSummary += ` within ${data.searchCenter.radius} miles of ${location.trim()}`;
    } else if (location && location.trim()) {
      searchSummary += ` near ${location.trim()}`;
    }

    if (brand) {
      searchSummary += ` for ${brand}`;
    }

    return {
      events: formattedEvents,
      total: data.total || formattedEvents.length,
      search_summary: searchSummary,
      search_params: {
        query: query?.trim() || null,
        location: location?.trim() || null,
        radius: data.searchCenter?.radius || null,
        event_type,
        brand,
        car_slug,
      },
      instruction:
        formattedEvents.length > 0
          ? 'Present events in a scannable format. Highlight the date, name, location, and cost. Include AutoRev links for users to learn more or save events.'
          : 'No events found. Try a different search term, broader location, or check back later as new events are added regularly.',
    };
  } catch (err) {
    console.error('[AL Tools] search_events failed:', err);
    return { error: `Failed to search events: ${err.message}` };
  }
}

// =============================================================================
// VEHICLE HEALTH ANALYSIS
// =============================================================================

/**
 * Analyze a user's specific vehicle and provide personalized maintenance recommendations.
 * Cross-references against service intervals, maintenance specs, known issues, and service history.
 *
 * @param {Object} params - Parameters
 * @param {string} [params.vehicle_id] - The user_vehicle ID. If not provided, analyzes first vehicle in user's garage.
 * @param {boolean} [params.include_costs] - Include estimated costs for each recommendation
 * @param {string} params.user_id - The user's ID (passed from AL context)
 * @returns {Object} Health analysis with prioritized recommendations
 */
export async function analyzeVehicleHealth({
  vehicle_id = null,
  include_costs = false,
  user_id = null,
}) {
  const client = getDbClient({ requireServiceRole: true });
  if (!isSupabaseConfigured || !client) {
    return { error: 'Supabase not configured' };
  }
  if (!user_id) {
    return { error: 'user_id is required - this tool requires user context' };
  }

  try {
    // Call the RPC function to get all vehicle data efficiently
    const { data, error } = await client.rpc('analyze_vehicle_health_data', {
      p_user_id: user_id,
      p_vehicle_id: vehicle_id || null,
    });

    if (error) throw error;
    if (!data) return { error: 'No data returned from analyze_vehicle_health_data' };
    if (data.error) return { error: data.error, error_code: data.error_code };

    const vehicle = data.vehicle;
    const car = data.car || null;
    const serviceIntervals = data.service_intervals || [];
    const maintenanceSpecs = data.maintenance_specs || {};
    const knownIssues = data.known_issues || [];
    const serviceLogs = data.service_logs || [];

    // Current state
    const currentMileage = vehicle.current_mileage || 0;
    const isInStorage = vehicle.storage_mode === true;
    const now = new Date();

    // Build recommendations array
    const recommendations = [];
    const storageAlerts = [];
    const modelIssuesToWatch = [];

    // Helper to calculate overdue info
    const calculateOverdue = (dueMileage, dueDate, currentMileage, now) => {
      let overdueBy = null;
      let priority = 'UPCOMING';

      if (dueMileage && currentMileage > dueMileage) {
        const overduePercent = ((currentMileage - dueMileage) / dueMileage) * 100;
        overdueBy = `${currentMileage - dueMileage} miles`;
        priority = overduePercent > 20 ? 'URGENT' : 'DUE_SOON';
      }

      if (dueDate) {
        const dueDateObj = new Date(dueDate);
        if (now > dueDateObj) {
          const daysPast = Math.floor((now - dueDateObj) / (1000 * 60 * 60 * 24));
          overdueBy = overdueBy ? `${overdueBy} / ${daysPast} days` : `${daysPast} days`;
          priority = daysPast > 30 ? 'URGENT' : 'DUE_SOON';
        }
      }

      return { overdueBy, priority };
    };

    // Helper to check if within threshold
    const isWithinThreshold = (target, current, threshold = 0.1) => {
      if (!target || !current) return false;
      return current >= target * (1 - threshold) && current < target;
    };

    // =========================================================================
    // OIL CHANGE ANALYSIS
    // =========================================================================
    const oilInterval = maintenanceSpecs?.oil?.interval_miles || 7500;
    const lastOilMileage = vehicle.last_oil_change_mileage;
    const _lastOilDate = vehicle.last_oil_change_date;
    const nextOilMileage =
      vehicle.next_oil_due_mileage || (lastOilMileage ? lastOilMileage + oilInterval : oilInterval);

    if (currentMileage > 0 || lastOilMileage) {
      const { overdueBy, priority } = calculateOverdue(nextOilMileage, null, currentMileage, now);

      // Check if due soon (within 10%)
      let finalPriority = priority;
      if (priority === 'UPCOMING' && isWithinThreshold(nextOilMileage, currentMileage)) {
        finalPriority = 'DUE_SOON';
      }

      // Only add if relevant
      if (overdueBy || finalPriority !== 'UPCOMING' || nextOilMileage - currentMileage <= 3000) {
        const rec = {
          priority: finalPriority,
          category: 'oil',
          title: 'Oil Change',
          description: lastOilMileage
            ? `Last changed at ${lastOilMileage.toLocaleString()} miles. ${maintenanceSpecs?.oil?.viscosity || ''} ${maintenanceSpecs?.oil?.spec || ''}`.trim()
            : `No oil change recorded. Recommended every ${oilInterval.toLocaleString()} miles.`,
          due_at_mileage: nextOilMileage,
          overdue_by: overdueBy,
          source: 'OEM Schedule',
        };
        if (include_costs && maintenanceSpecs?.oil) {
          const interval = serviceIntervals.find((s) =>
            s.service_name?.toLowerCase().includes('oil')
          );
          rec.estimated_cost = {
            low: interval?.dealer_cost_low || 80,
            high: interval?.dealer_cost_high || 150,
            diy: interval?.diy_cost_low || 40,
          };
        }
        recommendations.push(rec);
      }
    }

    // =========================================================================
    // INSPECTION / REGISTRATION
    // =========================================================================
    if (vehicle.inspection_due_date) {
      const inspDue = new Date(vehicle.inspection_due_date);
      const daysUntil = Math.floor((inspDue - now) / (1000 * 60 * 60 * 24));

      if (daysUntil < 0) {
        recommendations.push({
          priority: 'URGENT',
          category: 'inspection',
          title: 'Vehicle Inspection Overdue',
          description: `Inspection was due ${vehicle.inspection_due_date}. Schedule immediately.`,
          due_by_date: vehicle.inspection_due_date,
          overdue_by: `${Math.abs(daysUntil)} days`,
        });
      } else if (daysUntil <= 30) {
        recommendations.push({
          priority: 'DUE_SOON',
          category: 'inspection',
          title: 'Vehicle Inspection Due Soon',
          description: `Inspection due ${vehicle.inspection_due_date} (${daysUntil} days).`,
          due_by_date: vehicle.inspection_due_date,
        });
      }
    }

    if (vehicle.registration_due_date) {
      const regDue = new Date(vehicle.registration_due_date);
      const daysUntil = Math.floor((regDue - now) / (1000 * 60 * 60 * 24));

      if (daysUntil < 0) {
        recommendations.push({
          priority: 'URGENT',
          category: 'inspection',
          title: 'Registration Expired',
          description: `Registration expired ${vehicle.registration_due_date}. Renew immediately.`,
          due_by_date: vehicle.registration_due_date,
          overdue_by: `${Math.abs(daysUntil)} days`,
        });
      } else if (daysUntil <= 30) {
        recommendations.push({
          priority: 'DUE_SOON',
          category: 'inspection',
          title: 'Registration Due Soon',
          description: `Registration due ${vehicle.registration_due_date} (${daysUntil} days).`,
          due_by_date: vehicle.registration_due_date,
        });
      }
    }

    // =========================================================================
    // BATTERY ANALYSIS
    // =========================================================================
    if (vehicle.battery_status === 'weak' || vehicle.battery_status === 'dead') {
      recommendations.push({
        priority: vehicle.battery_status === 'dead' ? 'URGENT' : 'DUE_SOON',
        category: 'battery',
        title:
          vehicle.battery_status === 'dead'
            ? 'Battery Dead - Replace'
            : 'Battery Weak - Test/Replace',
        description: vehicle.battery_installed_date
          ? `Battery installed ${vehicle.battery_installed_date}. Current status: ${vehicle.battery_status}.`
          : `Battery status: ${vehicle.battery_status}. Consider testing or replacing.`,
        source: 'User Tracking',
      });
    } else if (vehicle.battery_installed_date) {
      const batteryDate = new Date(vehicle.battery_installed_date);
      const batteryAgeYears = (now - batteryDate) / (1000 * 60 * 60 * 24 * 365);
      if (batteryAgeYears >= 4) {
        recommendations.push({
          priority: batteryAgeYears >= 5 ? 'DUE_SOON' : 'UPCOMING',
          category: 'battery',
          title: 'Battery Age - Consider Testing',
          description: `Battery is ${batteryAgeYears.toFixed(1)} years old. Most batteries last 3-5 years. Consider testing.`,
          source: 'User Tracking',
        });
      }
    }

    // =========================================================================
    // TIRE ANALYSIS
    // =========================================================================
    if (vehicle.tire_tread_32nds !== null && vehicle.tire_tread_32nds !== undefined) {
      if (vehicle.tire_tread_32nds <= 2) {
        recommendations.push({
          priority: 'URGENT',
          category: 'tires',
          title: 'Tires at Minimum Tread - Replace',
          description: `Tread depth: ${vehicle.tire_tread_32nds}/32". Legal minimum is 2/32". Replace immediately for safety.`,
          source: 'User Tracking',
        });
      } else if (vehicle.tire_tread_32nds <= 4) {
        recommendations.push({
          priority: 'DUE_SOON',
          category: 'tires',
          title: 'Tires Low - Plan Replacement',
          description: `Tread depth: ${vehicle.tire_tread_32nds}/32". Recommend replacement at 4/32" for wet weather safety.`,
          source: 'User Tracking',
        });
      }
    }

    // =========================================================================
    // BRAKE FLUID
    // =========================================================================
    const brakeFluidInterval = maintenanceSpecs?.brake_fluid?.interval_years || 2;
    const brakeServiceLog = serviceLogs.find(
      (s) =>
        s.service_type?.toLowerCase().includes('brake fluid') ||
        s.service_description?.toLowerCase().includes('brake fluid')
    );

    if (brakeServiceLog) {
      const lastBrakeService = new Date(brakeServiceLog.service_date);
      const yearsSince = (now - lastBrakeService) / (1000 * 60 * 60 * 24 * 365);
      if (yearsSince >= brakeFluidInterval * 1.2) {
        recommendations.push({
          priority: 'URGENT',
          category: 'brakes',
          title: 'Brake Fluid Overdue',
          description: `Last brake fluid service: ${brakeServiceLog.service_date}. Recommended every ${brakeFluidInterval} years.`,
          source: 'OEM Schedule',
        });
      } else if (yearsSince >= brakeFluidInterval * 0.9) {
        recommendations.push({
          priority: 'DUE_SOON',
          category: 'brakes',
          title: 'Brake Fluid Service Due',
          description: `Last brake fluid service: ${brakeServiceLog.service_date}. Recommended every ${brakeFluidInterval} years.`,
          source: 'OEM Schedule',
        });
      }
    }

    // =========================================================================
    // STORAGE MODE ALERTS
    // =========================================================================
    if (isInStorage) {
      // Battery tender
      storageAlerts.push({
        category: 'battery',
        title: 'Battery Maintenance',
        description:
          'Connect battery tender or disconnect battery to prevent drain. Check every 2-4 weeks if no tender.',
      });

      // Fuel stabilizer
      storageAlerts.push({
        category: 'fuel',
        title: 'Fuel Stabilizer',
        description:
          'Add fuel stabilizer and fill tank to prevent condensation and fuel degradation.',
      });

      // Tire flat spots
      storageAlerts.push({
        category: 'tires',
        title: 'Tire Flat Spots',
        description:
          'Consider tire cradles or over-inflate tires slightly. Move vehicle periodically or put on jack stands.',
      });

      // Start reminder
      if (vehicle.last_started_at) {
        const lastStarted = new Date(vehicle.last_started_at);
        const daysSinceStart = Math.floor((now - lastStarted) / (1000 * 60 * 60 * 24));
        if (daysSinceStart > 14) {
          storageAlerts.push({
            category: 'engine',
            title: `Not Started in ${daysSinceStart} Days`,
            description:
              'Consider starting and running to operating temperature every 2-3 weeks to circulate fluids.',
          });
        }
      }
    }

    // =========================================================================
    // MODEL-SPECIFIC ISSUES TO WATCH
    // =========================================================================
    for (const issue of knownIssues) {
      // Check if issue is relevant to current mileage
      const isRelevantMileage =
        !issue.mileage_range_low ||
        !issue.mileage_range_high ||
        (currentMileage >= issue.mileage_range_low * 0.8 &&
          currentMileage <= issue.mileage_range_high * 1.2);

      // Check if year is affected (basic check)
      const yearText = issue.affected_years_text || '';
      const vehicleYear = vehicle.year;
      let isYearAffected = true;

      if (yearText && vehicleYear) {
        // Parse "2015-2020" format
        const yearMatch = yearText.match(/(\d{4})\s*[-–]\s*(\d{4})/);
        if (yearMatch) {
          const startYear = parseInt(yearMatch[1]);
          const endYear = parseInt(yearMatch[2]);
          isYearAffected = vehicleYear >= startYear && vehicleYear <= endYear;
        }
      }

      if (isRelevantMileage && isYearAffected) {
        modelIssuesToWatch.push({
          title: issue.title,
          severity: issue.severity,
          description: issue.description,
          symptoms: issue.symptoms,
          prevention: issue.prevention,
          estimated_cost:
            issue.estimated_cost_low && issue.estimated_cost_high
              ? { low: issue.estimated_cost_low, high: issue.estimated_cost_high }
              : null,
          source_url: issue.source_url,
          mileage_range:
            issue.mileage_range_low && issue.mileage_range_high
              ? `${issue.mileage_range_low.toLocaleString()} - ${issue.mileage_range_high.toLocaleString()} miles`
              : null,
        });
      }
    }

    // Sort model issues by severity
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    modelIssuesToWatch.sort(
      (a, b) => (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4)
    );

    // =========================================================================
    // CALCULATE HEALTH SCORE
    // =========================================================================
    let healthScore = 100;

    // Deduct for urgent items
    const urgentCount = recommendations.filter((r) => r.priority === 'URGENT').length;
    healthScore -= urgentCount * 15;

    // Deduct for due soon items
    const dueSoonCount = recommendations.filter((r) => r.priority === 'DUE_SOON').length;
    healthScore -= dueSoonCount * 5;

    // Deduct for critical model issues
    const criticalIssues = modelIssuesToWatch.filter((i) => i.severity === 'critical').length;
    healthScore -= criticalIssues * 10;

    // Deduct for weak battery
    if (vehicle.battery_status === 'weak') healthScore -= 10;
    if (vehicle.battery_status === 'dead') healthScore -= 25;

    // Deduct for low tire tread
    if (vehicle.tire_tread_32nds && vehicle.tire_tread_32nds <= 4) healthScore -= 15;

    // Clamp to 0-100
    healthScore = Math.max(0, Math.min(100, healthScore));

    // Sort recommendations by priority
    const priorityOrder = { URGENT: 0, DUE_SOON: 1, UPCOMING: 2, INFO: 3 };
    recommendations.sort(
      (a, b) => (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4)
    );

    // Update health_last_analyzed_at
    try {
      await client.rpc('update_vehicle_health_analyzed', { p_vehicle_id: vehicle.id });
    } catch (updateErr) {
      console.warn('[AL Tools] Failed to update health_last_analyzed_at:', updateErr);
    }

    // Build response
    const response = {
      vehicle: {
        id: vehicle.id,
        nickname: vehicle.nickname,
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        trim: vehicle.trim,
        current_mileage: currentMileage,
        matched_car_slug: vehicle.matched_car_slug,
        storage_mode: isInStorage,
      },
      health_score: healthScore,
      recommendations,
      model_issues_to_watch: modelIssuesToWatch.slice(0, 10), // Limit to top 10
    };

    // Add car info if matched
    if (car) {
      response.car = {
        name: car.name,
        engineType: car.engineType,
        hp: car.hp,
        reliability_score: car.score_reliability,
      };
    }

    // Add storage alerts if in storage mode
    if (isInStorage && storageAlerts.length > 0) {
      response.storage_alerts = storageAlerts;
    }

    // Add instruction for AL
    response.instruction =
      'Present the health score prominently. Group recommendations by priority (URGENT first). For storage mode vehicles, highlight storage alerts. Mention specific model issues to watch if any are critical or high severity.';

    return response;
  } catch (err) {
    console.error('[AL Tools] analyze_vehicle_health failed:', err);
    return { error: err.message || 'analyze_vehicle_health failed' };
  }
}

// =============================================================================
// UPLOADED CONTENT ANALYSIS
// =============================================================================

/**
 * Analyze uploaded images or documents for automotive context
 * @param {Object} params - Analysis parameters
 * @param {string} params.attachment_id - ID of the uploaded attachment
 * @param {string} params.public_url - Public URL of the file (if no ID)
 * @param {string} params.analysis_type - Type of analysis: 'general', 'diagnose', 'identify', 'estimate'
 * @param {string} params.user_context - User's description of what they want analyzed
 * @param {string} params.car_id - Optional car UUID for better analysis
 * @returns {Object} Analysis results
 */
export async function analyzeUploadedContent({
  attachment_id = null,
  public_url = null,
  analysis_type = 'general',
  user_context = '',
  car_id = null,
}) {
  try {
    // Validate we have either attachment_id or public_url
    if (!attachment_id && !public_url) {
      return {
        error: 'Either attachment_id or public_url is required',
        instruction: 'Ask the user to upload an image or provide a URL to analyze.',
      };
    }

    const db = getDbClient({ requireServiceRole: true });
    let fileUrl = public_url;
    let fileType = 'unknown';
    let fileName = 'uploaded_file';

    // If we have an attachment_id, fetch the details
    if (attachment_id) {
      const { data: attachment, error: attachError } = await db
        .from('al_attachments')
        .select(
          'id, public_url, file_type, file_name, file_size, user_id, conversation_id, created_at'
        )
        .eq('id', attachment_id)
        .single();

      if (attachError || !attachment) {
        return { error: 'Attachment not found' };
      }

      fileUrl = attachment.public_url;
      fileType = attachment.file_type;
      fileName = attachment.file_name;
    }

    // Get car context if provided
    let carContext = null;
    if (car_id) {
      const carSlug = await getSlugFromCarId(car_id);
      if (carSlug) {
        const { data: carData } = await db.rpc('get_car_ai_context_v2', { p_car_slug: carSlug });
        if (carData?.[0]) {
          carContext = carData[0];
        }
      }
    }

    // Determine analysis prompt based on type
    const analysisPrompts = {
      general: `Analyze this automotive-related image. Describe what you see and identify any relevant details about the vehicle, parts, or condition shown.`,
      diagnose: `Analyze this image for potential issues or problems. Identify any visible damage, wear, leaks, corrosion, or other concerns. Provide a diagnostic assessment and severity level.`,
      identify: `Identify the vehicle, part, or component shown in this image. Provide make/model/year if it's a vehicle, or part name/number/manufacturer if it's a component.`,
      estimate: `Analyze this image to provide repair or modification estimates. Identify what work might be needed and rough cost ranges.`,
    };

    const analysisPrompt = analysisPrompts[analysis_type] || analysisPrompts.general;

    // Build context string
    let contextString = user_context ? `User's question/context: "${user_context}"\n\n` : '';
    if (carContext) {
      contextString += `Vehicle context: ${carContext.year || ''} ${carContext.make || ''} ${carContext.model || ''} ${carContext.variant || ''}\n`;
      contextString += `Engine: ${carContext.engine || 'Unknown'}, HP: ${carContext.hp || 'Unknown'}\n\n`;
    }

    // Return structured analysis request for Claude Vision
    // Note: The actual vision analysis happens in the AI route when this data is passed to Claude
    return {
      analysis_ready: true,
      file_url: fileUrl,
      file_type: fileType,
      file_name: fileName,
      analysis_type,
      analysis_prompt: analysisPrompt,
      context: contextString,
      car_context: carContext
        ? {
            name: carContext.name,
            year: carContext.year,
            make: carContext.make,
            model: carContext.model,
            engine: carContext.engine,
            hp: carContext.hp,
          }
        : null,
      instruction: `Use Claude Vision to analyze the image at ${fileUrl}. Apply the analysis prompt: "${analysisPrompt}" with the provided context. Provide specific, actionable insights relevant to the user's needs.`,
    };
  } catch (err) {
    console.error('[AL Tools] analyze_uploaded_content failed:', err);
    return { error: err.message || 'analyze_uploaded_content failed' };
  }
}

// =============================================================================
// TOOL EXECUTOR
// =============================================================================

/**
 * Execute a tool call from Claude
 * @param {string} toolName - Name of the tool to execute
 * @param {Object} toolInput - Input parameters for the tool
 * @returns {Object} Tool execution result
 */
/**
 * Extract structured sources from tool results for citation display
 * Returns an array of source objects: { type, label, url?, detail? }
 */
function extractSourcesFromToolResult(toolName, result) {
  const sources = [];
  let sourceId = 1;

  if (!result || result.error) return sources;

  // =========================================================================
  // TOOL-SPECIFIC HANDLERS (check these FIRST for better labels)
  // =========================================================================

  // Car search - concise label, details in the detail field
  if (toolName === 'search_cars' && result.cars?.length > 0) {
    const count = result.cars.length;
    const carNames = result.cars
      .slice(0, 2)
      .map((c) => c.name)
      .filter(Boolean);
    // Detail shows what was found (for transparency)
    const detail =
      carNames.length > 0
        ? `${carNames.join(', ')}${count > 2 ? ` +${count - 2} more` : ''}`
        : `${count} ${count === 1 ? 'car' : 'cars'} found`;
    sources.push({
      id: sourceId++,
      type: 'database',
      label: 'AutoRev Database',
      detail,
    });
    return sources; // Return early - we have a specific source
  }

  // Car context / details - car name is the key context here
  if ((toolName === 'get_car_ai_context' || toolName === 'get_car_details') && result.car) {
    const carName =
      result.car.name ||
      result.car.slug?.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    sources.push({
      id: sourceId++,
      type: 'database',
      label: 'AutoRev Database',
      detail: carName || 'Vehicle specifications',
    });
    return sources; // Return early - we have a specific source
  }

  // Car comparison - show what's being compared in detail
  if (toolName === 'compare_cars' && result.comparison) {
    const comp = result.comparison;
    const carNames = [comp.car1?.name, comp.car2?.name].filter(Boolean).join(' vs ');
    sources.push({
      id: sourceId++,
      type: 'database',
      label: 'AutoRev Database',
      detail: carNames || 'Vehicle comparison',
    });
    return sources; // Return early - we have a specific source
  }

  // =========================================================================
  // GENERIC HANDLERS (fallbacks for tools without specific handlers)
  // =========================================================================

  // Generic database sources (only if no specific handler matched above)
  if (
    result.source === 'db_fts' ||
    result.source === 'car_issues' ||
    result.source === 'local_data'
  ) {
    sources.push({
      id: sourceId++,
      type: 'database',
      label: 'AutoRev Database',
      detail: result.source,
    });
  }

  // Expert reviews (YouTube)
  if (toolName === 'get_expert_reviews' && result.reviews) {
    result.reviews.forEach((review) => {
      if (review.url) {
        sources.push({
          id: sourceId++,
          type: 'youtube',
          label: review.channel || 'YouTube Review',
          url: review.url,
          detail: review.title,
        });
      }
    });
  }

  // Known issues with source URLs
  if (toolName === 'get_known_issues' && result.issues) {
    const urlsAdded = new Set();
    result.issues.forEach((issue) => {
      if (issue.sourceUrl && !urlsAdded.has(issue.sourceUrl)) {
        urlsAdded.add(issue.sourceUrl);
        sources.push({
          id: sourceId++,
          type: 'reference',
          label: 'Issue Report',
          url: issue.sourceUrl,
          detail: issue.name,
        });
      }
    });
    // If no specific URLs but we have issues, cite the database
    if (sources.length === 0 && result.issueCount > 0) {
      sources.push({
        id: sourceId++,
        type: 'database',
        label: 'AutoRev Known Issues Database',
        detail: `${result.issueCount} documented issues`,
      });
    }
  }

  // Track lap times with source URLs
  if (toolName === 'get_track_lap_times' && result.laps) {
    const urlsAdded = new Set();
    result.laps.forEach((lap) => {
      if (lap.source_url && !urlsAdded.has(lap.source_url)) {
        urlsAdded.add(lap.source_url);
        sources.push({
          id: sourceId++,
          type: 'reference',
          label: lap.track?.name || 'Track Time Source',
          url: lap.source_url,
        });
      }
    });
    if (sources.length === 0 && result.laps?.length > 0) {
      sources.push({
        id: sourceId++,
        type: 'database',
        label: 'AutoRev Lap Times Database',
        detail: `${result.laps.length} verified lap times`,
      });
    }
  }

  // Dyno runs with source URLs
  if (toolName === 'get_dyno_runs' && result.runs) {
    const urlsAdded = new Set();
    result.runs.forEach((run) => {
      if (run.source_url && !urlsAdded.has(run.source_url)) {
        urlsAdded.add(run.source_url);
        sources.push({
          id: sourceId++,
          type: 'reference',
          label: 'Dyno Result',
          url: run.source_url,
          detail: run.run_kind || 'dyno run',
        });
      }
    });
    if (sources.length === 0 && result.runs?.length > 0) {
      sources.push({
        id: sourceId++,
        type: 'database',
        label: 'AutoRev Dyno Database',
        detail: `${result.runs.length} verified dyno runs`,
      });
    }
  }

  // Knowledge/vector search results
  if (toolName === 'search_knowledge' && result.results) {
    result.results.forEach((r) => {
      if (r.source?.url) {
        sources.push({
          id: sourceId++,
          type: r.source.type || 'reference',
          label: r.source.name || r.source.type || 'Source',
          url: r.source.url,
          detail: r.excerpt?.slice(0, 100),
        });
      }
    });
  }

  // Community insights
  if (toolName === 'search_community_insights' && result.insights) {
    result.insights.forEach((insight) => {
      if (insight.source_url) {
        sources.push({
          id: sourceId++,
          type: 'forum',
          label: insight.source_name || 'Forum',
          url: insight.source_url,
        });
      }
    });
  }

  // Web search results
  if (toolName === 'search_web' && result.results) {
    result.results.forEach((r) => {
      if (r.url) {
        sources.push({
          id: sourceId++,
          type: 'web',
          label: r.title || new URL(r.url).hostname,
          url: r.url,
        });
      }
    });
  }

  // URL reading results
  if (toolName === 'read_url' && result.url && result.success) {
    sources.push({
      id: sourceId++,
      type: 'web',
      label: result.title || new URL(result.url).hostname,
      url: result.url,
    });
  }

  // Parts search
  if (toolName === 'search_parts' && result.parts?.length > 0) {
    sources.push({
      id: sourceId++,
      type: 'database',
      label: 'AutoRev Parts Catalog',
      detail: `${result.parts.length} matching parts`,
    });
  }

  // Live parts research - cite vendor sources
  if (toolName === 'research_parts_live' && result.top_picks?.length > 0) {
    // Group by vendor to avoid duplicate sources
    const vendorUrls = new Map();
    result.top_picks.forEach((pick) => {
      if (pick.url && pick.vendor) {
        if (!vendorUrls.has(pick.vendor)) {
          vendorUrls.set(pick.vendor, pick.url);
        }
      }
    });

    vendorUrls.forEach((url, vendor) => {
      sources.push({
        id: sourceId++,
        type: 'vendor',
        label: vendor,
        url,
        detail: 'Parts & pricing',
      });
    });

    // Add summary source
    if (sources.length === 0) {
      sources.push({
        id: sourceId++,
        type: 'live_search',
        label: 'Live Vendor Search',
        detail: `${result.total_results} parts found across ${result.vendors_searched?.length || 0} vendors`,
      });
    }
  }

  // Maintenance schedule
  if (toolName === 'get_maintenance_schedule' && result.intervals) {
    sources.push({
      id: sourceId++,
      type: 'database',
      label: 'AutoRev Maintenance Database',
      detail: `${result.intervals.length} service intervals`,
    });
  }

  // Encyclopedia content
  if (toolName === 'search_encyclopedia' && result.results?.length > 0) {
    sources.push({
      id: sourceId++,
      type: 'encyclopedia',
      label: 'AutoRev Encyclopedia',
      detail: `${result.results.length} articles`,
    });
  }

  // Default: if no sources found but tool succeeded, cite AutoRev
  if (sources.length === 0 && !result.error && !result.message?.includes('No ')) {
    sources.push({
      id: sourceId++,
      type: 'database',
      label: 'AutoRev',
      detail: toolName.replace(/_/g, ' '),
    });
  }

  return sources;
}

export async function executeToolCall(toolName, toolInput, options = {}) {
  const tools = {
    search_cars: searchCars,
    get_car_details: getCarDetails,
    get_car_ai_context: getCarAIContext,
    decode_vin: decodeVin,
    get_expert_reviews: getExpertReviews,
    get_known_issues: getKnownIssues,
    compare_cars: compareCars,
    search_encyclopedia: searchEncyclopediaContent,
    get_upgrade_info: getUpgradeInfo,
    calculate_mod_impact: calculateModImpact,
    // search_forums removed - was a stub. Use search_community_insights instead.
    search_web: searchWeb,
    read_url: readUrl,
    search_parts: searchParts,
    research_parts_live: researchPartsLive,
    find_best_parts: findBestParts,
    get_maintenance_schedule: getMaintenanceSchedule,
    recommend_build: recommendBuild,
    search_knowledge: searchKnowledge,
    get_track_lap_times: getTrackLapTimes,
    get_dyno_runs: getDynoRuns,
    get_price_history: getPriceHistory,
    search_community_insights: searchCommunityInsights,
    search_events: searchEvents,
    analyze_vehicle_health: analyzeVehicleHealth,
    analyze_uploaded_content: analyzeUploadedContent,
    // User data tools
    get_user_builds: getUserBuilds,
    get_user_goals: getUserPerformanceGoals,
    get_user_vehicle_details: getUserVehicleDetails,
    get_user_context: getUserContext,
  };

  // Tools that support progress callbacks
  const TOOLS_WITH_PROGRESS = new Set(['research_parts_live']);

  const tool = tools[toolName];
  if (!tool) {
    return { error: `Unknown tool: ${toolName}` };
  }

  // Extract options
  const { meta, cacheScopeKey = 'global', onProgress } = options;

  try {
    // Best-effort caching for expensive tools (kept tight to avoid stale facts).
    // Extended caching to more tools for faster AL responses (2026-01-11)
    // NOTE: Tools with progress callbacks are NOT cached to ensure progress events fire
    const cacheable = new Set([
      'get_car_ai_context', // Core car data - changes rarely
      'search_knowledge', // Vector search - content stable
      'get_track_lap_times', // Track data - semi-static
      'get_dyno_runs', // Dyno data - semi-static
      'search_community_insights', // Forum insights - stable
      'search_encyclopedia', // Encyclopedia content - static
      'search_events', // Events - moderate change rate
      'search_parts', // Parts catalog - stable
      'get_maintenance_schedule', // Maintenance specs - static
      'get_expert_reviews', // YouTube reviews - stable
      'get_known_issues', // Known issues - static
      'read_url', // URL content - avoid re-fetching same URL
      'get_user_context', // User data - avoid repeated fetches in same session
      'get_price_history', // Price data - stable, expensive to compute
    ]);
    const ttlByToolMs = {
      get_car_ai_context: 2 * 60 * 1000, // 2 min - core data
      search_knowledge: 5 * 60 * 1000, // 5 min - vector search
      get_track_lap_times: 10 * 60 * 1000, // 10 min - rarely changes
      get_dyno_runs: 10 * 60 * 1000, // 10 min - rarely changes
      search_community_insights: 5 * 60 * 1000, // 5 min - forum data
      search_encyclopedia: 5 * 60 * 1000, // 5 min - static content
      search_events: 3 * 60 * 1000, // 3 min - events can change
      search_parts: 5 * 60 * 1000, // 5 min - parts catalog
      get_maintenance_schedule: 10 * 60 * 1000, // 10 min - static specs
      get_expert_reviews: 5 * 60 * 1000, // 5 min - YouTube data
      get_known_issues: 10 * 60 * 1000, // 10 min - issues are stable
      read_url: 5 * 60 * 1000, // 5 min - avoid re-fetching same URL
      get_user_context: 2 * 60 * 1000, // 2 min - user data can change
      get_price_history: 10 * 60 * 1000, // 10 min - price data rarely changes
    };

    // Skip caching for tools with progress callbacks (need fresh execution for events)
    const shouldCache = cacheable.has(toolName) && !onProgress;

    if (shouldCache) {
      const rawKey = `${cacheScopeKey}:${toolName}:${stableStringify(toolInput || {})}`;
      const cacheKey = hashCacheKey(rawKey);
      const cached = getCached(cacheKey);
      if (cached.hit) {
        if (meta) meta.cacheHit = true;
        return cached.value;
      }
      if (meta) meta.cacheHit = false;
      const result = await tool(toolInput);
      // Extract and add sources for citation display
      const sources = extractSourcesFromToolResult(toolName, result);
      const resultWithSources = sources.length > 0 ? { ...result, __sources: sources } : result;
      setCached(cacheKey, resultWithSources, ttlByToolMs[toolName] || 60_000);
      return resultWithSources;
    }

    // Execute tool with optional progress callback
    let result;
    if (TOOLS_WITH_PROGRESS.has(toolName) && onProgress) {
      result = await tool(toolInput, { onProgress });
    } else {
      result = await tool(toolInput);
    }

    if (meta) meta.cacheHit = false;
    // Extract and add sources for citation display
    const sources = extractSourcesFromToolResult(toolName, result);
    return sources.length > 0 ? { ...result, __sources: sources } : result;
  } catch (err) {
    console.error(`[AL Tools] Error executing ${toolName}:`, err);
    return { error: `Tool execution failed: ${err.message}` };
  }
}

// =============================================================================
// USER BUILD & GOAL TOOLS
// =============================================================================

/**
 * Get user's build projects with planned upgrades and performance projections
 *
 * @param {Object} params - Parameters
 * @param {string} [params.vehicle_id] - Optional: filter to specific vehicle
 * @param {boolean} [params.include_parts] - Include individual parts list
 * @param {string} params.user_id - User ID (passed from AL context)
 * @returns {Object} User's build projects with upgrades and projections
 */
export async function getUserBuilds({ vehicle_id = null, include_parts = false, user_id = null }) {
  const client = getDbClient({ requireServiceRole: true });
  if (!isSupabaseConfigured || !client) {
    return { error: 'Supabase not configured' };
  }
  if (!user_id) {
    return { error: 'user_id is required - this tool requires user context' };
  }

  // JOIN to cars table to get slug (car_id is single source of truth)
  const PROJECT_COLUMNS =
    'id, user_id, car_id, car_name, project_name, selected_upgrades, total_hp_gain, total_cost_low, total_cost_high, final_hp, stock_hp, notes, is_favorite, created_at, updated_at, cars:car_id (slug, name)';

  try {
    // Fetch user's build projects
    let query = client
      .from('user_projects')
      .select(PROJECT_COLUMNS)
      .eq('user_id', user_id)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .limit(10);

    if (vehicle_id) {
      // Get vehicle's matched car_id to filter projects
      const { data: vehicle } = await client
        .from('user_vehicles')
        .select('matched_car_id')
        .eq('id', vehicle_id)
        .single();

      if (vehicle?.matched_car_id) {
        query = query.eq('car_id', vehicle.matched_car_id);
      }
    }

    const { data: projects, error } = await query;
    if (error) throw error;

    if (!projects || projects.length === 0) {
      return {
        builds: [],
        message: 'No build projects found. User can create builds in the Tuning Shop.',
      };
    }

    // Optionally fetch parts for each project
    const projectParts = {};
    if (include_parts && projects.length > 0) {
      const projectIds = projects.map((p) => p.id);
      const { data: parts } = await client
        .from('user_project_parts')
        .select(
          'project_id, part_id, quantity, notes, parts(name, brand, category, price_low, price_high)'
        )
        .in('project_id', projectIds);

      if (parts) {
        parts.forEach((p) => {
          if (!projectParts[p.project_id]) projectParts[p.project_id] = [];
          projectParts[p.project_id].push({
            name: p.parts?.name,
            brand: p.parts?.brand,
            category: p.parts?.category,
            price_range: p.parts
              ? `$${p.parts.price_low || '?'}-$${p.parts.price_high || '?'}`
              : null,
            quantity: p.quantity,
            notes: p.notes,
          });
        });
      }
    }

    // Format builds for AL (get slug from JOIN)
    const builds = projects.map((p) => ({
      id: p.id,
      name: p.project_name || `${p.car_name} Build`,
      car: p.car_name,
      car_slug: p.cars?.slug || null, // Get slug from JOIN
      is_favorite: p.is_favorite,

      // Performance projections
      stock_hp: p.stock_hp,
      final_hp: p.final_hp,
      total_hp_gain: p.total_hp_gain,
      stock_zero_to_sixty: p.stock_zero_to_sixty,
      final_zero_to_sixty: p.final_zero_to_sixty,
      zero_to_sixty_improvement: p.zero_to_sixty_improvement,

      // Cost estimates
      total_cost_low: p.total_cost_low,
      total_cost_high: p.total_cost_high,
      cost_range: p.total_cost_low
        ? `$${p.total_cost_low.toLocaleString()}-$${p.total_cost_high?.toLocaleString() || '?'}`
        : null,

      // Upgrades
      selected_upgrades: p.selected_upgrades || [],
      upgrade_count: p.selected_upgrades?.length || 0,

      // Parts (if requested)
      parts: include_parts ? projectParts[p.id] || [] : undefined,

      notes: p.notes,
      updated_at: p.updated_at,
    }));

    return {
      builds,
      total_count: builds.length,
      has_favorite: builds.some((b) => b.is_favorite),
    };
  } catch (err) {
    console.error('[AL Tools] getUserBuilds error:', err);
    return { error: `Failed to fetch user builds: ${err.message}` };
  }
}

/**
 * Get user's performance goals (target lap times, 0-60, etc.)
 *
 * @param {Object} params - Parameters
 * @param {string} [params.vehicle_id] - Optional: filter to specific vehicle
 * @param {string} [params.status] - Filter by status: 'active', 'completed', 'all' (default: 'active')
 * @param {string} params.user_id - User ID (passed from AL context)
 * @returns {Object} User's performance goals
 */
export async function getUserPerformanceGoals({
  vehicle_id = null,
  status = 'active',
  user_id = null,
}) {
  const client = getDbClient({ requireServiceRole: true });
  if (!isSupabaseConfigured || !client) {
    return { error: 'Supabase not configured' };
  }
  if (!user_id) {
    return { error: 'user_id is required - this tool requires user context' };
  }

  const GOAL_COLUMNS =
    'id, user_id, user_vehicle_id, goal_type, target_value, target_unit, current_value, status, priority, notes, target_date, achieved_at, created_at, updated_at';

  try {
    let query = client
      .from('user_performance_goals')
      .select(GOAL_COLUMNS)
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (vehicle_id) {
      query = query.eq('user_vehicle_id', vehicle_id);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: goals, error } = await query;
    if (error) throw error;

    if (!goals || goals.length === 0) {
      return {
        goals: [],
        message:
          status === 'active'
            ? 'No active performance goals. User can set goals in their garage.'
            : 'No performance goals found.',
      };
    }

    // Format goals for AL
    const formattedGoals = goals.map((g) => ({
      id: g.id,
      goal_type: g.goal_type,
      title: g.title || `${g.goal_type} goal`,
      description: g.description,

      // Target and progress
      target_value: g.target_value,
      achieved_value: g.achieved_value,
      progress_percent:
        g.target_value && g.achieved_value
          ? Math.round((g.achieved_value / g.target_value) * 100)
          : null,

      // Track info (for lap time goals)
      track_name: g.track_name,

      // Status
      status: g.status,
      is_completed: g.status === 'completed',
      completed_at: g.completed_at,
      deadline: g.deadline,

      created_at: g.created_at,
    }));

    const activeGoals = formattedGoals.filter((g) => g.status === 'active');
    const completedGoals = formattedGoals.filter((g) => g.status === 'completed');

    return {
      goals: formattedGoals,
      active_count: activeGoals.length,
      completed_count: completedGoals.length,
      summary:
        activeGoals.length > 0
          ? `User has ${activeGoals.length} active goal(s): ${activeGoals.map((g) => g.title).join(', ')}`
          : null,
    };
  } catch (err) {
    console.error('[AL Tools] getUserPerformanceGoals error:', err);
    return { error: `Failed to fetch performance goals: ${err.message}` };
  }
}

/**
 * Get detailed info about a specific user vehicle including mods, custom specs, service summary
 *
 * @param {Object} params - Parameters
 * @param {string} [params.vehicle_id] - Vehicle ID (uses primary if not specified)
 * @param {boolean} [params.include_service_history] - Include recent service logs
 * @param {string} params.user_id - User ID (passed from AL context)
 * @returns {Object} Detailed vehicle information
 */
export async function getUserVehicleDetails({
  vehicle_id = null,
  include_service_history = true,
  user_id = null,
}) {
  const client = getDbClient({ requireServiceRole: true });
  if (!isSupabaseConfigured || !client) {
    return { error: 'Supabase not configured' };
  }
  if (!user_id) {
    return { error: 'user_id is required - this tool requires user context' };
  }

  const VEHICLE_COLUMNS =
    'id, user_id, vin, year, make, model, trim, matched_car_id, matched_car_slug, matched_car_variant_key, nickname, color, mileage, purchase_date, is_primary, installed_modifications, total_hp_gain, active_build_id, custom_specs, notes, created_at';

  try {
    // Get the vehicle
    let vehicleQuery = client
      .from('user_vehicles')
      .select(VEHICLE_COLUMNS)
      .eq('user_id', user_id)
      .is('deleted_at', null);

    if (vehicle_id) {
      vehicleQuery = vehicleQuery.eq('id', vehicle_id);
    } else {
      vehicleQuery = vehicleQuery.eq('is_primary', true);
    }

    const { data: vehicle, error: _vehicleError } = await vehicleQuery.maybeSingle();

    // If no primary, get most recent
    let finalVehicle = vehicle;
    if (!vehicle && !vehicle_id) {
      const { data: fallback } = await client
        .from('user_vehicles')
        .select(VEHICLE_COLUMNS)
        .eq('user_id', user_id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      finalVehicle = fallback;
    }

    if (!finalVehicle) {
      return { error: 'No vehicle found. User has no vehicles in their garage.' };
    }

    // Get service history if requested
    let serviceLogs = [];
    if (include_service_history) {
      const { data: logs } = await client
        .from('user_service_logs')
        .select(
          'service_date, service_type, service_description, odometer_reading, total_cost, performed_by, shop_name'
        )
        .eq('user_vehicle_id', finalVehicle.id)
        .order('service_date', { ascending: false })
        .limit(10);
      serviceLogs = logs || [];
    }

    // Format vehicle details
    const details = {
      id: finalVehicle.id,
      nickname: finalVehicle.nickname,
      year: finalVehicle.year,
      make: finalVehicle.make,
      model: finalVehicle.model,
      trim: finalVehicle.trim,
      full_name: `${finalVehicle.year} ${finalVehicle.make} ${finalVehicle.model}${finalVehicle.trim ? ' ' + finalVehicle.trim : ''}`,

      // VIN & matching
      vin: finalVehicle.vin,
      matched_car_slug: finalVehicle.matched_car_slug,
      matched_car_variant_key: finalVehicle.matched_car_variant_key,

      // Mileage & ownership
      current_mileage: finalVehicle.current_mileage,
      purchase_date: finalVehicle.purchase_date,
      purchase_price: finalVehicle.purchase_price,
      ownership_status: finalVehicle.ownership_status,
      is_primary: finalVehicle.is_primary,

      // Modifications
      installed_modifications: finalVehicle.installed_modifications || [],
      mod_count: finalVehicle.installed_modifications?.length || 0,
      total_hp_gain: finalVehicle.total_hp_gain || 0,
      active_build_id: finalVehicle.active_build_id,

      // Custom specs (user overrides)
      custom_specs: finalVehicle.custom_specs || {},

      // Maintenance status
      last_oil_change_date: finalVehicle.last_oil_change_date,
      last_oil_change_mileage: finalVehicle.last_oil_change_mileage,
      next_oil_due_mileage: finalVehicle.next_oil_due_mileage,
      registration_due_date: finalVehicle.registration_due_date,
      inspection_due_date: finalVehicle.inspection_due_date,

      // Storage & condition
      storage_mode: finalVehicle.storage_mode,
      battery_status: finalVehicle.battery_status,
      tire_tread_32nds: finalVehicle.tire_tread_32nds,

      // Notes
      owner_notes: finalVehicle.owner_notes,

      // Service history
      recent_service_logs: serviceLogs.map((log) => ({
        date: log.service_date,
        type: log.service_type,
        description: log.service_description,
        mileage: log.odometer_reading,
        cost: log.total_cost,
        shop: log.shop_name || log.performed_by,
      })),
      service_log_count: serviceLogs.length,
    };

    return {
      vehicle: details,
      has_modifications: details.mod_count > 0,
      has_custom_specs: Object.keys(details.custom_specs).length > 0,
      has_service_history: serviceLogs.length > 0,
    };
  } catch (err) {
    console.error('[AL Tools] getUserVehicleDetails error:', err);
    return { error: `Failed to fetch vehicle details: ${err.message}` };
  }
}

/**
 * Get comprehensive user context in a single call.
 * Combines vehicle info, builds, and performance goals for efficient AL context.
 *
 * Use this instead of calling get_user_builds, get_user_goals, and get_user_vehicle_details separately.
 *
 * @param {Object} params - Parameters
 * @param {string} params.user_id - User ID (required, from AL context)
 * @param {string} [params.vehicle_id] - Optional: specific vehicle (uses primary if not specified)
 * @param {string[]} [params.include] - What to include: 'vehicle', 'builds', 'goals', 'service_history' (default: all)
 * @returns {Object} Unified user context with vehicle, builds, and goals
 */
export async function getUserContext({
  user_id,
  vehicle_id = null,
  include = ['vehicle', 'builds', 'goals', 'service_history'],
}) {
  const client = getDbClient({ requireServiceRole: true });
  if (!isSupabaseConfigured || !client) {
    return { error: 'Supabase not configured' };
  }
  if (!user_id) {
    return { error: 'user_id is required - this tool requires user context' };
  }

  const includeSet = new Set(include || ['vehicle', 'builds', 'goals', 'service_history']);
  const result = {
    user_id,
    vehicle: null,
    builds: [],
    goals: [],
    service_history: [],
  };

  try {
    // 1. Get vehicle first (needed for filtering builds/goals)
    let vehicleId = vehicle_id;
    let carId = null;

    if (includeSet.has('vehicle') || includeSet.has('builds') || includeSet.has('goals')) {
      const VEHICLE_COLUMNS =
        'id, user_id, vin, year, make, model, trim, matched_car_id, matched_car_slug, matched_car_variant_key, nickname, color, mileage, purchase_date, is_primary, installed_modifications, total_hp_gain, active_build_id, custom_specs, notes, created_at';

      let vehicleQuery = client
        .from('user_vehicles')
        .select(VEHICLE_COLUMNS)
        .eq('user_id', user_id)
        .is('deleted_at', null);

      if (vehicleId) {
        vehicleQuery = vehicleQuery.eq('id', vehicleId);
      } else {
        vehicleQuery = vehicleQuery.eq('is_primary', true);
      }

      let { data: vehicle } = await vehicleQuery.maybeSingle();

      // Fallback to most recent if no primary
      if (!vehicle && !vehicleId) {
        const { data: fallback } = await client
          .from('user_vehicles')
          .select(VEHICLE_COLUMNS)
          .eq('user_id', user_id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        vehicle = fallback;
      }

      if (vehicle) {
        vehicleId = vehicle.id;
        carId = vehicle.matched_car_id;

        if (includeSet.has('vehicle')) {
          result.vehicle = {
            id: vehicle.id,
            name: vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
            year: vehicle.year,
            make: vehicle.make,
            model: vehicle.model,
            trim: vehicle.trim,
            vin: vehicle.vin,
            color: vehicle.color,
            mileage: vehicle.mileage,
            is_primary: vehicle.is_primary,
            matched_car_slug: vehicle.matched_car_slug,

            // Mods and specs
            installed_mods: vehicle.installed_modifications || [],
            mod_count: vehicle.installed_modifications?.length || 0,
            total_hp_gain: vehicle.total_hp_gain || 0,
            custom_specs: vehicle.custom_specs || {},
            active_build_id: vehicle.active_build_id,

            purchase_date: vehicle.purchase_date,
            created_at: vehicle.created_at,
          };
        }
      }
    }

    // 2. Get builds (parallel with goals if we have vehicle info)
    const buildPromise = includeSet.has('builds')
      ? (async () => {
          const PROJECT_COLUMNS =
            'id, car_id, car_slug, car_name, project_name, selected_upgrades, total_hp_gain, total_cost_low, total_cost_high, final_hp, stock_hp, notes, is_favorite, created_at, updated_at';

          let query = client
            .from('user_projects')
            .select(PROJECT_COLUMNS)
            .eq('user_id', user_id)
            .is('deleted_at', null)
            .order('updated_at', { ascending: false })
            .limit(5);

          if (carId) {
            query = query.eq('car_id', carId);
          }

          const { data: projects } = await query;
          return (projects || []).map((p) => ({
            id: p.id,
            name: p.project_name || `${p.car_name} Build`,
            car: p.car_name,
            car_slug: p.car_slug,
            is_favorite: p.is_favorite,
            stock_hp: p.stock_hp,
            final_hp: p.final_hp,
            total_hp_gain: p.total_hp_gain,
            cost_range: p.total_cost_low
              ? `$${p.total_cost_low.toLocaleString()}-$${p.total_cost_high?.toLocaleString() || '?'}`
              : null,
            upgrade_count: p.selected_upgrades?.length || 0,
            updated_at: p.updated_at,
          }));
        })()
      : Promise.resolve([]);

    // 3. Get goals (parallel with builds)
    const goalsPromise = includeSet.has('goals')
      ? (async () => {
          let query = client
            .from('user_performance_goals')
            .select(
              'id, goal_type, target_value, achieved_value, status, track_name, deadline, created_at'
            )
            .eq('user_id', user_id)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(5);

          if (vehicleId) {
            query = query.eq('user_vehicle_id', vehicleId);
          }

          const { data: goals } = await query;
          return (goals || []).map((g) => ({
            id: g.id,
            type: g.goal_type,
            target: g.target_value,
            current: g.achieved_value,
            progress:
              g.target_value && g.achieved_value
                ? Math.round((g.achieved_value / g.target_value) * 100)
                : 0,
            track: g.track_name,
            deadline: g.deadline,
            status: g.status,
          }));
        })()
      : Promise.resolve([]);

    // 4. Get service history (parallel)
    const servicePromise =
      includeSet.has('service_history') && vehicleId
        ? (async () => {
            const { data: logs } = await client
              .from('user_service_logs')
              .select(
                'service_date, service_type, service_description, odometer_reading, total_cost, shop_name'
              )
              .eq('user_vehicle_id', vehicleId)
              .order('service_date', { ascending: false })
              .limit(5);

            return (logs || []).map((log) => ({
              date: log.service_date,
              type: log.service_type,
              description: log.service_description,
              mileage: log.odometer_reading,
              cost: log.total_cost,
              shop: log.shop_name,
            }));
          })()
        : Promise.resolve([]);

    // Wait for all parallel queries
    const [builds, goals, serviceHistory] = await Promise.all([
      buildPromise,
      goalsPromise,
      servicePromise,
    ]);

    result.builds = builds;
    result.goals = goals;
    result.service_history = serviceHistory;

    // Add summary for AL
    result.summary = {
      has_vehicle: !!result.vehicle,
      vehicle_name: result.vehicle?.name || null,
      build_count: result.builds.length,
      active_goals: result.goals.length,
      recent_service_count: result.service_history.length,
    };

    return result;
  } catch (err) {
    console.error('[AL Tools] getUserContext error:', err);
    return { error: `Failed to fetch user context: ${err.message}` };
  }
}

// =============================================================================
// VIN DECODER (NHTSA API)
// =============================================================================

/**
 * Decode a VIN using the free NHTSA vPIC API
 * Returns vehicle specs, options, and manufacturing details
 * @param {Object} params
 * @param {string} params.vin - 17-character VIN
 * @returns {Object} Decoded vehicle information
 */
export async function decodeVin({ vin }) {
  if (!vin || typeof vin !== 'string') {
    return { error: 'VIN is required' };
  }

  // Clean and validate VIN
  const cleanVin = vin.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '');
  if (cleanVin.length !== 17) {
    return {
      error: 'Invalid VIN format. VIN must be exactly 17 characters.',
      provided_length: cleanVin.length,
    };
  }

  try {
    // NHTSA vPIC API - free, no auth required
    const response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${cleanVin}?format=json`
    );

    if (!response.ok) {
      return { error: `NHTSA API error: ${response.status}` };
    }

    const data = await response.json();
    const result = data.Results?.[0];

    if (!result || result.ErrorCode !== '0') {
      return {
        error: 'Could not decode VIN',
        error_text: result?.ErrorText || 'Unknown error',
      };
    }

    // Extract useful fields
    const decoded = {
      vin: cleanVin,
      year: result.ModelYear ? parseInt(result.ModelYear) : null,
      make: result.Make || null,
      model: result.Model || null,
      trim: result.Trim || null,
      body_style: result.BodyClass || null,
      doors: result.Doors ? parseInt(result.Doors) : null,

      // Engine info
      engine: {
        displacement_l: result.DisplacementL ? parseFloat(result.DisplacementL) : null,
        cylinders: result.EngineCylinders ? parseInt(result.EngineCylinders) : null,
        configuration: result.EngineConfiguration || null,
        fuel_type: result.FuelTypePrimary || null,
        horsepower: result.EngineHP ? parseInt(result.EngineHP) : null,
        turbo: result.Turbo === 'Yes',
        supercharger: result.Supercharger === 'Yes',
      },

      // Drivetrain
      transmission: result.TransmissionStyle || null,
      drive_type: result.DriveType || null,

      // Manufacturing
      plant_city: result.PlantCity || null,
      plant_country: result.PlantCountry || null,
      manufacturer: result.Manufacturer || null,

      // Safety (if available)
      abs: result.ABS === 'Standard',
      airbags: result.AirBagLocFront || null,

      // Weight (if available)
      gvwr: result.GVWR || null,

      // Summary for AL
      summary:
        `${result.ModelYear || ''} ${result.Make || ''} ${result.Model || ''} ${result.Trim || ''}`.trim(),
    };

    // Try to match to an AutoRev car slug
    if (decoded.year && decoded.make && decoded.model) {
      const matchedSlug = await matchVinToCar(decoded);
      if (matchedSlug) {
        decoded.autorev_car_slug = matchedSlug;
        decoded.autorev_matched = true;
      }
    }

    return decoded;
  } catch (err) {
    console.error('[AL Tools] decodeVin error:', err);
    return { error: `Failed to decode VIN: ${err.message}` };
  }
}

/**
 * Try to match decoded VIN info to an AutoRev car
 * @param {Object} decoded - Decoded VIN data
 * @returns {string|null} Car slug if matched
 */
async function matchVinToCar(decoded) {
  if (!isSupabaseConfigured || !supabase) return null;

  const { make, model, year } = decoded;
  if (!make || !model) return null;

  try {
    // Try to find a matching car in our database
    const { data: cars } = await supabase
      .from('cars')
      .select('slug, name, years')
      .ilike('name', `%${make}%${model}%`)
      .limit(5);

    if (!cars || cars.length === 0) return null;

    // Find best match (check if year falls in range)
    for (const car of cars) {
      // Handle new schema: year (integer) or yearStart/yearEnd
      if (car.year && year) {
        if (year === car.year) {
          return car.slug;
        }
      } else if ((car.yearStart || car.yearEnd) && year) {
        const startYear = car.yearStart || car.yearEnd;
        const endYear = car.yearEnd || car.yearStart;
        if (year >= startYear && year <= endYear) {
          return car.slug;
        }
      } else if (car.years && year) {
        // Fallback to old years string format
        const yearsMatch = car.years.match(/(\d{4})[-–]?(\d{4}|\+)?/);
        if (yearsMatch) {
          const startYear = parseInt(yearsMatch[1]);
          const endYear =
            yearsMatch[2] === '+' ? 2030 : yearsMatch[2] ? parseInt(yearsMatch[2]) : startYear;
          if (year >= startYear && year <= endYear) {
            return car.slug;
          }
        }
      }
    }

    // Return first match if no year match
    return cars[0]?.slug || null;
  } catch (err) {
    console.warn('[AL Tools] matchVinToCar error:', err);
    return null;
  }
}

const alTools = {
  // Core car tools
  searchCars,
  getCarDetails,
  getCarAIContext,

  // VIN decoder
  decodeVin,

  // Knowledge & research tools
  searchKnowledge,
  searchEncyclopediaContent,
  getExpertReviews,
  getKnownIssues,
  searchCommunityInsights,

  // Performance data tools
  getTrackLapTimes,
  getDynoRuns,
  getPriceHistory,

  // Parts & maintenance tools
  searchParts,
  getMaintenanceSchedule,
  getUpgradeInfo,
  calculateModImpact,
  recommendBuild,

  // Vehicle health tools
  analyzeVehicleHealth,

  // User data tools
  getUserBuilds,
  getUserPerformanceGoals,
  getUserVehicleDetails,
  getUserContext,

  // Uploaded content analysis
  analyzeUploadedContent,

  // Comparison & discovery tools
  compareCars,
  searchEvents,

  // Web search & URL reading (Exa AI)
  searchWeb,
  readUrl,

  // Live parts research
  researchPartsLive,
  persistResearchResults,

  // Tool executor
  executeToolCall,
};

export default alTools;
