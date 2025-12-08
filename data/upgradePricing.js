/**
 * SuperNatural Motorsports - Brand-Specific Upgrade Pricing
 * 
 * This module provides cost multipliers and overrides for upgrade pricing
 * based on car brand, platform, and country of origin.
 * 
 * Premium European brands (Porsche, Ferrari, Aston Martin, etc.) have
 * significantly higher parts and labor costs compared to mainstream
 * American or Japanese brands.
 */

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
  
  // Lotus specific - premium but smaller parts
  'Lotus': {
    'intake': { costLow: 400, costHigh: 700 },
    'exhaust-catback': { costLow: 1200, costHigh: 2800 },
    'coilovers-street': { costLow: 2000, costHigh: 4000 },
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
 * Get adjusted cost for an upgrade based on car's platform tier
 * @param {Object} car - Car object
 * @param {Object} upgrade - Upgrade object with estimatedCostLow/High
 * @returns {Object} - { low, high } adjusted costs
 */
export function getAdjustedUpgradeCost(car, upgrade) {
  const tier = getCostTier(car);
  const brand = car.brand;
  
  // Check for brand-specific override first
  if (brand && brandUpgradeOverrides[brand]?.[upgrade.key]) {
    return brandUpgradeOverrides[brand][upgrade.key];
  }
  
  // Check for package-level override
  if (upgrade.type === 'package' && packageCostByTier[upgrade.key]?.[tier]) {
    return packageCostByTier[upgrade.key][tier];
  }
  
  // Apply tier multiplier to base cost
  const multiplier = platformCostMultipliers[tier]?.multiplier || 1.0;
  
  return {
    low: Math.round((upgrade.estimatedCostLow || 0) * multiplier),
    high: Math.round((upgrade.estimatedCostHigh || 0) * multiplier),
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
  brandUpgradeOverrides,
  packageCostByTier,
  getCostTier,
  getAdjustedUpgradeCost,
  getCostComparisonText,
  formatUpgradeCost,
};


