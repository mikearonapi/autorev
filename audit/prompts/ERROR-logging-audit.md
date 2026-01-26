# ERROR LOGGING INFRASTRUCTURE AUDIT

> **Audit ID:** ERROR-001  
> **Category:** Infrastructure / Observability  
> **Priority:** High  
> **Status:** Error logging infrastructure exists and is mature

---

## EXECUTIVE SUMMARY

AutoRev has a **comprehensive error logging system** that captures errors from:
- **Server-side:** API routes, CRON jobs, external API calls, database operations
- **Client-side:** React errors, network failures, render crashes

**Key Stats:**
- **473 uses** of `withErrorLogging` across **196 API route files**
- **284 exported handlers** across **197 route files**
- **~69%** of handlers have error logging wrappers
- Errors stored in `application_errors` table with deduplication
- Critical errors sent to Discord

---

## ERROR LOGGING ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT SIDE                             │
├─────────────────────────────────────────────────────────────────┤
│  lib/errorLogger.js (client)                                    │
│  ├── logError() - general errors                                │
│  ├── ErrorLogger.apiError() - API failures                      │
│  ├── ErrorLogger.renderError() - React crashes                  │
│  └── ErrorLogger.networkTimeout() - network issues              │
│                                                                 │
│  Features:                                                      │
│  • Deduplication (5 min TTL)                                    │
│  • Throttling (5 errors/min max)                                │
│  • Noise filtering (timeouts, auth expected)                    │
│  • Client context (browser, OS, screen)                         │
│  • App version tracking                                         │
│                                                                 │
│  → Sends to /api/feedback                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         SERVER SIDE                             │
├─────────────────────────────────────────────────────────────────┤
│  lib/serverErrorLogger.js                                       │
│  ├── withErrorLogging() - API route wrapper                     │
│  ├── logServerError() - general server errors                   │
│  ├── logExternalApiError() - NHTSA, YouTube, etc.               │
│  ├── logDatabaseError() - Supabase errors                       │
│  ├── logAuthError() - auth failures                             │
│  ├── logCronError() - CRON failures (+ Discord)                 │
│  └── logSlowRequest() - performance tracking                    │
│                                                                 │
│  Features:                                                      │
│  • In-memory deduplication                                      │
│  • Severity classification                                      │
│  • Feature context extraction                                   │
│  • Request ID generation                                        │
│  • Stack trace capture                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATABASE                                 │
├─────────────────────────────────────────────────────────────────┤
│  application_errors table                                       │
│  ├── error_hash (deduplication key)                             │
│  ├── message, error_type, error_source                          │
│  ├── severity (blocking/major/minor)                            │
│  ├── page_url, api_route, feature_context                       │
│  ├── stack_trace, http_method, http_status                      │
│  ├── request_duration_ms, request_id                            │
│  ├── external_service, external_endpoint                        │
│  ├── app_version, occurrence_count                              │
│  └── first_seen, last_seen, resolved_at                         │
│                                                                 │
│  upsert_application_error() RPC - handles dedup                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        AGGREGATION                              │
├─────────────────────────────────────────────────────────────────┤
│  lib/errorAggregator.js                                         │
│  ├── aggregateError() - group similar errors                    │
│  ├── formatAggregateForDiscord() - format for notification      │
│  └── getAggregatesReadyToFlush() - get batched errors           │
│                                                                 │
│  Features:                                                      │
│  • User/session impact tracking                                 │
│  • Browser/device breakdown                                     │
│  • Page grouping                                                │
│  • Priority sorting                                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        NOTIFICATIONS                            │
├─────────────────────────────────────────────────────────────────┤
│  lib/discord.js                                                 │
│  ├── notifyCronFailure() - immediate for CRON                   │
│  └── notifyAggregatedError() - batched errors                   │
│                                                                 │
│  CRON: flush-error-aggregates (every 5 min)                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## FILES TO EXAMINE

### Core Error Libraries

