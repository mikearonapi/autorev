# Car Pipeline Scripts

Scripts for automating car addition and enrichment in the AutoRev database.

## Overview

The car pipeline populates ALL required data for a car to work across the AutoRev app:

| Table                       | Purpose                     | Used By                |
| --------------------------- | --------------------------- | ---------------------- |
| `cars`                      | Core specs, scores, content | All pages              |
| `car_issues`                | Known problems              | `/garage/my-specs`, AL |
| `vehicle_maintenance_specs` | Fluids, tires, capacities   | `/garage/my-specs`     |
| `vehicle_service_intervals` | Service schedules           | `/garage/my-specs`     |
| `car_tuning_profiles`       | Upgrade recommendations     | `/garage/my-build`     |
| `car_variants`              | Year/trim combinations      | VIN decode             |

---

## 🤖 Add a New Car

### `ai-research-car-verified.js`

Accuracy-first pipeline with web research verification. Uses Exa search to verify specs from authoritative sources (Car & Driver, Edmunds, OEM sites).

```bash
# Add a car with verified data
node scripts/car-pipeline/ai-research-car-verified.js "2024 BMW M3 Competition"

# Dry run to preview what would be added
node scripts/car-pipeline/ai-research-car-verified.js "2024 BMW M3 Competition" --dry-run

# Verbose output to see sources
node scripts/car-pipeline/ai-research-car-verified.js "2024 BMW M3 Competition" --verbose

# Skip images for testing
node scripts/car-pipeline/ai-research-car-verified.js "2024 BMW M3 Competition" --skip-images
```

**What it does:**

1. 🌐 **Web Search** - Searches 10-15 authoritative sources (Car & Driver, Edmunds, OEM)
2. 🔍 **Spec Verification** - Cross-checks HP, torque, 0-60 from multiple sources
3. 📊 **Confidence Tracking** - Marks each spec as `verified`, `cross_referenced`, or `estimated`
4. 📝 **Source Citations** - Records where data came from
5. 🔧 **Related Data** - Populates issues, maintenance, service intervals, tuning profile, variants
6. 🖼️ **Image Generation** - Creates hero image

**Output:**

```
HP:    503 (verified)      ← Confirmed from BMW.com, Edmunds
0-60:  2.8s (cross_referenced)  ← Multiple sources agree
Price: $81,195 (verified)  ← From official MSRP
```

**Time**: ~60-90 seconds per car

---

## 📦 Batch Addition

### `ai-batch-add-cars.js`

Add multiple cars from a file.

```bash
# Create a file with car names (one per line)
echo "2024 Porsche 911 GT3
2024 BMW M3 Competition
2024 Toyota GR Supra" > new-cars.txt

# Add all cars
node scripts/car-pipeline/ai-batch-add-cars.js new-cars.txt
```

---

## 🔧 Utility Scripts

### `enrich-car.js`

Enrich an existing car with external API data (EPA, NHTSA, recalls).

```bash
node scripts/car-pipeline/enrich-car.js porsche-911-gt3 --verbose
```

### `validate-car.js`

Check data completeness for a car.

```bash
node scripts/car-pipeline/validate-car.js porsche-911-gt3
```

### `backfill-missing-issues.js`

Add missing car_issues for existing cars.

```bash
node scripts/car-pipeline/backfill-missing-issues.js
```

---

## Environment Variables

**Required:**

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`

**For Web Verification (Recommended):**

- `EXA_API_KEY`

**For Image Generation:**

- `GOOGLE_AI_API_KEY`
- `BLOB_READ_WRITE_TOKEN`

---

## Data Requirements

See `audit/car-data-requirements-2026-01-31.md` for full details on what data each car needs.
