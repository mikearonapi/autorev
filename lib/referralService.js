/**
 * Referral Service
 * 
 * Handles all referral program operations:
 * - Processing referral signups
 * - Awarding credits and milestone rewards
 * - Generating shareable links
 * - Fetching referral stats
 * 
 * Reward Structure:
 *   REFEREE (Friend): +250 bonus credits on signup
 *   REFERRER: +500 credits per successful signup
 *   MILESTONES:
 *     3 friends  → 1 month free Collector tier
 *     5 friends  → +750 bonus credits
 *     10 friends → 3 months free Tuner tier
 *     25 friends → Lifetime Tuner upgrade
 */

import { createClient } from '@supabase/supabase-js';

import { sendReferralRewardEmail } from './emailService';
import { awardPoints } from './pointsService';

// Initialize admin client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// Reward configuration (balanced - both parties equally incentivized)
export const REFERRAL_CONFIG = {
  REFERRER_CREDITS_PER_SIGNUP: 200,
  REFEREE_BONUS_CREDITS: 200,
  BASE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://autorev.app',
};

// Milestone definitions (should match DB, used for display)
export const REFERRAL_MILESTONES = [
  {
    key: 'milestone_3',
    friendsRequired: 3,
    reward: '+200 bonus credits',
    icon: '🎯',
    type: 'credits',
  },
  {
    key: 'milestone_5',
    friendsRequired: 5,
    reward: '+300 bonus credits',
    icon: '⚡',
    type: 'credits',
  },
  {
    key: 'milestone_10',
    friendsRequired: 10,
    reward: '1 month free Collector tier',
    icon: '🥉',
    type: 'tier',
  },
  {
    key: 'milestone_25',
    friendsRequired: 25,
    reward: '1 month free Tuner tier',
    icon: '🏆',
    type: 'tier',
  },
];

/**
 * Process a referral when a new user signs up with a referral code
 * 
 * @param {string} refereeUserId - The new user's ID
 * @param {string} referralCode - The referral code they used
 * @returns {Promise<{success: boolean, error?: string, referrerCredits?: number, refereeCredits?: number}>}
 */
