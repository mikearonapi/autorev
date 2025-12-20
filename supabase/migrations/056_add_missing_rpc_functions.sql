-- ============================================================================
-- Migration: 056_add_missing_rpc_functions.sql
-- Purpose: Add missing RPC functions identified in database audit
-- Date: December 18, 2024
-- ============================================================================

-- ============================================================================
-- 1) search_document_chunks - Vector similarity search for AL knowledge base
-- ============================================================================

-- Create the function if it doesn't exist
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
  similarity REAL,
  metadata JSONB
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
    (1 - (dc.embedding <=> p_embedding))::REAL AS similarity,
    COALESCE(sd.metadata, '{}'::JSONB) AS metadata
  FROM document_chunks dc
  JOIN source_documents sd ON sd.id = dc.document_id
  WHERE dc.embedding IS NOT NULL
    AND (p_car_id IS NULL OR dc.car_id = p_car_id)
  ORDER BY dc.embedding <=> p_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION search_document_chunks IS 'Vector similarity search over embedded document chunks for AL knowledge base (service role only)';

-- ============================================================================
-- 2) search_cars_fts - Full-text search for cars (alias for consistency)
-- Note: search_cars_fulltext already exists, but some code may call search_cars_fts
-- ============================================================================

-- Create search_cars_fts as an alias/wrapper if it doesn't exist
-- This ensures both function names work
DO $$
BEGIN
  -- Check if search_cars_fts doesn't already exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'search_cars_fts'
  ) THEN
    EXECUTE $func$
      CREATE OR REPLACE FUNCTION search_cars_fts(
        search_query TEXT,
        max_results INTEGER DEFAULT 10
      )
      RETURNS TABLE (
        slug TEXT,
        name TEXT,
        years TEXT,
        hp INTEGER,
        price_range TEXT,
        engine TEXT,
        category TEXT,
        highlight TEXT,
        rank REAL
      ) AS $inner$
      BEGIN
        RETURN QUERY
        SELECT 
          c.slug,
          c.name,
          c.years,
          c.hp,
          c.price_range,
          c.engine,
          c.category,
          c.highlight,
          ts_rank(c.search_vector, plainto_tsquery('english', search_query)) as rank
        FROM cars c
        WHERE c.search_vector @@ plainto_tsquery('english', search_query)
        ORDER BY rank DESC
        LIMIT max_results;
      END;
      $inner$ LANGUAGE plpgsql STABLE;
    $func$;
    
    COMMENT ON FUNCTION search_cars_fts IS 'Full-text search across cars table with relevance ranking';
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run these queries to verify the functions were created:
-- SELECT routine_name FROM information_schema.routines 
--   WHERE routine_schema = 'public' AND routine_name IN ('search_document_chunks', 'search_cars_fts');








