/**
 * AL Request Tracing Service
 *
 * Comprehensive logging and tracing for all AL conversations.
 * Captures every aspect of a request for debugging and analysis.
 *
 * Features:
 * - Request-level tracing with correlation IDs
 * - Intent classification logging
 * - Tool execution tracking with timing
 * - Response validation logging
 * - Error categorization
 * - Performance metrics
 *
 * Usage:
 *   import { ALTracer } from '@/lib/alTracingService';
 *
 *   const tracer = new ALTracer(correlationId, { userId, conversationId });
 *   tracer.setQuery(query);
 *   tracer.setIntent(intent, confidence);
 *   tracer.trackToolCall('get_car_ai_context', { startMs, endMs, success: true });
 *   await tracer.save();
 *
 * @module lib/alTracingService
 */

import { createClient } from '@supabase/supabase-js';

// =============================================================================
// CONFIGURATION
// =============================================================================

const LOG_LEVEL = process.env.AL_LOG_LEVEL || 'info'; // debug, info, warn, error
const ENABLE_DB_TRACING = process.env.AL_ENABLE_DB_TRACING !== 'false'; // Default: true

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// =============================================================================
// SUPABASE CLIENT
// =============================================================================

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
}

// =============================================================================
// AL TRACER CLASS
// =============================================================================

/**
 * AL Request Tracer
 *
 * Collects metrics and logs throughout a request lifecycle,
 * then persists them to the database for analysis.
 */
export class ALTracer {
  constructor(correlationId, options = {}) {
    this.correlationId = correlationId;
    this.startTime = Date.now();

    // Initialize trace data
    this.trace = {
      correlation_id: correlationId,
      conversation_id: options.conversationId || null,
      message_id: options.messageId || null,
      user_id: options.userId || null,

      // Request info
      query_text: null,
      query_length: 0,
      car_context_slug: options.carSlug || null,
      car_context_name: options.carName || null,
      page_context: options.pageContext || null,
      has_attachments: false,
      attachment_count: 0,

      // Intent & routing
      intent: null,
      intent_confidence: null,
      agent_type: null,
      is_multi_agent: true,
      routing_reason: null,

      // Car extraction
      extracted_car_year: null,
      extracted_car_make: null,
      extracted_car_model: null,
      car_in_database: null,
      car_extraction_source: null,

      // Tool execution
      tools_called: [],
      tools_succeeded: [],
      tools_failed: [],
      tool_timings: {},
      total_tool_time_ms: 0,
      cache_hits: 0,

      // Response metrics
      response_length: 0,
      response_valid: true,
      validation_reason: null,
      used_fallback: false,
      fallback_reason: null,

      // Token usage
      input_tokens: 0,
      output_tokens: 0,
      cost_cents: 0,

      // Performance
      total_latency_ms: 0,
      intent_classification_ms: 0,
      agent_execution_ms: 0,
      formatter_ms: 0,

      // Error tracking
      had_error: false,
      error_type: null,
      error_message: null,
      error_stack: null,

      // Metadata
      prompt_version_id: options.promptVersionId || null,
      model_used: options.model || null,
      user_tier: options.userTier || null,
      is_internal_eval: options.isInternalEval || false,
    };

    // Event log for debugging
    this.events = [];

    this.log('debug', 'Tracer initialized');
  }

  // ===========================================================================
  // LOGGING HELPERS
  // ===========================================================================

  /**
   * Log with level and correlation ID prefix
   */
  log(level, message, data = null) {
    if (LOG_LEVELS[level] < LOG_LEVELS[LOG_LEVEL]) return;

    const prefix = `[AL:${this.correlationId}]`;
    const timestamp = new Date().toISOString();

    // Add to events log
    this.events.push({
      timestamp,
      level,
      message,
      data: data ? JSON.stringify(data).substring(0, 500) : null,
    });

    // Console output
    const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    if (data) {
      logFn(`${prefix} ${message}`, data);
    } else {
      logFn(`${prefix} ${message}`);
    }
  }

  debug(message, data = null) {
    this.log('debug', message, data);
  }

  info(message, data = null) {
    this.log('info', message, data);
  }

  warn(message, data = null) {
    this.log('warn', message, data);
  }

  error(message, data = null) {
    this.log('error', message, data);
  }

