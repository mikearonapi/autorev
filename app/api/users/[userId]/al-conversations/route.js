/**
 * User AL Conversations API
 * 
 * GET /api/users/[userId]/al-conversations
 * Returns the user's conversation history
 */

import { NextResponse } from 'next/server';
import { getUserConversations } from '@/lib/alConversationService';

export async function GET(request, { params }) {
  try {
    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
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
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}





















