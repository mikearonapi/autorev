-- ============================================================================
-- FORUM INTELLIGENCE SCHEMA
-- AutoRev - Forum scraping and community insight extraction system
--
-- This migration creates:
--   1. forum_sources - Registry of forums to scrape
--   2. forum_scrape_runs - Scrape session tracking
--   3. forum_scraped_threads - Raw scraped content (staging)
--   4. community_insights - Extracted structured insights (THE VALUABLE OUTPUT)
--   5. community_insight_sources - Multi-source tracking for insights
--   6. search_community_insights - RPC for semantic search
--   7. increment_forum_source_insights - RPC for stats
-- ============================================================================

-- ============================================================================
-- TABLE 1: FORUM SOURCES
-- Registry of forums we scrape with configuration
-- ============================================================================

CREATE TABLE IF NOT EXISTS forum_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity
  slug TEXT UNIQUE NOT NULL,           -- 'rennlist', 'bimmerpost', 'miata-net'
  name TEXT NOT NULL,                   -- 'Rennlist'
  base_url TEXT NOT NULL,               -- 'https://rennlist.com'
  
  -- Scope
  car_brands TEXT[] NOT NULL,           -- ['Porsche']
  car_slugs TEXT[],                     -- Specific cars, NULL = all brand cars
  
  -- Scraping config (JSONB for flexibility)
  scrape_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  /*
    {
      "requires_auth": false,
      "rate_limit_ms": 2000,
      "max_pages_per_run": 50,
      "thread_list_selectors": {...},
      "thread_content_selectors": {...},
      "valuable_subforums": [...],
      "thread_title_patterns": {...}
    }
  */
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 5,           -- 1-10, higher = scrape first
  
  -- Tracking
  last_scraped_at TIMESTAMPTZ,
  total_threads_scraped INTEGER DEFAULT 0,
  total_insights_extracted INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for forum_sources
CREATE INDEX IF NOT EXISTS idx_forum_sources_slug ON forum_sources(slug);
CREATE INDEX IF NOT EXISTS idx_forum_sources_active_priority 
  ON forum_sources(priority DESC, is_active) 
  WHERE is_active = true;

COMMENT ON TABLE forum_sources IS 'Registry of automotive forums for scraping with configuration';
COMMENT ON COLUMN forum_sources.slug IS 'Unique identifier: rennlist, bimmerpost, miata-net, etc.';
COMMENT ON COLUMN forum_sources.scrape_config IS 'JSON config: selectors, rate limits, subforums, title patterns';
COMMENT ON COLUMN forum_sources.priority IS '1-10, higher priority forums scraped first';

-- ============================================================================
-- TABLE 2: FORUM SCRAPE RUNS
-- Track each scrape session for debugging and rate limiting
-- ============================================================================

CREATE TABLE IF NOT EXISTS forum_scrape_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What we scraped
  forum_source_id UUID REFERENCES forum_sources(id) ON DELETE CASCADE,
  car_slug TEXT,                        -- NULL = forum-wide, or specific car
  
  -- Scope
  run_type TEXT NOT NULL,               -- 'discovery', 'targeted', 'backfill'
  target_urls TEXT[],                   -- Specific URLs if targeted
  
  -- Results
  status TEXT NOT NULL DEFAULT 'pending',  -- pending, running, completed, failed
  threads_found INTEGER DEFAULT 0,
  threads_scraped INTEGER DEFAULT 0,
  posts_scraped INTEGER DEFAULT 0,
  insights_extracted INTEGER DEFAULT 0,
  
  -- Errors
  error_message TEXT,
  error_details JSONB,
  
  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for forum_scrape_runs
CREATE INDEX IF NOT EXISTS idx_forum_scrape_runs_source 
  ON forum_scrape_runs(forum_source_id);
CREATE INDEX IF NOT EXISTS idx_forum_scrape_runs_status 
  ON forum_scrape_runs(status);
CREATE INDEX IF NOT EXISTS idx_forum_scrape_runs_recent 
  ON forum_scrape_runs(created_at DESC);

