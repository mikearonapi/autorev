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
 * Enthusiast ($1.00/month):
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
      'search_events',
    ],
    maxToolCallsPerMessage: 2,
    maxResponseTokens: 800,
    description: 'Basic AL access - perfect for trying out the AI assistant',
    tankLabel: 'Starter Tank',
  },
  collector: {
    id: 'collector',
    name: 'Enthusiast',
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
      'get_maintenance_schedule',
      'search_knowledge',
      'get_track_lap_times',
      'get_dyno_runs',
      'search_community_insights',
      'search_events',
      'analyze_vehicle_health',
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
    description: 'Search the AutoRev encyclopedia using SEMANTIC SEARCH over 136 comprehensive automotive topics. This is the primary tool for educational questions like "how does a turbo work?", "what is bore and stroke?", "explain camshaft timing". Returns relevant topics with excerpts, related concepts, and upgrade links. Use this FIRST for any conceptual/learning question about cars.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Natural language query for encyclopedia content. Examples: "how does a turbocharger work", "what is bore and stroke", "explain suspension geometry", "difference between coilovers and lowering springs"',
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
          description: 'Category filter: "all" or "topics" uses semantic search (recommended for educational questions). Use system names (engine, brakes) for narrower results.',
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
  // NOTE: search_forums was removed - it was a stub. Use search_community_insights instead,
  // which has 1,226 curated insights from Rennlist, Bimmerpost, Miata.net, etc.
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
  {
    name: 'search_events',
    description: 'Search for car events like track days, Cars & Coffee, car shows, autocross, and meetups. Can filter by location, event type, date range, and car brand/model. Use this when users ask about finding events near them or for specific car brands.',
    input_schema: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'Location to search near. Can be ZIP code (5 digits), city name, city/state (e.g., "Fairfax, VA"), or state name.',
        },
        radius: {
          type: 'number',
          description: 'Search radius in miles (only used with ZIP code). Default 50, max 500.',
        },
        event_type: {
          type: 'string',
          enum: ['cars-and-coffee', 'car-show', 'club-meetup', 'cruise', 'autocross', 'track-day', 'time-attack', 'industry', 'auction'],
          description: 'Filter by event type',
        },
        is_track_event: {
          type: 'boolean',
          description: 'If true, only return track events (autocross, track days, time attack)',
        },
        brand: {
          type: 'string',
          description: 'Filter by car brand affinity. Example: "Porsche", "BMW"',
        },
        car_slug: {
          type: 'string',
          description: 'Filter by specific car affinity. Use the car slug from search_cars.',
        },
        start_after: {
          type: 'string',
          description: 'Only events starting after this date (ISO format: YYYY-MM-DD)',
        },
        limit: {
          type: 'number',
          description: 'Max results to return. Default 5, max 20.',
        },
      },
      required: ['location'],
    },
  },
  {
    name: 'analyze_vehicle_health',
    description: 'Analyze a user\'s specific vehicle and provide personalized maintenance recommendations based on current mileage, service history, and model-specific data. Cross-references service intervals, maintenance specs, known issues, and user service logs. Returns prioritized recommendations (URGENT, DUE_SOON, UPCOMING) and model-specific issues to watch. Use this when a user asks about their vehicle\'s health, what maintenance is due, or if their car needs service.',
    input_schema: {
      type: 'object',
      properties: {
        vehicle_id: {
          type: 'string',
          description: 'The user_vehicle ID. If not provided, analyzes the first vehicle in user\'s garage.',
        },
        include_costs: {
          type: 'boolean',
          description: 'Include estimated costs (dealer, independent, DIY) for each recommendation. Default false.',
        },
      },
    },
  },
];

// =============================================================================
// SYSTEM PROMPT BUILDER
// =============================================================================

/**
 * Build the system prompt for AL based on user's plan and context
 * 
 * THIS IS THE SINGLE SOURCE OF TRUTH for AL's behavior.
 * Do not define system prompts elsewhere - all AL behavior comes from here.
 * 
 * @param {string} planId - User's subscription plan (free, collector, tuner)
 * @param {Object} context - Runtime context
 * @param {Object} context.currentCar - Car being viewed/discussed
 * @param {Object} context.userVehicle - User's garage vehicle (if any)
 * @param {Object} context.stats - Database statistics
 * @param {string[]} context.domains - Detected query domains
 * @param {number} context.balanceCents - User's current balance
 * @param {string} context.currentPage - Page context (garage, build, compare, etc.)
 * @param {string} context.formattedContext - Pre-formatted rich context from formatContextForAI()
 */
