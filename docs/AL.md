# AL — AutoRev AI Assistant

> Complete reference for the AL AI system

---

## Overview

AL (AutoRev AI) is an AI-powered car research assistant built on Claude. It has access to 25 tools that let it search the AutoRev database, knowledge base, parts catalog, community insights, car events, web search, read specific URLs, calculate mod impacts, analyze price history, analyze user vehicle health, access user build projects and performance goals, and process uploaded images.

| Attribute              | Value                                                 |
| ---------------------- | ----------------------------------------------------- |
| **Model**              | Claude Sonnet 4 (`claude-sonnet-4-20250514`)          |
| **Tools**              | 25                                                    |
| **Knowledge Base**     | 7,447 document chunks with vector embeddings          |
| **Encyclopedia**       | 136 topics with semantic search (vectorized)          |
| **Community Insights** | Forum-extracted insights (Rennlist, Bimmerpost, etc.) |
| **Events**             | Cars & Coffee, track days, car shows, and more        |
| **Pricing**            | Token-based (mirrors Anthropic costs)                 |

> **Last Verified:** January 26, 2026 — Verified against `lib/alConfig.js` and `lib/alTools.js`

---

## Identity & Personality

```javascript
AL_IDENTITY = {
  name: 'AL',
  fullName: 'AutoRev AL',
  tagline: 'Your Expert Automotive AI',
  personality: [
    'Deeply knowledgeable about sports cars',
    'Enthusiastic but practical',
    'Honest about limitations',
    'Speaks like a trusted friend who is a car expert',
    'Uses real data and specs',
    'Understands both technical and emotional aspects',
  ],
};
```

---

## Chat Limits by Tier

| Tier           | Monthly AL Budget | Est. Chats |
| -------------- | ----------------- | ---------- |
| **Free**       | $0.25             | ~15        |
| **Enthusiast** | $2.00             | ~130       |
| **Pro**        | $5.00             | ~350       |

Cost is based on actual token usage (Claude Sonnet 4 pricing):

- Input: $3.00/1M tokens
- Output: $15.00/1M tokens
- Typical conversation: ~$0.01-0.02

---

## Tools (25 Total)

### Tool Access by Tier

| Tool                        | Free | Collector | Tuner |
| --------------------------- | ---- | --------- | ----- |
| `search_cars`               | ✓    | ✓         | ✓     |
| `get_car_ai_context`        | ✓    | ✓         | ✓     |
| `search_events`             | ✓    | ✓         | ✓     |
| `get_expert_reviews`        | —    | ✓         | ✓     |
| `get_known_issues`          | —    | ✓         | ✓     |
| `compare_cars`              | —    | ✓         | ✓     |
| `search_encyclopedia`       | —    | ✓         | ✓     |
| `get_upgrade_info`          | —    | ✓         | ✓     |
| `calculate_mod_impact`      | —    | ✓         | ✓     |
| `search_parts`              | —    | ✓         | ✓     |
| `get_maintenance_schedule`  | —    | ✓         | ✓     |
| `search_knowledge`          | —    | ✓         | ✓     |
| `search_web`                | —    | ✓         | ✓     |
| `read_url`                  | —    | ✓         | ✓     |
| `get_track_lap_times`       | —    | ✓         | ✓     |
| `get_dyno_runs`             | —    | ✓         | ✓     |
| `get_price_history`         | —    | ✓         | ✓     |
| `search_community_insights` | —    | ✓         | ✓     |
| `analyze_vehicle_health`    | —    | ✓         | ✓     |
| `recommend_build`           | —    | —         | ✓     |
| `analyze_uploaded_content`  | —    | ✓         | ✓     |
| `get_user_builds`           | —    | ✓         | ✓     |
| `get_user_goals`            | —    | ✓         | ✓     |
| `get_user_vehicle_details`  | —    | ✓         | ✓     |
| `get_user_context`          | —    | ✓         | ✓     |

