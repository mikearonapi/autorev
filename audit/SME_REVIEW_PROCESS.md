# SME Review Process & Governance

## Overview

This document defines the Subject Matter Expert (SME) review process for validating data accuracy, resolving disputes, and maintaining quality standards across the SuperNatural Motorsports platform.

---

## 1. SME Panel Structure

### 1.1 Required Expertise Areas

| Domain | Required SME Expertise | Priority Platforms |
|--------|------------------------|-------------------|
| **American Muscle** | Dyno tuning, track testing | GT350, GT500, C7/C8 Corvette, Viper, Hellcat |
| **German Engineering** | OEM diagnostics, track data | BMW M cars, Porsche 911/Cayman, Audi RS |
| **Japanese Performance** | Tuning, aftermarket expertise | GT-R, Supra, RX-7, S2000, Evo, STI |
| **British Sports Cars** | Lightweight dynamics | Lotus, McLaren |
| **Track Preparation** | Safety systems, race prep | All platforms |
| **Forced Induction** | Turbo/SC systems | All boosted platforms |

### 1.2 SME Qualification Criteria

- Minimum 5 years hands-on experience with platform(s)
- Verifiable portfolio (dyno sheets, track times, builds)
- No conflicts of interest with specific vendors
- Willingness to provide evidence-backed reviews

### 1.3 Panel Composition

```
SME Panel
├── Platform Specialists (3-5 per platform cluster)
├── Algorithm Validators (2 for scoring/recommendations)
├── Safety Reviewers (2 for track prep/reliability)
└── Arbitration Committee (3 senior SMEs for disputes)
```

---

## 2. Review Cycles

### 2.1 Review Schedule

| Review Type | Frequency | Scope | Participants |
|-------------|-----------|-------|--------------|
| **Critical Data** | Per-commit | HP, torque, 0-60 changes | Automated + 1 SME |
| **Platform Bundle** | Monthly | All data for specific platform | 2 Platform SMEs |
| **Algorithm Review** | Quarterly | Scoring, recommendations | Algorithm SMEs + Data |
| **Full Audit** | Bi-annually | All domains | Full panel |
| **Ad-hoc** | As needed | User-reported issues | Relevant SME |

### 2.2 Platform Bundle Schedule (Monthly Rotation)

| Month | Platform Bundle |
|-------|----------------|
| January | Porsche (911, Cayman, GT4) |
| February | BMW M-Series (M2, M3, M4, M5) |
| March | American Muscle (GT350, GT500, Camaro) |
| April | Corvette (C5, C6, C7, C8) |
| May | Japanese Turbo (GT-R, Supra, Evo, STI) |
| June | Japanese NA (S2000, RX-7, 86/BRZ) |
| July | German Turbo (Audi RS, Mercedes AMG) |
| August | Lotus & Lightweight |
| September | Mopar (Viper, Challenger, Charger) |
| October | Hot Hatches & Sedans (Type R, Golf R, Focus RS) |
| November | Algorithm & Scoring Review |
| December | Annual Audit Preparation |

---

## 3. Evidence Capture Standards

### 3.1 Evidence Requirements by Data Type

| Data Type | Minimum Evidence | Preferred Evidence |
|-----------|------------------|-------------------|
| **HP/Torque** | OEM spec sheet + publication date | Dyno sheet from reputable shop |
| **0-60 Times** | OEM press release | Multiple independent tests (C&D, MT, etc.) |
| **Weight** | OEM spec with trim level | Scale measurement with fluids state noted |
| **Upgrade Gains** | 3+ documented builds | Controlled dyno comparison A/B test |
| **Reliability Claims** | OEM TSBs, forum consensus | Long-term owner surveys (n>20) |
| **Dependency Rules** | Engineering manual | Real-world failure cases |

### 3.2 Evidence Documentation Template

```markdown
## Evidence Record: [Data Point]

**Vehicle**: [Year Make Model Trim]
**Data Point**: [Field being validated]
**Current Value**: [What's in database]
**Proposed Value**: [Recommended value, if change needed]

### Primary Source
- **Type**: [OEM Spec / Dyno Sheet / Test Article / etc.]
- **Source**: [Publication/Shop name]
- **Date**: [When measured/published]
- **Link/Reference**: [URL or document reference]

### Secondary Sources
1. [Source 1 with link]
2. [Source 2 with link]

### SME Assessment
- **Reviewer**: [Name]
- **Date**: [Review date]
- **Confidence**: [High/Medium/Low]
- **Recommendation**: [Accept/Reject/Modify]
- **Notes**: [Any caveats or context]

### Resolution
- **Decision**: [Final decision]
- **Applied**: [Date applied to database]
- **Commit**: [Git commit reference]
```

### 3.3 Evidence Storage

All evidence is stored in:
- `audit/evidence/` - Primary evidence documents
- `audit/reviews/` - SME review records
- `audit/disputes/` - Dispute resolution records

```
audit/
├── evidence/
│   ├── oem-specs/
│   │   ├── ford-shelby-gt350-specs-2020.pdf
│   │   └── porsche-718-cayman-gt4-specs-2021.pdf
│   ├── dyno-sheets/
│   │   └── gt350-baseline-dyno-2023.pdf
│   └── test-articles/
│       └── c8-corvette-car-and-driver-2020.pdf
├── reviews/
│   └── 2025-01-porsche-bundle-review.md
└── disputes/
    └── 2025-01-gt-r-hp-dispute.md
```

---

## 4. Dispute Resolution

### 4.1 Dispute Categories

