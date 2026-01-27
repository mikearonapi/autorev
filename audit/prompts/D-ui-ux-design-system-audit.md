# AUDIT: UI/UX Design System - Codebase-Wide

> **Audit ID:** D  
> **Category:** Cross-Cutting (Foundation)  
> **Priority:** 1 of 36  
> **Dependencies:** None (this is foundational)  
> **Downstream Impact:** All page audits will reference findings from this audit

---

## CONTEXT

This audit ensures ALL UI across AutoRev follows the established design system. Violations create visual inconsistency, break dark theme, and degrade the premium experience.

This is a **FOUNDATIONAL** audit - findings here will inform all subsequent page-specific audits.

---

## CRITICAL: Read These First

Before making ANY changes, read these documents completely:

1. `docs/SOURCE_OF_TRUTH.md` - Rule 7 (Design Tokens), Anti-Patterns section
2. `docs/BRAND_GUIDELINES.md` - The complete 4-color system and usage rules
3. `docs/CSS_ARCHITECTURE.md` - Token reference and component library
4. `.cursor/rules/specialists/implementation/ui-quality-agent.mdc` - Quality checklist

---

## IMPORTANT: INVESTIGATE BEFORE FIX

Before changing ANY code:

1. ✅ Check if the feature currently works as intended
2. ✅ Document current behavior
3. ✅ Only fix what is actually a design system violation
4. ❌ Do NOT refactor working code that follows the design system
5. ❓ If unsure whether something is a violation, ASK before fixing

---

## THE 4-COLOR SYSTEM (Non-Negotiable)

| Color     | Hex       | CSS Variable          | ONLY Use For                                      |
| --------- | --------- | --------------------- | ------------------------------------------------- |
| **Lime**  | `#d4ff00` | `--color-accent-lime` | CTAs, primary buttons, user actions               |
| **Teal**  | `#10b981` | `--color-accent-teal` | Gains, improvements, positive data, active states |
| **Blue**  | `#3b82f6` | `--color-accent-blue` | Stock/baseline values, info, links                |
| **Amber** | `#f59e0b` | `--color-warning`     | Warnings ONLY (use sparingly)                     |

### Color Decision Tree

```
Is this a button/CTA? → LIME
Is this showing improvement/gain? → TEAL
Is this showing stock/baseline? → BLUE
Is this a genuine warning? → AMBER (rare)
Otherwise → White/secondary text
```

---

## CHECKLIST

### A. Hardcoded Colors (CRITICAL)

- [ ] Run `npm run audit:css` to find hardcoded hex values
- [ ] Search for inline styles with hex colors: `style={{.*#[0-9a-fA-F]`
- [ ] Search for Tailwind hardcoded colors: `text-\[#`, `bg-\[#`, `border-\[#`
- [ ] Each finding: Is it using a token? If not, map to correct variable
- [ ] **VERIFY:** `npm run audit:css` returns 0 violations (or document exceptions)

### B. Color Semantic Usage

- [ ] All CTAs/primary buttons use lime (not teal, not blue)
- [ ] All HP/TQ gains use teal (not lime, not green)
- [ ] All stock/baseline values use blue (not teal)
- [ ] Amber used ONLY for warnings (not labels, not badges)
- [ ] No gold (`#d4a84b`) or orange (`#ff4d00`) - removed from palette
- [ ] Labels use muted white (`--color-text-secondary`), NOT colored

### C. Background Layers

- [ ] Page backgrounds: `--color-bg-base` (`#0d1b2a`)
- [ ] Cards/elevated surfaces: `--color-bg-elevated` (`#1b263b`)
- [ ] No pure black (`#000000`) backgrounds anywhere
- [ ] Card backgrounds use proper transparency (`rgba(255,255,255,0.04)`)

### D. Typography

- [ ] Monospace font (`--font-mono`) for all numeric data
- [ ] Display font (Oswald) for hero headlines only
- [ ] Body font (Inter) for all other text
- [ ] No hardcoded font-family values

### E. Touch Targets

- [ ] All buttons minimum 44px height (`h-11`)
- [ ] All icon buttons minimum 44x44px (`h-11 w-11`)
- [ ] All form inputs minimum 44px height
- [ ] All tappable list items minimum 44px height

### F. Component Consistency

- [ ] Cards use consistent border radius (`rounded-xl` or `--radius-lg`)
- [ ] Cards use consistent padding (`p-4` or `p-6`)
- [ ] Borders are subtle (`rgba(255,255,255,0.06)`), not harsh
- [ ] Focus states use lime ring (`focus-visible:ring-[var(--color-accent-lime)]`)

### G. Loading States

- [ ] All data loading uses skeleton loaders (not spinners)
- [ ] Skeletons match content shape
- [ ] Skeletons use `animate-pulse` with proper bg color

### H. Empty States

- [ ] Empty states include icon, message, and CTA
- [ ] Empty state CTAs guide user to next action

### I. Stock vs Modified Pattern

