# Evidence Record Template

Copy this template when documenting evidence for data validation.

---

## Evidence Record: [DATA_POINT]

**Vehicle**: [Year] [Make] [Model] [Trim]
**Data Point**: [Field being validated, e.g., "HP", "0-60 Time", "Curb Weight"]
**Current Value**: [What's currently in database]
**Proposed Value**: [Recommended value, if change needed]
**Date Reviewed**: [YYYY-MM-DD]

---

### Primary Source

- **Type**: [OEM Spec Sheet | Dyno Sheet | Press Release | Test Article | Technical Bulletin]
- **Source**: [Publication name, shop name, or official document name]
- **Date Published**: [YYYY-MM-DD or Year]
- **Link/Reference**: [URL or document filename]
- **Relevant Quote/Data**: 
  > [Copy exact text or data from source]

---

### Secondary Sources (Optional)

List any additional sources that corroborate the primary source.

1. **Source**: [Name]
   - **Type**: [Type]
   - **Date**: [Date]
   - **Link**: [URL]
   - **Value Reported**: [Value]

2. **Source**: [Name]
   - **Type**: [Type]
   - **Date**: [Date]
   - **Link**: [URL]
   - **Value Reported**: [Value]

---

### Variance Analysis (if values differ between sources)

| Source | Value | Date | Notes |
|--------|-------|------|-------|
| OEM Spec | [value] | [date] | [e.g., "Marketing spec"] |
| Magazine Test | [value] | [date] | [e.g., "Measured at dyno"] |
| Current DB | [value] | — | [Current database value] |

**Recommended Action**: [Use OEM / Use measured / Average / Document uncertainty]

---

### SME Assessment

- **Reviewer**: [Name]
- **Date**: [YYYY-MM-DD]
- **Confidence Level**: [High | Medium | Low]
  - High: Multiple sources agree, clear OEM documentation
  - Medium: Some variance between sources, but consensus exists
  - Low: Significant variance, limited documentation
- **Recommendation**: [Accept current | Update to X | Flag for additional review]

**Notes**: 
[Any context, caveats, or explanation for the recommendation]

---

### Resolution

- **Final Decision**: [Keep current | Update | Escalate]
- **Value Applied**: [Final value used in database]
- **Applied By**: [Name]
- **Date Applied**: [YYYY-MM-DD]
- **Git Commit**: [Commit hash or PR number]

---

## Attachments

List any supporting documents stored in the evidence folder:

- [ ] `oem-specs/[filename].pdf`
- [ ] `dyno-sheets/[filename].pdf`
- [ ] `test-articles/[filename].pdf`

