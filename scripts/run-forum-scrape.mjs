#!/usr/bin/env node
/**
 * Forum Scrape Runner
 * 
 * Scrapes active forums and extracts insights into the database.
 * 
 * Usage:
 *   node scripts/run-forum-scrape.mjs                    # Scrape all active forums
 *   node scripts/run-forum-scrape.mjs --forum=rennlist   # Scrape specific forum
 *   node scripts/run-forum-scrape.mjs --dry-run          # Test without saving
 *   node scripts/run-forum-scrape.mjs --extract-only     # Only extract insights from pending threads
 *   node scripts/run-forum-scrape.mjs --stats            # Show current stats
 * 
 * @module scripts/run-forum-scrape
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { ForumScraperService } from '../lib/forumScraper/index.js';
import { InsightExtractor } from '../lib/forumScraper/insightExtractor.js';

// Create Supabase client directly for script usage (avoids browser client issues)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabaseServiceRole = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Create service instances with injected Supabase client
const scraperService = new ForumScraperService({ supabaseClient: supabaseServiceRole });
const insightExtractor = new InsightExtractor({ supabaseClient: supabaseServiceRole });

// Parse CLI args
const args = process.argv.slice(2);
const forumArg = args.find(a => a.startsWith('--forum='))?.split('=')[1];
const dryRun = args.includes('--dry-run');
const extractOnly = args.includes('--extract-only');
const showStats = args.includes('--stats');
const maxThreads = parseInt(args.find(a => a.startsWith('--max-threads='))?.split('=')[1] || '30');
const maxInsights = parseInt(args.find(a => a.startsWith('--max-insights='))?.split('=')[1] || '20');

/**
 * Display current forum stats
 */
async function displayStats() {
  console.log('\n📊 Forum Scraping Statistics\n');
  console.log('─'.repeat(80));
  
  // Forum sources
  const { data: forums } = await supabaseServiceRole
    .from('forum_sources')
    .select('slug, name, is_active, priority, total_threads_scraped, total_insights_extracted, last_scraped_at')
    .order('priority', { ascending: false });
  
  console.log('\n🏎️  Forum Sources:\n');
  console.log('  Forum            │ Active │ Priority │ Threads │ Insights │ Last Scraped');
  console.log('  ─────────────────┼────────┼──────────┼─────────┼──────────┼─────────────────');
  
  for (const f of forums) {
    const active = f.is_active ? '✅' : '❌';
    const lastScraped = f.last_scraped_at 
      ? new Date(f.last_scraped_at).toLocaleDateString() 
      : 'Never';
    console.log(
      `  ${f.slug.padEnd(16)} │   ${active}   │    ${String(f.priority).padStart(2)}    │  ${String(f.total_threads_scraped).padStart(5)}  │   ${String(f.total_insights_extracted).padStart(5)}  │ ${lastScraped}`
    );
  }
  
  // Thread stats
  const { data: threadStats } = await supabaseServiceRole
    .from('forum_scraped_threads')
    .select('processing_status');
  
  const statusCounts = {};
  for (const t of threadStats || []) {
    statusCounts[t.processing_status] = (statusCounts[t.processing_status] || 0) + 1;
  }
  
  console.log('\n📋 Thread Processing Status:\n');
  for (const [status, count] of Object.entries(statusCounts)) {
    console.log(`  ${status}: ${count}`);
  }
  
  // Insight stats
  const { data: insightStats } = await supabaseServiceRole
    .from('community_insights')
    .select('insight_type');
  
  const typeCounts = {};
  for (const i of insightStats || []) {
    typeCounts[i.insight_type] = (typeCounts[i.insight_type] || 0) + 1;
  }
  
  console.log('\n💡 Insights by Type:\n');
  const sortedTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
  for (const [type, count] of sortedTypes) {
    console.log(`  ${type}: ${count}`);
  }
  
  console.log('\n  Total insights:', insightStats?.length || 0);
  console.log('─'.repeat(80));
}

/**
 * Run forum scraping
 */
