# PAGE AUDIT: /community/events/[slug] - Public Event Detail

> **Audit ID:** Page-07  
> **Category:** Public Sharing Page  
> **Priority:** 35 of 36  
> **Route:** `/community/events/[slug]`  
> **Auth Required:** No (public)  
> **SEO Critical:** Yes (shareable content)

---

## PAGE OVERVIEW

The Public Event Detail page displays an **automotive event** publicly. Users can view event details, RSVP, and add to calendar without authentication.

**Key Features:**
- Event details display
- Date/time/location
- RSVP functionality
- Add to calendar
- Social sharing
- Attendee count
- Host information

---

## FILES TO EXAMINE

### Page Files

| File | Purpose |
|------|---------|
| `app/(marketing)/community/events/[slug]/page.jsx` | Main page |
| `app/(marketing)/community/events/[slug]/page.module.css` | Page styles |
| `app/(marketing)/community/events/[slug]/layout.jsx` | Layout wrapper |

### Related Components

| File | Purpose |
|------|---------|
| `components/EventRSVPButton.jsx` | RSVP button |
| `components/EventRSVPButton.module.css` | RSVP styles |
| `components/SaveEventButton.jsx` | Save event |
| `components/SaveEventButton.module.css` | Save styles |
| `components/AddToCalendarButton.jsx` | Calendar integration |
| `components/AddToCalendarButton.module.css` | Calendar styles |

### Related API Routes

| File | Purpose |
|------|---------|
| `app/api/community/events/[slug]/route.js` | Event data |
| `app/api/community/events/rsvp/route.js` | RSVP handling |

---

## CRITICAL: Read These First

Before making ANY changes:

1. `docs/SOURCE_OF_TRUTH.md` - Events section
2. `docs/BRAND_GUIDELINES.md` - CTA colors, date formatting
3. Cross-cutting audit findings:
   - J (SEO) - Metadata, structured data (Event schema)
   - D (UI/UX) - Lime CTAs, Teal saved state
   - A (Performance) - Image optimization

---

## IMPORTANT: INVESTIGATE BEFORE FIX

Before changing ANY code:

1. ✅ Verify event loads correctly
2. ✅ Test RSVP functionality
3. ✅ Check calendar integration
4. ❌ Do NOT break existing shared links
5. ❓ If event not found, check slug resolution

---

## CHECKLIST

### A. Functionality

- [ ] Event loads by slug
- [ ] Event details display
- [ ] Date/time shows correctly
- [ ] Location displays
- [ ] RSVP works (auth required?)
- [ ] Add to calendar works
- [ ] Share buttons work
- [ ] 404 for invalid slug
- [ ] Past event handling

### B. SEO (CRITICAL)

- [ ] Dynamic `<title>` with event name
- [ ] Dynamic meta description
- [ ] Open Graph tags complete
- [ ] Twitter Card tags
- [ ] **Event structured data** (JSON-LD)
- [ ] Canonical URL

### C. Event Structured Data

```json
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "Cars & Coffee Austin",
  "startDate": "2026-02-15T09:00:00-06:00",
  "endDate": "2026-02-15T12:00:00-06:00",
  "location": {
    "@type": "Place",
    "name": "Circuit of the Americas",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "9201 Circuit of the Americas Blvd",
      "addressLocality": "Austin",
      "addressRegion": "TX",
      "postalCode": "78617"
    }
  },
  "organizer": {
    "@type": "Organization",
    "name": "AutoRev Community"
  },
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
  "eventStatus": "https://schema.org/EventScheduled"
}
```

- [ ] Structured data present
- [ ] Start/end dates correct
- [ ] Location included
- [ ] Status updated for cancelled events

### D. UI/UX Design System

- [ ] **RSVP button** = Lime (primary CTA)
- [ ] **Saved state** = Teal
- [ ] **Calendar button** = Secondary style
- [ ] No hardcoded colors
- [ ] 44px touch targets

### E. Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│  [Back]                            [Share] [Save]           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              [Event Cover Image]                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  Cars & Coffee Austin                         [Event Type]  │
│                                                             │
│  📅  Saturday, February 15, 2026                            │
│  🕐  9:00 AM - 12:00 PM                                     │
│  📍  Circuit of the Americas, Austin, TX                    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ [RSVP - Going (lime)]  [Add to Calendar]            │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  42 attending                                               │
│                                                             │
│  Description                                                │
│  Join us for the biggest cars & coffee event in Texas...    │
│                                                             │
│  Host: @carsenthusiast                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

- [ ] Cover image prominent
- [ ] Event name as H1
- [ ] Date, time, location clear
- [ ] RSVP button prominent (lime)
- [ ] Attendee count
- [ ] Description
- [ ] Host attribution

