-- SuperNatural Motorsports - Supabase Database Schema
-- 
-- This file contains the SQL to create the required tables in Supabase.
-- Run this in the Supabase SQL Editor to set up your database.
--
-- Tables:
--   1. cars - Vehicle database with specs, scores, and hero page content
--   2. leads - Lead capture for contact form, newsletter, and CTAs
--   3. upgrade_packages - Upgrade packages and modules for Performance HUB
--
-- Data Ownership:
--   - Supabase holds MUTABLE BUSINESS DATA (cars, leads, packages, image URLs)
--   - Local files hold IMMUTABLE PRODUCT LOGIC (scoring formulas, category definitions)
--   - See docs/data-model.md for full documentation

-- ============================================================================
-- Enable UUID extension if not already enabled
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- HELPER FUNCTION: Auto-update timestamps
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================================
-- CARS TABLE
-- Authoritative source for vehicle data in production.
-- Local src/data/cars.js is used as seed data and fallback only.
-- ============================================================================
CREATE TABLE IF NOT EXISTS cars (
  -- Identity
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  years TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('premium', 'upper-mid', 'mid', 'budget')),
  category TEXT NOT NULL CHECK (category IN ('Mid-Engine', 'Front-Engine', 'Rear-Engine')),
  
  -- Advisory Scoring Fields (1-10 scale)
  -- These are the core scores used by the recommendation engine
  score_sound INTEGER NOT NULL CHECK (score_sound >= 1 AND score_sound <= 10),
  score_interior INTEGER NOT NULL CHECK (score_interior >= 1 AND score_interior <= 10),
  score_track INTEGER NOT NULL CHECK (score_track >= 1 AND score_track <= 10),
  score_reliability INTEGER NOT NULL CHECK (score_reliability >= 1 AND score_reliability <= 10),
  score_value INTEGER NOT NULL CHECK (score_value >= 1 AND score_value <= 10),
  score_driver_fun INTEGER NOT NULL CHECK (score_driver_fun >= 1 AND score_driver_fun <= 10),
  score_aftermarket INTEGER NOT NULL CHECK (score_aftermarket >= 1 AND score_aftermarket <= 10),
  
  -- Core Specifications (required)
  engine TEXT NOT NULL,
  hp INTEGER NOT NULL CHECK (hp > 0),
  trans TEXT NOT NULL,
  price_range TEXT NOT NULL,
  price_avg INTEGER NOT NULL CHECK (price_avg > 0),
  
  -- Extended Specifications (optional, for hero pages)
  curb_weight INTEGER CHECK (curb_weight > 0),
  zero_to_sixty DECIMAL(3, 1) CHECK (zero_to_sixty > 0),
  top_speed INTEGER CHECK (top_speed > 0),
  drivetrain TEXT CHECK (drivetrain IN ('RWD', 'AWD', 'FWD')),
  layout TEXT,
  msrp_new_low INTEGER CHECK (msrp_new_low > 0),
  msrp_new_high INTEGER CHECK (msrp_new_high > 0),
  
  -- Additional Hard Metrics for Performance HUB
  torque INTEGER CHECK (torque > 0),                    -- Peak torque in lb-ft
  quarter_mile DECIMAL(4, 2) CHECK (quarter_mile > 0),  -- Quarter mile time in seconds
  braking_60_0 INTEGER CHECK (braking_60_0 > 0),        -- 60-0 braking distance in feet
  lateral_g DECIMAL(3, 2) CHECK (lateral_g > 0),        -- Maximum lateral G in cornering
  
  -- Performance HUB Scores (1-10 scale)
  -- These supplement the advisory scores for the GT-style Performance HUB
  -- Nullable because they can be derived from advisory scores if not provided
  perf_power_accel INTEGER CHECK (perf_power_accel >= 1 AND perf_power_accel <= 10),
  perf_grip_cornering INTEGER CHECK (perf_grip_cornering >= 1 AND perf_grip_cornering <= 10),
  perf_braking INTEGER CHECK (perf_braking >= 1 AND perf_braking <= 10),
  perf_track_pace INTEGER CHECK (perf_track_pace >= 1 AND perf_track_pace <= 10),
  perf_drivability INTEGER CHECK (perf_drivability >= 1 AND perf_drivability <= 10),
  perf_reliability_heat INTEGER CHECK (perf_reliability_heat >= 1 AND perf_reliability_heat <= 10),
  perf_sound_emotion INTEGER CHECK (perf_sound_emotion >= 1 AND perf_sound_emotion <= 10),
  
  -- Content Fields (editorial)
  notes TEXT NOT NULL,
  highlight TEXT NOT NULL,
  tagline TEXT,
  hero_blurb TEXT,
  owner_notes_long TEXT,
  pros JSONB DEFAULT '[]'::jsonb,
  cons JSONB DEFAULT '[]'::jsonb,
  best_for JSONB DEFAULT '[]'::jsonb,
  recommendation_highlight TEXT,
  
  -- Media (URLs to Vercel Blob storage)
  image_hero_url TEXT,
  image_gallery JSONB DEFAULT '[]'::jsonb,
  video_url TEXT,
  
  -- CTA
  cta_copy TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_cars_slug ON cars(slug);
