/**
 * Cron: Refresh events from external sources
 * 
 * GET /api/cron/refresh-events
 * 
 * Fetches events from configured event sources, deduplicates,
 * geocodes, and inserts new events into the database.
 * 
 * Auth:
 * - Authorization: Bearer <CRON_SECRET> OR x-vercel-cron: true
 * 
 * Query params:
 * - source: Specific source name to run (optional, default all active)
 * - limit: Max events to process per source (optional, for testing)
 * - dryRun: If 'true', don't write to DB, just return what would be created
 * - skipGeocode: If 'true', skip geocoding step
 */

import { NextResponse } from 'next/server';
import { supabaseServiceRole, isSupabaseConfigured } from '@/lib/supabase';
import { fetchFromSource, getFetcher } from '@/lib/eventSourceFetchers';
import { deduplicateBatch } from '@/lib/eventDeduplication';
import { batchGeocodeEvents } from '@/lib/geocodingService';
import { buildEventRows } from '@/lib/eventsIngestion/buildEventRows';
import { notifyCronEnrichment, notifyCronFailure } from '@/lib/discord';
import { logCronError, withErrorLogging } from '@/lib/serverErrorLogger';

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Per-source timeout in milliseconds (5 minutes)
 * This prevents any single source from blocking the entire cron job
 */
const SOURCE_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * Wrap a promise with a timeout
 * @param {Promise} promise - The promise to wrap
 * @param {number} timeoutMs - Timeout in milliseconds
 * @param {string} operationName - Name for error messages
 * @returns {Promise}
 */
function withTimeout(promise, timeoutMs, operationName) {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`${operationName} timed out after ${timeoutMs / 1000}s`)), timeoutMs)
    )
  ]);
}

/**
 * Check if request is authorized
 */
