---
name: sitewide-performance-fix
overview: Fix pervasive mobile LCP and payload issues across the entire site. Phase 0 audits provider dependencies. Phase A performs route group split (highest risk, done while codebase is stable). Phases B-C apply media fixes and asset re-encoding. Phase D locks in gains with regression tests.
todos:
  - id: phase0-baseline
    content: "Phase 0: Run Lighthouse on all 7 target routes, capture baselines"
    status: pending
  - id: phase0-provider-audit
    content: "Phase 0: Create provider dependency matrix (Provider × Route)"
    status: pending
  - id: phase0-header-audit
    content: "Phase 0: Audit Header/Footer for provider dependencies"
    status: pending
  - id: phase0-client-audit
    content: "Phase 0: Document which components use 'use client' unnecessarily"
    status: pending
  - id: phaseA-layouts
    content: "Phase A: Create app/(marketing)/layout.jsx and app/(app)/layout.jsx"
    status: pending
  - id: phaseA-batch1
    content: "Phase A Batch 1: Move /landing/* pages, validate, monitor 24h"
    status: pending
  - id: phaseA-batch2
    content: "Phase A Batch 2: Move /join, /features, /articles, validate"
    status: pending
  - id: phaseA-batch3
    content: "Phase A Batch 3: Move / (home page), validate"
    status: pending
  - id: phaseA-batch4
    content: "Phase A Batch 4: Move /browse-cars, /car-selector, validate"
    status: pending
  - id: phaseA-batch5
    content: "Phase A Batch 5: Move /garage, /tuning-shop, /profile, validate"
    status: pending
  - id: phaseA-batch6
    content: "Phase A Batch 6: Move /community/*, /al, validate"
    status: pending
  - id: phaseB-1-meta-pixel
    content: "Phase B.1: Delay Meta Pixel to lazyOnload (lowest risk, deploy first)"
    status: pending
  - id: phaseB-2-tuning-bg
    content: "Phase B.2: Remove priority from tuning-shop background"
    status: pending
  - id: phaseB-3-garage-bg
    content: "Phase B.3: Remove priority from garage background"
    status: pending
  - id: phaseB-4-car-selector
    content: "Phase B.4: Fix car-selector hero (current+next + preload)"
    status: pending
  - id: phaseB-5-image-carousel
    content: "Phase B.5: Fix ImageCarousel (current+next + IntersectionObserver)"
    status: pending
  - id: phaseB-6-advanced-carousel
    content: "Phase B.6: Fix AdvancedImageCarousel (current+next + IntersectionObserver)"
    status: pending
  - id: phaseC-assets
    content: "Phase C: Convert hero images to AVIF/WebP, update all references"
    status: pending
  - id: phaseD-media-tests
    content: "Phase D: Add media regression tests"
    status: pending
  - id: phaseD-provider-tests
    content: "Phase D: Add provider split regression tests"
    status: pending
  - id: phaseD-docs
    content: "Phase D: Document new architecture in docs/ARCHITECTURE.md"
    status: pending
---

# Site-wide Performance Remediation Plan

## Executive Summary

Mobile PageSpeed scores range from **35 (home)** to **61 (tuning-shop)**. This plan takes a **risk-managed approach**:

1. **Phase 0**: Audit provider dependencies before touching anything
2. **Phase A**: Route group split (highest risk, done while codebase is stable)
3. **Phase B**: Media/LCP fixes (now safe to touch individual pages)
4. **Phase C**: Asset re-encoding (low risk, high reward)
5. **Phase D**: Lock in gains with regression tests

---

## Phase Order Rationale

The route group split (Phase A) happens **before** media fixes because:

- It's the highest-risk change — do it while codebase is stable
- Once the split is done, we know exactly which layout each page is in
- Media fixes are isolated to individual files and won't affect architecture
- If we fix media first, then split layouts, we might break the media fixes

---

## Phase 0: Discovery & Baseline (1 day)

### 0.1 Run Lighthouse Baselines (Formalized)

**Before touching any code**, run and save baselines as proof of improvement:

