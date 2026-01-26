# AutoRev Brand Guidelines

**Version:** 2.0  
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

### Design Philosophy

AutoRev uses a **4-color accent system** with clear, non-overlapping semantic purposes. Each color has ONE job — this creates instant user comprehension and a cohesive visual language.

### Background Colors — The 6-Level Hierarchy

AutoRev uses a **6-level background system** inspired by premium apps like WHOOP and Apple Health. Each level creates distinct visual hierarchy and helps users understand their context within the app.

| Level | Name | Hex | CSS Variable | Usage |
|-------|------|-----|--------------|-------|
| **1** | **Immersive** | `#050a12` | `--brand-bg-immersive` | Media galleries, video players, splash screens |
| **2** | **Base** | `#0d1b2a` | `--brand-bg-primary` | Main app shell, page backgrounds |
| **3** | **Overlay** | `#1a1a1a` | `--brand-bg-overlay` | Full-screen modals, questionnaires, onboarding |
| **4** | **Elevated** | `#1b263b` | `--brand-bg-secondary` | Cards, panels, bottom sheets, small modals |
| **5** | **Surface** | `rgba(255,255,255,0.04)` | `--brand-bg-surface` | Card fills, subtle grouping |
| **6** | **Input** | `rgba(255,255,255,0.06)` | `--brand-bg-input` | Form fields, search bars |

> **RULE:** Never use pure black (`#000000`). Our navy family creates depth and premium feel.

---

### Level 1: Immersive (`--brand-bg-immersive`)

**"Cinematic moments that demand full attention"**

The deepest background (`#050a12`) for maximum immersion. Optimized for OLED displays.

✅ **USE FOR:**
- Image galleries (fullscreen view)
- Video players (fullscreen)
- Splash screens
- Car hero galleries (full-bleed)
- Any cinematic/media-focused experience

❌ **DON'T USE FOR:**
- Regular app pages
- Modals or sheets
- Forms or data entry

---

### Level 2: Base (`--brand-bg-primary`)

**"The foundation of the app experience"**

The main app background (`#0d1b2a`) that users see on all primary pages.

✅ **USE FOR:**
- Garage page
- Data/Dyno page
- Insights page
- Community page
- Dashboard page
- Tab bar background
- Navigation areas

❌ **DON'T USE FOR:**
- Modal content
- Media viewers

---

### Level 3: Overlay (`--brand-bg-overlay`)

**"Focused, temporary experiences that demand attention"**

The overlay background (`#1a1a1a`) signals users they're in a focused state.

✅ **USE FOR:**
- Onboarding questionnaires (goals, experience level)
- Data entry modals (log dyno data, log track data)
- Full-screen bottom sheets
- Multi-step flows (build wizard)
- Upgrade detail modals
- Car picker (fullscreen)
- Any focused experience needing visual separation

❌ **DON'T USE FOR:**
- Regular page backgrounds (use Base)
- Small confirmation dialogs (use Elevated)
- Media viewers (use Immersive)

---

### Level 4: Elevated (`--brand-bg-secondary`)

**"Distinct surfaces that lift content"**

The elevated background (`#1b263b`) for cards and panels.

✅ **USE FOR:**
- Cards within pages
- Small dialogs/confirmations
- Bottom sheet content
- Settings sections
- Grouped content areas
- Dropdown menus

❌ **DON'T USE FOR:**
- Full-screen modals (use Overlay)
- Page backgrounds (use Base)

---

### Level 5: Surface (`--brand-bg-surface`)

**"Subtle distinction within elevated contexts"**

Semi-transparent (`rgba(255,255,255,0.04)`) for subtle grouping.

✅ **USE FOR:**
- Cards within modals
- List items
- Interactive card fills
- Subtle content grouping

---

### Level 6: Input (`--brand-bg-input`)

**"Interactive form elements"**

Slightly brighter (`rgba(255,255,255,0.06)`) for form fields.

✅ **USE FOR:**
- Text inputs
- Search bars
- Dropdowns
- Textarea fields
- Select inputs

---

### Background Decision Tree

