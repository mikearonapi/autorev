# AUDIT: Database - Codebase-Wide

> **Audit ID:** C  
> **Category:** Cross-Cutting (Foundation)  
> **Priority:** 4 of 36  
> **Dependencies:** F (Code Quality) - naming patterns for queries  
> **Downstream Impact:** All page audits that fetch data will reference these patterns

---

## CONTEXT

This audit ensures database access patterns are consistent, efficient, and follow AutoRev's Cardinal Rules. Database issues cause data inconsistencies, performance problems, and hard-to-debug bugs.

**Key Focus Areas:**
- Always use `car_id` (not `car_slug`) for queries
- Use `resolveCarId()` for slug resolution
- Select specific fields (not `*`)
- Avoid N+1 queries
- Use optimized RPCs where available

---

## CRITICAL: Read These First

Before making ANY changes, read these documents completely:

1. `docs/SOURCE_OF_TRUTH.md` - Cardinal Rules 1, 4, 5 (car_id, data sources, providers)
2. `.cursor/rules/specialists/implementation/database-agent.mdc` - Query patterns
3. `lib/carResolver.js` - How car_id resolution works

---

## IMPORTANT: INVESTIGATE BEFORE FIX

Before changing ANY code:

1. ✅ Verify the query actually runs and returns correct data
2. ✅ Check if `car_slug` usage might be intentional (URLs, display)
3. ✅ Test that `resolveCarId()` handles the edge cases
4. ❌ Do NOT change working queries without testing
5. ❓ If a query pattern seems inefficient but works, document it first

---

## CARDINAL RULES (Database)

### Rule 1: ALWAYS Use `car_id` for Database Queries

```javascript
// ✅ CORRECT
const carId = await resolveCarId(carSlug);
const { data } = await supabase.from('car_issues').select('*').eq('car_id', carId);

// ❌ WRONG - car_slug has no index, causes inconsistencies
const { data } = await supabase.from('car_issues').select('car_slug', carSlug);
```

**Why:** `car_slug` is for URLs only. All FK relationships use `car_id`.

### Rule 4: Stock Data from `cars` Table, Mods from `user_*` Tables

```javascript
// ✅ CORRECT - Stock from cars, gains calculated from installed mods
const stockHp = car.hp;  // From cars table
const installedMods = vehicle.installedModifications;  // From user_vehicles
const { hpGain } = calculateAllModificationGains(installedMods, car);
const finalHp = stockHp + hpGain;

// ❌ WRONG - Don't store calculated values
const finalHp = vehicle.currentHp;  // Stale!
```

### Rule 5: Use Providers for User State, NOT Direct Queries

```javascript
// ✅ CORRECT - Provider handles caching, sync, auth
const { vehicles } = useOwnedVehicles();

// ❌ WRONG - Bypasses cache, auth checks, subscriptions
const { data } = await supabase.from('user_vehicles').select('*');
```

---

## CHECKLIST

### A. car_id Resolution (CRITICAL)

- [ ] All queries to car-related tables use `car_id`, not `car_slug`
- [ ] `resolveCarId()` called before any `car_id` query from slug input
- [ ] Error handling when `resolveCarId()` returns null
- [ ] No direct `.eq('car_slug', ...)` in database queries
- [ ] API routes that accept slug resolve to car_id first

### B. Query Efficiency

- [ ] All queries select specific fields, not `*`
- [ ] No N+1 query patterns (queries in loops)
- [ ] Joins used instead of multiple round trips
- [ ] Pagination used for large result sets
- [ ] Appropriate indexes exist for query patterns

### C. Optimized RPCs

- [ ] `get_car_ai_context_v2` used for AL car context (not manual joins)
- [ ] `get_car_tuning_context` used for tuning data
- [ ] Other RPCs used where available instead of client-side joins
- [ ] RPC calls handle errors appropriately

### D. Table Source of Truth

| Data | Correct Table | Wrong Table |
|------|---------------|-------------|
| Known Issues | `car_issues` | `vehicle_known_issues` |
| Tuning/Upgrades | `car_tuning_profiles.upgrades_by_objective` | Manual construction |
| Dyno Runs | `car_dyno_runs` | |
| Lap Times | `car_track_lap_times` | |
| User Vehicles | `user_vehicles` | Direct car table queries for user data |

