# PAGE AUDIT: /unsubscribe - Email Unsubscribe

> **Audit ID:** Page-05  
> **Category:** Public Utility Page  
> **Priority:** 33 of 36  
> **Route:** `/unsubscribe`  
> **Auth Required:** No (token-based)  
> **Compliance:** CAN-SPAM / GDPR requirement

---

## PAGE OVERVIEW

The Unsubscribe page allows users to **opt out of email communications** via a link in emails. This is a legal requirement (CAN-SPAM, GDPR) and must work reliably.

**Key Features:**
- Token-based identification
- One-click unsubscribe (preferred)
- Confirmation message
- Preference management (optional)
- Re-subscribe option

---

## FILES TO EXAMINE

### Page Files

| File | Purpose |
|------|---------|
| `app/(marketing)/unsubscribe/page.jsx` | Unsubscribe page |
| `app/(marketing)/unsubscribe/page.module.css` | Page styles |
| `app/(marketing)/unsubscribe/layout.jsx` | Layout |

### Related Services

| File | Purpose |
|------|---------|
| `app/api/unsubscribe/route.js` | Unsubscribe API |
| `lib/emailService.js` | Email preferences |

---

## CRITICAL: Read These First

Before making ANY changes:

1. `docs/SOURCE_OF_TRUTH.md` - Email preferences section
2. Cross-cutting audit findings:
   - B (Security) - Token validation
   - E (Accessibility) - Simple flow

---

## IMPORTANT: INVESTIGATE BEFORE FIX

Before changing ANY code:

1. ✅ Verify unsubscribe works end-to-end
2. ✅ Test with valid token
3. ✅ Test with invalid/expired token
4. ❌ Do NOT break unsubscribe - legal requirement
5. ❓ If unsubscribe fails, check token validation

---

## CHECKLIST

### A. Functionality

- [ ] Page loads with token
- [ ] Token validated correctly
- [ ] Unsubscribe executes
- [ ] Confirmation displayed
- [ ] Invalid token handled
- [ ] Expired token handled
- [ ] Already unsubscribed handled

### B. URL Structure

```
/unsubscribe?token=abc123xyz
or
/unsubscribe/abc123xyz
```

- [ ] Token passed correctly
- [ ] Token extracted properly
- [ ] Works from email links

### C. UI/UX Design System

- [ ] **Confirm button** = Lime (or auto-process)
- [ ] **Success message** = Teal
- [ ] **Error message** = Amber
- [ ] Simple, focused layout
- [ ] No hardcoded colors

### D. Page Flow Options

