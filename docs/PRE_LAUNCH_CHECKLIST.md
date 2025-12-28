# AutoRev Pre-Launch Checklist

> **Last Updated:** December 28, 2024  
> **Status:** Pre-Beta Launch - All Issues Resolved ✅  
> **Audit Script:** `node scripts/system-audit.mjs`

## Recent Fixes Applied

### Code Fixes (3 files modified)
| # | File | Issue | Fix |
|---|------|-------|-----|
| 1 | `lib/discord.js` | Missing `financials` channel | Added `financials` to CHANNELS object |
| 2 | `lib/discord.js` | `notifyPayment()` wrong channel | Changed to use `financials` channel |
| 3 | `app/api/health/route.js` | Deep check only verified config | Added actual DB query with latency |

### Security Fixes (1 migration: `fix_function_search_path_and_rls_initplan`)
| # | Function | Issue | Fix |
|---|----------|-------|-----|
| 1 | `generate_referral_code()` | Mutable search_path | Added `SET search_path = public` |
| 2 | `increment_bounce_count()` | Mutable search_path | Added `SET search_path = public` |
| 3 | `get_email_analytics()` | Mutable search_path | Added `SET search_path = public` |
| 4 | `set_user_referral_code()` | Mutable search_path | Added `SET search_path = public` |

### Performance Fixes - RLS Initplan (same migration)
| # | Policy | Table | Fix |
|---|--------|-------|-----|
| 1 | `email_logs_user_read` | email_logs | Optimized `auth.uid()` evaluation |
| 2 | `email_queue_user_read` | email_queue | Optimized `auth.uid()` evaluation |
| 3 | `referrals_user_read` | referrals | Optimized `auth.uid()` evaluation |
| 4 | `referrals_user_insert` | referrals | Optimized `auth.uid()` evaluation |

### Performance Fixes - Foreign Key Indexes (3 migrations)
| Migration | Indexes Added |
|-----------|---------------|
| `add_foreign_key_indexes_part1` | 30 indexes on user, car, parts tables |
| `add_foreign_key_indexes_part2` | 44 indexes on events, financial, community tables |
| `add_foreign_key_indexes_part3` | 12 indexes on remaining FK columns |

**Total: 86 foreign key indexes added** - Improves JOIN and constraint validation performance.

### Performance Fixes - Unused Indexes Cleanup (1 migration)
| Migration | Indexes Dropped |
|-----------|-----------------|
| `drop_unused_indexes_empty_tables` | 24 indexes on empty accounting tables |

**Note:** Kept all vector indexes (embedding), trigram indexes (trgm), and Stripe-related indexes.

### Performance Fixes - RLS Policy Consolidation (4 migrations)
| Migration | Tables Fixed |
|-----------|--------------|
| `consolidate_rls_policies_part1` | brand_logos, car_images, car_manual_data, car_slug_aliases, community_insights, target_cities |
| `consolidate_rls_policies_part2` | event_car_affinities, event_types, events, app_config |
| `consolidate_rls_policies_part3` | event_submissions, featured_content, featured_content_channels |
| `consolidate_rls_policies_part4` | financial_audit_log, monthly_financial_reports |

**Pattern Applied:** Replaced ALL + SELECT with separate SELECT (unified) and INSERT/UPDATE/DELETE policies.

---

### Advisor Status After Fixes

| Category | Before | After | Status |
|----------|--------|-------|--------|
| Unindexed Foreign Keys | 75 | 0 | ✅ Resolved |
| Multiple Permissive Policies | 60+ | 0 | ✅ Resolved |
| Function Search Path | 4 | 0 | ✅ Resolved |
| RLS Initplan Issues | 4 | 0 | ✅ Resolved |
| Unused Indexes | ~50 problematic | INFO only | ✅ Safe |
| Leaked Password Protection | 1 | 1 | ⚠️ Dashboard only |
| Auth DB Connections | 1 | 1 | ℹ️ Dashboard only |

### Manual Actions Required

⚠️ **1. Enable Leaked Password Protection in Supabase Dashboard:**
1. Go to: Supabase Dashboard → Authentication → Settings
2. Find: "Auth Settings" section
3. Enable: "Prevent use of leaked passwords"
4. This checks passwords against HaveIBeenPwned.org

ℹ️ **2. (Optional) Auth DB Connection Strategy:**
1. Go to: Supabase Dashboard → Project Settings → Database
2. Consider switching to percentage-based connection allocation
3. Only needed if scaling to larger instance sizes

## Quick Start

