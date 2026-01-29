# Vehicle Data Enhancements Tracker

> Last audit: 2026-01-27
> Source: Batch audit of 105 vehicles + `node scripts/logic-accuracy-audit.mjs`

## Summary

| Category                           | Count | Priority |
| ---------------------------------- | ----- | -------- |
| Missing Strengths Data             | 20    | High     |
| Missing Boost Content (Turbo Cars) | 9     | Medium   |

---

## Enhancement: Add Missing Strengths Data

These vehicles have tuning profiles but are missing `platform_insights.strengths`:

### High Priority (Popular Vehicles)

| #   | Vehicle                  | Slug                       | Status     |
| --- | ------------------------ | -------------------------- | ---------- |
| 1   | BMW M3 F80               | `bmw-m3-f80`               | ⬜ Pending |
| 2   | BMW M3 G80               | `bmw-m3-g80`               | ⬜ Pending |
| 3   | BMW 135i N54             | `bmw-135i-e82`             | ⬜ Pending |
| 4   | Dodge Challenger Hellcat | `dodge-challenger-hellcat` | ⬜ Pending |
| 5   | Dodge Charger Hellcat    | `dodge-charger-hellcat`    | ⬜ Pending |
| 6   | Mercedes-AMG C63 W205    | `mercedes-amg-c63-w205`    | ⬜ Pending |
| 7   | Volkswagen GTI Mk7       | `volkswagen-gti-mk7`       | ⬜ Pending |

### Medium Priority

| #   | Vehicle                      | Slug                          | Status     |
| --- | ---------------------------- | ----------------------------- | ---------- |
| 8   | Audi A4 2.0T B8              | `audi-a4-b8`                  | ⬜ Pending |
| 9   | Audi A4 2.0T B8.5            | `audi-a4-b8-5`                | ⬜ Pending |
| 10  | Audi RS6 Avant C8            | `audi-rs6-avant-c8`           | ⬜ Pending |
| 11  | Audi S4 B5                   | `audi-s4-b5`                  | ⬜ Pending |
| 12  | Audi S4 B9                   | `audi-s4-b9`                  | ⬜ Pending |
| 13  | BMW i4 M50                   | `bmw-i4-m50-g26`              | ⬜ Pending |
| 14  | BMW M4 CSL                   | `bmw-m4-csl-g82`              | ⬜ Pending |
| 15  | Ford Mustang Boss 302        | `ford-mustang-boss-302`       | ⬜ Pending |
| 16  | Honda Civic Type R FL5       | `honda-civic-type-r-fl5`      | ⬜ Pending |
| 17  | Infiniti Q50 Red Sport 400   | `infiniti-q50-red-sport-400`  | ⬜ Pending |
| 18  | Lamborghini Huracán LP 610-4 | `lamborghini-huracan-lp610-4` | ⬜ Pending |
| 19  | Mercedes-AMG GT              | `mercedes-amg-gt`             | ⬜ Pending |
| 20  | Shelby GT350                 | `shelby-gt350`                | ⬜ Pending |

---

## Enhancement: Add Boost-Related Tuning Content

These turbocharged vehicles are missing boost-related tuning guidance. Adding this content would improve the tuning profiles.

### What to Add

For turbo cars, consider adding content about:

- Safe boost levels (stock vs Stage 1 vs Stage 2)
- Intercooler upgrade benefits
- Downpipe/exhaust impact on spool
- Fuel system requirements at higher boost
- Monitoring (boost gauge, AFR, knock)

---

### Vehicles Needing Boost Content

| #   | Vehicle                 | Slug                               | Engine                       | Status     |
| --- | ----------------------- | ---------------------------------- | ---------------------------- | ---------- |
| 1   | Toyota Tundra TRD Pro   | `toyota-tundra-trd-pro-xk70`       | 3.4L Twin-Turbo V6 Hybrid    | ⬜ Pending |
| 2   | Lexus GX 550            | `lexus-gx-550-j460`                | 3.4L Twin-Turbo V6           | ⬜ Pending |
| 3   | Toyota Sequoia TRD Pro  | `toyota-sequoia-trd-pro-xk80`      | 3.4L Twin-Turbo V6 Hybrid    | ⬜ Pending |
| 4   | Ford F-150              | `ford-f150-thirteenth`             | 3.5L Twin-Turbo V6 EcoBoost  | ⬜ Pending |
| 5   | Subaru Forester XT      | `subaru-forester-xt-sg`            | 2.5L Turbocharged H4         | ⬜ Pending |
| 6   | Subaru Legacy GT Spec.B | `subaru-legacy-gt-spec-b-bl`       | 2.5L Turbocharged H4         | ⬜ Pending |
| 7   | Toyota Tundra (3rd Gen) | `toyota-tundra-3rd-gen`            | 3.5L Twin-Turbo V6 Hybrid    | ⬜ Pending |
| 8   | Chevrolet Colorado ZR2  | `chevrolet-colorado-zr2-2017-2024` | 3.6L V6 or 2.8L Turbo-Diesel | ⬜ Pending |
| 9   | Kia Stinger GT          | `kia-stinger-gt-ck`                | 3.3L Twin-Turbo V6           | ⬜ Pending |

