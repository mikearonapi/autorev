# AUDIT: API Routes - Codebase-Wide

> **Audit ID:** H  
> **Category:** Cross-Cutting (Foundation)  
> **Priority:** 6 of 36  
> **Dependencies:** C (Database), I (State Management)  
> **Downstream Impact:** Page audits will verify API consumption patterns

---

## CONTEXT

This audit ensures all API routes follow consistent patterns for responses, errors, validation, and authentication. Inconsistent APIs cause frontend bugs, poor error handling, and security vulnerabilities.

**Key Focus Areas:**
- Response format consistency
- Error response standardization
- Input validation with Zod
- Authentication/authorization
- Rate limiting
- Documentation accuracy

---

## CRITICAL: Read These First

Before making ANY changes, read these documents completely:

1. `docs/SOURCE_OF_TRUTH.md` - API Routes section, Cardinal Rule 9
2. `lib/apiErrors.js` - Standard error response helpers
3. `lib/auth.js` - Authentication utilities
4. `lib/schemas/` - Zod validation schemas

---

## IMPORTANT: INVESTIGATE BEFORE FIX

Before changing ANY code:

1. ✅ Test the API endpoint to understand current behavior
2. ✅ Check if "inconsistent" responses might be consumed differently
3. ✅ Verify breaking changes won't affect existing clients
4. ❌ Do NOT change response shapes without frontend updates
5. ❓ If an endpoint seems wrong but works, trace all consumers first

---

## API RESPONSE STANDARDS

### Success Responses

```javascript
// Single item
return NextResponse.json({ data: item });

// List
return NextResponse.json({ data: items, count: items.length });

// Paginated list
return NextResponse.json({ 
  data: items, 
  pagination: { page, limit, total, hasMore } 
});

// Action confirmation
return NextResponse.json({ success: true, message: 'Resource created' });
```

### Error Responses

```javascript
import { apiError, unauthorized, forbidden, notFound, badRequest } from '@/lib/apiErrors';

// 400 Bad Request
return badRequest('Invalid car ID format');

// 401 Unauthorized
return unauthorized('Authentication required');

// 403 Forbidden
return forbidden('You do not own this vehicle');

// 404 Not Found
return notFound('Car not found');

// 500 Internal Error
return apiError('Failed to process request', 500);

// Validation errors
return badRequest('Validation failed', { errors: zodErrors });
```

---

## CHECKLIST

### A. Response Consistency (CRITICAL)

- [ ] All success responses use `{ data: ... }` wrapper
- [ ] All error responses use `{ error: message }` or `{ error: message, details: ... }`
- [ ] HTTP status codes are correct (200, 201, 400, 401, 403, 404, 500)
- [ ] No raw data returns (always wrapped)
- [ ] Consistent field naming (camelCase)

### B. Error Handling

- [ ] All routes use `lib/apiErrors.js` helpers
- [ ] Try/catch wraps database operations
- [ ] Errors logged with context (endpoint, params, user)
- [ ] User-friendly error messages (not raw DB errors)
- [ ] No stack traces in production responses

### C. Input Validation

- [ ] All POST/PUT/PATCH bodies validated with Zod
- [ ] Query parameters validated
- [ ] URL parameters validated (UUIDs, slugs)
- [ ] Validation errors return 400 with specific messages
- [ ] Schemas defined in `lib/schemas/`

### D. Authentication

- [ ] Protected routes check auth first
- [ ] `getAuthenticatedUser()` or equivalent used
- [ ] 401 returned for missing auth
- [ ] User ID from session, not request body
- [ ] No auth bypass vulnerabilities

### E. Authorization

- [ ] Resource ownership verified
- [ ] Tier/subscription access checked where needed
- [ ] Admin routes check admin role
- [ ] 403 returned for unauthorized access
- [ ] No IDOR vulnerabilities

### F. Rate Limiting

- [ ] Expensive endpoints have rate limits
- [ ] AI/AL endpoints rate limited
- [ ] Public endpoints have stricter limits
- [ ] Rate limit headers included in response
- [ ] 429 returned when exceeded

### G. HTTP Methods

- [ ] GET for reading (idempotent)
- [ ] POST for creating
- [ ] PUT/PATCH for updating
- [ ] DELETE for removing
- [ ] No side effects in GET requests

### H. Route Organization

