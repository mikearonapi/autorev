/**
 * Data Consistency Validator
 *
 * Validates that user-facing data is consistent and doesn't contradict itself.
 * Prevents scenarios like recommending ECU tune while platform insights say "tuning impossible".
 *
 * @module lib/dataConsistencyValidator
 */

import { calculateTunability, getTunabilityLabel } from './tunabilityCalculator.js';

// ============================================================================
// TUNING DIFFICULTY KEYWORDS
// Terms that indicate ECU tuning is difficult/impossible for a platform
// ============================================================================
const TUNING_DIFFICULTY_KEYWORDS = [
  'impossible',
  'nearly impossible',
  'not possible',
  'cannot be tuned',
  'no tuning',
  'locked ecu',
  'ecu locked',
  'encrypted ecu',
  'no flash',
  "can't flash",
  'cannot flash',
  'no aftermarket tune',
  'no ecu tune',
  'tuning not available',
  'no tuning options',
  'limited tuning',
  'very limited tuning',
  'extremely limited',
  'no software available',
  'no tuners support',
  'bolt-on only',
  'bolt-ons only',
  'hardware only',
];

// ============================================================================
// PLATFORM-SPECIFIC TUNING LIMITATIONS
// Known platforms with ECU tuning restrictions
// ============================================================================
const TUNING_RESTRICTED_PLATFORMS = {
  // Ferrari - very locked ECUs, mostly bolt-on only
  ferrari: {
    restriction: 'severe',
    reason: 'Ferrari ECUs are heavily encrypted. Most gains come from bolt-on modifications only.',
    minModelYear: 2010, // Older Ferraris are somewhat more tuneable
  },
  // Lamborghini - similar to Ferrari
  lamborghini: {
    restriction: 'severe',
    reason:
      'Lamborghini ECUs have limited tuning support. Focus on exhaust and intake modifications.',
    minModelYear: 2010,
  },
  // McLaren - very limited
  mclaren: {
    restriction: 'severe',
    reason: 'McLaren ECUs have minimal aftermarket tuning support.',
    minModelYear: 2011,
  },
  // Porsche GT cars - some restrictions
  'porsche-gt': {
    restriction: 'moderate',
    reason: 'Porsche GT models have limited ECU tuning options compared to standard 911s.',
    keywords: ['gt3', 'gt4', 'gt2'],
  },
};

// ============================================================================
// VALIDATION RESULT TYPES
// ============================================================================

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether the data passes validation
 * @property {string[]} warnings - Non-blocking warnings
 * @property {string[]} errors - Blocking errors that should prevent display
 * @property {Object} recommendations - Filtered/adjusted recommendations
 */

/**
 * @typedef {Object} RecommendationFilter
 * @property {boolean} allowEcuTune - Whether ECU tune should be recommended
 * @property {boolean} allowStage2Plus - Whether Stage 2+ should be recommended
 * @property {string|null} suppressionReason - Why recommendations were suppressed
 * @property {number} confidenceLevel - 0-100 confidence in recommendations
 */

// ============================================================================
// CORE VALIDATION FUNCTIONS
// ============================================================================

/**
 * Check if platform insights mention tuning difficulty
 * @param {Object} platformInsights - The platform_insights object from tuning profile
 * @returns {{ hasDifficulty: boolean, matchedTerms: string[] }}
 */
export function checkTuningDifficultyInInsights(platformInsights) {
  if (!platformInsights) return { hasDifficulty: false, matchedTerms: [] };

  const matchedTerms = [];

  // Check weaknesses array
  const weaknesses = platformInsights.weaknesses || [];
  const communityTips = platformInsights.community_tips || [];
  const allText = [
    ...weaknesses.map((w) => (typeof w === 'string' ? w : w.title || w.description || '')),
    ...communityTips.map((t) => (typeof t === 'string' ? t : t.text || '')),
  ]
    .join(' ')
    .toLowerCase();

  for (const keyword of TUNING_DIFFICULTY_KEYWORDS) {
    // Use word boundary regex to avoid false positives like "dyno tuning" matching "no tuning"
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'i');
    if (regex.test(allText)) {
      matchedTerms.push(keyword);
    }
  }

  return {
    hasDifficulty: matchedTerms.length > 0,
    matchedTerms,
  };
}

