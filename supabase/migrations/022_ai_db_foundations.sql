-- ============================================================================
-- Migration 022: AI DB Foundations (Performance + AI-AL Retrieval)
--
-- Goals (additive, non-breaking):
--   1) Ensure required extensions exist (pgcrypto, vector)
--   2) Standardize RLS for enrichment tables created in 021_enriched_car_data.sql
--   3) Add car_id foreign keys (keep car_slug for backwards compatibility)
--   4) Fix AL message sequencing race condition
--   5) Introduce AI provenance + embeddings tables for fast, citeable retrieval
--   6) Add AI-optimized RPCs (context + vector search)
--
-- Notes:
-- - This migration is designed to be SAFE to run repeatedly (IF NOT EXISTS).
-- - It does not drop legacy columns/tables; it prepares for future refactors.
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- gen_random_uuid()

-- pgvector extension for embeddings / similarity search
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS "vector";
EXCEPTION
  WHEN undefined_file THEN
    -- Some Postgres installs might not have pgvector available.
    -- In Supabase, this should be available; if not, you'll need to enable it.
    RAISE NOTICE 'vector extension not available in this environment.';
END $$;

-- ============================================================================
-- HELPER: service_role check (RLS)
-- ============================================================================
CREATE OR REPLACE FUNCTION is_service_role()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path = public, auth
AS $$
  SELECT COALESCE(auth.jwt()->>'role', '') = 'service_role';
$$;

-- ============================================================================
-- 1) ENRICHMENT TABLES: ADD car_id + INDEXES + RLS POLICIES
--    (Tables originally created in 021_enriched_car_data.sql)
-- ============================================================================

-- -----------------------------
-- car_fuel_economy
-- -----------------------------
ALTER TABLE car_fuel_economy
  ADD COLUMN IF NOT EXISTS car_id UUID;

UPDATE car_fuel_economy e
SET car_id = c.id
FROM cars c
WHERE e.car_id IS NULL AND e.car_slug = c.slug;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'car_fuel_economy_car_id_fkey'
  ) THEN
    ALTER TABLE car_fuel_economy
      ADD CONSTRAINT car_fuel_economy_car_id_fkey
      FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_car_fuel_economy_car_id ON car_fuel_economy(car_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_car_fuel_economy_car_id ON car_fuel_economy(car_id) WHERE car_id IS NOT NULL;

ALTER TABLE car_fuel_economy ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "car_fuel_economy_select_public" ON car_fuel_economy;
CREATE POLICY "car_fuel_economy_select_public"
  ON car_fuel_economy FOR SELECT
  TO public
  USING (true);

-- -----------------------------
-- car_safety_data
-- -----------------------------
ALTER TABLE car_safety_data
  ADD COLUMN IF NOT EXISTS car_id UUID;

UPDATE car_safety_data s
SET car_id = c.id
FROM cars c
WHERE s.car_id IS NULL AND s.car_slug = c.slug;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'car_safety_data_car_id_fkey'
  ) THEN
    ALTER TABLE car_safety_data
      ADD CONSTRAINT car_safety_data_car_id_fkey
      FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_car_safety_data_car_id ON car_safety_data(car_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_car_safety_data_car_id ON car_safety_data(car_id) WHERE car_id IS NOT NULL;

ALTER TABLE car_safety_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "car_safety_data_select_public" ON car_safety_data;
CREATE POLICY "car_safety_data_select_public"
  ON car_safety_data FOR SELECT
  TO public
  USING (true);

-- -----------------------------
-- car_recalls
-- -----------------------------
ALTER TABLE car_recalls
  ADD COLUMN IF NOT EXISTS car_id UUID;

UPDATE car_recalls r
SET car_id = c.id
FROM cars c
WHERE r.car_id IS NULL AND r.car_slug = c.slug;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'car_recalls_car_id_fkey'
  ) THEN
    ALTER TABLE car_recalls
      ADD CONSTRAINT car_recalls_car_id_fkey
      FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_car_recalls_car_id ON car_recalls(car_id);

ALTER TABLE car_recalls ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "car_recalls_select_public" ON car_recalls;
CREATE POLICY "car_recalls_select_public"
  ON car_recalls FOR SELECT
  TO public
  USING (true);

-- -----------------------------
-- car_market_pricing
-- -----------------------------
ALTER TABLE car_market_pricing
  ADD COLUMN IF NOT EXISTS car_id UUID;

