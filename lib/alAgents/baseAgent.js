/**
 * Base Agent Class
 *
 * Provides the foundation for all specialist agents in the AL multi-agent system.
 * Each specialist agent extends this class and overrides:
 * - getSystemPrompt() - Agent-specific prompt (~600-1500 tokens vs 7000+ monolithic)
 * - getTools() - Only tools relevant to this agent's domain (2-7 tools vs 25+)
 *
 * Benefits:
 * - Focused prompts = better responses
 * - Fewer tools = less model confusion
 * - Per-agent tuning without affecting others
 * - Cost optimization via model selection per agent
 */

import { executeWithCircuitBreaker } from '@/lib/aiCircuitBreaker';
import { AL_TOOLS, calculateTokenCost, formatCentsAsDollars } from '@/lib/alConfig';
import { executeToolCall } from '@/lib/alTools';
import { getAnthropicConfig } from '@/lib/observability';

// =============================================================================
// MODEL CONFIGURATION
// =============================================================================

/**
 * Model definitions for cost/capability optimization
 * Each agent can use a different model based on query complexity
 */
export const MODELS = {
  HAIKU: 'claude-3-5-haiku-20241022', // Fast, cheap - good for simple lookups
  SONNET: 'claude-sonnet-4-20250514', // Balanced - default for most queries
  // OPUS: 'claude-3-opus-20240229',      // Most capable - reserved for complex reasoning
};

// =============================================================================
// BASE AGENT CLASS
// =============================================================================

export class BaseAgent {
  constructor(options = {}) {
    this.agentId = options.agentId || 'base';
    this.agentName = options.agentName || 'Base Agent';
    this.model = options.model || MODELS.SONNET;
    this.maxTokens = options.maxTokens || 2048;
    this.maxToolCalls = options.maxToolCalls || 5; // Safety limit, not optimization
    this.correlationId = options.correlationId || null;
    this.userId = options.userId || null;
    this.context = options.context || {};
    this.userPreferences = options.userPreferences || null;
    this.userPersonalization = options.userPersonalization || null;

    // Support for factory-created agents with systemPromptBuilder
    this._systemPromptBuilder = options.systemPromptBuilder || null;

    // Tool names this agent can use (array of tool names, or 'all' for generalist)
    this._toolNames = options.toolNames || null;
  }

  // =============================================================================
  // METHODS TO OVERRIDE IN SUBCLASSES
  // =============================================================================

  /**
   * Get the system prompt for this agent.
   * Uses the systemPromptBuilder if provided, otherwise returns default.
   * @param {Object} context - Context to pass to the builder
   * @returns {string} The system prompt
   */
  getSystemPrompt(context = {}) {
    // Use builder if provided (from factory-created agents)
    if (this._systemPromptBuilder) {
      return this._systemPromptBuilder(context);
    }

    // Default prompt for base/fallback agents
    return `You are AL (AutoRev AI) - an expert automotive AI assistant.
Answer questions about cars, modifications, and automotive topics.
Be direct, knowledgeable, and helpful.`;
  }

  /**
   * Get the tools available to this agent.
   * Override in subclasses to return only relevant tools.
   * @returns {Array} Array of tool definitions
   */
  getTools() {
    return this.getFilteredTools();
  }

  /**
   * Get the tool names this agent can use.
   * Uses the _toolNames if provided, otherwise returns all tools.
   * @returns {string[]|'all'} Array of tool names or 'all'
   */
  getToolNames() {
    if (this._toolNames) {
      return this._toolNames;
    }
    return AL_TOOLS.map((t) => t.name);
  }

  // =============================================================================
  // SHARED FUNCTIONALITY
  // =============================================================================

  /**
   * Filter AL_TOOLS to only include tools this agent should use
   * Also applies user preference filters (disabled data sources)
   * @returns {Array} Filtered tool definitions
   */
  getFilteredTools() {
    const allowedTools = this.getToolNames();

    // Start with all tools or agent-specific tools
    let tools;
    if (allowedTools === 'all') {
      tools = [...AL_TOOLS];
    } else {
      tools = AL_TOOLS.filter((tool) => allowedTools.includes(tool.name));
    }

    // Apply user preference filters (disabled data sources)
    if (this.userPreferences) {
      const disabledByPreference = new Set();

      // Map preference keys to tool names
      const preferenceToToolMap = {
        web_search_enabled: ['search_web'],
        forum_insights_enabled: ['search_community_insights'],
        youtube_reviews_enabled: ['get_expert_reviews'],
        event_search_enabled: ['search_events'],
      };

      for (const [prefKey, toolNames] of Object.entries(preferenceToToolMap)) {
        if (this.userPreferences[prefKey] === false) {
          toolNames.forEach((t) => disabledByPreference.add(t));
        }
      }

      if (disabledByPreference.size > 0) {
        tools = tools.filter((tool) => !disabledByPreference.has(tool.name));
      }
    }

    return tools;
  }

