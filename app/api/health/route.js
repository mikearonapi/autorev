import { NextResponse } from 'next/server';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { withErrorLogging } from '@/lib/serverErrorLogger';

// Force dynamic rendering - this route uses request.url
export const dynamic = 'force-dynamic';

/**
 * GET /api/health
 * 
 * Health check endpoint for monitoring and uptime checks.
 * Returns basic health status and optional database connectivity.
 * 
 * Query params:
 *   - deep: If "true", includes actual database connectivity check
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

  // Deep health check includes actual database connectivity test
  if (deep) {
    if (!isSupabaseConfigured || !supabase) {
      response.database = 'disconnected';
      response.status = 'degraded';
    } else {
      // Actually test database connectivity with a simple query
      try {
        const start = Date.now();
        const { error } = await supabase.from('cars').select('id').limit(1);
        const latency = Date.now() - start;
        
        if (error) {
          response.database = 'disconnected';
          response.status = 'degraded';
          response.error = error.message;
        } else {
          response.database = 'connected';
          response.latency_ms = latency;
        }
      } catch (err) {
        response.database = 'disconnected';
        response.status = 'degraded';
        response.error = err.message;
      }
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










