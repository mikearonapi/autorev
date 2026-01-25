/**
 * AL (AutoRev AI) API Route
 * 
 * The heart of AutoRev's AI assistant - optimized for automotive excellence.
 * 
 * Features:
 * - Claude tool use for database/knowledge access
 * - Credit-based usage tracking ("gas tank" system)
 * - Automotive domain detection and optimization
 * - Rich context from our car database
 * - Expert review integration
 * - Encyclopedia and modification knowledge
 * - STREAMING responses for better UX
 * 
 * @route POST /api/ai-mechanic
 */

import { NextResponse } from 'next/server';
import { errors } from '@/lib/apiErrors';
import { rateLimit } from '@/lib/rateLimit';
import { buildAIContext, formatContextForAI } from '@/lib/aiMechanicService';
import { executeToolCall } from '@/lib/alTools';
import { executeWithCircuitBreaker, isAnthropicHealthy, getAnthropicStats } from '@/lib/aiCircuitBreaker';
import { 
  AL_TOOLS, 
  buildALSystemPrompt,
  isToolAvailable,
  detectDomains,
  getPlan,
  formatCentsAsDollars,
  calculateTokenCost,
  selectPromptVariant,
  selectModelForQuery,
  MODEL_TIERS,
} from '@/lib/alConfig';
import { 
  getUserBalance, 
  deductUsage, 
  needsMonthlyRefill,
  processMonthlyRefill,
  estimateQueryCost,
  incrementDailyQuery,
  getDailyUsage,
} from '@/lib/alUsageService';
import {
  createConversation,
  getConversation,
  addMessage,
  formatMessagesForClaude,
} from '@/lib/alConversationService';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { notifyALConversation } from '@/lib/discord';

// =============================================================================
// USER INFO HELPER (for Discord notifications)
// =============================================================================

/**
 * Fetch user display name and email for Discord notifications
 * Non-blocking helper - failures don't affect main flow
 */
async function getUserInfoForNotification(userId) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!userId || !supabaseUrl || !supabaseServiceKey) {
    return { displayName: null, email: null };
  }
  
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Fetch display_name from user_profiles and email from auth.users in parallel
    const [profileResult, authResult] = await Promise.all([
      supabaseAdmin
        .from('user_profiles')
        .select('display_name')
        .eq('id', userId)
        .maybeSingle(),
      supabaseAdmin.auth.admin.getUserById(userId),
    ]);
    
    return {
      displayName: profileResult.data?.display_name || null,
      email: authResult.data?.user?.email || null,
    };
  } catch (err) {
    console.warn('[AL API] Failed to fetch user info for notification:', err?.message);
    return { displayName: null, email: null };
  }
}
import { logServerError } from '@/lib/serverErrorLogger';
import { getAnthropicConfig } from '@/lib/observability';
import { trackActivity } from '@/lib/dashboardScoreService';
import { awardPoints } from '@/lib/pointsService';

// Stream encoding helper
const encoder = new TextEncoder();

/**
 * Build Claude message content with text and optional image attachments
 * Uses Claude Vision API format for image analysis
 * @param {string} text - The text content
 * @param {Array} attachments - Array of attachment objects
 * @returns {Array} Content array for Claude message
 */
function buildMessageContentWithAttachments(text, attachments = []) {
  if (!attachments || attachments.length === 0) {
    return text; // Simple string for text-only messages
  }
  
  // Build content array with images first, then text
  const content = [];
  
  // Add image attachments
  for (const attachment of attachments) {
    if (attachment.file_type?.startsWith('image/')) {
      // Claude Vision format for URL-based images
      content.push({
        type: 'image',
        source: {
          type: 'url',
          url: attachment.public_url,
        },
      });
    }
  }
  
  // Add text content (with context about what to analyze if applicable)
  let textContent = text;
  if (content.length > 0) {
    // Prepend context about attached images
    const imageCount = content.length;
    const contextPrefix = `[User has attached ${imageCount} image${imageCount > 1 ? 's' : ''} for analysis]\n\n`;
    textContent = contextPrefix + text;
  }
  
  content.push({
    type: 'text',
    text: textContent,
  });
  
  return content;
}

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';
const INTERNAL_EVAL_KEY = process.env.INTERNAL_EVAL_KEY;

// Model tiering feature flag - set to true to enable dynamic model selection
// When enabled, simple queries use Haiku (cheaper), complex queries stay on Sonnet
const ENABLE_MODEL_TIERING = process.env.ENABLE_MODEL_TIERING === 'true';

/**
 * Get the appropriate model for a query based on complexity
 * @param {string} query - User's query
 * @param {string[]} domains - Detected domains
 * @returns {string} Model identifier
 */
function getModelForQuery(query, domains = []) {
  if (!ENABLE_MODEL_TIERING) {
    return ANTHROPIC_MODEL;
  }
  const tier = selectModelForQuery(query, domains);
  return tier.model;
}

// =============================================================================
// STREAMING HELPERS
// =============================================================================

/**
 * Send a Server-Sent Event to the stream
 */
function sendSSE(controller, eventType, data) {
  const event = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  controller.enqueue(encoder.encode(event));
}

// =============================================================================
// PARALLEL TOOL EXECUTION
// =============================================================================

// =============================================================================
// DOMAIN-BASED TOOL FILTERING
// =============================================================================

/**
 * Core tools that should always be available (low token cost, high utility)
 */
const CORE_TOOLS = [
  'get_car_ai_context',  // Primary tool for car questions
  'compare_cars',        // For comparisons
  'search_cars',         // For discovery
];

/**
 * Domain to tool mapping - only include relevant tools for detected domains
 * This reduces token count by not sending all 17 tools when only 5-8 are relevant
 */
const DOMAIN_TOOL_MAP = {
  comparison: ['compare_cars', 'get_car_ai_context', 'search_cars', 'get_car_details'],
  modifications: ['search_parts', 'get_upgrade_info', 'search_encyclopedia', 'recommend_build', 'search_knowledge', 'get_dyno_runs'],
  performance: ['get_car_ai_context', 'get_dyno_runs', 'get_track_lap_times', 'search_knowledge'],
  reliability: ['get_car_ai_context', 'get_known_issues', 'search_knowledge', 'search_community_insights'],
  maintenance: ['get_car_ai_context', 'get_maintenance_schedule', 'search_knowledge', 'analyze_vehicle_health'],
  buying: ['get_car_ai_context', 'search_knowledge', 'get_known_issues', 'search_community_insights', 'get_expert_reviews'],
  track: ['get_car_ai_context', 'get_track_lap_times', 'search_knowledge', 'recommend_build', 'search_events'],
  events: ['search_events'],
  education: ['search_encyclopedia', 'get_upgrade_info', 'search_knowledge'],
  // Image analysis domain - triggered when attachments are present
  image_analysis: ['analyze_uploaded_content', 'get_car_ai_context', 'search_parts', 'get_known_issues'],
};

