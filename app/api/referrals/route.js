/**
 * Referrals API
 * 
 * Handles referral program operations:
 * - GET: Get user's referral code, stats, milestone progress, and referral list
 * - POST: Create a new referral (share with friend) and send invite email
 * - PATCH: Resend invite to a pending referral
 * 
 * Reward Structure (balanced incentives):
 *   REFEREE (Friend): +200 bonus credits on signup
 *   REFERRER: +200 credits per successful signup
 *   MILESTONES:
 *     3 friends  → +200 bonus credits
 *     5 friends  → +300 bonus credits
 *     10 friends → 1 month free Collector tier
 *     25 friends → 1 month free Tuner tier
 */

import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

import { errors } from '@/lib/apiErrors';
import { sendReferralInviteEmail } from '@/lib/emailService';
import { withErrorLogging } from '@/lib/serverErrorLogger';
import { createAuthenticatedClient, createServerSupabaseClient, getBearerToken } from '@/lib/supabaseServer';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// Reward configuration (balanced - both parties equally incentivized)
const REFERRAL_CONFIG = {
  REFERRER_CREDITS_PER_SIGNUP: 200,
  REFEREE_BONUS_CREDITS: 200,
};

// Milestone definitions
const MILESTONES = [
  { key: 'milestone_3', friends: 3, reward: '+200 bonus credits' },
  { key: 'milestone_5', friends: 5, reward: '+300 bonus credits' },
  { key: 'milestone_10', friends: 10, reward: '1 month free Collector tier' },
  { key: 'milestone_25', friends: 25, reward: '1 month free Tuner tier' },
];

/**
 * Create Supabase client for route handlers (supports both cookie and Bearer token)
 */
async function createSupabaseClient(request) {
  const bearerToken = getBearerToken(request);
  return bearerToken 
    ? { supabase: createAuthenticatedClient(bearerToken), bearerToken }
    : { supabase: await createServerSupabaseClient(), bearerToken: null };
}

/**
 * GET /api/referrals
 * 
 * Get user's referral code, stats, milestone progress, and list of referrals
 */
async function handleGet(request) {
    const { supabase, bearerToken } = await createSupabaseClient(request);
    
    if (!supabase) {
      return errors.serviceUnavailable('Authentication service');
    }
    
    const { data: { user }, error: authError } = bearerToken
      ? await supabase.auth.getUser(bearerToken)
      : await supabase.auth.getUser();
    
    if (authError || !user) {
      return errors.unauthorized();
    }

    // Get user's referral code and referral tier info
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('referral_code, referral_tier_granted, referral_tier_expires_at, referral_tier_lifetime')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('[Referrals] Profile error:', profileError);
      return errors.database('Failed to get profile');
    }

    // Get all referrals for this user (for the list)
    const { data: referralsList, error: referralsError } = await supabase
      .from('referrals')
      .select('id, referee_email, status, created_at, signed_up_at, referrer_reward_credits')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false });

    if (referralsError) {
      console.error('[Referrals] Error fetching referrals list:', referralsError);
    }

    // Calculate stats from the list
    const referrals = referralsList || [];
    const signedUp = referrals.filter(r => r.status === 'signed_up' || r.status === 'rewarded').length;
    const pending = referrals.filter(r => r.status === 'pending').length;

    // Get rewards for milestone tracking
    const { data: rewards } = await supabase
      .from('referral_rewards')
      .select('credits_awarded, milestone_key')
      .eq('user_id', user.id);

    const achievedMilestones = rewards?.filter(r => r.milestone_key).map(r => r.milestone_key) || [];
    const totalCreditsEarned = rewards?.reduce((sum, r) => sum + (r.credits_awarded || 0), 0) || 0;

    const stats = {
      total_referrals: referrals.length,
      pending,
      signed_up: signedUp,
      credits_earned: totalCreditsEarned,
      milestones_achieved: achievedMilestones,
      next_milestone: MILESTONES.find(m => !achievedMilestones.includes(m.key) && m.friends > signedUp),
    };

    const referralLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://autorev.app'}/?ref=${profile.referral_code}`;

    return NextResponse.json({
      referral_code: profile.referral_code,
      referral_link: referralLink,
      stats,
      referrals: referrals.map(r => ({
        id: r.id,
        email: r.referee_email,
        status: r.status,
        created_at: r.created_at,
        signed_up_at: r.signed_up_at,
        credits_earned: r.referrer_reward_credits || 0,
      })),
      reward_config: REFERRAL_CONFIG,
      milestones: MILESTONES,
      referral_tier: profile.referral_tier_granted ? {
        tier: profile.referral_tier_granted,
        expires_at: profile.referral_tier_expires_at,
        is_lifetime: profile.referral_tier_lifetime,
      } : null,
    });
}

