# AUDIT: Code Quality - Codebase-Wide

> **Audit ID:** F  
> **Category:** Cross-Cutting (Foundation)  
> **Priority:** 3 of 36  
> **Dependencies:** D (UI/UX), E (Accessibility)  
> **Downstream Impact:** Naming patterns and code standards affect all page audits

---

## CONTEXT

This audit ensures code quality, consistency, and maintainability across the AutoRev codebase. Poor code quality leads to bugs, makes onboarding difficult, and creates technical debt.

**Key Focus Areas:**
- Naming conventions (domain-specific, not generic)
- No code duplication
- Proper error handling
- TypeScript/JSDoc coverage
- Dead code removal
- Console.log cleanup

---

## CRITICAL: Read These First

Before making ANY changes, read these documents completely:

1. `docs/SOURCE_OF_TRUTH.md` - Naming Conventions section, Anti-Patterns
2. `.cursor/rules/foundation/02-coding-standards.mdc` - Coding standards
3. `.cursor/rules/specialists/quality/code-review-agent.mdc` - Code smells list

---

## IMPORTANT: INVESTIGATE BEFORE FIX

Before changing ANY code:

1. ✅ Verify the code actually runs and is used
2. ✅ Check if "dead code" might be used dynamically or conditionally
3. ✅ Understand why generic names might have been used (maybe intentionally generic)
4. ❌ Do NOT rename functions that are part of public APIs without checking consumers
5. ❓ If unsure if code is dead, grep for usages first

---

## NAMING CONVENTIONS

### File Naming

| Type | Convention | Example | Anti-Pattern |
|------|------------|---------|--------------|
| **Components** | PascalCase | `UserProfileCard.jsx` | `userProfileCard.jsx` |
| **Hooks** | camelCase + `use` prefix | `useUserProfile.js` | `userProfile.js` |
| **Utilities** | camelCase, verb-first | `formatVehiclePrice.js` | `utils.js`, `helpers.js` |
| **Services** | camelCase + `Service` suffix | `emailService.js` | `email.js` |
| **API routes** | kebab-case folders | `app/api/user-profile/` | `app/api/userProfile/` |
| **CSS modules** | PascalCase matching component | `UserProfileCard.module.css` | `styles.module.css` |

### Function Naming

**Pattern:** `handle{Domain}{Action}` for event handlers

```javascript
// ✅ CORRECT: Domain-specific, searchable names
const handleGoalSubmit = (e) => { ... };
const handleFilterChange = (key, value) => { ... };
const handleCarProfileUpdate = () => { ... };
const handleDynoRunSubmit = () => { ... };

// ❌ WRONG: Generic names (easily duplicated, hard to search)
const handleClick = () => { ... };
const handleSubmit = (e) => { ... };
const handleChange = (e) => { ... };
const onClick = () => { ... };
```

### Canonical Handler Names (From SOURCE_OF_TRUTH)

| Component | Handler Name | Purpose |
|-----------|--------------|---------|
| `EventFilters.jsx` | `handleFilterChange` | Filter field changes |
| `PerformanceGoals.jsx` | `handleGoalSubmit` | Add performance goal |
| `FeedbackWidget.jsx` | `handleFeedbackSubmit` | Submit feedback form |
| `ServiceLogModal.jsx` | `handleServiceLogSubmit` | Log service record |
| `TrackTimeLogModal.jsx` | `handleLapTimeSubmit` | Log lap time |
| `DynoLogModal.jsx` | `handleDynoRunSubmit` | Log dyno result |
| `ShareBuildModal.jsx` | `handleShareSubmit` | Share build to community |

---

## CHECKLIST

### A. Generic Handler Names (CRITICAL)

- [ ] Search for `handleClick` - should not exist
- [ ] Search for `handleSubmit` without domain prefix - rename to domain-specific
- [ ] Search for `handleChange` without domain prefix - rename to domain-specific
- [ ] Search for `onClick` as handler name - rename to domain-specific
- [ ] Search for `onSubmit` as handler name - rename to domain-specific
- [ ] All handlers follow `handle{Domain}{Action}` pattern

### B. Generic Utility Names

- [ ] No files named `utils.js` or `helpers.js` (too generic)
- [ ] No files named `constants.js` without domain prefix
- [ ] No functions named `formatData` or `processData` (what data?)
- [ ] All utility functions have verb-first domain-specific names

