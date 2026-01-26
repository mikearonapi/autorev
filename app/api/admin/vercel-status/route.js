/**
 * Vercel Status API
 * 
 * Fetches deployment status, build info, domains, checks, and project health 
 * from Vercel REST API.
 * 
 * Requires environment variables:
 * - VERCEL_API_TOKEN (required)
 * - VERCEL_PROJECT_ID (required)
 * - VERCEL_TEAM_ID (optional, for team projects)
 * 
 * @route GET /api/admin/vercel-status
 * 
 * Vercel API Docs: https://vercel.com/docs/rest-api
 * 
 * Available Endpoints Used:
 * - GET /v9/projects/:id - Project info
 * - GET /v6/deployments - Deployments list
 * - GET /v13/deployments/:id - Deployment details
 * - GET /v5/projects/:id/domains - Project domains
 * - GET /v1/deployments/:id/checks - Deployment checks
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAccess';
import { withErrorLogging } from '@/lib/serverErrorLogger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Vercel API configuration
const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID; // Optional for team projects
const VERCEL_API_BASE = 'https://api.vercel.com';

/**
 * Fetch from Vercel API with authentication
 */
async function vercelFetch(endpoint, options = {}) {
  const url = new URL(endpoint, VERCEL_API_BASE);
  
  // Add team ID if present
  if (VERCEL_TEAM_ID) {
    url.searchParams.set('teamId', VERCEL_TEAM_ID);
  }
  
  const response = await fetch(url.toString(), {
    ...options,
    headers: {
      'Authorization': `Bearer ${VERCEL_API_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    // Don't throw for 404s - some endpoints may not exist
    if (response.status === 404) {
      return { notFound: true };
    }
    const error = await response.text();
    console.error(`[Vercel API] ${endpoint} failed:`, response.status, error);
    throw new Error(`Vercel API error: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Calculate build duration from deployment timestamps
 */
function calculateBuildDuration(deployment) {
  if (!deployment.buildingAt || !deployment.ready) return null;
  const buildStart = deployment.buildingAt;
  const buildEnd = deployment.ready;
  const durationMs = buildEnd - buildStart;
  return Math.round(durationMs / 1000); // Return seconds
}

/**
 * Parse cron schedule to human-readable format
 */
function parseCronSchedule(schedule) {
  if (!schedule) return 'Unknown';
  
  const parts = schedule.split(' ');
  if (parts.length !== 5) return schedule;
  
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  
  // Common patterns
  if (schedule === '* * * * *') return 'Every minute';
  if (schedule.match(/^\*\/(\d+) \* \* \* \*$/)) {
    const mins = schedule.match(/^\*\/(\d+)/)[1];
    return `Every ${mins} minutes`;
  }
  if (schedule.match(/^0 \*\/(\d+) \* \* \*$/)) {
    const hrs = schedule.match(/\*\/(\d+)/)[1];
    return `Every ${hrs} hours`;
  }
  if (schedule.match(/^0 (\d+) \* \* \*$/)) {
    const hr = parseInt(parts[1]);
    return `Daily at ${hr}:00 UTC`;
  }
  if (schedule.match(/^(\d+) (\d+) \* \* 0$/)) {
    const hr = parseInt(parts[1]);
    const min = parseInt(parts[0]);
    return `Weekly (Sun ${hr}:${min.toString().padStart(2, '0')} UTC)`;
  }
  if (schedule.match(/^0 (\d+) \* \* 0$/)) {
    const hr = parseInt(parts[1]);
    return `Weekly (Sun ${hr}:00 UTC)`;
  }
  
  return schedule; // Return raw if no pattern matches
}

async function handleGet(request) {
  // Verify admin access
  const denied = await requireAdmin(request);
  if (denied) return denied;

  // Check if Vercel integration is configured
  if (!VERCEL_API_TOKEN || !VERCEL_PROJECT_ID) {
    return NextResponse.json({
      configured: false,
      error: 'Vercel integration not configured',
      setup: {
        required: ['VERCEL_API_TOKEN', 'VERCEL_PROJECT_ID'],
        optional: ['VERCEL_TEAM_ID'],
        docs: 'https://vercel.com/docs/rest-api#creating-an-access-token',
      },
    });
  }
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Fetch data from Vercel API in parallel
    const [
      projectData,
      deploymentsData,
      domainsData,
      envVarsData,
    ] = await Promise.all([
      // Get project info (includes crons)
      vercelFetch(`/v9/projects/${VERCEL_PROJECT_ID}`).catch(e => ({ error: e.message })),
      // Get recent deployments (more for better analytics)
      vercelFetch(`/v6/deployments?projectId=${VERCEL_PROJECT_ID}&limit=20`).catch(e => ({ error: e.message })),
      // Get domains
      vercelFetch(`/v5/projects/${VERCEL_PROJECT_ID}/domains`).catch(e => ({ error: e.message })),
      // Get environment variables (names only for audit)
      vercelFetch(`/v9/projects/${VERCEL_PROJECT_ID}/env`).catch(e => ({ error: e.message })),
    ]);
    
    // Process project data
    const project = projectData.error ? null : {
      id: projectData.id,
      name: projectData.name,
      framework: projectData.framework,
      nodeVersion: projectData.nodeVersion,
      buildCommand: projectData.buildCommand,
      devCommand: projectData.devCommand,
      outputDirectory: projectData.outputDirectory,
      rootDirectory: projectData.rootDirectory,
      createdAt: projectData.createdAt,
      updatedAt: projectData.updatedAt,
      autoExposeSystemEnvs: projectData.autoExposeSystemEnvs,
      directoryListing: projectData.directoryListing,
    };
    
    // Process cron jobs from project data
    const cronJobs = projectData.crons?.definitions?.map(cron => ({
      path: cron.path,
      schedule: cron.schedule,
      host: cron.host,
      // Parse schedule for human-readable format
      scheduleDescription: parseCronSchedule(cron.schedule),
    })) || [];
    
    const cronStatus = {
      enabled: !!projectData.crons?.enabledAt,
      enabledAt: projectData.crons?.enabledAt,
      lastUpdated: projectData.crons?.updatedAt,
      totalJobs: cronJobs.length,
      jobs: cronJobs,
    };
    
    // Process environment variables (names only for security)
    const envVars = envVarsData.error || envVarsData.notFound ? [] : (envVarsData.envs || []).map(env => ({
      key: env.key,
      target: env.target, // production, preview, development
      type: env.type, // plain, secret, encrypted
      createdAt: env.createdAt,
      updatedAt: env.updatedAt,
    }));
    
    const envVarsAudit = {
      total: envVars.length,
      byTarget: {
        production: envVars.filter(e => e.target?.includes('production')).length,
        preview: envVars.filter(e => e.target?.includes('preview')).length,
        development: envVars.filter(e => e.target?.includes('development')).length,
      },
      byType: {
        secret: envVars.filter(e => e.type === 'secret' || e.type === 'encrypted').length,
        plain: envVars.filter(e => e.type === 'plain').length,
      },
      variables: envVars.map(e => ({ key: e.key, target: e.target, type: e.type })),
    };
    
    // Process domains
    const domains = domainsData.error || domainsData.notFound ? [] : (domainsData.domains || []).map(d => ({
      name: d.name,
      verified: d.verified,
      redirect: d.redirect,
      redirectStatusCode: d.redirectStatusCode,
      gitBranch: d.gitBranch,
      customEnvironmentId: d.customEnvironmentId,
      verification: d.verification,
    }));
    
    // Process deployments with enhanced data
    const deployments = deploymentsData.error ? [] : (deploymentsData.deployments || []).map(d => {
      const buildDuration = calculateBuildDuration(d);
      return {
        id: d.uid,
        name: d.name,
        url: d.url,
        inspectorUrl: d.inspectorUrl,
        state: d.state, // READY, ERROR, BUILDING, QUEUED, CANCELED
        readyState: d.readyState, // READY, ERROR, BUILDING, QUEUED, CANCELED, INITIALIZING
        target: d.target, // production, preview
        createdAt: d.createdAt,
        buildingAt: d.buildingAt,
        ready: d.ready,
        buildDurationSeconds: buildDuration,
        source: d.source, // git, cli, api
        type: d.type, // LAMBDAS, STATIC
        regions: d.regions,
        meta: {
          githubCommitRef: d.meta?.githubCommitRef,
          githubCommitMessage: d.meta?.githubCommitMessage,
          githubCommitAuthorName: d.meta?.githubCommitAuthorName,
          githubCommitSha: d.meta?.githubCommitSha,
          githubDeployment: d.meta?.githubDeployment,
          githubOrg: d.meta?.githubOrg,
          githubRepo: d.meta?.githubRepo,
        },
      };
    });
    
    // Fetch checks for the latest deployment (if available)
    let latestChecks = null;
    const latestDeployment = deployments[0];
    if (latestDeployment?.id) {
      try {
        const checksData = await vercelFetch(`/v1/deployments/${latestDeployment.id}/checks`);
        if (!checksData.error && !checksData.notFound && checksData.checks) {
          latestChecks = checksData.checks.map(c => ({
            name: c.name,
            status: c.status, // registered, running, completed
            conclusion: c.conclusion, // succeeded, failed, skipped, neutral, canceled
            blocking: c.blocking,
            rerequestable: c.rerequestable,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
            completedAt: c.completedAt,
          }));
        }
      } catch (e) {
        // Checks endpoint may not be available for all plans
        console.log('[Vercel Status] Checks not available:', e.message);
      }
    }
    
    // Determine current status
    const currentDeployment = deployments.find(d => d.target === 'production' && d.readyState === 'READY');
    const recentErrors = deployments.filter(d => d.readyState === 'ERROR').length;
    const isBuilding = deployments.some(d => d.readyState === 'BUILDING' || d.readyState === 'QUEUED');
    
    // Calculate deployment health
    let status = 'healthy';
    let statusMessage = 'All systems operational';
    
    if (latestDeployment?.readyState === 'ERROR') {
      status = 'error';
      statusMessage = 'Latest deployment failed';
    } else if (isBuilding) {
      status = 'building';
      statusMessage = 'Deployment in progress';
    } else if (recentErrors > 2) {
      status = 'warning';
      statusMessage = `${recentErrors} recent deployment failures`;
    } else if (currentDeployment) {
      status = 'healthy';
      statusMessage = 'Production deployment ready';
    }
    
    // Calculate deployment stats
    const successfulDeployments = deployments.filter(d => d.readyState === 'READY');
    const stats = {
      total: deployments.length,
      successful: successfulDeployments.length,
      failed: deployments.filter(d => d.readyState === 'ERROR').length,
      building: deployments.filter(d => d.readyState === 'BUILDING' || d.readyState === 'QUEUED').length,
      production: deployments.filter(d => d.target === 'production').length,
      preview: deployments.filter(d => d.target === 'preview').length,
      successRate: deployments.length > 0 
        ? Math.round((successfulDeployments.length / deployments.length) * 100) 
        : 100,
    };
    
    // Calculate build time analytics
    const buildsWithDuration = successfulDeployments.filter(d => d.buildDurationSeconds);
    const buildMetrics = buildsWithDuration.length > 0 ? {
      averageBuildTime: Math.round(
        buildsWithDuration.reduce((acc, d) => acc + d.buildDurationSeconds, 0) / buildsWithDuration.length
      ),
      fastestBuild: Math.min(...buildsWithDuration.map(d => d.buildDurationSeconds)),
      slowestBuild: Math.max(...buildsWithDuration.map(d => d.buildDurationSeconds)),
      recentBuilds: buildsWithDuration.slice(0, 10).map(d => ({
        id: d.id,
        duration: d.buildDurationSeconds,
        createdAt: d.createdAt,
        target: d.target,
      })),
    } : null;
    
    // Deployment frequency (deployments per day in last 7 days)
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const recentDeploys = deployments.filter(d => d.createdAt > sevenDaysAgo);
    const deploymentFrequency = {
      last7Days: recentDeploys.length,
      perDay: Math.round((recentDeploys.length / 7) * 10) / 10,
    };
    
    // Domain health
    const domainHealth = {
      total: domains.length,
      verified: domains.filter(d => d.verified).length,
      unverified: domains.filter(d => !d.verified).length,
      production: domains.filter(d => !d.redirect).length,
      redirects: domains.filter(d => d.redirect).length,
    };
    
    return NextResponse.json({
      configured: true,
      status,
      statusMessage,
      project,
      domains: {
        list: domains,
        health: domainHealth,
      },
      currentDeployment: currentDeployment ? {
        id: currentDeployment.id,
        url: currentDeployment.url,
        inspectorUrl: currentDeployment.inspectorUrl,
        createdAt: currentDeployment.createdAt,
        ready: currentDeployment.ready,
        buildDurationSeconds: currentDeployment.buildDurationSeconds,
        commit: currentDeployment.meta?.githubCommitMessage,
        author: currentDeployment.meta?.githubCommitAuthorName,
        branch: currentDeployment.meta?.githubCommitRef,
        sha: currentDeployment.meta?.githubCommitSha?.substring(0, 7),
      } : null,
      latestDeployment: latestDeployment ? {
        id: latestDeployment.id,
        url: latestDeployment.url,
        inspectorUrl: latestDeployment.inspectorUrl,
        state: latestDeployment.readyState,
        target: latestDeployment.target,
        createdAt: latestDeployment.createdAt,
        buildDurationSeconds: latestDeployment.buildDurationSeconds,
        commit: latestDeployment.meta?.githubCommitMessage,
        author: latestDeployment.meta?.githubCommitAuthorName,
        branch: latestDeployment.meta?.githubCommitRef,
        sha: latestDeployment.meta?.githubCommitSha?.substring(0, 7),
        checks: latestChecks,
      } : null,
      recentDeployments: deployments.slice(0, 10),
      stats,
      buildMetrics,
      deploymentFrequency,
      cronJobs: cronStatus,
      envVars: envVarsAudit,
      timestamp: new Date().toISOString(),
      
      // API limitations notice
      apiLimitations: {
        note: 'Some Vercel data is only available via dashboard or drains',
        unavailable: [
          'Web Analytics (page views, visitors) - No API',
          'Usage/Bandwidth metrics - Enterprise only',
        ],
        availableViaDrains: [
          'Speed Insights (Core Web Vitals) - Via Speed Insights Drain',
          'Function logs - Via Log Drain',
        ],
        available: [
          'Deployment status and history',
          'Build times and success rates',
          'Domain configuration',
          'Deployment checks',
          'Cron job configuration',
          'Environment variables audit',
          'Project configuration',
        ],
      },
    });
    
  } catch (err) {
    console.error('[Vercel Status API] Error:', err);
    return NextResponse.json({ 
      configured: true,
      error: 'Failed to fetch Vercel status',
      status: 'error',
      statusMessage: 'Failed to fetch Vercel status',
    }, { status: 500 });
  }
}

export const GET = withErrorLogging(handleGet, { route: 'admin/vercel-status', feature: 'admin' });
