/**
 * Stripe Customer Portal
 * 
 * Creates a session for users to manage their subscription,
 * update payment methods, and view billing history.
 * 
 * @route POST /api/billing/portal
 */

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAuthenticatedClient, createServerSupabaseClient, getBearerToken } from '@/lib/supabaseServer';
import { withErrorLogging } from '@/lib/serverErrorLogger';
import { errors } from '@/lib/apiErrors';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function handlePost(request) {
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
    return errors.unauthorized();
  }

  // Get user's Stripe customer ID
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    return errors.badRequest('No billing account found. Subscribe to a plan first.');
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://autorev.app';

  // Create billing portal session
  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${baseUrl}/profile?tab=billing`,
  });

  return NextResponse.json({ url: session.url });
}

export const POST = withErrorLogging(handlePost, { 
  route: 'billing/portal', 
  feature: 'payments' 
});













