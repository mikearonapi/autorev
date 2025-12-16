import { createClient } from '@supabase/supabase-js';
import { notifyFeedback } from '@/lib/discord';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      feedback_type,
      message,
      email,
      page_url,
      page_title,
      car_slug,
      build_id,
      tags,
      metadata,
    } = body;

    // Validate required fields
    if (!feedback_type || !message) {
      return Response.json(
        { success: false, error: 'feedback_type and message are required' },
        { status: 400 }
      );
    }

    // Validate feedback_type
    const validTypes = ['like', 'dislike', 'feature', 'bug', 'question', 'other'];
    if (!validTypes.includes(feedback_type)) {
      return Response.json(
        { success: false, error: `Invalid feedback_type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Create Supabase client with service role for bypassing RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get user agent from request headers
    const userAgent = request.headers.get('user-agent') || null;

    // Prepare feedback data
    const feedbackData = {
      feedback_type,
      message,
      email: email || null,
      page_url: page_url || null,
      page_title: page_title || null,
      car_slug: car_slug || null,
      build_id: build_id || null,
      user_agent: userAgent,
      tags: tags || [],
      status: 'new',
      priority: 'normal',
    };

    // Add metadata as JSONB if provided
    if (metadata) {
      feedbackData.browser_info = metadata;
    }

    // Insert into user_feedback table
    const { data, error } = await supabase
      .from('user_feedback')
      .insert(feedbackData)
      .select()
      .single();

    if (error) {
      console.error('[Feedback API] Supabase error:', error);
      return Response.json(
        { success: false, error: 'Failed to save feedback. Please try again.' },
        { status: 500 }
      );
    }

    // Fire-and-forget Discord notification (no await)
    const userTier = body.userTier || null;
    notifyFeedback({
      id: data.id,
      category: body.category,
      severity: body.severity,
      message: body.message,
      page_url: body.pageUrl,
      user_tier: userTier,
    });

    return Response.json({
      success: true,
      data: {
        id: data.id,
        created_at: data.created_at,
      }
    });
  } catch (err) {
    console.error('[Feedback API] Unexpected error:', err);
    return Response.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
