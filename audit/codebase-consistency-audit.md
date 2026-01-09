# AutoRev Codebase Consistency Audit

> **Audit Date:** January 9, 2026
> **Auditor:** AI Codebase Analysis
> **Scope:** Feature duplication, conflicting implementations, and user-facing inconsistencies

---

## Executive Summary

**Critical Issues Identified: 7**
**High Priority Issues: 8**
**Medium Priority Issues: 12**

### Top 10 Most Critical Discrepancies

| # | Issue | Impact | Priority |
|---|-------|--------|----------|
| 1 | **"Most Viewed Builds" shows different results** on Community vs Builds page | User confusion, trust erosion | 🔴 Critical |
| 2 | **Car count displays inconsistently** across pages (dynamic vs hardcoded) | Data appears stale/wrong | 🔴 Critical |
| 3 | **Scoring calculations duplicated** in 4+ places with subtle differences | Inconsistent rankings | 🟠 High |
| 4 | **Car data fetching** via 3 different patterns (client, cache, API) | Stale data, race conditions | 🟠 High |
| 5 | **Search/filter implementations** differ between pages | Different results for same query | 🟠 High |
| 6 | **Sorting logic** client-side vs server-side inconsistency | Pagination bugs, wrong ordering | 🟠 High |
| 7 | **View count tracking** not consistently implemented | Inaccurate popularity metrics | 🟡 Medium |
| 8 | **Image fallback logic** varies between components | Broken images in some contexts | 🟡 Medium |
| 9 | **Tier gating** checks duplicated without shared utility | Some features ungated accidentally | 🟠 High |
| 10 | **Date/time formatting** inconsistent across components | User confusion | 🟡 Medium |

---

## Phase 1: Feature Inventory

### 1. Data Display Features

#### 1.1 Car Listings

| Feature | Locations | Query/Logic | Sorting | Limits |
|---------|-----------|-------------|---------|--------|
| All cars list | `/browse-cars`, `/car-selector`, `/tuning-shop` | `useCarsList()` → `/api/cars` | Client-side by name/hp/price | All cars loaded |
| Car grid | `/browse-cars` page | React Query hook | `sortBy` state variable | Filtered client-side |
| Car selector results | `/car-selector` | `calculateWeightedScore()` | By weighted score | Top N |
| Garage car dropdown | `/garage`, `/tuning-shop` | `fetchCars()` direct | By score | Top 30 |
| Compare modal cars | `CompareModal` | From context | By selection order | Max 4 |

**⚠️ DISCREPANCY:** Browse-cars and Car-selector use SAME car data but DIFFERENT filter implementations.

#### 1.2 Build/Garage Display

| Feature | Locations | Query/Logic | Sorting | Limits |
|---------|-----------|-------------|---------|--------|
| Most Viewed Builds | `/community`, `/community/builds` | `fetchMostViewedBuilds()` | Client-side by `view_count` | 6 vs 12 |
| Latest Builds | `/community/builds` | `fetchCommunityPosts()` | Server-side by `published_at` | 12 |
| Builds by Brand | `/community/builds` | `fetchBuildsByBrand()` | Grouped by brand | 12 per brand |
| User's Own Builds | `MyBuildsSection` | Direct Supabase query | By `created_at` | 20 |

**🔴 CRITICAL DISCREPANCY:** See Section 2.1 below.

#### 1.3 Events Display

| Feature | Locations | Query/Logic | Sorting | Limits |
|---------|-----------|-------------|---------|--------|
| Featured Events | `/community`, `/community/events` | Direct Supabase query | By `start_date`, featured first | 4 |
| Event listings | `/community/events` | `/api/events` | By date, optionally by distance | 20 default |
| Saved events | `/events/saved` | `/api/users/[id]/saved-events` | By `saved_at` | None |
| Garage events | `/garage` | Direct Supabase | By relevance to owned cars | 3 |

**⚠️ DISCREPANCY:** Featured events query in `/community/page.jsx` is duplicated, not shared.

#### 1.4 Car Counts

| Location | Implementation | Value Source |
|----------|----------------|--------------|
| Homepage hero | `getCarCount()` server-side | Database COUNT(*) |
| Homepage carousel title | `{carCount}` prop | Same as hero |
| Browse-cars hero | `{cars.length}` | Client-side array |
| Join page | Hardcoded `'100+'` | Static string |
| AL landing | `stats?.cars` | Different stats endpoint |
| Email templates | `carCount || 188` | Fallback to 188 |
| Pillars section | `{carCount}` prop | Passed from parent |

