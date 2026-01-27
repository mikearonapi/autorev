/**
 * AL Evaluation Framework - Golden Dataset
 *
 * Test cases for evaluating AL response quality.
 * Each test case defines:
 * - Input prompt and car context
 * - Expected elements that should appear
 * - Forbidden elements that should NOT appear
 * - Required tool calls
 * - Quality criteria for LLM judge
 *
 * Categories:
 * - buying: Purchase advice, comparisons, recommendations
 * - reliability: Known issues, maintenance, ownership costs
 * - upgrades: Modifications, tuning, performance parts
 * - performance: Lap times, dyno data, 0-60 times
 * - maintenance: Service intervals, DIY guides, costs
 * - comparison: Head-to-head vehicle comparisons
 * - general: General questions, first car advice
 */

/**
 * Evaluation Test Cases - Golden Dataset
 *
 * Structure:
 * - id: Unique identifier
 * - category: buying | reliability | upgrades | performance | maintenance | comparison | general
 * - prompt: The user question to test
 * - carContext: Optional car slug for context
 * - expectedElements: Array of topics/elements that SHOULD appear in response
 * - forbiddenElements: Array of elements that SHOULD NOT appear
 * - minToolCalls: Required tool calls (minimum)
 * - maxToolCalls: Maximum tool calls (to catch infinite loops)
 * - judgePrompt: Optional custom prompt for LLM judge
 * - difficulty: easy | medium | hard (for prioritization)
 */
