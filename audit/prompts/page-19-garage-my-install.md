# PAGE AUDIT: /garage/my-install - Installation Tracking

> **Audit ID:** Page-19  
> **Category:** Core App Page (Garage Sub-Page)  
> **Priority:** 18 of 36  
> **Route:** `/garage/my-install`  
> **Auth Required:** Yes  
> **Parent:** `/garage`

---

## PAGE OVERVIEW

The My Install page tracks **modification installation progress**. Users can mark mods as installed, track installation dates, add notes, and manage their build journey.

**Key Features:**
- Installation status tracking (planned → in-progress → installed)
- Installation date logging
- Notes/photos per installation
- Progress visualization
- DIY vs shop tracking

---

## FILES TO EXAMINE

### Page Files

| File | Purpose |
|------|---------|
| `app/(app)/garage/my-install/page.jsx` | Main page component |
| `app/(app)/garage/my-install/page.module.css` | Page styles |

### Related Components

| File | Purpose |
|------|---------|
| `components/InstallationCard.jsx` | Individual install item |
| `components/InstallProgressBar.jsx` | Progress visualization |
| `components/InstallDatePicker.jsx` | Date selection |
| `components/InstallNotes.jsx` | Notes/comments |

### Related Services

| File | Purpose |
|------|---------|
| `lib/userDataService.js` | User modifications data |
| `app/api/user-modifications/` | Modifications API |
| `hooks/useOwnedVehicles.js` | Vehicle mods context |

---

## CRITICAL: Read These First

Before making ANY changes:

1. `docs/SOURCE_OF_TRUTH.md` - User Modifications section
2. `docs/BRAND_GUIDELINES.md` - Progress indicators, status colors
3. Cross-cutting audit findings:
   - D (UI/UX) - Progress patterns
   - I (State) - Modification state management

---

## IMPORTANT: INVESTIGATE BEFORE FIX

Before changing ANY code:

1. ✅ Verify installations save correctly
2. ✅ Test status transitions
3. ✅ Check date picker functionality
4. ❌ Do NOT change data schema without understanding
5. ❓ If status doesn't persist, check userDataService

---

## CHECKLIST

### A. Functionality

- [ ] Page loads with vehicle's modifications
- [ ] Can change installation status
- [ ] Status persists after refresh
- [ ] Can set installation date
- [ ] Can add installation notes
- [ ] Can mark DIY vs professional install
- [ ] Progress percentage calculates correctly

### B. Data Flow

- [ ] Uses `useSelectedCar()` for vehicle context
- [ ] Uses `useOwnedVehicles()` for modifications
- [ ] Mutations update Supabase correctly
- [ ] Optimistic updates for status changes
- [ ] No stale data after updates

### C. Installation Status Flow

```
[Planned] → [In Progress] → [Installed]
   ⬜          🔶              ✅
  gray       amber           teal
```

- [ ] Status colors correct (gray → amber → teal)
- [ ] Status transitions logical
- [ ] Can move backwards if needed
- [ ] Status icons/badges clear

### D. UI/UX Design System

- [ ] **Planned** = Gray/muted
- [ ] **In Progress** = Amber (work in progress)
- [ ] **Installed** = Teal (success/complete)
- [ ] **CTAs** = Lime
- [ ] No hardcoded colors
- [ ] 44px touch targets

### E. Progress Visualization

- [ ] Progress bar shows % complete
- [ ] Progress bar in teal
- [ ] Count shows "X of Y installed"
- [ ] Updates in real-time on status change

### F. Installation Cards

```
┌─────────────────────────────────────┐
│  [Mod Icon]  Mod Name               │
│              Category               │
│                                     │
│  Status: [In Progress ▼]           │
│  Installed: [Pick Date]            │
│  Type: [DIY ○] [Shop ○]            │
│                                     │
│  Notes: [Add notes...]              │
│                                     │
│  [Mark Installed]                   │
└─────────────────────────────────────┘
```

- [ ] Consistent card layout
- [ ] Status dropdown accessible
- [ ] Date picker works
- [ ] DIY/Shop toggle clear
- [ ] Notes expandable

### G. Date Picker

- [ ] Opens correctly
- [ ] Can select past dates
- [ ] Today highlighted
- [ ] Mobile-friendly
- [ ] Clears properly

### H. Loading States

- [ ] Skeleton for mod list
- [ ] Loading indicator for status changes
- [ ] No layout shift

### I. Empty States

- [ ] No mods configured (link to my-build)
- [ ] All mods installed (celebration?)
- [ ] No vehicle selected

### J. Error States

- [ ] Save failure message
- [ ] Network error handling
- [ ] Retry mechanism

### K. Accessibility

- [ ] Status dropdown keyboard accessible
- [ ] Date picker accessible
- [ ] Status announced to screen readers
- [ ] Focus management

### L. Mobile Responsiveness

- [ ] Cards stack nicely
- [ ] Date picker mobile-friendly
- [ ] Dropdowns work on touch
- [ ] 44px targets

---

## SPECIFIC CHECKS

### Status Color Mapping

```javascript
// Status colors must match design system
const statusStyles = {
  planned: {
    bg: 'var(--color-bg-secondary)',
    text: 'var(--color-text-muted)',
    icon: '⬜'
  },
  in_progress: {
    bg: 'var(--color-accent-amber-bg)',
    text: 'var(--color-accent-amber)',
    icon: '🔶'
  },
  installed: {
    bg: 'var(--color-accent-teal-bg)',
    text: 'var(--color-accent-teal)',
    icon: '✅'
  }
};
```

