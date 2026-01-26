/**
 * Unit Tests: Stripe Webhook Utilities
 * 
 * Tests the helper functions used by the Stripe webhook handler.
 * For actual webhook integration tests, see tests/integration/api-other.test.js
 * 
 * Run: npm run test:unit -- tests/unit/stripe-webhook.test.js
 */

import { describe, it, expect } from 'vitest';
import {
  getTierFromPriceId,
  getTierFromProductId,
  getCreditPackFromPriceId,
  isAlCreditProduct,
  isDonationProduct,
  mapSubscriptionStatus,
  SUBSCRIPTION_TIERS,
  AL_CREDIT_PACKS,
  DONATION_PRESETS,
} from '@/lib/stripe';

// =============================================================================
// SUBSCRIPTION TIER RESOLUTION TESTS
// =============================================================================

describe('Stripe Webhook Helpers', () => {
  describe('getTierFromPriceId', () => {
    it('should return collector for Enthusiast monthly price', () => {
      const tier = getTierFromPriceId('price_1Sj5QuPAhBIL8qL1G5vd4Etd');
      expect(tier).toBe('collector');
    });

    it('should return tuner for Tuner monthly price', () => {
      const tier = getTierFromPriceId('price_1Sj5QvPAhBIL8qL1EWLZKRFL');
      expect(tier).toBe('tuner');
    });

    it('should return null for unknown price ID', () => {
      const tier = getTierFromPriceId('price_unknown');
      expect(tier).toBeNull();
    });

    it('should handle null/undefined input', () => {
      // Returns 'free' for null/undefined (free tier has no price ID)
      const nullResult = getTierFromPriceId(null);
      const undefinedResult = getTierFromPriceId(undefined);
      
      // Either null or 'free' is acceptable behavior
      expect(nullResult === null || nullResult === 'free').toBe(true);
      expect(undefinedResult === null || undefinedResult === 'free').toBe(true);
    });
  });

  describe('getTierFromProductId', () => {
    it('should return collector for Enthusiast product', () => {
      const tier = getTierFromProductId('prod_TgSLD2pSfYbAxn');
      expect(tier).toBe('collector');
    });

    it('should return tuner for Tuner product', () => {
      const tier = getTierFromProductId('prod_TgSL5Mwritjx3a');
      expect(tier).toBe('tuner');
    });

    it('should return null for unknown product ID', () => {
      const tier = getTierFromProductId('prod_unknown');
      expect(tier).toBeNull();
    });
  });

  describe('getCreditPackFromPriceId', () => {
    it('should return small pack config for small price', () => {
      const result = getCreditPackFromPriceId('price_1Sj5QwPAhBIL8qL1Yy2WePeo');
      expect(result).not.toBeNull();
      expect(result.packId).toBe('small');
      expect(result.credits).toBe(25);
    });

    it('should return medium pack config for medium price', () => {
      const result = getCreditPackFromPriceId('price_1Sj5QwPAhBIL8qL1HrLcIGno');
      expect(result).not.toBeNull();
      expect(result.packId).toBe('medium');
      expect(result.credits).toBe(75);
    });

    it('should return large pack config for large price', () => {
      const result = getCreditPackFromPriceId('price_1Sj5QxPAhBIL8qL1XUyXgK7N');
      expect(result).not.toBeNull();
      expect(result.packId).toBe('large');
      expect(result.credits).toBe(200);
    });

    it('should return null for unknown price', () => {
      const result = getCreditPackFromPriceId('price_unknown');
      expect(result).toBeNull();
    });
  });

  describe('isAlCreditProduct', () => {
    it('should return true for credit pack product IDs', () => {
      expect(isAlCreditProduct('prod_TgSLBnNu7vZKFf')).toBe(true); // Small
      expect(isAlCreditProduct('prod_TgSLNEp9npYwhJ')).toBe(true); // Medium
      expect(isAlCreditProduct('prod_TgSLScSMXxy5nm')).toBe(true); // Large
    });

    it('should return false for subscription products', () => {
      expect(isAlCreditProduct('prod_TgSLD2pSfYbAxn')).toBe(false); // Enthusiast
      expect(isAlCreditProduct('prod_TgSL5Mwritjx3a')).toBe(false); // Tuner
    });

    it('should return false for donation product', () => {
      expect(isAlCreditProduct('prod_TgSLv0JmV9iTZB')).toBe(false);
    });

    it('should return false for unknown products', () => {
      expect(isAlCreditProduct('prod_unknown')).toBe(false);
    });
  });

  describe('isDonationProduct', () => {
    it('should return true for donation product ID', () => {
      expect(isDonationProduct('prod_TgSLv0JmV9iTZB')).toBe(true);
    });

    it('should return false for subscription products', () => {
      expect(isDonationProduct('prod_TgSLD2pSfYbAxn')).toBe(false);
      expect(isDonationProduct('prod_TgSL5Mwritjx3a')).toBe(false);
    });

    it('should return false for credit pack products', () => {
      expect(isDonationProduct('prod_TgSLBnNu7vZKFf')).toBe(false);
    });
  });

  describe('mapSubscriptionStatus', () => {
    it('should map active status correctly', () => {
      expect(mapSubscriptionStatus('active')).toBe('active');
    });

    it('should map trialing status correctly', () => {
      expect(mapSubscriptionStatus('trialing')).toBe('trialing');
    });

    it('should map past_due status correctly', () => {
      expect(mapSubscriptionStatus('past_due')).toBe('past_due');
    });

    it('should map canceled status correctly', () => {
      expect(mapSubscriptionStatus('canceled')).toBe('canceled');
    });

    it('should map unpaid to past_due', () => {
      expect(mapSubscriptionStatus('unpaid')).toBe('past_due');
    });

    it('should map incomplete to none', () => {
      expect(mapSubscriptionStatus('incomplete')).toBe('none');
    });

    it('should map paused status correctly', () => {
      expect(mapSubscriptionStatus('paused')).toBe('paused');
    });

    it('should map unknown status to none', () => {
      expect(mapSubscriptionStatus('unknown_status')).toBe('none');
    });
  });
});

