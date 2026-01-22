# Quick Verification Checklist

Use this checklist BEFORE marking ANY task complete.

## Database Changes

```sql
-- 1. Verify table/column exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'tablename';

-- 2. Verify data state
SELECT COUNT(*) FROM tablename WHERE condition;

-- 3. Verify no orphans
SELECT COUNT(*) FROM child_table c
LEFT JOIN parent_table p ON c.parent_id = p.id
WHERE c.parent_id IS NOT NULL AND p.id IS NULL;
```

## File Changes

```bash
# 1. Verify file exists and has content
wc -l path/to/file

# 2. Verify specific content
grep -n "expected_pattern" path/to/file

# 3. Verify import AND usage (both required)
grep -n "import.*Module" script.js && grep -n "Module.function" script.js
```

## Script Updates

When claiming "updated script X":
1. Show the import line number
2. Show the usage line number
3. If no usage, it's NOT updated

## "All X" Claims

Never say "all" without listing each:
- ❌ "Updated all scripts"
- ✅ "Updated 4 scripts: A.js (line 5), B.js (line 12), C.js (line 8), D.js (line 3)"

## Final Check

Before marking complete, ask:
> "If the user ran a verification query right now, would it pass?"

If uncertain → run the query yourself first.
