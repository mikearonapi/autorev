# Provider Dependency Matrix

Generated: 2026-01-08

## Summary

This audit identifies which routes require which providers. Routes without app-specific provider dependencies can be moved to the marketing layout.

## Provider × Route Matrix

| Route | Auth | AIChat | Query | Favorites | Compare | SavedBuilds | OwnedVehicles | CarSelection | Safe for Marketing? |
|-------|------|--------|-------|-----------|---------|-------------|---------------|--------------|---------------------|
| `/` (home) | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | **YES** |
| `/landing/*` | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | **YES** |
| `/articles/*` | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | **YES** |
| `/join` | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | **YES** |
| `/features` | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | **YES** |
| `/car-selector` | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | **YES** |
| `/community/*` | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | **YES** |
| `/al` | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | **YES** |
| `/browse-cars` | ✓ | ✓ | ✓ | **✓** | **✓** | ✗ | **✓** | ✗ | NO |
| `/browse-cars/[slug]` | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | **✓** | NO |
| `/garage` | ✓ | ✓ | ✓ | **✓** | ✗ | **✓** | **✓** | ✗ | NO |
| `/garage/compare` | ✓ | ✓ | ✓ | ✗ | **✓** | ✗ | ✗ | ✗ | NO |
| `/tuning-shop` | ✓ | ✓ | ✓ | **✓** | ✗ | **✓** | **✓** | ✗ | NO |
| `/profile` | ✓ | ✓ | ✓ | **✓** | ✗ | **✓** | ✗ | ✗ | NO |
| `/mod-planner` | ✓ | ✓ | ✓ | **✓** | ✗ | ✗ | **✓** | **✓** | NO |

## Key Findings

### Routes Safe for Marketing Layout (no app providers needed)
- `/` (home)
- `/landing/find-your-car`
- `/landing/tuning-shop`
- `/landing/your-garage`
- `/articles/*`
- `/join`
- `/features`
- `/car-selector`
- `/community/*`
- `/al`

### Routes Requiring App Layout (need app-specific providers)
- `/browse-cars` - needs Favorites, Compare, OwnedVehicles
- `/browse-cars/[slug]` - needs CarSelection
- `/garage` - needs Favorites, SavedBuilds, OwnedVehicles
- `/garage/compare` - needs Compare
- `/tuning-shop` - needs Favorites, SavedBuilds, OwnedVehicles
- `/profile` - needs Favorites, SavedBuilds
- `/mod-planner` - needs Favorites, OwnedVehicles, CarSelection

## Header/Footer Provider Dependencies

**Header** (all routes):
- `useAuth()` → AuthProvider ✓
- `useAIChat()` → AIMechanicProvider ✓
- No favorites/compare badges (verified)

**Footer**: No provider dependencies

## Providers Needed in BOTH Layouts

These must be in the root or duplicated in both layouts:
- `AuthProvider` (Header uses useAuth)
- `AIMechanicProvider` (Header uses useAIChat)
- `QueryProvider` (data fetching)
- `BannerProvider` (banner system)

## Providers ONLY Needed in App Layout

These can be removed from marketing layout:
- `FavoritesProvider`
- `CompareProvider`
- `SavedBuildsProvider`
- `OwnedVehiclesProvider`
- `CarSelectionProvider`
- `FeedbackProvider` (FeedbackCorner widget)

## Widget Dependencies

| Widget | Provider Needed | Layout |
|--------|-----------------|--------|
| CompareBar | CompareProvider | App only |
| FeedbackCorner | FeedbackProvider | App only |
| MobileBottomCta | None (pathname only) | Either |

## Surprise Finding: /car-selector and /al are Marketing-Safe

Initially expected these to need app providers, but they don't directly consume:
- FavoritesProvider
- CompareProvider
- SavedBuildsProvider
- OwnedVehiclesProvider
- CarSelectionProvider

These routes can be moved to marketing layout for JS savings.

## Migration Recommendation

### Batch 1 (Lowest Risk): Landing Pages
```
app/landing/* → app/(marketing)/landing/*
```

### Batch 2: Marketing Content
```
app/join → app/(marketing)/join
app/features → app/(marketing)/features
app/articles/* → app/(marketing)/articles/*
```

### Batch 3: Home Page
```
app/page.jsx → app/(marketing)/page.jsx
```

### Batch 4: Surprisingly Safe Routes
```
app/car-selector → app/(marketing)/car-selector
app/community/* → app/(marketing)/community/*
app/al → app/(marketing)/al
```

### Batch 5: App Routes (Need Full Providers)
```
app/browse-cars/* → app/(app)/browse-cars/*
app/garage/* → app/(app)/garage/*
app/tuning-shop → app/(app)/tuning-shop
app/profile → app/(app)/profile
app/mod-planner → app/(app)/mod-planner
```
