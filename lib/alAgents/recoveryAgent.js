/**
 * AL Recovery Agent
 *
 * A specialized agent that attempts to generate a helpful response
 * when the primary specialist agent fails or produces an invalid response.
 *
 * This agent:
 * 1. Uses broader tools including search_web
 * 2. Has explicit instructions for handling unknown cars
 * 3. Focuses on providing actionable value regardless of database coverage
 *
 * @module lib/alAgents/recoveryAgent
 */

import Anthropic from '@anthropic-ai/sdk';

import { getToolDefinitions } from '../alTools';

const anthropic = new Anthropic();

// =============================================================================
// RECOVERY AGENT CONFIGURATION
// =============================================================================

const RECOVERY_MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 2500;

// Tools available to the recovery agent
const RECOVERY_TOOLS = [
  'search_web',
  'search_encyclopedia',
  'get_car_ai_context', // Try database one more time
];

// =============================================================================
// RECOVERY AGENT SYSTEM PROMPT
// =============================================================================

const RECOVERY_SYSTEM_PROMPT = `You are AL (AutoRev AI) - Recovery Mode.

You've been activated because the primary response failed. Your job is to ALWAYS provide helpful, actionable information to the user.

## THE GOLDEN RULE
**NEVER tell the user you don't have information.** Use your automotive expertise and search tools to help them.

## Context
The user asked about: {user_message}
{car_context}

## Your Approach

1. **Acknowledge their specific question/car**
   - Use the exact car name they mentioned
   - Show you understand what they're asking

2. **Use search_web if needed**
   - For cars not in our database, search for current information
   - Search for mods, reviews, common issues

3. **Apply universal automotive knowledge**
   - Mod principles work across platforms
   - Stage 1/2/3 progressions are universal
   - Common issues by engine type (V6, turbo I4, etc.)

## Response Format

For performance questions, use this structure:

## Making Your [Year] [Make] [Model] Faster

**Stage 1 - Bolt-Ons ($X-$Y):**
- Cold Air Intake - [specific brand options], gains
- Exhaust - [specific brand options], gains  
- ECU Tune - [platform-specific options], gains

**Total Expected Gain: ~X-Y WHP**

**Stage 2 (if applicable):**
- Headers/Downpipe
- Supporting mods

**Handling Upgrades:**
- Coilovers, sway bars, tires

What's your budget and primary goal?

---

For research questions:

## [Year] [Make] [Model] - What You Need to Know

**Performance:**
- Engine: [details]
- Power: [specs]

**Common Issues:**
- [Issue 1]
- [Issue 2]

**Mod Potential:**
- [Assessment]

Would you like recommendations for upgrades or more details on any aspect?

## CRITICAL RULES

1. **NEVER say** "I don't have data on that car"
2. **NEVER give** an empty or placeholder response
3. **ALWAYS reference** the specific car they mentioned
4. **ALWAYS provide** actionable next steps
5. **USE search_web** for any car not in the database

## Tone
Enthusiastic but knowledgeable. You're the helpful friend at the car meet who knows something about everything.`;

// =============================================================================
// RECOVERY AGENT FUNCTIONS
// =============================================================================

/**
 * Execute the recovery agent to generate a fallback response
 *
 * @param {Object} params - Recovery parameters
 * @param {string} params.message - Original user message
 * @param {Object} params.context - Context from original request
 * @param {string} params.failureReason - Why the original agent failed
 * @param {string} params.originalIntent - What intent was classified
 * @param {string} params.correlationId - Request correlation ID
 * @returns {Promise<Object>} Recovery result with response
 */
