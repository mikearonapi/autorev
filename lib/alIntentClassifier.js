/**
 * AL Query Intent Classifier
 * 
 * Classifies user queries to help route them to appropriate tools.
 * Uses pattern matching and keyword analysis for fast, deterministic results.
 * Can be enhanced with ML-based classification if needed.
 * 
 * Intent Categories:
 * - specs: Car specifications, features, dimensions
 * - troubleshooting: Problems, issues, diagnoses
 * - compatibility: Parts fitment, interchangeability
 * - maintenance: Service intervals, fluids, procedures
 * - builds: Modifications, power gains, upgrades
 * - comparison: Comparing multiple cars
 * - pricing: Cost, value, market info
 * - general: General car questions
 * 
 * @module lib/alIntentClassifier
 */

// =============================================================================
// INTENT DEFINITIONS
// =============================================================================

/**
 * @typedef {'specs'|'troubleshooting'|'compatibility'|'maintenance'|'builds'|'comparison'|'pricing'|'general'} Intent
 */

/**
 * Intent metadata with suggested tools and confidence thresholds
 */
export const INTENT_CONFIG = {
  specs: {
    label: 'Specifications',
    description: 'Car specifications, features, engine details',
    suggestedTools: ['getCarSpecs', 'searchCars'],
    priority: 1,
  },
  troubleshooting: {
    label: 'Troubleshooting',
    description: 'Problems, issues, error codes, diagnoses',
    suggestedTools: ['searchKnowledge', 'getKnownIssues'],
    priority: 2,
  },
  compatibility: {
    label: 'Compatibility',
    description: 'Parts fitment, interchangeability, swaps',
    suggestedTools: ['searchKnowledge', 'checkPartCompatibility'],
    priority: 2,
  },
  maintenance: {
    label: 'Maintenance',
    description: 'Service intervals, fluids, procedures',
    suggestedTools: ['getMaintenanceSchedule', 'searchKnowledge'],
    priority: 2,
  },
  builds: {
    label: 'Builds & Mods',
    description: 'Modifications, power gains, tuning',
    suggestedTools: ['searchKnowledge', 'getModificationArticle', 'calculatePerformanceGain'],
    priority: 2,
  },
  comparison: {
    label: 'Comparison',
    description: 'Comparing multiple cars',
    suggestedTools: ['compareCars', 'getCarSpecs'],
    priority: 1,
  },
  pricing: {
    label: 'Pricing',
    description: 'Cost, value, market information',
    suggestedTools: ['getMarketData', 'searchCars'],
    priority: 3,
  },
  general: {
    label: 'General',
    description: 'General automotive questions',
    suggestedTools: ['searchKnowledge'],
    priority: 4,
  },
};

// =============================================================================
// KEYWORD PATTERNS
// =============================================================================

/**
 * Keywords and patterns for each intent
 * Higher weight = stronger signal
 */
