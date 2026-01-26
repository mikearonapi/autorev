/**
 * Public Shared Conversation API
 * 
 * GET /api/shared/al/[token]
 * Returns a shared conversation (public, no auth required)
 * 
 * Security:
 * - Rate limited (60 req/min per IP)
 * - Token must be valid UUID format
 * - Checks expiration and revocation
 * - No PII exposed (user_id, email, etc.)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withErrorLogging } from '@/lib/serverErrorLogger';
import { rateLimit } from '@/lib/rateLimit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// UUID v4 format validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validate token format (UUID v4)
 */
function isValidTokenFormat(token) {
  return token && UUID_REGEX.test(token);
}

async function handleGet(request, { params }) {
  // 1. Rate limiting - protect against abuse
  const limited = rateLimit(request, 'api');
  if (limited) return limited;

  try {
    const { token } = await params;
    
    // 2. Validate token is provided
    if (!token) {
      return NextResponse.json(
        { error: 'Share token is required' },
        { status: 400 }
      );
    }

    // 3. Validate token format (prevent injection, invalid queries)
    if (!isValidTokenFormat(token)) {
      return NextResponse.json(
        { error: 'Invalid share token format' },
        { status: 404 }
      );
    }

    // 4. Find conversation by share token
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('al_conversations')
      .select(`
        id, 
        title, 
        initial_car_slug, 
        created_at, 
        message_count,
        share_expires_at,
        share_revoked_at
      `)
      .eq('share_token', token)
      .single();

    // 5. Handle not found
    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Shared conversation not found' },
        { status: 404 }
      );
    }

    // 6. Check if revoked
    if (conversation.share_revoked_at) {
      return NextResponse.json(
        { error: 'This shared conversation is no longer available' },
        { status: 404 }
      );
    }

    // 7. Check if expired
    if (conversation.share_expires_at) {
      const expiresAt = new Date(conversation.share_expires_at);
      if (expiresAt < new Date()) {
        return NextResponse.json(
          { error: 'This shared conversation has expired' },
          { status: 410 } // 410 Gone - resource no longer available
        );
      }
    }

    // 8. Get car name if car context exists
    let carName = null;
    if (conversation.initial_car_slug) {
      const { data: car } = await supabaseAdmin
        .from('cars')
        .select('name')
        .eq('slug', conversation.initial_car_slug)
        .single();
      carName = car?.name || null;
    }

    // 9. Get messages (sanitized - no user_id, no internal IDs)
    const { data: messages, error: msgError } = await supabaseAdmin
      .from('al_messages')
      .select('role, content, created_at, car_context_name, data_sources')
      .eq('conversation_id', conversation.id)
      .order('sequence_number', { ascending: true });

    if (msgError) {
      console.error('[Shared] Failed to fetch messages:', msgError);
      return NextResponse.json(
        { error: 'Failed to load conversation' },
        { status: 500 }
      );
    }

    // 10. Return sanitized response (NO PII)
    return NextResponse.json({
      conversation: {
        title: conversation.title,
        carSlug: conversation.initial_car_slug,
        carName: carName,
        createdAt: conversation.created_at,
        messageCount: conversation.message_count,
      },
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.created_at,
        carContext: m.car_context_name,
        // Include sources for citation display
        sources: m.data_sources || [],
      })),
      success: true,
    });
  } catch (err) {
    console.error('[Shared] Error:', err);
    return NextResponse.json(
      { error: 'Failed to load shared conversation' },
      { status: 500 }
    );
  }
}

export const GET = withErrorLogging(handleGet, { route: 'shared/al/[token]', feature: 'al' });
