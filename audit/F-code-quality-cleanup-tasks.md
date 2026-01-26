# Code Quality Cleanup Tasks

**Reference:** `docs/SOURCE_OF_TRUTH.md` - Naming Conventions section  
**Audit:** `audit/F-code-quality-audit-results.md`  
**Created:** 2026-01-25

---

## Priority 1: Generic Handler Names (7 files)

Per `SOURCE_OF_TRUTH.md`, handlers must follow `handle{Domain}{Action}` pattern.

### Task 1.1: Fix FullscreenQuestionnaire.jsx

**File:** `components/questionnaire/FullscreenQuestionnaire.jsx`  
**Line:** 104

```javascript
// ❌ CURRENT (line 104)
const handleSubmit = useCallback(async () => {

// ✅ FIX TO (per SOURCE_OF_TRUTH canonical: handleGoalSubmit pattern)
const handleQuestionnaireAnswerSubmit = useCallback(async () => {
```

**Also update references:**
- Line 321: `onClick={handleSubmit}` → `onClick={handleQuestionnaireAnswerSubmit}`

**VERIFY:** `grep -n "handleSubmit" components/questionnaire/FullscreenQuestionnaire.jsx` returns 0 results

---

### Task 1.2: Fix QuestionCard.jsx

**File:** `components/questionnaire/QuestionCard.jsx`  
**Line:** 83

```javascript
// ❌ CURRENT (line 83)
const handleSubmit = useCallback(async () => {

// ✅ FIX TO
const handleQuestionAnswerSubmit = useCallback(async () => {
```

**Also update references:**
- Line 172: `onClick={handleSubmit}` → `onClick={handleQuestionAnswerSubmit}`

**VERIFY:** `grep -n "handleSubmit" components/questionnaire/QuestionCard.jsx` returns 0 results

---

### Task 1.3: Fix CostInputForm.jsx (Admin)

**File:** `app/admin/components/CostInputForm.jsx`  
**Lines:** 117, 126

```javascript
// ❌ CURRENT (line 117)
const handleChange = (e) => {

// ✅ FIX TO
const handleCostInputChange = (e) => {

// ❌ CURRENT (line 126)
const handleSubmit = async (e) => {

// ✅ FIX TO (per SOURCE_OF_TRUTH: handleServiceLogSubmit pattern)
const handleCostEntrySubmit = async (e) => {
```

**Also update references:**
- Line 221: `onSubmit={handleSubmit}` → `onSubmit={handleCostEntrySubmit}`
- Lines 229, 241, 256, 278, 291, 303, 315: `onChange={handleChange}` → `onChange={handleCostInputChange}`

**VERIFY:** `grep -n "handleSubmit\|handleChange" app/admin/components/CostInputForm.jsx` returns 0 generic matches

---

### Task 1.4: Fix Lap Times Page (Internal)

**File:** `app/internal/lap-times/page.jsx`  
**Line:** 54

```javascript
// ❌ CURRENT (line 54)
async function handleSubmit(e) {

// ✅ FIX TO (per SOURCE_OF_TRUTH canonical: handleLapTimeSubmit)
async function handleLapTimeSubmit(e) {
```

**Also update references:**
- Line 115: `onSubmit={handleSubmit}` → `onSubmit={handleLapTimeSubmit}`

**VERIFY:** `grep -n "handleSubmit" app/internal/lap-times/page.jsx` returns 0 results

---

### Task 1.5: Fix Dyno Page (Internal)

**File:** `app/internal/dyno/page.jsx`  
**Line:** 65

```javascript
// ❌ CURRENT (line 65)
async function handleSubmit(e) {

// ✅ FIX TO (per SOURCE_OF_TRUTH canonical: handleDynoRunSubmit)
async function handleDynoRunSubmit(e) {
```

**Also update references:**
- Line 135: `onSubmit={handleSubmit}` → `onSubmit={handleDynoRunSubmit}`

**VERIFY:** `grep -n "handleSubmit" app/internal/dyno/page.jsx` returns 0 results

---

### Task 1.6: Fix Manual Entry Page (Internal)

**File:** `app/internal/manual-entry/page.jsx`  
**Line:** 90

```javascript
// ❌ CURRENT (line 90)
async function handleSubmit(e) {

// ✅ FIX TO
async function handleManualCarEntrySubmit(e) {
```

**Also update references:**
- Line 141: `onSubmit={handleSubmit}` → `onSubmit={handleManualCarEntrySubmit}`

