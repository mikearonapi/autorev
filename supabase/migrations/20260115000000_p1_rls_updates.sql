-- Migration: P1 RLS Policy Updates
-- Date: January 15, 2026
-- Purpose: Tighten RLS policies on analytics tables

-- ============================================================================
-- click_events - Allow inserts, restrict reads to admins/own data
-- ============================================================================
DROP POLICY IF EXISTS "Service role full access on click_events" ON click_events;

-- Allow anyone to insert click events (tracking)
CREATE POLICY "Allow click event tracking" ON click_events
  FOR INSERT WITH CHECK (true);

-- Users can see their own click events
CREATE POLICY "Users can view own clicks" ON click_events
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can see all click events
CREATE POLICY "Admins can view all clicks" ON click_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE users.id = auth.uid() 
      AND users.email IN ('mikearon@gmail.com', 'mike@autorev.app')
    )
  );

-- Service role can manage all
CREATE POLICY "Service role manages clicks" ON click_events
  FOR ALL USING (
    (SELECT auth.jwt()->>'role') = 'service_role'
  );

-- ============================================================================
-- page_engagement - Allow inserts, restrict reads to admins/own data  
-- ============================================================================
DROP POLICY IF EXISTS "Service role full access on page_engagement" ON page_engagement;

-- Allow anyone to insert engagement data
CREATE POLICY "Allow engagement tracking" ON page_engagement
  FOR INSERT WITH CHECK (true);

-- Admins can see all engagement
CREATE POLICY "Admins can view all engagement" ON page_engagement
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE users.id = auth.uid() 
      AND users.email IN ('mikearon@gmail.com', 'mike@autorev.app')
    )
  );

-- Service role can manage all
CREATE POLICY "Service role manages engagement" ON page_engagement
  FOR ALL USING (
    (SELECT auth.jwt()->>'role') = 'service_role'
  );

-- ============================================================================
-- user_attribution - Tighten to service role only for writes
-- ============================================================================
DROP POLICY IF EXISTS "Service can manage attribution" ON user_attribution;

-- Only service role can insert/update/delete attribution
CREATE POLICY "Service role manages attribution" ON user_attribution
  FOR ALL USING (
    (SELECT auth.jwt()->>'role') = 'service_role'
  );

-- ============================================================================
-- application_errors - Add user can see own errors
-- ============================================================================
CREATE POLICY "Users can view own errors" ON application_errors
  FOR SELECT USING (auth.uid() = user_id);
