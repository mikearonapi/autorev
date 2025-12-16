# AL — AutoRev AI Assistant

> Complete reference for the AL AI system

---

## Overview

AL (AutoRev AI) is an AI-powered car research assistant built on Claude. It has access to 17 tools that let it search the AutoRev database, knowledge base, parts catalog, community insights, and car events.

| Attribute | Value |
|-----------|-------|
| **Model** | Claude Sonnet 4 (`claude-sonnet-4-20250514`) |
| **Tools** | 17 |
| **Knowledge Base** | 547 document chunks with vector embeddings |
| **Community Insights** | Forum-extracted insights (Rennlist, Bimmerpost, etc.) |
| **Events** | Cars & Coffee, track days, car shows, and more |
| **Pricing** | Token-based (mirrors Anthropic costs) |

> **Last Verified:** December 15, 2024 — MCP-verified against `lib/alConfig.js` and `lib/alTools.js`

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
}
```

---

## Chat Limits by Tier

| Tier | Monthly Budget | Est. Conversations |
|------|----------------|-------------------|
| **Free** | $0.25 (25 cents) | ~15-20 |
| **Collector** | $1.00 | ~70-80 |
| **Tuner** | $2.50 | ~175-200 |

Cost is based on actual token usage (Claude Sonnet 4 pricing):
- Input: $3.00/1M tokens
- Output: $15.00/1M tokens
- Typical conversation: ~$0.01-0.02

---

## Tools (17 Total)

### Tool Access by Tier

| Tool | Free | Collector | Tuner |
|------|------|-----------|-------|
| `search_cars` | ✓ | ✓ | ✓ |
| `get_car_details` | ✓ | ✓ | ✓ |
| `get_car_ai_context` | ✓ | ✓ | ✓ |
| `search_events` | ✓ | ✓ | ✓ |
| `get_expert_reviews` | — | ✓ | ✓ |
| `get_known_issues` | — | ✓ | ✓ |
| `compare_cars` | — | ✓ | ✓ |
| `search_encyclopedia` | — | ✓ | ✓ |
| `get_upgrade_info` | — | ✓ | ✓ |
| `search_forums` | — | ✓ | ✓ | *(stub - not implemented)* |
| `search_parts` | — | ✓ | ✓ |
| `get_maintenance_schedule` | — | ✓ | ✓ |
| `search_knowledge` | — | ✓ | ✓ |
| `get_track_lap_times` | — | ✓ | ✓ |
| `get_dyno_runs` | — | ✓ | ✓ |
| `search_community_insights` | — | ✓ | ✓ |
| `recommend_build` | — | — | ✓ |

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

### 2. `get_car_details`
Get comprehensive details about a specific car.

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `car_slug` | string | Yes | Car identifier (e.g., "718-cayman-gt4") |
| `include` | array | No | What to include: specs, scores, maintenance, known_issues, ownership_costs, buyer_guide |

**Returns:** Full car object with requested sections

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
Search the AutoRev encyclopedia for automotive education, modifications, and build guides.

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `query` | string | Yes | Search query |
| `category` | enum | No | `all`, `automotive`, `topics`, `modifications`, `build_guides`, `systems` (legacy), `components` (legacy) |

**Categories Explained:**
| Category | What It Searches |
|----------|-----------------|
| `all` | Everything in the encyclopedia |
| `automotive` | New hierarchy: systems, components, and topics |
| `topics` | Individual educational topics (bore, stroke, cam profiles, etc.) |
| `modifications` | Upgrade articles (cold-air-intake, coilovers, etc.) |
| `build_guides` | Goal-based build paths (More Power, Better Handling, etc.) |
| `systems` | Legacy: includes old systems + new automotive systems |
| `components` | Legacy: includes old components + new topics |

**Example Queries:**
```
"What is bore and stroke?" → topics about engine fundamentals
"How does a turbo work?" → turbo-fundamentals topic
"What's a good first mod?" → modification articles
"Track day build" → build_guides for track prep
```

**Returns:** Matching articles with id, title, subtitle, type, section

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

### 10. `search_forums`
Search automotive forums (placeholder - not fully implemented).

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `query` | string | Yes | Search query |
| `car_context` | string | No | Car name for context |
| `sources` | array | No | reddit, rennlist, m3post, etc. |

**Returns:** Search suggestions and forum links

---

### 11. `search_parts`
Search the parts catalog with optional car fitment.

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `query` | string | Yes | Part name, brand, or part number |
| `car_slug` | string | No | Filter by car fitment |
| `category` | enum | No | intake, exhaust, tune, suspension, brakes, etc. |
| `limit` | number | No | Max results (default 8) |

**Returns:** Parts with fitment info, pricing, source URLs

---

### 12. `get_maintenance_schedule`
Get maintenance specs and schedules.

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `car_slug` | string | Yes | Car identifier |
| `car_variant_key` | string | No | Specific variant for exact specs |
| `mileage` | number | No | Current mileage for upcoming services |

**Returns:** Fluid specs, service intervals, cost estimates

---

### 13. `recommend_build`
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

### 14. `search_knowledge`
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

### 15. `get_track_lap_times`
Get citeable track lap times.

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `car_slug` | string | Yes | Car identifier |
| `limit` | number | No | Max results (default 6) |

**Returns:** Lap times with track info, conditions, sources

---

### 16. `get_dyno_runs`
Get citeable dyno data.

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `car_slug` | string | Yes | Car identifier |
| `limit` | number | No | Max results (default 6) |
| `include_curve` | boolean | No | Include full dyno curve data |

**Returns:** Dyno runs with peak numbers, mods, sources

---

### 17. `search_community_insights`
Search community-sourced insights extracted from enthusiast forums.

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

**Best Practice:** Use this when users ask about real-world owner experiences, what actual owners say, or community wisdom. Complements `get_known_issues` and `search_knowledge` with forum-sourced data.

---

## System Prompt

AL's behavior is defined by `buildALSystemPrompt()` in `lib/alConfig.js`:

**Key Instructions:**
1. Use tools first before answering car-specific questions
2. Be specific with actual numbers from the database
3. Be practical about budget, skill level, implications
4. Be honest when unsure - don't guess on safety-critical info
5. Keep responses concise (2-3 paragraphs unless more needed)
6. Always mention safety considerations for mods/DIY

---

## Domain Detection

AL automatically detects which automotive domain a question relates to and prioritizes relevant tools:

| Domain | Keywords | Priority Tools |
|--------|----------|----------------|
| performance | fast, powerful, hp | get_dyno_runs, get_car_ai_context |
| reliability | reliable, issue, problem | get_known_issues, search_community_insights |
| modifications | mod, upgrade, tune | search_parts, get_upgrade_info, search_community_insights |
| buying | buy, price, worth | get_car_ai_context, search_community_insights |
| maintenance | oil, service, interval | get_maintenance_schedule, search_community_insights |
| track | track, lap, HPDE | get_track_lap_times |
| comparison | vs, compare, better | compare_cars |
| ownership | long-term, high mileage, costs | search_community_insights |
| events | meetup, cars and coffee, track day, car show | search_events |

---

## Caching

Expensive tools are cached to reduce costs:

| Tool | TTL |
|------|-----|
| `get_car_ai_context` | 2 minutes |
| `search_knowledge` | 5 minutes |
| `get_track_lap_times` | 10 minutes |
| `get_dyno_runs` | 10 minutes |

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

| Table | Purpose |
|-------|---------|
| `al_conversations` | Chat session metadata |
| `al_messages` | Individual messages |
| `al_user_credits` | User balance in cents |
| `al_usage_logs` | Detailed usage tracking |
| `al_credit_purchases` | Purchase history (future) |

---

## Implementation Files

| File | Purpose |
|------|---------|
| `lib/alConfig.js` | Configuration, tools, system prompt |
| `lib/alTools.js` | Tool implementations |
| `lib/alUsageService.js` | Credit/balance management |
| `lib/alConversationService.js` | Conversation CRUD |
| `lib/alToolCache.js` | Tool response caching |
| `lib/aiMechanicService.js` | Core AI service |
| `app/api/ai-mechanic/route.js` | API endpoint |
| `components/AIMechanicChat.jsx` | Chat UI component |

---

*See [API.md](API.md) for full API documentation.*


