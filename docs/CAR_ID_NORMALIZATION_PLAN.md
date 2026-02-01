# Car ID Normalization Plan

> **Status**: ✅ **COMPLETED** (Feb 1, 2026)
>
> **Goal**: Eliminate `carSlug` from all internal code. Keep `slug` only for URL routing.

## Architecture After Normalization

```
URL (/cars/[slug])
       │
       ▼
┌──────────────────────┐
│  Router Entry Point  │  ← Resolve slug → car_id HERE
│  (page.jsx / route.js)│
└──────────────────────┘
       │
       ▼ (pass car_id only)
┌──────────────────────┐
│    Components        │  ← Receive carId prop
└──────────────────────┘
       │
       ▼ (pass car_id only)
┌──────────────────────┐
│    Hooks/Services    │  ← Accept carId param
└──────────────────────┘
       │
       ▼ (query by car_id)
┌──────────────────────┐
│    Database          │  ← cars.id is FK
└──────────────────────┘

When URL is needed:
- Look up slug via JOIN: `cars:car_id (slug)`
- Or use helper: `getSlugFromCarId(carId)`
```

---

## PHASE 1: Strategy - Resolution Boundary ✅

**Rule**: Resolve `slug → car_id` at the FIRST entry point only.

| Entry Point Type              | Resolution Location                              |
| ----------------------------- | ------------------------------------------------ |
| `/cars/[slug]/...` pages      | In `page.jsx` - resolve params.slug immediately  |
| `/api/cars/[slug]/...` routes | In `route.js` - resolve params.slug immediately  |
| `?car=slug` query params      | In page/route - resolve searchParams immediately |
| User input (forms)            | In form handler - resolve before API call        |

**Helper function** (`lib/carResolver.js`):

```javascript
// Already exists - use for all resolutions
const carId = await resolveCarId(slug);
```

---

## PHASE 2: Providers (4 files)

### 2.1 OwnedVehiclesProvider.jsx

**Current**: `vehicle.matchedCarSlug`, `getVehiclesByCarSlug(carSlug)`
**Change to**: `vehicle.matchedCarId`, `getVehiclesByCarId(carId)`

| Function                 | Current                     | Change To                                                  |
| ------------------------ | --------------------------- | ---------------------------------------------------------- |
| `transformVehicle()`     | Returns `matchedCarSlug`    | Remove (already has `matchedCarId`)                        |
| `getVehiclesByCarSlug()` | Filters by `matchedCarSlug` | Rename to `getVehiclesByCarId()`, filter by `matchedCarId` |

### 2.2 SavedBuildsProvider.jsx

**Current**: `build.carSlug`, `getBuildsByCarSlug(carSlug)`
**Change to**: `build.carId`, `getBuildsByCarId(carId)`

| Function               | Current                       | Change To                                         |
| ---------------------- | ----------------------------- | ------------------------------------------------- |
| State shape            | `{ carSlug: build.car_slug }` | `{ carId: build.car_id }`                         |
| `getBuildsByCarSlug()` | Filters by `carSlug`          | Rename to `getBuildsByCarId()`, filter by `carId` |

### 2.3 FavoritesProvider.jsx

**Current**: `favorite.slug` (used for lookups)
**Change to**: `favorite.carId` (already has `car_id` from DB)

| Function               | Current               | Change To                         |
| ---------------------- | --------------------- | --------------------------------- |
| `isFavorite(slug)`     | Checks by slug        | Change to `isFavorite(carId)`     |
| `removeFavorite(slug)` | Removes by slug       | Change to `removeFavorite(carId)` |
| State shape            | `{ slug, name, ... }` | `{ carId, name, ... }`            |

### 2.4 CompareProvider.jsx

**Current**: `list.carSlugs` (array)
**Change to**: `list.carIds` (array)

| Function    | Current            | Change To                        |
| ----------- | ------------------ | -------------------------------- |
| State shape | `carSlugs: []`     | `carIds: []`                     |
| DB read     | `car_slugs` column | `car_ids` column (already added) |

---

## PHASE 3: Hooks (5 files)

### 3.1 useCarImages.js

**Current**: `useCarImages(carSlug, options)`
**Change to**: `useCarImages(carId, options)`

### 3.2 useUserData.js

**Current**: `useUserTrackTimes(userId, carSlug, options)`
**Change to**: `useUserTrackTimes(userId, carId, options)`

### 3.3 usePartRecommendations.js

**Current**: `usePartRecommendations(carSlug, options)`
**Change to**: `usePartRecommendations(carId, options)`

### 3.4 useALPartRecommendation.js

**Current**: `buildPartQuestion({ carSlug })`
**Change to**: `buildPartQuestion({ carId })`

### 3.5 useFeedTracking.js

**Current**: Uses `post.car_slug`
**Change to**: Uses `post.car_id`

