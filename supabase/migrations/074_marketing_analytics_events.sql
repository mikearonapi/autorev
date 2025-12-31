-- Marketing Analytics: User Events & Attribution Tables
-- Comprehensive tracking for marketing analytics and funnel optimization

-- ============================================================================
-- USER EVENTS TABLE
-- Tracks custom events for feature adoption, conversions, and user behavior
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Event identification
  event_name TEXT NOT NULL,
  event_category TEXT, -- 'onboarding', 'engagement', 'conversion', 'feature', 'navigation'
  
  -- User context (nullable for anonymous events)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  
  -- Event data
  properties JSONB DEFAULT '{}', -- Flexible event properties
  
  -- Page context
  page_path TEXT,
  page_title TEXT,
  
  -- Attribution context (captured at event time)
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  
  -- Device context
  device_type TEXT,
  browser TEXT,
  os TEXT,
  
  -- Geo context
  country TEXT,
  country_code TEXT,
  
  -- Constraints
  CONSTRAINT user_events_name_not_empty CHECK (event_name != '')
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_events_created_at ON user_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_events_user_id ON user_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_session_id ON user_events(session_id);
CREATE INDEX IF NOT EXISTS idx_user_events_name ON user_events(event_name);
CREATE INDEX IF NOT EXISTS idx_user_events_category ON user_events(event_category);
CREATE INDEX IF NOT EXISTS idx_user_events_name_created ON user_events(event_name, created_at DESC);

-- Composite index for funnel queries
CREATE INDEX IF NOT EXISTS idx_user_events_user_name_created ON user_events(user_id, event_name, created_at);

-- RLS
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert events
CREATE POLICY "Allow anonymous event tracking" ON user_events
  FOR INSERT WITH CHECK (true);

-- Only admins can read
CREATE POLICY "Admins can read events" ON user_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email IN ('mikearon@gmail.com', 'mike@autorev.app')
    )
  );


-- ============================================================================
-- USER ATTRIBUTION TABLE
-- Tracks first-touch and last-touch attribution for each user
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_attribution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- First touch (how they originally found us)
  first_touch_source TEXT,
  first_touch_medium TEXT,
  first_touch_campaign TEXT,
  first_touch_referrer TEXT,
  first_touch_landing_page TEXT,
  first_touch_at TIMESTAMPTZ,
  
  -- Last touch (what converted them to signup)
  last_touch_source TEXT,
  last_touch_medium TEXT,
  last_touch_campaign TEXT,
  last_touch_referrer TEXT,
  last_touch_landing_page TEXT,
  last_touch_at TIMESTAMPTZ,
  
  -- Signup context
  signup_page TEXT,
  signup_device TEXT,
  signup_country TEXT,
  
  -- Unique constraint
  CONSTRAINT user_attribution_user_unique UNIQUE (user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_attribution_user_id ON user_attribution(user_id);
CREATE INDEX IF NOT EXISTS idx_user_attribution_first_source ON user_attribution(first_touch_source);
CREATE INDEX IF NOT EXISTS idx_user_attribution_created ON user_attribution(created_at DESC);

-- RLS
ALTER TABLE user_attribution ENABLE ROW LEVEL SECURITY;

-- Users can see their own attribution
CREATE POLICY "Users can view own attribution" ON user_attribution
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can insert/update (handled by API)
CREATE POLICY "Service can manage attribution" ON user_attribution
  FOR ALL USING (true) WITH CHECK (true);


-- ============================================================================
-- USER SESSIONS TABLE
-- Tracks session-level analytics for engagement metrics
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  
  -- Timing
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- User (nullable for anonymous)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Session metrics
  page_views INTEGER DEFAULT 1,
  events_count INTEGER DEFAULT 0,
  
  -- Entry/exit
  entry_page TEXT,
  exit_page TEXT,
  
  -- Attribution
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referrer TEXT,
  
  -- Device
  device_type TEXT,
  browser TEXT,
  os TEXT,
  country TEXT,
  
  -- Is this a returning visitor?
  is_returning BOOLEAN DEFAULT FALSE,
  previous_session_id TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_started ON user_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_source ON user_sessions(utm_source);

-- RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow session tracking" ON user_sessions
  FOR ALL USING (true) WITH CHECK (true);


-- ============================================================================
-- PREDEFINED EVENTS (Reference)
-- ============================================================================

COMMENT ON TABLE user_events IS 'Tracks user events for analytics. Standard events include:
- Onboarding: signup_started, signup_completed, onboarding_step_N, onboarding_completed, onboarding_skipped
- Engagement: page_view, session_start, session_end, feature_used
- Features: car_selected, car_favorited, garage_added, al_conversation_started, al_question_asked
- Conversion: pricing_viewed, checkout_started, subscription_created, upgrade_completed
- Navigation: cta_clicked, menu_opened, search_performed';


-- ============================================================================
-- ANALYTICS FUNCTIONS
-- ============================================================================

-- Function to get funnel metrics
CREATE OR REPLACE FUNCTION get_funnel_metrics(
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'visitors', (
      SELECT COUNT(DISTINCT session_id)
      FROM page_views
      WHERE created_at BETWEEN p_start_date AND p_end_date
    ),
    'signupStarted', (
      SELECT COUNT(DISTINCT COALESCE(user_id::text, session_id))
      FROM user_events
      WHERE event_name = 'signup_started'
      AND created_at BETWEEN p_start_date AND p_end_date
    ),
    'signupCompleted', (
      SELECT COUNT(DISTINCT user_id)
      FROM user_events
      WHERE event_name = 'signup_completed'
      AND created_at BETWEEN p_start_date AND p_end_date
    ),
    'onboardingStarted', (
      SELECT COUNT(DISTINCT user_id)
      FROM user_events
      WHERE event_name = 'onboarding_started'
      AND created_at BETWEEN p_start_date AND p_end_date
    ),
    'onboardingCompleted', (
      SELECT COUNT(DISTINCT user_id)
      FROM user_events
      WHERE event_name = 'onboarding_completed'
      AND created_at BETWEEN p_start_date AND p_end_date
    ),
    'activated', (
      SELECT COUNT(DISTINCT user_id)
      FROM user_events
      WHERE event_name IN ('car_selected', 'al_conversation_started', 'garage_added')
      AND created_at BETWEEN p_start_date AND p_end_date
    ),
    'converted', (
      SELECT COUNT(DISTINCT user_id)
      FROM user_events
      WHERE event_name = 'subscription_created'
      AND created_at BETWEEN p_start_date AND p_end_date
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_funnel_metrics TO authenticated;


-- Function to get attribution breakdown
CREATE OR REPLACE FUNCTION get_attribution_breakdown(
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'bySource', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT 
          COALESCE(first_touch_source, 'Direct') as source,
          COUNT(*) as users,
          COUNT(*) FILTER (WHERE u.raw_user_meta_data->>'tier' != 'free') as converted
        FROM user_attribution ua
        JOIN auth.users u ON u.id = ua.user_id
        WHERE ua.created_at BETWEEN p_start_date AND p_end_date
        GROUP BY first_touch_source
        ORDER BY users DESC
        LIMIT 10
      ) t
    ),
    'byMedium', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT 
          COALESCE(first_touch_medium, 'None') as medium,
          COUNT(*) as users
        FROM user_attribution
        WHERE created_at BETWEEN p_start_date AND p_end_date
        GROUP BY first_touch_medium
        ORDER BY users DESC
        LIMIT 10
      ) t
    ),
    'byCampaign', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT 
          COALESCE(first_touch_campaign, 'None') as campaign,
          COUNT(*) as users
        FROM user_attribution
        WHERE created_at BETWEEN p_start_date AND p_end_date
        AND first_touch_campaign IS NOT NULL
        GROUP BY first_touch_campaign
        ORDER BY users DESC
        LIMIT 10
      ) t
    ),
    'byLandingPage', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT 
          COALESCE(first_touch_landing_page, '/') as landing_page,
          COUNT(*) as users
        FROM user_attribution
        WHERE created_at BETWEEN p_start_date AND p_end_date
        GROUP BY first_touch_landing_page
        ORDER BY users DESC
        LIMIT 10
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_attribution_breakdown TO authenticated;


