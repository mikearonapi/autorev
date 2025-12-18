/**
 * Browser-Based Scraper
 * 
 * Uses Puppeteer for JavaScript-heavy sites that require:
 * - Full JavaScript rendering
 * - Interaction (clicks, scrolls, form submissions)
 * - Bypassing bot detection that checks for browser APIs
 * 
 * This is a heavier-weight solution used as a fallback when
 * basic HTTP requests are blocked.
 * 
 * Note: Requires puppeteer package to be installed:
 * npm install puppeteer
 * 
 * @module lib/scrapers/browserScraper
 */

import { getFromCache, setCache, sleep } from './scraperFramework.js';
import { getRandomUserAgent, randomDelay, humanReadDelay } from './stealthScraper.js';

// Lazy-load puppeteer to avoid startup cost when not needed
let puppeteerModule = null;
let browserInstance = null;

/**
 * Get puppeteer module (lazy load)
 * @returns {Promise<Object>}
 */
async function getPuppeteer() {
  if (!puppeteerModule) {
    try {
      puppeteerModule = await import('puppeteer');
    } catch (err) {
      console.error('[BrowserScraper] Puppeteer not installed. Run: npm install puppeteer');
      throw new Error('Puppeteer not available');
    }
  }
  return puppeteerModule.default || puppeteerModule;
}

/**
 * Get or create browser instance
 * @param {Object} options
 * @returns {Promise<Object>}
 */
async function getBrowser(options = {}) {
  if (!browserInstance) {
    const puppeteer = await getPuppeteer();
    
    browserInstance = await puppeteer.launch({
      headless: options.headless !== false ? 'new' : false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080',
        '--disable-blink-features=AutomationControlled',
        // Randomize WebGL vendor/renderer
        '--use-gl=swiftshader',
      ],
      defaultViewport: {
        width: 1920,
        height: 1080,
      },
    });
  }
  return browserInstance;
}

/**
 * Close browser instance
 */
export async function closeBrowser() {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

/**
 * Configure a page to be stealthy
 * @param {Object} page - Puppeteer page
 */
async function configureStealthPage(page) {
  const userAgent = getRandomUserAgent('chrome_mac');
  await page.setUserAgent(userAgent);
  
  // Override navigator properties to hide automation
  await page.evaluateOnNewDocument(() => {
    // Overwrite the 'webdriver' property
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });
    
    // Overwrite 'plugins' to look like a real browser
    Object.defineProperty(navigator, 'plugins', {
      get: () => [
        { name: 'Chrome PDF Plugin' },
        { name: 'Chrome PDF Viewer' },
        { name: 'Native Client' },
      ],
    });
    
    // Overwrite 'languages'
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
    });
    
    // Hide automation indicators
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
    
    // Mock chrome runtime
    window.chrome = {
      runtime: {},
    };
    
    // Mock permissions
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications' ?
        Promise.resolve({ state: Notification.permission }) :
        originalQuery(parameters)
    );
  });
  
  // Set extra headers
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
  });
}

/**
 * Simulate human-like mouse movements
 * @param {Object} page 
 */
async function simulateHumanBehavior(page) {
  // Random scroll
  await page.evaluate(() => {
    const scrollAmount = Math.random() * 500;
    window.scrollBy(0, scrollAmount);
  });
  
  await sleep(500 + Math.random() * 1000);
  
  // Random mouse movement
  const viewport = await page.viewport();
  const x = Math.random() * (viewport?.width || 1920);
  const y = Math.random() * (viewport?.height || 1080);
  await page.mouse.move(x, y);
}

/**
 * @typedef {Object} BrowserScraperConfig
 * @property {string} name - Scraper name
 * @property {string} baseUrl - Base URL
 * @property {boolean} headless - Run in headless mode
 * @property {number} timeout - Page load timeout (ms)
 * @property {number} cacheTTL - Cache duration (ms)
 * @property {boolean} simulateHuman - Simulate human behavior
 * @property {Function} onCaptcha - Callback when CAPTCHA detected
 */

/**
 * Create a browser-based scraper
 * @param {BrowserScraperConfig} config 
 * @returns {Object}
 */
