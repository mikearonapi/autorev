/**
 * AL Agent Output Schema
 *
 * Defines the structured output contract between specialist agents and the Formatter.
 *
 * ARCHITECTURE:
 * - Specialist agents produce structured content (what to say)
 * - Formatter agent handles presentation (how to say it)
 *
 * This separation ensures:
 * 1. Consistent output quality regardless of which agent responds
 * 2. Specialist agents focus on domain expertise, not formatting
 * 3. Single source of truth for presentation rules
 * 4. Easier testing and maintenance
 *
 * @module lib/alAgents/outputSchema
 */

// =============================================================================
// RESPONSE TYPES
// =============================================================================

/**
 * All possible response types that agents can produce.
 * The Formatter knows how to render each type.
 */
export const RESPONSE_TYPES = {
  // Parts Research
  PARTS_RECOMMENDATION: 'parts_recommendation', // Top N parts list with prices/links
  PARTS_COMPARISON: 'parts_comparison', // Side-by-side part comparison

  // Car Discovery
  CAR_OVERVIEW: 'car_overview', // Single car info
  CAR_COMPARISON: 'car_comparison', // Compare 2+ cars
  CAR_ISSUES: 'car_issues', // Known issues/reliability
  CAR_MAINTENANCE: 'car_maintenance', // Service schedule/costs

  // Build Planning
  BUILD_RECOMMENDATION: 'build_recommendation', // Mod recommendations for goals
  BUILD_REVIEW: 'build_review', // Review user's current build
  MOD_IMPACT: 'mod_impact', // Performance gain calculations

  // Performance Data
  PERFORMANCE_DATA: 'performance_data', // Dyno/lap time data
  PERFORMANCE_CALCULATION: 'performance_calculation', // Calculated gains

  // Knowledge
  EXPLANATION: 'explanation', // Educational content
  ENCYCLOPEDIA: 'encyclopedia', // Encyclopedia entry

  // Community/Events
  EVENTS_LIST: 'events_list', // Car events
  COMMUNITY_INSIGHTS: 'community_insights', // Owner experiences

  // Vision
  IMAGE_ANALYSIS: 'image_analysis', // Analyzed uploaded image

  // General
  QUICK_ANSWER: 'quick_answer', // Simple yes/no or short answer
  CONVERSATIONAL: 'conversational', // Casual chat, jokes, etc.
};

// =============================================================================
// OUTPUT STRUCTURE TEMPLATES
// =============================================================================

/**
 * Instructions for how specialist agents should structure their output.
 * This is included in agent prompts to guide structured output.
 */
export const OUTPUT_STRUCTURE_INSTRUCTIONS = `## Output Structure for Formatter

Your response will be processed by a Formatter Agent. Structure your output as follows:

### For Recommendation Lists (parts, mods, cars):
\`\`\`
RESPONSE_TYPE: [type]
TITLE: [descriptive title]
CONTEXT: [optional: user's car, build stage, etc.]

ITEM 1:
- name: [product/car name]
- brand: [if applicable]
- price: [if applicable]
- url: [purchase link if applicable]
- why: [1-2 sentence recommendation reason]
- best_for: [use case]
- tier: [budget/mid/premium if applicable]

ITEM 2:
...

SUMMARY: [optional: price range, key takeaway]
FOLLOW_UP: [optional: suggested next question]
\`\`\`

### For Explanations/Knowledge:
\`\`\`
RESPONSE_TYPE: explanation
TITLE: [topic]

EXPLANATION:
[Clear, structured explanation]

KEY_POINTS:
- [Point 1]
- [Point 2]

EXAMPLE: [optional: practical example]
FOLLOW_UP: [optional: related topic to explore]
\`\`\`

### For Quick Answers:
\`\`\`
RESPONSE_TYPE: quick_answer
ANSWER: [direct answer]
DETAIL: [optional: brief elaboration]
\`\`\`

### For Comparisons:
\`\`\`
RESPONSE_TYPE: [car_comparison/parts_comparison]
TITLE: [X vs Y]

OPTION_A:
- name: [name]
- [key specs/features]

OPTION_B:
- name: [name]
- [key specs/features]

VERDICT: [which is better for what use case]
\`\`\`

### Important Rules:
1. Always include RESPONSE_TYPE as the first line
2. Use the exact field names shown above
3. Be concise in each field - the Formatter handles verbosity
4. Include URLs when you have them (parts, events)
5. Include prices when you have them
6. Citations go in [brackets] inline with claims`;