| File | Purpose |
|------|---------|
| `lib/serverErrorLogger.js` | Server-side error logging (API, CRON, external) |
| `lib/errorLogger.js` | Client-side error logging |
| `lib/apiErrors.js` | Standardized API error responses |
| `lib/errorAggregator.js` | Error batching/aggregation |
| `lib/discord.js` | Discord notifications |

### Related CRON

| File | Purpose |
|------|---------|
| `app/api/cron/flush-error-aggregates/route.js` | Flush aggregated errors to Discord |

### Database

| File | Purpose |
|------|---------|
| `supabase/migrations/*application_errors*` | Table schema |

---

## CRITICAL: Read These First

Before making ANY changes:

1. `lib/serverErrorLogger.js` - Main server logging
2. `lib/errorLogger.js` - Client-side logging
3. `lib/apiErrors.js` - Error response patterns
4. Check Vercel logs for current error volume

---

## IMPORTANT: INVESTIGATE BEFORE FIX

Before changing ANY error logging:

1. ✅ Verify errors ARE being captured (check DB)
2. ✅ Verify Discord notifications work
3. ✅ Check deduplication is working
4. ❌ Do NOT disable logging without understanding impact
5. ❓ If errors not captured, check env vars

---

## AUDIT CHECKLIST

### A. Coverage Audit

**API Routes with `withErrorLogging`:**

- [ ] Count routes with wrapper: **~196 files**
- [ ] Count routes WITHOUT wrapper
- [ ] Identify unprotected routes
- [ ] Priority fix: high-traffic routes without logging

**Run this check:**
```bash
# Find routes WITHOUT withErrorLogging
for f in app/api/**/route.js; do
  if ! grep -q "withErrorLogging" "$f"; then
    echo "NO LOGGING: $f"
  fi
done
```

### B. Severity Classification

| Severity | When Used | Discord? |
|----------|-----------|----------|
| `blocking` | 500 errors, render failures, auth system down | ✅ Immediate |
| `major` | 4xx errors, external API failures | ✅ Batched |
| `minor` | Timeouts, rate limits | ❌ DB only |

- [ ] Severity rules match business impact
- [ ] Blocking errors trigger immediate alerts
- [ ] No spam from minor errors

### C. Deduplication

- [ ] Client: 5 min TTL deduplication
- [ ] Client: 5 errors/min throttle
- [ ] Server: In-memory deduplication
- [ ] Database: `error_hash` upsert logic
- [ ] Aggregator: Groups similar errors

### D. Noise Filtering (Client)

Current noise patterns filtered:
- [x] Network timeouts
- [x] Auth session missing (expected for logged-out)
- [x] Browser navigation cancelled
- [x] Chunk loading failures
- [x] External API errors (logged separately)

- [ ] Review noise patterns list
- [ ] Check false positives (real bugs filtered)
- [ ] Check false negatives (noise getting through)

### E. Feature Context

- [ ] Routes correctly map to features
- [ ] Feature breakdown useful in reports

**Current mapping:**
| Route contains | Feature |
|----------------|---------|
| `cars` | browse-cars |
| `events` | events |
| `ai-mechanic`, `al` | al |
| `vin` | garage |
| `users` | user-account |
| `cron` | cron-jobs |
| `parts` | tuning-shop |

### F. External API Errors

- [ ] NHTSA failures logged with `logExternalApiError`
- [ ] YouTube API failures logged
- [ ] Third-party service failures captured
- [ ] External endpoint tracked

### G. CRON Error Handling

- [ ] All CRON jobs use `logCronError`
- [ ] CRON failures go to Discord immediately
- [ ] `flush-error-aggregates` running every 5 min

### H. Database Table

- [ ] `application_errors` table exists
- [ ] `upsert_application_error` RPC works
- [ ] Indexes on frequently queried columns
- [ ] Old errors cleaned up (retention policy)

### I. Discord Notifications

