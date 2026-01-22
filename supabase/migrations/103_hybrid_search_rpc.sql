-- ============================================================================
-- Migration: 103_hybrid_search_rpc.sql
-- Purpose: Add keyword search RPC for document chunks to enable hybrid search
--
-- This migration adds:
--   1. search_document_chunks_keyword - Full-text search over document chunks
--   2. GIN index on document_chunks for efficient FTS
--
-- Combined with the existing search_document_chunks (vector search), this
-- enables Reciprocal Rank Fusion (RRF) for improved retrieval quality.
-- ============================================================================

-- ============================================================================
-- 1. ADD GIN INDEX FOR FULL-TEXT SEARCH
-- ============================================================================

-- Create GIN index on chunk_text for efficient full-text search
-- Using english configuration for stemming and stop words
CREATE INDEX IF NOT EXISTS idx_document_chunks_text_search
ON document_chunks
USING GIN (to_tsvector('english', chunk_text));

-- Also index the topic field for filtering
CREATE INDEX IF NOT EXISTS idx_document_chunks_topic_text_search
ON document_chunks
USING GIN (to_tsvector('english', COALESCE(topic, '')));

-- ============================================================================
-- 2. CREATE KEYWORD SEARCH RPC FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION search_document_chunks_keyword(
  p_query TEXT,
  p_car_id UUID DEFAULT NULL,
  p_topic TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  chunk_id UUID,
  document_id UUID,
  car_id UUID,
  chunk_text TEXT,
  topic TEXT,
  source_type TEXT,
  source_url TEXT,
  source_title TEXT,
  rank REAL,
  headline TEXT,
  metadata JSONB
) AS $$
DECLARE
  v_tsquery TSQUERY;
BEGIN
  -- Build the tsquery from the search terms
  -- Using plainto_tsquery for natural language queries
  v_tsquery := plainto_tsquery('english', p_query);
  
  -- If the query is empty or produces no valid tsquery, return empty
  IF v_tsquery IS NULL OR v_tsquery = ''::tsquery THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    dc.id AS chunk_id,
    dc.document_id,
    dc.car_id,
    dc.chunk_text,
    dc.topic,
    sd.source_type,
    sd.source_url,
    sd.source_title,
    ts_rank_cd(
      to_tsvector('english', dc.chunk_text),
      v_tsquery,
      32  -- Normalize by document length
    ) AS rank,
    ts_headline(
      'english',
      dc.chunk_text,
      v_tsquery,
      'StartSel=<mark>, StopSel=</mark>, MaxWords=35, MinWords=15, MaxFragments=2'
    ) AS headline,
    dc.metadata
  FROM document_chunks dc
  JOIN source_documents sd ON sd.id = dc.document_id
  WHERE 
    to_tsvector('english', dc.chunk_text) @@ v_tsquery
    AND (p_car_id IS NULL OR dc.car_id = p_car_id)
    AND (p_topic IS NULL OR dc.topic ILIKE '%' || p_topic || '%')
  ORDER BY rank DESC
  LIMIT LEAST(p_limit, 50);  -- Cap at 50 for safety
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION search_document_chunks_keyword TO service_role;

-- Add function comment
COMMENT ON FUNCTION search_document_chunks_keyword IS 
  'Full-text keyword search over document_chunks table. Use in combination with '
  'search_document_chunks (vector search) for hybrid retrieval with RRF fusion.';

-- ============================================================================
-- 3. CREATE HYBRID SEARCH CONVENIENCE FUNCTION (OPTIONAL)
-- 
-- This function performs both vector and keyword search and returns
-- combined results. Can be used if you want to do fusion in SQL rather
-- than in application code.
-- ============================================================================