  /**
   * Build the complete system prompt with context injection
   * @param {Object} contextData - Additional context to inject
   * @returns {string} Complete system prompt
   */
  buildSystemPrompt(contextData = {}) {
    // Build context object for the prompt builder
    const builderContext = {
      currentCar: contextData.car
        ? {
            year: contextData.car.years,
            make: contextData.car.make || contextData.car.name?.split(' ')[0],
            model: contextData.car.model || contextData.car.name?.split(' ').slice(1).join(' '),
            name: contextData.car.name,
          }
        : null,
      userVehicle: contextData.userVehicle
        ? {
            year: contextData.userVehicle.year,
            make: contextData.userVehicle.make,
            model: contextData.userVehicle.model,
          }
        : null,
      // Pass all owned vehicles for garage awareness
      allOwnedVehicles: contextData.allOwnedVehicles || [],
    };

    // Get the base prompt from the builder or default
    let prompt = this.getSystemPrompt(builderContext);

    // Add dynamic context that the builder may not have included
    // Only add these if using the default prompt (builder should handle its own context)
    if (!this._systemPromptBuilder) {
      // Inject car context if available
      if (contextData.car) {
        prompt += `\n\n## Current Car Context\nThe user is viewing or asking about: **${contextData.car.name}** (${contextData.car.years})\n- ${contextData.car.hp} hp, ${contextData.car.engine}\n- ${contextData.car.drivetrain || 'N/A'} drivetrain`;
      }

      // Inject user vehicle context if available
      if (contextData.userVehicle) {
        const v = contextData.userVehicle;
        prompt += `\n\n## User's Garage Vehicle\nThe user owns: **${v.year} ${v.matched_car_name || v.make + ' ' + v.model}**`;
        if (v.mileage) prompt += `\n- Mileage: ${v.mileage.toLocaleString()} miles`;
        if (v.nickname) prompt += `\n- Nickname: "${v.nickname}"`;
      }
    }

    // ALWAYS add user's garage vehicles (even with builder)
    // This ensures AL knows ALL cars the user owns AND their build stage
    if (contextData.allOwnedVehicles?.length > 0) {
      prompt += `\n\n## User's Garage (${contextData.allOwnedVehicles.length} vehicles)`;
      prompt += `\n**If user mentions any of these cars, they OWN it - just help them.**`;
      for (const v of contextData.allOwnedVehicles) {
        const name = `${v.year} ${v.make} ${v.model}${v.trim ? ' ' + v.trim : ''}`;
        const isPrimary = v.is_primary ? ' (Primary)' : '';
        const mileage = v.mileage ? ` - ${v.mileage.toLocaleString()} mi` : '';

        // Include actual installed mods for build stage awareness
        // installed_modifications can be array of strings or array of objects
        const installedMods = v.installed_modifications || [];
        let modsInfo = '';
        if (installedMods.length > 0) {
          // Normalize mods to strings (handle both string[] and object[] formats)
          const modNames = installedMods
            .slice(0, 8)
            .map((m) => (typeof m === 'string' ? m : m?.name || m?.upgrade_key || 'mod'));
          const modList = modNames.join(', ');
          const moreCount = installedMods.length > 8 ? ` +${installedMods.length - 8} more` : '';
          modsInfo = `\n  - **Installed mods:** ${modList}${moreCount}`;
          // Add HP gain if available
          if (v.total_hp_gain) {
            modsInfo += ` (~+${v.total_hp_gain}hp)`;
          }
        } else {
          modsInfo = '\n  - **Build stage:** Stock';
        }

        prompt += `\n- **${name}**${isPrimary}${mileage}${modsInfo}`;
      }

      // Add build stage summary for parts recommendations
      const primaryVehicle =
        contextData.allOwnedVehicles.find((v) => v.is_primary) || contextData.allOwnedVehicles[0];
      if (primaryVehicle?.installed_modifications?.length > 0) {
        // Normalize mods to strings for pattern matching (handle both string[] and object[] formats)
        const mods = primaryVehicle.installed_modifications.map((m) =>
          typeof m === 'string' ? m.toLowerCase() : (m?.name || m?.upgrade_key || '').toLowerCase()
        );
        const hasTune = mods.some((m) => m.includes('tune'));
        const hasIntake = mods.some((m) => m.includes('intake'));
        const hasExhaust = mods.some((m) => m.includes('exhaust') || m.includes('header'));
        const hasFI = mods.some(
          (m) => m.includes('turbo') || m.includes('supercharger') || m.includes('boost')
        );

        let buildStage = 'Stage 1';
        if (hasFI) buildStage = 'Stage 3+ (Forced Induction)';
        else if (hasTune && (hasIntake || hasExhaust)) buildStage = 'Stage 2';
        else if (hasIntake || hasExhaust || hasTune) buildStage = 'Stage 1';

        prompt += `\n\n**Estimated Build Stage:** ${buildStage}`;
        prompt += `\n**For parts recommendations:** Prioritize parts appropriate for this build level.`;
      }
    }

    // Add user location (for event searches)
    if (contextData.userProfile?.location_city || contextData.userProfile?.location_state) {
      const location = [
        contextData.userProfile.location_city,
        contextData.userProfile.location_state,
      ]
        .filter(Boolean)
        .join(', ');
      if (location) {
        prompt += `\n\n## User Location: ${location}`;
        prompt += `\n**Use as default for event searches.**`;
      }
    }

    // Add favorites if user has no garage vehicles (shows interest)
    if (!contextData.allOwnedVehicles?.length && contextData.userFavorites?.length > 0) {
      const favNames = contextData.userFavorites
        .slice(0, 5)
        .map((f) => f.car_name || f.car_slug)
        .join(', ');
      prompt += `\n\n## User's Favorites: ${favNames}`;
      prompt += `\n(No owned vehicles - these show their interests)`;
    }

    // Inject user personalization if available (always add, not in builder)
    if (this.userPersonalization) {
      prompt += this.buildPersonalizationContext(this.userPersonalization);
    }

    return prompt;
  }

