-- Migration: Events Geocoding Cache and Source Configuration
-- Part of Phase 3: Automated event discovery infrastructure

-- ============================================================================
-- GEOCODE CACHE TABLE
-- ============================================================================

-- Cache for geocoded addresses to avoid repeated API calls
-- Uses address hash as primary key for efficient lookups
CREATE TABLE IF NOT EXISTS geocode_cache (
  address_hash text PRIMARY KEY,
  latitude decimal(10,7),
  longitude decimal(10,7),
  address_string text, -- Original address for debugging
  created_at timestamptz DEFAULT now()
);

-- Index for potential cleanup by date
CREATE INDEX IF NOT EXISTS idx_geocode_cache_created_at 
  ON geocode_cache(created_at);

-- RLS: Admin only (used by cron jobs)
ALTER TABLE geocode_cache ENABLE ROW LEVEL SECURITY;

-- Service role can access
CREATE POLICY "Service role can manage geocode cache" ON geocode_cache
  FOR ALL
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE geocode_cache IS 'Cache for geocoded addresses to reduce API calls';

-- ============================================================================
-- EVENT SOURCES SEED DATA
-- ============================================================================

-- MotorsportReg - Primary source for track events
INSERT INTO event_sources (
  name,
  source_type,
  base_url,
  scrape_config,
  regions_covered,
  event_types,
  is_active
) VALUES (
  'MotorsportReg',
  'scrape',
  'https://www.motorsportreg.com',
  '{
    "searchUrl": "/calendar",
    "jsonApiUrl": "/calendar/events.json",
    "eventTypes": ["track-day", "autocross", "time-attack"],
    "selectors": {
      "eventList": ".event-list",
      "eventCard": ".event-card",
      "eventName": ".event-name",
      "eventDate": ".event-date",
      "eventLocation": ".event-location"
    }
  }'::jsonb,
  ARRAY['Northeast', 'Southeast', 'Midwest', 'Southwest', 'West'],
  ARRAY['track-day', 'autocross', 'time-attack'],
  true
) ON CONFLICT (name) DO UPDATE SET
  source_type = EXCLUDED.source_type,
  base_url = EXCLUDED.base_url,
  scrape_config = EXCLUDED.scrape_config,
  regions_covered = EXCLUDED.regions_covered,
  event_types = EXCLUDED.event_types,
  is_active = EXCLUDED.is_active;

-- SCCA - Future source (inactive for now)
INSERT INTO event_sources (
  name,
  source_type,
  base_url,
  scrape_config,
  regions_covered,
  event_types,
  is_active
) VALUES (
  'SCCA',
  'scrape',
  'https://www.scca.com',
  '{
    "searchUrl": "/events",
    "note": "Implementation pending - complex calendar structure"
  }'::jsonb,
  ARRAY['Northeast', 'Southeast', 'Midwest', 'Southwest', 'West'],
  ARRAY['autocross', 'time-attack', 'club-meetup'],
  false -- Inactive until implemented
) ON CONFLICT (name) DO UPDATE SET
  source_type = EXCLUDED.source_type,
  base_url = EXCLUDED.base_url,
  scrape_config = EXCLUDED.scrape_config,
  regions_covered = EXCLUDED.regions_covered,
  event_types = EXCLUDED.event_types,
  is_active = EXCLUDED.is_active;

-- PCA (Porsche Club of America) - Future source (inactive)
INSERT INTO event_sources (
  name,
  source_type,
  base_url,
  scrape_config,
  regions_covered,
  event_types,
  is_active
) VALUES (
  'PCA',
  'scrape',
  'https://www.pca.org',
  '{
    "searchUrl": "/events",
    "note": "Implementation pending - requires region-specific scraping"
  }'::jsonb,
  ARRAY['Northeast', 'Southeast', 'Midwest', 'Southwest', 'West'],
  ARRAY['track-day', 'club-meetup', 'car-show', 'cruise'],
  false -- Inactive until implemented
) ON CONFLICT (name) DO UPDATE SET
  source_type = EXCLUDED.source_type,
  base_url = EXCLUDED.base_url,
  scrape_config = EXCLUDED.scrape_config,
  regions_covered = EXCLUDED.regions_covered,
  event_types = EXCLUDED.event_types,
  is_active = EXCLUDED.is_active;

-- ============================================================================
-- UPDATE EXISTING EVENTS TABLE (add constraint for name uniqueness)
-- ============================================================================

-- Add unique constraint on (name, start_date, city, state) to prevent duplicates
-- This helps with deduplication during automated ingestion
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'events_name_date_location_unique'
  ) THEN
    -- First, check for and handle any existing duplicates
    WITH duplicates AS (
      SELECT name, start_date, city, state, MIN(id) as keep_id
      FROM events
      WHERE name IS NOT NULL AND start_date IS NOT NULL AND city IS NOT NULL
      GROUP BY name, start_date, city, state
      HAVING COUNT(*) > 1
    )
    UPDATE events e
    SET name = e.name || ' (' || e.id::text || ')'
    FROM duplicates d
    WHERE e.name = d.name 
      AND e.start_date = d.start_date 
      AND e.city = d.city 
      AND COALESCE(e.state, '') = COALESCE(d.state, '')
      AND e.id != d.keep_id;
    
    -- Now add the constraint
    ALTER TABLE events 
      ADD CONSTRAINT events_name_date_location_unique 
      UNIQUE NULLS NOT DISTINCT (name, start_date, city, state);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- If constraint creation fails (e.g., due to duplicates), log and continue
  RAISE NOTICE 'Could not create unique constraint: %', SQLERRM;
END $$;

-- ============================================================================
-- ADD INDEX FOR RADIUS SEARCH
-- ============================================================================

-- Composite index on lat/lng for efficient radius queries
CREATE INDEX IF NOT EXISTS idx_events_lat_lng 
  ON events(latitude, longitude) 
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- ============================================================================
-- SUMMARY
-- ============================================================================

COMMENT ON TABLE event_sources IS 'Configuration for automated event discovery sources';

