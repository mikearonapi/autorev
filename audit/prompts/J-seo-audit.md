# AUDIT: SEO - Codebase-Wide

> **Audit ID:** J  
> **Category:** Cross-Cutting (Foundation)  
> **Priority:** 10 of 36 (Last Cross-Cutting Audit)  
> **Dependencies:** A (Performance) - Core Web Vitals affect SEO  
> **Downstream Impact:** Public page audits will verify SEO compliance

---

## CONTEXT

This audit ensures AutoRev is optimized for search engines to drive organic traffic. Good SEO increases discoverability, builds authority, and reduces customer acquisition costs.

**Key Focus Areas:**
- Metadata (title, description)
- Open Graph / Twitter Cards
- Structured data (JSON-LD)
- Sitemap and robots.txt
- Canonical URLs
- Mobile-friendliness
- Page speed (Core Web Vitals)

---

## CRITICAL: Read These First

Before making ANY changes, read these documents completely:

1. `docs/SOURCE_OF_TRUTH.md` - Site Index (which pages are public)
2. `app/(marketing)/` - Public pages structure
3. `app/sitemap.js` or `sitemap.xml` - Sitemap configuration
4. `app/robots.js` or `robots.txt` - Crawler configuration

---

## IMPORTANT: INVESTIGATE BEFORE FIX

Before changing ANY code:

1. ✅ Check current indexing status in Google Search Console
2. ✅ Test existing metadata with social preview tools
3. ✅ Verify pages are intentionally public or private
4. ❌ Do NOT add SEO to authenticated pages (wastes crawl budget)
5. ❓ If metadata seems missing, check if it's a dynamic route

---

## SEO-RELEVANT PAGES

From SOURCE_OF_TRUTH Site Index, these pages should have full SEO:

### Public Marketing Pages (Full SEO)

| Route | Priority | Notes |
|-------|----------|-------|
| `/` | Critical | Landing page, primary keywords |
| `/privacy` | Medium | Legal requirement |
| `/terms` | Medium | Legal requirement |
| `/contact` | Medium | Local SEO opportunity |
| `/unsubscribe` | Low | noindex recommended |

### Public Sharing Pages (Full SEO)

| Route | High | Notes |
|-------|------|-------|
| `/community/builds/[slug]` | High | User-generated content, social sharing |
| `/community/events/[slug]` | High | Event discovery |
| `/shared/al/[token]` | Low | Shared conversations, may noindex |

### Authenticated Pages (No SEO / noindex)

All pages under `app/(app)/` should have `noindex` as they require authentication.

---

## CHECKLIST

### A. Metadata (CRITICAL)

- [ ] All public pages have unique `<title>` tags
- [ ] Title format: `{Page} | AutoRev` or `{Page} - AutoRev`
- [ ] Titles are 50-60 characters
- [ ] All public pages have `<meta name="description">`
- [ ] Descriptions are 150-160 characters
- [ ] Descriptions include call-to-action where appropriate
- [ ] Dynamic pages have dynamic metadata

### B. Open Graph Tags

- [ ] `og:title` on all public pages
- [ ] `og:description` on all public pages
- [ ] `og:image` with proper dimensions (1200×630px)
- [ ] `og:url` with canonical URL
- [ ] `og:type` (website, article, product)
- [ ] `og:site_name` set to "AutoRev"

### C. Twitter Cards

- [ ] `twitter:card` (summary_large_image recommended)
- [ ] `twitter:title`
- [ ] `twitter:description`
- [ ] `twitter:image`
- [ ] `twitter:site` (@AutoRevApp if exists)

### D. Structured Data (JSON-LD)

- [ ] Organization schema on homepage
- [ ] WebSite schema with search action
- [ ] Article schema for blog/content pages
- [ ] Event schema for event pages
- [ ] Product schema for car pages (if applicable)
- [ ] BreadcrumbList for navigation
- [ ] Validated with Google's Rich Results Test

### E. Technical SEO

- [ ] `sitemap.xml` exists and is accurate
- [ ] `robots.txt` allows appropriate crawling
- [ ] Canonical URLs set correctly
- [ ] No duplicate content issues
- [ ] Proper 301 redirects for changed URLs
- [ ] 404 pages return proper status code
- [ ] Mobile-friendly (responsive design)

### F. Performance (SEO Impact)