- [ ] Discord webhook configured
- [ ] Notifications not spamming
- [ ] Critical errors visible
- [ ] Aggregation working

### J. Performance Impact

- [ ] Logging doesn't block request
- [ ] Async logging used
- [ ] Memory usage reasonable (in-memory caches)
- [ ] Cold start impact minimal

---

## SPECIFIC CHECKS

### Check 1: Find Routes Without Error Logging

```bash
# List all API routes
find app/api -name "route.js" | wc -l

# List routes with withErrorLogging
grep -rl "withErrorLogging" app/api/ | wc -l

# Find routes WITHOUT
for f in $(find app/api -name "route.js"); do
  if ! grep -q "withErrorLogging" "$f"; then
    echo "$f"
  fi
done
```

### Check 2: Verify Database Logging

```sql
-- Check recent errors
SELECT 
  error_type,
  error_source,
  severity,
  COUNT(*) as count,
  MAX(last_seen) as latest
FROM application_errors
WHERE last_seen > NOW() - INTERVAL '24 hours'
GROUP BY error_type, error_source, severity
ORDER BY count DESC;

-- Check deduplication working
SELECT 
  error_hash,
  message,
  occurrence_count,
  first_seen,
  last_seen
FROM application_errors
WHERE occurrence_count > 1
ORDER BY occurrence_count DESC
LIMIT 10;
```

### Check 3: Verify Discord Integration

```bash
# Check Discord webhook configured
grep -r "DISCORD" .env.local
grep -r "notifyCronFailure\|notifyAggregatedError" lib/

# Check flush cron is scheduled
grep "flush-error-aggregates" vercel.json
```

### Check 4: Client Error Flow

1. Trigger a client error (browser console):
```javascript
throw new Error('Test client error logging');
```

2. Check Network tab for `/api/feedback` call
3. Check database for new entry
4. Verify deduplication (throw same error again)

### Check 5: Server Error Flow

1. Hit an API route that should fail
2. Check Vercel logs for error
3. Check database for entry
4. Check Discord if severity is blocking

---

## GAP ANALYSIS

### Routes Likely Missing `withErrorLogging`

Based on the count difference (284 handlers vs 473 withErrorLogging uses), some routes may have the wrapper on only some handlers.

**Check these patterns:**
```bash
# Routes with GET but no wrapper on GET
grep -L "GET.*withErrorLogging\|withErrorLogging.*GET" app/api/**/route.js
```

### Critical Routes to Verify

| Route | Priority | Has Logging? |
|-------|----------|--------------|
| `/api/ai-mechanic` | High | ✅/❌ |
| `/api/checkout` | High | ✅/❌ |
| `/api/webhooks/stripe` | Critical | ✅/❌ |
| `/api/users/*/vehicles` | High | ✅/❌ |
| `/api/feedback` | High | ✅/❌ |

---

## TESTING SCENARIOS

### Test 1: API Error Capture

1. Create an intentional error in an API route
2. **Expected:** Error logged to database
3. **Verify:** Query `application_errors` table

### Test 2: CRON Error + Discord

1. Force a CRON job to fail
2. **Expected:** Error in DB + Discord notification
3. **Verify:** Check Discord channel

### Test 3: Client Error Capture

1. Throw error in React component
2. **Expected:** Error sent to `/api/feedback`
3. **Verify:** Check database for client error

### Test 4: Deduplication

1. Throw same error 10 times quickly
2. **Expected:** Only 1-2 logged (throttle + dedupe)
3. **Verify:** Check `occurrence_count`

### Test 5: Noise Filtering

1. Simulate network timeout error
2. **Expected:** NOT logged (filtered as noise)
3. **Verify:** No DB entry, local console log only

---

## AUTOMATED CHECKS