/**
 * POST /api/referrals
 * 
 * Create a new referral (share with friend's email) and send invite
 * 
 * Body:
 * - email: Friend's email address
 */
async function handlePost(request) {
    const { supabase, bearerToken } = await createSupabaseClient(request);
    
    if (!supabase) {
      return errors.serviceUnavailable('Authentication service');
    }
    
    const { data: { user }, error: authError } = bearerToken
      ? await supabase.auth.getUser(bearerToken)
      : await supabase.auth.getUser();
    
    if (authError || !user) {
      return errors.unauthorized();
    }

    const { email } = await request.json();

    if (!email) {
      return errors.missingField('email');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errors.invalidInput('Invalid email format', { field: 'email' });
    }

    // Don't allow self-referrals
    if (email.toLowerCase() === user.email.toLowerCase()) {
      return errors.badRequest('Cannot refer yourself');
    }

    // Check if already referred this email
    const { data: existingRef } = await supabase
      .from('referrals')
      .select('id, status')
      .eq('referrer_id', user.id)
      .ilike('referee_email', email)
      .single();

    if (existingRef) {
      if (existingRef.status === 'pending') {
        return NextResponse.json({ error: 'Already sent invite to this email' }, { status: 409 });
      } else {
        return NextResponse.json({ error: 'This person has already signed up via your referral' }, { status: 409 });
      }
    }

    // Check if this email is already a user
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => 
      u.email?.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
      return NextResponse.json({ error: 'This person is already an AutoRev member' }, { status: 409 });
    }

    // Get referrer's profile info
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('referral_code, display_name')
      .eq('id', user.id)
      .single();

    const referralLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://autorev.app'}/?ref=${profile.referral_code}`;

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

    // Send invite email to friend (fire-and-forget)
    const referrerName = profile.display_name || 
                         user.user_metadata?.full_name?.split(' ')[0] || 
                         'Your friend';

    sendReferralInviteEmail(
      email.toLowerCase(),
      referrerName,
      referralLink,
      REFERRAL_CONFIG.REFEREE_BONUS_CREDITS
    ).catch(err => console.error('[Referrals] Failed to send invite email:', err));

    console.log(`[Referrals] Created referral from ${user.email} to ${email}`);

    return NextResponse.json({
      success: true,
      message: 'Referral invite sent!',
      referral_link: referralLink,
      referral_id: referral.id,
    });
}

/**
 * PATCH /api/referrals
 * 
 * Resend invite email to a pending referral
 * 
 * Body:
 * - referral_id: ID of the referral to resend
 */
async function handlePatch(request) {
    const { supabase, bearerToken } = await createSupabaseClient(request);
    
    if (!supabase) {
      return errors.serviceUnavailable('Authentication service');
    }
    
    const { data: { user }, error: authError } = bearerToken
      ? await supabase.auth.getUser(bearerToken)
      : await supabase.auth.getUser();
    
    if (authError || !user) {
      return errors.unauthorized();
    }

    const { referral_id } = await request.json();

    if (!referral_id) {
      return errors.missingField('referral_id');
    }

    // Get the referral (must belong to this user and be pending)
    const { data: referral, error: refError } = await supabase
      .from('referrals')
      .select('id, referee_email, status, referral_code')
      .eq('id', referral_id)
      .eq('referrer_id', user.id)
      .single();

    if (refError || !referral) {
      return errors.notFound('Referral');
    }

    if (referral.status !== 'pending') {
      return errors.badRequest('Can only resend to pending referrals');
    }

    // Get referrer's profile info
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();

    const referralLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://autorev.app'}/?ref=${referral.referral_code}`;

    // Resend invite email
    const referrerName = profile?.display_name || 
                         user.user_metadata?.full_name?.split(' ')[0] || 
                         'Your friend';

    await sendReferralInviteEmail(
      referral.referee_email,
      referrerName,
      referralLink,
      REFERRAL_CONFIG.REFEREE_BONUS_CREDITS
    );

    console.log(`[Referrals] Resent invite from ${user.email} to ${referral.referee_email}`);

    return NextResponse.json({
      success: true,
      message: 'Invite resent!',
    });
}

// Export wrapped handlers with error logging
export const GET = withErrorLogging(handleGet, { route: 'referrals', feature: 'referrals' });
export const POST = withErrorLogging(handlePost, { route: 'referrals', feature: 'referrals' });
export const PATCH = withErrorLogging(handlePatch, { route: 'referrals', feature: 'referrals' });