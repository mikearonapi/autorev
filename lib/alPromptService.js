/**
 * AL Prompt Versioning Service
 * 
 * Manages prompt versions for A/B testing and experimentation.
 * Prompts can be loaded from the database (al_prompt_versions table)
 * with fallback to hardcoded defaults.
 * 
 * Usage:
 *   import { getActivePromptVersion, trackPromptUsage } from '@/lib/alPromptService';
 *   
 *   const { promptVersion, versionId } = await getActivePromptVersion();
 *   // Use promptVersion.system_prompt as the base, interpolate dynamic content
 *   // Track versionId in al_usage_logs for A/B analysis
 * 
 * @module lib/alPromptService
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Lazy-initialized Supabase client
let _supabase = null;

function getSupabase() {
  if (!_supabase && supabaseUrl && supabaseKey) {
    _supabase = createClient(supabaseUrl, supabaseKey);
  }
  return _supabase;
}

// In-memory cache for prompt versions (to avoid DB calls on every request)
let promptCache = {
  activePrompt: null,
  lastFetched: 0,
};

// Cache TTL: 5 minutes (prompts don't change often)
const PROMPT_CACHE_TTL_MS = 5 * 60 * 1000;

// Default version ID when using hardcoded prompts
export const DEFAULT_PROMPT_VERSION_ID = 'v1.0-hardcoded';

/**
 * Get the active prompt version from the database.
 * Uses weighted random selection for A/B testing when multiple prompts are active.
 * 
 * @param {Object} options
 * @param {boolean} options.forceRefresh - Bypass cache and fetch from DB
 * @returns {Promise<{promptVersion: Object|null, versionId: string, fromCache: boolean}>}
 */
export async function getActivePromptVersion({ forceRefresh = false } = {}) {
  const supabase = getSupabase();
  
  // Return early if Supabase not configured
  if (!supabase) {
    return {
      promptVersion: null,
      versionId: DEFAULT_PROMPT_VERSION_ID,
      fromCache: false,
      usingDefault: true,
    };
  }

  // Check cache
  const now = Date.now();
  if (!forceRefresh && promptCache.activePrompt && (now - promptCache.lastFetched) < PROMPT_CACHE_TTL_MS) {
    return {
      promptVersion: promptCache.activePrompt,
      versionId: promptCache.activePrompt.version_id,
      fromCache: true,
      usingDefault: false,
    };
  }

  try {
    // Fetch all active prompt versions with traffic allocation
    const { data: prompts, error } = await supabase
      .from('al_prompt_versions')
      .select('*')
      .eq('is_active', true)
      .gt('traffic_percentage', 0)
      .order('traffic_percentage', { ascending: false });

    if (error) {
      console.error('[ALPromptService] Error fetching prompts:', error);
      return {
        promptVersion: null,
        versionId: DEFAULT_PROMPT_VERSION_ID,
        fromCache: false,
        usingDefault: true,
      };
    }

    if (!prompts || prompts.length === 0) {
      // No active prompts in DB, use default
      return {
        promptVersion: null,
        versionId: DEFAULT_PROMPT_VERSION_ID,
        fromCache: false,
        usingDefault: true,
      };
    }

    // If only one active prompt, use it directly
    if (prompts.length === 1) {
      promptCache.activePrompt = prompts[0];
      promptCache.lastFetched = now;
      
      return {
        promptVersion: prompts[0],
        versionId: prompts[0].version_id,
        fromCache: false,
        usingDefault: false,
      };
    }

    // Multiple active prompts - weighted random selection for A/B testing
    const selectedPrompt = selectPromptByWeight(prompts);
    
    // Cache the selected prompt (for this request's consistency)
    // Note: In a real A/B test, you might want user-sticky assignment
    promptCache.activePrompt = selectedPrompt;
    promptCache.lastFetched = now;

    return {
      promptVersion: selectedPrompt,
      versionId: selectedPrompt.version_id,
      fromCache: false,
      usingDefault: false,
    };
  } catch (err) {
    console.error('[ALPromptService] Error:', err);
    return {
      promptVersion: null,
      versionId: DEFAULT_PROMPT_VERSION_ID,
      fromCache: false,
      usingDefault: true,
    };
  }
}

/**
 * Select a prompt based on traffic percentage weights
 * 
 * @param {Array} prompts - Array of prompt versions with traffic_percentage
 * @returns {Object} Selected prompt
 */
