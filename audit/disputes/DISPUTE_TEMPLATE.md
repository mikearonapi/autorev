# Dispute Template

Copy this template when logging a new data dispute.

---

## Dispute Record: [DISPUTE-YYYY-NNN] - [Brief Title]

**Date Filed**: [YYYY-MM-DD]
**Filed By**: [Name, email, or "User Report"]
**Category**: [OEM Conflict | Measurement Variance | SME Disagreement | User-Reported | Algorithm Behavior]
**Priority**: [Critical | High | Medium | Low]
**Status**: [Open | In Review | Escalated | Resolved | Closed]

---

### Issue Description

[Provide a detailed description of the dispute. What data point is being questioned? Why does the reporter believe it's incorrect?]

---

### Current Database Value

**Vehicle**: [Year Make Model Trim]
**Field**: [e.g., HP, torque, 0-60, etc.]
**Current Value**: [Value in database]
**Source**: [Where this value originally came from, if known]

---

### Disputed Claim

**Proposed Value**: [What the reporter believes is correct]
**Reporter's Source(s)**: 
1. [Source 1 with link/reference]
2. [Source 2 with link/reference]

---

### Evidence Review

#### Evidence Supporting Current Value
| Source | Value | Date | Notes |
|--------|-------|------|-------|
| [Source] | [Value] | [Date] | [Notes] |

#### Evidence Supporting Disputed Value
| Source | Value | Date | Notes |
|--------|-------|------|-------|
| [Source] | [Value] | [Date] | [Notes] |

---

### Review Process

- **Assigned SME(s)**: [Name(s)]
- **Assignment Date**: [YYYY-MM-DD]
- **Target Resolution Date**: [YYYY-MM-DD]
- **Review Status**: [Pending | In Progress | Complete]
- **Escalated to Arbitration**: [Yes/No]
  - If yes, reason: [Why escalated]

---

### SME Assessment

**Reviewer**: [Name]
**Review Date**: [YYYY-MM-DD]

**Analysis**:
[Detailed analysis of the evidence and reasoning]

**Recommendation**: [Accept change | Reject change | Partial update | Escalate]

---

### Resolution

**Decision**: [Final decision made by SME or arbitration committee]

**Rationale**: 
[Explain why this decision was made, citing specific evidence]

**Evidence Weight**:
- Most compelling evidence: [Source and why]
- Factors considered: [List factors]

---

### Actions Taken

- [ ] Database updated (if applicable)
  - Old value: [X]
  - New value: [Y]
  - Commit: [hash/PR]
- [ ] Documentation updated
- [ ] Related data reviewed for consistency
- [ ] Reporter notified
- [ ] Evidence filed in `/audit/evidence/`

---

### Communication Log

| Date | Action | Notes |
|------|--------|-------|
| [Date] | Dispute filed | [Notes] |
| [Date] | Acknowledgment sent | [Notes] |
| [Date] | SME assigned | [Notes] |
| [Date] | Resolution communicated | [Notes] |

---

## Lessons Learned (Optional)

[Note any process improvements or patterns identified during this dispute]






