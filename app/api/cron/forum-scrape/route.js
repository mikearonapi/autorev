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
          // Scrape all active forums
          const forumSources = await scraperService.getStats();
          const activeForums = forumSources.forums.filter(f => f.is_active);
          
          const scrapeResults = {
            forums: [],
            threadsFound: 0,
            threadsScraped: 0,
            postsScraped: 0
          };

          for (const forum of activeForums) {
            try {
              const scrapeResult = await scraperService.scrape(forum.slug, { 
                maxThreads: Math.ceil(maxThreads / activeForums.length) 
              });
              scrapeResults.forums.push(forum.slug);
              scrapeResults.threadsFound += scrapeResult.results.threadsFound || 0;
              scrapeResults.threadsScraped += scrapeResult.results.threadsScraped || 0;
              scrapeResults.postsScraped += scrapeResult.results.postsScraped || 0;
            } catch (forumError) {
              console.error(`[ForumCron] Error scraping ${forum.slug}:`, forumError.message);
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

    return NextResponse.json(results);

  } catch (error) {
    console.error('[ForumCron] Fatal error:', error);
    return NextResponse.json({
      error: 'Forum scrape cron failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// Vercel cron configuration
export const config = {
  maxDuration: 300 // 5 minutes max execution
};

