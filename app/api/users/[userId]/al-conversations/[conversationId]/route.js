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
 */

import { NextResponse } from 'next/server';
import {
  getConversation,
  deleteConversation,
  updateConversationTitle,
  archiveConversation,
  pinConversation,
} from '@/lib/alConversationService';

export async function GET(request, { params }) {
  try {
    const { userId, conversationId } = await params;
    
    if (!userId || !conversationId) {
      return NextResponse.json(
        { error: 'User ID and Conversation ID are required' },
        { status: 400 }
      );
    }

    const result = await getConversation(conversationId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Conversation not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (result.conversation.user_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      conversation: result.conversation,
      messages: result.messages,
      success: true,
    });
  } catch (err) {
    console.error('[AL Conversation API] GET Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { userId, conversationId } = await params;
    
    if (!userId || !conversationId) {
      return NextResponse.json(
        { error: 'User ID and Conversation ID are required' },
        { status: 400 }
      );
    }

    // First verify ownership
    const conv = await getConversation(conversationId);
    if (!conv.success || conv.conversation.user_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const result = await deleteConversation(conversationId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to delete' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[AL Conversation API] DELETE Error:', err);
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { userId, conversationId } = await params;
    const body = await request.json();
    
    if (!userId || !conversationId) {
      return NextResponse.json(
        { error: 'User ID and Conversation ID are required' },
        { status: 400 }
      );
    }

    // First verify ownership
    const conv = await getConversation(conversationId);
    if (!conv.success || conv.conversation.user_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Handle different update types
    if (body.title !== undefined) {
      const result = await updateConversationTitle(conversationId, body.title);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
    }

    if (body.archived !== undefined) {
      const result = await archiveConversation(conversationId);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
    }

    if (body.pinned !== undefined) {
      const result = await pinConversation(conversationId, body.pinned);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[AL Conversation API] PATCH Error:', err);
    return NextResponse.json(
      { error: 'Failed to update conversation' },
      { status: 500 }
    );
  }
}









