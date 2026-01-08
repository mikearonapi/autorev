-- ============================================================================
-- COMPARISON PAGES
-- AutoRev - SEO Comparison Content
--
-- This migration adds:
--   1. comparison_pages table for SEO-optimized car comparison content
--   2. Support for head-to-head, three-way, and "best of" comparisons
--   3. AL-generated recommendations and conclusions
--
-- Purpose: Drive organic traffic through high-intent "X vs Y" searches
-- Research shows 5X traffic, 11X qualified leads from comparison pages
-- ============================================================================

-- ============================================================================
-- COMPARISON PAGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS comparison_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- SEO-friendly slug and title
  slug TEXT UNIQUE NOT NULL,              -- "porsche-gt4-vs-toyota-supra"
  title TEXT NOT NULL,                     -- "Porsche 718 Cayman GT4 vs Toyota GR Supra"
  
  -- Cars being compared (references cars.slug)
  car_slugs TEXT[] NOT NULL,              -- ["718-cayman-gt4", "toyota-gr-supra"]
  
  -- Comparison type
  comparison_type TEXT NOT NULL CHECK (comparison_type IN (
    'head_to_head',   -- 2-car direct comparison
    'three_way',      -- 3-car comparison
    'best_under',     -- Best options under a price/spec threshold
    'best_for',       -- Best options for a use case
    'alternatives'    -- Alternatives to a specific car
  )),
  
  -- SEO metadata
  meta_description TEXT,                  -- 160-char meta description
  meta_keywords TEXT[],                   -- SEO keywords
  
  -- Content sections
  intro_content TEXT,                     -- Opening paragraph
  
  -- Structured comparison data (JSONB for flexibility)
  -- Format: { "categories": [{ "name": "Performance", "winner": "car-slug", "analysis": "..." }] }
  comparison_data JSONB DEFAULT '{}'::jsonb,
  
  -- Pros/cons for each car
  -- Format: { "car-slug": { "pros": [...], "cons": [...] } }
  pros_cons JSONB DEFAULT '{}'::jsonb,
  
  -- AL-generated content
  al_recommendation TEXT,                 -- "Which should you buy?" section
  al_generated_at TIMESTAMPTZ,            -- When AL content was generated
  
  -- Conclusion
  conclusion_content TEXT,
  
  -- Winner declaration (optional)
  winner_slug TEXT,                       -- Which car "wins" overall (if applicable)
  winner_rationale TEXT,
  
  -- Publishing
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  
  -- Stats
  view_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_comparison_pages_slug ON comparison_pages(slug);
