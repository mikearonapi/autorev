/**
 * Stripe Integration Tests
 * 
 * Tests to validate Stripe configuration and wiring
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
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
} from '../lib/stripe.js';

// =============================================================================
// STRIPE PRODUCT/PRICE CONFIGURATION TESTS
// =============================================================================

// Expected Stripe IDs from live Stripe account
const EXPECTED_PRODUCTS = {
  'prod_TgSLD2pSfYbAxn': 'Enthusiast Plan',
  'prod_TgSL5Mwritjx3a': 'Tuner Plan',
  'prod_TgSLBnNu7vZKFf': 'AL AI Credit Pack - Small',
  'prod_TgSLNEp9npYwhJ': 'AL AI Credit Pack - Medium',
  'prod_TgSLScSMXxy5nm': 'AL AI Credit Pack - Large',
  'prod_TgSLv0JmV9iTZB': 'Support AutoRev',
};

const EXPECTED_PRICES = {
  'price_1Sj5QuPAhBIL8qL1G5vd4Etd': { amount: 499, product: 'prod_TgSLD2pSfYbAxn' },
  'price_1Sj5QvPAhBIL8qL1EWLZKRFL': { amount: 999, product: 'prod_TgSL5Mwritjx3a' },
  'price_1Sj5QwPAhBIL8qL1Yy2WePeo': { amount: 299, product: 'prod_TgSLBnNu7vZKFf' },
  'price_1Sj5QwPAhBIL8qL1HrLcIGno': { amount: 499, product: 'prod_TgSLNEp9npYwhJ' },
  'price_1Sj5QxPAhBIL8qL1XUyXgK7N': { amount: 999, product: 'prod_TgSLScSMXxy5nm' },
  'price_1Sj5QyPAhBIL8qL1VpykxChM': { amount: 500, product: 'prod_TgSLv0JmV9iTZB' },
  'price_1Sj5QyPAhBIL8qL1lzZj6BwC': { amount: 1000, product: 'prod_TgSLv0JmV9iTZB' },
  'price_1Sj5QzPAhBIL8qL14CC4axrj': { amount: 2500, product: 'prod_TgSLv0JmV9iTZB' },
  'price_1Sj5QzPAhBIL8qL1hddvLFSq': { amount: 5000, product: 'prod_TgSLv0JmV9iTZB' },
};

describe('Stripe Configuration', () => {
  
  describe('Subscription Tiers', () => {
    test('has free tier with no Stripe product', () => {
      assert.ok(SUBSCRIPTION_TIERS.free, 'Free tier should exist');
      assert.strictEqual(SUBSCRIPTION_TIERS.free.priceId, null);
      assert.strictEqual(SUBSCRIPTION_TIERS.free.price, 0);
    });

    test('has collector tier with correct Stripe price ID', () => {
      assert.ok(SUBSCRIPTION_TIERS.collector, 'Collector tier should exist');
      assert.strictEqual(SUBSCRIPTION_TIERS.collector.priceId, 'price_1Sj5QuPAhBIL8qL1G5vd4Etd');
      assert.strictEqual(SUBSCRIPTION_TIERS.collector.productId, 'prod_TgSLD2pSfYbAxn');
      assert.strictEqual(SUBSCRIPTION_TIERS.collector.price, 499);
    });

    test('has tuner tier with correct Stripe price ID', () => {
      assert.ok(SUBSCRIPTION_TIERS.tuner, 'Tuner tier should exist');
      assert.strictEqual(SUBSCRIPTION_TIERS.tuner.priceId, 'price_1Sj5QvPAhBIL8qL1EWLZKRFL');
      assert.strictEqual(SUBSCRIPTION_TIERS.tuner.productId, 'prod_TgSL5Mwritjx3a');
      assert.strictEqual(SUBSCRIPTION_TIERS.tuner.price, 999);
    });

    test('all subscription price IDs match Stripe', () => {
      // Verify collector
      assert.ok(EXPECTED_PRICES[SUBSCRIPTION_TIERS.collector.priceId], 'Collector price should exist in Stripe');
      assert.strictEqual(EXPECTED_PRICES[SUBSCRIPTION_TIERS.collector.priceId].amount, 499);
      
      // Verify tuner
      assert.ok(EXPECTED_PRICES[SUBSCRIPTION_TIERS.tuner.priceId], 'Tuner price should exist in Stripe');
      assert.strictEqual(EXPECTED_PRICES[SUBSCRIPTION_TIERS.tuner.priceId].amount, 999);
    });
  });

  describe('AL Credit Packs', () => {
    test('has small pack with correct config', () => {
      assert.ok(AL_CREDIT_PACKS.small, 'Small pack should exist');
      assert.strictEqual(AL_CREDIT_PACKS.small.priceId, 'price_1Sj5QwPAhBIL8qL1Yy2WePeo');
      assert.strictEqual(AL_CREDIT_PACKS.small.productId, 'prod_TgSLBnNu7vZKFf');
      assert.strictEqual(AL_CREDIT_PACKS.small.credits, 25);
      assert.strictEqual(AL_CREDIT_PACKS.small.price, 299);
    });

    test('has medium pack with correct config', () => {
      assert.ok(AL_CREDIT_PACKS.medium, 'Medium pack should exist');
      assert.strictEqual(AL_CREDIT_PACKS.medium.priceId, 'price_1Sj5QwPAhBIL8qL1HrLcIGno');
      assert.strictEqual(AL_CREDIT_PACKS.medium.productId, 'prod_TgSLNEp9npYwhJ');
      assert.strictEqual(AL_CREDIT_PACKS.medium.credits, 75);
      assert.strictEqual(AL_CREDIT_PACKS.medium.price, 499);
    });

    test('has large pack with correct config', () => {
      assert.ok(AL_CREDIT_PACKS.large, 'Large pack should exist');
      assert.strictEqual(AL_CREDIT_PACKS.large.priceId, 'price_1Sj5QxPAhBIL8qL1XUyXgK7N');
      assert.strictEqual(AL_CREDIT_PACKS.large.productId, 'prod_TgSLScSMXxy5nm');
      assert.strictEqual(AL_CREDIT_PACKS.large.credits, 200);
      assert.strictEqual(AL_CREDIT_PACKS.large.price, 999);
    });

    test('all credit pack price IDs match Stripe', () => {
      Object.values(AL_CREDIT_PACKS).forEach(pack => {
        assert.ok(EXPECTED_PRICES[pack.priceId], `Price ${pack.priceId} should exist in Stripe`);
        assert.strictEqual(EXPECTED_PRICES[pack.priceId].amount, pack.price);
      });
    });
  });

  describe('Donation Presets', () => {
    test('has $5 donation preset', () => {
      assert.ok(DONATION_PRESETS[5], '$5 preset should exist');
      assert.strictEqual(DONATION_PRESETS[5].priceId, 'price_1Sj5QyPAhBIL8qL1VpykxChM');
      assert.strictEqual(DONATION_PRESETS[5].amount, 500);
    });

    test('has $10 donation preset', () => {
      assert.ok(DONATION_PRESETS[10], '$10 preset should exist');
      assert.strictEqual(DONATION_PRESETS[10].priceId, 'price_1Sj5QyPAhBIL8qL1lzZj6BwC');
      assert.strictEqual(DONATION_PRESETS[10].amount, 1000);
    });

    test('has $25 donation preset', () => {
      assert.ok(DONATION_PRESETS[25], '$25 preset should exist');
      assert.strictEqual(DONATION_PRESETS[25].priceId, 'price_1Sj5QzPAhBIL8qL14CC4axrj');
      assert.strictEqual(DONATION_PRESETS[25].amount, 2500);
    });

    test('has $50 donation preset', () => {
      assert.ok(DONATION_PRESETS[50], '$50 preset should exist');
      assert.strictEqual(DONATION_PRESETS[50].priceId, 'price_1Sj5QzPAhBIL8qL1hddvLFSq');
      assert.strictEqual(DONATION_PRESETS[50].amount, 5000);
    });

    test('all donation price IDs match Stripe', () => {
      Object.values(DONATION_PRESETS).forEach(preset => {
        assert.ok(EXPECTED_PRICES[preset.priceId], `Price ${preset.priceId} should exist in Stripe`);
        assert.strictEqual(EXPECTED_PRICES[preset.priceId].amount, preset.amount);
      });
    });

    test('donation product ID is correct', () => {
      assert.strictEqual(DONATION_PRODUCT_ID, 'prod_TgSLv0JmV9iTZB');
      assert.strictEqual(EXPECTED_PRODUCTS[DONATION_PRODUCT_ID], 'Support AutoRev');
    });
  });

  describe('Payment Links', () => {
    test('all payment links are valid URLs', () => {
      Object.entries(PAYMENT_LINKS).forEach(([key, url]) => {
        assert.match(url, /^https:\/\/buy\.stripe\.com\//, `${key} should be a valid Stripe payment link`);
      });
    });

    test('has all required payment links', () => {
      assert.ok(PAYMENT_LINKS.enthusiast, 'enthusiast link should exist');
      assert.ok(PAYMENT_LINKS.tuner, 'tuner link should exist');
      assert.ok(PAYMENT_LINKS.creditPackSmall, 'creditPackSmall link should exist');
      assert.ok(PAYMENT_LINKS.creditPackMedium, 'creditPackMedium link should exist');
      assert.ok(PAYMENT_LINKS.creditPackLarge, 'creditPackLarge link should exist');
      assert.ok(PAYMENT_LINKS.donate5, 'donate5 link should exist');
      assert.ok(PAYMENT_LINKS.donate10, 'donate10 link should exist');
      assert.ok(PAYMENT_LINKS.donate25, 'donate25 link should exist');
      assert.ok(PAYMENT_LINKS.donate50, 'donate50 link should exist');
    });
  });
});

// =============================================================================
// HELPER FUNCTION TESTS
// =============================================================================

describe('Stripe Helper Functions', () => {
  describe('getSubscriptionConfig', () => {
    test('returns correct config for valid tier', () => {
      const collector = getSubscriptionConfig('collector');
      assert.ok(collector, 'Collector config should exist');
      assert.strictEqual(collector.tier, 'collector');
      assert.strictEqual(collector.priceId, 'price_1Sj5QuPAhBIL8qL1G5vd4Etd');
    });

    test('returns null for invalid tier', () => {
      assert.strictEqual(getSubscriptionConfig('invalid'), null);
    });
  });

  describe('getTierFromPriceId', () => {
    test('returns collector for Enthusiast price', () => {
      assert.strictEqual(getTierFromPriceId('price_1Sj5QuPAhBIL8qL1G5vd4Etd'), 'collector');
    });

    test('returns tuner for Tuner price', () => {
      assert.strictEqual(getTierFromPriceId('price_1Sj5QvPAhBIL8qL1EWLZKRFL'), 'tuner');
    });

    test('returns null for unknown price', () => {
      assert.strictEqual(getTierFromPriceId('price_unknown'), null);
    });
  });

  describe('getTierFromProductId', () => {
    test('returns collector for Enthusiast product', () => {
      assert.strictEqual(getTierFromProductId('prod_TgSLD2pSfYbAxn'), 'collector');
    });

    test('returns tuner for Tuner product', () => {
      assert.strictEqual(getTierFromProductId('prod_TgSL5Mwritjx3a'), 'tuner');
    });

    test('returns null for unknown product', () => {
      assert.strictEqual(getTierFromProductId('prod_unknown'), null);
    });
  });

  describe('getCreditPackConfig', () => {
    test('returns correct config for valid pack', () => {
      const medium = getCreditPackConfig('medium');
      assert.ok(medium, 'Medium pack config should exist');
      assert.strictEqual(medium.credits, 75);
    });

    test('returns null for invalid pack', () => {
      assert.strictEqual(getCreditPackConfig('invalid'), null);
    });
  });

  describe('getCreditPackFromPriceId', () => {
    test('returns pack config for valid price', () => {
      const result = getCreditPackFromPriceId('price_1Sj5QwPAhBIL8qL1Yy2WePeo');
      assert.ok(result, 'Should return pack config');
      assert.strictEqual(result.packId, 'small');
      assert.strictEqual(result.credits, 25);
    });

    test('returns null for unknown price', () => {
      assert.strictEqual(getCreditPackFromPriceId('price_unknown'), null);
    });
  });

  describe('isAlCreditProduct', () => {
    test('returns true for credit pack products', () => {
      assert.strictEqual(isAlCreditProduct('prod_TgSLBnNu7vZKFf'), true); // Small
      assert.strictEqual(isAlCreditProduct('prod_TgSLNEp9npYwhJ'), true); // Medium
      assert.strictEqual(isAlCreditProduct('prod_TgSLScSMXxy5nm'), true); // Large
    });

    test('returns false for subscription products', () => {
      assert.strictEqual(isAlCreditProduct('prod_TgSLD2pSfYbAxn'), false); // Enthusiast
      assert.strictEqual(isAlCreditProduct('prod_TgSL5Mwritjx3a'), false); // Tuner
    });

    test('returns false for donation product', () => {
      assert.strictEqual(isAlCreditProduct('prod_TgSLv0JmV9iTZB'), false);
    });
  });

  describe('isDonationProduct', () => {
    test('returns true for donation product', () => {
      assert.strictEqual(isDonationProduct('prod_TgSLv0JmV9iTZB'), true);
    });

    test('returns false for other products', () => {
      assert.strictEqual(isDonationProduct('prod_TgSLD2pSfYbAxn'), false);
      assert.strictEqual(isDonationProduct('prod_TgSLBnNu7vZKFf'), false);
    });
  });

  describe('formatPrice', () => {
    test('formats cents to dollars correctly', () => {
      assert.strictEqual(formatPrice(499), '$4.99');
      assert.strictEqual(formatPrice(999), '$9.99');
      assert.strictEqual(formatPrice(100), '$1.00');
      assert.strictEqual(formatPrice(5000), '$50.00');
    });
  });

  describe('mapSubscriptionStatus', () => {
    test('maps Stripe statuses correctly', () => {
      assert.strictEqual(mapSubscriptionStatus('active'), 'active');
      assert.strictEqual(mapSubscriptionStatus('trialing'), 'trialing');
      assert.strictEqual(mapSubscriptionStatus('past_due'), 'past_due');
      assert.strictEqual(mapSubscriptionStatus('canceled'), 'canceled');
      assert.strictEqual(mapSubscriptionStatus('unpaid'), 'past_due');
      assert.strictEqual(mapSubscriptionStatus('incomplete'), 'none');
      assert.strictEqual(mapSubscriptionStatus('paused'), 'paused');
    });

    test('returns none for unknown status', () => {
      assert.strictEqual(mapSubscriptionStatus('unknown_status'), 'none');
    });
  });
});
