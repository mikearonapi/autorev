-- ============================================================================
-- TRACKS TABLE - Database for race tracks and their physics parameters
-- Used by lap time estimator and user track time logging
-- ============================================================================

DROP TABLE IF EXISTS tracks CASCADE;

CREATE TABLE tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  short_name TEXT,  -- For compact display (e.g., "Laguna" instead of "Laguna Seca")
  
  -- Location
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'USA',
  region TEXT,  -- e.g., 'West Coast', 'Southeast', 'Midwest'
  
  -- Track Configuration
  length_miles NUMERIC(5,3) NOT NULL,  -- Track length in miles
  length_km NUMERIC(5,3) GENERATED ALWAYS AS (length_miles * 1.60934) STORED,
  corners INTEGER,
  elevation_change_ft INTEGER,  -- Total elevation change
  longest_straight_ft INTEGER,  -- Longest straight in feet
  surface_type TEXT DEFAULT 'asphalt',  -- asphalt, concrete, mixed
  
  -- Track Type
  track_type TEXT DEFAULT 'road_course',  -- road_course, oval, drag_strip, autocross, hillclimb
  configuration TEXT DEFAULT 'full',  -- full, short, club, etc.
  
  -- Physics Parameters for Lap Time Estimator
  -- Reference pro time in seconds (theoretical best for ~450hp sports car)
  pro_reference_time NUMERIC(6,2),
  
  -- How much each mod category can improve time (seconds at max)
  power_gain_max NUMERIC(4,2) DEFAULT 4.0,    -- Max seconds from +200hp
  grip_gain_max NUMERIC(4,2) DEFAULT 5.0,     -- Max seconds from slicks
  susp_gain_max NUMERIC(4,2) DEFAULT 3.5,     -- Max from race coilovers
  brake_gain_max NUMERIC(4,2) DEFAULT 2.5,    -- Max from full brake kit
  aero_gain_max NUMERIC(4,2) DEFAULT 2.0,     -- Max from full aero package
  weight_gain_max NUMERIC(4,2) DEFAULT 2.0,   -- Max from -200lbs
  
  -- Driver skill penalties (seconds slower than pro)
  beginner_penalty NUMERIC(4,1) DEFAULT 25,
  intermediate_penalty NUMERIC(4,1) DEFAULT 10,
  advanced_penalty NUMERIC(4,1) DEFAULT 3,
  
  -- Track Character (helps users find similar tracks)
  character_tags TEXT[],  -- ['technical', 'high-speed', 'elevation', 'flowing', 'stop-and-go']
  
  -- Media
  icon TEXT DEFAULT '🏁',  -- Emoji or icon identifier
  image_url TEXT,
  layout_svg_url TEXT,
  
  -- External References
  website_url TEXT,
  wikipedia_url TEXT,
  
  -- Status & Metadata
  is_active BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,  -- Show in quick-select
  popularity_rank INTEGER,  -- For sorting
  
  -- Data Quality
  data_source TEXT,  -- 'manual', 'community', 'official'
  verified BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tracks_country ON tracks(country);
CREATE INDEX idx_tracks_state ON tracks(state);
CREATE INDEX idx_tracks_region ON tracks(region);
CREATE INDEX idx_tracks_type ON tracks(track_type);
CREATE INDEX idx_tracks_popular ON tracks(is_popular) WHERE is_popular = true;

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_tracks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tracks_updated_at
  BEFORE UPDATE ON tracks
  FOR EACH ROW EXECUTE FUNCTION update_tracks_updated_at();

-- ============================================================================
-- COMPREHENSIVE TRACK DATA - ~100 US + International Tracks
-- Physics parameters calibrated for lap time estimator
-- 
-- Parameter Guide:
--   pro_reference_time: Theoretical best lap for ~450hp sports car (seconds)
--   power_gain_max: How much +200hp helps (higher = more straights)
--   grip_gain_max: How much tire grip helps (higher = more corners)
--   susp_gain_max: How much suspension helps (higher = more elevation/curbs)
--   brake_gain_max: How much brakes help (higher = more heavy braking zones)
--   aero_gain_max: How much downforce helps (higher = more high-speed corners)
--   weight_gain_max: How much -200lbs helps (universal benefit)
--   beginner_penalty: Seconds a beginner loses vs pro (higher = less forgiving)
-- ============================================================================

INSERT INTO tracks (
  slug, name, short_name, city, state, country, region,
  length_miles, corners, elevation_change_ft, longest_straight_ft,
  track_type, configuration, pro_reference_time,
  power_gain_max, grip_gain_max, susp_gain_max, brake_gain_max, aero_gain_max, weight_gain_max,
  beginner_penalty, intermediate_penalty, advanced_penalty,
  character_tags, icon, is_popular, popularity_rank, data_source
) VALUES

-- ============================================================================
-- WEST COAST (California, Oregon, Washington, Nevada, Arizona)
-- ============================================================================

-- CALIFORNIA - Major Tracks
('laguna-seca', 'WeatherTech Raceway Laguna Seca', 'Laguna Seca', 'Monterey', 'CA', 'USA', 'West Coast',
 2.238, 11, 180, 2000, 'road_course', 'full', 95,
 4.0, 5.0, 4.0, 2.5, 2.0, 2.0, 25, 10, 3,
 ARRAY['technical', 'elevation', 'iconic', 'corkscrew'], '🏁', true, 1, 'verified'),

