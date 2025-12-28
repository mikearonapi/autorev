/**
 * Cron: Forum Intelligence Pipeline
 * 
 * GET /api/cron/forum-scrape
 * 
 * Two-phase execution:
 * 1. Scrape forums for new threads (if ?mode=scrape or default)
 * 2. Extract insights from pending threads (if ?mode=extract or default)
 * 
 * Query params:
 *   - mode: 'scrape' | 'extract' | 'both' (default: 'both')
 *   - forum: Forum slug to scrape (default: all active)
 *   - maxThreads: Max threads to scrape per forum (default: 20)
 *   - maxExtract: Max threads to extract insights from (default: 10)
 * 
 * Auth:
 *   - Authorization: Bearer <CRON_SECRET> OR x-vercel-cron: true
 * 
 * @module app/api/cron/forum-scrape/route
 */

import { NextResponse } from 'next/server';
import { ForumScraperService } from '@/lib/forumScraper/index.js';
import { InsightExtractor } from '@/lib/forumScraper/insightExtractor.js';
import { notifyCronEnrichment, notifyCronFailure } from '@/lib/discord';

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Check if request is authorized
 */
function isAuthorized(request) {
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`) return true;
  const vercelCron = request.headers.get('x-vercel-cron');
  return vercelCron === 'true';
}

/**
 * GET handler for forum scrape cron job
 */
export async function GET(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') || 'both';
  const forumSlug = searchParams.get('forum') || null;
  const maxThreads = parseInt(searchParams.get('maxThreads') || '20', 10);
  const maxExtract = parseInt(searchParams.get('maxExtract') || '10', 10);

  const results = {
    mode,
    startedAt: new Date().toISOString(),
    scrape: null,
    extract: null,
    errors: []
  };

  try {
    const scraperService = new ForumScraperService();
    const insightExtractor = new InsightExtractor();

    // Phase 1: Scrape forums
    if (mode === 'scrape' || mode === 'both') {
      console.log('[ForumCron] Starting scrape phase...');
      
      try {
        if (forumSlug) {
          // Scrape specific forum
          const scrapeResult = await scraperService.scrape(forumSlug, { maxThreads });
          results.scrape = {
            forums: [forumSlug],
            ...scrapeResult.results
          };
        } else {
          // Scrape all active forums, prioritizing those not scraped recently
          const forumSources = await scraperService.getStats();
          const activeForums = forumSources.forums.filter(f => f.is_active);
          
          // Sort forums: never scraped first (NULL last_scraped_at), then by oldest scraped
          activeForums.sort((a, b) => {
            // Never scraped forums come first
            if (!a.last_scraped_at && !b.last_scraped_at) return b.priority - a.priority;
            if (!a.last_scraped_at) return -1;
            if (!b.last_scraped_at) return 1;
            // Then by oldest scraped
            return new Date(a.last_scraped_at) - new Date(b.last_scraped_at);
          });
          
          console.log(`[ForumCron] Processing ${activeForums.length} active forums in order:`, 
            activeForums.map(f => `${f.slug}${f.last_scraped_at ? '' : ' (never scraped)'}`).join(', '));
          
          const scrapeResults = {
            forums: [],
            threadsFound: 0,
            threadsScraped: 0,
            postsScraped: 0,
            skipped: []
          };

          // Limit to 4 forums per run to avoid timeout (5 min max)
          const maxForumsPerRun = 4;
          const forumsToProcess = activeForums.slice(0, maxForumsPerRun);
          
          if (activeForums.length > maxForumsPerRun) {
            scrapeResults.skipped = activeForums.slice(maxForumsPerRun).map(f => f.slug);
            console.log(`[ForumCron] Will process ${maxForumsPerRun} forums this run, ${scrapeResults.skipped.length} will be processed next run`);
          }

          for (const forum of forumsToProcess) {
            const forumStartTime = Date.now();
            try {
              console.log(`[ForumCron] Scraping ${forum.slug}...`);
              const scrapeResult = await scraperService.scrape(forum.slug, { 
                maxThreads: Math.ceil(maxThreads / forumsToProcess.length) 
              });
              scrapeResults.forums.push(forum.slug);
              scrapeResults.threadsFound += scrapeResult.results.threadsFound || 0;
              scrapeResults.threadsScraped += scrapeResult.results.threadsScraped || 0;
              scrapeResults.postsScraped += scrapeResult.results.postsScraped || 0;
              
              const duration = ((Date.now() - forumStartTime) / 1000).toFixed(1);
              console.log(`[ForumCron] ✓ ${forum.slug}: ${scrapeResult.results.threadsScraped || 0} threads in ${duration}s`);
            } catch (forumError) {
              const duration = ((Date.now() - forumStartTime) / 1000).toFixed(1);
              console.error(`[ForumCron] ✗ Error scraping ${forum.slug} after ${duration}s:`, forumError.message);
              results.errors.push({
                phase: 'scrape',
                forum: forum.slug,
                error: forumError.message
              });
            }
          }

          results.scrape = scrapeResults;
        }
        
        console.log(`[ForumCron] Scrape complete: ${results.scrape?.threadsScraped || 0} threads`);
        
      } catch (scrapeError) {
        console.error('[ForumCron] Scrape phase error:', scrapeError);
        results.errors.push({
          phase: 'scrape',
          error: scrapeError.message
        });
      }
    }

    // Phase 2: Extract insights from pending threads
    if (mode === 'extract' || mode === 'both') {
      console.log('[ForumCron] Starting extraction phase...');
      
      try {
        // Get pending threads
        const pendingThreads = await scraperService.getPendingThreads(maxExtract);
        
        if (pendingThreads.length > 0) {
          const extractResult = await insightExtractor.processBatch(pendingThreads);
          results.extract = {
            threadsProcessed: extractResult.processed,
            insightsExtracted: extractResult.insights,
            errors: extractResult.errors
          };
          
          console.log(`[ForumCron] Extraction complete: ${extractResult.insights} insights from ${extractResult.processed} threads`);
        } else {
          results.extract = {
            threadsProcessed: 0,
            insightsExtracted: 0,
            errors: 0,
            message: 'No pending threads to process'
          };
          console.log('[ForumCron] No pending threads to extract');
        }
        
      } catch (extractError) {
        console.error('[ForumCron] Extraction phase error:', extractError);
        results.errors.push({
          phase: 'extract',
          error: extractError.message
        });
      }
    }

    results.completedAt = new Date().toISOString();
    results.success = results.errors.length === 0;

    notifyCronEnrichment('Forum Community Insights', {
      duration: Date.now() - startTime,
      table: 'community_insights',
      recordsAdded: results.extract?.insightsExtracted || 0,
      recordsProcessed: results.scrape?.threadsScraped || 0,
      sourcesChecked: results.scrape?.forums?.length || 0,
      errors: results.errors.length,
      details: [
        { label: '📋 Threads Scraped', value: results.scrape?.threadsScraped || 0 },
        { label: '📝 Posts Collected', value: results.scrape?.postsScraped || 0 },
        { label: '💡 Insights Extracted', value: results.extract?.insightsExtracted || 0 },
        { label: '🗂️ Forums Checked', value: results.scrape?.forums?.length || 0 },
      ],
    });

    return NextResponse.json(results);

  } catch (error) {
    console.error('[ForumCron] Fatal error:', error);
    notifyCronFailure('Forum Scrape', error, { phase: 'fatal' });
    return NextResponse.json({
      error: 'Forum scrape cron failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// Route segment config for longer execution time
// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config
export const maxDuration = 300; // 5 minutes max execution

