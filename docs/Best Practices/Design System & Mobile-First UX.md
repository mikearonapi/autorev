# Universal Design System & Mobile-First UX Template

> **Purpose:** A complete, AI-parseable reference for building consistent, premium mobile-first applications. Copy this template into any new project and customize the values while keeping the structure.
>
> **Stack Optimized For:** Next.js 14+ (App Router), Tailwind CSS v4, Supabase, Vercel
>
> **Why This Exists:** AI coding assistants (Cursor, Copilot, Claude) generate inconsistent UI without explicit, structured documentation. This template provides unambiguous rules that prevent drift.

---

# How to Use This Template

1. **Copy this entire document** into your project at `/docs/DESIGN_SYSTEM.md`
2. **Customize Section 1.4 (Colors)** with your brand palette
3. **Customize Section 1.6 (Voice & Tone)** with your brand personality
4. **Reference this document** in your Cursor/AI system prompts
5. **Keep Quick Reference sections** accessible during development

**For AI Assistants:** This document contains explicit rules. When generating UI code, follow these specifications exactly. Do not deviate unless the user explicitly overrides.

---

# PART 1: Design System & Brand Guidelines

---

## 1.1 Design Tokens Architecture

### Why Design Tokens?

Design tokens are the single source of truth for visual decisions. They enable:
- **Consistency:** Same values everywhere, no drift
- **Theming:** Change tokens, entire UI updates
- **AI Parsability:** Explicit values, not subjective guidelines

### Three-Layer Token Architecture

This architecture is used by Radix, Shadcn/ui, and Material Design 3. Follow it exactly.

| Layer | Purpose | Naming Pattern | Example |
|-------|---------|----------------|---------|
| **Primitive** | Raw values without meaning | `--color-{hue}-{scale}` | `--color-blue-500` |
| **Semantic** | Contextual meaning | `--{role}` or `--{role}-{modifier}` | `--primary`, `--destructive` |
| **Component** | Scoped overrides (rare) | `--{component}-{property}` | `--button-radius` |

**Rule:** Components reference semantic tokens 95% of the time. Primitive tokens exist for defining semantics. Component tokens exist only for edge cases.

### Naming Conventions (Mandatory)

| Convention | Format | Example | Rationale |
|------------|--------|---------|-----------|
| Case | kebab-case | `--primary-foreground` | CSS standard, searchable |
| Pairing | background/foreground | `--card`, `--card-foreground` | Ensures contrast compliance |
| Primitives | category-hue-scale | `--color-blue-500` | Clear hierarchy |
| Semantics | role-based | `--destructive` not `--red-error` | Enables theming |
| Sizes | t-shirt sizing | `--radius-sm`, `--radius-lg` | Intuitive, bounded |

