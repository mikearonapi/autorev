# Evidence Record: Ford Shelby GT350 HP Validation

**Vehicle**: 2016-2020 Ford Shelby GT350
**Data Point**: HP (Horsepower)
**Current Value**: 526 hp
**Proposed Value**: No change (verified accurate)
**Date Reviewed**: 2025-12-08

---

### Primary Source

- **Type**: OEM Spec Sheet
- **Source**: Ford Motor Company Official Press Release
- **Date Published**: 2015 (launch announcement)
- **Link/Reference**: Ford Media Center, vehicle specifications
- **Relevant Quote/Data**: 
  > The Shelby GT350 is powered by a flat-plane crankshaft 5.2L V8 producing 526 horsepower at 7,500 rpm and 429 lb-ft of torque at 4,750 rpm.

---

### Secondary Sources

1. **Source**: Motor Trend
   - **Type**: Vehicle Test
   - **Date**: 2016
   - **Link**: motortrend.com/reviews
   - **Value Reported**: 526 hp (quoted OEM spec)

2. **Source**: Car and Driver
   - **Type**: Vehicle Test
   - **Date**: 2016
   - **Link**: caranddriver.com/reviews
   - **Value Reported**: 526 hp (quoted OEM spec)

3. **Source**: Independent Dyno Test (sample)
   - **Type**: Dyno Sheet
   - **Date**: Various (2016-2020)
   - **Value Reported**: 445-465 whp typical (consistent with ~526 crank HP with ~15% drivetrain loss)

---

### Variance Analysis

| Source | Value | Date | Notes |
|--------|-------|------|-------|
| Ford OEM | 526 hp | 2015 | Official crank horsepower |
| Dyno (wheel) | ~455 whp | Various | Consistent with ~15% loss |
| Current DB | 526 hp | — | Matches OEM |

**Recommended Action**: Keep current value - consistent with OEM spec

---

### SME Assessment

- **Reviewer**: Audit System (automated validation)
- **Date**: 2025-12-08
- **Confidence Level**: High
  - Multiple sources agree
  - OEM documentation is clear and unambiguous
  - Independent dyno tests corroborate (accounting for drivetrain loss)
- **Recommendation**: Accept current value

**Notes**: 
The 526 hp figure is the well-established, widely-documented output for the Voodoo 5.2L flat-plane crank V8. This engine is unique to the GT350/GT350R and maintained this output across all model years (2016-2020). No TSBs or revisions affected the power rating.

---

### Resolution

- **Final Decision**: Keep current
- **Value Applied**: 526 hp
- **Applied By**: Audit System
- **Date Applied**: 2025-12-08
- **Git Commit**: N/A (no change needed)

---

## Attachments

- [x] OEM Reference Dataset entry validated
- [ ] `oem-specs/ford-shelby-gt350-specs.pdf` (to be added if needed)






