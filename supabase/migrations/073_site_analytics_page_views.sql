-- Site Analytics: Page Views Table
-- Tracks page views for internal analytics dashboard
-- Replicates Vercel Web Analytics functionality

-- Create page_views table
CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Page info
  path TEXT NOT NULL,
  route TEXT, -- Normalized route pattern (e.g., /cars/[slug])
  hostname TEXT DEFAULT 'autorev.app',
  
  -- Session tracking (for unique visitors)
  session_id TEXT NOT NULL,
  
  -- Referrer
  referrer TEXT,
  referrer_hostname TEXT,
  
  -- UTM parameters
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  
  -- Device info (parsed from user agent)
  device_type TEXT, -- 'mobile', 'desktop', 'tablet'
  browser TEXT,
  browser_version TEXT,
  os TEXT,
  os_version TEXT,
  
  -- Geo info (from Vercel headers)
  country TEXT,
  country_code TEXT,
  region TEXT,
  city TEXT,
  
  -- User info (optional, if logged in)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Performance (optional)
  page_load_time INTEGER, -- milliseconds
  
  -- Indexes for common queries
  CONSTRAINT page_views_path_not_empty CHECK (path != '')
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(path);
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_country ON page_views(country_code);
CREATE INDEX IF NOT EXISTS idx_page_views_device ON page_views(device_type);
CREATE INDEX IF NOT EXISTS idx_page_views_referrer ON page_views(referrer_hostname);

-- Composite index for time-range queries
CREATE INDEX IF NOT EXISTS idx_page_views_created_path ON page_views(created_at DESC, path);

-- RLS Policies
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (for tracking)
CREATE POLICY "Allow anonymous page view tracking" ON page_views
  FOR INSERT WITH CHECK (true);

-- Only admins can read (for analytics dashboard)
CREATE POLICY "Admins can read page views" ON page_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email IN (
        'mikearon@gmail.com',
        'mike@autorev.app'
      )
    )
  );

-- Function to get analytics summary
CREATE OR REPLACE FUNCTION get_site_analytics(
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '7 days',
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
    'pageViews', (
      SELECT COUNT(*)
      FROM page_views
      WHERE created_at BETWEEN p_start_date AND p_end_date
    ),
    'topPages', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT path, COUNT(*) as views, COUNT(DISTINCT session_id) as visitors
        FROM page_views
        WHERE created_at BETWEEN p_start_date AND p_end_date
        GROUP BY path
        ORDER BY views DESC
        LIMIT 10
      ) t
    ),
    'referrers', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT 
          COALESCE(referrer_hostname, 'Direct') as source,
          COUNT(DISTINCT session_id) as visitors
        FROM page_views
        WHERE created_at BETWEEN p_start_date AND p_end_date
        GROUP BY referrer_hostname
        ORDER BY visitors DESC
        LIMIT 10
      ) t
    ),
    'countries', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT 
          COALESCE(country, 'Unknown') as country,
          country_code,
          COUNT(DISTINCT session_id) as visitors
        FROM page_views
        WHERE created_at BETWEEN p_start_date AND p_end_date
        GROUP BY country, country_code
        ORDER BY visitors DESC
        LIMIT 10
      ) t
    ),
    'devices', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT 
          COALESCE(device_type, 'Unknown') as device,
          COUNT(DISTINCT session_id) as visitors
        FROM page_views
        WHERE created_at BETWEEN p_start_date AND p_end_date
        GROUP BY device_type
        ORDER BY visitors DESC
      ) t
    ),
    'browsers', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT 
          COALESCE(browser, 'Unknown') as browser,
          COUNT(DISTINCT session_id) as visitors
        FROM page_views
        WHERE created_at BETWEEN p_start_date AND p_end_date
        GROUP BY browser
        ORDER BY visitors DESC
        LIMIT 10
      ) t
    ),
    'operatingSystems', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT 
          COALESCE(os, 'Unknown') as os,
          COUNT(DISTINCT session_id) as visitors
        FROM page_views
        WHERE created_at BETWEEN p_start_date AND p_end_date
        GROUP BY os
        ORDER BY visitors DESC
        LIMIT 10
      ) t
    ),
    'dailyStats', (
      SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.date), '[]'::json)
      FROM (
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as views,
          COUNT(DISTINCT session_id) as visitors
        FROM page_views
        WHERE created_at BETWEEN p_start_date AND p_end_date
        GROUP BY DATE(created_at)
        ORDER BY date
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute to authenticated users (admin check is in the app layer)
GRANT EXECUTE ON FUNCTION get_site_analytics TO authenticated;

-- Function to calculate bounce rate
CREATE OR REPLACE FUNCTION get_bounce_rate(
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '7 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_sessions INTEGER;
  single_page_sessions INTEGER;
BEGIN
  SELECT COUNT(DISTINCT session_id) INTO total_sessions
  FROM page_views
  WHERE created_at BETWEEN p_start_date AND p_end_date;
  
  IF total_sessions = 0 THEN
    RETURN 0;
  END IF;
  
  SELECT COUNT(*) INTO single_page_sessions
  FROM (
    SELECT session_id
    FROM page_views
    WHERE created_at BETWEEN p_start_date AND p_end_date
    GROUP BY session_id
    HAVING COUNT(*) = 1
  ) t;
  
  RETURN ROUND((single_page_sessions::NUMERIC / total_sessions::NUMERIC) * 100, 1);
END;
$$;

GRANT EXECUTE ON FUNCTION get_bounce_rate TO authenticated;

-- Add comment
COMMENT ON TABLE page_views IS 'Stores page view events for site analytics dashboard. Tracks visitors, pages, devices, geo, and referrers.';

