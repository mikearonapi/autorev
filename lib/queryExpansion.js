/**
 * Query Expansion Utility
 * 
 * Expands search queries with synonyms and related terms to improve recall.
 * Uses a domain-specific automotive synonym dictionary.
 */

// Automotive domain synonyms (bi-directional)
const SYNONYM_MAP = {
  // Performance terms
  'hp': ['horsepower', 'bhp', 'whp', 'power'],
  'horsepower': ['hp', 'bhp', 'whp', 'power'],
  'torque': ['tq', 'lb-ft', 'pound-feet', 'nm'],
  'boost': ['psi', 'bar', 'pressure'],
  
  // Parts & components
  'turbo': ['turbocharger', 'forced induction', 'snail'],
  'supercharger': ['blower', 'supercharged', 'sc'],
  'exhaust': ['cat-back', 'catback', 'headers', 'downpipe', 'dp'],
  'intake': ['cai', 'cold air intake', 'air filter'],
  'intercooler': ['fmic', 'tmic', 'ic'],
  'ecu': ['computer', 'tune', 'flash', 'piggyback', 'standalone'],
  'suspension': ['coilovers', 'springs', 'shocks', 'struts', 'lowering'],
  'brakes': ['brake kit', 'bbk', 'rotors', 'pads', 'calipers'],
  'wheels': ['rims', 'alloys'],
  'tires': ['tyres', 'rubber'],
  
  // Tuning terms
  'tune': ['flash', 'remap', 'chip', 'calibration'],
  'stage 1': ['bolt-on', 'stage1', 'basic mods'],
  'stage 2': ['stage2', 'downpipe', 'fbo'],
  'stage 3': ['stage3', 'big turbo', 'built'],
  'fbo': ['full bolt-on', 'full bolt ons', 'bolt-ons'],
  
  // Transmission
  'manual': ['stick shift', 'mt', '6mt', '5mt', 'stick'],
  'automatic': ['auto', 'at', 'dct', 'dsg', 'pdk'],
  'dct': ['dual clutch', 'dsg', 'pdk', 's-tronic'],
  
  // Drivetrain
  'awd': ['all wheel drive', '4wd', 'quattro', 'xdrive', 'symmetrical'],
  'rwd': ['rear wheel drive', 'fr'],
  'fwd': ['front wheel drive', 'ff'],
  
  // Common issues
  'oil consumption': ['burning oil', 'oil burn', 'oil usage'],
  'carbon buildup': ['carbon deposits', 'walnut blast', 'intake cleaning'],
  'timing chain': ['chain tensioner', 'chain guide'],
  'rod bearing': ['bearing failure', 'spun bearing'],
  
  // Vehicle types
  'sports car': ['sportscar', 'coupe', 'performance car'],
  'sedan': ['saloon', '4-door'],
  'hatchback': ['hatch', 'hot hatch'],
  
  // Brands/models (common abbreviations)
  'bmw': ['bimmer', 'bavarian'],
  'mercedes': ['merc', 'benz', 'mb'],
  'volkswagen': ['vw', 'vdub'],
  'porsche': ['p-car'],
  'subaru': ['subie', 'scooby'],
  'mitsubishi': ['mitsu', 'evo'],
  'nissan': ['z', 'gtr'],
  
  // Performance metrics
  '0-60': ['zero to sixty', '0-100', 'acceleration'],
  'quarter mile': ['1/4 mile', 'drag', 'trap speed'],
  'lap time': ['track time', 'ring time', 'nurburgring'],
};

// Build reverse lookup for efficiency
const REVERSE_MAP = {};
for (const [key, synonyms] of Object.entries(SYNONYM_MAP)) {
  for (const syn of synonyms) {
    if (!REVERSE_MAP[syn.toLowerCase()]) {
      REVERSE_MAP[syn.toLowerCase()] = [];
    }
    REVERSE_MAP[syn.toLowerCase()].push(key);
  }
}

/**
 * Find synonyms for a term
 * @param {string} term - Single word or phrase
 * @returns {string[]} - Array of synonyms (may be empty)
 */
export function getSynonyms(term) {
  const normalized = term.toLowerCase().trim();
  
  // Direct match
  if (SYNONYM_MAP[normalized]) {
    return [...SYNONYM_MAP[normalized]];
  }
  
  // Reverse match
  if (REVERSE_MAP[normalized]) {
    const result = new Set();
    for (const key of REVERSE_MAP[normalized]) {
      result.add(key);
      SYNONYM_MAP[key]?.forEach(s => result.add(s));
    }
    result.delete(normalized);
    return [...result];
  }
  
  return [];
}

/**
 * Expand a query with synonyms
 * @param {string} query - Original search query
 * @param {Object} options - Expansion options
 * @returns {Object} - { expanded: string, terms: string[], additions: string[] }
 */
export function expandQuery(query, options = {}) {
  const { maxExpansions = 3, includeOriginal = true } = options;
  
  const words = query.toLowerCase().split(/\s+/);
  const additions = new Set();
  
  // Try to match multi-word phrases first
  const phrases = [
    query.toLowerCase(),
    ...words.slice(0, -1).map((_, i) => words.slice(i, i + 2).join(' ')),
    ...words.slice(0, -2).map((_, i) => words.slice(i, i + 3).join(' ')),
  ].filter(Boolean);
  
  for (const phrase of phrases) {
    const synonyms = getSynonyms(phrase);
    synonyms.slice(0, maxExpansions).forEach(s => additions.add(s));
  }
  
  // Then try individual words
  for (const word of words) {
    if (word.length < 2) continue;
    const synonyms = getSynonyms(word);
    synonyms.slice(0, maxExpansions).forEach(s => additions.add(s));
  }
  
  // Build expanded query
  const additionsArray = [...additions].slice(0, maxExpansions * 2);
  const expanded = includeOriginal
    ? [query, ...additionsArray].join(' OR ')
    : additionsArray.join(' OR ');
  
  return {
    original: query,
    expanded,
    terms: [...words, ...additionsArray],
    additions: additionsArray,
  };
}

/**
 * Generate multiple query variants for parallel search
 * @param {string} query - Original query
 * @returns {string[]} - Array of query variants
 */
export function generateQueryVariants(query) {
  const { additions } = expandQuery(query, { maxExpansions: 5 });
  
  const variants = [query];
  
  // Add variants with key synonyms swapped in
  for (const addition of additions.slice(0, 3)) {
    variants.push(`${query} ${addition}`);
  }
  
  return [...new Set(variants)];
}

/**
 * Expand query for PostgreSQL tsquery format
 * @param {string} query - Original query
 * @returns {string} - tsquery-compatible string
 */
export function expandForTsQuery(query) {
  const { terms } = expandQuery(query, { maxExpansions: 2 });
  
  // Format for tsquery: term1 | term2 | term3
  return terms
    .filter(t => t.length > 1)
    .map(t => t.replace(/[^a-z0-9]/gi, ''))
    .filter(Boolean)
    .join(' | ');
}

export default {
  getSynonyms,
  expandQuery,
  generateQueryVariants,
  expandForTsQuery,
  SYNONYM_MAP,
};