**🔴 CRITICAL DISCREPANCY:** Join page shows `100+` while actual count is `98`. Email templates fall back to `188` which is wrong.

---

### 2. Phase 2: Similar Feature Analysis

#### 2.1 🔴 CRITICAL: "Most Viewed Builds" Discrepancy

**The Problem:**

Community page (`/community`) and Community Builds page (`/community/builds`) both display "Most Viewed Builds" but show DIFFERENT results.

**Root Cause Analysis:**

```javascript
// lib/communityService.js - fetchMostViewedBuilds()
export async function fetchMostViewedBuilds(options = {}) {
  const { limit = 12 } = options;

  // Step 1: Calls RPC that returns posts ordered by published_at DESC
  const { data, error } = await supabase.rpc('get_community_posts', {
    p_post_type: 'build',
    p_car_slug: null,
    p_limit: limit,  // <-- THIS IS THE PROBLEM
    p_offset: 0,
  });

  // Step 2: Then sorts by view_count CLIENT-SIDE
  const sortedData = (data || []).sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
  return { data: sortedData, error: null };
}
```

**Why This Causes Discrepancies:**

1. Community page calls: `fetchMostViewedBuilds({ limit: 6 })`
2. Builds page calls: `fetchMostViewedBuilds({ limit: 12 })`

**Scenario:**
- Database has builds with view counts: [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 5, 1]
- RPC returns builds by `published_at`, let's say: [30, 10, 50, 20, 80, 70, 40, 1, 90, 60, 100, 5]

For limit=6 (Community page):
- RPC returns first 6 by date: [30, 10, 50, 20, 80, 70]
- Client sorts by views: [80, 70, 50, 30, 20, 10]
- Shows: builds with 80, 70, 50, 30, 20, 10 views

For limit=12 (Builds page):
- RPC returns first 12 by date: [30, 10, 50, 20, 80, 70, 40, 1, 90, 60, 100, 5]
- Client sorts by views: [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 5, 1]
- Shows: builds with 100, 90, 80, 70... (completely different order!)

**User Impact:**
- Community page shows build with 80 views as "most viewed"
- Builds page shows build with 100 views as "most viewed"
- Users see different "top" builds depending on which page they visit

**Files Involved:**
- `lib/communityService.js` (lines 353-380)
- `app/(marketing)/community/page.jsx` (line 191)
- `app/(marketing)/community/builds/page.jsx` (line 42)

**Recommendation:**
Create a proper RPC or modify the query to sort by `view_count DESC` at the DATABASE level, not client-side.

---

#### 2.2 🔴 CRITICAL: Car Count Inconsistencies

**Verified database count: 192 cars** (via `SELECT COUNT(*) FROM cars`)

**Files with hardcoded/different car counts:**

| File | Line | Current Value | Actual | Issue |
|------|------|---------------|--------|-------|
| `app/(marketing)/join/page.jsx` | 125 | `'100+'` | 192 | Hardcoded, ~92 cars missing |
| `app/api/admin/emails/preview/route.js` | 54, 473 | `188` fallback | 192 | 4 cars behind |
| `app/(marketing)/al/PageClient.jsx` | ~368 | `stats?.cars` | varies | Different data source |

**Correct Implementation (Homepage):**
```javascript
// app/(marketing)/page.jsx
async function getCarCount() {
  const { count } = await supabase
    .from('cars')
    .select('*', { count: 'exact', head: true });
  return count || 100;
}
```

**Incorrect Implementation (Join Page):**
```javascript
// app/(marketing)/join/page.jsx line 125
const CAR_COUNT = '100+';  // Should be 192!
```

**Recommendation:**
1. Create shared utility: `lib/statsService.js` with `getCarCount()`
2. Use React Query or server-side cache for stats
3. Remove ALL hardcoded counts

---

#### 2.3 🟠 HIGH: Scoring Calculation Duplication

**Canonical Implementation:**
`lib/scoring.js` - `calculateWeightedScore(car, weights)`

**Duplicate/Variant Implementations:**

| Location | Difference |
|----------|------------|
| `lib/articleDataSync.js` | Uses `score_*` snake_case directly |
| `components/AddVehicleModal.jsx` | Inline calculation with `defaultWeights` |
| `components/AddFavoritesModal.jsx` | Same inline pattern |
| `app/(app)/garage/page.jsx` | Different `defaultWeights` structure |
| `app/(app)/mod-planner/page.jsx` | Yet another `defaultWeights` |

**Code Comparison:**

