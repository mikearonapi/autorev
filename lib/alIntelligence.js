/**
 * AL Intelligence System
 * 
 * Analyzes AL conversation data to extract business insights:
 * - Popular topics and questions
 * - Content gaps (what users are asking that we don't have content for)
 * - User behavior patterns
 * - Cost optimization opportunities
 * - Quality signals (did users find AL helpful?)
 * 
 * Enhanced with:
 * - Automatic al_content_gaps population
 * - Gap type classification
 * - Question pattern extraction
 * - Confidence scoring
 */

import { createClient } from '@supabase/supabase-js';

import { resolveCarId } from './carResolver';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ============================================================================
// GAP DETECTION INDICATORS
// ============================================================================

/**
 * Gap indicators organized by type
 * Each indicator suggests what kind of gap was detected
 */
const GAP_INDICATORS = {
  missing_data: [
    'don\'t have specific data',
    'don\'t have data on',
    'not in my database',
    'no information available',
    'don\'t have records',
    'couldn\'t find any data',
    'no data on that',
    'don\'t have exact figures',
  ],
  outdated: [
    'might be outdated',
    'not sure if current',
    'may have changed',
    'verify with dealer',
    'check for updates',
    'last known',
  ],
  incomplete: [
    'don\'t have complete',
    'partial information',
    'only some details',
    'limited data',
    'incomplete information',
    'don\'t have full',
  ],
  no_source: [
    'can\'t verify',
    'unverified',
    'no authoritative source',
    'couldn\'t confirm',
    'based on general',
    'not from official',
  ],
  low_confidence: [
    'not entirely sure',
    'believe but can\'t confirm',
    'might be wrong',
    'take with grain of salt',
    'best guess',
    'approximately',
    'roughly',
    'i think',
    'probably',
    'not certain',
    'unfortunately i don\'t',
    'don\'t have enough',
    'can\'t find',
    'not sure',
  ],
};

/**
 * Extract topic/intent from user question using simple keyword matching
 * In production, this could use NLP/LLM for better categorization
 */
function categorizeQuestion(question) {
  const q = question.toLowerCase();
  
  // Comparison questions
  if (q.includes(' vs ') || q.includes(' versus ') || q.includes('compare')) {
    return 'comparison';
  }
  
  // Upgrade/modification questions
  if (q.includes('upgrade') || q.includes('mod') || q.includes('tune') || 
      q.includes('turbo') || q.includes('exhaust') || q.includes('stage')) {
    return 'upgrades';
  }
  
  // Buying advice
  if (q.includes('should i buy') || q.includes('worth it') || q.includes('good deal') ||
      q.includes('which one') || q.includes('recommend')) {
    return 'buying-advice';
  }
  
  // Performance questions
  if (q.includes('fast') || q.includes('quick') || q.includes('0-60') ||
      q.includes('quarter mile') || q.includes('lap time') || q.includes('track')) {
    return 'performance';
  }
  
  // Reliability/ownership
  if (q.includes('reliable') || q.includes('issues') || q.includes('problems') ||
      q.includes('maintain') || q.includes('cost to own')) {
    return 'reliability';
  }
  
  // First car / beginner
  if (q.includes('first') || q.includes('beginner') || q.includes('new to') ||
      q.includes('starter')) {
    return 'first-car';
  }
  
  return 'general';
}

/**
 * Extract car slugs mentioned in a question
 */
function extractCarMentions(question, carSlugs) {
  const q = question.toLowerCase();
  const mentioned = [];
  
  for (const slug of carSlugs) {
    // Convert slug to searchable terms (e.g., "718-cayman-gt4" -> "718 cayman gt4")
    const terms = slug.replace(/-/g, ' ');
    if (q.includes(terms) || q.includes(slug)) {
      mentioned.push(slug);
    }
  }
  
  return mentioned;
}

/**
 * Enhanced content gap detection
 * Returns gap type and confidence score
 */
function detectContentGapEnhanced(userMessage, assistantMessage) {
  const assistant = assistantMessage.toLowerCase();
  
  // Check each gap type
  for (const [gapType, indicators] of Object.entries(GAP_INDICATORS)) {
    for (const indicator of indicators) {
      if (assistant.includes(indicator)) {
        return {
          hasGap: true,
          gapType,
          indicator,
          confidence: calculateGapConfidence(assistant, gapType),
        };
      }
    }
  }
  
  return { hasGap: false, gapType: null, indicator: null, confidence: 0 };
}