**Anti-Pattern Prevention:**
- ❌ `--btn-primary-bg` → ✅ `--primary` (component shouldn't define tokens)
- ❌ `--red-500` for errors → ✅ `--destructive` (semantic meaning)
- ❌ `--spacing-17` → ✅ Use scale values only (4, 8, 12, 16, 24, 32...)

### File Structure (Next.js + Tailwind v4)

```
src/
├── app/
│   ├── globals.css          # Token definitions + Tailwind imports
│   └── layout.tsx           # Font loading
├── components/
│   └── ui/                   # Shadcn-style components
└── lib/
    └── utils.ts              # cn() helper
```

### Complete Token Implementation

```css
/* globals.css */
@import "tailwindcss";

/* ============================================
   PRIMITIVE TOKENS
   Raw values - never use directly in components
   ============================================ */
:root {
  /* Color Primitives (12-step scale per Radix) */
  --color-gray-1: oklch(0.99 0 0);
  --color-gray-2: oklch(0.98 0 0);
  --color-gray-3: oklch(0.96 0 0);
  --color-gray-4: oklch(0.94 0 0);
  --color-gray-5: oklch(0.92 0 0);
  --color-gray-6: oklch(0.89 0 0);
  --color-gray-7: oklch(0.85 0 0);
  --color-gray-8: oklch(0.78 0 0);
  --color-gray-9: oklch(0.56 0 0);
  --color-gray-10: oklch(0.52 0 0);
  --color-gray-11: oklch(0.43 0 0);
  --color-gray-12: oklch(0.21 0 0);

  /* Brand Color Primitive (customize per project) */
  --color-brand-500: oklch(0.62 0.21 260);
  --color-brand-600: oklch(0.55 0.24 263);

  /* Spacing Primitives (4px base unit) */
  --spacing-0: 0;
  --spacing-1: 0.25rem;   /* 4px */
  --spacing-2: 0.5rem;    /* 8px */
  --spacing-3: 0.75rem;   /* 12px */
  --spacing-4: 1rem;      /* 16px */
  --spacing-5: 1.25rem;   /* 20px */
  --spacing-6: 1.5rem;    /* 24px */
  --spacing-8: 2rem;      /* 32px */
  --spacing-10: 2.5rem;   /* 40px */
  --spacing-12: 3rem;     /* 48px */
  --spacing-16: 4rem;     /* 64px */
  --spacing-20: 5rem;     /* 80px */
  --spacing-24: 6rem;     /* 96px */

  /* Radius Primitives */
  --radius-none: 0;
  --radius-sm: 0.25rem;   /* 4px */
  --radius-md: 0.375rem;  /* 6px */
  --radius-lg: 0.5rem;    /* 8px */
  --radius-xl: 0.75rem;   /* 12px */
  --radius-2xl: 1rem;     /* 16px */
  --radius-full: 9999px;

  /* Shadow Primitives */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
}

/* ============================================
   SEMANTIC TOKENS - LIGHT MODE
   Use these in components
   ============================================ */
:root {
  /* Backgrounds */
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);

  /* Card surfaces */
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);

  /* Popovers, dropdowns */
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);

  /* Primary action color (CUSTOMIZE THIS) */
  --primary: oklch(0.546 0.245 262.881);
  --primary-foreground: oklch(0.985 0 0);

  /* Secondary action color */
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);

  /* Muted backgrounds and text */
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);

  /* Accent for highlights */
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);

  /* Semantic: Destructive/Error */
  --destructive: oklch(0.577 0.245 27.325);
  --destructive-foreground: oklch(0.985 0 0);

  /* Semantic: Success */
  --success: oklch(0.723 0.191 142.5);
  --success-foreground: oklch(1 0 0);

  /* Semantic: Warning */
  --warning: oklch(0.828 0.189 84.429);
  --warning-foreground: oklch(0.28 0.07 46);

  /* Semantic: Info */
  --info: oklch(0.623 0.214 259.815);
  --info-foreground: oklch(1 0 0);

  /* UI Chrome */
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.546 0.245 262.881);

  /* Component defaults */
  --radius: 0.5rem;
}

/* ============================================
   SEMANTIC TOKENS - DARK MODE
   ============================================ */
.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);

  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);

  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);

  --primary: oklch(0.707 0.165 254.624);
  --primary-foreground: oklch(0.145 0 0);

  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);

  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);

  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);

  --destructive: oklch(0.704 0.191 22.216);
  --destructive-foreground: oklch(0.985 0 0);

  --success: oklch(0.723 0.191 142.5);
  --success-foreground: oklch(0.145 0 0);

  --warning: oklch(0.828 0.189 84.429);
  --warning-foreground: oklch(0.145 0 0);

  --info: oklch(0.707 0.165 254.624);
  --info-foreground: oklch(0.145 0 0);

  --border: oklch(0.269 0 0);
  --input: oklch(0.269 0 0);
  --ring: oklch(0.707 0.165 254.624);
}

/* ============================================
   TAILWIND THEME BRIDGE
   Maps CSS variables to Tailwind utilities
   ============================================ */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
  --color-info: var(--info);
  --color-info-foreground: var(--info-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
}
```

### Anti-Patterns to Prevent (AI Must Avoid)

| ❌ Never Do This | ✅ Always Do This | Why |
|------------------|-------------------|-----|
| `bg-blue-500` | `bg-primary` | Semantic tokens enable theming |
| `dark:bg-gray-900` | Let CSS variables handle it | Automatic dark mode |
| `style={{ color: '#333' }}` | `className="text-foreground"` | Maintains system |
| `className="text-[#1a73e8]"` | `className="text-primary"` | No arbitrary values |
| Creating new `--btn-*` tokens | Use semantic tokens | Avoid token sprawl |

---

## 1.2 Typography System

### Type Scale Philosophy

Use **Minor Third (1.2)** ratio for mobile readability, scaling to **Major Third (1.25)** on desktop for more dramatic hierarchy. This balance provides:
- Comfortable reading on small screens
- Clear visual hierarchy on large screens
- Mathematical consistency

### Complete Type Scale

| Token | Size | Line Height | Letter Spacing | Weight | Use Case |
|-------|------|-------------|----------------|--------|----------|
| `text-xs` | 12px | 1.5 (18px) | normal | 400 | Captions, legal, timestamps |
| `text-sm` | 14px | 1.5 (21px) | normal | 400/500 | Labels, metadata, secondary text |
| `text-base` | 16px | 1.5 (24px) | normal | 400 | **Body text (default)** |
| `text-lg` | 18px | 1.55 (28px) | normal | 400/500 | Lead paragraphs, emphasis |
| `text-xl` | 20px | 1.4 (28px) | normal | 500/600 | H6, card titles, subheadings |
| `text-2xl` | 24px | 1.35 (32px) | -0.01em | 600 | H5, section titles |
| `text-3xl` | 30px | 1.25 (38px) | -0.02em | 600/700 | H4, feature titles |
| `text-4xl` | 36px | 1.2 (43px) | -0.025em | 700 | H3, major sections |
| `text-5xl` | 48px | 1.1 (53px) | -0.025em | 700 | H2, page titles |
| `text-6xl` | 60px | 1.1 (66px) | -0.03em | 800 | H1, hero headlines |

### Line Height Rules (Critical)

**The Rule:** Line height ratio DECREASES as font size INCREASES.

| Font Size Range | Line Height | Tailwind | Rationale |
|-----------------|-------------|----------|-----------|
| 12-14px | 1.5-1.6 | `leading-relaxed` | Small text needs breathing room |
| 16-18px | 1.5 | `leading-normal` | Optimal body text reading |
| 20-24px | 1.35-1.4 | `leading-snug` | Subheadings stay compact |
| 30-48px | 1.1-1.25 | `leading-tight` | Large headings need tightening |
| 48px+ | 1.0-1.1 | `leading-none` | Display text stays cohesive |

### Letter Spacing Rules

| Context | Value | Tailwind | When to Apply |
|---------|-------|----------|---------------|
| Body text | 0 | `tracking-normal` | Default for all body copy |
| Large headings (36px+) | -0.025em | `tracking-tight` | Tighten for visual balance |
| Display text (48px+) | -0.05em | `tracking-tighter` | Hero headlines |
| ALL CAPS text | +0.05em | `tracking-wide` | Improves legibility |
| Small caps | +0.1em | `tracking-wider` | Required for readability |
| UI labels (small) | +0.01em | `tracking-wide` | Button text, nav items |

### Heading Implementation Patterns

```jsx
// H1 - Page hero headlines
<h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">

// H2 - Major page sections
<h2 className="text-3xl md:text-4xl font-semibold tracking-tight">

// H3 - Sub-sections
<h3 className="text-2xl md:text-3xl font-semibold">

// H4 - Card/feature titles
<h4 className="text-xl font-semibold">

// Body text
<p className="text-base leading-relaxed text-foreground">

// Secondary/muted text
<p className="text-sm text-muted-foreground">

// Caption/legal
<p className="text-xs text-muted-foreground">
```

### Responsive Typography (Fluid Scaling)

For display headings that need smooth scaling between breakpoints:

```css
/* Add to globals.css */
.text-fluid-hero {
  font-size: clamp(2.25rem, 1.5rem + 3vw, 3.75rem);
  /* 36px minimum → scales → 60px maximum */
}

.text-fluid-title {
  font-size: clamp(1.875rem, 1.25rem + 2.5vw, 3rem);
  /* 30px minimum → scales → 48px maximum */
}
```

**Critical:** Always combine `vw` with `rem` in `clamp()` for zoom accessibility.

### Font Loading (Next.js Best Practice)

```tsx
// app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',           // Shows fallback immediately
  variable: '--font-sans',   // CSS variable for Tailwind
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased bg-background text-foreground">
        {children}
      </body>
    </html>
  )
}
```

**Font Loading Rules:**
- `display: 'swap'` for body fonts (shows fallback immediately)
- `display: 'optional'` for decorative fonts (prevents layout shift)
- Import only required `subsets` (usually just `'latin'`)
- Use CSS variable for Tailwind integration

### Fallback Font Stack

```css
font-family: var(--font-sans), ui-sans-serif, system-ui, -apple-system, 
             BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", 
             Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
```

---

## 1.3 Spacing System

### Philosophy: The 4px Base Unit

All spacing values are multiples of **4px (0.25rem)**. This creates:
- Visual harmony through consistent rhythm
- Alignment with Material Design's 4dp grid
- Easy mental math (8, 16, 24, 32...)
- Pixel-perfect rendering on all screens

### Complete Spacing Scale

| Tailwind | Value | Pixels | Common Use Cases |
|----------|-------|--------|------------------|
| `0` | 0 | 0px | Reset, collapse |
| `0.5` | 0.125rem | 2px | Micro adjustments (rare) |
| `1` | 0.25rem | 4px | Icon internal padding, tight gaps |
| `1.5` | 0.375rem | 6px | Small button vertical padding |
| `2` | 0.5rem | 8px | Icon + text gap, related elements |
| `2.5` | 0.625rem | 10px | Compact UI spacing |
| `3` | 0.75rem | 12px | Input padding (vertical), button groups |
| `3.5` | 0.875rem | 14px | Compact card padding |
| `4` | 1rem | **16px** | **Standard gap, component padding** |
| `5` | 1.25rem | 20px | Medium spacing |
| `6` | 1.5rem | **24px** | Card padding, comfortable spacing |
| `7` | 1.75rem | 28px | Between form sections |
| `8` | 2rem | **32px** | Section transitions |
| `9` | 2.25rem | 36px | Large gaps |
| `10` | 2.5rem | 40px | Prominent spacing |
| `11` | 2.75rem | 44px | Touch target height |
| `12` | 3rem | **48px** | Major section breaks |
| `14` | 3.5rem | 56px | Large spacing |
| `16` | 4rem | **64px** | Page section spacing |
| `20` | 5rem | 80px | Hero sections |
| `24` | 6rem | 96px | Large hero spacing |
| `28` | 7rem | 112px | Maximum spacing |
| `32` | 8rem | 128px | Full-bleed sections |

### When to Use Padding vs Gap vs Margin

```
Need spacing?
│
├── INSIDE a component (content from edges)
│   └── Use PADDING
│       ├── Button: px-4 py-2
│       ├── Card: p-4 or p-6
│       ├── Input: px-3 py-2
│       └── Modal: p-6
│
├── BETWEEN siblings in flex/grid
│   └── Use GAP (preferred)
│       ├── Form fields: gap-4
│       ├── Button row: gap-3
│       ├── Card grid: gap-4 md:gap-6
│       └── Nav items: gap-6
│
└── BETWEEN unrelated elements (margin as last resort)
    └── Use MARGIN
        ├── Between paragraphs: space-y-4 (or mb-4)
        ├── Section spacing: my-16
        └── Centering: mx-auto
```

**Best Practice:** Prefer `gap` over margins for sibling spacing. It's more predictable and doesn't collapse.

### Component Spacing Reference (Copy-Paste Ready)

```markdown
## COMPONENT INTERNAL PADDING

Button (default):     px-4 py-2       (16px × 8px)
Button (small):       px-3 py-1.5     (12px × 6px)
Button (large):       px-6 py-3       (24px × 12px)
Button (icon only):   p-2             (8px, visual) → h-10 w-10 (touch target)

Input field:          px-3 py-2       (12px × 8px)
Input (large):        px-4 py-3       (16px × 12px)

Card content:         p-4             (16px) — compact
Card content:         p-6             (24px) — comfortable

Modal content:        p-6             (24px)
Modal header:         px-6 py-4       (24px × 16px)
Modal footer:         px-6 py-4       (24px × 16px)

Dropdown item:        px-3 py-2       (12px × 8px)
List item (touch):    px-4 py-3       (16px × 12px)

Badge:                px-2.5 py-0.5   (10px × 2px)
Badge (large):        px-3 py-1       (12px × 4px)

## LAYOUT GAPS

Form field stack:     gap-4           (16px)
Form sections:        gap-8           (32px)

Inline buttons:       gap-2 or gap-3  (8px or 12px)

Card grid:            gap-4 md:gap-6  (16px → 24px)

Navigation items:     gap-1 or gap-2  (4px or 8px) — vertical
Navigation items:     gap-4 or gap-6  (16px or 24px) — horizontal

Icon + text:          gap-2           (8px)
Icon + text (small):  gap-1.5         (6px)

Page sections:        gap-16 or py-16 (64px)
Hero to content:      gap-20 or pt-20 (80px)

## SCREEN EDGE MARGINS

Mobile:               px-4            (16px)
Tablet:               px-6            (24px)
Desktop:              px-8            (32px)

Full pattern:         px-4 md:px-6 lg:px-8

Container max-width:  max-w-7xl mx-auto px-4 md:px-6 lg:px-8
```

---

## 1.4 Color System

### Palette Architecture

Every color system needs these categories:

| Category | Purpose | Tokens |
|----------|---------|--------|
| **Primary** | Main brand/action color | `--primary`, `--primary-foreground` |
| **Secondary** | Supporting actions | `--secondary`, `--secondary-foreground` |
| **Neutral** | Text, backgrounds, borders | `--background`, `--foreground`, `--muted`, `--border` |
| **Destructive** | Errors, delete actions | `--destructive`, `--destructive-foreground` |
| **Success** | Confirmations, positive states | `--success`, `--success-foreground` |
| **Warning** | Cautions, pending states | `--warning`, `--warning-foreground` |
| **Info** | Informational, neutral alerts | `--info`, `--info-foreground` |

### 12-Step Color Scale (Radix Pattern)

When defining your brand color, create a 12-step scale:

| Step | Light Mode Purpose | Dark Mode Purpose |
|------|-------------------|-------------------|
| 1 | App background | Subtle background |
| 2 | Subtle background | Background |
| 3 | UI element background | Elevated background |
| 4 | Hovered UI element | Hovered element |
| 5 | Active/selected element | Active element |
| 6 | Subtle borders | Subtle borders |
| 7 | UI element border | UI element border |
| 8 | Hovered borders | Hovered borders |
| 9 | **Solid backgrounds** | **Solid backgrounds** |
| 10 | Hovered solid | Hovered solid |
| 11 | Low-contrast text | Low-contrast text |
| 12 | High-contrast text | High-contrast text |

### WCAG Contrast Requirements (Non-Negotiable)

| Element Type | Minimum Ratio | Standard |
|--------------|---------------|----------|
| Normal text (<18px or <14px bold) | **4.5:1** | WCAG AA |
| Large text (≥18px or ≥14px bold) | **3:1** | WCAG AA |
| UI components & graphics | **3:1** | WCAG 2.1 |
| Disabled elements | Exempt | N/A |
| Decorative elements | Exempt | N/A |

**Testing Tools:**
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- Chrome DevTools: Inspect element → Color picker shows contrast
- Figma: Stark plugin

### Color Usage Decision Tree

```
What are you coloring?
│
├── Page background
│   └── bg-background
│
├── Card/Panel/Modal surface
│   └── bg-card text-card-foreground
│
├── Primary action button
│   └── bg-primary text-primary-foreground hover:bg-primary/90
│
├── Secondary action button
│   └── bg-secondary text-secondary-foreground hover:bg-secondary/80
│
├── Destructive action
│   └── bg-destructive text-destructive-foreground hover:bg-destructive/90
│
├── Ghost/Subtle button
│   └── hover:bg-accent text-accent-foreground
│
├── Body text
│   └── text-foreground
│
├── Secondary/muted text
│   └── text-muted-foreground
│
├── Disabled text
│   └── text-muted-foreground (+ opacity-50 on element)
│
├── Borders (general)
│   └── border-border
│
├── Input borders
│   └── border-input (+ focus:ring-ring)
│
├── Focus indicators
│   └── ring-ring ring-offset-2
│
├── Success state
│   └── text-success OR bg-success text-success-foreground
│
├── Warning state
│   └── text-warning OR bg-warning text-warning-foreground
│
└── Error state
    └── text-destructive OR border-destructive
```

### Preventing Color Drift (AI Rules)

**Cursor/AI must follow these rules:**

1. **ALWAYS use semantic tokens** — never `bg-blue-500`, always `bg-primary`
2. **ALWAYS pair colors** — `bg-primary` requires `text-primary-foreground`
3. **NEVER add manual dark mode** — CSS variables handle it automatically
4. **NEVER use hardcoded hex** — no `#1a73e8` in components
5. **NEVER use arbitrary colors** — no `bg-[#custom]`
6. **NEVER mix systems** — don't combine Tailwind palette (`blue-500`) with tokens

### Light/Dark Mode Switching

```tsx
// components/theme-toggle.tsx
import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  
  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      Toggle theme
    </button>
  )
}
```

```tsx
// app/layout.tsx
import { ThemeProvider } from 'next-themes'

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

---

## 1.5 Component Style Specifications

### Component Anatomy

Every component has:
- **Sizes:** sm, default, lg (minimum), sometimes xs, xl
- **Variants:** visual style options (solid, outline, ghost, etc.)
- **States:** default, hover, active, focus, disabled, loading

### Button Specifications

**Sizes:**
| Size | Height | Horizontal Padding | Font Size | Icon Size | Tailwind |
|------|--------|-------------------|-----------|-----------|----------|
| sm | 32px | 12px | 14px | 16px | `h-8 px-3 text-sm` |
| default | 40px | 16px | 14px | 16px | `h-10 px-4 text-sm` |
| lg | 48px | 24px | 16px | 20px | `h-12 px-6 text-base` |
| icon | 40px | - | - | 20px | `h-10 w-10 p-0` |

**Variants:**
```tsx
const buttonVariants = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  link: "text-primary underline-offset-4 hover:underline",
}
```

**States:**
| State | Visual Changes | Cursor | Interaction |
|-------|----------------|--------|-------------|
| Default | Base appearance | pointer | Clickable |
| Hover | 10% darker (opacity 90) | pointer | — |
| Active/Pressed | 20% darker + subtle scale(0.98) | pointer | — |
| Focus | 2px ring, 2px offset | — | Keyboard navigation |
| Disabled | 50% opacity | not-allowed | pointer-events-none |
| Loading | Spinner + "Loading..." text | not-allowed | pointer-events-none |

### Input Specifications

**Base Styles:**
```tsx
const inputBase = `
  flex w-full rounded-md border border-input bg-background 
  px-3 py-2 text-sm 
  ring-offset-background 
  placeholder:text-muted-foreground 
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 
  disabled:cursor-not-allowed disabled:opacity-50
`
```

**Sizes:**
| Size | Height | Padding | Tailwind |
|------|--------|---------|----------|
| sm | 32px | 8px 12px | `h-8 px-3 py-1.5 text-sm` |
| default | 40px | 8px 12px | `h-10 px-3 py-2 text-sm` |
| lg | 48px | 12px 16px | `h-12 px-4 py-3 text-base` |

**States:**
| State | Visual Changes |
|-------|----------------|
| Default | `border-input` |
| Hover | `border-input` (no change, or subtle darkening) |
| Focus | `ring-2 ring-ring ring-offset-2` |
| Error | `border-destructive ring-destructive` |
| Disabled | `opacity-50 cursor-not-allowed` |

### Focus Ring Standard (Global)

```tsx
// Use on all interactive elements
const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
```

### Animation Standards

| Type | Duration | Easing | Use Case |
|------|----------|--------|----------|
| Micro-interaction | 150ms | ease-out | Button press, toggle flip |
| State transition | 200ms | ease-in-out | Hover effects, color changes |
| Enter animation | 200-300ms | ease-out | Modal open, dropdown appear |
| Exit animation | 150-200ms | ease-in | Modal close, dismiss |
| Page transition | 300-500ms | ease-in-out | Route changes |
| Skeleton shimmer | 1.5-2s | linear | Loading states |

**Tailwind Implementation:**
```tsx
// Quick state changes
"transition-colors duration-200"

