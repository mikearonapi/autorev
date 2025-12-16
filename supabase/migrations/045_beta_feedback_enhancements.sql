-- ============================================================================
-- BETA FEEDBACK ENHANCEMENTS
-- AutoRev - Comprehensive feedback capture for beta testing phase
--
-- This migration adds:
--   1. New category system (bug, feature, data, general, praise)
--   2. Severity tracking for bugs (blocking, major, minor)
--   3. Context fields (feature_context, user_tier)
--   4. Resolution tracking (resolved_at, resolved_by)
--   5. Optional rating field
-- ============================================================================

-- ============================================================================
-- ADD NEW COLUMNS
-- ============================================================================

-- Category dropdown: Bug | Feature Request | Data Issue | General | Praise
ALTER TABLE user_feedback
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

-- Severity for bugs only (blocking, major, minor)
ALTER TABLE user_feedback
ADD COLUMN IF NOT EXISTS severity TEXT;

-- Context fields
ALTER TABLE user_feedback
ADD COLUMN IF NOT EXISTS feature_context TEXT;

-- User tier at time of feedback
ALTER TABLE user_feedback
ADD COLUMN IF NOT EXISTS user_tier TEXT;

-- Resolution tracking
ALTER TABLE user_feedback
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

ALTER TABLE user_feedback
ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Optional rating (1-5 stars)
ALTER TABLE user_feedback
ADD COLUMN IF NOT EXISTS rating INTEGER;

-- ============================================================================
-- ADD CONSTRAINTS
-- ============================================================================

-- Category constraint
ALTER TABLE user_feedback
DROP CONSTRAINT IF EXISTS user_feedback_category_check;

ALTER TABLE user_feedback
ADD CONSTRAINT user_feedback_category_check 
CHECK (category IS NULL OR category IN ('bug', 'feature', 'data', 'general', 'praise'));

-- Severity constraint (nullable, only applicable for bugs)
ALTER TABLE user_feedback
DROP CONSTRAINT IF EXISTS user_feedback_severity_check;

ALTER TABLE user_feedback
ADD CONSTRAINT user_feedback_severity_check 
CHECK (severity IS NULL OR severity IN ('blocking', 'major', 'minor'));

-- Rating constraint (1-5)
ALTER TABLE user_feedback
DROP CONSTRAINT IF EXISTS user_feedback_rating_check;

ALTER TABLE user_feedback
ADD CONSTRAINT user_feedback_rating_check
CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));

-- User tier constraint
ALTER TABLE user_feedback
DROP CONSTRAINT IF EXISTS user_feedback_user_tier_check;

ALTER TABLE user_feedback
ADD CONSTRAINT user_feedback_user_tier_check
CHECK (user_tier IS NULL OR user_tier IN ('free', 'collector', 'tuner', 'admin'));

-- ============================================================================
-- INDEXES FOR NEW FIELDS
-- ============================================================================

-- Category filtering
CREATE INDEX IF NOT EXISTS idx_user_feedback_category 
ON user_feedback(category);

-- Severity filtering (for bug triage)
CREATE INDEX IF NOT EXISTS idx_user_feedback_severity 
ON user_feedback(severity);

-- Resolution status
CREATE INDEX IF NOT EXISTS idx_user_feedback_resolved 
ON user_feedback(resolved_at);

-- User tier analytics
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_tier 
ON user_feedback(user_tier);

-- Rating analytics
CREATE INDEX IF NOT EXISTS idx_user_feedback_rating 
ON user_feedback(rating);

-- Composite: category + severity for bug triage
CREATE INDEX IF NOT EXISTS idx_user_feedback_category_severity 
ON user_feedback(category, severity) 
WHERE category = 'bug';

-- Composite: unresolved feedback by category
CREATE INDEX IF NOT EXISTS idx_user_feedback_unresolved_category 
ON user_feedback(category, created_at DESC) 
WHERE resolved_at IS NULL;

-- ============================================================================
-- UPDATE ANALYTICS FUNCTIONS
-- ============================================================================

-- Enhanced feedback counts with category breakdown
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
    COALESCE(uf.category, uf.feedback_type) AS type,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE uf.status = 'new') AS new_count,
    COUNT(*) FILTER (WHERE uf.status = 'resolved' OR uf.resolved_at IS NOT NULL) AS resolved_count
  FROM user_feedback uf
  GROUP BY COALESCE(uf.category, uf.feedback_type)
  ORDER BY total DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- New function: Get feedback summary with category and severity
