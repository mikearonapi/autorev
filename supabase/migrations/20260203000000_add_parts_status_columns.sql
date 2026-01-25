-- ============================================================================
-- Migration: Add status tracking columns to user_project_parts
--
-- Why:
-- - Users can track parts through their lifecycle: planned → purchased → installed
-- - The UI allows changing status on the Parts page and Install page
-- - These fields were being saved in code but the columns didn't exist in the DB
-- ============================================================================

-- Add status column with check constraint for valid values
ALTER TABLE user_project_parts 
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'planned';

-- Add timestamp columns for when parts were purchased/installed
ALTER TABLE user_project_parts 
  ADD COLUMN IF NOT EXISTS purchased_at TIMESTAMPTZ;

ALTER TABLE user_project_parts 
  ADD COLUMN IF NOT EXISTS installed_at TIMESTAMPTZ;

-- Add who installed (self, shop name, etc.)
ALTER TABLE user_project_parts 
  ADD COLUMN IF NOT EXISTS installed_by TEXT;

-- Add constraint for valid status values
-- Use DO block to handle case where constraint may already exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_project_parts_status_check'
  ) THEN
    ALTER TABLE user_project_parts 
      ADD CONSTRAINT user_project_parts_status_check 
      CHECK (status IN ('planned', 'purchased', 'installed'));
  END IF;
END $$;

-- Create index for efficient status queries (e.g., "show all installed parts")
CREATE INDEX IF NOT EXISTS idx_user_project_parts_status 
  ON user_project_parts(project_id, status);

-- Backfill: Set any parts with installed_at to 'installed' status
UPDATE user_project_parts 
SET status = 'installed' 
WHERE installed_at IS NOT NULL AND (status IS NULL OR status = 'planned');

-- Backfill: Set any parts with purchased_at to 'purchased' status (if not already installed)
UPDATE user_project_parts 
SET status = 'purchased' 
WHERE purchased_at IS NOT NULL AND status = 'planned';

COMMENT ON COLUMN user_project_parts.status IS 'Part lifecycle status: planned, purchased, or installed';
COMMENT ON COLUMN user_project_parts.purchased_at IS 'Timestamp when the part was purchased';
COMMENT ON COLUMN user_project_parts.installed_at IS 'Timestamp when the part was installed';
COMMENT ON COLUMN user_project_parts.installed_by IS 'Who installed the part: self, or shop name';
