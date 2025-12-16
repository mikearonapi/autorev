-- ============================================================================
-- ADD CAR_REQUEST FEEDBACK TYPE
-- AutoRev - Allows users to request new vehicles to be added to the database
-- ============================================================================

-- Drop and recreate the check constraint to include 'car_request' type
ALTER TABLE user_feedback 
DROP CONSTRAINT IF EXISTS user_feedback_feedback_type_check;

ALTER TABLE user_feedback 
ADD CONSTRAINT user_feedback_feedback_type_check 
CHECK (feedback_type IN (
  'like',          -- Something they love
  'dislike',       -- Something that could be better
  'feature',       -- Feature request
  'bug',           -- Bug report
  'question',      -- Question/support
  'car_request',   -- Request to add a new vehicle to the database
  'other'          -- General feedback
));

-- Update comments
COMMENT ON COLUMN user_feedback.feedback_type IS 'Classification: like, dislike, feature, bug, question, car_request, other';










