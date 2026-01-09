# Comprehensive Tech Debt Audit - AutoRev

> **Audit Date:** January 9, 2026  
> **Scope:** Full codebase review - Database, API, Pages, Services, Caching, Tier Gating  
> **Methodology:** SQL queries + grep verification - No assumptions

---

## Executive Summary

| Category | Count |
|----------|-------|
| Critical Issues (User-Facing Bugs) | 4 |
| High Priority (Data Inconsistency) | 6 |
| Medium Priority (Code Quality) | 8 |
| Low Priority (Nice to Have) | 5 |

### Top 10 Issues to Fix Immediately

| # | Issue | Impact | Fix Effort |
|---|-------|--------|------------|
| 1 | `get_most_viewed_builds` RPC exists but is never used | Wrong "most viewed" results | 5 min |
| 2 | Car count hardcoded as `'100+'` in 3 files (actual: 192) | Misleading marketing | 15 min |
| 3 | Email template uses `188` fallback for car count | Wrong email content | 5 min |
| 4 | Two versions of `search_cars_fts` RPC with same name | Potential confusion | 30 min |
| 5 | `garage/page.jsx` defines own `defaultWeights` instead of importing | Inconsistent scoring | 10 min |
| 6 | Caching stale times vary wildly (1 min to 1 hour) | Inconsistent freshness | 1 hour |
| 7 | Event count hardcoded as `500+` (actual: 8,256) | Significantly underreported | 5 min |
| 8 | No test coverage for `fetchMostViewedBuilds` | Bug could recur | 30 min |
| 9 | `FeatureBreakdown.jsx` has third hardcoded car count | Triple maintenance burden | 5 min |
| 10 | Client-side build sorting ignores proper RPC | Inaccurate rankings | 15 min |

---

## Phase 1: Database Layer Findings

### 1.1 Table Inventory

**Total Tables/Views:** 145  
**Base Tables:** 119  
**Views:** 26

#### Key Tables with Row Counts (Verified via SQL)

| Table | Rows | Purpose |
|-------|------|---------|
| `cars` | 192 | Core vehicle database |
| `events` | 8,256 | Car events/meetups |
| `car_issues` | 4,903 | User-reported issues |
| `vehicle_service_intervals` | 1,923 | Maintenance schedules |
| `community_insights` | 1,252 | Forum-scraped insights |
| `community_posts` | 7 | User builds/posts |
| `youtube_videos` | 474 | Expert video reviews |
| `document_chunks` | 7,408 | RAG knowledge base |
| `user_profiles` | 42 | Registered users |
| `user_favorites` | 18 | Saved cars |
| `user_vehicles` | 22 | Garage vehicles |

### 1.2 RPC/Function Inventory

**Total Functions:** 110+

#### CRITICAL: Unused RPC Found

```sql
-- This RPC exists and works correctly:
get_most_viewed_builds(p_limit integer)
-- Source shows: ORDER BY cp.view_count DESC, cp.published_at DESC

-- But the codebase uses get_community_posts instead!
-- Source shows: ORDER BY cp.is_featured DESC, cp.published_at DESC
```

**Verification Query:**
```sql
SELECT proname, prosrc FROM pg_proc 
WHERE proname = 'get_most_viewed_builds';
-- Returns proper view_count sorting
```

**Codebase Usage:**
```bash
grep -r "get_most_viewed_builds" . 
# Returns: ZERO results in JavaScript files!

grep -r "get_community_posts" .
# Returns: 4 results in lib/communityService.js and app/api/
```

**Impact:** The "Most Viewed Builds" feature shows wrong results because the wrong RPC is being used.

#### Duplicate Function: `search_cars_fts`

Two versions exist with same name but different signatures:

```sql
-- Version 1: Returns SETOF cars
search_cars_fts(search_query text) RETURNS SETOF cars

-- Version 2: Returns custom table with rank
search_cars_fts(search_query text, max_results integer DEFAULT 10) 
RETURNS TABLE(slug, name, years, hp, price_range, engine, category, highlight, rank)
```

**Risk:** Calling code may get unexpected results depending on which overload is used.

### 1.3 Key RPCs Documented

