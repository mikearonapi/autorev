/**
 * Stripe Webhook Handler
 * 
 * Processes Stripe events for:
 * - Subscription created/updated/canceled
 * - Payment succeeded (for AL credit packs)
 * - Checkout completed (for donations)
 * 
 * Features:
 * - Idempotency: Events are tracked in processed_webhook_events table
 * - Duplicate detection: Prevents reprocessing of already-handled events
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
import { sendPaymentFailedEmail, sendTrialEndingEmail } from '@/lib/emailService';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Use service role for webhook processing (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// =============================================================================
// IDEMPOTENCY HELPERS
// =============================================================================

/**
 * Check if event has already been processed
 * @param {string} eventId - Stripe event ID
 * @returns {Promise<boolean>} - true if already processed
 */
async function isEventProcessed(eventId) {
  const { data, error } = await supabase
    .from('processed_webhook_events')
    .select('id')
    .eq('event_id', eventId)
    .single();
  
  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('[Stripe Webhook] Error checking event status:', error);
  }
  
  return !!data;
}

/**
 * Mark event as processed
 * @param {string} eventId - Stripe event ID
 * @param {string} eventType - Event type (e.g., 'checkout.session.completed')
 * @param {Object} [payload] - Optional event payload for debugging
 */
async function markEventProcessed(eventId, eventType, payload = null) {
  const { error } = await supabase
    .from('processed_webhook_events')
    .insert({
      event_id: eventId,
      event_type: eventType,
      provider: 'stripe',
      // Only store minimal payload data in production for privacy
      payload: process.env.NODE_ENV === 'development' ? payload : null,
    });
  
  if (error) {
    // Log but don't throw - duplicate insert (race condition) is acceptable
    if (error.code === '23505') { // Unique violation
      console.log('[Stripe Webhook] Event already recorded (race condition):', eventId);
    } else {
      console.error('[Stripe Webhook] Error recording event:', error);
    }
  }
}

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

// =============================================================================
// NEW SCHEMA HELPERS (Dual-Write)
// Write to both legacy user_profiles columns AND new normalized tables
// =============================================================================

/**
 * Upsert customer record in new customers table
 * @param {string} userId - Supabase user ID
 * @param {string} stripeCustomerId - Stripe customer ID
 */
async function upsertCustomer(userId, stripeCustomerId) {
  const { error } = await supabase
    .from('customers')
    .upsert({
      id: userId,
      stripe_customer_id: stripeCustomerId,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'id',
    });

  if (error) {
    console.error('[Stripe Webhook] Error upserting customer:', error);
    // Non-fatal - continue with legacy system
  } else {
    console.log('[Stripe Webhook] Customer synced to new table:', userId);
  }
}

/**
 * Upsert subscription record in new subscriptions table
 * @param {Object} subscription - Stripe subscription object
 * @param {string} userId - Supabase user ID
 */
