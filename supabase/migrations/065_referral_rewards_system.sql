-- ============================================================================
-- REFERRAL REWARDS SYSTEM
-- 
-- Enhances the referral system with:
--   1. Tiered milestone rewards for referrers
--   2. Bonus credits for referred friends (referee)
--   3. Free tier grants tracking
--   4. Comprehensive reward history
--
-- Reward Structure (conservative - offsets marketing costs):
--   REFEREE (Friend): +100 bonus credits on signup
--   REFERRER: +100 credits per successful signup
--   MILESTONES:
--     3 friends  → +100 bonus credits
--     5 friends  → +200 bonus credits
--     10 friends → 1 month free Collector tier
--     25 friends → 1 month free Tuner tier
-- ============================================================================

-- =============================================================================
-- REFERRAL REWARDS TABLE
-- Tracks all rewards earned through the referral program
-- =============================================================================
CREATE TABLE IF NOT EXISTS referral_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User who received the reward
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Reward type
  reward_type text NOT NULL CHECK (reward_type IN (
    'per_signup_credits',      -- 500 credits per friend signup
    'referee_bonus_credits',   -- 250 credits for signing up via referral
    'milestone_credits',       -- Bonus credits at milestones
    'milestone_tier_grant',    -- Free tier upgrade
    'milestone_tier_lifetime'  -- Permanent tier upgrade
  )),
  
  -- Details
  credits_awarded integer DEFAULT 0,
  tier_granted text CHECK (tier_granted IN ('free', 'collector', 'tuner', NULL)),
  tier_duration_months integer, -- NULL for lifetime
  tier_expires_at timestamptz, -- Computed when granted
  
  -- Link to specific referral or milestone
  referral_id uuid REFERENCES referrals(id) ON DELETE SET NULL,
  milestone_key text, -- e.g., 'milestone_3', 'milestone_5', etc.
  
  -- Metadata
  description text,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_referral_rewards_user ON referral_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_type ON referral_rewards(reward_type);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_milestone ON referral_rewards(user_id, milestone_key);

COMMENT ON TABLE referral_rewards IS 'Complete history of all referral rewards earned';

-- =============================================================================
-- USER PROFILE EXTENSIONS FOR REFERRAL TIER GRANTS
-- =============================================================================
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS referral_tier_granted text 
  CHECK (referral_tier_granted IN ('collector', 'tuner', NULL));
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS referral_tier_expires_at timestamptz;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS referral_tier_lifetime boolean DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS referred_by_code text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS referred_by_user_id uuid REFERENCES auth.users(id);

COMMENT ON COLUMN user_profiles.referral_tier_granted IS 'Tier granted via referral program (overrides subscription_tier if higher)';
COMMENT ON COLUMN user_profiles.referral_tier_expires_at IS 'When referral-granted tier expires (NULL = lifetime)';
COMMENT ON COLUMN user_profiles.referral_tier_lifetime IS 'If true, referral tier never expires';
COMMENT ON COLUMN user_profiles.referred_by_code IS 'The referral code used when this user signed up';
COMMENT ON COLUMN user_profiles.referred_by_user_id IS 'User ID of the person who referred this user';

-- =============================================================================
-- REFERRAL MILESTONES CONFIGURATION
-- =============================================================================
CREATE TABLE IF NOT EXISTS referral_milestones (
  id serial PRIMARY KEY,
  milestone_key text UNIQUE NOT NULL,
  friends_required integer NOT NULL,
  reward_type text NOT NULL,
  credits_amount integer DEFAULT 0,
  tier_granted text,
  tier_duration_months integer, -- NULL = lifetime
  description text NOT NULL,
  sort_order integer DEFAULT 0
);

-- Insert milestone definitions (conservative rewards)
INSERT INTO referral_milestones (milestone_key, friends_required, reward_type, credits_amount, tier_granted, tier_duration_months, description, sort_order) VALUES
  ('milestone_3', 3, 'milestone_credits', 100, NULL, NULL, '+100 bonus AL credits', 1),
  ('milestone_5', 5, 'milestone_credits', 200, NULL, NULL, '+200 bonus AL credits', 2),
  ('milestone_10', 10, 'milestone_tier_grant', 0, 'collector', 1, '1 month free Collector tier', 3),
  ('milestone_25', 25, 'milestone_tier_grant', 0, 'tuner', 1, '1 month free Tuner tier', 4)
ON CONFLICT (milestone_key) DO NOTHING;