### Progress Calculation

```javascript
// Progress should be calculated from actual data
const calculateProgress = (mods) => {
  if (!mods?.length) return 0;
  const installed = mods.filter(m => m.install_status === 'installed').length;
  return Math.round((installed / mods.length) * 100);
};
```

### Installation Update Mutation

```javascript
// Updates should use proper mutation pattern
const updateInstallStatus = useMutation({
  mutationFn: async ({ modId, status, installDate }) => {
    return await updateUserModification(modId, { 
      install_status: status,
      install_date: installDate 
    });
  },
  onMutate: async (variables) => {
    // Optimistic update
  },
  onSuccess: () => {
    queryClient.invalidateQueries(['owned-vehicles']);
  },
});
```

---

## TESTING SCENARIOS

### Test Case 1: View Installation List

1. Select vehicle with configured mods
2. Navigate to /garage/my-install
3. **Expected:** List of mods with install status
4. **Verify:** All configured mods displayed

### Test Case 2: Change Status

1. Change a mod from "Planned" to "In Progress"
2. **Expected:** Status updates, color changes to amber
3. **Verify:** Persists on refresh

### Test Case 3: Mark Installed

1. Mark a mod as "Installed"
2. Set installation date
3. **Expected:** Status teal, date saved
4. **Verify:** Progress percentage updates

### Test Case 4: Progress Bar

1. With 3 mods: 1 installed, 2 planned
2. **Expected:** Progress shows ~33%
3. **Verify:** Bar fills appropriately

### Test Case 5: Empty State

1. Vehicle with no mods configured
2. **Expected:** Message + link to my-build
3. **Verify:** Helpful guidance

### Test Case 6: Add Notes

1. Add installation notes to a mod
2. **Expected:** Notes save and display
3. **Verify:** Persists on refresh

---

## AUTOMATED CHECKS

```bash
# 1. Check for hardcoded colors
grep -rn "#[0-9a-fA-F]\{3,6\}" app/\(app\)/garage/my-install/*.jsx app/\(app\)/garage/my-install/*.css

# 2. Check for status color tokens
grep -rn "accent-amber\|accent-teal" app/\(app\)/garage/my-install/*.jsx

# 3. Check for proper state management
grep -rn "useMutation\|useQuery" app/\(app\)/garage/my-install/*.jsx

# 4. Check for optimistic updates
grep -rn "onMutate\|optimistic" app/\(app\)/garage/my-install/*.jsx

# 5. Check for date handling
grep -rn "Date\|date\|DatePicker" app/\(app\)/garage/my-install/*.jsx

# 6. Check for console.log
grep -rn "console\.log" app/\(app\)/garage/my-install/*.jsx
```

---

## CROSS-REFERENCE WITH FOUNDATION AUDITS

| Audit | Check On This Page |
|-------|-------------------|
| D. UI/UX | Status colors (amber=in-progress, teal=done) |
| E. Accessibility | Dropdown, date picker accessibility |
| I. State | Optimistic updates, mutation patterns |
| C. Database | Modification updates efficient |

---

## DELIVERABLES

### 1. Functionality Report

| Feature | Works | Issues |
|---------|-------|--------|
| View mods list | ✅/❌ | |
| Change status | ✅/❌ | |
| Set install date | ✅/❌ | |
| Add notes | ✅/❌ | |
| DIY/Shop toggle | ✅/❌ | |
| Progress bar | ✅/❌ | |

### 2. Status Color Compliance

| Status | Expected Color | Actual | Status |
|--------|----------------|--------|--------|
| Planned | Gray | | ✅/❌ |
| In Progress | Amber | | ✅/❌ |
| Installed | Teal | | ✅/❌ |

### 3. Issues Found

| Severity | Issue | File:Line | Fix |
|----------|-------|-----------|-----|
| | | | |

---

## VERIFICATION

- [ ] All statuses use correct colors
- [ ] Status changes persist
- [ ] Progress calculates correctly
- [ ] Date picker works on mobile
- [ ] Empty states helpful
- [ ] Optimistic updates smooth

---

## SUCCESS CRITERIA

| # | Criterion |
|---|-----------|
| 1 | Installation list loads correctly |
| 2 | Status colors: gray → amber → teal |
| 3 | Status changes persist to database |
| 4 | Progress bar updates in real-time |
| 5 | Date picker mobile-friendly |
| 6 | Empty state links to my-build |
| 7 | No critical/high issues remaining |

---

## OUTPUT FORMAT

```
🔧 PAGE AUDIT: /garage/my-install

**Status:** ✅ Pass / ⚠️ Issues / ❌ Fail

**Status Colors:**
- Planned: Gray ✅
- In Progress: Amber ✅
- Installed: Teal ✅

**Functionality:**
- [x] View mods list
- [x] Change status
- [ ] Date picker broken (issue #1)

**Issues Found:**
1. [High] Date picker doesn't open on mobile
2. [Medium] Progress bar not updating
...

**Test Results:**
- View list: ✅
- Status change: ✅
- Install date: ❌
- Progress: ⚠️
```

---

## AUDIT EXECUTION LOG

| Date | Auditor | Status | Issues Fixed | Notes |
|------|---------|--------|--------------|-------|
| | | | | |

---

*Audit prompt generated: January 25, 2026*  
*Part of AutoRev Systematic Audit Suite (36 total audits)*
