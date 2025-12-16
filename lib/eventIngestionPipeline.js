/**
 * Unified Event Ingestion Pipeline
 * 
 * Orchestrates event fetching from multiple sources with:
 * - Fault tolerance (continues on individual failures)
 * - Resumability (tracks progress)
 * - Deduplication (against database and within batch)
 * - Provenance tracking (every event linked to source and job)
 * - Rate limiting (respects source limits)
 * 
 * @module lib/eventIngestionPipeline
 */

import { createClient } from '@supabase/supabase-js';
import { deduplicateBatch } from './eventDeduplication.js';
import { buildEventRows } from './eventsIngestion/buildEventRows.js';
import { fetchFromSource } from './eventSourceFetchers/index.js';
import { fetchTrackVenueEvents } from './eventSourceFetchers/trackVenueFetcher.js';
import { fetchIcalEvents } from './eventSourceFetchers/icalAggregator.js';

/**
 * Source registry with priority and configuration
 * Lower priority = fetched first
 */
const SOURCE_REGISTRY = [
  { 
    key: 'eventbritesearch', 
    priority: 1, 
    enabled: true, 
    needsLocation: true,
    description: 'Eventbrite public search (city-based)',
  },
  { 
    key: 'carsandcoffeeevents', 
    priority: 1, 
    enabled: true, 
    needsLocation: false,
    description: 'Cars and Coffee Events directory',
  },
  { 
    key: 'motorsportreg', 
    priority: 2, 
    enabled: true, 
    needsLocation: false,
    description: 'MotorsportReg track events',
  },
  { 
    key: 'scca', 
    priority: 2, 
    enabled: true, 
    needsLocation: false,
    description: 'SCCA autocross/track calendar',
  },
  { 
    key: 'pca', 
    priority: 2, 
    enabled: true, 
    needsLocation: false,
    description: 'PCA national events',
  },
  { 
    key: 'trackvenue', 
    priority: 3, 
    enabled: true, 
    needsLocation: false,
    description: 'Track venue calendars (direct)',
    custom: true,
    fetcher: fetchTrackVenueEvents,
  },
  { 
    key: 'ical', 
    priority: 4, 
    enabled: true, 
    needsLocation: false,
    description: 'iCal feeds (clubs, tracks)',
    custom: true,
    fetcher: fetchIcalEvents,
  },
  { 
    key: 'rideology', 
    priority: 5, 
    enabled: false, // Often blocked
    needsLocation: false,
    description: 'Rideology car meets',
  },
];

/**
 * Event Ingestion Pipeline
 * 
 * @class
 */
export class EventIngestionPipeline {
  /**
   * Create pipeline instance
   * 
   * @param {Object} supabase - Supabase client
   * @param {Object} options - Pipeline options
   */
  constructor(supabase, options = {}) {
    this.supabase = supabase;
    this.options = {
      dryRun: false,
      batchSize: 50,
      delayBetweenSources: 2000,
      limitPerSource: 100,
      rangeStart: null,
      rangeEnd: null,
      ...options,
    };
    
    this.stats = {
      fetched: 0,
      validated: 0,
      deduplicated: 0,
      inserted: 0,
      failed: 0,
      sources: {},
    };
    
    this.errors = [];
    this.jobId = options.jobId || `pipeline-${Date.now()}`;
    
    // Caches
    this.eventTypeIdBySlug = null;
    this.existingEvents = null;
    this.sourceConfigs = null;
  }

