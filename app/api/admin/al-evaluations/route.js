/**
 * Admin AL Evaluations API
 * 
 * Endpoints for managing AL evaluation runs.
 * 
 * GET - List recent evaluation runs or get specific run results
 * POST - Trigger a new evaluation run
 * 
 * @route /api/admin/al-evaluations
 */

import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabaseServer';
import { withErrorLogging } from '@/lib/serverErrorLogger';
import { 
  ALEvaluationRunner, 
  runSpotCheck, 
  runFullEvaluation,
  getRecentRuns,
  getRunResults,
  getFailedResults,
} from '@/lib/alEvaluationRunner';
import { getEvalDatasetStats } from '@/lib/alEvaluations';
import { requireAdmin } from '@/lib/adminAccess';

/**
 * GET /api/admin/al-evaluations
 * 
 * Query params:
 * - runId: Get specific run and its results
 * - failed: If true, only return failed results for a run
 * - limit: Number of runs to return (default 10)
 * - stats: If true, return dataset stats
 */
async function handleGet(request) {
  // Check admin access
  const denied = await requireAdmin(request);
  if (denied) return denied;
  
  const { searchParams } = new URL(request.url);
  const runId = searchParams.get('runId');
  const failed = searchParams.get('failed') === 'true';
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const showStats = searchParams.get('stats') === 'true';
  
  // Return dataset stats
  if (showStats) {
    return NextResponse.json({
      stats: getEvalDatasetStats(),
    });
  }
  
  // Get specific run results
  if (runId) {
    const results = failed 
      ? await getFailedResults(runId)
      : await getRunResults(runId);
    
    // Also get run metadata
    const RUN_COLS = 'id, prompt_version_id, test_set_name, total_cases, passed_cases, failed_cases, avg_quality_score, avg_response_time_ms, started_at, completed_at, status, metadata, created_at';
    
    const supabase = getServiceClient();
    const { data: run } = await supabase
      .from('al_evaluation_runs')
      .select(RUN_COLS)
      .eq('id', runId)
      .single();
    
    return NextResponse.json({
      run,
      results,
      failedOnly: failed,
    });
  }
  
  // Get recent runs
  const runs = await getRecentRuns(limit);
  
  return NextResponse.json({
    runs,
    datasetStats: getEvalDatasetStats(),
  });
}

/**
 * POST /api/admin/al-evaluations
 * 
 * Trigger a new evaluation run
 * 
 * Body:
 * - type: 'spot' | 'full' (default: 'spot')
 * - count: Number of cases for spot check (default: 5)
 * - category: Filter cases by category
 * - difficulty: Filter cases by difficulty
 * - promptVersionId: Which prompt version to test
 */
async function handlePost(request) {
  // Check admin access
  const denied = await requireAdmin(request);
  if (denied) return denied;
  
  const body = await request.json();
  const {
    type = 'spot',
    count = 5,
    category,
    difficulty,
    promptVersionId,
    name,
  } = body;
  
  // Get user ID for tracking who triggered the run
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.slice(7);
  const supabase = getServiceClient();
  const { data: { user } } = await supabase.auth.getUser(token);
  
  try {
    let result;
    
    if (type === 'full') {
      // Full evaluation - run all cases
      // This is expensive, so we return immediately and let it run async
      result = await runFullEvaluation({
        name: name || 'Full Evaluation (Admin)',
        promptVersionId,
        triggeredBy: 'manual',
        createdBy: user?.id,
      });
    } else {
      // Spot check - run a subset
      result = await runSpotCheck(count, {
        category,
        difficulty,
      });
    }
    
    return NextResponse.json({
      success: true,
      runId: result.runId,
      stats: result.stats,
      message: `Evaluation completed: ${result.stats.passed}/${result.stats.passed + result.stats.failed} passed`,
    });
  } catch (error) {
    console.error('[AL Evaluations] Error running evaluation:', error);
    return NextResponse.json({
      error: 'Failed to run evaluation',
    }, { status: 500 });
  }
}

export const GET = withErrorLogging(handleGet, { route: 'admin/al-evaluations', feature: 'admin' });
export const POST = withErrorLogging(handlePost, { route: 'admin/al-evaluations', feature: 'admin' });
