/**
 * AL Orchestrator
 *
 * Uses Claude Haiku to quickly classify user intent and route to the appropriate specialist agent.
 * Handles multi-intent detection, follow-up routing, and image detection.
 *
 * @module lib/alAgents/orchestrator
 */

import { getAnthropicConfig } from '@/lib/observability';

import { MODELS } from './baseAgent.js';

import { INTENT_TYPES } from './index.js';

const ORCHESTRATOR_MODEL = MODELS.HAIKU;
const ORCHESTRATOR_MAX_TOKENS = 200;

// Haiku pricing (per 1M tokens)
const HAIKU_PRICING = {
  inputPerMillion: 0.25,
  outputPerMillion: 1.25,
};

/**
 * Build the orchestrator's system prompt
 */
function buildOrchestratorPrompt() {
  return `You are an intent classifier for AutoRev's AI assistant AL. Classify user messages into exactly ONE of 8 specialist categories.

## Categories (in priority order for ambiguous cases)

### 1. parts_research (HIGHEST PRIORITY for product queries)
User wants to FIND, BUY, or COMPARE specific parts/products.

**Route here when:**
- Looking for specific parts: intake, exhaust, tune, coilovers, brakes, etc.
- Asking "best X for my car" where X is a part
- Asking "where to buy X"
- Asking "Stage 1/2/3 tune" (this is a PRODUCT search)
- Asking "Top 5 [parts]"
- Comparing specific products (APR vs Unitronic)

**Examples:**
- "Best exhaust for my 981?" → parts_research
- "Stage 1 tune options for RS5" → parts_research (looking for product)
- "APR vs Unitronic tune" → parts_research
- "Top 5 cold air intakes" → parts_research
- "Where can I buy coilovers?" → parts_research

### 2. build_planning
User wants STRATEGY/PLANNING help, not specific products.

**Route here when:**
- "Review my build" / "What mods should I do?"
- "What stage am I at?" / "What stage should I do next?"
- "Are these parts compatible?"
- "What order should I install mods?"
- "Is my car ready for [mod]?"

**CRITICAL DISTINCTION:**
- "What stage should I do?" → build_planning (strategy)
- "Stage 1 tune options" → parts_research (product)

### 3. car_discovery
Questions about CARS (not parts): specs, reliability, comparisons, buying, maintenance.

**Examples:**
- "Compare 911 vs Cayman" → car_discovery
- "Is the M3 reliable?" → car_discovery
- "What oil does my car need?" → car_discovery
- "Tell me about the GT3" → car_discovery

### 4. knowledge
Educational/conceptual questions about how things work.

**Examples:**
- "How does a turbo work?" → knowledge
- "What is forced induction?" → knowledge
- "Difference between turbo and supercharger" → knowledge

### 5. community_events
Events, meetups, or forum/community insights.

**Examples:**
- "Track days near Austin" → community_events
- "Cars and coffee near me" → community_events
- "What do owners say about IMS?" → community_events

### 6. performance_data
Performance calculations, dyno data, lap times.

**Examples:**
- "How much HP will a tune add?" → performance_data
- "Show dyno runs for GT3" → performance_data
- "What's my 0-60 after mods?" → performance_data

### 7. vision
User has attached/mentioned an IMAGE to analyze.

### 8. generalist
Everything else: jokes, platform questions, chitchat, follow-ups.

**Examples:**
- "Tell me a joke" → generalist
- "How do I earn points?" → generalist
- "Thanks" / "OK" → generalist

## Decision Rules

1. **PARTS vs BUILD:** If user mentions a specific PART/PRODUCT → parts_research. If asking about STRATEGY → build_planning.
2. **Tool mentions:** "USE THE research_parts_live TOOL" → parts_research
3. **Ambiguous:** When in doubt, choose the MORE SPECIALIZED category over generalist.
4. **Short follow-ups:** "Yes", "OK", "Thanks" with NO prior context → generalist. WITH prior context → continue the previous topic's category.
5. **Missing car feedback:** "You don't have X car" or "X isn't in the database" → car_discovery (acknowledge and offer to help)
6. **Single character queries:** "?" alone → generalist (ask clarifying question, NEVER dismiss)
7. **Topic selection words:** If user says a single word like "Power", "Reliability", "Mods" after a menu was presented, route to appropriate specialist (performance_data, car_discovery, build_planning respectively).

## CRITICAL: Never Dismiss Users
- "?" should prompt a helpful clarifying question, NOT "no response needed"
- Single words should be treated as topic selections when following a menu
- Always try to move the conversation forward constructively

## Output Format

JSON only, no other text:
{"intent": "category_name", "confidence": 0.0-1.0, "car_context": "slug-if-detected", "reasoning": "one sentence"}`;
}

