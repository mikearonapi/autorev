# Priority Pages Brand QA Prompt

> **Goal:** Ensure all priority pages have ZERO hardcoded colors/spacing and fully adhere to AutoRev brand guidelines.

---

## Priority Page Structure

```
app/(app)/
├── /                      ← Home (layout.jsx handles this)
├── /garage                ← Main hub ✓
│   ├── /my-build          ← Build configuration ✓
│   ├── /my-specs          ← Vehicle specs ✓
│   ├── /my-performance    ← Vehicle performance ✓
│   ├── /my-parts          ← Vehicle parts ✓
│   ├── /my-photos         ← Vehicle photos ✓
│   ├── /compare           ← Compare cars ✓
│   └── /[publicSlug]      ← Public share ✓
├── /data                  ← Performance data ✓
├── /community             ← Builds feed ✓
├── /al                    ← AI Assistant ✓
├── /profile               ← Settings ✓
├── /browse-cars           ← Car database ✓
│   └── /[slug]            ← Car detail ✓
└── /parts                 ← Parts browser ✓
```

---

## Step 1: Run Priority Pages Audit

```bash
cd "/Volumes/10TB External HD/01. Apps - WORKING/AutoRev"

# Check each priority page for hardcoded values
echo "=== PRIORITY PAGES AUDIT ===" && \
for page in \
  "app/(app)/garage/page.module.css" \
  "app/(app)/garage/my-build/page.module.css" \
  "app/(app)/garage/my-specs/page.module.css" \
  "app/(app)/garage/my-performance/page.module.css" \
  "app/(app)/garage/my-parts/page.module.css" \
  "app/(app)/garage/my-photos/page.module.css" \
  "app/(app)/garage/compare/page.module.css" \
  "app/(app)/data/page.module.css" \
  "app/(app)/community/page.module.css" \
  "app/(app)/al/page.module.css" \
  "app/(app)/profile/page.module.css" \
  "app/(app)/browse-cars/page.module.css" \
  "app/(app)/browse-cars/[slug]/page.module.css" \
  "app/(app)/parts/page.module.css"; do
  if [ -f "$page" ]; then
    count=$(grep -E "#[0-9a-fA-F]{3,8}" "$page" 2>/dev/null | grep -v "var(" | wc -l | tr -d ' ')
    if [ "$count" -gt 0 ]; then
      echo "❌ $page: $count hardcoded colors"
    else
      echo "✅ $page: Clean"
    fi
  else
    echo "⚠️  $page: File not found"
  fi
done
```

---

## Step 2: Batch Fix with Migration Script

```bash
# Run the color migration script on priority pages
./scripts/migrate-colors.sh --dir "app/(app)" --backup
```

---

## Step 3: Manual Review Checklist

For each priority page, verify these brand elements:

### Colors
| Element | Expected Token | NOT Acceptable |
|---------|----------------|----------------|
| Primary CTA buttons | `var(--brand-lime)` | `#d4ff00`, `#ff4d00` |
| Secondary buttons | `var(--brand-gold)` | `#d4a84b`, `#e5b95c` |
| Improvements/gains | `var(--brand-teal)` | `#10b981`, `#22c55e` |
| Baseline/stock values | `var(--brand-blue)` | `#3b82f6` |
| Error states | `var(--brand-error)` | `#ef4444`, `#dc2626` |
| Warning states | `var(--brand-warning)` | `#f59e0b` |
| Success states | `var(--brand-success)` | `#22c55e` |
| Primary text | `var(--brand-text-primary)` | `#ffffff`, `#fff` |
| Secondary text | `var(--brand-text-secondary)` | `#94a3b8`, `#808080` |
| Background | `var(--brand-bg-primary)` | `#0d1b2a`, `#0a0a0a` |
| Card background | `var(--brand-bg-card-dark)` | `#1a1a1e`, `#161616` |
| Borders | `var(--brand-border-subtle)` | `#1a1a1a`, `#252525` |
| Dark text on light | `var(--brand-bg-primary)` | `#000`, `#000000` |

### Spacing (Phase 2)
| Element | Expected Token | NOT Acceptable |
|---------|----------------|----------------|
| Base spacing | `var(--space-4)` | `16px` |
| Small spacing | `var(--space-2)` | `8px` |
| Large spacing | `var(--space-8)` | `32px` |
| Page padding | `var(--padding-page-x)` | `24px`, `16px` |
| Card padding | `var(--space-4)` or `var(--space-5)` | `16px`, `20px` |

### Typography (Phase 3)
| Element | Expected Token | NOT Acceptable |
|---------|----------------|----------------|
| Hero stats | `var(--font-mono)` + 24px | Random font sizes |
| Body text | `var(--font-body)` | Arial, sans-serif |
| Display headings | `var(--font-display)` | Inter directly |

