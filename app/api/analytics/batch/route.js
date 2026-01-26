/**
 * Analytics Batch API
 * 
 * Receives batched analytics events from the offline queue
 * and stores them for processing.
 * 
 * POST /api/analytics/batch
 * 
 * @module app/api/analytics/batch
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withErrorLogging } from '@/lib/serverErrorLogger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/analytics/batch
 * 
 * Process a batch of analytics events
 * 
 * Body:
 * {
 *   events: Array<{
 *     event: string,
 *     properties: Object,
 *     timestamp: number,
 *     id: string
 *   }>
 * }
 */
async function handlePost(request) {
  try {
    const { events } = await request.json();
    
    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: 'No events provided' },
        { status: 400 }
      );
    }

    // Limit batch size
    if (events.length > 100) {
      return NextResponse.json(
        { error: 'Batch size too large (max 100 events)' },
        { status: 400 }
      );
    }

    // Get client info from headers
    const userAgent = request.headers.get('user-agent') || null;
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || null;

    // Transform events for storage
    const records = events.map(event => ({
      event_name: event.event,
      event_properties: event.properties || {},
      event_id: event.id,
      client_timestamp: new Date(event.timestamp).toISOString(),
      user_agent: userAgent,
      // Don't store IP for privacy, but could be used for geo-location
      is_batched: true,
      created_at: new Date().toISOString(),
    }));

    // Store events
    const { error } = await supabase
      .from('analytics_events')
      .insert(records);

    if (error) {
      // Table may not exist
      if (error.code === '42P01') {
        // Log but don't fail - events will be lost but user flow continues
        console.warn('[Analytics Batch] Table "analytics_events" does not exist');
        return NextResponse.json({ 
          success: true, 
          warning: 'Table not configured',
          processed: events.length,
        });
      }

      console.error('[Analytics Batch] Storage error:', error);
      return NextResponse.json(
        { error: 'Failed to store events' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      processed: events.length,
    });

  } catch (error) {
    console.error('[Analytics Batch] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withErrorLogging(handlePost, { route: 'analytics/batch', feature: 'analytics' });
