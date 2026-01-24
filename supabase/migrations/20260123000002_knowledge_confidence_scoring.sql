-- Knowledge Confidence Scoring
-- Adds confidence levels to document chunks for quality-aware RAG

-- =============================================================================
-- ADD CONFIDENCE COLUMNS
-- =============================================================================

-- Add confidence_level to document_chunks
-- Ranges from 0.0 to 1.0, with semantic meaning:
-- 1.0: Official manufacturer data, highly authoritative
-- 0.9: Expert-verified content, professional sources
-- 0.7: Curated database content (default)
-- 0.5: Community-contributed, user-generated
-- 0.3: Unverified/scraped, needs review

ALTER TABLE document_chunks 
ADD COLUMN IF NOT EXISTS confidence_level NUMERIC(3,2) DEFAULT 0.7
  CHECK (confidence_level >= 0.0 AND confidence_level <= 1.0);

-- Add last_verified_at for content freshness tracking
ALTER TABLE document_chunks 
ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ;

-- Add source_type to source_documents for confidence inference
ALTER TABLE source_documents 
ADD COLUMN IF NOT EXISTS source_confidence NUMERIC(3,2) DEFAULT 0.7
  CHECK (source_confidence >= 0.0 AND source_confidence <= 1.0);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Index for confidence-aware queries
CREATE INDEX IF NOT EXISTS idx_document_chunks_confidence 
  ON document_chunks(confidence_level DESC);

-- Composite index for confidence-filtered vector search
CREATE INDEX IF NOT EXISTS idx_document_chunks_confidence_car 
  ON document_chunks(car_id, confidence_level DESC) 
  WHERE car_id IS NOT NULL;

-- =============================================================================
-- UPDATE SEARCH FUNCTION
-- =============================================================================

-- Enhanced search function that considers confidence
CREATE OR REPLACE FUNCTION search_document_chunks_with_confidence(
  p_embedding vector(1536),
  p_car_id UUID DEFAULT NULL,
  p_min_confidence NUMERIC DEFAULT 0.5,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  chunk_id UUID,
  source_id UUID,
  chunk_text TEXT,
  similarity FLOAT,
  confidence_level NUMERIC,
  topic TEXT,
  source_type TEXT,
  source_url TEXT,
  last_verified_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    dc.id as chunk_id,
    dc.source_id,
    dc.chunk_text,
    1 - (dc.embedding <=> p_embedding) as similarity,
    dc.confidence_level,
    sd.topic,
    sd.source_type,
    sd.source_url,
    dc.last_verified_at
  FROM document_chunks dc
  JOIN source_documents sd ON dc.source_id = sd.id
  WHERE 
    dc.embedding IS NOT NULL
    AND dc.confidence_level >= p_min_confidence
    AND (p_car_id IS NULL OR dc.car_id = p_car_id)
  ORDER BY dc.embedding <=> p_embedding
  LIMIT p_limit;
$$;

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Update confidence level for a document
CREATE OR REPLACE FUNCTION update_document_confidence(
  p_source_id UUID,
  p_confidence_level NUMERIC
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update source document
  UPDATE source_documents 
  SET source_confidence = p_confidence_level
  WHERE id = p_source_id;
  
  -- Update all chunks from this source
  UPDATE document_chunks 
  SET 
    confidence_level = p_confidence_level,
    last_verified_at = NOW()
  WHERE source_id = p_source_id;
END;
$$;

-- Mark chunks as verified (updates timestamp without changing confidence)
CREATE OR REPLACE FUNCTION mark_chunks_verified(
  p_source_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE document_chunks 
  SET last_verified_at = NOW()
  WHERE source_id = p_source_id;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- Get documents needing verification (not verified in X days)
CREATE OR REPLACE FUNCTION get_stale_documents(
  p_days INTEGER DEFAULT 90
)
RETURNS TABLE (
  source_id UUID,
  source_url TEXT,
  source_type TEXT,
  topic TEXT,
  chunk_count BIGINT,
  avg_confidence NUMERIC,
  oldest_verification TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    sd.id as source_id,
    sd.source_url,
    sd.source_type,
    sd.topic,
    COUNT(dc.id) as chunk_count,
    AVG(dc.confidence_level) as avg_confidence,
    MIN(dc.last_verified_at) as oldest_verification
  FROM source_documents sd
  JOIN document_chunks dc ON dc.source_id = sd.id
  WHERE 
    dc.last_verified_at IS NULL 
    OR dc.last_verified_at < NOW() - (p_days || ' days')::INTERVAL
  GROUP BY sd.id, sd.source_url, sd.source_type, sd.topic
  ORDER BY MIN(dc.last_verified_at) NULLS FIRST
  LIMIT 100;
$$;

-- =============================================================================
-- SET DEFAULT CONFIDENCE BY SOURCE TYPE
-- =============================================================================

-- Set confidence levels based on source type for existing data
DO $$
BEGIN
  -- Official manufacturer data
  UPDATE document_chunks dc
  SET confidence_level = 1.0
  FROM source_documents sd
  WHERE dc.source_id = sd.id
    AND sd.source_type IN ('manufacturer', 'official', 'oem');

  -- Expert/professional sources
  UPDATE document_chunks dc
  SET confidence_level = 0.9
  FROM source_documents sd
  WHERE dc.source_id = sd.id
    AND sd.source_type IN ('expert_review', 'professional', 'verified');

  -- Curated content (default)
  UPDATE document_chunks dc
  SET confidence_level = 0.7
  FROM source_documents sd
  WHERE dc.source_id = sd.id
    AND sd.source_type IN ('database', 'curated', 'editorial')
    AND dc.confidence_level = 0.7;

  -- Community content
  UPDATE document_chunks dc
  SET confidence_level = 0.5
  FROM source_documents sd
  WHERE dc.source_id = sd.id
    AND sd.source_type IN ('community', 'forum', 'user_generated');

  -- Scraped/unverified content
  UPDATE document_chunks dc
  SET confidence_level = 0.3
  FROM source_documents sd
  WHERE dc.source_id = sd.id
    AND sd.source_type IN ('scraped', 'unverified', 'external');
END $$;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON COLUMN document_chunks.confidence_level IS 'Content confidence score 0.0-1.0. Higher = more authoritative source.';
COMMENT ON COLUMN document_chunks.last_verified_at IS 'When this content was last verified for accuracy.';
COMMENT ON COLUMN source_documents.source_confidence IS 'Default confidence level for chunks from this source.';
COMMENT ON FUNCTION search_document_chunks_with_confidence IS 'Vector search with minimum confidence filtering.';
