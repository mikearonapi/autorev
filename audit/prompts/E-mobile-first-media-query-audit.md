# E. Mobile-First Media Query Audit & Fix

> **Priority:** High  
> **Impact:** Mobile UX across all pages  
> **Estimated Files:** 33 files with 41 violations  
> **Goal:** Convert all desktop-first (max-width) patterns to mobile-first (min-width)

---

## WHY THIS MATTERS

### The Problem
Desktop-first CSS (`max-width`) means:
- Mobile styles are overrides, not defaults
- More CSS to download on mobile (the primary use case)
- Harder to maintain responsive behavior
- Often leads to "desktop leaked to mobile" bugs

### The Solution
Mobile-first CSS (`min-width`) means:
- Mobile is the baseline (optimized for 60%+ of traffic)
- Progressive enhancement for larger screens
- Cleaner, more maintainable code
- Better performance on mobile devices

---

## MOBILE DEVICE REFERENCE

### iOS Devices (Viewport Widths)
| Device | Width | Common Breakpoint |
|--------|-------|-------------------|
| iPhone SE | 375px | `min-width: 375px` |
| iPhone 12/13/14 | 390px | `min-width: 390px` |
| iPhone 12/13/14 Pro Max | 428px | `min-width: 428px` |
| iPad Mini | 744px | `min-width: 744px` |
| iPad | 820px | `min-width: 768px` |
| iPad Pro 11" | 834px | `min-width: 834px` |
| iPad Pro 12.9" | 1024px | `min-width: 1024px` |

### Android Devices (Viewport Widths)
| Device | Width | Common Breakpoint |
|--------|-------|-------------------|
| Small phones | 320px | Base styles (no MQ) |
| Samsung Galaxy S21 | 360px | `min-width: 360px` |
| Google Pixel 6 | 393px | `min-width: 390px` |
| Samsung Galaxy S22 Ultra | 384px | `min-width: 384px` |
| Tablets | 600px+ | `min-width: 600px` |
| Large tablets | 800px+ | `min-width: 768px` |

### AutoRev Standard Breakpoints
Use these consistent breakpoints across the app:

```css
/* Mobile-first approach: base styles are for smallest screens */

/* Small phones → Regular phones */
@media (min-width: 375px) { /* iPhone SE and up */ }

/* Phones → Large phones */
@media (min-width: 480px) { /* Larger phones, small landscape */ }

/* Large phones → Tablets */
@media (min-width: 640px) { /* sm: Tailwind default */ }

/* Tablets → Small laptops */
@media (min-width: 768px) { /* md: Tailwind default, iPad portrait */ }

/* Small laptops → Desktops */
@media (min-width: 1024px) { /* lg: Tailwind default, iPad landscape */ }

/* Desktops → Large screens */
@media (min-width: 1280px) { /* xl: Tailwind default */ }
```

---

## AUDIT CHECKLIST

### A. Find All Violations

Run this command to identify all max-width media queries:

```bash
# Find all max-width queries in CSS files
grep -rn "max-width:" --include="*.css" --include="*.module.css" app/ components/ styles/ | grep -v "node_modules"

# Or use the audit script
npm run audit:css
```

### B. Known Violations (41 total across 33 files)

#### High Priority (User-facing pages)

| File | Line(s) | Current Pattern | Fix |
|------|---------|-----------------|-----|
| `app/(app)/al/page.module.css` | 137, 1438, 1472 | `max-width: 480px`, `max-width: 1023px` | Convert to min-width |
| `app/(app)/browse-cars/[slug]/page.module.css` | 2111 | `max-width: 900px` | Convert to min-width |
| `app/(app)/garage/page.module.css` | 5205 | `max-width: 1023px` | Convert to min-width |
| `app/(app)/community/EventsView.module.css` | 785 | `max-width: 480px` | Convert to min-width |
| `app/(app)/insights/components/BuildProgressRings.module.css` | 364 | `max-width: 374px` | Convert to min-width |
| `app/(app)/dashboard/components/WeeklyPointsSummary.module.css` | 178 | `max-width: 374px` | Convert to min-width |
| `app/(app)/layout.module.css` | 94 | `max-width: 1023px` | Convert to min-width |
| `app/globals.css` | 551, 1312 | `max-width: 767px`, `max-width: 1023px` | Convert to min-width |

