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
    // Default to a mainstream browser UA because many forums block obvious bots/HEAD requests.
    // Individual forums can override via scrape_config.http.userAgent or scrape_config.http.headers.
    this.userAgent =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
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
        
        const httpConfig = config?.http || {};
        const userAgent = httpConfig.userAgent || this.userAgent;
        const extraHeaders = httpConfig.headers || {};
        const timeoutMs = httpConfig.timeoutMs || 30000;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            // Let Node handle decompression; keep this conservative for compatibility.
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache',
            ...extraHeaders,
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
   * Heuristic detection for bot-protection / JS-challenge pages.
   * We do NOT attempt to bypass challenges; we surface a clear error so the forum can be
   * disabled or moved to an alternate ingestion method.
   *
   * @param {string} html
   * @returns {boolean}
   */
  looksLikeBotChallenge(html) {
    const s = String(html || '').toLowerCase();
    // Common patterns across vendors
    const hasJsPrompt = s.includes('enable javascript') || s.includes('requires javascript');
    const hasCaptcha =
      s.includes('captcha') ||
      s.includes('turnstile') ||
      s.includes('cf-challenge') ||
      s.includes('are you human') ||
      s.includes('verify you are human');

    return hasJsPrompt && hasCaptcha;
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
   * Calculate post quality score for individual posts
   * Higher scores indicate more valuable content
   * @param {Object} post - Post object with content, author info
   * @returns {Object} { score: 0-1, flags: [], isLowQuality: boolean }
   */
  calculatePostQuality(post) {
    const result = { score: 0.5, flags: [], isLowQuality: false };
    const content = (post.content || '').toLowerCase();
    const contentLen = content.length;
    
    // ============================================
    // POSITIVE SIGNALS (increase score)
    // ============================================
    
    // Technical detail indicators
    const technicalPatterns = [
      /\d+\s*(nm|ft-lb|psi|°[cf]|mph|hp|kw|torque)/i,    // Measurements
      /part\s*#?\s*\d+|p\/n\s*:?\s*\w+/i,                 // Part numbers
      /\$\d+[\d,]*|\d+k?\s*miles?/i,                      // Costs/mileage
      /torque.*spec|service\s*interval|oem/i,            // Technical terms
      /diy|how[\s-]to|step[\s-]\d|procedure/i,           // Instructions
    ];
    
    for (const pattern of technicalPatterns) {
      if (pattern.test(content)) {
        result.score += 0.08;
        result.flags.push('has_technical_detail');
      }
    }
    
    // Author credibility signals
    const postCount = parseInt(post.author_post_count) || 0;
    if (postCount > 5000) {
      result.score += 0.15;
      result.flags.push('veteran_member');
    } else if (postCount > 1000) {
      result.score += 0.1;
      result.flags.push('established_member');
    } else if (postCount > 100) {
      result.score += 0.05;
    }
    
    // Length bonus (meaningful content tends to be longer)
    if (contentLen > 500) {
      result.score += 0.1;
      result.flags.push('detailed_post');
    } else if (contentLen > 200) {
      result.score += 0.05;
    }
    
    // Experience indicators
    const experiencePatterns = [
      /i('ve| have) owned|my experience|after \d+ (years?|months?)/i,
      /in my (\d+k|\d{2,}k?) miles/i,
      /long[\s-]term (owner|review)|ownership report/i,
    ];
    
    for (const pattern of experiencePatterns) {
      if (pattern.test(content)) {
        result.score += 0.1;
        result.flags.push('owner_experience');
        break;
      }
    }
    
    // ============================================
    // NEGATIVE SIGNALS (decrease score)
    // ============================================
    
    // Troll/spam indicators
    const trollPatterns = [
      /lol{3,}|lmao{2,}|rofl+/i,                          // Excessive laughing
      /you('re| are) (wrong|stupid|idiot|dumb)/i,        // Attacks
      /this thread (sucks|is garbage)/i,                  // Meta-trolling
      /(gtfo|stfu|ffs)/i,                                 // Aggressive language
      /bump|subscribe|following/i,                        // No-content posts
      /^\s*(same|agreed?|this|me too|\+1|x2)\s*$/i,      // Ultra-short agreements
    ];
    
    for (const pattern of trollPatterns) {
      if (pattern.test(content)) {
        result.score -= 0.2;
        result.flags.push('potential_troll');
      }
    }
    
    // Sales/spam indicators  
    const spamPatterns = [
      /pm\s*(sent|me)|contact me|selling|for sale/i,
      /check (out )?my (build|garage|thread)/i,
      /www\.\w+\.com|http/i,                              // External links
      /discount|coupon|promo code/i,
    ];
    
    for (const pattern of spamPatterns) {
      if (pattern.test(content)) {
        result.score -= 0.15;
        result.flags.push('potential_spam');
      }
    }
    
    // Short posts (often low value)
    if (contentLen < 50) {
      result.score -= 0.2;
      result.flags.push('too_short');
    }
    
    // All caps (often emotional, not technical)
    const capsRatio = (content.match(/[A-Z]/g) || []).length / contentLen;
    if (capsRatio > 0.5 && contentLen > 20) {
      result.score -= 0.1;
      result.flags.push('excessive_caps');
    }
    
    // Normalize score
    result.score = Math.max(0, Math.min(1, result.score));
    result.isLowQuality = result.score < 0.3;
    
    return result;
  }

  /**
   * Filter posts in a thread to keep only high-quality content
   * @param {Array} posts - Array of post objects
   * @param {Object} options - Filtering options
   * @returns {Array} Filtered posts with quality scores
   */
  filterHighQualityPosts(posts, options = {}) {
    const minScore = options.minQualityScore || 0.3;
    const keepOriginalPost = options.keepOriginalPost !== false;
    
    const filtered = [];
    
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      const quality = this.calculatePostQuality(post);
      
      // Always keep the original post (it sets context)
      if (i === 0 && keepOriginalPost) {
        filtered.push({ ...post, _quality: quality });
        continue;
      }
      
      // Skip low-quality posts
      if (quality.score < minScore) {
        continue;
      }
      
      filtered.push({ ...post, _quality: quality });
    }
    
    // Sort remaining posts by quality (keeps order but surfaces good content)
    return filtered.sort((a, b) => (b._quality?.score || 0) - (a._quality?.score || 0));
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
      // Treat baseUrl as a directory (many configs omit trailing slash, but forums often use relative links).
      const normalizedBase = baseUrl?.endsWith('/') ? baseUrl : `${baseUrl}/`;
      return new URL(url, normalizedBase).href;
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
   * @param {Object} options - Additional options (e.g., relaxedFiltering)
   * @returns {boolean} Whether to scrape
   */
  shouldScrapeThread(thread, config, options = {}) {
    const filters = config.threadFilters || {};
    const relaxed = options.relaxedFiltering || false;
    
    // In relaxed mode (for forums with few scraped threads), use much lower thresholds
    const minReplies = relaxed ? Math.max(1, Math.floor((filters.minReplies || 5) / 3)) : filters.minReplies;
    const minViews = relaxed ? Math.max(100, Math.floor((filters.minViews || 500) / 5)) : filters.minViews;
    const relevanceThreshold = relaxed ? 0 : 0.15;
    
    // Check minimum replies (many forums don't expose reply count reliably)
    if (minReplies && (thread.replyCount || 0) < minReplies) {
      // If we couldn't parse reply count, give it a chance in relaxed mode
      if (!relaxed || thread.replyCount !== 0) {
        return false;
      }
    }
    
    // Check minimum views (many forums don't expose view count)
    if (minViews && thread.viewCount !== null && thread.viewCount !== undefined && thread.viewCount < minViews) {
      return false;
    }
    
    // Check relevance score threshold
    if (thread.relevanceScore !== undefined && thread.relevanceScore < relevanceThreshold) {
      // In relaxed mode, still scrape threads with 0 relevance but non-excluded titles
      if (!relaxed) {
        return false;
      }
    }
    
    return true;
  }
}

export default BaseForumAdapter;

