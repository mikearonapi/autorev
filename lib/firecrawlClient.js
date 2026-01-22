/**
 * Firecrawl Client
 * 
 * Client for Firecrawl.dev API - optimized for forum content extraction.
 * Provides clean Markdown output from any webpage with JS rendering,
 * pagination handling, and anti-bot bypass built-in.
 * 
 * Use cases:
 * - Forum thread extraction (full Markdown in one call)
 * - Knowledge base building (crawl documentation sites)
 * - Article/blog content ingestion
 * 
 * @module lib/firecrawlClient
 * @see https://docs.firecrawl.dev/api-reference
 */

const FIRECRAWL_BASE_URL = 'https://api.firecrawl.dev/v1';

/**
 * Get the Firecrawl API key (read dynamically to support late binding)
 * @returns {string|undefined}
 */
function getApiKey() {
  return process.env.FIRECRAWL_API_KEY;
}

/**
 * Check if Firecrawl is configured
 * @returns {boolean}
 */
export function isFirecrawlConfigured() {
  return !!getApiKey();
}

/**
 * Scrape a single URL and return clean Markdown content
 * 
 * @param {string} url - The URL to scrape
 * @param {Object} options - Scrape options
 * @param {string[]} [options.formats=['markdown']] - Output formats: 'markdown', 'html', 'rawHtml', 'links', 'screenshot'
 * @param {string[]} [options.onlyMainContent=true] - Extract only main content (removes nav, footer, etc.)
 * @param {string[]} [options.includeTags] - HTML tags to include (e.g., ['article', 'main'])
 * @param {string[]} [options.excludeTags] - HTML tags to exclude (e.g., ['nav', 'footer'])
 * @param {boolean} [options.waitFor] - CSS selector or milliseconds to wait for
 * @param {number} [options.timeout=30000] - Request timeout in ms
 * @returns {Promise<Object>} Scraped content with markdown, metadata, etc.
 */
export async function scrapeUrl(url, options = {}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('FIRECRAWL_API_KEY not configured');
  }

  const {
    formats = ['markdown'],
    onlyMainContent = true,
    includeTags,
    excludeTags,
    waitFor,
    timeout = 30000,
  } = options;

  const body = {
    url,
    formats,
    onlyMainContent,
  };

  if (includeTags) body.includeTags = includeTags;
  if (excludeTags) body.excludeTags = excludeTags;
  if (waitFor) body.waitFor = waitFor;

  try {
    const response = await fetch(`${FIRECRAWL_BASE_URL}/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeout),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Firecrawl scrape failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`Firecrawl scrape failed: ${data.error || 'Unknown error'}`);
    }

    return {
      success: true,
      url,
      markdown: data.data?.markdown || '',
      html: data.data?.html || null,
      metadata: data.data?.metadata || {},
      links: data.data?.links || [],
      // Additional useful fields
      title: data.data?.metadata?.title || '',
      description: data.data?.metadata?.description || '',
      wordCount: (data.data?.markdown || '').split(/\s+/).length,
    };
  } catch (err) {
    console.error(`[Firecrawl] Scrape error for ${url}:`, err.message);
    return {
      success: false,
      url,
      error: err.message,
    };
  }
}

/**
 * Scrape multiple URLs in batch
 * 
 * @param {string[]} urls - URLs to scrape
 * @param {Object} options - Scrape options (same as scrapeUrl)
 * @param {number} [options.concurrency=3] - Max concurrent requests
 * @param {number} [options.delayMs=500] - Delay between batches
 * @returns {Promise<Object>} Batch results
 */
export async function scrapeBatch(urls, options = {}) {
  const { concurrency = 3, delayMs = 500, ...scrapeOptions } = options;
  
  const results = [];
  const chunks = [];
  
  // Split into chunks for concurrency control
  for (let i = 0; i < urls.length; i += concurrency) {
    chunks.push(urls.slice(i, i + concurrency));
  }
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    
    // Process chunk in parallel
    const chunkResults = await Promise.all(
      chunk.map(url => scrapeUrl(url, scrapeOptions))
    );
    
    results.push(...chunkResults);
    
    // Delay between chunks (not after last)
    if (i < chunks.length - 1 && delayMs > 0) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  
  const succeeded = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  return {
    success: true,
    total: urls.length,
    succeeded: succeeded.length,
    failed: failed.length,
    results,
    errors: failed.map(r => ({ url: r.url, error: r.error })),
  };
}

/**
 * Crawl a website starting from a URL (async job)
 * Good for documentation sites, full forum sections, etc.
 * 
 * @param {string} startUrl - Starting URL for crawl
 * @param {Object} options - Crawl options
 * @param {number} [options.maxDepth=2] - Max link depth to crawl
 * @param {number} [options.limit=100] - Max pages to crawl
 * @param {string[]} [options.includePaths] - URL paths to include (e.g., ['/docs/*'])
 * @param {string[]} [options.excludePaths] - URL paths to exclude
 * @param {boolean} [options.ignoreSitemap=false] - Ignore sitemap.xml
 * @returns {Promise<Object>} Crawl job info with ID for polling
 */
export async function startCrawl(startUrl, options = {}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('FIRECRAWL_API_KEY not configured');
  }

  const {
    maxDepth = 2,
    limit = 100,
    includePaths,
    excludePaths,
    ignoreSitemap = false,
  } = options;

  const body = {
    url: startUrl,
    maxDepth,
    limit,
    ignoreSitemap,
    scrapeOptions: {
      formats: ['markdown'],
      onlyMainContent: true,
    },
  };

  if (includePaths) body.includePaths = includePaths;
  if (excludePaths) body.excludePaths = excludePaths;

  try {
    const response = await fetch(`${FIRECRAWL_BASE_URL}/crawl`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Firecrawl crawl failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      crawlId: data.id,
      status: 'started',
      url: startUrl,
    };
  } catch (err) {
    console.error(`[Firecrawl] Crawl start error:`, err.message);
    return {
      success: false,
      error: err.message,
    };
  }
}

/**
 * Check status of a crawl job
 * 
 * @param {string} crawlId - Crawl job ID
 * @returns {Promise<Object>} Crawl status and results if complete
 */
export async function getCrawlStatus(crawlId) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('FIRECRAWL_API_KEY not configured');
  }

  try {
    const response = await fetch(`${FIRECRAWL_BASE_URL}/crawl/${crawlId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Firecrawl status check failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      crawlId,
      status: data.status, // 'scraping', 'completed', 'failed'
      progress: data.completed || 0,
      total: data.total || 0,
      creditsUsed: data.creditsUsed || 0,
      data: data.data || [], // Array of scraped pages when complete
    };
  } catch (err) {
    console.error(`[Firecrawl] Status check error:`, err.message);
    return {
      success: false,
      crawlId,
      error: err.message,
    };
  }
}