-- Constraint for run_type
ALTER TABLE forum_scrape_runs
DROP CONSTRAINT IF EXISTS forum_scrape_runs_run_type_check;
ALTER TABLE forum_scrape_runs
ADD CONSTRAINT forum_scrape_runs_run_type_check 
CHECK (run_type IN ('discovery', 'targeted', 'backfill'));

-- Constraint for status
ALTER TABLE forum_scrape_runs
DROP CONSTRAINT IF EXISTS forum_scrape_runs_status_check;
ALTER TABLE forum_scrape_runs
ADD CONSTRAINT forum_scrape_runs_status_check 
CHECK (status IN ('pending', 'running', 'completed', 'failed'));

COMMENT ON TABLE forum_scrape_runs IS 'Tracks each forum scraping session for debugging and monitoring';
COMMENT ON COLUMN forum_scrape_runs.run_type IS 'discovery=find new threads, targeted=specific URLs, backfill=historical';

-- ============================================================================
-- TABLE 3: FORUM SCRAPED THREADS
-- Raw scraped content before AI extraction (staging table)
-- ============================================================================

CREATE TABLE IF NOT EXISTS forum_scraped_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source
  forum_source_id UUID REFERENCES forum_sources(id) ON DELETE CASCADE,
  scrape_run_id UUID REFERENCES forum_scrape_runs(id) ON DELETE CASCADE,
  
  -- Thread identity
  thread_url TEXT UNIQUE NOT NULL,
  thread_title TEXT NOT NULL,
  subforum TEXT,
  
  -- Metadata
  original_post_date TIMESTAMPTZ,
  last_reply_date TIMESTAMPTZ,
  reply_count INTEGER,
  view_count INTEGER,
  
  -- Raw content (JSONB array of posts)
  posts JSONB NOT NULL,
  /*
    [
      {
        "post_number": 1,
        "author": "username",
        "date": "2024-01-15T10:30:00Z",
        "content": "Full post text...",
        "is_op": true
      },
      ...
    ]
  */
  
  -- Processing status
  processing_status TEXT DEFAULT 'pending',  -- pending, processing, completed, failed, no_insights
  processed_at TIMESTAMPTZ,
  
  -- Relevance scoring (pre-AI)
  relevance_score FLOAT,                -- 0-1, based on title patterns, engagement
  car_slugs_detected TEXT[],            -- Cars mentioned in thread
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for processing queue (critical for performance)
CREATE INDEX IF NOT EXISTS idx_forum_scraped_threads_processing 
  ON forum_scraped_threads(processing_status, relevance_score DESC)
  WHERE processing_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_forum_scraped_threads_url 
  ON forum_scraped_threads(thread_url);

CREATE INDEX IF NOT EXISTS idx_forum_scraped_threads_source 
  ON forum_scraped_threads(forum_source_id);

CREATE INDEX IF NOT EXISTS idx_forum_scraped_threads_car_slugs 
  ON forum_scraped_threads USING GIN (car_slugs_detected);

-- Constraint for processing_status
ALTER TABLE forum_scraped_threads
DROP CONSTRAINT IF EXISTS forum_scraped_threads_processing_status_check;
ALTER TABLE forum_scraped_threads
ADD CONSTRAINT forum_scraped_threads_processing_status_check 
CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed', 'no_insights'));

COMMENT ON TABLE forum_scraped_threads IS 'Raw scraped forum threads awaiting AI extraction';
COMMENT ON COLUMN forum_scraped_threads.posts IS 'JSONB array of post objects with author, date, content';
COMMENT ON COLUMN forum_scraped_threads.relevance_score IS '0-1 score based on title patterns and engagement';
COMMENT ON COLUMN forum_scraped_threads.processing_status IS 'pending→processing→completed/failed/no_insights';

-- ============================================================================
-- TABLE 4: COMMUNITY INSIGHTS (THE VALUABLE OUTPUT)
-- Structured, queryable insights extracted from forum content
-- ============================================================================