/**
 * Map user preference toggles to tool names
 * These tools can be disabled by the user in their preferences
 */
const TOGGLEABLE_TOOLS = {
  web_search_enabled: ['search_web'],
  forum_insights_enabled: ['search_community_insights'],
  youtube_reviews_enabled: ['get_expert_reviews'],
  event_search_enabled: ['search_events'],
};

/**
 * Get a user-friendly label for a tool that's about to be called
 * Used for real-time streaming indicators
 */
function getToolStartLabel(toolName) {
  const labels = {
    get_car_ai_context: 'Loading vehicle data...',
    search_cars: 'Searching car database...',
    search_community_insights: 'Reading forum discussions...',
    get_expert_reviews: 'Finding expert YouTube reviews...',
    search_web: 'Searching the web...',
    search_encyclopedia: 'Checking encyclopedia...',
    get_known_issues: 'Looking up known issues...',
    search_parts: 'Searching parts catalog...',
    get_maintenance_schedule: 'Loading maintenance info...',
    search_events: 'Finding events...',
    compare_cars: 'Comparing vehicles...',
    get_track_lap_times: 'Loading lap times...',
    get_dyno_runs: 'Loading dyno data...',
    search_knowledge: 'Searching knowledge base...',
    get_car_details: 'Loading car specifications...',
    analyze_vehicle_health: 'Analyzing vehicle health...',
    get_upgrade_info: 'Finding upgrade information...',
    recommend_build: 'Generating build recommendations...',
    get_user_builds: 'Loading your builds...',
    get_user_goals: 'Loading your goals...',
    get_user_vehicle_details: 'Loading your vehicle details...',
    analyze_uploaded_content: 'Analyzing your image...',
  };
  return labels[toolName] || 'Researching...';
}

/**
 * Filter tools based on user preferences (toggles)
 * @param {Array} tools - Array of tool objects
 * @param {Object} userPreferences - User's AL preferences
 * @returns {Array} Filtered tools based on user preferences
 */
function filterToolsByUserPreferences(tools, userPreferences) {
  if (!userPreferences) return tools;
  
  // Build set of disabled tool names based on user preferences
  const disabledTools = new Set();
  
  for (const [prefKey, toolNames] of Object.entries(TOGGLEABLE_TOOLS)) {
    // If preference is explicitly false, disable those tools
    if (userPreferences[prefKey] === false) {
      toolNames.forEach(tool => disabledTools.add(tool));
    }
  }
  
  // Filter out disabled tools
  return tools.filter(tool => !disabledTools.has(tool.name));
}

/**
 * Filter tools based on detected query domains to reduce token count.
 * 
 * @param {Array} allTools - All available tools
 * @param {Array} domains - Detected query domains
 * @param {Object} plan - User's plan (for tool access filtering)
 * @param {Object} userPreferences - User's AL preferences (for toggles)
 * @returns {Array} Filtered tools relevant to the query
 */
function filterToolsByDomain(allTools, domains, plan, userPreferences = null) {
  // First filter by plan access
  let filteredTools = allTools.filter(tool => 
    plan.toolAccess === 'all' || plan.toolAccess.includes(tool.name)
  );
  
  // Apply user preference toggles (if user disabled web search, forums, etc.)
  if (userPreferences) {
    filteredTools = filterToolsByUserPreferences(filteredTools, userPreferences);
  }
  
  // If no domains detected or domains array is empty, return all accessible tools
  if (!domains || domains.length === 0) {
    return filteredTools;
  }
  
  // Build set of relevant tool names from detected domains
  const relevantToolNames = new Set(CORE_TOOLS);
  
  for (const domain of domains) {
    const domainTools = DOMAIN_TOOL_MAP[domain];
    if (domainTools) {
      domainTools.forEach(tool => relevantToolNames.add(tool));
    }
  }
  
  // Filter to only include relevant tools
  const domainFilteredTools = filteredTools.filter(tool => 
    relevantToolNames.has(tool.name)
  );
  
  // If filtering resulted in very few tools, include all accessible tools
  // (this handles edge cases where domain detection might miss something)
  if (domainFilteredTools.length < 4) {
    return filteredTools;
  }
  
  return domainFilteredTools;
}

// =============================================================================
// TOOL INPUT NORMALIZATION
// =============================================================================

/**
 * Normalize tool input by injecting user context where needed
 */
function normalizeToolInput(toolName, rawInput, context, userId) {
  const input = rawInput && typeof rawInput === 'object' ? { ...rawInput } : {};
  const userMatchedCarSlug = context?.userVehicle?.matched_car_slug || null;
  const userMatchedCarVariantKey = context?.userVehicle?.matched_car_variant_key || null;
  
  // Variant-accurate maintenance
  if (toolName === 'get_maintenance_schedule') {
    const hasVariantKey = Boolean(input.car_variant_key && String(input.car_variant_key).trim());
    const requestedSlug = input.car_slug ? String(input.car_slug) : null;
    const slugMatchesUser = Boolean(requestedSlug && userMatchedCarSlug && requestedSlug === userMatchedCarSlug);
    if (!hasVariantKey && slugMatchesUser && userMatchedCarVariantKey) {
      input.car_variant_key = userMatchedCarVariantKey;
      input.__injected = { ...(input.__injected || {}), car_variant_key: true };
    }
  }
  
  // Vehicle health analysis requires user context
  if (toolName === 'analyze_vehicle_health') {
    if (userId && !input.user_id) {
      input.user_id = userId;
      input.__injected = { ...(input.__injected || {}), user_id: true };
    }
  }
  
  return input;
}

/**
 * Execute multiple tools in parallel for faster response times.
 * Claude often requests multiple tools at once - running them in parallel
 * can cut response time significantly.
 */
