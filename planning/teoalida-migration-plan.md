# Teoalida Migration Plan

## Overview

Replace AutoRev's current `cars` table with Teoalida's YMMT database (75,750 trims) while preserving all user data.

## Pre-Migration Checklist

- [ ] Purchase Teoalida database ($757.50)
- [ ] Create full database backup
- [ ] Test migration script on backup first

---

## Phase 1: Data Preparation (Before Import)

### 1.1 Backup Everything

```sql
-- Create backup schema
CREATE SCHEMA IF NOT EXISTS backup_20260201;

-- Backup all user-critical tables
CREATE TABLE backup_20260201.user_vehicles AS SELECT * FROM user_vehicles;
CREATE TABLE backup_20260201.user_projects AS SELECT * FROM user_projects;
CREATE TABLE backup_20260201.user_favorites AS SELECT * FROM user_favorites;
CREATE TABLE backup_20260201.user_feedback AS SELECT * FROM user_feedback;
CREATE TABLE backup_20260201.user_uploaded_images AS SELECT * FROM user_uploaded_images;
CREATE TABLE backup_20260201.user_track_times AS SELECT * FROM user_track_times;
CREATE TABLE backup_20260201.community_posts AS SELECT * FROM community_posts;
CREATE TABLE backup_20260201.cars AS SELECT * FROM cars;
```

### 1.2 Document Current State

| Table                | Records | FK Column      |
| -------------------- | ------- | -------------- |
| user_vehicles        | 67      | matched_car_id |
| user_projects        | 52      | car_id         |
| user_feedback        | 51      | car_id         |
| user_favorites       | 17      | car_id         |
| user_uploaded_images | 19      | car_id         |
| user_track_times     | 2       | car_id         |

---

## Phase 2: Import Teoalida Data

### 2.1 Create New Cars Table Structure

```sql
-- Create new table for Teoalida data
CREATE TABLE cars_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- YMMT Core (from Teoalida)
  teoalida_id TEXT UNIQUE,  -- Their ID for updates
  year INTEGER NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  trim TEXT,
  trim_description TEXT,

  -- Naming/Routing
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,  -- Display name: "2019 Ford Mustang GT Premium"

  -- Specs (from Teoalida)
  hp INTEGER,
  hp_rpm INTEGER,
  torque INTEGER,
  torque_rpm INTEGER,
  engine_size DECIMAL(3,1),
  cylinders INTEGER,
  engine_type TEXT,  -- "V8", "I4", etc.
  transmission TEXT,
  drive_type TEXT,  -- "RWD", "AWD", etc.

  -- Dimensions
  curb_weight INTEGER,
  length_in DECIMAL(5,1),
  width_in DECIMAL(5,1),
  height_in DECIMAL(5,1),
  wheelbase_in DECIMAL(5,1),

  -- Pricing
  msrp INTEGER,

  -- Classification (from Teoalida)
  body_type TEXT,
  platform_code TEXT,  -- "G20", "S550", "C8"
  car_classification TEXT,
  country_of_origin TEXT,

  -- Fuel
  fuel_type TEXT,
  mpg_city INTEGER,
  mpg_highway INTEGER,
  mpg_combined INTEGER,

  -- Images
  image_url TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_cars_new_ymmt ON cars_new(year, make, model, trim);
CREATE INDEX idx_cars_new_make_model ON cars_new(make, model);
CREATE INDEX idx_cars_new_slug ON cars_new(slug);
CREATE INDEX idx_cars_new_platform ON cars_new(platform_code);
```

### 2.2 Import Script

```javascript
// scripts/import-teoalida.mjs

import { createClient } from '@supabase/supabase-js';
import xlsx from 'xlsx';

// Slug generation: "2019-ford-mustang-gt-premium"
function generateSlug(year, make, model, trim) {
  const parts = [year, make, model, trim].filter(Boolean);
  return parts
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Parse Teoalida Excel
const workbook = xlsx.readFile('Year-Make-Model-Trim-Full-Specs-by-Teoalida.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet, { range: 2 }); // Skip header rows

// Transform and insert
for (const row of data) {
  await supabase.from('cars_new').insert({
    teoalida_id: row['ID'],
    year: row['Year'],
    make: row['Make'],
    model: row['Model'],
    trim: row['Trim'],
    slug: generateSlug(row['Year'], row['Make'], row['Model'], row['Trim']),
    name: `${row['Year']} ${row['Make']} ${row['Model']} ${row['Trim'] || ''}`.trim(),
    hp: row['Horsepower (HP)'],
    torque: row['Torque (ft-lbs)'],
    // ... map all fields
  });
}
```

---

## Phase 3: User Data Migration (THE CRITICAL PART)

### 3.1 Create Mapping Table

```sql
-- Map old car_ids to new car_ids
CREATE TABLE car_id_mapping (
  old_car_id UUID,
  new_car_id UUID,
  match_method TEXT,  -- 'exact', 'fuzzy', 'manual'
  confidence DECIMAL(3,2),
  reviewed BOOLEAN DEFAULT FALSE
);
```

### 3.2 User Vehicle Matching Strategy

Users have stored: `year`, `make`, `model`, `trim`

**Step 1: Exact match**

