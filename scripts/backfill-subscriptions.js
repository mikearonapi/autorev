#!/usr/bin/env node

/**
 * Subscription Data Backfill Script
 * 
 * One-time migration script to backfill existing subscription data from
 * user_profiles table to the new normalized subscription tables.
 * 
 * This script:
 * 1. Reads all users with Stripe customer IDs from user_profiles
 * 2. Creates records in the customers table
 * 3. For users with active subscriptions, fetches from Stripe and creates
 *    records in the subscriptions table
 * 
 * Safe to run multiple times (idempotent - uses upsert)
 * 
 * Usage:
 *   node scripts/backfill-subscriptions.js
 *   
 * Environment variables required:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - STRIPE_SECRET_KEY
 * 
 * @module scripts/backfill-subscriptions
 */

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Statistics
const stats = {
  usersProcessed: 0,
  customersCreated: 0,
  subscriptionsCreated: 0,
  errors: [],
};

/**
 * Backfill a single customer record
 */
async function backfillCustomer(userId, stripeCustomerId) {
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
    console.error(`  Error creating customer for ${userId}:`, error.message);
    stats.errors.push({ type: 'customer', userId, error: error.message });
    return false;
  }

  stats.customersCreated++;
  return true;
}

/**
 * Backfill subscription from Stripe
 */
async function backfillSubscription(userId, stripeSubscriptionId) {
  if (!stripeSubscriptionId) return false;

  try {
    // Fetch fresh data from Stripe
    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

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
      console.error(`  Error creating subscription for ${userId}:`, error.message);
      stats.errors.push({ type: 'subscription', userId, error: error.message });
      return false;
    }

    stats.subscriptionsCreated++;
    return true;
  } catch (err) {
    // Subscription might not exist in Stripe (deleted, etc.)
    console.error(`  Error fetching subscription from Stripe for ${userId}:`, err.message);
    stats.errors.push({ type: 'stripe', userId, error: err.message });
    return false;
  }
}

/**
 * Main backfill function
 */
async function backfillSubscriptions() {
  console.log('Starting subscription backfill...\n');
  console.log('='.repeat(60));

  // Get all users with Stripe customer IDs
  const { data: users, error } = await supabase
    .from('user_profiles')
    .select('id, stripe_customer_id, stripe_subscription_id, stripe_subscription_status, subscription_tier')
    .not('stripe_customer_id', 'is', null);

  if (error) {
    console.error('Error fetching users:', error);
    process.exit(1);
  }

  console.log(`Found ${users.length} users with Stripe customer IDs\n`);

  for (const user of users) {
    stats.usersProcessed++;
    console.log(`[${stats.usersProcessed}/${users.length}] Processing user ${user.id}`);
    console.log(`  Customer ID: ${user.stripe_customer_id}`);
    console.log(`  Subscription ID: ${user.stripe_subscription_id || 'None'}`);
    console.log(`  Status: ${user.stripe_subscription_status || 'None'}`);
    console.log(`  Tier: ${user.subscription_tier || 'free'}`);

    // Backfill customer
    await backfillCustomer(user.id, user.stripe_customer_id);

    // Backfill subscription if exists
    if (user.stripe_subscription_id) {
      await backfillSubscription(user.id, user.stripe_subscription_id);
    }

    console.log('');

    // Rate limit to avoid hitting Stripe API limits
    await new Promise(r => setTimeout(r, 100));
  }

  // Print summary
  console.log('='.repeat(60));
  console.log('\nBackfill complete!\n');
  console.log('Summary:');
  console.log(`  Users processed: ${stats.usersProcessed}`);
  console.log(`  Customers created/updated: ${stats.customersCreated}`);
  console.log(`  Subscriptions created/updated: ${stats.subscriptionsCreated}`);
  console.log(`  Errors: ${stats.errors.length}`);

  if (stats.errors.length > 0) {
    console.log('\nErrors:');
    stats.errors.forEach((err, i) => {
      console.log(`  ${i + 1}. [${err.type}] User ${err.userId}: ${err.error}`);
    });
  }
}

// Run the script
backfillSubscriptions()
  .then(() => {
    console.log('\nScript finished.');
    process.exit(0);
  })
  .catch(err => {
    console.error('\nFatal error:', err);
    process.exit(1);
  });
