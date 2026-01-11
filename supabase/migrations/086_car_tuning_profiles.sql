-- Migration: 086_car_tuning_profiles.sql
-- Description: Create car_tuning_profiles table for vehicle-specific tuning shop data
-- This table stores structured, queryable tuning data including stage progressions,
-- tuning platforms, power limits, and brand recommendations per vehicle/variant.

-- Create the car_tuning_profiles table
CREATE TABLE IF NOT EXISTS car_tuning_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Linkage to cars and variants
  car_id UUID REFERENCES cars(id) ON DELETE CASCADE NOT NULL,
  car_variant_id UUID REFERENCES car_variants(id) ON DELETE SET NULL,
  engine_family TEXT, -- e.g., '3.5L EcoBoost', '5.0L Coyote', 'EA888 Gen3'
  tuning_focus TEXT DEFAULT 'performance' CHECK (tuning_focus IN ('performance', 'off-road', 'towing', 'economy', 'drift')),
  
  -- Core Tuning Data (JSONB for flexibility)
  stage_progressions JSONB NOT NULL DEFAULT '[]',
  /*
  Expected format:
  [
    {
      "stage": "Stage 1",
      "key": "stage1",
      "components": ["ECU tune (91/93 oct)"],
      "hpGainLow": 60,
      "hpGainHigh": 100,
      "torqueGainLow": 80,
      "torqueGainHigh": 120,
      "costLow": 400,
      "costHigh": 600,
      "requirements": ["Premium fuel"],
      "notes": "Safe for daily driving"
    }
  ]
  */
  
  tuning_platforms JSONB DEFAULT '[]',
  /*
  Expected format:
  [
    {
      "name": "COBB Accessport",
      "priceLow": 650,
      "priceHigh": 750,
      "notes": "Best for EcoBoost",
      "url": "https://cobbtuning.com"
    }
  ]
  */
  
  power_limits JSONB DEFAULT '{}',
  /*
  Expected format:
  {
    "stockTurbo": {"whp": 500, "notes": "Safe limit"},
    "stockFuelSystem": {"whp": 450, "notes": "HPFP limit"},
    "stockTransmission": {"hp": 600, "notes": "10R80 reliable to ~600 HP"}
  }
  */
  
  brand_recommendations JSONB DEFAULT '{}',
  /*
  Expected format:
  {
    "intakes": ["S&B Filters", "AFE Power", "K&N"],
    "exhausts": ["Borla", "MBRP", "Flowmaster"],
    "tuners": ["5 Star Tuning", "MPT"]
  }
  */
  
  -- Stock Baseline Performance
  stock_whp INTEGER,
  stock_wtq INTEGER,
  
  -- Data Sources (for transparency and validation)
  youtube_insights JSONB DEFAULT '{}',
  /*
  Expected format:
  {
    "videoCount": 15,
    "commonPros": ["excellent aftermarket support"],
    "commonCons": ["timing chain issues"],
    "avgAftermarketSentiment": 0.75,
    "keyQuotes": [{"source": "Channel Name", "quote": "..."}]
  }
  */
  
  research_sources TEXT[] DEFAULT '{}',
  
  -- Quality Control
  pipeline_version TEXT,
  pipeline_run_at TIMESTAMPTZ,
  verified BOOLEAN DEFAULT false,
  verified_by TEXT,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  UNIQUE(car_id, car_variant_id, tuning_focus)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_car_tuning_profiles_car_id ON car_tuning_profiles(car_id);
CREATE INDEX IF NOT EXISTS idx_car_tuning_profiles_variant ON car_tuning_profiles(car_variant_id);
CREATE INDEX IF NOT EXISTS idx_car_tuning_profiles_engine ON car_tuning_profiles(engine_family);
CREATE INDEX IF NOT EXISTS idx_car_tuning_profiles_focus ON car_tuning_profiles(tuning_focus);

-- GIN indexes for JSONB queries
CREATE INDEX IF NOT EXISTS idx_car_tuning_profiles_stages ON car_tuning_profiles USING GIN (stage_progressions);
CREATE INDEX IF NOT EXISTS idx_car_tuning_profiles_platforms ON car_tuning_profiles USING GIN (tuning_platforms);

-- Enable Row Level Security
ALTER TABLE car_tuning_profiles ENABLE ROW LEVEL SECURITY;

-- Public read access (tuning data is public knowledge)
CREATE POLICY "car_tuning_profiles_public_read"
  ON car_tuning_profiles
  FOR SELECT
  TO public
  USING (true);

-- Service role can manage all profiles
CREATE POLICY "car_tuning_profiles_service_manage"
  ON car_tuning_profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_car_tuning_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER car_tuning_profiles_updated_at_trigger
  BEFORE UPDATE ON car_tuning_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_car_tuning_profiles_updated_at();

-- Add helpful comments
COMMENT ON TABLE car_tuning_profiles IS 'Vehicle-specific tuning shop data including stage progressions, tuning platforms, power limits, and brand recommendations';
COMMENT ON COLUMN car_tuning_profiles.engine_family IS 'Engine identifier like "3.5L EcoBoost" or "EA888 Gen3" for engine-specific tuning data';
COMMENT ON COLUMN car_tuning_profiles.tuning_focus IS 'Primary use case: performance, off-road, towing, economy, or drift';
COMMENT ON COLUMN car_tuning_profiles.stage_progressions IS 'Array of stage objects with HP/TQ gains, costs, components, and requirements';
COMMENT ON COLUMN car_tuning_profiles.tuning_platforms IS 'Array of compatible tuning devices/software with pricing';
COMMENT ON COLUMN car_tuning_profiles.power_limits IS 'Object describing safe power limits for various stock components';
COMMENT ON COLUMN car_tuning_profiles.brand_recommendations IS 'Object mapping part categories to recommended brand arrays';
COMMENT ON COLUMN car_tuning_profiles.youtube_insights IS 'Aggregated insights from YouTube videos linked to this car';
COMMENT ON COLUMN car_tuning_profiles.pipeline_version IS 'Version of the enhancement pipeline that created/updated this profile';
