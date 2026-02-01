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
 *   carId: "uuid-here", // Use carId (UUID) instead of carSlug
 * });
 *
 * // Streaming
 * const stream = await streamWithMultiAgent({
 *   message: "Compare 911 vs Cayman",
 *   userId: "user-123",
 *   carId: "uuid-here",
 *   onText: (text) => sendSSE('text', { content: text }),
 * });
 * ```
 */

import { buildAIContext } from './aiMechanicService';
import { filterContextForIntent, getContextSummary } from './alAgents/contextFilter.js';
import {
  formatResponse,
  createStreamFormatter,
  getContextualFallback,
} from './alAgents/formatterAgent';
import { createAgent, INTENT_TYPES } from './alAgents/index.js';
import { classifyIntent } from './alAgents/orchestrator.js';
import { extractAndResolveCars, formatCarMention } from './alCarExtractor';
import { getPlan, formatCentsAsDollars } from './alConfig';
import { getConversation, addMessage, formatMessagesForClaude } from './alConversationService';
import { extractAndSavePartsFromResponse } from './alTools';
import { createTracer } from './alTracingService';
import { getUserBalance, deductUsage, incrementDailyQuery } from './alUsageService';
import { submitCarRequest } from './carRequestService';
import { resolveCarId, getSlugFromCarId } from './carResolver';

// =============================================================================
// RESPONSE VALIDATION (Catches broken responses before user sees them)
// =============================================================================

const MIN_RESPONSE_LENGTH = 80; // Minimum characters for a valid response

/**
 * Patterns that indicate a broken/placeholder response
 */
const INVALID_RESPONSE_PATTERNS = [
  /I apologize.*(?:incomplete|placeholder|unable|couldn't)/i,
  /placeholder response/i,
  /no.*content to format/i,
  /wasn't able to generate/i,
  /I don't have.*(?:data|information|database)/i,
  /not in (?:our|my|the) database/i,
  /database (?:doesn't|does not) (?:have|contain)/i,
  /outside (?:our|my) (?:database|coverage)/i,
  /I couldn't find any/i,
  /no results (?:found|returned)/i,
];

/**
 * Validate agent response before formatting
 * Catches empty, too-short, or placeholder responses
 *
 * @param {string} response - The agent's raw response
 * @param {Object} context - Request context for logging
 * @returns {Object} { valid: boolean, reason?: string, shouldRetry?: boolean }
 */
function validateAgentResponse(response, context = {}) {
  const correlationId = context.correlationId || 'unknown';

  // Check for empty response
  if (!response || response.trim().length === 0) {
    console.warn(`[AL Validation:${correlationId}] INVALID: Empty response`);
    return { valid: false, reason: 'empty_response', shouldRetry: true };
  }

  // Strip internal blocks to check actual user-visible content
  const visibleContent = response
    .replace(/<parts_to_save>[\s\S]*?<\/parts_to_save>/gi, '')
    .replace(/<internal_data>[\s\S]*?<\/internal_data>/gi, '')
    .trim();

  // Check if stripping removed everything
  if (visibleContent.length < 20) {
    console.warn(
      `[AL Validation:${correlationId}] INVALID: Only internal blocks (${response.length} -> ${visibleContent.length} chars)`
    );
    return { valid: false, reason: 'only_internal_blocks', shouldRetry: true };
  }

  // Check for too-short response
  if (visibleContent.length < MIN_RESPONSE_LENGTH) {
    console.warn(
      `[AL Validation:${correlationId}] INVALID: Too short (${visibleContent.length} chars)`
    );
    return { valid: false, reason: 'too_short', shouldRetry: true };
  }

  // Check for placeholder/error patterns
  for (const pattern of INVALID_RESPONSE_PATTERNS) {
    if (pattern.test(visibleContent)) {
      console.warn(
        `[AL Validation:${correlationId}] INVALID: Placeholder pattern detected: ${pattern}`
      );
      return {
        valid: false,
        reason: 'placeholder_detected',
        pattern: pattern.toString(),
        shouldRetry: true,
      };
    }
  }

  return { valid: true };
}

/**
 * Get a recovery fallback response when agent response is invalid
 * Uses intent to provide contextually appropriate help
 */
function getRecoveryFallback(intent, context = {}) {
  const carMention = context.carMention || context.car?.name || 'your car';

  // Map intents to appropriate fallbacks
  const intentFallbacks = {
    [INTENT_TYPES.PARTS_RESEARCH]: `## Performance Upgrade Recommendations for ${carMention}

