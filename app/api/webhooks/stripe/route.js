/**
 * Stripe Webhook Handler
 * 
 * Processes Stripe events for:
 * - Subscription created/updated/canceled
 * - Payment succeeded (for AL credit packs)
 * - Checkout completed (for donations)
 * 
 * @route POST /api/webhooks/stripe
 */

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import {
  getTierFromPriceId,
  getCreditPackFromPriceId,
  isDonationProduct,
  mapSubscriptionStatus,
} from '@/lib/stripe';
import { notifyPayment } from '@/lib/discord';
import { logServerError } from '@/lib/serverErrorLogger';
import { sendSubscribeEvent, sendPurchaseEvent } from '@/lib/metaConversionsApi';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Use service role for webhook processing (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Verify Stripe webhook signature
 */
async function verifyWebhookSignature(request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    throw new Error('Missing stripe-signature header');
  }

  try {
    return stripe.webhooks.constructEvent(body, signature, endpointSecret);
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message);
    throw new Error(`Webhook signature verification failed: ${err.message}`);
  }
}

/**
 * Get user by Stripe customer ID
 */
async function getUserByStripeCustomerId(customerId) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, subscription_tier, al_credits_purchased')
    .eq('stripe_customer_id', customerId)
    .single();

  if (error) {
    console.error('[Stripe Webhook] Error fetching user:', error);
    return null;
  }
  return data;
}

/**
 * Get user by email (fallback for new customers)
 */