export async function processReferralSignup(refereeUserId, referralCode) {
  if (!referralCode || !refereeUserId) {
    return { success: false, error: 'Missing required parameters' };
  }

  try {
    // Call the database function that handles everything atomically
    const { data, error } = await supabaseAdmin.rpc('process_referral_signup', {
      p_referee_user_id: refereeUserId,
      p_referral_code: referralCode,
    });

    if (error) {
      console.error('[Referral] Error processing signup:', error);
      return { success: false, error: error.message };
    }

    if (!data.success) {
      return { success: false, error: data.error };
    }

    // Send notification email to referrer (fire and forget)
    if (data.referrer_id) {
      notifyReferrerAsync(data.referrer_id, refereeUserId, data.referee_credits);
      
      // Award 250 points to referrer for successful referral (highest value action!)
      awardPoints(data.referrer_id, 'referral_signup', {
        refereeUserId,
        referralCode,
      }).catch(err => console.error('[Referral] Error awarding referral points:', err));
    }

    console.log(`[Referral] Processed signup: referee ${refereeUserId} via code ${referralCode}`);

    return {
      success: true,
      referrerId: data.referrer_id,
      referrerCredits: REFERRAL_CONFIG.REFERRER_CREDITS_PER_SIGNUP,
      refereeCredits: data.referee_credits || REFERRAL_CONFIG.REFEREE_BONUS_CREDITS,
    };

  } catch (err) {
    console.error('[Referral] Exception processing signup:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get a user's referral stats including milestone progress
 * 
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} Referral stats
 */
export async function getReferralStats(userId) {
  try {
    const { data, error } = await supabaseAdmin.rpc('get_referral_stats', {
      p_user_id: userId,
    });

    if (error) {
      console.error('[Referral] Error fetching stats:', error);
      return null;
    }

    return data;

  } catch (err) {
    console.error('[Referral] Exception fetching stats:', err);
    return null;
  }
}

/**
 * Get a user's referral code and link
 * 
 * @param {string} userId - The user's ID
 * @returns {Promise<{code: string, link: string} | null>}
 */
export async function getUserReferralCode(userId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('referral_code')
      .eq('id', userId)
      .single();

    if (error || !data?.referral_code) {
      return null;
    }

    return {
      code: data.referral_code,
      link: `${REFERRAL_CONFIG.BASE_URL}/?ref=${data.referral_code}`,
    };

  } catch (err) {
    console.error('[Referral] Exception fetching code:', err);
    return null;
  }
}

/**
 * Get the effective tier for a user (considering referral grants)
 * 
 * @param {string} userId - The user's ID
 * @returns {Promise<string>} The effective tier
 */
export async function getEffectiveUserTier(userId) {
  try {
    const { data, error } = await supabaseAdmin.rpc('get_effective_user_tier', {
      p_user_id: userId,
    });

    if (error) {
      console.error('[Referral] Error fetching effective tier:', error);
      return 'free';
    }

    return data || 'free';

  } catch (err) {
    console.error('[Referral] Exception fetching effective tier:', err);
    return 'free';
  }
}

/**
 * Get a user's referral rewards history
 * 
 * @param {string} userId - The user's ID
 * @returns {Promise<Array>} Array of rewards
 */
export async function getReferralRewardsHistory(userId) {
  const REWARD_COLS = 'id, user_id, referral_id, reward_type, reward_value, status, notes, created_at, processed_at';
  
  try {
    const { data, error } = await supabaseAdmin
      .from('referral_rewards')
      .select(REWARD_COLS)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Referral] Error fetching rewards:', error);
      return [];
    }

    return data || [];

  } catch (err) {
    console.error('[Referral] Exception fetching rewards:', err);
    return [];
  }
}

/**
 * Check if a referral code is valid
 * 
 * @param {string} code - The referral code to check
 * @returns {Promise<{valid: boolean, referrerId?: string}>}
 */
export async function validateReferralCode(code) {
  if (!code || code.length !== 8) {
    return { valid: false };
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('referral_code', code.toUpperCase())
      .single();

    if (error || !data) {
      return { valid: false };
    }

    return { valid: true, referrerId: data.id };

  } catch (err) {
    return { valid: false };
  }
}

/**
 * Get referral details for a pending referral by email
 * 
 * @param {string} referrerUserId - The referrer's user ID
 * @param {string} refereeEmail - The referee's email
 * @returns {Promise<Object | null>}
 */
export async function getPendingReferral(referrerUserId, refereeEmail) {
  const REFERRAL_COLS = 'id, referrer_id, referee_id, referee_email, status, referral_code, created_at, completed_at';
  
  try {
    const { data, error } = await supabaseAdmin
      .from('referrals')
      .select(REFERRAL_COLS)
      .eq('referrer_id', referrerUserId)
      .ilike('referee_email', refereeEmail)
      .eq('status', 'pending')
      .single();

    if (error) {
      return null;
    }

    return data;

  } catch (err) {
    return null;
  }
}

/**
 * Get all referrals for a user (as referrer)
 * 
 * @param {string} userId - The referrer's user ID
 * @returns {Promise<Array>}
 */
export async function getUserReferrals(userId) {
  const REFERRAL_COLS = 'id, referrer_id, referee_id, referee_email, status, referral_code, created_at, completed_at';
  
  try {
    const { data, error } = await supabaseAdmin
      .from('referrals')
      .select(REFERRAL_COLS)
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Referral] Error fetching referrals:', error);
      return [];
    }

    return data || [];

  } catch (err) {
    console.error('[Referral] Exception fetching referrals:', err);
    return [];
  }
}

