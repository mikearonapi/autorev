# PAGE AUDIT: /garage - Garage Home

> **Audit ID:** Page-14  
> **Category:** Core App Page (High-Traffic)  
> **Priority:** 13 of 36  
> **Route:** `/garage`  
> **Auth Required:** Yes

---

## PAGE OVERVIEW

The Garage home page is the **central hub** for vehicle management. Users see their vehicles, select the active vehicle, and navigate to detailed garage sections (specs, build, performance, etc.).

**Key Features:**
- Vehicle list/grid display
- Add new vehicle flow
- Vehicle selection (sets context for sub-pages)
- Navigation to garage sub-sections
- Vehicle summary cards with key stats

---

## FILES TO EXAMINE

### Page Files

| File | Purpose |
|------|---------|
| `app/(app)/garage/page.jsx` | Main page component |
| `app/(app)/garage/page.module.css` | Page styles |
| `app/(app)/garage/layout.jsx` | Garage layout (shared across sub-pages) |

### Related Components

| File | Purpose |
|------|---------|
| `components/VehicleCard.jsx` | Vehicle display card |
| `components/AddVehicleButton.jsx` | Add vehicle CTA |
| `components/VehicleSelector.jsx` | Vehicle picker dropdown |
| `components/SelectedCarBanner.jsx` | Selected vehicle banner |

### Related Providers/Hooks

| File | Purpose |
|------|---------|
| `components/providers/OwnedVehiclesProvider.jsx` | Vehicle list context |
| `components/providers/SelectedCarProvider.jsx` | Selected vehicle context |
| `hooks/useCarData.js` | Car data fetching |

---

## CRITICAL: Read These First

Before making ANY changes:

1. `docs/SOURCE_OF_TRUTH.md` - Garage Feature Architecture section
2. Cross-cutting audit findings:
   - D (UI/UX) - Card styling, touch targets
   - C (Database) - car_id resolution
   - I (State Management) - OwnedVehiclesProvider usage

---

## IMPORTANT: INVESTIGATE BEFORE FIX

Before changing ANY code:

1. ✅ Load the page and verify current functionality
2. ✅ Test with 0, 1, and multiple vehicles
3. ✅ Test vehicle selection persists across navigation
4. ❌ Do NOT break vehicle selection context
5. ❓ If vehicle data seems stale, check provider cache

---

## CHECKLIST

### A. Functionality

- [ ] Page loads without errors
- [ ] Vehicle list displays all user vehicles
- [ ] Vehicle cards show correct data (make, model, year, image)
- [ ] Clicking vehicle selects it
- [ ] Selected vehicle highlighted visually
- [ ] Add vehicle button works
- [ ] Navigation to sub-pages works
- [ ] Selected vehicle context persists to sub-pages

### B. Data Flow

- [ ] Uses `useOwnedVehicles()` provider
- [ ] Uses `useSelectedCar()` for selection context
- [ ] Vehicle data includes necessary fields
- [ ] No direct Supabase calls in component
- [ ] Selection updates provider (not local state only)

### C. UI/UX Design System

- [ ] Colors follow 4-color system:
  - [ ] Add vehicle CTA uses lime
  - [ ] Selected vehicle has teal highlight/border
  - [ ] Vehicle stats use appropriate colors
- [ ] No hardcoded hex colors
- [ ] Cards use consistent styling
- [ ] Typography follows design tokens

### D. Vehicle Cards

- [ ] Card displays vehicle image
- [ ] Fallback for missing images
- [ ] Shows make, model, year
- [ ] Shows key stats (HP, mods count)
- [ ] Selected state visually distinct
- [ ] Tap target is entire card (44px+ height)

### E. Loading States

- [ ] Skeleton loaders for vehicle cards
- [ ] Skeleton matches card shape
- [ ] No layout shift when data loads
- [ ] Loading state shows appropriate number of skeletons

### F. Error States

- [ ] Handles API errors gracefully
- [ ] Shows error message with retry
- [ ] Error doesn't break entire page

### G. Empty States

- [ ] Shows welcome when no vehicles
- [ ] Clear "Add your first vehicle" CTA
- [ ] Empty state is encouraging, not bare

### H. Accessibility

- [ ] All vehicle cards are keyboard accessible
- [ ] Selected vehicle announced to screen readers
- [ ] Focus indicator visible on cards
- [ ] Add vehicle button has proper label
- [ ] 44px minimum touch targets

### I. Performance

- [ ] Vehicle images lazy loaded
- [ ] Images optimized (proper sizing)
- [ ] No unnecessary re-renders on selection
- [ ] List virtualized if many vehicles (10+)

### J. Mobile Responsiveness

- [ ] Cards stack/grid appropriately
- [ ] Works on 320px width
- [ ] Touch targets adequate
- [ ] No horizontal scroll

---

## SPECIFIC CHECKS FOR GARAGE

### Vehicle Selection

```javascript
// Selection should use provider
const { selectedVehicle, setSelectedVehicle } = useSelectedCar();

// NOT local state
const [selected, setSelected] = useState(null);
```

- [ ] Selection persists across page navigation
- [ ] Selection persists on page refresh (localStorage/URL)
- [ ] Selection clears appropriately when vehicle deleted

### Vehicle Image Handling

- [ ] Default/fallback image for vehicles without photos
- [ ] Images use Next.js `<Image>` component
- [ ] Images have proper aspect ratio
- [ ] Images don't cause CLS

### Add Vehicle Flow

