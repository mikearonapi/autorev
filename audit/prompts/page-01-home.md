# PAGE AUDIT: / - Home (Landing Page)

> **Audit ID:** Page-01  
> **Category:** Public Marketing Page  
> **Priority:** 29 of 36  
> **Route:** `/`  
> **Auth Required:** No  
> **SEO Critical:** Yes

---

## PAGE OVERVIEW

The Home/Landing page is the **primary marketing page** for AutoRev. It introduces the product, showcases features, and drives conversions (sign-ups). This is the highest-traffic public page.

**Key Features:**
- Hero section with value proposition
- Feature highlights
- Social proof (testimonials, stats)
- Call-to-action (sign up)
- Product screenshots/demos
- Pricing preview (optional)

---

## FILES TO EXAMINE

### Page Files

| File | Purpose |
|------|---------|
| `app/(marketing)/page.jsx` | Landing page |
| `app/(marketing)/page.module.css` | Landing styles |
| `app/(marketing)/layout.jsx` | Marketing layout |

### Related Components

| File | Purpose |
|------|---------|
| `components/Hero.jsx` | Hero section |
| `components/FeatureCard.jsx` | Feature highlights |
| `components/TestimonialCard.jsx` | Social proof |
| `components/PricingCard.jsx` | Pricing display |
| `components/CTAButton.jsx` | Call-to-action |

---

## CRITICAL: Read These First

Before making ANY changes:

1. `docs/SOURCE_OF_TRUTH.md` - Marketing pages section
2. `docs/BRAND_GUIDELINES.md` - Brand colors, typography, imagery
3. Cross-cutting audit findings:
   - J (SEO) - Metadata, structured data
   - A (Performance) - LCP, CLS for landing
   - E (Accessibility) - Public page accessibility

---

## IMPORTANT: INVESTIGATE BEFORE FIX

Before changing ANY code:

1. ✅ Verify page loads correctly
2. ✅ Test all CTAs work
3. ✅ Check mobile layout
4. ❌ Do NOT change copy without approval
5. ❓ If CTAs broken, check auth routing

---

## CHECKLIST

### A. Functionality

- [ ] Page loads correctly
- [ ] All links work
- [ ] Sign up CTA works
- [ ] Login link works
- [ ] Images load
- [ ] Animations work
- [ ] Mobile menu works

### B. SEO (CRITICAL for Landing Page)

- [ ] `<title>` tag descriptive
- [ ] `<meta name="description">` compelling
- [ ] Open Graph tags complete
- [ ] Twitter Card tags
- [ ] Structured data (Organization, WebSite)
- [ ] Canonical URL set
- [ ] H1 present and descriptive

### C. UI/UX Design System

- [ ] **Primary CTA** = Lime
- [ ] **Secondary CTA** = Outline/ghost
- [ ] **Accent highlights** = Teal
- [ ] **Brand colors** consistent
- [ ] No hardcoded colors
- [ ] 44px touch targets

### D. Hero Section

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  [Logo]                    [Features] [Pricing] [Login]     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│       The Ultimate Platform for                             │
│       Car Enthusiasts                                       │
│                                                             │
│       Track, tune, and optimize your                        │
│       vehicle with AI-powered insights.                     │
│                                                             │
│       [Get Started Free] (lime)  [Learn More] (ghost)       │
│                                                             │
│           [Hero Image / Product Screenshot]                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

- [ ] H1 headline prominent
- [ ] Value prop clear
- [ ] Primary CTA visible (lime)
- [ ] Hero image optimized
- [ ] Above-the-fold loads fast

### E. Feature Sections

- [ ] Feature cards/blocks
- [ ] Icons or illustrations
- [ ] Clear feature names
- [ ] Brief descriptions
- [ ] Consistent layout

### F. Social Proof

- [ ] Testimonials (if present)
- [ ] Stats/numbers
- [ ] Trust badges
- [ ] User count (if applicable)

### G. CTA Sections

| CTA | Style | Destination |
|-----|-------|-------------|
| Primary (Hero) | Lime filled | Sign up |
| Secondary | Ghost/outline | Learn more |
| Final CTA | Lime filled | Sign up |

