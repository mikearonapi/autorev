-- ============================================================================
-- INSIGHTS SYSTEM MIGRATION
-- AutoRev - User Preferences & Insight Feedback
-- 
-- This migration adds tables for:
--   1. user_preferences - Questionnaire responses and personalization data
--   2. insight_feedback - Thumbs up/down feedback for human-in-the-loop learning
--
-- These support the new Insights page and feed into AL for personalization.
-- ============================================================================

-- ============================================================================
-- USER PREFERENCES TABLE
-- Stores questionnaire responses and derived preferences for personalization
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Driving Style & Interests (from questionnaire)
  driving_focus TEXT[], -- ['power', 'handling', 'daily', 'track', 'show']
  work_preference TEXT CHECK (work_preference IN ('diy', 'shop', 'mixed')),
  budget_comfort TEXT CHECK (budget_comfort IN ('budget', 'moderate', 'no_limit')),
  mod_experience TEXT CHECK (mod_experience IN ('beginner', 'intermediate', 'expert')),
  
  -- Car Priorities
  primary_goals TEXT[], -- ['more_power', 'better_handling', 'reliability', 'sound', 'aesthetics']
  track_frequency TEXT CHECK (track_frequency IN ('never', 'occasionally', 'regularly', 'competitive')),
  
  -- Content Preferences  
  detail_level TEXT CHECK (detail_level IN ('quick_tips', 'balanced', 'deep_dive')),
  
  -- All responses stored as JSONB for flexibility and future questions
  responses JSONB DEFAULT '{}'::jsonb,
  
  -- Points earned from questionnaire (for gamification)
  questionnaire_points_earned INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Each user has one preferences record
  UNIQUE(user_id)
);

-- Indexes for user_preferences
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Auto-update timestamp trigger
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INSIGHT FEEDBACK TABLE
-- Stores thumbs up/down feedback for human-in-the-loop learning
-- ============================================================================
CREATE TABLE IF NOT EXISTS insight_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- What insight was rated
  insight_type TEXT NOT NULL, -- 'known_issue', 'maintenance_due', 'upgrade_suggestion', 'value_trend', 'recall', 'youtube_content'
  insight_key TEXT NOT NULL,  -- Unique identifier for the specific insight (e.g., issue ID, service type)
  car_id UUID REFERENCES cars(id),
  car_slug TEXT, -- For reference/debugging
  
  -- Feedback
  rating TEXT NOT NULL CHECK (rating IN ('up', 'down')),
  feedback_text TEXT, -- Optional reason/comment
  
  -- Context snapshot (what was shown to the user)
  insight_content TEXT,
  insight_title TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One feedback per insight per user (can update their vote)
  UNIQUE(user_id, insight_type, insight_key)
);

-- Indexes for insight_feedback
CREATE INDEX IF NOT EXISTS idx_insight_feedback_user_id ON insight_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_insight_feedback_car_id ON insight_feedback(car_id);
CREATE INDEX IF NOT EXISTS idx_insight_feedback_type ON insight_feedback(insight_type);
CREATE INDEX IF NOT EXISTS idx_insight_feedback_rating ON insight_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_insight_feedback_created_at ON insight_feedback(created_at DESC);