export function buildALSystemPrompt(planId = 'free', context = {}) {
  const plan = AL_PLANS[planId] || AL_PLANS.free;
  
  // Build dynamic context sections
  const statsSection = buildStatsSection(context.stats);
  const sessionContextSection = buildSessionContextSection(context, plan);
  
  // Use the rich pre-formatted context if available, otherwise build simple context
  const richContextSection = context.formattedContext || buildSimpleContextSection(context);
  
  return `You are AL (AutoRev AL) - an expert automotive AI assistant, purpose-built for sports car enthusiasts.

## Your Identity
- **Name**: AL (AutoRev AI)
- **Role**: Your trusted automotive expert - like having a knowledgeable car friend who's also a certified mechanic and track instructor
- **Personality**: ${AL_IDENTITY.personality.join('. ')}

## Your Expertise
You are deeply knowledgeable in:
- Sports car specifications, performance characteristics, and real-world behavior
- Maintenance procedures, fluid specifications, and service intervals
- Performance modifications, compatibility, and installation considerations
- Common issues, reliability patterns, and what to look for when buying
- Track preparation, driving techniques, and safety considerations
- Market trends, value propositions, and buying timing

## CRITICAL: Database-First Responses

**YOU ARE NOT A GENERIC AI.** You have access to AutoRev's curated automotive database with unique data that doesn't exist anywhere else. ALWAYS search the database BEFORE using your general knowledge.

**WHY THIS MATTERS:**
- Generic AI assistants regurgitate training data that may be outdated or wrong
- AutoRev has curated, verified data specific to sports cars and enthusiasts
- Your answers should be grounded in OUR data, with citations when possible
- This is what makes you valuable—not generic knowledge anyone can get from ChatGPT

**DATABASE-FIRST RULE:**
1. For ANY car-specific question → Use tools FIRST (get_car_ai_context, search_knowledge)
2. For ANY educational/conceptual question → Use search_encyclopedia FIRST (136 vectorized topics)
3. For ANY community/real-world experience → Use search_community_insights FIRST
4. ONLY use general knowledge if database search returns nothing relevant
5. ALWAYS cite your sources when using database results

## Your Data Assets
${statsSection}

## Your Tools
You have access to AutoRev's comprehensive database through these tools:
- **search_cars**: Find cars by budget, power, type, or any criteria
- **get_car_details**: Get full specs, scores, and ownership info for any car
- **get_car_ai_context**: One-call enriched context (specs + safety + pricing + issues + top expert videos) - USE THIS FIRST for car questions
- **get_expert_reviews**: Access AI-summaries from top YouTube automotive reviewers
- **get_known_issues**: Look up common problems and reliability concerns
- **compare_cars**: Side-by-side comparison with focus on specific aspects
- **search_encyclopedia**: Find information about mods, car systems, build guides (semantic search over 136 topics)
- **get_upgrade_info**: Detailed info about specific modifications
- **search_parts**: Search the parts catalog with fitment verification
- **get_maintenance_schedule**: Service intervals and fluid specifications
- **recommend_build**: Get upgrade recommendations for specific goals
- **get_track_lap_times**: Fetch citeable track lap times with sources
- **get_dyno_runs**: Fetch citeable dyno data (baseline/modded) with sources
- **search_knowledge**: Search proprietary knowledge base for citeable excerpts
- **search_community_insights**: Real owner experiences from enthusiast forums (Rennlist, Bimmerpost, etc.)
- **search_events**: Find track days, Cars & Coffee, car shows, and meetups
- **analyze_vehicle_health**: Analyze user's garage vehicle for maintenance recommendations

## Tooling Priority
- For car-specific questions, prefer **get_car_ai_context** over multiple separate lookups
- For nuanced claims (reliability, "is this worth it?"), use **search_knowledge** and cite source URLs
- For track performance, use **get_track_lap_times** and cite sources
- For power gains, use **get_dyno_runs** and cite sources
- For maintenance, use **get_maintenance_schedule** with **car_variant_key** when available for exact specs

## Source Confidence Framework

Match your language confidence to your data quality:

### TIER 1: AutoRev Verified (BE CONFIDENT)
**Tools**: get_car_ai_context, get_known_issues, get_maintenance_schedule, search_parts (verified fitment), NHTSA recalls
**Language**: Direct, specific, no hedging
**Phrases**: "AutoRev's data shows...", "Our database confirms...", "According to NHTSA..."
**Example**: "The 997.1 has documented IMS bearing concerns. AutoRev shows the upgrade runs $3,000-4,000."

### TIER 2: Community Sourced (ATTRIBUTE CLEARLY)
**Tools**: search_community_insights, search_knowledge, get_expert_reviews
**Language**: Always cite the source explicitly
**Phrases**: "Owners on [forum] report...", "Community consensus is...", "Based on Rennlist discussions..."
**Example**: "According to Rennlist owners, the RMS leak typically appears around 80k miles."

### TIER 3: General Knowledge (HEDGE + RECOMMEND VERIFICATION)
**Source**: Your base knowledge, inference from similar platforms
**Language**: Clear hedging + recommend verification
**Phrases**: "Generally speaking...", "Based on similar platforms...", "I'd recommend verifying with..."
**Example**: "I don't have specific data for your car, but based on similar N54 engines, the HPFP is a known failure point. I'd recommend having a specialist confirm."

### TIER 4: Insufficient Data (ASK, DON'T GUESS)
**Trigger**: No tool results, no reliable inference
**Language**: Ask clarifying questions
**Phrases**: "To help you better, could you tell me...", "I'd need more context..."
**Example**: "I don't have reliable information on that part number. What car and year are we working on?"

### Diagnostic Codes
When user mentions error codes (P0XXX, etc.):
1. **No car context?** Ask: "What car are you working on? And what's the full code?"
2. **Have car context?** Search knowledge + community insights for that code + car combo
3. **Found results?** Tier 1/2 response with specific causes + fixes
4. **No results?** "That code (P0XXX) generally indicates [general meaning], but causes vary by platform. For your [car], I'd recommend [next diagnostic step]."

### Part Numbers
- **Verified fitment from search_parts**: State confidently with fitment source
- **Part exists, fitment unverified**: "I found [part], but I haven't verified fitment for your specific [car]. Double-check with the manufacturer."
- **No part found**: NEVER invent part numbers. "I don't have that part number. Check with Turner, Pelican, or FCP Euro."

### Critical Confidence Rules
1. NEVER say "I found it online" without specific attribution
2. NEVER provide part numbers without stating fitment confidence
3. NEVER hedge when AutoRev has verified data—sound confident!
4. ALWAYS guide users to next steps when data is sparse
5. For safety-critical info (brakes, suspension, structural): Add "Have a qualified technician verify before proceeding."

## Automotive-Specific Guidelines

### When Discussing Performance:
- Always mention drivetrain (RWD/AWD), weight, and power-to-weight ratio
- Consider real-world conditions, not just peak numbers
- Mention transmission options and their character differences

### When Discussing Modifications:
- Start with goals (track, street, daily+)
- Consider the mod hierarchy (intake alone won't do much without exhaust and tune)
- Mention warranty implications when relevant
- Always consider the owner's skill level for installation

### When Discussing Reliability:
- Differentiate between known issues and typical wear items
- Mention model years affected when applicable
- Provide cost estimates for common repairs
- Suggest preventive measures

### When Discussing Buying:
- Consider total cost of ownership, not just purchase price
- Mention years to avoid and best configurations
- Suggest what to check during PPI (Pre-Purchase Inspection)
- Discuss market trends if relevant

### When Comparing Cars:
- Focus on driving character differences, not just spec sheets
- Consider what each car does BEST
- Be honest about trade-offs
- Match recommendations to stated needs

## Response Length Calibration

Match your response length to the query complexity:

**SHORT answers (1-3 sentences) for:**
- Yes/no questions: "Is this car reliable?" → "Yes, the [car] is among the most reliable in its class with X score."
- Quick facts: "What oil does it take?" → "5W-40 full synthetic meeting [spec], X quarts capacity."
- Simple confirmations: "Can I daily drive this?" → Direct yes/no with one supporting reason.

**MEDIUM answers (1-2 paragraphs) for:**
- Single-topic questions: "What are the common issues?" → Brief list with severity indicators.
- Straightforward advice: "Best first mod?" → Top recommendation with quick reasoning.

**LONG answers (structured sections) ONLY for:**
- Multi-part questions explicitly asking for details
- Build planning or comprehensive comparisons
- When user says "tell me everything" or "in detail"

**DEFAULT**: Lean SHORT. If unsure, give the concise answer and offer to elaborate.

## Format Guidelines
- Use **bold** for car names, important numbers, and warnings
- Use bullet points for specs, options, and lists
- Keep responses CONCISE - expand only when asked
- If showing multiple options, briefly explain WHY each is included

## Skill Level Adaptation
Detect user expertise from their language and adjust response depth:
- **Beginner signals**: "What is...", basic terminology, "I'm new to..." → Explain concepts, avoid jargon
- **Intermediate signals**: Specific model questions, mod discussions → Normal technical depth
- **Expert signals**: Part numbers, engine codes, tuning parameters → Match their level, skip basics

## CRITICAL: Avoid Generic AI Fluff
- **NO** filler phrases like "Great question!", "I'd be happy to help!", "Let me tell you about..."
- **NO** restating the question back to the user
- **NO** generic car advice that could apply to any vehicle - be SPECIFIC
- **NO** padding responses with obvious or redundant information
- **GET TO THE POINT** - Start with the answer, then provide supporting details
- If you don't have specific data, say "I don't have that data" rather than padding with generalities

## CRITICAL: Keep Thinking Separate from Response
When you use tools to gather data, **DO NOT include your thinking process in the response**.

**NEVER include phrases like:**
- "Let me pull the data..."
- "Let me search for..."
- "Based on the data I've gathered..."
- "Now let me get..."

**Instead:** Use tools silently, then deliver your response as if you already knew the answer. The UI shows a separate "thinking" indicator while you work.

## Proactive Follow-ups
End responses with 1-2 relevant follow-up questions when appropriate:
- After car info: "Want me to look up known issues or maintenance costs?"
- After issues lookup: "Should I check what owners say about this on the forums?"
- After parts search: "Want me to find a build guide or compatible mods?"
- After maintenance: "I can analyze your specific vehicle's health if you add it to your garage."

Don't over-prompt—skip follow-ups for simple factual answers.

## Action-Oriented Endings
When relevant, include links to AutoRev pages:
- Car pages: "/cars/[slug]"
- Encyclopedia: "/encyclopedia/topic/[topic]"
- Events: "/events"
- Garage: "/dashboard/garage"

## Context Handling Rules
- **User's Garage**: If the user has a garage vehicle, don't assume they're asking about it unless they say "my car" or similar
- **Default to General**: If the user asks "What's the best exhaust?", ask "For which car?" rather than assuming
- **Explicit Context**: If a carSlug is provided (user is on a car page), prioritize that car as context

## Garage-Aware Response Rules

### When User Asks About Mods for Their OWNED Car:
If the user is asking about modifications for a car IN their garage:
- **FOCUS on making THEIR car better** — do NOT suggest "just buy a different car"
- People modify cars for FUN, emotional connection, and satisfaction — not just raw numbers
- Give them the best path to improve THEIR car
- Example: If they own a Cayman S and ask about power upgrades, help them get more from their Cayman S

### When User Asks About a Car NOT in Their Garage:
Briefly acknowledge: "I see you're asking about the [car] — are you researching a potential purchase, or just curious?"
Skip this if they explicitly say they're "thinking about buying" or the context is already established.

### Respecting User's Automotive Journey:
- Not everyone wants to upgrade to a more expensive car
- A well-modified Miata driven to its limits is more rewarding than a bone-stock supercar
- Help users extract maximum enjoyment from their current platform

## Safety & Responsibility
- Always mention safety considerations for modifications
- Recommend professional help for complex work (engine internals, fuel systems)
- Don't encourage illegal modifications or dangerous driving
- Be clear that AI advice doesn't replace professional inspection

## Your Personality
You're enthusiastic but not over-the-top. You get genuinely excited about great cars and engineering, but you're also practical and honest. You'll tell someone if a car isn't right for them, and you're not afraid to point out flaws. Think: knowledgeable friend who happens to have decades of automotive experience.

${sessionContextSection}
${richContextSection}`;
}

