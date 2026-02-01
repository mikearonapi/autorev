/**
 * Tunability Calculator
 *
 * Calculates a "tunability score" for each car based on factors like:
 * - Engine type (NA vs forced induction)
 * - Aftermarket support
 * - Platform age and popularity
 * - Known headroom/limits
 *
 * Score ranges from 1-10:
 * - 9-10: Legendary tuner platform (GT-R, Supra, Evo, STI)
 * - 7-8: Excellent aftermarket, proven gains
 * - 5-6: Good aftermarket, moderate gains
 * - 3-4: Limited aftermarket, harder to modify
 * - 1-2: Very limited or not recommended
 *
 * @module lib/tunabilityCalculator
 */

/**
 * Engine type tunability multipliers
 * Forced induction has more headroom for gains
 */
const ENGINE_TYPE_MULTIPLIERS = {
  'twin-turbo': 1.3,
  turbo: 1.25,
  supercharged: 1.2,
  'naturally-aspirated': 1.0,
  hybrid: 0.9,
  ev: 0.7,
  unknown: 1.0,
};

/**
 * Platform popularity/aftermarket support data
 * Higher = more aftermarket options
 */
const PLATFORM_AFTERMARKET_SCORES = {
  // Legendary tuner platforms
  'nissan-gt-r': 10,
  'toyota-supra-mk5': 9,
  'toyota-supra-mk4': 10,
  'subaru-wrx-sti': 9,
  'mitsubishi-evo': 10,
  'mazda-rx7': 9,
  'mazda-rx8': 7,
  'honda-s2000': 8,
  'honda-civic-type-r': 8,

  // Great aftermarket
  'ford-mustang': 9,
  'chevrolet-camaro': 9,
  'chevrolet-corvette': 8,
  'dodge-challenger': 8,
  'bmw-m3': 8,
  'bmw-m4': 8,
  'bmw-m2': 8,
  'audi-rs': 8,
  'porsche-911': 7,
  'porsche-cayman': 7,
  'porsche-boxster': 7,
  'nissan-370z': 8,
  'nissan-350z': 8,
  'mazda-miata': 9,
  'toyota-86': 8,
  'subaru-brz': 8,

  // Good aftermarket
  'mercedes-amg': 6,
  'audi-r8': 5,
  lotus: 5,
  'alfa-romeo': 5,
  genesis: 5,

  // Limited aftermarket
  mclaren: 4,
  ferrari: 3,
  lamborghini: 3,
  'aston-martin': 4,
  lexus: 5,
};

/**
 * Detect engine aspiration type from engine description
 * @param {string} engine - Engine description
 * @returns {string}
 */
function detectAspirationType(engine) {
  if (!engine) return 'unknown';
  const lower = engine.toLowerCase();

  if (lower.includes('twin-turbo') || lower.includes('twin turbo') || lower.includes('tt')) {
    return 'twin-turbo';
  }
  if (lower.includes('turbo')) {
    return 'turbo';
  }
  if (lower.includes('supercharged') || lower.includes('sc')) {
    return 'supercharged';
  }
  if (lower.includes('electric') || lower.includes('ev')) {
    return 'ev';
  }
  if (lower.includes('hybrid')) {
    return 'hybrid';
  }
  return 'naturally-aspirated';
}

/**
 * Get platform key from car name
 * @param {string} name - Car name
 * @returns {string}
 */