> **Deprecations (2026-01-26):**
>
> - `get_car_details` — Use `get_car_ai_context` instead (same data, optimized)
> - `find_best_parts` — Use `search_parts` with `upgrade_type` parameter instead

---

## Tool Reference

### 1. `search_cars`

Search the car database by criteria.

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `query` | string | Yes | Natural language search |
| `filters.budget_min` | number | No | Min price |
| `filters.budget_max` | number | No | Max price |
| `filters.hp_min` | number | No | Min horsepower |
| `filters.hp_max` | number | No | Max horsepower |
| `filters.category` | enum | No | Mid-Engine, Front-Engine, Rear-Engine |
| `filters.drivetrain` | enum | No | RWD, AWD, FWD |
| `filters.tier` | enum | No | premium, upper-mid, mid, budget |
| `filters.brand` | string | No | Brand name |
| `filters.manual_available` | boolean | No | Manual trans available |
| `sort_by` | enum | No | hp, price, value, track, reliability, sound |
| `limit` | number | No | Max results (default 5) |

**Returns:** Array of matching cars with basic specs

---

### 2. `get_car_details` ⚠️ DEPRECATED

> **Deprecated 2026-01-26** — Use `get_car_ai_context` instead. This tool internally calls `get_car_ai_context` anyway.

---

### 3. `get_car_ai_context`

**PREFERRED** - Get AI-optimized context blob (single DB call).

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `car_slug` | string | Yes | Car identifier |
| `include` | array | No | Sections: car, fuel, safety, pricing, price_history, recalls, issues, maintenance, youtube |

**Returns:** Compact object with all enriched data

**Best Practice:** Use this first for any car-specific question to get comprehensive context efficiently.

---

### 4. `search_events`

Search for car events like track days, Cars & Coffee, car shows, autocross, and meetups.

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `location` | string | Yes | ZIP code, city/state, or state code |
| `radius` | number | No | Search radius in miles (default 50, max 500) |
| `event_type` | enum | No | cars-and-coffee, track-day, car-show, autocross, etc. |
| `is_track_event` | boolean | No | Filter to track events only |
| `brand` | string | No | Filter by car brand affinity |
| `car_slug` | string | No | Filter by specific car affinity |
| `start_after` | string | No | ISO date string for events after this date |
| `limit` | number | No | Max results (default 5, max 20) |

**Returns:** Events with name, type, date, location, cost, URL, and car affinities

**Example Queries:**

```
"Find track days near 22033" → Track events within radius of ZIP
"Cars and coffee events in Austin, TX" → Location-based search
"Porsche meetups in California" → Brand-specific events
"BMW M3 events near me" → Car-specific events
```

**Best Practice:** When users mention location in their profile, AL uses it as the default for event searches. Use this tool to help users find relevant car events and meetups near them.

---

### 5. `get_expert_reviews`

Get YouTube reviews and AI-processed summaries.

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `car_slug` | string | Yes | Car identifier |
| `limit` | number | No | Max reviews (default 3) |
| `include_quotes` | boolean | No | Include notable quotes |

**Returns:** Reviews with summaries, pros/cons, consensus

---

### 6. `get_known_issues`

Get common problems and reliability concerns.

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `car_slug` | string | Yes | Car identifier |
| `severity_filter` | enum | No | Critical, Major, Minor, All |

**Returns:** Array of issues with severity, symptoms, fixes, costs

---

### 7. `compare_cars`

Side-by-side comparison of multiple cars.

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `car_slugs` | array | Yes | 2-4 car slugs to compare |
| `focus_areas` | array | No | performance, reliability, ownership_cost, track, daily_usability, sound, value |

**Returns:** Comparison with specs, scores, analysis

---

### 8. `search_encyclopedia`

Search the AutoRev encyclopedia using **SEMANTIC SEARCH** over 136 comprehensive automotive topics. This is the primary tool for educational questions about how cars work.

