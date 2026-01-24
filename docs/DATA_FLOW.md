# Data Flow Architecture

> **PURPOSE**: Understand how data flows through AutoRev's providers and services.

---

## Provider Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                         App Layout                               │
├─────────────────────────────────────────────────────────────────┤
│  QueryProvider (React Query)                                    │
│  └── AuthProvider (Supabase Auth)                               │
│      └── LoadingProgressProvider                                │
│          ├── OwnedVehiclesProvider                              │
│          ├── SavedBuildsProvider                                │
│          ├── FavoritesProvider (+ real-time subscriptions)      │
│          ├── CompareProvider                                    │
│          └── CarSelectionProvider                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Provider Data Sources

```
┌──────────────────────┐     ┌─────────────────────────┐
│   AuthProvider       │────▶│  Supabase Auth          │
│   (session, user)    │     │  (auth.users)           │
└──────────────────────┘     └─────────────────────────┘

┌──────────────────────┐     ┌─────────────────────────┐
│ OwnedVehiclesProvider│────▶│  user_vehicles table    │
│ (user's owned cars)  │     │  + localStorage cache   │
└──────────────────────┘     └─────────────────────────┘

┌──────────────────────┐     ┌─────────────────────────┐
│  SavedBuildsProvider │────▶│  user_projects table    │
│  (upgrade configs)   │     │  + localStorage cache   │
└──────────────────────┘     └─────────────────────────┘

┌──────────────────────┐     ┌─────────────────────────┐
│  FavoritesProvider   │────▶│  user_favorites table   │
│  (favorited cars)    │     │  + real-time sub        │
└──────────────────────┘     │  + localStorage cache   │
                             └─────────────────────────┘

┌──────────────────────┐     ┌─────────────────────────┐
│   CompareProvider    │────▶│  localStorage only      │
│   (comparison list)  │     │  (optional DB sync)     │
└──────────────────────┘     └─────────────────────────┘

┌──────────────────────┐     ┌─────────────────────────┐
│ CarSelectionProvider │────▶│  localStorage only      │
│ (current selection)  │     │  (via carSelectionStore)│
└──────────────────────┘     └─────────────────────────┘
```

---

## Data Flow: User Actions

### Adding a Favorite

```
User clicks "Add to Favorites"
         │
         ▼
┌─────────────────────────┐
│  useFavorites().addFavorite(slug)  │
└─────────────────────────┘
         │
         ├──▶ Optimistic UI update (instant)
         │
         ▼
┌─────────────────────────┐
│  Supabase INSERT        │
│  user_favorites table   │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Real-time subscription │
│  confirms/syncs         │
└─────────────────────────┘
```

### Selecting a Car for Tuning

```
User selects car in Tuning Shop
         │
         ▼
┌─────────────────────────┐
│  useCarSelection().setCar(car)  │
└─────────────────────────┘
         │
         ├──▶ carSelectionStore.js reducer
         │
         ▼
┌─────────────────────────┐
│  localStorage persisted │
│  (no DB, instant)       │
└─────────────────────────┘
```

### Fetching Car Data

```
Component mounts
         │
         ▼
┌─────────────────────────┐
│  useCarsList() hook     │
│  (from useCarData.js)   │
└─────────────────────────┘
         │
         ├──▶ Check React Query cache (FAST: 5min)
         │
         ├──▶ Check carsClient.js in-memory cache
         │
         ├──▶ Check sessionStorage cache (10min)
         │
         ▼
┌─────────────────────────┐
│  Supabase query         │
│  cars table             │
└─────────────────────────┘
```

---

## Service Layer Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        Components                                │
│  (VirtualDynoChart, PowerBreakdown, UpgradeCenter, etc.)       │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Custom Hooks Layer                            │
│  useCarData.js, useCarSelection.js, useFavorites.js, etc.      │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Service Layer (lib/)                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐   │
│  │ carsClient  │ │ userDataSvc │ │ performanceCalculator/  │   │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐   │
│  │ carResolver │ │ scoring.js  │ │ filterUtils.js          │   │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘   │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Database (Supabase)                          │
│  ┌─────────┐ ┌─────────────┐ ┌──────────────────────────────┐  │
│  │ cars    │ │ user_*      │ │ car_tuning_profiles, etc.   │  │
│  └─────────┘ └─────────────┘ └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Which Provider for What Data?

