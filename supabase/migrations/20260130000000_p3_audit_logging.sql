-- Migration: P3 Audit Logging Infrastructure
-- Date: January 30, 2026
-- Purpose: Create comprehensive audit logging for critical data changes

-- ============================================================================
-- AUDIT LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What changed
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,  -- TEXT to support different ID types
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  
  -- Change details
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],  -- List of fields that changed
  
  -- Who changed it
  changed_by UUID REFERENCES auth.users(id),
  changed_by_email TEXT,
  changed_by_role TEXT,
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  request_id TEXT,  -- For correlating with application logs
  
  -- When
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record 
  ON audit_log(table_name, record_id);
  
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_by 
  ON audit_log(changed_by);
  
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_at 
  ON audit_log(changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_action 
  ON audit_log(action, changed_at DESC);

-- Partition-friendly index for time-based queries
CREATE INDEX IF NOT EXISTS idx_audit_log_table_time 
  ON audit_log(table_name, changed_at DESC);

COMMENT ON TABLE audit_log IS 'Comprehensive audit trail for all critical data changes';

-- ============================================================================
-- GENERIC AUDIT TRIGGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  v_old_data JSONB;
  v_new_data JSONB;
  v_changed_fields TEXT[];
  v_user_id UUID;
  v_user_email TEXT;
  v_user_role TEXT;
  v_key TEXT;
BEGIN
  -- Get current user info
  v_user_id := auth.uid();
  
  -- Try to get email from JWT
  BEGIN
    v_user_email := (SELECT auth.jwt()->>'email');
    v_user_role := (SELECT auth.jwt()->>'role');
  EXCEPTION WHEN OTHERS THEN
    v_user_email := NULL;
    v_user_role := 'service_role';
  END;

  IF (TG_OP = 'DELETE') THEN
    v_old_data := to_jsonb(OLD);
    v_new_data := NULL;
    
    INSERT INTO audit_log (
      table_name, record_id, action,
      old_data, new_data, changed_fields,
      changed_by, changed_by_email, changed_by_role
    ) VALUES (
      TG_TABLE_NAME, OLD.id::TEXT, 'DELETE',
      v_old_data, v_new_data, NULL,
      v_user_id, v_user_email, v_user_role
    );
    
    RETURN OLD;
    
  ELSIF (TG_OP = 'UPDATE') THEN
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
    
    -- Find changed fields
    v_changed_fields := ARRAY(
      SELECT key FROM jsonb_each(v_new_data)
      WHERE v_new_data->key IS DISTINCT FROM v_old_data->key
    );
    
    -- Only log if something actually changed
    IF array_length(v_changed_fields, 1) > 0 THEN
      INSERT INTO audit_log (
        table_name, record_id, action,
        old_data, new_data, changed_fields,
        changed_by, changed_by_email, changed_by_role
      ) VALUES (
        TG_TABLE_NAME, NEW.id::TEXT, 'UPDATE',
        v_old_data, v_new_data, v_changed_fields,
        v_user_id, v_user_email, v_user_role
      );
    END IF;
    
    RETURN NEW;
    
  ELSIF (TG_OP = 'INSERT') THEN
    v_old_data := NULL;
    v_new_data := to_jsonb(NEW);
    
    INSERT INTO audit_log (
      table_name, record_id, action,
      old_data, new_data, changed_fields,
      changed_by, changed_by_email, changed_by_role
    ) VALUES (
      TG_TABLE_NAME, NEW.id::TEXT, 'INSERT',
      v_old_data, v_new_data, NULL,
      v_user_id, v_user_email, v_user_role
    );
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION audit_trigger_function IS 'Generic audit trigger - logs all changes to audit_log';

-- ============================================================================
-- APPLY AUDIT TRIGGERS TO CRITICAL TABLES
-- ============================================================================

-- User Profiles - critical user data
DROP TRIGGER IF EXISTS audit_user_profiles ON user_profiles;
CREATE TRIGGER audit_user_profiles
  AFTER INSERT OR UPDATE OR DELETE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- User Vehicles - ownership data
DROP TRIGGER IF EXISTS audit_user_vehicles ON user_vehicles;
CREATE TRIGGER audit_user_vehicles
  AFTER INSERT OR UPDATE OR DELETE ON user_vehicles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- User Projects - build data
DROP TRIGGER IF EXISTS audit_user_projects ON user_projects;
CREATE TRIGGER audit_user_projects
  AFTER INSERT OR UPDATE OR DELETE ON user_projects
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- AL User Credits - billing critical
DROP TRIGGER IF EXISTS audit_al_user_credits ON al_user_credits;
CREATE TRIGGER audit_al_user_credits
  AFTER INSERT OR UPDATE OR DELETE ON al_user_credits
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Referrals - reward critical
DROP TRIGGER IF EXISTS audit_referrals ON referrals;
CREATE TRIGGER audit_referrals
  AFTER INSERT OR UPDATE OR DELETE ON referrals
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Cars - core data
DROP TRIGGER IF EXISTS audit_cars ON cars;
CREATE TRIGGER audit_cars
  AFTER INSERT OR UPDATE OR DELETE ON cars
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Parts - catalog data
DROP TRIGGER IF EXISTS audit_parts ON parts;
CREATE TRIGGER audit_parts
  AFTER INSERT OR UPDATE OR DELETE ON parts
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- ============================================================================
-- HELPER FUNCTIONS FOR AUDIT QUERIES
-- ============================================================================

-- Get audit history for a specific record
CREATE OR REPLACE FUNCTION get_audit_history(
  p_table_name TEXT,
  p_record_id TEXT,
  p_limit INT DEFAULT 50
)
RETURNS TABLE (
  action TEXT,
  changed_fields TEXT[],
  changed_by_email TEXT,
  changed_at TIMESTAMPTZ,
  old_data JSONB,
  new_data JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.action,
    al.changed_fields,
    al.changed_by_email,
    al.changed_at,
    al.old_data,
    al.new_data
  FROM audit_log al
  WHERE al.table_name = p_table_name
    AND al.record_id = p_record_id
  ORDER BY al.changed_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_audit_history IS 'Returns audit history for a specific record';

-- Get recent changes by user
CREATE OR REPLACE FUNCTION get_user_audit_trail(
  p_user_id UUID,
  p_days INT DEFAULT 30,
  p_limit INT DEFAULT 100
)
RETURNS TABLE (
  table_name TEXT,
  record_id TEXT,
  action TEXT,
  changed_fields TEXT[],
  changed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.table_name,
    al.record_id,
    al.action,
    al.changed_fields,
    al.changed_at
  FROM audit_log al
  WHERE al.changed_by = p_user_id
    AND al.changed_at > NOW() - (p_days || ' days')::INTERVAL
  ORDER BY al.changed_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_audit_trail IS 'Returns recent changes made by a user';

-- ============================================================================
-- RLS POLICIES FOR AUDIT LOG
-- ============================================================================

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins and service role can read audit logs
CREATE POLICY "Admins can view audit logs" ON audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE users.id = auth.uid() 
      AND users.email IN ('mikearon@gmail.com', 'mike@autorev.app')
    )
  );

CREATE POLICY "Service role full access to audit" ON audit_log
  FOR ALL USING (
    (SELECT auth.jwt()->>'role') = 'service_role'
  );

-- ============================================================================
-- AUDIT LOG RETENTION (cleanup old entries)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(
  p_days_to_keep INT DEFAULT 365
)
RETURNS INT AS $$
DECLARE
  v_deleted INT;
BEGIN
  DELETE FROM audit_log
  WHERE changed_at < NOW() - (p_days_to_keep || ' days')::INTERVAL;
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_audit_logs IS 'Removes audit entries older than specified days';