function isAuthorized(request) {
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`) return true;
  const vercelCron = request.headers.get('x-vercel-cron');
  return vercelCron === 'true';
}

async function handleGet(request) {
  // Auth check
  if (!isAuthorized(request)) {
    console.error('[refresh-events] Unauthorized request. CRON_SECRET set:', Boolean(CRON_SECRET), 'x-vercel-cron header:', request.headers.get('x-vercel-cron'));
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  if (!isSupabaseConfigured || !supabaseServiceRole) {
    console.error('[refresh-events] Database not configured. isSupabaseConfigured:', isSupabaseConfigured, 'supabaseServiceRole:', Boolean(supabaseServiceRole));
    return NextResponse.json({ 
      error: 'Database not configured', 
      code: 'DB_NOT_CONFIGURED',
      debug: {
        isSupabaseConfigured,
        hasServiceRole: Boolean(supabaseServiceRole),
        hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
        hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      }
    }, { status: 503 });
  }

  const startedAt = Date.now();
  const { searchParams } = new URL(request.url);
  
  // Diagnostic mode - returns system health without running the full cron
  const diagnosticMode = searchParams.get('diagnostic') === 'true';
  if (diagnosticMode) {
    try {
      const { data: sources, error: sourcesErr } = await supabaseServiceRole
        .from('event_sources')
        .select('id, name, is_active, last_run_at, last_run_status, last_run_events');
      
      const diagnostics = {
        timestamp: new Date().toISOString(),
        config: {
          hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
          hasSupabaseAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
          hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
          hasCronSecret: Boolean(process.env.CRON_SECRET),
          isSupabaseConfigured,
          hasServiceRoleClient: Boolean(supabaseServiceRole),
        },
        sources: (sources || []).map(s => ({
          ...s,
          normalized_name: s.name.toLowerCase().replace(/[^a-z]/g, ''),
          has_fetcher: Boolean(getFetcher(s.name)),
        })),
        sourcesError: sourcesErr?.message || null,
        availableFetchers: ['motorsportreg', 'scca', 'pca', 'eventbrite', 'eventbritesearch', 'carsandcoffeeevents', 'facebookevents', 'rideology', 'trackvenue', 'ical'],
      };
      
      return NextResponse.json(diagnostics);
    } catch (err) {
      console.error('[refresh-events] Diagnostic failed:', err);
      return NextResponse.json({ error: 'Diagnostic check failed', code: 'DIAGNOSTIC_FAILED' }, { status: 500 });
    }
  }
  
  const sourceFilter = searchParams.get('source');
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit'), 10) : null;
  const dryRun = searchParams.get('dryRun') === 'true';
  const skipGeocode = searchParams.get('skipGeocode') === 'true';
  const rangeStart = searchParams.get('rangeStart'); // optional ISO-ish string
  const rangeEnd = searchParams.get('rangeEnd'); // optional ISO-ish string
  
  const results = {
    success: true,
    dryRun,
    sourcesProcessed: 0,
    eventsDiscovered: 0,
    eventsCreated: 0,
    eventsUpdated: 0,
    eventsExpired: 0,
    eventsDeduplicated: 0,
    eventsGeocoded: 0,
    errors: [],
    sourceResults: [],
    ranAt: new Date().toISOString(),
  };

  try {
    // 0a. Cleanup stale running jobs (older than 10 minutes - generous timeout)
    // Individual sources have 5-minute timeouts, so 10 minutes means something went very wrong
    const staleThreshold = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: staleJobs, error: staleErr } = await supabaseServiceRole
      .from('scrape_jobs')
      .update({
        status: 'failed',
        error_message: 'Job marked stale by cleanup - exceeded 10 minute runtime (likely hung)',
        completed_at: new Date().toISOString(),
      })
      .eq('job_type', 'events_refresh')
      .eq('status', 'running')
      .lt('started_at', staleThreshold)
      .select('id');
    
    if (staleJobs?.length > 0) {
      console.log(`[refresh-events] Cleaned up ${staleJobs.length} stale running jobs`);
    }
    
    // 0b. Preload event types once to avoid N+1 queries during ingestion
    const { data: eventTypes, error: eventTypesErr } = await supabaseServiceRole
      .from('event_types')
      .select('id, slug');

    if (eventTypesErr) {
      throw new Error(`Failed to fetch event types: ${eventTypesErr.message}`);
    }

    const eventTypeIdBySlug = new Map((eventTypes || []).map((t) => [t.slug, t.id]));
    const otherTypeId = eventTypeIdBySlug.get('other') || null;

    const SOURCE_COLS = 'id, name, slug, source_type, source_url, fetch_config, is_active, last_fetched_at, created_at';
    
    // 1. Get active event sources
    let sourcesQuery = supabaseServiceRole
      .from('event_sources')
      .select(SOURCE_COLS)
      .eq('is_active', true);
    
    if (sourceFilter) {
      sourcesQuery = sourcesQuery.ilike('name', `%${sourceFilter}%`);
    }
    
    const { data: sources, error: sourcesErr } = await sourcesQuery;
    
    if (sourcesErr) {
      throw new Error(`Failed to fetch sources: ${sourcesErr.message}`);
    }
    
    if (!sources || sources.length === 0) {
      return NextResponse.json({
        ...results,
        message: 'No active event sources found',
      });
    }
    
    console.log(`[refresh-events] Processing ${sources.length} source(s):`, sources.map(s => ({ id: s.id, name: s.name, is_active: s.is_active })));
    
    // Log fetcher availability for each source
    for (const source of sources) {
      const fetcher = getFetcher(source.name);
      if (!fetcher) {
        console.warn(`[refresh-events] ⚠️ No fetcher found for source "${source.name}" (normalized: "${source.name.toLowerCase().replace(/[^a-z]/g, '')}")`);
      }
    }
    
    // 2. Get existing events for deduplication (future events only for dedup logic)
    const { data: existingEvents, error: existingErr } = await supabaseServiceRole
      .from('events')
      .select('id, slug, name, source_url, start_date, city, state')
      .gte('start_date', new Date().toISOString().split('T')[0]);
    
    if (existingErr) {
      console.error('[refresh-events] Error fetching existing events:', existingErr);
      results.errors.push(`Failed to fetch existing events: ${existingErr.message}`);
    }
    
    // 2b. Get ALL existing slugs to prevent unique constraint violations
    // (includes past/expired events that still occupy slug namespace)
    const { data: allSlugs, error: slugsErr } = await supabaseServiceRole
      .from('events')
      .select('slug');
    
    if (slugsErr) {
      console.error('[refresh-events] Error fetching all slugs:', slugsErr);
    }
    
    const existingEventsList = existingEvents || [];
    const existingSlugByConflictKey = new Map(
      existingEventsList.map((e) => [`${String(e.source_url || '').trim()}|${String(e.start_date || '').trim()}`, e.slug])
    );
    
    // Include ALL slugs (past + future) to prevent slug collisions
    const allExistingSlugs = new Set((allSlugs || []).map(e => e.slug));
    
    // 3. Process each source (create a scrape_jobs record per source for provenance)
    for (const source of sources) {
      const sourceResult = {
        name: source.name,
        eventsDiscovered: 0,
        eventsCreated: 0,
        eventsUpdated: 0,
        eventsDeduplicated: 0,
        errors: [],
      };
      
      try {
        // Create provenance job
        const nowIso = new Date().toISOString();
        const { data: jobRow, error: jobErr } = await supabaseServiceRole
          .from('scrape_jobs')
          .insert({
            job_type: 'events_refresh',
            status: 'running',
            priority: 5,
            source_key: source.name,
            started_at: nowIso,
            sources_attempted: [source.name],
            job_payload: {
              kind: 'events_refresh',
              source_id: source.id,
              source_name: source.name,
              limit: limit || 100,
              rangeStart: rangeStart || null,
              rangeEnd: rangeEnd || null,
              dryRun,
              skipGeocode,
            },
          })
          .select('id')
          .single();

        if (jobErr || !jobRow?.id) {
          throw new Error(`Failed to create scrape_job for ${source.name}: ${jobErr?.message || 'unknown error'}`);
        }

        const scrapeJobId = jobRow.id;

        console.log(`[refresh-events] Fetching from ${source.name} (timeout: ${SOURCE_TIMEOUT_MS / 1000}s)...`);
        
        // Fetch events from source with timeout to prevent hanging
        const { events: rawEvents, errors: fetchErrors } = await withTimeout(
          fetchFromSource(source, {
            limit: limit || 100,
            dryRun,
            rangeStart,
            rangeEnd,
          }),
          SOURCE_TIMEOUT_MS,
          `Fetch from ${source.name}`
        );
        
        sourceResult.eventsDiscovered = rawEvents.length;
        results.eventsDiscovered += rawEvents.length;
        
        if (fetchErrors && fetchErrors.length > 0) {
          sourceResult.errors.push(...fetchErrors);
          results.errors.push(...fetchErrors.map(e => `[${source.name}] ${e}`));
        }
        
        if (rawEvents.length === 0) {
          console.log(`[refresh-events] No events from ${source.name}`);
          results.sourceResults.push(sourceResult);
          continue;
        }
        
        // For observability: compute duplicates vs existing, but DO NOT drop them.
        // We need to re-verify existing events and stamp provenance.
        const { unique: uniqueVsExisting, duplicates: duplicatesVsExisting } = deduplicateBatch(
          rawEvents,
          existingEventsList
        );

        sourceResult.eventsDeduplicated = duplicatesVsExisting.length;
        results.eventsDeduplicated += duplicatesVsExisting.length;

        if (duplicatesVsExisting.length > 0) {
          console.log(
            `[refresh-events] ${duplicatesVsExisting.length} existing matches (will upsert + refresh provenance) from ${source.name}`
          );
        }

        // Deduplicate only within this batch to avoid conflicting upserts
        const { unique: uniqueWithinBatch } = deduplicateBatch(rawEvents, []);

        // Build DB rows w/ provenance (and keep existing slugs stable)
        // Use allExistingSlugs (includes past events) to prevent slug collisions
        const eventsToCreate = buildEventRows({
          events: uniqueWithinBatch,
          source,
          eventTypeIdBySlug,
          otherTypeId,
          existingSlugs: allExistingSlugs,
          existingSlugByConflictKey,
          verifiedAtIso: nowIso,
          scrapeJobId,
        });
        
        // Geocode events if needed
        if (!skipGeocode && !dryRun && eventsToCreate.length > 0) {
          console.log(`[refresh-events] Geocoding ${eventsToCreate.length} events...`);
          
          const geocodedEvents = await batchGeocodeEvents(eventsToCreate, {
            batchSize: 10,
            onProgress: (progress) => {
              if (progress.processed % 10 === 0) {
                console.log(`[refresh-events] Geocoded ${progress.processed}/${progress.total}`);
              }
            },
          });
          
          // Update events with geocoded coordinates
          let geocodedCount = 0;
          for (let i = 0; i < eventsToCreate.length; i++) {
            if (geocodedEvents[i].latitude && geocodedEvents[i].longitude) {
              eventsToCreate[i].latitude = geocodedEvents[i].latitude;
              eventsToCreate[i].longitude = geocodedEvents[i].longitude;
              geocodedCount++;
            }
          }
          
          results.eventsGeocoded += geocodedCount;
          console.log(`[refresh-events] Geocoded ${geocodedCount} events`);
        }
        
        // Insert / upsert events
        if (!dryRun && eventsToCreate.length > 0) {
          console.log(`[refresh-events] Inserting ${eventsToCreate.length} events...`);
          
          const { data: insertedEvents, error: insertErr } = await supabaseServiceRole
            .from('events')
            .upsert(eventsToCreate, { onConflict: 'source_url,start_date', ignoreDuplicates: false })
            .select('id, slug');
          
          if (insertErr) {
            // If batch upsert fails (e.g., slug collision), try inserting one-by-one with slug regeneration
            console.warn(`[refresh-events] Batch upsert failed, trying individual inserts with slug recovery:`, insertErr.message);
            let successCount = 0;
            const individualErrors = [];
            
            for (const event of eventsToCreate) {
              let attempts = 0;
              const maxAttempts = 3;
              let inserted = false;
              
              while (!inserted && attempts < maxAttempts) {
                const { error: singleErr } = await supabaseServiceRole
                  .from('events')
                  .upsert([event], { onConflict: 'source_url,start_date', ignoreDuplicates: true })
                  .select('id');
                
                if (singleErr) {
                  // Check if it's a slug collision - regenerate and retry
                  if (singleErr.message.includes('events_slug_key') && attempts < maxAttempts - 1) {
                    // Generate new unique slug
                    const timestamp = Date.now();
                    const random = Math.random().toString(36).substring(2, 6);
                    event.slug = `${event.slug.substring(0, 60)}-${random}`.replace(/--+/g, '-');
                    attempts++;
                    console.log(`[refresh-events] Slug collision, retrying with new slug: ${event.slug}`);
                  } else {
                    // Other error or max attempts reached
                    individualErrors.push(`${event.name}: ${singleErr.message}`);
                    break;
                  }
                } else {
                  inserted = true;
                  successCount++;
                  // Track the slug as used for future events in this batch
                  allExistingSlugs.add(event.slug);
                }
              }
            }
            
            if (individualErrors.length > 0) {
              console.warn(`[refresh-events] ${individualErrors.length} events failed individually:`, individualErrors.slice(0, 3));
              sourceResult.errors.push(`${individualErrors.length} events failed: ${individualErrors[0]}`);
            }
            
            sourceResult.eventsCreated = successCount;
            results.eventsCreated += successCount;
            console.log(`[refresh-events] Created ${successCount}/${eventsToCreate.length} events from ${source.name} (individual inserts)`);
          } else {
            sourceResult.eventsCreated = insertedEvents?.length || 0;
            results.eventsCreated += sourceResult.eventsCreated;
            // Track all inserted slugs
            (insertedEvents || []).forEach(e => allExistingSlugs.add(e.slug));
            console.log(`[refresh-events] Created ${sourceResult.eventsCreated} events from ${source.name}`);
          }
        } else if (dryRun) {
          sourceResult.eventsCreated = eventsToCreate.length;
          results.eventsCreated += eventsToCreate.length;
          console.log(`[refresh-events] [DRY RUN] Would create ${eventsToCreate.length} events from ${source.name}`);
        }

        // Mark scrape job completed
        if (!dryRun) {
          const completedAtIso = new Date().toISOString();
          await supabaseServiceRole
            .from('scrape_jobs')
            .update({
              status: sourceResult.errors.length > 0 ? 'failed' : 'completed',
              completed_at: completedAtIso,
              sources_succeeded: sourceResult.errors.length > 0 ? [] : [source.name],
              sources_failed: sourceResult.errors.length > 0 ? [source.name] : [],
              error_message: sourceResult.errors.length > 0 ? sourceResult.errors.slice(0, 5).join(' | ') : null,
              job_payload: {
                kind: 'events_refresh',
                source_id: source.id,
                source_name: source.name,
                discovered: sourceResult.eventsDiscovered,
                deduplicated: sourceResult.eventsDeduplicated,
                created_or_updated: sourceResult.eventsCreated,
                errors: sourceResult.errors,
                finished_at: completedAtIso,
              },
            })
            .eq('id', scrapeJobId);
        }
        
        // Update source's last_run fields
        if (!dryRun) {
          await supabaseServiceRole
            .from('event_sources')
            .update({
              last_run_at: new Date().toISOString(),
              last_run_status: sourceResult.errors.length > 0 ? 'partial' : 'success',
              last_run_events: sourceResult.eventsCreated,
            })
            .eq('id', source.id);
        }
        
      } catch (err) {
        console.error(`[refresh-events] Error processing ${source.name}:`, err);
        sourceResult.errors.push(err.message);
        results.errors.push(`[${source.name}] ${err.message}`);
        
        // Update source with failure
        if (!dryRun) {
          await supabaseServiceRole
            .from('event_sources')
            .update({
              last_run_at: new Date().toISOString(),
              last_run_status: 'failed',
              last_run_events: 0,
            })
            .eq('id', source.id);
        }
      }
      
      results.sourceResults.push(sourceResult);
      results.sourcesProcessed++;
    }
    
    // 4. Mark expired events
    // An event is expired when:
    // - For multi-day events (end_date IS NOT NULL): end_date < today
    // - For single-day events (end_date IS NULL): start_date < today
    if (!dryRun) {
      const today = new Date().toISOString().split('T')[0];
      
      // Expire single-day events (no end_date) where start_date has passed
      const { data: expiredSingleDay, error: expireSingleErr } = await supabaseServiceRole
        .from('events')
        .update({ status: 'expired' })
        .is('end_date', null)
        .lt('start_date', today)
        .eq('status', 'approved')
        .select('id');
      
      if (expireSingleErr) {
        console.error('[refresh-events] Error expiring single-day events:', expireSingleErr);
        results.errors.push(`Failed to expire single-day events: ${expireSingleErr.message}`);
      }
      
      // Expire multi-day events where end_date has passed
      const { data: expiredMultiDay, error: expireMultiErr } = await supabaseServiceRole
        .from('events')
        .update({ status: 'expired' })
        .not('end_date', 'is', null)
        .lt('end_date', today)
        .eq('status', 'approved')
        .select('id');
      
      if (expireMultiErr) {
        console.error('[refresh-events] Error expiring multi-day events:', expireMultiErr);
        results.errors.push(`Failed to expire multi-day events: ${expireMultiErr.message}`);
      }
      
      results.eventsExpired = (expiredSingleDay?.length || 0) + (expiredMultiDay?.length || 0);
      if (results.eventsExpired > 0) {
        console.log(`[refresh-events] Marked ${results.eventsExpired} events as expired (${expiredSingleDay?.length || 0} single-day, ${expiredMultiDay?.length || 0} multi-day)`);
      }
    }
    
    results.durationMs = Date.now() - startedAt;
    
    notifyCronEnrichment('Events Calendar Refresh', {
      duration: results.durationMs || (Date.now() - startedAt),
      table: 'events',
      recordsAdded: results.eventsCreated,
      recordsUpdated: results.eventsUpdated,
      recordsProcessed: results.eventsDiscovered,
      sourcesChecked: results.sourcesProcessed,
      errors: results.errors.length,
      details: [
        { label: '🔍 Events Found', value: results.eventsDiscovered },
        { label: '📍 Geocoded', value: results.eventsGeocoded },
        { label: '🔄 Deduplicated', value: results.eventsDeduplicated },
        { label: '⏰ Expired', value: results.eventsExpired },
      ],
    });

    return NextResponse.json(results);
    
  } catch (err) {
    console.error('[refresh-events] Critical error:', err);
    await logCronError('refresh-events', err, { phase: 'processing' });
    notifyCronFailure('Refresh Events', err, { phase: 'processing' });
    return NextResponse.json({
      ...results,
      success: false,
      error: 'Event refresh failed',
      durationMs: Date.now() - startedAt,
    }, { status: 500 });
  }
}

export const GET = withErrorLogging(handleGet, { route: 'cron/refresh-events', feature: 'cron' });
