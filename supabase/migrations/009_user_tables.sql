-- ============================================================================
-- USER TABLES MIGRATION
-- AutoRev - User Account & Garage Features
-- 
-- This migration adds tables for:
--   1. user_profiles - Extended user profile info
--   2. user_favorites - Saved favorite cars
--   3. user_saved_builds - Performance HUB configurations
--   4. user_compare_lists - Comparison sets
--   5. user_vehicles - User's owned vehicles (VIN support)
--   6. user_activity - Engagement & analytics tracking
--
-- Run this AFTER enabling Supabase Auth in your project
-- ============================================================================

-- ============================================================================
-- USER PROFILES TABLE
-- Extended user profile data beyond what Supabase auth.users provides
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Display info
  display_name TEXT,
  avatar_url TEXT,
  
  -- Preferences
  preferred_units TEXT DEFAULT 'imperial' CHECK (preferred_units IN ('imperial', 'metric')),
  email_notifications BOOLEAN DEFAULT true,
  
  -- Engagement stats (denormalized for quick access)
  cars_viewed_count INTEGER DEFAULT 0,
  comparisons_made_count INTEGER DEFAULT 0,
  builds_saved_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update timestamp trigger
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- USER FAVORITES TABLE
-- Cars users have favorited for quick access
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Car reference
  car_slug TEXT NOT NULL,
  
  -- Snapshot of car data at time of favoriting (for display even if car removed)
  car_name TEXT NOT NULL,
  car_years TEXT,
  car_hp INTEGER,
  car_price_range TEXT,
  
  -- User notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Each user can only favorite a car once
  UNIQUE (user_id, car_slug)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_car_slug ON user_favorites(car_slug);
CREATE INDEX IF NOT EXISTS idx_user_favorites_created_at ON user_favorites(created_at DESC);

