-- Migration: Part Manufacturers Registry
-- Purpose: Authoritative registry of actual part manufacturers (not retailers)
-- This enables proper brand attribution and linking to manufacturer websites

-- ============================================================================
-- TABLE: part_manufacturers
-- ============================================================================

CREATE TABLE IF NOT EXISTS part_manufacturers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Manufacturer identity
  name TEXT NOT NULL UNIQUE,              -- "APR", "Borla", "HKS"
  name_normalized TEXT GENERATED ALWAYS AS (LOWER(TRIM(name))) STORED,
  
  -- Contact/website info
  website TEXT,                           -- "https://goapr.com"
  logo_url TEXT,
  
  -- Business info
  country TEXT,                           -- Country of origin/headquarters
  founded_year INTEGER,                   -- When company was founded
  
  -- Sales model
  sells_direct BOOLEAN DEFAULT false,     -- Does manufacturer sell direct to consumers?
  authorized_dealers TEXT[],              -- Known authorized dealer names
  
  -- Categorization
  specialties TEXT[],                     -- What they're known for: ["exhaust", "tune", "intake"]
  quality_tier TEXT CHECK (quality_tier IN ('budget', 'mid', 'premium', 'ultra-premium')),
  
  -- Notes and metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Fast lookups by normalized name (case-insensitive matching)
CREATE INDEX IF NOT EXISTS idx_part_manufacturers_name_normalized 
  ON part_manufacturers(name_normalized);

-- Search by specialty
CREATE INDEX IF NOT EXISTS idx_part_manufacturers_specialties 
  ON part_manufacturers USING GIN(specialties);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE TRIGGER set_part_manufacturers_updated_at
  BEFORE UPDATE ON part_manufacturers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE part_manufacturers ENABLE ROW LEVEL SECURITY;

-- Everyone can read manufacturers (public reference data)
CREATE POLICY "part_manufacturers_select_all"
  ON part_manufacturers
  FOR SELECT
  USING (true);

-- Only service role can modify
CREATE POLICY "part_manufacturers_insert_service"
  ON part_manufacturers
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "part_manufacturers_update_service"
  ON part_manufacturers
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "part_manufacturers_delete_service"
  ON part_manufacturers
  FOR DELETE
  USING (auth.role() = 'service_role');

-- ============================================================================
-- SEED DATA: Known manufacturers
-- ============================================================================

INSERT INTO part_manufacturers (name, website, country, sells_direct, specialties, quality_tier, notes) VALUES

-- =========== VAG Specialists (Audi/VW) ===========
('APR', 'https://goapr.com', 'USA', false, ARRAY['tune', 'exhaust', 'intake', 'turbo'], 'premium', 'Leading VAG tuner, sells through authorized dealers'),
('Unitronic', 'https://getunitronic.com', 'Canada', false, ARRAY['tune', 'intake', 'intercooler'], 'premium', 'VAG ECU/TCU specialists'),
('034 Motorsport', 'https://034motorsport.com', 'USA', true, ARRAY['suspension', 'intake', 'drivetrain'], 'premium', 'Audi performance specialists'),
('Integrated Engineering', 'https://performancebyie.com', 'USA', true, ARRAY['intake', 'intercooler', 'turbo'], 'premium', 'VAG intake and turbo specialists'),
('EQT', 'https://eqtuning.com', 'USA', true, ARRAY['tune', 'turbo', 'fuel'], 'premium', 'MQB platform specialists'),
('CTS Turbo', 'https://ctsturbo.com', 'USA', true, ARRAY['turbo', 'intake', 'intercooler'], 'mid', 'VAG turbo and intake systems'),

