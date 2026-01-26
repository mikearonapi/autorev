# AutoRev Documentation

> **Last Verified:** January 21, 2026 — Full codebase audit, counts verified against live code
>
> `/docs/` contains **Core Reference** documentation describing how the system works today.
> `/planning/` contains strategies, roadmaps, implementation plans, audits, and reference material.

---

## Quick Links

| I want to... | Read |
|--------------|------|
| Understand the system | [ARCHITECTURE.md](ARCHITECTURE.md) |
| See all pages/routes | [PAGES.md](PAGES.md) (5-tab app structure) |
| Understand the database | [DATABASE.md](DATABASE.md) |
| Work with APIs | [API.md](API.md) |
| Work with AL assistant | [AL.md](AL.md) |
| Understand components | [COMPONENTS.md](COMPONENTS.md) |
| Run operational scripts | [SCRIPTS.md](SCRIPTS.md) |
| Understand static data files | [DATA_FILES.md](DATA_FILES.md) |
| Run database migrations | [MIGRATIONS.md](MIGRATIONS.md) |
| Understand tier/feature gating | [TIER_ACCESS_MATRIX.md](TIER_ACCESS_MATRIX.md) |
| Understand the scoring algorithm | [SCORING_ALGORITHM.md](SCORING_ALGORITHM.md) |
| Run tests | [TESTING.md](TESTING.md) |
| Work with Google Cloud APIs | [GOOGLE_CLOUD_APIS.md](GOOGLE_CLOUD_APIS.md) |
| **Work with Stripe payments** | [STRIPE_INTEGRATION.md](STRIPE_INTEGRATION.md) |
| See current configuration | [ACTIVE_CONFIG.md](ACTIVE_CONFIG.md) |
| Understand file structure | [FILE_STRUCTURE.md](FILE_STRUCTURE.md) |
| See data gaps & priorities | [../planning/audits/DATA_GAPS.md](../planning/audits/DATA_GAPS.md) |
| Understand data pipelines | [../planning/implementations/DATA_PIPELINE.md](../planning/implementations/DATA_PIPELINE.md) |
| See all features | [../planning/reference/FEATURES.md](../planning/reference/FEATURES.md) |
| Non-technical overview | [../planning/reference/OWNER_GUIDE.md](../planning/reference/OWNER_GUIDE.md) |
| Image requirements | [../planning/reference/image-inventory.md](../planning/reference/image-inventory.md) |

---

## Core Documentation (`/docs/`)

These documents describe **how the system works today**.

### System Architecture

| Document | Purpose |
|----------|---------|
| `ARCHITECTURE.md` | Tech stack, data flow, auth, crons, state management |
| `PAGES.md` | Active pages (5-tab structure), archived routes |
| `DATABASE.md` | All 139 tables, schemas, RLS policies, RPCs |
| `API.md` | All 160 API routes, parameters, responses, auth |
| `COMPONENTS.md` | All React components, props, tier requirements |
| `FILE_STRUCTURE.md` | Codebase file organization |

### Features & Integrations

| Document | Purpose |
|----------|---------|
| `AL.md` | AI assistant: 20 tools, prompts, API, credits, image analysis |
| `TIER_ACCESS_MATRIX.md` | Complete feature-by-tier access matrix |
| `SCORING_ALGORITHM.md` | Car Selector recommendation engine |
| `CAR_PIPELINE.md` | How to add new cars (automated + manual) |
| `GOOGLE_CLOUD_APIS.md` | 9 Google APIs, env vars, costs |
| `DISCORD_CHANNEL_REFERENCE.md` | Discord webhook integration |

### Technical Reference

| Document | Purpose |
|----------|---------|
| `CODE_PATTERNS.md` | Coding patterns for API routes, components, services |
| `ERROR_HANDLING.md` | Error handling conventions and patterns |
| `ERROR_TRACKING.md` | Error tracking system, CLI tools, database views |
| `SCRIPTS.md` | 100+ operational scripts reference |
| `DATA_FILES.md` | Static data files in `data/` directory |
| `MIGRATIONS.md` | Database migration history and procedures |
| `TESTING.md` | Test strategy, test files, how to run tests |
| `ACTIVE_CONFIG.md` | Current ESLint, Next.js, env vars, feature flags |