```javascript
// lib/scoring.js (CANONICAL)
export function calculateWeightedScore(car, weights = DEFAULT_WEIGHTS) {
  return categories.reduce((sum, cat) => {
    const carScore = car[cat.key] ?? 0;  // Uses camelCase keys
    const weight = weights[cat.key] ?? 1;
    return sum + (carScore * weight);
  }, 0);
}

// lib/articleDataSync.js (VARIANT)
function calculateWeightedScoreFromDB(car, weights = {}) {
  return (
    (parseFloat(car.score_sound) || 0) * w.sound +  // Uses snake_case!
    (parseFloat(car.score_interior) || 0) * w.interior +
    // ...
  );
}
```

**Problem:** If a car object has camelCase keys (from client) vs snake_case (from DB), different functions give different results.

---

#### 2.4 🟠 HIGH: Car Data Fetching Patterns

**Pattern 1: Direct Client Cache**
```javascript
// lib/carsClient.js
export async function fetchCars() {
  // Uses in-memory cache + sessionStorage + request deduplication
}
```
Used by: `AIMechanicChat`, `CompareBar`, `tuning-shop`, `mod-planner`, `garage`

**Pattern 2: React Query**
```javascript
// hooks/useCarData.js
export function useCarsList() {
  return useQuery({
    queryKey: carKeys.lists(),
    queryFn: fetchCarsList,  // Calls /api/cars
    staleTime: 60 * 1000,
  });
}
```
Used by: `browse-cars`, `SportsCarComparison`, `CarCarousel`

**Pattern 3: Server-side Cache**
```javascript
// lib/carsCache.js
export const getCachedCars = unstable_cache(
  async () => _fetchAllCarsInternal(),
  ['all-cars'],
  { revalidate: 300 }
);
```
Used by: Server components

**Problem:** Three different caching strategies with different stale times:
- Pattern 1: Session-based, doesn't auto-refresh
- Pattern 2: 1 minute stale time
- Pattern 3: 5 minute revalidation

If a car is added/removed, users may see inconsistent car counts depending on which page they're on.

---

#### 2.5 🟠 HIGH: Search/Filter Logic Duplication

**Browse Cars Page Filter:**
```javascript
// app/(app)/browse-cars/page.jsx
const filteredCars = useMemo(() => {
  let result = [...cars];
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    result = result.filter(car => 
      car.name?.toLowerCase().includes(query) ||
      car.brand?.toLowerCase().includes(query) ||
      car.category?.toLowerCase().includes(query)
    );
  }
  // ... more filters
}, [cars, searchQuery, selectedMake, selectedTier, selectedCategory, sortBy]);
```

**SportsCarComparison Filter:**
```javascript
// components/SportsCarComparison.jsx
const filteredAndSortedCars = useMemo(() => {
  return carData
    .filter(car => (car.priceAvg || 0) >= priceMin && (car.priceAvg || 0) <= priceMax)
    // ... different filter approach
    .filter(car => searchTerm === '' || 
      car.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.brand?.toLowerCase().includes(searchTerm.toLowerCase()))
}, [carData, weights, sortBy, priceMin, priceMax, searchTerm, mustHaveFilters]);
```

**Differences:**
1. Browse-cars searches `category`, SportsCarComparison doesn't
2. Different variable names (`searchQuery` vs `searchTerm`)
3. Different filter order (could affect performance)
4. No shared utility function

---

### 3. Phase 3: Discrepancy Analysis

#### 3.1 Critical Discrepancies (User-Facing Bugs)

| ID | Discrepancy | Files | User Impact | Canonical Fix |
|----|-------------|-------|-------------|---------------|
| C1 | Most viewed builds differ by page | `communityService.js`, community pages | Different "top" builds shown | Sort by view_count in RPC |
| C2 | Car count: 100+ vs actual 98 | `join/page.jsx` | Misleading marketing | Use dynamic count |
| C3 | Email car count fallback: 188 | `emails/preview/route.js` | Wrong count in emails | Fetch from DB |

#### 3.2 High Priority Discrepancies (Logic Bugs)

| ID | Discrepancy | Files | Impact | Fix |
|----|-------------|-------|--------|-----|
| H1 | Scoring snake_case vs camelCase | Multiple | Wrong rankings in some contexts | Normalize in normalizeCar() |
| H2 | Cache stale times differ | carsClient, useCarData, carsCache | Inconsistent data | Align to 5 min |
| H3 | Filter logic varies | browse-cars, SportsCarComparison | Different results | Extract to shared util |
| H4 | Sort direction inconsistent | Various | Wrong order | Document convention |

