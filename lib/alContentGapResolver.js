/**
 * AL Content Gap Resolver
 * 
 * Processes detected content gaps and attempts to resolve them:
 * 1. Check if data already exists (re-indexing issue)
 * 2. Queue research tasks for missing data
 * 3. Notify appropriate teams via Discord
 * 4. Mark gaps as resolved with resolution type
 * 
 * Resolution types:
 * - data_added: New data was added to database
 * - kb_updated: Knowledge base was updated
 * - already_exists: Data existed, AL indexing was the issue
 * - deferred: Intentionally postponed
 * - not_applicable: False positive or out of scope
 * - wont_fix: Decided not to address
 */

import { createClient } from '@supabase/supabase-js';
import { getUnresolvedGaps, getContentGapStats } from './alIntelligence';
import { notifyDiscord } from './discord';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Search existing data sources for potential content
 */
async function searchExistingContent(gap) {
  const { question_pattern, car_slug } = gap;
  const results = {
    hasData: false,
    sources: [],
    dataQuality: null,
  };
  
  // If we have a car slug, check car-specific data
  if (car_slug) {
    // Check car_issues
    const { data: issues } = await supabase
      .from('car_issues')
      .select('id, title')
      .ilike('car_slug', car_slug)
      .limit(5);
    
    if (issues?.length > 0) {
      results.sources.push({ type: 'car_issues', count: issues.length });
    }
    
    // Check car_tuning_profiles
    const { data: tuning } = await supabase
      .from('car_tuning_profiles')
      .select('id')
      .eq('car_slug', car_slug)
      .limit(1);
    
    if (tuning?.length > 0) {
      results.sources.push({ type: 'car_tuning_profiles', count: 1 });
    }
    
    // Check vehicle_maintenance_specs
    const { data: maintenance } = await supabase
      .from('vehicle_maintenance_specs')
      .select('id')
      .eq('car_slug', car_slug)
      .limit(1);
    
    if (maintenance?.length > 0) {
      results.sources.push({ type: 'vehicle_maintenance_specs', count: 1 });
    }
    
    // Check youtube_videos
    const { data: videos } = await supabase
      .from('youtube_video_car_links')
      .select('video_id')
      .eq('car_slug', car_slug)
      .limit(5);
    
    if (videos?.length > 0) {
      results.sources.push({ type: 'youtube_videos', count: videos.length });
    }
  }
  
  // Keyword search in community insights
  const keywords = question_pattern.split(' ')
    .filter(w => w.length > 3)
    .slice(0, 3);
  
  if (keywords.length > 0) {
    const { data: insights } = await supabase
      .from('community_insights')
      .select('id')
      .textSearch('content', keywords.join(' & '))
      .limit(5);
    
    if (insights?.length > 0) {
      results.sources.push({ type: 'community_insights', count: insights.length });
    }
  }
  
  results.hasData = results.sources.length > 0;
  
  return results;
}

/**
 * Determine resolution recommendation based on gap analysis
 */
function getResolutionRecommendation(gap, existingContent) {
  const { gap_type, occurrence_count } = gap;
  
  // If data exists, might be indexing/retrieval issue
  if (existingContent.hasData) {
    return {
      action: 'check_retrieval',
      recommendation: 'already_exists',
      priority: 'medium',
      reason: `Found ${existingContent.sources.length} potential data source(s). Check if AL is retrieving this data correctly.`,
    };
  }
  
  // Prioritize by occurrence count and gap type
  let priority = 'low';
  if (occurrence_count >= 10) priority = 'high';
  else if (occurrence_count >= 5) priority = 'medium';
  
  switch (gap_type) {
    case 'missing_data':
      return {
        action: 'add_data',
        recommendation: 'data_added',
        priority,
        reason: 'Data does not exist in database. Research and add new content.',
      };
    
    case 'outdated':
      return {
        action: 'update_data',
        recommendation: 'kb_updated',
        priority,
        reason: 'Data may be outdated. Verify and update if needed.',
      };
    
    case 'incomplete':
      return {
        action: 'expand_data',
        recommendation: 'kb_updated',
        priority,
        reason: 'Partial data exists. Fill in missing details.',
      };
    
    case 'no_source':
      return {
        action: 'verify_source',
        recommendation: 'kb_updated',
        priority: 'low',
        reason: 'Need authoritative source verification.',
      };
    
    case 'low_confidence':
    default:
      return {
        action: 'review',
        recommendation: 'deferred',
        priority: 'low',
        reason: 'Low confidence response. May resolve naturally with better prompting.',
      };
  }
}

/**
 * Resolve a content gap with specified resolution
 */
export async function resolveGap(gapId, resolutionType, notes = null, userId = null) {
  const { data, error } = await supabase
    .from('al_content_gaps')
    .update({
      resolved_at: new Date().toISOString(),
      resolution_type: resolutionType,
      resolution_notes: notes,
      resolved_by: userId,
    })
    .eq('id', gapId)
    .select()
    .single();
  
  if (error) {
    console.error('[GapResolver] Error resolving gap:', error);
    return null;
  }
  
  return data;
}

/**
 * Process a single content gap
 */
export async function processGap(gap) {
  const { id, question_pattern, car_slug, gap_type, occurrence_count } = gap;
  
  console.log(`[GapResolver] Processing gap: ${id} (${gap_type}, ${occurrence_count} occurrences)`);
  
  // Search for existing content
  const existingContent = await searchExistingContent(gap);
  
  // Get resolution recommendation
  const recommendation = getResolutionRecommendation(gap, existingContent);
  
  return {
    gap,
    existingContent,
    recommendation,
  };
}