CREATE INDEX IF NOT EXISTS idx_cars_tier ON cars(tier);
CREATE INDEX IF NOT EXISTS idx_cars_category ON cars(category);
CREATE INDEX IF NOT EXISTS idx_cars_price_avg ON cars(price_avg);
CREATE INDEX IF NOT EXISTS idx_cars_tier_category ON cars(tier, category);

-- Auto-update timestamp trigger
DROP TRIGGER IF EXISTS update_cars_updated_at ON cars;
CREATE TRIGGER update_cars_updated_at
  BEFORE UPDATE ON cars
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- LEADS TABLE
-- Captures user submissions from contact form, newsletter, and CTAs.
-- No business logic here - just storage. Lead processing is handled by client.
-- ============================================================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  name TEXT,
  source TEXT NOT NULL CHECK (source IN (
    'contact',           -- Contact page form
    'newsletter',        -- Newsletter signup (footer, hero page strips)
    'hero-page',         -- Car detail page CTA
    'advisory-future',   -- Reserved for future email-gated advisory features
    'upgrade-inquiry',   -- Upgrade page inquiries
    'service-booking',   -- Service page bookings
    'performance-hub'    -- Performance HUB inquiries
  )),
  car_interest_slug TEXT REFERENCES cars(slug) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint on email prevents duplicates
  -- Use upsert pattern for returning visitors
  CONSTRAINT unique_lead_email UNIQUE (email)
);

-- Indexes for lead queries and analytics
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_car_interest ON leads(car_interest_slug);

-- Auto-update timestamp trigger
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- UPGRADE PACKAGES TABLE
-- Defines upgrade packages and modules for Performance HUB.
-- Performance deltas are applied client-side; only raw values stored here.
-- ============================================================================
CREATE TABLE IF NOT EXISTS upgrade_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identity
  key TEXT UNIQUE NOT NULL,                 -- Unique identifier (e.g., 'streetSport', 'intake')
  name TEXT NOT NULL,                       -- Display name
  slug TEXT UNIQUE NOT NULL,                -- URL-friendly identifier
  type TEXT NOT NULL CHECK (type IN ('package', 'module')),
  tier TEXT NOT NULL CHECK (tier IN ('streetSport', 'trackPack', 'timeAttack')),
  category TEXT,                            -- For modules: 'power', 'chassis', 'brakes', 'aero', 'cooling', 'wheels'
  
  -- Description
  description TEXT NOT NULL,
  intended_use TEXT,
  
  -- Pricing (display and filtering)
  estimated_cost TEXT,                      -- Display string (e.g., '$3,000 - $6,000')
  estimated_cost_low INTEGER CHECK (estimated_cost_low >= 0),
  estimated_cost_high INTEGER CHECK (estimated_cost_high >= 0),
  
  -- Performance Deltas (impact on Performance HUB scores)
  -- These are additive: final_score = stock_score + delta
  -- Typical range: -3 to +3
  delta_power_accel DECIMAL(3, 1) DEFAULT 0,
  delta_grip_cornering DECIMAL(3, 1) DEFAULT 0,
  delta_braking DECIMAL(3, 1) DEFAULT 0,
  delta_track_pace DECIMAL(3, 1) DEFAULT 0,
  delta_drivability DECIMAL(3, 1) DEFAULT 0,
  delta_reliability_heat DECIMAL(3, 1) DEFAULT 0,
  delta_sound_emotion DECIMAL(3, 1) DEFAULT 0,
  
  -- Hard Metric Changes (estimated improvements)
  metric_hp_gain INTEGER DEFAULT 0,
  metric_zero_to_sixty_improvement DECIMAL(3, 2) DEFAULT 0,  -- Seconds faster (positive = improvement)
  metric_braking_improvement INTEGER DEFAULT 0,              -- Feet shorter (positive = improvement)
  metric_lateral_g_improvement DECIMAL(3, 2) DEFAULT 0,      -- G increase (positive = improvement)
  
  -- Package Contents
  includes JSONB DEFAULT '[]'::jsonb,       -- Array of what's included
  considerations JSONB DEFAULT '[]'::jsonb, -- Trade-offs and notes
  
  -- Applicability
  car_slug TEXT REFERENCES cars(slug) ON DELETE SET NULL,  -- NULL = applies to all cars
  applicable_layouts JSONB DEFAULT '["Mid-Engine", "Front-Engine", "Rear-Engine"]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for upgrade package queries
