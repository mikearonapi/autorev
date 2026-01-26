# PAGE AUDIT: /insights - Insights Dashboard

> **Audit ID:** Page-09  
> **Category:** Core App Page (High-Traffic)  
> **Priority:** 11 of 36 (First Page Audit)  
> **Route:** `/insights`  
> **Auth Required:** Yes

---

## PAGE OVERVIEW

The Insights page is the **main dashboard** users see after login. It provides a vehicle-centric overview with health scores, recommendations, and quick actions.

**Key Features:**
- Vehicle selector (if multiple vehicles)
- Vehicle health/overview scores
- Build progress visualization
- Personalized recommendations
- Quick action links to garage sections

---

## FILES TO EXAMINE

| File | Purpose |
|------|---------|
| `app/(app)/insights/page.jsx` | Main page component (Server) |
| `app/(app)/insights/page.module.css` | Page styles |
| `app/(app)/insights/InsightsClient.jsx` | Client-side interactivity |
| `app/(app)/insights/components/BuildProgressRings.jsx` | Progress visualization |
| `app/(app)/insights/components/BuildProgressRings.module.css` | Ring styles |

### Related Files

| File | Purpose |
|------|---------|
| `lib/insightService.js` | Data fetching for insights |
| `components/providers/OwnedVehiclesProvider.jsx` | Vehicle context |
| `hooks/useCarData.js` | Car data hook |

---

## CRITICAL: Read These First

Before making ANY changes:

1. `docs/SOURCE_OF_TRUTH.md` - Site Index, Cardinal Rules
2. Cross-cutting audit findings (if completed):
   - D (UI/UX) - Color usage, touch targets
   - E (Accessibility) - Focus states, ARIA
   - A (Performance) - Loading patterns

---

## IMPORTANT: INVESTIGATE BEFORE FIX

Before changing ANY code:

1. ✅ Load the page and verify current functionality
2. ✅ Test with 0, 1, and multiple vehicles
3. ✅ Test loading and error states
4. ❌ Do NOT change working functionality
5. ❓ If something looks wrong but works, ask first

---

## CHECKLIST

### A. Functionality

- [ ] Page loads without errors
- [ ] Vehicle selector works (if multiple vehicles)
- [ ] Correct vehicle data displayed
- [ ] Build progress rings render correctly
- [ ] Recommendations display properly
- [ ] Quick action links navigate correctly
- [ ] Empty state shows when no vehicles

### B. Data Flow

- [ ] Uses `useOwnedVehicles()` provider (not direct Supabase)
- [ ] Uses `useSelectedCar()` for current vehicle context
- [ ] Data fetching uses proper hooks/services
- [ ] No N+1 queries
- [ ] car_id used for queries (not car_slug)

### C. UI/UX Design System

- [ ] Colors follow 4-color system:
  - [ ] CTAs use lime (`--color-accent-lime`)
  - [ ] Positive metrics use teal (`--color-accent-teal`)
  - [ ] Baseline values use blue (`--color-accent-blue`)
  - [ ] Warnings use amber (sparingly)
- [ ] No hardcoded hex colors
- [ ] Typography uses design tokens
- [ ] Cards use consistent styling

### D. Loading States

- [ ] Skeleton loader shown while loading (not spinner)
- [ ] Skeleton matches content shape
- [ ] Loading state is fast (<300ms perceived)
- [ ] No layout shift when content loads

### E. Error States

- [ ] Error boundary catches failures
- [ ] User-friendly error message displayed
- [ ] Retry option available
- [ ] Errors logged with context

### F. Empty States

- [ ] Shows helpful message when no vehicles
- [ ] Includes CTA to add first vehicle
- [ ] Empty state has icon + message + action

### G. Accessibility

- [ ] All interactive elements have 44px touch targets
- [ ] Focus indicators visible (lime ring)
- [ ] Proper heading hierarchy (h1 → h2 → h3)
- [ ] ARIA labels on icon buttons
- [ ] Screen reader can navigate content

### H. Performance

- [ ] Page loads in <2.5s (LCP)
- [ ] No unnecessary re-renders
- [ ] Images optimized (if any)
- [ ] Data fetching is efficient

### I. Mobile Responsiveness

- [ ] Layout works on 320px width
- [ ] Touch targets adequate on mobile
- [ ] No horizontal scrolling
- [ ] Cards stack appropriately

### J. Code Quality

- [ ] No generic handler names (`handleClick`)
- [ ] Proper error handling in async code
- [ ] No console.log statements
- [ ] Components have single responsibility

---

## SPECIFIC CHECKS FOR INSIGHTS

### Vehicle Selector

```jsx
// Should use provider, not direct query
const { vehicles, selectedVehicle, setSelectedVehicle } = useOwnedVehicles();

// NOT this:
const [vehicles, setVehicles] = useState([]);
useEffect(() => { fetchVehicles(); }, []);
```

### Build Progress Rings

- [ ] Progress values are percentages (0-100)
- [ ] Rings animate smoothly
- [ ] Colors follow teal for progress
- [ ] Labels are accessible
- [ ] SVG has proper viewBox

