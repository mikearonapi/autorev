-- ============================================================================
-- OWNER DASHBOARD ENHANCEMENTS
-- AutoRev - Extended Vehicle Data & User Preferences
--
-- This migration adds:
--   1. Extended VIN decode data fields to user_vehicles
--   2. Safety data cache (recalls, complaints)
--   3. User maintenance preference overrides
--   4. Recall tracking for owned vehicles
-- ============================================================================

-- ============================================================================
-- EXTEND USER_VEHICLES TABLE
-- Add fields for comprehensive VIN decode data
-- ============================================================================

-- Add NHTSA safety data columns
ALTER TABLE user_vehicles 
ADD COLUMN IF NOT EXISTS nhtsa_recall_data JSONB,
ADD COLUMN IF NOT EXISTS nhtsa_recalls_last_checked TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS safety_rating_overall INTEGER,
ADD COLUMN IF NOT EXISTS safety_data JSONB;

-- Add extended vehicle details from VIN decode
ALTER TABLE user_vehicles
ADD COLUMN IF NOT EXISTS engine_type TEXT,
ADD COLUMN IF NOT EXISTS engine_displacement TEXT,
ADD COLUMN IF NOT EXISTS engine_cylinders INTEGER,
ADD COLUMN IF NOT EXISTS engine_hp INTEGER,
ADD COLUMN IF NOT EXISTS transmission_type TEXT,
ADD COLUMN IF NOT EXISTS transmission_speeds INTEGER,
ADD COLUMN IF NOT EXISTS body_style TEXT,
ADD COLUMN IF NOT EXISTS drive_type TEXT,
ADD COLUMN IF NOT EXISTS fuel_type TEXT,
ADD COLUMN IF NOT EXISTS plant_city TEXT,
ADD COLUMN IF NOT EXISTS plant_country TEXT,
ADD COLUMN IF NOT EXISTS gross_vehicle_weight_rating TEXT;

-- Add user preference fields
ALTER TABLE user_vehicles
ADD COLUMN IF NOT EXISTS current_mileage INTEGER,
ADD COLUMN IF NOT EXISTS last_mileage_update TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sold_date DATE,
ADD COLUMN IF NOT EXISTS sold_price INTEGER;

-- ============================================================================
-- USER MAINTENANCE PREFERENCES TABLE
-- Allow users to override default maintenance specs with their preferences
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_maintenance_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_vehicle_id UUID NOT NULL,
  user_id UUID NOT NULL,
  
  -- Oil preferences
  preferred_oil_brand TEXT,
  preferred_oil_weight TEXT,
  oil_change_interval_miles INTEGER,
  oil_change_interval_months INTEGER,
  
  -- Tire preferences
  preferred_tire_brand TEXT,
  preferred_tire_model TEXT,
  tire_pressure_front INTEGER,
  tire_pressure_rear INTEGER,
  
  -- Fuel preferences
  preferred_fuel_octane INTEGER,
  uses_e85 BOOLEAN DEFAULT false,
  
  -- Service preferences
  preferred_shop_name TEXT,
  preferred_shop_type TEXT CHECK (preferred_shop_type IN ('dealer', 'independent', 'self')),
  
  -- Notification preferences
  notify_oil_change BOOLEAN DEFAULT true,
  notify_tire_rotation BOOLEAN DEFAULT true,
  notify_brake_service BOOLEAN DEFAULT true,
  notify_major_service BOOLEAN DEFAULT true,
  
  -- Custom notes
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_vehicle_id),
  
  CONSTRAINT fk_maint_prefs_vehicle FOREIGN KEY (user_vehicle_id) 
    REFERENCES user_vehicles(id) ON DELETE CASCADE,
  CONSTRAINT fk_maint_prefs_user FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_maint_prefs_vehicle ON user_maintenance_preferences(user_vehicle_id);

