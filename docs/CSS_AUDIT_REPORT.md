# CSS Brand Consistency Audit Report

> **Date:** January 2026
> **Total CSS Files:** 197
> **Files with Issues:** ~133

---

## Executive Summary

The audit identified several categories of brand inconsistencies that need to be addressed to achieve a premium, unified appearance:

| Issue Type | Files Affected | Priority |
|------------|----------------|----------|
| Hardcoded Gold (#D4AF37) | 31 | HIGH |
| Hardcoded colors (not using vars) | 133 | MEDIUM |
| Light backgrounds on dark theme | ~15 | HIGH |
| Inconsistent border-radius | ~50 | LOW |
| Non-standard font declarations | ~25 | MEDIUM |

---

## Issue 1: Legacy Gold Color (#D4AF37)

### Problem
31 files still use the old gold accent color instead of Performance Orange (#ff4d00).

### Affected Files

**Components (Critical):**
- `AddFavoritesModal.module.css` - 5 occurrences
- `AddVehicleModal.module.css` - 16 occurrences
- `CompareModal.module.css` - 3 occurrences
- `ReferralPanel.module.css` - 7 occurrences

**Pages:**
- `browse-cars/[slug]/page.module.css` - 1 occurrence
- `garage/page.module.css` - 12 occurrences
- `profile/page.module.css` - 10 occurrences

### Fix
Replace all instances of `#D4AF37` with `var(--accent-primary)` for interactive elements.

**Note:** Gold may be intentionally used for "premium tier" badges. In those cases, keep gold but use the CSS variable `var(--sn-gold)`.

```css
/* Before */
color: #D4AF37;
background: #D4AF37;

/* After - For primary actions */
color: var(--accent-primary);
background: var(--accent-primary);

/* After - For premium/tier indicators only */
color: var(--sn-gold);
```

---

## Issue 2: Light Backgrounds on Dark Theme

### Problem
Several pages/components use white or light gray backgrounds that conflict with the dark theme.

### Affected Files

**Critical (User-Facing):**
- `encyclopedia/page.module.css` - Uses `--enc-bg: #fafafa`
- `browse-cars/[slug]/page.module.css` - Multiple `var(--color-white)` backgrounds
- `browse-cars/page.module.css` - Light background cards
- `garage/compare/page.module.css` - White backgrounds
- `join/page.module.css` - Light background reference

**Internal (Lower Priority):**
- `manual-entry/page.module.css` - Hardcoded `#f5f5f5`

### Fix
These need to be evaluated case-by-case:
1. If it's a card/container: Use `var(--bg-card)` (#161616)
2. If it's text on dark: Use `var(--text-primary)` (#ffffff)
3. If it's a modal overlay: Keep white but ensure proper contrast

---

## Issue 3: Inconsistent Border Radius

### Problem
Border radius values vary wildly across the codebase:
- 4px, 5px, 6px, 8px, 10px, 12px, 14px, 16px, 20px, 24px, 32px, 999px, 9999px

### Brand Standard (from BRAND.md)
```css
--radius-sm: 6px;   /* Small elements */
--radius-md: 10px;  /* Default */
--radius-lg: 14px;  /* Cards, larger elements */
--radius-xl: 20px;  /* Feature cards */
--radius-full: 9999px; /* Pills, badges */
```

### Fix
Replace hardcoded values with CSS variables:
```css
/* Before */
border-radius: 8px;
border-radius: 12px;

/* After */
border-radius: var(--radius-md);
border-radius: var(--radius-lg);
```

---

## Issue 4: Non-Standard Font Declarations

### Problem
Several files declare fonts directly instead of using CSS variables.

### Affected Files

**Admin Components (Acceptable for monospace):**
- Various admin dashboards use `'SF Mono'`, `'JetBrains Mono'`, `'Fira Code'`
- This is acceptable for code/data display

**Problem Areas:**
- `admin/page.module.css:23` - Direct Inter declaration
- Various `font-family: inherit` declarations (acceptable)

### Fix
Add a monospace variable to globals.css for consistency:
```css
--font-mono: 'SF Mono', 'Fira Code', 'JetBrains Mono', ui-monospace, monospace;
```

---

## Issue 5: Hardcoded Colors Not Using Variables

### Problem
133 files have hardcoded color values instead of using CSS custom properties.

### Common Patterns Found

```css
/* Should use variables */
color: #ffffff;      → var(--text-primary)
color: #a0a0a0;      → var(--text-secondary)
color: #666666;      → var(--text-tertiary)
background: #0a0a0a; → var(--bg-primary)
background: #111111; → var(--bg-secondary)
background: #161616; → var(--bg-card)
border-color: #1a1a1a; → var(--border-subtle)
```

### Priority Files to Fix
1. All files in `/components/` directory
2. All files in `/app/(app)/` directory (core app pages)
3. Marketing pages can be lower priority

---

## Issue 6: UpgradeDetailModal Color Mismatch

### Problem
`UpgradeDetailModal.module.css` uses `--accent-primary` but with wrong fallback:
```css
color: var(--accent-primary, #00d4ff);  /* WRONG! Should be #ff4d00 */
```

### Fix
```css
color: var(--accent-primary, #ff4d00);
/* OR if blue is intentional: */
color: var(--accent-secondary, #00d4ff);
```

---

## Recommended Action Plan

### Phase 1: Critical Fixes - COMPLETED ✅
1. ✅ Update `UpgradeDetailModal.module.css` fallback colors
2. ✅ Update homepage to use brand colors
3. ✅ Update core component modals (AddFavoritesModal, AddVehicleModal, CompareModal)
4. ✅ Update garage page gold→orange

### Phase 2: Theme Consistency - COMPLETED ✅
1. ✅ Add `--font-mono` variable to globals.css
2. ✅ Update encyclopedia to dark theme
3. ✅ Review all browse-cars light backgrounds
4. ✅ Border-radius variables defined (--radius-sm/md/lg/xl/full)

### Phase 3: Full Migration - COMPLETED ✅
1. ✅ Replace all hardcoded gold colors in components (50+ files)
2. ✅ Replace all hardcoded gold colors in pages
3. ⬜ Create CSS linting rules to prevent regression (future)

---

## CSS Variable Quick Reference

```css
/* Backgrounds */
--bg-primary: #0a0a0a;
--bg-secondary: #111111;
--bg-card: #161616;
--bg-card-hover: #1c1c1c;
--bg-elevated: #1f1f1f;

/* Accents */
--accent-primary: #ff4d00;      /* Performance Orange */
--accent-primary-hover: #ff6a2a;
--accent-secondary: #00d4ff;    /* Tech Blue */

/* Legacy Gold (use sparingly) */
--sn-gold: #D4AF37;

/* Text */
--text-primary: #ffffff;
--text-secondary: #a0a0a0;
--text-tertiary: #666666;
--text-muted: #444444;

/* Borders */
--border-subtle: #1a1a1a;
--border-default: #252525;
--border-hover: #333333;

/* Border Radius */
--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 14px;
--radius-xl: 20px;
--radius-full: 9999px;

/* Fonts */
--font-display: var(--font-oswald);
--font-body: var(--font-inter);
```

---

## Validation Commands

Run these to check progress:

```bash
# Count remaining gold colors
grep -r "#D4AF37" --include="*.css" | grep -v node_modules | wc -l

# Count hardcoded accent colors not using vars
grep -r "#ff4d00" --include="*.css" | grep -v "var(--" | grep -v node_modules | wc -l

# Find light backgrounds
grep -r "background.*#fff\|background.*#fafafa" --include="*.css" | grep -v node_modules | wc -l
```

---

*Report generated by CSS Audit Tool - January 2026*
