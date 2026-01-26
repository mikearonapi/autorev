# PAGE AUDIT: /community/builds/[slug] - Public Build Detail

> **Audit ID:** Page-06  
> **Category:** Public Sharing Page  
> **Priority:** 34 of 36  
> **Route:** `/community/builds/[slug]`  
> **Auth Required:** No (public)  
> **SEO Critical:** Yes (shareable content)

---

## PAGE OVERVIEW

The Public Build Detail page displays a **shared vehicle build** publicly. Users can share their builds via this URL. This is important for SEO and social sharing.

**Key Features:**
- Vehicle build showcase
- Modification list
- Performance comparison
- Photo gallery
- Social sharing
- Owner actions (if owner)
- View tracking

---

## FILES TO EXAMINE

### Page Files

| File | Purpose |
|------|---------|
| `app/(marketing)/community/builds/[slug]/page.jsx` | Main page |
| `app/(marketing)/community/builds/[slug]/page.module.css` | Page styles |
| `app/(marketing)/community/builds/[slug]/opengraph-image.tsx` | OG image generation |

### Page Components

| File | Purpose |
|------|---------|
| `app/(marketing)/community/builds/[slug]/BuildModsList.jsx` | Mods display |
| `app/(marketing)/community/builds/[slug]/BuildModsList.module.css` | Mods styles |
| `app/(marketing)/community/builds/[slug]/PerformanceComparison.jsx` | Perf comparison |
| `app/(marketing)/community/builds/[slug]/PerformanceComparison.module.css` | Comparison styles |
| `app/(marketing)/community/builds/[slug]/ImageGallery.jsx` | Photo gallery |
| `app/(marketing)/community/builds/[slug]/ImageGallery.module.css` | Gallery styles |
| `app/(marketing)/community/builds/[slug]/ExperienceScores.jsx` | Scores display |
| `app/(marketing)/community/builds/[slug]/ExperienceScores.module.css` | Scores styles |
| `app/(marketing)/community/builds/[slug]/ShareButtons.jsx` | Social share |
| `app/(marketing)/community/builds/[slug]/OwnerActions.jsx` | Owner controls |
| `app/(marketing)/community/builds/[slug]/OwnerActions.module.css` | Owner styles |
| `app/(marketing)/community/builds/[slug]/ViewTracker.jsx` | Analytics |

---

## CRITICAL: Read These First

Before making ANY changes:

1. `docs/SOURCE_OF_TRUTH.md` - Build sharing section
2. `docs/BRAND_GUIDELINES.md` - Card patterns, data display
3. Cross-cutting audit findings:
   - J (SEO) - Metadata, structured data
   - D (UI/UX) - Stock=Blue, Modified=Teal
   - A (Performance) - Image optimization

---

## IMPORTANT: INVESTIGATE BEFORE FIX

Before changing ANY code:

1. ✅ Verify build loads correctly
2. ✅ Test OG image generation
3. ✅ Check share buttons work
4. ❌ Do NOT break existing shared links
5. ❓ If build not found, check slug resolution

---

## CHECKLIST

### A. Functionality

- [ ] Build loads by slug
- [ ] Vehicle info displays
- [ ] Modification list shows
- [ ] Performance comparison works
- [ ] Photo gallery functions
- [ ] Share buttons work
- [ ] 404 for invalid slug
- [ ] Owner actions work (if owner)

### B. SEO (CRITICAL)

- [ ] Dynamic `<title>` with car name
- [ ] Dynamic meta description
- [ ] Open Graph tags complete
- [ ] Twitter Card tags
- [ ] OG image generates correctly
- [ ] Structured data (Vehicle, Build)
- [ ] Canonical URL

### C. UI/UX Design System

- [ ] **Stock values** = Blue
- [ ] **Modified values** = Teal
- [ ] **Gains** = Teal badges
- [ ] **Share buttons** = Standard styling
- [ ] No hardcoded colors
- [ ] 44px touch targets

