-- Migration: 059_car_pipeline_runs.sql
-- Purpose: Create car_pipeline_runs table to track the 8-phase car addition pipeline
-- Date: 2024-12-21
-- Documentation: See docs/CAR_PIPELINE.md for pipeline details

-- =============================================================================
-- Create car_pipeline_runs table
-- =============================================================================
CREATE TABLE IF NOT EXISTS car_pipeline_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_slug TEXT NOT NULL,
  car_name TEXT NOT NULL,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'blocked')),
  
  -- Phase 1: Selection & Validation
  phase1_validated BOOLEAN DEFAULT FALSE,
  phase1_validated_at TIMESTAMPTZ,
  phase1_notes TEXT,
  
  -- Phase 2: Core Data Entry
  phase2_core_data BOOLEAN DEFAULT FALSE,
  phase2_core_data_at TIMESTAMPTZ,
  phase2_notes TEXT,
  
  -- Phase 3: Automated Enrichment
  phase3_fuel_economy BOOLEAN DEFAULT FALSE,
  phase3_safety_ratings BOOLEAN DEFAULT FALSE,
  phase3_recalls BOOLEAN DEFAULT FALSE,
  phase3_completed_at TIMESTAMPTZ,
  phase3_notes TEXT,
  
  -- Phase 4: Manual Research
  phase4_known_issues BOOLEAN DEFAULT FALSE,
  phase4_maintenance_specs BOOLEAN DEFAULT FALSE,
  phase4_service_intervals BOOLEAN DEFAULT FALSE,
  phase4_variants BOOLEAN DEFAULT FALSE,
  phase4_completed_at TIMESTAMPTZ,
  phase4_notes TEXT,
  
  -- Phase 5: Scoring & Editorial
  phase5_scores_assigned BOOLEAN DEFAULT FALSE,
  phase5_strengths BOOLEAN DEFAULT FALSE,
  phase5_weaknesses BOOLEAN DEFAULT FALSE,
  phase5_alternatives BOOLEAN DEFAULT FALSE,
  phase5_completed_at TIMESTAMPTZ,
  phase5_notes TEXT,
  
  -- Phase 6: Media
  phase6_hero_image BOOLEAN DEFAULT FALSE,
  phase6_gallery_images BOOLEAN DEFAULT FALSE,
  phase6_completed_at TIMESTAMPTZ,
  phase6_notes TEXT,
  
  -- Phase 7: YouTube Enrichment
  phase7_videos_queued BOOLEAN DEFAULT FALSE,
  phase7_videos_processed BOOLEAN DEFAULT FALSE,
  phase7_car_links_verified BOOLEAN DEFAULT FALSE,
  phase7_completed_at TIMESTAMPTZ,
  phase7_notes TEXT,
  
  -- Phase 8: Validation & QA
  phase8_data_complete BOOLEAN DEFAULT FALSE,
  phase8_page_renders BOOLEAN DEFAULT FALSE,
  phase8_al_tested BOOLEAN DEFAULT FALSE,
  phase8_search_works BOOLEAN DEFAULT FALSE,
  phase8_mobile_checked BOOLEAN DEFAULT FALSE,
  phase8_completed_at TIMESTAMPTZ,
  phase8_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMPTZ
);

-- =============================================================================
-- Comments
-- =============================================================================
COMMENT ON TABLE car_pipeline_runs IS 'Tracks progress through the 8-phase car addition pipeline';
COMMENT ON COLUMN car_pipeline_runs.car_slug IS 'The target car slug (may not exist in cars table until phase 2)';
COMMENT ON COLUMN car_pipeline_runs.status IS 'Overall pipeline status: in_progress, completed, or blocked';

-- =============================================================================
-- Indexes
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_status ON car_pipeline_runs(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_slug ON car_pipeline_runs(car_slug);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_created_at ON car_pipeline_runs(created_at DESC);

-- =============================================================================
-- Row Level Security
-- =============================================================================
ALTER TABLE car_pipeline_runs ENABLE ROW LEVEL SECURITY;

-- Admin-only access (internal tool)
CREATE POLICY "car_pipeline_runs_admin_all" ON car_pipeline_runs
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.subscription_tier = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.subscription_tier = 'admin'
    )
  );

-- =============================================================================
-- Trigger for updated_at
-- =============================================================================
CREATE OR REPLACE FUNCTION update_car_pipeline_runs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_car_pipeline_runs_updated_at
  BEFORE UPDATE ON car_pipeline_runs
  FOR EACH ROW
  EXECUTE FUNCTION update_car_pipeline_runs_updated_at();

