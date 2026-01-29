# Audited Vehicles Tracker

> Tracks which vehicles have been manually audited for data accuracy.
> **Goal**: Audit ~100 vehicles (~1/3 of database)
> **Last Updated**: 2026-01-27

## Progress Summary

| Batch             | Vehicles | Status      | Pass   | Issues |
| ----------------- | -------- | ----------- | ------ | ------ |
| Initial (Flagged) | 5        | ✅ Complete | 5      | 0      |
| Batch 1           | 30       | ✅ Complete | 19     | 11     |
| Batch 2           | 30       | ✅ Complete | 21     | 9      |
| Batch 3           | 40       | ✅ Complete | 19     | 21     |
| **TOTAL**         | **105**  | ✅          | **64** | **41** |

**Pass Rate: 61%** (64/105)

---

## Issue Categories Found

| Category               | Count | Severity | Notes                      |
| ---------------------- | ----- | -------- | -------------------------- |
| Missing Strengths      | 21    | Medium   | Data completeness          |
| Platform Compatibility | 17    | High     | Incorrect tuning platforms |
| False Positives        | ~10   | N/A      | Detection rule issues      |

---

## Batch Results

### Initial Audit (Flagged by Script) - ✅ COMPLETE

_Reviewed: 5 vehicles flagged by logic-accuracy-audit.mjs_

| Vehicle                | Slug                                | Result           |
| ---------------------- | ----------------------------------- | ---------------- |
| Subaru BRZ             | `subaru-brz-zc6`                    | ✅ Valid nuance  |
| Honda S2000            | `honda-s2000`                       | ✅ Valid nuance  |
| BMW M3 E36             | `bmw-m3-e36`                        | ✅ Valid nuance  |
| Aston Martin DB9       | `aston-martin-db9-first-generation` | ✅ Valid nuance  |
| Ford Mustang SVT Cobra | `ford-mustang-svt-cobra-sn95`       | ✅ Valid context |

---

### Batch 1 (Porsche, Acura, Alfa, Aston, Audi) - ✅ COMPLETE

| #   | Vehicle                        | Slug                                 | Result | Issue                       |
| --- | ------------------------------ | ------------------------------------ | ------ | --------------------------- |
| 1   | 718 Cayman GT4                 | `718-cayman-gt4`                     | ✅     | (FP: COBB supports Porsche) |
| 2   | 718 Cayman GTS 4.0             | `718-cayman-gts-40`                  | ✅     | (FP: COBB supports Porsche) |
| 3   | 981 Cayman GTS                 | `981-cayman-gts`                     | ✅     | (FP: COBB supports Porsche) |
| 4   | 981 Cayman S                   | `981-cayman-s`                       | ✅     | (FP: COBB supports Porsche) |
| 5   | 987.2 Cayman S                 | `987-2-cayman-s`                     | ✅     | (FP: COBB supports Porsche) |
| 6   | 991.1 Carrera S                | `991-1-carrera-s`                    | ✅     | (FP: COBB supports Porsche) |
| 7   | 997.2 Carrera S                | `997-2-carrera-s`                    | ✅     | (FP: COBB supports Porsche) |
| 8   | Acura Integra Type R           | `acura-integra-type-r-dc2`           | ✅     |                             |
| 9   | Acura Integra Type S           | `acura-integra-type-s-dc5`           | ✅     |                             |
| 10  | Acura NSX NA1                  | `acura-nsx-na1`                      | ✅     |                             |
| 11  | Acura NSX NC1                  | `acura-nsx-nc1`                      | ✅     |                             |
| 12  | Acura RSX Type-S               | `acura-rsx-type-s-dc5`               | ✅     |                             |
| 13  | Acura TL Type-S                | `acura-tl-type-s-ua6`                | ✅     |                             |
| 14  | Acura TSX                      | `acura-tsx-cl9`                      | ✅     |                             |
| 15  | Acura TSX CU2                  | `acura-tsx-cu2`                      | ✅     |                             |
| 16  | Alfa Romeo 4C                  | `alfa-romeo-4c`                      | ✅     |                             |
| 17  | Alfa Romeo Giulia Quadrifoglio | `alfa-romeo-giulia-quadrifoglio`     | ✅     |                             |
| 18  | Aston Martin DB11              | `aston-martin-db11-db11`             | ✅     |                             |
| 19  | Aston Martin DBS Superleggera  | `aston-martin-dbs-superleggera-2018` | ✅     |                             |
| 20  | Aston Martin V12 Vantage       | `aston-martin-v12-vantage-1st-gen`   | ✅     |                             |
| 21  | Aston Martin V8 Vantage        | `aston-martin-v8-vantage`            | ✅     |                             |
| 22  | Aston Martin Vantage           | `aston-martin-vantage-2018-2024`     | ✅     |                             |
| 23  | Audi A3 1.8 TFSI               | `audi-a3-1-8-tfsi-8v`                | ✅     |                             |
| 24  | Audi A4 2.0T B8                | `audi-a4-b8`                         | ⚠️     | Missing strengths           |
| 25  | Audi A4 2.0T B8.5              | `audi-a4-b8-5`                       | ⚠️     | Missing strengths           |
| 26  | Audi R8 V10                    | `audi-r8-v10`                        | ✅     |                             |
| 27  | Audi R8 V8                     | `audi-r8-v8`                         | ✅     |                             |
| 28  | Audi RS3 8V                    | `audi-rs3-8v`                        | ❌     | COBB on Audi (wrong)        |
| 29  | Audi RS3 8Y                    | `audi-rs3-8y`                        | ❌     | COBB on Audi (wrong)        |
| 30  | Audi RS5 B8                    | `audi-rs5-b8`                        | ✅     |                             |

