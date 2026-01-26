/**
 * User AL Conversations API
 * 
 * GET /api/users/[userId]/al-conversations
 * Returns the user's conversation history
 * 
 * Auth: User must be authenticated and can only access their own conversations
 */

import { NextResponse } from 'next/server';

import { getUserConversations } from '@/lib/alConversationService';
import { errors } from '@/lib/apiErrors';
import { withErrorLogging } from '@/lib/serverErrorLogger';
import { createServerSupabaseClient, getBearerToken, createAuthenticatedClient } from '@/lib/supabaseServer';

async function handleGet(request, { params }) {
  try {
    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    
    if (!userId) {
      return errors.missingField('userId');
    }

    // Get authenticated user
    const bearerToken = getBearerToken(request);
    const authSupabase = bearerToken 
      ? createAuthenticatedClient(bearerToken) 
      : await createServerSupabaseClient();

    if (!authSupabase) {
      return errors.serviceUnavailable('Authentication service');
    }

    const { data: { user }, error: authError } = bearerToken
      ? await authSupabase.auth.getUser(bearerToken)
      : await authSupabase.auth.getUser();
    
    if (authError || !user) {
      return errors.unauthorized();
    }
    
    // Verify the authenticated user matches the userId param (IDOR protection)
    if (user.id !== userId) {
      return errors.forbidden('Not authorized to access this user\'s conversations');
    }

    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const includeArchived = searchParams.get('includeArchived') === 'true';
    const carSlug = searchParams.get('carSlug') || null;

    const result = await getUserConversations(userId, {
      limit,
      offset,
      includeArchived,
      carSlug,
    });

    return NextResponse.json({
      conversations: result.conversations,
      total: result.total,
      success: result.success,
    });
  } catch (err) {
    console.error('[AL Conversations API] Error:', err);
    return errors.internal('Failed to fetch conversations');
  }
}

export const GET = withErrorLogging(handleGet, { route: 'users/[userId]/al-conversations', feature: 'al' });






















