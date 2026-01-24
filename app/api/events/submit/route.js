/**
 * Event Submission API
 * 
 * POST /api/events/submit
 * Allows authenticated users to submit events for review.
 */

import { NextResponse } from 'next/server';
import { errors } from '@/lib/apiErrors';
import { notifyEventSubmission } from '@/lib/discord';
import { withErrorLogging } from '@/lib/serverErrorLogger';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { rateLimit } from '@/lib/rateLimit';
import { z } from 'zod';

// Event submission schema
const eventSubmitSchema = z.object({
  name: z.string().min(1, 'Event name is required').max(200, 'Name must be 200 characters or less'),
  event_type_slug: z.string().min(1, 'Event type is required'),
  source_url: z.string().url('Event URL must be a valid URL'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Invalid date format').refine(
    (date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(date) >= today;
    },
    { message: 'Start date must be today or in the future' }
  ),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Invalid date format').optional().nullable(),
  venue_name: z.string().max(200).optional().nullable(),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().max(100).optional().nullable(),
  description: z.string().max(1000, 'Description must be 1000 characters or less').optional().nullable(),
}).refine(
  (data) => !data.end_date || new Date(data.end_date) >= new Date(data.start_date),
  { message: 'End date must be on or after start date', path: ['end_date'] }
);

async function handlePost(request) {
  // Rate limit: 5 form submissions per minute
  const rateLimited = rateLimit(request, 'form');
  if (rateLimited) return rateLimited;

  // Get authenticated user
  const supabase = await createServerSupabaseClient();
    
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
  
  // Parse and validate request body
  const body = await request.json();
  const validation = eventSubmitSchema.safeParse(body);
  
  if (!validation.success) {
    const errorMessages = validation.error.errors.map(e => e.message);
    return NextResponse.json(
      { error: errorMessages.join('. ') },
      { status: 400 }
    );
  }
  
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
  } = validation.data;
    
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

