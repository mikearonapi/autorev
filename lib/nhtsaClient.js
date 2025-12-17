/**
 * NHTSA API Client (no-key public endpoints)
 *
 * Focused, reusable wrapper around https://api.nhtsa.gov endpoints with:
 * - input validation
 * - timeout + retry for transient failures
 * - consistent return shape
 *
 * NOTE: This is intentionally small. Domain mapping / persistence lives in recallService.
 *
 * @module lib/nhtsaClient
 */

const NHTSA_API_BASE = 'https://api.nhtsa.gov';

/**
 * @typedef {Object} NhtsaClientResult
 * @property {boolean} ok
 * @property {any|null} data
 * @property {string|null} error
 * @property {number|null} status
 * @property {string} url
 */

/**
 * @param {any} v
 * @returns {string|null}
 */
function asNonEmptyString(v) {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  return s.length ? s : null;
}

/**
 * @param {any} v
 * @returns {number|null}
 */
function asSafeYear(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  const y = Math.trunc(n);
  // Basic sanity bounds (automotive era)
  if (y < 1970 || y > 2100) return null;
  return y;
}

/**
 * Fetch with timeout + basic retry for transient failures.
 *
 * @param {string} url
 * @param {object} [options]
 * @param {number} [options.timeoutMs]
 * @param {number} [options.retries]
 * @param {(msg: string, meta?: object) => void} [options.logInfo]
 * @param {(msg: string, meta?: object) => void} [options.logWarn]
 * @returns {Promise<NhtsaClientResult>}
 */
export async function fetchJsonWithRetry(url, options = {}) {
  const timeoutMs = Number(options.timeoutMs ?? 12_000);
  const retries = Math.max(0, Math.min(Number(options.retries ?? 2), 5));
  const logInfo = typeof options.logInfo === 'function' ? options.logInfo : null;
  const logWarn = typeof options.logWarn === 'function' ? options.logWarn : null;

  /** @type {any} */
  let lastErr = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
      });

      const status = res.status;
      
      // NHTSA API quirk: returns 400 with valid JSON when no results found
      // We need to parse the body to check if it's actually a valid response
      const data = await res.json().catch(() => null);
      
      // Check if this is a "success-like" response despite non-2xx status
      const isNhtsaSuccessResponse = data && typeof data === 'object' && 
        ('results' in data || data.Message === 'Results returned successfully');
      
      if (!res.ok && !isNhtsaSuccessResponse) {
        // Treat 5xx as retryable; 4xx as final.
        const retryable = status >= 500 && status <= 599;
        const msg = `NHTSA request failed (${status})`;
        if (!retryable || attempt === retries) {
          return { ok: false, data: null, error: msg, status, url };
        }
        if (logWarn) logWarn(msg, { url, status, attempt, retries });
        continue;
      }
      if (logInfo) logInfo('NHTSA request ok', { url, status, attempt });
      return { ok: true, data, error: null, status, url };
    } catch (err) {
      lastErr = err;
      const isAbort = err?.name === 'AbortError';
      const msg = isAbort ? `NHTSA request timed out after ${timeoutMs}ms` : (err?.message || 'NHTSA request failed');

      if (attempt === retries) {
        return { ok: false, data: null, error: msg, status: null, url };
      }
      if (logWarn) logWarn(msg, { url, attempt, retries });
    } finally {
      clearTimeout(t);
    }
  }

  return {
    ok: false,
    data: null,
    error: lastErr?.message || 'NHTSA request failed',
    status: null,
    url,
  };
}

/**
 * Build recallsByVehicle URL for make/model/year.
 * @param {object} params
 * @param {string} params.make
 * @param {string} params.model
 * @param {number} params.modelYear
 */
export function buildRecallsByVehicleUrl({ make, model, modelYear }) {
  const mk = asNonEmptyString(make);
  const md = asNonEmptyString(model);
  const yr = asSafeYear(modelYear);
  if (!mk || !md || !yr) {
    throw new Error('Invalid make/model/modelYear');
  }
  const qs = new URLSearchParams({
    make: mk,
    model: md,
    modelYear: String(yr),
  });
  return `${NHTSA_API_BASE}/recalls/recallsByVehicle?${qs.toString()}`;
}

/**
 * Fetch recall campaigns by make/model/year.
 * @param {object} params
 * @param {string} params.make
 * @param {string} params.model
 * @param {number} params.modelYear
 * @param {object} [options]
 * @returns {Promise<NhtsaClientResult>}
 */
export async function fetchRecallsByVehicle({ make, model, modelYear }, options = {}) {
  const url = buildRecallsByVehicleUrl({ make, model, modelYear });
  return fetchJsonWithRetry(url, options);
}



