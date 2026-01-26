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

// Log configuration status once at startup (only in dev)
if (process.env.NODE_ENV === 'development') {
  console.log('[AL Conversations] Service client config:', {
    hasUrl: !!supabaseUrl,
    hasServiceKey: !!supabaseServiceKey,
    usingAdminClient: !!supabaseAdmin,
  });
}

// Use admin client for server operations, fallback to regular client
const getServerClient = () => supabaseAdmin || supabase;

// =============================================================================
// CONVERSATION OPERATIONS
// =============================================================================

/**
 * Generate a conversation title from the first user message
 * Similar to how ChatGPT auto-generates titles
 * @param {string} message - First user message
 * @param {string} carSlug - Optional car context
 * @returns {string} Generated title
 */
function generateConversationTitle(message, carSlug = null) {
  if (!message) return 'New Conversation';
  
  // Clean and truncate the message
  let title = message
    .replace(/\s+/g, ' ')  // Normalize whitespace
    .trim()
    .slice(0, 60);  // Limit to 60 chars
  
  // If we cut mid-word, find the last complete word
  if (title.length === 60 && message.length > 60) {
    const lastSpace = title.lastIndexOf(' ');
    if (lastSpace > 30) {
      title = title.slice(0, lastSpace) + '...';
    } else {
      title += '...';
    }
  }
  
  // Capitalize first letter
  title = title.charAt(0).toUpperCase() + title.slice(1);
  
  return title;
}

/**
 * Create a new conversation
 * @param {string} userId - User ID
 * @param {Object} context - Initial context
 * @returns {Object} New conversation
 */
