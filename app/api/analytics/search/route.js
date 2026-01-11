/**
 * Search Analytics API
 * 
 * POST /api/analytics/search
 * 
 * Tracks what users search for and whether they find results.
 * Useful for improving search and understanding user intent.
 */

import { createClient } from '@supabase/supabase-js';
import { withErrorLogging } from '@/lib/serverErrorLogger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function handlePost(request) {
  const body = await request.json();
    
    const {
      sessionId,
      userId,
      searchQuery,
      searchType,
      resultsCount,
      clickedResultPosition,
      clickedResultId,
      clickedResultType,
      pageContext,
      filtersApplied
    } = body;
    
    // Validate required fields
    if (!sessionId || !searchQuery) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Clean and validate search query
    const cleanQuery = searchQuery.trim().substring(0, 500);
    if (!cleanQuery) {
      return Response.json({ error: 'Empty search query' }, { status: 400 });
    }
    
    // Insert search record
    const { error } = await supabase
      .from('search_analytics')
      .insert({
        session_id: sessionId,
        user_id: userId || null,
        search_query: cleanQuery,
        search_type: searchType || 'global',
        results_count: resultsCount ?? null,
        clicked_result_position: clickedResultPosition || null,
        clicked_result_id: clickedResultId || null,
        clicked_result_type: clickedResultType || null,
        page_context: pageContext || null,
        filters_applied: filtersApplied || {}
      });
    
    if (error) {
      console.error('[Search API] Insert error:', error);
    }
    
    return Response.json({ success: true });
}

export const POST = withErrorLogging(handlePost, { route: 'analytics/search', feature: 'analytics' });