  // ===========================================================================
  // TRACE SETTERS
  // ===========================================================================

  /**
   * Set the query text
   */
  setQuery(query, attachments = []) {
    this.trace.query_text = query?.substring(0, 5000) || null;
    this.trace.query_length = query?.length || 0;
    this.trace.has_attachments = attachments.length > 0;
    this.trace.attachment_count = attachments.length;

    this.debug(
      `Query received (${this.trace.query_length} chars, ${attachments.length} attachments)`
    );
  }

  /**
   * Set intent classification result
   */
  setIntent(intent, confidence, ms = 0) {
    this.trace.intent = intent;
    this.trace.intent_confidence = confidence;
    this.trace.intent_classification_ms = ms;

    this.info(`Intent: ${intent} (${(confidence * 100).toFixed(0)}% confidence, ${ms}ms)`);
  }

  /**
   * Set the agent that handled the request
   */
  setAgent(agentType, routingReason = null) {
    this.trace.agent_type = agentType;
    this.trace.routing_reason = routingReason;

    this.info(`Agent: ${agentType}${routingReason ? ` (${routingReason})` : ''}`);
  }

  /**
   * Set car extraction results
   */
  setCarExtraction(extraction) {
    if (!extraction) return;

    this.trace.extracted_car_year = extraction.year || null;
    this.trace.extracted_car_make = extraction.make || null;
    this.trace.extracted_car_model = extraction.model || null;
    this.trace.car_in_database = extraction.inDatabase || false;
    this.trace.car_extraction_source = extraction.source || null;

    const carStr = [extraction.year, extraction.make, extraction.model].filter(Boolean).join(' ');
    this.info(`Car extracted: ${carStr || 'none'} (in DB: ${extraction.inDatabase})`);
  }

  /**
   * Set car context
   */
  setCarContext(carSlug, carName) {
    this.trace.car_context_slug = carSlug;
    this.trace.car_context_name = carName;
  }

  /**
   * Track a tool call
   */
  trackToolCall(toolName, result) {
    const { startMs, endMs, success, cacheHit, error } = result;
    const duration = endMs - startMs;

    this.trace.tools_called.push(toolName);
    this.trace.tool_timings[toolName] = {
      duration_ms: duration,
      success,
      cache_hit: cacheHit || false,
      error: error?.message || null,
    };
    this.trace.total_tool_time_ms += duration;

    if (success) {
      this.trace.tools_succeeded.push(toolName);
    } else {
      this.trace.tools_failed.push(toolName);
    }

    if (cacheHit) {
      this.trace.cache_hits++;
    }

    const status = success ? '✓' : '✗';
    const cache = cacheHit ? ' (cache)' : '';
    this.info(`Tool ${status} ${toolName}: ${duration}ms${cache}`);
  }

  /**
   * Set response metrics
   */
  setResponse(response, valid = true, reason = null) {
    this.trace.response_length = response?.length || 0;
    this.trace.response_valid = valid;
    this.trace.validation_reason = reason;

    if (!valid) {
      this.warn(`Response validation failed: ${reason}`);
    } else {
      this.debug(`Response: ${this.trace.response_length} chars`);
    }
  }

  /**
   * Mark that fallback was used
   */
  setFallbackUsed(reason) {
    this.trace.used_fallback = true;
    this.trace.fallback_reason = reason;

    this.warn(`Fallback used: ${reason}`);
  }

  /**
   * Set token usage and cost
   */
  setTokenUsage(inputTokens, outputTokens, costCents) {
    this.trace.input_tokens = inputTokens;
    this.trace.output_tokens = outputTokens;
    this.trace.cost_cents = costCents;

    this.debug(`Tokens: ${inputTokens} in / ${outputTokens} out (${costCents.toFixed(4)}¢)`);
  }

  /**
   * Set agent execution timing
   */
  setAgentTiming(ms) {
    this.trace.agent_execution_ms = ms;
  }

  /**
   * Set formatter timing
   */
  setFormatterTiming(ms) {
    this.trace.formatter_ms = ms;
  }

  /**
   * Record an error
   */
  recordError(error, type = 'unknown') {
    this.trace.had_error = true;
    this.trace.error_type = type;
    this.trace.error_message = error?.message || String(error);
    this.trace.error_stack = error?.stack?.substring(0, 2000) || null;

    this.error(`Error (${type}): ${this.trace.error_message}`);
  }