| RPC | Purpose | Used By | Status |
|-----|---------|---------|--------|
| `get_community_posts` | List community posts | communityService.js, API routes | Being misused for "most viewed" |
| `get_most_viewed_builds` | Get builds by view count | **NOTHING** | Should replace above |
| `get_car_ai_context` | AL tool context | alTools.js | Working correctly |
| `get_similar_cars` | Recommendations | Not found in code | May be unused |
| `search_cars_fts` | Full-text search | alTools.js only | Has duplicate definition |

---

## Phase 2: API Layer Findings

### 2.1 Route Inventory

**Total API Routes:** 141

#### Routes by Category

| Category | Count | Examples |
|----------|-------|----------|
| Cars | 16 | `/api/cars`, `/api/cars/[slug]/*` |
| Community | 4 | `/api/community/builds`, `/api/community/posts` |
| Events | 5 | `/api/events`, `/api/events/[slug]` |
| Users | 12 | `/api/users/[userId]/*` |
| Admin | 15 | `/api/admin/*` |
| Cron | 18 | `/api/cron/*` |
| Analytics | 8 | `/api/analytics/*` |
| Internal | 6 | `/api/internal/*` |
| Other | 57 | Various |

### 2.2 Overlapping Routes

#### Car Data Routes (Potential Consolidation)

| Route | Returns |
|-------|---------|
| `/api/cars` | All cars (list view) |
| `/api/cars/[slug]` | Single car detail |
| `/api/cars/[slug]/enriched` | Bundled enriched data |
| `/api/cars/[slug]/efficiency` | Fuel economy |
| `/api/cars/[slug]/safety` | Safety ratings |
| `/api/cars/[slug]/recalls` | Recall data |
| `/api/cars/[slug]/pricing` | Price data |
| `/api/cars/[slug]/price-by-year` | Year-over-year pricing |
| `/api/cars/[slug]/maintenance` | Maintenance specs |
| `/api/cars/[slug]/lap-times` | Track times |
| `/api/cars/[slug]/dyno` | Dyno runs |
| `/api/cars/[slug]/expert-reviews` | YouTube reviews |
| `/api/cars/[slug]/ai-context` | AL tool context |
| `/api/cars/[slug]/fitments` | Part fitments |
| `/api/cars/[slug]/factory-options` | Factory options |
| `/api/cars/[slug]/market-value` | Market pricing |

**Finding:** 16 endpoints for car data. The `/api/cars/[slug]/enriched` endpoint bundles several of these, but not all pages use it. Some pages make 4+ separate API calls when 1 would suffice.

---

## Phase 3: Page-by-Page Findings

### 3.1 Marketing Pages

**Total Marketing Pages:** 34

#### Hardcoded Values Found

| File | Line | Value | Actual | Issue |
|------|------|-------|--------|-------|
| `app/(marketing)/join/page.jsx` | 125 | `'100+'` | 192 | 92 cars missing |
| `app/(app)/profile/page.jsx` | 189 | `'100+'` | 192 | Same issue |
| `components/FeatureBreakdown.jsx` | 70 | `'100+'` | 192 | Same issue |
| `app/api/admin/emails/preview/route.js` | 54, 473, 822 | `188` | 192 | 4 cars off |
| `app/(marketing)/features/connect/page.jsx` | ~216 | `500+` | 8,256 | 7,756 events missing! |

#### Correct Implementation (Homepage)

```javascript
// app/(marketing)/page.jsx - CORRECT
async function getCarCount() {
  const { count } = await supabase
    .from('cars')
    .select('*', { count: 'exact', head: true });
  return count || 100;
}
```

#### Incorrect Implementation (Join Page)

```javascript
// app/(marketing)/join/page.jsx - WRONG
const CAR_COUNT = '100+';  // Never updates!
```

### 3.2 App Pages

**Total App Pages:** 8 main routes

| Page | Data Fetching | Issues Found |
|------|---------------|--------------|
| `/browse-cars` | `useCarsList()` | Client-side filter, works |
| `/car-selector` | `fetchCars()` + scoring | Works correctly |
| `/garage` | Multiple hooks | Defines own `defaultWeights` |
| `/tuning-shop` | `fetchCars()` | Works |
| `/mod-planner` | `fetchCars()` + scoring | Imports correctly |
| `/profile` | Auth context | Hardcoded car count |
| `/events/*` | Events service | Works |