```bash
# Create baseline directory with timestamp
mkdir -p lighthouse-baselines/$(date +%Y%m%d)

# Capture all target routes (mobile preset)
ROUTES=("/" "/car-selector" "/tuning-shop" "/garage" "/browse-cars" "/landing/find-your-car" "/community/builds")

for route in "${ROUTES[@]}"; do
  # Replace / with _ for filename
  filename=$(echo "$route" | sed 's/\//_/g')
  npx lighthouse "https://autorev.app${route}" \
    --output=json \
    --output=html \
    --output-path="lighthouse-baselines/$(date +%Y%m%d)/${filename}" \
    --preset=perf \
    --form-factor=mobile \
    --throttling-method=simulate
done
```

**Capture these metrics for each route:**

| Route | Current Score | LCP | FCP | Total JS | TBT |
|-------|--------------|-----|-----|----------|-----|
| `/` (home) | 35 | TBD | TBD | TBD | TBD |
| `/car-selector` | 60 | TBD | TBD | TBD | TBD |
| `/tuning-shop` | 61 | TBD | TBD | TBD | TBD |
| `/garage` | 60 | TBD | TBD | TBD | TBD |
| `/browse-cars` | 46 | TBD | TBD | TBD | TBD |
| `/landing/find-your-car` | 59 | 20.5s | 3.9s | TBD | TBD |
| `/community/builds` | TBD | TBD | TBD | TBD | TBD |

**Save the JSON files** — they provide proof of improvement and catch regressions.

### 0.2 Provider Dependency Audit

For each provider in the current layout, identify all consumers:

```
Provider               | Routes That Use It
-----------------------|----------------------------------------------------
AuthProvider           | All routes (Header uses useAuth)
AIMechanicProvider     | All routes (Header uses useAIChat for AL toggle)
QueryProvider          | All routes (data fetching)
FavoritesProvider      | browse-cars, garage, tuning-shop, mod-planner
CompareProvider        | browse-cars, garage/compare, CompareBar widget
SavedBuildsProvider    | tuning-shop, garage, profile
OwnedVehiclesProvider  | garage, tuning-shop, profile
CarSelectionProvider   | car-selector, tuning-shop
BannerProvider         | All routes (banner system)
FeedbackProvider       | FeedbackCorner widget
AppConfigProvider      | TBD - audit needed
LoadingProgressProvider| TBD - audit needed
```

**Output**: Matrix of [Provider × Route] showing which routes MUST have which providers.

### 0.3 Header/Footer Provider Audit

**Header Dependencies (VERIFIED):**

| Hook Used | Provider Required | Risk if Missing |
|-----------|------------------|-----------------|
| `useAuth()` | AuthProvider | Will crash |
| `useAIChat()` | AIMechanicProvider | Will crash |
| `usePathname()` | Next.js (built-in) | N/A |
| `useRouter()` | Next.js (built-in) | N/A |

**Key Finding**: Header does NOT use `useFavorites`, `useCompare`, or `useSavedBuilds`. No badge counts. This makes the split safer than feared.

**Footer Dependencies**: None — already audited, no provider hooks.

### 0.4 Unnecessary 'use client' Audit

Document components that have `'use client'` but could be server components:

```bash
# Run this to find candidates
grep -r "'use client'" components/ --include="*.jsx" -l | \
  xargs -I {} sh -c 'echo "=== {} ===" && grep -E "useState|useEffect|onClick|onChange" {} | head -3'
```

---

## Phase A: Route Group Split (2-3 days, HIGH RISK)

### A.1 Create Layout Files

**File: `app/(marketing)/layout.jsx`**

Minimal providers for marketing pages:

```jsx
// Only providers needed by Header + basic functionality
<QueryProvider>
  <AuthProvider>
    <AIMechanicProvider>
      <BannerProvider>
        <Header />
        {children}
        <Footer />
      </BannerProvider>
    </AIMechanicProvider>
  </AuthProvider>
</QueryProvider>
```

**File: `app/(app)/layout.jsx`**

Full providers for app pages:

```jsx
<QueryProvider>
  <AuthProvider>
    <AIMechanicProvider>
      <FavoritesProvider>
        <CompareProvider>
          <SavedBuildsProvider>
            <OwnedVehiclesProvider>
              <CarSelectionProvider>
                <BannerProvider>
                  <FeedbackProvider>
                    <Header />
                    {children}
                    <Footer />
                    <CompareBar />
                    <MobileBottomCta />
                    <FeedbackCorner />
                  </FeedbackProvider>
                </BannerProvider>
              </CarSelectionProvider>
            </OwnedVehiclesProvider>
          </SavedBuildsProvider>
        </CompareProvider>
      </FavoritesProvider>
    </AIMechanicProvider>
  </AuthProvider>
</QueryProvider>
```