CREATE OR REPLACE FUNCTION get_feedback_summary()
RETURNS TABLE (
  category TEXT,
  severity TEXT,
  total BIGINT,
  unresolved BIGINT,
  avg_rating DECIMAL(3,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uf.category,
    uf.severity,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE uf.resolved_at IS NULL AND uf.status NOT IN ('resolved', 'wont_fix')) AS unresolved,
    AVG(uf.rating)::DECIMAL(3,2) AS avg_rating
  FROM user_feedback uf
  GROUP BY uf.category, uf.severity
  ORDER BY 
    CASE uf.category 
      WHEN 'bug' THEN 1 
      WHEN 'data' THEN 2 
      WHEN 'feature' THEN 3 
      WHEN 'general' THEN 4 
      WHEN 'praise' THEN 5 
      ELSE 6 
    END,
    CASE uf.severity 
      WHEN 'blocking' THEN 1 
      WHEN 'major' THEN 2 
      WHEN 'minor' THEN 3 
      ELSE 4 
    END;
END;
$$ LANGUAGE plpgsql STABLE;

-- New function: Get unresolved bugs by severity
CREATE OR REPLACE FUNCTION get_unresolved_bugs(severity_filter TEXT DEFAULT NULL)
RETURNS SETOF user_feedback AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM user_feedback
  WHERE category = 'bug'
    AND resolved_at IS NULL
    AND status NOT IN ('resolved', 'wont_fix', 'duplicate')
    AND (severity_filter IS NULL OR severity = severity_filter)
  ORDER BY 
    CASE severity 
      WHEN 'blocking' THEN 1 
      WHEN 'major' THEN 2 
      WHEN 'minor' THEN 3 
      ELSE 4 
    END,
    created_at ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- New function: Mark feedback as resolved
CREATE OR REPLACE FUNCTION resolve_feedback(
  feedback_id UUID,
  resolver_user_id UUID,
  resolution_notes TEXT DEFAULT NULL
)
RETURNS user_feedback AS $$
DECLARE
  updated_record user_feedback;
BEGIN
  UPDATE user_feedback
  SET 
    resolved_at = NOW(),
    resolved_by = resolver_user_id,
    status = 'resolved',
    internal_notes = COALESCE(internal_notes || E'\n\n', '') || 
      'Resolved at ' || NOW()::TEXT || 
      CASE WHEN resolution_notes IS NOT NULL THEN ': ' || resolution_notes ELSE '' END,
    updated_at = NOW()
  WHERE id = feedback_id
  RETURNING * INTO updated_record;
  
  RETURN updated_record;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- UPDATE VIEW: Enhanced bug triage view
-- ============================================================================

CREATE OR REPLACE VIEW feedback_bug_triage AS
SELECT 
  id,
  category,
  severity,
  message,
  email,
  page_url,
  car_slug,
  feature_context,
  user_tier,
  browser_info,
  status,
  priority,
  created_at,
  resolved_at,
  CASE 
    WHEN resolved_at IS NOT NULL THEN 'resolved'
    WHEN severity = 'blocking' THEN 'critical'
    WHEN severity = 'major' THEN 'needs_attention'
    ELSE 'backlog'
  END AS triage_status,
  NOW() - created_at AS age
FROM user_feedback
WHERE category = 'bug'
ORDER BY 
  CASE severity 
    WHEN 'blocking' THEN 1 
    WHEN 'major' THEN 2 
    WHEN 'minor' THEN 3 
    ELSE 4 
  END,
  created_at ASC;

-- ============================================================================
-- UPDATE VIEW: Feedback by user tier
-- ============================================================================

CREATE OR REPLACE VIEW feedback_by_tier AS
SELECT 
  user_tier,
  category,
  COUNT(*) AS feedback_count,
  AVG(rating)::DECIMAL(3,2) AS avg_rating,
  COUNT(*) FILTER (WHERE category = 'praise') AS praise_count,
  COUNT(*) FILTER (WHERE category = 'bug') AS bug_count,
  COUNT(*) FILTER (WHERE category = 'feature') AS feature_count
FROM user_feedback
WHERE user_tier IS NOT NULL
GROUP BY user_tier, category
ORDER BY user_tier, category;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN user_feedback.category IS 'Beta feedback category: bug, feature, data, general, praise';
COMMENT ON COLUMN user_feedback.severity IS 'Bug severity: blocking, major, minor (only for category=bug)';
COMMENT ON COLUMN user_feedback.feature_context IS 'Which feature the user was using when submitting feedback';
COMMENT ON COLUMN user_feedback.user_tier IS 'User subscription tier at time of feedback: free, collector, tuner, admin';
COMMENT ON COLUMN user_feedback.rating IS 'Optional 1-5 star experience rating';
COMMENT ON COLUMN user_feedback.resolved_at IS 'Timestamp when feedback was marked as resolved';
COMMENT ON COLUMN user_feedback.resolved_by IS 'User ID of admin who resolved the feedback';
COMMENT ON VIEW feedback_bug_triage IS 'Bug triage view sorted by severity and age';
COMMENT ON VIEW feedback_by_tier IS 'Feedback analytics broken down by user tier';



