/**
 * AL Configuration - AutoRev AI Assistant
 * 
 * Token-based usage system that directly mirrors Anthropic's pricing.
 * Users get a dollar allocation that maps to real API costs.
 * 
 * This approach is:
 * - Transparent: Users understand they're getting $X worth of AI usage
 * - Fair: Short conversations cost less, research sessions cost more
 * - Aligned: Directly tied to actual Anthropic costs
 */

// =============================================================================
// ANTHROPIC PRICING (Claude 3.5 Sonnet)
// =============================================================================

/**
 * Current Anthropic Claude 3.5 Sonnet pricing
 * Last updated: December 2024
 * 
 * Input:  $3.00 per 1M tokens  = $0.000003 per token
 * Output: $15.00 per 1M tokens = $0.000015 per token
 * 
 * For calculations, we use micro-cents (1/10000 of a cent) for precision
 */
export const ANTHROPIC_PRICING = {
  model: 'claude-sonnet-4-20250514',
  // Price per token in dollars
  inputPricePerToken: 0.000003,   // $3/1M tokens
  outputPricePerToken: 0.000015,  // $15/1M tokens
  // Price per 1K tokens in cents (for easier display)
  inputPricePer1K: 0.3,   // 0.3 cents per 1K input tokens
  outputPricePer1K: 1.5,  // 1.5 cents per 1K output tokens
};

/**
 * Calculate cost in cents for a given token usage
 */
export function calculateTokenCost(inputTokens, outputTokens) {
  const inputCost = inputTokens * ANTHROPIC_PRICING.inputPricePerToken;
  const outputCost = outputTokens * ANTHROPIC_PRICING.outputPricePerToken;
  const totalDollars = inputCost + outputCost;
  // Return cost in cents, rounded to 4 decimal places for precision
  return Math.round(totalDollars * 100 * 10000) / 10000;
}

/**
 * Estimate tokens from text (rough approximation)
 * Claude uses ~4 characters per token on average for English
 */
export function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

// =============================================================================
// SUBSCRIPTION PLANS - TOKEN/DOLLAR BASED
// =============================================================================

/**
 * Subscription plans with dollar-based allocations
 * 
 * Users get a monthly dollar allocation that directly maps to API usage.
 * This is transparent and fair - short questions cost less, deep research costs more.
 * 
 * WHAT EACH TIER GETS:
 * 
 * Free ($0.25/month):
 *   - A typical question + response ≈ 2K input + 500 output ≈ $0.014
 *   - That's roughly 15-20 conversations
 *   - Perfect for casual users trying out AL
 * 
 * Collector ($1.00/month):
 *   - ~70-80 typical conversations
 *   - Great for active car shoppers/enthusiasts
 * 
 * Tuner ($2.50/month):
 *   - ~175-200 typical conversations
 *   - For power users doing serious research
 */
