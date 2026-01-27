/**
 * AL Preamble Stripper
 *
 * Post-processing utility to strip preamble text from AL responses.
 * Works with streaming by buffering initial text until we can determine
 * if preamble needs to be stripped.
 *
 * This is a safety net for when the model ignores prompt instructions.
 *
 * @module lib/alPreambleStripper
 */

// =============================================================================
// PREAMBLE PATTERNS
// =============================================================================

/**
 * Patterns that indicate preamble that should be stripped.
 * These patterns match common phrases the model uses to announce its actions.
 */
const PREAMBLE_PATTERNS = [
  // Action announcements
  /^I'll research\b[^.!?\n]*[.!?\n]/i,
  /^I will research\b[^.!?\n]*[.!?\n]/i,
  /^Let me research\b[^.!?\n]*[.!?\n]/i,
  /^I'll search\b[^.!?\n]*[.!?\n]/i,
  /^Let me search\b[^.!?\n]*[.!?\n]/i,
  /^I'll look up\b[^.!?\n]*[.!?\n]/i,
  /^Let me look up\b[^.!?\n]*[.!?\n]/i,
  /^I'll compare\b[^.!?\n]*[.!?\n]/i,
  /^Let me compare\b[^.!?\n]*[.!?\n]/i,
  /^I'll pull up\b[^.!?\n]*[.!?\n]/i,
  /^Let me pull up\b[^.!?\n]*[.!?\n]/i,
  /^I'll find\b[^.!?\n]*[.!?\n]/i,
  /^Let me find\b[^.!?\n]*[.!?\n]/i,
  /^I'll get\b[^.!?\n]*[.!?\n]/i,
  /^Let me get\b[^.!?\n]*[.!?\n]/i,
  /^I'll check\b[^.!?\n]*[.!?\n]/i,
  /^Let me check\b[^.!?\n]*[.!?\n]/i,

  // Observation announcements
  /^I notice\b[^.!?\n]*[.!?\n]/i,
  /^I see that\b[^.!?\n]*[.!?\n]/i,
  /^I see you\b[^.!?\n]*[.!?\n]/i,

  // Helper phrases
  /^Just want to make sure\b[^.!?\n]*[.!?\n]/i,
  /^I'd be happy to\b[^.!?\n]*[.!?\n]/i,
  /^I would be happy to\b[^.!?\n]*[.!?\n]/i,
  /^Let me help\b[^.!?\n]*[.!?\n]/i,
  /^I'll help\b[^.!?\n]*[.!?\n]/i,
  /^Great question!\s*/i,
  /^Good question!\s*/i,
  /^Excellent question!\s*/i,
  /^That's a great question!\s*/i,

  // Sequencing phrases
  /^First,? I'll\b[^.!?\n]*[.!?\n]/i,
  /^Let me start by\b[^.!?\n]*[.!?\n]/i,
  /^To start,?\s*/i,

  // Tool-related phrases (critical - these expose internal implementation)
  /using the \w+(?:_\w+)* tool\b[^.!?\n]*[.!?\n]?/gi,
  /with (?:the )?\w+(?:_\w+)* tool\b[^.!?\n]*[.!?\n]?/gi,
  /the research(?:_parts)?(?:_live)? tool\b[^.!?\n]*[.!?\n]?/gi,
  /I'll use \w+(?:_\w+)*\b[^.!?\n]*[.!?\n]/gi,

  // Result commentary
  /^Based on the data I've gathered\b[^.!?\n]*[.!?\n]/i,
  /^Now that I have the information\b[^.!?\n]*[.!?\n]/i,
  /^Given the (?:limited |automated )?results\b[^.!?\n]*[.!?\n]/i,
  /^I'll supplement this\b[^.!?\n]*[.!?\n]/i,
  /^The research tool encountered\b[^.!?\n]*[.!?\n]/i,
  /encountered some limitations\.[^.!?\n]*[.!?\n]?/gi,
];

/**
 * Multi-sentence preamble patterns that can span multiple sentences.
 * These are applied after individual sentence patterns.
 */
const MULTI_SENTENCE_PREAMBLE_PATTERNS = [
  // Pattern: "I'll research X. I notice Y. I'll supplement Z."
  /^(?:I'll |I will |Let me )[\s\S]*?(?:I notice|I'll supplement|Given the limited|The research tool)[\s\S]*?(?=##|\*\*\d|\d\)|\d\.)/i,
];

/**
 * Content start markers - when we see these, we know preamble is done
 */
const CONTENT_START_MARKERS = [
  /^##\s/, // Markdown heading
  /^\*\*\d/, // Bold numbered item like **1)
  /^\*\*#\d/, // Bold hash numbered like **#1
  /^\d+[.)]\s+\*\*/, // Numbered list with bold
  /^-\s+\*\*/, // Bullet with bold
  /^Here are/, // Common content start
  /^Top \d+/, // "Top 5..."
  /^The best/, // "The best..."
  /^For your/, // "For your [car]..."
];

// =============================================================================
// STREAMING PREAMBLE STRIPPER
// =============================================================================

/**
 * Creates a stateful preamble stripper for streaming responses.
 *
 * The stripper buffers initial text until it can determine if preamble
 * needs to be stripped, then releases the cleaned text.
 *
 * @returns {Object} Stripper with addChunk() and flush() methods
 */