/**
 * Calculate confidence in gap detection (0-1)
 */
function calculateGapConfidence(response, gapType) {
  const indicators = GAP_INDICATORS[gapType] || [];
  let matchCount = 0;
  
  for (const indicator of indicators) {
    if (response.includes(indicator)) {
      matchCount++;
    }
  }
  
  // More matches = higher confidence
  return Math.min(matchCount / 3, 1);
}

/**
 * Legacy: Detect if a question couldn't be answered well (content gap)
 * Kept for backwards compatibility
 */
function detectContentGap(userMessage, assistantMessage) {
  const result = detectContentGapEnhanced(userMessage, assistantMessage);
  return result.hasGap;
}

/**
 * Extract a normalized question pattern from a user question
 * Helps group similar questions together
 */
function extractQuestionPattern(question) {
  let pattern = question.toLowerCase()
    // Remove specific car names (will be captured separately)
    .replace(/\d{3,4}[s\s]*/g, '[MODEL] ')
    // Remove years
    .replace(/\b(19|20)\d{2}\b/g, '[YEAR]')
    // Normalize price mentions
    .replace(/\$[\d,]+/g, '[PRICE]')
    // Normalize mileage
    .replace(/\b\d+k?\s*(miles?|km|kilometers?)/gi, '[MILEAGE]')
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .trim();
  
  // Truncate to first 100 chars for pattern matching
  if (pattern.length > 100) {
    pattern = pattern.slice(0, 100) + '...';
  }
  
  return pattern;
}

/**
 * Record a content gap to the al_content_gaps table
 * Uses upsert to increment occurrence count for existing gaps
 */
export async function recordContentGap({
  questionPattern,
  carSlug = null,
  gapType = 'low_confidence',
  sampleQuestion = null,
  conversationId = null,
}) {
  try {
    // Use the database function for atomic upsert
    const { data, error } = await supabase.rpc('upsert_content_gap', {
      p_question_pattern: questionPattern,
      p_car_slug: carSlug,
      p_gap_type: gapType,
      p_sample_question: sampleQuestion,
      p_conversation_id: conversationId,
    });
    
    if (error) {
      console.error('[AL Intelligence] Error recording content gap:', error);
      return null;
    }
    
    return data; // Returns the gap ID
  } catch (err) {
    console.error('[AL Intelligence] Exception recording content gap:', err);
    return null;
  }
}

/**
 * Analyze a conversation for content gaps and record them
 */
export async function analyzeConversationForGaps(conversationId) {
  // Fetch the conversation messages
  const { data: messages, error } = await supabase
    .from('al_messages')
    .select('id, role, content, sequence_number')
    .eq('conversation_id', conversationId)
    .order('sequence_number', { ascending: true });
  
  if (error || !messages || messages.length === 0) {
    return { gapsFound: 0 };
  }
  
  // Get conversation metadata for car context
  const { data: conversation } = await supabase
    .from('al_conversations')
    .select('initial_car_slug')
    .eq('id', conversationId)
    .single();
  
  const carSlug = conversation?.initial_car_slug || null;
  let gapsFound = 0;
  
  // Analyze user-assistant pairs
  for (let i = 0; i < messages.length - 1; i++) {
    const current = messages[i];
    const next = messages[i + 1];
    
    // Look for user message followed by assistant message
    if (current.role === 'user' && next.role === 'assistant') {
      const gapResult = detectContentGapEnhanced(current.content, next.content);
      
      if (gapResult.hasGap && gapResult.confidence >= 0.3) {
        const pattern = extractQuestionPattern(current.content);
        
        await recordContentGap({
          questionPattern: pattern,
          carSlug,
          gapType: gapResult.gapType,
          sampleQuestion: current.content.slice(0, 500),
          conversationId,
        });
        
        gapsFound++;
      }
    }
  }
  
  return { gapsFound };
}

/**
 * Batch analyze recent conversations for content gaps
 * Should be run as a scheduled job
 */
export async function analyzeRecentConversationsForGaps(hoursBack = 24) {
  const startDate = new Date();
  startDate.setHours(startDate.getHours() - hoursBack);
  
  const { data: conversations, error } = await supabase
    .from('al_conversations')
    .select('id')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false });
  
  if (error || !conversations) {
    console.error('[AL Intelligence] Error fetching conversations:', error);
    return { conversationsAnalyzed: 0, gapsFound: 0 };
  }
  
  let totalGaps = 0;
  
  for (const conv of conversations) {
    const { gapsFound } = await analyzeConversationForGaps(conv.id);
    totalGaps += gapsFound;
  }
  
  console.log(`[AL Intelligence] Analyzed ${conversations.length} conversations, found ${totalGaps} content gaps`);
  
  return {
    conversationsAnalyzed: conversations.length,
    gapsFound: totalGaps,
  };
}

