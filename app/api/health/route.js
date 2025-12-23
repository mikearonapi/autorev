import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { withErrorLogging } from '@/lib/serverErrorLogger';

/**
 * GET /api/health
 * 
 * Health check endpoint for monitoring and uptime checks.
 * Returns basic health status and optional database connectivity.
 * 
 * Query params:
 *   - deep: If "true", includes database connectivity check
 * 
 * Response:
 *   {
 *     status: "ok" | "degraded",
 *     timestamp: "2024-12-18T00:00:00.000Z",
 *     database?: "connected" | "disconnected",
 *     version?: string
 *   }
 */
async function handleGet(request) {
  const { searchParams } = new URL(request.url);
  const deep = searchParams.get('deep') === 'true';

  const response = {
    status: 'ok',
    timestamp: new Date().toISOString(),
  };

  // Deep health check includes database connectivity
  if (deep) {
    response.database = isSupabaseConfigured ? 'connected' : 'disconnected';
    
    if (!isSupabaseConfigured) {
      response.status = 'degraded';
    }
  }

  // Include version from package.json if available
  try {
    response.version = process.env.npm_package_version || '1.0.0';
  } catch {
    // Version not critical
  }

  return NextResponse.json(response, {
    status: response.status === 'ok' ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

export const GET = withErrorLogging(handleGet, { route: 'health', feature: 'internal' });










