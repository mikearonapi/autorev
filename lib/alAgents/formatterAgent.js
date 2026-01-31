/**
 * Formatter Agent
 *
 * The FINAL step in the multi-agent pipeline before responses reach users.
 * This agent ensures all output adheres to presentation guidelines.
 *
 * Design principles:
 * - Uses Haiku for speed (adds ~200-400ms latency)
 * - No tools - pure text transformation
 * - Preserves all substantive content
 * - Strips preamble, tool references, and action announcements
 *
 * @module lib/alAgents/formatterAgent
 */

import { executeWithCircuitBreaker } from '@/lib/aiCircuitBreaker';
import { calculateTokenCost, formatCentsAsDollars } from '@/lib/alConfig';
import { getAnthropicConfig } from '@/lib/observability';

import { buildFormatterPrompt } from './prompts/formatterPrompt.js';

// =============================================================================
// CONFIGURATION
// =============================================================================

const FORMATTER_MODEL = 'claude-3-5-haiku-20241022'; // Fast and cheap
const FORMATTER_MAX_TOKENS = 4096; // Match input size allowance

// =============================================================================
// TELEMETRY FOR RESPONSE QUALITY MONITORING
// =============================================================================

/**
 * Log structured telemetry event for response quality issues.
 * These events can be consumed by monitoring/alerting systems.
 *
 * @param {string} eventType - Type of issue detected
 * @param {Object} details - Event details
 */
function logResponseQualityEvent(eventType, details) {
  const event = {
    event: `AL_RESPONSE_QUALITY_${eventType.toUpperCase()}`,
    timestamp: new Date().toISOString(),
    ...details,
  };

  // Log as JSON for structured logging pipelines (Datadog, etc.)
  console.error(`[AL:ResponseQuality] ${JSON.stringify(event)}`);

  // Also log human-readable for debugging
  if (eventType === 'EMPTY_RESPONSE') {
    console.error(
      `[Formatter:${details.correlationId}] ALERT: Empty/minimal response detected. ` +
        `This is a bug - user would see nothing. ` +
        `Raw: ${details.rawLength} chars, Cleaned: ${details.cleanedLength} chars`
    );
  } else if (eventType === 'INTERNAL_BLOCKS_ONLY') {
    console.error(
      `[Formatter:${details.correlationId}] ALERT: Response contained ONLY internal blocks. ` +
        `The agent failed to generate user-facing content. ` +
        `Internal blocks should be secondary to user content.`
    );
  } else if (eventType === 'FALLBACK_USED') {
    console.warn(
      `[Formatter:${details.correlationId}] Fallback response used. ` +
        `Reason: ${details.reason}. Original length: ${details.rawLength} chars`
    );
  }
}

/**
 * Telemetry categories for tracking response quality issues
 */
const RESPONSE_QUALITY_ISSUES = {
  EMPTY_RESPONSE: 'EMPTY_RESPONSE', // Response is empty or minimal (<20 chars)
  INTERNAL_BLOCKS_ONLY: 'INTERNAL_BLOCKS_ONLY', // Response only had <parts_to_save> etc.
  FALLBACK_USED: 'FALLBACK_USED', // Had to use fallback response
  FORMATTER_ERROR: 'FORMATTER_ERROR', // Formatter LLM call failed
  STRIPPED_TOO_MUCH: 'STRIPPED_TOO_MUCH', // Stripping removed most content
};

/**
 * Contextual fallback messages based on detected intent.
 * Used when the original response is empty or unusable.
 *
 * CRITICAL: These messages must NEVER mention database limitations.
 * Users don't care about our data sources - they want helpful answers.
 */