/**
 * Process all unresolved gaps and generate a report
 */
export async function processAllGaps(options = {}) {
  const {
    minOccurrences = 3,
    limit = 50,
    autoResolveExisting = false,
  } = options;
  
  const gaps = await getUnresolvedGaps({ minOccurrences, limit });
  
  if (!gaps || gaps.length === 0) {
    return {
      processed: 0,
      resolved: 0,
      actionRequired: [],
    };
  }
  
  const results = {
    processed: gaps.length,
    resolved: 0,
    actionRequired: [],
    byPriority: { high: [], medium: [], low: [] },
  };
  
  for (const gap of gaps) {
    const analysis = await processGap(gap);
    
    // Auto-resolve if data exists and option is enabled
    if (autoResolveExisting && analysis.existingContent.hasData) {
      await resolveGap(
        gap.id,
        'already_exists',
        `Data found in: ${analysis.existingContent.sources.map(s => s.type).join(', ')}`
      );
      results.resolved++;
      continue;
    }
    
    // Categorize by priority
    const priority = analysis.recommendation.priority;
    results.byPriority[priority].push(analysis);
    
    // High priority gaps need action
    if (priority === 'high' || priority === 'medium') {
      results.actionRequired.push(analysis);
    }
  }
  
  return results;
}

/**
 * Generate a content gap report for Discord notification
 */
export async function generateGapReport() {
  const stats = await getContentGapStats();
  const highPriorityGaps = await getUnresolvedGaps({ minOccurrences: 5, limit: 10 });
  
  if (!stats) {
    return null;
  }
  
  // Group by car
  const byCarSlug = {};
  for (const gap of highPriorityGaps) {
    const car = gap.car_slug || 'general';
    if (!byCarSlug[car]) byCarSlug[car] = [];
    byCarSlug[car].push(gap);
  }
  
  return {
    stats,
    highPriorityGaps,
    byCarSlug,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Send content gap report to Discord
 */
export async function notifyContentGaps() {
  const report = await generateGapReport();
  
  if (!report || report.highPriorityGaps.length === 0) {
    console.log('[GapResolver] No high-priority gaps to report');
    return;
  }
  
  const { stats, highPriorityGaps, byCarSlug } = report;
  
  // Build embed
  const embed = {
    title: '📊 AL Content Gap Report',
    description: `Found ${stats.unresolved} unresolved content gaps (${highPriorityGaps.length} high priority)`,
    fields: [
      {
        name: 'Summary',
        value: `Total: ${stats.total} | Resolved: ${stats.resolved} | Unresolved: ${stats.unresolved}`,
        inline: false,
      },
    ],
    color: stats.unresolved > 20 ? 0xef4444 : stats.unresolved > 10 ? 0xf59e0b : 0x10b981,
    timestamp: new Date().toISOString(),
  };
  
  // Add gap type breakdown
  if (stats.byType && Object.keys(stats.byType).length > 0) {
    embed.fields.push({
      name: 'By Type',
      value: Object.entries(stats.byType)
        .map(([type, count]) => `${type}: ${count}`)
        .join(' | '),
      inline: false,
    });
  }
  
  // Add top gaps
  const topGaps = highPriorityGaps.slice(0, 5)
    .map(g => `• [${g.occurrence_count}x] ${g.question_pattern.slice(0, 50)}...`)
    .join('\n');
  
  if (topGaps) {
    embed.fields.push({
      name: 'Top Gaps (by occurrence)',
      value: topGaps,
      inline: false,
    });
  }
  
  try {
    await notifyDiscord(null, {
      webhookUrl: process.env.DISCORD_CONTENT_WEBHOOK || process.env.DISCORD_ALERTS_WEBHOOK,
      embeds: [embed],
    });
  } catch (err) {
    console.error('[GapResolver] Discord notification failed:', err);
  }
}

/**
 * Get gaps for admin review
 */
export async function getGapsForReview(options = {}) {
  const {
    page = 1,
    pageSize = 20,
    status = 'unresolved', // 'unresolved' | 'resolved' | 'all'
    gapType = null,
    carSlug = null,
    sortBy = 'occurrence_count',
    sortOrder = 'desc',
  } = options;
  
  let query = supabase
    .from('al_content_gaps')
    .select('*', { count: 'exact' });
  
  // Status filter
  if (status === 'unresolved') {
    query = query.is('resolved_at', null);
  } else if (status === 'resolved') {
    query = query.not('resolved_at', 'is', null);
  }
  
  // Type filter
  if (gapType) {
    query = query.eq('gap_type', gapType);
  }
  
  // Car filter
  if (carSlug) {
    query = query.eq('car_slug', carSlug);
  }
  
  // Sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });
  
  // Pagination
  const offset = (page - 1) * pageSize;
  query = query.range(offset, offset + pageSize - 1);
  
  const { data, count, error } = await query;
  
  if (error) {
    console.error('[GapResolver] Error fetching gaps:', error);
    return { gaps: [], total: 0, page, pageSize };
  }
  
  return {
    gaps: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

export default {
  resolveGap,
  processGap,
  processAllGaps,
  generateGapReport,
  notifyContentGaps,
  getGapsForReview,
  searchExistingContent,
  getResolutionRecommendation,
};