/**
 * Check if car is on a tuning-restricted platform
 * @param {Object} car - Car object with name, brand, etc.
 * @returns {{ isRestricted: boolean, restriction: string|null, reason: string|null }}
 */
export function checkPlatformRestrictions(car) {
  if (!car || !car.name) return { isRestricted: false, restriction: null, reason: null };

  const nameLower = car.name.toLowerCase();
  const brandLower = (car.brand || '').toLowerCase();

  // Check brand-level restrictions
  for (const [platform, config] of Object.entries(TUNING_RESTRICTED_PLATFORMS)) {
    // Check if brand matches
    if (brandLower.includes(platform) || nameLower.includes(platform)) {
      // Check year restriction if applicable
      if (config.minModelYear && car.year) {
        const carYear = parseInt(car.year, 10);
        if (carYear < config.minModelYear) {
          continue; // Older car, might be more tuneable
        }
      }

      // Check keyword restrictions (e.g., GT3, GT4)
      if (config.keywords) {
        const hasKeyword = config.keywords.some((kw) => nameLower.includes(kw.toLowerCase()));
        if (!hasKeyword) continue;
      }

      return {
        isRestricted: config.restriction === 'severe',
        restriction: config.restriction,
        reason: config.reason,
      };
    }
  }

  return { isRestricted: false, restriction: null, reason: null };
}

/**
 * Validate ECU tune recommendation against all data sources
 * @param {Object} params
 * @param {Object} params.car - Car object
 * @param {Object} params.tuningProfile - Tuning profile with platform_insights
 * @param {number} params.tunabilityScore - Calculated tunability score (1-10)
 * @returns {RecommendationFilter}
 */
export function validateEcuTuneRecommendation({ car, tuningProfile, tunabilityScore }) {
  const result = {
    allowEcuTune: true,
    allowStage2Plus: true,
    suppressionReason: null,
    confidenceLevel: 100,
    warnings: [],
  };

  // Rule 1: Check tunability score (threshold: 5)
  if (tunabilityScore !== undefined && tunabilityScore < 5) {
    result.allowEcuTune = false;
    result.suppressionReason = `Limited aftermarket tuning support (tunability: ${tunabilityScore}/10)`;
    result.confidenceLevel = 30;
    result.warnings.push(
      `Low tunability score: ${tunabilityScore}/10 - ${getTunabilityLabel(tunabilityScore)}`
    );
  }

  // Rule 2: Check platform restrictions
  const platformCheck = checkPlatformRestrictions(car);
  if (platformCheck.isRestricted) {
    result.allowEcuTune = false;
    result.suppressionReason = platformCheck.reason;
    result.confidenceLevel = Math.min(result.confidenceLevel, 20);
    result.warnings.push(platformCheck.reason);
  }

  // Rule 3: Check platform insights for tuning difficulty keywords
  if (tuningProfile?.platform_insights) {
    const insightsCheck = checkTuningDifficultyInInsights(tuningProfile.platform_insights);
    if (insightsCheck.hasDifficulty) {
      result.allowEcuTune = false;
      result.suppressionReason = `Platform insights indicate tuning limitations: ${insightsCheck.matchedTerms.join(', ')}`;
      result.confidenceLevel = Math.min(result.confidenceLevel, 25);
      result.warnings.push(`Tuning difficulty detected: ${insightsCheck.matchedTerms.join(', ')}`);
    }
  }

  // Rule 4: Check if tuning platforms exist
  const tuningPlatforms = tuningProfile?.tuning_platforms || [];
  if (tuningPlatforms.length === 0 && result.allowEcuTune) {
    // No tuning platforms listed - reduce confidence but don't block
    result.confidenceLevel = Math.min(result.confidenceLevel, 60);
    result.warnings.push('No specific tuning platforms documented for this vehicle');
  }

  // Rule 5: Check data quality tier
  const dataQuality = tuningProfile?.data_quality_tier;
  if (dataQuality === 'skeleton' || dataQuality === 'minimal') {
    result.confidenceLevel = Math.min(result.confidenceLevel, 40);
    result.warnings.push(`Data quality is ${dataQuality} - recommendations may be generic`);
  }

  return result;
}