const FALLBACK_MESSAGES = {
  // Default fallback for parts research (most common empty response case)
  parts_research: `## Performance Upgrade Recommendations

Here are proven approaches to make your car faster:

**Stage 1 Bolt-Ons (Best Bang for Buck):**
- **Cold Air Intake** - Improved throttle response, 5-15 HP
- **Cat-back Exhaust** - Better flow, great sound, 10-20 HP
- **ECU Tune** - Unlocks hidden performance, 15-30+ HP

**Popular Parts Vendors:**
- **034 Motorsport** - European performance specialists
- **ECS Tuning** - Wide selection, good prices
- **FCP Euro** - Lifetime replacement warranty

**For More Specific Recommendations:**
Tell me your year, make, model, and what mods you already have. I can then give you targeted suggestions for your exact platform.

What would you like to focus on first?`,

  // Fallback for build/mod planning
  build_planning: `## Build Planning Guidance

Here's how to approach making your car faster:

**Recommended Mod Order:**
1. **Intake + Exhaust + Tune** - The holy trinity, best value combo
2. **Suspension** - Coilovers or quality springs improve handling
3. **Brakes** - Pads and fluid before adding more power
4. **Forced Induction** - Turbo/supercharger for serious power (requires supporting mods)

**Key Principles:**
- Supporting mods scale with power targets
- Tune ties everything together
- Don't skip cooling upgrades

Could you share your year, make, model, and current mods? I'll give you a personalized upgrade path.`,

  // Fallback for car questions
  car_discovery: `## Vehicle Information

I'd be happy to help you learn more about this car. To give you the most relevant information, let me know what you're most interested in:

- **Performance specs** - Power, acceleration, handling
- **Reliability** - Common issues, maintenance costs
- **Modifications** - Popular upgrades, tuning potential
- **Buying advice** - What to look for, pricing trends

What aspect would you like me to focus on?`,

  // Fallback for general queries - NEVER mention database
  default: `I'd be happy to help with that! To give you the best recommendations, could you share a bit more detail?

**Helpful info:**
- **Year, Make, Model** of your vehicle
- **Current mods** (if any)
- **Goals** - Daily driver, track, weekend fun?
- **Budget range** (optional)

The more specific you are, the better I can tailor my recommendations to your exact situation.

What would you like to focus on?`,

  // For when response was truly empty - ask clarifying question
  empty_response: `Let me help you with that. What specific aspect would you like me to focus on?

- **Performance upgrades** - Making your car faster
- **Reliability info** - Known issues and maintenance
- **Buying advice** - What to look for when shopping
- **Comparisons** - How it stacks up vs alternatives

Just let me know what's most important to you!`,
};

/**
 * Get an appropriate fallback message based on content hints.
 * Analyzes the original content/query to determine the best contextual fallback.
 *
 * @param {string} rawContent - Original content (may contain hints about intent)
 * @param {string} intent - Optional intent classification
 * @returns {string} Contextual fallback message
 */
export function getContextualFallback(rawContent, intent = null) {
  // If we have an explicit intent, use it
  if (intent) {
    if (intent === 'parts_research') return FALLBACK_MESSAGES.parts_research;
    if (intent === 'build_planning') return FALLBACK_MESSAGES.build_planning;
    if (intent === 'car_discovery') return FALLBACK_MESSAGES.car_discovery;
  }

  // Otherwise, try to detect from content
  const content = (rawContent || '').toLowerCase();

  // Parts research indicators
  if (
    content.includes('<parts_to_save>') ||
    content.includes('upgrade_key') ||
    content.includes('research_parts') ||
    /\b(intake|exhaust|tune|coilover|brake|turbo|supercharger)\b/.test(content)
  ) {
    return FALLBACK_MESSAGES.parts_research;
  }

  // Build planning indicators
  if (/\b(build|mod order|install order|what mods|next upgrade|stage [123])\b/.test(content)) {
    return FALLBACK_MESSAGES.build_planning;
  }

  // Car discovery indicators
  if (/\b(reliable|reliability|compare|specs|issues|maintenance)\b/.test(content)) {
    return FALLBACK_MESSAGES.car_discovery;
  }

  // Check if truly empty vs just short
  if (!rawContent || rawContent.trim().length < 20) {
    return FALLBACK_MESSAGES.empty_response;
  }

  return FALLBACK_MESSAGES.default;
}

// =============================================================================
// FORMATTER AGENT
// =============================================================================

/**
 * Format a response before sending to the user.
 * This is the final quality gate in the pipeline.
 *
 * @param {Object} params - Formatting parameters
 * @param {string} params.rawResponse - The raw response from specialist agent
 * @param {string} params.correlationId - Request correlation ID
 * @param {string} params.userId - User ID for observability
 * @returns {Promise<Object>} Formatted response with usage stats
 */
