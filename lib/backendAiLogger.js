/**
 * Backend AI Usage Logger
 * 
 * Centralized logging for all backend/script AI usage that doesn't go through
 * the user-facing AL chat system. This ensures ALL Anthropic API costs are tracked.
 * 
 * Usage:
 *   import { trackBackendAiUsage, createTrackedClaudeClient } from '@/lib/backendAiLogger';
 * 
 *   // Option 1: Manual tracking after API call
 *   const response = await anthropic.messages.create({...});
 *   await trackBackendAiUsage({
 *     purpose: 'youtube_processing',
 *     scriptName: 'youtube-enrichment',
 *     inputTokens: response.usage.input_tokens,
 *     outputTokens: response.usage.output_tokens,
 *     model: 'claude-sonnet-4-20250514',
 *     entityId: videoId,
 *   });
 * 
 *   // Option 2: Use wrapped client that auto-tracks
 *   const { anthropic, trackUsage } = createTrackedClaudeClient({
 *     purpose: 'car_research',
 *     scriptName: 'ai-research-car',
 *   });
 *   const response = await anthropic.messages.create({...});
 *   await trackUsage(response, carSlug);
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_PRICING, calculateTokenCost } from './alConfig.js';

// Lazy-initialized Supabase client for server-side operations
let _supabase = null;

function getSupabase() {
  if (!_supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn('[BackendAiLogger] Supabase not configured - usage will not be tracked');
      return null;
    }
    
    _supabase = createClient(supabaseUrl, supabaseKey);
  }
  return _supabase;
}

// Valid purpose types for backend AI usage
export const AI_PURPOSES = {
  // YouTube-related
  YOUTUBE_PROCESSING: 'youtube_processing',
  YOUTUBE_ENRICHMENT: 'youtube_enrichment',
  YOUTUBE_DISCOVERY: 'youtube_discovery',
  
  // Car data
  CAR_RESEARCH: 'car_research',
  CAR_BACKFILL: 'car_backfill',
  
  // Forum/Community
  FORUM_EXTRACTION: 'forum_extraction',
  INSIGHT_EXTRACTION: 'insight_extraction',
  
  // Content generation
  CONTENT_GENERATION: 'content_generation',
  
  // Admin/Internal
  ADMIN_INSIGHTS: 'admin_insights',
  
  // User-facing (for reference)
  USER_CHAT: 'user_chat',
};

// Valid source types
export const AI_SOURCES = {
  USER_CHAT: 'user_chat',
  BACKEND_SCRIPT: 'backend_script',
  CRON_JOB: 'cron_job',
  API_ENDPOINT: 'api_endpoint',
  WEBHOOK: 'webhook',
};

/**
 * Track backend AI usage in the database
 * 
 * @param {Object} params - Usage parameters
 * @param {string} params.purpose - Purpose category (use AI_PURPOSES constants)
 * @param {string} params.scriptName - Name of the script/cron/endpoint
 * @param {number} params.inputTokens - Number of input tokens used
 * @param {number} params.outputTokens - Number of output tokens used
 * @param {string} [params.model] - Model used (defaults to current Sonnet)
 * @param {string} [params.entityId] - Related entity ID (car_slug, video_id, etc.)
 * @param {string} [params.source] - Source type (defaults to backend_script)
 * @param {Object} [params.metadata] - Additional metadata to store
 * @returns {Promise<Object>} Result with tracked cost
 */