export function createPreambleStripper() {
  let buffer = '';
  let isPreamblePhase = true;
  let hasReleasedContent = false;
  const BUFFER_THRESHOLD = 500; // Max chars to buffer before forcing release

  return {
    /**
     * Add a chunk of text. Returns text that should be sent to client.
     * May return empty string if still buffering.
     * @param {string} chunk - Text chunk from model
     * @returns {string} Text to send to client (may be empty)
     */
    addChunk(chunk) {
      // If we're past preamble phase, pass through directly
      if (!isPreamblePhase) {
        return chunk;
      }

      buffer += chunk;

      // Check if we've hit a content start marker
      const contentStartMatch = CONTENT_START_MARKERS.some((pattern) => pattern.test(buffer));

      // Check if buffer is getting too large (force release)
      const shouldForceRelease = buffer.length > BUFFER_THRESHOLD;

      if (contentStartMatch || shouldForceRelease) {
        // Strip preamble and release
        const cleaned = stripPreamble(buffer);
        isPreamblePhase = false;
        hasReleasedContent = true;
        buffer = '';
        return cleaned;
      }

      // Keep buffering
      return '';
    },

    /**
     * Flush any remaining buffered content.
     * Call this when streaming is complete.
     * @returns {string} Any remaining text
     */
    flush() {
      if (buffer.length > 0) {
        const cleaned = isPreamblePhase ? stripPreamble(buffer) : buffer;
        buffer = '';
        isPreamblePhase = false;
        return cleaned;
      }
      return '';
    },

    /**
     * Check if any content has been released yet
     * @returns {boolean}
     */
    hasReleasedContent() {
      return hasReleasedContent;
    },
  };
}

// =============================================================================
// PREAMBLE STRIPPING LOGIC
// =============================================================================

/**
 * Strip preamble from text.
 * This is the core stripping logic used by both streaming and non-streaming.
 *
 * @param {string} text - Text to strip preamble from
 * @returns {string} Cleaned text
 */
export function stripPreamble(text) {
  if (!text) return text;

  let cleaned = text;

  // Apply multi-sentence patterns first
  for (const pattern of MULTI_SENTENCE_PREAMBLE_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }

  // Apply individual patterns repeatedly until no more matches
  let previousLength;
  do {
    previousLength = cleaned.length;
    for (const pattern of PREAMBLE_PATTERNS) {
      cleaned = cleaned.replace(pattern, '');
    }
    // Trim leading whitespace/newlines after each pass
    cleaned = cleaned.replace(/^[\s]+/, '');
  } while (cleaned.length < previousLength);

  // Final cleanup - remove any remaining tool name mentions inline
  // Match tool names like get_car_ai_context, research_parts_live, etc.
  cleaned = cleaned.replace(/I'll use \w+(?:_\w+)+[^.!?\n]*[.!?\n]?/gi, '');
  cleaned = cleaned.replace(/using (?:the )?\w+(?:_\w+)+ (?:tool)?[^.!?\n]*/gi, '');
  cleaned = cleaned.replace(/with (?:the )?\w+(?:_\w+)+ (?:tool)?[^.!?\n]*/gi, '');
  cleaned = cleaned.replace(/\bthe \w+(?:_\w+)+ tool\b[^.!?\n]*/gi, '');
  cleaned = cleaned.replace(/\b\w+(?:_\w+)+ tool\b/gi, ''); // catch "research_parts_live tool"

  // Clean up double spaces (but preserve newlines for formatting)
  cleaned = cleaned.replace(/ +/g, ' '); // Multiple spaces to single space
  cleaned = cleaned.replace(/^\s+/, ''); // Trim leading whitespace
  cleaned = cleaned.replace(/^\.\s*/, ''); // Remove orphaned period at start
  cleaned = cleaned.replace(/^,\s*/, ''); // Remove orphaned comma at start

  return cleaned;
}

/**
 * Loose patterns for detecting if text starts with preamble (for isPreamble check)
 * These don't require sentence endings, just the start patterns
 */
const PREAMBLE_START_PATTERNS = [
  /^I'll research\b/i,
  /^I will research\b/i,
  /^Let me research\b/i,
  /^I'll search\b/i,
  /^Let me search\b/i,
  /^I'll look up\b/i,
  /^Let me look up\b/i,
  /^I'll compare\b/i,
  /^Let me compare\b/i,
  /^I notice\b/i,
  /^I see that\b/i,
  /^Great question!/i,
  /^Good question!/i,
  /^I'd be happy to\b/i,
  /^Let me help\b/i,
  /^First,? I'll\b/i,
];

/**
 * Check if text appears to be preamble (for logging/debugging)
 * @param {string} text - Text to check
 * @returns {boolean} True if text looks like preamble
 */
export function isPreamble(text) {
  if (!text) return false;
  const trimmed = text.trim();

  // Check if any preamble start pattern matches
  for (const pattern of PREAMBLE_START_PATTERNS) {
    if (pattern.test(trimmed)) {
      return true;
    }
  }

  return false;
}

// =============================================================================
// EXPORTS
// =============================================================================

const alPreambleStripper = {
  createPreambleStripper,
  stripPreamble,
  isPreamble,
  PREAMBLE_PATTERNS,
  CONTENT_START_MARKERS,
};

export default alPreambleStripper;