/**
 * Validate stage progression against power limits and known issues
 * @param {Object} params
 * @param {Object} params.stageProgressions - Stage data from tuning profile
 * @param {Object} params.powerLimits - Power limits from tuning profile
 * @param {Array} params.knownIssues - Known issues for the car
 * @param {number} params.stockHp - Stock horsepower
 * @returns {{ validStages: string[], warnings: string[] }}
 */
export function validateStageProgressions({
  stageProgressions,
  powerLimits,
  knownIssues,
  stockHp,
}) {
  const validStages = [];
  const warnings = [];

  if (!stageProgressions) {
    return { validStages: [], warnings: ['No stage progression data available'] };
  }

  // Get power limit thresholds
  const stockInternalsLimit = powerLimits?.stockInternals || Infinity;
  const _stockFuelSystemLimit = powerLimits?.stockFuelSystem || Infinity;
  const _stockTransmissionLimit = powerLimits?.stockTransmission || Infinity;

  // Check each stage
  for (const [stageName, stageData] of Object.entries(stageProgressions)) {
    const targetHp = stageData.estimated_whp || stageData.hp || 0;
    const _hpGain = targetHp - (stockHp || 0);

    let stageValid = true;

    // Check against stock internals limit
    if (targetHp > stockInternalsLimit) {
      warnings.push(
        `${stageName} targets ${targetHp}hp which exceeds stock internals limit (${stockInternalsLimit}hp)`
      );
      if (
        stageName.toLowerCase().includes('stage 3') ||
        stageName.toLowerCase().includes('big turbo')
      ) {
        // Stage 3+ can exceed - just warn
      } else {
        stageValid = false;
      }
    }

    // Check against known issues
    if (knownIssues && knownIssues.length > 0) {
      const criticalIssues = knownIssues.filter((i) => i.severity === 'Critical');
      for (const issue of criticalIssues) {
        const issueText = `${issue.title} ${issue.description}`.toLowerCase();
        // Check if issue mentions power limits
        if (issueText.includes('above') && issueText.includes('hp')) {
          const hpMatch = issueText.match(/above\s+(\d+)\s*hp/i);
          if (hpMatch && targetHp > parseInt(hpMatch[1], 10)) {
            warnings.push(`${stageName} may trigger known issue: ${issue.title}`);
          }
        }
      }
    }

    if (stageValid) {
      validStages.push(stageName);
    }
  }

  return { validStages, warnings };
}

/**
 * Check for contradictions between pros/cons and platform insights
 * @param {Object} params
 * @param {string[]} params.pros - Car pros list
 * @param {string[]} params.cons - Car cons list
 * @param {Object} params.platformInsights - Platform insights object
 * @returns {{ contradictions: string[], severity: 'none'|'minor'|'major' }}
 */
export function checkEditorialConsistency({ pros, cons: _cons, platformInsights }) {
  const contradictions = [];

  if (!platformInsights) {
    return { contradictions: [], severity: 'none' };
  }

  const weaknesses = platformInsights.weaknesses || [];
  const _strengths = platformInsights.strengths || [];

  // Contradiction patterns to check
  const contradictionPatterns = [
    {
      proPattern: /aftermarket|tuning support|tuneable/i,
      weaknessPattern: /limited tuning|no tuning|hard to tune|difficult to tune/i,
      message: 'Pros mention aftermarket support, but weaknesses mention limited tuning',
    },
    {
      proPattern: /reliable|reliability|dependable/i,
      weaknessPattern: /unreliable|reliability issues|common failures/i,
      message: 'Pros mention reliability, but weaknesses mention reliability issues',
    },
    {
      proPattern: /fuel efficient|good mpg|economical/i,
      weaknessPattern: /poor mpg|thirsty|bad fuel economy/i,
      message: 'Pros mention fuel efficiency, but weaknesses mention poor MPG',
    },
  ];

  const prosText = (pros || []).join(' ').toLowerCase();
  const weaknessText = weaknesses
    .map((w) => (typeof w === 'string' ? w : w.title || ''))
    .join(' ')
    .toLowerCase();

  for (const pattern of contradictionPatterns) {
    if (pattern.proPattern.test(prosText) && pattern.weaknessPattern.test(weaknessText)) {
      contradictions.push(pattern.message);
    }
  }

  return {
    contradictions,
    severity: contradictions.length > 1 ? 'major' : contradictions.length === 1 ? 'minor' : 'none',
  };
}

