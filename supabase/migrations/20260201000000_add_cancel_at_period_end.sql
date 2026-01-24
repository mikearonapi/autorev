-- Migration: Add cancel_at_period_end to user_profiles
-- 
-- Purpose: Track when a subscription is set to cancel at the end of its billing period
-- This allows the UI to show "Cancels on [date]" messages to users
--
-- Part of Subscription & Monetization compliance fixes

-- Add cancel_at_period_end column to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.cancel_at_period_end IS 
  'Whether subscription will cancel at end of current period (set via Stripe webhook)';

-- Create index for queries that filter by cancellation status
CREATE INDEX IF NOT EXISTS idx_user_profiles_cancel_at_period_end 
  ON user_profiles(cancel_at_period_end) 
  WHERE cancel_at_period_end = true;