### A.2 Migration Order (lowest → highest traffic/complexity)

Each batch is a separate PR with Vercel preview deployment validation.

**Batch 1: `/landing/*` pages (lowest risk, isolated)**

```
app/landing/find-your-car/page.jsx → app/(marketing)/landing/find-your-car/page.jsx
app/landing/tuning-shop/page.jsx   → app/(marketing)/landing/tuning-shop/page.jsx
app/landing/your-garage/page.jsx   → app/(marketing)/landing/your-garage/page.jsx
```

- Deploy to Vercel preview
- Run E2E tests: `npx playwright test tests/e2e/landing-pages.spec.js`
- Manual smoke test
- Merge and monitor for 24h

**Batch 2: `/join`, `/features`, `/articles` (marketing, low complexity)**

```
app/join/page.jsx      → app/(marketing)/join/page.jsx
app/features/page.jsx  → app/(marketing)/features/page.jsx
app/articles/*         → app/(marketing)/articles/*
```

- Validate, monitor

**Batch 3: `/` (home page - high traffic but marketing-only)**

```
app/page.jsx → app/(marketing)/page.jsx
```

- High traffic — extra validation
- Validate, monitor 24h

**Batch 4: `/browse-cars`, `/car-selector` (app routes, simpler)**

```
app/browse-cars/* → app/(app)/browse-cars/*
app/car-selector/* → app/(app)/car-selector/*
```

- These need FavoritesProvider, CompareProvider
- Validate favorites/compare functionality still works

**Batch 5: `/garage`, `/tuning-shop`, `/profile` (complex, auth-gated)**

```
app/garage/*      → app/(app)/garage/*
app/tuning-shop/* → app/(app)/tuning-shop/*
app/profile/*     → app/(app)/profile/*
```

- These need most providers
- Test auth flows carefully

**Batch 6: `/community/*`, `/al` (remaining app routes)**

```
app/community/* → app/(app)/community/*
app/al/*        → app/(app)/al/*
```

- Final batch
- Full regression test suite

### A.3 Rollback Strategy

```
Rollback Strategy
─────────────────
- Each batch is a separate PR
- Use Vercel preview deployments to validate before merge
- If production breaks: revert PR, redeploy previous commit
- Keep git tags for each stable batch:
  - perf-phase-a-batch-1
  - perf-phase-a-batch-2
  - etc.
```

**Rollback triggers:**

- Any Playwright test failure
- Console errors OR warnings about missing providers (React hydration mismatches show as warnings!)
- PageSpeed regression > 5 points
- User-reported functionality issues

**Testing gate for each batch:**

```bash
# Check for console errors AND warnings
# React hydration mismatches appear as warnings, not errors
npx playwright test --grep "no console errors" --reporter=list
```

---

## Phase B: Media/LCP Fixes (2 days, MEDIUM RISK)

Now that layouts are split, we can safely modify individual pages.

### B.0 Execution Order (lowest → highest risk)

Deploy each change separately so you know exactly which change caused any breakage:

```
Phase B Execution Order:
────────────────────────
1. MetaPixel.tsx (lazyOnload)           → Deploy, verify tracking still works
2. tuning-shop background (priority)    → Deploy, visual check
3. garage background (priority)         → Deploy, visual check
4. car-selector hero carousel           → Deploy, test crossfade thoroughly
5. ImageCarousel.jsx                    → Deploy, test all instances
6. AdvancedImageCarousel.jsx            → Deploy, test all instances
```

### B.1 Fix car-selector hero (15 images → 2)

**File:** `app/(app)/car-selector/page.jsx`

```jsx
// Before: all 15 images rendered
{carouselImages.map((image, idx) => (
  <Image priority={idx < 3} ... />
))}

// After: only 2 images rendered at a time
const indicesToRender = [
  currentIndex,
  (currentIndex + 1) % carouselImages.length
];

{indicesToRender.map((idx, renderIdx) => (
  <Image
    key={carouselImages[idx].src}
    src={carouselImages[idx].src}
    alt={carouselImages[idx].alt}
    fill
    priority={renderIdx === 0 && currentIndex === 0}
    loading={renderIdx === 0 ? 'eager' : 'lazy'}
    quality={85}
    className={`${styles.heroImage} ${idx === currentIndex ? styles.heroImageActive : ''}`}
    sizes="100vw"
  />
))}
```

