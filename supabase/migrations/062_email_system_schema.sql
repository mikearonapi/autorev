-- Migration: Email System Schema
-- Purpose: Tables for email templates, logs, queue, and referral tracking
-- Date: 2024-12-27

-- =============================================================================
-- EMAIL TEMPLATES
-- Store email template content for admin management
-- =============================================================================
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Template identification
  slug text UNIQUE NOT NULL, -- e.g., 'welcome', 'inactivity-7d', 'referral-reward'
  name text NOT NULL, -- Human-readable name
  description text, -- What this email is for
  
  -- Template content
  subject text NOT NULL,
  preview_text text, -- Email preview/preheader text
  html_content text, -- Full HTML content (if not using React Email)
  
  -- Categorization
  category text NOT NULL DEFAULT 'transactional', -- transactional, feature, event, engagement, referral
  requires_opt_in text, -- NULL (always send), 'features', or 'events'
  
  -- Status
  is_active boolean DEFAULT true,
  
  -- Variables available in this template (for documentation)
  available_variables jsonb DEFAULT '[]'::jsonb, -- e.g., ["user_name", "car_name"]
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

-- Add comments
COMMENT ON TABLE email_templates IS 'Email template storage for admin-managed email content';
COMMENT ON COLUMN email_templates.slug IS 'Unique identifier used in code to reference this template';
COMMENT ON COLUMN email_templates.requires_opt_in IS 'NULL=always send, features=requires email_opt_in_features, events=requires email_opt_in_events';

-- =============================================================================
-- EMAIL LOGS
-- Track all sent emails for debugging, analytics, and compliance
-- =============================================================================
CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Recipient
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_email text NOT NULL,
  
  -- Email details
  template_slug text, -- NULL if sent via direct API
  subject text NOT NULL,
  
  -- Sending details
  resend_id text, -- Resend message ID for tracking
  status text NOT NULL DEFAULT 'queued', -- queued, sent, delivered, bounced, complained, failed
  
  -- Error tracking
  error_message text,
  error_code text,
  
  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb, -- Any additional context (car_slug, event_id, etc.)
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_template_slug ON email_logs(template_slug);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient_email);

COMMENT ON TABLE email_logs IS 'Log of all emails sent through the system';

-- =============================================================================
-- EMAIL QUEUE
-- Scheduled and batched emails
-- =============================================================================
CREATE TABLE IF NOT EXISTS email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Recipient
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_email text NOT NULL,
  
  -- Email details
  template_slug text NOT NULL REFERENCES email_templates(slug),
  template_variables jsonb DEFAULT '{}'::jsonb, -- Variables to inject into template
  
  -- Scheduling
  scheduled_for timestamptz NOT NULL,
  priority integer DEFAULT 0, -- Higher = more important
  
  -- Processing
  status text NOT NULL DEFAULT 'pending', -- pending, processing, sent, cancelled, failed
  attempts integer DEFAULT 0,
  max_attempts integer DEFAULT 3,
  last_attempt_at timestamptz,
  error_message text,
  
  -- Result
  email_log_id uuid REFERENCES email_logs(id),
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Indexes for queue processing
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled ON email_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_user ON email_queue(user_id);

COMMENT ON TABLE email_queue IS 'Queue for scheduled and batched email sending';

-- =============================================================================
-- REFERRALS
-- Track referral program
-- =============================================================================
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referrer (existing user who shared)
  referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Referee (new user who signed up)
  referee_id uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL until they sign up
  referee_email text, -- Email they shared with (before signup)
  
  -- Referral code/link
  referral_code text NOT NULL,
  
  -- Status
  status text NOT NULL DEFAULT 'pending', -- pending, signed_up, rewarded, expired
  
  -- Rewards
  referrer_reward_credits integer, -- AL credits awarded to referrer
  referee_reward_credits integer, -- AL credits awarded to referee
  rewarded_at timestamptz,
  
  -- Tracking
  created_at timestamptz DEFAULT now(),
  signed_up_at timestamptz,
  expires_at timestamptz DEFAULT (now() + interval '30 days')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee ON referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

-- Unique constraint: one referral per referee email per referrer
CREATE UNIQUE INDEX IF NOT EXISTS idx_referrals_unique ON referrals(referrer_id, referee_email) WHERE referee_email IS NOT NULL;

COMMENT ON TABLE referrals IS 'Referral program tracking - who referred whom';

-- =============================================================================
-- USER EMAIL TRACKING
-- Track user-specific email events for smart sending
-- =============================================================================
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_email_sent_at timestamptz;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email_bounce_count integer DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email_unsubscribed_at timestamptz;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;

COMMENT ON COLUMN user_profiles.last_email_sent_at IS 'Timestamp of last non-transactional email sent';
COMMENT ON COLUMN user_profiles.email_bounce_count IS 'Number of bounced emails (stop sending after threshold)';
COMMENT ON COLUMN user_profiles.email_unsubscribed_at IS 'If set, user has globally unsubscribed';
COMMENT ON COLUMN user_profiles.referral_code IS 'Unique referral code for this user';

