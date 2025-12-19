# AutoRev Pre-Flight Checklist

**Last Updated:** December 18, 2024

Use this checklist before testing to ensure everything is properly configured.

---

## ✅ Verification Summary

| Check | Status | Notes |
|-------|--------|-------|
| **Linting** | ✅ Pass | 0 errors, 82 warnings (all non-blocking) |
| **Tests** | ✅ Pass | 40/40 tests passing |
| **Build** | ⬜ Verify | Run `npm run build` |
| **Environment** | ⬜ Verify | Check required variables |
| **Database** | ⬜ Verify | Confirm migrations run |

---

## 1. Environment Variables

### Required (Critical)

These must be set for the app to function:

```bash
# Supabase - Database & Auth
NEXT_PUBLIC_SUPABASE_URL=        # Your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase anonymous key (client-side)
SUPABASE_SERVICE_ROLE_KEY=       # Supabase service role key (server-side)
```

### Required for Features

| Variable | Feature | Impact if Missing |
|----------|---------|-------------------|
| `ANTHROPIC_API_KEY` | AL (AI assistant) | AL chat won't work |
| `OPENAI_API_KEY` | Knowledge search | Vector search disabled |
| `RESEND_API_KEY` | Contact form email | Contact form won't send emails |
| `CRON_SECRET` | Scheduled jobs | Cron endpoints unprotected |

### Optional (Feature Enhancement)

| Variable | Feature |
|----------|---------|
| `DISCORD_WEBHOOK_FEEDBACK` | Feedback notifications |
| `DISCORD_WEBHOOK_CONTACTS` | Lead notifications |
| `DISCORD_WEBHOOK_ERRORS` | Error alerts |
| `DISCORD_WEBHOOK_SIGNUPS` | New user alerts |
| `DISCORD_WEBHOOK_EVENTS` | Event submissions |
| `DISCORD_WEBHOOK_AL` | AL usage alerts |
| `DISCORD_WEBHOOK_CRON` | Cron job notifications |
| `DISCORD_WEBHOOK_DIGEST` | Daily digest |
| `BLOB_READ_WRITE_TOKEN` | Image uploads to Vercel Blob |
| `GOOGLE_AI_API_KEY` | AI image generation |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Location autocomplete |
| `SUPADATA_API_KEY` | YouTube transcript extraction |

### Graceful Degradation

The app is designed to handle missing configuration gracefully:

- **No Supabase:** App uses local `data/cars.js` as fallback, auth disabled
- **No AI keys:** AL assistant and knowledge search disabled
- **No Discord webhooks:** Notifications silently skipped
- **No Google Maps key:** Location autocomplete falls back to text input

---

## 2. Database Setup

### Verify Migrations

Ensure all 56 migrations have been applied:

```bash
# Check the most recent migration number in your Supabase dashboard
# under Database → Migrations, or via SQL:
SELECT * FROM supabase_migrations ORDER BY id DESC LIMIT 5;
```

Expected latest migrations:
- `056_add_missing_rpc_functions.sql`
- `055_auto_error_category_enum.sql`
- `054_auto_error_logging.sql`

### Required Tables (Spot Check)

These tables must exist:
- `cars` - Core vehicle catalog
- `user_profiles` - User accounts
- `user_favorites` - User favorites
- `user_projects` - Saved builds
- `user_vehicles` - Owned vehicles
- `events` - Car events
- `event_saves` - Saved events
- `event_types` - Event categories
- `al_conversations` - AL chat history
- `al_usage_logs` - AL credit tracking

---

## 3. Build Verification

Run the build to catch any compilation issues:

```bash
npm run build
```

Expected result: Build completes without errors.

---

## 4. Test Suite

Run the test suite:

```bash
npm test
```

Expected result: **40/40 tests passing**

---

## 5. Development Server

Start the development server:

```bash
npm run dev
```

Then verify:
1. Homepage loads at http://localhost:3000
2. Browse Cars page loads and displays cars
3. Sign in modal opens (may show "not configured" if no Supabase)

---

## 6. Known Non-Blocking Warnings

### ESLint Warnings (82 total)