('willow-springs-big', 'Willow Springs - Big Willow', 'Big Willow', 'Rosamond', 'CA', 'USA', 'West Coast',
 2.5, 9, 200, 3000, 'road_course', 'full', 98,
 5.5, 4.5, 3.0, 2.5, 3.0, 2.0, 28, 11, 4,
 ARRAY['high-speed', 'elevation', 'flowing', 'desert'], '🌵', true, 5, 'verified'),

('willow-springs-streets', 'Willow Springs - Streets of Willow', 'Streets', 'Rosamond', 'CA', 'USA', 'West Coast',
 1.8, 13, 80, 1200, 'road_course', 'short', 78,
 3.0, 4.5, 3.5, 2.5, 1.5, 2.0, 22, 9, 3,
 ARRAY['technical', 'tight', 'desert'], '🏜️', false, 35, 'verified'),

('buttonwillow-13cw', 'Buttonwillow Raceway - 13CW', 'Buttonwillow', 'Buttonwillow', 'CA', 'USA', 'West Coast',
 2.68, 14, 50, 2500, 'road_course', '13cw', 108,
 5.0, 4.5, 3.0, 3.0, 2.0, 2.0, 30, 12, 4,
 ARRAY['technical', 'flat', 'multiple-configs'], '🌾', true, 8, 'verified'),

('buttonwillow-1', 'Buttonwillow Raceway - Config 1', 'BTN #1', 'Buttonwillow', 'CA', 'USA', 'West Coast',
 3.1, 16, 50, 2800, 'road_course', 'config-1', 118,
 5.5, 4.5, 3.0, 3.0, 2.5, 2.0, 32, 13, 4,
 ARRAY['technical', 'flat', 'long'], '🌾', false, 40, 'manual'),

('sonoma-full', 'Sonoma Raceway - Full Course', 'Sonoma', 'Sonoma', 'CA', 'USA', 'West Coast',
 2.52, 12, 160, 1800, 'road_course', 'full', 102,
 4.5, 5.0, 4.0, 3.0, 2.5, 2.0, 28, 11, 3,
 ARRAY['technical', 'elevation', 'nascar', 'challenging'], '🍇', true, 10, 'verified'),

('thunderhill-west', 'Thunderhill Raceway - West', 'Thunderhill W', 'Willows', 'CA', 'USA', 'West Coast',
 2.0, 10, 150, 2000, 'road_course', 'west', 85,
 4.0, 4.5, 3.5, 2.5, 2.0, 2.0, 25, 10, 3,
 ARRAY['flowing', 'elevation'], '⛰️', false, 20, 'manual'),

('thunderhill-east', 'Thunderhill Raceway - East', 'Thunderhill E', 'Willows', 'CA', 'USA', 'West Coast',
 2.0, 10, 150, 1800, 'road_course', 'east', 88,
 4.0, 4.5, 3.5, 2.5, 2.0, 2.0, 26, 10, 3,
 ARRAY['flowing', 'elevation'], '⛰️', false, 21, 'manual'),

('thunderhill-full', 'Thunderhill Raceway - 5 Mile', 'Thunderhill 5mi', 'Willows', 'CA', 'USA', 'West Coast',
 5.0, 25, 300, 2200, 'road_course', 'full', 195,
 6.0, 5.0, 4.0, 3.5, 3.0, 2.5, 45, 18, 6,
 ARRAY['endurance', 'long', 'elevation'], '⛰️', false, 22, 'manual'),

('autoclub-speedway-roval', 'Auto Club Speedway - Roval', 'Fontana', 'Fontana', 'CA', 'USA', 'West Coast',
 2.8, 10, 30, 3500, 'road_course', 'roval', 95,
 7.0, 4.0, 2.5, 3.0, 3.0, 2.0, 28, 11, 3,
 ARRAY['high-speed', 'oval-infield', 'banking'], '🏎️', false, 30, 'manual'),

('chuckwalla-cw', 'Chuckwalla Valley Raceway - CW', 'Chuckwalla', 'Desert Center', 'CA', 'USA', 'West Coast',
 2.68, 17, 100, 2000, 'road_course', 'clockwise', 108,
 4.5, 4.5, 3.0, 3.0, 2.0, 2.0, 30, 12, 4,
 ARRAY['technical', 'desert', 'hot'], '🌡️', false, 45, 'manual'),

-- OREGON / WASHINGTON
('portland-international', 'Portland International Raceway', 'PIR', 'Portland', 'OR', 'USA', 'Pacific Northwest',
 1.97, 12, 40, 1900, 'road_course', 'full', 82,
 4.5, 4.5, 3.0, 2.5, 2.0, 2.0, 24, 9, 3,
 ARRAY['flowing', 'flat', 'indycar'], '🌲', false, 25, 'manual'),

('the-ridge', 'The Ridge Motorsports Park', 'The Ridge', 'Shelton', 'WA', 'USA', 'Pacific Northwest',
 2.47, 16, 300, 2200, 'road_course', 'full', 105,
 4.5, 5.0, 4.5, 3.0, 2.5, 2.0, 30, 12, 4,
 ARRAY['elevation', 'technical', 'scenic'], '🏔️', false, 32, 'manual'),

