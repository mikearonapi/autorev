# AL (AutoRev AI) Comprehensive Audit Prompt

> Use this prompt in a new Cursor chat to thoroughly audit the AL system end-to-end.

---

## Context

AL is AutoRev's AI assistant for automotive enthusiasts. It uses a **multi-agent architecture** with:

- Intent classification (routes queries to specialist agents)
- 8 specialist agents (car_discovery, build_planning, parts_research, knowledge, community_events, performance_data, vision, generalist)
- 25 tools for database/API access
- A formatter agent that cleans responses before users see them
- Streaming responses for real-time UX

**We are experiencing issues with AL** including:

- Empty responses (user sees nothing after "Researching...")
- Responses with only "SOURCES [1] AutoRev" but no content
- Tool calls that complete but produce no output
- Formatting stripping too much content

---

## Audit Instructions

Please conduct a **comprehensive end-to-end audit** of the AL system. For each section below:

1. Read the relevant files
2. Identify any issues, bugs, or improvements
3. Document findings with specific file paths and line numbers
4. Propose fixes with code if issues are found

---

## Part 1: Architecture Review

### 1.1 Entry Points & Routing

Review the main entry points and how queries get routed:

**Files to review:**

- `app/api/ai-mechanic/route.js` - Main API endpoint
- `lib/alOrchestrator.js` - Multi-agent orchestrator
- `lib/alAgents/orchestrator.js` - Intent classification

**Questions to answer:**

- [ ] Is the multi-agent flag (`MULTI_AGENT_ENABLED`) correctly checked?
- [ ] How does streaming vs non-streaming work? Are both paths correct?
- [ ] What happens when intent classification fails?
- [ ] Are there proper error boundaries and fallbacks?
- [ ] Is the conversation context properly passed through the entire flow?

### 1.2 Agent Registry & Creation

Review how agents are defined and created:

**Files to review:**

- `lib/alAgents/index.js` - Agent registry and factory
- `lib/alAgents/baseAgent.js` - Base agent class

**Questions to answer:**

- [ ] Are all 8 agent types properly defined with correct tools?
- [ ] Is the tool assignment correct for each agent's purpose?
- [ ] Does `createAgent()` correctly instantiate agents?
- [ ] Are agent configs (model, maxTokens, tools) appropriate?

### 1.3 Context Building

Review how context is built for the AI:

**Files to review:**

- `lib/aiMechanicService.js` - Context building (`buildAIContext`, `formatContextForAI`)

**Questions to answer:**

- [ ] Is user vehicle context correctly fetched and passed?
- [ ] Is car context from the current page passed?
- [ ] Are database stats correctly included?
- [ ] Is the formatted context too long/short for the system prompt?

---

## Part 2: Prompt Engineering Review

### 2.1 System Prompts

Review ALL specialist agent prompts for quality and consistency:

**Files to review:**

- `lib/alAgents/prompts/sharedPromptSections.js` - Shared prompt components
- `lib/alAgents/prompts/carDiscoveryPrompt.js`
- `lib/alAgents/prompts/buildPlanningPrompt.js`
- `lib/alAgents/prompts/partsResearchPrompt.js`
- `lib/alAgents/prompts/knowledgePrompt.js`
- `lib/alAgents/prompts/communityEventsPrompt.js`
- `lib/alAgents/prompts/performanceDataPrompt.js`
- `lib/alAgents/prompts/visionPrompt.js`
- `lib/alAgents/prompts/generalistPrompt.js`
- `lib/alAgents/prompts/formatterPrompt.js`

**Questions to answer:**

- [ ] Do prompts clearly define the agent's role and boundaries?
- [ ] Are tool usage instructions clear and correct?
- [ ] Are there conflicting instructions between prompts?
- [ ] Do prompts handle "no results found" scenarios?
- [ ] Are there instructions that could cause empty responses?
- [ ] Is the response format clearly specified?
- [ ] Are there any instructions to output internal-only blocks without user content?

### 2.2 Prompt Assembly

Review how prompts are assembled with context:

**Files to review:**

