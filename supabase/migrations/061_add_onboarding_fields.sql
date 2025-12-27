-- Migration: Add onboarding fields to user_profiles
-- Purpose: Support new user onboarding flow with referral tracking, intent, and email preferences
-- Date: 2024-12-27

-- Add onboarding-related columns to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS referral_source text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS referral_source_other text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS user_intent text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS onboarding_step integer DEFAULT 1;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email_opt_in_features boolean DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email_opt_in_events boolean DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.referral_source IS 'How user found AutoRev. Values: google, reddit, friend, forum, youtube, social, other';
COMMENT ON COLUMN user_profiles.referral_source_other IS 'Free text if referral_source is "other"';
COMMENT ON COLUMN user_profiles.user_intent IS 'User primary intent. Values: owner, shopping, learning';
COMMENT ON COLUMN user_profiles.onboarding_completed_at IS 'Timestamp when onboarding was completed. NULL if not completed.';
COMMENT ON COLUMN user_profiles.onboarding_step IS 'Current onboarding step (1-7). Used for resume functionality.';
COMMENT ON COLUMN user_profiles.email_opt_in_features IS 'User opted in to receive feature update emails';
COMMENT ON COLUMN user_profiles.email_opt_in_events IS 'User opted in to receive event notification emails';

-- Create check constraints for enum-like fields
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_referral_source_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_referral_source_check 
  CHECK (referral_source IS NULL OR referral_source IN ('google', 'reddit', 'friend', 'forum', 'youtube', 'social', 'other'));

ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_intent_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_user_intent_check 
  CHECK (user_intent IS NULL OR user_intent IN ('owner', 'shopping', 'learning'));

ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_onboarding_step_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_onboarding_step_check 
  CHECK (onboarding_step IS NULL OR (onboarding_step >= 1 AND onboarding_step <= 7));

