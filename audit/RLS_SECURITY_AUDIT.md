# AutoRev RLS Security Audit Report

> **Audit Date:** December 15, 2024
> **Auditor:** Automated Security Scan
> **Status:** ✅ ALL ISSUES FIXED (except 1 dashboard setting)

---

## Executive Summary

| Category | Before | After | Status |
|----------|--------|-------|--------|
| **RLS Disabled Tables** | 1 | 0 | ✅ |
| **Critical RLS Vulnerabilities** | 2 | 0 | ✅ |
| **SECURITY DEFINER Views** | 4 | 0 | ✅ |
| **Mutable search_path Functions** | 12 | 0 | ✅ |
| **Extensions in public schema** | 2 | 0 | ✅ |
| **Materialized view in API** | 1 | 0 | ✅ |
| **Leaked password protection** | 1 | 1 | 📋 Dashboard |

### Migrations Applied
- `050_rls_security_fixes.sql` - RLS fixes
- `051_security_fixes_comprehensive.sql` - Views, functions, extensions, materialized view

---

## 🔴 CRITICAL SECURITY ISSUES

### 1. `leads` Table - UPDATE ANY LEAD WITHOUT AUTH

**Severity:** CRITICAL 🔴
**Impact:** Data tampering, privacy violation

The `leads` table allows ANY anonymous user to UPDATE any lead record:

```sql
-- CURRENT VULNERABLE POLICY
leads_update_policy: UPDATE with qual='true', with_check='true'
```

**Attack Vector:**
- Attacker can modify ANY lead's email, name, or metadata
- No authentication required
- Could be used to redirect leads to attacker's email

**Fix Required:** Remove the UPDATE policy or restrict to service_role only.

---

### 2. `target_cities` Table - NO RLS ENABLED

**Severity:** CRITICAL 🔴  
**Impact:** Data exposed without any protection

The `target_cities` table has `rowsecurity = false` - completely unprotected.

**Exposed Data:**
- City names, states, population
- Geographic coordinates (latitude/longitude)
- Event coverage data
- Priority tier information

**Attack Vector:**
- Any client can INSERT, UPDATE, DELETE city data
- Could corrupt event coverage data

**Fix Required:** Enable RLS and add public read policy.

---

## 🟡 MEDIUM SECURITY ISSUES

### 3. `user_activity` Table - Anyone Can Insert Activity for Any User

**Severity:** MEDIUM 🟡
**Impact:** Activity spoofing, false analytics

```sql
-- CURRENT POLICY
user_activity_insert_any: INSERT with with_check='true'
```

**Risk:**
- Attacker can create fake activity records for any user
- Could inflate engagement metrics
- Could frame users for suspicious activity

**Recommendation:** Either restrict to authenticated users inserting own activity, or accept this as intentional for tracking (document decision).

---

## ✅ PROPERLY SECURED TABLES

### User Data Tables (Owner-Based Access) - 15 tables

All require `auth.uid() = user_id`:

| Table | SELECT | INSERT | UPDATE | DELETE | Status |
|-------|--------|--------|--------|--------|--------|
| `user_profiles` | Own | Own | Own | Own | ✅ |
| `user_favorites` | Own | Own | - | Own | ✅ |
| `user_vehicles` | Own | Own | Own | Own | ✅ |
| `user_service_logs` | Own | Own | Own | Own | ✅ |
| `user_projects` | Own | Own | Own | Own | ✅ |
| `user_project_parts` | Own | Own | Own | Own | ✅ |
| `user_compare_lists` | Own | Own | Own | Own | ✅ |
| `user_feedback` | Own | Any | - | - | ✅ |
| `al_conversations` | Own | Own | Own | Own | ✅ |
| `al_messages` | Own* | Own* | - | - | ✅ |
| `al_user_credits` | Own | Own | Own | - | ✅ |
| `al_usage_logs` | Own | Own | - | - | ✅ |
| `al_credit_purchases` | Own | Own | - | - | ✅ |
| `event_saves` | Own | Own | Own | Own | ✅ |
| `event_submissions` | Own | Own | - | - | ✅ |

*Via conversation ownership check

