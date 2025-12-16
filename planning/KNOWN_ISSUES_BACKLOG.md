# Known Issues Documentation Backlog

> Tracking document for ongoing `car_issues` population
>
> **Last Updated:** December 14, 2024

---

## Coverage Summary

| Metric | Before | Current | Target |
|--------|--------|---------|--------|
| **Cars with Issues** | 34 (35%) | ~60 (61%) | 98 (100%) |
| **Cars without Issues** | 64 | ~38 | 0 |
| **Total Issues** | 89 | **154** | ~400+ |

> **Note:** Current counts verified via MCP Supabase query on 2024-12-14.

---

## Priority Tiers

Issues prioritized by reliability score:
- **P0** (reliability < 5.0): ✅ COMPLETED - High-risk exotics
- **P1** (5.0-6.5): 5 cars - German performance, Subaru
- **P2** (6.5-7.5): 19 cars - Most European sports cars  
- **P3** (7.5+): 34 cars - Japanese reliability champions

---

## P0 - COMPLETED ✅

All 6 P0 cars now have 5-6 documented issues each.

| Car | Reliability | Issues | Critical | High | Medium | Low |
|-----|------------|--------|----------|------|--------|-----|
| Maserati GranTurismo | 2.0 | 6 | 1 | 2 | 3 | 0 |
| Aston Martin V8 Vantage | 3.5 | 6 | 1 | 2 | 3 | 0 |
| Jaguar F-Type R | 4.0 | 5 | 0 | 2 | 2 | 1 |
| Jaguar F-Type V6 S | 4.3 | 5 | 0 | 1 | 2 | 2 |
| Nissan 300ZX Twin Turbo | 5.4 | 6 | 1 | 1 | 3 | 1 |
| Alfa Romeo 4C | 5.5 | 5 | 0 | 1 | 3 | 1 |

---

## P1 - Pending (5 cars)

| Slug | Name | Reliability | Priority |
|------|------|-------------|----------|
| `bmw-z4m-e85-e86` | BMW Z4 M Coupe/Roadster | 5.6 | High |
| `bmw-m5-e39` | BMW M5 E39 | 6.0 | High |
| `tesla-model-3-performance` | Tesla Model 3 Performance | 6.0 | High |
| `mercedes-amg-e63-w212` | Mercedes-AMG E63 W212 | 6.0 | High |
| `subaru-wrx-sti-gr-gv` | Subaru WRX STI GR/GV | 6.4 | High |

### Research Sources for P1:
- **BMW Z4 M**: BimmerPost Z4M forums, Rod bearing discussions
- **BMW M5 E39**: VANOS issues, timing chain guides
- **Tesla Model 3**: /r/TeslaModel3, MCU failures, suspension issues
- **Mercedes E63 W212**: M156/M157 issues, head bolt concerns
- **Subaru STI GR/GV**: Ringland failure, transmission issues

---

## P2 - Pending (19 cars)

| Slug | Name | Reliability |
|------|------|-------------|
| `mercedes-amg-c63-w205` | Mercedes-AMG C63 W205 | 6.5 |
| `bmw-m4-f82` | BMW M4 F82 | 6.5 |
| `subaru-wrx-sti-gd` | Subaru Impreza WRX STI GD | 6.5 |
| `mitsubishi-lancer-evo-x` | Mitsubishi Lancer Evolution X | 6.9 |
| `dodge-challenger-hellcat` | Dodge Challenger Hellcat | 7.0 |
| `dodge-charger-hellcat` | Dodge Charger Hellcat | 7.0 |
| `mercedes-amg-e63s-w213` | Mercedes-AMG E63 S W213 | 7.1 |
| `lotus-exige-s` | Lotus Exige S | 7.1 |
| `lotus-elise-s2` | Lotus Elise S2 | 7.1 |
| `audi-tt-rs-8j` | Audi TT RS 8J | 7.2 |
| `audi-rs3-8v` | Audi RS3 8V | 7.2 |
| `volkswagen-golf-r-mk7` | Volkswagen Golf R Mk7 | 7.2 |
| `audi-rs5-b8` | Audi RS5 B8 | 7.2 |
| `volkswagen-golf-r-mk8` | Volkswagen Golf R Mk8 | 7.2 |
| `cadillac-cts-v-gen3` | Cadillac CTS-V Gen 3 | 7.3 |
| `cadillac-cts-v-gen2` | Cadillac CTS-V Gen 2 | 7.3 |
| `bmw-m5-f10-competition` | BMW M5 F10 Competition | 7.4 |
| `bmw-m5-f90-competition` | BMW M5 F90 Competition | 7.4 |

---

## P3 - Pending (34 cars)

Lower priority due to higher reliability scores.

