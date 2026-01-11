# Car Identifier Usage Audit (2026-01-11)

## Executive Summary

The database was designed with a dual-identifier pattern:
- **`car_id`** (UUID): Internal identifier for foreign keys and efficient queries
- **`car_slug`** (TEXT): Human-readable identifier for URLs and external APIs

**Problem:** Many service files and API routes still query the database using `car_slug` directly instead of first resolving to `car_id`. This leads to:
1. Inefficient queries (string comparison vs UUID lookup)
2. Inconsistent access patterns
3. Inability to fully leverage optimized indexes

## Current Usage Statistics

| Location | `car_slug` queries | `car_id` queries |
|----------|-------------------|------------------|
| `/lib` | 453 matches (36 files) | 79 matches (12 files) |
| `/app/api` | 131 matches (45 files) | 26 matches (14 files) |

## Correct Pattern

**URL Routing → API → Database:**

```
URL: /cars/porsche-911-gt3
     ↓
API Route: receives `slug` param
     ↓
Service: resolves slug → car_id ONCE
     ↓
Database: ALL queries use car_id
```

**Example (CORRECT):**
```javascript
// lib/enrichedDataService.js - GOOD PATTERN
export async function getAllEnrichedData(carSlug) {
  // Resolve car_id once
  const carId = await getCarIdFromSlug(carSlug);
  
  // Use car_id for all sub-queries
  const [fuelEconomy, safetyData, ...] = await Promise.all([
    getFuelEconomy(carSlug, carId),  // passes carId
    getSafetyData(carSlug, carId),   // passes carId
    // ...
  ]);
}
```

**Example (INCORRECT):**
```javascript
// app/api/cars/[slug]/maintenance/route.js - BAD PATTERN
const { data: specs } = await supabase
  .from('vehicle_maintenance_specs')
  .eq('car_slug', slug);  // ❌ Should use car_id
```

---

## Files Requiring Updates

### Priority 1: High-Traffic Services

| File | Issue | Fix Required |
|------|-------|--------------|
| `lib/maintenanceService.js` | Queries with `car_slug` | Add `getCarIdFromSlug`, use `car_id` |
| `lib/youtubeClient.js` | Queries with `car_slug` | Add `getCarIdFromSlug`, use `car_id` |
| `lib/alTools.js` | Multiple `car_slug` queries | Resolve once, use `car_id` throughout |
| `lib/aiMechanicService.js` | Queries with `car_slug` | Add `getCarIdFromSlug`, use `car_id` |
| `lib/complaintService.js` | Queries with `car_slug` | Add `getCarIdFromSlug`, use `car_id` |

### Priority 2: API Routes

| File | Issue | Fix Required |
|------|-------|--------------|
| `app/api/cars/[slug]/maintenance/route.js` | Direct `car_slug` queries | Resolve to car_id first |
| `app/api/cars/[slug]/dyno/route.js` | Fallback uses `car_slug` | Use optimized RPC or resolve car_id |
| `app/api/cars/[slug]/lap-times/route.js` | Likely uses `car_slug` | Verify and fix |
| All `/api/cars/[slug]/*` routes | Various | Need audit |

### Priority 3: User Data Services

| File | Issue | Fix Required |
|------|-------|--------------|
| `lib/userDataService.js` | `user_favorites` uses `car_slug` | Add car_id support |

---

## Tables with Dual Identifiers

Tables that have both `car_slug` and `car_id`:

| Table | `car_slug` Indexed | `car_id` Indexed | FK to cars | Notes |
|-------|-------------------|------------------|------------|-------|
| `car_dyno_runs` | ✅ | ✅ | ✅ | Has auto-populate trigger |
| `car_track_lap_times` | ✅ | ✅ | ✅ | Has auto-populate trigger |
| `community_insights` | ✅ | ✅ | ✅ | Has auto-populate trigger |
| `document_chunks` | ✅ | ✅ | ✅ | Has auto-populate trigger |
| `car_issues` | ✅ | ✅ | ✅ | Source of truth for known issues |
| `car_fuel_economy` | ✅ | ✅ | ✅ | Enriched data |
| `car_safety_data` | ✅ | ✅ | ✅ | Enriched data |
| `car_market_pricing` | ✅ | ✅ | ✅ | Enriched data |
| `youtube_video_car_links` | ✅ | ✅ | ✅ | Video linkage |
| `vehicle_maintenance_specs` | ✅ | ? | ❌ | Need to add car_id FK |
| `vehicle_service_intervals` | ✅ | ? | ❌ | Need to add car_id FK |
| `user_favorites` | ✅ | ✅ | ✅ | Added in migration 023 |
| `upgrade_packages` | ✅ | ✅ | ✅ | Added in migration 023 |
| `car_tuning_profiles` | ✅ | ✅ | ✅ | Main tuning data |

---

## Recommended Fix Strategy

### Phase 1: Add Helper Function (DONE)
Already added `getCarIdFromSlug()` to `lib/enrichedDataService.js`

### Phase 2: Update Core Services
1. Create shared resolver utility in `lib/carResolver.js`
2. Update `maintenanceService.js` to use car_id
3. Update `youtubeClient.js` to use car_id
4. Update `alTools.js` getKnownIssues to use car_id
5. Update `aiMechanicService.js` to use car_id

### Phase 3: Update API Routes
Update all `/api/cars/[slug]/*` routes to:
1. Receive slug from URL (keep this)
2. Resolve to car_id once at start of handler
3. Use car_id for all database queries

### Phase 4: Database Cleanup
1. Add `car_id` column to tables missing it (vehicle_maintenance_specs, vehicle_service_intervals)
2. Backfill car_id values
3. Add auto-populate triggers
4. Add NOT NULL constraints after verification

---

## Action Items - COMPLETED ✅

- [x] Create `lib/carResolver.js` with shared `resolveCarId()` function
- [x] Update `lib/maintenanceService.js` - Now uses car_id for all queries
- [x] Update `lib/youtubeClient.js` - Now uses car_id for video lookups
- [x] Update `lib/alTools.js` (getKnownIssues, getCarDetails) - Now uses car_id
- [x] Update `lib/aiMechanicService.js` - Now uses car_id for user projects
- [x] Update `app/api/cars/[slug]/maintenance/route.js` - Uses car_issues + car_id
- [x] Update `app/api/cars/[slug]/dyno/route.js` - Fallback uses car_id
- [x] Add car_id to vehicle_maintenance_specs table - Migration created
- [x] Add car_id to vehicle_service_intervals table - Migration created
- [x] Create migration: `20260111_add_car_id_to_maintenance_tables.sql`

---

## Validation Queries

After fixes, run these to verify:

```sql
-- Check all tables have car_id populated
SELECT 'car_dyno_runs' as tbl, COUNT(*) as total, COUNT(car_id) as with_car_id FROM car_dyno_runs
UNION ALL
SELECT 'car_track_lap_times', COUNT(*), COUNT(car_id) FROM car_track_lap_times
UNION ALL
SELECT 'community_insights', COUNT(*), COUNT(car_id) FROM community_insights
UNION ALL
SELECT 'car_issues', COUNT(*), COUNT(car_id) FROM car_issues
UNION ALL
SELECT 'youtube_video_car_links', COUNT(*), COUNT(car_id) FROM youtube_video_car_links;

-- Verify no orphaned car_slugs (should return 0)
SELECT COUNT(*) FROM car_issues ci
WHERE NOT EXISTS (SELECT 1 FROM cars c WHERE c.slug = ci.car_slug);
```
