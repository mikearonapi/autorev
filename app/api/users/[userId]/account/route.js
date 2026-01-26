/**
 * Account Deletion API
 * 
 * DELETE /api/users/[userId]/account
 * 
 * Handles complete account deletion with feedback collection.
 * - Stores deletion feedback in user_feedback table
 * - Deletes all user data from related tables
 * - Deletes the auth user via service role client
 * 
 * Request body:
 * - reason: string (required) - Primary reason for leaving
 * - details: string (optional) - Additional feedback
 * - confirmText: string (required) - Must be "DELETE" to confirm
 * 
 * Auth: User must be authenticated and can only delete their own account
 */

import { NextResponse } from 'next/server';

import { withErrorLogging } from '@/lib/serverErrorLogger';
import { createAuthenticatedClient, createServerSupabaseClient, getBearerToken, getServiceClient } from '@/lib/supabaseServer';

// Deletion reasons for categorization
const VALID_REASONS = [
  'not_using',           // Not using the app enough
  'missing_features',    // Missing features I need
  'too_expensive',       // Too expensive
  'found_alternative',   // Found a better alternative
  'privacy_concerns',    // Privacy concerns
  'technical_issues',    // Too many bugs/technical issues
  'other'               // Other reason
];

async function handleDelete(request, { params }) {
  const { userId } = await params;
  
  console.log('[API/users/account] DELETE request for userId:', userId);
  
  if (!userId) {
    return NextResponse.json(
      { error: 'User ID is required' },
      { status: 400 }
    );
  }
  
  // Get authenticated user
  const bearerToken = getBearerToken(request);
  const supabase = bearerToken ? createAuthenticatedClient(bearerToken) : await createServerSupabaseClient();

  if (!supabase) {
    return NextResponse.json(
      { error: 'Authentication service not configured' },
      { status: 503 }
    );
  }

  const { data: { user }, error: authError } = bearerToken
    ? await supabase.auth.getUser(bearerToken)
    : await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
  
  // User can only delete their own account
  if (user.id !== userId) {
    return NextResponse.json(
      { error: 'Access denied. You can only delete your own account.' },
      { status: 403 }
    );
  }
  
  // Parse request body
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
  
  const { reason, details, confirmText } = body;
  
  // Validate confirmation
  if (confirmText !== 'DELETE') {
    return NextResponse.json(
      { error: 'Please type DELETE to confirm account deletion' },
      { status: 400 }
    );
  }
  
  // Validate reason
  if (!reason || !VALID_REASONS.includes(reason)) {
    return NextResponse.json(
      { error: `Invalid reason. Valid reasons: ${VALID_REASONS.join(', ')}` },
      { status: 400 }
    );
  }
  
  // Get service client for admin operations
  const serviceClient = getServiceClient();
  if (!serviceClient) {
    return NextResponse.json(
      { error: 'Service configuration error' },
      { status: 503 }
    );
  }
  
  // Get user profile before deletion for feedback context
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('subscription_tier, display_name, created_at')
    .eq('id', userId)
    .single();
  
  const userEmail = user.email;
  const userTier = profile?.subscription_tier || 'free';
  const memberSince = profile?.created_at || user.created_at;
  
  // STEP 1: Store deletion feedback
  const reasonLabels = {
    'not_using': 'Not using the app enough',
    'missing_features': 'Missing features I need',
    'too_expensive': 'Too expensive',
    'found_alternative': 'Found a better alternative',
    'privacy_concerns': 'Privacy concerns',
    'technical_issues': 'Too many bugs/technical issues',
    'other': 'Other reason'
  };
  
  const feedbackMessage = `Account Deletion - Reason: ${reasonLabels[reason]}${details ? `\n\nAdditional feedback: ${details}` : ''}`;
  
  const { error: feedbackError } = await serviceClient
    .from('user_feedback')
    .insert({
      user_id: userId,
      email: userEmail,
      feedback_type: 'account_deletion',
      category: 'account',
      message: feedbackMessage,
      user_tier: userTier,
      tags: ['account_deletion', reason],
      browser_info: {
        reason_code: reason,
        reason_label: reasonLabels[reason],
        details: details || null,
        member_since: memberSince,
        deleted_at: new Date().toISOString()
      }
    });
  
  if (feedbackError) {
    console.error('[API/users/account] Error storing feedback:', feedbackError);
    // Continue with deletion even if feedback fails - user wants to leave
  } else {
    console.log('[API/users/account] Stored deletion feedback for user:', userId);
  }
  
  // STEP 2: Delete all user data (comprehensive cleanup)
  const deletionErrors = [];
  
  // Delete user favorites
  const { error: favError } = await serviceClient
    .from('user_favorites')
    .delete()
    .eq('user_id', userId);
  if (favError) {
    console.error('[API/users/account] Error deleting favorites:', favError);
    deletionErrors.push('favorites');
  }
  
  // Delete service logs
  const { error: serviceLogsError } = await serviceClient
    .from('user_service_logs')
    .delete()
    .eq('user_id', userId);
  if (serviceLogsError) {
    console.error('[API/users/account] Error deleting service logs:', serviceLogsError);
    deletionErrors.push('service_logs');
  }
  
  // Delete user vehicles
  const { error: vehiclesError } = await serviceClient
    .from('user_vehicles')
    .delete()
    .eq('user_id', userId);
  if (vehiclesError) {
    console.error('[API/users/account] Error deleting vehicles:', vehiclesError);
    deletionErrors.push('vehicles');
  }
  
  // Delete project parts first (FK constraint)
  const { data: projects } = await serviceClient
    .from('user_projects')
    .select('id')
    .eq('user_id', userId);
  
  if (projects && projects.length > 0) {
    const projectIds = projects.map(p => p.id);
    
    const { error: partsError } = await serviceClient
      .from('user_project_parts')
      .delete()
      .in('project_id', projectIds);
    if (partsError) {
      console.error('[API/users/account] Error deleting project parts:', partsError);
      deletionErrors.push('project_parts');
    }
  }
  
  // Delete user projects
  const { error: projectsError } = await serviceClient
    .from('user_projects')
    .delete()
    .eq('user_id', userId);
  if (projectsError) {
    console.error('[API/users/account] Error deleting projects:', projectsError);
    deletionErrors.push('projects');
  }
  
  // Delete AL messages first (FK constraint)
  const { data: conversations } = await serviceClient
    .from('al_conversations')
    .select('id')
    .eq('user_id', userId);
  
  if (conversations && conversations.length > 0) {
    const convoIds = conversations.map(c => c.id);
    
    const { error: messagesError } = await serviceClient
      .from('al_messages')
      .delete()
      .in('conversation_id', convoIds);
    if (messagesError) {
      console.error('[API/users/account] Error deleting AL messages:', messagesError);
      deletionErrors.push('al_messages');
    }
  }
  
  // Delete AL conversations
  const { error: convosError } = await serviceClient
    .from('al_conversations')
    .delete()
    .eq('user_id', userId);
  if (convosError) {
    console.error('[API/users/account] Error deleting AL conversations:', convosError);
    deletionErrors.push('al_conversations');
  }
  
  // Delete AL credits
  const { error: creditsError } = await serviceClient
    .from('al_user_credits')
    .delete()
    .eq('user_id', userId);
  if (creditsError) {
    console.error('[API/users/account] Error deleting AL credits:', creditsError);
    deletionErrors.push('al_credits');
  }
  
  // Delete saved events
  const { error: eventsError } = await serviceClient
    .from('user_saved_events')
    .delete()
    .eq('user_id', userId);
  if (eventsError) {
    console.error('[API/users/account] Error deleting saved events:', eventsError);
    deletionErrors.push('saved_events');
  }
  
  // Delete community posts
  const { error: postsError } = await serviceClient
    .from('community_posts')
    .delete()
    .eq('user_id', userId);
  if (postsError) {
    console.error('[API/users/account] Error deleting community posts:', postsError);
    deletionErrors.push('community_posts');
  }
  
  // Delete user profile
  const { error: profileError } = await serviceClient
    .from('user_profiles')
    .delete()
    .eq('id', userId);
  if (profileError) {
    console.error('[API/users/account] Error deleting profile:', profileError);
    deletionErrors.push('profile');
  }
  
  // STEP 3: Delete the auth user
  const { error: authDeleteError } = await serviceClient.auth.admin.deleteUser(userId);
  
  if (authDeleteError) {
    console.error('[API/users/account] Error deleting auth user:', authDeleteError);
    return NextResponse.json(
      { 
        error: 'Failed to delete account. Please contact support.',
        details: authDeleteError.message 
      },
      { status: 500 }
    );
  }
  
  console.log('[API/users/account] Successfully deleted account for user:', userId);
  
  // Return success (even if some data cleanup had errors - auth user is deleted)
  return NextResponse.json({ 
    success: true,
    message: 'Account deleted successfully',
    ...(deletionErrors.length > 0 && { 
      warnings: `Some data cleanup had issues: ${deletionErrors.join(', ')}` 
    })
  });
}

export const DELETE = withErrorLogging(handleDelete, { route: 'users/account', feature: 'account' });
