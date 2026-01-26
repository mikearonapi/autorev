/**
 * vBulletin Forum Adapter
 * 
 * Adapter for scraping vBulletin forums.
 * Used by: Bimmerpost, FT86Club
 * 
 * @module lib/forumScraper/adapters/vbulletinAdapter
 */

import * as cheerio from 'cheerio';

import { BaseForumAdapter } from '../baseAdapter.js';

/**
 * Build a vBulletin forum list URL for the given page.
 *
 * vBulletin forums vary a lot:
 * - Some use `index2.html` style pagination (e.g., `.../forum-50/index2.html`)
 * - Some use `/page2/` style pagination (e.g., `.../s2000-talk-1/page2/`)
 * - Some use query-string pagination (e.g., `forumdisplay.php?f=577&page=2`)
 *
 * @param {string} baseUrl
 * @param {string} subforumPath
 * @param {number} page
 * @param {Object} pagination
 * @returns {string}
 */
export function buildVBulletinListUrl(baseUrl, subforumPath, page, pagination = {}) {
  const mode = pagination.mode || 'index_html';
  const paramName = pagination.paramName || 'page';

  if (page <= 1) return `${baseUrl}${subforumPath}`;

  if (mode === 'page_path') {
    // Ensure trailing slash before appending page segment
    const normalized = subforumPath.endsWith('/') ? subforumPath : `${subforumPath}/`;
    return `${baseUrl}${normalized}page${page}/`;
  }

  if (mode === 'query_param') {
    const joinChar = subforumPath.includes('?') ? '&' : '?';
    return `${baseUrl}${subforumPath}${joinChar}${paramName}=${page}`;
  }

  // Default: index2.html / index3.html...
  return `${baseUrl}${subforumPath}index${page}.html`;
}

/**
 * vBulletin-specific scraping adapter
 */
export class VBulletinAdapter extends BaseForumAdapter {
  /**
   * Scrape vBulletin forum
   * @param {Object} forumSource - Forum source config
   * @param {Object} scrapeRun - Current scrape run
   * @param {Object} options - Scrape options
   * @returns {Promise<Object>} Scrape results
   */
  async scrape(forumSource, scrapeRun, options = {}) {
    const config = forumSource.scrape_config;
    const results = {
      threadsFound: 0,
      threadsScraped: 0,
      postsScraped: 0
    };

    const maxThreads = options.maxThreads || config.maxPagesPerRun || 30;
    
    // Determine subforums to scrape
    const subforumsToScrape = options.subforums || Object.keys(config.subforums || {});

    for (const subforumPath of subforumsToScrape) {
      if (results.threadsScraped >= maxThreads) break;
      
      const subforumCarSlugs = config.subforums?.[subforumPath] || forumSource.car_slugs || [];
      
      // Scrape thread list pages
      let page = 1;
      let hasMore = true;
      const maxPages = config.pagination?.maxPages || 10;

      while (hasMore && page <= maxPages && results.threadsScraped < maxThreads) {
        const listUrl = buildVBulletinListUrl(
          forumSource.base_url,
          subforumPath,
          page,
          config.pagination
        );
        
        console.log(`[VBulletinAdapter] Fetching thread list: ${listUrl}`);

        try {
          const html = await this.fetchWithRateLimit(listUrl, config, config.rateLimitMs || 2000);
          if (this.looksLikeBotChallenge(html)) {
            throw new Error(`Blocked by bot protection (JS/captcha challenge) at ${forumSource.base_url}`);
          }
          const threads = this.parseThreadList(html, config, subforumCarSlugs, forumSource.base_url);

          if (threads.length === 0) {
            hasMore = false;
            continue;
          }

          results.threadsFound += threads.length;

          // Filter and scrape qualifying threads
          for (const thread of threads) {
            if (results.threadsScraped >= maxThreads) break;
            
            if (!this.shouldScrapeThread(thread, config, { relaxedFiltering: options.relaxedFiltering })) {
              continue;
            }

            try {
              const fullThread = await this.scrapeThread(
                thread.url, 
                config, 
                subforumPath,
                subforumCarSlugs,
                forumSource.base_url
              );

              if (fullThread && fullThread.posts && fullThread.posts.length > 0) {
                await this.scraperService.saveScrapedThread(
                  scrapeRun.id,
                  forumSource.id,
                  fullThread
                );
                results.threadsScraped++;
                results.postsScraped += fullThread.posts.length;
                
                console.log(`[VBulletinAdapter] Scraped thread: ${fullThread.title} (${fullThread.posts.length} posts)`);
              }
            } catch (threadError) {
              console.error(`[VBulletinAdapter] Error scraping thread: ${thread.url}`, threadError.message);
            }
          }

          page++;

        } catch (listError) {
          console.error(`[VBulletinAdapter] Error fetching list: ${listUrl}`, listError.message);
          hasMore = false;
        }
      }
    }

    return results;
  }

