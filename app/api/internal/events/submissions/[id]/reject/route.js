/**
 * Reject Event Submission API
 * 
 * POST /api/internal/events/submissions/[id]/reject
 * Reject a submission with a reason.
 * 
 * Admin only - requires x-internal-admin-key header.
 */

import { NextResponse } from 'next/server';
import { requireAdmin, getAuthErrorStatus } from '@/lib/adminAuth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { withErrorLogging } from '@/lib/serverErrorLogger';

/**
 * POST - Reject a submission
 */
async function handlePost(request, { params }) {
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
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Submission ID is required' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { reason } = body;
    
    if (!reason || typeof reason !== 'string') {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }
    
    // Get submission
    const { data: submission, error: subError } = await supabase
      .from('event_submissions')
      .select('id, status')
      .eq('id', id)
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
    
    // Determine status based on reason
    let status = 'rejected';
    if (reason.toLowerCase().includes('duplicate')) {
      status = 'duplicate';
    }
    
    // Update submission
    const { error: updateError } = await supabase
      .from('event_submissions')
      .update({
        status,
        rejection_reason: reason,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id);
    
    if (updateError) {
      console.error('[API/internal/events/submissions/reject] Error updating:', updateError);
      return NextResponse.json(
        { error: 'Failed to reject submission' },
        { status: 500 }
      );
    }
    
    // TODO: Send notification to user that their submission was rejected
    
    return NextResponse.json({
      success: true,
      status,
    });
  } catch (err) {
    console.error('[API/internal/events/submissions/reject] Unexpected error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export const POST = withErrorLogging(handlePost, { route: 'internal-events-submissions-reject', feature: 'internal' });
