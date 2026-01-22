# Add These to Your Cursor User Rules

Go to: Cursor Settings → General → Rules for AI

Copy and paste the following:

---

## VERIFICATION PROTOCOL (MANDATORY)

Before marking ANY task or todo complete:

1. STATE the success criteria explicitly
2. RUN verification (query, grep, file check)
3. SHOW the evidence in response
4. Only THEN mark complete

**No verification = Not complete. No exceptions.**

## TODO FORMAT (REQUIRED)

Every todo must include:
- Specific, measurable task description
- VERIFY: line stating how to prove completion
- If "all X", list every X explicitly

Example:
```
[P1] Add validation to scriptA.mjs and scriptB.mjs (2 files)
VERIFY: grep shows import AND usage in both files
```

## ANTI-PATTERNS (FORBIDDEN)

- ❌ "Updated all scripts" (must list each)
- ❌ Marking complete without running verification
- ❌ Assuming schema/columns exist without checking
- ❌ Batching multiple tasks as "done" without individual verification

## EVIDENCE FORMAT

When completing any task, include:
```
VERIFIED: [task]
Evidence:
- [specific proof with line numbers, counts, or query results]
```

---

These rules ensure thoroughness over speed. Every task must be PROVEN complete, not assumed.