export async function trackBackendAiUsage({
  purpose,
  scriptName,
  inputTokens,
  outputTokens,
  model = ANTHROPIC_PRICING.model,
  entityId = null,
  source = AI_SOURCES.BACKEND_SCRIPT,
  metadata = null,
}) {
  const supabase = getSupabase();
  
  // Calculate cost using same function as user tracking
  const costCents = calculateTokenCost(inputTokens, outputTokens);
  
  const logEntry = {
    user_id: null, // Backend process, not associated with a user
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cost_cents: costCents, // Backend costs are always "charged" (to us)
    estimated_cost_cents: costCents,
    model,
    purpose,
    source,
    script_name: scriptName,
    entity_id: entityId,
    tool_calls: metadata?.toolCalls || null,
    car_slug: entityId?.includes('-') ? entityId : null, // If entity looks like a slug
    query_type: scriptName,
    credits_used: Math.ceil(costCents), // Legacy field
    response_tokens: outputTokens, // Legacy field
  };
  
  // Log to console for script visibility
  console.log(`[BackendAiLogger] ${purpose}/${scriptName}: ${inputTokens} in, ${outputTokens} out = $${(costCents / 100).toFixed(4)}`);
  
  if (!supabase) {
    return {
      success: false,
      error: 'Supabase not configured',
      costCents,
      logged: false,
    };
  }
  
  try {
    const { error } = await supabase.from('al_usage_logs').insert(logEntry);
    
    if (error) {
      console.error('[BackendAiLogger] Failed to log usage:', error);
      return {
        success: false,
        error: error.message,
        costCents,
        logged: false,
      };
    }
    
    return {
      success: true,
      costCents,
      inputTokens,
      outputTokens,
      model,
      purpose,
      logged: true,
    };
  } catch (err) {
    console.error('[BackendAiLogger] Error:', err);
    return {
      success: false,
      error: err.message,
      costCents,
      logged: false,
    };
  }
}

/**
 * Create a tracked Claude client that automatically logs usage
 * 
 * @param {Object} config - Configuration for tracking
 * @param {string} config.purpose - Purpose category
 * @param {string} config.scriptName - Script name for logging
 * @param {string} [config.source] - Source type
 * @returns {Object} { anthropic, trackUsage }
 */
export function createTrackedClaudeClient({
  purpose,
  scriptName,
  source = AI_SOURCES.BACKEND_SCRIPT,
}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }
  
  const anthropic = new Anthropic({ apiKey });
  
  /**
   * Track usage after an API response
   * @param {Object} response - Anthropic API response
   * @param {string} [entityId] - Related entity ID
   * @param {Object} [extraMetadata] - Additional metadata
   */
  async function trackUsage(response, entityId = null, extraMetadata = null) {
    if (!response?.usage) {
      console.warn('[BackendAiLogger] No usage data in response');
      return { success: false, error: 'No usage data' };
    }
    
    return trackBackendAiUsage({
      purpose,
      scriptName,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      model: response.model || ANTHROPIC_PRICING.model,
      entityId,
      source,
      metadata: extraMetadata,
    });
  }
  
  return { anthropic, trackUsage };
}

/**
 * Wrapper for direct Claude API calls with automatic tracking
 * 
 * @param {Object} params - API call parameters
 * @param {Object} params.messages - Messages for Claude
 * @param {string} [params.system] - System prompt
 * @param {number} [params.max_tokens] - Max tokens (default 4096)
 * @param {string} [params.model] - Model to use
 * @param {Object} trackingConfig - Tracking configuration
 * @param {string} trackingConfig.purpose - Purpose category
 * @param {string} trackingConfig.scriptName - Script name
 * @param {string} [trackingConfig.entityId] - Entity ID
 * @returns {Promise<Object>} API response with tracking result
 */
export async function callClaudeWithTracking(
  { messages, system, max_tokens = 4096, model = ANTHROPIC_PRICING.model },
  { purpose, scriptName, entityId = null, source = AI_SOURCES.BACKEND_SCRIPT }
) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }
  
  const anthropic = new Anthropic({ apiKey });
  
  const requestBody = {
    model,
    max_tokens,
    messages,
  };
  
  if (system) {
    requestBody.system = system;
  }
  
  const response = await anthropic.messages.create(requestBody);
  
  // Track the usage
  const trackingResult = await trackBackendAiUsage({
    purpose,
    scriptName,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    model: response.model,
    entityId,
    source,
  });
  
  return {
    ...response,
    _tracking: trackingResult,
  };
}

/**
 * Get summary of backend AI costs
 * 
 * @param {Object} options - Query options
 * @param {Date} [options.startDate] - Start of period
 * @param {Date} [options.endDate] - End of period
 * @returns {Promise<Object>} Cost summary by purpose
 */
