# Tech Debt & Code Consolidation Analysis Prompt

Use this prompt in a fresh Cursor chat to analyze the AutoRev codebase for tech debt, duplicates, and consolidation opportunities.

---

## THE PROMPT

```
I need a comprehensive tech debt and code consolidation analysis of this codebase. Please analyze systematically and create actionable recommendations.

## PHASE 1: Inventory & File Analysis

1. **File Type Census** - Count all file types:
   - .jsx, .js, .ts, .tsx components
   - .css, .module.css stylesheets  
   - .md documentation
   - .sql migrations
   - .json config/data files
   - Any .bak, .old, .deprecated, .backup files (tech debt)

2. **Large File Detection** - Find files over 500 lines that may need splitting:
   - Components (should be <300 lines ideally)
   - Pages (should be <500 lines ideally)
   - Lib/utility files

3. **Naming Convention Audit** - Check for inconsistencies:
   - PascalCase vs camelCase for components
   - Inconsistent suffixes (Page vs Client vs Component)
   - Files that don't match their exports

## PHASE 2: Duplicate & Similar Code Detection

4. **Component Similarity Analysis** - Find components that do similar things:
   - Multiple modal implementations
   - Multiple card/tile patterns
   - Multiple list/grid layouts
   - Multiple form patterns
   - Multiple loading/skeleton states
   - Multiple error boundaries

5. **Page Pattern Analysis** - Find pages with duplicated logic:
   - Similar data fetching patterns
   - Similar auth/tier gating
   - Similar layout structures
   - Similar empty states

6. **Hook Duplication** - Check /hooks directory and inline hooks for:
   - Similar data fetching hooks
   - Similar state management patterns
   - Hooks that could be consolidated

7. **Utility Function Overlap** - Check /lib directory for:
   - Similar helper functions
   - Functions that do the same thing differently
   - Functions that should be combined

## PHASE 3: Architecture Issues

8. **Import Graph Analysis** - Look for:
   - Circular dependencies
   - Components importing from wrong layers
   - Deep import chains that could be simplified

9. **Data Flow Issues** - Identify:
   - Props drilling (data passed through 3+ levels)
   - Inconsistent state management (mix of contexts, props, global state)
   - Components fetching data that parents already have

10. **API Route Consolidation** - Check /app/api for:
    - Routes that could be combined
    - Inconsistent patterns
    - Duplicate validation logic

## PHASE 4: Style & CSS Issues

11. **CSS Duplication** - Find:
    - Similar style patterns across .module.css files
    - Hardcoded values that should use tokens
    - Classes that do the same thing
    - Unused CSS files

12. **Component Library Gaps** - Identify:
    - UI patterns repeated but not in /styles/components
    - Inline styles that should be classes
    - Inconsistent spacing/sizing

## PHASE 5: Documentation & Tests

13. **Documentation Gaps**:
    - Files without JSDoc comments
    - Complex logic without explanation
    - Outdated comments

14. **Test Coverage Gaps**:
    - Critical paths without tests
    - Integration tests missing for key flows

## OUTPUT FORMAT

For each issue found, provide:

| Category | File(s) | Issue | Severity | Recommended Action |
|----------|---------|-------|----------|-------------------|
| Duplicate | file1.jsx, file2.jsx | Both implement user card | High | Consolidate to UserCard.jsx |

Then provide a prioritized action plan:

### Priority 1: Quick Wins (< 1 hour each)
- Delete .bak files
- Fix naming inconsistencies
- etc.

### Priority 2: Medium Effort (1-4 hours each)
- Consolidate X and Y components
- Extract shared hook
- etc.

### Priority 3: Larger Refactors (4+ hours)
- Split large component
- Restructure data flow
- etc.

## SPECIFIC AREAS TO CHECK

Based on recent findings, pay special attention to:

1. **AL/AI Chat Components** - We just consolidated AIMechanicChat → ALPageClient. Check for any remaining duplication.

2. **Car Display Components** - Multiple ways to show car cards/tiles across the app

3. **Modal Patterns** - Auth, Premium, Feedback, Confirmation modals may have shared patterns

4. **Form Components** - Login, signup, profile, vehicle forms may share validation/UI

5. **Loading States** - Skeleton loaders, spinners, loading text across the app

6. **Empty States** - "No results", "No vehicles", "Get started" states

7. **Data Tables** - Admin tables, garage lists, event lists

Please start the analysis now. Be thorough but focus on actionable findings.
```

---

## FOLLOW-UP PROMPTS

After the initial analysis, use these to dig deeper:

### For Component Consolidation:
```
For the duplicate components you identified, show me:
1. The exact files and line numbers
2. What's similar vs different between them
3. A proposed unified component interface
4. Migration steps to consolidate
```

### For Large File Splitting:
```
For [filename], please:
1. Identify logical boundaries for splitting
2. Propose new file structure
3. Show how imports would change
4. Identify any shared state that needs extraction
```

### For CSS Consolidation:
```
Analyze all .module.css files and:
1. Find repeated patterns (buttons, cards, grids, etc.)
2. Check which already exist in /styles/components
3. List hardcoded values that should use tokens
4. Propose which patterns to add to component library
```

### For Hook Consolidation:
```
Compare all hooks in /hooks and inline useCallback/useMemo patterns to:
1. Find data fetching patterns that repeat
2. Identify state management that could be shared
3. Propose consolidated hooks with clear interfaces
```

---

## AUTOMATION SCRIPTS

You can also ask Cursor to generate analysis scripts:

```
Write a Node.js script that:
1. Scans all .jsx files
2. Extracts component names and their props
3. Finds components with similar prop signatures
4. Outputs a similarity report
```

```
Write a script to find CSS classes that appear in multiple .module.css files
```

```
Write a script to identify files over 500 lines and their complexity metrics
```
