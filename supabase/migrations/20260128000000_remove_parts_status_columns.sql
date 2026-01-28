-- Migration: Remove parts status columns
-- Description: Removes the status tracking columns from user_project_parts table
-- as the application no longer tracks Planned/Purchased/Installed status.
-- The build page determines what shows on parts page (brand selection) and 
-- install page (installation help).

-- Drop the index first
DROP INDEX IF EXISTS idx_user_project_parts_status;

-- Remove status columns from user_project_parts table
ALTER TABLE user_project_parts
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS purchased_at,
  DROP COLUMN IF EXISTS installed_at,
  DROP COLUMN IF EXISTS installed_by;

-- Note: This migration is irreversible. Status data will be lost.
-- Run this only after deploying the application code changes that remove status tracking.
