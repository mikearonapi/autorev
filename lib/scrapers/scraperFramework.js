/**
 * Scraper Framework
 * 
 * Base utilities for all web scrapers including:
 * - Rate limiting
 * - Caching
 * - Retry logic
 * - Error handling
 * - HTML parsing utilities
 * 
 * @module lib/scrapers/scraperFramework
 */

// Simple in-memory cache (could be replaced with Redis/Supabase for production)
const cache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours default

// Rate limiting state per domain
const rateLimitState = new Map();

/**
 * @typedef {Object} ScraperConfig
 * @property {string} name - Scraper name for logging
 * @property {string} baseUrl - Base URL for the scraper
 * @property {number} rateLimit - Requests per minute allowed
 * @property {number} cacheTTL - Cache time-to-live in ms
 * @property {Object} headers - Default headers to send
 * @property {number} retries - Number of retries on failure
 * @property {number} retryDelay - Delay between retries in ms
 */

/**
 * Default scraper configuration
 * @type {ScraperConfig}
 */
const defaultConfig = {
  name: 'GenericScraper',
  baseUrl: '',
  rateLimit: 30, // 30 requests per minute
  cacheTTL: CACHE_TTL,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
  },
  retries: 3,
  retryDelay: 2000,
};

/**
 * Sleep for specified milliseconds
 * @param {number} ms 
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check and enforce rate limiting
 * @param {string} domain - Domain to rate limit
 * @param {number} requestsPerMinute - Max requests per minute
 * @returns {Promise<void>}
 */
export async function enforceRateLimit(domain, requestsPerMinute = 30) {
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  
  if (!rateLimitState.has(domain)) {
    rateLimitState.set(domain, { requests: [], windowStart: now });
  }
  
  const state = rateLimitState.get(domain);
  
  // Remove requests outside the window
  state.requests = state.requests.filter(t => now - t < windowMs);
  
  // If at limit, wait
  if (state.requests.length >= requestsPerMinute) {
    const oldestRequest = state.requests[0];
    const waitTime = windowMs - (now - oldestRequest) + 100; // +100ms buffer
    console.log(`[RateLimit] ${domain}: Waiting ${waitTime}ms`);
    await sleep(waitTime);
    // Recursive check after waiting
    return enforceRateLimit(domain, requestsPerMinute);
  }
  
  // Record this request
  state.requests.push(now);
}

/**
 * Get from cache if available and not expired
 * @param {string} key - Cache key
 * @param {number} ttl - TTL in milliseconds
 * @returns {any|null}
 */
export function getFromCache(key, ttl = CACHE_TTL) {
  const cached = cache.get(key);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > ttl) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
}

