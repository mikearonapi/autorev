-- Migration: Garage Score System
-- Adds scoring columns and functions to track garage completeness (0-100)
-- Scoring breakdown:
--   +20: Specs complete (year, make, model, trim, color, mileage)
--   +20: Has photos
--   +20: Has modifications
--   +20: Has build goals/projects
--   +20: Has parts list

-- ============================================
-- Step 1: Add columns to user_vehicles
-- ============================================

ALTER TABLE user_vehicles
ADD COLUMN IF NOT EXISTS garage_score INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS score_breakdown JSONB NOT NULL DEFAULT '{
  "specs": 0,
  "photos": 0,
  "mods": 0,
  "goals": 0,
  "parts": 0
}'::jsonb,
ADD COLUMN IF NOT EXISTS score_updated_at TIMESTAMPTZ;

-- Index for sorting by score
CREATE INDEX IF NOT EXISTS idx_user_vehicles_garage_score 
ON user_vehicles(user_id, garage_score DESC);

COMMENT ON COLUMN user_vehicles.garage_score IS 'Overall garage completeness score (0-100)';
COMMENT ON COLUMN user_vehicles.score_breakdown IS 'Breakdown of score by category: specs, photos, mods, goals, parts (each 0-20)';
COMMENT ON COLUMN user_vehicles.score_updated_at IS 'When the score was last calculated';


-- ============================================
-- Step 2: Create score calculation function
-- ============================================

CREATE OR REPLACE FUNCTION calculate_garage_score(p_vehicle_id UUID)
RETURNS TABLE (
  total_score INTEGER,
  breakdown JSONB,
  specs_score INTEGER,
  photos_score INTEGER,
  mods_score INTEGER,
  goals_score INTEGER,
  parts_score INTEGER
) AS $$
DECLARE
  v_user_id UUID;
  v_specs_score INTEGER := 0;
  v_photos_score INTEGER := 0;
  v_mods_score INTEGER := 0;
  v_goals_score INTEGER := 0;
  v_parts_score INTEGER := 0;
  v_specs_count INTEGER := 0;
  v_photo_count INTEGER;
  v_mod_count INTEGER;
  v_project_count INTEGER;
  v_parts_count INTEGER;
  v_vehicle RECORD;
BEGIN
  -- Get vehicle data
  SELECT * INTO v_vehicle FROM user_vehicles WHERE id = p_vehicle_id;
  
  IF v_vehicle IS NULL THEN
    RETURN QUERY SELECT 0, '{}'::jsonb, 0, 0, 0, 0, 0;
    RETURN;
  END IF;
  
  v_user_id := v_vehicle.user_id;
  
  -- ==========================================
  -- SPECS SCORE (+20 max)
  -- Check for filled basic specs
  -- ==========================================
  IF v_vehicle.year IS NOT NULL THEN v_specs_count := v_specs_count + 1; END IF;
  IF v_vehicle.make IS NOT NULL AND v_vehicle.make != '' THEN v_specs_count := v_specs_count + 1; END IF;
  IF v_vehicle.model IS NOT NULL AND v_vehicle.model != '' THEN v_specs_count := v_specs_count + 1; END IF;
  IF v_vehicle.trim IS NOT NULL AND v_vehicle.trim != '' THEN v_specs_count := v_specs_count + 1; END IF;
  IF v_vehicle.color IS NOT NULL AND v_vehicle.color != '' THEN v_specs_count := v_specs_count + 1; END IF;
  IF v_vehicle.mileage IS NOT NULL AND v_vehicle.mileage > 0 THEN v_specs_count := v_specs_count + 1; END IF;
  
  -- 6 possible fields, scale to 20 points
  v_specs_score := LEAST(20, ROUND((v_specs_count::numeric / 6) * 20));
  
  -- ==========================================
  -- PHOTOS SCORE (+20 max)
  -- Check for uploaded vehicle photos
  -- ==========================================
  SELECT COUNT(*) INTO v_photo_count
  FROM user_uploaded_images
  WHERE user_vehicle_id = p_vehicle_id
    AND (media_type IS NULL OR media_type = 'image');
  
  -- 1 photo = 10 points, 2+ photos = 20 points
  IF v_photo_count >= 2 THEN
    v_photos_score := 20;
  ELSIF v_photo_count = 1 THEN
    v_photos_score := 10;
  ELSE
    v_photos_score := 0;
  END IF;
  
  -- ==========================================
  -- MODS SCORE (+20 max)
  -- Check for installed modifications
  -- ==========================================
  SELECT COALESCE(jsonb_array_length(installed_modifications), 0) INTO v_mod_count
  FROM user_vehicles
  WHERE id = p_vehicle_id;
  
  -- 1-2 mods = 10 points, 3+ mods = 20 points
  IF v_mod_count >= 3 THEN
    v_mods_score := 20;
  ELSIF v_mod_count >= 1 THEN
    v_mods_score := 10;
  ELSE
    v_mods_score := 0;
  END IF;
  
  -- ==========================================
  -- GOALS SCORE (+20 max)
  -- Check for build projects/goals
  -- ==========================================
  SELECT COUNT(*) INTO v_project_count
  FROM user_projects
  WHERE user_id = v_user_id
    AND deleted_at IS NULL
    AND (
      car_id = v_vehicle.matched_car_id
      OR car_slug = v_vehicle.matched_car_slug
    );
  
  -- Also check if vehicle has active_build_id
  IF v_vehicle.active_build_id IS NOT NULL THEN
    v_project_count := v_project_count + 1;
  END IF;
  
  -- 1 project = 20 points
  IF v_project_count >= 1 THEN
    v_goals_score := 20;
  ELSE
    v_goals_score := 0;
  END IF;
  
  -- ==========================================
  -- PARTS SCORE (+20 max)
  -- Check for parts in build list
  -- ==========================================
  SELECT COUNT(*) INTO v_parts_count
  FROM user_project_parts upp
  JOIN user_projects up ON upp.project_id = up.id
  WHERE up.user_id = v_user_id
    AND up.deleted_at IS NULL
    AND (
      up.car_id = v_vehicle.matched_car_id
      OR up.car_slug = v_vehicle.matched_car_slug
    );
  
  -- 1-2 parts = 10 points, 3+ parts = 20 points
  IF v_parts_count >= 3 THEN
    v_parts_score := 20;
  ELSIF v_parts_count >= 1 THEN
    v_parts_score := 10;
  ELSE
    v_parts_score := 0;
  END IF;
  
  -- ==========================================
  -- Return results
  -- ==========================================
  RETURN QUERY SELECT
    (v_specs_score + v_photos_score + v_mods_score + v_goals_score + v_parts_score)::INTEGER,
    jsonb_build_object(
      'specs', v_specs_score,
      'photos', v_photos_score,
      'mods', v_mods_score,
      'goals', v_goals_score,
      'parts', v_parts_score
    ),
    v_specs_score,
    v_photos_score,
    v_mods_score,
    v_goals_score,
    v_parts_score;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calculate_garage_score IS 'Calculates garage completeness score (0-100) for a vehicle';