COMMENT ON TABLE referral_milestones IS 'Configuration for referral milestone rewards';

-- =============================================================================
-- REFERRAL CONSTANTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS referral_config (
  key text PRIMARY KEY,
  value integer NOT NULL,
  description text
);

INSERT INTO referral_config (key, value, description) VALUES
  ('per_signup_credits_referrer', 100, 'Credits awarded to referrer for each friend signup'),
  ('signup_bonus_credits_referee', 100, 'Bonus credits awarded to new user who signed up via referral')
ON CONFLICT (key) DO NOTHING;

-- =============================================================================
-- FUNCTION: Get effective user tier (considering referral grants)
-- =============================================================================
CREATE OR REPLACE FUNCTION get_effective_user_tier(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_subscription_tier text;
  v_referral_tier text;
  v_referral_expires timestamptz;
  v_referral_lifetime boolean;
  tier_priority jsonb := '{"free": 0, "collector": 1, "tuner": 2, "admin": 3}'::jsonb;
BEGIN
  SELECT 
    subscription_tier,
    referral_tier_granted,
    referral_tier_expires_at,
    referral_tier_lifetime
  INTO 
    v_subscription_tier,
    v_referral_tier,
    v_referral_expires,
    v_referral_lifetime
  FROM user_profiles
  WHERE id = p_user_id;
  
  -- If no referral tier, return subscription tier
  IF v_referral_tier IS NULL THEN
    RETURN COALESCE(v_subscription_tier, 'free');
  END IF;
  
  -- If referral tier expired (and not lifetime), return subscription tier
  IF NOT v_referral_lifetime AND v_referral_expires < now() THEN
    RETURN COALESCE(v_subscription_tier, 'free');
  END IF;
  
  -- Return the higher of the two tiers
  IF (tier_priority->>v_referral_tier)::int > (tier_priority->>COALESCE(v_subscription_tier, 'free'))::int THEN
    RETURN v_referral_tier;
  ELSE
    RETURN COALESCE(v_subscription_tier, 'free');
  END IF;
END;
$$;

COMMENT ON FUNCTION get_effective_user_tier IS 'Returns the effective tier for a user, considering referral grants';

-- =============================================================================
-- FUNCTION: Get referrer stats with milestone progress
-- =============================================================================
CREATE OR REPLACE FUNCTION get_referral_stats(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_stats jsonb;
  v_successful_referrals integer;
  v_pending_referrals integer;
  v_total_credits_earned integer;
  v_milestones_achieved text[];
  v_next_milestone record;
BEGIN
  -- Count successful referrals (signed_up or rewarded status)
  SELECT COUNT(*) INTO v_successful_referrals
  FROM referrals
  WHERE referrer_id = p_user_id
    AND status IN ('signed_up', 'rewarded');
  
  -- Count pending referrals
  SELECT COUNT(*) INTO v_pending_referrals
  FROM referrals
  WHERE referrer_id = p_user_id
    AND status = 'pending';
  
  -- Total credits earned from referrals
  SELECT COALESCE(SUM(credits_awarded), 0) INTO v_total_credits_earned
  FROM referral_rewards
  WHERE user_id = p_user_id;
  
  -- Get achieved milestones
  SELECT array_agg(DISTINCT milestone_key) INTO v_milestones_achieved
  FROM referral_rewards
  WHERE user_id = p_user_id
    AND milestone_key IS NOT NULL;
  
  -- Get next milestone
  SELECT * INTO v_next_milestone
  FROM referral_milestones
  WHERE friends_required > v_successful_referrals
  ORDER BY friends_required ASC
  LIMIT 1;
  
  -- Build response
  v_stats := jsonb_build_object(
    'successful_referrals', v_successful_referrals,
    'pending_referrals', v_pending_referrals,
    'total_credits_earned', v_total_credits_earned,
    'milestones_achieved', COALESCE(v_milestones_achieved, ARRAY[]::text[]),
    'next_milestone', CASE 
      WHEN v_next_milestone IS NOT NULL THEN 
        jsonb_build_object(
          'key', v_next_milestone.milestone_key,
          'friends_required', v_next_milestone.friends_required,
          'friends_remaining', v_next_milestone.friends_required - v_successful_referrals,
          'description', v_next_milestone.description,
          'reward_type', v_next_milestone.reward_type,
          'credits_amount', v_next_milestone.credits_amount,
          'tier_granted', v_next_milestone.tier_granted
        )
      ELSE NULL
    END
  );
  
  RETURN v_stats;
END;
$$;

COMMENT ON FUNCTION get_referral_stats IS 'Get comprehensive referral statistics for a user including milestone progress';

-- =============================================================================
-- FUNCTION: Process referral signup
-- Called when a new user signs up with a referral code
-- =============================================================================
CREATE OR REPLACE FUNCTION process_referral_signup(
  p_referee_user_id uuid,
  p_referral_code text
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_referrer_id uuid;
  v_referral_id uuid;
  v_config_referrer_credits integer;
  v_config_referee_credits integer;
  v_successful_count integer;
  v_milestone record;
  v_result jsonb := '{}'::jsonb;
  v_referee_email text;
BEGIN
  -- Get config values
  SELECT value INTO v_config_referrer_credits FROM referral_config WHERE key = 'per_signup_credits_referrer';
  SELECT value INTO v_config_referee_credits FROM referral_config WHERE key = 'signup_bonus_credits_referee';
  
  -- Defaults if config missing
  v_config_referrer_credits := COALESCE(v_config_referrer_credits, 500);
  v_config_referee_credits := COALESCE(v_config_referee_credits, 250);
  
  -- Find the referrer by code
  SELECT id INTO v_referrer_id
  FROM user_profiles
  WHERE referral_code = p_referral_code;
  
  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid referral code');
  END IF;
  
  -- Don't allow self-referral
  IF v_referrer_id = p_referee_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot refer yourself');
  END IF;
  
  -- Get referee's email
  SELECT email INTO v_referee_email
  FROM auth.users
  WHERE id = p_referee_user_id;
  
  -- Check if there's a pending referral for this email
  SELECT id INTO v_referral_id
  FROM referrals
  WHERE referrer_id = v_referrer_id
    AND LOWER(referee_email) = LOWER(v_referee_email)
    AND status = 'pending';
  
  -- If no pending referral exists, create one
  IF v_referral_id IS NULL THEN
    INSERT INTO referrals (referrer_id, referee_id, referee_email, referral_code, status, signed_up_at)
    VALUES (v_referrer_id, p_referee_user_id, v_referee_email, p_referral_code, 'signed_up', now())
    RETURNING id INTO v_referral_id;
  ELSE
    -- Update existing pending referral
    UPDATE referrals
    SET referee_id = p_referee_user_id,
        status = 'signed_up',
        signed_up_at = now()
    WHERE id = v_referral_id;
  END IF;
  
  -- Update user_profiles with referrer info
  UPDATE user_profiles
  SET referred_by_code = p_referral_code,
      referred_by_user_id = v_referrer_id
  WHERE id = p_referee_user_id;
  
  -- ==========================================================================
  -- Award REFEREE bonus credits
  -- ==========================================================================
  INSERT INTO referral_rewards (user_id, reward_type, credits_awarded, referral_id, description)
  VALUES (p_referee_user_id, 'referee_bonus_credits', v_config_referee_credits, v_referral_id, 
          'Signup bonus for joining via referral');
  
  -- Add credits to referee's AL balance
  UPDATE al_user_credits
  SET current_credits = current_credits + v_config_referee_credits,
      updated_at = now()
  WHERE user_id = p_referee_user_id;
  
  -- If no AL credits record exists, create one
  IF NOT FOUND THEN
    INSERT INTO al_user_credits (user_id, current_credits, subscription_tier)
    VALUES (p_referee_user_id, 25 + v_config_referee_credits, 'free');
  END IF;
  
  -- Update referral record with referee reward
  UPDATE referrals
  SET referee_reward_credits = v_config_referee_credits
  WHERE id = v_referral_id;
  
  -- ==========================================================================
  -- Award REFERRER per-signup credits
  -- ==========================================================================
  INSERT INTO referral_rewards (user_id, reward_type, credits_awarded, referral_id, description)
  VALUES (v_referrer_id, 'per_signup_credits', v_config_referrer_credits, v_referral_id,
          'Reward for friend signup');
  
  -- Add credits to referrer's AL balance
  UPDATE al_user_credits
  SET current_credits = current_credits + v_config_referrer_credits,
      updated_at = now()
  WHERE user_id = v_referrer_id;
  
  -- Update referral record with referrer reward
  UPDATE referrals
  SET referrer_reward_credits = v_config_referrer_credits,
      status = 'rewarded',
      rewarded_at = now()
  WHERE id = v_referral_id;
  
  -- ==========================================================================
  -- Check for NEW milestones
  -- ==========================================================================
  SELECT COUNT(*) INTO v_successful_count
  FROM referrals
  WHERE referrer_id = v_referrer_id
    AND status IN ('signed_up', 'rewarded');
  
  FOR v_milestone IN 
    SELECT * FROM referral_milestones
    WHERE friends_required <= v_successful_count
    ORDER BY friends_required ASC
  LOOP
    -- Check if already achieved
    IF NOT EXISTS (
      SELECT 1 FROM referral_rewards 
      WHERE user_id = v_referrer_id 
        AND milestone_key = v_milestone.milestone_key
    ) THEN
      -- Award milestone!
      IF v_milestone.reward_type = 'milestone_credits' THEN
        -- Award bonus credits
        INSERT INTO referral_rewards (user_id, reward_type, credits_awarded, milestone_key, description)
        VALUES (v_referrer_id, v_milestone.reward_type, v_milestone.credits_amount, 
                v_milestone.milestone_key, v_milestone.description);
        
        UPDATE al_user_credits
        SET current_credits = current_credits + v_milestone.credits_amount,
            updated_at = now()
        WHERE user_id = v_referrer_id;
        
      ELSIF v_milestone.reward_type = 'milestone_tier_grant' THEN
        -- Grant temporary tier
        INSERT INTO referral_rewards (
          user_id, reward_type, tier_granted, tier_duration_months, 
          tier_expires_at, milestone_key, description
        )
        VALUES (
          v_referrer_id, v_milestone.reward_type, v_milestone.tier_granted,
          v_milestone.tier_duration_months, 
          now() + (v_milestone.tier_duration_months || ' months')::interval,
          v_milestone.milestone_key, v_milestone.description
        );
        
        -- Update user profile
        UPDATE user_profiles
        SET referral_tier_granted = CASE 
              WHEN referral_tier_lifetime THEN referral_tier_granted -- Don't downgrade lifetime
              ELSE v_milestone.tier_granted 
            END,
            referral_tier_expires_at = CASE 
              WHEN referral_tier_lifetime THEN referral_tier_expires_at
              ELSE GREATEST(COALESCE(referral_tier_expires_at, now()), now()) 
                   + (v_milestone.tier_duration_months || ' months')::interval
            END
        WHERE id = v_referrer_id;
        
      ELSIF v_milestone.reward_type = 'milestone_tier_lifetime' THEN
        -- Grant lifetime tier
        INSERT INTO referral_rewards (
          user_id, reward_type, tier_granted, milestone_key, description
        )
        VALUES (
          v_referrer_id, v_milestone.reward_type, v_milestone.tier_granted,
          v_milestone.milestone_key, v_milestone.description
        );
        
        -- Update user profile with lifetime grant
        UPDATE user_profiles
        SET referral_tier_granted = v_milestone.tier_granted,
            referral_tier_lifetime = true,
            referral_tier_expires_at = NULL
        WHERE id = v_referrer_id;
      END IF;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'referee_credits', v_config_referee_credits,
    'referrer_id', v_referrer_id,
    'referral_id', v_referral_id
  );
END;
$$;

COMMENT ON FUNCTION process_referral_signup IS 'Process a referral signup - awards credits and checks milestones';

-- =============================================================================
-- RLS POLICIES
-- =============================================================================
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_config ENABLE ROW LEVEL SECURITY;

-- Users can see their own rewards
CREATE POLICY "referral_rewards_user_read" ON referral_rewards 
  FOR SELECT USING (user_id = auth.uid());

-- Milestones are public read
CREATE POLICY "referral_milestones_public_read" ON referral_milestones 
  FOR SELECT USING (true);

-- Config is public read
CREATE POLICY "referral_config_public_read" ON referral_config 
  FOR SELECT USING (true);

-- =============================================================================
-- Add referral-invite email template
-- =============================================================================
INSERT INTO email_templates (slug, name, description, subject, preview_text, category, requires_opt_in, available_variables) VALUES
  ('referral-invite', 'Referral Invite', 'Email sent to invite a friend via referral', '{{referrer_name}} thinks you''d like AutoRev 🏎️', 'Get 250 bonus AL credits when you join', 'referral', NULL, '["referrer_name", "referral_link", "bonus_credits"]')
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================
GRANT EXECUTE ON FUNCTION get_effective_user_tier TO authenticated;
GRANT EXECUTE ON FUNCTION get_referral_stats TO authenticated;
GRANT EXECUTE ON FUNCTION process_referral_signup TO service_role;

