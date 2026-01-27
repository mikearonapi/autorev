/**
 * AL Agent Registry
 *
 * Central registry of all specialist agents. Each agent is defined with:
 * - Unique ID for routing
 * - Tool assignments
 * - Model configuration
 * - System prompt builder
 *
 * @module lib/alAgents/index
 */

import BaseAgent, { MODELS } from './baseAgent.js';
import { buildBuildPlanningPrompt } from './prompts/buildPlanningPrompt.js';
import { buildCarDiscoveryPrompt } from './prompts/carDiscoveryPrompt.js';
import { buildCommunityEventsPrompt } from './prompts/communityEventsPrompt.js';
import { buildGeneralistPrompt } from './prompts/generalistPrompt.js';
import { buildKnowledgePrompt } from './prompts/knowledgePrompt.js';
import { buildPartsResearchPrompt } from './prompts/partsResearchPrompt.js';
import { buildPerformanceDataPrompt } from './prompts/performanceDataPrompt.js';
import { buildVisionPrompt } from './prompts/visionPrompt.js';

// =============================================================================
// AGENT DEFINITIONS
// =============================================================================

/**
 * All intent types that the orchestrator can classify
 */
export const INTENT_TYPES = {
  CAR_DISCOVERY: 'car_discovery',
  BUILD_PLANNING: 'build_planning',
  PARTS_RESEARCH: 'parts_research',
  KNOWLEDGE: 'knowledge',
  COMMUNITY_EVENTS: 'community_events',
  PERFORMANCE_DATA: 'performance_data',
  VISION: 'vision',
  GENERALIST: 'generalist',
};

/**
 * Tool assignments for each agent
 *
 * DESIGN PRINCIPLES:
 * 1. Minimum viable tools - only what the agent NEEDS for its core purpose
 * 2. No redundancy - get_user_context replaces get_user_builds + get_user_goals + get_user_vehicle_details
 * 3. Clear boundaries - each agent owns its domain, doesn't overlap
 * 4. Orchestrator routes - if a query needs a different domain, route to that agent
 */
export const AGENT_TOOLS = {
  // ============================================================================
  // CAR DISCOVERY: Research cars before buying (10 tools)
  // "What car should I buy?", "Tell me about the GT3", "Compare 911 vs Cayman"
  // ============================================================================
  [INTENT_TYPES.CAR_DISCOVERY]: [
    'search_cars', // Find cars by criteria
    'get_car_ai_context', // PRIMARY: specs, issues, reviews, pricing in one call
    'decode_vin', // Decode VIN from listings
    'compare_cars', // Side-by-side comparison
    'get_expert_reviews', // YouTube expert opinions
    'get_known_issues', // Deep dive on reliability
    'get_price_history', // Market trends, appreciation
    'get_maintenance_schedule', // Service intervals, fluid specs
    'search_community_insights', // Real owner experiences
    'search_web', // Current news, upcoming models, recent announcements
  ],

  // ============================================================================
  // BUILD PLANNING: Plan mods for YOUR specific car (8 tools)
  // "What mods for my goals?", "Review my build", "Is my car ready to mod?"
  // ============================================================================
  [INTENT_TYPES.BUILD_PLANNING]: [
    'get_user_context', // PRIMARY: gets vehicle, builds, goals, service history in ONE call
    'recommend_build', // Goal-based mod recommendations
    'calculate_mod_impact', // HP/performance estimates
    'get_car_ai_context', // Car specs for compatibility context
    'decode_vin', // Decode user's VIN for exact specs
    'analyze_vehicle_health', // Check vehicle health before modding
    'get_known_issues', // Check reliability issues before heavy modding
    'search_parts', // Find specific parts mentioned in build
    'research_parts_live', // Find where to buy parts with prices
  ],

  // ============================================================================
  // PARTS RESEARCH: Find and compare specific parts (7 tools)
  // "Best exhaust for my 981?", "Find a Cobb intake", "Where can I buy?"
  // ============================================================================
  [INTENT_TYPES.PARTS_RESEARCH]: [
    'research_parts_live', // PRIMARY: Live vendor search with prices & buy links
    'search_parts', // Internal database for verified fitment
    'find_best_parts', // Top recommendations for upgrade type
    'get_upgrade_info', // Detailed mod category info
    'search_community_insights', // What owners say about parts
    'get_car_ai_context', // Car specs for fitment
    'search_web', // Fallback for niche parts not found
  ],

  // ============================================================================
  // KNOWLEDGE: Automotive education (2 tools)
  // "How does a turbo work?", "What is bore and stroke?", "Explain coilovers"
  // ============================================================================
  [INTENT_TYPES.KNOWLEDGE]: [
    'search_encyclopedia', // PRIMARY: curated 136-topic encyclopedia
    'search_knowledge', // Broader knowledge base with citations
  ],

  // ============================================================================
  // COMMUNITY + EVENTS: Connect with community (4 tools)
  // "Track days near Austin", "What do owners say?", "Read this forum thread"
  // ============================================================================
  [INTENT_TYPES.COMMUNITY_EVENTS]: [
    'search_events', // PRIMARY: find events by location/type
    'search_community_insights', // Forum wisdom and owner experiences
    'search_web', // Current info, news, recent topics
    'read_url', // Read shared forum threads/articles
  ],

  // ============================================================================
  // PERFORMANCE DATA: Numbers, calculations, data (5 tools)
  // "How much HP will intake add?", "Show dyno data", "Compare lap times"
  // ============================================================================
  [INTENT_TYPES.PERFORMANCE_DATA]: [
    'calculate_mod_impact', // PRIMARY: HP/0-60 calculations from mods
    'get_dyno_runs', // Real dyno data with citations
    'get_track_lap_times', // Verified lap times
    'get_car_ai_context', // Baseline specs for accurate calcs
    'search_web', // Find real-world dyno results, tuner data
  ],

  // ============================================================================
  // VISION: Analyze uploaded images (5 tools)
  // "What car is this?", "What part?", "Is this damage bad?"
  // ============================================================================
  [INTENT_TYPES.VISION]: [
    'analyze_uploaded_content', // PRIMARY: image analysis
    'get_car_ai_context', // Specs after identifying a car
    'search_parts', // Help find identified parts
    'get_known_issues', // Context for identified problems
    'search_web', // Identify rare/unusual cars or parts
  ],

  // ============================================================================
  // GENERALIST: Fallback for everything else
  // Greetings, jokes, platform questions, edge cases
  // ============================================================================
  [INTENT_TYPES.GENERALIST]: 'all',
};

