# Teoalida Car Schema (January 2026)

> **This is the SINGLE SOURCE OF TRUTH for the `cars` table schema.**
> All code must use these column names. No legacy aliases.

## Schema Overview

The `cars` table contains 75,750 YMMT (Year/Make/Model/Trim) records from the Teoalida database.
Each row represents a **specific year + make + model + trim combination** with accurate manufacturer specs.

## Column Reference

### Core Identifiers

| Column        | Type | Required | Description                                        |
| ------------- | ---- | -------- | -------------------------------------------------- |
| `id`          | uuid | ✅       | Primary key                                        |
| `teoalida_id` | text |          | Original Teoalida database ID                      |
| `slug`        | text | ✅       | URL-safe identifier (e.g., `2024-ford-mustang-gt`) |
| `name`        | text | ✅       | Display name (e.g., "2024 Ford Mustang GT")        |

### YMMT (Year/Make/Model/Trim)

| Column             | Type    | Required | Description                                       |
| ------------------ | ------- | -------- | ------------------------------------------------- |
| `year`             | integer | ✅       | Model year (e.g., 2024)                           |
| `make`             | text    | ✅       | Manufacturer (e.g., "Ford", "BMW", "Toyota")      |
| `model`            | text    | ✅       | Model name (e.g., "Mustang", "3 Series", "Camry") |
| `trim`             | text    |          | Trim level (e.g., "GT", "M3", "XLE")              |
| `trim_description` | text    |          | Extended trim description                         |

### Classification

| Column               | Type    | Required | Description                                                     |
| -------------------- | ------- | -------- | --------------------------------------------------------------- |
| `tier`               | text    |          | Price tier: `budget`, `mid`, `upper-mid`, `premium`             |
| `category`           | text    |          | Body category: `Sport`, `Sedan`, `SUV`, `Truck`, `Van`, `Other` |
| `body_type`          | text    |          | Detailed body style from Teoalida                               |
| `car_classification` | text    |          | Teoalida classification                                         |
| `is_selectable`      | boolean |          | Whether car appears in selectors (default: true)                |
| `generation_id`      | uuid    |          | FK to `car_generations` for shared content                      |

### Engine & Performance

| Column        | Type    | Description                                          |
| ------------- | ------- | ---------------------------------------------------- |
| `hp`          | integer | Horsepower                                           |
| `hp_rpm`      | integer | RPM at peak horsepower                               |
| `torque`      | integer | Torque in lb-ft                                      |
| `torque_rpm`  | integer | RPM at peak torque                                   |
| `engine_size` | numeric | Displacement in liters                               |
| `cylinders`   | text    | Cylinder configuration (e.g., "V8", "I4")            |
| `engine_type` | text    | Fuel/engine type (e.g., "gas", "diesel", "electric") |
| `fuel_type`   | text    | Detailed fuel type                                   |

### Drivetrain

| Column         | Type | Description                                                     |
| -------------- | ---- | --------------------------------------------------------------- |
| `transmission` | text | Transmission type (e.g., "6-speed manual", "8-speed automatic") |
| `drive_type`   | text | Drivetrain (e.g., "rear wheel drive", "all wheel drive")        |

### Dimensions & Weight

| Column                | Type    | Description                |
| --------------------- | ------- | -------------------------- |
| `curb_weight`         | integer | Weight in pounds           |
| `length_in`           | numeric | Length in inches           |
| `width_in`            | numeric | Width in inches            |
| `height_in`           | numeric | Height in inches           |
| `wheelbase_in`        | numeric | Wheelbase in inches        |
| `ground_clearance_in` | numeric | Ground clearance in inches |

### Pricing

| Column | Type    | Description                           |
| ------ | ------- | ------------------------------------- |
| `msrp` | integer | Manufacturer's Suggested Retail Price |

### Fuel Economy

| Column               | Type    | Description               |
| -------------------- | ------- | ------------------------- |
| `mpg_city`           | integer | City MPG                  |
| `mpg_highway`        | integer | Highway MPG               |
| `mpg_combined`       | integer | Combined MPG              |
| `fuel_tank_capacity` | numeric | Fuel tank size in gallons |

### Capability (Trucks/SUVs)