  /**
   * Initialize caches
   */
  async initialize() {
    console.log('[Pipeline] Initializing...');
    
    // Load event types
    const { data: eventTypes, error: etError } = await this.supabase
      .from('event_types')
      .select('id, slug');
    
    if (etError) {
      throw new Error(`Failed to load event_types: ${etError.message}`);
    }
    
    this.eventTypeIdBySlug = new Map(
      (eventTypes || []).map(t => [t.slug, t.id])
    );
    this.otherTypeId = this.eventTypeIdBySlug.get('other') || null;
    
    // Load source configurations
    const { data: sources, error: srcError } = await this.supabase
      .from('event_sources')
      .select('*')
      .eq('is_active', true);
    
    if (srcError) {
      throw new Error(`Failed to load event_sources: ${srcError.message}`);
    }
    
    this.sourceConfigs = new Map(
      (sources || []).map(s => [s.name.toLowerCase().replace(/[^a-z]/g, ''), s])
    );
    
    // Load existing events for deduplication (future events only)
    const { data: existing, error: existError } = await this.supabase
      .from('events')
      .select('id, slug, source_url, start_date, city, state, name')
      .gte('start_date', new Date().toISOString().slice(0, 10));
    
    if (existError) {
      console.warn(`[Pipeline] Could not load existing events: ${existError.message}`);
      this.existingEvents = [];
    } else {
      this.existingEvents = existing || [];
    }
    
    console.log(`[Pipeline] Loaded ${this.eventTypeIdBySlug.size} event types, ${this.sourceConfigs.size} sources, ${this.existingEvents.length} existing events`);
  }

  /**
   * Run the pipeline
   * 
   * @param {string[]|null} sourceFilter - Optional array of source keys to run
   * @returns {Promise<Object>} Pipeline stats
   */
  async run(sourceFilter = null) {
    console.log('');
    console.log('🚀 Starting Event Ingestion Pipeline');
    console.log(`   Job ID: ${this.jobId}`);
    console.log(`   Mode: ${this.options.dryRun ? 'DRY RUN' : 'LIVE'}`);
    console.log(`   Date Range: ${this.options.rangeStart || 'any'} to ${this.options.rangeEnd || 'any'}`);
    console.log('');
    
    await this.initialize();
    
    // Create master scrape job
    let masterJobId = null;
    if (!this.options.dryRun) {
      const { data: job, error: jobError } = await this.supabase
        .from('scrape_jobs')
        .insert({
          job_type: 'events_pipeline',
          status: 'running',
          priority: 10,
          source_key: 'pipeline',
          started_at: new Date().toISOString(),
          job_payload: {
            kind: 'events_pipeline',
            sources: sourceFilter || 'all',
            options: this.options,
          },
        })
        .select('id')
        .single();
      
      if (job) {
        masterJobId = job.id;
      }
    }
    
    // Get active sources sorted by priority
    const activeSources = SOURCE_REGISTRY
      .filter(s => s.enabled)
      .filter(s => !sourceFilter || sourceFilter.includes(s.key))
      .sort((a, b) => a.priority - b.priority);
    
    console.log(`[Pipeline] Running ${activeSources.length} sources`);
    
    for (const sourceDef of activeSources) {
      console.log(`\n📡 Source: ${sourceDef.key} (${sourceDef.description})`);
      
      try {
        const events = await this.fetchFromSource(sourceDef);
        this.stats.sources[sourceDef.key] = { 
          fetched: events.length,
          inserted: 0,
        };
        this.stats.fetched += events.length;
        
        if (events.length > 0) {
          const inserted = await this.processEvents(events, sourceDef.key);
          this.stats.sources[sourceDef.key].inserted = inserted;
        }
        
      } catch (error) {
        console.error(`   ✗ ${sourceDef.key} failed: ${error.message}`);
        this.errors.push({ source: sourceDef.key, error: error.message });
        this.stats.sources[sourceDef.key] = { fetched: 0, inserted: 0, error: error.message };
      }
      
      // Rate limit between sources
      await this.sleep(this.options.delayBetweenSources);
    }
    
    // Update master job
    if (masterJobId && !this.options.dryRun) {
      await this.supabase
        .from('scrape_jobs')
        .update({
          status: this.errors.length > 0 ? 'completed_with_errors' : 'completed',
          completed_at: new Date().toISOString(),
          sources_succeeded: Object.keys(this.stats.sources).filter(k => !this.stats.sources[k].error),
          sources_failed: Object.keys(this.stats.sources).filter(k => this.stats.sources[k].error),
          error_message: this.errors.length > 0 ? JSON.stringify(this.errors.slice(0, 10)) : null,
        })
        .eq('id', masterJobId);
    }
    
    this.printSummary();
    
    return this.stats;
  }