---

## Planning Documentation (`/planning/`)

Organized into categories for strategies, roadmaps, implementations, audits, and reference material.

### Strategies (`/planning/strategies/`)

Long-term plans and approaches.

| Document | Purpose |
|----------|---------|
| `EVENTS_STRATEGY.md` | Comprehensive events feature strategy |
| `EVENT_SOURCING_STRATEGY.md` | Event data sourcing approach |
| `SEO-ORGANIC-TRAFFIC-STRATEGY.md` | SEO and organic traffic strategy |

### Roadmaps (`/planning/roadmaps/`)

Feature roadmaps and enrichment plans.

| Document | Purpose |
|----------|---------|
| `DATABASE-ENRICHMENT-ROADMAP.md` | 4-phase plan to close database gaps |
| `DATA_ENRICHMENT_PLAN.md` | Data enrichment prioritization |
| `events-expansion/` | Events expansion project tracker |

### Implementation Plans (`/planning/implementations/`)

Specific feature build plans.

| Document | Purpose |
|----------|---------|
| `DATA_PIPELINE.md` | Data ingestion/enrichment strategy |
| `DATA-ACQUISITION-STRATEGIES.md` | Bot-protection-aware scraping strategies |
| `CONTACT_PAGE_UPDATE.md` | Contact page redesign implementation |
| `DAILY_DOSE_COMPARISON.md` | Daily Digest enhancement comparison |
| `FORUM_INTELLIGENCE_PLAN.md` | Forum scraping implementation plan |
| `VEHICLE_MODIFICATIONS_IMPLEMENTATION.md` | Vehicle modifications feature plan |
| `PRE_LAUNCH_CHECKLIST.md` | Pre-launch system verification checklist |
| `BUILD_PIVOT_PRELAUNCH_CHECKLIST.md` | Build pivot pre-launch checklist |
| `DESIGN_SYSTEM_BUILD_PIVOT.md` | Design system for build pivot |

### Audits & Gap Analysis (`/planning/audits/`)

Point-in-time assessments and gap analyses.

| Document | Purpose |
|----------|---------|
| `DATA_GAPS.md` | Comprehensive data coverage gap audit |
| `DATA_COVERAGE_TRACKER.md` | Data coverage tracking |
| `EVENTS_GAP_ANALYSIS.md` | Events database gap analysis |
| `FEATURE_CATALOG.md` | Feature status audit with discrepancies |
| `KNOWN_ISSUES_BACKLOG.md` | Known issues tracking |
| `TECH_DEBT.md` | Technical debt assessment |
| `CSS_AUDIT_REPORT.md` | CSS brand consistency audit (completed) |
| `CSS_MIGRATION_AUDIT.md` | CSS token migration tracking |
| `PHYSICS_MODEL_AUDIT.md` | Physics model UI-physics mapping audit |
| `PRIORITY_PAGES_BRAND_QA.md` | Priority pages brand QA checklist |

### Reference Material (`/planning/reference/`)

External references, cost analyses, and guides.

| Document | Purpose |
|----------|---------|
| `FEATURES.md` | Marketing-style feature descriptions |
| `OWNER_GUIDE.md` | Non-technical stakeholder guide |
| `COST_ANALYSIS_PL.md` | Comprehensive cost breakdown and projections |
| `SCALABILITY.md` | Infrastructure scaling guide |
| `image-inventory.md` | Required images list with prompts |
| `CORY_EVO_X_PROJECTION.md` | Example physics model projection (Evo X case study) |
| `FUTURE_PERFORMANCE_MODEL.md` | Hybrid physics + calibration model spec |

---

## System At a Glance

