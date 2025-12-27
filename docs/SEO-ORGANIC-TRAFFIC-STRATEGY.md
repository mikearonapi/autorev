# AutoRev SEO & Organic Traffic Strategy

> **Last Updated:** December 2024
> **Status:** Action items prioritized for implementation

---

## Current SEO Health Score: 85/100

AutoRev has a solid SEO foundation. This document identifies gaps and opportunities for improvement.

---

## ✅ What's Already Implemented Well

### Core Infrastructure
- [x] `robots.js` - Comprehensive with crawler-specific rules
- [x] `sitemap.js` - Dynamic generation for cars, events, encyclopedia
- [x] Root `layout.jsx` - Complete metadata with OG, Twitter, JSON-LD
- [x] `metadataBase` - Properly configured for canonical URLs

### Dynamic Metadata
- [x] Car detail pages - `generateMetadata` + Vehicle schema
- [x] Event pages - `generateMetadata` + Event schema
- [x] Browse cars - Dynamic car count in title
- [x] Car selector - WebApplication schema

### Structured Data (schema.org)
- [x] Organization schema (site-wide)
- [x] WebSite schema with SearchAction
- [x] Vehicle schema for car pages
- [x] Event schema for event pages
- [x] BreadcrumbList across all pages
- [x] WebApplication schema for tools
- [x] Article schema for encyclopedia

### Social Sharing
- [x] Custom OpenGraph images
- [x] Custom Twitter card images
- [x] PWA manifest

---

## 🔧 Issues Fixed (December 2024)

### 1. Added Missing Metadata Layouts
- [x] `/events/submit/layout.jsx` - SEO metadata for event submission
- [x] `/events/saved/layout.jsx` - noindex for user-specific page

### 2. Fixed Duplicate Content Issue
- [x] `/events/[slug]` now redirects to `/community/events/[slug]`
- Prevents Google from indexing duplicate content
- Consolidates link equity to canonical URLs

---

## 📋 Remaining SEO Improvements

### High Priority

#### 1. Google Search Console Verification
**File:** `app/layout.jsx`

```jsx
// CURRENT (lines 122-126):
verification: {
  // google: 'your-google-verification-code',
  // yandex: 'your-yandex-verification-code',
},

// TODO: Add actual verification codes
verification: {
  google: 'YOUR_GOOGLE_SITE_VERIFICATION_CODE',
},
```