---

### Enhancement Details

#### 1. Toyota Tundra TRD Pro (`toyota-tundra-trd-pro-xk70`)

- **Engine**: 3.4L Twin-Turbo V6 Hybrid (i-FORCE MAX)
- **Suggested Content**:
  - [ ] Stock boost levels and safe limits
  - [ ] Hybrid system considerations for tuning
  - [ ] Available tuning platforms (if any)
  - [ ] Exhaust considerations for twin-turbo setup

#### 2. Lexus GX 550 (`lexus-gx-550-j460`)

- **Engine**: 3.4L Twin-Turbo V6
- **Suggested Content**:
  - [ ] Stock boost levels and safe limits
  - [ ] Luxury SUV tuning considerations
  - [ ] Available tuning platforms
  - [ ] Intercooler upgrade options

#### 3. Toyota Sequoia TRD Pro (`toyota-sequoia-trd-pro-xk80`)

- **Engine**: 3.4L Twin-Turbo V6 Hybrid
- **Suggested Content**:
  - [ ] Stock boost levels and safe limits
  - [ ] Hybrid system tuning limitations
  - [ ] Heavy vehicle boost considerations

#### 4. Ford F-150 (`ford-f150-thirteenth`)

- **Engine**: 3.5L Twin-Turbo V6 EcoBoost
- **Priority**: HIGH - Popular tuning platform
- **Suggested Content**:
  - [ ] Stock boost (~14-16 psi) vs tuned levels
  - [ ] Intercooler upgrade importance (heat soak)
  - [ ] Downpipe options and gains
  - [ ] Livernois, SCT, HP Tuners support
  - [ ] E85 tuning potential

#### 5. Subaru Forester XT (`subaru-forester-xt-sg`)

- **Engine**: 2.5L Turbocharged H4 (EJ255)
- **Priority**: HIGH - Established tuning platform
- **Suggested Content**:
  - [ ] Stock boost levels (~14.7 psi)
  - [ ] Safe Stage 1/2 boost targets
  - [ ] TMIC vs FMIC considerations
  - [ ] Accessport/EcuTek tuning
  - [ ] Ringland failure prevention

#### 6. Subaru Legacy GT Spec.B (`subaru-legacy-gt-spec-b-bl`)

- **Engine**: 2.5L Turbocharged H4 (EJ255)
- **Priority**: HIGH - Shares platform with Forester XT
- **Suggested Content**:
  - [ ] Stock boost levels
  - [ ] 6-speed manual specific considerations
  - [ ] Accessport/EcuTek tuning
  - [ ] Intercooler upgrade paths

#### 7. Toyota Tundra 3rd Gen (`toyota-tundra-3rd-gen`)

- **Engine**: 3.5L Twin-Turbo V6 Hybrid
- **Suggested Content**:
  - [ ] (Same as TRD Pro - may consolidate)

#### 8. Chevrolet Colorado ZR2 (`chevrolet-colorado-zr2-2017-2024`)

- **Engine**: 3.6L V6 or 2.8L Turbo-Diesel (LWN Duramax)
- **Note**: Diesel variant needs boost content; gas V6 is NA
- **Suggested Content**:
  - [ ] Diesel-specific boost/tune info
  - [ ] EFI Live/HP Tuners diesel tuning
  - [ ] DPF delete considerations (off-road only)

#### 9. Kia Stinger GT (`kia-stinger-gt-ck`)

- **Engine**: 3.3L Twin-Turbo V6 (Lambda II)
- **Priority**: HIGH - Active tuning community
- **Suggested Content**:
  - [ ] Stock boost (~11-13 psi)
  - [ ] Stage 1 targets (~18-20 psi)
  - [ ] JB4, Lap3, burger tuning options
  - [ ] Intercooler importance (twin-turbo heat)
  - [ ] Downpipe gains

---

## Completed Enhancements

_Move items here after content is added_

| Date | Vehicle | Content Added | Verified By |
| ---- | ------- | ------------- | ----------- |
| -    | -       | -             | -           |

---

## How to Add Content

1. Query the vehicle's tuning profile:

```javascript
const { data: car } = await supabase.from('cars').select('id').eq('slug', 'SLUG_HERE').single();

const { data: profile } = await supabase
  .from('car_tuning_profiles')
  .select('platform_insights')
  .eq('car_id', car.id)
  .single();
```

2. Update `platform_insights.community_tips` with boost-related guidance

3. Re-run audit to verify:

```bash
node scripts/logic-accuracy-audit.mjs
```

---

## Related Files

- Issues tracker: `audit/ISSUES_TRACKER.md`
- Full audit JSON: `audit/logic-accuracy-audit-2026-01-27.json`
- Audit prompt: `docs/AUDIT_PROMPT.md`