  /**
   * Fetch events from a source
   * 
   * @param {Object} sourceDef - Source definition from registry
   * @returns {Promise<Object[]>} Array of events
   */
  async fetchFromSource(sourceDef) {
    const fetchOptions = {
      limit: this.options.limitPerSource,
      dryRun: false, // We handle dry run at insert level
      rangeStart: this.options.rangeStart,
      rangeEnd: this.options.rangeEnd,
    };
    
    // Custom fetchers
    if (sourceDef.custom && sourceDef.fetcher) {
      const source = { name: sourceDef.key };
      const { events, errors } = await sourceDef.fetcher(source, fetchOptions);
      
      if (errors?.length > 0) {
        this.errors.push(...errors.slice(0, 5).map(e => ({ source: sourceDef.key, error: e })));
      }
      
      console.log(`   Fetched: ${events.length} events`);
      return events;
    }
    
    // Standard fetchers using source config from database
    const sourceConfig = this.sourceConfigs.get(sourceDef.key);
    if (!sourceConfig) {
      console.log(`   Skipped: No source config found in database`);
      return [];
    }
    
    const { events, errors } = await fetchFromSource(sourceConfig, fetchOptions);
    
    if (errors?.length > 0) {
      this.errors.push(...errors.slice(0, 5).map(e => ({ source: sourceDef.key, error: e })));
    }
    
    console.log(`   Fetched: ${events.length} events`);
    return events;
  }

  /**
   * Process fetched events - validate, dedupe, insert
   * 
   * @param {Object[]} events - Raw events from source
   * @param {string} sourceName - Source name
   * @returns {Promise<number>} Number of events inserted
   */
  async processEvents(events, sourceName) {
    // Step 1: Validate
    const validated = events.filter(e => this.validateEvent(e));
    console.log(`   Validated: ${validated.length}/${events.length}`);
    this.stats.validated += validated.length;
    
    if (validated.length === 0) return 0;
    
    // Step 2: Deduplicate against existing events
    const { unique, duplicates } = deduplicateBatch(validated, this.existingEvents);
    console.log(`   Unique: ${unique.length} (${duplicates.length} duplicates)`);
    this.stats.deduplicated += duplicates.length;
    
    if (unique.length === 0) return 0;
    
    // Step 3: Build database rows
    const existingSlugs = new Set(this.existingEvents.map(e => e.slug));
    const existingSlugByConflictKey = new Map(
      this.existingEvents.map(e => [
        `${String(e.source_url || '').trim()}|${String(e.start_date || '').trim()}`,
        e.slug
      ])
    );
    
    // Get source config for provenance - create if not exists
    let sourceConfig = this.sourceConfigs.get(sourceName);
    
    if (!sourceConfig) {
      // For custom sources without DB config, use a placeholder source
      // In production, you'd want to create a proper event_sources row
      sourceConfig = {
        id: null,
        name: sourceName,
      };
    }
    
    // In dry run mode, we can show what would be inserted without a job ID
    if (this.options.dryRun) {
      console.log(`   [DRY RUN] Would insert ${unique.length} events`);
      return 0;
    }
    
    // For live runs, we need source.id and scrapeJobId for provenance
    if (!sourceConfig.id) {
      console.log(`   Skipped: Source ${sourceName} has no database configuration`);
      console.log(`   To enable: Add a row to event_sources table with name="${sourceName}"`);
      return 0;
    }
    
    // Create scrape job for this source
    const nowIso = new Date().toISOString();
    const { data: jobRow, error: jobError } = await this.supabase
      .from('scrape_jobs')
      .insert({
        job_type: 'events_pipeline_source',
        status: 'running',
        priority: 5,
        source_key: sourceName,
        started_at: nowIso,
        sources_attempted: [sourceName],
        job_payload: {
          kind: 'events_pipeline_source',
          source_id: sourceConfig.id,
          source_name: sourceName,
          pipeline_job_id: this.jobId,
        },
      })
      .select('id')
      .single();
    
    if (jobError || !jobRow?.id) {
      console.log(`   Failed to create scrape job: ${jobError?.message || 'unknown'}`);
      return 0;
    }
    
    const scrapeJobId = jobRow.id;
    
    const rows = buildEventRows({
      events: unique,
      source: sourceConfig,
      eventTypeIdBySlug: this.eventTypeIdBySlug,
      otherTypeId: this.otherTypeId,
      existingSlugs,
      existingSlugByConflictKey,
      verifiedAtIso: nowIso,
      scrapeJobId,
    });
    
    console.log(`   Prepared: ${rows.length} rows for insert`);
    
    let inserted = 0;
    
    // Insert in batches
    for (let i = 0; i < rows.length; i += this.options.batchSize) {
      const batch = rows.slice(i, i + this.options.batchSize);
      
      const { data, error } = await this.supabase
        .from('events')
        .upsert(batch, { onConflict: 'source_url,start_date' })
        .select('id');
      
      if (error) {
        console.error(`   Batch insert error: ${error.message}`);
        this.stats.failed += batch.length;
        this.errors.push({ source: sourceName, error: `Insert failed: ${error.message}` });
      } else {
        inserted += data?.length || 0;
        
        // Add newly inserted events to existing list for later dedup
        for (const row of batch) {
          this.existingEvents.push({
            slug: row.slug,
            source_url: row.source_url,
            start_date: row.start_date,
            city: row.city,
            state: row.state,
            name: row.name,
          });
        }
      }
    }
    
    console.log(`   Inserted: ${inserted}`);
    this.stats.inserted += inserted;
    
    // Update scrape job status
    await this.supabase
      .from('scrape_jobs')
      .update({
        status: inserted > 0 ? 'completed' : 'completed_no_data',
        completed_at: new Date().toISOString(),
        sources_succeeded: [sourceName],
      })
      .eq('id', scrapeJobId);
    
    return inserted;
  }