- [ ] When showing comparisons: Stock=Blue → Modified=Teal
- [ ] Gain badges use teal background with teal text
- [ ] Example: `444 HP (blue) → 543 HP (teal) +99 (teal badge)`

---

## KEY FILES TO EXAMINE

### Global Styles

| File                       | Purpose                          |
| -------------------------- | -------------------------------- |
| `app/globals.css`          | Token definitions, global styles |
| `styles/tokens/colors.css` | Color tokens (if exists)         |
| `styles/components/`       | Shared component styles          |

### High-Usage Components

| File                         | Purpose           |
| ---------------------------- | ----------------- |
| `components/ui/Button.jsx`   | Button variants   |
| `components/ui/Card.jsx`     | Card patterns     |
| `components/ui/Badge.jsx`    | Badge colors      |
| `components/ui/Input.jsx`    | Form input sizing |
| `components/ui/Skeleton.jsx` | Loading patterns  |

### Pages with Heavy Data Display

| File                              | Purpose                                        |
| --------------------------------- | ---------------------------------------------- |
| `app/(app)/data/`                 | Virtual Dyno charts, stock vs modified display |
| `app/(app)/insights/`             | Health scores, metrics                         |
| `components/VirtualDynoChart.jsx` | Chart colors                                   |

---

## AUTOMATED CHECKS

Run these commands and document results:

```bash
# 1. Find hardcoded hex colors in CSS
npm run audit:css

# 2. Find hardcoded colors in JSX (Tailwind)
grep -r "text-\[#" --include="*.jsx" --include="*.tsx" app/ components/
grep -r "bg-\[#" --include="*.jsx" --include="*.tsx" app/ components/
grep -r "border-\[#" --include="*.jsx" --include="*.tsx" app/ components/

# 3. Find inline style colors
grep -r "style={{" --include="*.jsx" --include="*.tsx" -A2 app/ components/ | grep "#"

# 4. Find banned colors (gold, orange)
grep -r "#d4a84b\|#ff4d00" --include="*.css" --include="*.jsx" app/ components/ styles/

# 5. Find small touch targets
grep -r "p-1\|p-2\|h-6\|h-8\|w-6\|w-8" --include="*.jsx" components/ | grep -i button
```

---

## SOURCE OF TRUTH PATTERNS

From `docs/SOURCE_OF_TRUTH.md` Rule 7:

```css
/* ✅ CORRECT - Design tokens with fallback */
background: var(--color-bg-elevated, #1b263b);
color: var(--color-accent-teal, #10b981);

/* ❌ WRONG - Hardcoded colors */
background: #1b263b;
color: #10b981;
```

---

## DELIVERABLES

### 1. Violation Report

List all violations found with:

| Field         | Description             |
| ------------- | ----------------------- |
| File path     | Full path to file       |
| Line number   | Specific line           |
| Current value | The incorrect value     |
| Correct value | What it should be       |
| Severity      | Critical / Medium / Low |

### 2. Summary Statistics

- Total hardcoded colors found
- Color misuse count (wrong color for purpose)
- Touch target violations
- Files with most violations

### 3. Fix Recommendations

- Group fixes by file
- Prioritize critical violations
- Note any exceptions that should remain

---

## VERIFICATION

- [ ] `npm run audit:css` returns 0 violations (or documented exceptions)
- [ ] Manual spot-check of 5 high-traffic pages confirms visual consistency
- [ ] Stock vs modified comparisons use Blue → Teal pattern
- [ ] All CTAs are lime, all gains are teal, all baselines are blue
- [ ] No amber used for non-warning purposes

---

## SUCCESS CRITERIA

| #   | Criterion                                                                  |
| --- | -------------------------------------------------------------------------- |
| 1   | Zero hardcoded hex colors in CSS (use variables with fallbacks)            |
| 2   | Zero semantic color misuse (lime only for CTAs, teal only for gains, etc.) |
| 3   | All interactive elements meet 44px touch target                            |
| 4   | Violation report documents ALL findings for downstream audits              |
| 5   | Any exceptions are documented with justification                           |

---

## OUTPUT FORMAT

```
📊 UI/UX DESIGN SYSTEM AUDIT RESULTS

**Summary:**
- Hardcoded colors: X violations
- Semantic misuse: X violations
- Touch targets: X violations
- Total files affected: X

**Critical Violations (Fix Immediately):**
1. [file:line] [issue] → [fix]
...

**Medium Violations:**
1. [file:line] [issue] → [fix]
...

**Exceptions (Documented, No Fix Needed):**
1. [file:line] [reason]
...

**Patterns to Apply in Page Audits:**
- [Pattern 1 description]
- [Pattern 2 description]
...
```

---

## AUDIT EXECUTION LOG

| Date | Auditor | Result | Notes |
| ---- | ------- | ------ | ----- |
|      |         |        |       |

---

_Audit prompt generated: January 25, 2026_  
_Part of AutoRev Systematic Audit Suite (36 total audits)_