async function executeToolsInParallel({
  toolUseBlocks,
  context,
  userId,
  userBalance,
  correlationId,
  cacheScopeKey,
  onToolResult, // callback for streaming updates
}) {
  const results = [];
  const timings = [];
  const toolCallsUsed = [];
  
  // First, filter tools by availability and prepare execution promises
  const toolPromises = toolUseBlocks.map(async (toolUse) => {
    const toolStartTime = Date.now();
    
    // Check tool availability
    if (!isToolAvailable(userBalance.plan, toolUse.name)) {
      return {
        toolUse,
        result: {
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify({ 
            error: 'This tool requires a higher subscription tier',
            upgrade_required: true,
          }),
        },
        timing: { tool: toolUse.name, durationMs: 0, cacheHit: false, unavailable: true },
        success: false,
      };
    }
    
    toolCallsUsed.push(toolUse.name);
    
    try {
      const normalizedInput = normalizeToolInput(toolUse.name, toolUse.input, context, userId);
      const meta = { cacheHit: false };
      
      const result = await executeToolCall(toolUse.name, normalizedInput, { 
        correlationId, 
        cacheScopeKey, 
        meta 
      });
      
      const durationMs = Date.now() - toolStartTime;
      
      return {
        toolUse,
        result: {
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify(result),
        },
        timing: { 
          tool: toolUse.name, 
          durationMs, 
          cacheHit: Boolean(meta.cacheHit),
          inputKeys: normalizedInput ? Object.keys(normalizedInput) : [],
        },
        success: true,
      };
    } catch (err) {
      console.error(`[AL:${correlationId}] Tool ${toolUse.name} failed:`, err);
      const durationMs = Date.now() - toolStartTime;
      
      return {
        toolUse,
        result: {
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify({ error: 'Tool execution failed', message: err.message }),
        },
        timing: { tool: toolUse.name, durationMs, cacheHit: false, error: err.message },
        success: false,
      };
    }
  });
  
  // Execute all tools in parallel
  const toolResults = await Promise.all(toolPromises);
  
  // Process results and call callbacks
  for (const { toolUse, result, timing, success } of toolResults) {
    results.push(result);
    timings.push(timing);
    
    // Callback for streaming updates
    if (onToolResult) {
      // Extract rich sources from the result content for citation display
      let sources = [];
      try {
        const parsed = typeof result.content === 'string' 
          ? JSON.parse(result.content) 
          : result.content;
        sources = parsed?.__sources || [];
      } catch (e) { /* ignore parse errors */ }
      
      onToolResult({
        tool: toolUse.name,
        id: toolUse.id,
        success,
        error: timing.error,
        cacheHit: timing.cacheHit,
        sources, // Rich source data with URLs, titles, etc.
      });
    }
    
    if (!timing.unavailable) {
      console.info(`[AL:${correlationId}] tool=${toolUse.name} ms=${timing.durationMs} cacheHit=${timing.cacheHit}`);
    }
  }
  
  return { results, timings, toolCallsUsed };
}

/**
 * Call Claude API with streaming enabled
 * Returns an async generator that yields events
 * 
 * @param {Object} params - Request parameters
 * @param {Object} [params.observability] - Observability options for Helicone tracking
 */
async function* streamClaudeResponse({ systemPrompt, messages, tools, maxTokens, observability = {} }) {
  // Get API configuration with optional Helicone observability
  const { apiUrl, headers } = getAnthropicConfig(observability);
  
  // Use array format for system prompt to enable Anthropic prompt caching
  // Cache control on system prompt can reduce costs by ~90% for repeated prompts
  const systemWithCache = [
    {
      type: 'text',
      text: systemPrompt,
      cache_control: { type: 'ephemeral' }, // Cached for 5 minutes
    },
  ];

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: maxTokens,
      system: systemWithCache,
      messages,
      tools: tools?.length > 0 ? tools : undefined,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('[AL] Claude streaming API error:', error);
    throw new Error('Failed to get AI response');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // Keep incomplete line in buffer

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          yield parsed;
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  }
}

// =============================================================================
// STREAMING RESPONSE HANDLER
// =============================================================================

