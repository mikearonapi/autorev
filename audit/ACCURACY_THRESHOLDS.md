# Accuracy Thresholds & Decision Rules
## SuperNatural Motorsports - OEM-Spec Audit

> **Created:** December 8, 2024  
> **Purpose:** Define quantitative accuracy targets and dispute resolution rules  
> **Standard:** OEM Specifications as primary authority

---

## 1. Accuracy Targets by Domain

### 1.1 Car Selector Domain

| Data Category | Target Accuracy | Acceptable Variance | Measurement |
|---------------|-----------------|---------------------|-------------|
| **Horsepower (HP)** | ≥99% | ±5 HP or ±1% | vs OEM spec sheet |
| **Torque** | ≥99% | ±5 lb-ft or ±1% | vs OEM spec sheet |
| **0-60 Time** | ≥95% | ±0.3s | vs OEM/press release |
| **Curb Weight** | ≥98% | ±50 lbs | vs EPA/OEM |
| **Quarter Mile** | ≥90% | ±0.5s | vs manufacturer claim or C&D/MT |
| **Braking 60-0** | ≥90% | ±5 feet | vs C&D/MT test data |
| **Lateral G** | ≥90% | ±0.05g | vs C&D/MT test data |
| **Engine Code/Type** | 100% | Exact match | vs service manual |
| **Drivetrain** | 100% | Exact match | vs OEM |
| **Transmission Options** | 100% | All options listed | vs OEM |
| **Year Range** | 100% | Exact years | vs production records |

### 1.2 Performance Hub Domain

| Data Category | Target Accuracy | Acceptable Variance | Measurement |
|---------------|-----------------|---------------------|-------------|
| **HP Gain Estimates** | ≥85% | ±15% of claim | vs dyno data |
| **Upgrade Costs** | ≥80% | ±25% of range | vs 2024 vendor pricing |
| **Compatibility Rules** | 100% | No false positives | vs engineering specs |
| **Dependency Rules** | ≥95% | 0 dangerous omissions | vs technical manuals |
| **Engine Type Detection** | 100% | Exact classification | vs OEM |
| **Installation Difficulty** | ≥90% | Within 1 tier | vs shop estimates |

### 1.3 Education Domain

| Data Category | Target Accuracy | Acceptable Variance | Measurement |
|---------------|-----------------|---------------------|-------------|
| **Technical Claims** | 100% | Zero contradictions | vs OEM/SAE |
| **Safety Information** | 100% | Zero dangerous errors | vs OEM/regulations |
| **System Relationships** | ≥95% | No critical omissions | vs engineering texts |
| **Upgrade Descriptions** | ≥90% | Minor word variations OK | vs consensus |
| **Brand Recommendations** | ≥85% | Reputable brands only | vs market research |

---

## 2. Severity Classification

### 2.1 Critical Errors (Must Fix Immediately)

**Definition:** Errors that could cause safety issues, significant financial harm, or major user trust erosion.

| Error Type | Example | Maximum Allowed |
|------------|---------|-----------------|
| HP off by >20% | GT3 listed at 300hp vs 502hp actual | 0 |
| Dangerous compatibility claim | "Fits all engines" when it doesn't | 0 |
| Missing critical dependency | Turbo upgrade without fuel system warning | 0 |
| Wrong drivetrain type | AWD listed as RWD | 0 |
| Engine type misclassification | Turbo car listed as NA | 0 |
| Safety-critical misinformation | Wrong brake fluid recommendation | 0 |

### 2.2 Major Errors (Fix Within 7 Days)

**Definition:** Errors that significantly impact user decisions but don't pose safety risks.

| Error Type | Example | Maximum Allowed |
|------------|---------|-----------------|
| HP off by 10-20% | 370hp listed as 420hp | ≤5 vehicles |
| 0-60 off by >0.5s | 3.8s listed as 3.2s | ≤10 vehicles |
| Cost estimate off by >50% | $3K listed as $1K | ≤10 upgrades |
| Missing recommended upgrade | No oil cooler for track builds | ≤3 per car |
| Incorrect year range | 2015-2020 vs actual 2015-2019 | 0 |

