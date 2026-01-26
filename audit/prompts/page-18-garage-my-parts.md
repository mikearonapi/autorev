# PAGE AUDIT: /garage/my-parts - Parts Research & Wishlist

> **Audit ID:** Page-18  
> **Category:** Core App Page (Garage Sub-Page)  
> **Priority:** 17 of 36  
> **Route:** `/garage/my-parts`  
> **Auth Required:** Yes  
> **Parent:** `/garage`

---

## PAGE OVERVIEW

The My Parts page helps users **research and track parts** for their vehicle. It may include parts wishlist, parts research, pricing info, and compatibility checking.

**Key Features:**
- Parts wishlist/saved parts
- Part compatibility with selected vehicle
- Price tracking/comparison
- Part categories browsing
- Links to purchase/vendors

---

## FILES TO EXAMINE

### Page Files

| File | Purpose |
|------|---------|
| `app/(app)/garage/my-parts/page.jsx` | Main page component |
| `app/(app)/garage/my-parts/page.module.css` | Page styles |

### Related Components

| File | Purpose |
|------|---------|
| `components/PartCard.jsx` | Individual part display |
| `components/PartsList.jsx` | List of parts |
| `components/PriceDisplay.jsx` | Price formatting |
| `components/CompatibilityBadge.jsx` | Fit confirmation |

### Related Services

| File | Purpose |
|------|---------|
| `lib/partsClient.js` | Parts data service |
| `app/api/parts/` | Parts API routes |
| `hooks/useCarData.js` | Car context |

---

## CRITICAL: Read These First

Before making ANY changes:

1. `docs/SOURCE_OF_TRUTH.md` - Parts section, Tier Access
2. `docs/BRAND_GUIDELINES.md` - Card patterns, CTAs
3. Cross-cutting audit findings:
   - D (UI/UX) - Card patterns
   - H (API) - Parts API consistency

---

## IMPORTANT: INVESTIGATE BEFORE FIX

Before changing ANY code:

1. ✅ Verify parts load for selected vehicle
2. ✅ Test add/remove from wishlist
3. ✅ Check tier restrictions
4. ❌ Do NOT change pricing logic without understanding
5. ❓ If parts don't filter correctly, check compatibility logic

---

## CHECKLIST

### A. Functionality

- [ ] Page loads with selected vehicle context
- [ ] Parts display correctly
- [ ] Can add parts to wishlist
- [ ] Can remove parts from wishlist
- [ ] Parts filter by category
- [ ] Parts filter by compatibility
- [ ] Price info displays (if available)
- [ ] External links work (vendor links)

### B. Data Flow

- [ ] Uses `useSelectedCar()` for vehicle context
- [ ] Parts scoped to selected vehicle
- [ ] Wishlist persists (Supabase)
- [ ] No redundant API calls
- [ ] Proper caching with React Query

### C. UI/UX Design System

- [ ] **Lime CTAs** for add/buy actions
- [ ] **Teal accents** for compatible/recommended
- [ ] **Blue** for informational
- [ ] **Amber warnings** for compatibility issues
- [ ] No hardcoded colors
- [ ] 44px touch targets

### D. Card Pattern (Parts Cards)

```
┌─────────────────────────────────────┐
│  [Part Image]                       │
│                                     │
│  Part Name                          │
│  Category • Brand                   │
│                                     │
│  $XXX.XX              [Compatible ✓]│
│                                     │
│  [Add to Wishlist]    [View Details]│
└─────────────────────────────────────┘
```

- [ ] Consistent card layout
- [ ] Image with fallback
- [ ] Price formatted correctly
- [ ] Compatibility badge visible
- [ ] CTA buttons 44px min height

### E. Compatibility Display

| Status | Color | Display |
|--------|-------|---------|
| Compatible | Teal | "✓ Fits your [car]" |
| Unknown | Blue | "Verify fit" |
| Incompatible | Amber | "⚠ May not fit" |

- [ ] Compatibility check uses car context
- [ ] Clear visual indicators
- [ ] Doesn't just rely on color

### F. Wishlist Functionality

- [ ] Add to wishlist (lime button)
- [ ] Remove from wishlist
- [ ] Wishlist count visible
- [ ] Optimistic updates
- [ ] Persists on refresh

### G. Price Display

- [ ] Currency formatted ($X,XXX.XX)
- [ ] Monospace font for prices
- [ ] Sale/discount indication (if applicable)
- [ ] "Price varies" fallback

### H. Loading States

- [ ] Skeleton for parts grid
- [ ] Skeleton for individual cards
- [ ] No layout shift on load

### I. Empty States

- [ ] No parts found for filters
- [ ] Empty wishlist
- [ ] No vehicle selected
- [ ] Helpful guidance in each

### J. Error States

- [ ] API error graceful handling
- [ ] Network failure message
- [ ] Retry mechanism

### K. Accessibility

- [ ] Card buttons accessible
- [ ] Price read by screen reader
- [ ] Compatibility announced
- [ ] Focus visible on cards
- [ ] Keyboard navigation

### L. Mobile Responsiveness

- [ ] Cards stack/grid appropriately
- [ ] Filters accessible on mobile
- [ ] Touch targets 44px
- [ ] Horizontal scroll if needed

### M. Tier Gating

- [ ] Check `tierAccess` config
- [ ] Free tier limitations shown
- [ ] Upgrade prompts appropriate
- [ ] Premium features gated

---

## SPECIFIC CHECKS

### Parts API Integration

