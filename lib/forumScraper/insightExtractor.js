/**
 * Forum Insight Extractor
 * 
 * Uses Claude to extract structured insights from scraped forum threads.
 * Generates embeddings and persists to community_insights table.
 * 
 * @module lib/forumScraper/insightExtractor
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { supabaseServiceRole, isSupabaseConfigured } from '../supabase.js';
import { trackBackendAiUsage, AI_PURPOSES, AI_SOURCES } from '../backendAiLogger.js';

// Lazy-initialized AI clients (only created when needed)
let _anthropic = null;
let _openai = null;

function getAnthropic() {
  if (!_anthropic) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }
    _anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
  }
  return _anthropic;
}

function getOpenAI() {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return _openai;
}

/**
 * Valid insight types
 */
export const INSIGHT_TYPES = [
  'known_issue',       // Common problems, failure patterns
  'maintenance_tip',   // Service intervals, DIY procedures
  'modification_guide', // How-to guides for mods
  'troubleshooting',   // Diagnostic steps, solutions
  'buying_guide',      // PPI checklists, what to look for
  'performance_data',  // Dyno numbers, lap times (real owner data)
  'reliability_report', // Long-term ownership experiences
  'cost_insight',      // Real maintenance/repair costs
  'comparison'         // Owner comparisons between models/options
];

/**
 * Insight Extractor class
 */
export class InsightExtractor {
  constructor() {
    this.model = 'claude-sonnet-4-20250514';
    this.embeddingModel = 'text-embedding-3-small';
  }

  /**
   * Get database client
   * @returns {Object} Supabase client
   */
  getDbClient() {
    if (!isSupabaseConfigured || !supabaseServiceRole) {
      throw new Error('Supabase service role not configured');
    }
    return supabaseServiceRole;
  }

  /**
   * Extract insights from a single thread
   * @param {Object} thread - Scraped thread from database
   * @returns {Promise<Array>} Extracted insights
   */
  async extractFromThread(thread) {
    const posts = thread.posts || [];
    if (posts.length === 0) {
      console.log(`[InsightExtractor] No posts in thread: ${thread.thread_url}`);
      return [];
    }

    // Prepare thread content for Claude
    const threadContent = this._formatThreadForClaude(thread);
    
    // Truncate if too long (Claude context limit)
    const maxChars = 80000;
    const truncatedContent = threadContent.length > maxChars
      ? threadContent.substring(0, maxChars) + '\n\n[Content truncated...]'
      : threadContent;

    try {
      // Call Claude to extract insights
      const response = await getAnthropic().messages.create({
        model: this.model,
        max_tokens: 4000,
        system: this._getSystemPrompt(),
        messages: [
          {
            role: 'user',
            content: this._getUserPrompt(truncatedContent, thread)
          }
        ]
      });

      // Track AI usage for cost analytics
      await trackBackendAiUsage({
        purpose: AI_PURPOSES.FORUM_EXTRACTION,
        scriptName: 'insight-extractor',
        inputTokens: response.usage?.input_tokens || 0,
        outputTokens: response.usage?.output_tokens || 0,
        model: this.model,
        entityId: thread.id,
        source: AI_SOURCES.BACKEND_SCRIPT,
      });

      // Parse Claude's response
      const insights = this._parseClaudeResponse(response.content[0].text, thread);
      
      console.log(`[InsightExtractor] Extracted ${insights.length} insights from: ${thread.thread_title}`);
      
      return insights;

    } catch (error) {
      console.error(`[InsightExtractor] Claude error for thread ${thread.id}:`, error);
      throw error;
    }
  }

