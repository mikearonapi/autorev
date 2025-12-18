# AutoRev Scalability Guide

> Infrastructure scaling strategies and intervention points
>
> **Last Updated:** December 18, 2024

---

## Current Infrastructure

| Layer | Technology | Tier/Limits |
|-------|------------|-------------|
| **Hosting** | Vercel | Pro recommended at scale |
| **Database** | Supabase PostgreSQL | **Pro: 500 direct connections** ✅ |
| **Connection Pooler** | PgBouncer (Supabase) | **Available - enable for 1000s of connections** |
| **Vector Search** | pgvector | Scales with DB |
| **AI** | Anthropic Claude | API rate limits apply |
| **Auth** | Supabase Auth | Scales with DB |
| **Images** | Vercel Blob | Pay per usage |
| **Cron** | Vercel Cron | Pro: longer timeouts |

---

## Scaling Tiers

### 🟢 Tier 1: 10-100 Users (Current)

**Status:** Fully supported with current setup.

No intervention required.

---

### 🟡 Tier 2: 100-1,000 Users

**Potential Issues:**
- Database connection spikes during traffic bursts
- Minimal API response caching

**Required Actions:**

| Action | Priority | Status |
|--------|----------|--------|
| Add Cache-Control headers to static endpoints | P0 | ✅ Done |
| Monitor Supabase connection usage | P1 | ⬜ TODO |
| Add basic error rate monitoring | P1 | ⬜ TODO |

---

### 🟠 Tier 3: 1,000-10,000 Users

**Potential Issues:**
- Connection spikes during traffic bursts (500 direct limit)
- AL (AI) API costs explosion
- No rate limiting on public endpoints
- Cold start latency under load

**Required Actions:**

| Action | Priority | Estimated Cost | Status |
|--------|----------|----------------|--------|
| Supabase Pro | P0 | $25/mo | ✅ Done |
| **Enable Supabase PgBouncer** | P0 | Free | ⬜ TODO |
| **Add API rate limiting** | P0 | ~$10/mo (Upstash) | ⬜ TODO |
| Implement AL request throttling | P1 | Free | ⬜ TODO |
| Add Redis cache layer | P2 | ~$25/mo | ⬜ TODO |

#### Enable Supabase Connection Pooler

Update your database connection to use the pooler endpoint:

```bash
# Before (direct connection)
SUPABASE_DB_URL=postgresql://postgres:[pw]@db.[ref].supabase.co:5432/postgres

# After (pooler - supports 1000s of connections)
SUPABASE_DB_URL=postgresql://postgres:[pw]@db.[ref].supabase.co:6543/postgres?pgbouncer=true
```

#### Add Rate Limiting (Recommended Setup)

1. Install Upstash:
```bash
npm install @upstash/ratelimit @upstash/redis
```

2. Create rate limiter utility:
```javascript
// lib/rateLimit.js
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export const rateLimiters = {
  // Public API: 100 requests per minute per IP
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    prefix: 'ratelimit:api',
  }),
  
  // AL (AI) endpoint: 10 requests per minute per user
  al: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    prefix: 'ratelimit:al',
  }),
  
  // VIN decode: 5 per minute per IP
  vin: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    prefix: 'ratelimit:vin',
  }),
};

export async function checkRateLimit(limiter, identifier) {
  const { success, limit, remaining, reset } = await limiter.limit(identifier);
  return { success, limit, remaining, reset };
}
```

3. Apply to routes:
```javascript
// In API route handlers:
import { rateLimiters, checkRateLimit } from '@/lib/rateLimit';

export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const { success, remaining } = await checkRateLimit(rateLimiters.al, ip);
  
  if (!success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { status: 429, headers: { 'X-RateLimit-Remaining': remaining } }
    );
  }
  // ... rest of handler
}
```

---

### 🔴 Tier 4: 10,000-100,000 Users

**Required Actions:**

| Action | Priority | Estimated Cost |
|--------|----------|----------------|
| Migrate to Supabase Pro+ or dedicated Postgres | P0 | $100+/mo |
| Implement read replicas | P0 | ~$100/mo |
| Add CDN for images (Cloudflare) | P1 | ~$20/mo |
| Queue system for background jobs (Inngest/Trigger.dev) | P1 | ~$50/mo |
| Consider edge functions for latency-critical paths | P2 | Variable |
| Database query optimization audit | P1 | Engineering time |

---

## Caching Strategy

### Current Implementation

| Route | Cache Duration | Status |
|-------|----------------|--------|
| `GET /api/cars` | 5 min (s-maxage=300) | ✅ |
| `GET /api/cars/[slug]/efficiency` | 1 hour | ✅ |
| `GET /api/cars/[slug]/safety-ratings` | 1 hour | ✅ |
| `GET /api/events/types` | 24 hours | ✅ |
| `GET /api/stats` | 5 min | ✅ |
| `GET /api/al/stats` | 5 min | ✅ |

### Recommended Additions

| Route | Recommended Cache | Why |
|-------|-------------------|-----|
| `GET /api/cars/[slug]/maintenance` | 1 hour | Maintenance specs rarely change |
| `GET /api/cars/[slug]/lap-times` | 1 hour | Track data is static |
| `GET /api/cars/[slug]/dyno` | 1 hour | Dyno data is static |
| `GET /api/cars/[slug]/recalls` | 1 hour | Updates weekly via cron |
| `GET /api/parts/search` | 5 min | Inventory changes slowly |

