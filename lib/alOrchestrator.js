/**
 * AL Orchestrator - Main Entry Point for Multi-Agent System
 *
 * This module provides the high-level interface for the multi-agent AL system.
 * It can be used by the API route to process queries using the new architecture.
 *
 * Features:
 * - Intent classification using Haiku (fast, cheap)
 * - Routing to 8 specialist agents
 * - Streaming support for real-time responses
 * - A/B testing support (can run alongside monolithic system)
 * - Parallel execution for multi-intent queries (future)
 *
 * Usage:
 * ```js
 * import { processWithMultiAgent, streamWithMultiAgent } from '@/lib/alOrchestrator';
 *
 * // Non-streaming
 * const result = await processWithMultiAgent({
 *   message: "Tell me about the 911 GT3",
 *   userId: "user-123",
 *   carSlug: "porsche-911-gt3",
 * });
 *
 * // Streaming
 * const stream = await streamWithMultiAgent({
 *   message: "Compare 911 vs Cayman",
 *   userId: "user-123",
 *   onText: (text) => sendSSE('text', { content: text }),
 * });
 * ```
 */

import { createAgent } from './alAgents/index.js';
import { classifyIntent } from './alAgents/orchestrator.js';
import { buildAIContext } from './aiMechanicService';
import { getPlan, formatCentsAsDollars } from './alConfig';
import {
  createConversation,
  getConversation,
  addMessage,
  formatMessagesForClaude,
} from './alConversationService';
import { getUserBalance, deductUsage, incrementDailyQuery } from './alUsageService';

// =============================================================================
// USER-FRIENDLY TOOL LABELS
// =============================================================================

/**
 * Get a user-friendly label for a tool that's about to be called.
 * Shown to users during streaming so they understand what AL is doing.
 */
function getToolLabel(toolName) {
  const labels = {
    // Car research
    get_car_ai_context: 'Loading vehicle data...',
    search_cars: 'Searching car database...',
    compare_cars: 'Comparing vehicles...',
    decode_vin: 'Decoding VIN...',
    get_expert_reviews: 'Finding expert reviews...',
    get_known_issues: 'Looking up known issues...',
    get_price_history: 'Checking price history...',
    get_maintenance_schedule: 'Loading maintenance schedule...',

    // Parts & mods
    search_parts: 'Searching parts catalog...',
    find_best_parts: 'Finding best parts...',
    get_upgrade_info: 'Loading upgrade information...',
    recommend_build: 'Generating build recommendations...',
    calculate_mod_impact: 'Calculating performance gains...',

    // Performance data
    get_dyno_runs: 'Loading dyno data...',
    get_track_lap_times: 'Loading lap times...',

    // Community & events
    search_community_insights: 'Reading owner experiences...',
    search_events: 'Finding car events...',

    // Knowledge
    search_encyclopedia: 'Checking encyclopedia...',
    search_knowledge: 'Searching knowledge base...',

    // Web & external
    search_web: 'Searching the web...',
    read_url: 'Reading article...',

    // User context
    get_user_context: 'Loading your profile...',
    get_user_builds: 'Loading your builds...',
    get_user_goals: 'Loading your goals...',
    get_user_vehicle_details: 'Loading your vehicle...',
    analyze_vehicle_health: 'Analyzing vehicle health...',

    // Vision
    analyze_uploaded_content: 'Analyzing your image...',
  };

  return labels[toolName] || 'Researching...';
}

// =============================================================================
// FEATURE FLAG
// =============================================================================

/**
 * Feature flag to enable multi-agent architecture
 * When disabled, the system falls back to the monolithic approach
 */
export const MULTI_AGENT_ENABLED = process.env.ENABLE_MULTI_AGENT === 'true';

/**
 * Percentage of traffic to route to multi-agent (for gradual rollout)
 * 0 = all monolithic, 100 = all multi-agent
 */
export const MULTI_AGENT_ROLLOUT_PERCENT = parseInt(
  process.env.MULTI_AGENT_ROLLOUT_PERCENT || '0',
  10
);

/**
 * Check if a request should use multi-agent based on rollout percentage
 * Uses consistent hashing based on userId for stable assignment
 * @param {string} userId - User ID for consistent assignment
 * @returns {boolean} Whether to use multi-agent
 */