### Public Read Tables - 38 tables

All have `SELECT WHERE true` or conditional filters:

| Table | Filter | Status |
|-------|--------|--------|
| `cars` | All | ✅ |
| `car_variants` | All | ✅ |
| `car_fuel_economy` | All | ✅ |
| `car_safety_data` | All | ✅ |
| `car_issues` | All | ✅ |
| `car_recalls` | All | ✅ |
| `car_market_pricing` | All | ✅ |
| `car_market_pricing_years` | All | ✅ |
| `car_price_history` | All | ✅ |
| `car_dyno_runs` | All | ✅ |
| `car_track_lap_times` | All | ✅ |
| `car_expert_reviews` | All | ✅ |
| `car_manual_data` | All | ✅ |
| `car_auction_results` | All | ✅ |
| `car_slug_aliases` | All | ✅ |
| `car_variant_maintenance_overrides` | All | ✅ |
| `parts` | `is_active = true` | ✅ |
| `part_fitments` | All | ✅ |
| `part_pricing_snapshots` | All | ✅ |
| `part_relationships` | All | ✅ |
| `part_brands` | All | ✅ |
| `upgrade_keys` | All | ✅ |
| `upgrade_packages` | All | ✅ |
| `upgrade_key_parts` | All | ✅ |
| `youtube_videos` | `is_hidden = false` | ✅ |
| `youtube_channels` | All | ✅ |
| `youtube_video_car_links` | All | ✅ |
| `events` | `status = 'approved'` | ✅ |
| `event_types` | All | ✅ |
| `event_car_affinities` | All | ✅ |
| `community_insights` | `is_active = true` | ✅ |
| `vehicle_maintenance_specs` | All | ✅ |
| `vehicle_service_intervals` | All | ✅ |
| `vehicle_known_issues` | All | ✅ |
| `track_venues` | All | ✅ |
| `track_layouts` | All | ✅ |
| `fitment_tag_mappings` | All | ✅ |

### Service Role Only Tables - 9 tables

| Table | Policy | Status |
|-------|--------|--------|
| `scrape_jobs` | service_role ALL | ✅ |
| `document_chunks` | service_role ALL | ✅ |
| `source_documents` | service_role ALL | ✅ |
| `forum_sources` | service_role ALL | ✅ |
| `forum_scrape_runs` | service_role ALL | ✅ |
| `forum_scraped_threads` | service_role ALL | ✅ |
| `community_insight_sources` | service_role ALL | ✅ |
| `youtube_ingestion_queue` | service_role ALL | ✅ |
| `event_sources` | admin only | ✅ |

---

## RLS Status by Table (Full Inventory)

