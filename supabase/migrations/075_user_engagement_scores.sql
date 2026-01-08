-- ============================================================================
-- USER ENGAGEMENT SCORES
-- AutoRev - Retention Outcome Tracking
--
-- This migration adds:
--   1. user_engagement_scores table for calculated retention metrics
--   2. Milestone tracking for key user outcomes
--   3. Functions to calculate and update engagement scores
--   4. Triggers for real-time score updates
--
-- Research basis: Retention studies show outcome-based tracking
-- correlates 6X better with retention than satisfaction surveys
-- ============================================================================

-- ============================================================================
-- USER ENGAGEMENT SCORES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_engagement_scores (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Composite engagement score (calculated)
  score INTEGER DEFAULT 0,
  peak_score INTEGER DEFAULT 0,  -- Highest score ever achieved
  
  -- Activity counts (denormalized for performance)
  garage_cars_count INTEGER DEFAULT 0,
  al_conversations_count INTEGER DEFAULT 0,
  events_saved_count INTEGER DEFAULT 0,
  parts_searches_count INTEGER DEFAULT 0,
  builds_saved_count INTEGER DEFAULT 0,
  comparisons_count INTEGER DEFAULT 0,
  
  -- Activity timestamps
  last_activity_at TIMESTAMPTZ,
  first_activity_at TIMESTAMPTZ,
  
  -- Score tracking
  score_updated_at TIMESTAMPTZ DEFAULT NOW(),
  previous_score INTEGER DEFAULT 0,  -- For detecting drops
  
  -- Outcome milestones (boolean flags)
  milestone_first_car BOOLEAN DEFAULT false,
  milestone_first_car_at TIMESTAMPTZ,
  
  milestone_first_al_chat BOOLEAN DEFAULT false,
  milestone_first_al_chat_at TIMESTAMPTZ,
  
  milestone_first_event BOOLEAN DEFAULT false,
  milestone_first_event_at TIMESTAMPTZ,
  
  milestone_first_build BOOLEAN DEFAULT false,
  milestone_first_build_at TIMESTAMPTZ,
  
  milestone_returned_7d BOOLEAN DEFAULT false,
  milestone_returned_7d_at TIMESTAMPTZ,
  
  milestone_returned_30d BOOLEAN DEFAULT false,
  milestone_returned_30d_at TIMESTAMPTZ,
  
  -- Retention alert flags
  alert_score_dropped BOOLEAN DEFAULT false,
  alert_score_dropped_at TIMESTAMPTZ,
  alert_inactive_7d BOOLEAN DEFAULT false,
  alert_inactive_7d_at TIMESTAMPTZ,
  alert_inactive_14d BOOLEAN DEFAULT false,
  alert_inactive_14d_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for querying
CREATE INDEX IF NOT EXISTS idx_engagement_scores_score ON user_engagement_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_engagement_scores_last_activity ON user_engagement_scores(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_engagement_scores_alerts ON user_engagement_scores(alert_inactive_7d, alert_inactive_14d);

-- Auto-update timestamp trigger
DROP TRIGGER IF EXISTS update_engagement_scores_updated_at ON user_engagement_scores;
CREATE TRIGGER update_engagement_scores_updated_at
  BEFORE UPDATE ON user_engagement_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SCORE CALCULATION FUNCTION
-- ============================================================================

-- Calculate engagement score based on activity weights
-- Formula: (garage_cars × 2) + (al_conversations × 3) + (events_saved × 2) + 
--          (parts_searches × 1) + (builds_saved × 3) + (comparisons × 1) -
--          (days_since_last_activity × 0.5)
CREATE OR REPLACE FUNCTION calculate_engagement_score(
  p_garage_cars INTEGER,
  p_al_conversations INTEGER,
  p_events_saved INTEGER,
  p_parts_searches INTEGER,
  p_builds_saved INTEGER,
  p_comparisons INTEGER,
  p_last_activity_at TIMESTAMPTZ
)
RETURNS INTEGER AS $$
DECLARE
  v_days_inactive INTEGER;
  v_inactivity_penalty INTEGER;
  v_base_score INTEGER;
BEGIN
  -- Calculate days since last activity
  IF p_last_activity_at IS NULL THEN
    v_days_inactive := 30; -- Assume 30 days if no activity recorded
  ELSE
    v_days_inactive := GREATEST(0, EXTRACT(DAY FROM (NOW() - p_last_activity_at))::INTEGER);
  END IF;
  
  -- Calculate inactivity penalty (capped at 30 points)
  v_inactivity_penalty := LEAST(30, (v_days_inactive * 0.5)::INTEGER);
  
  -- Calculate base score from activities
  v_base_score := 
    (COALESCE(p_garage_cars, 0) * 2) +
    (COALESCE(p_al_conversations, 0) * 3) +
    (COALESCE(p_events_saved, 0) * 2) +
    (COALESCE(p_parts_searches, 0) * 1) +
    (COALESCE(p_builds_saved, 0) * 3) +
    (COALESCE(p_comparisons, 0) * 1);
  
  -- Return score (minimum 0)
  RETURN GREATEST(0, v_base_score - v_inactivity_penalty);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- UPDATE ENGAGEMENT SCORE FUNCTION
-- ============================================================================

-- Recalculate and update a user's engagement score
CREATE OR REPLACE FUNCTION update_user_engagement_score(p_user_id UUID)
RETURNS user_engagement_scores AS $$
DECLARE
  v_result user_engagement_scores;
  v_new_score INTEGER;
  v_record user_engagement_scores;
BEGIN
  -- Get current record or create new one
  SELECT * INTO v_record FROM user_engagement_scores WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO user_engagement_scores (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_record;
  END IF;
  
  -- Calculate new score
  v_new_score := calculate_engagement_score(
    v_record.garage_cars_count,
    v_record.al_conversations_count,
    v_record.events_saved_count,
    v_record.parts_searches_count,
    v_record.builds_saved_count,
    v_record.comparisons_count,
    v_record.last_activity_at
  );
  
  -- Update record with new score
  UPDATE user_engagement_scores
  SET 
    previous_score = score,
    score = v_new_score,
    peak_score = GREATEST(peak_score, v_new_score),
    score_updated_at = NOW(),
    -- Set alert if score dropped by 50% or more from peak
    alert_score_dropped = (v_new_score < peak_score * 0.5 AND peak_score > 10),
    alert_score_dropped_at = CASE 
      WHEN (v_new_score < peak_score * 0.5 AND peak_score > 10) AND NOT alert_score_dropped 
      THEN NOW() 
      ELSE alert_score_dropped_at 
    END
  WHERE user_id = p_user_id
  RETURNING * INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INCREMENT ACTIVITY COUNTERS
-- ============================================================================

-- Increment a specific activity counter and recalculate score
CREATE OR REPLACE FUNCTION increment_engagement_activity(
  p_user_id UUID,
  p_activity_type TEXT
)
RETURNS user_engagement_scores AS $$
DECLARE
  v_result user_engagement_scores;
BEGIN
  -- Ensure record exists
  INSERT INTO user_engagement_scores (user_id, first_activity_at, last_activity_at)
  VALUES (p_user_id, NOW(), NOW())
  ON CONFLICT (user_id) DO UPDATE SET last_activity_at = NOW();
  
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
      -- Unknown activity type, just update last_activity
      NULL;
  END CASE;
  
  -- Recalculate and return the updated score
  SELECT * INTO v_result FROM update_user_engagement_score(p_user_id);
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CHECK RETURN MILESTONES
-- ============================================================================

-- Check and set return milestones (7-day, 30-day)
CREATE OR REPLACE FUNCTION check_return_milestones(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_engagement_scores
  SET
    -- 7-day return: first activity was 7+ days ago
    milestone_returned_7d = CASE
      WHEN first_activity_at IS NOT NULL 
        AND (NOW() - first_activity_at) >= INTERVAL '7 days'
        AND last_activity_at > first_activity_at
      THEN true
      ELSE milestone_returned_7d
    END,
    milestone_returned_7d_at = CASE
      WHEN NOT milestone_returned_7d
        AND first_activity_at IS NOT NULL 
        AND (NOW() - first_activity_at) >= INTERVAL '7 days'
        AND last_activity_at > first_activity_at
      THEN NOW()
      ELSE milestone_returned_7d_at
    END,
    -- 30-day return: first activity was 30+ days ago
    milestone_returned_30d = CASE
      WHEN first_activity_at IS NOT NULL 
        AND (NOW() - first_activity_at) >= INTERVAL '30 days'
        AND last_activity_at > first_activity_at
      THEN true
      ELSE milestone_returned_30d
    END,
    milestone_returned_30d_at = CASE
      WHEN NOT milestone_returned_30d
        AND first_activity_at IS NOT NULL 
        AND (NOW() - first_activity_at) >= INTERVAL '30 days'
        AND last_activity_at > first_activity_at
      THEN NOW()
      ELSE milestone_returned_30d_at
    END
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- BATCH UPDATE INACTIVITY ALERTS
-- ============================================================================

-- Update inactivity alerts for all users (called by cron)
CREATE OR REPLACE FUNCTION update_inactivity_alerts()
RETURNS TABLE (
  users_flagged_7d INTEGER,
  users_flagged_14d INTEGER
) AS $$
DECLARE
  v_flagged_7d INTEGER := 0;
  v_flagged_14d INTEGER := 0;
BEGIN
  -- Flag users inactive for 7+ days
  WITH updated AS (
    UPDATE user_engagement_scores
    SET 
      alert_inactive_7d = true,
      alert_inactive_7d_at = NOW()
    WHERE 
      last_activity_at < NOW() - INTERVAL '7 days'
      AND NOT alert_inactive_7d
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_flagged_7d FROM updated;
  
  -- Flag users inactive for 14+ days
  WITH updated AS (
    UPDATE user_engagement_scores
    SET 
      alert_inactive_14d = true,
      alert_inactive_14d_at = NOW()
    WHERE 
      last_activity_at < NOW() - INTERVAL '14 days'
      AND NOT alert_inactive_14d
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_flagged_14d FROM updated;
  
  RETURN QUERY SELECT v_flagged_7d, v_flagged_14d;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- GET USERS NEEDING RE-ENGAGEMENT
-- ============================================================================

-- Get users who need re-engagement emails
CREATE OR REPLACE FUNCTION get_users_needing_reengagement(
  p_alert_type TEXT,  -- 'score_dropped', 'inactive_7d', 'inactive_14d'
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  display_name TEXT,
  tier TEXT,
  score INTEGER,
  peak_score INTEGER,
  last_activity_at TIMESTAMPTZ,
  alert_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.user_id,
    u.email,
    p.display_name,
    p.tier,
    e.score,
    e.peak_score,
    e.last_activity_at,
    CASE p_alert_type
      WHEN 'score_dropped' THEN e.alert_score_dropped_at
      WHEN 'inactive_7d' THEN e.alert_inactive_7d_at
      WHEN 'inactive_14d' THEN e.alert_inactive_14d_at
    END AS alert_at
  FROM user_engagement_scores e
  JOIN auth.users u ON u.id = e.user_id
  LEFT JOIN user_profiles p ON p.id = e.user_id
  WHERE 
    CASE p_alert_type
      WHEN 'score_dropped' THEN e.alert_score_dropped = true
      WHEN 'inactive_7d' THEN e.alert_inactive_7d = true
      WHEN 'inactive_14d' THEN e.alert_inactive_14d = true
      ELSE false
    END
  ORDER BY 
    CASE p_alert_type
      WHEN 'score_dropped' THEN e.alert_score_dropped_at
      WHEN 'inactive_7d' THEN e.alert_inactive_7d_at
      WHEN 'inactive_14d' THEN e.alert_inactive_14d_at
    END DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE user_engagement_scores ENABLE ROW LEVEL SECURITY;

-- Users can view their own engagement scores
DROP POLICY IF EXISTS "Users can view own engagement scores" ON user_engagement_scores;
CREATE POLICY "Users can view own engagement scores" ON user_engagement_scores
  FOR SELECT USING (auth.uid() = user_id);

-- System can insert/update (via functions)
DROP POLICY IF EXISTS "System can manage engagement scores" ON user_engagement_scores;
CREATE POLICY "System can manage engagement scores" ON user_engagement_scores
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE user_engagement_scores IS 'Calculated retention metrics and outcome milestones for users';
COMMENT ON COLUMN user_engagement_scores.score IS 'Composite engagement score based on weighted activities minus inactivity penalty';
COMMENT ON COLUMN user_engagement_scores.peak_score IS 'Highest score ever achieved - used to detect significant drops';
COMMENT ON COLUMN user_engagement_scores.milestone_first_car IS 'User added at least one car to their garage';
COMMENT ON COLUMN user_engagement_scores.milestone_returned_7d IS 'User returned to the site after 7+ days from first activity';
COMMENT ON FUNCTION calculate_engagement_score IS 'Pure function to calculate score from activity counts';
COMMENT ON FUNCTION increment_engagement_activity IS 'Increment activity counter and recalculate engagement score';

