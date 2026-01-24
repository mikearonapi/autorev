-- AL Response Feedback System
-- Enables collection of thumbs up/down feedback on AL responses
-- Used for quality monitoring and potential DPO training data

-- =============================================================================
-- FEEDBACK TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS al_response_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to conversation and message
  conversation_id UUID REFERENCES al_conversations(id) ON DELETE CASCADE,
  message_id UUID NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Feedback data
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('thumbs_up', 'thumbs_down')),
  feedback_reason TEXT, -- Optional: why they gave this feedback
  feedback_category TEXT CHECK (feedback_category IN (
    'helpful',
    'accurate', 
    'well_explained',
    'inaccurate',
    'unhelpful',
    'confusing',
    'missing_info',
    'off_topic',
    'unsafe',
    'other'
  )),
  
  -- Context for analysis
  query_text TEXT, -- The user's original query
  response_text TEXT, -- AL's response (truncated)
  tools_used TEXT[], -- Tools called in this response
  
  -- Metadata
  prompt_version_id UUID REFERENCES al_prompt_versions(id) ON DELETE SET NULL,
  response_tokens INTEGER,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_al_response_feedback_user 
  ON al_response_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_al_response_feedback_conversation 
  ON al_response_feedback(conversation_id);
CREATE INDEX IF NOT EXISTS idx_al_response_feedback_type 
  ON al_response_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_al_response_feedback_created 
  ON al_response_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_al_response_feedback_prompt_version 
  ON al_response_feedback(prompt_version_id);

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE al_response_feedback ENABLE ROW LEVEL SECURITY;

-- Users can insert feedback for their own messages
CREATE POLICY "Users can insert own feedback" ON al_response_feedback
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own feedback
CREATE POLICY "Users can view own feedback" ON al_response_feedback
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all feedback
CREATE POLICY "Admins can view all feedback" ON al_response_feedback
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Service role can insert/select all (for API operations)
CREATE POLICY "Service role full access" ON al_response_feedback
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- AGGREGATE FUNCTIONS
-- =============================================================================

-- Get feedback summary by time period
CREATE OR REPLACE FUNCTION get_feedback_summary(
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  total_feedback BIGINT,
  thumbs_up BIGINT,
  thumbs_down BIGINT,
  approval_rate NUMERIC,
  top_negative_reasons JSONB
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH feedback_counts AS (
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE feedback_type = 'thumbs_up') as up,
      COUNT(*) FILTER (WHERE feedback_type = 'thumbs_down') as down
    FROM al_response_feedback
    WHERE created_at BETWEEN p_start_date AND p_end_date
  ),
  negative_reasons AS (
    SELECT 
      feedback_category,
      COUNT(*) as count
    FROM al_response_feedback
    WHERE feedback_type = 'thumbs_down'
      AND created_at BETWEEN p_start_date AND p_end_date
      AND feedback_category IS NOT NULL
    GROUP BY feedback_category
    ORDER BY count DESC
    LIMIT 5
  )
  SELECT 
    fc.total as total_feedback,
    fc.up as thumbs_up,
    fc.down as thumbs_down,
    CASE 
      WHEN fc.total > 0 THEN ROUND((fc.up::NUMERIC / fc.total) * 100, 1)
      ELSE 0 
    END as approval_rate,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('category', feedback_category, 'count', count)) FROM negative_reasons),
      '[]'::jsonb
    ) as top_negative_reasons
  FROM feedback_counts fc;
$$;

-- Get feedback trend by day
CREATE OR REPLACE FUNCTION get_feedback_trend(
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  date DATE,
  thumbs_up BIGINT,
  thumbs_down BIGINT,
  total BIGINT,
  approval_rate NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    DATE(created_at) as date,
    COUNT(*) FILTER (WHERE feedback_type = 'thumbs_up') as thumbs_up,
    COUNT(*) FILTER (WHERE feedback_type = 'thumbs_down') as thumbs_down,
    COUNT(*) as total,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        ROUND((COUNT(*) FILTER (WHERE feedback_type = 'thumbs_up')::NUMERIC / COUNT(*)) * 100, 1)
      ELSE 0 
    END as approval_rate
  FROM al_response_feedback
  WHERE created_at > NOW() - (p_days || ' days')::INTERVAL
  GROUP BY DATE(created_at)
  ORDER BY date DESC;
$$;

-- Get feedback by prompt version (for A/B testing)
CREATE OR REPLACE FUNCTION get_feedback_by_prompt_version()
RETURNS TABLE (
  prompt_version_id UUID,
  total_feedback BIGINT,
  thumbs_up BIGINT,
  thumbs_down BIGINT,
  approval_rate NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    prompt_version_id,
    COUNT(*) as total_feedback,
    COUNT(*) FILTER (WHERE feedback_type = 'thumbs_up') as thumbs_up,
    COUNT(*) FILTER (WHERE feedback_type = 'thumbs_down') as thumbs_down,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        ROUND((COUNT(*) FILTER (WHERE feedback_type = 'thumbs_up')::NUMERIC / COUNT(*)) * 100, 1)
      ELSE 0 
    END as approval_rate
  FROM al_response_feedback
  WHERE prompt_version_id IS NOT NULL
  GROUP BY prompt_version_id
  ORDER BY total_feedback DESC;
$$;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE al_response_feedback IS 'Stores user feedback (thumbs up/down) on AL responses for quality monitoring';
COMMENT ON COLUMN al_response_feedback.feedback_type IS 'Primary feedback: thumbs_up or thumbs_down';
COMMENT ON COLUMN al_response_feedback.feedback_reason IS 'Optional free-text explanation of feedback';
COMMENT ON COLUMN al_response_feedback.feedback_category IS 'Categorized reason for feedback';
COMMENT ON COLUMN al_response_feedback.prompt_version_id IS 'Links feedback to specific prompt version for A/B testing analysis';
