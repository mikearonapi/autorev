/**
 * Stripe Checkout Hook
 * 
 * Provides functions to initiate Stripe checkout for:
 * - Subscription upgrades
 * - AL credit pack purchases
 * - Donations
 * 
 * @module hooks/useCheckout
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useAuthModal } from '@/components/AuthModal';

/**
 * Hook for handling Stripe checkout flows
 * @returns {Object} Checkout functions and state
 */
export function useCheckout() {
  const { user, isLoading: authLoading } = useAuth();
  const authModal = useAuthModal();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Start subscription checkout
   * @param {'collector' | 'tuner'} tier - Subscription tier
   */
  const checkoutSubscription = useCallback(async (tier) => {
    if (!user) {
      // Store intended tier and open auth modal
      localStorage.setItem('autorev_checkout_intent', JSON.stringify({ type: 'subscription', tier }));
      authModal.openSignUp();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'subscription', tier }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Checkout failed');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      console.error('[Checkout] Subscription error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user, authModal]);

  /**
   * Start AL credit pack checkout
   * @param {'small' | 'medium' | 'large'} pack - Credit pack size
   */
  const checkoutCredits = useCallback(async (pack) => {
    if (!user) {
      localStorage.setItem('autorev_checkout_intent', JSON.stringify({ type: 'credits', pack }));
      authModal.openSignUp();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'credits', pack }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Checkout failed');
      }

      window.location.href = data.url;
    } catch (err) {
      console.error('[Checkout] Credits error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user, authModal]);

  /**
   * Start donation checkout
   * @param {number} amount - Preset amount (5, 10, 25, 50) or null for custom
   * @param {number} [customAmount] - Custom amount in cents (min 100 = $1)
   */
  const checkoutDonation = useCallback(async (amount, customAmount = null) => {
    // Donations can work without login, but we'll associate if logged in
    setIsLoading(true);
    setError(null);

    try {
      const body = { type: 'donation' };
      
      if (customAmount) {
        body.donationAmount = customAmount;
      } else if (amount) {
        body.amount = amount;
      } else {
        throw new Error('Donation amount required');
      }

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Checkout failed');
      }

      window.location.href = data.url;
    } catch (err) {
      console.error('[Checkout] Donation error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Resume checkout after login (called from auth callback or profile)
   */
  const resumeCheckout = useCallback(async () => {
    const intentStr = localStorage.getItem('autorev_checkout_intent');
    if (!intentStr || !user) return false;

    try {
      const intent = JSON.parse(intentStr);
      localStorage.removeItem('autorev_checkout_intent');

      if (intent.type === 'subscription') {
        await checkoutSubscription(intent.tier);
        return true;
      } else if (intent.type === 'credits') {
        await checkoutCredits(intent.pack);
        return true;
      }
    } catch (err) {
      console.error('[Checkout] Resume error:', err);
      localStorage.removeItem('autorev_checkout_intent');
    }

    return false;
  }, [user, checkoutSubscription, checkoutCredits]);

  return {
    checkoutSubscription,
    checkoutCredits,
    checkoutDonation,
    resumeCheckout,
    isLoading: isLoading || authLoading,
    error,
    clearError: () => setError(null),
  };
}

export default useCheckout;