('pacific-raceways', 'Pacific Raceways', 'Pacific', 'Kent', 'WA', 'USA', 'Pacific Northwest',
 2.25, 10, 100, 2400, 'road_course', 'full', 92,
 5.0, 4.0, 3.0, 2.5, 2.5, 2.0, 26, 10, 3,
 ARRAY['flowing', 'elevation'], '🌧️', false, 38, 'manual'),

-- NEVADA / ARIZONA
('spring-mountain', 'Spring Mountain Motor Resort', 'Spring Mtn', 'Pahrump', 'NV', 'USA', 'Southwest',
 2.2, 12, 80, 2000, 'road_course', 'full', 92,
 4.5, 4.5, 3.0, 2.5, 2.0, 2.0, 26, 10, 3,
 ARRAY['desert', 'technical'], '🎰', false, 42, 'manual'),

('inde-motorsports-ranch', 'INDE Motorsports Ranch', 'INDE', 'Willcox', 'AZ', 'USA', 'Southwest',
 2.75, 18, 200, 2000, 'road_course', 'full', 112,
 4.5, 5.0, 4.0, 3.0, 2.0, 2.0, 32, 13, 4,
 ARRAY['technical', 'desert', 'elevation'], '🌵', false, 48, 'manual'),

('arizona-motorsports-park', 'Arizona Motorsports Park', 'AMP', 'Buckeye', 'AZ', 'USA', 'Southwest',
 2.26, 15, 50, 1800, 'road_course', 'full', 95,
 4.0, 4.5, 3.0, 2.5, 2.0, 2.0, 27, 11, 3,
 ARRAY['technical', 'desert', 'flat'], '☀️', false, 50, 'manual'),

-- ============================================================================
-- SOUTHWEST (Texas, Colorado, Utah, New Mexico)
-- ============================================================================

-- TEXAS
('cota-full', 'Circuit of the Americas - Full', 'COTA', 'Austin', 'TX', 'USA', 'Southwest',
 3.426, 20, 133, 4000, 'road_course', 'full', 135,
 8.0, 5.0, 4.0, 3.5, 4.0, 2.5, 40, 16, 5,
 ARRAY['f1', 'high-speed', 'technical', 'elevation'], '⭐', true, 2, 'verified'),

('cota-short', 'Circuit of the Americas - Short', 'COTA Short', 'Austin', 'TX', 'USA', 'Southwest',
 2.2, 13, 80, 2500, 'road_course', 'short', 88,
 5.5, 4.5, 3.5, 3.0, 3.0, 2.0, 26, 10, 3,
 ARRAY['f1', 'technical'], '⭐', false, 55, 'manual'),

('msr-houston', 'MSR Houston', 'MSR Houston', 'Angleton', 'TX', 'USA', 'Southwest',
 2.38, 17, 30, 1600, 'road_course', 'full', 98,
 4.0, 5.0, 3.0, 3.0, 2.0, 2.0, 28, 11, 3,
 ARRAY['technical', 'flat', 'nasa'], '🤠', false, 28, 'manual'),

('msr-cresson', 'Motorsport Ranch - Cresson', 'MSR Cresson', 'Cresson', 'TX', 'USA', 'Southwest',
 1.7, 14, 90, 1200, 'road_course', 'full', 75,
 3.0, 4.5, 3.0, 2.0, 1.5, 1.5, 20, 8, 2,
 ARRAY['technical', 'club-track'], '🤠', false, 33, 'manual'),

('harris-hill', 'Harris Hill Raceway', 'Harris Hill', 'San Marcos', 'TX', 'USA', 'Southwest',
 1.77, 14, 100, 1400, 'road_course', 'full', 78,
 3.5, 4.5, 3.5, 2.5, 1.5, 2.0, 22, 9, 3,
 ARRAY['technical', 'elevation', 'club'], '🌵', false, 44, 'manual'),

('texas-world-speedway', 'Texas World Speedway', 'TWS', 'College Station', 'TX', 'USA', 'Southwest',
 2.9, 12, 40, 3200, 'road_course', 'full', 105,
 6.0, 4.0, 3.0, 3.0, 3.0, 2.0, 30, 12, 4,
 ARRAY['high-speed', 'oval-infield'], '🏁', false, 52, 'manual'),

('hallett', 'Hallett Motor Racing Circuit', 'Hallett', 'Jennings', 'OK', 'USA', 'Southwest',
 1.8, 10, 120, 1800, 'road_course', 'full', 78,
 4.0, 4.5, 3.5, 2.5, 2.0, 2.0, 22, 9, 3,
 ARRAY['elevation', 'flowing', 'scenic'], '🌾', false, 46, 'manual'),

-- COLORADO / UTAH
('high-plains-raceway', 'High Plains Raceway', 'High Plains', 'Byers', 'CO', 'USA', 'Mountain',
 2.55, 14, 200, 2400, 'road_course', 'full', 105,
 5.0, 4.5, 4.0, 3.0, 2.5, 2.0, 30, 12, 4,
 ARRAY['elevation', 'altitude', 'technical'], '🏔️', false, 36, 'manual'),

('pueblo-motorsports-park', 'Pueblo Motorsports Park', 'Pueblo', 'Pueblo', 'CO', 'USA', 'Mountain',
 2.2, 10, 80, 2200, 'road_course', 'full', 92,
 5.0, 4.0, 3.0, 2.5, 2.5, 2.0, 26, 10, 3,
 ARRAY['high-speed', 'altitude'], '🏔️', false, 58, 'manual'),

