-- ============================================================================
-- Migration 028: Parts Catalog + Fitment + Upgrade Graph (AI-AL foundations)
--
-- Purpose:
-- - Move beyond generic "upgrade advice" into REAL, compatible build planning.
-- - Store a normalized parts catalog with fitment (car_id / car_variant_id),
--   pricing snapshots, and relationships (requires/conflicts/alternatives).
-- - Provide a bridge between conceptual upgrades ("intake", "coilovers") and
--   actual parts, enabling accurate recommendations and fewer hallucinations.
--
-- Design principles:
-- - Additive (non-breaking)
-- - car_id + car_variant_id first, keep flexible JSONB for edge cases
-- - Public read, service-role write (ingestion/admin only)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUMS
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE part_category AS ENUM (
    'intake',
    'exhaust',
    'tune',
    'forced_induction',
    'cooling',
    'suspension',
    'brakes',
    'wheels_tires',
    'aero',
    'drivetrain',
    'fuel_system',
    'engine_internal',
    'electronics',
    'fluids_filters',
    'maintenance',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE part_relation_type AS ENUM (
    'requires',
    'conflicts_with',
    'recommended_with',
    'alternative_to'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE upgrade_key_category AS ENUM (
    'power_engine',
    'exhaust_sound',
    'electronics_tuning',
    'suspension_handling',
    'brakes',
    'wheels_tires',
    'cooling',
    'aero',
    'drivetrain',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- PART BRANDS
-- ============================================================================
CREATE TABLE IF NOT EXISTS part_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  website TEXT,
  country TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_part_brands_updated_at ON part_brands;
CREATE TRIGGER update_part_brands_updated_at
  BEFORE UPDATE ON part_brands
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE part_brands ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "part_brands_select_public" ON part_brands;
CREATE POLICY "part_brands_select_public"
  ON part_brands FOR SELECT
  TO public
  USING (true);

-- ============================================================================
-- PARTS CATALOG
-- ============================================================================
CREATE TABLE IF NOT EXISTS parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  brand_id UUID REFERENCES part_brands(id) ON DELETE SET NULL,
  brand_name TEXT, -- denormalized convenience

  name TEXT NOT NULL,
  part_number TEXT,
  category part_category NOT NULL DEFAULT 'other',
  description TEXT,

  -- Metadata + specs (dimensions, materials, etc.)
  attributes JSONB DEFAULT '{}'::jsonb,

  -- Quality + positioning
  quality_tier TEXT DEFAULT 'standard' CHECK (quality_tier IN ('premium', 'standard', 'budget', 'oem', 'unknown')),
  street_legal BOOLEAN,
  emissions_legal_notes TEXT,

  -- Provenance
  source_urls TEXT[] DEFAULT '{}',
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),

  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT ux_parts_brand_part_number UNIQUE (brand_name, part_number)
);

CREATE INDEX IF NOT EXISTS idx_parts_brand_id ON parts(brand_id);
CREATE INDEX IF NOT EXISTS idx_parts_category ON parts(category);
CREATE INDEX IF NOT EXISTS idx_parts_part_number ON parts(part_number);
CREATE INDEX IF NOT EXISTS idx_parts_attributes ON parts USING GIN(attributes);

DROP TRIGGER IF EXISTS update_parts_updated_at ON parts;
CREATE TRIGGER update_parts_updated_at
  BEFORE UPDATE ON parts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "parts_select_public" ON parts;
CREATE POLICY "parts_select_public"
  ON parts FOR SELECT
  TO public
  USING (is_active = true);

-- ============================================================================
-- PART FITMENT (car_id + optional car_variant_id)
-- ============================================================================
CREATE TABLE IF NOT EXISTS part_fitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  part_id UUID NOT NULL REFERENCES parts(id) ON DELETE CASCADE,

  car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
  car_variant_id UUID REFERENCES car_variants(id) ON DELETE CASCADE,

  fitment_notes TEXT,
  requires_tune BOOLEAN DEFAULT false,
  install_difficulty TEXT CHECK (install_difficulty IN ('easy','moderate','hard','pro_only')),
  estimated_labor_hours DECIMAL(5,2),

  verified BOOLEAN DEFAULT false,
  verified_by TEXT,
  verified_at TIMESTAMPTZ,

  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  source_url TEXT,

  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_part_fitments_part_id ON part_fitments(part_id);
CREATE INDEX IF NOT EXISTS idx_part_fitments_car_id ON part_fitments(car_id);
CREATE INDEX IF NOT EXISTS idx_part_fitments_variant_id ON part_fitments(car_variant_id);
CREATE INDEX IF NOT EXISTS idx_part_fitments_metadata ON part_fitments USING GIN(metadata);

DROP TRIGGER IF EXISTS update_part_fitments_updated_at ON part_fitments;
CREATE TRIGGER update_part_fitments_updated_at
  BEFORE UPDATE ON part_fitments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE part_fitments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "part_fitments_select_public" ON part_fitments;
CREATE POLICY "part_fitments_select_public"
  ON part_fitments FOR SELECT
  TO public
  USING (true);

-- ============================================================================
-- PART RELATIONSHIPS (requires/conflicts/etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS part_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  part_id UUID NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
  related_part_id UUID NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
  relation_type part_relation_type NOT NULL,

  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT ux_part_relationship UNIQUE (part_id, related_part_id, relation_type)
);

CREATE INDEX IF NOT EXISTS idx_part_relationships_part_id ON part_relationships(part_id);
CREATE INDEX IF NOT EXISTS idx_part_relationships_related_part_id ON part_relationships(related_part_id);
CREATE INDEX IF NOT EXISTS idx_part_relationships_type ON part_relationships(relation_type);

ALTER TABLE part_relationships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "part_relationships_select_public" ON part_relationships;
CREATE POLICY "part_relationships_select_public"
  ON part_relationships FOR SELECT
  TO public
  USING (true);

-- ============================================================================
-- PART PRICING SNAPSHOTS (time-series)
-- ============================================================================
CREATE TABLE IF NOT EXISTS part_pricing_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  part_id UUID NOT NULL REFERENCES parts(id) ON DELETE CASCADE,

  vendor_name TEXT,
  vendor_url TEXT,
  product_url TEXT,

  currency TEXT DEFAULT 'USD',
  price_cents INTEGER CHECK (price_cents >= 0),
  in_stock BOOLEAN,

  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  metadata JSONB DEFAULT '{}'::jsonb,

  CONSTRAINT ux_part_pricing_vendor_day UNIQUE (part_id, vendor_name, recorded_at)
);

