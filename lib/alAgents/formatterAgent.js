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
  // Skip formatting for very short responses (likely errors or simple acks)
  if (!rawResponse || rawResponse.length < 50) {
    return {
      response: rawResponse,
      usage: { inputTokens: 0, outputTokens: 0, costCents: 0 },
      skipped: true,
    };
  }

  // Quick heuristic check - if response starts with content (not preamble), skip formatting
  // This saves tokens/latency for already-clean responses
  if (startsWithContent(rawResponse)) {
    return {
      response: rawResponse,
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
                content: `Clean up this response for the user:\n\n${rawResponse}`,
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

    const formattedResponse = result.result.content?.[0]?.text || rawResponse;
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
    // On error, return original response rather than failing the whole request
    return {
      response: rawResponse,
      usage: { inputTokens: 0, outputTokens: 0, costCents: 0 },
      skipped: true,
      error: error.message,
    };
  }
}

/**
 * Stream-aware formatter for real-time responses.
 * Buffers content until we have enough to format, then streams formatted output.
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
  const BUFFER_THRESHOLD = 300; // Buffer until we have enough context

  return {
    /**
     * Add a chunk from the specialist agent
     * @param {string} chunk - Text chunk
     */
    async addChunk(chunk) {
      if (!isBuffering) {
        // Past buffering phase, pass through directly
        onText(chunk);
        return;
      }

      buffer += chunk;

      // Check if we should release the buffer
      if (buffer.length >= BUFFER_THRESHOLD || startsWithContent(buffer)) {
        isBuffering = false;

        // If it already starts with content, just release
        if (startsWithContent(buffer)) {
          onText(buffer);
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
      if (buffer.length > 0) {
        if (isBuffering && !startsWithContent(buffer)) {
          // Format the final buffer
          const result = await formatResponse({
            rawResponse: buffer,
            correlationId,
            userId,
          });
          onText(result.response);
        } else {
          onText(buffer);
        }
        buffer = '';
      }
    },

    /**
     * Get current buffer state
     */
    getState() {
      return { isBuffering, bufferLength: buffer.length };
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
