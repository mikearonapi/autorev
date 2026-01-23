# API Routes Audit Report

**Generated:** 2026-01-22
**Scope:** All files in `app/api/` directory
**Total Routes:** 175 route.js files

---

## Route Categories

### 1. Admin Routes (32 routes)
`/api/admin/*`

| Route | Methods | Purpose |
|-------|---------|---------|
| `/admin/advanced-analytics` | GET | Advanced analytics data |
| `/admin/ai-cost-summary` | GET | AI cost summary |
| `/admin/al-evaluations` | GET | AL evaluation results |
| `/admin/al-trends` | GET | AL usage trends |
| `/admin/al-usage` | GET | AL usage data |
| `/admin/alerts` | GET/POST | System alerts |
| `/admin/auth-cleanup` | POST | Auth cleanup tasks |
| `/admin/beta-dashboard` | GET | Beta dashboard data |
| `/admin/content-growth` | GET | Content growth metrics |
| `/admin/dashboard` | GET | Admin dashboard |
| `/admin/data-coverage` | GET | Data coverage report |
| `/admin/emails` | GET/POST | Email management |
| `/admin/emails/preview` | GET | Preview email |
| `/admin/export` | GET | Export data |
| `/admin/external-costs` | GET | External API costs |
| `/admin/feedback/resolve` | POST | Resolve feedback |
| `/admin/feedback/resolve-batch` | POST | Batch resolve feedback |
| `/admin/financials` | GET | Financial data |
| `/admin/insights` | GET | Admin insights |
| `/admin/marketing-analytics` | GET | Marketing analytics |
| `/admin/parts-quality` | GET | Parts quality scores |
| `/admin/retention` | GET | User retention data |
| `/admin/run-action` | POST | Run admin action |
| `/admin/site-analytics` | GET | Site analytics |
| `/admin/stripe` | GET | Stripe dashboard data |
| `/admin/system-health` | GET | System health status |
| `/admin/usage` | GET | Usage statistics |
| `/admin/users` | GET | User management |
| `/admin/vercel-status` | GET | Vercel deployment status |
| `/admin/web-vitals` | GET | Web vitals metrics |

**Observation:** Well-organized admin routes under `/admin/` prefix.

---

### 2. Car Data Routes (20 routes)
`/api/cars/*`

| Route | Methods | Purpose |
|-------|---------|---------|
| `/cars` | GET | List all cars |
| `/cars/expert-reviewed` | GET | Cars with expert reviews |
| `/cars/[slug]/ai-context` | GET | AI context for car |
| `/cars/[slug]/dyno` | GET | Dyno runs |
| `/cars/[slug]/efficiency` | GET | Fuel efficiency |
| `/cars/[slug]/enriched` | GET | **Bundled enriched data** |
| `/cars/[slug]/expert-consensus` | GET | Expert consensus summary |
| `/cars/[slug]/expert-reviews` | GET | Expert reviews list |
| `/cars/[slug]/factory-options` | GET | Factory options |
| `/cars/[slug]/fitments` | GET | Part fitments |
| `/cars/[slug]/fuel-economy` | GET | Fuel economy data |
| `/cars/[slug]/issues` | GET | Known issues |
| `/cars/[slug]/lap-times` | GET | Lap times |
| `/cars/[slug]/maintenance` | GET | Maintenance schedule |
| `/cars/[slug]/manual-data` | GET | Manual/owner data |
| `/cars/[slug]/market-value` | GET | Market value data |
| `/cars/[slug]/price-by-year` | GET | Price history |
| `/cars/[slug]/pricing` | GET | Pricing info |
| `/cars/[slug]/recalls` | GET | Recall data |
| `/cars/[slug]/safety` | GET | Safety data |
| `/cars/[slug]/safety-ratings` | GET | Safety ratings |

**Potential Optimization:** 
- `/cars/[slug]/enriched` bundles multiple data types
- Consider if individual routes are still needed or should all use bundle

---

### 3. User Routes (18 routes)
`/api/users/[userId]/*`

