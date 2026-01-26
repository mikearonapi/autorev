/**
 * Pipeline Logger
 *
 * Standardized logging for data ingestion pipelines.
 * Tracks execution metrics and logs to data_pipeline_runs table.
 *
 * Usage:
 *   import { PipelineRun } from '@/lib/pipelineLogger';
 *   
 *   const run = new PipelineRun('my-pipeline', { source: 'api' });
 *   await run.start();
 *   
 *   try {
 *     // ... pipeline logic
 *     run.recordCreated(5);
 *     run.recordFailed(1);
 *     await run.complete();
 *   } catch (err) {
 *     await run.fail(err);
 *   }
 *
 * @module lib/pipelineLogger
 */

import { createClient } from '@supabase/supabase-js';

// Lazy-initialize Supabase to avoid import errors during build
let _supabase = null;

function getSupabase() {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      console.warn('[PipelineLogger] Missing Supabase credentials - logging disabled');
      return null;
    }
    _supabase = createClient(url, key);
  }
  return _supabase;
}

/**
 * Pipeline run tracker
 */
export class PipelineRun {
  constructor(pipelineName, options = {}) {
    this.pipelineName = pipelineName;
    this.version = options.version || '1.0.0';
    this.params = options.params || {};
    this.triggeredBy = options.triggeredBy || 'manual';
    this.environment = options.environment || process.env.NODE_ENV || 'production';
    
    this.runId = null;
    this.startTime = null;
    
    // Metrics
    this.metrics = {
      processed: 0,
      created: 0,
      updated: 0,
      failed: 0,
      skipped: 0,
      validationErrors: 0,
    };
    
    // Error tracking
    this.errors = [];
  }

  /**
   * Start the pipeline run
   */
  async start() {
    this.startTime = Date.now();
    
    const supabase = getSupabase();
    if (!supabase) {
      console.log(`[${this.pipelineName}] Pipeline started (logging disabled)`);
      return this;
    }
    
    try {
      const { data, error } = await supabase.rpc('start_pipeline_run', {
        p_pipeline_name: this.pipelineName,
        p_params: this.params,
        p_triggered_by: this.triggeredBy,
      });
      
      if (error) throw error;
      this.runId = data;
      console.log(`[${this.pipelineName}] Pipeline started (run: ${this.runId})`);
    } catch (err) {
      console.warn(`[${this.pipelineName}] Failed to log pipeline start:`, err.message);
    }
    
    return this;
  }

  /**
   * Record created records
   */
  recordCreated(count = 1) {
    this.metrics.created += count;
    this.metrics.processed += count;
    return this;
  }

  /**
   * Record updated records
   */
  recordUpdated(count = 1) {
    this.metrics.updated += count;
    this.metrics.processed += count;
    return this;
  }

  /**
   * Record failed records
   */
  recordFailed(count = 1, error = null) {
    this.metrics.failed += count;
    this.metrics.processed += count;
    if (error) {
      this.errors.push(typeof error === 'string' ? error : error.message);
    }
    return this;
  }

  /**
   * Record skipped records
   */
  recordSkipped(count = 1) {
    this.metrics.skipped += count;
    this.metrics.processed += count;
    return this;
  }

  /**
   * Record validation errors
   */
  recordValidationError(count = 1) {
    this.metrics.validationErrors += count;
    return this;
  }

  /**
   * Calculate linkage success rate
   */
  getLinkageSuccessRate() {
    const total = this.metrics.processed - this.metrics.skipped;
    if (total === 0) return 100;
    const successful = this.metrics.created + this.metrics.updated;
    return Math.round((successful / total) * 10000) / 100; // 2 decimal places
  }

  /**
   * Complete the pipeline run successfully
   */
  async complete() {
    const duration = Date.now() - this.startTime;
    const successRate = this.getLinkageSuccessRate();
    
    console.log(`[${this.pipelineName}] Pipeline completed in ${duration}ms`);
    console.log(`  Processed: ${this.metrics.processed}`);
    console.log(`  Created: ${this.metrics.created}`);
    console.log(`  Updated: ${this.metrics.updated}`);
    console.log(`  Failed: ${this.metrics.failed}`);
    console.log(`  Skipped: ${this.metrics.skipped}`);
    console.log(`  Success Rate: ${successRate}%`);
    
    const supabase = getSupabase();
    if (!supabase || !this.runId) return this.getReport();
    
    try {
      await supabase.rpc('complete_pipeline_run', {
        p_run_id: this.runId,
        p_status: 'completed',
        p_records_processed: this.metrics.processed,
        p_records_created: this.metrics.created,
        p_records_updated: this.metrics.updated,
        p_records_failed: this.metrics.failed,
        p_records_skipped: this.metrics.skipped,
        p_validation_errors: this.metrics.validationErrors,
        p_linkage_success_rate: successRate,
      });
    } catch (err) {
      console.warn(`[${this.pipelineName}] Failed to log pipeline completion:`, err.message);
    }
    
    return this.getReport();
  }