-- ============================================================================
-- USER SAVED BUILDS TABLE
-- Performance HUB configurations saved by users
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_saved_builds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Car reference
  car_slug TEXT NOT NULL,
  car_name TEXT NOT NULL,
  
  -- Build configuration
  build_name TEXT NOT NULL DEFAULT 'Untitled Build',
  selected_upgrades JSONB NOT NULL DEFAULT '[]'::jsonb,  -- Array of upgrade keys
  
  -- Calculated totals (cached for display)
  total_hp_gain INTEGER DEFAULT 0,
  total_cost_low INTEGER DEFAULT 0,
  total_cost_high INTEGER DEFAULT 0,
  final_hp INTEGER,  -- Stock HP + gains
  
  -- User notes
  notes TEXT,
  is_favorite BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_saved_builds_user_id ON user_saved_builds(user_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_builds_car_slug ON user_saved_builds(car_slug);
CREATE INDEX IF NOT EXISTS idx_user_saved_builds_created_at ON user_saved_builds(created_at DESC);

-- Auto-update timestamp trigger
DROP TRIGGER IF EXISTS update_user_saved_builds_updated_at ON user_saved_builds;
CREATE TRIGGER update_user_saved_builds_updated_at
  BEFORE UPDATE ON user_saved_builds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- USER COMPARE LISTS TABLE
-- Saved comparison sets for side-by-side analysis
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_compare_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- List details
  name TEXT DEFAULT 'My Comparison',
  car_slugs JSONB NOT NULL DEFAULT '[]'::jsonb,  -- Array of car slugs (max 4)
  
  -- Snapshot of car names (for display)
  car_names JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_compare_lists_user_id ON user_compare_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_user_compare_lists_created_at ON user_compare_lists(created_at DESC);

-- Auto-update timestamp trigger
DROP TRIGGER IF EXISTS update_user_compare_lists_updated_at ON user_compare_lists;
CREATE TRIGGER update_user_compare_lists_updated_at
  BEFORE UPDATE ON user_compare_lists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- USER VEHICLES TABLE
-- User's owned vehicles with VIN support
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- VIN (optional but valuable)
  vin TEXT,
  
  -- Vehicle identification
  year INTEGER NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  trim TEXT,
  
  -- Match to our database (if applicable)
  matched_car_slug TEXT,  -- Link to cars table if we have this vehicle
  
  -- User customization
  nickname TEXT,  -- e.g., "Project Daily", "Track Toy"
  color TEXT,
  
  -- Ownership details
  mileage INTEGER,
  purchase_date DATE,
  purchase_price INTEGER,
  
  -- Status
  is_primary BOOLEAN DEFAULT false,  -- User's main car
  ownership_status TEXT DEFAULT 'owned' CHECK (ownership_status IN ('owned', 'sold', 'shopping')),
  
  -- Notes
  notes TEXT,
  
  -- VIN decode cache (to avoid repeated API calls)
  vin_decode_data JSONB,
  vin_decoded_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_vehicles_user_id ON user_vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_vehicles_vin ON user_vehicles(vin);
CREATE INDEX IF NOT EXISTS idx_user_vehicles_matched_car_slug ON user_vehicles(matched_car_slug);

-- Auto-update timestamp trigger
DROP TRIGGER IF EXISTS update_user_vehicles_updated_at ON user_vehicles;
CREATE TRIGGER update_user_vehicles_updated_at
  BEFORE UPDATE ON user_vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- USER ACTIVITY TABLE
-- Engagement tracking for analytics and "fun" metrics
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- User reference (nullable for anonymous tracking)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,  -- For anonymous session tracking
  
  -- Event details
  event_type TEXT NOT NULL CHECK (event_type IN (
    'car_viewed',
    'car_favorited',
    'car_unfavorited',
    'comparison_started',
    'comparison_completed',
    'build_started',
    'build_saved',
    'build_deleted',
    'vehicle_added',
    'ai_mechanic_used',
    'search_performed',
    'filter_applied'
  )),
  
  -- Event context (flexible JSONB)
  event_data JSONB DEFAULT '{}'::jsonb,
  -- Examples:
  -- car_viewed: { car_slug: '718-cayman-gt4', source: 'search' }
  -- comparison_completed: { car_slugs: ['car1', 'car2'], duration_seconds: 120 }
  -- build_saved: { car_slug: 'bmw-m3', total_cost: 15000, hp_gain: 75 }
  
  -- Client info
  user_agent TEXT,
  ip_address INET,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_session_id ON user_activity(session_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_event_type ON user_activity(event_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity(created_at DESC);

-- Composite index for user engagement queries
CREATE INDEX IF NOT EXISTS idx_user_activity_user_event ON user_activity(user_id, event_type);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) FOR USER TABLES
-- Users can only access their own data
-- ============================================================================

-- Enable RLS on all user tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_builds ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_compare_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- USER_PROFILES: Users can only see and modify their own profile
DROP POLICY IF EXISTS "user_profiles_select_own" ON user_profiles;
CREATE POLICY "user_profiles_select_own"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "user_profiles_insert_own" ON user_profiles;
CREATE POLICY "user_profiles_insert_own"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "user_profiles_update_own" ON user_profiles;
CREATE POLICY "user_profiles_update_own"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "user_profiles_delete_own" ON user_profiles;
CREATE POLICY "user_profiles_delete_own"
  ON user_profiles FOR DELETE
  USING (auth.uid() = id);

-- USER_FAVORITES: Users can only access their own favorites
DROP POLICY IF EXISTS "user_favorites_select_own" ON user_favorites;
CREATE POLICY "user_favorites_select_own"
  ON user_favorites FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_favorites_insert_own" ON user_favorites;
CREATE POLICY "user_favorites_insert_own"
  ON user_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_favorites_delete_own" ON user_favorites;
CREATE POLICY "user_favorites_delete_own"
  ON user_favorites FOR DELETE
  USING (auth.uid() = user_id);

-- USER_SAVED_BUILDS: Users can only access their own builds
DROP POLICY IF EXISTS "user_saved_builds_select_own" ON user_saved_builds;
CREATE POLICY "user_saved_builds_select_own"
  ON user_saved_builds FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_saved_builds_insert_own" ON user_saved_builds;
CREATE POLICY "user_saved_builds_insert_own"
  ON user_saved_builds FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_saved_builds_update_own" ON user_saved_builds;
CREATE POLICY "user_saved_builds_update_own"
  ON user_saved_builds FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_saved_builds_delete_own" ON user_saved_builds;
CREATE POLICY "user_saved_builds_delete_own"
  ON user_saved_builds FOR DELETE
  USING (auth.uid() = user_id);

-- USER_COMPARE_LISTS: Users can only access their own lists
DROP POLICY IF EXISTS "user_compare_lists_select_own" ON user_compare_lists;
CREATE POLICY "user_compare_lists_select_own"
  ON user_compare_lists FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_compare_lists_insert_own" ON user_compare_lists;
CREATE POLICY "user_compare_lists_insert_own"
  ON user_compare_lists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_compare_lists_update_own" ON user_compare_lists;
CREATE POLICY "user_compare_lists_update_own"
  ON user_compare_lists FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_compare_lists_delete_own" ON user_compare_lists;
CREATE POLICY "user_compare_lists_delete_own"
  ON user_compare_lists FOR DELETE
  USING (auth.uid() = user_id);

-- USER_VEHICLES: Users can only access their own vehicles
DROP POLICY IF EXISTS "user_vehicles_select_own" ON user_vehicles;
CREATE POLICY "user_vehicles_select_own"
  ON user_vehicles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_vehicles_insert_own" ON user_vehicles;
CREATE POLICY "user_vehicles_insert_own"
  ON user_vehicles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_vehicles_update_own" ON user_vehicles;
CREATE POLICY "user_vehicles_update_own"
  ON user_vehicles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_vehicles_delete_own" ON user_vehicles;
CREATE POLICY "user_vehicles_delete_own"
  ON user_vehicles FOR DELETE
  USING (auth.uid() = user_id);

-- USER_ACTIVITY: Users can see their own activity, insert for authenticated or anonymous
DROP POLICY IF EXISTS "user_activity_select_own" ON user_activity;
CREATE POLICY "user_activity_select_own"
  ON user_activity FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_activity_insert_any" ON user_activity;
CREATE POLICY "user_activity_insert_any"
  ON user_activity FOR INSERT
  WITH CHECK (true);  -- Allow both authenticated and anonymous tracking

-- ============================================================================
-- FUNCTION: Create user profile on signup
-- Automatically creates a user_profiles row when a new user signs up
-- ============================================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- TABLE COMMENTS
-- ============================================================================
COMMENT ON TABLE user_profiles IS 'Extended user profile data. Created automatically on signup via trigger.';
COMMENT ON TABLE user_favorites IS 'Cars favorited by users. Stores snapshot of car data for persistence.';
COMMENT ON TABLE user_saved_builds IS 'Performance HUB build configurations saved by users.';
COMMENT ON TABLE user_compare_lists IS 'Saved comparison sets for side-by-side vehicle analysis.';
COMMENT ON TABLE user_vehicles IS 'Vehicles owned by users, with optional VIN decode data.';
COMMENT ON TABLE user_activity IS 'Engagement tracking for analytics and fun user stats.';

COMMENT ON COLUMN user_vehicles.vin IS 'Vehicle Identification Number - used for NHTSA decode API.';
COMMENT ON COLUMN user_vehicles.matched_car_slug IS 'Link to cars table if vehicle matches our database.';
COMMENT ON COLUMN user_activity.session_id IS 'For anonymous tracking before user creates account.';
