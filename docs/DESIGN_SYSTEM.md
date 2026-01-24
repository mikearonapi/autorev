# AutoRev Design System

**Version:** 1.0
**Last Updated:** January 2026

A comprehensive reference for design tokens, typography, spacing, component patterns, and UI guidelines for the AutoRev platform.

---

## Quick Reference

| Need | Go To |
|------|-------|
| Colors | [Color System](#color-system) |
| Typography | [Typography](#typography) |
| Spacing | [Spacing & Layout](#spacing--layout) |
| Components | [Component Patterns](#component-patterns) |
| Icons | [Iconography](#iconography) |
| Motion | [Animation & Motion](#animation--motion) |
| Accessibility | [Accessibility](#accessibility) |

---

## Design Principles

1. **Mobile-First** — Design for touch, then scale up
2. **Performance-Focused** — Minimal animations, efficient rendering
3. **Premium Dark Theme** — Deep navy backgrounds, not pure black
4. **Clear Hierarchy** — One clear action per view
5. **Accessible by Default** — WCAG 2.1 AA compliance

---

## Color System

### Background Colors

| Role | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| **Base** | `#0d1b2a` | `--color-bg-base` | Main page backgrounds |
| **Elevated** | `#1b263b` | `--color-bg-elevated` | Cards, modals, sheets |
| **Surface** | `rgba(255,255,255,0.04)` | `--color-bg-surface` | Subtle card fills |
| **Surface Hover** | `rgba(255,255,255,0.08)` | `--color-bg-surface-hover` | Interactive states |

> **RULE:** Never use pure black (`#000000`). Our navy creates depth.

### Text Colors

| Role | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| **Primary** | `#ffffff` | `--color-text-primary` | Headlines, body text |
| **Secondary** | `#94a3b8` | `--color-text-secondary` | Labels, descriptions |
| **Tertiary** | `#64748b` | `--color-text-tertiary` | Subtle text, placeholders |
| **Muted** | `#475569` | `--color-text-muted` | Disabled states |

### Accent Colors (The Core 4)

| Color | Hex | CSS Variable | Purpose |
|-------|-----|--------------|---------|
| **Lime** | `#d4ff00` | `--color-accent-lime` | User actions, CTAs |
| **Teal** | `#10b981` | `--color-accent-teal` | Positive data, success |
| **Blue** | `#3b82f6` | `--color-accent-blue` | Baseline data, info |
| **Amber** | `#f59e0b` | `--color-accent-amber` | Caution, warnings |

### Color Usage Rules

```css
/* ✅ CORRECT: Use CSS variables */
.card {
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
}

/* ❌ WRONG: Hardcoded hex values */
.card {
  background: #1b263b;
  color: #ffffff;
}
```

### Semantic Color Mapping

| Context | Use This Color |
|---------|----------------|
| Primary CTA button | Lime |
| Success state | Teal |
| Stock/baseline value | Blue |
| Upgraded/gained value | Teal |
| Warning message | Amber |
| Error state | Red (`#ef4444`) |
| Disabled element | Text muted |

---

## Typography

### Font Stack

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### Type Scale

| Name | Size | Line Height | Weight | Usage |
|------|------|-------------|--------|-------|
| **xs** | 12px | 16px | 400 | Captions, badges |
| **sm** | 14px | 20px | 400 | Secondary text, labels |
| **base** | 16px | 24px | 400 | Body text (default) |
| **lg** | 18px | 28px | 500 | Large body, card titles |
| **xl** | 20px | 28px | 600 | Section titles |
| **2xl** | 24px | 32px | 700 | Page headings |
| **3xl** | 30px | 36px | 700 | Hero headings |
| **4xl** | 36px | 40px | 800 | Marketing headlines |

### CSS Variables

```css
/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;
```

### Typography Rules

1. **Headlines:** Use semibold (600) or bold (700)
2. **Body text:** Use regular (400), 16px minimum
3. **Interactive text:** Use medium (500)
4. **Never use font-weight below 400** on dark backgrounds

---

## Spacing & Layout

### Spacing Scale

```css
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

### Border Radius

```css
--radius-sm: 4px;     /* Small elements */
--radius-md: 8px;     /* Buttons, inputs */
--radius-lg: 12px;    /* Cards */
--radius-xl: 16px;    /* Large cards, modals */
--radius-full: 9999px; /* Pills, avatars */
```

### Container Widths

```css
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1440px;
```

### Grid & Gap System

| Use Case | Gap |
|----------|-----|
| Card grid | `var(--space-4)` (16px) |
| Form fields | `var(--space-4)` (16px) |
| List items | `var(--space-3)` (12px) |
| Section spacing | `var(--space-8)` to `var(--space-12)` |
| Page padding | `var(--space-4)` mobile, `var(--space-6)` desktop |

---

## Component Patterns

### Buttons

| Variant | Background | Text | Use Case |
|---------|------------|------|----------|
| **Primary** | Lime | Dark | Main CTAs |
| **Secondary** | Transparent + border | White | Secondary actions |
| **Ghost** | Transparent | White | Tertiary actions |
| **Danger** | Red | White | Destructive actions |

```css
/* Button Base */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;        /* Touch target */
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius-md);
  font-weight: var(--font-medium);
  transition: all 0.15s ease;
}

/* Primary Button */
.btn-primary {
  background: var(--color-accent-lime);
  color: var(--color-bg-base);
}
```

### Cards

```css
.card {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  padding: var(--space-4);
}

.card-interactive {
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}

.card-interactive:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}
```

### Form Inputs

```css
.input {
  min-height: 44px;        /* Touch target */
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
}

.input:focus {
  outline: none;
  border-color: var(--color-accent-lime);
  box-shadow: 0 0 0 3px rgba(212, 255, 0, 0.2);
}
```

### Badges

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-2);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  border-radius: var(--radius-full);
}

.badge-success { background: rgba(16, 185, 129, 0.2); color: var(--color-accent-teal); }
.badge-info { background: rgba(59, 130, 246, 0.2); color: var(--color-accent-blue); }
.badge-warning { background: rgba(245, 158, 11, 0.2); color: var(--color-accent-amber); }
```

### Loading States

Use skeleton components for loading states:

```jsx
import { CardSkeleton, ListSkeleton } from '@/components/ui';

// Loading state
if (isLoading) {
  return <CardSkeleton />;
}
```

### Empty States

Use the standardized pattern:

```jsx
<div className={styles.emptyState}>
  <Icon name="inbox" size={48} className={styles.emptyIcon} />
  <h3>No items found</h3>
  <p>Start by adding your first item</p>
  <Button variant="primary">Add Item</Button>
</div>
```

---

## Iconography

### Icon Source

Primary: Lucide React icons (`lucide-react`)

### Icon Sizes

| Size | Pixels | Usage |
|------|--------|-------|
| **sm** | 16px | Inline with text |
| **md** | 20px | Buttons, nav |
| **lg** | 24px | Section headers |
| **xl** | 32px | Feature highlights |
| **2xl** | 48px | Empty states |

### Icon Color Rules

- Match icon color to adjacent text color
- Use accent colors sparingly for emphasis
- Never use more than 2 icon colors in a component

---

## Animation & Motion

### Duration Scale

```css
--duration-fast: 150ms;
--duration-normal: 250ms;
--duration-slow: 350ms;
```

### Easing

```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

### Motion Rules

1. **Use sparingly** — Motion should enhance, not distract
2. **Respect user preferences** — Honor `prefers-reduced-motion`
3. **Keep it fast** — Most transitions under 250ms
4. **Be consistent** — Same elements = same animations

```css
/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Accessibility

### Touch Targets

**Minimum 44×44px** for all interactive elements.

```css
.interactive {
  min-width: 44px;
  min-height: 44px;
}
```

### Focus States

Every interactive element must have a visible focus state:

```css
.interactive:focus-visible {
  outline: 2px solid var(--color-accent-lime);
  outline-offset: 2px;
}
```

### Color Contrast

| Text Type | Minimum Ratio |
|-----------|---------------|
| Normal text | 4.5:1 |
| Large text (18px+) | 3:1 |
| Non-text (icons) | 3:1 |

### Keyboard Navigation

- All interactive elements must be keyboard accessible
- Tab order should follow visual order
- Custom components need ARIA attributes

---

## Responsive Breakpoints

```css
/* Mobile First */
--breakpoint-sm: 640px;   /* Small devices */
--breakpoint-md: 768px;   /* Tablets */
--breakpoint-lg: 1024px;  /* Laptops */
--breakpoint-xl: 1280px;  /* Desktops */
--breakpoint-2xl: 1440px; /* Large screens */
```

### Usage Pattern

```css
/* Mobile first (default) */
.container {
  padding: var(--space-4);
}

/* Tablet and up */
@media (min-width: 768px) {
  .container {
    padding: var(--space-6);
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .container {
    padding: var(--space-8);
  }
}
```

---

## Dark Mode (Future)

Design tokens are structured to support dark mode via CSS custom property overrides:

```css
/* Default (dark theme) */
:root {
  --color-bg-base: #0d1b2a;
  --color-text-primary: #ffffff;
}

/* Light mode (future) */
[data-theme="light"] {
  --color-bg-base: #ffffff;
  --color-text-primary: #0d1b2a;
}
```

---

## Related Documentation

- [CSS Architecture](./CSS_ARCHITECTURE.md) — File structure and patterns
- [Brand Guidelines](./BRAND_GUIDELINES.md) — Full brand identity
- [SOURCE_OF_TRUTH.md](./SOURCE_OF_TRUTH.md) — Component registry and service map
