-- ============================================================================
-- CONTINUOUS LEARNING FOUNDATION
-- AutoRev - Scale AI-style continuous improvement infrastructure
--
-- This migration:
--   1. EXTENDS user_feedback with AL-specific dimension ratings and snapshots
--   2. EXTENDS al_usage_logs with prompt_version_id for A/B tracking
--   3. CREATES al_content_gaps for tracking detected knowledge gaps
--   4. CREATES al_prompt_versions for prompt A/B testing
--   5. CREATES al_evaluation_runs for evaluation run metadata
--   6. CREATES al_evaluation_results for individual test case results
--
-- Safety:
--   - All new columns are nullable (backward compatible)
--   - No column renames or drops
--   - Additive changes only
-- ============================================================================

-- ============================================================================
-- 1. EXTEND user_feedback TABLE
-- Add AL-specific feedback dimensions and snapshots for RLHF export
-- ============================================================================

-- Proper FK to al_conversations (instead of storing in browser_info JSONB)
ALTER TABLE user_feedback
ADD COLUMN IF NOT EXISTS al_conversation_id UUID REFERENCES al_conversations(id) ON DELETE SET NULL;

-- Proper FK to al_messages
ALTER TABLE user_feedback
ADD COLUMN IF NOT EXISTS al_message_id UUID REFERENCES al_messages(id) ON DELETE SET NULL;

-- Multi-dimensional ratings (1-5 scale)
ALTER TABLE user_feedback
ADD COLUMN IF NOT EXISTS accuracy_rating INTEGER;

ALTER TABLE user_feedback
ADD COLUMN IF NOT EXISTS completeness_rating INTEGER;

ALTER TABLE user_feedback
ADD COLUMN IF NOT EXISTS relevance_rating INTEGER;

ALTER TABLE user_feedback
ADD COLUMN IF NOT EXISTS actionability_rating INTEGER;

-- Denormalized snapshots for RLHF data export (avoids JOINs, preserves historical context)
ALTER TABLE user_feedback
ADD COLUMN IF NOT EXISTS user_prompt_snapshot TEXT;

ALTER TABLE user_feedback
ADD COLUMN IF NOT EXISTS assistant_response_snapshot TEXT;

-- Add constraints for dimension ratings (1-5 scale)
ALTER TABLE user_feedback
DROP CONSTRAINT IF EXISTS user_feedback_accuracy_rating_check;
ALTER TABLE user_feedback
ADD CONSTRAINT user_feedback_accuracy_rating_check 
CHECK (accuracy_rating IS NULL OR (accuracy_rating >= 1 AND accuracy_rating <= 5));

ALTER TABLE user_feedback
DROP CONSTRAINT IF EXISTS user_feedback_completeness_rating_check;
ALTER TABLE user_feedback
ADD CONSTRAINT user_feedback_completeness_rating_check 
CHECK (completeness_rating IS NULL OR (completeness_rating >= 1 AND completeness_rating <= 5));

ALTER TABLE user_feedback
DROP CONSTRAINT IF EXISTS user_feedback_relevance_rating_check;
ALTER TABLE user_feedback
ADD CONSTRAINT user_feedback_relevance_rating_check 
CHECK (relevance_rating IS NULL OR (relevance_rating >= 1 AND relevance_rating <= 5));

ALTER TABLE user_feedback
DROP CONSTRAINT IF EXISTS user_feedback_actionability_rating_check;
ALTER TABLE user_feedback
ADD CONSTRAINT user_feedback_actionability_rating_check 
CHECK (actionability_rating IS NULL OR (actionability_rating >= 1 AND actionability_rating <= 5));

-- Index for AL feedback queries (filtered by feature_context)
CREATE INDEX IF NOT EXISTS idx_user_feedback_al_conversation 
ON user_feedback(al_conversation_id) 
WHERE feature_context = 'al-chat';

CREATE INDEX IF NOT EXISTS idx_user_feedback_al_message
ON user_feedback(al_message_id)
WHERE feature_context = 'al-chat';

-- Index for RLHF export queries (feedback with snapshots and ratings)
CREATE INDEX IF NOT EXISTS idx_user_feedback_rlhf_export
ON user_feedback(created_at DESC)
WHERE feature_context = 'al-chat' 
  AND user_prompt_snapshot IS NOT NULL 
  AND assistant_response_snapshot IS NOT NULL;

