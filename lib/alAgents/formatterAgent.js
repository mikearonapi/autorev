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
  // ALWAYS strip internal blocks first, regardless of whether we do full formatting
  const cleanedInput = stripInternalBlocks(rawResponse);

  // Detect if stripping internal blocks removed ALL content (bug scenario)
  // This happens when the LLM only generates <parts_to_save> block without user-facing content
  const hadInternalBlocks =
    rawResponse &&
    (rawResponse.includes('<parts_to_save>') || rawResponse.includes('<internal_data>'));
  const strippedEverything = hadInternalBlocks && (!cleanedInput || cleanedInput.length < 20);

  if (strippedEverything) {
    console.error(
      `[Formatter:${correlationId}] BUG DETECTED: Response contained only internal blocks with no user-facing content. Raw length: ${rawResponse?.length}, Cleaned length: ${cleanedInput?.length}`
    );
    // Return a fallback message instead of empty response
    return {
      response:
        "I researched this but couldn't find specific results in our database. Could you try rephrasing your question or asking about a different part category?",
      usage: { inputTokens: 0, outputTokens: 0, costCents: 0 },
      skipped: true,
      reason: 'internal_blocks_only',
      originalLength: rawResponse?.length || 0,
    };
  }

  // Skip formatting for very short responses (likely errors or simple acks)
  if (!cleanedInput || cleanedInput.length < 50) {
    return {
      response: cleanedInput,
      usage: { inputTokens: 0, outputTokens: 0, costCents: 0 },
      skipped: true,
    };
  }

  // Quick heuristic check - if response starts with content (not preamble), skip LLM formatting
  // (but we already stripped internal blocks above)
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
    console.error(`[Formatter:${correlationId}] Error:`, error.message);
    // On error, return cleaned input (internal blocks stripped) rather than failing
    return {
      response: cleanedInput,
      usage: { inputTokens: 0, outputTokens: 0, costCents: 0 },
      skipped: true,
      error: error.message,
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
 * Stream-aware formatter for real-time responses.
 * Buffers content until we have enough to format, then streams formatted output.
 * Also strips internal data blocks (like <parts_to_save>) in real-time.
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
  let inInternalBlock = false; // Track if we're inside a <parts_to_save> block
  let internalBlockBuffer = ''; // Buffer for detecting block boundaries
  const BUFFER_THRESHOLD = 300; // Buffer until we have enough context

  return {
    /**
     * Add a chunk from the specialist agent
     * @param {string} chunk - Text chunk
     */
    async addChunk(chunk) {
      // Check if we're entering an internal block
      if (chunk.includes('<parts_to_save>') || chunk.includes('<internal_data>')) {
        inInternalBlock = true;
        internalBlockBuffer = '';
      }

      // If inside an internal block, buffer until we find the closing tag
      if (inInternalBlock) {
        internalBlockBuffer += chunk;

        // Check for closing tags
        if (
          internalBlockBuffer.includes('</parts_to_save>') ||
          internalBlockBuffer.includes('</internal_data>')
        ) {
          // Block is complete, strip it and continue
          inInternalBlock = false;
          const cleanedRemainder = stripInternalBlocks(internalBlockBuffer);
          internalBlockBuffer = '';
          if (cleanedRemainder) {
            // Process the cleaned remainder through normal flow
            chunk = cleanedRemainder;
          } else {
            return; // Nothing to output after stripping
          }
        } else {
          // Still inside block, don't output anything yet
          return;
        }
      }

      // Normal streaming logic
      if (!isBuffering) {
        // Past buffering phase, pass through directly (but still strip internal blocks)
        const cleanedChunk = stripInternalBlocks(chunk);
        if (cleanedChunk) {
          onText(cleanedChunk);
        }
        return;
      }

      buffer += chunk;

      // Check if we should release the buffer
      if (buffer.length >= BUFFER_THRESHOLD || startsWithContent(buffer)) {
        isBuffering = false;

        // Strip any internal blocks from the buffer
        const cleanedBuffer = stripInternalBlocks(buffer);

        // If it already starts with content, just release
        if (startsWithContent(cleanedBuffer)) {
          onText(cleanedBuffer);
          buffer = '';
          return;
        }

        // Otherwise, format the buffer before releasing
        const result = await formatResponse({
          rawResponse: cleanedBuffer,
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
      // First, handle any remaining internal block buffer (unclosed tag)
      if (inInternalBlock && internalBlockBuffer) {
        // The block was never closed, just discard it
        console.warn(
          `[StreamFormatter:${correlationId}] Discarding unclosed internal block (${internalBlockBuffer.length} chars)`
        );
        internalBlockBuffer = '';
        inInternalBlock = false;
      }

      if (buffer.length > 0) {
        // Strip internal blocks from final buffer
        const cleanedBuffer = stripInternalBlocks(buffer);

        // Detect if buffer had content but stripping removed everything
        // (e.g., response was only a <parts_to_save> block with no user content)
        const hadInternalBlocks =
          buffer.includes('<parts_to_save>') || buffer.includes('<internal_data>');
        const strippedEverything =
          hadInternalBlocks && (!cleanedBuffer || cleanedBuffer.length < 20);

        if (strippedEverything) {
          console.error(
            `[StreamFormatter:${correlationId}] BUG: Response contained only internal blocks. Buffer: ${buffer.length} chars, After strip: ${cleanedBuffer?.length || 0} chars`
          );
          // Emit fallback message
          onText(
            "I researched this but couldn't find specific results in our database. Could you try rephrasing your question or asking about a different part category?"
          );
        } else if (cleanedBuffer && isBuffering && !startsWithContent(cleanedBuffer)) {
          // Format the final buffer
          const result = await formatResponse({
            rawResponse: buffer, // Pass original buffer so formatResponse can detect the issue too
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
     * Get current buffer state
     */
    getState() {
      return { isBuffering, bufferLength: buffer.length, inInternalBlock };
    },
  };
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Check if text starts with actual content (not preamble)
 * Used to skip formatting when response is already clean
 */
function startsWithContent(text) {
  if (!text) return false;
  const trimmed = text.trim();

  // Content start patterns
  const contentPatterns = [
    /^#{1,3}\s/, // Markdown heading (# ## ###)
    /^\*\*\d/, // Bold numbered item **1)
    /^\*\*#\d/, // Bold hash numbered **#1
    /^\d+[.)]\s+\*\*/, // Numbered with bold
    /^-\s+\*\*/, // Bullet with bold
    /^For your\s/i, // "For your [car]..."
    /^Here are\s/i, // "Here are..."
    /^The\s+(?:best|top|most)\s/i, // "The best...", "The top..."
    /^\*\*(?:Recommended|Best|Top)\b/i, // Bold recommendation
  ];

  // Preamble patterns (if matches, NOT content)
  const preamblePatterns = [
    /^I'll\s/i,
    /^I will\s/i,
    /^Let me\s/i,
    /^I notice\s/i,
    /^I see\s/i,
    /^Great question/i,
    /^Good question/i,
    /^First,?\s+I/i,
    /using the \w+(?:_\w+)+/i,
  ];

  // If it matches a preamble pattern, it's NOT content
  for (const pattern of preamblePatterns) {
    if (pattern.test(trimmed)) {
      return false;
    }
  }

  // If it matches a content pattern, it IS content
  for (const pattern of contentPatterns) {
    if (pattern.test(trimmed)) {
      return true;
    }
  }

  // Default: assume it might need formatting
  return false;
}

// =============================================================================
// EXPORTS
// =============================================================================

const formatterAgent = {
  formatResponse,
  createStreamFormatter,
  startsWithContent,
};

export default formatterAgent;
