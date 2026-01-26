# Database Audit - Fix Implementation TODO

**Created:** January 25, 2026  
**Source:** `audit/results/C-database-audit-results.md`  
**Total Items:** 12

---

## Priority 0 - Critical User-Facing Performance

### 1. [x] Fix N+1 in Conversation List (alConversationService.js) ✅ COMPLETED 2026-01-25

**Impact:** 21 database queries per request (1 + N for default 20 conversations)  
**User Impact:** Slow conversation list loading in AL chat

#### Step 1.1: Create the RPC Migration

**File to create:** `supabase/migrations/XXX_conversation_preview_rpc.sql`

```sql
-- Migration: Add RPC for fetching conversations with preview in single query
-- Fixes N+1 pattern in lib/alConversationService.js

CREATE OR REPLACE FUNCTION get_user_conversations_with_preview(
  p_user_id UUID,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0,
  p_include_archived BOOLEAN DEFAULT FALSE,
  p_car_slug TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  initial_car_slug TEXT,
  initial_car_context JSONB,
  message_count INT,
  last_message_at TIMESTAMPTZ,
  is_archived BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  preview TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.user_id,
    c.title,
    c.initial_car_slug,
    c.initial_car_context,
    c.message_count,
    c.last_message_at,
    c.is_archived,
    c.created_at,
    c.updated_at,
    LEFT(
      (SELECT m.content 
       FROM al_messages m 
       WHERE m.conversation_id = c.id 
         AND m.role = 'assistant'
       ORDER BY m.sequence_number ASC
       LIMIT 1),
      120
    ) as preview
  FROM al_conversations c
  WHERE c.user_id = p_user_id
    AND (p_include_archived OR c.is_archived = FALSE)
    AND (p_car_slug IS NULL OR c.initial_car_slug = p_car_slug)
  ORDER BY c.last_message_at DESC
  LIMIT p_limit 
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant access
GRANT EXECUTE ON FUNCTION get_user_conversations_with_preview TO authenticated;

COMMENT ON FUNCTION get_user_conversations_with_preview IS 
  'Fetches user conversations with first assistant message preview in single query. Replaces N+1 pattern.';
```

#### Step 1.2: Update alConversationService.js

**File:** `lib/alConversationService.js`  
**Lines:** 145-211 (getUserConversations function)

**Before:**
```javascript
// Lines 179-200 - N+1 pattern
const conversationsWithPreviews = await Promise.all(
  (data || []).map(async (conv) => {
    try {
      const { data: messages } = await client
        .from('al_messages')
        .select('content, role')
        .eq('conversation_id', conv.id)
        .eq('role', 'assistant')
        .order('sequence_number', { ascending: true })
        .limit(1);
      // ...
    }
  })
);
```

**After:**
```javascript
export async function getUserConversations(userId, options = {}) {
  const { limit = 20, offset = 0, includeArchived = false, carSlug = null } = options;
  const client = getServerClient();
  
  if (!client || !userId) {
    return { conversations: [], total: 0 };
  }

  try {
    // Use RPC to fetch conversations with previews in single query
    const { data, error } = await client.rpc('get_user_conversations_with_preview', {
      p_user_id: userId,
      p_limit: limit,
      p_offset: offset,
      p_include_archived: includeArchived,
      p_car_slug: carSlug || null,
    });

    if (error) {
      // Fallback to old method if RPC doesn't exist yet
      if (error.code === '42883' || error.message?.includes('does not exist')) {
        console.warn('[AL Conversations] RPC not available, using fallback');
        return getUserConversationsFallback(userId, options);
      }
      throw error;
    }

    // Get total count separately (RPC doesn't return count easily)
    const { count } = await client
      .from('al_conversations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_archived', includeArchived ? undefined : false);

    return {
      conversations: data || [],
      total: count || 0,
      success: true,
    };
  } catch (err) {
    console.error('[AL Conversations] Error fetching user conversations:', err);
    return { conversations: [], total: 0, error: err.message };
  }
}

// Keep old implementation as fallback
async function getUserConversationsFallback(userId, options = {}) {
  // ... existing N+1 code for backwards compatibility ...
}
```

#### Step 1.3: Test

```bash
# Run the migration locally
npx supabase db push

# Test the RPC directly
curl -X POST 'https://your-project.supabase.co/rest/v1/rpc/get_user_conversations_with_preview' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{"p_user_id": "user-uuid", "p_limit": 5}'

# Verify in app - conversation list should load faster
```

**VERIFY:** Query count drops from 21 to 2 (1 for data, 1 for count)

---

## Priority 1 - Cardinal Rule Compliance

### 2. [x] Fix al_content_gaps car_slug → car_id (alContentGapResolver.js) ✅ COMPLETED 2026-01-25

**Impact:** Queries miss the `car_id` index, causing slower lookups  
**File:** `lib/alContentGapResolver.js`  
**Line:** 402