-- ============================================================================
-- 2. EXTEND al_usage_logs TABLE
-- Add prompt_version_id for A/B testing analysis
-- ============================================================================

ALTER TABLE al_usage_logs
ADD COLUMN IF NOT EXISTS prompt_version_id TEXT;

-- Index for A/B analysis queries
CREATE INDEX IF NOT EXISTS idx_al_usage_logs_prompt_version
ON al_usage_logs(prompt_version_id, created_at DESC)
WHERE prompt_version_id IS NOT NULL;

-- ============================================================================
-- 3. CREATE al_content_gaps TABLE
-- Track detected knowledge gaps from AL conversations
-- ============================================================================

CREATE TABLE IF NOT EXISTS al_content_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Gap identification
  question_pattern TEXT NOT NULL,
  car_slug TEXT,
  car_id UUID REFERENCES cars(id) ON DELETE SET NULL,
  
  -- Gap classification
  gap_type TEXT NOT NULL CHECK (gap_type IN (
    'missing_data',      -- Data doesn't exist in our database
    'outdated',          -- Data exists but is stale
    'incomplete',        -- Partial data exists
    'no_source',         -- AL couldn't find authoritative source
    'low_confidence'     -- AL answered but with low confidence
  )),
  
  -- Frequency tracking
  occurrence_count INTEGER DEFAULT 1,
  sample_questions JSONB DEFAULT '[]',
  sample_conversation_ids UUID[] DEFAULT '{}',
  
  -- Detection timestamps
  first_detected_at TIMESTAMPTZ DEFAULT NOW(),
  last_detected_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Resolution tracking
  resolved_at TIMESTAMPTZ,
  resolution_type TEXT CHECK (resolution_type IS NULL OR resolution_type IN (
    'data_added',        -- New data was added to database
    'kb_updated',        -- Knowledge base was updated
    'already_exists',    -- Data existed, AL indexing was the issue
    'deferred',          -- Intentionally postponed
    'not_applicable',    -- False positive or out of scope
    'wont_fix'           -- Decided not to address
  )),
  resolution_notes TEXT,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for content gap queries
CREATE INDEX IF NOT EXISTS idx_al_content_gaps_unresolved
ON al_content_gaps(occurrence_count DESC, last_detected_at DESC)
WHERE resolved_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_al_content_gaps_car
ON al_content_gaps(car_id)
WHERE car_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_al_content_gaps_type
ON al_content_gaps(gap_type, occurrence_count DESC);

-- Auto-populate car_id from car_slug
CREATE TRIGGER auto_car_id_al_content_gaps
BEFORE INSERT OR UPDATE ON al_content_gaps
FOR EACH ROW
EXECUTE FUNCTION resolve_car_id_from_slug();

-- Auto-update updated_at
CREATE TRIGGER update_al_content_gaps_updated_at
BEFORE UPDATE ON al_content_gaps
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. CREATE al_prompt_versions TABLE
-- Store prompt variants for A/B testing
-- ============================================================================

CREATE TABLE IF NOT EXISTS al_prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Version identification
  version_id TEXT UNIQUE NOT NULL,  -- e.g., 'v1.0-baseline', 'v1.1-concise'
  name TEXT NOT NULL,
  description TEXT,
  
  -- Prompt content
  system_prompt TEXT NOT NULL,
  
  -- A/B testing configuration
  is_active BOOLEAN DEFAULT false,
  traffic_percentage INTEGER DEFAULT 0 CHECK (traffic_percentage >= 0 AND traffic_percentage <= 100),
  
  -- Lifecycle tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  activated_at TIMESTAMPTZ,
  retired_at TIMESTAMPTZ,
  
  -- Performance tracking (aggregated from evaluations)
  eval_pass_rate DECIMAL(5,2),
  avg_user_rating DECIMAL(3,2),
  total_conversations INTEGER DEFAULT 0,
  
  -- Metadata
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for active prompt selection
CREATE INDEX IF NOT EXISTS idx_al_prompt_versions_active
ON al_prompt_versions(traffic_percentage DESC)
WHERE is_active = true AND traffic_percentage > 0;