  /**
   * Set message ID after it's created
   */
  setMessageId(messageId) {
    this.trace.message_id = messageId;
  }

  /**
   * Set conversation ID
   */
  setConversationId(conversationId) {
    this.trace.conversation_id = conversationId;
  }

  // ===========================================================================
  // SAVE TO DATABASE
  // ===========================================================================

  /**
   * Finalize and save the trace to the database
   */
  async save() {
    // Calculate total latency
    this.trace.total_latency_ms = Date.now() - this.startTime;

    this.info(
      `Request complete: ${this.trace.total_latency_ms}ms total, ` +
        `${this.trace.tools_called.length} tools, ` +
        `${this.trace.input_tokens + this.trace.output_tokens} tokens`
    );

    if (!ENABLE_DB_TRACING) {
      this.debug('DB tracing disabled, skipping save');
      return { success: true, saved: false };
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      this.warn('Supabase not configured, skipping trace save');
      return { success: true, saved: false };
    }

    try {
      const { error } = await supabase.from('al_request_traces').insert(this.trace);

      if (error) {
        this.error('Failed to save trace:', error);
        return { success: false, error: error.message };
      }

      this.debug('Trace saved to database');
      return { success: true, saved: true };
    } catch (err) {
      this.error('Exception saving trace:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Get a summary of the trace for logging
   */
  getSummary() {
    return {
      correlationId: this.correlationId,
      intent: this.trace.intent,
      agent: this.trace.agent_type,
      tools: this.trace.tools_called,
      latencyMs: this.trace.total_latency_ms,
      tokens: this.trace.input_tokens + this.trace.output_tokens,
      hadError: this.trace.had_error,
      usedFallback: this.trace.used_fallback,
    };
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create a new tracer for a request
 */
export function createTracer(correlationId, options = {}) {
  return new ALTracer(correlationId, options);
}

/**
 * Get recent traces for analysis
 */
export async function getRecentTraces(options = {}) {
  const { days = 7, limit = 100, onlyErrors = false, agentType = null, intent = null } = options;

  const supabase = getSupabaseClient();
  if (!supabase) return [];

  try {
    let query = supabase
      .from('al_request_traces')
      .select('*')
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (onlyErrors) {
      query = query.eq('had_error', true);
    }
    if (agentType) {
      query = query.eq('agent_type', agentType);
    }
    if (intent) {
      query = query.eq('intent', intent);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[AL Tracing] Error fetching traces:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('[AL Tracing] Exception:', err);
    return [];
  }
}

/**
 * Get aggregate metrics for a time period
 */
export async function getTraceMetrics(days = 7) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase.rpc('get_al_trace_metrics', { p_cutoff: cutoff });

    if (error) {
      // Fallback to manual aggregation
      const { data: traces } = await supabase
        .from('al_request_traces')
        .select('intent, agent_type, had_error, used_fallback, total_latency_ms, cost_cents')
        .gte('created_at', cutoff);

      if (!traces) return null;

      return {
        total_requests: traces.length,
        errors: traces.filter((t) => t.had_error).length,
        fallbacks: traces.filter((t) => t.used_fallback).length,
        avg_latency_ms:
          traces.reduce((sum, t) => sum + (t.total_latency_ms || 0), 0) / traces.length,
        total_cost_cents: traces.reduce((sum, t) => sum + (t.cost_cents || 0), 0),
        by_intent: Object.entries(
          traces.reduce((acc, t) => {
            acc[t.intent] = (acc[t.intent] || 0) + 1;
            return acc;
          }, {})
        ).map(([intent, count]) => ({ intent, count })),
        by_agent: Object.entries(
          traces.reduce((acc, t) => {
            acc[t.agent_type] = (acc[t.agent_type] || 0) + 1;
            return acc;
          }, {})
        ).map(([agent, count]) => ({ agent, count })),
      };
    }

    return data;
  } catch (err) {
    console.error('[AL Tracing] Error getting metrics:', err);
    return null;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

const alTracingService = {
  ALTracer,
  createTracer,
  getRecentTraces,
  getTraceMetrics,
};

export default alTracingService;