---

## PHASE 4: Services (~30 functions across 15 files)

### 4.1 lib/carResolver.js (KEEP AS-IS)

- `resolveCarId(slug)` - This is the resolution function, KEEP
- Add: `getSlugFromCarId(carId)` - For URL generation

### 4.2 lib/aiMechanicService.js

| Function                                  | Current      | Change To                                              |
| ----------------------------------------- | ------------ | ------------------------------------------------------ |
| `getCarAiContextBlob(carSlug)`            | Accepts slug | Accept `carId`, resolve internally only if slug passed |
| `getMaintenanceSpecs(carSlug)`            | Accepts slug | Accept `carId`                                         |
| `getUpgradeRecommendations(carSlug)`      | Accepts slug | Accept `carId`                                         |
| `getUserProjects(userId, carSlug, carId)` | Accepts both | Accept `carId` only                                    |

### 4.3 lib/alTools.js (AI Tools)

| Function                         | Current      | Change To           |
| -------------------------------- | ------------ | ------------------- |
| `getCarAIContext({ car_slug })`  | Accepts slug | Accept `{ car_id }` |
| `searchKnowledge({ car_slug })`  | Accepts slug | Accept `{ car_id }` |
| `getTrackLapTimes({ car_slug })` | Accepts slug | Accept `{ car_id }` |
| ... (20+ more functions)         | Accepts slug | Accept `{ car_id }` |

**Note**: AL tools are called by AI with parameters. Need to update:

1. Function signatures
2. `lib/alConfig.js` - Tool schemas (change `car_slug` to `car_id` in required params)

### 4.4 lib/fitmentService.js

| Function                     | Current      | Change To      |
| ---------------------------- | ------------ | -------------- |
| `fetchCarFitments(carSlug)`  | Accepts slug | Accept `carId` |
| `clearFitmentCache(carSlug)` | Accepts slug | Accept `carId` |

### 4.5 lib/alConversationService.js

| Function                            | Current      | Change To                                 |
| ----------------------------------- | ------------ | ----------------------------------------- |
| `createConversation({ carSlug })`   | Accepts slug | Accept `{ carId }` only (already updated) |
| `getUserConversations({ carSlug })` | Accepts slug | Accept `{ carId }`                        |

### 4.6 Other Services (update similarly)

- `lib/recallService.js`
- `lib/complaintService.js`
- `lib/comparisonService.js`
- `lib/tuningProfiles.js`
- `lib/scrapeJobService.js`
- `lib/lapTimesScraper.js`
- `lib/youtubeClient.js`
- `lib/alUsageService.js`
- `lib/articlesService.js`
- `lib/prefetch.js`
- `lib/alOrchestrator.js`

---

## PHASE 5: API Routes (~20 routes)

### Strategy

- Routes with `[slug]` in path: Resolve immediately in handler
- Routes with `carSlug` in query/body: Change to `carId`

### 5.1 Routes accepting carSlug in query params

| Route                             | Current      | Change To  |
| --------------------------------- | ------------ | ---------- |
| `/api/users/[userId]/track-times` | `?carSlug=`  | `?carId=`  |
| `/api/users/[userId]/car-images`  | `?carSlug=`  | `?carId=`  |
| `/api/parts/search`               | `?carSlug=`  | `?carId=`  |
| `/api/parts/popular`              | `?carSlug=`  | `?carId=`  |
| `/api/events`                     | `?car_slug=` | `?car_id=` |
| ...                               |              |            |

### 5.2 Routes accepting carSlug in body

| Route                           | Current            | Change To        |
| ------------------------------- | ------------------ | ---------------- |
| `/api/uploads`                  | `formData.carSlug` | `formData.carId` |
| `/api/uploads/save-metadata`    | `body.carSlug`     | `body.carId`     |
| `/api/internal/dyno/runs`       | `body.carSlug`     | `body.carId`     |
| `/api/internal/track/lap-times` | `body.carSlug`     | `body.carId`     |
| `/api/feedback`                 | `body.car_slug`    | `body.car_id`    |
| ...                             |                    |                  |

### 5.3 Routes with [slug] in path (KEEP slug in URL, resolve internally)

- `/api/cars/[slug]/...` - These keep `[slug]` for SEO, resolve to `car_id` at handler start

---

## PHASE 6: Components (~35 components)

### Strategy

Change all `carSlug` props to `carId` props.

### High-Priority Components (frequently used)