export function createBrowserScraper(config = {}) {
  const {
    name = 'BrowserScraper',
    baseUrl = '',
    headless = true,
    timeout = 30000,
    cacheTTL = 24 * 60 * 60 * 1000,
    simulateHuman = true,
    onCaptcha = null,
  } = config;
  
  let pagePool = [];
  const maxPages = 3;
  
  return {
    name,
    baseUrl,
    
    /**
     * Get a page from the pool or create new one
     */
    async getPage() {
      // Reuse existing page if available
      if (pagePool.length > 0) {
        return pagePool.pop();
      }
      
      const browser = await getBrowser({ headless });
      const page = await browser.newPage();
      await configureStealthPage(page);
      
      // Set timeout
      page.setDefaultTimeout(timeout);
      page.setDefaultNavigationTimeout(timeout);
      
      return page;
    },
    
    /**
     * Return page to pool
     */
    async releasePage(page) {
      if (pagePool.length < maxPages) {
        // Clear page state before reusing
        try {
          await page.goto('about:blank');
          pagePool.push(page);
        } catch {
          await page.close().catch(() => {});
        }
      } else {
        await page.close().catch(() => {});
      }
    },
    
    /**
     * Fetch a page using browser
     * @param {string} url 
     * @param {Object} options
     * @returns {Promise<string>}
     */
    async fetch(url, options = {}) {
      const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
      const cacheKey = `browser:${name}:${fullUrl}`;
      
      // Check cache
      const cached = getFromCache(cacheKey, cacheTTL);
      if (cached && !options.skipCache) {
        console.log(`[${name}] Cache hit: ${fullUrl}`);
        return cached;
      }
      
      const page = await this.getPage();
      
      try {
        console.log(`[${name}] Navigating: ${fullUrl.substring(0, 80)}...`);
        
        // Add random delay before navigation
        await randomDelay(1000, 3000);
        
        // Navigate to page
        const response = await page.goto(fullUrl, {
          waitUntil: options.waitUntil || 'networkidle2',
        });
        
        // Check for blocking
        if (response && (response.status() === 403 || response.status() === 429)) {
          throw new Error(`Blocked: HTTP ${response.status()}`);
        }
        
        // Wait for content to load
        if (options.waitForSelector) {
          await page.waitForSelector(options.waitForSelector, { timeout: 10000 });
        }
        
        // Simulate human behavior
        if (simulateHuman) {
          await simulateHumanBehavior(page);
        }
        
        // Check for CAPTCHA
        const html = await page.content();
        if (this.hasCaptcha(html)) {
          console.warn(`[${name}] CAPTCHA detected`);
          
          if (onCaptcha) {
            await onCaptcha({ url: fullUrl, page });
          }
          
          throw new Error('CAPTCHA detected');
        }
        
        // Cache result
        setCache(cacheKey, html);
        
        await this.releasePage(page);
        return html;
        
      } catch (err) {
        console.error(`[${name}] Error:`, err.message);
        await this.releasePage(page);
        throw err;
      }
    },
    
    /**
     * Fetch with interactions (clicks, scrolls)
     * @param {string} url 
     * @param {Object} options
     * @returns {Promise<string>}
     */
    async fetchWithInteraction(url, options = {}) {
      const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
      const page = await this.getPage();
      
      try {
        await page.goto(fullUrl, { waitUntil: 'networkidle2' });
        
        // Execute custom interactions
        if (options.interactions) {
          for (const interaction of options.interactions) {
            switch (interaction.type) {
              case 'click':
                await page.click(interaction.selector);
                break;
              case 'scroll':
                await page.evaluate((y) => window.scrollBy(0, y), interaction.amount || 500);
                break;
              case 'wait':
                await sleep(interaction.time || 1000);
                break;
              case 'waitForSelector':
                await page.waitForSelector(interaction.selector, { timeout: 10000 });
                break;
              case 'type':
                await page.type(interaction.selector, interaction.text);
                break;
            }
            
            await sleep(500 + Math.random() * 500);
          }
        }
        
        const html = await page.content();
        await this.releasePage(page);
        return html;
        
      } catch (err) {
        await this.releasePage(page);
        throw err;
      }
    },
    
    /**
     * Take a screenshot (useful for debugging)
     * @param {string} url 
     * @param {string} outputPath 
     */
    async screenshot(url, outputPath) {
      const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
      const page = await this.getPage();
      
      try {
        await page.goto(fullUrl, { waitUntil: 'networkidle2' });
        await page.screenshot({ path: outputPath, fullPage: true });
        await this.releasePage(page);
      } catch (err) {
        await this.releasePage(page);
        throw err;
      }
    },
    
    /**
     * Extract data using page.evaluate
     * @param {string} url 
     * @param {Function} extractFn - Function to run in browser context
     * @returns {Promise<any>}
     */
    async extract(url, extractFn) {
      const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
      const page = await this.getPage();
      
      try {
        await page.goto(fullUrl, { waitUntil: 'networkidle2' });
        
        if (simulateHuman) {
          await simulateHumanBehavior(page);
        }
        
        const data = await page.evaluate(extractFn);
        await this.releasePage(page);
        return data;
        
      } catch (err) {
        await this.releasePage(page);
        throw err;
      }
    },
    
    /**
     * Check if page has CAPTCHA
     * @param {string} html 
     * @returns {boolean}
     */
    hasCaptcha(html) {
      const captchaIndicators = [
        'g-recaptcha',
        'h-captcha',
        'cf-turnstile',
        'captcha-container',
        'robot',
        'verify you are human',
        'security check',
      ];
      
      const lowerHtml = html.toLowerCase();
      return captchaIndicators.some(indicator => lowerHtml.includes(indicator));
    },
    
    /**
     * Cleanup resources
     */
    async cleanup() {
      for (const page of pagePool) {
        await page.close().catch(() => {});
      }
      pagePool = [];
    },
  };
}

/**
 * Create a scraper with automatic fallback from HTTP to browser
 * @param {Object} httpScraper - HTTP-based scraper
 * @param {Object} browserConfig - Browser scraper config
 * @returns {Object}
 */
export function createFallbackScraper(httpScraper, browserConfig = {}) {
  const browserScraper = createBrowserScraper({
    name: `${httpScraper.name}-Browser`,
    baseUrl: httpScraper.baseUrl || httpScraper.config?.baseUrl,
    ...browserConfig,
  });
  
  return {
    ...httpScraper,
    
    /**
     * Fetch with automatic fallback to browser
     */
    async fetchWithFallback(url, options = {}) {
      try {
        // Try HTTP first
        return await httpScraper.fetch(url, options);
      } catch (err) {
        // Check if blocked
        if (err.message.includes('Blocked') || 
            err.message.includes('403') || 
            err.message.includes('429') ||
            err.message.includes('captcha') ||
            err.message.includes('Soft block')) {
          
          console.log(`[${httpScraper.name}] HTTP blocked, falling back to browser...`);
          
          // Try browser
          return await browserScraper.fetch(url, options);
        }
        
        throw err;
      }
    },
    
    browserScraper,
  };
}

export default {
  createBrowserScraper,
  createFallbackScraper,
  closeBrowser,
};





