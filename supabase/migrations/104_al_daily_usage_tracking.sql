-- ============================================================================
-- AL DAILY USAGE TRACKING
-- 
-- Adds daily query tracking to support the usage counter feature.
-- This enables the "X queries today" UI pattern (Perplexity-style).
--
-- Key Features:
--   1. queries_today - count of queries made today (resets daily)
--   2. last_query_date - date of last query (for reset detection)
--   3. Function to increment with auto-reset on new day
--
-- Why Daily Tracking:
--   - Monthly limits are billing mechanism, daily visibility drives habits
--   - Users think in days, not months - "5 queries today" is more tangible
--   - Creates natural upgrade pressure when users see daily usage
-- ============================================================================

-- Add daily tracking columns to al_user_credits
ALTER TABLE al_user_credits
ADD COLUMN IF NOT EXISTS queries_today INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_query_date DATE;

-- Index for efficient daily queries lookup
CREATE INDEX IF NOT EXISTS idx_al_user_credits_last_query_date 
ON al_user_credits(last_query_date);

-- Comment documentation
COMMENT ON COLUMN al_user_credits.queries_today IS 'Number of AL queries made today (resets at midnight UTC)';
COMMENT ON COLUMN al_user_credits.last_query_date IS 'Date of last AL query (used to detect day change for reset)';

-- ============================================================================
-- FUNCTION: increment_daily_al_query
-- 
-- Atomically increments the daily query counter.
-- Automatically resets if the date has changed since last query.
-- Returns the new count and whether it was a new day.
-- ============================================================================
CREATE OR REPLACE FUNCTION increment_daily_al_query(p_user_id UUID)
RETURNS TABLE (
  queries_today INTEGER,
  is_new_day BOOLEAN,
  is_unlimited BOOLEAN
) AS $$
DECLARE
  v_record RECORD;
  v_today DATE := CURRENT_DATE;
  v_is_new_day BOOLEAN := FALSE;
  v_new_count INTEGER;
BEGIN
  -- Get current record with lock
  SELECT uc.queries_today, uc.last_query_date, uc.is_unlimited
  INTO v_record
  FROM al_user_credits uc
  WHERE uc.user_id = p_user_id
  FOR UPDATE;
  
  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO al_user_credits (user_id, queries_today, last_query_date)
    VALUES (p_user_id, 1, v_today)
    RETURNING al_user_credits.queries_today, FALSE, al_user_credits.is_unlimited
    INTO v_new_count, v_is_new_day, v_record.is_unlimited;
    
    RETURN QUERY SELECT v_new_count, TRUE, COALESCE(v_record.is_unlimited, FALSE);
    RETURN;
  END IF;
  
  -- Check if it's a new day
  IF v_record.last_query_date IS NULL OR v_record.last_query_date < v_today THEN
    v_is_new_day := TRUE;
    v_new_count := 1; -- Reset to 1
  ELSE
    v_is_new_day := FALSE;
    v_new_count := COALESCE(v_record.queries_today, 0) + 1;
  END IF;
  
  -- Update the record
  UPDATE al_user_credits
  SET 
    queries_today = v_new_count,
    last_query_date = v_today,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN QUERY SELECT v_new_count, v_is_new_day, COALESCE(v_record.is_unlimited, FALSE);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION increment_daily_al_query IS 'Increments daily query counter, auto-resets on new day. Returns new count and flags.';

-- ============================================================================
-- FUNCTION: get_daily_al_usage
-- 
-- Gets current daily usage stats for a user.
-- Handles day rollover (returns 0 if it's a new day).
-- ============================================================================
CREATE OR REPLACE FUNCTION get_daily_al_usage(p_user_id UUID)
RETURNS TABLE (
  queries_today INTEGER,
  last_query_date DATE,
  is_unlimited BOOLEAN,
  messages_this_month INTEGER,
  balance_cents INTEGER
) AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN uc.last_query_date IS NULL OR uc.last_query_date < v_today 
      THEN 0 
      ELSE COALESCE(uc.queries_today, 0) 
    END AS queries_today,
    uc.last_query_date,
    COALESCE(uc.is_unlimited, FALSE) AS is_unlimited,
    COALESCE(uc.messages_this_month, 0) AS messages_this_month,
    COALESCE(uc.balance_cents, 0) AS balance_cents
  FROM al_user_credits uc
  WHERE uc.user_id = p_user_id;
  
  -- If no record found, return zeros
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0, NULL::DATE, FALSE, 0, 0;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_daily_al_usage IS 'Gets daily usage stats for a user, handling day rollover automatically.';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
GRANT EXECUTE ON FUNCTION increment_daily_al_query TO authenticated;
GRANT EXECUTE ON FUNCTION increment_daily_al_query TO service_role;
GRANT EXECUTE ON FUNCTION get_daily_al_usage TO authenticated;
GRANT EXECUTE ON FUNCTION get_daily_al_usage TO service_role;