- [ ] Routes follow `/api/{resource}/{action}` pattern
- [ ] Kebab-case for URL paths
- [ ] Consistent plural/singular naming
- [ ] No duplicate routes for same functionality

### I. Documentation

- [ ] Route purpose documented in comments
- [ ] Request/response types documented
- [ ] Required auth level documented
- [ ] Error codes documented

---

## KEY FILES TO EXAMINE

### Error Handling

| File | Purpose |
|------|---------|
| `lib/apiErrors.js` | Standard error response helpers |
| `lib/auth.js` | Authentication utilities |

### Validation

| File | Purpose |
|------|---------|
| `lib/schemas/index.js` | Zod schemas |
| `lib/rateLimit.js` | Rate limiting utilities |

### High-Traffic Routes

| Route | Check For |
|-------|-----------|
| `app/api/cars/[slug]/route.js` | car_id resolution, caching |
| `app/api/user/*/route.js` | Auth, ownership |
| `app/api/ai-mechanic/route.js` | Rate limiting, validation |
| `app/api/garage/*/route.js` | Ownership checks |

### Webhook Routes

| Route | Check For |
|-------|-----------|
| `app/api/webhooks/stripe/route.js` | Signature verification |
| Other webhook routes | Idempotency, verification |

### Public Routes

| Route | Check For |
|-------|-----------|
| `app/api/public/*/route.js` | No auth required, rate limits |
| `app/api/cars/route.js` | Caching, pagination |

---

## AUTOMATED CHECKS

Run these commands and document results:

```bash
# 1. Find routes without error handling
grep -rn "export async function" --include="route.js" app/api/ -A20 | grep -B10 "supabase\|fetch" | grep -v "try\|catch"

# 2. Find routes returning raw data (not wrapped)
grep -rn "NextResponse.json" --include="route.js" app/api/ | grep -v "data:\|error:\|success:\|message:"

# 3. Find routes without auth check (in protected areas)
grep -rL "getAuthenticatedUser\|getSession\|auth()" app/api/user/ app/api/garage/

# 4. Find routes without Zod validation
grep -rL "safeParse\|parse\|z\." app/api/*/route.js | grep -v "GET"

# 5. Find inconsistent error responses
grep -rn "status: 4\|status: 5" --include="route.js" app/api/ | grep -v "apiError\|unauthorized\|forbidden\|notFound\|badRequest"

# 6. Find direct error message exposure
grep -rn "error\.message\|err\.message" --include="route.js" app/api/ | grep "NextResponse"

# 7. Find routes without rate limiting (expensive operations)
grep -rL "rateLimit" app/api/ai-mechanic/ app/api/webhooks/

# 8. List all routes for documentation check
find app/api -name "route.js" -exec dirname {} \; | sort
```

### API Testing

```bash
# Test each route category
# (Replace with actual test commands or Postman collection)

# Health check
curl http://localhost:3000/api/health

# Auth required routes (should return 401)
curl http://localhost:3000/api/user/profile

# Validation (should return 400)
curl -X POST http://localhost:3000/api/garage/vehicles \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}'
```

---

## SOURCE OF TRUTH PATTERNS

From `docs/SOURCE_OF_TRUTH.md`:

```javascript
// ✅ CORRECT: Complete API route pattern
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { apiError, unauthorized, notFound, badRequest } from '@/lib/apiErrors';
import { resolveCarId } from '@/lib/carResolver';
import { z } from 'zod';

const UpdateSchema = z.object({
  nickname: z.string().min(1).max(50).optional(),
  mileage: z.number().positive().optional(),
});

export async function PATCH(request, { params }) {
  try {
    // 1. Auth check
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorized();

    // 2. Validate params
    const carId = await resolveCarId(params.slug);
    if (!carId) return notFound('Car not found');

    // 3. Validate body
    const body = await request.json();
    const result = UpdateSchema.safeParse(body);
    if (!result.success) {
      return badRequest('Validation failed', { errors: result.error.flatten() });
    }

    // 4. Authorization check
    const { data: vehicle } = await supabase
      .from('user_vehicles')
      .select('id')
      .eq('car_id', carId)
      .eq('user_id', user.id)
      .single();
    
    if (!vehicle) return forbidden('You do not own this vehicle');

    // 5. Perform operation
    const { data, error } = await supabase
      .from('user_vehicles')
      .update(result.data)
      .eq('id', vehicle.id)
      .select()
      .single();

    if (error) throw error;

    // 6. Return consistent response
    return NextResponse.json({ data });

  } catch (error) {
    console.error('[API] PATCH /api/garage/[slug] failed:', {
      slug: params.slug,
      error: error.message,
    });
    return apiError('Failed to update vehicle');
  }
}
```

