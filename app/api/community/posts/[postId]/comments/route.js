/**
 * Community Post Comments API
 * 
 * GET /api/community/posts/[postId]/comments - List approved comments
 * POST /api/community/posts/[postId]/comments - Submit a new comment (AI moderated)
 * 
 * Comments are moderated by AI AL before being visible to others.
 * 
 * @route /api/community/posts/[postId]/comments
 */

import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

import { errors } from '@/lib/apiErrors';
import { moderateComment, getModerationGuidance } from '@/lib/commentModerationService';
import { trackActivity } from '@/lib/dashboardScoreService';
import { awardPoints } from '@/lib/pointsService';
import { withErrorLogging } from '@/lib/serverErrorLogger';
import { createAuthenticatedClient, createServerSupabaseClient, getBearerToken } from '@/lib/supabaseServer';

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
 * GET /api/community/posts/[postId]/comments
 * List all approved comments for a post
 */
async function handleGet(request, context) {
  const { postId } = await context.params;
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
  const offset = parseInt(searchParams.get('offset') || '0');
  
  // Get the current user (if logged in) to include their pending comments
  const user = await getAuthenticatedUser(request);

  // Fetch approved comments
  let query = supabaseAdmin
    .from('community_post_comments')
    .select(`
      id,
      content,
      user_id,
      parent_comment_id,
      moderation_status,
      like_count,
      created_at
    `)
    .eq('post_id', postId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1);

  // If user is logged in, also include their pending comments
  if (user) {
    query = query.or(`moderation_status.eq.approved,and(user_id.eq.${user.id},moderation_status.eq.pending)`);
  } else {
    query = query.eq('moderation_status', 'approved');
  }

  const { data: comments, error } = await query;

  if (error) {
    console.error('[Comments API] Fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }

  // Get user info for comments
  // Note: user_profiles uses 'id' as the primary key (same as auth.users.id)
  const userIds = [...new Set(comments?.map(c => c.user_id) || [])];
  
  const usersMap = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabaseAdmin
      .from('user_profiles')
      .select('id, display_name, avatar_url')
      .in('id', userIds);
    
    profiles?.forEach(p => {
      usersMap[p.id] = {
        displayName: p.display_name || 'Anonymous',
        avatarUrl: p.avatar_url,
      };
    });
  }

  // Enrich comments with user info
  const enrichedComments = (comments || []).map(comment => ({
    ...comment,
    user: usersMap[comment.user_id] || { displayName: 'Anonymous', avatarUrl: null },
    isPending: comment.moderation_status === 'pending',
    isOwn: user?.id === comment.user_id,
  }));

  // Get total count
  const { count } = await supabaseAdmin
    .from('community_post_comments')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId)
    .eq('moderation_status', 'approved')
    .is('deleted_at', null);

  // Get moderation guidance for the UI
  const guidance = getModerationGuidance();

  return NextResponse.json({
    comments: enrichedComments,
    total: count || 0,
    hasMore: (comments?.length || 0) === limit,
    guidance,
  });
}

/**
 * POST /api/community/posts/[postId]/comments
 * Submit a new comment (will be AI moderated)
 */
async function handlePost(request, context) {
  const { postId } = await context.params;
  
  // Verify authentication
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return errors.unauthorized('Please sign in to comment');
  }

  // Parse request body
  const body = await request.json();
  const { content, parentCommentId } = body;

  // Validate content
  if (!content || typeof content !== 'string') {
    return errors.missingField('content');
  }

  const trimmedContent = content.trim();
  if (trimmedContent.length < 1) {
    return errors.badRequest('Comment cannot be empty');
  }

  if (trimmedContent.length > 1000) {
    return NextResponse.json({ error: 'Comment is too long (max 1000 characters)' }, { status: 400 });
  }

  // Verify post exists
  const { data: post, error: postError } = await supabaseAdmin
    .from('community_posts')
    .select('id, title, car_name')
    .eq('id', postId)
    .single();

  if (postError || !post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  // Verify parent comment exists if replying
  if (parentCommentId) {
    const { data: parentComment } = await supabaseAdmin
      .from('community_post_comments')
      .select('id')
      .eq('id', parentCommentId)
      .eq('post_id', postId)
      .eq('moderation_status', 'approved')
      .is('deleted_at', null)
      .single();

    if (!parentComment) {
      return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 });
    }
  }

  // Rate limiting: check if user has too many pending comments
  const { count: pendingCount } = await supabaseAdmin
    .from('community_post_comments')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('moderation_status', 'pending')
    .gte('created_at', new Date(Date.now() - 60000).toISOString()); // Last minute

  if (pendingCount && pendingCount >= 3) {
    return NextResponse.json({ 
      error: 'Please wait a moment before submitting more comments',
      rateLimited: true,
    }, { status: 429 });
  }

  // AI Moderation
  const moderationResult = await moderateComment(trimmedContent, {
    postTitle: post.title,
    carName: post.car_name,
  });

  // Insert the comment
  const { data: comment, error: insertError } = await supabaseAdmin
    .from('community_post_comments')
    .insert({
      post_id: postId,
      user_id: user.id,
      parent_comment_id: parentCommentId || null,
      content: trimmedContent,
      moderation_status: moderationResult.status,
      moderation_reason: moderationResult.reason,
      moderation_score: moderationResult.score,
      moderated_at: new Date().toISOString(),
      moderated_by: 'ai',
    })
    .select()
    .single();

  if (insertError) {
    console.error('[Comments API] Insert error:', insertError);
    return NextResponse.json({ error: 'Failed to submit comment' }, { status: 500 });
  }

  // Prepare response based on moderation result
  if (moderationResult.approved) {
    // Track community activity for dashboard engagement (non-blocking)
    trackActivity(user.id, 'community_comments').catch(() => {});
    // Award points for commenting (non-blocking)
    awardPoints(user.id, 'community_comment', { postId, commentId: comment.id }).catch(() => {});
    
    // Get user profile for response (user_profiles uses 'id' as primary key)
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('display_name, avatar_url')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      success: true,
      comment: {
        id: comment.id,
        content: comment.content,
        user: {
          displayName: profile?.display_name || 'You',
          avatarUrl: profile?.avatar_url,
        },
        created_at: comment.created_at,
        isPending: comment.moderation_status === 'pending',
        isOwn: true,
        like_count: 0,
      },
      message: moderationResult.status === 'approved' 
        ? 'Comment posted!' 
        : 'Comment submitted for review',
    });
  } else {
    // Comment was rejected
    return NextResponse.json({
      success: false,
      rejected: true,
      reason: moderationResult.reason || 'Comment did not meet community standards',
      guidance: getModerationGuidance(),
    }, { status: 422 });
  }
}

