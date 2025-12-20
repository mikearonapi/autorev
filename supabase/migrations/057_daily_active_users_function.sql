-- ============================================================================
-- DAILY ACTIVE USERS FUNCTION
-- Returns count of unique users active within a date range
-- ============================================================================

CREATE OR REPLACE FUNCTION get_daily_active_users(
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS TABLE (count BIGINT) AS $$
BEGIN
  RETURN QUERY
  WITH active_user_ids AS (
    -- Users who created AL conversations
    SELECT DISTINCT user_id
    FROM al_conversations
    WHERE created_at >= p_start_date
      AND created_at < p_end_date
      AND user_id IS NOT NULL
    
    UNION
    
    -- Users who sent AL messages
    SELECT DISTINCT c.user_id
    FROM al_messages m
    JOIN al_conversations c ON m.conversation_id = c.id
    WHERE m.created_at >= p_start_date
      AND m.created_at < p_end_date
      AND c.user_id IS NOT NULL
    
    UNION
    
    -- Users who submitted feedback
    SELECT DISTINCT user_id
    FROM user_feedback
    WHERE created_at >= p_start_date
      AND created_at < p_end_date
      AND user_id IS NOT NULL
    
    UNION
    
    -- Users who had activity logged
    SELECT DISTINCT user_id
    FROM user_activity
    WHERE created_at >= p_start_date
      AND created_at < p_end_date
      AND user_id IS NOT NULL
    
    UNION
    
    -- Users who favorited cars
    SELECT DISTINCT user_id
    FROM user_favorites
    WHERE created_at >= p_start_date
      AND created_at < p_end_date
      AND user_id IS NOT NULL
    
    UNION
    
    -- Users who created/updated projects
    SELECT DISTINCT user_id
    FROM user_projects
    WHERE created_at >= p_start_date
      AND created_at < p_end_date
      AND user_id IS NOT NULL
  )
  SELECT COUNT(*)::BIGINT
  FROM active_user_ids;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users and service role
GRANT EXECUTE ON FUNCTION get_daily_active_users(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated, service_role;

-- Add comment
COMMENT ON FUNCTION get_daily_active_users IS 'Returns count of unique users who performed any action within the specified date range';