```javascript
// ❌ WRONG: Missing patterns
export async function PATCH(request, { params }) {
  const body = await request.json();  // No validation
  
  // No auth check!
  // No ownership check!
  
  const { data } = await supabase
    .from('user_vehicles')
    .update(body)  // Raw body - dangerous!
    .eq('car_slug', params.slug);  // Wrong! Use car_id
  
  return NextResponse.json(data);  // Not wrapped
}
```

---

## ROUTE INVENTORY TEMPLATE

Create an inventory of all routes:

| Route | Method | Auth | Validation | Rate Limit | Status |
|-------|--------|------|------------|------------|--------|
| `/api/cars` | GET | No | N/A | Yes | ✅ |
| `/api/cars/[slug]` | GET | No | slug | Yes | ✅ |
| `/api/user/profile` | GET | Yes | N/A | No | ⚠️ |
| `/api/garage/vehicles` | POST | Yes | Zod | No | ⚠️ |
| ... | | | | | |

---

## DELIVERABLES

### 1. Route Inventory

Complete the inventory table above for all routes.

### 2. Violation Report

| Severity | Route | Issue | Fix |
|----------|-------|-------|-----|
| Critical | | Missing auth | Add getAuthenticatedUser |
| Critical | | No validation | Add Zod schema |
| High | | Raw error exposed | Use apiError helper |
| Medium | | Inconsistent response | Wrap in { data: } |

### 3. Summary Statistics

- Total API routes: X
- Routes missing auth (that need it): X
- Routes missing validation: X
- Inconsistent responses: X
- Missing rate limits: X

---

## VERIFICATION

- [ ] All routes return consistent response shapes
- [ ] All protected routes check authentication
- [ ] All mutations validate input with Zod
- [ ] All errors use lib/apiErrors.js helpers
- [ ] No raw database errors in responses
- [ ] Rate limiting on expensive endpoints
- [ ] Route inventory complete and accurate

---

## SUCCESS CRITERIA

| # | Criterion |
|---|-----------|
| 1 | All responses wrapped in `{ data: }` or `{ error: }` |
| 2 | All protected routes verify authentication |
| 3 | All POST/PUT/PATCH validate with Zod |
| 4 | All errors use standardized helpers |
| 5 | No stack traces in production responses |
| 6 | Rate limiting on AI/expensive endpoints |
| 7 | Complete route inventory documented |

---

## OUTPUT FORMAT

```
🔌 API AUDIT RESULTS

**Route Inventory:** X total routes audited

**Summary:**
- Missing auth: X routes
- Missing validation: X routes
- Inconsistent responses: X routes
- Missing rate limits: X routes

**Critical (Fix Immediately):**
1. [route] [method] Missing authentication
2. [route] [method] No input validation
...

**Response Inconsistencies:**
1. [route] Returns raw data → Wrap in { data: }
...

**Validation Missing:**
1. [route] POST body not validated → Add Zod schema
...

**Patterns for Page Audits:**
- Verify error handling in API consumers
- Check for proper loading/error states
...
```

---

## AUDIT EXECUTION LOG

| Date | Auditor | Routes Audited | Issues Found | Notes |
|------|---------|----------------|--------------|-------|
| 2026-01-25 | Claude (Automated) | 196 files / ~135 endpoints | 5 Critical, 3 High, 4 Medium | Initial audit found 2 critical, deep review found 3 more |
| 2026-01-25 | Claude (Fixes) | 11 files fixed | 5 Critical FIXED, 15 error exposures FIXED | All IDOR vulnerabilities resolved |
| 2026-01-25 | Claude (Full Fix) | 76+ files fixed | ALL Critical/High FIXED | Comprehensive fix: 92+ error exposures, 4 Zod schemas, 10 rate-limited handlers |
| 2026-01-25 | Claude (100% Complete) | 160+ files fixed | ALL Issues FIXED | +86 withErrorLogging wrappers, +19 admin routes standardized with requireAdmin |

---

*Audit prompt generated: January 25, 2026*  
*Part of AutoRev Systematic Audit Suite (36 total audits)*