async function handleStreamingResponse({
  correlationId,
  message,
  context,
  contextText,
  domains,
  plan,
  userBalance,
  isInternalEval,
  existingMessages,
  activeConversationId,
  carSlug,
  userId,
  userPreferences = null,
  userPersonalization = null,
  attachments = [],
  dailyUsage = null,
  history = [], // Client-provided history for conversation continuity
}) {
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send initial connection event with detected domains and daily usage
        sendSSE(controller, 'connected', { 
          correlationId, 
          domains,
          conversationId: activeConversationId,
          dailyUsage: dailyUsage ? {
            queriesToday: dailyUsage.queriesToday,
            isBeta: dailyUsage.isBeta,
            isUnlimited: dailyUsage.isUnlimited,
          } : null,
        });
        
        // Send initial phase: understanding the question
        sendSSE(controller, 'phase', { phase: 'understanding', label: 'Understanding your question...' });

        // Filter tools based on user's plan, detected domains, AND user preferences
        // Domain filtering reduces token count by only including relevant tools
        const availableTools = filterToolsByDomain(AL_TOOLS, domains, plan, userPreferences);

        // Get prompt version for A/B testing (uses consistent user hashing)
        const { versionId: promptVersionId, systemPrompt: customPrompt } = await selectPromptVariant(userId);
        
        // Build system prompt - use custom DB prompt if available, otherwise use default
        const systemPrompt = customPrompt || buildALSystemPrompt(plan.id || 'free', {
          currentCar: context.car,
          userVehicle: context.userVehicle,
          stats: context.stats,
          domains,
          balanceCents: userBalance.balanceCents,
          userPreferences, // Pass user's data source preferences
          userPersonalization, // Pass user's questionnaire answers for tailoring responses
          currentPage: context.currentPage,
          formattedContext: contextText,
        });

        // Format messages for Claude
        // Build user message content with attachments (for Claude Vision)
        const userMessageContent = buildMessageContentWithAttachments(message, attachments);
        
        // CRITICAL: Use existing conversation messages OR client-provided history
        // This ensures conversation continuity even for new conversations
        let messages;
        if (existingMessages.length > 0) {
          // Use stored conversation history from database
          messages = formatMessagesForClaude(existingMessages);
          messages.push({ role: 'user', content: userMessageContent });
        } else if (history && history.length > 0) {
          // Fallback to client-provided history (for new conversations or backwards compat)
          messages = formatMessagesForClaudeFromHistory(history, message, attachments);
        } else {
          // Truly new conversation with no prior context
          messages = [{ role: 'user', content: userMessageContent }];
        }

        const usageTotals = { inputTokens: 0, outputTokens: 0, callCount: 0 };
        const toolCallsUsed = [];
        const toolTimings = [];
        let fullResponse = '';
        let currentToolUse = null;
        let toolUseBuffer = [];
        let iterationCount = 0;
        const maxIterations = plan.maxToolCallsPerMessage;
        const cacheScopeKey = `${isInternalEval ? 'internal-eval' : userId}:${activeConversationId || 'no_conversation'}`;

        // Stream the initial response
        let needsToolProcessing = true;
        
        // Send thinking phase before first API call
        sendSSE(controller, 'phase', { phase: 'thinking', label: 'Analyzing your question...' });
        
        while (needsToolProcessing && iterationCount < maxIterations) {
          iterationCount++;
          fullResponse = '';
          toolUseBuffer = [];
          currentToolUse = null;
          let stopReason = null;

          // Stream Claude response
          for await (const event of streamClaudeResponse({
            systemPrompt,
            messages,
            tools: availableTools,
            maxTokens: plan.maxResponseTokens,
            observability: {
              userId: isInternalEval ? 'internal-eval' : userId,
              sessionId: activeConversationId,
              requestId: correlationId,
              promptVersion: promptVersionId,
              properties: {
                tier: plan.id || 'free',
                carSlug: carSlug || null,
                domains: domains?.join(',') || null,
                streaming: true,
                promptVersionId,
              },
            },
          })) {
            // Handle different event types
            if (event.type === 'message_start') {
              usageTotals.callCount += 1;
              if (event.message?.usage) {
                usageTotals.inputTokens += event.message.usage.input_tokens || 0;
              }
            } else if (event.type === 'content_block_start') {
              if (event.content_block?.type === 'tool_use') {
                currentToolUse = {
                  id: event.content_block.id,
                  name: event.content_block.name,
                  input: '',
                };
                // Send tool_use_start event
                sendSSE(controller, 'tool_start', { 
                  tool: event.content_block.name,
                  id: event.content_block.id,
                });
              }
            } else if (event.type === 'content_block_delta') {
              if (event.delta?.type === 'text_delta') {
                const text = event.delta.text || '';
                fullResponse += text;
                // Stream the text to client
                sendSSE(controller, 'text', { content: text });
              } else if (event.delta?.type === 'input_json_delta') {
                // Accumulate tool input JSON
                if (currentToolUse) {
                  currentToolUse.input += event.delta.partial_json || '';
                }
              }
            } else if (event.type === 'content_block_stop') {
              if (currentToolUse) {
                // Parse the accumulated JSON input
                try {
                  currentToolUse.input = JSON.parse(currentToolUse.input || '{}');
                } catch (e) {
                  currentToolUse.input = {};
                }
                toolUseBuffer.push(currentToolUse);
                currentToolUse = null;
              }
            } else if (event.type === 'message_delta') {
              if (event.usage) {
                usageTotals.outputTokens += event.usage.output_tokens || 0;
              }
              if (event.delta?.stop_reason) {
                stopReason = event.delta.stop_reason;
              }
            }
          }

          // Check if we need to process tools
          if (stopReason === 'tool_use' && toolUseBuffer.length > 0) {
            // Send researching phase and tool_start events BEFORE executing tools
            sendSSE(controller, 'phase', { phase: 'researching', label: 'Researching your question...' });
            
            // Send tool_start events for each tool we're about to call
            for (const toolUse of toolUseBuffer) {
              const toolLabel = getToolStartLabel(toolUse.name);
              sendSSE(controller, 'tool_start', { tool: toolUse.name, label: toolLabel });
            }
            
            // Execute all tools in parallel for faster response
            const { results: toolResults, timings: newTimings, toolCallsUsed: newToolCalls } = 
              await executeToolsInParallel({
                toolUseBlocks: toolUseBuffer,
                context,
                userId,
                userBalance,
                correlationId,
                cacheScopeKey,
                onToolResult: (toolResult) => {
                  sendSSE(controller, 'tool_result', toolResult);
                },
              });
            
            toolCallsUsed.push(...newToolCalls);
            toolTimings.push(...newTimings);

            // Continue conversation with tool results
            // Build assistant message with tool uses
            const assistantContent = [];
            if (fullResponse) {
              assistantContent.push({ type: 'text', text: fullResponse });
            }
            for (const tu of toolUseBuffer) {
              assistantContent.push({
                type: 'tool_use',
                id: tu.id,
                name: tu.name,
                input: tu.input,
              });
            }

            messages = [
              ...messages,
              { role: 'assistant', content: assistantContent },
              { role: 'user', content: toolResults },
            ];
            
            // Send formulating phase before next API call
            sendSSE(controller, 'phase', { phase: 'formulating', label: 'Formulating response...' });
          } else {
            // No more tools needed
            needsToolProcessing = false;
          }
        }

        // Calculate actual cost
        const actualCostCents = calculateTokenCost(usageTotals.inputTokens, usageTotals.outputTokens);

        // Deduct usage (non-blocking for streaming)
        let newBalanceCents = userBalance.balanceCents;
        if (!isInternalEval) {
          const deductResult = await deductUsage(userId, {
            inputTokens: usageTotals.inputTokens,
            outputTokens: usageTotals.outputTokens,
            toolCalls: toolCallsUsed,
            carSlug,
            promptVersionId,
          });
          newBalanceCents = deductResult.newBalanceCents ?? userBalance.balanceCents;
          
          // Track AL activity for dashboard engagement (non-blocking)
          trackActivity(userId, 'al_messages').catch(() => {});
        }

        // Store assistant response in conversation history
        if (activeConversationId && fullResponse) {
          await addMessage(activeConversationId, {
            role: 'assistant',
            content: fullResponse,
            toolCalls: toolCallsUsed,
            costCents: actualCostCents,
            inputTokens: usageTotals.inputTokens,
            outputTokens: usageTotals.outputTokens,
            carContextSlug: carSlug,
            carContextName: context.car?.name,
            dataSources: toolCallsUsed.map(tool => ({ type: 'tool', name: tool })),
          });
        }

        // Send final metadata event
        sendSSE(controller, 'done', {
          conversationId: activeConversationId,
          usage: {
            costCents: actualCostCents,
            costFormatted: formatCentsAsDollars(actualCostCents),
            remainingBalanceCents: newBalanceCents,
            remainingBalanceFormatted: formatCentsAsDollars(newBalanceCents),
            inputTokens: usageTotals.inputTokens,
            outputTokens: usageTotals.outputTokens,
            toolCalls: toolCallsUsed.length,
          },
          toolsUsed: toolCallsUsed,
          dailyUsage: dailyUsage ? {
            queriesToday: dailyUsage.queriesToday,
            isBeta: dailyUsage.isBeta,
            isUnlimited: dailyUsage.isUnlimited,
          } : null,
        });

        controller.close();
      } catch (error) {
        console.error('[AL] Streaming error:', error);
        sendSSE(controller, 'error', { 
          message: error.message || 'Streaming failed',
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Correlation-Id': correlationId,
    },
  });
}

// =============================================================================
// MAIN API HANDLER
// =============================================================================