**VERIFY:** `grep -n "handleSubmit" app/internal/manual-entry/page.jsx` returns 0 results

---

### Task 1.7: Fix Knowledge Page (Internal)

**File:** `app/internal/knowledge/page.jsx`  
**Line:** 37

```javascript
// ❌ CURRENT (line 37)
async function handleSubmit(e) {

// ✅ FIX TO
async function handleKnowledgeBaseSubmit(e) {
```

**Also update references:**
- Line 82: `onSubmit={handleSubmit}` → `onSubmit={handleKnowledgeBaseSubmit}`

**VERIFY:** `grep -n "handleSubmit" app/internal/knowledge/page.jsx` returns 0 results

---

## Priority 2: Empty Catch Blocks (4 files)

Per `SOURCE_OF_TRUTH.md`, errors should be logged with context.

### Task 2.1: Fix trackVenueFetcher.js

**File:** `lib/eventSourceFetchers/trackVenueFetcher.js`  
**Lines:** 440, 455, 605

```javascript
// ❌ CURRENT (3 instances)
} catch (e) {}

// ✅ FIX TO (add contextual logging)
} catch (e) {
  // Silently ignore parse errors for optional field extraction
  // console.debug('[trackVenueFetcher] Optional field parse failed:', e.message);
}
```

OR if the catch is for critical data:

```javascript
} catch (e) {
  console.warn('[trackVenueFetcher] Failed to parse venue data:', e.message);
}
```

**VERIFY:** Review each catch block and determine if logging or comment is appropriate

---

### Task 2.2: Fix icalAggregator.js

**File:** `lib/eventSourceFetchers/icalAggregator.js`  
**Line:** 129

```javascript
// ❌ CURRENT
} catch (e) {}

// ✅ FIX TO
} catch (e) {
  // Silently ignore iCal parse errors for malformed entries
  // Individual event parse failures shouldn't stop the aggregator
}
```

**VERIFY:** `grep -n "catch.*{}" lib/eventSourceFetchers/icalAggregator.js` returns 0 results

---

## Priority 3: Unused Variables (Top 10 Files)

Run `npm run lint` and address these files first:

### Task 3.1: Fix ALPageClient.jsx

**File:** `app/(app)/al/ALPageClient.jsx`

| Line | Unused Variable | Action |
|------|-----------------|--------|
| 26 | `loadALPreferences` | Remove import or prefix with `_` |
| 27 | `saveALPreferences` | Remove import or prefix with `_` |
| 28 | `loadALBookmarks` | Remove import or prefix with `_` |
| 29 | `addKnownCar` | Remove import or prefix with `_` |
| 259 | `getToolActivityLabel` | Remove function or prefix with `_` |
| 306 | `router` | Remove or use |
| 334 | `alPreferences` | Remove or use |
| 791 | `collectedToolResults` | Change `let` to `const` or remove |

**VERIFY:** `npm run lint -- --no-warn-ignored app/(app)/al/ALPageClient.jsx` shows no unused-vars warnings

---

### Task 3.2: Fix BuildDetailSheet.jsx

**File:** `app/(app)/community/BuildDetailSheet.jsx`

| Line | Unused Variable | Action |
|------|-----------------|--------|
| 16 | `useState` | Remove from import |
| 16 | `useEffect` | Remove from import |
| 155 | `partsData` | Remove or use |
| 157 | `vehicleData` | Remove or use |
| 252 | `hpGain` | Remove or use |

---

### Task 3.3: Fix CommentsSheet.jsx

**File:** `app/(app)/community/CommentsSheet.jsx`

| Line | Unused Variable | Action |
|------|-----------------|--------|
| 52 | `postTitle` | Rename to `_postTitle` or remove from destructure |
| 76 | `guidance` | Remove or use |

---

### Task 3.4: Fix EventsView.jsx

**File:** `app/(app)/community/EventsView.jsx`

| Line | Unused Variable | Action |
|------|-----------------|--------|
| 66 | `ChevronRightIcon` | Remove from import |

---

### Task 3.5-3.10: Additional Files

Address unused variables in these files (run `npm run lint` for specific lines):

- [ ] `app/api/webhooks/stripe/route.js` - `charges` unused
- [ ] `app/api/admin/usage/route.js` - `contentMetricsResult`, `sizeData` unused
- [ ] `app/api/admin/vercel-status/route.js` - cron destructure variables unused
- [ ] `app/api/admin/web-vitals/route.js` - `dailyError` unused
- [ ] `app/api/ai-mechanic/route.js` - `errors` unused
- [ ] `app/api/ai-mechanic/feedback/route.js` - `errors` unused