  /**
   * Parse thread list from vBulletin HTML
   * @param {string} html - Page HTML
   * @param {Object} config - Scrape config
   * @param {string[]} subforumCarSlugs - Valid car slugs
   * @param {string} baseUrl - Forum base URL
   * @returns {Array} Parsed threads
   */
  parseThreadList(html, config, subforumCarSlugs, baseUrl) {
    const $ = cheerio.load(html);
    const threads = [];
    const selectors = config.threadListSelectors || {};

    // vBulletin thread selectors
    const threadSelector = selectors.thread || '.threadbit, .threadlistrow, tr[id^="thread_"]';
    
    $(threadSelector).each((i, el) => {
      const $thread = $(el);

      // Skip sticky threads (multiple detection methods)
      const stickySelector = selectors.isSticky || '.sticky';
      if ($thread.hasClass('sticky') || 
          $thread.find(stickySelector).length > 0 ||
          $thread.find('img[alt*="Sticky"]').length > 0) {
        return;
      }

      // Skip announcement rows
      if ($thread.hasClass('announcement') || $thread.find('.announcement').length > 0) {
        return;
      }

      // Skip header rows
      if ($thread.hasClass('thead') || $thread.find('.thead').length > 0) {
        return;
      }

      // Parse title and URL - support multiple selector patterns
      const titleSelector = selectors.title || '.title a, .threadtitle a';
      let titleEl = $thread.find(titleSelector).first();
      
      // Fallback: look for any link with thread_title id
      if (!titleEl.length) {
        titleEl = $thread.find('a[id^="thread_title"]').first();
      }
      
      const title = titleEl.text().trim();
      let url = titleEl.attr('href');
      url = this.makeAbsoluteUrl(url, baseUrl);

      if (!title || !url) return;

      // Parse engagement metrics
      let replies = 0;
      let views = 0;
      
      // Method 1: Check for title attribute with "Replies: X, Views: Y" format (Rennlist style)
      const statsCell = $thread.find('.tcell.alt2.smallfont, [title*="Replies"]');
      if (statsCell.length > 0) {
        const titleAttr = statsCell.attr('title') || '';
        const repliesMatch = titleAttr.match(/Replies:\s*([\d,]+)/i);
        const viewsMatch = titleAttr.match(/Views:\s*([\d,]+)/i);
        if (repliesMatch) replies = this.parseNumber(repliesMatch[1]);
        if (viewsMatch) views = this.parseNumber(viewsMatch[1]);
      }
      
      // Method 2: Traditional selector approach
      if (!replies && !views) {
        const repliesSelector = selectors.replies || '.replies, td.alt2:nth-child(4)';
        const viewsSelector = selectors.views || '.views, td.alt2:nth-child(5)';
        
        let repliesText = $thread.find(repliesSelector).text();
        let viewsText = $thread.find(viewsSelector).text();
        
        // Sometimes stats are in specific td cells
        if (!repliesText) {
          const cells = $thread.find('td');
          if (cells.length >= 4) {
            repliesText = cells.eq(3).text();
            viewsText = cells.eq(4).text();
          }
        }
        
        replies = this.parseNumber(repliesText);
        views = this.parseNumber(viewsText);
      }

      // Parse date
      const dateSelector = selectors.lastPostDate || '.lastpostdate, .date, .lastpost';
      const dateText = $thread.find(dateSelector).text();
      const lastPostDate = this.parseDate(dateText);

      // Calculate relevance
      const relevanceScore = this.calculateRelevanceScore(title, replies, views, config);

      // Detect car slugs from title
      const carSlugsDetected = this.detectCarSlugs(title, subforumCarSlugs);

      threads.push({
        title,
        url,
        replyCount: replies,
        viewCount: views,
        lastReplyDate: lastPostDate,
        relevanceScore,
        carSlugsDetected
      });
    });

    // Fallback for vBulletin templates where threads are plain <tr> rows without ids/classes,
    // but still contain `a[id^="thread_title_"]` anchors (e.g., Bimmerpost / FT86Club).
    if (threads.length === 0) {
      $('a[id^="thread_title_"]').each((i, el) => {
        const titleEl = $(el);
        const $row = titleEl.closest('tr');

        // Skip non-row anchors
        if (!$row.length) return;

        // Skip sticky/announcement/header rows
        const stickySelector = selectors.isSticky || '.sticky';
        if (
          $row.hasClass('sticky') ||
          $row.find(stickySelector).length > 0 ||
          $row.find('img[alt*="Sticky"]').length > 0 ||
          $row.hasClass('announcement') ||
          $row.find('.announcement').length > 0 ||
          $row.hasClass('thead') ||
          $row.find('.thead').length > 0
        ) {
          return;
        }

        const title = titleEl.text().trim();
        let url = titleEl.attr('href');
        url = this.makeAbsoluteUrl(url, baseUrl);
        if (!title || !url) return;

        // Try to parse engagement metrics from sibling td cells
        let replies = 0;
        let views = 0;

        const statsCell = $row.find('.tcell.alt2.smallfont, [title*="Replies"]');
        if (statsCell.length > 0) {
          const titleAttr = statsCell.attr('title') || '';
          const repliesMatch = titleAttr.match(/Replies:\s*([\d,]+)/i);
          const viewsMatch = titleAttr.match(/Views:\s*([\d,]+)/i);
          if (repliesMatch) replies = this.parseNumber(repliesMatch[1]);
          if (viewsMatch) views = this.parseNumber(viewsMatch[1]);
        }

        if (!replies && !views) {
          const cells = $row.find('td');
          // Heuristic: replies/views are commonly 4th/5th td in vBulletin forumdisplay
          if (cells.length >= 5) {
            replies = this.parseNumber(cells.eq(3).text());
            views = this.parseNumber(cells.eq(4).text());
          }
        }

        const dateSelector = selectors.lastPostDate || '.lastpostdate, .date, .lastpost';
        const dateText = $row.find(dateSelector).text();
        const lastPostDate = this.parseDate(dateText);

        const relevanceScore = this.calculateRelevanceScore(title, replies, views, config);
        const carSlugsDetected = this.detectCarSlugs(title, subforumCarSlugs);

        threads.push({
          title,
          url,
          replyCount: replies,
          viewCount: views,
          lastReplyDate: lastPostDate,
          relevanceScore,
          carSlugsDetected
        });
      });
    }

    return threads;
  }