UPDATE car_market_pricing p
SET car_id = c.id
FROM cars c
WHERE p.car_id IS NULL AND p.car_slug = c.slug;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'car_market_pricing_car_id_fkey'
  ) THEN
    ALTER TABLE car_market_pricing
      ADD CONSTRAINT car_market_pricing_car_id_fkey
      FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_car_market_pricing_car_id ON car_market_pricing(car_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_car_market_pricing_car_id ON car_market_pricing(car_id) WHERE car_id IS NOT NULL;

ALTER TABLE car_market_pricing ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "car_market_pricing_select_public" ON car_market_pricing;
CREATE POLICY "car_market_pricing_select_public"
  ON car_market_pricing FOR SELECT
  TO public
  USING (true);

-- -----------------------------
-- car_price_history
-- -----------------------------
ALTER TABLE car_price_history
  ADD COLUMN IF NOT EXISTS car_id UUID;

UPDATE car_price_history h
SET car_id = c.id
FROM cars c
WHERE h.car_id IS NULL AND h.car_slug = c.slug;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'car_price_history_car_id_fkey'
  ) THEN
    ALTER TABLE car_price_history
      ADD CONSTRAINT car_price_history_car_id_fkey
      FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_car_price_history_car_id ON car_price_history(car_id);

ALTER TABLE car_price_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "car_price_history_select_public" ON car_price_history;
CREATE POLICY "car_price_history_select_public"
  ON car_price_history FOR SELECT
  TO public
  USING (true);

-- -----------------------------
-- car_expert_reviews
-- -----------------------------
ALTER TABLE car_expert_reviews
  ADD COLUMN IF NOT EXISTS car_id UUID;

UPDATE car_expert_reviews r
SET car_id = c.id
FROM cars c
WHERE r.car_id IS NULL AND r.car_slug = c.slug;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'car_expert_reviews_car_id_fkey'
  ) THEN
    ALTER TABLE car_expert_reviews
      ADD CONSTRAINT car_expert_reviews_car_id_fkey
      FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_car_expert_reviews_car_id ON car_expert_reviews(car_id);

ALTER TABLE car_expert_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "car_expert_reviews_select_public" ON car_expert_reviews;
CREATE POLICY "car_expert_reviews_select_public"
  ON car_expert_reviews FOR SELECT
  TO public
  USING (true);

-- -----------------------------
-- car_auction_results
-- -----------------------------
ALTER TABLE car_auction_results
  ADD COLUMN IF NOT EXISTS car_id UUID;

UPDATE car_auction_results a
SET car_id = c.id
FROM cars c
WHERE a.car_id IS NULL AND a.car_slug = c.slug;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'car_auction_results_car_id_fkey'
  ) THEN
    ALTER TABLE car_auction_results
      ADD CONSTRAINT car_auction_results_car_id_fkey
      FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_car_auction_results_car_id ON car_auction_results(car_id);

ALTER TABLE car_auction_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "car_auction_results_select_public" ON car_auction_results;
CREATE POLICY "car_auction_results_select_public"
  ON car_auction_results FOR SELECT
  TO public
  USING (true);

-- -----------------------------
-- scrape_jobs (private/admin)
-- -----------------------------
ALTER TABLE scrape_jobs
  ADD COLUMN IF NOT EXISTS car_id UUID;

UPDATE scrape_jobs j
SET car_id = c.id
FROM cars c
WHERE j.car_id IS NULL AND j.car_slug = c.slug;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'scrape_jobs_car_id_fkey'
  ) THEN
    ALTER TABLE scrape_jobs
      ADD CONSTRAINT scrape_jobs_car_id_fkey
      FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_scrape_jobs_car_id ON scrape_jobs(car_id);

ALTER TABLE scrape_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "scrape_jobs_select_service_role" ON scrape_jobs;
CREATE POLICY "scrape_jobs_select_service_role"
  ON scrape_jobs FOR SELECT
  USING (is_service_role());

-- -----------------------------
-- car_manual_data (private/admin)
-- -----------------------------
ALTER TABLE car_manual_data
  ADD COLUMN IF NOT EXISTS car_id UUID;

UPDATE car_manual_data m
SET car_id = c.id
FROM cars c
WHERE m.car_id IS NULL AND m.car_slug = c.slug;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'car_manual_data_car_id_fkey'
  ) THEN
    ALTER TABLE car_manual_data
      ADD CONSTRAINT car_manual_data_car_id_fkey
      FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_car_manual_data_car_id ON car_manual_data(car_id);