-- =============================================================================
-- SEED DEFAULT EMAIL TEMPLATES
-- =============================================================================
INSERT INTO email_templates (slug, name, description, subject, preview_text, category, requires_opt_in, available_variables) VALUES
  ('welcome', 'Welcome Email', 'Sent immediately after signup', 'Welcome to AutoRev! 🚗', 'Your sports car journey starts here', 'transactional', NULL, '["user_name", "login_url"]'),
  ('inactivity-7d', '7-Day Inactivity', 'Sent after 7 days of no activity', 'We miss you at AutoRev', 'Your garage is waiting for you', 'engagement', 'features', '["user_name", "car_count", "login_url"]'),
  ('inactivity-30d', '30-Day Inactivity', 'Sent after 30 days of no activity', 'Your AutoRev garage misses you 🚗', 'Come back and explore what''s new', 'engagement', 'features', '["user_name", "new_features", "login_url"]'),
  ('referral-sent', 'Referral Sent', 'Confirmation when user shares referral', 'Referral sent! 🎉', 'Your friend will receive an invite', 'referral', NULL, '["user_name", "friend_email", "referral_link"]'),
  ('referral-reward', 'Referral Reward', 'When referred friend signs up', 'You earned AL credits! 🎁', 'Your friend joined AutoRev', 'referral', NULL, '["user_name", "friend_name", "credits_earned", "total_credits"]'),
  ('new-feature', 'New Feature Announcement', 'Announce major new features', 'New in AutoRev: {{feature_name}}', 'Check out what''s new', 'feature', 'features', '["user_name", "feature_name", "feature_description", "cta_url"]'),
  ('event-nearby', 'Event Near You', 'Notify about events in user area', '🏎️ Car event this weekend near you!', 'Don''t miss out on local car events', 'event', 'events', '["user_name", "event_name", "event_date", "event_location", "event_url"]'),
  ('weekly-digest', 'Weekly Digest', 'Weekly summary of activity and recommendations', 'Your AutoRev Weekly Update', 'Here''s what''s happening in the car world', 'feature', 'features', '["user_name", "highlights", "new_cars", "upcoming_events"]')
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- RLS POLICIES
-- =============================================================================
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Email templates: public read, admin write
CREATE POLICY "email_templates_public_read" ON email_templates FOR SELECT USING (true);

-- Email logs: users can see their own, admins see all
CREATE POLICY "email_logs_user_read" ON email_logs FOR SELECT 
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND subscription_tier = 'admin'
  ));

-- Email queue: users can see their own pending, admins see all
CREATE POLICY "email_queue_user_read" ON email_queue FOR SELECT 
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND subscription_tier = 'admin'
  ));

-- Referrals: users can see their own referrals
CREATE POLICY "referrals_user_read" ON referrals FOR SELECT 
  USING (referrer_id = auth.uid() OR referee_id = auth.uid());

CREATE POLICY "referrals_user_insert" ON referrals FOR INSERT 
  WITH CHECK (referrer_id = auth.uid());

-- =============================================================================
-- HELPER FUNCTION: Generate unique referral code
-- =============================================================================
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- No confusing chars (0/O, 1/I/L)
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- =============================================================================
-- TRIGGER: Auto-generate referral code for new users
-- =============================================================================
CREATE OR REPLACE FUNCTION set_user_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  -- Only set if not already set
  IF NEW.referral_code IS NULL THEN
    LOOP
      new_code := generate_referral_code();
      SELECT EXISTS(SELECT 1 FROM user_profiles WHERE referral_code = new_code) INTO code_exists;
      EXIT WHEN NOT code_exists;
    END LOOP;
    NEW.referral_code := new_code;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_referral_code_trigger ON user_profiles;
CREATE TRIGGER set_referral_code_trigger
  BEFORE INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_user_referral_code();

-- Update existing users with referral codes
UPDATE user_profiles 
SET referral_code = generate_referral_code() 
WHERE referral_code IS NULL;

-- =============================================================================
-- FUNCTION: Get email analytics for admin dashboard
-- =============================================================================
CREATE OR REPLACE FUNCTION get_email_analytics(days_back integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_sent', COUNT(*) FILTER (WHERE status IN ('sent', 'delivered')),
    'total_delivered', COUNT(*) FILTER (WHERE status = 'delivered'),
    'total_bounced', COUNT(*) FILTER (WHERE status = 'bounced'),
    'total_failed', COUNT(*) FILTER (WHERE status = 'failed'),
    'by_template', (
      SELECT jsonb_object_agg(template_slug, cnt)
      FROM (
        SELECT template_slug, COUNT(*) as cnt
        FROM email_logs
        WHERE created_at > now() - (days_back || ' days')::interval
        AND template_slug IS NOT NULL
        GROUP BY template_slug
      ) t
    ),
    'by_day', (
      SELECT jsonb_agg(jsonb_build_object('date', d, 'count', cnt))
      FROM (
        SELECT DATE(created_at) as d, COUNT(*) as cnt
        FROM email_logs
        WHERE created_at > now() - (days_back || ' days')::interval
        GROUP BY DATE(created_at)
        ORDER BY d DESC
      ) t
    )
  ) INTO result
  FROM email_logs
  WHERE created_at > now() - (days_back || ' days')::interval;
  
  RETURN result;
END;
$$;

