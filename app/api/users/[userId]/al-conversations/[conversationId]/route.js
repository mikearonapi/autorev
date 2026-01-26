/**
 * Single AL Conversation API
 * 
 * GET /api/users/[userId]/al-conversations/[conversationId]
 * Returns a specific conversation with all messages
 * 
 * DELETE /api/users/[userId]/al-conversations/[conversationId]
 * Deletes a conversation
 * 
 * PATCH /api/users/[userId]/al-conversations/[conversationId]
 * Updates conversation (title, archive, pin)
 * 
 * Auth: User must be authenticated and can only access their own conversations
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient, getBearerToken, createAuthenticatedClient } from '@/lib/supabaseServer';
import { errors } from '@/lib/apiErrors';
import {
  getConversation,
  deleteConversation,
  updateConversationTitle,
  archiveConversation,
  pinConversation,
} from '@/lib/alConversationService';
import { withErrorLogging } from '@/lib/serverErrorLogger';

/**
 * Helper to authenticate and verify user ownership
 */
async function authenticateAndVerify(request, userId) {
  // Get authenticated user
  const bearerToken = getBearerToken(request);
  const authSupabase = bearerToken 
    ? createAuthenticatedClient(bearerToken) 
    : await createServerSupabaseClient();

  if (!authSupabase) {
    return { error: errors.serviceUnavailable('Authentication service') };
  }

  const { data: { user }, error: authError } = bearerToken
    ? await authSupabase.auth.getUser(bearerToken)
    : await authSupabase.auth.getUser();
  
  if (authError || !user) {
    return { error: errors.unauthorized() };
  }
  
  // Verify the authenticated user matches the userId param (IDOR protection)
  if (user.id !== userId) {
    return { error: errors.forbidden('Not authorized to access this conversation') };
  }

  return { user };
}

async function handleGet(request, { params }) {
  const { userId, conversationId } = await params;
    
  if (!userId || !conversationId) {
    return errors.badRequest('User ID and Conversation ID are required');
  }

  // Authenticate user
  const auth = await authenticateAndVerify(request, userId);
  if (auth.error) return auth.error;

  const result = await getConversation(conversationId);

  if (!result.success) {
    return errors.notFound('Conversation');
  }

  // Verify conversation belongs to this user
  if (result.conversation.user_id !== userId) {
    return errors.forbidden('Not authorized to access this conversation');
  }

  return NextResponse.json({
    conversation: result.conversation,
    messages: result.messages,
    success: true,
  });
}

async function handleDelete(request, { params }) {
  const { userId, conversationId } = await params;
    
  if (!userId || !conversationId) {
    return errors.badRequest('User ID and Conversation ID are required');
  }

  // Authenticate user
  const auth = await authenticateAndVerify(request, userId);
  if (auth.error) return auth.error;

  // Verify conversation ownership
  const conv = await getConversation(conversationId);
  if (!conv.success) {
    return errors.notFound('Conversation');
  }
  if (conv.conversation.user_id !== userId) {
    return errors.forbidden('Not authorized to delete this conversation');
  }

  const result = await deleteConversation(conversationId);

  if (!result.success) {
    return errors.internal('Failed to delete conversation');
  }

  return NextResponse.json({ success: true });
}

async function handlePatch(request, { params }) {
  const { userId, conversationId } = await params;
  const body = await request.json();
  
  if (!userId || !conversationId) {
    return errors.badRequest('User ID and Conversation ID are required');
  }

  // Authenticate user
  const auth = await authenticateAndVerify(request, userId);
  if (auth.error) return auth.error;

  // Verify conversation ownership
  const conv = await getConversation(conversationId);
  if (!conv.success) {
    return errors.notFound('Conversation');
  }
  if (conv.conversation.user_id !== userId) {
    return errors.forbidden('Not authorized to modify this conversation');
  }

  // Handle different update types
  if (body.title !== undefined) {
    const result = await updateConversationTitle(conversationId, body.title);
    if (!result.success) {
      return errors.internal('Failed to update conversation title');
    }
  }

  if (body.archived !== undefined) {
    const result = await archiveConversation(conversationId);
    if (!result.success) {
      return errors.internal('Failed to archive conversation');
    }
  }

  if (body.pinned !== undefined) {
    const result = await pinConversation(conversationId, body.pinned);
    if (!result.success) {
      return errors.internal('Failed to update pin status');
    }
  }

  return NextResponse.json({ success: true });
}

export const GET = withErrorLogging(handleGet, { route: 'users/al-conversations/[id]', feature: 'al' });
export const DELETE = withErrorLogging(handleDelete, { route: 'users/al-conversations/[id]', feature: 'al' });
export const PATCH = withErrorLogging(handlePatch, { route: 'users/al-conversations/[id]', feature: 'al' });






















