/**
 * Forum Scraper Service
 * 
 * Main orchestration service for forum scraping operations.
 * Manages scrape runs, coordinates adapters, and persists results.
 * 
 * @module lib/forumScraper
 */

import { supabaseServiceRole, isSupabaseConfigured } from '../supabase.js';
import { XenForoAdapter } from './adapters/xenforoAdapter.js';
import { VBulletinAdapter } from './adapters/vbulletinAdapter.js';
import { FORUM_CONFIGS } from '../forumConfigs.js';

/**
 * Forum Scraper Service class
 * Coordinates scraping operations across different forum platforms
 */
export class ForumScraperService {
  constructor(options = {}) {
    this.adapters = new Map();
    this.platformAdapters = new Map();
    this.userAgent = 'Mozilla/5.0 (compatible; AutoRevBot/1.0; +https://autorev.app/bot)';
    this.dryRun = options.dryRun || false;
    this.dryRunResults = [];
    this._registerPlatformAdapters();
  }

  /**
   * Enable or disable dry-run mode
   * In dry-run mode, threads are parsed but not saved to DB
   * @param {boolean} enabled - Whether to enable dry-run
   */
  setDryRun(enabled) {
    this.dryRun = enabled;
    this.dryRunResults = [];
    console.log(`[ForumScraper] Dry-run mode: ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }

  /**
   * Get dry-run results (for testing)
   * @returns {Array} Results that would have been saved
   */
  getDryRunResults() {
    return this.dryRunResults;
  }

  /**
   * Register platform-specific adapters
   * @private
   */
  _registerPlatformAdapters() {
    this.platformAdapters.set('xenforo', new XenForoAdapter(this));
    this.platformAdapters.set('vbulletin', new VBulletinAdapter(this));
  }

  /**
   * Get adapter for a platform type
   * @param {string} platform - Platform type (xenforo, vbulletin)
   * @returns {Object|null} Platform adapter
   */
  getPlatformAdapter(platform) {
    return this.platformAdapters.get(platform) || null;
  }

  /**
   * Get database client (service role required for RLS-protected tables)
   * @returns {Object} Supabase client
   */
  getDbClient() {
    if (!isSupabaseConfigured || !supabaseServiceRole) {
      throw new Error('Supabase service role not configured');
    }
    return supabaseServiceRole;
  }

  /**
   * Register a forum-specific adapter
   * @param {string} forumSlug - Forum identifier
   * @param {Object} adapter - Adapter instance
   */
  registerAdapter(forumSlug, adapter) {
    this.adapters.set(forumSlug, adapter);
  }

  /**
   * Get registered adapter for a forum
   * @param {string} forumSlug - Forum identifier
   * @returns {Object|null} Adapter instance
   */
  getAdapter(forumSlug) {
    return this.adapters.get(forumSlug) || null;
  }

  /**
   * Create a new scrape run record
   * @param {string} forumSourceId - Forum source UUID
   * @param {string} runType - 'discovery', 'targeted', or 'backfill'
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Created scrape run
   */
  async createScrapeRun(forumSourceId, runType, options = {}) {
    const client = this.getDbClient();
    
    const { data, error } = await client
      .from('forum_scrape_runs')
      .insert({
        forum_source_id: forumSourceId,
        car_slug: options.carSlug || null,
        run_type: runType,
        target_urls: options.targetUrls || null,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('[ForumScraper] Error creating scrape run:', error);
      throw error;
    }
    
    return data;
  }

  /**
   * Update scrape run status and stats
   * @param {string} runId - Scrape run UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<void>}
   */
  async updateScrapeRun(runId, updates) {
    const client = this.getDbClient();
    
    const { error } = await client
      .from('forum_scrape_runs')
      .update(updates)
      .eq('id', runId);
    
    if (error) {
      console.error('[ForumScraper] Error updating scrape run:', error);
      throw error;
    }
  }

  /**
   * Main scrape entry point
   * @param {string} forumSlug - Forum to scrape
   * @param {Object} options - Scrape options
   * @returns {Promise<Object>} Scrape results
   */
  async scrape(forumSlug, options = {}) {
    // Allow options to override instance dry-run setting
    const isDryRun = options.dryRun !== undefined ? options.dryRun : this.dryRun;
    
    if (isDryRun) {
      console.log(`[ForumScraper][DRY-RUN] Starting dry-run scrape for: ${forumSlug}`);
      this.dryRunResults = []; // Reset dry-run results
    }

    // 1. Get forum source config
    // In dry-run mode, use local config; otherwise fetch from DB
    let forumSource;
    
    if (isDryRun) {
      // Use local config for dry-run (no DB required)
      const localConfig = FORUM_CONFIGS[forumSlug];
      if (!localConfig) {
        throw new Error(`Forum config not found locally: ${forumSlug}`);
      }
      forumSource = {
        id: `local-${forumSlug}`,
        slug: localConfig.slug,
        name: localConfig.name,
        base_url: localConfig.baseUrl,
        car_brands: localConfig.carBrands,
        car_slugs: localConfig.carSlugs,
        is_active: localConfig.priority > 0,
        priority: localConfig.priority,
        platform: localConfig.platformType,
        scrape_config: localConfig.scrapeConfig,
      };
      console.log(`[ForumScraper][DRY-RUN] Using local config for: ${forumSlug}`);
    } else {
      const client = this.getDbClient();
      const { data, error: sourceError } = await client
        .from('forum_sources')
        .select('*')
        .eq('slug', forumSlug)
        .single();

      if (sourceError || !data) {
        throw new Error(`Forum source not found in DB: ${forumSlug}`);
      }
      
      // Merge DB config with local config (local has detailed selectors/subforums)
      const localConfig = FORUM_CONFIGS[forumSlug];
      if (localConfig) {
        // Also prefer local identity/baseUrl when present (DB seeding may be minimal/incomplete)
        data.name = localConfig.name || data.name;
        data.base_url = localConfig.baseUrl || data.base_url;

        // Deep merge scrape_config: DB settings override local, but keep local selectors/subforums
        data.scrape_config = {
          ...localConfig.scrapeConfig,
          ...data.scrape_config,
          // Ensure these come from local config (detailed selectors)
          subforums: localConfig.scrapeConfig?.subforums || data.scrape_config?.subforums,
          threadListSelectors: localConfig.scrapeConfig?.threadListSelectors || data.scrape_config?.threadListSelectors,
          threadContentSelectors: localConfig.scrapeConfig?.threadContentSelectors || data.scrape_config?.threadContentSelectors,
          threadFilters: localConfig.scrapeConfig?.threadFilters || data.scrape_config?.threadFilters,
          pagination: localConfig.scrapeConfig?.pagination || data.scrape_config?.pagination,
        };
        console.log(`[ForumScraper] Merged local config for detailed selectors: ${forumSlug}`);
      }
      
      forumSource = data;
    }

    if (!forumSource.is_active) {
      throw new Error(`Forum source is not active: ${forumSlug}`);
    }

    // 2. Get adapter (forum-specific or platform-based)
    // Platform can be in forumSource.platform (local config) or forumSource.scrape_config.platformType (DB)
    const platform = forumSource.platform || forumSource.scrape_config?.platformType;
    
    let adapter = this.adapters.get(forumSlug);
    if (!adapter) {
      // Fall back to platform adapter
      adapter = this.platformAdapters.get(platform);
    }
    if (!adapter) {
      throw new Error(`No adapter registered for: ${forumSlug} (platform: ${platform})`);
    }

    // 3. Create scrape run (skip in dry-run mode)
    let scrapeRun;
    if (isDryRun) {
      scrapeRun = {
        id: `dry-run-${Date.now()}`,
        forum_source_id: forumSource.id,
        run_type: options.targetUrls ? 'targeted' : 'discovery',
        status: 'dry_run',
        _dry_run: true
      };
      console.log(`[ForumScraper][DRY-RUN] Mock scrape run created: ${scrapeRun.id}`);
    } else {
      const runType = options.targetUrls ? 'targeted' : 'discovery';
      scrapeRun = await this.createScrapeRun(forumSource.id, runType, options);
      console.log(`[ForumScraper] Starting ${runType} scrape for ${forumSlug} (run: ${scrapeRun.id})`);
    }

    try {
      // 4. Update run status (skip in dry-run mode)
      if (!isDryRun) {
        await this.updateScrapeRun(scrapeRun.id, { 
          status: 'running',
          started_at: new Date().toISOString()
        });
      }

      // 5. Execute scrape via adapter
      const results = await adapter.scrape(forumSource, scrapeRun, { ...options, dryRun: isDryRun });

      // 6. Update run with results (skip in dry-run mode)
      if (!isDryRun) {
        await this.updateScrapeRun(scrapeRun.id, {
          status: 'completed',
          completed_at: new Date().toISOString(),
          threads_found: results.threadsFound || 0,
          threads_scraped: results.threadsScraped || 0,
          posts_scraped: results.postsScraped || 0
        });

        // 7. Update forum source stats
        const dbClient = this.getDbClient();
        await dbClient
          .from('forum_sources')
          .update({
            last_scraped_at: new Date().toISOString(),
            total_threads_scraped: forumSource.total_threads_scraped + (results.threadsScraped || 0)
          })
          .eq('id', forumSource.id);
      }

      const modeLabel = isDryRun ? '[DRY-RUN] ' : '';
      console.log(`[ForumScraper]${modeLabel} Completed scrape for ${forumSlug}: ${results.threadsScraped} threads, ${results.postsScraped} posts`);

      // In dry-run mode, include the would-be-saved threads
      if (isDryRun) {
        return { 
          scrapeRun, 
          results,
          dryRunResults: this.dryRunResults
        };
      }

      return { scrapeRun, results };

    } catch (error) {
      console.error(`[ForumScraper] Scrape failed for ${forumSlug}:`, error);
      
      if (!isDryRun) {
        await this.updateScrapeRun(scrapeRun.id, {
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error.message,
          error_details: { stack: error.stack }
        });
      }
      
      throw error;
    }
  }

  /**
   * Save scraped thread to database
   * @param {string} scrapeRunId - Scrape run UUID
   * @param {string} forumSourceId - Forum source UUID
   * @param {Object} threadData - Thread data to save
   * @returns {Promise<Object|null>} Saved thread or null if duplicate
   */
  async saveScrapedThread(scrapeRunId, forumSourceId, threadData) {
    // In dry-run mode, just log and store in memory
    if (this.dryRun) {
      const dryRunEntry = {
        id: `dry-run-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        forum_source_id: forumSourceId,
        scrape_run_id: scrapeRunId,
        thread_url: threadData.url,
        thread_title: threadData.title,
        subforum: threadData.subforum || null,
        reply_count: threadData.replyCount || 0,
        view_count: threadData.viewCount || null,
        relevance_score: threadData.relevanceScore || 0,
        car_slugs_detected: threadData.carSlugsDetected || [],
        posts_count: threadData.posts?.length || 0,
        _dry_run: true
      };
      this.dryRunResults.push(dryRunEntry);
      console.log(`[ForumScraper][DRY-RUN] Would save thread: "${threadData.title?.substring(0, 50)}..."`);
      return dryRunEntry;
    }

