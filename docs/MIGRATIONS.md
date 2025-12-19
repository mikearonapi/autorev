# AutoRev Database Migrations

> Reference for Supabase migration history and procedures
>
> **Last Updated:** December 15, 2024

---

## Overview

Database migrations are stored in `supabase/migrations/` as SQL files. They are applied in order based on filename prefix (001_, 002_, etc.).

| Total Migrations | 50+ |
|-----------------|-----|
| **Location** | `supabase/migrations/` |
| **Format** | SQL files with numeric prefix |
| **Tracking** | Supabase migration history |

---

## Migration History

### Core Schema (001-015)

| Migration | Purpose | Tables Created |
|-----------|---------|----------------|
| `001_seed_upgrade_education.sql` | Initial upgrade content | (seed data) |
| `002_enrich_car_performance_data.sql` | Performance metrics | — |
| `002_scores_to_decimal.sql` | Convert scores to decimal | `cars` (alter) |
| `004_add_curated_experience_columns.sql` | Car experience columns | `cars` (alter) |
| `005_youtube_enrichment_tables.sql` | YouTube system | `youtube_videos`, `youtube_channels`, `youtube_video_car_links` |
| `006_expert_validated_scores.sql` | Expert score validation | — |
| `007_calibrated_scores.sql` | Score calibration | — |
| `008_image_library.sql` | Image management | `car_images` |
| `009_user_tables.sql` | User system | `user_profiles`, `user_favorites` |
| `010_vehicle_maintenance_specs.sql` | Maintenance data | `vehicle_maintenance_specs` |
| `011_al_credits_tables.sql` | AL credits system | `al_user_credits` |
| `011_car_upgrade_recommendations.sql` | Upgrade recommendations | `car_upgrade_recommendations` |
| `012_al_conversations_and_optimization.sql` | AL chat storage | `al_conversations`, `al_messages` |
| `013_comprehensive_upgrade_recommendations.sql` | Expanded recommendations | — |
| `014_owner_dashboard_enhancements.sql` | Owner features | `user_vehicles`, `user_service_logs` |
| `015_user_feedback.sql` | Feedback system | `user_feedback` |

### Feature Expansions (016-030)

| Migration | Purpose | Tables Created |
|-----------|---------|----------------|
| `016_user_gallery_images.sql` | User image uploads | — |
| `018_add_car_request_feedback_type.sql` | Car request feedback | — |
| `019_initialize_al_credits_on_signup.sql` | Auto-init credits | (trigger) |
| `020_naming_cleanup_audit.sql` | Column naming fixes | — |
| `021_enriched_car_data.sql` | Enrichment tables | `car_fuel_economy`, `car_safety_data`, `car_market_pricing` |
| `022_ai_db_foundations.sql` | AI knowledge base | `source_documents`, `document_chunks` |
| `023_car_variants_and_car_id_adoption.sql` | Variant system | `car_variants` |
| `028_parts_and_upgrade_graph.sql` | Parts system | `parts`, `part_fitments`, `part_relationships` |
| `029_scrape_jobs_payload.sql` | Scrape job system | `scrape_jobs` |
| `030_fitment_tag_mappings.sql` | Fitment normalization | `fitment_tag_mappings` |

### Performance Data (031-043)

| Migration | Purpose | Tables Created |
|-----------|---------|----------------|
| `031_track_lap_times.sql` | Track data | `track_venues`, `car_track_lap_times` |
| `032_dyno_data.sql` | Dyno database | `car_dyno_runs` |
| `033_vin_variant_resolution.sql` | VIN decode | — |
| `034_variant_maintenance_overrides.sql` | Variant-specific specs | `car_variant_maintenance_overrides` |
| `035_user_project_parts.sql` | Build projects | `user_projects`, `user_project_parts` |
| `036_parts_query_performance.sql` | Performance indexes | — |
| `037_parts_vendor_ingest_shopify_vag.sql` | Vendor ingestion | — |
| `038_maintenance_summary_richer_fields.sql` | Expanded maintenance | — |
| `039_fitment_expansion.sql` | Expanded fitments | — |
| `040_seed_multi_brand_parts.sql` | Multi-brand parts | (seed data) |
| `041_top_up_min_fitments.sql` | Minimum fitments | — |
| `042_p0_car_known_issues.sql` | Known issues | `car_issues` |
| `043_expanded_dyno_lap_times.sql` | More perf data | — |

### Recent Features (044-050)

| Migration | Purpose | Tables Created |
|-----------|---------|----------------|
| `044_car_recalls_nhtsa_fields.sql` | Recall data | `car_recalls` |
| `045_beta_feedback_enhancements.sql` | Enhanced feedback | — |
| `046_forum_intelligence_schema.sql` | Forum system | `forum_sources`, `forum_scrape_runs`, `forum_scraped_threads`, `community_insights` |
| `047_seed_forum_sources.sql` | Forum seed data | (seed data) |
| `048_events_schema.sql` | Events system | `events`, `event_types`, `event_car_affinities`, `event_saves`, `event_submissions` |
| `049_seed_sample_events.sql` | Sample events | (seed data) |
| `050_events_geocoding_and_sources.sql` | Event sources | `event_sources` |

