-- Add Streak Tracking to User Engagement Scores
-- Implements Duolingo-style streak mechanics for engagement

-- ============================================
-- ADD STREAK COLUMNS
-- ============================================

ALTER TABLE user_engagement_scores 
  ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_activity_date DATE,
  ADD COLUMN IF NOT EXISTS streak_frozen_until DATE;

-- Index for streak queries
CREATE INDEX IF NOT EXISTS idx_engagement_scores_streak 
  ON user_engagement_scores(current_streak DESC) 
  WHERE current_streak > 0;

-- Index for streak at-risk queries (users with streak who haven't been active today)
CREATE INDEX IF NOT EXISTS idx_engagement_scores_streak_at_risk
  ON user_engagement_scores(last_activity_date, current_streak)
  WHERE current_streak > 0;

-- ============================================
-- STREAK MILESTONE TRACKING
-- ============================================

-- Add streak milestone columns
ALTER TABLE user_engagement_scores
  ADD COLUMN IF NOT EXISTS streak_milestone_7d_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS streak_milestone_14d_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS streak_milestone_30d_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS streak_milestone_50d_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS streak_milestone_100d_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS streak_milestone_365d_at TIMESTAMPTZ;

-- ============================================
-- UPDATE STREAK FUNCTION
-- ============================================

-- Function to update user's streak based on activity
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID)
RETURNS TABLE (
  current_streak INTEGER,
  longest_streak INTEGER,
  streak_extended BOOLEAN,
  streak_broken BOOLEAN,
  milestone_reached INTEGER
) AS $$
DECLARE
  v_record user_engagement_scores;
  v_today DATE := CURRENT_DATE;
  v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
  v_new_streak INTEGER;
  v_streak_extended BOOLEAN := false;
  v_streak_broken BOOLEAN := false;
  v_milestone_reached INTEGER := NULL;
BEGIN
  -- Get current record
  SELECT * INTO v_record FROM user_engagement_scores WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    -- Create new record with streak = 1
    INSERT INTO user_engagement_scores (user_id, current_streak, longest_streak, last_activity_date)
    VALUES (p_user_id, 1, 1, v_today);
    
    RETURN QUERY SELECT 1, 1, true, false, NULL::INTEGER;
    RETURN;
  END IF;
  
  -- Check if already active today
  IF v_record.last_activity_date = v_today THEN
    -- Already counted for today, no change
    RETURN QUERY SELECT v_record.current_streak, v_record.longest_streak, false, false, NULL::INTEGER;
    RETURN;
  END IF;
  
  -- Check streak status
  IF v_record.last_activity_date = v_yesterday THEN
    -- Consecutive day - extend streak
    v_new_streak := COALESCE(v_record.current_streak, 0) + 1;
    v_streak_extended := true;
  ELSIF v_record.last_activity_date IS NULL OR v_record.last_activity_date < v_yesterday THEN
    -- Check if streak is frozen
    IF v_record.streak_frozen_until IS NOT NULL AND v_record.streak_frozen_until >= v_today THEN
      -- Streak is frozen, keep current streak
      v_new_streak := COALESCE(v_record.current_streak, 0) + 1;
      v_streak_extended := true;
    ELSE
      -- Streak broken - start new streak
      IF COALESCE(v_record.current_streak, 0) > 0 THEN
        v_streak_broken := true;
      END IF;
      v_new_streak := 1;
    END IF;
  ELSE
    -- Shouldn't happen, but handle it
    v_new_streak := 1;
  END IF;
  
  -- Check for milestones
  IF v_streak_extended OR v_new_streak = 1 THEN
    CASE 
      WHEN v_new_streak = 7 THEN v_milestone_reached := 7;
      WHEN v_new_streak = 14 THEN v_milestone_reached := 14;
      WHEN v_new_streak = 30 THEN v_milestone_reached := 30;
      WHEN v_new_streak = 50 THEN v_milestone_reached := 50;
      WHEN v_new_streak = 100 THEN v_milestone_reached := 100;
      WHEN v_new_streak = 365 THEN v_milestone_reached := 365;
      ELSE v_milestone_reached := NULL;
    END CASE;
  END IF;
  
  -- Update the record
  UPDATE user_engagement_scores
  SET 
    current_streak = v_new_streak,
    longest_streak = GREATEST(COALESCE(longest_streak, 0), v_new_streak),
    last_activity_date = v_today,
    streak_frozen_until = CASE 
      WHEN streak_frozen_until <= v_today THEN NULL 
      ELSE streak_frozen_until 
    END,
    -- Update streak milestones
    streak_milestone_7d_at = CASE WHEN v_new_streak = 7 AND streak_milestone_7d_at IS NULL THEN NOW() ELSE streak_milestone_7d_at END,
    streak_milestone_14d_at = CASE WHEN v_new_streak = 14 AND streak_milestone_14d_at IS NULL THEN NOW() ELSE streak_milestone_14d_at END,
    streak_milestone_30d_at = CASE WHEN v_new_streak = 30 AND streak_milestone_30d_at IS NULL THEN NOW() ELSE streak_milestone_30d_at END,
    streak_milestone_50d_at = CASE WHEN v_new_streak = 50 AND streak_milestone_50d_at IS NULL THEN NOW() ELSE streak_milestone_50d_at END,
    streak_milestone_100d_at = CASE WHEN v_new_streak = 100 AND streak_milestone_100d_at IS NULL THEN NOW() ELSE streak_milestone_100d_at END,
    streak_milestone_365d_at = CASE WHEN v_new_streak = 365 AND streak_milestone_365d_at IS NULL THEN NOW() ELSE streak_milestone_365d_at END
  WHERE user_id = p_user_id;
  
  -- Get updated values
  SELECT ues.current_streak, ues.longest_streak 
  INTO v_new_streak, v_record.longest_streak
  FROM user_engagement_scores ues
  WHERE ues.user_id = p_user_id;
  
  RETURN QUERY SELECT v_new_streak, v_record.longest_streak, v_streak_extended, v_streak_broken, v_milestone_reached;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GET STREAK STATUS FUNCTION