-- Function to get cohort retention data
CREATE OR REPLACE FUNCTION get_cohort_retention(
  p_weeks INTEGER DEFAULT 8
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT COALESCE(json_agg(row_to_json(cohort_data)), '[]'::json) INTO result
  FROM (
    SELECT 
      DATE_TRUNC('week', u.created_at)::DATE as cohort_week,
      COUNT(DISTINCT u.id) as cohort_size,
      COUNT(DISTINCT CASE 
        WHEN EXISTS (
          SELECT 1 FROM user_events ue 
          WHERE ue.user_id = u.id 
          AND ue.created_at > u.created_at + INTERVAL '7 days'
        ) THEN u.id 
      END) as week_1_retained,
      COUNT(DISTINCT CASE 
        WHEN EXISTS (
          SELECT 1 FROM user_events ue 
          WHERE ue.user_id = u.id 
          AND ue.created_at > u.created_at + INTERVAL '14 days'
        ) THEN u.id 
      END) as week_2_retained,
      COUNT(DISTINCT CASE 
        WHEN EXISTS (
          SELECT 1 FROM user_events ue 
          WHERE ue.user_id = u.id 
          AND ue.created_at > u.created_at + INTERVAL '28 days'
        ) THEN u.id 
      END) as week_4_retained
    FROM auth.users u
    WHERE u.created_at > NOW() - (p_weeks || ' weeks')::INTERVAL
    GROUP BY DATE_TRUNC('week', u.created_at)
    ORDER BY cohort_week DESC
    LIMIT p_weeks
  ) cohort_data;
  
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_cohort_retention TO authenticated;


-- Function to get event counts by name
CREATE OR REPLACE FUNCTION get_event_counts(
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO result
  FROM (
    SELECT 
      event_name,
      event_category,
      COUNT(*) as total_events,
      COUNT(DISTINCT user_id) as unique_users,
      COUNT(DISTINCT session_id) as unique_sessions
    FROM user_events
    WHERE created_at BETWEEN p_start_date AND p_end_date
    GROUP BY event_name, event_category
    ORDER BY total_events DESC
    LIMIT 50
  ) t;
  
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_event_counts TO authenticated;


-- Function to get daily event trends
CREATE OR REPLACE FUNCTION get_event_trends(
  p_event_names TEXT[] DEFAULT ARRAY['signup_completed', 'onboarding_completed', 'car_selected'],
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.date), '[]'::json) INTO result
  FROM (
    SELECT 
      DATE(created_at) as date,
      event_name,
      COUNT(*) as count,
      COUNT(DISTINCT user_id) as unique_users
    FROM user_events
    WHERE event_name = ANY(p_event_names)
    AND created_at BETWEEN p_start_date AND p_end_date
    GROUP BY DATE(created_at), event_name
    ORDER BY date, event_name
  ) t;
  
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_event_trends TO authenticated;

