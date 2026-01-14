-- ============================================================================
-- Migration: 101_user_track_times.sql
-- Description: Track time logging for users to record their actual lap times
--              Enables AL to analyze real performance vs estimates
-- ============================================================================

-- Create enum for track conditions
CREATE TYPE track_condition AS ENUM (
  'dry',
  'damp',
  'wet',
  'cold',      -- track temp < 60°F
  'hot',       -- track temp > 90°F
  'optimal'    -- ideal conditions
);

-- Create enum for session type
CREATE TYPE session_type AS ENUM (
  'practice',
  'time_attack',
  'track_day',
  'competition',
  'autocross',
  'driving_school'
);

-- Main table for user track times
CREATE TABLE user_track_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Vehicle reference (can be from garage or just car_slug)
  user_vehicle_id UUID REFERENCES user_vehicles(id) ON DELETE SET NULL,
  car_id UUID REFERENCES cars(id) ON DELETE SET NULL,
  car_slug TEXT,
  
  -- Track info
  track_name TEXT NOT NULL,
  track_config TEXT,           -- e.g., "Full Course", "Short Course", "GP Circuit"
  track_length_miles DECIMAL(5,3),
  
  -- Lap time (stored as seconds for easy math)
  lap_time_seconds DECIMAL(8,3) NOT NULL,  -- e.g., 97.234 = 1:37.234
  
  -- Session details
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  session_type session_type DEFAULT 'track_day',
  conditions track_condition DEFAULT 'dry',
  ambient_temp_f INTEGER,      -- ambient temperature
  track_temp_f INTEGER,        -- track surface temperature
  
  -- Car setup at time of lap
  tire_compound TEXT,          -- matches the tire compounds in tuning profiles
  tire_pressure_front DECIMAL(4,1),
  tire_pressure_rear DECIMAL(4,1),
  
  -- Mods summary (snapshot of what was on the car)
  mods_summary JSONB DEFAULT '{}',  -- { power: "+50hp", suspension: "coilovers", etc. }
  estimated_hp INTEGER,
  
  -- Comparison to estimates
  estimated_time_seconds DECIMAL(8,3),  -- what our estimator predicted
  driver_skill_level TEXT,              -- what skill level they selected
  
  -- User notes and feedback
  notes TEXT,                  -- "Car felt loose in turn 3", "Brake fade on lap 5"
  highlights TEXT,             -- "Best time ever!", "First time under 2 minutes"
  areas_to_improve TEXT,       -- User self-assessment
  
  -- AL analysis (populated by AL when analyzing)
  al_analysis JSONB DEFAULT NULL,  -- { insights: [], recommendations: [], skill_assessment: {} }
  al_analyzed_at TIMESTAMPTZ,
  
  -- Validation
  is_verified BOOLEAN DEFAULT FALSE,  -- Could be verified by timing system data
  timing_system TEXT,                  -- "AIM", "RaceCapture", "TrackAddict", etc.
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_user_track_times_user_id ON user_track_times(user_id);
CREATE INDEX idx_user_track_times_car_slug ON user_track_times(car_slug);
CREATE INDEX idx_user_track_times_track_name ON user_track_times(track_name);
CREATE INDEX idx_user_track_times_session_date ON user_track_times(session_date DESC);
CREATE INDEX idx_user_track_times_user_track ON user_track_times(user_id, track_name);

-- Trigger to auto-populate car_id from car_slug
CREATE TRIGGER auto_car_id_user_track_times
  BEFORE INSERT OR UPDATE ON user_track_times
  FOR EACH ROW EXECUTE FUNCTION resolve_car_id_from_slug();

-- Trigger to update updated_at
CREATE TRIGGER update_user_track_times_updated_at
  BEFORE UPDATE ON user_track_times
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE user_track_times ENABLE ROW LEVEL SECURITY;

-- Users can view their own track times
CREATE POLICY "Users can view own track times"
  ON user_track_times FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own track times
CREATE POLICY "Users can insert own track times"
  ON user_track_times FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own track times
CREATE POLICY "Users can update own track times"
  ON user_track_times FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own track times
CREATE POLICY "Users can delete own track times"
  ON user_track_times FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- Helper function to get user's track time history for a specific track