/**
 * Get unresolved content gaps sorted by priority
 */
export async function getUnresolvedGaps(options = {}) {
  const {
    limit = 20,
    minOccurrences = 3,
    gapType = null,
    carSlug = null,
  } = options;
  
  const GAP_COLUMNS = 'id, question_pattern, car_slug, car_id, gap_type, occurrence_count, sample_questions, sample_conversation_ids, first_detected_at, last_detected_at, resolved_at, resolution_notes, created_at';
  
  let query = supabase
    .from('al_content_gaps')
    .select(GAP_COLUMNS)
    .is('resolved_at', null)
    .gte('occurrence_count', minOccurrences)
    .order('occurrence_count', { ascending: false })
    .order('last_detected_at', { ascending: false })
    .limit(limit);
  
  if (gapType) {
    query = query.eq('gap_type', gapType);
  }
  
  // Use car_id for indexed lookup (Cardinal Rule 1)
  if (carSlug) {
    const carId = await resolveCarId(carSlug);
    if (carId) {
      query = query.eq('car_id', carId);
    } else {
      // Fallback to slug if car not in cars table
      console.warn('[AL Intelligence] Could not resolve car_id for slug:', carSlug);
      query = query.eq('car_slug', carSlug);
    }
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('[AL Intelligence] Error fetching gaps:', error);
    return [];
  }
  
  return data;
}

/**
 * Get content gap statistics
 */
export async function getContentGapStats() {
  const { data, error } = await supabase
    .from('al_content_gaps')
    .select('gap_type, resolved_at')
    .order('created_at', { ascending: false });
  
  if (error || !data) {
    return null;
  }
  
  const stats = {
    total: data.length,
    resolved: data.filter(g => g.resolved_at).length,
    unresolved: data.filter(g => !g.resolved_at).length,
    byType: {},
  };
  
  for (const gap of data) {
    if (!gap.resolved_at) {
      stats.byType[gap.gap_type] = (stats.byType[gap.gap_type] || 0) + 1;
    }
  }
  
  return stats;
}

/**
 * Detect positive outcome signals (user took action after AL chat)
 */
async function _detectPositiveOutcome(userId, conversationEndTime) {
  // Check if user took action within 30 minutes of conversation ending
  const thirtyMinutesLater = new Date(conversationEndTime);
  thirtyMinutesLater.setMinutes(thirtyMinutesLater.getMinutes() + 30);
  
  const { data } = await supabase
    .from('user_activity')
    .select('event_type')
    .eq('user_id', userId)
    .gte('created_at', conversationEndTime)
    .lte('created_at', thirtyMinutesLater.toISOString())
    .in('event_type', ['car_favorited', 'build_saved', 'comparison_started', 'vehicle_added']);
  
  return (data?.length || 0) > 0;
}

/**
 * Generate AL Intelligence Report for a time period
 */
