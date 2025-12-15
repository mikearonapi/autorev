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
        // vBulletin pagination format
        const listUrl = page === 1 
          ? `${forumSource.base_url}${subforumPath}`
          : `${forumSource.base_url}${subforumPath}index${page}.html`;
        
        console.log(`[VBulletinAdapter] Fetching thread list: ${listUrl}`);

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

      // Skip sticky threads
      const stickySelector = selectors.isSticky || '.sticky';
      if ($thread.hasClass('sticky') || $thread.find(stickySelector).length > 0) {
        return;
      }

      // Skip announcement rows
      if ($thread.hasClass('announcement') || $thread.find('.announcement').length > 0) {
        return;
      }

      // Parse title and URL
      const titleSelector = selectors.title || '.title a, .threadtitle a';
      const titleEl = $thread.find(titleSelector).first();
      const title = titleEl.text().trim();
      
      let url = titleEl.attr('href');
      url = this.makeAbsoluteUrl(url, baseUrl);

      if (!title || !url) return;

      // Parse engagement metrics
      const repliesSelector = selectors.replies || '.replies, td.alt2:nth-child(4)';
      const viewsSelector = selectors.views || '.views, td.alt2:nth-child(5)';
      
      // vBulletin often has replies in format "X Replies"
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
      
      const replies = this.parseNumber(repliesText);
      const views = this.parseNumber(viewsText);

      // Parse date
      const dateSelector = selectors.lastPostDate || '.lastpostdate, .date';
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
    
    // vBulletin post selectors
    const postSelector = selectors.post || '.postcontainer, .post, div[id^="post_"]';

    $(postSelector).each((i, el) => {
      const $post = $(el);

      // Parse author
      const authorSelector = selectors.author || '.username, .bigusername, a[class*="username"]';
      const author = $post.find(authorSelector).first().text().trim();

      // Parse date
      const dateSelector = selectors.date || '.postdate, .date, .datetime';
      let dateText = $post.find(dateSelector).text().trim();
      
      // vBulletin often has date in format "MM-DD-YYYY, HH:MM AM/PM"
      const date = this.parseDate(dateText);

      // Parse content
      const contentSelector = selectors.content || '.postcontent, .postbody, div[id^="post_message_"]';
      const contentHtml = $post.find(contentSelector).html();
      const content = this.cleanContent(contentHtml);

      // Parse post number
      const postNumSelector = selectors.postNumber || '.postcounter, a[name^="post"]';
      let postNumText = $post.find(postNumSelector).text();
      
      // Sometimes post number is in element name/id
      if (!postNumText) {
        const postId = $post.attr('id');
        const match = postId?.match(/post_?(\d+)/);
        if (match) postNumText = String(i + 1);
      }
      
      const postNumber = parseInt(postNumText.replace(/[#\s]/g, ''), 10) || (i + 1);

      // Skip empty/tiny posts
      if (content.length > 50) {
        posts.push({
          post_number: postNumber,
          author,
          date,
          content,
          is_op: postNumber === 1 || i === 0
        });
        fullContent += ' ' + content;
      }
    });

    // Get thread title from page
    const title = $('h1').first().text().trim() ||
                  $('.threadtitle').text().trim() ||
                  $('title').text().split('-')[0].trim();

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

export default VBulletinAdapter;

