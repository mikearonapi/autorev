import crypto from 'crypto';

/**
 * Ultra-light in-memory TTL cache (best-effort).
 * Notes:
 * - Works per Node process (serverless instances won't share state).
 * - Intended for short TTL caching of expensive tool calls.
 */

/** @type {Map<string, { value: any, expiresAt: number }>} */
const CACHE = globalThis.__AUTOREV_AL_TOOL_CACHE__ || new Map();
// @ts-ignore
globalThis.__AUTOREV_AL_TOOL_CACHE__ = CACHE;

const MAX_ENTRIES = 800;

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

export function getCached(key) {
  const entry = CACHE.get(key);
  if (!entry) return { hit: false, value: null };
  if (entry.expiresAt <= nowMs()) {
    CACHE.delete(key);
    return { hit: false, value: null };
  }
  return { hit: true, value: entry.value };
}

export function setCached(key, value, ttlMs) {
  const ttl = Math.max(1, Number(ttlMs) || 1);
  CACHE.set(key, { value, expiresAt: nowMs() + ttl });
  pruneIfNeeded();
}




