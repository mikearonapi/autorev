# Duplicate Events Detection Log

> **Last Updated:** 2025-01-XX  
> **Purpose:** Track detected duplicate events for manual review

---

## Detection Criteria

Events are flagged as potential duplicates if they match on:
1. **Same source_url + start_date** (handled by unique constraint)
2. **Same name + date + location** (fuzzy match)
3. **Same venue + date** (different names)
4. **Cross-category duplicates** (same URL in different categories)

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Total Duplicates Detected | 0 |
| Resolved | 0 |
| Pending Review | 0 |
| False Positives | 0 |

---

## Detected Duplicates

*No duplicates detected yet*

---

## Resolution Process

1. **Review** - Verify if events are truly duplicates
2. **Merge** - Keep event with best data quality
3. **Delete** - Remove duplicate entry
4. **Update** - Mark as resolved in this log

---

## Notes

- Duplicate detection runs during ingestion
- Cross-category duplicates are critical issues
- Same URL + different dates = recurring events (not duplicates)
- Manual review required for fuzzy matches

