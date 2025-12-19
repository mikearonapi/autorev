-- ============================================================================
-- Migration 050: RLS Security Fixes
-- ============================================================================
-- Audit Date: December 15, 2024
-- Fixes critical security vulnerabilities identified in RLS audit
-- ============================================================================

-- ============================================================================
-- CRITICAL FIX #1: leads table - Remove dangerous UPDATE policy
-- ============================================================================
-- The current policy allows ANY anonymous user to UPDATE any lead record.
-- This is a severe security vulnerability.

-- Drop the dangerous update policy
DROP POLICY IF EXISTS "leads_update_policy" ON leads;

-- Create a service-role-only policy for updates (cron/admin operations)
CREATE POLICY "leads_update_service_role_only" ON leads
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Note: The INSERT policy (leads_insert_policy) allowing public inserts is 
-- intentional for lead capture forms. Keeping that as-is.

-- ============================================================================
-- CRITICAL FIX #2: target_cities table - Enable RLS with public read
-- ============================================================================
-- This table has rowsecurity = false, completely unprotected.

-- Enable RLS
ALTER TABLE target_cities ENABLE ROW LEVEL SECURITY;

-- Allow public read access (this is reference data)
CREATE POLICY "target_cities_public_read" ON target_cities
  FOR SELECT
  USING (true);

-- Only service role can modify
CREATE POLICY "target_cities_service_role_write" ON target_cities
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- MEDIUM FIX #3: user_activity - Document the decision
-- ============================================================================
-- The current policy allows anyone to insert activity for any user.
-- This could be intentional for analytics tracking.
-- 
-- OPTIONS:
-- A) Keep as-is (accept risk for analytics flexibility)
-- B) Restrict to authenticated users only
-- C) Restrict to user's own activity only
--
-- Implementing Option C for better security:

-- Drop the permissive insert policy
DROP POLICY IF EXISTS "user_activity_insert_any" ON user_activity;

-- Create policy: authenticated users can only insert their own activity
CREATE POLICY "user_activity_insert_own" ON user_activity
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND (user_id IS NULL OR user_id = auth.uid())
  );

-- Service role can insert any activity (for server-side tracking)
CREATE POLICY "user_activity_service_role_insert" ON user_activity
  FOR INSERT
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- Verification Queries (run after migration to confirm)
-- ============================================================================

-- Verify target_cities now has RLS enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'target_cities';

-- Verify leads no longer has public UPDATE:
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'leads';

-- Verify user_activity policies:
-- SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = 'user_activity';

-- ============================================================================
-- Full policy audit query (for verification):
-- ============================================================================
-- SELECT 
--   tablename,
--   policyname,
--   cmd,
--   CASE 
--     WHEN qual = 'true' THEN '⚠️ PUBLIC'
--     WHEN qual LIKE '%service_role%' THEN '🔒 SERVICE'
--     WHEN qual LIKE '%auth.uid()%' THEN '👤 USER'
--     ELSE qual
--   END as access_type
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;




