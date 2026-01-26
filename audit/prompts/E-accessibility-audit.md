# AUDIT: Accessibility (WCAG 2.1 AA) - Codebase-Wide

> **Audit ID:** E  
> **Category:** Cross-Cutting (Foundation)  
> **Priority:** 2 of 36  
> **Dependencies:** D (UI/UX Design System) - builds on UI patterns  
> **Downstream Impact:** All page audits will check accessibility compliance

---

## CONTEXT

This audit ensures AutoRev meets WCAG 2.1 AA accessibility standards. Poor accessibility excludes users with disabilities, creates legal liability, and degrades the experience for everyone (especially on mobile).

**Key Focus Areas:**
- Touch targets (44px minimum)
- Color contrast (4.5:1 for text, 3:1 for large text)
- Keyboard navigation
- Screen reader support
- Focus management

---

## CRITICAL: Read These First

Before making ANY changes, read these documents completely:

1. `docs/SOURCE_OF_TRUTH.md` - Accessibility Requirements section
2. `docs/BRAND_GUIDELINES.md` - Color contrast requirements, touch targets
3. `.cursor/rules/specialists/implementation/ui-quality-agent.mdc` - Accessibility essentials

---

## IMPORTANT: INVESTIGATE BEFORE FIX

Before changing ANY code:

1. ✅ Test the current behavior with keyboard navigation
2. ✅ Test with a screen reader (VoiceOver on Mac, or browser extensions)
3. ✅ Document what works and what doesn't
4. ❌ Do NOT add ARIA labels that duplicate native semantics
5. ❓ If unsure whether something needs fixing, test it first

---

## ACCESSIBILITY STANDARDS REFERENCE

### Touch Targets (Apple/Google Guidelines)

| Element | Minimum Size | CSS Class |
|---------|--------------|-----------|
| Buttons | 44×44px | `h-11 w-11` or `h-11 px-6` |
| Icon buttons | 44×44px | `h-11 w-11` |
| Form inputs | 44px height | `h-11` |
| List items (tappable) | 44px height | `min-h-[44px]` |
| Links (inline) | 44px touch area | Padding or wrapper |

### Color Contrast (WCAG 2.1 AA)

| Text Type | Minimum Ratio | Our Compliance |
|-----------|---------------|----------------|
| Body text | 4.5:1 | White on `#0d1b2a` = 15.4:1 ✅ |
| Large text (18px+) | 3:1 | All accent colors pass ✅ |
| UI components | 3:1 | Borders, icons |
| Non-text contrast | 3:1 | Buttons, inputs |

### Keyboard Navigation

| Requirement | Implementation |
|-------------|----------------|
| All interactive elements focusable | Native elements or `tabIndex={0}` |
| Visible focus indicator | `focus-visible:ring-2 ring-[var(--color-accent-lime)]` |
| Logical tab order | DOM order matches visual order |
| Skip links | Skip to main content |
| No keyboard traps | Can escape modals with Escape |

---

## CHECKLIST

### A. Touch Targets (CRITICAL for Mobile)

- [ ] All `<button>` elements are at least 44px tall
- [ ] All icon-only buttons are at least 44×44px
- [ ] All `<input>` elements are at least 44px tall
- [ ] All `<select>` elements are at least 44px tall
- [ ] All tappable cards/list items are at least 44px tall
- [ ] Inline links have adequate touch area (padding or wrapper)
- [ ] No touch targets smaller than 24px (absolute minimum per WCAG 2.5.5)

### B. Focus States

- [ ] All interactive elements have visible focus indicator
- [ ] Focus indicator uses lime ring: `focus-visible:ring-[var(--color-accent-lime)]`
- [ ] Focus indicator has 2px offset: `ring-offset-2 ring-offset-[var(--color-bg-base)]`
- [ ] Focus is never removed (`outline: none` without replacement)
- [ ] Focus order matches visual reading order

### C. Keyboard Navigation

- [ ] All functionality accessible via keyboard
- [ ] Tab moves through interactive elements in logical order
- [ ] Enter/Space activates buttons and links
- [ ] Escape closes modals and dropdowns
- [ ] Arrow keys work in menus and selects
- [ ] No keyboard traps (can always navigate away)

### D. Screen Reader Support

- [ ] All images have `alt` text (or `alt=""` for decorative)
- [ ] All icon buttons have `aria-label`
- [ ] Form inputs have associated `<label>` elements
- [ ] Error messages are announced (live regions)
- [ ] Page title describes current page
- [ ] Headings create logical document outline (h1 → h2 → h3)