**VERIFY:** Total unused-vars warnings reduced from 122 to <20

---

## Priority 4: TODO Comments (9 items)

### Task 4.1: PerformanceGoals.jsx TODOs

**File:** `components/PerformanceGoals.jsx`  
**Lines:** 423, 435, 442, 453

These TODOs indicate incomplete API integration. Options:
1. **Implement the API calls** (if feature is needed)
2. **Remove the TODO and add a comment** explaining local-only behavior
3. **Create a GitHub issue** to track this work

```javascript
// Current TODO example (line 423):
// TODO: Save to API

// Option A - Implement:
const response = await fetch('/api/users/${userId}/performance-goals', {
  method: 'POST',
  body: JSON.stringify(newGoal)
});

// Option B - Document intentional local-only:
// NOTE: Goals are stored locally only. API persistence not implemented.
```

---

### Task 4.2: DynoLogModal.jsx TODO

**File:** `components/DynoLogModal.jsx`  
**Line:** 213

```javascript
// TODO: Implement actual upload to Supabase storage
```

**Action:** Either implement Supabase storage upload or create GitHub issue to track.

---

### Task 4.3: Other TODOs (Lower Priority)

| File | Line | TODO | Recommended Action |
|------|------|------|-------------------|
| `components/ImageUploader.jsx` | 280 | Update on server | Create issue or implement |
| `components/providers/CompareProvider.jsx` | 271 | Fetch car data from slugs | Create issue |
| `components/tuning-shop/FactoryConfig.jsx` | 43 | Analytics endpoint | Create issue |
| `components/tuning-shop/WheelTireConfigurator.jsx` | 42 | Analytics endpoint | Create issue |

---

## Priority 5: Import Ordering (Optional Cleanup)

ESLint shows 400+ import ordering warnings. These are cosmetic but improve consistency.

### Quick Fix Option

Add to `.eslintrc.js` to auto-fix on save:
```javascript
rules: {
  'import/order': ['warn', {
    groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
    'newlines-between': 'always',
    alphabetize: { order: 'asc' }
  }]
}
```

Then run: `npm run lint -- --fix`

### Manual Fix Option

Fix imports in most-edited files first:
- `app/(app)/al/ALPageClient.jsx`
- `app/(app)/community/BuildDetailSheet.jsx`
- `app/(app)/community/EventsView.jsx`

---

## Verification Checklist

After completing all tasks, verify:

- [ ] `grep -rn "const handleSubmit\|const handleChange\|function handleSubmit\|function handleChange" app/ components/ --include="*.jsx" | grep -v "handle[A-Z][a-z]*Submit\|handle[A-Z][a-z]*Change"` returns no results
- [ ] `grep -rn "catch.*{.*}" --include="*.js" lib/eventSourceFetchers/` returns no empty catches
- [ ] `npm run lint 2>&1 | grep "no-unused-vars" | wc -l` is less than 20
- [ ] `npm run lint` total warnings reduced from 536 to <200

---

## Summary

| Priority | Category | Tasks | Est. Time |
|----------|----------|-------|-----------|
| 1 | Generic Handler Names | 7 files | 30 min |
| 2 | Empty Catch Blocks | 4 instances in 2 files | 15 min |
| 3 | Unused Variables | 10 priority files | 1 hour |
| 4 | TODO Comments | 9 items | 30 min (triage) |
| 5 | Import Ordering | Optional | 10 min (auto-fix) |

**Total Estimated Time:** 2-3 hours for Priority 1-4

---

## Reference: SOURCE_OF_TRUTH Handler Patterns

From `docs/SOURCE_OF_TRUTH.md`:

| Component | Handler Name | Purpose |
|-----------|--------------|---------|
| `EventFilters.jsx` | `handleFilterChange` | Filter field changes |
| `PerformanceGoals.jsx` | `handleGoalSubmit` | Add performance goal |
| `FeedbackWidget.jsx` | `handleFeedbackSubmit` | Submit feedback form |
| `ServiceLogModal.jsx` | `handleServiceLogSubmit` | Log service record |
| `TrackTimeLogModal.jsx` | `handleLapTimeSubmit` | Log lap time |
| `DynoLogModal.jsx` | `handleDynoRunSubmit` | Log dyno result |
| `ShareBuildModal.jsx` | `handleShareSubmit` | Share build to community |
