/**
 * AL Conversation Service
 * 
 * Manages conversation history for AL:
 * - Create and retrieve conversations
 * - Store and fetch messages
 * - Search conversation history
 * - Archive and manage conversations
 */

import { createClient } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabase';

// Server-side Supabase client with service role for bypassing RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Use admin client for server operations, fallback to regular client
const getServerClient = () => supabaseAdmin || supabase;

// =============================================================================
// CONVERSATION OPERATIONS
// =============================================================================

/**
 * Create a new conversation
 * @param {string} userId - User ID
 * @param {Object} context - Initial context
 * @returns {Object} New conversation
 */
export async function createConversation(userId, { carSlug = null, page = null, title = null } = {}) {
  const client = getServerClient();
  if (!client || !userId) {
    return { error: 'Not configured or not authenticated' };
  }

  try {
    const { data, error } = await client
      .from('al_conversations')
      .insert({
        user_id: userId,
        initial_car_slug: carSlug,
        initial_page: page,
        title: title || 'New Conversation',
      })
      .select()
      .single();

    if (error) throw error;

    return { 
      conversation: data,
      success: true,
    };
  } catch (err) {
    console.error('[AL Conversations] Error creating conversation:', err);
    return { error: err.message };
  }
}

/**
 * Get a conversation by ID
 * @param {string} conversationId - Conversation ID
 * @returns {Object} Conversation with messages
 */