---

## Running Migrations

### Via Supabase CLI

```bash
# Run all pending migrations
npx supabase db push

# Run specific migration
npx supabase db push --db-url "postgresql://..." < supabase/migrations/050_events_geocoding_and_sources.sql
```

### Via Script

```bash
# Using migration runner script
node scripts/run-migration.js 050_events_geocoding_and_sources.sql

# Direct PostgreSQL
node scripts/runMigrationPg.js supabase/migrations/050_events_geocoding_and_sources.sql
```

### Via Supabase Dashboard

1. Go to SQL Editor in Supabase Dashboard
2. Copy migration file contents
3. Execute

---

## Migration File Format

### Standard Migration

```sql
-- Migration: 050_events_geocoding_and_sources.sql
-- Purpose: Add geocoding and event source configuration
-- Date: 2024-12-10

-- Create event_sources table
CREATE TABLE IF NOT EXISTS event_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  source_type TEXT NOT NULL,
  base_url TEXT,
  api_config JSONB,
  scrape_config JSONB,
  regions_covered TEXT[],
  event_types TEXT[],
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  last_run_events INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policy
ALTER TABLE event_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event sources readable by authenticated" ON event_sources
  FOR SELECT TO authenticated USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_event_sources_is_active ON event_sources(is_active);
```

### Seed Migration

```sql
-- Migration: 049_seed_sample_events.sql
-- Purpose: Seed sample event data
-- Date: 2024-12-08

INSERT INTO events (slug, name, description, event_type_id, ...)
VALUES 
  ('cars-coffee-malibu-jan-2025', 'Malibu Cars & Coffee', '...', ...),
  ('laguna-seca-hpde-feb-2025', 'Laguna Seca HPDE', '...', ...);
```

---

## Car Update Migrations

Separate from schema migrations, `supabase/car-updates/` contains data updates for specific cars:

```
supabase/car-updates/
├── 002_718-cayman-gts-40.sql
├── BATCH_BUDGET_PART1.sql
├── BATCH_BUDGET_PART2.sql
├── BATCH_MID_PART1.sql
├── BATCH_PREMIUM_TIER.sql
└── ...
```

These update car specifications, scores, and metadata.

---

## Migration Best Practices

### DO

✅ Use descriptive names: `046_forum_intelligence_schema.sql`
✅ Include comments explaining purpose
✅ Use `IF NOT EXISTS` for CREATE statements
✅ Enable RLS on new tables
✅ Create necessary indexes
✅ Add foreign key constraints
✅ Test in development first

### DON'T

❌ Modify existing migrations after deployment
❌ Delete or rename existing migrations
❌ Skip migration numbers
❌ Include destructive operations without backup plan
❌ Forget to update documentation

---

## Rollback Procedures

Supabase doesn't have automatic rollback. For manual rollback:

1. **Identify changes** — Review migration SQL
2. **Create reverse migration** — Write SQL to undo changes
3. **Backup first** — Always backup before rollback
4. **Apply reverse** — Run via SQL Editor
5. **Verify** — Check data integrity

### Example Rollback

```sql
-- Rollback 050_events_geocoding_and_sources.sql

-- Drop table
DROP TABLE IF EXISTS event_sources;

-- Remove columns added to events
ALTER TABLE events DROP COLUMN IF EXISTS latitude;
ALTER TABLE events DROP COLUMN IF EXISTS longitude;
```

---

## Schema Overview

After all migrations, the database has:

| Category | Tables |
|----------|--------|
| Core Car Data | 16 |
| Parts & Upgrades | 8 |
| User Data | 9 |
| Maintenance | 3 |
| AL/AI | 5 |
| Knowledge Base | 2 |
| YouTube | 4 |
| Track Data | 2 |
| Forum Intelligence | 5 |
| Events | 6 |
| System | 5 |
| **Total** | **65** |

See [DATABASE.md](DATABASE.md) for complete schema documentation.

---

## Troubleshooting

### Migration Already Applied

```
Error: migration "050_..." has already been applied
```

**Solution:** Skip the migration or check if changes are already in DB.

### Foreign Key Violation

```
Error: violates foreign key constraint
```

**Solution:** Ensure referenced tables/rows exist first.

### Permission Denied

```
Error: permission denied for table ...
```

**Solution:** Run with service role or superuser privileges.

### Timeout

**Solution:** Break large migrations into smaller chunks or run during low-traffic periods.

---

*See [DATABASE.md](DATABASE.md) for table schemas and [SCRIPTS.md](SCRIPTS.md) for migration scripts.*






