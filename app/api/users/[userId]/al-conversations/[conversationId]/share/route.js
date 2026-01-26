/**
 * AL Conversation Share API
 * 
 * POST /api/users/[userId]/al-conversations/[conversationId]/share
 * Generates or retrieves a share token for a conversation
 * 
 * DELETE /api/users/[userId]/al-conversations/[conversationId]/share
 * Removes sharing for a conversation
 * 
 * Auth: User must be authenticated and can only share their own conversations
 */

import crypto from 'crypto';

import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

import { getConversation } from '@/lib/alConversationService';
import { errors } from '@/lib/apiErrors';
import { withErrorLogging } from '@/lib/serverErrorLogger';
import { createServerSupabaseClient, getBearerToken, createAuthenticatedClient } from '@/lib/supabaseServer';


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

/**
 * Helper to authenticate and verify user ownership
 */
async function authenticateAndVerify(request, userId) {
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
  
  if (user.id !== userId) {
    return { error: errors.forbidden('Not authorized to share this conversation') };
  }

  return { user };
}

/**
 * Generate a share token for a conversation
 */
async function handlePost(request, { params }) {
  try {
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
      return errors.forbidden('Not authorized to share this conversation');
    }

    // Check if share token already exists
    if (conv.conversation.share_token) {
      return NextResponse.json({
        shareToken: conv.conversation.share_token,
        shareUrl: `${process.env.NEXT_PUBLIC_APP_URL || ''}/shared/al/${conv.conversation.share_token}`,
        success: true,
      });
    }

    // Generate new share token
    const shareToken = crypto.randomBytes(16).toString('hex');

    // Update conversation with share token
    const { error } = await supabaseAdmin
      .from('al_conversations')
      .update({ share_token: shareToken })
      .eq('id', conversationId);

    if (error) {
      console.error('[Share] Failed to update share token:', error);
      return errors.internal('Failed to generate share link');
    }

    return NextResponse.json({
      shareToken,
      shareUrl: `${process.env.NEXT_PUBLIC_APP_URL || ''}/shared/al/${shareToken}`,
      success: true,
    });
  } catch (err) {
    console.error('[Share] Error:', err);
    return errors.internal('Failed to generate share link');
  }
}

/**
 * Remove sharing from a conversation
 */
async function handleDelete(request, { params }) {
  try {
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
      return errors.forbidden('Not authorized to modify this conversation');
    }

    // Remove share token
    const { error } = await supabaseAdmin
      .from('al_conversations')
      .update({ share_token: null })
      .eq('id', conversationId);

    if (error) {
      console.error('[Share] Failed to remove share token:', error);
      return errors.internal('Failed to remove share link');
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Share] Error:', err);
    return errors.internal('Failed to remove share link');
  }
}

// Export wrapped handlers with error logging
export const POST = withErrorLogging(handlePost, { route: 'users/al-conversations/share', feature: 'al' });
export const DELETE = withErrorLogging(handleDelete, { route: 'users/al-conversations/share', feature: 'al' });