### D. Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│  [Back]                            [Share] [More Actions]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              [Hero Image / Gallery]                 │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  2024 BMW M3 Competition                                    │
│  by @username                                               │
│                                                             │
│  "My Stage 2 track-focused build..."                        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Performance                                                │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐    │
│  │ 444 → 543 HP  │  │ 480 → 520 TQ  │  │ 3.4 → 3.1 0-60│    │
│  │    +99 HP     │  │    +40 TQ     │  │   -0.3s      │    │
│  │    (teal)     │  │    (teal)     │  │   (teal)     │    │
│  └───────────────┘  └───────────────┘  └───────────────┘    │
├─────────────────────────────────────────────────────────────┤
│  Modifications (12)                                         │
│  • Intake: Eventuri Carbon Intake                           │
│  • Exhaust: Akrapovic Slip-On                               │
│  • Tune: MHD Stage 2                                        │
│  • Suspension: KW V3 Coilovers                              │
│  ...                                                        │
└─────────────────────────────────────────────────────────────┘
```

- [ ] Hero image prominent
- [ ] Vehicle name as H1
- [ ] Owner attribution
- [ ] Description/notes
- [ ] Performance section
- [ ] Mods list

### E. Performance Comparison Display

| Metric | Stock | Modified | Gain |
|--------|-------|----------|------|
| HP | Blue | Teal | Teal badge |
| TQ | Blue | Teal | Teal badge |
| 0-60 | Blue | Teal | Teal badge |

- [ ] Stock in blue
- [ ] Modified in teal
- [ ] Gains as badges
- [ ] Arrow or separator
- [ ] Monospace for numbers

### F. Modifications List

- [ ] Mods grouped by category
- [ ] Brand/product names
- [ ] Count shown
- [ ] Expandable if many

### G. Image Gallery

- [ ] Primary image large
- [ ] Thumbnails for additional
- [ ] Lightbox on click
- [ ] Uses Next.js Image
- [ ] Alt text present

### H. Social Sharing

- [ ] Share URL works
- [ ] Twitter/X share
- [ ] Facebook share
- [ ] Copy link button
- [ ] Share triggers native share (mobile)

### I. OG Image Generation

- [ ] Dynamic image generates
- [ ] Includes car name
- [ ] Includes key stats
- [ ] Brand consistent
- [ ] Proper dimensions

### J. Loading States

- [ ] Skeleton while loading
- [ ] Image placeholders
- [ ] No layout shift

### K. Error States

- [ ] 404 for invalid slug
- [ ] Build not found message
- [ ] Deleted build handling

### L. Accessibility

- [ ] Semantic headings
- [ ] Alt text on images
- [ ] Share buttons labeled
- [ ] Focus management

### M. Mobile Responsiveness

- [ ] Gallery adapts
- [ ] Stats stack
- [ ] Touch-friendly
- [ ] 44px touch targets

### N. Owner Actions (If Logged In as Owner)

- [ ] Edit button visible
- [ ] Delete option
- [ ] Privacy toggle
- [ ] Analytics link

---

## SPECIFIC CHECKS

### Dynamic Metadata

```javascript
// Must generate dynamic metadata
export async function generateMetadata({ params }) {
  const build = await getBuild(params.slug);
  
  if (!build) {
    return { title: 'Build Not Found' };
  }
  
  const title = `${build.year} ${build.make} ${build.model} Build - AutoRev`;
  const description = `Check out this ${build.year} ${build.make} ${build.model} build with +${build.hp_gain} HP. ${build.mod_count} modifications installed.`;
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [`/community/builds/${params.slug}/opengraph-image`],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}
```

### Performance Comparison Component

```javascript
// Performance must use correct colors
const PerformanceComparison = ({ stock, modified }) => (
  <div className={styles.comparison}>
    <div className={styles.metric}>
      <span className={styles.label}>Horsepower</span>
      <div className={styles.values}>
        <span className={styles.stock}>{stock.hp} HP</span>
        <span className={styles.arrow}>→</span>
        <span className={styles.modified}>{modified.hp} HP</span>
        <span className={styles.gain}>+{modified.hp - stock.hp}</span>
      </div>
    </div>
  </div>
);