| Route | Methods | Purpose |
|-------|---------|---------|
| `/users/[userId]/account` | GET/PATCH/DELETE | Account management |
| `/users/[userId]/al-conversations` | GET/POST | AL conversations |
| `/users/[userId]/al-conversations/[id]` | GET/DELETE | Single conversation |
| `/users/[userId]/al-conversations/[id]/share` | POST | Share conversation |
| `/users/[userId]/al-credits` | GET | AL credit balance |
| `/users/[userId]/car-images` | GET/POST | User car images |
| `/users/[userId]/clear-data` | DELETE | Clear user data |
| `/users/[userId]/dashboard` | GET | User dashboard data |
| `/users/[userId]/garage` | GET | User garage summary |
| `/users/[userId]/insights` | GET | Personalized insights |
| `/users/[userId]/onboarding` | GET/POST | Onboarding status |
| `/users/[userId]/onboarding/dismiss` | POST | Dismiss onboarding |
| `/users/[userId]/preferences` | GET/PATCH | User preferences |
| `/users/[userId]/saved-events` | GET/POST/DELETE | Saved events |
| `/users/[userId]/track-times` | GET/POST | Track times |
| `/users/[userId]/track-times/analyze` | POST | Analyze track times |
| `/users/[userId]/vehicles/[id]` | GET/PATCH/DELETE | Single vehicle |
| `/users/[userId]/vehicles/[id]/modifications` | GET/POST | Vehicle mods |
| `/users/[userId]/vehicles/[id]/custom-specs` | GET/PATCH | Custom specs |
| `/users/[userId]/vehicles/[id]/score` | GET | Vehicle score |
| `/users/[userId]/vehicles/reorder` | POST | Reorder vehicles |

**Question:** Is `/users/[userId]/garage` redundant with vehicle endpoints?

---

### 4. Analytics Routes (8 routes)
`/api/analytics/*`

| Route | Purpose |
|-------|---------|
| `/analytics/attribution` | Attribution tracking |
| `/analytics/click` | Click tracking |
| `/analytics/engagement` | Engagement metrics |
| `/analytics/event` | Custom events |
| `/analytics/feature` | Feature usage |
| `/analytics/goal` | Goal conversions |
| `/analytics/search` | Search analytics |
| `/analytics/track` | General tracking |

**Observation:** Many tracking endpoints. Could potentially be consolidated.

---

### 5. Community Routes (10 routes)
`/api/community/*`

| Route | Purpose |
|-------|---------|
| `/community/builds` | Community builds list |
| `/community/builds/[slug]` | Single build |
| `/community/feed/recalculate` | Recalculate feed |
| `/community/feed/track` | Track feed interaction |
| `/community/leaderboard` | Community leaderboard |
| `/community/posts` | Community posts |
| `/community/posts/[id]/comments` | Post comments |
| `/community/posts/[id]/like` | Like post |

---

### 6. CRON Routes (24 routes)
`/api/cron/*`

| Route | Purpose | Schedule |
|-------|---------|----------|
| `/cron/al-evaluation` | Run AL evaluations | |
| `/cron/al-optimization` | Optimize AL | |
| `/cron/article-images` | Process article images | |
| `/cron/article-publish` | Publish articles | |
| `/cron/article-qa` | QA articles | |
| `/cron/article-research` | Research articles | |
| `/cron/article-write` | Write articles | |
| `/cron/calculate-engagement` | Calculate engagement | |
| `/cron/daily-digest` | Send daily digest | |
| `/cron/daily-metrics` | Calculate daily metrics | |
| `/cron/flush-error-aggregates` | Flush errors | |
| `/cron/forum-scrape` | Scrape forums | |
| `/cron/process-email-queue` | Process email queue | |
| `/cron/process-scrape-jobs` | Process scrape jobs | |
| `/cron/refresh-complaints` | Refresh complaints | |
| `/cron/refresh-events` | Refresh events | |
| `/cron/refresh-recalls` | Refresh recalls | |
| `/cron/retention-alerts` | Send retention alerts | |
| `/cron/schedule-inactivity-emails` | Schedule emails | |
| `/cron/schedule-ingestion` | Schedule ingestion | |
| `/cron/weekly-car-expansion` | Expand car data | |
| `/cron/youtube-enrichment` | Enrich YouTube data | |