---

### Batch 2 (More Audi, BMW) - ✅ COMPLETE

| #   | Vehicle                | Slug                     | Result | Issue                |
| --- | ---------------------- | ------------------------ | ------ | -------------------- |
| 31  | Audi RS5 B9            | `audi-rs5-b9`            | ✅     |                      |
| 32  | Audi RS6 Avant C8      | `audi-rs6-avant-c8`      | ⚠️     | Missing strengths    |
| 33  | Audi RS7 Sportback     | `audi-rs7-c8`            | ✅     |                      |
| 34  | Audi S4 B5             | `audi-s4-b5`             | ⚠️     | Missing strengths    |
| 35  | Audi S4 B6             | `audi-s4-b6`             | ✅     |                      |
| 36  | Audi S4 B7             | `audi-s4-b7`             | ✅     |                      |
| 37  | Audi S4 B8             | `audi-s4-b8`             | ✅     |                      |
| 38  | Audi S4 B9             | `audi-s4-b9`             | ⚠️     | Missing strengths    |
| 39  | Audi S5 B8             | `audi-s5-b8`             | ✅     |                      |
| 40  | Audi S5 B9             | `audi-s5-b9`             | ✅     |                      |
| 41  | Audi TT RS 8J          | `audi-tt-rs-8j`          | ✅     |                      |
| 42  | Audi TT RS 8S          | `audi-tt-rs-8s`          | ❌     | COBB on Audi (wrong) |
| 43  | BMW 1M Coupe           | `bmw-1m-coupe-e82`       | ✅     |                      |
| 44  | BMW 135i N54           | `bmw-135i-e82`           | ⚠️     | Missing strengths    |
| 45  | BMW 335i E90           | `bmw-335i-e90`           | ✅     |                      |
| 46  | BMW 340i F30           | `bmw-340i-f30`           | ✅     |                      |
| 47  | BMW i4 M50             | `bmw-i4-m50-g26`         | ⚠️     | Missing strengths    |
| 48  | BMW M2 Competition     | `bmw-m2-competition`     | ✅     |                      |
| 49  | BMW M2 G87             | `bmw-m2-g87`             | ✅     |                      |
| 50  | BMW M3 E30             | `bmw-m3-e30`             | ✅     |                      |
| 51  | BMW M3 E46             | `bmw-m3-e46`             | ✅     |                      |
| 52  | BMW M3 E92             | `bmw-m3-e92`             | ✅     |                      |
| 53  | BMW M3 F80             | `bmw-m3-f80`             | ⚠️     | Missing strengths    |
| 54  | BMW M3 G80             | `bmw-m3-g80`             | ⚠️     | Missing strengths    |
| 55  | BMW M340i G20          | `bmw-m340i-g20`          | ✅     |                      |
| 56  | BMW M4 CSL             | `bmw-m4-csl-g82`         | ⚠️     | Missing strengths    |
| 57  | BMW M4 F82             | `bmw-m4-f82`             | ✅     |                      |
| 58  | BMW M5 E39             | `bmw-m5-e39`             | ✅     |                      |
| 59  | BMW M5 E60             | `bmw-m5-e60`             | ✅     |                      |
| 60  | BMW M5 F10 Competition | `bmw-m5-f10-competition` | ✅     |                      |

