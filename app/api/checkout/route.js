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
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
  SUBSCRIPTION_TIERS,
  AL_CREDIT_PACKS,
  DONATION_PRESETS,
  DONATION_PRODUCT_ID,
} from '@/lib/stripe';
import { logServerError } from '@/lib/serverErrorLogger';

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
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, tier, pack, amount, donationAmount } = body;

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
    // SUBSCRIPTION CHECKOUT
    // ==========================================================================
    if (type === 'subscription') {
      const tierConfig = SUBSCRIPTION_TIERS[tier];
      
      if (!tierConfig || !tierConfig.priceId) {
        return NextResponse.json(
          { error: 'Invalid subscription tier' },
          { status: 400 }
        );
      }

      sessionConfig = {
        ...sessionConfig,
        mode: 'subscription',
        line_items: [{
          price: tierConfig.priceId,
          quantity: 1,
        }],
        subscription_data: {
          metadata: {
            autorev_user_id: user.id,
            tier,
          },
        },
        // Allow users to manage their subscription
        billing_address_collection: 'auto',
        // Trial period (uncomment to enable)
        // subscription_data: {
        //   trial_period_days: 7,
        // },
      };

      sessionConfig.metadata.tier = tier;
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




