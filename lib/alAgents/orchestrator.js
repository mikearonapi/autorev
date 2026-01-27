/**
 * AL Orchestrator
 *
 * Uses Claude Haiku to quickly classify user intent and route to the appropriate specialist agent.
 * Handles multi-intent detection, follow-up routing, and image detection.
 *
 * @module lib/alAgents/orchestrator
 */

import { getAnthropicConfig } from '@/lib/observability';
import { MODELS } from './baseAgent.js';
import { INTENT_TYPES } from './index.js';

const ORCHESTRATOR_MODEL = MODELS.HAIKU;
const ORCHESTRATOR_MAX_TOKENS = 200;

// Haiku pricing (per 1M tokens)
const HAIKU_PRICING = {
  inputPerMillion: 0.25,
  outputPerMillion: 1.25,
};

/**
 * Build the orchestrator's system prompt
 */
function buildOrchestratorPrompt() {
  return `You are an intent classifier for AutoRev's AI assistant AL. Your job is to analyze user messages and classify them into one of 8 specialist categories.

## Categories

1. **car_discovery** - Questions about specific cars, specs, comparisons, reliability, maintenance
   - "What's the best sports car under $60k?"
   - "Tell me about the 911 GT3"
   - "Compare Cayman vs 911"
   - "Is the M3 reliable?"
   - "What oil does my car need?"

2. **build_planning** - Help planning modifications, build reviews, compatibility
   - "Review my build"
   - "What mods should I do first?"
   - "Are these parts compatible?"
   - "What's next for my build?"

3. **parts_research** - Finding and comparing specific parts
   - "Best exhaust for my 981?"
   - "Find me an intake"
   - "Compare these two headers"

4. **knowledge** - Educational questions, how things work
   - "How does a turbo work?"
   - "What is forced induction?"
   - "Explain limited slip differentials"

5. **community_events** - Events, forum insights, community
   - "Track days near Austin"
   - "What do owners say about IMS?"
   - "Cars and coffee near me"

6. **performance_data** - Performance calculations, dyno data, lap times
   - "How much HP will a tune add?"
   - "What's my 0-60 after mods?"
   - "Show dyno data for GT3"

7. **vision** - Image analysis (ONLY when user has attached an image)
   - User uploaded a photo and asks about it

8. **generalist** - Everything else: jokes, platform questions, chitchat, follow-ups
   - "Tell me a car joke"
   - "How do I earn points?"
   - "Yes" / "OK" / "Thanks"
   - Anything that doesn't fit above

## Rules

1. Choose the MOST SPECIFIC category that fits
2. If the query could fit multiple categories, choose the primary intent
3. Use "generalist" for vague queries, follow-ups, or chitchat
4. Use "vision" ONLY if the message mentions an attached image
5. Be decisive - pick one category

## Output Format

Respond with ONLY a JSON object, no other text:
{"intent": "category_name", "confidence": 0.0-1.0, "car_context": "slug_if_detected", "reasoning": "brief explanation"}`;
}

/**
 * Detect if a message contains an image attachment
 */
function hasImageAttachment(message) {
  if (!message) return false;

  // Check for attachment_ids in message content
  if (Array.isArray(message.content)) {
    return message.content.some(
      (block) =>
        block.type === 'image' ||
        block.attachment_id ||
        (block.type === 'text' &&
          /\[image|\.jpg|\.png|\.jpeg|uploaded|photo|picture/i.test(block.text))
    );
  }

  // Check message text for image references
  if (typeof message.content === 'string') {
    return /\[image|attached|uploaded|photo|picture|this image|the image/i.test(message.content);
  }

  return false;
}

/**
 * Extract the user's latest message text
 */
function getLatestUserMessage(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return null;
  }

  // Find the last user message
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') {
      const content = messages[i].content;
      if (typeof content === 'string') {
        return { text: content, message: messages[i] };
      }
      if (Array.isArray(content)) {
        const textBlock = content.find((b) => b.type === 'text');
        return { text: textBlock?.text || '', message: messages[i] };
      }
    }
  }

  return null;
}

/**
 * Quick pattern-based classification for obvious intents
 * Returns null if pattern matching isn't confident enough
 */