function selectPromptByWeight(prompts) {
  const totalWeight = prompts.reduce((sum, p) => sum + (p.traffic_percentage || 0), 0);
  
  if (totalWeight === 0) {
    return prompts[0];
  }

  const random = Math.random() * totalWeight;
  let cumulative = 0;

  for (const prompt of prompts) {
    cumulative += prompt.traffic_percentage || 0;
    if (random < cumulative) {
      return prompt;
    }
  }

  return prompts[prompts.length - 1];
}

/**
 * Get a specific prompt version by ID
 * 
 * @param {string} versionId - The version_id to fetch
 * @returns {Promise<Object|null>}
 */
export async function getPromptVersion(versionId) {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('al_prompt_versions')
      .select('*')
      .eq('version_id', versionId)
      .maybeSingle();

    if (error) {
      console.error('[ALPromptService] Error fetching prompt version:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('[ALPromptService] Error:', err);
    return null;
  }
}

/**
 * Increment the conversation count for a prompt version
 * (For tracking usage statistics)
 * 
 * @param {string} versionId - The version_id to update
 * @returns {Promise<boolean>}
 */
export async function incrementPromptUsage(versionId) {
  const supabase = getSupabase();
  if (!supabase || versionId === DEFAULT_PROMPT_VERSION_ID) return false;

  try {
    const { error } = await supabase.rpc('increment_prompt_conversations', {
      p_version_id: versionId,
    });

    if (error) {
      // If RPC doesn't exist, try direct update
      await supabase
        .from('al_prompt_versions')
        .update({ 
          total_conversations: supabase.raw('total_conversations + 1'),
          updated_at: new Date().toISOString(),
        })
        .eq('version_id', versionId);
    }

    return true;
  } catch (err) {
    console.warn('[ALPromptService] Could not increment usage:', err);
    return false;
  }
}

/**
 * Create a new prompt version
 * 
 * @param {Object} promptData
 * @param {string} promptData.versionId - Unique version identifier
 * @param {string} promptData.name - Human-readable name
 * @param {string} promptData.description - Description of changes
 * @param {string} promptData.systemPrompt - The full system prompt text
 * @param {number} promptData.trafficPercentage - Initial traffic allocation (0-100)
 * @param {string} promptData.createdBy - User ID who created it
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function createPromptVersion({
  versionId,
  name,
  description,
  systemPrompt,
  trafficPercentage = 0,
  createdBy = null,
}) {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, error: 'Database not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('al_prompt_versions')
      .insert({
        version_id: versionId,
        name,
        description,
        system_prompt: systemPrompt,
        is_active: trafficPercentage > 0,
        traffic_percentage: trafficPercentage,
        created_by: createdBy,
        activated_at: trafficPercentage > 0 ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      console.error('[ALPromptService] Error creating prompt:', error);
      return { success: false, error: error.message };
    }

    // Invalidate cache
    promptCache.activePrompt = null;
    promptCache.lastFetched = 0;

    return { success: true, data };
  } catch (err) {
    console.error('[ALPromptService] Error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Update traffic allocation for a prompt version
 * 
 * @param {string} versionId - The version_id to update
 * @param {number} trafficPercentage - New traffic percentage (0-100)
 * @returns {Promise<boolean>}
 */
export async function updatePromptTraffic(versionId, trafficPercentage) {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('al_prompt_versions')
      .update({
        traffic_percentage: trafficPercentage,
        is_active: trafficPercentage > 0,
        activated_at: trafficPercentage > 0 ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('version_id', versionId);

    if (error) {
      console.error('[ALPromptService] Error updating traffic:', error);
      return false;
    }

    // Invalidate cache
    promptCache.activePrompt = null;
    promptCache.lastFetched = 0;

    return true;
  } catch (err) {
    console.error('[ALPromptService] Error:', err);
    return false;
  }
}

/**
 * Clear the prompt cache (useful for testing or manual refresh)
 */
export function clearPromptCache() {
  promptCache.activePrompt = null;
  promptCache.lastFetched = 0;
}

const alPromptService = {
  getActivePromptVersion,
  getPromptVersion,
  incrementPromptUsage,
  createPromptVersion,
  updatePromptTraffic,
  clearPromptCache,
  DEFAULT_PROMPT_VERSION_ID,
};

export default alPromptService;
