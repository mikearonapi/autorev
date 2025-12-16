#!/usr/bin/env node

/**
 * Process Scrape Jobs
 * 
 * Processes pending scrape jobs from the queue.
 * 
 * Usage:
 *   node scripts/processJobs.js [options]
 * 
 * Options:
 *   --max=N (max jobs to process, default: 5)
 *   --delay=N (seconds between jobs, default: 30)
 *   --continuous (keep running and process new jobs)
 *   --interval=N (minutes between checks in continuous mode, default: 5)
 * 
 * Examples:
 *   node scripts/processJobs.js --max=10
 *   node scripts/processJobs.js --continuous --interval=10
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment
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

const MAX_JOBS = parseInt(args.max) || 5;
const DELAY_SECONDS = parseInt(args.delay) || 30;
const CONTINUOUS = args.continuous || false;
const CHECK_INTERVAL = (parseInt(args.interval) || 5) * 60 * 1000;

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Dynamically import the services
let dataAggregator;
let enrichedDataService;

async function loadServices() {
  // We need to handle dynamic imports for ES modules
  try {
    dataAggregator = await import('../lib/dataAggregator.js');
    enrichedDataService = await import('../lib/enrichedDataService.js');
  } catch (err) {
    console.error('Error loading services:', err.message);
    console.error('Make sure you have built the project or are running from the correct directory.');
    process.exit(1);
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getPendingJobs(limit) {
  const now = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('scrape_jobs')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', now)
    .order('priority', { ascending: true })
    .order('scheduled_for', { ascending: true })
    .limit(limit);
  
  if (error) throw error;
  return data || [];
}

async function updateJob(jobId, updates) {
  await supabase
    .from('scrape_jobs')
    .update(updates)
    .eq('id', jobId);
}

function getSourcesToFetch(jobType) {
  switch (jobType) {
    case 'free_apis_only':
      return ['epa', 'nhtsa'];
    case 'pricing_only':
      return ['bat', 'hagerty', 'carscom'];
    case 'safety_only':
      return ['nhtsa', 'iihs'];
    case 'reviews_only':
      return ['cad', 'motortrend'];
    default:
      return null;
  }
}

async function executeJob(job) {
  const { id, car_slug: carSlug, job_type: jobType, attempt_count: attemptCount } = job;
  
  console.log(`\n[Job ${id.slice(0, 8)}] Processing ${carSlug} (${jobType})`);
  
  // Mark as running
  await updateJob(id, {
    status: 'running',
    started_at: new Date().toISOString(),
    attempt_count: (attemptCount || 0) + 1,
  });
  
  try {
    // Get car
    const { data: car, error: carError } = await supabase
      .from('cars')
      .select('*')
      .eq('slug', carSlug)
      .single();
    
    if (carError || !car) {
      throw new Error(`Car not found: ${carSlug}`);
    }
    
    // Aggregate data
    const sources = getSourcesToFetch(jobType);
    console.log(`  Fetching: ${sources ? sources.join(', ') : 'all sources'}`);
    
    const result = await dataAggregator.aggregateCarData(car, { sources });
    
    console.log(`  Sources succeeded: ${result.metadata.sources.join(', ') || 'none'}`);
    
    // Persist results
    if (result.fuelEconomy) {
      await enrichedDataService.saveFuelEconomy(carSlug, result.fuelEconomy);
    }
    
    if (result.safety?.nhtsa || result.safety?.iihs) {
      await enrichedDataService.saveSafetyData(carSlug, {
        nhtsa: result.safety.nhtsa,
        iihs: result.safety.iihs,
        summary: result.summary?.safety,
      });
    }
    
    if (result.pricing?.bringATrailer || result.pricing?.hagerty || result.pricing?.carsCom) {
      await enrichedDataService.saveMarketPricing(carSlug, {
        bringATrailer: result.pricing.bringATrailer,
        hagerty: result.pricing.hagerty,
        carsCom: result.pricing.carsCom,
        consensus: result.summary?.pricing,
      });
    }
    
    if (result.reviews?.carAndDriver?.primaryReview) {
      await enrichedDataService.saveExpertReview(carSlug, result.reviews.carAndDriver.primaryReview);
    }
    
    if (result.reviews?.motorTrend?.primaryReview) {
      await enrichedDataService.saveExpertReview(carSlug, result.reviews.motorTrend.primaryReview);
    }
    
    // Mark completed
    await updateJob(id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      sources_attempted: result.metadata.sources,
      sources_succeeded: result.metadata.sources,
    });
    
    console.log(`  ✅ Completed`);
    return true;
    
  } catch (err) {
    console.log(`  ❌ Error: ${err.message}`);
    
    const maxAttempts = job.max_attempts || 3;
    const currentAttempt = (attemptCount || 0) + 1;
    
    if (currentAttempt < maxAttempts) {
      const retryDelay = Math.pow(2, currentAttempt) * 60 * 1000;
      const nextRetry = new Date(Date.now() + retryDelay);
      
      await updateJob(id, {
        status: 'pending',
        scheduled_for: nextRetry.toISOString(),
        error_message: err.message,
      });
      
      console.log(`  Retry scheduled for ${nextRetry.toISOString()}`);
    } else {
      await updateJob(id, {
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: `Max retries exceeded: ${err.message}`,
      });
    }
    
    return false;
  }
}

async function processJobs() {
  console.log('='.repeat(60));
  console.log('Processing Scrape Jobs');
  console.log('='.repeat(60));
  console.log(`Max Jobs: ${MAX_JOBS}`);
  console.log(`Delay: ${DELAY_SECONDS}s between jobs`);
  console.log('='.repeat(60));
  
  const jobs = await getPendingJobs(MAX_JOBS);
  
  if (jobs.length === 0) {
    console.log('\nNo pending jobs found.');
    return { processed: 0, succeeded: 0, failed: 0 };
  }
  
  console.log(`\nFound ${jobs.length} pending jobs.\n`);
  
  let succeeded = 0;
  let failed = 0;
  
  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    
    const result = await executeJob(job);
    if (result) {
      succeeded++;
    } else {
      failed++;
    }
    
    // Delay between jobs
    if (i < jobs.length - 1) {
      console.log(`\nWaiting ${DELAY_SECONDS}s before next job...`);
      await sleep(DELAY_SECONDS * 1000);
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Summary: ${succeeded} succeeded, ${failed} failed`);
  console.log('='.repeat(60));
  
  return { processed: jobs.length, succeeded, failed };
}

async function main() {
  await loadServices();
  
  if (CONTINUOUS) {
    console.log('Running in continuous mode...');
    console.log(`Checking every ${CHECK_INTERVAL / 60000} minutes.\n`);
    
    while (true) {
      try {
        await processJobs();
      } catch (err) {
        console.error('Error processing jobs:', err.message);
      }
      
      console.log(`\nNext check in ${CHECK_INTERVAL / 60000} minutes...`);
      await sleep(CHECK_INTERVAL);
    }
  } else {
    try {
      await processJobs();
    } catch (err) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  }
}

main();