export async function getConversation(conversationId) {
  const client = getServerClient();
  if (!client || !conversationId) {
    return { error: 'Not configured or invalid ID' };
  }

  try {
    // Get conversation
    const { data: conversation, error: convError } = await client
      .from('al_conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError) throw convError;

    // Get messages
    const { data: messages, error: msgError } = await client
      .from('al_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('sequence_number', { ascending: true });

    if (msgError) throw msgError;

    return {
      conversation,
      messages: messages || [],
      success: true,
    };
  } catch (err) {
    console.error('[AL Conversations] Error fetching conversation:', err);
    return { error: err.message };
  }
}

/**
 * Get user's conversation history
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Array} Conversations
 */
export async function getUserConversations(userId, { 
  limit = 20, 
  offset = 0, 
  includeArchived = false,
  carSlug = null,
} = {}) {
  const client = getServerClient();
  if (!client || !userId) {
    return { conversations: [], total: 0 };
  }

  try {
    let query = client
      .from('al_conversations')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('last_message_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (!includeArchived) {
      query = query.eq('is_archived', false);
    }

    if (carSlug) {
      query = query.eq('initial_car_slug', carSlug);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      conversations: data || [],
      total: count || 0,
      success: true,
    };
  } catch (err) {
    console.error('[AL Conversations] Error fetching user conversations:', err);
    return { conversations: [], total: 0, error: err.message };
  }
}

/**
 * Get recent conversations for quick access
 * @param {string} userId - User ID
 * @param {number} limit - Number of conversations
 * @returns {Array} Recent conversations
 */
export async function getRecentConversations(userId, limit = 5) {
  const client = getServerClient();
  if (!client || !userId) {
    return [];
  }

  try {
    const { data, error } = await client
      .from('al_conversations')
      .select('id, title, initial_car_slug, last_message_at, message_count')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('last_message_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[AL Conversations] Error fetching recent:', err);
    return [];
  }
}

// =============================================================================
// MESSAGE OPERATIONS
// =============================================================================

/**
 * Add a message to a conversation
 * @param {string} conversationId - Conversation ID
 * @param {Object} message - Message data
 * @returns {Object} Created message
 */
export async function addMessage(conversationId, {
  role,
  content,
  toolCalls = [],
  creditsUsed = 0,
  responseTokens = 0,
  carContextSlug = null,
  carContextName = null,
  dataSources = [],
}) {
  const client = getServerClient();
  if (!client || !conversationId) {
    return { error: 'Not configured or invalid ID' };
  }

  try {
    // Get next sequence number
    const { data: lastMsg } = await client
      .from('al_messages')
      .select('sequence_number')
      .eq('conversation_id', conversationId)
      .order('sequence_number', { ascending: false })
      .limit(1)
      .single();

    const sequenceNumber = (lastMsg?.sequence_number || 0) + 1;

    // Insert message
    const { data: message, error: msgError } = await client
      .from('al_messages')
      .insert({
        conversation_id: conversationId,
        role,
        content,
        tool_calls: toolCalls,
        credits_used: creditsUsed,
        response_tokens: responseTokens,
        car_context_slug: carContextSlug,
        car_context_name: carContextName,
        data_sources: dataSources,
        sequence_number: sequenceNumber,
      })
      .select()
      .single();

    if (msgError) throw msgError;

    // Update conversation stats
    const titleUpdate = sequenceNumber === 1 && role === 'user' 
      ? { title: content.substring(0, 50) + (content.length > 50 ? '...' : '') }
      : {};

    await client
      .from('al_conversations')
      .update({
        message_count: sequenceNumber,
        total_credits_used: supabase.rpc ? undefined : 0, // Would use RPC for atomic increment
        last_message_at: new Date().toISOString(),
        ...titleUpdate,
      })
      .eq('id', conversationId);

    return { message, success: true };
  } catch (err) {
    console.error('[AL Conversations] Error adding message:', err);
    return { error: err.message };
  }
}

/**
 * Get messages for a conversation
 * @param {string} conversationId - Conversation ID
 * @param {Object} options - Query options
 * @returns {Array} Messages
 */
export async function getMessages(conversationId, { limit = 50, beforeSequence = null } = {}) {
  const client = getServerClient();
  if (!client || !conversationId) {
    return [];
  }

  try {
    let query = client
      .from('al_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('sequence_number', { ascending: true })
      .limit(limit);

    if (beforeSequence) {
      query = query.lt('sequence_number', beforeSequence);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[AL Conversations] Error fetching messages:', err);
    return [];
  }
}

/**
 * Format messages for Claude API
 * @param {Array} messages - Database messages
 * @returns {Array} Claude-formatted messages
 */
export function formatMessagesForClaude(messages) {
  return messages.map(msg => ({
    role: msg.role,
    content: msg.content,
  }));
}

// =============================================================================
// CONVERSATION MANAGEMENT
// =============================================================================

/**
 * Update conversation title
 * @param {string} conversationId - Conversation ID
 * @param {string} title - New title
 * @returns {Object} Result
 */
export async function updateConversationTitle(conversationId, title) {
  const client = getServerClient();
  if (!client || !conversationId) {
    return { error: 'Not configured or invalid ID' };
  }

  try {
    const { error } = await client
      .from('al_conversations')
      .update({ title })
      .eq('id', conversationId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('[AL Conversations] Error updating title:', err);
    return { error: err.message };
  }
}

/**
 * Archive a conversation
 * @param {string} conversationId - Conversation ID
 * @returns {Object} Result
 */
export async function archiveConversation(conversationId) {
  const client = getServerClient();
  if (!client || !conversationId) {
    return { error: 'Not configured or invalid ID' };
  }

  try {
    const { error } = await client
      .from('al_conversations')
      .update({ is_archived: true })
      .eq('id', conversationId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('[AL Conversations] Error archiving:', err);
    return { error: err.message };
  }
}

/**
 * Pin/unpin a conversation
 * @param {string} conversationId - Conversation ID
 * @param {boolean} pinned - Pin state
 * @returns {Object} Result
 */
export async function pinConversation(conversationId, pinned = true) {
  const client = getServerClient();
  if (!client || !conversationId) {
    return { error: 'Not configured or invalid ID' };
  }

  try {
    const { error } = await client
      .from('al_conversations')
      .update({ is_pinned: pinned })
      .eq('id', conversationId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('[AL Conversations] Error pinning:', err);
    return { error: err.message };
  }
}

/**
 * Delete a conversation and all its messages
 * @param {string} conversationId - Conversation ID
 * @returns {Object} Result
 */
export async function deleteConversation(conversationId) {
  const client = getServerClient();
  if (!client || !conversationId) {
    return { error: 'Not configured or invalid ID' };
  }

  try {
    // Messages will be cascade deleted
    const { error } = await client
      .from('al_conversations')
      .delete()
      .eq('id', conversationId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('[AL Conversations] Error deleting:', err);
    return { error: err.message };
  }
}

// =============================================================================
// SEARCH & ANALYTICS
// =============================================================================

/**
 * Search conversations by content
 * @param {string} userId - User ID
 * @param {string} query - Search query
 * @returns {Array} Matching conversations
 */
export async function searchConversations(userId, query) {
  const client = getServerClient();
  if (!client || !userId || !query) {
    return [];
  }

  try {
    // Search in conversation titles and message content
    const { data: titleMatches } = await client
      .from('al_conversations')
      .select('id, title, last_message_at')
      .eq('user_id', userId)
      .ilike('title', `%${query}%`)
      .limit(10);

    const { data: messageMatches } = await client
      .from('al_messages')
      .select(`
        conversation_id,
        content,
        al_conversations!inner (
          id,
          title,
          user_id,
          last_message_at
        )
      `)
      .eq('al_conversations.user_id', userId)
      .ilike('content', `%${query}%`)
      .limit(20);

    // Deduplicate and merge results
    const conversationMap = new Map();
    
    (titleMatches || []).forEach(conv => {
      conversationMap.set(conv.id, {
        id: conv.id,
        title: conv.title,
        lastMessageAt: conv.last_message_at,
        matchType: 'title',
      });
    });

    (messageMatches || []).forEach(msg => {
      const conv = msg.al_conversations;
      if (!conversationMap.has(conv.id)) {
        conversationMap.set(conv.id, {
          id: conv.id,
          title: conv.title,
          lastMessageAt: conv.last_message_at,
          matchType: 'content',
          preview: msg.content.substring(0, 100),
        });
      }
    });

    return Array.from(conversationMap.values())
      .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
  } catch (err) {
    console.error('[AL Conversations] Error searching:', err);
    return [];
  }
}

/**
 * Get conversation statistics for a user
 * @param {string} userId - User ID
 * @returns {Object} Statistics
 */
export async function getConversationStats(userId) {
  const client = getServerClient();
  if (!client || !userId) {
    return null;
  }

  try {
    const { data, error } = await client
      .from('al_conversations')
      .select('id, message_count, total_credits_used, created_at')
      .eq('user_id', userId);

    if (error) throw error;

    const conversations = data || [];
    const totalMessages = conversations.reduce((sum, c) => sum + (c.message_count || 0), 0);
    const totalCredits = conversations.reduce((sum, c) => sum + (c.total_credits_used || 0), 0);

    // Get this month's stats
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const thisMonth = conversations.filter(c => new Date(c.created_at) >= startOfMonth);

    return {
      totalConversations: conversations.length,
      totalMessages,
      totalCreditsUsed: totalCredits,
      conversationsThisMonth: thisMonth.length,
      messagesThisMonth: thisMonth.reduce((sum, c) => sum + (c.message_count || 0), 0),
    };
  } catch (err) {
    console.error('[AL Conversations] Error getting stats:', err);
    return null;
  }
}

export default {
  // Conversation CRUD
  createConversation,
  getConversation,
  getUserConversations,
  getRecentConversations,
  
  // Message operations
  addMessage,
  getMessages,
  formatMessagesForClaude,
  
  // Management
  updateConversationTitle,
  archiveConversation,
  pinConversation,
  deleteConversation,
  
  // Search & analytics
  searchConversations,
  getConversationStats,
};