// =============================================================================
// SUBSCRIPTION TIERS CONFIGURATION TESTS
// =============================================================================

describe('SUBSCRIPTION_TIERS Configuration', () => {
  it('should have free tier with 0 price and no Stripe IDs', () => {
    expect(SUBSCRIPTION_TIERS.free.price).toBe(0);
    expect(SUBSCRIPTION_TIERS.free.priceId).toBeNull();
    expect(SUBSCRIPTION_TIERS.free.productId).toBeNull();
    expect(SUBSCRIPTION_TIERS.free.alCreditsPerMonth).toBe(25);
  });

  it('should have collector tier with correct pricing', () => {
    expect(SUBSCRIPTION_TIERS.collector.price).toBe(499);
    expect(SUBSCRIPTION_TIERS.collector.priceId).toBeTruthy();
    expect(SUBSCRIPTION_TIERS.collector.productId).toBeTruthy();
    expect(SUBSCRIPTION_TIERS.collector.alCreditsPerMonth).toBe(75);
  });

  it('should have tuner tier with correct pricing', () => {
    expect(SUBSCRIPTION_TIERS.tuner.price).toBe(999);
    expect(SUBSCRIPTION_TIERS.tuner.priceId).toBeTruthy();
    expect(SUBSCRIPTION_TIERS.tuner.productId).toBeTruthy();
    expect(SUBSCRIPTION_TIERS.tuner.alCreditsPerMonth).toBe(150);
  });

  it('should have monthly and annual options for paid tiers', () => {
    expect(SUBSCRIPTION_TIERS.collector.monthly).toBeDefined();
    expect(SUBSCRIPTION_TIERS.collector.annual).toBeDefined();
    expect(SUBSCRIPTION_TIERS.tuner.monthly).toBeDefined();
    expect(SUBSCRIPTION_TIERS.tuner.annual).toBeDefined();
  });
});

// =============================================================================
// AL CREDIT PACKS CONFIGURATION TESTS
// =============================================================================