ALTER TABLE car_manual_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "car_manual_data_select_service_role" ON car_manual_data;
CREATE POLICY "car_manual_data_select_service_role"
  ON car_manual_data FOR SELECT
  USING (is_service_role());

-- ============================================================================
-- 2) AL MESSAGE SEQUENCING FIX (race-free)
-- ============================================================================
ALTER TABLE al_conversations
  ADD COLUMN IF NOT EXISTS next_sequence_number INTEGER NOT NULL DEFAULT 1;

-- Backfill next_sequence_number for existing conversations
UPDATE al_conversations c
SET next_sequence_number = COALESCE(m.max_seq, 0) + 1
FROM (
  SELECT conversation_id, MAX(sequence_number) AS max_seq
  FROM al_messages
  GROUP BY conversation_id
) m
WHERE c.id = m.conversation_id
  AND c.next_sequence_number <= COALESCE(m.max_seq, 0);

-- Ensure per-conversation sequence is unique (needed for absolute ordering)
CREATE UNIQUE INDEX IF NOT EXISTS ux_al_messages_conversation_seq
  ON al_messages(conversation_id, sequence_number);

-- Replace add_al_message() to allocate sequence numbers safely
CREATE OR REPLACE FUNCTION add_al_message(
  p_conversation_id UUID,
  p_role TEXT,
  p_content TEXT,
  p_tool_calls TEXT[] DEFAULT '{}',
  p_credits_used INTEGER DEFAULT 0,
  p_car_context_slug TEXT DEFAULT NULL,
  p_car_context_name TEXT DEFAULT NULL,
  p_data_sources JSONB DEFAULT '[]'
)
RETURNS UUID AS $$
DECLARE
  v_message_id UUID;
  v_seq_num INTEGER;
BEGIN
  -- Lock conversation row and allocate next sequence number atomically
  SELECT next_sequence_number
  INTO v_seq_num
  FROM al_conversations
  WHERE id = p_conversation_id
  FOR UPDATE;

  IF v_seq_num IS NULL THEN
    RAISE EXCEPTION 'Conversation not found: %', p_conversation_id;
  END IF;

  INSERT INTO al_messages (
    conversation_id,
    role,
    content,
    tool_calls,
    credits_used,
    car_context_slug,
    car_context_name,
    data_sources,
    sequence_number
  )
  VALUES (
    p_conversation_id,
    p_role,
    p_content,
    p_tool_calls,
    p_credits_used,
    p_car_context_slug,
    p_car_context_name,
    p_data_sources,
    v_seq_num
  )
  RETURNING id INTO v_message_id;

  UPDATE al_conversations
  SET
    next_sequence_number = next_sequence_number + 1,
    message_count = message_count + 1,
    total_credits_used = total_credits_used + p_credits_used,
    last_message_at = NOW(),
    updated_at = NOW(),
    title = CASE
      WHEN title = 'New Conversation' AND p_role = 'user'
      THEN LEFT(p_content, 50) || CASE WHEN LENGTH(p_content) > 50 THEN '...' ELSE '' END
      ELSE title
    END
  WHERE id = p_conversation_id;

  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION add_al_message IS 'Add a message to an AL conversation with race-free sequence allocation and automatic stats update';

-- ============================================================================
-- 3) AI PROVENANCE + EMBEDDINGS (service-role only)
-- ============================================================================

-- A normalized place to store source documents (raw JSON/text + licensing)
CREATE TABLE IF NOT EXISTS source_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  source_type TEXT NOT NULL, -- e.g., 'nhtsa', 'iihs', 'epa', 'hagerty', 'bat', 'carscom', 'youtube', 'manual'
  source_url TEXT,
  source_title TEXT,
  license TEXT,

  retrieved_at TIMESTAMPTZ DEFAULT NOW(),
  checksum TEXT, -- optional: hash of raw payload to dedupe

  raw_json JSONB,
  raw_text TEXT,

  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_source_documents_source_type ON source_documents(source_type);
CREATE INDEX IF NOT EXISTS idx_source_documents_retrieved_at ON source_documents(retrieved_at DESC);
CREATE INDEX IF NOT EXISTS idx_source_documents_metadata ON source_documents USING GIN(metadata);

DROP TRIGGER IF EXISTS update_source_documents_updated_at ON source_documents;
CREATE TRIGGER update_source_documents_updated_at
  BEFORE UPDATE ON source_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Chunked, linkable units for retrieval; embeddings stored per chunk