CREATE INDEX IF NOT EXISTS idx_upgrade_packages_key ON upgrade_packages(key);
CREATE INDEX IF NOT EXISTS idx_upgrade_packages_slug ON upgrade_packages(slug);
CREATE INDEX IF NOT EXISTS idx_upgrade_packages_type ON upgrade_packages(type);
CREATE INDEX IF NOT EXISTS idx_upgrade_packages_tier ON upgrade_packages(tier);
CREATE INDEX IF NOT EXISTS idx_upgrade_packages_category ON upgrade_packages(category);
CREATE INDEX IF NOT EXISTS idx_upgrade_packages_car_slug ON upgrade_packages(car_slug);

-- Auto-update timestamp trigger
DROP TRIGGER IF EXISTS update_upgrade_packages_updated_at ON upgrade_packages;
CREATE TRIGGER update_upgrade_packages_updated_at
  BEFORE UPDATE ON upgrade_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- 
-- Security model:
--   - cars: Public read-only (anyone can browse vehicles)
--   - leads: Write-only for anonymous (can submit, cannot read others' data)
--   - upgrade_packages: Public read-only
--   - Admin access via service_role key bypasses all RLS
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE upgrade_packages ENABLE ROW LEVEL SECURITY;

-- CARS: Public read access
DROP POLICY IF EXISTS "cars_select_policy" ON cars;
CREATE POLICY "cars_select_policy"
  ON cars FOR SELECT
  TO public
  USING (true);

-- CARS: No public write access
DROP POLICY IF EXISTS "cars_insert_policy" ON cars;
DROP POLICY IF EXISTS "cars_update_policy" ON cars;
DROP POLICY IF EXISTS "cars_delete_policy" ON cars;
-- (No policies = no access for INSERT/UPDATE/DELETE via anon key)

-- LEADS: Allow public inserts (contact form, newsletter)
DROP POLICY IF EXISTS "leads_insert_policy" ON leads;
CREATE POLICY "leads_insert_policy"
  ON leads FOR INSERT
  TO public
  WITH CHECK (true);

-- LEADS: Allow updates for upsert pattern (existing email re-submits)
DROP POLICY IF EXISTS "leads_update_policy" ON leads;
CREATE POLICY "leads_update_policy"
  ON leads FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- LEADS: No public read or delete access
DROP POLICY IF EXISTS "leads_select_policy" ON leads;
DROP POLICY IF EXISTS "leads_delete_policy" ON leads;
-- (Users cannot query other users' lead data)

-- UPGRADE_PACKAGES: Public read access
DROP POLICY IF EXISTS "upgrade_packages_select_policy" ON upgrade_packages;
CREATE POLICY "upgrade_packages_select_policy"
  ON upgrade_packages FOR SELECT
  TO public
  USING (true);

-- UPGRADE_PACKAGES: No public write access
DROP POLICY IF EXISTS "upgrade_packages_insert_policy" ON upgrade_packages;
DROP POLICY IF EXISTS "upgrade_packages_update_policy" ON upgrade_packages;
DROP POLICY IF EXISTS "upgrade_packages_delete_policy" ON upgrade_packages;

-- ============================================================================
-- TABLE COMMENTS (Documentation)
-- ============================================================================
COMMENT ON TABLE cars IS 
  'Vehicle database for SuperNatural Motorsports. Authoritative source in production. ' ||
  'Local src/data/cars.js is seed data and fallback only.';

COMMENT ON TABLE leads IS 
  'Lead capture for contact form, newsletter signups, and CTAs. ' ||
  'Uses upsert pattern: duplicate emails update existing records.';

COMMENT ON TABLE upgrade_packages IS 
  'Upgrade packages and modules for Performance HUB. ' ||
  'Delta values applied client-side via src/lib/performance.js.';

-- Column comments for cars
COMMENT ON COLUMN cars.slug IS 'URL-friendly unique identifier, used in /cars/:slug routes';
COMMENT ON COLUMN cars.tier IS 'Price tier: premium ($75K+), upper-mid ($55-75K), mid ($40-55K), budget ($25-40K)';
COMMENT ON COLUMN cars.category IS 'Chassis layout for filtering';
COMMENT ON COLUMN cars.score_sound IS 'Advisory score: Exhaust note, engine character, emotional response (1-10)';
COMMENT ON COLUMN cars.score_interior IS 'Advisory score: Materials quality, design, technology (1-10)';
COMMENT ON COLUMN cars.score_track IS 'Advisory score: Lap times, handling, cooling, brake fade (1-10)';
COMMENT ON COLUMN cars.score_reliability IS 'Advisory score: Ownership costs, known issues, parts availability (1-10)';
COMMENT ON COLUMN cars.score_value IS 'Advisory score: Performance per dollar, depreciation (1-10)';
COMMENT ON COLUMN cars.score_driver_fun IS 'Advisory score: Steering feel, throttle response, connection (1-10)';
COMMENT ON COLUMN cars.score_aftermarket IS 'Advisory score: Tuning support, parts, community (1-10)';
COMMENT ON COLUMN cars.perf_power_accel IS 'Performance HUB: Power & Acceleration (1-10)';
COMMENT ON COLUMN cars.perf_grip_cornering IS 'Performance HUB: Grip & Cornering (1-10)';
COMMENT ON COLUMN cars.perf_braking IS 'Performance HUB: Braking performance (1-10)';
COMMENT ON COLUMN cars.perf_track_pace IS 'Performance HUB: Overall track pace (1-10)';
COMMENT ON COLUMN cars.perf_drivability IS 'Performance HUB: Drivability & Comfort (1-10)';
COMMENT ON COLUMN cars.perf_reliability_heat IS 'Performance HUB: Reliability & Heat Management (1-10)';
COMMENT ON COLUMN cars.perf_sound_emotion IS 'Performance HUB: Sound & Emotion (1-10)';
COMMENT ON COLUMN cars.image_hero_url IS 'URL to hero image in Vercel Blob (or other CDN)';
COMMENT ON COLUMN cars.image_gallery IS 'JSONB array of additional image URLs';

-- Column comments for leads
COMMENT ON COLUMN leads.source IS 'Origin: contact, newsletter, hero-page, advisory-future, upgrade-inquiry, service-booking, performance-hub';
COMMENT ON COLUMN leads.metadata IS 'Flexible JSONB for messages, interests, interaction_history';
COMMENT ON COLUMN leads.car_interest_slug IS 'FK to car if lead originated from specific car page';

-- Column comments for upgrade_packages
COMMENT ON COLUMN upgrade_packages.type IS 'package = curated set of mods, module = individual upgrade item';
COMMENT ON COLUMN upgrade_packages.tier IS 'Performance tier: streetSport, trackPack, timeAttack';
COMMENT ON COLUMN upgrade_packages.delta_power_accel IS 'Additive delta to Power & Acceleration score (typical range -3 to +3)';
COMMENT ON COLUMN upgrade_packages.car_slug IS 'If set, package is car-specific; if NULL, applies to all compatible cars';
COMMENT ON COLUMN upgrade_packages.applicable_layouts IS 'JSONB array of compatible layouts: Mid-Engine, Front-Engine, Rear-Engine';