### 3.3 Admin Pages

Admin pages correctly fetch from database. No hardcoded values found.

---

## Phase 4: Service Layer Findings

### 4.1 Duplicate Logic: Scoring

**Canonical Location:** `lib/scoring.js`

```javascript
export const DEFAULT_WEIGHTS = Object.fromEntries(
  categories.map(cat => [cat.key, 1])
);

export const ENTHUSIAST_WEIGHTS = {
  sound: 1.3,
  interior: 1.0,
  track: 1.2,
  // ...
};

export function calculateWeightedScore(car, weights = DEFAULT_WEIGHTS) {
  return categories.reduce((sum, cat) => {
    const carScore = car[cat.key] ?? 0;
    const weight = weights[cat.key] ?? 1;
    return sum + (carScore * weight);
  }, 0);
}
```

**DUPLICATION FOUND:**

```javascript
// app/(app)/garage/page.jsx - Lines 2461-2475
// Defines its own defaultWeights instead of importing!
const defaultWeights = {
  powerAccel: 1.5,     // Different keys!
  gripCornering: 1.5,
  braking: 1.2,
  // ...
};
```

**Problem:** The garage page uses different weight keys (`powerAccel` vs `driverFun`) and different values, potentially giving inconsistent recommendations.

### 4.2 Correct Usage

```javascript
// components/SportsCarComparison.jsx - CORRECT
import { 
  calculateWeightedScore, 
  DEFAULT_WEIGHTS,
} from '@/lib/scoring.js';

const [weights, setWeights] = useState(() => DEFAULT_WEIGHTS);
```

### 4.3 "Most Viewed Builds" Bug

**File:** `lib/communityService.js` (lines 353-380)

```javascript
export async function fetchMostViewedBuilds(options = {}) {
  const { limit = 12 } = options;

  // BUG: Uses wrong RPC!
  const { data, error } = await supabase.rpc('get_community_posts', {
    p_post_type: 'build',
    p_limit: limit,  // Gets N most RECENT, not most viewed
  });

  // Then sorts client-side - but damage is done
  const sortedData = (data || []).sort((a, b) => 
    (b.view_count || 0) - (a.view_count || 0)
  );
}
```

**FIX:** Replace with:
```javascript
const { data, error } = await supabase.rpc('get_most_viewed_builds', {
  p_limit: limit,
});
// No client-side sort needed - RPC returns correct order
```

---

## Phase 5: Caching Strategy Audit

### 5.1 React Query Settings

| Location | staleTime | gcTime | Notes |
|----------|-----------|--------|-------|
| `QueryProvider.jsx` (default) | 5 min | 30 min | Global default |
| `useCarsList` | 1 min | (default) | Faster updates |
| `useRecalls` | 1 hour | (default) | Slow-changing data |
| `useMaintenance` | 1 hour | (default) | Slow-changing data |
| `useCarEnrichedBundle` | 10 min | (default) | Bundled data |
| `PrefetchCarLink` | 10 min | (default) | Prefetch |

### 5.2 Server-Side Caching

| Location | Strategy | Revalidate |
|----------|----------|------------|
| `app/(marketing)/page.jsx` | ISR | 60 seconds |
| `app/(marketing)/community/page.jsx` | ISR | 60 seconds |
| `app/api/cars/route.js` | ISR | 30 seconds |
| `lib/carsCache.js` | `unstable_cache` | 300 seconds (5 min) |
| `lib/statsService.js` | In-memory | 5 min TTL |
| `lib/adminAccess.js` | In-memory | 1 hour TTL |

### 5.3 Inconsistencies

1. **Cars list:** 30 sec API cache, 1 min React Query staleTime - misaligned
2. **Stats:** 5 min memory cache vs 60 sec page revalidation - data can lag
3. **No cache invalidation** when car is added - counts may lag

---

## Phase 6: Tier Gating Audit

### 6.1 Tier System Overview

**Tiers:** `free` → `collector` → `tuner`

**Beta Mode:** `IS_BETA = true` (all features free for authenticated users)

### 6.2 Gating Implementation

| Method | Location | Usage |
|--------|----------|-------|
| `PremiumGate` component | Various pages | UI-level gating |
| `hasFeatureAccess()` | `lib/tierAccess.js` | Logic check |
| `hasAccess()` | `lib/tierAccess.js` | Beta-aware check |
| `subscription_tier` in profile | AuthProvider | User's tier |