/**
 * Wait for a crawl job to complete (polling)
 * 
 * @param {string} crawlId - Crawl job ID
 * @param {Object} options - Polling options
 * @param {number} [options.pollIntervalMs=5000] - Polling interval
 * @param {number} [options.maxWaitMs=300000] - Max wait time (5 minutes)
 * @returns {Promise<Object>} Final crawl results
 */
export async function waitForCrawl(crawlId, options = {}) {
  const { pollIntervalMs = 5000, maxWaitMs = 300000 } = options;
  
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitMs) {
    const status = await getCrawlStatus(crawlId);
    
    if (!status.success) {
      return status;
    }
    
    if (status.status === 'completed') {
      return {
        success: true,
        crawlId,
        status: 'completed',
        pages: status.data,
        pageCount: status.data?.length || 0,
        creditsUsed: status.creditsUsed,
      };
    }
    
    if (status.status === 'failed') {
      return {
        success: false,
        crawlId,
        status: 'failed',
        error: 'Crawl job failed',
      };
    }
    
    console.log(`[Firecrawl] Crawl ${crawlId}: ${status.progress}/${status.total} pages...`);
    
    await new Promise(r => setTimeout(r, pollIntervalMs));
  }
  
  return {
    success: false,
    crawlId,
    error: `Crawl timed out after ${maxWaitMs / 1000}s`,
  };
}

/**
 * Map/extract structured data from a URL using LLM
 * 
 * @param {string} url - URL to extract from
 * @param {Object} schema - JSON schema for extraction
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Extracted structured data
 */