export async function POST(request) {
  // Check if Anthropic is configured
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({
      response: getDemoResponse(),
      isDemo: true,
    });
  }

  // Rate limit: 10 requests per minute (AI is expensive)
  const rateLimited = rateLimit(request, 'ai');
  if (rateLimited) return rateLimited;

  try {
    const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
    const internalEvalHeader = request.headers.get('x-internal-eval-key');
    
    // SECURITY: Internal eval requires a valid, sufficiently long key
    // The key must be at least 32 characters and match exactly
    const isInternalEval = Boolean(
      INTERNAL_EVAL_KEY && 
      INTERNAL_EVAL_KEY.length >= 32 &&
      internalEvalHeader && 
      internalEvalHeader === INTERNAL_EVAL_KEY
    );
    
    // Log internal eval usage for audit trail (without exposing the key)
    if (isInternalEval) {
      console.info(`[AL:${correlationId}] Internal eval request authorized`);
    }
    
    // Check if streaming is requested
    const url = new URL(request.url);
    const streamRequested = url.searchParams.get('stream') === 'true' || 
                           request.headers.get('accept')?.includes('text/event-stream');

    const body = await request.json();
    const {
      message,
      carSlug,
      userId,
      vehicleId,
      currentPage,
      conversationId,
      history = [],
      planId: requestedPlanId,
      userVehicleOverride,
      stream: bodyStream,
      attachments = [], // Array of { public_url, file_type, file_name, analysis_context }
    } = body;
    
    // Allow streaming to be requested via body as well
    const useStreaming = streamRequested || bodyStream === true;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // REQUIRE AUTHENTICATION - AL is only for members (unless internal eval)
    if (!isInternalEval && !userId) {
      return NextResponse.json({
        response: getAuthRequiredResponse(),
        requiresAuth: true,
        error: 'Authentication required to use AL',
      }, { status: 401 });
    }

    // Billing + balance (skipped for internal eval)
    let userBalance = null;
    let plan = null;
    let costEstimate = null;
    let userPreferences = null;
    let userPersonalization = null;
    let dailyUsage = null;

    if (!isInternalEval) {
      // Increment daily query counter (tracks "X queries today")
      dailyUsage = await incrementDailyQuery(userId);
      console.info(`[AL:${correlationId}] Daily usage: ${dailyUsage.queriesToday} queries today (beta=${dailyUsage.isBeta})`);

      // Check and potentially refill user's balance
      if (await needsMonthlyRefill(userId)) {
        await processMonthlyRefill(userId);
      }

      // Get user's current balance and plan
      userBalance = await getUserBalance(userId);
      plan = getPlan(userBalance.plan);

      // Fetch user's AL preferences (for tool toggles) and personalization preferences (for tailoring responses)
      try {
        const supabaseServiceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (supabaseServiceUrl && supabaseServiceKey) {
          const supabaseAdmin = createClient(supabaseServiceUrl, supabaseServiceKey);
          // Fetch AL preferences, legacy user_preferences, and new questionnaire data in parallel
          const [alPrefsResult, legacyPrefsResult, questionnaireResult] = await Promise.all([
            supabaseAdmin
              .from('al_user_preferences')
              .select('*')
              .eq('user_id', userId)
              .single(),
            // Legacy user_preferences table (for backwards compatibility)
            supabaseAdmin
              .from('user_preferences')
              .select('driving_focus, work_preference, budget_comfort, mod_experience, primary_goals, track_frequency, detail_level')
              .eq('user_id', userId)
              .single(),
            // New questionnaire system - optimized RPC for AL context
            supabaseAdmin.rpc('get_questionnaire_for_al', { p_user_id: userId }),
          ]);
          
          userPreferences = alPrefsResult.data || null;
          
          // Use new questionnaire data if available, fallback to legacy
          const questionnaireData = questionnaireResult.data;
          if (questionnaireData && questionnaireData.answered_count > 0) {
            // New format with rich questionnaire responses
            userPersonalization = {
              responses: questionnaireData.responses || {},
              summary: {
                answered_count: questionnaireData.answered_count,
                profile_completeness_pct: questionnaireData.profile_completeness_pct,
                driving_persona: questionnaireData.driving_persona,
                knowledge_level: questionnaireData.knowledge_level,
                interests: questionnaireData.interests,
              },
            };
          } else if (legacyPrefsResult.data) {
            // Fallback to legacy user_preferences
            userPersonalization = legacyPrefsResult.data;
          }
        }
      } catch (prefsError) {
        // Non-fatal - continue with default preferences (all enabled)
        console.warn('[AL] Failed to fetch user preferences:', prefsError?.message);
      }

      // Estimate cost and check if user has enough balance
      costEstimate = estimateQueryCost(message, !!carSlug);

      // Check if user has enough balance (need at least ~1 cent for a minimal query)
      if (userBalance.balanceCents < 1) {
        return NextResponse.json({
          response: getInsufficientBalanceResponse(userBalance),
          insufficientBalance: true,
          currentBalanceCents: userBalance.balanceCents,
          estimatedCostCents: costEstimate.estimatedCostCentsMax,
        });
      }
    } else {
      // Internal eval defaults to a permissive plan to allow full tool coverage.
      const evalPlanId = requestedPlanId || 'tuner';
      plan = getPlan(evalPlanId);
      userBalance = {
        plan: evalPlanId,
        planName: plan.name,
        balanceCents: 999999,
        lastRefillDate: null,
      };
      costEstimate = { estimatedCostCentsMax: 0 };
    }

    // PARALLEL EXECUTION START
    // 1. Detect domains (sync, fast)
    const domains = detectDomains(message);
    
    // Add image_analysis domain if attachments are present
    if (attachments && attachments.length > 0) {
      const hasImages = attachments.some(a => a.file_type?.startsWith('image/'));
      if (hasImages && !domains.includes('image_analysis')) {
        domains.push('image_analysis');
      }
    }

    // 2. Start building context (async, heavy) - we'll await this later
    const contextPromise = buildAIContext({
      carSlug,
      userId: isInternalEval ? null : userId,
      vehicleId,
      currentPage,
      userMessage: message,
    });

    // 3. Handle conversation setup (async)
    let activeConversationId = conversationId;
    let existingMessages = [];
    let createdNewConversation = false;

    // Create/Fetch conversation logic
    const conversationPromise = (async () => {
      if (isInternalEval) {
        return { id: null, messages: [] };
      }
      if (conversationId) {
        const convResult = await getConversation(conversationId);
        if (convResult.success && convResult.messages) {
          return { id: conversationId, messages: convResult.messages };
        }
      } else {
        const convResult = await createConversation(userId, {
          carSlug,
          page: currentPage,
          firstMessage: message, // Auto-generate title from first message
        });
        if (convResult.success) {
          return { id: convResult.conversation.id, messages: [] };
        }
      }
      return { id: null, messages: [] };
    })();

    // Await conversation setup first as we need ID for message storage
    const convData = await conversationPromise;
    activeConversationId = convData.id;
    existingMessages = convData.messages;
    if (!conversationId && convData.id) {
      createdNewConversation = true;
    }

    // 4. Store user message (async) - can run in parallel with context completion
    const messageStoragePromise = activeConversationId ? addMessage(activeConversationId, {
      role: 'user',
      content: message,
      carContextSlug: carSlug,
    }) : Promise.resolve();

    // 5. Await context building
    const context = await contextPromise;

    // Internal eval can inject a synthetic userVehicle to exercise tool logic (no DB dependency).
    if (isInternalEval && userVehicleOverride && typeof userVehicleOverride === 'object') {
      context.userVehicle = userVehicleOverride;
    }

    // Wait for message storage to complete (ensure it's saved before we might error out later)
    await messageStoragePromise;
    // PARALLEL EXECUTION END

    // Track new conversation for dashboard engagement and send Discord notification
    if (createdNewConversation && body.message) {
      // Track al_conversations for dashboard weekly engagement (non-blocking)
      if (!isInternalEval) {
        trackActivity(userId, 'al_conversations').catch(() => {});
        // Award points for asking AL a question (non-blocking)
        awardPoints(userId, 'al_ask_question', { conversationId }).catch(() => {});
      }
      
      const carContext = body.carContext?.name || body.carContext?.slug;
      // Fetch user info and send Discord notification (non-blocking)
      (async () => {
        const userInfo = await getUserInfoForNotification(userId);
        await notifyALConversation({
          id: activeConversationId,
          firstMessage: body.message,
          carContext,
          userTier: userBalance?.plan,
          username: userInfo.displayName,
          userEmail: userInfo.email,
        });
      })().catch(err => console.error('[AL API] Discord notification failed:', err));
    }

    // =============================================================================
    // STREAMING MODE
    // =============================================================================
    if (useStreaming) {
      return handleStreamingResponse({
        correlationId,
        message,
        context,
        contextText: formatContextForAI(context),
        domains,
        plan,
        userBalance,
        isInternalEval,
        existingMessages,
        activeConversationId,
        carSlug,
        userId,
        userPreferences,
        userPersonalization,
        attachments,
        dailyUsage,
        history, // Pass client-provided history for conversation continuity
      });
    }

    // Variant-aware maintenance: keep handy for tool input normalization.
    const userMatchedCarSlug = context?.userVehicle?.matched_car_slug || null;
    const userMatchedCarVariantKey = context?.userVehicle?.matched_car_variant_key || null;

    // Format context for the system prompt
    const contextText = formatContextForAI(context);

    // Filter tools based on user's plan, detected domains, AND user preferences
    // Domain filtering reduces token count by only including relevant tools
    const availableTools = filterToolsByDomain(AL_TOOLS, domains, plan, userPreferences);

    // Get prompt version for A/B testing (uses consistent user hashing)
    const { versionId: promptVersionId, systemPrompt: customPrompt } = await selectPromptVariant(userId);
    
    // Build system prompt - use custom DB prompt if available, otherwise use default
    const systemPrompt = customPrompt || buildALSystemPrompt(plan.id || 'free', {
      currentCar: context.car,
      userVehicle: context.userVehicle,
      stats: context.stats,
      domains,
      balanceCents: userBalance.balanceCents,
      currentPage,
      formattedContext: contextText,
      userPreferences, // Pass user's data source preferences
      userPersonalization, // Pass user's questionnaire answers for tailoring responses
    });

    // Format messages for Claude - use existing conversation history if available
    // Build user message content with attachments (for Claude Vision)
    const userMessageContent = buildMessageContentWithAttachments(message, attachments);
    
    let messages;
    if (existingMessages.length > 0) {
      // Use stored conversation history
      messages = formatMessagesForClaude(existingMessages);
      messages.push({ role: 'user', content: userMessageContent });
    } else {
      // Use provided history (for backwards compatibility) with attachments
      messages = formatMessagesForClaudeFromHistory(history, message, attachments);
    }

    // Initial Claude API call with tools
    const usageTotals = { inputTokens: 0, outputTokens: 0, callCount: 0 };
    const toolTimings = [];

    const trackUsage = (resp) => {
      usageTotals.callCount += 1;
      usageTotals.inputTokens += resp?.usage?.input_tokens || 0;
      usageTotals.outputTokens += resp?.usage?.output_tokens || 0;
    };

    const cacheScopeKey = `${(isInternalEval ? 'internal-eval' : userId)}:${activeConversationId || 'no_conversation'}`;

    // Build observability context for Helicone tracking
    const observabilityContext = {
      userId: isInternalEval ? 'internal-eval' : userId,
      sessionId: activeConversationId,
      requestId: correlationId,
      promptVersion: promptVersionId,
      properties: {
        tier: plan.id || 'free',
        carSlug: carSlug || null,
        domains: domains?.join(',') || null,
        streaming: false,
        promptVersionId,
      },
    };

    let response = await callClaudeWithTools({
      systemPrompt,
      messages,
      tools: availableTools,
      maxTokens: plan.maxResponseTokens,
      observability: observabilityContext,
    });
    trackUsage(response);

    // Process tool calls iteratively
    const toolCallsUsed = [];
    let iterationCount = 0;
    const maxIterations = plan.maxToolCallsPerMessage;

    while (response.stop_reason === 'tool_use' && iterationCount < maxIterations) {
      iterationCount++;
      
      // Extract tool use blocks
      const toolUseBlocks = response.content.filter(block => block.type === 'tool_use');
      
      // Execute all tools in parallel for faster response
      const { results: toolResults, timings: newTimings, toolCallsUsed: newToolCalls } = 
        await executeToolsInParallel({
          toolUseBlocks,
          context,
          userId,
          userBalance,
          correlationId,
          cacheScopeKey,
        });
      
      toolCallsUsed.push(...newToolCalls);
      toolTimings.push(...newTimings);

      // Continue conversation with tool results
      const newMessages = [
        ...messages,
        { role: 'assistant', content: response.content },
        { role: 'user', content: toolResults },
      ];

      response = await callClaudeWithTools({
        systemPrompt,
        messages: newMessages,
        tools: availableTools,
        maxTokens: plan.maxResponseTokens,
        observability: observabilityContext,
      });
      trackUsage(response);
    }

    // Extract final text response
    const textBlocks = response.content.filter(block => block.type === 'text');
    let aiResponse = textBlocks.map(block => block.text).join('\n');

    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    // -----------------------------------------------------------------------------
    // STRICT CITATION POLICY ENFORCEMENT (best-effort)
    // If query requires evidence-backed claims, ensure search_knowledge was used.
    // -----------------------------------------------------------------------------
    const evidenceNeed = (() => {
      const q = String(message || '').toLowerCase();
      const hasRel = /\b(reliab|reliability|common issues|known issues|problem|failure|recall|tsb)\b/.test(q);
      const hasGains = /\b(hp gain|horsepower gain|torque gain|tq gain|dyno|whp|wtq|stage\s*[12]|boost|tune gains)\b/.test(q);
      const hasCompliance = /\b(carb|emissions|smog|street legal|legal in california|epa|catless)\b/.test(q);
      const hasLapTimes = /\b(lap time|laptime|lap record|nurburg|nurburgring|ring time)\b/.test(q);
      return {
        requires: hasRel || hasGains || hasCompliance || hasLapTimes,
        hasRel,
        hasGains,
        hasCompliance,
        hasLapTimes,
      };
    })();

    if (evidenceNeed.requires) {
      try {
        let evidenceText = '';

        // Prefer domain-specific evidence sources when available.
        if (evidenceNeed.hasLapTimes && carSlug && isToolAvailable(userBalance.plan, 'get_track_lap_times')) {
          const startedAt = Date.now();
          const meta = { cacheHit: false };
          const laps = await executeToolCall('get_track_lap_times', { car_slug: carSlug, limit: 8 }, { correlationId, cacheScopeKey, meta });
          const durationMs = Date.now() - startedAt;
          toolCallsUsed.push('get_track_lap_times');
          toolTimings.push({ tool: 'get_track_lap_times', durationMs, cacheHit: Boolean(meta.cacheHit), inputKeys: ['car_slug', 'limit'] });
          console.info(`[AL:${correlationId}] citation_enforcement get_track_lap_times ms=${durationMs} cacheHit=${Boolean(meta.cacheHit)}`);

          evidenceText = Array.isArray(laps?.laps)
            ? laps.laps
                .filter(r => r?.source_url)
                .slice(0, 8)
                .map((r, idx) => `- [${idx + 1}] ${r.source_url}\n  ${r.track?.name || 'Track'}${r.track?.layout_key ? ` (${r.track.layout_key})` : ''}: ${r.lap_time_text || r.lap_time_ms} | tires: ${r.tires || 'unknown'} | stock: ${String(Boolean(r.is_stock))}`)
                .join('\n')
            : '';
        }

        if (!evidenceText && evidenceNeed.hasGains && carSlug && isToolAvailable(userBalance.plan, 'get_dyno_runs')) {
          const startedAt = Date.now();
          const meta = { cacheHit: false };
          const dyno = await executeToolCall('get_dyno_runs', { car_slug: carSlug, limit: 8, include_curve: false }, { correlationId, cacheScopeKey, meta });
          const durationMs = Date.now() - startedAt;
          toolCallsUsed.push('get_dyno_runs');
          toolTimings.push({ tool: 'get_dyno_runs', durationMs, cacheHit: Boolean(meta.cacheHit), inputKeys: ['car_slug', 'limit', 'include_curve'] });
          console.info(`[AL:${correlationId}] citation_enforcement get_dyno_runs ms=${durationMs} cacheHit=${Boolean(meta.cacheHit)}`);

          evidenceText = Array.isArray(dyno?.runs)
            ? dyno.runs
                .filter(r => r?.source_url)
                .slice(0, 8)
                .map((r, idx) => `- [${idx + 1}] ${r.source_url}\n  ${r.run_kind || 'run'} | ${r.dyno_type || 'dyno'} ${r.correction ? `(${r.correction})` : ''} | fuel: ${r.fuel || 'unknown'} | peaks: whp=${r.peaks?.peak_whp ?? '—'} wtq=${r.peaks?.peak_wtq ?? '—'} boost=${r.peaks?.boost_psi_max ?? '—'}`)
                .join('\n')
            : '';
        }

        if (!evidenceText && isToolAvailable(userBalance.plan, 'search_knowledge')) {
          const startedAt = Date.now();
          const meta = { cacheHit: false };
          const knowledge = await executeToolCall('search_knowledge', {
            query: message,
            car_slug: carSlug || null,
            limit: 6,
          }, { correlationId, cacheScopeKey, meta });
          const durationMs = Date.now() - startedAt;
          toolCallsUsed.push('search_knowledge');
          toolTimings.push({ tool: 'search_knowledge', durationMs, cacheHit: Boolean(meta.cacheHit), inputKeys: ['query', 'car_slug', 'limit'] });
          console.info(`[AL:${correlationId}] citation_enforcement search_knowledge ms=${durationMs} cacheHit=${Boolean(meta.cacheHit)}`);

          evidenceText = Array.isArray(knowledge?.results)
            ? knowledge.results
                .filter(r => r?.source?.url && r?.excerpt)
                .slice(0, 6)
                .map((r, idx) => `- [${idx + 1}] (${r.source.type || 'source'}) ${r.source.url}\n  ${String(r.excerpt).slice(0, 600)}`)
                .join('\n')
            : '';
        }

        const enforcementSystem = systemPrompt + `

## STRICT CITATION POLICY (ENFORCED)
- If the user asks about reliability patterns, exact gains, emissions legality, or other compliance/safety claims, you MUST base claims on the Evidence Excerpts below and cite URLs.
- If evidence is insufficient, say so clearly and avoid making the claim.
- Citations must be inline as (Source: <url>) near the sentence that relies on it.`;

        const enforcementMessages = [
          ...messages,
          { role: 'assistant', content: aiResponse },
          {
            role: 'user',
            content: `Revise your previous answer to comply with the STRICT CITATION POLICY.\n\nEvidence Excerpts:\n${evidenceText || '(No excerpts found; be conservative and state limitations.)'}\n`,
          },
        ];

        const revised = await callClaudeWithTools({
          systemPrompt: enforcementSystem,
          messages: enforcementMessages,
          tools: undefined,
          maxTokens: plan.maxResponseTokens,
          observability: {
            ...observabilityContext,
            properties: {
              ...observabilityContext.properties,
              citationEnforcement: true,
            },
          },
        });
        trackUsage(revised);

        const revisedTextBlocks = (revised.content || []).filter(block => block.type === 'text');
        const revisedText = revisedTextBlocks.map(block => block.text).join('\n').trim();
        if (revisedText) aiResponse = revisedText;
      } catch (err) {
        console.warn(`[AL:${correlationId}] citation_enforcement_failed:`, err);
        // Keep original aiResponse; don't hard-fail the user.
      }
    }

    // Get actual token usage across ALL Claude calls
    const inputTokens = usageTotals.inputTokens;
    const outputTokens = usageTotals.outputTokens;
    const actualCostCents = calculateTokenCost(inputTokens, outputTokens);
    
    // Deduct from user's balance based on actual token usage
    let deductResult = { success: true, newBalanceCents: userBalance.balanceCents };
    if (!isInternalEval) {
      deductResult = await deductUsage(userId, {
        inputTokens,
        outputTokens,
        toolCalls: toolCallsUsed,
        carSlug,
        promptVersionId,
      });

      if (!deductResult.success && deductResult.error === 'insufficient_balance') {
        console.warn('[AL] Balance check passed but deduction failed');
      }
      
      // Track AL activity for dashboard engagement (non-blocking)
      trackActivity(userId, 'al_messages').catch(() => {});
    }

    // Store assistant response in conversation history
    if (activeConversationId) {
      await addMessage(activeConversationId, {
        role: 'assistant',
        content: aiResponse,
        toolCalls: toolCallsUsed,
        costCents: actualCostCents,
        inputTokens,
        outputTokens,
        carContextSlug: carSlug,
        carContextName: context.car?.name,
        dataSources: toolCallsUsed.map(tool => ({ type: 'tool', name: tool })),
      });
    }

    const res = NextResponse.json({
      response: aiResponse,
      conversationId: activeConversationId,
      context: {
        carName: context.car?.name,
        domains,
        toolsUsed: toolCallsUsed,
        correlationId,
        toolTimings,
        internalEval: isInternalEval,
      },
      usage: {
        costCents: actualCostCents,
        costFormatted: formatCentsAsDollars(actualCostCents),
        remainingBalanceCents: deductResult.newBalanceCents ?? userBalance.balanceCents,
        remainingBalanceFormatted: formatCentsAsDollars(deductResult.newBalanceCents ?? userBalance.balanceCents),
        inputTokens,
        outputTokens,
        toolCalls: toolCallsUsed.length,
        claudeCalls: usageTotals.callCount,
      },
      dailyUsage: dailyUsage ? {
        queriesToday: dailyUsage.queriesToday,
        isBeta: dailyUsage.isBeta,
        isUnlimited: dailyUsage.isUnlimited,
      } : null,
    });
    res.headers.set('x-correlation-id', correlationId);
    return res;

  } catch (err) {
    console.error('[AL] Error:', err);
    
    // Log server-side error with full stack trace
    await logServerError(err, request, {
      apiRoute: '/api/ai-mechanic',
      featureContext: 'al-chat',
      severity: 'major',
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        fallbackResponse: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
      },
      { status: 500 }
    );
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Call Claude API with tool use
 * 
 * @param {Object} params - Request parameters
 * @param {Object} [params.observability] - Observability options for Helicone tracking
 */
async function callClaudeWithTools({ systemPrompt, messages, tools, maxTokens, observability = {} }) {
  // Get API configuration with optional Helicone observability
  const { apiUrl, headers } = getAnthropicConfig(observability);
  
  // Wrap the API call with circuit breaker for resilience
  const result = await executeWithCircuitBreaker(
    async () => {
      // Use array format for system prompt to enable Anthropic prompt caching
      const systemWithCache = [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ];

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: ANTHROPIC_MODEL,
          max_tokens: maxTokens,
          system: systemWithCache,
          messages,
          tools: tools.length > 0 ? tools : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[AL] Claude API error:', error);
        throw new Error(`Claude API error: ${response.status} - ${error?.error?.message || 'Unknown error'}`);
      }

      return await response.json();
    },
    {
      provider: 'anthropic',
      throwOnOpen: true,
    }
  );

  return result.result;
}