#### Medium Priority (Components)

| File | Line(s) | Current Pattern | Fix |
|------|---------|-----------------|-----|
| `components/SportsCarComparison.module.css` | 263, 271, 459 | Multiple max-width | Convert to min-width |
| `components/NotificationCenter.module.css` | 67, 116 | `max-width: 480px` | Convert to min-width |
| `components/VirtualDynoChart.module.css` | 344, 528 | `max-width: 600px` | Convert to min-width |
| `components/onboarding/steps/FeatureSlide.module.css` | 185, 214 | `max-width: 380px`, `max-width: 480px` | Convert to min-width |
| `components/BottomTabBar.module.css` | 254 | `max-width: 1023px` | Convert to min-width |
| `components/ALFeedbackButtons.module.css` | 138 | `max-width: 640px` | Convert to min-width |
| `components/ALSourcesList.module.css` | 147 | `max-width: 480px` | Convert to min-width |
| `components/BillingToggle.module.css` | 202 | `max-width: 480px` | Convert to min-width |
| `components/EventAttendeesPreview.module.css` | 378 | `max-width: 767px` | Convert to min-width |
| `components/EventRSVPButton.module.css` | 228 | `max-width: 767px` | Convert to min-width |
| `components/FeedbackCorner.module.css` | 168 | `max-width: 1024px` | Convert to min-width |

#### Lower Priority (Admin/Internal)

| File | Line(s) | Notes |
|------|---------|-------|
| `app/admin/components/NotificationHealthPanel.module.css` | 42 | Admin only |

---

## CONVERSION PATTERNS

### Pattern 1: Simple Inversion

**Before (Desktop-First):**
```css
.element {
  padding: 24px;
  font-size: 18px;
}

@media (max-width: 768px) {
  .element {
    padding: 16px;
    font-size: 14px;
  }
}
```

**After (Mobile-First):**
```css
.element {
  padding: 16px;
  font-size: 14px;
}

@media (min-width: 769px) {
  .element {
    padding: 24px;
    font-size: 18px;
  }
}
```

### Pattern 2: Multiple Breakpoints

**Before:**
```css
.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}

@media (max-width: 1024px) {
  .grid { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 768px) {
  .grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 480px) {
  .grid { grid-template-columns: 1fr; }
}
```

**After:**
```css
.grid {
  display: grid;
  grid-template-columns: 1fr; /* Mobile default */
}

@media (min-width: 481px) {
  .grid { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 769px) {
  .grid { grid-template-columns: repeat(3, 1fr); }
}

@media (min-width: 1025px) {
  .grid { grid-template-columns: repeat(4, 1fr); }
}
```

### Pattern 3: Hide/Show Elements

**Before:**
```css
.desktopOnly {
  display: block;
}

@media (max-width: 768px) {
  .desktopOnly { display: none; }
}

.mobileOnly {
  display: none;
}

@media (max-width: 768px) {
  .mobileOnly { display: block; }
}
```

**After:**
```css
.desktopOnly {
  display: none; /* Hidden on mobile by default */
}

@media (min-width: 769px) {
  .desktopOnly { display: block; }
}

.mobileOnly {
  display: block; /* Visible on mobile by default */
}

@media (min-width: 769px) {
  .mobileOnly { display: none; }
}
```

### Pattern 4: Breakpoint Conversion Reference