CREATE TABLE IF NOT EXISTS community_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Car association
  car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
  car_slug TEXT NOT NULL,
  car_variant_id UUID REFERENCES car_variants(id) ON DELETE SET NULL,
  
  -- Insight classification
  insight_type TEXT NOT NULL,
  /*
    'failure_pattern'     - Component X fails at Y miles
    'repair_cost'         - Real repair cost data
    'mod_recommendation'  - What mods work well together
    'mod_result'          - Actual gains from specific mods
    'ppi_checklist'       - Pre-purchase inspection items
    'long_term_report'    - Extended ownership summary
    'track_setup'         - Proven track configurations
    'maintenance_tip'     - Maintenance insights beyond manual
    'buyer_advice'        - Year-specific buying guidance
  */
  
  -- Content
  title TEXT NOT NULL,                  -- Short, descriptive title
  summary TEXT NOT NULL,                -- 2-3 sentence summary
  details JSONB NOT NULL,               -- Type-specific structured data
  
  -- Mileage context (when relevant)
  mileage_low INTEGER,
  mileage_high INTEGER,
  mileage_typical INTEGER,
  
  -- Quality signals
  confidence FLOAT NOT NULL,            -- 0-1, AI confidence in extraction
  consensus_strength TEXT,              -- 'strong', 'moderate', 'single_source'
  source_count INTEGER DEFAULT 1,       -- How many sources support this
  
  -- Provenance
  source_forum TEXT NOT NULL,           -- 'rennlist', 'bimmerpost'
  source_urls TEXT[] NOT NULL,          -- Original thread URLs
  source_thread_id UUID REFERENCES forum_scraped_threads(id) ON DELETE SET NULL,
  extracted_from_posts INTEGER[],       -- Post numbers used
  
  -- Embedding for semantic search
  embedding vector(1536),
  embedding_text TEXT,                  -- Text used for embedding
  
  -- Lifecycle
  is_verified BOOLEAN DEFAULT false,    -- Manual review flag
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for community_insights
CREATE INDEX IF NOT EXISTS idx_community_insights_car_slug 
  ON community_insights(car_slug);
CREATE INDEX IF NOT EXISTS idx_community_insights_type 
  ON community_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_community_insights_car_type 
  ON community_insights(car_slug, insight_type);
