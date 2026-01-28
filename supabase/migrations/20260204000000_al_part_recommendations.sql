-- Migration: AL Part Recommendations
-- Purpose: Store AL's part research recommendations linked to specific cars and upgrade types
-- This enables showing top recommendations directly in part tiles on the parts page

-- ============================================================================
-- TABLE: al_part_recommendations
-- ============================================================================
-- Links AL research results to specific cars and upgrade types with ranking.
-- When AL researches "cold air intakes for BMW M3", results are stored here
-- so the parts page can display them inline without requiring another chat.

CREATE TABLE IF NOT EXISTS al_part_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What car is this recommendation for
  car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  
  -- What upgrade type (e.g., "intake", "exhaust", "coilovers")
  -- Matches upgrade_keys.key values
  upgrade_key TEXT NOT NULL,
  
  -- Which part is being recommended
  part_id UUID NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
  
  -- Ranking within this car+upgrade (1 = best recommendation)
  rank INTEGER NOT NULL CHECK (rank BETWEEN 1 AND 10),
  
  -- Optional link back to the conversation that generated this recommendation
  conversation_id UUID REFERENCES al_conversations(id) ON DELETE SET NULL,
  
  -- Source of the recommendation (al_research, manual, import, etc.)
  source TEXT DEFAULT 'al_research',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Primary lookup: get recommendations for a car + upgrade type
CREATE INDEX idx_al_recs_car_upgrade ON al_part_recommendations(car_id, upgrade_key);

-- Lookup by part (e.g., "which cars is this part recommended for?")
CREATE INDEX idx_al_recs_part ON al_part_recommendations(part_id);

-- Lookup by conversation (e.g., "what recommendations came from this chat?")
CREATE INDEX idx_al_recs_conversation ON al_part_recommendations(conversation_id) 
  WHERE conversation_id IS NOT NULL;

-- ============================================================================
-- CONSTRAINTS
-- ============================================================================

-- A part can only be recommended once per car+upgrade combo
ALTER TABLE al_part_recommendations 
  ADD CONSTRAINT unique_car_upgrade_part UNIQUE (car_id, upgrade_key, part_id);

-- Each rank can only be used once per car+upgrade combo
-- This ensures we have exactly one #1, one #2, etc.
ALTER TABLE al_part_recommendations 
  ADD CONSTRAINT unique_car_upgrade_rank UNIQUE (car_id, upgrade_key, rank);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE TRIGGER set_al_part_recommendations_updated_at
  BEFORE UPDATE ON al_part_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE al_part_recommendations ENABLE ROW LEVEL SECURITY;

-- Everyone can read recommendations (they're based on cars, not users)
CREATE POLICY "al_part_recommendations_select_all"
  ON al_part_recommendations
  FOR SELECT
  USING (true);

-- Only service role can insert/update/delete (managed by backend)
CREATE POLICY "al_part_recommendations_insert_service"
  ON al_part_recommendations
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
  );

CREATE POLICY "al_part_recommendations_update_service"
  ON al_part_recommendations
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "al_part_recommendations_delete_service"
  ON al_part_recommendations
  FOR DELETE
  USING (auth.role() = 'service_role');

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE al_part_recommendations IS 
  'Stores AL part research recommendations linked to specific cars and upgrade types. Enables showing top recommendations in part tiles.';

COMMENT ON COLUMN al_part_recommendations.upgrade_key IS 
  'Matches upgrade_keys.key values (e.g., intake, exhaust, coilovers-street)';

COMMENT ON COLUMN al_part_recommendations.rank IS 
  'Ranking within car+upgrade (1=best). Used for display order in UI.';

COMMENT ON COLUMN al_part_recommendations.source IS 
  'How the recommendation was created: al_research, manual, import, etc.';