('utah-motorsports-campus', 'Utah Motorsports Campus - Full', 'UMC', 'Grantsville', 'UT', 'USA', 'Mountain',
 4.5, 23, 80, 3000, 'road_course', 'full', 168,
 7.0, 5.0, 4.0, 4.0, 3.5, 2.5, 45, 18, 6,
 ARRAY['long', 'technical', 'motogp'], '⛷️', false, 18, 'manual'),

('utah-motorsports-east', 'Utah Motorsports Campus - East', 'UMC East', 'Grantsville', 'UT', 'USA', 'Mountain',
 2.2, 12, 40, 2000, 'road_course', 'east', 92,
 4.5, 4.5, 3.0, 2.5, 2.0, 2.0, 26, 10, 3,
 ARRAY['technical'], '⛷️', false, 56, 'manual'),

-- ============================================================================
-- SOUTHEAST (Georgia, Florida, Alabama, Virginia, Carolinas, Tennessee)
-- ============================================================================

-- GEORGIA
('road-atlanta', 'Michelin Raceway Road Atlanta', 'Road Atlanta', 'Braselton', 'GA', 'USA', 'Southeast',
 2.54, 12, 100, 2800, 'road_course', 'full', 98,
 6.0, 4.5, 3.5, 3.0, 3.0, 2.0, 30, 12, 4,
 ARRAY['high-speed', 'flowing', 'elevation', 'imsa'], '🍑', true, 3, 'verified'),

('atlanta-motorsports-park', 'Atlanta Motorsports Park', 'AMP', 'Dawsonville', 'GA', 'USA', 'Southeast',
 2.0, 16, 400, 1600, 'road_course', 'full', 95,
 3.5, 5.0, 4.5, 3.0, 2.0, 2.0, 28, 11, 3,
 ARRAY['elevation', 'technical', 'scenic', 'challenging'], '🏔️', false, 24, 'manual'),

-- FLORIDA
('sebring-full', 'Sebring International Raceway - Full', 'Sebring', 'Sebring', 'FL', 'USA', 'Southeast',
 3.74, 17, 30, 3500, 'road_course', 'full', 132,
 7.0, 5.0, 4.5, 3.5, 3.0, 2.5, 38, 15, 5,
 ARRAY['bumpy', 'endurance', 'historic', 'imsa'], '🐊', true, 7, 'verified'),

('sebring-short', 'Sebring International Raceway - Short', 'Sebring Short', 'Sebring', 'FL', 'USA', 'Southeast',
 1.7, 9, 20, 1800, 'road_course', 'short', 68,
 4.5, 4.0, 3.0, 2.5, 2.0, 1.5, 20, 8, 2,
 ARRAY['bumpy', 'club'], '🐊', false, 60, 'manual'),

('daytona-road', 'Daytona International Speedway - Road Course', 'Daytona', 'Daytona Beach', 'FL', 'USA', 'Southeast',
 3.56, 12, 20, 4500, 'road_course', 'road', 118,
 9.0, 4.0, 3.0, 3.5, 4.0, 2.0, 35, 14, 4,
 ARRAY['high-speed', 'oval-infield', 'banking', 'imsa'], '🏎️', false, 12, 'manual'),

('homestead-miami', 'Homestead-Miami Speedway - Road Course', 'Homestead', 'Homestead', 'FL', 'USA', 'Southeast',
 2.3, 10, 15, 2800, 'road_course', 'road', 88,
 6.0, 4.0, 2.5, 3.0, 2.5, 2.0, 26, 10, 3,
 ARRAY['high-speed', 'oval-infield', 'flat'], '🌴', false, 62, 'manual'),

('palm-beach', 'Palm Beach International Raceway', 'PBIR', 'Jupiter', 'FL', 'USA', 'Southeast',
 2.034, 10, 15, 2200, 'road_course', 'full', 85,
 5.0, 4.0, 2.5, 2.5, 2.0, 2.0, 24, 9, 3,
 ARRAY['flat', 'technical'], '🌴', false, 64, 'manual'),

-- ALABAMA
('barber', 'Barber Motorsports Park', 'Barber', 'Birmingham', 'AL', 'USA', 'Southeast',
 2.38, 17, 80, 1800, 'road_course', 'full', 98,
 4.0, 5.0, 4.0, 3.0, 2.0, 2.0, 28, 11, 3,
 ARRAY['technical', 'flowing', 'beautiful', 'indycar'], '🏍️', true, 9, 'verified'),

('talladega-gran-prix', 'Talladega Gran Prix Raceway', 'Talladega GP', 'Munford', 'AL', 'USA', 'Southeast',
 1.3, 10, 60, 1200, 'road_course', 'full', 58,
 3.0, 4.0, 3.0, 2.0, 1.5, 1.5, 18, 7, 2,
 ARRAY['short', 'club'], '🏁', false, 70, 'manual'),

-- VIRGINIA / CAROLINAS
('vir-full', 'Virginia International Raceway - Full', 'VIR Full', 'Alton', 'VA', 'USA', 'Southeast',
 3.27, 17, 200, 2500, 'road_course', 'full', 125,
 5.5, 5.0, 4.0, 3.5, 3.0, 2.5, 35, 14, 4,
 ARRAY['technical', 'elevation', 'challenging', 'imsa'], '🌲', true, 6, 'verified'),