// Styles
.stock { color: var(--color-accent-blue); }
.modified { color: var(--color-accent-teal); }
.gain {
  background: var(--color-accent-teal-bg);
  color: var(--color-accent-teal);
}
```

### Share Buttons Pattern

```javascript
// Share should handle multiple platforms
const ShareButtons = ({ build, url }) => {
  const shareData = {
    title: `${build.year} ${build.make} ${build.model} Build`,
    text: `Check out my ${build.year} ${build.make} ${build.model} build on AutoRev!`,
    url,
  };
  
  const handleNativeShare = async () => {
    if (navigator.share) {
      await navigator.share(shareData);
    }
  };
  
  return (
    <div className={styles.shareButtons}>
      <button onClick={handleNativeShare} aria-label="Share build">
        Share
      </button>
      <a href={`https://twitter.com/intent/tweet?...`} aria-label="Share on Twitter">
        Twitter
      </a>
      {/* More platforms */}
    </div>
  );
};
```

---

## TESTING SCENARIOS

### Test Case 1: View Public Build

1. Navigate to /community/builds/[valid-slug]
2. **Expected:** Build displays with all sections
3. **Verify:** Vehicle, mods, performance visible

### Test Case 2: OG Image

1. Check OG meta tags in source
2. **Expected:** Dynamic OG image URL
3. **Verify:** Image loads correctly

### Test Case 3: Share on Twitter

1. Click Twitter share button
2. **Expected:** Opens Twitter with pre-filled content
3. **Verify:** URL and text correct

### Test Case 4: Invalid Slug

1. Navigate to /community/builds/invalid-slug-xyz
2. **Expected:** 404 or "Build not found"
3. **Verify:** Graceful error handling

### Test Case 5: Color Compliance

1. Inspect stock vs modified values
2. **Expected:** Stock=blue, Modified=teal
3. **Verify:** CSS variables used

### Test Case 6: Mobile View

1. View on mobile device
2. **Expected:** Layout adapts, gallery works
3. **Verify:** Touch targets 44px

---

## AUTOMATED CHECKS

```bash
# 1. Check for hardcoded colors
grep -rn "#[0-9a-fA-F]\{3,6\}" app/\(marketing\)/community/builds/\[slug\]/*.jsx app/\(marketing\)/community/builds/\[slug\]/*.css

# 2. Check for color tokens
grep -rn "accent-blue\|accent-teal" app/\(marketing\)/community/builds/\[slug\]/*.jsx

# 3. Check for generateMetadata
grep -rn "generateMetadata\|metadata" app/\(marketing\)/community/builds/\[slug\]/page.jsx

# 4. Check for Next.js Image
grep -rn "next/image\|<Image" app/\(marketing\)/community/builds/\[slug\]/*.jsx

# 5. Check for alt text
grep -rn "alt=" app/\(marketing\)/community/builds/\[slug\]/*.jsx

# 6. Check for console.log
grep -rn "console\.log" app/\(marketing\)/community/builds/\[slug\]/*.jsx
```

---

## CROSS-REFERENCE WITH FOUNDATION AUDITS

| Audit | Check On This Page |
|-------|-------------------|
| J. SEO | Dynamic metadata, OG image |
| D. UI/UX | Stock=blue, Modified=teal |
| A. Performance | Image optimization |
| E. Accessibility | Semantic structure |

---

## DELIVERABLES

### 1. Functionality Report

| Feature | Works | Issues |
|---------|-------|--------|
| Build loads | ✅/❌ | |
| Performance section | ✅/❌ | |
| Mods list | ✅/❌ | |
| Gallery | ✅/❌ | |
| Share buttons | ✅/❌ | |
| OG image | ✅/❌ | |

### 2. Color Compliance Report

| Element | Expected | Actual | Status |
|---------|----------|--------|--------|
| Stock values | Blue | | ✅/❌ |
| Modified values | Teal | | ✅/❌ |
| Gain badges | Teal | | ✅/❌ |

### 3. SEO Compliance Report

| Element | Present | Dynamic | Status |
|---------|---------|---------|--------|
| Title | ✅/❌ | ✅/❌ | |
| Description | ✅/❌ | ✅/❌ | |
| OG tags | ✅/❌ | ✅/❌ | |
| OG image | ✅/❌ | ✅/❌ | |

### 4. Issues Found

| Severity | Issue | File:Line | Fix |
|----------|-------|-----------|-----|
| | | | |

---

## VERIFICATION

- [ ] Build displays correctly
- [ ] Stock=blue, Modified=teal
- [ ] OG image generates
- [ ] Share buttons work
- [ ] 404 for invalid slugs
- [ ] Mobile responsive

---

## SUCCESS CRITERIA

| # | Criterion |
|---|-----------|
| 1 | Build loads by slug |
| 2 | Stock = blue, Modified = teal |
| 3 | Dynamic SEO metadata |
| 4 | OG image generates |
| 5 | Share buttons functional |
| 6 | Mobile responsive |
| 7 | No critical/high issues remaining |

---

## OUTPUT FORMAT

```
🚗 PAGE AUDIT: /community/builds/[slug]

**Status:** ✅ Pass / ⚠️ Issues / ❌ Fail

**Color Compliance:** ✅ / ❌
- Stock: Blue ✅
- Modified: Teal ✅
- Gains: Teal ✅

**SEO:** ✅ / ❌
- Dynamic title: ✅
- OG image: ✅
- Structured data: ⚠️

**Functionality:**
- [x] Build loads
- [x] Mods list
- [x] Gallery
- [ ] Share buttons broken (issue #1)

**Issues Found:**
1. [High] Share buttons don't work on mobile
2. [Medium] Missing structured data
...

**Test Results:**
- Valid slug: ✅
- Invalid slug: ✅
- Share: ❌
- Mobile: ✅
```

---

## AUDIT EXECUTION LOG

| Date | Auditor | Status | Issues Fixed | Notes |
|------|---------|--------|--------------|-------|
| | | | | |

---

*Audit prompt generated: January 25, 2026*  
*Part of AutoRev Systematic Audit Suite (36 total audits)*