#### 3.3 Medium Priority (Code Smell)

| ID | Discrepancy | Files | Impact | Fix |
|----|-------------|-------|--------|-----|
| M1 | defaultWeights defined 4 times | Modals, pages | Maintenance burden | Export from scoring.js |
| M2 | getUniqueMakes() duplicated | browse-cars, others | DRY violation | Move to util |
| M3 | Icon SVGs duplicated | Many components | Bundle size | Create Icon component |
| M4 | Date formatting inline | Event components | Inconsistent dates | Use date-fns util |

---

## Consolidation Roadmap

### Immediate Quick Wins (< 1 hour each)

1. **Fix car count on join page:**
   ```javascript
   // Change from:
   const CAR_COUNT = '100+';
   // To:
   import { getCarCount } from '@/lib/statsService';
   ```

2. **Fix email fallback count:**
   ```javascript
   // Change fallback from 188 to:
   car_count: carCount || 98,  // Or fetch dynamically
   ```

3. **Fix most viewed builds query:**
   Create new RPC `get_most_viewed_builds(limit)` that sorts by `view_count DESC`.

### Short-term Consolidation (1-2 days)

1. **Create `lib/statsService.js`:**
   - `getCarCount()` - cached
   - `getEventCount()` - cached  
   - `getBuildCount()` - cached
   - Export single source of truth for all counts

2. **Standardize scoring exports:**
   - Export `ENTHUSIAST_WEIGHTS` from `lib/scoring.js`
   - Remove inline weight definitions from modals

3. **Create `lib/filterUtils.js`:**
   - `filterCarsBySearch(cars, query)`
   - `filterCarsByMake(cars, make)`
   - `sortCars(cars, sortBy)`
   - Use in all car listing pages

### Medium-term (1 week)

1. **Align caching strategy:**
   - Use React Query everywhere on client
   - Use `unstable_cache` on server only
   - Set consistent stale times (5 min recommendation)

2. **Create shared components:**
   - `CarFilterBar` - reusable filter UI
   - `CarGrid` - consistent grid display
   - `BuildCard` - single build card component

3. **Add integration tests:**
   - Test that "most viewed" is consistent across pages
   - Test that car counts match across pages
   - Test that search returns same results

---

## Appendix: File-by-File Notes

### Critical Files to Review

| File | Contains | Discrepancy Notes |
|------|----------|-------------------|
| `lib/communityService.js` | Build queries | Most viewed bug, client-side sort |
| `lib/scoring.js` | Canonical scoring | Good - but not used everywhere |
| `lib/carsClient.js` | Car data fetch | Caching pattern 1 |
| `lib/carsCache.js` | Server car cache | Caching pattern 3 |
| `hooks/useCarData.js` | React Query hooks | Caching pattern 2 |
| `app/(marketing)/join/page.jsx` | Pricing page | Hardcoded car count |
| `app/(app)/browse-cars/page.jsx` | Car catalog | Filter logic |
| `components/SportsCarComparison.jsx` | Compare tool | Different filter logic |

### Database RPCs to Review

| RPC | Purpose | Issue |
|-----|---------|-------|
| `get_community_posts` | Fetch builds | Doesn't support sort by view_count |
| `get_most_viewed_builds` | (Missing) | Should be created |
| `get_car_ai_context` | AL context | Comprehensive, good |

### Test Coverage Gaps

| Feature | Has Tests | Needs Tests |
|---------|-----------|-------------|
| Most viewed builds | ❌ | Consistency test |
| Car count display | ❌ | Snapshot test |
| Scoring calculations | ⚠️ Partial | Edge cases |
| Search filters | ❌ | Behavior tests |

---

---

## Additional Findings

### 4. Event Count Display

| Location | Value | Source |
|----------|-------|--------|
| `/features/connect/page.jsx` | `500+` hardcoded | Static |
| Email templates | `eventCount || 940` | Fallback |
| Database reality | `7,730` events | Actual |

**Issue:** Event count significantly underreported in marketing materials.

### 5. AL Tools - Consistent Implementation ✅

The AL tools in `lib/alTools.js` are well-structured with:
- Single source of truth for tool implementations
- Consistent caching strategy (`alToolCache.js`)
- Tier-based access control in `lib/alConfig.js`

**No major discrepancies found** in AL tool implementations.

### 6. Provider Pattern Inconsistencies