export function shouldUseMultiAgent(userId) {
  if (!MULTI_AGENT_ENABLED) return false;
  if (MULTI_AGENT_ROLLOUT_PERCENT >= 100) return true;
  if (MULTI_AGENT_ROLLOUT_PERCENT <= 0) return false;

  // Consistent hash based on userId
  const hash =
    userId?.split('').reduce((acc, char) => {
      return (acc << 5) - acc + char.charCodeAt(0);
    }, 0) || 0;

  return Math.abs(hash % 100) < MULTI_AGENT_ROLLOUT_PERCENT;
}

// =============================================================================
// NON-STREAMING INTERFACE
// =============================================================================

/**
 * Process a query using the multi-agent system (non-streaming)
 *
 * @param {Object} params - Processing parameters
 * @param {string} params.message - User's message
 * @param {string} params.userId - User ID
 * @param {string} params.carSlug - Current car context (optional)
 * @param {string} params.vehicleId - User's vehicle ID (optional)
 * @param {string} params.currentPage - Current page context
 * @param {string} params.conversationId - Existing conversation ID (optional)
 * @param {Array} params.history - Conversation history (for new conversations)
 * @param {Array} params.attachments - Attached files
 * @param {string} params.correlationId - Request correlation ID
 * @param {boolean} params.isInternalEval - Whether this is an internal evaluation
 * @returns {Promise<Object>} Processing result
 */
export async function processWithMultiAgent({
  message,
  userId,
  carSlug,
  vehicleId,
  currentPage,
  conversationId,
  history = [],
  attachments = [],
  correlationId,
  isInternalEval = false,
  requestedPlanId,
}) {
  const startTime = Date.now();

  // Get user balance and plan
  let userBalance, plan, dailyUsage;

  if (!isInternalEval) {
    dailyUsage = await incrementDailyQuery(userId);
    userBalance = await getUserBalance(userId);
    plan = getPlan(userBalance.plan);
  } else {
    const evalPlanId = requestedPlanId || 'tuner';
    plan = getPlan(evalPlanId);
    userBalance = {
      plan: evalPlanId,
      planName: plan.name,
      balanceCents: 999999,
      lastRefillDate: null,
    };
  }

  // Build context
  const context = await buildAIContext({
    carSlug,
    userId: isInternalEval ? null : userId,
    vehicleId,
    currentPage,
    userMessage: message,
  });

  // Handle conversation
  let activeConversationId = conversationId;
  let existingMessages = [];

  if (!isInternalEval) {
    if (conversationId) {
      const convResult = await getConversation(conversationId);
      if (convResult.success && convResult.messages) {
        existingMessages = convResult.messages;
      }
    } else {
      const convResult = await createConversation(userId, {
        carSlug,
        page: currentPage,
        firstMessage: message,
      });
      if (convResult.success) {
        activeConversationId = convResult.conversation.id;
      }
    }

    // Store user message
    if (activeConversationId) {
      await addMessage(activeConversationId, {
        role: 'user',
        content: message,
        carContextSlug: carSlug,
      });
    }
  }

  // Format conversation history
  const conversationHistory =
    existingMessages.length > 0
      ? formatMessagesForClaude(existingMessages)
      : history.slice(-10).map((m) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        }));

  // Add user message to conversation history for classification
  const messagesForClassification = [...conversationHistory, { role: 'user', content: message }];

  // Step 1: Classify intent using orchestrator
  const classification = await classifyIntent({
    messages: messagesForClassification,
    context: { currentCar: context.car },
    skipLLM: false,
    observability: { userId, requestId: correlationId },
  });

  console.info(
    `[AL Multi-Agent:${correlationId}] Classified as ${classification.intent} (${(classification.confidence * 100).toFixed(0)}% confidence)`
  );

  // Step 2: Create the appropriate specialist agent
  const agent = createAgent(classification.intent, {
    correlationId,
    userId,
    context: {
      car: context.car,
      userVehicle: context.userVehicle,
      stats: context.stats,
      currentPage,
    },
    maxToolCalls: plan?.maxToolCallsPerMessage || 5,
  });

  // Step 3: Execute the agent
  const result = await agent.execute({
    message,
    conversationHistory,
    contextData: {
      car: context.car,
      userVehicle: context.userVehicle,
      stats: context.stats,
      currentPage,
    },
    attachments,
  });

  // Store assistant response
  if (activeConversationId && result.response && !isInternalEval) {
    await addMessage(activeConversationId, {
      role: 'assistant',
      content: result.response,
      toolCalls: result.toolCallsUsed,
      costCents: result.usage.costCents,
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      carContextSlug: carSlug,
      carContextName: context.car?.name,
      dataSources: result.toolCallsUsed.map((tool) => ({ type: 'tool', name: tool })),
    });

    // Deduct usage
    await deductUsage(userId, {
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      toolCalls: result.toolCallsUsed,
      carSlug,
    });
  }

  const totalDurationMs = Date.now() - startTime;

  return {
    response: result.response,
    conversationId: activeConversationId,
    context: {
      carName: context.car?.name,
      domains: [],
      intent: {
        primary: classification.intent,
        confidence: classification.confidence,
      },
      toolsUsed: result.toolCallsUsed || [],
      correlationId,
      agentUsed: result.agentId,
      agentName: result.agentName,
      classificationMs: 0, // Would need to track this
      usedLLM: classification.usedLLM,
    },
    usage: {
      costCents: result.usage?.costCents || 0,
      costFormatted: result.usage?.costFormatted || '$0.00',
      remainingBalanceCents: userBalance.balanceCents - (result.usage?.costCents || 0),
      remainingBalanceFormatted: formatCentsAsDollars(
        userBalance.balanceCents - (result.usage?.costCents || 0)
      ),
      inputTokens: result.usage?.inputTokens || 0,
      outputTokens: result.usage?.outputTokens || 0,
      toolCalls: (result.toolCallsUsed || []).length,
    },
    dailyUsage: dailyUsage
      ? {
          queriesToday: dailyUsage.queriesToday,
          isBeta: dailyUsage.isBeta,
          isUnlimited: dailyUsage.isUnlimited,
        }
      : null,
    multiAgent: true,
    totalDurationMs,
  };
}

