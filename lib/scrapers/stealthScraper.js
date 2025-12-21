/**
 * Stealth Scraper Framework
 * 
 * Advanced scraping with anti-detection measures:
 * - Rotating User-Agents (real browser signatures)
 * - Request timing randomization
 * - Session/cookie management
 * - Fingerprint randomization
 * - Proxy support (optional)
 * - Automatic retry with exponential backoff
 * - Request queuing to prevent rate limiting
 * - Multiple fallback strategies
 * 
 * @module lib/scrapers/stealthScraper
 */

import { getFromCache, setCache, sleep } from './scraperFramework.js';

// ============================================================================
// USER AGENT ROTATION
// ============================================================================

// Real browser user agents (updated regularly)
const USER_AGENTS = {
  chrome_mac: [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  ],
  chrome_windows: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 11.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  ],
  firefox_mac: [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0',
  ],
  firefox_windows: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
  ],
  safari_mac: [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  ],
  edge: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  ],
};

// Flatten all user agents
const ALL_USER_AGENTS = Object.values(USER_AGENTS).flat();

/**
 * Get a random user agent
 * @param {string} [browser] - Specific browser type
 * @returns {string}
 */
export function getRandomUserAgent(browser = null) {
  if (browser && USER_AGENTS[browser]) {
    const agents = USER_AGENTS[browser];
    return agents[Math.floor(Math.random() * agents.length)];
  }
  return ALL_USER_AGENTS[Math.floor(Math.random() * ALL_USER_AGENTS.length)];
}

// ============================================================================
// REQUEST HEADERS
// ============================================================================

/**
 * Generate realistic browser headers
 * @param {Object} options
 * @returns {Object}
 */
export function generateHeaders(options = {}) {
  const { referer, accept, userAgent } = options;
  
  const ua = userAgent || getRandomUserAgent();
  const isChrome = ua.includes('Chrome');
  const isFirefox = ua.includes('Firefox');
  const isSafari = ua.includes('Safari') && !ua.includes('Chrome');
  
  const headers = {
    'User-Agent': ua,
    'Accept': accept || 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Cache-Control': 'max-age=0',
  };
  
  if (referer) {
    headers['Referer'] = referer;
  }
  
  // Browser-specific headers
  if (isChrome) {
    headers['sec-ch-ua'] = '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"';
    headers['sec-ch-ua-mobile'] = '?0';
    headers['sec-ch-ua-platform'] = '"macOS"';
    headers['Sec-Fetch-Dest'] = 'document';
    headers['Sec-Fetch-Mode'] = 'navigate';
    headers['Sec-Fetch-Site'] = referer ? 'same-origin' : 'none';
    headers['Sec-Fetch-User'] = '?1';
  }
  
  return headers;
}

// ============================================================================
// TIMING RANDOMIZATION
// ============================================================================

/**
 * Random delay between min and max milliseconds
 * @param {number} min - Minimum delay in ms
 * @param {number} max - Maximum delay in ms
 * @returns {Promise<void>}
 */
export async function randomDelay(min = 1000, max = 3000) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  await sleep(delay);
}

/**
 * Human-like delay based on "reading" time
 * @param {number} contentLength - Length of content to "read"
 * @returns {Promise<void>}
 */
