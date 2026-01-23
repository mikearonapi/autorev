# Tech Debt Priority Matrix

**Generated:** 2026-01-22
**Scope:** Full codebase audit findings

---

## Priority Legend

| Priority | Meaning | Action Timeline |
|----------|---------|-----------------|
| **P0** | Critical - Fix immediately | This sprint |
| **P1** | High - Fix soon | Next 2 sprints |
| **P2** | Medium - Plan to fix | Roadmap |
| **P3** | Low - Nice to have | Backlog |

---

## P0: Critical Issues (Fix Immediately)

### P0-1: Performance Calculator Fragmentation

| Attribute | Value |
|-----------|-------|
| **Location** | `lib/performance.js`, `lib/performanceCalculatorV2.js`, `lib/buildPerformanceCalculator.js`, `lib/upgradeCalculator.js`, `lib/upgrades.js` |
| **Impact** | Inconsistent HP calculations across app, potential data integrity issues |
| **Effort** | Large (2-3 days) |
| **Risk if unfixed** | Users see different HP numbers on different screens |

**Evidence:**
```
STAGE_TUNE_INCLUDED_MODS duplicated in 5 files:
- lib/upgrades.js:616
- lib/performance.js:121
- lib/buildPerformanceCalculator.js:294
- lib/performanceCalculatorV2.js:109
- lib/upgradeCalculator.js:53
```

**Recommendation:**
1. Create `lib/performanceCalculator/constants.js` with shared constants
2. Create `lib/performanceCalculator/index.js` as single entry point
3. Deprecate redundant files with re-exports during migration
4. Update all consumers to use unified module

---

### P0-2: Duplicate `resolveCarId` Implementations

| Attribute | Value |
|-----------|-------|
| **Location** | `lib/carResolver.js:21`, `lib/userDataService.js:29`, `lib/knowledgeIndexService.js:37` |
| **Impact** | Inconsistent caching, potential N+1 queries |
| **Effort** | Small (1-2 hours) |
| **Risk if unfixed** | Performance degradation, cache inconsistency |

**Recommendation:**
1. Import from `lib/carResolver.js` in all files
2. Remove local implementations
3. Add lint rule to prevent re-implementation

---

## P1: High Priority Issues (Fix Soon)

### P1-1: Multiple Supabase Client Files

| Attribute | Value |
|-----------|-------|
| **Location** | `lib/supabase.js`, `lib/supabaseClient.js`, `lib/supabaseServer.js` |
| **Impact** | Confusion about which client to use, potential RLS bypass |
| **Effort** | Medium (4-6 hours) |

**Evidence:**
- `supabase.js` - Browser client with `isSupabaseConfigured` export
- `supabaseClient.js` - Appears to be duplicate/alias
- `supabaseServer.js` - Server-side client with service role

**Recommendation:**
1. Audit all imports of these files
2. Document clear usage guidelines
3. Consider consolidating `supabase.js` and `supabaseClient.js`

---

### P1-2: Discord Integration Duplication

| Attribute | Value |
|-----------|-------|
| **Location** | `lib/discord.js`, `lib/discordAlerts.js` |
| **Impact** | Maintenance burden, inconsistent alert formatting |
| **Effort** | Small (2-3 hours) |

**Recommendation:**
1. Audit both files for overlapping functionality
2. Consolidate into single `lib/discord.js`

---

### P1-3: Error Logging Fragmentation

| Attribute | Value |
|-----------|-------|
| **Location** | `lib/errorLogger.js`, `lib/serverErrorLogger.js`, `lib/errorAggregator.js`, `lib/errorAnalysis.js` |
| **Impact** | Inconsistent error tracking, missed errors |
| **Effort** | Medium (4-6 hours) |

**Recommendation:**
1. Define clear responsibilities for each file
2. Consolidate where appropriate
3. Ensure all errors flow through central system

---

### P1-4: Provider Data Overlap Investigation

| Attribute | Value |
|-----------|-------|
| **Location** | `components/providers/` |
| **Impact** | Potential data inconsistency, unnecessary re-renders |
| **Effort** | Medium (investigation required) |

