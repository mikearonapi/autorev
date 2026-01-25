-- =============================================================================
-- User Questionnaire System ("Enthusiast Profile")
-- =============================================================================
-- Stores unlimited user questionnaire responses in a flexible schema.
-- Supports progressive disclosure - users can answer as many questions as they want.
-- Integrated with AL for personalized recommendations.
-- =============================================================================

-- =============================================================================
-- TABLE: user_questionnaire_responses
-- Individual question responses (flexible, unlimited)
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_questionnaire_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  question_category TEXT NOT NULL,
  answer JSONB NOT NULL,
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_uqr_user_id ON user_questionnaire_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_uqr_category ON user_questionnaire_responses(question_category);
CREATE INDEX IF NOT EXISTS idx_uqr_answered_at ON user_questionnaire_responses(answered_at DESC);

-- RLS policies
ALTER TABLE user_questionnaire_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own questionnaire responses" ON user_questionnaire_responses;
CREATE POLICY "Users can read own questionnaire responses"
  ON user_questionnaire_responses FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own questionnaire responses" ON user_questionnaire_responses;
CREATE POLICY "Users can insert own questionnaire responses"
  ON user_questionnaire_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own questionnaire responses" ON user_questionnaire_responses;
CREATE POLICY "Users can update own questionnaire responses"
  ON user_questionnaire_responses FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own questionnaire responses" ON user_questionnaire_responses;
CREATE POLICY "Users can delete own questionnaire responses"
  ON user_questionnaire_responses FOR DELETE
  USING (auth.uid() = user_id);

-- Service role access
DROP POLICY IF EXISTS "Service role full access to questionnaire responses" ON user_questionnaire_responses;
CREATE POLICY "Service role full access to questionnaire responses"
  ON user_questionnaire_responses FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================================================