-- NOTE: embedding dimension is fixed at 1536 (common for modern embedding models).
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  document_id UUID NOT NULL REFERENCES source_documents(id) ON DELETE CASCADE,

  -- Optional linkage to our domain entities
  car_id UUID REFERENCES cars(id) ON DELETE SET NULL,
  car_slug TEXT, -- denormalized for convenience

  chunk_index INTEGER NOT NULL DEFAULT 0,
  chunk_text TEXT NOT NULL,
  chunk_tokens INTEGER,
  topic TEXT, -- e.g., 'reliability', 'pricing', 'track', 'ownership', 'maintenance'

  embedding_model TEXT,
  embedding vector(1536),

  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT ux_document_chunks_doc_idx UNIQUE (document_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_car_id ON document_chunks(car_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_topic ON document_chunks(topic);
CREATE INDEX IF NOT EXISTS idx_document_chunks_metadata ON document_chunks USING GIN(metadata);

-- Vector index (IVFFLAT) for similarity search
-- NOTE: ivfflat works best after the table has data and ANALYZE has been run.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_document_chunks_embedding_ivfflat'
  ) THEN
    EXECUTE 'CREATE INDEX idx_document_chunks_embedding_ivfflat ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)';
  END IF;
EXCEPTION
  WHEN undefined_column THEN
    RAISE NOTICE 'Skipping vector index creation (embedding column missing).';
  WHEN undefined_object THEN
    RAISE NOTICE 'Skipping vector index creation (vector extension not available).';
END $$;

DROP TRIGGER IF EXISTS update_document_chunks_updated_at ON document_chunks;
CREATE TRIGGER update_document_chunks_updated_at
  BEFORE UPDATE ON document_chunks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS: service role only (AI-AL server-side)
ALTER TABLE source_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "source_documents_service_role_all" ON source_documents;
CREATE POLICY "source_documents_service_role_all"
  ON source_documents FOR ALL
  USING (is_service_role());

DROP POLICY IF EXISTS "document_chunks_service_role_all" ON document_chunks;
CREATE POLICY "document_chunks_service_role_all"
  ON document_chunks FOR ALL
  USING (is_service_role());

-- Similarity search RPC for AI-AL
CREATE OR REPLACE FUNCTION search_document_chunks(
  p_embedding vector(1536),
  p_car_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 8
)
RETURNS TABLE (
  chunk_id UUID,
  document_id UUID,
  car_id UUID,
  chunk_text TEXT,
  topic TEXT,
  source_type TEXT,
  source_url TEXT,
  similarity REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id AS chunk_id,
    dc.document_id,
    dc.car_id,
    dc.chunk_text,
    dc.topic,
    sd.source_type,
    sd.source_url,
    (1 - (dc.embedding <=> p_embedding))::REAL AS similarity
  FROM document_chunks dc
  JOIN source_documents sd ON sd.id = dc.document_id
  WHERE dc.embedding IS NOT NULL
    AND (p_car_id IS NULL OR dc.car_id = p_car_id)
  ORDER BY dc.embedding <=> p_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION search_document_chunks IS 'Vector similarity search over embedded document chunks (service role only)';

-- ============================================================================
-- 4) AI-OPTIMIZED CONTEXT RPC (single JSON blob, minimizes query chatter)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_car_ai_context(p_car_slug TEXT)
RETURNS JSONB AS $$
DECLARE
  v_car_id UUID;
  v_result JSONB;
BEGIN
  SELECT id INTO v_car_id FROM cars WHERE slug = p_car_slug;
  IF v_car_id IS NULL THEN
    RETURN jsonb_build_object('error', 'car_not_found', 'car_slug', p_car_slug);
  END IF;

  SELECT jsonb_build_object(
    'car', to_jsonb(c),
    'fuelEconomy', (SELECT to_jsonb(f) FROM car_fuel_economy f WHERE f.car_id = v_car_id OR f.car_slug = p_car_slug LIMIT 1),
    'safety', (SELECT to_jsonb(s) FROM car_safety_data s WHERE s.car_id = v_car_id OR s.car_slug = p_car_slug LIMIT 1),
    'marketPricing', (SELECT to_jsonb(p) FROM car_market_pricing p WHERE p.car_id = v_car_id OR p.car_slug = p_car_slug LIMIT 1),
    'priceHistorySample', (
      SELECT COALESCE(jsonb_agg(to_jsonb(h) ORDER BY h.recorded_at DESC), '[]'::jsonb)
      FROM (
        SELECT *
        FROM car_price_history h
        WHERE (h.car_id = v_car_id OR h.car_slug = p_car_slug)
        ORDER BY h.recorded_at DESC
        LIMIT 24
      ) h
    ),
    'recallsSample', (
      SELECT COALESCE(jsonb_agg(to_jsonb(r) ORDER BY r.report_received_date DESC NULLS LAST), '[]'::jsonb)
      FROM (
        SELECT *
        FROM car_recalls r
        WHERE (r.car_id = v_car_id OR r.car_slug = p_car_slug)
        ORDER BY r.report_received_date DESC NULLS LAST
        LIMIT 20
      ) r
    ),
    'expertReviewsSample', (
      SELECT COALESCE(jsonb_agg(to_jsonb(er) ORDER BY er.review_date DESC NULLS LAST), '[]'::jsonb)
      FROM (
        SELECT *
        FROM car_expert_reviews er
        WHERE (er.car_id = v_car_id OR er.car_slug = p_car_slug)
        ORDER BY er.review_date DESC NULLS LAST
        LIMIT 10
      ) er
    ),
    'youtube', jsonb_build_object(
      'videoCount', (SELECT COUNT(*) FROM youtube_video_car_links y WHERE y.car_id = v_car_id OR y.car_slug = p_car_slug),
      'topVideos', (
        SELECT COALESCE(jsonb_agg(to_jsonb(v) ORDER BY v.quality_score DESC NULLS LAST), '[]'::jsonb)
        FROM (
          SELECT yv.video_id, yv.url, yv.title, yv.channel_name, yv.published_at, yv.content_type, yv.one_line_take, yv.quality_score
          FROM youtube_video_car_links yl
          JOIN youtube_videos yv ON yv.video_id = yl.video_id
          WHERE yl.car_id = v_car_id OR yl.car_slug = p_car_slug
            AND yv.processing_status = 'processed'
            AND yv.is_hidden = false
          ORDER BY yv.quality_score DESC NULLS LAST, yv.published_at DESC NULLS LAST
          LIMIT 5
        ) v
      )
    ),
    'knownIssuesCount', (SELECT COUNT(*) FROM car_known_issues ki WHERE ki.car_slug = p_car_slug),
    'issuesCount', (SELECT COUNT(*) FROM car_issues i WHERE i.car_id = v_car_id),
    'maintenanceSummary', (SELECT get_car_maintenance_summary(p_car_slug))
  )
  INTO v_result
  FROM cars c
  WHERE c.id = v_car_id;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION get_car_ai_context IS 'Returns a single JSON blob with car + enrichment + media summaries optimized for AI context building';

-- ============================================================================
-- 4b) MEDIA TABLES: ADD car_id (non-breaking)
-- ============================================================================

