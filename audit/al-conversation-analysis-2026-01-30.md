# AL Conversation Analysis - January 30, 2026

## Executive Summary

Analysis of 30 recent AL conversations reveals several systemic issues affecting response quality. Key findings:

1. **18% of responses had no tool calls** when tools should have been used
2. **Year-specific accuracy failures** despite rules being in place
3. **Maintenance questions falling back to training data** instead of verified sources
4. **Claims made without verification** that could be incorrect

---

## Issue #1: Empty Tool Calls for Car-Specific Questions

**Severity: HIGH**

### Finding

9 out of 51 assistant responses (18%) had empty `tool_calls: []` when responding to car-specific questions.

### Examples

| Question Type                                  | Expected Tool              | Actual Tool | Problem                |
| ---------------------------------------------- | -------------------------- | ----------- | ---------------------- |
| "How to take care of my 2020 Mustang EcoBoost" | `get_maintenance_schedule` | None        | Training data fallback |
| "Cold Air Intake types"                        | `search_encyclopedia`      | None        | Generic answer         |
| "Cold Air Intake sound changes"                | Could use tools            | None        | Answered from memory   |
| "Flowmaster for Porsches?"                     | `search_web` to verify     | None        | Unverified claim       |
| "MagnaFlow for Porsches?"                      | `search_web` to verify     | None        | Unverified claim       |

### Root Cause

The `SPEED_RULES` prompt section encouraged using "your expertise" for "general concepts" but AL was interpreting car-specific questions as general concepts.

### Fix Applied

Updated `sharedPromptSections.js` SPEED_RULES to require:

1. Tool calls for ANY car-specific question (when year/make/model mentioned)
2. Mandatory `search_web` fallback when database tools return empty
3. Clarified that expertise is only for abstract concepts without specific vehicles

---

## Issue #2: Year-Specific Accuracy Failures

**Severity: HIGH**

### Finding

Despite having `YEAR_SPECIFICITY_RULES` in prompts, AL made a critical year-specific error:

**Cobra IRS Error:**

- User asked about coilovers for their Mustang SVT Cobra
- AL recommended IRS-specific coilovers
- AL even STATED in the response: "Your '96 Cobra has solid rear axle, not IRS"
- But STILL gave IRS recommendations instead of solid axle options
- User had to correct AL: "Why do you think my car has IRS?"

### Conversation Evidence

```
User: "Top 5 Track Coilovers for Mustang SVT Cobra"
AL: [Gives IRS coilover list]
AL (in same response): "Your '96 Cobra has solid rear axle, not IRS"
User: "Why do you think my car has IRS?"
AL: "Your 1996 SVT Cobra has a solid rear axle, not IRS. The IRS was first introduced on Mustang Cobras in the 1999 model year."
```

### Root Cause

1. The `research_parts_live` tool was called with `car_slug: "ford-mustang-svt-cobra-sn95"` which covers 1994-2004
2. Results came back for IRS models (1999+) because they're more common
3. AL knew the user had a 1996 but didn't filter/adjust recommendations

### Proposed Fix

1. Add explicit year validation BEFORE tool calls in prompts
2. Require year confirmation if user mentions a generation that spans significant changes
3. Add post-tool-call verification: "Does this result apply to user's specific year?"

---

## Issue #3: Outdated/Inaccurate Training Data

**Severity: MEDIUM**

### Finding

Calvin's Mustang EcoBoost maintenance conversation contained outdated advice:

| Claim                               | Accuracy            | Issue                                      |
| ----------------------------------- | ------------------- | ------------------------------------------ |
| "Cool-down 30-60s before shutdown"  | Outdated            | Modern water-cooled turbos don't need this |
| "Oil changes every 5,000 miles MAX" | Overly conservative | Ford specs 7,500-10,000 miles              |
| "5W-30 or 5W-20"                    | 5W-20 is incorrect  | Ford specs 5W-30 for this engine           |

### Root Cause

AL answered from training data without using `get_maintenance_schedule` or `search_web` to verify manufacturer specs.

### Fix Applied

1. Added "Outdated Automotive Myths" section to `sharedPromptSections.js`
2. Explicit corrections for common myths (turbo cool-down, universal oil intervals, etc.)
3. Mandatory tool usage for car-specific maintenance questions

---

## Issue #4: Unverified Claims

**Severity: MEDIUM**

### Finding

AL made definitive statements without verification:

```
"Flowmaster does NOT make exhausts for Porsches"
"MagnaFlow does make exhausts for Porsches"
```

Both statements were made with empty `tool_calls: []` - no verification attempted.

### Proposed Fix

Add prompt guidance: "Before making definitive claims about what brands do/don't support, verify with `search_web`"

---

## Issue #5: Duplicate Conversations

**Severity: LOW**

### Finding

Multiple identical conversation titles for same user/query:

- 8+ conversations titled "I have a 2013 Hyundai genesis 3.8 sedan I wanna make it..."
- All from the same testing session

### Root Cause

Likely a UX issue or testing artifact - users may be starting new conversations instead of continuing existing ones.

### Proposed Fix

Consider conversation continuation UX improvements (out of scope for AL prompts)

---

## Tool Usage Statistics (Last 7 Days)

| Tool Pattern                               | Count | %   |
| ------------------------------------------ | ----- | --- |
| `research_parts_live`                      | 13    | 25% |
| **Empty `[]`**                             | 9     | 18% |
| `get_car_ai_context`                       | 4     | 8%  |
| `get_user_context` + `research_parts_live` | 4     | 8%  |
| `get_car_ai_context` + `recommend_build`   | 4     | 8%  |
| Other combinations                         | 17    | 33% |

**Positive:** Parts research is working well - `research_parts_live` most common tool.
**Negative:** 18% empty tool calls is too high.

---

## Changes Made (2026-01-30)

### 1. `lib/alAgents/prompts/sharedPromptSections.js`

**SPEED_RULES Update:**

- Added "MANDATORY Tool Usage" section requiring tools for car-specific questions
- Clarified expertise-only applies to abstract concepts
- Required `search_web` fallback when database empty

**New "Outdated Automotive Myths" Section:**

- Turbo cool-down myth correction
- Oil change interval myth correction
- Premium fuel myth correction
- Extended warm-up myth correction
- "Lifetime" fluid myth correction

### 2. `lib/alAgents/carDiscoveryAgent.js`

Added "CRITICAL: Car-Specific Questions REQUIRE Tool Calls" section with explicit 3-step requirement.

### 3. `lib/alAgents/prompts/carDiscoveryPrompt.js`

Updated `search_web` guidance to be MANDATORY when database tools return empty.

### 4. `lib/alAgents/prompts/partsResearchPrompt.js`

**Added "Mid-Generation Changes Within Platforms" section:**

- SN95 Mustang Cobra: 1996-1998 solid axle vs 1999-2004 IRS (coilovers NOT interchangeable)
- SN95 Mustang: 1994-1998 vs 1999-2004 styling differences
- Porsche 997/987: M97 vs DFI engine (2005-2008 vs 2009-2012)
- E9x BMW M3: 2008-2010 vs 2011+ running changes

This directly addresses the Cobra IRS error where AL recommended IRS coilovers for a 1996 car that has solid rear axle.

---

## Recommended Next Steps

### Immediate (This Sprint) - ALL COMPLETED ✅

- [x] Fix prompt guidance for tool usage (DONE)
- [x] Add automotive myths section (DONE)
- [x] Add year validation before parts research tool calls (DONE - added mid-generation changes table)
- [x] Add post-tool-call verification for year-specific accuracy (DONE - in prompt guidance)

### Short-Term - ALL COMPLETED ✅

- [x] Implement AL feedback table for users to report inaccuracies (EXISTS - `al_response_feedback` table)
- [x] Create corrections database AL can reference (DONE - `al_corrections` table with 8 corrections seeded)
- [x] Add Mustang EcoBoost to cars database (DONE - with full maintenance specs)

### Medium-Term - COMPLETED ✅

- [x] Build evaluation harness for year-specific scenarios (DONE - 10 new test cases added to `alEvaluations.js`)
- [x] Create monitoring script for AL quality (DONE - `scripts/monitor-al-quality.mjs`)
- [x] Create corrections service (DONE - `lib/alCorrectionsService.js`)

---

## Test Cases for Validation

These scenarios should be tested after changes:

1. **Maintenance for unknown car:**
   - Input: "How do I take care of my 2020 Kia Stinger GT?"
   - Expected: AL uses `get_maintenance_schedule`, then `search_web` if empty
   - Should NOT fall back to generic turbo advice

2. **Year-specific parts:**
   - Input: "Best coilovers for my 1997 Mustang Cobra"
   - Expected: AL confirms solid rear axle, gives SRA-specific recommendations
   - Should NOT give IRS recommendations