/**
 * Format chat history for Claude (from client-provided history)
 */
function formatMessagesForClaudeFromHistory(history, currentMessage, attachments = []) {
  const messages = [];
  
  // Add recent history
  (history || []).slice(-10).forEach(msg => {
    messages.push({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    });
  });
  
  // Add current message with attachments (for Claude Vision)
  const currentContent = buildMessageContentWithAttachments(currentMessage, attachments);
  messages.push({
    role: 'user',
    content: currentContent,
  });
  
  return messages;
}

/**
 * Demo response when API not configured
 */
function getDemoResponse() {
  return `Hey! I'm **AL** - your AutoRev AI assistant. I'm currently in demo mode, but here's what I can help you with when fully activated:

🚗 **Find Your Perfect Car**
Tell me your budget, preferences, and how you'll use it - I'll search our database of 150+ sports cars.

🔧 **Modification Guidance**  
Get specific recommendations for your goals, whether it's daily driving fun or track domination.

📊 **Expert Insights**
I can pull summaries from top automotive YouTubers and show you what experts really think.

⚠️ **Known Issues**
Before you buy, I'll tell you exactly what to watch for and common problems to check.

🏁 **Track Prep**
From brake pads to cooling upgrades, I'll help you prepare for your first HPDE.

Feel free to explore the site, and come back when I'm fully activated!`;
}