```
Is this media/gallery content?
  → YES: Use IMMERSIVE (#050a12)
  → NO: Continue...

Is this a full-screen modal, onboarding, or data entry?
  → YES: Use OVERLAY (#1a1a1a)
  → NO: Continue...

Is this a card, panel, or small modal?
  → YES: Use ELEVATED (#1b263b)
  → NO: Continue...

Is this a form field or input?
  → YES: Use INPUT (rgba 6%)
  → NO: Use BASE (#0d1b2a)
```

### Text Colors

| Role | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| **Primary** | `#ffffff` | `--brand-text-primary` | Headlines, body text, important content |
| **Secondary** | `#94a3b8` | `--brand-text-secondary` | Labels, descriptions, metadata |
| **Tertiary** | `#64748b` | `--brand-text-tertiary` | Subtle text, placeholders |
| **Muted** | `#475569` | `--brand-text-muted` | Disabled text, very subtle elements |

### Accent Colors (The Core 4)

| Color | Hex | Purpose | Think of it as... |
|-------|-----|---------|-------------------|
| **Lime** | `#d4ff00` | USER ACTIONS | "Do this" |
| **Teal** | `#10b981` | POSITIVE DATA | "This is good" |
| **Blue** | `#3b82f6` | BASELINE DATA | "This is stock" |
| **Amber** | `#f59e0b` | CAUTION | "Watch out" (use sparingly) |

---

### LIME (`#d4ff00`) — User Actions & Emphasis

**Use lime when you want the user to DO something.**

✅ **USE FOR:**
- Primary CTA buttons ("Start Build", "Save", "Upgrade Now")
- Primary navigation elements that drive action
- Emphasized headlines that announce features
- Premium/highlighted badges (sparingly)
- Hover states on secondary buttons
- Focus states on inputs

❌ **NEVER USE FOR:**
- Data display (use teal or blue)
- Status indicators
- Body text
- Large background areas

```css
/* Lime Button */
.btn-primary {
  background: #d4ff00;
  color: #0a1628;
}

/* Lime Focus State */
:focus-visible {
  outline: 2px solid #d4ff00;
  outline-offset: 2px;
}
```

---

### TEAL (`#10b981`) — Positive Data & Improvements

**Use teal when showing something GOOD happened to data.**

✅ **USE FOR:**
- HP/torque gains (`+99 HP`)
- Upgrade counts ("4 upgrades")
- Performance improvements
- Modified/upgraded values in comparisons
- Active selections (filter pills, tabs)
- Success confirmations
- Positive status badges

❌ **NEVER USE FOR:**
- User action buttons (use lime)
- Baseline/stock data (use blue)
- Warnings or cautions
- Decorative labels

```css
/* Teal for improvements */
.stat-improved { color: #10b981; }
.badge-gain { 
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

/* Teal for active states */
.filter-active {
  background: #10b981;
  color: #ffffff;
}
```

---

### BLUE (`#3b82f6`) — Baseline & Stock Data

**Use blue for ORIGINAL values before modification.**

✅ **USE FOR:**
- Stock/factory specifications
- Baseline values in comparisons
- Original data points
- Informational badges
- Links (text links, not buttons)

❌ **NEVER USE FOR:**
- Modified/upgraded data (use teal)
- CTAs or buttons (use lime)
- Warnings

```css
/* Blue for baseline */
.stat-stock { color: #3b82f6; }
.progress-stock { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
```

---

### AMBER (`#f59e0b`) — Caution Only (Use Sparingly!)

**Use amber ONLY for genuine warnings. This color should be rare in the UI.**

✅ **USE FOR:**
- "Watch Out" / "Caution" sections
- Known issues warnings
- Compatibility warnings
- Risk indicators

❌ **NEVER USE FOR:**
- Labels or categories (use muted white text)
- Badges that aren't warnings
- Decorative elements
- Data display

```css
/* Amber warning card */
.warning-card {
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.warning-text {
  color: #f59e0b;
}
```

---

### Semantic Colors (System States)

| Purpose | Hex | CSS Variable |
|---------|-----|--------------|
| **Success** | `#22c55e` | `--brand-success` |
| **Warning** | `#f59e0b` | `--brand-warning` (same as amber) |
| **Error** | `#ef4444` | `--brand-error` |
| **Info** | `#3b82f6` | `--brand-info` (same as blue) |

