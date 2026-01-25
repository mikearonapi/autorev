-- ============================================================================
-- Event RSVPs Schema
-- ============================================================================
-- Adds RSVP functionality to events - users can mark themselves as "going" or
-- "interested" and see who else is attending events.
-- ============================================================================

-- ============================================================================
-- TABLE: event_rsvps — User attendance tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  
  -- RSVP status: going = confirmed, interested = maybe/considering
  status text NOT NULL CHECK (status IN ('going', 'interested')),
  
  -- Optional visibility preference (for future privacy controls)
  -- public = visible to all, attendees = visible to other attendees, private = only visible to user
  visibility text DEFAULT 'public' CHECK (visibility IN ('public', 'attendees', 'private')),
  
  -- Optional notes (e.g., "bringing my M3", "looking for carpool")
  notes text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- One RSVP per user per event
  UNIQUE(user_id, event_id)
);

COMMENT ON TABLE event_rsvps IS 'User RSVP tracking for events - going/interested status with optional visibility controls';
COMMENT ON COLUMN event_rsvps.status IS 'going = confirmed attendance, interested = considering/maybe';
COMMENT ON COLUMN event_rsvps.visibility IS 'public = visible to all, attendees = visible to other RSVPs, private = only visible to user';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Fast lookup by event (for showing attendees)
CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_id ON event_rsvps(event_id);

-- Fast lookup by user (for showing user's RSVPs)
CREATE INDEX IF NOT EXISTS idx_event_rsvps_user_id ON event_rsvps(user_id);

-- Fast filtering by status for counts
CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_status ON event_rsvps(event_id, status);

-- For finding public/visible RSVPs efficiently
CREATE INDEX IF NOT EXISTS idx_event_rsvps_visibility ON event_rsvps(event_id, visibility) 
  WHERE visibility IN ('public', 'attendees');

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at on changes
CREATE OR REPLACE FUNCTION update_event_rsvps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_event_rsvps_updated_at ON event_rsvps;
CREATE TRIGGER trigger_event_rsvps_updated_at
  BEFORE UPDATE ON event_rsvps
  FOR EACH ROW
  EXECUTE FUNCTION update_event_rsvps_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;

-- Users can read RSVPs that are:
-- 1. Their own (any visibility)
-- 2. Public visibility
-- 3. Attendees visibility (if they also have an RSVP for that event)
DROP POLICY IF EXISTS "event_rsvps_read" ON event_rsvps;
CREATE POLICY "event_rsvps_read" ON event_rsvps
  FOR SELECT USING (
    -- Own RSVPs
    auth.uid() = user_id
    OR
    -- Public RSVPs
    visibility = 'public'
    OR
    -- Attendees-only visibility (user must also have RSVP for this event)
    (visibility = 'attendees' AND EXISTS (
      SELECT 1 FROM event_rsvps er 
      WHERE er.event_id = event_rsvps.event_id 
        AND er.user_id = auth.uid()
    ))
  );

-- Users can insert their own RSVPs
DROP POLICY IF EXISTS "event_rsvps_insert" ON event_rsvps;
CREATE POLICY "event_rsvps_insert" ON event_rsvps
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own RSVPs
DROP POLICY IF EXISTS "event_rsvps_update" ON event_rsvps;
CREATE POLICY "event_rsvps_update" ON event_rsvps
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own RSVPs
DROP POLICY IF EXISTS "event_rsvps_delete" ON event_rsvps;
CREATE POLICY "event_rsvps_delete" ON event_rsvps
  FOR DELETE USING (auth.uid() = user_id);

-- Service role bypasses RLS for backend operations
DROP POLICY IF EXISTS "event_rsvps_service_all" ON event_rsvps;
CREATE POLICY "event_rsvps_service_all" ON event_rsvps
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get RSVP counts for an event
CREATE OR REPLACE FUNCTION get_event_rsvp_counts(p_event_id uuid)
RETURNS TABLE (
  going_count bigint,
  interested_count bigint,
  total_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE status = 'going') as going_count,
    COUNT(*) FILTER (WHERE status = 'interested') as interested_count,
    COUNT(*) as total_count
  FROM event_rsvps
  WHERE event_id = p_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get visible attendees for an event (respects visibility settings)
-- Returns user profile info for display
CREATE OR REPLACE FUNCTION get_event_attendees(
  p_event_id uuid,
  p_viewer_id uuid DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_limit int DEFAULT 20
)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  avatar_url text,
  status text,
  notes text,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    er.user_id,
    up.display_name,
    up.avatar_url,
    er.status,
    CASE 
      WHEN er.user_id = p_viewer_id THEN er.notes
      WHEN er.visibility = 'public' THEN er.notes
      ELSE NULL
    END as notes,
    er.created_at
  FROM event_rsvps er
  JOIN user_profiles up ON up.id = er.user_id
  WHERE er.event_id = p_event_id
    AND (p_status IS NULL OR er.status = p_status)
    AND (
      -- User's own RSVP
      er.user_id = p_viewer_id
      OR
      -- Public visibility
      er.visibility = 'public'
      OR
      -- Attendees visibility (viewer must also be attending)
      (er.visibility = 'attendees' AND EXISTS (
        SELECT 1 FROM event_rsvps 
        WHERE event_id = p_event_id AND user_id = p_viewer_id
      ))
    )
  ORDER BY 
    -- Show "going" first, then "interested"
    CASE er.status WHEN 'going' THEN 0 ELSE 1 END,
    er.created_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Done! Run with: npx supabase db push
-- ============================================================================