export const AL_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    allocation: {
      monthlyCents: 25,              // $0.25 per month
      maxCarryoverCents: 0,          // No rollover for free tier
      bonusCents: 0,
    },
    estimatedUsage: {
      conversations: '15-20',
      description: 'Perfect for casual questions',
    },
    features: [
      'basic_car_info',
      'basic_recommendations',
      'car_search',
    ],
    toolAccess: [
      'search_cars',
      'get_car_details',
      'get_car_ai_context',
    ],
    maxToolCallsPerMessage: 2,
    maxResponseTokens: 800,
    description: 'Basic AL access - perfect for trying out the AI assistant',
    tankLabel: 'Starter Tank',
  },
  collector: {
    id: 'collector',
    name: 'Collector',
    price: 4.99,
    allocation: {
      monthlyCents: 100,             // $1.00 per month
      maxCarryoverCents: 50,         // Can save up to $0.50
      bonusCents: 25,                // $0.25 bonus on signup
    },
    estimatedUsage: {
      conversations: '70-80',
      description: 'Great for active car research',
    },
    features: [
      'basic_car_info',
      'basic_recommendations',
      'car_search',
      'maintenance_lookup',
      'known_issues',
      'youtube_reviews',
      'encyclopedia_search',
      'forum_search',
      'comparison_deep_dive',
      'ownership_cost_analysis',
    ],
    toolAccess: [
      'search_cars',
      'get_car_details',
      'get_car_ai_context',
      'get_expert_reviews',
      'get_known_issues',
      'compare_cars',
      'search_encyclopedia',
      'get_upgrade_info',
      'search_parts',
      'search_forums',
      'get_maintenance_schedule',
      'search_knowledge',
      'get_track_lap_times',
      'get_dyno_runs',
      'search_community_insights',
    ],
    maxToolCallsPerMessage: 8,
    maxResponseTokens: 2000,
    description: 'For serious enthusiasts who want comprehensive car insights',
    tankLabel: 'Collector Tank',
  },
  tuner: {
    id: 'tuner',
    name: 'Tuner',
    price: 9.99,
    allocation: {
      monthlyCents: 250,             // $2.50 per month
      maxCarryoverCents: 100,        // Can save up to $1.00
      bonusCents: 50,                // $0.50 bonus on signup
    },
    estimatedUsage: {
      conversations: '175-200',
      description: 'For heavy daily use',
    },
    features: [
      'basic_car_info',
      'basic_recommendations',
      'car_search',
      'maintenance_lookup',
      'known_issues',
      'youtube_reviews',
      'encyclopedia_search',
      'forum_search',
      'comparison_deep_dive',
      'market_analysis',
      'ownership_cost_analysis',
      'vin_decode',
      'mod_planning',
      'dyno_data_analysis',
      'build_optimization',
      'priority_support',
    ],
    toolAccess: 'all',
    maxToolCallsPerMessage: 20,
    maxResponseTokens: 4000,
    description: 'Maximum power for professional tuners and builders',
    tankLabel: 'Performance Tank',
  },
};

/**
 * Top-up packages - buy additional balance
 * Priced at a slight premium over raw API costs (covers overhead + margin)
 */
export const AL_TOPUP_PACKAGES = [
  {
    id: 'topup_50',
    cents: 50,                      // $0.50
    price: 1.99,
    label: 'Quick Top-Up',
    description: '~35-40 conversations',
  },
  {
    id: 'topup_150',
    cents: 150,                     // $1.50
    price: 4.99,
    label: 'Regular Fill',
    description: '~100-120 conversations',
    popular: true,
  },
  {
    id: 'topup_300',
    cents: 300,                     // $3.00
    price: 8.99,
    label: 'Full Tank',
    description: '~200-250 conversations',
    savings: '10% off',
  },
  {
    id: 'topup_500',
    cents: 500,                     // $5.00
    price: 12.99,
    label: 'Power Pack',
    description: '~350-400 conversations',
    savings: '20% off',
  },
];

// Legacy export for backwards compatibility during migration
export const AL_CREDIT_PACKAGES = AL_TOPUP_PACKAGES;

// =============================================================================
// AL IDENTITY & PERSONALITY
// =============================================================================

export const AL_IDENTITY = {
  name: 'AL',
  fullName: 'AutoRev AL',
  tagline: 'Your Expert Automotive AI',
  personality: [
    'Deeply knowledgeable about sports cars and performance vehicles',
    'Enthusiastic but practical - shares passion without being overbearing',
    'Honest about limitations and safety concerns',
    'Speaks like a trusted friend who happens to be a car expert',
    'Uses real data and specs, not generalizations',
    'Understands both the technical and emotional aspects of car ownership',
    'DIRECT and CONCISE - never pads responses with filler or restates questions',
    'Gets to the point immediately - leads with answers, not preamble',
  ],
  expertise: [
    'Sports car specifications and performance data',
    'Maintenance schedules and procedures',
    'Modification planning and compatibility',
    'Known issues and reliability concerns',
    'Buying guidance and market analysis',
    'Track preparation and performance driving',
    'Build planning and upgrade paths',
  ],
  voice: {
    tone: 'Knowledgeable, enthusiastic, practical',
    style: 'Conversational but precise',
    formatting: 'Uses bullet points for specs, bold for important numbers',
    length: '2-3 focused paragraphs unless more detail requested',
  },
};