    const client = this.getDbClient();
    
    const { data, error } = await client
      .from('forum_scraped_threads')
      .upsert({
        forum_source_id: forumSourceId,
        scrape_run_id: scrapeRunId,
        thread_url: threadData.url,
        thread_title: threadData.title,
        subforum: threadData.subforum || null,
        original_post_date: threadData.originalPostDate || null,
        last_reply_date: threadData.lastReplyDate || null,
        reply_count: threadData.replyCount || 0,
        view_count: threadData.viewCount || null,
        posts: threadData.posts,
        relevance_score: threadData.relevanceScore || 0,
        car_slugs_detected: threadData.carSlugsDetected || [],
        processing_status: 'pending'
      }, {
        onConflict: 'thread_url',
        ignoreDuplicates: false  // Update existing if newer
      })
      .select()
      .single();

    if (error) {
      // Ignore unique constraint violations (duplicate threads)
      if (error.code === '23505') {
        console.log(`[ForumScraper] Skipping duplicate thread: ${threadData.url}`);
        return null;
      }
      console.error('[ForumScraper] Error saving thread:', error);
      throw error;
    }
    
    return data;
  }

  /**
   * Get pending threads for AI processing
   * @param {number} limit - Max threads to return
   * @returns {Promise<Array>} Pending threads
   */
  async getPendingThreads(limit = 10) {
    const client = this.getDbClient();
    
    const { data, error } = await client
      .from('forum_scraped_threads')
      .select(`
        *,
        forum_source:forum_sources(slug, name, car_slugs)
      `)
      .eq('processing_status', 'pending')
      .order('relevance_score', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[ForumScraper] Error fetching pending threads:', error);
      throw error;
    }
    
    return data || [];
  }

  /**
   * Update thread processing status
   * @param {string} threadId - Thread UUID
   * @param {string} status - New status
   * @returns {Promise<void>}
   */
  async updateThreadStatus(threadId, status) {
    const client = this.getDbClient();
    
    const { error } = await client
      .from('forum_scraped_threads')
      .update({
        processing_status: status,
        processed_at: new Date().toISOString()
      })
      .eq('id', threadId);

    if (error) {
      console.error('[ForumScraper] Error updating thread status:', error);
      throw error;
    }
  }

  /**
   * Get forum scraping statistics
   * @returns {Promise<Object>} Stats object
   */
  async getStats() {
    const client = this.getDbClient();
    
    const [forumStats, threadStats, runStats] = await Promise.all([
      // Forum source stats
      client
        .from('forum_sources')
        .select('slug, name, is_active, priority, total_threads_scraped, total_insights_extracted, last_scraped_at'),
      
      // Thread processing stats
      client
        .from('forum_scraped_threads')
        .select('processing_status'),
      
      // Recent run stats
      client
        .from('forum_scrape_runs')
        .select('status, threads_scraped, posts_scraped, insights_extracted')
        .order('created_at', { ascending: false })
        .limit(100)
    ]);

    // Aggregate thread stats
    const threadsByStatus = {};
    for (const t of threadStats.data || []) {
      threadsByStatus[t.processing_status] = (threadsByStatus[t.processing_status] || 0) + 1;
    }

    // Aggregate run stats
    const runsByStatus = {};
    let totalThreadsScraped = 0;
    let totalPostsScraped = 0;
    for (const r of runStats.data || []) {
      runsByStatus[r.status] = (runsByStatus[r.status] || 0) + 1;
      totalThreadsScraped += r.threads_scraped || 0;
      totalPostsScraped += r.posts_scraped || 0;
    }

    return {
      forums: forumStats.data || [],
      threads: {
        byStatus: threadsByStatus,
        total: threadStats.data?.length || 0
      },
      runs: {
        byStatus: runsByStatus,
        totalThreadsScraped,
        totalPostsScraped,
        recentCount: runStats.data?.length || 0
      }
    };
  }
}

// Export singleton instance
export const forumScraperService = new ForumScraperService();

export default ForumScraperService;

