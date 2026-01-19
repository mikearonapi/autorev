# AutoRev Brand Guidelines

> Premium automotive build platform identity
>
> **Last Updated:** January 2026

---

## Brand Essence

**AutoRev** = Automotive + Revolution/Revelation

A platform for enthusiasts who want to **build, upgrade, and optimize** their sports cars with data-driven confidence.

---

## Color Palette

### Primary Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Performance Orange** | `#ff4d00` | 255, 77, 0 | Primary actions, CTAs, links, key accents |
| **Performance Orange Hover** | `#ff6a2a` | 255, 106, 42 | Hover states |
| **Performance Orange Muted** | `rgba(255, 77, 0, 0.15)` | - | Backgrounds, badges |

### Secondary Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Tech Blue** | `#00d4ff` | 0, 212, 255 | Secondary accents, data visualization, tech features |
| **Tech Blue Hover** | `#33deff` | 51, 222, 255 | Hover states |
| **Tech Blue Muted** | `rgba(0, 212, 255, 0.15)` | - | Backgrounds, highlights |

### Background Hierarchy (Dark Theme)

| Name | Hex | Usage |
|------|-----|-------|
| **Carbon Black** | `#0a0a0a` | Primary background |
| **Elevated Black** | `#111111` | Secondary sections |
| **Card Background** | `#161616` | Cards, containers |
| **Card Hover** | `#1c1c1c` | Hover states |
| **Surface** | `#1f1f1f` | Elevated surfaces |

### Text Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Primary** | `#ffffff` | Headings, important text |
| **Secondary** | `#a0a0a0` | Body text, descriptions |
| **Tertiary** | `#666666` | Captions, metadata |
| **Muted** | `#444444` | Disabled, placeholder |

### Semantic Colors

| Purpose | Hex |
|---------|-----|
| Success | `#22c55e` |
| Info | `#3b82f6` |
| Warning | `#f59e0b` |
| Error | `#ef4444` |

---

## Typography

### Font Families

| Type | Font | Weights | CSS Variable |
|------|------|---------|--------------|
| **Display** | Oswald | 600 | `--font-display` |
| **Body** | Inter | 400, 500, 600 | `--font-body` |
| **Monospace** | SF Mono / Fira Code | 400 | `--font-mono` |

### Display Typography (Oswald)

Used for:
- Page titles
- Section headings
- Hero headlines
- Feature titles
- Navigation items

**Style:**
- Uppercase for major headings
- Letter-spacing: 0.02em
- Line-height: 1.1 (tight)

### Body Typography (Inter)

Used for:
- Paragraphs
- UI elements
- Buttons
- Forms
- Descriptions

**Style:**
- Sentence case
- Line-height: 1.45-1.6
- No letter-spacing adjustments

### Type Scale (Fluid)

```css
--font-size-xs: clamp(0.625rem, 0.5rem + 0.4vw, 0.75rem);
--font-size-sm: clamp(0.688rem, 0.5rem + 0.6vw, 0.875rem);
--font-size-base: clamp(0.813rem, 0.625rem + 0.75vw, 1rem);
--font-size-lg: clamp(0.875rem, 0.625rem + 1vw, 1.125rem);
--font-size-xl: clamp(1rem, 0.75rem + 1.25vw, 1.375rem);
--font-size-2xl: clamp(1.125rem, 0.875rem + 1.5vw, 1.75rem);
--font-size-3xl: clamp(1.375rem, 1rem + 2vw, 2.25rem);
--font-size-4xl: clamp(1.625rem, 1.25rem + 2.5vw, 3rem);
--font-size-hero: clamp(1.75rem, 1.25rem + 3.5vw, 3.5rem);
```

---

## Logo

### Primary Logo

```
Auto[Rev]
```

- "Auto" in white (`#ffffff`)
- "Rev" in Performance Orange (`#ff4d00`)
- Font: Oswald 600 or system display font
- Letter-spacing: -0.02em

### Usage Rules

1. Always maintain color contrast (Auto in white, Rev in orange)
2. Minimum size: 24px font-size
3. Clear space: 1x logo height on all sides
4. Never stretch, rotate, or add effects

---

## UI Components

### Buttons

**Primary Button:**
- Background: Performance Orange (`#ff4d00`)
- Text: White (`#ffffff`)
- Border-radius: 8px (standard) or 100px (pill)
- Padding: 16px 32px
- Font-weight: 600
- Uppercase text

**Secondary Button:**
- Background: Transparent
- Border: 1px solid `rgba(255, 255, 255, 0.2)`
- Text: Secondary (`#a0a0a0`)
- Hover: Border and text turn orange

