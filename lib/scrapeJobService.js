/**
 * Scrape Job Service
 * 
 * Manages scheduled scraping jobs with:
 * - Job queue in Supabase
 * - Priority-based execution
 * - Retry logic with exponential backoff
 * - Rate limiting per source
 * - Time-of-day scheduling (off-peak hours)
 * - Automatic stale data refresh
 * 
 * @module lib/scrapeJobService
 */

import { supabase, supabaseServiceRole, isSupabaseConfigured } from './supabase.js';
import * as dataAggregator from './dataAggregator.js';
import * as enrichedDataService from './enrichedDataService.js';
import { runPartsVendorIngestJob } from './partsVendorIngestionService.js';
import { runKnowledgeIndexJob } from './knowledgeIndexService.js';

function getDbClient() {
  // scrape_jobs is service-role only (RLS); prefer service role client.
  return supabaseServiceRole || supabase;
}

// Job types
export const JOB_TYPES = {
  FULL_ENRICH: 'full_enrich',
  PRICING_ONLY: 'pricing_only',
  SAFETY_ONLY: 'safety_only',
  REVIEWS_ONLY: 'reviews_only',
  FREE_APIS_ONLY: 'free_apis_only',
  REFRESH_STALE: 'refresh_stale',
  PARTS_VENDOR_INGEST: 'parts_vendor_ingest',
  KNOWLEDGE_INDEX: 'knowledge_index',
};

// Source configurations
const SOURCE_CONFIG = {
  epa: { rateLimit: 60, priority: 1, freeApi: true },
  nhtsa: { rateLimit: 60, priority: 1, freeApi: true },
  iihs: { rateLimit: 20, priority: 3, freeApi: false },
  bat: { rateLimit: 15, priority: 2, freeApi: false },
  hagerty: { rateLimit: 15, priority: 2, freeApi: false },
  carscom: { rateLimit: 15, priority: 2, freeApi: false },
  cad: { rateLimit: 10, priority: 3, freeApi: false },
  motortrend: { rateLimit: 10, priority: 3, freeApi: false },
};

// ============================================================================
// JOB QUEUE MANAGEMENT
// ============================================================================

/**
 * Create a new scrape job
 * @param {Object} params
 * @param {string} params.carSlug - Car to scrape
 * @param {string} params.jobType - Type of job
 * @param {number} params.priority - 1 (highest) to 10 (lowest)
 * @param {Date} params.scheduledFor - When to run
 * @returns {Promise<Object>}
 */
