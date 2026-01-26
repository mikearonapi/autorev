# PAGE AUDIT: /garage/my-build - Build Configuration

> **Audit ID:** Page-16  
> **Category:** Core App Page (Garage Sub-Page)  
> **Priority:** 15 of 36  
> **Route:** `/garage/my-build`  
> **Auth Required:** Yes  
> **Parent:** `/garage`

---

## PAGE OVERVIEW

The My Build page is where users **configure their vehicle modifications**. This is a core feature allowing users to select upgrades, see estimated performance gains, and plan their build.

**Key Features:**
- Upgrade category selection (intake, exhaust, tune, etc.)
- Modification selection within categories
- Real-time performance gain estimates
- Build save functionality
- Compatibility warnings

---

## FILES TO EXAMINE

### Page Files

| File | Purpose |
|------|---------|
| `app/(app)/garage/my-build/page.jsx` | Main page component |
| `app/(app)/garage/my-build/page.module.css` | Page styles |

### Related Components

| File | Purpose |
|------|---------|
| `components/UpgradeSelector.jsx` | Upgrade category picker |
| `components/ModificationCard.jsx` | Individual mod display |
| `components/BuildSummary.jsx` | Build total/summary |
| `components/UpgradeCenter.jsx` | Upgrade management |

### Related Services

| File | Purpose |
|------|---------|
| `lib/performanceCalculator/` | HP/TQ gain calculations |
| `lib/userDataService.js` | Save/load builds |
| `components/providers/SavedBuildsProvider.jsx` | Build state |
| `hooks/useCarData.js` | Car tuning data |

---

## CRITICAL: Read These First

Before making ANY changes:

1. `docs/SOURCE_OF_TRUTH.md` - Build & Vehicle Data Model, Performance Calculations
2. Cross-cutting audit findings:
   - D (UI/UX) - Lime for CTAs, teal for gains
   - C (Database) - car_tuning_profiles for upgrades
   - I (State Management) - SavedBuildsProvider

---

## IMPORTANT: INVESTIGATE BEFORE FIX

Before changing ANY code:

1. ✅ Verify build configuration saves/loads correctly
2. ✅ Test gain calculations match expectations
3. ✅ Test with different upgrade combinations
4. ❌ Do NOT change calculation logic without understanding
5. ❓ If gains seem wrong, check `performanceCalculator` first

---

## CHECKLIST

### A. Functionality

- [ ] Page loads with selected vehicle
- [ ] Upgrade categories display correctly
- [ ] Can select modifications in each category
- [ ] Performance gains update in real-time
- [ ] Can save build configuration
- [ ] Saved builds load correctly
- [ ] Can clear/reset build

### B. Data Flow

- [ ] Uses `useSelectedCar()` for vehicle context
- [ ] Uses `useSavedBuilds()` for build state
- [ ] Upgrade options from `car_tuning_profiles.upgrades_by_objective`
- [ ] Gain calculations use `calculateSmartHpGain()` / `calculateAllModificationGains()`
- [ ] Saves to `user_projects` or appropriate table

### C. UI/UX Design System

- [ ] Colors follow 4-color system:
  - [ ] Save/Apply buttons use **lime**
  - [ ] HP/TQ gains use **teal**
  - [ ] Stock values use **blue**
  - [ ] Warnings (compatibility) use **amber**
- [ ] No hardcoded hex colors
- [ ] Numbers use monospace font

### D. Upgrade Selection

- [ ] Categories clearly organized
- [ ] Available upgrades shown per category
- [ ] Selected upgrades visually distinct
- [ ] Can select/deselect upgrades
- [ ] Multi-select works where appropriate
- [ ] Tier restrictions enforced (if applicable)

### E. Performance Gains Display

```
Example:
+45 HP  +38 lb-ft
(teal)  (teal)

Total: 444 HP → 489 HP
       (blue)   (teal)
```

- [ ] Gains calculated dynamically (not hardcoded)
- [ ] Uses `calculateSmartHpGain()` from performanceCalculator
- [ ] Handles diminishing returns correctly
- [ ] Handles conflicting mods correctly
- [ ] Updates on every selection change

