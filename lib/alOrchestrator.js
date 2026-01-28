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

import { buildAIContext } from './aiMechanicService';
import { filterContextForIntent, getContextSummary } from './alAgents/contextFilter.js';
import { formatResponse, createStreamFormatter } from './alAgents/formatterAgent';
import { createAgent } from './alAgents/index.js';
import { classifyIntent } from './alAgents/orchestrator.js';
import { getPlan, formatCentsAsDollars } from './alConfig';
import {
  createConversation,
  getConversation,
  addMessage,
  formatMessagesForClaude,
} from './alConversationService';
import { extractAndSavePartsFromResponse } from './alTools';
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
    get_car_ai_context: 'Loading vehicle specs...',
    search_cars: 'Searching car database...',
    compare_cars: 'Comparing vehicles...',
    decode_vin: 'Decoding VIN...',
    get_expert_reviews: 'Finding expert reviews...',
    get_known_issues: 'Looking up known issues...',
    get_price_history: 'Checking price history...',
    get_maintenance_schedule: 'Loading maintenance schedule...',
    get_service_intervals: 'Loading service intervals...',
    get_recalls: 'Checking recalls...',

    // Parts & mods (CRITICAL - these are high-frequency tools)
    research_parts_live: 'Searching parts vendors...', // PRIMARY parts research tool
    search_parts: 'Checking parts catalog...',
    find_best_parts: 'Finding top-rated parts...',
    get_upgrade_info: 'Loading mod details...',
    recommend_build: 'Creating build plan...',
    calculate_mod_impact: 'Calculating power gains...',
    get_compatible_mods: 'Checking mod compatibility...',

    // Performance data
    get_dyno_runs: 'Loading dyno results...',
    get_track_lap_times: 'Loading track times...',
    get_acceleration_data: 'Loading acceleration data...',

    // Community & events
    search_community_insights: 'Reading owner experiences...',
    search_events: 'Finding car events...',
    get_community_builds: 'Loading community builds...',

    // Knowledge
    search_encyclopedia: 'Checking encyclopedia...',
    search_knowledge: 'Searching knowledge base...',

    // Web & external
    search_web: 'Searching the web...',
    read_url: 'Reading article...',

    // User context
    get_user_context: 'Loading your garage...',
    get_user_builds: 'Loading your builds...',
    get_user_goals: 'Loading your goals...',
    get_user_vehicle_details: 'Loading your vehicle...',
    analyze_vehicle_health: 'Analyzing vehicle health...',
    get_user_favorites: 'Loading your favorites...',

    // Vision
    analyze_uploaded_content: 'Analyzing your image...',
  };

  return labels[toolName] || `Querying ${toolName.replace(/_/g, ' ')}...`;
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

  // Extract and save parts from response (async, non-blocking)
  // IMPORTANT: This must happen BEFORE formatting, using the ORIGINAL response
  // The extraction function can resolve car_slug from the response if context.car.id is not available
  const toolCallsUsed = result.toolCallsUsed || [];
  if (!isInternalEval && toolCallsUsed.includes('research_parts_live') && result.response) {
    console.log(
      `[AL Multi-Agent:${correlationId}] research_parts_live was used - attempting parts extraction` +
        (context.car?.id ? ` (car context: ${context.car.id})` : ' (will resolve from response)')
    );
    extractAndSavePartsFromResponse(
      result.response, // Use the ORIGINAL response with <parts_to_save> block
      context.car?.id || null, // May be null - extraction function will resolve from car_slug in response
      correlationId,
      activeConversationId
    );
  }

  // Step 4: Format response (final quality gate before user sees it)
  const formatterResult = await formatResponse({
    rawResponse: result.response,
    correlationId,
    userId,
  });
  const cleanedResponse = formatterResult.response;

  // Track combined usage (agent + formatter)
  const totalInputTokens =
    (result.usage?.inputTokens || 0) + (formatterResult.usage?.inputTokens || 0);
  const totalOutputTokens =
    (result.usage?.outputTokens || 0) + (formatterResult.usage?.outputTokens || 0);
  const totalCostCents = (result.usage?.costCents || 0) + (formatterResult.usage?.costCents || 0);

  // Store assistant response
  if (activeConversationId && cleanedResponse && !isInternalEval) {
    await addMessage(activeConversationId, {
      role: 'assistant',
      content: cleanedResponse,
      toolCalls: toolCallsUsed,
      costCents: totalCostCents,
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
      carContextSlug: carSlug,
      carContextName: context.car?.name,
      dataSources: toolCallsUsed.map((tool) => ({ type: 'tool', name: tool })),
    });

    // Deduct usage
    await deductUsage(userId, {
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
      toolCalls: toolCallsUsed,
      carSlug,
    });
  }

  const totalDurationMs = Date.now() - startTime;

  return {
    response: cleanedResponse,
    conversationId: activeConversationId,
    context: {
      carName: context.car?.name,
      domains: [],
      intent: {
        primary: classification.intent,
        confidence: classification.confidence,
      },
      toolsUsed: toolCallsUsed,
      correlationId,
      agentUsed: result.agentId,
      agentName: result.agentName,
      formatterUsed: !formatterResult.skipped,
      classificationMs: 0,
      usedLLM: classification.usedLLM,
    },
    usage: {
      costCents: totalCostCents,
      costFormatted: formatCentsAsDollars(totalCostCents),
      remainingBalanceCents: userBalance.balanceCents - totalCostCents,
      remainingBalanceFormatted: formatCentsAsDollars(userBalance.balanceCents - totalCostCents),
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
      toolCalls: (result.toolCallsUsed || []).length,
      formatterCostCents: formatterResult.usage?.costCents || 0,
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
  userPreferences = null,
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

    // Step 2: Filter context based on intent (smart context - only relevant data)
    const fullContext = {
      car: context.car,
      userVehicle: context.userVehicle,
      allOwnedVehicles: context.allOwnedVehicles,
      userProfile: context.userProfile,
      userFavorites: context.userFavorites,
      userPersonalization: context.userPersonalization,
      stats: context.stats,
      currentPage,
    };

    const filteredContext = filterContextForIntent({
      intent: classification.intent,
      message,
      fullContext,
    });

    console.info(
      `[AL Multi-Agent:${correlationId}] Context: ${getContextSummary(filteredContext)}`
    );

    // Step 3: Create the appropriate specialist agent
    const agent = createAgent(classification.intent, {
      correlationId,
      userId,
      context: filteredContext,
      userPreferences, // Pass user's data source preferences for tool filtering
      maxToolCalls: plan?.maxToolCallsPerMessage || 5,
    });

    sendSSE('agent_start', {
      agentId: agent.agentId,
      agentName: agent.agentName,
    });
    sendSSE('phase', { phase: 'thinking', label: `${agent.agentName} is analyzing...` });

    // Step 4: Execute the agent with streaming callbacks
    let _fullResponse = '';
    let formatterUsage = { inputTokens: 0, outputTokens: 0, costCents: 0 };

    // Create stream formatter - buffers initial content to format, then passes through
    const streamFormatter = createStreamFormatter({
      correlationId,
      userId,
      onText: (text) => {
        sendSSE('text', { content: text });
      },
    });

    const result = await agent.execute({
      message,
      conversationHistory,
      contextData: filteredContext,
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
      onToolProgress: (progress) => {
        // Send progress updates for long-running tools like research_parts_live
        // This shows sub-steps completing (e.g., "Searching forums... done")
        sendSSE('tool_progress', {
          tool: progress.tool,
          id: progress.id,
          step: progress.step,
          stepLabel: progress.stepLabel,
          status: progress.status,
          sites: progress.sites,
          resultCount: progress.resultCount,
          completedCount: progress.completedCount,
          totalCount: progress.totalCount,
          error: progress.error,
        });
      },
      onText: async (text) => {
        _fullResponse += text;
        // Route through formatter for cleaning before sending to client
        await streamFormatter.addChunk(text);
      },
    });

    // Flush any remaining buffered content from stream formatter
    await streamFormatter.flush();

    // Extract tool calls early for parts extraction check
    const toolCallsUsed = result.toolCallsUsed || [];

    // Extract and save parts from response (async, non-blocking)
    // IMPORTANT: This must happen BEFORE formatting, using the ORIGINAL response
    // The extraction function can resolve car_slug from the response if context.car.id is not available
    if (!isInternalEval && toolCallsUsed.includes('research_parts_live') && _fullResponse) {
      console.log(
        `[AL Multi-Agent:${correlationId}] research_parts_live was used (streaming) - attempting parts extraction` +
          (context.car?.id ? ` (car context: ${context.car.id})` : ' (will resolve from response)')
      );
      extractAndSavePartsFromResponse(
        _fullResponse, // Use the ORIGINAL response with <parts_to_save> block
        context.car?.id || null, // May be null - extraction function will resolve from car_slug in response
        correlationId,
        activeConversationId
      );
    }

    // For storage, do a full format pass on the complete response
    const formatterResult = await formatResponse({
      rawResponse: _fullResponse,
      correlationId,
      userId,
    });
    const cleanedResponse = formatterResult.response;
    formatterUsage = formatterResult.usage || { inputTokens: 0, outputTokens: 0, costCents: 0 };

    // Track response quality for monitoring
    const responseQuality = {
      formatterSkipped: formatterResult.skipped || false,
      qualityIssue: formatterResult.qualityIssue || null,
      originalLength: _fullResponse?.length || 0,
      cleanedLength: cleanedResponse?.length || 0,
      hadInternalBlocks: _fullResponse?.includes('<parts_to_save>') || false,
      agentValidation: result.responseValidation || null,
    };

    // Log quality issues for monitoring
    if (responseQuality.qualityIssue || responseQuality.agentValidation?.issue) {
      console.warn(
        `[AL Multi-Agent:${correlationId}] Response quality issue detected: ` +
          `formatter=${responseQuality.qualityIssue || 'none'}, ` +
          `agent=${responseQuality.agentValidation?.issue || 'none'}, ` +
          `originalLen=${responseQuality.originalLength}, cleanedLen=${responseQuality.cleanedLength}`
      );
    }

    // Store assistant response (with properly formatted content)
    const usage = result.usage || {};
    const totalCostCents = (usage.costCents || 0) + (formatterUsage.costCents || 0);
    const totalInputTokens = (usage.inputTokens || 0) + (formatterUsage.inputTokens || 0);
    const totalOutputTokens = (usage.outputTokens || 0) + (formatterUsage.outputTokens || 0);

    if (activeConversationId && cleanedResponse && !isInternalEval) {
      await addMessage(activeConversationId, {
        role: 'assistant',
        content: cleanedResponse, // Store the formatted response
        toolCalls: toolCallsUsed,
        costCents: totalCostCents,
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        carContextSlug: carSlug,
        carContextName: context.car?.name,
        dataSources: toolCallsUsed.map((tool) => ({ type: 'tool', name: tool })),
      });

      // Deduct usage (including formatter cost)
      const deductResult = await deductUsage(userId, {
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        toolCalls: toolCallsUsed,
        carSlug,
      });

      userBalance.balanceCents = deductResult.newBalanceCents ?? userBalance.balanceCents;
    }

    // Send final metadata event
    sendSSE('done', {
      conversationId: activeConversationId,
      usage: {
        costCents: totalCostCents,
        costFormatted: formatCentsAsDollars(totalCostCents),
        remainingBalanceCents: userBalance.balanceCents,
        remainingBalanceFormatted: formatCentsAsDollars(userBalance.balanceCents),
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        toolCalls: toolCallsUsed.length,
        formatterCostCents: formatterUsage.costCents || 0,
      },
      toolsUsed: toolCallsUsed,
      multiAgent: true,
      agentUsed: result.agentId,
      formatterUsed: !formatterResult.skipped,
      totalDurationMs: Date.now() - startTime,
      dailyUsage: dailyUsage
        ? {
            queriesToday: dailyUsage.queriesToday,
            isBeta: dailyUsage.isBeta,
            isUnlimited: dailyUsage.isUnlimited,
          }
        : null,
      // Include quality metadata for client-side tracking (optional use)
      responseQuality: responseQuality.qualityIssue
        ? {
            issue: responseQuality.qualityIssue,
            usedFallback: responseQuality.agentValidation?.usedFallback || false,
          }
        : undefined,
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
