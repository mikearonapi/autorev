/**
 * Community Post Like API
 * 
 * POST /api/community/posts/[postId]/like - Toggle like (add if not liked, remove if liked)
 * GET /api/community/posts/[postId]/like - Check if current user has liked the post
 * 
 * @route /api/community/posts/[postId]/like
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { withErrorLogging } from '@/lib/serverErrorLogger';

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
 * GET /api/community/posts/[postId]/like
 * Check if the current user has liked a post
 */
async function handleGet(request, context) {
  const { postId } = await context.params;
  
  const user = await getAuthenticatedUser();
  
  // Get the post's current like count
  const { data: post, error: postError } = await supabaseAdmin
    .from('community_posts')
    .select('like_count')
    .eq('id', postId)
    .single();

  if (postError) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  // If user is not logged in, just return the count
  if (!user) {
    return NextResponse.json({
      liked: false,
      likeCount: post.like_count || 0,
    });
  }

  // Check if user has liked
  const { data: like } = await supabaseAdmin
    .from('community_post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .single();

  return NextResponse.json({
    liked: !!like,
    likeCount: post.like_count || 0,
  });
}

/**
 * POST /api/community/posts/[postId]/like
 * Toggle like on a post (add if not liked, remove if liked)
 */
async function handlePost(request, context) {
  const { postId } = await context.params;
  
  // Verify authentication
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized. Please sign in to like posts.' }, { status: 401 });
  }

  // Verify post exists
  const { data: post, error: postError } = await supabaseAdmin
    .from('community_posts')
    .select('id, like_count')
    .eq('id', postId)
    .single();

  if (postError || !post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  // Check if already liked
  const { data: existingLike } = await supabaseAdmin
    .from('community_post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .single();

  let liked;
  let newLikeCount;

  if (existingLike) {
    // Unlike - remove the like
    const { error: deleteError } = await supabaseAdmin
      .from('community_post_likes')
      .delete()
      .eq('id', existingLike.id);

    if (deleteError) {
      console.error('[Like API] Delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to unlike post' }, { status: 500 });
    }

    liked = false;
    newLikeCount = Math.max((post.like_count || 0) - 1, 0);
  } else {
    // Like - add the like
    const { error: insertError } = await supabaseAdmin
      .from('community_post_likes')
      .insert({
        post_id: postId,
        user_id: user.id,
      });

    if (insertError) {
      // Check for unique constraint violation (already liked in a race condition)
      if (insertError.code === '23505') {
        return NextResponse.json({
          liked: true,
          likeCount: post.like_count || 0,
        });
      }
      console.error('[Like API] Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to like post' }, { status: 500 });
    }

    liked = true;
    newLikeCount = (post.like_count || 0) + 1;
  }

  return NextResponse.json({
    liked,
    likeCount: newLikeCount,
    message: liked ? 'Post liked!' : 'Post unliked',
  });
}

// Export wrapped handlers with error logging
export const GET = withErrorLogging(handleGet, { route: 'community/posts/[postId]/like', feature: 'community-likes' });
export const POST = withErrorLogging(handlePost, { route: 'community/posts/[postId]/like', feature: 'community-likes' });