All warnings are non-critical:

| Warning Type | Count | Impact |
|-------------|-------|--------|
| `<img>` vs `<Image />` | ~15 | Performance suggestion |
| React hook dependencies | ~12 | Usually intentional |
| Anonymous default exports | ~40+ | Code style preference |
| aria-expanded on textbox | 1 | Minor accessibility |

These do not affect functionality.

### TODOs in Code (3 total)

Minor TODOs for future enhancement:

1. `app/api/internal/events/submissions/route.js:302` - Send notification on approval
2. `app/api/events/submit/route.js:7` - Implement rate limiting
3. `app/api/internal/events/submissions/[id]/reject/route.js:99` - Send rejection notification

None are blocking issues.

---

## 7. Feature Testing Matrix

### Public Pages (No Auth Required)

| Page | Key Features to Test |
|------|---------------------|
| `/` (Home) | Hero, car carousel, pillars section |
| `/browse-cars` | Filters, sorting, pagination, search |
| `/browse-cars/[slug]` | All tabs load, images, data displays |
| `/car-selector` | Priority sliders, car matching |
| `/join` | Tier cards, signup flow |
| `/encyclopedia` | Navigation, search, article display |
| `/community` | Featured events, categories |
| `/community/events` | Filters, list/map/calendar views |
| `/contact` | Form submission |
| `/privacy`, `/terms` | Static content displays |

### Auth-Required Pages

| Page | Key Features to Test |
|------|---------------------|
| `/garage` | Vehicle display, favorites, owned cars |
| `/garage/compare` | Side-by-side comparison |
| `/tuning-shop` | Car selection, upgrades, saved builds |
| `/profile` | All tabs, settings, AL credits |
| `/events/submit` | Form validation, submission |

### Tier-Gated Features

| Feature | Required Tier | Page |
|---------|---------------|------|
| VIN Decode | Enthusiast | /garage |
| Market Value | Enthusiast | /garage |
| Service Logs | Enthusiast | /garage |
| Saved Events | Enthusiast | /community/events |
| Map View | Enthusiast | /community/events |
| Calendar View | Enthusiast | /community/events |
| Dyno Database | Tuner | /browse-cars/[slug] |
| Full Lap Times | Tuner | /browse-cars/[slug] |
| Build Projects | Tuner | /tuning-shop |

**Note:** During beta (`IS_BETA = true`), all authenticated users have full access.

---

## 8. API Health Check

Test critical endpoints:

```bash
# Health check
curl http://localhost:3000/api/health

# Stats (no auth required)
curl http://localhost:3000/api/stats

# Event types (no auth required)
curl http://localhost:3000/api/events/types
```

---

## 9. Cron Jobs

Configured in `vercel.json`:

| Endpoint | Schedule | Purpose |
|----------|----------|---------|
| `/api/cron/process-scrape-jobs` | Every 15 min | Process scrape queue |
| `/api/cron/schedule-ingestion` | Sun 2 AM | Schedule parts ingestion |
| `/api/cron/refresh-recalls` | Sun 2:30 AM | NHTSA recalls |
| `/api/cron/refresh-complaints` | Sun 4 AM | NHTSA complaints |
| `/api/cron/youtube-enrichment` | Mon 4 AM | YouTube processing |
| `/api/cron/forum-scrape` | Tue/Fri 5 AM | Forum insights |
| `/api/cron/refresh-events` | Daily 6 AM | Event sources |
| `/api/cron/daily-digest` | Daily 2 PM | Digest email |

To manually trigger (requires `CRON_SECRET`):

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/cron/refresh-events?limit=10
```

---

## 10. Quick Start Commands

```bash
# Install dependencies (if needed)
npm install

# Run linting
npm run lint

# Run tests
npm test

# Start development server
npm run dev

# Production build
npm run build
npm start
```

---

## 🎯 Ready to Test?

Before you begin testing:

1. ✅ Environment variables configured
2. ✅ Database migrations applied
3. ✅ `npm run build` succeeds
4. ✅ `npm test` passes (40/40)
5. ✅ `npm run dev` starts successfully

**You're ready to go!** 🚀