### 2.3 Minor Errors (Fix Within 30 Days)

**Definition:** Errors that are noticeable but don't significantly impact decisions.

| Error Type | Example | Maximum Allowed |
|------------|---------|-----------------|
| HP off by 5-10% | 475hp listed as 460hp | ≤15 vehicles |
| Weight off by 50-100 lbs | 3400 lbs listed as 3320 lbs | ≤20 vehicles |
| Cost off by 25-50% | $2K listed as $2.8K | ≤20 upgrades |
| Subjective score disputed | Sound score 8 vs community says 7 | Acceptable |
| Typos in descriptions | "Break pads" vs "Brake pads" | ≤5 total |

---

## 3. Decision Rules for Disputes

### 3.1 Source Hierarchy

When data conflicts exist, use this priority order:

```
1. OEM Official Specification Sheet (highest authority)
   └── Manufacturer press releases
   └── Owner's manual
   └── Service manual / Technical documentation
   
2. EPA/Government Records
   └── Fuel economy ratings
   └── Emissions certifications
   └── VIN decoder data

3. Reputable Third-Party Testing (for non-OEM claims)
   └── Car & Driver instrumented tests
   └── Motor Trend instrumented tests
   └── Road & Track instrumented tests
   └── Edmunds instrumented tests

4. Manufacturer Marketing (lowest authority)
   └── Website claims
   └── Advertisement materials
   
5. Community/Forum Consensus (supplementary only)
   └── Only for gap-filling when above unavailable
   └── Must have 3+ independent confirmations
```

### 3.2 Conflict Resolution Rules

**Rule 1: OEM Always Wins**
- If OEM spec differs from third-party test, use OEM spec
- Note the discrepancy in internal documentation
- Exception: If OEM is clearly marketing-inflated (e.g., impossible physics), use third-party

**Rule 2: Latest Technical Service Bulletin (TSB) Supersedes**
- If OEM published a correction, use the corrected value
- Document the TSB number and date

**Rule 3: Regional Variants**
- Use USDM specs as default
- Document if vehicle has different specs in other markets
- Note when a vehicle has regional naming differences

**Rule 4: Model Year Specificity**
- If specs changed mid-generation, document all variants
- Use format: "2015-2017: 460hp, 2018+: 502hp"

**Rule 5: Trim Level Accuracy**
- Each distinct trim with different specs = separate entry
- Don't average across trims

**Rule 6: "OEM Silent" Handling**
- If OEM doesn't publish a spec, use third-party testing
- Tag data as "measured" vs "manufacturer claim"
- Document source and test methodology

---

## 4. Validation Thresholds

### 4.1 Sampling Strategy

| Vehicle Tier | Sample Size | Full Coverage |
|--------------|-------------|---------------|
| Premium (>$75K) | 100% | All vehicles audited |
| Upper-Mid ($50-75K) | 100% | All vehicles audited |
| Mid ($35-50K) | 50% minimum | Popular models: 100% |
| Budget (<$35K) | 25% minimum | Popular models: 100% |

### 4.2 Upgrade Validation Strategy

| Upgrade Category | Sample Size | Full Coverage |
|------------------|-------------|---------------|
| Forced Induction | 100% | All entries audited |
| Safety-Related | 100% | All entries audited |
| Power (Engine) | 75% | High-risk entries: 100% |
| Suspension | 50% | Key entries: 100% |
| Brakes | 75% | Track-related: 100% |
| Wheels/Tires | 50% | — |
| Aero | 50% | — |

### 4.3 Pass/Fail Criteria

**Domain Passes If:**

| Domain | Pass Criteria |
|--------|---------------|
| Car Selector | 0 critical errors, ≤3 major errors, ≤10 minor errors |
| Performance Hub | 0 critical errors, ≤5 major errors, ≤15 minor errors |
| Education | 0 critical errors, ≤2 major errors, ≤10 minor errors |

