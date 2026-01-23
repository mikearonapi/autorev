/**
 * Insight Feedback API Route
 * 
 * POST /api/insights/feedback
 * Save thumbs up/down feedback for an insight
 * Awards 2 points for each feedback submission
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { awardPoints } from '@/lib/pointsService';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Points awarded for providing feedback
const FEEDBACK_POINTS = 2;

export async function POST(request) {
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { userId, insightType, insightKey, carId, rating, feedbackText, insightContent, insightTitle } = body;

    // Validate required fields
    if (!userId || !insightType || !insightKey || !rating) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, insightType, insightKey, rating' },
        { status: 400 }
      );
    }

    if (!['up', 'down'].includes(rating)) {
      return NextResponse.json(
        { error: 'Rating must be "up" or "down"' },
        { status: 400 }
      );
    }

    // Upsert feedback (update if exists, insert if not)
    const { data, error } = await supabase
      .from('insight_feedback')
      .upsert(
        {
          user_id: userId,
          insight_type: insightType,
          insight_key: insightKey,
          car_id: carId || null,
          rating,
          feedback_text: feedbackText || null,
          insight_content: insightContent || null,
          insight_title: insightTitle || null,
          created_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,insight_type,insight_key',
          ignoreDuplicates: false,
        }
      )
      .select()
      .single();

    if (error) {
      console.error('[Feedback API] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to save feedback', details: error.message },
        { status: 500 }
      );
    }

    // Award points for providing feedback
    try {
      await awardPoints(userId, 'insight_feedback', {
        insightType,
        insightKey,
        rating,
      });
    } catch (pointsError) {
      console.warn('[Feedback API] Points award failed (non-fatal):', pointsError.message);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        rating: data.rating,
        pointsAwarded: FEEDBACK_POINTS,
      },
    });

  } catch (error) {
    console.error('[Feedback API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process feedback', details: error.message },
      { status: 500 }
    );
  }
}