  /**
   * Scrape full thread content
   * @param {string} url - Thread URL
   * @param {Object} config - Scrape config
   * @param {string} subforum - Subforum path
   * @param {string[]} subforumCarSlugs - Valid car slugs
   * @param {string} baseUrl - Forum base URL
   * @returns {Promise<Object>} Thread with posts
   */
  async scrapeThread(url, config, subforum, subforumCarSlugs, baseUrl) {
    const html = await this.fetchWithRateLimit(url, config, config.rateLimitMs || 2000);
    if (this.looksLikeBotChallenge(html)) {
      throw new Error(`Blocked by bot protection (JS/captcha challenge) at ${url}`);
    }
    const $ = cheerio.load(html);
    const selectors = config.threadContentSelectors || {};

    const posts = [];
    let fullContent = '';
    
    // vBulletin post selectors - try multiple patterns
    let postSelector = selectors.post || '.postcontainer, .post, div[id^="post_"]';
    
    // Check if this is a Rennlist-style page (div[id^="post"] with swoop-skip class)
    const rennlistPosts = $('div[id^="post"].swoop-skip');
    if (rennlistPosts.length > 0) {
      postSelector = 'div[id^="post"].swoop-skip';
    }

    $(postSelector).each((i, el) => {
      const $post = $(el);
      
      // Skip menu popups and thank containers
      const postId = $post.attr('id') || '';
      if (postId.includes('menu') || postId.includes('thanks') || postId.includes('share')) {
        return;
      }

      // Parse author - try multiple patterns
      const authorSelector = selectors.author || '.username, .bigusername, a[class*="username"]';
      const author = $post.find(authorSelector).first().text().trim();

      // Parse date - multiple patterns
      const dateSelector = selectors.date || '.postdate, .date, .datetime, .trow.thead.smallfont .tcell';
      let dateText = $post.find(dateSelector).first().text().trim();
      
      // Clean up Rennlist-style dates (e.g., "Dec 27, 2018 | 09:34 AM")
      if (dateText.includes('|')) {
        dateText = dateText.split('|')[0].trim();
      }
      
      const date = this.parseDate(dateText);

      // Parse content - try multiple patterns
      const contentSelector = selectors.content || '.postcontent, .postbody, div[id^="post_message_"]';
      let contentEl = $post.find(contentSelector);
      
      // Fallback: look for any div starting with post_message
      if (!contentEl.length) {
        contentEl = $post.find('div[id^="post_message_"]');
      }
      
      const contentHtml = contentEl.html();
      const content = this.cleanContent(contentHtml);

      // Parse post number from the anchor or ID
      let postNumber = i + 1;
      const postNumSelector = selectors.postNumber || '.postcounter, a[name^="post"]';
      const postNumEl = $post.find(postNumSelector);
      
      if (postNumEl.length) {
        // Try to extract number from name attribute (a[name="post15523618"])
        const nameAttr = postNumEl.attr('name');
        if (nameAttr) {
          // Just use sequential number
          postNumber = i + 1;
        } else {
          const numText = postNumEl.text().trim();
          const parsed = parseInt(numText.replace(/[#\s]/g, ''), 10);
          if (!isNaN(parsed)) postNumber = parsed;
        }
      }

      // Skip empty/tiny posts
      if (content && content.length > 50) {
        posts.push({
          post_number: postNumber,
          author: author || 'Anonymous',
          date,
          content,
          is_op: i === 0
        });
        fullContent += ' ' + content;
      }
    });

    // Get thread title from page - try multiple patterns
    let title = $('h1').first().text().trim();
    if (!title) {
      title = $('.threadtitle').text().trim();
    }
    if (!title) {
      title = $('title').text().split('-')[0].trim();
    }
    if (!title) {
      // Try to get from breadcrumb or page header
      title = $('.breadcrumb a:last').text().trim() || 
              $('meta[property="og:title"]').attr('content') ||
              'Untitled Thread';
    }

    // Get original post date
    const opDate = posts[0]?.date;

    // Detect car slugs from full content
    const carSlugsDetected = this.detectCarSlugs(title + ' ' + fullContent.substring(0, 5000), subforumCarSlugs);

    // Recalculate relevance with full content context
    const relevanceScore = this.calculateRelevanceScore(
      title + ' ' + fullContent.substring(0, 500),
      posts.length,
      0,
      config
    );

    return {
      url,
      title,
      subforum,
      originalPostDate: opDate,
      lastReplyDate: posts[posts.length - 1]?.date,
      replyCount: posts.length > 0 ? posts.length - 1 : 0,
      viewCount: null,
      posts,
      relevanceScore,
      carSlugsDetected
    };
  }
}

export default VBulletinAdapter;

