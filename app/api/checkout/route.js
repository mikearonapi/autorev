/**
 * Stripe Checkout Session Creator
 * 
 * Creates checkout sessions for:
 * - Subscription upgrades (Enthusiast, Tuner)
 * - AL credit pack purchases
 * - Donations (preset or custom amount)
 * 
 * @route POST /api/checkout
 */

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAuthenticatedClient, createServerSupabaseClient, getBearerToken } from '@/lib/supabaseServer';
import {
  SUBSCRIPTION_TIERS,
  AL_CREDIT_PACKS,
  DONATION_PRESETS,
  DONATION_PRODUCT_ID,
  getPriceIdForTier,
  getTierPricing,
} from '@/lib/stripe';
import { logServerError } from '@/lib/serverErrorLogger';
import { errors } from '@/lib/apiErrors';
import { rateLimit } from '@/lib/rateLimit';
import { checkTrialEligibility } from '@/lib/fraudPreventionService';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Get or create Stripe customer for user
 */
async function getOrCreateStripeCustomer(supabase, user) {
  // Check if user already has a Stripe customer ID
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  if (profile?.stripe_customer_id) {
    return profile.stripe_customer_id;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.user_metadata?.full_name || user.user_metadata?.name,
    metadata: {
      autorev_user_id: user.id,
    },
  });

  // Save to profile
  await supabase
    .from('user_profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', user.id);

  return customer.id;
}