// =============================================================================
// STREAMING INTERFACE
// =============================================================================

/**
 * Process a query using the multi-agent system with streaming
 *
 * @param {Object} params - Processing parameters
 * @param {Function} params.sendSSE - Function to send SSE events
 * @param {Function} params.onComplete - Callback when complete
 * @returns {Promise<void>}
 */
export async function streamWithMultiAgent({
  message,
  userId,
  carSlug,
  vehicleId,
  currentPage,
  conversationId,
  history = [],
  attachments = [],
  correlationId,
  isInternalEval = false,
  requestedPlanId,
  sendSSE,
  controller,
}) {
  const startTime = Date.now();

  try {
    // Get user balance and plan
    let userBalance, plan, dailyUsage;

    if (!isInternalEval) {
      dailyUsage = await incrementDailyQuery(userId);
      userBalance = await getUserBalance(userId);
      plan = getPlan(userBalance.plan);
    } else {
      const evalPlanId = requestedPlanId || 'tuner';
      plan = getPlan(evalPlanId);
      userBalance = {
        plan: evalPlanId,
        planName: plan.name,
        balanceCents: 999999,
        lastRefillDate: null,
      };
    }

    // Build context
    const context = await buildAIContext({
      carSlug,
      userId: isInternalEval ? null : userId,
      vehicleId,
      currentPage,
      userMessage: message,
    });

    // Handle conversation
    let activeConversationId = conversationId;
    let existingMessages = [];

    if (!isInternalEval) {
      if (conversationId) {
        const convResult = await getConversation(conversationId);
        if (convResult.success && convResult.messages) {
          existingMessages = convResult.messages;
        }
      } else {
        const convResult = await createConversation(userId, {
          carSlug,
          page: currentPage,
          firstMessage: message,
        });
        if (convResult.success) {
          activeConversationId = convResult.conversation.id;
        }
      }

      // Store user message
      if (activeConversationId) {
        await addMessage(activeConversationId, {
          role: 'user',
          content: message,
          carContextSlug: carSlug,
        });
      }
    }

    // Format conversation history
    const conversationHistory =
      existingMessages.length > 0
        ? formatMessagesForClaude(existingMessages)
        : history.slice(-10).map((m) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content,
          }));

    // Send initial connection event
    sendSSE('connected', {
      correlationId,
      conversationId: activeConversationId,
      multiAgent: true,
      dailyUsage: dailyUsage
        ? {
            queriesToday: dailyUsage.queriesToday,
            isBeta: dailyUsage.isBeta,
            isUnlimited: dailyUsage.isUnlimited,
          }
        : null,
    });

    // Send understanding phase
    sendSSE('phase', { phase: 'understanding', label: 'Understanding your question...' });

    // Add user message to conversation history for classification
    const messagesForClassification = [...conversationHistory, { role: 'user', content: message }];

    // Step 1: Classify intent
    const classification = await classifyIntent({
      messages: messagesForClassification,
      context: { currentCar: context.car },
      skipLLM: false,
      observability: { userId, requestId: correlationId },
    });

    sendSSE('classified', {
      intent: classification.intent,
      confidence: classification.confidence,
      usedLLM: classification.usedLLM,
    });

    console.info(
      `[AL Multi-Agent:${correlationId}] Classified as ${classification.intent} (${(classification.confidence * 100).toFixed(0)}% confidence)`
    );

    // Step 2: Create the appropriate specialist agent
    const agent = createAgent(classification.intent, {
      correlationId,
      userId,
      context: {
        car: context.car,
        userVehicle: context.userVehicle,
        stats: context.stats,
        currentPage,
      },
      maxToolCalls: plan?.maxToolCallsPerMessage || 5,
    });

    sendSSE('agent_start', {
      agentId: agent.agentId,
      agentName: agent.agentName,
    });
    sendSSE('phase', { phase: 'thinking', label: `${agent.agentName} is analyzing...` });

    // Step 3: Execute the agent with streaming callbacks
    let _fullResponse = '';

    const result = await agent.execute({
      message,
      conversationHistory,
      contextData: {
        car: context.car,
        userVehicle: context.userVehicle,
        stats: context.stats,
        currentPage,
      },
      attachments,
      onToolStart: (tool) => {
        const toolLabel = getToolLabel(tool.tool);
        sendSSE('tool_start', { tool: tool.tool, id: tool.id, label: toolLabel });
        sendSSE('phase', { phase: 'researching', label: toolLabel });
      },
      onToolResult: (toolResult) => {
        sendSSE('tool_result', {
          tool: toolResult.tool,
          id: toolResult.id,
          success: toolResult.success,
          durationMs: toolResult.durationMs,
        });
      },
      onText: (text) => {
        _fullResponse += text;
        sendSSE('text', { content: text });
      },
    });

    // Store assistant response
    const toolCallsUsed = result.toolCallsUsed || [];
    const usage = result.usage || {};

    if (activeConversationId && result.response && !isInternalEval) {
      await addMessage(activeConversationId, {
        role: 'assistant',
        content: result.response,
        toolCalls: toolCallsUsed,
        costCents: usage.costCents || 0,
        inputTokens: usage.inputTokens || 0,
        outputTokens: usage.outputTokens || 0,
        carContextSlug: carSlug,
        carContextName: context.car?.name,
        dataSources: toolCallsUsed.map((tool) => ({ type: 'tool', name: tool })),
      });

      // Deduct usage
      const deductResult = await deductUsage(userId, {
        inputTokens: usage.inputTokens || 0,
        outputTokens: usage.outputTokens || 0,
        toolCalls: toolCallsUsed,
        carSlug,
      });

      userBalance.balanceCents = deductResult.newBalanceCents ?? userBalance.balanceCents;
    }

    // Send final metadata event
    sendSSE('done', {
      conversationId: activeConversationId,
      usage: {
        costCents: usage.costCents || 0,
        costFormatted: usage.costFormatted || '$0.00',
        remainingBalanceCents: userBalance.balanceCents,
        remainingBalanceFormatted: formatCentsAsDollars(userBalance.balanceCents),
        inputTokens: usage.inputTokens || 0,
        outputTokens: usage.outputTokens || 0,
        toolCalls: toolCallsUsed.length,
      },
      toolsUsed: toolCallsUsed,
      multiAgent: true,
      agentUsed: result.agentId,
      totalDurationMs: Date.now() - startTime,
      dailyUsage: dailyUsage
        ? {
            queriesToday: dailyUsage.queriesToday,
            isBeta: dailyUsage.isBeta,
            isUnlimited: dailyUsage.isUnlimited,
          }
        : null,
    });

    if (controller) {
      controller.close();
    }
  } catch (error) {
    console.error('[AL Multi-Agent] Streaming error:', error);
    sendSSE('error', {
      message: 'Unable to process your request. Please try again.',
    });
    if (controller) {
      controller.close();
    }
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

const alOrchestrator = {
  MULTI_AGENT_ENABLED,
  MULTI_AGENT_ROLLOUT_PERCENT,
  shouldUseMultiAgent,
  processWithMultiAgent,
  streamWithMultiAgent,
};

export default alOrchestrator;