-- ============================================

-- Function to get user's streak status
CREATE OR REPLACE FUNCTION get_streak_status(p_user_id UUID)
RETURNS TABLE (
  current_streak INTEGER,
  longest_streak INTEGER,
  last_activity_date DATE,
  is_at_risk BOOLEAN,
  hours_remaining NUMERIC,
  is_frozen BOOLEAN,
  frozen_until DATE
) AS $$
DECLARE
  v_record user_engagement_scores;
  v_today DATE := CURRENT_DATE;
  v_now TIMESTAMP := NOW();
  v_midnight TIMESTAMP;
  v_hours_left NUMERIC;
BEGIN
  SELECT * INTO v_record FROM user_engagement_scores WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0, 0, NULL::DATE, false, 0::NUMERIC, false, NULL::DATE;
    RETURN;
  END IF;
  
  -- Calculate hours until midnight in user's timezone (defaulting to UTC)
  v_midnight := (v_today + INTERVAL '1 day')::TIMESTAMP;
  v_hours_left := EXTRACT(EPOCH FROM (v_midnight - v_now)) / 3600;
  
  RETURN QUERY SELECT 
    COALESCE(v_record.current_streak, 0),
    COALESCE(v_record.longest_streak, 0),
    v_record.last_activity_date,
    -- At risk if has streak > 0, not yet active today, and less than 6 hours until midnight
    (COALESCE(v_record.current_streak, 0) > 0 
      AND v_record.last_activity_date != v_today 
      AND v_hours_left < 6),
    v_hours_left,
    (v_record.streak_frozen_until IS NOT NULL AND v_record.streak_frozen_until >= v_today),
    v_record.streak_frozen_until;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================
-- APPLY STREAK FREEZE FUNCTION
-- ============================================

-- Function to apply a streak freeze (premium feature)
CREATE OR REPLACE FUNCTION apply_streak_freeze(p_user_id UUID, p_days INTEGER DEFAULT 1)
RETURNS BOOLEAN AS $$
DECLARE
  v_record user_engagement_scores;
BEGIN
  -- Validate days (1-3)
  IF p_days < 1 OR p_days > 3 THEN
    RAISE EXCEPTION 'Streak freeze must be 1-3 days';
  END IF;
  
  SELECT * INTO v_record FROM user_engagement_scores WHERE user_id = p_user_id;
  
  IF NOT FOUND OR COALESCE(v_record.current_streak, 0) = 0 THEN
    -- No streak to protect
    RETURN false;
  END IF;
  
  -- Apply freeze
  UPDATE user_engagement_scores
  SET streak_frozen_until = CURRENT_DATE + (p_days || ' days')::INTERVAL
  WHERE user_id = p_user_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GET USERS WITH AT-RISK STREAKS
-- ============================================