Here are proven approaches to make your car faster:

**Stage 1 Bolt-Ons (Best Bang for Buck):**
- **Cold Air Intake** - Improved throttle response, 5-15 HP
- **Cat-back Exhaust** - Better flow, great sound, 10-20 HP
- **ECU Tune** - Unlocks hidden performance, 15-30+ HP

**Popular Parts Vendors:**
- **034 Motorsport** - European performance specialists
- **ECS Tuning** - Wide selection, good prices
- **FCP Euro** - Lifetime replacement warranty

Could you tell me more about your specific goals? I can give more targeted recommendations with details about your budget and whether you're focused on daily driving or track performance.`,

    [INTENT_TYPES.BUILD_PLANNING]: `## Build Planning for ${carMention}

Here's a proven upgrade path that works for most platforms:

**Stage 1 - Foundation (~$1,500-2,500):**
1. **Cold Air Intake** - Start here, easy install
2. **Cat-back Exhaust** - Flow improvement + sound
3. **ECU Tune** - Ties everything together

**Stage 2 - Serious Power (~$3,000-5,000):**
- Headers or downpipe (platform dependent)
- Upgraded intercooler (turbo cars)
- Supporting fuel mods if needed

**Handling (Don't Skip This):**
- Coilovers for adjustability
- Upgraded sway bars
- Quality tires make the biggest difference

What's your primary goal - daily driver fun, weekend spirited driving, or track preparation? And what's your approximate budget?`,

    [INTENT_TYPES.CAR_DISCOVERY]: `## Vehicle Information

I'd be happy to help you learn more about ${carMention}. What aspect interests you most?

- **Performance specs** - Power, acceleration, handling characteristics
- **Reliability** - Common issues, maintenance costs, longevity
- **Modifications** - Popular upgrades, tuning potential
- **Buying advice** - What to look for, fair pricing, best years

Just let me know what you'd like to focus on!`,
  };

  // Return intent-specific fallback or generic one
  return intentFallbacks[intent] || getContextualFallback(null, intent);
}

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
 * @param {string} params.carId - Current car context (UUID, optional)
 * @param {string} params.carSlug - Deprecated: car slug (will be resolved to carId if carId not provided)
 * @param {string} params.vehicleId - User's vehicle ID (optional)
 * @param {string} params.currentPage - Current page context
 * @param {string} params.conversationId - Existing conversation ID (optional)
 * @param {Array} params.history - Conversation history (for new conversations)
 * @param {Array} params.attachments - Attached files
 * @param {string} params.correlationId - Request correlation ID
 * @param {boolean} params.isInternalEval - Whether this is an internal evaluation
 * @param {string} params.requestedPlanId - Plan ID for internal evaluation
 * @returns {Promise<Object>} Processing result
 */
