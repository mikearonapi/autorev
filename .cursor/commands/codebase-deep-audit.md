# AutoRev Codebase Deep Audit & Tech Debt Analysis

## OBJECTIVE

Perform an exhaustive, systematic audit of the entire AutoRev codebase to identify and document:
- Code duplication (same/similar functionality in multiple places)
- Naming conflicts and inconsistencies
- Conflicting or redundant API routes
- Overlapping or duplicate components
- Dead code and unused exports
- Inconsistent patterns across similar features
- Data flow issues and prop drilling problems
- Technical debt that needs addressing

**TIME EXPECTATION:** This audit should be thorough. Take whatever time is needed (1-3 hours) to do this properly. Do NOT rush or skip sections.

**OUTPUT FORMAT:** Create detailed audit reports in `/audit/` directory with findings, severity ratings, and remediation recommendations.

---

## PHASE 1: STRUCTURAL INVENTORY

### 1.1 API Routes Audit
Analyze ALL files in `app/api/` to create a complete inventory:

```
For each API route, document:
- Route path (e.g., /api/cars/[slug]/issues)
- HTTP methods supported (GET, POST, PUT, DELETE)
- Purpose/description
- Database tables accessed
- Authentication requirements
- Request/response shapes
```

**CHECK FOR:**
- [ ] Routes that serve the same or overlapping purposes
- [ ] Inconsistent naming patterns (kebab-case vs camelCase)
- [ ] Routes that should be consolidated
- [ ] Routes that duplicate database queries done elsewhere
- [ ] Missing error handling patterns
- [ ] Inconsistent response formats

### 1.2 Components Inventory
Analyze ALL files in `components/` to create a complete inventory:

```
For each component, document:
- Component name and file path
- Purpose/description
- Props interface
- Hooks used
- Other components it imports
- Where it's used (which pages/components import it)
```

**CHECK FOR:**
- [ ] Components with similar names (e.g., CarCard vs VehicleCard)
- [ ] Components that do essentially the same thing
- [ ] Components that should be merged or abstracted
- [ ] Inconsistent prop naming patterns
- [ ] Components that are never imported anywhere (dead code)
- [ ] Components that duplicate UI patterns

### 1.3 Hooks Inventory
Analyze ALL files in `hooks/` and any custom hooks in `lib/`:

```
For each hook, document:
- Hook name and file path
- Purpose/description
- Parameters
- Return values
- API calls made
- Other hooks it uses
```

**CHECK FOR:**
- [ ] Hooks that fetch the same data
- [ ] Hooks with overlapping functionality
- [ ] Hooks that should be consolidated
- [ ] Inconsistent naming (use* prefix)
- [ ] Hooks that duplicate logic in services

### 1.4 Services/Lib Inventory
Analyze ALL files in `lib/` to create a complete inventory:

```
For each service file, document:
- File name and path
- Exported functions
- Purpose of each function
- Database tables accessed
- External APIs called
- Other lib files it imports
```

**CHECK FOR:**
- [ ] Functions that do the same thing in different files
- [ ] Services that overlap in responsibility
- [ ] Inconsistent patterns (some use classes, some use functions)
- [ ] Functions that should be in a different service
- [ ] Circular dependencies

---

## PHASE 2: DUPLICATION DETECTION

### 2.1 Function Duplication Scan
Search for functions with similar names or purposes:

```bash
# Find all exported functions and their signatures
grep -r "export function" lib/ components/ hooks/ app/
grep -r "export const .* = " lib/ components/ hooks/ app/
grep -r "export async function" lib/ components/ hooks/ app/
```

**Specifically check for duplicates in these categories:**
- [ ] Car data fetching (multiple ways to get car info?)
- [ ] User data fetching (multiple user services?)
- [ ] HP/performance calculations (multiple calculators?)
- [ ] Formatting functions (price, date, numbers)
- [ ] Validation functions
- [ ] Authentication checks

### 2.2 Component Pattern Duplication
Identify UI patterns that are reimplemented multiple times:

