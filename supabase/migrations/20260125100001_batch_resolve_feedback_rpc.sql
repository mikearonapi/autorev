-- ============================================================================
-- Migration: 20260125100001_batch_resolve_feedback_rpc.sql
-- Description: Add RPC for batch resolving feedback items with notes concatenation
--              Fixes N sequential updates in feedback resolve-batch route
-- ============================================================================

-- Drop if exists for idempotency
DROP FUNCTION IF EXISTS batch_resolve_feedback(UUID[], UUID, TEXT, TEXT);

-- Create the RPC function
CREATE OR REPLACE FUNCTION batch_resolve_feedback(
  p_feedback_ids UUID[],
  p_resolved_by UUID,
  p_car_slug TEXT DEFAULT NULL,
  p_resolution_note TEXT DEFAULT NULL
)
RETURNS INT AS $$
DECLARE
  updated_count INT;
BEGIN
  UPDATE user_feedback
  SET 
    status = 'resolved',
    resolved_at = NOW(),
    resolved_by = p_resolved_by,
    car_slug = COALESCE(p_car_slug, car_slug),
    internal_notes = CASE 
      WHEN p_resolution_note IS NOT NULL 
      THEN COALESCE(internal_notes, '') || p_resolution_note
      ELSE internal_notes
    END,
    updated_at = NOW()
  WHERE id = ANY(p_feedback_ids);
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only service role should call this (admin operation)
GRANT EXECUTE ON FUNCTION batch_resolve_feedback TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION batch_resolve_feedback IS 
  'Batch resolves feedback items with internal notes concatenation.
   Replaces N sequential UPDATE queries with single batch operation.
   Database Audit C - January 2026';