const INTENT_PATTERNS = {
  specs: {
    keywords: [
      { pattern: /\b(horsepower|hp|bhp|power|whp)\b/i, weight: 3 },
      { pattern: /\b(torque|lb-ft|nm|newton)\b/i, weight: 3 },
      { pattern: /\b(engine|motor|displacement|liters?|cc)\b/i, weight: 2 },
      { pattern: /\b(0-60|0 to 60|quarter mile|1\/4 mile|top speed)\b/i, weight: 3 },
      { pattern: /\b(weight|curb weight|lbs?|kg|pounds)\b/i, weight: 2 },
      { pattern: /\b(dimensions|wheelbase|length|width|height)\b/i, weight: 2 },
      { pattern: /\b(transmission|gearbox|manual|automatic|dct|pdk)\b/i, weight: 2 },
      { pattern: /\b(redline|rev limit|rpm)\b/i, weight: 2 },
      { pattern: /\b(differential|awd|rwd|fwd|4wd|drivetrain)\b/i, weight: 2 },
      { pattern: /\b(suspension|struts?|springs?|dampers?)\b/i, weight: 2 },
      { pattern: /\b(fuel economy|mpg|miles per gallon)\b/i, weight: 2 },
      { pattern: /\bhow much (does|do) .+ (weigh|cost|make)\b/i, weight: 3 },
      { pattern: /\bwhat (engine|transmission|differential)\b/i, weight: 3 },
      { pattern: /\bwhat is the (hp|horsepower|torque|weight)\b/i, weight: 3 },
    ],
    minScore: 2,
  },
  
  troubleshooting: {
    keywords: [
      { pattern: /\b(problem|issue|broken|failed|failing|fault)\b/i, weight: 3 },
      { pattern: /\b(noise|sound|grinding|clicking|knocking|clunking)\b/i, weight: 3 },
      { pattern: /\b(leak|leaking|dripping)\b/i, weight: 3 },
      { pattern: /\b(check engine|cel|warning light|dtc|code)\b/i, weight: 4 },
      { pattern: /\b(limp mode|derate|reduced power)\b/i, weight: 4 },
      { pattern: /\b(won't start|no start|stalling|dies)\b/i, weight: 4 },
      { pattern: /\b(overheating|running hot|temperature)\b/i, weight: 3 },
      { pattern: /\b(vibration|shaking|wobble)\b/i, weight: 3 },
      { pattern: /\b(smoke|smoking|burning smell)\b/i, weight: 4 },
      { pattern: /\b(rough idle|misfir|hesitation)\b/i, weight: 3 },
      { pattern: /\bwhat('s| is) wrong\b/i, weight: 4 },
      { pattern: /\bwhy (does|is|did)\b/i, weight: 2 },
      { pattern: /\b(diagnose|diagnosis|troubleshoot)\b/i, weight: 4 },
      { pattern: /\bshould i (be worried|worry)\b/i, weight: 3 },
    ],
    minScore: 3,
  },
  
  compatibility: {
    keywords: [
      { pattern: /\b(fit|fits?|compatible|compatibility|fitment)\b/i, weight: 4 },
      { pattern: /\b(swap|swapping|swapped)\b/i, weight: 3 },
      { pattern: /\b(interchange|interchangeable|cross-compatible)\b/i, weight: 4 },
      { pattern: /\b(bolt[- ]?on|direct replacement|drop[- ]?in)\b/i, weight: 4 },
      { pattern: /\b(work with|works? on|use .+ on)\b/i, weight: 3 },
      { pattern: /\bwill .+ (fit|work|bolt)\b/i, weight: 4 },
      { pattern: /\bcan i (use|put|install|run)\b/i, weight: 3 },
      { pattern: /\b(from|off) (a|an|my|the) .+ on (a|an|my|the)\b/i, weight: 3 },
      { pattern: /\b(wheels?|rims?|tires?) .+ (fit|work)\b/i, weight: 3 },
      { pattern: /\b(oem|aftermarket|universal)\b/i, weight: 2 },
    ],
    minScore: 3,
  },
  
  maintenance: {
    keywords: [
      { pattern: /\b(oil change|oil filter|engine oil)\b/i, weight: 4 },
      { pattern: /\b(maintenance|service|servicing)\b/i, weight: 3 },
      { pattern: /\b(fluid|fluids?|coolant|brake fluid|transmission fluid)\b/i, weight: 3 },
      { pattern: /\b(interval|schedule|how often)\b/i, weight: 3 },
      { pattern: /\b(spark plugs?|air filter|fuel filter)\b/i, weight: 3 },
      { pattern: /\b(replace|replacement|replacing|change)\b/i, weight: 2 },
      { pattern: /\b(timing belt|timing chain|water pump)\b/i, weight: 3 },
      { pattern: /\b(when should|how often should)\b/i, weight: 4 },
      { pattern: /\b(brake pads?|rotors?|calipers?)\b/i, weight: 2 },
      { pattern: /\b(wear|worn|life expectancy)\b/i, weight: 2 },
      { pattern: /\b(torque spec|specification)\b/i, weight: 2 },
      { pattern: /\b(storage|winterize|store)\b/i, weight: 2 },
    ],
    minScore: 3,
  },
  
  builds: {
    keywords: [
      { pattern: /\b(mod|mods|modify|modification|modifying)\b/i, weight: 4 },
      { pattern: /\b(upgrade|upgrades?|upgrading)\b/i, weight: 3 },
      { pattern: /\b(tune|tuned|tuning|flash|remap)\b/i, weight: 4 },
      { pattern: /\b(stage [123]|stage1|stage2|stage3)\b/i, weight: 5 },
      { pattern: /\b(add|adding|gain|gains?) (power|hp|horsepower)\b/i, weight: 4 },
      { pattern: /\b(intake|exhaust|downpipe|catback|headers?)\b/i, weight: 3 },
      { pattern: /\b(turbo|supercharger|forced induction|boost)\b/i, weight: 3 },
      { pattern: /\b(coilovers?|lowering|suspension)\b/i, weight: 2 },
      { pattern: /\b(big brake|bbk|brakes?)\b/i, weight: 2 },
      { pattern: /\b(first mod|start modding|where to start)\b/i, weight: 5 },
      { pattern: /\bhow (much|many) (hp|horsepower|power)\b/i, weight: 3 },
      { pattern: /\b(build|building|project)\b/i, weight: 2 },
      { pattern: /\b(bolt-?on|supporting mods?)\b/i, weight: 4 },
      { pattern: /\b(e85|flex fuel|ethanol)\b/i, weight: 3 },
    ],
    minScore: 3,
  },
  
  comparison: {
    keywords: [
      { pattern: /\bcompare\b/i, weight: 5 },
      { pattern: /\bvs\.?\b/i, weight: 4 },
      { pattern: /\bversus\b/i, weight: 5 },
      { pattern: /\bor\b/i, weight: 1 },
      { pattern: /\bbetter\b/i, weight: 2 },
      { pattern: /\b(difference|differences?) between\b/i, weight: 5 },
      { pattern: /\bwhich (one|is|should)\b/i, weight: 3 },
      { pattern: /\b(faster|quicker|slower)\b/i, weight: 2 },
      { pattern: /\b(prefer|preference)\b/i, weight: 2 },
    ],
    minScore: 4,
  },
  
  pricing: {
    keywords: [
      { pattern: /\b(price|pricing|cost|costs?|expensive)\b/i, weight: 4 },
      { pattern: /\b(msrp|sticker price|dealer)\b/i, weight: 4 },
      { pattern: /\b(value|worth|depreciation)\b/i, weight: 3 },
      { pattern: /\b(budget|afford|cheap)\b/i, weight: 3 },
      { pattern: /\b(market|resale)\b/i, weight: 3 },
      { pattern: /\bhow much (does|do|is|will)\b/i, weight: 2 },
      { pattern: /\bunder \$?\d/i, weight: 4 },
    ],
    minScore: 3,
  },
  
  general: {
    keywords: [
      { pattern: /\bwhat (is|are|does)\b/i, weight: 1 },
      { pattern: /\bhow (do|does|to)\b/i, weight: 1 },
      { pattern: /\bwhy\b/i, weight: 1 },
      { pattern: /\bshould i\b/i, weight: 1 },
      { pattern: /\b(best|recommend|recommendation)\b/i, weight: 2 },
      { pattern: /\b(explain|tell me about|what's the deal)\b/i, weight: 2 },
    ],
    minScore: 1,
  },
};

// =============================================================================
// CLASSIFICATION FUNCTIONS
// =============================================================================

/**
 * Calculate intent score for a query
 * @param {string} query - User query
 * @param {Object} intentPatterns - Patterns for the intent
 * @returns {number} Score
 */
function calculateIntentScore(query, intentPatterns) {
  let score = 0;
  
  for (const { pattern, weight } of intentPatterns.keywords) {
    if (pattern.test(query)) {
      score += weight;
    }
  }
  
  return score;
}

/**
 * Classify a query into intents with confidence scores
 * 
 * @param {string} query - User's query
 * @returns {{
 *   primaryIntent: Intent,
 *   confidence: number,
 *   allIntents: Array<{intent: Intent, score: number, confidence: number}>,
 *   suggestedTools: string[],
 *   needsCarContext: boolean
 * }}
 */
export function classifyQueryIntent(query) {
  if (!query || typeof query !== 'string') {
    return {
      primaryIntent: 'general',
      confidence: 0,
      allIntents: [],
      suggestedTools: INTENT_CONFIG.general.suggestedTools,
      needsCarContext: false,
    };
  }
  
  const normalizedQuery = query.toLowerCase().trim();
  
  // Calculate scores for each intent
  const scores = [];
  let maxScore = 0;
  
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    const score = calculateIntentScore(normalizedQuery, patterns);
    if (score >= patterns.minScore) {
      scores.push({ intent, score });
      maxScore = Math.max(maxScore, score);
    }
  }
  
  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);
  
  // Calculate confidence (normalized)
  const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
  const allIntents = scores.map(({ intent, score }) => ({
    intent,
    score,
    confidence: totalScore > 0 ? score / totalScore : 0,
  }));
  
  // Get primary intent
  const primaryIntent = allIntents.length > 0 ? allIntents[0].intent : 'general';
  const confidence = allIntents.length > 0 ? allIntents[0].confidence : 0.5;
  
  // Check if query mentions a specific car
  const needsCarContext = /\b(my|the|a|an)\s+\w+\s+(car|vehicle|bmw|audi|porsche|mercedes|toyota|honda|ford|chevy|nissan|subaru|mazda|volkswagen|vw|lexus|infiniti|acura|mitsubishi)\b/i.test(query);
  
  // Get suggested tools based on primary and secondary intents
  const suggestedTools = [];
  const seenTools = new Set();
  
  // Add primary intent tools
  const primaryConfig = INTENT_CONFIG[primaryIntent];
  for (const tool of primaryConfig?.suggestedTools || []) {
    if (!seenTools.has(tool)) {
      suggestedTools.push(tool);
      seenTools.add(tool);
    }
  }
  
  // Add secondary intent tools if confidence is close
  if (allIntents.length > 1 && allIntents[1].confidence > 0.25) {
    const secondaryConfig = INTENT_CONFIG[allIntents[1].intent];
    for (const tool of secondaryConfig?.suggestedTools || []) {
      if (!seenTools.has(tool) && suggestedTools.length < 5) {
        suggestedTools.push(tool);
        seenTools.add(tool);
      }
    }
  }
  
  return {
    primaryIntent,
    confidence,
    allIntents,
    suggestedTools,
    needsCarContext,
  };
}

/**
 * Get the best tools to use for a query
 * 
 * @param {string} query - User's query
 * @param {Object} [context] - Additional context
 * @param {string} [context.carSlug] - Current car context
 * @param {string[]} [context.availableTools] - Available tools
 * @returns {{tools: string[], intent: Intent, confidence: number}}
 */
export function getRecommendedTools(query, context = {}) {
  const classification = classifyQueryIntent(query);
  
  let tools = [...classification.suggestedTools];
  
  // If we have car context, prioritize car-specific tools
  if (context.carSlug) {
    if (classification.primaryIntent === 'troubleshooting') {
      tools = ['getKnownIssues', 'searchKnowledge', ...tools.filter(t => !['getKnownIssues', 'searchKnowledge'].includes(t))];
    } else if (classification.primaryIntent === 'maintenance') {
      tools = ['getMaintenanceSchedule', 'searchKnowledge', ...tools.filter(t => !['getMaintenanceSchedule', 'searchKnowledge'].includes(t))];
    } else if (classification.primaryIntent === 'specs') {
      tools = ['getCarSpecs', ...tools.filter(t => t !== 'getCarSpecs')];
    }
  }
  
  // Filter by available tools if provided
  if (context.availableTools && context.availableTools.length > 0) {
    tools = tools.filter(t => context.availableTools.includes(t));
  }
  
  // Limit to top 3 tools
  tools = tools.slice(0, 3);
  
  return {
    tools,
    intent: classification.primaryIntent,
    confidence: classification.confidence,
  };
}

/**
 * Check if a query is asking for a comparison
 * @param {string} query
 * @returns {boolean}
 */
export function isComparisonQuery(query) {
  const classification = classifyQueryIntent(query);
  return classification.primaryIntent === 'comparison' && classification.confidence > 0.3;
}

/**
 * Extract car mentions from a query
 * @param {string} query
 * @returns {string[]} Array of possible car references
 */
export function extractCarMentions(query) {
  const carPatterns = [
    // Make + Model patterns
    /\b(bmw|mercedes|porsche|audi|volkswagen|vw|toyota|honda|nissan|subaru|ford|chevy|chevrolet|mazda|lexus|infiniti|acura|mitsubishi|hyundai|kia)\s+[\w\d\-]+/gi,
    // Model names
    /\b(m3|m4|m5|911|cayman|boxster|rs[356]|gtr?|evo|sti|wrx|mustang|corvette|camaro|miata|mx-?5|supra|civic type r|golf r|focus rs|civic si)\b/gi,
    // Chassis codes
    /\b(e36|e46|e90|e92|f80|f82|g80|g82|997|991|992|r35|fk8|gr86|zn6)\b/gi,
  ];
  
  const mentions = new Set();
  
  for (const pattern of carPatterns) {
    const matches = query.match(pattern);
    if (matches) {
      matches.forEach(m => mentions.add(m.trim().toLowerCase()));
    }
  }
  
  return Array.from(mentions);
}

const alIntentClassifier = {
  classifyQueryIntent,
  getRecommendedTools,
  isComparisonQuery,
  extractCarMentions,
  INTENT_CONFIG,
};

export default alIntentClassifier;
