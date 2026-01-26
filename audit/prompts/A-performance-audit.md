# AUDIT: Performance - Codebase-Wide

> **Audit ID:** A  
> **Category:** Cross-Cutting (Foundation)  
> **Priority:** 8 of 36  
> **Dependencies:** C (Database), I (State Management), H (API)  
> **Downstream Impact:** Page audits will verify page-specific performance

---

## CONTEXT

This audit ensures AutoRev delivers a fast, responsive experience that meets Core Web Vitals targets. Poor performance leads to user abandonment, lower SEO rankings, and degraded mobile experience.

**Key Focus Areas:**
- Core Web Vitals (LCP, INP, CLS)
- Bundle size optimization
- Image optimization
- Database query efficiency
- React re-render optimization
- Caching strategies

---

## CRITICAL: Read These First

Before making ANY changes, read these documents completely:

1. `docs/SOURCE_OF_TRUTH.md` - Performance section
2. `.cursor/rules/specialists/quality/performance-agent.mdc` - Performance targets
3. `next.config.js` - Build configuration
4. `vercel.json` - Deployment configuration

---

## IMPORTANT: INVESTIGATE BEFORE FIX

Before changing ANY code:

1. ✅ Measure current performance (Lighthouse, WebPageTest)
2. ✅ Profile before optimizing (React DevTools Profiler)
3. ✅ Verify the "slow" code is actually on the critical path
4. ❌ Do NOT prematurely optimize without measurement
5. ❓ If something seems slow but works, measure first

---

## PERFORMANCE TARGETS

### Core Web Vitals

| Metric | Target | Good | Needs Improvement | Poor |
|--------|--------|------|-------------------|------|
| **LCP** (Largest Contentful Paint) | < 2.5s | < 2.5s | 2.5s - 4.0s | > 4.0s |
| **INP** (Interaction to Next Paint) | < 200ms | < 200ms | 200ms - 500ms | > 500ms |
| **CLS** (Cumulative Layout Shift) | < 0.1 | < 0.1 | 0.1 - 0.25 | > 0.25 |
| **TTFB** (Time to First Byte) | < 800ms | < 800ms | 800ms - 1.8s | > 1.8s |

### Bundle Targets

| Bundle | Target | Warning |
|--------|--------|---------|
| First Load JS | < 100kB | > 150kB |
| Page JS | < 50kB | > 75kB |
| Total JS | < 300kB | > 400kB |

---

## CHECKLIST

### A. Core Web Vitals - LCP (CRITICAL)

- [ ] Hero images use `priority` prop
- [ ] Critical fonts preloaded
- [ ] No render-blocking resources
- [ ] Server components for static content
- [ ] Streaming with Suspense for dynamic content
- [ ] LCP element identified and optimized

### B. Core Web Vitals - INP

- [ ] Event handlers are fast (< 50ms)
- [ ] Heavy computations use Web Workers or deferred
- [ ] No long tasks blocking main thread
- [ ] State updates batched where possible
- [ ] Optimistic UI for perceived performance

### C. Core Web Vitals - CLS

- [ ] All images have explicit width/height
- [ ] Fonts use `font-display: swap` with fallback
- [ ] Skeleton loaders match content dimensions
- [ ] No content inserted above visible content
- [ ] Ads/embeds have reserved space

### D. Image Optimization

- [ ] All images use Next.js `<Image>` component
- [ ] Images have explicit width and height
- [ ] Hero/LCP images use `priority`
- [ ] Below-fold images use `loading="lazy"`
- [ ] Images served in modern formats (WebP/AVIF)
- [ ] Responsive images with `sizes` attribute
- [ ] No oversized images (check actual vs displayed size)

### E. Bundle Size

- [ ] Tree-shakeable imports (named, not namespace)
- [ ] Heavy components lazy loaded with `dynamic()`
- [ ] No unused dependencies
- [ ] Moment.js replaced with date-fns or native
- [ ] Lodash: specific imports, not full library
- [ ] Icons: specific imports, not full icon set

### F. Data Fetching

- [ ] Parallel fetching with `Promise.all()`
- [ ] No waterfall requests
- [ ] React Query for client-side caching
- [ ] Proper staleTime/cacheTime configuration
- [ ] Prefetching for predictable navigation
- [ ] Streaming with Suspense boundaries

### G. Database Queries

- [ ] Select specific fields, not `*`
- [ ] No N+1 query patterns
- [ ] Indexes on frequently queried columns
- [ ] RPCs used for complex queries
- [ ] Query results cached where appropriate

### H. React Optimization

