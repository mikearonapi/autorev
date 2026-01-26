import { NextResponse } from 'next/server';

import { 
  getUnresolvedErrors, 
  getRegressionErrors, 
  getErrorAnalysisReport,
  markErrorsFixed 
} from '@/lib/errorAnalysis';
import { withErrorLogging } from '@/lib/serverErrorLogger';

// Force dynamic - this uses query params
export const dynamic = 'force-dynamic';

/**
 * GET /api/internal/errors
 * 
 * Returns error analysis data.
 * Internal endpoint - should be protected in production.
 * 
 * Query params:
 *   - type: 'unresolved' | 'regressions' | 'report' (default: 'report')
 *   - severity: Filter by severity
 *   - feature: Filter by feature context
 *   - limit: Max results
 *   - days: Look back period in days (default 7)
 */
async function handleGet(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'report';
    const severity = searchParams.get('severity');
    const feature = searchParams.get('feature');
    const limit = parseInt(searchParams.get('limit'), 10) || 50;
    const days = parseInt(searchParams.get('days'), 10) || 7;

    let data;

    switch (type) {
      case 'unresolved':
        data = await getUnresolvedErrors({
          limit,
          daysBack: days,
          severity,
          featureContext: feature,
        });
        break;

      case 'regressions':
        data = await getRegressionErrors({ limit });
        break;

      case 'report':
      default:
        data = await getErrorAnalysisReport();
        break;
    }

    return NextResponse.json({
      success: true,
      type,
      data,
    });
  } catch (error) {
    console.error('[API/internal/errors] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch error data' },
      { status: 500 }
    );
  }
}

export const GET = withErrorLogging(handleGet, { route: 'internal/errors', feature: 'internal' });

/**
 * POST /api/internal/errors
 * 
 * Mark errors as fixed.
 * Internal endpoint - should be protected in production.
 * 
 * Body:
 *   - errorHashes: string[] - Error hashes to mark as fixed
 *   - version: string - Version where fix was applied
 *   - notes: string - Notes about the fix
 */
async function handlePost(request) {
  try {
    const body = await request.json();
    const { errorHashes, version, notes } = body;

    if (!errorHashes || !Array.isArray(errorHashes) || errorHashes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'errorHashes array required' },
        { status: 400 }
      );
    }

    const result = await markErrorsFixed(errorHashes, version, notes);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('[API/internal/errors] Error marking fixed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to mark errors as fixed' },
      { status: 500 }
    );
  }
}

export const POST = withErrorLogging(handlePost, { route: 'internal/errors', feature: 'internal' });