### E. ARIA Usage

- [ ] No redundant ARIA (don't add `role="button"` to `<button>`)
- [ ] `aria-label` used for icon-only buttons
- [ ] `aria-describedby` used for form hints/errors
- [ ] `aria-expanded` used for collapsible sections
- [ ] `aria-current="page"` used for current nav item
- [ ] Live regions (`aria-live`) for dynamic content

### F. Color Independence

- [ ] Information not conveyed by color alone
- [ ] Error states have icon + text (not just red color)
- [ ] Success states have icon + text (not just green color)
- [ ] Required fields marked with text (not just asterisk color)
- [ ] Charts/graphs have patterns or labels (not just colors)

### G. Form Accessibility

- [ ] All inputs have visible labels (not just placeholders)
- [ ] Required fields clearly indicated
- [ ] Error messages specific and helpful
- [ ] `inputMode` set for appropriate keyboard (numeric, email, tel)
- [ ] Autocomplete attributes set where appropriate
- [ ] Form validation errors announced to screen readers

### H. Modal/Dialog Accessibility

- [ ] Focus trapped inside open modal
- [ ] Focus returns to trigger element on close
- [ ] Escape key closes modal
- [ ] Background content has `aria-hidden="true"` when modal open
- [ ] Modal has `role="dialog"` and `aria-modal="true"`
- [ ] Modal has accessible name (`aria-labelledby`)

### I. Skip Links

- [ ] "Skip to main content" link exists
- [ ] Skip link is first focusable element
- [ ] Skip link visible on focus
- [ ] Skip link target is main content area

### J. Reduced Motion

- [ ] `prefers-reduced-motion` media query respected
- [ ] Animations can be disabled
- [ ] No auto-playing animations that can't be stopped
- [ ] Essential animations use reduced versions

---

## KEY FILES TO EXAMINE

### Global Accessibility

| File | Check For |
|------|-----------|
| `app/layout.jsx` | Skip links, lang attribute, page structure |
| `app/globals.css` | Focus styles, reduced motion |
| `components/ui/SkipLink.jsx` | Skip link implementation |

### Form Components

| File | Check For |
|------|-----------|
| `components/ui/Input.jsx` | Labels, aria, inputMode |
| `components/ui/Select.jsx` | Labels, keyboard nav |
| `components/ui/Checkbox.jsx` | Labels, focus states |
| `components/ui/Button.jsx` | Touch targets, focus states |

### Modal Components

| File | Check For |
|------|-----------|
| `components/ui/Modal.jsx` | Focus trap, aria attributes |
| `components/ui/Sheet.jsx` | Focus management |
| `components/ui/Dialog.jsx` | Keyboard handling |

### Navigation

| File | Check For |
|------|-----------|
| `components/BottomNav.jsx` | Touch targets, aria-current |
| `components/Sidebar.jsx` | Keyboard nav, focus management |
| `components/MobileMenu.jsx` | Focus trap, escape handling |

### Icon Buttons (Common Violations)

| File | Check For |
|------|-----------|
| `components/ALFeedbackButtons.jsx` | aria-label on icon buttons |
| `components/CarActionMenu.jsx` | Touch targets, labels |
| `components/EventRSVPButton.jsx` | Touch targets |
| `components/SaveEventButton.jsx` | aria-label |

---

## AUTOMATED CHECKS

Run these commands and document results:

```bash
# 1. Find buttons without minimum height
grep -rn "className=" --include="*.jsx" components/ | grep -E "<button|<Button" | grep -v "h-11\|h-12\|h-14\|min-h-"

# 2. Find icon buttons potentially missing aria-label
grep -rn "<button" --include="*.jsx" components/ | grep -E "Icon|icon" | grep -v "aria-label"

# 3. Find inputs without labels
grep -rn "<input\|<Input" --include="*.jsx" components/ app/ | grep -v "id=\|aria-label"

# 4. Find images without alt
grep -rn "<img\|<Image" --include="*.jsx" components/ app/ | grep -v "alt="

# 5. Find outline:none without replacement focus
grep -rn "outline.*none\|outline: 0" --include="*.css" styles/ app/

# 6. Find small touch targets (p-1, p-2, h-6, h-8, w-6, w-8 on buttons)
grep -rn "className=" --include="*.jsx" components/ | grep -E "<button|<Button" | grep -E "p-1|p-2|h-6|h-8|w-6|w-8"

# 7. Find potential color-only indicators
grep -rn "text-red\|text-green\|text-amber" --include="*.jsx" components/ app/ | grep -v "Icon\|icon"
```

### Browser Testing Tools

| Tool | Purpose |
|------|---------|
| **axe DevTools** | Automated accessibility testing |
| **WAVE** | Visual accessibility report |
| **Lighthouse** | Accessibility score |
| **Chrome DevTools** | Accessibility tree inspection |

### Manual Testing Required

| Test | How to Test |
|------|-------------|
| Keyboard navigation | Tab through entire page, use Enter/Space/Escape |
| Screen reader | Enable VoiceOver (Cmd+F5 on Mac) and navigate |
| Touch targets | Use mobile device or DevTools mobile mode |
| Color contrast | Use browser contrast checker or WebAIM |
| Reduced motion | Enable "Reduce motion" in system settings |

---

## SOURCE OF TRUTH PATTERNS

From `docs/SOURCE_OF_TRUTH.md`:

```tsx
// ✅ CORRECT - Accessible button with proper size and label
<button 
  className="h-11 w-11 flex items-center justify-center rounded-full focus-visible:ring-2 focus-visible:ring-[var(--color-accent-lime)] focus-visible:ring-offset-2"
  aria-label="Delete car from garage"
>
  <TrashIcon className="h-5 w-5" />
</button>

// ❌ WRONG - Too small, no label
<button className="p-1">
  <TrashIcon className="h-4 w-4" />
</button>
```

```tsx
// ✅ CORRECT - Form input with label and error
<div className="space-y-2">
  <label htmlFor="mileage" className="text-sm font-medium">
    Current Mileage
  </label>
  <input
    id="mileage"
    type="number"
    inputMode="numeric"
    className="h-11 w-full rounded-lg border px-4"
    aria-describedby={error ? "mileage-error" : undefined}
  />
  {error && (
    <p id="mileage-error" className="text-sm text-[var(--color-error)] flex items-center gap-1">
      <AlertIcon className="h-4 w-4" />
      {error}
    </p>
  )}
</div>

// ❌ WRONG - Placeholder as label, no error association
<input type="number" placeholder="Mileage" className="h-8" />
```

---

## DELIVERABLES

### 1. Violation Report

| Severity | Category | File:Line | Issue | Fix |
|----------|----------|-----------|-------|-----|
| Critical | Touch Target | | | |
| Critical | Keyboard | | | |
| High | Screen Reader | | | |
| Medium | Focus State | | | |
| Low | Enhancement | | | |

### 2. Summary Statistics

- Touch target violations: X
- Missing aria-labels: X
- Missing form labels: X
- Focus state issues: X
- Keyboard navigation issues: X
- Lighthouse accessibility score: X/100

### 3. Priority Fixes

1. **Critical** - Blocks usage for some users
2. **High** - Significantly impacts experience
3. **Medium** - Degrades experience
4. **Low** - Enhancement opportunity

---

## VERIFICATION

- [ ] Lighthouse accessibility score ≥ 90
- [ ] All interactive elements reachable via keyboard
- [ ] VoiceOver can navigate and announce all content
- [ ] All buttons/inputs meet 44px touch target
- [ ] No axe DevTools critical/serious violations
- [ ] Focus indicators visible on all interactive elements

---

## SUCCESS CRITERIA

| # | Criterion |
|---|-----------|
| 1 | All touch targets ≥ 44px (or documented exception) |
| 2 | All icon buttons have aria-label |
| 3 | All form inputs have visible labels |
| 4 | Keyboard navigation works for entire app |
| 5 | Focus indicators visible and use lime ring |
| 6 | Lighthouse accessibility ≥ 90 |
| 7 | No color-only information conveyance |

---

## OUTPUT FORMAT

```
♿ ACCESSIBILITY AUDIT RESULTS

**Lighthouse Score:** X/100

**Summary:**
- Touch target violations: X
- Missing labels: X
- Focus issues: X
- Keyboard issues: X

**Critical (Fix Immediately):**
1. [file:line] [issue] → [fix]
...

**High Priority:**
1. [file:line] [issue] → [fix]
...

**Medium Priority:**
1. [file:line] [issue] → [fix]
...

**Patterns for Page Audits:**
- [Pattern 1]
- [Pattern 2]
...
```

---

## AUDIT EXECUTION LOG

| Date | Auditor | Lighthouse Score | Violations Found | Notes |
|------|---------|------------------|------------------|-------|
| | | | | |

---

*Audit prompt generated: January 25, 2026*  
*Part of AutoRev Systematic Audit Suite (36 total audits)*