CREATE OR REPLACE FUNCTION search_document_chunks_hybrid(
  p_query TEXT,
  p_embedding vector(1536),
  p_car_id UUID DEFAULT NULL,
  p_topic TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 10,
  p_vector_weight REAL DEFAULT 0.5,  -- Weight for vector search (0-1)
  p_keyword_weight REAL DEFAULT 0.5  -- Weight for keyword search (0-1)
)
RETURNS TABLE (
  chunk_id UUID,
  document_id UUID,
  car_id UUID,
  chunk_text TEXT,
  topic TEXT,
  source_type TEXT,
  source_url TEXT,
  source_title TEXT,
  vector_similarity REAL,
  keyword_rank REAL,
  combined_score REAL,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH 
  -- Vector search results
  vector_results AS (
    SELECT 
      dc.id AS chunk_id,
      dc.document_id,
      dc.car_id,
      dc.chunk_text,
      dc.topic,
      sd.source_type,
      sd.source_url,
      sd.source_title,
      (1 - (dc.embedding <=> p_embedding)) AS similarity,
      dc.metadata
    FROM document_chunks dc
    JOIN source_documents sd ON sd.id = dc.document_id
    WHERE 
      dc.embedding IS NOT NULL
      AND (p_car_id IS NULL OR dc.car_id = p_car_id)
      AND (p_topic IS NULL OR dc.topic ILIKE '%' || p_topic || '%')
    ORDER BY dc.embedding <=> p_embedding
    LIMIT LEAST(p_limit * 3, 50)
  ),
  -- Keyword search results
  keyword_results AS (
    SELECT 
      dc.id AS chunk_id,
      dc.document_id,
      dc.car_id,
      dc.chunk_text,
      dc.topic,
      sd.source_type,
      sd.source_url,
      sd.source_title,
      ts_rank_cd(
        to_tsvector('english', dc.chunk_text),
        plainto_tsquery('english', p_query),
        32
      ) AS rank,
      dc.metadata
    FROM document_chunks dc
    JOIN source_documents sd ON sd.id = dc.document_id
    WHERE 
      to_tsvector('english', dc.chunk_text) @@ plainto_tsquery('english', p_query)
      AND (p_car_id IS NULL OR dc.car_id = p_car_id)
      AND (p_topic IS NULL OR dc.topic ILIKE '%' || p_topic || '%')
    ORDER BY rank DESC
    LIMIT LEAST(p_limit * 3, 50)
  ),
  -- Combine with RRF-style scoring
  combined AS (
    SELECT 
      COALESCE(v.chunk_id, k.chunk_id) AS chunk_id,
      COALESCE(v.document_id, k.document_id) AS document_id,
      COALESCE(v.car_id, k.car_id) AS car_id,
      COALESCE(v.chunk_text, k.chunk_text) AS chunk_text,
      COALESCE(v.topic, k.topic) AS topic,
      COALESCE(v.source_type, k.source_type) AS source_type,
      COALESCE(v.source_url, k.source_url) AS source_url,
      COALESCE(v.source_title, k.source_title) AS source_title,
      COALESCE(v.similarity, 0)::REAL AS vector_similarity,
      COALESCE(k.rank, 0)::REAL AS keyword_rank,
      -- Combined score using weighted sum (normalized)
      (
        p_vector_weight * COALESCE(v.similarity, 0) +
        p_keyword_weight * COALESCE(k.rank, 0) * 10  -- Scale keyword rank
      )::REAL AS combined_score,
      COALESCE(v.metadata, k.metadata) AS metadata
    FROM vector_results v
    FULL OUTER JOIN keyword_results k ON v.chunk_id = k.chunk_id
  )
  SELECT * FROM combined
  ORDER BY combined_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION search_document_chunks_hybrid TO service_role;

-- Add function comment
COMMENT ON FUNCTION search_document_chunks_hybrid IS 
  'Hybrid search combining vector similarity and keyword matching with weighted scoring. '
  'Useful for improving retrieval quality over vector-only or keyword-only search.';

-- ============================================================================
-- 4. SIMILAR FUNCTION FOR COMMUNITY INSIGHTS (IF TABLE EXISTS)
-- ============================================================================

DO $$
BEGIN
  -- Check if community_insights table exists before creating function
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'community_insights'
  ) THEN
    EXECUTE $func$
      CREATE OR REPLACE FUNCTION search_community_insights_keyword(
        p_query TEXT,
        p_car_id UUID DEFAULT NULL,
        p_insight_types TEXT[] DEFAULT NULL,
        p_limit INTEGER DEFAULT 10
      )
      RETURNS TABLE (
        insight_id UUID,
        car_id UUID,
        title TEXT,
        summary TEXT,
        details TEXT,
        insight_type TEXT,
        confidence REAL,
        source_forum TEXT,
        source_url TEXT,
        rank REAL
      ) AS $inner$
      DECLARE
        v_tsquery TSQUERY;
      BEGIN
        v_tsquery := plainto_tsquery('english', p_query);
        
        IF v_tsquery IS NULL OR v_tsquery = ''::tsquery THEN
          RETURN;
        END IF;

        RETURN QUERY
        SELECT
          ci.id AS insight_id,
          ci.car_id,
          ci.title,
          ci.summary,
          ci.details,
          ci.insight_type,
          ci.confidence,
          ci.source_forum,
          ci.source_url,
          ts_rank_cd(
            to_tsvector('english', COALESCE(ci.title, '') || ' ' || COALESCE(ci.summary, '') || ' ' || COALESCE(ci.details, '')),
            v_tsquery,
            32
          ) AS rank
        FROM community_insights ci
        WHERE 
          to_tsvector('english', COALESCE(ci.title, '') || ' ' || COALESCE(ci.summary, '') || ' ' || COALESCE(ci.details, '')) @@ v_tsquery
          AND (p_car_id IS NULL OR ci.car_id = p_car_id)
          AND (p_insight_types IS NULL OR ci.insight_type = ANY(p_insight_types))
        ORDER BY rank DESC
        LIMIT LEAST(p_limit, 30);
      END;
      $inner$ LANGUAGE plpgsql SECURITY DEFINER;
      
      GRANT EXECUTE ON FUNCTION search_community_insights_keyword TO service_role;
      
      COMMENT ON FUNCTION search_community_insights_keyword IS 
        'Full-text keyword search over community_insights table for hybrid retrieval.';
    $func$;
  END IF;
END;
$$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify functions exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'search_document_chunks_keyword'
  ) THEN
    RAISE EXCEPTION 'search_document_chunks_keyword function was not created';
  END IF;
  
  RAISE NOTICE 'Migration 103_hybrid_search_rpc.sql completed successfully';
END;
$$;
