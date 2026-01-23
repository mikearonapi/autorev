# Dead Code Audit Report

**Generated:** 2026-01-22
**Scope:** Unused exports, unused files, unused dependencies

---

## 1. Potentially Unused Files

### Requires Investigation

| File | Reason for Suspicion | Action |
|------|---------------------|--------|
| `lib/supabaseClient.js` | May be duplicate of `lib/supabase.js` | Check all imports |
| `lib/discordAlerts.js` | May overlap with `lib/discord.js` | Audit functionality |
| `data/cars.js` | Static data - is it still used? | Check imports |
| `lib/performanceCalculatorV2.js` | "Feature flagged" - is flag enabled? | Check usage |

### Verification Commands

```bash
# Check supabaseClient usage
grep -r "from.*supabaseClient" --include="*.js" --include="*.jsx"

# Check discordAlerts usage
grep -r "from.*discordAlerts" --include="*.js" --include="*.jsx"

# Check data/cars.js usage
grep -r "from.*data/cars" --include="*.js" --include="*.jsx"

# Check performanceCalculatorV2 usage
grep -r "from.*performanceCalculatorV2" --include="*.js" --include="*.jsx"
```

---

## 2. Deprecated Code Sections

### In carsClient.js

```javascript
// Line ~355-358
// DEPRECATED: Use car_tuning_profiles.upgrades_by_objective via useTuningProfile hook
// This field is kept for backward compatibility but should not be used for new features
// upgradeRecommendations: car.upgrade_recommendations, // REMOVED - deprecated column
```

**Status:** Already removed from normalization. Good.

### In useCarData.js

```javascript
// Lines 419-429
/**
 * @deprecated Prefer `useCarEnrichedBundle` which makes 1 API request instead of 4.
 * This hook is kept for backwards compatibility but new code should use the bundle.
 */
export function useCarEnrichedData(slug) { ... }
```

**Status:** Deprecated but kept for compatibility. Consider timeline for removal.

---

## 3. Commented-Out Code Blocks

### Search Pattern
```bash
# Find large commented blocks
grep -r "// TODO" lib/ components/ --include="*.js" --include="*.jsx" | wc -l
grep -r "/\*.*\*/" lib/ --include="*.js" -A 3 -B 1
```

### Known TODOs to Review

**performanceCalculatorV2.js:663**
```javascript
// TODO: Weight by typical gain ratios
return 1 / allUpgrades.length;
```

**Various files likely have TODO comments** - need systematic review.

---

## 4. Unused Exports Analysis

### Methodology
For each exported function, check if it's imported anywhere.

### High-Risk Files to Check

| File | Exports | Question |
|------|---------|----------|
| `lib/performance.js` | 15+ functions | Are all used? |
| `lib/upgradeCalculator.js` | 8 functions | Are all used after V2? |
| `lib/carsClient.js` | 6 functions | Are all used? |
| `lib/userDataService.js` | 50+ functions | Are all used? |

### Verification Script
```javascript
// Check specific export usage
// For each export in file, run:
grep -r "functionName" --include="*.js" --include="*.jsx" | grep -v "export"
```

---

## 5. Unused Dependencies (package.json)

### Dependencies to Verify

**Requires checking package.json and running:**
```bash
# Check if dependency is imported
grep -r "from 'dependency-name'" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx"

# Or using depcheck tool
npx depcheck
```

### Common Unused Dependencies
- Test utilities not in regular code
- Build tools not imported
- Peer dependencies

---

## 6. Unused CSS Classes

### Methodology
CSS modules generally don't have unused classes due to import pattern.

### Global CSS to Check
- `styles/globals.css` - may have unused styles
- `styles/components/*.css` - shared component styles

---

## 7. Unused API Routes

### Candidates for Investigation

| Route | Question |
|-------|----------|
| `/api/v2/performance` | Is V2 actually used? |
| `/api/garage/enrich` | What calls this? |
| `/api/dyno-results` | Is this used or replaced? |

### Verification
```bash
# Check route usage in frontend
grep -r "api/v2/performance" --include="*.js" --include="*.jsx"
grep -r "api/garage/enrich" --include="*.js" --include="*.jsx"
grep -r "api/dyno-results" --include="*.js" --include="*.jsx"
```

---

## 8. Unused Database Tables

### Per DATABASE.md and no-duplication rules

**Known deprecated tables:**
- `vehicle_known_issues` - Use `car_issues` instead
- `cars.upgrade_recommendations` - Use `car_tuning_profiles.upgrades_by_objective`
- `cars.popular_track_mods` - Use `car_tuning_profiles.upgrades_by_objective`

**Action:** Verify these are not queried directly in code.

---

## 9. Feature-Flagged Code

### Known Feature Flags

| Feature | File | Status |
|---------|------|--------|
| V2 Calculator | `performanceCalculatorV2.js` | Check if enabled |
| IS_BETA | Various | Per tierAccess docs |

### Verification
```bash
# Find feature flag usage
grep -r "IS_BETA" --include="*.js" --include="*.jsx"
grep -r "featureFlag" --include="*.js" --include="*.jsx"
grep -r "FEATURE_" --include="*.js" --include="*.jsx"
```

---

## Recommendations

### 1. Run depcheck
```bash
npx depcheck
```
This will identify unused npm dependencies.

### 2. Create Unused Export Audit Script
```bash
#!/bin/bash
# audit-unused-exports.sh
for file in lib/*.js; do
  echo "=== $file ==="
  # Extract exports and check usage
  grep -E "^export (function|const|async)" "$file" | \
    sed 's/export //' | \
    while read export; do
      name=$(echo "$export" | cut -d'(' -f1 | cut -d'=' -f1 | tr -d ' ')
      count=$(grep -r "$name" --include="*.js" --include="*.jsx" | wc -l)
      if [ "$count" -lt 3 ]; then
        echo "  POSSIBLY UNUSED: $name (found $count times)"
      fi
    done
done
```

### 3. Set Up Dead Code Detection in CI
- Add depcheck to CI pipeline
- Add custom script for export checking
- Fail build on new dead code

### 4. Document Deprecation Timeline
For each deprecated function/file:
- When it was deprecated
- What replaces it
- When it will be removed

---

## Summary

| Category | Count | Status |
|----------|-------|--------|
| Suspected unused files | 4 | Needs verification |
| Deprecated code sections | 2 | Documented |
| Commented-out blocks | Unknown | Needs scan |
| Unused exports | Unknown | Needs audit script |
| Unused dependencies | Unknown | Run depcheck |
| Unused CSS | Low risk | CSS modules self-clean |
| Unused API routes | 3 | Needs verification |
| Unused DB tables | 3 | Documented as deprecated |

**Next Steps:**
1. Run depcheck for dependencies
2. Run custom export audit script
3. Verify suspected unused files
4. Create deprecation timeline