export const EVAL_CASES = [
  // ============================================
  // BUYING ADVICE (15 cases)
  // ============================================
  {
    id: 'buying-981-vs-718',
    category: 'buying',
    prompt: 'Should I buy a 981 Cayman S or 718 Cayman?',
    carContext: null,
    expectedElements: ['engine difference', 'flat-4 vs flat-6', 'sound', 'price', 'reliability'],
    forbiddenElements: ["I don't have information", 'fabricated specs'],
    minToolCalls: ['get_car_ai_context'],
    difficulty: 'medium',
  },
  {
    id: 'buying-first-porsche',
    category: 'buying',
    prompt: "What's the best first Porsche to buy for under $60k?",
    carContext: null,
    expectedElements: ['Cayman', 'Boxster', '911', 'budget', 'maintenance'],
    forbiddenElements: ["I'm not sure"],
    minToolCalls: [],
    difficulty: 'easy',
  },
  {
    id: 'buying-997-year-avoid',
    category: 'buying',
    prompt: 'Which 997 years should I avoid?',
    carContext: '997-carrera',
    expectedElements: ['IMS', 'bore scoring', '2005', '2006', '2009'],
    forbiddenElements: ['all years are good'],
    minToolCalls: ['get_car_ai_context'],
    difficulty: 'medium',
  },
  {
    id: 'buying-m3-vs-c63',
    category: 'buying',
    prompt: 'BMW M3 E92 vs Mercedes C63 AMG - which is more reliable?',
    carContext: null,
    expectedElements: ['rod bearing', 'head bolts', 'V8', 'maintenance cost'],
    forbiddenElements: [],
    minToolCalls: ['get_car_ai_context'],
    difficulty: 'hard',
  },
  {
    id: 'buying-gt4-worth-premium',
    category: 'buying',
    prompt: 'Is the Cayman GT4 worth the premium over the GTS 4.0?',
    carContext: '718-cayman-gt4',
    expectedElements: [
      'naturally aspirated',
      'track',
      'suspension',
      'price difference',
      'collectability',
    ],
    forbiddenElements: [],
    minToolCalls: ['get_car_ai_context'],
    difficulty: 'medium',
  },
  {
    id: 'buying-daily-driver',
    category: 'buying',
    prompt: 'Can I daily drive a 991.2 GT3?',
    carContext: '991-gt3',
    expectedElements: ['stiff', 'noise', 'clearance', 'practicality', 'fuel'],
    forbiddenElements: ['definitely not'],
    minToolCalls: ['get_car_ai_context'],
    difficulty: 'easy',
  },
  {
    id: 'buying-high-mileage-porsche',
    category: 'buying',
    prompt: 'Is it okay to buy a Porsche with 100k miles?',
    carContext: null,
    expectedElements: [
      'maintenance history',
      'service records',
      'inspection',
      'IMS',
      'bore scoring',
    ],
    forbiddenElements: ["don't buy", 'never buy'],
    minToolCalls: [],
    difficulty: 'easy',
  },
  {
    id: 'buying-manual-vs-pdk',
    category: 'buying',
    prompt: 'Should I get a manual or PDK for my 991?',
    carContext: '991-carrera',
    expectedElements: ['resale value', 'track', 'engagement', 'speed', 'preference'],
    forbiddenElements: [],
    minToolCalls: [],
    difficulty: 'easy',
  },
  {
    id: 'buying-evo-x-vs-sti',
    category: 'buying',
    prompt: 'Evo X or STI for a daily/occasional track car?',
    carContext: null,
    expectedElements: ['handling', 'reliability', 'modification potential', 'AWD'],
    forbiddenElements: [],
    minToolCalls: ['get_car_ai_context'],
    difficulty: 'medium',
  },
  {
    id: 'buying-budget-track-car',
    category: 'buying',
    prompt: 'Best track car for $30k?',
    carContext: null,
    expectedElements: ['Miata', 'BRZ', '86', 'Cayman', 'Corvette'],
    forbiddenElements: [],
    minToolCalls: [],
    difficulty: 'easy',
  },
  {
    id: 'buying-ppi-checklist',
    category: 'buying',
    prompt: 'What should I look for in a PPI for a 996 Turbo?',
    carContext: '996-turbo',
    expectedElements: [
      'turbo',
      'coolant pipes',
      'IMS',
      'bore scoring',
      'clutch',
      'service history',
    ],
    forbiddenElements: [],
    minToolCalls: ['get_car_ai_context'],
    difficulty: 'hard',
  },
  {
    id: 'buying-depreciation',
    category: 'buying',
    prompt: 'Which Porsches hold their value best?',
    carContext: null,
    expectedElements: ['GT3', 'GT4', 'manual', 'limited production', 'collectability'],
    forbiddenElements: [],
    minToolCalls: [],
    difficulty: 'easy',
  },
  {
    id: 'buying-cpo-worth-it',
    category: 'buying',
    prompt: 'Is Porsche CPO worth the extra money?',
    carContext: null,
    expectedElements: ['warranty', 'inspection', 'peace of mind', 'cost'],
    forbiddenElements: [],
    minToolCalls: [],
    difficulty: 'easy',
  },
  {
    id: 'buying-salvage-title',
    category: 'buying',
    prompt: 'Should I buy a salvage title 911?',
    carContext: '991-carrera',
    expectedElements: ['insurance', 'resale', 'inspection', 'risk', 'price discount'],
    forbiddenElements: ['definitely yes'],
    minToolCalls: [],
    difficulty: 'medium',
  },
  {
    id: 'buying-color-resale',
    category: 'buying',
    prompt: 'What colors have best resale on a GT3?',
    carContext: '991-gt3',
    expectedElements: ['white', 'black', 'silver', 'PTS', 'Guards Red'],
    forbiddenElements: [],
    minToolCalls: [],
    difficulty: 'easy',
  },

  // ============================================
  // RELIABILITY (10 cases)
  // ============================================
  {
    id: 'reliability-996-ims',
    category: 'reliability',
    prompt: "What's the deal with IMS bearing failure on 996?",
    carContext: '996-carrera',
    expectedElements: [
      'IMS bearing',
      'failure rate',
      'replacement',
      'LN Engineering',
      'years affected',
    ],
    forbiddenElements: ['no issues', 'nothing to worry about'],
    minToolCalls: ['get_car_ai_context'],
    difficulty: 'medium',
  },
  {
    id: 'reliability-991-common-issues',
    category: 'reliability',
    prompt: 'What are the common issues with 991.1 Carrera?',
    carContext: '991-carrera',
    expectedElements: ['coolant pipes', 'valve cover', 'PDCC'],
    forbiddenElements: ['no known issues'],
    minToolCalls: ['get_car_ai_context'],
    difficulty: 'easy',
  },
  {
    id: 'reliability-bore-scoring',
    category: 'reliability',
    prompt: 'Tell me about bore scoring on M96/M97 engines',
    carContext: null,
    expectedElements: ['cylinder', 'scoring', 'coolant', 'overheating', 'rebuild'],
    forbiddenElements: [],
    minToolCalls: ['get_car_ai_context'],
    difficulty: 'hard',
  },
  {
    id: 'reliability-pdk-longevity',
    category: 'reliability',
    prompt: 'How long does PDK transmission last?',
    carContext: '991-carrera',
    expectedElements: ['miles', 'fluid changes', 'service', 'reliable'],
    forbiddenElements: ['will fail soon'],
    minToolCalls: [],
    difficulty: 'easy',
  },
  {
    id: 'reliability-gt3-engine',
    category: 'reliability',
    prompt: 'Is the 991.2 GT3 engine reliable?',
    carContext: '991-gt3',
    expectedElements: ['track use', 'oil consumption', 'Mezger', '9A1'],
    forbiddenElements: [],
    minToolCalls: ['get_car_ai_context'],
    difficulty: 'medium',
  },
  {
    id: 'reliability-e92-m3-issues',
    category: 'reliability',
    prompt: 'What are the main reliability concerns with the E92 M3?',
    carContext: 'e92-m3',
    expectedElements: ['rod bearing', 'throttle actuator', 'VANOS', 'SMG pump'],
    forbiddenElements: [],
    minToolCalls: ['get_car_ai_context'],
    difficulty: 'medium',
  },
  {
    id: 'reliability-c63-head-bolts',
    category: 'reliability',
    prompt: 'Do all C63 AMGs have the head bolt issue?',
    carContext: 'c63-amg',
    expectedElements: ['head bolt', 'stretch', 'M156', 'years', 'preventive'],
    forbiddenElements: [],
    minToolCalls: ['get_car_ai_context'],
    difficulty: 'hard',
  },
  {
    id: 'reliability-cayman-intermediate-shaft',
    category: 'reliability',
    prompt: 'Does the Cayman have IMS issues like the 911?',
    carContext: '987-cayman',
    expectedElements: ['IMS', 'shared engine', 'M96', '2006-2008'],
    forbiddenElements: ['no IMS issues'],
    minToolCalls: ['get_car_ai_context'],
    difficulty: 'medium',
  },
  {
    id: 'reliability-annual-cost',
    category: 'reliability',
    prompt: 'What should I budget annually for 997.2 maintenance?',
    carContext: '997-carrera',
    expectedElements: ['oil change', 'brakes', 'tires', 'annual', 'budget'],
    forbiddenElements: [],
    minToolCalls: ['get_car_ai_context'],
    difficulty: 'easy',
  },
  {
    id: 'reliability-timing-chain',
    category: 'reliability',
    prompt: 'When does the 991 need timing chain replacement?',
    carContext: '991-carrera',
    expectedElements: ['timing chain', 'tensioner', 'miles', 'inspection'],
    forbiddenElements: ['100,000 miles'],
    minToolCalls: ['get_car_ai_context'],
    difficulty: 'medium',
  },

  // ============================================
  // UPGRADES (10 cases)
  // ============================================
  {
    id: 'upgrades-stage-1-991',
    category: 'upgrades',
    prompt: 'What mods can I do to my 991 Carrera S without voiding warranty?',
    carContext: '991-carrera-s',
    expectedElements: ['intake', 'exhaust', 'warranty', 'flash'],
    forbiddenElements: ['all mods void warranty'],
    minToolCalls: ['get_car_ai_context'],
    difficulty: 'medium',
  },
  {
    id: 'upgrades-turbo-upgrade-path',
    category: 'upgrades',
    prompt: "What's a good turbo upgrade path for a 996 Turbo?",
    carContext: '996-turbo',
    expectedElements: ['K24', 'hybrid turbo', 'intake', 'exhaust', 'tune', 'fueling'],
    forbiddenElements: [],
    minToolCalls: ['get_car_ai_context'],
    difficulty: 'hard',
  },
  {
    id: 'upgrades-suspension-track',
    category: 'upgrades',
    prompt: 'Best suspension setup for track days on my GT4?',
    carContext: '718-cayman-gt4',
    expectedElements: ['coilovers', 'alignment', 'sway bars', 'spring rates'],
    forbiddenElements: [],
    minToolCalls: ['get_car_ai_context', 'search_parts'],
    difficulty: 'medium',
  },
  {
    id: 'upgrades-exhaust-sound',
    category: 'upgrades',
    prompt: 'What exhaust will make my 718 Cayman sound better?',
    carContext: '718-cayman',
    expectedElements: ['Akrapovic', 'Soul', 'FabSpeed', 'sound', 'drone'],
    forbiddenElements: [],
    minToolCalls: ['search_parts'],
    difficulty: 'easy',
  },
  {
    id: 'upgrades-brakes-track',
    category: 'upgrades',
    prompt: 'Do I need bigger brakes for track use on my 991 Carrera?',
    carContext: '991-carrera',
    expectedElements: ['pads', 'fluid', 'rotors', 'BBK', 'cooling'],
    forbiddenElements: [],
    minToolCalls: ['get_car_ai_context'],
    difficulty: 'medium',
  },
  {
    id: 'upgrades-horsepower-target',
    category: 'upgrades',
    prompt: 'How can I get 500hp from my 997 Turbo?',
    carContext: '997-turbo',
    expectedElements: ['tune', 'exhaust', 'intake', 'turbo', 'intercooler'],
    forbiddenElements: [],
    minToolCalls: ['get_car_ai_context'],
    difficulty: 'medium',
  },
  {
    id: 'upgrades-wheel-fitment',
    category: 'upgrades',
    prompt: 'What wheel specs fit a 991 without rubbing?',
    carContext: '991-carrera',
    expectedElements: ['front', 'rear', 'offset', 'width', 'staggered'],
    forbiddenElements: [],
    minToolCalls: ['get_car_ai_context'],
    difficulty: 'medium',
  },
  {
    id: 'upgrades-intake', // intake-manifold removed
    category: 'upgrades',
    prompt: 'Is an IPD intake plenum worth it on a 997?',
    carContext: '997-carrera-s',
    expectedElements: ['IPD', 'plenum', 'throttle response', 'horsepower', 'tuning'],
    forbiddenElements: [],
    minToolCalls: ['search_parts'],
    difficulty: 'hard',
  },
  {
    id: 'upgrades-must-have-mods',
    category: 'upgrades',
    prompt: 'What are the must-have mods for a track Miata?',
    carContext: 'nd-miata',
    expectedElements: ['roll bar', 'suspension', 'brakes', 'tires', 'seat'],
    forbiddenElements: [],
    minToolCalls: ['get_car_ai_context'],
    difficulty: 'easy',
  },
  {
    id: 'upgrades-reliability-mods',
    category: 'upgrades',
    prompt: 'What mods improve reliability on a 996?',
    carContext: '996-carrera',
    expectedElements: ['IMS', 'AOS', 'coolant', 'RMS'],
    forbiddenElements: [],
    minToolCalls: ['get_car_ai_context'],
    difficulty: 'medium',
  },

  // ============================================
  // PERFORMANCE (8 cases)
  // ============================================
  {
    id: 'performance-0-60-gt3',
    category: 'performance',
    prompt: "What's the 0-60 time for a 991.2 GT3?",
    carContext: '991-gt3',
    expectedElements: ['0-60', 'seconds', 'manual', 'PDK'],
    forbiddenElements: ['10 seconds', '2 seconds'],
    minToolCalls: ['get_car_ai_context'],
    difficulty: 'easy',
  },
  {
    id: 'performance-nurburgring-time',
    category: 'performance',
    prompt: "What's the Nürburgring lap time for the GT4?",
    carContext: '718-cayman-gt4',
    expectedElements: ['Nürburgring', 'lap time', 'minutes'],
    forbiddenElements: ['under 6 minutes'],
    minToolCalls: ['get_track_lap_times'],
    difficulty: 'medium',
  },
  {
    id: 'performance-dyno-numbers',
    category: 'performance',
    prompt: 'What should a stock 997.2 Carrera S dyno at?',
    carContext: '997-carrera-s',
    expectedElements: ['wheel horsepower', 'dyno', 'torque', 'drivetrain loss'],
    forbiddenElements: [],
    minToolCalls: ['get_dyno_runs'],
    difficulty: 'medium',
  },
  {
    id: 'performance-track-comparison',
    category: 'performance',
    prompt: 'How does the GT4 compare to the GT3 on track?',
    carContext: null,
    expectedElements: ['lap time', 'power', 'weight', 'handling'],
    forbiddenElements: [],
    minToolCalls: ['get_track_lap_times'],
    difficulty: 'hard',
  },
  {
    id: 'performance-quarter-mile',
    category: 'performance',
    prompt: "What's the quarter mile time for a 991 Turbo S?",
    carContext: '991-turbo-s',
    expectedElements: ['quarter mile', 'trap speed', 'seconds'],
    forbiddenElements: [],
    minToolCalls: ['get_car_ai_context'],
    difficulty: 'easy',
  },
  {
    id: 'performance-top-speed',
    category: 'performance',
    prompt: "What's the top speed of a GT2 RS?",
    carContext: '991-gt2-rs',
    expectedElements: ['top speed', 'mph', 'km/h'],
    forbiddenElements: ['300 mph'],
    minToolCalls: ['get_car_ai_context'],
    difficulty: 'easy',
  },
  {
    id: 'performance-power-to-weight',
    category: 'performance',
    prompt: "What's the power to weight ratio of a 992 GT3?",
    carContext: '992-gt3',
    expectedElements: ['weight', 'horsepower', 'ratio', 'lb/hp'],
    forbiddenElements: [],
    minToolCalls: ['get_car_ai_context'],
    difficulty: 'medium',
  },
  {
    id: 'performance-real-world-gains',
    category: 'performance',
    prompt: 'How much faster will a tune make my 991.2 Turbo S?',
    carContext: '991-turbo-s',
    expectedElements: ['horsepower gain', 'dyno', '0-60 improvement'],
    forbiddenElements: [],
    minToolCalls: ['get_dyno_runs'],
    difficulty: 'hard',
  },

  // ============================================
  // MAINTENANCE (8 cases)
  // ============================================
  {
    id: 'maintenance-oil-change',
    category: 'maintenance',
    prompt: 'What oil and how often for a 991 Carrera?',
    carContext: '991-carrera',
    expectedElements: ['oil type', 'viscosity', 'interval', 'miles', 'months'],
    forbiddenElements: ['15,000 miles', 'any oil'],
    minToolCalls: ['get_maintenance_schedule'],
    difficulty: 'easy',
  },
  {
    id: 'maintenance-spark-plugs',
    category: 'maintenance',
    prompt: 'When should I change spark plugs on my GT3?',
    carContext: '991-gt3',
    expectedElements: ['interval', 'miles', 'track use', 'NGK'],
    forbiddenElements: [],
    minToolCalls: ['get_maintenance_schedule'],
    difficulty: 'easy',
  },
  {
    id: 'maintenance-brake-fluid',
    category: 'maintenance',
    prompt: 'How often should I change brake fluid on my track car?',
    carContext: '718-cayman-gt4',
    expectedElements: ['annually', 'track use', 'DOT 4', 'boiling point'],
    forbiddenElements: [],
    minToolCalls: ['get_maintenance_schedule'],
    difficulty: 'easy',
  },
  {
    id: 'maintenance-major-service',
    category: 'maintenance',
    prompt: "What's included in a major service on a 997?",
    carContext: '997-carrera',
    expectedElements: ['oil', 'filters', 'spark plugs', 'inspection', 'cost'],
    forbiddenElements: [],
    minToolCalls: ['get_maintenance_schedule'],
    difficulty: 'medium',
  },
  {
    id: 'maintenance-coolant-flush',
    category: 'maintenance',
    prompt: 'When does coolant need to be changed on a Porsche?',
    carContext: '991-carrera',
    expectedElements: ['years', 'miles', 'coolant type', 'G40'],
    forbiddenElements: [],
    minToolCalls: ['get_maintenance_schedule'],
    difficulty: 'easy',
  },
  {
    id: 'maintenance-pdk-fluid',
    category: 'maintenance',
    prompt: 'When does PDK fluid need to be changed?',
    carContext: '991-carrera',
    expectedElements: ['interval', 'miles', 'years', 'dealer'],
    forbiddenElements: ['lifetime fluid', 'never'],
    minToolCalls: ['get_maintenance_schedule'],
    difficulty: 'easy',
  },
  {
    id: 'maintenance-air-filter',
    category: 'maintenance',
    prompt: 'How often to change air filter on a 996?',
    carContext: '996-carrera',
    expectedElements: ['interval', 'miles', 'inspection'],
    forbiddenElements: [],
    minToolCalls: ['get_maintenance_schedule'],
    difficulty: 'easy',
  },
  {
    id: 'maintenance-timing-belt',
    category: 'maintenance',
    prompt: 'Does the 991 have a timing belt that needs replacing?',
    carContext: '991-carrera',
    expectedElements: ['timing chain', 'not belt', 'no replacement'],
    forbiddenElements: ['timing belt replacement', '60,000 miles'],
    minToolCalls: ['get_car_ai_context'],
    difficulty: 'easy',
  },

  // ============================================
  // COMPARISON (5 cases)
  // ============================================
  {
    id: 'comparison-gt4-vs-gt3',
    category: 'comparison',
    prompt: 'Compare the GT4 and GT3 - which is better for track days?',
    carContext: null,
    expectedElements: ['engine', 'price', 'lap time', 'handling', 'maintenance'],
    forbiddenElements: [],
    minToolCalls: ['get_car_ai_context', 'get_track_lap_times'],
    difficulty: 'hard',
  },
  {
    id: 'comparison-997-vs-991',
    category: 'comparison',
    prompt: '997.2 vs 991.1 - which is the better buy?',
    carContext: null,
    expectedElements: ['engine', 'price', 'driving feel', 'reliability', 'depreciation'],
    forbiddenElements: [],
    minToolCalls: ['get_car_ai_context'],
    difficulty: 'hard',
  },
  {
    id: 'comparison-boxster-vs-cayman',
    category: 'comparison',
    prompt: 'Boxster vs Cayman - which should I get?',
    carContext: null,
    expectedElements: ['convertible', 'rigidity', 'storage', 'price'],
    forbiddenElements: [],
    minToolCalls: ['get_car_ai_context'],
    difficulty: 'easy',
  },
  {
    id: 'comparison-carrera-s-vs-base',
    category: 'comparison',
    prompt: 'Is the Carrera S worth it over the base Carrera?',
    carContext: '991-carrera',
    expectedElements: ['horsepower', 'price difference', 'PASM', 'brakes'],
    forbiddenElements: [],
    minToolCalls: ['get_car_ai_context'],
    difficulty: 'medium',
  },
  {
    id: 'comparison-turbo-vs-gt3',
    category: 'comparison',
    prompt: '991 Turbo vs GT3 - track car or all-rounder?',
    carContext: null,
    expectedElements: ['turbo lag', 'naturally aspirated', 'AWD', 'comfort', 'lap times'],
    forbiddenElements: [],
    minToolCalls: ['get_car_ai_context', 'get_track_lap_times'],
    difficulty: 'hard',
  },

  // ============================================
  // GENERAL / FIRST CAR (4 cases)
  // ============================================
  {
    id: 'general-first-porsche-new-driver',
    category: 'general',
    prompt: "I'm a new driver, should I get a Porsche as my first car?",
    carContext: null,
    expectedElements: ['experience', 'insurance', 'maintenance cost', 'driving skill'],
    forbiddenElements: ['definitely yes', 'of course'],
    minToolCalls: [],
    difficulty: 'easy',
  },
  {
    id: 'general-learn-manual',
    category: 'general',
    prompt: 'Is a 911 a good car to learn manual on?',
    carContext: null,
    expectedElements: ['clutch', 'expensive', 'practice', 'Miata', 'alternative'],
    forbiddenElements: ['perfect car'],
    minToolCalls: [],
    difficulty: 'easy',
  },
  {
    id: 'general-winter-storage',
    category: 'general',
    prompt: 'How should I store my Porsche for the winter?',
    carContext: '991-carrera',
    expectedElements: ['battery tender', 'fuel stabilizer', 'tires', 'cover', 'moisture'],
    forbiddenElements: [],
    minToolCalls: [],
    difficulty: 'easy',
  },
  {
    id: 'general-insurance-cost',
    category: 'general',
    prompt: 'How much is insurance on a GT3?',
    carContext: '991-gt3',
    expectedElements: ['age', 'location', 'driving record', 'coverage', 'varies'],
    forbiddenElements: ['$100/month', 'exact quote'],
    minToolCalls: [],
    difficulty: 'easy',
  },
];