-- TABLE: user_profile_summary
-- Derived profile summary (computed from responses)
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_profile_summary (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_completeness_pct INTEGER DEFAULT 0,
  driving_persona TEXT,
  knowledge_level TEXT,
  engagement_style TEXT,
  interests TEXT[],
  category_completion JSONB DEFAULT '{}',
  answered_count INTEGER DEFAULT 0,
  total_points_earned INTEGER DEFAULT 0,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for profile summary
ALTER TABLE user_profile_summary ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile summary" ON user_profile_summary;
CREATE POLICY "Users can read own profile summary"
  ON user_profile_summary FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile summary" ON user_profile_summary;
CREATE POLICY "Users can update own profile summary"
  ON user_profile_summary FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role for automated updates
DROP POLICY IF EXISTS "Service role full access to profile summary" ON user_profile_summary;
CREATE POLICY "Service role full access to profile summary"
  ON user_profile_summary FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================================================
-- FUNCTION: recalculate_profile_summary
-- Recalculates derived profile data from questionnaire responses
-- =============================================================================

CREATE OR REPLACE FUNCTION recalculate_profile_summary(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_count INTEGER;
  v_total_questions INTEGER := 60; -- Base number, adjust as library grows
  v_category_counts JSONB;
  v_driving_persona TEXT;
  v_knowledge_level TEXT;
  v_interests TEXT[];
BEGIN
  -- Count total responses
  SELECT COUNT(*) INTO v_count
  FROM user_questionnaire_responses
  WHERE user_id = p_user_id;
  
  -- Calculate category completion
  SELECT jsonb_object_agg(category, cnt) INTO v_category_counts
  FROM (
    SELECT question_category AS category, COUNT(*) AS cnt
    FROM user_questionnaire_responses
    WHERE user_id = p_user_id
    GROUP BY question_category
  ) sub;
  
  -- Derive driving persona from responses
  SELECT 
    CASE 
      WHEN (answer->>'value')::text IN ('aggressive', 'track_only') THEN 'track_enthusiast'
      WHEN (answer->>'value')::text IN ('spirited') THEN 'spirited_driver'
      WHEN (answer->>'value')::text IN ('relaxed') THEN 'casual_enthusiast'
      ELSE NULL
    END INTO v_driving_persona
  FROM user_questionnaire_responses
  WHERE user_id = p_user_id AND question_id = 'driving_aggression'
  LIMIT 1;
  
  -- Derive knowledge level from car_knowledge responses
  SELECT
    CASE
      WHEN AVG(
        CASE (answer->>'value')::text
          WHEN 'none' THEN 1
          WHEN 'no_idea' THEN 1
          WHEN 'basic' THEN 2
          WHEN 'good' THEN 3
          WHEN 'intermediate' THEN 3
          WHEN 'expert' THEN 4
          WHEN 'advanced' THEN 4
          ELSE 2
        END
      ) >= 3.5 THEN 'expert'
      WHEN AVG(
        CASE (answer->>'value')::text
          WHEN 'none' THEN 1
          WHEN 'no_idea' THEN 1
          WHEN 'basic' THEN 2
          WHEN 'good' THEN 3
          WHEN 'intermediate' THEN 3
          WHEN 'expert' THEN 4
          WHEN 'advanced' THEN 4
          ELSE 2
        END
      ) >= 2.5 THEN 'intermediate'
      ELSE 'beginner'
    END INTO v_knowledge_level
  FROM user_questionnaire_responses
  WHERE user_id = p_user_id AND question_category = 'car_knowledge';
  
  -- Extract interests from multi-select responses
  SELECT ARRAY_AGG(DISTINCT interest) INTO v_interests
  FROM (
    SELECT jsonb_array_elements_text(answer->'values') AS interest
    FROM user_questionnaire_responses
    WHERE user_id = p_user_id 
      AND question_id IN ('driving_focus', 'primary_goals', 'want_to_learn_mods', 'track_goals')
      AND jsonb_typeof(answer->'values') = 'array'
  ) sub;
  
  -- Upsert profile summary
  INSERT INTO user_profile_summary (
    user_id, 
    answered_count, 
    profile_completeness_pct, 
    category_completion,
    driving_persona,
    knowledge_level,
    interests,
    last_updated_at
  )
  VALUES (
    p_user_id, 
    v_count, 
    LEAST(100, (v_count * 100 / v_total_questions)), 
    COALESCE(v_category_counts, '{}'),
    v_driving_persona,
    v_knowledge_level,
    v_interests,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    answered_count = v_count,
    profile_completeness_pct = LEAST(100, (v_count * 100 / v_total_questions)),
    category_completion = COALESCE(v_category_counts, '{}'),
    driving_persona = COALESCE(v_driving_persona, user_profile_summary.driving_persona),
    knowledge_level = COALESCE(v_knowledge_level, user_profile_summary.knowledge_level),
    interests = COALESCE(v_interests, user_profile_summary.interests),
    last_updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- TRIGGER: Auto-update profile summary on response changes
-- =============================================================================

CREATE OR REPLACE FUNCTION trigger_update_profile_summary()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM recalculate_profile_summary(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS after_questionnaire_response_insert ON user_questionnaire_responses;
CREATE TRIGGER after_questionnaire_response_insert
  AFTER INSERT ON user_questionnaire_responses
  FOR EACH ROW EXECUTE FUNCTION trigger_update_profile_summary();

DROP TRIGGER IF EXISTS after_questionnaire_response_update ON user_questionnaire_responses;
CREATE TRIGGER after_questionnaire_response_update
  AFTER UPDATE ON user_questionnaire_responses
  FOR EACH ROW EXECUTE FUNCTION trigger_update_profile_summary();

-- =============================================================================
-- TRIGGER: Auto-update updated_at timestamp
-- =============================================================================

DROP TRIGGER IF EXISTS set_questionnaire_response_updated_at ON user_questionnaire_responses;
CREATE TRIGGER set_questionnaire_response_updated_at
  BEFORE UPDATE ON user_questionnaire_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- RPC: get_user_questionnaire_data
-- Fetch all questionnaire data for a user in one call
-- =============================================================================

CREATE OR REPLACE FUNCTION get_user_questionnaire_data(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_responses JSONB;
  v_summary JSONB;
BEGIN
  -- Get all responses as a key-value map
  SELECT jsonb_object_agg(question_id, answer) INTO v_responses
  FROM user_questionnaire_responses
  WHERE user_id = p_user_id;
  
  -- Get profile summary
  SELECT to_jsonb(s) INTO v_summary
  FROM user_profile_summary s
  WHERE user_id = p_user_id;
  
  RETURN jsonb_build_object(
    'responses', COALESCE(v_responses, '{}'),
    'summary', v_summary
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- RPC: save_questionnaire_responses
-- Save multiple responses in one call (upsert)
-- =============================================================================

CREATE OR REPLACE FUNCTION save_questionnaire_responses(
  p_user_id UUID,
  p_responses JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_key TEXT;
  v_value JSONB;
  v_category TEXT;
  v_saved_count INTEGER := 0;
BEGIN
  -- Validate user
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id is required';
  END IF;
  
  -- Process each response
  FOR v_key, v_value IN SELECT * FROM jsonb_each(p_responses)
  LOOP
    -- Extract category from the response or use 'core' as default
    v_category := COALESCE(v_value->>'category', 'core');
    
    -- Upsert the response
    INSERT INTO user_questionnaire_responses (user_id, question_id, question_category, answer)
    VALUES (p_user_id, v_key, v_category, v_value - 'category')
    ON CONFLICT (user_id, question_id) DO UPDATE SET
      answer = EXCLUDED.answer,
      question_category = EXCLUDED.question_category,
      updated_at = NOW();
    
    v_saved_count := v_saved_count + 1;
  END LOOP;
  
  -- Profile summary is auto-updated via trigger
  
  RETURN jsonb_build_object(
    'success', true,
    'saved_count', v_saved_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- RPC: get_questionnaire_for_al
-- Optimized fetch for AL system prompt - returns formatted context
-- =============================================================================

CREATE OR REPLACE FUNCTION get_questionnaire_for_al(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'answered_count', COALESCE(s.answered_count, 0),
    'profile_completeness_pct', COALESCE(s.profile_completeness_pct, 0),
    'driving_persona', s.driving_persona,
    'knowledge_level', s.knowledge_level,
    'interests', COALESCE(s.interests, ARRAY[]::TEXT[]),
    'responses', COALESCE(
      (
        SELECT jsonb_object_agg(r.question_id, r.answer)
        FROM user_questionnaire_responses r
        WHERE r.user_id = p_user_id
      ),
      '{}'::JSONB
    ),
    'by_category', COALESCE(
      (
        SELECT jsonb_object_agg(
          sub.question_category,
          sub.responses
        )
        FROM (
          SELECT 
            question_category,
            jsonb_agg(jsonb_build_object('id', question_id, 'answer', answer)) AS responses
          FROM user_questionnaire_responses
          WHERE user_id = p_user_id
          GROUP BY question_category
        ) sub
      ),
      '{}'::JSONB
    )
  ) INTO v_result
  FROM user_profile_summary s
  WHERE s.user_id = p_user_id;
  
  -- Return empty structure if no data
  IF v_result IS NULL THEN
    RETURN jsonb_build_object(
      'answered_count', 0,
      'profile_completeness_pct', 0,
      'driving_persona', NULL,
      'knowledge_level', NULL,
      'interests', ARRAY[]::TEXT[],
      'responses', '{}'::JSONB,
      'by_category', '{}'::JSONB
    );
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- Grant execute permissions
-- =============================================================================

GRANT EXECUTE ON FUNCTION recalculate_profile_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_questionnaire_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION save_questionnaire_responses(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_questionnaire_for_al(UUID) TO authenticated;
