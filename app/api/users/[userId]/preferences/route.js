/**
 * User Preferences API Route
 * 
 * GET /api/users/:userId/preferences
 * Returns user's personalization preferences
 * 
 * POST /api/users/:userId/preferences
 * Save questionnaire responses and award points
 * 
 * Auth: User must be authenticated and can only access their own preferences
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createAuthenticatedClient, createServerSupabaseClient, getBearerToken } from '@/lib/supabaseServer';
import { withErrorLogging } from '@/lib/serverErrorLogger';
import { errors } from '@/lib/apiErrors';
import { awardPoints } from '@/lib/pointsService';
import { answersToDbFields, POINTS_PER_QUESTION } from '@/data/insightQuestions';
import { preferencesQuestionnaireSchema, validateWithSchema, validationErrorResponse } from '@/lib/schemas/index.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

/**
 * GET - Retrieve user preferences
 */
async function handleGet(request, { params }) {
  const { userId } = await params;

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
  
  // Verify the authenticated user matches the userId param
  if (user.id !== userId) {
    return errors.forbidden('Not authorized to view this user\'s preferences');
  }

  if (!supabase) {
    return errors.serviceUnavailable('Database');
  }

  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // Ignore "no rows returned"
    return errors.database(error.message);
  }

  return NextResponse.json({
    success: true,
    data: data || {
      // Default preferences if none exist
      driving_focus: [],
      work_preference: 'mixed',
      budget_comfort: 'moderate',
      mod_experience: 'beginner',
      primary_goals: [],
      track_frequency: 'never',
      detail_level: 'balanced',
      responses: {},
      questionnaire_points_earned: 0,
    },
  });
}

/**
 * POST - Save questionnaire responses
 */
async function handlePost(request, { params }) {
  const { userId } = await params;

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
  
  // Verify the authenticated user matches the userId param
  if (user.id !== userId) {
    return errors.forbidden('Not authorized to modify this user\'s preferences');
  }

  if (!supabase) {
    return errors.serviceUnavailable('Database');
  }

  const body = await request.json();
  
  // Validate with Zod schema
  const validation = validateWithSchema(preferencesQuestionnaireSchema, body);
  if (!validation.success) {
    return validationErrorResponse(validation.errors);
  }
  
  const { responses, pointsEarned } = validation.data;

  // Convert responses to database fields
  const dbFields = answersToDbFields(responses);

  // Get existing preferences to merge responses
  const { data: existingPrefs } = await supabase
    .from('user_preferences')
    .select('responses, questionnaire_points_earned')
    .eq('user_id', userId)
    .single();

  // Merge new responses with existing
  const mergedResponses = {
    ...(existingPrefs?.responses || {}),
    ...responses,
  };

  // Calculate total points earned
  const existingPoints = existingPrefs?.questionnaire_points_earned || 0;
  const newTotalPoints = Math.min(existingPoints + (pointsEarned || 0), 70); // Cap at max

  // Upsert preferences
  const { data, error } = await supabase
    .from('user_preferences')
    .upsert(
      {
        user_id: userId,
        ...dbFields,
        responses: mergedResponses,
        questionnaire_points_earned: newTotalPoints,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
        ignoreDuplicates: false,
      }
    )
    .select()
    .single();

  if (error) {
    console.error('[Preferences API] Database error:', error);
    return errors.database(error.message);
  }

  // Award points for answering questions
  const questionsAnswered = Object.keys(responses).length;
  for (let i = 0; i < questionsAnswered; i++) {
    try {
      await awardPoints(userId, 'insight_questionnaire', {
        questionId: Object.keys(responses)[i],
      });
    } catch (pointsError) {
      console.warn('[Preferences API] Points award failed:', pointsError.message);
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      preferences: data,
      pointsAwarded: pointsEarned || 0,
    },
  });
}

export const GET = withErrorLogging(handleGet, { route: 'users/preferences', feature: 'preferences' });
export const POST = withErrorLogging(handlePost, { route: 'users/preferences', feature: 'preferences' });
