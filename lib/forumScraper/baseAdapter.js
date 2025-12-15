/**
 * Base Forum Adapter
 * 
 * Abstract base class for forum-specific scraping adapters.
 * Provides shared utilities for rate limiting, content cleaning,
 * relevance scoring, and car slug detection.
 * 
 * @module lib/forumScraper/baseAdapter
 */

import * as cheerio from 'cheerio';
import { CAR_KEYWORD_MAPPINGS } from '../forumConfigs.js';

/**
 * Base adapter class - extend this for each forum platform
 */
export class BaseForumAdapter {
  /**
   * @param {Object} scraperService - Reference to ForumScraperService
   */
  constructor(scraperService) {
    this.scraperService = scraperService;
    this.userAgent = 'Mozilla/5.0 (compatible; AutoRevBot/1.0; +https://autorev.app/bot)';
  }

  /**
   * Scrape forum - MUST be implemented by subclasses
   * @param {Object} forumSource - Forum source config
   * @param {Object} scrapeRun - Current scrape run record
   * @param {Object} options - Scrape options
   * @returns {Promise<Object>} Scrape results
   */
  async scrape(forumSource, scrapeRun, options) {
    throw new Error('scrape() must be implemented by subclass');
  }

  /**
   * Fetch URL with rate limiting and retry logic
   * @param {string} url - URL to fetch
   * @param {Object} config - Scrape config
   * @param {number} delayMs - Delay in milliseconds
   * @param {number} retries - Number of retries (default 3)
   * @returns {Promise<string>} HTML content
   */
  async fetchWithRateLimit(url, config, delayMs, retries = 3) {
    // Apply rate limit delay
    await this.delay(delayMs);
    
    let lastError;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`[ForumAdapter] Fetching (attempt ${attempt}/${retries}): ${url}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': this.userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache',
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        // Handle rate limiting (429)
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : delayMs * Math.pow(2, attempt);
          console.warn(`[ForumAdapter] Rate limited (429), waiting ${waitTime}ms before retry`);
          await this.delay(waitTime);
          continue;
        }

        // Handle server errors (503, etc.) with backoff
        if (response.status >= 500) {
          const waitTime = delayMs * Math.pow(2, attempt);
          console.warn(`[ForumAdapter] Server error (${response.status}), waiting ${waitTime}ms before retry`);
          await this.delay(waitTime);
          lastError = new Error(`HTTP ${response.status}: ${url}`);
          continue;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${url}`);
        }

        return response.text();
        
      } catch (error) {
        lastError = error;
        
        // Handle timeout/abort
        if (error.name === 'AbortError') {
          console.warn(`[ForumAdapter] Request timed out for: ${url}`);
          if (attempt < retries) {
            await this.delay(delayMs * attempt);
            continue;
          }
        }
        
        // Handle network errors
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.message.includes('fetch')) {
          console.warn(`[ForumAdapter] Network error: ${error.message}`);
          if (attempt < retries) {
            await this.delay(delayMs * Math.pow(2, attempt));
            continue;
          }
        }
        
        // Re-throw non-retryable errors
        if (attempt === retries) {
          throw lastError;
        }
      }
    }
    
    throw lastError || new Error(`Failed to fetch ${url} after ${retries} attempts`);
  }

  /**
   * Delay execution
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Calculate relevance score for a thread
   * Based on title patterns, engagement metrics, and config filters
   * @param {string} title - Thread title
   * @param {number} replyCount - Number of replies
   * @param {number} viewCount - Number of views
   * @param {Object} config - Scrape config
   * @returns {number} Score between 0-1
   */
  calculateRelevanceScore(title, replyCount, viewCount, config) {
    let score = 0;
    const titleLower = title.toLowerCase();

    const includePatterns = config.threadFilters?.titleInclude || [];
    const excludePatterns = config.threadFilters?.titleExclude || [];

    // Check excludes first (instant disqualify)
    for (const pattern of excludePatterns) {
      if (titleLower.includes(pattern.toLowerCase())) {
        return 0;
      }
    }

    // Score based on valuable title patterns
    let patternMatches = 0;
    for (const pattern of includePatterns) {
      if (titleLower.includes(pattern.toLowerCase())) {
        patternMatches++;
        score += 0.12;
      }
    }

    // Bonus for multiple pattern matches (indicates high-value thread)
    if (patternMatches >= 3) {
      score += 0.15;
    } else if (patternMatches >= 2) {
      score += 0.08;
    }

    // Engagement scoring
    if (replyCount > 100) score += 0.25;
    else if (replyCount > 50) score += 0.2;
    else if (replyCount > 20) score += 0.15;
    else if (replyCount > 10) score += 0.1;
    else if (replyCount > 5) score += 0.05;

    if (viewCount > 50000) score += 0.2;
    else if (viewCount > 20000) score += 0.15;
    else if (viewCount > 10000) score += 0.12;
    else if (viewCount > 5000) score += 0.08;
    else if (viewCount > 1000) score += 0.05;

    // Keywords that indicate extremely valuable content
    const highValueKeywords = [
      'diy guide', 'complete guide', 'definitive guide',
      'ppi checklist', 'pre-purchase inspection',
      'long term review', 'ownership report', 
      '100k mile', '150k mile', '200k mile',
      'track build', 'time attack',
      'failure analysis', 'root cause'
    ];
    
    for (const keyword of highValueKeywords) {
      if (titleLower.includes(keyword)) {
        score += 0.15;
        break;  // Only bonus once
      }
    }

    // Cap at 1.0
    return Math.min(score, 1.0);
  }

  /**
   * Detect car slugs mentioned in content
   * @param {string} content - Text content to scan
   * @param {string[]} forumCarSlugs - Valid car slugs for this forum
   * @returns {string[]} Detected car slugs
   */
  detectCarSlugs(content, forumCarSlugs) {
    const detected = new Set();
    const contentLower = content.toLowerCase();

    // Check each keyword mapping
    for (const [keyword, slugs] of Object.entries(CAR_KEYWORD_MAPPINGS)) {
      if (contentLower.includes(keyword.toLowerCase())) {
        for (const slug of slugs) {
          if (forumCarSlugs.includes(slug)) {
            detected.add(slug);
          }
        }
      }
    }

    return Array.from(detected);
  }

  /**
   * Clean HTML content and extract text
   * @param {string} html - HTML content
   * @returns {string} Cleaned text
   */
  cleanContent(html) {
    if (!html) return '';
    
    const $ = cheerio.load(html);
    
    // Remove unwanted elements
    $('blockquote').remove();     // Quotes (avoid duplication)
    $('.signature').remove();      // Signatures
    $('.ad').remove();             // Ads
    $('script').remove();          // Scripts
    $('style').remove();           // Styles
    $('.bbCodeQuote').remove();    // BB code quotes
    $('img').remove();             // Images
    $('.attachedFiles').remove();  // Attachments
    
    // Get text
    let text = $.text();
    
    // Clean up whitespace
    text = text
      .replace(/\s+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
    // Remove common forum artifacts
    text = text
      .replace(/Click to expand\.\.\./gi, '')
      .replace(/Quote:/gi, '')
      .replace(/Originally Posted by .+/gi, '')
      .trim();
    
    return text;
  }

  /**
   * Parse numeric value from string (handles commas, K, M suffixes)
   * @param {string} str - String to parse
   * @returns {number} Parsed number
   */
  parseNumber(str) {
    if (!str) return 0;
    
    const cleaned = String(str).trim().toLowerCase();
    
    // Handle K/M suffixes
    if (cleaned.endsWith('k')) {
      return Math.round(parseFloat(cleaned) * 1000);
    }
    if (cleaned.endsWith('m')) {
      return Math.round(parseFloat(cleaned) * 1000000);
    }
    
    // Remove commas and parse
    return parseInt(cleaned.replace(/,/g, ''), 10) || 0;
  }

  /**
   * Parse date from various forum formats
   * @param {string} dateStr - Date string
   * @returns {string|null} ISO date string or null
   */
  parseDate(dateStr) {
    if (!dateStr) return null;
    
    const cleaned = String(dateStr).trim();
    
    // Already ISO format
    if (cleaned.match(/^\d{4}-\d{2}-\d{2}/)) {
      return cleaned;
    }
    
    // Try parsing with Date
    const parsed = new Date(cleaned);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
    
    // Handle relative dates (Today, Yesterday, etc.)
    const lowerDate = cleaned.toLowerCase();
    const now = new Date();
    
    if (lowerDate.includes('today')) {
      return now.toISOString();
    }
    if (lowerDate.includes('yesterday')) {
      now.setDate(now.getDate() - 1);
      return now.toISOString();
    }
    
    // Common forum date formats
    const formats = [
      /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/,  // MM/DD/YYYY or M/D/YY
      /(\d{1,2})-(\d{1,2})-(\d{2,4})/,    // MM-DD-YYYY
      /(\w+)\s+(\d{1,2}),?\s+(\d{4})/,    // Month DD, YYYY
    ];
    
    for (const format of formats) {
      const match = cleaned.match(format);
      if (match) {
        const parsed = new Date(cleaned);
        if (!isNaN(parsed.getTime())) {
          return parsed.toISOString();
        }
      }
    }
    
    return null;
  }

  /**
   * Make URL absolute
   * @param {string} url - URL (possibly relative)
   * @param {string} baseUrl - Base URL
   * @returns {string} Absolute URL
   */
  makeAbsoluteUrl(url, baseUrl) {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    try {
      return new URL(url, baseUrl).href;
    } catch {
      return url;
    }
  }

  /**
   * Extract thread ID from URL
   * @param {string} url - Thread URL
   * @returns {string|null} Thread ID
   */
  extractThreadId(url) {
    if (!url) return null;
    
    // XenForo: /threads/thread-title.12345/
    const xenforoMatch = url.match(/\.(\d+)\/?$/);
    if (xenforoMatch) return xenforoMatch[1];
    
    // vBulletin: showthread.php?t=12345
    const vbMatch = url.match(/[?&]t=(\d+)/);
    if (vbMatch) return vbMatch[1];
    
    // Generic: /threads/12345
    const genericMatch = url.match(/\/threads?\/(\d+)/);
    if (genericMatch) return genericMatch[1];
    
    return null;
  }

  /**
   * Check if thread should be scraped based on filters
   * @param {Object} thread - Thread metadata
   * @param {Object} config - Scrape config
   * @returns {boolean} Whether to scrape
   */
  shouldScrapeThread(thread, config) {
    const filters = config.threadFilters || {};
    
    // Check minimum replies
    if (filters.minReplies && (thread.replyCount || 0) < filters.minReplies) {
      return false;
    }
    
    // Check minimum views
    if (filters.minViews && (thread.viewCount || 0) < filters.minViews) {
      return false;
    }
    
    // Check relevance score threshold
    if (thread.relevanceScore !== undefined && thread.relevanceScore < 0.15) {
      return false;
    }
    
    return true;
  }
}

export default BaseForumAdapter;

