#!/usr/bin/env node
/**
 * Apify Scraping Script
 * 
 * Run Apify scrapers for BaT and Reddit data collection.
 * 
 * Usage:
 *   node scripts/run-apify-scrape.mjs --reddit --car="bmw-m3-g80" --name="BMW M3 G80"
 *   node scripts/run-apify-scrape.mjs --bat --query="Porsche 911 GT3"
 *   node scripts/run-apify-scrape.mjs --reddit --batch --limit=10
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { 
  isApifyConfigured, 
  scrapeBringATrailer, 
  scrapeReddit 
} from '../lib/apifyClient.js';
import { 
  scrapeAndSaveRedditInsights, 
  batchScrapeRedditInsights,
  getCarsNeedingRedditInsights 
} from '../lib/redditInsightService.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Parse command line arguments
const args = process.argv.slice(2);
const flags = {};

args.forEach(arg => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=');
    flags[key] = value === undefined ? true : value;
  }
});

async function main() {
  console.log('='.repeat(60));
  console.log('AutoRev Apify Scraper');
  console.log('='.repeat(60));
  
  // Check configuration
  if (!isApifyConfigured()) {
    console.error('\nError: APIFY_API_TOKEN environment variable is not set.');
    console.log('\nTo set up Apify:');
    console.log('1. Sign up at https://apify.com');
    console.log('2. Go to Settings > Integrations > API Tokens');
    console.log('3. Copy your API token');
    console.log('4. Add to .env.local: APIFY_API_TOKEN=your_token_here');
    process.exit(1);
  }
  
  console.log('✓ Apify configured\n');
  
  // Reddit scraping
  if (flags.reddit) {
    if (flags.batch) {
      // Batch mode: scrape cars needing insights
      const limit = parseInt(flags.limit) || 10;
      console.log(`\nBatch Reddit scraping for up to ${limit} cars...\n`);
      
      const cars = await getCarsNeedingRedditInsights(limit);
      console.log(`Found ${cars.length} cars needing Reddit insights:\n`);
      cars.forEach(c => console.log(`  - ${c.name} (${c.slug})`));
      
      if (cars.length === 0) {
        console.log('\nNo cars need Reddit insights at this time.');
        return;
      }
      
      const results = await batchScrapeRedditInsights(cars);
      
      console.log('\n' + '='.repeat(60));
      console.log('BATCH RESULTS');
      console.log('='.repeat(60));
      results.forEach(r => {
        console.log(`${r.name}: ${r.insightsSaved || 0} insights saved`);
      });
      
    } else if (flags.car && flags.name) {
      // Single car mode
      console.log(`\nScraping Reddit for: ${flags.name} (${flags.car})\n`);
      
      const result = await scrapeAndSaveRedditInsights(flags.car, flags.name);
      
      console.log('\n' + '='.repeat(60));
      console.log('RESULT');
      console.log('='.repeat(60));
      console.log(`Posts found: ${result.postsFound || 0}`);
      console.log(`Quality posts: ${result.qualityPosts || 0}`);
      console.log(`Insights saved: ${result.insightsSaved || 0}`);
      
    } else if (flags.subreddit) {
      // Raw subreddit scrape (for testing)
      console.log(`\nScraping subreddit: r/${flags.subreddit}\n`);
      
      const posts = await scrapeReddit(flags.subreddit, {
        maxPosts: parseInt(flags.limit) || 50,
        sort: flags.sort || 'hot',
      });
      
      if (posts) {
        console.log(`Retrieved ${posts.length} posts\n`);
        posts.slice(0, 5).forEach(post => {
          console.log(`- [${post.score}] ${post.title.substring(0, 60)}...`);
        });
      }
      
    } else {
      console.log('\nReddit usage:');
      console.log('  --reddit --car=<slug> --name="<Car Name>"  Scrape for specific car');
      console.log('  --reddit --batch --limit=10                Batch scrape cars needing insights');
      console.log('  --reddit --subreddit=cars --limit=50       Raw subreddit scrape');
    }
  }
  
  // Bring a Trailer scraping
  else if (flags.bat) {
    if (flags.query) {
      console.log(`\nSearching BaT for: "${flags.query}"\n`);
      
      const auctions = await scrapeBringATrailer(flags.query, {
        maxItems: parseInt(flags.limit) || 30,
      });
      
      if (auctions) {
        console.log(`Retrieved ${auctions.length} auctions\n`);
        
        const sold = auctions.filter(a => a.sold);
        const prices = sold.map(a => a.soldPrice).filter(Boolean);
        
        if (prices.length > 0) {
          const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
          const min = Math.min(...prices);
          const max = Math.max(...prices);
          
          console.log('Market Summary:');
          console.log(`  Sold: ${sold.length}/${auctions.length}`);
          console.log(`  Avg Price: $${avg.toLocaleString()}`);
          console.log(`  Range: $${min.toLocaleString()} - $${max.toLocaleString()}`);
          console.log('\nRecent Sales:');
          
          sold.slice(0, 5).forEach(auction => {
            console.log(`  $${auction.soldPrice?.toLocaleString() || '?'} - ${auction.title}`);
          });
        }
      } else {
        console.log('No results or error occurred');
      }
      
    } else if (flags.car) {
      // Lookup market data for a car in our database
      const { data: car } = await supabase
        .from('cars')
        .select('slug, name, years')
        .eq('slug', flags.car)
        .single();
      
      if (!car) {
        console.error(`Car not found: ${flags.car}`);
        process.exit(1);
      }
      
      console.log(`\nLooking up market data for: ${car.name}\n`);
      
      // Build search query
      let query = car.name
        .replace(/\([^)]+\)/g, '') // Remove parenthetical
        .replace(/E\d{2}|F\d{2}|G\d{2}/g, '') // Remove BMW codes
        .trim();
      
      const auctions = await scrapeBringATrailer(query, { maxItems: 50 });
      
      if (auctions && auctions.length > 0) {
        const sold = auctions.filter(a => a.sold);
        const prices = sold.map(a => a.soldPrice).filter(Boolean).sort((a, b) => a - b);
        
        if (prices.length > 0) {
          const marketData = {
            car_slug: car.slug,
            source: 'bat',
            sample_size: sold.length,
            bat_avg_price: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
            bat_median_price: prices[Math.floor(prices.length / 2)],
            bat_min_price: prices[0],
            bat_max_price: prices[prices.length - 1],
            sell_through_rate: Math.round((sold.length / auctions.length) * 100),
            updated_at: new Date().toISOString(),
          };
          
          console.log('Market Data:');
          console.log(JSON.stringify(marketData, null, 2));
          
          if (flags.save) {
            // Upsert to car_market_pricing
            const { error } = await supabase
              .from('car_market_pricing')
              .upsert(marketData, { onConflict: 'car_slug' });
            
            if (error) {
              console.error('Error saving:', error);
            } else {
              console.log('\n✓ Saved to car_market_pricing');
            }
          }
        }
      }
      
    } else {
      console.log('\nBaT usage:');
      console.log('  --bat --query="Porsche 911 GT3"   Search auctions');
      console.log('  --bat --car=<slug>                Lookup car from database');
      console.log('  --bat --car=<slug> --save         Lookup and save to database');
    }
  }
  
  // Help
  else {
    console.log('Usage:');
    console.log('');
    console.log('Reddit scraping:');
    console.log('  node scripts/run-apify-scrape.mjs --reddit --car=bmw-m3-g80 --name="BMW M3"');
    console.log('  node scripts/run-apify-scrape.mjs --reddit --batch --limit=10');
    console.log('  node scripts/run-apify-scrape.mjs --reddit --subreddit=cars');
    console.log('');
    console.log('BaT scraping:');
    console.log('  node scripts/run-apify-scrape.mjs --bat --query="Porsche 911 GT3"');
    console.log('  node scripts/run-apify-scrape.mjs --bat --car=porsche-911-gt3-992');
    console.log('  node scripts/run-apify-scrape.mjs --bat --car=porsche-911-gt3-992 --save');
    console.log('');
    console.log('Environment:');
    console.log('  APIFY_API_TOKEN - Required for all operations');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