| Slug | Name | Reliability |
|------|------|-------------|
| `lotus-evora-s` | Lotus Evora S | 7.6 |
| `volkswagen-gti-mk7` | Volkswagen GTI Mk7 | 7.7 |
| `mercedes-amg-gt` | Mercedes-AMG GT | 7.7 |
| `dodge-challenger-srt-392` | Dodge Challenger SRT 392 | 7.8 |
| `dodge-charger-srt-392` | Dodge Charger SRT 392 | 7.8 |
| `audi-rs3-8y` | Audi RS3 8Y | 7.8 |
| `audi-tt-rs-8s` | Audi TT RS 8S | 7.8 |
| `camaro-ss-1le` | Camaro SS 1LE | 8.0 |
| `camaro-zl1` | Camaro ZL1 | 8.0 |
| `c7-corvette-grand-sport` | C7 Corvette Grand Sport | 8.0 |
| `mustang-gt-pp2` | Mustang GT PP2 | 8.1 |
| `ford-mustang-boss-302` | Ford Mustang Boss 302 | 8.1 |
| `nissan-z-rz34` | Nissan Z | 8.1 |
| `toyota-gr-supra` | Toyota GR Supra | 8.2 |
| `mazda-mx5-miata-na` | Mazda MX-5 Miata NA | 8.2 |
| `mazda-mx5-miata-nb` | Mazda MX-5 Miata NB | 8.2 |
| `mazda-mx5-miata-nc` | Mazda MX-5 Miata NC | 8.2 |
| `nissan-350z` | Nissan 350Z | 8.2 |
| `porsche-911-gt3-996` | Porsche 911 GT3 996 | 8.4 |
| `porsche-911-turbo-997-1` | Porsche 911 Turbo 997.1 | 8.4 |
| `toyota-gr86` | Toyota GR86 | 8.4 |
| `subaru-brz-zd8` | Subaru BRZ (2nd Gen) | 8.4 |
| `toyota-86-scion-frs` | Toyota 86 / Scion FR-S | 8.9 |
| `nissan-370z-nismo` | Nissan 370Z NISMO | 8.9 |
| `subaru-brz-zc6` | Subaru BRZ | 8.9 |
| `mazda-mx5-miata-nd` | Mazda MX-5 Miata ND | 9.0 |
| `chevrolet-corvette-c5-z06` | Chevrolet Corvette C5 Z06 | 9.0 |
| `chevrolet-corvette-c6-grand-sport` | Chevrolet Corvette C6 Grand Sport | 9.0 |
| `987-2-cayman-s` | 987.2 Cayman S | 9.1 |
| `981-cayman-s` | 981 Cayman S | 9.2 |
| `honda-s2000` | Honda S2000 | 9.4 |
| `honda-civic-type-r-fk8` | Honda Civic Type R FK8 | 9.5 |
| `honda-civic-type-r-fl5` | Honda Civic Type R FL5 | 9.6 |
| `lexus-rc-f` | Lexus RC F | 9.9 |
| `lexus-lc-500` | Lexus LC 500 | 10.0 |

---

## Issue Template

```sql
INSERT INTO car_issues (
  id, car_id, car_slug, kind, severity, title, description, symptoms, prevention, 
  fix_description, affected_years_text, affected_year_start, affected_year_end,
  estimated_cost_text, estimated_cost_low, estimated_cost_high, source_type, source_url, 
  confidence, sort_order, metadata
) VALUES (
  gen_random_uuid(),
  '<car_uuid>',           -- Get from: SELECT id FROM cars WHERE slug = 'xxx'
  '<car_slug>',           
  'common_issue',         -- common_issue | recall | tsb | other
  'medium',               -- critical | high | medium | low | cosmetic
  '<Issue Title>',
  '<Detailed description of the issue, what causes it, and why it matters>',
  ARRAY['Symptom 1', 'Symptom 2', 'Symptom 3'],
  '<How to prevent or minimize this issue>',
  '<How to fix the issue once it occurs>',
  '<YYYY-YYYY>',          -- affected_years_text
  YYYY,                   -- affected_year_start (integer)
  YYYY,                   -- affected_year_end (integer)
  '$X,XXX-$X,XXX',        -- estimated_cost_text
  XXXX,                   -- estimated_cost_low (integer, no decimals)
  XXXX,                   -- estimated_cost_high (integer, no decimals)
  'forum',                -- forum | recall | tsb | nhtsa | manufacturer
  'https://...',          -- source_url
  0.85,                   -- confidence (0.0-1.0)
  1,                      -- sort_order (1 = most important)
  '{"diy_difficulty": "intermediate", "common_mileage_range": "50000-100000"}'::jsonb
);
```

### Severity Guidelines

| Severity | When to Use |
|----------|-------------|
| **critical** | Safety risk, engine/trans failure, immediate attention needed |
| **high** | Major repair, significant cost ($3K+), affects driveability |
| **medium** | Moderate repair, affects comfort/convenience, $1K-$3K |
| **low** | Minor issue, under $1K, doesn't affect driveability |
| **cosmetic** | Appearance only, no functional impact |

### Kind Values

| Kind | When to Use |
|------|-------------|
| `common_issue` | Known common failure, documented in forums |
| `recall` | Official manufacturer recall, NHTSA campaign |
| `tsb` | Technical Service Bulletin from manufacturer |
| `other` | Miscellaneous issues |

---

## Data Sources

1. **CarComplaints.com** - searchable by make/model
2. **NHTSA complaints database** - official safety issues
3. **Reddit/forums** - r/BMW, r/Porsche, model-specific forums
4. **YouTube owner reviews** - common complaint patterns
5. **RepairPal** - reliability data

---

## Notes

- Even high-reliability cars (9.0+) should have at least 2-3 common issues documented
- Focus on REAL issues, not minor annoyances
- Include source URLs for verification
- Severity distribution should be realistic (not all Critical)
- Prefer issues that AL can use to help buyers make informed decisions

