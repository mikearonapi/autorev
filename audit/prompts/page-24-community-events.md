# PAGE AUDIT: /community/events - Events Listing

> **Audit ID:** Page-24  
> **Category:** Community Page  
> **Priority:** 23 of 36  
> **Route:** `/community/events`  
> **Auth Required:** Yes  
> **Layout:** Shared community layout with tabs

---

## PAGE OVERVIEW

The Events page displays **car meets, shows, and automotive events** in the community. Users can browse events, RSVP, save events, and add them to their calendar.

**Key Features:**
- Events listing/grid
- Event filtering (date, location, type)
- RSVP functionality
- Save/favorite events
- Add to calendar
- Event details view

---

## FILES TO EXAMINE

### Page Files

| File | Purpose |
|------|---------|
| `app/(app)/community/events/page.jsx` | Events page |
| `app/(app)/community/EventsView.jsx` | Events view component |
| `app/(app)/community/EventsView.module.css` | Events styles |

### Shared Layout

| File | Purpose |
|------|---------|
| `app/(app)/community/layout.jsx` | Community layout |
| `app/(app)/community/CommunityNav.jsx` | Tab navigation |

### Related Components

| File | Purpose |
|------|---------|
| `components/EventCard.jsx` | Event card display |
| `components/EventRSVPButton.jsx` | RSVP component |
| `components/EventRSVPButton.module.css` | RSVP styles |
| `components/SaveEventButton.jsx` | Save/favorite |
| `components/SaveEventButton.module.css` | Save styles |
| `components/AddToCalendarButton.jsx` | Calendar export |
| `components/AddToCalendarButton.module.css` | Calendar styles |

### Related Services

| File | Purpose |
|------|---------|
| `lib/eventsService.js` | Events data |
| `app/api/events/` | Events API |
| `app/api/community/events/` | Community events API |

---

## CRITICAL: Read These First

Before making ANY changes:

1. `docs/SOURCE_OF_TRUTH.md` - Events section
2. `docs/BRAND_GUIDELINES.md` - Event cards, date display
3. Cross-cutting audit findings:
   - D (UI/UX) - Card patterns, date/time
   - E (Accessibility) - Event announcements

---

## IMPORTANT: INVESTIGATE BEFORE FIX

Before changing ANY code:

1. ✅ Verify events load correctly
2. ✅ Test RSVP functionality
3. ✅ Check calendar export works
4. ❌ Do NOT change event data schema without understanding
5. ❓ If RSVP doesn't persist, check eventsService

---

## CHECKLIST

### A. Functionality

- [ ] Events list loads
- [ ] Events filter by date
- [ ] Events filter by location
- [ ] Events filter by type
- [ ] Can RSVP to event
- [ ] Can un-RSVP
- [ ] Can save/favorite event
- [ ] Add to calendar works
- [ ] Event detail view works

### B. Data Flow

- [ ] Uses events API correctly
- [ ] Uses React Query for caching
- [ ] RSVP updates optimistically
- [ ] Save state persists
- [ ] Proper cache invalidation

### C. UI/UX Design System

- [ ] **RSVP button** = Lime when going
- [ ] **Save button** = Teal when saved
- [ ] **Date badge** = Prominent display
- [ ] **Cards** = Dark card pattern
- [ ] No hardcoded colors
- [ ] 44px touch targets

### D. Event Card Layout

```
┌─────────────────────────────────────┐
│  [Event Image / Banner]             │
│                                     │
├─────────────────────────────────────┤
│  ┌─────┐                            │
│  │ JAN │  Cars & Coffee Monthly     │
│  │ 25  │  San Francisco, CA         │
│  └─────┘                            │
│                                     │
│  Saturday, Jan 25 · 8:00 AM         │
│                                     │
│  42 Going · 15 Interested           │
│                                     │
│  [RSVP Going]  [Save]  [Calendar]   │
│   (lime)       (teal)               │
└─────────────────────────────────────┘
```

- [ ] Event image/banner
- [ ] Date badge prominent (month + day)
- [ ] Event name clear
- [ ] Location displayed
- [ ] Full date + time
- [ ] Attendee count
- [ ] Action buttons row

### E. Date Display

| Format | Example |
|--------|---------|
| Date badge | JAN 25 |
| Full date | Saturday, January 25, 2026 |
| Time | 8:00 AM - 12:00 PM |
| Relative | "In 3 days" or "Tomorrow" |