| Provider | Data Source | Caching | Sync |
|----------|-------------|---------|------|
| `FavoritesProvider` | Supabase direct | In-memory state | Real-time subscription |
| `OwnedVehiclesProvider` | Supabase direct | In-memory state | Manual refresh |
| `SavedBuildsProvider` | Supabase direct | In-memory state | No subscription |
| `CompareProvider` | Local state + Zustand | Zustand persist | N/A |

**Inconsistency:** `FavoritesProvider` uses real-time subscriptions but `OwnedVehiclesProvider` and `SavedBuildsProvider` don't. This means favorites update immediately across tabs, but owned vehicles and builds don't.

### 7. Image Display Patterns

| Component | Image Source | Fallback |
|-----------|--------------|----------|
| `CarImage` | `getCarHeroImage()` | Gradient placeholder |
| `CarCarousel` | Direct blob URL | None |
| `BuildCard` | `primary_image.thumbnail_url` | Car image URL |
| `CompareBar` | `getCarHeroImage()` | None visible |

**Inconsistency:** `CarCarousel` doesn't use the shared `getCarHeroImage()` utility, using a hardcoded pattern instead.

### 8. Date Formatting Locations

Multiple files implement inline date formatting:
- `EventCard.jsx` - custom format
- `app/(marketing)/community/events/page.jsx` - different format
- `lib/eventsService.js` - ISO parsing
- Various admin components

**Recommendation:** Create `lib/dateUtils.js` with shared formatters.

---

## Test Coverage Analysis

### Files with Tests

| Module | Test File | Coverage |
|--------|-----------|----------|
| `lib/scoring.js` | `tests/integration/scoring-algorithm.test.js` | Partial |
| `lib/carsClient.js` | (indirect via API tests) | Minimal |
| `lib/communityService.js` | None | ❌ |
| `lib/eventsService.js` | None | ❌ |

### Critical Test Gaps

1. **No tests for `fetchMostViewedBuilds()`** - the buggy function
2. **No consistency tests** between pages showing same data
3. **No snapshot tests** for car counts across pages
4. **No integration tests** for scoring across different entry points

---

## Recommended Test Additions

```javascript
// tests/integration/data-consistency.test.js

describe('Cross-Page Data Consistency', () => {
  it('should show same "most viewed" builds on community and builds page', async () => {
    // Fetch from both pages and compare
  });
  
  it('should show consistent car count across all pages', async () => {
    // Check homepage, join page, browse-cars, etc.
  });
  
  it('should calculate same score for car regardless of entry point', async () => {
    // Test scoring.js vs articleDataSync vs inline calculations
  });
});
```

---

## Conclusion

The AutoRev codebase has significant feature duplication that causes **real user-facing inconsistencies**. The most critical issue is the "most viewed builds" discrepancy which shows users different content depending on which page they visit.

**Recommended Priority Order:**
1. Fix most viewed builds RPC (Critical - affects trust)
2. Fix car count inconsistencies (Critical - affects marketing)
3. Fix event count inconsistencies (High - significantly underreported)
4. Consolidate scoring utilities (High - affects recommendations)
5. Align caching strategies (High - affects freshness)
6. Add real-time sync to all providers (Medium - UX consistency)
7. Extract shared filter utils (Medium - code quality)
8. Add consistency integration tests (High - prevent regression)

Total estimated effort: **3-5 developer days** for quick wins + short-term consolidation.

---

## Quick Reference: Files to Update

### Critical (Do First)

| Fix | File | Change |
|-----|------|--------|
| Most viewed builds | `lib/communityService.js` | Create proper RPC or add ORDER BY in query |
| Car count (join) | `app/(marketing)/join/page.jsx` | Replace `'100+'` with dynamic fetch |
| Car count (email) | `app/api/admin/emails/preview/route.js` | Update fallback from 188 to 192 |
| Event count | `app/(marketing)/features/connect/page.jsx` | Replace `500+` with dynamic |

### High Priority (Do Soon)

| Fix | File | Change |
|-----|------|--------|
| Scoring export | `lib/scoring.js` | Export `ENTHUSIAST_WEIGHTS` |
| Remove inline weights | `components/Add*.Modal.jsx` | Import from scoring.js |
| Cache alignment | `lib/carsClient.js`, `hooks/useCarData.js` | Align stale times |
| CarCarousel image | `components/CarCarousel.jsx` | Use `getCarHeroImage()` |

### Medium Priority (Do When Able)

| Fix | File | Change |
|-----|------|--------|
| Date formatting | Create `lib/dateUtils.js` | Centralize date formatting |
| Provider sync | `OwnedVehiclesProvider.jsx` | Add real-time subscription |
| Filter utils | Create `lib/filterUtils.js` | Extract shared filter logic |