**Ghost Button:**
- Background: Transparent
- Text: Secondary (`#a0a0a0`)
- Hover: Background `#161616`

### Cards

- Background: `#161616`
- Border: 1px solid `#1a1a1a`
- Border-radius: 14px
- Hover: Background `#1c1c1c`, border `#252525`
- Padding: Mobile 16px, Desktop 24px

### Inputs

- Background: `#0d0d0d`
- Border: 1px solid `#1a1a1a`
- Focus: Border turns orange, subtle orange glow
- Border-radius: 8px

### Badges

- Background: `rgba(255, 77, 0, 0.15)`
- Text: Performance Orange
- Border: 1px solid `rgba(255, 77, 0, 0.3)`
- Border-radius: 100px (pill)
- Padding: 8px 16px
- Uppercase, small text

---

## Spacing

Based on 8px grid, generous for premium feel:

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | 8px | Tight gaps |
| `--space-sm` | 12px | Small gaps |
| `--space-md` | 16px | Default gaps |
| `--space-lg` | 24px | Section gaps |
| `--space-xl` | 32px | Large gaps |
| `--space-2xl` | 48px | Section padding (mobile) |
| `--space-3xl` | 64px | Section padding (desktop) |
| `--space-4xl` | 96px | Major sections |

---

## Iconography

### Style

- Stroke-based (not filled)
- Stroke width: 2px (1.5px for small icons)
- Corner radius: Rounded caps and joins
- Size: 20px default, 24px for prominent

### Icon Colors

- Default: `#a0a0a0` (secondary text)
- Active/Accent: `#ff4d00` (Performance Orange)
- Data/Info: `#00d4ff` (Tech Blue)

---

## Motion

### Timing

- Fast: 150ms (micro-interactions)
- Base: 200ms (most transitions)
- Slow: 300ms (page transitions, modals)

### Easing

- Default: `ease` or `ease-out`
- Enter: `ease-out`
- Exit: `ease-in`

### Hover Effects

- Buttons: `translateY(-2px)` + enhanced shadow
- Cards: `translateY(-2px)` + larger shadow
- Links: Color transition only

---

## Photography & Imagery

### Style

- High-contrast, dramatic lighting
- Dark backgrounds preferred
- Focus on details, engineering, craftsmanship
- Avoid generic stock photography

### Treatment

- No borders on images
- Border-radius: 14px for cards, 24px for large features
- Subtle shadow for depth

---

## Voice & Tone

### Personality

- **Expert** — Data-driven, knowledgeable, precise
- **Enthusiast** — Passionate, engaged, community-focused
- **Premium** — High-quality, refined, trustworthy
- **Direct** — Clear, actionable, no fluff

### Writing Style

- Short sentences
- Active voice
- Technical but accessible
- Avoid jargon without explanation
- Use numbers and data when possible

### Headlines

- Bold, uppercase for impact
- Action-oriented
- Focus on outcomes ("BUILD YOUR DREAM CAR" not "Car Building Platform")

---

## Application Examples

### Homepage Hero

```
[Performance Orange] BUILD [White] YOUR
[Performance Orange] DREAM CAR
```

### Feature Highlight Cards

- Background: Performance Orange (`#ff4d00`)
- Text: Carbon Black (`#0a0a0a`)
- Used for key value propositions

### Section Titles

```css
font-family: var(--font-display);
font-size: var(--font-size-3xl);
font-weight: 600;
text-transform: uppercase;
color: #ffffff;
```

With accent word in Performance Orange.

---

## CSS Variables Reference

All brand tokens are defined in `app/globals.css`:

```css
/* Primary Actions */
--accent-primary: #ff4d00;
--accent-primary-hover: #ff6a2a;
--accent-primary-muted: rgba(255, 77, 0, 0.15);

/* Secondary/Data */
--accent-secondary: #00d4ff;
--accent-secondary-hover: #33deff;
--accent-secondary-muted: rgba(0, 212, 255, 0.15);

/* Backgrounds */
--bg-primary: #0a0a0a;
--bg-secondary: #111111;
--bg-card: #161616;

/* Typography */
--font-display: var(--font-oswald);
--font-body: var(--font-inter);
```

---

## Don't

1. ❌ Use lime/neon green (that's GRAVL)
2. ❌ Use light backgrounds for main UI
3. ❌ Mix brand colors with unrelated colors
4. ❌ Use thin fonts for headlines
5. ❌ Use lowercase for major headings
6. ❌ Add gradients to the logo
7. ❌ Use rounded corners larger than 24px
8. ❌ Use pure black (#000000) for backgrounds

---

*Brand guidelines maintained by AutoRev Design System*