| # | Table | RLS Enabled | Policy Count | Assessment |
|---|-------|-------------|--------------|------------|
| 1 | `al_conversations` | ✅ | 4 | ✅ Secure |
| 2 | `al_credit_purchases` | ✅ | 2 | ✅ Secure |
| 3 | `al_messages` | ✅ | 2 | ✅ Secure |
| 4 | `al_usage_logs` | ✅ | 2 | ✅ Secure |
| 5 | `al_user_credits` | ✅ | 3 | ✅ Secure |
| 6 | `car_auction_results` | ✅ | 2 | ✅ Secure |
| 7 | `car_dyno_runs` | ✅ | 1 | ✅ Secure |
| 8 | `car_expert_reviews` | ✅ | 2 | ✅ Secure |
| 9 | `car_fuel_economy` | ✅ | 2 | ✅ Secure |
| 10 | `car_issues` | ✅ | 1 | ✅ Secure |
| 11 | `car_manual_data` | ✅ | 2 | ✅ Secure |
| 12 | `car_market_pricing` | ✅ | 2 | ✅ Secure |
| 13 | `car_market_pricing_years` | ✅ | 1 | ✅ Secure |
| 14 | `car_price_history` | ✅ | 2 | ✅ Secure |
| 15 | `car_recalls` | ✅ | 2 | ✅ Secure |
| 16 | `car_safety_data` | ✅ | 2 | ✅ Secure |
| 17 | `car_slug_aliases` | ✅ | 2 | ✅ Secure |
| 18 | `car_track_lap_times` | ✅ | 1 | ✅ Secure |
| 19 | `car_variant_maintenance_overrides` | ✅ | 1 | ✅ Secure |
| 20 | `car_variants` | ✅ | 1 | ✅ Secure |
| 21 | `cars` | ✅ | 1 | ✅ Secure |
| 22 | `community_insight_sources` | ✅ | 1 | ✅ Secure |
| 23 | `community_insights` | ✅ | 2 | ✅ Secure |
| 24 | `document_chunks` | ✅ | 1 | ✅ Secure |
| 25 | `event_car_affinities` | ✅ | 2 | ✅ Secure |
| 26 | `event_saves` | ✅ | 1 | ✅ Secure |
| 27 | `event_sources` | ✅ | 1 | ✅ Secure |
| 28 | `event_submissions` | ✅ | 3 | ✅ Secure |
| 29 | `event_types` | ✅ | 2 | ✅ Secure |
| 30 | `events` | ✅ | 2 | ✅ Secure |
| 31 | `fitment_tag_mappings` | ✅ | 1 | ✅ Secure |
| 32 | `forum_scrape_runs` | ✅ | 1 | ✅ Secure |
| 33 | `forum_scraped_threads` | ✅ | 1 | ✅ Secure |
| 34 | `forum_sources` | ✅ | 1 | ✅ Secure |
| 35 | `leads` | ✅ | 2 | 🔴 CRITICAL |
| 36 | `part_brands` | ✅ | 1 | ✅ Secure |
| 37 | `part_fitments` | ✅ | 1 | ✅ Secure |
| 38 | `part_pricing_snapshots` | ✅ | 1 | ✅ Secure |
| 39 | `part_relationships` | ✅ | 1 | ✅ Secure |
| 40 | `parts` | ✅ | 1 | ✅ Secure |
| 41 | `scrape_jobs` | ✅ | 2 | ✅ Secure |
| 42 | `source_documents` | ✅ | 1 | ✅ Secure |
| 43 | `target_cities` | ❌ | 0 | 🔴 CRITICAL |
| 44 | `track_layouts` | ✅ | 1 | ✅ Secure |
| 45 | `track_venues` | ✅ | 1 | ✅ Secure |
| 46 | `upgrade_key_parts` | ✅ | 1 | ✅ Secure |
| 47 | `upgrade_keys` | ✅ | 1 | ✅ Secure |
| 48 | `upgrade_packages` | ✅ | 1 | ✅ Secure |
| 49 | `user_activity` | ✅ | 2 | 🟡 Review |
| 50 | `user_compare_lists` | ✅ | 4 | ✅ Secure |
| 51 | `user_favorites` | ✅ | 3 | ✅ Secure |
| 52 | `user_feedback` | ✅ | 2 | ✅ Secure |
| 53 | `user_profiles` | ✅ | 4 | ✅ Secure |
| 54 | `user_project_parts` | ✅ | 4 | ✅ Secure |
| 55 | `user_projects` | ✅ | 4 | ✅ Secure |
| 56 | `user_service_logs` | ✅ | 4 | ✅ Secure |
| 57 | `user_vehicles` | ✅ | 4 | ✅ Secure |
| 58 | `vehicle_known_issues` | ✅ | 1 | ✅ Secure |
| 59 | `vehicle_maintenance_specs` | ✅ | 1 | ✅ Secure |
| 60 | `vehicle_service_intervals` | ✅ | 1 | ✅ Secure |
| 61 | `youtube_channels` | ✅ | 1 | ✅ Secure |
| 62 | `youtube_ingestion_queue` | ✅ | 1 | ✅ Secure |
| 63 | `youtube_video_car_links` | ✅ | 1 | ✅ Secure |
| 64 | `youtube_videos` | ✅ | 1 | ✅ Secure |

---

## Action Items

### Immediate (Before Launch)

1. **[CRITICAL]** Fix `leads` table UPDATE policy
2. **[CRITICAL]** Enable RLS on `target_cities` with public read policy
3. **[MEDIUM]** Review and document `user_activity` insert policy decision

