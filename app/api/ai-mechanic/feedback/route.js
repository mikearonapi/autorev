/**
 * AL Feedback API Route
 * 
 * Stores user feedback (thumbs up/down) for AL responses.
 * Uses the existing user_feedback table with feature_context: 'al-chat'.
 * 
 * @route POST /api/ai-mechanic/feedback
 */

import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabaseServer';

/**
 * POST /api/ai-mechanic/feedback
 * Submit feedback for an AL response
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      conversationId,
      messageIndex,
      rating, // 'positive' or 'negative'
      feedbackText,
      userId,
    } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

    if (!rating || !['positive', 'negative'].includes(rating)) {
      return NextResponse.json(
        { error: 'Valid rating required (positive or negative)' },
        { status: 400 }
      );
    }

    // Get shared Supabase client with service role for insert
    const supabase = getServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    // Map rating to numeric value for the rating column
    const ratingValue = rating === 'positive' ? 5 : 1;

    // Insert feedback into user_feedback table
    const { data, error } = await supabase
      .from('user_feedback')
      .insert({
        user_id: userId,
        feedback_type: 'al-feedback',
        message: feedbackText || (rating === 'positive' ? 'Helpful response' : 'Unhelpful response'),
        category: rating === 'positive' ? 'praise' : 'general',
        feature_context: 'al-chat',
        rating: ratingValue,
        page_url: `/al-conversation/${conversationId || 'unknown'}`,
        browser_info: {
          conversationId,
          messageIndex,
          feedbackRating: rating,
        },
      })
      .select('id')
      .single();

    if (error) {
      console.error('[AL Feedback] Insert error:', error);
      return NextResponse.json(
        { error: 'Failed to save feedback' },
        { status: 500 }
      );
    }

    // If we have a conversationId and messageIndex, try to update the al_messages table
    // to link the feedback (if the column exists)
    if (conversationId && messageIndex !== undefined) {
      try {
        // Get the message by sequence_number (which corresponds to messageIndex for display)
        // Note: we need to calculate sequence_number from messageIndex
        // messageIndex includes both user and assistant messages, so we need to find the right one
        const { data: msgData } = await supabase
          .from('al_messages')
          .select('id')
          .eq('conversation_id', conversationId)
          .eq('role', 'assistant')
          .order('sequence_number', { ascending: true });
        
        // The messageIndex in the UI corresponds to the order of all messages
        // For now, we just log this for tracking
        console.info(`[AL Feedback] Feedback ${rating} for conversation ${conversationId}, messageIndex ${messageIndex}`);
      } catch (err) {
        // Best-effort, don't fail the request
        console.warn('[AL Feedback] Could not link to message:', err);
      }
    }

    return NextResponse.json({
      success: true,
      feedbackId: data?.id,
    });

  } catch (err) {
    console.error('[AL Feedback] Error:', err);
    return NextResponse.json(
      { error: 'Failed to process feedback' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai-mechanic/feedback
 * Get feedback stats (admin only, future use)
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get('conversationId');

  if (!conversationId) {
    return NextResponse.json(
      { error: 'Conversation ID required' },
      { status: 400 }
    );
  }

  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('user_feedback')
    .select('id, rating, message, created_at, browser_info')
    .eq('feature_context', 'al-chat')
    .contains('browser_info', { conversationId })
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('[AL Feedback] Query error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    feedback: data || [],
  });
}