  /**
   * Validate an event has required fields
   * 
   * @param {Object} event 
   * @returns {boolean}
   */
  validateEvent(event) {
    // Required fields
    if (!event.name || !event.source_url) return false;
    if (!event.start_date) return false;
    
    // Date must be reasonable (not too old, not too far in future)
    const date = new Date(event.start_date);
    if (isNaN(date.getTime())) return false;
    
    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const threeYearsAhead = new Date(now);
    threeYearsAhead.setFullYear(threeYearsAhead.getFullYear() + 3);
    
    if (date < oneYearAgo || date > threeYearsAhead) return false;
    
    // Source URL must be valid
    try {
      new URL(event.source_url);
    } catch {
      return false;
    }
    
    return true;
  }

  /**
   * Print pipeline summary
   */
  printSummary() {
    console.log('');
    console.log('='.repeat(60));
    console.log('📊 PIPELINE SUMMARY');
    console.log('='.repeat(60));
    console.log(`Job ID:            ${this.jobId}`);
    console.log(`Mode:              ${this.options.dryRun ? 'DRY RUN' : 'LIVE'}`);
    console.log('-'.repeat(60));
    console.log(`Total Fetched:     ${this.stats.fetched}`);
    console.log(`Passed Validation: ${this.stats.validated}`);
    console.log(`Duplicates Skipped: ${this.stats.deduplicated}`);
    console.log(`Inserted:          ${this.stats.inserted}`);
    console.log(`Failed:            ${this.stats.failed}`);
    console.log('-'.repeat(60));
    console.log('By Source:');
    
    for (const [source, data] of Object.entries(this.stats.sources)) {
      const status = data.error ? '✗' : '✓';
      console.log(`  ${status} ${source}: ${data.fetched} fetched, ${data.inserted} inserted`);
    }
    
    if (this.errors.length > 0) {
      console.log('-'.repeat(60));
      console.log(`Errors (${this.errors.length}):`);
      for (const err of this.errors.slice(0, 10)) {
        console.log(`  [${err.source}] ${err.error}`);
      }
      if (this.errors.length > 10) {
        console.log(`  ... and ${this.errors.length - 10} more`);
      }
    }
    
    console.log('='.repeat(60));
  }

  /**
   * Sleep utility
   * 
   * @param {number} ms 
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Create and run the pipeline
 * 
 * @param {Object} options - Pipeline options
 * @param {string[]|null} sourceFilter - Sources to run
 * @returns {Promise<Object>} Pipeline stats
 */
export async function runPipeline(options = {}, sourceFilter = null) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
  
  const pipeline = new EventIngestionPipeline(supabase, options);
  return pipeline.run(sourceFilter);
}

export default EventIngestionPipeline;

