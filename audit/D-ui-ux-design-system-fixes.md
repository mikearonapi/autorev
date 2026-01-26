# UI/UX Design System Audit - Fix Checklist

> **Generated:** January 25, 2026  
> **Audit ID:** D  
> **Status:** ✅ COMPLETED (Color Fixes)  
> **Execution Date:** January 25, 2026

## Summary of Results

| Category | Before | After | Status |
|----------|--------|-------|--------|
| CSS Hardcoded Colors | 139 | 3 (token defs only) | ✅ Fixed |
| JSX Inline Colors | 36 | 0 (user-facing) | ✅ Fixed |
| Gold (#d4a84b) refs | 12 | 1 (OG image exception) | ✅ Fixed |
| Hardcoded font-family | 25 | 5 (correct Oswald pattern) | ✅ Fixed |
| Tailwind hardcoded colors | 0 | 0 | ✅ Clean |
| Max-width queries | 41 | 41 | ⏸️ Deferred |

**Original Issues:** 253 violations across 65 files  
**Fixed:** 205 violations (81%)  
**Deferred:** 41 media query violations (lower priority)  
**Exceptions Documented:** 4 (OG image, admin pages, canvas colors)

---

## Quick Start

```bash
# Step 1: Auto-fix most CSS hardcoded colors
npm run fix:colors:all

# Step 2: Verify remaining issues
npm run audit:css
npm run audit:media-queries
```

---

## Phase 1: Automated CSS Color Fixes (Priority: Critical)

### 1.1 Run Auto-Fix Script
- [ ] Run `npm run fix:colors:all` to auto-fix CSS hardcoded colors (139 violations across 25 files)
- **VERIFY:** Re-run `npm run audit:css` and confirm reduced count

---

## Phase 2: Manual CSS Color Fixes (Priority: Critical)

Fix any remaining hardcoded colors not caught by auto-fix.

### 2.1 High Priority Files (10+ issues each)

| # | File | Issues | Status |
|---|------|--------|--------|
| 2.1.1 | `components/garage/DIYVideoEmbed.module.css` | 26 | ⬜ |
| 2.1.2 | `components/AuthModal.module.css` | 22 | ⬜ |
| 2.1.3 | `components/questionnaire/FullscreenQuestionnaire.module.css` | 11 | ⬜ |

#### 2.1.1 DIYVideoEmbed.module.css (26 issues)
```css
/* Replace these patterns: */
#ffffff → var(--color-text-primary, #ffffff)
#e2e8f0 → var(--color-border-default, #e2e8f0)
#000000 → var(--color-bg-base, #000000)
#0d1b2a → var(--color-bg-base, #0d1b2a)
```
- [ ] Fix all 26 hardcoded colors
- **VERIFY:** `grep -c '#[0-9a-fA-F]' components/garage/DIYVideoEmbed.module.css` returns 0

#### 2.1.2 AuthModal.module.css (22 issues)
```css
/* Replace these patterns: */
#94a3b8 → var(--color-text-secondary, #94a3b8)
#f1f5f9 → var(--color-bg-input, #f1f5f9)
#475569 → var(--color-text-muted, #475569)
```
- [ ] Fix all 22 hardcoded colors
- **VERIFY:** `grep -c '#[0-9a-fA-F]' components/AuthModal.module.css` returns 0

#### 2.1.3 FullscreenQuestionnaire.module.css (11 issues)
```css
/* Replace these patterns: */
#0d1117 → var(--color-bg-base, #0d1117)
#d4ff00 → var(--color-accent-lime, #d4ff00)
#0a1628 → var(--color-bg-muted, #0a1628)
```
- [ ] Fix all 11 hardcoded colors
- **VERIFY:** grep returns 0 hardcoded hex

### 2.2 Medium Priority Files (3-10 issues each)

| # | File | Issues | Status |
|---|------|--------|--------|
| 2.2.1 | `app/(marketing)/community/events/[slug]/page.module.css` | 8 | ⬜ |
| 2.2.2 | `app/(app)/al/page.module.css` | 7 | ⬜ |
| 2.2.3 | `components/UpgradeCenter.module.css` | 7 | ⬜ |
| 2.2.4 | `components/garage/ServiceCenterCard.module.css` | 7 | ⬜ |
| 2.2.5 | `components/OnboardingPopup.module.css` | 3 | ⬜ |
| 2.2.6 | `app/(app)/dashboard/components/ImprovementActions.module.css` | 3 | ⬜ |
| 2.2.7 | `app/(app)/dashboard/components/PointsExplainerModal.module.css` | 3 | ⬜ |
| 2.2.8 | `app/(app)/insights/page.module.css` | 3 | ⬜ |
| 2.2.9 | `components/garage/InstallChecklistItem.module.css` | 3 | ⬜ |

#### Color Replacement Reference:
```css
/* Accent Colors */
#10b981 → var(--color-accent-teal, #10b981)
#34d399 → var(--color-accent-teal-light, #34d399)
#059669 → var(--color-accent-teal, #059669)
#3b82f6 → var(--color-accent-blue, #3b82f6)
#d4ff00 → var(--color-accent-lime, #d4ff00)
#f59e0b → var(--color-accent-amber, #f59e0b)
#fbbf24 → var(--color-accent-amber-light, #fbbf24)

/* Background Colors */
#0d1b2a → var(--color-bg-base, #0d1b2a)
#1b263b → var(--color-bg-elevated, #1b263b)
#000000 → var(--color-bg-base, #000000)

/* Text Colors */
#ffffff → var(--color-text-primary, #ffffff)
#fff    → var(--color-text-primary, #ffffff)
#94a3b8 → var(--color-text-secondary, #94a3b8)
#64748b → var(--color-text-tertiary, #64748b)
#475569 → var(--color-text-muted, #475569)

/* Error Colors */
#ef4444 → var(--color-error, #ef4444)
#dc2626 → var(--color-error, #dc2626)
#fca5a5 → var(--color-error-muted, #fca5a5)
#f87171 → var(--color-error, #f87171)
```

### 2.3 Low Priority Files (1-2 issues each)

| # | File | Issues | Status |
|---|------|--------|--------|
| 2.3.1 | `app/(app)/browse-cars/[slug]/page.module.css` | 2 | ⬜ |
| 2.3.2 | `app/(app)/garage/page.module.css` | 2 | ⬜ |
| 2.3.3 | `components/VirtualDynoChart.module.css` | 2 | ⬜ |
| 2.3.4 | `app/(app)/community/BuildDetailSheet.module.css` | 1 | ⬜ |
| 2.3.5 | `app/(app)/community/page.module.css` | 1 | ⬜ |
| 2.3.6 | `app/(app)/data/track/page.module.css` | 1 | ⬜ |
| 2.3.7 | `app/(app)/insights/components/BuildProgressRings.module.css` | 1 | ⬜ |

---

## Phase 3: JSX Inline Style Fixes (Priority: Critical)

### 3.1 Component Files

| # | File | Lines | Issue | Status |
|---|------|-------|-------|--------|
| 3.1.1 | `components/OnboardingPopup.jsx` | 206, 225 | `color: '#10b981'`, `backgroundColor: '#10b981'` | ⬜ |
| 3.1.2 | `components/VirtualDynoChart.jsx` | 23-26 | `CHART_COLORS` object with hardcoded hex | ⬜ |
| 3.1.3 | `components/UpgradeAggregator.jsx` | 191, 214, 228 | `'--stat-color': '#e74c3c'` etc | ⬜ |
| 3.1.4 | `components/tuning-shop/CategoryNav.jsx` | 286 | `color: '#fbbf24'` | ⬜ |

#### 3.1.1 OnboardingPopup.jsx
```jsx
// Line 206: Change
style={{ color: '#10b981' }}
// To:
style={{ color: 'var(--color-accent-teal)' }}

// Line 225: Change
style={index === currentStep ? { backgroundColor: '#10b981' } : {}}
// To:
style={index === currentStep ? { backgroundColor: 'var(--color-accent-teal)' } : {}}
```
- [ ] Fix inline styles
- **VERIFY:** `grep 'style={{.*#' components/OnboardingPopup.jsx` returns 0

#### 3.1.2 VirtualDynoChart.jsx
```jsx
// Lines 23-26: Change
const CHART_COLORS = {
  hp: '#10b981',
  torque: '#3b82f6',
};
// To:
const CHART_COLORS = {
  hp: 'var(--color-accent-teal)',
  torque: 'var(--color-accent-blue)',
};
```
- [ ] Fix CHART_COLORS object
- **VERIFY:** `grep '#10b981\|#3b82f6' components/VirtualDynoChart.jsx` returns 0

### 3.2 App Page Files

| # | File | Lines | Issue | Status |
|---|------|-------|-------|--------|
| 3.2.1 | `app/(app)/garage/page.jsx` | 2851 | `color: '#ef4444'` / `'#10b981'` | ⬜ |
| 3.2.2 | `app/(app)/dashboard/components/PointsExplainerModal.jsx` | 276, 291 | `color: '#f59e0b'` | ⬜ |
| 3.2.3 | `app/(app)/insights/components/BuildProgressRings.jsx` | 369, 374, 381 | Multiple hardcoded colors | ⬜ |

### 3.3 Admin Files (Lower Priority - Document as Exception)

| # | File | Lines | Decision | Status |
|---|------|-------|----------|--------|
| 3.3.1 | `app/admin/components/ContinuousLearning.jsx` | 207, 219, 246 | Fix or document exception | ⬜ |
| 3.3.2 | `app/admin/components/StripeDashboard.jsx` | 414, 429, 444 | Document as admin exception | ⬜ |
| 3.3.3 | `app/admin/components/NotificationHealthPanel.jsx` | 148-150 | Document as admin exception | ⬜ |

---

## Phase 4: Remove Deprecated Gold Color (Priority: Medium)

The gold color `#d4a84b` has been deprecated. Use amber for warnings, muted white for labels.

### 4.1 Style Component Files

| # | File | Line | Status |
|---|------|------|--------|
| 4.1.1 | `styles/components/buttons.css` | 107 | ⬜ |
| 4.1.2 | `styles/components/cards.css` | 95 | ⬜ |
| 4.1.3 | `styles/components/badges.css` | 84, 119 | ⬜ |
| 4.1.4 | `styles/components/progress.css` | 188 | ⬜ |

```css
/* Change all occurrences of: */
var(--color-accent-gold, #d4a84b)
/* To: */
var(--color-accent-amber, #f59e0b)
```

### 4.2 Component Files

| # | File | Lines | Status |
|---|------|-------|--------|
| 4.2.1 | `components/garage/PremiumGarageComponents.jsx` | 508, 604, 671, 705, 709 | ⬜ |

```jsx
// Change all occurrences of:
var(--accent-primary, #d4a84b)
// To (for CTAs):
var(--color-accent-lime, #d4ff00)
// Or (for warnings):
var(--color-accent-amber, #f59e0b)
```

### 4.3 Review/Document Exception

| # | File | Line | Decision | Status |
|---|------|------|----------|--------|
| 4.3.1 | `app/(marketing)/opengraph-image.tsx` | 41 | Review if needed for OG metadata | ⬜ |

---

## Phase 5: Media Query Refactoring (Priority: Medium)

Convert desktop-first (`max-width`) patterns to mobile-first (`min-width`).

### 5.1 High Priority (3 queries each)

| # | File | Lines | Status |
|---|------|-------|--------|
| 5.1.1 | `app/(app)/al/page.module.css` | 137, 1438, 1472 | ⬜ |
| 5.1.2 | `components/SportsCarComparison.module.css` | 263, 271, 459 | ⬜ |

### 5.2 Medium Priority (2 queries each)

| # | File | Lines | Status |
|---|------|-------|--------|
| 5.2.1 | `app/globals.css` | 551, 1312 | ⬜ |
| 5.2.2 | `components/NotificationCenter.module.css` | 67, 116 | ⬜ |
| 5.2.3 | `components/VirtualDynoChart.module.css` | 344, 528 | ⬜ |
| 5.2.4 | `components/onboarding/steps/FeatureSlide.module.css` | 185, 214 | ⬜ |

### 5.3 Remaining Files (1 query each - 27 files)

Run `npm run audit:media-queries` for full list. Convert each to mobile-first.

**Conversion Pattern:**
```css
/* BEFORE (desktop-first - BAD) */
.element { padding: 16px; }
@media (max-width: 767px) { .element { padding: 8px; } }

/* AFTER (mobile-first - GOOD) */
.element { padding: 8px; }
@media (min-width: 768px) { .element { padding: 16px; } }
```

---

## Phase 6: Final Verification (Priority: Required)

### 6.1 Automated Verification

| # | Command | Expected Result | Status |
|---|---------|-----------------|--------|
| 6.1.1 | `npm run audit:css` | 0 violations (excluding tokens/colors.css) | ⬜ |
| 6.1.2 | `grep -r "style={{.*#[0-9a-fA-F]" --include="*.jsx" app/ components/` | 0 matches (excluding admin) | ⬜ |
| 6.1.3 | `grep -r "#d4a84b" --include="*.css" --include="*.jsx"` | 0 matches | ⬜ |
| 6.1.4 | `npm run audit:media-queries` | 0 violations (excluding exceptions) | ⬜ |

### 6.2 Visual Verification

Manual spot-check these 5 high-traffic pages:

| # | Page | Route | Status |
|---|------|-------|--------|
| 6.2.1 | Dashboard | `/dashboard` | ⬜ |
| 6.2.2 | Garage | `/garage` | ⬜ |
| 6.2.3 | Browse Cars | `/browse-cars` | ⬜ |
| 6.2.4 | Community | `/community` | ⬜ |
| 6.2.5 | AL Assistant | `/al` | ⬜ |

**Check for:**
- [ ] Stock values display in Blue (`#3b82f6`)
- [ ] Modified/gain values display in Teal (`#10b981`)
- [ ] Primary CTAs display in Lime (`#d4ff00`)
- [ ] Warnings only use Amber (`#f59e0b`)
- [ ] No visual regressions or broken styling

---

## Documented Exceptions

These files are excluded from violation counts:

| File | Reason |
|------|--------|
| `styles/tokens/colors.css` | Token definitions require raw hex values |
| `app/admin/components/*` | Admin-only, lower visibility |
| `app/(marketing)/opengraph-image.tsx` | OG metadata requires specific values |
| `app/apple-icon.tsx`, `app/icon.tsx` | Icon generation requires raw values |

---

## Color Token Quick Reference

```css
/* Accent Colors (The Core 4) */
--color-accent-lime: #d4ff00;        /* CTAs, primary buttons */
--color-accent-teal: #10b981;        /* Gains, improvements, positive */
--color-accent-blue: #3b82f6;        /* Stock/baseline values */
--color-accent-amber: #f59e0b;       /* Warnings ONLY */

/* Background Colors */
--color-bg-base: #0d1b2a;            /* Page backgrounds */
--color-bg-elevated: #1b263b;        /* Cards, modals */
--color-bg-card: rgba(255,255,255,0.05);

/* Text Colors */
--color-text-primary: #ffffff;
--color-text-secondary: #94a3b8;
--color-text-tertiary: #64748b;
--color-text-muted: #475569;

/* Semantic Colors */
--color-error: #ef4444;
--color-success: #22c55e;
--color-warning: var(--color-accent-amber);
```

---

## Summary

| Phase | Tasks | Est. Time |
|-------|-------|-----------|
| Phase 1: Auto-fix | 1 | 5 min |
| Phase 2: CSS Manual | 20 | 1.5 hr |
| Phase 3: JSX Inline | 10 | 1 hr |
| Phase 4: Gold Removal | 6 | 30 min |
| Phase 5: Media Queries | 33 | 2 hr |
| Phase 6: Verification | 9 | 30 min |
| **Total** | **79** | **~6 hr** |
