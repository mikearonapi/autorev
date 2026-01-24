# AutoRev Cursor Rules Reference

> **Complete compilation of all Cursor rules, guidelines, and constraints for the AutoRev project.**  
> Generated: January 23, 2026

---

## Table of Contents

1. [User Rules (Global Behavior)](#1-user-rules-global-behavior)
2. [Verification & Task Completion Protocol](#2-verification--task-completion-protocol)
3. [Data Authority & Database Patterns](#3-data-authority--database-patterns)
4. [Brand Guidelines](#4-brand-guidelines)
5. [CSS Architecture](#5-css-architecture)
6. [Data Visualization UI/UX](#6-data-visualization-uiux)
7. [AI/AL Constraints](#7-aial-constraints)
8. [Tier & Feature Gating](#8-tier--feature-gating)
9. [Performance Data Integrity](#9-performance-data-integrity)
10. [No Duplication (MECE Principle)](#10-no-duplication-mece-principle)
11. [Database Audit Procedures](#11-database-audit-procedures)
12. [Empty Table Policy](#12-empty-table-policy)

---

## 1. User Rules (Global Behavior)

These are global rules that apply to all AI interactions in this project.

### 1.1 Documentation Authority

All implementation must align with documentation in `/docs`.

**Authoritative order:**
1. **SOURCE_OF_TRUTH.md** — CANONICAL reference (check this FIRST)
2. DATABASE.md — Tables, schemas, relationships
3. API.md — API routes, response shapes
4. ARCHITECTURE.md — System design
5. BRAND_GUIDELINES.md — Colors, typography
6. AL.md — AI assistant features

**What SOURCE_OF_TRUTH.md Contains:**
- 🔍 AI Quick Search Index — Keyword lookup
- ⚠️ 10 Cardinal Rules — Prevent 90% of bugs
- Anti-Patterns Section — Common mistakes by category
- File Relationships Map — Dependencies and data flow
- "I need to..." Quick Reference — Task-based lookup
- Service locations, component registry, hook reference

**If documentation is missing or conflicting:**
- STOP
- Report the issue
- Do NOT invent structure or behavior

### 1.2 Pre-Implementation Reconnaissance

Before writing any code, you MUST:

1. Scan the repository for existing patterns, naming conventions, and structure
2. Identify relevant files, services, routes, and tests
3. Summarize findings BEFORE implementing any changes

**Do NOT write code until reconnaissance is complete.**

### 1.3 Minimal Change Principle

Prefer the smallest possible change that achieves the goal.

**Avoid:**
- Broad refactors
- Unrelated formatting changes
- Touching files outside the stated scope

**Optimize for reviewability and safety.**

### 1.4 Scope Discipline

Respect the defined scope strictly.

**DO:**
- Only what is explicitly requested

**DO NOT:**
- Refactor unrelated code
- Change public APIs unless explicitly instructed
- "Improve" code outside the task

**When in doubt, ask before proceeding.**

### 1.5 Testing Requirements

If behavior changes, tests are REQUIRED.

**You must:**
- Add or update tests
- Ensure tests fail before and pass after the change
- Clearly state how to run the tests

**No behavior change without test coverage unless explicitly approved.**

### 1.6 Error Handling & Validation

All new logic must:
- Validate inputs
- Handle errors explicitly
- Avoid silent failures

**Include logging where appropriate:**
- `info` for successful operations
- `warn` or `error` for failures

### 1.7 Type Safety (TypeScript)

For TypeScript projects:
- Define explicit interfaces or types for all data structures
- Avoid `any`
- Ensure types align with DATABASE.md and API.md
- Prefer strict typing over convenience

### 1.8 Dependency Management

Before suggesting a new dependency:

1. Check if existing dependencies can solve the problem
2. Prefer native or built-in solutions
3. Justify any new dependency explicitly

**Do not add dependencies casually.**

### 1.9 Code Over Documentation

Default behavior: write code, not documentation.

**Only generate documentation when:**
- Public APIs change
- A new architectural pattern is introduced
- Explicitly requested

**Prefer inline comments over long documentation.**

### 1.10 Performance Awareness

Prefer efficient algorithms and data access patterns.

**Avoid:**
- Unnecessary loops
- Repeated database calls
- Premature optimization

**Call out any performance risks explicitly.**

### 1.11 Response Format

All responses must include:
1. A unified diff or file-scoped code blocks
2. Tests added or updated (if applicable)
3. How to run tests
4. Edge cases considered

**Avoid prose-only responses.**

---

## 2. Verification & Task Completion Protocol

### 2.1 The Verification Gate (HIGHEST PRIORITY)

> **STOP. Before marking ANY todo complete, you MUST complete this gate.**

Before setting `status: "completed"` on ANY Todo:

```
□ I have DEFINED success criteria (not just "do X")
□ I have RUN a verification query/check (not assumed)
□ I can CITE the evidence (line numbers, row counts, query results)
□ If I said "all X", I have LISTED every X explicitly
```

**If ANY box is unchecked → DO NOT mark complete.**

### 2.2 Verification Evidence Format

When marking a todo complete, include in your response:

```
VERIFIED: [todo description]
Evidence:
- [Specific proof: query result, line number, file check]
```

**Examples:**

❌ WRONG:
> Marking task complete.

✅ RIGHT:
> VERIFIED: Add pipelineLogger to expandFitments.mjs
> Evidence:
> - Import: line 37 `import { PipelineRun } from '../lib/pipelineLogger.js'`
> - Usage: 7 occurrences of `pipelineRun` in file
> - Grep output confirms both import and usage present

### 2.3 The 5-Step Completion Protocol

Every task MUST follow these 5 steps. No exceptions.

#### Step 1: DEFINE (Before Starting)

Before writing any code, explicitly state:

```
TASK: [What needs to be done]
SUCCESS CRITERIA:
- [ ] Specific, measurable outcome 1
- [ ] Specific, measurable outcome 2
VERIFICATION METHOD: [How I will prove it worked]
```

**Rules:**
- Success criteria must be MEASURABLE (counts, existence checks, specific values)
- Never use vague criteria like "update scripts" - list EACH script by name
- If a task affects the database, define the expected row counts or states

#### Step 2: IMPLEMENT (Do the Work)

Execute the implementation.

**Rules:**
- Work through each success criterion one at a time
- Don't batch multiple unrelated changes
- If you discover the scope is larger than expected, STOP and redefine

#### Step 3: VERIFY (Prove It Worked)

Run verification queries/checks for EACH success criterion.

**Database changes:**
```sql
-- Always verify with actual queries
SELECT COUNT(*) FROM table WHERE condition;
-- Check for expected state, not just "no errors"
```

**File changes:**
```bash
# Verify files exist AND contain expected content
grep -n "expected_pattern" path/to/file
```

**Script integrations:**
```bash
# Verify BOTH import AND usage
grep -n "import.*module" script.js
grep -n "actualFunctionUsed" script.js
```

#### Step 4: REPORT (State What Was Done)

After verification passes, state:

```
COMPLETED: [Task name]
VERIFIED:
- ✅ Criterion 1: [evidence]
- ✅ Criterion 2: [evidence]
```

#### Step 5: MOVE ON (Only After Steps 1-4)

Only mark a todo as complete and move to the next task AFTER:
- All success criteria verified
- Evidence documented
- No outstanding issues

### 2.4 Todo Format Requirements

Every todo MUST include verification criteria in the content field.

**Required Format:**
```
[Priority] Task description
VERIFY: [How to prove it's done]
```

**❌ BAD todos (vague, no verification):**
```
- Create validation layer
- Update scripts
- Fix data issues
```

**✅ GOOD todos (specific, verifiable):**
```
- [P1] Create lib/dataValidation.js with validateCarReference export
  VERIFY: file exists AND grep shows "export.*validateCarReference"

- [P1] Update seedLapTimes.mjs to use validateCarReference
  VERIFY: grep shows import line AND usage line (both required)

- [P1] Fix NULL car_id in community_insights (68 records)
  VERIFY: SELECT COUNT(*) WHERE car_id IS NULL returns 0
```

### 2.5 The "All X" Rule

If a task involves multiple items:
- Create SEPARATE todos for each item, OR
- List every item explicitly in one todo

**Never:** "Update all scripts"  
**Always:** "Update scripts: A.mjs, B.mjs, C.mjs (3 total)"

### 2.6 Anti-Patterns to AVOID

#### ❌ "Updated all scripts"
Never claim "all X" without explicitly listing each X.

**Wrong:**
> Updated all ingestion scripts to use validation layer

**Right:**
> Updated 4 scripts to use validation layer:
> - seedLapTimesFastestLaps.mjs (line 17: import, line 95: usage)
> - seedDynoRunsEstimated.mjs (line 19: import, line 78: usage)
> - ingest-affiliate-feed.mjs (line 29: import, line 216: usage)
> - recategorizeParts.mjs (line 21: import, line 186: usage)
>
> NOT updated (validation not applicable):
> - expandFitments.mjs (uses different validation pattern)

#### ❌ Marking complete before verifying

**Wrong:**
```
[writes migration file]
"Migration complete, marking todo done"
```

**Right:**
```
[writes migration file]
[applies migration]
[runs verification query]
"Verified: table has 2,767 rows, all foreign keys valid. Marking complete."
```

#### ❌ Assuming schema/structure

**Wrong:**
```sql
-- Adding trigger that references car_slug
CREATE TRIGGER auto_resolve ON my_table...
```

**Right:**
```sql
-- First, verify the column exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'my_table' AND column_name = 'car_slug';

-- Only then create trigger if column exists
```

### 2.7 Session Protocol

#### At Session Start

When beginning work on any multi-step task:

1. **Understand scope fully** before creating todos
2. **List ALL items** that need work (never say "all X" later)
3. **Create todos with VERIFY criteria** for each item
4. **Confirm with user** if scope is unclear

#### During Session

For EACH todo:

```
1. Read the VERIFY criteria from the todo
2. Do the implementation work
3. Run the verification check
4. Report evidence in response
5. Only then mark complete
```

#### Before Marking Complete

Ask yourself:
> "If the user ran `grep` or a SQL query right now to check this, would it pass?"

If uncertain → run the check yourself first.

#### Red Flags (STOP and Verify)

If you're about to:
- Say "done" without running a check → STOP
- Say "all X updated" without listing each → STOP
- Assume a column/table exists → STOP and query schema
- Mark multiple todos complete at once → STOP and verify each

### 2.8 Todo Examples

#### Database Tasks

❌ BAD:
```
- Fix data linkage issues
```

✅ GOOD:
```
- [P1] Fix 68 community_insights with NULL car_id
  VERIFY: SELECT COUNT(*) FROM community_insights WHERE is_active=true AND car_id IS NULL = 0
```

#### Script Update Tasks

❌ BAD:
```
- Update scripts to use validation
```

✅ GOOD:
```
- [P1] Add validateCarReference to seedLapTimes.mjs
  VERIFY: grep -n "dataValidation" shows import, grep -n "validateCarReference" shows usage

- [P1] Add pipelineLogger to ingest-affiliate-feed.mjs
  VERIFY: grep -n "pipelineLogger" shows import, grep -c "pipelineRun" shows 5+ usages
```

#### File Creation Tasks

❌ BAD:
```
- Create validation module
```

✅ GOOD:
```
- [P1] Create lib/dataValidation.js with validateCarReference, validateTrackReference, withValidation exports
  VERIFY: file exists (wc -l shows 400+ lines), grep shows all 3 exports
```

#### Multi-Item Tasks

❌ BAD:
```
- Add triggers to tables
```

✅ GOOD:
```
- [P1] Add auto_car_id trigger to these tables (4 total):
  1. community_insights - VERIFY: SELECT trigger_name FROM information_schema.triggers WHERE event_object_table='community_insights'
  2. car_track_lap_times - VERIFY: same query
  3. car_dyno_runs - VERIFY: same query
  4. youtube_video_car_links - VERIFY: same query
  
  PRE-CHECK: Confirm each table has car_slug column before adding trigger
```

---

## 3. Data Authority & Database Patterns

### 3.1 Source of Truth Hierarchy

1. **DATABASE.md** - Canonical schemas, tables, columns
2. **API.md** - Response shapes and API contracts
3. **database-patterns.mdc** - Code patterns and table usage

### 3.2 Cardinal Rules

1. **NEVER invent tables** - Check DATABASE.md and query `information_schema.tables` first
2. **NEVER invent columns** - Query existing schema before adding fields
3. **NEVER duplicate data** - One source of truth per data type
4. **ALWAYS use car_id** - Never query by car_slug directly (use `lib/carResolver.js`)

### 3.3 Before Writing Database Code

```
STOP and verify:
1. Does this table exist? → Check DATABASE.md or query schema
2. Does this column exist? → Check DATABASE.md or query schema 
3. Am I using the right table? → Check source of truth matrix
4. Am I querying by car_id? → Must resolve slug first via resolveCarId()
```

### 3.4 Identifier Pattern

```javascript
// ✅ CORRECT: Resolve slug once, use car_id everywhere
import { resolveCarId } from '@/lib/carResolver';

const carId = await resolveCarId(carSlug);
if (!carId) return { error: 'Car not found' };

const { data } = await supabase
  .from('car_issues')
  .select('*')
  .eq('car_id', carId); // Use car_id
```

```javascript
// ❌ WRONG: Direct car_slug query
const { data } = await supabase
  .from('car_issues')
  .select('*')
  .eq('car_slug', carSlug); // Don't do this

// ❌ WRONG: OR clause (destroys index performance)
.or(`car_id.eq.${carId},car_slug.eq.${carSlug}`)
```

### 3.5 Source of Truth Matrix

| Data Type | ✅ Use This Table | ❌ NOT These |
|-----------|------------------|--------------|
| Known Issues | `car_issues` | `vehicle_known_issues` (deprecated) |
| Upgrade Recommendations | `car_tuning_profiles.upgrades_by_objective` | `cars.upgrade_recommendations` (deprecated) |
| Track Mods | `car_tuning_profiles.upgrades_by_objective` | `cars.popular_track_mods` (deprecated) |
| Maintenance Specs | `vehicle_maintenance_specs` | - |
| Service Intervals | `vehicle_service_intervals` | - |
| Dyno Runs | `car_dyno_runs` | - |
| Lap Times | `car_track_lap_times` | - |
| Car Base Data | `cars` | - |
| Car Variants | `car_variants` | - |
| Tuning Data | `car_tuning_profiles` | - |
| Parts | `parts` + `part_fitments` | - |
| YouTube Videos | `youtube_videos` + `youtube_video_car_links` | - |
| User Vehicles | `user_vehicles` | - |
| User Projects | `user_projects` | - |
| User Favorites | `user_favorites` | - |
| Community Posts | `community_posts` | - |
| Community Insights | `community_insights` | - |
| AL Conversations | `al_conversations` + `al_messages` | - |
| Analytics | `page_views`, `click_events`, `user_events` | - |

### 3.6 RPC Functions to Use

Always prefer these optimized RPCs over raw queries:

| Need | Use This RPC |
|------|--------------|
| Full car context for AL | `get_car_ai_context_v2(car_slug)` |
| Tuning/parts data | `get_car_tuning_context(car_slug)` |
| Maintenance summary | `get_car_maintenance_summary(car_slug)` |
| Slug → ID resolution | `resolve_car_id_from_slug()` (trigger function) |

```javascript
// ✅ CORRECT: Use RPC for complex data
const { data } = await supabase.rpc('get_car_ai_context_v2', { 
  p_car_slug: carSlug 
});

// ❌ WRONG: Multiple separate queries
const car = await supabase.from('cars').select('*').eq('slug', carSlug);
const issues = await supabase.from('car_issues').select('*').eq('car_slug', carSlug);
const dyno = await supabase.from('car_dyno_runs').select('*').eq('car_slug', carSlug);
// ... N+1 query problem
```

### 3.7 Key Service File Locations

| Need | Check This File |
|------|-----------------|
| Car data | `lib/carsClient.js`, `lib/carResolver.js` |
| User data | `lib/userDataService.js` |
| Tuning/upgrades | `lib/tuningProfiles.js`, `lib/upgradeCalculator.js` |
| Maintenance | `lib/maintenanceService.js` |
| Events | `lib/eventsService.js` |
| YouTube | `lib/youtubeClient.js` |
| Articles | `lib/articlesService.js` |
| AI/AL features | `lib/alTools.js`, `lib/alConversationService.js` |
| Parts/fitment | `lib/fitmentService.js`, `lib/fitmentResolver.js` |
| Analytics | `lib/activityTracker.js`, `lib/ga4.ts` |
| Errors | `lib/errorLogger.js`, `lib/apiErrors.js` |
| Auth | `lib/auth.js`, `lib/adminAuth.js` |
| Stripe/billing | `lib/stripe.js` |
| Images | `lib/images.js`, `lib/imageUploadService.js` |

### 3.8 Before Creating a New Table

**STOP and check:**

1. Does a table already exist for this data?
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' AND table_name ILIKE '%keyword%';
   ```

2. Can an existing table be extended with a new column?
3. Is there a JSONB column in an existing table that could store this?
4. Check DATABASE.md for existing schema

**If you must create a new table:**
- Include `car_id UUID REFERENCES cars(id)` if it relates to cars
- Include `user_id UUID REFERENCES auth.users(id)` if it relates to users
- Add `created_at TIMESTAMPTZ DEFAULT NOW()`
- Add `updated_at TIMESTAMPTZ DEFAULT NOW()`
- Create an index on `car_id` and/or `user_id`
- Add the auto-populate trigger if using car_slug
- Update DATABASE.md with the new table

---

## 4. Brand Guidelines

### 4.1 Color System Overview

AutoRev uses a **4-color accent system** with clear, non-overlapping purposes:

| Color | Hex | Purpose | Think of it as... |
|-------|-----|---------|-------------------|
| **Lime** | `#d4ff00` | USER ACTIONS | "Do this" |
| **Teal** | `#10b981` | POSITIVE DATA | "This is good" |
| **Blue** | `#3b82f6` | BASELINE DATA | "This is stock" |
| **Amber** | `#f59e0b` | CAUTION (sparingly) | "Watch out" |

### 4.2 Background & Text Colors

```css
/* Background Colors */
--color-bg-base: #0d1b2a;      /* Main page backgrounds */
--color-bg-elevated: #1b263b;  /* Cards, elevated surfaces */
--color-bg-card: rgba(255, 255, 255, 0.04);
--color-bg-card-hover: rgba(255, 255, 255, 0.08);

/* Text Colors */
--color-text-primary: #ffffff;
--color-text-secondary: #94a3b8;  /* Slate-400 */
--color-text-tertiary: #64748b;   /* Slate-500 */
--color-text-muted: #475569;      /* Slate-600 */
```

### 4.3 LIME (`#d4ff00`) — User Actions & Emphasis

**Use lime when you want the user to DO something.**

✅ **USE FOR:**
- Primary CTA buttons ("Start Build", "Save", "Upgrade Now")
- Primary navigation elements that drive action
- Emphasized headlines that announce features
- Premium/highlighted badges (sparingly)
- Hover states on secondary buttons

❌ **NEVER USE FOR:**
- Data display (use teal or blue)
- Status indicators
- Body text
- Backgrounds (except button backgrounds)

### 4.4 TEAL (`#10b981`) — Positive Data & Improvements

**Use teal when showing something GOOD happened to data.**

✅ **USE FOR:**
- HP/torque gains (`+99 HP`)
- Upgrade counts ("4 upgrades")
- Performance improvements
- Modified/upgraded values in comparisons
- Active selections (filter pills, tabs)
- Success confirmations
- Positive status badges

❌ **NEVER USE FOR:**
- User action buttons (use lime)
- Baseline/stock data (use blue)
- Warnings or cautions
- Decorative labels

### 4.5 BLUE (`#3b82f6`) — Baseline & Stock Data

**Use blue for ORIGINAL values before modification.**

✅ **USE FOR:**
- Stock/factory specifications
- Baseline values in comparisons
- Original data points
- Informational badges
- Links (text links, not buttons)

❌ **NEVER USE FOR:**
- Modified/upgraded data (use teal)
- CTAs or buttons (use lime)
- Warnings

### 4.6 AMBER (`#f59e0b`) — Caution Only (Use Sparingly!)

**Use amber ONLY for genuine warnings. This color should be rare.**

✅ **USE FOR:**
- "Watch Out" / "Caution" sections
- Known issues warnings
- Compatibility warnings
- Risk indicators

❌ **NEVER USE FOR:**
- Labels or categories (use white/secondary text)
- Badges that aren't warnings
- Decorative elements
- Data display

### 4.7 Comparison & Visualization Rules

When showing stock vs modified comparisons, the pattern is ALWAYS:

| Data Type | Color | Example |
|-----------|-------|---------|
| Stock/Baseline | Blue `#3b82f6` | `444 HP` |
| Modified/Upgraded | Teal `#10b981` | `543 HP` |
| Gain Badge | Teal on teal bg | `+99` |

```tsx
// CORRECT comparison pattern
<span className="text-[#3b82f6]">444 HP</span> {/* Stock = Blue */}
<span className="text-white">→</span>
<span className="text-[#10b981]">543 HP</span> {/* Modified = Teal */}
<span className="bg-[rgba(16,185,129,0.15)] text-[#10b981]">+99</span>
```

### 4.8 Typography

#### Font Families

```css
--font-display: var(--font-oswald, 'Oswald'), sans-serif;  /* Headers */
--font-body: var(--font-inter, 'Inter'), sans-serif;       /* Body text */
--font-mono: 'JetBrains Mono', 'SF Mono', monospace;       /* Data/stats */
```

#### Type Scale (Mobile-First)

| Name | Mobile | Desktop | Usage |
|------|--------|---------|-------|
| Hero | 28px | 56px | Page headlines |
| H1 | 26px | 48px | Section titles |
| H2 | 22px | 36px | Card headers |
| H3 | 18px | 28px | Subsections |
| Base | 13px | 16px | Body text |
| Small | 11px | 14px | Labels |
| XS | 10px | 12px | Fine print |

### 4.9 Button Patterns

#### Primary CTA (Lime)

```css
.btn-primary {
  background: #d4ff00;
  color: #0a1628;
  font-weight: 700;
  padding: 16px 32px;
  border-radius: 100px;
  text-transform: uppercase;
}

.btn-primary:hover {
  background: #bfe600;
  box-shadow: 0 8px 30px rgba(212, 255, 0, 0.3);
}
```

#### Secondary Button (Outline)

```css
.btn-secondary {
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 100px;
}

.btn-secondary:hover {
  border-color: #d4ff00;
  color: #d4ff00;
}
```

### 4.10 Banned Patterns

❌ **NEVER:**
- Use `#ff6b35` (orange-red) — not in our palette
- Use gold `#d4a84b` — removed from palette
- Use pure black `#000000` for backgrounds
- Use green-400/500 instead of teal `#10b981`
- Use lime for data display (use teal)
- Use amber/warning for non-warning content
- Mix improvement colors (always teal for gains)
- Make text smaller than 10px on mobile

### 4.11 Quick Reference

```tsx
// Brand colors for JS/TS
const BRAND = {
  lime: '#d4ff00',       // User actions, CTAs
  teal: '#10b981',       // Positive data, improvements
  blue: '#3b82f6',       // Baseline, stock data
  amber: '#f59e0b',      // Warnings only (sparingly)
  navy: '#0d1b2a',       // Backgrounds
  textPrimary: '#ffffff',
  textSecondary: '#94a3b8',
};
```

### 4.12 Decision Tree: Which Color?

```
Is this a button/CTA the user clicks?
  → YES: Use LIME
  → NO: Continue...

Is this showing improved/upgraded data?
  → YES: Use TEAL
  → NO: Continue...

Is this showing original/stock data?
  → YES: Use BLUE
  → NO: Continue...

Is this a genuine warning/caution?
  → YES: Use AMBER (sparingly)
  → NO: Use white/secondary text
```

---

## 5. CSS Architecture

### 5.1 Use Design Tokens

NEVER hardcode colors, spacing, or typography values. ALWAYS use CSS variables.

```css
/* ❌ WRONG */
background: #0d1b2a;
padding: 16px;
font-size: 14px;
border-radius: 10px;

/* ✅ CORRECT */
background: var(--color-bg-base);
padding: var(--space-4);
font-size: var(--text-body);
border-radius: var(--radius-md);
```

### 5.2 Token Quick Reference

#### Colors

```css
/* Backgrounds */
--color-bg-base: #0d1b2a
--color-bg-elevated: #1b263b
--color-bg-card: rgba(255, 255, 255, 0.04)

/* Text */
--color-text-primary: #ffffff
--color-text-secondary: #94a3b8
--color-text-tertiary: #64748b

/* Accents (4-color system) */
--color-accent-lime: #d4ff00    /* User actions, CTAs */
--color-accent-teal: #10b981    /* Positive data, improvements */
--color-accent-blue: #3b82f6    /* Baseline, stock data */
--color-warning: #f59e0b        /* Warnings only (sparingly) */
```

#### Spacing (4px base)

```css
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px   /* Base unit */
--space-6: 24px
--space-8: 32px
```

#### Touch Targets

```css
--touch-target-min: 44px   /* MINIMUM for buttons/links */
```

### 5.3 Compose from Component Library

When creating buttons, cards, badges, or forms, FIRST check if a component style exists:

```css
/* In your .module.css file */
.submitButton {
  composes: btn-primary from '@/styles/components/buttons.css';
}

.vehicleCard {
  composes: card-interactive from '@/styles/components/cards.css';
}

.gainBadge {
  composes: badge-gain from '@/styles/components/badges.css';
}
```

### 5.4 Available Component Classes

#### Buttons (styles/components/buttons.css)
- `.btn-primary` - Lime CTAs (user actions)
- `.btn-secondary` - Outline buttons
- `.btn-teal` - Positive/success actions
- `.btn-ghost` - Minimal/tertiary
- `.btn-icon` - Icon-only buttons
- `.btn-danger` - Destructive actions

#### Cards (styles/components/cards.css)
- `.card` - Base card
- `.card-interactive` - Clickable
- `.card-elevated` - With shadow
- `.card-teal` - Teal border
- `.card-dashed` - Empty state

#### Badges (styles/components/badges.css)
- `.badge-success` - Teal (completed/positive)
- `.badge-gain` - Teal for "+99" style gains
- `.badge-warning` - Amber (caution - sparingly)
- `.badge-lime` - Emphasis (premium/featured)
- `.pill-active` - Teal active filters

#### Progress (styles/components/progress.css)
- `.progress-track` - Bar background
- `.progress-fill-stock` - Blue fill
- `.progress-fill-improved` - Teal fill
- `.metric-row` - Full metric layout

### 5.5 Module CSS = Layout Only

Page `.module.css` files should contain ONLY:
1. Layout (grid, flex)
2. Page-specific spacing
3. Composition from shared components

```css
/* ✅ CORRECT - layout focused */
.pageGrid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--gap-md);
  padding: var(--padding-page-x);
}

@media (min-width: 768px) {
  .pageGrid {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

### 5.6 Native App Compatibility

This token system maps directly to React Native:

```javascript
// Web CSS
background: var(--color-accent-lime);

// React Native (auto-generated)
backgroundColor: tokens.accentLime,
```

Always think: "Will this style work in React Native?"

- ✅ Simple properties (background, padding, margin)
- ✅ Flexbox layout
- ❌ CSS Grid (use Flexbox instead when possible)
- ❌ `::before`/`::after` pseudo-elements
- ❌ Complex selectors

### 5.7 Pre-Flight Checklist

Before submitting CSS code:

| Check | Question |
|-------|----------|
| ☐ No hardcoded colors | Using `--color-*` tokens? |
| ☐ No hardcoded spacing | Using `--space-*` tokens? |
| ☐ Touch targets | Buttons/links min 44px? |
| ☐ Component reuse | Using existing component class? |
| ☐ Safe area insets | Bottom elements use safe area? |

---

## 6. Data Visualization UI/UX

### 6.1 Chart Type Decision Tree

| Data Type | USE | DO NOT USE |
|-----------|-----|------------|
| Trend over time (continuous) | Line Chart, Area Chart | Bar Chart, Pie Chart |
| Trend over time (discrete days/weeks) | Vertical Bar Chart | Line Chart (if <7 points), Pie |
| Comparison between categories | **Horizontal** Bar Chart | Vertical Bar Chart |
| Part-to-whole (≤4 segments) | Donut Chart | Pie Chart |
| Part-to-whole (>4 segments) | Horizontal Stacked Bar | Pie Chart, Donut |
| Single KPI with goal | Progress Ring / Progress Bar | Any multi-element chart |
| Range data (min/max) | Range Bar | Standard bar |
| Distribution / Correlation | Scatter Plot (with onboarding) | — |

### 6.2 Banned Patterns

- ❌ **Pie charts** — Always use Donut instead
- ❌ **3D effects** — Flat only
- ❌ **Heavy drop shadows on charts**
- ❌ **Gridlines by default** — Only add if user requests precision reading
- ❌ **Separate legends** — Use inline/direct labeling instead
- ❌ **Vertical bars for comparison** — Use horizontal bars

### 6.3 Visual Hierarchy (The Pyramid)

```
┌─────────────────────────────────────────────────────────────┐
│  LEVEL 1: THE PULSE (Top)                                   │
│  - 1-3 large KPI cards with trend indicators                │
│  - Font: text-4xl to text-6xl, font-bold                    │
│  - Include: ↑↓ trend icon + % change + sparkline            │
├─────────────────────────────────────────────────────────────┤
│  LEVEL 2: THE CONTEXT (Middle)                              │
│  - Interactive charts (Line, Bar, Area)                     │
│  - Time range selector: [D | W | M | 6M | Y]                │
│  - Tappable summary stats below chart                       │
├─────────────────────────────────────────────────────────────┤
│  LEVEL 3: THE GRAIN (Bottom / Hidden)                       │
│  - Data tables, transaction lists                           │
│  - Hidden behind "View Details" button or at scroll bottom  │
└─────────────────────────────────────────────────────────────┘
```

### 6.4 Progressive Disclosure (Size = Functionality)

| Size | Functionality | Use Case |
|------|--------------|----------|
| **Small (h-16 to h-24)** | Static, no gridlines, no axis labels, no interactivity | Thumbnail previews, sparklines in KPI cards |
| **Medium (h-48 to h-72)** | Full width, axis labels, hover/touch states, time range selector | Main dashboard charts |
| **Large (h-96+)** | Full interactivity, summary stats, overlays, filters | Detail/drill-down views |

**Rule:** Small charts must link to larger versions. Never show a static chart without a path to more detail.

### 6.5 Chart Color System

```typescript
// AutoRev Brand Color System for Charts
const CHART_COLORS = {
  // Backgrounds
  bgPrimary: '#0d1b2a',
  bgSecondary: '#1b263b',
  bgCard: 'rgba(255, 255, 255, 0.04)',
  
  // Chart-Specific Colors
  chartBaseline: '#3b82f6',   // Blue - Stock/baseline data
  chartModified: '#10b981',   // Teal - Modified/improved data
  chartOutline: 'rgba(255, 255, 255, 0.15)',
  chartGrid: 'rgba(255, 255, 255, 0.08)',
  
  // Accent Colors
  lime: '#d4ff00',            // Emphasis, CTAs
  teal: '#10b981',            // Improvements, gains, selections
  blue: '#3b82f6',            // Baseline, stock values
};
```

### 6.6 Semantic Colors (Status)

```typescript
const STATUS_COLORS = {
  positive: '#10b981',     // Teal - Success, growth, on-track
  warning: '#f59e0b',      // Amber - Caution, approaching limit
  negative: '#ef4444',     // Red - Critical, decline, over-limit
  neutral: '#94a3b8',      // Slate - No status, informational
};
```

### 6.7 Category Comparison Rules

- **2 categories:** Blue (#3b82f6) vs Teal (#10b981)
- **3-4 categories:** Use a single-hue progression (blue-400 → blue-700)
- **5-6 categories:** Use distinct hues, but group excess into "Other"
- **>6 categories:** STOP. Simplify the visualization.

### 6.8 Chart Title Formula

Every chart card MUST have an interpretive title:

```
BAD:  "Revenue"
BAD:  "Revenue - Last 30 Days"
GOOD: "Revenue is up 12% this month, totaling $45,230"
```

**Formula:** `[Metric] is [direction] [percentage] [timeframe], totaling [value]`

### 6.9 Direct Labeling Rules

- Label the endpoint of line charts with the current value
- Label the highest/lowest bars directly
- Place totals inline with legend items

```tsx
// DO THIS (inline legend with values)
<div className="flex justify-between">
  <span className="flex items-center gap-2">
    <span className="w-3 h-3 rounded-full bg-blue-500" />
    Team A
  </span>
  <span className="font-semibold">186 pts</span>
</div>

// NOT THIS (separate legend)
<Legend /> // Forces eye-tracking
```

### 6.10 Loading & Empty States

#### Skeleton Loading

NEVER show blank space while fetching. Use shimmer skeletons:

```tsx
<Skeleton className="h-[200px] w-full rounded-xl" />  // Chart area
<Skeleton className="h-8 w-32" />                      // KPI value
<Skeleton className="h-4 w-48" />                      // Title
```

#### Empty States

If data array is empty, show a zero-state with CTA:

```tsx
if (data.length === 0) {
  return (
    <EmptyState
      icon={<ChartIcon />}
      title="No activity yet"
      description="Start tracking to see your progress here."
      action={<Button>Get Started</Button>}
    />
  );
}
```

### 6.11 Code Architecture

#### Data Transformation in Hooks

Keep transformation logic OUT of components:

```tsx
// hooks/useDashboardData.ts
export function useDashboardData(timeRange: TimeRange) {
  const { data, isLoading, error } = useQuery(...);
  
  const chartData = useMemo(() => {
    if (!data) return [];
    return data.map(row => ({
      date: formatDate(row.created_at),
      value: row.amount,
    }));
  }, [data]);
  
  return { chartData, summary, isLoading, error };
}
```

#### Memoization Requirements

ALWAYS wrap chart data in `useMemo`:

```tsx
// ❌ BAD - causes re-render jitter
const chartData = data.map(d => ({ x: d.date, y: d.value }));

// ✅ GOOD
const chartData = useMemo(
  () => data.map(d => ({ x: d.date, y: d.value })),
  [data]
);
```

### 6.12 Pre-Flight Checklist

Before submitting ANY visualization code, verify:

| Check | Question |
|-------|----------|
| ☐ Hierarchy | Is the most important number the largest element? |
| ☐ Title | Does the title interpret the data (not just label it)? |
| ☐ Color | Is color used ONLY for semantic meaning? |
| ☐ Labels | Are values labeled directly (no separate legend)? |
| ☐ Loading | Is there a skeleton state while fetching? |
| ☐ Empty | Is there a zero-state if data is empty? |
| ☐ Error | Is there a soft error state (not a crash)? |
| ☐ Memo | Is chart data wrapped in useMemo? |
| ☐ 5-Second | Can user assess data health in 5 seconds? |
| ☐ Tufte | What have you REMOVED to make this cleaner? |

---

## 7. AI/AL Constraints

AL (AutoRev AI) behavior rules:

- AL tool usage must follow AL.md exactly
- Prefer `get_car_ai_context` when available
- Do not call multiple tools redundantly
- Always consider user tier and credit limits
- Responses must be helpful, factual, and grounded in real data

**Never hallucinate specs, pricing, or issues.**

---

## 8. Tier & Feature Gating

AutoRev uses tier-based feature gating.

### Tiers

- free → collector → tuner → admin

### Rules

- Always respect tier access defined in `tierAccess` and documentation
- Do NOT bypass gates unless `IS_BETA` is explicitly referenced
- UI components must use `PremiumGate` for gated features
- APIs must enforce auth and tier checks where applicable

**If unsure whether a feature is gated, STOP and ask.**

---

## 9. Performance Data Integrity

Performance data integrity is critical.

### Rules

- Dyno and lap time data must reflect real-world measurements
- Always preserve stock vs modified distinctions
- Never average or fabricate performance metrics
- Always include context (tires, conditions, source) when displaying data

---

## 10. No Duplication (MECE Principle)

**CRITICAL:** Before creating ANY new file, function, component, or pattern, you MUST search for existing implementations. This codebase follows the MECE principle: Mutually Exclusive, Collectively Exhaustive.

### Cardinal Rules

1. **NEVER create a new file without searching first** - Use grep/glob to find similar files
2. **NEVER duplicate functionality** - Extend or modify existing code instead
3. **NEVER create parallel implementations** - One source of truth per feature
4. **ALWAYS ask "Does this already exist?"** - The answer is often YES

### Mandatory Pre-Creation Checklist

Before creating ANYTHING, complete this checklist:

```
STOP and search:
1. File exists? → Glob for similar names
2. Function exists? → Grep for similar logic
3. Component exists? → Check components/ directory
4. Service exists? → Check lib/ directory
5. Type exists? → Check types/ directory
6. Style exists? → Check styles/ and *.module.css
```

### Search Commands (Run These First!)

#### Before Creating a New Component
```bash
# Search by name pattern
glob "**/*{keyword}*.jsx"
glob "**/*{keyword}*.tsx"

# Search for similar functionality
grep -r "similar function name or pattern" components/
```

#### Before Creating a New Service/Utility
```bash
# Check lib/ directory first
ls lib/
grep -r "functionName" lib/

# Search for similar patterns
grep -r "export.*{keyword}" lib/
```

#### Before Creating a New API Route
```bash
# Check existing routes
ls app/api/
grep -r "similar endpoint" app/api/
```

#### Before Creating a New Type/Interface
```bash
# Check types directory
ls types/
grep -r "interface {Name}" types/
grep -r "type {Name}" types/
```

### Codebase Organization (Know Where Things Live)

| Category | Location | Before Creating, Check... |
|----------|----------|---------------------------|
| Components | `components/` | Similar UI patterns |
| Services | `lib/` | Similar data operations |
| Types | `types/` | Existing interfaces |
| API Routes | `app/api/` | Existing endpoints |
| Hooks | `lib/hooks/` | Custom hooks |
| Utilities | `lib/` | Helper functions |
| Styles | `styles/` | Shared CSS |
| Database | `lib/*Service.js` | Existing DB operations |

### Quick Decision Tree

```
Need to create something new?
│
├─ Search for existing implementation
│   ├─ Found exact match? → USE IT
│   ├─ Found similar? → EXTEND IT
│   └─ Found nothing? → Continue...
│
├─ Can it be added to existing file?
│   ├─ Yes, file < 500 lines → ADD TO EXISTING
│   └─ No, file too large → Continue...
│
├─ Is this truly unique functionality?
│   ├─ Yes → CREATE NEW (document why)
│   └─ No → RE-SEARCH (you missed something)
│
└─ CREATE NEW FILE
    └─ Follow directory conventions
    └─ Update relevant docs
```

### When You CAN Create New Files

Only create a new file when ALL of these are true:

1. ✅ You've searched and confirmed nothing similar exists
2. ✅ The functionality is genuinely new and distinct
3. ✅ It cannot be added to an existing file without bloating it
4. ✅ It follows the established directory structure
5. ✅ It doesn't overlap with existing responsibilities

### Enforcement

If you're about to create a new file, STOP and:

1. Run the search commands above
2. List what you searched for
3. Explain why existing code won't work
4. Only then proceed with creation

**No searching = No creating. No exceptions.**

---

## 11. Database Audit Procedures

Use these procedures when asked to audit or verify the database structure.

### 11.1 Identifier Consistency (car_slug vs car_id)

```sql
-- Tables using car_slug WITHOUT car_id (should be zero)
SELECT table_name, column_name
FROM information_schema.columns
WHERE column_name = 'car_slug'
  AND table_schema = 'public'
  AND table_name NOT IN (
    SELECT table_name FROM information_schema.columns
    WHERE column_name = 'car_id' AND table_schema = 'public'
  );

-- Rows with car_slug but NULL car_id (data integrity issue)
SELECT 'community_insights' as tbl, COUNT(*) FROM community_insights WHERE car_slug IS NOT NULL AND car_id IS NULL
UNION ALL SELECT 'car_dyno_runs', COUNT(*) FROM car_dyno_runs WHERE car_slug IS NOT NULL AND car_id IS NULL
UNION ALL SELECT 'car_track_lap_times', COUNT(*) FROM car_track_lap_times WHERE car_slug IS NOT NULL AND car_id IS NULL;
```

### 11.2 Missing Foreign Key Indexes

```sql
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = tc.table_name
      AND indexdef LIKE '%' || kcu.column_name || '%'
  );
```

### 11.3 Orphaned Records

```sql
SELECT 'car_issues' as tbl, COUNT(*) FROM car_issues ci
  WHERE ci.car_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM cars c WHERE c.id = ci.car_id)
UNION ALL SELECT 'car_dyno_runs', COUNT(*) FROM car_dyno_runs dr
  WHERE dr.car_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM cars c WHERE c.id = dr.car_id);
```

### 11.4 Duplicate Data Detection

```sql
-- Duplicate car slugs (should be zero)
SELECT slug, COUNT(*) FROM cars GROUP BY slug HAVING COUNT(*) > 1;

-- Duplicate issues per car
SELECT car_id, title, COUNT(*) 
FROM car_issues 
GROUP BY car_id, title 
HAVING COUNT(*) > 1;
```

### 11.5 Auto-Populate Triggers Verification

```sql
SELECT t.table_name,
       CASE WHEN tg.trigger_name IS NOT NULL THEN '✓' ELSE '✗ MISSING' END as has_trigger
FROM (
  VALUES ('community_insights'), ('car_dyno_runs'), ('car_track_lap_times'),
         ('document_chunks'), ('vehicle_maintenance_specs'), ('vehicle_service_intervals')
) AS t(table_name)
LEFT JOIN information_schema.triggers tg 
  ON tg.event_object_table = t.table_name 
  AND tg.trigger_name LIKE 'auto_car_id%';
```

### 11.6 Expected Results (Healthy Database)

- Zero tables with car_slug but no car_id column
- Zero rows with car_slug but NULL car_id
- Zero orphaned records
- Zero duplicate slugs/profiles
- All required triggers present
- All required RPC functions present
- Minimal car_slug direct queries in code (only URL parsing)

---

## 12. Empty Table Policy

Some database tables are intentionally empty.

### Rules

- Do NOT assume empty tables are unused
- Do NOT remove or repurpose empty tables
- Treat empty tables as planned features unless told otherwise

---

## Summary Checklist

Before completing ANY task, verify:

| Category | Check |
|----------|-------|
| **Verification** | Did I run proof, not just assume it worked? |
| **Database** | Am I using car_id (not car_slug)? Using correct source table? |
| **Brand** | Lime for CTAs, Teal for improvements, Blue for baseline? |
| **CSS** | Using tokens, not hardcoded values? |
| **Charts** | Title interprets data? Direct labels? Loading states? |
| **Scope** | Only changed what was requested? |
| **Duplication** | Searched before creating anything new? |
| **Types** | Explicit types, no `any`? |
| **Tests** | Added if behavior changed? |
| **Evidence** | Included in my completion report? |

---

*This document is auto-generated from the `.cursor/rules/` directory and user settings.*