- [ ] CTAs use lime for primary
- [ ] Clear action text
- [ ] Proper link destinations
- [ ] 44px touch targets

### H. Navigation

- [ ] Logo links to home
- [ ] Nav links work
- [ ] Mobile hamburger menu
- [ ] Auth buttons (Login/Sign up)

### I. Images & Media

- [ ] Uses Next.js `<Image>`
- [ ] Proper dimensions
- [ ] Alt text on all images
- [ ] Lazy loading below fold
- [ ] Priority for hero image

### J. Performance (Landing Critical)

- [ ] LCP < 2.5s
- [ ] CLS < 0.1
- [ ] Hero image optimized
- [ ] No layout shifts
- [ ] Fast initial load

### K. Loading States

- [ ] No content flash
- [ ] Skeleton if needed
- [ ] Smooth transitions

### L. Accessibility

- [ ] Skip to content link
- [ ] Semantic headings (H1→H2→H3)
- [ ] Images have alt text
- [ ] Links descriptive
- [ ] Contrast ratios met
- [ ] Keyboard navigable

### M. Mobile Responsiveness

- [ ] Hero stacks on mobile
- [ ] Navigation collapses
- [ ] CTAs full-width
- [ ] Images scale
- [ ] 44px touch targets
- [ ] Readable on 320px

### N. Footer

- [ ] Links to legal pages
- [ ] Social media links
- [ ] Contact info
- [ ] Copyright

---

## SPECIFIC CHECKS

### SEO Metadata

```javascript
// Landing page must have complete metadata
export const metadata = {
  title: 'AutoRev - The Ultimate Platform for Car Enthusiasts',
  description: 'Track, tune, and optimize your vehicle with AI-powered insights. Join thousands of enthusiasts building their dream rides.',
  openGraph: {
    title: 'AutoRev - The Ultimate Platform for Car Enthusiasts',
    description: 'Track, tune, and optimize your vehicle with AI-powered insights.',
    images: ['/og-image.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AutoRev - The Ultimate Platform for Car Enthusiasts',
    description: 'Track, tune, and optimize your vehicle with AI-powered insights.',
    images: ['/og-image.png'],
  },
};
```

### Hero CTA Pattern

```javascript
// CTAs should use lime for primary
<div className={styles.heroCtas}>
  <Link 
    href="/signup" 
    className={cn(styles.cta, styles.primary)}
  >
    Get Started Free
  </Link>
  <Link 
    href="#features" 
    className={cn(styles.cta, styles.secondary)}
  >
    Learn More
  </Link>
</div>

// Styles
.cta.primary {
  background: var(--color-accent-lime);
  color: var(--color-bg-primary);
  min-height: 44px;
  padding: var(--space-3) var(--space-6);
}
.cta.secondary {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
}
```

### Hero Image Pattern

```javascript
// Hero image should be optimized
<div className={styles.heroImage}>
  <Image
    src="/hero-screenshot.png"
    alt="AutoRev dashboard showing vehicle performance metrics"
    width={1200}
    height={675}
    priority // LCP element
    quality={90}
  />
</div>
```

### Structured Data

```javascript
// Add JSON-LD for organization
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "AutoRev",
  "url": "https://autorev.app",
  "description": "The ultimate platform for car enthusiasts",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://autorev.app/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
</script>
```

---

## TESTING SCENARIOS

### Test Case 1: Page Load

1. Navigate to /
2. **Expected:** Landing page loads
3. **Verify:** Hero, features, CTAs visible

### Test Case 2: Primary CTA

1. Click "Get Started Free"
2. **Expected:** Navigate to sign up
3. **Verify:** Correct destination

### Test Case 3: Mobile Navigation

1. View on mobile, tap hamburger
2. **Expected:** Menu opens
3. **Verify:** Links work, can close

### Test Case 4: Hero Image

1. Inspect hero image in DevTools
2. **Expected:** Next.js Image, priority set
3. **Verify:** Optimized, proper alt

### Test Case 5: SEO Tags

1. View page source
2. **Expected:** Title, meta description, OG tags
3. **Verify:** All present and descriptive

### Test Case 6: Performance

