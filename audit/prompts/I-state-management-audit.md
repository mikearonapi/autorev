# AUDIT: State Management - Codebase-Wide

> **Audit ID:** I  
> **Category:** Cross-Cutting (Foundation)  
> **Priority:** 5 of 36  
> **Dependencies:** C (Database) - understands data flow from DB  
> **Downstream Impact:** All page audits will check proper provider usage

---

## CONTEXT

This audit ensures state management is consistent, efficient, and follows AutoRev's provider patterns. Poor state management causes stale data, unnecessary re-renders, race conditions, and confusing data flow.

**Key Focus Areas:**
- Provider hierarchy and responsibility
- React Query patterns
- Context optimization
- Local vs server state separation
- Optimistic updates

---

## CRITICAL: Read These First

Before making ANY changes, read these documents completely:

1. `docs/SOURCE_OF_TRUTH.md` - State Management section, Provider Responsibility Matrix
2. `components/providers/` - Examine each provider's purpose
3. `lib/queryKeys.js` - Query key patterns for React Query

---

## IMPORTANT: INVESTIGATE BEFORE FIX

Before changing ANY code:

1. ✅ Map the current data flow before suggesting changes
2. ✅ Verify providers are actually causing issues (not just different from preference)
3. ✅ Check if "duplicate state" might be intentional (local cache, optimistic UI)
4. ❌ Do NOT consolidate providers without understanding all consumers
5. ❓ If state seems duplicated, trace both sources to understand why

---

## PROVIDER HIERARCHY

The correct provider nesting order (from `app/layout.jsx`):

```jsx
<ThemeProvider>
  <AuthProvider>           {/* Must be high - many things need user */}
    <PostHogProvider>      {/* Needs user for identification */}
      <OwnedVehiclesProvider>  {/* Needs auth */}
        <FavoritesProvider>     {/* Needs auth */}
          <SavedBuildsProvider>   {/* Needs auth + vehicles */}
            <SelectedCarProvider>   {/* Needs vehicles */}
              {children}
            </SelectedCarProvider>
          </SavedBuildsProvider>
        </FavoritesProvider>
      </OwnedVehiclesProvider>
    </PostHogProvider>
  </AuthProvider>
</ThemeProvider>
```

---

## PROVIDER RESPONSIBILITY MATRIX

| Provider | Owns | Does NOT Own |
|----------|------|--------------|
| `AuthProvider` | User session, auth state | User preferences, profile data |
| `OwnedVehiclesProvider` | User's vehicles list | Vehicle details, car specs |
| `FavoritesProvider` | Saved/bookmarked cars | Car data itself |
| `SavedBuildsProvider` | User's build configurations | Part details, pricing |
| `SelectedCarProvider` | Currently selected car context | Car data fetching |
| `ThemeProvider` | Dark/light mode | Any other UI state |

---

## CHECKLIST

### A. Provider Usage (CRITICAL)

- [ ] Components use providers, not direct data fetching for user state
- [ ] `useAuth()` used for user/session, not direct Supabase auth
- [ ] `useOwnedVehicles()` used for user's vehicles
- [ ] `useFavorites()` used for saved cars
- [ ] `useSavedBuilds()` used for build configurations
- [ ] `useSelectedCar()` used for current car context
- [ ] No duplicate providers (same data from multiple sources)

### B. Provider Hierarchy

- [ ] Providers nested in correct order per layout.jsx
- [ ] No circular dependencies between providers
- [ ] Child providers don't depend on sibling providers
- [ ] Providers that need auth are inside AuthProvider

### C. React Query Patterns

- [ ] Consistent query key structure (`lib/queryKeys.js` used)
- [ ] Proper staleTime/cacheTime configuration
- [ ] Mutations invalidate correct queries
- [ ] No duplicate queries for same data
- [ ] Prefetching used for predictable navigation
- [ ] Error boundaries handle query errors

### D. Local vs Server State

- [ ] Form state is local (useState), not in providers
- [ ] UI state (modals, tabs) is local, not in context
- [ ] Server data uses React Query or providers
- [ ] No server data stored in useState (goes stale)
- [ ] Derived state uses useMemo, not separate state

### E. Context Optimization

- [ ] Large contexts split by update frequency
- [ ] Context values memoized to prevent re-renders
- [ ] Selectors used where available (avoid full context consumption)
- [ ] No unnecessary context re-renders on unrelated updates

### F. Optimistic Updates