- [ ] Core Web Vitals pass (LCP < 2.5s, etc.)
- [ ] Mobile Lighthouse SEO score > 90
- [ ] No render-blocking resources
- [ ] Images optimized with alt text

### G. URL Structure

- [ ] URLs are clean and readable
- [ ] Slugs use hyphens, not underscores
- [ ] No query parameters for important content
- [ ] Consistent trailing slash usage
- [ ] No uppercase in URLs

### H. Internal Linking

- [ ] Important pages linked from homepage
- [ ] Breadcrumb navigation present
- [ ] Related content linked
- [ ] No orphan pages
- [ ] Anchor text is descriptive

### I. Indexing Control

- [ ] Authenticated pages have `noindex`
- [ ] Low-value pages have `noindex` (unsubscribe, etc.)
- [ ] Staging/preview URLs blocked
- [ ] No accidental noindex on important pages

---

## KEY FILES TO EXAMINE

### Metadata Configuration

| File | Purpose |
|------|---------|
| `app/layout.jsx` | Default metadata |
| `app/(marketing)/page.jsx` | Homepage metadata |
| `app/(marketing)/*/page.jsx` | Marketing page metadata |
| `app/(marketing)/community/builds/[slug]/page.jsx` | Dynamic build metadata |

### SEO Configuration

| File | Purpose |
|------|---------|
| `app/sitemap.js` or `public/sitemap.xml` | Sitemap |
| `app/robots.js` or `public/robots.txt` | Crawler rules |
| `app/manifest.json` | PWA manifest |

### OG Image Generation

| File | Purpose |
|------|---------|
| `app/(marketing)/*/opengraph-image.tsx` | Dynamic OG images |
| `app/(marketing)/*/twitter-image.tsx` | Twitter card images |

---

## AUTOMATED CHECKS

### Metadata Validation

```bash
# 1. Find pages without metadata export
grep -rL "export const metadata\|export async function generateMetadata" app/\(marketing\)/*/page.jsx

# 2. Find missing og:image
grep -rn "openGraph" app/\(marketing\)/ | grep -v "images"

# 3. Find pages without description
grep -rn "export const metadata" -A10 app/\(marketing\)/ | grep -v "description"

# 4. Check for duplicate titles
grep -rn "title:" app/\(marketing\)/*/page.jsx | cut -d: -f3 | sort | uniq -d

# 5. Find authenticated pages without noindex
grep -rL "noindex\|robots" app/\(app\)/*/page.jsx
```

### Technical SEO

```bash
# 6. Check sitemap exists
curl -s https://your-domain.com/sitemap.xml | head -20

# 7. Check robots.txt
curl -s https://your-domain.com/robots.txt

# 8. Find broken internal links (requires live site)
# Use tool like Screaming Frog or npm package

# 9. Check for meta robots noindex
grep -rn "noindex" app/
```

### Online Tools

| Tool | Purpose | URL |
|------|---------|-----|
| Google Rich Results Test | Structured data | https://search.google.com/test/rich-results |
| Facebook Sharing Debugger | OG tags | https://developers.facebook.com/tools/debug/ |
| Twitter Card Validator | Twitter cards | https://cards-dev.twitter.com/validator |
| Google Search Console | Indexing status | https://search.google.com/search-console |
| PageSpeed Insights | Core Web Vitals | https://pagespeed.web.dev/ |

---

## SOURCE OF TRUTH PATTERNS

### Next.js Metadata Pattern

```typescript
// ✅ CORRECT: Static metadata
export const metadata = {
  title: 'AutoRev - Track, Tune & Optimize Your Vehicle',
  description: 'AutoRev helps automotive enthusiasts track modifications, estimate performance gains, and optimize their builds with AI-powered insights.',
  openGraph: {
    title: 'AutoRev - Track, Tune & Optimize Your Vehicle',
    description: 'Track modifications, estimate performance gains, and optimize your builds.',
    url: 'https://autorev.app',
    siteName: 'AutoRev',
    images: [
      {
        url: 'https://autorev.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AutoRev - Vehicle Performance Platform',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AutoRev - Track, Tune & Optimize Your Vehicle',
    description: 'Track modifications, estimate performance gains, and optimize your builds.',
    images: ['https://autorev.app/og-image.png'],
  },
};
```