| Category | Description | Resolution Path |
|----------|-------------|-----------------|
| **OEM Conflict** | Conflicting OEM sources | Latest official source wins |
| **Measurement Variance** | Marketing vs measured values | Document both, use measured |
| **SME Disagreement** | SMEs disagree on interpretation | Arbitration committee |
| **User-Reported** | User disputes data accuracy | SME review with evidence |
| **Algorithm Behavior** | Unexpected scoring/recommendations | Algorithm SME review |

### 4.2 Dispute Resolution Workflow

```
User/SME Reports Issue
        ↓
┌─────────────────────┐
│ Issue Triage        │
│ (within 24 hours)   │
└─────────────────────┘
        ↓
   Evidence Review
        ↓
┌─────────────────────────────────────────┐
│        Dispute Complexity               │
├──────────────┬──────────────┬───────────┤
│    Simple    │   Complex    │  Disputed │
│  (1-2 days)  │  (1 week)    │ (2 weeks) │
├──────────────┼──────────────┼───────────┤
│ Single SME   │ 2 SMEs +     │Arbitration│
│ Decision     │ Evidence     │ Committee │
└──────────────┴──────────────┴───────────┘
        ↓
   Resolution Documented
        ↓
   Database Updated (if needed)
        ↓
   Stakeholders Notified
```

### 4.3 Dispute Documentation Template

```markdown
## Dispute Record: [ID] - [Brief Title]

**Date Filed**: [Date]
**Filed By**: [Name/Source]
**Category**: [OEM Conflict / Measurement Variance / SME Disagreement / etc.]

### Issue Description
[Detailed description of the dispute]

### Current Database Value
[What's currently in the system]

### Disputed Claim
[What the reporter believes is correct]

### Evidence Presented

**For Current Value:**
1. [Evidence source]

**For Disputed Value:**
1. [Evidence source]

### Review Process
- **Assigned SME(s)**: [Names]
- **Review Date**: [Date]
- **Escalated to Arbitration**: [Yes/No]

### Resolution
- **Decision**: [Accept change / Reject change / Partial update / Document uncertainty]
- **Rationale**: [Why this decision was made]
- **Evidence Weight**: [Which evidence was most compelling]

### Actions Taken
- [ ] Database updated
- [ ] Documentation updated
- [ ] Reporter notified
- [ ] Related data reviewed for consistency
```

### 4.4 Resolution Principles

1. **OEM Wins by Default**: When in doubt, defer to official manufacturer specifications
2. **Latest Trumps Older**: More recent TSBs, revisions, or bulletins supersede older data
3. **Documented > Anecdotal**: Evidence with paper trail beats forum consensus
4. **Safety Conservative**: When reliability/safety is uncertain, use more conservative estimates
5. **Transparency**: If we can't resolve, document the uncertainty for users

---

## 5. Quality Metrics

### 5.1 SME Performance Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Review Turnaround | < 5 days | Days from assignment to completion |
| Evidence Quality | 100% documented | % of reviews with proper evidence |
| Dispute Escalation Rate | < 10% | % of reviews escalated to arbitration |
| User Dispute Rate | < 1 per 1000 users | Disputes filed per active user |

### 5.2 Data Quality Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Critical Field Accuracy | 99.5% | TBD (post-audit) |
| Algorithm Prediction Error | ±5% of measured | TBD |
| Dependency Rule Coverage | 100% | 95%+ |
| Content Contradiction Rate | 0 known | TBD |

### 5.3 Process Metrics

| Metric | Target | Tracking |
|--------|--------|----------|
| Reviews Completed | 100% of schedule | Monthly report |
| Dispute Resolution Time | < 14 days | Per-dispute tracking |
| Evidence Backlog | < 10 items | Weekly check |

---

## 6. Communication Templates

### 6.1 Review Request to SME

```
Subject: [Platform] Bundle Review - [Month Year]

Hi [SME Name],

It's time for the monthly [Platform] bundle review. Please review the attached data for:
- [List of vehicles]

Your review should include:
1. Verification of HP/torque/weight/0-60 values
2. Flagging of any suspicious data points
3. Noting any recent model year changes or TSBs

Deadline: [Date]
Documentation: [Link to review template]

Thank you,
[Your Name]
```

### 6.2 Dispute Acknowledgment

```
Subject: RE: Data Dispute - [Vehicle/Data Point]

Hi [Reporter Name],

Thank you for reporting this potential data discrepancy regarding [Vehicle/Data Point].

We've logged this as Dispute #[ID] and assigned it to our SME team for review. You can expect:
- Initial response within 24 hours
- Resolution within [5-14] days

We'll notify you when a decision is made. If you have additional evidence to support your claim, please reply to this email.

Thank you for helping us maintain accuracy,
[Your Name]
```

### 6.3 Resolution Notification

```
Subject: Resolved: Data Dispute #[ID] - [Vehicle/Data Point]

Hi [Reporter Name],

Our SME team has completed the review of Dispute #[ID].

**Decision**: [Change accepted / Change rejected / Partial update]

**Rationale**: 
[Brief explanation of the decision]

**Evidence Reviewed**:
- [Source 1]
- [Source 2]

**Action Taken**: [Description of any database changes]

Thank you for contributing to data quality.

[Your Name]
```

---

## 7. Getting Started Checklist

### For New SMEs
- [ ] Review this document
- [ ] Access to audit folder granted
- [ ] Assigned to platform bundle(s)
- [ ] Review evidence documentation standards
- [ ] Complete first review under supervision

### For Administrators
- [ ] SME panel assembled (minimum 2 per domain)
- [ ] Review schedule published
- [ ] Evidence storage structure created
- [ ] Communication templates deployed
- [ ] Metrics tracking initialized

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-08 | Audit Team | Initial SME process documentation |