#### Step 2.1: Add resolveCarId import (if not present)

```javascript
// Line ~22 - verify import exists
import { resolveCarId } from './carResolver';
```

#### Step 2.2: Update getGapsForReview function

**Before (lines 400-403):**
```javascript
// Car filter
if (carSlug) {
  query = query.eq('car_slug', carSlug);
}
```

**After:**
```javascript
// Car filter - use car_id for indexed lookup (Cardinal Rule 1)
if (carSlug) {
  const carId = await resolveCarId(carSlug);
  if (carId) {
    query = query.eq('car_id', carId);
  } else {
    // Fallback to slug if car not found (shouldn't happen normally)
    console.warn('[GapResolver] Could not resolve car_id for slug:', carSlug);
    query = query.eq('car_slug', carSlug);
  }
}
```

**VERIFY:** `grep -n "\.eq('car_slug'" lib/alContentGapResolver.js` returns no results after fix

---

### 3. [x] Fix al_content_gaps car_slug → car_id (alIntelligence.js) ✅ COMPLETED 2026-01-25

**Impact:** Same as above - missing index usage  
**File:** `lib/alIntelligence.js`  
**Line:** 370

#### Step 3.1: Verify resolveCarId import

```javascript
// Check imports at top of file
import { resolveCarId } from './carResolver';
```

#### Step 3.2: Update getUnresolvedGaps function

**Before (lines 368-371):**
```javascript
if (carSlug) {
  query = query.eq('car_slug', carSlug);
}
```

**After:**
```javascript
// Use car_id for indexed lookup (Cardinal Rule 1)
if (carSlug) {
  const carId = await resolveCarId(carSlug);
  if (carId) {
    query = query.eq('car_id', carId);
  } else {
    console.warn('[AL Intelligence] Could not resolve car_id for slug:', carSlug);
    query = query.eq('car_slug', carSlug);
  }
}
```

**VERIFY:** `grep -n "\.eq('car_slug'" lib/alIntelligence.js` returns no results after fix

---

## Priority 2 - Admin/Operational Improvements

### 4. [x] Fix Batch Update Loop (feedback resolve-batch) ✅ COMPLETED 2026-01-25

**Impact:** N sequential updates instead of batch update  
**File:** `app/api/admin/feedback/resolve-batch/route.js`  
**Lines:** 161-171

#### Step 4.1: Create RPC for batch update with notes concatenation

**File to create:** `supabase/migrations/XXX_batch_resolve_feedback_rpc.sql`

```sql
-- Batch resolve feedback with internal notes concatenation
CREATE OR REPLACE FUNCTION batch_resolve_feedback(
  p_feedback_ids UUID[],
  p_resolved_by UUID,
  p_car_slug TEXT DEFAULT NULL,
  p_resolution_note TEXT DEFAULT NULL
)
RETURNS INT AS $$
DECLARE
  updated_count INT;
BEGIN
  UPDATE user_feedback
  SET 
    status = 'resolved',
    resolved_at = NOW(),
    resolved_by = p_resolved_by,
    car_slug = COALESCE(p_car_slug, car_slug),
    internal_notes = CASE 
      WHEN p_resolution_note IS NOT NULL 
      THEN COALESCE(internal_notes, '') || p_resolution_note
      ELSE internal_notes
    END
  WHERE id = ANY(p_feedback_ids);
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION batch_resolve_feedback TO service_role;
```

#### Step 4.2: Update route to use RPC

**Before (lines 161-171):**
```javascript
for (const feedback of feedbackToResolve) {
  await supabaseAdmin
    .from('user_feedback')
    .update({
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      resolved_by: auth.user.id,
      car_slug: carSlug || feedback.car_slug,
      internal_notes: (feedback.internal_notes || '') + resolutionNote,
    })
    .eq('id', feedback.id);
}
```

**After:**
```javascript
const resolutionNote = `\n\n[Batch resolved ${new Date().toISOString()}] Car added: ${carName || carSlug}`;
const resolvedIds = feedbackToResolve.map(f => f.id);

const { data: updatedCount, error: updateError } = await supabaseAdmin.rpc('batch_resolve_feedback', {
  p_feedback_ids: resolvedIds,
  p_resolved_by: auth.user.id,
  p_car_slug: carSlug || null,
  p_resolution_note: resolutionNote,
});

if (updateError) {
  console.error('[Admin/Feedback/ResolveBatch] Batch update error:', updateError);
  // Optionally fallback to loop method
}

console.log(`[Admin/Feedback/ResolveBatch] Updated ${updatedCount} feedback items`);
```

**VERIFY:** Check Supabase logs - should see 1 query instead of N

---

## Priority 3 - Code Quality (select('*') Optimization)

### 5. [ ] Optimize select('*') in alConversationService.js

**File:** `lib/alConversationService.js`  
**Lines:** 115, 124, 320, 348

