/**
 * GDPR Data Export API (Right to Access)
 * 
 * Allows users to export all their personal data in JSON format.
 * This endpoint:
 * 1. Verifies the user is authenticated
 * 2. Fetches all user data from Supabase tables
 * 3. Returns a comprehensive JSON export
 * 
 * GET /api/user/export-data
 * 
 * @module app/api/user/export-data
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase/server';
import { withErrorLogging } from '@/lib/serverErrorLogger';

// Service role client for fetching all user data
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Tables to export user data from
 */
const EXPORT_CONFIG = [
  { table: 'profiles', select: '*', label: 'Profile' },
  { table: 'garage_vehicles', select: '*', label: 'Garage Vehicles' },
  { table: 'user_favorites', select: '*', label: 'Favorites' },
  { table: 'saved_builds', select: '*', label: 'Saved Builds' },
  { table: 'build_upgrades', select: '*', label: 'Build Upgrades' },
  { table: 'saved_events', select: '*', label: 'Saved Events' },
  { table: 'al_conversations', select: 'id, created_at, title, message_count', label: 'AL Conversations' },
  { table: 'al_messages', select: 'id, conversation_id, role, content, created_at', label: 'AL Messages' },
  { table: 'user_activity', select: 'event_type, event_data, created_at', label: 'Activity Log' },
  { table: 'weekly_engagement', select: '*', label: 'Engagement History' },
  { table: 'user_feedback', select: 'category, message, page_url, created_at', label: 'Feedback Submitted' },
];

/**
 * Fetch data from a table for a user
 * @param {string} table 
 * @param {string} select 
 * @param {string} userId 
 */
async function fetchTableData(table, select, userId) {
  try {
    const { data, error } = await supabaseAdmin
      .from(table)
      .select(select)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1000); // Reasonable limit

    if (error) {
      // Table may not exist or have different schema
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        return { data: null, skipped: 'table not found' };
      }
      if (error.message.includes('user_id')) {
        return { data: null, skipped: 'no user_id column' };
      }
      return { data: null, error: error.message };
    }

    return { data: data || [] };
  } catch (error) {
    return { data: null, error: error.message };
  }
}

/**
 * Sanitize sensitive data from export
 * @param {Object} data 
 */
function sanitizeExportData(data) {
  const sanitized = { ...data };
  
  // Remove sensitive fields that shouldn't be exported
  const sensitiveFields = [
    'stripe_customer_id',
    'stripe_subscription_id', 
    'ip_address',
    'user_agent',
  ];
  
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

/**
 * GET /api/user/export-data
 * 
 * Export all user data (GDPR Right to Access)
 * 
 * Requires authentication. User can only export their own data.
 * 
 * Response: JSON file download with all user data
 */
async function handleGet(request) {
  // Get authenticated user
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const userId = user.id;
  console.log(`[Export Data] Starting data export for user: ${userId.slice(0, 8)}...`);

  // Build export object
  const exportData = {
    exportInfo: {
      exportedAt: new Date().toISOString(),
      userId: userId,
      userEmail: user.email,
      format: 'json',
      version: '1.0',
    },
    authInfo: {
      email: user.email,
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at,
      provider: user.app_metadata?.provider,
      emailConfirmed: !!user.email_confirmed_at,
    },
    data: {},
    metadata: {
      tables: {},
    },
  };

  // Fetch data from each table
  for (const config of EXPORT_CONFIG) {
    const result = await fetchTableData(config.table, config.select, userId);
    
    if (result.data) {
      // Sanitize each record
      exportData.data[config.label] = result.data.map(record => 
        sanitizeExportData(record)
      );
      exportData.metadata.tables[config.table] = {
        recordCount: result.data.length,
        status: 'exported',
      };
    } else if (result.skipped) {
      exportData.metadata.tables[config.table] = {
        status: 'skipped',
        reason: result.skipped,
      };
    } else {
      exportData.metadata.tables[config.table] = {
        status: 'error',
        error: result.error,
      };
    }
  }

  // Calculate totals
  const totalRecords = Object.values(exportData.data)
    .reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
  
  exportData.metadata.totalRecords = totalRecords;
  exportData.metadata.tablesExported = Object.values(exportData.metadata.tables)
    .filter(t => t.status === 'exported').length;

  console.log(`[Export Data] Export complete: ${totalRecords} records from ${exportData.metadata.tablesExported} tables`);

  // Check for download format parameter
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'json';

  if (format === 'download') {
    // Return as file download
    const filename = `autorev-data-export-${new Date().toISOString().split('T')[0]}.json`;
    
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  }

  // Return as regular JSON response
  return NextResponse.json(exportData);
}

export const GET = withErrorLogging(handleGet, { 
  route: 'user/export-data', 
  feature: 'gdpr' 
});
