/**
 * Feedback API Route
 * 
 * Handles user feedback submissions - stores in Supabase for analytics.
 * Supports both authenticated and anonymous feedback.
 * 
 * Enhanced for beta feedback collection with:
 * - Category classification (bug, feature, data, general, praise)
 * - Severity tracking for bugs (blocking, major, minor)
 * - Auto-capture of user tier and context
 * - Optional rating
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Server-side Supabase client with service role for inserting without RLS restrictions
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Valid enum values
const VALID_CATEGORIES = ['bug', 'feature', 'data', 'general', 'praise'];
const VALID_SEVERITIES = ['blocking', 'major', 'minor'];
const VALID_FEEDBACK_TYPES = ['like', 'dislike', 'feature', 'bug', 'question', 'car_request', 'other'];
const VALID_TIERS = ['free', 'collector', 'tuner', 'admin'];

/**
 * POST /api/feedback
 * 
 * Submit user feedback to the database
 * 
 * Body:
 * - message: string (required)
 * - category: 'bug' | 'feature' | 'data' | 'general' | 'praise' (required for beta)
 * - severity: 'blocking' | 'major' | 'minor' (required if category='bug')
 * - rating: number 1-5 (optional)
 * - email: string (optional)
 * 
 * Auto-captured:
 * - pageUrl, pageTitle, carSlug from client
 * - userTier from session
 * - browserInfo from client
 * 
 * Legacy fields (still supported):
 * - feedbackType: 'like' | 'dislike' | 'feature' | 'bug' | 'question' | 'car_request' | 'other'
 */