- [ ] Add button clearly visible
- [ ] Flow doesn't lose context
- [ ] Return to garage after adding
- [ ] New vehicle appears in list

### Sub-Page Navigation

| Link | Target | Works |
|------|--------|-------|
| My Specs | `/garage/my-specs` | ✅/❌ |
| My Build | `/garage/my-build` | ✅/❌ |
| My Performance | `/garage/my-performance` | ✅/❌ |
| My Parts | `/garage/my-parts` | ✅/❌ |
| My Install | `/garage/my-install` | ✅/❌ |
| My Photos | `/garage/my-photos` | ✅/❌ |

---

## TESTING SCENARIOS

### Test Case 1: New User (No Vehicles)

1. Log in as user with no vehicles
2. Navigate to /garage
3. **Expected:** Empty state with "Add your first vehicle"
4. **Verify:** CTA works and leads to add flow

### Test Case 2: Single Vehicle

1. Log in as user with one vehicle
2. Navigate to /garage
3. **Expected:** Vehicle card displayed, auto-selected
4. **Verify:** Can navigate to sub-pages

### Test Case 3: Multiple Vehicles

1. Log in as user with 3+ vehicles
2. Navigate to /garage
3. **Expected:** All vehicles displayed, one selected
4. **Verify:** Can switch selection between vehicles

### Test Case 4: Vehicle Selection Persistence

1. Select vehicle A
2. Navigate to /garage/my-specs
3. Navigate back to /garage
4. **Expected:** Vehicle A still selected
5. **Verify:** Also persists on refresh

### Test Case 5: Add New Vehicle

1. Click "Add Vehicle"
2. Complete add flow
3. **Expected:** Return to garage, new vehicle visible
4. **Verify:** New vehicle can be selected

---

## AUTOMATED CHECKS

```bash
# 1. Check for hardcoded colors
grep -rn "#[0-9a-fA-F]\{3,6\}" app/\(app\)/garage/page.jsx app/\(app\)/garage/page.module.css

# 2. Check for direct Supabase usage
grep -rn "supabase\|createClient" app/\(app\)/garage/page.jsx

# 3. Check for provider usage
grep -rn "useOwnedVehicles\|useSelectedCar" app/\(app\)/garage/page.jsx

# 4. Check for proper Image usage
grep -rn "<img\|<Image" app/\(app\)/garage/page.jsx

# 5. Check for console.log
grep -rn "console\.log" app/\(app\)/garage/page.jsx

# 6. Check for touch target issues
grep -rn "p-1\|p-2\|h-6\|h-8" app/\(app\)/garage/page.jsx
```

---

## CROSS-REFERENCE WITH FOUNDATION AUDITS

| Audit | Check On This Page |
|-------|-------------------|
| D. UI/UX | Card styling, selected state colors |
| E. Accessibility | Card keyboard navigation, focus states |
| C. Database | Provider usage, no direct queries |
| I. State Management | OwnedVehiclesProvider, SelectedCarProvider |
| A. Performance | Image optimization, no re-render on select |

---

## DELIVERABLES

### 1. Functionality Report

| Feature | Works | Issues |
|---------|-------|--------|
| Vehicle list | ✅/❌ | |
| Vehicle selection | ✅/❌ | |
| Selection persistence | ✅/❌ | |
| Add vehicle | ✅/❌ | |
| Sub-page navigation | ✅/❌ | |

### 2. Compliance Report

| Category | Pass | Issues |
|----------|------|--------|
| UI/UX Design System | ✅/❌ | |
| Accessibility | ✅/❌ | |
| Performance | ✅/❌ | |
| State Management | ✅/❌ | |

### 3. Issues Found

| Severity | Issue | File:Line | Fix |
|----------|-------|-----------|-----|
| | | | |

---

## VERIFICATION

- [ ] All functionality works as expected
- [ ] Vehicle selection persists correctly
- [ ] Empty state guides new users
- [ ] All cards accessible via keyboard
- [ ] Mobile responsive

---

## SUCCESS CRITERIA

| # | Criterion |
|---|-----------|
| 1 | Vehicle list displays all user vehicles |
| 2 | Selection works and persists across navigation |
| 3 | Empty state shows clear CTA |
| 4 | Selected vehicle visually distinct (teal) |
| 5 | All sub-page links work |
| 6 | Uses providers (not direct data fetching) |
| 7 | No critical/high issues remaining |

---

## OUTPUT FORMAT

```
📊 PAGE AUDIT: /garage

**Status:** ✅ Pass / ⚠️ Issues / ❌ Fail

**Functionality:**
- [x] Vehicle list displays
- [x] Selection works
- [ ] Selection doesn't persist on refresh (issue #1)

**Issues Found:**
1. [High] Selection lost on refresh → Store in localStorage
2. [Medium] Missing skeleton loader → Add VehicleCardSkeleton
...

**Sub-Page Navigation:**
- My Specs: ✅
- My Build: ✅
- My Performance: ✅
- My Parts: ✅
- My Install: ✅
- My Photos: ✅

**Test Results:**
- No vehicles: ✅
- Single vehicle: ✅
- Multiple vehicles: ⚠️
- Selection persistence: ❌
- Add vehicle: ✅
```

---

## AUDIT EXECUTION LOG

| Date | Auditor | Status | Issues | Notes |
|------|---------|--------|--------|-------|
| | | | | |

---

*Audit prompt generated: January 25, 2026*  
*Part of AutoRev Systematic Audit Suite (36 total audits)*
