# AutoRev Design System - Build Pivot

> **Purpose:** Documents UI/UX changes for the Build-focused pivot
> **Inspiration:** GRAVL, FIXD - premium automotive apps with clean, focused UI
> **Created:** January 18, 2026

---

## Design Philosophy

### Core Principles

1. **Focus** - Single-purpose screens, clear CTAs
2. **Premium** - Dark theme, high contrast, refined typography
3. **Performance** - Fast, responsive, mobile-first
4. **Trust** - Data-driven, verifiable, credible

### Visual Direction

Moving from a "research platform" aesthetic to a "build tool" aesthetic:
- Darker, more immersive backgrounds
- Higher contrast for readability
- Bolder typography for headlines
- More prominent CTAs
- Card-based layouts for builds/projects

---

## Color System

### Primary Palette (Updated)

```css
:root {
  /* Background Colors - Darker, more premium */
  --bg-primary: #0a0a0a;
  --bg-secondary: #111111;
  --bg-card: #161616;
  --bg-card-hover: #1c1c1c;
  --bg-elevated: #1f1f1f;
  
  /* Accent Colors */
  --accent-primary: #ff4d00;      /* Performance Orange */
  --accent-primary-hover: #ff6a2a;
  --accent-secondary: #00d4ff;    /* Tech Blue */
  --accent-secondary-hover: #33deff;
  
  /* Gold Accent (preserved from brand) */
  --accent-gold: #D4AF37;
  --accent-gold-light: #E6C54A;
  
  /* Text Colors */
  --text-primary: #ffffff;
  --text-secondary: #a0a0a0;
  --text-tertiary: #666666;
  --text-muted: #444444;
  
  /* Border Colors */
  --border-subtle: #222222;
  --border-default: #333333;
  --border-hover: #444444;
  
  /* Semantic Colors */
  --success: #22c55e;
  --success-bg: rgba(34, 197, 94, 0.1);
  --warning: #f59e0b;
  --warning-bg: rgba(245, 158, 11, 0.1);
  --error: #ef4444;
  --error-bg: rgba(239, 68, 68, 0.1);
  --info: #3b82f6;
  --info-bg: rgba(59, 130, 246, 0.1);
}
```

### Color Usage Guidelines

| Element | Color Variable | Notes |
|---------|---------------|-------|
| Page background | `--bg-primary` | Deepest black |
| Cards | `--bg-card` | Slightly elevated |
| Primary buttons | `--accent-primary` | Orange - action |
| Secondary buttons | `--bg-card` with border | Subtle |
| Links | `--accent-secondary` | Blue - navigation |
| HP gains | `--success` | Green - positive |
| Cost | `--text-secondary` | Neutral |
| Headlines | `--text-primary` | White |
| Body text | `--text-secondary` | Gray |

---

## Typography

### Font Stack

```css
:root {
  /* Primary font - clean, modern */
  --font-primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  
  /* Display font - impact headlines */
  --font-display: 'Oswald', 'Impact', sans-serif;
  
  /* Mono font - data/specs */
  --font-mono: 'JetBrains Mono', 'SF Mono', monospace;
}
```

### Type Scale (Build-Focused)

```css
:root {
  /* Bolder, more impactful scale */
  --text-xs: 0.75rem;     /* 12px - labels */
  --text-sm: 0.875rem;    /* 14px - secondary */
  --text-base: 1rem;      /* 16px - body */
  --text-lg: 1.125rem;    /* 18px - emphasis */
  --text-xl: 1.25rem;     /* 20px - subheads */
  --text-2xl: 1.5rem;     /* 24px - section titles */
  --text-3xl: 2rem;       /* 32px - page titles */
  --text-4xl: 2.5rem;     /* 40px - hero */
  --text-5xl: 3.5rem;     /* 56px - big hero */
}
```

### Typography Rules

1. **Headlines:** Use `--font-display`, uppercase, letter-spacing 0.02em
2. **Body:** Use `--font-primary`, normal weight
3. **Data/Specs:** Use `--font-mono` for numbers, metrics
4. **Line Height:** 1.2 for headlines, 1.5 for body

---

## Component Patterns

### Cards

```css
.card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s ease;
}

.card:hover {
  background: var(--bg-card-hover);
  border-color: var(--border-hover);
}
```

### Build/Project Cards