/**
 * PATCH /api/community/posts/[postId]/comments
 * Edit own comment (only pending comments can be edited)
 */
async function handlePatch(request, context) {
  const { postId } = await context.params;
  
  // Verify authentication
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return errors.unauthorized();
  }

  const body = await request.json();
  const { commentId, content } = body;

  if (!commentId) {
    return errors.missingField('commentId');
  }

  if (!content || typeof content !== 'string') {
    return errors.missingField('content');
  }

  const trimmedContent = content.trim();
  if (trimmedContent.length < 1 || trimmedContent.length > 1000) {
    return errors.badRequest('Invalid comment length');
  }

  // Verify comment exists and belongs to user
  const { data: existingComment, error: findError } = await supabaseAdmin
    .from('community_post_comments')
    .select('id, moderation_status, content')
    .eq('id', commentId)
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single();

  if (findError || !existingComment) {
    return NextResponse.json({ error: 'Comment not found or not authorized' }, { status: 404 });
  }

  // Only allow editing if content actually changed
  if (existingComment.content === trimmedContent) {
    return NextResponse.json({ success: true, message: 'No changes made' });
  }

  // Re-moderate the edited comment
  const moderationResult = await moderateComment(trimmedContent, {});

  // Update the comment
  const { data: updatedComment, error: updateError } = await supabaseAdmin
    .from('community_post_comments')
    .update({
      content: trimmedContent,
      moderation_status: moderationResult.status,
      moderation_reason: moderationResult.reason,
      moderation_score: moderationResult.score,
      moderated_at: new Date().toISOString(),
      moderated_by: 'ai',
      updated_at: new Date().toISOString(),
    })
    .eq('id', commentId)
    .select()
    .single();

  if (updateError) {
    console.error('[Comments API] Update error:', updateError);
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
  }

  if (moderationResult.approved) {
    return NextResponse.json({
      success: true,
      comment: {
        ...updatedComment,
        isPending: updatedComment.moderation_status === 'pending',
        isOwn: true,
      },
      message: 'Comment updated!',
    });
  } else {
    return NextResponse.json({
      success: false,
      rejected: true,
      reason: moderationResult.reason || 'Edited comment did not meet community standards',
    }, { status: 422 });
  }
}

/**
 * DELETE /api/community/posts/[postId]/comments
 * Soft-delete own comment
 */
async function handleDelete(request, context) {
  const { postId } = await context.params;
  
  // Verify authentication
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return errors.unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const commentId = searchParams.get('commentId');

  if (!commentId) {
    return errors.missingField('commentId');
  }

  // Verify comment exists and belongs to user
  const { data: existingComment, error: findError } = await supabaseAdmin
    .from('community_post_comments')
    .select('id, moderation_status')
    .eq('id', commentId)
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single();

  if (findError || !existingComment) {
    return errors.notFound('Comment');
  }

  // Soft delete the comment
  const { error: deleteError } = await supabaseAdmin
    .from('community_post_comments')
    .update({ 
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', commentId);

  if (deleteError) {
    console.error('[Comments API] Delete error:', deleteError);
    return errors.database('Failed to delete comment');
  }

  return NextResponse.json({
    success: true,
    message: 'Comment deleted',
  });
}

// Export wrapped handlers with error logging
export const GET = withErrorLogging(handleGet, { route: 'community/posts/[postId]/comments', feature: 'community-comments' });
export const POST = withErrorLogging(handlePost, { route: 'community/posts/[postId]/comments', feature: 'community-comments' });
export const PATCH = withErrorLogging(handlePatch, { route: 'community/posts/[postId]/comments', feature: 'community-comments' });
export const DELETE = withErrorLogging(handleDelete, { route: 'community/posts/[postId]/comments', feature: 'community-comments' });