-- car_images: link by cars.id for faster joins and future-proofing
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'car_images') THEN
    EXECUTE 'ALTER TABLE car_images ADD COLUMN IF NOT EXISTS car_id UUID';
    EXECUTE '
      UPDATE car_images ci
      SET car_id = c.id
      FROM cars c
      WHERE ci.car_id IS NULL
        AND ci.car_slug IS NOT NULL
        AND ci.car_slug = c.slug
    ';

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.table_constraints
      WHERE constraint_name = 'car_images_car_id_fkey'
    ) THEN
      EXECUTE 'ALTER TABLE car_images
        ADD CONSTRAINT car_images_car_id_fkey
        FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE SET NULL';
    END IF;

    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_car_images_car_id ON car_images(car_id)';
  END IF;
END $$;

-- youtube_video_car_links: add car_id alongside car_slug
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'youtube_video_car_links') THEN
    EXECUTE 'ALTER TABLE youtube_video_car_links ADD COLUMN IF NOT EXISTS car_id UUID';
    EXECUTE '
      UPDATE youtube_video_car_links l
      SET car_id = c.id
      FROM cars c
      WHERE l.car_id IS NULL
        AND l.car_slug = c.slug
    ';

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.table_constraints
      WHERE constraint_name = 'youtube_video_car_links_car_id_fkey'
    ) THEN
      EXECUTE 'ALTER TABLE youtube_video_car_links
        ADD CONSTRAINT youtube_video_car_links_car_id_fkey
        FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE';
    END IF;

    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_youtube_video_car_links_car_id ON youtube_video_car_links(car_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_youtube_video_car_links_car_id_role ON youtube_video_car_links(car_id, role)';
  END IF;
END $$;

-- youtube_ingestion_queue: optional target_car_id for faster pipelines
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'youtube_ingestion_queue') THEN
    EXECUTE 'ALTER TABLE youtube_ingestion_queue ADD COLUMN IF NOT EXISTS target_car_id UUID';
    EXECUTE '
      UPDATE youtube_ingestion_queue q
      SET target_car_id = c.id
      FROM cars c
      WHERE q.target_car_id IS NULL
        AND q.target_car_slug IS NOT NULL
        AND q.target_car_slug = c.slug
    ';

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.table_constraints
      WHERE constraint_name = 'youtube_ingestion_queue_target_car_id_fkey'
    ) THEN
      EXECUTE 'ALTER TABLE youtube_ingestion_queue
        ADD CONSTRAINT youtube_ingestion_queue_target_car_id_fkey
        FOREIGN KEY (target_car_id) REFERENCES cars(id) ON DELETE SET NULL';
    END IF;

    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_youtube_ingestion_queue_target_car_id ON youtube_ingestion_queue(target_car_id)';
  END IF;
