-- Migration: P3 Soft Delete Pattern Implementation
-- Date: January 27, 2026
-- Purpose: Add soft delete capability to key tables for data recovery

-- ============================================================================
-- ADD deleted_at COLUMNS TO KEY TABLES
-- ============================================================================

-- User Projects - users may want to recover deleted builds
ALTER TABLE user_projects 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- User Vehicles - preserve history of owned vehicles
ALTER TABLE user_vehicles 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- User Favorites - allow unfavorite recovery
ALTER TABLE user_favorites 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Community Posts - preserve content for moderation review
ALTER TABLE community_posts 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- AL Conversations - preserve chat history
ALTER TABLE al_conversations 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- User Feedback - preserve all feedback even if "deleted"
ALTER TABLE user_feedback 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- ============================================================================
-- CREATE INDEXES FOR SOFT DELETE QUERIES
-- Most queries should exclude deleted records
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_projects_active 
  ON user_projects(user_id, created_at DESC) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_vehicles_active 
  ON user_vehicles(user_id, created_at DESC) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_favorites_active 
  ON user_favorites(user_id, created_at DESC) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_community_posts_active 
  ON community_posts(user_id, created_at DESC) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_al_conversations_active 
  ON al_conversations(user_id, created_at DESC) 
  WHERE deleted_at IS NULL;

-- ============================================================================
-- SOFT DELETE HELPER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Instead of deleting, set deleted_at timestamp
  NEW.deleted_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- UPDATE RLS POLICIES TO EXCLUDE DELETED RECORDS
-- ============================================================================

-- User Projects - only show non-deleted to users
DROP POLICY IF EXISTS "Users can view own projects" ON user_projects;
CREATE POLICY "Users can view own projects" ON user_projects
  FOR SELECT USING (
    auth.uid() = user_id 
    AND deleted_at IS NULL
  );

DROP POLICY IF EXISTS "Users can view own deleted projects" ON user_projects;
CREATE POLICY "Users can view own deleted projects" ON user_projects
  FOR SELECT USING (
    auth.uid() = user_id
    AND deleted_at IS NOT NULL
  );

-- User Vehicles - only show non-deleted to users  
DROP POLICY IF EXISTS "Users can view own vehicles" ON user_vehicles;
CREATE POLICY "Users can view own vehicles" ON user_vehicles
  FOR SELECT USING (
    auth.uid() = user_id 
    AND deleted_at IS NULL
  );

-- User Favorites - only show non-deleted
DROP POLICY IF EXISTS "Users can view own favorites" ON user_favorites;
CREATE POLICY "Users can view own favorites" ON user_favorites
  FOR SELECT USING (
    auth.uid() = user_id 
    AND deleted_at IS NULL
  );

-- Community Posts - show only active posts to public
DROP POLICY IF EXISTS "Public can view published posts" ON community_posts;
CREATE POLICY "Public can view published posts" ON community_posts
  FOR SELECT USING (
    is_published = true 
    AND deleted_at IS NULL
  );

-- AL Conversations - only show non-deleted
DROP POLICY IF EXISTS "Users can view own conversations" ON al_conversations;
CREATE POLICY "Users can view own conversations" ON al_conversations
  FOR SELECT USING (
    auth.uid() = user_id 
    AND deleted_at IS NULL
  );

-- ============================================================================
-- RESTORE FUNCTION
-- Call this to restore soft-deleted records
-- ============================================================================

CREATE OR REPLACE FUNCTION restore_soft_deleted(
  p_table_name TEXT,
  p_record_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_result BOOLEAN;
BEGIN
  EXECUTE format(
    'UPDATE %I SET deleted_at = NULL WHERE id = $1 AND user_id = $2 RETURNING true',
    p_table_name
  ) INTO v_result USING p_record_id, p_user_id;
  
  RETURN COALESCE(v_result, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION restore_soft_deleted IS 'Restores a soft-deleted record by clearing deleted_at';

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN user_projects.deleted_at IS 'Soft delete timestamp - NULL means active';
COMMENT ON COLUMN user_vehicles.deleted_at IS 'Soft delete timestamp - NULL means active';
COMMENT ON COLUMN user_favorites.deleted_at IS 'Soft delete timestamp - NULL means active';
COMMENT ON COLUMN community_posts.deleted_at IS 'Soft delete timestamp - NULL means active';
COMMENT ON COLUMN al_conversations.deleted_at IS 'Soft delete timestamp - NULL means active';
COMMENT ON COLUMN user_feedback.deleted_at IS 'Soft delete timestamp - NULL means active';
