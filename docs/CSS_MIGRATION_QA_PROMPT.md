# CSS Token Migration QA Audit

> **Copy everything below this line into a new Cursor chat for QA audit**

---

## Mission

Audit the CSS codebase to ensure **zero hardcoded colors** in component and page stylesheets. All colors should use CSS custom properties (`var(--brand-*)` or legacy `var(--color-*)` aliases).

### Acceptable Hardcoded Colors (ONLY in these locations)
1. **`app/globals.css`** - Variable DEFINITIONS only (e.g., `--brand-lime: #d4ff00;`)
2. **Fallback values** inside `var()` (e.g., `var(--brand-gold, #d4a84b)`)
3. **`rgba()` with variables** is acceptable for now

### NOT Acceptable
- Any `#hex` color in `.module.css` files outside of `var()` fallbacks
- Any `#hex` color in `app/` or `components/` CSS files (except globals.css)

---

## Step 1: Run Initial Audit

```bash
cd "/Volumes/10TB External HD/01. Apps - WORKING/AutoRev"
./scripts/css-audit.sh
```

Record the baseline numbers.

---

## Step 2: Find All Remaining Hardcoded Colors

Run this to find hardcoded colors that need migration:

```bash
# Find all hardcoded hex colors NOT in globals.css or var() fallbacks
grep -rn "#[0-9a-fA-F]\{3,8\}" app components --include="*.css" \
  | grep -v "globals.css" \
  | grep -v "var(" \
  | grep -v "mobile-utilities.css" \
  | head -50
```

---

## Step 3: Get Files Ranked by Hardcoded Color Count

```bash
for f in $(find app components -name "*.module.css"); do
  count=$(grep -oE "#[0-9a-fA-F]{3,8}" "$f" 2>/dev/null | grep -v "var(" | wc -l | tr -d ' ')
  if [ "$count" -gt 0 ]; then
    echo "$count: $f"
  fi
done | sort -rn | head -30
```

---

## Step 4: Check for Circular References in globals.css

```bash
# These lines should show ACTUAL hex values, not var() references
grep -E "^\s+--brand-" app/globals.css | head -30
```

**Expected format:**
```css
--brand-lime: #d4ff00;          /* ✅ CORRECT */
--brand-lime: var(--brand-lime); /* ❌ CIRCULAR - FIX THIS */
```

---

## Step 5: Brand Color Reference

When migrating, use these token mappings:

| Hex Color | Replace With | Usage |
|-----------|--------------|-------|
| `#d4ff00` | `var(--brand-lime)` | Primary CTAs, emphasis, headlines |
| `#10b981` | `var(--brand-teal)` | Improvements, gains, positive |
| `#3b82f6` | `var(--brand-blue)` | Baseline/stock values |
| `#d4a84b` | `var(--brand-gold)` | Interactive, buttons, links |
| `#ef4444` | `var(--brand-error)` | Errors, destructive |
| `#f59e0b` | `var(--brand-warning)` | Warnings, caution |
| `#22c55e` | `var(--brand-success)` | Success states |
| `#ffffff` | `var(--brand-text-primary)` | Primary text |
| `#94a3b8` | `var(--brand-text-secondary)` | Secondary text |
| `#64748b` | `var(--brand-text-tertiary)` | Tertiary text |
| `#0d1b2a` | `var(--brand-bg-primary)` | Main background |
| `#1b263b` | `var(--brand-bg-secondary)` | Elevated background |
| `#1a1a1a` | `var(--brand-border-subtle)` | Subtle borders |
| `#252525` | `var(--brand-border-default)` | Default borders |

### Color Variants Available
- `--brand-teal-light: #34d399`
- `--brand-teal-dark: #059669`
- `--brand-blue-light: #60a5fa`
- `--brand-blue-dark: #1d4ed8`
- `--brand-gold-light: #e8c875`
- `--brand-error-light: #f87171`
- `--brand-error-dark: #dc2626`
- `--brand-success-light: #4ade80`
- `--brand-success-dark: #16a34a`
- `--brand-purple-accent: #8b5cf6`
- `--brand-bg-primary-dark: #0a1628`
- `--brand-bg-card-dark: #1a1a2e`
- `--brand-primary-dark: #1a4d6e`