```typescript
// ✅ CORRECT: Dynamic metadata for builds
export async function generateMetadata({ params }) {
  const build = await fetchBuild(params.slug);
  
  if (!build) {
    return { title: 'Build Not Found | AutoRev' };
  }

  const title = `${build.car.year} ${build.car.make} ${build.car.model} Build | AutoRev`;
  const description = `Check out this ${build.car.year} ${build.car.make} ${build.car.model} build with ${build.totalHpGain}+ HP gains.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [build.heroImage || '/default-build-og.png'],
    },
  };
}
```

### Structured Data Pattern

```typescript
// ✅ CORRECT: JSON-LD in page
export default function HomePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'AutoRev',
    url: 'https://autorev.app',
    description: 'Vehicle performance tracking and optimization platform',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://autorev.app/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Page content */}
    </>
  );
}
```

### noindex for Authenticated Pages

```typescript
// ✅ CORRECT: noindex for app pages
export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};
```

---

## SEO SCORECARD

| Category | Max Points | Score |
|----------|------------|-------|
| Metadata (title, desc) | 20 | |
| Open Graph | 15 | |
| Twitter Cards | 10 | |
| Structured Data | 15 | |
| Technical (sitemap, robots) | 15 | |
| Performance (CWV) | 15 | |
| Mobile-friendliness | 10 | |
| **TOTAL** | **100** | |

---

## DELIVERABLES

### 1. Page-by-Page SEO Report

| Page | Title | Desc | OG | Twitter | Schema | Score |
|------|-------|------|----|---------|----- --|-------|
| `/` | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | /5 |
| `/privacy` | | | | | | |
| ... | | | | | | |

### 2. Technical SEO Report

| Item | Status | Notes |
|------|--------|-------|
| sitemap.xml | ✅/❌ | |
| robots.txt | ✅/❌ | |
| Canonical URLs | ✅/❌ | |
| Mobile-friendly | ✅/❌ | |
| Core Web Vitals | ✅/❌ | |

### 3. Structured Data Validation

| Page | Schema Type | Valid | Errors |
|------|-------------|-------|--------|
| `/` | WebSite | ✅/❌ | |
| `/community/events/[slug]` | Event | ✅/❌ | |

---

## VERIFICATION

- [ ] All public pages have title and description
- [ ] All public pages have OG and Twitter tags
- [ ] sitemap.xml includes all public pages
- [ ] robots.txt allows crawling of public pages
- [ ] Authenticated pages have noindex
- [ ] Structured data validates without errors
- [ ] Lighthouse SEO score ≥ 90 on mobile

---

## SUCCESS CRITERIA

| # | Criterion |
|---|-----------|
| 1 | All public pages have unique, optimized titles |
| 2 | All public pages have meta descriptions |
| 3 | OG images render correctly in social shares |
| 4 | Structured data validates in Rich Results Test |
| 5 | sitemap.xml is complete and accurate |
| 6 | Authenticated pages are noindexed |
| 7 | Lighthouse SEO score ≥ 90 |

---

## OUTPUT FORMAT

```
🔍 SEO AUDIT RESULTS

**SEO Score:** X/100

**Lighthouse SEO:** X/100 (mobile)

**Page Metadata Status:**
| Page | Title | Desc | OG | Status |
|------|-------|------|-------|--------|
| / | ✅ | ✅ | ✅ | Complete |
| /privacy | ✅ | ❌ | ❌ | Needs work |
...

**Technical SEO:**
- sitemap.xml: ✅ (X pages indexed)
- robots.txt: ✅
- Canonical URLs: ✅
- noindex on auth pages: ✅

**Structured Data:**
- Homepage WebSite: ✅ Valid
- Build pages: ❌ Missing schema

**Issues Found:**
1. [page] Missing meta description
2. [page] OG image wrong dimensions
...

**Recommendations:**
1. Add descriptions to X pages
2. Add Event schema to event pages
...
```

---

## AUDIT EXECUTION LOG

| Date | Auditor | SEO Score | Lighthouse | Issues Found | Notes |
|------|---------|-----------|------------|--------------|-------|
| | | | | | |

---

*Audit prompt generated: January 25, 2026*  
*Part of AutoRev Systematic Audit Suite (36 total audits)*  
*🎉 PHASE 1 COMPLETE - All 10 Cross-Cutting Audits Ready!*