| Column        | Type    | Description                        |
| ------------- | ------- | ---------------------------------- |
| `max_towing`  | integer | Maximum towing capacity in pounds  |
| `max_payload` | integer | Maximum payload capacity in pounds |

### Origin & Platform

| Column              | Type | Description                                     |
| ------------------- | ---- | ----------------------------------------------- |
| `country_of_origin` | text | Manufacturing country                           |
| `platform_code`     | text | Vehicle platform code (for generation grouping) |

### Media

| Column       | Type | Description               |
| ------------ | ---- | ------------------------- |
| `image_url`  | text | Primary vehicle image URL |
| `source_url` | text | Original data source URL  |

### Metadata

| Column       | Type        | Description               |
| ------------ | ----------- | ------------------------- |
| `created_at` | timestamptz | Record creation timestamp |

---

## Field Migration Reference

**IMPORTANT**: All code must be updated to use the new column names.

| ❌ OLD (Remove)     | ✅ NEW (Use This)   | Notes                              |
| ------------------- | ------------------- | ---------------------------------- |
| `brand`             | `make`              | Manufacturer name                  |
| `years`             | `year`              | Now integer, not text range        |
| `engine`            | `engine_type`       | Engine/fuel type                   |
| `trans`             | `transmission`      | Full transmission description      |
| `drivetrain`        | `drive_type`        | Drivetrain configuration           |
| `price_avg`         | `msrp`              | Single price, not range            |
| `price_range`       | `msrp`              | Format in code if needed           |
| `country`           | `country_of_origin` | Manufacturing country              |
| `image_hero_url`    | `image_url`         | Primary image                      |
| `structure_version` | _(removed)_         | No longer needed                   |
| `parent_car_id`     | `generation_id`     | Use generations for shared content |
| `is_selectable`     | `is_selectable`     | _(unchanged)_                      |

---

## Related Tables

### `car_generations`

Groups cars by platform for shared content (issues, tuning, maintenance).

| Column          | Type    | Description                                  |
| --------------- | ------- | -------------------------------------------- |
| `id`            | uuid    | Primary key                                  |
| `name`          | text    | Generation name                              |
| `platform_code` | text    | Platform identifier                          |
| `make`          | text    | Manufacturer                                 |
| `model`         | text    | Model name                                   |
| `year_start`    | integer | First model year                             |
| `year_end`      | integer | Last model year                              |
| `legacy_car_id` | uuid    | FK to `cars_v1_legacy` for content migration |

### `cars_v1_legacy`

Archived pre-Teoalida car records (2,028 records).
**Purpose**: Content migration reference only. Will be removed after content migration.

---

## Code Patterns

### Fetching Cars (Server)

```javascript
const { data } = await supabase
  .from('cars')
  .select(
    `
    id, slug, name, year, make, model, trim,
    hp, torque, engine_type, transmission, drive_type,
    msrp, curb_weight, body_type, tier, category,
    image_url
  `
  )
  .eq('is_selectable', true)
  .order('name');
```

### Normalizing for Frontend

```javascript
function normalizeCar(car) {
  return {
    id: car.id,
    slug: car.slug,
    name: car.name,
    year: car.year,
    make: car.make,
    model: car.model,
    trim: car.trim,
    hp: car.hp,
    torque: car.torque,
    engineType: car.engine_type,
    transmission: car.transmission,
    driveType: car.drive_type,
    msrp: car.msrp,
    curbWeight: car.curb_weight,
    bodyType: car.body_type,
    tier: car.tier,
    category: car.category,
    imageUrl: car.image_url,
  };
}
```

### Displaying Price

```javascript
// Format MSRP for display
const formattedPrice = car.msrp ? `$${car.msrp.toLocaleString()}` : 'Price N/A';
```

---

## Migration Status

- [x] `cars` table swapped to Teoalida data (75,750 records)
- [x] `cars_v1_legacy` preserved for content reference
- [x] `user_vehicles` migrated to new car IDs (67 records)
- [x] `car_generations` table created
- [x] `tier` and `category` columns populated
- [ ] Content tables need regeneration (issues, tuning, etc.)
- [ ] All code updated to new column names
- [ ] `cars_v1_legacy` removed after content migration
