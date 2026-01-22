/**
 * AL Conversation Share API
 * 
 * POST /api/users/[userId]/al-conversations/[conversationId]/share
 * Generates or retrieves a share token for a conversation
 * 
 * DELETE /api/users/[userId]/al-conversations/[conversationId]/share
 * Removes sharing for a conversation
 */

import { NextResponse } from 'next/server';
import { getConversation } from '@/lib/alConversationService';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

/**
 * Generate a share token for a conversation
 */
export async function POST(request, { params }) {
  try {
    const { userId, conversationId } = await params;
    
    if (!userId || !conversationId) {
      return NextResponse.json(
        { error: 'User ID and Conversation ID are required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const conv = await getConversation(conversationId);
    if (!conv.success || conv.conversation.user_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
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
      return NextResponse.json(
        { error: 'Failed to generate share link' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      shareToken,
      shareUrl: `${process.env.NEXT_PUBLIC_APP_URL || ''}/shared/al/${shareToken}`,
      success: true,
    });
  } catch (err) {
    console.error('[Share] Error:', err);
    return NextResponse.json(
      { error: 'Failed to generate share link' },
      { status: 500 }
    );
  }
}

/**
 * Remove sharing from a conversation
 */
export async function DELETE(request, { params }) {
  try {
    const { userId, conversationId } = await params;
    
    if (!userId || !conversationId) {
      return NextResponse.json(
        { error: 'User ID and Conversation ID are required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const conv = await getConversation(conversationId);
    if (!conv.success || conv.conversation.user_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Remove share token
    const { error } = await supabaseAdmin
      .from('al_conversations')
      .update({ share_token: null })
      .eq('id', conversationId);

    if (error) {
      console.error('[Share] Failed to remove share token:', error);
      return NextResponse.json(
        { error: 'Failed to remove share link' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Share] Error:', err);
    return NextResponse.json(
      { error: 'Failed to remove share link' },
      { status: 500 }
    );
  }
}
