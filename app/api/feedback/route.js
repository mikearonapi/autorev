/**
 * Feedback API Route
 * 
 * Handles user feedback submissions - stores in Supabase for analytics.
 * Supports both authenticated and anonymous feedback.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client with service role for inserting without RLS restrictions
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

/**
 * POST /api/feedback
 * 
 * Submit user feedback to the database
 * 
 * Body:
 * - feedbackType: 'like' | 'dislike' | 'feature' | 'bug' | 'question' | 'other'
 * - message: string (required)
 * - email: string (optional)
 * - pageUrl: string (optional)
 * - pageTitle: string (optional)
 * - carSlug: string (optional)
 * - buildId: string (optional)
 * - sessionId: string (optional)
 * - browserInfo: object (optional)
 * - screenWidth: number (optional)
 * - screenHeight: number (optional)
 */
export async function POST(request) {
  try {
    const body = await request.json();
    
    const {
      feedbackType,
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
      userId, // Will be passed from client if user is authenticated
    } = body;

    // Validate required fields
    if (!feedbackType || !message) {
      return NextResponse.json(
        { error: 'feedbackType and message are required' },
        { status: 400 }
      );
    }

    // Validate feedback type
    const validTypes = ['like', 'dislike', 'feature', 'bug', 'question', 'car_request', 'other'];
    if (!validTypes.includes(feedbackType)) {
      return NextResponse.json(
        { error: `feedbackType must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Get user agent from headers
    const userAgent = request.headers.get('user-agent') || null;

    // If Supabase is configured, save to database
    if (supabase) {
      const feedbackData = {
        feedback_type: feedbackType,
        message: message.trim(),
        email: email || null,
        page_url: pageUrl || null,
        page_title: pageTitle || null,
        car_slug: carSlug || null,
        build_id: buildId || null,
        user_id: userId || null,
        session_id: sessionId || null,
        user_agent: userAgent,
        browser_info: browserInfo || null,
        screen_width: screenWidth || null,
        screen_height: screenHeight || null,
        status: 'new',
        priority: feedbackType === 'bug' ? 'high' : feedbackType === 'car_request' ? 'normal' : 'normal',
      };

      const { data, error } = await supabase
        .from('user_feedback')
        .insert(feedbackData)
        .select()
        .single();

      if (error) {
        console.error('[Feedback API] Database error:', error);
        // Don't fail the request - fall back to logging
      } else {
        return NextResponse.json({
          success: true,
          feedbackId: data.id,
          message: 'Thank you for your feedback!',
        });
      }
    }

    // Fallback: Send to contact email as backup if Supabase not configured
    try {
      const contactResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: email || 'Anonymous User',
          email: email || 'feedback@autorev.app',
          subject: `[Feedback - ${feedbackType}] ${message.substring(0, 50)}...`,
          message: `Feedback Type: ${feedbackType}\n\nMessage:\n${message}\n\nPage: ${pageUrl || 'N/A'}`,
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
 * Get feedback statistics (for admin dashboard)
 * Requires service role authentication
 */
export async function GET(request) {
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    );
  }

  try {
    // Get summary counts
    const { data: counts, error: countsError } = await supabase
      .rpc('get_feedback_counts');

    if (countsError) {
      throw countsError;
    }

    // Get recent feedback
    const { data: recent, error: recentError } = await supabase
      .from('user_feedback')
      .select('id, feedback_type, message, email, status, priority, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (recentError) {
      throw recentError;
    }

    return NextResponse.json({
      counts: counts || [],
      recent: recent || [],
    });

  } catch (err) {
    console.error('[Feedback API] GET error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch feedback data' },
      { status: 500 }
    );
  }
}