- [ ] Consistent date formatting
- [ ] Timezone handling (if applicable)
- [ ] Relative dates for upcoming
- [ ] Past events marked clearly

### F. RSVP States

| State | Display | Button |
|-------|---------|--------|
| Not going | Default | "RSVP" outline |
| Going | Lime badge | "Going ✓" filled lime |
| Interested | Teal outline | "Interested" |

- [ ] Clear state indication
- [ ] Optimistic update
- [ ] Count updates on RSVP

### G. Save/Favorite

- [ ] Heart or bookmark icon
- [ ] Teal when saved
- [ ] Instant feedback
- [ ] Persists to user data

### H. Add to Calendar

- [ ] Export to .ics
- [ ] Google Calendar link
- [ ] Apple Calendar support
- [ ] Includes all event details

### I. Filtering/Sorting

- [ ] Filter by date range
- [ ] Filter by location/distance
- [ ] Filter by event type
- [ ] Sort by date (default)
- [ ] Sort by popularity
- [ ] Clear filters option

### J. Loading States

- [ ] Skeleton cards while loading
- [ ] Loading on filter change
- [ ] RSVP button loading state

### K. Empty States

- [ ] No events found
- [ ] No events in date range
- [ ] No events nearby

### L. Accessibility

- [ ] Event cards keyboard navigable
- [ ] RSVP buttons labeled
- [ ] Dates machine-readable (datetime)
- [ ] Screen reader announces changes

### M. Mobile Responsiveness

- [ ] Cards stack on mobile
- [ ] Filter drawer/modal
- [ ] Touch-friendly actions
- [ ] 44px touch targets

---

## SPECIFIC CHECKS

### Event Card Component

```javascript
// Event card should follow pattern
const EventCard = ({ event }) => {
  const { isSaved, toggleSave } = useSavedEvents();
  const { rsvpStatus, setRsvp } = useEventRsvp(event.id);
  
  return (
    <article className={styles.card}>
      <div className={styles.dateBadge}>
        <span className={styles.month}>{formatMonth(event.date)}</span>
        <span className={styles.day}>{formatDay(event.date)}</span>
      </div>
      <div className={styles.content}>
        <h3>{event.name}</h3>
        <p className={styles.location}>{event.location}</p>
        <time dateTime={event.date}>
          {formatEventDate(event.date)}
        </time>
        <p className={styles.attendees}>
          {event.going_count} Going · {event.interested_count} Interested
        </p>
      </div>
      <div className={styles.actions}>
        <EventRSVPButton 
          status={rsvpStatus} 
          onRsvp={setRsvp} 
        />
        <SaveEventButton 
          saved={isSaved(event.id)} 
          onToggle={() => toggleSave(event.id)} 
        />
        <AddToCalendarButton event={event} />
      </div>
    </article>
  );
};
```

### RSVP Button Pattern

```javascript
// RSVP should have clear states
const EventRSVPButton = ({ status, onRsvp }) => {
  const isGoing = status === 'going';
  
  return (
    <button
      onClick={() => onRsvp(isGoing ? null : 'going')}
      className={cn(
        styles.rsvpButton,
        isGoing && styles.going
      )}
      aria-pressed={isGoing}
    >
      {isGoing ? '✓ Going' : 'RSVP'}
    </button>
  );
};

// Styles
.rsvpButton {
  /* Default */
  border: 1px solid var(--color-border);
  background: transparent;
}
.rsvpButton.going {
  background: var(--color-accent-lime);
  color: var(--color-bg-primary);
  border-color: var(--color-accent-lime);
}
```

### Date Formatting

```javascript
// Consistent date formatting
const formatEventDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

const formatEventTime = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};
```

---

## TESTING SCENARIOS

### Test Case 1: Browse Events

1. Navigate to /community/events
2. **Expected:** List of upcoming events
3. **Verify:** Cards display correctly, dates clear

### Test Case 2: RSVP to Event

1. Click "RSVP" on an event
2. **Expected:** Button changes to "Going ✓" (lime)
3. **Verify:** Count increases, persists on refresh

### Test Case 3: Un-RSVP

1. Click "Going" on RSVP'd event
2. **Expected:** Reverts to "RSVP"
3. **Verify:** Count decreases

### Test Case 4: Save Event