  /**
   * Build personalization context from user preferences/questionnaire
   * @param {Object} personalization - User personalization data
   * @returns {string} Personalization prompt section
   */
  buildPersonalizationContext(personalization) {
    if (!personalization) return '';

    let section = '\n\n## User Profile';

    if (personalization.responses) {
      // New questionnaire format
      const r = personalization.responses;
      if (r.driving_focus) section += `\n- Primary focus: ${r.driving_focus}`;
      if (r.mod_experience) section += `\n- Experience level: ${r.mod_experience}`;
      if (r.budget_comfort) section += `\n- Budget comfort: ${r.budget_comfort}`;
    } else {
      // Legacy format
      if (personalization.driving_focus)
        section += `\n- Primary focus: ${personalization.driving_focus}`;
      if (personalization.mod_experience)
        section += `\n- Experience level: ${personalization.mod_experience}`;
    }

    return section;
  }

  /**
   * Execute this agent to generate a response
   * @param {Object} params - Execution parameters
   * @param {string} params.message - User's message
   * @param {Array} params.conversationHistory - Previous messages
   * @param {Object} params.contextData - Additional context
   * @param {Function} params.onToolStart - Callback when tool starts
   * @param {Function} params.onToolResult - Callback when tool completes
   * @param {Function} params.onToolProgress - Callback for tool progress updates (for long-running tools like research_parts_live)
   * @param {Function} params.onText - Callback for streaming text
   * @returns {Promise<Object>} Agent response with usage stats
   */
  async execute({
    message,
    conversationHistory = [],
    contextData = {},
    attachments = [],
    onToolStart,
    onToolResult,
    onToolProgress,
    onText,
  }) {
    const startTime = Date.now();
    const usage = { inputTokens: 0, outputTokens: 0, callCount: 0 };
    const toolCallsUsed = [];
    const toolTimings = [];

    // Build system prompt with context
    const systemPrompt = this.buildSystemPrompt({ ...this.context, ...contextData });

    // Get filtered tools for this agent
    const tools = this.getFilteredTools();

    // Build messages array
    let messages = [...conversationHistory];
    const userContent = this.buildMessageContent(message, attachments);
    messages.push({ role: 'user', content: userContent });

    // Execute Claude with tool loop
    let response = null;
    let fullResponse = '';
    let iterationCount = 0;

    while (iterationCount < this.maxToolCalls) {
      iterationCount++;

      response = await this.callClaude({
        systemPrompt,
        messages,
        tools,
        maxTokens: this.maxTokens,
      });

      usage.inputTokens += response.usage?.input_tokens || 0;
      usage.outputTokens += response.usage?.output_tokens || 0;
      usage.callCount += 1;

      // Check for tool use
      const toolUseBlocks = response.content?.filter((b) => b.type === 'tool_use') || [];
      const textBlocks = response.content?.filter((b) => b.type === 'text') || [];

      // Accumulate text
      for (const block of textBlocks) {
        fullResponse += block.text;
        if (onText) onText(block.text);
      }

      // If no tool calls, we're done
      if (response.stop_reason !== 'tool_use' || toolUseBlocks.length === 0) {
        break;
      }

      // Execute tools
      const toolResults = await this.executeTools({
        toolUseBlocks,
        contextData,
        onToolStart,
        onToolResult,
        onToolProgress,
      });

      // Track tool usage
      for (const result of toolResults.results) {
        toolCallsUsed.push(result.toolName);
        toolTimings.push(result.timing);
      }

      // Continue conversation with tool results
      const assistantContent = [];
      for (const block of textBlocks) {
        assistantContent.push({ type: 'text', text: block.text });
      }
      for (const tu of toolUseBlocks) {
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
        { role: 'user', content: toolResults.claudeFormat },
      ];
    }

    const durationMs = Date.now() - startTime;
    const costCents = calculateTokenCost(usage.inputTokens, usage.outputTokens);

    // Validate response has meaningful content
    const validatedResponse = this.validateResponse(fullResponse, toolCallsUsed);

    return {
      response: validatedResponse.content,
      agentId: this.agentId,
      agentName: this.agentName,
      usage: {
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        callCount: usage.callCount,
        costCents,
        costFormatted: formatCentsAsDollars(costCents),
      },
      toolCallsUsed,
      toolTimings,
      durationMs,
      responseValidation: validatedResponse.validation,
    };
  }

