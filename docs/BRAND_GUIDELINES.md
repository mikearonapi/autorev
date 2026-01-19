# AutoRev Brand Guidelines

**Version:** 1.0  
**Last Updated:** January 2026  
**Design Philosophy:** Mobile-First, Premium Dark Theme, Performance-Focused

---

## Table of Contents
1. [Color System](#color-system)
2. [Typography](#typography)
3. [Iconography](#iconography)
4. [Imagery](#imagery)
5. [Component Patterns](#component-patterns)
6. [Spacing & Layout](#spacing--layout)

---

## Color System

### Core Brand Colors

| Role | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| **Background Primary** | `#0d1b2a` | `--brand-bg-primary` | Main page backgrounds, app shell |
| **Background Secondary** | `#1b263b` | `--brand-bg-secondary` | Cards, elevated surfaces |
| **Primary Text** | `#ffffff` | `--brand-text-primary` | Headlines, body text, important content |
| **Secondary Text** | `#94a3b8` | `--brand-text-secondary` | Labels, descriptions, metadata (Slate-400) |
| **Tertiary Text** | `#64748b` | `--brand-text-tertiary` | Disabled text, placeholders (Slate-500) |

### Accent Colors

| Role | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| **Lime Yellow (PRIMARY CTA)** | `#d4ff00` | `--brand-lime` | Primary buttons, headlines, emphasized text, badges |
| **Teal/Emerald (Improvements)** | `#10b981` | `--brand-teal` | Gains, improvements, selections, active filters, positive changes |
| **Blue (Baseline)** | `#3b82f6` | `--brand-blue` | Stock values, baseline data, original specs |
| **Gold (Labels/Accent)** | `#d4a84b` | `--brand-gold` | Category labels, secondary buttons, brand accent on dark |

> **IMPORTANT:** Lime (#d4ff00) is our PRIMARY CTA color. Use it for all main action buttons across the site.

### Semantic Colors

| Role | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| **Success** | `#22c55e` | `--brand-success` | Completed actions, positive feedback |
| **Warning** | `#f59e0b` | `--brand-warning` | Caution states, alerts |
| **Error** | `#ef4444` | `--brand-error` | Errors, destructive actions |
| **Info** | `#3b82f6` | `--brand-info` | Informational messages |

### Chart & Visualization Colors

| Role | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| **Chart Outline** | `rgba(255, 255, 255, 0.15)` | `--brand-chart-outline` | Grid lines, axis lines |
| **Chart Border** | `rgba(255, 255, 255, 0.08)` | `--brand-chart-border` | Card borders, dividers |
| **Stock Line** | `#3b82f6` | `--brand-chart-stock` | Baseline/stock data on charts |
| **Modified Line** | `#10b981` | `--brand-chart-modified` | Modified/improved data on charts |
| **Fill Gradient (Stock)** | `#3b82f6 → #60a5fa` | - | Progress bars, area fills |
| **Fill Gradient (Modified)** | `#10b981 → #34d399` | - | Improvement progress bars |

### Color Usage Rules

1. **Never use pure black** - Use `#0d1b2a` for backgrounds
2. **Teal (#10b981) = Improvements** - Use exclusively for positive changes/gains
3. **Blue (#3b82f6) = Baseline** - Use exclusively for stock/original values
4. **Lime (#d4ff00) = Emphasis** - Use sparingly for maximum impact
5. **Gold (#d4a84b) = Interactive** - Buttons, links, actionable elements

---

## Typography

### Font Families

| Role | Font | CSS Variable | Weights |
|------|------|--------------|---------|
| **Display** | Oswald | `--font-display` | 600 |
| **Body** | Inter | `--font-body` | 400, 500, 600 |
| **Monospace** | JetBrains Mono, SF Mono | `--font-mono` | 400, 600, 700 |

### Type Scale (Mobile-First)

| Name | Mobile | Desktop | Variable | Usage |
|------|--------|---------|----------|-------|
| **Hero** | 28px | 56px | `--font-size-hero` | Page headlines |
| **H1** | 26px | 48px | `--font-size-4xl` | Section titles |
| **H2** | 22px | 36px | `--font-size-3xl` | Card headers |
| **H3** | 18px | 28px | `--font-size-2xl` | Subsection headers |
| **H4** | 16px | 22px | `--font-size-xl` | Emphasized text |
| **Large** | 14px | 18px | `--font-size-lg` | Intro paragraphs |
| **Base** | 13px | 16px | `--font-size-base` | Body text |
| **Small** | 11px | 14px | `--font-size-sm` | Labels, metadata |
| **XS** | 10px | 12px | `--font-size-xs` | Fine print, badges |

### Header Styling

```css
/* Primary Headers (Oswald) */
.header-display {
  font-family: var(--font-display);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  line-height: 1.1;
}

/* Section Headers (Inter Bold) */
.header-section {
  font-family: var(--font-body);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
}
```

### Data/Stats Typography

For important numeric data (HP, 0-60, etc.):

```css
/* Large Stats - "Metallic Silver" Effect */
.stat-value-hero {
  font-family: var(--font-mono);
  font-size: 24px;  /* Mobile: 24px, Desktop: 28px */
  font-weight: 800;
  line-height: 1;
  background: linear-gradient(180deg, #fff 0%, rgba(255, 255, 255, 0.85) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

@media (min-width: 768px) {
  .stat-value-hero {
    font-size: 28px;
  }
}

/* Standard Data Values */
.stat-value {
  font-family: var(--font-mono);
  font-weight: 700;
  color: #ffffff;
}

/* Improvement Values (Teal) */
.stat-value-improved {
  font-family: var(--font-mono);
  font-weight: 700;
  color: #10b981;
}
```

### Labels

```css
/* Uppercase Labels */
.label {
  font-size: 10px;
  font-weight: 600;
  color: var(--brand-gold);
  text-transform: uppercase;
  letter-spacing: 0.12em;
}
```

---

## Iconography

### Icon Sizes

| Size | Pixels | Usage |
|------|--------|-------|
| **XS** | 14px | Inline with small text |
| **SM** | 16px | Inline with body text |
| **MD** | 20px | Standard UI icons |
| **LG** | 24px | Primary action icons |
| **XL** | 32px | Hero/feature icons |
| **2XL** | 48px | Empty states, illustrations |

### Icon Styling

```css
/* Standard Icon */
.icon {
  color: var(--brand-text-secondary);
  transition: color 0.2s ease;
}

/* Active/Interactive Icon */
.icon-active {
  color: var(--brand-gold);
}

/* Accent Icon (used with teal improvements) */
.icon-accent {
  color: var(--brand-teal);
}
```

### Icon Library
- Primary: **Lucide React** (consistent with codebase)
- Style: Outline, 1.5px stroke width

---

## Imagery

### Image Sizes

| Context | Aspect Ratio | Mobile | Desktop |
|---------|--------------|--------|---------|
| **Hero/Gallery** | 16:9 or fill | Full width | Max 1200px |
| **Card Thumbnail** | 16:10 | 100% width | 280-400px |
| **List Thumbnail** | 4:3 | 80×60px | 100×75px |
| **Avatar** | 1:1 | 40px | 48px |

### Image Styling

```css
/* Hero Images */
.image-hero {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  border-radius: 0;
}

/* Card Images */
.image-card {
  width: 100%;
  aspect-ratio: 16 / 10;
  object-fit: cover;
  border-radius: 12px;
}

/* Thumbnail Images */
.image-thumb {
  width: 80px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
}
```

### Image Placeholders

Use navy background with subtle border:
```css
.image-placeholder {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.06);
}
```

---

## Component Patterns

### Buttons

**Primary Button (Lime - MAIN CTA)**
```css
.btn-primary {
  background: #d4ff00;  /* Lime */
  color: #0a1628;       /* Navy */
  font-weight: 700;
  padding: 16px 32px;
  border-radius: 100px;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.btn-primary:hover {
  background: #bfe600;  /* Lime Dark */
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(212, 255, 0, 0.3);
}
```

**Secondary Button (Outline)**
```css
.btn-secondary {
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 16px 32px;
  border-radius: 100px;
}

.btn-secondary:hover {
  border-color: #d4ff00;
  color: #d4ff00;
}
```

**Accent Button (Gold)**
```css
.btn-accent {
  background: #d4a84b;
  color: #000;
  font-weight: 600;
  padding: 12px 24px;
  border-radius: 10px;
}
```

### Cards

```css
.card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 20px;
}

.card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.1);
}
```

### Selection/Active States

**Active Filter Pill**
```css
.filter-active {
  background: #10b981;
  border-color: #10b981;
  color: #ffffff;
}
```

**Active Toggle Button**
```css
.toggle-active {
  background: #d4a84b;
  color: #000;
}
```

### Progress/Comparison Bars

```css
/* Stock/Baseline Bar */
.bar-stock {
  background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%);
}

/* Modified/Improved Bar */
.bar-modified {
  background: linear-gradient(90deg, #10b981 0%, #34d399 100%);
}

/* Track Background */
.bar-track {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
}
```

### Badges

**Improvement Badge**
```css
.badge-gain {
  display: inline-flex;
  padding: 2px 6px;
  background: rgba(16, 185, 129, 0.15);
  border-radius: 4px;
  font-size: 12px;
  font-weight: 700;
  color: #10b981;
}
```

**Lime Accent Badge**
```css
.badge-accent {
  background: rgba(212, 255, 0, 0.08);
  border: 1px solid rgba(212, 255, 0, 0.2);
  color: #d4ff00;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 8px 16px;
  border-radius: 100px;
}
```

---

## Spacing & Layout

### Spacing Scale

| Name | Mobile | Desktop | Variable |
|------|--------|---------|----------|
| **XS** | 8px | 8px | `--space-xs` |
| **SM** | 12px | 12px | `--space-sm` |
| **MD** | 16px | 20px | `--space-md` |
| **LG** | 24px | 28px | `--space-lg` |
| **XL** | 32px | 40px | `--space-xl` |
| **2XL** | 48px | 56px | `--space-2xl` |
| **3XL** | 64px | 80px | `--space-3xl` |

### Border Radius

| Name | Value | Usage |
|------|-------|-------|
| **SM** | 6px | Small buttons, badges |
| **MD** | 10px | Form inputs, small cards |
| **LG** | 14px | Cards, panels |
| **XL** | 20px | Large cards, modals |
| **Full** | 9999px | Pills, circular buttons |

### Touch Targets

- **Minimum:** 44px × 44px (Apple/Google guidelines)
- **Recommended:** 48px × 48px for primary actions

---

## Quick Reference

### Do's ✅
- Use `#10b981` (teal) for ALL improvements and gains
- Use `#3b82f6` (blue) for ALL baseline/stock values
- Use `#d4ff00` (lime) sparingly for maximum emphasis
- Use `#d4a84b` (gold) for interactive elements
- Use monospace fonts for numeric data
- Maintain consistent spacing with the scale
- Design mobile-first, then enhance for desktop

### Don'ts ❌
- Don't use pure black (#000000) for backgrounds
- Don't mix teal and blue for the same type of data
- Don't overuse lime yellow (loses impact)
- Don't use gray for interactive elements
- Don't use light backgrounds (we're a dark theme app)
- Don't make text smaller than 10px on mobile

---

## CSS Variables Reference

```css
:root {
  /* Brand Colors */
  --brand-bg-primary: #0d1b2a;
  --brand-bg-secondary: #1b263b;
  --brand-bg-card: rgba(255, 255, 255, 0.04);
  
  --brand-text-primary: #ffffff;
  --brand-text-secondary: #94a3b8;   /* Slate-400 */
  --brand-text-tertiary: #64748b;    /* Slate-500 */
  --brand-text-muted: #475569;       /* Slate-600 */
  
  /* Accent Colors */
  --brand-lime: #d4ff00;             /* PRIMARY CTA */
  --brand-lime-dark: #bfe600;
  --brand-teal: #10b981;             /* Improvements */
  --brand-teal-light: #34d399;
  --brand-blue: #3b82f6;             /* Baseline */
  --brand-blue-light: #60a5fa;
  --brand-gold: #d4a84b;             /* Labels/Secondary */
  --brand-gold-hover: #e8c875;
  
  /* Semantic Colors */
  --brand-success: #22c55e;
  --brand-warning: #f59e0b;
  --brand-error: #ef4444;
  --brand-info: #3b82f6;
  
  /* Chart Colors */
  --brand-chart-outline: rgba(255, 255, 255, 0.15);
  --brand-chart-border: rgba(255, 255, 255, 0.08);
  --brand-chart-stock: var(--brand-blue);
  --brand-chart-modified: var(--brand-teal);
  
  /* Typography */
  --font-display: var(--font-oswald, 'Oswald'), 'Impact', sans-serif;
  --font-body: var(--font-inter, 'Inter'), -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', monospace;
}
```