**NOW WITH SEMANTIC SEARCH:** Encyclopedia topics are vectorized for natural language queries. Ask questions like "how does a turbo work?" and get relevant results based on meaning, not just keywords.

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `query` | string | Yes | Natural language query (e.g., "how does a turbocharger increase power") |
| `category` | enum | No | `all`, `automotive`, `topics`, `modifications`, `build_guides`, `systems` (legacy), `components` (legacy) |

**Categories Explained:**
| Category | What It Searches | Search Method |
|----------|-----------------|---------------|
| `all` | Everything in the encyclopedia | Semantic (vectorized) |
| `automotive` | Systems, components, and topics | Semantic |
| `topics` | 136 educational topics (bore, stroke, turbos, etc.) | Semantic |
| `modifications` | Upgrade articles (cold-air-intake, coilovers, etc.) | Keyword |
| `build_guides` | Goal-based build paths (More Power, Better Handling, etc.) | Keyword |
| `systems` | Legacy: includes old systems + new automotive systems | Keyword |
| `components` | Legacy: includes old components + new topics | Keyword |

**Example Queries (Semantic Search):**

```
"How does a turbocharger work?" → turbo-fundamentals, boost-control topics
"What is bore and stroke?" → bore, stroke, displacement topics
"Explain camshaft timing" → camshaft, valvetrain, valve-timing topics
"Why do I need an intercooler?" → intercooler-types topic
"Difference between coilovers and springs" → coilovers, spring-rate-basics topics
```

**Returns:**

- `searchMethod`: "semantic" or "keyword"
- `similarity`: Match score (for semantic results)
- `url`: Direct link to encyclopedia topic
- `relatedTopics`: Connected topics for deeper learning
- `relatedUpgrades`: Modification articles related to the topic

**Best Practice:** Use this tool FIRST for any educational/conceptual question about automotive systems, before using general knowledge.

---

### 9. `get_upgrade_info`

Detailed information about a specific modification.

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `upgrade_key` | string | Yes | Upgrade identifier (e.g., "cold-air-intake", "coilovers") |
| `car_slug` | string | No | Optional car context for specific recommendations |

**Returns:** Full upgrade details including cost, difficulty, gains, pros/cons

---

### 10. `calculate_mod_impact` ⭐ NEW

Calculate performance impact of modifications. Lighter than `recommend_build` — just numbers, no full build plans.

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `car_slug` | string | Yes | Car identifier |
| `mods` | array | Yes | Array of mod keys: "cold-air-intake", "ecu-tune", "downpipe", etc. |

**Returns:**

- Stock HP, projected HP, total gain
- 0-60 improvement (if calculable)
- Breakdown by mod with individual gains
- Confidence level and any conflicts

**Example:**

```
"How much HP will intake + tune add to my 911?"
→ calculate_mod_impact({ car_slug: "911-carrera-992", mods: ["cold-air-intake", "ecu-tune"] })
```

**Best Practice:** Use this for quick "what-if" calculations. For full build plans with parts recommendations, use `recommend_build` instead.

---

### 11. `search_parts`

Search the parts catalog OR get upgrade recommendations.

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `query` | string | Yes | Part name, brand, or part number |
| `car_slug` | string | No | Filter by car fitment |
| `category` | enum | No | intake, exhaust, tune, suspension, brakes, etc. |
| `limit` | number | No | Max results (default 8) |

**Returns:** Parts with fitment info, pricing, source URLs

---

### 11. `get_maintenance_schedule`

Get maintenance specs and schedules.

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `car_slug` | string | Yes | Car identifier |
| `car_variant_key` | string | No | Specific variant for exact specs |
| `mileage` | number | No | Current mileage for upcoming services |

**Returns:** Fluid specs, service intervals, cost estimates

---

### 12. `recommend_build`

Get upgrade recommendations for a specific goal.

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `car_slug` | string | Yes | Car identifier |
| `goal` | enum | Yes | street_fun, weekend_track, time_attack, show_car, daily_plus, canyon_carver |
| `budget` | number | No | Budget in dollars |
| `maintain_warranty` | boolean | No | Only warranty-safe mods |