export async function createJob(params) {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase not configured' };
  }
  
  const {
    carSlug,
    jobType = JOB_TYPES.FULL_ENRICH,
    priority = 5,
    scheduledFor = new Date(),
    sourceKey = null,
    payload = null,
  } = params;
  
  try {
    const client = getDbClient();
    const { data, error } = await client
      .from('scrape_jobs')
      .insert({
        car_slug: carSlug || null,
        job_type: jobType,
        priority,
        status: 'pending',
        scheduled_for: scheduledFor.toISOString(),
        source_key: sourceKey,
        job_payload: payload || {},
      })
      .select()
      .single();
    
    if (error) throw error;
    
    console.log(`[ScrapeJob] Created job ${data.id} (${jobType}) ${carSlug ? `for ${carSlug}` : ''}`);
    return { success: true, job: data };
  } catch (err) {
    console.error('[ScrapeJob] Error creating job:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Create jobs for multiple cars
 * @param {string[]} carSlugs 
 * @param {string} jobType 
 * @param {Object} options
 * @returns {Promise<Object>}
 */
export async function createBatchJobs(carSlugs, jobType = JOB_TYPES.FULL_ENRICH, options = {}) {
  const { 
    priority = 5,
    spreadOverHours = 24, // Spread jobs over 24 hours
    offPeakOnly = true, // Only schedule during off-peak hours
  } = options;
  
  const jobs = [];
  const now = new Date();
  
  for (let i = 0; i < carSlugs.length; i++) {
    // Calculate scheduled time
    let scheduledFor = new Date(now);
    
    if (spreadOverHours > 0) {
      const hoursOffset = (i / carSlugs.length) * spreadOverHours;
      scheduledFor.setHours(scheduledFor.getHours() + hoursOffset);
    }
    
    // Adjust to off-peak hours (midnight to 6am local)
    if (offPeakOnly) {
      scheduledFor = adjustToOffPeak(scheduledFor);
    }
    
    const result = await createJob({
      carSlug: carSlugs[i],
      jobType,
      priority,
      scheduledFor,
    });
    
    if (result.success) {
      jobs.push(result.job);
    }
  }
  
  return {
    success: true,
    jobsCreated: jobs.length,
    jobs,
  };
}

/**
 * Schedule Shopify parts vendor ingestion jobs.
 * Creates one job per vendor key (car_slug is null; vendorKey is source_key).
 * @param {Object} options
 * @param {string[]} options.vendorKeys
 * @param {number} [options.priority]
 * @param {boolean} [options.offPeakOnly]
 * @param {number} [options.spreadOverHours]
 * @param {Object} [options.payload]
 */
export async function schedulePartsVendorIngestJobs(options = {}) {
  const {
    vendorKeys = [],
    priority = 6,
    offPeakOnly = true,
    spreadOverHours = 24,
    payload = {},
  } = options;

  const keys = Array.isArray(vendorKeys) ? vendorKeys.filter(Boolean) : [];
  if (keys.length === 0) return { success: false, error: 'vendorKeys required' };

  const now = new Date();
  const jobs = [];

  for (let i = 0; i < keys.length; i++) {
    let scheduledFor = new Date(now);
    if (spreadOverHours > 0) {
      const hoursOffset = (i / keys.length) * spreadOverHours;
      scheduledFor.setHours(scheduledFor.getHours() + hoursOffset);
    }
    if (offPeakOnly) scheduledFor = adjustToOffPeak(scheduledFor);

    const res = await createJob({
      carSlug: null,
      jobType: JOB_TYPES.PARTS_VENDOR_INGEST,
      priority,
      scheduledFor,
      sourceKey: keys[i],
      payload,
    });

    if (res.success) jobs.push(res.job);
  }

  return { success: true, jobsCreated: jobs.length, jobs };
}

/**
 * Adjust time to off-peak hours (midnight to 6am)
 * @param {Date} date 
 * @returns {Date}
 */
function adjustToOffPeak(date) {
  const hour = date.getHours();
  
  // If already in off-peak (0-6am), return as is
  if (hour >= 0 && hour < 6) {
    return date;
  }
  
  // Otherwise, schedule for next midnight
  const adjusted = new Date(date);
  // Random time between 00:00 and 05:59
  adjusted.setHours(Math.floor(Math.random() * 6), Math.floor(Math.random() * 60), 0, 0);
  
  // If that's in the past, add a day
  if (adjusted < new Date()) {
    adjusted.setDate(adjusted.getDate() + 1);
  }
  
  return adjusted;
}

/**
 * Get pending jobs
 * @param {number} limit 
 * @returns {Promise<Array>}
 */
export async function getPendingJobs(limit = 10) {
  if (!isSupabaseConfigured) return [];
  
  try {
    const now = new Date().toISOString();
    const client = getDbClient();
    
    const { data, error } = await client
      .from('scrape_jobs')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', now)
      .order('priority', { ascending: true })
      .order('scheduled_for', { ascending: true })
      .limit(limit);
    
    if (error) throw error;
    
    return data || [];
  } catch (err) {
    console.error('[ScrapeJob] Error fetching pending jobs:', err);
    return [];
  }
}

/**
 * Update job status
 * @param {string} jobId 
 * @param {Object} updates 
 * @returns {Promise<Object>}
 */
export async function updateJob(jobId, updates) {
  if (!isSupabaseConfigured) return { success: false };
  
  try {
    const client = getDbClient();
    const { data, error } = await client
      .from('scrape_jobs')
      .update(updates)
      .eq('id', jobId)
      .select()
      .single();
    
    if (error) throw error;
    
    return { success: true, job: data };
  } catch (err) {
    console.error('[ScrapeJob] Error updating job:', err);
    return { success: false, error: err.message };
  }
}

// ============================================================================
// JOB EXECUTION
// ============================================================================

/**
 * Execute a single job
 * @param {Object} job 
 * @returns {Promise<Object>}
 */
export async function executeJob(job) {
  const { id, car_slug: carSlug, job_type: jobType, attempt_count: attemptCount } = job;
  
  console.log(`[ScrapeJob] Executing job ${id} (${jobType}) for ${carSlug}`);
  
  // Mark as running
  await updateJob(id, {
    status: 'running',
    started_at: new Date().toISOString(),
    attempt_count: (attemptCount || 0) + 1,
  });
  
  const sourcesAttempted = [];
  const sourcesSucceeded = [];
  const sourcesFailed = [];
  
  try {
    const client = getDbClient();

    if (jobType === JOB_TYPES.PARTS_VENDOR_INGEST) {
      sourcesAttempted.push(job.source_key || 'parts_vendor');
      const result = await runPartsVendorIngestJob(job);
      sourcesSucceeded.push(job.source_key || 'parts_vendor');

      await updateJob(id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        sources_attempted: sourcesAttempted,
        sources_succeeded: sourcesSucceeded,
        sources_failed: null,
      });

      console.log(`[ScrapeJob] Job ${id} completed successfully`);
      return { success: true, result };
    }

    if (jobType === JOB_TYPES.KNOWLEDGE_INDEX) {
      sourcesAttempted.push(job.source_key || 'knowledge_index');
      const result = await runKnowledgeIndexJob(job);
      sourcesSucceeded.push(job.source_key || 'knowledge_index');

      await updateJob(id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        sources_attempted: sourcesAttempted,
        sources_succeeded: sourcesSucceeded,
        sources_failed: null,
      });

      console.log(`[ScrapeJob] Job ${id} completed successfully`);
      return { success: true, result };
    }

    // Get the car data first
    const { data: car, error: carError } = await client
      .from('cars')
      .select('*')
      .eq('slug', carSlug)
      .single();
    
    if (carError || !car) {
      throw new Error(`Car not found: ${carSlug}`);
    }
    
    // Determine which sources to fetch based on job type
    const sources = getSourcesToFetch(jobType);
    
    // Execute with the data aggregator
    const result = await dataAggregator.aggregateCarData(car, {
      sources,
    });
    
    // Track which sources succeeded/failed
    sourcesAttempted.push(...result.metadata.sources);
    sourcesSucceeded.push(...result.metadata.sources);
    sourcesFailed.push(...result.metadata.errors.map(e => e.split(':')[0]));
    
    // Persist the data
    await persistJobResults(carSlug, result, jobType);
    
    // Mark as completed
    await updateJob(id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      sources_attempted: sourcesAttempted,
      sources_succeeded: sourcesSucceeded,
      sources_failed: sourcesFailed.length > 0 ? sourcesFailed : null,
    });
    
    console.log(`[ScrapeJob] Job ${id} completed successfully`);
    
    return { success: true, result };
    
  } catch (err) {
    console.error(`[ScrapeJob] Job ${id} failed:`, err);
    
    // Determine if we should retry
    const maxAttempts = job.max_attempts || 3;
    const currentAttempt = (attemptCount || 0) + 1;
    
    if (currentAttempt < maxAttempts) {
      // Schedule retry with exponential backoff
      const retryDelay = Math.pow(2, currentAttempt) * 60 * 1000; // 2, 4, 8 minutes
      const nextRetry = new Date(Date.now() + retryDelay);
      
      await updateJob(id, {
        status: 'pending',
        next_retry_at: nextRetry.toISOString(),
        scheduled_for: nextRetry.toISOString(),
        error_message: err.message,
        sources_attempted: sourcesAttempted,
        sources_failed: [...sourcesFailed, err.message],
      });
      
      console.log(`[ScrapeJob] Job ${id} scheduled for retry at ${nextRetry}`);
    } else {
      // Max retries exceeded
      await updateJob(id, {
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: `Max retries exceeded: ${err.message}`,
        sources_attempted: sourcesAttempted,
        sources_failed: sourcesFailed,
      });
    }
    
    return { success: false, error: err.message };
  }
}

