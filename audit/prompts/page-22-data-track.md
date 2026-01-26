# PAGE AUDIT: /data/track - Lap Time Estimator

> **Audit ID:** Page-22  
> **Category:** Data Page  
> **Priority:** 21 of 36  
> **Route:** `/data/track`  
> **Auth Required:** Yes  
> **Layout:** Shared with `/data`

---

## PAGE OVERVIEW

The Track Times page estimates **lap times** for the user's vehicle at various tracks based on performance calculations. It helps users understand how modifications might affect track performance.

**Key Features:**
- Track selection
- Lap time estimation
- Stock vs Modified comparison
- Track time logging (actual times)
- Leaderboard/comparison context

---

## FILES TO EXAMINE

### Page Files

| File | Purpose |
|------|---------|
| `app/(app)/data/track/page.jsx` | Main track page |
| `app/(app)/data/track/page.module.css` | Page styles |

### Shared Layout (from /data)

| File | Purpose |
|------|---------|
| `app/(app)/data/layout.jsx` | Shared data layout |
| `app/(app)/data/DataNav.jsx` | Sub-navigation |
| `app/(app)/data/DataHeader.jsx` | Page header |

### Related Components

| File | Purpose |
|------|---------|
| `components/TrackSelector.jsx` | Track dropdown/picker |
| `components/LapTimeCard.jsx` | Time display |
| `components/TrackTimeLogModal.jsx` | Log actual times |
| `components/TrackTimeLogModal.module.css` | Modal styles |

### Related Services

| File | Purpose |
|------|---------|
| `lib/lapTimeService.js` | Lap time calculations |
| `hooks/useLapTimeEstimate.js` | Lap time hook |
| `lib/performanceCalculator/` | Performance data |
| `tests/lapTimeService.test.js` | Service tests |

---

## CRITICAL: Read These First

Before making ANY changes:

1. `docs/SOURCE_OF_TRUTH.md` - Lap Time Estimation section
2. `docs/BRAND_GUIDELINES.md` - Time display, comparison colors
3. Cross-cutting audit findings:
   - D (UI/UX) - Stock=Blue, Modified=Teal
   - A (Performance) - Calculation efficiency
   - G (Testing) - lapTimeService tests

---

## IMPORTANT: INVESTIGATE BEFORE FIX

Before changing ANY code:

1. ✅ Verify lap times calculate correctly
2. ✅ Test track selection changes times
3. ✅ Check time logging saves properly
4. ❌ Do NOT change lap time algorithms without understanding
5. ❓ If times seem wrong, check lapTimeService.js

---

## CHECKLIST

### A. Functionality

- [ ] Page loads with selected vehicle
- [ ] Track selector works
- [ ] Estimated lap time displays
- [ ] Stock vs Modified times show
- [ ] Improvement amount calculated
- [ ] Can log actual lap times
- [ ] Logged times persist

### B. Data Flow

- [ ] Uses `useSelectedCar()` for vehicle context
- [ ] Uses `useLapTimeEstimate()` hook
- [ ] Uses `lapTimeService` for calculations
- [ ] Track list from database/config
- [ ] Logged times to Supabase

### C. Time Display - CRITICAL

| Element | Color | Format |
|---------|-------|--------|
| Stock time | Blue | `X:XX.XXX` |
| Modified time | Teal | `X:XX.XXX` |
| Improvement | Teal | `-X.XXs faster` |
| Logged times | White/primary | `X:XX.XXX` |

- [ ] Times formatted as `M:SS.mmm`
- [ ] Monospace font for times
- [ ] Stock in BLUE
- [ ] Modified in TEAL
- [ ] Improvement shows delta

### D. UI/UX Design System

- [ ] **Stock time** = Blue text
- [ ] **Modified time** = Teal text
- [ ] **Improvement badge** = Teal background
- [ ] **Log time CTA** = Lime
- [ ] **Track selector** = Standard dropdown
- [ ] No hardcoded colors
- [ ] 44px touch targets

### E. Track Selector

- [ ] Lists available tracks
- [ ] Shows track name + length
- [ ] Selection persists
- [ ] Mobile-friendly dropdown
- [ ] Search/filter (if many tracks)