### C. TypeScript/JSDoc Coverage

- [ ] All exported functions have JSDoc or TypeScript types
- [ ] No `any` types without explicit justification comment
- [ ] API route handlers have typed request/response
- [ ] Service functions have documented parameters and returns
- [ ] Complex objects have type definitions

### D. Error Handling

- [ ] All async functions have try/catch or .catch()
- [ ] Errors are logged with context (not just `console.error(e)`)
- [ ] User-facing errors have helpful messages
- [ ] API errors follow consistent format (`apiError()` from `lib/apiErrors.js`)
- [ ] No silent failures (catch blocks that do nothing)

### E. Console.log Cleanup

- [ ] No `console.log` in production code (except intentional debugging)
- [ ] Debug logs use proper logging service or are behind flag
- [ ] No commented-out console.log statements
- [ ] Error logging uses `console.error` with context

### F. Dead Code

- [ ] No unused imports
- [ ] No unused variables
- [ ] No commented-out code blocks (>5 lines)
- [ ] No unreachable code after return statements
- [ ] No unused exported functions (grep for usages)
- [ ] No unused CSS classes in module files

### G. Code Duplication

- [ ] No duplicate utility functions across files
- [ ] No copy-pasted components with minor differences
- [ ] Shared logic extracted to hooks or utilities
- [ ] Similar API routes consolidated where possible

### H. Import Organization

- [ ] Imports grouped: React → Next → External → Internal → Relative
- [ ] No circular dependencies
- [ ] Using path aliases (`@/lib/`, `@/components/`)
- [ ] No duplicate imports

### I. Component Quality

- [ ] Components have single responsibility
- [ ] Props are destructured with defaults where appropriate
- [ ] Early returns for loading/error states
- [ ] No inline function definitions in render (use useCallback)
- [ ] Keys used correctly in lists (not index unless static)

### J. React Patterns

- [ ] Hooks called unconditionally (not inside conditions)
- [ ] Hooks order: useState → useQuery → useMemo → useCallback → useEffect
- [ ] useEffect has proper dependency arrays
- [ ] useMemo/useCallback used appropriately (not over-used)
- [ ] No state updates in render

---

## KEY FILES TO EXAMINE

### High-Risk Areas (Complex Logic)

| File | Check For |
|------|-----------|
| `lib/performanceCalculator/` | Complex calculations, proper typing |
| `lib/carResolver.js` | Error handling, edge cases |
| `lib/userDataService.js` | Async error handling |
| `lib/insightService.js` | Complex logic, proper typing |

### Common Violation Locations

| File Pattern | Common Issues |
|--------------|---------------|
| `components/**/*Modal.jsx` | Generic handleSubmit |
| `app/(app)/**/page.jsx` | Inline handlers, missing error handling |
| `hooks/use*.js` | Missing JSDoc, any types |
| `lib/*Service.js` | Inconsistent error handling |

### Files to Check for Dead Code

| Location | Why |
|----------|-----|
| `lib/` | Old utilities that may be unused |
| `components/` | Components from removed features |
| `hooks/` | Hooks that may no longer be used |
| `app/api/` | Deprecated API routes |

---

## AUTOMATED CHECKS

Run these commands and document results:

```bash
# 1. Find generic handler names
grep -rn "handleClick\|handleSubmit\|handleChange" --include="*.jsx" --include="*.tsx" app/ components/ | grep -v "handle[A-Z][a-z]*Submit\|handle[A-Z][a-z]*Change\|handle[A-Z][a-z]*Click"

# 2. Find generic utility files
find . -name "utils.js" -o -name "helpers.js" -o -name "constants.js" | grep -v node_modules

# 3. Find console.log statements
grep -rn "console\.log" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" app/ components/ lib/ hooks/ | grep -v "// debug\|// TODO"

# 4. Find 'any' types
grep -rn ": any\|as any" --include="*.ts" --include="*.tsx" app/ components/ lib/ hooks/

# 5. Find empty catch blocks
grep -rn "catch.*{.*}" --include="*.js" --include="*.jsx" -A1 app/ components/ lib/ | grep -B1 "^[^}]*}$"

# 6. Find TODO/FIXME comments
grep -rn "TODO\|FIXME\|HACK\|XXX" --include="*.js" --include="*.jsx" --include="*.ts" app/ components/ lib/

# 7. Find unused exports (requires manual verification)
# Use IDE "Find All References" or eslint-plugin-unused-imports

# 8. Find duplicate function names
grep -rn "^const handle\|^function handle\|^export function\|^export const" --include="*.js" --include="*.jsx" app/ components/ lib/ | cut -d: -f3 | sort | uniq -d

# 9. Find large commented-out blocks
grep -rn "^[[:space:]]*//" --include="*.js" --include="*.jsx" app/ components/ | head -100
```

