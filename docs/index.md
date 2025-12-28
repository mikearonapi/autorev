# AutoRev Documentation

> **Last Verified:** December 28, 2024 — Reorganized documentation structure
>
> `/docs/` contains **Core Reference** documentation describing how the system works today.
> `/planning/` contains strategies, roadmaps, implementation plans, audits, and reference material.

---

## Quick Links

| I want to... | Read |
|--------------|------|
| Understand the system | [ARCHITECTURE.md](ARCHITECTURE.md) |
| See all pages/routes | [PAGES.md](PAGES.md) |
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
| `PAGES.md` | All 37 pages, routes, tier requirements, features |
| `DATABASE.md` | All 75 tables, schemas, RLS policies, RPCs |
| `API.md` | All 85 API routes, parameters, responses, auth |
| `COMPONENTS.md` | All 64 React components, props, tier requirements |
| `FILE_STRUCTURE.md` | Codebase file organization |

### Features & Integrations

| Document | Purpose |
|----------|---------|
| `AL.md` | AI assistant: 17 tools, prompts, API, credits |
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

### Reference Material (`/planning/reference/`)

External references, cost analyses, and guides.

| Document | Purpose |
|----------|---------|
| `FEATURES.md` | Marketing-style feature descriptions |
| `OWNER_GUIDE.md` | Non-technical stakeholder guide |
| `COST_ANALYSIS_PL.md` | Comprehensive cost breakdown and projections |
| `SCALABILITY.md` | Infrastructure scaling guide |
| `image-inventory.md` | Required images list with prompts |

---

## System At a Glance

| Metric | Count |
|--------|-------|
| **Pages** | 37 |
| **API Routes** | 99 |
| **Cron Jobs** | 12 (scheduled via Vercel) |
| **Database Tables** | 75 |
| **Database Migrations** | 50+ |
| **Components** | 70+ |
| **Lib Services** | 114 |
| **Operational Scripts** | 170+ |
| **Static Data Files** | 10 |
| **Cars in Database** | 98 |
| **Parts in Catalog** | 642 |
| **AL Tools** | 17 |
| **Encyclopedia Topics** | 136 (9 systems) |
| **Events** | 940+ |
| **Community Insights** | 1,226 |

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
│                      API LAYER (99 routes)                   │
│  /api/cars/* • /api/parts/* • /api/ai-mechanic • /api/vin/* │
│  /api/checkout • /api/billing/portal • /api/webhooks/stripe │
├─────────────────────────────────────────────────────────────┤
│                      SERVICE LAYER (114 files)               │
│  tierAccess • carsClient • alTools • maintenanceService     │
├─────────────────────────────────────────────────────────────┤
│                      DATA LAYER                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  Supabase   │  │   Claude    │  │  External   │          │
│  │  (75 tables)│  │   (AL AI)   │  │  APIs       │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

---

## Membership Tiers

| Tier | Price | Key Value |
|------|-------|-----------|
| **Free** | $0 | Car research & discovery |
| **Collector** | $4.99/mo | Ownership intelligence |
| **Tuner** | $9.99/mo | Performance data & builds |

Currently **beta** - all features unlocked for authenticated users.

---

## Folder Structure

```
/docs/                          # Core Reference (22 files)
├── index.md                    # This file
├── ARCHITECTURE.md
├── DATABASE.md
├── API.md
├── PAGES.md
├── COMPONENTS.md
├── AL.md
├── CAR_PIPELINE.md
├── CODE_PATTERNS.md
├── DATA_FILES.md
├── DISCORD_CHANNEL_REFERENCE.md
├── ERROR_HANDLING.md
├── ERROR_TRACKING.md
├── FILE_STRUCTURE.md
├── GOOGLE_CLOUD_APIS.md
├── STRIPE_INTEGRATION.md        # NEW: Stripe payment integration
├── MIGRATIONS.md
├── SCORING_ALGORITHM.md
├── SCRIPTS.md
├── TESTING.md
├── TIER_ACCESS_MATRIX.md
└── ACTIVE_CONFIG.md

/planning/
├── strategies/                 # Long-term approaches
├── roadmaps/                   # Feature roadmaps
├── implementations/            # Feature build plans
├── audits/                     # Point-in-time assessments
└── reference/                  # External references
```

---

*Navigate to specific documents above for detailed reference.*