- `lib/alAgents/baseAgent.js` - `buildSystemPrompt()` method
- `lib/alConfig.js` - `buildALSystemPrompt()` (monolithic path)

**Questions to answer:**

- [ ] Is context injection working correctly?
- [ ] Are user vehicles, favorites, location properly included?
- [ ] Is the final prompt size reasonable (check token estimates)?
- [ ] Are there edge cases where context injection fails silently?

---

## Part 3: Tools Review

### 3.1 Tool Definitions

Review tool schemas and configurations:

**Files to review:**

- `lib/alConfig.js` - `AL_TOOLS` array with tool definitions

**Questions to answer:**

- [ ] Are all 25 tools properly defined with correct schemas?
- [ ] Are required vs optional parameters correctly marked?
- [ ] Do tool descriptions clearly explain when to use them?
- [ ] Are there deprecated tools that should be removed?

### 3.2 Tool Implementations

Review the actual tool implementations:

**Files to review:**

- `lib/alTools.js` - All tool implementations

**Questions to answer:**

- [ ] Does each tool have proper error handling?
- [ ] Do tools return consistent response formats?
- [ ] What happens when a tool returns empty results?
- [ ] Are database queries efficient (using car_id, not slug where possible)?
- [ ] Do tools handle missing/null parameters gracefully?
- [ ] Are there tools that could hang or timeout?

### 3.3 Tool Execution

Review how tools are executed:

**Files to review:**

- `lib/alAgents/baseAgent.js` - `executeTools()` method
- `lib/alTools.js` - `executeToolCall()` function
- `lib/alToolCache.js` - Tool caching

**Questions to answer:**

- [ ] Is tool execution properly wrapped with error handling?
- [ ] Are tool results correctly formatted for Claude?
- [ ] Is caching working correctly (not stale, not missing)?
- [ ] What happens if a tool throws an exception?

---

## Part 4: Response Processing Review

### 4.1 Agent Response Generation

Review how agents generate responses:

**Files to review:**

- `lib/alAgents/baseAgent.js` - `execute()` method and `callClaude()`

**Questions to answer:**

- [ ] Is the tool loop correctly implemented (max iterations)?
- [ ] Are text blocks properly accumulated?
- [ ] What happens if Claude returns no text content?
- [ ] Is streaming (`onText` callback) working correctly?
- [ ] Are usage stats correctly tracked?

### 4.2 Formatter Agent (CRITICAL)

Review the formatter that processes responses before users see them:

**Files to review:**

- `lib/alAgents/formatterAgent.js` - `formatResponse()` and `createStreamFormatter()`
- `lib/alAgents/prompts/formatterPrompt.js` - Formatter instructions

**Questions to answer:**

- [ ] What content does `stripInternalBlocks()` remove?
- [ ] What does `startsWithContent()` consider valid content?
- [ ] What happens if stripping leaves empty/short content?
- [ ] Is the streaming formatter handling buffering correctly?
- [ ] Could the formatter LLM call fail and return empty?
- [ ] Are there race conditions in streaming?

### 4.3 Internal Block Handling

Review how internal data blocks are handled:

**Questions to answer:**

- [ ] What blocks are stripped? (`<parts_to_save>`, `<internal_data>`)
- [ ] What happens if an agent outputs ONLY internal blocks?
- [ ] Is parts extraction (`extractAndSavePartsFromResponse`) working?
- [ ] Are internal blocks being saved to the database correctly?

---

## Part 5: Streaming & SSE Review

### 5.1 Streaming Implementation

Review the streaming response system:

**Files to review:**

- `app/api/ai-mechanic/route.js` - `handleStreamingResponse()`, `sendSSE()`
- `lib/alOrchestrator.js` - `streamWithMultiAgent()`

**Questions to answer:**

- [ ] Are SSE events being sent in correct format?
- [ ] Is the stream properly closed on completion?
- [ ] Is the stream properly closed on error?
- [ ] Are tool_start/tool_result events correct?
- [ ] Is the "done" event sent with correct usage data?

### 5.2 Client-Side Handling

Review how the frontend handles streaming:

**Files to review:**

- `components/AIMechanicChat.jsx` - Chat UI component
- `components/ALSourcesList.jsx` - Sources display

**Questions to answer:**

- [ ] Does the client correctly parse SSE events?
- [ ] Does the client handle connection drops gracefully?
- [ ] Is the "Researching..." state correctly shown/hidden?
- [ ] Are sources displayed correctly when available?
- [ ] What happens if response is empty?

---

## Part 6: Error Handling Review

### 6.1 Error Boundaries

Review error handling throughout the system:

**Questions to answer:**

- [ ] What happens if Anthropic API is down?
- [ ] What happens if Supabase is unreachable?
- [ ] What happens if Exa (web search) fails?
- [ ] Are errors logged with sufficient context for debugging?
- [ ] Do users see helpful error messages, not technical errors?

### 6.2 Circuit Breaker

Review the circuit breaker implementation:

**Files to review:**

- `lib/aiCircuitBreaker.js`

**Questions to answer:**

- [ ] Is the circuit breaker correctly wrapping API calls?
- [ ] What happens when the circuit is open?
- [ ] Are fallback responses appropriate?

---

## Part 7: Edge Cases & Scenarios

Test these specific scenarios by tracing the code path:

### 7.1 Empty Results Scenarios

- [ ] Query: "Top 5 brake kits for [rare car]" - What if no parts in database?
- [ ] Query: "Track events near [remote location]" - What if no events found?
- [ ] Query: About a car not in the database - What happens?

### 7.2 Tool Failure Scenarios

- [ ] What if `search_parts` returns `{ error: ... }`?
- [ ] What if `research_parts_live` has no Exa API key?
- [ ] What if `get_car_ai_context` can't find the car?

### 7.3 Format Edge Cases

- [ ] What if Claude outputs only markdown with no text before it?
- [ ] What if the response starts with a special character?
- [ ] What if the response is exactly 50 characters (formatter threshold)?

### 7.4 Streaming Edge Cases

- [ ] What if the first chunk is an internal block?
- [ ] What if the stream ends while buffering?
- [ ] What if a tool takes 30+ seconds?

---

## Part 8: Specific Bug Investigation

Investigate these known issues:

### 8.1 Empty Response Bug

**Symptoms:** User sees "SOURCES [1] AutoRev" but no content

**Investigation path:**

1. Check `formatterAgent.js` - `stripInternalBlocks()` logic
2. Check if agent prompts instruct to output `<parts_to_save>` without user content
3. Check `startsWithContent()` patterns - are valid formats being rejected?
4. Trace a parts query end-to-end

### 8.2 Long Research, No Output

**Symptoms:** "Researching..." shows for a long time, then empty response

**Investigation path:**

1. Check tool timeout handling
2. Check if tool results are being passed back to Claude correctly
3. Check if Claude is generating text after receiving tool results
4. Check streaming flush() logic

### 8.3 Parts Not Saving to Database (INVESTIGATED 2026-01-28)

**Symptoms:** AL researches parts via "AL's Top Picks" button, returns great Top 5 list, but parts don't appear in `al_part_recommendations` table.

**Root Cause Found:** The AI was NOT generating the `<parts_to_save>` JSON block at the end of its response.

**Evidence:**

- Conversation ID: `5725cd33-dcbd-45d4-89f0-b1d762554d7c` (Track Coilovers for Mustang SVT Cobra)
- Full Top 5 response existed in `al_messages` with product names, prices, URLs
- BUT response had NO `<parts_to_save>` block
- `extractAndSavePartsFromResponse()` looks for: `/<parts_to_save>\s*([\s\S]*?)\s*<\/parts_to_save>/i`
- Without this block, nothing gets extracted or saved

**Why It Happened:**

1. System prompt (`partsResearchPrompt.js`) has `<parts_to_save>` instructions
2. BUT user-generated prompts from "AL's Top Picks" had very detailed formatting instructions
3. AI followed user prompt formatting closely and ignored/forgot system prompt persistence instructions

**Fix Applied (2026-01-28):**

