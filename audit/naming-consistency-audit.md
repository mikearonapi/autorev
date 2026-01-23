# Naming Consistency Audit Report

**Generated:** 2026-01-22
**Scope:** File names, function names, variable names, prop names

---

## 1. Terminology Conflicts

### Car vs Vehicle

| Term | Usage | Files |
|------|-------|-------|
| **car** | Database tables, API routes, most code | `cars`, `carsClient`, `carResolver`, `/api/cars` |
| **vehicle** | User-owned vehicles, VIN decode | `user_vehicles`, `OwnedVehiclesProvider`, `VehicleSelectModal` |

**Current Convention:**
- `car` = Database car records (the car model)
- `vehicle` = User's specific owned car instance

**Recommendation:** Document this convention. Keep current usage as it's meaningful.

---

### Build vs Project

| Term | Usage | Context |
|------|-------|---------|
| **build** | UI components, community features | `BuildDetailView`, `SavedBuildsProvider`, `/api/community/builds` |
| **project** | Database table, service layer | `user_projects`, `userDataService.saveUserProject()` |

**Issue:** Same concept, two names.

**Recommendation:** Standardize on `build` in UI, `project` in database. Document mapping.

---

### Slug vs ID

| Pattern | Usage | Example |
|---------|-------|---------|
| `slug` | URL parameter | `/cars/[slug]` |
| `carSlug` | Function param | `fetchCarBySlug(carSlug)` |
| `car_slug` | Database column | `user_favorites.car_slug` |
| `id` | Database UUID | `cars.id` |
| `carId` | Function param | `resolveCarId()` returns carId |
| `car_id` | Database column | `user_favorites.car_id` |

**Rule (per database-patterns.mdc):** Always resolve slug→id before DB queries.

**Observation:** Mostly consistent, but some confusion in function params.

---

### Upgrade vs Mod vs Modification

| Term | Usage |
|------|-------|
| `upgrade` | Upgrade packages, modules | `upgradeCalculator`, `UpgradeCenter` |
| `mod` | Short form in some places | `installedMods`, `MOD_HP_GAINS` |
| `modification` | Database column | `installed_modifications` |

**Recommendation:** Standardize on `modification` for data, `upgrade` for UI/features.

---

## 2. File Naming Conventions

### Components (PascalCase.jsx) ✓

| Pattern | Examples | Status |
|---------|----------|--------|
| PascalCase | `BuildDetailView.jsx`, `UpgradeCenter.jsx` | ✓ Correct |
| camelCase | None found | N/A |

**Status:** Consistent PascalCase for components.

---

### Hooks (useHookName.js) ✓

| Pattern | Examples | Status |
|---------|----------|--------|
| use* prefix | `useCarData.js`, `useUserData.js` | ✓ Correct |
| No prefix | `lib/hooks/useAppConfig.js` | ✓ Still has use* |

**Status:** Consistent use* prefix.

---

### Services (various patterns)

| Pattern | Examples | Count |
|---------|----------|-------|
| `*Service.js` | `userDataService.js`, `eventsService.js` | ~25 |
| `*Client.js` | `carsClient.js`, `apiClient.js` | ~8 |
| No suffix | `carResolver.js`, `performance.js` | ~15 |
| `*Calculator.js` | `upgradeCalculator.js`, `performanceCalculatorV2.js` | 4 |

**Issue:** Inconsistent suffixes for service files.

**Recommendation:** Define convention:
- `*Service.js` - CRUD operations, business logic
- `*Client.js` - External API clients
- `*Calculator.js` - Calculation modules
- No suffix - Utilities, helpers

---

### API Routes (kebab-case) ✓

| Pattern | Examples | Status |
|---------|----------|--------|
| kebab-case | `/api/ai-mechanic`, `/api/browse-cars` | ✓ Mostly correct |
| camelCase | `/api/cars/[slug]/priceByYear` | ⚠️ Exception |

**Issue:** `/api/cars/[slug]/price-by-year` exists, suggesting `priceByYear` might be legacy.

---

### CSS Modules (Component.module.css) ✓

| Pattern | Examples | Status |
|---------|----------|--------|
| Matches component | `UpgradeCenter.module.css` | ✓ Correct |

