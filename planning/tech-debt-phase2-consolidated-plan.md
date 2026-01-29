# Tech Debt Phase 2: Consolidated Cleanup & Migration Plan

> **Created:** January 20, 2026  
> **Context:** Lessons learned from icon migration work revealed we were updating dead code. This plan prioritizes cleanup BEFORE migrations.

---

## Executive Summary

During icon library migration, we discovered ~4 component files that appear to be dead code (not imported anywhere). This indicates we need a **proper audit and cleanup phase** before continuing migrations.

**New Strategy:** Clean house first, then optimize what remains.

---

## Phase 1: Dead Code Audit & Removal (DO THIS FIRST)

### 1A: Confirmed Dead Components (Not Imported in app/)

These files have local `Icons` definitions but are NOT imported anywhere in `app/`:

| File | Last Modified | Notes |
|------|---------------|-------|
| `components/BuildsWorkshop.jsx` | N/A | File does not exist |
| `components/BuildEditor.jsx` | TBD | No imports found |
| `components/UpgradeConfigPanel.jsx` | TBD | No imports found |
| ~~`components/DynamicBuildConfig.jsx`~~ | - | **REMOVED** (orphaned) |

**Action:** Verify these are truly unused, then delete or archive.
**Note:** `DynamicBuildConfig.jsx` was removed during Jan 2026 reorganization as orphaned.

### 1B: Full Dead Code Scan Needed

Run comprehensive audit on ALL components:

```bash
# Find all component files
find components -name "*.jsx" -type f | wc -l

# For each, check if imported anywhere in app/
# Components not imported = candidates for deletion
```

**Suspected additional dead code areas:**
- `components/*.DEPRECATED.*` files (already identified some)
- Any component with `.bak` extension (104 .bak files in components/)
- Unused page components in app/

### 1C: Backup File Cleanup

From project layout, we have:
- **104 `.bak` files** in components/ directory

**Action:** These should be deleted. Git history preserves old versions.

---

## Phase 2: Complete Icon Library Migration (AFTER Cleanup)

### 2A: Already Migrated ✅

These components now use shared `@/components/ui/Icons`:

1. `TunabilityBadge.jsx` ✅
2. `PremiumGate.jsx` ✅
3. `FeedbackWidget.jsx` ✅
4. `SelectedCarFloatingWidget.jsx` ✅
5. `ALAttachmentMenu.jsx` ✅
6. `WheelTireSpecsCard.jsx` ✅
7. `MarketValueSection.jsx` ✅
8. `ALPreferencesPanel.jsx` ✅
9. `EventMap.jsx` ✅
10. `EventCalendarView.jsx` ✅
11. `PerformanceData.jsx` ✅
12. `CalculatedPerformance.jsx` ✅
13. `PerformanceHub.jsx` ✅
14. `LapTimeEstimator.jsx` ✅
15. `CustomSpecsEditor.jsx` ✅
16. `FeatureBreakdown.jsx` ✅
17. `ModelVariantComparison.jsx` ✅
18. `UpgradeAggregator.jsx` ✅
19. `CarDetailSections.jsx` ✅

### 2B: Still Need Migration (Confirmed Active)

These have local Icons AND are imported in app/ pages:

| File | Used In | Priority |
|------|---------|----------|
| `SportsCarComparison.jsx` | car-selector page | High |
| `UpgradeCenter.jsx` | my-build page | High |
| `BuildDetailView.jsx` | garage page | High |
| `BuildMediaGallery.jsx` | garage, my-photos | High |

### 2C: Need Verification Before Migration

These need import verification:
- Any remaining files with `const Icons = {` pattern
- Check if they're imported in active pages

---

## Phase 3: Additional Consolidation Opportunities

### 3A: Duplicate/Similar Components

From earlier analysis, investigate:
- Multiple modal components (consolidate to one pattern?)
- Multiple card components (should use shared styles?)
- Form patterns (any duplication?)

### 3B: CSS Module Cleanup

- Remove unused CSS modules (pair with deleted components)
- Check for duplicate styles across modules

### 3C: Lib Consolidation

Check for:
- Duplicate utility functions
- Unused lib files
- Consolidation opportunities in data fetching

---

## Recommended Execution Order

### Step 1: Dead Code Audit (New Thread)
1. Run comprehensive import analysis on ALL components
2. Generate list of unused components
3. Review list with user
4. Delete confirmed dead code
5. Delete all .bak files
6. Commit: "chore: remove dead code and backup files"

### Step 2: Finish Icon Migration (Same or New Thread)
1. Migrate only the 4 confirmed active files
2. Verify build passes
3. Commit: "refactor: complete icon library migration"

### Step 3: Broader Consolidation (Future)
1. CSS consolidation
2. Component pattern standardization
3. Lib cleanup

---

## Icons Added to Shared Library

During migration, these icons were added to `components/ui/Icons.jsx`:

```
document, bolt, globe, dollarSign, video, zoomIn, zoomOut, 
activity, stopwatch, target, disc, speed, weight, tachometer, 
tire, brake, comfort, thermometer, sound, chevronsRight, clock, 
brain, minus, wheel, book, users, tool, interior, track, 
reliability, value, fuel, shield, driverFun, aftermarket, 
trophy, leaf
```

---

## Key Learnings

1. **Always audit before migrating** - We wasted tokens updating potentially dead code
2. **Check imports first** - A component existing doesn't mean it's used
3. **104 .bak files** - Technical debt that should be cleaned up
4. **Phased approach works** - But phases should be: audit → cleanup → optimize

---

## Quick Reference: Audit Commands

```bash
# Find all components with local Icons definitions
grep -r "const Icons = {" components/ --include="*.jsx" -l

# Check if a component is imported anywhere
grep -r "from.*ComponentName" app/ --include="*.jsx"

# Find all .bak files
find . -name "*.bak" -type f

# Find all .DEPRECATED files
find . -name "*.DEPRECATED.*" -type f
```

---

## For Next Thread

Start with:
> "I want to continue the tech debt cleanup. Reference `planning/tech-debt-phase2-consolidated-plan.md` for context. Let's start with Phase 1: Dead Code Audit."

This will give the new thread full context without re-explaining everything.