  /**
   * Validate response has meaningful content, provide fallback if empty
   * @param {string} response - Raw response from agent
   * @param {Array} toolCallsUsed - Tools that were called
   * @returns {Object} { content, validation: { valid, issue, usedFallback } }
   */
  validateResponse(response, toolCallsUsed = []) {
    const validation = { valid: true, issue: null, usedFallback: false };

    // Strip internal blocks for validation (they don't count as user content)
    const strippedResponse = this.stripInternalBlocks(response);
    const trimmed = strippedResponse?.trim() || '';

    // Check for empty/minimal response
    if (!trimmed || trimmed.length < 20) {
      validation.valid = false;
      validation.issue = 'empty_or_minimal';
      validation.usedFallback = true;

      console.warn(
        `[${this.agentId}:${this.correlationId}] Empty/minimal response detected. ` +
          `Raw: ${response?.length || 0} chars, Stripped: ${trimmed.length} chars, ` +
          `Tools used: [${toolCallsUsed.join(', ')}]`
      );

      // Provide contextual fallback based on agent type
      const fallback = this.getFallbackResponse(toolCallsUsed);
      return { content: fallback, validation };
    }

    // Check if response is only internal blocks (bug scenario)
    const hasInternalBlocks =
      response?.includes('<parts_to_save>') || response?.includes('<internal_data>');
    if (hasInternalBlocks && trimmed.length < 50) {
      validation.valid = false;
      validation.issue = 'internal_blocks_only';
      validation.usedFallback = true;

      console.error(
        `[${this.agentId}:${this.correlationId}] BUG: Response contained only internal blocks. ` +
          `This indicates the agent failed to generate user-facing content.`
      );

      const fallback = this.getFallbackResponse(toolCallsUsed);
      return { content: fallback, validation };
    }

    return { content: response, validation };
  }