// Multiple property changes
"transition-all duration-200"

// Transform animations
"transition-transform duration-150"

// Deliberate animations
"transition-all duration-300 ease-in-out"
```

### Icon Sizing Rules

| Context | Icon Size | Tailwind | Gap with Text |
|---------|-----------|----------|---------------|
| Inline with text-xs | 12px | `h-3 w-3` | `gap-1` |
| Inline with text-sm | 14px | `h-3.5 w-3.5` | `gap-1.5` |
| Inline with text-base | 16px | `h-4 w-4` | `gap-2` |
| Button (sm) | 14px | `h-3.5 w-3.5` | `gap-1.5` |
| Button (default) | 16px | `h-4 w-4` | `gap-2` |
| Button (lg) | 20px | `h-5 w-5` | `gap-2` |
| Navigation | 20-24px | `h-5 w-5` to `h-6 w-6` | `gap-3` |
| Feature highlight | 24-32px | `h-6 w-6` to `h-8 w-8` | — |
| Hero/illustration | 48px+ | `h-12 w-12`+ | — |

---

## 1.6 Voice & Tone Guidelines

> **Customize this section for your brand's personality.**

### Defining Your Voice

Choose 3-4 personality attributes that define how your product speaks:

| Attribute | How It Sounds | Avoid |
|-----------|---------------|-------|
| **Knowledgeable** | Confident, specific, precise | Hedging, "maybe", uncertainty |
| **Friendly** | Warm, approachable, conversational | Cold, robotic, formal |
| **Helpful** | Clear guidance, actionable | Jargon without context |
| **Professional** | Polished, no typos, proper grammar | Slang, excessive exclamation |
| **Playful** | Wit, personality, delight | Forced humor, memes |
| **Trustworthy** | Honest, transparent, reliable | Hype, overselling |

### Microcopy Patterns

**Button Labels:**
| Action Type | ❌ Avoid | ✅ Use |
|-------------|---------|-------|
| Submit form | "Submit" | "Save Changes" / "Create Account" |
| Delete | "Delete" | "Remove Item" / "Delete Project" |
| Cancel | "Cancel" | "Cancel" or "Go Back" |
| Confirm danger | "OK" / "Yes" | "Yes, Delete" / "Confirm Removal" |
| Loading | "Loading..." | "Saving..." / "Creating..." |
| Next step | "Next" | "Continue" / "Next: Review" |

**Empty States:**
```
[Icon or illustration]