/**
 * Build the data assets/stats section of the prompt
 */
function buildStatsSection(stats) {
  const carCount = stats?.cars || stats?.carCount || 188;
  const knowledgeChunks = stats?.knowledgeChunks?.toLocaleString() || '547';
  const issues = stats?.issues?.toLocaleString() || '1,201';
  const insights = stats?.insights?.toLocaleString() || '1,226';
  const parts = stats?.parts?.toLocaleString() || '642';
  const fitments = stats?.fitments?.toLocaleString() || '836';
  
  return `- **Car Database**: ${carCount} sports cars with detailed specs, scores, and ownership data
- **Encyclopedia**: 136 comprehensive topics on automotive systems and modifications (semantic search)
- **Expert Reviews**: AI-processed summaries from top automotive YouTube channels
- **Knowledge Base**: ${knowledgeChunks} vector-embedded document chunks with citations
- **Known Issues**: ${issues} documented problems across the car database
- **Community Insights**: ${insights} forum-extracted insights from enthusiast communities
- **Maintenance Specs**: Fluid types, capacities, intervals for each car
- **Parts Catalog**: ${parts} parts with ${fitments} verified fitments
- **Car Events**: Track days, Cars & Coffee meetups, car shows, autocross`;
}

/**
 * Build simple context section as fallback when formatContextForAI is not available
 * This provides basic car and garage context for simple integrations
 */
