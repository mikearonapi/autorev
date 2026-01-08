/**
 * Community Posts API
 * 
 * GET /api/community/posts - List posts
 * POST /api/community/posts - Create a new post
 * 
 * @route /api/community/posts
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Get authenticated user from request
 */
async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * GET /api/community/posts
 * List community posts with optional filters
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const postType = searchParams.get('type');
    const carSlug = searchParams.get('car');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const featured = searchParams.get('featured') === 'true';

    const { data, error } = await supabaseAdmin.rpc('get_community_posts', {
      p_post_type: postType || null,
      p_car_slug: carSlug || null,
      p_limit: Math.min(limit, 50), // Cap at 50
      p_offset: offset,
    });

    if (error) {
      console.error('[CommunityPosts API] Error:', error);
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }

    let results = data || [];
    
    // Filter by featured if requested
    if (featured) {
      results = results.filter(p => p.is_featured);
    }

    return NextResponse.json({
      posts: results,
      count: results.length,
      hasMore: results.length === limit,
    });

  } catch (error) {
    console.error('[CommunityPosts API] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/**
 * POST /api/community/posts
 * Create a new community post
 */
export async function POST(request) {
  try {
    // Verify authentication
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      postType,
      title,
      description,
      vehicleId,
      buildId,
      carSlug,
      carName,
      imageIds, // Array of image IDs to attach
    } = body;

    // Validate required fields
    if (!postType || !title) {
      return NextResponse.json({ 
        error: 'Missing required fields: postType and title are required' 
      }, { status: 400 });
    }

    if (!['garage', 'build', 'vehicle'].includes(postType)) {
      return NextResponse.json({ 
        error: 'Invalid postType. Must be: garage, build, or vehicle' 
      }, { status: 400 });
    }

    // Generate slug
    const { data: slugResult, error: slugError } = await supabaseAdmin.rpc('generate_community_post_slug', {
      p_title: title,
      p_user_id: user.id,
    });

    if (slugError) {
      console.error('[CommunityPosts API] Slug error:', slugError);
      return NextResponse.json({ error: 'Failed to generate slug' }, { status: 500 });
    }

    const slug = slugResult || `post-${Date.now()}`;

    // Create post
    const { data: post, error: postError } = await supabaseAdmin
      .from('community_posts')
      .insert({
        user_id: user.id,
        post_type: postType,
        title,
        description: description || null,
        user_vehicle_id: vehicleId || null,
        user_build_id: buildId || null,
        car_slug: carSlug || null,
        car_name: carName || null,
        slug,
        is_published: true,
        published_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (postError) {
      console.error('[CommunityPosts API] Create error:', postError);
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }

    // Attach images to post if provided
    if (imageIds && imageIds.length > 0) {
      const { error: imageError } = await supabaseAdmin
        .from('user_uploaded_images')
        .update({ community_post_id: post.id })
        .in('id', imageIds)
        .eq('user_id', user.id); // Verify ownership

      if (imageError) {
        console.error('[CommunityPosts API] Image attach error:', imageError);
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      post,
      shareUrl: `${process.env.NEXT_PUBLIC_APP_URL}/community/builds/${slug}`,
    });

  } catch (error) {
    console.error('[CommunityPosts API] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