1. Run Lighthouse on /
2. **Expected:** LCP < 2.5s, CLS < 0.1
3. **Verify:** Green scores

### Test Case 7: Accessibility

1. Tab through page
2. **Expected:** All interactive elements focusable
3. **Verify:** Skip link, focus visible

---

## AUTOMATED CHECKS

```bash
# 1. Check for hardcoded colors
grep -rn "#[0-9a-fA-F]\{3,6\}" app/\(marketing\)/page.jsx app/\(marketing\)/page.module.css

# 2. Check for design tokens
grep -rn "accent-lime\|accent-teal" app/\(marketing\)/page.jsx

# 3. Check for Next.js Image
grep -rn "next/image\|<Image" app/\(marketing\)/page.jsx

# 4. Check for metadata export
grep -rn "export const metadata" app/\(marketing\)/page.jsx

# 5. Check for structured data
grep -rn "application/ld+json\|@context" app/\(marketing\)/page.jsx

# 6. Check for console.log
grep -rn "console\.log" app/\(marketing\)/page.jsx
```

---

## CROSS-REFERENCE WITH FOUNDATION AUDITS

| Audit | Check On This Page |
|-------|-------------------|
| J. SEO | Metadata, OG, structured data |
| A. Performance | LCP, CLS, image optimization |
| E. Accessibility | Skip link, headings, alt text |
| D. UI/UX | Brand compliance, CTAs |

---

## DELIVERABLES

### 1. Functionality Report

| Feature | Works | Issues |
|---------|-------|--------|
| Page loads | ✅/❌ | |
| Hero section | ✅/❌ | |
| Primary CTA | ✅/❌ | |
| Navigation | ✅/❌ | |
| Mobile layout | ✅/❌ | |

### 2. SEO Compliance Report

| Element | Present | Content OK | Status |
|---------|---------|------------|--------|
| `<title>` | ✅/❌ | ✅/❌ | |
| Meta description | ✅/❌ | ✅/❌ | |
| OG tags | ✅/❌ | ✅/❌ | |
| H1 | ✅/❌ | ✅/❌ | |
| Structured data | ✅/❌ | ✅/❌ | |

### 3. CTA Compliance Report

| CTA | Expected Color | Actual | Status |
|-----|----------------|--------|--------|
| Primary | Lime | | ✅/❌ |
| Secondary | Ghost | | ✅/❌ |
| Final CTA | Lime | | ✅/❌ |

### 4. Issues Found

| Severity | Issue | File:Line | Fix |
|----------|-------|-----------|-----|
| | | | |

---

## VERIFICATION

- [ ] Page loads under 3s
- [ ] Primary CTAs use lime
- [ ] All SEO tags present
- [ ] Images use Next.js Image
- [ ] Mobile responsive
- [ ] Accessible navigation

---

## SUCCESS CRITERIA

| # | Criterion |
|---|-----------|
| 1 | Page loads correctly |
| 2 | Primary CTAs = lime |
| 3 | Complete SEO metadata |
| 4 | LCP < 2.5s |
| 5 | Mobile responsive |
| 6 | Accessibility passed |
| 7 | No critical/high issues remaining |

---

## OUTPUT FORMAT

```
🏠 PAGE AUDIT: / (Home)

**Status:** ✅ Pass / ⚠️ Issues / ❌ Fail

**SEO Compliance:** ✅ / ❌
- Title: ✅
- Meta description: ✅
- OG tags: ✅
- Structured data: ❌

**CTA Compliance:** ✅ / ❌
- Primary CTA: Lime ✅
- Secondary: Ghost ✅

**Performance:**
- LCP: 2.1s ✅
- CLS: 0.05 ✅

**Issues Found:**
1. [Medium] Missing structured data
2. [Low] Hero image missing priority
...

**Test Results:**
- Page load: ✅
- CTAs: ✅
- Mobile: ✅
- SEO: ⚠️
```

---

## AUDIT EXECUTION LOG

| Date | Auditor | Status | Issues Fixed | Notes |
|------|---------|--------|--------------|-------|
| | | | | |

---

*Audit prompt generated: January 25, 2026*  
*Part of AutoRev Systematic Audit Suite (36 total audits)*
