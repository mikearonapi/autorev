# PAGE AUDIT: /shared/al/[token] - Shared AL Conversation

> **Audit ID:** Page-08  
> **Category:** Public Sharing Page  
> **Priority:** 36 of 36 (FINAL)  
> **Route:** `/shared/al/[token]`  
> **Auth Required:** No (public via token)  
> **Security Critical:** Yes (token validation)

---

## PAGE OVERVIEW

The Shared AL Conversation page displays a **previously shared AI Mechanic conversation** publicly. Users can share helpful AL responses via a unique token URL.

**Key Features:**
- Token-based access
- Read-only conversation display
- Vehicle context shown
- Citations visible
- Share buttons
- CTA to try AL

---

## FILES TO EXAMINE

### Page Files

| File | Purpose |
|------|---------|
| `app/(marketing)/shared/al/[token]/page.jsx` | Main page |
| `app/(marketing)/shared/al/[token]/page.module.css` | Page styles |
| `app/(marketing)/shared/al/[token]/layout.jsx` | Layout wrapper |

### API Route

| File | Purpose |
|------|---------|
| `app/api/shared/al/[token]/route.js` | Token validation & data |

### Related Components

| File | Purpose |
|------|---------|
| `components/ALChatMessage.jsx` | Message display |
| `components/ALChatMessage.module.css` | Message styles |
| `components/ALCitation.jsx` | Citation display |
| `components/ALCitation.module.css` | Citation styles |

### Related Service

| File | Purpose |
|------|---------|
| `lib/alService.js` | AL conversation management |

---

## CRITICAL: Read These First

Before making ANY changes:

1. `docs/SOURCE_OF_TRUTH.md` - AL sharing section
2. `docs/BRAND_GUIDELINES.md` - AL chat styling
3. Cross-cutting audit findings:
   - B (Security) - Token validation
   - D (UI/UX) - Chat bubble styling
   - J (SEO) - Metadata

---

## IMPORTANT: INVESTIGATE BEFORE FIX

Before changing ANY code:

1. ✅ Verify shared conversation loads
2. ✅ Test invalid token handling
3. ✅ Check security (no private data leak)
4. ❌ Do NOT expose user IDs or emails
5. ❓ If conversation not found, check token format

---

## CHECKLIST

### A. Security (CRITICAL)

- [ ] Token validated server-side
- [ ] Expired tokens rejected
- [ ] Revoked tokens rejected
- [ ] No user PII exposed
- [ ] No internal IDs exposed
- [ ] Rate limiting on API
- [ ] Token format secure (UUID or similar)

### B. Functionality

- [ ] Conversation loads by token
- [ ] Messages display in order
- [ ] User questions visible
- [ ] AL responses visible
- [ ] Citations display
- [ ] Vehicle context shown
- [ ] 404 for invalid token
- [ ] Graceful error handling

### C. UI/UX Design System

- [ ] **User messages** = Right-aligned, neutral
- [ ] **AL responses** = Left-aligned, styled
- [ ] **Citations** = Teal links/badges
- [ ] **CTA to try AL** = Lime button
- [ ] No hardcoded colors
- [ ] 44px touch targets

### D. Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│  AutoRev AL                              [Share] [Try AL]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Shared Conversation                                        │
│  About: 2024 BMW M3 Competition                             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                              ┌─────────────────────────┐    │
│                              │ Why does my car make    │    │
│                              │ a clicking noise when   │    │
│                              │ turning?                │    │
│                              └─────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ The clicking noise when turning is commonly         │    │
│  │ caused by worn CV joints...                         │    │
│  │                                                     │    │
│  │ Sources: [BMW Technical Manual] [CV Joint Guide]    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ... more messages ...                                      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Want answers like this for your car?               │    │
│  │  [Try AL Free - Lime CTA]                           │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

- [ ] Header with branding
- [ ] Vehicle context shown
- [ ] Messages in conversation format
- [ ] Citations visible
- [ ] CTA at bottom

### E. Token Validation

| Token State | Response |
|-------------|----------|
| Valid | Show conversation |
| Invalid format | 404 |
| Not found | 404 |
| Expired | 410 Gone or message |
| Revoked | 404 or message |

- [ ] Server-side validation
- [ ] Appropriate error responses
- [ ] No information leakage

### F. Message Display

| Message Type | Style |
|--------------|-------|
| User question | Right-aligned, neutral bg |
| AL response | Left-aligned, styled bg |
| System message | Center, subtle |

- [ ] Clear visual distinction
- [ ] Timestamps (optional)
- [ ] Markdown rendered
- [ ] Code blocks styled

### G. Citations Display

- [ ] Citations visible
- [ ] Teal color for links
- [ ] Source names shown
- [ ] Clickable if URLs available
- [ ] Accessible labeling

### H. Vehicle Context

- [ ] Vehicle name shown
- [ ] Year/Make/Model format
- [ ] No sensitive vehicle data

### I. Social Sharing

- [ ] Share URL works
- [ ] Copy link button
- [ ] Twitter/X share
- [ ] Mobile native share

