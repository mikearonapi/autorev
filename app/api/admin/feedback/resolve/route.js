/**
 * Admin Feedback Resolution API
 * 
 * Resolves user feedback and optionally sends a thank-you email.
 * 
 * POST /api/admin/feedback/resolve
 * 
 * Body:
 * - feedbackId: UUID - The feedback to resolve
 * - sendEmail: boolean - Whether to send a thank-you email (default: true)
 * - carSlug: string - (Optional) Car slug if a car was added for car_request feedback
 * - carName: string - (Optional) Car name for the email (e.g., "2024 BMW M3 CS")
 * - resolutionNotes: string - (Optional) Internal notes about the resolution
 */

import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

import { requireAdmin } from '@/lib/adminAccess';
import { resolveCarId } from '@/lib/carResolver';
import { sendFeedbackResponseEmail } from '@/lib/emailService';
import { withErrorLogging } from '@/lib/serverErrorLogger';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

/**
 * Map feedback types to email template feedback types
 */
function mapFeedbackType(feedbackType, category) {
  if (feedbackType === 'car_request') return 'car_request';
  if (feedbackType === 'feature' || category === 'feature') return 'feature_request';
  return 'general';
}

/**
 * Extract a user-friendly name from email if no other name available
 */
function extractNameFromEmail(email) {
  if (!email) return null;
  const localPart = email.split('@')[0];
  // Convert "john.doe" or "john_doe" to "John"
  return localPart.split(/[._]/)[0];
}

async function handlePost(request) {
  try {
    // Verify admin access
    const denied = await requireAdmin(request);
    if (denied) return denied;

    // Get user for audit trail
    const authHeader = request.headers.get('authorization');
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: authUser } } = await supabaseAdmin.auth.getUser(token);

    const body = await request.json();
    const { 
      feedbackId, 
      sendEmail = true, 
      carSlug = null, 
      carName = null,
      resolutionNotes = null 
    } = body;

    if (!feedbackId) {
      return NextResponse.json({ error: 'feedbackId is required' }, { status: 400 });
    }

    const FEEDBACK_COLS = 'id, user_id, category, severity, title, description, page_url, browser_info, screenshot_url, status, resolved_at, resolution_notes, created_at';
    
    // Fetch the feedback record
    const { data: feedback, error: fetchError } = await supabaseAdmin
      .from('user_feedback')
      .select(FEEDBACK_COLS)
      .eq('id', feedbackId)
      .single();

    if (fetchError || !feedback) {
      console.error('[Admin/Feedback/Resolve] Feedback not found:', fetchError);
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
    }

    // Resolve car_id from slug if provided (car_slug column no longer exists on user_feedback)
    const carId = carSlug ? await resolveCarId(carSlug) : null;
    
    // Update feedback status to resolved
    const { data: updatedFeedback, error: updateError } = await supabaseAdmin
      .from('user_feedback')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolved_by: authUser.id,
        internal_notes: feedback.internal_notes 
          ? `${feedback.internal_notes}\n\n[Resolved ${new Date().toISOString()}]${resolutionNotes ? `: ${resolutionNotes}` : ''}`
          : resolutionNotes || `Resolved at ${new Date().toISOString()}`,
        // Store the car info if provided (for car_request feedback)
        ...(carId && { car_id: carId }),
      })
      .eq('id', feedbackId)
      .select()
      .single();

    if (updateError) {
      console.error('[Admin/Feedback/Resolve] Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 });
    }

    let emailResult = null;

    // Send thank-you email if requested and user provided an email
    if (sendEmail && feedback.email) {
      const emailFeedbackType = mapFeedbackType(feedback.feedback_type, feedback.category);
      
      // For car_request, use the carSlug/carName provided (car_slug no longer stored in table)
      const finalCarSlug = carSlug || null;
      const finalCarName = carName || null;

      try {
        emailResult = await sendFeedbackResponseEmail({
          to: feedback.email,
          userName: extractNameFromEmail(feedback.email),
          feedbackType: emailFeedbackType,
          carName: finalCarName,
          carSlug: finalCarSlug,
          originalFeedback: feedback.message,
          userId: feedback.user_id || null,
        });

        console.log(`[Admin/Feedback/Resolve] Email ${emailResult.success ? 'sent' : 'failed'} for feedback ${feedbackId}`);
      } catch (emailErr) {
        console.error('[Admin/Feedback/Resolve] Email send error:', emailErr);
        emailResult = { success: false, error: emailErr.message };
      }
    }

    return NextResponse.json({
      success: true,
      feedback: {
        id: updatedFeedback.id,
        status: updatedFeedback.status,
        resolved_at: updatedFeedback.resolved_at,
      },
      email: sendEmail ? {
        sent: emailResult?.success || false,
        recipient: feedback.email || null,
        error: emailResult?.error || null,
        skipped: !feedback.email ? 'No email provided by user' : null,
      } : { skipped: 'Email sending disabled' },
    });

  } catch (err) {
    console.error('[Admin/Feedback/Resolve] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET - Get resolution status for a feedback item
 */
async function handleGet(request) {
  try {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    const { searchParams } = new URL(request.url);
    const feedbackId = searchParams.get('id');

    if (!feedbackId) {
      return NextResponse.json({ error: 'id query param required' }, { status: 400 });
    }

    const { data: feedback, error } = await supabaseAdmin
      .from('user_feedback')
      .select('id, status, resolved_at, resolved_by, feedback_type, category, email, car_id, message')
      .eq('id', feedbackId)
      .single();

    if (error || !feedback) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
    }

    return NextResponse.json({ feedback });
  } catch (err) {
    console.error('[Admin/Feedback/Resolve] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = withErrorLogging(handlePost, { route: 'admin/feedback/resolve', feature: 'admin' });
export const GET = withErrorLogging(handleGet, { route: 'admin/feedback/resolve', feature: 'admin' });