**Providers to audit:**
- `OwnedVehiclesProvider` - User's owned vehicles
- `SavedBuildsProvider` - Saved build configurations
- `FavoritesProvider` - Favorited cars
- `CarSelectionProvider` - Currently selected car
- `CompareProvider` - Compare list

**Questions to answer:**
1. Is vehicle data duplicated between OwnedVehicles and SavedBuilds?
2. Should CarSelection be merged into OwnedVehicles?
3. Are there unnecessary prop drilling patterns?

---

## P2: Medium Priority Issues (Plan to Fix)

### P2-1: Large Service Files Need Splitting

| File | Lines | Recommendation |
|------|-------|----------------|
| `lib/alTools.js` | ~2,000+ | Split into tool categories |
| `lib/userDataService.js` | ~1,000+ | Split by entity (vehicles, favorites, projects) |
| `lib/carsClient.js` | ~600 | Consider splitting by function type |

---

### P2-2: Inconsistent Naming Patterns

| Pattern | Examples | Issue |
|---------|----------|-------|
| Car vs Vehicle | `carsClient.js` vs `OwnedVehiclesProvider` | Terminology inconsistency |
| Service suffix | `userDataService.js` vs `carsClient.js` | Naming convention |
| camelCase vs kebab-case | API routes use kebab, code uses camel | Cross-reference confusion |

---

### P2-3: API Route Consolidation Opportunities

**Potential overlaps to investigate:**

| Category | Routes | Question |
|----------|--------|----------|
| Car data | `/api/cars/[slug]/issues`, `/api/cars/[slug]/enriched` | Should issues be in enriched bundle? |
| User data | `/api/users/[userId]/vehicles`, `/api/users/[userId]/garage` | Are these redundant? |
| Analytics | 8 analytics routes | Should some be consolidated? |

---

### P2-4: Missing TypeScript Types

| Area | Current State | Recommendation |
|------|---------------|----------------|
| Database types | Single `types/database.ts` | Expand coverage |
| API responses | No types | Add response interfaces |
| Service functions | JSDoc only | Consider gradual TS migration |

---

## P3: Low Priority Issues (Nice to Have)

### P3-1: Test Coverage Gaps

**Files with tests:**
- `lib/upgradeCalculator.test.js`
- `lib/recallService.test.js`
- `lib/statsService.test.js`
- `lib/adminMetricsService.test.js`
- Several integration tests

**Files needing tests:**
- All performance calculators (critical given duplication issue)
- `lib/carResolver.js`
- `lib/userDataService.js`

---

### P3-2: Documentation Gaps

| Gap | Impact |
|-----|--------|
| Provider dependency chart missing | Hard to understand data flow |
| API route documentation incomplete | Developer friction |
| Performance calculator comparison missing | Unclear which to use |

---

### P3-3: Dead Code Candidates

**Requires deeper analysis:**
- Deprecated columns in car normalization (commented in `carsClient.js`)
- Possibly unused API routes
- Legacy compatibility code

---

## Summary by Priority

| Priority | Count | Estimated Effort |
|----------|-------|------------------|
| P0 | 2 | 3-4 days |
| P1 | 4 | 2-3 days |
| P2 | 4 | 1-2 weeks |
| P3 | 3 | As time permits |

---

## Recommended Action Order

1. **P0-1: Performance Calculator** - Highest risk, affects data integrity
2. **P0-2: resolveCarId duplicates** - Quick win, easy fix
3. **P1-1: Supabase clients** - Clarify usage patterns
4. **P1-4: Provider audit** - Understand before refactoring
5. **P1-2: Discord consolidation** - Quick win
6. **P1-3: Error logging** - Improve observability
7. **P2+ items** - Schedule based on roadmap

---

## Verification

To verify these findings:

```bash
# Check STAGE_TUNE_INCLUDED_MODS duplication
grep -r "STAGE_TUNE_INCLUDED_MODS" lib/

# Check resolveCarId duplication
grep -r "async function resolveCarId" lib/

# List all provider files
ls components/providers/

# Count API routes
find app/api -name "route.js" | wc -l
```