### J. CTA to Try AL

- [ ] Prominent CTA
- [ ] Lime color
- [ ] Links to /al or signup
- [ ] Clear value proposition

### K. Loading States

- [ ] Skeleton while loading
- [ ] Message placeholders
- [ ] No layout shift

### L. Error States

- [ ] 404 for invalid token
- [ ] Expired conversation message
- [ ] Network error handling
- [ ] Graceful degradation

### M. SEO (Light Touch)

- [ ] Generic title (no conversation content)
- [ ] Generic description
- [ ] noindex if private content
- [ ] Canonical URL

### N. Accessibility

- [ ] Semantic conversation markup
- [ ] Screen reader labels
- [ ] Focus management
- [ ] Keyboard navigable

### O. Mobile Responsiveness

- [ ] Messages adapt
- [ ] Touch-friendly
- [ ] 44px touch targets
- [ ] CTA visible

---

## SPECIFIC CHECKS

### Token Validation API

```javascript
// API route must validate token securely
export async function GET(request, { params }) {
  const { token } = params;
  
  // Validate token format
  if (!isValidTokenFormat(token)) {
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 404 }
    );
  }
  
  // Lookup conversation
  const conversation = await getSharedConversation(token);
  
  if (!conversation) {
    return NextResponse.json(
      { error: 'Conversation not found' },
      { status: 404 }
    );
  }
  
  // Check expiration
  if (isExpired(conversation.expires_at)) {
    return NextResponse.json(
      { error: 'Conversation has expired' },
      { status: 410 }
    );
  }
  
  // Check if revoked
  if (conversation.revoked) {
    return NextResponse.json(
      { error: 'Conversation no longer available' },
      { status: 404 }
    );
  }
  
  // Return sanitized data (NO PII)
  return NextResponse.json({
    vehicle: {
      year: conversation.vehicle_year,
      make: conversation.vehicle_make,
      model: conversation.vehicle_model,
    },
    messages: conversation.messages.map(sanitizeMessage),
    shared_at: conversation.shared_at,
  });
}

// Sanitize to remove any PII
function sanitizeMessage(msg) {
  return {
    role: msg.role, // 'user' or 'assistant'
    content: msg.content,
    citations: msg.citations,
    // NO user_id, NO email, NO internal IDs
  };
}
```

### Page Component Pattern

```javascript
// Page must handle all states
export default async function SharedALPage({ params }) {
  const { token } = params;
  
  // Fetch on server
  const result = await fetch(`/api/shared/al/${token}`);
  
  if (!result.ok) {
    if (result.status === 404) {
      notFound();
    }
    // Handle other errors
    return <ErrorState />;
  }
  
  const data = await result.json();
  
  return (
    <div className={styles.container}>
      <SharedConversationHeader vehicle={data.vehicle} />
      
      <div className={styles.messages}>
        {data.messages.map((msg, i) => (
          <ChatMessage
            key={i}
            role={msg.role}
            content={msg.content}
            citations={msg.citations}
          />
        ))}
      </div>
      
      <TryALCTA />
    </div>
  );
}
```

### Chat Message Styling

```css
/* User messages - right aligned */
.userMessage {
  align-self: flex-end;
  background: var(--color-gray-800);
  border-radius: var(--radius-lg);
  max-width: 80%;
}

/* AL messages - left aligned */
.assistantMessage {
  align-self: flex-start;
  background: var(--color-gray-850);
  border-radius: var(--radius-lg);
  max-width: 80%;
}

/* Citations */
.citation {
  color: var(--color-accent-teal);
  font-size: var(--text-sm);
}

.citation:hover {
  text-decoration: underline;
}
```

### CTA Pattern

```javascript
// CTA must be prominent and lime
const TryALCTA = () => (
  <div className={styles.ctaSection}>
    <h3>Want answers like this for your car?</h3>
    <p>AL knows your specific vehicle and can help with maintenance, mods, and more.</p>
    <a href="/al" className={styles.ctaButton}>
      Try AL Free
    </a>
  </div>
);

// Styles
.ctaButton {
  background: var(--color-accent-lime);
  color: var(--color-gray-900);
  padding: var(--spacing-3) var(--spacing-6);
  border-radius: var(--radius-lg);
  min-height: 44px;
  font-weight: 600;
}
```

---

## TESTING SCENARIOS

### Test Case 1: Valid Token

1. Navigate to /shared/al/[valid-token]
2. **Expected:** Conversation displays
3. **Verify:** Messages, vehicle context, citations visible

### Test Case 2: Invalid Token

1. Navigate to /shared/al/invalid-token-xyz
2. **Expected:** 404 page
3. **Verify:** No information leakage

### Test Case 3: Expired Token

1. Navigate to /shared/al/[expired-token]
2. **Expected:** Appropriate error message
3. **Verify:** Clear indication of expiration

### Test Case 4: Security - No PII

1. Inspect API response
2. **Expected:** No user_id, email, internal IDs
3. **Verify:** Only sanitized data returned

### Test Case 5: Copy Link