export async function POST(request) {
  try {
    const body = await request.json();
    
    const {
      // New beta fields
      category,
      severity,
      rating,
      featureContext,
      carContext,
      
      // Legacy fields (still supported)
      feedbackType,
      
      // Common fields
      message,
      email,
      pageUrl,
      pageTitle,
      carSlug,
      buildId,
      sessionId,
      browserInfo,
      screenWidth,
      screenHeight,
      userId,
      userTier: clientUserTier, // From client (may be overridden by session)
    } = body;

    // Validate required fields
    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'message is required' },
        { status: 400 }
      );
    }

    // Validate category if provided
    if (category && !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: `category must be one of: ${VALID_CATEGORIES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate severity (required if category is 'bug')
    if (category === 'bug' && !severity) {
      return NextResponse.json(
        { error: 'severity is required for bug reports (blocking, major, minor)' },
        { status: 400 }
      );
    }

    if (severity && !VALID_SEVERITIES.includes(severity)) {
      return NextResponse.json(
        { error: `severity must be one of: ${VALID_SEVERITIES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate rating if provided
    if (rating !== undefined && rating !== null) {
      const ratingNum = parseInt(rating, 10);
      if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        return NextResponse.json(
          { error: 'rating must be between 1 and 5' },
          { status: 400 }
        );
      }
    }

    // Legacy: validate feedback type if provided
    if (feedbackType && !VALID_FEEDBACK_TYPES.includes(feedbackType)) {
      return NextResponse.json(
        { error: `feedbackType must be one of: ${VALID_FEEDBACK_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Try to get authenticated user and their tier
    let authenticatedUserId = userId;
    let userTier = clientUserTier;
    
    try {
      const cookieStore = cookies();
      const supabaseAuth = createRouteHandlerClient({ cookies: () => cookieStore });
      const { data: { session } } = await supabaseAuth.auth.getSession();
      
      if (session?.user) {
        authenticatedUserId = session.user.id;
        
        // Fetch user tier from user_profiles
        if (supabase) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('subscription_tier')
            .eq('id', session.user.id)
            .single();
          
          if (profile?.subscription_tier) {
            userTier = profile.subscription_tier;
          }
        }
      }
    } catch (authError) {
      // Non-critical - continue with provided userId/tier
      console.warn('[Feedback API] Auth check failed:', authError.message);
    }

    // Validate user tier if provided
    if (userTier && !VALID_TIERS.includes(userTier)) {
      userTier = null; // Invalid tier, don't store
    }

    // Get user agent from headers
    const userAgent = request.headers.get('user-agent') || null;

    // Derive car context from URL if not provided
    let resolvedCarContext = carContext || carSlug;
    if (!resolvedCarContext && pageUrl) {
      // Extract car slug from URLs like /browse-cars/718-cayman-gt4
      const carMatch = pageUrl.match(/\/browse-cars\/([^/?#]+)/);
      if (carMatch) {
        resolvedCarContext = carMatch[1];
      }
    }

    // Map category to legacy feedbackType if needed
    const derivedFeedbackType = feedbackType || (category === 'bug' ? 'bug' : 
      category === 'feature' ? 'feature' : 
      category === 'data' ? 'other' :
      category === 'praise' ? 'like' :
      'other');

    // Determine priority based on category and severity
    let priority = 'normal';
    if (category === 'bug') {
      if (severity === 'blocking') priority = 'urgent';
      else if (severity === 'major') priority = 'high';
    }

    // If Supabase is configured, save to database
    if (supabase) {
      const feedbackData = {
        // New beta fields
        category: category || 'general',
        severity: category === 'bug' ? severity : null,
        rating: rating ? parseInt(rating, 10) : null,
        feature_context: featureContext || null,
        user_tier: userTier || null,
        
        // Legacy fields (for backwards compatibility)
        feedback_type: derivedFeedbackType,
        
        // Common fields
        message: message.trim(),
        email: email || null,
        page_url: pageUrl || null,
        page_title: pageTitle || null,
        car_slug: resolvedCarContext || null,
        build_id: buildId || null,
        user_id: authenticatedUserId || null,
        session_id: sessionId || null,
        user_agent: userAgent,
        browser_info: browserInfo || null,
        screen_width: screenWidth || null,
        screen_height: screenHeight || null,
        status: 'new',
        priority,
      };

      const { data, error } = await supabase
        .from('user_feedback')
        .insert(feedbackData)
        .select()
        .single();

      if (error) {
        console.error('[Feedback API] Database error:', error);
        // Continue to fallback below
      } else {
        return NextResponse.json({
          success: true,
          feedbackId: data.id,
          message: 'Thank you for your feedback!',
        });
      }
    }

    // Fallback: Send to contact email as backup if Supabase not configured/failed
    try {
      const contactResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: email || 'Anonymous User',
          email: email || 'feedback@autorev.app',
          subject: `[Feedback - ${category || feedbackType}] ${message.substring(0, 50)}...`,
          message: `Category: ${category || 'N/A'}\nSeverity: ${severity || 'N/A'}\nType: ${feedbackType || 'N/A'}\n\nMessage:\n${message}\n\nPage: ${pageUrl || 'N/A'}\nCar: ${resolvedCarContext || 'N/A'}\nTier: ${userTier || 'anonymous'}`,
          source: 'feedback-api-fallback',
        }),
      });
      
      if (!contactResponse.ok) {
        console.warn('[Feedback API] Contact API fallback failed');
      }
    } catch (contactError) {
      console.error('[Feedback API] Contact fallback error:', contactError);
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you for your feedback!',
    });

  } catch (err) {
    console.error('[Feedback API] Error:', err);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/feedback
 * 
 * Get feedback with optional filters (for admin dashboard)
 * Requires service role authentication
 * 
 * Query params:
 * - category: Filter by category
 * - severity: Filter by severity
 * - status: Filter by status
 * - limit: Max results (default 50)
 * - unresolved: If 'true', only show unresolved feedback
 */
export async function GET(request) {
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const categoryFilter = searchParams.get('category');
    const severityFilter = searchParams.get('severity');
    const statusFilter = searchParams.get('status');
    const unresolvedOnly = searchParams.get('unresolved') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Get summary counts
    const { data: counts, error: countsError } = await supabase
      .rpc('get_feedback_counts');

    if (countsError) {
      console.warn('[Feedback API] Counts error:', countsError);
    }

    // Build query with filters
    let query = supabase
      .from('user_feedback')
      .select(`
        id, 
        category,
        severity,
        feedback_type, 
        message, 
        email, 
        status, 
        priority,
        rating,
        user_tier,
        car_slug,
        feature_context,
        page_url,
        browser_info,
        resolved_at,
        resolved_by,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Apply filters
    if (categoryFilter) {
      query = query.eq('category', categoryFilter);
    }
    if (severityFilter) {
      query = query.eq('severity', severityFilter);
    }
    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }
    if (unresolvedOnly) {
      query = query.is('resolved_at', null);
    }

    const { data: recent, error: recentError } = await query;

    if (recentError) {
      throw recentError;
    }

    // Get category summary
    const { data: categorySummary, error: categoryError } = await supabase
      .from('user_feedback')
      .select('category, severity')
      .is('resolved_at', null);

    // Calculate category counts manually
    const categoryStats = {};
    if (categorySummary) {
      categorySummary.forEach(item => {
        const cat = item.category || 'general';
        if (!categoryStats[cat]) {
          categoryStats[cat] = { total: 0, blocking: 0, major: 0, minor: 0 };
        }
        categoryStats[cat].total++;
        if (item.severity) {
          categoryStats[cat][item.severity]++;
        }
      });
    }

    return NextResponse.json({
      counts: counts || [],
      categoryStats,
      recent: recent || [],
      filters: {
        category: categoryFilter,
        severity: severityFilter,
        status: statusFilter,
        unresolved: unresolvedOnly,
      },
    });

  } catch (err) {
    console.error('[Feedback API] GET error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch feedback data' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/feedback
 * 
 * Update feedback status or mark as resolved
 * Requires authenticated admin
 * 
 * Body:
 * - feedbackId: UUID (required)
 * - status: string (optional)
 * - resolved: boolean (optional) - if true, marks as resolved
 * - internalNotes: string (optional)
 */
export async function PATCH(request) {
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    );
  }

  try {
    // Get authenticated user
    const cookieStore = cookies();
    const supabaseAuth = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabaseAuth.auth.getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('id', session.user.id)
      .single();

    if (profile?.subscription_tier !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { feedbackId, status, resolved, internalNotes } = body;

    if (!feedbackId) {
      return NextResponse.json(
        { error: 'feedbackId is required' },
        { status: 400 }
      );
    }

    // Build update object
    const updateData = {
      updated_at: new Date().toISOString(),
    };

    if (status) {
      updateData.status = status;
    }

    if (resolved === true) {
      updateData.resolved_at = new Date().toISOString();
      updateData.resolved_by = session.user.id;
      updateData.status = 'resolved';
    } else if (resolved === false) {
      updateData.resolved_at = null;
      updateData.resolved_by = null;
    }

    if (internalNotes !== undefined) {
      updateData.internal_notes = internalNotes;
    }

    const { data, error } = await supabase
      .from('user_feedback')
      .update(updateData)
      .eq('id', feedbackId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      feedback: data,
    });

  } catch (err) {
    console.error('[Feedback API] PATCH error:', err);
    return NextResponse.json(
      { error: 'Failed to update feedback' },
      { status: 500 }
    );
  }
}
