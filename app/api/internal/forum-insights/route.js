/**
 * Internal API: Forum Insights Management
 * 
 * Endpoints for monitoring and managing the Forum Intelligence system.
 * 
 * GET  /api/internal/forum-insights - Get stats and recent activity
 * POST /api/internal/forum-insights - Trigger manual operations
 * 
 * Auth:
 *   - Authorization: Bearer <CRON_SECRET>
 *   - (No public access)
 * 
 * @module app/api/internal/forum-insights/route
 */

import { NextResponse } from 'next/server';
import { ForumScraperService } from '@/lib/forumScraper/index.js';
import { InsightExtractor } from '@/lib/forumScraper/insightExtractor.js';
import { supabaseServiceRole } from '@/lib/supabase.js';

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Check if request is authorized
 */
function isAuthorized(request) {
  const authHeader = request.headers.get('authorization');
  return CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`;
}

/**
 * GET handler - Retrieve forum intelligence stats
 */
export async function GET(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const scraperService = new ForumScraperService();
    const stats = await scraperService.getStats();

    // Get recent scrape runs
    const { data: recentRuns } = await supabaseServiceRole
      .from('forum_scrape_runs')
      .select('id, status, threads_found, threads_scraped, posts_scraped, insights_extracted, created_at, completed_at, forum_sources(slug, name)')
      .order('created_at', { ascending: false })
      .limit(10);

    // Get insight type distribution
    const { data: insightTypes } = await supabaseServiceRole
      .from('community_insights')
      .select('insight_type')
      .eq('is_active', true);

    const typeDistribution = {};
    for (const insight of insightTypes || []) {
      typeDistribution[insight.insight_type] = (typeDistribution[insight.insight_type] || 0) + 1;
    }

    // Get top cars with insights
    const { data: topCars } = await supabaseServiceRole
      .from('community_insights')
      .select('car_slug')
      .eq('is_active', true);

    const carDistribution = {};
    for (const insight of topCars || []) {
      carDistribution[insight.car_slug] = (carDistribution[insight.car_slug] || 0) + 1;
    }

    // Sort and limit to top 10 cars
    const sortedCars = Object.entries(carDistribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});

    return NextResponse.json({
      overview: {
        forumSources: stats.forums.length,
        activeSources: stats.forums.filter(f => f.is_active).length,
        totalThreadsScraped: stats.threads?.total || 0,
        pendingThreads: stats.threads?.byStatus?.pending || 0,
        totalInsights: insightTypes?.length || 0
      },
      forums: stats.forums,
      recentRuns: recentRuns || [],
      insightTypes: typeDistribution,
      topCarsWithInsights: sortedCars
    });

  } catch (error) {
    console.error('[ForumInsights] GET error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch stats', 
      message: error.message 
    }, { status: 500 });
  }
}

/**
 * POST handler - Trigger manual operations
 * 
 * Body:
 *   - action: 'scrape' | 'extract' | 'reprocess' | 'stats' | 'dry-run'
 *   - forum: Forum slug (for scrape action)
 *   - forumList: Array of forum slugs (for batch scrape)
 *   - maxThreads: Number of threads (for scrape action)
 *   - maxExtract: Number of threads to extract (for extract action)
 *   - threadId: Specific thread ID (for reprocess action)
 *   - dryRun: Boolean to enable dry-run mode
 */
export async function POST(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { 
      action, 
      forum, 
      forumList, 
      maxThreads = 10, 
      maxExtract = 5, 
      threadId,
      dryRun = false 
    } = body;

    const scraperService = new ForumScraperService({ dryRun });
    const insightExtractor = new InsightExtractor();

    switch (action) {
      case 'scrape': {
        // Support both single forum and forum list
        const forumsToScrape = forumList || (forum ? [forum] : null);
        
        if (!forumsToScrape || forumsToScrape.length === 0) {
          return NextResponse.json({ 
            error: 'forum or forumList parameter required' 
          }, { status: 400 });
        }
        
        console.log(`[ForumInsights] Manual scrape triggered for: ${forumsToScrape.join(', ')} ${dryRun ? '(DRY-RUN)' : ''}`);
        
        const results = [];
        const errors = [];
        
        for (const forumSlug of forumsToScrape) {
          try {
            const result = await scraperService.scrape(forumSlug, { maxThreads, dryRun });
            results.push({
              forum: forumSlug,
              success: true,
              threadsFound: result.results?.threadsFound || 0,
              threadsScraped: result.results?.threadsScraped || 0,
              postsScraped: result.results?.postsScraped || 0,
              dryRunResults: dryRun ? result.dryRunResults : undefined
            });
          } catch (err) {
            console.error(`[ForumInsights] Error scraping ${forumSlug}:`, err.message);
            errors.push({
              forum: forumSlug,
              success: false,
              error: err.message
            });
          }
        }
        
        return NextResponse.json({
          action: 'scrape',
          dryRun,
          forums: forumsToScrape,
          results,
          errors,
          summary: {
            total: forumsToScrape.length,
            successful: results.length,
            failed: errors.length,
            totalThreadsScraped: results.reduce((sum, r) => sum + (r.threadsScraped || 0), 0),
            totalPostsScraped: results.reduce((sum, r) => sum + (r.postsScraped || 0), 0)
          }
        });
      }

      case 'extract': {
        console.log(`[ForumInsights] Manual extraction triggered (max: ${maxExtract})`);
        const pendingThreads = await scraperService.getPendingThreads(maxExtract);
        
        if (pendingThreads.length === 0) {
          return NextResponse.json({
            action: 'extract',
            message: 'No pending threads to process',
            pendingCount: 0
          });
        }

        const result = await insightExtractor.processBatch(pendingThreads);
        
        return NextResponse.json({
          action: 'extract',
          threadsProcessed: result.processed,
          insightsExtracted: result.insights,
          errors: result.errors,
          tokenUsage: result.tokenUsage,
          costEstimate: `$${result.costEstimate?.toFixed(4) || '0.0000'}`
        });
      }

      case 'reprocess': {
        if (!threadId) {
          return NextResponse.json({ error: 'threadId parameter required' }, { status: 400 });
        }

        console.log(`[ForumInsights] Reprocessing thread: ${threadId}`);
        
        // Get the thread
        const { data: thread, error } = await supabaseServiceRole
          .from('forum_scraped_threads')
          .select('*, forum_source:forum_sources(slug, name, car_slugs)')
          .eq('id', threadId)
          .single();

        if (error || !thread) {
          return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
        }

        // Reset status and reprocess
        await supabaseServiceRole
          .from('forum_scraped_threads')
          .update({ processing_status: 'pending', processed_at: null })
          .eq('id', threadId);

        const result = await insightExtractor.processBatch([thread]);
        
        return NextResponse.json({
          action: 'reprocess',
          threadId,
          insightsExtracted: result.insights,
          tokenUsage: result.tokenUsage,
          costEstimate: `$${result.costEstimate?.toFixed(4) || '0.0000'}`
        });
      }

      case 'dry-run': {
        // Alias for scrape with dryRun=true
        const testForum = forum || (forumList?.[0]) || 'rennlist';
        console.log(`[ForumInsights] Dry-run test for: ${testForum}`);
        
        const result = await scraperService.scrape(testForum, { 
          maxThreads: maxThreads || 5, 
          dryRun: true 
        });
        
        return NextResponse.json({
          action: 'dry-run',
          forum: testForum,
          threadsFound: result.results?.threadsFound || 0,
          threadsScraped: result.results?.threadsScraped || 0,
          wouldSave: result.dryRunResults?.length || 0,
          samples: result.dryRunResults?.slice(0, 3).map(t => ({
            title: t.thread_title?.substring(0, 60) + '...',
            url: t.thread_url,
            relevance: t.relevance_score,
            carSlugs: t.car_slugs_detected,
            posts: t.posts_count
          }))
        });
      }

      case 'stats': {
        const stats = await scraperService.getStats();
        return NextResponse.json({
          action: 'stats',
          ...stats
        });
      }

      default:
        return NextResponse.json({ 
          error: 'Invalid action',
          validActions: ['scrape', 'extract', 'reprocess', 'stats', 'dry-run'],
          examples: {
            scrape: { action: 'scrape', forum: 'rennlist', maxThreads: 10 },
            scrapeMultiple: { action: 'scrape', forumList: ['rennlist', 'bimmerpost'], maxThreads: 20 },
            extract: { action: 'extract', maxExtract: 10 },
            dryRun: { action: 'dry-run', forum: 'rennlist', maxThreads: 5 },
            reprocess: { action: 'reprocess', threadId: 'uuid-here' }
          }
        }, { status: 400 });
    }

  } catch (error) {
    console.error('[ForumInsights] POST error:', error);
    return NextResponse.json({ 
      error: 'Operation failed', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// Route segment config for longer execution time
// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config
export const maxDuration = 300; // 5 minutes max