**Returns:** Staged build plan with parts, costs, gains

---

### 13. `search_knowledge`

Search the vector knowledge base with citations.

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `query` | string | Yes | The question or search query |
| `car_slug` | string | No | Restrict to specific car |
| `topic` | string | No | Topic filter (reliability, track, pricing, etc.) |
| `limit` | number | No | Max results (default 6) |

**Returns:** Excerpts with similarity scores and source URLs

**Best Practice:** Use this for nuanced questions requiring evidence-backed answers.

---

### 14. `search_web` ⭐ NEW - Real-Time Web Search

Search the web using Exa AI for real-time automotive information.

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `query` | string | Yes | Search query (be specific with automotive terms) |
| `car_context` | string | No | Car name/slug for context |
| `limit` | number | No | Max results (default 5, max 10) |

**Returns:** Web search results with title, URL, excerpt, and published date

**When to Use:**

- Recent news about a car model
- Current market conditions or pricing trends
- New product announcements
- Recent recalls or issues not yet in our database

**Best Practice:** Always cite the source URL when using web results. Verify critical claims against our database.

---

### 15. `read_url` ⭐ NEW - Read Any URL

Read and extract content from a specific URL that the user shares.

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | string | Yes | The full URL to read (must be http or https) |
| `focus` | string | No | Specific topic to focus on when extracting |
| `include_summary` | boolean | No | Include AI summary (default: true) |

**Returns:** Title, author, full text content, optional summary, word count

**When to Use:**

- User shares an article link and asks for summary
- User shares a forum thread and asks what it says
- User wants you to read a specific webpage

**Example Queries:**

```
"Can you read this article?" + URL
"What does this forum thread say about IMS bearings?" + URL
"Summarize this page for me" + URL
```

**Best Practice:** Always cite the source URL when referencing content. If the user asked about a specific topic, focus your response on that aspect.

---

### 16. `get_track_lap_times`

Get citeable track lap times.

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `car_slug` | string | Yes | Car identifier |
| `limit` | number | No | Max results (default 6) |

**Returns:** Lap times with track info, conditions, sources

---

### 17. `get_dyno_runs`

Get citeable dyno data.

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `car_slug` | string | Yes | Car identifier |
| `limit` | number | No | Max results (default 6) |
| `include_curve` | boolean | No | Include full dyno curve data |

**Returns:** Dyno runs with peak numbers, mods, sources

---

### 18. `search_community_insights` ⭐ PRIMARY FORUM TOOL

Search community-sourced insights extracted from enthusiast forums. **This is the primary tool for forum/community data** — returns 1,252 curated insights from major car forums.

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `query` | string | Yes | Natural language query (e.g., "IMS bearing failure", "best first mods") |
| `car_slug` | string | No | Filter to specific car |
| `insight_types` | array | No | Filter by type (see below) |
| `limit` | number | No | Max results (default 5, max 10) |

**Insight Types:**
| Type | Description |
|------|-------------|
| `known_issue` | Common problems, failure patterns |
| `maintenance_tip` | Service intervals, DIY procedures |
| `modification_guide` | How-to guides for mods |
| `troubleshooting` | Diagnostic steps, solutions |
| `buying_guide` | PPI checklists, what to look for |
| `performance_data` | Dyno numbers, lap times from owners |
| `reliability_report` | Long-term ownership experiences |
| `cost_insight` | Real maintenance/repair costs |
| `comparison` | Owner comparisons between models |

**Returns:** Insights with title, summary, details, confidence, source forum, and source URLs

**Data Sources:** Rennlist (Porsche), Bimmerpost (BMW), Miata.net (Mazda), FT86Club (Toyota/Subaru), CorvetteForum (Chevy), VWVortex (VW/Audi)

**Fallback Behavior:** When no indexed insights are found, returns `fallback` object with:

- `suggestedForums`: Brand-specific forum links (Rennlist, Bimmerpost, etc.)
- `searchTip`: Pre-built search query for manual forum research

**Best Practice:** Use this as the **primary tool** for any forum/community questions. When no results are found, guide users to the suggested forums. Complements `get_known_issues` and `search_knowledge` with forum-sourced data.

---

### 19. `analyze_vehicle_health`

Analyze a user's specific vehicle and provide personalized maintenance recommendations.

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `vehicle_id` | string | No | User vehicle ID (uses first garage vehicle if not provided) |
| `include_costs` | boolean | No | Include cost estimates for recommendations |
| `user_id` | string | Yes* | User ID (*auto-injected by API route) |

**Returns:**

- `health_score`: Overall health score (0-100)
- `recommendations`: Prioritized list (URGENT, DUE_SOON, UPCOMING)
- `model_issues_to_watch`: Relevant known issues for the car's mileage/year
- `storage_alerts`: Special alerts if vehicle is in storage mode

**Recommendation Categories:**
| Category | Examples |
|----------|----------|
| `oil` | Oil change due/overdue |
| `inspection` | Vehicle inspection, registration |
| `battery` | Battery age, weak/dead status |
| `tires` | Low tread depth |
| `brakes` | Brake fluid service |

**Best Practice:** Use when user asks "what maintenance does my car need?", "is my car healthy?", or "what service is due?". Requires user to have a vehicle in their garage.

---

### 20. `analyze_uploaded_content` ⭐ NEW - Image Analysis

Analyze uploaded images using Claude Vision for automotive diagnostics and identification.

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `attachment_id` | string | No* | ID of uploaded attachment (*one of attachment_id or public_url required) |
| `public_url` | string | No* | Direct URL to image (*one of attachment_id or public_url required) |
| `analysis_type` | enum | No | Type of analysis: `general`, `diagnose`, `identify`, `estimate` |
| `user_context` | string | No | Additional context from user about what they want analyzed |
| `car_slug` | string | No | Car context for more relevant analysis |

**Analysis Types:**
| Type | Description |
|------|-------------|
| `general` | General description of vehicle/parts/condition |
| `diagnose` | Identify damage, wear, leaks, corrosion, issues |
| `identify` | Identify vehicle make/model/year or part name/number |
| `estimate` | Estimate repair/modification costs |

**Returns:** Analysis-ready object with file URL, analysis prompt, and context

**Best Practice:** Use when user uploads an image asking "what's wrong with this?", "what car is this?", "can you identify this part?", or "how much would this cost to fix?".

---

### 21. `get_user_builds` - User Build Projects

Access user's build projects from the Tuning Shop with planned upgrades, costs, and performance projections.

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `vehicle_id` | string | No | Filter builds to a specific vehicle |
| `include_parts` | boolean | No | Include detailed parts list for each build (default: false) |

**Returns:**

- `builds`: Array of build projects with:
  - `name`, `car`, `car_slug`
  - `stock_hp`, `final_hp`, `total_hp_gain`
  - `stock_zero_to_sixty`, `final_zero_to_sixty`, `zero_to_sixty_improvement`
  - `total_cost_low`, `total_cost_high`, `cost_range`
  - `selected_upgrades`: Array of planned upgrades
  - `parts`: Detailed parts list (if `include_parts: true`)
- `total_count`: Number of builds
- `has_favorite`: Whether user has a favorite build

**Best Practice:** Use when user asks about their builds, upgrade plans, "what should I do next?", or when you need context about their modification goals. Enables build-aware recommendations.

---

### 22. `get_user_goals` - Performance Goals

Access user's active performance goals (target lap times, 0-60 times, etc.).

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `vehicle_id` | string | No | Filter goals to a specific vehicle |
| `status` | enum | No | `active`, `completed`, or `all` (default: `active`) |

**Returns:**