| Component                 | Current Prop    | Change To    |
| ------------------------- | --------------- | ------------ |
| `PowerBreakdown.jsx`      | `carSlug`       | `carId`      |
| `VirtualDynoChart.jsx`    | `carSlug`       | `carId`      |
| `PerformanceHub.jsx`      | Uses `car.slug` | Use `car.id` |
| `UpgradeCenter.jsx`       | Uses `car.slug` | Use `car.id` |
| `PartsSelector.jsx`       | `carSlug`       | `carId`      |
| `ImageUploader.jsx`       | `carSlug`       | `carId`      |
| `AskALButton.jsx`         | `carSlug`       | `carId`      |
| `LapTimeEstimator.jsx`    | `carSlug`       | `carId`      |
| `ALQuickActionsPopup.jsx` | `carSlug`       | `carId`      |

### Garage Components

| Component                   | Current           | Change To       |
| --------------------------- | ----------------- | --------------- |
| `SortableVehicleList.jsx`   | `matchedCarSlug`  | `matchedCarId`  |
| `GarageVehicleSelector.jsx` | `vehicle.carSlug` | `vehicle.carId` |
| `MyGarageSubNav.jsx`        | `carSlug` prop    | `carId` prop    |
| `InstallChecklistItem.jsx`  | `carSlug`         | `carId`         |

### Other Components

- `BuildProgressAnalysis.jsx`
- `FactoryConfig.jsx`
- `WheelTireConfigurator.jsx`
- `ShareBuildModal.jsx`
- `CarEventsSection.jsx`
- `UpgradeDetailModal.jsx`
- `ALRecommendationsButton.jsx`
- `NextUpgradeRecommendation.jsx`
- `MarketValueSection.jsx`
- `PerformanceData.jsx`
- `GarageEventsSection.jsx`
- `ExpertReviews.jsx`
- `BuildDetailView.jsx`
- `BuildEditor.jsx`
- `CarDetailSections.jsx`
- `CalculatedPerformance.jsx`
- `FeaturedBuildsCarousel.jsx`
- `ALBuildSearchInput.jsx`
- `VehicleBuildPanel.jsx`
- `InfoTooltip.jsx`

---

## PHASE 7: Pages - Entry Point Resolution

### Strategy

Each page that receives `slug` (from URL or query) resolves to `car_id` immediately.

### Garage Pages (query param `?car=slug`)

| Page                         | Current                   | Change To                      |
| ---------------------------- | ------------------------- | ------------------------------ |
| `garage/my-build/page.jsx`   | `carSlugParam` from query | Resolve to `carId` immediately |
| `garage/my-install/page.jsx` | `carSlugParam` from query | Resolve to `carId` immediately |
| `garage/my-photos/page.jsx`  | `carSlugParam` from query | Resolve to `carId` immediately |
| `garage/my-parts/page.jsx`   | `carSlugParam` from query | Resolve to `carId` immediately |
| `garage/my-specs/page.jsx`   | `carSlugParam` from query | Resolve to `carId` immediately |

### Data Pages

| Page                  | Current               | Change To          |
| --------------------- | --------------------- | ------------------ |
| `data/page.jsx`       | Uses `matchedCarSlug` | Use `matchedCarId` |
| `data/track/page.jsx` | Uses `matchedCarSlug` | Use `matchedCarId` |

### Community Pages

| Page                               | Current              | Change To         |
| ---------------------------------- | -------------------- | ----------------- |
| `community/builds/[slug]/page.jsx` | Uses `post.car_slug` | Use `post.car_id` |

---

## PHASE 8: Verification

### 8.1 Linter Check

```bash
npm run lint
```

### 8.2 Type Check

```bash
npm run typecheck
```

### 8.3 Search for Remaining carSlug

```bash
# Should return ONLY:
# - URL routing files ([slug])
# - carResolver.js (the resolver itself)
# - Test files
# - Scripts
grep -r "carSlug\|car_slug" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=scripts --exclude-dir=tests
```

### 8.4 Manual Testing

1. Garage pages load correctly
2. Favorites add/remove works
3. Builds save/load correctly
4. AL conversations work with car context
5. Track times filter by car

---

## Helper Function to Add

Add to `lib/carResolver.js`:

```javascript
/**
 * Get slug from car_id (for URL generation)
 * @param {string} carId - UUID
 * @returns {Promise<string|null>} slug
 */
export async function getSlugFromCarId(carId) {
  if (!carId || !isSupabaseConfigured) return null;

  const { data } = await supabase.from('cars').select('slug').eq('id', carId).single();

  return data?.slug || null;
}
```

---

## Summary

| Phase           | Files | Estimated Changes |
| --------------- | ----- | ----------------- |
| 1. Strategy     | 0     | Define boundaries |
| 2. Providers    | 4     | ~50 lines each    |
| 3. Hooks        | 5     | ~20 lines each    |
| 4. Services     | 15    | ~30 lines each    |
| 5. API Routes   | 20    | ~10 lines each    |
| 6. Components   | 35    | ~5-20 lines each  |
| 7. Pages        | 10    | ~10 lines each    |
| 8. Verification | -     | Testing           |

**Total**: ~90 files, ~800-1000 line changes
