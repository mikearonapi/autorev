# PAGE AUDIT: /data - Virtual Dyno

> **Audit ID:** Page-21  
> **Category:** Data Page  
> **Priority:** 20 of 36  
> **Route:** `/data`  
> **Auth Required:** Yes  
> **Layout:** Shared with `/data/track`

---

## PAGE OVERVIEW

The Virtual Dyno page displays **estimated HP/TQ curves** for the user's vehicle based on their modifications. It visualizes power delivery across the RPM range.

**Key Features:**
- HP/TQ curve visualization (chart)
- Stock vs Modified comparison
- Peak HP/TQ readings
- RPM range display
- Interactive chart (hover for values)
- Export/share functionality

---

## FILES TO EXAMINE

### Page Files

| File | Purpose |
|------|---------|
| `app/(app)/data/page.jsx` | Main dyno page |
| `app/(app)/data/page.module.css` | Page styles |
| `app/(app)/data/layout.jsx` | Shared data layout |
| `app/(app)/data/layout.module.css` | Layout styles |
| `app/(app)/data/DataNav.jsx` | Sub-navigation |
| `app/(app)/data/DataNav.module.css` | Nav styles |
| `app/(app)/data/DataHeader.jsx` | Page header |
| `app/(app)/data/DataHeader.module.css` | Header styles |

### Related Components

| File | Purpose |
|------|---------|
| `components/VirtualDynoChart.jsx` | Main dyno chart |
| `components/VirtualDynoChart.module.css` | Chart styles |
| `components/DynoLogModal.jsx` | Dyno log entry |
| `components/DynoLogModal.module.css` | Modal styles |

### Related Services

| File | Purpose |
|------|---------|
| `lib/performanceCalculator/` | Power calculations |
| `lib/performanceCalculator/dynoSimulator.js` | Curve generation |
| `hooks/useCarData.js` | Car data |

---

## CRITICAL: Read These First

Before making ANY changes:

1. `docs/SOURCE_OF_TRUTH.md` - Performance Calculations, Virtual Dyno
2. `docs/BRAND_GUIDELINES.md` - Data visualization colors
3. Cross-cutting audit findings:
   - D (UI/UX) - Stock=Blue, Modified=Teal
   - A (Performance) - Chart rendering
   - E (Accessibility) - Chart alternatives

---

## IMPORTANT: INVESTIGATE BEFORE FIX

Before changing ANY code:

1. ✅ Verify chart renders correctly
2. ✅ Test with various vehicle/mod combinations
3. ✅ Check peak values match expectations
4. ❌ Do NOT change calculation algorithms without understanding
5. ❓ If curves look wrong, check dynoSimulator.js

---

## CHECKLIST

### A. Functionality

- [ ] Chart loads for selected vehicle
- [ ] Stock curve displays correctly
- [ ] Modified curve displays (if mods installed)
- [ ] Peak HP value shown
- [ ] Peak TQ value shown
- [ ] Interactive hover shows values
- [ ] Curves smooth (no jagged lines)

### B. Data Flow

- [ ] Uses `useSelectedCar()` for vehicle context
- [ ] Uses `useSavedBuilds()` or similar for mods
- [ ] All calculations from `performanceCalculator`
- [ ] Uses `dynoSimulator` for curve generation
- [ ] No inline/duplicate calculations

### C. Chart Color System - CRITICAL

| Element | Color | CSS Variable |
|---------|-------|--------------|
| Stock HP curve | Blue | `--color-accent-blue` |
| Stock TQ curve | Blue (lighter/dashed) | `--color-accent-blue` |
| Modified HP curve | Teal | `--color-accent-teal` |
| Modified TQ curve | Teal (lighter/dashed) | `--color-accent-teal` |
| Grid lines | Subtle gray | `rgba(255,255,255,0.08)` |
| Axis text | Muted | `--color-text-muted` |

- [ ] Stock curves in BLUE
- [ ] Modified curves in TEAL
- [ ] No hardcoded hex colors
- [ ] Legend matches curve colors

### D. Chart Layout

