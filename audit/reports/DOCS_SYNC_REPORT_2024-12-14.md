# Documentation Sync Report

> 📦 **ARCHIVED:** This report has been superseded by the December 15, 2024 comprehensive documentation update.
>
> All documented issues have been resolved. See updated files for current state.
>
> ~~**Date:** December 14, 2024~~
> ~~**Scope:** Complete documentation audit against codebase and database~~
> ~~**Method:** MCP Supabase queries + Code inspection~~  

---

## Executive Summary

| Category | Findings | Status |
|----------|----------|--------|
| **Database Row Counts** | 15 significant updates | 🔴 Needs Update |
| **API Routes** | 4 undocumented routes, 1 method mismatch | 🔴 Needs Update |
| **Schema Columns** | 2 documentation errors | 🔴 Needs Update |
| **Cron Jobs** | 1 new cron job | 🔴 Needs Update |
| **AL Configuration** | Minor model name update | 🟡 Minor |
| **Features/Stats** | Multiple count updates | 🔴 Needs Update |

---

## P0 — Critical Issues (Runtime/Correctness Risk)

### P0-001: RESOLVED — `/api/cars` Route
**Previous Issue:** Route did not exist, breaking internal admin pages.  
**Status:** ✅ FIXED — `app/api/cars/route.js` now exists and returns car list.

### P0-002: DATABASE.md Column Names Wrong (`part_relationships`)
**Location:** `docs/DATABASE.md` line ~157  
**Documentation Says:**
- `part_id_a` (FK to part A)
- `part_id_b` (FK to part B)
- `relationship_type`

**Actual Schema (verified via MCP):**
- `part_id` (FK to part A)
- `related_part_id` (FK to part B)
- `relation_type`

**Impact:** Code referencing documentation would break.

### P0-003: DATABASE.md Column Name Wrong (`document_chunks`)
**Location:** `docs/DATABASE.md` line ~374  
**Documentation Says:** `source_document_id`  
**Actual Schema:** `document_id`  
**Impact:** Code referencing documentation would break.

### P0-004: API.md Method Mismatch (`/api/parts/relationships`)
**Location:** `docs/API.md` line ~303  
**Documentation Says:** GET  
**Actual Implementation:** POST  
**Impact:** API consumers would use wrong HTTP method.

---

## P1 — High Priority (Misleading Documentation)

### P1-001: 4 API Routes Not Documented

| Route | Method | Purpose | File |
|-------|--------|---------|------|
| `GET /api/cars` | GET | List all cars with basic info | `app/api/cars/route.js` |
| `GET /api/cars/[slug]/recalls` | GET | Get recall campaigns for a car | `app/api/cars/[slug]/recalls/route.js` |
| `GET /api/cron/refresh-recalls` | GET | Cron job to refresh NHTSA recalls | `app/api/cron/refresh-recalls/route.js` |
| `POST /api/vin/safety` | POST | VIN safety data proxy (NHTSA) | `app/api/vin/safety/route.js` |

### P1-002: Database Row Counts Significantly Changed

| Table | Documented | Actual | Change |
|-------|------------|--------|--------|
| `cars` | 98 | 98 | — |
| `car_fuel_economy` | 95 | **98** | +3 (100% coverage) |
| `car_issues` | 89 | **154** | +65 (+73%) |
| `car_dyno_runs` | 6 | **29** | +23 (+383%) |
| `car_track_lap_times` | 20 | **65** | +45 (+225%) |
| `car_recalls` | 0 | **241** | NEW DATA |
| `parts` | 172 | **642** | +470 (+273%) |
| `part_fitments` | 271 | **836** | +565 (+208%) |
| `fitment_tag_mappings` | 11 | **124** | +113 |
| `track_venues` | 16 | **21** | +5 |
| `youtube_videos` | 289 | **288** | -1 |
| `youtube_video_car_links` | 292 | **291** | -1 |
| `al_conversations` | 6 | **7** | +1 |
| `al_messages` | 29 | **33** | +4 |
| `user_vehicles` | 0 | **1** | NEW |