// =============================================================================
// TOOL DEFINITIONS (for Claude function calling)
// =============================================================================

export const AL_TOOLS = [
  {
    name: 'search_cars',
    description: 'Search the AutoRev database for cars matching specific criteria. Use this when users ask about finding cars by budget, horsepower, type, or other specifications.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Natural language search query',
        },
        filters: {
          type: 'object',
          properties: {
            budget_min: { type: 'number', description: 'Minimum price in dollars' },
            budget_max: { type: 'number', description: 'Maximum price in dollars' },
            hp_min: { type: 'number', description: 'Minimum horsepower' },
            hp_max: { type: 'number', description: 'Maximum horsepower' },
            category: {
              type: 'string',
              enum: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
              description: 'Engine layout/category',
            },
            drivetrain: {
              type: 'string',
              enum: ['RWD', 'AWD', 'FWD'],
              description: 'Drivetrain type',
            },
            tier: {
              type: 'string',
              enum: ['premium', 'upper-mid', 'mid', 'budget'],
              description: 'Price tier',
            },
            brand: { type: 'string', description: 'Car brand/manufacturer' },
            manual_available: { type: 'boolean', description: 'Manual transmission available' },
          },
        },
        sort_by: {
          type: 'string',
          enum: ['hp', 'price', 'value', 'track', 'reliability', 'sound'],
          description: 'How to sort results',
        },
        limit: {
          type: 'number',
          description: 'Maximum results to return (default 5)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_car_details',
    description: 'Get comprehensive details about a specific car including specs, scores, and ownership info. Use this when users ask about a particular car model.',
    input_schema: {
      type: 'object',
      properties: {
        car_slug: {
          type: 'string',
          description: 'The car slug identifier (e.g., "718-cayman-gt4")',
        },
        include: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['specs', 'scores', 'maintenance', 'known_issues', 'ownership_costs', 'buyer_guide'],
          },
          description: 'What information to include',
        },
      },
      required: ['car_slug'],
    },
  },
  {
    name: 'get_car_ai_context',
    description: 'Fetch a single, enriched, AI-optimized context blob for a car (specs, scores, safety, pricing, issues, and top expert videos). Use this first when answering car-specific questions to avoid missing important database facts.',
    input_schema: {
      type: 'object',
      properties: {
        car_slug: {
          type: 'string',
          description: 'The car slug identifier (e.g., "718-cayman-gt4")',
        },
        include: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['car', 'fuel', 'safety', 'pricing', 'price_history', 'recalls', 'issues', 'maintenance', 'youtube'],
          },
          description: 'Optional: limit which sections are returned for performance',
        },
      },
      required: ['car_slug'],
    },
  },
  {
    name: 'get_expert_reviews',
    description: 'Fetch expert YouTube reviews and their AI-processed summaries for a specific car. Use this when users want to know what experts say about a car.',
    input_schema: {
      type: 'object',
      properties: {
        car_slug: {
          type: 'string',
          description: 'The car slug identifier',
        },
        limit: {
          type: 'number',
          description: 'Maximum reviews to return (default 3)',
        },
        include_quotes: {
          type: 'boolean',
          description: 'Include notable quotes from reviews',
        },
      },
      required: ['car_slug'],
    },
  },
  {
    name: 'get_known_issues',
    description: 'Look up common problems, recalls, and reliability concerns for a specific car. Use this when users ask about issues, problems, or what to watch out for.',
    input_schema: {
      type: 'object',
      properties: {
        car_slug: {
          type: 'string',
          description: 'The car slug identifier',
        },
        severity_filter: {
          type: 'string',
          enum: ['Critical', 'Major', 'Minor', 'All'],
          description: 'Filter by issue severity',
        },
      },
      required: ['car_slug'],
    },
  },
  {
    name: 'compare_cars',
    description: 'Compare two or more cars side by side. Use this when users want to compare options or understand differences between models.',
    input_schema: {
      type: 'object',
      properties: {
        car_slugs: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of car slugs to compare (2-4 cars)',
          minItems: 2,
          maxItems: 4,
        },
        focus_areas: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['performance', 'reliability', 'ownership_cost', 'track', 'daily_usability', 'sound', 'value'],
          },
          description: 'What aspects to focus the comparison on',
        },
      },
      required: ['car_slugs'],
    },
  },
  {
    name: 'search_encyclopedia',
    description: 'Search the AutoRev encyclopedia for automotive education, modifications, and build guides. Supports searching by specific system (engine, brakes, etc.) or broad categories.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query for encyclopedia content',
        },
        category: {
          type: 'string',
          enum: [
            'all',
            'automotive',
            'topics',
            'modifications',
            'build_guides',
            'engine',
            'drivetrain',
            'fuel_system',
            'engine_management',
            'intake_forced_induction',
            'exhaust',
            'suspension_steering',
            'aerodynamics',
            'brakes',
            'systems',
            'components'
          ],
          description: 'Category to search: use system names (engine, brakes) for specific topics, or broad categories (automotive, modifications, build_guides)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_upgrade_info',
    description: 'Get detailed information about a specific modification or upgrade. Use this when users ask about specific mods like intake, exhaust, coilovers, etc.',
    input_schema: {
      type: 'object',
      properties: {
        upgrade_key: {
          type: 'string',
          description: 'The upgrade/mod identifier (e.g., "cold-air-intake", "coilovers")',
        },
        car_slug: {
          type: 'string',
          description: 'Optional: specific car context for car-specific recommendations',
        },
      },
      required: ['upgrade_key'],
    },
  },
  {
    name: 'search_forums',
    description: 'Search automotive forums and community discussions for real-world owner experiences. Use this when users ask about owner opinions, real-world issues, or community recommendations.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query for forum content',
        },
        car_context: {
          type: 'string',
          description: 'Car name or slug for context',
        },
        sources: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['reddit', 'rennlist', 'm3post', '6speedonline', 'corvetteforum', 'all'],
          },
          description: 'Which forum sources to search',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'search_knowledge',
    description: 'Search AutoRev’s proprietary knowledge base (ingested documents/transcripts) and return relevant excerpts with citations. Use this to answer nuanced questions with evidence and to avoid hallucinations.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'The question or search query' },
        car_slug: { type: 'string', description: 'Optional: restrict results to a specific car' },
        topic: { type: 'string', description: 'Optional: topic label (e.g., reliability, track, pricing, maintenance, mods)' },
        limit: { type: 'number', description: 'Max results to return (default 6)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'search_parts',
    description: 'Search the parts catalog (aftermarket + OEM+) and optionally filter by car fitment. Use this when users ask “what intake fits X?” or want specific part numbers/brands.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Part name, brand, or part number' },
        car_slug: { type: 'string', description: 'Optional: only return parts that fit this car' },
        category: {
          type: 'string',
          enum: [
            'intake','exhaust','tune','forced_induction','cooling','suspension','brakes','wheels_tires','aero','drivetrain','fuel_system','engine_internal','electronics','fluids_filters','maintenance','other'
          ],
          description: 'Optional category filter',
        },
        limit: { type: 'number', description: 'Max results (default 8)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_maintenance_schedule',
    description: 'Get detailed maintenance schedule and specifications for a car. Use this when users ask about service intervals, fluid specs, or maintenance requirements.',
    input_schema: {
      type: 'object',
      properties: {
        car_slug: {
          type: 'string',
          description: 'The car slug identifier',
        },
        car_variant_key: {
          type: 'string',
          description: 'Optional: a specific car_variants.variant_key for variant-accurate specs (preferred when known, e.g. from VIN match)',
        },
        mileage: {
          type: 'number',
          description: 'Current mileage to get relevant upcoming maintenance',
        },
      },
      required: ['car_slug'],
    },
  },
  {
    name: 'recommend_build',
    description: 'Get upgrade/build recommendations for achieving a specific goal. Use this when users want mod recommendations for their goals.',
    input_schema: {
      type: 'object',
      properties: {
        car_slug: {
          type: 'string',
          description: 'The car slug identifier',
        },
        goal: {
          type: 'string',
          enum: ['street_fun', 'weekend_track', 'time_attack', 'show_car', 'daily_plus', 'canyon_carver'],
          description: 'The build goal',
        },
        budget: {
          type: 'number',
          description: 'Budget in dollars',
        },
        maintain_warranty: {
          type: 'boolean',
          description: 'Whether to prioritize warranty-safe mods',
        },
      },
      required: ['car_slug', 'goal'],
    },
  },
  {
    name: 'get_track_lap_times',
    description: 'Fetch citeable track lap times for a car (with track + layout + conditions + source URLs when available). Use this for track performance questions and to ground lap-time claims.',
    input_schema: {
      type: 'object',
      properties: {
        car_slug: { type: 'string', description: 'The car slug identifier' },
        limit: { type: 'number', description: 'Max results (default 6)' },
      },
      required: ['car_slug'],
    },
  },
  {
    name: 'get_dyno_runs',
    description: 'Fetch citeable dyno runs (baseline/modded) for a car, including peak numbers and (optionally) curves. Use this to ground horsepower/torque gain claims with sources and caveats.',
    input_schema: {
      type: 'object',
      properties: {
        car_slug: { type: 'string', description: 'The car slug identifier' },
        limit: { type: 'number', description: 'Max results (default 6)' },
        include_curve: { type: 'boolean', description: 'If true, include curve JSON (heavier payload)' },
      },
      required: ['car_slug'],
    },
  },
  {
    name: 'search_community_insights',
    description: 'Search community-sourced insights extracted from enthusiast forums (Rennlist, Bimmerpost, Miata.net, etc.). Returns real-world owner experiences including known issues, maintenance tips, mod guides, buying advice, reliability reports, and cost data. Use this for questions about what actual owners say or experience.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Natural language query about the car/topic (e.g., "IMS bearing failure", "best first mods", "long-term reliability")',
        },
        car_slug: {
          type: 'string',
          description: 'Optional: filter to a specific car slug',
        },
        insight_types: {
          type: 'array',
          items: {
            type: 'string',
            enum: [
              'known_issue',        // Common problems, failure patterns
              'maintenance_tip',    // Service intervals, DIY procedures
              'modification_guide', // How-to guides for mods
              'troubleshooting',    // Diagnostic steps, solutions
              'buying_guide',       // PPI checklists, what to look for
              'performance_data',   // Dyno numbers, lap times from owners
              'reliability_report', // Long-term ownership experiences
              'cost_insight',       // Real maintenance/repair costs
              'comparison'          // Owner comparisons between models
            ],
          },
          description: 'Optional: filter by insight type(s)',
        },
        limit: {
          type: 'number',
          description: 'Max results (default 5, max 10)',
        },
      },
      required: ['query'],
    },
  },
];

