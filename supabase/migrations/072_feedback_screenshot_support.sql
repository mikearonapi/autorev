-- ============================================================================
-- FEEDBACK SCREENSHOT SUPPORT
-- AutoRev - Add screenshot capture capability to feedback submissions
--
-- This migration adds:
--   1. screenshot_url column to store Vercel Blob URLs of captured screenshots
--   2. screenshot_metadata column for image dimensions and capture context
-- ============================================================================

-- ============================================================================
-- ADD SCREENSHOT COLUMNS
-- ============================================================================

-- Screenshot URL (Vercel Blob storage URL)
ALTER TABLE user_feedback
ADD COLUMN IF NOT EXISTS screenshot_url TEXT;

-- Screenshot metadata (dimensions, capture time, file size, etc.)
ALTER TABLE user_feedback
ADD COLUMN IF NOT EXISTS screenshot_metadata JSONB;

-- ============================================================================
-- ADD INDEX FOR FEEDBACK WITH SCREENSHOTS
-- Useful for filtering feedback that has visual context
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_feedback_has_screenshot
ON user_feedback (created_at DESC)
WHERE screenshot_url IS NOT NULL;

-- ============================================================================
-- DROP AND RECREATE VIEW (columns changed)
-- ============================================================================

DROP VIEW IF EXISTS feedback_bug_triage;

CREATE VIEW feedback_bug_triage AS
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
  screenshot_url,
  CASE 
    WHEN resolved_at IS NOT NULL THEN 'resolved'
    WHEN severity = 'blocking' THEN 'critical'
    WHEN severity = 'major' THEN 'needs_attention'
    ELSE 'backlog'
  END AS triage_status,
  CASE WHEN screenshot_url IS NOT NULL THEN true ELSE false END AS has_screenshot,
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
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN user_feedback.screenshot_url IS 'Vercel Blob URL of captured page screenshot at time of feedback submission';
COMMENT ON COLUMN user_feedback.screenshot_metadata IS 'Screenshot metadata: {width, height, capturedAt, fileSize, scrollPosition}';

