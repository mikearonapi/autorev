/**
 * AL Feedback API Route
 *
 * Handles submission of user feedback on AL responses.
 *
 * @route POST /api/al/feedback
 */

import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

import { recordFeedback } from '@/lib/alFeedbackService';
import { errors } from '@/lib/apiErrors';
import { rateLimit } from '@/lib/rateLimit';
import {
  alFeedbackSchema,
  validateWithSchema,
  validationErrorResponse,
} from '@/lib/schemas/index.js';
import { withErrorLogging } from '@/lib/serverErrorLogger';

/**
 * Get authenticated user from request
 */
async function getAuthUser(request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) return null;

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      // Try cookie-based auth
      const cookieHeader = request.headers.get('cookie');
      if (!cookieHeader) return null;

      const supabase = createClient(supabaseUrl, supabaseKey, {
        global: {
          headers: { cookie: cookieHeader },
        },
      });

      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    }

    const token = authHeader.substring(7);
    const supabase = createClient(supabaseUrl, supabaseKey);
    const {
      data: { user },
    } = await supabase.auth.getUser(token);
    return user;
  } catch {
    return null;
  }
}

async function handlePost(request) {
  // Rate limit - form preset (5 req/min)
  const limited = rateLimit(request, 'form');
  if (limited) return limited;

  const body = await request.json();

  // Validate with Zod schema
  const validation = validateWithSchema(alFeedbackSchema, body);
  if (!validation.success) {
    return validationErrorResponse(validation.errors);
  }

  const {
    messageId,
    conversationId,
    feedbackType,
    feedbackCategory,
    feedbackReason,
    queryText,
    responseText,
    toolsUsed,
    carContextSlug,
    agentType,
    promptVersionId,
  } = validation.data;

  // Get user (optional - allow anonymous feedback)
  const user = await getAuthUser(request);
  const userId = user?.id || null;

  // Record feedback
  const result = await recordFeedback({
    conversationId,
    messageId,
    userId,
    feedbackType,
    feedbackReason,
    feedbackCategory,
    queryText,
    responseText,
    toolsUsed: toolsUsed || [],
    carContextSlug,
    agentType,
    promptVersionId,
  });

  if (!result.success) {
    return errors.internal(result.error || 'Failed to record feedback');
  }

  return NextResponse.json({
    success: true,
    feedbackId: result.feedbackId,
  });
}

export const POST = withErrorLogging(handlePost, { route: 'al/feedback', feature: 'al' });