/**
 * Agent definitions with configurations
 */
export const AGENT_DEFINITIONS = {
  [INTENT_TYPES.CAR_DISCOVERY]: {
    id: INTENT_TYPES.CAR_DISCOVERY,
    name: 'Car Discovery',
    description: 'Expert in car information, specs, comparisons, reviews, issues, and maintenance',
    model: MODELS.SONNET,
    maxTokens: 2500,
    tools: AGENT_TOOLS[INTENT_TYPES.CAR_DISCOVERY],
    systemPromptBuilder: buildCarDiscoveryPrompt,
    triggers: [
      'what car',
      'best car',
      'recommend a car',
      'compare',
      'vs',
      'tell me about',
      'is the .* reliable',
      'known issues',
      'what oil',
      'what fluid',
      'maintenance',
      'service interval',
      'price range',
      'under \\$',
      'budget',
      'affordable',
    ],
  },

  [INTENT_TYPES.BUILD_PLANNING]: {
    id: INTENT_TYPES.BUILD_PLANNING,
    name: 'Build Planning',
    description: 'Expert in helping users plan modifications and builds for their specific cars',
    model: MODELS.SONNET,
    maxTokens: 3000,
    tools: AGENT_TOOLS[INTENT_TYPES.BUILD_PLANNING],
    systemPromptBuilder: buildBuildPlanningPrompt,
    triggers: [
      'my build',
      'review my',
      'what mods',
      'what should i',
      'mod order',
      'install order',
      'compatible',
      'compatibility',
      'next upgrade',
      'build path',
      'build plan',
      'stage',
    ],
  },

  [INTENT_TYPES.PARTS_RESEARCH]: {
    id: INTENT_TYPES.PARTS_RESEARCH,
    name: 'Parts Research',
    description: 'Expert in finding and comparing specific parts and upgrades',
    model: MODELS.SONNET, // Use Sonnet for complex comparisons, could use Haiku for simple lookups
    maxTokens: 2000,
    tools: AGENT_TOOLS[INTENT_TYPES.PARTS_RESEARCH],
    systemPromptBuilder: buildPartsResearchPrompt,
    // Dynamic model selection: Haiku for simple lookups, Sonnet for comparisons
    modelSelector: (context) => {
      const query = context.query?.toLowerCase() || '';
      if (query.includes('compare') || query.includes('vs') || query.includes('difference')) {
        return MODELS.SONNET;
      }
      return MODELS.HAIKU;
    },
    triggers: [
      'find .*part',
      'best exhaust',
      'best intake',
      'best tune',
      'search parts',
      'look up',
      'find me',
      'where to buy',
      'fitment',
      'fits my',
      'compatible with',
    ],
  },

  [INTENT_TYPES.KNOWLEDGE]: {
    id: INTENT_TYPES.KNOWLEDGE,
    name: 'Knowledge',
    description: 'Expert in automotive education and explaining concepts',
    model: MODELS.HAIKU, // Educational content doesn't need Sonnet
    maxTokens: 2000,
    tools: AGENT_TOOLS[INTENT_TYPES.KNOWLEDGE],
    systemPromptBuilder: buildKnowledgePrompt,
    triggers: [
      'explain',
      'what is',
      'how does',
      'how do',
      'difference between',
      'why is',
      'teach me',
      'encyclopedia',
      'learn about',
      'understand',
    ],
  },

  [INTENT_TYPES.COMMUNITY_EVENTS]: {
    id: INTENT_TYPES.COMMUNITY_EVENTS,
    name: 'Community + Events',
    description: 'Expert in finding events and community insights',
    model: MODELS.HAIKU, // Fast for event lookups
    maxTokens: 2000,
    tools: AGENT_TOOLS[INTENT_TYPES.COMMUNITY_EVENTS],
    systemPromptBuilder: buildCommunityEventsPrompt,
    triggers: [
      'event',
      'track day',
      'cars and coffee',
      'meet',
      'what do owners',
      'forum',
      'community',
      'real world',
      'near me',
      'in my area',
      'local',
    ],
  },

  [INTENT_TYPES.PERFORMANCE_DATA]: {
    id: INTENT_TYPES.PERFORMANCE_DATA,
    name: 'Performance / Data',
    description: 'Expert in performance calculations, dyno data, and lap times',
    model: MODELS.HAIKU, // Calculations are straightforward, Haiku handles well
    maxTokens: 2000,
    tools: AGENT_TOOLS[INTENT_TYPES.PERFORMANCE_DATA],
    systemPromptBuilder: buildPerformanceDataPrompt,
    triggers: [
      'how much hp',
      'horsepower gain',
      'power gain',
      'performance gain',
      'dyno',
      '0-60',
      'quarter mile',
      'lap time',
      'calculate',
      'estimate',
      'projected',
    ],
  },

  [INTENT_TYPES.VISION]: {
    id: INTENT_TYPES.VISION,
    name: 'Vision',
    description: 'Expert in analyzing images of cars, parts, and damage',
    model: MODELS.SONNET, // Vision requires Sonnet
    maxTokens: 2000,
    tools: AGENT_TOOLS[INTENT_TYPES.VISION],
    systemPromptBuilder: buildVisionPrompt,
    triggers: [
      // Vision is triggered by image presence, not keywords
    ],
  },

  [INTENT_TYPES.GENERALIST]: {
    id: INTENT_TYPES.GENERALIST,
    name: 'Generalist',
    description: 'Fallback agent for general conversation, jokes, and edge cases',
    model: MODELS.HAIKU, // Fast for simple questions, jokes, chitchat
    maxTokens: 1500,
    tools: AGENT_TOOLS[INTENT_TYPES.GENERALIST],
    systemPromptBuilder: buildGeneralistPrompt,
    triggers: [
      // Generalist is the default fallback
    ],
  },
};