**Option 1: One-Click (Preferred)**
```
┌─────────────────────────────────────────────────┐
│                                                 │
│  ✓ You've been unsubscribed                    │
│                                                 │
│  You will no longer receive marketing emails    │
│  from AutoRev.                                  │
│                                                 │
│  Changed your mind?                             │
│  [Re-subscribe]                                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Option 2: Confirmation Required**
```
┌─────────────────────────────────────────────────┐
│                                                 │
│  Unsubscribe from AutoRev emails?               │
│                                                 │
│  You're about to unsubscribe                    │
│  john@example.com                               │
│                                                 │
│  [Unsubscribe]  (lime)                          │
│                                                 │
│  Or manage your email preferences               │
│                                                 │
└─────────────────────────────────────────────────┘
```

- [ ] Clear what action will happen
- [ ] Email shown (partially masked ok)
- [ ] Simple action

### E. Success State

- [ ] Clear confirmation
- [ ] Teal accent
- [ ] Re-subscribe option
- [ ] Optional: Manage preferences link

### F. Error States

| Error | Message |
|-------|---------|
| Invalid token | "This link is invalid or expired" |
| Already unsubscribed | "You're already unsubscribed" |
| Server error | "Something went wrong. Please try again." |

- [ ] Error messages clear
- [ ] Amber styling
- [ ] Contact support option
- [ ] Retry mechanism

### G. Token Security

- [ ] Token validated server-side
- [ ] Token cannot be guessed
- [ ] Token expires appropriately
- [ ] No sensitive data in URL

### H. Preference Management (If Applicable)

- [ ] Toggle for different email types
- [ ] Marketing vs transactional
- [ ] Save preferences works

### I. Accessibility

- [ ] Clear heading
- [ ] Button accessible
- [ ] Status announced
- [ ] Keyboard navigable

### J. Mobile Responsiveness

- [ ] Works on mobile
- [ ] Touch-friendly buttons
- [ ] Readable text
- [ ] 44px touch targets

---

## SPECIFIC CHECKS

### Token-Based Unsubscribe

```javascript
// Unsubscribe should validate token
const UnsubscribePage = ({ searchParams }) => {
  const { token } = searchParams;
  const [status, setStatus] = useState('loading');
  const [email, setEmail] = useState('');
  
  useEffect(() => {
    const processUnsubscribe = async () => {
      try {
        const res = await fetch(`/api/unsubscribe?token=${token}`);
        const data = await res.json();
        
        if (data.success) {
          setEmail(data.email);
          setStatus('success');
        } else if (data.error === 'invalid_token') {
          setStatus('invalid');
        } else if (data.error === 'already_unsubscribed') {
          setStatus('already');
        }
      } catch {
        setStatus('error');
      }
    };
    
    if (token) {
      processUnsubscribe();
    } else {
      setStatus('invalid');
    }
  }, [token]);
  
  // Render based on status
};
```

### Success Display

```javascript
// Success state with re-subscribe option
if (status === 'success') {
  return (
    <div className={styles.success}>
      <div className={styles.icon}>✓</div>
      <h1>You've been unsubscribed</h1>
      <p>
        You will no longer receive marketing emails from AutoRev 
        at {maskEmail(email)}.
      </p>
      <p className={styles.resubscribe}>
        Changed your mind?{' '}
        <button onClick={handleResubscribe}>
          Re-subscribe
        </button>
      </p>
    </div>
  );
}
```

### Error Display

```javascript
// Error states
if (status === 'invalid') {
  return (
    <div className={styles.error}>
      <h1>Invalid Link</h1>
      <p>
        This unsubscribe link is invalid or has expired.
        Please use the link from your most recent email.
      </p>
      <p>
        Need help? <a href="/contact">Contact support</a>
      </p>
    </div>
  );
}
```

---

## TESTING SCENARIOS

### Test Case 1: Valid Token

1. Access /unsubscribe with valid token
2. **Expected:** Unsubscribe succeeds
3. **Verify:** User marked as unsubscribed in DB

### Test Case 2: Invalid Token

1. Access /unsubscribe with invalid token
2. **Expected:** Error message shown
3. **Verify:** No unsubscribe action taken

### Test Case 3: No Token

1. Access /unsubscribe without token
2. **Expected:** Error or redirect
3. **Verify:** Clear guidance

### Test Case 4: Already Unsubscribed

1. Use same token twice
2. **Expected:** "Already unsubscribed" message
3. **Verify:** No error, graceful handling

### Test Case 5: Re-subscribe

1. Click re-subscribe after unsubscribing
2. **Expected:** User re-subscribed
3. **Verify:** Preferences updated

### Test Case 6: From Email Link

1. Click unsubscribe link in actual email
2. **Expected:** Unsubscribe works
3. **Verify:** Complete flow from email

---

## AUTOMATED CHECKS

```bash
# 1. Check for hardcoded colors
grep -rn "#[0-9a-fA-F]\{3,6\}" app/\(marketing\)/unsubscribe/*.jsx app/\(marketing\)/unsubscribe/*.css

# 2. Check for design tokens
grep -rn "accent-lime\|accent-teal\|accent-amber" app/\(marketing\)/unsubscribe/*.jsx

# 3. Check for token handling
grep -rn "token\|searchParams" app/\(marketing\)/unsubscribe/*.jsx

# 4. Check for error handling
grep -rn "error\|invalid\|expired" app/\(marketing\)/unsubscribe/*.jsx

# 5. Check for console.log
grep -rn "console\.log" app/\(marketing\)/unsubscribe/*.jsx
```

---

## CROSS-REFERENCE WITH FOUNDATION AUDITS

| Audit | Check On This Page |
|-------|-------------------|
| B. Security | Token validation |
| E. Accessibility | Simple accessible flow |
| H. API | Unsubscribe endpoint |

---

## DELIVERABLES

### 1. Functionality Report

| Feature | Works | Issues |
|---------|-------|--------|
| Page loads | ✅/❌ | |
| Valid token | ✅/❌ | |
| Invalid token | ✅/❌ | |
| Success state | ✅/❌ | |
| Re-subscribe | ✅/❌ | |

### 2. State Compliance Report

| State | Expected Color | Actual | Status |
|-------|----------------|--------|--------|
| Success | Teal | | ✅/❌ |
| Error | Amber | | ✅/❌ |
| Button | Lime | | ✅/❌ |

### 3. Issues Found

| Severity | Issue | File:Line | Fix |
|----------|-------|-----------|-----|
| | | | |

---

## VERIFICATION

- [ ] Unsubscribe works with valid token
- [ ] Invalid tokens handled gracefully
- [ ] Success shows in teal
- [ ] Errors show in amber
- [ ] Mobile responsive
- [ ] Legal compliance met

---

## SUCCESS CRITERIA

| # | Criterion |
|---|-----------|
| 1 | Unsubscribe works end-to-end |
| 2 | Success = teal confirmation |
| 3 | Errors = amber, clear message |
| 4 | Invalid tokens handled |
| 5 | Re-subscribe option available |
| 6 | Works from email links |
| 7 | No critical/high issues remaining |

---

## OUTPUT FORMAT

```
📧 PAGE AUDIT: /unsubscribe

**Status:** ✅ Pass / ⚠️ Issues / ❌ Fail

**States:** ✅ / ❌
- Success: Teal ✅
- Error: Amber ✅
- Button: Lime ✅

**Functionality:**
- [x] Valid token works
- [x] Invalid token handled
- [x] Success message
- [ ] Re-subscribe missing (issue #1)

**Issues Found:**
1. [Medium] No re-subscribe option
2. [Low] Token not masked in URL
...

**Test Results:**
- Valid token: ✅
- Invalid token: ✅
- From email: ✅
- Re-subscribe: ❌
```

---

## AUDIT EXECUTION LOG

| Date | Auditor | Status | Issues Fixed | Notes |
|------|---------|--------|--------------|-------|
| | | | | |

---

*Audit prompt generated: January 25, 2026*  
*Part of AutoRev Systematic Audit Suite (36 total audits)*