  /**
   * Mark the pipeline run as failed
   */
  async fail(error) {
    const duration = Date.now() - this.startTime;
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorDetails = error.stack ? { stack: error.stack } : null;
    
    console.error(`[${this.pipelineName}] Pipeline FAILED after ${duration}ms: ${errorMessage}`);
    
    const supabase = getSupabase();
    if (!supabase || !this.runId) return this.getReport();
    
    try {
      await supabase.rpc('complete_pipeline_run', {
        p_run_id: this.runId,
        p_status: 'failed',
        p_records_processed: this.metrics.processed,
        p_records_created: this.metrics.created,
        p_records_updated: this.metrics.updated,
        p_records_failed: this.metrics.failed,
        p_records_skipped: this.metrics.skipped,
        p_validation_errors: this.metrics.validationErrors,
        p_linkage_success_rate: this.getLinkageSuccessRate(),
        p_error_message: errorMessage,
        p_error_details: errorDetails,
      });
    } catch (err) {
      console.warn(`[${this.pipelineName}] Failed to log pipeline failure:`, err.message);
    }
    
    return this.getReport();
  }

  /**
   * Get a summary report
   */
  getReport() {
    return {
      runId: this.runId,
      pipeline: this.pipelineName,
      duration: Date.now() - this.startTime,
      metrics: { ...this.metrics },
      successRate: this.getLinkageSuccessRate(),
      errors: this.errors.slice(0, 10), // First 10 errors
    };
  }
}

/**
 * Get recent pipeline runs
 */
export async function getRecentRuns(pipelineName = null, limit = 20) {
  const supabase = getSupabase();
  if (!supabase) return [];
  
  const RUN_COLS = 'id, pipeline_name, status, started_at, completed_at, duration_ms, records_processed, records_failed, error_message, metadata, created_at';
  
  let query = supabase
    .from('data_pipeline_runs')
    .select(RUN_COLS)
    .order('started_at', { ascending: false })
    .limit(limit);
  
  if (pipelineName) {
    query = query.eq('pipeline_name', pipelineName);
  }
  
  const { data, error } = await query;
  if (error) {
    console.error('Failed to fetch pipeline runs:', error);
    return [];
  }
  
  return data;
}

/**
 * Get pipeline health summary
 */
export async function getPipelineHealth() {
  const supabase = getSupabase();
  if (!supabase) return null;
  
  const { data, error } = await supabase
    .from('data_pipeline_runs')
    .select('pipeline_name, status, linkage_success_rate, started_at')
    .gte('started_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
    .order('started_at', { ascending: false });
  
  if (error) {
    console.error('Failed to fetch pipeline health:', error);
    return null;
  }
  
  // Group by pipeline
  const byPipeline = {};
  data.forEach(run => {
    if (!byPipeline[run.pipeline_name]) {
      byPipeline[run.pipeline_name] = {
        name: run.pipeline_name,
        runs: 0,
        successes: 0,
        failures: 0,
        avgSuccessRate: [],
        lastRun: null,
      };
    }
    const p = byPipeline[run.pipeline_name];
    p.runs++;
    if (run.status === 'completed') p.successes++;
    if (run.status === 'failed') p.failures++;
    if (run.linkage_success_rate) p.avgSuccessRate.push(run.linkage_success_rate);
    if (!p.lastRun) p.lastRun = run.started_at;
  });
  
  // Calculate averages
  return Object.values(byPipeline).map(p => ({
    ...p,
    avgSuccessRate: p.avgSuccessRate.length > 0
      ? Math.round(p.avgSuccessRate.reduce((a, b) => a + b, 0) / p.avgSuccessRate.length * 100) / 100
      : null,
    successPercent: p.runs > 0 ? Math.round((p.successes / p.runs) * 100) : 0,
  }));
}

export default PipelineRun;