| Metric | Count |
|--------|-------|
| **Active Pages** | 60 |
| **Archived Pages** | 20+ (see FEATURE_ARCHIVE.md) |
| **API Routes** | 160 |
| **Cron Jobs** | 20 (scheduled via Vercel) |
| **Database Tables** | 139 |
| **Database Migrations** | 242 |
| **Components** | 192 |
| **Lib Services** | 177 |
| **Operational Scripts** | 266 |
| **Static Data Files** | 10 |
| **Cars in Database** | 310 |
| **Parts in Catalog** | 723 |
| **AL Tools** | 20 (including image analysis) |
| **Community Insights** | 1,252 |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│  Next.js 14 App Router • React • CSS Modules                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ Browse   │ │ Car      │ │ My       │ │ Tuning   │        │
│  │ Cars     │ │ Selector │ │ Garage   │ │ Shop     │        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
├─────────────────────────────────────────────────────────────┤
│                     API LAYER (160 routes)                   │
│  /api/cars/* • /api/parts/* • /api/ai-mechanic • /api/vin/* │
│  /api/community/* • /api/analytics/* • /api/admin/*         │
├─────────────────────────────────────────────────────────────┤
│                      SERVICE LAYER (177 files)               │
│  tierAccess • carsClient • alTools • maintenanceService     │
├─────────────────────────────────────────────────────────────┤
│                      DATA LAYER                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  Supabase   │  │   Claude    │  │  External   │          │
│  │ (139 tables)│  │   (AL AI)   │  │  APIs       │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

---

## Membership Tiers (Jan 2026)

| Tier | Price | Key Value |
|------|-------|-----------|
| **Free** | $0 | 1 car, full garage, community & events, ~15 AL chats |
| **Enthusiast** | $9.99/mo | 3 cars, Insights, Data tabs, ~130 AL chats |
| **Pro** | $19.99/mo | Unlimited cars, priority support, ~350 AL chats |

Currently **beta** - all features unlocked for authenticated users.

---

## Folder Structure

```
/docs/                          # Core Reference (32 files)
├── index.md                    # This file
├── ARCHITECTURE.md             # System architecture
├── DATABASE.md                 # Database schemas
├── API.md                      # API reference (160 routes)
├── PAGES.md                    # Page structure
├── COMPONENTS.md               # Component reference
├── AL.md                       # AI assistant (20 tools)
├── CAR_PIPELINE.md             # Adding new cars
├── CODE_PATTERNS.md            # Coding patterns
├── DATA_FILES.md               # Static data files
├── SCRIPTS.md                  # Operational scripts
├── TESTING.md                  # Test strategy
├── MIGRATIONS.md               # Database migrations
├── TIER_ACCESS_MATRIX.md       # Feature gating
├── SCORING_ALGORITHM.md        # Car selector algorithm
├── STRIPE_INTEGRATION.md       # Payment integration
├── GOOGLE_CLOUD_APIS.md        # Google APIs
├── DISCORD_CHANNEL_REFERENCE.md # Discord webhooks
├── ENRICHMENT-PIPELINE.md      # Data enrichment pipeline
├── BRAND_GUIDELINES.md         # Brand colors/typography
├── CSS_ARCHITECTURE.md         # CSS token system
├── MOBILE_TESTING_STRATEGY.md  # Mobile testing
├── FEATURE_ARCHIVE.md          # Archived features reference
├── ERROR_HANDLING.md           # Error conventions
├── ERROR_TRACKING.md           # Error tracking system
├── FILE_STRUCTURE.md           # Codebase organization
├── ACTIVE_CONFIG.md            # Current configuration
├── CRON_JOBS.md                # Scheduled jobs
├── COST_TRACKING_SETUP.md      # Cost tracking
├── ARTICLE_IMAGE_STRATEGY.md   # AI image generation
├── VEHICLE_TRACKING_FLOW.md    # Vehicle API flows
└── CSS_MIGRATION_QA_PROMPT.md  # CSS migration prompt

/planning/
├── strategies/                 # Long-term approaches
├── roadmaps/                   # Feature roadmaps
├── implementations/            # Feature build plans + pre-launch checklists
├── audits/                     # Point-in-time assessments + CSS audits
└── reference/                  # External references + projections
```

---

*Navigate to specific documents above for detailed reference.*