function getPlatformKey(name) {
  if (!name) return '';
  const lower = name.toLowerCase();

  // Nissan
  if (lower.includes('gt-r')) return 'nissan-gt-r';
  if (lower.includes('370z') || lower.includes('350z')) return 'nissan-370z';

  // Toyota/Supra
  if (lower.includes('supra')) return 'toyota-supra-mk5';
  if (lower.includes('gr86') || lower.includes('86')) return 'toyota-86';

  // Subaru
  if (lower.includes('wrx') || lower.includes('sti')) return 'subaru-wrx-sti';
  if (lower.includes('brz')) return 'subaru-brz';

  // Honda
  if (lower.includes('s2000')) return 'honda-s2000';
  if (lower.includes('civic') && lower.includes('type')) return 'honda-civic-type-r';
  if (lower.includes('nsx')) return 'honda-nsx';

  // Mazda
  if (lower.includes('miata') || lower.includes('mx-5')) return 'mazda-miata';
  if (lower.includes('rx-7') || lower.includes('rx7')) return 'mazda-rx7';
  if (lower.includes('rx-8') || lower.includes('rx8')) return 'mazda-rx8';

  // American muscle
  if (lower.includes('mustang')) return 'ford-mustang';
  if (lower.includes('camaro')) return 'chevrolet-camaro';
  if (lower.includes('corvette')) return 'chevrolet-corvette';
  if (lower.includes('challenger') || lower.includes('charger')) return 'dodge-challenger';

  // BMW
  if (lower.includes('m2')) return 'bmw-m2';
  if (lower.includes('m3')) return 'bmw-m3';
  if (lower.includes('m4')) return 'bmw-m4';
  if (lower.includes('z4')) return 'bmw-z4';

  // Porsche
  if (lower.includes('911')) return 'porsche-911';
  if (lower.includes('cayman') || lower.includes('718')) return 'porsche-cayman';
  if (lower.includes('boxster')) return 'porsche-boxster';

  // Audi
  if (lower.includes('rs')) return 'audi-rs';
  if (lower.includes('r8')) return 'audi-r8';

  // Mercedes
  if (lower.includes('amg')) return 'mercedes-amg';

  // Lotus
  if (
    lower.includes('lotus') ||
    lower.includes('evora') ||
    lower.includes('elise') ||
    lower.includes('emira')
  )
    return 'lotus';

  // Alfa Romeo
  if (lower.includes('alfa') || lower.includes('giulia') || lower.includes('4c'))
    return 'alfa-romeo';

  // Genesis
  if (lower.includes('genesis')) return 'genesis';

  // Exotics with limited aftermarket
  if (lower.includes('mclaren')) return 'mclaren';
  if (lower.includes('ferrari')) return 'ferrari';
  if (lower.includes('lamborghini')) return 'lamborghini';
  if (lower.includes('aston')) return 'aston-martin';

  // Lexus
  if (
    lower.includes('lexus') ||
    lower.includes('lc') ||
    lower.includes('rc-f') ||
    lower.includes('is-f')
  )
    return 'lexus';

  return 'unknown';
}

/**
 * Calculate tunability score for a car
 *
 * @param {Object} car - Car object with name, engine, aftermarketSupport, etc.
 * @returns {Object} - Tunability data
 */
