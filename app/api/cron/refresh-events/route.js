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
import { fetchFromSource, getRegionFromState } from '@/lib/eventSourceFetchers';
import { isDuplicateEvent, deduplicateBatch } from '@/lib/eventDeduplication';
import { geocodeEvent, batchGeocodeEvents } from '@/lib/geocodingService';

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

/**
 * Generate a slug from event name
 */
function generateSlug(name, city, startDate) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
  
  const location = city?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'usa';
  const date = startDate?.replace(/-/g, '').substring(0, 6) || '';
  
  return `${base}-${location}-${date}`.substring(0, 80);
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
    
    // 3. Process each source
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
        
        // Deduplicate against existing events
        const { unique, duplicates } = deduplicateBatch(rawEvents, existingEventsList);
        
        sourceResult.eventsDeduplicated = duplicates.length;
        results.eventsDeduplicated += duplicates.length;
        
        if (duplicates.length > 0) {
          console.log(`[refresh-events] ${duplicates.length} duplicates found from ${source.name}`);
        }
        
        // Process unique events
        const eventsToCreate = [];
        
        for (const event of unique) {
          // Map event_type_slug -> event_type_id (fallback to 'other')
          const eventTypeId =
            (event.event_type_slug && eventTypeIdBySlug.get(event.event_type_slug)) ||
            otherTypeId ||
            null;
          
          // Determine region from state if not provided
          const region = event.region || getRegionFromState(event.state);
          
          // Generate slug
          const slug = generateSlug(event.name, event.city, event.start_date);
          
          // Check for slug collision
          let finalSlug = slug;
          const existingSlugs = new Set([
            ...existingEventsList.map(e => e.slug),
            ...eventsToCreate.map(e => e.slug),
          ]);
          
          let counter = 1;
          while (existingSlugs.has(finalSlug)) {
            finalSlug = `${slug}-${counter}`;
            counter++;
          }
          
          eventsToCreate.push({
            slug: finalSlug,
            name: event.name,
            description: event.description,
            event_type_id: eventTypeId,
            start_date: event.start_date,
            end_date: event.end_date,
            start_time: event.start_time,
            end_time: event.end_time,
            timezone: event.timezone || 'America/New_York',
            venue_name: event.venue_name,
            address: event.address,
            city: event.city,
            state: event.state,
            zip: event.zip,
            country: event.country || 'USA',
            latitude: event.latitude,
            longitude: event.longitude,
            region,
            scope: event.scope || 'local',
            source_url: event.source_url,
            source_name: source.name,
            registration_url: event.registration_url,
            image_url: event.image_url,
            cost_text: event.cost_text,
            is_free: event.is_free || false,
            status: 'approved', // Auto-approve from trusted sources
            featured: false,
          });
        }
        
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
        
        // Insert events
        if (!dryRun && eventsToCreate.length > 0) {
          console.log(`[refresh-events] Inserting ${eventsToCreate.length} events...`);
          
          const { data: insertedEvents, error: insertErr } = await supabaseServiceRole
            .from('events')
            .insert(eventsToCreate)
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

