-- ============================================================================
-- AUTO-ERROR LOGGING SUPPORT
-- AutoRev - Automatic Client-Side Error Capture
--
-- Adds:
--   1. error_metadata JSONB column for storing error details
--   2. Partial index for filtering auto-error category
--   3. Partial index for finding unresolved auto-errors
--
-- Applied: December 18, 2024
-- ============================================================================

-- Add error metadata column to user_feedback (if not exists)
ALTER TABLE user_feedback 
ADD COLUMN IF NOT EXISTS error_metadata JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN user_feedback.error_metadata IS 'Stores structured error data for auto-captured errors: stack trace, component, error boundary info, etc.';

-- Add partial index for filtering auto-errors efficiently
-- Note: idx_user_feedback_category already exists as a full index,
-- but this partial index is more efficient for auto-error queries
CREATE INDEX IF NOT EXISTS idx_user_feedback_auto_errors
ON user_feedback(category) 
WHERE category = 'auto-error';

-- Add index for unresolved auto-errors (sorted by newest first)
-- Note: Using resolved_at IS NULL since there's no 'resolved' boolean column
CREATE INDEX IF NOT EXISTS idx_user_feedback_unresolved_auto_errors
ON user_feedback(created_at DESC) 
WHERE category = 'auto-error' AND resolved_at IS NULL;