### Cache-Control Header Reference

```javascript
// Static data that rarely changes (event types, encyclopedia)
'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800' // 24h cache, 48h stale

// Semi-static data (car specs, safety ratings)  
'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' // 1h cache, 2h stale

// Frequently accessed lists (cars, events)
'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' // 5min cache, 10min stale

// User-specific or real-time data
'Cache-Control': 'private, no-cache' // No caching

// Health check
'Cache-Control': 'no-store, no-cache, must-revalidate' // Never cache
```

---

## Database Connection Management

### Current Setup (Good ✅)

```javascript
// lib/supabaseServer.js - Singleton pattern
let _publicClient = null;

export function getPublicClient() {
  if (!_publicClient) {
    _publicClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _publicClient;
}
```

### Why This Matters

- ~~Supabase free tier: 60 concurrent connections~~
- **Supabase Pro tier: 500 concurrent connections** ✅ (current)
- Vercel serverless can spawn many function instances
- Each instance gets its own singleton (one connection)
- At high traffic, 500 connections can still be exhausted
- **Solution:** Enable PgBouncer for connection pooling (supports 1000s)

### Connection Pooler Setup

1. Go to Supabase Dashboard → Settings → Database
2. Copy the "Connection pooling" connection string
3. Use port `6543` instead of `5432`
4. Add `?pgbouncer=true` to connection string

---

## External API Dependencies

| Service | Rate Limits | Mitigation |
|---------|-------------|------------|
| **Anthropic Claude** | Varies by tier | Queue requests, circuit breaker |
| **OpenAI Embeddings** | TPM limits | Batch embeddings, cache results |
| **NHTSA** | None (government) | Cache responses |
| **EPA** | None (government) | Cache responses |
| **YouTube Data API** | 10,000 units/day | Track quota usage |

### Claude API Protection

```javascript
// Recommended: Add circuit breaker pattern
const CLAUDE_FAILURE_THRESHOLD = 3;
const CLAUDE_RESET_TIMEOUT = 30000; // 30 seconds

let claudeFailures = 0;
let circuitOpen = false;
let circuitResetTime = 0;

async function callClaudeWithCircuitBreaker(params) {
  if (circuitOpen && Date.now() < circuitResetTime) {
    throw new Error('Claude API circuit breaker is open');
  }
  
  try {
    const result = await callClaude(params);
    claudeFailures = 0;
    circuitOpen = false;
    return result;
  } catch (err) {
    claudeFailures++;
    if (claudeFailures >= CLAUDE_FAILURE_THRESHOLD) {
      circuitOpen = true;
      circuitResetTime = Date.now() + CLAUDE_RESET_TIMEOUT;
    }
    throw err;
  }
}
```

---

## Monitoring Checklist

### P0 - Critical Metrics

- [ ] Supabase connection count (alert at 50/60)
- [ ] API error rates (alert at >1%)
- [ ] Response time p95 (alert at >3s)
- [ ] Claude API failures

### P1 - Important Metrics  

- [ ] Database query duration
- [ ] Cache hit rates
- [ ] Rate limit trigger count
- [ ] Monthly AI spend

### Recommended Tools

| Tool | Purpose | Cost |
|------|---------|------|
| Vercel Analytics | Web vitals, API perf | Included |
| Sentry | Error tracking | Free tier available |
| Supabase Dashboard | DB metrics | Included |
| Upstash Console | Rate limit metrics | Included |

---

## Emergency Procedures

### Database Connection Exhaustion

1. Check Supabase Dashboard → Database → Connection Count
2. If at limit, identify high-connection routes via logs
3. Temporary fix: Restart Vercel deployment (clears function instances)
4. Permanent fix: Enable PgBouncer or upgrade Supabase tier

### AL (AI) Cost Spike

1. Check `/api/al/stats` for usage metrics
2. Identify high-usage users in `al_usage_logs`
3. Temporary fix: Reduce `maxResponseTokens` in `lib/alConfig.js`
4. Permanent fix: Implement stricter rate limiting

### API Overload

1. Check Vercel Analytics for traffic spike
2. Identify affected routes
3. Temporary fix: Add aggressive caching
4. Permanent fix: Implement rate limiting + queue system

---

## Cost Projections

| Users | Vercel | Supabase | Upstash | Claude | Total/mo |
|-------|--------|----------|---------|--------|----------|
| 100 | $0 | $25 ✅ | $0 | ~$10 | ~$35 |
| 1,000 | $20 | $25 ✅ | $10 | ~$50 | ~$105 |
| 10,000 | $20 | $100* | $25 | ~$300 | ~$445 |
| 100,000 | $150+ | $500+ | $100 | ~$2,000 | ~$2,750+ |

*Claude costs assume average 2-3 messages per user per month*
*\* Supabase Pro ($25) may need upgrade to Team ($599) at ~10K+ concurrent users*

---

## Quick Reference Commands

```bash
# Check Supabase connection count
# Dashboard → Settings → Database → Active connections

# Monitor Vercel function execution
# Dashboard → Project → Functions → Execution

# Check API response times
# Dashboard → Project → Analytics → API

# View rate limit metrics (if using Upstash)
# Upstash Console → Redis → Metrics
```

---

*See [ARCHITECTURE.md](ARCHITECTURE.md) for system design and [API.md](API.md) for route documentation.*