- [ ] Card components (how many card variations exist?)
- [ ] List/grid components
- [ ] Modal/dialog components
- [ ] Form components
- [ ] Button variations
- [ ] Loading states
- [ ] Empty states
- [ ] Error states
- [ ] Badge/tag components

### 2.3 API Pattern Duplication
Check if similar API patterns are implemented inconsistently:

- [ ] Authentication middleware usage
- [ ] Error response formats
- [ ] Pagination patterns
- [ ] Filtering patterns
- [ ] Caching strategies
- [ ] Rate limiting

### 2.4 Database Query Duplication
Find places where the same database query logic exists:

```
Search for:
- Multiple places querying 'cars' table
- Multiple places querying 'user_vehicles' table
- Multiple places querying 'user_projects' table
- Similar SELECT patterns
- Similar JOIN patterns
```

---

## PHASE 3: NAMING CONSISTENCY AUDIT

### 3.1 File Naming Conventions
Check for consistent file naming across:

- [ ] Components: PascalCase.jsx vs camelCase.jsx
- [ ] Hooks: useHookName.js consistency
- [ ] Services: serviceName.js vs serviceNameService.js
- [ ] API routes: kebab-case consistency
- [ ] CSS modules: Component.module.css consistency

### 3.2 Variable/Function Naming
Check for consistent naming patterns:

- [ ] Car vs Vehicle (which term is canonical?)
- [ ] User vs Profile vs Account
- [ ] Build vs Project vs Configuration
- [ ] Upgrade vs Mod vs Modification
- [ ] HP vs Horsepower vs Power
- [ ] Slug vs ID patterns

### 3.3 Prop Naming Consistency
Check components for consistent prop names:

- [ ] `carSlug` vs `slug` vs `car_slug`
- [ ] `vehicleId` vs `vehicle_id` vs `id`
- [ ] `onClose` vs `handleClose` vs `closeModal`
- [ ] `isLoading` vs `loading` vs `isLoaded`
- [ ] `className` vs `style` vs `styles`

---

## PHASE 4: DATA FLOW ANALYSIS

### 4.1 Context/Provider Audit
Analyze all context providers:

```
For each provider:
- What data does it manage?
- Where is it used?
- Does it overlap with other providers?
- Is the data also available elsewhere?
```

**Providers to analyze:**
- [ ] AuthProvider
- [ ] OwnedVehiclesProvider
- [ ] SavedBuildsProvider
- [ ] Any other providers in components/providers/

### 4.2 Data Source Conflicts
Identify where the same data comes from multiple sources:

- [ ] Car data: API vs Provider vs Hook vs Direct Supabase
- [ ] User data: Auth context vs User hook vs API
- [ ] Build data: Provider vs API vs Direct query
- [ ] Does the same data get transformed differently in different places?

### 4.3 State Management Patterns
Check for consistent state management:

- [ ] When is React Query used vs useState/useEffect?
- [ ] When is context used vs props?
- [ ] Where is localStorage used and is it consistent?
- [ ] Are there race conditions between different data sources?

---

## PHASE 5: DEAD CODE DETECTION

### 5.1 Unused Exports
Find exported functions/components that are never imported:

```bash
# For each export, verify it's imported somewhere
# This requires checking each exported item
```

### 5.2 Unused Files
Find files that are never imported:

- [ ] Check each component file
- [ ] Check each lib file
- [ ] Check each hook file
- [ ] Check for orphaned CSS modules

### 5.3 Unused Dependencies
Check package.json for dependencies that aren't used:

```bash
# Search for import statements for each dependency
```

### 5.4 Commented-Out Code
Find large blocks of commented code that should be removed:

```bash
grep -r "// TODO" .
grep -r "/* " . --include="*.js" --include="*.jsx"
```

---

## PHASE 6: CONSISTENCY PATTERNS

### 6.1 Error Handling Patterns
Check for consistent error handling:

- [ ] API routes: How are errors caught and returned?
- [ ] Components: How are errors displayed to users?
- [ ] Hooks: How are errors propagated?
- [ ] Is there a central error handling strategy?

### 6.2 Loading State Patterns
Check for consistent loading states:

- [ ] Is there a standard loading component?
- [ ] Are loading states handled consistently?
- [ ] Are there race conditions with loading states?

