import { supabaseServiceRole, supabase, isSupabaseConfigured } from './supabase.js';

// Cache configuration
export const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let statsCache = null;
let cacheTimestamp = 0;
let cachedClientRef = null;

function getDbClient() {
  const client = supabaseServiceRole || supabase;
  if (!client || !isSupabaseConfigured) {
    throw new Error('Supabase client is not configured');
  }
  return client;
}

async function countExact(client, table, applyFilters) {
  let query = client.from(table).select('id', { count: 'exact', head: true });
  if (applyFilters) {
    query = applyFilters(query);
  }
  const { count, error } = await query;
  if (error) {
    throw new Error(`[stats] Failed to count ${table}: ${error.message}`);
  }
  return count || 0;
}

async function fetchPlatformStats(client) {
  const [
    carCount,
    partCount,
    fitmentCount,
    eventCount,
    videoCount,
    insightCount,
    knowledgeChunkCount,
    recallCount,
    issueCount,
  ] = await Promise.all([
    countExact(client, 'cars'),
    countExact(client, 'parts', (q) => q.eq('is_active', true)),
    countExact(client, 'part_fitments'),
    countExact(client, 'events', (q) => q.eq('status', 'approved')),
    countExact(client, 'youtube_videos'),
    countExact(client, 'community_insights'),
    countExact(client, 'document_chunks'),
    countExact(client, 'car_recalls'),
    countExact(client, 'car_issues'),
  ]);

  return {
    cars: carCount,
    parts: partCount,
    fitments: fitmentCount,
    events: eventCount,
    videos: videoCount,
    insights: insightCount,
    knowledgeChunks: knowledgeChunkCount,
    recalls: recallCount,
    issues: issueCount,
    // Computed approximation: bounded by car count
    expertReviewedCars: videoCount > 0 ? Math.min(carCount, 60) : 0,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Get all platform statistics (cached for 5 minutes)
 * @param {Object} options
 * @param {Object} [options.clientOverride] - Injected Supabase client (testing)
 */
export async function getPlatformStats({ clientOverride } = {}) {
  const now = Date.now();
  const clientRef = clientOverride || null;

  if (
    statsCache &&
    (now - cacheTimestamp) < CACHE_TTL_MS &&
    cachedClientRef === clientRef
  ) {
    return statsCache;
  }

  const client = clientOverride || getDbClient();
  const stats = await fetchPlatformStats(client);

  statsCache = stats;
  cacheTimestamp = now;
  cachedClientRef = clientRef;

  return stats;
}

/**
 * Get a single stat (uses cached data)
 */
export async function getStat(key) {
  const stats = await getPlatformStats();
  return stats?.[key];
}

/**
 * Force cache refresh
 */
export function invalidateStatsCache() {
  statsCache = null;
  cacheTimestamp = 0;
  cachedClientRef = null;
}











