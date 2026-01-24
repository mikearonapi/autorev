# ADR-003: Supabase Auth Patterns with Next.js App Router

## Status

Accepted

## Date

2026-01-23

## Context

AutoRev uses Supabase for authentication and database. With Next.js 14 App Router, we needed to establish patterns for:
- Creating Supabase clients in different contexts (server components, API routes, middleware)
- Validating user sessions securely
- Refreshing sessions to prevent unexpected logouts
- Protecting routes that require authentication

## Decision Drivers

- **Security**: Session validation must be server-side to prevent token spoofing
- **User experience**: Sessions should refresh automatically without user intervention
- **Performance**: Minimize auth-related latency
- **Maintainability**: Clear, consistent patterns across the codebase

## Considered Options

### Option 1: Use `getSession()` for Auth Checks

Use Supabase's `getSession()` method which reads from cookies without server validation.

**Pros:**
- Faster (no server roundtrip)
- Simpler code

**Cons:**
- **INSECURE**: `getSession()` trusts the JWT in cookies without validation
- Malicious users could forge expired or tampered tokens
- Not recommended by Supabase for server-side auth

### Option 2: Use `getUser()` for All Server-Side Auth

Always use `getUser()` which validates the JWT against Supabase Auth servers.

**Pros:**
- Secure: Token is validated server-side
- Detects expired or revoked sessions
- Recommended by Supabase

**Cons:**
- Slightly slower (requires server roundtrip)
- Must be called in every protected route

## Decision

**Always use `getUser()` for server-side authentication**. Never trust `getSession()` alone on the server.

Additionally:
- Middleware refreshes sessions on every request
- API routes use `requireAuth()` helper for protected endpoints
- Server components use `getAuthenticatedUser()` helper

## Rationale

Security is non-negotiable for authentication. The performance cost of `getUser()` is minimal (typically <50ms) and is far outweighed by the security benefits.

## Consequences

### Positive

- All server-side auth is secure and validated
- Sessions stay fresh via middleware
- Consistent patterns via helper functions
- Protected routes are clearly marked

### Negative

- Slightly more latency on auth checks
- Must remember to use correct functions

### Neutral

- Supabase SSR package handles cookie management automatically

## Implementation Notes

### Middleware Pattern

```javascript
// middleware.js
const { data: { user } } = await supabase.auth.getUser();
// NEVER use getSession() here
```

### API Route Pattern

```javascript
// In API routes
import { requireAuth } from '@/lib/supabaseServer';

export async function GET(request) {
  const { user, supabase } = await requireAuth();
  // user is guaranteed to be valid
}
```

### Server Component Pattern

```javascript
// In server components
import { getAuthenticatedUser } from '@/lib/supabaseServer';

export default async function Page() {
  const { user, error } = await getAuthenticatedUser();
  if (!user) redirect('/');
}
```

### Client Creation

| Context | Factory Function | Notes |
|---------|------------------|-------|
| Server Components | `createServerSupabaseClient()` | Cookie-based, reads user session |
| API Routes | `requireAuth()` or `createServerSupabaseClient()` | Use requireAuth for protected routes |
| Service Operations | `getServiceClient()` | Bypasses RLS, use carefully |
| Bearer Token Auth | `createAuthenticatedClient(token)` | For API clients with tokens |

## Security Checklist

- [ ] All protected API routes use `requireAuth()`
- [ ] Server components use `getAuthenticatedUser()` or `getAuthenticatedUserWithProfile()`
- [ ] Middleware uses `getUser()`, not `getSession()`
- [ ] Service role key is never exposed to client
- [ ] Protected pages redirect unauthenticated users

## References

- `lib/supabaseServer.js` - Server-side client utilities
- `middleware.js` - Session refresh middleware
- Supabase docs: [Server-Side Auth with Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
