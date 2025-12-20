# Error Tracking System

This document describes the error tracking and analysis system for AutoRev.

## Quick Start

### CLI Analysis

```bash
# Full error analysis report
node scripts/error-analysis.mjs

# List only unresolved errors
node scripts/error-analysis.mjs --unresolved

# List only regression errors (errors that were fixed but came back)
node scripts/error-analysis.mjs --regressions

# Mark errors as fixed
node scripts/error-analysis.mjs --fix HASH1 HASH2 --version v1.2.3 --notes "Fixed in PR #123"
```

### API Analysis

```bash
# Get full report
curl http://localhost:3000/api/internal/errors

# Get unresolved errors only
curl "http://localhost:3000/api/internal/errors?type=unresolved"

# Get regression errors
curl "http://localhost:3000/api/internal/errors?type=regressions"

# Filter by severity
curl "http://localhost:3000/api/internal/errors?type=unresolved&severity=blocking"

# Mark errors as fixed
curl -X POST http://localhost:3000/api/internal/errors \
  -H "Content-Type: application/json" \
  -d '{"errorHashes": ["abc123", "def456"], "version": "v1.2.3", "notes": "Fixed"}'
```

### Library Usage

```javascript
import { 
  getUnresolvedErrors, 
  getRegressionErrors, 
  markErrorsFixed,
  getErrorAnalysisReport 
} from '@/lib/errorAnalysis';

// Get all unresolved errors from last 7 days
const errors = await getUnresolvedErrors();

// Get unresolved blocking errors
const blocking = await getUnresolvedErrors({ severity: 'blocking' });

// Get errors for a specific feature
const alErrors = await getUnresolvedErrors({ featureContext: 'al' });

// Get full analysis report
const report = await getErrorAnalysisReport();
console.log(report.summary);

// Mark errors as fixed
await markErrorsFixed(['hash1', 'hash2'], 'v1.2.3', 'Fixed in PR #123');
```

## Database Views

The error tracking system provides three views for easy querying:

### v_unresolved_errors

Errors that have NOT been fixed or resolved. This is the primary view for "what needs attention."

```sql
SELECT * FROM v_unresolved_errors;
```

Excludes:
- Errors where `fixed_at` is set
- Errors where `resolved_at` is set
- Errors where `issue_addressed = TRUE`
- Errors with status: 'resolved', 'closed', 'fixed', 'wont_fix', 'duplicate'

### v_regression_errors

Errors that were previously fixed but have come back. These are HIGH PRIORITY because they indicate a regression.

```sql
SELECT * FROM v_regression_errors;
```

### v_error_summary

Aggregated statistics per error hash. Useful for dashboards.

```sql
SELECT * FROM v_error_summary WHERE has_unresolved = true;
```

## Error Lifecycle

1. **New Error Logged** → Error is inserted into `user_feedback` with `status = 'new'`
2. **Auto-Regression Check** → Trigger checks if this error_hash was previously fixed
3. **Analysis** → Query `v_unresolved_errors` to see what needs attention
4. **Fix Applied** → Developer fixes the issue in code
5. **Mark as Fixed** → Call `mark_error_fixed(error_hash, version, notes)`
6. **Monitoring** → If same error_hash appears again, it's automatically flagged as regression

## Regression Detection

When a new error is inserted:
1. Trigger `check_error_regression()` fires
2. Checks if this `error_hash` exists with a `fixed_at` date
3. If yes, sets `is_regression = TRUE` and links to the original fix
4. Error appears in `v_regression_errors` view

## Fields Added for Fix Tracking

| Field | Type | Description |
|-------|------|-------------|
| `fixed_at` | timestamptz | When the error was marked as fixed |
| `fixed_in_version` | text | Version/commit where fix was applied |
| `fix_notes` | text | Notes about the fix (PR link, description) |
| `is_regression` | boolean | True if this is a recurrence of a fixed error |
| `regression_of` | uuid | Reference to the original fixed error |

## Best Practices

### For Developers

1. **After fixing a bug**, mark it as fixed:
   ```bash
   node scripts/error-analysis.mjs --fix ERROR_HASH --version v1.2.3 --notes "Fixed by ..."
   ```

2. **Check for regressions regularly**:
   ```bash
   node scripts/error-analysis.mjs --regressions
   ```

3. **Include error hash in commit messages** when fixing bugs for traceability

### For AI Assistants

When asked to "check for errors" or "do error analysis":

1. Query `v_unresolved_errors` first - these are the actionable errors
2. Check `v_regression_errors` - these are high priority (fixed but came back)
3. After fixing an error in code, call `mark_error_fixed()` with the error hash
4. Include the version/PR reference in fix notes for traceability

Example workflow:
```javascript
// 1. Get unresolved errors
const errors = await getUnresolvedErrors();

// 2. Fix the issues in code...

// 3. Mark as fixed
await markErrorsFixed(
  errors.map(e => e.error_hash).filter(Boolean),
  'session-2024-12-20',
  'Fixed all unresolved errors during error analysis session'
);
```

## Status Values

The `status` field can be:
- `new` - Just reported, needs investigation
- `reviewed` - Looked at but not yet fixed
- `in_progress` - Currently being worked on
- `fixed` - Fix has been deployed
- `resolved` - Generic resolved state
- `closed` - Closed without fix
- `wont_fix` - Intentionally not fixing
- `duplicate` - Duplicate of another error

