/**
 * AutoRev - Brand-Specific Upgrade Pricing
 * 
 * This module provides cost multipliers and overrides for upgrade pricing
 * based on car brand, platform, and country of origin.
 * 
 * Premium European brands (Porsche, Ferrari, Aston Martin, etc.) have
 * significantly higher parts and labor costs compared to mainstream
 * American or Japanese brands.
 * 
 * PRICING DISCLAIMER:
 * All pricing estimates reflect typical market ranges as of 2024-2025.
 * Actual costs vary by region, installer, specific product selection,
 * and market conditions. Labor rates differ significantly by location.
 * Always obtain quotes from qualified installers before committing to purchases.
 * 
 * Last validated: December 8, 2025
 */

/**
 * Pricing disclaimer for display in the UI
 * @type {string}
 */
export const PRICING_DISCLAIMER = 
  'Pricing estimates reflect typical market ranges as of 2024-2025. Actual costs vary ' +
  'by region, installer, and specific product selection. Always obtain quotes from ' +
  'qualified installers before committing to purchases.';

/**
 * Platform cost tiers with multipliers
 * These multiply the base upgrade costs
 */
export const platformCostMultipliers = {
  // Exotic/Supercar tier - highest costs
  exotic: {
    multiplier: 2.0,
    laborMultiplier: 2.5,
    description: 'Exotic cars require specialized tools, expertise, and OEM-quality parts',
    brands: ['Ferrari', 'Lamborghini', 'McLaren', 'Aston Martin'],
  },
  
  // Premium German tier - high costs
  premium: {
    multiplier: 1.5,
    laborMultiplier: 1.8,
    description: 'Premium German engineering requires certified technicians and quality parts',
    brands: ['Porsche', 'BMW', 'Mercedes-AMG', 'Audi'],
  },
  
  // Luxury tier - above average costs
  luxury: {
    multiplier: 1.3,
    laborMultiplier: 1.5,
    description: 'Luxury cars have higher parts costs but broader service availability',
    brands: ['Lexus', 'Jaguar', 'Maserati', 'Alfa Romeo', 'Lotus'],
  },
  
  // Mainstream tier - standard costs (baseline)
  mainstream: {
    multiplier: 1.0,
    laborMultiplier: 1.0,
    description: 'Widely available parts and service options',
    brands: ['Ford', 'Chevrolet', 'Dodge', 'Nissan', 'Toyota'],
  },
};

/**
 * Category-specific cost multipliers by tier
 * More accurate than a single global multiplier since different parts scale differently
 * 
 * Rationale:
 * - Exhaust/headers: High variation due to specialized manufacturing, materials
 * - Chassis/suspension: Moderate variation, some shared platforms
 * - Brakes: Moderate variation, compound is similar but calipers vary
 * - Cooling: Lower variation, aluminum is aluminum
 * - Power (bolt-ons): Lower variation, mass-market parts exist
 * - Forced induction: Moderate, kit availability varies
 * - Wheels: High variation, forged wheels for exotics are pricey
 * - Aero: Moderate, carbon fiber costs scale with complexity
 * 
 * Values validated against 2024-2025 market pricing from major vendors
 */
export const categoryMultipliers = {
  exotic: {
    power: 1.6,           // Intakes, tunes - some standardization
    forcedInduction: 2.2, // Limited kit availability, custom work needed
    chassis: 2.0,         // Specialized dampers, unique geometry
    brakes: 1.8,          // Exotic calipers, carbon ceramics common
    cooling: 1.5,         // Aluminum is aluminum, but fitment matters
    wheels: 2.5,          // Forged wheels, exotic fitments
    aero: 2.0,            // Carbon fiber, wind tunnel tested designs
    drivetrain: 2.2,      // Specialized clutches, limited slip diffs
  },
  premium: {
    power: 1.3,           // Good aftermarket support
    forcedInduction: 1.6, // Decent kit availability
    chassis: 1.5,         // KW, Ohlins make dedicated parts
    brakes: 1.4,          // StopTech, Brembo kits available
    cooling: 1.2,         // Standard aluminum, good fitment options
    wheels: 1.8,          // Flow-formed options available
    aero: 1.5,            // Carbon options, some fiberglass
    drivetrain: 1.6,      // Clutch kits, LSD options exist
  },
  luxury: {
    power: 1.2,           // Good aftermarket
    forcedInduction: 1.4, // Reasonable kit availability
    chassis: 1.3,         // Shared platforms help
    brakes: 1.3,          // Standard upgrade path
    cooling: 1.15,        // Minimal markup
    wheels: 1.5,          // Good variety available
    aero: 1.3,            // Mix of materials
    drivetrain: 1.4,      // Some shared parts with mainstream
  },
  mainstream: {
    power: 1.0,
    forcedInduction: 1.0,
    chassis: 1.0,
    brakes: 1.0,
    cooling: 1.0,
    wheels: 1.0,
    aero: 1.0,
    drivetrain: 1.0,
  },
};