END $$;

-- user_gallery_images: add car_id for faster joins (still keep car_slug)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_gallery_images') THEN
    EXECUTE 'ALTER TABLE user_gallery_images ADD COLUMN IF NOT EXISTS car_id UUID';
    EXECUTE '
      UPDATE user_gallery_images g
      SET car_id = c.id
      FROM cars c
      WHERE g.car_id IS NULL
        AND g.car_slug = c.slug
    ';

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.table_constraints
      WHERE constraint_name = 'user_gallery_images_car_id_fkey'
    ) THEN
      EXECUTE 'ALTER TABLE user_gallery_images
        ADD CONSTRAINT user_gallery_images_car_id_fkey
        FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE SET NULL';
    END IF;

    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_user_gallery_images_car_id ON user_gallery_images(car_id)';
  END IF;
END $$;

-- ============================================================================
-- 5) HIGH-WRITE TABLE HELPERS (cheap improvements now)
-- ============================================================================
-- BRIN indexes help keep append-only time-series tables fast as they grow.
DO $$
BEGIN
  -- These may already exist as BTREE; BRIN is additive and helps large tables.
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'al_messages') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS brin_al_messages_created_at ON al_messages USING brin(created_at)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'al_usage_logs') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS brin_al_usage_logs_created_at ON al_usage_logs USING brin(created_at)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_activity') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS brin_user_activity_created_at ON user_activity USING brin(created_at)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_feedback') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS brin_user_feedback_created_at ON user_feedback USING brin(created_at)';
  END IF;
EXCEPTION
  WHEN others THEN
    -- Avoid hard failure in environments that restrict certain index types.
    RAISE NOTICE 'Skipping BRIN index creation due to: %', SQLERRM;
END $$;

-- ============================================================================
-- 6) UNIFIED CAR ISSUES (canonical) + BACKFILL (non-breaking)
-- ============================================================================
-- Purpose: prevent drift between car_known_issues and vehicle_known_issues by
-- providing a single canonical table for reliability/ownership issues.

DO $$ BEGIN
  CREATE TYPE car_issue_severity AS ENUM (
    'critical',
    'high',
    'medium',
    'low',
    'cosmetic',
    'unknown'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE car_issue_kind AS ENUM (
    'common_issue',
    'recall',
    'tsb',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS car_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Canonical linkage
  car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,

  -- Transitional linkage (keep while app still uses slugs heavily)
  car_slug TEXT,

  -- Classification
  kind car_issue_kind NOT NULL DEFAULT 'common_issue',
  severity car_issue_severity NOT NULL DEFAULT 'unknown',

  -- Issue identity
  title TEXT NOT NULL,
  description TEXT,

  -- Diagnostics
  symptoms TEXT[],
  prevention TEXT,
  fix_description TEXT,

  -- Year applicability
  affected_years_text TEXT, -- e.g. "2009-2011" / "All"
  affected_year_start INTEGER,
  affected_year_end INTEGER,

  -- Cost (optional structured)
  estimated_cost_text TEXT,
  estimated_cost_low INTEGER,
  estimated_cost_high INTEGER,

  -- Provenance
  source_type TEXT,      -- forum, tsb, nhtsa, youtube, manual, etc.
  source_url TEXT,
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),

  -- Display ordering
  sort_order INTEGER DEFAULT 0,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Basic de-duplication per car
  CONSTRAINT ux_car_issues_car_title UNIQUE (car_id, title)
);