export async function formatResponse({ rawResponse, correlationId, userId }) {
  // STEP 1: Strip internal blocks (parts_to_save, internal_data)
  let cleanedInput = stripInternalBlocks(rawResponse);

  // Detect if stripping internal blocks removed ALL content (bug scenario)
  // This happens when the LLM only generates <parts_to_save> block without user-facing content
  const hadInternalBlocks =
    rawResponse &&
    (rawResponse.includes('<parts_to_save>') || rawResponse.includes('<internal_data>'));
  const strippedEverything = hadInternalBlocks && (!cleanedInput || cleanedInput.length < 20);

  if (strippedEverything) {
    // Log structured telemetry for monitoring/alerting
    logResponseQualityEvent(RESPONSE_QUALITY_ISSUES.INTERNAL_BLOCKS_ONLY, {
      correlationId,
      userId,
      rawLength: rawResponse?.length || 0,
      cleanedLength: cleanedInput?.length || 0,
      hadInternalBlocks: true,
      preview: rawResponse?.slice(0, 200) || '',
    });

    // Return a contextual fallback message instead of empty response
    return {
      response: getContextualFallback(rawResponse),
      usage: { inputTokens: 0, outputTokens: 0, costCents: 0 },
      skipped: true,
      reason: 'internal_blocks_only',
      originalLength: rawResponse?.length || 0,
      qualityIssue: RESPONSE_QUALITY_ISSUES.INTERNAL_BLOCKS_ONLY,
    };
  }

  // STEP 2: Strip structured markers and preamble (RESPONSE_TYPE:, "I'll search...", etc.)
  // This is lightweight and doesn't require LLM
  cleanedInput = stripStructuredMarkers(cleanedInput);

  // STEP 2.5: Normalize to canonical format (ensures consistent formatting)
  cleanedInput = normalizeCanonicalFormat(cleanedInput);

  // Detect very short responses that might indicate a problem
  if (cleanedInput && cleanedInput.length < 50 && cleanedInput.length > 0) {
    logResponseQualityEvent(RESPONSE_QUALITY_ISSUES.EMPTY_RESPONSE, {
      correlationId,
      userId,
      rawLength: rawResponse?.length || 0,
      cleanedLength: cleanedInput?.length || 0,
      content: cleanedInput,
    });
  }

  // Skip formatting for very short responses (likely errors or simple acks)
  if (!cleanedInput || cleanedInput.length < 50) {
    return {
      response: cleanedInput,
      usage: { inputTokens: 0, outputTokens: 0, costCents: 0 },
      skipped: true,
    };
  }

  // Quick heuristic check - if response NOW starts with content (after cleaning), skip LLM formatting
  if (startsWithContent(cleanedInput)) {
    return {
      response: cleanedInput,
      usage: { inputTokens: 0, outputTokens: 0, costCents: 0 },
      skipped: true,
      reason: 'already_clean',
    };
  }

  const startTime = Date.now();

  try {
    const systemPrompt = buildFormatterPrompt();

    const { apiUrl, headers } = getAnthropicConfig({
      userId,
      requestId: correlationId,
      properties: { agent: 'formatter' },
    });

    const result = await executeWithCircuitBreaker(
      async () => {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: FORMATTER_MODEL,
            max_tokens: FORMATTER_MAX_TOKENS,
            system: systemPrompt,
            messages: [
              {
                role: 'user',
                content: `Clean up this response for the user:\n\n${cleanedInput}`,
              },
            ],
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(`Formatter API error: ${response.status} - ${error?.error?.message}`);
        }

        return await response.json();
      },
      { provider: 'anthropic', throwOnOpen: true }
    );

    // Strip internal blocks from formatter output as well (in case LLM didn't remove them)
    const formattedResponse = stripInternalBlocks(result.result.content?.[0]?.text) || cleanedInput;
    const inputTokens = result.result.usage?.input_tokens || 0;
    const outputTokens = result.result.usage?.output_tokens || 0;
    const costCents = calculateTokenCost(inputTokens, outputTokens, FORMATTER_MODEL);

    console.info(
      `[Formatter:${correlationId}] Cleaned response in ${Date.now() - startTime}ms (${inputTokens}/${outputTokens} tokens, $${formatCentsAsDollars(costCents)})`
    );

    return {
      response: formattedResponse,
      usage: {
        inputTokens,
        outputTokens,
        costCents,
        costFormatted: formatCentsAsDollars(costCents),
      },
      durationMs: Date.now() - startTime,
      skipped: false,
    };
  } catch (error) {
    // Log formatter error telemetry
    logResponseQualityEvent(RESPONSE_QUALITY_ISSUES.FORMATTER_ERROR, {
      correlationId,
      userId,
      error: error.message,
      inputLength: cleanedInput?.length || 0,
    });

    // On error, return cleaned input (internal blocks stripped) rather than failing
    return {
      response: cleanedInput,
      usage: { inputTokens: 0, outputTokens: 0, costCents: 0 },
      skipped: true,
      error: error.message,
      qualityIssue: RESPONSE_QUALITY_ISSUES.FORMATTER_ERROR,
    };
  }
}

/**
 * Strip internal data blocks that should never be shown to users.
 * These blocks are used for database persistence, not display.
 * @param {string} text - Text to clean
 * @returns {string} Cleaned text
 */
function stripInternalBlocks(text) {
  if (!text) return text;

  // Strip <parts_to_save> blocks (used for database persistence)
  // Handle both complete blocks and partial/unclosed blocks
  let cleaned = text.replace(/<parts_to_save>[\s\S]*?<\/parts_to_save>/gi, '');

  // Also strip unclosed <parts_to_save> blocks (in case AI didn't close the tag)
  // This catches cases where the block starts but never closes
  cleaned = cleaned.replace(/<parts_to_save>[\s\S]*$/gi, '');

  // Strip any other internal XML-style tags we might add in the future
  cleaned = cleaned.replace(/<internal_data>[\s\S]*?<\/internal_data>/gi, '');
  cleaned = cleaned.replace(/<internal_data>[\s\S]*$/gi, '');

  return cleaned.trim();
}

