# AutoRev Documentation

> **Last Verified:** December 15, 2024 — MCP-verified audit

---

## Quick Links

| I want to... | Read |
|--------------|------|
| Understand the system | [ARCHITECTURE.md](ARCHITECTURE.md) |
| See all pages/routes | [PAGES.md](PAGES.md) |
| Understand the database | [DATABASE.md](DATABASE.md) |
| See data gaps & priorities | [DATA_GAPS.md](DATA_GAPS.md) |
| Understand data pipelines | [DATA_PIPELINE.md](DATA_PIPELINE.md) |
| Work with APIs | [API.md](API.md) |
| Work with AL assistant | [AL.md](AL.md) |
| Understand components | [COMPONENTS.md](COMPONENTS.md) |
| See all features | [FEATURES.md](FEATURES.md) |
| Run operational scripts | [SCRIPTS.md](SCRIPTS.md) |
| Understand static data files | [DATA_FILES.md](DATA_FILES.md) |
| Run database migrations | [MIGRATIONS.md](MIGRATIONS.md) |
| Understand tier/feature gating | [TIER_ACCESS_MATRIX.md](TIER_ACCESS_MATRIX.md) |
| Understand the scoring algorithm | [SCORING_ALGORITHM.md](SCORING_ALGORITHM.md) |
| Run tests | [TESTING.md](TESTING.md) |
| Work with Google Cloud APIs | [GOOGLE_CLOUD_APIS.md](GOOGLE_CLOUD_APIS.md) |
| Non-technical overview | [OWNER_GUIDE.md](OWNER_GUIDE.md) |
| Image requirements | [image-inventory.md](image-inventory.md) |

---

## Document Inventory

### Core Documentation

| Document | Lines | Purpose |
|----------|-------|---------|
| `ARCHITECTURE.md` | ~420 | Tech stack, data flow, auth, crons |
| `PAGES.md` | ~320 | All 24 pages, user journeys |
| `DATABASE.md` | ~850 | All 65 tables, schemas, status |
| `API.md` | ~600 | All 55 API routes, 7 cron jobs |
| `AL.md` | ~500 | AI assistant, 17 tools, prompts |
| `COMPONENTS.md` | ~550 | All 53 React components |
| `FEATURES.md` | ~420 | Marketing feature descriptions |

### Data & Pipeline Reference

| Document | Lines | Purpose |
|----------|-------|---------|
| `DATA_GAPS.md` | ~400 | Data coverage gaps by priority |
| `DATA_PIPELINE.md` | ~350 | Ingestion strategy & expansion plan |

### Technical Reference

| Document | Lines | Purpose |
|----------|-------|---------|
| `SCRIPTS.md` | ~450 | 100+ operational scripts |
| `DATA_FILES.md` | ~350 | Static data files in `data/` |
| `MIGRATIONS.md` | ~300 | 50+ database migrations |
| `TIER_ACCESS_MATRIX.md` | ~350 | Complete feature-by-tier matrix |
| `SCORING_ALGORITHM.md` | ~350 | Car Selector recommendation engine |
| `TESTING.md` | ~300 | Test strategy and how to run tests |
| `GOOGLE_CLOUD_APIS.md` | ~350 | 9 Google APIs, env vars, costs |

### Other

| Document | Lines | Purpose |
|----------|-------|---------|
| `OWNER_GUIDE.md` | ~400 | Non-technical stakeholder guide |
| `image-inventory.md` | ~200 | Required images list |

---

## System At a Glance

| Metric | Count |
|--------|-------|
| **Pages** | 24 |
| **API Routes** | 55 |
| **Cron Jobs** | 7 unique (8 scheduled) |
| **Database Tables** | 65 (51 populated, 14 empty) |
| **Database Migrations** | 50+ |
| **Components** | 53 |
| **Lib Services** | 69 |
| **Operational Scripts** | 100+ |
| **Static Data Files** | 10 |
| **Cars in Database** | 98 |
| **Parts in Catalog** | 642 |
| **AL Tools** | 17 |
| **Encyclopedia Topics** | 136 (9 systems, 100% complete) |
| **Events** | 55 (⚠️ needs re-ingestion) |
| **Community Insights** | 1,226 (Porsche-only) |
| **Documentation Files** | 19 |

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
│                      API LAYER (55 routes)                   │
│  /api/cars/* • /api/parts/* • /api/ai-mechanic • /api/vin/* │
├─────────────────────────────────────────────────────────────┤
│                      SERVICE LAYER (69 files)                │
│  tierAccess • carsClient • alTools • maintenanceService     │
├─────────────────────────────────────────────────────────────┤
│                      DATA LAYER                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  Supabase   │  │   Claude    │  │  External   │          │
│  │  (65 tables)│  │   (AL AI)   │  │  APIs       │          │
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

## Related Folders

| Folder | Purpose |
|--------|---------|
| `/audit/` | Point-in-time audits and verification reports |
| `/planning/` | Roadmaps, strategy docs, and backlogs |

---

*Navigate to specific documents above for detailed reference.*


