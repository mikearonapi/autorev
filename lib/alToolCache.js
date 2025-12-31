import crypto from 'crypto';

/**
 * Hybrid TTL cache with in-memory primary and optional Redis/Upstash secondary.
 * 
 * Features:
 * - Fast in-memory cache for hot data (per Node process)
 * - Optional Redis/Upstash for cross-instance persistence
 * - Automatic fallback to memory-only if Redis unavailable
 * - Configurable TTLs per cache type
 * 
 * Environment Variables:
 * - UPSTASH_REDIS_REST_URL: Upstash REST API URL
 * - UPSTASH_REDIS_REST_TOKEN: Upstash REST API token
 * - AL_CACHE_REDIS_ENABLED: Set to 'true' to enable Redis (default: false)
 */

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const REDIS_ENABLED = process.env.AL_CACHE_REDIS_ENABLED === 'true' && UPSTASH_URL && UPSTASH_TOKEN;

/** @type {Map<string, { value: any, expiresAt: number }>} */
const CACHE = globalThis.__AUTOREV_AL_TOOL_CACHE__ || new Map();
// @ts-ignore
globalThis.__AUTOREV_AL_TOOL_CACHE__ = CACHE;

const MAX_ENTRIES = 1000;

// Cache stats for monitoring
const STATS = globalThis.__AUTOREV_AL_CACHE_STATS__ || { hits: 0, misses: 0, redisHits: 0, redisMisses: 0 };
// @ts-ignore
globalThis.__AUTOREV_AL_CACHE_STATS__ = STATS;

function nowMs() {
  return Date.now();
}

function pruneIfNeeded() {
  if (CACHE.size <= MAX_ENTRIES) return;
  const entries = [...CACHE.entries()];
  // Drop oldest-expiring first (cheap-ish).
  entries.sort((a, b) => a[1].expiresAt - b[1].expiresAt);
  const toDelete = Math.max(50, Math.ceil(entries.length * 0.15));
  for (let i = 0; i < toDelete; i++) CACHE.delete(entries[i][0]);
}

export function stableStringify(value) {
  if (value === null || value === undefined) return String(value);
  if (typeof value !== 'object') return JSON.stringify(value);

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  const obj = /** @type {Record<string, any>} */ (value);
  const keys = Object.keys(obj).sort();
  const parts = keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`);
  return `{${parts.join(',')}}`;
}

export function hashCacheKey(input) {
  return crypto.createHash('sha1').update(String(input)).digest('hex');
}

// =============================================================================
// REDIS/UPSTASH HELPERS (non-blocking, fire-and-forget for writes)
// =============================================================================

async function redisGet(key) {
  if (!REDIS_ENABLED) return null;
  
  try {
    const res = await fetch(`${UPSTASH_URL}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.result) {
      return JSON.parse(data.result);
    }
    return null;
  } catch {
    return null;
  }
}

function redisSetAsync(key, value, ttlSeconds) {
  if (!REDIS_ENABLED) return;
  
  // Fire-and-forget - don't await
  fetch(`${UPSTASH_URL}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      value: JSON.stringify(value),
      ex: ttlSeconds,
    }),
  }).catch(() => {});
}

// =============================================================================
// PUBLIC CACHE API
// =============================================================================

export function getCached(key) {
  // Check in-memory first (fastest)
  const entry = CACHE.get(key);
  if (entry) {
    if (entry.expiresAt > nowMs()) {
      STATS.hits++;
      return { hit: true, value: entry.value, source: 'memory' };
    }
    CACHE.delete(key);
  }
  
  STATS.misses++;
  return { hit: false, value: null, source: null };
}

/**
 * Get cached value with Redis fallback (async version)
 * Use this for expensive operations where Redis round-trip is worth it
 */
export async function getCachedAsync(key) {
  // Check in-memory first
  const memResult = getCached(key);
  if (memResult.hit) {
    return memResult;
  }
  
  // Try Redis if enabled
  if (REDIS_ENABLED) {
    const redisValue = await redisGet(key);
    if (redisValue !== null) {
      STATS.redisHits++;
      // Warm in-memory cache
      CACHE.set(key, { value: redisValue, expiresAt: nowMs() + 60000 }); // 1 min local TTL
      pruneIfNeeded();
      return { hit: true, value: redisValue, source: 'redis' };
    }
    STATS.redisMisses++;
  }
  
  return { hit: false, value: null, source: null };
}

export function setCached(key, value, ttlMs) {
  const ttl = Math.max(1, Number(ttlMs) || 1);
  CACHE.set(key, { value, expiresAt: nowMs() + ttl });
  pruneIfNeeded();
  
  // Also write to Redis (fire-and-forget) for cross-instance caching
  if (REDIS_ENABLED && ttl >= 30000) { // Only cache items with 30s+ TTL to Redis
    redisSetAsync(key, value, Math.ceil(ttl / 1000));
  }
}

/**
 * Get cache statistics for monitoring
 */
export function getCacheStats() {
  return {
    ...STATS,
    memorySize: CACHE.size,
    redisEnabled: REDIS_ENABLED,
    hitRate: STATS.hits + STATS.misses > 0 
      ? ((STATS.hits + STATS.redisHits) / (STATS.hits + STATS.misses + STATS.redisHits + STATS.redisMisses) * 100).toFixed(1) + '%'
      : 'N/A',
  };
}

/**
 * Clear all caches (useful for testing or manual cache invalidation)
 */
export function clearCache() {
  CACHE.clear();
  STATS.hits = 0;
  STATS.misses = 0;
  STATS.redisHits = 0;
  STATS.redisMisses = 0;
}