/**
 * Response when user is not authenticated
 */
function getAuthRequiredResponse() {
  return `Hey there! I'm **AL** - AutoRev's expert automotive AI assistant. 

To use my full capabilities, you'll need to **join AutoRev** first. It's free to get started!

**What you get with a free account:**
- 25 credits/month to chat with me
- Access to our car database
- Basic recommendations and search

**With Tuner ($9.99/mo) and up:**
- More monthly credits
- Expert YouTube review summaries
- Deep reliability analysis
- Forum search integration
- And much more!

👉 **[Join Now](/join)** to start chatting with me and find your perfect sports car!`;
}

/**
 * Response when user has insufficient balance
 */
function getInsufficientBalanceResponse(userBalance) {
  const nextRefillDate = userBalance.lastRefillDate 
    ? new Date(new Date(userBalance.lastRefillDate).getTime() + 30*24*60*60*1000).toLocaleDateString() 
    : 'next month';
  
  return `Hey! I'd love to help, but you're running low on balance. 

**Current Balance**: ${formatCentsAsDollars(userBalance.balanceCents)}
**Your Plan**: ${userBalance.planName || 'Free'}

You can:
- **Top up your balance** from your profile page
- **Upgrade your plan** for more monthly allocation
- **Wait for your monthly refill** on ${nextRefillDate}

Even without balance, feel free to browse our car profiles, use the Performance HUB, and explore the site!`;
}