-- Composite index for querying user's feedback on a car
CREATE INDEX IF NOT EXISTS idx_insight_feedback_user_car ON insight_feedback(user_id, car_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- Users can only access their own data
-- ============================================================================

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE insight_feedback ENABLE ROW LEVEL SECURITY;

-- USER_PREFERENCES: Users can only see and modify their own preferences
DROP POLICY IF EXISTS "user_preferences_select_own" ON user_preferences;
CREATE POLICY "user_preferences_select_own"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_preferences_insert_own" ON user_preferences;
CREATE POLICY "user_preferences_insert_own"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_preferences_update_own" ON user_preferences;
CREATE POLICY "user_preferences_update_own"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_preferences_delete_own" ON user_preferences;
CREATE POLICY "user_preferences_delete_own"
  ON user_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- INSIGHT_FEEDBACK: Users can only access their own feedback
DROP POLICY IF EXISTS "insight_feedback_select_own" ON insight_feedback;
CREATE POLICY "insight_feedback_select_own"
  ON insight_feedback FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insight_feedback_insert_own" ON insight_feedback;
CREATE POLICY "insight_feedback_insert_own"
  ON insight_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "insight_feedback_update_own" ON insight_feedback;
CREATE POLICY "insight_feedback_update_own"
  ON insight_feedback FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "insight_feedback_delete_own" ON insight_feedback;
CREATE POLICY "insight_feedback_delete_own"
  ON insight_feedback FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get user preferences with defaults
CREATE OR REPLACE FUNCTION get_user_preferences(p_user_id UUID)
RETURNS TABLE (
  driving_focus TEXT[],
  work_preference TEXT,
  budget_comfort TEXT,
  mod_experience TEXT,
  primary_goals TEXT[],
  track_frequency TEXT,
  detail_level TEXT,
  responses JSONB,
  questionnaire_points_earned INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(up.driving_focus, ARRAY[]::TEXT[]),
    COALESCE(up.work_preference, 'mixed'),
    COALESCE(up.budget_comfort, 'moderate'),
    COALESCE(up.mod_experience, 'beginner'),
    COALESCE(up.primary_goals, ARRAY[]::TEXT[]),
    COALESCE(up.track_frequency, 'never'),
    COALESCE(up.detail_level, 'balanced'),
    COALESCE(up.responses, '{}'::JSONB),
    COALESCE(up.questionnaire_points_earned, 0)
  FROM user_preferences up
  WHERE up.user_id = p_user_id;
  
  -- If no row found, return defaults
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      ARRAY[]::TEXT[],
      'mixed'::TEXT,
      'moderate'::TEXT,
      'beginner'::TEXT,
      ARRAY[]::TEXT[],
      'never'::TEXT,
      'balanced'::TEXT,
      '{}'::JSONB,
      0::INTEGER;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get insight feedback stats for analytics
CREATE OR REPLACE FUNCTION get_insight_feedback_stats(p_insight_type TEXT DEFAULT NULL)
RETURNS TABLE (
  insight_type TEXT,
  total_feedback BIGINT,
  thumbs_up BIGINT,
  thumbs_down BIGINT,
  approval_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    if.insight_type,
    COUNT(*) as total_feedback,
    COUNT(*) FILTER (WHERE if.rating = 'up') as thumbs_up,
    COUNT(*) FILTER (WHERE if.rating = 'down') as thumbs_down,
    ROUND(
      COUNT(*) FILTER (WHERE if.rating = 'up')::NUMERIC / 
      NULLIF(COUNT(*), 0) * 100, 
      1
    ) as approval_rate
  FROM insight_feedback if
  WHERE p_insight_type IS NULL OR if.insight_type = p_insight_type
  GROUP BY if.insight_type
  ORDER BY total_feedback DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TABLE COMMENTS
-- ============================================================================
COMMENT ON TABLE user_preferences IS 'User questionnaire responses and preferences for personalization. Used by Insights page and AL.';
COMMENT ON TABLE insight_feedback IS 'Thumbs up/down feedback on insights for human-in-the-loop learning and personalization.';

COMMENT ON COLUMN user_preferences.driving_focus IS 'What the user is most interested in: power, handling, daily, track, show';
COMMENT ON COLUMN user_preferences.work_preference IS 'DIY vs shop work preference';
COMMENT ON COLUMN user_preferences.responses IS 'All questionnaire responses as JSONB for flexibility';
COMMENT ON COLUMN user_preferences.questionnaire_points_earned IS 'Points earned from answering questionnaire questions';

COMMENT ON COLUMN insight_feedback.insight_type IS 'Category of insight: known_issue, maintenance_due, upgrade_suggestion, value_trend, recall, youtube_content';
COMMENT ON COLUMN insight_feedback.insight_key IS 'Unique identifier for the specific insight (e.g., issue ID, service interval key)';
COMMENT ON COLUMN insight_feedback.rating IS 'up = helpful, down = not relevant';
COMMENT ON COLUMN insight_feedback.insight_content IS 'Snapshot of what was shown for debugging/analytics';