/**
 * Detect if a message contains an image attachment
 */
function hasImageAttachment(message) {
  if (!message) return false;

  // Check for attachment_ids in message content
  if (Array.isArray(message.content)) {
    return message.content.some(
      (block) =>
        block.type === 'image' ||
        block.attachment_id ||
        (block.type === 'text' &&
          /\[image|\.jpg|\.png|\.jpeg|uploaded|photo|picture/i.test(block.text))
    );
  }

  // Check message text for image references
  if (typeof message.content === 'string') {
    return /\[image|attached|uploaded|photo|picture|this image|the image/i.test(message.content);
  }

  return false;
}

/**
 * Extract the user's latest message text
 */
function getLatestUserMessage(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return null;
  }

  // Find the last user message
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') {
      const content = messages[i].content;
      if (typeof content === 'string') {
        return { text: content, message: messages[i] };
      }
      if (Array.isArray(content)) {
        const textBlock = content.find((b) => b.type === 'text');
        return { text: textBlock?.text || '', message: messages[i] };
      }
    }
  }

  return null;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Extract the previous assistant's likely intent from conversation history.
 * Used for follow-up routing - if user says "yes" after a parts question, continue parts.
 *
 * @param {Array} conversationHistory - Array of {role, content} messages
 * @returns {string|null} Previous intent type or null
 */
function getPreviousAssistantIntent(conversationHistory) {
  if (!Array.isArray(conversationHistory) || conversationHistory.length < 2) {
    return null;
  }

  // Find the last assistant message
  for (let i = conversationHistory.length - 1; i >= 0; i--) {
    const msg = conversationHistory[i];
    if (msg.role === 'assistant') {
      const content = typeof msg.content === 'string' ? msg.content.toLowerCase() : '';

      // Detect intent from response patterns
      if (/## top \d+ .*(intake|exhaust|tune|coilover|brake|wheel|tire)/i.test(content)) {
        return INTENT_TYPES.PARTS_RESEARCH;
      }
      if (/## .*build|stage [123]|mod.*order|upgrade path/i.test(content)) {
        return INTENT_TYPES.BUILD_PLANNING;
      }
      if (/## .*vs\.?|comparison|reliable|reliability|known issues/i.test(content)) {
        return INTENT_TYPES.CAR_DISCOVERY;
      }
      if (/0-60|dyno|lap time|horsepower gain|\+\d+ hp/i.test(content)) {
        return INTENT_TYPES.PERFORMANCE_DATA;
      }
      if (/track day|car show|meetup|event/i.test(content)) {
        return INTENT_TYPES.COMMUNITY_EVENTS;
      }
      if (/how .*works|turbo|supercharger|naturally aspirated/i.test(content)) {
        return INTENT_TYPES.KNOWLEDGE;
      }

      // If we found an assistant message but couldn't detect intent, return null
      return null;
    }
  }

  return null;
}

// =============================================================================
// PATTERN DEFINITIONS FOR QUICK CLASSIFICATION
// =============================================================================

/**
 * Parts/products that indicate PARTS_RESEARCH intent
 * These are specific purchasable items
 */