// =============================================================================
// SUGGESTIONS ENDPOINT
// =============================================================================

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const carSlug = searchParams.get('carSlug');
  const context = searchParams.get('context');

  const suggestions = generateContextualSuggestions(carSlug, context);

  return NextResponse.json({ suggestions });
}

/**
 * Generate smart suggestions based on context
 */
function generateContextualSuggestions(carSlug, pageContext) {
  const baseSuggestions = [
    "What's the best sports car under $50k?",
    "What are the most reliable sports cars?",
    "What mods give the best bang for buck?",
  ];

  if (!carSlug) {
    return baseSuggestions;
  }

  // Car-specific suggestions
  const carSuggestions = [
    `What are the common issues with this car?`,
    `What do expert reviewers say about it?`,
    `What's the best first mod for this car?`,
    `How does this compare to similar cars?`,
    `Is this a good daily driver or weekend car?`,
    `What should I look for when buying one?`,
  ];

  if (pageContext === 'garage') {
    return [
      `When is my next service due?`,
      `What maintenance should I plan this year?`,
      `Are there any recalls I should know about?`,
      ...carSuggestions.slice(0, 2),
    ];
  }

  if (pageContext === 'build' || pageContext === 'performance') {
    return [
      `What order should I install these mods?`,
      `Do I need supporting mods for this?`,
      `Is this build reliable for daily driving?`,
      `What's the total cost for this build?`,
    ];
  }

  if (pageContext === 'compare') {
    return [
      `Which one is more reliable long-term?`,
      `Which is better for track days?`,
      `Which one holds value better?`,
      `Which has better aftermarket support?`,
    ];
  }

  return carSuggestions;
}