-- =========== Exhaust Manufacturers ===========
('Borla', 'https://borla.com', 'USA', true, ARRAY['exhaust'], 'premium', 'Premium stainless steel exhausts, million-mile warranty'),
('MagnaFlow', 'https://magnaflow.com', 'USA', true, ARRAY['exhaust'], 'mid', 'Performance exhaust systems'),
('Akrapovic', 'https://akrapovic.com', 'Slovenia', false, ARRAY['exhaust'], 'ultra-premium', 'Titanium and carbon fiber exhausts'),
('Milltek', 'https://millteksport.com', 'UK', false, ARRAY['exhaust'], 'premium', 'European exhaust specialists'),
('AWE Tuning', 'https://awe-tuning.com', 'USA', true, ARRAY['exhaust', 'intake'], 'premium', 'Performance exhaust and intake'),
('Corsa', 'https://corsaperformance.com', 'USA', true, ARRAY['exhaust'], 'premium', 'Active exhaust systems'),
('Invidia', 'https://invidia-exhausts.com', 'Japan', false, ARRAY['exhaust'], 'mid', 'Japanese exhaust manufacturer'),
('Tomei', 'https://tomeiusa.com', 'Japan', false, ARRAY['exhaust', 'engine'], 'premium', 'Japanese performance parts'),
('HKS', 'https://hks-power.co.jp', 'Japan', false, ARRAY['exhaust', 'turbo', 'tune'], 'premium', 'Japanese tuning legend'),
('GReddy', 'https://greddy.com', 'Japan', false, ARRAY['exhaust', 'turbo', 'tune'], 'premium', 'Trust/GReddy performance'),
('Capristo', 'https://capristo.com', 'Germany', false, ARRAY['exhaust'], 'ultra-premium', 'Exotic car exhaust specialist'),

-- =========== Intake Manufacturers ===========
('K&N', 'https://knfilters.com', 'USA', true, ARRAY['intake', 'filters'], 'mid', 'Air filters and intake systems'),
('aFe Power', 'https://afepower.com', 'USA', true, ARRAY['intake', 'exhaust'], 'mid', 'Intake and exhaust systems'),
('Injen', 'https://injen.com', 'USA', true, ARRAY['intake'], 'mid', 'Cold air intake specialists'),

-- =========== Suspension Manufacturers ===========
('KW', 'https://kwsuspensions.com', 'Germany', false, ARRAY['suspension'], 'premium', 'German coilover manufacturer'),
('Bilstein', 'https://bilstein.com', 'Germany', false, ARRAY['suspension'], 'premium', 'OEM and aftermarket shocks'),
('Ohlins', 'https://ohlins.com', 'Sweden', false, ARRAY['suspension'], 'ultra-premium', 'Racing suspension'),
('BC Racing', 'https://bcracing.com', 'Taiwan', true, ARRAY['suspension'], 'mid', 'Affordable coilovers'),
('Fortune Auto', 'https://fortune-auto.com', 'USA', true, ARRAY['suspension'], 'premium', 'High-end coilovers'),
('H&R', 'https://hrsprings.com', 'Germany', false, ARRAY['suspension', 'wheels'], 'premium', 'Springs and spacers'),
('Eibach', 'https://eibach.com', 'Germany', false, ARRAY['suspension'], 'premium', 'Performance springs'),
('Whiteline', 'https://whiteline.com.au', 'Australia', false, ARRAY['suspension'], 'mid', 'Sway bars and bushings'),

-- =========== Brake Manufacturers ===========
('Brembo', 'https://brembo.com', 'Italy', false, ARRAY['brakes'], 'ultra-premium', 'OEM and aftermarket brakes'),
('StopTech', 'https://stoptech.com', 'USA', false, ARRAY['brakes'], 'premium', 'Big brake kits'),
('AP Racing', 'https://apracing.com', 'UK', false, ARRAY['brakes'], 'ultra-premium', 'Racing brakes'),
('Hawk', 'https://hawkperformance.com', 'USA', true, ARRAY['brakes'], 'mid', 'Performance brake pads'),
('EBC', 'https://ebcbrakes.com', 'UK', true, ARRAY['brakes'], 'mid', 'Brake pads and rotors'),
('Wilwood', 'https://wilwood.com', 'USA', true, ARRAY['brakes'], 'premium', 'Racing and street brakes'),

-- =========== Turbo/Supercharger ===========
('Garrett', 'https://garrettmotion.com', 'USA', false, ARRAY['turbo'], 'premium', 'OEM and aftermarket turbos'),
('BorgWarner', 'https://borgwarner.com', 'USA', false, ARRAY['turbo'], 'premium', 'OEM turbocharger supplier'),
('Precision Turbo', 'https://precisionturbo.net', 'USA', true, ARRAY['turbo'], 'premium', 'Aftermarket turbo specialists'),
('Vortech', 'https://vortech.com', 'USA', true, ARRAY['supercharger'], 'premium', 'Centrifugal superchargers'),
('Whipple', 'https://whipplesuperchargers.com', 'USA', true, ARRAY['supercharger'], 'premium', 'Twin-screw superchargers'),
('Roush', 'https://roushperformance.com', 'USA', true, ARRAY['supercharger', 'exhaust'], 'premium', 'Ford performance specialists'),