No [items] yet

[One sentence explaining benefit of adding items]

[+ Primary Action Button]
```

Example:
```
📦

No projects yet

Create your first project to start tracking progress.

[+ Create Project]
```

**Error Messages:**

| ❌ Bad | ✅ Good |
|--------|---------|
| "Error 500" | "Something went wrong. Please try again." |
| "Invalid input" | "Please enter a valid email address" |
| "Validation failed" | "Password must be at least 8 characters" |
| "Network error" | "Can't connect. Check your connection and try again." |
| "Unauthorized" | "Please sign in to continue" |
| "404" | "We couldn't find that page" |

**Success Messages:**
- Brief: "Saved" / "Done" / "Sent"
- Specific: "Project created" / "Changes saved"
- Celebratory (milestones): "🎉 First project created!"

### Tone Consistency Rules (For AI)

1. **Active voice:** "Save your changes" not "Your changes will be saved"
2. **Direct address:** "Your projects" not "User projects"
3. **Specific actions:** "Add your first item" not "Get started"
4. **Front-load verbs:** "Delete this project?" not "Are you sure you want to delete?"
5. **Match urgency to context:** Errors = direct; Onboarding = encouraging
6. **No exclamation inflation:** Maximum one "!" per screen

---

## 1.7 Quick Reference Card

Copy this into every project for rapid AI reference:

```markdown
# Design System Quick Reference