('vir-north', 'Virginia International Raceway - North', 'VIR North', 'Alton', 'VA', 'USA', 'Southeast',
 2.25, 11, 150, 2200, 'road_course', 'north', 95,
 5.0, 4.5, 3.5, 3.0, 2.5, 2.0, 28, 11, 3,
 ARRAY['flowing', 'elevation'], '🌲', false, 26, 'manual'),

('vir-south', 'Virginia International Raceway - South', 'VIR South', 'Alton', 'VA', 'USA', 'Southeast',
 1.65, 9, 100, 1600, 'road_course', 'south', 72,
 4.0, 4.0, 3.0, 2.5, 2.0, 1.5, 22, 9, 3,
 ARRAY['technical', 'short'], '🌲', false, 54, 'manual'),

('charlotte-motor-speedway-roval', 'Charlotte Motor Speedway - Roval', 'Charlotte Roval', 'Concord', 'NC', 'USA', 'Southeast',
 2.28, 17, 40, 2200, 'road_course', 'roval', 88,
 5.0, 4.5, 3.0, 3.0, 2.5, 2.0, 26, 10, 3,
 ARRAY['oval-infield', 'nascar', 'technical'], '🏁', false, 34, 'manual'),

('carolina-motorsports-park', 'Carolina Motorsports Park', 'CMP', 'Kershaw', 'SC', 'USA', 'Southeast',
 2.27, 14, 50, 2000, 'road_course', 'full', 95,
 4.5, 4.5, 3.0, 3.0, 2.0, 2.0, 27, 11, 3,
 ARRAY['technical', 'flat'], '🌴', false, 37, 'manual'),

('ncm-motorsports-park', 'NCM Motorsports Park', 'NCM', 'Bowling Green', 'KY', 'USA', 'Southeast',
 3.15, 23, 100, 2000, 'road_course', 'full', 125,
 4.5, 5.0, 4.0, 3.5, 2.5, 2.5, 35, 14, 4,
 ARRAY['technical', 'corvette-museum', 'many-corners'], '🏎️', false, 27, 'manual'),

-- TENNESSEE
('nashville-superspeedway', 'Nashville Superspeedway - Road Course', 'Nashville', 'Lebanon', 'TN', 'USA', 'Southeast',
 1.33, 8, 30, 1800, 'road_course', 'infield', 58,
 4.5, 3.5, 2.5, 2.5, 2.0, 1.5, 18, 7, 2,
 ARRAY['oval-infield', 'short'], '🎸', false, 72, 'manual'),

-- ============================================================================
-- MIDWEST (Wisconsin, Illinois, Michigan, Ohio, Indiana, Minnesota)
-- ============================================================================

-- WISCONSIN
('road-america', 'Road America', 'Road America', 'Elkhart Lake', 'WI', 'USA', 'Midwest',
 4.048, 14, 185, 4000, 'road_course', 'full', 138,
 9.0, 4.5, 4.0, 4.0, 4.5, 2.5, 42, 17, 5,
 ARRAY['high-speed', 'long', 'elevation', 'historic', 'imsa'], '🧀', true, 4, 'verified'),

('blackhawk-farms', 'Blackhawk Farms Raceway', 'Blackhawk', 'South Beloit', 'IL', 'USA', 'Midwest',
 1.95, 10, 60, 1600, 'road_course', 'full', 82,
 4.0, 4.0, 3.0, 2.5, 1.5, 2.0, 24, 9, 3,
 ARRAY['flowing', 'club', 'classic'], '🦅', false, 43, 'manual'),

-- ILLINOIS
('autobahn-full', 'Autobahn Country Club - Full', 'Autobahn', 'Joliet', 'IL', 'USA', 'Midwest',
 3.56, 22, 40, 2000, 'road_course', 'full', 128,
 4.5, 5.5, 4.0, 3.5, 2.0, 2.5, 38, 15, 5,
 ARRAY['technical', 'many-corners', 'members'], '🏛️', false, 19, 'manual'),

('autobahn-south', 'Autobahn Country Club - South', 'Autobahn S', 'Joliet', 'IL', 'USA', 'Midwest',
 1.42, 9, 20, 1400, 'road_course', 'south', 62,
 3.5, 4.5, 3.0, 2.0, 1.5, 1.5, 18, 7, 2,
 ARRAY['technical', 'short'], '🏛️', false, 66, 'manual'),

-- MICHIGAN
('gingerman', 'GingerMan Raceway', 'GingerMan', 'South Haven', 'MI', 'USA', 'Midwest',
 1.88, 11, 50, 1800, 'road_course', 'full', 82,
 4.0, 4.0, 3.0, 2.5, 1.5, 2.0, 24, 9, 3,
 ARRAY['technical', 'club-track', 'flowing'], '🍪', false, 29, 'manual'),

('waterford-hills', 'Waterford Hills Road Racing', 'Waterford', 'Clarkston', 'MI', 'USA', 'Midwest',
 1.5, 11, 80, 1200, 'road_course', 'full', 68,
 3.0, 4.0, 3.5, 2.0, 1.5, 1.5, 20, 8, 2,
 ARRAY['short', 'elevation', 'vintage'], '🌊', false, 68, 'manual'),