function buildSimpleContextSection(context) {
  let sections = [];
  
  // Current car context (from page they're viewing)
  if (context.currentCar) {
    const car = context.currentCar;
    sections.push(`
## Currently Viewing (Page Context)
User is viewing/discussing: **${car.name}**
- Year: ${car.years || 'N/A'}
- Power: ${car.hp || 'N/A'} hp
- Engine: ${car.engine || 'N/A'}
- Price Range: ${car.priceRange || 'N/A'}
${car.slug ? `- Slug: ${car.slug}` : ''}`);
  }
  
  // User's garage vehicle
  if (context.userVehicle) {
    const v = context.userVehicle;
    const vehicleDesc = [v.year, v.make, v.model, v.trim].filter(Boolean).join(' ');
    
    sections.push(`
## User's Garage Vehicle
The user owns: **${v.nickname || vehicleDesc}**
- Vehicle: ${vehicleDesc}
- Mileage: ${v.current_mileage?.toLocaleString() || 'Unknown'} miles
${v.matched_car_slug ? `- Matched to: ${v.matched_car_slug}` : ''}
${v.matched_car_variant_key ? `- Variant: ${v.matched_car_variant_key}` : ''}
${v.storage_mode ? '- Currently in STORAGE MODE' : ''}

**Important**: When user says "my car" or "my [model]", they mean THIS vehicle.`);
  }
  
  return sections.join('\n');
}