### Health/Score Display

- [ ] Scores use monospace font for numbers
- [ ] Score colors indicate status (teal=good, amber=warning)
- [ ] Score calculations use `lib/scoring.js`

### Recommendations

- [ ] Personalized based on vehicle state
- [ ] Links navigate to correct garage sections
- [ ] CTA buttons use lime color

---

## TESTING SCENARIOS

### Test Case 1: New User (No Vehicles)

1. Log in as user with no vehicles
2. Navigate to /insights
3. **Expected:** Empty state with "Add your first vehicle" CTA
4. **Verify:** CTA links to correct page

### Test Case 2: Single Vehicle

1. Log in as user with one vehicle
2. Navigate to /insights
3. **Expected:** Vehicle data displayed, no selector needed
4. **Verify:** All sections populated correctly

### Test Case 3: Multiple Vehicles

1. Log in as user with 2+ vehicles
2. Navigate to /insights
3. **Expected:** Vehicle selector visible
4. **Verify:** Switching vehicles updates all data

### Test Case 4: Loading State

1. Throttle network to Slow 3G
2. Navigate to /insights
3. **Expected:** Skeleton loaders appear
4. **Verify:** No layout shift when data loads

### Test Case 5: Error State

1. Block API requests (DevTools)
2. Navigate to /insights
3. **Expected:** Error message with retry option
4. **Verify:** Retry actually retries

---

## AUTOMATED CHECKS

```bash
# 1. Check for hardcoded colors
grep -n "#[0-9a-fA-F]\{3,6\}" app/\(app\)/insights/*.jsx app/\(app\)/insights/*.css

# 2. Check for direct Supabase usage
grep -n "supabase\|createClient" app/\(app\)/insights/*.jsx

# 3. Check for generic handlers
grep -n "handleClick\|handleSubmit\|handleChange" app/\(app\)/insights/*.jsx

# 4. Check for console.log
grep -n "console\.log" app/\(app\)/insights/*.jsx

# 5. Check for proper provider usage
grep -n "useOwnedVehicles\|useSelectedCar" app/\(app\)/insights/*.jsx

# 6. Check for touch target issues
grep -n "p-1\|p-2\|h-6\|h-8\|w-6\|w-8" app/\(app\)/insights/*.jsx
```

---

## CROSS-REFERENCE WITH FOUNDATION AUDITS

Apply findings from completed cross-cutting audits:

| Audit | Check On This Page |
|-------|-------------------|
| D. UI/UX | Color usage, touch targets, card styling |
| E. Accessibility | Focus states, ARIA, heading hierarchy |
| F. Code Quality | Handler naming, error handling |
| C. Database | Provider usage, no direct queries |
| I. State Management | Proper provider consumption |
| A. Performance | Loading patterns, no waterfalls |

---

## DELIVERABLES

### 1. Functionality Report

| Feature | Works | Issues |
|---------|-------|--------|
| Page load | ✅/❌ | |
| Vehicle selector | ✅/❌ | |
| Build progress | ✅/❌ | |
| Recommendations | ✅/❌ | |
| Quick actions | ✅/❌ | |

### 2. Compliance Report

| Category | Pass | Issues |
|----------|------|--------|
| UI/UX Design System | ✅/❌ | |
| Accessibility | ✅/❌ | |
| Performance | ✅/❌ | |
| Code Quality | ✅/❌ | |

### 3. Issues Found

| Severity | Issue | File:Line | Fix |
|----------|-------|-----------|-----|
| | | | |

---

## VERIFICATION

- [ ] All functionality works as expected
- [ ] All checklist items pass
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Accessibility passes
- [ ] Performance acceptable

---

## SUCCESS CRITERIA

| # | Criterion |
|---|-----------|
| 1 | Page loads and displays vehicle data correctly |
| 2 | Loading states use skeletons (not spinners) |
| 3 | Empty state guides users to add vehicle |
| 4 | All colors use design system tokens |
| 5 | Touch targets are 44px minimum |
| 6 | Uses providers (not direct data fetching) |
| 7 | No critical/high issues remaining |

---

## OUTPUT FORMAT

```
📊 PAGE AUDIT: /insights

**Status:** ✅ Pass / ⚠️ Issues / ❌ Fail

**Functionality:**
- [x] Page loads correctly
- [x] Vehicle selector works
- [ ] Build progress needs fix (issue #1)

**Issues Found:**
1. [High] [file:line] Hardcoded color → Use var(--color-accent-teal)
2. [Medium] [file:line] Missing skeleton → Add InsightsSkeleton
...

**Recommendations:**
1. [description]
...

**Test Results:**
- New user: ✅
- Single vehicle: ✅
- Multiple vehicles: ⚠️ (selector slow)
- Error state: ✅
```

---

## AUDIT EXECUTION LOG

| Date | Auditor | Status | Issues | Notes |
|------|---------|--------|--------|-------|
| | | | | |

---

*Audit prompt generated: January 25, 2026*  
*Part of AutoRev Systematic Audit Suite (36 total audits)*