---

## Step 6: Migrate Remaining Files

For each file with hardcoded colors, run targeted replacements:

```bash
# Example: Migrate a specific file
sed -i '' \
  -e 's/#d4ff00/var(--brand-lime)/g' \
  -e 's/#10b981/var(--brand-teal)/g' \
  -e 's/#3b82f6/var(--brand-blue)/g' \
  -e 's/#d4a84b/var(--brand-gold)/g' \
  -e 's/#ef4444/var(--brand-error)/g' \
  -e 's/#ffffff/var(--brand-text-primary)/g' \
  -e 's/#fff/var(--brand-text-primary)/g' \
  "path/to/file.module.css"
```

Or batch migrate all remaining:

```bash
find app components -name "*.module.css" -exec sed -i '' \
  -e 's/: #d4ff00;/: var(--brand-lime);/g' \
  -e 's/: #10b981;/: var(--brand-teal);/g' \
  -e 's/: #3b82f6;/: var(--brand-blue);/g' \
  -e 's/: #d4a84b;/: var(--brand-gold);/g' \
  -e 's/: #ef4444;/: var(--brand-error);/g' \
  -e 's/: #f59e0b;/: var(--brand-warning);/g' \
  -e 's/: #22c55e;/: var(--brand-success);/g' \
  -e 's/: #ffffff;/: var(--brand-text-primary);/g' \
  -e 's/: #fff;/: var(--brand-text-primary);/g' \
  -e 's/: #94a3b8;/: var(--brand-text-secondary);/g' \
  -e 's/: #64748b;/: var(--brand-text-tertiary);/g' \
  -e 's/: #0d1b2a;/: var(--brand-bg-primary);/g' \
  -e 's/: #1a1a1a;/: var(--brand-border-subtle);/g' \
  -e 's/: #252525;/: var(--brand-border-default);/g' \
  {} \;
```

---

## Step 7: Handle Edge Cases

### Gradients
For gradients, replace individual color stops:
```css
/* Before */
background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);

/* After */
background: linear-gradient(135deg, var(--brand-bg-card-dark) 0%, var(--brand-bg-secondary) 100%);
```

### RGBA Colors
For rgba colors with opacity, use CSS color-mix or keep as-is for now:
```css
/* Acceptable for now */
background: rgba(16, 185, 129, 0.15);

/* Better (if supported) */
background: color-mix(in srgb, var(--brand-teal) 15%, transparent);
```

### Border Shorthand
```css
/* Before */
border: 1px solid #252525;

/* After */
border: 1px solid var(--brand-border-default);
```

---

## Step 8: Final Verification

Run the audit again:

```bash
./scripts/css-audit.sh
```

Then verify zero hardcoded colors in module files:

```bash
# This should return ZERO results
grep -rn "#[0-9a-fA-F]\{3,8\}" app components --include="*.module.css" \
  | grep -v "var(" \
  | wc -l
```

---

## Step 9: Visual Spot Check

After migration, visually verify these key pages:

1. **Homepage** (`/`) - Lime CTAs, navy background
2. **My Garage** (`/garage`) - Teal gains, blue baselines
3. **My Data** (`/data`) - Performance metrics, teal active states
4. **AL Chat** (`/al`) - Consistent dark theme
5. **Profile** (`/profile`) - Proper button colors
6. **Community** (`/community`) - White text on dark cards

---

## Success Criteria

- [ ] Zero hardcoded hex colors in `.module.css` files (outside `var()` fallbacks)
- [ ] All `--brand-*` variables in globals.css are actual hex values (no circular refs)
- [ ] Audit script shows significant reduction from baseline
- [ ] Visual spot check passes - no color regressions
- [ ] App builds without CSS errors

---

## Reference Files

- Brand Guidelines: `docs/BRAND_GUIDELINES.md`
- CSS Architecture: `docs/CSS_ARCHITECTURE.md`
- Migration Audit: `docs/CSS_MIGRATION_AUDIT.md`
- Cursor Rules: `.cursor/rules/brand-guidelines.mdc`, `.cursor/rules/css-architecture.mdc`