| Need | Provider | Hook |
|------|----------|------|
| User's owned vehicles | `OwnedVehiclesProvider` | `useOwnedVehicles()` |
| User's saved builds | `SavedBuildsProvider` | `useSavedBuilds()` |
| User's favorites | `FavoritesProvider` | `useFavorites()`, `useIsFavorite(slug)` |
| Cars in comparison | `CompareProvider` | `useCompare()` |
| Currently selected car | `CarSelectionProvider` | `useCarSelection()`, `useSelectedCar()` |
| Car database listing | None (hook directly) | `useCarsList()` |
| Single car data | None (hook directly) | `useCarBySlug(slug)` |
| User auth state | `AuthProvider` | `useAuth()` |

---

## Caching Strategy

| Layer | TTL | Purpose |
|-------|-----|---------|
| React Query (FAST) | 5 min | Car list, frequently accessed |
| React Query (STANDARD) | 10 min | Enriched data, reviews |
| React Query (SLOW) | 30 min | Recalls, maintenance, rarely changes |
| carsClient in-memory | 5 min | Fastest repeated access |
| sessionStorage | 10 min | Survives page refresh |
| Provider localStorage | Indefinite | Offline support, instant hydration |

---

## Real-time Subscriptions

Only `FavoritesProvider` uses Supabase real-time:

```javascript
// In FavoritesProvider
useEffect(() => {
  const channel = supabase
    .channel('favorites-changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'user_favorites' },
      handleFavoriteChange
    )
    .subscribe();
  
  return () => supabase.removeChannel(channel);
}, [userId]);
```

**Why only Favorites?**
- Favorites can be added from multiple places (car pages, browse, comparison)
- Real-time keeps all instances in sync
- Other providers use optimistic updates + refresh-on-focus

---

## Build & Vehicle Data Flow

> **Full Documentation**: See `docs/SOURCE_OF_TRUTH.md` → "Build & Vehicle Data Model" section

### Adding a Car to Garage

```
User adds vehicle
        │
        ▼
┌─────────────────────────┐
│  addVehicle() in        │
│  OwnedVehiclesProvider  │
└─────────────────────────┘
        │
        ├──▶ VIN decode (optional)
        │
        ├──▶ Match to cars table → matched_car_id
        │
        ▼
┌─────────────────────────┐
│  user_vehicles INSERT   │
│  installed_mods: []     │
│  total_hp_gain: 0       │
└─────────────────────────┘
```

### Creating a Build

```
User selects upgrades in Tuning Shop
        │
        ▼
┌─────────────────────────┐
│  CarSelectionProvider   │
│  (transient state)      │
└─────────────────────────┘
        │
        ├──▶ calculateHpGain() for live preview
        │
        ▼ (on save)
┌─────────────────────────┐
│  saveBuild() in         │
│  SavedBuildsProvider    │
└─────────────────────────┘
        │
        ▼
┌─────────────────────────┐
│  user_projects INSERT   │
│  selected_upgrades: {}  │
│  total_hp_gain: X       │
│  final_hp: Y (snapshot) │
└─────────────────────────┘
```

### Applying Build to Vehicle

```
User clicks "Apply to Vehicle"
        │
        ▼
┌─────────────────────────┐
│  applyBuild() in        │
│  OwnedVehiclesProvider  │
└─────────────────────────┘
        │
        ▼
┌─────────────────────────┐
│  user_vehicles UPDATE   │
│  installed_mods: [...]  │ ←── copied from user_projects.selected_upgrades.upgrades
│  active_build_id: X     │ ←── FK to user_projects.id
│  total_hp_gain: Y       │ ←── copied from user_projects.total_hp_gain
└─────────────────────────┘
```

### Displaying Modified Vehicle Data

```
Component needs vehicle performance
        │
        ▼
┌─────────────────────────┐
│  1. Get vehicle from    │
│     OwnedVehiclesProvider│
└─────────────────────────┘
        │
        ▼
┌─────────────────────────┐
│  2. Get stock car via   │
│     matched_car_slug    │
│     useCarBySlug()      │
└─────────────────────────┘
        │
        ▼
┌─────────────────────────┐
│  3. Calculate final:    │
│     finalHp = stockHp   │
│       + totalHpGain     │
└─────────────────────────┘
```

---

## Key Files Reference

| Purpose | File |
|---------|------|
| Car data fetching | `lib/carsClient.js`, `hooks/useCarData.js` |
| Car ID resolution | `lib/carResolver.js` |
| Performance calculations | `lib/performanceCalculator/` |
| User data operations | `lib/userDataService.js` |
| Scoring calculations | `lib/scoring.js` |
| Car filtering/sorting | `lib/filterUtils.js` |
| Date formatting | `lib/dateUtils.js` |
| Error logging (client) | `lib/errorLogger.js` |
| Error logging (server) | `lib/serverErrorLogger.js` |

---

*Last Updated: 2026-01-22*
