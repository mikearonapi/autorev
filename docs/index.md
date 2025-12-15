# AutoRev Documentation

> **Last Updated**: December 14, 2024 (Evening Sync)

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
| See all features | [FEATURES.md](FEATURES.md) |
| Non-technical overview | [OWNER_GUIDE.md](OWNER_GUIDE.md) |
| Image requirements | [image-inventory.md](image-inventory.md) |

---

## Document Inventory

| Document | Lines | Purpose |
|----------|-------|---------|
| `ARCHITECTURE.md` | ~350 | Tech stack, data flow, auth, tiers |
| `PAGES.md` | ~300 | All 24 pages, user journeys |
| `DATABASE.md` | ~500 | All 52 tables, schemas, status |
| `API.md` | ~400 | All 41 API routes |
| `AL.md` | ~450 | AI assistant, 15 tools, prompts |
| `COMPONENTS.md` | ~350 | All 46 React components |
| `FEATURES.md` | ~350 | Marketing feature descriptions |
| `OWNER_GUIDE.md` | ~400 | Non-technical stakeholder guide |
| `image-inventory.md` | ~200 | Required images list |

---

## System At a Glance

| Metric | Count |
|--------|-------|
| **Pages** | 24 |
| **API Routes** | 41 |
| **Database Tables** | 52 (40 populated, 12 empty) |
| **Components** | 46 |
| **Lib Services** | 69 |
| **Cars in Database** | 98 |
| **Parts in Catalog** | 642 |
| **AL Tools** | 15 |
| **Encyclopedia Topics** | 136 (9 systems, 100% complete) |

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
│                      API LAYER (41 routes)                   │
│  /api/cars/* • /api/parts/* • /api/ai-mechanic • /api/vin/* │
├─────────────────────────────────────────────────────────────┤
│                      SERVICE LAYER (69 files)                │
│  tierAccess • carsClient • alTools • maintenanceService     │
├─────────────────────────────────────────────────────────────┤
│                      DATA LAYER                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  Supabase   │  │   Claude    │  │  External   │          │
│  │  (52 tables)│  │   (AL AI)   │  │  APIs       │          │
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

*Navigate to specific documents above for detailed reference.*

