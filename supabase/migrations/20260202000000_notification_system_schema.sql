-- Notification System Schema Migration
-- Creates tables for in-app notifications, user preferences, category preferences, and quiet hours

-- ============================================
-- ENUMS
-- ============================================

-- Notification categories enum
DO $$ BEGIN
  CREATE TYPE notification_category AS ENUM (
    'system',        -- Account, security, payment alerts
    'engagement',    -- Milestones, streaks, achievements
    'social',        -- Comments, likes on builds
    'vehicle',       -- Recalls, known issues, maintenance
    'events',        -- Event reminders, new events nearby
    'al'             -- AL conversation updates
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category notification_category NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  action_url TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
  ON notifications(user_id, is_read) 
  WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
  ON notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_category 
  ON notifications(category);

-- ============================================
-- NOTIFICATION PREFERENCES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notifications_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  in_app_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================
-- NOTIFICATION CATEGORY PREFERENCES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS notification_category_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category notification_category NOT NULL,
  email_enabled BOOLEAN DEFAULT true,
  in_app_enabled BOOLEAN DEFAULT true,
  frequency TEXT DEFAULT 'immediate' CHECK (frequency IN ('immediate', 'daily_digest', 'weekly_digest')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category)
);

-- Index for category preferences lookup
CREATE INDEX IF NOT EXISTS idx_notification_category_prefs_user 
  ON notification_category_preferences(user_id);

-- ============================================
-- QUIET HOURS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS quiet_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT false,
  start_time TIME NOT NULL DEFAULT '22:00:00',
  end_time TIME NOT NULL DEFAULT '07:00:00',
  timezone TEXT DEFAULT 'UTC',
  allow_urgent BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================
-- NOTIFICATION INTERACTIONS TABLE (for analytics)
-- ============================================

