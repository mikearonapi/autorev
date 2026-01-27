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

import { executeToolCall } from '@/lib/alTools';
import { AL_TOOLS, calculateTokenCost, formatCentsAsDollars } from '@/lib/alConfig';
import { getAnthropicConfig } from '@/lib/observability';
import { executeWithCircuitBreaker } from '@/lib/aiCircuitBreaker';

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
    // This ensures AL knows ALL cars the user owns
    if (contextData.allOwnedVehicles?.length > 0) {
      prompt += `\n\n## User's Garage (${contextData.allOwnedVehicles.length} vehicles)`;
      prompt += `\n**IMPORTANT: If user mentions any of these cars, they OWN it. Don't question ownership.**`;
      for (const v of contextData.allOwnedVehicles) {
        const name = `${v.year} ${v.make} ${v.model}${v.trim ? ' ' + v.trim : ''}`;
        const isPrimary = v.is_primary ? ' (Primary)' : '';
        const mileage = v.mileage ? ` - ${v.mileage.toLocaleString()} mi` : '';
        const mods = v.installed_modifications?.length
          ? ` - ${v.installed_modifications.length} mods installed`
          : '';
        prompt += `\n- **${name}**${isPrimary}${mileage}${mods}`;
      }
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

    return {
      response: fullResponse,
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
    };
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
   * Execute tool calls
   * @param {Object} params - Tool execution parameters
   * @returns {Promise<Object>} Tool results
   */
  async executeTools({ toolUseBlocks, contextData: _contextData, onToolStart, onToolResult }) {
    const results = [];
    const claudeFormat = [];

    for (const toolUse of toolUseBlocks) {
      const toolStartTime = Date.now();

      if (onToolStart) {
        onToolStart({ tool: toolUse.name, id: toolUse.id });
      }

      try {
        const result = await executeToolCall(toolUse.name, toolUse.input, {
          correlationId: this.correlationId,
        });

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

        results.push({
          toolName: toolUse.name,
          success: false,
          error: err.message,
          timing: { tool: toolUse.name, durationMs, error: err.message },
        });

        claudeFormat.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify({ error: 'Tool execution failed', message: err.message }),
        });

        if (onToolResult) {
          onToolResult({
            tool: toolUse.name,
            id: toolUse.id,
            success: false,
            error: err.message,
            durationMs,
          });
        }
      }
    }

    return { results, claudeFormat };
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
