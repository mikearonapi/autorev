/**
 * AL Feedback API Route
 * 
 * Stores user feedback (thumbs up/down) for AL responses.
 * Uses the existing user_feedback table with feature_context: 'al-chat'.
 * 
 * Enhanced to support:
 * - Multi-dimensional ratings (accuracy, completeness, relevance, actionability)
 * - Quick feedback tags
 * - RLHF data snapshots (user_prompt, assistant_response)
 * - Proper FKs to al_conversations and al_messages
 * 
 * @route POST /api/ai-mechanic/feedback
 */

import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabaseServer';
import { withErrorLogging } from '@/lib/serverErrorLogger';

/**
 * POST /api/ai-mechanic/feedback
 * Submit feedback for an AL response
 */
async function handlePost(request) {
  const body = await request.json();
  const {
    conversationId,
    messageIndex,
    rating, // 'positive' or 'negative'
    feedbackText,
    userId,
    // New fields for enhanced feedback
    tags = [],           // ['accurate', 'helpful', 'wrong_info', etc.]
    dimensions = null,   // { accuracy: 4, completeness: 3, ... }
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

  // Initialize enhanced fields
  let alConversationId = null;
  let alMessageId = null;
  let userPromptSnapshot = null;
  let assistantResponseSnapshot = null;

  // If we have a conversationId, fetch context for RLHF snapshots
  if (conversationId && messageIndex !== undefined) {
    try {
      // Get all messages in conversation to find the right ones
      const { data: messages } = await supabase
        .from('al_messages')
        .select('id, role, content, sequence_number')
        .eq('conversation_id', conversationId)
        .order('sequence_number', { ascending: true });

      if (messages && messages.length > 0) {
        alConversationId = conversationId;

        // messageIndex in UI corresponds to all messages (user + assistant interleaved)
        // Find the assistant message at this index
        if (messageIndex < messages.length) {
          const targetMessage = messages[messageIndex];
          
          if (targetMessage && targetMessage.role === 'assistant') {
            alMessageId = targetMessage.id;
            assistantResponseSnapshot = targetMessage.content;

            // Find the preceding user message for the prompt snapshot
            // Look backwards for the previous user message
            for (let i = messageIndex - 1; i >= 0; i--) {
              if (messages[i].role === 'user') {
                userPromptSnapshot = messages[i].content;
                break;
              }
            }
          }
        }
      }
    } catch (err) {
      // Best-effort, don't fail the request
      console.warn('[AL Feedback] Could not fetch message context:', err);
    }
  }

  // Build the feedback message from tags and text
  let message = feedbackText || '';
  if (tags.length > 0) {
    const tagStr = tags.join(', ');
    message = message ? `${message} [Tags: ${tagStr}]` : `[Tags: ${tagStr}]`;
  }
  if (!message) {
    message = rating === 'positive' ? 'Helpful response' : 'Unhelpful response';
  }

  // Build the insert payload
  const insertPayload = {
    user_id: userId,
    feedback_type: 'al-feedback',
    message,
    category: rating === 'positive' ? 'praise' : 'general',
    feature_context: 'al-chat',
    rating: ratingValue,
    page_url: `/al-conversation/${conversationId || 'unknown'}`,
    browser_info: {
      conversationId,
      messageIndex,
      feedbackRating: rating,
    },
    tags: tags.length > 0 ? tags : null,
    // New fields for continuous learning
    al_conversation_id: alConversationId,
    al_message_id: alMessageId,
    user_prompt_snapshot: userPromptSnapshot,
    assistant_response_snapshot: assistantResponseSnapshot,
  };

  // Add dimension ratings if provided
  if (dimensions) {
    if (dimensions.accuracy !== undefined) {
      insertPayload.accuracy_rating = dimensions.accuracy;
    }
    if (dimensions.completeness !== undefined) {
      insertPayload.completeness_rating = dimensions.completeness;
    }
    if (dimensions.relevance !== undefined) {
      insertPayload.relevance_rating = dimensions.relevance;
    }
    if (dimensions.actionability !== undefined) {
      insertPayload.actionability_rating = dimensions.actionability;
    }
  }

  // Insert feedback into user_feedback table
  const { data, error } = await supabase
    .from('user_feedback')
    .insert(insertPayload)
    .select('id')
    .single();

  if (error) {
    console.error('[AL Feedback] Insert error:', error);
    return NextResponse.json(
      { error: 'Failed to save feedback' },
      { status: 500 }
    );
  }

  console.info(`[AL Feedback] Saved ${rating} feedback for conversation ${conversationId}, messageIndex ${messageIndex}${tags.length > 0 ? `, tags: ${tags.join(', ')}` : ''}${dimensions ? ', with dimensions' : ''}`);

  return NextResponse.json({
    success: true,
    feedbackId: data?.id,
    hasSnapshots: !!(userPromptSnapshot && assistantResponseSnapshot),
  });
}

/**
 * GET /api/ai-mechanic/feedback
 * Get feedback stats (admin only, future use)
 */
async function handleGet(request) {
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

export const POST = withErrorLogging(handlePost, { route: 'ai-mechanic/feedback', feature: 'al' });
export const GET = withErrorLogging(handleGet, { route: 'ai-mechanic/feedback', feature: 'al' });