/**
 * Store in cache
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 */
export function setCache(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Clear entire cache or specific key
 * @param {string} [key] - Optional specific key to clear
 */
export function clearCache(key = null) {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

/**
 * Get cache statistics
 * @returns {Object}
 */
export function getCacheStats() {
  return {
    size: cache.size,
    keys: [...cache.keys()],
  };
}

/**
 * Create a configured scraper instance
 * @param {Partial<ScraperConfig>} config 
 * @returns {Object}
 */
export function createScraper(config = {}) {
  const cfg = { ...defaultConfig, ...config };
  const domain = new URL(cfg.baseUrl).hostname;
  
  return {
    name: cfg.name,
    baseUrl: cfg.baseUrl,
    config: cfg,
    
    /**
     * Fetch a URL with rate limiting, caching, and retries
     * @param {string} url - URL to fetch
     * @param {Object} options - Fetch options
     * @returns {Promise<Response>}
     */
    async fetch(url, options = {}) {
      const fullUrl = url.startsWith('http') ? url : `${cfg.baseUrl}${url}`;
      const cacheKey = `${cfg.name}:${fullUrl}`;
      
      // Check cache first
      const cached = !options.skipCache ? getFromCache(cacheKey, cfg.cacheTTL) : null;
      if (cached && !options.skipCache) {
        console.log(`[${cfg.name}] Cache hit: ${fullUrl}`);
        return cached;
      }
      
      // Enforce rate limit
      await enforceRateLimit(domain, cfg.rateLimit);
      
      let lastError;
      for (let attempt = 1; attempt <= cfg.retries; attempt++) {
        try {
          console.log(`[${cfg.name}] Fetching (attempt ${attempt}): ${fullUrl}`);
          
          const response = await fetch(fullUrl, {
            headers: { ...cfg.headers, ...options.headers },
            ...options,
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const text = await response.text();
          
          // Cache the result
          if (!options.skipCache) {
            setCache(cacheKey, text);
          }
          
          return text;
        } catch (err) {
          lastError = err;
          console.warn(`[${cfg.name}] Attempt ${attempt} failed: ${err.message}`);
          
          if (attempt < cfg.retries) {
            await sleep(cfg.retryDelay * attempt); // Exponential backoff
          }
        }
      }
      
      throw new Error(`[${cfg.name}] Failed after ${cfg.retries} attempts: ${lastError?.message}`);
    },
    
    /**
     * Fetch and parse JSON
     * @param {string} url 
     * @param {Object} options 
     * @returns {Promise<Object>}
     */
    async fetchJSON(url, options = {}) {
      const text = await this.fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Accept': 'application/json',
        },
      });
      return JSON.parse(text);
    },
  };
}

// ============================================================================
// HTML PARSING UTILITIES
// ============================================================================

/**
 * Extract text content between two markers
 * @param {string} html - HTML string
 * @param {string} startMarker - Starting marker
 * @param {string} endMarker - Ending marker
 * @returns {string|null}
 */
export function extractBetween(html, startMarker, endMarker) {
  const startIdx = html.indexOf(startMarker);
  if (startIdx === -1) return null;
  
  const contentStart = startIdx + startMarker.length;
  const endIdx = html.indexOf(endMarker, contentStart);
  if (endIdx === -1) return null;
  
  return html.substring(contentStart, endIdx).trim();
}

/**
 * Extract all matches using a regex pattern
 * @param {string} html - HTML string
 * @param {RegExp} pattern - Regex pattern with capture groups
 * @returns {Array}
 */
export function extractAll(html, pattern) {
  const matches = [];
  let match;
  
  // Ensure global flag
  const globalPattern = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
  
  while ((match = globalPattern.exec(html)) !== null) {
    matches.push(match.groups || match.slice(1));
  }
  
  return matches;
}

/**
 * Strip HTML tags from string
 * @param {string} html 
 * @returns {string}
 */
export function stripTags(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Decode HTML entities
 * @param {string} html 
 * @returns {string}
 */
export function decodeEntities(html) {
  if (!html) return '';
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(num));
}

/**
 * Extract JSON-LD structured data from HTML
 * @param {string} html 
 * @returns {Object|null}
 */
export function extractJsonLd(html) {
  const match = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!match) return null;
  
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

/**
 * Extract meta tag content
 * @param {string} html 
 * @param {string} name - Meta name or property
 * @returns {string|null}
 */
export function extractMeta(html, name) {
  const patterns = [
    new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${name}["']`, 'i'),
    new RegExp(`<meta[^>]*property=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${name}["']`, 'i'),
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return decodeEntities(match[1]);
  }
  
  return null;
}

/**
 * Extract Open Graph data
 * @param {string} html 
 * @returns {Object}
 */
export function extractOpenGraph(html) {
  const og = {};
  const properties = ['title', 'description', 'image', 'url', 'type', 'site_name'];
  
  for (const prop of properties) {
    const value = extractMeta(html, `og:${prop}`);
    if (value) og[prop] = value;
  }
  
  return og;
}

/**
 * Clean and normalize price string
 * @param {string} priceStr 
 * @returns {number|null}
 */
export function parsePrice(priceStr) {
  if (!priceStr) return null;
  
  // Remove currency symbols and commas, extract number
  const cleaned = priceStr.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  
  return isNaN(num) ? null : num;
}

/**
 * Parse a date string into ISO format
 * @param {string} dateStr 
 * @returns {string|null}
 */
export function parseDate(dateStr) {
  if (!dateStr) return null;
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toISOString();
  } catch {
    return null;
  }
}

/**
 * Extract all links from HTML matching a pattern
 * @param {string} html 
 * @param {RegExp} [pattern] - Optional pattern to filter href
 * @returns {Array<{href: string, text: string}>}
 */
export function extractLinks(html, pattern = null) {
  const linkPattern = /<a[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const links = [];
  let match;
  
  while ((match = linkPattern.exec(html)) !== null) {
    const href = match[1];
    const text = stripTags(match[2]);
    
    if (!pattern || pattern.test(href)) {
      links.push({ href, text });
    }
  }
  
  return links;
}

export default {
  createScraper,
  sleep,
  enforceRateLimit,
  getFromCache,
  setCache,
  clearCache,
  getCacheStats,
  extractBetween,
  extractAll,
  stripTags,
  decodeEntities,
  extractJsonLd,
  extractMeta,
  extractOpenGraph,
  parsePrice,
  parseDate,
  extractLinks,
};





