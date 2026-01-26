/**
 * Stripe Configuration & Utilities
 * 
 * Contains all Stripe product/price IDs and helper functions for:
 * - Subscription management
 * - AL credit pack purchases
 * - Donations
 * 
 * @module lib/stripe
 */

// =============================================================================
// STRIPE CONFIGURATION
// =============================================================================

/**
 * Subscription tier configurations
 * Maps internal tier names to Stripe price IDs
 * 
 * Now supports both monthly and annual pricing:
 * - monthly.priceId: Monthly recurring price
 * - annual.priceId: Annual recurring price (with savings)
 * 
 * Legacy: `priceId` and `price` refer to monthly pricing for backward compatibility
 */
/**
 * Subscription tier configurations - SIMPLIFIED MODEL (Jan 2026)
 * 
 * Pricing:
 * - Free: $0 (1 car, ~15 AL conversations)
 * - Enthusiast: $9.99/mo or $79/yr (3 cars, ~130 AL conversations, Insights & Data)
 * - Pro: $19.99/mo or $149/yr (Unlimited cars, ~350 AL conversations, Priority support)
 */
export const SUBSCRIPTION_TIERS = {
  free: {
    tier: 'free',
    name: 'Free',
    price: 0,
    priceId: null,
    productId: null,
    alBudgetCents: 25, // $0.25/month
    maxCars: 1,
    monthly: null,
    annual: null,
  },
  collector: {
    tier: 'collector',
    name: 'Enthusiast',
    productId: 'prod_TrPhpLD2oMkK1f',
    alBudgetCents: 200, // $2.00/month
    maxCars: 3,
    // Legacy field for backward compatibility
    price: 999, // cents ($9.99)
    priceId: 'price_1StgsqPAhBIL8qL10qTUCZJs',
    // Monthly/annual options
    monthly: {
      price: 999, // $9.99/month
      priceId: 'price_1StgsqPAhBIL8qL10qTUCZJs',
      interval: 'month',
    },
    annual: {
      price: 7900, // $79/year (~$6.58/month)
      priceId: 'price_1StgslPAhBIL8qL1J9iKBaAG',
      interval: 'year',
      monthlyEquivalent: 658,
      savingsPercent: 34, // 2 months free
      savingsMessage: '2 months free',
    },
  },
  tuner: {
    tier: 'tuner',
    name: 'Pro',
    productId: 'prod_TrPidceOekU45N',
    alBudgetCents: 500, // $5.00/month
    maxCars: Infinity,
    // Legacy field for backward compatibility
    price: 1999, // cents ($19.99)
    priceId: 'price_1StgslPAhBIL8qL1cXb2D937',
    // Monthly/annual options
    monthly: {
      price: 1999, // $19.99/month
      priceId: 'price_1StgslPAhBIL8qL1cXb2D937',
      interval: 'month',
    },
    annual: {
      price: 14900, // $149/year (~$12.42/month)
      priceId: 'price_1StgsmPAhBIL8qL1MeyF2SY1',
      interval: 'year',
      monthlyEquivalent: 1242,
      savingsPercent: 38, // ~2 months free
      savingsMessage: '2 months free',
    },
  },
};

/**
 * AL Top-Up Packs (one-time purchases) - SIMPLIFIED (Jan 2026)
 * Named: Boost, Power, Mega for easy user understanding
 */
export const AL_CREDIT_PACKS = {
  boost: {
    id: 'boost',
    name: 'AL Boost',
    budgetCents: 50, // $0.50 AL budget
    price: 199, // cents ($1.99)
    priceId: 'price_1StgsnPAhBIL8qL1eivgKKD8',
    productId: 'prod_TrPiGMeYJdDO05',
    estimatedChats: '~35',
  },
  power: {
    id: 'power',
    name: 'AL Power Pack',
    budgetCents: 150, // $1.50 AL budget
    price: 499, // cents ($4.99)
    priceId: 'price_1StgsnPAhBIL8qL1fiPihPE4',
    productId: 'prod_TrPisEEPlFQZiL',
    estimatedChats: '~100',
    popular: true,
  },
  turbo: {
    id: 'turbo',
    name: 'AL Turbo Pack',
    budgetCents: 350, // $3.50 AL budget
    price: 999, // cents ($9.99)
    priceId: 'price_1StgsoPAhBIL8qL18lzN0aBV',
    productId: 'prod_TrPi8Jrbx1yKCL',
    estimatedChats: '~230',
    bestValue: true,
  },
};

