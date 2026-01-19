# AutoRev CSS Architecture

> **Goal:** Consistent, maintainable styles that scale from PWA to native iOS/Android apps.

---

## Overview

```
/styles/
├── tokens/           # Design tokens (single source of truth)
│   ├── index.css     # Token imports
│   ├── colors.css    # All color values
│   ├── typography.css # Font families, sizes, weights
│   ├── spacing.css   # Margins, padding, gaps, radii
│   ├── animations.css # Motion patterns
│   └── shadows.css   # Elevation system
│
└── components/       # Reusable component styles
    ├── index.css     # Component imports
    ├── buttons.css   # All button variants
    ├── cards.css     # All card variants
    ├── badges.css    # Labels, tags, status indicators
    ├── progress.css  # Progress bars, meters
    └── forms.css     # Inputs, selects, textareas

/app/
├── globals.css       # Imports tokens + global styles
├── mobile-utilities.css # Mobile-specific utilities
└── **/*.module.css   # Page-specific styles (layout only)
```

---

## Rules for Consistency

### Rule 1: Never Hardcode Values

```css
/* ❌ WRONG - hardcoded values */
.myButton {
  background: #d4ff00;
  padding: 12px 20px;
  border-radius: 8px;
}

/* ✅ CORRECT - use tokens */
.myButton {
  background: var(--color-accent-lime);
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius-md);
}
```

### Rule 2: Compose from Component Styles

```css
/* ❌ WRONG - duplicating button styles */
.submitBtn {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 12px 20px;
  background: var(--color-accent-lime);
  /* ... 20 more lines ... */
}

/* ✅ CORRECT - compose from component library */
.submitBtn {
  composes: btn-primary from '@/styles/components/buttons.css';
  /* Only add page-specific overrides if needed */
}
```

### Rule 3: Module CSS = Layout Only

Page-specific `.module.css` files should only contain:
- Layout (grid, flex arrangement)
- Page-specific spacing adjustments
- Composition from shared components

```css
/* ✅ page.module.css - Layout only */
.pageContainer {
  display: flex;
  flex-direction: column;
  gap: var(--gap-lg);
  padding: var(--padding-page-x);
}

.sectionGrid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--gap-md);
}

@media (min-width: 768px) {
  .sectionGrid {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

---

## Token Reference

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg-base` | `#0d1b2a` | Page backgrounds |
| `--color-bg-elevated` | `#1b263b` | Cards, modals |
| `--color-text-primary` | `#ffffff` | Main text |
| `--color-text-secondary` | `#94a3b8` | Secondary text |
| `--color-accent-lime` | `#d4ff00` | Primary CTAs |
| `--color-accent-teal` | `#10b981` | Improvements |
| `--color-accent-blue` | `#3b82f6` | Baseline values |
| `--color-accent-gold` | `#d4a84b` | Labels, secondary buttons |

### Spacing (4px Base)

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | `4px` | Tight |
| `--space-2` | `8px` | XS |
| `--space-3` | `12px` | SM |
| `--space-4` | `16px` | MD (Base) |
| `--space-6` | `24px` | XL |
| `--space-8` | `32px` | 2XL |

### Typography

| Token | Mobile | Desktop | Usage |
|-------|--------|---------|-------|
| `--text-hero` | 28px | 56px | Page headlines |
| `--text-h1` | 26px | 48px | Section titles |
| `--text-body` | 14px | 16px | Body text |
| `--text-stat-hero` | 24px | 28px | Hero stats (544 HP) |

---

## Native App Preparation

### Why This Architecture Helps

1. **Tokens → React Native StyleSheet**
   ```javascript
   // tokens.js (auto-generated from CSS)
   export const colors = {
     bgBase: '#0d1b2a',
     accentLime: '#d4ff00',
     // ...
   };
   ```

2. **Component Classes → React Native Components**
   ```tsx
   // Button.tsx (React Native)
   <TouchableOpacity style={styles.btnPrimary}>
     <Text style={styles.btnPrimaryText}>Get Started</Text>
   </TouchableOpacity>
   ```

3. **44px Touch Targets**
   - Already enforced in `--touch-target-min: 44px`
   - iOS/Android minimum: 44×44pt

4. **Safe Area Insets**
   - Already using `env(safe-area-inset-*)` 
   - Maps to `SafeAreaView` in React Native

5. **Platform-Aware Animations**
   - `--ease-spring` for iOS-like springs
   - CSS animations → Reanimated 2

---

## Migration Strategy

### Phase 1: New Code (Immediate)
- All NEW components use token system
- All NEW pages import component styles

### Phase 2: High-Traffic Pages (Next Sprint)
- Migrate garage pages to token system
- Update frequently-used components

### Phase 3: Full Migration (Ongoing)
- Gradually update remaining pages
- Remove hardcoded values
- Consolidate duplicate styles

---

## Component Library Quick Reference

### Buttons
```css
.btn-primary     /* Lime - Main CTAs */
.btn-secondary   /* Outline - Secondary actions */
.btn-accent      /* Gold - Brand accent */
.btn-teal        /* Teal - Success/positive */
.btn-ghost       /* Minimal - Tertiary */
.btn-icon        /* Square icon buttons */
.btn-danger      /* Red - Destructive */
```

### Cards
```css
.card            /* Base card */
.card-interactive /* Clickable card */
.card-elevated   /* With shadow */
.card-highlight  /* Lime border accent */
.card-teal       /* Teal border accent */
.card-dashed     /* Empty state */
```

### Badges
```css
.badge-success   /* Teal - improvements */
.badge-warning   /* Amber - caution */
.badge-error     /* Red - errors */
.badge-info      /* Blue - informational */
.badge-lime      /* Lime - emphasis */
.badge-gold      /* Gold - labels */
.badge-gain      /* +99 style gains */
.pill            /* Rounded filter pills */
.pill-active     /* Active filter */
```

### Progress
```css
.progress-track           /* Base track */
.progress-fill-stock      /* Blue fill */
.progress-fill-improved   /* Teal fill */
.progress-fill-gold       /* Gold fill */
.metric-row               /* Label + value + bar */
.rating-row               /* Rating bar layout */
```

### Forms
```css
.input           /* Base input */
.input-sm        /* Small input */
.input-lg        /* Large input */
.textarea        /* Multi-line */
.select          /* Dropdown */
.checkbox        /* Checkbox */
.radio           /* Radio button */
.form-label      /* Label text */
.form-error      /* Error message */
```

---

## Avoiding Conflicts

### 1. Single Source of Truth
- Colors ONLY in `tokens/colors.css`
- Typography ONLY in `tokens/typography.css`
- Components ONLY in `components/*.css`

### 2. No Inline Styles for Tokens
```jsx
/* ❌ WRONG */
<div style={{ background: '#0d1b2a' }}>

/* ✅ CORRECT */
<div style={{ background: 'var(--color-bg-base)' }}>

/* ✅ BEST - use class */
<div className={styles.container}>
```

### 3. Specificity Rules
- Global styles: Low specificity (`:root`, base elements)
- Component styles: Medium specificity (`.btn-primary`)
- Module styles: Page-specific overrides only

---

## Questions?

See also:
- `docs/BRAND_GUIDELINES.md` - Color usage rules
- `.cursor/rules/brand-guidelines.mdc` - AI-enforced rules
- `.cursor/rules/data-visualization-ui-ux.mdc` - Chart styling rules
