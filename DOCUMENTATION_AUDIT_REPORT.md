# Documentation Audit Report

> **Generated:** December 28, 2024  
> **Purpose:** Track all documentation inaccuracies found and updates needed

---

## Critical Updates Required

### 1. Stripe Integration (NEW - Added Dec 27, 2024)

**Status:** ✅ STRIPE_INTEGRATION.md created

**Files Needing Updates:**
- [ ] ARCHITECTURE.md - Add Stripe to External APIs section, add env vars
- [ ] DATABASE.md - Document new Stripe fields in `user_profiles`
- [ ] API.md - Add 3 new Stripe routes
- [ ] index.md - Add STRIPE_INTEGRATION.md to quick links

**New Stripe Fields in `user_profiles`:**
```sql
stripe_customer_id TEXT
stripe_subscription_id TEXT  
stripe_subscription_status TEXT
subscription_started_at TIMESTAMPTZ
subscription_ends_at TIMESTAMPTZ
al_credits_purchased INTEGER
```

**New API Routes:**
- POST `/api/checkout` - Create Stripe checkout sessions
- POST `/api/billing/portal` - Customer portal access
- POST `/api/webhooks/stripe` - Process Stripe webhook events
- GET `/api/admin/stripe` - Admin metrics

**New Environment Variables:**
```bash
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
```

---

### 2. Actual File Counts vs. Documentation

| Item | Documented | Actual | Status |
|------|------------|--------|--------|
| API Routes | 85 | **99** | ❌ Update needed |
| Components | 64 | **70** | ❌ Update needed |
| Lib Services | 122 | **114** | ✅ Close enough |
| Scripts | 100+ | **170** | ⚠️ Update to "170+" |
| Database Tables | 65-75 (varies) | **75** | ✅ Standardize to 75 |
| Documentation Files | 19 | **21** (+STRIPE_INTEGRATION.md, +README.md in /planning/) | ❌ Update |

**Action:** Update all counts in:
- docs/index.md
- docs/ARCHITECTURE.md  
- docs/API.md
- docs/COMPONENTS.md
- docs/SCRIPTS.md
- README.md

---

### 3. External API Integrations

**Current Documentation:**  
GOOGLE_CLOUD_APIS.md lists 9 Google APIs

**Missing from Documentation:**
- ✅ Stripe (NOW DOCUMENTED)
- ⚠️ Exa API (used for YouTube discovery in cron job)
- ⚠️ Supadata API (transcript fallback)
- ✅ Resend (email service - in ARCHITECTURE.md)
- ✅ Discord webhooks (in DISCORD_CHANNEL_REFERENCE.md)

**Environment Variables Audit:**

Required but not in ARCHITECTURE.md:
```bash
# Stripe
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET

# YouTube Enhancement
EXA_API_KEY              # Exa search for video discovery
SUPADATA_API_KEY         # Optional: Transcript fallback

# Already documented:
YOUTUBE_API_KEY
GOOGLE_API_KEY
ANTHROPIC_API_KEY
OPENAI_API_KEY
RESEND_API_KEY
DISCORD_WEBHOOK_* (multiple)
CRON_SECRET
```

---

### 4. README.md Inaccuracies

**Current README states:**
- "All 24 pages" → **Actual: 37 pages** (per PAGES.md)
- "All 51 database tables" → **Actual: 75 tables** (per DATABASE.md)
- "All 37 API routes" → **Actual: 99 routes** (counted)
- "15 tools" → **Actual: 17 tools** (per AL.md)
- "46 components" → **Actual: 70 components** (counted)

**Action:** Complete rewrite of README.md needed

---

### 5. index.md Quick Links

**Missing Links:**
- STRIPE_INTEGRATION.md (new)
- FILE_STRUCTURE.md (exists but not in index)
- ACTIVE_CONFIG.md (exists but not in index)

**Broken Links:** (moved to /planning/)
- DATA_GAPS.md → planning/audits/DATA_GAPS.md ✅ Fixed
- DATA_PIPELINE.md → planning/implementations/DATA_PIPELINE.md ✅ Fixed  
- FEATURES.md → planning/reference/FEATURES.md ✅ Fixed
- OWNER_GUIDE.md → planning/reference/OWNER_GUIDE.md ✅ Fixed
- image-inventory.md → planning/reference/image-inventory.md ✅ Fixed

