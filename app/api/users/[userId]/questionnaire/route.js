/**
 * User Questionnaire API
 * 
 * GET - Fetch all user responses + profile summary
 * POST - Save one or more responses
 * 
 * @route /api/users/[userId]/questionnaire
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
  QUESTIONNAIRE_LIBRARY,
  QUESTION_CATEGORIES,
  getNextQuestions,
  calculateCategoryCompletion,
} from '@/data/questionnaireLibrary';
import { awardPoints } from '@/lib/pointsService';

// Initialize Supabase client with service role for secure operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing');
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * GET /api/users/[userId]/questionnaire
 * 
 * Fetch all questionnaire data for a user
 */
export async function GET(request, { params }) {
  try {
    const { userId } = await params;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }
    
    const supabase = getSupabase();
    
    // Fetch responses and summary in parallel
    const [responsesResult, summaryResult] = await Promise.all([
      supabase
        .from('user_questionnaire_responses')
        .select('question_id, question_category, answer, answered_at')
        .eq('user_id', userId)
        .order('answered_at', { ascending: false }),
      supabase
        .from('user_profile_summary')
        .select('*')
        .eq('user_id', userId)
        .single(),
    ]);
    
    if (responsesResult.error && responsesResult.error.code !== 'PGRST116') {
      console.error('[Questionnaire API] Error fetching responses:', responsesResult.error);
      return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 });
    }
    
    // Build responses map
    const responses = {};
    const responsesList = responsesResult.data || [];
    for (const row of responsesList) {
      responses[row.question_id] = row.answer;
    }
    
    // Calculate category completion
    const answeredIds = new Set(Object.keys(responses));
    const categoryCompletion = calculateCategoryCompletion(answeredIds);
    
    // Get next recommended questions
    const nextQuestions = getNextQuestions(answeredIds, 5);
    
    // Build summary (use DB summary or create defaults)
    const summary = summaryResult.data || {
      answered_count: responsesList.length,
      profile_completeness_pct: Math.min(100, Math.round((responsesList.length / QUESTIONNAIRE_LIBRARY.length) * 100)),
      driving_persona: null,
      knowledge_level: null,
      interests: [],
      total_points_earned: responsesList.length * 10,
    };
    
    return NextResponse.json({
      success: true,
      data: {
        responses,
        summary: {
          answeredCount: summary.answered_count,
          profileCompletenessPct: summary.profile_completeness_pct,
          drivingPersona: summary.driving_persona,
          knowledgeLevel: summary.knowledge_level,
          interests: summary.interests || [],
          totalPointsEarned: summary.total_points_earned,
          categoryCompletion,
        },
        nextQuestions: nextQuestions.map(q => ({
          id: q.id,
          category: q.category,
          question: q.question,
          hint: q.hint,
          type: q.type,
          options: q.options,
          points: q.points,
        })),
        categories: QUESTION_CATEGORIES,
        totalQuestions: QUESTIONNAIRE_LIBRARY.length,
      },
    });
  } catch (error) {
    console.error('[Questionnaire API] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/users/[userId]/questionnaire
 * 
 * Save one or more questionnaire responses
 * 
 * Body: {
 *   responses: {
 *     'question_id': { value: 'answer_value', category: 'category_id' },
 *     ...
 *   }
 * }
 */
export async function POST(request, { params }) {
  try {
    const { userId } = await params;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }
    
    const body = await request.json();
    const { responses } = body;
    
    if (!responses || typeof responses !== 'object') {
      return NextResponse.json({ error: 'Responses object required' }, { status: 400 });
    }
    
    const supabase = getSupabase();
    
    // Get existing responses to determine new vs updated
    const { data: existingResponses } = await supabase
      .from('user_questionnaire_responses')
      .select('question_id')
      .eq('user_id', userId);
    
    const existingIds = new Set((existingResponses || []).map(r => r.question_id));
    
    // Process each response
    const upserts = [];
    const newQuestionIds = [];
    
    for (const [questionId, answerData] of Object.entries(responses)) {
      // Find the question to get its category
      const question = QUESTIONNAIRE_LIBRARY.find(q => q.id === questionId);
      const category = question?.category || answerData.category || 'core';
      
      // Prepare the answer - ensure it's an object with value
      let answer = answerData;
      if (typeof answerData !== 'object' || answerData === null) {
        answer = { value: answerData };
      }
      
      upserts.push({
        user_id: userId,
        question_id: questionId,
        question_category: category,
        answer,
      });
      
      // Track new questions for points
      if (!existingIds.has(questionId)) {
        newQuestionIds.push(questionId);
      }
    }
    
    // Upsert all responses
    const { error: upsertError } = await supabase
      .from('user_questionnaire_responses')
      .upsert(upserts, {
        onConflict: 'user_id,question_id',
        ignoreDuplicates: false,
      });
    
    if (upsertError) {
      console.error('[Questionnaire API] Upsert error:', upsertError);
      return NextResponse.json({ error: 'Failed to save responses' }, { status: 500 });
    }
    
    // Award points for new responses (non-blocking)
    if (newQuestionIds.length > 0) {
      // Award points for each new question answered
      for (const questionId of newQuestionIds) {
        awardPoints(userId, 'questionnaire_answer', { questionId }).catch(err => {
          console.warn('[Questionnaire API] Points award failed:', err);
        });
      }
      
      // Check for milestone achievements
      const totalAnswered = existingIds.size + newQuestionIds.length;
      
      // 50% complete milestone
      if (totalAnswered >= Math.ceil(QUESTIONNAIRE_LIBRARY.length * 0.5) && 
          existingIds.size < Math.ceil(QUESTIONNAIRE_LIBRARY.length * 0.5)) {
        awardPoints(userId, 'questionnaire_50_percent', { totalAnswered }).catch(() => {});
      }
      
      // Category complete milestones
      const answeredIds = new Set([...existingIds, ...newQuestionIds]);
      const categoryCompletion = calculateCategoryCompletion(answeredIds);
      
      for (const [categoryId, stats] of Object.entries(categoryCompletion)) {
        if (stats.percentage === 100) {
          // Check if this category was just completed
          const prevCompletion = calculateCategoryCompletion(existingIds);
          if (prevCompletion[categoryId]?.percentage < 100) {
            awardPoints(userId, 'questionnaire_category_complete', { 
              category: categoryId,
            }).catch(() => {});
          }
        }
      }
    }
    
    // Fetch updated summary (trigger auto-updates it)
    const { data: updatedSummary } = await supabase
      .from('user_profile_summary')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    // Get next questions
    const { data: allResponses } = await supabase
      .from('user_questionnaire_responses')
      .select('question_id')
      .eq('user_id', userId);
    
    const answeredIds = new Set((allResponses || []).map(r => r.question_id));
    const nextQuestions = getNextQuestions(answeredIds, 3);
    
    return NextResponse.json({
      success: true,
      savedCount: upserts.length,
      newCount: newQuestionIds.length,
      summary: updatedSummary ? {
        answeredCount: updatedSummary.answered_count,
        profileCompletenessPct: updatedSummary.profile_completeness_pct,
        drivingPersona: updatedSummary.driving_persona,
        knowledgeLevel: updatedSummary.knowledge_level,
        interests: updatedSummary.interests || [],
      } : null,
      nextQuestions: nextQuestions.map(q => ({
        id: q.id,
        category: q.category,
        question: q.question,
        type: q.type,
        options: q.options,
        points: q.points,
      })),
    });
  } catch (error) {
    console.error('[Questionnaire API] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