export async function extractStructured(url, schema, options = {}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('FIRECRAWL_API_KEY not configured');
  }

  const { prompt, timeout = 60000 } = options;

  const body = {
    url,
    formats: ['extract'],
    extract: {
      schema,
    },
  };

  if (prompt) body.extract.prompt = prompt;

  try {
    const response = await fetch(`${FIRECRAWL_BASE_URL}/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeout),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Firecrawl extract failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`Firecrawl extract failed: ${data.error || 'Unknown error'}`);
    }

    return {
      success: true,
      url,
      extracted: data.data?.extract || {},
      metadata: data.data?.metadata || {},
    };
  } catch (err) {
    console.error(`[Firecrawl] Extract error for ${url}:`, err.message);
    return {
      success: false,
      url,
      error: err.message,
    };
  }
}

// ============================================================================
// FORUM-SPECIFIC HELPERS
// ============================================================================

/**
 * Scrape a forum thread and extract structured post data
 * Optimized for vBulletin/XenForo forum threads
 * 
 * @param {string} threadUrl - Forum thread URL
 * @param {Object} options - Scrape options
 * @returns {Promise<Object>} Thread content with posts
 */
export async function scrapeForumThread(threadUrl, options = {}) {
  const {
    extractPosts = true,
    maxRetries = 2,
  } = options;

  // First, get the markdown content
  let result = await scrapeUrl(threadUrl, {
    formats: ['markdown'],
    onlyMainContent: true,
    // Common forum elements to exclude
    excludeTags: ['nav', 'footer', 'aside', '.sidebar', '.advertisement', '.ad-container'],
  });

  // Retry on failure
  let retries = 0;
  while (!result.success && retries < maxRetries) {
    retries++;
    console.log(`[Firecrawl] Retrying thread scrape (${retries}/${maxRetries})...`);
    await new Promise(r => setTimeout(r, 2000 * retries));
    result = await scrapeUrl(threadUrl, {
      formats: ['markdown'],
      onlyMainContent: true,
    });
  }

  if (!result.success) {
    return result;
  }

  // Parse the markdown to extract individual posts
  const posts = extractPosts ? parseForumPosts(result.markdown) : [];

  return {
    success: true,
    url: threadUrl,
    title: result.title,
    markdown: result.markdown,
    wordCount: result.wordCount,
    posts,
    postCount: posts.length,
    metadata: result.metadata,
  };
}

/**
 * Parse forum markdown content into individual posts
 * Works with common forum patterns in Markdown output
 * 
 * @param {string} markdown - Markdown content from Firecrawl
 * @returns {Array<Object>} Parsed posts
 */
function parseForumPosts(markdown) {
  const posts = [];
  
  // Common forum post patterns in markdown:
  // - Posts often start with username/date line
  // - XenForo: "**username** · date" or "username said:"
  // - vBulletin: "username\ndate" or blockquote patterns
  
  // Split by common post separators
  const sections = markdown.split(/(?:^|\n)(?:---+|\*\*\*+|___+)(?:\n|$)/);
  
  // Also try splitting by user attribution patterns
  const userPattern = /(?:^|\n)(?:\*\*([^*]+)\*\*|([A-Za-z0-9_-]+))\s*[·|]\s*([A-Za-z]+ \d+, \d{4}|\d+[dhm] ago)/gm;
  
  if (sections.length > 1) {
    // Use separator-based splitting
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i].trim();
      if (!section || section.length < 20) continue;
      
      // Try to extract author from first line
      const firstLine = section.split('\n')[0];
      const authorMatch = firstLine.match(/\*\*([^*]+)\*\*|^([A-Za-z0-9_-]+)/);
      
      posts.push({
        index: i,
        content: section,
        author: authorMatch ? (authorMatch[1] || authorMatch[2]) : null,
        wordCount: section.split(/\s+/).length,
      });
    }
  } else {
    // Single block - try to find posts by user patterns
    let lastIndex = 0;
    let match;
    let postIndex = 0;
    
    while ((match = userPattern.exec(markdown)) !== null) {
      if (lastIndex > 0 && match.index > lastIndex) {
        const content = markdown.slice(lastIndex, match.index).trim();
        if (content.length > 20) {
          posts[posts.length - 1].content = content;
        }
      }
      
      posts.push({
        index: postIndex++,
        author: match[1] || match[2],
        date: match[3],
        content: '',
        wordCount: 0,
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining content to last post
    if (posts.length > 0 && lastIndex < markdown.length) {
      const content = markdown.slice(lastIndex).trim();
      posts[posts.length - 1].content = content;
      posts[posts.length - 1].wordCount = content.split(/\s+/).length;
    }
    
    // If no posts found, treat entire content as single post
    if (posts.length === 0) {
      posts.push({
        index: 0,
        content: markdown,
        author: null,
        wordCount: markdown.split(/\s+/).length,
      });
    }
  }
  
  return posts;
}

/**
 * Extract forum thread metadata using structured extraction
 * Gets title, author, date, reply count, etc.
 * 
 * @param {string} threadUrl - Thread URL
 * @returns {Promise<Object>} Thread metadata
 */
export async function extractThreadMetadata(threadUrl) {
  const schema = {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Thread title' },
      author: { type: 'string', description: 'Original poster username' },
      postDate: { type: 'string', description: 'When the thread was started' },
      replyCount: { type: 'number', description: 'Number of replies' },
      viewCount: { type: 'number', description: 'Number of views' },
      lastReplyDate: { type: 'string', description: 'Date of last reply' },
      subforum: { type: 'string', description: 'Forum section name' },
      tags: { type: 'array', items: { type: 'string' }, description: 'Thread tags' },
    },
    required: ['title'],
  };

  return extractStructured(threadUrl, schema, {
    prompt: 'Extract forum thread metadata including title, author, dates, and engagement metrics.',
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

const firecrawlClient = {
  isFirecrawlConfigured,
  scrapeUrl,
  scrapeBatch,
  startCrawl,
  getCrawlStatus,
  waitForCrawl,
  extractStructured,
  // Forum-specific
  scrapeForumThread,
  extractThreadMetadata,
};

export default firecrawlClient;