### F. Lap Time Card Layout

```
┌─────────────────────────────────────┐
│  Nürburgring Nordschleife           │
│  12.93 mi                           │
├─────────────────────────────────────┤
│                                     │
│  Estimated Lap Time                 │
│                                     │
│  Stock:     8:42.350  (blue)        │
│  Modified:  8:28.120  (teal)        │
│                                     │
│  ┌─────────────────────┐            │
│  │ -14.23s faster      │ (teal)     │
│  └─────────────────────┘            │
│                                     │
│  [Log Actual Time]  (lime)          │
└─────────────────────────────────────┘
```

- [ ] Track name prominent
- [ ] Track length displayed
- [ ] Times aligned
- [ ] Improvement badge visible
- [ ] Log button accessible

### G. Time Formatting

```javascript
// Times must be formatted consistently
// Input: seconds (e.g., 522.350)
// Output: "8:42.350"

const formatLapTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3);
  return `${mins}:${secs.padStart(6, '0')}`;
};
```

- [ ] Minutes:seconds.milliseconds format
- [ ] Leading zeros on seconds
- [ ] 3 decimal places
- [ ] Monospace font

### H. Log Time Modal

- [ ] Opens on button click
- [ ] Track pre-selected
- [ ] Time input (validated)
- [ ] Date picker
- [ ] Notes field
- [ ] Conditions (weather, etc.)
- [ ] Save works
- [ ] Close button (44px)

### I. Loading States

- [ ] Skeleton for time display
- [ ] Loading indicator during calculation
- [ ] Track selector loading state

### J. Empty/Error States

- [ ] No vehicle selected
- [ ] No tracks available
- [ ] Calculation error
- [ ] Helpful messages

### K. Accessibility

- [ ] Times announced correctly
- [ ] Track selector accessible
- [ ] Modal focus management
- [ ] Improvement readable (not just color)

### L. Mobile Responsiveness

- [ ] Card adapts to width
- [ ] Track selector mobile-friendly
- [ ] Modal works on mobile
- [ ] 44px touch targets

---

## SPECIFIC CHECKS

### Lap Time Service Usage

```javascript
// All calculations MUST use lapTimeService
import { estimateLapTime } from '@/lib/lapTimeService';

// Or via hook
import { useLapTimeEstimate } from '@/hooks/useLapTimeEstimate';

const { stockTime, modifiedTime, improvement } = useLapTimeEstimate(
  car,
  track,
  modifications
);
```

### Time Comparison Pattern

```javascript
// Stock vs Modified comparison
const stockTime = estimateLapTime(car, track, []);
const modifiedTime = estimateLapTime(car, track, mods);
const improvement = stockTime - modifiedTime;

// Display
<span className={styles.stockTime}>{formatLapTime(stockTime)}</span>
<span className={styles.modifiedTime}>{formatLapTime(modifiedTime)}</span>
{improvement > 0 && (
  <span className={styles.improvement}>
    -{improvement.toFixed(2)}s faster
  </span>
)}
```

### Track Data Structure

```javascript
// Tracks should have consistent structure
const track = {
  id: 'nurburgring-nordschleife',
  name: 'Nürburgring Nordschleife',
  length_miles: 12.93,
  length_km: 20.81,
  country: 'Germany',
  // ... other properties
};
```

---

## TESTING SCENARIOS

### Test Case 1: View Estimated Time

1. Select vehicle
2. Navigate to /data/track
3. Select a track
4. **Expected:** Estimated lap time displays
5. **Verify:** Time format correct, reasonable value

### Test Case 2: Stock vs Modified

1. Vehicle with mods installed
2. Select track
3. **Expected:** Stock (blue) and Modified (teal) times
4. **Verify:** Modified faster, improvement shown

### Test Case 3: Change Track

1. Switch to different track
2. **Expected:** Times update for new track
3. **Verify:** Longer track = longer time

### Test Case 4: Log Actual Time

1. Click "Log Actual Time"
2. Enter time, date, notes
3. Save
4. **Expected:** Modal closes, time saved
5. **Verify:** Persists on refresh