function quickClassify(text, hasImage) {
  if (!text) return null;
  const lower = text.toLowerCase().trim();

  // Vision - if image is attached
  if (hasImage) {
    return {
      intent: INTENT_TYPES.VISION,
      confidence: 0.95,
      reasoning: 'Image attachment detected',
    };
  }

  // Very short responses are likely follow-ups → Generalist
  if (
    lower.length < 10 &&
    /^(yes|no|ok|okay|sure|thanks|thank you|yep|nope|go on|continue|more)$/i.test(lower)
  ) {
    return { intent: INTENT_TYPES.GENERALIST, confidence: 0.9, reasoning: 'Follow-up response' };
  }

  // Jokes and chitchat → Generalist (be specific to avoid matching "tell me about the car")
  if (/joke|funny|laugh|tell me a (joke|story|fun)/i.test(lower)) {
    return {
      intent: INTENT_TYPES.GENERALIST,
      confidence: 0.85,
      reasoning: 'Joke/chitchat request',
    };
  }

  // Platform questions → Generalist
  if (/how (do i|does|to) use|autorev|points|garage score/i.test(lower)) {
    return { intent: INTENT_TYPES.GENERALIST, confidence: 0.85, reasoning: 'Platform question' };
  }

  // Events → Community Events
  if (/track day|cars and coffee|event|meetup|near me.*event|event.*near/i.test(lower)) {
    return { intent: INTENT_TYPES.COMMUNITY_EVENTS, confidence: 0.85, reasoning: 'Event query' };
  }

  // Educational → Knowledge
  if (
    /^(what is|how does|explain|teach me|difference between)/i.test(lower) &&
    !/what is the best|what is my/i.test(lower)
  ) {
    return { intent: INTENT_TYPES.KNOWLEDGE, confidence: 0.8, reasoning: 'Educational question' };
  }

  // Performance calculations → Performance Data
  if (/how much (hp|horsepower|power)|0-60|quarter mile|dyno/i.test(lower)) {
    return {
      intent: INTENT_TYPES.PERFORMANCE_DATA,
      confidence: 0.85,
      reasoning: 'Performance calculation',
    };
  }

  // Build planning → Build Planning
  if (
    /my build|review my|what mods|mod order|install order|compatible|compatibility|next upgrade|stage \d/i.test(
      lower
    )
  ) {
    return {
      intent: INTENT_TYPES.BUILD_PLANNING,
      confidence: 0.85,
      reasoning: 'Build planning query',
    };
  }

  // Parts research → Parts Research
  if (/(find|search|best|recommend).*(exhaust|intake|tune|header|downpipe|part)/i.test(lower)) {
    return {
      intent: INTENT_TYPES.PARTS_RESEARCH,
      confidence: 0.8,
      reasoning: 'Parts search query',
    };
  }

  // Car discovery → Car Discovery (broad catch for car questions)
  if (
    /best (car|sports car|daily)|compare|vs\s|reliable|known issues|tell me about|what oil|maintenance|service interval/i.test(
      lower
    )
  ) {
    return {
      intent: INTENT_TYPES.CAR_DISCOVERY,
      confidence: 0.8,
      reasoning: 'Car discovery query',
    };
  }

  // No confident match
  return null;
}

/**
 * Classify user intent using Claude Haiku
 */
async function classifyWithLLM(text, conversationHistory = [], observability = {}) {
  const { apiUrl, headers } = getAnthropicConfig({
    ...observability,
    properties: {
      ...observability.properties,
      agentId: 'orchestrator',
      agentModel: ORCHESTRATOR_MODEL,
    },
  });

  // Build messages with recent conversation context
  const recentContext = conversationHistory.slice(-4).map((m) => ({
    role: m.role,
    content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
  }));

  const requestBody = {
    model: ORCHESTRATOR_MODEL,
    max_tokens: ORCHESTRATOR_MAX_TOKENS,
    system: buildOrchestratorPrompt(),
    messages: [
      ...recentContext,
      {
        role: 'user',
        content: `Classify this message: "${text}"`,
      },
    ],
  };

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    console.error('[Orchestrator] Classification API error:', response.status);
    return { intent: INTENT_TYPES.GENERALIST, confidence: 0.5, reasoning: 'API error fallback' };
  }

  const result = await response.json();
  const responseText = result.content?.[0]?.text || '';

  try {
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        intent: parsed.intent || INTENT_TYPES.GENERALIST,
        confidence: parsed.confidence || 0.7,
        car_context: parsed.car_context || null,
        reasoning: parsed.reasoning || '',
        usage: result.usage,
      };
    }
  } catch (e) {
    console.error('[Orchestrator] Failed to parse classification:', e);
  }

  return { intent: INTENT_TYPES.GENERALIST, confidence: 0.5, reasoning: 'Parse error fallback' };
}

/**
 * Main orchestrator function
 * Classifies intent and returns routing decision
 */
export async function classifyIntent({
  messages,
  context = {},
  skipLLM = false,
  observability = {},
}) {
  const latest = getLatestUserMessage(messages);
  if (!latest) {
    return {
      intent: INTENT_TYPES.GENERALIST,
      confidence: 0.5,
      reasoning: 'No user message found',
      usedLLM: false,
    };
  }

  const { text, message } = latest;
  const hasImage = hasImageAttachment(message);

  // Try quick classification first (faster, no API call)
  const quickResult = quickClassify(text, hasImage);
  if (quickResult && quickResult.confidence >= 0.8) {
    return {
      ...quickResult,
      usedLLM: false,
      car_context: context.currentCar?.slug || null,
    };
  }

  // If quick classification isn't confident, use LLM
  if (!skipLLM) {
    const llmResult = await classifyWithLLM(text, messages, observability);
    return {
      ...llmResult,
      usedLLM: true,
    };
  }

  // Fallback to quick result or generalist
  return (
    quickResult || {
      intent: INTENT_TYPES.GENERALIST,
      confidence: 0.5,
      reasoning: 'Default fallback',
      usedLLM: false,
    }
  );
}

/**
 * Estimate orchestrator cost
 */
export function estimateOrchestratorCost(inputTokens, outputTokens) {
  const inputCost = (inputTokens / 1_000_000) * HAIKU_PRICING.inputPerMillion;
  const outputCost = (outputTokens / 1_000_000) * HAIKU_PRICING.outputPerMillion;
  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
  };
}

const orchestrator = {
  classifyIntent,
  estimateOrchestratorCost,
  ORCHESTRATOR_MODEL,
};

export default orchestrator;