**Overall Audit Passes If:**
- All domains pass
- Zero unresolved critical errors
- All major errors have documented fix plans
- Cross-domain consistency checks pass

---

## 5. Measurement Methodology

### 5.1 HP/Torque Validation

**Process:**
1. Locate OEM spec sheet for exact model/year/trim
2. Record crank horsepower (not wheel HP)
3. Record peak RPM
4. Note any conditions (SAE net, DIN, etc.)
5. Compare to database value
6. Calculate variance percentage

**Acceptable Sources:**
- Manufacturer press kit
- Official configurator
- Service manual cover page
- EPA fuel economy label (lists HP)

### 5.2 Performance Time Validation

**0-60 Time Process:**
1. Use manufacturer claim as primary
2. If claim seems optimistic (>10% faster than third-party), investigate
3. Document test conditions (launch control, surface, weather)
4. Note if time is for specific configuration (PDK vs manual)

**Quarter Mile Process:**
1. Use third-party instrumented test (C&D, MT)
2. Note trap speed for sanity check
3. Document test conditions

### 5.3 Weight Validation

**Process:**
1. Use EPA test weight or manufacturer curb weight
2. Verify fuel tank size matches spec
3. Note if weight includes driver or is dry weight
4. Check for regional variations (equipment differences)

---

## 6. Evidence Documentation

### 6.1 Required Evidence Per Validation

```
For each validated data point:
├── Source document (PDF, URL, screenshot)
├── Date accessed/published
├── Specific page/section reference
├── Our current value
├── Source value
├── Variance calculation
├── Pass/Fail determination
└── Auditor notes (if needed)
```

### 6.2 Evidence Storage

| Evidence Type | Format | Location |
|---------------|--------|----------|
| OEM Spec Sheets | PDF | `/audit/evidence/oem/` |
| Third-Party Tests | PDF/Link | `/audit/evidence/tests/` |
| Screenshots | PNG | `/audit/evidence/screenshots/` |
| Audit Log | JSON/CSV | `/audit/logs/` |

### 6.3 Audit Log Schema

```json
{
  "auditId": "uuid",
  "timestamp": "ISO 8601",
  "auditor": "name/id",
  "domain": "car-selector|performance-hub|education",
  "entity": "vehicle slug or upgrade key",
  "field": "hp|torque|etc",
  "currentValue": "value in database",
  "referenceValue": "value from source",
  "referenceSource": "source description",
  "referenceUrl": "url if applicable",
  "variance": "calculated variance",
  "severity": "critical|major|minor|pass",
  "action": "none|fix|investigate",
  "notes": "optional notes"
}
```

---

## 7. Escalation Procedures

### 7.1 Critical Error Discovery

1. **Immediate:** Flag in audit log with `severity: critical`
2. **Within 1 hour:** Notify project lead
3. **Within 4 hours:** Prepare fix PR
4. **Within 24 hours:** Deploy fix
5. **Within 48 hours:** Post-mortem documentation

### 7.2 Major Error Discovery

1. Flag in audit log with `severity: major`
2. Add to fix queue with priority
3. Prepare fix within 3 days
4. Deploy within 7 days

### 7.3 Disputed Data

1. Document both values and sources
2. Apply source hierarchy rules
3. If still unclear, default to conservative/safer value
4. Tag as "under review" in internal notes
5. Seek SME input within 14 days

---

## 8. Continuous Monitoring

### 8.1 Post-Audit Checks

| Check | Frequency | Trigger |
|-------|-----------|---------|
| New vehicle addition | Per-vehicle | On data entry |
| Upgrade cost drift | Quarterly | Scheduled |
| HP gain validation | Bi-annually | New dyno data |
| OEM spec updates | Annually | Model year change |
| Community feedback | Ongoing | User reports |

### 8.2 Regression Prevention

- All new vehicles require evidence documentation
- All new upgrades require source citations
- Automated tests prevent values outside acceptable ranges
- Code review for any data file changes

---

*Generated by Audit Plan Execution - Step 1.2/1.3*