---

### 6. API.md Route Count

**Documentation states:** "All 55 API routes" or "85 routes" (inconsistent)

**Actual count:** 99 route files found

**Breakdown needed:**
```bash
# Actual count by category:
app/api/
├── cars/ (17 routes)
├── events/ (5 routes)
├── parts/ (3 routes)
├── users/ (8 routes)
├── vin/ (3 routes)
├── ai-mechanic/ (2 routes)
├── checkout/ (1 route) ← NEW
├── billing/ (1 route) ← NEW
├── webhooks/ (4 routes, including stripe) ← UPDATED
├── cron/ (12 routes)
├── internal/ (12 routes)
├── admin/ (12 routes) ← INCLUDING STRIPE
└── others (19 routes)
```

**Action:** Full audit of API.md with actual routes

---

### 7. COMPONENTS.md Count

**Documentation states:** "64 React components"

**Actual:** 70 .jsx files in /components/

**Missing from docs:**
- StripeDashboard.jsx (new)
- Possibly others added recently

**Action:** Re-audit all components

---

### 8. SCRIPTS.md Count

**Documentation states:** "100+ operational scripts"

**Actual:** 170 scripts (.js + .mjs files)

**Action:** Update to "170+ operational scripts" for accuracy

---

### 9. Database Schema Updates

**Recent Additions Not Documented:**

1. **Stripe fields** in `user_profiles` (listed above)
2. Possible new tables or columns for recent features

**Action:** Cross-reference DATABASE.md with actual `supabase/migrations/` and `supabase/schema.sql`

---

### 10. ARCHITECTURE.md - External APIs Section

**Current:** Lists YouTube, NHTSA, EPA, Anthropic, OpenAI

**Missing:**
- **Stripe** (payment processing) ← HIGH PRIORITY
- **Exa** (YouTube video discovery)
- **Supadata** (transcript fallback)
- **Resend** (email delivery - mentioned but not in APIs section)

---

## Priority Ranking

| Priority | Update | Estimated Effort | Impact |
|----------|--------|------------------|--------|
| **P0** | Add Stripe to ARCHITECTURE.md | 15 min | High - core feature |
| **P0** | Update README.md with accurate counts | 10 min | High - first impression |
| **P0** | Update index.md counts & links | 5 min | High - navigation |
| **P1** | Update API.md with 99 routes | 30 min | Medium - reference accuracy |
| **P1** | Update DATABASE.md with Stripe fields | 10 min | Medium - schema accuracy |
| **P1** | Add all env vars to ARCHITECTURE.md | 15 min | Medium - setup guidance |
| **P2** | Update COMPONENTS.md with count & new components | 20 min | Low - rarely changing |
| **P2** | Update SCRIPTS.md count | 2 min | Low - minor stat |
| **P3** | Audit all external APIs | 20 min | Low - nice to have |

**Total Estimated Effort:** ~2 hours

---

## Automated Checks to Implement

To prevent future drift:

1. **File count script** - Compare actual vs documented counts
2. **API route linter** - Verify all routes are in API.md
3. **Component linter** - Verify all components in COMPONENTS.md  
4. **Env var checker** - Verify all required vars documented
5. **Migration tracker** - Auto-update DATABASE.md from migrations

---

## Next Steps

1. ✅ Create STRIPE_INTEGRATION.md (DONE)
2. ⬜ Update ARCHITECTURE.md (Stripe + env vars)
3. ⬜ Update index.md (counts + new links)
4. ⬜ Update README.md (all stats)
5. ⬜ Update API.md (route count + new routes)
6. ⬜ Update DATABASE.md (Stripe fields)
7. ⬜ Update COMPONENTS.md (count + new components)
8. ⬜ Update SCRIPTS.md (count)
9. ⬜ Create verification script to prevent future drift

---

*This audit report will be deleted after all updates are complete.*

