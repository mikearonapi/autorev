/**
 * Admin Batch Feedback Resolution API
 * 
 * Resolves multiple feedback items at once, useful after car pipeline completion.
 * Sends thank-you emails to all users who provided their email.
 * 
 * POST /api/admin/feedback/resolve-batch
 * 
 * Body:
 * - feedbackIds: UUID[] - Array of feedback IDs to resolve
 * - carSlug: string - Car slug for car_request feedback
 * - carName: string - Car name for the email (e.g., "2024 BMW M3 CS")
 * - sendEmails: boolean - Whether to send thank-you emails (default: true)
 * 
 * OR for auto-matching car requests:
 * 
 * - autoMatch: true - Auto-resolve all car_request feedback matching the car
 * - carSlug: string - Car slug to match against feedback.car_slug or message
 * - carName: string - Car name for the email
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdminEmail } from '@/lib/adminAccess';
import { sendFeedbackResponseEmail } from '@/lib/emailService';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

/**
 * Verify admin access via Bearer token
 */
async function verifyAdmin(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return { error: 'Missing authorization header', status: 401 };
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user || !isAdminEmail(user.email)) {
      return { error: 'Admin access required', status: 403 };
    }

    return { user };
  } catch (err) {
    console.error('[Admin/Feedback/ResolveBatch] Auth check error:', err);
    return { error: 'Authentication failed', status: 500 };
  }
}

/**
 * Extract a user-friendly name from email
 */
function extractNameFromEmail(email) {
  if (!email) return null;
  const localPart = email.split('@')[0];
  return localPart.split(/[._]/)[0];
}