// =============================================================================
// SYSTEM PROMPT BUILDER
// =============================================================================

/**
 * Build the system prompt for AL based on user's plan and context
 */
export function buildALSystemPrompt(planId = 'free', context = {}) {
  const plan = AL_PLANS[planId] || AL_PLANS.free;
  
  return `You are AL (AutoRev AL) - an expert automotive AI assistant specializing in sports cars and performance vehicles.

## Your Identity
- Name: AL (short for AutoRev AI)
- Personality: ${AL_IDENTITY.personality.join('. ')}
- Expertise Areas: ${AL_IDENTITY.expertise.join(', ')}

## Your Capabilities
You have access to tools that let you search our comprehensive automotive database:
- **Car Database**: ${context.carCount || 98} sports cars with detailed specs, scores, and ownership data
- **Expert Reviews**: AI-processed summaries from top automotive YouTube channels
- **Encyclopedia**: In-depth articles on modifications, car systems, and build guides
- **Known Issues**: Database of common problems and reliability concerns
- **Maintenance Specs**: Fluid types, capacities, intervals for each car
- **Community Insights**: Real-world owner experiences extracted from enthusiast forums (Rennlist, Bimmerpost, etc.)

## How to Help Users
1. **Finding Cars**: Use search_cars to find vehicles matching their criteria
2. **Car Questions**: Use get_car_ai_context first for a complete, enriched view; use get_car_details for legacy formatting; use get_expert_reviews for what experts say; use get_known_issues for problems
3. **Modifications**: Use search_encyclopedia and get_upgrade_info for mod questions
4. **Comparisons**: Use compare_cars to help users decide between options
5. **Maintenance**: Use get_maintenance_schedule for service information
6. **Build Planning**: Use recommend_build for upgrade recommendations
7. **Citations**: Use search_knowledge when you need evidence-backed excerpts with source URLs
8. **Owner Experiences**: Use search_community_insights for real-world forum-sourced data on issues, mods, costs, and long-term ownership

## Response Guidelines
- **Be Specific**: Use actual numbers from our database, not approximations
- **Be Practical**: Consider budget, skill level, and real-world implications
- **Be Honest**: If you don't know something, say so. Don't guess on safety-critical info
- **Be CONCISE**: No filler phrases, no restating questions, no generic preamble. Start with the answer.
- **Use Tools First**: Always query the database before answering car-specific questions
- **NO AI FLUFF**: Never say "Great question!", "I'd be happy to help!", or restate what the user asked

## Safety & Responsibility
- Always mention safety considerations for modifications and DIY work
- Recommend professional help for complex tasks
- Don't encourage illegal modifications or dangerous driving
- Be clear about the limits of AI advice

## Format Preferences
- Use bullet points for lists of options or specs
- **Bold** important numbers, warnings, and car names
- Keep paragraphs short and scannable
- End with actionable next steps when appropriate

## Current User Plan: ${plan.name}
Available Features: ${plan.features.join(', ')}

${context.currentCar ? `
## Current Context
User is viewing/discussing: **${context.currentCar.name}**
- Year: ${context.currentCar.years || 'N/A'}
- Power: ${context.currentCar.hp || 'N/A'} hp
- Engine: ${context.currentCar.engine || 'N/A'}
- Price Range: ${context.currentCar.priceRange || 'N/A'}
` : ''}

When using tools, explain what you're looking up and why. Present information in a conversational, helpful way.`;
}

