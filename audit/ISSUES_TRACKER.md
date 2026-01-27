# Vehicle Data Issues Tracker

> Last audit: 2026-01-27
> Source: Batch audit of 105 vehicles + `node scripts/logic-accuracy-audit.mjs`

## Summary

| Severity      | Count | Status                      |
| ------------- | ----- | --------------------------- |
| 🔴 Critical   | 5     | ⚠️ Needs Fix                |
| 🟡 Warning    | 5     | 📋 Reviewed (Valid nuances) |
| 📝 Incomplete | 20    | 📋 Enhancement needed       |

---

## Critical Issues (Must Fix)

### Incompatible Tuning Platforms

These vehicles have tuning platforms listed that do NOT support their make:

| #   | Vehicle                      | Slug                          | Wrong Platform   | Fix         |
| --- | ---------------------------- | ----------------------------- | ---------------- | ----------- |
| 1   | Audi RS3 8V                  | `audi-rs3-8v`                 | COBB Tuning      | Remove COBB |
| 2   | Audi RS3 8Y                  | `audi-rs3-8y`                 | COBB Accessport  | Remove COBB |
| 3   | Audi TT RS 8S                | `audi-tt-rs-8s`               | COBB Accessport  | Remove COBB |
| 4   | Honda Civic Type R FK8       | `honda-civic-type-r-fk8`      | COBB Accessport  | Remove COBB |
| 5   | Lamborghini Huracán LP 610-4 | `lamborghini-huracan-lp610-4` | COBB + Unitronic | Remove both |

**Why these are wrong:**

- COBB does NOT support Audi (they support VW but not Audi)
- COBB does NOT support Honda (Hondata/KTuner are Honda tuners)
- COBB and Unitronic do NOT support Lamborghini

---

## Warnings (Review Required)

These items were flagged by the audit but require human review to determine if they need fixes or are valid nuanced content.

### Self-Contradiction Warnings

| #   | Vehicle          | Slug                                | Topic       | Status      | Verdict      |
| --- | ---------------- | ----------------------------------- | ----------- | ----------- | ------------ |
| 1   | Subaru BRZ       | `subaru-brz-zc6`                    | reliability | 🟢 Reviewed | Valid nuance |
| 2   | Honda S2000      | `honda-s2000`                       | reliability | 🟢 Reviewed | Valid nuance |
| 3   | BMW M3 E36       | `bmw-m3-e36`                        | reliability | 🟢 Reviewed | Valid nuance |
| 4   | Aston Martin DB9 | `aston-martin-db9-first-generation` | reliability | 🟢 Reviewed | Valid nuance |

#### Details

##### 1. Subaru BRZ (`subaru-brz-zc6`)

- **Strength**: "Strong Toyota D4S direct injection system with proven reliability"
- **Weakness**: "Valve spring recall issues on early 2013-2014 models"
- **Analysis**: Engine is reliable overall; weakness refers to a specific early-model recall
- **Decision**: ✅ No fix needed - accurate nuanced information
- [ ] Consider adding clarification: "(recall addressed under warranty)"

##### 2. Honda S2000 (`honda-s2000`)

- **Strengths**: Focus on engine performance, chassis balance, transmission robustness
- **Weaknesses**: "Stretched timing chains on high-mileage F20C", "Rear main seal leaks common on older examples"
- **Analysis**: Weaknesses are high-mileage wear items, not contradicting overall reliability
- **Decision**: ✅ No fix needed - accurate ownership reality
- [ ] Consider specifying mileage thresholds (e.g., "100k+ miles")

##### 3. BMW M3 E36 (`bmw-m3-e36`)

- **Strength**: "S50B32 engine is bulletproof with forged internals from factory"
- **Weaknesses**: VANOS issues, cooling system failures, subframe cracks
- **Analysis**: ENGINE is reliable; other BMW components have known maintenance needs
- **Decision**: ✅ No fix needed - this is accurate E36 M3 ownership reality
- [ ] Consider clarifying: "Engine is bulletproof; other systems require typical BMW maintenance"

##### 4. Aston Martin DB9 (`aston-martin-db9-first-generation`)

- **Strengths**: ZF transmission robust, V12 sound, chassis balance
- **Weaknesses**: Electrical gremlins, cooling system failure points, expensive maintenance
- **Analysis**: Drivetrain is solid; electronics and ancillaries need attention (typical exotic GT)
- **Decision**: ✅ No fix needed - accurate for exotic ownership
- **Note**: Data has "reliability" keyword in both strengths and weaknesses arrays - cosmetic issue only

---

### Aspiration Logic Warnings

| #   | Vehicle                | Slug                          | Engine            | Issue         | Status      | Verdict       |
| --- | ---------------------- | ----------------------------- | ----------------- | ------------- | ----------- | ------------- |
| 5   | Ford Mustang SVT Cobra | `ford-mustang-svt-cobra-sn95` | 4.6L DOHC V8 (NA) | Boost mention | 🟢 Reviewed | Valid content |

#### Details

##### 5. Ford Mustang SVT Cobra (`ford-mustang-svt-cobra-sn95`)

- **Flagged Content**: "Iron-sleeved aluminum block handles boost well for forced induction builds"
- **Analysis**: Context explicitly says "for forced induction builds" - this is appropriate guidance since many SN95 Cobra owners add superchargers/turbos
- **Decision**: ✅ No fix needed - valid future-build guidance
- [ ] Consider adding: "Popular supercharger options include Kenne Bell, Vortech, and Paxton"

---

## Resolved Issues

_Move items here after fixing_

| Date | Vehicle | Issue | Resolution |
| ---- | ------- | ----- | ---------- |
| -    | -       | -     | -          |

---

## How to Re-Run Audit

```bash
cd "/Volumes/10TB External HD/01. Apps - WORKING/AutoRev"
node scripts/logic-accuracy-audit.mjs
```

## Related Files

- Full audit JSON: `audit/logic-accuracy-audit-2026-01-27.json`
- Enhancement tracker: `audit/ENHANCEMENTS_TRACKER.md`
- Audit prompt: `docs/AUDIT_PROMPT.md`