async function runScrape() {
  // Use the global instances with injected Supabase client
  
  const results = {
    forumsProcessed: 0,
    threadsScraped: 0,
    insightsExtracted: 0,
    errors: []
  };
  
  // Get forums to scrape
  let forumsToScrape;
  if (forumArg) {
    forumsToScrape = [{ slug: forumArg }];
  } else {
    const { data: activeForums } = await supabaseServiceRole
      .from('forum_sources')
      .select('slug, name, priority, last_scraped_at, total_threads_scraped')
      .eq('is_active', true)
      .order('last_scraped_at', { ascending: true, nullsFirst: true });
    
    // Prioritize never-scraped forums, then by priority
    forumsToScrape = activeForums.sort((a, b) => {
      if (!a.last_scraped_at && b.last_scraped_at) return -1;
      if (a.last_scraped_at && !b.last_scraped_at) return 1;
      return b.priority - a.priority;
    });
  }
  
  console.log(`\n🔍 Will scrape ${forumsToScrape.length} forum(s):`);
  forumsToScrape.forEach(f => console.log(`   - ${f.slug}`));
  
  if (dryRun) {
    console.log('\n⚠️  DRY RUN MODE - No data will be saved\n');
  }
  
  // Phase 1: Scrape forums
  if (!extractOnly) {
    console.log('\n' + '═'.repeat(80));
    console.log('PHASE 1: SCRAPING FORUMS');
    console.log('═'.repeat(80));
    
    for (const forum of forumsToScrape) {
      console.log(`\n📡 Scraping ${forum.slug}...`);
      const startTime = Date.now();
      
      try {
        // Use scrape method directly - it handles saving internally
        // dryRun flag controls whether to save to DB
        const scrapeResult = await scraperService.scrape(forum.slug, {
          maxThreads: maxThreads,
          dryRun: dryRun,  // Pass through the CLI flag
        });
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`   Threads found: ${scrapeResult.results?.threadsFound || 0}`);
        console.log(`   Threads scraped: ${scrapeResult.results?.threadsScraped || 0}`);
        console.log(`   Posts scraped: ${scrapeResult.results?.postsScraped || 0}`);
        console.log(`   Duration: ${duration}s`);
        
        results.threadsScraped += scrapeResult.results?.threadsScraped || 0;
        results.forumsProcessed++;
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        results.errors.push({ forum: forum.slug, error: error.message });
      }
      
      // Small delay between forums
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  
  // Phase 2: Extract insights from pending threads
  console.log('\n' + '═'.repeat(80));
  console.log('PHASE 2: EXTRACTING INSIGHTS');
  console.log('═'.repeat(80));
  
  if (dryRun) {
    console.log('\n⚠️  Skipping insight extraction in dry-run mode\n');
  } else {
    // Get pending threads
    const { data: pendingThreads } = await supabaseServiceRole
      .from('forum_scraped_threads')
      .select(`
        *,
        forum_source:forum_sources(slug, name, car_slugs)
      `)
      .eq('processing_status', 'pending')
      .order('relevance_score', { ascending: false })
      .limit(maxInsights);
    
    console.log(`\n💡 Processing ${pendingThreads?.length || 0} pending threads for insights...\n`);
    
    if (pendingThreads && pendingThreads.length > 0) {
      const extractResult = await insightExtractor.processBatch(pendingThreads);
      
      console.log(`\n   Threads processed: ${extractResult.processed}`);
      console.log(`   Insights extracted: ${extractResult.insights}`);
      console.log(`   Errors: ${extractResult.errors}`);
      console.log(`   Estimated cost: $${extractResult.costEstimate.toFixed(4)}`);
      
      results.insightsExtracted = extractResult.insights;
    }
  }
  
  return results;
}

/**
 * Main entry point
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                    AutoRev Forum Intelligence Pipeline                      ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  
  // Check configuration
  console.log('\n📋 Configuration:');
  console.log(`   FIRECRAWL_API_KEY: ${process.env.FIRECRAWL_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`   EXA_API_KEY: ${process.env.EXA_API_KEY ? '✅ Set' : '⚠️ Not set (uses RSS fallback)'}`);
  console.log(`   ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? '✅ Set' : '❌ Missing (needed for insights)'}`);
  console.log(`   OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ Set' : '⚠️ Not set (embeddings skipped)'}`);
  
  if (!process.env.FIRECRAWL_API_KEY) {
    console.log('\n❌ FIRECRAWL_API_KEY is required. Exiting.\n');
    process.exit(1);
  }
  
  if (showStats) {
    await displayStats();
    process.exit(0);
  }
  
  const startTime = Date.now();
  const results = await runScrape();
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  // Summary
  console.log('\n' + '═'.repeat(80));
  console.log('SUMMARY');
  console.log('═'.repeat(80));
  console.log(`\n   Forums processed: ${results.forumsProcessed}`);
  console.log(`   Threads scraped: ${results.threadsScraped}`);
  console.log(`   Insights extracted: ${results.insightsExtracted}`);
  console.log(`   Errors: ${results.errors.length}`);
  console.log(`   Total duration: ${duration}s`);
  
  if (results.errors.length > 0) {
    console.log('\n   Errors:');
    results.errors.forEach(e => console.log(`     - ${e.forum}: ${e.error}`));
  }
  
  console.log('\n✅ Done!\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