/**
 * Donation preset amounts
 */
export const DONATION_PRESETS = {
  5: {
    amount: 500, // cents
    priceId: 'price_1Sj5QyPAhBIL8qL1VpykxChM',
  },
  10: {
    amount: 1000,
    priceId: 'price_1Sj5QyPAhBIL8qL1lzZj6BwC',
  },
  25: {
    amount: 2500,
    priceId: 'price_1Sj5QzPAhBIL8qL14CC4axrj',
  },
  50: {
    amount: 5000,
    priceId: 'price_1Sj5QzPAhBIL8qL1hddvLFSq',
  },
};

// Support AutoRev product ID (for custom donation amounts)
export const DONATION_PRODUCT_ID = 'prod_TgSLv0JmV9iTZB';

/**
 * Payment Links (direct Stripe hosted checkout)
 * Can be used for simple integrations or sharing
 * Updated Jan 2026 with new pricing & products
 */
export const PAYMENT_LINKS = {
  // Subscriptions
  enthusiastMonthly: 'https://buy.stripe.com/3cIaEZeddcYM7Modc5cs80k',
  enthusiastAnnual: 'https://buy.stripe.com/8x2aEZ5GHgaY0jWeg9cs80e',
  proMonthly: 'https://buy.stripe.com/aFacN72uve2Q5Egeg9cs80f',
  proAnnual: 'https://buy.stripe.com/6oU3cx3yz8IwfeQ2xrcs80g',
  // AL Top-Up Packs
  alBoost: 'https://buy.stripe.com/cNi7sN7OPf6U0jWdc5cs80h',
  alPower: 'https://buy.stripe.com/14AdRb9WXaQE8Qsfkdcs80i',
  alTurbo: 'https://buy.stripe.com/aFacN75GH6AogiUfkdcs80j',
  // Donations
  donate5: 'https://buy.stripe.com/3cI14p0mn1g42s49ZTcs805',
  donate10: 'https://buy.stripe.com/9B63cx4CD7EsfeQ8VPcs806',
  donate25: 'https://buy.stripe.com/5kQbJ3fhh0c0c2Eb3Xcs807',
  donate50: 'https://buy.stripe.com/7sY3cx0mn2k8c2Edc5cs808',
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get subscription config by tier ID
 * @param {string} tierId - 'free', 'collector', or 'tuner'
 * @returns {Object|null} Subscription config
 */
export function getSubscriptionConfig(tierId) {
  return SUBSCRIPTION_TIERS[tierId] || null;
}

/**
 * Get tier ID from Stripe price ID
 * Checks both legacy priceId, monthly.priceId, and annual.priceId
 * @param {string} priceId - Stripe price ID
 * @returns {string|null} Tier ID
 */
export function getTierFromPriceId(priceId) {
  for (const [tierId, config] of Object.entries(SUBSCRIPTION_TIERS)) {
    // Check legacy priceId
    if (config.priceId === priceId) {
      return tierId;
    }
    // Check monthly.priceId
    if (config.monthly?.priceId === priceId) {
      return tierId;
    }
    // Check annual.priceId
    if (config.annual?.priceId === priceId) {
      return tierId;
    }
  }
  return null;
}

/**
 * Get billing interval from Stripe price ID
 * @param {string} priceId - Stripe price ID
 * @returns {'month'|'year'|null} Billing interval
 */
export function getIntervalFromPriceId(priceId) {
  for (const config of Object.values(SUBSCRIPTION_TIERS)) {
    if (config.monthly?.priceId === priceId || config.priceId === priceId) {
      return 'month';
    }
    if (config.annual?.priceId === priceId) {
      return 'year';
    }
  }
  return null;
}

/**
 * Get price ID for a tier and interval
 * @param {string} tierId - Tier ID ('collector' or 'tuner')
 * @param {'month'|'year'} interval - Billing interval
 * @returns {string|null} Stripe price ID
 */
export function getPriceIdForTier(tierId, interval = 'month') {
  const config = SUBSCRIPTION_TIERS[tierId];
  if (!config) return null;

  if (interval === 'year' && config.annual?.priceId) {
    return config.annual.priceId;
  }
  
  // Default to monthly
  return config.monthly?.priceId || config.priceId;
}

/**
 * Get pricing details for a tier
 * @param {string} tierId - Tier ID
 * @param {'month'|'year'} interval - Billing interval
 * @returns {Object} Pricing details including price, formatted price, savings
 */
export function getTierPricing(tierId, interval = 'month') {
  const config = SUBSCRIPTION_TIERS[tierId];
  if (!config) return null;

  if (interval === 'year' && config.annual) {
    return {
      price: config.annual.price,
      priceId: config.annual.priceId,
      interval: 'year',
      monthlyEquivalent: config.annual.monthlyEquivalent,
      savingsPercent: config.annual.savingsPercent,
      savingsAmount: config.annual.savingsAmount,
      formattedPrice: formatPrice(config.annual.price),
      formattedMonthly: formatPrice(config.annual.monthlyEquivalent),
      perMonthLabel: `${formatPrice(config.annual.monthlyEquivalent)}/mo`,
    };
  }

  // Monthly pricing
  const monthlyConfig = config.monthly || { price: config.price, priceId: config.priceId };
  return {
    price: monthlyConfig.price,
    priceId: monthlyConfig.priceId,
    interval: 'month',
    monthlyEquivalent: monthlyConfig.price,
    savingsPercent: 0,
    savingsAmount: 0,
    formattedPrice: formatPrice(monthlyConfig.price),
    formattedMonthly: formatPrice(monthlyConfig.price),
    perMonthLabel: `${formatPrice(monthlyConfig.price)}/mo`,
  };
}

/**
 * Get tier ID from Stripe product ID
 * @param {string} productId - Stripe product ID
 * @returns {string|null} Tier ID
 */
export function getTierFromProductId(productId) {
  for (const [tierId, config] of Object.entries(SUBSCRIPTION_TIERS)) {
    if (config.productId === productId) {
      return tierId;
    }
  }
  return null;
}

/**
 * Get AL credit pack config by ID
 * @param {string} packId - 'small', 'medium', or 'large'
 * @returns {Object|null} Credit pack config
 */
export function getCreditPackConfig(packId) {
  return AL_CREDIT_PACKS[packId] || null;
}

/**
 * Get credit pack from Stripe price ID
 * @param {string} priceId - Stripe price ID
 * @returns {Object|null} Credit pack config
 */
export function getCreditPackFromPriceId(priceId) {
  for (const [packId, config] of Object.entries(AL_CREDIT_PACKS)) {
    if (config.priceId === priceId) {
      return { packId, ...config };
    }
  }
  return null;
}

/**
 * Check if a product ID is for AL credits
 * @param {string} productId - Stripe product ID
 * @returns {boolean}
 */
export function isAlCreditProduct(productId) {
  return Object.values(AL_CREDIT_PACKS).some(pack => pack.productId === productId);
}

/**
 * Check if a product ID is for donations
 * @param {string} productId - Stripe product ID
 * @returns {boolean}
 */
export function isDonationProduct(productId) {
  return productId === DONATION_PRODUCT_ID;
}

/**
 * Format price in dollars
 * @param {number} cents - Amount in cents
 * @returns {string} Formatted price (e.g., "$4.99")
 */
export function formatPrice(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Map Stripe subscription status to internal status
 * @param {string} stripeStatus - Stripe subscription status
 * @returns {string} Internal status
 */
export function mapSubscriptionStatus(stripeStatus) {
  const statusMap = {
    'active': 'active',
    'trialing': 'trialing',
    'past_due': 'past_due',
    'canceled': 'canceled',
    'unpaid': 'past_due',
    'incomplete': 'none',
    'incomplete_expired': 'none',
    'paused': 'paused',
  };
  return statusMap[stripeStatus] || 'none';
}

const stripeConfig = {
  SUBSCRIPTION_TIERS,
  AL_CREDIT_PACKS,
  DONATION_PRESETS,
  DONATION_PRODUCT_ID,
  PAYMENT_LINKS,
  getSubscriptionConfig,
  getTierFromPriceId,
  getTierFromProductId,
  getIntervalFromPriceId,
  getPriceIdForTier,
  getTierPricing,
  getCreditPackConfig,
  getCreditPackFromPriceId,
  isAlCreditProduct,
  isDonationProduct,
  formatPrice,
  mapSubscriptionStatus,
};

export default stripeConfig;