export async function executeRecoveryAgent({
  message,
  context = {},
  failureReason,
  originalIntent,
  correlationId,
}) {
  const startTime = Date.now();

  console.info(
    `[AL Recovery:${correlationId}] Activating recovery agent. ` +
      `Failure reason: ${failureReason}, Original intent: ${originalIntent}`
  );

  // Build car context string
  let carContextStr = '';
  if (context.mentionedCar) {
    const car = context.mentionedCar;
    carContextStr = `Mentioned car: ${car.year || ''} ${car.make || ''} ${car.model || ''} (${car.inDatabase ? 'in database' : 'NOT in database'})`;
    if (car.similarCars?.length > 0) {
      carContextStr += `\nSimilar cars in database: ${car.similarCars.map((c) => c.name).join(', ')}`;
    }
  } else if (context.car) {
    carContextStr = `Current car context: ${context.car.name || context.car.slug || 'Unknown'}`;
  } else {
    carContextStr = 'No specific car context available.';
  }

  // Build the system prompt with context
  const systemPrompt = RECOVERY_SYSTEM_PROMPT.replace('{user_message}', message).replace(
    '{car_context}',
    carContextStr
  );

  // Get tool definitions
  const allTools = await getToolDefinitions(context.car?.id, null, correlationId);
  const availableTools = allTools.filter((tool) => RECOVERY_TOOLS.includes(tool.name));

  try {
    // Initial API call
    let response = await anthropic.messages.create({
      model: RECOVERY_MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
      tools: availableTools.length > 0 ? availableTools : undefined,
    });

    // Handle tool use (simple single-round for recovery)
    if (response.stop_reason === 'tool_use') {
      const toolUseBlock = response.content.find((block) => block.type === 'tool_use');

      if (toolUseBlock) {
        console.info(`[AL Recovery:${correlationId}] Using tool: ${toolUseBlock.name}`);

        // Execute the tool
        const { executeToolHandler } = await import('../alTools');
        let toolResult;
        try {
          toolResult = await executeToolHandler(toolUseBlock.name, toolUseBlock.input, {
            carId: context.car?.id,
            correlationId,
          });
        } catch (toolErr) {
          console.warn(`[AL Recovery:${correlationId}] Tool execution failed:`, toolErr.message);
          toolResult = { error: toolErr.message };
        }

        // Continue with tool result
        response = await anthropic.messages.create({
          model: RECOVERY_MODEL,
          max_tokens: MAX_TOKENS,
          system: systemPrompt,
          messages: [
            { role: 'user', content: message },
            { role: 'assistant', content: response.content },
            {
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: toolUseBlock.id,
                  content: JSON.stringify(toolResult),
                },
              ],
            },
          ],
          tools: availableTools.length > 0 ? availableTools : undefined,
        });
      }
    }

    // Extract text response
    const textBlock = response.content.find((block) => block.type === 'text');
    const recoveryResponse = textBlock?.text || '';

    const durationMs = Date.now() - startTime;

    console.info(
      `[AL Recovery:${correlationId}] Recovery complete. ` +
        `Response length: ${recoveryResponse.length}, Duration: ${durationMs}ms`
    );

    return {
      success: recoveryResponse.length > 50,
      response: recoveryResponse,
      usage: {
        inputTokens: response.usage?.input_tokens || 0,
        outputTokens: response.usage?.output_tokens || 0,
      },
      durationMs,
    };
  } catch (err) {
    console.error(`[AL Recovery:${correlationId}] Recovery agent failed:`, err.message);

    return {
      success: false,
      response: null,
      error: err.message,
      durationMs: Date.now() - startTime,
    };
  }
}

/**
 * Quick recovery - uses pre-built templates without API call
 * Faster fallback when recovery agent also fails
 *
 * @param {string} intent - The classified intent
 * @param {Object} context - Request context
 * @returns {string} A helpful template response
 */
export function getQuickRecoveryResponse(intent, context = {}) {
  const carName = context.carMentionFormatted || context.car?.name || 'your vehicle';

  const templates = {
    build_planning: `## Making ${carName} Faster

Here's a proven upgrade path that works for most platforms:

**Stage 1 - Foundation (~$1,500-2,500):**
| Mod | Typical Gain | Notes |
|-----|-------------|-------|
| Cold Air Intake | 5-15 HP | Easy install, better throttle response |
| Cat-back Exhaust | 10-20 HP | Better flow + sound |
| ECU Tune | 15-30 HP | Ties everything together |

**Expected Stage 1 Gain: 35-50 WHP**

**What's Next:**
Tell me your budget and goals (daily driver, weekend fun, or track prep), and I'll give you a more specific upgrade path.`,

    parts_research: `## Performance Parts for ${carName}

**Stage 1 Bolt-Ons (Best Bang for Buck):**
- **Cold Air Intake** - K&N, Injen, or brand-specific options
- **Cat-back Exhaust** - Look for mandrel-bent, quality brands
- **ECU Tune** - Platform-specific tuners offer the best results

**Where to Shop:**
- **ECS Tuning** - Wide selection, good prices
- **FCP Euro** - Lifetime replacement warranty
- **Platform-specific forums** - Often have group buys

What specific part category are you most interested in? I can give more targeted recommendations.`,

    car_discovery: `## ${carName}

I'd be happy to help you learn more about this vehicle. What aspect interests you most?

**Common Questions:**
- **Performance** - Power specs, acceleration, handling
- **Reliability** - Known issues, maintenance costs
- **Modifications** - Popular upgrades, tuning potential
- **Buying advice** - What to look for, fair pricing

Just let me know what you'd like to focus on!`,

    default: `I'd be happy to help with ${carName}!

To give you the best recommendations, could you tell me:
- **Your goal** - More power, better handling, or reliability?
- **Your budget** - Rough range helps target suggestions
- **Current state** - Stock, or already have some mods?

The more specific you are, the better I can tailor my advice.`,
  };

  return templates[intent] || templates.default;
}

const recoveryAgent = {
  executeRecoveryAgent,
  getQuickRecoveryResponse,
};

export default recoveryAgent;