-- Auto-update updated_at
CREATE TRIGGER update_al_prompt_versions_updated_at
BEFORE UPDATE ON al_prompt_versions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. CREATE al_evaluation_runs TABLE
-- Track evaluation run metadata
-- ============================================================================

CREATE TABLE IF NOT EXISTS al_evaluation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Run identification
  name TEXT,
  prompt_version_id TEXT REFERENCES al_prompt_versions(version_id) ON DELETE SET NULL,
  
  -- Summary stats
  total_cases INTEGER DEFAULT 0,
  passed_cases INTEGER DEFAULT 0,
  failed_cases INTEGER DEFAULT 0,
  skipped_cases INTEGER DEFAULT 0,
  avg_score DECIMAL(4,2),
  avg_latency_ms INTEGER,
  total_tokens INTEGER DEFAULT 0,
  total_cost_cents DECIMAL(10,2) DEFAULT 0,
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',
    'running',
    'completed',
    'failed',
    'cancelled'
  )),
  triggered_by TEXT CHECK (triggered_by IN (
    'manual',
    'scheduled',
    'ci',
    'prompt_change'
  )),
  
  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Error tracking
  error_message TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Index for recent runs
CREATE INDEX IF NOT EXISTS idx_al_evaluation_runs_recent
ON al_evaluation_runs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_al_evaluation_runs_prompt_version
ON al_evaluation_runs(prompt_version_id, created_at DESC)
WHERE prompt_version_id IS NOT NULL;

-- ============================================================================
-- 6. CREATE al_evaluation_results TABLE
-- Store individual test case results
-- ============================================================================

CREATE TABLE IF NOT EXISTS al_evaluation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to run
  run_id UUID NOT NULL REFERENCES al_evaluation_runs(id) ON DELETE CASCADE,
  
  -- Test case identification
  test_case_id TEXT NOT NULL,
  test_category TEXT,  -- 'buying', 'reliability', 'upgrades', 'performance', etc.
  
  -- Input/Output
  prompt_sent TEXT NOT NULL,
  car_context_slug TEXT,
  response_received TEXT,
  tools_called JSONB DEFAULT '[]',
  
  -- Scoring
  expected_elements JSONB,         -- What we expected to find
  expected_elements_found JSONB,   -- { "element": true/false }
  forbidden_elements JSONB,        -- What should NOT appear
  forbidden_elements_found JSONB,  -- Any violations found
  
  -- LLM Judge scoring
  llm_judge_score INTEGER CHECK (llm_judge_score IS NULL OR (llm_judge_score >= 1 AND llm_judge_score <= 10)),
  llm_judge_reasoning TEXT,
  
  -- Performance metrics
  latency_ms INTEGER,
  input_tokens INTEGER,
  output_tokens INTEGER,
  cost_cents DECIMAL(8,4),
  
  -- Result
  passed BOOLEAN,
  failure_reasons TEXT[],
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for result analysis
CREATE INDEX IF NOT EXISTS idx_al_evaluation_results_run
ON al_evaluation_results(run_id);

