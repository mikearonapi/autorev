-- ============================================================================
-- USER FEEDBACK TABLE
-- AutoRev - Feedback Collection & Analytics
--
-- This migration adds:
--   1. user_feedback table for storing all user feedback
--   2. Analytics-ready schema with proper indexes
--   3. Support for both authenticated and anonymous feedback
-- ============================================================================

-- ============================================================================
-- USER FEEDBACK TABLE
-- Store all user feedback for analytics and improvements
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- User reference (nullable for anonymous feedback)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,  -- For anonymous tracking
  
  -- Feedback classification
  feedback_type TEXT NOT NULL CHECK (feedback_type IN (
    'like',        -- Something they love
    'dislike',     -- Something that could be better
    'feature',     -- Feature request
    'bug',         -- Bug report
    'question',    -- Question/support
    'other'        -- General feedback
  )),
  
  -- Feedback content
  message TEXT NOT NULL,
  
  -- Contact info (optional)
  email TEXT,
  
  -- Context - where feedback was submitted from
  page_url TEXT,
  page_title TEXT,
  
  -- Additional context
  car_slug TEXT,  -- If feedback is about a specific car
  build_id UUID,  -- If feedback is about a specific build
  
  -- Browser/device info for bug reports
  user_agent TEXT,
  browser_info JSONB,  -- { browser, version, os, device }
  
  -- Screen size for layout bugs
  screen_width INTEGER,
  screen_height INTEGER,
  
  -- Admin tracking
  status TEXT DEFAULT 'new' CHECK (status IN (
    'new',           -- Fresh feedback
    'reviewed',      -- Team has seen it
    'in_progress',   -- Being worked on
    'resolved',      -- Issue fixed / request implemented
    'wont_fix',      -- Not actionable
    'duplicate'      -- Duplicate of existing feedback
  )),
  
  -- Internal notes (admin only)
  internal_notes TEXT,
  assigned_to TEXT,  -- Team member handling this
  
  -- Response tracking
  responded_at TIMESTAMPTZ,
  response_message TEXT,
  
  -- Priority for triage
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Tags for categorization (flexible array)
  tags TEXT[] DEFAULT '{}',
  
  -- Sentiment analysis (can be updated by ML later)
  sentiment_score DECIMAL(3,2),  -- -1.0 to 1.0
  sentiment_label TEXT CHECK (sentiment_label IN ('negative', 'neutral', 'positive')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR ANALYTICS QUERIES
-- ============================================================================

-- Primary lookup indexes
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_type ON user_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_user_feedback_status ON user_feedback(status);
CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at ON user_feedback(created_at DESC);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_user_feedback_priority ON user_feedback(priority);
CREATE INDEX IF NOT EXISTS idx_user_feedback_car_slug ON user_feedback(car_slug);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_feedback_type_status ON user_feedback(feedback_type, status);
CREATE INDEX IF NOT EXISTS idx_user_feedback_status_priority ON user_feedback(status, priority);

-- Full-text search on message content
CREATE INDEX IF NOT EXISTS idx_user_feedback_message_search ON user_feedback USING gin(to_tsvector('english', message));

-- GIN index on tags array
CREATE INDEX IF NOT EXISTS idx_user_feedback_tags ON user_feedback USING gin(tags);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- Allow anyone to INSERT feedback (both auth and anon)
DROP POLICY IF EXISTS "Anyone can submit feedback" ON user_feedback;
CREATE POLICY "Anyone can submit feedback" ON user_feedback
  FOR INSERT
  WITH CHECK (true);

-- Users can only SELECT their own feedback
DROP POLICY IF EXISTS "Users can view own feedback" ON user_feedback;
CREATE POLICY "Users can view own feedback" ON user_feedback
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can do anything (for admin dashboard)
DROP POLICY IF EXISTS "Service role full access" ON user_feedback;
CREATE POLICY "Service role full access" ON user_feedback
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- AUTO-UPDATE TIMESTAMP TRIGGER
-- ============================================================================

DROP TRIGGER IF EXISTS update_user_feedback_updated_at ON user_feedback;
CREATE TRIGGER update_user_feedback_updated_at
  BEFORE UPDATE ON user_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ANALYTICS VIEWS
-- ============================================================================

-- Daily feedback summary
CREATE OR REPLACE VIEW feedback_daily_summary AS
SELECT 
  DATE(created_at) AS date,
  feedback_type,
  COUNT(*) AS count,
  COUNT(DISTINCT user_id) AS unique_users,
  AVG(sentiment_score) AS avg_sentiment
FROM user_feedback
GROUP BY DATE(created_at), feedback_type
ORDER BY date DESC, feedback_type;

-- Feedback by status
CREATE OR REPLACE VIEW feedback_status_summary AS
SELECT 
  status,
  priority,
  COUNT(*) AS count,
  MIN(created_at) AS oldest,
  MAX(created_at) AS newest
FROM user_feedback
GROUP BY status, priority
ORDER BY 
  CASE status WHEN 'new' THEN 1 WHEN 'reviewed' THEN 2 WHEN 'in_progress' THEN 3 ELSE 4 END,
  CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END;

-- Top requested features
CREATE OR REPLACE VIEW feedback_top_features AS
SELECT 
  message,
  COUNT(*) AS request_count,
  array_agg(DISTINCT user_id) AS requesting_users
FROM user_feedback
WHERE feedback_type = 'feature'
  AND status NOT IN ('resolved', 'wont_fix', 'duplicate')
GROUP BY message
ORDER BY request_count DESC
LIMIT 50;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get feedback counts by type for dashboard
CREATE OR REPLACE FUNCTION get_feedback_counts()
RETURNS TABLE (
  type TEXT,
  total BIGINT,
  new_count BIGINT,
  resolved_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    feedback_type AS type,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE status = 'new') AS new_count,
    COUNT(*) FILTER (WHERE status = 'resolved') AS resolved_count
  FROM user_feedback
  GROUP BY feedback_type
  ORDER BY total DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Search feedback with full-text
CREATE OR REPLACE FUNCTION search_feedback(
  search_query TEXT,
  type_filter TEXT DEFAULT NULL,
  status_filter TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 50
)
RETURNS SETOF user_feedback AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM user_feedback
  WHERE 
    (search_query IS NULL OR to_tsvector('english', message) @@ plainto_tsquery('english', search_query))
    AND (type_filter IS NULL OR feedback_type = type_filter)
    AND (status_filter IS NULL OR status = status_filter)
  ORDER BY created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE user_feedback IS 'User feedback storage for analytics and product improvement';
COMMENT ON COLUMN user_feedback.feedback_type IS 'Classification: like, dislike, feature, bug, question, other';
COMMENT ON COLUMN user_feedback.status IS 'Admin workflow status for tracking resolution';
COMMENT ON COLUMN user_feedback.sentiment_score IS 'ML-derived sentiment score (-1.0 to 1.0) for analytics';
COMMENT ON COLUMN user_feedback.tags IS 'Flexible tags array for categorization';
COMMENT ON VIEW feedback_daily_summary IS 'Daily aggregated feedback metrics for dashboards';
COMMENT ON VIEW feedback_top_features IS 'Most requested features by user count';





