- [ ] Known issues fetched from `car_issues`
- [ ] Tuning data uses `car_tuning_profiles`
- [ ] User vehicle data uses `user_vehicles` with proper joins
- [ ] No duplicate data sources for same information

### E. Data Integrity

- [ ] Foreign key relationships validated before insert
- [ ] Transactions used for multi-table operations
- [ ] Null handling explicit (not assumed)
- [ ] Timestamps use database defaults, not client time
- [ ] UUIDs generated server-side or with proper library

### F. Provider Usage

- [ ] Client components use providers, not direct Supabase
- [ ] `useOwnedVehicles()` for user's vehicles
- [ ] `useFavorites()` for saved cars
- [ ] `useAuth()` for user session
- [ ] Server components can query directly with proper auth

### G. Error Handling

- [ ] All database queries have error handling
- [ ] Errors logged with context (table, operation, params)
- [ ] User-friendly error messages returned
- [ ] Partial failures handled (rollback or compensate)

### H. Security

- [ ] RLS policies enforced (not bypassed with service role unnecessarily)
- [ ] User ID from session, not request body
- [ ] No SQL injection vulnerabilities
- [ ] Sensitive data not logged

---

## KEY FILES TO EXAMINE

### Core Resolution

| File | Purpose |
|------|---------|
| `lib/carResolver.js` | Car slug → car_id resolution |
| `lib/carsClient.js` | Car data fetching patterns |

### Service Files

| File | Check For |
|------|-----------|
| `lib/userDataService.js` | User data queries, provider patterns |
| `lib/insightService.js` | Complex queries, joins |
| `lib/communityService.js` | Community data queries |
| `lib/alConversationService.js` | AL conversation storage |

### API Routes

| Pattern | Check For |
|---------|-----------|
| `app/api/cars/*/route.js` | car_id resolution |
| `app/api/user/*/route.js` | Auth, user_id from session |
| `app/api/garage/*/route.js` | Vehicle ownership checks |
| `app/api/community/*/route.js` | Public vs private data |

### Providers

| File | Check For |
|------|-----------|
| `components/providers/OwnedVehiclesProvider.jsx` | Query patterns |
| `components/providers/FavoritesProvider.jsx` | Caching, sync |
| `components/providers/SavedBuildsProvider.jsx` | Build data |

---

## AUTOMATED CHECKS

Run these commands and document results:

```bash
# 1. Find direct car_slug queries (CRITICAL)
grep -rn "\.eq.*car_slug\|\.eq.*'car_slug'" --include="*.js" --include="*.jsx" app/ lib/ components/

# 2. Find select('*') patterns
grep -rn "\.select\('\*'\)\|\.select\(\"\*\"\)" --include="*.js" --include="*.jsx" app/ lib/

# 3. Find potential N+1 patterns (queries in loops)
grep -rn "for.*await.*supabase\|\.map.*await.*supabase\|\.forEach.*await.*supabase" --include="*.js" --include="*.jsx" app/ lib/

# 4. Find direct Supabase usage in components (should use providers)
grep -rn "from.*supabase.*import\|createClient" --include="*.jsx" components/ | grep -v Provider

# 5. Find queries without error handling
grep -rn "await supabase" --include="*.js" --include="*.jsx" -A3 app/ lib/ | grep -v "catch\|error\|if.*data"

# 6. Find hardcoded table names that might be wrong
grep -rn "vehicle_known_issues" --include="*.js" --include="*.jsx" app/ lib/

# 7. Check for missing resolveCarId usage
grep -rn "params\.slug\|params\.carSlug" --include="*.js" app/api/ | grep -v resolveCarId
```

### Database Analysis

```sql
-- Run in Supabase SQL Editor

-- 1. Find tables without car_id index (potential slow queries)
SELECT tablename FROM pg_indexes 
WHERE indexname LIKE '%car_id%' 
GROUP BY tablename;

-- 2. Check for orphaned records (data integrity)
SELECT COUNT(*) FROM car_issues 
WHERE car_id NOT IN (SELECT id FROM cars);

-- 3. Find tables with car_slug column (potential misuse)
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE column_name = 'car_slug';
```