/**
 * Get sources to fetch based on job type
 * @param {string} jobType 
 * @returns {string[]|null}
 */
function getSourcesToFetch(jobType) {
  switch (jobType) {
    case JOB_TYPES.FREE_APIS_ONLY:
      return ['epa', 'nhtsa'];
    case JOB_TYPES.PRICING_ONLY:
      return ['bat', 'hagerty', 'carscom'];
    case JOB_TYPES.SAFETY_ONLY:
      return ['nhtsa', 'iihs'];
    case JOB_TYPES.REVIEWS_ONLY:
      return ['cad', 'motortrend'];
    case JOB_TYPES.FULL_ENRICH:
    default:
      return null; // All sources
  }
}

/**
 * Persist job results to database
 * @param {string} carSlug 
 * @param {Object} result 
 * @param {string} jobType 
 */
async function persistJobResults(carSlug, result, jobType) {
  // Save fuel economy
  if (result.fuelEconomy) {
    await enrichedDataService.saveFuelEconomy(carSlug, result.fuelEconomy);
  }
  
  // Save safety data
  if (result.safety?.nhtsa || result.safety?.iihs) {
    await enrichedDataService.saveSafetyData(carSlug, {
      nhtsa: result.safety.nhtsa,
      iihs: result.safety.iihs,
      summary: result.summary?.safety,
    });
  }
  
  // Save pricing data
  if (result.pricing) {
    await enrichedDataService.saveMarketPricing(carSlug, {
      bringATrailer: result.pricing.bringATrailer,
      hagerty: result.pricing.hagerty,
      carsCom: result.pricing.carsCom,
      consensus: result.summary?.pricing,
    });
  }
  
  // Save reviews
  if (result.reviews?.carAndDriver?.primaryReview) {
    await enrichedDataService.saveExpertReview(carSlug, result.reviews.carAndDriver.primaryReview);
  }
  if (result.reviews?.motorTrend?.primaryReview) {
    await enrichedDataService.saveExpertReview(carSlug, result.reviews.motorTrend.primaryReview);
  }
}

