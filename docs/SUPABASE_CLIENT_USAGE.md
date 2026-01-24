# Supabase Client Usage Guide

> **PURPOSE**: Defines which Supabase client to use in each context.
> Using the wrong client causes auth failures, RLS bypasses, or runtime errors.

---

## Quick Reference

| Context | File | Import | Usage Count |
|---------|------|--------|-------------|
| Browser/Components | `lib/supabase.js` | `import { supabase }` | ~85 files |
| API Routes | `lib/supabaseServer.js` | `import { createRouteClient }` | ~44 files |
| Node.js Scripts | `lib/supabaseClient.js` | `import { getServiceSupabase }` | ~1 file |

---

## Client Details

### 1. `lib/supabase.js` — Browser/Client Components

**Use for**: React components, client-side hooks, browser code

```javascript
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// Client-side usage
const { data, error } = await supabase
  .from('cars')
  .select('*');
```

**Key Features**:
- Uses `@supabase/ssr` `createBrowserClient` in browser
- Cookie-based session persistence (works on iOS Safari, Android Chrome)
- Falls back to regular `createClient` in Node.js context
- Subject to Row Level Security (RLS)

**Exports**:
- `supabase` — The client instance
- `supabaseServiceRole` — Service role client (bypasses RLS)
- `isSupabaseConfigured` — Boolean check

---

### 2. `lib/supabaseServer.js` — API Routes & Server Components

**Use for**: API routes, server actions, route handlers

```javascript
import { createRouteClient, getServiceClient } from '@/lib/supabaseServer';

export async function POST(request) {
  // For authenticated requests (validates user cookies)
  const supabase = await createRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // For admin operations (bypasses RLS)
  const serviceClient = getServiceClient();
}
```

**Key Features**:
- Creates fresh client per request (stateless)
- Uses `cookies()` from Next.js for session validation
- `createRouteClient()` — User-authenticated client
- `getServiceClient()` — Service role client (bypasses RLS)
- `getPublicClient()` — Anon key client (subject to RLS)

**Exports**:
- `createRouteClient()` — Authenticated client for API routes
- `getServiceClient()` — Service role (admin) client
- `getPublicClient()` — Public anon-key client
- `isConfigured` — Boolean check

---

### 3. `lib/supabaseClient.js` — Standalone Node.js Scripts

**Use for**: Data migration scripts, cron jobs run outside Next.js, CLI tools

```javascript
import { getServiceSupabase } from './lib/supabaseClient.js';

const supabase = getServiceSupabase();
// Use for bulk operations, migrations, etc.
```

**Key Features**:
- Plain `@supabase/supabase-js` (no Next.js dependencies)
- Works in pure Node.js scripts
- Uses service role key by default (bypasses RLS)
- Singleton pattern (reuses connection)

**Note**: The name `supabaseClient.js` is potentially confusing — it's NOT for browser clients. Consider this the "scripts" client.

---

## Decision Tree

```
Need a Supabase client?
│
├─ Running in browser/React component?
│  └─ Use lib/supabase.js → import { supabase }
│
├─ Running in API route or server action?
│  ├─ Need user's session?
│  │  └─ Use lib/supabaseServer.js → createRouteClient()
│  │
│  └─ Need admin/service role access?
│     └─ Use lib/supabaseServer.js → getServiceClient()
│
└─ Running in standalone Node.js script?
   └─ Use lib/supabaseClient.js → getServiceSupabase()
```

---

## Common Patterns

### Pattern 1: API Route with Auth

```javascript
// app/api/example/route.js
import { createRouteClient } from '@/lib/supabaseServer';

export async function POST(request) {
  const supabase = await createRouteClient();
  
  // Validate user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // User's data (RLS applied)
  const { data } = await supabase
    .from('user_vehicles')
    .select('*')
    .eq('user_id', user.id);
    
  return Response.json({ data });
}
```

### Pattern 2: Admin-Only API Route

```javascript
// app/api/admin/example/route.js
import { createRouteClient, getServiceClient } from '@/lib/supabaseServer';

export async function POST(request) {
  const supabase = await createRouteClient();
  
  // Validate admin
  const { data: { user } } = await supabase.auth.getUser();
  // ... check admin role ...
  
  // Service role operations (bypasses RLS)
  const serviceClient = getServiceClient();
  const { data } = await serviceClient
    .from('sensitive_table')
    .select('*');
    
  return Response.json({ data });
}
```

### Pattern 3: Client Component

```javascript
// components/Example.jsx
'use client';

import { supabase } from '@/lib/supabase';

export default function Example() {
  const fetchData = async () => {
    const { data } = await supabase
      .from('cars')
      .select('slug, name')
      .limit(10);
    // ...
  };
  
  // ...
}
```

### Pattern 4: Migration Script

```javascript
// scripts/migrate-something.mjs
import { getServiceSupabase } from '../lib/supabaseClient.js';

const supabase = getServiceSupabase();

// Bulk operations with service role
const { data, error } = await supabase
  .from('cars')
  .update({ migrated: true })
  .is('migrated', null);
```

---

## Anti-Patterns to Avoid

### ❌ Using browser client in API routes

```javascript
// DON'T
import { supabase } from '@/lib/supabase';

export async function GET() {
  // This may work but won't have user's session
  const { data } = await supabase.from('table').select('*');
}

// DO
import { createRouteClient } from '@/lib/supabaseServer';

export async function GET() {
  const supabase = await createRouteClient();
  const { data } = await supabase.from('table').select('*');
}
```

### ❌ Importing supabaseServer in client components

```javascript
// DON'T - This will fail at runtime
'use client';
import { createRouteClient } from '@/lib/supabaseServer';

// DO
'use client';
import { supabase } from '@/lib/supabase';
```

### ❌ Using service role in browser

```javascript
// DON'T - This exposes service role key!
'use client';
import { supabaseServiceRole } from '@/lib/supabase';
// The key is only available server-side anyway, but don't try

// DO - Use regular client, let RLS handle security
'use client';
import { supabase } from '@/lib/supabase';
```

---

## Auth Validation

**Always use `getUser()` in API routes, not `getSession()`**:

```javascript
// ❌ getSession can be spoofed
const { data: { session } } = await supabase.auth.getSession();

// ✅ getUser validates the JWT server-side
const { data: { user } } = await supabase.auth.getUser();
```

---

## Troubleshooting

| Issue | Likely Cause | Fix |
|-------|--------------|-----|
| "No user session" in API route | Using browser client | Use `createRouteClient()` |
| RLS blocking admin operations | Need service role | Use `getServiceClient()` |
| Auth fails on Android | Using wrong client | Ensure browser uses `supabase.js` |
| Script can't connect | Missing env vars | Check `SUPABASE_SERVICE_ROLE_KEY` |

---

*Last Updated: 2026-01-22*