### Post-Launch

1. Audit service role usage in cron jobs
2. Add monitoring for RLS policy violations
3. Review duplicate policies (some tables have redundant SELECT policies)

---

## 🔒 Auth Configuration Required (Manual)

### Enable Leaked Password Protection

**Issue:** Supabase Auth is not checking passwords against HaveIBeenPwned.

**Fix (Supabase Dashboard):**
1. Go to **Authentication** → **Providers** → **Email**
2. Enable **"Leaked Password Protection"**
3. Save changes

**Documentation:** https://supabase.com/docs/guides/auth/password-security

---

## ✅ All Database Security Issues RESOLVED

### Extensions - FIXED ✅

| Extension | Previous | Current | Status |
|-----------|----------|---------|--------|
| `vector` | public schema | extensions schema | ✅ FIXED |
| `pg_trgm` | public schema | extensions schema | ✅ FIXED |

**Process:**
1. Backed up 1,775 embeddings (98 cars + 547 doc chunks + 1,130 insights)
2. Dropped extensions from public schema
3. Created extensions in extensions schema
4. Restored all embedding data
5. Recreated all indexes (3 vector + 3 trigram)
6. Updated functions to use `extensions.vector` type

### Materialized View - FIXED ✅

| View | Previous | Current | Status |
|------|----------|---------|--------|
| `cars_stats` | public schema (API exposed) | internal schema | ✅ FIXED |

**Result:** View no longer accessible via Supabase REST API.

---

## Fix Migration

See: `supabase/migrations/050_rls_security_fixes.sql`

---

## Additional Security Advisories (from Supabase Linter)

The following non-RLS security items were flagged by Supabase's security advisor:

### 🔴 ERROR: Security Definer Views (4 views)

Views with SECURITY DEFINER bypass RLS of the querying user:

| View | Risk |
|------|------|
| `feedback_bug_triage` | Runs with creator's permissions |
| `al_user_balance` | Runs with creator's permissions |
| `city_coverage_report` | Runs with creator's permissions |
| `feedback_by_tier` | Runs with creator's permissions |

**Fix:** Remove SECURITY DEFINER or add proper access controls.
**Docs:** https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view

### 🟡 WARN: Function Search Path Mutable (12 functions)

Functions without explicit `search_path` can be exploited:

- `update_events_updated_at`
- `update_city_coverage_stats`
- `update_all_city_coverage_stats`
- `calculate_distance_miles`
- `resolve_feedback`
- `get_feedback_summary`
- `increment_forum_source_insights`
- `get_car_maintenance_summary`
- `search_community_insights`
- `normalize_car_slug`
- `get_feedback_counts`
- `get_unresolved_bugs`

**Fix:** Add `SET search_path = ''` to function definitions.
**Docs:** https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

### 🟡 WARN: Extensions in Public Schema (2)

- `vector` extension
- `pg_trgm` extension

**Risk:** Extensions in public schema can conflict with user-defined functions.
**Docs:** https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public

### 🟡 WARN: Materialized View Accessible to API

- `cars_stats` materialized view is selectable by anon/authenticated

**Note:** This is likely intentional (public car statistics).
**Docs:** https://supabase.com/docs/guides/database/database-linter?lint=0016_materialized_view_in_api

### 🟡 WARN: Leaked Password Protection Disabled

Auth configuration does not check passwords against HaveIBeenPwned.

**Fix:** Enable in Supabase Dashboard → Authentication → Settings.
**Docs:** https://supabase.com/docs/guides/auth/password-security

---

## Post-Fix Verification

All RLS fixes verified:

```
┌────────────────────────────────────────────┐
│ RLS STATUS AFTER MIGRATION                 │
├────────────────────────────────────────────┤
│ Tables with RLS Enabled:  64/64  (100%)   │
│ Tables with RLS Disabled:  0/64   (0%)    │
└────────────────────────────────────────────┘
```

### Verified Fixes

1. **`target_cities`** - ✅ RLS enabled, public read + service_role write
2. **`leads`** - ✅ UPDATE restricted to service_role only
3. **`user_activity`** - ✅ INSERT restricted to own user or service_role