| Desktop-First | Mobile-First Equivalent |
|---------------|------------------------|
| `max-width: 374px` | Base styles (no MQ needed) |
| `max-width: 480px` | `min-width: 481px` for larger |
| `max-width: 640px` | `min-width: 641px` for larger |
| `max-width: 767px` | `min-width: 768px` for larger |
| `max-width: 768px` | `min-width: 769px` for larger |
| `max-width: 900px` | `min-width: 901px` for larger |
| `max-width: 1023px` | `min-width: 1024px` for larger |
| `max-width: 1024px` | `min-width: 1025px` for larger |
| `max-width: 1199px` | `min-width: 1200px` for larger |

---

## FIX PROCEDURE

### Step 1: Analyze the Current Behavior
Before changing any file:
1. Open the page/component in browser
2. Test at mobile width (375px)
3. Test at tablet width (768px)
4. Test at desktop width (1280px)
5. Document the expected behavior at each size

### Step 2: Identify the Base (Mobile) Styles
Look at what styles are inside the `max-width` query - these represent the MOBILE styles that should become the base.

### Step 3: Invert the Logic
1. Move the mobile styles OUT of the media query (make them the default)
2. Move the desktop styles INTO a `min-width` query
3. Adjust the breakpoint value (+1px)

### Step 4: Test Thoroughly
Test on actual devices or simulators:
- iPhone SE (375px)
- iPhone 14 (390px)
- iPhone 14 Pro Max (428px)
- iPad (820px)
- Desktop (1280px+)

### Step 5: Verify No Visual Regression
The page should look EXACTLY the same at all sizes after conversion.

---

## AUTOMATED FIX APPROACH

For each file, follow this process:

```bash
# 1. Find the file's max-width queries
grep -n "max-width" components/SportsCarComparison.module.css

# 2. Read the context around each match
# 3. Apply the inversion pattern
# 4. Test the changes
# 5. Move to next file
```

---

## VERIFICATION

### After Fixing Each File

```bash
# Verify no max-width queries remain
grep -c "max-width" path/to/file.module.css
# Expected: 0 (or documented exceptions only)
```

### After Fixing All Files

```bash
# Run full audit
npm run audit:css

# Expected output:
# Files with max-width queries: 0
# Total max-width queries: 0
```

### Visual Regression Testing

1. Run the dev server: `npm run dev`
2. Test these critical pages on mobile viewport:
   - `/` (Landing)
   - `/dashboard` (Dashboard)
   - `/garage` (Garage)
   - `/browse-cars` (Browse Cars)
   - `/al` (AL Chat)
   - `/community` (Community)
3. Verify no layout breaks, text truncation, or touch target issues

---

## EXCEPTIONS

Some `max-width` queries may be intentional:

1. **Print stylesheets** - `@media print` may use max-width
2. **Container queries** - Not the same as viewport queries
3. **Third-party CSS** - Don't modify vendor CSS
4. **Explicit narrow-only styles** - Rarely needed, document if kept

Document any exceptions in this section after review.

---

## SUCCESS CRITERIA

- [ ] All 41 max-width queries converted to min-width
- [ ] `npm run audit:css` shows 0 max-width violations
- [ ] No visual regression on mobile devices
- [ ] No visual regression on tablet devices
- [ ] No visual regression on desktop
- [ ] Touch targets remain 44px+ on mobile
- [ ] Text remains readable at all sizes
- [ ] No horizontal scroll on any page at 375px width

---

## QUICK START

Copy this into Cursor to begin:

```
Please fix the mobile-first media query issues in this codebase.

Read the audit prompt at: audit/prompts/E-mobile-first-media-query-audit.md

Then:
1. Start with the high-priority files (app pages)
2. Convert each max-width to min-width using the patterns in the prompt
3. Test each file before moving to the next
4. Update me on progress after each file

Begin with: app/(app)/al/page.module.css (3 violations)
```

---

## REFERENCE FILES

- `docs/SOURCE_OF_TRUTH.md` - Rule 7: Mobile-First CSS
- `docs/BRAND_GUIDELINES.md` - Responsive design standards
- `docs/CSS_ARCHITECTURE.md` - CSS patterns and conventions
