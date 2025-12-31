# AutoRev Planning Documentation

> **Last Updated:** December 28, 2024
>
> This folder contains planning artifacts, roadmaps, strategies, and reference material.
> For **Core Reference** documentation (how the system works today), see `/docs/`.

---

## Folder Structure

```
/planning/
├── strategies/                 # Long-term plans and approaches
├── roadmaps/                   # Feature roadmaps and enrichment plans
├── implementations/            # Specific feature build plans
├── audits/                     # Point-in-time assessments and gap analyses
└── reference/                  # External references, cost analyses, guides
```

---

## Strategies (`/strategies/`)

Long-term plans and approaches that guide product direction.

| Document | Purpose | Status |
|----------|---------|--------|
| `EVENTS_STRATEGY.md` | Comprehensive events feature strategy | Active |
| `EVENT_SOURCING_STRATEGY.md` | Event data sourcing approach | Active |
| `SEO-ORGANIC-TRAFFIC-STRATEGY.md` | SEO and organic traffic strategy | Active |

---

## Roadmaps (`/roadmaps/`)

Feature roadmaps, enrichment plans, and phased project trackers.

| Document | Purpose | Status |
|----------|---------|--------|
| `DATABASE-ENRICHMENT-ROADMAP.md` | 4-phase plan to close database gaps | Active |
| `DATA_ENRICHMENT_PLAN.md` | Data enrichment prioritization | Active |
| `events-expansion/` | Events expansion project with phases, sources, and validation | In Progress |

### Events Expansion Project

```
events-expansion/
├── MASTER_TRACKER.md           # Main project tracker
├── PHASE_1_COMPLETE.md         # Phase 1 completion notes
├── README.md                   # Project overview
├── SOURCES.md                  # Data sources
├── categories/                 # Category-specific planning
│   ├── autocross.md
│   ├── car-show.md
│   ├── cars-and-coffee.md
│   └── track-day-hpde.md
├── cities/                     # City coverage batches
│   ├── CITIES_BATCH_001.md
│   └── CITIES_BATCH_002.md
└── validation/                 # Data quality logs
    ├── DUPLICATES_LOG.md
    └── FAILED_SOURCES.md
```

---

## Implementation Plans (`/implementations/`)

Specific feature build plans with technical details.

| Document | Purpose | Status |
|----------|---------|--------|
| `DATA_PIPELINE.md` | Data ingestion/enrichment strategy | Active |
| `DATA-ACQUISITION-STRATEGIES.md` | Bot-protection-aware scraping strategies | Active |
| `CONTACT_PAGE_UPDATE.md` | Contact page redesign implementation | Complete |
| `DAILY_DOSE_COMPARISON.md` | Daily Digest enhancement comparison | Complete |
| `FORUM_INTELLIGENCE_PLAN.md` | Forum scraping implementation plan | In Progress |
| `VEHICLE_MODIFICATIONS_IMPLEMENTATION.md` | Vehicle modifications feature plan | Planned |

---

## Audits & Gap Analysis (`/audits/`)

Point-in-time assessments, gap analyses, and technical debt tracking.

| Document | Purpose | Last Updated |
|----------|---------|--------------|
| `DATA_GAPS.md` | Comprehensive data coverage gap audit | Dec 2024 |
| `DATA_COVERAGE_TRACKER.md` | Data coverage tracking | Dec 2024 |
| `EVENTS_GAP_ANALYSIS.md` | Events database gap analysis | Dec 2024 |
| `FEATURE_CATALOG.md` | Feature status audit with discrepancies | Dec 2024 |
| `KNOWN_ISSUES_BACKLOG.md` | Known issues tracking | Dec 2024 |
| `TECH_DEBT.md` | Technical debt assessment | Dec 2024 |

---

## Reference Material (`/reference/`)

External references, cost analyses, and stakeholder guides.

| Document | Purpose | Audience |
|----------|---------|----------|
| `FEATURES.md` | Marketing-style feature descriptions | Marketing/Sales |
| `OWNER_GUIDE.md` | Non-technical stakeholder guide | Stakeholders |
| `COST_ANALYSIS_PL.md` | Comprehensive cost breakdown and projections | Finance/Management |
| `SCALABILITY.md` | Infrastructure scaling guide | Engineering |
| `image-inventory.md` | Required images list with prompts | Design/Content |

---

## Document Lifecycle

| Stage | Location | Description |
|-------|----------|-------------|
| **Strategy** | `/strategies/` | High-level direction and approach |
| **Roadmap** | `/roadmaps/` | Phased plans with timelines |
| **Implementation** | `/implementations/` | Detailed build plans |
| **Complete** | `/docs/` | Move to core reference when feature ships |
| **Audit** | `/audits/` | Point-in-time assessments (update periodically) |
| **Archive** | `/planning/archive/` | Obsolete or superseded docs (create as needed) |

---

## Related

- [Core Documentation Index](/docs/index.md) — System reference documentation
- [Architecture](/docs/ARCHITECTURE.md) — System design overview
- [Database Schema](/docs/DATABASE.md) — Complete database reference

---

*For how the system works today, see `/docs/`. For where we're going, see this folder.*