1. Click save/bookmark on event
2. **Expected:** Icon fills teal
3. **Verify:** Appears in saved events

### Test Case 5: Add to Calendar

1. Click calendar button
2. **Expected:** Downloads .ics or opens calendar
3. **Verify:** Event details correct

### Test Case 6: Filter by Date

1. Select date range filter
2. **Expected:** Only events in range shown
3. **Verify:** Filter works, clear works

### Test Case 7: Empty State

1. Filter to date range with no events
2. **Expected:** Empty state message
3. **Verify:** Suggests adjusting filters

---

## AUTOMATED CHECKS

```bash
# 1. Check for hardcoded colors
grep -rn "#[0-9a-fA-F]\{3,6\}" app/\(app\)/community/events/*.jsx app/\(app\)/community/EventsView*.jsx app/\(app\)/community/EventsView*.css

# 2. Check for design tokens
grep -rn "accent-lime\|accent-teal" app/\(app\)/community/events/*.jsx app/\(app\)/community/EventsView*.jsx

# 3. Check for datetime attribute
grep -rn "<time\|datetime=" app/\(app\)/community/events/*.jsx app/\(app\)/community/EventsView*.jsx

# 4. Check for aria attributes
grep -rn "aria-pressed\|aria-label" app/\(app\)/community/events/*.jsx components/EventRSVPButton*.jsx

# 5. Check for touch targets
grep -rn "h-11\|min-h-\[44px\]" app/\(app\)/community/events/*.jsx components/EventRSVPButton*.jsx

# 6. Check for console.log
grep -rn "console\.log" app/\(app\)/community/events/*.jsx app/\(app\)/community/EventsView*.jsx
```

---

## CROSS-REFERENCE WITH FOUNDATION AUDITS

| Audit | Check On This Page |
|-------|-------------------|
| D. UI/UX | Card patterns, date formatting |
| E. Accessibility | Event announcements, buttons |
| I. State | RSVP optimistic updates |
| J. SEO | Event structured data (if public) |

---

## DELIVERABLES

### 1. Functionality Report

| Feature | Works | Issues |
|---------|-------|--------|
| Events list | ✅/❌ | |
| RSVP | ✅/❌ | |
| Save event | ✅/❌ | |
| Add to calendar | ✅/❌ | |
| Filters | ✅/❌ | |

### 2. Event Interaction Compliance

| Element | Expected | Actual | Status |
|---------|----------|--------|--------|
| RSVP Going | Lime | | ✅/❌ |
| Saved | Teal | | ✅/❌ |
| Date badge | Prominent | | ✅/❌ |
| Touch targets | 44px | | ✅/❌ |

### 3. Issues Found

| Severity | Issue | File:Line | Fix |
|----------|-------|-----------|-----|
| | | | |

---

## VERIFICATION

- [ ] Events load correctly
- [ ] RSVP uses lime when going
- [ ] Save uses teal when saved
- [ ] Dates formatted consistently
- [ ] Calendar export works
- [ ] Mobile responsive

---

## SUCCESS CRITERIA

| # | Criterion |
|---|-----------|
| 1 | Events list displays |
| 2 | RSVP = lime when going |
| 3 | Save = teal when saved |
| 4 | Dates clearly formatted |
| 5 | Calendar export works |
| 6 | Filters functional |
| 7 | No critical/high issues remaining |

---

## OUTPUT FORMAT

```
📅 PAGE AUDIT: /community/events

**Status:** ✅ Pass / ⚠️ Issues / ❌ Fail

**Event Interaction Compliance:** ✅ / ❌
- RSVP Going: Lime ✅
- Saved: Teal ✅
- Date display: Clear ✅

**Functionality:**
- [x] Events list
- [x] RSVP
- [x] Save
- [ ] Calendar export broken (issue #1)

**Issues Found:**
1. [High] Calendar .ics missing event time
2. [Medium] Date badge month not abbreviated
...

**Test Results:**
- Browse: ✅
- RSVP: ✅
- Save: ✅
- Calendar: ❌
- Filter: ✅
```

---

## AUDIT EXECUTION LOG

| Date | Auditor | Status | Issues Fixed | Notes |
|------|---------|--------|--------------|-------|
| | | | | |

---

*Audit prompt generated: January 25, 2026*  
*Part of AutoRev Systematic Audit Suite (36 total audits)*