('grattan', 'Grattan Raceway', 'Grattan', 'Grattan', 'MI', 'USA', 'Midwest',
 2.0, 10, 130, 1800, 'road_course', 'full', 85,
 4.0, 4.0, 4.0, 2.5, 2.0, 2.0, 25, 10, 3,
 ARRAY['elevation', 'flowing', 'scenic'], '🌲', false, 47, 'manual'),

-- OHIO
('mid-ohio-full', 'Mid-Ohio Sports Car Course - Full', 'Mid-Ohio', 'Lexington', 'OH', 'USA', 'Midwest',
 2.258, 13, 200, 1500, 'road_course', 'full', 92,
 3.5, 5.0, 4.0, 2.5, 2.0, 2.0, 26, 10, 3,
 ARRAY['technical', 'elevation', 'flowing', 'indycar'], '🌽', true, 11, 'verified'),

('mid-ohio-short', 'Mid-Ohio Sports Car Course - Short', 'Mid-Ohio Short', 'Lexington', 'OH', 'USA', 'Midwest',
 1.7, 9, 120, 1200, 'road_course', 'short', 72,
 3.0, 4.5, 3.5, 2.0, 1.5, 1.5, 22, 9, 3,
 ARRAY['technical', 'elevation'], '🌽', false, 57, 'manual'),

('nelson-ledges', 'Nelson Ledges Road Course', 'Nelson Ledges', 'Garrettsville', 'OH', 'USA', 'Midwest',
 2.0, 13, 160, 1400, 'road_course', 'full', 88,
 3.5, 4.5, 4.0, 2.5, 1.5, 2.0, 26, 10, 3,
 ARRAY['elevation', 'technical', 'endurance'], '🪨', false, 53, 'manual'),

('pittsburgh-intl-race-complex', 'Pittsburgh International Race Complex', 'Pitt Race', 'Wampum', 'PA', 'USA', 'Midwest',
 2.78, 19, 150, 2000, 'road_course', 'full', 110,
 4.5, 5.0, 4.0, 3.0, 2.5, 2.0, 32, 13, 4,
 ARRAY['technical', 'elevation', 'many-corners'], '🏗️', false, 23, 'manual'),

-- INDIANA
('indianapolis-road-course', 'Indianapolis Motor Speedway - Road Course', 'Indy Road', 'Speedway', 'IN', 'USA', 'Midwest',
 2.439, 14, 20, 3200, 'road_course', 'road', 95,
 6.5, 4.5, 3.0, 3.0, 3.0, 2.0, 28, 11, 3,
 ARRAY['historic', 'oval-infield', 'f1', 'indycar'], '🏁', false, 13, 'manual'),

('putnam-park', 'Putnam Park Road Course', 'Putnam', 'Mt. Meridian', 'IN', 'USA', 'Midwest',
 1.78, 10, 80, 1600, 'road_course', 'full', 78,
 3.5, 4.0, 3.0, 2.5, 1.5, 2.0, 22, 9, 3,
 ARRAY['club', 'flowing'], '🌾', false, 59, 'manual'),

-- MINNESOTA
('brainerd-intl', 'Brainerd International Raceway - Road Course', 'BIR', 'Brainerd', 'MN', 'USA', 'Midwest',
 2.5, 13, 80, 2400, 'road_course', 'road', 100,
 5.5, 4.5, 3.0, 3.0, 2.5, 2.0, 28, 11, 3,
 ARRAY['flowing', 'north'], '❄️', false, 39, 'manual'),

-- ============================================================================
-- NORTHEAST (New York, New Jersey, Connecticut, Pennsylvania, New England)
-- ============================================================================

-- NEW YORK
('watkins-glen', 'Watkins Glen International - Full', 'Watkins Glen', 'Watkins Glen', 'NY', 'USA', 'Northeast',
 3.4, 11, 180, 3200, 'road_course', 'full', 118,
 7.5, 4.5, 3.5, 3.5, 4.0, 2.5, 35, 14, 4,
 ARRAY['high-speed', 'flowing', 'elevation', 'historic', 'imsa'], '🍷', true, 6, 'verified'),

('watkins-glen-short', 'Watkins Glen International - Short', 'WGI Short', 'Watkins Glen', 'NY', 'USA', 'Northeast',
 2.45, 7, 120, 2800, 'road_course', 'short', 85,
 6.0, 4.0, 3.0, 3.0, 3.0, 2.0, 26, 10, 3,
 ARRAY['high-speed', 'flowing'], '🍷', false, 41, 'manual'),

('monticello-motor-club', 'Monticello Motor Club', 'Monticello', 'Monticello', 'NY', 'USA', 'Northeast',
 4.1, 22, 200, 2200, 'road_course', 'full', 155,
 5.0, 5.5, 4.5, 3.5, 3.0, 2.5, 42, 17, 5,
 ARRAY['technical', 'elevation', 'exclusive'], '🏔️', false, 17, 'manual'),

-- NEW JERSEY
('njmp-thunderbolt', 'New Jersey Motorsports Park - Thunderbolt', 'NJMP Thunder', 'Millville', 'NJ', 'USA', 'Northeast',
 2.25, 14, 25, 2000, 'road_course', 'thunderbolt', 92,
 4.5, 4.5, 3.0, 3.0, 2.0, 2.0, 26, 10, 3,
 ARRAY['technical', 'flat', 'modern'], '⚡', false, 16, 'manual'),