CREATE INDEX IF NOT EXISTS idx_community_insights_active 
  ON community_insights(is_active) 
  WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_community_insights_confidence 
  ON community_insights(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_community_insights_forum 
  ON community_insights(source_forum);

-- Vector index for semantic search (HNSW for approximate nearest neighbor)
CREATE INDEX IF NOT EXISTS idx_community_insights_embedding 
  ON community_insights 
  USING hnsw (embedding vector_cosine_ops);

-- Constraint for insight_type
ALTER TABLE community_insights
DROP CONSTRAINT IF EXISTS community_insights_insight_type_check;
ALTER TABLE community_insights
ADD CONSTRAINT community_insights_insight_type_check 
CHECK (insight_type IN (
  'known_issue',        -- Common problems, failure patterns
  'maintenance_tip',    -- Service intervals, DIY procedures
  'modification_guide', -- How-to guides for mods
  'troubleshooting',    -- Diagnostic steps, solutions
  'buying_guide',       -- PPI checklists, what to look for
  'performance_data',   -- Dyno numbers, lap times
  'reliability_report', -- Long-term ownership experiences
  'cost_insight',       -- Real maintenance/repair costs
  'comparison'          -- Owner comparisons between models
));

-- Constraint for consensus_strength
ALTER TABLE community_insights
DROP CONSTRAINT IF EXISTS community_insights_consensus_check;
ALTER TABLE community_insights
ADD CONSTRAINT community_insights_consensus_check 
CHECK (consensus_strength IS NULL OR consensus_strength IN ('strong', 'moderate', 'single_source'));

-- Constraint for confidence (0-1)
ALTER TABLE community_insights
DROP CONSTRAINT IF EXISTS community_insights_confidence_check;
ALTER TABLE community_insights
ADD CONSTRAINT community_insights_confidence_check 
CHECK (confidence >= 0 AND confidence <= 1);

COMMENT ON TABLE community_insights IS 'Structured insights extracted from forum content - the core value output';
COMMENT ON COLUMN community_insights.insight_type IS 'known_issue, maintenance_tip, modification_guide, troubleshooting, buying_guide, performance_data, reliability_report, cost_insight, comparison';
COMMENT ON COLUMN community_insights.details IS 'Type-specific JSONB structure (see documentation for schemas)';
COMMENT ON COLUMN community_insights.confidence IS '0-1 AI confidence score';
COMMENT ON COLUMN community_insights.consensus_strength IS 'strong=multiple confirmations, moderate=some, single_source=one thread';

-- ============================================================================
-- TABLE 5: COMMUNITY INSIGHT SOURCES
-- Track when multiple threads support the same insight
-- ============================================================================

CREATE TABLE IF NOT EXISTS community_insight_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_id UUID REFERENCES community_insights(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES forum_scraped_threads(id) ON DELETE SET NULL,
  thread_url TEXT NOT NULL,
  forum_slug TEXT NOT NULL,
  relevance_score FLOAT,                -- How relevant this source is
  extracted_quotes TEXT[],              -- Key quotes from this source
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for community_insight_sources
CREATE INDEX IF NOT EXISTS idx_community_insight_sources_insight 
  ON community_insight_sources(insight_id);
CREATE INDEX IF NOT EXISTS idx_community_insight_sources_thread 
  ON community_insight_sources(thread_id);

COMMENT ON TABLE community_insight_sources IS 'Links insights to multiple supporting forum threads';
COMMENT ON COLUMN community_insight_sources.extracted_quotes IS 'Key quotes from this source supporting the insight';

-- ============================================================================
-- RPC: SEARCH COMMUNITY INSIGHTS (for AL assistant)
-- Semantic search with filters
-- ============================================================================

CREATE OR REPLACE FUNCTION search_community_insights(
  p_query_embedding vector(1536),
  p_car_slug TEXT DEFAULT NULL,
  p_insight_types TEXT[] DEFAULT NULL,
  p_limit INTEGER DEFAULT 5,
  p_min_confidence FLOAT DEFAULT 0.6
)
RETURNS TABLE (
  id UUID,
  car_slug TEXT,
  insight_type TEXT,
  title TEXT,
  summary TEXT,
  details JSONB,
  confidence FLOAT,
  consensus_strength TEXT,
  source_forum TEXT,
  source_urls TEXT[],
  similarity FLOAT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ci.id,
    ci.car_slug,
    ci.insight_type,
    ci.title,
    ci.summary,
    ci.details,
    ci.confidence,
    ci.consensus_strength,
    ci.source_forum,
    ci.source_urls,
    1 - (ci.embedding <=> p_query_embedding) AS similarity
  FROM community_insights ci
  WHERE ci.is_active = true
    AND ci.confidence >= p_min_confidence
    AND (p_car_slug IS NULL OR ci.car_slug = p_car_slug)
    AND (p_insight_types IS NULL OR ci.insight_type = ANY(p_insight_types))
    AND ci.embedding IS NOT NULL
  ORDER BY ci.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION search_community_insights IS 'Semantic search for community insights - used by AL assistant';

-- ============================================================================
-- RPC: INCREMENT FORUM SOURCE INSIGHTS
-- Update stats after extraction
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_forum_source_insights(
  p_forum_source_id UUID,
  p_count INTEGER
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE forum_sources
  SET total_insights_extracted = total_insights_extracted + p_count,
      updated_at = now()
  WHERE id = p_forum_source_id;
END;
$$;

COMMENT ON FUNCTION increment_forum_source_insights IS 'Increment insight count for a forum source after extraction';

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Trigger for forum_sources (reuse existing function if exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_forum_sources_updated_at'
  ) THEN
    CREATE TRIGGER update_forum_sources_updated_at
      BEFORE UPDATE ON forum_sources
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Trigger for community_insights
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_community_insights_updated_at'
  ) THEN
    CREATE TRIGGER update_community_insights_updated_at
      BEFORE UPDATE ON community_insights
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE forum_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_scrape_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_scraped_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_insight_sources ENABLE ROW LEVEL SECURITY;

-- forum_sources: Service role only (config is internal)
DROP POLICY IF EXISTS "Service role forum_sources" ON forum_sources;
CREATE POLICY "Service role forum_sources" ON forum_sources
  FOR ALL USING (auth.role() = 'service_role');

-- forum_scrape_runs: Service role only (internal tracking)
DROP POLICY IF EXISTS "Service role forum_scrape_runs" ON forum_scrape_runs;
CREATE POLICY "Service role forum_scrape_runs" ON forum_scrape_runs
  FOR ALL USING (auth.role() = 'service_role');

-- forum_scraped_threads: Service role only (raw data is internal)
DROP POLICY IF EXISTS "Service role forum_scraped_threads" ON forum_scraped_threads;
CREATE POLICY "Service role forum_scraped_threads" ON forum_scraped_threads
  FOR ALL USING (auth.role() = 'service_role');

-- community_insights: Public read for active insights, service role for writes
DROP POLICY IF EXISTS "Public read community_insights" ON community_insights;
CREATE POLICY "Public read community_insights" ON community_insights
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Service role write community_insights" ON community_insights;
CREATE POLICY "Service role write community_insights" ON community_insights
  FOR ALL USING (auth.role() = 'service_role');

-- community_insight_sources: Service role only
DROP POLICY IF EXISTS "Service role community_insight_sources" ON community_insight_sources;
CREATE POLICY "Service role community_insight_sources" ON community_insight_sources
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- HELPER VIEW: INSIGHT STATS BY CAR
-- Useful for understanding coverage
-- ============================================================================

CREATE OR REPLACE VIEW community_insights_by_car AS
SELECT 
  car_slug,
  insight_type,
  COUNT(*) AS insight_count,
  AVG(confidence)::DECIMAL(3,2) AS avg_confidence,
  COUNT(*) FILTER (WHERE consensus_strength = 'strong') AS strong_consensus_count
FROM community_insights
WHERE is_active = true
GROUP BY car_slug, insight_type
ORDER BY car_slug, insight_count DESC;

COMMENT ON VIEW community_insights_by_car IS 'Insight counts and quality metrics grouped by car and type';

-- ============================================================================
-- HELPER VIEW: FORUM SOURCE STATS
-- Quick overview of scraping status
-- ============================================================================

CREATE OR REPLACE VIEW forum_source_stats AS
SELECT 
  fs.slug,
  fs.name,
  fs.is_active,
  fs.priority,
  fs.total_threads_scraped,
  fs.total_insights_extracted,
  fs.last_scraped_at,
  COUNT(DISTINCT fst.id) FILTER (WHERE fst.processing_status = 'pending') AS pending_threads,
  COUNT(DISTINCT ci.id) AS total_insights
FROM forum_sources fs
LEFT JOIN forum_scraped_threads fst ON fst.forum_source_id = fs.id
LEFT JOIN community_insights ci ON ci.source_forum = fs.slug
GROUP BY fs.id
ORDER BY fs.priority DESC, fs.name;

COMMENT ON VIEW forum_source_stats IS 'Overview of forum scraping status and insight counts';

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE forum_sources IS 'Forum Intelligence: Registry of forums to scrape with configuration';
COMMENT ON TABLE forum_scrape_runs IS 'Forum Intelligence: Tracks each scraping session';
COMMENT ON TABLE forum_scraped_threads IS 'Forum Intelligence: Raw scraped content awaiting AI extraction';
COMMENT ON TABLE community_insights IS 'Forum Intelligence: Extracted structured insights from community discussions';
COMMENT ON TABLE community_insight_sources IS 'Forum Intelligence: Multi-source tracking for consolidated insights';

