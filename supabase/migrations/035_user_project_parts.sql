-- ============================================================================
-- Migration 035: Persist parts selections on user_projects (with price snapshot)
--
-- Why:
-- - Users can now discover fitment-aware parts in the Tuning Shop.
-- - Persist selected parts to a project/build with stable part_id references.
-- - Snapshot pricing + key fitment signals at the moment of selection.
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_project_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES user_projects(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES parts(id),

  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),

  -- Part snapshot (so the build stays readable if the catalog changes)
  part_name TEXT,
  brand_name TEXT,
  part_number TEXT,
  category part_category,

  -- Pricing snapshot (best-effort)
  vendor_name TEXT,
  product_url TEXT,
  currency TEXT DEFAULT 'USD',
  price_cents INTEGER CHECK (price_cents >= 0),
  price_recorded_at DATE,

  -- Fitment snapshot (best-effort)
  requires_tune BOOLEAN,
  install_difficulty TEXT CHECK (install_difficulty IN ('easy','moderate','hard','pro_only')),
  estimated_labor_hours DECIMAL(5,2),
  fitment_verified BOOLEAN,
  fitment_confidence DECIMAL(3,2) CHECK (fitment_confidence >= 0 AND fitment_confidence <= 1),
  fitment_notes TEXT,
  fitment_source_url TEXT,

  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT ux_user_project_parts UNIQUE (project_id, part_id)
);

CREATE INDEX IF NOT EXISTS idx_user_project_parts_project_id ON user_project_parts(project_id);
CREATE INDEX IF NOT EXISTS idx_user_project_parts_part_id ON user_project_parts(part_id);
CREATE INDEX IF NOT EXISTS idx_user_project_parts_category ON user_project_parts(category);

DROP TRIGGER IF EXISTS update_user_project_parts_updated_at ON user_project_parts;
CREATE TRIGGER update_user_project_parts_updated_at
  BEFORE UPDATE ON user_project_parts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE user_project_parts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_project_parts_select_own" ON user_project_parts;
CREATE POLICY "user_project_parts_select_own"
  ON user_project_parts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM user_projects p
      WHERE p.id = user_project_parts.project_id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "user_project_parts_insert_own" ON user_project_parts;
CREATE POLICY "user_project_parts_insert_own"
  ON user_project_parts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM user_projects p
      WHERE p.id = user_project_parts.project_id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "user_project_parts_update_own" ON user_project_parts;
CREATE POLICY "user_project_parts_update_own"
  ON user_project_parts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM user_projects p
      WHERE p.id = user_project_parts.project_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM user_projects p
      WHERE p.id = user_project_parts.project_id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "user_project_parts_delete_own" ON user_project_parts;
CREATE POLICY "user_project_parts_delete_own"
  ON user_project_parts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM user_projects p
      WHERE p.id = user_project_parts.project_id
        AND p.user_id = auth.uid()
    )
  );