### Linting Tools

```bash
# Run ESLint with all rules
npm run lint

# Check for unused variables/imports
npx eslint --rule 'no-unused-vars: error' app/ components/ lib/

# Check TypeScript strict mode violations
npx tsc --noEmit --strict
```

---

## SOURCE OF TRUTH PATTERNS

From `docs/SOURCE_OF_TRUTH.md`:

```javascript
// ✅ CORRECT: Domain-specific naming
const handleCarProfileUpdate = async (carId, updates) => {
  try {
    const result = await updateCarProfile(carId, updates);
    return result;
  } catch (error) {
    console.error('[CarProfile] Update failed:', { carId, error: error.message });
    throw new Error('Failed to update car profile');
  }
};

// ❌ WRONG: Generic naming, poor error handling
const handleSubmit = async (id, data) => {
  const result = await update(id, data);
  return result;
};
```

```javascript
// ✅ CORRECT: Proper JSDoc
/**
 * Calculates HP gain from installed modifications
 * @param {Array<Modification>} mods - Installed modifications
 * @param {Car} car - Base car data
 * @returns {{ hpGain: number, tqGain: number }} Calculated gains
 */
export function calculateAllModificationGains(mods, car) {
  // ...
}

// ❌ WRONG: No documentation
export function calc(m, c) {
  // What does this do? What are m and c?
}
```

---

## DELIVERABLES

### 1. Violation Report

| Category | File:Line | Issue | Fix |
|----------|-----------|-------|-----|
| Generic Name | | | |
| Missing Types | | | |
| Dead Code | | | |
| Error Handling | | | |
| Console.log | | | |

### 2. Summary Statistics

- Generic handler names: X
- Missing JSDoc/types: X
- Console.log statements: X
- Dead code blocks: X
- Empty catch blocks: X
- TODO/FIXME comments: X

### 3. Technical Debt Inventory

| Area | Debt Item | Effort | Priority |
|------|-----------|--------|----------|
| | | S/M/L | High/Med/Low |

---

## VERIFICATION

- [ ] `npm run lint` passes with no errors
- [ ] No generic handler names (`handleClick`, `handleSubmit`, `handleChange`)
- [ ] All exported functions have JSDoc or types
- [ ] No `console.log` in production paths
- [ ] No empty catch blocks
- [ ] TypeScript strict mode compiles (if applicable)

---

## SUCCESS CRITERIA

| # | Criterion |
|---|-----------|
| 1 | Zero generic handler names in components |
| 2 | All exported functions documented with JSDoc |
| 3 | Zero console.log in production code |
| 4 | All async code has error handling |
| 5 | No empty catch blocks |
| 6 | Dead code identified and removed (or justified) |
| 7 | Technical debt inventory created |

---

## OUTPUT FORMAT

```
🔧 CODE QUALITY AUDIT RESULTS

**Summary:**
- Generic names: X violations
- Missing docs: X violations
- Console.log: X instances
- Dead code: X blocks
- Error handling: X issues

**Critical (Fix Immediately):**
1. [file:line] [issue] → [fix]
...

**Naming Violations:**
1. [file:line] `handleSubmit` → `handle{Domain}Submit`
...

**Dead Code:**
1. [file:line] [unused function/variable]
...

**Technical Debt:**
| Item | Effort | Priority |
|------|--------|----------|
| ... | ... | ... |

**Patterns for Page Audits:**
- Check for generic handlers in page components
- Verify error handling in data fetching
...
```

---

## AUDIT EXECUTION LOG

| Date | Auditor | Lint Status | Violations Found | Notes |
|------|---------|-------------|------------------|-------|
| | | | | |

---

*Audit prompt generated: January 25, 2026*  
*Part of AutoRev Systematic Audit Suite (36 total audits)*