1. Click "Copy Link" button
2. **Expected:** URL copied to clipboard
3. **Verify:** Toast/feedback shown

### Test Case 6: Try AL CTA

1. Click "Try AL Free" button
2. **Expected:** Navigate to /al
3. **Verify:** CTA is lime, prominent

### Test Case 7: Mobile View

1. View on mobile device
2. **Expected:** Messages readable, CTA visible
3. **Verify:** Touch targets 44px

---

## AUTOMATED CHECKS

```bash
# 1. Check for hardcoded colors
grep -rn "#[0-9a-fA-F]\{3,6\}" app/\(marketing\)/shared/al/\[token\]/*.jsx app/\(marketing\)/shared/al/\[token\]/*.css

# 2. Check for color tokens
grep -rn "accent-teal\|accent-lime" app/\(marketing\)/shared/al/\[token\]/*.jsx

# 3. Check for PII exposure
grep -rn "user_id\|email\|user\.id" app/api/shared/al/\[token\]/route.js

# 4. Check for proper error handling
grep -rn "notFound\|404\|error" app/\(marketing\)/shared/al/\[token\]/page.jsx

# 5. Check for console.log
grep -rn "console\.log" app/\(marketing\)/shared/al/\[token\]/*.jsx app/api/shared/al/\[token\]/route.js

# 6. Check for token validation
grep -rn "isValid\|token\|expires" app/api/shared/al/\[token\]/route.js
```

---

## SECURITY CHECKLIST

| Check | Status | Notes |
|-------|--------|-------|
| Token validated server-side | ✅/❌ | |
| No user PII in response | ✅/❌ | |
| No internal IDs exposed | ✅/❌ | |
| Expired tokens rejected | ✅/❌ | |
| Revoked tokens rejected | ✅/❌ | |
| Rate limiting applied | ✅/❌ | |
| Token format is secure | ✅/❌ | |

---

## CROSS-REFERENCE WITH FOUNDATION AUDITS

| Audit | Check On This Page |
|-------|-------------------|
| B. Security | Token validation, no PII |
| D. UI/UX | Chat styling, CTA colors |
| J. SEO | Light SEO, noindex if needed |
| E. Accessibility | Conversation markup |

---

## DELIVERABLES

### 1. Functionality Report

| Feature | Works | Issues |
|---------|-------|--------|
| Token validation | ✅/❌ | |
| Conversation display | ✅/❌ | |
| Citations | ✅/❌ | |
| Share buttons | ✅/❌ | |
| CTA | ✅/❌ | |

### 2. Security Report

| Check | Status | Notes |
|-------|--------|-------|
| No PII exposed | ✅/❌ | |
| Token validation | ✅/❌ | |
| Error handling | ✅/❌ | |

### 3. Color Compliance Report

| Element | Expected | Actual | Status |
|---------|----------|--------|--------|
| Citations | Teal | | ✅/❌ |
| Try AL CTA | Lime | | ✅/❌ |

### 4. Issues Found

| Severity | Issue | File:Line | Fix |
|----------|-------|-----------|-----|
| | | | |

---

## VERIFICATION

- [ ] Conversation loads by token
- [ ] Invalid tokens return 404
- [ ] No PII in API response
- [ ] Citations display in teal
- [ ] CTA is lime
- [ ] Mobile responsive
- [ ] No security issues

---

## SUCCESS CRITERIA

| # | Criterion |
|---|-----------|
| 1 | Token validation works |
| 2 | No PII exposed |
| 3 | Conversation displays correctly |
| 4 | Citations = teal, CTA = lime |
| 5 | Invalid tokens → 404 |
| 6 | Mobile responsive |
| 7 | No critical/high issues remaining |

---

## OUTPUT FORMAT

```
🤖 PAGE AUDIT: /shared/al/[token]

**Status:** ✅ Pass / ⚠️ Issues / ❌ Fail

**Security:** ✅ / ❌
- Token validation: ✅
- No PII exposed: ✅
- Error handling: ✅

**Color Compliance:** ✅ / ❌
- Citations: Teal ✅
- CTA: Lime ✅

**Functionality:**
- [x] Conversation loads
- [x] Messages display
- [x] Citations visible
- [ ] Share buttons (issue #1)

**Issues Found:**
1. [Medium] Share button doesn't show feedback
2. [Low] Missing loading skeleton
...

**Test Results:**
- Valid token: ✅
- Invalid token: ✅
- Security check: ✅
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

---

## 🎉 AUDIT SUITE COMPLETE

This is the **final audit prompt** (#36 of 36).

### Full Audit Suite Summary

| Category | Count | Status |
|----------|-------|--------|
| Cross-Cutting Audits | 10 | ✅ Complete |
| Core App Pages | 9 | ✅ Complete |
| Data & Community Pages | 6 | ✅ Complete |
| Settings & Profile Pages | 3 | ✅ Complete |
| Public Pages | 8 | ✅ Complete |
| **TOTAL** | **36** | **✅ Complete** |

All audit prompts are available in `/audit/prompts/` with a master index at `00-AUDIT-INDEX.md`.