CREATE INDEX IF NOT EXISTS idx_al_evaluation_results_test_case
ON al_evaluation_results(test_case_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_al_evaluation_results_failures
ON al_evaluation_results(run_id, test_category)
WHERE passed = false;

-- ============================================================================
-- 7. RLS POLICIES
-- ============================================================================

-- al_content_gaps: Admin-only access
ALTER TABLE al_content_gaps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to content gaps" ON al_content_gaps;
CREATE POLICY "Service role full access to content gaps" ON al_content_gaps
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- al_prompt_versions: Admin-only access
ALTER TABLE al_prompt_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to prompt versions" ON al_prompt_versions;
CREATE POLICY "Service role full access to prompt versions" ON al_prompt_versions
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- al_evaluation_runs: Admin-only access
ALTER TABLE al_evaluation_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to eval runs" ON al_evaluation_runs;
CREATE POLICY "Service role full access to eval runs" ON al_evaluation_runs
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- al_evaluation_results: Admin-only access
ALTER TABLE al_evaluation_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to eval results" ON al_evaluation_results;
CREATE POLICY "Service role full access to eval results" ON al_evaluation_results
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- 8. HELPER FUNCTIONS
-- ============================================================================

-- Function to get AL feedback quality metrics
CREATE OR REPLACE FUNCTION get_al_feedback_metrics(
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  total_feedback BIGINT,
  positive_count BIGINT,
  negative_count BIGINT,
  positive_rate DECIMAL(5,2),
  avg_accuracy DECIMAL(3,2),
  avg_completeness DECIMAL(3,2),
  avg_relevance DECIMAL(3,2),
  avg_actionability DECIMAL(3,2),
  feedback_with_dimensions BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT AS total_feedback,
    COUNT(*) FILTER (WHERE rating >= 4)::BIGINT AS positive_count,
    COUNT(*) FILTER (WHERE rating <= 2)::BIGINT AS negative_count,
    ROUND((COUNT(*) FILTER (WHERE rating >= 4)::DECIMAL / NULLIF(COUNT(*), 0) * 100), 2) AS positive_rate,
    AVG(accuracy_rating)::DECIMAL(3,2) AS avg_accuracy,
    AVG(completeness_rating)::DECIMAL(3,2) AS avg_completeness,
    AVG(relevance_rating)::DECIMAL(3,2) AS avg_relevance,
    AVG(actionability_rating)::DECIMAL(3,2) AS avg_actionability,
    COUNT(*) FILTER (WHERE accuracy_rating IS NOT NULL OR completeness_rating IS NOT NULL)::BIGINT AS feedback_with_dimensions
  FROM user_feedback
  WHERE feature_context = 'al-chat'
    AND created_at >= p_start_date
    AND created_at < p_end_date;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get unresolved content gaps with priority
CREATE OR REPLACE FUNCTION get_priority_content_gaps(
  p_limit INTEGER DEFAULT 20,
  p_min_occurrences INTEGER DEFAULT 3
)
RETURNS SETOF al_content_gaps AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM al_content_gaps
  WHERE resolved_at IS NULL
    AND occurrence_count >= p_min_occurrences
  ORDER BY 
    occurrence_count DESC,
    last_detected_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to upsert content gap (increment if exists, create if not)
CREATE OR REPLACE FUNCTION upsert_content_gap(
  p_question_pattern TEXT,
  p_car_slug TEXT DEFAULT NULL,
  p_gap_type TEXT DEFAULT 'missing_data',
  p_sample_question TEXT DEFAULT NULL,
  p_conversation_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_gap_id UUID;
  v_sample_questions JSONB;
  v_conversation_ids UUID[];
BEGIN
  -- Try to find existing unresolved gap with similar pattern
  SELECT id INTO v_gap_id
  FROM al_content_gaps
  WHERE question_pattern = p_question_pattern
    AND COALESCE(car_slug, '') = COALESCE(p_car_slug, '')
    AND resolved_at IS NULL
  LIMIT 1;
  
  IF v_gap_id IS NOT NULL THEN
    -- Update existing gap
    UPDATE al_content_gaps
    SET 
      occurrence_count = occurrence_count + 1,
      last_detected_at = NOW(),
      sample_questions = CASE 
        WHEN p_sample_question IS NOT NULL AND jsonb_array_length(sample_questions) < 10
        THEN sample_questions || to_jsonb(p_sample_question)
        ELSE sample_questions
      END,
      sample_conversation_ids = CASE
        WHEN p_conversation_id IS NOT NULL AND array_length(sample_conversation_ids, 1) < 10
        THEN array_append(sample_conversation_ids, p_conversation_id)
        ELSE sample_conversation_ids
      END
    WHERE id = v_gap_id;
  ELSE
    -- Create new gap
    v_sample_questions := CASE 
      WHEN p_sample_question IS NOT NULL THEN jsonb_build_array(p_sample_question)
      ELSE '[]'::JSONB
    END;
    v_conversation_ids := CASE
      WHEN p_conversation_id IS NOT NULL THEN ARRAY[p_conversation_id]
      ELSE '{}'::UUID[]
    END;
    
    INSERT INTO al_content_gaps (
      question_pattern,
      car_slug,
      gap_type,
      sample_questions,
      sample_conversation_ids
    ) VALUES (
      p_question_pattern,
      p_car_slug,
      p_gap_type,
      v_sample_questions,
      v_conversation_ids
    )
    RETURNING id INTO v_gap_id;
  END IF;
  
  RETURN v_gap_id;
END;
$$ LANGUAGE plpgsql;

-- Function to export RLHF training data
CREATE OR REPLACE FUNCTION export_rlhf_training_data(
  p_min_rating INTEGER DEFAULT 4,
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '90 days',
  p_limit INTEGER DEFAULT 1000
)
RETURNS TABLE (
  feedback_id UUID,
  user_prompt TEXT,
  assistant_response TEXT,
  overall_rating INTEGER,
  accuracy_rating INTEGER,
  completeness_rating INTEGER,
  relevance_rating INTEGER,
  actionability_rating INTEGER,
  car_context TEXT,
  feedback_tags TEXT[],
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uf.id AS feedback_id,
    uf.user_prompt_snapshot AS user_prompt,
    uf.assistant_response_snapshot AS assistant_response,
    uf.rating AS overall_rating,
    uf.accuracy_rating,
    uf.completeness_rating,
    uf.relevance_rating,
    uf.actionability_rating,
    COALESCE(
      (SELECT c.initial_car_slug FROM al_conversations c WHERE c.id = uf.al_conversation_id),
      uf.car_slug
    ) AS car_context,
    uf.tags AS feedback_tags,
    uf.created_at
  FROM user_feedback uf
  WHERE uf.feature_context = 'al-chat'
    AND uf.user_prompt_snapshot IS NOT NULL
    AND uf.assistant_response_snapshot IS NOT NULL
    AND uf.rating IS NOT NULL
    AND uf.created_at >= p_start_date
  ORDER BY 
    CASE WHEN uf.rating >= p_min_rating THEN 0 ELSE 1 END,
    uf.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 9. SEED BASELINE PROMPT VERSION
-- ============================================================================

-- Insert the baseline prompt version (will be populated with actual prompt later)
INSERT INTO al_prompt_versions (version_id, name, description, is_active, traffic_percentage)
VALUES (
  'v1.0-baseline',
  'Baseline Prompt',
  'Original AL system prompt - baseline for A/B testing',
  true,
  100
)
ON CONFLICT (version_id) DO NOTHING;

-- ============================================================================
-- 10. COMMENTS
-- ============================================================================

COMMENT ON TABLE al_content_gaps IS 'Tracks detected knowledge gaps from AL conversations for continuous content improvement';
COMMENT ON TABLE al_prompt_versions IS 'Stores prompt variants for A/B testing AL responses';
COMMENT ON TABLE al_evaluation_runs IS 'Metadata for evaluation runs against AL golden dataset';
COMMENT ON TABLE al_evaluation_results IS 'Individual test case results from evaluation runs';

COMMENT ON COLUMN user_feedback.al_conversation_id IS 'FK to al_conversations for AL feedback (proper FK instead of JSONB)';
COMMENT ON COLUMN user_feedback.al_message_id IS 'FK to al_messages for the specific message being rated';
COMMENT ON COLUMN user_feedback.accuracy_rating IS 'Was the information factually correct? (1-5)';
COMMENT ON COLUMN user_feedback.completeness_rating IS 'Did it fully answer the question? (1-5)';
COMMENT ON COLUMN user_feedback.relevance_rating IS 'Was it relevant to the specific car/context? (1-5)';
COMMENT ON COLUMN user_feedback.actionability_rating IS 'Can the user act on this advice? (1-5)';
COMMENT ON COLUMN user_feedback.user_prompt_snapshot IS 'Denormalized user question for RLHF export';
COMMENT ON COLUMN user_feedback.assistant_response_snapshot IS 'Denormalized AL response for RLHF export';

COMMENT ON COLUMN al_usage_logs.prompt_version_id IS 'Which prompt variant was used (for A/B analysis)';

COMMENT ON FUNCTION get_al_feedback_metrics IS 'Get aggregated AL feedback quality metrics for a date range';
COMMENT ON FUNCTION get_priority_content_gaps IS 'Get unresolved content gaps sorted by priority (occurrence count)';
COMMENT ON FUNCTION upsert_content_gap IS 'Create or increment a content gap record';
COMMENT ON FUNCTION export_rlhf_training_data IS 'Export feedback data in RLHF-ready format';