---

## SOURCE OF TRUTH PATTERNS

From `docs/SOURCE_OF_TRUTH.md`:

```javascript
// ✅ CORRECT: Resolve slug, then query with car_id
import { resolveCarId } from '@/lib/carResolver';

export async function GET(request, { params }) {
  const carId = await resolveCarId(params.slug);
  if (!carId) {
    return NextResponse.json({ error: 'Car not found' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('car_issues')
    .select('id, title, severity, description')  // Specific fields
    .eq('car_id', carId)
    .order('severity', { ascending: false });

  if (error) {
    console.error('[CarIssues] Query failed:', { carId, error: error.message });
    return NextResponse.json({ error: 'Failed to fetch issues' }, { status: 500 });
  }

  return NextResponse.json(data);
}
```

```javascript
// ✅ CORRECT: Use RPC for complex data
const { data } = await supabase.rpc('get_car_ai_context_v2', { 
  p_car_slug: slug 
});

// ❌ WRONG: Manual joins that duplicate RPC logic
const car = await fetchCar(slug);
const issues = await fetchIssues(car.id);
const tuning = await fetchTuning(car.id);
// ... assembling manually
```

```javascript
// ✅ CORRECT: Avoid N+1 with joins
const { data } = await supabase
  .from('user_vehicles')
  .select(`
    id, nickname, mileage,
    cars!inner (id, slug, make, model, year, hp)
  `)
  .eq('user_id', userId);

// ❌ WRONG: N+1 pattern
const vehicles = await fetchUserVehicles(userId);
for (const v of vehicles) {
  v.car = await fetchCar(v.car_id);  // N+1!
}
```

---

## DELIVERABLES

### 1. Violation Report

| Severity | Category | File:Line | Issue | Fix |
|----------|----------|-----------|-------|-----|
| Critical | car_slug query | | | |
| Critical | N+1 pattern | | | |
| High | select('*') | | | |
| Medium | Missing error handling | | | |

### 2. Summary Statistics

- car_slug query violations: X
- select('*') instances: X
- Potential N+1 patterns: X
- Missing error handling: X
- Direct Supabase in components: X

### 3. Query Optimization Opportunities

| Location | Current | Recommended | Impact |
|----------|---------|-------------|--------|
| | | | Latency/Load |

---

## VERIFICATION

- [ ] Zero `.eq('car_slug', ...)` in production queries
- [ ] All API routes with slug param use `resolveCarId()`
- [ ] No `select('*')` in production code (exceptions documented)
- [ ] No N+1 query patterns
- [ ] All queries have error handling
- [ ] Client components use providers, not direct Supabase

---

## SUCCESS CRITERIA

| # | Criterion |
|---|-----------|
| 1 | Zero car_slug queries (all use car_id after resolution) |
| 2 | All queries select specific fields |
| 3 | No N+1 patterns (loops with queries) |
| 4 | RPCs used where available |
| 5 | All queries have error handling |
| 6 | Providers used in client components |
| 7 | Data integrity verified (no orphaned records) |

---

## OUTPUT FORMAT

```
🗄️ DATABASE AUDIT RESULTS

**Summary:**
- car_slug violations: X
- select('*') instances: X
- N+1 patterns: X
- Missing error handling: X

**Critical (Fix Immediately):**
1. [file:line] `.eq('car_slug', ...)` → Use resolveCarId() first
...

**Query Optimization:**
1. [file:line] [current pattern] → [optimized pattern]
...

**N+1 Patterns:**
1. [file:line] [loop with query] → [join or batch]
...

**Patterns for Page Audits:**
- Verify car_id resolution in data fetching
- Check for N+1 in list rendering
- Ensure providers used in client components
...
```

---

## AUDIT EXECUTION LOG

| Date | Auditor | car_slug Violations | N+1 Patterns | Notes |
|------|---------|---------------------|--------------|-------|
| | | | | |

---

*Audit prompt generated: January 25, 2026*  
*Part of AutoRev Systematic Audit Suite (36 total audits)*
