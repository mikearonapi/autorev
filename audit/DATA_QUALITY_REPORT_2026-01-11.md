# Vehicle Database Quality Report
## Date: 2026-01-11

## CSV Export Created

**File:** `audit/vehicle_full_export_2026-01-11.csv`

- **310 vehicles** with **62 columns** each
- Open in Excel/Google Sheets for manual review

---

## Data Quality Summary

### Cars Table - Missing Fields

| Field | Missing | % of 310 |
|-------|---------|----------|
| `layout` | 310 | 100% |
| `msrp_new_low` | 97 | 31% |
| `daily_usability_tag` | 87 | 28% |
| `seats` | 73 | 24% |
| `generation_code` | 2 | 1% |
| `curb_weight` | 0 | 0% |
| `zero_to_sixty` | 0 | 0% |
| `price_avg` | 0 | 0% |
| `trans` | 0 | 0% |
| `torque` | 0 | 0% |
| `drivetrain` | 0 | 0% |
| `hp` | 0 | 0% |

### Tuning Profiles - Data Quality Tier

| Tier | Count | % of 310 | Description |
|------|-------|----------|-------------|
| `skeleton` | 132 | 43% | ❌ Minimal/no data |
| `templated` | 71 | 23% | ⚠️ Generic template |
| `researched` | 55 | 18% | ✅ Some research |
| `enriched` | 52 | 17% | ✅ AI enriched |

### Tuning Profiles - Missing Data

| Issue | Count | % of 310 |
|-------|-------|----------|
| Missing `engine_family` | 275 | 89% |
| Missing `stock_whp` | 275 | 89% |
| Empty `upgrades_by_objective` | 189 | 61% |
| Empty `platform_insights` | 132 | 43% |

---

## Key Findings

### ✅ What's Complete (Core Data)
- HP, torque, drivetrain, transmission for all 310 vehicles
- Curb weight, 0-60, price average filled
- 99% have generation codes

### ⚠️ What Needs Work (Cars Table)
1. **Layout field** - Missing for ALL vehicles (FR/MR/RR layout)
2. **MSRP data** - 31% missing new price info
3. **Daily usability tags** - 28% missing
4. **Seats** - 24% missing (easy fix)

### ❌ What's Critical (Tuning Profiles)
1. **89% of vehicles** lack proper engine family data
2. **89% of vehicles** lack stock WHP numbers
3. **61% of vehicles** have empty upgrade recommendations
4. Only **35 vehicles** (11%) have real tuning data

---

## CSV Columns Guide

The export includes these columns for each vehicle:

### Identification
- `id` - UUID (database ID)
- `slug` - URL slug (unique identifier)
- `name` - Display name
- `brand` - Manufacturer
- `years` - Production years
- `generation_code` - Model generation

### Core Specs
- `engine` - Engine description
- `hp` - Horsepower (crank)
- `torque` - Torque (lb-ft)
- `trans` - Transmission type
- `drivetrain` - FWD/RWD/AWD
- `curb_weight` - Weight in lbs
- `seats` - Number of seats
- `manual_available` - Manual trans option

### Performance Numbers
- `zero_to_sixty` - 0-60 mph time
- `quarter_mile` - 1/4 mile time
- `top_speed` - Top speed mph
- `braking_60_0` - 60-0 braking distance
- `lateral_g` - Lateral G-force

### Content Status (Y/N flags)
- `has_tagline` - Has tagline text
- `has_highlight` - Has highlight text
- `has_hero_blurb` - Has hero section blurb
- `has_essence` - Has essence description
- `has_heritage` - Has heritage info
- `has_engine_character` - Has engine description
- `has_buyers_summary` - Has buyers guide
- `has_hero_image` - Has hero image

### Array Counts
- `pros_count` - Number of pros listed
- `cons_count` - Number of cons listed
- `common_issues_count` - Number of issues
- `competitors_count` - Number of competitors

### Tuning Profile Data
- `tuning_engine_family` - Engine platform name
- `tuning_stock_whp` - Stock wheel horsepower
- `tuning_stock_wtq` - Stock wheel torque
- `tuning_data_quality` - skeleton/templated/enriched/researched
- `tuning_verified` - Manually verified flag
- `tuning_stages_count` - Number of tune stages

### Validation Columns
- `expected_whp` - Calculated expected WHP (HP * 0.85)
- `whp_diff` - Difference between actual and expected WHP

---

## How to Use the CSV

### In Excel/Google Sheets:

1. **Filter by brand** - See all Audi vehicles together
2. **Sort by `tuning_data_quality`** - Find `skeleton` profiles to fix
3. **Filter `seats = blank`** - Find vehicles missing seat count
4. **Filter `whp_diff > 50`** - Find potential data contamination
5. **Filter `has_* = N`** - Find missing content

### Quick Checks:

```
=COUNTIF(R:R,"N")  // Count missing hero images
=COUNTIF(BH:BH,"skeleton")  // Count skeleton profiles
=COUNTBLANK(R:R)  // Count blank cells in column R
```

---

## Next Steps

1. **Review the CSV** - Open and check vehicles you know well
2. **Flag issues** - Mark rows that need correction
3. **Prioritize by user activity** - Fix vehicles in user garages first
4. **Build engine templates** - Create templates for common platforms
5. **Run periodic audits** - Use `scripts/audit-vehicle-data.mjs`

---

## Files Created

| File | Purpose |
|------|---------|
| `audit/vehicle_full_export_2026-01-11.csv` | Full data export |
| `audit/DATA_QUALITY_REPORT_2026-01-11.md` | This summary |
| `audit/FULL_DATABASE_AUDIT_2026-01-11.md` | Contamination analysis |
| `scripts/audit-vehicle-data.mjs` | Automated audit script |