const PARTS_KEYWORDS = [
  // Intake/Exhaust
  'intake',
  'cold air intake',
  'cai',
  'exhaust',
  'catback',
  'cat-back',
  'downpipe',
  'dp',
  'header',
  'headers',
  'manifold',
  'muffler',
  'resonator',
  'midpipe',
  'test pipe',
  // Engine/Power
  'tune',
  'ecu',
  'flash',
  'piggyback',
  'tuner',
  'turbo',
  'turbocharger',
  'supercharger',
  'blower',
  'intercooler',
  'fmic',
  'bov',
  'blow off valve',
  'wastegate',
  'boost controller',
  'fuel pump',
  'injector',
  'fuel rail',
  'catch can',
  'oil catch',
  'throttle body',
  // Suspension/Handling
  'coilover',
  'coil-over',
  'spring',
  'lowering spring',
  'sway bar',
  'strut',
  'shock',
  'control arm',
  'bushing',
  'end link',
  'camber',
  'toe arm',
  'subframe',
  // Brakes
  'brake pad',
  'rotor',
  'caliper',
  'brake line',
  'ss lines',
  'stainless lines',
  'brake fluid',
  'big brake kit',
  'bbk',
  'master cylinder',
  // Wheels/Tires
  'wheel',
  'rim',
  'tire',
  'spacer',
  'lug',
  'hub',
  // Drivetrain
  'clutch',
  'flywheel',
  'short shifter',
  'shift knob',
  'diff',
  'differential',
  'lsd',
  'driveshaft',
  'axle',
  'cv',
  'halfshaft',
  // Fluids/Filters
  'oil filter',
  'air filter',
  'fuel filter',
  'transmission fluid',
  'gear oil',
  'coolant',
  // Other parts
  'spark plug',
  'ignition coil',
  'battery',
  'alternator',
  'pulley',
  'belt',
  'splitter',
  'diffuser',
  'wing',
  'spoiler',
  'lip',
  'bumper',
  'fender',
  'hood',
  'seat',
  'harness',
  'roll bar',
  'cage',
  'steering wheel',
  'pedal',
];

/**
 * Action words that indicate shopping/purchasing intent
 */
const SHOPPING_ACTIONS = [
  'find',
  'search',
  'buy',
  'purchase',
  'shop',
  'looking for',
  'need a',
  'need an',
  'where to get',
  'where to buy',
  'where can i get',
  'where can i buy',
  'best',
  'top',
  'recommend',
  'recommendation',
  'suggestions',
  'options',
  'cheapest',
  'affordable',
  'budget',
  'premium',
  'quality',
];

/**
 * Quick pattern-based classification for obvious intents
 * Returns null if pattern matching isn't confident enough
 *
 * ROUTING PRIORITY ORDER:
 * 1. Vision (image attached - highest priority)
 * 2. Ambiguous single-character queries (need clarification)
 * 3. Short follow-ups (Generalist with context awareness)
 * 4. Platform questions (Generalist)
 * 5. Jokes/chitchat (Generalist)
 * 6. Parts Research (BEFORE Build Planning - catches "stage X tune")
 * 7. Build Planning (strategy, not specific products)
 * 8. Community Events
 * 9. Knowledge (educational)
 * 10. Performance Data
 * 11. Car Discovery (broad catch-all for car questions)
 */
