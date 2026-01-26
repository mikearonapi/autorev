# PAGE AUDIT: /privacy - Privacy Policy

> **Audit ID:** Page-02  
> **Category:** Public Legal Page  
> **Priority:** 30 of 36  
> **Route:** `/privacy`  
> **Auth Required:** No  
> **SEO:** Low priority (noindex acceptable)

---

## PAGE OVERVIEW

The Privacy Policy page displays **legal information** about how AutoRev handles user data. This is a compliance requirement and should be clear, readable, and accessible.

**Key Features:**
- Privacy policy content
- Clear typography
- Table of contents (optional)
- Last updated date
- Contact information

---

## FILES TO EXAMINE

### Page Files

| File | Purpose |
|------|---------|
| `app/(marketing)/privacy/page.jsx` | Privacy page |
| `app/(marketing)/layout.jsx` | Marketing layout |

---

## CRITICAL: Read These First

Before making ANY changes:

1. `docs/SOURCE_OF_TRUTH.md` - Legal pages section
2. `docs/BRAND_GUIDELINES.md` - Typography, readability
3. Cross-cutting audit findings:
   - E (Accessibility) - Readability
   - J (SEO) - Basic metadata

---

## IMPORTANT: INVESTIGATE BEFORE FIX

Before changing ANY code:

1. ✅ Verify page loads correctly
2. ✅ Check content is current
3. ✅ Test readability
4. ❌ Do NOT change legal copy without legal approval
5. ❓ If content seems outdated, flag for legal review

---

## CHECKLIST

### A. Functionality

- [ ] Page loads correctly
- [ ] Content displays fully
- [ ] Links work (email, external)
- [ ] Mobile readable

### B. Content Requirements

- [ ] Last updated date visible
- [ ] Company name/contact info
- [ ] Data collection explanation
- [ ] Data usage explanation
- [ ] Third-party sharing
- [ ] User rights
- [ ] Cookie policy (or link)
- [ ] Contact for questions

### C. UI/UX Design System

- [ ] **Headings** = Clear hierarchy
- [ ] **Body text** = Readable size
- [ ] **Links** = Teal or branded
- [ ] **Lists** = Properly formatted
- [ ] No hardcoded colors
- [ ] Consistent with brand

### D. Layout

```
┌─────────────────────────────────────────────────┐
│  Privacy Policy                                 │
│  Last updated: January 1, 2026                  │
├─────────────────────────────────────────────────┤
│                                                 │
│  1. Introduction                                │
│  ─────────────────                              │
│  AutoRev ("we", "our", "us") is committed      │
│  to protecting your privacy...                  │
│                                                 │
│  2. Information We Collect                      │
│  ─────────────────────────                      │
│  We collect information you provide directly... │
│                                                 │
│  • Account information (email, name)            │
│  • Vehicle information                          │
│  • Usage data                                   │
│                                                 │
│  3. How We Use Information                      │
│  ──────────────────────────                     │
│  ...                                            │
│                                                 │
│  Contact Us                                     │
│  privacy@autorev.app                            │
│                                                 │
└─────────────────────────────────────────────────┘
```

- [ ] Title prominent
- [ ] Last updated visible
- [ ] Section headings clear
- [ ] Body text readable
- [ ] Lists formatted
- [ ] Contact info accessible

### E. Typography & Readability

- [ ] Font size ≥ 16px body
- [ ] Line height ≥ 1.5
- [ ] Max width ~65-75 characters
- [ ] Adequate paragraph spacing
- [ ] Headings distinct

### F. SEO (Minimal)

- [ ] `<title>` - "Privacy Policy - AutoRev"
- [ ] Meta description (brief)
- [ ] Can be noindex if desired
- [ ] Canonical URL

### G. Accessibility

- [ ] Semantic headings (H1→H2→H3)
- [ ] Skip to content works
- [ ] Links descriptive
- [ ] Sufficient contrast
- [ ] Screen reader friendly

### H. Mobile Responsiveness

- [ ] Readable on mobile
- [ ] No horizontal scroll
- [ ] Adequate touch targets
- [ ] Proper line breaks

### I. Navigation

- [ ] Can return to home
- [ ] Footer links work
- [ ] Back button works

---

## SPECIFIC CHECKS

### Metadata

```javascript
// Basic metadata for legal page
export const metadata = {
  title: 'Privacy Policy - AutoRev',
  description: 'Learn how AutoRev collects, uses, and protects your personal information.',
  robots: 'noindex, follow', // Optional: exclude from search
};
```

### Content Structure

