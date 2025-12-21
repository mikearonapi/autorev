-- Speed Insights / Core Web Vitals Storage
-- Receives data from Vercel Speed Insights Drain
-- Stores real user performance metrics for command center display

-- Core Web Vitals table
CREATE TABLE IF NOT EXISTS public.web_vitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Metric identification
  metric_name TEXT NOT NULL, -- LCP, FID, CLS, TTFB, FCP, INP
  metric_value NUMERIC NOT NULL,
  metric_rating TEXT, -- good, needs-improvement, poor
  
  -- Page context
  page_url TEXT,
  page_path TEXT,
  
  -- User context
  connection_type TEXT, -- 4g, 3g, wifi, etc.
  device_category TEXT, -- mobile, desktop, tablet
  country TEXT,
  
  -- Vercel context
  deployment_id TEXT,
  project_id TEXT,
  
  -- Timestamps
  event_time TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_web_vitals_metric_name ON public.web_vitals(metric_name);
CREATE INDEX idx_web_vitals_event_time ON public.web_vitals(event_time DESC);
CREATE INDEX idx_web_vitals_page_path ON public.web_vitals(page_path);
CREATE INDEX idx_web_vitals_metric_time ON public.web_vitals(metric_name, event_time DESC);

-- Aggregated daily stats view for faster dashboard queries
CREATE OR REPLACE VIEW public.web_vitals_daily AS
SELECT 
  DATE(event_time) as date,
  metric_name,
  COUNT(*) as sample_count,
  ROUND(AVG(metric_value)::numeric, 2) as avg_value,
  ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY metric_value)::numeric, 2) as p75_value,
  ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY metric_value)::numeric, 2) as p95_value,
  ROUND(MIN(metric_value)::numeric, 2) as min_value,
  ROUND(MAX(metric_value)::numeric, 2) as max_value,
  COUNT(*) FILTER (WHERE metric_rating = 'good') as good_count,
  COUNT(*) FILTER (WHERE metric_rating = 'needs-improvement') as needs_improvement_count,
  COUNT(*) FILTER (WHERE metric_rating = 'poor') as poor_count
FROM public.web_vitals
WHERE event_time > NOW() - INTERVAL '30 days'
GROUP BY DATE(event_time), metric_name
ORDER BY date DESC, metric_name;

-- Current performance summary view
CREATE OR REPLACE VIEW public.web_vitals_summary AS
SELECT 
  metric_name,
  COUNT(*) as sample_count,
  ROUND(AVG(metric_value)::numeric, 2) as avg_value,
  ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY metric_value)::numeric, 2) as p75_value,
  ROUND(
    (COUNT(*) FILTER (WHERE metric_rating = 'good')::numeric / NULLIF(COUNT(*), 0) * 100)::numeric, 
    1
  ) as good_pct,
  CASE 
    WHEN COUNT(*) FILTER (WHERE metric_rating = 'good')::numeric / NULLIF(COUNT(*), 0) >= 0.75 THEN 'good'
    WHEN COUNT(*) FILTER (WHERE metric_rating = 'poor')::numeric / NULLIF(COUNT(*), 0) >= 0.25 THEN 'poor'
    ELSE 'needs-improvement'
  END as overall_rating
FROM public.web_vitals
WHERE event_time > NOW() - INTERVAL '7 days'
GROUP BY metric_name;

-- RLS policies
ALTER TABLE public.web_vitals ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for webhook ingestion)
CREATE POLICY "Service role can manage web_vitals"
  ON public.web_vitals FOR ALL
  USING (true)
  WITH CHECK (true);

-- Cleanup function for old data (keep 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_web_vitals()
RETURNS void AS $$
BEGIN
  DELETE FROM public.web_vitals 
  WHERE event_time < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.web_vitals IS 'Stores Core Web Vitals from Vercel Speed Insights Drain';