export async function processWithMultiAgent({
  message,
  userId,
  carId,
  carSlug, // Deprecated: kept for backward compatibility
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

  // Resolve carId from carSlug if carId not provided (backward compatibility)
  let resolvedCarId = carId;
  if (!resolvedCarId && carSlug) {
    resolvedCarId = await resolveCarId(carSlug);
  }

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

  // Build context (buildAIContext accepts both carId and carSlug for backward compatibility)
  const context = await buildAIContext({
    carId: resolvedCarId,
    carSlug, // Keep for backward compatibility with buildAIContext
    userId: isInternalEval ? null : userId,
    vehicleId,
    currentPage,
    userMessage: message,
  });

  // =========================================================================
  // UNKNOWN CAR DETECTION (Enables graceful handling)
  // =========================================================================
  try {
    console.log(`[AL Multi-Agent:${correlationId}] ========== CAR EXTRACTION START ==========`);
    console.log(`[AL Multi-Agent:${correlationId}] Message: "${message.substring(0, 100)}..."`);

    const carExtraction = await extractAndResolveCars(message);

    console.log(
      `[AL Multi-Agent:${correlationId}] Extraction result:`,
      JSON.stringify({
        hasPrimaryCar: !!carExtraction.primaryCar,
        hasUnknownCar: carExtraction.hasUnknownCar,
        primaryCar: carExtraction.primaryCar
          ? {
              year: carExtraction.primaryCar.year,
              make: carExtraction.primaryCar.make,
              model: carExtraction.primaryCar.model,
              variant: carExtraction.primaryCar.variant,
              inDatabase: carExtraction.primaryCar.inDatabase,
            }
          : null,
      })
    );

    // Log extraction results for debugging
    if (carExtraction.primaryCar) {
      console.info(
        `[AL Multi-Agent:${correlationId}] Car extraction result: ` +
          `${carExtraction.primaryCar.year || '?'} ${carExtraction.primaryCar.make || '?'} ${carExtraction.primaryCar.model || '?'} ` +
          `(inDatabase: ${carExtraction.primaryCar.inDatabase}, hasUnknownCar: ${carExtraction.hasUnknownCar})`
      );
    }

    if (carExtraction.hasUnknownCar && carExtraction.primaryCar) {
      const mentionedCar = formatCarMention(carExtraction.primaryCar);
      console.info(
        `[AL Multi-Agent:${correlationId}] UNKNOWN_CAR detected: "${mentionedCar}" ` +
          `(inDatabase: ${carExtraction.primaryCar.inDatabase})`
      );

      // Log telemetry
      console.info(
        JSON.stringify({
          event: 'AL_UNKNOWN_CAR_DETECTED',
          timestamp: new Date().toISOString(),
          correlationId,
          userId: isInternalEval ? 'internal-eval' : userId,
          carMention: {
            raw: carExtraction.primaryCar.raw,
            year: carExtraction.primaryCar.year,
            make: carExtraction.primaryCar.make,
            model: carExtraction.primaryCar.model,
          },
          inDatabase: carExtraction.primaryCar.inDatabase,
          similarCarsInDb: carExtraction.primaryCar.similarCars?.map((c) => c.slug) || [],
        })
      );

      // Enrich context
      context.mentionedCar = carExtraction.primaryCar;
      context.carMentionFormatted = mentionedCar;
      context.hasUnknownCar = true;

      // Auto-submit car request to user_feedback for pipeline tracking
      // This helps prioritize which cars to add to the database
      if (
        !isInternalEval &&
        carExtraction.primaryCar.year &&
        carExtraction.primaryCar.make &&
        carExtraction.primaryCar.model
      ) {
        submitCarRequest(
          {
            year: carExtraction.primaryCar.year,
            make: carExtraction.primaryCar.make,
            model: carExtraction.primaryCar.model,
            trim: carExtraction.primaryCar.variant || null,
            source: 'al-chat', // Distinguish from garage requests
          },
          userId
        )
          .then((result) => {
            if (result.error) {
              console.warn(
                `[AL Multi-Agent:${correlationId}] Car request submission failed:`,
                result.error.message
              );
            } else {
              console.info(
                `[AL Multi-Agent:${correlationId}] Car request submitted to user_feedback: ${mentionedCar}`
              );
            }
          })
          .catch((err) => {
            console.warn(
              `[AL Multi-Agent:${correlationId}] Car request submission error:`,
              err.message
            );
          });
      }
    }
  } catch (extractErr) {
    console.warn(`[AL Multi-Agent:${correlationId}] Car extraction failed:`, extractErr.message);
  }

  // Handle conversation
  // NOTE: Conversation creation and user message storage is handled by the API route (route.js)
  // before calling this function. We only need to fetch existing messages for context.
  const activeConversationId = conversationId;
  let existingMessages = [];

  if (!isInternalEval && conversationId) {
    const convResult = await getConversation(conversationId);
    if (convResult.success && convResult.messages) {
      existingMessages = convResult.messages;
    }
  }

  // Format conversation history
  // Note: existingMessages already includes the user message stored by route.js
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

  // =========================================================================
  // RESPONSE VALIDATION (Critical - catches broken responses)
  // =========================================================================
  let responseToFormat = result.response;
  const validation = validateAgentResponse(result.response, {
    correlationId,
    intent: classification.intent,
    car: context.car,
  });

  if (!validation.valid) {
    console.error(
      `[AL Multi-Agent:${correlationId}] RESPONSE_VALIDATION_FAILED: ${validation.reason}. ` +
        `Intent: ${classification.intent}. Using recovery fallback.`
    );

    // Log telemetry
    console.error(
      JSON.stringify({
        event: 'AL_RESPONSE_VALIDATION_FAILED',
        timestamp: new Date().toISOString(),
        correlationId,
        userId,
        intent: classification.intent,
        reason: validation.reason,
        originalLength: result.response?.length || 0,
        carContext: context.car?.slug || null,
      })
    );

    // Replace with recovery fallback
    responseToFormat = getRecoveryFallback(classification.intent, {
      carMention: context.car?.name || 'your vehicle',
      car: context.car,
    });
  }

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
    rawResponse: responseToFormat,
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
    // Resolve carSlug from carId for addMessage (backward compatibility with schema)
    let carContextSlug = carSlug;
    if (!carContextSlug && resolvedCarId) {
      carContextSlug = await getSlugFromCarId(resolvedCarId);
    }

    await addMessage(activeConversationId, {
      role: 'assistant',
      content: cleanedResponse,
      toolCalls: toolCallsUsed,
      costCents: totalCostCents,
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
      carContextSlug,
      carContextName: context.car?.name,
      dataSources: toolCallsUsed.map((tool) => ({ type: 'tool', name: tool })),
    });

    // Deduct usage (deductUsage expects carId)
    await deductUsage(userId, {
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
      toolCalls: toolCallsUsed,
      carId: resolvedCarId,
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
 * @param {string} params.message - User's message
 * @param {string} params.userId - User ID
 * @param {string} params.carId - Current car context (UUID, optional)
 * @param {string} params.carSlug - Deprecated: car slug (will be resolved to carId if carId not provided)
 * @param {string} params.vehicleId - User's vehicle ID (optional)
 * @param {string} params.currentPage - Current page context
 * @param {string} params.conversationId - Existing conversation ID (optional)
 * @param {Array} params.history - Conversation history (for new conversations)
 * @param {Array} params.attachments - Attached files
 * @param {string} params.correlationId - Request correlation ID
 * @param {boolean} params.isInternalEval - Whether this is an internal evaluation
 * @param {string} params.requestedPlanId - Plan ID for internal evaluation
 * @param {Object} params.userPreferences - User preferences for data sources
 * @param {Function} params.sendSSE - Function to send SSE events
 * @param {Object} params.controller - AbortController for cancellation
 * @returns {Promise<void>}
 */
export async function streamWithMultiAgent({
  message,
  userId,
  carId,
  carSlug, // Deprecated: kept for backward compatibility
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

  // Resolve carId from carSlug if carId not provided (backward compatibility)
  let resolvedCarId = carId;
  if (!resolvedCarId && carSlug) {
    resolvedCarId = await resolveCarId(carSlug);
  }

  // Initialize request tracer for comprehensive logging
  const tracer = createTracer(correlationId, {
    userId,
    conversationId,
    carSlug, // Tracer may still use slug for logging
    pageContext: currentPage,
    isInternalEval,
  });
  tracer.setQuery(message, attachments);

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

    // Build context (buildAIContext accepts both carId and carSlug for backward compatibility)
    const context = await buildAIContext({
      carId: resolvedCarId,
      carSlug, // Keep for backward compatibility with buildAIContext
      userId: isInternalEval ? null : userId,
      vehicleId,
      currentPage,
      userMessage: message,
    });

    // =========================================================================
    // UNKNOWN CAR DETECTION (Enables graceful handling)
    // =========================================================================
    // Extract car mentions from user message and check if they're in our database
    let carExtraction = null;
    try {
      carExtraction = await extractAndResolveCars(message);

      // Log extraction results for debugging
      if (carExtraction.primaryCar) {
        console.info(
          `[AL Multi-Agent:${correlationId}] Car extraction result: ` +
            `${carExtraction.primaryCar.year || '?'} ${carExtraction.primaryCar.make || '?'} ${carExtraction.primaryCar.model || '?'} ` +
            `(inDatabase: ${carExtraction.primaryCar.inDatabase}, hasUnknownCar: ${carExtraction.hasUnknownCar})`
        );

        // Track car extraction in tracer
        tracer.setCarExtraction({
          year: carExtraction.primaryCar.year,
          make: carExtraction.primaryCar.make,
          model: carExtraction.primaryCar.model,
          inDatabase: carExtraction.primaryCar.inDatabase,
          source: carExtraction.primaryCar.source || 'message_extraction',
        });
      }

      if (carExtraction.hasUnknownCar && carExtraction.primaryCar) {
        const mentionedCar = formatCarMention(carExtraction.primaryCar);
        console.info(
          `[AL Multi-Agent:${correlationId}] UNKNOWN_CAR detected: "${mentionedCar}" ` +
            `(inDatabase: ${carExtraction.primaryCar.inDatabase})`
        );

        // Log telemetry for monitoring unknown car queries
        console.info(
          JSON.stringify({
            event: 'AL_UNKNOWN_CAR_DETECTED',
            timestamp: new Date().toISOString(),
            correlationId,
            userId: isInternalEval ? 'internal-eval' : userId,
            carMention: {
              raw: carExtraction.primaryCar.raw,
              year: carExtraction.primaryCar.year,
              make: carExtraction.primaryCar.make,
              model: carExtraction.primaryCar.model,
              confidence: carExtraction.primaryCar.confidence,
            },
            inDatabase: carExtraction.primaryCar.inDatabase,
            similarCarsInDb: carExtraction.primaryCar.similarCars?.map((c) => c.slug) || [],
          })
        );

        // Enrich context with extracted car info for agents to use
        context.mentionedCar = carExtraction.primaryCar;
        context.carMentionFormatted = mentionedCar;
        context.hasUnknownCar = true;

        // Auto-submit car request to user_feedback for pipeline tracking
        // This helps prioritize which cars to add to the database
        if (
          !isInternalEval &&
          carExtraction.primaryCar.year &&
          carExtraction.primaryCar.make &&
          carExtraction.primaryCar.model
        ) {
          submitCarRequest(
            {
              year: carExtraction.primaryCar.year,
              make: carExtraction.primaryCar.make,
              model: carExtraction.primaryCar.model,
              trim: carExtraction.primaryCar.variant || null,
              source: 'al-chat', // Distinguish from garage requests
            },
            userId
          )
            .then((result) => {
              if (result.error) {
                console.warn(
                  `[AL Multi-Agent:${correlationId}] Car request submission failed:`,
                  result.error.message
                );
              } else {
                console.info(
                  `[AL Multi-Agent:${correlationId}] Car request submitted to user_feedback: ${mentionedCar}`
                );
              }
            })
            .catch((err) => {
              console.warn(
                `[AL Multi-Agent:${correlationId}] Car request submission error:`,
                err.message
              );
            });
        }
      }
    } catch (extractErr) {
      console.warn(`[AL Multi-Agent:${correlationId}] Car extraction failed:`, extractErr.message);
    }

    // Handle conversation
    // NOTE: Conversation creation and user message storage is handled by the API route (route.js)
    // before calling this function. We only need to fetch existing messages for context.
    const activeConversationId = conversationId;
    let existingMessages = [];

    if (!isInternalEval && conversationId) {
      const convResult = await getConversation(conversationId);
      if (convResult.success && convResult.messages) {
        existingMessages = convResult.messages;
      }
    }

    // Format conversation history
    // Note: existingMessages already includes the user message stored by route.js
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
    const classificationStart = Date.now();
    const classification = await classifyIntent({
      messages: messagesForClassification,
      context: { currentCar: context.car },
      skipLLM: false,
      observability: { userId, requestId: correlationId },
    });
    const classificationMs = Date.now() - classificationStart;

    // Track intent classification
    tracer.setIntent(classification.intent, classification.confidence, classificationMs);
    tracer.setUserTier && tracer.trace && (tracer.trace.user_tier = userBalance?.plan || null);

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
    const agentStartTime = Date.now();
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

    // Track agent execution
    const agentExecutionMs = Date.now() - agentStartTime;
    tracer.setAgent(result.agentId || classification.intent, classification.reasoning);
    tracer.setAgentTiming(agentExecutionMs);

    // Extract tool calls early for parts extraction check
    const toolCallsUsed = result.toolCallsUsed || [];

    // Track tool calls from agent result
    if (result.toolTimings) {
      for (const [toolName, timing] of Object.entries(result.toolTimings)) {
        tracer.trackToolCall(toolName, {
          startMs: 0,
          endMs: timing.durationMs || 0,
          success: timing.success !== false,
          cacheHit: timing.cacheHit || false,
        });
      }
    } else if (toolCallsUsed.length > 0) {
      // If no detailed timings, just track which tools were called
      for (const toolName of toolCallsUsed) {
        tracer.trackToolCall(toolName, {
          startMs: 0,
          endMs: 0,
          success: true,
        });
      }
    }

    // =========================================================================
    // RESPONSE VALIDATION (Critical - catches broken responses)
    // =========================================================================
    const validation = validateAgentResponse(_fullResponse, {
      correlationId,
      intent: classification.intent,
      car: context.car,
      carMention: message, // Pass original message for context
    });

    // Track response validation
    tracer.setResponse(_fullResponse, validation.valid, validation.reason);

    if (!validation.valid) {
      console.error(
        `[AL Multi-Agent:${correlationId}] RESPONSE_VALIDATION_FAILED: ${validation.reason}. ` +
          `Intent: ${classification.intent}. Using recovery fallback.`
      );

      // Log telemetry for monitoring
      console.error(
        JSON.stringify({
          event: 'AL_RESPONSE_VALIDATION_FAILED',
          timestamp: new Date().toISOString(),
          correlationId,
          userId,
          intent: classification.intent,
          reason: validation.reason,
          pattern: validation.pattern || null,
          originalLength: _fullResponse?.length || 0,
          carContext: context.car?.slug || null,
        })
      );

      // Replace broken response with recovery fallback
      const recoveryResponse = getRecoveryFallback(classification.intent, {
        carMention: context.car?.name || 'your vehicle',
        car: context.car,
      });

      // Send the recovery response to the client
      sendSSE('text', { content: recoveryResponse });
      _fullResponse = recoveryResponse;
    }

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
      // Resolve carSlug from carId for addMessage (backward compatibility with schema)
      let carContextSlug = carSlug;
      if (!carContextSlug && resolvedCarId) {
        carContextSlug = await getSlugFromCarId(resolvedCarId);
      }

      await addMessage(activeConversationId, {
        role: 'assistant',
        content: cleanedResponse, // Store the formatted response
        toolCalls: toolCallsUsed,
        costCents: totalCostCents,
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        carContextSlug,
        carContextName: context.car?.name,
        dataSources: toolCallsUsed.map((tool) => ({ type: 'tool', name: tool })),
      });

      // Deduct usage (deductUsage expects carId)
      const deductResult = await deductUsage(userId, {
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        toolCalls: toolCallsUsed,
        carId: resolvedCarId,
      });

      userBalance.balanceCents = deductResult.newBalanceCents ?? userBalance.balanceCents;
    }

    // Track token usage and cost
    tracer.setTokenUsage(totalInputTokens, totalOutputTokens, totalCostCents);
    tracer.setFormatterTiming(formatterResult.processingMs || 0);
    tracer.setConversationId(activeConversationId);

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

    // Save trace to database (non-blocking)
    tracer.save().catch((err) => {
      console.warn(`[AL Multi-Agent:${correlationId}] Failed to save trace:`, err.message);
    });

    if (controller) {
      controller.close();
    }
  } catch (error) {
    console.error('[AL Multi-Agent] Streaming error:', error);

    // Track error in tracer
    tracer.recordError(error, 'streaming_error');
    tracer.save().catch((err) => {
      console.warn(`[AL Multi-Agent:${correlationId}] Failed to save error trace:`, err.message);
    });

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