export async function generateALIntelligence(startDate, endDate) {
  // Fetch all AL conversations in period
  const { data: conversations } = await supabase
    .from('al_conversations')
    .select('id, user_id, initial_car_slug, created_at, message_count, total_credits_used')
    .gte('created_at', startDate)
    .lt('created_at', endDate);
  
  if (!conversations || conversations.length === 0) {
    return {
      conversationCount: 0,
      uniqueUsers: 0,
      totalCost: 0,
      insights: [],
    };
  }
  
  // Fetch all user messages (questions) from these conversations
  const conversationIds = conversations.map(c => c.id);
  const { data: messages } = await supabase
    .from('al_messages')
    .select('conversation_id, role, content, created_at, credits_used, tool_calls')
    .in('conversation_id', conversationIds)
    .order('created_at', { ascending: true });
  
  // Fetch usage logs for cost analysis
  const { data: usageLogs } = await supabase
    .from('al_usage_logs')
    .select('credits_used, input_tokens, output_tokens, tool_calls, car_slug, query_type')
    .gte('created_at', startDate)
    .lt('created_at', endDate);
  
  // Get all car slugs for mention detection
  const { data: cars } = await supabase
    .from('cars')
    .select('slug');
  const carSlugs = cars?.map(c => c.slug) || [];
  
  // Analysis containers
  const topicCounts = {};
  const carMentions = {};
  const contentGaps = [];
  const popularComparisons = new Map();
  const expensiveConversations = [];
  
  // Group messages by conversation
  const conversationMessages = {};
  messages?.forEach(msg => {
    if (!conversationMessages[msg.conversation_id]) {
      conversationMessages[msg.conversation_id] = [];
    }
    conversationMessages[msg.conversation_id].push(msg);
  });
  
  // Analyze each conversation
  for (const conv of conversations) {
    const msgs = conversationMessages[conv.id] || [];
    const userMessages = msgs.filter(m => m.role === 'user');
    const assistantMessages = msgs.filter(m => m.role === 'assistant');
    
    if (userMessages.length === 0) continue;
    
    // Analyze first user question
    const firstQuestion = userMessages[0].content;
    const topic = categorizeQuestion(firstQuestion);
    topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    
    // Extract car mentions
    const mentioned = extractCarMentions(firstQuestion, carSlugs);
    mentioned.forEach(slug => {
      carMentions[slug] = (carMentions[slug] || 0) + 1;
    });
    
    // Detect comparisons
    if (mentioned.length >= 2) {
      const comparison = mentioned.sort().join(' vs ');
      popularComparisons.set(comparison, (popularComparisons.get(comparison) || 0) + 1);
    }
    
    // Detect content gaps
    if (userMessages.length > 0 && assistantMessages.length > 0) {
      const hasGap = detectContentGap(firstQuestion, assistantMessages[0].content);
      if (hasGap) {
        contentGaps.push({
          question: firstQuestion.slice(0, 200),
          car: conv.initial_car_slug,
        });
      }
    }
    
    // Track expensive conversations
    if (conv.total_credits_used > 100) { // > $1
      expensiveConversations.push({
        credits: conv.total_credits_used,
        messages: conv.message_count,
        car: conv.initial_car_slug,
      });
    }
  }
  
  // Calculate metrics
  const uniqueUsers = new Set(conversations.map(c => c.user_id)).size;
  const totalCredits = conversations.reduce((sum, c) => sum + (c.total_credits_used || 0), 0);
  const totalCost = totalCredits / 100; // credits to dollars
  const avgCostPerConversation = totalCost / conversations.length;
  
  const totalQuestions = messages?.filter(m => m.role === 'user').length || 0;
  const totalToolCalls = usageLogs?.reduce((sum, log) => {
    return sum + (Array.isArray(log.tool_calls) ? log.tool_calls.length : 0);
  }, 0) || 0;
  
  // Get top topics (sorted by frequency)
  const topTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic, count]) => ({ topic, count }));
  
  // Get top cars (sorted by mentions)
  const topCars = Object.entries(carMentions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([slug, count]) => ({ slug, count }));
  
  // Get top comparisons
  const topComparisons = Array.from(popularComparisons.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([comparison, count]) => ({ comparison, count }));
  
  // Sample content gaps (show top 3)
  const topContentGaps = contentGaps.slice(0, 3);
  
  // Most expensive conversations (top 3)
  const mostExpensive = expensiveConversations
    .sort((a, b) => b.credits - a.credits)
    .slice(0, 3);
  
  return {
    // Volume metrics
    conversationCount: conversations.length,
    questionCount: totalQuestions,
    uniqueUsers,
    
    // Cost metrics
    totalCost,
    avgCostPerConversation,
    mostExpensiveConversations: mostExpensive,
    
    // Usage metrics
    totalToolCalls,
    avgMessagesPerConversation: conversations.length > 0 
      ? (messages?.length || 0) / conversations.length 
      : 0,
    
    // Topic insights
    topTopics,
    topCars,
    topComparisons,
    
    // Content opportunities
    contentGaps: topContentGaps,
    
    // Quality signals
    qualitySignals: {
      gapDetected: contentGaps.length,
      gapRate: contentGaps.length / conversations.length,
    },
  };
}

const alIntelligence = {
  generateALIntelligence,
  recordContentGap,
  analyzeConversationForGaps,
  analyzeRecentConversationsForGaps,
  getUnresolvedGaps,
  getContentGapStats,
  detectContentGapEnhanced,
  extractQuestionPattern,
  categorizeQuestion,
  extractCarMentions,
};

export default alIntelligence;