### F. Date/Time Display

- [ ] User-friendly format (Saturday, February 15, 2026)
- [ ] Time in local format (9:00 AM - 12:00 PM)
- [ ] Timezone consideration
- [ ] Past events marked clearly

### G. Location Display

- [ ] Venue name
- [ ] Full address
- [ ] Map link/embed (optional)
- [ ] Online event handling

### H. RSVP Functionality

| State | Color | Label |
|-------|-------|-------|
| Not RSVP'd | Lime | "RSVP" |
| Going | Teal | "Going ✓" |
| Loading | Lime dimmed | Spinner |

- [ ] RSVP button works
- [ ] State updates optimistically
- [ ] Auth redirect if needed
- [ ] Count updates

### I. Add to Calendar

- [ ] Google Calendar works
- [ ] Apple Calendar works
- [ ] Outlook works
- [ ] ICS download option
- [ ] Event details included

### J. Save Event

| State | Color |
|-------|-------|
| Not saved | Ghost/outline |
| Saved | Teal |

- [ ] Save button works
- [ ] Optimistic update
- [ ] Auth redirect if needed

### K. Social Sharing

- [ ] Share URL works
- [ ] Twitter/X share
- [ ] Facebook share
- [ ] Copy link button
- [ ] Mobile native share

### L. Loading States

- [ ] Skeleton while loading
- [ ] Image placeholder
- [ ] No layout shift

### M. Error States

- [ ] 404 for invalid slug
- [ ] Event not found message
- [ ] Cancelled event display
- [ ] Network error handling

### N. Past Events

- [ ] Clear "Past Event" indicator
- [ ] RSVP disabled
- [ ] Different styling
- [ ] Still viewable

### O. Accessibility

- [ ] Semantic headings
- [ ] Date/time in accessible format
- [ ] Button labels
- [ ] Focus management

### P. Mobile Responsiveness

- [ ] Image adapts
- [ ] Buttons stack or fit
- [ ] Touch-friendly
- [ ] 44px touch targets

---

## SPECIFIC CHECKS

### Dynamic Metadata

```javascript
// Must generate dynamic metadata
export async function generateMetadata({ params }) {
  const event = await getEvent(params.slug);
  
  if (!event) {
    return { title: 'Event Not Found' };
  }
  
  const title = `${event.name} - AutoRev Events`;
  const description = `${event.name} on ${formatDate(event.start_date)} at ${event.location}. ${event.attendee_count} attending.`;
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [event.cover_image_url],
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

### RSVP Button Pattern

```javascript
// RSVP must use correct colors
const EventRSVPButton = ({ event, isGoing, onRSVP }) => {
  const [loading, setLoading] = useState(false);
  
  const handleRSVP = async () => {
    setLoading(true);
    // Optimistic update
    await onRSVP(!isGoing);
    setLoading(false);
  };
  
  return (
    <button
      onClick={handleRSVP}
      className={cn(
        styles.rsvpButton,
        isGoing && styles.going
      )}
      disabled={loading}
      aria-pressed={isGoing}
    >
      {loading ? <Spinner /> : isGoing ? 'Going ✓' : 'RSVP'}
    </button>
  );
};

// Styles
.rsvpButton {
  background: var(--color-accent-lime);
  color: var(--color-gray-900);
  min-height: 44px;
  min-width: 44px;
}

