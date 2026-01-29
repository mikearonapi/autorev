# Data Flow Audit Report

**Generated:** 2026-01-22
**Scope:** Providers, contexts, hooks, and data flow patterns

---

## Provider Inventory

### Active Providers (components/providers/)

| Provider | File | Purpose | Data Managed |
|----------|------|---------|--------------|
| `AuthProvider` | `AuthProvider.jsx` | Authentication state | User session, auth status |
| `OwnedVehiclesProvider` | `OwnedVehiclesProvider.jsx` | User's owned vehicles | Vehicles array, modifications |
| `SavedBuildsProvider` | `SavedBuildsProvider.jsx` | Saved build configurations | Build configs by car |
| `FavoritesProvider` | `FavoritesProvider.jsx` | Favorited cars | Favorites array |
| `CarSelectionProvider` | `CarSelectionProvider.jsx` | Currently selected car | Selected car slug |
| `CompareProvider` | `CompareProvider.jsx` | Compare list | Cars to compare |
| `QueryProvider` | `QueryProvider.jsx` | React Query client | Query cache |
| `LoadingProgressProvider` | `LoadingProgressProvider.jsx` | Loading progress | Progress state |
| `BannerProvider` | `BannerProvider.jsx` | Banner state | Banner visibility |

---

## Provider Dependency Graph

```
Layout.jsx
├── QueryProvider (React Query)
│   └── AuthProvider (Supabase Auth)
│       ├── LoadingProgressProvider
│       ├── FavoritesProvider (depends on Auth)
│       ├── OwnedVehiclesProvider (depends on Auth)
│       ├── SavedBuildsProvider (depends on Auth)
│       ├── CarSelectionProvider
│       ├── CompareProvider
│       └── BannerProvider
```

---

## Data Flow Analysis

### 1. Car Data Flow

```
User Visits Car Page
        │
        ▼
┌─────────────────────────────┐
│   React Query Cache         │  ← useCarsList(), useCarEnrichedBundle()
│   (hooks/useCarData.js)     │
└─────────────────────────────┘
        │
        ▼
┌─────────────────────────────┐
│   API Routes                │  ← /api/cars, /api/cars/[slug]/enriched
│   (app/api/cars/)           │
└─────────────────────────────┘
        │
        ▼
┌─────────────────────────────┐
│   Service Layer             │  ← lib/carsClient.js, lib/enrichedDataService.js
└─────────────────────────────┘
        │
        ▼
┌─────────────────────────────┐
│   Supabase                  │  ← cars, car_issues, car_dyno_runs, etc.
└─────────────────────────────┘
```

**Potential Issue:** Some components may be fetching car data directly via Supabase instead of through hooks.

---

### 2. User Vehicle Data Flow

```
User's Garage Page
        │
        ▼
┌─────────────────────────────┐
│   OwnedVehiclesProvider     │  ← Context provider
│   (uses useReducer)         │
└─────────────────────────────┘
        │
        ▼
┌─────────────────────────────┐
│   userDataService.js        │  ← fetchUserVehicles(), addUserVehicle()
└─────────────────────────────┘
        │
        ▼
┌─────────────────────────────┐
│   Supabase                  │  ← user_vehicles table
└─────────────────────────────┘
```

**Observation:** OwnedVehiclesProvider manages:
- `vehicles` array
- `installedModifications` per vehicle
- `customSpecs` per vehicle
- `activeBuildId` links to SavedBuilds

---

### 3. Build Configuration Flow

```
Tuning Shop / Upgrade Center
        │
        ▼
┌─────────────────────────────┐
│   SavedBuildsProvider       │  ← Context provider
│   (uses useState + localStorage)
└─────────────────────────────┘
        │
        ▼
┌─────────────────────────────┐
│   userDataService.js        │  ← fetchUserProjects(), saveUserProject()
└─────────────────────────────┘
        │
        ▼
┌─────────────────────────────┐
│   Supabase                  │  ← user_projects table
└─────────────────────────────┘
```

**Question:** Is there overlap between:
- `user_vehicles.installed_modifications` (OwnedVehiclesProvider)
- `user_projects` (SavedBuildsProvider)

Both track modifications, but:
- `user_vehicles.installed_modifications` = What's ACTUALLY installed on real car
- `user_projects` = Hypothetical build configurations

---

### 4. Performance Calculation Flow (FRAGMENTED!)

```
Component needs HP calculation
        │
        ├──► VirtualDynoChart.jsx
        │         │
        │         ▼
        │    lib/performance.js → calculateUpgradedMetrics()
        │
        ├──► PowerBreakdown.jsx
        │         │
        │         ▼
        │    lib/upgradeCalculator.js → calculateSmartHpGain()
        │
        ├──► CalculatedPerformance.jsx
        │         │
        │         ▼
        │    lib/buildPerformanceCalculator.js → calculateBuildPerformance()
        │
        └──► UpgradeCenter.jsx
                  │
                  ▼
             lib/upgrades.js → calculateAllModificationGains()
```

