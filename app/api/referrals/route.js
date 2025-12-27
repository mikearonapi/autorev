/**
 * Referrals API
 * 
 * Handles referral program operations:
 * - GET: Get user's referral code and stats
 * - POST: Create a new referral (share with friend)
 */

import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const REFERRAL_REWARD_CREDITS = 500; // Credits awarded to referrer when friend signs up

/**
 * GET /api/referrals
 * 
 * Get user's referral code and stats
 */
export async function GET(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get user's referral code
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('referral_code')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ error: 'Failed to get profile' }, { status: 500 });
    }

    // Get referral stats
    const { data: referrals, error: refError } = await supabase
      .from('referrals')
      .select('status, referrer_reward_credits')
      .eq('referrer_id', user.id);

    if (refError) {
      console.error('[Referrals] Error fetching referrals:', refError);
    }

    const stats = {
      total_referrals: referrals?.length || 0,
      pending: referrals?.filter(r => r.status === 'pending').length || 0,
      signed_up: referrals?.filter(r => r.status === 'signed_up' || r.status === 'rewarded').length || 0,
      credits_earned: referrals?.reduce((sum, r) => sum + (r.referrer_reward_credits || 0), 0) || 0,
    };

    const referralLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://autorev.app'}/?ref=${profile.referral_code}`;

    return NextResponse.json({
      referral_code: profile.referral_code,
      referral_link: referralLink,
      stats,
      reward_amount: REFERRAL_REWARD_CREDITS,
    });

  } catch (err) {
    console.error('[Referrals] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/referrals
 * 
 * Create a new referral (share with friend's email)
 * 
 * Body:
 * - email: Friend's email address
 */
export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Friend email is required' }, { status: 400 });
    }

    // Don't allow self-referrals
    if (email.toLowerCase() === user.email.toLowerCase()) {
      return NextResponse.json({ error: 'Cannot refer yourself' }, { status: 400 });
    }

    // Check if already referred this email
    const { data: existingRef } = await supabase
      .from('referrals')
      .select('id')
      .eq('referrer_id', user.id)
      .eq('referee_email', email.toLowerCase())
      .single();

    if (existingRef) {
      return NextResponse.json({ error: 'Already referred this email' }, { status: 409 });
    }

    // Check if this email is already a user
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => 
      u.email?.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
      return NextResponse.json({ error: 'This person is already an AutoRev member' }, { status: 409 });
    }

    // Get referrer's referral code
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('referral_code')
      .eq('id', user.id)
      .single();

    // Create referral record
    const { data: referral, error: createError } = await supabase
      .from('referrals')
      .insert({
        referrer_id: user.id,
        referee_email: email.toLowerCase(),
        referral_code: profile.referral_code,
        status: 'pending',
      })
      .select()
      .single();

    if (createError) {
      console.error('[Referrals] Error creating referral:', createError);
      return NextResponse.json({ error: 'Failed to create referral' }, { status: 500 });
    }

    // TODO: Send referral email to friend
    // This would use sendTemplateEmail with a 'referral-invite' template
    
    console.log(`[Referrals] Created referral from ${user.email} to ${email}`);

    const referralLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://autorev.app'}/?ref=${profile.referral_code}`;

    return NextResponse.json({
      success: true,
      message: 'Referral created',
      referral_link: referralLink,
      referral_id: referral.id,
    });

  } catch (err) {
    console.error('[Referrals] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