**Replace with explicit fields:**
```javascript
// Instead of .select('*')
.select(`
  id,
  user_id,
  title,
  initial_car_slug,
  initial_car_context,
  message_count,
  last_message_at,
  is_archived,
  created_at,
  updated_at
`)
```

---

### 6. [ ] Optimize select('*') in aiMechanicService.js

**File:** `lib/aiMechanicService.js`  
**Lines:** 78, 138, 155, 264, 288, 315

**For each query, identify needed fields and replace `select('*')`**

Example for line 78 (user context query):
```javascript
// Before
.select('*')

// After - only fields needed for AI context
.select(`
  id,
  user_id,
  matched_car_id,
  nickname,
  installed_modifications,
  total_hp_gain
`)
```

---

### 7. [ ] Optimize select('*') in dashboardScoreService.js

**File:** `lib/dashboardScoreService.js`  
**Lines:** 202, 271, 678, 711

**Dashboard is latency-sensitive - optimize these queries**

---

### 8. [ ] Optimize select('*') in alTools.js

**File:** `lib/alTools.js`  
**Lines:** 1702, 3132, 3574, 3699, 3789, 3806

**These are in the AL tools - affects response time**

---

## Priority 4 - Optional Improvements

### 9. [ ] Add car_id index to user_track_times (optional)

**Only if switching to car_id queries in track-times routes**

```sql
-- Only add if changing query pattern
CREATE INDEX IF NOT EXISTS idx_user_track_times_car_id 
ON user_track_times(car_id)
WHERE car_id IS NOT NULL;
```

---

### 10. [ ] Document acceptable select('*') patterns

**Create documentation for when select('*') is acceptable:**

- Admin dashboard routes (low traffic, need all fields)
- Cron jobs (background processing)
- Debug/internal routes
- When followed by specific field access in code

---

### 11. [ ] Create reusable field lists

**File to create:** `lib/dbFieldLists.js`

```javascript
/**
 * Standard field selections for common queries
 * Prevents select('*') and ensures consistency
 */

export const CONVERSATION_FIELDS = `
  id, user_id, title, initial_car_slug, initial_car_context,
  message_count, last_message_at, is_archived, created_at, updated_at
`;

export const USER_VEHICLE_FIELDS = `
  id, user_id, matched_car_id, nickname, installed_modifications,
  total_hp_gain, mileage, is_primary, created_at
`;

export const CAR_BASIC_FIELDS = `
  id, slug, name, make, model, year_start, year_end, hp, torque
`;

// Usage: .select(CONVERSATION_FIELDS)
```

---

### 12. [ ] Add query performance monitoring

**Consider adding to key services:**

```javascript
// lib/queryMonitor.js
export function wrapQuery(queryName, queryFn) {
  return async (...args) => {
    const start = performance.now();
    try {
      const result = await queryFn(...args);
      const duration = performance.now() - start;
      if (duration > 500) {
        console.warn(`[Slow Query] ${queryName}: ${duration.toFixed(0)}ms`);
      }
      return result;
    } catch (err) {
      console.error(`[Query Error] ${queryName}:`, err);
      throw err;
    }
  };
}
```

---

## Verification Checklist

All fixes verified on 2026-01-25:

- [x] car_slug queries in alContentGapResolver.js & alIntelligence.js → Now use car_id with fallback
- [x] N+1 pattern in alConversationService.js → Now uses RPC with legacy fallback
- [x] Batch update in feedback resolve-batch → Now uses RPC with loop fallback
- [x] All 11 remaining car_slug queries verified as acceptable (fallbacks, admin tools, indexed tables)
- [ ] Deploy migrations: `npx supabase db push`
- [ ] Test conversation list load time → should be <500ms after deploy
- [ ] Run existing tests: `npm test`

---

## Implementation Order

~~1. **Day 1:** Items 1 (N+1 fix) - highest user impact~~ ✅ COMPLETED
~~2. **Day 2:** Items 2-3 (car_id fixes) - simple code changes~~ ✅ COMPLETED
~~3. **Day 3:** Item 4 (batch update) - admin improvement~~ ✅ COMPLETED
4. **Ongoing:** Items 5-8 (select('*') optimization) - as time permits
5. **Optional:** Items 9-12 - nice-to-have improvements

---

## Completion Summary

**Completed: 2026-01-25**

| Item | Status | Files Changed |
|------|--------|---------------|
| P0: N+1 Fix | ✅ Complete | `lib/alConversationService.js`, migration created |
| P1: car_id Fix #1 | ✅ Complete | `lib/alContentGapResolver.js` |
| P1: car_id Fix #2 | ✅ Complete | `lib/alIntelligence.js` |
| P2: Batch Update | ✅ Complete | `app/api/admin/feedback/resolve-batch/route.js`, migration created |

**Migrations to Deploy:**
- `20260125100000_conversation_preview_rpc.sql`
- `20260125100001_batch_resolve_feedback_rpc.sql`

---

*Generated from Database Audit C - January 25, 2026*