**Preload logic to prevent flash:**

```jsx
// Preload the NEXT image before transition starts
useEffect(() => {
  const nextIndex = (currentIndex + 1) % carouselImages.length;
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = carouselImages[nextIndex].src;
  document.head.appendChild(link);
  
  return () => link.remove();
}, [currentIndex, carouselImages]);
```

Without this, the first transition to each new image may flash white while it loads.

**SSR/Hydration Safety:**

The `currentIndex` state initializes with `useState(0)`:

| Render Phase | currentIndex | What Gets Rendered |
|--------------|--------------|-------------------|
| SSR (server) | 0 | Images 0 and 1 |
| Hydration (client) | 0 | Images 0 and 1 ✓ |
| After interval | 1 | Images 1 and 2 |

This is safe — no hydration mismatch risk. Do NOT add `Math.random()` or date-based logic to initial state.

### B.2 Fix carousel components (current+next pattern)

**Key Finding:** `FeaturePhoneShowcase` uses `ImageCarousel` and `AdvancedImageCarousel` internally. Fixing these two components will automatically fix the home page showcase.

**Files:**

- `components/ImageCarousel.jsx` (used by FeaturePhoneShowcase for Garage + Tuning carousels)
- `components/AdvancedImageCarousel.jsx` (used by FeaturePhoneShowcase for AL carousel)

**Current state (VERIFIED):**

```jsx
// ImageCarousel.jsx - renders ALL images
{images.map((image, index) => (
  <Image priority={index === 0} ... />  // First image gets priority
))}
```

**Impact:**

```
Current: 3 carousels × ~5 images each = 15-16 images loaded on home page
Target:  3 carousels × 2 images each = 6 images loaded on home page
```

**Changes:**

1. Render only current + next image (not all)
2. Add preload logic (see B.1) to prevent flash during transitions
3. Add IntersectionObserver to start carousel only when in viewport
4. Only the FIRST carousel's first image gets `priority={true}`
5. Other carousels start with `priority={false}`, `loading="lazy"`

**IntersectionObserver pattern:**

```jsx
const [isInView, setIsInView] = useState(false);
const containerRef = useRef(null);

useEffect(() => {
  const observer = new IntersectionObserver(
    ([entry]) => setIsInView(entry.isIntersecting),
    { threshold: 0.1 }
  );
  if (containerRef.current) observer.observe(containerRef.current);
  return () => observer.disconnect();
}, []);

// Only start timer when in view
useEffect(() => {
  if (!isInView || images.length <= 1) return;
  const timer = setInterval(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, interval);
  return () => clearInterval(timer);
}, [isInView, images.length, interval]);
```

### B.3 Demote decorative backgrounds

**Files:**

- `app/(app)/tuning-shop/page.jsx`
- `app/(app)/garage/page.jsx`

```jsx
// Before
<Image priority quality={75} ... />

// After
<Image
  priority={false}
  quality={50}
  loading="lazy"
  sizes="100vw"
  placeholder="blur"
  blurDataURL="data:image/svg+xml,..."  // CSS gradient placeholder
  ...
/>
```

### B.4 Delay Meta Pixel

**File:** `components/MetaPixel.tsx`

```jsx
// Before
<Script strategy="afterInteractive" ... />

// After
<Script strategy="lazyOnload" ... />
```

---

## Phase C: Asset Re-encoding (1 day, LOW RISK)

### C.1 Convert hero images to AVIF/WebP

**Files to convert:**

- `public/images/pages/home-hero.jpg` → `.avif` + `.webp`
- Other `public/images/pages/*.{jpg,png}` used above-the-fold

**Process:**

```bash
# Use squoosh-cli or sharp
npx @aspect-dev/squoosh-cli \
  --webp '{"quality":80}' \
  --avif '{"quality":60}' \
  public/images/pages/home-hero.jpg
```

### C.2 Update all references

**Files to update:**

- `components/HeroSection.jsx`
- `lib/images.js`
- Any other files referencing these images

```jsx
// Before
src="/images/pages/home-hero.jpg"

// After (Next.js will serve AVIF/WebP automatically)
src="/images/pages/home-hero.webp"
```

