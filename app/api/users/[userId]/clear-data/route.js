/**
 * User Data Clearing API
 * 
 * POST /api/users/[userId]/clear-data
 * Allows users to selectively clear their data while keeping their account active.
 * 
 * Request body:
 * - scope: 'all' | 'favorites' | 'vehicles' | 'projects' | 'al_history'
 * 
 * Auth: User must be authenticated and can only clear their own data
 */

import { NextResponse } from 'next/server';
import { createAuthenticatedClient, getBearerToken } from '@/lib/supabaseServer';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request, { params }) {
  try {
    const { userId } = await params;
    
    console.log('[API/users/clear-data] POST request for userId:', userId);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Get authenticated user (support both cookie-based SSR sessions and Bearer token auth)
    const bearerToken = getBearerToken(request);
    const supabase = bearerToken ? createAuthenticatedClient(bearerToken) : createRouteHandlerClient({ cookies });

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
    
    // User can only clear their own data
    if (user.id !== userId) {
      return NextResponse.json(
        { error: 'Access denied. You can only clear your own data.' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { scope } = body;
    
    if (!scope) {
      return NextResponse.json(
        { error: 'Scope is required. Valid values: all, favorites, vehicles, projects, al_history' },
        { status: 400 }
      );
    }
    
    const validScopes = ['all', 'favorites', 'vehicles', 'projects', 'al_history'];
    if (!validScopes.includes(scope)) {
      return NextResponse.json(
        { error: `Invalid scope. Valid values: ${validScopes.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Track what was cleared
    const cleared = [];
    const errors = [];
    
    // Clear favorites
    if (scope === 'all' || scope === 'favorites') {
      const { error: favError } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', userId);
      
      if (favError) {
        console.error('[API/users/clear-data] Error clearing favorites:', favError);
        errors.push('favorites');
      } else {
        cleared.push('favorites');
        console.log('[API/users/clear-data] Cleared favorites for user:', userId);
      }
    }
    
    // Clear vehicles and related data
    if (scope === 'all' || scope === 'vehicles') {
      // Clear service logs first (FK constraint)
      const { error: serviceError } = await supabase
        .from('user_service_logs')
        .delete()
        .eq('user_id', userId);
      
      if (serviceError) {
        console.error('[API/users/clear-data] Error clearing service logs:', serviceError);
        errors.push('service_logs');
      }
      
      // Clear vehicles
      const { error: vehiclesError } = await supabase
        .from('user_vehicles')
        .delete()
        .eq('user_id', userId);
      
      if (vehiclesError) {
        console.error('[API/users/clear-data] Error clearing vehicles:', vehiclesError);
        errors.push('vehicles');
      } else {
        cleared.push('vehicles');
        console.log('[API/users/clear-data] Cleared vehicles for user:', userId);
      }
    }
    
    // Clear projects and related data
    if (scope === 'all' || scope === 'projects') {
      // Get user's projects
      const { data: projects, error: projectsFetchError } = await supabase
        .from('user_projects')
        .select('id')
        .eq('user_id', userId);
      
      if (projectsFetchError) {
        console.error('[API/users/clear-data] Error fetching projects:', projectsFetchError);
        errors.push('projects_fetch');
      } else if (projects && projects.length > 0) {
        const projectIds = projects.map(p => p.id);
        
        // Clear project parts first (FK constraint)
        const { error: partsError } = await supabase
          .from('user_project_parts')
          .delete()
          .in('project_id', projectIds);
        
        if (partsError) {
          console.error('[API/users/clear-data] Error clearing project parts:', partsError);
          errors.push('project_parts');
        }
        
        // Clear projects
        const { error: projectsError } = await supabase
          .from('user_projects')
          .delete()
          .eq('user_id', userId);
        
        if (projectsError) {
          console.error('[API/users/clear-data] Error clearing projects:', projectsError);
          errors.push('projects');
        } else {
          cleared.push('projects');
          console.log('[API/users/clear-data] Cleared projects for user:', userId);
        }
      } else {
        cleared.push('projects');
        console.log('[API/users/clear-data] No projects to clear for user:', userId);
      }
    }
    
    // Clear AL history
    if (scope === 'all' || scope === 'al_history') {
      // Get user's conversations
      const { data: convos, error: convosFetchError } = await supabase
        .from('al_conversations')
        .select('id')
        .eq('user_id', userId);
      
      if (convosFetchError) {
        console.error('[API/users/clear-data] Error fetching conversations:', convosFetchError);
        errors.push('conversations_fetch');
      } else if (convos && convos.length > 0) {
        const convoIds = convos.map(c => c.id);
        
        // Delete messages first (FK constraint)
        const { error: messagesError } = await supabase
          .from('al_messages')
          .delete()
          .in('conversation_id', convoIds);
        
        if (messagesError) {
          console.error('[API/users/clear-data] Error clearing messages:', messagesError);
          errors.push('al_messages');
        }
        
        // Delete conversations
        const { error: convosError } = await supabase
          .from('al_conversations')
          .delete()
          .eq('user_id', userId);
        
        if (convosError) {
          console.error('[API/users/clear-data] Error clearing conversations:', convosError);
          errors.push('al_conversations');
        } else {
          cleared.push('al_history');
          console.log('[API/users/clear-data] Cleared AL history for user:', userId);
        }
      } else {
        cleared.push('al_history');
        console.log('[API/users/clear-data] No AL history to clear for user:', userId);
      }
      
      // Reset credits to tier default (don't delete the record)
      const { error: creditsError } = await supabase
        .from('al_user_credits')
        .update({ 
          spent_cents_this_month: 0,
          input_tokens_this_month: 0,
          output_tokens_this_month: 0
        })
        .eq('user_id', userId);
      
      if (creditsError) {
        console.error('[API/users/clear-data] Error resetting credits:', creditsError);
        // Don't add to errors array - this is not critical
      }
    }
    
    // Return results
    if (errors.length > 0) {
      return NextResponse.json(
        { 
          success: false,
          cleared,
          errors,
          message: `Partially cleared. Some operations failed: ${errors.join(', ')}`
        },
        { status: 207 } // Multi-Status
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      cleared,
      scope,
      message: `Successfully cleared: ${cleared.join(', ')}`
    });
    
  } catch (err) {
    console.error('[API/users/clear-data] Unexpected error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: err.message },
      { status: 500 }
    );
  }
}