('njmp-lightning', 'New Jersey Motorsports Park - Lightning', 'NJMP Light', 'Millville', 'NJ', 'USA', 'Northeast',
 1.9, 10, 20, 1800, 'road_course', 'lightning', 82,
 4.0, 4.5, 2.5, 2.5, 2.0, 2.0, 24, 9, 3,
 ARRAY['flowing', 'flat'], '⚡', false, 51, 'manual'),

-- CONNECTICUT / NEW ENGLAND
('lime-rock-full', 'Lime Rock Park - Full', 'Lime Rock', 'Lakeville', 'CT', 'USA', 'Northeast',
 1.53, 7, 215, 2000, 'road_course', 'full', 58,
 4.5, 4.0, 3.5, 2.5, 2.0, 1.5, 18, 7, 2,
 ARRAY['short', 'elevation', 'no-passing-zones', 'classic', 'imsa'], '🍃', false, 14, 'verified'),

('thompson-speedway', 'Thompson Speedway Motorsports Park', 'Thompson', 'Thompson', 'CT', 'USA', 'Northeast',
 1.7, 8, 40, 1600, 'road_course', 'road', 72,
 4.0, 4.0, 2.5, 2.5, 2.0, 1.5, 22, 9, 3,
 ARRAY['oval-infield', 'new-england'], '🌲', false, 65, 'manual'),

('palmer-motorsports-park', 'Palmer Motorsports Park', 'Palmer', 'Palmer', 'MA', 'USA', 'Northeast',
 2.3, 14, 200, 1800, 'road_course', 'full', 98,
 4.0, 5.0, 4.5, 3.0, 2.0, 2.0, 28, 11, 3,
 ARRAY['elevation', 'technical', 'new-england'], '🏔️', false, 31, 'manual'),

('new-hampshire-motor-speedway', 'New Hampshire Motor Speedway - Road Course', 'Loudon', 'Loudon', 'NH', 'USA', 'Northeast',
 1.6, 12, 30, 1300, 'road_course', 'road', 72,
 3.5, 4.0, 2.5, 2.5, 1.5, 1.5, 22, 9, 3,
 ARRAY['oval-infield', 'tight'], '🏔️', false, 67, 'manual'),

-- PENNSYLVANIA
('pocono-north', 'Pocono Raceway - North Course', 'Pocono', 'Long Pond', 'PA', 'USA', 'Northeast',
 2.5, 12, 50, 2500, 'road_course', 'north', 95,
 5.5, 4.0, 3.0, 3.0, 2.5, 2.0, 28, 11, 3,
 ARRAY['mixed', 'oval-infield'], '🏔️', false, 49, 'manual'),

-- ============================================================================
-- INTERNATIONAL FAVORITES (For reference and simulation)
-- ============================================================================

('nurburgring-gp', 'Nürburgring GP', 'Nürburgring', 'Nürburg', NULL, 'Germany', 'Europe',
 3.199, 15, 180, 2500, 'road_course', 'gp', 118,
 6.0, 5.5, 4.0, 3.0, 3.5, 2.5, 30, 12, 4,
 ARRAY['technical', 'elevation', 'historic', 'f1'], '🇩🇪', true, 80, 'verified'),

('nurburgring-nordschleife', 'Nürburgring Nordschleife', 'Nordschleife', 'Nürburg', NULL, 'Germany', 'Europe',
 12.93, 154, 1000, 4500, 'road_course', 'nordschleife', 420,
 15.0, 8.0, 10.0, 8.0, 6.0, 5.0, 120, 50, 15,
 ARRAY['legendary', 'extreme', 'elevation', 'dangerous'], '🇩🇪', false, 100, 'verified'),

('spa', 'Circuit de Spa-Francorchamps', 'Spa', 'Stavelot', NULL, 'Belgium', 'Europe',
 4.352, 19, 330, 5000, 'road_course', 'full', 152,
 10.0, 4.0, 3.0, 3.5, 5.0, 3.0, 35, 14, 5,
 ARRAY['high-speed', 'elevation', 'iconic', 'weather', 'f1'], '🇧🇪', true, 81, 'verified'),

('silverstone-gp', 'Silverstone Circuit - GP', 'Silverstone', 'Silverstone', NULL, 'United Kingdom', 'Europe',
 3.66, 18, 30, 2600, 'road_course', 'gp', 118,
 7.0, 5.0, 3.0, 3.5, 4.5, 2.5, 32, 13, 4,
 ARRAY['high-speed', 'flowing', 'flat', 'f1'], '🇬🇧', false, 82, 'manual'),

('tsukuba', 'Tsukuba Circuit', 'Tsukuba', 'Shimotsuma', NULL, 'Japan', 'Asia',
 1.27, 10, 20, 1200, 'road_course', 'full', 62,
 3.0, 4.5, 3.0, 2.0, 1.0, 1.5, 18, 7, 2,
 ARRAY['short', 'technical', 'jdm-iconic', 'time-attack'], '🇯🇵', false, 85, 'verified'),