// =============================================================================
// AGENT FACTORY
// =============================================================================

/**
 * Create an agent instance from definition
 * @param {string} intentType - The intent type to create an agent for
 * @param {Object} options - Additional options to pass to the agent
 * @returns {BaseAgent} The configured agent instance
 */
export function createAgent(intentType, options = {}) {
  const definition = AGENT_DEFINITIONS[intentType];
  if (!definition) {
    throw new Error(`Unknown agent type: ${intentType}`);
  }

  // Map definition properties to BaseAgent constructor parameters
  const agentConfig = {
    agentId: definition.id,
    agentName: definition.name,
    model: definition.model,
    maxTokens: definition.maxTokens,
    systemPromptBuilder: definition.systemPromptBuilder,
    toolNames: definition.tools,
    ...options, // Allow overrides from options
  };

  return new BaseAgent(agentConfig);
}

/**
 * Get all agent definitions
 */
export function getAllAgentDefinitions() {
  return Object.values(AGENT_DEFINITIONS);
}

/**
 * Get tools for a specific agent
 */
export function getAgentTools(intentType) {
  return AGENT_TOOLS[intentType] || [];
}

/**
 * Get the agent that should handle a specific tool call
 * Used when a tool is called to verify it's valid for the current agent
 */
export function getAgentForTool(toolName) {
  for (const [agentId, tools] of Object.entries(AGENT_TOOLS)) {
    if (tools === 'all' || tools.includes(toolName)) {
      return agentId;
    }
  }
  return null;
}

const agentRegistry = {
  INTENT_TYPES,
  AGENT_TOOLS,
  AGENT_DEFINITIONS,
  createAgent,
  getAllAgentDefinitions,
  getAgentTools,
  getAgentForTool,
};

export default agentRegistry;