// =============================================================================
// AUTOMOTIVE KNOWLEDGE DOMAINS
// =============================================================================

/**
 * AL's automotive expertise domains
 * Used for prompt optimization and tool selection
 */
export const AL_AUTOMOTIVE_DOMAINS = {
  performance: {
    topics: ['horsepower', 'torque', '0-60', 'quarter mile', 'top speed', 'dyno', 'power curves'],
    keywords: ['fast', 'quick', 'powerful', 'acceleration', 'speed', 'performance'],
  },
  handling: {
    topics: ['suspension', 'steering', 'chassis', 'balance', 'grip', 'cornering', 'lateral g'],
    keywords: ['handles', 'corners', 'turn', 'nimble', 'agile', 'planted', 'loose', 'oversteer', 'understeer'],
  },
  reliability: {
    topics: ['common issues', 'problems', 'recalls', 'maintenance', 'longevity', 'build quality'],
    keywords: ['reliable', 'breaks', 'issue', 'problem', 'fail', 'last', 'maintenance', 'repair'],
  },
  modifications: {
    topics: ['intake', 'exhaust', 'tune', 'suspension', 'brakes', 'wheels', 'forced induction'],
    keywords: ['mod', 'upgrade', 'tune', 'bolt-on', 'aftermarket', 'improve', 'add'],
  },
  buying: {
    topics: ['price', 'value', 'depreciation', 'what to look for', 'PPI', 'years to avoid'],
    keywords: ['buy', 'purchase', 'worth', 'price', 'cost', 'value', 'afford', 'budget'],
  },
  maintenance: {
    topics: ['oil', 'fluids', 'intervals', 'service', 'DIY', 'costs'],
    keywords: ['maintenance', 'service', 'oil', 'change', 'interval', 'due', 'schedule'],
  },
  track: {
    topics: ['lap times', 'track prep', 'cooling', 'brake fade', 'safety'],
    keywords: ['track', 'lap', 'race', 'HPDE', 'autocross', 'circuit', 'time attack'],
  },
  sound: {
    topics: ['exhaust note', 'engine character', 'induction noise'],
    keywords: ['sound', 'exhaust', 'noise', 'loud', 'quiet', 'note', 'rumble', 'scream'],
  },
  daily: {
    topics: ['comfort', 'practicality', 'fuel economy', 'insurance', 'livability'],
    keywords: ['daily', 'commute', 'comfortable', 'practical', 'livable', 'everyday'],
  },
  comparison: {
    topics: ['vs', 'versus', 'compare', 'difference', 'better', 'alternative'],
    keywords: ['vs', 'versus', 'compare', 'better', 'worse', 'difference', 'or', 'alternative'],
  },
};