export function calculateTunability(car) {
  // Use explicit tunability if provided
  if (car.tunability !== undefined) {
    return {
      score: car.tunability,
      label: getTunabilityLabel(car.tunability),
      description: getTunabilityDescription(car.tunability),
      factors: [],
    };
  }

  const factors = [];
  let baseScore = 5; // Start at average

  // Factor 1: Engine type
  const aspirationType = car.aspirationType || detectAspirationType(car.engineType);
  const _engineMultiplier = ENGINE_TYPE_MULTIPLIERS[aspirationType] || 1.0;

  if (aspirationType === 'turbo' || aspirationType === 'twin-turbo') {
    factors.push({
      factor: 'Forced induction',
      impact: '+2',
      description: 'Turbocharged engines have more headroom for tuning',
    });
    baseScore += 2;
  } else if (aspirationType === 'supercharged') {
    factors.push({
      factor: 'Supercharged',
      impact: '+1.5',
      description: 'Supercharged engines respond well to tuning',
    });
    baseScore += 1.5;
  } else if (aspirationType === 'naturally-aspirated') {
    factors.push({
      factor: 'Naturally aspirated',
      impact: '0',
      description: 'NA engines have limited tuning gains without FI',
    });
  }

  // Factor 2: Aftermarket support
  const platformKey = getPlatformKey(car.name);
  const aftermarketScore = PLATFORM_AFTERMARKET_SCORES[platformKey];

  if (aftermarketScore !== undefined) {
    if (aftermarketScore >= 9) {
      factors.push({
        factor: 'Legendary aftermarket',
        impact: '+3',
        description: 'Huge selection of parts and proven builds',
      });
      baseScore += 3;
    } else if (aftermarketScore >= 7) {
      factors.push({
        factor: 'Strong aftermarket',
        impact: '+2',
        description: 'Good selection of quality parts available',
      });
      baseScore += 2;
    } else if (aftermarketScore >= 5) {
      factors.push({
        factor: 'Moderate aftermarket',
        impact: '+1',
        description: 'Some aftermarket options available',
      });
      baseScore += 1;
    } else if (aftermarketScore < 4) {
      factors.push({
        factor: 'Limited aftermarket',
        impact: '-1',
        description: 'Few aftermarket options, harder to modify',
      });
      baseScore -= 1;
    }
  }

  // Factor 3: Use car's aftermarketSupport score if available
  if (car.aftermarketSupport !== undefined) {
    const aftermarketAdj = (car.aftermarketSupport - 5) / 2; // Convert 1-10 to -2 to +2.5
    if (aftermarketAdj > 1) {
      factors.push({
        factor: 'High aftermarket rating',
        impact: `+${aftermarketAdj.toFixed(1)}`,
        description: 'Car has excellent parts availability',
      });
    } else if (aftermarketAdj < -1) {
      factors.push({
        factor: 'Low aftermarket rating',
        impact: `${aftermarketAdj.toFixed(1)}`,
        description: 'Limited parts availability',
      });
    }
    baseScore += aftermarketAdj;
  }

  // Factor 4: Price tier (premium cars often have more expensive/limited mods)
  if (car.tier === 'premium') {
    factors.push({
      factor: 'Premium platform',
      impact: '-0.5',
      description: 'Modifications tend to be more expensive',
    });
    baseScore -= 0.5;
  } else if (car.tier === 'budget') {
    factors.push({
      factor: 'Budget-friendly platform',
      impact: '+0.5',
      description: 'More affordable modification options',
    });
    baseScore += 0.5;
  }

  // Clamp score to 1-10
  const finalScore = Math.max(1, Math.min(10, Math.round(baseScore * 10) / 10));

  return {
    score: finalScore,
    label: getTunabilityLabel(finalScore),
    description: getTunabilityDescription(finalScore),
    factors,
    aspirationType,
    platformKey,
  };
}

/**
 * Get tunability label from score
 * @param {number} score
 * @returns {string}
 */
export function getTunabilityLabel(score) {
  if (score >= 9) return 'Legendary';
  if (score >= 7.5) return 'Excellent';
  if (score >= 6) return 'Good';
  if (score >= 4) return 'Moderate';
  if (score >= 2) return 'Limited';
  return 'Not Recommended';
}

/**
 * Get tunability description from score
 * @param {number} score
 * @returns {string}
 */
export function getTunabilityDescription(score) {
  if (score >= 9)
    return 'One of the most tunable platforms ever made. Massive aftermarket support.';
  if (score >= 7.5) return 'Excellent platform for modifications with strong aftermarket support.';
  if (score >= 6) return 'Good aftermarket options and proven upgrade paths.';
  if (score >= 4) return 'Some aftermarket support, but options may be limited.';
  if (score >= 2) return 'Limited aftermarket. Modifications may be challenging or expensive.';
  return 'Not recommended for modification. Very limited support.';
}

/**
 * Get color for tunability score
 * @param {number} score
 * @returns {string}
 */
export function getTunabilityColor(score) {
  if (score >= 9) return '#9b59b6'; // Purple - legendary
  if (score >= 7.5) return '#27ae60'; // Green - excellent
  if (score >= 6) return '#3498db'; // Blue - good
  if (score >= 4) return '#f39c12'; // Orange - moderate
  return '#e74c3c'; // Red - limited
}
