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

import { supabase, supabaseServiceRole, isSupabaseConfigured } from './supabase';
import { fetchCars, fetchCarBySlug } from '@/lib/carsClient';
import { fetchVideosForCar, calculateCarConsensus } from './youtubeClient';
import { resolveCarId } from './carResolver';
import { searchEncyclopedia, getModificationArticle, getBuildGuideArticle, getTopicsForUpgrade } from './encyclopediaData';
import { upgradeDetails, upgradeCategories } from '@/data/upgradeEducation';
import { getCached, hashCacheKey, setCached, stableStringify } from './alToolCache';

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
    return { error: error?.error?.message || `Embedding request failed (${res.status})`, embedding: null, model: OPENAI_EMBEDDING_MODEL };
  }

  const data = await res.json();
  const embedding = data?.data?.[0]?.embedding;
  if (!Array.isArray(embedding)) {
    return { error: 'Embedding response missing embedding vector', embedding: null, model: OPENAI_EMBEDDING_MODEL };
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
        let cars = ftsResults.map(r => ({
          name: r.name,
          slug: r.slug,
          years: r.years,
          hp: r.hp,
          engine: r.engine,
          priceRange: r.price_range,
          // price_avg isn't returned by the RPC; omit from filtering unless present elsewhere
          priceAvg: null,
          category: r.category,
          drivetrain: null,
          highlight: r.highlight,
          scores: {},
        }));

        // Apply the subset of filters we can safely evaluate from this payload
        if (filters.hp_min) cars = cars.filter(c => (c.hp || 0) >= filters.hp_min);
        if (filters.hp_max) cars = cars.filter(c => (c.hp || 0) <= filters.hp_max);
        if (filters.category) cars = cars.filter(c => c.category === filters.category);

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
    results = results.filter(c => (c.priceAvg || 0) >= filters.budget_min);
  }
  if (filters.budget_max) {
    results = results.filter(c => (c.priceAvg || 0) <= filters.budget_max);
  }
  if (filters.hp_min) {
    results = results.filter(c => (c.hp || 0) >= filters.hp_min);
  }
  if (filters.hp_max) {
    results = results.filter(c => (c.hp || 0) <= filters.hp_max);
  }
  if (filters.category) {
    results = results.filter(c => c.category === filters.category);
  }
  if (filters.drivetrain) {
    results = results.filter(c => c.drivetrain === filters.drivetrain);
  }
  if (filters.tier) {
    results = results.filter(c => c.tier === filters.tier);
  }
  if (filters.brand) {
    const brandLower = filters.brand.toLowerCase();
    results = results.filter(c => 
      c.brand?.toLowerCase().includes(brandLower) ||
      c.name?.toLowerCase().includes(brandLower)
    );
  }
  if (filters.manual_available !== undefined) {
    results = results.filter(c => c.manualAvailable === filters.manual_available);
  }
  
  // Text search on query
  if (query) {
    const queryLower = query.toLowerCase();
    const queryTerms = queryLower.split(/\s+/);
    
    results = results.filter(car => {
      const searchText = [
        car.name,
        car.brand,
        car.category,
        car.engine,
        car.notes,
        car.highlight,
        car.tagline,
      ].filter(Boolean).join(' ').toLowerCase();
      
      return queryTerms.some(term => searchText.includes(term));
    });
  }
  
  // Sort results
  const sortFunctions = {
    hp: (a, b) => (b.hp || 0) - (a.hp || 0),
    price: (a, b) => (a.priceAvg || 0) - (b.priceAvg || 0),
    value: (a, b) => (b.value || b.score_value || 5) - (a.value || a.score_value || 5),
    track: (a, b) => (b.track || b.score_track || 5) - (a.track || a.score_track || 5),
    reliability: (a, b) => (b.reliability || b.score_reliability || 5) - (a.reliability || a.score_reliability || 5),
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
    cars: results.map(car => ({
      name: car.name,
      slug: car.slug,
      years: car.years,
      hp: car.hp,
      engine: car.engine,
      priceRange: car.priceRange,
      priceAvg: car.priceAvg,
      category: car.category,
      drivetrain: car.drivetrain,
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
        years: car.years,
        brand: car.brand,
        tier: car.tier,
        category: car.category,
        engine: car.engine,
        hp: car.hp,
        torque: car.torque,
        trans: car.trans,
        drivetrain: car.drivetrain,
        curb_weight: car.curb_weight,
        zero_to_sixty: car.zero_to_sixty,
        price_avg: car.price_avg,
        price_range: car.price_range,
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
    filtered.car_slug = car_slug;

    return filtered;
  } catch (err) {
    console.error('[AL Tools] Error fetching get_car_ai_context:', err);
    return { error: err.message || 'Failed to fetch car AI context', car_slug };
  }
}

/**
 * Search proprietary knowledge base with citations (document_chunks).
 * @param {Object} params
 * @returns {Object}
 */
export async function searchKnowledge({ query, car_slug = null, topic = null, limit = 6 }) {
  const client = getDbClient({ requireServiceRole: true });
  if (!isSupabaseConfigured || !client) {
    return { error: 'Supabase not configured' };
  }
  if (!query) return { error: 'query is required' };

  try {
    // Use carResolver for consistent car_id resolution (cached, indexed)
    const carId = car_slug ? await resolveCarId(car_slug) : null;

    const { embedding, error: embedErr, model } = await generateQueryEmbedding(query);
    if (embedErr) {
      return {
        error: embedErr,
        message: 'Embeddings not available; configure OPENAI_API_KEY to enable semantic knowledge search.',
        query,
        car_slug,
      };
    }

    const pgVec = vectorToPgVectorLiteral(embedding);
    if (!pgVec) return { error: 'Failed to format embedding vector' };

    const { data: matches, error: searchErr } = await client.rpc('search_document_chunks', {
      p_embedding: pgVec,
      p_car_id: carId,
      p_limit: Math.max(1, Math.min(Number(limit) || 6, 12)),
    });
    if (searchErr) throw searchErr;

    let results = Array.isArray(matches) ? matches : [];
    if (topic) {
      const topicLower = String(topic).toLowerCase();
      results = results.filter(r => (r.topic || '').toLowerCase().includes(topicLower));
    }

    return {
      query,
      car_slug,
      embeddingModel: model,
      count: results.length,
      results: results.map(r => ({
        similarity: r.similarity,
        topic: r.topic,
        excerpt: r.chunk_text,
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
 * Get track lap times for a car (citeable).
 * @param {Object} params
 * @returns {Object}
 */
export async function getTrackLapTimes({ car_slug, limit = 6 }) {
  const client = getDbClient({ requireServiceRole: true });
  if (!isSupabaseConfigured || !client) return { error: 'Supabase not configured' };
  if (!car_slug) return { error: 'car_slug is required' };

  try {
    const safeLimit = Math.max(1, Math.min(Number(limit) || 6, 15));
    const { data, error } = await client.rpc('get_car_track_lap_times', {
      p_car_slug: car_slug,
      p_limit: safeLimit,
    });
    if (error) throw error;

    const rows = Array.isArray(data) ? data : [];
    return {
      car_slug,
      count: rows.length,
      laps: rows.map(r => ({
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
      instruction: 'When citing a lap time, include the source_url and mention conditions/tires when provided.',
    };
  } catch (err) {
    console.error('[AL Tools] get_track_lap_times failed:', err);
    return { error: err.message || 'get_track_lap_times failed', car_slug };
  }
}

/**
 * Get dyno runs for a car (citeable).
 * @param {Object} params
 * @returns {Object}
 */
export async function getDynoRuns({ car_slug, limit = 6, include_curve = false }) {
  const client = getDbClient({ requireServiceRole: true });
  if (!isSupabaseConfigured || !client) return { error: 'Supabase not configured' };
  if (!car_slug) return { error: 'car_slug is required' };

  try {
    const safeLimit = Math.max(1, Math.min(Number(limit) || 6, 15));
    const { data, error } = await client.rpc('get_car_dyno_runs', {
      p_car_slug: car_slug,
      p_limit: safeLimit,
      p_include_curve: Boolean(include_curve),
    });
    if (error) throw error;

    const rows = Array.isArray(data) ? data : [];
    return {
      car_slug,
      count: rows.length,
      runs: rows.map(r => ({
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
      instruction: 'When citing dyno numbers, include the source_url and mention dyno type/correction/fuel if provided. Avoid claiming universal gains; call out variability.',
    };
  } catch (err) {
    console.error('[AL Tools] get_dyno_runs failed:', err);
    return { error: err.message || 'get_dyno_runs failed', car_slug };
  }
}

/**
 * Get comprehensive details about a specific car
 * @param {Object} params - Parameters including car_slug and what to include
 * @returns {Object} Detailed car information
 */
export async function getCarDetails({ car_slug, include = ['specs', 'scores'] }) {
  // Find car in database via carsClient
  const car = await fetchCarBySlug(car_slug);
  if (!car) {
    return { error: `Car not found: ${car_slug}` };
  }
  
  const result = {
    name: car.name,
    slug: car.slug,
    years: car.years,
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
      aiCtx = await getCarAIContext({ car_slug, include: includeSections });

      if (aiCtx?.car?.name) {
        result.name = aiCtx.car.name;
        result.years = aiCtx.car.years || result.years;
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
      engine: aiCtx?.car?.engine ?? car.engine,
      hp: aiCtx?.car?.hp ?? car.hp,
      torque: aiCtx?.car?.torque ?? car.torque,
      trans: aiCtx?.car?.trans ?? car.trans,
      drivetrain: aiCtx?.car?.drivetrain ?? car.drivetrain,
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
      priceRange: aiCtx?.car?.price_range ?? car.priceRange,
      priceAvg: aiCtx?.car?.price_avg ?? car.priceAvg,
      msrpNew: car.msrpNewLow && car.msrpNewHigh ? `$${car.msrpNewLow.toLocaleString()} - $${car.msrpNewHigh.toLocaleString()}` : null,
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
              .select('title, kind, severity, affected_years_text, description, symptoms, prevention, fix_description, estimated_cost_text, estimated_cost_low, estimated_cost_high, source_url');
            
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
              result.knownIssues = canonicalIssues.map(issue => ({
                name: issue.title,
                kind: issue.kind,
                severity: issue.severity,
                affectedYears: issue.affected_years_text,
                description: issue.description,
                symptoms: issue.symptoms,
                prevention: issue.prevention,
                fix: issue.fix_description,
                estimatedCost: issue.estimated_cost_text || (
                  issue.estimated_cost_low || issue.estimated_cost_high
                    ? `$${issue.estimated_cost_low || ''}-${issue.estimated_cost_high || ''}`
                    : null
                ),
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

            const { data, error } = await client.rpc('get_car_maintenance_summary', { p_car_slug: car_slug });
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
 * @param {Object} params - Parameters including car_slug
 * @returns {Object} Expert reviews and consensus
 */
export async function getExpertReviews({ car_slug, limit = 3, include_quotes = true }) {
  // Try to get from database
  if (isSupabaseConfigured) {
    try {
      const videos = await fetchVideosForCar(car_slug, { limit });
      
      if (videos && videos.length > 0) {
        const consensus = await calculateCarConsensus(car_slug);
        
        return {
          reviewCount: videos.length,
          reviews: videos.map(v => ({
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
          consensus: consensus ? {
            overallStrengths: consensus.strengths?.map(s => s.tag).slice(0, 3),
            overallWeaknesses: consensus.weaknesses?.map(w => w.tag).slice(0, 3),
            frequentlyComparedTo: consensus.comparisons?.map(c => c.slug).slice(0, 3),
          } : null,
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
 * @param {Object} params - Parameters including car_slug
 * @returns {Object} Known issues
 */
export async function getKnownIssues({ car_slug, severity_filter = 'All' }) {
  // First check car data from database for common issues
  const car = await fetchCarBySlug(car_slug);
  let localIssues = [];
  
  if (car?.commonIssuesDetailed) {
    localIssues = car.commonIssuesDetailed;
  } else if (car?.commonIssues) {
    localIssues = car.commonIssues.map(issue => ({ issue, severity: 'Unknown' }));
  }
  
  // Resolve car_id for efficient queries
  const carId = car?.id || await resolveCarId(car_slug);
  
  // Try database
  if (isSupabaseConfigured && supabase) {
    try {
      // Prefer canonical issues table with car_id for efficient index usage
      let canonicalQuery = supabase
        .from('car_issues')
        .select('title, kind, severity, affected_years_text, description, symptoms, prevention, fix_description, estimated_cost_text, estimated_cost_low, estimated_cost_high, source_url');
      
      // car_id is required - car_slug column no longer exists on car_issues
      if (!carId) {
        console.warn('[AL Tools] Cannot fetch issues: car_id not resolved for slug:', car_slug);
        return { carName: car?.name || car_slug, issueCount: 0, message: 'Could not resolve car for issues lookup.' };
      }
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
          carName: car?.name || car_slug,
          issueCount: canonicalIssues.length,
          issues: canonicalIssues.map(issue => ({
            name: issue.title,
            kind: issue.kind,
            severity: issue.severity,
            affectedYears: issue.affected_years_text,
            description: issue.description,
            symptoms: issue.symptoms,
            prevention: issue.prevention,
            fix: issue.fix_description,
            estimatedCost: issue.estimated_cost_text || (
              issue.estimated_cost_low || issue.estimated_cost_high
                ? `$${issue.estimated_cost_low || ''}-${issue.estimated_cost_high || ''}`
                : null
            ),
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
      carName: car?.name || car_slug,
      issueCount: localIssues.length,
      issues: localIssues,
      source: 'local_data',
    };
  }
  
  return {
    carName: car?.name || car_slug,
    issueCount: 0,
    message: 'No known issues documented for this car in our database.',
  };
}

/**
 * Compare multiple cars
 * @param {Object} params - Parameters including car_slugs array
 * @returns {Object} Comparison data
 */
export async function compareCars({ car_slugs, focus_areas = [] }) {
  // Fetch all cars from database and filter by slugs
  const allCars = await fetchCars();
  const cars = car_slugs
    .map(slug => allCars.find(c => c.slug === slug))
    .filter(Boolean);
  
  if (cars.length < 2) {
    return { error: 'At least 2 valid cars required for comparison' };
  }
  
  const comparison = {
    cars: cars.map(car => ({
      name: car.name,
      slug: car.slug,
      years: car.years,
      hp: car.hp,
      torque: car.torque,
      engine: car.engine,
      curbWeight: car.curbWeight,
      zeroToSixty: car.zeroToSixty,
      priceRange: car.priceRange,
      priceAvg: car.priceAvg,
      category: car.category,
      drivetrain: car.drivetrain,
      trans: car.trans,
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
    comparison.scores[field.key] = cars.map(car => ({
      name: car.name,
      score: car[field.key] || car[`score_${field.key}`] || null,
    }));
  }
  
  // Focus area analysis
  if (focus_areas.includes('performance') || focus_areas.length === 0) {
    const powerWinner = cars.reduce((a, b) => (a.hp || 0) > (b.hp || 0) ? a : b);
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
      const aValue = (a.value || a.score_value || 5);
      const bValue = (b.value || b.score_value || 5);
      return aValue > bValue ? a : b;
    });
    const lowestPrice = cars.reduce((a, b) => 
      (a.priceAvg || 999999) < (b.priceAvg || 999999) ? a : b
    );
    
    comparison.analysis.value = {
      bestValue: { name: bestValue.name, score: bestValue.value || bestValue.score_value },
      lowestPrice: { name: lowestPrice.name, priceRange: lowestPrice.priceRange },
    };
  }
  
  if (focus_areas.includes('reliability') || focus_areas.length === 0) {
    const mostReliable = cars.reduce((a, b) => {
      const aRel = (a.reliability || a.score_reliability || 5);
      const bRel = (b.reliability || b.score_reliability || 5);
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
    const encyclopediaMatches = (matches || []).filter(r => 
      r.topic?.startsWith('encyclopedia:') || 
      r.metadata?.source_type === 'encyclopedia'
    );

    if (encyclopediaMatches.length === 0) {
      return { vectorSearch: true, found: false, results: [] };
    }

    return {
      vectorSearch: true,
      found: true,
      embeddingModel: model,
      count: encyclopediaMatches.length,
      results: encyclopediaMatches.map(r => {
        // Extract topic slug from topic field (e.g., "encyclopedia:turbo-fundamentals")
        const topicSlug = r.topic?.replace('encyclopedia:', '') || 
          r.metadata?.topic_slug || 
          null;
        
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
        results: vectorResults.results.map(r => ({
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
        instruction: 'Results found via semantic search. Use the topic URLs to cite sources. Related topics and upgrades can provide deeper context.',
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
      'engine', 'drivetrain', 'fuel_system', 'engine_management',
      'intake_forced_induction', 'exhaust', 'suspension_steering',
      'aerodynamics', 'brakes'
    ];
    
    // Map category param to system slug (handle underscores vs hyphens)
    const categoryToSystemSlug = {
      'fuel_system': 'fuel-system',
      'engine_management': 'engine-management',
      'intake_forced_induction': 'air-intake',
      'suspension_steering': 'suspension',
    };
    
    if (systemCategories.includes(category)) {
      // Filter by specific system
      const systemSlug = categoryToSystemSlug[category] || category;
      filtered = results.filter(r => 
        r.type === 'topic' && r.id?.startsWith(`topic.`) && 
        // Check if result's section matches system name
        r.section?.toLowerCase().includes(systemSlug.replace('-', ' ').split(' ')[0])
      );
    } else {
      const types = categoryMap[category] || [];
      filtered = results.filter(r => types.includes(r.type));
    }
  }
  
  return {
    query,
    category,
    searchMethod: 'keyword',
    resultCount: filtered.length,
    results: filtered.slice(0, 10).map(r => ({
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
 * @param {Object} params - Parameters including upgrade_key
 * @returns {Object} Detailed upgrade information
 */
export async function getUpgradeInfo({ upgrade_key, car_slug = null }) {
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
    relatedTopics: relatedTopics.length > 0 ? relatedTopics.map(t => ({
      slug: t.slug,
      name: t.name,
      system: t.system,
      definition: t.definition,
    })) : null,
  };
  
  // Add car-specific info if requested
  if (car_slug) {
    const car = await fetchCarBySlug(car_slug);
    if (car) {
      result.carContext = {
        carName: car.name,
        engineType: car.engine?.includes('Turbo') ? 'turbo' : 'naturally_aspirated',
        aftermarketScore: car.aftermarket || car.score_aftermarket,
        note: car.aftermarket >= 8 
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
 * Get build recommendations for a goal
 * Uses get_car_tuning_context RPC for optimized parts and tuning data access
 * @param {Object} params - Parameters including car_slug, goal, budget
 * @returns {Object} Build recommendations
 */
export async function recommendBuild({ car_slug, goal, budget = null, maintain_warranty = false }) {
  const car = await fetchCarBySlug(car_slug);
  if (!car) {
    return { error: `Car not found: ${car_slug}` };
  }
  const client = getDbClient({ requireServiceRole: true });

  // Try to get optimized tuning context from new RPC
  let tuningContext = null;
  if (isSupabaseConfigured && client) {
    try {
      const { data, error } = await client.rpc('get_car_tuning_context', { p_car_slug: car_slug });
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
          .select('part_id,fitment_notes,requires_tune,install_difficulty,estimated_labor_hours,verified,confidence,source_url, parts(id,name,brand_name,part_number,category,description,quality_tier,street_legal,source_urls)')
          .eq('car_id', carId)
          .limit(250);
        if (!fErr && fitments?.length) {
          // Attach latest pricing for all candidate parts (single query)
          const partIds = [...new Set(fitments.map(r => r.part_id).filter(Boolean))];
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
                source_url: row.source_url || (Array.isArray(row.parts?.source_urls) ? row.parts.source_urls[0] : null),
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
    if (m.includes('exhaust') || m.includes('cat-back') || m.includes('catback') || m.includes('downpipe') || m.includes('header')) return 'exhaust';
    if (m.includes('tune') || m.includes('ecu') || m.includes('engine-tune') || m.includes('software')) return 'tune';
    if (m.includes('coilover') || m.includes('suspension') || m.includes('sway') || m.includes('alignment') || m.includes('subframe')) return 'suspension';
    if (m.includes('brake')) return 'brakes';
    if (m.includes('cooling') || m.includes('intercooler') || m.includes('heat exchanger') || m.includes('radiator') || m.includes('oil cooler')) return 'cooling';
    if (m.includes('forced') || m.includes('turbo') || m.includes('supercharger')) return 'forced_induction';
    if (m.includes('fuel') || m.includes('ethanol') || m.includes('hpfp') || m.includes('injector')) return 'fuel_system';
    if (m.includes('wheel') || m.includes('tire')) return 'wheels_tires';
    return null;
  };

  for (const [stage, mods] of Object.entries(upgrades)) {
    const stageMods = mods
      .filter(mod => !maintain_warranty || warrantySafe.some(safe => mod.includes(safe)))
      .map(mod => {
        const modInfo = upgradeDetails[mod];
        const partsCategory = modToPartsCategory(mod);
        const partOptions = partsCategory ? (partsByCategory.get(partsCategory) || []) : [];
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
    recommendation: car.aftermarket >= 8 
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
 * @param {Object} params - Parameters including car_slug and optional mileage
 * @returns {Object} Maintenance information
 */
export async function getMaintenanceSchedule({ car_slug, car_variant_key = null, mileage = null }) {
  const car = await fetchCarBySlug(car_slug);
  if (!car) {
    return { error: `Car not found: ${car_slug}` };
  }
  
  const result = {
    carName: car.name,
    mileage,
    car_slug,
    car_variant_key: car_variant_key || null,
  };
  
  // Try database for detailed specs (prefer summary RPC)
  /** @type {any} */
  let maintenanceSummary = null;
  if (isSupabaseConfigured && supabase) {
    try {
      if (car_variant_key) {
        const { data, error } = await supabase.rpc('get_car_maintenance_summary_variant', { p_variant_key: car_variant_key });
        if (!error && data) maintenanceSummary = data;
      }

      if (!maintenanceSummary) {
        const { data, error } = await supabase.rpc('get_car_maintenance_summary', { p_car_slug: car_slug });
        if (!error && data) maintenanceSummary = data;
      }
    } catch (err) {
      console.warn('[AL Tools] Error fetching maintenance summary:', err);
    }

    // Fallback: raw row (older environments)
    // Uses car.id since car_slug column no longer exists on vehicle_maintenance_specs
    if (!maintenanceSummary && car?.id) {
      try {
        const { data: specs } = await supabase
          .from('vehicle_maintenance_specs')
          .select('*')
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
      oil: oil ? {
        type: oil.type || null,
        viscosity: oil.viscosity || null,
        spec: oil.spec || null,
        capacity_liters: oil.capacity_liters ?? null,
        capacity_quarts: oil.capacity_quarts ?? null,
        interval_miles: oil.interval_miles ?? null,
        interval_months: oil.interval_months ?? null,
        filter_oem_part: oil.filter_oem_part || null,
      } : null,
      coolant: coolant ? {
        type: coolant.type || null,
        spec: coolant.spec || null,
        capacity_liters: coolant.capacity_liters ?? null,
        interval_miles: coolant.interval_miles ?? null,
        interval_years: coolant.interval_years ?? null,
      } : null,
      brake_fluid: brakeFluid ? {
        type: brakeFluid.type || null,
        spec: brakeFluid.spec || null,
        interval_years: brakeFluid.interval_years ?? null,
      } : null,
    };

    result.fuel = fuel ? {
      type: fuel.type || null,
      octane_minimum: fuel.octane_minimum ?? null,
      octane_recommended: fuel.octane_recommended ?? null,
      tank_capacity_gallons: fuel.tank_capacity_gallons ?? null,
    } : null;

    result.tires = tires ? {
      size_front: tires.size_front || null,
      size_rear: tires.size_rear || null,
      pressure_front_psi: tires.pressure_front_psi ?? null,
      pressure_rear_psi: tires.pressure_rear_psi ?? null,
    } : null;
  }
  
  // Add general schedule based on mileage
  if (mileage) {
    result.upcomingService = [];
    
    const intervals = [
      { interval: 7500, service: 'Oil Change', priority: 'high' },
      { interval: 15000, service: 'Brake Inspection', priority: 'medium' },
      { interval: 30000, service: 'Major Service (spark plugs, filters, fluids)', priority: 'high' },
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
export async function searchCommunityInsights({ query, car_slug = null, insight_types = null, limit = 5 }) {
  const client = getDbClient({ requireServiceRole: true });
  if (!isSupabaseConfigured || !client) {
    return { error: 'Supabase not configured' };
  }
  if (!query) return { error: 'query is required' };

  const safeLimit = Math.max(1, Math.min(Number(limit) || 5, 10));

  try {
    // Generate embedding for semantic search
    const { embedding, error: embedErr, model } = await generateQueryEmbedding(query);
    if (embedErr) {
      return {
        error: embedErr,
        message: 'Embeddings not available for community insights search.',
        query,
        car_slug,
      };
    }

    const pgVec = vectorToPgVectorLiteral(embedding);
    if (!pgVec) return { error: 'Failed to format embedding vector' };

    // Call the semantic search RPC
    const { data: matches, error: searchErr } = await client.rpc('search_community_insights', {
      p_query_embedding: pgVec,
      p_car_slug: car_slug,
      p_insight_types: insight_types,
      p_limit: safeLimit,
      p_min_confidence: 0.5
    });

    if (searchErr) throw searchErr;

    const results = Array.isArray(matches) ? matches : [];

    // Build fallback forum suggestions based on car context
    const forumsByBrand = {
      porsche: [
        { name: 'Rennlist', url: 'https://rennlist.com', description: 'Premier Porsche enthusiast community' },
        { name: 'Planet-9', url: 'https://planet-9.com', description: 'Cayman & Boxster focused' },
      ],
      bmw: [
        { name: 'Bimmerpost', url: 'https://bimmerpost.com', description: 'BMW M and enthusiast models' },
        { name: 'E46Fanatics', url: 'https://e46fanatics.com', description: 'E46 3-series specialists' },
      ],
      mazda: [
        { name: 'Miata.net', url: 'https://forum.miata.net', description: 'MX-5 Miata community' },
      ],
      toyota: [
        { name: 'FT86Club', url: 'https://ft86club.com', description: 'GR86/BRZ community' },
        { name: 'SupraMKV', url: 'https://supramkv.com', description: 'A90/A91 Supra focused' },
      ],
      chevrolet: [
        { name: 'Corvette Forum', url: 'https://corvetteforum.com', description: 'All generations of Corvette' },
      ],
      nissan: [
        { name: '370Z Forum', url: 'https://the370z.com', description: 'Z-car enthusiasts' },
        { name: 'GT-R Life', url: 'https://gtrlife.com', description: 'R35 GT-R community' },
      ],
    };

    // Detect brand from car_slug for forum suggestions
    let suggestedForums = [];
    if (car_slug) {
      const slugLower = car_slug.toLowerCase();
      for (const [brand, forums] of Object.entries(forumsByBrand)) {
        if (slugLower.includes(brand) || 
            (brand === 'porsche' && (slugLower.includes('911') || slugLower.includes('cayman') || slugLower.includes('boxster') || slugLower.includes('gt4') || slugLower.includes('gt3'))) ||
            (brand === 'bmw' && (slugLower.includes('m3') || slugLower.includes('m4') || slugLower.includes('m2'))) ||
            (brand === 'mazda' && slugLower.includes('miata')) ||
            (brand === 'toyota' && (slugLower.includes('supra') || slugLower.includes('gr86'))) ||
            (brand === 'chevrolet' && slugLower.includes('corvette'))) {
          suggestedForums = forums;
          break;
        }
      }
    }
    
    // Add general forums as fallback
    const generalForums = [
      { name: 'Reddit r/cars', url: 'https://reddit.com/r/cars', description: 'General automotive discussion' },
      { name: '6SpeedOnline', url: 'https://6speedonline.com', description: 'Sports car enthusiasts' },
    ];

    // Include fallback guidance when results are sparse
    const hasNoResults = results.length === 0;
    const fallbackGuidance = hasNoResults ? {
      noResultsReason: 'Our community insights database may not have indexed discussions on this specific topic yet.',
      suggestedForums: suggestedForums.length > 0 ? [...suggestedForums, ...generalForums.slice(0, 1)] : generalForums,
      searchTip: `Try searching "${query}${car_slug ? ' ' + car_slug : ''}" on the suggested forums for real owner experiences.`,
    } : null;

    return {
      query,
      car_slug,
      embeddingModel: model,
      count: results.length,
      results: results.map(r => ({
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
        'known_issue',        // Common problems, failure patterns
        'maintenance_tip',    // Service intervals, DIY procedures
        'modification_guide', // How-to guides for mods
        'troubleshooting',    // Diagnostic steps, solutions
        'buying_guide',       // PPI checklists, what to look for
        'performance_data',   // Dyno numbers, lap times
        'reliability_report', // Long-term ownership experiences
        'cost_insight',       // Real maintenance/repair costs
        'comparison'          // Owner comparisons between models
      ],
    };
  } catch (err) {
    console.error('[AL Tools] search_community_insights failed:', err);
    return { error: err.message || 'Community insights search failed' };
  }
}

// =============================================================================
// FORUM/WEB SEARCH
// =============================================================================

/**
 * Search forums and web for real-world owner experiences.
 * 
 * STATUS: STUB - Returns helpful guidance instead of live search results.
 * 
 * NOTE: For actual owner experiences, use `search_community_insights` which
 * searches our database of 1,200+ forum-extracted insights from Rennlist,
 * Bimmerpost, Miata.net, and other enthusiast forums.
 * 
 * This tool is retained for future real-time web/forum search integration
 * (e.g., via Exa API or Google Custom Search).
 * 
 * @param {Object} params - Search parameters
 * @param {string} params.query - Search query (required)
 * @param {string} [params.car_context] - Car name for context
 * @param {string[]} [params.sources] - Forum sources to search
 * @returns {Object} Search guidance and forum suggestions
 */
export async function searchForums({ query, car_context = null, sources = ['all'] }) {
  if (!query) {
    return { error: 'query is required' };
  }

  const searchQuery = car_context ? `${query} ${car_context}` : query;
  
  // Map car context to relevant forums
  const forumsByBrand = {
    porsche: [
      { name: 'Rennlist', url: 'https://rennlist.com', description: 'Premier Porsche enthusiast community' },
      { name: 'Planet-9', url: 'https://planet-9.com', description: 'Cayman & Boxster focused' },
    ],
    bmw: [
      { name: 'Bimmerpost', url: 'https://bimmerpost.com', description: 'BMW M and enthusiast models' },
      { name: 'E46Fanatics', url: 'https://e46fanatics.com', description: 'E46 3-series specialists' },
    ],
    mazda: [
      { name: 'Miata.net', url: 'https://miata.net', description: 'MX-5 Miata community' },
    ],
    toyota: [
      { name: 'FT86Club', url: 'https://ft86club.com', description: 'GR86/BRZ community' },
      { name: 'SupraMKV', url: 'https://supramkv.com', description: 'A90/A91 Supra focused' },
    ],
    chevrolet: [
      { name: 'Corvette Forum', url: 'https://corvetteforum.com', description: 'All generations of Corvette' },
    ],
    nissan: [
      { name: '370Z Forum', url: 'https://the370z.com', description: 'Z-car enthusiasts' },
      { name: 'GT-R Life', url: 'https://gtrlife.com', description: 'R35 GT-R community' },
    ],
  };

  // Detect brand from car_context
  let relevantForums = [];
  if (car_context) {
    const contextLower = car_context.toLowerCase();
    for (const [brand, forums] of Object.entries(forumsByBrand)) {
      if (contextLower.includes(brand) || 
          (brand === 'porsche' && (contextLower.includes('911') || contextLower.includes('cayman') || contextLower.includes('boxster') || contextLower.includes('gt4') || contextLower.includes('gt3'))) ||
          (brand === 'bmw' && (contextLower.includes('m3') || contextLower.includes('m4') || contextLower.includes('m2'))) ||
          (brand === 'mazda' && contextLower.includes('miata')) ||
          (brand === 'toyota' && (contextLower.includes('supra') || contextLower.includes('gr86'))) ||
          (brand === 'chevrolet' && contextLower.includes('corvette'))) {
        relevantForums = forums;
        break;
      }
    }
  }

  // Default general forums
  const generalForums = [
    { name: 'Reddit r/cars', url: 'https://reddit.com/r/cars', description: 'General automotive discussion' },
    { name: 'Reddit r/whatcarshouldIbuy', url: 'https://reddit.com/r/whatcarshouldIbuy', description: 'Buying advice' },
    { name: '6SpeedOnline', url: 'https://6speedonline.com', description: 'Sports car enthusiasts' },
  ];

  const suggestedForums = relevantForums.length > 0 
    ? [...relevantForums, ...generalForums.slice(0, 1)]
    : generalForums;

  return {
    isStub: true,
    query: searchQuery,
    sources,
    status: 'stub',
    message: 'Live forum search is not yet implemented. However, you can use `search_community_insights` to access our database of 1,200+ insights extracted from enthusiast forums.',
    alternativeTool: {
      name: 'search_community_insights',
      description: 'Search our database of forum-extracted insights for real owner experiences, known issues, maintenance tips, and more.',
    },
    suggestedForums,
    searchTip: `Try searching: "${searchQuery}" on the suggested forums, or use search_community_insights for curated forum insights.`,
    instruction: 'Consider using search_community_insights first for structured forum data. Direct forum links are provided for manual research.',
  };
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
        message: 'No results found. Try rephrasing your query or use search_community_insights for forum-sourced data.',
      };
    }

    return {
      query: searchQuery,
      count: results.length,
      results: results.map(r => ({
        title: r.title,
        url: r.url,
        excerpt: r.text?.slice(0, 500) || r.snippet,
        publishedDate: r.published_date,
        score: r.score,
      })),
      instruction: 'These are live web results. Always cite the source URL when using this information. Verify critical claims against our database.',
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
 * Search parts catalog; optionally filter by fitment to a car.
 * @param {Object} params
 * @returns {Object}
 */
export async function searchParts({ query, car_slug = null, category = null, limit = 8 }) {
  const client = getDbClient({ requireServiceRole: true });
  if (!isSupabaseConfigured || !client) return { error: 'Supabase not configured' };
  if (!query) return { error: 'query is required' };

  const safeLimit = Math.max(1, Math.min(Number(limit) || 8, 20));

  try {
    // Use carResolver for consistent car_id resolution (cached, indexed)
    const carId = car_slug ? await resolveCarId(car_slug) : null;

    const q = String(query).trim();

    const attachLatestPricing = async (rows) => {
      const partIds = [...new Set(rows.map(r => r?.parts?.id || r?.id).filter(Boolean))];
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
        .select('fitment_notes,requires_tune,install_difficulty,estimated_labor_hours,verified,confidence,source_url, parts(id,name,brand_name,part_number,category,description,quality_tier,street_legal,source_urls)')
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
        car_slug,
        count: rows.length,
        results: rows.map(r => ({
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
            source_url: r.source_url || (Array.isArray(r.parts?.source_urls) ? r.parts.source_urls[0] : null),
          },
        })),
      };
    }

    let partsQuery = client
      .from('parts')
      .select('id,name,brand_name,part_number,category,description,quality_tier,street_legal,source_urls,confidence')
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
      car_slug: null,
      count: rows.length,
      results: rows.map(p => ({
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

// =============================================================================
// EVENTS SEARCH
// =============================================================================

/**
 * Search for car events (track days, Cars & Coffee, car shows, etc.)
 * 
 * @param {Object} params - Search parameters
 * @param {string} params.location - Location to search near (ZIP, city, or state)
 * @param {number} [params.radius] - Search radius in miles (for ZIP searches)
 * @param {string} [params.event_type] - Filter by event type slug
 * @param {boolean} [params.is_track_event] - Only return track events
 * @param {string} [params.brand] - Filter by car brand affinity
 * @param {string} [params.car_slug] - Filter by specific car affinity
 * @param {string} [params.start_after] - Only events after this date (ISO format)
 * @param {number} [params.limit] - Max results (default 5, max 20)
 * @returns {Object} Search results with events
 */
export async function searchEvents({ 
  location, 
  radius = 50, 
  event_type, 
  is_track_event, 
  brand, 
  car_slug, 
  start_after,
  limit = 5 
}) {
  if (!location) {
    return { error: 'location is required' };
  }
  
  const safeLimit = Math.max(1, Math.min(Number(limit) || 5, 20));
  const safeRadius = Math.max(10, Math.min(Number(radius) || 50, 500));
  
  try {
    // Parse location to determine type
    const trimmedLocation = location.trim();
    const isZip = /^\d{5}$/.test(trimmedLocation);
    
    // Build query parameters
    const params = new URLSearchParams();
    
    if (isZip) {
      params.set('zip', trimmedLocation);
      params.set('radius', safeRadius.toString());
    } else if (trimmedLocation.includes(',')) {
      // City, State format
      const parts = trimmedLocation.split(',').map(p => p.trim());
      if (parts[0]) params.set('city', parts[0]);
      if (parts[1]) params.set('state', parts[1]);
    } else if (trimmedLocation.length === 2) {
      // State code
      params.set('state', trimmedLocation.toUpperCase());
    } else {
      // Could be city or state name - try as city first
      params.set('city', trimmedLocation);
    }
    
    if (event_type) params.set('type', event_type);
    if (is_track_event) params.set('is_track_event', 'true');
    if (brand) params.set('brand', brand);
    if (car_slug) params.set('car_slug', car_slug);
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
    const formattedEvents = (data.events || []).map(event => {
      const eventDate = new Date(event.start_date + 'T00:00:00');
      const formattedDate = eventDate.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
      
      const result = {
        name: event.name,
        type: event.event_type?.name || 'Event',
        type_slug: event.event_type?.slug || 'other',
        date: formattedDate,
        location: `${event.city}${event.state ? `, ${event.state}` : ''}`,
        cost: event.is_free ? 'Free' : (event.cost_text || 'See event page'),
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
        result.car_affinities = event.car_affinities.map(a => 
          a.car_name || a.brand
        ).filter(Boolean);
      }
      
      return result;
    });
    
    // Build search summary
    let searchSummary = `Found ${formattedEvents.length} event${formattedEvents.length !== 1 ? 's' : ''}`;
    
    if (event_type) {
      const typeName = event_type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      searchSummary += ` (${typeName})`;
    } else if (is_track_event) {
      searchSummary += ' (track events)';
    }
    
    if (isZip && data.searchCenter) {
      searchSummary += ` within ${safeRadius} miles of ${trimmedLocation}`;
    } else if (trimmedLocation) {
      searchSummary += ` near ${trimmedLocation}`;
    }
    
    if (brand) {
      searchSummary += ` for ${brand}`;
    }
    
    return {
      events: formattedEvents,
      total: data.total || formattedEvents.length,
      search_summary: searchSummary,
      search_params: {
        location: trimmedLocation,
        radius: isZip ? safeRadius : null,
        event_type,
        brand,
        car_slug,
      },
      instruction: formattedEvents.length > 0 
        ? 'Present events in a scannable format. Highlight the date, name, location, and cost. Include AutoRev links for users to learn more or save events.'
        : 'No events found. Suggest broadening the search radius, trying a different location, or checking back later as new events are added regularly.',
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
export async function analyzeVehicleHealth({ vehicle_id = null, include_costs = false, user_id = null }) {
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
    const lastOilDate = vehicle.last_oil_change_date;
    const nextOilMileage = vehicle.next_oil_due_mileage || (lastOilMileage ? lastOilMileage + oilInterval : oilInterval);

    if (currentMileage > 0 || lastOilMileage) {
      const { overdueBy, priority } = calculateOverdue(nextOilMileage, null, currentMileage, now);
      
      // Check if due soon (within 10%)
      let finalPriority = priority;
      if (priority === 'UPCOMING' && isWithinThreshold(nextOilMileage, currentMileage)) {
        finalPriority = 'DUE_SOON';
      }

      // Only add if relevant
      if (overdueBy || finalPriority !== 'UPCOMING' || (nextOilMileage - currentMileage) <= 3000) {
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
          const interval = serviceIntervals.find(s => s.service_name?.toLowerCase().includes('oil'));
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
        title: vehicle.battery_status === 'dead' ? 'Battery Dead - Replace' : 'Battery Weak - Test/Replace',
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
    const brakeServiceLog = serviceLogs.find(s => 
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
        description: 'Connect battery tender or disconnect battery to prevent drain. Check every 2-4 weeks if no tender.',
      });
      
      // Fuel stabilizer
      storageAlerts.push({
        category: 'fuel',
        title: 'Fuel Stabilizer',
        description: 'Add fuel stabilizer and fill tank to prevent condensation and fuel degradation.',
      });
      
      // Tire flat spots
      storageAlerts.push({
        category: 'tires',
        title: 'Tire Flat Spots',
        description: 'Consider tire cradles or over-inflate tires slightly. Move vehicle periodically or put on jack stands.',
      });
      
      // Start reminder
      if (vehicle.last_started_at) {
        const lastStarted = new Date(vehicle.last_started_at);
        const daysSinceStart = Math.floor((now - lastStarted) / (1000 * 60 * 60 * 24));
        if (daysSinceStart > 14) {
          storageAlerts.push({
            category: 'engine',
            title: `Not Started in ${daysSinceStart} Days`,
            description: 'Consider starting and running to operating temperature every 2-3 weeks to circulate fluids.',
          });
        }
      }
    }

    // =========================================================================
    // MODEL-SPECIFIC ISSUES TO WATCH
    // =========================================================================
    for (const issue of knownIssues) {
      // Check if issue is relevant to current mileage
      const isRelevantMileage = !issue.mileage_range_low || !issue.mileage_range_high ||
        (currentMileage >= issue.mileage_range_low * 0.8 && currentMileage <= issue.mileage_range_high * 1.2);
      
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
          estimated_cost: issue.estimated_cost_low && issue.estimated_cost_high 
            ? { low: issue.estimated_cost_low, high: issue.estimated_cost_high }
            : null,
          source_url: issue.source_url,
          mileage_range: issue.mileage_range_low && issue.mileage_range_high
            ? `${issue.mileage_range_low.toLocaleString()} - ${issue.mileage_range_high.toLocaleString()} miles`
            : null,
        });
      }
    }

    // Sort model issues by severity
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    modelIssuesToWatch.sort((a, b) => 
      (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4)
    );

    // =========================================================================
    // CALCULATE HEALTH SCORE
    // =========================================================================
    let healthScore = 100;
    
    // Deduct for urgent items
    const urgentCount = recommendations.filter(r => r.priority === 'URGENT').length;
    healthScore -= urgentCount * 15;
    
    // Deduct for due soon items
    const dueSoonCount = recommendations.filter(r => r.priority === 'DUE_SOON').length;
    healthScore -= dueSoonCount * 5;
    
    // Deduct for critical model issues
    const criticalIssues = modelIssuesToWatch.filter(i => i.severity === 'critical').length;
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
    recommendations.sort((a, b) => 
      (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4)
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
        engine: car.engine,
        hp: car.hp,
        reliability_score: car.score_reliability,
      };
    }

    // Add storage alerts if in storage mode
    if (isInStorage && storageAlerts.length > 0) {
      response.storage_alerts = storageAlerts;
    }

    // Add instruction for AL
    response.instruction = 'Present the health score prominently. Group recommendations by priority (URGENT first). For storage mode vehicles, highlight storage alerts. Mention specific model issues to watch if any are critical or high severity.';

    return response;
  } catch (err) {
    console.error('[AL Tools] analyze_vehicle_health failed:', err);
    return { error: err.message || 'analyze_vehicle_health failed' };
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
export async function executeToolCall(toolName, toolInput) {
  const tools = {
    search_cars: searchCars,
    get_car_details: getCarDetails,
    get_car_ai_context: getCarAIContext,
    get_expert_reviews: getExpertReviews,
    get_known_issues: getKnownIssues,
    compare_cars: compareCars,
    search_encyclopedia: searchEncyclopediaContent,
    get_upgrade_info: getUpgradeInfo,
    // search_forums removed - was a stub. Use search_community_insights instead.
    search_web: searchWeb,
    search_parts: searchParts,
    get_maintenance_schedule: getMaintenanceSchedule,
    recommend_build: recommendBuild,
    search_knowledge: searchKnowledge,
    get_track_lap_times: getTrackLapTimes,
    get_dyno_runs: getDynoRuns,
    search_community_insights: searchCommunityInsights,
    search_events: searchEvents,
    analyze_vehicle_health: analyzeVehicleHealth,
  };
  
  const tool = tools[toolName];
  if (!tool) {
    return { error: `Unknown tool: ${toolName}` };
  }
  
  try {
    // Best-effort caching for expensive tools (kept tight to avoid stale facts).
    // Extended caching to more tools for faster AL responses (2026-01-11)
    const cacheable = new Set([
      'get_car_ai_context',      // Core car data - changes rarely
      'search_knowledge',        // Vector search - content stable
      'get_track_lap_times',     // Track data - semi-static
      'get_dyno_runs',           // Dyno data - semi-static
      'search_community_insights', // Forum insights - stable
      'search_encyclopedia',     // Encyclopedia content - static
      'search_events',           // Events - moderate change rate
      'search_parts',            // Parts catalog - stable
      'get_maintenance_schedule', // Maintenance specs - static
      'get_expert_reviews',      // YouTube reviews - stable
      'get_known_issues',        // Known issues - static
    ]);
    const ttlByToolMs = {
      get_car_ai_context: 2 * 60 * 1000,      // 2 min - core data
      search_knowledge: 5 * 60 * 1000,        // 5 min - vector search
      get_track_lap_times: 10 * 60 * 1000,    // 10 min - rarely changes
      get_dyno_runs: 10 * 60 * 1000,          // 10 min - rarely changes
      search_community_insights: 5 * 60 * 1000, // 5 min - forum data
      search_encyclopedia: 5 * 60 * 1000,     // 5 min - static content
      search_events: 3 * 60 * 1000,           // 3 min - events can change
      search_parts: 5 * 60 * 1000,            // 5 min - parts catalog
      get_maintenance_schedule: 10 * 60 * 1000, // 10 min - static specs
      get_expert_reviews: 5 * 60 * 1000,      // 5 min - YouTube data
      get_known_issues: 10 * 60 * 1000,       // 10 min - issues are stable
    };

    const meta = arguments?.[2]?.meta; // (toolName, toolInput, { meta, cacheScopeKey })
    const cacheScopeKey = arguments?.[2]?.cacheScopeKey || 'global';

    if (cacheable.has(toolName)) {
      const rawKey = `${cacheScopeKey}:${toolName}:${stableStringify(toolInput || {})}`;
      const cacheKey = hashCacheKey(rawKey);
      const cached = getCached(cacheKey);
      if (cached.hit) {
        if (meta) meta.cacheHit = true;
        return cached.value;
      }
      if (meta) meta.cacheHit = false;
      const result = await tool(toolInput);
      setCached(cacheKey, result, ttlByToolMs[toolName] || 60_000);
      return result;
    }

    const result = await tool(toolInput);
    if (meta) meta.cacheHit = false;
    return result;
  } catch (err) {
    console.error(`[AL Tools] Error executing ${toolName}:`, err);
    return { error: `Tool execution failed: ${err.message}` };
  }
}

const alTools = {
  // Core car tools
  searchCars,
  getCarDetails,
  getCarAIContext,
  
  // Knowledge & research tools
  searchKnowledge,
  searchEncyclopediaContent,
  getExpertReviews,
  getKnownIssues,
  searchCommunityInsights,
  
  // Performance data tools
  getTrackLapTimes,
  getDynoRuns,
  
  // Parts & maintenance tools
  searchParts,
  getMaintenanceSchedule,
  getUpgradeInfo,
  recommendBuild,
  
  // Vehicle health tools
  analyzeVehicleHealth,
  
  // Comparison & discovery tools
  compareCars,
  searchEvents,
  // searchForums removed - was a stub
  
  // Web search (Exa AI)
  searchWeb,
  
  // Tool executor
  executeToolCall,
};

export default alTools;