export async function POST(request) {
  // Rate limit: 5 requests per minute for checkout
  const rateLimited = rateLimit(request, 'checkout');
  if (rateLimited) return rateLimited;

  try {
    // Support both cookie and Bearer token auth
    const bearerToken = getBearerToken(request);
    const supabase = bearerToken 
      ? createAuthenticatedClient(bearerToken) 
      : await createServerSupabaseClient();

    if (!supabase) {
      return errors.serviceUnavailable('Authentication service');
    }

    // Get authenticated user
    const { data: { user }, error: authError } = bearerToken
      ? await supabase.auth.getUser(bearerToken)
      : await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, tier, pack, amount, donationAmount, interval = 'month' } = body;

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(supabase, user);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://autorev.app';
    let sessionConfig = {
      customer: customerId,
      success_url: `${baseUrl}/profile?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/join?checkout=canceled`,
      metadata: {
        autorev_user_id: user.id,
        type,
      },
    };

    // ==========================================================================
    // SUBSCRIPTION CHECKOUT / UPGRADE
    // ==========================================================================
    if (type === 'subscription') {
      const tierConfig = SUBSCRIPTION_TIERS[tier];
      
      if (!tierConfig) {
        return NextResponse.json(
          { error: 'Invalid subscription tier' },
          { status: 400 }
        );
      }

      // Get the correct price ID based on interval (month or year)
      const billingInterval = interval === 'year' ? 'year' : 'month';
      const priceId = getPriceIdForTier(tier, billingInterval);
      
      if (!priceId) {
        return NextResponse.json(
          { error: `No ${billingInterval}ly pricing available for this tier` },
          { status: 400 }
        );
      }

      // Get pricing details for metadata
      const pricingDetails = getTierPricing(tier, billingInterval);

      // Check if user has an existing active subscription
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('stripe_subscription_id, stripe_subscription_status, subscription_tier')
        .eq('id', user.id)
        .single();

      const hasActiveSubscription = profile?.stripe_subscription_id && 
        ['active', 'trialing'].includes(profile?.stripe_subscription_status);

      // ==========================================================================
      // UPGRADE EXISTING SUBSCRIPTION (with proration)
      // ==========================================================================
      if (hasActiveSubscription) {
        try {
          // Get the current subscription from Stripe
          const currentSubscription = await stripe.subscriptions.retrieve(
            profile.stripe_subscription_id
          );

          // Get the subscription item ID (first item)
          const subscriptionItemId = currentSubscription.items.data[0]?.id;
          
          if (!subscriptionItemId) {
            throw new Error('No subscription item found');
          }

          // Check if this is actually an upgrade (not same tier or downgrade)
          const TIER_LEVELS = { free: 0, collector: 1, tuner: 2 };
          const currentLevel = TIER_LEVELS[profile.subscription_tier] || 0;
          const targetLevel = TIER_LEVELS[tier] || 0;

          if (targetLevel <= currentLevel) {
            return NextResponse.json(
              { 
                error: 'To downgrade or manage your subscription, please use the customer portal.',
                redirectToPortal: true,
              },
              { status: 400 }
            );
          }

          // Update the subscription with proration
          const updatedSubscription = await stripe.subscriptions.update(
            profile.stripe_subscription_id,
            {
              items: [{
                id: subscriptionItemId,
                price: priceId,
              }],
              // 'create_prorations' - Credit/debit applied to next invoice
              // 'always_invoice' - Invoice immediately
              // 'none' - No proration
              proration_behavior: 'create_prorations',
              metadata: {
                autorev_user_id: user.id,
                tier,
                interval: billingInterval,
                upgrade_from: profile.subscription_tier,
              },
            }
          );

          console.log('[Checkout] Subscription upgraded:', {
            userId: user.id,
            from: profile.subscription_tier,
            to: tier,
            subscriptionId: updatedSubscription.id,
          });

          // Return success with upgrade details instead of redirect URL
          return NextResponse.json({
            success: true,
            type: 'upgrade',
            message: `Successfully upgraded to ${tier}. Proration will be applied on your next invoice.`,
            subscription: {
              id: updatedSubscription.id,
              status: updatedSubscription.status,
              tier,
            },
          });
        } catch (stripeError) {
          console.error('[Checkout] Error upgrading subscription:', stripeError);
          
          // If upgrade fails, fall back to checkout session
          // This handles edge cases like subscription in bad state
        }
      }

      // ==========================================================================
      // NEW SUBSCRIPTION (no existing subscription or upgrade failed)
      // ==========================================================================
      // Configure trial period (default 7 days, configurable via env var)
      const trialDays = parseInt(process.env.STRIPE_TRIAL_DAYS || '7', 10);

      // Check trial eligibility (fraud prevention)
      const productId = tierConfig.productId;
      if (productId && trialDays > 0) {
        // Get request info for fraud prevention
        const deviceFingerprint = body.deviceFingerprint;
        const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                          request.headers.get('x-real-ip');

        const eligibility = await checkTrialEligibility(
          user.id,
          productId,
          {
            deviceFingerprint,
            email: user.email,
            ipAddress,
          }
        );

        if (!eligibility.eligible) {
          console.log('[Checkout] Trial not eligible:', eligibility.reason, eligibility.flags);
          // Still allow checkout, but without trial
          // User will be charged immediately
        }
      }

      sessionConfig = {
        ...sessionConfig,
        mode: 'subscription',
        line_items: [{
          price: priceId,
          quantity: 1,
        }],
        subscription_data: {
          // Only apply trial if user doesn't have an existing subscription
          ...(hasActiveSubscription ? {} : { trial_period_days: trialDays }),
          trial_settings: {
            end_behavior: {
              // 'pause' keeps subscription but blocks access until payment
              // 'cancel' ends subscription immediately
              // 'create_invoice' bills immediately (no grace period)
              missing_payment_method: 'pause',
            },
          },
          metadata: {
            autorev_user_id: user.id,
            tier,
            interval: billingInterval,
          },
        },
        // Allow users to manage their subscription
        billing_address_collection: 'auto',
      };

      sessionConfig.metadata.tier = tier;
      sessionConfig.metadata.interval = billingInterval;
    }

    // ==========================================================================
    // AL CREDIT PACK CHECKOUT
    // ==========================================================================
    else if (type === 'credits') {
      const packConfig = AL_CREDIT_PACKS[pack];
      
      if (!packConfig) {
        return NextResponse.json(
          { error: 'Invalid credit pack' },
          { status: 400 }
        );
      }

      sessionConfig = {
        ...sessionConfig,
        mode: 'payment',
        line_items: [{
          price: packConfig.priceId,
          quantity: 1,
        }],
      };

      sessionConfig.metadata.pack = pack;
      sessionConfig.metadata.credits = packConfig.credits.toString();
    }

    // ==========================================================================
    // DONATION CHECKOUT
    // ==========================================================================
    else if (type === 'donation') {
      // Check for preset amount first
      const presetConfig = DONATION_PRESETS[amount];
      
      if (presetConfig) {
        // Use preset price ID
        sessionConfig = {
          ...sessionConfig,
          mode: 'payment',
          line_items: [{
            price: presetConfig.priceId,
            quantity: 1,
          }],
          submit_type: 'donate',
        };
      } else if (donationAmount && donationAmount >= 100) {
        // Custom amount (minimum $1.00 = 100 cents)
        sessionConfig = {
          ...sessionConfig,
          mode: 'payment',
          line_items: [{
            price_data: {
              currency: 'usd',
              unit_amount: Math.round(donationAmount), // Ensure integer cents
              product: DONATION_PRODUCT_ID,
            },
            quantity: 1,
          }],
          submit_type: 'donate',
        };
      } else {
        return NextResponse.json(
          { error: 'Invalid donation amount. Minimum $1.00' },
          { status: 400 }
        );
      }

      sessionConfig.metadata.donation_amount = (donationAmount || presetConfig?.amount || 0).toString();
    }

    // ==========================================================================
    // INVALID TYPE
    // ==========================================================================
    else {
      return NextResponse.json(
        { error: 'Invalid checkout type. Must be: subscription, credits, or donation' },
        { status: 400 }
      );
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log('[Checkout] Session created:', {
      type,
      sessionId: session.id,
      userId: user.id,
    });

    return NextResponse.json({ 
      url: session.url,
      sessionId: session.id,
    });

  } catch (err) {
    console.error('[Checkout] Error:', err);
    
    // Log to error tracking system (critical - revenue impact)
    await logServerError(err, request, {
      route: 'checkout',
      feature: 'payments',
      errorSource: 'api',
      severity: 'blocking', // Payment failures are critical
    });
    
    return NextResponse.json(
      { error: err.message || 'Checkout failed' },
      { status: 500 }
    );
  }
}