CREATE INDEX IF NOT EXISTS idx_part_pricing_part_id ON part_pricing_snapshots(part_id);
CREATE INDEX IF NOT EXISTS idx_part_pricing_recorded_at ON part_pricing_snapshots(recorded_at);

ALTER TABLE part_pricing_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "part_pricing_select_public" ON part_pricing_snapshots;
CREATE POLICY "part_pricing_select_public"
  ON part_pricing_snapshots FOR SELECT
  TO public
  USING (true);

-- ============================================================================
-- UPGRADE KEY CATALOG (conceptual upgrades -> parts)
-- ============================================================================
CREATE TABLE IF NOT EXISTS upgrade_keys (
  key TEXT PRIMARY KEY, -- e.g., "intake", "headers", "coilovers-track"
  name TEXT NOT NULL,
  category upgrade_key_category NOT NULL DEFAULT 'other',
  description TEXT,

  typical_cost_low INTEGER CHECK (typical_cost_low >= 0),
  typical_cost_high INTEGER CHECK (typical_cost_high >= 0),

  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_upgrade_keys_category ON upgrade_keys(category);
CREATE INDEX IF NOT EXISTS idx_upgrade_keys_metadata ON upgrade_keys USING GIN(metadata);

DROP TRIGGER IF EXISTS update_upgrade_keys_updated_at ON upgrade_keys;
CREATE TRIGGER update_upgrade_keys_updated_at
  BEFORE UPDATE ON upgrade_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE upgrade_keys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "upgrade_keys_select_public" ON upgrade_keys;
CREATE POLICY "upgrade_keys_select_public"
  ON upgrade_keys FOR SELECT
  TO public
  USING (true);

-- Link upgrades to concrete parts (many-to-many)
CREATE TABLE IF NOT EXISTS upgrade_key_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upgrade_key TEXT NOT NULL REFERENCES upgrade_keys(key) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'primary' CHECK (role IN ('primary','alternative','supporting')),
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  CONSTRAINT ux_upgrade_part UNIQUE (upgrade_key, part_id)
);

CREATE INDEX IF NOT EXISTS idx_upgrade_key_parts_upgrade ON upgrade_key_parts(upgrade_key);
CREATE INDEX IF NOT EXISTS idx_upgrade_key_parts_part ON upgrade_key_parts(part_id);

ALTER TABLE upgrade_key_parts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "upgrade_key_parts_select_public" ON upgrade_key_parts;
CREATE POLICY "upgrade_key_parts_select_public"
  ON upgrade_key_parts FOR SELECT
  TO public
  USING (true);

-- ============================================================================
-- WRITE ACCESS: service role only (optional enforcement)
-- ============================================================================
-- Reads are public. Writes should happen server-side with service role key.
-- (No explicit insert/update policies = blocked for anon/auth unless bypass.)