```
┌─────────────────────────────────────────────┐
│  Virtual Dyno                               │
│  2024 BMW M3                                │
├─────────────────────────────────────────────┤
│                                             │
│  HP │    ___---===                          │
│     │  _/         \                         │
│  400│ /            \      Peak: 543 HP      │
│     │/              \            @ 6,800 RPM│
│  200│                                       │
│     │                                       │
│    0├────┬────┬────┬────┬────┬────┬────┬────│
│     0   1k   2k   3k   4k   5k   6k   7k RPM│
│                                             │
│  [─ Stock] [─ Modified]                     │
└─────────────────────────────────────────────┘
```

- [ ] Y-axis shows HP/TQ values
- [ ] X-axis shows RPM
- [ ] Peak values displayed
- [ ] Peak RPM displayed
- [ ] Legend visible
- [ ] Responsive sizing

### E. Peak Values Display

- [ ] Peak HP with "HP" unit
- [ ] Peak TQ with "lb-ft" unit  
- [ ] Peak RPM with comma formatting
- [ ] Monospace font for numbers
- [ ] Gain shown if modified (+XX HP)

### F. Interactive Features

- [ ] Hover/touch shows value at RPM
- [ ] Tooltip follows cursor
- [ ] Values formatted correctly
- [ ] Works on touch devices
- [ ] Reduced motion respected

### G. Dyno Log Modal

- [ ] Can log actual dyno results
- [ ] Date picker works
- [ ] HP/TQ inputs validate
- [ ] Notes field available
- [ ] Saves to database

### H. Loading States

- [ ] Skeleton for chart area
- [ ] Skeleton for peak values
- [ ] No layout shift

### I. Empty/Error States

- [ ] No vehicle selected
- [ ] No mods (shows stock only)
- [ ] Calculation error handling
- [ ] Helpful messages

### J. Accessibility

- [ ] Chart has text alternative
- [ ] Values readable without chart
- [ ] Screen reader announces peaks
- [ ] Keyboard navigation for tooltip

### K. Mobile Responsiveness

- [ ] Chart scales to screen
- [ ] Touch interaction works
- [ ] Legend doesn't overflow
- [ ] Values readable on small screens

---

## SPECIFIC CHECKS

### Dyno Simulator Usage

```javascript
// Curve generation should use dynoSimulator
import { generateDynoCurve } from '@/lib/performanceCalculator/dynoSimulator';

const stockCurve = generateDynoCurve(car, []);
const modifiedCurve = generateDynoCurve(car, installedMods);
```

### Chart Configuration

```javascript
// Chart colors must use CSS variables
const chartConfig = {
  stockHp: {
    color: 'var(--color-accent-blue)',
    label: 'Stock HP',
  },
  stockTq: {
    color: 'var(--color-accent-blue)',
    opacity: 0.6,
    dashed: true,
    label: 'Stock TQ',
  },
  modifiedHp: {
    color: 'var(--color-accent-teal)',
    label: 'Modified HP',
  },
  modifiedTq: {
    color: 'var(--color-accent-teal)',
    opacity: 0.6,
    dashed: true,
    label: 'Modified TQ',
  },
};
```

### Peak Value Formatting

```javascript
// Numbers should be formatted consistently
const formatPower = (hp) => `${hp.toLocaleString()} HP`;
const formatTorque = (tq) => `${tq.toLocaleString()} lb-ft`;
const formatRpm = (rpm) => `${rpm.toLocaleString()} RPM`;
```

---

## TESTING SCENARIOS

### Test Case 1: Stock Vehicle

1. Select vehicle with no mods
2. Navigate to /data
3. **Expected:** Single curve (stock) in blue
4. **Verify:** Peak values match car specs

### Test Case 2: Modified Vehicle

1. Select vehicle with mods installed
2. Navigate to /data
3. **Expected:** Two curves (stock blue, modified teal)
4. **Verify:** Modified peak higher than stock

### Test Case 3: Chart Interaction

1. Hover over chart at various RPM points
2. **Expected:** Tooltip shows HP/TQ at that RPM
3. **Verify:** Values smooth, no jumps