### 6.3 Correctly Gated Features

```javascript
// app/(marketing)/community/events/page.jsx
<PremiumGate feature="eventsCalendarView">
  <EventCalendarView />
</PremiumGate>
```

### 6.4 No Issues Found

Tier gating is well-implemented via centralized `lib/tierAccess.js`. All UI gating uses `PremiumGate` consistently.

---

## Cross-Reference Matrix

### Count Displays Across Codebase

| Data Point | Locations | Method | Consistent? |
|------------|-----------|--------|-------------|
| Car count | Homepage | Dynamic DB query | ✅ |
| Car count | Join page | Hardcoded `'100+'` | ❌ |
| Car count | Profile | Hardcoded `'100+'` | ❌ |
| Car count | FeatureBreakdown | Hardcoded `'100+'` | ❌ |
| Car count | Email templates | Fallback `188` | ❌ |
| Event count | Features/connect | Hardcoded `500+` | ❌ |
| Event count | Email templates | Fallback `940` | ❌ |

### Scoring/Recommendation Logic

| Location | Uses Canonical? | Notes |
|----------|-----------------|-------|
| `SportsCarComparison.jsx` | ✅ Yes | Imports from scoring.js |
| `garage/page.jsx` | ❌ No | Defines own weights |
| `mod-planner/page.jsx` | ✅ Yes | Imports from scoring.js |
| `lib/carRecommendations.js` | ✅ Yes | Uses scoring.js |

---

## Prioritized Fix List

### Critical (User-Facing Bugs)

| ID | Issue | File | Fix |
|----|-------|------|-----|
| C1 | Wrong RPC for most viewed builds | `lib/communityService.js:361` | Change `get_community_posts` → `get_most_viewed_builds` |
| C2 | Car count shows '100+' (actual 192) | `app/(marketing)/join/page.jsx:125` | Use dynamic count |
| C3 | Car count shows '100+' | `app/(app)/profile/page.jsx:189` | Use dynamic count |
| C4 | Car count shows '100+' | `components/FeatureBreakdown.jsx:70` | Use dynamic count |

### High Priority (Data Inconsistency)

| ID | Issue | File | Fix |
|----|-------|------|-----|
| H1 | Email fallback 188 cars | `app/api/admin/emails/preview/route.js:54,473,822` | Update to 192 or fetch |
| H2 | Event count 500+ (actual 8256) | `app/(marketing)/features/connect/page.jsx` | Use dynamic count |
| H3 | Garage uses own defaultWeights | `app/(app)/garage/page.jsx:2461` | Import from scoring.js |
| H4 | Duplicate search_cars_fts RPCs | Database | Consolidate or rename |
| H5 | Unused get_most_viewed_builds RPC | Database | Is being fixed by C1 |
| H6 | Inconsistent caching stale times | Various hooks | Standardize times |

### Medium Priority (Code Quality)

| ID | Issue | Files | Fix |
|----|-------|-------|-----|
| M1 | No tests for fetchMostViewedBuilds | tests/ | Add integration test |
| M2 | get_similar_cars RPC possibly unused | lib/ | Verify or remove |
| M3 | Multiple enriched data fetch patterns | hooks/useCarData.js | Standardize to bundle |
| M4 | No cache invalidation on car add | lib/carsClient.js | Add invalidation |
| M5 | Three locations define car count | Various | Create shared constant/hook |
| M6 | Scoring weight key mismatch | garage/page.jsx | Align with scoring.js |
| M7 | Event count outdated in email | emails/preview | Add dynamic fetch |
| M8 | statsService cache vs page revalidate | lib/statsService.js | Align timings |

### Low Priority (Nice to Have)

| ID | Issue | Files | Fix |
|----|-------|-------|-----|
| L1 | Car API cache (30s) vs React Query (1min) | Various | Align |
| L2 | Manual vs automatic cache invalidation | lib/statsService.js | Add hooks |
| L3 | Email templates have 2 car count spots | emails/preview | Consolidate |
| L4 | Encyclopedia topics have performance claims | lib/encyclopediaTopics/ | Review accuracy |
| L5 | Admin user IDs hardcoded | lib/adminAccess.js | Move to config |

