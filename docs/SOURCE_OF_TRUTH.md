# AutoRev Source of Truth

> **PURPOSE**: This document is the CANONICAL reference for the entire AutoRev codebase.
> Before writing ANY code, check this document to understand what exists and where.
> Before creating ANY new file, verify it doesn't duplicate something that already exists.
>
> **RULE**: If it's not in this document, it either needs to be added here or shouldn't exist.

---

## 🔍 AI QUICK SEARCH INDEX

**Search by keyword to find what you need:**

| Keyword                                                               | Section                                                              | What You'll Find                                                                               |
| --------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `hp`, `horsepower`, `power calculation`                               | [Performance Calculations](#performance-calculations)                | `calculateSmartHpGain()` in `lib/performanceCalculator`                                        |
| `car`, `vehicle`, `car_id`, `car_slug`                                | [Car Data & Resolution](#car-data--resolution)                       | `resolveCarId()` in `lib/carResolver.js`                                                       |
| `user`, `auth`, `session`                                             | [State Management](#state-management)                                | `AuthProvider`, `useAuth()`                                                                    |
| `favorites`, `save`, `bookmark`                                       | [State Management](#state-management)                                | `FavoritesProvider`, `useFavorites()`                                                          |
| `garage`, `owned`, `my car`                                           | [Garage Feature Architecture](#garage-feature-architecture)          | `OwnedVehiclesProvider`, garage pages                                                          |
| `build`, `project`, `upgrades`                                        | [Build & Vehicle Data Model](#build--vehicle-data-model)             | `SavedBuildsProvider`, `user_projects` table                                                   |
| `dyno`, `torque`, `curve`                                             | [Data Visualization Components](#data-visualization-components)      | `VirtualDynoChart` component                                                                   |
| `lap time`, `track`, `estimate`                                       | [Data Visualization Components](#data-visualization-components)      | `LapTimeEstimator`, `lapTimeService.js`                                                        |
| `score`, `rating`, `tunability`                                       | [Scoring & Weights](#scoring--weights)                               | `lib/scoring.js`, `tunabilityCalculator.js`                                                    |
| `component`, `jsx`, `ui`                                              | [Components](#components)                                            | Component registry by feature                                                                  |
| `api`, `route`, `endpoint`                                            | [API Routes](#api-routes)                                            | Route patterns and auth requirements                                                           |
| `database`, `table`, `supabase`                                       | [Database Tables](#database-tables)                                  | Table schemas and relationships                                                                |
| `provider`, `context`, `state`                                        | [State Management](#state-management)                                | Provider responsibility matrix                                                                 |
| `import`, `export`, `module`                                          | [Import Rules](#import-rules)                                        | Correct import patterns                                                                        |
| `create`, `new file`, `add`                                           | [Creating New Code](#creating-new-code)                              | Decision tree and checklist                                                                    |
| `error`, `bug`, `mistake`                                             | [Anti-Patterns](#anti-patterns--common-mistakes)                     | Common mistakes to avoid                                                                       |
| `events`, `calendar`, `meet`                                          | [Events](#events)                                                    | Events pages and services                                                                      |
| `community`, `posts`, `share`                                         | [Community Features](#community-features)                            | Community posts and builds                                                                     |
| `al`, `ai`, `mechanic`, `chat`                                        | [AI/AL Features](#aial-features)                                     | AL tools, conversation service, evaluation                                                     |
| `rerank`, `cohere`, `rag`, `retrieval`                                | [Service Files](#service-files)                                      | `lib/cohereRerank.js`, `lib/rrfRerank.js`                                                      |
| `circuit breaker`, `resilience`, `failover`                           | [Service Files](#service-files)                                      | `lib/aiCircuitBreaker.js`                                                                      |
| `evaluation`, `llm judge`, `golden dataset`                           | [AL Evaluation](#al-evaluation-testsdata-libalEvaluationServicejs)   | `lib/alEvaluationService.js`, `tests/data/al-golden-dataset.json`                              |
| `feedback`, `thumbs up`, `thumbs down`                                | [AI/AL Features](#aial-features)                                     | `lib/alFeedbackService.js`, `components/ALFeedbackButtons.jsx`                                 |
| `model tier`, `cost optimization`                                     | [AI/AL Features](#aial-features)                                     | `MODEL_TIERS`, `selectModelForQuery()` in `lib/alConfig.js`                                    |
| `prompt cache`, `anthropic cache`                                     | [AI/AL Features](#aial-features)                                     | `cache_control` in `app/api/ai-mechanic/route.js`                                              |
| `confidence`, `knowledge quality`                                     | [AI/AL Tables](#aial-tables)                                         | `document_chunks.confidence_level`                                                             |
| `safety test`, `red team`, `jailbreak`                                | [AL Evaluation](#al-evaluation-testsdata-libalEvaluationServicejs)   | `tests/safety/al-safety.test.js`                                                               |
| `image`, `upload`, `photo`                                            | [Service Files](#service-files)                                      | `lib/images.js`, `lib/imageUploadService.js`                                                   |
| `stripe`, `payment`, `subscription`                                   | [Billing System](#billing-system)                                    | Stripe integration                                                                             |
| `email`, `notification`                                               | [Email System](#email-system)                                        | Email templates and sending                                                                    |
| `naming`, `convention`, `file name`, `handler`                        | [Naming Conventions](#-naming-conventions)                           | File and function naming patterns                                                              |
| `analytics`, `event`, `tracking`, `gtag`                              | [Analytics Event Naming](#analytics-event-naming)                    | Event naming convention, EVENTS                                                                |
| `funnel`, `conversion`, `step tracking`                               | [Funnel Tracking](#funnel-tracking)                                  | `trackFunnelStep()`, `FUNNELS`                                                                 |
| `posthog`, `product analytics`, `session replay`                      | [Product Analytics](#product-analytics-posthog)                      | PostHogProvider, usePostHog()                                                                  |
| `tracking plan`, `event properties`, `event owners`                   | [docs/TRACKING_PLAN.md](./TRACKING_PLAN.md)                          | All events documented with properties                                                          |
| `abtest`, `experiment`, `variant`                                     | [A/B Testing Components](#ab-testing-components)                     | `ABTest`, `FeatureFlag`, `useFeatureFlag()`                                                    |
| `offline queue`, `pwa analytics`                                      | [Service Files](#service-files)                                      | `lib/analytics/offlineQueue.js`                                                                |
| `analytics manager`, `provider abstraction`                           | [Service Files](#service-files)                                      | `lib/analytics/manager.js`                                                                     |
| `gdpr`, `delete data`, `export data`, `right to be forgotten`         | [API Routes](#api-routes)                                            | `/api/user/delete-data`, `/api/user/export-data`                                               |
| `avatar`, `profile photo`, `upload avatar`                            | [Settings Page](#core-app-pages-authenticated)                       | Avatar upload in `app/(app)/settings/page.jsx`                                                 |
| `username`, `public slug`, `profile url`                              | [API Routes](#api-routes)                                            | `/api/user/check-username`, `is_public_slug_available()`                                       |
| `speed insights`, `web vitals`, `cwv`, `lcp`, `inp`                   | [Observability](#observability)                                      | SpeedInsights, `/api/admin/web-vitals/collect`                                                 |
| `slo`, `error budget`, `availability target`                          | [docs/SLO.md](./SLO.md)                                              | Service Level Objectives                                                                       |
| `schema version`, `event versioning`                                  | [Analytics Event Naming](#analytics-event-naming)                    | `SCHEMA_VERSION` in `lib/analytics/events.js`                                                  |
| `css audit`, `hardcoded colors`, `design tokens`                      | [CSS Audit & Maintenance](#css-audit--maintenance-scripts)           | `npm run audit:css`, `npm run fix:colors`                                                      |
| `color`, `hex`, `css variable`, `design token`                        | [Color Variable Reference](#color-variable-reference)                | Hex to variable mapping, 195 mappings in `scripts/color-token-map.json`                        |
| `purple`, `pink`, `category color`, `dashboard color`                 | [Color Variable Reference](#color-variable-reference)                | Extended category colors: `--color-accent-purple`, `--color-accent-pink`, `--color-accent-red` |
| `media query`, `mobile-first`, `min-width`, `max-width`, `responsive` | [CSS Audit & Maintenance](#css-audit--maintenance-scripts)           | Mobile-first patterns, `npm run audit:media-queries`                                           |
| `breakpoint`, `responsive`, `tablet`, `desktop`                       | [CSS Audit & Maintenance](#css-audit--maintenance-scripts)           | `min-width: 768px` patterns, breakpoint utilities                                              |
| `100vw`, `horizontal overflow`, `ios safari`, `viewport width`        | [Anti-Patterns](#-css-anti-patterns)                                 | Use `max-width: 100%` not `100vw`                                                              |
| `design system`, `tokens`, `typography`, `spacing`                    | [docs/DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)                          | Comprehensive design reference                                                                 |
| `background`, `immersive`, `overlay`, `elevated`, `6-level`           | [Color Variable Reference](#color-variable-reference)                | 6-level background hierarchy                                                                   |
| `touch target`, `accessibility`, `focus`, `wcag`                      | [Accessibility Requirements](#accessibility-requirements-wcag-21-aa) | Touch targets, focus states, form inputs                                                       |
| `aria`, `inputMode`, `error state`, `screen reader`                   | [Accessibility Requirements](#accessibility-requirements-wcag-21-aa) | ARIA attributes, mobile keyboards                                                              |
| `rate limit`, `throttle`, `429`                                       | [Service Files](#service-files)                                      | `rateLimit()` in `lib/rateLimit.js`                                                            |
| `validation`, `zod`, `schema`                                         | [Service Files](#service-files)                                      | `lib/schemas/index.js` validation schemas                                                      |
| `reduced motion`, `animation`, `a11y`                                 | [Custom Hooks](#custom-hooks)                                        | `useReducedMotion()` hook                                                                      |
| `safe area`, `notch`, `status bar`, `pwa`                             | [Custom Hooks](#custom-hooks)                                        | `useSafeAreaColor()` hook                                                                      |
| `skip link`, `accessibility`, `keyboard`                              | [Components](#components)                                            | `SkipLink` component                                                                           |
| `security`, `csp`, `headers`                                          | [Security](#security)                                                | `next.config.js`, `middleware.js`                                                              |
| `webhook`, `signature`, `verification`                                | [Webhook Security](#webhook-security)                                | Stripe, Vercel, Resend webhook handlers                                                        |
| `cron`, `cron_secret`, `scheduled job`                                | [Cron Job Authentication](#cron-job-authentication)                  | `isAuthorized()` pattern                                                                       |
| `sentry`, `error tracking`, `monitoring`                              | [Error Tracking](#error-tracking-sentry)                             | Sentry config, ErrorBoundary                                                                   |
| `subscription`, `tier`, `billing`, `stripe`                           | [Subscription Hooks](#subscription-hooks)                            | `useSubscription()` hook                                                                       |
| `feature flag`, `a/b test`, `experiment`                              | [Feature Flags](#feature-flags--ab-testing)                          | `useFeatureFlag()`, `FLAGS`                                                                    |
| `env`, `environment`, `validation`                                    | [Environment Validation](#environment-validation)                    | `lib/env.js`                                                                                   |
| `commitlint`, `conventional commits`                                  | [Code Quality](#code-quality)                                        | `commitlint.config.js`                                                                         |
| `stylelint`, `css lint`                                               | [Code Quality](#code-quality)                                        | Lint CSS files                                                                                 |
| `trial`, `dunning`, `payment failed`                                  | [Subscription Polish](#subscription-polish)                          | Trial emails, PaymentFailedBanner                                                              |
| `dark mode`, `theme`, `next-themes`                                   | [Theme System](#theme-system)                                        | ThemeProvider, ThemeToggle                                                                     |
| `e2e`, `playwright`, `test`                                           | [Testing](#testing)                                                  | E2E test specs                                                                                 |
| `vitest`, `unit test`, `react testing`                                | [Testing](#testing)                                                  | Unit tests with Vitest                                                                         |
| `llm judge`, `eval`, `golden dataset`                                 | [Testing](#testing)                                                  | AL evaluation pipeline                                                                         |
| `query key`, `tanstack`, `cache invalidation`                         | [Query Key Factory](#query-key-factory)                              | `lib/queryKeys.js`, detailed docs in Documentation section                                     |
| `dynamic import`, `code split`, `lazy load`                           | [Components](#components)                                            | `components/dynamic.js`                                                                        |
| `adr`, `architecture decision`                                        | [Documentation](#documentation)                                      | `docs/adr/` folder                                                                             |
| `intent`, `classifier`, `routing`                                     | [AL Assistant](#al-assistant)                                        | `lib/alIntentClassifier.js`                                                                    |
| `gesture`, `pull to refresh`, `swipe`, `mobile`                       | [Components](#components)                                            | `PullToRefresh`, `SwipeableRow` in `components/ui/`                                            |
| `drag`, `drop`, `reorder`, `sortable`                                 | [Garage Feature Architecture](#garage-feature-architecture)          | `@dnd-kit` in garage list view                                                                 |
| `optimistic`, `instant ui`, `background save`                         | [State Management](#state-management)                                | Optimistic patterns in providers                                                               |
| `paired tokens`, `card foreground`, `theming`                         | [Color Variable Reference](#color-variable-reference)                | `--color-card`, `--color-card-foreground`                                                      |
| `notification`, `bell`, `in-app alert`                                | [Notification System](#notification-system)                          | `NotificationCenter`, `notificationService.js`                                                 |
| `preferences`, `quiet hours`, `notification settings`                 | [Notification System](#notification-system)                          | `NotificationPreferences`, preference APIs                                                     |
| `streak`, `daily streak`, `activity streak`                           | [Engagement & Streaks](#engagement--streaks)                         | `StreakIndicator`, `engagementService.js`                                                      |
| `callsign`, `title`, `user greeting`, `tier color`                    | [Engagement & Streaks](#engagement--streaks)                         | `UserGreeting.jsx`, `getCallsignColor()`                                                       |
| `fatigue`, `notification fatigue`, `dismiss rate`                     | [Notification System](#notification-system)                          | `notificationFatigueService.js`                                                                |
| `milestone`, `achievement`, `celebration`                             | [Engagement & Streaks](#engagement--streaks)                         | `StreakMilestoneModal`, notification triggers                                                  |
| `page`, `route`, `url`, `site map`, `audit`                           | [Site Index](#️-site-index-official-page-structure)                   | Official list of all 26 pages                                                                  |
| `seo`, `metadata`, `og`, `twitter`, `schema`, `json-ld`               | [SEO & Metadata](#-seo--metadata)                                    | Metadata patterns, noindex rules, structured data                                              |
| `sitemap`, `robots`, `canonical`, `noindex`                           | [SEO & Metadata](#-seo--metadata)                                    | `app/sitemap.js`, `app/robots.js`, seoUtils.js                                                 |

---

## ⚠️ CARDINAL RULES (Read First!)

**These 10 rules prevent 90% of bugs. Violating them WILL cause issues.**

### Rule 1: ALWAYS Use `car_id` for Database Queries

```javascript
// ✅ CORRECT
const carId = await resolveCarId(carSlug);
const { data } = await supabase.from('car_issues').eq('car_id', carId);

// ❌ WRONG - car_slug has no index, causes inconsistencies
const { data } = await supabase.from('car_issues').eq('car_slug', carSlug);
```

**Why**: `car_slug` is for URLs only. All FK relationships use `car_id`.

### Rule 2: ONE Source of Truth Per Domain

```javascript
// ✅ CORRECT - Import from designated source
import { calculateSmartHpGain } from '@/lib/performanceCalculator';

// ❌ WRONG - Multiple calculators cause divergent results
import { calculateHp } from '@/lib/myNewCalculator'; // DON'T CREATE THIS
```

**Why**: Multiple implementations = inconsistent behavior across the app.

### Rule 3: NEVER Hardcode Aggregate Data

```javascript
// ✅ CORRECT - Calculate or fetch from database
const carCount = await getCarsCount();

// ❌ WRONG - Hardcoded values get stale
const carCount = 450; // DON'T DO THIS
```

**Why**: Hardcoded values become outdated and cause trust issues.

### Rule 4: Stock Data from `cars` Table, Mods from `user_*` Tables

```javascript
// ✅ CORRECT - Stock from cars, HP gain calculated dynamically from installed mods
import { calculateAllModificationGains } from '@/lib/performanceCalculator';

const stockHp = car.hp; // From cars table
const installedMods = vehicle.installedModifications; // From user_vehicles
const { hpGain } = calculateAllModificationGains(installedMods, car); // ALWAYS calculate
const finalHp = stockHp + hpGain;

// ❌ WRONG - Don't use stored totalHpGain (it becomes stale)
const finalHp = stockHp + vehicle.totalHpGain; // NO! totalHpGain is stale

// ❌ WRONG - Don't duplicate stock data
const finalHp = vehicle.currentHp; // Where does this come from?
```

**Why**: Clear separation prevents data synchronization bugs. Dynamic calculation ensures consistency.

### Rule 5: Use Providers for User State, NOT Direct Queries

```javascript
// ✅ CORRECT - Provider handles caching, sync, auth
const { vehicles } = useOwnedVehicles();

// ❌ WRONG - Bypasses cache, auth checks, subscriptions
const { data } = await supabase.from('user_vehicles').select('*');
```

**Why**: Providers handle authentication, caching, and real-time sync.

### Rule 6: Check SOURCE_OF_TRUTH Before Creating Files

```
Before creating ANY new file:
1. Search this document for existing solution
2. Search codebase with grep/glob
3. If creating new, ADD TO THIS DOC
```

**Why**: Duplicate files = divergent implementations = bugs.

### Rule 7: Use Design Tokens, NOT Hardcoded Colors + Mobile-First CSS

```css
/* ✅ CORRECT - Design tokens */
background: var(--color-bg-elevated, #1b263b);
color: var(--color-accent-teal, #10b981);

/* ❌ WRONG - Hardcoded colors */
background: #1b263b;
color: #10b981;

/* ✅ CORRECT - Mobile-first (min-width) */
.button {
  padding: 8px;
}
@media (min-width: 768px) {
  .button {
    padding: 16px;
  }
}

/* ❌ WRONG - Desktop-first (max-width) */
.button {
  padding: 16px;
}
@media (max-width: 767px) {
  .button {
    padding: 8px;
  }
}
```

**Why**: Design tokens enable consistent theming. Mobile-first CSS improves mobile performance.

> Run `npm run fix:colors:all` to auto-fix color violations.
> Run `npm run audit:media-queries` to find desktop-first patterns.

### Rule 8: Performance Calculations Use `performanceCalculator/`

```javascript
// ✅ CORRECT - Single source of truth for all performance calcs
import { calculateSmartHpGain, calculateUpgradedMetrics } from '@/lib/performanceCalculator';

// ❌ WRONG - Don't create new calculation files
import { myHpCalc } from '@/lib/utils/hpHelpers'; // DON'T
```

**Why**: Performance calculations are complex with diminishing returns, conflicts, etc.

### Rule 9: API Routes Follow Standard Patterns

```javascript
// ✅ CORRECT - User routes require auth + IDOR protection + error logging
import {
  createServerSupabaseClient,
  getBearerToken,
  createAuthenticatedClient,
} from '@/lib/supabaseServer';
import { errors } from '@/lib/apiErrors';
import { withErrorLogging } from '@/lib/serverErrorLogger';
import { rateLimit } from '@/lib/rateLimit';
import { mySchema, validateWithSchema, validationErrorResponse } from '@/lib/schemas';

async function handlePost(request, { params }) {
  // 1. Rate limiting (for mutations)
  const limited = rateLimit(request, 'api');
  if (limited) return limited;

  // 2. Authentication
  const bearerToken = getBearerToken(request);
  const supabase = bearerToken
    ? createAuthenticatedClient(bearerToken)
    : await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser(bearerToken || undefined);
  if (!user) return errors.unauthorized();

  // 3. IDOR protection (for /api/users/[userId]/ routes)
  const { userId } = await params;
  if (user.id !== userId) return errors.forbidden('Access denied');

  // 4. Input validation (for POST/PUT/PATCH)
  const body = await request.json();
  const validation = validateWithSchema(mySchema, body);
  if (!validation.success) return validationErrorResponse(validation.errors);

  // 5. Business logic with validated data...
}

// 6. Wrap with error logging
export const POST = withErrorLogging(handlePost, { route: 'my-route', feature: 'my-feature' });

// ✅ CORRECT - Admin routes use requireAdmin helper
import { requireAdmin } from '@/lib/adminAccess';

async function handleGet(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  // Admin-only logic...
}
export const GET = withErrorLogging(handleGet, { route: 'admin/my-route', feature: 'admin' });

// ❌ WRONG - Missing any of: auth, IDOR check, error logging, validation
export async function GET(request) {
  const data = await getUserData(userId); // No auth! No IDOR check!
}
```

**Why**: Auth bypass = security vulnerability. Missing patterns = inconsistent error handling.

### Rule 10: Update This Document When Adding Features

```
When you create:
- New service file → Add to Service Files section
- New component → Add to Components section
- New API route → Add to API Routes section
- New table → Add to Database Tables section
```

**Why**: Undocumented code becomes duplicated code.

---

## 🗺️ SITE INDEX (Official Page Structure)

> **IMPORTANT**: This is the canonical list of all pages in the AutoRev app.
> If a page is not listed here, it should not exist. When doing audits, use this list.
> Last updated: January 25, 2026

### Public Pages (Marketing)

| Route          | File Location                          | SEO                  | Purpose           |
| -------------- | -------------------------------------- | -------------------- | ----------------- |
| `/`            | `app/(marketing)/page.jsx`             | layout.jsx           | Landing/home page |
| `/privacy`     | `app/(marketing)/privacy/page.jsx`     | page.jsx             | Privacy policy    |
| `/terms`       | `app/(marketing)/terms/page.jsx`       | page.jsx             | Terms of service  |
| `/contact`     | `app/(marketing)/contact/page.jsx`     | layout.jsx           | Contact form      |
| `/unsubscribe` | `app/(marketing)/unsubscribe/page.jsx` | layout.jsx (noindex) | Email unsubscribe |

### Public Sharing Pages (Marketing)

| Route                      | File Location                                      | SEO                       | Purpose                |
| -------------------------- | -------------------------------------------------- | ------------------------- | ---------------------- |
| `/community/builds/[slug]` | `app/(marketing)/community/builds/[slug]/page.jsx` | page.jsx + OG image       | Public build detail    |
| `/community/events/[slug]` | `app/(marketing)/community/events/[slug]/page.jsx` | layout.jsx + Event schema | Public event detail    |
| `/shared/al/[token]`       | `app/(marketing)/shared/al/[token]/page.jsx`       | layout.jsx (noindex)      | Shared AL conversation |

### Core App Pages (Authenticated)

| Route            | File Location                      | Purpose            | Features                                                   |
| ---------------- | ---------------------------------- | ------------------ | ---------------------------------------------------------- |
| `/insights`      | `app/(app)/insights/page.jsx`      | Insights dashboard | Vehicle overview, health scores, recommendations           |
| `/dashboard`     | `app/(app)/dashboard/page.jsx`     | User dashboard     | Points, streaks, achievements                              |
| `/profile`       | `app/(app)/profile/page.jsx`       | User profile       | Profile info display                                       |
| `/settings`      | `app/(app)/settings/page.jsx`      | User settings      | Avatar upload, username, theme, data export, notifications |
| `/questionnaire` | `app/(app)/questionnaire/page.jsx` | Enthusiast profile | Onboarding questionnaire                                   |

### Garage Pages (Authenticated)

| Route                | File Location                          | Purpose               | Features                            |
| -------------------- | -------------------------------------- | --------------------- | ----------------------------------- |
| `/garage`            | `app/(app)/garage/page.jsx`            | Garage home           | Vehicle selector, overview          |
| `/garage/my-specs`   | `app/(app)/garage/my-specs/page.jsx`   | Vehicle specs         | Full specifications display         |
| `/garage/my-build`   | `app/(app)/garage/my-build/page.jsx`   | Build configuration   | Select upgrades, plan modifications |
| `/garage/my-parts`   | `app/(app)/garage/my-parts/page.jsx`   | Parts research        | Research and select specific parts  |
| `/garage/my-install` | `app/(app)/garage/my-install/page.jsx` | Installation tracking | Track install progress, find shops  |
| `/garage/my-photos`  | `app/(app)/garage/my-photos/page.jsx`  | Photo management      | Upload and manage vehicle photos    |

### Data Pages (Authenticated)

| Route         | File Location                   | Purpose      | Features                               |
| ------------- | ------------------------------- | ------------ | -------------------------------------- |
| `/data`       | `app/(app)/data/page.jsx`       | Virtual Dyno | HP/TQ curves, dyno result logging      |
| `/data/track` | `app/(app)/data/track/page.jsx` | Track Data   | Lap time estimator, track time logging |

### Community Pages (Authenticated)

| Route                    | File Location                              | Purpose     | Features                                              |
| ------------------------ | ------------------------------------------ | ----------- | ----------------------------------------------------- |
| `/community`             | `app/(app)/community/page.jsx`             | Builds Feed | TikTok-style build browsing, likes, comments, sharing |
| `/community/events`      | `app/(app)/community/events/page.jsx`      | Events      | Car meets, track days listing                         |
| `/community/leaderboard` | `app/(app)/community/leaderboard/page.jsx` | Leaderboard | User rankings, points standings                       |

### AI Assistant (Authenticated)

| Route | File Location           | Purpose | Features                  |
| ----- | ----------------------- | ------- | ------------------------- |
| `/al` | `app/(app)/al/page.jsx` | AL chat | AI mechanic conversations |

### System Pages

| Route         | File Location       | Purpose                                      |
| ------------- | ------------------- | -------------------------------------------- |
| `/admin/*`    | `app/admin/`        | Admin dashboard (admin role only)            |
| `/internal/*` | `app/internal/`     | Internal tools (admin/dev only)              |
| `/auth/*`     | `app/auth/`         | Auth flows (callback, reset-password, error) |
| `/not-found`  | `app/not-found.jsx` | 404 page                                     |
| `/error`      | `app/error.jsx`     | Error boundary                               |

### Audit Checklist

When auditing the app, these are ALL the user-facing pages to check:

**Public (5 pages):**

- [ ] `/` (home)
- [ ] `/privacy`
- [ ] `/terms`
- [ ] `/contact`
- [ ] `/unsubscribe`

**Public Sharing (3 pages):**

- [ ] `/community/builds/[slug]`
- [ ] `/community/events/[slug]`
- [ ] `/shared/al/[token]`

**Core App (5 pages):**

- [ ] `/insights`
- [ ] `/dashboard`
- [ ] `/profile`
- [ ] `/settings`
- [ ] `/questionnaire`

**Garage (7 pages):**

- [ ] `/garage`
- [ ] `/garage/my-specs`
- [ ] `/garage/my-build`
- [ ] `/garage/my-parts`
- [ ] `/garage/my-install`
- [ ] `/garage/my-photos`

**Data (2 pages):**

- [ ] `/data` (Virtual Dyno, Dyno Logs)
- [ ] `/data/track` (Lap Time Estimator, Track Times)

**Community (3 pages):**

- [ ] `/community` (Builds Feed)
- [ ] `/community/events` (Events Listing)
- [ ] `/community/leaderboard` (Leaderboard)

**AI (1 page):**

- [ ] `/al`

**Total: 26 user-facing pages**

---

## 🔍 SEO & Metadata

> **IMPORTANT**: This section documents SEO patterns for proper search engine visibility.
> All public pages need metadata. All authenticated pages need noindex.

### Metadata Patterns

**Pattern 1: Server Component with Static Metadata**

```javascript
// For server components, export metadata directly
export const metadata = {
  title: 'Page Title | AutoRev',
  description: 'Page description under 160 characters.',
  robots: { index: true, follow: true },
  alternates: { canonical: '/page-path' },
};
```

**Pattern 2: Server Component with Dynamic Metadata**

```javascript
// For dynamic routes, use generateMetadata
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = await fetchData(slug);
  return {
    title: `${data.name} | AutoRev`,
    description: data.description,
  };
}
```

**Pattern 3: Client Component (Use layout.jsx)**

```javascript
// Client components can't export metadata, so create a layout.jsx
// app/(marketing)/contact/layout.jsx
export const metadata = { ... };
export default function Layout({ children }) { return children; }
```

### noindex Requirements

**Authenticated pages MUST have noindex:**

```javascript
export const metadata = {
  title: 'Page Title | AutoRev',
  robots: {
    index: false,
    follow: false,
  },
};
```

**Pages with noindex:**
| Route Group | Layout/Page with noindex |
|-------------|-------------------------|
| `/garage/*` | `app/(app)/garage/layout.jsx` |
| `/data/*` | `app/(app)/data/layout.jsx` |
| `/community` (app) | `app/(app)/community/layout.jsx` |
| `/profile` | `app/(app)/profile/layout.jsx` |
| `/settings` | `app/(app)/settings/layout.jsx` |
| `/dashboard` | `app/(app)/dashboard/page.jsx` |
| `/al` | `app/(app)/al/page.jsx` |
| `/insights` | `app/(app)/insights/page.jsx` |
| `/unsubscribe` | `app/(marketing)/unsubscribe/layout.jsx` |
| `/shared/al/[token]` | `app/(marketing)/shared/al/[token]/layout.jsx` |

### SEO Utilities

Use `lib/seoUtils.js` for consistent metadata generation:

```javascript
import {
  generatePageMetadata,
  generateEventMetadata,
  generateCarMetadata,
  generateBreadcrumbSchema,
  generateEventSchema,
  generateVehicleSchema,
  SITE_URL,
} from '@/lib/seoUtils';
```

### Structured Data (JSON-LD)

Use `components/SchemaOrg.jsx` for schema.org markup:

```javascript
import SchemaOrg from '@/components/SchemaOrg';
import { generateEventSchema } from '@/lib/seoUtils';

// Single schema
<SchemaOrg schema={eventSchema} />

// Multiple schemas
<SchemaOrg schemas={[articleSchema, breadcrumbSchema]} />
```

**Available Schema Generators:**

- `generateOrganizationSchema()` - Site-wide (in root layout)
- `generateWebsiteSchema()` - Site-wide with SearchAction
- `generateBreadcrumbSchema(items)` - Navigation breadcrumbs
- `generateVehicleSchema(car)` - Car detail pages
- `generateEventSchema(event)` - Event detail pages
- `generateArticleSchema(options)` - Content pages
- `generateFAQSchema(faqs)` - FAQ pages

### Configuration Files

| File                       | Purpose                    |
| -------------------------- | -------------------------- |
| `app/sitemap.js`           | Dynamic sitemap generation |
| `app/robots.js`            | Crawler directives         |
| `lib/seoUtils.js`          | Metadata & schema helpers  |
| `components/SchemaOrg.jsx` | JSON-LD injection          |

### OG Image Generation

Dynamic OG images use Next.js ImageResponse:

| Route                      | OG Image File                                                 |
| -------------------------- | ------------------------------------------------------------- |
| `/`                        | `app/(marketing)/opengraph-image.tsx`                         |
| `/community/builds/[slug]` | `app/(marketing)/community/builds/[slug]/opengraph-image.tsx` |

---

## Table of Contents

**Quick Reference (Read First)**

- [AI Quick Search Index](#-ai-quick-search-index)
- [Cardinal Rules](#️-cardinal-rules-read-first)
- [Site Index](#️-site-index-official-page-structure)
- [SEO & Metadata](#-seo--metadata)
- [Naming Conventions](#-naming-conventions)
- [Anti-Patterns & Common Mistakes](#anti-patterns--common-mistakes)

**Architecture**

1. [Architecture Overview](#architecture-overview)
2. [Directory Structure](#directory-structure)
3. [File Relationships Map](#file-relationships-map)

**Code Reference** 4. [Feature Modules](#feature-modules) 5. [Service Files (lib/)](#service-files) 6. [Components](#components) 7. [API Routes](#api-routes) 8. [Custom Hooks](#custom-hooks)

**Data** 9. [Database Tables](#database-tables) 10. [Build & Vehicle Data Model](#build--vehicle-data-model) 11. [State Management](#state-management)

**Feature Documentation** 12. [Garage Feature Architecture](#garage-feature-architecture) 13. [Data Visualization Components](#data-visualization-components) 14. [Theme System](#theme-system) 15. [Settings Page Features](#settings-page-features)

**External Services** 16. [Email System](#email-system) 17. [Billing System](#billing-system) 18. [Security](#security)

**Development** 19. [Import Rules](#import-rules) 20. [Creating New Code](#creating-new-code) 21. [Testing](#testing) 22. [Quick Reference](#quick-reference)

**Reference** 23. [Documentation](#documentation)

---

## 📝 Naming Conventions

Consistent naming prevents duplication and makes code searchable.

### File Naming

| Type            | Convention                    | Example                      | Anti-Pattern             |
| --------------- | ----------------------------- | ---------------------------- | ------------------------ |
| **Components**  | PascalCase                    | `UserProfileCard.jsx`        | `userProfileCard.jsx`    |
| **Hooks**       | camelCase + `use` prefix      | `useUserProfile.js`          | `userProfile.js`         |
| **Utilities**   | camelCase, verb-first         | `formatVehiclePrice.js`      | `utils.js`, `helpers.js` |
| **Services**    | camelCase + `Service` suffix  | `emailService.js`            | `email.js`               |
| **API routes**  | kebab-case folders            | `app/api/user-profile/`      | `app/api/userProfile/`   |
| **CSS modules** | PascalCase matching component | `UserProfileCard.module.css` | `styles.module.css`      |

### Function Naming

**Pattern:** `handle{Domain}{Action}` for event handlers

```javascript
// ✅ CORRECT: Domain-specific, searchable names
const handleGoalSubmit = (e) => { ... };
const handleFilterChange = (key, value) => { ... };
const handleFeedbackSubmit = async (e) => { ... };
const handleCarActionClick = () => { ... };
const handleImageChange = (e) => { ... };

// ❌ WRONG: Generic names (easily duplicated, hard to search)
const handleClick = () => { ... };
const handleSubmit = (e) => { ... };
const handleChange = (e) => { ... };
```

### Canonical Examples (From Recent Migration)

| Component               | Handler Name              | Purpose                             |
| ----------------------- | ------------------------- | ----------------------------------- |
| `EventFilters.jsx`      | `handleFilterChange`      | Filter field changes                |
| `PerformanceGoals.jsx`  | `handleGoalSubmit`        | Add performance goal                |
| `FeedbackWidget.jsx`    | `handleFeedbackSubmit`    | Submit feedback form                |
| `ServiceLogModal.jsx`   | `handleServiceLogSubmit`  | Log service record                  |
| `TrackTimeLogModal.jsx` | `handleLapTimeSubmit`     | Log lap time                        |
| `DynoLogModal.jsx`      | `handleDynoRunSubmit`     | Log dyno result                     |
| `ShareBuildModal.jsx`   | `handleShareSubmit`       | Share build to community            |
| `VehicleHealthCard.jsx` | `handleHealthFieldChange` | Update health field                 |
| `AskALButton.jsx`       | `handleAskALClick`        | Navigate to AL chat                 |
| `CarActionMenu.jsx`     | `handleCarActionClick`    | Handle car action (own/fav/compare) |

### Database Naming

All PostgreSQL entities use **snake_case**:

| Entity    | Convention         | Example                 |
| --------- | ------------------ | ----------------------- |
| Tables    | snake_case, plural | `car_issues`            |
| Columns   | snake_case         | `created_at`            |
| Indexes   | `idx_table_column` | `idx_cars_slug`         |
| Functions | snake_case         | `get_car_ai_context_v2` |

### Subscription Tier Naming Convention

**IMPORTANT:** The subscription system uses a dual naming convention:

| Tier ID (Code/Database) | Display Name (UI/Marketing) | Monthly   | Annual  | Max Cars |
| ----------------------- | --------------------------- | --------- | ------- | -------- |
| `free`                  | Free                        | $0        | -       | 1        |
| `collector`             | **Enthusiast**              | $9.99/mo  | $79/yr  | 3        |
| `tuner`                 | **Pro**                     | $19.99/mo | $149/yr | ∞        |

**Usage Rules:**

- **In code, APIs, and database:** Always use tier IDs (`free`, `collector`, `tuner`)
- **In user-facing UI and emails:** Use display names (`Free`, `Enthusiast`, `Tuner`)

```javascript
// ✅ CORRECT: Database/code uses tier ID
const userTier = user.subscription_tier; // 'collector'
if (userTier === 'collector') { ... }

// ✅ CORRECT: UI displays marketing name
const TIER_DISPLAY_NAMES = { free: 'Free', collector: 'Enthusiast', tuner: 'Tuner' };
<span>{TIER_DISPLAY_NAMES[tier]}</span> // Shows "Enthusiast"

// ❌ WRONG: Using display name in code logic
if (userTier === 'Enthusiast') { ... } // Will never match!
```

**Reference Files:**

- `lib/stripe.js` → `SUBSCRIPTION_TIERS` maps tier IDs to display names
- `hooks/useSubscription.js` → `TIER_NAMES` for UI display

### Product Analytics (PostHog)

**Provider:** `PostHogProvider` is nested within `AuthProvider` (see Provider Hierarchy below)
**Hook:** `usePostHog()` - Access PostHog instance

**Features:**

- Product analytics with event tracking
- Session replay for debugging user issues
- Feature flags for A/B testing
- User identification linked to Supabase auth

**Required Environment Variables:**

```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com  # Optional, defaults to US
```

**Usage:**

```javascript
import { usePostHog } from '@/components/providers/PostHogProvider';

function MyComponent() {
  const { capture, isReady } = usePostHog();

  const handleClick = () => {
    capture('Button Clicked', { button_name: 'cta' });
  };
}
```

**Automatic Tracking:**

- Page views (SPA-aware)
- User identification on auth state change
- Session replay (with privacy masking)

---

### North Star Metric & Metrics Framework

**North Star Metric: Weekly Active Users (WAU)**

WAU is our primary success metric because it balances:

- **Frequency**: More meaningful than monthly metrics for habit formation
- **Engagement**: Captures actual usage, not just signups
- **Growth**: Leading indicator of long-term retention

**Definition:** A user who has visited the app at least once in the last 7 days.

**Input Metrics (Leading Indicators):**

| Metric                   | Target        | Rationale               |
| ------------------------ | ------------- | ----------------------- |
| Daily Active Users (DAU) | Growing       | Short-term engagement   |
| Sessions per User        | > 2/week      | Repeat value discovery  |
| Onboarding Completion    | > 70%         | First-time user success |
| AL Conversations Started | > 1/user/week | Core feature adoption   |
| Builds Created           | Growing       | Investment in platform  |

**Lagging Indicators:**

| Metric                          | Target        | Description       |
| ------------------------------- | ------------- | ----------------- |
| Monthly Recurring Revenue (MRR) | Growing       | Business health   |
| D7/D30 Retention                | > 40% / > 20% | User stickiness   |
| Net Promoter Score (NPS)        | > 30          | User satisfaction |
| Churn Rate                      | < 5%/month    | Revenue stability |

**AARRR Funnel (Pirate Metrics):**

1. **Acquisition**: How users find AutoRev (landing page visits)
2. **Activation**: First "aha" moment (onboarding completion, first AL chat)
3. **Retention**: Users coming back (D1/D7/D30 retention)
4. **Revenue**: Converting to paid (checkout completion)
5. **Referral**: Users inviting others (referral signups)

**Dashboard Location:** `/admin` → Analytics tab → Executive Insights

---

### Analytics Event Naming

**Format:** "Object + Past-Tense Verb" in **Title Case**

```javascript
// ✅ CORRECT: Title Case, Object + Past-Tense Verb
trackEvent('Signup Completed', { method: 'email' });
trackEvent('Car Viewed', { car_slug: 'bmw-m3' });
trackEvent('Build Project Saved', { car_id: '...' });
trackEvent('Landing Page CTA Clicked', { cta: 'Get Started' });

// ❌ WRONG: snake_case
trackEvent('signup_completed', { method: 'email' });
trackEvent('car_viewed', { car_slug: 'bmw-m3' });
```

**Property Naming:** Use snake_case for all event properties.

**Central Constants:** All events defined in `lib/analytics/events.js` → `EVENTS`

**Schema Versioning:** All events include `schema_version` property (currently `'1.0'`) for backwards-compatible event evolution.

**Key Events:**

| Event Name                 | Fires When                       |
| -------------------------- | -------------------------------- |
| `Signup Completed`         | User creates account             |
| `Car Viewed`               | User views car detail page       |
| `Build Project Saved`      | User saves a build project       |
| `AL Conversation Started`  | User sends first AL message      |
| `Checkout Completed`       | User completes payment           |
| `Landing Page CTA Clicked` | User clicks landing page CTA     |
| `Funnel Step Completed`    | User completes a funnel step     |
| `Experiment Viewed`        | User exposed to A/B test variant |
| `Experiment Converted`     | User converts in A/B test        |

### Funnel Tracking

Track user journeys through multi-step flows using the funnel tracking utilities.

**Pre-defined Funnels (`FUNNELS`):**

- `signup` - User registration flow
- `onboarding` - Post-signup onboarding
- `checkout` - Subscription checkout
- `build_creation` - Build project creation
- `garage_addition` - Vehicle addition to garage
- `al_conversation` - AL chat interaction

**Usage:**

```javascript
import { trackFunnelStep, FUNNELS, trackSignupFunnel } from '@/lib/analytics';

// Manual funnel tracking
trackFunnelStep(1, 'Email Entered', FUNNELS.SIGNUP);
trackFunnelStep(2, 'Password Created', FUNNELS.SIGNUP);
trackFunnelStep(3, 'Profile Completed', FUNNELS.SIGNUP);

// Pre-built tracker (equivalent to above)
trackSignupFunnel(1, 'Email Entered');
trackSignupFunnel(2, 'Password Created');

// With additional properties
trackFunnelStep(1, 'Cart Viewed', FUNNELS.CHECKOUT, { cart_value: 299 });
```

**Pre-built Funnel Trackers:**

- `trackSignupFunnel(step, stepName, props?)`
- `trackOnboardingFunnel(step, stepName, props?)`
- `trackCheckoutFunnel(step, stepName, props?)`
- `trackBuildCreationFunnel(step, stepName, props?)`

### Accessibility Requirements (WCAG 2.1 AA)

**Touch Targets (NON-NEGOTIABLE):**

Every interactive element must have a minimum **44×44px** touch target.

```css
/* ✅ CORRECT: Button with proper touch target */
.button {
  min-height: 44px;
  min-width: 44px;
}

/* ✅ CORRECT: Icon button with expanded tap area */
.iconButton {
  width: 44px;
  height: 44px;
  padding: 10px; /* Icon is smaller, tap area is 44px */
}

/* ❌ WRONG: Touch target too small */
.smallButton {
  height: 32px; /* VIOLATION */
}
```

**Focus States (NON-NEGOTIABLE):**

All interactive elements must have visible `:focus-visible` styles.

> **Utility Classes**: Use classes from `styles/utilities/focus.css` (imported globally):
>
> - `.focusRing` - Standard focus ring for buttons
> - `.focusRingLight` - Light variant for dark backgrounds
> - `.focusInput` - Focus style for form inputs
> - `.focusWithin` - Parent focus indicator

```css
/* ✅ CORRECT: Visible focus state */
.button:focus-visible {
  outline: 2px solid var(--color-accent-lime, #d4ff00);
  outline-offset: 2px;
}

/* ✅ CORRECT: Use utility class */
.button {
  composes: focusRing from 'styles/utilities/focus.css';
}
```

**Custom Interactive Elements (NON-NEGOTIABLE):**

Clickable non-button elements (like cards, list items) must be keyboard accessible:

```jsx
// ✅ CORRECT: Clickable div with keyboard support
<div
  className={styles.card}
  onClick={() => handleSelect(item)}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect(item);
    }
  }}
  tabIndex={0}
  role="button"
  aria-label={`Select ${item.name}`}
>
  {/* content */}
</div>

// ❌ WRONG: Clickable div without keyboard support
<div className={styles.card} onClick={() => handleSelect(item)}>
  {/* inaccessible to keyboard users */}
</div>
```

**CSS for custom interactive elements:**

```css
/* Focus state for clickable cards/items */
.card:focus {
  outline: none;
  border-color: var(--brand-teal);
  box-shadow: 0 0 0 2px rgba(var(--brand-teal-rgb), 0.3);
}

.card:focus-visible {
  outline: none;
  border-color: var(--brand-teal);
  box-shadow: 0 0 0 2px rgba(var(--brand-teal-rgb), 0.3);
}
```

**Form Inputs:**

| Field Type                         | Required Attributes                                              |
| ---------------------------------- | ---------------------------------------------------------------- |
| Email                              | `type="email"` `inputMode="email"` `autoComplete="email"`        |
| Password                           | `type="password"` `autoComplete="current-password"`              |
| New Password                       | `type="password"` `autoComplete="new-password"`                  |
| Search/Filter                      | `type="text"` `autoComplete="off"`                               |
| Phone                              | `type="tel"` `inputMode="tel"` `autoComplete="tel"`              |
| ZIP Code                           | `type="text"` `inputMode="numeric"` `autoComplete="postal-code"` |
| URL                                | `type="url"` `inputMode="url"`                                   |
| Whole Numbers (HP, mileage)        | `type="number"` `inputMode="numeric"`                            |
| Decimal Numbers (boost PSI, times) | `type="number"` `inputMode="decimal"`                            |
| Currency/Amount                    | `type="number"` `inputMode="decimal"` `step="0.01"`              |

**Mobile Keyboard Optimization:**

Use `inputMode` to show appropriate mobile keyboards:

- `inputMode="email"` - Email keyboard with @ symbol
- `inputMode="tel"` - Phone number keypad
- `inputMode="numeric"` - Number pad (for whole numbers like HP, mileage, ZIP)
- `inputMode="decimal"` - Number pad with decimal (for currency, times, PSI)
- `inputMode="url"` - URL keyboard with .com shortcut

**Implemented In:**

- Settings page ZIP code: `inputMode="numeric"` + `autoComplete="postal-code"`
- Dyno log HP/TQ: `inputMode="numeric"`, Boost PSI: `inputMode="decimal"`
- Performance goals: `inputMode="decimal"` (supports lap times with decimals)
- Cost input: `inputMode="decimal"` (currency amounts)
- Event submit URL: `inputMode="url"`

**Responsive Utility Classes:**

> **Breakpoint Variables** (from `styles/utilities/breakpoints.css`, imported globally):
>
> - `--breakpoint-sm`: 640px
> - `--breakpoint-md`: 768px
> - `--breakpoint-lg`: 1024px
> - `--breakpoint-xl`: 1280px
> - `--breakpoint-2xl`: 1536px
>
> **Utility Classes:**
>
> - `.hideOnMobile` / `.showOnMobile` - Mobile visibility toggles
> - `.hideOnTablet` / `.showOnTablet` - Tablet visibility toggles
> - `.desktopOnly` / `.mobileOnly` - Device-specific visibility

**Error States (ARIA):**

```jsx
// ✅ CORRECT: Error message with ARIA announcements
{
  error && (
    <div role="alert" aria-live="assertive" className={styles.error}>
      {error}
    </div>
  );
}

// ✅ CORRECT: Input with error state
<input
  type="email"
  aria-describedby={error ? 'email-error' : undefined}
  aria-invalid={error ? 'true' : undefined}
/>;
{
  error && (
    <span id="email-error" role="alert">
      {error}
    </span>
  );
}
```

**Minimum Input Height:** All form inputs must be **44px (h-11)** for touch accessibility.

**Semantic Tables for Data Display:**

When displaying key-value data (specs, settings, comparisons), use semantic HTML tables for screen reader accessibility:

```jsx
// ✅ CORRECT: Semantic table with proper structure
function SpecTable({ caption, children }) {
  return (
    <table className={styles.specTable} aria-label={caption}>
      <caption className={styles.srOnly}>{caption}</caption>
      <thead className={styles.srOnly}>
        <tr>
          <th scope="col">Specification</th>
          <th scope="col">Value</th>
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

function SpecRow({ label, value, unit = '' }) {
  const displayValue = value ?? '—'; // Show em-dash for missing values
  return (
    <tr>
      <th scope="row">{label}</th>
      <td>{displayValue}{displayValue !== '—' && unit ? ` ${unit}` : ''}</td>
    </tr>
  );
}

// Usage
<SpecTable caption="Performance specifications">
  <SpecRow label="Horsepower" value={car.hp} unit="HP" />
  <SpecRow label="Torque" value={car.torque} unit="lb-ft" />
</SpecTable>

// ❌ WRONG: Divs for tabular data (inaccessible to screen readers)
<div className={styles.specItem}>
  <span>Horsepower</span>
  <span>{car.hp} HP</span>
</div>
```

**CSS for visually hidden but accessible content:**

```css
/* Screen reader only - visually hidden but accessible */
.srOnly {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

**Error State with Retry (Data Fetching):**

When data fetching fails, show an error state with a retry button:

```jsx
// ✅ CORRECT: Error state with retry and proper ARIA
function ErrorState({ error, onRetry, title = 'Something went wrong' }) {
  return (
    <div role="alert" aria-live="assertive" className={styles.errorState}>
      <h3>{title}</h3>
      <p>{error?.message || 'Failed to load data. Please try again.'}</p>
      {onRetry && (
        <button onClick={onRetry} aria-label="Retry loading data">
          Try Again
        </button>
      )}
    </div>
  );
}

// Usage with React Query hooks
const { data, error, refetch } = useCarBySlug(slug);

if (error) {
  return <ErrorState error={error} onRetry={refetch} />;
}
```

**Implemented Examples:**

- `/garage/my-specs` - Semantic tables for all spec cards, error state with retry

### Color Variable Reference

**NEVER hardcode colors.** Always use CSS variables with fallbacks. Full mapping in `scripts/color-token-map.json`.

**Background Hierarchy (6 Levels):**

AutoRev uses a **6-level background system** for premium visual hierarchy. See `docs/BRAND_GUIDELINES.md` for full details.

| Level            | Hex                      | CSS Variable                    | Brand Alias            | Usage                                          |
| ---------------- | ------------------------ | ------------------------------- | ---------------------- | ---------------------------------------------- |
| **1. Immersive** | `#050a12`                | `var(--color-bg-immersive)`     | `--brand-bg-immersive` | Media galleries, video players, splash screens |
| **2. Base**      | `#0d1b2a`                | `var(--color-bg-base)`          | `--brand-bg-primary`   | Main app pages, navigation                     |
| **3. Overlay**   | `#1a1a1a`                | `var(--color-bg-overlay-solid)` | `--brand-bg-overlay`   | Full-screen modals, onboarding, questionnaires |
| **4. Elevated**  | `#1b263b`                | `var(--color-bg-elevated)`      | `--brand-bg-secondary` | Cards, panels, small modals                    |
| **5. Surface**   | `rgba(255,255,255,0.04)` | `var(--color-bg-surface)`       | `--brand-bg-surface`   | Card fills, subtle grouping                    |
| **6. Input**     | `rgba(255,255,255,0.06)` | `var(--color-bg-input)`         | `--brand-bg-input`     | Form fields, search bars                       |

**Background Decision Tree:**

```
Media/gallery content? → IMMERSIVE (#050a12)
Full-screen modal/onboarding? → OVERLAY (#1a1a1a)
Card, panel, or small modal? → ELEVATED (#1b263b)
Form field or input? → INPUT (rgba 6%)
Otherwise → BASE (#0d1b2a)
```

**Legacy Mappings (for migration):**
| Hex Values | CSS Variable | Usage |
|------------|--------------|-------|
| `#0a1628`, `#0f172a`, `#111827`, `#000000` | `var(--color-bg-base)` | Map to base |
| `#1a2332`, `#1e293b`, `#1f2937` | `var(--color-bg-elevated)` | Map to elevated |
| `#f8fafc`, `#f9fafb`, `#f3f4f6`, `#f1f5f9`, `#f7f7f7` | `var(--color-bg-muted)` | Light mode backgrounds |

**Text:**
| Hex Values | CSS Variable | Usage |
|------------|--------------|-------|
| `#ffffff`, `#fff` | `var(--color-text-primary)` | Primary text |
| `#94a3b8`, `#9ca3af`, `#cccccc` | `var(--color-text-secondary)` | Secondary text |
| `#64748b`, `#6b7280`, `#607d8b` | `var(--color-text-tertiary)` | Tertiary text |
| `#475569`, `#334155`, `#4b5563`, `#374151` | `var(--color-text-muted)` | Muted text |

**Core 4 Accents (Primary Brand Colors):**
| Hex Values | CSS Variable | Usage |
|------------|--------------|-------|
| `#d4ff00` | `var(--color-accent-lime)` | Primary CTAs |
| `#bfe600`, `#c8f000`, `#a8cc00` | `var(--color-accent-lime-dark)` | Hover states |
| `#10b981`, `#059669`, `#047857`, `#0d9488` | `var(--color-accent-teal)` | Success, active |
| `#34d399`, `#14b8a6`, `#22d3ee` | `var(--color-accent-teal-light)` | Teal variants |
| `#3b82f6`, `#2563eb`, `#1d4ed8`, `#007bff` | `var(--color-accent-blue)` | Links, info |
| `#60a5fa`, `#93c5fd`, `#a5b4fc` | `var(--color-accent-blue-light)` | Blue variants |
| `#f59e0b`, `#d97706`, `#b45309`, `#e67e22` | `var(--color-accent-amber)` | Warnings |
| `#fbbf24`, `#ffe066` | `var(--color-accent-amber-light)` | Amber variants |

**Extended Category Colors (Dashboard & Gamification):**
| Hex Values | CSS Variable | Usage |
|------------|--------------|-------|
| `#a855f7` | `var(--color-accent-purple)` | AL assistant category |
| `#c084fc` | `var(--color-accent-purple-light)` | Purple variants |
| `#ec4899` | `var(--color-accent-pink)` | Profile category |
| `#f472b6` | `var(--color-accent-pink-light)` | Pink variants |
| `#ef4444` | `var(--color-accent-red)` | Danger states, high tier callsigns |
| `#f87171` | `var(--color-accent-red-light)` | Red variants |

**Info (Legacy):**
| Hex Values | CSS Variable | Usage |
|------------|--------------|-------|
| `#8b5cf6`, `#7c3aed`, `#a78bfa`, `#9b59b6` | `var(--color-info)` | Info, purple tier |

**Semantic:**
| Hex Values | CSS Variable | Usage |
|------------|--------------|-------|
| `#22c55e`, `#16a34a`, `#15803d`, `#28a745`, `#34c759` | `var(--color-success)` | Success states |
| `#4ade80`, `#a7f3d0`, `#d4edda`, `#f0fdf4` | `var(--color-success-light)` | Success backgrounds |
| `#ef4444`, `#dc2626`, `#b91c1c`, `#e94560`, `#ff6b6b` | `var(--color-error)` | Error states |
| `#fef2f2`, `#fecaca`, `#f8d7da` | `var(--color-error-light)` | Error backgrounds |

**Borders:**
| Hex Values | CSS Variable | Usage |
|------------|--------------|-------|
| `#e5e7eb`, `#e2e8f0`, `#e0e0e0`, `#dddddd` | `var(--color-border-subtle)` | Subtle borders |
| `#d1d5db`, `#cbd5e1`, `#d4d4d4` | `var(--color-border-default)` | Default borders |

**Paired Surface Tokens (for theming):**
| Variable | Value | Usage |
|----------|-------|-------|
| `--color-card` | `var(--color-bg-card)` | Card background |
| `--color-card-foreground` | `var(--color-text-primary)` | Card text |
| `--color-popover` | `var(--color-bg-elevated)` | Popover/dropdown background |
| `--color-popover-foreground` | `var(--color-text-primary)` | Popover text |
| `--color-muted` | `var(--color-bg-input)` | Muted surface background |
| `--color-muted-foreground` | `var(--color-text-tertiary)` | Muted surface text |

**Pattern with fallback:**

```css
/* ✅ CORRECT: Variable with fallback */
.button {
  background: var(--color-accent-lime, #d4ff00);
  color: var(--color-text-primary, #ffffff);
}

/* ❌ WRONG: Hardcoded hex */
.button {
  background: #d4ff00;
  color: #ffffff;
}
```

> **See Also**: `scripts/color-token-map.json` has 195 color mappings with all variants.

---

## Anti-Patterns & Common Mistakes

### ❌ Database Anti-Patterns

| Anti-Pattern                            | Why It's Wrong                          | Correct Pattern                   |
| --------------------------------------- | --------------------------------------- | --------------------------------- |
| Query by `car_slug`                     | No index, FK relationships use `car_id` | Use `resolveCarId(slug)` first    |
| Direct Supabase in components           | Bypasses caching, auth, error handling  | Use service files or providers    |
| Multiple `.from()` calls                | N+1 query problem                       | Use RPC functions or joins        |
| Creating duplicate tables               | Data gets out of sync                   | Check DATABASE.md first           |
| `Promise.all(data.map(async => query))` | N+1: N queries in parallel              | Use RPC with join or batch query  |
| Loop with `await supabase.update()`     | N sequential updates                    | Use batch RPC or `.in('id', ids)` |
| `select('*')` in core services          | Fetches unused columns, slower          | Select specific fields needed     |

**N+1 Query Pattern (CRITICAL)**:

```javascript
// ❌ WRONG: N+1 pattern - makes 21 queries for 20 items
const itemsWithDetails = await Promise.all(
  items.map(async (item) => {
    const { data } = await supabase.from('details').select('*').eq('item_id', item.id);
    return { ...item, detail: data[0] };
  })
);

// ✅ CORRECT: Use RPC with lateral join (1 query)
const { data } = await supabase.rpc('get_items_with_details', { p_user_id: userId });

// ✅ CORRECT: Or use join in single query
const { data } = await supabase.from('items').select('*, details!inner(*)').eq('user_id', userId);
```

**Column Selection Pattern (CRITICAL)**:

```javascript
// ❌ WRONG: Fetches all columns, slower and wastes bandwidth
const { data } = await supabase.from('user_feedback').select('*').eq('user_id', userId);

// ✅ CORRECT: Define columns constant, select only what's needed
const FEEDBACK_COLS = 'id, user_id, category, title, description, status, created_at';

const { data } = await supabase.from('user_feedback').select(FEEDBACK_COLS).eq('user_id', userId);
```

**Intentional Exceptions** (where `select('*')` is acceptable):
| File | Reason |
|------|--------|
| `lib/carsClient.js` | Car detail pages need 100+ columns; explicit list would be unmaintainable |
| `lib/carsCache.js` | Server-side car cache for detail views - same reason |
| `lib/scrapeJobService.js` | Background enrichment jobs need full car data |
| `scripts/*.js` | Development/admin scripts (not user-facing) |

**car_slug Resolution Pattern**:

```javascript
// ✅ CORRECT: Resolve car_id, use it, fallback if needed
import { resolveCarId } from '@/lib/carResolver';

if (carSlug) {
  const carId = await resolveCarId(carSlug);
  if (carId) {
    query = query.eq('car_id', carId); // Uses index
  } else {
    // Fallback only if car not in database (edge case)
    console.warn('Could not resolve car_id for slug:', carSlug);
    query = query.eq('car_slug', carSlug);
  }
}
```

**Available Database RPCs** (use instead of client-side joins):
| RPC | Purpose | Replaces |
|-----|---------|----------|
| `get_car_ai_context_v2` | Full car context for AL | Multiple car table joins |
| `get_car_tuning_context` | Tuning data for car | Tuning profile + issues joins |
| `get_user_conversations_with_preview` | Conversations with first message | N+1 message preview queries |
| `batch_resolve_feedback` | Batch update feedback items | N sequential updates |

### ❌ Performance Calculation Anti-Patterns

| Anti-Pattern                                                     | Why It's Wrong                                                 | Correct Pattern                                  |
| ---------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------ |
| Creating new HP calculator                                       | Results diverge, user sees different HP in different places    | Use `lib/performanceCalculator`                  |
| `hpGain += upgrade.metricChanges.hpGain`                         | Ignores category caps, diminishing returns, tune overlap       | Use `calculateSmartHpGain()`                     |
| `import { calculateAllModificationGains } from '@/lib/upgrades'` | DEPRECATED, doesn't use smart calculator                       | Import from `@/lib/performanceCalculator`        |
| **Using stored `totalHpGain` / `currentHpGain`**                 | **Stored values become stale when calculation logic improves** | **ALWAYS recalculate dynamically**               |
| Hardcoding HP values                                             | Different from database, gets outdated                         | Pull stock from `cars.hp`, gains from calculator |
| Reading `user_vehicles.total_hp_gain` for display                | Database has stale value from when mods were installed         | Calculate from `installedModifications` array    |
| Reading `user_projects.total_hp_gain` for display                | Database has stale value from when build was saved             | Calculate from `selected_upgrades` array         |

**⚠️ CRITICAL: Never Use Stored HP Values for Display**

The database stores `total_hp_gain` on vehicles and builds for historical tracking and legacy purposes only.
**These values become stale** when:

- The calculation algorithm improves (e.g., adding category caps, tune overlap handling)
- Upgrade definitions change (hp values, categories)
- New features are added (diminishing returns, engine-specific multipliers)

**Always calculate HP dynamically** using the installed mods and the car object.

```javascript
// ❌ WRONG: Different pages calculate HP differently
// page1:
const hp = car.hp + mods.reduce((a, m) => a + m.hpGain, 0);
// page2:
const hp = calculateSmartHpGain(car, mods).projectedHp;

// ❌ WRONG: Using deprecated import
import { calculateAllModificationGains } from '@/lib/upgrades'; // DEPRECATED!

// ❌ WRONG: Using stored values from database
const hpGain = item.build?.totalHpGain ?? calculatedGains.hpGain; // NO!
const hpGain = currentBuild?.totalHpGain || 0; // NO!
const hpGain = vehicle.total_hp_gain || 0; // NO!
const hpGain = buildProgress.currentHpGain || 0; // NO!

// ✅ CORRECT: Always use performanceCalculator, always calculate dynamically
import { calculateSmartHpGain, calculateAllModificationGains } from '@/lib/performanceCalculator';

// Option 1: Full smart calculation with all features
const { totalGain } = calculateSmartHpGain(car, selectedUpgrades);

// Option 2: Simple wrapper (uses calculateSmartHpGain internally)
const { hpGain } = calculateAllModificationGains(upgradeKeys, car);

// Option 3: Full performance profile with all metrics
const profile = getPerformanceProfile(car, upgradeKeys);
const hpGain = profile.upgradedMetrics.hp - profile.stockMetrics.hp;
```

### ❌ Component Anti-Patterns

| Anti-Pattern                           | Why It's Wrong                                     | Correct Pattern                                      |
| -------------------------------------- | -------------------------------------------------- | ---------------------------------------------------- |
| Creating new icon files                | Inconsistent icons, larger bundle                  | Use `Icons` from `@/components/ui/Icons`             |
| Inline styles with hex colors          | Bypasses design tokens                             | Use CSS variables `var(--color-*)`                   |
| Inline styles with static values       | Creates new object each render, harder to maintain | Move to CSS module class                             |
| Duplicate modal components             | Inconsistent UX                                    | Use `Modal` from `@/components/ui`                   |
| New button styles                      | Brand inconsistency                                | Compose from `styles/components/buttons.css`         |
| Native `<img>` tag                     | No optimization, no lazy loading, no srcset        | Use `next/image` `<Image>` component                 |
| **`LoadingSpinner` for data fetching** | Causes layout shift, poor UX                       | Use `Skeleton` components that match content shape   |
| `console.log` in production code       | Clutters console, exposes internals                | Remove or use `console.error` for actual errors only |

**Loading State Pattern**:

```jsx
// ❌ WRONG: Generic spinner causes layout shift
if (isLoading) {
  return <LoadingSpinner fullPage />;
}

// ✅ CORRECT: Skeleton matches the final content shape
import { Skeleton, ListSkeleton } from '@/components/ui';

if (isLoading) {
  return (
    <div className={styles.loadingSkeleton}>
      <Skeleton width={180} height={24} variant="rounded" />
      <ListSkeleton count={5} />
    </div>
  );
}
```

**Unsaved Changes Pattern** (for pages with save functionality):

```jsx
// ✅ CORRECT: Warn users before leaving with unsaved changes
useEffect(() => {
  const handleBeforeUnload = (e) => {
    if (hasUnsavedChanges && saveStatus === 'saving') {
      e.preventDefault();
      e.returnValue = '';
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [hasUnsavedChanges, saveStatus]);
```

**Image Optimization Pattern**:

```jsx
// ❌ WRONG: Native <img> - no optimization, no lazy loading
<img src={car.imageHeroUrl} alt={car.name} />

// ✅ CORRECT: Next.js Image with fill + sizes
import Image from 'next/image';

<Image
  src={car.imageHeroUrl}
  alt={car.name}
  fill
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px"
  className={styles.heroImage}
/>

// ✅ CORRECT: Hero/LCP images with priority
<Image
  src={heroImage}
  alt="Hero"
  fill
  priority  // Load immediately for LCP
  sizes="100vw"
/>
```

**Intentional `<img>` Exceptions** (where native `<img>` is acceptable):
| File | Reason |
|------|--------|
| `components/FeedbackWidget.jsx` | Inside `document.write()` - cannot use React components |
| `components/LocationAutocomplete.jsx` | Google Maps attribution - external compliance requirement |

**Inline Style Pattern**:

```jsx
// ❌ WRONG: Static colors/transforms in inline styles
<div style={{ background: '#a855f7', textTransform: 'capitalize' }}>

// ✅ CORRECT: Move static values to CSS, keep only dynamic values inline
// In CSS module:
.barAl { background: #a855f7; }
.textCapitalize { text-transform: capitalize; }

// In JSX:
<div className={`${styles.barSegment} ${styles.barAl}`} style={{ height: `${dynamicPercent}%` }}>
```

### ❌ CSS Anti-Patterns

| Anti-Pattern                   | Why It's Wrong                              | Correct Pattern                          |
| ------------------------------ | ------------------------------------------- | ---------------------------------------- |
| Hardcoded hex colors           | No theme consistency, manual updates        | Use `var(--color-*, #fallback)`          |
| **Circular CSS variable refs** | Variables fail to resolve, breaks styling   | Define tokens with direct values         |
| Desktop-first media queries    | Mobile gets override cruft                  | Use `min-width` (mobile-first)           |
| `@media (max-width: 767px)`    | Desktop-first pattern                       | Use `@media (min-width: 768px)`          |
| **`max-width: 100vw`**         | iOS Safari bug - causes horizontal overflow | Use `max-width: 100%` instead            |
| Touch targets < 44px           | Accessibility violation                     | `min-height: 44px; min-width: 44px;`     |
| No `:focus-visible` styles     | Keyboard users can't see focus              | Add visible focus outline                |
| Missing `inputMode` on inputs  | Wrong mobile keyboard                       | Add `inputMode="email"` etc.             |
| Missing ARIA on errors         | Screen readers miss errors                  | Add `role="alert" aria-live="assertive"` |

```css
/* ❌ WRONG: Circular variable reference - breaks CSS entirely! */
:root {
  --color-bg-base: var(--color-bg-base, #0d1b2a); /* Self-referential! */
}

/* ✅ CORRECT: Direct value in token definition file */
:root {
  --color-bg-base: #0d1b2a; /* Defined once in styles/tokens/colors.css */
}

/* ✅ CORRECT: Reference token with fallback in consumer files */
.component {
  background: var(--color-bg-base, #0d1b2a); /* References token, not itself */
}
```

```css
/* ❌ WRONG: Desktop-first with max-width */
.button {
  padding: 32px;
}
@media (max-width: 767px) {
  .button {
    padding: 16px;
  }
}

/* ✅ CORRECT: Mobile-first with min-width */
.button {
  padding: 16px;
}
@media (min-width: 768px) {
  .button {
    padding: 32px;
  }
}

/* ❌ WRONG: Hardcoded color */
.text {
  color: #94a3b8;
}

/* ✅ CORRECT: Token with fallback */
.text {
  color: var(--color-text-secondary, #94a3b8);
}
```

```css
/* ❌ WRONG: 100vw causes horizontal overflow on iOS Safari */
/* iOS Safari includes scrollbar width in 100vw, even when no scrollbar exists */
html {
  max-width: 100vw; /* Can be ~15-20px wider than visible viewport! */
}

.page {
  width: 100%;
  max-width: 100vw; /* Causes page to extend past phone frame */
}

/* ✅ CORRECT: Use 100% instead of 100vw for width constraints */
html {
  max-width: 100%;
  overflow-x: clip;
}

.page {
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
}
```

> **Note**: This iOS Safari bug was fixed in January 2026 across 7 files including `globals.css`,
> garage subpages, `EventFilters.module.css`, and `UpgradeCenter.module.css`.

### ❌ State Management Anti-Patterns

| Anti-Pattern                              | Why It's Wrong                                           | Correct Pattern                               |
| ----------------------------------------- | -------------------------------------------------------- | --------------------------------------------- |
| Direct Supabase for user data             | Bypasses provider caching/auth                           | Use `useOwnedVehicles()`, `useFavorites()`    |
| Multiple sources for same data            | State gets out of sync                                   | Single provider per domain                    |
| localStorage for auth state               | Security issues                                          | Use `AuthProvider`                            |
| Prop drilling user data                   | Messy, error-prone                                       | Use context providers                         |
| Unmemoized context values                 | Causes all consumers to re-render on every parent render | Wrap `value` in `useMemo()`                   |
| Duplicate query key factories             | Cache inconsistencies                                    | Use `lib/queryKeys.js` only                   |
| `try/catch` on provider methods           | Provider methods return `{ data, error }`, don't throw   | Check `const { error } = await ...`           |
| Skipping state update when `data` is null | Parts-only updates return `data: null` but still succeed | Check `if (!error)` not `if (!error && data)` |

### ❌ API Route Anti-Patterns

| Anti-Pattern                                  | Why It's Wrong                     | Correct Pattern                                  |
| --------------------------------------------- | ---------------------------------- | ------------------------------------------------ |
| No auth check on user routes                  | Security vulnerability             | Use `createServerSupabaseClient()` + `getUser()` |
| No IDOR check on `/users/[userId]` routes     | Users can access other users' data | Check `user.id !== userId`                       |
| Returning `error.message` to clients          | Exposes internal details           | Use generic messages, log actual error           |
| Local `verifyAdmin` functions in admin routes | Inconsistent auth                  | Use `requireAdmin()` from `lib/adminAccess.js`   |
| Direct `export async function GET/POST`       | No error tracking                  | Use `withErrorLogging()` wrapper                 |
| No input validation on mutations              | Accepts malformed data             | Use Zod schemas from `lib/schemas`               |
| No rate limiting on mutations                 | Abuse potential                    | Use `rateLimit()` from `lib/rateLimit.js`        |
| Returning full user objects                   | Exposes sensitive data             | Select specific fields                           |
| Hardcoded response data                       | Gets stale                         | Query database                                   |

### ❌ File Organization Anti-Patterns

| Anti-Pattern                 | Why It's Wrong           | Correct Pattern                |
| ---------------------------- | ------------------------ | ------------------------------ |
| Creating `utils/helpers.js`  | Becomes junk drawer      | Add to domain-specific service |
| New folder for single file   | Unnecessary complexity   | Use existing folder            |
| Duplicate service files      | Logic diverges           | Extend existing service        |
| Not updating SOURCE_OF_TRUTH | Others create duplicates | Add new files to this doc      |

### Common Bug Scenarios and Fixes

**Bug**: "HP shows different values on different pages"

```javascript
// CAUSE: Multiple calculation methods
page1: const hp = car.hp + mods.reduce((a, m) => a + m.hpGain, 0);
page2: const hp = calculateSmartHpGain(car, mods).projectedHp;

// FIX: Always use performanceCalculator
import { calculateSmartHpGain } from '@/lib/performanceCalculator';
const { projectedHp } = calculateSmartHpGain(car, selectedUpgrades);
```

**Bug**: "Car data not found even though it exists"

```javascript
// CAUSE: Querying by slug instead of ID
const { data } = await supabase.from('car_issues').eq('car_slug', slug);

// FIX: Resolve ID first
import { resolveCarId } from '@/lib/carResolver';
const carId = await resolveCarId(slug);
const { data } = await supabase.from('car_issues').eq('car_id', carId);
```

**Bug**: "User's favorites not updating in real-time"

```javascript
// CAUSE: Bypassing the provider
const { data } = await supabase.from('user_favorites').select('*');

// FIX: Use the provider (only one with real-time subscriptions)
const { favorites } = useFavorites();
```

**Bug**: "Garage score not reflecting changes"

```javascript
// CAUSE: Not triggering recalculation
await supabase.from('user_vehicles').update({ ... });

// FIX: Use the service which triggers score update
import { recalculateScore } from '@/lib/garageScoreService';
await recalculateScore(vehicleId);
```

**Bug**: "Parts status not updating in real-time after marking installed"

```javascript
// CAUSE: Provider methods return { data, error }, not throw on error
// Also: Parts-only updates return data=null (no main table changes)
try {
  await updateBuild(buildId, { selectedParts }); // Wrong: doesn't throw
  // Success code runs even if there was an error!
} catch (err) {
  /* Never catches API errors */
}

// FIX: Check the returned error, not try/catch
const { error } = await updateBuild(buildId, { selectedParts });
if (error) {
  console.error('Failed to update:', error);
  return;
}
// Now safe to show success UI
```

**Bug**: "Provider state not updating after parts-only save"

```javascript
// CAUSE: updateUserProject returns { data: null } for parts-only updates
// because no main table columns change - only user_project_parts table
if (!error && data) {  // data is null, so this block is skipped!
  setBuilds(prev => ...);  // Never runs
}

// FIX: Update state when there's no error, regardless of data
if (!error) {
  setBuilds(prev => prev.map(build => {
    if (build.id === buildId) {
      if (data) {
        // Full update - use response data
        return { ...build, ...transformedData };
      } else {
        // Parts-only update - merge just the parts
        return { ...build, parts: updates.selectedParts };
      }
    }
    return build;
  }));
}
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        NEXT.JS APP                               │
├─────────────────────────────────────────────────────────────────┤
│  app/                    │  components/                          │
│  ├── (app)/             │  ├── providers/    (React Context)    │
│  │   └── [pages]        │  ├── ui/           (Base components)  │
│  ├── (marketing)/       │  ├── garage/       (Garage features)  │
│  │   └── [pages]        │  ├── tuning-shop/  (Tuning features)  │
│  └── api/               │  └── [feature].jsx (Feature components)│
│      └── [routes]       │                                        │
├─────────────────────────────────────────────────────────────────┤
│                         lib/ (Services)                          │
│  ├── performanceCalculator/  │  ├── carResolver.js              │
│  ├── supabase.js             │  ├── userDataService.js          │
│  ├── scoring.js              │  ├── carsClient.js               │
│  └── [domain]Service.js      │  └── [feature]Calculator.js      │
├─────────────────────────────────────────────────────────────────┤
│  data/                   │  hooks/                               │
│  ├── upgradePackages.js │  ├── useCarData.js                    │
│  ├── performanceCategories.js │  └── use[Feature].js            │
│  └── [static-data].js   │                                        │
├─────────────────────────────────────────────────────────────────┤
│                      SUPABASE (Database)                         │
│  ├── cars, car_issues, car_tuning_profiles                      │
│  ├── user_vehicles, user_favorites, user_projects               │
│  ├── events, community_posts, community_insights                │
│  └── [see Database Tables section]                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

| Directory                    | Purpose                     | When to Add Files Here                       |
| ---------------------------- | --------------------------- | -------------------------------------------- |
| `app/(app)/`                 | Authenticated user pages    | User-facing features requiring auth          |
| `app/(marketing)/`           | Public marketing pages      | Landing pages, feature pages, public content |
| `app/api/`                   | API routes                  | Backend endpoints                            |
| `components/`                | React components            | Reusable UI components                       |
| `components/providers/`      | React Context providers     | Global state management                      |
| `components/ui/`             | Base UI components          | Buttons, inputs, cards, modals               |
| `components/garage/`         | Garage-specific components  | See "Garage Feature Architecture" section    |
| `components/tuning-shop/`    | Tuning shop components      | Parts selector, upgrade tools                |
| `lib/`                       | Services & utilities        | Business logic, API clients, calculations    |
| `lib/performanceCalculator/` | HP/performance calculations | **ONLY** place for performance calcs         |
| `data/`                      | Static data definitions     | Upgrade packages, categories, pricing        |
| `hooks/`                     | Custom React hooks          | Data fetching hooks, state hooks             |
| `styles/`                    | Global CSS & design tokens  | Shared styles, CSS variables                 |
| `types/`                     | TypeScript definitions      | Type definitions                             |

---

## File Relationships Map

### Core Data Flow Dependencies

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE (Components)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │PerformanceHub│  │VirtualDyno │  │LapTimeEst  │  │PowerBreakdown│    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
└─────────┼────────────────┼────────────────┼────────────────┼───────────┘
          │                │                │                │
          ▼                ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         PROVIDERS (State Management)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │OwnedVehicles│  │SavedBuilds │  │CarSelection │  │Favorites   │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
└─────────┼────────────────┼────────────────┼────────────────┼───────────┘
          │                │                │                │
          ▼                ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         SERVICES (lib/)                                  │
│  ┌────────────────────┐  ┌────────────────────┐  ┌─────────────────┐   │
│  │performanceCalculator│  │userDataService.js │  │carResolver.js  │   │
│  │ - calculateSmartHp │  │ - saveBuild()     │  │ - resolveCarId()│   │
│  │ - getMetrics()     │  │ - addVehicle()    │  │                 │   │
│  └─────────┬──────────┘  └─────────┬─────────┘  └────────┬────────┘   │
└────────────┼───────────────────────┼─────────────────────┼─────────────┘
             │                       │                     │
             ▼                       ▼                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATABASE (Supabase)                              │
│  ┌─────────┐  ┌──────────────┐  ┌─────────────┐  ┌────────────────┐   │
│  │cars    │  │user_vehicles │  │user_projects│  │car_track_laps │   │
│  │car_id  │◄─┤matched_car_id│  │car_id      │  │car_id         │   │
│  └─────────┘  └──────────────┘  └─────────────┘  └────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Service File Dependencies

| Service                  | Depends On                               | Used By                            |
| ------------------------ | ---------------------------------------- | ---------------------------------- |
| `performanceCalculator/` | `upgrades.js`, `data/upgradePackages.js` | Components, API routes             |
| `carResolver.js`         | `supabase.js`                            | All car-related services           |
| `userDataService.js`     | `supabase.js`, `carResolver.js`          | Providers                          |
| `carsClient.js`          | `supabase.js`, `carResolver.js`          | Hooks, components                  |
| `lapTimeService.js`      | `supabase.js`                            | `LapTimeEstimator` component       |
| `garageScoreService.js`  | `supabase.js`                            | Garage pages                       |
| `scoring.js`             | `carResolver.js`                         | Car detail pages, scoring displays |

### Provider → Service → Database Flow

| Provider                | Service Used                               | Database Tables  |
| ----------------------- | ------------------------------------------ | ---------------- |
| `OwnedVehiclesProvider` | `userDataService.js`                       | `user_vehicles`  |
| `SavedBuildsProvider`   | `userDataService.js`                       | `user_projects`  |
| `FavoritesProvider`     | `userDataService.js`                       | `user_favorites` |
| `CarSelectionProvider`  | `carSelectionStore.js` (localStorage only) | None             |
| `CompareProvider`       | None (localStorage)                        | None             |

### Component → Provider Dependencies

| Component          | Required Providers                                                                     |
| ------------------ | -------------------------------------------------------------------------------------- |
| `PerformanceHub`   | `CarSelectionProvider`, `SavedBuildsProvider`, `OwnedVehiclesProvider`, `AuthProvider` |
| `VirtualDynoChart` | None (props-based)                                                                     |
| `LapTimeEstimator` | `AuthProvider` (for logging)                                                           |
| `BuildDetailView`  | `SavedBuildsProvider`, `OwnedVehiclesProvider`                                         |
| `GarageHome`       | `OwnedVehiclesProvider`, `FavoritesProvider`, `SavedBuildsProvider`                    |

---

## Feature Modules

### Performance Calculations

**SOURCE OF TRUTH**: `lib/performanceCalculator/`

#### SINGLE CALCULATION PATH (CRITICAL!)

**ALL HP calculations MUST flow through `calculateSmartHpGain()`:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    calculateSmartHpGain()                        │
│         lib/performanceCalculator/hpCalculator.js                │
│                                                                  │
│  HYBRID PHYSICS + RULE-BASED MODEL (Updated 2026-01-24)         │
│                                                                  │
│  ✅ Physics-based percentage gains (% of stock HP)              │
│  ✅ Aspiration detection (NA, Turbo, TwinTurbo, Supercharged)   │
│  ✅ Boost multipliers (Turbo 1.3x, SC 1.15x)                    │
│  ✅ Category caps (exhaust: 50HP NA, tune: 150HP turbo, etc.)   │
│  ✅ Diminishing returns (85% for stacked exhaust mods)          │
│  ✅ Tune hierarchy (Stage 3 supersedes Stage 2)                 │
│  ✅ Overlap detection (tune accounts for hardware)              │
│  ✅ Confidence scoring (Tier 1-4, with labels)                  │
│                                                                  │
│  Returns: stockHp, totalGain, projectedHp, confidence, tier     │
└─────────────────────────────────────────────────────────────────┘
                              │
           ┌──────────────────┴──────────────────┐
           ▼                                      ▼
calculateAllModificationGains()        calculateUpgradedMetrics()
    (calls calculateSmartHpGain)          (calls calculateSmartHpGain)
           │                                      │
           └──────────────────┬──────────────────┘
                              ▼
                    CONSISTENT HP EVERYWHERE
```

| Feature               | File                   | Function                                                              |
| --------------------- | ---------------------- | --------------------------------------------------------------------- |
| **HP gain (PRIMARY)** | `hpCalculator.js`      | `calculateSmartHpGain()`                                              |
| **Torque gain**       | `hpCalculator.js`      | Aspiration-aware (Turbo 1.2x, SC 1.1x, NA 0.95x)                      |
| Modification gains    | `hpCalculator.js`      | `calculateAllModificationGains()` → uses `calculateSmartHpGain`       |
| **All metrics**       | `metricsCalculator.js` | `calculateUpgradedMetrics()` → physics-based                          |
| 0-60 physics          | `metricsCalculator.js` | `estimateZeroToSixty()` - drivetrain/traction model                   |
| 1/4 mile physics      | `metricsCalculator.js` | `estimateQuarterMile()` - ET formula                                  |
| Trap speed physics    | `metricsCalculator.js` | `estimateTrapSpeed()` - WHP-based                                     |
| Braking physics       | `metricsCalculator.js` | `estimateBrakingDistance()` - tire grip aware                         |
| Lateral G physics     | `metricsCalculator.js` | `estimateLateralG()` - tire/suspension/aero                           |
| Weight tracking       | `metricsCalculator.js` | `calculateWeightChange()` - mod weight impacts                        |
| Performance profile   | `scoreCalculator.js`   | `getPerformanceProfile()` → uses `calculateUpgradedMetrics`           |
| Aspiration detection  | `constants.js`         | `detectAspiration(car)` - parses engine string                        |
| Physics gains         | `constants.js`         | `getPhysicsBasedGainPercent(key, aspiration)`                         |
| Upgrade conflicts     | `conflictDetector.js`  | `detectUpgradeConflicts()`, `getConflictSummary()`                    |
| Constants             | `constants.js`         | `STAGE_TUNE_INCLUDED_MODS`, `CATEGORY_CAPS`, `CONFIDENCE_TIERS`, etc. |

#### Confidence Tiers

The calculator returns a confidence score indicating how reliable the estimate is:

| Tier | Confidence | Label       | When Used                                  |
| ---- | ---------- | ----------- | ------------------------------------------ |
| 1    | 90-99%     | Verified    | Dyno-verified data (future: from database) |
| 2    | 70-85%     | Calibrated  | Engine family calibration data             |
| 3    | 55-70%     | Estimated   | Physics model with aspiration detection    |
| 4    | 40-50%     | Approximate | Generic fallback using upgrade definitions |

```javascript
const result = calculateSmartHpGain(car, mods);
console.log(result.confidence); // 0.55-0.70
console.log(result.confidenceLabel); // "Estimated"
console.log(result.tier); // 3
console.log(result.aspiration); // "TwinTurbo"
```

#### Physics Models (Updated 2026-01-25)

All performance metrics now use physics-based calculations instead of simple rule-of-thumb estimates.

##### Torque Calculation

Torque gains are calculated relative to HP gains with aspiration-aware multipliers:

```javascript
// Turbo cars gain more torque than HP due to boost characteristics
const TORQUE_MULTIPLIERS = {
  NA: 0.95, // NA cars gain slightly less torque than HP
  Turbo: 1.2, // Turbo cars gain more torque (low-end boost)
  TwinTurbo: 1.25, // Twin turbo even more torque
  Supercharged: 1.1,
};

// Example: RS5 (TwinTurbo) with 100 HP gain → 125 lb-ft torque gain
```

> ⚠️ **Calibration Note (2026-01-25)**: The 1.20x multiplier for Turbo may be too aggressive for I4 engines. Real-world Evo X data (FP Green + E85) shows HP:TQ ratios closer to 1:1, not 1:1.2. Consider future refinement: I4 Turbo → 1.05-1.10x, V6/V8 Turbo → 1.20x.

##### 0-60 Time

The `estimateZeroToSixty()` function uses physics-based calculations:

```javascript
// Factors considered:
// - Drivetrain efficiency (FWD: 88%, RWD: 85%, AWD: 80%)
// - Launch traction (FWD: 75%, RWD: 85%, AWD: 95%)
// - Transmission shift times (DCT: 0.1s, auto: 0.2s, manual: 0.4s)

import { estimateZeroToSixty } from '@/lib/performanceCalculator';
const time = estimateZeroToSixty(hp, weight, { drivetrain: 'AWD', transmission: 'dct' });
```

##### Quarter Mile & Trap Speed

Uses industry-standard formulas calibrated against real drag strip data:

```javascript
import { estimateQuarterMile, estimateTrapSpeed } from '@/lib/performanceCalculator';

// ET ≈ 5.825 × (weight / whp)^0.333 + traction adjustment
const et = estimateQuarterMile(hp, weight, { drivetrain: 'AWD' });

// Trap speed ≈ 224 × (whp / weight)^0.333
const trapMph = estimateTrapSpeed(hp, weight, { drivetrain: 'AWD' });
```

##### Braking Distance

Physics-based with tire compound awareness:

```javascript
import { estimateBrakingDistance } from '@/lib/performanceCalculator';

// Tire grip coefficients:
// - Stock: 0.90, Performance: 0.95, Track: 1.05, R-compound: 1.15, Slicks: 1.30
const braking = estimateBrakingDistance(weight, brakeModBonus, tireGrip, stockBraking);
```

##### Lateral G

Multi-factor physics model:

```javascript
import { estimateLateralG } from '@/lib/performanceCalculator';

// Factors: Tire compound (60%), suspension (20%), aero (10%), weight (10%)
// R-compound tires can add ~0.15-0.20g over stock
const lateralG = estimateLateralG(baseLateralG, upgradeKeys, tireGrip);
```

##### Weight Tracking

Mods that add or remove weight are now tracked:

```javascript
import { calculateWeightChange } from '@/lib/performanceCalculator';

// Example weight changes (lbs):
// +75 supercharger, +100 roll cage, -35 lightweight wheels, -25 carbon hood
const weightDelta = calculateWeightChange(['supercharger-roots', 'carbon-hood']);
// Returns: 75 - 25 = 50 lbs heavier
```

**❌ DO NOT**:

- Create new HP calculators or performance estimators
- Calculate HP by summing `metricChanges.hpGain` directly
- Import HP calculation from `lib/upgrades.js` (deprecated)
- Store HP gains and prefer stored values over calculated

**✅ DO**:

- Import from `@/lib/performanceCalculator` for all performance calculations
- Always calculate HP dynamically using `calculateSmartHpGain()` or functions that call it
- Pass the `car` object for accurate engine-type-aware calculations
- Use `useVehiclePerformance(vehicle, car)` hook for React components displaying vehicle HP
- Use `useBuildPerformance(build, car)` hook for React components displaying build HP

#### Recommended Hooks for HP Display

```javascript
// For vehicle (installed mods) HP display:
import { useVehiclePerformance } from '@/hooks/useVehiclePerformance';
const { hpGain, finalHp } = useVehiclePerformance(vehicle, car);

// For build (planned mods) HP display:
import { useBuildPerformance } from '@/hooks/useVehiclePerformance';
const { hpGain, finalHp } = useBuildPerformance(build, car);

// For API routes (non-React):
import { calculateAllModificationGains } from '@/lib/performanceCalculator';
const { hpGain } = calculateAllModificationGains(installedMods, car);
```

#### Audit Status (2026-01-24)

Files with deprecated `totalHpGain` usage (marked with @deprecated comments):

| File                                | Status        | Notes                                                        |
| ----------------------------------- | ------------- | ------------------------------------------------------------ |
| `OwnedVehiclesProvider.jsx`         | ⚠️ Deprecated | `totalHpGain` marked deprecated, use `useVehiclePerformance` |
| `SavedBuildsProvider.jsx`           | ⚠️ Deprecated | `totalHpGain` marked deprecated, use `useBuildPerformance`   |
| `app/api/community/builds/route.js` | ✅ Fixed      | Uses `calculateAllModificationGains`                         |

#### Real-World Validation (2026-01-25)

The physics model has been validated against real-world dyno data and drag times for two vehicles:

##### Audi RS5 (B9 2.9L TwinTurbo V6) - Stage 1 Build

| Metric   | Projection             | Real-World Data                 | Status      |
| -------- | ---------------------- | ------------------------------- | ----------- |
| HP Gain  | +108 HP (450 → 558 HP) | APR/IE Stage 1: +90-120 HP      | ✅ Accurate |
| Torque   | +135 lb-ft             | APR Stage 1: +130-150 lb-ft     | ✅ Accurate |
| 0-60     | 3.5s                   | Tuned RS5 timeslips: 3.3-3.6s   | ✅ Accurate |
| 1/4 Mile | 11.3s                  | Tuned RS5 timeslips: 11.2-11.6s | ✅ Accurate |

##### Mitsubishi Evo X (4B11T 2.0L Turbo I4) - Stage 3 E85 + Slicks Build

| Metric     | Projection        | Real-World Data               | Status              |
| ---------- | ----------------- | ----------------------------- | ------------------- |
| HP         | 545 HP (~460 WHP) | FP Green + E85: 450-470 WHP   | ✅ Accurate         |
| Torque     | 605 lb-ft         | FP Green dynos: 480-520 lb-ft | ⚠️ ~20% high        |
| 0-60       | 3.1s              | Evo X slicks: 3.0-3.3s        | ✅ Accurate         |
| 1/4 Mile   | 10.6s             | 460 WHP Evos: 10.8-11.2s      | ⚠️ ~0.3s optimistic |
| Trap Speed | 132 mph           | 460 WHP Evos: 122-128 mph     | ⚠️ ~5-10 mph high   |
| Braking    | 88 ft             | Track prep + slicks: 85-90 ft | ✅ Accurate         |
| Lateral G  | 1.18g             | Slicks: 1.20-1.35g            | ✅ Conservative     |

**Overall Confidence: 75-85%** - HP projections are accurate. Torque and trap speed run slightly high for I4 turbos.

##### Known Limitations

1. **I4 Turbo Torque**: The 1.20x torque multiplier overestimates I4 turbo gains. Real data shows ~1.05-1.10x.
2. **Quarter Mile / Trap Speed**: Slightly optimistic (~5-10%) at high power levels.
3. **Lateral G**: Conservative for slick tires (real-world slicks can exceed 1.30g).

##### Data Sources

- evolutionm.net dyno results database
- APR/IE/Unitronic published dyno sheets
- Drag times from NHRA/drag strip timeslips
- Car & Driver, Motor Trend braking/skidpad tests
  | `app/api/community/builds/[slug]/route.js` | ✅ Fixed | Uses `calculateAllModificationGains` |

Files that still need migration to use hooks (consumers of deprecated values):

- `PerformanceHub.jsx` - uses `vehicle.totalHpGain`
- `BuildWizard.jsx` - uses `v.totalHpGain`
- `ShareBuildModal.jsx` - uses `build.total_hp_gain`
- `community/builds/[slug]/page.jsx` - uses `post.buildData.total_hp_gain`

### Car Data & Resolution

**SOURCE OF TRUTH**: `lib/carResolver.js`

| Feature               | Function                       |
| --------------------- | ------------------------------ |
| Slug to ID resolution | `resolveCarId(slug, options?)` |
| Batch resolution      | `resolveCarIds(slugs)`         |
| Basic car info        | `getCarBasicInfo(slug)`        |

**❌ DO NOT**: Query cars table by slug directly in services.
**✅ DO**: Always resolve slug to ID first, then query by ID.

### Marketing Statistics

**SOURCE OF TRUTH**: `lib/marketingStats.js`

| Export                | Value    | Usage                         |
| --------------------- | -------- | ----------------------------- |
| `CAR_COUNT_DISPLAY`   | '300+'   | Marketing copy, feature lists |
| `EVENT_COUNT_DISPLAY` | '8,500+' | Event page marketing          |
| `CAR_COUNT_APPROX`    | 310      | Calculations, not display     |
| `EVENT_COUNT_APPROX`  | 8650     | Calculations, not display     |
| `MARKETING_STRINGS`   | Object   | Pre-built marketing phrases   |

**❌ DO NOT**: Hardcode counts like '100+', '190+', '500+' in components.
**✅ DO**: Import from `@/lib/marketingStats` for all display counts.

### Car Data Fetching

| Use Case                  | Source                 | File                           |
| ------------------------- | ---------------------- | ------------------------------ |
| Client-side (browser)     | Cached client          | `lib/carsClient.js`            |
| Server-side               | Server cache           | `lib/carsCache.js`             |
| React: All cars list      | `useCarsList()`        | `hooks/useCarData.js`          |
| React: Single car by slug | `useCarBySlug(slug)`   | `hooks/useCarData.js`          |
| API: All cars             | `GET /api/cars`        | `app/api/cars/route.js`        |
| API: Single car by slug   | `GET /api/cars/[slug]` | `app/api/cars/[slug]/route.js` |

**Cache Configuration** (aligned across modules):
| Cache Type | TTL | File |
|------------|-----|------|
| In-memory (browser) | 5 min | `lib/carsClient.js` → `CACHE_TTL_MS` |
| Session storage | 10 min | `lib/carsClient.js` → `SESSION_CACHE_TTL_MS` |
| React Query FAST | 5 min | `hooks/useCarData.js` → `CACHE_TIMES.FAST` |
| React Query STANDARD | 10 min | `hooks/useCarData.js` → `CACHE_TIMES.STANDARD` |
| React Query SLOW | 30 min | `hooks/useCarData.js` → `CACHE_TIMES.SLOW` |
| Server cache | 5 min | `lib/carsCache.js` → `CACHE_REVALIDATE_SECONDS` |

### Scoring & Weights

**SOURCE OF TRUTH**: `lib/scoring.js`

| Export                      | Purpose                          |
| --------------------------- | -------------------------------- |
| `DEFAULT_WEIGHTS`           | Standard scoring weights (equal) |
| `ENTHUSIAST_WEIGHTS`        | Performance-focused weights      |
| `calculateWeightedScore()`  | Calculate car/build score        |
| `calculateMaxScore()`       | Calculate max possible score     |
| `calculateScoreBreakdown()` | Detailed category breakdown      |

**Weight Keys**: `sound`, `interior`, `track`, `reliability`, `value`, `driverFun`, `aftermarket`

**❌ DO NOT**: Define inline `defaultWeights` in components.
**❌ DO NOT**: Use wrong keys like `powerAccel`, `gripCornering`, etc.
**✅ DO**: Import `ENTHUSIAST_WEIGHTS` or `DEFAULT_WEIGHTS` from `@/lib/scoring.js`.

### User Data

**SOURCE OF TRUTH**: `lib/userDataService.js`

| Feature         | Functions                                                 |
| --------------- | --------------------------------------------------------- |
| Favorites       | `addFavorite()`, `removeFavorite()`, `getUserFavorites()` |
| Vehicles        | `addVehicle()`, `updateVehicle()`, `getUserVehicles()`    |
| Projects/Builds | `saveProject()`, `updateProject()`, `getUserProjects()`   |

### Upgrades & Parts

| Feature             | Source                                         |
| ------------------- | ---------------------------------------------- |
| Upgrade definitions | `data/upgradePackages.js`                      |
| Upgrade lookup      | `lib/upgrades.js` → `getUpgradeByKey()`        |
| Upgrade categories  | `lib/upgrades.js` → `getCanonicalCategories()` |
| Pricing             | `data/upgradePricing.js`                       |

### Car Filtering & Sorting

**SOURCE OF TRUTH**: `lib/filterUtils.js`

| Function                     | Purpose                            |
| ---------------------------- | ---------------------------------- |
| `filterCarsBySearch()`       | Search across name, brand, engine  |
| `filterCarsByMake()`         | Filter by brand                    |
| `filterCarsByTier()`         | Filter by tier                     |
| `filterCarsByVehicleType()`  | Filter by body style               |
| `filterCarsByPrice()`        | Filter by price range              |
| `filterCarsByDrivetrain()`   | Filter by RWD/AWD/FWD              |
| `filterCarsByTransmission()` | Filter by manual/automatic         |
| `sortCars()`                 | Sort by name, HP, price, score     |
| `filterAndSortCars()`        | Combined filter + sort (efficient) |
| `getUniqueMakes()`           | Get unique brands for dropdown     |

**❌ DO NOT**: Write inline filter logic in components.
**✅ DO**: Import from `@/lib/filterUtils`.

### Date Formatting

**SOURCE OF TRUTH**: `lib/dateUtils.js`

| Function                 | Purpose                                | Example Output               |
| ------------------------ | -------------------------------------- | ---------------------------- |
| `parseDate()`            | Safe date parsing (handles YYYY-MM-DD) | Date object                  |
| `formatEventDate()`      | Standard event date                    | "Jan 15, 2026"               |
| `formatEventDateFull()`  | Full event date                        | "Saturday, January 15, 2026" |
| `formatEventDateShort()` | Card display                           | "Sat, Jan 15"                |
| `formatDateSimple()`     | Basic date                             | "1/15/2026"                  |
| `formatMonthYear()`      | Price history charts                   | "Jan '26"                    |
| `formatTimestamp()`      | Full timestamp                         | "Jan 15, 2026 at 3:30 PM"    |
| `getMonthAbbrev()`       | Calendar display                       | "JAN"                        |
| `getDayOfMonth()`        | Day number                             | 15                           |
| `getWeekdayAbbrev()`     | Weekday short                          | "Sat"                        |
| `isPastDate()`           | Date comparison                        | true/false                   |
| `isToday()`              | Today check                            | true/false                   |
| `formatRelativeDate()`   | Relative time                          | "In 3 days"                  |

**❌ DO NOT**: Use `new Date(dateStr).toLocaleDateString()` directly.
**❌ DO NOT**: Create local `formatDate()` functions in components.
**✅ DO**: Import from `@/lib/dateUtils`.

### Events

**SOURCE OF TRUTH**: `lib/eventsService.js`

### Maintenance

**SOURCE OF TRUTH**: `lib/maintenanceService.js`

### AI/AL Features

**SOURCE OF TRUTH**: `lib/alTools.js`, `lib/alConversationService.js`, `lib/alConfig.js`

| File                           | Responsibility                      | Key Exports                                                                                |
| ------------------------------ | ----------------------------------- | ------------------------------------------------------------------------------------------ |
| `lib/alTools.js`               | AL tool definitions and execution   | `executeToolCall()`, `searchKnowledge()`, `AL_TOOLS`                                       |
| `lib/alConversationService.js` | Conversation persistence (uses RPC) | `createConversation()`, `getUserConversations()`, `addMessage()`, sharing via DB functions |
| `lib/alConfig.js`              | AL configuration and prompts        | `buildALSystemPrompt()`, `AL_PLANS`, `MODEL_TIERS`, `selectModelForQuery()`                |
| `lib/alUsageService.js`        | Credit/usage tracking               | `getUserBalance()`, `deductUsage()`, `processMonthlyRefill()`                              |
| `lib/alEvaluationService.js`   | LLM-as-judge evaluation             | `evaluateResponse()`, `runGoldenDatasetEvaluation()`, `generateEvaluationReport()`         |
| `lib/alFeedbackService.js`     | Response feedback collection        | `recordFeedback()`, `getFeedbackStats()`, `getFeedbackTrend()`                             |
| `lib/alIntentClassifier.js`    | Query intent detection              | `classifyQueryIntent()`, `getRecommendedTools()`                                           |
| `lib/alIntelligence.js`        | Content gap detection               | `getUnresolvedGaps()`, `analyzeConversationForGaps()`                                      |
| `lib/alContentGapResolver.js`  | Gap resolution workflow             | `resolveGap()`, `getGapsForReview()`, `searchExistingContent()`                            |
| `lib/aiCircuitBreaker.js`      | API resilience                      | `executeWithCircuitBreaker()`, `aiCircuitBreaker`, `CIRCUIT_STATES`                        |
| `lib/cohereRerank.js`          | Search result reranking             | `rerankDocuments()`, `rerankALResults()`                                                   |
| `lib/rrfRerank.js`             | Reciprocal Rank Fusion              | `reciprocalRankFusion()`, `mergeRRFWithDocuments()`                                        |
| `lib/knowledgeIndexService.js` | RAG document indexing               | `ingestKnowledgeText()` (with `confidenceLevel` parameter)                                 |

**AL Database RPCs** (prefer over client-side queries):

```javascript
// ✅ CORRECT: Use RPC for conversations with preview (avoids N+1)
const { data } = await client.rpc('get_user_conversations_with_preview', {
  p_user_id: userId,
  p_limit: 20,
  p_offset: 0,
  p_include_archived: false,
});

// ✅ CORRECT: Use car_id for al_content_gaps queries
const carId = await resolveCarId(carSlug);
query = query.eq('car_id', carId); // al_content_gaps has index on car_id
```

**AL API Route**: `app/api/ai-mechanic/route.js`

- Streaming responses with circuit breaker protection
- Anthropic prompt caching (`cache_control: { type: 'ephemeral' }`)
- Model tiering support (via `ENABLE_MODEL_TIERING` env var)
- Tool execution with rate limiting

**Feedback API**: `app/api/al/feedback/route.js`

- Thumbs up/down feedback collection
- Links feedback to conversations and prompt versions

**Shared Conversation API**: `app/api/shared/al/[token]/route.js`

- Public read-only access to shared conversations via token
- Rate limited: 60 requests/minute per IP
- Token validation: UUID format required
- Security checks: expiration (`share_expires_at`), revocation (`share_revoked_at`)
- Returns sanitized messages (no user_id, no email, no internal IDs)
- Error responses: 404 (not found/revoked), 410 (expired)

**AL Evaluation Tables**:

- `al_evaluation_runs` - Evaluation run summaries
- `al_evaluation_results` - Individual test case results
- `al_response_feedback` - User feedback on responses
- `al_prompt_versions` - Prompt version tracking for A/B testing

### Community Features

**SOURCE OF TRUTH**:

- Service: `lib/communityService.js` (server-side operations)
- Hooks: `hooks/useCommunityData.js` (React Query hooks for client)

### Discord Notifications

**SOURCE OF TRUTH**: `lib/discord.js`

| Function                          | Purpose               |
| --------------------------------- | --------------------- |
| `postToDiscord(channel, options)` | Send to any channel   |
| `notifyFeedback()`                | User feedback alerts  |
| `notifyNewSignup()`               | New user alerts       |
| `notifyError()`                   | Error alerts          |
| `notifyAlEvaluationRun()`         | AL evaluation results |
| `notifyCronResult()`              | Cron job status       |
| `sendDiscordAlert()`              | Generic alert helper  |

**Channels**: `feedback`, `contacts`, `errors`, `signups`, `events`, `al`, `cron`, `digest`, `financials`

**❌ DO NOT**: Use `lib/discordAlerts.js` (deprecated, unused)
**✅ DO**: Import from `@/lib/discord`

### Error Logging

**Architecture**: Two files, separated by context (client vs server)

| File                       | Context                 | Purpose                                |
| -------------------------- | ----------------------- | -------------------------------------- |
| `lib/errorLogger.js`       | Client (`'use client'`) | Browser error tracking → /api/feedback |
| `lib/serverErrorLogger.js` | Server (API routes)     | Server error tracking → database       |

**Server-side wrapper** (for API routes):

```javascript
import { withErrorLogging, logCronError } from '@/lib/serverErrorLogger';

export const GET = withErrorLogging(
  async (request) => {
    return Response.json({ data });
  },
  { route: 'cars', feature: 'browse' }
);
```

**❌ DO NOT**: Create new error logging files.
**✅ DO**: Use existing `errorLogger.js` (client) or `serverErrorLogger.js` (server).

### Supabase Clients

**DOCUMENTATION**: `docs/SUPABASE_CLIENT_USAGE.md`

| Context            | File                    | Import                          |
| ------------------ | ----------------------- | ------------------------------- |
| Browser/Components | `lib/supabase.js`       | `import { supabase }`           |
| API Routes         | `lib/supabaseServer.js` | `import { createRouteClient }`  |
| Node.js Scripts    | `lib/supabaseClient.js` | `import { getServiceSupabase }` |

**❌ DO NOT**: Use browser client (`supabase.js`) in API routes.
**❌ DO NOT**: Use server client (`supabaseServer.js`) in client components.
**✅ DO**: See `docs/SUPABASE_CLIENT_USAGE.md` for detailed patterns.

---

## Service Files

### Core Services (lib/)

| File                             | Responsibility                     | Key Exports                                                                                                                                          |
| -------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `supabase.js`                    | Browser Supabase client            | `supabase`, `isSupabaseConfigured`                                                                                                                   |
| `supabaseServer.js`              | Server Supabase client             | `supabaseServiceRole`                                                                                                                                |
| `carResolver.js`                 | Slug→ID resolution                 | `resolveCarId()`, `resolveCarIds()`                                                                                                                  |
| `carsClient.js`                  | Car data (client)                  | `getCars()`, `getCarBySlug()`                                                                                                                        |
| `carsCache.js`                   | Car data (server)                  | Cached car data                                                                                                                                      |
| `userDataService.js`             | User CRUD operations               | Favorites, vehicles, projects                                                                                                                        |
| `scoring.js`                     | Car scoring                        | `calculateWeightedScore()`                                                                                                                           |
| `upgrades.js`                    | Upgrade data lookups               | `getUpgradeByKey()`                                                                                                                                  |
| `eventsService.js`               | Events data                        | Event CRUD                                                                                                                                           |
| `maintenanceService.js`          | Maintenance data                   | Maintenance schedules                                                                                                                                |
| `fitmentService.js`              | Wheel/tire fitment data            | `fetchCarFitments()`, `getFitmentWarnings()`, `formatWheelSpecs()`                                                                                   |
| `communityService.js`            | Community features                 | Posts, builds, insights                                                                                                                              |
| `alTools.js`                     | AI assistant tools                 | AL tool definitions, `searchKnowledge()` with reranking                                                                                              |
| `alConversationService.js`       | AI conversations (uses RPC)        | `getUserConversations()`, `createConversation()`, `addMessage()`                                                                                     |
| `alConfig.js`                    | AL configuration                   | `buildALSystemPrompt()`, `MODEL_TIERS`, `selectModelForQuery()`                                                                                      |
| `alUsageService.js`              | AL usage/credits                   | `getUserBalance()`, `deductUsage()`, `processMonthlyRefill()`                                                                                        |
| `alEvaluationService.js`         | LLM-as-judge evaluation            | `evaluateResponse()`, `runGoldenDatasetEvaluation()`, `EVALUATION_DIMENSIONS`                                                                        |
| `alFeedbackService.js`           | Response feedback                  | `recordFeedback()`, `getFeedbackStats()`, `getFeedbackTrend()`                                                                                       |
| `alIntelligence.js`              | Content gap detection              | `getUnresolvedGaps()`, `analyzeConversationForGaps()`                                                                                                |
| `alContentGapResolver.js`        | Gap resolution                     | `resolveGap()`, `getGapsForReview()`                                                                                                                 |
| `aiCircuitBreaker.js`            | API circuit breaker                | `executeWithCircuitBreaker()`, `aiCircuitBreaker`, `CIRCUIT_STATES`                                                                                  |
| `emailService.js`                | Email sending (Resend)             | `sendEmail()`, email templates                                                                                                                       |
| `unsubscribeToken.js`            | Secure unsubscribe tokens          | `generateUnsubscribeToken()`, `verifyUnsubscribeToken()`                                                                                             |
| `errorLogger.js`                 | Client error logging               | `logError()`                                                                                                                                         |
| `serverErrorLogger.js`           | Server error logging               | `withErrorLogging()`, `logCronError()`                                                                                                               |
| `adminAccess.js`                 | Admin auth verification            | `requireAdmin()`, `isAdminEmail()`, `getAdminFromRequest()`                                                                                          |
| `apiErrors.js`                   | Standardized API error responses   | `errors.unauthorized()`, `errors.forbidden()`, `errors.badRequest()`, `errors.notFound()`, `errors.database()`                                       |
| `activityTracker.js`             | Analytics tracking                 | `trackEvent()`                                                                                                                                       |
| `garageScoreService.js`          | Garage completeness scoring        | `getVehicleScore()`, `recalculateScore()`                                                                                                            |
| `lapTimeService.js`              | Lap time estimation from real data | `estimateLapTime()`, `getTrackBaseline()`                                                                                                            |
| `rateLimit.js`                   | API rate limiting                  | `rateLimit()`, `RateLimitPresets`, `withRateLimit()`, `distributedRateLimit()`                                                                       |
| `queryKeys.js`                   | TanStack Query key factory         | `carKeys`, `userKeys`, `eventKeys`, `alKeys`, `partsKeys`, `communityKeys`                                                                           |
| `schemas/index.js`               | Zod validation schemas             | `feedbackSchema`, `contactSchema`, `communityPostSchema`, `dynoResultSchema`, `trackTimeSchema`, `validateWithSchema()`, `validationErrorResponse()` |
| `images.js`                      | Image utilities                    | `getCarImageUrl()`, `getOptimizedImageUrl()`                                                                                                         |
| `imageUploadService.js`          | Image upload handling              | `uploadImage()`, `deleteImage()`                                                                                                                     |
| `cohereRerank.js`                | Cohere reranking for search        | `rerankDocuments()`, `rerankALResults()`                                                                                                             |
| `rrfRerank.js`                   | Reciprocal Rank Fusion             | `reciprocalRankFusion()`, `mergeRRFWithDocuments()`                                                                                                  |
| `alIntentClassifier.js`          | Query intent classification        | `classifyQueryIntent()`, `getRecommendedTools()`                                                                                                     |
| `env.js`                         | Environment variable validation    | `serverEnv`, `clientEnv`, `isSupabaseConfigured()`                                                                                                   |
| `featureFlags.js`                | Feature flags & A/B testing        | `useFeatureFlag()`, `FLAGS`, `ABTest`                                                                                                                |
| `analytics/events.js`            | Typed analytics events             | `EVENTS`, `FUNNELS`, `SCHEMA_VERSION`, `trackEvent()`, `trackExperiment()`                                                                           |
| `analytics/types.ts`             | TypeScript event schemas           | `AnalyticsEvent`, property interfaces                                                                                                                |
| `analytics/index.js`             | Analytics barrel export            | Re-exports all analytics functions                                                                                                                   |
| `analytics/manager.js`           | Unified analytics abstraction      | `analytics`, `AnalyticsManager` class                                                                                                                |
| `analytics/offlineQueue.js`      | PWA offline event queue            | `offlineQueue`, auto-flush on reconnect                                                                                                              |
| `analytics/providers/posthog.js` | PostHog adapter                    | `posthogProvider`                                                                                                                                    |
| `analytics/providers/ga4.js`     | GA4 adapter                        | `ga4Provider`                                                                                                                                        |
| `analytics/providers/custom.js`  | Custom backend adapter             | `customProvider`                                                                                                                                     |

### Notification Services (lib/)

| File                            | Responsibility                        | Key Exports                                                                                                                          |
| ------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `notificationService.js`        | Notification CRUD, preferences        | `createNotification()`, `getNotifications()`, `markAsRead()`, `getPreferences()`, `updatePreferences()`                              |
| `notificationTriggers.js`       | Event-based notification triggers     | `triggerFirstCarNotification()`, `triggerRecallNotification()`, `triggerCommentNotification()`, `triggerEventReminderNotification()` |
| `notificationFatigueService.js` | Fatigue detection & frequency control | `detectFatigue()`, `shouldSendNotification()`, `getFatigueMetrics()`, `recordInteraction()`                                          |
| `engagementService.js`          | User engagement & streaks             | `getStreakStatus()`, `getStreakDisplayInfo()`, `getStreakReminderCopy()`, `STREAK_MILESTONES`                                        |

**Notification Categories:**

```javascript
// lib/notificationService.js
export const NOTIFICATION_CATEGORIES = {
  SYSTEM: 'system', // Account, security, payment
  ENGAGEMENT: 'engagement', // Milestones, streaks, achievements
  SOCIAL: 'social', // Comments, likes on builds
  VEHICLE: 'vehicle', // Recalls, known issues, maintenance
  EVENTS: 'events', // Event reminders, new events
  AL: 'al', // AL conversation updates
};
```

### Calculators (lib/)

| File                      | Responsibility               | Status             |
| ------------------------- | ---------------------------- | ------------------ |
| `performanceCalculator/`  | ALL performance calculations | ✅ Source of Truth |
| `tunabilityCalculator.js` | Tunability scoring           | Active             |
| `lapTimeService.js`       | Lap time estimates           | Active             |

### CSS & Design System Scripts (scripts/)

| File                        | Purpose                                | Command                                         |
| --------------------------- | -------------------------------------- | ----------------------------------------------- |
| `color-token-map.json`      | 195 hex → CSS variable mappings        | Reference file                                  |
| `fix-hardcoded-colors.mjs`  | Auto-replace hardcoded hex with tokens | `npm run fix:colors:all`                        |
| `audit-css-tokens.mjs`      | Scan for color token violations        | `npm run audit:css`                             |
| `convert-media-queries.mjs` | Convert max-width to min-width         | `node scripts/convert-media-queries.mjs <file>` |
| `audit-media-queries.mjs`   | Find desktop-first patterns            | `npm run audit:media-queries`                   |

### Analytics Scripts (scripts/)

| File                      | Purpose                                   | Command                                |
| ------------------------- | ----------------------------------------- | -------------------------------------- |
| `generate-event-docs.mjs` | Generate event docs from TypeScript types | `node scripts/generate-event-docs.mjs` |

**Adding new color mappings:**

1. Edit `scripts/color-token-map.json`
2. Add hex → variable mapping to `flatMap` object
3. Run `npm run fix:colors:all` to apply

### Deprecated/Wrapper Files

| File                   | Status                    | Notes                                                                                  |
| ---------------------- | ------------------------- | -------------------------------------------------------------------------------------- |
| `upgradeCalculator.js` | ⚠️ Re-export wrapper      | Re-exports from `performanceCalculator/`. Keep for backwards compatibility.            |
| `performance.js`       | ⚠️ Utility only           | Only use for `calculateTotalCost`, `getAvailableUpgrades`. HP calculation removed.     |
| `upgrades.js`          | ⚠️ Data + deprecated calc | Use for `getUpgradeByKey()`. The `calculateAllModificationGains()` here is DEPRECATED. |

**DELETED FILES (do not recreate):**

- ~~`buildPerformanceCalculator.js`~~ - Deleted, was not imported anywhere
- ~~`performanceModelComparison.js`~~ - Deleted, was not imported anywhere

### Deleted Files (For Reference)

The following files have been consolidated into `lib/performanceCalculator/`:

- ~~`performanceCalculatorV2.js`~~ - Deleted 2026-01-24, physics model merged into V1

---

## Components

### Component Organization

| Directory                 | Purpose              | Examples                                        |
| ------------------------- | -------------------- | ----------------------------------------------- |
| `components/`             | Feature components   | `VirtualDynoChart`, `PowerBreakdown`            |
| `components/ui/`          | Base UI elements     | `Button`, `Card`, `Modal`, `Icons`              |
| `components/providers/`   | React Context        | `AuthProvider`, `FavoritesProvider`             |
| `components/garage/`      | Garage features      | See "Garage Feature Architecture" section below |
| `components/tuning-shop/` | Tuning features      | `PartsSelector`, `PartRecommendationCard`       |
| `components/landing/`     | Marketing components | `LandingHero`, `FeatureGrid`                    |

### Key Components by Feature

| Feature         | Component                       | Location                                        |
| --------------- | ------------------------------- | ----------------------------------------------- |
| Virtual Dyno    | `VirtualDynoChart`              | `components/VirtualDynoChart.jsx`               |
| Power Breakdown | `PowerBreakdown`                | `components/PowerBreakdown.jsx`                 |
| Performance Hub | `PerformanceHub`                | `components/PerformanceHub.jsx`                 |
| Upgrade Center  | `UpgradeCenter`                 | `components/UpgradeCenter.jsx`                  |
| Build Detail    | `BuildDetailView`               | `components/BuildDetailView.jsx`                |
| Car Selection   | `CarSelectionProvider`          | `components/providers/CarSelectionProvider.jsx` |
| Accessibility   | `SkipLink`                      | `components/SkipLink.jsx`                       |
| Dynamic Imports | `DynamicVirtualDynoChart`, etc. | `components/dynamic.js`                         |
| AL Feedback     | `ALFeedbackButtons`             | `components/ALFeedbackButtons.jsx`              |

### Dynamic Imports (Code Splitting)

Heavy components are dynamically imported to reduce initial bundle size:

| Export                         | Original Component      | Purpose                |
| ------------------------------ | ----------------------- | ---------------------- |
| `DynamicVirtualDynoChart`      | `VirtualDynoChart`      | HP/TQ curve charts     |
| `DynamicLapTimeEstimator`      | `LapTimeEstimator`      | Track time predictions |
| `DynamicCalculatedPerformance` | `CalculatedPerformance` | 0-60, quarter mile     |
| `DynamicPowerBreakdown`        | `PowerBreakdown`        | HP/TQ breakdown        |
| `DynamicSportsCarComparison`   | `SportsCarComparison`   | Multi-car comparison   |

**Usage:**

```javascript
import { DynamicVirtualDynoChart, preloadChartComponents } from '@/components/dynamic';

// Component renders with loading skeleton
<DynamicVirtualDynoChart {...props} />

// Preload on hover (optional)
onMouseEnter={() => preloadChartComponents()}
```

### Shared UI Components

| Component     | File                              | Usage                             |
| ------------- | --------------------------------- | --------------------------------- |
| Icons         | `components/ui/Icons.jsx`         | All icons                         |
| Button styles | `styles/components/buttons.css`   | `.btn-primary`, `.btn-secondary`  |
| Card styles   | `styles/components/cards.css`     | `.card`, `.card-interactive`      |
| Skeleton      | `components/ui/Skeleton.jsx`      | Loading placeholders with shimmer |
| PullToRefresh | `components/ui/PullToRefresh.jsx` | Mobile pull-to-refresh gesture    |
| SwipeableRow  | `components/ui/SwipeableRow.jsx`  | Mobile swipe-to-reveal actions    |

**Skeleton Components:**

- `Skeleton` - Base skeleton with width/height/variant props
- `SkeletonText` - Multi-line text placeholder
- `CardSkeleton` - Card loading placeholder
- `ListSkeleton` - List loading placeholder
- `TableSkeleton` - Table loading placeholder
- `CarCardSkeleton` - AutoRev car card loading placeholder
- `DynoChartSkeleton` - Virtual Dyno chart loading placeholder
- `DataPageSkeleton` - Full /data page loading placeholder (includes dyno chart, metrics, power breakdown)

Import: `import { Skeleton, CardSkeleton, ListSkeleton, DataPageSkeleton } from '@/components/ui';`

**EmptyState Component:**

- `EmptyState` - Standardized empty state display with icon, title, description, and actions
- Variants: `default`, `compact`, `large`
- Built-in icons: `inbox`, `search`, `car`, `calendar`, `heart`, `settings`

Import: `import { EmptyState } from '@/components/ui';`

**Mobile Gesture Components:**

**PullToRefresh** (`components/ui/PullToRefresh.jsx`)

- Touch-based pull-to-refresh for mobile list pages
- Only activates at scrollTop === 0, respects native scroll
- Props: `onRefresh` (async), `threshold` (default 80px), `disabled`, `children`
- Used in: Events page, Garage page, AL conversations

```javascript
import PullToRefresh from '@/components/ui/PullToRefresh';

<PullToRefresh onRefresh={async () => await refetchData()}>
  <YourScrollableContent />
</PullToRefresh>;
```

**SwipeableRow** (`components/ui/SwipeableRow.jsx`)

- Swipe-to-reveal actions for list items (iOS/Android pattern)
- Snap-back behavior on incomplete swipe
- Props: `leftActions`, `rightActions`, `threshold` (default 80px), `disabled`, `children`
- Action shape: `{ icon: ReactNode, label: string, onClick: () => void, variant: 'default'|'danger'|'success'|'primary' }`
- Used in: Vehicle list, AL conversation list, Comments

```javascript
import SwipeableRow from '@/components/ui/SwipeableRow';

<SwipeableRow
  rightActions={[
    { icon: <TrashIcon />, label: 'Delete', onClick: handleDelete, variant: 'danger' },
  ]}
>
  <YourListItemContent />
</SwipeableRow>;
```

Import both: `import { PullToRefresh, SwipeableRow } from '@/components/ui';`

**Drag-and-Drop Reordering** (`@dnd-kit/core`, `@dnd-kit/sortable`)

- Touch-friendly drag-and-drop for reordering lists
- Used in: Garage vehicle list view (list mode)
- Coexists with SwipeableRow via dedicated drag handle (grip icon)
- Sensors configured for touch (150ms hold) and pointer (8px threshold)
- Persists order via `reorderVehicles()` in `OwnedVehiclesProvider`

```javascript
// Key imports from @dnd-kit
import { DndContext, closestCenter, TouchSensor, PointerSensor } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Wrap list with DndContext + SortableContext
<DndContext sensors={sensors} onDragEnd={handleDragEnd}>
  <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
    {items.map((item) => (
      <SortableItem key={item.id} item={item} />
    ))}
  </SortableContext>
</DndContext>;
```

**Additional Components:**
| Component | File | Usage |
|-----------|------|-------|
| `ABTest` | `components/ABTest.jsx` | Declarative A/B testing with auto-exposure tracking |
| `FeatureFlag` | `components/ABTest.jsx` | Conditional rendering by feature flag |
| `CookieConsent` | `components/CookieConsent.jsx` | GDPR cookie consent banner |
| `PaymentFailedBanner` | `components/PaymentFailedBanner.jsx` | Dunning management banner |
| `SubscriptionDisclosure` | `components/SubscriptionDisclosure.jsx` | App Store compliant subscription terms |
| `ThemeToggle` | `components/ThemeToggle.jsx` | Dark/light mode toggle |
| `NotificationCenter` | `components/NotificationCenter.jsx` | Bell icon with dropdown, real-time updates |
| `NotificationPreferences` | `components/NotificationPreferences.jsx` | Notification settings UI with quiet hours |
| `StreakIndicator` | `components/StreakIndicator.jsx` | Flame icon with streak count, at-risk state |
| `StreakMilestoneModal` | `components/StreakMilestoneModal.jsx` | Celebration modal for streak achievements |

**SubscriptionDisclosure Variants:**

- `variant="default"` - Full disclosure with trial info and legal links
- `variant="compact"` - One-paragraph summary
- `variant="minimal"` - Single line with links

### Hero Components (NOT Duplicates - Distinct Purposes)

| Component                 | Purpose                                             | Type             |
| ------------------------- | --------------------------------------------------- | ---------------- |
| `HeroSection.jsx`         | Homepage hero, LCP optimized                        | Server Component |
| `HeroCta.jsx`             | Animated CTA button (Revival→Revelation→Revolution) | Client Component |
| `landing/LandingHero.jsx` | Marketing landing pages, split layout with video    | Client Component |

**Design Decision**: `HeroCta` was extracted from `HeroSection` to allow server-rendering of the hero image while keeping the animated CTA client-side.

### Event Section Components (NOT Duplicates - Distinct Purposes)

| Component                 | Purpose                         | Used Where                      |
| ------------------------- | ------------------------------- | ------------------------------- |
| `CarEventsSection.jsx`    | Shows events for a specific car | Car detail pages                |
| `GarageEventsSection.jsx` | Shows user's relevant events    | Garage dashboard                |
| Badge styles              | `styles/components/badges.css`  | `.badge-success`, `.badge-gain` |

---

## API Routes

### Route Organization

| Path Pattern              | Purpose             | Auth Required    | Rate Limited      | Validation         |
| ------------------------- | ------------------- | ---------------- | ----------------- | ------------------ |
| `/api/cars/[slug]/...`    | Car data endpoints  | No               | No                | N/A                |
| `/api/users/[userId]/...` | User data endpoints | Yes + IDOR       | Yes (mutations)   | Zod                |
| `/api/community/...`      | Community features  | Varies           | Yes (mutations)   | Zod                |
| `/api/events/...`         | Events data         | No               | No                | N/A                |
| `/api/ai-mechanic/...`    | AL assistant        | Yes              | Yes (`ai` preset) | N/A                |
| `/api/admin/...`          | Admin endpoints     | `requireAdmin()` | No                | N/A                |
| `/api/internal/...`       | Internal/pipeline   | Service role     | No                | N/A                |
| `/api/cron/...`           | Scheduled jobs      | Cron secret      | No                | N/A                |
| `/api/notifications/...`  | Notification system | Yes              | No                | N/A                |
| `/api/dyno-results`       | User dyno data      | Yes              | Yes               | `dynoResultSchema` |
| `/api/checkout`           | Stripe checkout     | Yes              | Yes (`checkout`)  | N/A                |

### API Route Standard Patterns

**All API routes MUST use `withErrorLogging` wrapper:**

```javascript
import { withErrorLogging } from '@/lib/serverErrorLogger';

async function handleGet(request) {
  /* ... */
}
async function handlePost(request) {
  /* ... */
}

export const GET = withErrorLogging(handleGet, { route: 'route-name', feature: 'feature' });
export const POST = withErrorLogging(handlePost, { route: 'route-name', feature: 'feature' });
```

**Admin routes use `requireAdmin` helper:**

```javascript
import { requireAdmin } from '@/lib/adminAccess';

async function handleGet(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  // ... admin logic
}
```

**User routes require IDOR protection:**

```javascript
// For /api/users/[userId]/... routes
const { userId } = await params;
if (user.id !== userId) return errors.forbidden('Access denied');
```

**Mutation routes should have rate limiting:**

```javascript
import { rateLimit } from '@/lib/rateLimit';

const limited = rateLimit(request, 'api'); // or 'form', 'ai', 'checkout'
if (limited) return limited;
```

### Key API Routes

| Route                                     | Method       | Purpose                                                                     |
| ----------------------------------------- | ------------ | --------------------------------------------------------------------------- |
| `/api/cars`                               | GET          | List all cars                                                               |
| `/api/cars/[slug]`                        | GET          | Get single car                                                              |
| `/api/cars/[slug]/enriched`               | GET          | Car with all related data                                                   |
| `/api/users/[userId]/vehicles`            | GET/POST     | User vehicles                                                               |
| `/api/users/[userId]/favorites`           | GET/POST     | User favorites                                                              |
| `/api/users/[userId]/projects`            | GET/POST     | User builds                                                                 |
| `/api/community/posts`                    | GET/POST     | Community posts                                                             |
| `/api/community/leaderboard`              | GET          | Points leaderboard                                                          |
| `/api/ai-mechanic`                        | POST         | AL chat (streaming, circuit breaker, prompt caching)                        |
| `/api/al/feedback`                        | POST         | AL response feedback (thumbs up/down)                                       |
| `/api/stripe/customer-portal`             | POST         | Create Stripe Customer Portal session                                       |
| `/api/cron/trial-reminders`               | POST         | Send trial expiration emails                                                |
| `/api/user/delete-data`                   | POST         | GDPR: Delete all user data (Right to be Forgotten)                          |
| `/api/user/export-data`                   | GET          | GDPR: Export all user data (Right to Access)                                |
| `/api/user/check-username`                | GET          | Check username availability (uses `is_public_slug_available()` DB function) |
| `/api/analytics/batch`                    | POST         | Batch analytics events (offline queue)                                      |
| `/api/admin/web-vitals/collect`           | GET/POST     | Core Web Vitals storage & aggregation                                       |
| `/api/notifications`                      | GET          | List user's notifications (paginated)                                       |
| `/api/notifications/[id]`                 | PATCH/DELETE | Mark notification read, dismiss                                             |
| `/api/notifications/read-all`             | POST         | Mark all notifications as read                                              |
| `/api/notifications/unread-count`         | GET          | Get unread notification count                                               |
| `/api/notifications/preferences`          | GET/PUT      | User notification preferences                                               |
| `/api/admin/notifications/metrics`        | GET          | Notification health metrics (admin)                                         |
| `/api/admin/notifications/fatigued-users` | GET          | Users showing fatigue (admin)                                               |
| `/api/cron/streak-reminders`              | POST         | Daily streak reminder notifications                                         |

**AL API Route Features (`/api/ai-mechanic`):**

- Streaming responses via Server-Sent Events
- Circuit breaker protection (5 failures → 60s open)
- Anthropic prompt caching (`cache_control: ephemeral`)
- Model tiering support (env: `ENABLE_MODEL_TIERING=true`)
- Tool execution with caching
- Credit/usage tracking via `alUsageService`

---

## Providers

### Core Providers (components/providers/)

| Provider                     | Purpose                 | Key Exports                     |
| ---------------------------- | ----------------------- | ------------------------------- |
| `AuthProvider`               | Authentication state    | `useAuth()`                     |
| `FavoritesProvider`          | User favorites          | `useFavorites()`                |
| `OwnedVehiclesProvider`      | Garage vehicles         | `useOwnedVehicles()`            |
| `SavedBuildsProvider`        | User builds             | `useSavedBuilds()`              |
| `CarSelectionProvider`       | Current car context     | `useCarSelection()`             |
| `CompareProvider`            | Comparison list         | `useCompare()`                  |
| `QueryProvider`              | React Query client      | -                               |
| `ThemeProvider`              | Dark/light mode         | `useTheme()` (from next-themes) |
| `PostHogProvider`            | Product analytics       | `usePostHog()`                  |
| `LoadingProgressProvider`    | Global loading state    | `useLoadingProgress()`          |
| `BannerProvider`             | Banner visibility state | `useBanner()`                   |
| `PointsNotificationProvider` | Points toast queue      | `usePointsNotification()`       |

### Provider Hierarchy in app/layout.jsx

```jsx
<ThemeProvider>
  <QueryProvider>
    <LoadingProgressProvider>
      <AuthProvider>
        <PointsNotificationProvider>
          <PostHogProvider>
            <AppConfigProvider>
              <CarSelectionProvider>
                <FavoritesProvider>
                  <CompareProvider>
                    <SavedBuildsProvider>
                      <OwnedVehiclesProvider>
                        <BannerProvider>{/* App content */}</BannerProvider>
                      </OwnedVehiclesProvider>
                    </SavedBuildsProvider>
                  </CompareProvider>
                </FavoritesProvider>
              </CarSelectionProvider>
            </AppConfigProvider>
          </PostHogProvider>
        </PointsNotificationProvider>
      </AuthProvider>
    </LoadingProgressProvider>
  </QueryProvider>
</ThemeProvider>
```

---

## Custom Hooks

### Accessibility Hooks

| Hook                                    | Purpose                      | Returns                         | Source File                 |
| --------------------------------------- | ---------------------------- | ------------------------------- | --------------------------- |
| `useReducedMotion()`                    | Check prefers-reduced-motion | `boolean`                       | `hooks/useReducedMotion.js` |
| `useAnimationDuration(normal, reduced)` | Get safe animation duration  | `number`                        | `hooks/useReducedMotion.js` |
| `useAnimationConfig()`                  | Get animation config object  | `{ animate, duration, spring }` | `hooks/useReducedMotion.js` |

### PWA & Mobile - Safe Area Colors (AUTOMATIC)

iOS PWAs need the safe area (notch/Dynamic Island) to match the current screen's background. AutoRev handles this **automatically via CSS**.

**How it works:**

1. Add `data-overlay-modal` attribute to any fullscreen modal's container
2. CSS `:has()` selector automatically detects it and changes safe area color

**Usage (just add the data attribute):**

```jsx
// Fullscreen modal with overlay background (charcoal)
function MyModal() {
  return (
    <div className={styles.overlay} data-overlay-modal>
      {/* Modal content */}
    </div>
  );
}

// For media galleries (deep black)
function Gallery() {
  return (
    <div className={styles.gallery} data-immersive-modal>
      {/* Gallery content */}
    </div>
  );
}
```

**Available data attributes:**
| Attribute | Safe Area Color | Usage |
|-----------|-----------------|-------|
| `data-overlay-modal` | `#1a1a1a` (charcoal) | Fullscreen modals, questionnaires, onboarding |
| `data-immersive-modal` | `#050a12` (deep black) | Media galleries, video players |
| _(none)_ | `#0d1b2a` (navy) | Default for main app pages |

**Manual Hook (optional fallback):**

```jsx
import { useSafeAreaColor, SAFE_AREA_COLORS } from '@/hooks/useSafeAreaColor';
useSafeAreaColor(SAFE_AREA_COLORS.OVERLAY, { enabled: isOpen });
```

### Subscription Hooks

| Hook                | Purpose                        | Returns                                    | Source File                |
| ------------------- | ------------------------------ | ------------------------------------------ | -------------------------- |
| `useSubscription()` | Client-side subscription state | `{ tier, hasFeature, openCustomerPortal }` | `hooks/useSubscription.js` |

**useSubscription Returns:**

- `tier`, `tierName`, `tierLevel` - Current subscription tier
- `isFree`, `isCollector`, `isTuner`, `isPaid` - Tier access booleans
- `isTrialing`, `trialDaysRemaining` - Trial status
- `isPastDue` - Payment failed status
- `cancelAtPeriodEnd` - Subscription set to cancel at period end
- `willCancel` - True if active AND cancelAtPeriodEnd (use for "Cancels on [date]" UI)
- `hasFeature(feature)` - Check feature access by tier
- `openCustomerPortal()` - Open Stripe Customer Portal

### Garage Hooks

| Hook                        | Purpose                                            | Returns                                                 | Source File               |
| --------------------------- | -------------------------------------------------- | ------------------------------------------------------- | ------------------------- |
| `useCarImages(carSlug)`     | Manage car images shared across Garage/Tuning Shop | `{ images, heroImageUrl, setHeroImage, refreshImages }` | `hooks/useCarImages.js`   |
| `useGarageScore(vehicleId)` | Trigger garage score recalculation                 | `{ recalculateScore, isRecalculating, lastScore }`      | `hooks/useGarageScore.js` |

**useGarageScore Usage:**

```javascript
import { useGarageScore } from '@/hooks/useGarageScore';

// Call after actions that affect garage score:
// - Adding parts with brand/model (parts_specified category)
// - Uploading photos (photos_uploaded category)
// - Marking parts as installed
const { recalculateScore } = useGarageScore(vehicleId);

// Non-blocking recalculation after save
await saveParts(newParts);
recalculateScore().catch((err) => console.warn('Score recalc failed:', err));
```

### Feature Flag Hooks

| Hook                           | Purpose                     | Returns                                  | Source File               |
| ------------------------------ | --------------------------- | ---------------------------------------- | ------------------------- |
| `useFeatureFlag(key, default)` | Get feature flag value      | `{ enabled, variant, payload, loading }` | `hooks/useFeatureFlag.js` |
| `useFeatureFlags(keys[])`      | Get multiple flags          | `{ flags, variants, loading }`           | `hooks/useFeatureFlag.js` |
| `useReloadFeatureFlags()`      | Reload flags after identify | `{ reloadFlags, isReloading }`           | `hooks/useFeatureFlag.js` |

**Feature Flag Usage:**

```javascript
import { useFeatureFlag, useFeatureFlags } from '@/hooks/useFeatureFlag';

// Boolean flag
const { enabled, loading } = useFeatureFlag('new_checkout');
if (enabled) {
  /* render new checkout */
}

// Multivariate experiment
const { variant, loading } = useFeatureFlag('pricing_variant');
// variant could be 'control', 'variant-a', 'variant-b'

// Multiple flags at once
const { flags } = useFeatureFlags(['flag-a', 'flag-b']);
if (flags['flag-a']) {
  /* ... */
}
```

### Analytics Hooks

| Hook                 | Purpose              | Returns                                 | Source File                                |
| -------------------- | -------------------- | --------------------------------------- | ------------------------------------------ |
| `usePostHog()`       | PostHog analytics    | `{ capture, identify, reset, posthog }` | `components/providers/PostHogProvider.jsx` |
| `useCookieConsent()` | Cookie consent state | `{ hasConsented, preferences }`         | `components/CookieConsent.jsx`             |

### A/B Testing Components

| Component       | Purpose                       | Source File             |
| --------------- | ----------------------------- | ----------------------- |
| `<ABTest>`      | Declarative A/B test wrapper  | `components/ABTest.jsx` |
| `<FeatureFlag>` | Conditional rendering by flag | `components/ABTest.jsx` |

**A/B Testing Usage:**

```javascript
import ABTest, { FeatureFlag, trackExperimentConversion } from '@/components/ABTest';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

// Declarative A/B testing
<ABTest
  experimentKey="checkout-redesign"
  variants={{
    control: <OldCheckout />,
    'variant-a': <NewCheckout />,
  }}
  fallback={<OldCheckout />}
  trackExposure={true}  // Auto-tracks experiment viewed
/>

// Render function pattern
<ABTest experimentKey="pricing-test">
  {(variant, { enabled, payload }) => (
    variant === 'variant-a' ? <NewPricing /> : <OldPricing />
  )}
</ABTest>

// Simple feature flag gating
<FeatureFlag flag="new_feature" fallback={<OldFeature />}>
  <NewFeature />
</FeatureFlag>

// Track conversion
trackExperimentConversion('checkout-redesign', variant, { value: 99.99 });
```

**Tracking Plan:** See [docs/TRACKING_PLAN.md](./TRACKING_PLAN.md) for all events and properties.

### Data Fetching Hooks

| Hook                         | Purpose                  | Returns                       | Source File                   |
| ---------------------------- | ------------------------ | ----------------------------- | ----------------------------- |
| `useCarsList()`              | Fetch all cars list      | `{ data: cars[], isLoading }` | `hooks/useCarData.js`         |
| `useCarBySlug(slug)`         | Fetch single car by slug | `{ data: car, isLoading }`    | `hooks/useCarData.js`         |
| `useTracks()`                | Fetch all tracks         | `{ data, isLoading }`         | `hooks/useEventsData.js`      |
| `useEvents(filters)`         | Fetch events             | `{ events, isLoading }`       | `hooks/useEventsData.js`      |
| `useLapTimeEstimate(params)` | Lap time estimation      | `{ data, isLoading }`         | `hooks/useLapTimeEstimate.js` |

**Car Data Fallback Pattern (Garage Pages):**
Garage sub-pages (my-specs, my-build, my-parts, my-photos, my-install) use a fallback pattern:

1. First try `useCarsList()` to get car from cached list
2. If list is empty/loading, use `useCarBySlug(carSlugParam)` as fallback
3. This ensures car data loads even if the full list API fails

### User Data Hooks (from Providers)

| Hook                 | Provider                | Purpose                    |
| -------------------- | ----------------------- | -------------------------- |
| `useAuth()`          | `AuthProvider`          | Auth state, user profile   |
| `useOwnedVehicles()` | `OwnedVehiclesProvider` | User's owned vehicles CRUD |
| `useSavedBuilds()`   | `SavedBuildsProvider`   | User's build configs CRUD  |
| `useFavorites()`     | `FavoritesProvider`     | User's favorites CRUD      |
| `useCarSelection()`  | `CarSelectionProvider`  | Currently selected car     |
| `useCompare()`       | `CompareProvider`       | Comparison list            |

### Specialized Hooks

| Hook                                 | Purpose                    | File                           |
| ------------------------------------ | -------------------------- | ------------------------------ |
| `useIsFavorite(slug)`                | Check if car is favorited  | `FavoritesProvider` export     |
| `useIsInCompare(slug)`               | Check if car is in compare | `CompareProvider` export       |
| `useFavoriteCount()`                 | Get user's favorite count  | `FavoritesProvider` export     |
| `useSavedBuildCount()`               | Get user's build count     | `SavedBuildsProvider` export   |
| `useOwnedVehicleCount()`             | Get user's vehicle count   | `OwnedVehiclesProvider` export |
| `useSelectedCar()`                   | Get just the selected car  | `CarSelectionProvider` export  |
| `useBuildSummary()`                  | Get current build summary  | `CarSelectionProvider` export  |
| `useUserTrackTimes(userId, carSlug)` | User's logged track times  | `hooks/useUserData.js`         |
| `useAddTrackTime()`                  | Mutation to add track time | `hooks/useUserData.js`         |
| `useTrackStats(trackSlug)`           | Track statistics           | `hooks/useLapTimeEstimate.js`  |

### Community Data Hooks

| Hook                           | Purpose                     | File                        |
| ------------------------------ | --------------------------- | --------------------------- |
| `useCommunityBuildsInfinite()` | Infinite scroll builds feed | `hooks/useCommunityData.js` |
| `useBuildDetail(slug)`         | Single build details        | `hooks/useCommunityData.js` |
| `usePostComments(postId)`      | Comments for a post         | `hooks/useCommunityData.js` |
| `useToggleLike()`              | Like/unlike mutation        | `hooks/useCommunityData.js` |
| `useAddComment()`              | Add comment mutation        | `hooks/useCommunityData.js` |
| `useUpdateComment()`           | Edit comment mutation       | `hooks/useCommunityData.js` |
| `useDeleteComment()`           | Delete comment mutation     | `hooks/useCommunityData.js` |
| `useLinkedPost(buildId)`       | Check if build is shared    | `hooks/useCommunityData.js` |

**Note:** Community likes (`useToggleLike`) are separate from car favorites (`useFavorites`).

- `useFavorites()` = favoriting cars for your "favorites" list
- `useToggleLike()` = liking community build posts

### Hook Usage Examples

```javascript
// Fetching car data
const { car, isLoading, error } = useCarData('bmw-m3-g80');

// Getting user's owned vehicles
const { vehicles, addVehicle, updateVehicle, applyModifications } = useOwnedVehicles();

// Checking favorites
const isFavorited = useIsFavorite('porsche-911-gt3');

// Getting saved builds for a car
const { getBuildsByCarSlug } = useSavedBuilds();
const builds = getBuildsByCarSlug('bmw-m3-g80');

// Lap time estimation
const { data: estimate } = useLapTimeEstimate({
  trackSlug: 'laguna-seca',
  stockHp: 444,
  currentHp: 543,
  driverSkill: 'intermediate',
});
```

---

## Database Tables

### Car Data Tables

| Table                 | Purpose       | Key Columns                          |
| --------------------- | ------------- | ------------------------------------ |
| `cars`                | Base car data | `id`, `slug`, `name`, `hp`, `torque` |
| `car_variants`        | Trim variants | `car_id`, `variant_key`, `specs`     |
| `car_issues`          | Known issues  | `car_id`, `severity`, `description`  |
| `car_tuning_profiles` | Tuning data   | `car_id`, `upgrades_by_objective`    |
| `car_dyno_runs`       | Dyno results  | `car_id`, `whp`, `wtq`               |
| `car_track_lap_times` | Lap times     | `car_id`, `track`, `time`            |

### User Data Tables

| Table                          | Purpose                     | Key Columns                                                             |
| ------------------------------ | --------------------------- | ----------------------------------------------------------------------- |
| `user_profiles`                | User profile & subscription | `id`, `stripe_customer_id`, `subscription_tier`, `cancel_at_period_end` |
| `user_vehicles`                | Owned vehicles              | `user_id`, `matched_car_id`, `vin`                                      |
| `user_favorites`               | Favorited cars              | `user_id`, `car_id`                                                     |
| `user_projects`                | Build configs               | `user_id`, `car_id`, `selected_upgrades`                                |
| `user_preferences`             | User settings (legacy)      | `user_id`, `preferences`                                                |
| `user_questionnaire_responses` | Enthusiast Profile answers  | `user_id`, `question_id`, `answer`                                      |
| `user_profile_summary`         | Derived user persona        | `user_id`, `driving_persona`, `knowledge_level`                         |

**Enthusiast Profile (Questionnaire System):**
The questionnaire system (`data/questionnaireLibrary.js`) provides 60+ questions across 8 categories for deep user personalization. Responses are stored in `user_questionnaire_responses` and used by AL to tailor recommendations. Key components:

- `QuestionnaireHub` - Main UI in Settings
- `useQuestionnaire` hook - React Query data fetching
- `get_questionnaire_for_al()` RPC - Optimized AL context fetch
- `buildPersonalizationSection()` in alConfig.js - System prompt generation

**user_profiles Subscription Columns:**
| Column | Type | Purpose |
|--------|------|---------|
| `stripe_customer_id` | text | Stripe customer ID |
| `stripe_subscription_id` | text | Active subscription ID |
| `stripe_subscription_status` | text | Status: active, trialing, past_due, canceled |
| `subscription_tier` | text | Current tier: free, collector, tuner |
| `subscription_started_at` | timestamp | When subscription started |
| `subscription_ends_at` | timestamp | Current period end / trial end |
| `cancel_at_period_end` | boolean | Will cancel at period end (for "Cancels on [date]" UI) |

### Community Tables

| Table                | Purpose               |
| -------------------- | --------------------- |
| `community_posts`    | User build posts      |
| `community_insights` | AI-generated insights |

### Maintenance Tables

| Table                       | Purpose           |
| --------------------------- | ----------------- |
| `vehicle_maintenance_specs` | Maintenance specs |
| `vehicle_service_intervals` | Service intervals |

### Notification Tables

| Table                               | Purpose                      | Key Columns                                                           |
| ----------------------------------- | ---------------------------- | --------------------------------------------------------------------- |
| `notifications`                     | In-app notification messages | `id`, `user_id`, `category`, `title`, `body`, `is_read`, `action_url` |
| `notification_preferences`          | Global notification settings | `user_id`, `notifications_enabled`, `email_enabled`, `in_app_enabled` |
| `notification_category_preferences` | Per-category settings        | `user_id`, `category`, `email_enabled`, `in_app_enabled`, `frequency` |
| `quiet_hours`                       | Do-not-disturb settings      | `user_id`, `enabled`, `start_time`, `end_time`, `timezone`            |
| `notification_interactions`         | Notification analytics       | `notification_id`, `user_id`, `interaction_type`, `created_at`        |

**Notification Category Enum:**

- `system` - Account, security, payment alerts
- `engagement` - Milestones, streaks, achievements
- `social` - Comments, likes on builds
- `vehicle` - Recalls, known issues, maintenance
- `events` - Event reminders, new events nearby
- `al` - AL conversation updates

### Engagement Tables

| Table                    | Purpose                | Key Columns                                                                  |
| ------------------------ | ---------------------- | ---------------------------------------------------------------------------- |
| `user_engagement_scores` | User activity tracking | `user_id`, `score`, `current_streak`, `longest_streak`, `last_activity_date` |

**Streak Tracking Columns (user_engagement_scores):**
| Column | Type | Purpose |
|--------|------|---------|
| `current_streak` | integer | Current consecutive day streak |
| `longest_streak` | integer | All-time longest streak |
| `last_activity_date` | date | Last day user was active |
| `streak_frozen_until` | date | Streak freeze expiration (premium feature) |
| `streak_milestone_7d_at` | timestamp | First time user hit 7-day streak |
| `streak_milestone_30d_at` | timestamp | First time user hit 30-day streak |
| `streak_milestone_100d_at` | timestamp | First time user hit 100-day streak |

### Billing & Payment Tables

| Table                      | Purpose             | Key Columns                          |
| -------------------------- | ------------------- | ------------------------------------ |
| `processed_webhook_events` | Webhook idempotency | `event_id`, `event_type`, `provider` |

**Webhook Idempotency:**
The `processed_webhook_events` table prevents duplicate processing of Stripe webhooks.
Before processing any Stripe event, the webhook handler checks if the event ID exists in this table.
If not, it processes the event and records it. This handles Stripe's retry behavior safely.

### AI/AL Tables

| Table                   | Purpose                  | Key Columns                                                                                         |
| ----------------------- | ------------------------ | --------------------------------------------------------------------------------------------------- |
| `al_conversations`      | Conversation sessions    | `id`, `user_id`, `car_context`, `share_token`, `share_expires_at`, `share_revoked_at`, `created_at` |
| `al_messages`           | Chat messages            | `conversation_id`, `role`, `content`, `tool_calls`                                                  |
| `al_prompt_versions`    | Prompt A/B testing       | `id`, `version_name`, `system_prompt`, `is_active`                                                  |
| `al_evaluation_runs`    | Evaluation run summaries | `prompt_version_id`, `pass_rate`, `avg_weighted_score`, `recommendation`                            |
| `al_evaluation_results` | Individual test results  | `run_id`, `test_case_id`, `passed`, `dimension_scores`                                              |
| `al_response_feedback`  | User thumbs up/down      | `conversation_id`, `message_id`, `feedback_type`, `feedback_category`                               |
| `source_documents`      | RAG source documents     | `id`, `source_type`, `source_url`, `source_confidence`, `checksum`                                  |
| `document_chunks`       | RAG vector chunks        | `source_id`, `chunk_text`, `embedding`, `confidence_level`, `last_verified_at`                      |

**AL Evaluation Columns (`al_evaluation_runs`):**
| Column | Type | Purpose |
|--------|------|---------|
| `total_cases` | integer | Total test cases run |
| `passed_cases` | integer | Number passed |
| `pass_rate` | numeric | Percentage passed (0-100) |
| `avg_weighted_score` | numeric | Average weighted score (0-5) |
| `dimension_scores` | jsonb | Per-dimension averages |
| `recommendation` | text | READY_FOR_PRODUCTION, NEEDS_IMPROVEMENT, NOT_READY |

**AL Feedback Columns (`al_response_feedback`):**
| Column | Type | Purpose |
|--------|------|---------|
| `feedback_type` | text | `thumbs_up` or `thumbs_down` |
| `feedback_category` | text | `helpful`, `accurate`, `inaccurate`, `confusing`, etc. |
| `query_text` | text | User's original query |
| `response_text` | text | AL's response (truncated) |
| `tools_used` | text[] | Tools called in response |
| `prompt_version_id` | uuid | Links to A/B test variant |

**Document Confidence Levels (`document_chunks.confidence_level`):**
| Level | Meaning |
|-------|---------|
| 1.0 | Official manufacturer data |
| 0.9 | Expert-verified content |
| 0.7 | Curated database content (default) |
| 0.5 | Community-contributed |
| 0.3 | Unverified/scraped |

**AL Conversation Sharing (`al_conversations` sharing columns):**
| Column | Type | Purpose |
|--------|------|---------|
| `share_token` | uuid | Unique token for public sharing (NULL = not shared) |
| `share_expires_at` | timestamptz | When the share link expires (NULL = never) |
| `share_revoked_at` | timestamptz | When owner revoked sharing (NULL = active) |

**Sharing Database Functions:**

```sql
-- Generate a share token (returns UUID)
SELECT generate_conversation_share_token(
  p_conversation_id := '...',
  p_user_id := '...',
  p_expires_in_days := 30  -- NULL for never expires
);

-- Revoke sharing (returns boolean)
SELECT revoke_conversation_share_token(
  p_conversation_id := '...',
  p_user_id := '...'
);
```

**Shared Conversation API**: `app/api/shared/al/[token]/route.js`

- Public endpoint (no auth required)
- Rate limited (60 req/min per IP)
- Validates token format (UUID)
- Checks expiration and revocation
- Returns sanitized data (no PII - user_id, email excluded)
- Returns 404 for invalid/revoked, 410 for expired

### DEPRECATED Tables (DO NOT USE)

| Table/Column                   | Use Instead                                 | Status            |
| ------------------------------ | ------------------------------------------- | ----------------- |
| `vehicle_known_issues`         | `car_issues`                                | ❌ Deprecated     |
| `cars.upgrade_recommendations` | `car_tuning_profiles.upgrades_by_objective` | ❌ Column removed |
| `cars.popular_track_mods`      | `car_tuning_profiles.upgrades_by_objective` | ⚠️ Read-only      |

**Verified 2026-01-22**: No active `.from()` queries to deprecated tables in codebase.

---

## Build & Vehicle Data Model

### Terminology

| Term              | Definition                                                     | Database              |
| ----------------- | -------------------------------------------------------------- | --------------------- |
| **Car**           | A vehicle model in our database (e.g., "2020-2023 BMW M3 G80") | `cars` table          |
| **Vehicle**       | A user's owned instance of a car with their specific details   | `user_vehicles` table |
| **Build/Project** | A saved upgrade configuration for a car                        | `user_projects` table |

### Data Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                          cars                                    │
│  (Stock specs: hp, torque, 0-60, scores, etc.)                  │
│  Accessed via: car_id or slug                                    │
└───────────────────────────┬─────────────────────────────────────┘
                            │
          ┌─────────────────┴─────────────────┐
          │                                   │
          ▼                                   ▼
┌─────────────────────┐            ┌─────────────────────┐
│   user_vehicles     │            │   user_projects     │
│   (Owned instance)  │            │   (Build config)    │
│                     │            │                     │
│ matched_car_id ─────┼────────────│ car_id ─────────────┤
│ installed_mods[]    │            │ selected_upgrades   │
│ total_hp_gain       │◄───────────│ total_hp_gain       │
│ active_build_id ────┼──────────►│ id                  │
│ custom_specs        │            │ final_hp (snapshot) │
└─────────────────────┘            │ stock_hp (snapshot) │
                                   └─────────────────────┘
```

### Key Relationships

| Field                                   | Purpose                                                         |
| --------------------------------------- | --------------------------------------------------------------- |
| `user_vehicles.matched_car_id`          | Links vehicle to stock car data (FK to `cars.id`)               |
| `user_vehicles.installed_modifications` | Array of upgrade keys currently on this vehicle                 |
| `user_vehicles.active_build_id`         | FK to `user_projects.id` - the build that was applied           |
| `user_projects.car_id`                  | Links build to stock car data (FK to `cars.id`)                 |
| `user_projects.selected_upgrades`       | JSONB with `{ upgrades: [], factoryConfig, wheelFitment, ... }` |

### Data Flow: User Adds Car to Garage

```
1. User adds vehicle (VIN or manual entry)
   │
   ▼
2. System matches to cars table → matched_car_id populated
   │
   ▼
3. user_vehicles row created with:
   - matched_car_id (for stock data lookups)
   - installed_modifications: [] (empty - stock vehicle)
   - total_hp_gain: 0
```

### Data Flow: User Creates Build

```
1. User goes to Tuning Shop, selects car
   │
   ▼
2. User selects upgrades → user_projects.selected_upgrades updated
   │
   ▼
3. Performance calculated via lib/performanceCalculator
   │
   ▼
4. Snapshots stored in user_projects:
   - stock_hp, final_hp, total_hp_gain
   - stock_zero_to_sixty, final_zero_to_sixty, etc.
```

### Data Flow: User Applies Build to Vehicle

```
1. User clicks "Apply to Vehicle" on a build
   │
   ▼
2. applyBuildToVehicle() in userDataService.js:
   - Copies user_projects.selected_upgrades.upgrades → user_vehicles.installed_modifications
   - Sets user_vehicles.active_build_id = user_projects.id
   - Sets user_vehicles.total_hp_gain from build
```

### Source of Truth by Context

| Context                  | Stock Data Source           | Modification Source                     | Display Logic                     |
| ------------------------ | --------------------------- | --------------------------------------- | --------------------------------- |
| **Car Detail Page**      | `cars` table                | N/A (generic car)                       | Show stock specs                  |
| **My Garage (vehicle)**  | `cars` via `matched_car_id` | `user_vehicles.installed_modifications` | Stock + mods = final              |
| **Tuning Shop (build)**  | `cars` via `car_id`         | `user_projects.selected_upgrades`       | Recalculate from selections       |
| **Community Build Page** | `user_projects` snapshots   | `user_projects.selected_upgrades`       | Use stored `final_hp`, `stock_hp` |
| **AL Context**           | `cars` + `user_vehicles`    | Both (if user has vehicle)              | Merge stock + user mods           |

### Calculating Modified Performance

**RULE**: Always use `lib/performanceCalculator` for calculations. Never store calculated values except as snapshots for display consistency.

```javascript
// ✅ CORRECT: Calculate from source data
import { calculateSmartHpGain, calculateAllModificationGains } from '@/lib/performanceCalculator';

// Get stock specs from car
const stockHp = car.hp;
const stockTorque = car.torque;

// Get modifications from vehicle or build
const mods = vehicle.installedModifications || build.upgrades;

// Calculate (option 1: full smart calculation)
const result = calculateSmartHpGain(car, mods);
// Returns: { stockHp, totalGain, projectedHp, confidence, tier }

// Calculate (option 2: simple wrapper)
const { hpGain } = calculateAllModificationGains(mods, car);
const finalHp = stockHp + hpGain;
```

### Displaying Vehicle Data in Components

```javascript
// ✅ CORRECT: Always calculate HP dynamically from installed mods
import { calculateAllModificationGains } from '@/lib/performanceCalculator';

function VehicleCard({ vehicle }) {
  const { data: car } = useCarBySlug(vehicle.matchedCarSlug);

  // Stock data comes from matched car
  const stockHp = car?.hp || 0;

  // SOURCE OF TRUTH: Calculate HP gain dynamically - NEVER use stored totalHpGain
  const installedMods = vehicle.installedModifications || [];
  const modificationGains = useMemo(() => {
    if (installedMods.length === 0) return { hpGain: 0 };
    return calculateAllModificationGains(installedMods, car);
  }, [installedMods, car]);

  const hpGain = modificationGains.hpGain;
  const finalHp = stockHp + hpGain;
  const isModified = installedMods.length > 0;

  return (
    <div>
      <span>{finalHp} HP</span>
      {isModified && hpGain > 0 && <Badge>+{hpGain} HP</Badge>}
    </div>
  );
}
```

---

## Garage Feature Architecture

### Garage Pages Overview

| Page            | Path                 | Purpose                                            | Data Sources                                   |
| --------------- | -------------------- | -------------------------------------------------- | ---------------------------------------------- |
| **Garage Home** | `/garage`            | Vehicle selector, garage overview, drag-to-reorder | `OwnedVehiclesProvider`, `FavoritesProvider`   |
| **My Specs**    | `/garage/my-specs`   | Full vehicle specifications                        | `user_vehicles` + `cars` via `matched_car_id`  |
| **My Build**    | `/garage/my-build`   | Configure upgrades/modifications                   | `SavedBuildsProvider`, `performanceCalculator` |
| **My Parts**    | `/garage/my-parts`   | Research and select specific parts                 | `user_project_parts`, parts catalog            |
| **My Install**  | `/garage/my-install` | Track installation progress, find service centers  | `user_project_parts.status`                    |
| **My Photos**   | `/garage/my-photos`  | Manage vehicle photos                              | `user_uploaded_images`                         |

### Garage Navigation Flow

```
/garage (Garage Home)
    │
    └── Select Vehicle → Opens vehicle detail pages
            │
            └── MyGarageSubNav dropdown navigates between:
                ├── /garage/my-specs
                ├── /garage/my-build
                ├── /garage/my-parts
                ├── /garage/my-install
                └── /garage/my-photos
```

### Garage URL Query Parameters

The "My" pages use query params to identify context:

| Param                  | Purpose                      | Example                           |
| ---------------------- | ---------------------------- | --------------------------------- |
| `?build={buildId}`     | Load specific build          | `/garage/my-build?build=abc123`   |
| `?car={carSlug}`       | Load car (no specific build) | `/garage/my-specs?car=bmw-m3-g80` |
| `?vehicle={vehicleId}` | Load specific owned vehicle  | `/garage/my-specs?vehicle=xyz789` |

### Garage Car Data Loading Pattern

All garage sub-pages need full car data (hp, torque, specs) to function. They use a **fallback pattern**:

```javascript
// 1. Try to get car from full list first
const { data: allCars = [], isLoading: carsLoading } = useCarsList();

// 2. Fallback: fetch single car if list is empty/unavailable
const { data: fallbackCar } = useCarBySlug(carSlugParam, {
  enabled: !!carSlugParam && allCars.length === 0 && !carsLoading,
});

// 3. Resolution logic in useEffect
useEffect(() => {
  if (allCars.length > 0) {
    const car = allCars.find((c) => c.slug === carSlugParam);
    if (car) setSelectedCar(car);
  } else if (fallbackCar) {
    setSelectedCar(fallbackCar);
  }
}, [allCars, fallbackCar, carSlugParam]);
```

**Why this pattern?**

- `useCarsList()` is cached and efficient for multiple lookups
- If the full list API fails or is slow, `useCarBySlug()` provides a direct fallback
- Ensures garage pages always have car data (HP, torque, 0-60, etc.)

**Pages using this pattern:**

- `/garage/my-specs`
- `/garage/my-build`
- `/garage/my-parts`
- `/garage/my-install`
- `/garage/my-photos`

### Garage Components

**Location**: `components/garage/`

| Component              | Purpose                                       | Used On            |
| ---------------------- | --------------------------------------------- | ------------------ |
| `MyGarageSubNav`       | Dropdown navigation between my-\* pages       | All my-\* pages    |
| `VehicleInfoBar`       | Vehicle image + name + page-specific stat     | Top of my-\* pages |
| `VehicleSelector`      | Select vehicle from garage                    | Garage home        |
| `QuickActionBar`       | Quick action buttons                          | Garage home        |
| `CircularGauge`        | Circular progress indicator                   | Score display      |
| `PremiumSpecCard`      | Premium spec display card                     | My Specs           |
| `PremiumSpecRow`       | Single spec row                               | My Specs           |
| `VehicleHealthCard`    | Vehicle health/score card                     | Garage home        |
| `ObjectiveBanner`      | Build goals display (track/street/show/daily) | My Build           |
| `BuildGuidanceCard`    | Conditional trust signals                     | My Build           |
| `InstallChecklistItem` | Individual install task                       | My Install         |
| `InstallPathSelector`  | DIY vs Pro selector                           | My Install         |
| `InstallToolsPanel`    | Tools required panel                          | My Install         |
| `ServiceCenterCard`    | Service center info                           | My Install         |
| `ServiceCenterFinder`  | Find nearby service centers                   | My Install         |
| `DIYVideoEmbed`        | YouTube DIY video embed                       | My Install         |

**Garage Home List View** (inline component in `app/(app)/garage/page.jsx`)

- `VehicleListView` - Compact list of vehicles with drag-to-reorder
- `SortableVehicleItem` - Individual draggable item with drag handle
- Uses `@dnd-kit/core` + `@dnd-kit/sortable` for touch-friendly reordering
- Drag handle (grip icon) separates drag from swipe-to-delete gesture
- Persists order via `reorderVehicles()` API (`/api/users/[userId]/vehicles/reorder`)

**Import pattern:**

```javascript
import {
  MyGarageSubNav,
  VehicleInfoBar,
  UpgradeCountStat,
  HpGainStat,
  PartsCountStat,
} from '@/components/garage';
```

### VehicleInfoBar Stat Components

Pre-built stat badges for VehicleInfoBar:

| Component          | Page           | Example              |
| ------------------ | -------------- | -------------------- |
| `UpgradeCountStat` | My Build       | "4 upgrades" (teal)  |
| `HpGainStat`       | My Performance | "+99 HP" (green)     |
| `PartsCountStat`   | My Parts       | "3/4 parts" (yellow) |

### Garage Score Service

**Location**: `lib/garageScoreService.js`

Calculates completeness score (0-100) for vehicles based on engagement.

| Category          | Max Points | How to Earn                         |
| ----------------- | ---------- | ----------------------------------- |
| `specs_confirmed` | 20         | Verify vehicle specs are accurate   |
| `build_saved`     | 15         | Save a build in Tuning Shop         |
| `build_shared`    | 25         | Share build to community (highest!) |
| `parts_specified` | 25         | Add parts with brand/model details  |
| `photos_uploaded` | 15         | Upload photos of your car           |

**Key functions:**

```javascript
import {
  getVehicleScore, // Get current cached score
  recalculateScore, // Force recalculate and save
  getScoreChecklist, // Get completion checklist
  getImprovementTips, // Get tips for improving score
  getScoreLevel, // Get level name (Beginner, Intermediate, etc.)
} from '@/lib/garageScoreService';
```

### Data Flow: Garage Home

```
Garage Home Page
        │
        ├─── useOwnedVehicles() → user_vehicles
        │       │
        │       └─── Each vehicle has:
        │             - matchedCarId → cars table for stock specs
        │             - installedModifications → array of upgrade keys
        │             - totalHpGain → cached HP gain
        │             - activeBuildId → FK to user_projects
        │
        ├─── useSavedBuilds() → user_projects
        │       │
        │       └─── Each build has:
        │             - carSlug, carId → link to car
        │             - upgrades → selected upgrade keys
        │             - parts → specific parts with pricing
        │
        └─── useFavorites() → user_favorites
                └─── Favorited cars (not owned)
```

### Data Flow: My Build Page

```
My Build Page
        │
        ├─── URL: ?build={buildId} or ?car={carSlug}
        │
        ├─── Load build from SavedBuildsProvider
        │       └─── getBuildById(buildId)
        │
        ├─── Load car data
        │       └─── useCarBySlug(carSlug)
        │
        ├─── User selects upgrades
        │       └─── Stored in build.selected_upgrades.upgrades[]
        │
        ├─── Calculate performance
        │       └─── calculateHpGain() from performanceCalculator
        │
        └─── Auto-save changes
                └─── autoSaveBuild() with debounce
```

### Garage Provider Usage Matrix

| Page               | OwnedVehicles | SavedBuilds | Favorites | CarSelection |
| ------------------ | ------------- | ----------- | --------- | ------------ |
| /garage            | ✅            | ✅          | ✅        |              |
| /garage/my-specs   | ✅            |             |           |              |
| /garage/my-build   | ✅            | ✅          |           | ✅           |
| /garage/my-parts   | ✅            | ✅          |           |              |
| /garage/my-install | ✅            | ✅          |           |              |
| /garage/my-photos  | ✅            |             |           |              |

### Insights Page (Build Insights Dashboard)

**Location**: `/insights` (`app/(app)/insights/`)

**Purpose**: Personalized build insights for modification enthusiasts. Shows vehicle performance metrics, build progress, and mod recommendations.

**Design Decision (Jan 2026)**: This page was intentionally redesigned to focus on **Build Insights** for car modification enthusiasts. The following features were **removed by design**:

- ❌ Maintenance reminders (oil changes, tire rotation)
- ❌ Registration/inspection due dates
- ❌ Generic vehicle health cards
- ❌ Action items for admin tasks

**What the Insights page DOES show**:

- ✅ Build Progress Rings (Power%, Handling%, Reliability%)
- ✅ HP calculations with Stock → Gained → Current breakdown
- ✅ Stage progression analysis (Stage 1/2/3)
- ✅ Build value analysis (cost efficiency)
- ✅ Next upgrade recommendations
- ✅ Platform insights (strengths, weaknesses)
- ✅ Known issues relevant to modding

**Key Components** (in `app/(app)/insights/components/`):

| Component                | Purpose                                            | Status    |
| ------------------------ | -------------------------------------------------- | --------- |
| `BuildProgressRings.jsx` | Apple Watch-style Power/Handling/Reliability rings | ✅ Active |

> **Note:** Several components were removed in the Jan 2026 cleanup (ActionCard, BuildProgressCard, GarageHealthRing, InsightCard, PersonalizeTooltip, VehicleHealthCard, VehicleSelector). See git history for details.

**Data Flow**:

```
/insights Page
    │
    ├─── useUserInsights(userId) → /api/users/[userId]/insights
    │       │
    │       └─── Returns:
    │             - vehicles[] with matched_car data
    │             - insights.buildProgress[]
    │             - summary (totalHpGain, totalMods)
    │
    ├─── HP Calculation (SOURCE OF TRUTH)
    │       │
    │       └─── calculateAllModificationGains(installedMods, car)
    │             from lib/performanceCalculator
    │             NEVER use stored totalHpGain values
    │
    └─── Analysis Components
            ├─── BuildProgressAnalysis (Stage progression)
            ├─── BuildValueAnalysis (Cost efficiency)
            ├─── NextUpgradeRecommendation
            ├─── PlatformInsights
            └─── KnownIssuesAlert (mod-relevant issues only)
```

**Service**: `lib/insightService.js`

- `getInsightsForUser(userId, vehicleId)` - Returns build-focused insights
- Uses `calculateAllModificationGains()` for HP (SOURCE OF TRUTH)

### Snapshots vs Calculations

**IMPORTANT:** Stored HP values exist for historical tracking and community sharing consistency, but **ALWAYS calculate dynamically for in-app display**. Stored values become stale when calculation logic improves.

| Data                          | Stored? | Purpose                    | Display Strategy                             |
| ----------------------------- | ------- | -------------------------- | -------------------------------------------- |
| `user_projects.stock_hp`      | ✅      | Community post consistency | Use stored for public community pages        |
| `user_projects.final_hp`      | ✅      | Community post consistency | Use stored for public community pages        |
| `user_vehicles.total_hp_gain` | ✅      | Historical tracking        | **CALCULATE** dynamically for garage display |
| Build performance details     |         |                            | ✅ Use `calculateSmartHpGain()`              |
| 0-60, quarter mile, etc.      |         |                            | ✅ Use `calculateUpgradedMetrics()`          |

**Rule of thumb:**

- **Public community pages**: Use stored snapshots (ensures posts show same values as when shared)
- **User's own garage/insights**: ALWAYS calculate dynamically from `installedModifications`

---

## Data Visualization Components

### Overview

The "Data" tab and performance visualization features use several interconnected components:

| Component          | Purpose                         | Data Sources                        |
| ------------------ | ------------------------------- | ----------------------------------- |
| `VirtualDynoChart` | HP/TQ curves by RPM             | Stock specs + modifications         |
| `LapTimeEstimator` | Track lap time estimates        | Real lap data + mods + driver skill |
| `PerformanceHub`   | Full build planner with metrics | All performance calculations        |
| `PowerBreakdown`   | HP contribution by mod category | `calculateSmartHpGain()`            |

### VirtualDynoChart

**Location**: `components/VirtualDynoChart.jsx`

Generates estimated HP/torque curves based on modifications using a physics model.

**Key Features:**

- Shows BOTH stock AND modified curves when modifications present (stock = dashed/faded, modified = solid)
- Shows HP (solid teal) and Torque (blue, labeled "lb-ft") curves
- Interactive hover/touch to see HP/TQ values at specific RPM points
- Models turbo spool characteristics (big turbo = delayed torque peak)
- Auto-detects forced induction profile from car engine and selected upgrades
- Accessible: `role="img"` with descriptive `aria-label` for screen readers
- Respects `prefers-reduced-motion` for users who disable animations

**Dual-Curve Display:**
When `hasModifications` is true:

- Stock curves appear as dashed/faded lines
- Modified curves appear as solid lines
- Legend shows "Stock" indicator + HP/TQ values for modified
- Hover tooltip shows both stock and modified values at cursor position

**Forced Induction Profiles:**

| Profile                    | Torque Peak        | Low-End | Spool Delay |
| -------------------------- | ------------------ | ------- | ----------- |
| `na` (naturally aspirated) | 70% of HP peak RPM | 100%    | 0           |
| `turbo-stock`              | 72%                | 85%     | 0.1         |
| `turbo-upgraded`           | 78%                | 70%     | 0.25        |
| `turbo-big-single`         | 85%                | 50%     | 0.40        |
| `turbo-twin`               | 75%                | 80%     | 0.15        |
| `supercharged`             | 60%                | 110%    | 0           |
| `supercharged-centrifugal` | 80%                | 90%     | 0           |

**Props:**

```javascript
<VirtualDynoChart
  stockHp={444} // From car.hp
  estimatedHp={543} // From calculateSmartHpGain().projectedHp
  stockTorque={406} // From car.torque
  estimatedTq={480} // Calculated from gains
  peakRpm={6500} // From car.peakRpm or default
  car={car} // For engine detection
  selectedUpgrades={[]} // For FI profile detection
  carName="BMW M3" // For AL prompts
  carSlug="bmw-m3-g80" // For AL prompts
/>
```

### LapTimeEstimator

**Location**: `components/LapTimeEstimator.jsx`

Data-driven lap time estimation using real lap time data.

**Key Features:**

- Uses 3,800+ real lap times across 340+ tracks
- Driver skill-based estimation (affects mod utilization)
- Modification impact calculation
- Track time logging and history

**Driver Skill Levels:**

| Skill          | Percentile | Mod Utilization | Description                |
| -------------- | ---------- | --------------- | -------------------------- |
| `beginner`     | 90th       | 20%             | 0-2 years track experience |
| `intermediate` | 65th       | 50%             | 2-5 years, consistent laps |
| `advanced`     | 25th       | 80%             | 5+ years, pushing limits   |
| `professional` | 5th        | 95%             | Instructor / racer         |

**How It Works:**

1. Fetches track statistics from `car_track_lap_times` via `lapTimeService`
2. Gets baseline time at selected driver skill percentile
3. Calculates theoretical mod improvement (power, tires, suspension, brakes, aero, weight)
4. Applies skill-based utilization: `realizedImprovement = theoretical × modUtilization`
5. Returns: `moddedLapTime = stockLapTime - realizedImprovement`

**Props:**

```javascript
<LapTimeEstimator
  stockHp={444} // For power-based adjustment
  estimatedHp={543} // Current HP with mods
  weight={3500} // Vehicle weight
  drivetrain="RWD" // Drivetrain type
  tireCompound="summer" // Tire type
  suspensionSetup={{}} // Suspension mods
  brakeSetup={{}} // Brake mods
  aeroSetup={{}} // Aero mods
  weightMod={-50} // Weight reduction in lbs
  user={user} // For track time logging
  carSlug="bmw-m3-g80" // For car context
/>
```

### lapTimeService (Core Service)

**Location**: `lib/lapTimeService.js`

The single source of truth for lap time estimation.

**Key Functions:**

| Function                 | Purpose                             |
| ------------------------ | ----------------------------------- |
| `estimateLapTime()`      | Main estimation with mods and skill |
| `getTrackBaseline()`     | Get percentile-based baselines      |
| `getTrackStatsSummary()` | Track statistics for UI             |
| `findSimilarCars()`      | Find comparable cars for reference  |

**Modification Impact Factors (MOD_IMPACT):**

| Category       | Factor             | Max |
| -------------- | ------------------ | --- |
| Power          | 1.5% per 50hp      | 8%  |
| Tires (summer) | 2%                 | -   |
| Tires (R-comp) | 7%                 | -   |
| Tires (slick)  | 10%                | -   |
| Coilovers      | 2.5%               | -   |
| BBK Front      | 0.5%               | -   |
| GT Wing High   | 2.5%               | -   |
| Weight         | 0.01% per lb saved | 5%  |

### PerformanceHub

**Location**: `components/PerformanceHub.jsx`

The main build planner component on car detail pages.

**Key Features:**

- Package selector (Stock, Street Sport, Track Pack, Time Attack, Ultimate Power, Custom)
- Real-time performance metric updates
- Upgrade dependency checking
- Smart HP calculation with diminishing returns
- Save/load builds integration

**Data Flow:**

```
PerformanceHub
    │
    ├─── Selected Upgrades (state)
    │       │
    │       └─── getAvailableUpgrades(car) → packages, modulesByCategory
    │
    ├─── Performance Calculations
    │       │
    │       ├─── calculateSmartHpGain(car, upgrades)
    │       │       └─── Returns: stockHp, projectedHp, totalGain, conflicts
    │       │
    │       └─── getPerformanceProfile(car, upgrades)
    │               └─── Returns: stockMetrics, upgradedMetrics, stockScores, upgradedScores
    │
    ├─── Display Components
    │       ├─── RatingBar (GT-style visual bars)
    │       ├─── RealMetricRow (HP, 0-60, braking, grip)
    │       └─── ScoreBar (subjective scores)
    │
    └─── Save/Apply
            ├─── SavedBuildsProvider.saveBuild()
            └─── OwnedVehiclesProvider.applyModifications()
```

**Performance Metrics Calculated:**

| Metric       | Source                               | Unit    |
| ------------ | ------------------------------------ | ------- |
| Power        | `calculateSmartHpGain().projectedHp` | HP      |
| 0-60         | `upgradedMetrics.zeroToSixty`        | seconds |
| 60-0 Braking | `upgradedMetrics.braking60To0`       | feet    |
| Lateral Grip | `upgradedMetrics.lateralG`           | G       |

### PowerBreakdown

**Location**: `components/PowerBreakdown.jsx`

Donut chart showing HP contribution by modification category.

**Categories:**

- ECU & Tuning
- Forced Induction
- Exhaust
- Intake
- Other

**Props:**

```javascript
<PowerBreakdown
  upgrades={effectiveSelectedModules} // Array of upgrade keys
  car={car} // For calculation context
  totalHpGain={smartHp.totalGain} // From calculateSmartHpGain()
  carName="BMW M3"
  carSlug="bmw-m3-g80"
/>
```

### User Track Times Display

**Location**: `app/(app)/data/page.jsx` (Track tab)

Displays logged track times with progress tracking and management.

**Key Features:**

- Personal Best (PB) indicator with trophy icon for fastest time per track
- Edit/delete functionality for each logged time
- Improvement trend visualization (total improvement across sessions)
- Per-track progress indicator showing improvement over multiple sessions

**Track Time Item Data:**

```javascript
{
  id: string,
  lap_time_seconds: number,
  track_name: string,
  track_config: string | null,
  session_date: string,
  conditions: 'dry' | 'wet' | 'mixed',
  isPB: boolean,              // Calculated: is this the fastest at this track?
  trackImprovement: {         // Calculated: improvement data for this track
    total: number,            // Seconds improved (first time - PB)
    sessions: number,         // Total sessions at this track
    firstTime: number,
    pb: number,
  } | null,
  sessionsAtTrack: number,
}
```

**Hooks Used:**

- `useUserTrackTimes(userId, carSlug)` - Fetch user's track times
- `useAddTrackTime()` - Add new track time
- `useDeleteTrackTime()` - Delete existing track time

### Dyno/Track Logging Modals

**Locations:**

- `components/DynoLogModal.jsx`
- `components/TrackTimeLogModal.jsx`

**Mods Snapshot Feature:**
Both modals accept `currentBuildInfo` prop to display and save the current modification state at time of logging:

```javascript
currentBuildInfo={{
  upgrades: ['stage1-tune', 'catback-exhaust', ...], // Array of upgrade keys
  totalHpGain: 45,                                   // HP gain from mods
  estimatedHp: 489,                                  // Total estimated HP
}}
```

This snapshot is saved with the logged data for future reference and analysis.

### Data Tables Used

| Table                 | Purpose             | Key Columns                                     |
| --------------------- | ------------------- | ----------------------------------------------- |
| `car_track_lap_times` | Real lap time data  | `car_id`, `track_id`, `lap_time_ms`, `is_stock` |
| `car_dyno_runs`       | Real dyno data      | `car_id`, `whp`, `wtq`, `is_stock`              |
| `tracks`              | Track information   | `slug`, `name`, `length`, `corners`             |
| `cars`                | Stock vehicle specs | `hp`, `torque`, `curb_weight`, `zero_to_sixty`  |

### Connecting Modifications to Visualizations

When displaying modified performance data:

```javascript
// 1. Get stock data from car
const stockHp = car.hp;
const stockTorque = car.torque;

// 2. Get modifications from build or vehicle
const upgrades = build.selectedUpgrades.upgrades || vehicle.installedModifications;

// 3. Calculate modified performance
import { calculateSmartHpGain } from '@/lib/performanceCalculator';
const result = calculateSmartHpGain(car, upgrades);

// 4. Pass to visualization components
<VirtualDynoChart
  stockHp={stockHp}
  estimatedHp={result.projectedHp}
  stockTorque={stockTorque}
  estimatedTq={result.projectedTq}
  selectedUpgrades={upgrades}
/>

<LapTimeEstimator
  stockHp={stockHp}
  estimatedHp={result.projectedHp}
  tireCompound={build.tireCompound || 'summer'}
  suspensionSetup={build.suspension}
  // ...other mods
/>
```

### Hook: useLapTimeEstimate

**Location**: `hooks/useLapTimeEstimate.js`

React Query hook for lap time estimation.

```javascript
import { useLapTimeEstimate, DRIVER_SKILLS, formatLapTime } from '@/hooks/useLapTimeEstimate';

const { data: estimate, isLoading } = useLapTimeEstimate({
  trackSlug: 'laguna-seca',
  stockHp: 444,
  currentHp: 543,
  weight: 3500,
  driverSkill: 'intermediate',
  mods: {
    tireCompound: 'summer',
    suspension: { type: 'coilovers' },
    brakes: { bbkFront: true },
  },
});

// estimate = {
//   source: 'real_data',
//   sampleSize: 150,
//   stockLapTime: 96.5,       // seconds
//   moddedLapTime: 94.2,      // seconds
//   improvement: 2.3,         // seconds gained
//   theoreticalImprovement: 4.6,  // if you were pro
//   utilization: 0.50,        // intermediate = 50%
// }
```

**Why snapshots exist**: When a build is shared to community, we store the performance values at time of share. This ensures:

1. Community pages load fast (no recalculation)
2. Values remain consistent even if calculation logic changes
3. Historical builds show what they showed when created

### Custom Specs (User-Specific Details)

`user_vehicles.custom_specs` stores user-specific modification details (wheels, tires, etc.) that override stock values:

```javascript
// Custom specs structure
{
  wheels: { front: { size: '19x9.5', brand: 'Volk' }, rear: { ... } },
  tires: { front: { size: '265/35R19', brand: 'Michelin' }, rear: { ... } },
  suspension: { ... },
  brakes: { ... },
}

// Use getVehicleMergedSpecs() to get stock + custom merged
const { data: mergedSpecs } = await supabase.rpc('get_vehicle_merged_specs', {
  p_vehicle_id: vehicleId
});
```

---

## State Management

### Provider Responsibility Matrix

| Provider                     | Data Owned                  | Persists To             | Real-time? | Hook                      |
| ---------------------------- | --------------------------- | ----------------------- | ---------- | ------------------------- |
| `AuthProvider`               | User auth, profile          | Supabase cookies        | Yes        | `useAuth()`               |
| `OwnedVehiclesProvider`      | User's owned vehicles       | Supabase + localStorage | No         | `useOwnedVehicles()`      |
| `SavedBuildsProvider`        | User's build configs        | Supabase + localStorage | No         | `useSavedBuilds()`        |
| `FavoritesProvider`          | User's favorites            | Supabase + localStorage | **Yes**    | `useFavorites()`          |
| `CarSelectionProvider`       | Currently selected car      | localStorage            | No         | `useCarSelection()`       |
| `CompareProvider`            | Comparison list (up to 4)   | localStorage            | No         | `useCompare()`            |
| `LoadingProgressProvider`    | Loading states coordination | Memory only             | No         | `useLoadingProgress()`    |
| `BannerProvider`             | Banner visibility state     | Memory only             | No         | `useBanner()`             |
| `PointsNotificationProvider` | Points toast queue          | Memory only             | No         | `usePointsNotification()` |

### Provider Context Value Memoization (REQUIRED)

**All providers MUST memoize their context values using `useMemo` to prevent unnecessary re-renders.**

```jsx
// ✅ CORRECT - Memoized context value
function MyProvider({ children }) {
  const [state, setState] = useState(initialState);
  const myCallback = useCallback(() => {
    /* ... */
  }, []);

  const value = useMemo(
    () => ({
      state,
      myCallback,
    }),
    [state, myCallback]
  );

  return <MyContext.Provider value={value}>{children}</MyContext.Provider>;
}

// ❌ WRONG - New object on every render (causes all consumers to re-render)
function MyProvider({ children }) {
  const [state, setState] = useState(initialState);

  return <MyContext.Provider value={{ state, setState }}>{children}</MyContext.Provider>;
}
```

**Audit Status (2026-01-25):** All 9 providers now use `useMemo` for their context values.

### Provider Details

**AuthProvider** (`components/providers/AuthProvider.jsx`)

- Session management, login state, user profile
- Source: Supabase Auth

**OwnedVehiclesProvider** (`components/providers/OwnedVehiclesProvider.jsx`)

- User's owned vehicles from `user_vehicles` table
- Optimistic updates, localStorage cache for fast load
- Exports: `useOwnedVehicles()`, `useOwnedVehicleCount()`
- Methods: `addVehicle()`, `updateVehicle()`, `removeVehicle()`, `reorderVehicles()`, `applyModifications()`, `clearModifications()`, `updateCustomSpecs()`, `refresh()` (for pull-to-refresh)

**SavedBuildsProvider** (`components/providers/SavedBuildsProvider.jsx`)

- User's saved build configurations from `user_projects` table
- Exports: `useSavedBuilds()`, `useCarBuilds(slug)`, `useSavedBuildCount()`
- Methods: `saveBuild()`, `updateBuild()`, `deleteBuild()`, `getBuildById()`, `autoSaveBuild()`, `refreshBuilds()`
- **IMPORTANT**: All mutating methods return `{ data, error }` - check `error` before assuming success
- **IMPORTANT**: `updateBuild({ selectedParts })` returns `data: null` because only parts table is updated - check `if (!error)` not `if (data)`

**FavoritesProvider** (`components/providers/FavoritesProvider.jsx`)

- User's favorite cars from `user_favorites` table
- **Only provider with real-time Supabase subscriptions**
- Exports: `useFavorites()`, `useIsFavorite(slug)`, `useFavoriteCount()`

**CarSelectionProvider** (`components/providers/CarSelectionProvider.jsx`)

- Currently selected car for tuning shop / upgrade planning
- Uses `lib/stores/carSelectionStore.js` for reducer logic
- LocalStorage only (no DB sync)
- Exports: `useCarSelection()`, `useSelectedCar()`, `useBuildSummary()`

**CompareProvider** (`components/providers/CompareProvider.jsx`)

- Cars in comparison list (max 4)
- LocalStorage with optional DB sync for logged-in users
- Exports: `useCompare()`, `useIsInCompare(slug)`, `useCompareCount()`

### Store Files (Logic Only - Not State)

| File                              | Purpose                       | Used By                |
| --------------------------------- | ----------------------------- | ---------------------- |
| `lib/stores/carSelectionStore.js` | Reducer, actions, persistence | `CarSelectionProvider` |

**Note**: The `carSelectionStore.js` is NOT a separate Zustand store - it provides pure functions and reducer logic that `CarSelectionProvider` uses. This is the correct architecture.

### When to Use Which Provider

```
Need user's owned vehicles?     → useOwnedVehicles()
Need user's saved builds?       → useSavedBuilds()
Need user's favorites?          → useFavorites()
Need currently selected car?    → useCarSelection()
Need comparison list?           → useCompare()
Need auth state?                → useAuth()
```

---

## Import Rules

### Always Import From Source of Truth

```javascript
// ✅ CORRECT - Import from source of truth
import { calculateSmartHpGain } from '@/lib/performanceCalculator';
import { resolveCarId } from '@/lib/carResolver';
import { DEFAULT_WEIGHTS } from '@/lib/scoring';
import { getUpgradeByKey } from '@/lib/upgrades';

// ❌ WRONG - Don't import from deprecated wrappers
import { calculateSmartHpGain } from '@/lib/upgradeCalculator'; // Deprecated
import { calculateUpgradedMetrics } from '@/lib/performance'; // Use performanceCalculator
```

### Database Queries - Always Use car_id

```javascript
// ✅ CORRECT - Resolve slug first, then query by ID
import { resolveCarId } from '@/lib/carResolver';

const carId = await resolveCarId(carSlug);
const { data } = await supabase.from('car_issues').select('*').eq('car_id', carId);

// ❌ WRONG - Direct slug query (no index, inconsistent)
const { data } = await supabase.from('car_issues').select('*').eq('car_slug', carSlug);
```

### Component Imports

```javascript
// ✅ CORRECT - Use the designated component
import { Icons } from '@/components/ui/Icons';
import VirtualDynoChart from '@/components/VirtualDynoChart';

// ❌ WRONG - Don't create new icon sets or duplicate components
import { MyCustomIcons } from './MyIcons'; // Don't create new icon files
```

---

## Creating New Code

### Before Creating ANY New File

1. **Search first**: Use grep/glob to find existing implementations
2. **Check this document**: Is there already a source of truth for this feature?
3. **Extend, don't duplicate**: Add to existing files when possible
4. **Ask**: "Does this already exist somewhere?"

### Decision Tree

```
Need new functionality?
│
├─ Search for existing implementation
│  ├─ Found exact match? → USE IT
│  ├─ Found similar? → EXTEND IT
│  └─ Found nothing? → Check this doc...
│
├─ Is there a source of truth for this domain?
│  ├─ Yes → Add to that file/module
│  └─ No → Continue...
│
├─ Is this genuinely new functionality?
│  ├─ Yes → Create file, UPDATE THIS DOC
│  └─ No → You missed something, search again
│
└─ NEVER create without updating SOURCE_OF_TRUTH.md
```

### File Naming Conventions

See `docs/NAMING_CONVENTIONS.md` for complete naming standards.

| Type       | Pattern                  | Example                   |
| ---------- | ------------------------ | ------------------------- |
| Service    | `[domain]Service.js`     | `eventsService.js`        |
| Client     | `[domain]Client.js`      | `carsClient.js`           |
| Calculator | `[feature]Calculator.js` | `tunabilityCalculator.js` |
| Hook       | `use[Feature].js`        | `useCarData.js`           |
| Provider   | `[Feature]Provider.jsx`  | `AuthProvider.jsx`        |
| Component  | `[Feature].jsx`          | `VirtualDynoChart.jsx`    |

**Key Terms**:

- **Car** = Database model (e.g., "Porsche 911 GT3")
- **Vehicle** = User's owned instance of a car
- **Build/Project** = Saved upgrade configuration

### When to Create a New Module vs Extend Existing

**Create new module when:**

- Functionality is genuinely distinct (new domain)
- Existing file would exceed 500 lines
- New feature has no overlap with existing code

**Extend existing when:**

- Related to an existing domain
- Could be a new function in existing service
- Shares data/types with existing code

---

## Quick Reference

### "I need to..." Reference Table

| I need to...             | Use this...                                   | File                          |
| ------------------------ | --------------------------------------------- | ----------------------------- |
| Calculate HP gains       | `calculateSmartHpGain()`                      | `lib/performanceCalculator`   |
| Get car by slug          | `resolveCarId()` then query                   | `lib/carResolver`             |
| Fetch car data (client)  | `fetchCars()`, `fetchCarBySlug()`             | `lib/carsClient`              |
| Fetch all cars (React)   | `useCarsList()`                               | `hooks/useCarData`            |
| Fetch single car (React) | `useCarBySlug(slug)`                          | `hooks/useCarData`            |
| Access user's vehicles   | `OwnedVehiclesProvider`                       | `components/providers/`       |
| Access user's builds     | `SavedBuildsProvider`                         | `components/providers/`       |
| Calculate car score      | `calculateWeightedScore()`                    | `lib/scoring`                 |
| Look up upgrade          | `getUpgradeByKey()`                           | `lib/upgrades`                |
| Log error (client)       | `logError()`                                  | `lib/errorLogger`             |
| Log error (server)       | `withErrorLogging()`                          | `lib/serverErrorLogger`       |
| Send Discord alert       | `sendDiscordAlert()`                          | `lib/discord`                 |
| Check admin auth         | `requireAdmin(request)`                       | `lib/adminAccess`             |
| Return API error         | `errors.unauthorized()`, `errors.forbidden()` | `lib/apiErrors`               |
| Rate limit API route     | `rateLimit(request, 'api')`                   | `lib/rateLimit`               |
| Validate POST body       | `validateWithSchema(schema, body)`            | `lib/schemas`                 |
| Auth user in API route   | `createServerSupabaseClient()` + `getUser()`  | `lib/supabaseServer`          |
| Add pull-to-refresh      | `<PullToRefresh onRefresh={...}>`             | `components/ui/PullToRefresh` |
| Add swipe-to-delete      | `<SwipeableRow rightActions={...}>`           | `components/ui/SwipeableRow`  |
| Refresh vehicles list    | `refresh()` from `useOwnedVehicles()`         | `OwnedVehiclesProvider`       |
| Show numeric keyboard    | `inputMode="numeric"` on input                | See Accessibility section     |
| Show decimal keyboard    | `inputMode="decimal"` on input                | See Accessibility section     |

---

## Testing

### E2E Tests (tests/e2e/)

| Test File                        | Coverage                                          |
| -------------------------------- | ------------------------------------------------- |
| `landing-pages.spec.js`          | Landing page rendering and CTAs                   |
| `auth-flows.spec.js`             | Login, signup, protected routes, session handling |
| `subscription-flows.spec.js`     | Pricing page, feature gating, upgrade prompts     |
| `al-interactions.spec.js`        | AL chat interface, input, credits display         |
| `mobile-*.spec.js`               | Mobile viewport and responsive tests              |
| `performance-regression.spec.js` | Performance benchmarks                            |

**Run tests:**

```bash
npm run test:e2e              # All E2E tests
npm run test:mobile           # Mobile viewport tests
playwright test --grep "auth" # Specific pattern
```

### Unit Tests (Vitest + React Testing Library)

**Configuration:** `vitest.config.mts`
**Setup:** `tests/setup.ts` (jest-dom matchers, browser API mocks)

| Test File                               | Coverage                                                       |
| --------------------------------------- | -------------------------------------------------------------- |
| `analytics.test.js`                     | Analytics event tracking, PostHog integration, funnel tracking |
| `car-resolver.test.js`                  | Car ID resolution                                              |
| `performance-calculator.test.js`        | HP gain calculations                                           |
| `garage-score.test.js`                  | Garage scoring algorithm                                       |
| `al-evaluation-service.test.js`         | LLM-as-judge evaluation, scoring dimensions, threshold logic   |
| `al-circuit-breaker.test.js`            | Circuit breaker state transitions, failure handling            |
| `components/ui/__tests__/Card.test.tsx` | Example component test pattern                                 |

### Integration Tests (tests/integration/)

| Test File                     | Coverage                                             |
| ----------------------------- | ---------------------------------------------------- |
| `analytics-tracking.test.js`  | Event tracking, experiment events, schema versioning |
| `api-*.test.js`               | API route validation and edge cases                  |
| `journey*.test.js`            | Complete user journey flows                          |
| `auth-email-password.test.js` | Email/password authentication flows                  |
| `tier-access.test.js`         | Subscription tier access control                     |

**Run integration tests:**

```bash
npm test -- tests/integration/analytics-tracking.test.js
npm test -- tests/integration/                      # All integration tests
```

**Run unit tests:**

```bash
npm run test:unit              # Run all unit tests
npm run test:unit:watch        # Watch mode
npm run test:unit:coverage     # With coverage report
npm test                       # Legacy Node.js tests
```

**Component Testing Pattern:**

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import Card from '../Card';

describe('Card', () => {
  it('renders children correctly', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });
});
```

### AL Evaluation (tests/data/, lib/alEvaluationService.js)

| File                                       | Purpose                                              |
| ------------------------------------------ | ---------------------------------------------------- |
| `tests/data/al-golden-dataset.json`        | 99+ test cases across categories                     |
| `lib/alEvaluationService.js`               | LLM-as-judge evaluation pipeline                     |
| `tests/unit/al-evaluation-service.test.js` | Unit tests for evaluation logic                      |
| `tests/safety/al-safety.test.js`           | Red-team safety tests (jailbreaks, dangerous advice) |

**Categories:** `specs`, `troubleshooting`, `compatibility`, `maintenance`, `builds`, `general`, `safety`, `edge_cases`

**Evaluation Dimensions (LLM-as-Judge):**
| Dimension | Weight | Threshold |
|-----------|--------|-----------|
| Technical Accuracy | 30% | ≥4.0 (critical) |
| Relevance | 25% | ≥3.5 |
| Helpfulness | 20% | ≥3.5 |
| Safety | 15% | ≥4.5 (critical) |
| Citation Quality | 10% | ≥3.0 |

**Pass Threshold:** Weighted score ≥3.5, no critical dimension failures

**Run AL evaluation:**

```bash
# Using the evaluation service (programmatic)
import { runGoldenDatasetEvaluation } from '@/lib/alEvaluationService';
const report = await runGoldenDatasetEvaluation({ promptVersionId: 'uuid' });

# Legacy script (manual)
node scripts/al-eval-llm-judge.mjs --limit=10
node scripts/al-eval-llm-judge.mjs --category=troubleshooting
```

**Safety Tests (Red Team):**

```bash
npm test -- tests/safety/al-safety.test.js
```

Tests jailbreak prevention, dangerous automotive advice refusal, identity maintenance.

---

## Feature Flags & A/B Testing

Feature flags are managed via PostHog with React hooks and components.

**Key Files:**

- `hooks/useFeatureFlag.js` - Feature flag hooks
- `components/ABTest.jsx` - Declarative A/B test components
- `lib/analytics/events.js` - Experiment tracking functions

### Defined Flags

| Flag Key             | Type         | Default     | Purpose                 |
| -------------------- | ------------ | ----------- | ----------------------- |
| `new_pricing_page`   | boolean      | false       | Redesigned pricing page |
| `pricing_variant`    | multivariate | control     | Pricing page A/B test   |
| `paywall_style`      | multivariate | modal       | Paywall presentation    |
| `show_annual_toggle` | boolean      | true        | Annual pricing toggle   |
| `upgrade_cta_text`   | multivariate | Upgrade Now | CTA text experiment     |
| `enable_dark_mode`   | boolean      | false       | Dark mode feature       |
| `enable_ai_rerank`   | boolean      | true        | Cohere reranking        |
| `trial_length_days`  | multivariate | 7           | Trial length experiment |

### Usage

```javascript
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import ABTest, { trackExperimentConversion } from '@/components/ABTest';
import { trackExperimentViewed, trackExperimentConverted } from '@/lib/analytics';

// Hook usage
const { enabled, variant, loading } = useFeatureFlag('pricing_variant');

// Declarative A/B test (auto-tracks exposure)
<ABTest experimentKey="pricing_variant" variants={{ control: <A />, 'variant-a': <B /> }} />;

// Manual tracking
trackExperimentViewed('pricing_page_test', variant);
trackExperimentConverted('pricing_page_test', variant, { value: 99 });
```

---

## Environment Validation

Environment variables are validated via `lib/env.js` using Zod schemas.

**Template:** `.env.example` - Documents all required and optional variables with descriptions.

### Required Variables

**Server-side (process.env only):**

```bash
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
COHERE_API_KEY=           # Optional - for reranking
RESEND_API_KEY=
SENTRY_DSN=
SENTRY_AUTH_TOKEN=
CRON_SECRET=
```

**Client-side (NEXT*PUBLIC*):**

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
NEXT_PUBLIC_GA_MEASUREMENT_ID=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

### Usage

```javascript
import { serverEnv, clientEnv, isStripeConfigured, isOpenAIConfigured } from '@/lib/env';

// Server-side
if (isStripeConfigured()) {
  // Safe to use Stripe
}

// Client-side
const posthogKey = clientEnv.NEXT_PUBLIC_POSTHOG_KEY;
```

---

## Theme System

Dark/light mode is implemented via `next-themes`.

### Components

| Component       | File                                     | Purpose                      |
| --------------- | ---------------------------------------- | ---------------------------- |
| `ThemeProvider` | `components/providers/ThemeProvider.jsx` | Wraps app with theme context |
| `ThemeToggle`   | `components/ThemeToggle.jsx`             | Theme toggle button          |

### Configuration

- Attribute: `data-theme` (not `class`)
- Default: `dark`
- System preference: Disabled
- Transitions: Disabled on change

### CSS Usage

```css
/* Variables respond to data-theme attribute */
[data-theme='dark'] .card {
  background-color: var(--bg-secondary);
}

[data-theme='light'] .card {
  background-color: var(--bg-primary);
}
```

---

## Settings Page Features

The Settings page (`app/(app)/settings/page.jsx`) is the central hub for user account management.

### Features Overview

| Feature             | Description                                                    | Components/APIs                                          |
| ------------------- | -------------------------------------------------------------- | -------------------------------------------------------- |
| **Avatar Upload**   | Click avatar to upload profile photo (JPG, PNG, WebP, max 5MB) | `/api/uploads`                                           |
| **Username**        | Public profile URL with real-time availability check           | `/api/user/check-username`, `is_public_slug_available()` |
| **Display Name**    | Editable display name with optimistic save                     | `updateProfile()` in AuthProvider                        |
| **Theme Toggle**    | Switch between light/dark mode                                 | `ThemeToggle` component                                  |
| **AL Fuel**         | View balance, purchase top-ups                                 | `useUserCredits()`, checkout flow                        |
| **Referral**        | Copy referral link, earn fuel                                  | `profile.referral_code`                                  |
| **Location**        | ZIP code for local event recommendations                       | `useZipLookup()`, `useSaveLocation()`                    |
| **Plan Management** | View/change subscription tier, manage billing                  | Stripe integration                                       |
| **Notifications**   | Full notification preferences                                  | `NotificationPreferences` component                      |
| **Data Export**     | Download all user data (GDPR)                                  | `/api/user/export-data`                                  |
| **Clear Data**      | Clear garage or AL history                                     | `useClearUserData()`                                     |
| **Delete Account**  | Multi-step deletion with feedback                              | `DeleteAccountModal` component                           |
| **PWA Install**     | Install app to home screen                                     | `usePWAInstall()` hook                                   |

### Username Validation Rules

Username (`public_slug`) is validated both client-side and via database function:

```javascript
// Validation rules (mirrors DB function validate_public_slug)
- Length: 3-30 characters
- Pattern: ^[a-z0-9][a-z0-9_-]*[a-z0-9]$ (lowercase only)
- Must start and end with letter or number
- Reserved words blocked: admin, api, app, auth, autorev, etc.
```

**API:** `GET /api/user/check-username?username=xxx`
**DB Function:** `is_public_slug_available(slug)` - validates format AND checks uniqueness

### Avatar Upload Flow

```javascript
// 1. User clicks avatar → file input opens
// 2. Validate: JPG/PNG/WebP, max 5MB
// 3. Show preview immediately (optimistic)
// 4. Upload to /api/uploads
// 5. Update profile.avatar_url
// 6. Revert preview on error
```

### Data Export (GDPR Right to Access)

The "Export My Data" button triggers a JSON download containing:

- Profile information
- Garage vehicles
- Favorites and saved builds
- AL conversations and messages
- Activity log and engagement history
- Feedback submitted

Sensitive fields (Stripe IDs, IP addresses) are redacted.

---

## Subscription Polish

### Trial Reminders

**Two complementary systems for reliability:**

1. **Webhook-based** (real-time): `customer.subscription.trial_will_end` event triggers `handleTrialEnding()` in webhook handler
2. **Cron-based** (backup): `/api/cron/trial-reminders` runs daily

Both send emails 3 days and 1 day before trial ends. Duplicate prevention via `email_logs` table.

**Trigger:** Vercel Cron with `CRON_SECRET` header (cron), or Stripe webhook (automatic).

### Payment Failed (Dunning)

**Two layers of dunning support:**

1. **Email notification**: `sendPaymentFailedEmail()` triggered by `invoice.payment_failed` webhook
   - Warns user of failed payment
   - Includes "Update Payment Method" CTA linking to customer portal
   - Shows next retry date if available

2. **UI Banner**: `PaymentFailedBanner` component displays when `isPastDue` is true
   - Shows persistent warning banner
   - Links to Stripe Customer Portal
   - Dismissible for 24 hours

### Stripe Customer Portal

```javascript
import { useSubscription } from '@/hooks/useSubscription';

const { openCustomerPortal, isPortalLoading } = useSubscription();

// Opens Stripe billing portal
await openCustomerPortal();
```

---

## Code Quality

### TypeScript Configuration

**Strict Mode Enabled (tsconfig.json):**

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### Linting & Formatting

| Tool       | Config File            | Command            |
| ---------- | ---------------------- | ------------------ |
| ESLint     | `.eslintrc.json`       | `npm run lint`     |
| Prettier   | `.prettierrc`          | `npm run format`   |
| Stylelint  | `.stylelintrc.json`    | `npm run lint:css` |
| Commitlint | `commitlint.config.js` | Pre-commit hook    |

**ESLint Plugins:**

- `@typescript-eslint/recommended` - TypeScript-specific rules
- `import/order` - Consistent import ordering
- `eslint-config-prettier` - Disable formatting rules that conflict with Prettier

### CSS Audit & Maintenance Scripts

| Script               | Command                       | Purpose                                       |
| -------------------- | ----------------------------- | --------------------------------------------- |
| CSS Token Audit      | `npm run audit:css`           | Find hardcoded colors not using CSS variables |
| CSS Audit JSON       | `npm run audit:css:json`      | Export audit results as JSON                  |
| Fix Hardcoded Colors | `npm run fix:colors`          | Auto-fix hardcoded colors to CSS variables    |
| Fix All Colors       | `npm run fix:colors:all`      | Fix all files at once                         |
| Fix Colors (Dry Run) | `npm run fix:colors:dry`      | Preview fixes without changing files          |
| Media Query Audit    | `npm run audit:media-queries` | List all max-width media queries              |

**Script Files:**
| Script | Location | Purpose |
|--------|----------|---------|
| Color Token Map | `scripts/color-token-map.json` | 195 hex-to-variable mappings |
| Fix Hardcoded Colors | `scripts/fix-hardcoded-colors.mjs` | Automated color replacement |
| Audit CSS Tokens | `scripts/audit-css-tokens.mjs` | Find color violations |
| Convert Media Queries | `scripts/convert-media-queries.mjs` | Convert max-width to min-width |
| Audit Media Queries | `scripts/audit-media-queries.mjs` | Find desktop-first patterns |

**Usage:**

```bash
# Find all hardcoded colors
npm run audit:css

# Preview what would be fixed
npm run fix:colors:dry

# Auto-fix all hardcoded colors
npm run fix:colors:all

# Find max-width media queries
npm run audit:media-queries

# Convert media queries in a file (manual review required)
node scripts/convert-media-queries.mjs components/Example.module.css
```

**CSS Variable Rule:** Always use CSS variables from the design system instead of hardcoded hex values:

```css
/* ✅ CORRECT */
color: var(--color-text-primary);
background: var(--color-bg-secondary);

/* ❌ WRONG */
color: #ffffff;
background: #1a1a1a;
```

**Mobile-First CSS Rule:** Write base styles for mobile, add complexity at larger breakpoints:

```css
/* ✅ CORRECT: Mobile-first (min-width) */
.container {
  padding: 16px; /* Mobile default */
}
@media (min-width: 768px) {
  .container {
    padding: 32px; /* Tablet and up */
  }
}

/* ❌ WRONG: Desktop-first (max-width) */
.container {
  padding: 32px; /* Desktop default */
}
@media (max-width: 767px) {
  .container {
    padding: 16px; /* Override for mobile */
  }
}
```

**Exception:** Range queries combining min AND max-width are valid for targeting specific device sizes:

```css
/* ✅ Valid: Tablet-only range query */
@media (min-width: 768px) and (max-width: 1023px) {
  .sidebar {
    width: 200px;
  }
}
```

### Commit Message Format

```
<type>(<scope>): <subject>

Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
Scopes: al, auth, garage, ui, api, db, analytics, stripe, etc.

Examples:
feat(al): add intent classification for queries
fix(auth): resolve session expiry redirect
docs: update DESIGN_SYSTEM.md with spacing tokens
```

### Pre-commit Hooks (lint-staged)

```json
{
  "*.{js,jsx,ts,tsx}": ["prettier --write", "eslint --fix --max-warnings=0"],
  "*.css": ["prettier --write", "stylelint --fix"],
  "*.{json,md}": ["prettier --write"]
}
```

---

## Security

### Security Headers

Security headers are configured in two places:

| Location         | Headers                                                                                              | Purpose                                        |
| ---------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `next.config.js` | X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy, HSTS | Core security headers on all responses         |
| `middleware.js`  | Content-Security-Policy                                                                              | CSP in **enforcing mode** (violations blocked) |

**CSP Trusted Domains:**

- Scripts: `js.stripe.com`, `va.vercel-scripts.com`, `googletagmanager.com`, `posthog.com`
- Connect: `supabase.co`, `api.stripe.com`, `api.anthropic.com`, `api.openai.com`, `posthog.com`, `sentry.io`
- Frames: `js.stripe.com`, `youtube.com`

### Admin Authentication

Admin routes use the standardized `requireAdmin` helper from `lib/adminAccess.js`:

```javascript
import { requireAdmin } from '@/lib/adminAccess';
import { withErrorLogging } from '@/lib/serverErrorLogger';

async function handleGet(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  // Admin-only logic here...
}

export const GET = withErrorLogging(handleGet, { route: 'admin/my-route', feature: 'admin' });
```

**Admin verification flow:**

1. Extract Bearer token from `Authorization` header
2. Verify token with Supabase `auth.getUser()`
3. Check email against `isAdminEmail()` whitelist
4. Return 401 (missing token) or 403 (not admin) if denied

**DO NOT:**

- Create local `verifyAdmin` or `isAdmin` functions
- Inline admin email checks in route handlers
- Skip `withErrorLogging` wrapper on admin routes

### Rate Limiting

Rate limiting is implemented in `lib/rateLimit.js` with both in-memory and distributed options:

**Presets:**
| Preset | Window | Max Requests | Use Case |
|--------|--------|--------------|----------|
| `ai` | 1 min | 10 | AI routes (expensive) |
| `auth` | 15 min | 10 | Authentication (brute force protection) |
| `form` | 1 min | 5 | Form submissions (spam prevention) |
| `checkout` | 1 min | 5 | Payment routes (abuse prevention) |
| `api` | 1 min | 60 | General API routes |
| `strict` | 1 min | 3 | Sensitive operations |

**Applied to:**

- `/api/ai-mechanic` → `ai` preset
- `/api/checkout` → `checkout` preset
- `/api/feedback` → `form` preset
- `/api/contact` → `form` preset
- `/api/events/submit` → `form` preset
- `/api/users/[userId]/vehicles/*` → `api` preset (PATCH, DELETE)
- `/api/users/[userId]/track-times` → `api` preset (POST, DELETE)
- `/api/dyno-results` → `api` preset (POST, PUT, DELETE)
- `/api/admin/advanced-analytics` → `api` preset
- `/api/admin/retention` → `api` preset

**Distributed Rate Limiting (for exact limits):**

```javascript
import { rateLimitDistributed, distributedRateLimit } from '@/lib/rateLimit';

// Middleware pattern
const limited = await rateLimitDistributed(request, {
  distributed: true,
  preset: 'ai',
});
if (limited) return limited;

// Direct usage
const result = await distributedRateLimit('user:123:/api/ai', {
  limit: 10,
  windowSeconds: 60,
});
```

### Input Validation

All API routes with POST/PUT/PATCH should use Zod schemas from `lib/schemas/index.js`:

```javascript
import { feedbackSchema, validateWithSchema, validationErrorResponse } from '@/lib/schemas';

export async function POST(request) {
  const body = await request.json();
  const validation = validateWithSchema(feedbackSchema, body);
  if (!validation.success) {
    return validationErrorResponse(validation.errors);
  }
  // Use validation.data (sanitized and typed)
}
```

**Available Schemas:**
| Schema | Purpose | Key Fields |
|--------|---------|------------|
| `feedbackSchema` | User feedback form | `message`, `category`, `feedback_type` |
| `contactSchema` | Contact form | `name`, `email`, `message` |
| `eventSubmitSchema` | Event submission | `name`, `start_date`, `venue_name` |
| `userPreferencesSchema` | User settings | `theme`, `units`, `al_preferences` |
| `vehicleSchema` | Vehicle data | `year`, `make`, `model`, `trim` |
| `communityPostSchema` | Community posts | `postType`, `title`, `description`, `imageIds` |
| `dynoResultSchema` | Dyno results | `userVehicleId`, `whp`, `wtq`, `dynoDate` |
| `trackTimeSchema` | Track times | `trackName`, `lapTimeSeconds`, `conditions` |
| `alFeedbackSchema` | AL feedback | `messageId`, `feedbackType`, `feedbackReason` |

### Webhook Security

All webhooks MUST verify signatures before processing. Never parse the request body before verification.

**Pattern:**

```javascript
export async function POST(request) {
  // 1. Get RAW body (required for signature verification)
  const rawBody = await request.text();
  const signature = request.headers.get('x-signature-header');

  // 2. Verify FIRST, before any JSON parsing
  if (!verifySignature(rawBody, signature, SECRET)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // 3. Parse AFTER verification
  const payload = JSON.parse(rawBody);

  // 4. Process event...
}
```

**Webhook Handlers:**
| Handler | Signature Header | Verification |
|---------|-----------------|--------------|
| `app/api/webhooks/stripe/route.js` | `stripe-signature` | `stripe.webhooks.constructEvent()` + idempotency |
| `app/api/webhooks/vercel/route.js` | `x-vercel-signature` | HMAC-SHA1 with `VERCEL_WEBHOOK_SECRET` |
| `app/api/webhooks/resend/route.js` | `svix-signature` | HMAC-SHA256 with `RESEND_WEBHOOK_SECRET` |

**Critical Rules:**

- ❌ NEVER parse JSON before verifying signature
- ❌ NEVER skip verification if secret is not configured (fail closed)
- ✅ Use `request.text()` first, then verify, then `JSON.parse()`
- ✅ Log failed verification attempts for security monitoring

### Cron Job Authentication

All cron routes must validate authorization using either:

1. Vercel's automatic `x-vercel-cron` header (for Vercel Cron)
2. `Authorization: Bearer ${CRON_SECRET}` header (for manual/external calls)

**Standard Pattern:**

```javascript
const CRON_SECRET = process.env.CRON_SECRET;

function isAuthorized(request) {
  const authHeader = request.headers.get('authorization');
  const vercelCron = request.headers.get('x-vercel-cron');

  // Accept Vercel's automatic cron header
  if (vercelCron === 'true') return true;

  // Accept Bearer token with CRON_SECRET
  if (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`) return true;

  return false;
}

async function handleGet(request) {
  if (!isAuthorized(request)) {
    console.error(
      '[CronName] Unauthorized. CRON_SECRET set:',
      Boolean(CRON_SECRET),
      'x-vercel-cron:',
      request.headers.get('x-vercel-cron')
    );
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Process cron job...
}
```

**Critical Rules:**

- ❌ NEVER allow requests through if `CRON_SECRET` is not configured
- ❌ NEVER create local verification functions that bypass the standard pattern
- ✅ Always support both `x-vercel-cron` AND `CRON_SECRET` for flexibility
- ✅ Log unauthorized attempts with context for debugging

### Observability & Monitoring

#### Vercel Speed Insights

Real User Monitoring (RUM) for Core Web Vitals:

```jsx
// app/layout.jsx
import { SpeedInsights } from '@vercel/speed-insights/next';

<SpeedInsights sampleRate={0.5} />; // 50% of sessions
```

**Metrics tracked:** LCP, INP, CLS, FCP, TTFB

#### Error Tracking (Sentry)

Production error monitoring is configured via Sentry:

| File                      | Purpose                                    |
| ------------------------- | ------------------------------------------ |
| `sentry.client.config.js` | Client-side error tracking, session replay |
| `sentry.server.config.js` | Server-side error tracking, profiling      |
| `sentry.edge.config.js`   | Edge runtime (middleware) error tracking   |
| `instrumentation.js`      | Next.js App Router instrumentation         |
| `app/global-error.jsx`    | Root-level error boundary                  |
| `app/error.jsx`           | Route-level error boundary                 |

**Required Environment Variables:**

```bash
# Public (client-side)
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# Server-side only
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ORG=your-org
SENTRY_PROJECT=autorev
SENTRY_AUTH_TOKEN=sntrys_xxx  # For source map uploads
```

**Features:**

- 10% transaction sampling in production (100% in dev)
- 10% session replay sampling, 100% on errors
- Filtered errors (ResizeObserver, AbortError, network errors)
- Automatic source map uploading
- Tunnel route at `/monitoring` to bypass ad blockers
- Auto-instrumentation for App Router
- Error fingerprinting for better grouping (database, API, auth, chunk errors)

**Error Fingerprinting:**

```javascript
// Similar errors are grouped together:
// - Database errors → ['database-error', '{{ default }}']
// - API errors → ['api-error', apiPath, '{{ default }}']
// - Auth errors → ['auth-error', '{{ default }}']
// - Chunk load errors → ['chunk-load-error']
```

**ErrorBoundary Integration:**
All errors caught by `ErrorBoundary` components are automatically reported to Sentry with component context.

#### Service Level Objectives (SLOs)

Documented in `docs/SLO.md`:

| Target           | Value      | Description                        |
| ---------------- | ---------- | ---------------------------------- |
| Availability     | 99.5%      | ~3.6 hours/month downtime allowed  |
| p50 Page Load    | < 1.5s     | Median user experience             |
| p95 API Response | < 500ms    | 95th percentile for GET requests   |
| Error Budget     | 0.5%/month | Budget for deployments + incidents |

**Web Vitals Targets:**

- LCP < 2.5s (p75)
- INP < 200ms (p75)
- CLS < 0.1 (p75)

---

## Notification System

**Service Files:** `lib/notificationService.js`, `lib/notificationTriggers.js`, `lib/notificationFatigueService.js`
**Database Tables:** `notifications`, `notification_preferences`, `notification_category_preferences`, `quiet_hours`, `notification_interactions`

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Notification Flow                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Event Triggers          Service Layer           Delivery            │
│  ─────────────          ─────────────           ────────            │
│  • User actions    →    notificationTriggers.js                      │
│  • Cron jobs       →           │                                     │
│  • Webhooks        →           ↓                                     │
│                         notificationService.js                       │
│                               │                                      │
│                    ┌──────────┼──────────┐                          │
│                    ↓          ↓          ↓                          │
│              Check prefs  Quiet hours  Fatigue                      │
│                    │          │          │                          │
│                    └──────────┼──────────┘                          │
│                               ↓                                      │
│                    create_notification() RPC                         │
│                               │                                      │
│                    ┌──────────┴──────────┐                          │
│                    ↓                     ↓                          │
│              In-App (Realtime)    Email (Future)                    │
│                    │                                                 │
│                    ↓                                                 │
│              NotificationCenter component                            │
│              (Supabase Realtime subscription)                        │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Functions

**Creating Notifications:**

```javascript
import { createNotification, NOTIFICATION_CATEGORIES } from '@/lib/notificationService';

// Create via RPC (respects preferences, quiet hours)
await createNotification({
  userId,
  category: NOTIFICATION_CATEGORIES.ENGAGEMENT,
  title: 'Streak milestone!',
  body: 'You've hit a 7-day streak!',
  actionUrl: '/dashboard',
  metadata: { milestone: 7 },
  isUrgent: false,
});
```

**Using Triggers (Recommended):**

```javascript
import {
  triggerFirstCarNotification,
  triggerRecallNotification,
  triggerCommentNotification,
  triggerStreakMilestoneNotification,
} from '@/lib/notificationTriggers';

// When user adds first car
await triggerFirstCarNotification(userId);

// When recall affects user's vehicle
await triggerRecallNotification(userId, vehicleInfo, recallInfo);
```

### Fatigue Detection

The fatigue service prevents notification overload:

```javascript
import { detectFatigue, shouldSendNotification } from '@/lib/notificationFatigueService';

// Check if user is fatigued
const { data } = await detectFatigue(userId);
if (data.isFatigued) {
  console.log(data.severity); // 'mild' | 'moderate' | 'severe'
  console.log(data.reasons); // ['high_dismiss_rate', 'low_click_rate']
}

// Automatic check before sending
const { shouldSend, reason } = await shouldSendNotification(userId, category);
```

**Fatigue Thresholds:**

- Dismiss rate > 80% triggers fatigue
- Click rate < 5% triggers fatigue
- Recent category opt-out triggers fatigue

### Preferences & Quiet Hours

Users can configure notifications at multiple levels:

1. **Global toggle** - Master on/off for all notifications
2. **Channel toggle** - In-app vs email
3. **Category preferences** - Per-category enable/frequency
4. **Quiet hours** - Time-based suppression

```javascript
// Fetch user preferences
const prefs = await getPreferences(userId);
// { global: {...}, categories: {...}, quietHours: {...} }

// Update preferences
await updatePreferences(userId, {
  global: { emailEnabled: false },
  categories: { engagement: { inAppEnabled: true, frequency: 'daily_digest' } },
  quietHours: { enabled: true, startTime: '22:00', endTime: '07:00' },
});
```

### UI Components

| Component                 | Purpose                            | Location                                 |
| ------------------------- | ---------------------------------- | ---------------------------------------- |
| `NotificationCenter`      | Bell icon in header, dropdown list | `components/NotificationCenter.jsx`      |
| `NotificationPreferences` | Settings page section              | `components/NotificationPreferences.jsx` |

**NotificationCenter Features:**

- Bell icon with unread badge
- Real-time updates via Supabase Realtime
- Date grouping (Today, Yesterday, This Week)
- Category icons and action links
- Mark as read on click
- Mark all as read button

### Admin Dashboard

The `NotificationHealthPanel` component shows:

- Total notifications sent
- Click rate vs threshold
- Dismiss rate vs threshold
- Users showing fatigue symptoms
- Recommendations for improvement

---

## Gamification Systems

AutoRev has **two separate scoring systems** for different purposes. Do not confuse them:

### 1. Points System (Leaderboard)

**Service File:** `lib/pointsService.js`
**Database Tables:** `user_points_history` (individual point awards), `user_profiles.total_points` (aggregate)
**API Endpoint:** `/api/community/leaderboard`

The Points System powers the community leaderboard. Users earn points for specific actions:

| Action                 | Points |
| ---------------------- | ------ |
| Share a build          | 25     |
| Like a post            | 2      |
| Comment on a post      | 5      |
| RSVP to event          | 3      |
| Daily login bonus      | 5      |
| Streak bonus (7+ days) | 10-50  |

**Leaderboard Query:**

- Monthly: Aggregates from `user_points_history` WHERE `created_at >= month_start`
- All-time: Uses pre-aggregated `user_profiles.total_points`

```javascript
// ✅ CORRECT - Use pointsService for leaderboard points
import { awardPoints, getUserPoints, getMonthlyPoints } from '@/lib/pointsService';
await awardPoints(userId, 'community_share_build', { build_id });

// ❌ WRONG - engagementService is NOT for leaderboard points
import { trackEngagementActivity } from '@/lib/engagementService'; // For internal metrics only!
```

### 2. Engagement Score System (Internal Metrics)

**Service File:** `lib/engagementService.js`
**Database Table:** `user_engagement_scores`
**Purpose:** Internal retention tracking, re-engagement alerts, admin dashboards

The Engagement Score System tracks user activity depth for internal analytics. It is **NOT** displayed on the leaderboard.

| Column                   | Purpose                                   |
| ------------------------ | ----------------------------------------- |
| `score`                  | Calculated engagement score (0-100 scale) |
| `current_streak`         | Consecutive days active                   |
| `garage_cars_count`      | Number of vehicles owned                  |
| `ai_conversations_count` | AL interactions                           |
| `events_saved_count`     | Events saved/RSVPd                        |

**Cron Job:** `/api/cron/calculate-engagement` recalculates scores daily.

---

## Engagement & Streaks

**Service File:** `lib/engagementService.js`
**Database Table:** `user_engagement_scores`

### Streak System (Duolingo-style)

Users build streaks by engaging with the app daily. Streaks reset if the user misses a day (unless frozen).

**Streak Milestones:**

```javascript
export const STREAK_MILESTONES = [7, 14, 30, 50, 100, 365];
```

### Key Functions

```javascript
import {
  getStreakStatus,
  getStreakDisplayInfo,
  getStreakReminderCopy,
  STREAK_MILESTONES,
} from '@/lib/engagementService';

// Get user's streak status (calls Supabase RPC)
const { data } = await getStreakStatus(userId);
// { current_streak, longest_streak, is_at_risk, hours_remaining, is_frozen }

// Get display info for UI
const display = getStreakDisplayInfo(data.current_streak);
// { emoji: '🔥', color: '#f59e0b', message: 'You're on fire!' }

// Get reminder copy for notifications
const copy = getStreakReminderCopy(data.current_streak, data.hours_remaining);
// { title: 'Keep your streak alive!', body: '...', urgency: 'high' }
```

### UI Components

| Component              | Purpose                  | Location                              |
| ---------------------- | ------------------------ | ------------------------------------- |
| `StreakIndicator`      | Flame icon with count    | `components/StreakIndicator.jsx`      |
| `StreakMilestoneModal` | Celebration on milestone | `components/StreakMilestoneModal.jsx` |

**StreakIndicator Features:**

- Flame emoji with current streak count
- "At risk" banner when streak may expire
- Tooltip with longest streak, next milestone
- Compact mode for header/sidebar

### Cron Jobs

**Streak Reminders** (`/api/cron/streak-reminders`)

- Runs daily at 6 PM
- Finds users with at-risk streaks (>3 days, not yet active today)
- Sends personalized notifications
- Extra motivation for users near milestones

### Database Functions (RPC)

| Function                                     | Purpose                       |
| -------------------------------------------- | ----------------------------- |
| `update_user_streak(user_id)`                | Update streak on activity     |
| `get_streak_status(user_id)`                 | Get current streak info       |
| `get_users_with_at_risk_streaks(min_streak)` | Find users for reminders      |
| `apply_streak_freeze(user_id, days)`         | Apply streak freeze (premium) |

### Dashboard Category Colors

The dashboard uses 5 engagement categories, each with a distinct color from the extended color tokens:

| Category  | CSS Variable            | Hex       | Usage                      |
| --------- | ----------------------- | --------- | -------------------------- |
| AL        | `--color-accent-purple` | `#a855f7` | AI assistant conversations |
| Community | `--color-accent-blue`   | `#3b82f6` | Posts, comments, likes     |
| Data      | `--color-accent-teal`   | `#10b981` | Dyno runs, track times     |
| Garage    | `--color-accent-lime`   | `#d4ff00` | Vehicles, mods, photos     |
| Profile   | `--color-accent-pink`   | `#ec4899` | Profile completion         |

**Dashboard Components:**
| Component | File | Purpose |
|-----------|------|---------|
| `WeeklyEngagement` | `dashboard/components/WeeklyEngagement.jsx` | Bar charts by category |
| `LifetimeAchievements` | `dashboard/components/LifetimeAchievements.jsx` | Achievement badges |
| `ConcentricRings` | `dashboard/components/ConcentricRings.jsx` | Apple-style activity rings |
| `ImprovementActions` | `dashboard/components/ImprovementActions.jsx` | How to earn points |

### Callsign Color System

Callsigns (user titles) derive their color dynamically from tier and category:

```javascript
import { getCallsignColor } from '@/app/(app)/dashboard/components/UserGreeting';

// Colors are computed from tier (0-4) and category (garage, community, al, legendary)
const color = getCallsignColor(callsign.tier, callsign.category);
```

**Tier-based color progression:**
| Tier | Color Strategy |
|------|---------------|
| 0 (Starter) | `--color-text-secondary` (muted gray) |
| 1-3 | Category-based (teal/blue/purple/amber) |
| 4 (Legendary) | `--color-accent-lime` (always lime) |

---

## Email System

**Service File:** `lib/emailService.js`
**Provider:** Resend

### Available Functions

| Function                   | Purpose                  | Parameters                                                       |
| -------------------------- | ------------------------ | ---------------------------------------------------------------- |
| `sendEmail()`              | Send transactional email | `{ to, subject, html, text, from? }`                             |
| `sendWelcomeEmail()`       | New user welcome         | `{ to, name }`                                                   |
| `sendPasswordResetEmail()` | Password reset           | `{ to, resetUrl }`                                               |
| `sendFeedbackReceipt()`    | Feedback confirmation    | `{ to, feedbackType }`                                           |
| `sendTrialEndingEmail()`   | Trial expiration warning | `{ userId, email, userName, daysRemaining, trialEndDate, tier }` |
| `sendPaymentFailedEmail()` | Dunning/payment failed   | `{ userId, email, userName, amountCents, tier, nextRetryDate? }` |

### Email Templates

Templates are defined in `lib/emailService.js` as HTML functions:

- Welcome email (new signups)
- Password reset
- Feedback receipt
- Admin notifications
- Trial ending reminder (3 days, 1 day warnings)
- Payment failed / dunning (with retry date)
- Inactivity emails (7-day, 21-day)
- Referral reward / invite emails

### Unsubscribe System

**Files:**

- `lib/unsubscribeToken.js` - Token generation/verification
- `app/api/email/unsubscribe/route.js` - Unsubscribe API
- `app/(marketing)/unsubscribe/page.jsx` - Unsubscribe page

**Security:** Token-based (HMAC SHA256 signed), not email-based. Tokens expire after 30 days.

| Function                          | Purpose                 | File                      |
| --------------------------------- | ----------------------- | ------------------------- |
| `generateUnsubscribeToken(email)` | Create secure token     | `lib/unsubscribeToken.js` |
| `verifyUnsubscribeToken(token)`   | Validate & decode token | `lib/unsubscribeToken.js` |

**API Endpoint:** `POST /api/email/unsubscribe`

| Parameter | Type   | Description                                                   |
| --------- | ------ | ------------------------------------------------------------- |
| `token`   | string | Required. Secure unsubscribe token                            |
| `type`    | string | `'all'` \| `'features'` \| `'events'` (default: `'all'`)      |
| `action`  | string | `'unsubscribe'` \| `'resubscribe'` (default: `'unsubscribe'`) |

**Unsubscribe Link Format:**

```
/unsubscribe?token=<base64url_encoded_token>
```

**NEVER use raw email in unsubscribe links:**

```javascript
// ❌ WRONG - Insecure, anyone can unsubscribe anyone
`/unsubscribe?email=${email}`;

// ✅ CORRECT - Cryptographically signed token
import { generateUnsubscribeToken } from '@/lib/unsubscribeToken';
`/unsubscribe?token=${generateUnsubscribeToken(email)}`;
```

**Design System Colors (Unsubscribe Page):**

- Success states: Teal (`--color-accent-teal`)
- Error states: Amber (`--color-accent-amber`)
- Buttons: Lime (`--color-accent-lime`)

### Required Environment Variables

```bash
RESEND_API_KEY=re_xxx
EMAIL_FROM=noreply@autorev.app  # Optional, defaults to noreply@autorev.app
UNSUBSCRIBE_TOKEN_SECRET=xxx    # Optional, falls back to SUPABASE_SERVICE_ROLE_KEY
```

### Usage

```javascript
import { sendEmail, sendWelcomeEmail } from '@/lib/emailService';

// Direct send
await sendEmail({
  to: 'user@example.com',
  subject: 'Your Subject',
  html: '<p>Email content</p>',
});

// Template send
await sendWelcomeEmail({
  to: 'user@example.com',
  name: 'John',
});
```

---

## Billing System

**Service Files:** `lib/stripe.js`, `lib/subscriptionService.js`, `lib/subscriptionMetrics.js`
**Provider:** Stripe

### Stripe Integration

| File                                         | Purpose                                    |
| -------------------------------------------- | ------------------------------------------ |
| `lib/stripe.js`                              | Stripe config, price IDs, helper functions |
| `lib/subscriptionService.js`                 | Centralized subscription data access       |
| `lib/subscriptionMetrics.js`                 | MRR, churn, LTV calculations               |
| `lib/fraudPrevention.js`                     | Trial abuse prevention                     |
| `app/api/webhooks/stripe/route.js`           | Webhook handler (idempotent, dual-write)   |
| `app/api/checkout/route.js`                  | Checkout session creation                  |
| `app/api/stripe/customer-portal/route.js`    | Customer portal redirect                   |
| `app/api/cron/subscription-metrics/route.js` | Daily metrics snapshot                     |

### Subscription Database Schema

The subscription system uses a **normalized schema** with dual-write to `user_profiles` for backward compatibility.

| Table                  | Purpose                   | Key Columns                                               |
| ---------------------- | ------------------------- | --------------------------------------------------------- |
| `customers`            | Links users to Stripe     | `id (FK auth.users)`, `stripe_customer_id`                |
| `subscriptions`        | Active subscription state | `id (sub_xxx)`, `user_id`, `status`, `price_id`           |
| `products`             | Stripe products sync      | `id (prod_xxx)`, `name`, `active`                         |
| `prices`               | Stripe prices sync        | `id (price_xxx)`, `product_id`, `unit_amount`, `interval` |
| `plans`                | Internal plan mapping     | `id (free/collector/tuner)`, `product_id`                 |
| `features`             | Gatable features          | `id (featureKey)`, `name`, `feature_type`                 |
| `plan_entitlements`    | Feature access per plan   | `plan_id`, `feature_id`, `value`, `limit_value`           |
| `trial_history`        | Trial abuse prevention    | `user_id`, `product_id`, `device_fingerprint`             |
| `subscription_metrics` | Daily metric snapshots    | `date`, `mrr_cents`, `churn_rate`                         |

### Subscription Tiers & Pricing

| Tier ID     | Display Name   | Monthly   | Annual  | Features                                                |
| ----------- | -------------- | --------- | ------- | ------------------------------------------------------- |
| `free`      | Free           | $0        | -       | Basic access, ~25 AL conversations                      |
| `collector` | **Enthusiast** | $9.99/mo  | $79/yr  | 3 cars, ~130 AL conversations, Insights & Data          |
| `tuner`     | **Pro**        | $19.99/mo | $149/yr | Unlimited cars, ~350 AL conversations, Priority support |

### Subscription Hooks & Components

| Hook/Component           | Purpose                        | Source                                  |
| ------------------------ | ------------------------------ | --------------------------------------- |
| `useSubscription()`      | Client-side subscription state | `hooks/useSubscription.js`              |
| `usePaywall()`           | Paywall modal management       | `hooks/usePaywall.js`                   |
| `BillingToggle`          | Monthly/Annual selector        | `components/BillingToggle.jsx`          |
| `PaywallModal`           | Feature gate modal             | `components/PaywallModal.jsx`           |
| `SubscriptionDisclosure` | App Store compliant terms      | `components/SubscriptionDisclosure.jsx` |

### Webhook Events Handled

- `checkout.session.completed` - New purchase
- `customer.subscription.created` - New subscription
- `customer.subscription.updated` - Upgrade/downgrade
- `customer.subscription.deleted` - Cancellation
- `invoice.paid` - Renewal
- `invoice.payment_failed` - Dunning email trigger
- `customer.subscription.trial_will_end` - Trial ending notification

### Required Environment Variables

```bash
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_COLLECTOR_PRICE_ID=price_xxx
STRIPE_TUNER_PRICE_ID=price_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_xxx
STRIPE_TRIAL_DAYS=7  # Optional, defaults to 7
```

### Webhook Handling

Webhooks are idempotent via `processed_webhook_events` table:

```javascript
// In webhook handler
const eventId = event.id;
const exists = await checkProcessedEvent(eventId);
if (exists) return; // Skip duplicate

// Process event...
await markEventProcessed(eventId, event.type);
```

**Handled Webhook Events:**
| Event | Handler | Action |
|-------|---------|--------|
| `checkout.session.completed` | `handleCheckoutComplete()` | Process new subscriptions, credits, donations |
| `customer.subscription.created` | `handleSubscriptionChange()` | Create subscription record |
| `customer.subscription.updated` | `handleSubscriptionChange()` | Update tier, status, cancel_at_period_end |
| `customer.subscription.deleted` | `handleSubscriptionCanceled()` | Downgrade to free tier |
| `customer.subscription.trial_will_end` | `handleTrialEnding()` | Send trial ending email |
| `invoice.paid` | `handleInvoicePaid()` | Log successful payment |
| `invoice.payment_failed` | `handlePaymentFailed()` | Send dunning email |

### Subscription Upgrades with Proration

The checkout route (`/api/checkout`) handles both new subscriptions and upgrades:

```javascript
// New subscribers: Create checkout session with trial
// Existing subscribers: Update subscription with proration

if (hasActiveSubscription) {
  // Use stripe.subscriptions.update() with proration_behavior: 'create_prorations'
  // Credit/debit applied to next invoice
} else {
  // Create new checkout session with trial_period_days
}
```

### Client-Side Usage

```javascript
import { useSubscription } from '@/hooks/useSubscription';

function Component() {
  const { tier, hasFeature, openCustomerPortal } = useSubscription();

  if (!hasFeature('al_chat')) {
    return <UpgradePrompt />;
  }
}
```

---

## Migration Status

| Domain                    | Status      | Notes                                                                            |
| ------------------------- | ----------- | -------------------------------------------------------------------------------- |
| Performance Calculator    | 🟢 Complete | `lib/performanceCalculator/` is source of truth                                  |
| Car ID Resolution         | 🟢 Complete | `lib/carResolver.js` is source of truth                                          |
| Scoring                   | 🟢 Complete | `lib/scoring.js` exports weights correctly                                       |
| Marketing Stats           | 🟢 Complete | `lib/marketingStats.js` - centralized counts                                     |
| Filter Utilities          | 🟢 Complete | `lib/filterUtils.js` - car filtering/sorting                                     |
| Supabase Clients          | 🟢 Complete | Documented in `docs/SUPABASE_CLIENT_USAGE.md`                                    |
| Discord                   | 🟢 Complete | `lib/discord.js` only; `discordAlerts.js` deprecated                             |
| Provider/Store Overlap    | 🟢 Complete | `carSelectionStore` provides logic for provider                                  |
| Cache Configuration       | 🟢 Complete | Aligned at 5min base across modules                                              |
| Naming Conventions        | 🟢 Complete | Documented in `docs/NAMING_CONVENTIONS.md`                                       |
| Date Utilities            | 🟢 Complete | `lib/dateUtils.js` - centralized formatting                                      |
| Error Logging             | 🟢 Complete | Documented - already well-structured                                             |
| Security Headers          | 🟢 Complete | `next.config.js` security headers, CSP in middleware                             |
| Rate Limiting             | 🟢 Complete | `lib/rateLimit.js` applied to sensitive routes                                   |
| Input Validation          | 🟢 Complete | `lib/schemas/index.js` Zod schemas                                               |
| Accessibility             | 🟢 Complete | SkipLink component, useReducedMotion hook                                        |
| Code Quality              | 🟢 Complete | Prettier, Husky, lint-staged, Commitlint, Stylelint                              |
| Error Tracking            | 🟢 Complete | Sentry with fingerprinting, tunnel route, auto-instrumentation                   |
| Email System              | 🟢 Complete | `lib/emailService.js` with Resend integration                                    |
| Billing System            | 🟢 Complete | Stripe integration with webhook idempotency                                      |
| Product Analytics         | 🟢 Complete | PostHog with session replay, GDPR opt-out by default                             |
| Feature Flags             | 🟢 Complete | `hooks/useFeatureFlag.js`, `components/ABTest.jsx`                               |
| Analytics Abstraction     | 🟢 Complete | `lib/analytics/manager.js` with provider adapters                                |
| Offline Analytics         | 🟢 Complete | `lib/analytics/offlineQueue.js` for PWA support                                  |
| GDPR Data Rights          | 🟢 Complete | `/api/user/delete-data`, `/api/user/export-data`, data export button in Settings |
| Speed Insights            | 🟢 Complete | Vercel Speed Insights (50% sample rate)                                          |
| Web Vitals API            | 🟢 Complete | `/api/admin/web-vitals/collect` for CWV storage                                  |
| SLO Documentation         | 🟢 Complete | `docs/SLO.md` with targets and error budgets                                     |
| Event Versioning          | 🟢 Complete | `SCHEMA_VERSION` in all tracked events                                           |
| Performance Budgets       | 🟢 Complete | Webpack 250KB/asset warning thresholds                                           |
| Environment Validation    | 🟢 Complete | `lib/env.js` with Zod schemas                                                    |
| Dark Mode                 | 🟢 Complete | `next-themes` with ThemeProvider                                                 |
| Trial Management          | 🟢 Complete | Dual delivery: webhook (real-time) + cron (backup)                               |
| Dunning Management        | 🟢 Complete | Email + PaymentFailedBanner; proration on upgrades                               |
| AL Reranking              | 🟢 Complete | Cohere + RRF hybrid search                                                       |
| AL Intent Classification  | 🟢 Complete | `lib/alIntentClassifier.js`                                                      |
| AL Evaluation             | 🟢 Complete | Golden dataset + LLM-judge pipeline in `lib/alEvaluationService.js`              |
| AL Circuit Breaker        | 🟢 Complete | `lib/aiCircuitBreaker.js` - 5 failures → 60s open                                |
| AL Prompt Caching         | 🟢 Complete | Anthropic `cache_control: ephemeral` in route                                    |
| AL Model Tiering          | 🟢 Complete | `MODEL_TIERS` + `selectModelForQuery()` in `lib/alConfig.js`                     |
| AL Feedback System        | 🟢 Complete | `lib/alFeedbackService.js` + `ALFeedbackButtons.jsx`                             |
| Knowledge Confidence      | 🟢 Complete | `document_chunks.confidence_level` (0-1 scale)                                   |
| Safety Testing            | 🟢 Complete | `tests/safety/al-safety.test.js` - red-team tests                                |
| E2E Testing               | 🟢 Complete | Playwright tests for auth, subscription, AL                                      |
| Unit Testing              | 🟢 Complete | Vitest + React Testing Library                                                   |
| Design System             | 🟢 Complete | `docs/DESIGN_SYSTEM.md`                                                          |
| Loading States            | 🟢 Complete | Skeleton components with shimmer                                                 |
| Empty States              | 🟢 Complete | EmptyState component                                                             |
| TypeScript Strict Mode    | 🟢 Complete | `tsconfig.json` with strict flags enabled                                        |
| ESLint Enhancement        | 🟢 Complete | TypeScript + import order rules                                                  |
| CSP Enforcement           | 🟢 Complete | Content-Security-Policy in enforcing mode                                        |
| Distributed Rate Limiting | 🟢 Complete | `lib/rateLimit.js` with Supabase support                                         |
| Query Key Factory         | 🟢 Complete | `lib/queryKeys.js` for TanStack Query                                            |
| Dynamic Imports           | 🟢 Complete | `components/dynamic.js` for code splitting                                       |
| ADR Documentation         | 🟢 Complete | `docs/adr/` with initial decisions                                               |
| Environment Template      | 🟢 Complete | `.env.example` documenting all variables                                         |
| Dead Code Cleanup         | 🟡 Pending  | Several deprecated files identified                                              |

---

## Maintenance

### Updating This Document

When you:

- Create a new service file → Add to Service Files section
- Create a new component → Add to Components section
- Create a new API route → Add to API Routes section
- Add a new table → Add to Database Tables section
- Identify a new source of truth → Add to Feature Modules section
- Add security measures → Add to Security section

### Review Schedule

- Review after major features
- Review during tech debt sprints
- Review when onboarding new developers

---

## Documentation

### Key Documentation Files

| Document                     | Purpose                                                  |
| ---------------------------- | -------------------------------------------------------- |
| `docs/SOURCE_OF_TRUTH.md`    | Canonical codebase reference (this file)                 |
| `docs/DATABASE.md`           | Database schemas and relationships                       |
| `docs/API.md`                | API routes and response shapes                           |
| `docs/BRAND_GUIDELINES.md`   | Colors, typography, brand identity                       |
| `docs/CSS_ARCHITECTURE.md`   | Design tokens, styling patterns                          |
| `docs/DESIGN_SYSTEM.md`      | Comprehensive design reference                           |
| `docs/SLO.md`                | Service Level Objectives, error budgets, latency targets |
| `docs/AL.md`                 | AI assistant features, tool usage                        |
| `docs/TIER_ACCESS_MATRIX.md` | Feature gating by subscription tier                      |
| `docs/TRACKING_PLAN.md`      | Analytics events with properties                         |

### Architecture Decision Records (ADRs)

ADRs document significant architectural decisions for future reference.

**Location:** `docs/adr/`

| ADR | Title                          | Status   |
| --- | ------------------------------ | -------- |
| 000 | Template                       | -        |
| 001 | CSS Modules over Tailwind      | Accepted |
| 002 | Context Providers over Zustand | Accepted |
| 003 | Supabase Auth Patterns         | Accepted |

### Query Key Factory

Centralized query keys for TanStack Query prevent cache inconsistencies.

**Location:** `lib/queryKeys.js`

```javascript
import { carKeys, userKeys, eventKeys, partsKeys } from '@/lib/queryKeys';

// In hooks
const { data } = useQuery({
  queryKey: carKeys.detail(slug),
  queryFn: () => fetchCar(slug),
});

// Invalidation
queryClient.invalidateQueries({ queryKey: carKeys.all });
```

**Available Key Factories:**

| Factory     | Keys                                                                                                                                                                                                                                                                                                                                                                    | Description          |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| `carKeys`   | `all`, `lists()`, `list(filters)`, `details()`, `detail(slug)`, `bySlug(slug)`, `enriched(slug)`, `efficiency(slug)`, `safety(slug)`, `priceByYear(slug)`, `marketValue(slug)`, `expertReviews(slug)`, `expertConsensus(slug)`, `dyno(slug)`, `lapTimes(slug)`, `popularParts(slug)`, `recalls(slug)`, `maintenance(slug)`, `issues(slug)`, `expertReviewedList(limit)` | Car data queries     |
| `userKeys`  | `all`, `current()`, `byId(userId)`, `garage(userId)`, `vehicles(userId)`, `vehicle(userId, vehicleId)`, `savedEvents(userId)`, `preferences(userId)`, `subscription(userId)`, `alCredits(userId)`, `dashboard(userId)`, `trackTimes(userId)`, `onboarding(userId)`                                                                                                      | User data queries    |
| `eventKeys` | `all`, `list(filters)`, `bySlug(slug)`, `featured()`, `types()`, `saved(userId)`                                                                                                                                                                                                                                                                                        | Events queries       |
| `alKeys`    | `all`, `conversations(userId)`, `conversation(userId, id)`, `stats(userId)`, `preferences(userId)`                                                                                                                                                                                                                                                                      | AL assistant queries |
| `partsKeys` | `all`, `search(query, filters)`, `popular(carSlug)`, `relationships(partId)`, `turbos()`, `turbosByCarSlug(carSlug)`                                                                                                                                                                                                                                                    | Parts queries        |
| `adminKeys` | `all`, `dashboard()`, `users(filters)`, `analytics(type, range)`, `systemHealth()`, `feedback(filters)`                                                                                                                                                                                                                                                                 | Admin queries        |

**IMPORTANT:** Always import from `lib/queryKeys.js`, not from hooks. The hooks re-export for backwards compatibility, but the source of truth is `lib/queryKeys.js`.

```javascript
// ✅ CORRECT - Import from centralized source
import { carKeys } from '@/lib/queryKeys';

// ⚠️ AVOID - Re-export (works but not preferred)
import { carKeys } from '@/hooks/useCarData';
```

---

_Last Updated: 2026-01-26_
_Maintainer: Tech Debt Remediation Initiative_