- [ ] Favorites toggle is optimistic (instant UI feedback)
- [ ] Build saves are optimistic where appropriate
- [ ] Optimistic updates have rollback on error
- [ ] Loading states shown for non-optimistic operations

### G. State Synchronization

- [ ] No stale data after mutations
- [ ] Real-time subscriptions properly cleaned up
- [ ] Tab/window focus triggers refetch where needed
- [ ] Offline state handled gracefully

### H. Memory Leaks

- [ ] Subscriptions unsubscribed on unmount
- [ ] Intervals/timeouts cleared on unmount
- [ ] Event listeners removed on unmount
- [ ] No state updates after unmount

---

## KEY FILES TO EXAMINE

### Providers

| File | Check For |
|------|-----------|
| `components/providers/AuthProvider.jsx` | Session handling, auth state |
| `components/providers/OwnedVehiclesProvider.jsx` | Vehicle list management |
| `components/providers/FavoritesProvider.jsx` | Optimistic updates, sync |
| `components/providers/SavedBuildsProvider.jsx` | Build state management |
| `components/providers/SelectedCarProvider.jsx` | Car selection context |
| `app/layout.jsx` | Provider hierarchy order |

### Query Configuration

| File | Check For |
|------|-----------|
| `lib/queryKeys.js` | Key structure, consistency |
| `app/providers.jsx` | QueryClient configuration |

### High-State Components

| File | Check For |
|------|-----------|
| `app/(app)/garage/page.jsx` | Vehicle selection state |
| `app/(app)/garage/my-build/page.jsx` | Build configuration state |
| `components/VirtualDynoChart.jsx` | Chart data state |
| `app/(app)/al/ALPageClient.jsx` | Conversation state |

### Custom Hooks

| File | Check For |
|------|-----------|
| `hooks/useCarData.js` | Data fetching patterns |
| `hooks/useUserData.js` | User data management |
| `hooks/useSubscription.js` | Subscription state |

---

## AUTOMATED CHECKS

Run these commands and document results:

```bash
# 1. Find components directly calling Supabase (should use providers)
grep -rn "createClient\|supabase\." --include="*.jsx" components/ | grep -v Provider

# 2. Find useState with server data names (potential staleness)
grep -rn "useState.*vehicles\|useState.*cars\|useState.*user\|useState.*builds" --include="*.jsx" app/ components/

# 3. Find missing cleanup in useEffect
grep -rn "useEffect" --include="*.jsx" -A10 app/ components/ | grep -B5 "subscribe\|setInterval\|addEventListener" | grep -v "return\|cleanup\|unsubscribe\|clearInterval\|removeEventListener"

# 4. Find potential duplicate queries
grep -rn "useQuery\|useMutation" --include="*.jsx" --include="*.js" app/ components/ hooks/ | cut -d: -f1 | sort | uniq -c | sort -rn | head -20

# 5. Find context without memoization
grep -rn "value={{" --include="*.jsx" components/providers/

# 6. Find direct useContext (should use custom hooks)
grep -rn "useContext" --include="*.jsx" app/ components/ | grep -v "providers\|Provider"

# 7. Find potential memory leaks (state updates without cleanup)
grep -rn "setTimeout\|setInterval" --include="*.jsx" -A5 app/ components/ | grep -v "clearTimeout\|clearInterval"
```

### React DevTools Analysis

1. **Components tab**: Check for unnecessary re-renders
2. **Profiler tab**: Record and analyze render cascades
3. **Context inspection**: Verify provider values

---

## SOURCE OF TRUTH PATTERNS

From `docs/SOURCE_OF_TRUTH.md`:

```jsx
// ✅ CORRECT: Use provider hooks
function GarageOverview() {
  const { vehicles, isLoading } = useOwnedVehicles();
  const { selectedCar } = useSelectedCar();
  
  if (isLoading) return <GarageSkeleton />;
  
  return <VehicleList vehicles={vehicles} selected={selectedCar} />;
}

// ❌ WRONG: Direct fetching bypasses cache and auth
function GarageOverview() {
  const [vehicles, setVehicles] = useState([]);
  
  useEffect(() => {
    supabase.from('user_vehicles').select('*').then(({ data }) => {
      setVehicles(data);  // Stale! No sync with provider
    });
  }, []);
  
  return <VehicleList vehicles={vehicles} />;
}
```