CREATE TABLE IF NOT EXISTS notification_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('viewed', 'clicked', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_interactions_notification 
  ON notification_interactions(notification_id);

CREATE INDEX IF NOT EXISTS idx_notification_interactions_user_date 
  ON notification_interactions(user_id, created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_category_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiet_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_interactions ENABLE ROW LEVEL SECURITY;

-- Notifications policies
DROP POLICY IF EXISTS "Users view own notifications" ON notifications;
CREATE POLICY "Users view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own notifications" ON notifications;
CREATE POLICY "Users update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can insert notifications" ON notifications;
CREATE POLICY "Service role can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users delete own notifications" ON notifications;
CREATE POLICY "Users delete own notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Notification preferences policies
DROP POLICY IF EXISTS "Users view own notification preferences" ON notification_preferences;
CREATE POLICY "Users view own notification preferences" ON notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own notification preferences" ON notification_preferences;
CREATE POLICY "Users manage own notification preferences" ON notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Category preferences policies
DROP POLICY IF EXISTS "Users view own category preferences" ON notification_category_preferences;
CREATE POLICY "Users view own category preferences" ON notification_category_preferences
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own category preferences" ON notification_category_preferences;
CREATE POLICY "Users manage own category preferences" ON notification_category_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Quiet hours policies
DROP POLICY IF EXISTS "Users view own quiet hours" ON quiet_hours;
CREATE POLICY "Users view own quiet hours" ON quiet_hours
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own quiet hours" ON quiet_hours;
CREATE POLICY "Users manage own quiet hours" ON quiet_hours
  FOR ALL USING (auth.uid() = user_id);

-- Notification interactions policies
DROP POLICY IF EXISTS "Users view own interactions" ON notification_interactions;
CREATE POLICY "Users view own interactions" ON notification_interactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users create own interactions" ON notification_interactions;
CREATE POLICY "Users create own interactions" ON notification_interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if user is in quiet hours
CREATE OR REPLACE FUNCTION is_in_quiet_hours(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  qh RECORD;
  user_local_time TIME;
BEGIN
  -- Get user's quiet hours config
  SELECT * INTO qh FROM quiet_hours WHERE user_id = p_user_id AND enabled = true;
  
  -- If no config or not enabled, not in quiet hours
  IF qh IS NULL THEN 
    RETURN FALSE; 
  END IF;
  
  -- Get current time in user's timezone
  user_local_time := (NOW() AT TIME ZONE COALESCE(qh.timezone, 'UTC'))::TIME;
  
  -- Handle overnight quiet hours (e.g., 22:00 to 07:00)
  IF qh.start_time > qh.end_time THEN
    RETURN user_local_time >= qh.start_time OR user_local_time < qh.end_time;
  ELSE
    RETURN user_local_time >= qh.start_time AND user_local_time < qh.end_time;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER 
    FROM notifications 
    WHERE user_id = p_user_id AND is_read = false
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE notifications 
  SET is_read = true, read_at = NOW()
  WHERE user_id = p_user_id AND is_read = false;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a notification (respects preferences)
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_category notification_category,
  p_title TEXT,
  p_body TEXT,
  p_action_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB,
  p_is_urgent BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
  prefs RECORD;
  cat_prefs RECORD;
  new_id UUID;
  should_create BOOLEAN := true;
BEGIN
  -- Check global preferences
  SELECT * INTO prefs FROM notification_preferences WHERE user_id = p_user_id;
  
  -- If user has disabled all notifications, don't create (unless urgent)
  IF prefs IS NOT NULL AND NOT prefs.notifications_enabled AND NOT p_is_urgent THEN
    RETURN NULL;
  END IF;
  
  -- If user has disabled in-app notifications, don't create
  IF prefs IS NOT NULL AND NOT prefs.in_app_enabled AND NOT p_is_urgent THEN
    RETURN NULL;
  END IF;
  
  -- Check category-specific preferences
  SELECT * INTO cat_prefs 
  FROM notification_category_preferences 
  WHERE user_id = p_user_id AND category = p_category;
  
  -- If user has disabled this category's in-app notifications, don't create
  IF cat_prefs IS NOT NULL AND NOT cat_prefs.in_app_enabled AND NOT p_is_urgent THEN
    RETURN NULL;
  END IF;
  
  -- Check quiet hours (unless urgent)
  IF NOT p_is_urgent AND is_in_quiet_hours(p_user_id) THEN
    -- Could queue for later, but for now just don't create
    RETURN NULL;
  END IF;
  
  -- Create the notification
  INSERT INTO notifications (user_id, category, title, body, action_url, metadata)
  VALUES (p_user_id, p_category, p_title, p_body, p_action_url, p_metadata)
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to initialize default preferences for a user
CREATE OR REPLACE FUNCTION initialize_notification_preferences(p_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Insert global preferences if not exists
  INSERT INTO notification_preferences (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Insert default category preferences for each category
  INSERT INTO notification_category_preferences (user_id, category)
  SELECT p_user_id, unnest(enum_range(NULL::notification_category))
  ON CONFLICT (user_id, category) DO NOTHING;
  
  -- Insert default quiet hours config
  INSERT INTO quiet_hours (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================

-- Updated_at trigger function (reuse if exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS notification_category_preferences_updated_at ON notification_category_preferences;
CREATE TRIGGER notification_category_preferences_updated_at
  BEFORE UPDATE ON notification_category_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS quiet_hours_updated_at ON quiet_hours;
CREATE TRIGGER quiet_hours_updated_at
  BEFORE UPDATE ON quiet_hours
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON notification_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON notification_category_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON quiet_hours TO authenticated;
GRANT SELECT, INSERT ON notification_interactions TO authenticated;

GRANT EXECUTE ON FUNCTION is_in_quiet_hours(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notification_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification(UUID, notification_category, TEXT, TEXT, TEXT, JSONB, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_notification_preferences(UUID) TO authenticated;

-- Also grant to service_role for backend operations
GRANT ALL ON notifications TO service_role;
GRANT ALL ON notification_preferences TO service_role;
GRANT ALL ON notification_category_preferences TO service_role;
GRANT ALL ON quiet_hours TO service_role;
GRANT ALL ON notification_interactions TO service_role;