**Status:** Consistent pattern.

---

## 3. Variable/Function Naming

### Inconsistent Param Names

| Context | Variants | Recommendation |
|---------|----------|----------------|
| Car identifier | `slug`, `carSlug`, `car_slug` | Use `carSlug` in JS |
| User identifier | `userId`, `user_id` | Use `userId` in JS |
| Build identifier | `buildId`, `build_id` | Use `buildId` in JS |

**Rule:** camelCase in JavaScript, snake_case in SQL/database.

---

### Event Handler Names

| Pattern | Examples | Count |
|---------|----------|-------|
| `on*` | `onClose`, `onChange`, `onSubmit` | Most common |
| `handle*` | `handleClick`, `handleClose` | Some components |

**Recommendation:** Standardize on `on*` for props, `handle*` for internal handlers.

```jsx
// Prop: onClick
// Internal: handleClick = () => { ... }
<Component onClick={handleClick} />
```

---

### Boolean Props

| Pattern | Examples | Status |
|---------|----------|--------|
| `is*` | `isLoading`, `isModified` | ✓ Common |
| `has*` | `hasUpgrades`, `hasError` | ✓ Used |
| Bare | `loading`, `modified` | ⚠️ Some usage |

**Recommendation:** Prefer `is*`/`has*` for boolean props.

---

## 4. Prop Naming Consistency

### Component Props Survey

| Prop Category | Variants Found | Recommendation |
|---------------|----------------|----------------|
| Loading state | `isLoading`, `loading` | Use `isLoading` |
| Error state | `error`, `hasError` | Use `error` object |
| Data | `data`, `items`, specific name | Context-dependent |
| Callbacks | `on*`, `handle*` | Use `on*` for props |
| Style | `className`, `style` | Use `className` |

---

## 5. Database Column vs JS Property

### Transformation Pattern

| Database (snake_case) | JavaScript (camelCase) |
|----------------------|------------------------|
| `car_slug` | `carSlug` |
| `user_id` | `userId` |
| `zero_to_sixty` | `zeroToSixty` |
| `braking_60_0` | `braking60To0` |
| `installed_modifications` | `installedModifications` |
| `created_at` | `createdAt` |

**Status:** `carsClient.js` has proper `normalizeCarFromSupabase()` function.

**Issue:** Some services may not normalize consistently.

---

## 6. Import Alias Patterns

### Current Patterns

```javascript
// Absolute imports (good)
import { fetchCars } from '@/lib/carsClient';

// Relative imports (acceptable for local)
import { Modal } from '../ui/Modal';

// Default vs named exports
import carsClient from '@/lib/carsClient';  // Default
import { fetchCars } from '@/lib/carsClient';  // Named
```

**Issue:** Mix of default and named exports from same module.

**Recommendation:** Document pattern per module:
- Services: Named exports + default object
- Components: Default export

---

## Recommendations Summary

### 1. Document Existing Conventions
Create `docs/NAMING_CONVENTIONS.md`:
- car vs vehicle terminology
- build vs project terminology
- File naming patterns
- Prop naming patterns

### 2. Standardize Service File Suffixes
| Type | Suffix |
|------|--------|
| CRUD/Business logic | `*Service.js` |
| External API clients | `*Client.js` |
| Calculations | `*Calculator.js` |
| Utilities | No suffix or `*Utils.js` |

### 3. Standardize Prop Names
| Purpose | Pattern |
|---------|---------|
| Boolean state | `is*`, `has*` |
| Callbacks | `on*` |
| Handlers | `handle*` (internal) |

### 4. Add Lint Rules
```json
{
  "rules": {
    "react/boolean-prop-naming": ["error", { "rule": "^(is|has)[A-Z]" }],
    "camelcase": ["error", { "properties": "never" }]
  }
}
```

---

## Severity Assessment

| Issue | Severity | Action |
|-------|----------|--------|
| Performance calc file inconsistency | P0 | Fix in consolidation |
| car/vehicle terminology | Low | Document only |
| build/project terminology | Medium | Document, consider unifying |
| Service file suffixes | Low | Document pattern |
| Boolean prop naming | Low | Add lint rule |
| Handler naming | Low | Add lint rule |
