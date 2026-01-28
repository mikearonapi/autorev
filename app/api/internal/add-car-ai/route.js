/**
 * AI Car Addition API Route
 * 
 * POST /api/internal/add-car-ai
 * 
 * Fully automated car addition using AI.
 * Input: Just the car name
 * Output: Complete car added to database
 * 
 * Auth: Admin only
 */

import { exec } from 'child_process';
import { promisify } from 'util';

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { createServerClient } from '@supabase/ssr';

import { withErrorLogging } from '@/lib/serverErrorLogger';
import { supabaseServiceRole, isSupabaseConfigured } from '@/lib/supabase';

const execAsync = promisify(exec);

/**
 * Check if user is admin
 */
async function isAdmin() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    const { data: profile } = await supabaseServiceRole
      .from('user_profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();
    
    return profile?.subscription_tier === 'admin';
  } catch (err) {
    console.error('[AddCarAI API] Auth check error:', err);
    return false;
  }
}

/**
 * POST /api/internal/add-car-ai
 * Add a car using full AI automation
 */
async function handlePost(request) {
  if (!isSupabaseConfigured || !supabaseServiceRole) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }
  
  const adminCheck = await isAdmin();
  if (!adminCheck) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const { car_name, options = {} } = body;
    
    if (!car_name) {
      return NextResponse.json(
        { error: 'car_name is required' },
        { status: 400 }
      );
    }
    
    // Validate car name format (basic check)
    if (car_name.length < 3 || car_name.length > 100) {
      return NextResponse.json(
        { error: 'Invalid car name length' },
        { status: 400 }
      );
    }
    
    // Create a job ID for tracking
    const jobId = `ai-car-${Date.now()}`;
    
    // First, generate a slug to create pipeline run
    const tempSlug = generateTempSlug(car_name);
    
    // Create pipeline run for tracking
    const { data: pipelineRun, error: pipelineError } = await supabaseServiceRole
      .from('car_pipeline_runs')
      .insert({
        car_slug: tempSlug,
        car_name: car_name,
        status: 'in_progress',
        phase1_notes: `AI research started for: ${car_name}`,
      })
      .select()
      .single();
    
    if (pipelineError) {
      console.error('[AddCarAI API] Pipeline creation error:', pipelineError);
      // Continue anyway - this is just for tracking
    }
    
    // Start the AI research process in background
    const scriptPath = 'scripts/car-pipeline/ai-research-car.js';
    const dryRunFlag = options.dryRun ? '--dry-run' : '';
    const verboseFlag = options.verbose ? '--verbose' : '';
    
    // Don't await this - let it run in background
    runAIResearchInBackground(car_name, scriptPath, dryRunFlag, verboseFlag, jobId)
      .catch(err => {
        console.error(`[AddCarAI API] Background process error:`, err);
        
        // Update pipeline run with error
        if (pipelineRun) {
          supabaseServiceRole
            .from('car_pipeline_runs')
            .update({
              status: 'blocked',
              phase1_notes: `AI research failed: ${err.message}`,
            })
            .eq('id', pipelineRun.id)
            .then(() => {})
            .catch(() => {});
        }
      });
    
    return NextResponse.json({
      success: true,
      message: 'AI car research started',
      job_id: jobId,
      car_name: car_name,
      estimated_duration: '3-5 minutes',
      pipeline_run: pipelineRun || null,
      status_url: pipelineRun ? `/internal/car-pipeline/${tempSlug}` : null,
    });
    
  } catch (err) {
    console.error('[AddCarAI API] Error:', err);
    return NextResponse.json({ 
      error: 'Failed to start AI car research'
    }, { status: 500 });
  }
}

/**
 * Generate temporary slug from car name
 */
function generateTempSlug(carName) {
  return carName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, 50); // Limit length
}

/**
 * Run AI research script in background
 */
async function runAIResearchInBackground(carName, scriptPath, dryRunFlag, verboseFlag, jobId) {
  const command = `node ${scriptPath} "${carName}" ${dryRunFlag} ${verboseFlag}`;
  
  console.log(`[AddCarAI API] Starting background process: ${command}`);
  
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: process.cwd(),
      timeout: 300000, // 5 minute timeout
    });
    
    console.log(`[AddCarAI API] Job ${jobId} completed successfully`);
    console.log(`[AddCarAI API] Output:`, stdout);
    
    if (stderr) {
      console.warn(`[AddCarAI API] Job ${jobId} stderr:`, stderr);
    }
    
    return { success: true, output: stdout };
    
  } catch (error) {
    console.error(`[AddCarAI API] Job ${jobId} failed:`, error);
    throw error;
  }
}

/**
 * GET /api/internal/add-car-ai
 * Get status of AI car addition jobs (future enhancement)
 */
async function handleGet(_request) {
  return NextResponse.json({
    message: 'AI Car Addition Service',
    usage: {
      endpoint: 'POST /api/internal/add-car-ai',
      payload: { car_name: 'Porsche 911 GT3' },
      options: { dryRun: true, verbose: false }
    },
    features: [
      'Full AI research of car specifications',
      'Automated known issues research',
      'AI-generated maintenance schedules',
      'Automated scoring and editorial content',
      'Hero image generation',
      'Complete database integration'
    ]
  });
}

export const GET = withErrorLogging(handleGet, { route: 'internal/add-car-ai', feature: 'internal' });
export const POST = withErrorLogging(handlePost, { route: 'internal/add-car-ai', feature: 'internal' });