CREATE INDEX IF NOT EXISTS idx_comparison_pages_type ON comparison_pages(comparison_type);
CREATE INDEX IF NOT EXISTS idx_comparison_pages_published ON comparison_pages(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_comparison_pages_car_slugs ON comparison_pages USING GIN(car_slugs);
CREATE INDEX IF NOT EXISTS idx_comparison_pages_views ON comparison_pages(view_count DESC);

-- Auto-update timestamp trigger
DROP TRIGGER IF EXISTS update_comparison_pages_updated_at ON comparison_pages;
CREATE TRIGGER update_comparison_pages_updated_at
  BEFORE UPDATE ON comparison_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get comparison page by slug with car data
CREATE OR REPLACE FUNCTION get_comparison_page_with_cars(p_slug TEXT)
RETURNS TABLE (
  comparison JSONB,
  cars JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    to_jsonb(cp.*) AS comparison,
    (
      SELECT jsonb_agg(to_jsonb(c.*))
      FROM cars c
      WHERE c.slug = ANY(cp.car_slugs)
    ) AS cars
  FROM comparison_pages cp
  WHERE cp.slug = p_slug
    AND cp.is_published = true;
END;
$$ LANGUAGE plpgsql STABLE;

-- Increment view count
CREATE OR REPLACE FUNCTION increment_comparison_views(p_slug TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE comparison_pages
  SET view_count = view_count + 1
  WHERE slug = p_slug;
END;
$$ LANGUAGE plpgsql;

-- Find comparisons containing a specific car
CREATE OR REPLACE FUNCTION get_comparisons_for_car(
  p_car_slug TEXT,
  p_limit INTEGER DEFAULT 5
)
RETURNS SETOF comparison_pages AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM comparison_pages
  WHERE p_car_slug = ANY(car_slugs)
    AND is_published = true
  ORDER BY view_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get all published comparisons for sitemap
CREATE OR REPLACE FUNCTION get_published_comparisons()
RETURNS TABLE (
  slug TEXT,
  title TEXT,
  comparison_type TEXT,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.slug,
    cp.title,
    cp.comparison_type,
    cp.updated_at
  FROM comparison_pages cp
  WHERE cp.is_published = true
  ORDER BY cp.view_count DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE comparison_pages ENABLE ROW LEVEL SECURITY;

-- Public can read published comparisons
DROP POLICY IF EXISTS "Anyone can view published comparisons" ON comparison_pages;
CREATE POLICY "Anyone can view published comparisons" ON comparison_pages
  FOR SELECT USING (is_published = true);

-- Admins can manage all comparisons (via service role)
DROP POLICY IF EXISTS "Service role can manage comparisons" ON comparison_pages;
CREATE POLICY "Service role can manage comparisons" ON comparison_pages
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- SEED INITIAL COMPARISONS (placeholder structure)
-- ============================================================================

INSERT INTO comparison_pages (slug, title, car_slugs, comparison_type, meta_description, is_published)
VALUES 
  (
    'porsche-gt4-vs-toyota-supra',
    'Porsche 718 Cayman GT4 vs Toyota GR Supra (2024 Comparison)',
    ARRAY['718-cayman-gt4', 'toyota-gr-supra'],
    'head_to_head',
    'Compare the Porsche 718 Cayman GT4 and Toyota GR Supra. Detailed specs, performance, price, and expert recommendations.',
    false
  ),
  (
    'bmw-m3-vs-mercedes-c63',
    'BMW M3 vs Mercedes-AMG C63: Which Sports Sedan Wins?',
    ARRAY['bmw-m3-g80', 'mercedes-c63-w206'],
    'head_to_head',
    'BMW M3 vs Mercedes-AMG C63 comparison. Performance, handling, interior, and value breakdown.',
    false
  ),
  (
    'corvette-z06-vs-porsche-gt4',
    'Chevrolet Corvette Z06 vs Porsche 718 Cayman GT4',
    ARRAY['corvette-z06-c8', '718-cayman-gt4'],
    'head_to_head',
    'C8 Corvette Z06 vs Porsche GT4. American muscle meets German precision. Full comparison.',
    false
  ),
  (
    'best-alternatives-to-toyota-supra',
    'Best Alternatives to the Toyota GR Supra (2024)',
    ARRAY['toyota-gr-supra', 'nissan-z', 'bmw-m2'],
    'alternatives',
    'Looking for Toyota Supra alternatives? Compare the best sports cars in the same price range.',
    false
  ),
  (
    'gt4-vs-supra-vs-z06',
    'Porsche GT4 vs Toyota Supra vs Corvette Z06: Three-Way Showdown',
    ARRAY['718-cayman-gt4', 'toyota-gr-supra', 'corvette-z06-c8'],
    'three_way',
    'Three-way comparison of the GT4, Supra, and Z06. Which sports car is best for you?',
    false
  ),
  (
    'mazda-mx5-vs-toyota-gr86',
    'Mazda MX-5 Miata vs Toyota GR86: Affordable Sports Car Battle',
    ARRAY['mazda-mx5', 'toyota-gr86'],
    'head_to_head',
    'MX-5 Miata vs GR86 comparison. Both are affordable, lightweight, and fun. Which is better?',
    false
  ),
  (
    'ford-mustang-gt-vs-chevy-camaro-ss',
    'Ford Mustang GT vs Chevrolet Camaro SS (2024)',
    ARRAY['ford-mustang-gt-s650', 'chevrolet-camaro-ss'],
    'head_to_head',
    'American muscle car showdown: Mustang GT vs Camaro SS. Performance, value, and driver experience.',
    false
  ),
  (
    'nissan-z-vs-toyota-supra',
    'Nissan Z vs Toyota GR Supra: Japanese Sports Car Rivals',
    ARRAY['nissan-z', 'toyota-gr-supra'],
    'head_to_head',
    'Nissan Z vs Toyota Supra comparison. Heritage, performance, and value head-to-head.',
    false
  ),
  (
    'best-track-day-cars-under-50k',
    'Best Track Day Cars Under $50K (2024)',
    ARRAY['mazda-mx5', 'toyota-gr86', 'ford-mustang-ecoboost'],
    'best_under',
    'Looking for the best track day car under $50,000? Our top picks for weekend warriors.',
    false
  ),
  (
    'best-sports-cars-for-daily-driving',
    'Best Sports Cars for Daily Driving (2024)',
    ARRAY['porsche-911-992', 'toyota-gr-supra', 'bmw-m2'],
    'best_for',
    'Want a sports car you can drive every day? These are the best daily-drivable sports cars.',
    false
  )
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE comparison_pages IS 'SEO-optimized car comparison pages for organic traffic';
COMMENT ON COLUMN comparison_pages.slug IS 'URL-friendly slug like "porsche-gt4-vs-toyota-supra"';
COMMENT ON COLUMN comparison_pages.car_slugs IS 'Array of car slugs being compared';
COMMENT ON COLUMN comparison_pages.comparison_type IS 'Type: head_to_head, three_way, best_under, best_for, alternatives';
COMMENT ON COLUMN comparison_pages.al_recommendation IS 'AI-generated "Which should you buy?" recommendation';
COMMENT ON COLUMN comparison_pages.comparison_data IS 'Structured comparison by category with winners and analysis';