/**
 * Brand-specific cost overrides for certain upgrades
 * These are for cases where specific brand/upgrade combos have known pricing
 */
export const brandUpgradeOverrides = {
  // Porsche-specific pricing
  'Porsche': {
    // Porsche OEM+ parts are expensive
    'intake': { costLow: 500, costHigh: 900 },
    'exhaust-catback': { costLow: 1800, costHigh: 4500 },
    'headers': { costLow: 3000, costHigh: 6000 },
    'coilovers-street': { costLow: 2500, costHigh: 5000 },
    'coilovers-track': { costLow: 5000, costHigh: 10000 },
    'big-brake-kit': { costLow: 4500, costHigh: 9000 },
    'tune-street': { costLow: 800, costHigh: 1500 },
    'tune-track': { costLow: 1200, costHigh: 2500 },
  },
  
  // BMW M-specific pricing
  'BMW': {
    'intake': { costLow: 400, costHigh: 700 },
    'exhaust-catback': { costLow: 1200, costHigh: 3000 },
    'coilovers-street': { costLow: 2000, costHigh: 4000 },
    'coilovers-track': { costLow: 4000, costHigh: 8000 },
    'big-brake-kit': { costLow: 3500, costHigh: 7000 },
    'tune-street': { costLow: 600, costHigh: 1200 },
  },
  
  // Mercedes-AMG specific pricing
  'Mercedes-AMG': {
    'exhaust-catback': { costLow: 1500, costHigh: 3500 },
    'coilovers-street': { costLow: 2200, costHigh: 4500 },
    'big-brake-kit': { costLow: 4000, costHigh: 8000 },
  },
  
  // Lotus specific - premium British engineering, limited aftermarket
  // Emira pricing validated against Komo-Tec, Nitron, Larini, BOE
  'Lotus': {
    'intake': { low: 400, high: 800 },
    'exhaust-catback': { low: 1500, high: 3500 },        // Larini, Komo-Tec systems
    'headers': { low: 2000, high: 4000 },                // Limited options, mostly custom
    'tune-street': { low: 600, high: 1200 },             // Komo-Tec, BOE tuning
    'tune-track': { low: 1000, high: 2000 },
    'coilovers-street': { low: 2500, high: 4500 },       // Nitron, Ohlins
    'coilovers-track': { low: 4000, high: 7000 },        // Nitron R3, Ohlins TTX
    'lowering-springs': { low: 500, high: 900 },
    'sway-bars': { low: 800, high: 1500 },
    'big-brake-kit': { low: 4000, high: 7500 },          // AP Racing, Essex
    'brake-pads-street': { low: 300, high: 600 },
    'brake-pads-track': { low: 500, high: 900 },
    'wheels-lightweight': { low: 3000, high: 5500 },     // Forged options
    'oil-cooler': { low: 1000, high: 2000 },
    'radiator-upgrade': { low: 800, high: 1500 },
    'splitter': { low: 600, high: 1500 },
    'wing': { low: 1500, high: 4000 },
  },
  
  // Aston Martin - exotic pricing
  'Aston Martin': {
    'intake': { costLow: 600, costHigh: 1100 },
    'exhaust-catback': { costLow: 2500, costHigh: 5000 },
    'coilovers-street': { costLow: 3000, costHigh: 6000 },
    'big-brake-kit': { costLow: 5000, costHigh: 10000 },
  },
  
  // Maserati - exotic pricing, Ferrari-derived parts
  'Maserati': {
    'exhaust-catback': { costLow: 2000, costHigh: 4500 },
    'coilovers-street': { costLow: 2500, costHigh: 5000 },
    'big-brake-kit': { costLow: 4500, costHigh: 9000 },
    'clutch': { costLow: 3000, costHigh: 5000 },
  },
  
  // Jaguar - luxury pricing
  'Jaguar': {
    'exhaust-catback': { costLow: 1400, costHigh: 3200 },
    'coilovers-street': { costLow: 2000, costHigh: 4000 },
    'big-brake-kit': { costLow: 3500, costHigh: 7000 },
  },
  
  // Alfa Romeo - Italian exotic pricing
  'Alfa Romeo': {
    'exhaust-catback': { costLow: 1500, costHigh: 3000 },
    'coilovers-street': { costLow: 2200, costHigh: 4500 },
  },
  
  // Lexus - premium but Toyota parts availability
  'Lexus': {
    'exhaust-catback': { costLow: 1000, costHigh: 2200 },
    'coilovers-street': { costLow: 1800, costHigh: 3500 },
    'big-brake-kit': { costLow: 3000, costHigh: 6000 },
  },
  
  // Audi - premium German
  'Audi': {
    'exhaust-catback': { costLow: 1200, costHigh: 2800 },
    'coilovers-street': { costLow: 2000, costHigh: 4000 },
    'turbo-upgrade-existing': { costLow: 5000, costHigh: 12000 },
  },
  
  // American brands - baseline pricing (Ford, Chevrolet, Dodge)
  // These use the generic pricing from upgradePackages.js
};

