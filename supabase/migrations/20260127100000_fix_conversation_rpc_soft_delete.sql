-- ============================================================================
-- Migration: 20260127100000_fix_conversation_rpc_soft_delete.sql
-- Description: Fix RPC to filter out soft-deleted conversations
--              The original RPC was created before soft delete was implemented
-- ============================================================================

-- Drop and recreate to fix the soft delete filter
DROP FUNCTION IF EXISTS get_user_conversations_with_preview(UUID, INT, INT, BOOLEAN, TEXT);

-- Create the RPC function with soft delete filter
CREATE OR REPLACE FUNCTION get_user_conversations_with_preview(
  p_user_id UUID,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0,
  p_include_archived BOOLEAN DEFAULT FALSE,
  p_car_slug TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  initial_car_slug TEXT,
  initial_car_id UUID,
  message_count INT,
  last_message_at TIMESTAMPTZ,
  is_archived BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  preview TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.user_id,
    c.title,
    c.initial_car_slug,
    c.initial_car_id,
    c.message_count,
    c.last_message_at,
    c.is_archived,
    c.created_at,
    c.updated_at,
    -- Get first assistant message content (truncated to 120 chars)
    LEFT(
      REPLACE(
        (SELECT m.content 
         FROM al_messages m 
         WHERE m.conversation_id = c.id 
           AND m.role = 'assistant'
         ORDER BY m.sequence_number ASC
         LIMIT 1),
        E'\n', ' '
      ),
      120
    ) as preview
  FROM al_conversations c
  WHERE c.user_id = p_user_id
    AND c.deleted_at IS NULL  -- FIX: Filter out soft-deleted conversations
    AND (p_include_archived = TRUE OR c.is_archived = FALSE)
    AND (p_car_slug IS NULL OR c.initial_car_slug = p_car_slug)
  ORDER BY c.last_message_at DESC
  LIMIT p_limit 
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION get_user_conversations_with_preview TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_user_conversations_with_preview IS 
  'Fetches user conversations with first assistant message preview in single query. 
   Filters out soft-deleted conversations (deleted_at IS NULL).
   Fixed in Migration 20260127100000.';
