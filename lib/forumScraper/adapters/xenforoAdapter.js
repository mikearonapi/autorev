/**
 * XenForo Forum Adapter
 * 
 * Adapter for scraping XenForo 2.x forums.
 * Used by: Rennlist, Miata.net, CorvetteForum, VWVortex
 * 
 * @module lib/forumScraper/adapters/xenforoAdapter
 */

import * as cheerio from 'cheerio';
import { BaseForumAdapter } from '../baseAdapter.js';

/**
 * XenForo-specific scraping adapter
 */
export class XenForoAdapter extends BaseForumAdapter {
  /**
   * Scrape XenForo forum
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
        const listUrl = `${forumSource.base_url}${subforumPath}?page=${page}`;
        console.log(`[XenForoAdapter] Fetching thread list: ${listUrl}`);

        try {
          const html = await this.fetchWithRateLimit(listUrl, config, config.rateLimitMs || 2000);
          const threads = this.parseThreadList(html, config, subforumCarSlugs, forumSource.base_url);

          if (threads.length === 0) {
            hasMore = false;
            continue;
          }

          results.threadsFound += threads.length;

          // Filter and scrape qualifying threads
          for (const thread of threads) {
            if (results.threadsScraped >= maxThreads) break;
            
            if (!this.shouldScrapeThread(thread, config)) {
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
                
                console.log(`[XenForoAdapter] Scraped thread: ${fullThread.title} (${fullThread.posts.length} posts)`);
              }
            } catch (threadError) {
              console.error(`[XenForoAdapter] Error scraping thread: ${thread.url}`, threadError.message);
            }
          }

          page++;

        } catch (listError) {
          console.error(`[XenForoAdapter] Error fetching list: ${listUrl}`, listError.message);
          hasMore = false;
        }
      }
    }

    return results;
  }

  /**
   * Parse thread list from XenForo HTML
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

    const threadSelector = selectors.thread || '.structItem--thread';
    
    $(threadSelector).each((i, el) => {
      const $thread = $(el);

      // Skip sticky threads
      const stickySelector = selectors.isSticky || '.structItem-status--sticky';
      if ($thread.find(stickySelector).length > 0 || $thread.hasClass('is-sticky')) {
        return;
      }

      // Parse title and URL
      const titleSelector = selectors.title || '.structItem-title a';
      const titleEl = $thread.find(titleSelector).first();
      const title = titleEl.text().trim();
      
      let url = titleEl.attr('href');
      url = this.makeAbsoluteUrl(url, baseUrl);

      if (!title || !url) return;

      // Parse engagement metrics
      const repliesSelector = selectors.replies || '.structItem-cell--meta dd:first-child';
      const viewsSelector = selectors.views || '.structItem-cell--meta dd:last-child';
      
      const repliesText = $thread.find(repliesSelector).text();
      const viewsText = $thread.find(viewsSelector).text();
      
      const replies = this.parseNumber(repliesText);
      const views = this.parseNumber(viewsText);

      // Parse date
      const dateSelector = selectors.lastPostDate || '.structItem-latestDate';
      const dateEl = $thread.find(dateSelector);
      const lastPostDate = dateEl.attr('datetime') || this.parseDate(dateEl.text());

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
    const $ = cheerio.load(html);
    const selectors = config.threadContentSelectors || {};

    const posts = [];
    let fullContent = '';
    
    const postSelector = selectors.post || '.message--post';

    $(postSelector).each((i, el) => {
      const $post = $(el);

      // Parse author
      const authorSelector = selectors.author || '.message-name a';
      const author = $post.find(authorSelector).text().trim();

      // Parse date
      const dateSelector = selectors.date || '.message-date time';
      const dateEl = $post.find(dateSelector);
      const date = dateEl.attr('datetime') || this.parseDate(dateEl.text());

      // Parse content
      const contentSelector = selectors.content || '.message-body .bbWrapper';
      const contentHtml = $post.find(contentSelector).html();
      const content = this.cleanContent(contentHtml);

      // Parse post number
      const postNumSelector = selectors.postNumber || '.message-attribution-opposite a';
      const postNumText = $post.find(postNumSelector).text();
      const postNumber = parseInt(postNumText.replace('#', ''), 10) || (i + 1);

      // Get author metadata if available
      const joinDateSelector = selectors.authorJoinDate;
      const postCountSelector = selectors.authorPostCount;
      
      let authorJoinDate = null;
      let authorPostCount = 0;
      
      if (joinDateSelector) {
        authorJoinDate = $post.find(joinDateSelector).text().trim() || null;
      }
      if (postCountSelector) {
        authorPostCount = this.parseNumber($post.find(postCountSelector).text());
      }

      // Skip empty/tiny posts
      if (content.length > 50) {
        posts.push({
          post_number: postNumber,
          author,
          author_join_date: authorJoinDate,
          author_post_count: authorPostCount,
          date,
          content,
          is_op: postNumber === 1
        });
        fullContent += ' ' + content;
      }
    });

    // Get thread title from page
    const title = $('h1.p-title-value').text().trim() || 
                  $('h1').first().text().trim() ||
                  $('.threadtitle').text().trim();

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
      replyCount: posts.length - 1,
      viewCount: null,
      posts,
      relevanceScore,
      carSlugsDetected
    };
  }
}

export default XenForoAdapter;

