/**
 * LLM Observability Configuration
 * 
 * Provides centralized configuration for LLM API observability via Helicone proxy.
 * Helicone provides:
 * - Request/response traces with latency breakdowns
 * - Cost tracking by user, model, prompt version
 * - Tool call success/failure rates
 * - Anomaly detection (slow responses, errors)
 * 
 * Usage:
 *   import { getAnthropicConfig, buildHeliconeHeaders } from '@/lib/observability';
 *   
 *   const { apiUrl, headers } = getAnthropicConfig({
 *     userId: 'user-123',
 *     promptVersion: 'v1.1-baseline',
 *     sessionId: 'conv-456',
 *   });
 * 
 * @module lib/observability
 */

const HELICONE_API_KEY = process.env.HELICONE_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Direct Anthropic API URL (fallback when Helicone not configured)
const ANTHROPIC_DIRECT_URL = 'https://api.anthropic.com/v1/messages';

// Helicone proxy URL for Anthropic
const HELICONE_ANTHROPIC_URL = 'https://anthropic.helicone.ai/v1/messages';

/**
 * Check if Helicone observability is configured
 * @returns {boolean}
 */
export function isHeliconeConfigured() {
  return Boolean(HELICONE_API_KEY);
}

/**
 * Build Helicone-specific headers for request tracking
 * 
 * @param {Object} options - Tracking options
 * @param {string} [options.userId] - User ID for per-user analytics
 * @param {string} [options.sessionId] - Session/conversation ID
 * @param {string} [options.promptVersion] - Prompt version for A/B tracking
 * @param {string} [options.requestId] - Unique request ID for correlation
 * @param {Object} [options.properties] - Custom properties to track
 * @returns {Object} Headers object for Helicone
 */
export function buildHeliconeHeaders(options = {}) {
  if (!HELICONE_API_KEY) {
    return {};
  }

  const headers = {
    'Helicone-Auth': `Bearer ${HELICONE_API_KEY}`,
  };

  // User tracking - enables per-user cost analytics
  if (options.userId) {
    headers['Helicone-User-Id'] = options.userId;
  }

  // Session tracking - groups requests by conversation
  if (options.sessionId) {
    headers['Helicone-Session-Id'] = options.sessionId;
  }

  // Prompt version tracking - enables A/B test analysis
  if (options.promptVersion) {
    headers['Helicone-Prompt-Id'] = options.promptVersion;
  }

  // Request correlation ID
  if (options.requestId) {
    headers['Helicone-Request-Id'] = options.requestId;
  }

  // Custom properties for filtering/analysis
  if (options.properties && typeof options.properties === 'object') {
    // Helicone supports custom properties via JSON header
    headers['Helicone-Property-Json'] = JSON.stringify(options.properties);
  }

  return headers;
}

/**
 * Get Anthropic API configuration with optional Helicone observability
 * 
 * @param {Object} options - Configuration options
 * @param {string} [options.userId] - User ID for tracking
 * @param {string} [options.sessionId] - Session/conversation ID
 * @param {string} [options.promptVersion] - Prompt version for A/B testing
 * @param {string} [options.requestId] - Unique request ID
 * @param {Object} [options.properties] - Custom properties (tier, car_slug, etc.)
 * @returns {Object} { apiUrl, headers } - URL and headers for fetch call
 */
export function getAnthropicConfig(options = {}) {
  const baseHeaders = {
    'Content-Type': 'application/json',
    'x-api-key': ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
  };

  // If Helicone is configured, use proxy URL and add tracking headers
  if (isHeliconeConfigured()) {
    const heliconeHeaders = buildHeliconeHeaders(options);
    return {
      apiUrl: HELICONE_ANTHROPIC_URL,
      headers: {
        ...baseHeaders,
        ...heliconeHeaders,
      },
      observabilityEnabled: true,
    };
  }

  // Fallback to direct Anthropic API
  return {
    apiUrl: ANTHROPIC_DIRECT_URL,
    headers: baseHeaders,
    observabilityEnabled: false,
  };
}

/**
 * Create a fetch wrapper that automatically adds observability
 * 
 * @param {Object} options - Observability options
 * @returns {Function} Configured fetch function for Anthropic API
 */
export function createObservableFetch(options = {}) {
  const { apiUrl, headers } = getAnthropicConfig(options);

  return async function observableFetch(body, fetchOptions = {}) {
    return fetch(apiUrl, {
      method: 'POST',
      headers: {
        ...headers,
        ...(fetchOptions.headers || {}),
      },
      body: typeof body === 'string' ? body : JSON.stringify(body),
      ...fetchOptions,
    });
  };
}

/**
 * Log observability status on startup (useful for debugging)
 */
export function logObservabilityStatus() {
  if (isHeliconeConfigured()) {
    console.log('[Observability] Helicone proxy enabled - LLM traces will be captured');
  } else {
    console.log('[Observability] Helicone not configured - using direct Anthropic API');
  }
}

const observability = {
  isHeliconeConfigured,
  buildHeliconeHeaders,
  getAnthropicConfig,
  createObservableFetch,
  logObservabilityStatus,
};

export default observability;