async function upsertSubscription(subscription, userId) {
  if (!userId) {
    console.warn('[Stripe Webhook] Cannot upsert subscription - no userId');
    return;
  }

  const priceId = subscription.items?.data?.[0]?.price?.id;
  
  const subscriptionData = {
    id: subscription.id,
    user_id: userId,
    status: subscription.status,
    price_id: priceId || null,
    quantity: subscription.items?.data?.[0]?.quantity || 1,
    cancel_at_period_end: subscription.cancel_at_period_end || false,
    cancel_at: subscription.cancel_at 
      ? new Date(subscription.cancel_at * 1000).toISOString() 
      : null,
    canceled_at: subscription.canceled_at 
      ? new Date(subscription.canceled_at * 1000).toISOString() 
      : null,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    trial_start: subscription.trial_start 
      ? new Date(subscription.trial_start * 1000).toISOString() 
      : null,
    trial_end: subscription.trial_end 
      ? new Date(subscription.trial_end * 1000).toISOString() 
      : null,
    ended_at: subscription.ended_at 
      ? new Date(subscription.ended_at * 1000).toISOString() 
      : null,
    metadata: subscription.metadata || {},
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('subscriptions')
    .upsert(subscriptionData, {
      onConflict: 'id',
    });

  if (error) {
    console.error('[Stripe Webhook] Error upserting subscription:', error);
    // Non-fatal - continue with legacy system
  } else {
    console.log('[Stripe Webhook] Subscription synced to new table:', subscription.id);
  }
}

/**
 * Record trial start in trial_history table
 * @param {Object} subscription - Stripe subscription object
 * @param {string} userId - Supabase user ID
 */
async function recordTrialStart(subscription, userId) {
  if (!subscription.trial_start || !userId) return;

  const productId = subscription.items?.data?.[0]?.price?.product;
  if (!productId) return;

  const { error } = await supabase
    .from('trial_history')
    .upsert({
      user_id: userId,
      product_id: productId,
      subscription_id: subscription.id,
      trial_started_at: new Date(subscription.trial_start * 1000).toISOString(),
      converted_to_paid: false,
    }, {
      onConflict: 'user_id,product_id',
    });

  if (error && error.code !== '23505') { // Ignore unique violations
    console.error('[Stripe Webhook] Error recording trial start:', error);
  } else {
    console.log('[Stripe Webhook] Trial start recorded for user:', userId);
  }
}

/**
 * Mark trial as converted in trial_history table
 * @param {Object} subscription - Stripe subscription object
 * @param {string} userId - Supabase user ID
 */
async function markTrialConverted(subscription, userId) {
  if (!userId) return;

  const productId = subscription.items?.data?.[0]?.price?.product;
  if (!productId) return;

  const { error } = await supabase
    .from('trial_history')
    .update({
      converted_to_paid: true,
      trial_ended_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('product_id', productId);

  if (error) {
    console.error('[Stripe Webhook] Error marking trial converted:', error);
  } else {
    console.log('[Stripe Webhook] Trial marked as converted for user:', userId);
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

  // =========================================================================
  // LEGACY: Update user_profiles (existing behavior)
  // =========================================================================
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
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('[Stripe Webhook] Error updating subscription:', error);
    throw error;
  }

  // =========================================================================
  // NEW SCHEMA: Dual-write to new normalized tables
  // =========================================================================
  if (user?.id) {
    // Sync subscription to new subscriptions table
    await upsertSubscription(subscription, user.id);
    
    // Record trial start for new subscriptions with trials
    if (isNew && subscription.status === 'trialing') {
      await recordTrialStart(subscription, user.id);
    }
    
    // Check if this is a trial conversion (was trialing, now active)
    if (subscription.status === 'active' && !isNew) {
      // Check if there was a previous trial
      const { data: trialRecord } = await supabase
        .from('trial_history')
        .select('id, converted_to_paid')
        .eq('user_id', user.id)
        .eq('subscription_id', subscription.id)
        .eq('converted_to_paid', false)
        .maybeSingle();
      
      if (trialRecord) {
        await markTrialConverted(subscription, user.id);
      }
    }
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

  // Get user for new schema updates
  const user = await getUserByStripeCustomerId(customerId);

  // =========================================================================
  // LEGACY: Reset to free tier in user_profiles
  // =========================================================================
  const { error } = await supabase
    .from('user_profiles')
    .update({
      subscription_tier: 'free',
      stripe_subscription_status: 'canceled',
      subscription_ends_at: subscription.ended_at 
        ? new Date(subscription.ended_at * 1000).toISOString()
        : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('[Stripe Webhook] Error canceling subscription:', error);
    throw error;
  }

  // =========================================================================
  // NEW SCHEMA: Update subscriptions table
  // =========================================================================
  if (user?.id) {
    await upsertSubscription(subscription, user.id);
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
      // Link Stripe customer ID to user profile (LEGACY)
      await supabase
        .from('user_profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
      
      // NEW SCHEMA: Also create customer record in new customers table
      await upsertCustomer(user.id, customerId);
      
      console.log('[Stripe Webhook] Linked Stripe customer to user:', user.id);
    }
  } else if (user) {
    // Existing customer - ensure new customers table is in sync
    await upsertCustomer(user.id, customerId);
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

/**
 * Handle payment failed (dunning flow)
 * Sends email notification to user to update payment method
 */
async function handlePaymentFailed(invoice) {
  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;
  const amountDue = invoice.amount_due;
  const nextPaymentAttempt = invoice.next_payment_attempt;

  console.log('[Stripe Webhook] Payment failed:', {
    customerId,
    subscriptionId,
    amountDue,
    nextPaymentAttempt,
    invoiceId: invoice.id,
  });

  // Get user for email notification
  const user = await getUserByStripeCustomerId(customerId);
  
  if (!user) {
    console.error('[Stripe Webhook] Could not find user for payment failed notification:', customerId);
    return;
  }

  // Get user email from auth
  const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(user.id);
  
  if (authError || !authUser?.user?.email) {
    console.error('[Stripe Webhook] Could not get email for payment failed:', user.id);
    return;
  }

  // Get user's current tier
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('subscription_tier, display_name')
    .eq('id', user.id)
    .single();

  // Format next retry date if available
  let nextRetryDate = null;
  if (nextPaymentAttempt) {
    nextRetryDate = new Date(nextPaymentAttempt * 1000).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }

  // Send dunning email
  const emailResult = await sendPaymentFailedEmail({
    userId: user.id,
    email: authUser.user.email,
    userName: profile?.display_name || authUser.user.user_metadata?.full_name,
    amountCents: amountDue,
    tier: profile?.subscription_tier || 'tuner',
    nextRetryDate,
  });

  if (emailResult.success) {
    console.log('[Stripe Webhook] Payment failed email sent to:', authUser.user.email);
    
    // Log to email_logs for tracking
    await supabase.from('email_logs').insert({
      user_id: user.id,
      template_slug: 'payment_failed',
      to_email: authUser.user.email,
      sent_at: new Date().toISOString(),
      metadata: { 
        invoice_id: invoice.id,
        amount_cents: amountDue,
        next_retry: nextRetryDate,
      },
    }).catch(() => {}); // Don't fail if logging fails
  } else {
    console.error('[Stripe Webhook] Failed to send payment failed email:', emailResult.error);
  }

  // Notify Discord
  notifyPayment({
    type: 'payment_failed',
    amount: amountDue,
    customerId,
    userId: user.id,
  }).catch(err => console.error('[Stripe Webhook] Discord notification failed:', err));
}

/**
 * Handle trial ending notification (3 days before trial ends)
 * Supplements the cron job for more reliable delivery
 */
async function handleTrialEnding(subscription) {
  const customerId = subscription.customer;
  const trialEnd = subscription.trial_end;

  console.log('[Stripe Webhook] Trial will end:', {
    customerId,
    trialEnd: trialEnd ? new Date(trialEnd * 1000).toISOString() : null,
    subscriptionId: subscription.id,
  });

  // Get user for email notification
  const user = await getUserByStripeCustomerId(customerId);
  
  if (!user) {
    console.error('[Stripe Webhook] Could not find user for trial ending notification:', customerId);
    return;
  }

  // Get user email from auth
  const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(user.id);
  
  if (authError || !authUser?.user?.email) {
    console.error('[Stripe Webhook] Could not get email for trial ending:', user.id);
    return;
  }

  // Get user's current tier
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('subscription_tier, display_name')
    .eq('id', user.id)
    .single();

  // Calculate days remaining
  const trialEndDate = new Date(trialEnd * 1000);
  const now = new Date();
  const daysRemaining = Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24));

  // Check if we've already sent this reminder via webhook
  const reminderKey = `trial_webhook_${daysRemaining}d`;
  const { data: existingLog } = await supabase
    .from('email_logs')
    .select('id')
    .eq('user_id', user.id)
    .eq('template_slug', reminderKey)
    .gte('sent_at', new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString())
    .maybeSingle();

  if (existingLog) {
    console.log('[Stripe Webhook] Trial ending email already sent today:', user.id);
    return;
  }

  // Format trial end date
  const trialEndFormatted = trialEndDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Send trial ending email
  const emailResult = await sendTrialEndingEmail({
    userId: user.id,
    email: authUser.user.email,
    userName: profile?.display_name || authUser.user.user_metadata?.full_name,
    daysRemaining,
    trialEndDate: trialEndFormatted,
    tier: profile?.subscription_tier || 'tuner',
  });

  if (emailResult.success) {
    console.log('[Stripe Webhook] Trial ending email sent to:', authUser.user.email);
    
    // Log to email_logs for tracking
    await supabase.from('email_logs').insert({
      user_id: user.id,
      template_slug: reminderKey,
      to_email: authUser.user.email,
      sent_at: new Date().toISOString(),
      metadata: { 
        days_remaining: daysRemaining,
        source: 'webhook',
      },
    }).catch(() => {}); // Don't fail if logging fails
  } else {
    console.error('[Stripe Webhook] Failed to send trial ending email:', emailResult.error);
  }
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
    return NextResponse.json({ error: 'Webhook verification failed' }, { status: 400 });
  }

  console.log('[Stripe Webhook] Event received:', event.type, event.id);

  // =============================================================================
  // IDEMPOTENCY CHECK
  // Prevent duplicate processing of the same event (Stripe may retry)
  // =============================================================================
  const alreadyProcessed = await isEventProcessed(event.id);
  if (alreadyProcessed) {
    console.log('[Stripe Webhook] Event already processed, skipping:', event.id);
    return NextResponse.json({ received: true, duplicate: true });
  }

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
        await handlePaymentFailed(event.data.object);
        break;

      case 'customer.subscription.trial_will_end':
        await handleTrialEnding(event.data.object);
        break;

      default:
        console.log('[Stripe Webhook] Unhandled event type:', event.type);
    }

    // Mark event as processed AFTER successful handling
    await markEventProcessed(event.id, event.type, {
      objectId: event.data.object?.id,
      customerId: event.data.object?.customer,
    });

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
      eventId: event?.id,
    });
    
    // Don't mark as processed on error - allow retry
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