- Added explicit `<parts_to_save>` instructions to user-generated prompts in:
  - `components/ALQuickActionsPopup.jsx` (lines 271-288)
  - `components/tuning-shop/PartsSelector.jsx` (lines 484-502)

**Files Changed:**

```
components/ALQuickActionsPopup.jsx - generatePartsPageActions() prompt
components/tuning-shop/PartsSelector.jsx - handleSeeOptions() prompt
```

**Verification:**

- Run "AL's Top Picks" for any upgrade
- Check that response includes `<parts_to_save>` block at end
- Verify parts appear in `al_part_recommendations` table with correct `car_id` and `upgrade_key`

### 8.4 Car Name Missing Brand (FIXED 2026-01-28)

**Context:** Database `cars.name` field was updated to remove brand prefix (e.g., "Ford Mustang SVT Cobra" → "Mustang SVT Cobra") to avoid duplication like "Ford Ford Mustang".

**Impact on Parts Research:**

- `carName` passed to prompts was just model name (e.g., "Mustang SVT Cobra")
- `carSlug` still has brand (e.g., "ford-mustang-svt-cobra-sn95")
- Prompts were unclear about the make/brand

**Fix Applied (2026-01-28):**

- Updated components to accept `carBrand` prop
- Construct `fullCarName` by combining `brand + " " + name` when brand is available
- Example: `carName="Mustang SVT Cobra"` + `carBrand="Ford"` → `fullCarName="Ford Mustang SVT Cobra"`

**Files Changed:**

```
components/ALQuickActionsPopup.jsx
  - generatePartsPageActions() now accepts options.carBrand
  - Constructs fullCarName for all prompts

components/tuning-shop/PartsSelector.jsx
  - Added carBrand prop
  - Constructs fullCarName for prompts and chat context

components/tuning-shop/ALRecommendationsButton.jsx
  - Added carBrand prop
  - Constructs fullCarName for prompts and chat context
  - Passes carBrand to generatePartsPageActions()

app/(app)/garage/my-parts/page.jsx
  - Passes carBrand={selectedCar.brand} to PartsSelector and ALRecommendationsButton
```

**Result:**

- Prompts now say "Find me the best X for my **Ford Mustang SVT Cobra**"
- AI has clear context about the make/model
- Parts research is more accurate

---

## Part 9: Output Checklist

After completing the audit, provide:

### 9.1 Critical Issues (Must Fix)

List any issues that cause broken functionality:

```
1. [File:Line] Issue description
   Fix: Proposed solution
```

### 9.2 High Priority Issues (Should Fix)

List issues that degrade UX but don't break functionality:

```
1. [File:Line] Issue description
   Fix: Proposed solution
```

### 9.3 Improvements (Nice to Have)

List optimizations and enhancements:

```
1. [File:Line] Improvement description
```

### 9.4 Architecture Recommendations

Any structural changes that would improve the system:

```
1. Recommendation description
   Rationale: Why this helps
```

---

## Quick Reference: Key Files

| Component            | File Path                        |
| -------------------- | -------------------------------- |
| API Route            | `app/api/ai-mechanic/route.js`   |
| Orchestrator         | `lib/alOrchestrator.js`          |
| Intent Classifier    | `lib/alAgents/orchestrator.js`   |
| Agent Registry       | `lib/alAgents/index.js`          |
| Base Agent           | `lib/alAgents/baseAgent.js`      |
| Tool Definitions     | `lib/alConfig.js`                |
| Tool Implementations | `lib/alTools.js`                 |
| Formatter Agent      | `lib/alAgents/formatterAgent.js` |
| Context Builder      | `lib/aiMechanicService.js`       |
| Chat UI              | `components/AIMechanicChat.jsx`  |
| AL Documentation     | `docs/AL.md`                     |

---

## How to Use This Audit

1. **Start fresh**: Open a new Cursor chat
2. **Paste this entire document** as your first message
3. **Let the agent work through each section** systematically
4. **Ask follow-up questions** on any findings
5. **Have fixes implemented** for critical issues found

The audit should take 30-60 minutes for a thorough review.
