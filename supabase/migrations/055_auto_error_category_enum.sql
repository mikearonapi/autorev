-- ============================================================================
-- AUTO ERROR CATEGORY SUPPORT
-- Allows category='auto-error' alongside existing categories
-- Keeps feedback_type constraint unchanged (auto errors use category only)
-- ============================================================================

-- Expand category constraint to include auto-error
ALTER TABLE user_feedback
DROP CONSTRAINT IF EXISTS user_feedback_category_check;

ALTER TABLE user_feedback
ADD CONSTRAINT user_feedback_category_check
CHECK (category IS NULL OR category IN ('bug', 'feature', 'data', 'general', 'praise', 'auto-error'));

-- Document the new category
COMMENT ON COLUMN user_feedback.category IS 'Beta feedback category: bug, feature, data, general, praise, auto-error';