  /**
   * Format thread content for Claude
   * @param {Object} thread - Thread data
   * @returns {string} Formatted content
   */
  _formatThreadForClaude(thread) {
    const lines = [
      `FORUM THREAD: ${thread.thread_title}`,
      `URL: ${thread.thread_url}`,
      `Subforum: ${thread.subforum || 'Unknown'}`,
      `Date: ${thread.original_post_date || 'Unknown'}`,
      `Replies: ${thread.reply_count || 0}`,
      `Detected Cars: ${(thread.car_slugs_detected || []).join(', ') || 'None'}`,
      '',
      '--- THREAD CONTENT ---',
      ''
    ];

    const posts = thread.posts || [];
    for (const post of posts) {
      lines.push(`[Post #${post.post_number}] by ${post.author || 'Anonymous'}:`);
      lines.push(post.content || '');
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Get system prompt for Claude
   * @returns {string} System prompt
   */
  _getSystemPrompt() {
    return `You are an expert automotive analyst extracting valuable insights from forum threads for AutoRev, an enthusiast car database.

Your task is to identify and extract structured insights that would be genuinely useful to car enthusiasts and buyers.

INSIGHT TYPES YOU CAN EXTRACT:
- known_issue: Common problems, failure patterns, recalls
- maintenance_tip: Service intervals, DIY procedures, recommended parts
- modification_guide: How-to guides for modifications
- troubleshooting: Diagnostic steps, solutions to problems
- buying_guide: Pre-purchase inspection tips, what to look for
- performance_data: Real dyno numbers, lap times from owners
- reliability_report: Long-term ownership experiences (50k+ miles)
- cost_insight: Real maintenance/repair costs reported by owners
- comparison: Owner comparisons between models or options

QUALITY STANDARDS:
- Only extract insights backed by specific evidence in the thread
- Prioritize insights from experienced owners (high post counts, long ownership)
- Include specific numbers when available (mileage, costs, part numbers)
- Capture consensus views when multiple owners agree
- Note when information is disputed or controversial
- Assign confidence: high (multiple confirming sources), medium (single credible source), low (anecdotal)

OUTPUT FORMAT:
Return a JSON array of insights. Each insight must have:
{
  "type": "one of the valid types",
  "title": "Brief, searchable title (max 100 chars)",
  "summary": "2-3 sentence summary of the insight",
  "details": "Full details with specifics (part numbers, costs, procedures)",
  "confidence": "high" | "medium" | "low",
  "source_quotes": ["Direct quotes from thread supporting this insight"],
  "related_cars": ["car-slugs", "from-thread"],
  "tags": ["relevant", "searchable", "tags"]
}

If no valuable insights exist, return an empty array [].

Be selective - only extract genuinely useful information that would help someone make decisions or maintain their vehicle. Do not extract generic advice.`;
  }

  /**
   * Get user prompt for extraction
   * @param {string} content - Thread content
   * @param {Object} thread - Thread metadata
   * @returns {string} User prompt
   */
  _getUserPrompt(content, thread) {
    const carSlugs = thread.car_slugs_detected || [];
    return `Extract valuable insights from this automotive forum thread.

Known car models in this thread: ${carSlugs.join(', ') || 'Unknown - detect from content'}

Thread content:
${content}

Return your response as a JSON array of insights. Focus on extracting actionable, specific information that would be valuable to enthusiasts. If the thread contains no extractable insights, return [].`;
  }

  /**
   * Parse Claude's response into structured insights
   * @param {string} responseText - Claude's response
   * @param {Object} thread - Original thread
   * @returns {Array} Parsed insights
   */
  _parseClaudeResponse(responseText, thread) {
    try {
      // Find JSON array in response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.log('[InsightExtractor] No JSON array found in response');
        return [];
      }

      const parsed = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(parsed)) {
        return [];
      }

      // Validate and enrich insights
      const validInsights = [];
      for (const insight of parsed) {
        if (this._validateInsight(insight)) {
          validInsights.push({
            ...insight,
            car_slugs: insight.related_cars || thread.car_slugs_detected || [],
            forum_source: thread.forum_source?.slug || null,
            thread_url: thread.thread_url,
            thread_id: thread.id
          });
        }
      }

      return validInsights;

    } catch (error) {
      console.error('[InsightExtractor] Error parsing Claude response:', error);
      return [];
    }
  }

  /**
   * Validate an insight object
   * @param {Object} insight - Insight to validate
   * @returns {boolean} Is valid
   */
  _validateInsight(insight) {
    if (!insight || typeof insight !== 'object') return false;
    if (!INSIGHT_TYPES.includes(insight.type)) return false;
    if (!insight.title || insight.title.length < 10) return false;
    if (!insight.summary || insight.summary.length < 20) return false;
    return true;
  }

  /**
   * Generate embedding for insight
   * @param {Object} insight - Insight object
   * @returns {Promise<Array>} Embedding vector
   */
  async generateEmbedding(insight) {
    const textToEmbed = [
      insight.title,
      insight.summary,
      insight.details || '',
      (insight.tags || []).join(' '),
      (insight.car_slugs || []).join(' ')
    ].filter(Boolean).join(' ');

    const response = await getOpenAI().embeddings.create({
      model: this.embeddingModel,
      input: textToEmbed.substring(0, 8000) // OpenAI limit
    });

    return response.data[0].embedding;
  }