```bash
# 1. Count routes vs wrapped routes
echo "Total routes:"
find app/api -name "route.js" | wc -l

echo "Routes with withErrorLogging:"
grep -rl "withErrorLogging" app/api/ | wc -l

# 2. Find routes without any error handling
echo "Routes without error handling:"
for f in $(find app/api -name "route.js"); do
  if ! grep -q "withErrorLogging\|try.*catch" "$f"; then
    echo "  $f"
  fi
done

# 3. Check for console.error without logging
echo "console.error without proper logging:"
grep -rn "console.error" app/api/ | grep -v "withErrorLogging\|logServerError\|logCronError" | head -20

# 4. Verify CRON jobs log errors
echo "CRON jobs without logCronError:"
for f in app/api/cron/*/route.js; do
  if ! grep -q "logCronError" "$f"; then
    echo "  $f"
  fi
done

# 5. Check env vars
echo "Required env vars:"
grep -h "CRON_SECRET\|DISCORD\|SUPABASE" lib/serverErrorLogger.js lib/discord.js | grep -o 'process\.env\.[A-Z_]*' | sort -u
```

---

## DELIVERABLES

### 1. Coverage Report

| Category | Total | With Logging | % |
|----------|-------|--------------|---|
| API Routes | | | |
| CRON Jobs | 25 | | |
| Webhook Handlers | | | |

### 2. Gap Analysis

| Route | Missing | Priority | Action |
|-------|---------|----------|--------|
| | | | |

### 3. Configuration Verification

| Config | Status | Notes |
|--------|--------|-------|
| CRON_SECRET | ✅/❌ | |
| DISCORD_WEBHOOK_URL | ✅/❌ | |
| SUPABASE_SERVICE_ROLE_KEY | ✅/❌ | |

### 4. Issues Found

| Severity | Issue | File | Fix |
|----------|-------|------|-----|
| | | | |

---

## VERIFICATION

- [ ] All API routes have `withErrorLogging`
- [ ] All CRON jobs have `logCronError`
- [ ] Database receives errors
- [ ] Discord receives critical errors
- [ ] Deduplication working
- [ ] Noise filtering appropriate
- [ ] No performance impact

---

## SUCCESS CRITERIA

| # | Criterion |
|---|-----------|
| 1 | 100% API routes have error logging |
| 2 | All CRON jobs log failures |
| 3 | Errors visible in database |
| 4 | Critical errors → Discord |
| 5 | Deduplication prevents spam |
| 6 | No false negatives (real bugs missed) |
| 7 | Documentation complete |

---

## OUTPUT FORMAT

```
🚨 ERROR LOGGING AUDIT COMPLETE

**Coverage:**
- API Routes: X/Y (Z%)
- CRON Jobs: X/Y (Z%)
- Webhook Handlers: X/Y (Z%)

**Gaps Found:**
1. [Route] missing withErrorLogging
2. [CRON] missing logCronError
...

**Database Status:**
- Errors in last 24h: X
- Unique error types: Y
- Deduplication working: ✅/❌

**Discord Status:**
- Webhook configured: ✅/❌
- Last notification: [timestamp]

**Recommendations:**
1. Add withErrorLogging to [routes]
2. Add logCronError to [crons]
...
```

---

## RECOMMENDATIONS

### Immediate Actions

1. **Add `withErrorLogging` to any unprotected routes**
   - Especially `/api/webhooks/stripe` (critical)
   - Any routes handling payments or auth

2. **Verify CRON jobs use `logCronError`**
   - Check all 25 CRON jobs
   - Add Discord notification for failures

3. **Set up error dashboard**
   - Query `application_errors` regularly
   - Track error trends over time

### Future Improvements

1. **Consider Sentry/LogRocket integration** for richer error context
2. **Add error budget monitoring** (SLI/SLO)
3. **Create automated alerts** for error spikes
4. **Add request tracing** (correlation IDs across services)

---

## AUDIT EXECUTION LOG

| Date | Auditor | Status | Issues Fixed | Notes |
|------|---------|--------|--------------|-------|
| | | | | |

---

*Audit prompt generated: January 25, 2026*  
*Part of AutoRev Systematic Audit Suite*
