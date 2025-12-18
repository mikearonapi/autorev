-- ============================================================================
-- CONSOLIDATED AUDIT QUERY - Run this single query to get all critical info
-- ============================================================================

-- Summary of all tables and their status
SELECT 
  'TABLE_CHECK' as audit_type,
  table_name,
  CASE 
    WHEN table_name IN (
      'user_profiles', 'user_favorites', 'user_projects', 'user_compare_lists',
      'user_vehicles', 'user_activity', 'al_user_credits', 'al_usage_logs',
      'al_credit_purchases', 'al_conversations', 'al_messages', 'leads',
      'cars', 'upgrade_packages', 'upgrade_education'
    ) THEN '✅ EXPECTED'
    WHEN table_name = 'user_saved_builds' THEN '❌ OLD NAME'
    ELSE '⚠️ UNEXPECTED'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY status, table_name;

-- RLS Status Summary
SELECT 
  'RLS_STATUS' as audit_type,
  tablename,
  CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ MISSING' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'user_profiles', 'user_favorites', 'user_projects', 'user_compare_lists',
  'user_vehicles', 'user_activity', 'al_user_credits', 'al_usage_logs',
  'al_credit_purchases', 'al_conversations', 'al_messages'
)
ORDER BY tablename;

-- Critical Policies Count
SELECT 
  'POLICY_COUNT' as audit_type,
  tablename,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ GOOD'
    WHEN COUNT(*) >= 2 THEN '⚠️ PARTIAL'
    ELSE '❌ MISSING'
  END as status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN (
  'user_profiles', 'user_favorites', 'user_projects', 'al_user_credits',
  'al_conversations', 'al_messages'
)
GROUP BY tablename
ORDER BY tablename;

-- Trigger Check
SELECT 
  'TRIGGER_CHECK' as audit_type,
  trigger_name,
  event_object_table,
  CASE 
    WHEN trigger_name LIKE '%handle_new_user%' THEN '✅ CRITICAL'
    WHEN trigger_name LIKE '%updated_at%' THEN '✅ AUTO-UPDATE'
    ELSE '⚠️ OTHER'
  END as importance
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
AND (
  trigger_name LIKE '%user%' 
  OR event_object_table IN ('user_profiles', 'al_user_credits', 'user_projects', 'al_conversations', 'al_messages')
)
ORDER BY event_object_table, trigger_name;

-- Function Check
SELECT 
  'FUNCTION_CHECK' as audit_type,
  routine_name,
  routine_type,
  CASE 
    WHEN routine_name = 'handle_new_user' THEN '✅ CRITICAL'
    WHEN routine_name = 'update_updated_at_column' THEN '✅ CRITICAL'
    WHEN routine_name LIKE '%al%' THEN '✅ AL FUNCTION'
    WHEN routine_name LIKE '%user%' THEN '✅ USER FUNCTION'
    ELSE '⚠️ OTHER'
  END as importance
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

-- Critical Indexes Check
SELECT 
  'INDEX_CHECK' as audit_type,
  tablename,
  indexname,
  CASE 
    WHEN indexname LIKE '%user_id%' AND tablename LIKE 'user_%' THEN '✅ USER LOOKUP'
    WHEN indexname LIKE '%user_id%' AND tablename LIKE 'al_%' THEN '✅ AL USER LOOKUP'
    WHEN indexname LIKE '%conversation_id%' THEN '✅ CONVERSATION LOOKUP'
    WHEN indexname LIKE '%created_at%' OR indexname LIKE '%last_message_at%' THEN '✅ TIME SORT'
    ELSE '⚠️ OTHER'
  END as index_type
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

-- Column Name Check (user_projects)
SELECT 
  'COLUMN_CHECK' as audit_type,
  column_name,
  data_type,
  CASE 
    WHEN column_name = 'project_name' THEN '✅ CORRECT'
    WHEN column_name = 'build_name' THEN '❌ OLD NAME'
    ELSE '✅ OK'
  END as status
FROM information_schema.columns 
WHERE table_name = 'user_projects'
AND column_name IN ('project_name', 'build_name')
ORDER BY column_name;

-- user_profiles column check
SELECT 
  'PROFILE_COLUMN_CHECK' as audit_type,
  column_name,
  CASE 
    WHEN column_name = 'projects_saved_count' THEN '✅ CORRECT'
    WHEN column_name = 'builds_saved_count' THEN '❌ OLD NAME'
    ELSE '✅ OK'
  END as status
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('builds_saved_count', 'projects_saved_count');













