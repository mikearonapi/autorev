-- AL Evaluation System Tables
-- Stores LLM-as-judge evaluation results for quality monitoring

-- =============================================================================
-- EVALUATION RUNS TABLE
-- =============================================================================
-- Stores summary of each evaluation run

CREATE TABLE IF NOT EXISTS al_evaluation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_version_id UUID REFERENCES al_prompt_versions(id) ON DELETE SET NULL,
  
  -- Run summary
  total_cases INTEGER NOT NULL DEFAULT 0,
  passed_cases INTEGER NOT NULL DEFAULT 0,
  failed_cases INTEGER NOT NULL DEFAULT 0,
  error_cases INTEGER NOT NULL DEFAULT 0,
  
  -- Metrics
  pass_rate NUMERIC(5,2) DEFAULT 0,
  avg_weighted_score NUMERIC(3,2) DEFAULT 0,
  
  -- Detailed scores (JSONB for flexibility)
  dimension_scores JSONB DEFAULT '{}'::jsonb,
  category_stats JSONB DEFAULT '{}'::jsonb,
  difficulty_stats JSONB DEFAULT '{}'::jsonb,
  
  -- Execution info
  duration_ms INTEGER,
  recommendation TEXT CHECK (recommendation IN ('READY_FOR_PRODUCTION', 'NEEDS_IMPROVEMENT', 'NOT_READY')),
  
  -- Timestamps
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for filtering by prompt version and time
CREATE INDEX IF NOT EXISTS idx_al_evaluation_runs_prompt_version 
  ON al_evaluation_runs(prompt_version_id);
CREATE INDEX IF NOT EXISTS idx_al_evaluation_runs_completed_at 
  ON al_evaluation_runs(completed_at DESC);

-- =============================================================================
-- EVALUATION RESULTS TABLE
-- =============================================================================
-- Stores individual test case results

CREATE TABLE IF NOT EXISTS al_evaluation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES al_evaluation_runs(id) ON DELETE CASCADE,
  
  -- Test case info
  test_case_id TEXT NOT NULL,
  category TEXT,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  
  -- Query and response
  query TEXT NOT NULL,
  response TEXT,
  tools_used TEXT[] DEFAULT '{}',
  
  -- Scores (JSONB for all dimension scores)
  scores JSONB,
  reasoning JSONB,
  weighted_score NUMERIC(3,2),
  
  -- Pass/fail
  passed BOOLEAN DEFAULT FALSE,
  status TEXT CHECK (status IN ('passed', 'failed', 'failed_safety', 'warning', 'critical_fail')),
  
  -- Match tracking
  keyword_match BOOLEAN,
  tool_match BOOLEAN,
  
  -- Error handling
  error TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for run lookup and filtering
CREATE INDEX IF NOT EXISTS idx_al_evaluation_results_run_id 
  ON al_evaluation_results(run_id);
CREATE INDEX IF NOT EXISTS idx_al_evaluation_results_test_case 
  ON al_evaluation_results(test_case_id);
CREATE INDEX IF NOT EXISTS idx_al_evaluation_results_category 
  ON al_evaluation_results(category);
CREATE INDEX IF NOT EXISTS idx_al_evaluation_results_passed 
  ON al_evaluation_results(passed);

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

-- Enable RLS
ALTER TABLE al_evaluation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE al_evaluation_results ENABLE ROW LEVEL SECURITY;

-- Only admins can view/modify evaluation data
CREATE POLICY "Admins can view evaluation runs" ON al_evaluation_runs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Service role can insert evaluation runs" ON al_evaluation_runs
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view evaluation results" ON al_evaluation_results
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Service role can insert evaluation results" ON al_evaluation_results
  FOR INSERT
  WITH CHECK (true);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Get latest evaluation run
CREATE OR REPLACE FUNCTION get_latest_evaluation_run(p_prompt_version_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  prompt_version_id UUID,
  total_cases INTEGER,
  pass_rate NUMERIC,
  avg_weighted_score NUMERIC,
  recommendation TEXT,
  completed_at TIMESTAMPTZ
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    id,
    prompt_version_id,
    total_cases,
    pass_rate,
    avg_weighted_score,
    recommendation,
    completed_at
  FROM al_evaluation_runs
  WHERE (p_prompt_version_id IS NULL OR al_evaluation_runs.prompt_version_id = p_prompt_version_id)
  ORDER BY completed_at DESC
  LIMIT 1;
$$;

-- Get evaluation trend (pass rate over time)
CREATE OR REPLACE FUNCTION get_evaluation_trend(p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  run_date DATE,
  runs_count BIGINT,
  avg_pass_rate NUMERIC,
  avg_score NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    DATE(completed_at) as run_date,
    COUNT(*) as runs_count,
    AVG(pass_rate) as avg_pass_rate,
    AVG(avg_weighted_score) as avg_score
  FROM al_evaluation_runs
  WHERE completed_at > NOW() - (p_days || ' days')::INTERVAL
  GROUP BY DATE(completed_at)
  ORDER BY run_date DESC;
$$;

-- Get failing test cases summary
CREATE OR REPLACE FUNCTION get_failing_test_cases(p_run_id UUID)
RETURNS TABLE (
  test_case_id TEXT,
  category TEXT,
  query TEXT,
  weighted_score NUMERIC,
  status TEXT,
  reasoning JSONB
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    test_case_id,
    category,
    query,
    weighted_score,
    status,
    reasoning
  FROM al_evaluation_results
  WHERE run_id = p_run_id
    AND passed = FALSE
  ORDER BY weighted_score ASC;
$$;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE al_evaluation_runs IS 'Stores summary of AL evaluation runs using LLM-as-judge';
COMMENT ON TABLE al_evaluation_results IS 'Stores individual test case results from evaluation runs';
COMMENT ON COLUMN al_evaluation_runs.dimension_scores IS 'Average scores by evaluation dimension (technicalAccuracy, relevance, helpfulness, safety, citationQuality)';
COMMENT ON COLUMN al_evaluation_runs.recommendation IS 'Overall recommendation: READY_FOR_PRODUCTION, NEEDS_IMPROVEMENT, or NOT_READY';