-- Function to get users whose streaks are at risk (for reminder notifications)
CREATE OR REPLACE FUNCTION get_users_with_at_risk_streaks(p_min_streak INTEGER DEFAULT 3)
RETURNS TABLE (
  user_id UUID,
  current_streak INTEGER,
  last_activity_date DATE,
  hours_remaining NUMERIC
) AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_now TIMESTAMP := NOW();
  v_midnight TIMESTAMP := (v_today + INTERVAL '1 day')::TIMESTAMP;
BEGIN
  RETURN QUERY
  SELECT 
    e.user_id,
    e.current_streak,
    e.last_activity_date,
    (EXTRACT(EPOCH FROM (v_midnight - v_now)) / 3600)::NUMERIC AS hours_remaining
  FROM user_engagement_scores e
  WHERE 
    e.current_streak >= p_min_streak
    AND e.last_activity_date != v_today
    AND (e.streak_frozen_until IS NULL OR e.streak_frozen_until < v_today);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================
-- UPDATE increment_engagement_activity TO INCLUDE STREAK
-- ============================================

-- Drop and recreate the function to include streak updates
CREATE OR REPLACE FUNCTION increment_engagement_activity(
  p_user_id UUID,
  p_activity_type TEXT
)
RETURNS user_engagement_scores AS $$
DECLARE
  v_result user_engagement_scores;
  v_streak_result RECORD;
BEGIN
  -- Ensure record exists
  INSERT INTO user_engagement_scores (user_id, first_activity_at, last_activity_at)
  VALUES (p_user_id, NOW(), NOW())
  ON CONFLICT (user_id) DO UPDATE SET last_activity_at = NOW();
  
  -- Update streak
  SELECT * INTO v_streak_result FROM update_user_streak(p_user_id);
  
  -- Increment the appropriate counter and set milestones
  CASE p_activity_type
    WHEN 'garage_car' THEN
      UPDATE user_engagement_scores
      SET 
        garage_cars_count = garage_cars_count + 1,
        milestone_first_car = true,
        milestone_first_car_at = COALESCE(milestone_first_car_at, NOW())
      WHERE user_id = p_user_id;
      
    WHEN 'al_conversation' THEN
      UPDATE user_engagement_scores
      SET 
        al_conversations_count = al_conversations_count + 1,
        milestone_first_al_chat = true,
        milestone_first_al_chat_at = COALESCE(milestone_first_al_chat_at, NOW())
      WHERE user_id = p_user_id;
      
    WHEN 'event_saved' THEN
      UPDATE user_engagement_scores
      SET 
        events_saved_count = events_saved_count + 1,
        milestone_first_event = true,
        milestone_first_event_at = COALESCE(milestone_first_event_at, NOW())
      WHERE user_id = p_user_id;
      
    WHEN 'parts_search' THEN
      UPDATE user_engagement_scores
      SET parts_searches_count = parts_searches_count + 1
      WHERE user_id = p_user_id;
      
    WHEN 'build_saved' THEN
      UPDATE user_engagement_scores
      SET 
        builds_saved_count = builds_saved_count + 1,
        milestone_first_build = true,
        milestone_first_build_at = COALESCE(milestone_first_build_at, NOW())
      WHERE user_id = p_user_id;
      
    WHEN 'comparison' THEN
      UPDATE user_engagement_scores
      SET comparisons_count = comparisons_count + 1
      WHERE user_id = p_user_id;
      
    ELSE
      -- Unknown activity type, streak was already updated
      NULL;
  END CASE;
  
  -- Recalculate and return the updated score
  SELECT * INTO v_result FROM update_user_engagement_score(p_user_id);
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION update_user_streak(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_streak_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION apply_streak_freeze(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_with_at_risk_streaks(INTEGER) TO service_role;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON COLUMN user_engagement_scores.current_streak IS 'Current consecutive days of activity';
COMMENT ON COLUMN user_engagement_scores.longest_streak IS 'All-time longest streak achieved';
COMMENT ON COLUMN user_engagement_scores.last_activity_date IS 'Date of last activity (used for streak calculation)';
COMMENT ON COLUMN user_engagement_scores.streak_frozen_until IS 'Date when streak freeze expires (premium feature)';
COMMENT ON FUNCTION update_user_streak IS 'Updates streak on activity - extends if consecutive, resets if broken';
COMMENT ON FUNCTION get_streak_status IS 'Gets current streak status including at-risk indicator';
COMMENT ON FUNCTION get_users_with_at_risk_streaks IS 'Gets users who have streaks at risk of breaking (for notifications)';
