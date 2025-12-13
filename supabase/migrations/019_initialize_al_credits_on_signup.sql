-- ============================================================================
-- Initialize AL Credits on User Signup
-- 
-- This migration updates the handle_new_user() function to also:
--   1. Create user_profiles entry (existing behavior)
--   2. Create al_user_credits entry with free tier allocation
--
-- This ensures new users immediately have their AL credits ready
--
-- NOTE: Run this BEFORE 020_naming_cleanup_audit.sql
-- ============================================================================

-- Update the handle_new_user function to also initialize AL credits
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user profile (existing behavior)
  INSERT INTO user_profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Initialize AL credits for new user (free tier: 25 credits)
  INSERT INTO al_user_credits (
    user_id,
    subscription_tier,
    current_credits,
    purchased_credits,
    credits_used_this_month,
    messages_this_month,
    last_refill_date
  )
  VALUES (
    NEW.id,
    'free',
    25,  -- Free tier monthly allocation
    0,
    0,
    0,
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- BACKFILL: Create AL credits for existing users who don't have them
-- ============================================================================
INSERT INTO al_user_credits (
  user_id,
  subscription_tier,
  current_credits,
  purchased_credits,
  credits_used_this_month,
  messages_this_month,
  last_refill_date
)
SELECT 
  u.id,
  COALESCE(p.subscription_tier, 'free'),
  CASE 
    WHEN COALESCE(p.subscription_tier, 'free') = 'tuner' THEN 200
    WHEN COALESCE(p.subscription_tier, 'free') = 'collector' THEN 100
    ELSE 25
  END,
  0,
  0,
  0,
  NOW()
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id
WHERE NOT EXISTS (
  SELECT 1 FROM al_user_credits ac WHERE ac.user_id = u.id
);

-- ============================================================================
-- Add comment for documentation
-- ============================================================================
COMMENT ON FUNCTION handle_new_user() IS 
  'Triggered on new user signup. Creates user_profiles and al_user_credits entries automatically.';