export async function POST(request) {
  try {
    // Verify admin access
    const auth = await verifyAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { 
      feedbackIds = [], 
      autoMatch = false,
      carSlug, 
      carName,
      sendEmails = true,
    } = body;

    if (!carSlug && !carName && feedbackIds.length === 0) {
      return NextResponse.json({ 
        error: 'Either feedbackIds array or carSlug/carName for auto-match is required' 
      }, { status: 400 });
    }

    let feedbackToResolve = [];

    // Auto-match mode: find all car_request feedback related to this car
    if (autoMatch && carSlug) {
      // Normalize the car slug for search (e.g., "bmw-m3-cs-2024" → "bmw m3 cs 2024")
      const searchTerms = carSlug.replace(/-/g, ' ').toLowerCase();
      const carNameSearch = carName?.toLowerCase() || '';
      
      // Find unresolved car_request feedback that might match
      const { data: matches, error: matchError } = await supabaseAdmin
        .from('user_feedback')
        .select('*')
        .eq('feedback_type', 'car_request')
        .is('resolved_at', null)
        .not('status', 'eq', 'resolved');

      if (matchError) {
        console.error('[Admin/Feedback/ResolveBatch] Match error:', matchError);
        return NextResponse.json({ error: 'Failed to find matching feedback' }, { status: 500 });
      }

      // Filter matches - look for car mentions in the message
      feedbackToResolve = (matches || []).filter(f => {
        const messageLower = (f.message || '').toLowerCase();
        const carSlugMatch = f.car_slug === carSlug;
        const messageMatch = searchTerms.split(' ').some(term => 
          term.length > 2 && messageLower.includes(term)
        );
        const nameMatch = carNameSearch && 
          carNameSearch.split(' ').some(term => 
            term.length > 2 && messageLower.includes(term)
          );
        
        return carSlugMatch || messageMatch || nameMatch;
      });

      console.log(`[Admin/Feedback/ResolveBatch] Auto-matched ${feedbackToResolve.length} feedback items for ${carSlug}`);
    } else {
      // Manual mode: resolve specific feedback IDs
      if (feedbackIds.length === 0) {
        return NextResponse.json({ error: 'feedbackIds array is required' }, { status: 400 });
      }

      const { data: feedbacks, error: fetchError } = await supabaseAdmin
        .from('user_feedback')
        .select('*')
        .in('id', feedbackIds);

      if (fetchError) {
        console.error('[Admin/Feedback/ResolveBatch] Fetch error:', fetchError);
        return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
      }

      feedbackToResolve = feedbacks || [];
    }

    if (feedbackToResolve.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No feedback found to resolve',
        resolved: 0,
        emailsSent: 0,
      });
    }

    // Resolve all feedback items
    const resolvedIds = feedbackToResolve.map(f => f.id);
    const resolutionNote = `\n\n[Batch resolved ${new Date().toISOString()}] Car added: ${carName || carSlug}`;
    
    // Update each feedback item (need to handle internal_notes concatenation individually)
    for (const feedback of feedbackToResolve) {
      await supabaseAdmin
        .from('user_feedback')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: auth.user.id,
          car_slug: carSlug || feedback.car_slug,
          internal_notes: (feedback.internal_notes || '') + resolutionNote,
        })
        .eq('id', feedback.id);
    }
    
    const updateError = null; // Errors handled individually above

    if (updateError) {
      console.error('[Admin/Feedback/ResolveBatch] Update error:', updateError);
      // Continue anyway to try to send emails for ones that might have updated
    }

    // Send emails
    const emailResults = {
      sent: 0,
      failed: 0,
      skipped: 0,
      details: [],
    };

    if (sendEmails) {
      for (const feedback of feedbackToResolve) {
        if (!feedback.email) {
          emailResults.skipped++;
          emailResults.details.push({
            feedbackId: feedback.id,
            status: 'skipped',
            reason: 'No email provided',
          });
          continue;
        }

        try {
          const result = await sendFeedbackResponseEmail({
            to: feedback.email,
            userName: extractNameFromEmail(feedback.email),
            feedbackType: 'car_request',
            carName: carName,
            carSlug: carSlug,
            originalFeedback: feedback.message,
            userId: feedback.user_id || null,
          });

          if (result.success) {
            emailResults.sent++;
            emailResults.details.push({
              feedbackId: feedback.id,
              email: feedback.email,
              status: 'sent',
              emailId: result.id,
            });
          } else {
            emailResults.failed++;
            emailResults.details.push({
              feedbackId: feedback.id,
              email: feedback.email,
              status: 'failed',
              error: result.error,
            });
          }
        } catch (err) {
          emailResults.failed++;
          emailResults.details.push({
            feedbackId: feedback.id,
            email: feedback.email,
            status: 'failed',
            error: err.message,
          });
        }

        // Small delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return NextResponse.json({
      success: true,
      resolved: resolvedIds.length,
      carSlug,
      carName,
      emails: emailResults,
    });

  } catch (err) {
    console.error('[Admin/Feedback/ResolveBatch] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET - Preview which feedback would be auto-matched
 */
export async function GET(request) {
  try {
    const auth = await verifyAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const carSlug = searchParams.get('carSlug');
    const carName = searchParams.get('carName');

    if (!carSlug) {
      return NextResponse.json({ error: 'carSlug query param required' }, { status: 400 });
    }

    // Find unresolved car_request feedback
    const { data: matches, error } = await supabaseAdmin
      .from('user_feedback')
      .select('id, email, message, created_at, car_slug')
      .eq('feedback_type', 'car_request')
      .is('resolved_at', null)
      .not('status', 'eq', 'resolved');

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
    }

    // Filter for potential matches
    const searchTerms = carSlug.replace(/-/g, ' ').toLowerCase();
    const carNameSearch = carName?.toLowerCase() || '';

    const potentialMatches = (matches || []).filter(f => {
      const messageLower = (f.message || '').toLowerCase();
      const carSlugMatch = f.car_slug === carSlug;
      const messageMatch = searchTerms.split(' ').some(term => 
        term.length > 2 && messageLower.includes(term)
      );
      const nameMatch = carNameSearch && 
        carNameSearch.split(' ').some(term => 
          term.length > 2 && messageLower.includes(term)
        );
      
      return carSlugMatch || messageMatch || nameMatch;
    });

    return NextResponse.json({
      carSlug,
      carName,
      totalUnresolvedCarRequests: matches?.length || 0,
      potentialMatches: potentialMatches.length,
      matches: potentialMatches.map(m => ({
        id: m.id,
        hasEmail: !!m.email,
        message: m.message?.slice(0, 100) + (m.message?.length > 100 ? '...' : ''),
        created_at: m.created_at,
      })),
    });
  } catch (err) {
    console.error('[Admin/Feedback/ResolveBatch] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