### Test Case 5: No Mods

1. Vehicle with no mods
2. **Expected:** Only stock time shown
3. **Verify:** No improvement badge

### Test Case 6: Color Verification

1. Inspect times in DevTools
2. **Expected:** Stock=blue, Modified=teal
3. **Verify:** CSS variables used

---

## AUTOMATED CHECKS

```bash
# 1. Check for hardcoded colors
grep -rn "#[0-9a-fA-F]\{3,6\}" app/\(app\)/data/track/*.jsx app/\(app\)/data/track/*.css

# 2. Check for color token usage
grep -rn "accent-blue\|accent-teal" app/\(app\)/data/track/*.jsx

# 3. Check for lapTimeService usage
grep -rn "lapTimeService\|useLapTimeEstimate\|estimateLapTime" app/\(app\)/data/track/*.jsx

# 4. Check for time formatting
grep -rn "formatLapTime\|toFixed\|padStart" app/\(app\)/data/track/*.jsx

# 5. Check for monospace font
grep -rn "font-mono\|monospace" app/\(app\)/data/track/*.jsx app/\(app\)/data/track/*.css

# 6. Check for console.log
grep -rn "console\.log" app/\(app\)/data/track/*.jsx
```

---

## CROSS-REFERENCE WITH FOUNDATION AUDITS

| Audit | Check On This Page |
|-------|-------------------|
| D. UI/UX | Stock=blue, Modified=teal |
| A. Performance | Calculation efficiency |
| E. Accessibility | Time announcements |
| G. Testing | lapTimeService.test.js |

---

## DELIVERABLES

### 1. Functionality Report

| Feature | Works | Issues |
|---------|-------|--------|
| Track selector | ✅/❌ | |
| Estimated time | ✅/❌ | |
| Stock vs Modified | ✅/❌ | |
| Improvement display | ✅/❌ | |
| Log time modal | ✅/❌ | |

### 2. Time Display Compliance

| Element | Expected | Actual | Status |
|---------|----------|--------|--------|
| Stock time | Blue | | ✅/❌ |
| Modified time | Teal | | ✅/❌ |
| Improvement | Teal badge | | ✅/❌ |
| Format | M:SS.mmm | | ✅/❌ |
| Font | Monospace | | ✅/❌ |

### 3. Issues Found

| Severity | Issue | File:Line | Fix |
|----------|-------|-----------|-----|
| | | | |

---

## VERIFICATION

- [ ] lapTimeService used for calculations
- [ ] Stock=blue, Modified=teal
- [ ] Times formatted as M:SS.mmm
- [ ] Monospace font for times
- [ ] Track selector works
- [ ] Log modal saves correctly

---

## SUCCESS CRITERIA

| # | Criterion |
|---|-----------|
| 1 | Lap time estimates display |
| 2 | Stock = blue, Modified = teal |
| 3 | Times formatted M:SS.mmm |
| 4 | Improvement shows delta |
| 5 | Track selector functional |
| 6 | Log time modal works |
| 7 | No critical/high issues remaining |

---

## OUTPUT FORMAT

```
⏱️ PAGE AUDIT: /data/track (Lap Times)

**Status:** ✅ Pass / ⚠️ Issues / ❌ Fail

**Time Display Compliance:** ✅ / ❌
- Stock time: Blue ✅
- Modified time: Teal ✅
- Improvement: Teal badge ✅
- Format: M:SS.mmm ✅
- Monospace: ✅

**Functionality:**
- [x] Track selector
- [x] Estimated time
- [x] Stock vs Modified
- [ ] Log modal broken (issue #1)

**Issues Found:**
1. [High] Log modal doesn't save
2. [Low] Missing monospace on improvement
...

**Test Results:**
- Estimated time: ✅
- Track change: ✅
- Log time: ❌
- Colors: ✅
```

---

## AUDIT EXECUTION LOG

| Date | Auditor | Status | Color Compliance | Notes |
|------|---------|--------|------------------|-------|
| | | | | |

---

*Audit prompt generated: January 25, 2026*  
*Part of AutoRev Systematic Audit Suite (36 total audits)*