**Action:** Register site in [Google Search Console](https://search.google.com/search-console) and add verification code.

#### 2. Submit Sitemap to Search Engines
After deploying:
1. Go to Google Search Console → Sitemaps
2. Submit: `https://autorev.app/sitemap.xml`
3. Also submit to Bing Webmaster Tools

#### 3. Add FAQ Schema to Key Pages
The `generateFAQSchema` utility exists but isn't used. Add to:

- **Car Detail Pages** - Common questions about each car
- **Encyclopedia** - Q&A format for educational content
- **Car Selector** - How to use the tool

Example implementation for car pages:
```jsx
// In app/browse-cars/[slug]/layout.jsx
const faqSchema = generateFAQSchema([
  {
    question: `What is the ${car.name} 0-60 time?`,
    answer: `The ${car.name} achieves 0-60 mph in ${car.zeroToSixty} seconds.`
  },
  {
    question: `How much does the ${car.name} cost?`,
    answer: `The ${car.name} is priced at ${car.priceRange}.`
  },
]);
```

#### 4. Add ItemList Schema to Browse Pages
```jsx
// In app/browse-cars/layout.jsx - Add dynamic ItemList schema
const itemListSchema = generateItemListSchema({
  name: 'Sports Car Collection',
  description: 'Browse our curated collection of sports and performance vehicles',
  items: cars.slice(0, 10).map(car => ({
    name: car.name,
    url: `/browse-cars/${car.slug}`,
  })),
});
```

### Medium Priority

#### 5. Add HowTo Schema for Tuning Shop
```jsx
// In app/tuning-shop/layout.jsx
const howToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to Plan Your Car Build',
  description: 'Step-by-step guide to planning performance modifications',
  step: [
    { '@type': 'HowToStep', name: 'Select Your Car', text: 'Choose from our database of sports cars' },
    { '@type': 'HowToStep', name: 'Choose Modifications', text: 'Browse upgrade categories' },
    { '@type': 'HowToStep', name: 'Review & Save', text: 'See total cost and save your build' },
  ],
};
```

#### 6. Add Review/Rating Schema for Car Pages
If you have user reviews or ratings:
```jsx
const reviewSchema = {
  '@context': 'https://schema.org',
  '@type': 'Review',
  itemReviewed: { '@type': 'Car', name: car.name },
  reviewRating: { '@type': 'Rating', ratingValue: car.averageRating },
  author: { '@type': 'Organization', name: 'AutoRev' },
};
```

#### 7. Image Optimization Checklist
- [ ] Ensure all `<Image>` components have meaningful `alt` text
- [ ] Add `loading="lazy"` for below-fold images
- [ ] Use WebP format for hero images (already done for some)
- [ ] Consider adding image captions for car gallery images

### Low Priority

#### 8. Add Local Business Schema (if applicable)
If AutoRev has a physical location or targets specific regions:
```jsx
const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'AutoRev',
  // ... address, hours, etc.
};
```

#### 9. Add Video Schema for YouTube Content
For pages displaying YouTube videos:
```jsx
const videoSchema = {
  '@context': 'https://schema.org',
  '@type': 'VideoObject',
  name: video.title,
  description: video.description,
  thumbnailUrl: video.thumbnail,
  uploadDate: video.uploadDate,
  embedUrl: `https://www.youtube.com/embed/${video.id}`,
};
```

---

## 🚀 Organic Traffic Growth Strategies (Beyond SEO)

### 1. Content Marketing

#### Long-Tail Keyword Pages
Create dedicated pages targeting specific search queries:

| Target Keyword | Potential Page |
|---------------|----------------|
| "best sports car under 50k" | `/guides/best-sports-cars-under-50k` |
| "Miata vs 86 comparison" | `/compare/miata-vs-toyota-86` |
| "Porsche 911 vs Cayman" | `/compare/porsche-911-vs-cayman` |
| "how to prepare car for track day" | `/encyclopedia/track-day-preparation` |
| "best first sports car" | `/guides/best-first-sports-car` |

#### Comparison Pages (High Intent)
Create programmatic comparison pages:
- `/browse-cars/compare/[slug1]-vs-[slug2]`
- Auto-generate from frequently compared pairs
- Include structured comparison table with specs

#### Buying Guides
Monthly content pieces:
- "Best Sports Cars of [Year]"
- "Used Sports Car Buying Guide"
- "Track Day Car Buyer's Guide"

### 2. Technical SEO Enhancements

#### Core Web Vitals Monitoring
- Set up monitoring in Google Search Console
- Target LCP < 2.5s, FID < 100ms, CLS < 0.1
- Already have preconnect hints for Supabase and Vercel

#### Internal Linking Strategy
- Add "Related Cars" section to car detail pages
- Link encyclopedia topics from car pages
- Cross-link events with relevant car pages

#### URL Structure Optimization
Current structure is good. Consider:
- Adding `/guides/` section for editorial content
- Adding `/compare/` for comparison pages

### 3. Link Building Opportunities

#### Content That Earns Links
- Original data/research (performance comparisons)
- Interactive tools (car selector already exists)
- Visual assets (infographics about car specs)

#### Outreach Targets
- Automotive forums (post with attribution)
- Car club websites
- Track day organizer directories
- Automotive YouTubers (provide data for videos)

### 4. Social Signals & Distribution

#### Content Distribution Channels
- Reddit: r/cars, r/trackdays, r/autodetailing, brand-specific subs
- Facebook Groups: Track day groups, brand owner groups
- Discord: Automotive servers
- Instagram: Visual car content with links in bio

#### Share-Worthy Content Ideas
- "Track day of the week" from events database
- Car of the day/week posts
- Before/after mod builds from user data

### 5. User-Generated Content

#### Encourage UGC for SEO
- Car owner reviews/stories
- Build documentation
- Track day reports
- Event photos/recaps

Each piece of UGC = new indexable content.

### 6. Local SEO for Events

#### Location-Based Pages
Create regional event hubs:
- `/community/events/california`
- `/community/events/northeast`
- `/community/events/texas`

Include local content:
- Regional track guides
- Local car club directories
- State-specific car events calendar

### 7. Featured Snippets Optimization

#### Target Featured Snippet Queries
Structure content to win featured snippets:

**Question format:**
> **What is the fastest sports car under $100k?**
> The [Car Name] achieves 0-60 in X seconds, making it the fastest production sports car under $100,000.

**List format:**
> **Top 5 Track Day Cars:**
> 1. Porsche 718 Cayman GT4
> 2. BMW M2
> 3. Mazda MX-5 Miata
> ...

### 8. Performance Monitoring

#### Key Metrics to Track
- **Organic traffic** (Google Analytics)
- **Keyword rankings** (Semrush/Ahrefs)
- **Backlinks** (Ahrefs/Moz)
- **Index coverage** (Search Console)
- **Core Web Vitals** (Search Console)
- **Click-through rate** (Search Console)

#### Monthly SEO Health Check
1. Review Search Console for errors
2. Check sitemap submission status
3. Review top-performing pages
4. Identify declining pages
5. Check for new keyword opportunities

---

## 📊 Implementation Priority Matrix

| Task | Impact | Effort | Priority |
|------|--------|--------|----------|
| Google Search Console setup | High | Low | **P0** |
| Submit sitemap | High | Low | **P0** |
| FAQ schema on car pages | Medium | Low | **P1** |
| Comparison pages | High | Medium | **P1** |
| Long-tail keyword guides | High | High | **P2** |
| Video schema | Low | Low | **P2** |
| Regional event pages | Medium | Medium | **P3** |

---

## 📝 Quick Wins Checklist

- [ ] Register site in Google Search Console
- [ ] Submit sitemap.xml
- [ ] Add Google verification code to layout.jsx
- [ ] Register site in Bing Webmaster Tools
- [ ] Set up Google Analytics 4 (if not done)
- [ ] Enable "Performance" report in Search Console
- [ ] Create first comparison page (most popular matchup)
- [ ] Add FAQ schema to 5 top car pages

---

## Resources

- [Google Search Console](https://search.google.com/search-console)
- [Bing Webmaster Tools](https://www.bing.com/webmasters)
- [Schema.org Validator](https://validator.schema.org/)
- [Rich Results Test](https://search.google.com/test/rich-results)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)