```jsx
// ✅ CORRECT: Memoized context value
function MyProvider({ children }) {
  const [state, setState] = useState(initialState);
  
  const value = useMemo(() => ({
    state,
    actions: {
      updateState: (newState) => setState(newState),
    },
  }), [state]);
  
  return <MyContext.Provider value={value}>{children}</MyContext.Provider>;
}

// ❌ WRONG: New object on every render
function MyProvider({ children }) {
  const [state, setState] = useState(initialState);
  
  return (
    <MyContext.Provider value={{ state, setState }}>  {/* Re-renders all consumers! */}
      {children}
    </MyContext.Provider>
  );
}
```

```jsx
// ✅ CORRECT: Local state for UI, provider for server data
function BuildEditor() {
  // UI state - local
  const [activeTab, setActiveTab] = useState('upgrades');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Server state - from provider
  const { currentBuild, updateBuild } = useSavedBuilds();
  
  // Derived state - memoized
  const totalHpGain = useMemo(() => 
    calculateTotalGain(currentBuild.modifications),
    [currentBuild.modifications]
  );
  
  return (...);
}

// ❌ WRONG: Server data in local state
function BuildEditor() {
  const [build, setBuild] = useState(null);  // Will go stale!
  
  useEffect(() => {
    fetchBuild(id).then(setBuild);
  }, [id]);
}
```

---

## DELIVERABLES

### 1. Provider Map

Create a visual map of:
- Provider hierarchy (actual vs expected)
- Data flow between providers
- Consumer components for each provider

### 2. Violation Report

| Category | File:Line | Issue | Fix |
|----------|-----------|-------|-----|
| Direct fetch | | | Use provider |
| Stale state | | | Use React Query |
| Missing cleanup | | | Add return cleanup |
| Missing memo | | | Memoize context value |

### 3. Summary Statistics

- Components bypassing providers: X
- useState with server data: X
- Missing useEffect cleanup: X
- Unmemoized context values: X
- Duplicate queries: X

---

## VERIFICATION

- [ ] All user state accessed through providers
- [ ] Provider hierarchy matches documented order
- [ ] No useState holding server data
- [ ] All subscriptions/intervals cleaned up
- [ ] Context values memoized
- [ ] No duplicate React Query keys
- [ ] Optimistic updates work correctly

---

## SUCCESS CRITERIA

| # | Criterion |
|---|-----------|
| 1 | All user/session data via AuthProvider |
| 2 | All vehicle data via OwnedVehiclesProvider |
| 3 | All favorites via FavoritesProvider |
| 4 | Provider hierarchy correct in layout.jsx |
| 5 | No server data in useState |
| 6 | All effects have proper cleanup |
| 7 | Context values memoized |
| 8 | Query keys follow lib/queryKeys.js pattern |

---

## OUTPUT FORMAT

```
🔄 STATE MANAGEMENT AUDIT RESULTS

**Provider Hierarchy:** ✅ Correct / ❌ Issues Found

**Summary:**
- Provider bypass violations: X
- Stale state (useState server data): X
- Missing cleanup: X
- Unmemoized contexts: X

**Critical (Fix Immediately):**
1. [file:line] [issue] → [fix]
...

**Provider Violations:**
1. [file:line] Direct Supabase call → Use useOwnedVehicles()
...

**Memory Leak Risks:**
1. [file:line] [subscription without cleanup]
...

**Patterns for Page Audits:**
- Check data fetching uses providers
- Verify no useState for server data
- Look for missing effect cleanup
...
```

---

## AUDIT EXECUTION LOG

| Date | Auditor | Provider Issues | Memory Leaks | Notes |
|------|---------|-----------------|--------------|-------|
| 2026-01-25 | AI Assistant | 7 unmemoized → Fixed | 0 | All context values now use useMemo. Query keys consolidated. |

---

## FIXES APPLIED (2026-01-25)

### 1. Context Value Memoization (7 providers)
Added `useMemo` to context values in:
- `OwnedVehiclesProvider.jsx`
- `FavoritesProvider.jsx`
- `SavedBuildsProvider.jsx`
- `CarSelectionProvider.jsx`
- `CompareProvider.jsx`
- `LoadingProgressProvider.jsx`
- `PointsNotificationProvider.jsx`

### 2. Query Key Consolidation
- Extended `lib/queryKeys.js` with all car-specific keys (efficiency, safety, priceByYear, etc.)
- Updated `hooks/useCarData.js` to import from centralized `lib/queryKeys.js`
- Added backwards-compatible aliases for existing consumers

### Full Report
See: `audit/reports/I-state-management-audit-report.md`

---

*Audit prompt generated: January 25, 2026*  
*Part of AutoRev Systematic Audit Suite (36 total audits)*
