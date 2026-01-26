# AUDIT: Security - Codebase-Wide

> **Audit ID:** B  
> **Category:** Cross-Cutting (Foundation)  
> **Priority:** 7 of 36  
> **Dependencies:** H (API) - builds on API patterns  
> **Downstream Impact:** All page audits will verify security patterns

---

## CONTEXT

This audit ensures AutoRev follows security best practices to protect user data, prevent unauthorized access, and maintain system integrity. Security vulnerabilities can lead to data breaches, account takeovers, and legal liability.

**Key Focus Areas:**
- Authentication flows
- Authorization checks (IDOR prevention)
- Input validation & sanitization
- Webhook signature verification
- XSS/CSRF prevention
- Sensitive data handling

---

## CRITICAL: Read These First

Before making ANY changes, read these documents completely:

1. `docs/SOURCE_OF_TRUTH.md` - Cardinal Rule 9 (Auth Pattern), Security section
2. `.cursor/rules/specialists/quality/security-agent.mdc` - Security checklist
3. `lib/auth.js` - Authentication utilities
4. `middleware.js` - Route protection patterns

---

## IMPORTANT: INVESTIGATE BEFORE FIX

Before changing ANY code:

1. ✅ Verify the vulnerability exists (don't assume)
2. ✅ Test the exploit scenario in development
3. ✅ Document the attack vector before fixing
4. ❌ Do NOT disable security features without understanding why they exist
5. ❓ If security seems lax but works, check if it's intentionally public

---

## SECURITY CHECKLIST

### A. Authentication (CRITICAL)

- [ ] All protected routes verify session
- [ ] `getAuthenticatedUser()` used consistently
- [ ] Session tokens not exposed in URLs
- [ ] Session expiry handled gracefully
- [ ] Auth state synced across tabs
- [ ] Logout clears all session data
- [ ] Password reset tokens expire appropriately

### B. Authorization / IDOR Prevention (CRITICAL)

- [ ] All resource access verifies ownership
- [ ] User ID from session, NEVER from request body
- [ ] No direct object references without ownership check
- [ ] Admin routes verify admin role
- [ ] Tier restrictions enforced server-side

```javascript
// ✅ CORRECT: Verify ownership
const { data: vehicle } = await supabase
  .from('user_vehicles')
  .select('id')
  .eq('car_id', carId)
  .eq('user_id', session.user.id)  // From session!
  .single();

if (!vehicle) return forbidden('Not your vehicle');

// ❌ WRONG: Trust user input
const { userId, carId } = await request.json();
// userId could be anyone!
```

### C. Webhook Security (CRITICAL)

- [ ] Stripe webhooks verify signature BEFORE parsing
- [ ] Raw body used for signature verification
- [ ] Webhook secret from environment variable
- [ ] Idempotency: check if event already processed
- [ ] Webhook endpoints don't require user auth

```javascript
// ✅ CORRECT: Verify first
const body = await req.text();  // Raw body
const signature = req.headers.get('stripe-signature');

let event;
try {
  event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
} catch (err) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
}

// ❌ WRONG: Parse first, verify later (or not at all)
const body = await req.json();  // Already parsed!
// Signature verification impossible now
```

### D. Input Validation

- [ ] All user input validated with Zod
- [ ] File uploads validate type and size
- [ ] SQL injection prevented (parameterized queries)
- [ ] NoSQL injection prevented
- [ ] Path traversal prevented in file operations
- [ ] Numeric inputs validated for range

### E. XSS Prevention

- [ ] User-generated content escaped before rendering
- [ ] No `dangerouslySetInnerHTML` without sanitization
- [ ] Rich text uses sanitization library (DOMPurify)
- [ ] URLs validated before rendering
- [ ] CSP headers configured properly

### F. CSRF Protection

- [ ] State-changing operations use POST/PUT/DELETE
- [ ] CSRF tokens used where needed (if not using SameSite cookies)
- [ ] Origin/Referer validated for sensitive operations
- [ ] SameSite cookie attribute set

### G. Sensitive Data Handling

- [ ] No secrets in client-side code
- [ ] API keys in environment variables
- [ ] Passwords never logged
- [ ] PII not in error messages
- [ ] Sensitive data not in URLs
- [ ] Database credentials not exposed

### H. Security Headers

- [ ] Content-Security-Policy configured
- [ ] X-Frame-Options set (clickjacking prevention)
- [ ] X-Content-Type-Options: nosniff
- [ ] Strict-Transport-Security (HSTS)
- [ ] Referrer-Policy configured

### I. Rate Limiting

- [ ] Login attempts rate limited
- [ ] Password reset rate limited
- [ ] API endpoints rate limited
- [ ] AI/expensive operations heavily limited
- [ ] Rate limit by IP and/or user

### J. Error Handling

- [ ] Stack traces not exposed in production
- [ ] Database errors not exposed to users
- [ ] Errors logged server-side with context
- [ ] Generic error messages to clients

### K. Dependencies

- [ ] No known vulnerabilities (`npm audit`)
- [ ] Dependencies regularly updated
- [ ] Lock file committed
- [ ] No unnecessary dependencies

---

## KEY FILES TO EXAMINE

### Authentication

| File | Check For |
|------|-----------|
| `lib/auth.js` | Session handling, user extraction |
| `middleware.js` | Route protection, redirects |
| `app/auth/callback/route.js` | OAuth callback security |
| `components/providers/AuthProvider.jsx` | Client-side auth state |

### Webhooks

| File | Check For |
|------|-----------|
| `app/api/webhooks/stripe/route.js` | Signature verification |
| Other webhook handlers | Verification patterns |

### High-Risk Routes

| File | Check For |
|------|-----------|
| `app/api/user/*/route.js` | IDOR, ownership checks |
| `app/api/garage/*/route.js` | Vehicle ownership |
| `app/api/admin/*/route.js` | Admin role verification |
| `app/api/ai-mechanic/route.js` | Rate limiting, input validation |

### Configuration

| File | Check For |
|------|-----------|
| `next.config.js` | Security headers |
| `.env.example` | No real secrets |
| `vercel.json` | Header configuration |

---

## AUTOMATED CHECKS

Run these commands and document results:

```bash
# 1. Find IDOR vulnerabilities (user ID from request body)
grep -rn "body\.userId\|body\.user_id\|params\.userId" --include="*.js" app/api/

# 2. Find missing auth checks
grep -rL "getAuthenticatedUser\|getSession\|session" app/api/user/ app/api/garage/ app/api/admin/

# 3. Find dangerouslySetInnerHTML usage
grep -rn "dangerouslySetInnerHTML" --include="*.jsx" --include="*.tsx" app/ components/

# 4. Find potential SQL injection (string concatenation in queries)
grep -rn "supabase.*\`\|supabase.*\+" --include="*.js" lib/ app/

# 5. Find secrets in code
grep -rn "sk_live\|sk_test\|password.*=.*['\"]" --include="*.js" --include="*.jsx" app/ lib/ components/

# 6. Find webhook handlers without signature verification
grep -rL "constructEvent\|verifySignature" app/api/webhooks/

# 7. Find console.log with sensitive data patterns
grep -rn "console\.log.*password\|console\.log.*token\|console\.log.*secret" --include="*.js" app/ lib/

# 8. Check for npm vulnerabilities
npm audit

# 9. Find environment variables referenced
grep -rn "process\.env\." --include="*.js" --include="*.jsx" app/ lib/ | grep -v "node_modules"

# 10. Find URLs constructed from user input
grep -rn "href=.*\$\|src=.*\$\|url.*\+" --include="*.jsx" components/ app/
```

### Security Headers Check

```bash
# Test security headers (replace with your domain)
curl -I https://your-domain.com | grep -i "content-security\|x-frame\|x-content-type\|strict-transport"
```

---

## SOURCE OF TRUTH PATTERNS

From `docs/SOURCE_OF_TRUTH.md` and Security Agent:

### Webhook Signature Verification

```javascript
// ✅ CORRECT: Complete webhook pattern
export async function POST(req) {
  // 1. Get RAW body (required for signature)
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  // 2. Verify FIRST
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body, 
      signature, 
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('[Webhook] Signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // 3. Idempotency check
  const { data: existing } = await supabase
    .from('processed_webhook_events')
    .select('id')
    .eq('event_id', event.id)
    .single();

  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  // 4. Process event
  try {
    await handleStripeEvent(event);
    
    // 5. Mark as processed
    await supabase.from('processed_webhook_events').insert({ 
      event_id: event.id,
      event_type: event.type,
      processed_at: new Date().toISOString()
    });
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Webhook] Processing failed:', { eventId: event.id, error: error.message });
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
```

### Authorization Check

```javascript
// ✅ CORRECT: Ownership verification
export async function DELETE(request, { params }) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  // Verify ownership - user_id from SESSION, not request
  const { data: vehicle } = await supabase
    .from('user_vehicles')
    .select('id, user_id')
    .eq('id', params.vehicleId)
    .single();

  if (!vehicle) return notFound('Vehicle not found');
  
  // Critical: Compare with session user
  if (vehicle.user_id !== user.id) {
    console.warn('[Security] IDOR attempt:', { 
      attemptedBy: user.id, 
      resourceOwner: vehicle.user_id,
      resource: params.vehicleId 
    });
    return forbidden('Not authorized');
  }

  // Safe to proceed
  await supabase.from('user_vehicles').delete().eq('id', vehicle.id);
  return NextResponse.json({ success: true });
}
```

---

## VULNERABILITY SEVERITY LEVELS

| Severity | Examples | Response Time |
|----------|----------|---------------|
| **Critical** | Auth bypass, IDOR, SQL injection, exposed secrets | Immediate |
| **High** | Missing rate limits, XSS, weak validation | 24 hours |
| **Medium** | Missing headers, verbose errors | 1 week |
| **Low** | Minor info leakage, weak defaults | Next sprint |

---

## DELIVERABLES

### 1. Vulnerability Report

| Severity | Category | Location | Issue | Fix | Status |
|----------|----------|----------|-------|-----|--------|
| Critical | IDOR | | | | |
| Critical | Auth | | | | |
| High | XSS | | | | |
| Medium | Headers | | | | |

### 2. Summary Statistics

- Critical vulnerabilities: X
- High vulnerabilities: X
- Medium vulnerabilities: X
- Low vulnerabilities: X
- npm audit issues: X

### 3. Security Posture Score

| Category | Score | Notes |
|----------|-------|-------|
| Authentication | /10 | |
| Authorization | /10 | |
| Input Validation | /10 | |
| Data Protection | /10 | |
| **Overall** | **/40** | |

---

## VERIFICATION

- [ ] No IDOR vulnerabilities (all ownership verified)
- [ ] All webhooks verify signatures before processing
- [ ] No secrets in codebase (`grep` finds nothing)
- [ ] `npm audit` returns 0 critical/high
- [ ] Security headers configured
- [ ] Rate limiting on sensitive endpoints
- [ ] No `dangerouslySetInnerHTML` without sanitization

---

## SUCCESS CRITERIA

| # | Criterion |
|---|-----------|
| 1 | Zero IDOR vulnerabilities |
| 2 | All webhooks verify signatures first |
| 3 | No secrets in code (env vars only) |
| 4 | All user input validated |
| 5 | Security headers configured |
| 6 | npm audit clean (0 critical/high) |
| 7 | Rate limiting on auth and AI endpoints |

---

## OUTPUT FORMAT

```
🔐 SECURITY AUDIT RESULTS

**Security Posture:** X/40

**Summary:**
- Critical: X (must fix immediately)
- High: X (fix within 24h)
- Medium: X (fix within 1 week)
- Low: X (backlog)

**Critical Vulnerabilities:**
1. [location] [type] [description]
   Attack vector: [how to exploit]
   Fix: [remediation]
...

**High Vulnerabilities:**
1. [location] [type] [description]
...

**npm audit:**
- Critical: X
- High: X
- Moderate: X

**Patterns for Page Audits:**
- Verify no user-controlled URLs rendered unsafely
- Check for ownership verification on mutations
...
```

---

## AUDIT EXECUTION LOG

| Date | Auditor | Critical | High | Medium | Notes |
|------|---------|----------|------|--------|-------|
| | | | | | |

---

*Audit prompt generated: January 25, 2026*  
*Part of AutoRev Systematic Audit Suite (36 total audits)*
