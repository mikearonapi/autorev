/**
 * User Preferences API Route
 * 
 * GET /api/users/:userId/preferences
 * Returns user's personalization preferences
 * 
 * POST /api/users/:userId/preferences
 * Save questionnaire responses and award points
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { awardPoints } from '@/lib/pointsService';
import { answersToDbFields, POINTS_PER_QUESTION } from '@/data/insightQuestions';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

/**
 * GET - Retrieve user preferences
 */
export async function GET(request, { params }) {
  const { userId } = await params;

  if (!userId) {
    return NextResponse.json(
      { error: 'User ID is required' },
      { status: 400 }
    );
  }

  if (!supabase) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 500 }
    );
  }

  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // Ignore "no rows returned"
      throw error;
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

  } catch (error) {
    console.error('[Preferences API] GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST - Save questionnaire responses
 */
export async function POST(request, { params }) {
  const { userId } = await params;

  if (!userId) {
    return NextResponse.json(
      { error: 'User ID is required' },
      { status: 400 }
    );
  }

  if (!supabase) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { responses, pointsEarned } = body;

    if (!responses || typeof responses !== 'object') {
      return NextResponse.json(
        { error: 'Responses object is required' },
        { status: 400 }
      );
    }

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
      throw error;
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

  } catch (error) {
    console.error('[Preferences API] POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to save preferences', details: error.message },
      { status: 500 }
    );
  }
}
