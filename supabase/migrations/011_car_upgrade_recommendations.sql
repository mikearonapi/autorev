-- ============================================================================
-- Migration 011: Car-Specific Upgrade Recommendations
-- 
-- Adds a JSONB column to store curated, car-specific upgrade recommendations.
-- This replaces the static JavaScript data with database-driven recommendations.
--
-- Schema:
-- {
--   "primaryFocus": "cooling" | "handling" | "braking" | "power" | "sound",
--   "focusReason": "Human-written explanation of why this is the priority",
--   "coreUpgrades": ["oil-cooler", "trans-cooler", "brake-pads-track"],
--   "enhancementUpgrades": ["headers", "exhaust-catback", "coilovers-track"],
--   "platformStrengths": ["8,250 RPM redline", "MagneRide suspension"],
--   "watchOuts": ["Oil consumption on early engines", "Heat soak during track sessions"]
-- }
-- ============================================================================

-- Add the upgrade_recommendations column to cars table
ALTER TABLE cars ADD COLUMN IF NOT EXISTS upgrade_recommendations JSONB;

-- Add comment for documentation
COMMENT ON COLUMN cars.upgrade_recommendations IS 'Car-specific upgrade recommendations. Contains primaryFocus, focusReason, coreUpgrades, enhancementUpgrades, platformStrengths, and watchOuts';

-- Create index for querying by primary focus
CREATE INDEX IF NOT EXISTS idx_cars_upgrade_recommendations_focus 
  ON cars ((upgrade_recommendations->>'primaryFocus'));





