### 6.3 Authentication Patterns
Check for consistent auth handling:

- [ ] How do API routes check auth?
- [ ] How do pages check auth?
- [ ] How do components check auth?
- [ ] Is tier/permission checking consistent?

### 6.4 Database Access Patterns
Check for consistent database access:

- [ ] Direct Supabase calls vs API calls vs Service functions
- [ ] When is car_id used vs car_slug?
- [ ] Are there RLS policies being bypassed?
- [ ] Is the carResolver.js being used consistently?

---

## PHASE 7: SPECIFIC PROBLEM AREAS

Based on known issues, specifically audit these areas:

### 7.1 Vehicle/Car Data Flow
- Where does vehicle data come from?
- How many different ways can you get car data?
- Are there conflicts between user_vehicles, cars, and builds?

### 7.2 Build/Project Data Flow
- Where does build data come from?
- How are upgrades stored and retrieved?
- Are there conflicts between user_projects and user_vehicles.installed_modifications?

### 7.3 Performance Calculations
- How many places calculate HP gains?
- Are calculations consistent across:
  - VirtualDynoChart
  - PowerBreakdown
  - CalculatedPerformance
  - BuildValueAnalysis

### 7.4 Tuning Profile Data
- Where is tuning profile data used?
- Is it fetched consistently?
- Are there fallbacks when it's missing?

---

## OUTPUT REQUIREMENTS

Create the following audit reports in `/audit/`:

### Report 1: `api-routes-audit.md`
- Complete inventory of all API routes
- Identified conflicts and duplications
- Recommended consolidations

### Report 2: `components-audit.md`
- Complete inventory of all components
- Identified duplications
- Component dependency graph
- Recommended consolidations

### Report 3: `services-audit.md`
- Complete inventory of all lib services
- Function overlap analysis
- Recommended consolidations

### Report 4: `data-flow-audit.md`
- Provider/context inventory
- Data source conflicts
- Recommended simplifications

### Report 5: `naming-consistency-audit.md`
- Naming convention violations
- Terminology inconsistencies
- Recommended standardizations

### Report 6: `dead-code-audit.md`
- Unused exports
- Unused files
- Unused dependencies
- Recommended removals

### Report 7: `tech-debt-priority-matrix.md`
Create a prioritized list of all issues found:

| Priority | Issue | Location | Impact | Effort | Recommendation |
|----------|-------|----------|--------|--------|----------------|
| P0 | Critical - Fix immediately | | | | |
| P1 | High - Fix soon | | | | |
| P2 | Medium - Plan to fix | | | | |
| P3 | Low - Nice to have | | | | |

### Report 8: `consolidation-plan.md`
Specific, actionable plan for:
- Which files to merge
- Which functions to consolidate
- Which components to deduplicate
- Which patterns to standardize
- Estimated effort for each

---

## EXECUTION INSTRUCTIONS

1. **Start with Phase 1** - Create the complete inventories first
2. **Be exhaustive** - Don't skip files or make assumptions
3. **Document everything** - Even if something seems fine, note it
4. **Note line numbers** - Reference specific code locations
5. **Cross-reference** - Link related issues across reports
6. **Prioritize pragmatically** - Consider impact AND effort
7. **Don't fix yet** - This phase is analysis only

**After the audit is complete, we will review the reports together and create a remediation plan.**

---

## VERIFICATION CHECKLIST

Before considering the audit complete, verify:

- [ ] Every file in `app/api/` has been reviewed
- [ ] Every file in `components/` has been reviewed
- [ ] Every file in `lib/` has been reviewed
- [ ] Every file in `hooks/` has been reviewed
- [ ] All providers have been analyzed
- [ ] Data flow has been mapped
- [ ] Naming consistency has been checked
- [ ] Dead code has been identified
- [ ] All reports have been created
- [ ] Priority matrix is complete
- [ ] Consolidation plan is actionable

---

## START THE AUDIT

Begin with Phase 1.1 (API Routes Audit). Use file listing, grep, and reading tools systematically. Create the first report before moving to the next section.

Take your time. Be thorough. Document everything.
