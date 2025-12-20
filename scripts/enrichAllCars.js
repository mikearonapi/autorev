#!/usr/bin/env node

/**
 * Batch Enrich All Cars
 * 
 * This script creates scrape jobs to enrich all cars in the database.
 * 
 * Usage:
 *   node scripts/enrichAllCars.js [options]
 * 
 * Options:
 *   --type=full_enrich|pricing_only|safety_only|reviews_only|free_apis_only
 *   --priority=1-10 (default: 5)
 *   --hours=N (spread over N hours, default: 48)
 *   --limit=N (max cars to process, default: all)
 *   --dry-run (show what would be done without creating jobs)
 * 
 * Examples:
 *   node scripts/enrichAllCars.js --type=free_apis_only
 *   node scripts/enrichAllCars.js --type=pricing_only --hours=24 --priority=3
 *   node scripts/enrichAllCars.js --dry-run
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Parse arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=');
    acc[key] = value === undefined ? true : value;
  }
  return acc;
}, {});

const JOB_TYPE = args.type || 'full_enrich';
const PRIORITY = parseInt(args.priority) || 5;
const SPREAD_HOURS = parseInt(args.hours) || 48;
const LIMIT = args.limit ? parseInt(args.limit) : null;
const DRY_RUN = args['dry-run'] || false;

// Validate job type
const VALID_JOB_TYPES = ['full_enrich', 'pricing_only', 'safety_only', 'reviews_only', 'free_apis_only', 'refresh_stale'];
if (!VALID_JOB_TYPES.includes(JOB_TYPE)) {
  console.error(`Invalid job type: ${JOB_TYPE}`);
  console.error(`Valid types: ${VALID_JOB_TYPES.join(', ')}`);
  process.exit(1);
}

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Adjust time to off-peak hours
 */
function adjustToOffPeak(date) {
  const hour = date.getHours();
  if (hour >= 0 && hour < 6) return date;
  
  const adjusted = new Date(date);
  adjusted.setHours(Math.floor(Math.random() * 6), Math.floor(Math.random() * 60), 0, 0);
  if (adjusted < new Date()) {
    adjusted.setDate(adjusted.getDate() + 1);
  }
  return adjusted;
}

async function main() {
  console.log('='.repeat(60));
  console.log('AutoRev Batch Car Enrichment');
  console.log('='.repeat(60));
  console.log(`Job Type: ${JOB_TYPE}`);
  console.log(`Priority: ${PRIORITY}`);
  console.log(`Spread Over: ${SPREAD_HOURS} hours`);
  console.log(`Limit: ${LIMIT || 'all'}`);
  console.log(`Dry Run: ${DRY_RUN}`);
  console.log('='.repeat(60));
  
  try {
    // Fetch all cars
    let query = supabase
      .from('cars')
      .select('slug, name')
      .order('name');
    
    if (LIMIT) {
      query = query.limit(LIMIT);
    }
    
    const { data: cars, error: carsError } = await query;
    
    if (carsError) {
      throw carsError;
    }
    
    console.log(`\nFound ${cars.length} cars to process.\n`);
    
    if (DRY_RUN) {
      console.log('DRY RUN - No jobs will be created.\n');
      
      const now = new Date();
      cars.forEach((car, i) => {
        const hoursOffset = (i / cars.length) * SPREAD_HOURS;
        let scheduledFor = new Date(now.getTime() + hoursOffset * 60 * 60 * 1000);
        scheduledFor = adjustToOffPeak(scheduledFor);
        
        console.log(`  ${i + 1}. ${car.name} (${car.slug})`);
        console.log(`     Scheduled: ${scheduledFor.toISOString()}`);
      });
      
      console.log(`\n${cars.length} jobs would be created.`);
      return;
    }
    
    // Create jobs
    const now = new Date();
    const jobs = [];
    
    for (let i = 0; i < cars.length; i++) {
      const car = cars[i];
      
      // Calculate scheduled time
      const hoursOffset = (i / cars.length) * SPREAD_HOURS;
      let scheduledFor = new Date(now.getTime() + hoursOffset * 60 * 60 * 1000);
      scheduledFor = adjustToOffPeak(scheduledFor);
      
      jobs.push({
        car_slug: car.slug,
        job_type: JOB_TYPE,
        priority: PRIORITY,
        status: 'pending',
        scheduled_for: scheduledFor.toISOString(),
      });
      
      // Progress indicator
      if ((i + 1) % 10 === 0 || i === cars.length - 1) {
        process.stdout.write(`\rPreparing jobs... ${i + 1}/${cars.length}`);
      }
    }
    
    console.log('\n');
    
    // Insert jobs in batches
    const BATCH_SIZE = 50;
    let insertedCount = 0;
    
    for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
      const batch = jobs.slice(i, i + BATCH_SIZE);
      
      const { data, error } = await supabase
        .from('scrape_jobs')
        .insert(batch)
        .select();
      
      if (error) {
        console.error(`Error inserting batch ${i / BATCH_SIZE + 1}:`, error);
      } else {
        insertedCount += data.length;
        process.stdout.write(`\rCreating jobs... ${insertedCount}/${jobs.length}`);
      }
    }
    
    console.log(`\n\n✅ Successfully created ${insertedCount} jobs.`);
    
    // Show summary
    const firstJob = adjustToOffPeak(now);
    const lastJob = new Date(firstJob.getTime() + SPREAD_HOURS * 60 * 60 * 1000);
    
    console.log(`\nJobs scheduled from:`);
    console.log(`  First: ${firstJob.toISOString()}`);
    console.log(`  Last:  ${lastJob.toISOString()}`);
    
    console.log(`\nTo process jobs, run:`);
    console.log(`  node scripts/processJobs.js`);
    console.log(`\nOr set up a cron job to call the API:`);
    console.log(`  GET /api/cron/process-scrape-jobs`);
    
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();