```bash
# Run the automated audit
node scripts/system-audit.mjs

# Run specific phase only
node scripts/system-audit.mjs --phase=1

# Skip Discord notification
node scripts/system-audit.mjs --skip-discord
```

---

## Go/No-Go Criteria

| Status | Condition |
|--------|-----------|
| 🚀 **GO** | All checks pass, or only cosmetic issues |
| ⚠️ **CONDITIONAL** | 1-5 non-critical failures, workarounds documented |
| 🛑 **NO-GO** | Any critical system failure (auth, payments, data loss) |

### Critical Blockers (Must Pass)
- [ ] OAuth login works end-to-end
- [ ] Session persists across page refresh
- [ ] Stripe webhooks process correctly
- [ ] AL responds without errors
- [ ] Database tables are accessible

---

## Phase 1: Authentication System

### 1.1 OAuth Flow Verification

| Check | Expected | How to Verify |
|-------|----------|---------------|
| OAuth redirect URL | Matches Supabase dashboard | Compare `auth/callback` route with Supabase → Authentication → URL Configuration |
| Code exchange | Session established | Sign in → Check browser cookies for `sb-*` cookies |
| Cookie flags | `secure=true`, `httpOnly=true`, `sameSite=lax` | Browser DevTools → Application → Cookies |
| Session refresh | No errors on token expiry | Wait 1 hour or manually expire token |
| Error states | User-friendly message | Visit `/auth/callback?error=access_denied` |
| Google scopes | `email`, `profile` only | Check Supabase dashboard → Providers → Google |

**Manual Test Steps:**
1. Open incognito window
2. Click "Sign in with Google"
3. Complete OAuth flow
4. Verify redirect to intended page
5. Check cookies in DevTools

**Common Failure Modes:**
- **"Invalid redirect URI"** → Add callback URL to Google Cloud Console
- **"Session not persisting"** → Check cookie domain matches production domain
- **"Infinite redirect"** → Check for middleware interference

### 1.2 Session Persistence

| Check | Expected | How to Verify |
|-------|----------|---------------|
| Page refresh | User stays logged in | Sign in → Refresh page |
| Browser close/reopen | Session restored | Close browser completely, reopen |
| Cross-tab sync | All tabs show same state | Open 2 tabs, logout in one |
| Logout clears all | No session artifacts | Logout → Check cookies & localStorage |

**Manual Test Steps:**
1. Sign in successfully
2. Refresh page → Should remain signed in
3. Close browser completely
4. Reopen browser, navigate to site → Should be signed in
5. Open second tab → Both tabs should show logged in
6. Logout in one tab → Both tabs should show logged out

### 1.3 User Profile Creation

| Check | Expected | How to Verify |
|-------|----------|---------------|
| New user gets profile | Row in `user_profiles` | Query DB after signup |
| Default tier | `subscription_tier = 'free'` | Check profile row |
| Discord notification | Message in #signups | Check Discord channel |
| RLS allows self-read | User can fetch own profile | API call to `/api/user/profile` |
| Referral code generated | Non-null `referral_code` | Check profile row |

**SQL Verification:**
```sql
SELECT id, subscription_tier, referral_code, created_at 
FROM user_profiles 
WHERE id = 'USER_UUID_HERE';
```

---

## Phase 2: Stripe Payment System

### 2.1 Checkout Flow

| Check | Expected | How to Verify |
|-------|----------|---------------|
| Auth required | 401 for unauthenticated | `curl POST /api/checkout` without auth |
| Collector checkout | Creates Stripe session | Click upgrade to Enthusiast |
| Tuner checkout | Creates Stripe session | Click upgrade to Tuner |
| AL Credits checkout | Creates Stripe session | Purchase AL credits |
| Success URL | Redirects to `/profile?checkout=success` | Complete test purchase |
| Cancel URL | Redirects to `/join?checkout=canceled` | Cancel at Stripe checkout |

**Price IDs to Verify:**
| Product | Price ID | Amount |
|---------|----------|--------|
| Enthusiast (Collector) | `price_1Sj5QuPAhBIL8qL1G5vd4Etd` | $4.99/mo |
| Tuner | `price_1Sj5QvPAhBIL8qL1EWLZKRFL` | $9.99/mo |
| AL Credits Small | `price_1Sj5QwPAhBIL8qL1Yy2WePeo` | $4.99 |
| AL Credits Medium | `price_1Sj5QwPAhBIL8qL1HrLcIGno` | $9.99 |
| AL Credits Large | `price_1Sj5QxPAhBIL8qL1XUyXgK7N` | $19.99 |