## Colors
Background/surface: bg-background, bg-card, bg-popover
Text: text-foreground, text-muted-foreground
Primary action: bg-primary text-primary-foreground
Secondary: bg-secondary text-secondary-foreground
Destructive: bg-destructive text-destructive-foreground
Borders: border-border, border-input
Focus: ring-ring ring-offset-2

## Typography
Body: text-base (16px) leading-relaxed
Small: text-sm text-muted-foreground
Headings: text-xl to text-5xl font-semibold tracking-tight

## Spacing
Form fields: gap-4 (16px)
Buttons inline: gap-2 or gap-3
Card padding: p-4 or p-6
Section spacing: py-16 (64px)
Screen edges: px-4 md:px-6 lg:px-8
Icon + text: gap-2

## Component Heights
Button sm: h-8 (32px)
Button default: h-10 (40px)
Button lg: h-12 (48px)
Input: h-10 (40px)
Touch target minimum: h-11 (44px)

## States
Hover: hover:bg-primary/90
Focus: focus-visible:ring-2 ring-ring ring-offset-2
Disabled: opacity-50 cursor-not-allowed pointer-events-none
Transitions: transition-colors duration-200

## Rules
1. Never use hardcoded colors (no #hex, no bg-blue-500)
2. Always pair bg-* with text-*-foreground
3. Touch targets minimum 44px (h-11)
4. Use gap for spacing between elements
5. No manual dark: classes for semantic colors
```

---

# PART 2: Mobile-First UX Patterns

---

## 2.1 Touch Target Standards

### Minimum Sizes (Non-Negotiable)

| Standard | Size | Physical Size | Source |
|----------|------|---------------|--------|
| Apple HIG | 44×44 pt | ~7mm | iOS Human Interface Guidelines |
| Material Design | 48×48 dp | ~9mm | Google Material Design 3 |
| WCAG 2.2 AA | 24×24 CSS px | ~6mm | Web accessibility minimum |
| **Recommended** | **48×48 px** | **~9mm** | Best practice for all platforms |

**The Rule:** Every interactive element must have a minimum **44×44px** touch target. Visual size can be smaller if touch area is padded.

### Implementation Patterns

```jsx
// Icon button with proper touch target
// Visual: 20px icon, Touch: 44px target
<button className="h-11 w-11 flex items-center justify-center rounded-md hover:bg-accent">
  <Icon className="h-5 w-5" />
</button>

// Small visual button with expanded touch area
<button className="h-11 px-3 inline-flex items-center text-sm">
  Learn more
</button>

// Link with touch padding
<a className="inline-flex items-center h-11 px-2 -mx-2 rounded-md hover:bg-accent">
  View details
</a>
```

### Spacing Between Touch Targets

| Scenario | Minimum Gap | Tailwind | Rationale |
|----------|-------------|----------|-----------|
| Adjacent buttons | 8px | `gap-2` | Prevents accidental taps |
| List items | 0px | Natural padding provides separation | Items are full-width |
| Icon buttons | 8-12px | `gap-2` or `gap-3` | Small targets need more space |
| Critical vs non-critical | 16px+ | `gap-4` | Protect destructive actions |

### Thumb Zone Mapping

```
┌─────────────────────────────────┐
│       ⛔ HARD TO REACH          │  ← Avoid primary actions
│         (top corners)           │     Status bar, settings icon OK
├─────────────────────────────────┤
│       🟡 STRETCH ZONE           │  ← Secondary actions acceptable
│      (top-center, sides)        │     Search, filters, sorting
├─────────────────────────────────┤
│       🟢 NATURAL ZONE           │  ← Content consumption
│         (middle area)           │     Scrolling, reading, cards
├─────────────────────────────────┤
│       🟢 EASY ACCESS            │  ← PRIMARY ACTIONS HERE
│         (bottom half)           │     Main CTAs, FABs
├─────────────────────────────────┤
│    [Tab] [Tab] [FAB] [Tab]      │  ← Bottom navigation
│         (most reachable)        │     Always accessible
└─────────────────────────────────┘
```

**Placement Rules:**
- Primary actions: Bottom 40% of screen
- Floating Action Button (FAB): Bottom-right (right thumb dominant)
- Navigation: Fixed bottom tab bar
- Destructive actions: NOT in easy-tap zones
- Cancel/Back: Less accessible than Confirm/Next

### Tap vs Gesture Decision Matrix

| Use TAP | Use SWIPE | Use LONG-PRESS |
|---------|-----------|----------------|
| Discrete action | List item actions (delete/archive) | Context menus |
| Navigation | Carousel/gallery browsing | Multi-select mode |
| Toggle state | Pull-to-refresh | Reordering items |
| Form submission | Dismiss bottom sheet/modal | Preview content |
| Button clicks | Pan/scroll | Drag-and-drop initiation |

---

## 2.2 Gesture Patterns

### Standard Gesture Vocabulary

| Gesture | Action | Platform Considerations |
|---------|--------|------------------------|
| **Tap** | Select, activate, toggle | Universal |
| **Double-tap** | Zoom, like (social context) | Don't repurpose for other actions |
| **Long-press** | Context menu, selection mode | iOS: ~500ms, Android: ~400ms |
| **Swipe L/R** | Reveal actions, navigate | iOS edge-swipe = back navigation |
| **Swipe down** | Close modal, pull-to-refresh | Context-dependent |
| **Swipe up** | Open bottom sheet, dismiss keyboard | Context-dependent |
| **Pinch/spread** | Zoom in/out | Maps, images, PDFs only |
| **Pan** | Scroll, move viewport | Default scrolling behavior |

### When to Use Each Gesture

**Pull-to-Refresh:**
- ✅ Social feeds, message lists, notifications, news feeds
- ✅ Any list where new content may have appeared
- ❌ Maps (no clear "top"), static content, paginated tables

**Swipe Actions (iOS-style):**
- ✅ Email actions (archive, delete, snooze)
- ✅ List item quick actions (edit, share, delete)
- ✅ Dismissing cards/notifications
- ❌ Primary navigation, critical actions without confirmation

**Long-Press:**
- ✅ Context menus (share, copy, edit)
- ✅ Entering selection/edit mode
- ✅ Link preview (peek)
- ✅ Reorder initiation
- ❌ Primary actions (low discoverability)

### Making Gestures Discoverable

| Technique | Implementation | When to Use |
|-----------|----------------|-------------|
| Visual hint on first use | Animated hand showing swipe direction | Onboarding |
| Visible alternatives | Delete button + swipe-to-delete | Always available |
| Partial reveal | Show action peek on partial swipe | List items |
| Tooltip on long-press | "Hold to reorder" tooltip | Complex interactions |
| Haptic feedback | Vibration on gesture recognition | Confirms action |

### Gesture Conflict Prevention

| Conflict | Problem | Solution |
|----------|---------|----------|
| Horizontal swipe + horizontal scroll | User can't swipe action on carousel | Use vertical swipe, or different trigger |
| Edge swipe + iOS back gesture | App gesture interferes with system | Inset gesture area 20px from edge |
| Pull-to-refresh + scrollable content | Refresh triggers mid-scroll | Only enable at scroll position 0 |
| Swipe-to-dismiss + swipe carousel | User accidentally dismisses | Use explicit X button instead |
| Long-press + text selection | Conflicting behaviors | Define clear zones for each |

---

## 2.3 Mobile Navigation Patterns

### Navigation Pattern Decision Tree

```
How many primary destinations?
│
├── 2-3 destinations
│   └── Bottom Tab Bar (simple)
│       └── All tabs always visible
│       └── No "More" menu needed
│
├── 4-5 destinations
│   └── Bottom Tab Bar (full)
│       └── Maximum 5 tabs
│       └── Icon + label for each
│       └── Consider if 5th can be "More"
│
├── 5-8 destinations
│   └── Tab Bar + More Menu
│       └── 4 primary tabs visible
│       └── 5th tab = "More" containing rest
│
├── 8+ destinations OR deep hierarchy
│   └── Hamburger + Tab Bar
│       └── Bottom tabs for primary
│       └── Hamburger for secondary/settings
│
└── Single primary action focus
    └── FAB (Floating Action Button)
        └── One prominent "+ Create" action
        └── Optionally combine with tab bar
```

### Bottom Tab Bar Specifications

```jsx
<nav className="fixed bottom-0 inset-x-0 h-16 bg-background border-t border-border 
                pb-safe flex items-center justify-around z-50">
  <TabItem icon={Home} label="Home" href="/" active={isActive('/')} />
  <TabItem icon={Search} label="Search" href="/search" active={isActive('/search')} />
  <TabItem icon={Plus} label="Create" href="/create" primary />
  <TabItem icon={Bell} label="Activity" href="/activity" badge={3} />
  <TabItem icon={User} label="Profile" href="/profile" />
</nav>
```

**Tab Bar Rules:**
- Maximum **5 items** (3-4 is optimal)
- **Always show icon + text label** (34% fewer errors with labels)
- Active state: filled icon + primary color
- Height: **64px minimum** (plus safe area padding)
- Fixed position, always visible
- Badge count for notifications (number or dot)

### Hamburger Menu: When Acceptable

| ✅ Use Hamburger For | ❌ Don't Hide Here |
|---------------------|-------------------|
| Settings/preferences | Primary navigation |
| Help/support | Core features |
| Legal/terms | Frequently used actions |
| Account management | Search |
| Feature toggles | Notifications |

**Discoverability Warning:** Hamburger menus have **57% engagement** vs **86% for visible tabs**.

### Back Navigation Patterns

| Platform | Back Behavior | Implementation |
|----------|---------------|----------------|
| iOS | Swipe from left edge OR back button top-left | System handles edge swipe |
| Android | System back button (hardware/gesture) | Handle `backHandler` |
| PWA | No system back — must provide explicit button | Always show back button in header |
| Web | Browser back button | Ensure proper history management |

**PWA Back Navigation:**
```jsx
<header className="sticky top-0 flex items-center h-14 px-4 bg-background border-b z-40">
  <Button variant="ghost" size="icon" onClick={() => router.back()}>
    <ChevronLeft className="h-5 w-5" />
  </Button>
  <h1 className="ml-2 text-lg font-semibold truncate">Page Title</h1>
  <div className="ml-auto flex items-center gap-2">
    {/* Action buttons */}
  </div>
</header>
```

### Deep Linking & Navigation State

- Preserve scroll position on back navigation
- Support direct URL access to any screen
- Handle missing/invalid routes gracefully
- Show loading states during navigation
- Maintain form state across navigation

---

## 2.4 Responsive Breakpoint Strategy

### Breakpoint Definitions

| Name | Width | Target Devices | Tailwind Prefix |
|------|-------|----------------|-----------------|
| Base | 0-639px | Phones (portrait) | (default) |
| `sm` | 640px+ | Large phones (landscape) | `sm:` |
| `md` | 768px+ | Tablets (portrait) | `md:` |
| `lg` | 1024px+ | Tablets (landscape), small laptops | `lg:` |
| `xl` | 1280px+ | Desktops | `xl:` |
| `2xl` | 1536px+ | Large desktops | `2xl:` |

### What Changes at Each Breakpoint

| Aspect | Mobile (0-639) | Tablet (768+) | Desktop (1024+) |
|--------|----------------|---------------|-----------------|
| **Layout** | Single column | 2 columns | Multi-column, sidebar |
| **Navigation** | Bottom tabs | Bottom tabs or sidebar | Top nav or sidebar |
| **Touch/Hover** | Touch only | Touch primary | Hover states active |
| **Content density** | Progressive disclosure | More visible | Full content |
| **Cards per row** | 1-2 | 2-3 | 3-4 |
| **Modal style** | Full-screen | Centered dialog | Centered dialog |
| **Form layout** | Stacked | Side-by-side possible | Multi-column forms |

### Mobile-First CSS Approach

**Always write base styles for mobile, then add larger breakpoint overrides:**

```jsx
// ✅ CORRECT: Mobile-first
<div className="flex flex-col md:flex-row gap-4 md:gap-6">
  <div className="w-full md:w-1/3">Sidebar</div>
  <div className="w-full md:w-2/3">Content</div>
</div>

// ❌ WRONG: Desktop-first
<div className="flex flex-row max-md:flex-col gap-6 max-md:gap-4">
```

**Pattern:** `base-mobile md:tablet lg:desktop`

### Common Responsive Patterns

```jsx
// Grid that adapts to screen size
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">

// Stack to row
<div className="flex flex-col sm:flex-row gap-4">

// Hide on mobile, show on desktop
<div className="hidden md:block">Desktop only</div>
<div className="md:hidden">Mobile only</div>

// Responsive padding
<div className="px-4 md:px-6 lg:px-8">

// Responsive text
<h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
```

### Testing Matrix

| Priority | Viewport | Device Example | Test For |
|----------|----------|----------------|----------|
| **P0** | 375×667 | iPhone SE/8 | Minimum viable width |
| **P0** | 390×844 | iPhone 14/15 | Most common iPhone |
| **P0** | 768×1024 | iPad (portrait) | Tablet breakpoint |
| P1 | 320×568 | Small Android | Edge case minimum |
| P1 | 428×926 | iPhone Pro Max | Large phone |
| P1 | 1024×768 | iPad (landscape) | Tablet landscape |
| P2 | 1440×900 | MacBook Pro | Desktop reference |
| P2 | 1920×1080 | Desktop monitor | Large desktop |

---

## 2.5 Mobile Content Hierarchy

### Progressive Disclosure Patterns

| Pattern | Use Case | Implementation |
|---------|----------|----------------|
| **Accordion** | FAQs, settings, specs | Tap header to expand/collapse |
| **Tabs** | Categorized same-level content | Horizontal swipe or tap to switch |
| **"Show more"** | Long text, list truncation | Inline expansion button |
| **Bottom sheet** | Filters, options, actions | Slide up from bottom |
| **Full-screen modal** | Complex sub-flows | Navigate into, back to dismiss |
| **Drawer** | Navigation, filters | Slide in from edge |

### Information Density Guidelines

| Element | Mobile | Desktop | Rationale |
|---------|--------|---------|-----------|
| Body text | 16px minimum | 14-16px | Small screens need larger text |
| Line length | 45-75 characters | 65-90 characters | Optimal reading width |
| Cards per row | 1-2 | 3-4 | Touch targets, readability |
| Table columns | 2-3 visible | All columns | Horizontal scroll for more |
| Whitespace | More generous | Can be tighter | Touch separation |
| Actions per card | 1-2 visible | More visible | Progressive disclosure |

### Truncation Rules

| Content Type | Truncation Point | Behavior |
|--------------|------------------|----------|
| Card descriptions | 2-3 lines | "..." + tap to expand |
| List item subtitles | 1 line | "..." (detail on tap) |
| Table cells | 1 line | Tooltip on hover/tap |
| Usernames | ~15 characters | "..." |
| Tags | Show 2-3 + "+N more" | Expand on tap |

**Never Truncate:**
- Prices and totals
- Dates and times
- CTAs and button labels
- Error messages
- Critical warnings

### Scroll Behavior Best Practices

- **Preserve scroll position** when returning from detail view
- **Pull-to-refresh** only at top of scrollable content
- **Infinite scroll** for feeds; pagination for data tables
- **Sticky headers** for long lists with sections
- **"Back to top"** button after significant scroll (>2 screens)
- **Floating CTA** for long pages (e.g., "Add to Cart" always visible)

---

## 2.6 Mobile Form UX

### Input Type Reference

| Field Type | Input Type | Keyboard | Autocomplete |
|------------|------------|----------|--------------|
| Email | `email` | Email (@ . .com) | `email` |
| Phone | `tel` | Phone pad | `tel` |
| Credit card | `text` + `inputmode="numeric"` | Number pad | `cc-number` |
| CVV | `text` + `inputmode="numeric"` | Number pad | `cc-csc` |
| ZIP/Postal | `text` + `inputmode="numeric"` | Number pad | `postal-code` |
| Password | `password` | Standard | `current-password` |
| New password | `password` | Standard | `new-password` |
| Search | `search` | Standard + Search btn | — |
| URL | `url` | URL keyboard | `url` |
| Number (qty) | `number` | Number with +/- | — |
| One-time code | `text` + `inputmode="numeric"` | Number pad | `one-time-code` |

### Form Field Implementation

```jsx
<div className="space-y-2">
  <Label htmlFor="email">Email address</Label>
  <Input
    id="email"
    name="email"
    type="email"
    inputMode="email"
    autoComplete="email"
    placeholder="you@example.com"
    required
    className="h-11"  // 44px touch target
    aria-describedby="email-help"
  />
  <p id="email-help" className="text-sm text-muted-foreground">
    We'll never share your email.
  </p>
</div>
```

**Form Field Rules:**
- Height: **44px minimum** (`h-11`) for touch targets
- Labels: **Above** field, not floating or inline
- Placeholder: Format hints only, never replace labels
- Help text: Below input, before error state
- Required indicator: Asterisk or "(required)" in label

### Validation Timing

| Event | Validation Behavior |
|-------|---------------------|
| On blur (leave field) | Validate completed field |
| On submit | Validate all fields, focus first error |
| On input (typing) | Only clear existing errors (don't show new errors while typing) |
| Empty required field | Wait until blur or submit |

**Error State:**
```jsx
<div className="space-y-2">
  <Label htmlFor="email" className="text-destructive">Email address</Label>
  <Input
    id="email"
    type="email"
    className="h-11 border-destructive focus-visible:ring-destructive"
    aria-invalid="true"
    aria-describedby="email-error"
  />
  <p id="email-error" className="text-sm text-destructive">
    Please enter a valid email address
  </p>
</div>
```

### Multi-Step Form Pattern

```jsx
// Progress indicator
<div className="flex items-center justify-between px-4 py-3">
  {steps.map((step, i) => (
    <React.Fragment key={i}>
      <div className={cn(
        "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
        i < currentStep && "bg-primary text-primary-foreground",
        i === currentStep && "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2",
        i > currentStep && "bg-muted text-muted-foreground"
      )}>
        {i < currentStep ? <Check className="h-4 w-4" /> : i + 1}
      </div>
      {i < steps.length - 1 && (
        <div className={cn(
          "flex-1 h-0.5 mx-2",
          i < currentStep ? "bg-primary" : "bg-muted"
        )} />
      )}
    </React.Fragment>
  ))}
</div>
```

**Multi-Step Rules:**
- Show progress clearly (steps completed / total)
- Allow back navigation without losing data
- Persist form state (localStorage or state management)
- Show step titles/labels
- Summarize before final submission

### Password Manager Compatibility

Required for autofill and password saving to work:

1. **Use `<form>` element** — wrap all related inputs
2. **Stable `id` and `name` attributes** — no dynamic generation
3. **Correct `autocomplete` values:**
   - `username` for username/email login field
   - `current-password` for existing password
   - `new-password` for password creation
4. **Visible `<label>` elements** — linked via `htmlFor`
5. **Don't use `autocomplete="off"`** on password fields
6. **Keep submit button inside form**

---

## 2.7 Performance as UX

### Loading State Decision Tree

```
Expected duration?
│
├── < 100ms (instant)
│   └── Show NOTHING
│       └── User won't perceive delay
│
├── 100ms - 500ms (quick)
│   └── SUBTLE FEEDBACK
│       └── Button: slight opacity change
│       └── Text: "..." or spinner icon
│
├── 500ms - 2s (noticeable)
│   └── SKELETON SCREEN
│       └── Show content structure
│       └── Shimmer animation
│
├── 2s - 10s (long)
│   └── PROGRESS INDICATOR
│       └── Show percentage if known
│       └── Explain what's happening
│
└── > 10s (very long)
    └── BACKGROUND PROCESS
        └── Show notification when complete
        └── Provide cancel option
```

### Skeleton Screen Specifications

```jsx
function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      "animate-pulse rounded-md bg-muted",
      className
    )} />
  )
}