- `goals`: Array of performance goals with:
  - `goal_type`: Type of goal (lap_time, zero_to_sixty, quarter_mile, etc.)
  - `title`, `description`
  - `target_value`, `achieved_value`, `progress_percent`
  - `track_name`: For lap time goals
  - `status`, `is_completed`, `deadline`
- `active_count`, `completed_count`
- `summary`: Human-readable summary of active goals

**Best Practice:** Use when user asks about performance targets, wants to "get faster", or when recommending upgrades that should be aligned with their goals. Enables goal-oriented recommendations.

---

### 23. `get_user_vehicle_details` - Detailed Vehicle Info

Get comprehensive details about a user's specific vehicle including installed mods, custom specs, and service history.

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `vehicle_id` | string | No | Vehicle ID (uses primary if not specified) |
| `include_service_history` | boolean | No | Include recent service logs (default: true) |

**Returns:**

- `vehicle`: Detailed vehicle object with:
  - Basic info: `year`, `make`, `model`, `trim`, `vin`
  - Ownership: `current_mileage`, `purchase_date`, `purchase_price`
  - **Modifications**: `installed_modifications`, `mod_count`, `total_hp_gain`
  - **Custom specs**: User-entered spec overrides
  - **Maintenance status**: Oil change dates, registration, inspection due dates
  - **Service history**: Recent service logs with dates, types, costs, shops
- `has_modifications`, `has_custom_specs`, `has_service_history`: Flags

**Best Practice:** Use when you need detailed info about the user's car beyond basic context, such as specific installed mods, their service history, or custom specs they've entered.

---

## Context Enhancements

AL automatically receives enriched context about the user:

### User Location

If the user has set their location in their profile, AL receives:

- City and state
- ZIP code
- Used as default for event searches ("find track days near me")

### Installed Modifications

For users with garage vehicles, AL sees:

- Number of installed modifications per vehicle
- Total HP gain from mods
- Detailed mod list for primary vehicle
- This enables personalized upgrade recommendations

### Garage Context

AL always knows:

- All owned vehicles (up to 3 shown, with mod counts)
- User's favorites (if no owned vehicles)
- Currently viewed car (page context)
- User's primary vehicle details

---

## System Prompt

**SINGLE SOURCE OF TRUTH**: AL's behavior is defined by `buildALSystemPrompt()` in `lib/alConfig.js`.

Do NOT define system prompts elsewhere. All AL behavior configuration belongs in this function.

**Key Behavioral Instructions:**

1. **Database-First**: Always use tools before answering car-specific questions
2. **Source Confidence**: Match language confidence to data quality (4 tiers)
3. **Specificity**: Use actual numbers from the database, not approximations
4. **Practicality**: Consider budget, skill level, real-world implications
5. **Conciseness**: Lean SHORT by default, expand only when asked
6. **No AI Fluff**: No filler phrases, no restating questions, get to the point
7. **Safety**: Mention safety considerations for mods/DIY work
8. **Attribution**: Always cite sources (AutoRev data, forum name, expert reviewer)

**Source Confidence Tiers:**

- **Tier 1 (AutoRev Verified)**: BE CONFIDENT - direct language, no hedging
- **Tier 2 (Community Sourced)**: ATTRIBUTE CLEARLY - cite forum/source
- **Tier 3 (General Knowledge)**: Confident but appropriately scoped
- **Tier 4 (Beyond Database)**: Answer with expertise - NEVER mention database limitations

**Critical Presentation Rule:**
NEVER tell users about data source limitations. Present ALL answers—whether from database, web search, or expertise—as confident recommendations. Forbidden phrases: "I don't have that in our database", "AutoRev doesn't have data on...", "Since our database doesn't have..."

---

## Domain Detection

AL automatically detects which automotive domain a question relates to and prioritizes relevant tools:

| Domain          | Keywords                                        | Priority Tools                                              |
| --------------- | ----------------------------------------------- | ----------------------------------------------------------- |
| performance     | fast, powerful, hp                              | get_dyno_runs, get_car_ai_context                           |
| reliability     | reliable, issue, problem                        | get_known_issues, search_community_insights                 |
| modifications   | mod, upgrade, tune                              | search_parts, get_upgrade_info, search_community_insights   |
| buying          | buy, price, worth                               | get_car_ai_context, search_community_insights               |
| maintenance     | oil, service, interval                          | get_maintenance_schedule, analyze_vehicle_health            |
| track           | track, lap, HPDE                                | get_track_lap_times                                         |
| comparison      | vs, compare, better                             | compare_cars                                                |
| ownership       | long-term, high mileage, costs                  | search_community_insights                                   |
| events          | meetup, cars and coffee, track day, car show    | search_events                                               |
| **education**   | how, what, why, explain, work, learn            | **search_encyclopedia**, get_upgrade_info, search_knowledge |
| vehicle health  | my car, health, due, overdue                    | **analyze_vehicle_health**, get_maintenance_schedule        |
| **user builds** | my build, my project, what's next, upgrade plan | **get_user_builds**, get_user_vehicle_details               |
| **user goals**  | my goal, target time, get faster, improve       | **get_user_goals**, get_user_builds                         |

---

## Caching

Expensive tools are cached to reduce costs:

| Tool                        | TTL        |
| --------------------------- | ---------- |
| `get_car_ai_context`        | 2 minutes  |
| `search_knowledge`          | 5 minutes  |
| `search_community_insights` | 5 minutes  |
| `get_track_lap_times`       | 10 minutes |
| `get_dyno_runs`             | 10 minutes |

---

## API Endpoint

**Route:** `POST /api/ai-mechanic`

**Request:**

```json
{
  "message": "What's a good track car under $50k?",
  "conversationId": "optional-uuid",
  "carContext": {
    "slug": "optional-car-slug",
    "name": "optional-car-name"
  }
}
```

**Response:**

```json
{
  "response": "Based on our database...",
  "conversationId": "uuid",
  "usage": {
    "inputTokens": 1500,
    "outputTokens": 400,
    "costCents": 1.5
  }
}
```

---

## Database Tables

### AL System Tables

| Table                 | Purpose                   |
| --------------------- | ------------------------- |
| `al_conversations`    | Chat session metadata     |
| `al_messages`         | Individual messages       |
| `al_user_credits`     | User balance in cents     |
| `al_usage_logs`       | Detailed usage tracking   |
| `al_credit_purchases` | Purchase history (future) |

### Tool → Database Table Mapping

> **Last Updated:** January 15, 2026