```javascript
// Legal page should have clear structure
const PrivacyPage = () => (
  <main className={styles.legalPage}>
    <header className={styles.header}>
      <h1>Privacy Policy</h1>
      <p className={styles.lastUpdated}>
        Last updated: January 1, 2026
      </p>
    </header>
    
    <article className={styles.content}>
      <section>
        <h2>1. Introduction</h2>
        <p>...</p>
      </section>
      
      <section>
        <h2>2. Information We Collect</h2>
        <p>...</p>
        <ul>
          <li>Account information</li>
          <li>Vehicle information</li>
          <li>Usage data</li>
        </ul>
      </section>
      
      {/* More sections */}
      
      <section>
        <h2>Contact Us</h2>
        <p>
          Email: <a href="mailto:privacy@autorev.app">privacy@autorev.app</a>
        </p>
      </section>
    </article>
  </main>
);
```

### Typography Styles

```css
/* Legal pages need readable typography */
.legalPage {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--space-8);
}

.content {
  font-size: 1rem; /* 16px min */
  line-height: 1.7;
  color: var(--color-text-primary);
}

.content h2 {
  font-size: 1.5rem;
  margin-top: var(--space-8);
  margin-bottom: var(--space-4);
  color: var(--color-text-primary);
}

.content p {
  margin-bottom: var(--space-4);
}

.content ul, .content ol {
  margin-left: var(--space-6);
  margin-bottom: var(--space-4);
}

.content a {
  color: var(--color-accent-teal);
  text-decoration: underline;
}
```

---

## TESTING SCENARIOS

### Test Case 1: Page Load

1. Navigate to /privacy
2. **Expected:** Privacy policy displays
3. **Verify:** Full content visible

### Test Case 2: Readability

1. Read through content
2. **Expected:** Easy to read, clear sections
3. **Verify:** Font size, line height adequate

### Test Case 3: Mobile View

1. View on mobile device
2. **Expected:** Content readable, no overflow
3. **Verify:** Text wraps properly

### Test Case 4: Links

1. Click contact email link
2. **Expected:** Opens email client
3. **Verify:** Correct email address

### Test Case 5: Navigation

1. Click logo/home link
2. **Expected:** Return to home page
3. **Verify:** Navigation works

---

## AUTOMATED CHECKS

```bash
# 1. Check for hardcoded colors
grep -rn "#[0-9a-fA-F]\{3,6\}" app/\(marketing\)/privacy/*.jsx

# 2. Check for semantic headings
grep -rn "<h1\|<h2\|<h3" app/\(marketing\)/privacy/*.jsx

# 3. Check for metadata
grep -rn "export const metadata" app/\(marketing\)/privacy/*.jsx

# 4. Check for mailto links
grep -rn "mailto:" app/\(marketing\)/privacy/*.jsx

# 5. Check for console.log
grep -rn "console\.log" app/\(marketing\)/privacy/*.jsx
```

---

## CROSS-REFERENCE WITH FOUNDATION AUDITS

| Audit | Check On This Page |
|-------|-------------------|
| E. Accessibility | Semantic structure, readability |
| J. SEO | Basic metadata |
| D. UI/UX | Typography, layout |

---

## DELIVERABLES

### 1. Functionality Report

| Feature | Works | Issues |
|---------|-------|--------|
| Page loads | ✅/❌ | |
| Content complete | ✅/❌ | |
| Links work | ✅/❌ | |
| Mobile readable | ✅/❌ | |

### 2. Content Checklist

| Section | Present | Status |
|---------|---------|--------|
| Last updated date | ✅/❌ | |
| Data collection | ✅/❌ | |
| Data usage | ✅/❌ | |
| Third-party sharing | ✅/❌ | |
| User rights | ✅/❌ | |
| Contact info | ✅/❌ | |

### 3. Issues Found

| Severity | Issue | File:Line | Fix |
|----------|-------|-----------|-----|
| | | | |

---

## VERIFICATION

- [ ] Content displays correctly
- [ ] Typography readable
- [ ] Links functional
- [ ] Mobile responsive
- [ ] Semantic headings

---

## SUCCESS CRITERIA

| # | Criterion |
|---|-----------|
| 1 | Page loads correctly |
| 2 | Content is complete |
| 3 | Typography readable (16px+, 1.5+ line height) |
| 4 | Links work |
| 5 | Mobile responsive |
| 6 | Semantic HTML structure |
| 7 | No critical/high issues remaining |

---

## OUTPUT FORMAT

```
📜 PAGE AUDIT: /privacy

**Status:** ✅ Pass / ⚠️ Issues / ❌ Fail

**Content:** ✅ / ❌
- Last updated: ✅
- All sections: ✅
- Contact info: ✅

**Readability:** ✅ / ❌
- Font size: 16px ✅
- Line height: 1.7 ✅
- Max width: 800px ✅

**Issues Found:**
1. [Low] Missing last updated date
2. [Low] Contact email not linked
...

**Test Results:**
- Page load: ✅
- Mobile: ✅
- Links: ✅
```

---

## AUDIT EXECUTION LOG

| Date | Auditor | Status | Issues Fixed | Notes |
|------|---------|--------|--------------|-------|
| | | | | |

---

*Audit prompt generated: January 25, 2026*  
*Part of AutoRev Systematic Audit Suite (36 total audits)*