  /**
   * Strip internal blocks for validation purposes
   * @param {string} text - Text to clean
   * @returns {string} Text with internal blocks removed
   */
  stripInternalBlocks(text) {
    if (!text) return '';
    return text
      .replace(/<parts_to_save>[\s\S]*?<\/parts_to_save>/gi, '')
      .replace(/<parts_to_save>[\s\S]*$/gi, '')
      .replace(/<internal_data>[\s\S]*?<\/internal_data>/gi, '')
      .replace(/<internal_data>[\s\S]*$/gi, '')
      .trim();
  }

  /**
   * Get a contextual fallback response based on agent type and tools used
   * @param {Array} toolCallsUsed - Tools that were called
   * @returns {string} Fallback response
   */
  getFallbackResponse(toolCallsUsed = []) {
    // Parts research specific fallback
    if (
      this.agentId === 'parts_research' ||
      toolCallsUsed.includes('research_parts_live') ||
      toolCallsUsed.includes('search_parts')
    ) {
      return `## Parts Research

I searched for parts but couldn't find specific products matching your criteria in our database. Here's how to proceed:

**Recommended Next Steps:**
1. **Try different search terms** - Sometimes using the exact part name or part number helps
2. **Check manufacturer websites directly** - Many parts makers have fitment tools on their sites
3. **Ask with more details** - Let me know your exact year, make, model, and trim

**Popular Parts Vendors:**
- **034 Motorsport** - European performance parts
- **ECS Tuning** - Wide selection, good fitment database
- **FCP Euro** - OEM and performance parts with lifetime warranty

Would you like me to search for something more specific, or help you understand what to look for?`;
    }

    // Build planning fallback
    if (this.agentId === 'build_planning' || toolCallsUsed.includes('recommend_build')) {
      return `I'd be happy to help plan your build, but I need a bit more information. Could you tell me:

1. **What car do you have?** (Year, make, model)
2. **What are your goals?** (Daily driving, track days, show car, etc.)
3. **What mods do you already have?** (If any)

With these details, I can give you personalized recommendations for your build path.`;
    }

    // Performance data fallback
    if (
      this.agentId === 'performance_data' ||
      toolCallsUsed.includes('get_dyno_runs') ||
      toolCallsUsed.includes('calculate_mod_impact')
    ) {
      return `I couldn't find specific performance data for that combination. To help you better:

1. **Share your car details** - Year, make, model, and current mods
2. **Be specific about the mod** - What part/tune are you considering?

I can then estimate the performance gains based on similar setups.`;
    }

    // Generic fallback
    return `I apologize, but I wasn't able to generate a complete response for your question. This might be because:

- The specific information isn't in our database yet
- I need more details about your car or situation

Could you try rephrasing your question or providing more context? I'm here to help!`;
  }

  /**
   * Build message content with optional attachments
   * @param {string} text - Message text
   * @param {Array} attachments - Optional attachments
   * @returns {string|Array} Message content
   */
  buildMessageContent(text, attachments = []) {
    if (!attachments || attachments.length === 0) {
      return text;
    }

    const content = [];

    // Add image attachments
    for (const attachment of attachments) {
      if (attachment.file_type?.startsWith('image/')) {
        content.push({
          type: 'image',
          source: {
            type: 'url',
            url: attachment.public_url,
          },
        });
      }
    }

    // Add text content
    let textContent = text;
    if (content.length > 0) {
      const imageCount = content.length;
      const contextPrefix = `[User has attached ${imageCount} image${imageCount > 1 ? 's' : ''} for analysis]\n\n`;
      textContent = contextPrefix + text;
    }

    content.push({ type: 'text', text: textContent });
    return content;
  }

