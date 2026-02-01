# Teoalida Migration Status

> **Last Updated**: January 31, 2026
> **Status**: Phase 1 Complete - Code Updated, Content Migration Pending

---

## Executive Summary

The AutoRev database has been migrated from a legacy car structure to the Teoalida YMMT (Year/Make/Model/Trim) database containing **75,750 accurate vehicle records**.

### What's Complete

- ✅ `cars` table swapped to Teoalida data
- ✅ All 67 user vehicles migrated to new car IDs
- ✅ 50+ code files updated to new field names
- ✅ Clean schema documented (no backward-compat hacks)

### What Needs Work

- ⚠️ Content tables (issues, tuning, lap times) still linked to legacy
- ⚠️ User favorites (17) still linked to legacy
- ⚠️ User projects (52) still linked to legacy

---

## Database Structure

### Current Tables

| Table              | Records | Status     | Notes                           |
| ------------------ | ------- | ---------- | ------------------------------- |
| `cars`             | 75,750  | ✅ Active  | Teoalida YMMT data              |
| `cars_v1_legacy`   | 2,028   | 🗄️ Archive | Will be removed after migration |
| `car_generations`  | 0       | ⏳ Ready   | For shared content across years |
| `car_id_migration` | 0       | ⏳ Ready   | For tracking ID mappings        |

### User Data Tables

| Table            | Total | Linked to New | Status             |
| ---------------- | ----- | ------------- | ------------------ |
| `user_vehicles`  | 67    | 67 (100%)     | ✅ Complete        |
| `user_favorites` | 17    | 0 (0%)        | ❌ Needs migration |
| `user_projects`  | 52    | 0 (0%)        | ❌ Needs migration |

### Content Tables (All Linked to Legacy)

| Table                       | Records | Linked to New | Action Needed       |
| --------------------------- | ------- | ------------- | ------------------- |
| `car_issues`                | 9,098   | 0             | Regenerate via AI   |
| `car_tuning_profiles`       | 310     | 0             | Regenerate via AI   |
| `car_track_lap_times`       | 1,324   | 0             | Map to new cars     |
| `vehicle_maintenance_specs` | 312     | 0             | Regenerate via AI   |
| `vehicle_service_intervals` | 6,099   | 0             | Regenerate via AI   |
| `car_recalls`               | 1,360   | 0             | Re-fetch from NHTSA |
| `car_expert_reviews`        | 1,004   | 0             | Keep or regenerate  |
| `car_dyno_runs`             | 641     | 0             | Map to new cars     |
| `car_safety_data`           | 190     | 0             | Re-fetch from IIHS  |

---

## Field Mapping Reference

All code has been updated to use these new field names:

| ❌ Old (Removed)                  | ✅ New (Use This)                       |
| --------------------------------- | --------------------------------------- |
| `brand`                           | `make`                                  |
| `years` (text)                    | `year` (integer)                        |
| `engine`                          | `engineType` / `engine_type`            |
| `trans`                           | `transmission`                          |
| `drivetrain`                      | `driveType` / `drive_type`              |
| `priceAvg` / `price_avg`          | `msrp`                                  |
| `priceRange` / `price_range`      | `msrp` (format in code)                 |
| `country`                         | `countryOfOrigin` / `country_of_origin` |
| `imageHeroUrl` / `image_hero_url` | `imageUrl` / `image_url`                |
| `structure_version`               | _(removed)_                             |
| `parent_car_id`                   | `generation_id`                         |

---

## Migration Phases

### Phase 1: Core Migration ✅ COMPLETE

1. ✅ Swap tables: `cars_teoalida` → `cars`, `cars` → `cars_v1_legacy`
2. ✅ Migrate user_vehicles (67 records) to new Teoalida car IDs
3. ✅ Add `tier` and `category` columns (derived from msrp/body_type)
4. ✅ Update all code files to new field names
5. ✅ Document clean schema in `TEOALIDA_SCHEMA.md`

### Phase 2: User Data Migration (PENDING)

Migrate remaining user data to new car IDs:

1. **user_favorites** (17 records)
   - Match legacy car names to Teoalida equivalents
   - Update `car_id` to new UUIDs

2. **user_projects** (52 records)
   - Match legacy car names to Teoalida equivalents
   - Update `car_id` to new UUIDs
   - Note: Build configurations may need adjustment for new specs

### Phase 3: Content Strategy (PENDING)

**Decision needed**: How to handle 20,000+ content records?

**Option A: Regenerate** (Recommended)

- Use AI to regenerate issues, tuning, maintenance for Teoalida cars
- Leverage accurate specs (hp, torque, weight, etc.)
- Link via `car_generations` for shared content across model years

**Option B: Migrate**

- Map legacy car IDs to Teoalida car IDs
- Risk: Content may not match exact year/trim specs

**Option C: Hybrid**

- Migrate lap times and dyno runs (hard data)
- Regenerate issues, tuning, maintenance (AI content)

### Phase 4: Legacy Cleanup (PENDING)

After all migrations complete:

1. Verify no tables reference `cars_v1_legacy`
2. Drop foreign key constraints
3. Archive or drop `cars_v1_legacy` table
4. Remove `car_id_migration` table

---

## Code Files Updated

### API Routes (14 files)

- `app/api/cars/route.js` ✅
- `app/api/cars/[slug]/route.js` ✅
- `app/api/cron/refresh-complaints/route.js` ✅
- `app/api/cron/refresh-recalls/route.js` ✅
- `app/api/cron/al-optimization/route.js` ✅
- `app/api/cron/youtube-enrichment/route.js` ✅
- `app/api/cars/[slug]/safety/route.js` ✅
- `app/api/cars/[slug]/fuel-economy/route.js` ✅
- `app/api/cars/expert-reviewed/route.js` ✅
- `app/api/cars/[slug]/pricing/route.js` ✅
- `app/api/community/builds/route.js` ✅
- `app/api/admin/dashboard/route.js` ✅
- `app/api/admin/usage/route.js` ✅
- `app/api/internal/car-variants/route.js` ✅

### Core Lib Files (25+ files)

- `lib/carResolver.js` ✅
- `lib/carsClient.js` ✅
- `lib/carsCache.js` ✅
- `lib/comparisonService.js` ✅
- `lib/filterUtils.js` ✅
- `lib/userDataService.js` ✅
- `lib/alTools.js` ✅
- `lib/seoUtils.js` ✅
- `lib/aiMechanicService.js` ✅
- ... and 15+ more

### Components (16+ files)

- `components/AddVehicleModal.jsx` ✅
- `components/SportsCarComparison.jsx` ✅
- `components/PerformanceHub.jsx` ✅
- `components/tuning-shop/FactoryConfig.jsx` ✅
- `components/tuning-shop/StickyCarHeader.jsx` ✅
- ... and 11+ more

---

## Verification Checklist

Before marking migration complete:

- [ ] Dev server runs without errors
- [ ] Browse cars page loads 75,750 records
- [ ] Individual car pages display correct data
- [ ] Garage shows user's vehicles with correct info
- [ ] Add Vehicle modal works with new field names
- [ ] Favorites can be added/removed
- [ ] Build projects load correctly
- [ ] AL assistant works with new schema
- [ ] SEO metadata generates correctly
- [ ] No console errors in browser

---

## Next Steps

1. **Immediate**: Run dev server and verify critical paths
2. **This Week**: Migrate user_favorites and user_projects
3. **Next Sprint**: Decide on content strategy (regenerate vs migrate)
4. **Future**: Remove cars_v1_legacy after content migration
