-- ============================================================================
-- Events Feature - Phase 1 Database Schema
-- ============================================================================
-- Creates the foundation for AutoRev's car event aggregator feature.
-- Supports: Cars & Coffee, track days, shows, auctions, club meetups
-- ============================================================================

-- ============================================================================
-- TABLE 1: event_types — Taxonomy of event categories
-- ============================================================================
CREATE TABLE IF NOT EXISTS event_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  icon text, -- emoji
  sort_order int DEFAULT 0,
  is_track_event boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE event_types IS 'Taxonomy of event categories (Cars & Coffee, Track Day, etc.)';

-- ============================================================================
-- TABLE 2: events — Core event data
-- ============================================================================
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  event_type_id uuid REFERENCES event_types(id),
  
  -- Date/time
  start_date date NOT NULL,
  end_date date, -- NULL = single day event
  start_time time, -- NULL = all day event
  end_time time,
  timezone text DEFAULT 'America/New_York',
  
  -- Location
  venue_name text,
  address text,
  city text NOT NULL,
  state text, -- NULL for international
  zip text,
  country text DEFAULT 'USA',
  latitude decimal(10,7),
  longitude decimal(10,7),
  region text, -- Northeast, Southeast, Midwest, Southwest, West
  scope text NOT NULL CHECK (scope IN ('local', 'regional', 'national')),
  
  -- Source & links
  source_url text NOT NULL,
  source_name text,
  registration_url text,
  image_url text,
  
  -- Cost
  cost_text text, -- "Free", "$25-$50", "Varies by class"
  is_free boolean DEFAULT false,
  
  -- Status & moderation
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  featured boolean DEFAULT false,
  
  -- User/admin tracking
  submitted_by uuid REFERENCES user_profiles(id),
  approved_by uuid REFERENCES user_profiles(id),
  approved_at timestamptz,
  last_verified_at timestamptz,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE events IS 'Core car events data (Shows, Cars & Coffee, track days, etc.)';
COMMENT ON COLUMN events.region IS 'Geographic region: Northeast, Southeast, Midwest, Southwest, West';
COMMENT ON COLUMN events.scope IS 'Event scope: local (city), regional (multi-state), national';

-- ============================================================================
-- TABLE 3: event_car_affinities — Link events to cars/brands
-- ============================================================================
CREATE TABLE IF NOT EXISTS event_car_affinities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  car_id uuid REFERENCES cars(id), -- nullable if brand-only
  brand text, -- nullable if car-specific
  affinity_type text DEFAULT 'featured' CHECK (affinity_type IN ('featured', 'welcome', 'exclusive')),
  created_at timestamptz DEFAULT now(),
  
  -- Must have at least one of car_id or brand
  CONSTRAINT car_or_brand CHECK (car_id IS NOT NULL OR brand IS NOT NULL)
);

COMMENT ON TABLE event_car_affinities IS 'Links events to specific cars or brands (e.g., Porsche-only events)';
COMMENT ON COLUMN event_car_affinities.affinity_type IS 'featured: this car/brand is highlighted; welcome: all cars welcome but this is featured; exclusive: only this car/brand allowed';

-- ============================================================================
-- TABLE 4: event_saves — User bookmarked events
-- ============================================================================
CREATE TABLE IF NOT EXISTS event_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  notes text,
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, event_id)
);

COMMENT ON TABLE event_saves IS 'User-saved/bookmarked events';

-- ============================================================================
-- TABLE 5: event_submissions — User-submitted events (moderation queue)
-- ============================================================================
CREATE TABLE IF NOT EXISTS event_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id),
  
  -- Submitted event data
  name text NOT NULL,
  event_type_slug text,
  description text,
  source_url text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  venue_name text,
  city text,
  state text,
  
  -- Moderation status
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'duplicate')),
  reviewed_by uuid REFERENCES user_profiles(id),
  reviewed_at timestamptz,
  rejection_reason text,
  
  -- Link to created event (if approved)
  created_event_id uuid REFERENCES events(id),
  
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE event_submissions IS 'User-submitted events pending moderation';

-- ============================================================================
-- TABLE 6: event_sources — For automated event ingestion (Phase 3)
-- ============================================================================
CREATE TABLE IF NOT EXISTS event_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('api', 'scrape', 'rss', 'manual')),
  base_url text,
  api_config jsonb,
  scrape_config jsonb,
  regions_covered text[], -- Array of regions this source covers
  event_types text[], -- Array of event_type slugs this source provides
  
  -- Status
  is_active boolean DEFAULT true,
  last_run_at timestamptz,
  last_run_status text,
  last_run_events int,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE event_sources IS 'Configuration for automated event data sources (Phase 3)';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- events indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_events_status_start_date ON events(status, start_date);