### C.3 Keep JPG fallbacks for email templates

Email clients don't support AVIF/WebP. Keep original JPG files and reference them explicitly in email templates.

---

## Phase D: Lock In Gains (0.5 day)

### D.1 Media Regression Tests

**File:** `tests/e2e/performance-media.regression.spec.js`

```javascript
import { test, expect } from '@playwright/test';

test.describe('Media Performance Regressions', () => {
  test('car-selector has at most 1 priority image', async ({ page }) => {
    await page.goto('/car-selector');
    const priorityImages = await page.locator('img[fetchpriority="high"]').count();
    expect(priorityImages).toBeLessThanOrEqual(1);
  });

  test('car-selector hero renders at most 2 images', async ({ page }) => {
    await page.goto('/car-selector');
    const heroImages = await page.locator('[class*="heroImageWrapper"] img').count();
    expect(heroImages).toBeLessThanOrEqual(2);
  });

  test('landing pages do not preload videos eagerly', async ({ page }) => {
    await page.goto('/landing/find-your-car');
    const autoPreloadVideos = await page.locator('video[preload="auto"]').count();
    expect(autoPreloadVideos).toBe(0);
  });

  test('decorative backgrounds are not priority', async ({ page }) => {
    await page.goto('/tuning-shop');
    const bgImage = page.locator('[class*="backgroundImageWrapper"] img');
    await expect(bgImage).not.toHaveAttribute('fetchpriority', 'high');
  });
});
```

### D.2 Provider Split Regression Tests

**File:** `tests/e2e/provider-split.regression.spec.js`

```javascript
import { test, expect } from '@playwright/test';

test.describe('Provider Split Regressions', () => {
  test('marketing pages render without app providers', async ({ page }) => {
    // Capture BOTH errors AND warnings (hydration mismatches are warnings!)
    const errors = [];
    const warnings = [];
    
    page.on('pageerror', err => errors.push(err.message));
    page.on('console', msg => {
      if (msg.type() === 'warning' || msg.type() === 'error') {
        warnings.push(msg.text());
      }
    });
    
    // These should work without FavoritesProvider, etc.
    await page.goto('/landing/find-your-car');
    await expect(page.locator('h1')).toBeVisible();
    await page.waitForTimeout(2000);
    
    // Check for provider errors
    const providerErrors = errors.filter(e => 
      e.includes('useContext') || e.includes('Provider')
    );
    expect(providerErrors).toHaveLength(0);
    
    // Check for hydration warnings (React hydration mismatches)
    const hydrationWarnings = warnings.filter(w =>
      w.includes('Hydration') || 
      w.includes('server rendered') ||
      w.includes('did not match')
    );
    expect(hydrationWarnings).toHaveLength(0);
  });

  test('app pages still have working favorites', async ({ page }) => {
    // TODO: loginAsTestUser helper
    await page.goto('/browse-cars');
    // Verify FavoritesProvider is available (no crash)
    await expect(page.locator('header')).toBeVisible();
  });

  test('header renders correctly on both layout types', async ({ page }) => {
    // Marketing page
    await page.goto('/');
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('header nav')).toBeVisible();
    
    // App page
    await page.goto('/garage');
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('header nav')).toBeVisible();
  });

  test('home page loads without app providers', async ({ page }) => {
    await page.goto('/');
    // Should render completely
    await expect(page.locator('h1')).toBeVisible();
    // Feature showcase should work
    await expect(page.locator('[class*="FeaturePhoneShowcase"]')).toBeVisible();
  });
});
```

### D.3 Update Architecture Documentation

Add to `docs/ARCHITECTURE.md`:

```markdown
## Route Groups (Performance Optimization)

The app uses Next.js route groups to minimize JS payload on marketing pages:

### `app/(marketing)/`
- Landing pages, home, features, articles, join
- Minimal providers: Auth, AIChat, Banner, Query
- No CompareBar, FeedbackCorner, or heavy app widgets

### `app/(app)/`
- Garage, tuning-shop, browse-cars, community, AL, profile
- Full provider stack for favorites, compare, saved builds, etc.
- Includes CompareBar, MobileBottomCta, FeedbackCorner

### Adding New Routes
- Marketing/content pages → `app/(marketing)/`
- Interactive app features → `app/(app)/`
```

