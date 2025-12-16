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
import { fetchFromSource } from '@/lib/eventSourceFetchers';
import { deduplicateBatch } from '@/lib/eventDeduplication';
import { batchGeocodeEvents } from '@/lib/geocodingService';
import { buildEventRows } from '@/lib/eventsIngestion/buildEventRows';

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

export async function GET(request) {
  // Auth check
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  if (!isSupabaseConfigured || !supabaseServiceRole) {
    return NextResponse.json({ error: 'Database not configured', code: 'DB_NOT_CONFIGURED' }, { status: 503 });
  }

  const startedAt = Date.now();
  const { searchParams } = new URL(request.url);
  
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
    // 0. Preload event types once to avoid N+1 queries during ingestion
    const { data: eventTypes, error: eventTypesErr } = await supabaseServiceRole
      .from('event_types')
      .select('id, slug');

    if (eventTypesErr) {
      throw new Error(`Failed to fetch event types: ${eventTypesErr.message}`);
    }

    const eventTypeIdBySlug = new Map((eventTypes || []).map((t) => [t.slug, t.id]));
    const otherTypeId = eventTypeIdBySlug.get('other') || null;

    // 1. Get active event sources
    let sourcesQuery = supabaseServiceRole
      .from('event_sources')
      .select('*')
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
    
    console.log(`[refresh-events] Processing ${sources.length} source(s)`);
    
    // 2. Get existing events for deduplication
    const { data: existingEvents, error: existingErr } = await supabaseServiceRole
      .from('events')
      .select('id, slug, name, source_url, start_date, city, state')
      .gte('start_date', new Date().toISOString().split('T')[0]);
    
    if (existingErr) {
      console.error('[refresh-events] Error fetching existing events:', existingErr);
      results.errors.push(`Failed to fetch existing events: ${existingErr.message}`);
    }
    
    const existingEventsList = existingEvents || [];
    const existingSlugByConflictKey = new Map(
      existingEventsList.map((e) => [`${String(e.source_url || '').trim()}|${String(e.start_date || '').trim()}`, e.slug])
    );
    
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

        console.log(`[refresh-events] Fetching from ${source.name}...`);
        
        // Fetch events from source
        const { events: rawEvents, errors: fetchErrors } = await fetchFromSource(source, {
          limit: limit || 100,
          dryRun,
          rangeStart,
          rangeEnd,
        });
        
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
        const existingSlugs = new Set(existingEventsList.map((e) => e.slug));
        const eventsToCreate = buildEventRows({
          events: uniqueWithinBatch,
          source,
          eventTypeIdBySlug,
          otherTypeId,
          existingSlugs,
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
            .upsert(eventsToCreate, { onConflict: 'source_url,start_date' })
            .select('id, slug');
          
          if (insertErr) {
            console.error(`[refresh-events] Error inserting events:`, insertErr);
            sourceResult.errors.push(`Insert failed: ${insertErr.message}`);
            results.errors.push(`[${source.name}] Insert failed: ${insertErr.message}`);
          } else {
            sourceResult.eventsCreated = insertedEvents?.length || 0;
            results.eventsCreated += sourceResult.eventsCreated;
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
    if (!dryRun) {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: expiredData, error: expireErr } = await supabaseServiceRole
        .from('events')
        .update({ status: 'expired' })
        .lt('start_date', today)
        .eq('status', 'approved')
        .select('id');
      
      if (expireErr) {
        console.error('[refresh-events] Error expiring events:', expireErr);
        results.errors.push(`Failed to expire events: ${expireErr.message}`);
      } else {
        results.eventsExpired = expiredData?.length || 0;
        if (results.eventsExpired > 0) {
          console.log(`[refresh-events] Marked ${results.eventsExpired} events as expired`);
        }
      }
    }
    
    results.durationMs = Date.now() - startedAt;
    
    return NextResponse.json(results);
    
  } catch (err) {
    console.error('[refresh-events] Critical error:', err);
    return NextResponse.json({
      ...results,
      success: false,
      error: err.message,
      durationMs: Date.now() - startedAt,
    }, { status: 500 });
  }
}