### P1-003: Cron Job Not Documented

**New Cron in `vercel.json`:**
```json
{
  "path": "/api/cron/refresh-recalls?concurrency=3",
  "schedule": "30 2 * * 0"
}
```
**Schedule:** Sunday 2:30 AM UTC  
**Purpose:** Refresh NHTSA recall data for all cars

### P1-004: API.md Cron Schedules Outdated

| Route | Documented Schedule | Actual Schedule |
|-------|---------------------|-----------------|
| schedule-ingestion | "Daily" | Weekly (Sun 2am UTC) |
| process-scrape-jobs | "Hourly" | Every 15 min + Weekly batch |
| youtube-enrichment | "Every 6h" | Weekly (Mon 4am UTC) |
| refresh-recalls | NOT DOCUMENTED | Weekly (Sun 2:30am UTC) |

---

## P2 — Medium Priority (Stale but Non-Blocking)

### P2-001: index.md Stats Outdated

| Metric | Documented | Actual |
|--------|------------|--------|
| Database Tables | 51 | **52** |
| Tables Populated | 31 | **40+** |
| Tables Empty | 20 | **12** |
| API Routes | 37 | **41** |
| Parts in Catalog | 172 | **642** |
| Part Fitments | 271 | **836** |

### P2-002: DATABASE.md Overview Table Wrong

Documentation says:
- Core Car Data: 14 tables (should be 15 with `car_recalls`)
- Parts & Upgrades: 8 tables
- Total: 51 tables

Actual: 52 tables (includes `cars_stats` materialized view)

### P2-003: FEATURES.md Data Counts Outdated

| Metric | Documented | Actual |
|--------|------------|--------|
| Parts in catalog | 169 | **642** |
| Part fitments | 271 | **836** |
| Track venues | 16 | **21** |
| Maintenance specs | "49 cars" | **98 cars** (100%) |

### P2-004: AL.md Model Name Slight Mismatch
**Documentation:** "Claude Sonnet 4"  
**Actual Code:** `claude-sonnet-4-20250514`  
**Impact:** Minor — name is correct, just missing version suffix.

---

## P3 — Low Priority (Nice-to-Have)

### P3-001: KNOWN_ISSUES_BACKLOG.md Stats Outdated
- Shows 89 car_issues, actual is 154
- P0 completion status may need update

### P3-002: Audit Files Can Be Archived
- `docs/AUDIT_2024-12-14.md` has open items now resolved
- `docs/AUDIT_DATABASE_2024-12-14.md` row counts outdated

---

## Cross-Document Consistency Checks

### ✅ Tier System — Consistent
- `lib/tierAccess.js` matches ARCHITECTURE.md
- Feature tiers align across docs

### ✅ AL Tools — Consistent
- 15 tools documented, 15 tools implemented
- Tool access by tier verified in `lib/alConfig.js`

### ⚠️ API Route Count — Inconsistent
- index.md says 37 routes
- API.md documents 37 routes
- Actual: 41 routes (4 undocumented)

### ⚠️ Database Table Count — Inconsistent
- index.md says 51 tables
- DATABASE.md documents 51 tables
- Actual: 52 tables (`cars_stats` undocumented)

---

## SQL Queries Used for Validation

```sql
-- Table row counts
SELECT relname as table_name, n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY relname;

-- part_relationships columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'part_relationships' 
AND table_schema = 'public';

-- document_chunks columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'document_chunks' 
AND table_schema = 'public';
```

---

## Files Updated in This Sync

1. `docs/DOCS_SYNC_REPORT_2024-12-14.md` — This report
2. `docs/index.md` — Updated counts and metrics
3. `docs/DATABASE.md` — Fixed columns, updated row counts
4. `docs/API.md` — Added 4 routes, fixed method, updated crons
5. `docs/FEATURES.md` — Updated data counts
6. `docs/AL.md` — Minor model name clarification

---

*Generated by code-first audit on 2024-12-14.*