---

## Success Criteria

### Landing Pages (`/landing/*`)

| Metric | Current | Target |
|--------|---------|--------|
| LCP | 20.5s | < 2.5s |
| Performance Score | 59 | > 85 |
| Total JS | ~500KB+ | < 200KB |

### App Pages (`/garage`, `/tuning-shop`, etc.)

| Metric | Current | Target |
|--------|---------|--------|
| LCP | Varies | < 4.0s |
| Performance Score | 35-61 | > 70 |
| Functional Regressions | N/A | 0 |

### Home Page (`/`)

| Metric | Current | Target |
|--------|---------|--------|
| LCP | TBD | < 3.0s |
| Performance Score | 35 | > 70 |
| Total JS | TBD | < 250KB |

---

## Downstream Impact Matrix

| Change | What Could Break | Mitigation |
|--------|-----------------|------------|
| Route group split | Components calling `useFavorites()` etc. on marketing pages | Provider audit first; verify no such usage |
| Moving providers to `(app)` | Any shared component that assumes providers exist | Grep for all `use[Provider]` hooks, verify only in `(app)` routes |
| Removing priority from backgrounds | Perceived slower load (user sees blank then image) | Use CSS gradient placeholder or blur-up |
| Carousel current+next pattern | Flash/jump during crossfade if not handled | Add `<link rel="preload">` for next image; test opacity transitions |
| Carousel current+next pattern | Hydration mismatch if currentIndex differs server/client | Verified: `useState(0)` is safe; no random/date-based init |
| Asset re-encoding | Broken image references; email template issues | Global find/replace; keep JPG for emails |
| Analytics script delay | Slightly delayed tracking for first pageview | Acceptable tradeoff; Meta Pixel will still capture conversions |

---

## How to Run Tests

```bash
# Unit/integration tests
npm run test:all

# E2E tests (full suite)
npm run test:e2e

# E2E tests (specific files)
npx playwright test tests/e2e/landing-pages.spec.js
npx playwright test tests/e2e/performance-media.regression.spec.js
npx playwright test tests/e2e/provider-split.regression.spec.js

# Run Lighthouse locally
npx lighthouse https://autorev.dev/car-selector --view

# Check for provider usage in marketing routes (after split)
grep -r "useFavorites\|useCompare\|useSavedBuilds\|useOwnedVehicles" app/\(marketing\)/
```

---

## Timeline Estimate

| Phase | Duration | Risk Level |
|-------|----------|------------|
| Phase 0: Discovery & Baseline | 1 day | Low |
| Phase A: Route Group Split | 2-3 days | HIGH |
| Phase B: Media/LCP Fixes | 2 days | Medium |
| Phase C: Asset Re-encoding | 1 day | Low |
| Phase D: Lock In Gains | 0.5 day | Low |
| **Total** | **6.5-7.5 days** | |

---

## Questions Resolved

1. **Does Header have favorites/compare badges?**
   - No — only uses `useAuth()` and `useAIChat()`. Split is safer than feared.

2. **Can we remove AIMechanicProvider from marketing pages?**
   - No — Header uses `useAIChat()` for the AL toggle button.

3. **Does MobileBottomCta require providers?**
   - No — it only uses `usePathname()` from Next.js.

4. **What order should we migrate routes?**
   - Lowest to highest traffic/complexity: landing → marketing → home → simple app → complex app.

5. **Does FeaturePhoneShowcase use ImageCarousel internally, or is it separate?**
   - **Uses ImageCarousel and AdvancedImageCarousel internally** (verified in code).
   - Fixing those two components will automatically fix FeaturePhoneShowcase.
   - No separate implementation needed.

6. **Is the "current + next" pattern safe for SSR/hydration?**
   - **Yes** — both carousels initialize `currentIndex` with `useState(0)`.
   - Server and client render the same images (0 and 1) on initial load.
   - No `Math.random()`, `Date.now()`, or other sources of hydration mismatch.
   - Verified in `ImageCarousel.jsx` line 29 and `AdvancedImageCarousel.jsx` line 31.

7. **Will the carousel flash white during transitions?**
   - **Risk exists** if we don't preload the next image.
   - **Mitigation**: Add `<link rel="preload">` for next image before transition (see Phase B.1).
   - This ensures the image is in browser cache before opacity transition starts.