- [ ] useMemo for expensive computations
- [ ] useCallback for callback props
- [ ] React.memo for pure components
- [ ] Keys are stable (not array index for dynamic lists)
- [ ] No inline object/array literals in props
- [ ] Context split by update frequency

### I. Caching

- [ ] Static assets have cache headers
- [ ] API responses cached where appropriate
- [ ] React Query cache configured
- [ ] ISR/SSG for semi-static content
- [ ] CDN caching configured

### J. Third-Party Scripts

- [ ] Analytics loaded asynchronously
- [ ] Third-party scripts deferred
- [ ] No blocking external resources
- [ ] Script loading strategy documented

---

## KEY FILES TO EXAMINE

### Configuration

| File | Check For |
|------|-----------|
| `next.config.js` | Image optimization, bundle analysis |
| `vercel.json` | Caching headers |
| `app/layout.jsx` | Font loading, critical CSS |

### High-Impact Pages

| File | Check For |
|------|-----------|
| `app/(marketing)/page.jsx` | Landing page LCP |
| `app/(app)/garage/page.jsx` | Data loading patterns |
| `app/(app)/data/page.jsx` | Chart rendering |
| `app/(app)/al/ALPageClient.jsx` | Streaming, interactions |

### Heavy Components

| File | Check For |
|------|-----------|
| `components/VirtualDynoChart.jsx` | Chart library, data handling |
| `components/LapTimeEstimator.jsx` | Calculations, rendering |
| Image galleries | Lazy loading |

### Data Fetching

| File | Check For |
|------|-----------|
| `hooks/useCarData.js` | Query patterns |
| `lib/carsClient.js` | Caching, batching |
| `app/api/*/route.js` | Response times |

---

## AUTOMATED CHECKS

### Lighthouse & Web Vitals

```bash
# Run Lighthouse CI (if configured)
npm run lighthouse

# Or use Chrome DevTools:
# 1. Open DevTools > Lighthouse
# 2. Select "Performance" category
# 3. Run audit on mobile and desktop
```

### Bundle Analysis

```bash
# Analyze bundle size
npm run build
npx @next/bundle-analyzer

# Or add to next.config.js:
# const withBundleAnalyzer = require('@next/bundle-analyzer')({
#   enabled: process.env.ANALYZE === 'true',
# })

ANALYZE=true npm run build
```

### Find Performance Issues

```bash
# 1. Find select('*') patterns
grep -rn "\.select\('\*'\)" --include="*.js" app/ lib/

# 2. Find potential N+1 queries
grep -rn "for.*await\|\.map.*await\|\.forEach.*await" --include="*.js" --include="*.jsx" app/ lib/

# 3. Find images without dimensions
grep -rn "<img\|<Image" --include="*.jsx" app/ components/ | grep -v "width=\|height="

# 4. Find non-lazy dynamic imports
grep -rn "import(" --include="*.jsx" app/ components/ | grep -v "dynamic\|lazy"

# 5. Find large library imports
grep -rn "import \* as\|from 'lodash'\|from 'moment'" --include="*.js" --include="*.jsx" app/ lib/ components/

# 6. Find inline object literals in JSX props
grep -rn "={{" --include="*.jsx" app/ components/ | grep -v "className\|style="

# 7. Find missing priority on hero images
grep -rn "<Image" --include="*.jsx" app/\(marketing\)/ | head -20 | grep -v "priority"

# 8. Find render-blocking patterns
grep -rn "useEffect.*fetch\|useEffect.*await" --include="*.jsx" -A5 app/ components/
```

### React Profiler Analysis

1. Open React DevTools
2. Go to Profiler tab
3. Record a session
4. Look for:
   - Components rendering > 16ms
   - Unnecessary re-renders
   - Cascading updates

---

## SOURCE OF TRUTH PATTERNS

From Performance Agent:

### Image Optimization

```tsx
// ✅ CORRECT: Hero image with priority
<Image
  src={car.hero_image}
  width={1200}
  height={600}
  priority  // Load immediately for LCP
  alt={car.name}
/>

// ✅ CORRECT: Below-fold image with lazy loading
<Image
  src={photo.url}
  width={400}
  height={300}
  loading="lazy"
  alt={photo.caption}
/>

// ❌ WRONG: Missing dimensions (causes CLS)
<Image src={car.image} alt={car.name} />

// ❌ WRONG: Using <img> instead of <Image>
<img src={car.image} alt={car.name} />
```

### Data Fetching