---

### Chart & Visualization Colors

| Role | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| **Grid Lines** | `rgba(255,255,255,0.08)` | `--brand-chart-grid` | Chart backgrounds |
| **Axis Lines** | `rgba(255,255,255,0.15)` | `--brand-chart-axis` | Chart axes |
| **Stock Data** | `#3b82f6` | `--brand-chart-stock` | Baseline/original line |
| **Modified Data** | `#10b981` | `--brand-chart-modified` | Improved/modified line |

---

### Comparison Pattern

When showing stock vs modified comparisons, ALWAYS follow this pattern:

| Data Type | Color | Example |
|-----------|-------|---------|
| Stock/Baseline | Blue `#3b82f6` | `444 HP` |
| Modified/Upgraded | Teal `#10b981` | `543 HP` |
| Gain Badge | Teal on teal bg | `+99` |

```tsx
// CORRECT comparison pattern
<span className="text-[#3b82f6]">444 HP</span>     {/* Stock = Blue */}
<span className="text-white">→</span>
<span className="text-[#10b981]">543 HP</span>     {/* Modified = Teal */}
<span className="bg-[rgba(16,185,129,0.15)] text-[#10b981]">+99</span>
```

---

## Typography

### Font Families

| Role | Font | CSS Variable | Weights |
|------|------|--------------|---------|
| **Display** | Oswald | `--font-display` | 600 |
| **Body** | Inter | `--font-body` | 400, 500, 600, 700 |
| **Monospace** | JetBrains Mono, SF Mono | `--font-mono` | 400, 600, 700, 800 |

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