### F. Build Save/Load

- [ ] Save button visible and lime colored
- [ ] Save provides feedback (success toast)
- [ ] Saved build loads on return to page
- [ ] Can have multiple saved builds (if supported)
- [ ] Unsaved changes warning on navigation

### G. Loading States

- [ ] Skeleton for upgrade options
- [ ] Loading indicator during save
- [ ] No layout shift on data load

### H. Error States

- [ ] Handles save failure gracefully
- [ ] Handles missing tuning data
- [ ] Shows error with retry option

### I. Compatibility/Warnings

- [ ] Conflicting mods show warning (amber)
- [ ] Mutually exclusive mods handled
- [ ] Prerequisites shown if applicable
- [ ] Warnings don't block selection (just inform)

### J. Accessibility

- [ ] All selections keyboard accessible
- [ ] Focus indicators visible
- [ ] Screen reader announces selections
- [ ] Gains announced on change
- [ ] 44px touch targets on buttons

### K. Mobile Responsiveness

- [ ] Categories navigable on mobile
- [ ] Selection works with touch
- [ ] Summary visible/accessible
- [ ] No horizontal scroll issues

---

## SPECIFIC CHECKS FOR BUILD

### Performance Calculator Usage

```javascript
// CORRECT: Use centralized calculator
import { calculateSmartHpGain, calculateAllModificationGains } from '@/lib/performanceCalculator';

const gains = calculateAllModificationGains(selectedMods, car);
// Returns: { hpGain, tqGain, ... }

// WRONG: Inline calculations
const hpGain = selectedMods.reduce((sum, mod) => sum + mod.hp, 0);  // Too simple!
```

- [ ] Uses `performanceCalculator/` for ALL gain calculations
- [ ] Handles diminishing returns
- [ ] Handles mod conflicts
- [ ] Handles car-specific multipliers

### Upgrade Categories (Typical)

| Category | Examples |
|----------|----------|
| Intake | Cold Air Intake, Short Ram |
| Exhaust | Cat-back, Headers, Downpipe |
| Engine | Cams, Heads, Supercharger |
| Tune | ECU Tune, E85 Tune |
| Forced Induction | Turbo Kit, Supercharger |
| Suspension | Coilovers, Sway Bars |
| Wheels/Tires | Lightweight Wheels, Sticky Tires |

### Build State Structure

```javascript
// Expected build structure
{
  vehicleId: 'uuid',
  selectedMods: [
    { category: 'intake', modId: 'cai-k&n', name: 'K&N Cold Air Intake' },
    { category: 'exhaust', modId: 'catback-borla', name: 'Borla Cat-back' },
  ],
  calculatedGains: { hp: 45, tq: 38 },
  savedAt: '2026-01-25T...'
}
```

---

## TESTING SCENARIOS

### Test Case 1: Empty Build

1. Select vehicle with no saved build
2. Navigate to /garage/my-build
3. **Expected:** Empty state, can start selecting
4. **Verify:** Gains show 0 or "Select upgrades"

### Test Case 2: Select Single Mod

1. Start with empty build
2. Select one modification (e.g., Cold Air Intake)
3. **Expected:** Gain updates immediately (+15 HP or similar)
4. **Verify:** Calculation uses performanceCalculator

### Test Case 3: Multiple Mods (Stack)

1. Select multiple compatible mods
2. **Expected:** Gains stack with diminishing returns
3. **Verify:** Total isn't simple addition

### Test Case 4: Conflicting Mods

1. Select two mutually exclusive mods
2. **Expected:** Warning appears (amber), can still select
3. **Verify:** Calculation handles conflict

### Test Case 5: Save Build

1. Configure a build with multiple mods
2. Click Save
3. Navigate away and return
4. **Expected:** Build loads correctly
5. **Verify:** All selections and gains restored

### Test Case 6: Tier Restriction (if applicable)

1. Log in as free tier user
2. Try to access premium upgrades
3. **Expected:** Upgrade prompt or locked state
4. **Verify:** Tier gating works correctly