// Card skeleton
function CardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <Skeleton className="h-5 w-1/3" />       {/* Title */}
      <Skeleton className="h-4 w-full" />      {/* Description line 1 */}
      <Skeleton className="h-4 w-4/5" />       {/* Description line 2 */}
      <div className="flex gap-2 pt-4">
        <Skeleton className="h-9 w-20" />      {/* Button */}
        <Skeleton className="h-9 w-20" />      {/* Button */}
      </div>
    </div>
  )
}
```

**Skeleton Rules:**
- Match actual content structure (not generic placeholder)
- Use subtle shimmer animation (1.5-2s cycle)
- Wider blocks for images, thin lines for text
- Minimum 300ms display (avoid flash)
- Transition smoothly to real content

### Optimistic UI Pattern

Show the result immediately, sync in background, rollback on error:

```tsx
async function handleLike() {
  // 1. Update UI immediately (optimistic)
  setLiked(true);
  setLikeCount(prev => prev + 1);
  
  try {
    // 2. Sync with server
    await api.like(itemId);
  } catch (error) {
    // 3. Rollback on failure
    setLiked(false);
    setLikeCount(prev => prev - 1);
    toast.error("Couldn't save. Please try again.");
  }
}
```

**Use Optimistic UI For:**
- Likes, saves, bookmarks, favorites
- Toggles and preferences
- Adding items to lists/carts
- Form field changes
- Any action with >95% success rate

**Don't Use For:**
- Payments and transactions
- Deletions (show confirmation first)
- Actions with significant failure rates
- Operations requiring server validation

### Image Loading Strategy

```jsx
import Image from 'next/image'