/* Baseline Values (Blue) */
.stat-value-baseline {
  font-family: var(--font-mono);
  font-weight: 600;
  color: #3b82f6;
}
```

### Labels

```css
/* Uppercase Labels - Use muted white, NOT colored */
.label-uppercase {
  font-size: 10px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
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
  color: var(--brand-lime);
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
  background: #d4ff00;
  color: #0a1628;
  font-weight: 700;
  padding: 16px 32px;
  border-radius: 100px;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.btn-primary:hover {
  background: #bfe600;
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

**Teal Button (Positive Actions)**
```css
.btn-teal {
  background: #10b981;
  color: #ffffff;
  font-weight: 600;
  padding: 12px 24px;
  border-radius: 10px;
}

.btn-teal:hover {
  background: #34d399;
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

**Warning Badge (use sparingly)**
```css
.badge-warning {
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.2);
  color: #f59e0b;
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

### The 4-Color Decision Tree

```
Is this a button/CTA the user clicks?
  → YES: Use LIME (#d4ff00)
  → NO: Continue...

Is this showing improved/upgraded data?
  → YES: Use TEAL (#10b981)
  → NO: Continue...

Is this showing original/stock data?
  → YES: Use BLUE (#3b82f6)
  → NO: Continue...

Is this a genuine warning/caution?
  → YES: Use AMBER (#f59e0b) - sparingly!
  → NO: Use white or secondary text
```

### Do's ✅
- Use `#10b981` (teal) for ALL improvements and gains
- Use `#3b82f6` (blue) for ALL baseline/stock values
- Use `#d4ff00` (lime) for primary CTAs and emphasis
- Use `#f59e0b` (amber) sparingly for genuine warnings
- Use muted white for labels (NOT colored)
- Use monospace fonts for numeric data
- Design mobile-first, then enhance for desktop

### Don'ts ❌
- Don't use pure black (#000000) for backgrounds
- Don't mix teal and blue for the same type of data
- Don't overuse lime yellow (loses impact)
- Don't use amber for non-warning content
- Don't use gold (#d4a84b) — removed from palette
- Don't use orange (#ff4d00) — not in our palette
- Don't make text smaller than 10px on mobile

---

## CSS Variables Reference

```css
:root {
  /* Brand Backgrounds - 6-Level Hierarchy */
  --brand-bg-immersive: #050a12;        /* Level 1: Media, galleries, splash */
  --brand-bg-primary: #0d1b2a;          /* Level 2: Main app pages */
  --brand-bg-overlay: #1a1a1a;          /* Level 3: Full-screen modals, onboarding */
  --brand-bg-secondary: #1b263b;        /* Level 4: Cards, panels, sheets */
  --brand-bg-surface: rgba(255, 255, 255, 0.04);  /* Level 5: Card fills */
  --brand-bg-input: rgba(255, 255, 255, 0.06);    /* Level 6: Form fields */
  --brand-bg-card: rgba(255, 255, 255, 0.04);
  
  /* Brand Text */
  --brand-text-primary: #ffffff;
  --brand-text-secondary: #94a3b8;
  --brand-text-tertiary: #64748b;
  --brand-text-muted: #475569;
  
  /* Accent Colors (The Core 4) */
  --brand-lime: #d4ff00;          /* User actions, CTAs */
  --brand-lime-dark: #bfe600;
  --brand-teal: #10b981;          /* Improvements, gains */
  --brand-teal-light: #34d399;
  --brand-blue: #3b82f6;          /* Baseline, stock */
  --brand-blue-light: #60a5fa;
  --brand-amber: #f59e0b;         /* Warnings only */
  --brand-amber-light: #fbbf24;
  
  /* Semantic Colors */
  --brand-success: #22c55e;
  --brand-warning: #f59e0b;
  --brand-error: #ef4444;
  --brand-info: #3b82f6;
  
  /* Chart Colors */
  --brand-chart-grid: rgba(255, 255, 255, 0.08);
  --brand-chart-stock: var(--brand-blue);
  --brand-chart-modified: var(--brand-teal);
  
  /* Typography */
  --font-display: var(--font-oswald, 'Oswald'), 'Impact', sans-serif;
  --font-body: var(--font-inter, 'Inter'), -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', monospace;
}
```

---

## Accessibility & Theme Support

### Color Contrast Requirements

AutoRev is designed as a **dark-theme-only** application. All color combinations meet WCAG 2.1 AA contrast requirements:

| Combination | Contrast Ratio | Status |
|-------------|----------------|--------|
| White text on `#0d1b2a` (bg-primary) | 15.4:1 | ✅ AAA |
| White text on `#1b263b` (bg-elevated) | 12.1:1 | ✅ AAA |
| Secondary text (`#94a3b8`) on `#0d1b2a` | 7.3:1 | ✅ AA |
| Lime (`#d4ff00`) on `#0d1b2a` | 13.2:1 | ✅ AAA |
| Dark text on Lime buttons | 12.8:1 | ✅ AAA |

### Light Theme Status

**Current Status:** Not implemented  
**Reason:** AutoRev's brand identity is built around the premium dark theme experience. The dark theme reduces eye strain during garage sessions and creates the premium "night mode" aesthetic that resonates with automotive enthusiasts.

If light theme support is added in the future:
1. Define light theme variables in `app/globals.css`
2. Use paired tokens (`--color-card` / `--color-card-foreground`) for automatic theming
3. Audit all combinations against WCAG 2.1 AA (4.5:1 for body text, 3:1 for large text)
4. Test with WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/

### Focus States

All interactive elements use lime (`#d4ff00`) focus outlines for keyboard navigation:
- 2px solid outline with 2px offset
- High contrast against dark backgrounds
- `:focus-visible` for keyboard-only visibility

---

## Pre-Flight Checklist

Before submitting ANY UI code:

| Check | Question |
|-------|----------|
| ☐ Background | Using `#0d1b2a` (not pure black)? |
| ☐ Primary CTA | Using lime `#d4ff00`? |
| ☐ Improvements/Gains | Using teal `#10b981`? |
| ☐ Baseline/Stock | Using blue `#3b82f6`? |
| ☐ Warnings | Using amber `#f59e0b` (sparingly)? |
| ☐ Labels | Using muted white (not colored)? |
| ☐ Stats | Using monospace font? |
| ☐ No banned colors | No gold, no orange? |
| ☐ Touch targets | Buttons/links min 44px? |

---

*Brand guidelines maintained by AutoRev Design System v2.0*