```css
.build-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  overflow: hidden;
}

.build-card__header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.build-card__stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: var(--border-subtle);
}

.build-card__stat {
  background: var(--bg-card);
  padding: 16px;
  text-align: center;
}

.build-card__stat-value {
  font-family: var(--font-mono);
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--text-primary);
}

.build-card__stat-label {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

### Buttons

```css
/* Primary CTA */
.btn-primary {
  background: var(--accent-primary);
  color: white;
  font-weight: 600;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: var(--text-base);
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: var(--accent-primary-hover);
  transform: translateY(-1px);
}

/* Secondary */
.btn-secondary {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-default);
  padding: 12px 24px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: var(--bg-card);
  border-color: var(--border-hover);
}

/* Ghost */
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  padding: 8px 16px;
  border-radius: 6px;
}

.btn-ghost:hover {
  background: var(--bg-card);
  color: var(--text-primary);
}
```

### Form Inputs

```css
.input {
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 12px 16px;
  color: var(--text-primary);
  font-size: var(--text-base);
  transition: all 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(255, 77, 0, 0.1);
}

.input::placeholder {
  color: var(--text-tertiary);
}
```

---

## Layout Patterns

### Page Structure

```
┌─────────────────────────────────────────────┐
│ Header (sticky, dark)                       │
├─────────────────────────────────────────────┤
│ Hero Section (if applicable)                │
│ - Bold headline                             │
│ - Clear CTA                                 │
├─────────────────────────────────────────────┤
│ Main Content                                │
│ - Card-based layout                         │
│ - Clear visual hierarchy                    │
├─────────────────────────────────────────────┤
│ Footer (minimal)                            │
└─────────────────────────────────────────────┘
```

### Grid System

```css
/* Mobile-first responsive grid */
.grid-builds {
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr;
}

@media (min-width: 640px) {
  .grid-builds {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .grid-builds {
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }
}
```

---

## Iconography

### Icon Style

- Line icons, 1.5-2px stroke
- Rounded corners
- 24x24px default size
- 20px for compact UI
- 16px for inline

### Key Icons

| Context | Icon | Notes |
|---------|------|-------|
| HP Gain | Lightning bolt | Success color |
| Cost | Dollar sign | Neutral |
| Parts | Wrench | Primary |
| Save | Bookmark | Toggle state |
| Share | Share arrow | Secondary |
| Delete | Trash | Error color |
| Add | Plus | Primary action |
| Settings | Gear | Tertiary |

---

## Motion & Animation

### Timing

```css
:root {
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
}
```

### Animation Patterns

```css
/* Card entrance */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-enter {
  animation: fadeInUp var(--duration-normal) var(--ease-out);
}

/* Button press */
.btn:active {
  transform: scale(0.98);
}

/* Loading skeleton */
@keyframes shimmer {
  0% { background-position: -200px 0; }
  100% { background-position: 200px 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-card) 0%,
    var(--bg-elevated) 50%,
    var(--bg-card) 100%
  );
  background-size: 200px 100%;
  animation: shimmer 1.5s infinite;
}
```

---

## Mobile Considerations

### Touch Targets

- Minimum 44x44px for all interactive elements
- 8px minimum spacing between targets
- Clear active states (scale, opacity)

### Gestures

- Swipe to dismiss modals
- Pull to refresh on lists
- Long press for context menus (future)

### Safe Areas

```css
.bottom-action {
  padding-bottom: max(16px, env(safe-area-inset-bottom));
}
```

---

## Dark Theme Implementation

The Build-focused UI is dark-first. Light theme is NOT planned for MVP.

### Background Hierarchy

1. `--bg-primary` (#0a0a0a) - Page background
2. `--bg-secondary` (#111111) - Section backgrounds
3. `--bg-card` (#161616) - Cards, containers
4. `--bg-elevated` (#1f1f1f) - Dropdowns, modals

### Text Contrast

All text meets WCAG AA contrast ratios:
- Primary text (#ffffff) on card (#161616): 14.7:1
- Secondary text (#a0a0a0) on card (#161616): 6.5:1
- Tertiary text (#666666) on card (#161616): 3.3:1 (decorative only)

---

## Component Checklist

### Updated for Build Pivot

- [ ] Header navigation
- [ ] Hero section
- [ ] Build/Project cards
- [ ] Upgrade cards
- [ ] Parts cards
- [ ] Form inputs
- [ ] Buttons (all variants)
- [ ] Loading skeletons
- [ ] Empty states
- [ ] Error states
- [ ] Modals
- [ ] Tooltips

---

## Reference Apps

### GRAVL
- Clean card layouts
- Bold HP/performance numbers
- Clear categorization
- Premium feel

### FIXD
- Simple, focused UI
- Clear action hierarchy
- Data visualization
- Trust indicators

---

*This design system should evolve as the Build product matures.*