**CRITICAL:** Same data flows through 4 different calculation paths!

---

## Data Source Conflicts

### 1. Car Reference: slug vs id

| Source | Uses | Issue |
|--------|------|-------|
| URL parameters | `carSlug` | Natural for routing |
| Database queries | Should use `car_id` | Per database-patterns.mdc |
| Providers | Mix of both | Inconsistent |

**Rule:** Always resolve slug→id via `lib/carResolver.js` before DB queries.

---

### 2. Modification Data

| Source | Location | Data Shape |
|--------|----------|------------|
| Vehicle modifications | `user_vehicles.installed_modifications` | `string[]` (upgrade keys) |
| Build configurations | `user_projects.modifications` | `string[]` (upgrade keys) |
| Car tuning profiles | `car_tuning_profiles.upgrades_by_objective` | JSONB with categories |

**Question:** When displaying modified HP, which source is used?

---

### 3. Performance Scores

| Source | Location | Usage |
|--------|----------|-------|
| Stock scores | `cars.perf_*` columns | Base performance |
| Calculated scores | `mapCarToPerformanceScores()` | Recalculated from metrics |
| Upgraded scores | Various calculators | With mods applied |

**Issue:** Stock scores in DB may not match calculated scores. Which is authoritative?

---

## State Management Patterns

### What Uses What

| Pattern | Used For | Files |
|---------|----------|-------|
| React Context | Auth, Vehicles, Favorites, Builds | `components/providers/*.jsx` |
| React Query | Car data, API data | `hooks/useCarData.js` |
| Zustand stores | Preferences, Compare | `lib/stores/*.js` |
| localStorage | Guest data, cache | Various |

### Zustand Stores

| Store | File | Purpose |
|-------|------|---------|
| `carSelectionStore` | `lib/stores/carSelectionStore.js` | Selected car state |
| `compareStore` | `lib/stores/compareStore.js` | Compare list |
| `favoritesStore` | `lib/stores/favoritesStore.js` | Favorites (guest mode) |
| `alPreferencesStore` | `lib/stores/alPreferencesStore.js` | AL preferences |
| `userPreferencesStore` | `lib/stores/userPreferencesStore.js` | User preferences |

**Question:** Do `carSelectionStore` and `CarSelectionProvider` duplicate functionality?

---

## Hooks Inventory

### Custom Hooks (hooks/)

| Hook | Purpose | Data Source |
|------|---------|-------------|
| `useCarData.js` | Car data queries | React Query + API |
| `useUserData.js` | User data queries | Provider + API |
| `useTuningProfile.js` | Tuning profile data | API |
| `useEventsData.js` | Events data | API |
| `useCommunityData.js` | Community data | API |
| `useAdminData.js` | Admin data | API |
| `useAnalytics.js` | Analytics tracking | - |
| `useCheckout.js` | Checkout flow | Stripe |
| `usePWAInstall.js` | PWA install prompt | - |
| `useCarImages.js` | Car images | API |
| `useLapTimeEstimate.js` | Lap time estimation | API |
| `useALPartRecommendation.js` | AL part recommendations | API |
| `useFeedTracking.js` | Feed tracking | API |

---

## Recommendations

### 1. Consolidate Performance Calculations

Create single source of truth:
```
Before: 4 different calculators called by different components
After: All components use lib/performanceCalculator/index.js
```

### 2. Clarify Provider Responsibilities

| Provider | Should Own | Should NOT Own |
|----------|-----------|----------------|
| OwnedVehicles | Real vehicle data, actual mods | Hypothetical builds |
| SavedBuilds | Build configurations, scenarios | Real vehicle state |
| CarSelection | Currently browsing car | User's owned cars |

### 3. Establish Data Flow Rules

1. **Car data:** Always through `useCarData.js` hooks
2. **User data:** Always through providers (OwnedVehicles, Favorites, etc.)
3. **Performance calculations:** Single calculator module
4. **Slug→ID resolution:** Always through `lib/carResolver.js`

### 4. Document Provider Usage

Create `docs/DATA_FLOW.md` with:
- Provider dependency diagram
- Which provider to use for which data
- When to use hooks vs providers vs direct API

---

## Verification Queries

```javascript
// Find components using multiple performance calculators
grep -r "from.*performance" components/
grep -r "from.*upgradeCalculator" components/
grep -r "from.*buildPerformanceCalculator" components/

// Find direct Supabase usage in components
grep -r "supabase\." components/

// Find car data fetching patterns
grep -r "fetchCarBySlug\|fetchCars\|useCarsList" components/
```