  /**
   * Execute tool calls with timeout protection
   * @param {Object} params - Tool execution parameters
   * @param {Array} params.toolUseBlocks - Tool use blocks from Claude
   * @param {Object} params.contextData - Context data (unused but accepted for compatibility)
   * @param {Function} params.onToolStart - Callback when a tool starts
   * @param {Function} params.onToolResult - Callback when a tool completes
   * @param {Function} params.onToolProgress - Callback for tool progress updates (for long-running tools)
   * @returns {Promise<Object>} Tool results
   */
  async executeTools({
    toolUseBlocks,
    contextData: _contextData,
    onToolStart,
    onToolResult,
    onToolProgress,
  }) {
    const results = [];
    const claudeFormat = [];

    // Per-tool timeout configuration (in milliseconds)
    // Different tools may need different timeouts based on their typical response times
    const TOOL_TIMEOUTS = {
      research_parts_live: 45000, // Web research can be slow
      search_web: 30000, // External web search
      read_url: 20000, // Fetching external URLs
      search_community_insights: 20000, // Forum search
      analyze_uploaded_content: 30000, // Image analysis
      default: 15000, // Default for most tools
    };

    for (const toolUse of toolUseBlocks) {
      const toolStartTime = Date.now();
      const timeout = TOOL_TIMEOUTS[toolUse.name] || TOOL_TIMEOUTS.default;

      if (onToolStart) {
        onToolStart({ tool: toolUse.name, id: toolUse.id });
      }

      try {
        // Execute tool with timeout protection
        // Pass onToolProgress for tools that support it (e.g., research_parts_live)
        const result = await this.executeWithTimeout(
          () =>
            executeToolCall(toolUse.name, toolUse.input, {
              correlationId: this.correlationId,
              onProgress: onToolProgress
                ? (progress) => onToolProgress({ tool: toolUse.name, id: toolUse.id, ...progress })
                : undefined,
            }),
          timeout,
          toolUse.name
        );

        const durationMs = Date.now() - toolStartTime;

        results.push({
          toolName: toolUse.name,
          success: true,
          timing: { tool: toolUse.name, durationMs, cacheHit: false },
        });

        claudeFormat.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify(result),
        });

        if (onToolResult) {
          onToolResult({
            tool: toolUse.name,
            id: toolUse.id,
            success: true,
            durationMs,
          });
        }
      } catch (err) {
        const durationMs = Date.now() - toolStartTime;
        const isTimeout = err.message?.includes('timed out');

        // Log detailed error for debugging
        console.error(
          `[${this.agentId}:${this.correlationId}] Tool ${toolUse.name} failed after ${durationMs}ms: ` +
            `${isTimeout ? 'TIMEOUT' : err.message}`
        );

        results.push({
          toolName: toolUse.name,
          success: false,
          error: err.message,
          timing: {
            tool: toolUse.name,
            durationMs,
            error: err.message,
            timedOut: isTimeout,
          },
        });

        // Provide a user-friendly error message for Claude to work with
        const errorContent = isTimeout
          ? {
              error: 'Tool timed out',
              message: `The ${toolUse.name} tool took too long to respond. Try a simpler query or different approach.`,
              timedOut: true,
            }
          : { error: 'Tool execution failed', message: err.message };

        claudeFormat.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify(errorContent),
        });

        if (onToolResult) {
          onToolResult({
            tool: toolUse.name,
            id: toolUse.id,
            success: false,
            error: err.message,
            durationMs,
            timedOut: isTimeout,
          });
        }
      }
    }

    return { results, claudeFormat };
  }

  /**
   * Execute a function with timeout protection
   * @param {Function} fn - Async function to execute
   * @param {number} timeoutMs - Timeout in milliseconds
   * @param {string} operationName - Name for logging
   * @returns {Promise<any>} Result of the function
   * @throws {Error} If timeout is exceeded
   */
  async executeWithTimeout(fn, timeoutMs, operationName) {
    return Promise.race([
      fn(),
      new Promise((_, reject) => {
        setTimeout(() => {
          console.warn(
            `[${this.agentId}:${this.correlationId}] Tool timeout: ${operationName} exceeded ${timeoutMs}ms`
          );
          reject(new Error(`Tool '${operationName}' timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  }

  /**
   * Call Claude API
   * @param {Object} params - API call parameters
   * @returns {Promise<Object>} Claude response
   */
  async callClaude({ systemPrompt, messages, tools, maxTokens }) {
    const { apiUrl, headers } = getAnthropicConfig({
      userId: this.userId,
      requestId: this.correlationId,
      properties: { agent: this.agentId },
    });

    // Use array format for system prompt with cache control
    const systemWithCache = [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' },
      },
    ];

    const result = await executeWithCircuitBreaker(
      async () => {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: this.model,
            max_tokens: maxTokens,
            system: systemWithCache,
            messages,
            tools: tools.length > 0 ? tools : undefined,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(
            `Claude API error: ${response.status} - ${error?.error?.message || 'Unknown'}`
          );
        }

        return await response.json();
      },
      { provider: 'anthropic', throwOnOpen: true }
    );

    return result.result;
  }
}

export default BaseAgent;