**Test with Stripe CLI:**
```bash
stripe trigger checkout.session.completed
```

### 2.2 Webhook Processing

| Check | Expected | How to Verify |
|-------|----------|---------------|
| Signature verification | Invalid sig returns 400 | Send request with bad signature |
| checkout.session.completed | Tier updated, credits added | Stripe CLI trigger |
| customer.subscription.created | `stripe_subscription_id` set | Complete subscription |
| customer.subscription.updated | Status reflects change | Update subscription |
| customer.subscription.deleted | Tier reverts to `free` | Cancel subscription |
| invoice.paid | Renewal logged | Monthly renewal |

**Stripe CLI Testing:**
```bash
# Start webhook forwarding
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# In another terminal, trigger events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger customer.subscription.deleted
stripe trigger invoice.paid
```

### 2.3 Billing Portal

| Check | Expected | How to Verify |
|-------|----------|---------------|
| User with Stripe ID | Portal opens | Click "Manage Billing" |
| User without Stripe ID | Error message shown | New user clicks "Manage Billing" |
| Return URL | Back to `/profile?tab=billing` | Exit portal |

### 2.4 Database Updates

| Check | Expected | How to Verify |
|-------|----------|---------------|
| `stripe_customer_id` | Populated on first purchase | Query `user_profiles` |
| `stripe_subscription_id` | Set after subscription | Query `user_profiles` |
| `stripe_subscription_status` | Matches Stripe state | Compare with Stripe Dashboard |
| `subscription_tier` | Updated on purchase | Query `user_profiles` |

**Verification Query:**
```sql
SELECT 
  id,
  subscription_tier,
  stripe_customer_id,
  stripe_subscription_id,
  stripe_subscription_status
FROM user_profiles 
WHERE stripe_customer_id IS NOT NULL
LIMIT 10;
```

---

## Phase 3: AL Assistant System

### 3.1 API Endpoint

| Check | Expected | How to Verify |
|-------|----------|---------------|
| POST responds | 200 with response | Send test message |
| Authenticated user | Normal response | Send with auth header |
| Anonymous user | Limited response or 401 | Send without auth |
| Claude model | Responds correctly | Check response format |

**Test Request:**
```bash
curl -X POST http://localhost:3000/api/ai-mechanic \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the best sports car under 50k?"}'
```

### 3.2 Tool Execution

| Tool | Test Query | Expected |
|------|------------|----------|
| `search_cars` | "Find cars under 30k" | Returns car list |
| `get_car_details` | "Tell me about the Miata" | Returns Miata specs |
| `get_car_ai_context` | (Internal) | Returns enriched context |
| `search_events` | "Car shows in California" | Returns events |
| `get_expert_reviews` | "Reviews of the Corvette" | Returns review summaries |
| `get_known_issues` | "Problems with the E46 M3" | Returns known issues |
| `compare_cars` | "Compare Miata vs S2000" | Returns comparison |
| `search_knowledge` | "What is boost creep?" | Returns encyclopedia content |

### 3.3 Credit System

| Check | Expected | How to Verify |
|-------|----------|---------------|
| `al_user_credits` tracking | Balance decreases after chat | Query before/after |
| Low balance warning | Shows at <10% budget | Spend credits down |
| Credit purchase | Balance increases | Complete purchase |
| Monthly budget by tier | Enforced correctly | Check limits |

**Credit Verification:**
```sql
SELECT 
  user_id,
  balance_cents,
  spent_cents_this_month,
  messages_this_month,
  last_refill_at
FROM al_user_credits 
WHERE user_id = 'USER_UUID';
```

### 3.4 Conversation Storage

| Check | Expected | How to Verify |
|-------|----------|---------------|
| New conversation created | Row in `al_conversations` | Start new chat |
| Messages stored | Rows in `al_messages` | Send messages |
| User can view history | Past conversations load | Open AL, check history |

---

## Phase 4: Database & Connectivity

### 4.1 Health Check

| Check | Expected | How to Verify |
|-------|----------|---------------|
| GET /api/health | `{"status":"ok"}` | `curl /api/health` |
| Deep check | Includes `database` field | `curl /api/health?deep=true` |
| DB unavailable | `{"status":"degraded"}`, 503 | Temporarily block DB |

### 4.2 Critical Tables

All tables should be queryable:

| Table | Purpose |
|-------|---------|
| `user_profiles` | User account data |
| `al_user_credits` | AL credit balances |
| `al_conversations` | Chat history |
| `al_messages` | Individual messages |
| `user_favorites` | Saved cars |
| `user_vehicles` | Garage vehicles |
| `user_projects` | Build projects |
| `user_feedback` | Feedback/bug reports |
| `email_templates` | Email templates |
| `email_logs` | Sent email log |
| `email_queue` | Pending emails |
| `cars` | Car database |
| `parts` | Parts catalog |
| `events` | Car events |

### 4.3 Row Level Security

| Policy | Test |
|--------|------|
| Users read own profile | Authenticated user can SELECT own row |
| Users update own profile | Authenticated user can UPDATE own row |
| Admins read all | Admin role can SELECT all |
| Public read cars | Unauthenticated can SELECT `cars` |
| Public read events | Unauthenticated can SELECT `events` |

---

## Phase 5: Tier Gating System

### 5.1 Beta Mode

| Check | Expected | How to Verify |
|-------|----------|---------------|
| `IS_BETA` value | `true` for beta launch | Check `lib/tierAccess.js` |
| Authenticated access | All features available | Sign in, try gated features |
| Feature gating (prod) | Respects tier when IS_BETA=false | Test with IS_BETA=false |

### 5.2 Feature Access Matrix

| Feature | Free | Collector | Tuner |
|---------|------|-----------|-------|
| Browse cars | ✓ | ✓ | ✓ |
| Car Selector | ✓ | ✓ | ✓ |
| Basic Garage | ✓ | ✓ | ✓ |
| VIN Decode | ✗ | ✓ | ✓ |
| Owner's Reference | ✗ | ✓ | ✓ |
| Market Value | ✗ | ✓ | ✓ |
| Full Parts Catalog | ✗ | ✗ | ✓ |
| Dyno Database | ✗ | ✗ | ✓ |
| Build Projects | ✗ | ✗ | ✓ |

### 5.3 UI Gating

| Check | Expected | How to Verify |
|-------|----------|---------------|
| PremiumGate shows content | Content visible for tier | Visit gated page as correct tier |
| PremiumGate shows upgrade | Upgrade prompt for lower tier | Visit gated page as lower tier |
| TeaserPrompt | Shows limited content + CTA | View parts list as free user |

---

## Phase 6: Discord Notifications

### 6.1 Environment Variables

All 10 webhooks should be set:

| Variable | Channel |
|----------|---------|
| `DISCORD_WEBHOOK_DEPLOYMENTS` | #deployments |
| `DISCORD_WEBHOOK_ERRORS` | #errors |
| `DISCORD_WEBHOOK_CRON` | #cron-summary |
| `DISCORD_WEBHOOK_FEEDBACK` | #feedback |
| `DISCORD_WEBHOOK_SIGNUPS` | #signups |
| `DISCORD_WEBHOOK_CONTACTS` | #contacts |
| `DISCORD_WEBHOOK_EVENTS` | #event-submissions |
| `DISCORD_WEBHOOK_AL` | #al-conversations |
| `DISCORD_WEBHOOK_DIGEST` | #daily-dose |
| `DISCORD_WEBHOOK_FINANCIALS` | #financials |

### 6.2 Notification Triggers

| Action | Expected Channel |
|--------|------------------|
| New user signup | #signups |
| Feedback submitted | #feedback |
| Contact form | #contacts |
| Event submission | #event-submissions |
| New AL conversation | #al-conversations |
| Stripe payment | #financials |
| Cron job completion | #cron-summary |
| Error logged | #errors |

**Verification Script:**
```bash
node scripts/verify-discord-webhooks.js
```

---

## Phase 7: Cron Jobs

### 7.1 Scheduled Jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| flush-error-aggregates | */5 * * * * | Flush error batches |
| process-scrape-jobs | */15 * * * * | Process web scraping |
| schedule-ingestion | 0 2 * * 0 | Weekly data ingestion |
| refresh-recalls | 30 2 * * 0 | Weekly recall refresh |
| youtube-enrichment | 0 4 * * 1 | Monday YouTube update |
| forum-scrape | 0 5 * * 2,5 | Tue/Fri forum scrape |
| refresh-complaints | 0 4 * * 0 | Weekly complaints refresh |
| refresh-events | 0 6 * * * | Daily events refresh |
| daily-digest | 0 14 * * * | 9 AM CST daily digest |
| daily-metrics | 0 0 * * * | Midnight metrics |
| process-email-queue | */5 * * * * | Process pending emails |
| schedule-inactivity-emails | 0 10 * * * | Schedule re-engagement |

