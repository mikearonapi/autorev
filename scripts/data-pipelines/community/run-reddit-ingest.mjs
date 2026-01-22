#!/usr/bin/env node
/**
 * Community Pipeline - Reddit Insight Ingestion
 * 
 * Unified entry point for Reddit community insights via Apify.
 * 
 * Usage:
 *   node scripts/data-pipelines/community/run-reddit-ingest.mjs                # All cars missing insights
 *   node scripts/data-pipelines/community/run-reddit-ingest.mjs --limit=50     # First 50 cars
 *   node scripts/data-pipelines/community/run-reddit-ingest.mjs --car=bmw-m3   # Single car
 *   node scripts/data-pipelines/community/run-reddit-ingest.mjs --dry-run      # Preview only
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const args = process.argv.slice(2);
const flags = {
  limit: parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1]) || null,
  car: args.find(a => a.startsWith('--car='))?.split('=')[1] || null,
  dryRun: args.includes('--dry-run'),
  help: args.includes('--help') || args.includes('-h'),
};

if (flags.help) {
  console.log(`
Community Pipeline - Reddit Insight Ingestion

Usage:
  node scripts/data-pipelines/community/run-reddit-ingest.mjs [options]

Options:
  --limit=N      Process only N cars
  --car=SLUG     Process single car by slug
  --dry-run      Preview without saving to database
  --help, -h     Show this help
  `);
  process.exit(0);
}

async function getCarsNeedingInsights(limit = null) {
  // Get cars without community insights
  const { data: carsWithInsights } = await supabase
    .from('community_insights')
    .select('car_id')
    .not('car_id', 'is', null);
  
  const hasInsights = new Set(carsWithInsights?.map(r => r.car_id) || []);
  
  const { data: allCars } = await supabase
    .from('cars')
    .select('id, slug, name')
    .order('name');
  
  let needsInsights = allCars.filter(c => !hasInsights.has(c.id));
  
  if (limit) {
    needsInsights = needsInsights.slice(0, limit);
  }
  
  return needsInsights;
}

async function main() {
  console.log('🔍 Reddit Community Insights Pipeline\n');
  
  if (!process.env.APIFY_API_TOKEN) {
    console.error('❌ APIFY_API_TOKEN not set in .env.local');
    process.exit(1);
  }
  
  let cars = [];
  
  if (flags.car) {
    const { data: car } = await supabase
      .from('cars')
      .select('id, slug, name')
      .eq('slug', flags.car)
      .single();
    
    if (!car) {
      console.error(`❌ Car not found: ${flags.car}`);
      process.exit(1);
    }
    cars = [car];
  } else {
    cars = await getCarsNeedingInsights(flags.limit);
    console.log(`Found ${cars.length} cars needing Reddit insights`);
  }
  
  if (cars.length === 0) {
    console.log('✅ All cars already have community insights!');
    return;
  }
  
  console.log('\nCars to process:');
  for (const car of cars.slice(0, 20)) {
    console.log(`  - ${car.name} (${car.slug})`);
  }
  if (cars.length > 20) {
    console.log(`  ... and ${cars.length - 20} more`);
  }
  
  if (flags.dryRun) {
    console.log('\n⚠️  DRY RUN MODE - Would process above cars');
    console.log('\nTo actually run, remove --dry-run flag');
    return;
  }
  
  // Note: Actual Reddit ingestion requires running the Apify actor
  // This script prepares the list and would call redditInsightService
  console.log('\n📋 Priority list prepared. Run Apify backfill with:');
  console.log('node scripts/apify/backfill-reddit-insights.mjs');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