// Above-fold hero: load immediately with blur
<Image
  src={heroImage}
  alt="Hero"
  width={1200}
  height={600}
  priority                    // No lazy loading
  placeholder="blur"          // Show blur while loading
  blurDataURL={blurHash}      // Generated blur hash
/>

// Below-fold: lazy load
<Image
  src={productImage}
  alt="Product"
  width={400}
  height={400}
  loading="lazy"             // Default lazy loading
  placeholder="blur"
  blurDataURL={blurHash}
/>
```

**Image Rules:**
- `priority` for above-fold images (LCP candidates)
- Always provide `width` and `height` OR use `fill` prop
- Use blur placeholder for perceived performance
- Lazy load everything below the fold
- Use appropriate formats (WebP, AVIF where supported)

---

## 2.8 Mobile QA Checklist

### Device Testing Matrix

| Tier | Devices | Coverage Goal |
|------|---------|---------------|
| **P0 (Required)** | iPhone 14/15, Samsung Galaxy S23/S24, Pixel 8 | Flagship reference devices |
| **P1 (Important)** | iPhone SE (small screen), iPad, Galaxy A54 (mid-range Android) | Size and performance variety |
| **P2 (Nice to have)** | iPhone 12/13, Pixel 6, Budget Android | Older flagships, budget devices |

### Pre-Launch Checklist

#### Viewport Testing
- [ ] 320px width renders without horizontal scroll
- [ ] 375px width (iPhone SE/8) all content visible
- [ ] 390px width (iPhone 14) optimal layout
- [ ] 428px width (iPhone Pro Max) no excessive whitespace
- [ ] 768px width (iPad portrait) tablet layout triggers

#### Touch Interaction Testing
- [ ] All buttons ≥ 44px touch target (test with finger, not mouse)
- [ ] Touch targets have ≥ 8px spacing
- [ ] Tap feedback visible (color change, ripple, scale)
- [ ] No accidental taps on adjacent elements
- [ ] Swipe gestures don't conflict with scroll
- [ ] Long-press actions have visible alternatives
- [ ] Double-tap doesn't conflict with zoom
- [ ] Pull-to-refresh works on scrollable lists

#### Orientation Testing
- [ ] Portrait → Landscape preserves state and scroll
- [ ] Form data preserved on rotation
- [ ] Modals/overlays resize correctly
- [ ] Fixed elements position correctly
- [ ] Video players adapt to orientation
- [ ] Keyboard dismisses properly on rotate

#### Network Condition Testing
| Condition | Expected Behavior |
|-----------|-------------------|
| Fast 4G | Baseline performance, all features work |
| Slow 3G (throttle in DevTools) | Loading states appear, content eventually loads |
| Offline | Cached content shows, offline message appears |
| Lie-Fi (connected, no data) | Timeout handling, retry option |

#### Form Testing
- [ ] Correct keyboard type appears for each field
- [ ] Autocomplete populates appropriate fields
- [ ] Password managers can detect and fill forms
- [ ] Validation messages positioned correctly
- [ ] Errors clear when user corrects input
- [ ] Form state preserved on accidental navigation
- [ ] Submit button disabled during processing
- [ ] Keyboard doesn't cover active input

#### Accessibility Testing
**VoiceOver (iOS) / TalkBack (Android):**
- [ ] All buttons have accessible names
- [ ] Form fields announce label + current state
- [ ] Images have meaningful alt text (or aria-hidden for decorative)
- [ ] Focus order is logical (top to bottom, left to right)
- [ ] Error messages are announced when they appear
- [ ] Modals trap focus when open
- [ ] Color contrast ≥ 4.5:1 for text
- [ ] Touch targets ≥ 44px

#### Performance Testing
- [ ] Skeleton screens display during data fetch
- [ ] No layout shift after content loads (CLS < 0.1)
- [ ] Largest Contentful Paint < 2.5s on 4G
- [ ] Images lazy load below the fold
- [ ] Button states provide immediate feedback
- [ ] Smooth scrolling (60fps)
- [ ] No jank on animations

---

## Premium Mobile Patterns Reference

### What Makes Apps Feel Premium

These patterns are observed in Whoop, Apple Fitness, Strava, Robinhood, and Duolingo:

| Pattern | Implementation | Effect |
|---------|----------------|--------|
| **Semantic color** | Green=positive, Red=negative, consistent everywhere | Instant comprehension |
| **Micro-celebrations** | Confetti, haptic buzz on achievements | Emotional reward |
| **Skeleton loading** | Content-shaped placeholders | Faster perceived load |
| **Smooth transitions** | 300-500ms eased animations | Polished, intentional |
| **Bottom navigation** | 3-5 tabs, always visible | Navigation confidence |
| **Card-based layout** | Tappable content blocks with clear boundaries | Scannable, touchable |
| **Haptic feedback** | Subtle vibration on key actions | Physical confirmation |
| **Generous whitespace** | Content breathes, focus is clear | Premium feel |
| **Consistent iconography** | Same icon style throughout | Visual coherence |
| **Data visualization** | Charts, progress rings, comparisons | Information-rich |

### What Makes Apps Feel Cheap

Avoid these patterns:

- Generic/template UI with no customization
- Jarring or instant transitions (no easing)
- Cluttered screens, competing elements
- Touch targets < 44px
- No loading feedback (blank screens)
- Inconsistent spacing and alignment
- Walls of unformatted text
- Forced signup before showing value
- Skeleton loading that doesn't match content
- System fonts without optimization
- Low-contrast text
- Modals that don't adapt to mobile

---

## Implementation Priority

When starting a new mobile-first project, implement in this order:

1. **Token foundation** — Colors, spacing, typography CSS variables
2. **Touch targets** — 44px minimum on all interactive elements
3. **Bottom navigation** — Primary nav always accessible
4. **Form inputs** — Correct keyboards, autocomplete, validation
5. **Loading states** — Skeletons for every data fetch
6. **Responsive breakpoints** — Mobile-first CSS throughout
7. **Error handling** — Clear, actionable error messages
8. **Performance** — Image optimization, lazy loading
9. **Accessibility** — Screen reader testing, contrast checks
10. **Polish** — Animations, haptics, micro-interactions

---

# Appendix: Copy-Paste Snippets

### utils.ts (cn helper)

```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### Standard Button Component

```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-md px-6",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

### Standard Input Component

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
```

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Optimized For:** Next.js 14+, Tailwind CSS v4, Mobile-First Development