export async function getBackendAiCostSummary({ startDate, endDate } = {}) {
  const supabase = getSupabase();
  
  if (!supabase) {
    return { error: 'Supabase not configured' };
  }
  
  try {
    let query = supabase
      .from('al_usage_logs')
      .select('purpose, source, script_name, input_tokens, output_tokens, cost_cents, estimated_cost_cents, created_at')
      .is('user_id', null); // Backend usage only
    
    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Aggregate by purpose
    const byPurpose = {};
    let totalCostCents = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    
    (data || []).forEach(log => {
      const purpose = log.purpose || 'unknown';
      if (!byPurpose[purpose]) {
        byPurpose[purpose] = {
          purpose,
          callCount: 0,
          inputTokens: 0,
          outputTokens: 0,
          costCents: 0,
        };
      }
      
      const cost = parseFloat(log.estimated_cost_cents) || parseFloat(log.cost_cents) || 0;
      byPurpose[purpose].callCount++;
      byPurpose[purpose].inputTokens += log.input_tokens || 0;
      byPurpose[purpose].outputTokens += log.output_tokens || 0;
      byPurpose[purpose].costCents += cost;
      
      totalCostCents += cost;
      totalInputTokens += log.input_tokens || 0;
      totalOutputTokens += log.output_tokens || 0;
    });
    
    return {
      success: true,
      totalCostCents,
      totalCostDollars: (totalCostCents / 100).toFixed(2),
      totalInputTokens,
      totalOutputTokens,
      callCount: (data || []).length,
      byPurpose: Object.values(byPurpose).sort((a, b) => b.costCents - a.costCents),
    };
  } catch (err) {
    console.error('[BackendAiLogger] Error getting cost summary:', err);
    return { error: err.message };
  }
}

/**
 * Get combined summary of all AI costs (user + backend)
 */
export async function getTotalAiCostSummary({ startDate, endDate } = {}) {
  const supabase = getSupabase();
  
  if (!supabase) {
    return { error: 'Supabase not configured' };
  }
  
  try {
    let query = supabase
      .from('al_usage_logs')
      .select('user_id, purpose, source, input_tokens, output_tokens, cost_cents, estimated_cost_cents');
    
    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Separate user and backend costs
    const userLogs = (data || []).filter(log => log.user_id !== null);
    const backendLogs = (data || []).filter(log => log.user_id === null);
    
    const calcTotals = (logs) => {
      let costCents = 0;
      let inputTokens = 0;
      let outputTokens = 0;
      
      logs.forEach(log => {
        // Use estimated_cost_cents for accurate analytics (not cost_cents which may be 0 for unlimited users)
        costCents += parseFloat(log.estimated_cost_cents) || parseFloat(log.cost_cents) || 0;
        inputTokens += log.input_tokens || 0;
        outputTokens += log.output_tokens || 0;
      });
      
      return { costCents, inputTokens, outputTokens, callCount: logs.length };
    };
    
    const userTotals = calcTotals(userLogs);
    const backendTotals = calcTotals(backendLogs);
    const grandTotal = {
      costCents: userTotals.costCents + backendTotals.costCents,
      inputTokens: userTotals.inputTokens + backendTotals.inputTokens,
      outputTokens: userTotals.outputTokens + backendTotals.outputTokens,
      callCount: userTotals.callCount + backendTotals.callCount,
    };
    
    return {
      success: true,
      user: {
        ...userTotals,
        costDollars: (userTotals.costCents / 100).toFixed(2),
        category: 'COGS', // Cost of Goods Sold
      },
      backend: {
        ...backendTotals,
        costDollars: (backendTotals.costCents / 100).toFixed(2),
        category: 'OpEx', // Operating Expense
      },
      total: {
        ...grandTotal,
        costDollars: (grandTotal.costCents / 100).toFixed(2),
      },
    };
  } catch (err) {
    console.error('[BackendAiLogger] Error getting total cost summary:', err);
    return { error: err.message };
  }
}

const backendAiLogger = {
  trackBackendAiUsage,
  createTrackedClaudeClient,
  callClaudeWithTracking,
  getBackendAiCostSummary,
  getTotalAiCostSummary,
  AI_PURPOSES,
  AI_SOURCES,
};

export default backendAiLogger;