-- ============================================================================
CREATE OR REPLACE FUNCTION get_user_track_history(
  p_user_id UUID,
  p_track_name TEXT DEFAULT NULL,
  p_car_slug TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  track_name TEXT,
  track_config TEXT,
  lap_time_seconds DECIMAL,
  session_date DATE,
  session_type session_type,
  conditions track_condition,
  tire_compound TEXT,
  mods_summary JSONB,
  estimated_hp INTEGER,
  notes TEXT,
  car_slug TEXT,
  car_name TEXT,
  improvement_from_previous DECIMAL,
  al_analysis JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH ranked_times AS (
    SELECT 
      utt.*,
      c.name as car_name,
      LAG(utt.lap_time_seconds) OVER (
        PARTITION BY utt.track_name, utt.car_slug 
        ORDER BY utt.session_date
      ) as previous_time
    FROM user_track_times utt
    LEFT JOIN cars c ON c.slug = utt.car_slug
    WHERE utt.user_id = p_user_id
      AND (p_track_name IS NULL OR utt.track_name = p_track_name)
      AND (p_car_slug IS NULL OR utt.car_slug = p_car_slug)
  )
  SELECT 
    rt.id,
    rt.track_name,
    rt.track_config,
    rt.lap_time_seconds,
    rt.session_date,
    rt.session_type,
    rt.conditions,
    rt.tire_compound,
    rt.mods_summary,
    rt.estimated_hp,
    rt.notes,
    rt.car_slug,
    rt.car_name,
    CASE 
      WHEN rt.previous_time IS NOT NULL 
      THEN rt.previous_time - rt.lap_time_seconds 
      ELSE NULL 
    END as improvement_from_previous,
    rt.al_analysis
  FROM ranked_times rt
  ORDER BY rt.session_date DESC, rt.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function to get user's best times per track
-- ============================================================================
CREATE OR REPLACE FUNCTION get_user_best_times(
  p_user_id UUID,
  p_car_slug TEXT DEFAULT NULL
)
RETURNS TABLE (
  track_name TEXT,
  best_time_seconds DECIMAL,
  best_time_date DATE,
  total_sessions INTEGER,
  total_improvement DECIMAL,
  car_slug TEXT,
  car_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    utt.track_name,
    MIN(utt.lap_time_seconds) as best_time_seconds,
    (SELECT session_date FROM user_track_times 
     WHERE user_id = p_user_id 
       AND track_name = utt.track_name 
       AND (p_car_slug IS NULL OR car_slug = p_car_slug)
     ORDER BY lap_time_seconds LIMIT 1) as best_time_date,
    COUNT(*)::INTEGER as total_sessions,
    MAX(utt.lap_time_seconds) - MIN(utt.lap_time_seconds) as total_improvement,
    utt.car_slug,
    c.name as car_name
  FROM user_track_times utt
  LEFT JOIN cars c ON c.slug = utt.car_slug
  WHERE utt.user_id = p_user_id
    AND (p_car_slug IS NULL OR utt.car_slug = p_car_slug)
  GROUP BY utt.track_name, utt.car_slug, c.name
  ORDER BY total_sessions DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function for AL to analyze track times and generate insights
-- ============================================================================
CREATE OR REPLACE FUNCTION analyze_track_times_for_al(
  p_user_id UUID,
  p_car_slug TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  track_data JSONB;
  progress_data JSONB;
  skill_assessment JSONB;
BEGIN
  -- Get summary stats
  SELECT jsonb_build_object(
    'total_sessions', COUNT(*),
    'unique_tracks', COUNT(DISTINCT track_name),
    'total_improvement_seconds', SUM(
      CASE WHEN improvement > 0 THEN improvement ELSE 0 END
    ),
    'average_session_gap_days', AVG(session_gap)
  ) INTO track_data
  FROM (
    SELECT 
      track_name,
      lap_time_seconds,
      LAG(lap_time_seconds) OVER (PARTITION BY track_name ORDER BY session_date) - lap_time_seconds as improvement,
      session_date - LAG(session_date) OVER (PARTITION BY track_name ORDER BY session_date) as session_gap
    FROM user_track_times
    WHERE user_id = p_user_id
      AND (p_car_slug IS NULL OR car_slug = p_car_slug)
  ) sub;
  
  -- Get per-track progress
  SELECT jsonb_agg(
    jsonb_build_object(
      'track', track_name,
      'sessions', sessions,
      'best_time', best_time,
      'first_time', first_time,
      'improvement', first_time - best_time,
      'improvement_pct', ROUND(((first_time - best_time) / first_time * 100)::numeric, 1)
    )
  ) INTO progress_data
  FROM (
    SELECT 
      track_name,
      COUNT(*) as sessions,
      MIN(lap_time_seconds) as best_time,
      (SELECT lap_time_seconds FROM user_track_times u2 
       WHERE u2.user_id = p_user_id AND u2.track_name = utt.track_name
       ORDER BY session_date LIMIT 1) as first_time
    FROM user_track_times utt
    WHERE user_id = p_user_id
      AND (p_car_slug IS NULL OR car_slug = p_car_slug)
    GROUP BY track_name
    HAVING COUNT(*) >= 2
  ) sub;
  
  -- Compile result
  result := jsonb_build_object(
    'summary', track_data,
    'track_progress', COALESCE(progress_data, '[]'::jsonb),
    'generated_at', NOW()
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE user_track_times IS 'Stores user-logged lap times from track days, enabling AL analysis and progress tracking';
