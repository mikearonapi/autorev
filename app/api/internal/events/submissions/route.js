/**
 * Event Submissions Admin API
 * 
 * GET /api/internal/events/submissions - List submissions for moderation
 * POST /api/internal/events/submissions - Approve a submission and create event
 * 
 * Admin only - requires x-internal-admin-key header.
 */

import { NextResponse } from 'next/server';
import { requireAdmin, getAuthErrorStatus } from '@/lib/adminAuth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/**
 * Generate a slug from event name
 */
function generateSlug(name, startDate) {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const dateSlug = startDate?.split('-').slice(0, 2).join('-') || '';
  return `${baseSlug}-${dateSlug}`;
}

/**
 * GET - List submissions
 */
export async function GET(request) {
  // Check admin auth
  const authResult = requireAdmin(request);
  if (!authResult.ok) {
    return NextResponse.json(
      { error: authResult.error },
      { status: getAuthErrorStatus(authResult) }
    );
  }
  
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 500 }
    );
  }
  
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    
    let query = supabase
      .from('event_submissions')
      .select(`
        id,
        name,
        event_type_slug,
        description,
        source_url,
        start_date,
        end_date,
        venue_name,
        city,
        state,
        status,
        rejection_reason,
        created_event_id,
        created_at,
        reviewed_at,
        user_profiles!user_id (
          id,
          email,
          display_name
        ),
        reviewer:user_profiles!reviewed_by (
          id,
          display_name
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Filter by status unless 'all'
    if (status !== 'all') {
      query = query.eq('status', status);
    }
    
    const { data: submissions, error, count } = await query;
    
    if (error) {
      console.error('[API/internal/events/submissions] Error fetching:', error);
      return NextResponse.json(
        { error: 'Failed to fetch submissions' },
        { status: 500 }
      );
    }
    
    // Get counts for stats
    const { data: countData } = await supabase
      .from('event_submissions')
      .select('status', { count: 'exact', head: false });
    
    const stats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      duplicate: 0,
    };
    
    (countData || []).forEach(row => {
      if (stats.hasOwnProperty(row.status)) {
        stats[row.status]++;
      }
    });
    
    return NextResponse.json({
      submissions: (submissions || []).map(sub => ({
        id: sub.id,
        name: sub.name,
        event_type_slug: sub.event_type_slug,
        description: sub.description,
        source_url: sub.source_url,
        start_date: sub.start_date,
        end_date: sub.end_date,
        venue_name: sub.venue_name,
        city: sub.city,
        state: sub.state,
        status: sub.status,
        rejection_reason: sub.rejection_reason,
        created_event_id: sub.created_event_id,
        created_at: sub.created_at,
        reviewed_at: sub.reviewed_at,
        submitted_by: sub.user_profiles ? {
          id: sub.user_profiles.id,
          email: sub.user_profiles.email,
          display_name: sub.user_profiles.display_name,
        } : null,
        reviewed_by: sub.reviewer ? {
          id: sub.reviewer.id,
          display_name: sub.reviewer.display_name,
        } : null,
      })),
      total: count || 0,
      stats,
      limit,
      offset,
    });
  } catch (err) {
    console.error('[API/internal/events/submissions] Unexpected error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * POST - Approve submission and create event
 */
export async function POST(request) {
  // Check admin auth
  const authResult = requireAdmin(request);
  if (!authResult.ok) {
    return NextResponse.json(
      { error: authResult.error },
      { status: getAuthErrorStatus(authResult) }
    );
  }
  
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 500 }
    );
  }
  
  try {
    const body = await request.json();
    const { submissionId, eventData } = body;
    
    if (!submissionId) {
      return NextResponse.json(
        { error: 'submissionId is required' },
        { status: 400 }
      );
    }
    
    // Get submission
    const { data: submission, error: subError } = await supabase
      .from('event_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();
    
    if (subError || !submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }
    
    if (submission.status !== 'pending') {
      return NextResponse.json(
        { error: `Submission already ${submission.status}` },
        { status: 400 }
      );
    }
    
    // Get event type ID
    const eventTypeSlug = eventData?.event_type_slug || submission.event_type_slug;
    const { data: eventType, error: typeError } = await supabase
      .from('event_types')
      .select('id')
      .eq('slug', eventTypeSlug)
      .single();
    
    if (typeError || !eventType) {
      return NextResponse.json(
        { error: 'Invalid event type' },
        { status: 400 }
      );
    }
    
    // Prepare event data
    const eventName = eventData?.name || submission.name;
    const startDate = eventData?.start_date || submission.start_date;
    const slug = generateSlug(eventName, startDate);
    
    // Check for slug collision
    const { data: existingEvent } = await supabase
      .from('events')
      .select('id')
      .eq('slug', slug)
      .single();
    
    let finalSlug = slug;
    if (existingEvent) {
      finalSlug = `${slug}-${Date.now().toString(36)}`;
    }
    
    // Create event
    const { data: createdEvent, error: createError } = await supabase
      .from('events')
      .insert({
        slug: finalSlug,
        name: eventName,
        description: eventData?.description || submission.description || null,
        event_type_id: eventType.id,
        start_date: startDate,
        end_date: eventData?.end_date || submission.end_date || null,
        start_time: eventData?.start_time || null,
        end_time: eventData?.end_time || null,
        timezone: eventData?.timezone || 'America/New_York',
        venue_name: eventData?.venue_name || submission.venue_name || null,
        address: eventData?.address || null,
        city: eventData?.city || submission.city,
        state: eventData?.state || submission.state || null,
        zip: eventData?.zip || null,
        country: eventData?.country || 'USA',
        latitude: eventData?.latitude || null,
        longitude: eventData?.longitude || null,
        region: eventData?.region || null,
        scope: eventData?.scope || 'local',
        source_url: eventData?.source_url || submission.source_url,
        source_name: eventData?.source_name || null,
        registration_url: eventData?.registration_url || null,
        image_url: eventData?.image_url || null,
        cost_text: eventData?.cost_text || null,
        is_free: eventData?.is_free || false,
        status: 'approved',
        featured: eventData?.featured || false,
        submitted_by: submission.user_id,
        approved_at: new Date().toISOString(),
        last_verified_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (createError) {
      console.error('[API/internal/events/submissions] Error creating event:', createError);
      return NextResponse.json(
        { error: 'Failed to create event' },
        { status: 500 }
      );
    }
    
    // Update submission
    const { error: updateError } = await supabase
      .from('event_submissions')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        created_event_id: createdEvent.id,
      })
      .eq('id', submissionId);
    
    if (updateError) {
      console.error('[API/internal/events/submissions] Error updating submission:', updateError);
      // Event was created, so just log the error
    }
    
    // TODO: Send notification to user that their submission was approved
    
    return NextResponse.json({
      success: true,
      event: createdEvent,
    });
  } catch (err) {
    console.error('[API/internal/events/submissions] Unexpected error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

