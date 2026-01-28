-- Migration: Parts Manufacturer Columns
-- Purpose: Separate manufacturer attribution from vendor/retailer data
-- Context: Current parts.brand_name contains retailers (BMP Tuning) instead of
--          actual manufacturers (APR). This migration adds proper manufacturer fields.

-- ============================================================================
-- ADD MANUFACTURER COLUMNS TO PARTS TABLE
-- ============================================================================

-- Actual manufacturer/brand name (e.g., "APR", "Borla", "HKS")
ALTER TABLE parts ADD COLUMN IF NOT EXISTS manufacturer_name TEXT;

-- Manufacturer's official website (e.g., "https://goapr.com")
ALTER TABLE parts ADD COLUMN IF NOT EXISTS manufacturer_url TEXT;

-- Direct link to product on manufacturer's site (optional, may not exist for all products)
ALTER TABLE parts ADD COLUMN IF NOT EXISTS manufacturer_product_url TEXT;

-- Track data source for parts (helps distinguish AL-researched vs vendor-scraped)
ALTER TABLE parts ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'unknown';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for manufacturer lookups (common query pattern)
CREATE INDEX IF NOT EXISTS idx_parts_manufacturer_name ON parts(manufacturer_name);

-- Index for data source filtering (to find AL-researched vs scraped parts)
CREATE INDEX IF NOT EXISTS idx_parts_data_source ON parts(data_source);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN parts.manufacturer_name IS 
  'Actual manufacturer/brand name (e.g., APR, Borla, HKS). Different from brand_name which may contain retailer names.';

COMMENT ON COLUMN parts.manufacturer_url IS 
  'Official manufacturer website URL (e.g., https://goapr.com)';

COMMENT ON COLUMN parts.manufacturer_product_url IS 
  'Direct link to product page on manufacturer site (when available)';

COMMENT ON COLUMN parts.data_source IS 
  'How this part was added: al_research, vendor_scrape, manual, import';

-- ============================================================================
-- DEPRECATION NOTE FOR brand_name
-- ============================================================================

COMMENT ON COLUMN parts.brand_name IS 
  'DEPRECATED: May contain retailer names instead of manufacturers. Use manufacturer_name for accurate brand attribution.';

-- ============================================================================
-- UPDATE EXISTING AL-RESEARCHED PARTS (if any exist from previous research)
-- ============================================================================

-- Mark existing parts from known vendor scraping as such
UPDATE parts 
SET data_source = 'vendor_scrape'
WHERE data_source = 'unknown'
  AND brand_name IN (
    'FT Speed', 'JHP USA', 'Subimods', 'EQTuning', 
    'MAPerformance', 'BMP Tuning', 'Titan Motorsports', 'AmericanMuscle'
  );

-- Mark parts where brand_name appears to be an actual manufacturer
UPDATE parts 
SET 
  data_source = 'vendor_scrape',
  manufacturer_name = brand_name
WHERE data_source = 'unknown'
  AND brand_name NOT IN (
    'FT Speed', 'JHP USA', 'Subimods', 'EQTuning', 
    'MAPerformance', 'BMP Tuning', 'Titan Motorsports', 'AmericanMuscle'
  );