CREATE INDEX IF NOT EXISTS idx_car_issues_car_id ON car_issues(car_id);
CREATE INDEX IF NOT EXISTS idx_car_issues_kind ON car_issues(kind);
CREATE INDEX IF NOT EXISTS idx_car_issues_severity ON car_issues(severity);
CREATE INDEX IF NOT EXISTS idx_car_issues_year_range ON car_issues(affected_year_start, affected_year_end);
CREATE INDEX IF NOT EXISTS idx_car_issues_metadata ON car_issues USING GIN(metadata);

DROP TRIGGER IF EXISTS update_car_issues_updated_at ON car_issues;
CREATE TRIGGER update_car_issues_updated_at
  BEFORE UPDATE ON car_issues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Public read (safe, high-value content)
ALTER TABLE car_issues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "car_issues_select_public" ON car_issues;
CREATE POLICY "car_issues_select_public"
  ON car_issues FOR SELECT
  TO public
  USING (true);

-- Backfill from car_known_issues (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'car_known_issues') THEN
    INSERT INTO car_issues (
      car_id,
      car_slug,
      kind,
      severity,
      title,
      description,
      symptoms,
      prevention,
      fix_description,
      affected_years_text,
      estimated_cost_text,
      source_type,
      sort_order,
      metadata
    )
    SELECT
      c.id AS car_id,
      ki.car_slug,
      'common_issue'::car_issue_kind,
      CASE ki.severity
        WHEN 'Critical' THEN 'critical'::car_issue_severity
        WHEN 'Major' THEN 'high'::car_issue_severity
        WHEN 'Minor' THEN 'medium'::car_issue_severity
        WHEN 'Cosmetic' THEN 'cosmetic'::car_issue_severity
        ELSE 'unknown'::car_issue_severity
      END AS severity,
      ki.issue_name AS title,
      ki.description,
      NULL::TEXT[] AS symptoms,
      ki.prevention,
      ki.fix_description,
      ki.affected_years,
      ki.estimated_cost,
      ki.source,
      ki.sort_order,
      jsonb_build_object('legacy_table', 'car_known_issues')
    FROM car_known_issues ki
    JOIN cars c ON c.slug = ki.car_slug
    ON CONFLICT (car_id, title) DO NOTHING;
  END IF;
END $$;

-- Backfill from vehicle_known_issues (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicle_known_issues') THEN
    INSERT INTO car_issues (
      car_id,
      car_slug,
      kind,
      severity,
      title,
      description,
      symptoms,
      fix_description,
      affected_years_text,
      estimated_cost_low,
      estimated_cost_high,
      source_url,
      sort_order,
      metadata
    )
    SELECT
      c.id AS car_id,
      vki.car_slug,
      CASE vki.issue_type
        WHEN 'Recall' THEN 'recall'::car_issue_kind
        WHEN 'TSB' THEN 'tsb'::car_issue_kind
        WHEN 'Common Issue' THEN 'common_issue'::car_issue_kind
        ELSE 'other'::car_issue_kind
      END AS kind,
      CASE vki.severity
        WHEN 'Critical' THEN 'critical'::car_issue_severity
        WHEN 'High' THEN 'high'::car_issue_severity
        WHEN 'Medium' THEN 'medium'::car_issue_severity
        WHEN 'Low' THEN 'low'::car_issue_severity
        ELSE 'unknown'::car_issue_severity
      END AS severity,
      vki.issue_title AS title,
      vki.issue_description AS description,
      vki.symptoms,
      vki.fix_description,
      vki.affected_years,
      vki.estimated_repair_cost_low,
      vki.estimated_repair_cost_high,
      vki.source_url,
      0,
      jsonb_build_object(
        'legacy_table', 'vehicle_known_issues',
        'recall_number', vki.recall_number,
        'tsb_number', vki.tsb_number,
        'nhtsa_campaign_number', vki.nhtsa_campaign_number,
        'diy_difficulty', vki.diy_difficulty
      )
    FROM vehicle_known_issues vki
    JOIN cars c ON c.slug = vki.car_slug
    ON CONFLICT (car_id, title) DO NOTHING;
  END IF;
END $$;