function quickClassify(text, hasImage, conversationHistory = []) {
  if (!text) return null;
  const lower = text.toLowerCase().trim();

  // =========================================================================
  // 1. VISION - Image attached (highest priority)
  // =========================================================================
  if (hasImage) {
    return {
      intent: INTENT_TYPES.VISION,
      confidence: 0.95,
      reasoning: 'Image attachment detected',
    };
  }

  // =========================================================================
  // 2. AMBIGUOUS SINGLE-CHARACTER QUERIES → Need LLM with context
  // =========================================================================
  // Single character like "?" should NOT be dismissed - let LLM handle with context
  if (lower.length <= 2 && /^[?!.]$/.test(lower)) {
    // Return null to force LLM classification with conversation context
    return null;
  }

  // =========================================================================
  // 3. SHORT FOLLOW-UPS → Check conversation context before routing to generalist
  // =========================================================================
  if (lower.length < 15) {
    // Very short affirmative/negative responses - but check context first
    if (
      /^(yes|no|ok|okay|sure|thanks|thank you|yep|nope|go on|continue|more|please|got it|perfect|great|cool|nice|awesome)\.?$/i.test(
        lower
      )
    ) {
      // If there's conversation history, inherit the previous intent
      const previousIntent = getPreviousAssistantIntent(conversationHistory);
      if (previousIntent && previousIntent !== INTENT_TYPES.GENERALIST) {
        return {
          intent: previousIntent,
          confidence: 0.85,
          reasoning: `Short follow-up, continuing ${previousIntent} context`,
          isFollowUp: true,
        };
      }
      return { intent: INTENT_TYPES.GENERALIST, confidence: 0.95, reasoning: 'Short follow-up' };
    }

    // Single-word queries that might be topic selections (e.g., "Power", "Reliability")
    // These should use LLM with conversation context, not be dismissed
    if (lower.length < 12 && /^[a-z]+$/i.test(lower)) {
      // Common topic selection words - let LLM decide with context
      const topicWords = [
        'power',
        'speed',
        'reliability',
        'issues',
        'maintenance',
        'mods',
        'upgrades',
        'performance',
        'handling',
        'brakes',
        'exhaust',
        'intake',
        'tune',
      ];
      if (topicWords.includes(lower)) {
        // Return null to force LLM classification with full conversation context
        return null;
      }
    }

    // Questions that are too short to classify - but NOT if they contain "?"
    // "?" alone should go to LLM, not be dismissed
    if (lower.length < 8 && !/\?/.test(lower) && conversationHistory.length === 0) {
      return {
        intent: INTENT_TYPES.GENERALIST,
        confidence: 0.7,
        reasoning: 'Too short to classify',
      };
    }
  }

  // =========================================================================
  // 3. PLATFORM QUESTIONS → Generalist
  // =========================================================================
  if (
    /how (do i|does|to) use autorev|autorev (help|guide|tutorial)|garage score|earn points|my points|subscription|tier|plan/i.test(
      lower
    )
  ) {
    return { intent: INTENT_TYPES.GENERALIST, confidence: 0.9, reasoning: 'Platform question' };
  }

  // =========================================================================
  // 4. JOKES/CHITCHAT → Generalist
  // =========================================================================
  if (
    /\b(joke|funny|laugh|kidding|humor)\b|tell me a (joke|story|fun)|make me laugh/i.test(lower)
  ) {
    return { intent: INTENT_TYPES.GENERALIST, confidence: 0.9, reasoning: 'Joke/chitchat' };
  }

  // Greetings
  if (/^(hi|hello|hey|sup|yo|what'?s up|howdy|greetings)[\s!.,?]*$/i.test(lower)) {
    return { intent: INTENT_TYPES.GENERALIST, confidence: 0.9, reasoning: 'Greeting' };
  }

  // =========================================================================
  // 5. PERFORMANCE DATA - Calculations, dyno, lap times
  // =========================================================================
  // Check BEFORE parts research to catch "how much HP will a tune add" correctly
  // (the word "tune" shouldn't trigger parts_research when asking about calculations)

  if (
    /\b(how much (hp|horsepower|power|torque|whp|wtq)|power gains?|hp gains?|torque gains?)\b/i.test(
      lower
    )
  ) {
    return {
      intent: INTENT_TYPES.PERFORMANCE_DATA,
      confidence: 0.88,
      reasoning: 'Power calculation',
    };
  }

  // "What power gains can I expect" - expectation queries
  if (/\b(what|how much).*\b(gain|gains|expect)\b.*\b(from|with)\b/i.test(lower)) {
    return {
      intent: INTENT_TYPES.PERFORMANCE_DATA,
      confidence: 0.85,
      reasoning: 'Power expectation query',
    };
  }

  if (/\b(0-60|0 to 60|zero to sixty|quarter mile|1\/4 mile|trap speed)\b/i.test(lower)) {
    return {
      intent: INTENT_TYPES.PERFORMANCE_DATA,
      confidence: 0.88,
      reasoning: 'Acceleration data',
    };
  }

  if (/\b(dyno|dynamometer|dyno run|dyno graph|dyno numbers)\b/i.test(lower)) {
    return { intent: INTENT_TYPES.PERFORMANCE_DATA, confidence: 0.9, reasoning: 'Dyno data query' };
  }

  if (/\b(lap time|lap record|track time|nurburgring|ring time)\b/i.test(lower)) {
    return { intent: INTENT_TYPES.PERFORMANCE_DATA, confidence: 0.88, reasoning: 'Lap time query' };
  }

  // =========================================================================
  // 6. PARTS RESEARCH - Specific products/purchasing (BEFORE Build Planning!)
  // =========================================================================
  // This MUST come before Build Planning to catch "stage 1 tune" queries

  // Pattern 1: Explicit tool mention (quick actions)
  if (/research_parts_live|USE THE research_parts_live/i.test(lower)) {
    return {
      intent: INTENT_TYPES.PARTS_RESEARCH,
      confidence: 0.98,
      reasoning: 'Explicit parts research tool',
    };
  }

  // Pattern 2: "Stage X tune/ECU" - looking for a specific product
  if (/stage\s*[123]\s*(tune|ecu|flash|software|remap)/i.test(lower)) {
    return {
      intent: INTENT_TYPES.PARTS_RESEARCH,
      confidence: 0.9,
      reasoning: 'Stage tune product search',
    };
  }

  // Pattern 3: "Top N [parts]" or "Best N [parts]"
  if (/(?:top|best)\s*\d+\s+\w+/i.test(lower)) {
    // Check if it mentions a part
    const hasPartKeywordInTopN = PARTS_KEYWORDS.some((part) => lower.includes(part));
    if (hasPartKeywordInTopN) {
      return {
        intent: INTENT_TYPES.PARTS_RESEARCH,
        confidence: 0.9,
        reasoning: 'Top N parts list',
      };
    }
  }

  // Pattern 4: Shopping action + part keyword
  const hasShoppingAction = SHOPPING_ACTIONS.some((action) => lower.includes(action));
  const hasPartKeyword = PARTS_KEYWORDS.some((part) => lower.includes(part));

  if (hasShoppingAction && hasPartKeyword) {
    return {
      intent: INTENT_TYPES.PARTS_RESEARCH,
      confidence: 0.88,
      reasoning: 'Shopping for specific part',
    };
  }

  // Pattern 4b: "Is my car ready for X" - readiness check (BEFORE "for my" parts pattern!)
  // This catches build planning queries like "Is my car ready for a bigger turbo?"
  if (/\b(ready for|prepared for|set up for|can handle)\b/i.test(lower)) {
    return {
      intent: INTENT_TYPES.BUILD_PLANNING,
      confidence: 0.88,
      reasoning: 'Build readiness check',
    };
  }

  // Pattern 5: Direct part queries without action words but clearly about buying
  // "cold air intake for my RS5", "coilovers for track use"
  if (hasPartKeyword && /\b(for my|for the|for a|for track|for street|for daily)\b/i.test(lower)) {
    return {
      intent: INTENT_TYPES.PARTS_RESEARCH,
      confidence: 0.85,
      reasoning: 'Part fitment query',
    };
  }

  // Pattern 6: Brand + part mentions (e.g., "APR tune", "Akrapovic exhaust")
  const brandPatterns =
    /\b(apr|034|ecs|ie|integrated engineering|unitronic|cobb|awe|akrapovic|borla|magnaflow|k&n|aem|bilstein|kw|ohlins|brembo|stoptech|bc racing)\b/i;
  if (brandPatterns.test(lower) && hasPartKeyword) {
    return {
      intent: INTENT_TYPES.PARTS_RESEARCH,
      confidence: 0.85,
      reasoning: 'Brand + part query',
    };
  }

  // Pattern 6b: Brand + specific product name (even if not in parts list)
  // Catches "Cobb Accessport cost", "APR Plus pricing", etc.
  const specificProducts =
    /\b(accessport|jb4|mhd|bm3|ecutek|hp tuners|diablo|sct|procede|burger jb|piggyback)\b/i;
  if (brandPatterns.test(lower) || specificProducts.test(lower)) {
    // Price/cost query for a specific product
    if (/\b(price|cost|how much|pricing|msrp)\b/i.test(lower)) {
      return {
        intent: INTENT_TYPES.PARTS_RESEARCH,
        confidence: 0.85,
        reasoning: 'Product pricing query',
      };
    }
  }

  // Pattern 7: Price-focused part queries (but NOT "how much HP" which is performance)
  if (
    !/how much (hp|horsepower|power)/i.test(lower) &&
    (/\b(price|cost|how much|pricing)\b.*\b(exhaust|intake|tune|coilover|brake)/i.test(lower) ||
      /\b(exhaust|intake|tune|coilover|brake).*\b(price|cost|how much)\b/i.test(lower))
  ) {
    return {
      intent: INTENT_TYPES.PARTS_RESEARCH,
      confidence: 0.85,
      reasoning: 'Part pricing query',
    };
  }

  // =========================================================================
  // 7. BUILD PLANNING - Strategy, not specific products
  // =========================================================================
  // "What mods should I do", "review my build", "mod order", etc.
  if (
    /\b(my build|review my|what mods|mod order|install order|which mods|mod plan)\b/i.test(lower)
  ) {
    return {
      intent: INTENT_TYPES.BUILD_PLANNING,
      confidence: 0.88,
      reasoning: 'Build planning query',
    };
  }

  // "What order should I install my mods" - order + install patterns
  if (/\b(what order|which order)\b.*\b(install|do)\b.*\b(mod|mods|parts)\b/i.test(lower)) {
    return {
      intent: INTENT_TYPES.BUILD_PLANNING,
      confidence: 0.88,
      reasoning: 'Install order query',
    };
  }

  // "What stage should I do" (strategy) vs "stage 1 tune" (product)
  if (/what stage (should|am|do|is)|which stage|ready for stage/i.test(lower)) {
    return {
      intent: INTENT_TYPES.BUILD_PLANNING,
      confidence: 0.85,
      reasoning: 'Build stage strategy',
    };
  }

  // "What supporting mods do I need" - supporting mod queries
  if (/\b(supporting mods?|what mods? (do i |does it )?need|mods? needed)\b/i.test(lower)) {
    return {
      intent: INTENT_TYPES.BUILD_PLANNING,
      confidence: 0.88,
      reasoning: 'Supporting mods query',
    };
  }

  // Compatibility checks
  if (
    /\b(compatible|compatibility|work with|fit with|pair with|stack with)\b/i.test(lower) &&
    /\b(mod|mods|parts|tune|intake|exhaust)\b/i.test(lower)
  ) {
    return {
      intent: INTENT_TYPES.BUILD_PLANNING,
      confidence: 0.85,
      reasoning: 'Compatibility check',
    };
  }

  // Build progression
  if (/\b(next upgrade|next mod|what next|what's next|upgrade path|build path)\b/i.test(lower)) {
    return {
      intent: INTENT_TYPES.BUILD_PLANNING,
      confidence: 0.85,
      reasoning: 'Build progression',
    };
  }

  // =========================================================================
  // 8. COMMUNITY EVENTS
  // =========================================================================
  // Note: "track days?" matches both "track day" and "track days"
  if (
    /\b(track days?|cars and coffee|car shows?|autocross|autox|hpde|rally|cruise|meetups?|meet ups?|car meets?)\b/i.test(
      lower
    )
  ) {
    return { intent: INTENT_TYPES.COMMUNITY_EVENTS, confidence: 0.9, reasoning: 'Car event query' };
  }

  // Location-based event searches
  if (
    /\b(event|meet|show)\b.*\b(near|in|around|close to)\b/i.test(lower) ||
    /\b(near|in|around)\b.*\b(event|meet|show)\b/i.test(lower)
  ) {
    return {
      intent: INTENT_TYPES.COMMUNITY_EVENTS,
      confidence: 0.85,
      reasoning: 'Event location search',
    };
  }

  // Forum/community insights
  if (/\b(what do owners|owner experience|forum|community says|real world)\b/i.test(lower)) {
    return {
      intent: INTENT_TYPES.COMMUNITY_EVENTS,
      confidence: 0.8,
      reasoning: 'Community insights',
    };
  }

  // =========================================================================
  // 9. CAR DISCOVERY - General car questions, comparisons, specs
  // =========================================================================
  // NOTE: Check reliability/issues BEFORE knowledge to catch "What are the common issues"

  // Reliability/issues (MUST be before knowledge pattern!)
  if (
    /\b(reliable|reliability|common issues?|known issues?|problems with|failures?|recalls?)\b/i.test(
      lower
    )
  ) {
    return { intent: INTENT_TYPES.CAR_DISCOVERY, confidence: 0.85, reasoning: 'Reliability query' };
  }

  // Car comparisons (not part comparisons)
  if (
    /\b(compare|vs\.?|versus)\b/i.test(lower) &&
    /\b(911|gt3|cayman|boxster|m3|m4|c63|rs5|rs6|mustang|camaro|corvette|supra|z4|miata|wrx|sti|civic|type r|gtr|r35|s2000|nsx)\b/i.test(
      lower
    )
  ) {
    return { intent: INTENT_TYPES.CAR_DISCOVERY, confidence: 0.85, reasoning: 'Car comparison' };
  }

  // Car specs/info
  if (
    /\b(tell me about|specs|specifications|horsepower|weight|msrp|price range)\b.*\b(car|911|gt3|m3|rs5|mustang|corvette)\b/i.test(
      lower
    )
  ) {
    return { intent: INTENT_TYPES.CAR_DISCOVERY, confidence: 0.85, reasoning: 'Car info query' };
  }

  // Maintenance (note: matches with or without "my" - e.g., "service intervals for Porsche 911")
  if (/\b(what oil|oil type|service intervals?|maintenance schedule|fluid spec)\b/i.test(lower)) {
    return { intent: INTENT_TYPES.CAR_DISCOVERY, confidence: 0.85, reasoning: 'Maintenance query' };
  }

  // Buying advice
  if (
    /\b(should i buy|worth buying|good daily|daily driver|weekend car|buy a|buying a|looking at a)\b/i.test(
      lower
    )
  ) {
    return { intent: INTENT_TYPES.CAR_DISCOVERY, confidence: 0.82, reasoning: 'Buying advice' };
  }

  // "Best car for X"
  if (/\b(best|good)\s+(car|sports car|daily|track car|weekend car)\b/i.test(lower)) {
    return {
      intent: INTENT_TYPES.CAR_DISCOVERY,
      confidence: 0.82,
      reasoning: 'Car recommendation',
    };
  }

  // =========================================================================
  // 10. KNOWLEDGE - Educational questions
  // =========================================================================
  // "How does X work", "What is X", "Explain X"
  // Note: "what is [concept]" where concept is NOT "the best", "my", or about issues
  if (
    /^(what is\s|what are\s|how does\s|how do\s|explain\s|teach me about\s|learn about\s)/i.test(
      lower
    ) &&
    !/what is the best|what is my|what are the best|what are my|common issues|known issues/i.test(
      lower
    )
  ) {
    return { intent: INTENT_TYPES.KNOWLEDGE, confidence: 0.85, reasoning: 'Educational question' };
  }

  // "Difference between X and Y"
  if (
    /difference between|versus|vs\.?\s+/i.test(lower) &&
    /\b(turbo|supercharger|coilover|spring|fwd|rwd|awd|lsd|open diff|dct|manual|auto)\b/i.test(
      lower
    )
  ) {
    return { intent: INTENT_TYPES.KNOWLEDGE, confidence: 0.85, reasoning: 'Comparison education' };
  }

  // Technical terms that suggest education
  if (
    /\b(how (does|do)|why (does|do)|what (causes|makes))\b.*\b(boost|compression|timing|valve|cam|piston|crank|torque curve)\b/i.test(
      lower
    )
  ) {
    return { intent: INTENT_TYPES.KNOWLEDGE, confidence: 0.85, reasoning: 'Technical education' };
  }

  // =========================================================================
  // NO CONFIDENT MATCH - Will fall through to LLM classification
  // =========================================================================
  return null;
}

/**
 * Classify user intent using Claude Haiku
 */
async function classifyWithLLM(text, conversationHistory = [], observability = {}) {
  const correlationId = observability.requestId || 'unknown';
  const startTime = Date.now();

  const { apiUrl, headers } = getAnthropicConfig({
    ...observability,
    properties: {
      ...observability.properties,
      agentId: 'orchestrator',
      agentModel: ORCHESTRATOR_MODEL,
    },
  });

  // Build messages with recent conversation context
  const recentContext = conversationHistory.slice(-4).map((m) => ({
    role: m.role,
    content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
  }));

  const requestBody = {
    model: ORCHESTRATOR_MODEL,
    max_tokens: ORCHESTRATOR_MAX_TOKENS,
    system: buildOrchestratorPrompt(),
    messages: [
      ...recentContext,
      {
        role: 'user',
        content: `Classify this message: "${text}"`,
      },
    ],
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    const durationMs = Date.now() - startTime;

    if (!response.ok) {
      console.error(
        `[Orchestrator:${correlationId}] LLM API error: ${response.status} (${durationMs}ms)`
      );
      return { intent: INTENT_TYPES.GENERALIST, confidence: 0.5, reasoning: 'API error fallback' };
    }

    const result = await response.json();
    const responseText = result.content?.[0]?.text || '';

    // Log LLM usage for cost tracking
    if (result.usage) {
      console.info(
        `[Orchestrator:${correlationId}] LLM call: ${durationMs}ms, ` +
          `${result.usage.input_tokens}in/${result.usage.output_tokens}out tokens`
      );
    }

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      // Validate intent is a known type
      const validIntent = Object.values(INTENT_TYPES).includes(parsed.intent)
        ? parsed.intent
        : INTENT_TYPES.GENERALIST;

      if (validIntent !== parsed.intent) {
        console.warn(
          `[Orchestrator:${correlationId}] LLM returned unknown intent "${parsed.intent}", ` +
            `falling back to generalist`
        );
      }

      return {
        intent: validIntent,
        confidence: Math.min(1, Math.max(0, parsed.confidence || 0.7)),
        car_context: parsed.car_context || null,
        reasoning: parsed.reasoning || '',
        usage: result.usage,
      };
    }

    console.warn(
      `[Orchestrator:${correlationId}] LLM response not valid JSON: "${responseText.substring(0, 100)}"`
    );
  } catch (e) {
    console.error(`[Orchestrator:${correlationId}] LLM classification error:`, e.message);
  }

  return { intent: INTENT_TYPES.GENERALIST, confidence: 0.5, reasoning: 'Parse error fallback' };
}

/**
 * Main orchestrator function
 * Classifies intent and returns routing decision
 */
export async function classifyIntent({
  messages,
  context = {},
  skipLLM = false,
  observability = {},
}) {
  const correlationId = observability.requestId || 'unknown';
  const latest = getLatestUserMessage(messages);

  if (!latest) {
    console.warn(`[Orchestrator:${correlationId}] No user message found in messages array`);
    return {
      intent: INTENT_TYPES.GENERALIST,
      confidence: 0.5,
      reasoning: 'No user message found',
      usedLLM: false,
    };
  }

  const { text, message } = latest;
  const hasImage = hasImageAttachment(message);
  const queryPreview = text.length > 80 ? text.substring(0, 80) + '...' : text;

  // Try quick classification first (faster, no API call)
  // Pass conversation history for context-aware follow-up handling
  const quickResult = quickClassify(text, hasImage, messages);

  if (quickResult && quickResult.confidence >= 0.8) {
    console.info(
      `[Orchestrator:${correlationId}] QUICK_CLASSIFY → ${quickResult.intent} ` +
        `(${(quickResult.confidence * 100).toFixed(0)}%) | "${queryPreview}" | ${quickResult.reasoning}`
    );
    return {
      ...quickResult,
      usedLLM: false,
      car_context: context.currentCar?.slug || null,
    };
  }

  // Quick classification not confident enough - log what we got
  if (quickResult) {
    console.info(
      `[Orchestrator:${correlationId}] QUICK_CLASSIFY low confidence → ${quickResult.intent} ` +
        `(${(quickResult.confidence * 100).toFixed(0)}%) | "${queryPreview}" | Falling back to LLM`
    );
  } else {
    console.info(
      `[Orchestrator:${correlationId}] QUICK_CLASSIFY no match | "${queryPreview}" | Falling back to LLM`
    );
  }

  // If quick classification isn't confident, use LLM
  if (!skipLLM) {
    const llmResult = await classifyWithLLM(text, messages, observability);
    console.info(
      `[Orchestrator:${correlationId}] LLM_CLASSIFY → ${llmResult.intent} ` +
        `(${((llmResult.confidence || 0) * 100).toFixed(0)}%) | "${queryPreview}" | ${llmResult.reasoning || ''}`
    );
    return {
      ...llmResult,
      usedLLM: true,
    };
  }

  // Fallback to quick result or generalist
  const fallbackResult = quickResult || {
    intent: INTENT_TYPES.GENERALIST,
    confidence: 0.5,
    reasoning: 'Default fallback (LLM skipped)',
    usedLLM: false,
  };

  console.info(
    `[Orchestrator:${correlationId}] FALLBACK → ${fallbackResult.intent} ` +
      `(${(fallbackResult.confidence * 100).toFixed(0)}%) | "${queryPreview}"`
  );

  return fallbackResult;
}

/**
 * Estimate orchestrator cost
 */
export function estimateOrchestratorCost(inputTokens, outputTokens) {
  const inputCost = (inputTokens / 1_000_000) * HAIKU_PRICING.inputPerMillion;
  const outputCost = (outputTokens / 1_000_000) * HAIKU_PRICING.outputPerMillion;
  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
  };
}

const orchestrator = {
  classifyIntent,
  estimateOrchestratorCost,
  ORCHESTRATOR_MODEL,
};

export default orchestrator;
