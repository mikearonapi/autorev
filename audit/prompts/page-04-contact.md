# PAGE AUDIT: /contact - Contact Form

> **Audit ID:** Page-04  
> **Category:** Public Marketing Page  
> **Priority:** 32 of 36  
> **Route:** `/contact`  
> **Auth Required:** No  
> **SEO:** Medium priority

---

## PAGE OVERVIEW

The Contact page provides a **form for users to reach out** with questions, feedback, or support requests. It should be user-friendly, accessible, and properly validated.

**Key Features:**
- Contact form
- Form validation
- Success/error feedback
- Alternative contact methods
- Spam protection (optional)

---

## FILES TO EXAMINE

### Page Files

| File | Purpose |
|------|---------|
| `app/(marketing)/contact/page.jsx` | Contact page |
| `app/(marketing)/contact/page.module.css` | Contact styles |
| `app/(marketing)/contact/layout.jsx` | Contact layout |

### Related Services

| File | Purpose |
|------|---------|
| `app/api/contact/route.js` | Contact form API |
| `lib/emailService.js` | Email sending |

---

## CRITICAL: Read These First

Before making ANY changes:

1. `docs/SOURCE_OF_TRUTH.md` - Forms section
2. `docs/BRAND_GUIDELINES.md` - Form patterns, CTAs
3. Cross-cutting audit findings:
   - D (UI/UX) - Form patterns
   - E (Accessibility) - Form accessibility
   - B (Security) - Input validation

---

## IMPORTANT: INVESTIGATE BEFORE FIX

Before changing ANY code:

1. ✅ Verify form submits correctly
2. ✅ Test validation works
3. ✅ Check success/error messages
4. ❌ Do NOT change email recipients without approval
5. ❓ If submission fails, check API route

---

## CHECKLIST

### A. Functionality

- [ ] Page loads correctly
- [ ] Form fields display
- [ ] Validation works
- [ ] Form submits successfully
- [ ] Success message shows
- [ ] Error handling works
- [ ] Email is sent (verify)

### B. Form Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Name | text | Yes | Min 2 chars |
| Email | email | Yes | Valid email |
| Subject | select/text | Optional | - |
| Message | textarea | Yes | Min 10 chars |

- [ ] All required fields marked
- [ ] Proper input types
- [ ] Placeholders helpful
- [ ] Labels visible

### C. UI/UX Design System

- [ ] **Submit button** = Lime
- [ ] **Form inputs** = Standard styling
- [ ] **Required indicator** = Asterisk or text
- [ ] **Error messages** = Amber/red
- [ ] **Success message** = Teal
- [ ] No hardcoded colors
- [ ] 44px touch targets

### D. Form Layout

```
┌─────────────────────────────────────────────────┐
│  Contact Us                                     │
│  Have a question? We'd love to hear from you.   │
├─────────────────────────────────────────────────┤
│                                                 │
│  Name *                                         │
│  ┌───────────────────────────────────────────┐  │
│  │ Your name                                 │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  Email *                                        │
│  ┌───────────────────────────────────────────┐  │
│  │ you@example.com                           │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  Subject                                        │
│  ┌───────────────────────────────────────────┐  │
│  │ Select a topic...                       ▼ │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  Message *                                      │
│  ┌───────────────────────────────────────────┐  │
│  │                                           │  │
│  │ How can we help?                          │  │
│  │                                           │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  [Send Message]  (lime, 44px)                   │
│                                                 │
└─────────────────────────────────────────────────┘
```

- [ ] Clear title
- [ ] Helpful intro text
- [ ] Labels above inputs
- [ ] Required fields marked
- [ ] Submit button prominent

### E. Form Validation

- [ ] Client-side validation
- [ ] Server-side validation
- [ ] Inline error messages
- [ ] Error state on inputs
- [ ] Focus moves to first error

### F. Error Display

```
Name *
┌───────────────────────────────────────────┐
│                                           │  (red/amber border)
└───────────────────────────────────────────┘
⚠ Please enter your name
```

- [ ] Error border on input
- [ ] Error message below field
- [ ] Amber/red color
- [ ] Icon optional

### G. Success State

```
┌─────────────────────────────────────────────────┐
│  ✓ Message Sent!                               │
│                                                 │
│  Thank you for reaching out. We'll respond     │
│  within 24-48 hours.                           │
│                                                 │
│  [Back to Home]                                 │
└─────────────────────────────────────────────────┘
```

- [ ] Clear success message
- [ ] Teal accent
- [ ] Form hidden or reset
- [ ] Next action available

### H. Loading State

- [ ] Submit button shows loading
- [ ] Button disabled during submit
- [ ] Form fields disabled (optional)

### I. Accessibility

- [ ] Labels linked to inputs (`htmlFor`)
- [ ] Required fields announced
- [ ] Error messages linked (`aria-describedby`)
- [ ] Focus management on errors
- [ ] Form landmark (`<form>`)

### J. Mobile Responsiveness

- [ ] Full-width inputs
- [ ] 44px touch targets
- [ ] Keyboard handling
- [ ] Labels don't truncate

### K. Spam Protection

- [ ] Honeypot field (optional)
- [ ] Rate limiting on API
- [ ] reCAPTCHA (if implemented)

### L. Alternative Contact

- [ ] Email address shown
- [ ] Social links (optional)
- [ ] Response time expectation

---

## SPECIFIC CHECKS

### Form Component Pattern

```javascript
// Contact form should have proper validation
const ContactForm = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle, submitting, success, error
  
  const validate = () => {
    const errs = {};
    if (!form.name || form.name.length < 2) {
      errs.name = 'Please enter your name';
    }
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Please enter a valid email';
    }
    if (!form.message || form.message.length < 10) {
      errs.message = 'Message must be at least 10 characters';
    }
    return errs;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    
    setStatus('submitting');
    try {
      await fetch('/api/contact', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };
  
  if (status === 'success') {
    return <SuccessMessage />;
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
};
```

