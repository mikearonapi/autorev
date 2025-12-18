import { getServiceClient } from '@/lib/supabaseServer';
import { notifyFeedback } from '@/lib/discord';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      feedback_type,
      category,
      message,
      email,
      page_url,
      pageUrl,
      page_title,
      car_slug,
      build_id,
      tags,
      metadata,
      browserInfo,
      severity,
      rating,
      featureContext,
      errorMetadata,
      userTier,
    } = body;

    const normalizedMessage = message || body?.errorMetadata?.errorMessage;

    if (!normalizedMessage) {
      return Response.json(
        { success: false, error: 'message is required' },
        { status: 400 }
      );
    }

    const validTypes = ['like', 'dislike', 'feature', 'bug', 'question', 'car_request', 'other', 'al-feedback'];
    const validCategories = ['bug', 'feature', 'data', 'general', 'praise', 'auto-error'];
    const validSeverities = ['blocking', 'major', 'minor'];

    const categoryToInsert = category || body?.category || null;
    const feedbackTypeToInsert = feedback_type && validTypes.includes(feedback_type)
      ? feedback_type
      : (categoryToInsert === 'auto-error' ? 'bug' : 'other');

    if (!validTypes.includes(feedbackTypeToInsert)) {
      return Response.json(
        { success: false, error: `Invalid feedback_type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    if (categoryToInsert && !validCategories.includes(categoryToInsert)) {
      return Response.json(
        { success: false, error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    if (severity && !validSeverities.includes(severity)) {
      return Response.json(
        { success: false, error: `Invalid severity. Must be one of: ${validSeverities.join(', ')}` },
        { status: 400 }
      );
    }

    // Get shared Supabase client (service role for bypassing RLS)
    const supabase = getServiceClient();
    if (!supabase) {
      console.error('[Feedback API] Database not configured');
      return Response.json({ success: false, error: 'Database not configured' }, { status: 503 });
    }

    const userAgent = request.headers.get('user-agent') || null;
    const browserInfoPayload = browserInfo || metadata || null;

    const feedbackData = {
      feedback_type: feedbackTypeToInsert,
      category: categoryToInsert || null,
      message: normalizedMessage,
      email: email || null,
      page_url: page_url || pageUrl || null,
      page_title: page_title || null,
      car_slug: car_slug || null,
      build_id: build_id || null,
      user_agent: userAgent,
      browser_info: browserInfoPayload,
      tags: tags || [],
      status: 'new',
      priority: 'normal',
      severity: severity || null,
      rating: rating || null,
      feature_context: featureContext || null,
      user_tier: userTier || null,
      error_metadata: errorMetadata || null,
    };

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

    const categoryMap = {
      'like': 'Praise',
      'dislike': 'Dislike', 
      'feature': 'Feature Request',
      'bug': 'Bug Report',
      'question': 'Question',
      'other': 'Other',
      'car_request': 'Car Request',
      'auto-error': 'Auto Error',
    };
    
    notifyFeedback({
      id: data.id,
      category: categoryToInsert || categoryMap[feedbackTypeToInsert] || feedbackTypeToInsert,
      severity: feedbackData.severity,
      message: normalizedMessage,
      page_url: feedbackData.page_url,
      user_tier: feedbackData.user_tier,
    }).catch(err => console.error('[Feedback API] Discord notification failed:', err));

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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');
    const unresolved = searchParams.get('unresolved') === 'true';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);

    const supabase = getServiceClient();
    if (!supabase) {
      return Response.json({ error: 'Database not configured' }, { status: 503 });
    }

    let query = supabase
      .from('user_feedback')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (category && category !== 'all') query = query.eq('category', category);
    if (severity && severity !== 'all') query = query.eq('severity', severity);
    if (status && status !== 'all') query = query.eq('status', status);
    if (unresolved) query = query.is('resolved_at', null);

    const { data, error } = await query;

    if (error) {
      console.error('[Feedback API] GET error:', error);
      return Response.json({ error: 'Failed to fetch feedback' }, { status: 500 });
    }

    const counts = {};
    const categoryStats = {};

    (data || []).forEach((item) => {
      const cat = item.category || item.feedback_type || 'unknown';
      counts[cat] = (counts[cat] || 0) + 1;

      const statBucket = categoryStats[cat] || { total: 0, blocking: 0, major: 0, minor: 0 };
      statBucket.total += 1;
      if (item.severity === 'blocking') statBucket.blocking += 1;
      if (item.severity === 'major') statBucket.major += 1;
      if (item.severity === 'minor') statBucket.minor += 1;
      categoryStats[cat] = statBucket;
    });

    return Response.json({
      recent: data,
      counts,
      categoryStats,
    });
  } catch (err) {
    console.error('[Feedback API] GET unexpected error:', err);
    return Response.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