```sql
INSERT INTO car_id_mapping (old_car_id, new_car_id, match_method, confidence)
SELECT
  uv.matched_car_id,
  cn.id,
  'exact',
  1.0
FROM user_vehicles uv
JOIN cars_new cn ON
  cn.year = uv.year
  AND LOWER(cn.make) = LOWER(uv.make)
  AND (
    LOWER(cn.model) LIKE '%' || LOWER(uv.model) || '%'
    OR LOWER(uv.model) LIKE '%' || LOWER(cn.model) || '%'
  );
```

**Step 2: Fuzzy match with review**

```javascript
// For unmatched records, use fuzzy matching
const unmatched = await getUnmatchedUserVehicles();

for (const uv of unmatched) {
  // Search by year + make, rank by model similarity
  const candidates = await supabase
    .from('cars_new')
    .select('*')
    .eq('year', uv.year)
    .ilike('make', `%${uv.make}%`)
    .limit(10);

  // Score candidates by model/trim similarity
  // Flag for manual review if confidence < 0.8
}
```

**Step 3: Manual review queue**

- Generate report of uncertain matches
- Admin UI to approve/correct mappings

### 3.3 Migrate User Tables

```sql
-- After mapping is complete and reviewed:

-- user_vehicles
UPDATE user_vehicles uv
SET matched_car_id = m.new_car_id
FROM car_id_mapping m
WHERE uv.matched_car_id = m.old_car_id
  AND m.reviewed = TRUE;

-- user_favorites
UPDATE user_favorites uf
SET car_id = m.new_car_id
FROM car_id_mapping m
WHERE uf.car_id = m.old_car_id;

-- user_projects (same pattern)
-- user_feedback (same pattern)
-- user_uploaded_images (same pattern)
-- user_track_times (same pattern)
```

---

## Phase 4: Content Regeneration

### 4.1 Create Generation Table (for shared content)

```sql
-- Group cars by platform for content sharing
CREATE TABLE car_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_code TEXT,  -- "G20", "S550", "C8"
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year_start INTEGER,
  year_end INTEGER,
  name TEXT,  -- "BMW G20 3 Series (2019-2024)"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link cars to generations
ALTER TABLE cars_new ADD COLUMN generation_id UUID REFERENCES car_generations(id);
```

### 4.2 Content Tables

Content applies to GENERATIONS, not individual trims:

```sql
-- Issues linked to generations
ALTER TABLE car_issues
  ADD COLUMN generation_id UUID REFERENCES car_generations(id);

-- Tuning profiles linked to generations
ALTER TABLE car_tuning_profiles
  ADD COLUMN generation_id UUID REFERENCES car_generations(id);

-- Lap times linked to specific cars (year/trim matters)
ALTER TABLE car_track_lap_times
  ADD COLUMN car_id_new UUID REFERENCES cars_new(id);
```

### 4.3 Regenerate Content

```javascript
// For each generation, use AI to generate:
// - Known issues (based on platform, engine family)
// - Tuning profiles (based on engine, drivetrain)
// - Maintenance specs (based on Teoalida data + research)

// AI prompts now include ACCURATE specs:
const prompt = `
Generate known issues for the ${generation.name}.
Engine: ${car.engine_size}L ${car.engine_type} with ${car.hp} HP
Years: ${generation.year_start}-${generation.year_end}
Platform: ${generation.platform_code}
`;
```

---

## Phase 5: Cutover

### 5.1 Final Migration (Maintenance Window)

```sql
-- 1. Rename tables
ALTER TABLE cars RENAME TO cars_old;
ALTER TABLE cars_new RENAME TO cars;

-- 2. Update foreign keys (if needed)
-- Most should work via car_id_mapping updates

-- 3. Update application code to use new schema
-- - Remove v1/v2 logic
-- - Remove parent_car_id references
-- - Update slug patterns in routes
```

### 5.2 Verification

```sql
-- Verify no orphaned user data
SELECT COUNT(*) FROM user_vehicles
WHERE matched_car_id NOT IN (SELECT id FROM cars);

-- Verify no broken favorites
SELECT COUNT(*) FROM user_favorites
WHERE car_id NOT IN (SELECT id FROM cars);
```

---

## Rollback Plan

If anything goes wrong:

```sql
-- Restore from backup schema
ALTER TABLE cars RENAME TO cars_failed;
ALTER TABLE cars_old RENAME TO cars;

-- Restore user data
UPDATE user_vehicles uv
SET matched_car_id = b.matched_car_id
FROM backup_20260201.user_vehicles b
WHERE uv.id = b.id;
```

---

## Timeline

| Phase              | Effort    | Dependencies        |
| ------------------ | --------- | ------------------- |
| 1. Backup & Prep   | 1 day     | None                |
| 2. Import Teoalida | 1 day     | Purchase database   |
| 3. User Migration  | 2-3 days  | Phase 2 complete    |
| 4. Content Regen   | 1-2 weeks | Phase 3 complete    |
| 5. Cutover         | 1 day     | All phases complete |

**Total: ~2-3 weeks** (can parallelize content regeneration)

---

## Success Criteria

- [ ] All 67 user_vehicles correctly matched to new cars
- [ ] All user_favorites, user_projects preserved
- [ ] No 404s on existing car pages (redirects in place)
- [ ] Search/browse working with new data
- [ ] Performance metrics (HP, torque) accurate and year-specific