---

## Step 4: Page-by-Page Visual Verification

After code changes, visually verify each page:

### /garage (Main Hub)
- [ ] Vehicle cards use proper shadows and borders
- [ ] Active tab uses `--brand-teal` or `--brand-gold`
- [ ] Add button uses `--brand-gold` with dark text
- [ ] Stats display uses monospace font

### /garage/my-build
- [ ] Build progress indicators use `--brand-teal`
- [ ] Part badges use semantic colors
- [ ] Action buttons use `--brand-gold`

### /garage/my-specs
- [ ] Spec values use `--brand-text-primary`
- [ ] Stock values use `--brand-blue`
- [ ] Modified values use `--brand-teal`

### /garage/my-performance
- [ ] Dyno charts use `--brand-blue` (stock) and `--brand-teal` (modified)
- [ ] Gain badges use teal background with teal text
- [ ] Progress bars use proper gradients

### /garage/my-parts
- [ ] Part cards have consistent styling
- [ ] Price displays use appropriate colors
- [ ] Status badges use semantic colors

### /garage/my-photos
- [ ] Image borders use `--brand-border-subtle`
- [ ] Upload buttons use `--brand-gold`

### /garage/compare
- [ ] Comparison bars use blue (stock) and teal (modified)
- [ ] Winner indicators use `--brand-lime`

### /garage/[publicSlug]
- [ ] Public share uses consistent dark theme
- [ ] Avatar placeholder uses `--brand-error` gradient

### /data
- [ ] Data cards use proper backgrounds
- [ ] Filter pills use `--brand-teal` when active
- [ ] Source icons have appropriate colors

### /community
- [ ] Build cards use consistent styling
- [ ] User avatars use `--brand-purple-accent`
- [ ] Action buttons use proper colors

### /al
- [ ] Chat bubbles use appropriate backgrounds
- [ ] User vs AL messages are distinguishable
- [ ] Input area uses proper styling

### /profile
- [ ] Settings sections have proper borders
- [ ] Tier badges use correct colors
- [ ] Action buttons follow brand guidelines

### /browse-cars
- [ ] Car cards have consistent hover states
- [ ] Filter pills follow brand active states
- [ ] Badges use semantic colors

### /browse-cars/[slug]
- [ ] Hero section uses proper gradients
- [ ] Spec cards use correct typography
- [ ] CTA buttons use `--brand-gold`

### /parts
- [ ] Part grid uses consistent card styling
- [ ] Filter controls follow brand guidelines
- [ ] Price displays are properly styled

---

## Step 5: Final Verification Commands

```bash
# Verify ZERO hardcoded colors in priority pages
echo "=== FINAL VERIFICATION ===" && \
grep -rn "#[0-9a-fA-F]\{3,8\}" \
  "app/(app)/garage" \
  "app/(app)/data" \
  "app/(app)/community" \
  "app/(app)/al" \
  "app/(app)/profile" \
  "app/(app)/browse-cars" \
  "app/(app)/parts" \
  --include="*.module.css" | grep -v "var(" | wc -l

# Should output: 0
```

```bash
# Run full audit
./scripts/css-audit.sh
```

```bash
# Build verification
npm run build
```

---

## Success Criteria

- [ ] **ZERO** hardcoded hex colors in priority page CSS files (outside `var()` fallbacks)
- [ ] All pages pass visual verification checklist
- [ ] `npm run build` succeeds without CSS errors
- [ ] No color regressions (compare against existing screenshots if available)

---

## Reference Documents

- Brand Guidelines: `.cursor/rules/brand-guidelines.mdc`
- CSS Architecture: `.cursor/rules/css-architecture.mdc`
- Color Migration Script: `scripts/migrate-colors.sh`
- CSS Audit Script: `scripts/css-audit.sh`
- Full token definitions: `app/globals.css`

---

## Quick Token Reference

```css
/* Backgrounds */
--brand-bg-primary: #0d1b2a
--brand-bg-secondary: #1b263b
--brand-bg-card-dark: #1a1a2e
--brand-bg-primary-dark: #0a1628

/* Accents */
--brand-lime: #d4ff00       /* PRIMARY CTAs */
--brand-teal: #10b981       /* Improvements, gains */
--brand-blue: #3b82f6       /* Baseline/stock */
--brand-gold: #d4a84b       /* Interactive elements */

/* Status */
--brand-error: #ef4444
--brand-warning: #f59e0b
--brand-success: #22c55e

/* Text */
--brand-text-primary: #ffffff
--brand-text-secondary: #94a3b8
--brand-text-tertiary: #64748b

/* Borders */
--brand-border-subtle: #1a1a1a
--brand-border-default: #252525
```