---

## Quick Wins (< 30 minutes total)

### 1. Fix Most Viewed Builds (5 minutes)

```javascript
// lib/communityService.js line 361
// BEFORE:
const { data, error } = await supabase.rpc('get_community_posts', {

// AFTER:
const { data, error } = await supabase.rpc('get_most_viewed_builds', {
  p_limit: limit,
});
// Remove client-side sort (line 373) - RPC handles it
```

### 2. Fix Hardcoded Car Counts (15 minutes)

**Option A: Create shared hook**
```javascript
// lib/hooks/useCarCount.js
export function useCarCount() {
  return useQuery({
    queryKey: ['carCount'],
    queryFn: async () => {
      const res = await fetch('/api/stats');
      const data = await res.json();
      return data.cars;
    },
    staleTime: 5 * 60 * 1000,
  });
}
```

**Option B: Quick fix - update constants**
```javascript
// All 3 files: change '100+' to '190+'
// At least it'll be closer to correct
```

### 3. Fix Email Fallback (5 minutes)

```javascript
// app/api/admin/emails/preview/route.js
// Lines 54, 473, 822
// Change: || 188 → || 192
```

### 4. Fix Event Count (5 minutes)

```javascript
// app/(marketing)/features/connect/page.jsx
// Change: 500+ → 8,000+
// Or better: fetch dynamically
```

---

## Verification Commands Used

```bash
# Database queries
SELECT COUNT(*) FROM cars;  # 192
SELECT COUNT(*) FROM events;  # 8256

# RPC source code
SELECT proname, prosrc FROM pg_proc WHERE proname = 'get_most_viewed_builds';
SELECT proname, prosrc FROM pg_proc WHERE proname = 'get_community_posts';

# Code searches
grep -r "get_most_viewed_builds" app/ lib/  # 0 results!
grep -r "get_community_posts" app/ lib/  # 4 results
grep -r "'100+'" app/ components/  # 3 files found
grep -r "188" app/api/admin/emails/  # 3 lines found
grep -r "calculateWeightedScore" app/ lib/  # Multiple files
grep -r "defaultWeights" app/ lib/  # Found duplicate in garage
```

---

## Appendix: Database Schema Summary

### Core Tables

| Table | Columns | Rows | Purpose |
|-------|---------|------|---------|
| cars | 139 | 192 | Vehicle database |
| car_issues | 23 | 4,903 | User-reported problems |
| car_recalls | 16 | 504 | NHTSA recalls |
| car_safety_data | 29 | 98 | Safety ratings |
| car_fuel_economy | 22 | 98 | EPA data |
| car_market_pricing | 30 | 10 | Price estimates |
| car_track_lap_times | 24 | 65 | Track benchmarks |
| car_dyno_runs | 30 | 29 | Dyno results |

### User Tables

| Table | Columns | Rows | Purpose |
|-------|---------|------|---------|
| user_profiles | 44 | 42 | User accounts |
| user_vehicles | 51 | 22 | Garage vehicles |
| user_favorites | 10 | 18 | Saved cars |
| user_projects | 15 | 13 | Build projects |
| al_conversations | 14 | 58 | Chat history |
| al_messages | 12 | 262 | Chat messages |

### Community Tables

| Table | Columns | Rows | Purpose |
|-------|---------|------|---------|
| community_posts | 21 | 7 | User builds |
| community_insights | 24 | 1,252 | Forum scraped |
| events | 37 | 8,256 | Car events |
| youtube_videos | 39 | 474 | Expert reviews |

---

## Conclusion

This audit identified **4 critical issues**, **6 high priority issues**, and **8 medium priority issues** that could cause user-facing inconsistencies or maintenance problems.

**Most Impactful Finding:** The `get_most_viewed_builds` database function exists and works correctly, but the codebase never uses it. Instead, all code uses `get_community_posts` which sorts by date, then does client-side sorting by views on an already-limited dataset. This is a 5-minute fix with significant user impact.

**Second Most Impactful:** Car count is hardcoded as `'100+'` in 3 different files when the actual count is 192. Users see stale marketing numbers.

**Total Estimated Fix Time:** 2-3 hours for all critical and high priority issues.