### Test Case 4: Mobile View

1. View /data on mobile device
2. **Expected:** Chart scales, touch works
3. **Verify:** Legend visible, values readable

### Test Case 5: No Vehicle

1. Navigate to /data without vehicle selected
2. **Expected:** Message to select vehicle
3. **Verify:** Link to garage

### Test Case 6: Color Verification

1. Inspect chart in DevTools
2. **Expected:** Blue for stock, teal for modified
3. **Verify:** CSS variables used, no hex codes

---

## AUTOMATED CHECKS

```bash
# 1. Check for hardcoded colors in chart
grep -rn "#[0-9a-fA-F]\{3,6\}" app/\(app\)/data/*.jsx components/VirtualDynoChart*.jsx

# 2. Check for color token usage
grep -rn "accent-blue\|accent-teal" app/\(app\)/data/*.jsx components/VirtualDynoChart*.jsx

# 3. Check for performanceCalculator usage
grep -rn "performanceCalculator\|dynoSimulator" app/\(app\)/data/*.jsx

# 4. Check for monospace font on numbers
grep -rn "font-mono\|monospace" app/\(app\)/data/*.jsx app/\(app\)/data/*.css

# 5. Check for reduced motion support
grep -rn "prefers-reduced-motion" components/VirtualDynoChart*.jsx components/VirtualDynoChart*.css

# 6. Check for console.log
grep -rn "console\.log" app/\(app\)/data/*.jsx components/VirtualDynoChart*.jsx
```

---

## CROSS-REFERENCE WITH FOUNDATION AUDITS

| Audit | Check On This Page |
|-------|-------------------|
| D. UI/UX | Stock=blue, Modified=teal (CRITICAL) |
| A. Performance | Chart rendering, no jank |
| E. Accessibility | Chart text alternatives |
| I. State | Car/mod data loading |

---

## DELIVERABLES

### 1. Functionality Report

| Feature | Works | Issues |
|---------|-------|--------|
| Chart renders | ✅/❌ | |
| Stock curve | ✅/❌ | |
| Modified curve | ✅/❌ | |
| Peak values | ✅/❌ | |
| Interactive hover | ✅/❌ | |

### 2. Color Compliance Report

| Element | Expected | Actual | Status |
|---------|----------|--------|--------|
| Stock HP | Blue | | ✅/❌ |
| Stock TQ | Blue | | ✅/❌ |
| Modified HP | Teal | | ✅/❌ |
| Modified TQ | Teal | | ✅/❌ |
| Legend | Matches | | ✅/❌ |

### 3. Issues Found

| Severity | Issue | File:Line | Fix |
|----------|-------|-----------|-----|
| | | | |

---

## VERIFICATION

- [ ] Chart uses CSS variables for colors
- [ ] Stock curves blue, modified teal
- [ ] Peak values formatted correctly
- [ ] Interactive features work
- [ ] Mobile responsive
- [ ] Accessibility alternatives exist

---

## SUCCESS CRITERIA

| # | Criterion |
|---|-----------|
| 1 | Chart renders HP/TQ curves |
| 2 | Stock = blue, Modified = teal |
| 3 | Peak values display with units |
| 4 | Interactive hover works |
| 5 | Mobile responsive |
| 6 | Uses performanceCalculator |
| 7 | No critical/high issues remaining |

---

## OUTPUT FORMAT

```
📈 PAGE AUDIT: /data (Virtual Dyno)

**Status:** ✅ Pass / ⚠️ Issues / ❌ Fail

**Color Compliance:** ✅ / ❌
- Stock curves: Blue ✅
- Modified curves: Teal ✅
- Legend: Matches ✅

**Functionality:**
- [x] Chart renders
- [x] Stock curve
- [x] Modified curve
- [ ] Hover tooltip missing (issue #1)

**Issues Found:**
1. [Medium] No hover tooltip on mobile
2. [Low] Peak RPM missing comma
...

**Test Results:**
- Stock vehicle: ✅
- Modified: ✅
- Interaction: ⚠️
- Mobile: ✅
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