CREATE INDEX IF NOT EXISTS idx_events_city_state ON events(city, state);
CREATE INDEX IF NOT EXISTS idx_events_zip ON events(zip);
CREATE INDEX IF NOT EXISTS idx_events_region ON events(region);
CREATE INDEX IF NOT EXISTS idx_events_lat_lng ON events(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_events_event_type_id ON events(event_type_id);
CREATE INDEX IF NOT EXISTS idx_events_featured ON events(featured) WHERE featured = true;

-- event_car_affinities indexes
CREATE INDEX IF NOT EXISTS idx_event_car_affinities_event_id ON event_car_affinities(event_id);
CREATE INDEX IF NOT EXISTS idx_event_car_affinities_car_id ON event_car_affinities(car_id);
CREATE INDEX IF NOT EXISTS idx_event_car_affinities_brand ON event_car_affinities(brand);

-- event_saves indexes
CREATE INDEX IF NOT EXISTS idx_event_saves_user_id ON event_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_event_saves_event_id ON event_saves(event_id);

-- event_submissions indexes
CREATE INDEX IF NOT EXISTS idx_event_submissions_status ON event_submissions(status);
CREATE INDEX IF NOT EXISTS idx_event_submissions_user_id ON event_submissions(user_id);

-- event_sources indexes
CREATE INDEX IF NOT EXISTS idx_event_sources_is_active ON event_sources(is_active);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at on events
CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_events_updated_at ON events;
CREATE TRIGGER trigger_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_events_updated_at();

-- Auto-update updated_at on event_sources
DROP TRIGGER IF EXISTS trigger_event_sources_updated_at ON event_sources;
CREATE TRIGGER trigger_event_sources_updated_at
  BEFORE UPDATE ON event_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_events_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_car_affinities ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_sources ENABLE ROW LEVEL SECURITY;

-- event_types: Public read
DROP POLICY IF EXISTS "event_types_public_read" ON event_types;
CREATE POLICY "event_types_public_read" ON event_types
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "event_types_admin_all" ON event_types;
CREATE POLICY "event_types_admin_all" ON event_types
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE subscription_tier = 'admin'
    )
  );

-- events: Public read for approved events, admin full access
DROP POLICY IF EXISTS "events_public_read_approved" ON events;
CREATE POLICY "events_public_read_approved" ON events
  FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "events_admin_all" ON events;
CREATE POLICY "events_admin_all" ON events
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE subscription_tier = 'admin'
    )
  );

-- event_car_affinities: Public read
DROP POLICY IF EXISTS "event_car_affinities_public_read" ON event_car_affinities;
CREATE POLICY "event_car_affinities_public_read" ON event_car_affinities
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "event_car_affinities_admin_all" ON event_car_affinities;
CREATE POLICY "event_car_affinities_admin_all" ON event_car_affinities
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE subscription_tier = 'admin'
    )
  );

-- event_saves: Users can CRUD their own rows
DROP POLICY IF EXISTS "event_saves_user_crud" ON event_saves;
CREATE POLICY "event_saves_user_crud" ON event_saves
  FOR ALL USING (auth.uid() = user_id);

-- event_submissions: Users can INSERT and read their own, admin full access
DROP POLICY IF EXISTS "event_submissions_user_insert" ON event_submissions;
CREATE POLICY "event_submissions_user_insert" ON event_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "event_submissions_user_read_own" ON event_submissions;
CREATE POLICY "event_submissions_user_read_own" ON event_submissions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "event_submissions_admin_all" ON event_submissions;
CREATE POLICY "event_submissions_admin_all" ON event_submissions
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE subscription_tier = 'admin'
    )
  );

-- event_sources: Admin only
DROP POLICY IF EXISTS "event_sources_admin_all" ON event_sources;
CREATE POLICY "event_sources_admin_all" ON event_sources
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE subscription_tier = 'admin'
    )
  );

-- ============================================================================
-- SEED EVENT TYPES
-- ============================================================================
INSERT INTO event_types (slug, name, description, icon, sort_order, is_track_event) VALUES
  ('cars-and-coffee', 'Cars & Coffee', 'Morning car meetups', '☕', 1, false),
  ('car-show', 'Car Show', 'Concours, judged shows, display events', '🏆', 2, false),
  ('club-meetup', 'Club Meetup', 'Brand or model-specific club gatherings', '🤝', 3, false),
  ('cruise', 'Cruise / Drive', 'Group drives, canyon runs, rallies', '🛣️', 4, false),
  ('autocross', 'Autocross', 'Timed competition on closed course', '🔶', 5, true),
  ('track-day', 'Track Day / HPDE', 'High Performance Driver Education, open lapping', '🏁', 6, true),
  ('time-attack', 'Time Attack', 'Competitive timed lapping events', '⏱️', 7, true),
  ('industry', 'Industry Event', 'SEMA, PRI, auto shows', '🏛️', 8, false),
  ('auction', 'Auction', 'Car auctions', '🔨', 9, false),
  ('other', 'Other', 'Events that don''t fit other categories', '📅', 99, false)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  is_track_event = EXCLUDED.is_track_event;

-- ============================================================================
-- Done! Run migrations with: npx supabase db push
-- ============================================================================