// ============================================================================
// JOB RUNNER
// ============================================================================

/**
 * Process pending jobs with rate limiting
 * @param {Object} options
 * @returns {Promise<Object>}
 */
export async function processPendingJobs(options = {}) {
  const {
    maxJobs = 5,
    delayBetweenJobs = 30000, // 30 seconds between jobs
  } = options;
  
  console.log('[ScrapeJob] Starting job processing...');
  
  const jobs = await getPendingJobs(maxJobs);
  
  if (jobs.length === 0) {
    console.log('[ScrapeJob] No pending jobs');
    return { processed: 0, succeeded: 0, failed: 0 };
  }
  
  console.log(`[ScrapeJob] Processing ${jobs.length} jobs...`);
  
  let succeeded = 0;
  let failed = 0;
  
  for (const job of jobs) {
    const result = await executeJob(job);
    
    if (result.success) {
      succeeded++;
    } else {
      failed++;
    }
    
    // Delay between jobs to respect rate limits
    if (jobs.indexOf(job) < jobs.length - 1) {
      console.log(`[ScrapeJob] Waiting ${delayBetweenJobs / 1000}s before next job...`);
      await new Promise(resolve => setTimeout(resolve, delayBetweenJobs));
    }
  }
  
  console.log(`[ScrapeJob] Completed: ${succeeded} succeeded, ${failed} failed`);
  
  return {
    processed: jobs.length,
    succeeded,
    failed,
  };
}

// ============================================================================
// STALE DATA REFRESH
// ============================================================================

/**
 * Find cars with stale data and create refresh jobs
 * @param {Object} options
 * @returns {Promise<Object>}
 */
export async function scheduleStaleDataRefresh(options = {}) {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase not configured' };
  }
  
  const { maxAge = 7, limit = 50, priority = 7 } = options;
  
  try {
    // Find cars with stale or missing data
    const staleDate = new Date();
    staleDate.setDate(staleDate.getDate() - maxAge);
    
    // Get all car slugs
    const { data: cars, error: carsError } = await supabase
      .from('cars')
      .select('slug')
      .limit(limit);
    
    if (carsError) throw carsError;
    
    const staleCars = [];
    
    for (const car of cars) {
      const freshness = await enrichedDataService.checkDataFreshness(car.slug);
      
      if (!freshness.overallFresh) {
        staleCars.push(car.slug);
      }
    }
    
    if (staleCars.length === 0) {
      return { success: true, jobsCreated: 0 };
    }
    
    // Create refresh jobs
    const result = await createBatchJobs(staleCars, JOB_TYPES.REFRESH_STALE, {
      priority,
      spreadOverHours: 48, // Spread over 2 days
      offPeakOnly: true,
    });
    
    return {
      success: true,
      staleCarsFound: staleCars.length,
      jobsCreated: result.jobsCreated,
    };
  } catch (err) {
    console.error('[ScrapeJob] Error scheduling stale refresh:', err);
    return { success: false, error: err.message };
  }
}

// ============================================================================
// JOB STATISTICS
// ============================================================================

/**
 * Get job statistics
 * @returns {Promise<Object>}
 */
export async function getJobStats() {
  if (!isSupabaseConfigured) {
    return { error: 'Supabase not configured' };
  }
  
  try {
    const client = getDbClient();
    const { data, error } = await client
      .from('scrape_jobs')
      .select('status, job_type');
    
    if (error) throw error;
    
    const stats = {
      total: data.length,
      byStatus: {},
      byType: {},
    };
    
    for (const job of data) {
      stats.byStatus[job.status] = (stats.byStatus[job.status] || 0) + 1;
      stats.byType[job.job_type] = (stats.byType[job.job_type] || 0) + 1;
    }
    
    return stats;
  } catch (err) {
    console.error('[ScrapeJob] Error getting stats:', err);
    return { error: err.message };
  }
}

/**
 * Clean up old completed/failed jobs
 * @param {number} daysOld 
 * @returns {Promise<Object>}
 */
export async function cleanupOldJobs(daysOld = 30) {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase not configured' };
  }
  
  try {
    const client = getDbClient();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const { data, error } = await client
      .from('scrape_jobs')
      .delete()
      .in('status', ['completed', 'failed'])
      .lt('completed_at', cutoffDate.toISOString())
      .select();
    
    if (error) throw error;
    
    return { success: true, deletedCount: data?.length || 0 };
  } catch (err) {
    console.error('[ScrapeJob] Error cleaning up jobs:', err);
    return { success: false, error: err.message };
  }
}

export default {
  JOB_TYPES,
  createJob,
  createBatchJobs,
  getPendingJobs,
  updateJob,
  executeJob,
  processPendingJobs,
  scheduleStaleDataRefresh,
  getJobStats,
  cleanupOldJobs,
};













