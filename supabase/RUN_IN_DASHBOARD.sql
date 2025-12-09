-- ============================================================================
-- SUPABASE DATABASE SETUP - Run in Supabase SQL Editor
-- 
-- Copy and paste this entire file into your Supabase Dashboard:
-- https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new
-- 
-- This creates the upgrade_education and car_known_issues tables,
-- and configures the proper Row Level Security policies.
-- ============================================================================

-- ============================================================================
-- 1. UPGRADE EDUCATION TABLE
-- Educational content about individual upgrades for the Performance HUB
-- ============================================================================
CREATE TABLE IF NOT EXISTS upgrade_education (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identity
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'power-engine',
    'exhaust-sound', 
    'electronics-tuning',
    'suspension-handling',
    'brakes',
    'wheels-tires',
    'cooling',
    'aero'
  )),
  
  -- Short content (for cards)
  short_description TEXT NOT NULL,
  cost_range TEXT NOT NULL,
  cost_low INTEGER CHECK (cost_low >= 0),
  cost_high INTEGER CHECK (cost_high >= 0),
  difficulty TEXT CHECK (difficulty IN ('Easy', 'Moderate', 'Hard', 'Professional')),
  install_time TEXT,
  
  -- Long content (for detail modal)
  full_description TEXT,
  how_it_works TEXT,
  
  -- Expected gains (JSONB for flexibility)
  expected_gains JSONB DEFAULT '{}'::jsonb,
  
  -- Pros/Cons
  pros JSONB DEFAULT '[]'::jsonb,
  cons JSONB DEFAULT '[]'::jsonb,
  
  -- Related info
  best_for JSONB DEFAULT '[]'::jsonb,
  works_well_with JSONB DEFAULT '[]'::jsonb,
  considerations TEXT,
  
  -- Metadata
  applicable_car_types JSONB DEFAULT '["all"]'::jsonb,
  sort_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_upgrade_education_key ON upgrade_education(key);
CREATE INDEX IF NOT EXISTS idx_upgrade_education_slug ON upgrade_education(slug);
CREATE INDEX IF NOT EXISTS idx_upgrade_education_category ON upgrade_education(category);

-- ============================================================================
-- 2. CAR KNOWN ISSUES TABLE
-- Documents common problems and concerns for each vehicle
-- ============================================================================
CREATE TABLE IF NOT EXISTS car_known_issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  car_slug TEXT NOT NULL REFERENCES cars(slug) ON DELETE CASCADE,
  
  -- Issue details
  issue_name TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('Critical', 'Major', 'Minor', 'Cosmetic')),
  affected_years TEXT,
  
  -- Description
  description TEXT NOT NULL,
  symptoms TEXT,
  prevention TEXT,
  fix_description TEXT,
  estimated_cost TEXT,
  
  -- Metadata
  source TEXT,
  sort_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_car_known_issues_car_slug ON car_known_issues(car_slug);
CREATE INDEX IF NOT EXISTS idx_car_known_issues_severity ON car_known_issues(severity);

-- ============================================================================
-- 3. AUTO-UPDATE TIMESTAMPS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
DROP TRIGGER IF EXISTS update_upgrade_education_updated_at ON upgrade_education;
CREATE TRIGGER update_upgrade_education_updated_at
  BEFORE UPDATE ON upgrade_education
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_car_known_issues_updated_at ON car_known_issues;
CREATE TRIGGER update_car_known_issues_updated_at
  BEFORE UPDATE ON car_known_issues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE upgrade_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_known_issues ENABLE ROW LEVEL SECURITY;

-- UPGRADE_EDUCATION: Public read access
DROP POLICY IF EXISTS "upgrade_education_select_policy" ON upgrade_education;
CREATE POLICY "upgrade_education_select_policy"
  ON upgrade_education FOR SELECT
  TO public
  USING (true);

-- CAR_KNOWN_ISSUES: Public read access
DROP POLICY IF EXISTS "car_known_issues_select_policy" ON car_known_issues;
CREATE POLICY "car_known_issues_select_policy"
  ON car_known_issues FOR SELECT
  TO public
  USING (true);

-- ============================================================================
-- 5. TABLE COMMENTS
-- ============================================================================
COMMENT ON TABLE upgrade_education IS 'Educational content about car upgrades for Performance HUB. Used when users want to learn about modifications without selecting a specific car.';
COMMENT ON TABLE car_known_issues IS 'Known problems and issues for each vehicle. High-value buyer information content.';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Tables created successfully!';
  RAISE NOTICE '   - upgrade_education';
  RAISE NOTICE '   - car_known_issues';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Run the migration script to seed data:';
  RAISE NOTICE '  node scripts/run-supabase-migrations.js upgrades';
END $$;