---

### Batch 3 (Mixed Manufacturers) - ✅ COMPLETE

| #   | Vehicle                      | Slug                              | Result | Issue                                                     |
| --- | ---------------------------- | --------------------------------- | ------ | --------------------------------------------------------- |
| 61  | BMW M5 F90 Competition       | `bmw-m5-f90-competition`          | ✅     |                                                           |
| 62  | BMW Z4 M Coupe               | `bmw-z4m-e85-e86`                 | ✅     |                                                           |
| 63  | Buick Grand National         | `buick-grand-national-g-body`     | ✅     |                                                           |
| 64  | C7 Corvette Grand Sport      | `c7-corvette-grand-sport`         | ✅     | (FP: HP Tuners supports Chevy)                            |
| 65  | C7 Corvette Z06              | `c7-corvette-z06`                 | ✅     | (FP: HP Tuners supports Chevy)                            |
| 66  | C8 Corvette Stingray         | `c8-corvette-stingray`            | ✅     | (FP: HP Tuners supports Chevy)                            |
| 67  | Cadillac ATS-V               | `cadillac-ats-v-first-generation` | ✅     |                                                           |
| 68  | Cadillac CT4-V Blackwing     | `cadillac-ct4-v-blackwing`        | ✅     |                                                           |
| 69  | Cadillac CT5-V Blackwing     | `cadillac-ct5-v-blackwing`        | ✅     |                                                           |
| 70  | Camaro SS 1LE                | `camaro-ss-1le`                   | ✅     | (FP: HP Tuners supports Chevy)                            |
| 71  | Camaro ZL1                   | `camaro-zl1`                      | ✅     | (FP: HP Tuners supports Chevy)                            |
| 72  | Dodge Challenger Hellcat     | `dodge-challenger-hellcat`        | ⚠️     | Missing strengths                                         |
| 73  | Dodge Charger Hellcat        | `dodge-charger-hellcat`           | ⚠️     | Missing strengths                                         |
| 74  | Dodge Viper                  | `dodge-viper`                     | ✅     |                                                           |
| 75  | Ferrari 458 Italia           | `ferrari-458-italia`              | ✅     |                                                           |
| 76  | Ferrari 488 GTB              | `ferrari-488-gtb-2015-2019`       | ✅     |                                                           |
| 77  | Ferrari 812 Superfast        | `ferrari-812-superfast`           | ✅     | (FP: Capristo is exhaust brand)                           |
| 78  | Ford Focus RS                | `ford-focus-rs`                   | ✅     |                                                           |
| 79  | Ford Mustang Boss 302        | `ford-mustang-boss-302`           | ⚠️     | Missing strengths                                         |
| 80  | Honda Civic Type R FK8       | `honda-civic-type-r-fk8`          | ❌     | COBB on Honda (wrong)                                     |
| 81  | Honda Civic Type R FL5       | `honda-civic-type-r-fl5`          | ⚠️     | Missing strengths                                         |
| 82  | Hyundai Veloster N           | `hyundai-veloster-n-js`           | ✅     |                                                           |
| 83  | Infiniti Q50 Red Sport 400   | `infiniti-q50-red-sport-400`      | ⚠️     | Missing strengths + (FP: EcuTek supports Infiniti/Nissan) |
| 84  | Lamborghini Huracán LP 610-4 | `lamborghini-huracan-lp610-4`     | ❌     | COBB/Unitronic wrong + Missing strengths                  |
| 85  | Lexus IS-F                   | `lexus-is-f-use20`                | ✅     | (FP: EcuTek supports Lexus/Toyota)                        |
| 86  | Lexus LC 500                 | `lexus-lc-500`                    | ✅     | (FP: EcuTek supports Lexus/Toyota)                        |
| 87  | McLaren 720S                 | `mclaren-720s`                    | ✅     |                                                           |
| 88  | Mercedes-AMG C63 W205        | `mercedes-amg-c63-w205`           | ⚠️     | Missing strengths                                         |
| 89  | Mercedes-AMG GT              | `mercedes-amg-gt`                 | ⚠️     | Missing strengths                                         |
| 90  | Mitsubishi Lancer Evo X      | `mitsubishi-lancer-evo-x`         | ✅     |                                                           |
| 91  | Nissan GT-R                  | `nissan-gt-r`                     | ✅     |                                                           |
| 92  | Nissan Z                     | `nissan-z-rz34`                   | ✅     |                                                           |
| 93  | Porsche 911 GT3 992          | `porsche-911-gt3-992`             | ✅     |                                                           |
| 94  | Shelby GT350                 | `shelby-gt350`                    | ⚠️     | Missing strengths + (FP: Ford platforms)                  |
| 95  | Shelby GT500                 | `shelby-gt500`                    | ✅     | (FP: Ford platforms)                                      |
| 96  | Subaru WRX STI VA            | `subaru-wrx-sti-va`               | ✅     |                                                           |
| 97  | Toyota GR Supra              | `toyota-gr-supra`                 | ✅     |                                                           |
| 98  | Toyota GR86                  | `toyota-gr86`                     | ✅     | (FP: COBB supports GR86/BRZ)                              |
| 99  | Volkswagen Golf R Mk7        | `volkswagen-golf-r-mk7`           | ✅     |                                                           |
| 100 | Volkswagen GTI Mk7           | `volkswagen-gti-mk7`              | ⚠️     | Missing strengths                                         |