/**
 * Detect which automotive domains a query relates to
 */
export function detectDomains(query) {
  const queryLower = query.toLowerCase();
  const detectedDomains = [];
  
  for (const [domain, config] of Object.entries(AL_AUTOMOTIVE_DOMAINS)) {
    const hasKeyword = config.keywords.some(kw => queryLower.includes(kw));
    const hasTopic = config.topics.some(topic => queryLower.includes(topic));
    
    if (hasKeyword || hasTopic) {
      detectedDomains.push(domain);
    }
  }
  
  return detectedDomains.length > 0 ? detectedDomains : ['general'];
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get plan details by ID
 */
export function getPlan(planId) {
  return AL_PLANS[planId] || AL_PLANS.free;
}

/**
 * Check if a feature is available for a plan
 */
export function isFeatureAvailable(planId, feature) {
  const plan = AL_PLANS[planId] || AL_PLANS.free;
  return plan.features.includes(feature);
}

/**
 * Check if a tool is available for a plan
 */
export function isToolAvailable(planId, toolName) {
  const plan = AL_PLANS[planId] || AL_PLANS.free;
  if (plan.toolAccess === 'all') return true;
  return plan.toolAccess.includes(toolName);
}

/**
 * Check if user has enough balance for estimated usage
 * @param {number} balanceCents - Current balance in cents
 * @param {number} estimatedCostCents - Estimated cost in cents
 */
export function hasEnoughBalance(balanceCents, estimatedCostCents = 2) {
  // Default estimate: ~2 cents for a typical interaction
  return balanceCents >= estimatedCostCents;
}

/**
 * Calculate tank percentage based on balance vs monthly allocation
 */
export function calculateTankPercentage(balanceCents, planId) {
  const plan = AL_PLANS[planId] || AL_PLANS.free;
  const maxCents = plan.allocation.monthlyCents + plan.allocation.maxCarryoverCents;
  return Math.min(100, Math.round((balanceCents / maxCents) * 100));
}

/**
 * Get tank status based on percentage
 */
export function getTankStatus(percentage) {
  if (percentage >= 75) return { label: 'Full', color: '#22c55e', icon: '🟢' };
  if (percentage >= 50) return { label: 'Good', color: '#84cc16', icon: '🟢' };
  if (percentage >= 25) return { label: 'Low', color: '#eab308', icon: '🟡' };
  if (percentage > 0) return { label: 'Very Low', color: '#f97316', icon: '🟠' };
  return { label: 'Empty', color: '#ef4444', icon: '🔴' };
}

/**
 * Format cents as dollars for display
 */
export function formatCentsAsDollars(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Format cents for compact display (e.g., "25¢" or "$1.50")
 */
export function formatCentsCompact(cents) {
  if (cents < 100) {
    return `${cents}¢`;
  }
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Get available tools for a plan, filtered by domain
 */
export function getAvailableToolsForQuery(planId, query) {
  const plan = AL_PLANS[planId] || AL_PLANS.free;
  const domains = detectDomains(query);
  
  // All available tools for this plan
  let availableTools = plan.toolAccess === 'all' 
    ? AL_TOOLS.map(t => t.name)
    : plan.toolAccess;
  
  // Prioritize tools based on detected domains
  const priorityTools = [];
  
  if (domains.includes('comparison')) {
    priorityTools.push('compare_cars', 'search_cars', 'get_car_ai_context', 'get_car_details');
  }
  if (domains.includes('modifications')) {
    priorityTools.push('search_parts', 'get_upgrade_info', 'get_dyno_runs', 'search_encyclopedia', 'recommend_build', 'search_knowledge');
  }
  if (domains.includes('performance')) {
    priorityTools.push('get_dyno_runs', 'get_car_ai_context', 'search_knowledge');
  }
  if (domains.includes('reliability')) {
    priorityTools.push('get_car_ai_context', 'get_known_issues', 'search_knowledge', 'get_expert_reviews');
  }
  if (domains.includes('maintenance')) {
    priorityTools.push('get_car_ai_context', 'get_maintenance_schedule', 'search_knowledge', 'get_car_details');
  }
  if (domains.includes('buying')) {
    priorityTools.push('get_car_ai_context', 'search_knowledge', 'get_car_details', 'get_known_issues', 'search_forums', 'get_expert_reviews');
  }
  if (domains.includes('track')) {
    priorityTools.push('get_car_ai_context', 'search_knowledge', 'recommend_build', 'get_expert_reviews', 'get_car_details');
  }
  
  return {
    available: availableTools,
    priority: priorityTools.filter(t => availableTools.includes(t)),
    domains,
  };
}

// =============================================================================
// LEGACY COMPATIBILITY (will be removed after migration)
// =============================================================================

// These exports maintain backwards compatibility during migration
export const AL_CREDIT_COSTS = {
  message_base: 1,
  message_with_context: 1,
};

export function getOperationCost() { return 1; }
export function calculateMessageCost() { return 1; }
export function hasEnoughCredits(credits) { return credits > 0; }
export function getPlanCredits(planId) { 
  const plan = AL_PLANS[planId] || AL_PLANS.free;
  return { monthlyAllocation: plan.allocation.monthlyCents };
}
export function calculateGasTankPercentage(cents, planId) {
  return calculateTankPercentage(cents, planId);
}
export function getGasTankStatus(percentage) {
  return getTankStatus(percentage);
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  // Pricing
  ANTHROPIC_PRICING,
  calculateTokenCost,
  estimateTokens,
  
  // Plans
  AL_PLANS,
  AL_TOPUP_PACKAGES,
  AL_CREDIT_PACKAGES, // Legacy alias
  
  // Identity
  AL_IDENTITY,
  AL_TOOLS,
  AL_AUTOMOTIVE_DOMAINS,
  
  // Functions
  buildALSystemPrompt,
  getPlan,
  isFeatureAvailable,
  isToolAvailable,
  hasEnoughBalance,
  calculateTankPercentage,
  getTankStatus,
  formatCentsAsDollars,
  formatCentsCompact,
  getAvailableToolsForQuery,
  detectDomains,
};
