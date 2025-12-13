-- ============================================================================
-- PROBE PACK #1: Database Schema Audit
-- Run these queries in Supabase SQL Editor and paste results back
-- ============================================================================

-- ============================================================================
-- PROBE 1: Check if all expected tables exist
-- ============================================================================
SELECT 
  table_name,
  CASE 
    WHEN table_name IN (
      'user_profiles', 'user_favorites', 'user_projects', 'user_compare_lists',
      'user_vehicles', 'user_activity', 'al_user_credits', 'al_usage_logs',
      'al_credit_purchases', 'al_conversations', 'al_messages', 'leads',
      'cars', 'upgrade_packages', 'upgrade_education'
    ) THEN '✅ EXPECTED'
    ELSE '⚠️ UNEXPECTED'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================================================
-- PROBE 2: Check for old table names (should NOT exist)
-- ============================================================================
SELECT 
  table_name,
  '❌ OLD NAME - SHOULD BE RENAMED' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_saved_builds');

-- ============================================================================
-- PROBE 3: Check user_projects table structure
-- ============================================================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_projects'
ORDER BY ordinal_position;

-- ============================================================================
-- PROBE 4: Check user_profiles table for projects_saved_count column
-- ============================================================================
SELECT 
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('builds_saved_count', 'projects_saved_count');

-- ============================================================================
-- PROBE 5: Check RLS is enabled on user tables
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity = true THEN '✅ ENABLED'
    WHEN rowsecurity = false AND tablename LIKE 'user_%' THEN '❌ MISSING'
    WHEN rowsecurity = false AND tablename LIKE 'al_%' THEN '❌ MISSING'
    ELSE '⚠️ CHECK'
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'user_profiles', 'user_favorites', 'user_projects', 'user_compare_lists',
  'user_vehicles', 'user_activity', 'al_user_credits', 'al_usage_logs',
  'al_credit_purchases', 'al_conversations', 'al_messages'
)
ORDER BY tablename;

-- ============================================================================
-- PROBE 6: Check RLS policies exist for user tables
-- ============================================================================
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN (
  'user_profiles', 'user_favorites', 'user_projects', 'user_compare_lists',
  'user_vehicles', 'user_activity', 'al_user_credits', 'al_usage_logs',
  'al_credit_purchases', 'al_conversations', 'al_messages'
)
ORDER BY tablename, policyname;

-- ============================================================================
-- PROBE 7: Check triggers exist (especially handle_new_user)
-- ============================================================================
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
AND (
  trigger_name LIKE '%user%' 
  OR event_object_table IN ('user_profiles', 'al_user_credits', 'user_projects')
)
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- PROBE 8: Check functions exist (especially AL helpers)
-- ============================================================================
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND (
  routine_name LIKE '%al%' 
  OR routine_name LIKE '%user%'
  OR routine_name LIKE '%conversation%'
  OR routine_name LIKE '%handle_new_user%'
  OR routine_name LIKE '%update_updated_at%'
)
ORDER BY routine_name;

-- ============================================================================
-- PROBE 9: Check critical indexes exist
-- ============================================================================
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND (
  indexname LIKE '%user_projects%'
  OR indexname LIKE '%al_conversations%'
  OR indexname LIKE '%al_messages%'
  OR indexname LIKE '%al_user_credits%'
  OR indexname LIKE '%user_favorites%'
  OR indexname LIKE '%user_vehicles%'
)
ORDER BY tablename, indexname;

-- ============================================================================
-- PROBE 10: Check leads table source constraint
-- ============================================================================
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public' 
AND tc.table_name = 'leads'
AND tc.constraint_type = 'CHECK';

-- ============================================================================
-- PROBE 11: Check foreign key constraints
-- ============================================================================
SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
AND (
  tc.table_name LIKE 'user_%' 
  OR tc.table_name LIKE 'al_%'
)
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- PROBE 12: Check for any remaining references to old table names
-- ============================================================================
SELECT 
  'Functions referencing old names' as check_type,
  routine_name,
  routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_definition LIKE '%user_saved_builds%'
UNION ALL
SELECT 
  'Triggers referencing old names' as check_type,
  trigger_name,
  action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
AND action_statement LIKE '%user_saved_builds%';

