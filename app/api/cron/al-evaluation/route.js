/**
 * AL Evaluation Cron Job
 * 
 * Scheduled evaluation of AL responses to track quality over time.
 * 
 * Schedule: Weekly (Sunday at 3:00 AM UTC)
 * 
 * @route GET /api/cron/al-evaluation
 */

import { NextResponse } from 'next/server';
import { withErrorLogging } from '@/lib/serverErrorLogger';
import { 
  runSpotCheck, 
  runFullEvaluation, 
  getRecentRuns,
} from '@/lib/alEvaluationRunner';
import { getEvalDatasetStats } from '@/lib/alEvaluations';
import { notifyDiscord } from '@/lib/discord';

// Cron secret for authentication
const CRON_SECRET = process.env.CRON_SECRET;

// Environment flag to control evaluation type
const EVAL_TYPE = process.env.AL_EVAL_TYPE || 'spot'; // 'spot' or 'full'
const EVAL_SPOT_COUNT = parseInt(process.env.AL_EVAL_SPOT_COUNT || '10', 10);

/**
 * Verify cron request is from Vercel
 */
function verifyCronRequest(request) {
  // Check for Vercel cron header
  const cronHeader = request.headers.get('x-vercel-cron');
  if (cronHeader) {
    return true;
  }
  
  // Check for manual trigger with secret
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  if (secret && secret === CRON_SECRET) {
    return true;
  }
  
  return false;
}

/**
 * Format evaluation results for Discord notification
 */
function formatResultsForDiscord(result, type) {
  const { stats, runId } = result;
  const passRate = stats.passed + stats.failed > 0
    ? Math.round((stats.passed / (stats.passed + stats.failed)) * 100)
    : 0;
  
  const statusEmoji = passRate >= 85 ? '✅' : passRate >= 70 ? '⚠️' : '❌';
  
  return {
    title: `${statusEmoji} AL Evaluation Report`,
    description: `${type === 'full' ? 'Full' : 'Spot Check'} evaluation completed`,
    fields: [
      {
        name: 'Pass Rate',
        value: `${passRate}%`,
        inline: true,
      },
      {
        name: 'Passed/Failed',
        value: `${stats.passed}/${stats.failed}`,
        inline: true,
      },
      {
        name: 'Avg Score',
        value: `${stats.avgScore}/10`,
        inline: true,
      },
      {
        name: 'Avg Latency',
        value: `${stats.avgLatencyMs}ms`,
        inline: true,
      },
      {
        name: 'Total Cost',
        value: `$${(stats.totalCostCents / 100).toFixed(2)}`,
        inline: true,
      },
      {
        name: 'Run ID',
        value: runId.slice(0, 8),
        inline: true,
      },
    ],
    color: passRate >= 85 ? 0x10b981 : passRate >= 70 ? 0xf59e0b : 0xef4444,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Check for quality degradation vs recent runs
 */
async function checkForDegradation(currentStats) {
  const recentRuns = await getRecentRuns(5);
  
  if (recentRuns.length < 2) {
    return null; // Not enough data for comparison
  }
  
  // Calculate average pass rate from recent runs (excluding current)
  const previousRuns = recentRuns.slice(1);
  const avgPreviousPassRate = previousRuns.reduce((sum, run) => {
    const total = run.passed_cases + run.failed_cases;
    return sum + (total > 0 ? run.passed_cases / total : 0);
  }, 0) / previousRuns.length;
  
  // Current pass rate
  const currentTotal = currentStats.passed + currentStats.failed;
  const currentPassRate = currentTotal > 0 ? currentStats.passed / currentTotal : 0;
  
  // Check for significant degradation (>10% drop)
  const degradation = avgPreviousPassRate - currentPassRate;
  
  if (degradation > 0.1) {
    return {
      isDegrading: true,
      currentPassRate: Math.round(currentPassRate * 100),
      previousAvgPassRate: Math.round(avgPreviousPassRate * 100),
      dropPercentage: Math.round(degradation * 100),
    };
  }
  
  return { isDegrading: false };
}

/**
 * GET /api/cron/al-evaluation
 * 
 * Run scheduled AL evaluation
 */
async function handleGet(request) {
  // Verify request
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { searchParams } = new URL(request.url);
  const forceType = searchParams.get('type'); // Allow override via query param
  const evalType = forceType || EVAL_TYPE;
  
  console.log(`[AL Eval Cron] Starting ${evalType} evaluation`);
  
  const startTime = Date.now();
  
  try {
    let result;
    
    if (evalType === 'full') {
      result = await runFullEvaluation({
        name: 'Scheduled Full Evaluation',
        triggeredBy: 'scheduled',
      });
    } else {
      result = await runSpotCheck(EVAL_SPOT_COUNT, {});
    }
    
    const duration = Date.now() - startTime;
    console.log(`[AL Eval Cron] Completed in ${duration}ms`);
    
    // Check for quality degradation
    const degradationCheck = await checkForDegradation(result.stats);
    
    // Send Discord notification
    try {
      const embed = formatResultsForDiscord(result, evalType);
      
      // Add degradation warning if detected
      if (degradationCheck?.isDegrading) {
        embed.fields.push({
          name: '⚠️ Quality Alert',
          value: `Pass rate dropped ${degradationCheck.dropPercentage}% from ${degradationCheck.previousAvgPassRate}% to ${degradationCheck.currentPassRate}%`,
          inline: false,
        });
      }
      
      await notifyDiscord(null, {
        webhookUrl: process.env.DISCORD_ALERTS_WEBHOOK,
        embeds: [embed],
      });
    } catch (discordError) {
      console.error('[AL Eval Cron] Discord notification failed:', discordError);
    }
    
    return NextResponse.json({
      success: true,
      type: evalType,
      runId: result.runId,
      stats: result.stats,
      durationMs: duration,
      degradationCheck,
    });
  } catch (error) {
    console.error('[AL Eval Cron] Error:', error);
    
    // Send error notification
    try {
      await notifyDiscord(`AL Evaluation cron failed: ${error.message}`, {
        webhookUrl: process.env.DISCORD_ALERTS_WEBHOOK,
      });
    } catch (discordError) {
      console.error('[AL Eval Cron] Discord error notification failed:', discordError);
    }
    
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

export const GET = withErrorLogging(handleGet, { route: 'cron/al-evaluation', feature: 'cron' });

// Also export for dynamic cron
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for full eval