### 7.2 Cron Authentication

All cron routes should require:
- `CRON_SECRET` header match, OR
- `x-vercel-cron: 1` header (Vercel internal)

**Test Unauthorized Access:**
```bash
curl http://localhost:3000/api/cron/daily-digest
# Should return 401
```

---

## Phase 8: Email System

### 8.1 Configuration

| Check | Expected |
|-------|----------|
| `RESEND_API_KEY` | Set and valid |
| From address | `hello@autorev.app` |
| Reply-to | `support@autorev.app` |

### 8.2 Email Templates

| Template | Trigger |
|----------|---------|
| `welcome` | New user signup |
| `inactivity-7d` | 7 days inactive |
| `referral-reward` | Friend joins via referral |

### 8.3 Email Queue

| Check | Expected |
|-------|----------|
| Queue processor runs | Every 5 minutes |
| Pending emails sent | Status changes to `sent` |
| Failed emails retried | Up to 3 attempts |

---

## Phase 9: Error Tracking & Feedback

### 9.1 Feedback Submission

| Check | Expected | How to Verify |
|-------|----------|---------------|
| POST creates row | New row in `user_feedback` | Submit feedback |
| All fields captured | message, category, severity, etc. | Check row data |
| Discord notification | Message in #feedback | Check channel |

### 9.2 Auto-Error Logging

| Check | Expected |
|-------|----------|
| Client errors logged | Row in `application_errors` |
| Deduplication | Same error updates count |
| Aggregation | Batched Discord notification |

### 9.3 Error Analysis

```bash
# View unresolved errors
node scripts/error-analysis.mjs --unresolved

# View regressions
node scripts/error-analysis.mjs --regressions
```

---

## Phase 10: Key User Journeys

### 10.1 Car Shopper (Anonymous → Free)

1. [ ] Browse `/browse-cars` → Cars load
2. [ ] Click car → Detail page loads all tabs
3. [ ] Use Car Selector → Scoring works
4. [ ] Sign up → Account created
5. [ ] Save favorite → Persists after refresh

### 10.2 Garage Owner (Collector)

1. [ ] Add vehicle to garage
2. [ ] Enter VIN → Decodes correctly
3. [ ] View Owner's Reference tab
4. [ ] View Market Value (if data exists)
5. [ ] Add service log entry

### 10.3 Tuner (Tuner Tier)

1. [ ] Access Tuning Shop
2. [ ] View dyno data for a car
3. [ ] View lap times
4. [ ] Search parts catalog
5. [ ] Save build project

### 10.4 AL Chat

1. [ ] Open AL chat
2. [ ] Send message about a car
3. [ ] Receive response with data
4. [ ] Credits deducted (check balance)
5. [ ] Conversation saved (check history)

### 10.5 Events

1. [ ] Browse `/community/events`
2. [ ] Filter by location
3. [ ] View event detail
4. [ ] Save event (Collector+)
5. [ ] Add to calendar (export works)

---

## Troubleshooting

### Common Issues

#### "Session not persisting after login"
1. Check cookie domain matches production domain
2. Verify `secure` flag for HTTPS
3. Check middleware isn't stripping cookies
4. Verify Supabase project URL is correct

#### "Stripe webhooks failing"
1. Verify `STRIPE_WEBHOOK_SECRET` is correct
2. Check webhook endpoint is registered in Stripe Dashboard
3. Use Stripe CLI to test locally
4. Check server logs for signature errors

#### "AL not responding"
1. Verify `ANTHROPIC_API_KEY` is set and valid
2. Check user has credits remaining
3. Look for rate limiting errors
4. Check Claude API status

#### "Discord notifications not sending"
1. Verify webhook URL is correct
2. Check for rate limiting (Discord limit: 30/min)
3. Ensure notification function is being called
4. Check for errors in server logs

#### "Emails not sending"
1. Verify `RESEND_API_KEY` is set
2. Check email queue for stuck items
3. Verify sender domain is verified in Resend
4. Check email logs table for errors

---

## Sign-Off

### Pre-Launch Approval

| Role | Name | Date | Approved |
|------|------|------|----------|
| Developer | | | ☐ |
| QA | | | ☐ |
| Product | | | ☐ |

### Launch Decision

- [ ] All critical blockers resolved
- [ ] Automated audit passes
- [ ] Manual spot checks complete
- [ ] Team sign-off received

**Final Status:** ☐ GO / ☐ NO-GO

---

*Generated by AutoRev System Audit - v1.0*