---

## AUTOMATED CHECKS

```bash
# 1. Check for hardcoded colors
grep -rn "#[0-9a-fA-F]\{3,6\}" app/\(app\)/garage/my-build/*.jsx app/\(app\)/garage/my-build/*.css

# 2. Check for performanceCalculator usage
grep -rn "calculateSmartHpGain\|calculateAllModificationGains\|performanceCalculator" app/\(app\)/garage/my-build/*.jsx

# 3. Check for inline gain calculations (wrong)
grep -rn "\.reduce.*hp\|\.reduce.*gain\|hpGain\s*=" app/\(app\)/garage/my-build/*.jsx

# 4. Check for provider usage
grep -rn "useSavedBuilds\|useSelectedCar" app/\(app\)/garage/my-build/*.jsx

# 5. Check for console.log
grep -rn "console\.log" app/\(app\)/garage/my-build/*.jsx

# 6. Check for touch target issues
grep -rn "p-1\|p-2\|h-6\|h-8" app/\(app\)/garage/my-build/*.jsx | grep -i button
```

---

## CROSS-REFERENCE WITH FOUNDATION AUDITS

| Audit | Check On This Page |
|-------|-------------------|
| D. UI/UX | Lime CTAs, teal gains, amber warnings |
| E. Accessibility | Keyboard selection, focus states |
| C. Database | car_tuning_profiles usage |
| I. State Management | SavedBuildsProvider |
| A. Performance | Real-time gain calculation speed |

---

## DELIVERABLES

### 1. Functionality Report

| Feature | Works | Issues |
|---------|-------|--------|
| Mod selection | ✅/❌ | |
| Gain calculation | ✅/❌ | |
| Build save | ✅/❌ | |
| Build load | ✅/❌ | |
| Warnings | ✅/❌ | |

### 2. Compliance Report

| Category | Pass | Issues |
|----------|------|--------|
| UI/UX Design System | ✅/❌ | |
| Accessibility | ✅/❌ | |
| Performance | ✅/❌ | |
| Data Flow | ✅/❌ | |

### 3. Issues Found

| Severity | Issue | File:Line | Fix |
|----------|-------|-----------|-----|
| | | | |

---

## VERIFICATION

- [ ] Build configuration saves and loads
- [ ] Gains calculated with performanceCalculator
- [ ] Lime for CTAs, teal for gains
- [ ] Conflicting mods show amber warning
- [ ] Keyboard accessible
- [ ] Mobile responsive

---

## SUCCESS CRITERIA

| # | Criterion |
|---|-----------|
| 1 | Users can select and save modifications |
| 2 | Gains calculated using performanceCalculator |
| 3 | Save/Apply buttons are lime |
| 4 | Gains display in teal |
| 5 | Conflicting mods show amber warning |
| 6 | Build persists across sessions |
| 7 | No critical/high issues remaining |

---

## OUTPUT FORMAT

```
📊 PAGE AUDIT: /garage/my-build

**Status:** ✅ Pass / ⚠️ Issues / ❌ Fail

**Functionality:**
- [x] Mod selection works
- [x] Gains update in real-time
- [ ] Save not working (issue #1)

**Issues Found:**
1. [Critical] Save fails silently → Add error handling
2. [High] Gains hardcoded → Use calculateAllModificationGains()
3. [Medium] Warning color wrong → Use var(--color-warning)
...

**Gain Calculations:**
- Uses performanceCalculator: ✅/❌
- Handles diminishing returns: ✅/❌
- Handles conflicts: ✅/❌

**Test Results:**
- Empty build: ✅
- Single mod: ✅
- Multiple mods: ⚠️ (diminishing returns off)
- Save/load: ❌
- Conflicts: ✅
```

---

## AUDIT EXECUTION LOG

| Date | Auditor | Status | Issues | Notes |
|------|---------|--------|--------|-------|
| | | | | |

---

*Audit prompt generated: January 25, 2026*  
*Part of AutoRev Systematic Audit Suite (36 total audits)*