/**
 * Get all test cases
 */
export function getAllEvalCases() {
  return EVAL_CASES;
}

/**
 * Get test cases by category
 */
export function getEvalCasesByCategory(category) {
  return EVAL_CASES.filter((tc) => tc.category === category);
}

/**
 * Get test cases by difficulty
 */
export function getEvalCasesByDifficulty(difficulty) {
  return EVAL_CASES.filter((tc) => tc.difficulty === difficulty);
}

/**
 * Get a random subset of test cases (for quick spot checks)
 */
export function getRandomEvalCases(count = 10, options = {}) {
  let cases = [...EVAL_CASES];

  // Filter by category if specified
  if (options.category) {
    cases = cases.filter((tc) => tc.category === options.category);
  }

  // Filter by difficulty if specified
  if (options.difficulty) {
    cases = cases.filter((tc) => tc.difficulty === options.difficulty);
  }

  // Shuffle and take first N
  const shuffled = cases.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Get summary stats about the test dataset
 */
export function getEvalDatasetStats() {
  const byCategory = {};
  const byDifficulty = {};

  for (const tc of EVAL_CASES) {
    byCategory[tc.category] = (byCategory[tc.category] || 0) + 1;
    byDifficulty[tc.difficulty] = (byDifficulty[tc.difficulty] || 0) + 1;
  }

  return {
    totalCases: EVAL_CASES.length,
    byCategory,
    byDifficulty,
  };
}

/**
 * LLM Judge prompt template for evaluating AL responses
 */
export const LLM_JUDGE_PROMPT = `You are evaluating an AI assistant's response about cars and car modifications. 

Score the response from 1-10 based on:
1. ACCURACY (3 points): Is the information factually correct?
2. COMPLETENESS (3 points): Does it fully address the user's question?
3. RELEVANCE (2 points): Is it focused on what was asked, without tangents?
4. ACTIONABILITY (2 points): Can the user actually use this advice?

User Question: {question}
Car Context: {car_context}
AI Response: {response}

Expected to see: {expected_elements}
Should NOT see: {forbidden_elements}

Evaluate the response and provide:
1. A score from 1-10
2. Brief reasoning (2-3 sentences)
3. Any issues found

Format your response as JSON:
{
  "score": <number 1-10>,
  "reasoning": "<brief explanation>",
  "issues": ["<issue 1>", "<issue 2>"],
  "passed": <true/false>
}

A response passes if score >= 7 AND no forbidden elements found AND at least 60% of expected elements present.`;

const alEvaluationsModule = {
  EVAL_CASES,
  getAllEvalCases,
  getEvalCasesByCategory,
  getEvalCasesByDifficulty,
  getRandomEvalCases,
  getEvalDatasetStats,
  LLM_JUDGE_PROMPT,
};
export default alEvaluationsModule;