async function getUserByEmail(email) {
  // First check auth.users, then get profile
  const { data: authUser, error: authError } = await supabase.auth.admin.getUserByEmail(email);
  
  if (authError || !authUser) {
    console.log('[Stripe Webhook] No auth user found for email:', email);
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('id, subscription_tier, al_credits_purchased')
    .eq('id', authUser.user.id)
    .single();

  if (profileError) {
    console.error('[Stripe Webhook] Error fetching profile:', profileError);
    return null;
  }

  return profile;
}

/**
 * Handle subscription created or updated
 */
async function handleSubscriptionChange(subscription, isNew = false) {
  const customerId = subscription.customer;
  const status = mapSubscriptionStatus(subscription.status);
  
  // Get the price ID from subscription items
  const priceId = subscription.items?.data?.[0]?.price?.id;
  const tier = getTierFromPriceId(priceId) || 'free';

  console.log('[Stripe Webhook] Subscription change:', {
    customerId,
    status,
    tier,
    subscriptionId: subscription.id,
    isNew,
  });

  // Get user for Discord notification
  const user = await getUserByStripeCustomerId(customerId);

  // Update user profile
  const { error } = await supabase
    .from('user_profiles')
    .update({
      subscription_tier: status === 'active' || status === 'trialing' ? tier : 'free',
      stripe_subscription_id: subscription.id,
      stripe_subscription_status: status,
      subscription_started_at: new Date(subscription.start_date * 1000).toISOString(),
      subscription_ends_at: subscription.current_period_end 
        ? new Date(subscription.current_period_end * 1000).toISOString() 
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('[Stripe Webhook] Error updating subscription:', error);
    throw error;
  }

  // Notify Discord for new subscriptions (upgrades)
  if (isNew && (status === 'active' || status === 'trialing')) {
    const amount = subscription.items?.data?.[0]?.price?.unit_amount || 0;
    notifyPayment({
      type: 'new_subscription',
      amount,
      tier,
      userId: user?.id,
      customerId,
    }).catch(err => console.error('[Stripe Webhook] Discord notification failed:', err));
    
    // Send Meta Conversions API Subscribe event for new paid subscriptions
    if (user) {
      sendSubscribeEvent(
        { email: user.email || user.id }, // Use user ID as fallback if email not in profile
        {
          value: amount,
          tier: tier,
        },
        {
          eventSourceUrl: 'https://autorev.app/checkout',
        }
      ).catch(err => console.error('[Stripe Webhook] Meta Subscribe event failed:', err));
    }
  }

  console.log('[Stripe Webhook] Subscription updated successfully');
}

/**
 * Handle subscription canceled
 */
async function handleSubscriptionCanceled(subscription) {
  const customerId = subscription.customer;

  console.log('[Stripe Webhook] Subscription canceled:', {
    customerId,
    subscriptionId: subscription.id,
  });

  // Reset to free tier
  const { error } = await supabase
    .from('user_profiles')
    .update({
      subscription_tier: 'free',
      stripe_subscription_status: 'canceled',
      subscription_ends_at: new Date(subscription.ended_at * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('[Stripe Webhook] Error canceling subscription:', error);
    throw error;
  }
}

/**
 * Handle checkout session completed
 * Used for: AL credit packs, donations, and initial subscription setup
 */
async function handleCheckoutCompleted(session) {
  const customerId = session.customer;
  const customerEmail = session.customer_details?.email;
  const mode = session.mode; // 'subscription' or 'payment'
  
  console.log('[Stripe Webhook] Checkout completed:', {
    customerId,
    customerEmail,
    mode,
    sessionId: session.id,
  });

  // First, ensure the customer ID is linked to the user
  let user = await getUserByStripeCustomerId(customerId);
  
  if (!user && customerEmail) {
    // New customer - link by email
    user = await getUserByEmail(customerEmail);
    
    if (user) {
      // Link Stripe customer ID to user profile
      await supabase
        .from('user_profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
      
      console.log('[Stripe Webhook] Linked Stripe customer to user:', user.id);
    }
  }

  if (!user) {
    console.error('[Stripe Webhook] Could not find user for checkout:', { customerId, customerEmail });
    // Don't throw - payment was successful, we just can't attribute it
    return;
  }

  // Handle one-time payments (AL credits or donations)
  if (mode === 'payment') {
    // Get line items to determine what was purchased
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
    
    for (const item of lineItems.data) {
      const priceId = item.price?.id;
      const productId = item.price?.product;
      
      // Check if it's an AL credit pack
      const creditPack = getCreditPackFromPriceId(priceId);
      if (creditPack) {
        console.log('[Stripe Webhook] AL credits purchased:', creditPack.credits);
        
        // Add credits to user
        const newCredits = (user.al_credits_purchased || 0) + creditPack.credits;
        await supabase
          .from('user_profiles')
          .update({ 
            al_credits_purchased: newCredits,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        // Also update al_credits table if it exists
        // First check if user has a record
        const { data: existingCredits } = await supabase
          .from('al_credits')
          .select('credits_remaining, credits_purchased')
          .eq('user_id', user.id)
          .single();

        if (existingCredits) {
          await supabase
            .from('al_credits')
            .update({
              credits_remaining: (existingCredits.credits_remaining || 0) + creditPack.credits,
              credits_purchased: (existingCredits.credits_purchased || 0) + creditPack.credits,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id);
        } else {
          await supabase
            .from('al_credits')
            .insert({
              user_id: user.id,
              credits_remaining: creditPack.credits,
              credits_purchased: creditPack.credits,
            });
        }

        // Notify Discord
        notifyPayment({
          type: 'al_credits',
          amount: item.amount_total,
          credits: creditPack.credits,
          userId: user.id,
        }).catch(err => console.error('[Stripe Webhook] Discord notification failed:', err));
        
        // Send Meta Conversions API Purchase event for AL credit packs
        sendPurchaseEvent(
          { email: user.email || user.id },
          {
            value: item.amount_total,
            contentName: `AL Credits - ${creditPack.name || creditPack.credits + ' credits'}`,
          },
          {
            eventSourceUrl: 'https://autorev.app/checkout',
          }
        ).catch(err => console.error('[Stripe Webhook] Meta Purchase event failed:', err));

        continue;
      }

      // Check if it's a donation
      if (isDonationProduct(productId)) {
        console.log('[Stripe Webhook] Donation received:', item.amount_total / 100);
        
        // Notify Discord about donation
        notifyPayment({
          type: 'donation',
          amount: item.amount_total,
          userId: user.id,
        }).catch(err => console.error('[Stripe Webhook] Discord notification failed:', err));
      }
    }
  }
}

/**
 * Handle invoice paid (subscription renewals)
 */
async function handleInvoicePaid(invoice) {
  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;

  console.log('[Stripe Webhook] Invoice paid:', {
    customerId,
    subscriptionId,
    amount: invoice.amount_paid,
  });

  // Subscription status should already be handled by subscription.updated
  // Just notify Discord
  notifyPayment({
    type: 'subscription_renewal',
    amount: invoice.amount_paid,
    customerId,
  }).catch(err => console.error('[Stripe Webhook] Discord notification failed:', err));
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

export async function POST(request) {
  let event;

  try {
    event = await verifyWebhookSignature(request);
  } catch (err) {
    console.error('[Stripe Webhook] Verification error:', err.message);
    await logServerError(err, request, {
      route: 'webhooks/stripe',
      feature: 'payments',
      errorSource: 'webhook',
      errorType: 'webhook_verification_failed',
      severity: 'blocking',
    });
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  console.log('[Stripe Webhook] Event received:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionChange(event.data.object, true); // isNew = true
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object, false);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(event.data.object);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object);
        break;

      case 'invoice.payment_failed':
        console.warn('[Stripe Webhook] Payment failed:', event.data.object.id);
        // Could send email notification here
        break;

      default:
        console.log('[Stripe Webhook] Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[Stripe Webhook] Handler error:', err);
    
    // Log to error tracking system (critical - payment/subscription impact)
    await logServerError(err, request, {
      route: 'webhooks/stripe',
      feature: 'payments',
      errorSource: 'webhook',
      errorType: 'webhook_handler_failed',
      severity: 'blocking',
      eventType: event?.type,
    });
    
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