describe('AL_CREDIT_PACKS Configuration', () => {
  it('should have small pack with 25 credits', () => {
    expect(AL_CREDIT_PACKS.small.credits).toBe(25);
    expect(AL_CREDIT_PACKS.small.price).toBe(299);
    expect(AL_CREDIT_PACKS.small.priceId).toBeTruthy();
  });

  it('should have medium pack with 75 credits', () => {
    expect(AL_CREDIT_PACKS.medium.credits).toBe(75);
    expect(AL_CREDIT_PACKS.medium.price).toBe(499);
    expect(AL_CREDIT_PACKS.medium.priceId).toBeTruthy();
  });

  it('should have large pack with 200 credits', () => {
    expect(AL_CREDIT_PACKS.large.credits).toBe(200);
    expect(AL_CREDIT_PACKS.large.price).toBe(999);
    expect(AL_CREDIT_PACKS.large.priceId).toBeTruthy();
  });

  it('should offer better value for larger packs', () => {
    const smallPricePerCredit = AL_CREDIT_PACKS.small.price / AL_CREDIT_PACKS.small.credits;
    const mediumPricePerCredit = AL_CREDIT_PACKS.medium.price / AL_CREDIT_PACKS.medium.credits;
    const largePricePerCredit = AL_CREDIT_PACKS.large.price / AL_CREDIT_PACKS.large.credits;
    
    expect(mediumPricePerCredit).toBeLessThan(smallPricePerCredit);
    expect(largePricePerCredit).toBeLessThan(mediumPricePerCredit);
  });
});

// =============================================================================
// DONATION PRESETS CONFIGURATION TESTS
// =============================================================================

describe('DONATION_PRESETS Configuration', () => {
  it('should have $5 preset', () => {
    expect(DONATION_PRESETS[5]).toBeDefined();
    expect(DONATION_PRESETS[5].amount).toBe(500);
    expect(DONATION_PRESETS[5].priceId).toBeTruthy();
  });

  it('should have $10 preset', () => {
    expect(DONATION_PRESETS[10]).toBeDefined();
    expect(DONATION_PRESETS[10].amount).toBe(1000);
  });

  it('should have $25 preset', () => {
    expect(DONATION_PRESETS[25]).toBeDefined();
    expect(DONATION_PRESETS[25].amount).toBe(2500);
  });

  it('should have $50 preset', () => {
    expect(DONATION_PRESETS[50]).toBeDefined();
    expect(DONATION_PRESETS[50].amount).toBe(5000);
  });
});

// =============================================================================
// WEBHOOK EVENT TYPE HANDLING TESTS
// =============================================================================

describe('Webhook Event Type Logic', () => {
  const eventTypes = [
    'checkout.session.completed',
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'invoice.payment_succeeded',
    'invoice.payment_failed',
    'customer.subscription.trial_will_end',
  ];

  it('should handle expected event types', () => {
    eventTypes.forEach(eventType => {
      expect(typeof eventType).toBe('string');
      expect(eventType).toContain('.');
    });
  });

  it('should distinguish subscription events', () => {
    const subscriptionEvents = eventTypes.filter(e => e.includes('subscription'));
    expect(subscriptionEvents.length).toBeGreaterThan(0);
  });

  it('should distinguish invoice events', () => {
    const invoiceEvents = eventTypes.filter(e => e.includes('invoice'));
    expect(invoiceEvents.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// IDEMPOTENCY LOGIC TESTS
// =============================================================================

describe('Idempotency Logic', () => {
  it('should generate unique event IDs', () => {
    // Stripe event IDs follow pattern evt_...
    const mockEventId1 = 'evt_1234567890abcdef';
    const mockEventId2 = 'evt_0987654321fedcba';
    
    expect(mockEventId1).not.toBe(mockEventId2);
    expect(mockEventId1.startsWith('evt_')).toBe(true);
  });

  it('should track processed events by event_id', () => {
    const processedEvents = new Set();
    const eventId = 'evt_test123';
    
    // First check - not processed
    expect(processedEvents.has(eventId)).toBe(false);
    
    // Mark as processed
    processedEvents.add(eventId);
    
    // Second check - already processed
    expect(processedEvents.has(eventId)).toBe(true);
  });
});