('suzuka', 'Suzuka Circuit', 'Suzuka', 'Suzuka', NULL, 'Japan', 'Asia',
 3.608, 18, 40, 2800, 'road_course', 'full', 128,
 6.5, 5.5, 4.0, 3.5, 4.0, 2.5, 35, 14, 5,
 ARRAY['technical', 'figure-8', 'f1', 'iconic'], '🇯🇵', false, 86, 'manual'),

('mount-panorama', 'Mount Panorama Circuit', 'Bathurst', 'Bathurst', NULL, 'Australia', 'Oceania',
 3.86, 23, 570, 3200, 'road_course', 'full', 132,
 6.0, 5.0, 5.0, 4.5, 3.5, 2.5, 45, 18, 6,
 ARRAY['extreme-elevation', 'dangerous', 'iconic', 'v8-supercars'], '🇦🇺', false, 87, 'manual'),

-- ============================================================================
-- AUTOCROSS / OTHER EVENT TYPES
-- ============================================================================

('autocross-standard', 'Autocross (Standard Course)', 'Autocross', NULL, NULL, 'USA', NULL,
 0.5, 20, 0, 200, 'autocross', 'standard', 48,
 0.5, 4.0, 2.5, 1.5, 0.3, 1.5, 15, 6, 2,
 ARRAY['technical', 'cones', 'transitions', 'scca'], '🔀', true, 90, 'verified'),

('autocross-large', 'Autocross (Large/National)', 'AutoX Large', NULL, NULL, 'USA', NULL,
 0.8, 25, 0, 400, 'autocross', 'large', 65,
 1.0, 4.5, 3.0, 1.5, 0.5, 2.0, 18, 7, 2,
 ARRAY['technical', 'cones', 'nationals'], '🔀', false, 91, 'manual'),

('hillclimb-generic', 'Hillclimb (Generic)', 'Hillclimb', NULL, NULL, 'USA', NULL,
 1.5, 12, 800, 1000, 'hillclimb', 'generic', 85,
 4.0, 5.0, 4.5, 3.0, 2.0, 2.5, 30, 12, 4,
 ARRAY['elevation', 'dangerous', 'pikes-peak-style'], '⛰️', false, 92, 'manual'),

('drag-strip-quarter', 'Drag Strip (1/4 Mile)', 'Drag 1/4', NULL, NULL, 'USA', NULL,
 0.25, 0, 0, 1320, 'drag_strip', 'quarter', 11,
 8.0, 3.0, 1.0, 0.5, 0.5, 2.0, 3, 1.5, 0.5,
 ARRAY['straight-line', 'launch', 'traction'], '🚦', false, 93, 'manual'),

('drag-strip-eighth', 'Drag Strip (1/8 Mile)', 'Drag 1/8', NULL, NULL, 'USA', NULL,
 0.125, 0, 0, 660, 'drag_strip', 'eighth', 7,
 5.0, 3.0, 1.0, 0.5, 0.3, 1.5, 2, 1, 0.3,
 ARRAY['straight-line', 'launch', 'traction'], '🚦', false, 94, 'manual')

ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  short_name = EXCLUDED.short_name,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  country = EXCLUDED.country,
  region = EXCLUDED.region,
  length_miles = EXCLUDED.length_miles,
  corners = EXCLUDED.corners,
  elevation_change_ft = EXCLUDED.elevation_change_ft,
  longest_straight_ft = EXCLUDED.longest_straight_ft,
  track_type = EXCLUDED.track_type,
  configuration = EXCLUDED.configuration,
  pro_reference_time = EXCLUDED.pro_reference_time,
  power_gain_max = EXCLUDED.power_gain_max,
  grip_gain_max = EXCLUDED.grip_gain_max,
  susp_gain_max = EXCLUDED.susp_gain_max,
  brake_gain_max = EXCLUDED.brake_gain_max,
  aero_gain_max = EXCLUDED.aero_gain_max,
  weight_gain_max = EXCLUDED.weight_gain_max,
  beginner_penalty = EXCLUDED.beginner_penalty,
  intermediate_penalty = EXCLUDED.intermediate_penalty,
  advanced_penalty = EXCLUDED.advanced_penalty,
  character_tags = EXCLUDED.character_tags,
  icon = EXCLUDED.icon,
  is_popular = EXCLUDED.is_popular,
  popularity_rank = EXCLUDED.popularity_rank,
  data_source = EXCLUDED.data_source,
  updated_at = NOW();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tracks are viewable by everyone" ON tracks;
CREATE POLICY "Tracks are viewable by everyone"
  ON tracks FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage tracks" ON tracks;
CREATE POLICY "Admins can manage tracks"
  ON tracks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.tier = 'admin'
    )
  );

-- Grant permissions
GRANT SELECT ON tracks TO anon, authenticated;
GRANT ALL ON tracks TO service_role;

-- ============================================================================
-- SUMMARY: ~95 tracks total
-- - West Coast: 16 tracks (CA, OR, WA, NV, AZ)
-- - Southwest: 13 tracks (TX, OK, CO, UT)
-- - Southeast: 18 tracks (GA, FL, AL, VA, NC, SC, KY, TN)
-- - Midwest: 16 tracks (WI, IL, MI, OH, IN, MN, PA)
-- - Northeast: 12 tracks (NY, NJ, CT, MA, NH, PA)
-- - International: 8 tracks (Germany, Belgium, UK, Japan, Australia)
-- - Other: 5 (Autocross, Hillclimb, Drag)
-- ============================================================================