```typescript
// ✅ CORRECT: Parallel fetching
const [car, tuning, issues] = await Promise.all([
  fetchCar(slug),
  fetchTuningProfile(slug),
  fetchKnownIssues(slug),
]);

// ✅ CORRECT: Streaming with Suspense
<Suspense fallback={<TuningSkeleton />}>
  <TuningSection slug={slug} />
</Suspense>

// ❌ WRONG: Sequential fetching (waterfall)
const car = await fetchCar(slug);
const tuning = await fetchTuningProfile(slug);  // Waits for car
const issues = await fetchKnownIssues(slug);    // Waits for tuning
```

### Bundle Optimization

```typescript
// ✅ CORRECT: Tree-shakeable import
import { format } from 'date-fns';

// ❌ WRONG: Imports entire library
import * as dateFns from 'date-fns';
import moment from 'moment';

// ✅ CORRECT: Lazy load heavy component
const HeavyChart = dynamic(() => import('./Chart'), {
  loading: () => <ChartSkeleton />,
  ssr: false,
});

// ❌ WRONG: Eager import of heavy component
import HeavyChart from './Chart';
```

### React Optimization

```tsx
// ✅ CORRECT: Memoized expensive computation
const sortedCars = useMemo(() => 
  cars.sort((a, b) => b.hp - a.hp),
  [cars]
);

// ✅ CORRECT: Stable callback reference
const handleSelect = useCallback((id) => {
  setSelectedId(id);
}, []);

// ❌ WRONG: New function on every render
<CarList onSelect={(id) => setSelectedId(id)} />

// ❌ WRONG: New object on every render
<CarCard style={{ margin: 10 }} />  // Creates new object each render
```

---

## PERFORMANCE BUDGET

| Category | Budget | Current | Status |
|----------|--------|---------|--------|
| LCP (mobile) | < 2.5s | | |
| LCP (desktop) | < 2.0s | | |
| INP | < 200ms | | |
| CLS | < 0.1 | | |
| First Load JS | < 100kB | | |
| Lighthouse Performance | > 90 | | |

---

## DELIVERABLES

### 1. Performance Report

| Metric | Mobile | Desktop | Target | Status |
|--------|--------|---------|--------|--------|
| LCP | | | < 2.5s | |
| INP | | | < 200ms | |
| CLS | | | < 0.1 | |
| Performance Score | | | > 90 | |

### 2. Violation Report

| Priority | Category | Location | Issue | Fix | Impact |
|----------|----------|----------|-------|-----|--------|
| High | LCP | | | | |
| High | Bundle | | | | |
| Medium | Caching | | | | |

### 3. Bundle Analysis

| Chunk | Size | Contains | Optimization |
|-------|------|----------|--------------|
| | | | |

---

## VERIFICATION

- [ ] Lighthouse Performance score ≥ 90 (mobile)
- [ ] LCP < 2.5s on 3G throttling
- [ ] INP < 200ms on key interactions
- [ ] CLS < 0.1 on all pages
- [ ] No images without dimensions
- [ ] No N+1 query patterns
- [ ] Bundle size within budget

---

## SUCCESS CRITERIA

| # | Criterion |
|---|-----------|
| 1 | Lighthouse Performance ≥ 90 (mobile) |
| 2 | LCP < 2.5s on landing and key pages |
| 3 | INP < 200ms on interactive elements |
| 4 | CLS < 0.1 (no layout shifts) |
| 5 | First Load JS < 100kB |
| 6 | All images optimized with Next.js Image |
| 7 | No N+1 queries or waterfalls |
| 8 | Heavy components lazy loaded |

---

## OUTPUT FORMAT

```
⚡ PERFORMANCE AUDIT RESULTS

**Lighthouse Scores:**
- Mobile: X/100
- Desktop: X/100

**Core Web Vitals:**
| Metric | Mobile | Desktop | Status |
|--------|--------|---------|--------|
| LCP | Xs | Xs | ✅/❌ |
| INP | Xms | Xms | ✅/❌ |
| CLS | X | X | ✅/❌ |

**Bundle Size:**
- First Load JS: XkB (target: <100kB)
- Total JS: XkB

**Critical Issues:**
1. [page/component] [issue] → [fix]
...

**Optimization Opportunities:**
1. [location] [current] → [optimized] (est. impact)
...

**Patterns for Page Audits:**
- Check image optimization on each page
- Verify data fetching is parallel
- Look for render-blocking resources
...
```

---

## AUDIT EXECUTION LOG

| Date | Auditor | Lighthouse Mobile | LCP | Bundle Size | Notes |
|------|---------|-------------------|-----|-------------|-------|
| | | | | | |

---

*Audit prompt generated: January 25, 2026*  
*Part of AutoRev Systematic Audit Suite (36 total audits)*
