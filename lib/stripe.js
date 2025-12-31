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
 */
export const SUBSCRIPTION_TIERS = {
  free: {
    tier: 'free',
    name: 'Free',
    price: 0,
    priceId: null, // No Stripe product for free tier
    alCreditsPerMonth: 25,
  },
  collector: {
    tier: 'collector',
    name: 'Enthusiast',
    price: 499, // cents
    priceId: 'price_1Sj5QuPAhBIL8qL1G5vd4Etd',
    productId: 'prod_TgSLD2pSfYbAxn',
    alCreditsPerMonth: 75,
  },
  tuner: {
    tier: 'tuner',
    name: 'Tuner',
    price: 999, // cents
    priceId: 'price_1Sj5QvPAhBIL8qL1EWLZKRFL',
    productId: 'prod_TgSL5Mwritjx3a',
    alCreditsPerMonth: 150,
  },
};

/**
 * AL AI Credit Packs (one-time purchases)
 */
export const AL_CREDIT_PACKS = {
  small: {
    id: 'small',
    name: 'Small Pack',
    credits: 25,
    price: 299, // cents ($2.99)
    priceId: 'price_1Sj5QwPAhBIL8qL1Yy2WePeo',
    productId: 'prod_TgSLBnNu7vZKFf',
  },
  medium: {
    id: 'medium',
    name: 'Medium Pack',
    credits: 75,
    price: 499, // cents ($4.99)
    priceId: 'price_1Sj5QwPAhBIL8qL1HrLcIGno',
    productId: 'prod_TgSLNEp9npYwhJ',
  },
  large: {
    id: 'large',
    name: 'Large Pack',
    credits: 200,
    price: 999, // cents ($9.99)
    priceId: 'price_1Sj5QxPAhBIL8qL1XUyXgK7N',
    productId: 'prod_TgSLScSMXxy5nm',
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
 */
export const PAYMENT_LINKS = {
  enthusiast: 'https://buy.stripe.com/eVqfZj8ST2k82s45JDcs800',
  tuner: 'https://buy.stripe.com/14A5kF9WXaQE4Acdc5cs801',
  creditPackSmall: 'https://buy.stripe.com/3cI3cx5GH5wk9Uw0pjcs802',
  creditPackMedium: 'https://buy.stripe.com/8x24gB4CD7Es4Acfkdcs803',
  creditPackLarge: 'https://buy.stripe.com/bJeeVf3yz2k86Ik0pjcs804',
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
 * @param {string} priceId - Stripe price ID
 * @returns {string|null} Tier ID
 */
export function getTierFromPriceId(priceId) {
  for (const [tierId, config] of Object.entries(SUBSCRIPTION_TIERS)) {
    if (config.priceId === priceId) {
      return tierId;
    }
  }
  return null;
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

export default {
  SUBSCRIPTION_TIERS,
  AL_CREDIT_PACKS,
  DONATION_PRESETS,
  DONATION_PRODUCT_ID,
  PAYMENT_LINKS,
  getSubscriptionConfig,
  getTierFromPriceId,
  getTierFromProductId,
  getCreditPackConfig,
  getCreditPackFromPriceId,
  isAlCreditProduct,
  isDonationProduct,
  formatPrice,
  mapSubscriptionStatus,
};