/**
 * Create a pending referral (when user shares with a friend's email)
 * 
 * @param {string} referrerId - The referrer's user ID
 * @param {string} refereeEmail - The friend's email
 * @returns {Promise<{success: boolean, referralId?: string, error?: string}>}
 */
export async function createPendingReferral(referrerId, refereeEmail) {
  try {
    // Get referrer's code
    const codeData = await getUserReferralCode(referrerId);
    if (!codeData) {
      return { success: false, error: 'Could not find referral code' };
    }

    // Check for self-referral
    const { data: referrerAuth } = await supabaseAdmin.auth.admin.getUserById(referrerId);
    if (referrerAuth?.user?.email?.toLowerCase() === refereeEmail.toLowerCase()) {
      return { success: false, error: 'Cannot refer yourself' };
    }

    // Check if email is already a user
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => 
      u.email?.toLowerCase() === refereeEmail.toLowerCase()
    );
    if (existingUser) {
      return { success: false, error: 'This person is already an AutoRev member' };
    }

    // Check for existing referral
    const { data: existing } = await supabaseAdmin
      .from('referrals')
      .select('id, status')
      .eq('referrer_id', referrerId)
      .ilike('referee_email', refereeEmail)
      .single();

    if (existing) {
      if (existing.status === 'pending') {
        return { success: false, error: 'Already sent referral to this email' };
      } else {
        return { success: false, error: 'This person has already signed up' };
      }
    }

    // Create pending referral
    const { data, error } = await supabaseAdmin
      .from('referrals')
      .insert({
        referrer_id: referrerId,
        referee_email: refereeEmail.toLowerCase(),
        referral_code: codeData.code,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error) {
      console.error('[Referral] Error creating referral:', error);
      return { success: false, error: 'Failed to create referral' };
    }

    return { 
      success: true, 
      referralId: data.id,
      referralLink: codeData.link,
    };

  } catch (err) {
    console.error('[Referral] Exception creating referral:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Notify the referrer that their friend signed up (async, fire-and-forget)
 */
async function notifyReferrerAsync(referrerId, refereeUserId, _refereeCredits) {
  try {
    // Get referee's name
    const { data: refereeProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('display_name')
      .eq('id', refereeUserId)
      .single();

    const { data: refereeAuth } = await supabaseAdmin.auth.admin.getUserById(refereeUserId);
    const friendName = refereeProfile?.display_name || 
                       refereeAuth?.user?.user_metadata?.full_name?.split(' ')[0] || 
                       'Your friend';

    // Get referrer's total credits
    const { data: referrerCredits } = await supabaseAdmin
      .from('al_user_credits')
      .select('current_credits')
      .eq('user_id', referrerId)
      .single();

    // Send email
    await sendReferralRewardEmail(
      referrerId,
      friendName,
      REFERRAL_CONFIG.REFERRER_CREDITS_PER_SIGNUP,
      referrerCredits?.current_credits || REFERRAL_CONFIG.REFERRER_CREDITS_PER_SIGNUP
    );

  } catch (err) {
    console.error('[Referral] Error notifying referrer:', err);
  }
}

/**
 * Generate share text for different platforms
 */
export function getShareContent(referralLink) {
  const baseMessage = `Check out AutoRev - the best resource for sports car enthusiasts! Get 250 bonus AL credits when you join:`;
  
  return {
    // For copy button
    default: `${baseMessage}\n${referralLink}`,
    
    // For Twitter/X
    twitter: `${baseMessage} ${referralLink}`,
    
    // For email subject/body
    emailSubject: "You should check out AutoRev 🏎️",
    emailBody: `Hey,\n\nI've been using AutoRev for researching sports cars and it's awesome. They have an AI assistant called AL that knows everything about cars.\n\nIf you sign up with my link, you'll get 250 bonus credits to try it out:\n${referralLink}\n\nCheck it out!`,
    
    // For native share API
    share: {
      title: 'Join me on AutoRev',
      text: `${baseMessage}`,
      url: referralLink,
    },
  };
}

