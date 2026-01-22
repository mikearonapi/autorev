/**
 * Event Submission API
 * 
 * POST /api/events/submit
 * Allows authenticated users to submit events for review.
 * 
 * TODO: Implement rate limiting (e.g., 5 submissions per day per user)
 */

import { NextResponse } from 'next/server';
import { errors } from '@/lib/apiErrors';
import { notifyEventSubmission } from '@/lib/discord';
import { withErrorLogging } from '@/lib/serverErrorLogger';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

/**
 * Validate URL format
 */
function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate date is today or in the future
 */
function isFutureOrToday(dateString) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateString);
  return date >= today;
}

async function handlePost(request) {
  // Get authenticated user
  const supabase = await createServerSupabaseClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const {
      name,
      event_type_slug,
      source_url,
      start_date,
      end_date,
      venue_name,
      city,
      state,
      description,
    } = body;
    
    // Validate required fields
    const errors = [];
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      errors.push('Event name is required');
    } else if (name.trim().length > 200) {
      errors.push('Event name must be 200 characters or less');
    }
    
    if (!event_type_slug || typeof event_type_slug !== 'string') {
      errors.push('Event type is required');
    }
    
    if (!source_url || typeof source_url !== 'string' || source_url.trim().length === 0) {
      errors.push('Event URL is required');
    } else if (!isValidUrl(source_url.trim())) {
      errors.push('Event URL must be a valid URL (starting with http:// or https://)');
    }
    
    if (!start_date || typeof start_date !== 'string') {
      errors.push('Start date is required');
    } else if (!isFutureOrToday(start_date)) {
      errors.push('Start date must be today or in the future');
    }
    
    if (end_date && new Date(end_date) < new Date(start_date)) {
      errors.push('End date must be on or after start date');
    }
    
    if (!city || typeof city !== 'string' || city.trim().length === 0) {
      errors.push('City is required');
    }
    
    // State is optional for international events (state === null)
    // but required otherwise
    if (state !== null && (!state || typeof state !== 'string')) {
      errors.push('State is required');
    }
    
    if (description && description.length > 1000) {
      errors.push('Description must be 1000 characters or less');
    }
    
    if (errors.length > 0) {
      return NextResponse.json(
        { error: errors.join('. ') },
        { status: 400 }
      );
    }
    
    // Verify event type exists
    const { data: eventType, error: typeError } = await supabase
      .from('event_types')
      .select('slug')
      .eq('slug', event_type_slug)
      .single();
    
    if (typeError || !eventType) {
      return NextResponse.json(
        { error: 'Invalid event type' },
        { status: 400 }
      );
    }
    
    // Create submission
    const { data: submission, error: insertError } = await supabase
      .from('event_submissions')
      .insert({
        user_id: user.id,
        name: name.trim(),
        event_type_slug: event_type_slug,
        source_url: source_url.trim(),
        start_date: start_date,
        end_date: end_date || null,
        venue_name: venue_name?.trim() || null,
        city: city.trim(),
        state: state || null,
        description: description?.trim() || null,
        status: 'pending',
      })
      .select('id, created_at')
      .single();
    
    if (insertError) {
      console.error('[API/events/submit] Error creating submission:', insertError);
      return NextResponse.json(
        { error: 'Failed to submit event' },
        { status: 500 }
      );
    }
    
    // Fire-and-forget Discord notification
    notifyEventSubmission({
      id: submission.id,
      name: body.name,
      event_type_slug: body.event_type_slug,
      start_date: body.start_date,
      city: body.city,
      state: body.state,
      source_url: body.source_url,
    }).catch(err => console.error('[Events Submit] Discord notification failed:', err));
    
  return NextResponse.json({
    success: true,
    submissionId: submission.id,
    message: 'Event submitted successfully. It will be reviewed within 48 hours.',
  });
}

export const POST = withErrorLogging(handlePost, { route: 'events/submit', feature: 'events' });

