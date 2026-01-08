-- ============================================================================
-- AL ARTICLES
-- AutoRev - Content Hub for SEO Articles
--
-- This migration creates a unified articles system with 3 categories:
--   1. comparisons - Comparisons & Buyer Guides (Car Search/Find My Car persona)
--   2. enthusiast - Car Industry/Culture (My Garage persona)
--   3. technical - Modification/Technical Guides (Tuning Shop persona)
-- ============================================================================

-- ============================================================================
-- ARTICLE CATEGORIES ENUM
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE article_category AS ENUM (
    'comparisons',  -- Comparisons & Buyer Guides
    'enthusiast',   -- Car Industry/Culture
    'technical'     -- Modification/Technical
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- AL ARTICLES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS al_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- URL and SEO
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  
  -- Category (determines which section it appears in)
  category article_category NOT NULL,
  
  -- Subcategory for finer filtering
  -- comparisons: 'head_to_head', 'three_way', 'best_under', 'best_for', 'alternatives', 'buyer_guide'
  -- enthusiast: 'news', 'culture', 'history', 'events', 'community'
  -- technical: 'mod_guide', 'how_to', 'dyno_results', 'maintenance', 'troubleshooting'
  subcategory TEXT,
  
  -- SEO metadata
  seo_title TEXT,                     -- Override title for SEO
  meta_description TEXT,              -- 160-char description
  meta_keywords TEXT[],
  
  -- Hero image
  hero_image_url TEXT,
  hero_image_alt TEXT,
  
  -- Content
  excerpt TEXT,                       -- Short preview text (shown in cards)
  content JSONB DEFAULT '[]'::jsonb,  -- Rich content blocks
  content_html TEXT,                  -- Pre-rendered HTML content
  
  -- For comparison articles (links to cars)
  car_slugs TEXT[],                   -- Cars mentioned/compared
  
  -- Legacy: link to comparison_pages if migrated (not FK constrained)
  legacy_comparison_id UUID,
  
  -- Author
  author_name TEXT DEFAULT 'AL',
  author_avatar_url TEXT,
  
  -- Tags for filtering
  tags TEXT[],
  
  -- Engagement
  view_count INTEGER DEFAULT 0,
  read_time_minutes INTEGER,          -- Estimated read time
  
  -- Featured/promoted
  is_featured BOOLEAN DEFAULT false,
  featured_at TIMESTAMPTZ,
  
  -- Publishing
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_al_articles_slug ON al_articles(slug);
CREATE INDEX IF NOT EXISTS idx_al_articles_category ON al_articles(category);
CREATE INDEX IF NOT EXISTS idx_al_articles_subcategory ON al_articles(subcategory);
CREATE INDEX IF NOT EXISTS idx_al_articles_published ON al_articles(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_al_articles_featured ON al_articles(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_al_articles_car_slugs ON al_articles USING GIN(car_slugs);
CREATE INDEX IF NOT EXISTS idx_al_articles_views ON al_articles(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_al_articles_tags ON al_articles USING GIN(tags);

-- Auto-update timestamp trigger
DROP TRIGGER IF EXISTS update_al_articles_updated_at ON al_articles;
CREATE TRIGGER update_al_articles_updated_at
  BEFORE UPDATE ON al_articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get articles with filtering
CREATE OR REPLACE FUNCTION get_al_articles(
  p_category TEXT DEFAULT NULL,
  p_subcategory TEXT DEFAULT NULL,
  p_car_slug TEXT DEFAULT NULL,
  p_featured_only BOOLEAN DEFAULT false,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  slug TEXT,
  title TEXT,
  category article_category,
  subcategory TEXT,
  excerpt TEXT,
  hero_image_url TEXT,
  car_slugs TEXT[],
  author_name TEXT,
  view_count INTEGER,
  read_time_minutes INTEGER,
  is_featured BOOLEAN,
  published_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.slug,
    a.title,
    a.category,
    a.subcategory,
    a.excerpt,
    a.hero_image_url,
    a.car_slugs,
    a.author_name,
    a.view_count,
    a.read_time_minutes,
    a.is_featured,
    a.published_at
  FROM al_articles a
  WHERE a.is_published = true
    AND (p_category IS NULL OR a.category::TEXT = p_category)
    AND (p_subcategory IS NULL OR a.subcategory = p_subcategory)
    AND (p_car_slug IS NULL OR p_car_slug = ANY(a.car_slugs))
    AND (NOT p_featured_only OR a.is_featured = true)
  ORDER BY 
    a.is_featured DESC,
    a.published_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get single article by slug with full content
CREATE OR REPLACE FUNCTION get_al_article_by_slug(
  p_slug TEXT,
  p_category TEXT DEFAULT NULL
)
RETURNS TABLE (
  article JSONB,
  comparison_data JSONB
) AS $$
DECLARE
  v_article_id UUID;
BEGIN
  -- Get article ID and increment view (with optional category validation)
  SELECT a.id INTO v_article_id
  FROM al_articles a
  WHERE a.slug = p_slug 
    AND a.is_published = true
    AND (p_category IS NULL OR a.category::TEXT = p_category);
  
  IF v_article_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Increment view count
  UPDATE al_articles SET view_count = view_count + 1 WHERE id = v_article_id;
  
  RETURN QUERY
  SELECT
    to_jsonb(a.*) AS article,
    NULL::JSONB AS comparison_data
  FROM al_articles a
  WHERE a.id = v_article_id;
END;
$$ LANGUAGE plpgsql;

-- Get article counts by category
CREATE OR REPLACE FUNCTION get_article_counts()
RETURNS TABLE (
  category TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.category::TEXT,
    COUNT(*)::BIGINT
  FROM al_articles a
  WHERE a.is_published = true
  GROUP BY a.category;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get related articles
CREATE OR REPLACE FUNCTION get_related_articles(
  p_article_id UUID,
  p_category TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 4
)
RETURNS SETOF al_articles AS $$
DECLARE
  v_category article_category;
  v_car_slugs TEXT[];
BEGIN
  -- Get article's category and car slugs
  SELECT category, car_slugs INTO v_category, v_car_slugs
  FROM al_articles WHERE id = p_article_id;
  
  -- Use provided category if specified, otherwise use article's category
  IF p_category IS NOT NULL THEN
    v_category := p_category::article_category;
  END IF;
  
  -- Return related articles
  RETURN QUERY
  SELECT a.*
  FROM al_articles a
  WHERE a.id != p_article_id
    AND a.is_published = true
    AND (
      a.category = v_category  -- Same category
      OR (v_car_slugs IS NOT NULL AND a.car_slugs && v_car_slugs)  -- Overlapping cars
    )
  ORDER BY 
    CASE WHEN v_car_slugs IS NOT NULL AND a.car_slugs && v_car_slugs THEN 0 ELSE 1 END,  -- Prioritize car overlap
    a.view_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE al_articles ENABLE ROW LEVEL SECURITY;

-- Anyone can read published articles
DROP POLICY IF EXISTS "Anyone can view published articles" ON al_articles;
CREATE POLICY "Anyone can view published articles" ON al_articles
  FOR SELECT USING (is_published = true);

-- Service role can manage all
DROP POLICY IF EXISTS "Service can manage articles" ON al_articles;
CREATE POLICY "Service can manage articles" ON al_articles
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- SEED INITIAL ARTICLES
-- ============================================================================

-- Comparison articles (published for SEO)
INSERT INTO al_articles (slug, title, category, subcategory, meta_description, excerpt, car_slugs, is_published, published_at, read_time_minutes, tags, is_featured)
VALUES 
  (
    '2024-toyota-supra-vs-nissan-z',
    '2024 Toyota GR Supra vs 2024 Nissan Z: Japanese Sports Car Showdown',
    'comparisons',
    'head_to_head',
    'Compare the 2024 Toyota GR Supra vs Nissan Z - price, performance, specs. See which Japanese sports car wins.',
    'Two iconic Japanese sports cars go head-to-head. The turbocharged Supra takes on the twin-turbo Z in a battle of modern JDM legends.',
    ARRAY['2024-toyota-supra', '2024-nissan-z'],
    true,
    NOW(),
    7,
    ARRAY['supra', 'nissan-z', 'japanese', 'sports-car', 'comparison'],
    true
  ),
  (
    '2024-ford-mustang-vs-chevrolet-camaro',
    '2024 Ford Mustang vs Chevrolet Camaro: American Muscle Showdown',
    'comparisons',
    'head_to_head',
    'Ford Mustang vs Chevy Camaro - the ultimate American muscle comparison. Performance, price, and which to buy.',
    'The rivalry that defined a generation. We compare the latest Mustang and Camaro to determine which American icon reigns supreme.',
    ARRAY['2024-ford-mustang', '2024-chevrolet-camaro'],
    true,
    NOW(),
    8,
    ARRAY['mustang', 'camaro', 'american', 'muscle-car', 'comparison'],
    true
  ),
  (
    '2024-porsche-911-vs-chevrolet-corvette',
    '2024 Porsche 911 vs Chevrolet Corvette C8: German Engineering vs American Innovation',
    'comparisons',
    'head_to_head',
    'Porsche 911 vs Corvette C8 comparison - price, performance, driving experience. Which sports car delivers more?',
    'The mid-engine revolution meets German tradition. We compare two of the most capable sports cars money can buy.',
    ARRAY['2024-porsche-911', '2024-chevrolet-corvette'],
    true,
    NOW(),
    9,
    ARRAY['porsche', '911', 'corvette', 'sports-car', 'comparison'],
    false
  ),
  (
    'best-sports-cars-under-50k',
    'Best Sports Cars Under $50,000 in 2024: Our Top Picks',
    'comparisons',
    'best_under',
    'Best sports cars under $50,000 - GR86, Miata, Mustang EcoBoost, and more. Find your perfect affordable sports car.',
    'You don''t need to spend a fortune to have fun. Here are the best sports cars you can buy for under $50K.',
    ARRAY['2024-toyota-gr86', '2024-mazda-mx-5-miata', '2024-ford-mustang-ecoboost'],
    true,
    NOW(),
    10,
    ARRAY['sports-car', 'budget', 'under-50k', 'buyer-guide'],
    true
  ),
  (
    'miata-vs-gr86-vs-brz',
    '2024 Mazda MX-5 Miata vs Toyota GR86 vs Subaru BRZ: Lightweight Champion Showdown',
    'comparisons',
    'three_way',
    'Miata vs GR86 vs BRZ - which lightweight sports car is best? Price, handling, practicality compared.',
    'Three lightweight champions battle for driving purity. We put the Miata, GR86, and BRZ head-to-head.',
    ARRAY['2024-mazda-mx-5-miata', '2024-toyota-gr86', '2024-subaru-brz'],
    true,
    NOW(),
    8,
    ARRAY['miata', 'gr86', 'brz', 'lightweight', 'comparison'],
    false
  )
ON CONFLICT (slug) DO NOTHING;

-- Enthusiast articles (draft)
INSERT INTO al_articles (slug, title, category, subcategory, meta_description, excerpt, is_published, published_at, read_time_minutes, tags)
VALUES 
  (
    'history-of-the-porsche-911',
    'The Complete History of the Porsche 911: From 1963 to Today',
    'enthusiast',
    'history',
    'Explore the iconic Porsche 911''s 60+ year evolution from air-cooled classic to modern supercar.',
    'The Porsche 911 is arguably the most iconic sports car ever built. From its 1963 debut to the current 992 generation, here''s how it became a legend.',
    false,
    NULL,
    8,
    ARRAY['porsche', '911', 'history', 'sports-car']
  ),
  (
    'cars-and-coffee-guide',
    'The Ultimate Cars & Coffee Guide: What to Know Before Your First Event',
    'enthusiast',
    'events',
    'Everything you need to know about Cars & Coffee events - etiquette, timing, and how to make the most of it.',
    'Cars & Coffee events are the best way to connect with fellow enthusiasts. Here''s your complete guide to getting the most out of these iconic gatherings.',
    false,
    NULL,
    6,
    ARRAY['cars-and-coffee', 'events', 'community', 'guide']
  ),
  (
    'why-manual-transmissions-matter',
    'Why Manual Transmissions Still Matter in 2025',
    'enthusiast',
    'culture',
    'In an age of dual-clutch automatics and EVs, the manual transmission refuses to die. Here''s why enthusiasts still love rowing their own gears.',
    'DCTs are faster. EVs don''t need transmissions at all. Yet enthusiasts still clamor for manual options. Here''s why the third pedal matters.',
    false,
    NULL,
    5,
    ARRAY['manual', 'transmission', 'culture', 'enthusiast']
  )
ON CONFLICT (slug) DO NOTHING;

-- Technical articles (draft)
INSERT INTO al_articles (slug, title, category, subcategory, meta_description, excerpt, is_published, published_at, read_time_minutes, tags)
VALUES 
  (
    'beginner-mod-guide-exhaust-systems',
    'Beginner''s Guide to Exhaust Modifications: Everything You Need to Know',
    'technical',
    'mod_guide',
    'Complete guide to exhaust modifications - from cat-backs to headers. Learn about materials, sound, and performance gains.',
    'An exhaust upgrade is often the first mod enthusiasts make. Here''s everything you need to know about choosing the right system for your goals.',
    false,
    NULL,
    10,
    ARRAY['exhaust', 'mods', 'beginner', 'performance']
  ),
  (
    'understanding-ecu-tuning',
    'ECU Tuning 101: What It Is, How It Works, and Is It Right for You?',
    'technical',
    'how_to',
    'Demystifying ECU tuning - flash tunes, piggyback systems, and standalone ECUs explained for beginners.',
    'ECU tuning can unlock significant power gains, but it''s not without risks. Here''s what every enthusiast should know before reflashing.',
    false,
    NULL,
    12,
    ARRAY['ecu', 'tuning', 'performance', 'how-to']
  ),
  (
    'how-to-read-dyno-charts',
    'How to Read Dyno Charts: A Complete Guide to Understanding Power Curves',
    'technical',
    'dyno_results',
    'Learn how to interpret dyno charts like a pro - horsepower, torque, air/fuel ratios, and what they mean for performance.',
    'Dyno charts tell you more than just peak numbers. Learn to read the entire power curve and understand what makes an engine perform.',
    false,
    NULL,
    8,
    ARRAY['dyno', 'performance', 'tuning', 'guide']
  ),
  (
    'cold-air-intake-guide',
    'Cold Air Intakes: Do They Actually Work? The Science Explained',
    'technical',
    'mod_guide',
    'The truth about cold air intakes - real performance gains, dyno results, and whether they''re worth the money.',
    'Cold air intakes are one of the most popular bolt-on mods. But do they actually make power? We break down the science and real-world results.',
    false,
    NULL,
    7,
    ARRAY['intake', 'mods', 'performance', 'cai']
  )
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE al_articles IS 'Unified content hub for all AL-branded articles';
COMMENT ON COLUMN al_articles.category IS 'Main category: comparisons, enthusiast, or technical';
COMMENT ON COLUMN al_articles.subcategory IS 'Fine-grained category for filtering within main category';
COMMENT ON COLUMN al_articles.legacy_comparison_id IS 'Link to comparison_pages for migrated comparison articles';
COMMENT ON COLUMN al_articles.content IS 'Rich content stored as JSONB blocks';