export async function humanReadDelay(contentLength = 1000) {
  // Average human reads ~250 words per minute
  // Assuming average word is 5 characters
  const words = contentLength / 5;
  const readTimeMs = (words / 250) * 60 * 1000;
  
  // Add some randomness (±30%)
  const variance = readTimeMs * 0.3;
  const actualDelay = readTimeMs + (Math.random() * variance * 2 - variance);
  
  // Cap between 500ms and 10s
  const cappedDelay = Math.max(500, Math.min(10000, actualDelay));
  
  await sleep(cappedDelay);
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

// Cookie storage per domain
const cookieJar = new Map();

/**
 * Parse Set-Cookie headers and store cookies
 * @param {string} domain 
 * @param {Response} response 
 */
export function storeCookies(domain, response) {
  const setCookies = response.headers.getSetCookie?.() || 
                     response.headers.get('set-cookie');
  
  if (!setCookies) return;
  
  const cookies = Array.isArray(setCookies) ? setCookies : [setCookies];
  const domainCookies = cookieJar.get(domain) || {};
  
  for (const cookie of cookies) {
    const [nameValue] = cookie.split(';');
    const [name, value] = nameValue.split('=');
    if (name && value) {
      domainCookies[name.trim()] = value.trim();
    }
  }
  
  cookieJar.set(domain, domainCookies);
}

/**
 * Get cookies for a domain as a header string
 * @param {string} domain 
 * @returns {string}
 */
export function getCookies(domain) {
  const cookies = cookieJar.get(domain);
  if (!cookies) return '';
  
  return Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

/**
 * Clear cookies for a domain
 * @param {string} domain 
 */
export function clearCookies(domain) {
  cookieJar.delete(domain);
}

// ============================================================================
// REQUEST QUEUE
// ============================================================================

// Queue state per domain
const requestQueues = new Map();

/**
 * @typedef {Object} QueueConfig
 * @property {number} minDelay - Minimum delay between requests (ms)
 * @property {number} maxDelay - Maximum delay between requests (ms)
 * @property {number} maxConcurrent - Max concurrent requests
 */

/**
 * Get or create a request queue for a domain
 * @param {string} domain 
 * @param {QueueConfig} config 
 */
function getQueue(domain, config = {}) {
  if (!requestQueues.has(domain)) {
    requestQueues.set(domain, {
      lastRequest: 0,
      pending: 0,
      config: {
        minDelay: config.minDelay || 2000,
        maxDelay: config.maxDelay || 5000,
        maxConcurrent: config.maxConcurrent || 2,
      },
    });
  }
  return requestQueues.get(domain);
}

/**
 * Wait for queue slot
 * @param {string} domain 
 * @param {QueueConfig} config 
 */
async function waitForQueueSlot(domain, config = {}) {
  const queue = getQueue(domain, config);
  
  // Wait for concurrent limit
  while (queue.pending >= queue.config.maxConcurrent) {
    await sleep(100);
  }
  
  // Wait for minimum delay since last request
  const timeSinceLastRequest = Date.now() - queue.lastRequest;
  const minWait = queue.config.minDelay;
  
  if (timeSinceLastRequest < minWait) {
    await sleep(minWait - timeSinceLastRequest);
  }
  
  // Add random delay
  await randomDelay(0, queue.config.maxDelay - queue.config.minDelay);
  
  queue.pending++;
  queue.lastRequest = Date.now();
}

/**
 * Release queue slot
 * @param {string} domain 
 */
function releaseQueueSlot(domain) {
  const queue = requestQueues.get(domain);
  if (queue) {
    queue.pending = Math.max(0, queue.pending - 1);
  }
}

// ============================================================================
// STEALTH SCRAPER CLASS
// ============================================================================

/**
 * @typedef {Object} StealthScraperConfig
 * @property {string} name - Scraper name for logging
 * @property {string} baseUrl - Base URL
 * @property {number} minDelay - Minimum delay between requests (ms)
 * @property {number} maxDelay - Maximum delay between requests (ms)
 * @property {number} maxRetries - Max retry attempts
 * @property {number} cacheTTL - Cache duration (ms)
 * @property {boolean} persistCookies - Whether to persist cookies
 * @property {string} proxyUrl - Optional proxy URL
 * @property {Function} onBlocked - Callback when blocked
 */

/**
 * Create a stealth scraper instance
 * @param {StealthScraperConfig} config 
 * @returns {Object}
 */
export function createStealthScraper(config = {}) {
  const {
    name = 'StealthScraper',
    baseUrl = '',
    minDelay = 2000,
    maxDelay = 5000,
    maxRetries = 3,
    cacheTTL = 24 * 60 * 60 * 1000, // 24 hours
    persistCookies = true,
    proxyUrl = null,
    onBlocked = null,
  } = config;
  
  const domain = baseUrl ? new URL(baseUrl).hostname : 'unknown';
  let sessionUserAgent = getRandomUserAgent();
  let requestCount = 0;
  let blockedCount = 0;
  
  // Rotate user agent periodically
  const rotateUserAgent = () => {
    if (requestCount % 10 === 0) { // Every 10 requests
      sessionUserAgent = getRandomUserAgent();
    }
  };
  
  return {
    name,
    baseUrl,
    domain,
    
    /**
     * Get current session stats
     */
    getStats() {
      return {
        requestCount,
        blockedCount,
        currentUserAgent: sessionUserAgent,
        cookieCount: Object.keys(cookieJar.get(domain) || {}).length,
      };
    },
    
    /**
     * Reset session (new user agent, clear cookies)
     */
    resetSession() {
      sessionUserAgent = getRandomUserAgent();
      clearCookies(domain);
      requestCount = 0;
      console.log(`[${name}] Session reset`);
    },
    
    /**
     * Fetch with stealth measures
     * @param {string} url - URL to fetch
     * @param {Object} options - Fetch options
     * @returns {Promise<string>} HTML content
     */
    async fetch(url, options = {}) {
      const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
      const cacheKey = `stealth:${name}:${fullUrl}`;
      
      // Check cache first
      const cached = getFromCache(cacheKey, cacheTTL);
      if (cached && !options.skipCache) {
        console.log(`[${name}] Cache hit: ${fullUrl}`);
        return cached;
      }
      
      rotateUserAgent();
      
      // Wait for queue slot
      await waitForQueueSlot(domain, { minDelay, maxDelay });
      
      let lastError;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          requestCount++;
          
          // Build headers
          const headers = generateHeaders({
            userAgent: sessionUserAgent,
            referer: options.referer || baseUrl,
            ...options.headers,
          });
          
          // Add cookies
          const cookies = getCookies(domain);
          if (cookies && persistCookies) {
            headers['Cookie'] = cookies;
          }
          
          console.log(`[${name}] Fetching (attempt ${attempt}): ${fullUrl.substring(0, 80)}...`);
          
          // Make request
          const fetchOptions = {
            method: options.method || 'GET',
            headers,
            redirect: 'follow',
          };
          
          // Add proxy if configured
          if (proxyUrl) {
            // Note: Native fetch doesn't support proxies
            // This would need a custom agent in Node.js
            console.log(`[${name}] Proxy configured: ${proxyUrl}`);
          }
          
          const response = await fetch(fullUrl, fetchOptions);
          
          // Store cookies
          if (persistCookies) {
            storeCookies(domain, response);
          }
          
          // Check for blocking
          if (response.status === 403 || response.status === 429) {
            blockedCount++;
            console.warn(`[${name}] Blocked (${response.status}) on attempt ${attempt}`);
            
            if (onBlocked) {
              await onBlocked({ url: fullUrl, status: response.status, attempt });
            }
            
            // Longer wait after being blocked
            await randomDelay(5000, 15000);
            
            // Rotate user agent
            sessionUserAgent = getRandomUserAgent();
            
            throw new Error(`Blocked: HTTP ${response.status}`);
          }
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const html = await response.text();
          
          // Check for soft blocks (CAPTCHA, etc.)
          if (isSoftBlocked(html)) {
            blockedCount++;
            console.warn(`[${name}] Soft block detected (CAPTCHA/challenge)`);
            
            if (onBlocked) {
              await onBlocked({ url: fullUrl, status: 'captcha', attempt });
            }
            
            throw new Error('Soft block detected');
          }
          
          // Cache successful result
          setCache(cacheKey, html);
          
          releaseQueueSlot(domain);
          return html;
          
        } catch (err) {
          lastError = err;
          console.warn(`[${name}] Attempt ${attempt} failed: ${err.message}`);
          
          if (attempt < maxRetries) {
            // Exponential backoff
            const backoffDelay = Math.pow(2, attempt) * 1000 + Math.random() * 2000;
            await sleep(backoffDelay);
          }
        }
      }
      
      releaseQueueSlot(domain);
      throw new Error(`[${name}] Failed after ${maxRetries} attempts: ${lastError?.message}`);
    },
    
    /**
     * Fetch JSON with stealth measures
     */
    async fetchJSON(url, options = {}) {
      const html = await this.fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Accept': 'application/json, text/plain, */*',
        },
      });
      return JSON.parse(html);
    },
    
    /**
     * Simulate browsing behavior (visit homepage first, then target)
     */
    async browseToPage(targetUrl, options = {}) {
      // First, visit the homepage to get cookies
      if (requestCount === 0 || !getCookies(domain)) {
        console.log(`[${name}] Initial homepage visit for cookies...`);
        await this.fetch('/', { ...options, skipCache: true });
        await humanReadDelay(500);
      }
      
      // Then visit the target
      return this.fetch(targetUrl, options);
    },
  };
}

/**
 * Check if response indicates a soft block (CAPTCHA, challenge, etc.)
 * @param {string} html 
 * @returns {boolean}
 */
function isSoftBlocked(html) {
  const blockIndicators = [
    'captcha',
    'cf-challenge',
    'challenge-running',
    'ddos-guard',
    'please verify you are human',
    'access denied',
    'robot or human',
    'security check',
    'cloudflare',
    'rate limit',
    'too many requests',
    'blocked',
    'unusual traffic',
  ];
  
  const lowerHtml = html.toLowerCase();
  
  // Check for block indicators
  for (const indicator of blockIndicators) {
    if (lowerHtml.includes(indicator)) {
      // Make sure it's not just a mention in content
      // Look for it in script tags or specific patterns
      if (
        lowerHtml.includes(`<title>${indicator}`) ||
        lowerHtml.includes(`id="${indicator}`) ||
        lowerHtml.includes(`class="${indicator}`) ||
        (indicator === 'captcha' && lowerHtml.includes('g-recaptcha'))
      ) {
        return true;
      }
    }
  }
  
  // Check for very short responses (often blocking pages)
  if (html.length < 1000 && blockIndicators.some(i => lowerHtml.includes(i))) {
    return true;
  }
  
  return false;
}

// ============================================================================
// PROXY MANAGEMENT
// ============================================================================

/**
 * Proxy manager for rotating IPs
 * Note: Actual proxy implementation would require configuration
 */
export class ProxyManager {
  constructor(proxies = []) {
    this.proxies = proxies;
    this.currentIndex = 0;
    this.failedProxies = new Set();
  }
  
  /**
   * Get next working proxy
   * @returns {string|null}
   */
  getNext() {
    if (this.proxies.length === 0) return null;
    
    // Find next non-failed proxy
    for (let i = 0; i < this.proxies.length; i++) {
      const index = (this.currentIndex + i) % this.proxies.length;
      const proxy = this.proxies[index];
      
      if (!this.failedProxies.has(proxy)) {
        this.currentIndex = (index + 1) % this.proxies.length;
        return proxy;
      }
    }
    
    // All proxies failed, reset and try again
    this.failedProxies.clear();
    return this.proxies[0];
  }
  
  /**
   * Mark a proxy as failed
   * @param {string} proxy 
   */
  markFailed(proxy) {
    this.failedProxies.add(proxy);
  }
  
  /**
   * Add proxies to the pool
   * @param {string[]} proxies 
   */
  addProxies(proxies) {
    this.proxies.push(...proxies);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  createStealthScraper,
  getRandomUserAgent,
  generateHeaders,
  randomDelay,
  humanReadDelay,
  storeCookies,
  getCookies,
  clearCookies,
  ProxyManager,
};














