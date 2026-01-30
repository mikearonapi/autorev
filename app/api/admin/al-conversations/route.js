/**
 * Admin AL Conversations API
 *
 * Returns all AL conversations with messages for admin monitoring.
 * Shows what users are asking and what AL is responding.
 *
 * @route GET /api/admin/al-conversations
 */

import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

import { isAdminEmail } from '@/lib/adminAccess';
import { withErrorLogging } from '@/lib/serverErrorLogger';

// Force dynamic rendering - this route uses request.headers
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function handleGet(request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const search = searchParams.get('search') || '';

  // Verify admin access
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Verify user is admin
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Build query for conversations
    let conversationsQuery = supabase
      .from('al_conversations')
      .select('id, user_id, title, message_count, created_at, last_message_at, initial_car_slug', {
        count: 'exact',
      })
      .order('last_message_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply search filter if provided
    if (search) {
      conversationsQuery = conversationsQuery.ilike('title', `%${search}%`);
    }

    const { data: conversations, error: convError, count } = await conversationsQuery;

    if (convError) {
      console.error('[Admin AL Conversations] Error fetching conversations:', convError);
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    // Get unique user IDs
    const userIds = [...new Set(conversations?.map((c) => c.user_id) || [])];

    // Fetch user profiles
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, display_name, subscription_tier')
      .in('id', userIds);

    // Build profile lookup map
    const profileMap = new Map();
    profiles?.forEach((p) => profileMap.set(p.id, p));

    // Skip slow email lookups for now - use user ID as fallback
    const emailMap = new Map();

    // Get conversation IDs for message fetch
    const conversationIds = conversations?.map((c) => c.id) || [];

    // Fetch messages for all conversations (both user and assistant)
    const { data: messages, error: msgError } = await supabase
      .from('al_messages')
      .select(
        'id, conversation_id, role, content, created_at, sequence_number, car_context_slug, car_context_name'
      )
      .in('conversation_id', conversationIds)
      .order('sequence_number', { ascending: true });

    if (msgError) {
      console.error('[Admin AL Conversations] Error fetching messages:', msgError);
    }

    // Group messages by conversation
    const messagesByConversation = new Map();
    messages?.forEach((msg) => {
      if (!messagesByConversation.has(msg.conversation_id)) {
        messagesByConversation.set(msg.conversation_id, []);
      }
      messagesByConversation.get(msg.conversation_id).push(msg);
    });

    // Enrich conversations with user info and messages
    const enrichedConversations =
      conversations?.map((conv) => {
        const profile = profileMap.get(conv.user_id);
        const email = emailMap.get(conv.user_id);
        const convMessages = messagesByConversation.get(conv.id) || [];

        // Show display name, email, or shortened user ID
        const userIdentifier =
          profile?.display_name || email || `User ${conv.user_id?.slice(0, 8)}...`;

        return {
          id: conv.id,
          title: conv.title,
          userId: conv.user_id,
          userEmail: userIdentifier,
          userDisplayName: profile?.display_name || null,
          userTier: profile?.subscription_tier || 'free',
          messageCount: conv.message_count,
          carSlug: conv.initial_car_slug,
          createdAt: conv.created_at,
          lastMessageAt: conv.last_message_at,
          messages: convMessages.map((msg) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            createdAt: msg.created_at,
            carContext: msg.car_context_name || msg.car_context_slug,
          })),
        };
      }) || [];

    return NextResponse.json({
      conversations: enrichedConversations,
      total: count || 0,
      limit,
      offset,
      hasMore: offset + limit < (count || 0),
    });
  } catch (err) {
    console.error('[Admin AL Conversations] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch AL conversations' }, { status: 500 });
  }
}

export const GET = withErrorLogging(handleGet, {
  route: 'admin/al-conversations',
  feature: 'internal',
});
