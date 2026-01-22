/**
 * Community Posts API
 * 
 * GET /api/community/posts - List posts
 * POST /api/community/posts - Create a new post
 * PATCH /api/community/posts - Update a post (publish/unpublish)
 * 
 * All mutations invalidate the community page cache for immediate updates.
 * 
 * @route /api/community/posts
 */

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { createAuthenticatedClient, createServerSupabaseClient, getBearerToken } from '@/lib/supabaseServer';
import { withErrorLogging } from '@/lib/serverErrorLogger';
import { resolveCarId } from '@/lib/carResolver';
import { errors } from '@/lib/apiErrors';
import { trackActivity } from '@/lib/dashboardScoreService';
import { awardPoints } from '@/lib/pointsService';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Get authenticated user from request (supports both cookie and Bearer token)
 */
async function getAuthenticatedUser(request) {
  const bearerToken = getBearerToken(request);
  const supabase = bearerToken 
    ? createAuthenticatedClient(bearerToken) 
    : await createServerSupabaseClient();

  if (!supabase) return null;

  const { data: { user } } = bearerToken
    ? await supabase.auth.getUser(bearerToken)
    : await supabase.auth.getUser();
  return user;
}

/**
 * GET /api/community/posts
 * List community posts with optional filters
 */
async function handleGet(request) {
    const { searchParams } = new URL(request.url);
    const postType = searchParams.get('type');
    const carSlug = searchParams.get('car');
    const buildId = searchParams.get('buildId'); // Check for linked post by build ID
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const featured = searchParams.get('featured') === 'true';

    // If buildId provided, fetch the linked post for that build
    if (buildId) {
      const { data, error } = await supabaseAdmin
        .from('community_posts')
        .select('id, slug, title, is_published')
        .eq('user_build_id', buildId)
        .maybeSingle();
      
      if (error) {
        console.error('[CommunityPosts API] Build lookup error:', error);
        return errors.database('Failed to fetch linked post');
      }
      
      return NextResponse.json({ post: data });
    }

    const { data, error } = await supabaseAdmin.rpc('get_community_posts', {
      p_post_type: postType || null,
      p_car_slug: carSlug || null,
      p_limit: Math.min(limit, 50), // Cap at 50
      p_offset: offset,
    });

    if (error) {
      console.error('[CommunityPosts API] Error:', error);
      return errors.database('Failed to fetch posts');
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
}

/**
 * POST /api/community/posts
 * Create a new community post
 */
async function handlePost(request) {
    // Verify authentication
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return errors.unauthorized();
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
      return errors.badRequest('Missing required fields: postType and title are required');
    }

    if (!['garage', 'build', 'vehicle'].includes(postType)) {
      return errors.invalidInput('Invalid postType. Must be: garage, build, or vehicle', { field: 'postType' });
    }

    // Generate slug
    const { data: slugResult, error: slugError } = await supabaseAdmin.rpc('generate_community_post_slug', {
      p_title: title,
      p_user_id: user.id,
    });

    if (slugError) {
      console.error('[CommunityPosts API] Slug error:', slugError);
      return errors.database('Failed to generate slug');
    }

    const slug = slugResult || `post-${Date.now()}`;

    // Resolve car_id from slug if provided (car_slug column no longer exists on community_posts)
    const carId = carSlug ? await resolveCarId(carSlug) : null;
    
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
        car_id: carId,
        car_name: carName || null,
        slug,
        is_published: true,
        published_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (postError) {
      console.error('[CommunityPosts API] Create error:', postError);
      return errors.database('Failed to create post');
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

    // Invalidate cache so new post appears immediately on community pages
    try {
      revalidatePath('/community/builds');
      revalidatePath('/community');
      // Also revalidate brand-specific page if we have a car slug
      if (carSlug) {
        const brand = carSlug.split('-')[0]; // Extract brand from slug (e.g., "acura" from "acura-integra-type-r")
        revalidatePath(`/community/builds?brand=${brand}`);
      }
      console.log('[CommunityPosts API] Cache revalidated for community pages');
    } catch (revalidateError) {
      // Don't fail the request if revalidation fails
      console.warn('[CommunityPosts API] Cache revalidation warning:', revalidateError);
    }
    
    // Track community activity for dashboard engagement (non-blocking)
    trackActivity(user.id, 'community_posts').catch(() => {});
    // Award points for sharing build (non-blocking)
    awardPoints(user.id, 'community_share_build', { postId: post.id, postType }).catch(() => {});

    return NextResponse.json({
      success: true,
      post,
      shareUrl: `${process.env.NEXT_PUBLIC_APP_URL}/community/builds/${slug}`,
    });
}

/**
 * PATCH /api/community/posts
 * Update a community post (publish/unpublish)
 */
async function handlePatch(request) {
    // Verify authentication
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return errors.unauthorized();
    }

    const body = await request.json();
    const { postId, isPublished, title, description } = body;

    if (!postId) {
      return errors.missingField('postId');
    }

    // Build update object
    const updates = {};
    if (typeof isPublished === 'boolean') {
      updates.is_published = isPublished;
      updates.is_approved = isPublished; // Sync approval with publish status
    }
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;

    // Update post (only if user owns it)
    const { data: post, error: updateError } = await supabaseAdmin
      .from('community_posts')
      .update(updates)
      .eq('id', postId)
      .eq('user_id', user.id) // Ensure user owns the post
      .select()
      .single();

    if (updateError) {
      console.error('[CommunityPosts API] Update error:', updateError);
      return errors.database('Failed to update post');
    }

    if (!post) {
      return errors.notFound('Post');
    }

    // Invalidate cache so changes appear immediately
    try {
      revalidatePath('/community/builds');
      revalidatePath('/community');
      // Also revalidate the specific post page
      revalidatePath(`/community/builds/${post.slug}`);
      console.log('[CommunityPosts API] Cache revalidated for post update');
    } catch (revalidateError) {
      console.warn('[CommunityPosts API] Cache revalidation warning:', revalidateError);
    }

    return NextResponse.json({
      success: true,
      post,
    });
}

// Export wrapped handlers with error logging
export const GET = withErrorLogging(handleGet, { route: 'community/posts', feature: 'community-builds' });
export const POST = withErrorLogging(handlePost, { route: 'community/posts', feature: 'community-builds' });
export const PATCH = withErrorLogging(handlePatch, { route: 'community/posts', feature: 'community-builds' });

