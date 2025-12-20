/**
 * AL Intelligence System
 * 
 * Analyzes AL conversation data to extract business insights:
 * - Popular topics and questions
 * - Content gaps (what users are asking that we don't have content for)
 * - User behavior patterns
 * - Cost optimization opportunities
 * - Quality signals (did users find AL helpful?)
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
 * Detect if a question couldn't be answered well (content gap)
 */
function detectContentGap(userMessage, assistantMessage) {
  const assistant = assistantMessage.toLowerCase();
  
  // Signals that AL couldn't answer well
  const gapIndicators = [
    'don\'t have specific',
    'don\'t have enough',
    'not in my database',
    'can\'t find',
    'don\'t have data on',
    'not sure',
    'unfortunately i don',
  ];
  
  return gapIndicators.some(indicator => assistant.includes(indicator));
}

/**
 * Detect positive outcome signals (user took action after AL chat)
 */
async function detectPositiveOutcome(userId, conversationEndTime) {
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

export default {
  generateALIntelligence,
};