-- =========== ECU/Tuning ===========
('Cobb Tuning', 'https://cobbtuning.com', 'USA', true, ARRAY['tune', 'intake', 'exhaust'], 'premium', 'Accessport and tuning'),
('Hondata', 'https://hondata.com', 'USA', true, ARRAY['tune'], 'premium', 'Honda ECU tuning'),
('HP Tuners', 'https://hptuners.com', 'USA', true, ARRAY['tune'], 'mid', 'GM/Ford/Mopar tuning'),
('DiabloSport', 'https://diablosport.com', 'USA', true, ARRAY['tune'], 'mid', 'Handheld tuners'),
('Dinan', 'https://dinan.com', 'USA', false, ARRAY['tune', 'suspension', 'exhaust'], 'premium', 'BMW specialists'),

-- =========== Wheels ===========
('BBS', 'https://bbs.com', 'Germany', false, ARRAY['wheels'], 'ultra-premium', 'Forged wheels'),
('Enkei', 'https://enkei.com', 'Japan', false, ARRAY['wheels'], 'mid', 'OEM and aftermarket wheels'),
('Rays', 'https://rayswheels.co.jp', 'Japan', false, ARRAY['wheels'], 'premium', 'Volk Racing wheels'),
('Apex', 'https://apexraceparts.com', 'USA', true, ARRAY['wheels'], 'premium', 'Flow-formed wheels'),
('HRE', 'https://hrewheels.com', 'USA', true, ARRAY['wheels'], 'ultra-premium', 'Forged wheels'),

-- =========== Honda/Acura Specialists ===========
('Skunk2', 'https://skunk2.com', 'USA', true, ARRAY['intake', 'exhaust', 'suspension'], 'mid', 'Honda performance parts'),
('Spoon Sports', 'https://spoon.jp', 'Japan', false, ARRAY['engine', 'brakes', 'suspension'], 'premium', 'Honda tuning legend'),
('Mugen', 'https://mugen-power.com', 'Japan', false, ARRAY['exhaust', 'aero', 'engine'], 'premium', 'Official Honda tuner'),
('PRL Motorsports', 'https://prlmotorsports.com', 'USA', true, ARRAY['intake', 'intercooler', 'exhaust'], 'premium', 'Civic Type R specialists'),
('Hondata', 'https://hondata.com', 'USA', true, ARRAY['tune'], 'premium', 'Honda ECU specialists'),

-- =========== Subaru/Toyota Specialists ===========
('Perrin', 'https://perrin.com', 'USA', true, ARRAY['intake', 'exhaust', 'suspension'], 'mid', 'Subaru performance parts'),
('GrimmSpeed', 'https://grimmspeed.com', 'USA', true, ARRAY['intake', 'exhaust', 'boost'], 'mid', 'Subaru specialists'),
('IAG Performance', 'https://iagperformance.com', 'USA', true, ARRAY['engine', 'fuel'], 'premium', 'Subaru engine builders'),
('Crawford Performance', 'https://crawfordperformance.com', 'USA', true, ARRAY['turbo', 'engine'], 'premium', 'Subaru turbo specialists'),

-- =========== Domestic (Ford/GM/Mopar) ===========
('Ford Performance', 'https://performanceparts.ford.com', 'USA', false, ARRAY['engine', 'suspension', 'exhaust'], 'premium', 'Official Ford parts'),
('Chevrolet Performance', 'https://chevrolet.com/performance', 'USA', false, ARRAY['engine', 'suspension'], 'premium', 'Official GM parts'),
('Mopar', 'https://mopar.com', 'USA', false, ARRAY['engine', 'suspension'], 'premium', 'Official Stellantis parts')

ON CONFLICT (name) DO UPDATE SET
  website = EXCLUDED.website,
  country = EXCLUDED.country,
  sells_direct = EXCLUDED.sells_direct,
  specialties = EXCLUDED.specialties,
  quality_tier = EXCLUDED.quality_tier,
  notes = EXCLUDED.notes,
  updated_at = now();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE part_manufacturers IS 
  'Authoritative registry of actual part manufacturers (not retailers). Used for proper brand attribution.';

COMMENT ON COLUMN part_manufacturers.sells_direct IS 
  'Whether manufacturer sells directly to consumers (vs dealer-only like APR)';

COMMENT ON COLUMN part_manufacturers.authorized_dealers IS 
  'List of known authorized dealer names for this manufacturer';

COMMENT ON COLUMN part_manufacturers.specialties IS 
  'Part categories this manufacturer is known for (exhaust, tune, intake, etc.)';