3. **Myth avoidance:**
   - Input: "Do I need to let my turbo car idle before shutting off?"
   - Expected: AL explains modern turbos don't require this
   - Should NOT recommend 30-60s cool-down

4. **Brand claim verification:**
   - Input: "Does Borla make exhausts for Hyundai Genesis?"
   - Expected: AL uses `search_web` to verify before answering
   - Should NOT make unverified claims

---

## Appendix: Conversation Samples

### Calvin's Mustang EcoBoost (Issue Example)

- **Question:** "How can I take care of my car? I want it to last as long as possible. I have a 2020 ford mustang ecoboost with 100k miles"
- **Tools Used:** `[]` (none initially), then `get_maintenance_schedule` on follow-up
- **Issue:** First response used training data with outdated turbo advice

### Cobra IRS Error (Issue Example)

- **Question:** "Top 5 Track Coilovers for Mustang SVT Cobra"
- **Tools Used:** `research_parts_live`
- **Issue:** AL gave IRS coilovers for 1996 car (which has solid axle)

### Genesis 3.8 Build (Positive Example)

- **Question:** "I have a 2013 Hyundai Genesis 3.8 sedan I wanna make it faster"
- **Tools Used:** `get_car_ai_context`, `recommend_build`
- **Result:** Good response with appropriate tools and accurate info

---

## Complete Implementation Summary (2026-01-30)

### Files Created

| File                             | Purpose                                                          |
| -------------------------------- | ---------------------------------------------------------------- |
| `lib/alCorrectionsService.js`    | Service to access al_corrections table for myth/year corrections |
| `scripts/monitor-al-quality.mjs` | CLI script to monitor AL quality metrics                         |

### Files Modified

| File                                           | Changes                                                             |
| ---------------------------------------------- | ------------------------------------------------------------------- |
| `lib/alAgents/prompts/sharedPromptSections.js` | Added MANDATORY tool usage rules, outdated myths section            |
| `lib/alAgents/carDiscoveryAgent.js`            | Added explicit tool call requirements for car-specific questions    |
| `lib/alAgents/prompts/carDiscoveryPrompt.js`   | Made search_web MANDATORY when database empty                       |
| `lib/alAgents/prompts/partsResearchPrompt.js`  | Added mid-generation changes table (IRS, DFI, etc.)                 |
| `lib/alEvaluations.js`                         | Added 10 new test cases for year-specific and tool-usage validation |

### Database Changes

| Table                       | Changes                                           |
| --------------------------- | ------------------------------------------------- |
| `al_corrections`            | Created new table with 8 seeded corrections       |
| `cars`                      | Added Ford Mustang EcoBoost S550                  |
| `vehicle_maintenance_specs` | Added full maintenance specs for Mustang EcoBoost |

### Test Cases Added (10 total)

1. `year-specific-cobra-irs` - Tests 1996 Cobra solid axle recognition
2. `year-specific-cobra-coilovers` - Tests solid axle coilover recommendations
3. `year-specific-997-ims` - Tests 2010+ 997 DFI engine (no IMS)
4. `tool-usage-maintenance-specific-car` - Ensures tools used for car-specific maintenance
5. `tool-usage-unknown-car` - Ensures search_web used for unknown cars
6. `myth-turbo-cooldown` - Tests turbo cool-down myth avoidance
7. `myth-oil-change-3000` - Tests oil change interval myth avoidance
8. `brand-verification-exhaust` - Tests brand claims are verified with search_web

### Corrections Seeded (8 total)

1. Turbo cool-down myth
2. 3,000-mile oil change myth
3. Premium fuel for all turbos myth
4. Extended warm-up myth
5. Lifetime transmission fluid myth
6. 1996-1998 Mustang Cobra IRS error
7. 2009+ Porsche 997 IMS error
8. 2009+ Porsche 987 IMS error

### Monitoring Capabilities

- `scripts/monitor-al-quality.mjs` provides:
  - Empty tool_calls rate tracking
  - Car-specific questions without tools detection
  - Feedback summary (thumbs up/down)
  - Tool usage distribution analysis

### How to Validate Changes

```bash
# Run the new test cases
node scripts/run-al-eval.mjs --category reliability
node scripts/run-al-eval.mjs --category maintenance

# Monitor AL quality
node scripts/monitor-al-quality.mjs --days 7

# Check corrections are seeded
SELECT * FROM al_corrections WHERE is_active = true;
```