  /**
   * Save insight to database
   * @param {Object} insight - Insight with embedding
   * @param {Object} thread - Source thread record
   * @returns {Promise<Object>} Saved insight
   */
  async saveInsight(insight, thread) {
    const client = this.getDbClient();

    // Determine primary car slug (use first detected or 'generic')
    const carSlugs = insight.car_slugs || thread.car_slugs_detected || [];
    const primaryCarSlug = carSlugs[0] || 'generic';

    // Build embedding text
    const embeddingText = [
      insight.title,
      insight.summary,
      insight.details || '',
      (insight.tags || []).join(' '),
      carSlugs.join(' ')
    ].filter(Boolean).join(' ');

    // Generate embedding (optional - skip if OpenAI not configured)
    let embedding = null;
    try {
      if (process.env.OPENAI_API_KEY) {
        embedding = await this.generateEmbedding(insight);
      } else {
        console.log('[InsightExtractor] Skipping embedding - OPENAI_API_KEY not set');
      }
    } catch (embeddingError) {
      console.warn('[InsightExtractor] Embedding generation failed, saving without embedding:', embeddingError.message);
    }

    // Map confidence string to number
    const confidenceMap = { high: 0.9, medium: 0.7, low: 0.5 };
    const confidenceScore = confidenceMap[insight.confidence] || 0.7;

    // Insert insight
    const { data: savedInsight, error } = await client
      .from('community_insights')
      .insert({
        car_slug: primaryCarSlug,
        insight_type: insight.type,
        title: insight.title,
        summary: insight.summary,
        details: {
          content: insight.details || '',
          tags: insight.tags || [],
          source_quotes: insight.source_quotes || [],
          all_car_slugs: carSlugs
        },
        confidence: confidenceScore,
        consensus_strength: 'single_source',
        source_count: 1,
        source_forum: thread.forum_source?.slug || 'unknown',
        source_urls: [thread.thread_url],
        source_thread_id: thread.id,
        embedding,
        embedding_text: embeddingText.substring(0, 8000),
        is_active: true,
        is_verified: false
      })
      .select()
      .single();

    if (error) {
      console.error('[InsightExtractor] Error saving insight:', error);
      throw error;
    }

    // Link insight to source thread
    await client
      .from('community_insight_sources')
      .insert({
        insight_id: savedInsight.id,
        thread_id: thread.id,
        thread_url: thread.thread_url,
        forum_slug: thread.forum_source?.slug || 'unknown',
        relevance_score: thread.relevance_score || 0.5,
        extracted_quotes: insight.source_quotes || []
      });

    return savedInsight;
  }

  /**
   * Process a batch of threads
   * @param {Array} threads - Threads to process
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Processing results
   */
  async processBatch(threads, options = {}) {
    const client = this.getDbClient();
    const maxRetries = options.maxRetries || 2;
    const results = {
      processed: 0,
      insights: 0,
      errors: 0,
      tokenUsage: { input: 0, output: 0 },
      costEstimate: 0
    };

    for (const thread of threads) {
      let retryCount = 0;
      let success = false;

      while (!success && retryCount <= maxRetries) {
        try {
          // Extract insights
          const insights = await this.extractFromThread(thread);

          // Track token usage (estimate based on content length)
          const inputTokens = Math.ceil((thread.posts?.reduce((sum, p) => sum + (p.content?.length || 0), 0) || 0) / 4);
          const outputTokens = Math.ceil(JSON.stringify(insights).length / 4);
          results.tokenUsage.input += inputTokens;
          results.tokenUsage.output += outputTokens;
          // Claude Sonnet pricing: ~$3/M input, ~$15/M output
          results.costEstimate += (inputTokens * 0.000003) + (outputTokens * 0.000015);

          // Save each insight
          for (const insight of insights) {
            try {
              await this.saveInsight(insight, thread);
              results.insights++;
            } catch (saveError) {
              console.error(`[InsightExtractor] Error saving insight:`, saveError);
              // Continue with other insights even if one fails to save
            }
          }

          // Mark thread as processed
          await client
            .from('forum_scraped_threads')
            .update({
              processing_status: 'completed',
              insights_extracted: insights.length,
              processed_at: new Date().toISOString()
            })
            .eq('id', thread.id);

          results.processed++;
          success = true;

          // Small delay between threads to avoid rate limits
          await this._delay(500);

        } catch (error) {
          retryCount++;
          console.error(`[InsightExtractor] Error processing thread ${thread.id} (attempt ${retryCount}/${maxRetries + 1}):`, error.message);
          
          // Check if it's a rate limit error
          if (error.message?.includes('rate') || error.status === 429) {
            console.log('[InsightExtractor] Rate limited, waiting 30 seconds...');
            await this._delay(30000);
          } else if (retryCount <= maxRetries) {
            // Exponential backoff for other errors
            const backoff = 1000 * Math.pow(2, retryCount);
            console.log(`[InsightExtractor] Retrying in ${backoff}ms...`);
            await this._delay(backoff);
          }

          // If all retries exhausted, mark as failed
          if (retryCount > maxRetries) {
            await client
              .from('forum_scraped_threads')
              .update({
                processing_status: 'failed',
                processed_at: new Date().toISOString()
              })
              .eq('id', thread.id);

            results.errors++;
          }
        }
      }
    }

    // Update forum source totals
    const forumIds = [...new Set(threads.map(t => t.forum_source_id))];
    for (const forumId of forumIds) {
      try {
        await client.rpc('increment_forum_source_insights', { 
          p_forum_source_id: forumId, 
          p_count: results.insights 
        });
      } catch (rpcError) {
        console.error(`[InsightExtractor] Error updating forum source stats:`, rpcError);
      }
    }

    // Log cost estimate
    console.log(`[InsightExtractor] Batch complete. Token usage: ${results.tokenUsage.input} input, ${results.tokenUsage.output} output. Estimated cost: $${results.costEstimate.toFixed(4)}`);

    return results;
  }

  /**
   * Delay helper
   * @param {number} ms - Milliseconds
   * @returns {Promise<void>}
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Create new InsightExtractor instance
 * @returns {InsightExtractor}
 */
export function createInsightExtractor() {
  return new InsightExtractor();
}

// Export singleton
export const insightExtractor = new InsightExtractor();

export default InsightExtractor;

