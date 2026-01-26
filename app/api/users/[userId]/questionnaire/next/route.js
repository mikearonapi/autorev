/**
 * Next Questions API
 * 
 * GET - Returns next recommended questions based on:
 * - Unanswered questions
 * - Category completion
 * - Prerequisites from previous answers
 * 
 * Auth: User must be authenticated and can only access their own questionnaire
 * 
 * @route /api/users/[userId]/questionnaire/next
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient, getBearerToken, createAuthenticatedClient } from '@/lib/supabaseServer';
import { errors } from '@/lib/apiErrors';
import { withErrorLogging } from '@/lib/serverErrorLogger';
import { 
  QUESTIONNAIRE_LIBRARY,
  QUESTION_CATEGORIES,
  getAvailableQuestions,
  calculateCategoryCompletion,
} from '@/data/questionnaireLibrary';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing');
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * GET /api/users/[userId]/questionnaire/next
 * 
 * Query params:
 * - count: Number of questions to return (default 5, max 10)
 * - category: Preferred category to pull from
 * - excludeIds: Comma-separated question IDs to exclude
 */
async function handleGet(request, { params }) {
  try {
    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    
    const count = Math.min(10, parseInt(searchParams.get('count') || '5', 10));
    const preferredCategory = searchParams.get('category');
    const excludeIdsParam = searchParams.get('excludeIds');
    const excludeIds = excludeIdsParam ? new Set(excludeIdsParam.split(',')) : new Set();
    
    if (!userId) {
      return errors.missingField('userId');
    }

    // Get authenticated user
    const bearerToken = getBearerToken(request);
    const authSupabase = bearerToken 
      ? createAuthenticatedClient(bearerToken) 
      : await createServerSupabaseClient();

    if (!authSupabase) {
      return errors.serviceUnavailable('Authentication service');
    }

    const { data: { user }, error: authError } = bearerToken
      ? await authSupabase.auth.getUser(bearerToken)
      : await authSupabase.auth.getUser();
    
    if (authError || !user) {
      return errors.unauthorized();
    }
    
    // Verify the authenticated user matches the userId param (IDOR protection)
    if (user.id !== userId) {
      return errors.forbidden('Not authorized to access this user\'s questionnaire');
    }
    
    const supabase = getSupabase();
    
    // Fetch user's current responses
    const { data: responses, error } = await supabase
      .from('user_questionnaire_responses')
      .select('question_id, answer')
      .eq('user_id', userId);
    
    if (error && error.code !== 'PGRST116') {
      console.error('[Questionnaire Next API] Error:', error);
      return errors.database('Failed to fetch responses');
    }
    
    // Build responses map for prerequisite checking
    const responsesMap = {};
    for (const row of (responses || [])) {
      responsesMap[row.question_id] = row.answer;
    }
    
    // Get available questions (filters by prerequisites and already answered)
    let availableQuestions = getAvailableQuestions(responsesMap);
    
    // Apply additional excludeIds filter
    if (excludeIds.size > 0) {
      availableQuestions = availableQuestions.filter(q => !excludeIds.has(q.id));
    }
    
    // Sort by category priority
    const categoryPriority = {};
    for (const cat of Object.values(QUESTION_CATEGORIES)) {
      categoryPriority[cat.id] = cat.priority;
    }
    
    availableQuestions.sort((a, b) => {
      // If preferred category, put those first
      if (preferredCategory) {
        if (a.category === preferredCategory && b.category !== preferredCategory) return -1;
        if (b.category === preferredCategory && a.category !== preferredCategory) return 1;
      }
      // Then sort by category priority
      return (categoryPriority[a.category] || 99) - (categoryPriority[b.category] || 99);
    });
    
    // Take requested count
    const nextQuestions = availableQuestions.slice(0, count);
    
    // Calculate category stats
    const answeredIds = new Set(Object.keys(responsesMap));
    const categoryCompletion = calculateCategoryCompletion(answeredIds);
    
    // Find categories that need attention (least complete)
    const categoriesNeedingAttention = Object.entries(categoryCompletion)
      .filter(([_, stats]) => stats.percentage < 100)
      .sort((a, b) => a[1].percentage - b[1].percentage)
      .slice(0, 3)
      .map(([id, stats]) => ({
        id,
        name: QUESTION_CATEGORIES[id]?.name,
        ...stats,
      }));
    
    return NextResponse.json({
      success: true,
      questions: nextQuestions.map(q => ({
        id: q.id,
        category: q.category,
        categoryName: QUESTION_CATEGORIES[q.category]?.name,
        categoryIcon: QUESTION_CATEGORIES[q.category]?.icon,
        categoryColor: QUESTION_CATEGORIES[q.category]?.color,
        question: q.question,
        hint: q.hint,
        type: q.type,
        options: q.options,
        maxSelections: q.maxSelections,
        points: q.points,
        alContext: q.alContext,
      })),
      remaining: availableQuestions.length - nextQuestions.length,
      totalAnswered: Object.keys(responsesMap).length,
      totalQuestions: QUESTIONNAIRE_LIBRARY.length,
      categoriesNeedingAttention,
    });
  } catch (error) {
    console.error('[Questionnaire Next API] Error:', error);
    return errors.internal('Failed to fetch next questions');
  }
}

// Export wrapped handler with error logging
export const GET = withErrorLogging(handleGet, { route: 'users/questionnaire/next', feature: 'questionnaire' });