### Input Component Pattern

```javascript
// Inputs should have proper accessibility
const FormInput = ({ label, name, type, required, error, ...props }) => (
  <div className={styles.field}>
    <label htmlFor={name}>
      {label}
      {required && <span className={styles.required}> *</span>}
    </label>
    <input
      id={name}
      name={name}
      type={type}
      aria-invalid={!!error}
      aria-describedby={error ? `${name}-error` : undefined}
      className={cn(styles.input, error && styles.inputError)}
      {...props}
    />
    {error && (
      <span id={`${name}-error`} className={styles.error}>
        {error}
      </span>
    )}
  </div>
);
```

### Submit Button Pattern

```javascript
// Submit should be lime and show loading
<button
  type="submit"
  disabled={status === 'submitting'}
  className={styles.submitButton}
>
  {status === 'submitting' ? 'Sending...' : 'Send Message'}
</button>

// Styles
.submitButton {
  background: var(--color-accent-lime);
  color: var(--color-bg-primary);
  min-height: 44px;
  padding: var(--space-3) var(--space-6);
  width: 100%;
}
.submitButton:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
```

---

## TESTING SCENARIOS

### Test Case 1: Successful Submission

1. Fill all required fields correctly
2. Click Submit
3. **Expected:** Form submits, success message
4. **Verify:** Email received (check backend)

### Test Case 2: Validation Errors

1. Submit empty form
2. **Expected:** Validation errors shown
3. **Verify:** Each required field has error

### Test Case 3: Invalid Email

1. Enter invalid email format
2. Try to submit
3. **Expected:** Email validation error
4. **Verify:** Error message clear

### Test Case 4: Loading State

1. Submit valid form
2. **Expected:** Button shows "Sending..."
3. **Verify:** Button disabled during submit

### Test Case 5: Mobile Form

1. View on mobile device
2. **Expected:** Form usable, inputs full-width
3. **Verify:** 44px touch targets

### Test Case 6: Keyboard Navigation

1. Tab through form
2. **Expected:** Logical order, focus visible
3. **Verify:** Can submit with keyboard

---

## AUTOMATED CHECKS

```bash
# 1. Check for hardcoded colors
grep -rn "#[0-9a-fA-F]\{3,6\}" app/\(marketing\)/contact/*.jsx app/\(marketing\)/contact/*.css

# 2. Check for design tokens
grep -rn "accent-lime\|accent-teal" app/\(marketing\)/contact/*.jsx

# 3. Check for form labels
grep -rn "htmlFor=\|<label" app/\(marketing\)/contact/*.jsx

# 4. Check for aria attributes
grep -rn "aria-invalid\|aria-describedby" app/\(marketing\)/contact/*.jsx

# 5. Check for validation
grep -rn "validate\|error\|setError" app/\(marketing\)/contact/*.jsx

# 6. Check for console.log
grep -rn "console\.log" app/\(marketing\)/contact/*.jsx
```

---

## CROSS-REFERENCE WITH FOUNDATION AUDITS

| Audit | Check On This Page |
|-------|-------------------|
| D. UI/UX | Form patterns, CTA |
| E. Accessibility | Form accessibility |
| B. Security | Input validation |
| H. API | Contact endpoint |

---

## DELIVERABLES

### 1. Functionality Report

| Feature | Works | Issues |
|---------|-------|--------|
| Form loads | ✅/❌ | |
| Validation | ✅/❌ | |
| Submission | ✅/❌ | |
| Success state | ✅/❌ | |
| Error handling | ✅/❌ | |

### 2. Form Compliance Report

| Element | Expected | Actual | Status |
|---------|----------|--------|--------|
| Submit button | Lime | | ✅/❌ |
| Error messages | Amber | | ✅/❌ |
| Success message | Teal | | ✅/❌ |
| Labels linked | htmlFor | | ✅/❌ |
| Touch targets | 44px | | ✅/❌ |

### 3. Issues Found

| Severity | Issue | File:Line | Fix |
|----------|-------|-----------|-----|
| | | | |

---

## VERIFICATION

- [ ] Form submits correctly
- [ ] Submit button is lime
- [ ] Validation errors in amber
- [ ] Success message in teal
- [ ] Labels properly linked
- [ ] Mobile responsive

---

## SUCCESS CRITERIA

| # | Criterion |
|---|-----------|
| 1 | Form loads and displays |
| 2 | Submit button = lime |
| 3 | Validation works |
| 4 | Success/error states clear |
| 5 | Accessible form elements |
| 6 | Mobile responsive |
| 7 | No critical/high issues remaining |

---

## OUTPUT FORMAT

```
📧 PAGE AUDIT: /contact

**Status:** ✅ Pass / ⚠️ Issues / ❌ Fail

**Form Compliance:** ✅ / ❌
- Submit: Lime ✅
- Errors: Amber ✅
- Success: Teal ✅
- Labels: Linked ✅

**Functionality:**
- [x] Form displays
- [x] Validation
- [x] Submission
- [ ] Loading state missing (issue #1)

**Issues Found:**
1. [Medium] No loading state on submit
2. [Low] Email error message unclear
...

**Test Results:**
- Submit: ✅
- Validation: ✅
- Mobile: ✅
- Keyboard: ✅
```

---

## AUDIT EXECUTION LOG

| Date | Auditor | Status | Issues Fixed | Notes |
|------|---------|--------|--------------|-------|
| | | | | |

---

*Audit prompt generated: January 25, 2026*  
*Part of AutoRev Systematic Audit Suite (36 total audits)*