```javascript
// Parts should come from API
const { data: parts, isLoading } = useQuery({
  queryKey: ['parts', carId, filters],
  queryFn: () => fetchParts(carId, filters),
});

// Wishlist operations
const addToWishlist = useMutation({
  mutationFn: (partId) => addPartToWishlist(userId, partId),
  onSuccess: () => queryClient.invalidateQueries(['wishlist']),
});
```

### Price Formatting

```javascript
// Use consistent price formatting
const formatPrice = (price) => {
  if (!price) return 'Price varies';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
};
```

### Compatibility Check Pattern

```javascript
// Compatibility should check against selected car
const isCompatible = (part, car) => {
  if (!part.compatible_vehicles) return 'unknown';
  return part.compatible_vehicles.includes(car.id) 
    ? 'compatible' 
    : 'incompatible';
};
```

---

## TESTING SCENARIOS

### Test Case 1: Browse Parts

1. Select a vehicle
2. Navigate to /garage/my-parts
3. **Expected:** Parts list loads, filtered to vehicle
4. **Verify:** Parts relevant to car displayed

### Test Case 2: Add to Wishlist

1. Click "Add to Wishlist" on a part
2. **Expected:** Part added, button changes state
3. **Verify:** Wishlist count updates, persists on refresh

### Test Case 3: Filter by Category

1. Select a category filter
2. **Expected:** Only parts in category shown
3. **Verify:** Filter works, count updates

### Test Case 4: Compatibility Warning

1. View a part with unknown/incompatible status
2. **Expected:** Warning badge in amber
3. **Verify:** Not just color - has text/icon

### Test Case 5: Empty State

1. Clear all filters, no vehicle selected
2. **Expected:** Helpful empty state message
3. **Verify:** Guides user to select vehicle

### Test Case 6: No Vehicle Selected

1. Navigate without vehicle context
2. **Expected:** Prompt to select vehicle
3. **Verify:** Link to garage or vehicle selector

---

## AUTOMATED CHECKS

```bash
# 1. Check for hardcoded colors
grep -rn "#[0-9a-fA-F]\{3,6\}" app/\(app\)/garage/my-parts/*.jsx app/\(app\)/garage/my-parts/*.css

# 2. Check for design token usage
grep -rn "accent-lime\|accent-teal\|accent-amber" app/\(app\)/garage/my-parts/*.jsx

# 3. Check for proper API integration
grep -rn "useQuery\|useMutation" app/\(app\)/garage/my-parts/*.jsx

# 4. Check for price formatting
grep -rn "formatPrice\|Intl.NumberFormat\|toLocaleString" app/\(app\)/garage/my-parts/*.jsx

# 5. Check touch target sizing
grep -rn "h-11\|min-h-\[44px\]" app/\(app\)/garage/my-parts/*.jsx

# 6. Check for console.log
grep -rn "console\.log" app/\(app\)/garage/my-parts/*.jsx
```

---

## CROSS-REFERENCE WITH FOUNDATION AUDITS

| Audit | Check On This Page |
|-------|-------------------|
| D. UI/UX | Card patterns, lime CTAs |
| E. Accessibility | Button labels, color+text |
| H. API | Parts API consistency |
| I. State | Wishlist state management |
| C. Database | Parts queries efficient |

---

## DELIVERABLES

### 1. Functionality Report

| Feature | Works | Issues |
|---------|-------|--------|
| Parts list | ✅/❌ | |
| Add to wishlist | ✅/❌ | |
| Remove from wishlist | ✅/❌ | |
| Category filter | ✅/❌ | |
| Compatibility check | ✅/❌ | |
| Price display | ✅/❌ | |

### 2. UI Compliance Report

| Element | Expected | Actual | Status |
|---------|----------|--------|--------|
| Add button | Lime | | ✅/❌ |
| Compatible badge | Teal | | ✅/❌ |
| Warning badge | Amber | | ✅/❌ |
| Card touch targets | 44px | | ✅/❌ |

### 3. Issues Found

| Severity | Issue | File:Line | Fix |
|----------|-------|-----------|-----|
| | | | |

---

## VERIFICATION

- [ ] Parts load for selected vehicle
- [ ] Wishlist add/remove works
- [ ] Compatibility shown correctly
- [ ] Prices formatted with monospace
- [ ] Empty states helpful
- [ ] Mobile responsive

---

## SUCCESS CRITERIA

| # | Criterion |
|---|-----------|
| 1 | Parts display for selected vehicle |
| 2 | Wishlist functionality works |
| 3 | Compatibility badges correct (teal/amber) |
| 4 | Prices formatted correctly |
| 5 | Empty states guide user |
| 6 | 44px touch targets on all CTAs |
| 7 | No critical/high issues remaining |

---

## OUTPUT FORMAT

```
🔧 PAGE AUDIT: /garage/my-parts

**Status:** ✅ Pass / ⚠️ Issues / ❌ Fail

**Functionality:**
- [x] Parts list loads
- [x] Wishlist works
- [ ] Category filter missing (issue #1)

**UI Compliance:**
- Add button: Lime ✅
- Compatible: Teal ✅
- Warning: Amber ✅

**Issues Found:**
1. [Medium] No category filter implemented
2. [Low] Price not monospace
...

**Test Results:**
- Browse parts: ✅
- Add to wishlist: ✅
- Compatibility: ✅
- Empty state: ⚠️ (no guidance)
```

---

## AUDIT EXECUTION LOG

| Date | Auditor | Status | Issues Fixed | Notes |
|------|---------|--------|--------------|-------|
| | | | | |

---

*Audit prompt generated: January 25, 2026*  
*Part of AutoRev Systematic Audit Suite (36 total audits)*