---

## Issues Summary

### ❌ PLATFORM ISSUES (Need Fix)

| Vehicle                | Issue                   | Fix Required |
| ---------------------- | ----------------------- | ------------ |
| Audi RS3 8V            | COBB listed             | Remove COBB  |
| Audi RS3 8Y            | COBB listed             | Remove COBB  |
| Audi TT RS 8S          | COBB listed             | Remove COBB  |
| Honda Civic Type R FK8 | COBB listed             | Remove COBB  |
| Lamborghini Huracán    | COBB + Unitronic listed | Remove both  |

### ⚠️ MISSING STRENGTHS (Enhancement Needed)

| Vehicle                      | Slug                          |
| ---------------------------- | ----------------------------- |
| Audi A4 2.0T B8              | `audi-a4-b8`                  |
| Audi A4 2.0T B8.5            | `audi-a4-b8-5`                |
| Audi RS6 Avant C8            | `audi-rs6-avant-c8`           |
| Audi S4 B5                   | `audi-s4-b5`                  |
| Audi S4 B9                   | `audi-s4-b9`                  |
| BMW 135i N54                 | `bmw-135i-e82`                |
| BMW i4 M50                   | `bmw-i4-m50-g26`              |
| BMW M3 F80                   | `bmw-m3-f80`                  |
| BMW M3 G80                   | `bmw-m3-g80`                  |
| BMW M4 CSL                   | `bmw-m4-csl-g82`              |
| Dodge Challenger Hellcat     | `dodge-challenger-hellcat`    |
| Dodge Charger Hellcat        | `dodge-charger-hellcat`       |
| Ford Mustang Boss 302        | `ford-mustang-boss-302`       |
| Honda Civic Type R FL5       | `honda-civic-type-r-fl5`      |
| Infiniti Q50 Red Sport 400   | `infiniti-q50-red-sport-400`  |
| Lamborghini Huracán LP 610-4 | `lamborghini-huracan-lp610-4` |
| Mercedes-AMG C63 W205        | `mercedes-amg-c63-w205`       |
| Mercedes-AMG GT              | `mercedes-amg-gt`             |
| Shelby GT350                 | `shelby-gt350`                |
| Volkswagen GTI Mk7           | `volkswagen-gti-mk7`          |

---

## Legend

- ✅ Pass - No issues found
- ⚠️ Warning - Missing data (enhancement needed)
- ❌ Fail - Incorrect data (fix required)
- (FP: ...) - False Positive from detection rules

---

## Related Files

- [ISSUES_TRACKER.md](./ISSUES_TRACKER.md) - Detailed issue tracking
- [ENHANCEMENTS_TRACKER.md](./ENHANCEMENTS_TRACKER.md) - Content improvements
- [LOGIC_AUDIT_SUMMARY.md](./LOGIC_AUDIT_SUMMARY.md) - Summary report
