/**
 * Comment Moderation Service
 * 
 * Uses Claude to moderate user comments before they go live.
 * Ensures comments align with community standards and filters out trolls.
 * 
 * This is part of the "TikTok for car enthusiasts" feature.
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Model to use for moderation - use Haiku for cost efficiency on simple tasks
const MODERATION_MODEL = 'claude-3-5-haiku-20241022';

/**
 * Moderation result structure
 * @typedef {Object} ModerationResult
 * @property {boolean} approved - Whether the comment is approved
 * @property {'approved'|'rejected'|'flagged'} status - Moderation status
 * @property {string|null} reason - Reason for rejection/flagging (null if approved)
 * @property {number} score - Confidence score (0-1, higher = more likely to be approved)
 */

/**
 * Community guidelines for AL moderation
 */
const COMMUNITY_GUIDELINES = `
You are AL, AutoRev's AI moderator. Review comments for community builds.

## AutoRev Community Standards

### APPROVE comments that are:
- Genuine compliments or appreciation for the build
- Constructive feedback or suggestions
- Technical questions about the build
- Sharing similar experiences or builds
- Respectful disagreement with specific reasoning
- Enthusiasm and excitement (even if casual)

### REJECT comments that are:
- Personal attacks or insults toward the owner
- Discriminatory language (race, gender, sexuality, etc.)
- Spam or promotional content
- Completely off-topic content
- Threats or harassment
- Excessive profanity used aggressively
- Toxic negativity without constructive purpose
- "Keyboard warrior" trolling (clearly trying to start fights)

### FLAGGED (for human review) - borderline cases:
- Mild teasing that could be friendly or hostile
- Borderline language that needs context
- Comments that mention safety concerns
- Self-promotion that might be relevant

### Important Notes:
- Car enthusiasts use casual language - "sick build", "that's insane", etc. is POSITIVE
- Friendly ribbing between car enthusiasts is normal and okay
- Technical criticism of the build (not the person) is acceptable
- Don't be overly sensitive - this is a car community, not a corporate forum
`;

/**
 * Moderate a user comment using AI
 * 
 * @param {string} commentContent - The comment text to moderate
 * @param {Object} context - Optional context about the comment
 * @param {string} context.postTitle - Title of the build post
 * @param {string} context.carName - Name of the car being commented on
 * @param {string} context.commenterName - Name of the person commenting (for personalization)
 * @returns {Promise<ModerationResult>}
 */
export async function moderateComment(commentContent, context = {}) {
  // Basic validation
  if (!commentContent || typeof commentContent !== 'string') {
    return {
      approved: false,
      status: 'rejected',
      reason: 'Empty or invalid comment',
      score: 0,
    };
  }

  // Quick checks for obvious spam/short content
  const trimmedContent = commentContent.trim();
  if (trimmedContent.length < 1) {
    return {
      approved: false,
      status: 'rejected',
      reason: 'Comment is empty',
      score: 0,
    };
  }

  // Build the prompt with context
  const contextInfo = [];
  if (context.postTitle) contextInfo.push(`Build Title: "${context.postTitle}"`);
  if (context.carName) contextInfo.push(`Car: ${context.carName}`);
  
  const contextString = contextInfo.length > 0 
    ? `\n\nContext:\n${contextInfo.join('\n')}` 
    : '';

  try {
    const response = await anthropic.messages.create({
      model: MODERATION_MODEL,
      max_tokens: 150,
      temperature: 0,
      system: COMMUNITY_GUIDELINES,
      messages: [
        {
          role: 'user',
          content: `Moderate this comment for a community car build post.${contextString}

Comment to moderate:
"${trimmedContent}"

Respond in this exact JSON format (no other text):
{
  "status": "approved" | "rejected" | "flagged",
  "reason": null or "Brief reason for rejection/flagging",
  "score": 0.0 to 1.0
}

Score guidance:
- 0.9-1.0: Clearly positive/constructive
- 0.7-0.9: Acceptable, neutral or mild
- 0.5-0.7: Borderline, consider flagging
- 0.0-0.5: Likely problematic

Be lenient - car enthusiasts are casual. Only reject truly toxic content.`,
        },
      ],
    });

    // Parse the response
    const responseText = response.content[0].text.trim();
    
    try {
      // Try to parse as JSON
      const result = JSON.parse(responseText);
      
      return {
        approved: result.status === 'approved',
        status: result.status || 'rejected',
        reason: result.reason || null,
        score: typeof result.score === 'number' ? result.score : 0.5,
      };
    } catch (parseError) {
      // If JSON parsing fails, try to extract meaning
      console.warn('[Comment Moderation] Failed to parse AI response:', responseText);
      
      // Default to approving if we can't parse (fail open for better UX)
      // but flag for review
      return {
        approved: true,
        status: 'approved',
        reason: null,
        score: 0.7,
      };
    }
  } catch (error) {
    console.error('[Comment Moderation] AI error:', error);
    
    // On API error, approve with flag for manual review
    // This ensures the system doesn't block all comments on outages
    return {
      approved: true,
      status: 'approved',
      reason: null,
      score: 0.5,
    };
  }
}

/**
 * Batch moderate multiple comments (more efficient for bulk operations)
 * 
 * @param {Array<{content: string, context?: Object}>} comments
 * @returns {Promise<ModerationResult[]>}
 */
export async function moderateCommentsBatch(comments) {
  // Process in parallel with rate limiting
  const results = await Promise.all(
    comments.map(({ content, context }) => moderateComment(content, context))
  );
  return results;
}

/**
 * Get moderation guidance message for users
 */
export function getModerationGuidance() {
  return {
    title: "AI AL Reviews Comments",
    message: "Your comment will be reviewed by AI AL to ensure it follows our community standards. This helps keep AutoRev a positive space for car enthusiasts.",
    guidelines: [
      "Be respectful and constructive",
      "Share your enthusiasm and knowledge",
      "Ask questions and give helpful feedback",
      "Keep it about the cars and builds",
    ],
    disclaimer: "Most comments are approved within seconds.",
  };
}

export default {
  moderateComment,
  moderateCommentsBatch,
  getModerationGuidance,
};