/**
 * Package-level cost overrides by platform tier
 * For the curated packages, these provide tier-appropriate pricing
 */
export const packageCostByTier = {
  streetSport: {
    exotic: { low: 6000, high: 12000 },
    premium: { low: 4500, high: 9000 },
    luxury: { low: 3800, high: 7500 },
    mainstream: { low: 3000, high: 6000 },
  },
  trackPack: {
    exotic: { low: 24000, high: 40000 },
    premium: { low: 18000, high: 30000 },
    luxury: { low: 15000, high: 25000 },
    mainstream: { low: 12000, high: 20000 },
  },
  timeAttack: {
    exotic: { low: 50000, high: 80000 },
    premium: { low: 38000, high: 60000 },
    luxury: { low: 32000, high: 50000 },
    mainstream: { low: 25000, high: 40000 },
  },
  ultimatePower: {
    exotic: { low: 30000, high: 60000 },
    premium: { low: 22000, high: 45000 },
    luxury: { low: 18000, high: 38000 },
    mainstream: { low: 15000, high: 35000 },
  },
};

/**
 * Get the cost tier for a car based on its brand or platformCostTier field
 * @param {Object} car - Car object with brand and/or platformCostTier
 * @returns {string} - Cost tier key: 'exotic', 'premium', 'luxury', or 'mainstream'
 */
export function getCostTier(car) {
  // First check if car has explicit platformCostTier
  if (car.platformCostTier) {
    return car.platformCostTier;
  }
  
  // Otherwise, determine from brand
  const brand = car.brand;
  if (!brand) return 'mainstream';
  
  for (const [tier, config] of Object.entries(platformCostMultipliers)) {
    if (config.brands.includes(brand)) {
      return tier;
    }
  }
  
  return 'mainstream';
}

/**
 * Confidence levels for pricing estimates
 * @readonly
 * @enum {string}
 */
export const PricingConfidence = {
  VERIFIED: 'verified',     // Brand-specific override with researched pricing
  HIGH: 'high',             // Package-level tier pricing or category multiplier
  ESTIMATED: 'estimated',   // Fallback to global multiplier
};

/**
 * Get adjusted cost for an upgrade based on car's platform tier
 * Uses category-specific multipliers for better accuracy
 * 
 * @param {Object} car - Car object
 * @param {Object} upgrade - Upgrade object with estimatedCostLow/High
 * @returns {Object} - { low, high, confidence, source } adjusted costs with confidence info
 */