---

### 7. Internal Routes (17 routes)
`/api/internal/*`

| Route | Purpose |
|-------|---------|
| `/internal/add-car-ai` | Add car via AI |
| `/internal/car-pipeline` | Car pipeline status |
| `/internal/car-pipeline/[slug]` | Single car pipeline |
| `/internal/car-variants` | Car variants |
| `/internal/data-quality` | Data quality checks |
| `/internal/dyno/runs` | Dyno run management |
| `/internal/errors` | Error management |
| `/internal/errors/stats` | Error statistics |
| `/internal/events/submissions` | Event submissions |
| `/internal/events/submissions/[id]/reject` | Reject submission |
| `/internal/forum-insights` | Forum insights |
| `/internal/knowledge/ingest` | Knowledge ingestion |
| `/internal/maintenance/variant-overrides` | Maintenance overrides |
| `/internal/parts/fitments` | Parts fitments |
| `/internal/qa-report` | QA report |
| `/internal/test-discord` | Test Discord |
| `/internal/track/lap-times` | Track lap times |

---

### 8. Other Routes

| Category | Routes | Examples |
|----------|--------|----------|
| AI/AL | 5 | `/ai-mechanic`, `/al/stats`, `/al/preferences` |
| Parts | 4 | `/parts/search`, `/parts/popular`, `/parts/turbos` |
| Events | 6 | `/events`, `/events/[slug]`, `/events/submit` |
| VIN | 3 | `/vin/decode`, `/vin/resolve`, `/vin/safety` |
| Uploads | 3 | `/uploads`, `/uploads/client-token`, `/uploads/save-metadata` |
| Webhooks | 4 | `/webhooks/stripe`, `/webhooks/vercel`, etc. |
| Billing | 2 | `/checkout`, `/billing/portal` |
| Misc | 10 | `/health`, `/stats`, `/feedback`, etc. |

---

## Potential Issues

### 1. Route Overlap Investigation Needed

| Route A | Route B | Question |
|---------|---------|----------|
| `/cars/[slug]/enriched` | Individual car routes | Should all use bundle? |
| `/users/[userId]/garage` | `/users/[userId]/vehicles` | Redundant? |
| `/analytics/event` | `/analytics/track` | Different purposes? |

### 2. Naming Inconsistencies

| Pattern | Examples |
|---------|----------|
| kebab-case | `/ai-mechanic`, `/al-credits` ✓ |
| Mixed | `/safety-ratings` vs `/priceByYear` |
| Inconsistent pluralization | `/events/types` vs `/parts/turbos` |

### 3. Missing/Incomplete Routes

- No explicit `/api/cars/[slug]` route (uses client-side fetch?)
- No `/api/users/[userId]/favorites` route (uses direct Supabase?)

---

## Recommendations

### 1. Document Route Purposes
Create API documentation with:
- HTTP methods supported
- Request/response schemas
- Authentication requirements
- Rate limits

### 2. Consider Consolidation
- **Analytics routes:** Could be single endpoint with event type param
- **Car enriched bundle:** Could replace individual data routes

### 3. Add Missing Routes
- Document why some data uses direct Supabase vs API routes
- Add routes if needed for consistency

### 4. Standardize Naming
- Use kebab-case consistently
- Use consistent pluralization

---

## Summary

| Category | Count | Status |
|----------|-------|--------|
| Admin | 32 | Well-organized |
| Cars | 20 | Good, consider bundle |
| Users | 18 | Good |
| Analytics | 8 | Consider consolidation |
| Community | 10 | Good |
| CRON | 24 | Good |
| Internal | 17 | Good |
| Other | 46 | Various |
| **Total** | **175** | |