-- ============================================
-- Step 3: Create function to update score
-- ============================================

CREATE OR REPLACE FUNCTION update_vehicle_garage_score(p_vehicle_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_score RECORD;
BEGIN
  -- Calculate the score
  SELECT * INTO v_score FROM calculate_garage_score(p_vehicle_id);
  
  -- Update the vehicle record
  UPDATE user_vehicles
  SET 
    garage_score = v_score.total_score,
    score_breakdown = v_score.breakdown,
    score_updated_at = NOW()
  WHERE id = p_vehicle_id;
  
  RETURN v_score.total_score;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_vehicle_garage_score IS 'Recalculates and persists garage score for a vehicle';


-- ============================================
-- Step 4: Create RPC for batch score updates
-- ============================================

CREATE OR REPLACE FUNCTION update_all_garage_scores_for_user(p_user_id UUID)
RETURNS TABLE (
  vehicle_id UUID,
  vehicle_name TEXT,
  new_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uv.id,
    COALESCE(uv.nickname, uv.year::text || ' ' || uv.make || ' ' || uv.model),
    update_vehicle_garage_score(uv.id)
  FROM user_vehicles uv
  WHERE uv.user_id = p_user_id
    AND uv.deleted_at IS NULL
  ORDER BY uv.display_order, uv.created_at;
END;
$$ LANGUAGE plpgsql;


-- ============================================
-- Step 5: Grant permissions
-- ============================================

GRANT EXECUTE ON FUNCTION calculate_garage_score TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_garage_score TO service_role;
GRANT EXECUTE ON FUNCTION update_vehicle_garage_score TO authenticated;
GRANT EXECUTE ON FUNCTION update_vehicle_garage_score TO service_role;
GRANT EXECUTE ON FUNCTION update_all_garage_scores_for_user TO authenticated;
GRANT EXECUTE ON FUNCTION update_all_garage_scores_for_user TO service_role;


-- ============================================
-- Step 6: Auto-update triggers
-- ============================================

-- Trigger 1: On user_vehicles update (specs or mods change)
CREATE OR REPLACE FUNCTION trigger_recalc_garage_score_on_vehicle_update()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    OLD.year IS DISTINCT FROM NEW.year OR
    OLD.make IS DISTINCT FROM NEW.make OR
    OLD.model IS DISTINCT FROM NEW.model OR
    OLD.trim IS DISTINCT FROM NEW.trim OR
    OLD.color IS DISTINCT FROM NEW.color OR
    OLD.mileage IS DISTINCT FROM NEW.mileage OR
    OLD.installed_modifications IS DISTINCT FROM NEW.installed_modifications OR
    OLD.active_build_id IS DISTINCT FROM NEW.active_build_id
  ) THEN
    PERFORM update_vehicle_garage_score(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recalc_garage_score_on_vehicle_update ON user_vehicles;
CREATE TRIGGER trg_recalc_garage_score_on_vehicle_update
  AFTER UPDATE ON user_vehicles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_recalc_garage_score_on_vehicle_update();

-- Trigger 2: On user_uploaded_images insert/delete
CREATE OR REPLACE FUNCTION trigger_recalc_garage_score_on_photo_change()
RETURNS TRIGGER AS $$
DECLARE
  v_vehicle_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_vehicle_id := OLD.user_vehicle_id;
  ELSE
    v_vehicle_id := NEW.user_vehicle_id;
  END IF;
  
  IF v_vehicle_id IS NOT NULL THEN
    PERFORM update_vehicle_garage_score(v_vehicle_id);
  END IF;
  
  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recalc_garage_score_on_photo_insert ON user_uploaded_images;
CREATE TRIGGER trg_recalc_garage_score_on_photo_insert
  AFTER INSERT ON user_uploaded_images
  FOR EACH ROW
  EXECUTE FUNCTION trigger_recalc_garage_score_on_photo_change();

DROP TRIGGER IF EXISTS trg_recalc_garage_score_on_photo_delete ON user_uploaded_images;
CREATE TRIGGER trg_recalc_garage_score_on_photo_delete
  AFTER DELETE ON user_uploaded_images
  FOR EACH ROW
  EXECUTE FUNCTION trigger_recalc_garage_score_on_photo_change();

-- Trigger 3: On user_projects insert/update/delete
CREATE OR REPLACE FUNCTION trigger_recalc_garage_score_on_project_change()
RETURNS TRIGGER AS $$
DECLARE
  v_car_id UUID;
  v_car_slug TEXT;
  v_user_id UUID;
  v_vehicle RECORD;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_car_id := OLD.car_id;
    v_car_slug := OLD.car_slug;
    v_user_id := OLD.user_id;
  ELSE
    v_car_id := NEW.car_id;
    v_car_slug := NEW.car_slug;
    v_user_id := NEW.user_id;
  END IF;
  
  FOR v_vehicle IN
    SELECT id FROM user_vehicles
    WHERE user_id = v_user_id AND deleted_at IS NULL
      AND (matched_car_id = v_car_id OR matched_car_slug = v_car_slug)
  LOOP
    PERFORM update_vehicle_garage_score(v_vehicle.id);
  END LOOP;
  
  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recalc_garage_score_on_project_insert ON user_projects;
CREATE TRIGGER trg_recalc_garage_score_on_project_insert
  AFTER INSERT ON user_projects FOR EACH ROW
  EXECUTE FUNCTION trigger_recalc_garage_score_on_project_change();

DROP TRIGGER IF EXISTS trg_recalc_garage_score_on_project_update ON user_projects;
CREATE TRIGGER trg_recalc_garage_score_on_project_update
  AFTER UPDATE ON user_projects FOR EACH ROW
  WHEN (OLD.deleted_at IS DISTINCT FROM NEW.deleted_at)
  EXECUTE FUNCTION trigger_recalc_garage_score_on_project_change();

DROP TRIGGER IF EXISTS trg_recalc_garage_score_on_project_delete ON user_projects;
CREATE TRIGGER trg_recalc_garage_score_on_project_delete
  AFTER DELETE ON user_projects FOR EACH ROW
  EXECUTE FUNCTION trigger_recalc_garage_score_on_project_change();

-- Trigger 4: On user_project_parts insert/delete
CREATE OR REPLACE FUNCTION trigger_recalc_garage_score_on_parts_change()
RETURNS TRIGGER AS $$
DECLARE
  v_project RECORD;
  v_vehicle RECORD;
BEGIN
  IF TG_OP = 'DELETE' THEN
    SELECT * INTO v_project FROM user_projects WHERE id = OLD.project_id;
  ELSE
    SELECT * INTO v_project FROM user_projects WHERE id = NEW.project_id;
  END IF;
  
  IF v_project IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;
  
  FOR v_vehicle IN
    SELECT id FROM user_vehicles
    WHERE user_id = v_project.user_id AND deleted_at IS NULL
      AND (matched_car_id = v_project.car_id OR matched_car_slug = v_project.car_slug)
  LOOP
    PERFORM update_vehicle_garage_score(v_vehicle.id);
  END LOOP;
  
  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recalc_garage_score_on_parts_insert ON user_project_parts;
CREATE TRIGGER trg_recalc_garage_score_on_parts_insert
  AFTER INSERT ON user_project_parts FOR EACH ROW
  EXECUTE FUNCTION trigger_recalc_garage_score_on_parts_change();

DROP TRIGGER IF EXISTS trg_recalc_garage_score_on_parts_delete ON user_project_parts;
CREATE TRIGGER trg_recalc_garage_score_on_parts_delete
  AFTER DELETE ON user_project_parts FOR EACH ROW
  EXECUTE FUNCTION trigger_recalc_garage_score_on_parts_change();


-- ============================================
-- Step 7: Backfill existing vehicles
-- ============================================

DO $$
DECLARE
  v_vehicle RECORD;
BEGIN
  FOR v_vehicle IN 
    SELECT id FROM user_vehicles WHERE deleted_at IS NULL
  LOOP
    PERFORM update_vehicle_garage_score(v_vehicle.id);
  END LOOP;
END $$;