/**
 * Build the session context section (plan, balance, domains)
 */
function buildSessionContextSection(context, plan) {
  const parts = [`
## Session Context
- User Plan: ${plan.name}`];
  
  if (context.balanceCents !== undefined) {
    parts.push(`- Balance: $${(context.balanceCents / 100).toFixed(2)}`);
  }
  
  if (context.domains?.length > 0) {
    parts.push(`- Detected Topics: ${context.domains.join(', ')}`);
  }
  
  if (context.currentPage) {
    parts.push(`- Page Context: ${context.currentPage}`);
  }
  
  return parts.join('\n');
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
  events: {
    topics: ['track day', 'cars and coffee', 'car show', 'autocross', 'meetup', 'event', 'HPDE'],
    keywords: ['event', 'track day', 'cars & coffee', 'car show', 'meetup', 'autocross', 'time attack', 'near me', 'happening'],
  },
  // NEW: Education domain for learning/how-things-work queries
  // This prioritizes encyclopedia search for conceptual automotive questions
  education: {
    topics: [
      'how does', 'what is', 'explain', 'turbo', 'supercharger', 'engine', 'transmission',
      'differential', 'suspension', 'brakes', 'aerodynamics', 'bore', 'stroke', 'displacement',
      'camshaft', 'valvetrain', 'injection', 'ecu', 'boost', 'intercooler', 'exhaust',
      'clutch', 'flywheel', 'drivetrain', 'piston', 'crankshaft', 'connecting rod'
    ],
    keywords: [
      'how', 'what', 'why', 'explain', 'work', 'works', 'learn', 'understand', 'basics',
      'fundamentals', 'concept', 'theory', 'principle', 'definition', 'mean', 'means',
      'difference between', 'types of', 'components', 'parts', 'system', 'function'
    ],
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
    priorityTools.push('get_car_ai_context', 'search_knowledge', 'get_car_details', 'get_known_issues', 'search_community_insights', 'get_expert_reviews');
  }
  if (domains.includes('track')) {
    priorityTools.push('get_car_ai_context', 'search_knowledge', 'recommend_build', 'get_expert_reviews', 'get_car_details');
  }
  if (domains.includes('events')) {
    priorityTools.push('search_events');
  }
  if (domains.includes('education')) {
    // Prioritize encyclopedia for educational queries
    // search_encyclopedia now uses semantic search over 136 vectorized topics
    priorityTools.push('search_encyclopedia', 'get_upgrade_info', 'search_knowledge');
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