/**
 * Compact version for agents with token constraints
 */
export const OUTPUT_STRUCTURE_COMPACT = `## Output Format
Structure your response for the Formatter:

RESPONSE_TYPE: [parts_recommendation|explanation|quick_answer|car_comparison|etc.]
TITLE: [descriptive title]

For lists: Use ITEM 1:, ITEM 2: with fields (name, price, url, why, best_for)
For explanations: Use EXPLANATION:, KEY_POINTS:
For quick answers: Use ANSWER:, DETAIL:

Include prices and URLs when available. Be concise - Formatter handles presentation.`;

// =============================================================================
// AGENT-SPECIFIC SCHEMAS
// =============================================================================

/**
 * Parts Research output schema
 */
export const PARTS_OUTPUT_SCHEMA = `## Your Output Format

Structure your response exactly like this:

RESPONSE_TYPE: parts_recommendation
TITLE: [Best {Category} for {Car}]
BUILD_CONTEXT: [User's build stage if known]

ITEM 1:
- name: [Brand + Product Name]
- price: $[price]
- url: [actual vendor URL]
- why: [1-2 sentences on why recommended]
- best_for: [Stage 1|Stage 2|High HP|etc.]
- tier: [budget|mid|premium]
- fitment: [confirmed for {platform}|verify on vendor site]

ITEM 2:
...

ITEM 5:
...

PRICE_RANGE: $[min] - $[max]
QUICK_PICKS:
- Best Overall: [name]
- Best Value: [name]
- Premium Choice: [name]

FOLLOW_UP: [Suggested next question]`;

/**
 * Car Discovery output schema
 */
export const CAR_DISCOVERY_OUTPUT_SCHEMA = `## Your Output Format

For car overviews:
RESPONSE_TYPE: car_overview
TITLE: [Year Make Model]

SPECS:
- Engine: [engine]
- Power: [hp/tq]
- 0-60: [time]
- Price Range: [used price range]

HIGHLIGHTS:
- [Key strength 1]
- [Key strength 2]

WATCH_OUT:
- [Known issue 1]
- [Known issue 2]

VERDICT: [1-2 sentence summary]
FOLLOW_UP: [Suggested question]

---

For comparisons:
RESPONSE_TYPE: car_comparison
TITLE: [Car A vs Car B]

CAR_A: [Name]
- [key specs]
- Strengths: [list]
- Weaknesses: [list]

CAR_B: [Name]
- [key specs]
- Strengths: [list]
- Weaknesses: [list]

VERDICT: [which is better for what use case]`;

/**
 * Build Planning output schema
 */
export const BUILD_PLANNING_OUTPUT_SCHEMA = `## Your Output Format

For build recommendations:
RESPONSE_TYPE: build_recommendation
TITLE: [Build Plan for {Goal}]
CURRENT_BUILD: [User's current mods/stage]
TARGET: [User's goal]

RECOMMENDED_ORDER:
1. [Mod 1] - $[price] - [why first]
2. [Mod 2] - $[price] - [why second]
3. [Mod 3] - $[price] - [why third]

TOTAL_ESTIMATED: $[total]
EXPECTED_GAINS: [HP/performance improvement]

CONSIDERATIONS:
- [Important note 1]
- [Important note 2]

FOLLOW_UP: [Suggested question]

---

For mod impact calculations:
RESPONSE_TYPE: mod_impact
TITLE: [Mods] Impact on [Car]

BASELINE: [stock specs]
WITH_MODS: [projected specs]

GAINS:
- HP: +[gain]
- Torque: +[gain]
- 0-60: -[improvement]

CAVEATS: [any notes about estimates]`;

/**
 * Knowledge/Explanation output schema
 */
export const KNOWLEDGE_OUTPUT_SCHEMA = `## Your Output Format

RESPONSE_TYPE: explanation
TITLE: [Topic]

EXPLANATION:
[Clear, structured explanation in 2-4 paragraphs]

KEY_POINTS:
- [Point 1]
- [Point 2]
- [Point 3]

EXAMPLE: [Practical real-world example if helpful]

RELATED: [Related topics user might want to explore]`;

/**
 * Community/Events output schema
 */