export async function createConversation(userId, { carSlug = null, page = null, title = null, firstMessage = null } = {}) {
  const client = getServerClient();
  if (!client || !userId) {
    return { error: 'Not configured or not authenticated' };
  }

  try {
    // Auto-generate title from first message if not provided
    const conversationTitle = title || generateConversationTitle(firstMessage, carSlug);
    
    const { data, error } = await client
      .from('al_conversations')
      .insert({
        user_id: userId,
        initial_car_slug: carSlug,
        initial_page: page,
        title: conversationTitle,
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
  const usingAdminClient = !!supabaseAdmin;
  
  console.log('[AL Conversations] getConversation called:', { 
    conversationId, 
    usingAdminClient,
    clientConfigured: !!client 
  });
  
  if (!client || !conversationId) {
    console.error('[AL Conversations] getConversation: Not configured or invalid ID');
    return { error: 'Not configured or invalid ID' };
  }

  // Column selections for AL tables
  // Note: Only select columns that exist in the base table (from 012_al_conversations migration)
  // Optional columns like initial_car_id, deleted_at may not exist if migrations haven't run
  const CONVERSATION_COLUMNS = 'id, user_id, title, summary, initial_car_slug, initial_page, message_count, total_credits_used, is_archived, is_pinned, last_message_at, created_at, updated_at';
  const MESSAGE_COLUMNS = 'id, conversation_id, role, content, tool_calls, credits_used, response_tokens, car_context_slug, car_context_name, data_sources, sequence_number, created_at';
  
  try {
    // Get conversation
    const { data: conversation, error: convError } = await client
      .from('al_conversations')
      .select(CONVERSATION_COLUMNS)
      .eq('id', conversationId)
      .single();

    if (convError) {
      console.error('[AL Conversations] getConversation query error:', convError.message, convError.code, { conversationId });
      throw convError;
    }
    
    console.log('[AL Conversations] getConversation found:', { 
      conversationId, 
      found: !!conversation,
      userId: conversation?.user_id 
    });

    // Get messages
    const { data: messages, error: msgError } = await client
      .from('al_messages')
      .select(MESSAGE_COLUMNS)
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
 * Uses RPC to fetch conversations with previews in single query (fixes N+1)
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Array} Conversations with previews
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
    // Use RPC to fetch conversations with previews in single query
    // This replaces the N+1 pattern that made 21 queries per page
    const { data, error } = await client.rpc('get_user_conversations_with_preview', {
      p_user_id: userId,
      p_limit: limit,
      p_offset: offset,
      p_include_archived: includeArchived,
      p_car_slug: carSlug || null,
    });

    if (error) {
      // Fallback to legacy method if RPC doesn't exist yet
      const isMissingFunction = 
        error.code === '42883' || 
        error.code === 'PGRST202' ||
        error.message?.includes('does not exist');
      
      if (isMissingFunction) {
        console.warn('[AL Conversations] RPC not available, using fallback');
        return getUserConversationsLegacy(userId, { limit, offset, includeArchived, carSlug });
      }
      throw error;
    }

    // Get total count separately
    let countQuery = client
      .from('al_conversations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    if (!includeArchived) {
      countQuery = countQuery.eq('is_archived', false);
    }
    if (carSlug) {
      countQuery = countQuery.eq('initial_car_slug', carSlug);
    }
    
    const { count } = await countQuery;

    // Add trailing ellipsis to previews that are truncated
    const conversationsWithPreviews = (data || []).map(conv => ({
      ...conv,
      preview: conv.preview && conv.preview.length === 120 
        ? conv.preview.trim() + '...' 
        : conv.preview?.trim() || null,
    }));

    return {
      conversations: conversationsWithPreviews,
      total: count || 0,
      success: true,
    };
  } catch (err) {
    console.error('[AL Conversations] Error fetching user conversations:', err);
    return { conversations: [], total: 0, error: err.message };
  }
}

/**
 * Legacy implementation - fallback if RPC not deployed yet
 * @deprecated Use getUserConversations which uses RPC
 */
async function getUserConversationsLegacy(userId, { 
  limit = 20, 
  offset = 0, 
  includeArchived = false,
  carSlug = null,
} = {}) {
  const client = getServerClient();
  
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

    // N+1 pattern - kept for backwards compatibility only
    const conversationsWithPreviews = await Promise.all(
      (data || []).map(async (conv) => {
        try {
          const { data: messages } = await client
            .from('al_messages')
            .select('content, role')
            .eq('conversation_id', conv.id)
            .eq('role', 'assistant')
            .order('sequence_number', { ascending: true })
            .limit(1);

          const previewMessage = messages?.[0];
          const preview = previewMessage?.content 
            ? previewMessage.content.substring(0, 120).replace(/\n/g, ' ').trim() + (previewMessage.content.length > 120 ? '...' : '')
            : null;

          return { ...conv, preview };
        } catch {
          return { ...conv, preview: null };
        }
      })
    );

    return {
      conversations: conversationsWithPreviews,
      total: count || 0,
      success: true,
    };
  } catch (err) {
    console.error('[AL Conversations] Legacy fetch error:', err);
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
    // Prefer DB RPC for race-free sequencing + atomic conversation updates.
    // Falls back to legacy insert if the RPC isn't available (older DB).
    const { data: messageId, error: rpcError } = await client.rpc('add_al_message', {
      p_conversation_id: conversationId,
      p_role: role,
      p_content: content,
      p_tool_calls: toolCalls,
      p_credits_used: creditsUsed,
      p_car_context_slug: carContextSlug,
      p_car_context_name: carContextName,
      p_data_sources: dataSources,
    });

    if (rpcError) {
      // Fallback path (legacy behavior) - not race-safe but keeps app functional
      console.warn('[AL Conversations] add_al_message RPC failed, falling back to direct insert:', rpcError);

      const { data: lastMsg } = await client
        .from('al_messages')
        .select('sequence_number')
        .eq('conversation_id', conversationId)
        .order('sequence_number', { ascending: false })
        .limit(1)
        .single();

      const sequenceNumber = (lastMsg?.sequence_number || 0) + 1;

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

      return { message, success: true, usedFallback: true };
    }

    // Fetch the inserted message row (RPC returns message UUID)
    const MESSAGE_COLUMNS = 'id, conversation_id, role, content, tool_calls, credits_used, response_tokens, car_context_slug, car_context_name, data_sources, sequence_number, created_at';
    const { data: message, error: fetchError } = await client
      .from('al_messages')
      .select(MESSAGE_COLUMNS)
      .eq('id', messageId)
      .single();

    if (fetchError) throw fetchError;

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

  const MESSAGE_COLUMNS = 'id, conversation_id, role, content, tool_calls, credits_used, response_tokens, car_context_slug, car_context_name, data_sources, sequence_number, created_at';
  
  try {
    let query = client
      .from('al_messages')
      .select(MESSAGE_COLUMNS)
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

const alConversationService = {
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

export default alConversationService;








