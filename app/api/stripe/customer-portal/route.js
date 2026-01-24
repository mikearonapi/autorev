/**
 * Stripe Customer Portal API Route
 * 
 * Creates a Stripe Customer Portal session for subscription management.
 * Users can manage their subscription, update payment methods, and view invoices.
 * 
 * POST /api/stripe/customer-portal
 * 
 * Request body:
 * - returnUrl: string (optional) - URL to redirect after portal session
 * 
 * Response:
 * - url: string - Portal session URL to redirect user to
 * 
 * @module app/api/stripe/customer-portal/route
 */

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getUser } from '@/lib/auth';
import { supabaseServiceRole } from '@/lib/supabase';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(request) {
  try {
    // Authenticate user
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json().catch(() => ({}));
    const { returnUrl } = body;

    // Get user's Stripe customer ID from profile
    const { data: profile, error: profileError } = await supabaseServiceRole
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('[Stripe Portal] Profile fetch error:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    if (!profile.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No Stripe customer found. Please subscribe first.' },
        { status: 400 }
      );
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/garage/settings`,
    });

    console.log('[Stripe Portal] Session created for customer:', profile.stripe_customer_id);

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    console.error('[Stripe Portal] Error creating session:', error);
    
    // Handle specific Stripe errors
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