.going {
  background: var(--color-accent-teal);
  color: var(--color-gray-900);
}
```

### Add to Calendar Pattern

```javascript
// Calendar should support multiple providers
const AddToCalendarButton = ({ event }) => {
  const googleUrl = generateGoogleCalendarUrl(event);
  const icsUrl = generateICSUrl(event);
  
  return (
    <div className={styles.calendarDropdown}>
      <button aria-label="Add to calendar">
        Add to Calendar
      </button>
      <ul className={styles.options}>
        <li><a href={googleUrl}>Google Calendar</a></li>
        <li><a href={icsUrl} download>Apple Calendar</a></li>
        <li><a href={outlookUrl}>Outlook</a></li>
      </ul>
    </div>
  );
};
```

---

## TESTING SCENARIOS

### Test Case 1: View Public Event

1. Navigate to /community/events/[valid-slug]
2. **Expected:** Event displays with all details
3. **Verify:** Name, date, location, RSVP visible

### Test Case 2: RSVP Flow

1. Click RSVP button
2. **Expected:** Redirects to auth or updates state
3. **Verify:** Button changes to "Going ✓" (teal)

### Test Case 3: Add to Calendar

1. Click "Add to Calendar"
2. **Expected:** Calendar options appear
3. **Verify:** Event added with correct details

### Test Case 4: Invalid Slug

1. Navigate to /community/events/invalid-slug-xyz
2. **Expected:** 404 or "Event not found"
3. **Verify:** Graceful error handling

### Test Case 5: Past Event

1. View a past event
2. **Expected:** "Past Event" indicator, RSVP disabled
3. **Verify:** Still viewable but not actionable

### Test Case 6: Structured Data

1. Inspect page source
2. **Expected:** JSON-LD Event schema
3. **Verify:** Valid structured data

### Test Case 7: Mobile View

1. View on mobile device
2. **Expected:** Layout adapts, buttons accessible
3. **Verify:** Touch targets 44px

---

## AUTOMATED CHECKS

```bash
# 1. Check for hardcoded colors
grep -rn "#[0-9a-fA-F]\{3,6\}" app/\(marketing\)/community/events/\[slug\]/*.jsx app/\(marketing\)/community/events/\[slug\]/*.css

# 2. Check for color tokens
grep -rn "accent-lime\|accent-teal" app/\(marketing\)/community/events/\[slug\]/*.jsx components/Event*.jsx

# 3. Check for generateMetadata
grep -rn "generateMetadata\|metadata" app/\(marketing\)/community/events/\[slug\]/page.jsx

# 4. Check for structured data
grep -rn "application/ld\+json\|@type.*Event" app/\(marketing\)/community/events/\[slug\]/page.jsx

# 5. Check for Next.js Image
grep -rn "next/image\|<Image" app/\(marketing\)/community/events/\[slug\]/*.jsx

# 6. Check for console.log
grep -rn "console\.log" app/\(marketing\)/community/events/\[slug\]/*.jsx components/Event*.jsx
```

---

## CROSS-REFERENCE WITH FOUNDATION AUDITS

| Audit | Check On This Page |
|-------|-------------------|
| J. SEO | Event structured data |
| D. UI/UX | RSVP=lime, Saved=teal |
| A. Performance | Image optimization |
| E. Accessibility | Date/time formatting |

---

## DELIVERABLES

### 1. Functionality Report

| Feature | Works | Issues |
|---------|-------|--------|
| Event loads | ✅/❌ | |
| RSVP button | ✅/❌ | |
| Calendar | ✅/❌ | |
| Share | ✅/❌ | |
| Past event | ✅/❌ | |

### 2. Color Compliance Report

| Element | Expected | Actual | Status |
|---------|----------|--------|--------|
| RSVP (not going) | Lime | | ✅/❌ |
| RSVP (going) | Teal | | ✅/❌ |
| Save (saved) | Teal | | ✅/❌ |

### 3. SEO Compliance Report

| Element | Present | Dynamic | Status |
|---------|---------|---------|--------|
| Title | ✅/❌ | ✅/❌ | |
| Description | ✅/❌ | ✅/❌ | |
| OG tags | ✅/❌ | ✅/❌ | |
| Event schema | ✅/❌ | ✅/❌ | |

### 4. Issues Found

| Severity | Issue | File:Line | Fix |
|----------|-------|-----------|-----|
| | | | |

---

## VERIFICATION

- [ ] Event displays correctly
- [ ] RSVP works (lime → teal)
- [ ] Calendar integration works
- [ ] Event structured data valid
- [ ] 404 for invalid slugs
- [ ] Past events handled
- [ ] Mobile responsive

---

## SUCCESS CRITERIA

| # | Criterion |
|---|-----------|
| 1 | Event loads by slug |
| 2 | RSVP = lime, Going = teal |
| 3 | Calendar integration works |
| 4 | Event JSON-LD structured data |
| 5 | Past events clearly marked |
| 6 | Mobile responsive |
| 7 | No critical/high issues remaining |

---

## OUTPUT FORMAT

```
📅 PAGE AUDIT: /community/events/[slug]

**Status:** ✅ Pass / ⚠️ Issues / ❌ Fail

**Color Compliance:** ✅ / ❌
- RSVP: Lime ✅
- Going: Teal ✅
- Saved: Teal ✅

**SEO:** ✅ / ❌
- Dynamic title: ✅
- Event schema: ✅
- OG tags: ✅

**Functionality:**
- [x] Event loads
- [x] RSVP works
- [x] Calendar works
- [ ] Past event disabled (issue #1)

**Issues Found:**
1. [Medium] Past events still show active RSVP
2. [Low] Missing timezone in display
...

**Test Results:**
- Valid slug: ✅
- Invalid slug: ✅
- RSVP: ✅
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