| Tool                        | Primary RPC/Tables                                                                                                                                                 | Source of Truth                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| `get_car_ai_context`        | `get_car_ai_context_v2` RPC → `cars`, `car_fuel_economy`, `car_safety_data`, `car_market_pricing`, `car_recalls`, `car_tuning_profiles`, `youtube_video_car_links` | ✅ Optimized in v2                                         |
| `search_cars`               | `search_cars_fts` RPC → `cars`                                                                                                                                     | —                                                          |
| `get_car_details`           | `cars` + various enrichment tables                                                                                                                                 | —                                                          |
| `get_known_issues`          | `car_issues`                                                                                                                                                       | ✅ Source of truth (~~`vehicle_known_issues`~~ deprecated) |
| `get_expert_reviews`        | `youtube_video_car_links` + `youtube_videos`                                                                                                                       | —                                                          |
| `get_maintenance_schedule`  | `get_car_maintenance_summary` RPC → `vehicle_maintenance_specs`, `vehicle_service_intervals`                                                                       | —                                                          |
| `search_parts`              | `parts`, `part_fitments`, `part_pricing_snapshots`                                                                                                                 | —                                                          |
| `recommend_build`           | `get_car_tuning_context` RPC → `car_tuning_profiles`, `part_fitments`, `parts`, `car_dyno_runs`, `upgrade_packages`                                                | ✅ New optimized RPC                                       |
| `search_knowledge`          | `search_document_chunks` RPC → `document_chunks`                                                                                                                   | —                                                          |
| `get_track_lap_times`       | `get_car_track_lap_times` RPC → `car_track_lap_times`, `tracks`, `track_layouts`                                                                                   | —                                                          |
| `get_dyno_runs`             | `get_car_dyno_runs` RPC → `car_dyno_runs`                                                                                                                          | —                                                          |
| `search_community_insights` | `search_community_insights` RPC → `community_insights`                                                                                                             | —                                                          |
| `search_events`             | `events`, `event_types`, `event_car_affinities`                                                                                                                    | —                                                          |
| `analyze_vehicle_health`    | `analyze_vehicle_health_data` RPC → `user_vehicles`, `vehicle_maintenance_specs`, `car_issues`, `user_service_logs`                                                | —                                                          |
| `compare_cars`              | `cars` (local in-memory)                                                                                                                                           | —                                                          |
| `search_encyclopedia`       | `search_document_chunks` RPC (filtered to encyclopedia)                                                                                                            | —                                                          |
| `get_upgrade_info`          | Static files: `data/upgradeEducation.js`                                                                                                                           | —                                                          |
| `analyze_uploaded_content`  | `al_attachments` + Claude Vision API                                                                                                                               | —                                                          |
| `get_user_builds`           | `user_projects`, `user_project_parts`, `parts`                                                                                                                     | User build projects                                        |
| `get_user_goals`            | `user_performance_goals`                                                                                                                                           | Performance targets                                        |
| `get_user_vehicle_details`  | `user_vehicles`, `user_service_logs`                                                                                                                               | Detailed vehicle info                                      |

### RPC Functions Used by AL

| RPC Function                  | Primary Table(s)                | Notes                                                              |
| ----------------------------- | ------------------------------- | ------------------------------------------------------------------ |
| `get_car_ai_context_v2`       | 8+ tables                       | **Optimized** - resolves slug→id once, uses car_id for all queries |
| `get_car_tuning_context`      | 5 tables                        | **NEW** - tuning-focused data for recommend_build                  |
| `get_car_maintenance_summary` | 2 tables                        | Maintenance specs aggregation                                      |
| `search_document_chunks`      | `document_chunks`               | Vector similarity search                                           |
| `search_community_insights`   | `community_insights`            | Semantic forum search                                              |
| `get_car_dyno_runs`           | `car_dyno_runs`                 | Dyno data with optional curve                                      |
| `get_car_track_lap_times`     | `car_track_lap_times`, `tracks` | Track times with venue info                                        |
| `analyze_vehicle_health_data` | Multiple user/car tables        | Vehicle health analysis                                            |

### Cache TTLs by Tool

| Tool                        | Cache TTL | Reason                             |
| --------------------------- | --------- | ---------------------------------- |
| `get_car_ai_context`        | 2 min     | Car data changes rarely            |
| `search_knowledge`          | 5 min     | Document chunks are stable         |
| `get_track_lap_times`       | 10 min    | Track data is semi-static          |
| `get_dyno_runs`             | 10 min    | Dyno data is semi-static           |
| `search_community_insights` | 5 min     | Forum insights update periodically |

---

## Implementation Files

| File                            | Purpose                             |
| ------------------------------- | ----------------------------------- |
| `lib/alConfig.js`               | Configuration, tools, system prompt |
| `lib/alTools.js`                | Tool implementations                |
| `lib/alUsageService.js`         | Credit/balance management           |
| `lib/alConversationService.js`  | Conversation CRUD                   |
| `lib/alToolCache.js`            | Tool response caching               |
| `lib/aiMechanicService.js`      | Core AI service                     |
| `app/api/ai-mechanic/route.js`  | API endpoint                        |
| `components/AIMechanicChat.jsx` | Chat UI component                   |

---

_See [API.md](API.md) for full API documentation._
