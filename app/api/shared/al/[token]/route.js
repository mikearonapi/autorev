/**
 * Public Shared Conversation API
 * 
 * GET /api/shared/al/[token]
 * Returns a shared conversation (public, no auth required)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export async function GET(request, { params }) {
  try {
    const { token } = await params;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Share token is required' },
        { status: 400 }
      );
    }

    // Find conversation by share token
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('al_conversations')
      .select('id, title, initial_car_slug, created_at, message_count')
      .eq('share_token', token)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Shared conversation not found or link has expired' },
        { status: 404 }
      );
    }

    // Get messages
    const { data: messages, error: msgError } = await supabaseAdmin
      .from('al_messages')
      .select('role, content, created_at, car_context_name')
      .eq('conversation_id', conversation.id)
      .order('sequence_number', { ascending: true });

    if (msgError) {
      console.error('[Shared] Failed to fetch messages:', msgError);
      return NextResponse.json(
        { error: 'Failed to load conversation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      conversation: {
        title: conversation.title,
        carContext: conversation.initial_car_slug,
        createdAt: conversation.created_at,
        messageCount: conversation.message_count,
      },
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.created_at,
        carContext: m.car_context_name,
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