-- Enable RLS
ALTER TABLE user_maintenance_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own maintenance prefs" ON user_maintenance_preferences;
CREATE POLICY "Users can view own maintenance prefs" ON user_maintenance_preferences
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own maintenance prefs" ON user_maintenance_preferences;
CREATE POLICY "Users can insert own maintenance prefs" ON user_maintenance_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own maintenance prefs" ON user_maintenance_preferences;
CREATE POLICY "Users can update own maintenance prefs" ON user_maintenance_preferences
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own maintenance prefs" ON user_maintenance_preferences;
CREATE POLICY "Users can delete own maintenance prefs" ON user_maintenance_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- USER RECALL TRACKING TABLE
-- Track completion status of recalls for user's vehicles
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_recall_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_vehicle_id UUID NOT NULL,
  user_id UUID NOT NULL,
  
  -- Recall identification
  nhtsa_campaign_number TEXT NOT NULL,
  recall_title TEXT,
  recall_component TEXT,
  recall_summary TEXT,
  
  -- Status tracking
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'scheduled', 'completed', 'not_applicable')),
  completion_date DATE,
  completion_mileage INTEGER,
  completion_notes TEXT,
  
  -- Where serviced
  service_location TEXT,
  
  -- Notification
  last_notified_at TIMESTAMPTZ,
  dismissed BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_vehicle_id, nhtsa_campaign_number),
  
  CONSTRAINT fk_recall_tracking_vehicle FOREIGN KEY (user_vehicle_id) 
    REFERENCES user_vehicles(id) ON DELETE CASCADE,
  CONSTRAINT fk_recall_tracking_user FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_recall_tracking_vehicle ON user_recall_tracking(user_vehicle_id);
CREATE INDEX IF NOT EXISTS idx_user_recall_tracking_status ON user_recall_tracking(status);

-- Enable RLS
ALTER TABLE user_recall_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own recall tracking" ON user_recall_tracking;
CREATE POLICY "Users can view own recall tracking" ON user_recall_tracking
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own recall tracking" ON user_recall_tracking;
CREATE POLICY "Users can insert own recall tracking" ON user_recall_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own recall tracking" ON user_recall_tracking;
CREATE POLICY "Users can update own recall tracking" ON user_recall_tracking
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own recall tracking" ON user_recall_tracking;
CREATE POLICY "Users can delete own recall tracking" ON user_recall_tracking
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- SERVICE LOG ENHANCEMENTS
-- Add more fields to user_service_logs for comprehensive tracking
-- ============================================================================

ALTER TABLE user_service_logs
ADD COLUMN IF NOT EXISTS service_category TEXT CHECK (service_category IN (
  'oil_change', 'tire', 'brake', 'fluid', 'filter', 'electrical', 
  'engine', 'transmission', 'suspension', 'body', 'interior', 'other'
)),
ADD COLUMN IF NOT EXISTS is_scheduled_maintenance BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS linked_interval_id UUID,
ADD COLUMN IF NOT EXISTS warranty_covered BOOLEAN DEFAULT false;

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS update_user_maint_prefs_timestamp ON user_maintenance_preferences;
CREATE TRIGGER update_user_maint_prefs_timestamp
  BEFORE UPDATE ON user_maintenance_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_recall_tracking_timestamp ON user_recall_tracking;
CREATE TRIGGER update_user_recall_tracking_timestamp
  BEFORE UPDATE ON user_recall_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTION: Get upcoming service reminders
-- ============================================================================

CREATE OR REPLACE FUNCTION get_upcoming_service_reminders(
  p_user_id UUID,
  p_days_ahead INTEGER DEFAULT 30
)
RETURNS TABLE (
  vehicle_id UUID,
  vehicle_name TEXT,
  service_type TEXT,
  due_date DATE,
  due_mileage INTEGER,
  current_mileage INTEGER,
  is_overdue BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id AS vehicle_id,
    COALESCE(v.nickname, v.year::TEXT || ' ' || v.make || ' ' || v.model) AS vehicle_name,
    sl.service_type,
    sl.next_service_date AS due_date,
    sl.next_service_miles AS due_mileage,
    v.current_mileage,
    (sl.next_service_date < CURRENT_DATE OR 
     (v.current_mileage IS NOT NULL AND sl.next_service_miles IS NOT NULL AND 
      v.current_mileage > sl.next_service_miles)) AS is_overdue
  FROM user_vehicles v
  JOIN user_service_logs sl ON sl.user_vehicle_id = v.id
  WHERE v.user_id = p_user_id
    AND v.ownership_status = 'owned'
    AND (
      sl.next_service_date IS NOT NULL AND 
      sl.next_service_date <= CURRENT_DATE + p_days_ahead
    )
  ORDER BY is_overdue DESC, sl.next_service_date ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE user_maintenance_preferences IS 'User overrides for default maintenance specs on their vehicles';
COMMENT ON TABLE user_recall_tracking IS 'Track completion status of NHTSA recalls for user vehicles';
COMMENT ON FUNCTION get_upcoming_service_reminders IS 'Returns upcoming and overdue service reminders for a user';