export function getAdjustedUpgradeCost(car, upgrade) {
  const tier = getCostTier(car);
  const brand = car.brand;
  
  // Priority 1: Brand-specific override (highest confidence)
  if (brand && brandUpgradeOverrides[brand]?.[upgrade.key]) {
    const override = brandUpgradeOverrides[brand][upgrade.key];
    // Normalize property names (overrides use costLow/costHigh, we return low/high)
    return {
      low: override.low ?? override.costLow ?? 0,
      high: override.high ?? override.costHigh ?? 0,
      confidence: PricingConfidence.VERIFIED,
      source: `${brand} market data`,
    };
  }
  
  // Priority 2: Package-level tier override (high confidence)
  if (upgrade.type === 'package' && packageCostByTier[upgrade.key]?.[tier]) {
    const tierPricing = packageCostByTier[upgrade.key][tier];
    return {
      low: tierPricing.low,
      high: tierPricing.high,
      confidence: PricingConfidence.HIGH,
      source: `${tier} tier package pricing`,
    };
  }
  
  // Priority 3: Category-specific multiplier (high confidence)
  const category = upgrade.category;
  if (category && categoryMultipliers[tier]?.[category]) {
    const multiplier = categoryMultipliers[tier][category];
    return {
      low: Math.round((upgrade.estimatedCostLow || 0) * multiplier),
      high: Math.round((upgrade.estimatedCostHigh || 0) * multiplier),
      confidence: PricingConfidence.HIGH,
      source: `${tier} ${category} category estimate`,
    };
  }
  
  // Priority 4: Global tier multiplier (fallback)
  const multiplier = platformCostMultipliers[tier]?.multiplier || 1.0;
  
  return {
    low: Math.round((upgrade.estimatedCostLow || 0) * multiplier),
    high: Math.round((upgrade.estimatedCostHigh || 0) * multiplier),
    confidence: PricingConfidence.ESTIMATED,
    source: `${tier} tier estimate`,
  };
}

/**
 * Get a human-readable cost comparison string
 * Shows the difference between mainstream and current car's pricing
 * @param {Object} car - Car object
 * @param {Object} upgrade - Upgrade object
 * @returns {string|null} - Comparison text or null if mainstream
 */
export function getCostComparisonText(car, upgrade) {
  const tier = getCostTier(car);
  if (tier === 'mainstream') return null;
  
  const adjustedCost = getAdjustedUpgradeCost(car, upgrade);
  const baseCost = upgrade.estimatedCostLow || 0;
  const percentIncrease = Math.round(((adjustedCost.low - baseCost) / baseCost) * 100);
  
  if (percentIncrease <= 10) return null;
  
  const tierLabel = platformCostMultipliers[tier]?.description || tier;
  return `${percentIncrease}% higher than mainstream due to ${car.brand} parts pricing`;
}

/**
 * Format cost for display with tier indicator
 * @param {Object} car - Car object
 * @param {Object} upgrade - Upgrade object
 * @returns {Object} - { display, low, high, tierIndicator }
 */
export function formatUpgradeCost(car, upgrade) {
  const tier = getCostTier(car);
  const adjusted = getAdjustedUpgradeCost(car, upgrade);
  
  const formatK = (val) => {
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
    return `$${val}`;
  };
  
  const tierIndicators = {
    exotic: '💎',
    premium: '⭐',
    luxury: '✨',
    mainstream: '',
  };
  
  return {
    display: `${formatK(adjusted.low)} - ${formatK(adjusted.high)}`,
    low: adjusted.low,
    high: adjusted.high,
    tierIndicator: tierIndicators[tier] || '',
    tierLabel: tier.charAt(0).toUpperCase() + tier.slice(1),
    comparison: getCostComparisonText(car, upgrade),
  };
}

export default {
  platformCostMultipliers,
  categoryMultipliers,
  brandUpgradeOverrides,
  packageCostByTier,
  PricingConfidence,
  getCostTier,
  getAdjustedUpgradeCost,
  getCostComparisonText,
  formatUpgradeCost,
  PRICING_DISCLAIMER,
};