/**
 * Internal block tags that should be stripped from user-facing output.
 * These are used for database persistence and internal processing.
 */
const INTERNAL_BLOCK_TAGS = ['parts_to_save', 'internal_data'];

/**
 * Check if text might contain a partial opening tag at the end.
 * This handles cases where "<parts_to" arrives in one chunk and "_save>" in another.
 * @param {string} text - Text to check
 * @returns {boolean} True if text ends with potential partial tag
 */
function mightHavePartialTag(text) {
  if (!text) return false;
  // Check for any '<' that might be the start of an internal tag
  // Look at the last 20 chars to catch partial tags
  const tail = text.slice(-20);
  const lastOpenBracket = tail.lastIndexOf('<');
  if (lastOpenBracket === -1) return false;

  // Check if after the '<' we have a potential partial match for our internal tags
  const afterBracket = tail.slice(lastOpenBracket + 1).toLowerCase();
  for (const tag of INTERNAL_BLOCK_TAGS) {
    // Check if it could be the start of this tag
    if (
      tag.startsWith(afterBracket) ||
      afterBracket.startsWith(tag.slice(0, afterBracket.length))
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Check if text contains a complete opening internal block tag.
 * @param {string} text - Text to check
 * @returns {boolean} True if contains complete opening tag
 */
function hasInternalBlockStart(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return INTERNAL_BLOCK_TAGS.some((tag) => lower.includes(`<${tag}>`));
}

/**
 * Check if text contains a complete closing internal block tag.
 * @param {string} text - Text to check
 * @returns {boolean} True if contains complete closing tag
 */
function hasInternalBlockEnd(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return INTERNAL_BLOCK_TAGS.some((tag) => lower.includes(`</${tag}>`));
}

/**
 * Stream-aware formatter for real-time responses.
 * Buffers content until we have enough to format, then streams formatted output.
 * Also strips internal data blocks (like <parts_to_save>) in real-time.
 *
 * RACE CONDITION HANDLING:
 * Internal block tags may be split across chunks. This implementation:
 * 1. Detects potential partial tags at chunk boundaries
 * 2. Buffers content when inside internal blocks
 * 3. Uses a holdback buffer to prevent partial tags from leaking
 *
 * @param {Object} params - Streaming parameters
 * @param {string} params.correlationId - Request correlation ID
 * @param {string} params.userId - User ID
 * @param {Function} params.onText - Callback for formatted text chunks
 * @returns {Object} Stream formatter with addChunk() and flush() methods
 */
export function createStreamFormatter({ correlationId, userId, onText }) {
  let buffer = '';
  let isBuffering = true;
  let inInternalBlock = false;
  let internalBlockBuffer = '';
  let holdbackBuffer = ''; // Holds potential partial tags until next chunk confirms
  const BUFFER_THRESHOLD = 300;
  const HOLDBACK_SIZE = 25; // Max size of a tag like "</parts_to_save>"

  return {
    /**
     * Add a chunk from the specialist agent
     * @param {string} chunk - Text chunk
     */
    async addChunk(chunk) {
      // Combine holdback with new chunk
      const combinedChunk = holdbackBuffer + chunk;
      holdbackBuffer = '';

      // STATE: Inside internal block - buffer everything until closing tag
      if (inInternalBlock) {
        internalBlockBuffer += combinedChunk;

        // Check for complete closing tag
        if (hasInternalBlockEnd(internalBlockBuffer)) {
          // Block is complete, strip it and continue
          inInternalBlock = false;
          const cleanedRemainder = stripInternalBlocks(internalBlockBuffer);
          internalBlockBuffer = '';

          if (cleanedRemainder && cleanedRemainder.trim()) {
            // Process the remainder through normal flow (recursive call)
            await this.addChunk(cleanedRemainder);
          }
        } else if (internalBlockBuffer.length > 50000) {
          // Safety: block too large, likely malformed - discard and warn
          console.error(
            `[StreamFormatter:${correlationId}] Internal block exceeded 50KB without closing tag. Discarding.`
          );
          inInternalBlock = false;
          internalBlockBuffer = '';
        }
        return;
      }

      // STATE: Not in internal block - check if one is starting
      if (hasInternalBlockStart(combinedChunk)) {
        // Find where the block starts
        const blockStartMatch = combinedChunk.match(/<(parts_to_save|internal_data)>/i);
        if (blockStartMatch) {
          const blockStartIndex = combinedChunk.indexOf(blockStartMatch[0]);

          // Output everything before the block
          const beforeBlock = combinedChunk.slice(0, blockStartIndex);
          if (beforeBlock && beforeBlock.trim()) {
            await this.processContent(beforeBlock);
          }

          // Start buffering the internal block
          inInternalBlock = true;
          internalBlockBuffer = combinedChunk.slice(blockStartIndex);

          // Check if block is already complete in this chunk
          if (hasInternalBlockEnd(internalBlockBuffer)) {
            inInternalBlock = false;
            const cleanedRemainder = stripInternalBlocks(internalBlockBuffer);
            internalBlockBuffer = '';
            if (cleanedRemainder && cleanedRemainder.trim()) {
              await this.addChunk(cleanedRemainder);
            }
          }
          return;
        }
      }

      // Check for potential partial tag at the end of this chunk
      // Hold back content that might be a partial tag
      if (mightHavePartialTag(combinedChunk)) {
        const lastOpenBracket = combinedChunk.lastIndexOf('<');
        if (lastOpenBracket >= 0 && lastOpenBracket > combinedChunk.length - HOLDBACK_SIZE) {
          // Hold back from the '<' onwards
          holdbackBuffer = combinedChunk.slice(lastOpenBracket);
          const safeContent = combinedChunk.slice(0, lastOpenBracket);
          if (safeContent) {
            await this.processContent(safeContent);
          }
          return;
        }
      }

      // No internal blocks or partial tags - process normally
      await this.processContent(combinedChunk);
    },

    /**
     * Process content through the normal formatting pipeline
     * @param {string} content - Content to process
     */
    async processContent(content) {
      if (!content) return;

      // Strip any complete internal blocks (safety check)
      let cleanedContent = stripInternalBlocks(content);
      if (!cleanedContent) return;

      // Strip structured markers (RESPONSE_TYPE:, preamble, etc.)
      cleanedContent = stripStructuredMarkers(cleanedContent);
      if (!cleanedContent) return;

      // Normalize to canonical format
      cleanedContent = normalizeCanonicalFormat(cleanedContent);

      if (!isBuffering) {
        // Past buffering phase, output directly
        onText(cleanedContent);
        return;
      }

      buffer += cleanedContent;

      // Check if we should release the buffer
      if (buffer.length >= BUFFER_THRESHOLD || startsWithContent(buffer)) {
        isBuffering = false;

        // Clean and normalize the buffer before checking/releasing
        let cleanedBuffer = stripStructuredMarkers(buffer);
        cleanedBuffer = normalizeCanonicalFormat(cleanedBuffer);

        // If it already starts with content, just release
        if (startsWithContent(cleanedBuffer)) {
          onText(cleanedBuffer);
          buffer = '';
          return;
        }

        // Otherwise, format the buffer before releasing
        const result = await formatResponse({
          rawResponse: buffer,
          correlationId,
          userId,
        });

        onText(result.response);
        buffer = '';
      }
    },

    /**
     * Flush any remaining buffered content
     */
    async flush() {
      // Process any holdback buffer first
      if (holdbackBuffer) {
        // If we're waiting on a partial tag that never completed, it's not a tag
        if (!inInternalBlock) {
          await this.processContent(holdbackBuffer);
        }
        holdbackBuffer = '';
      }

      // Handle unclosed internal block
      if (inInternalBlock && internalBlockBuffer) {
        console.warn(
          `[StreamFormatter:${correlationId}] Discarding unclosed internal block (${internalBlockBuffer.length} chars)`
        );
        internalBlockBuffer = '';
        inInternalBlock = false;
      }

      // Process remaining buffer
      if (buffer.length > 0) {
        // Strip internal blocks and structured markers
        let cleanedBuffer = stripInternalBlocks(buffer);
        cleanedBuffer = stripStructuredMarkers(cleanedBuffer);
        cleanedBuffer = normalizeCanonicalFormat(cleanedBuffer);

        // Detect if buffer had content but stripping removed everything
        const hadInternalBlocks =
          buffer.includes('<parts_to_save>') || buffer.includes('<internal_data>');
        const strippedEverything =
          hadInternalBlocks && (!cleanedBuffer || cleanedBuffer.length < 20);

        if (strippedEverything) {
          console.error(
            `[StreamFormatter:${correlationId}] BUG: Response contained only internal blocks. ` +
              `Buffer: ${buffer.length} chars, After strip: ${cleanedBuffer?.length || 0} chars`
          );
          // Use contextual fallback based on what was in the buffer
          onText(getContextualFallback(buffer));
        } else if (cleanedBuffer && isBuffering && !startsWithContent(cleanedBuffer)) {
          // Format the final buffer
          const result = await formatResponse({
            rawResponse: buffer,
            correlationId,
            userId,
          });
          onText(result.response);
        } else if (cleanedBuffer) {
          onText(cleanedBuffer);
        }
        buffer = '';
      }
    },

    /**
     * Get current buffer state (for debugging)
     */
    getState() {
      return {
        isBuffering,
        bufferLength: buffer.length,
        inInternalBlock,
        internalBlockBufferLength: internalBlockBuffer.length,
        holdbackLength: holdbackBuffer.length,
      };
    },
  };
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Normalize response to canonical format.
 * This ensures consistent formatting even when agents produce slight variations.
 *
 * Normalizes:
 * - Numbering: "**1." → "**1)" and "1. **" → "**1)"
 * - HP gains: "~10-15 HP", "+10-15HP", "10-15 HP gain" → "**HP Gain:** +10-15 HP"
 * - Prices in lists: Ensures consistent $XXX format
 * - Section headers: Ensures ### for stages and Quick Picks
 * - Removes stray lone '#' characters (formatting artifacts)
 *
 * @param {string} text - Text to normalize
 * @returns {string} Normalized text
 */
function normalizeCanonicalFormat(text) {
  if (!text) return text;

  let normalized = text;

  // ==========================================================================
  // STRAY CHARACTER CLEANUP (Common formatting artifacts)
  // ==========================================================================

  // Remove lone '#' characters on their own line (formatting artifact from agents)
  // This catches cases like "---\n\n#\n\n## Quick Picks"
  normalized = normalized.replace(/^#\s*$/gm, '');

  // Remove lone '#' followed by blank line before a real heading
  normalized = normalized.replace(/^#\n+(?=##)/gm, '');

  // ==========================================================================
  // NUMBERING NORMALIZATION
  // ==========================================================================

  // "**1." → "**1)" (bold number with period to parenthesis)
  normalized = normalized.replace(/\*\*(\d+)\.\s*/g, '**$1) ');

  // "1. **" → "**1) " (number then bold to bold number)
  normalized = normalized.replace(/^(\d+)\.\s+\*\*/gm, '**$1) ');

  // "1) **" → "**1) " (already has paren but bold is after)
  normalized = normalized.replace(/^(\d+)\)\s+\*\*/gm, '**$1) ');

  // ==========================================================================
  // HP GAIN NORMALIZATION
  // ==========================================================================

  // Various HP gain formats → "**HP Gain:** +XX-XX HP"
  // Patterns: "~10-15 HP", "+10-15 HP", "10-15HP gain", "Adds 10-15 HP"

  // Handle "- **Gain:** +XX-XX HP" or "- **Gain:** ~XX-XX HP"
  normalized = normalized.replace(
    /^(\s*-\s*)\*\*Gain:\*\*\s*[~+]?(\d+)-(\d+)\s*HP/gim,
    '$1**HP Gain:** +$2-$3 HP'
  );

  // Handle "Adds X-Y HP" or "adds X-Y HP"
  normalized = normalized.replace(/\bAdds\s+(\d+)-(\d+)\s*HP\b/gi, '**HP Gain:** +$1-$2 HP');

  // Handle "~X-Y HP" at start of bullet or after dash
  normalized = normalized.replace(/^(\s*-\s*)~(\d+)-(\d+)\s*HP\b/gm, '$1**HP Gain:** +$2-$3 HP');

  // Handle "+X-Y HP" standalone (not already in HP Gain format)
  normalized = normalized.replace(
    /^(\s*-\s*)\+(\d+)-(\d+)\s*HP\b(?!\s*\|)/gm,
    '$1**HP Gain:** +$2-$3 HP'
  );

  // Handle "X-Y HP gain" or "X-Y HP Gain"
  normalized = normalized.replace(/(\d+)-(\d+)\s*HP\s+gain\b/gi, '**HP Gain:** +$1-$2 HP');

  // ==========================================================================
  // PRICE NORMALIZATION
  // ==========================================================================

  // Handle "$XXX - $YYY" → "$XXX-$YYY" (remove spaces around dash in price ranges)
  normalized = normalized.replace(/\$(\d+(?:,\d{3})?)\s+-\s+\$(\d+(?:,\d{3})?)/g, '$$$1-$$$2');

  // Handle "Price: $XXX" → "**Price:** $XXX" (ensure bold)
  normalized = normalized.replace(/^(\s*-\s*)Price:\s*(\$\d)/gm, '$1**Price:** $2');

  // ==========================================================================
  // SECTION HEADER NORMALIZATION
  // ==========================================================================

  // Ensure "Quick Picks" uses ### header
  normalized = normalized.replace(/^\*\*Quick Picks:?\*\*\s*$/gm, '### Quick Picks');
  normalized = normalized.replace(/^Quick Picks:?\s*$/gm, '### Quick Picks');

  // Ensure stage headers use ### format: "**Stage 1 -" → "### Stage 1 -"
  normalized = normalized.replace(/^\*\*Stage (\d+)\s*-\s*([^*]+)\*\*/gm, '### Stage $1 - $2');

  // ==========================================================================
  // QUICK PICKS NORMALIZATION
  // ==========================================================================

  // Ensure Quick Picks items have bold labels
  normalized = normalized.replace(/^(\s*-\s*)Best Overall:/gm, '$1**Best Overall:**');
  normalized = normalized.replace(/^(\s*-\s*)Best Value:/gm, '$1**Best Value:**');
  normalized = normalized.replace(/^(\s*-\s*)Premium Choice:/gm, '$1**Premium Choice:**');
  normalized = normalized.replace(/^(\s*-\s*)Best for (\w+):/gm, '$1**Best for $2:**');

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  // Remove multiple consecutive blank lines
  normalized = normalized.replace(/\n{3,}/g, '\n\n');

  return normalized.trim();
}

/**
 * Strip structured response markers and preamble from text.
 * This is a lightweight cleanup that runs BEFORE the LLM formatter.
 *
 * Removes:
 * - RESPONSE_TYPE: lines
 * - TITLE: lines (when followed by content)
 * - EXPLANATION: markers
 * - ANSWER: markers
 * - Common preamble phrases
 *
 * @param {string} text - Text to clean
 * @returns {string} Cleaned text
 */
function stripStructuredMarkers(text) {
  if (!text) return text;

  let cleaned = text;

  // Remove standalone numeric markers that leak from internal processing (e.g., "8!", "8:")
  // These are artifacts from tool/agent processing that shouldn't be shown
  cleaned = cleaned.replace(/^\d+[!:]\s*/g, '');
  cleaned = cleaned.replace(/\.\d+:/g, '.'); // Fix "gains.8:Perfect" -> "gains.Perfect"

  // Remove RESPONSE_TYPE: lines (internal markers)
  cleaned = cleaned.replace(/^RESPONSE_TYPE:\s*\w+\s*\n?/gim, '');

  // Remove standalone TITLE: when followed by actual content
  // Keep if it's part of markdown (## TITLE: Something)
  cleaned = cleaned.replace(/^TITLE:\s*(.+)\n?/gim, (match, title) => {
    // Convert to markdown heading if there's a title
    if (title && title.trim()) {
      return `## ${title.trim()}\n`;
    }
    return '';
  });

  // Remove EXPLANATION: and ANSWER: markers
  cleaned = cleaned.replace(/^(?:EXPLANATION|ANSWER):\s*\n?/gim, '');

  // Remove common preamble sentences (entire first sentence if it's preamble)
  const preambleSentences = [
    /^I'll\s+(?:search|check|look|find|get|pull|research|provide|explain|help|calculate|try|use|query|retrieve|break|now)[^.!?\n:]*[.!?\n:]/i,
    /^Let me\s+(?:search|check|look|find|get|pull|research|provide|explain|help|calculate|try|use|query|retrieve|break|now)[^.!?\n:]*[.!?\n:]/i,
    /^Now let me\s+(?:search|check|look|find|get|pull|research|provide|explain|help|calculate|try|use|query|retrieve|break)[^.!?\n:]*[.!?\n:]/i,
    /^I apologize for the technical difficulty\.[^.!?\n]*[.!?\n]?/i, // Apology for errors
    /^Since (?:the|I'm|this|that)\s+(?:specific|tool|lookup|data)[^.!?\n]*[.!?\n]/i, // Technical explanations
    /^(?:The|This) (?:specific |)tool (?:lookup |call |)(?:isn't|is not|wasn't|failed)[^.!?\n]*[.!?\n]/i, // Tool failure explanations
    /^Based on my (?:expertise|knowledge|experience)[^.!?\n]*[.!?\n]/i, // Expertise claims
    /^I'll now\s+[^.!?\n:]*[.!?\n:]/i, // "I'll now use a generalized approach:"
  ];

  for (const pattern of preambleSentences) {
    cleaned = cleaned.replace(pattern, '');
  }

  // Also strip mid-sentence "Now let me..." preamble
  // e.g., "comparison.Now let me get some community insights..."
  cleaned = cleaned.replace(
    /(?<=\.)\s*Now let me\s+(?:search|check|look|find|get|pull|research|compare)[^.!?\n]*[.!?\n]\s*/gi,
    ' '
  );

  // Fix missing newlines before markdown headings (## and ###)
  // This handles "content.## Heading" → "content.\n\n## Heading"
  cleaned = cleaned.replace(/([^\n])(#{2,3}\s+)/g, '$1\n\n$2');

  // Clean up any resulting double newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned.trim();
}

/**
 * Check if text starts with actual content (not preamble)
 * Used to skip formatting when response is already clean.
 *
 * This function is conservative - if unsure, it returns false to allow formatting.
 * Patterns are based on common AL response formats.
 */
function startsWithContent(text) {
  if (!text) return false;
  const trimmed = text.trim();

  // Content start patterns - responses that begin with these are ready to show
  const contentPatterns = [
    // Markdown structure
    /^#{1,4}\s/, // Markdown heading (# ## ### ####)
    /^>\s/, // Block quote
    /^```/, // Code block
    /^\|.*\|/, // Table row

    // Numbered/bulleted lists with formatting
    /^\*\*\d+[.)]\s*/, // Bold numbered: **1) or **1.
    /^\*\*#\d+/, // Bold hash numbered: **#1
    /^\d+[.)]\s+\*\*/, // Numbered with bold: 1) **
    /^\d+[.)]\s+[A-Z]/, // Numbered with capital: 1) The
    /^-\s+\*\*/, // Bullet with bold: - **
    /^\*\s+\*\*/, // Asterisk bullet with bold: * **
    /^[-*]\s+[A-Z]/, // Bullet with capital: - The

    // Direct content starts
    /^For your\s/i, // "For your [car]..."
    /^For the\s/i, // "For the [car]..."
    /^For a\s/i, // "For a [car]..."
    /^Here are\s/i, // "Here are..."
    /^Here's\s/i, // "Here's..."
    /^Based on\s/i, // "Based on your..."
    /^Looking at\s/i, // "Looking at your..."
    /^The\s+(?:best|top|most|main)\s/i, // "The best...", "The top..."
    /^Your\s+\w+\s/i, // "Your car...", "Your build..."
    /^This\s+(?:is|car|part|mod)\s/i, // "This is...", "This car..."
    /^A\s+turbo/i, // "A turbocharger..."

    // Bold recommendations/answers
    /^\*\*(?:Recommended|Best|Top|Summary|Answer|TL;DR|Key)\b/i,
    /^\*\*\d+\s/, // **500 hp
    /^\*\*[A-Z][a-z]+\s/, // **Recommended: or **Yes,

    // Direct answers
    /^Yes[,.]?\s/i, // "Yes, ..."
    /^No[,.]?\s/i, // "No, ..."
    /^(?:Absolutely|Definitely|Unfortunately|Actually)\b/i, // Direct answer starters

    // Car/part names (common response starts)
    /^The\s+(?:\d{4}\s+)?[A-Z][a-z]+\s+[A-Z]/i, // "The 2020 Porsche 911"
    /^(?:APR|034|Unitronic|Cobb|AWE|Borla|K&N)\s/i, // Brand names

    // Greeting/conversational (for generalist)
    /^Hey\s/i, // "Hey there..."
    /^Welcome\s/i, // "Welcome to..."
    /^Ready\s/i, // "Ready to..."
  ];

  // Preamble patterns - these indicate the response needs cleanup
  const preamblePatterns = [
    /^I'll\s/i,
    /^I will\s/i,
    /^I'd\s/i,
    /^I would\s/i,
    /^Let me\s/i,
    /^Now let me\s/i, // "Now let me get..."
    /^Allow me\s/i,
    /^I notice\s/i,
    /^I see\s/i,
    /^I can\s/i,
    /^I understand\s/i,
    /^Great question/i,
    /^Good question/i,
    /^Excellent question/i,
    /^That's a great/i,
    /^First,?\s+I/i,
    /^First,?\s+let/i,
    /^To answer\s/i,
    /^To help\s/i,
    /using the \w+(?:_\w+)+/i, // Tool name references
    /research_parts_live|get_car_ai_context|search_parts/i, // Tool names
    /^Sure[,!]/i, // "Sure, I'll..."
    /^Of course[,!]/i, // "Of course, ..."
    /^Certainly[,!]/i, // "Certainly, ..."
    /^RESPONSE_TYPE:/i, // Structured markers that weren't stripped
    /^TITLE:/i, // Title markers
    /^EXPLANATION:/i, // Explanation markers
    /^ANSWER:/i, // Answer markers
    /^Since (?:I'm|the|this)/i, // "Since I'm encountering...", "Since the tool..."
    /^The (?:specific |)tool/i, // "The tool lookup..."
    /^(?:The |This )(?:specific |)(?:lookup|data|query)/i, // "The lookup isn't working..."
  ];

  // If it matches a preamble pattern, it's NOT ready (needs formatting)
  for (const pattern of preamblePatterns) {
    if (pattern.test(trimmed)) {
      return false;
    }
  }

  // If it matches a content pattern, it IS ready (skip formatting)
  for (const pattern of contentPatterns) {
    if (pattern.test(trimmed)) {
      return true;
    }
  }

  // Default: assume it might need formatting (safe fallback)
  return false;
}

// =============================================================================
// EXPORTS
// =============================================================================

const formatterAgent = {
  formatResponse,
  createStreamFormatter,
  startsWithContent,
  getContextualFallback,
  RESPONSE_QUALITY_ISSUES,
};

export default formatterAgent;
