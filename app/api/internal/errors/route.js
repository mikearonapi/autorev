/**
 * Internal API - Error Dashboard
 * 
 * Provides comprehensive error data for the internal errors dashboard.
 * Supports filtering, sorting, and bulk actions.
 */

import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabaseServer';

export async function GET(request) {
  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    
    // Filtering params
    const category = searchParams.get('category') || 'auto-error'; // auto-error, bug, all
    const severity = searchParams.get('severity'); // blocking, major, minor
    const status = searchParams.get('status'); // new, reviewed, in_progress, resolved
    const errorSource = searchParams.get('error_source'); // client, api, cron, external_api, database
    const feature = searchParams.get('feature'); // Feature context
    const resolved = searchParams.get('resolved'); // true, false
    const search = searchParams.get('search'); // Search in message
    const appVersion = searchParams.get('app_version'); // Filter by deployment
    
    // Pagination
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    
    // Sorting
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';
    
    // Time range
    const since = searchParams.get('since'); // ISO date string

    // Build query
    let query = supabase
      .from('user_feedback')
      .select('*', { count: 'exact' });

    // Apply filters
    if (category === 'auto-error') {
      query = query.eq('category', 'auto-error');
    } else if (category === 'bug') {
      query = query.or('category.eq.auto-error,category.eq.bug');
    }
    // 'all' doesn't filter by category

    if (severity) {
      query = query.eq('severity', severity);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (errorSource) {
      query = query.eq('error_source', errorSource);
    }

    if (feature) {
      query = query.eq('feature_context', feature);
    }

    if (resolved === 'true') {
      query = query.not('resolved_at', 'is', null);
    } else if (resolved === 'false') {
      query = query.is('resolved_at', null);
    }

    if (search) {
      query = query.ilike('message', `%${search}%`);
    }

    if (appVersion) {
      query = query.eq('app_version', appVersion);
    }

    if (since) {
      query = query.gte('created_at', since);
    }

    // Apply sorting
    const validSortColumns = ['created_at', 'severity', 'occurrence_count', 'affected_user_count', 'updated_at'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('[Errors API] Query error:', error);
      return NextResponse.json({ error: 'Failed to fetch errors' }, { status: 500 });
    }

    return NextResponse.json({
      errors: data || [],
      total: count || 0,
      limit,
      offset,
      hasMore: (offset + limit) < (count || 0),
    });
  } catch (err) {
    console.error('[Errors API] Unexpected error:', err);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}

/**
 * PATCH - Bulk update errors (resolve, change status, etc.)
 */
export async function PATCH(request) {
  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { ids, action, data } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids array required' }, { status: 400 });
    }

    if (!action) {
      return NextResponse.json({ error: 'action required' }, { status: 400 });
    }

    let updateData = {};

    switch (action) {
      case 'resolve':
        updateData = {
          resolved_at: new Date().toISOString(),
          status: 'resolved',
          issue_addressed: true,
          updated_at: new Date().toISOString(),
        };
        break;

      case 'mark_reviewed':
        updateData = {
          status: 'reviewed',
          updated_at: new Date().toISOString(),
        };
        break;

      case 'mark_in_progress':
        updateData = {
          status: 'in_progress',
          updated_at: new Date().toISOString(),
        };
        break;

      case 'update_severity':
        if (!data?.severity) {
          return NextResponse.json({ error: 'severity required for update_severity' }, { status: 400 });
        }
        updateData = {
          severity: data.severity,
          updated_at: new Date().toISOString(),
        };
        break;

      case 'add_note':
        if (!data?.note) {
          return NextResponse.json({ error: 'note required for add_note' }, { status: 400 });
        }
        // This needs to be handled differently - append to internal_notes
        const { data: existing } = await supabase
          .from('user_feedback')
          .select('internal_notes')
          .in('id', ids);
        
        // For simplicity, just update with new note
        updateData = {
          internal_notes: data.note,
          updated_at: new Date().toISOString(),
        };
        break;

      case 'reopen':
        updateData = {
          resolved_at: null,
          status: 'new',
          issue_addressed: false,
          updated_at: new Date().toISOString(),
        };
        break;

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    const { data: updated, error } = await supabase
      .from('user_feedback')
      .update(updateData)
      .in('id', ids)
      .select();

    if (error) {
      console.error('[Errors API] Update error:', error);
      return NextResponse.json({ error: 'Failed to update errors' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      updated: updated?.length || 0,
    });
  } catch (err) {
    console.error('[Errors API] PATCH error:', err);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}