/**
 * Main validation function - validates all data for a car
 * @param {Object} params
 * @param {Object} params.car - Full car object
 * @param {Object} params.tuningProfile - Tuning profile
 * @param {Array} params.knownIssues - Known issues
 * @returns {ValidationResult}
 */
export function validateCarData({ car, tuningProfile, knownIssues }) {
  const warnings = [];
  const errors = [];

  // Calculate tunability if not provided
  const tunability = calculateTunability(car);

  // Validate ECU tune recommendation
  const ecuValidation = validateEcuTuneRecommendation({
    car,
    tuningProfile,
    tunabilityScore: tunability.score,
  });

  warnings.push(...ecuValidation.warnings);

  // Validate stage progressions
  if (tuningProfile?.stage_progressions) {
    const stageValidation = validateStageProgressions({
      stageProgressions: tuningProfile.stage_progressions,
      powerLimits: tuningProfile.power_limits,
      knownIssues,
      stockHp: car.hp,
    });
    warnings.push(...stageValidation.warnings);
  }

  // Check editorial consistency
  const editorialCheck = checkEditorialConsistency({
    pros: car.pros,
    cons: car.cons,
    platformInsights: tuningProfile?.platform_insights,
  });

  if (editorialCheck.severity === 'major') {
    errors.push(...editorialCheck.contradictions);
  } else if (editorialCheck.severity === 'minor') {
    warnings.push(...editorialCheck.contradictions);
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
    recommendations: {
      allowEcuTune: ecuValidation.allowEcuTune,
      allowStage2Plus: ecuValidation.allowStage2Plus,
      suppressionReason: ecuValidation.suppressionReason,
      confidenceLevel: ecuValidation.confidenceLevel,
    },
    tunability: {
      score: tunability.score,
      label: tunability.label,
      factors: tunability.factors,
    },
  };
}

/**
 * Quick check if ECU tune should be recommended for a car
 * Use this in components to filter recommendations
 * @param {Object} params
 * @param {Object} params.car - Car object (needs name, brand at minimum)
 * @param {Object} params.tuningProfile - Optional tuning profile
 * @param {number} params.tunabilityScore - Optional pre-calculated score
 * @returns {boolean}
 */
export function shouldRecommendEcuTune({ car, tuningProfile, tunabilityScore }) {
  // Quick platform check first (no DB needed)
  const platformCheck = checkPlatformRestrictions(car);
  if (platformCheck.isRestricted) {
    return false;
  }

  // Calculate or use provided tunability score
  const score = tunabilityScore ?? calculateTunability(car).score;
  if (score < 5) {
    return false;
  }

  // Check platform insights if available
  if (tuningProfile?.platform_insights) {
    const insightsCheck = checkTuningDifficultyInInsights(tuningProfile.platform_insights);
    if (insightsCheck.hasDifficulty) {
      return false;
    }
  }

  return true;
}

/**
 * Get a user-friendly message explaining why recommendations are limited
 * @param {Object} validationResult - Result from validateCarData or validateEcuTuneRecommendation
 * @returns {string|null}
 */
export function getRecommendationLimitationMessage(validationResult) {
  if (!validationResult) return null;

  const { suppressionReason, confidenceLevel, warnings } = validationResult;

  if (suppressionReason) {
    return suppressionReason;
  }

  if (confidenceLevel < 50 && warnings && warnings.length > 0) {
    return `Recommendations may be limited: ${warnings[0]}`;
  }

  return null;
}

const dataConsistencyValidator = {
  validateCarData,
  validateEcuTuneRecommendation,
  validateStageProgressions,
  checkTuningDifficultyInInsights,
  checkPlatformRestrictions,
  checkEditorialConsistency,
  shouldRecommendEcuTune,
  getRecommendationLimitationMessage,
};

export default dataConsistencyValidator;