export const EVENTS_OUTPUT_SCHEMA = `## Your Output Format

RESPONSE_TYPE: events_list
TITLE: [Events near {Location}]
SEARCH_AREA: [city/region]

EVENT 1:
- name: [Event Name]
- date: [Date/Time]
- location: [Venue, City]
- type: [Cars & Coffee|Track Day|Car Show|etc.]
- url: [event link if available]
- details: [brief description]

EVENT 2:
...

NO_EVENTS_FOUND: [If no events, suggest alternatives]`;

/**
 * Quick Answer output schema
 */
export const QUICK_ANSWER_SCHEMA = `## Your Output Format

RESPONSE_TYPE: quick_answer
ANSWER: [Direct, concise answer]
DETAIL: [Optional 1-2 sentence elaboration]
FOLLOW_UP: [Optional suggested deeper question]`;

// =============================================================================
// FORMATTER PARSING HELPERS
// =============================================================================

/**
 * Parse structured output from an agent response
 * @param {string} text - Raw agent response
 * @returns {Object} Parsed structure or null if not structured
 */
export function parseStructuredOutput(text) {
  if (!text) return null;

  // Check if response follows structured format
  const typeMatch = text.match(/^RESPONSE_TYPE:\s*(\w+)/m);
  if (!typeMatch) return null;

  const responseType = typeMatch[1];
  const result = { responseType, raw: text };

  // Parse title
  const titleMatch = text.match(/^TITLE:\s*(.+)$/m);
  if (titleMatch) result.title = titleMatch[1].trim();

  // Parse items (for recommendation lists)
  const items = [];
  const itemRegex = /ITEM \d+:\n([\s\S]*?)(?=ITEM \d+:|PRICE_RANGE:|SUMMARY:|FOLLOW_UP:|$)/g;
  let match;
  while ((match = itemRegex.exec(text)) !== null) {
    const itemText = match[1];
    const item = {};

    // Parse item fields
    const nameMatch = itemText.match(/- name:\s*(.+)/);
    if (nameMatch) item.name = nameMatch[1].trim();

    const priceMatch = itemText.match(/- price:\s*(.+)/);
    if (priceMatch) item.price = priceMatch[1].trim();

    const urlMatch = itemText.match(/- url:\s*(.+)/);
    if (urlMatch) item.url = urlMatch[1].trim();

    const whyMatch = itemText.match(/- why:\s*(.+)/);
    if (whyMatch) item.why = whyMatch[1].trim();

    const bestForMatch = itemText.match(/- best_for:\s*(.+)/);
    if (bestForMatch) item.bestFor = bestForMatch[1].trim();

    const tierMatch = itemText.match(/- tier:\s*(.+)/);
    if (tierMatch) item.tier = tierMatch[1].trim();

    if (Object.keys(item).length > 0) items.push(item);
  }
  if (items.length > 0) result.items = items;

  // Parse other common fields
  const explanationMatch = text.match(
    /EXPLANATION:\n([\s\S]*?)(?=KEY_POINTS:|EXAMPLE:|FOLLOW_UP:|$)/
  );
  if (explanationMatch) result.explanation = explanationMatch[1].trim();

  const answerMatch = text.match(/^ANSWER:\s*(.+)$/m);
  if (answerMatch) result.answer = answerMatch[1].trim();

  const detailMatch = text.match(/^DETAIL:\s*(.+)$/m);
  if (detailMatch) result.detail = detailMatch[1].trim();

  const verdictMatch = text.match(/^VERDICT:\s*(.+)$/m);
  if (verdictMatch) result.verdict = verdictMatch[1].trim();

  const followUpMatch = text.match(/^FOLLOW_UP:\s*(.+)$/m);
  if (followUpMatch) result.followUp = followUpMatch[1].trim();

  return result;
}

/**
 * Check if text appears to be structured output
 */
export function isStructuredOutput(text) {
  if (!text) return false;
  return /^RESPONSE_TYPE:\s*\w+/m.test(text);
}

// =============================================================================
// EXPORTS
// =============================================================================

const outputSchema = {
  RESPONSE_TYPES,
  OUTPUT_STRUCTURE_INSTRUCTIONS,
  OUTPUT_STRUCTURE_COMPACT,
  PARTS_OUTPUT_SCHEMA,
  CAR_DISCOVERY_OUTPUT_SCHEMA,
  BUILD_PLANNING_OUTPUT_SCHEMA,
  KNOWLEDGE_OUTPUT_SCHEMA,
  EVENTS_OUTPUT_SCHEMA,
  QUICK_ANSWER_SCHEMA,
  parseStructuredOutput,
  isStructuredOutput,
};

export default outputSchema;
