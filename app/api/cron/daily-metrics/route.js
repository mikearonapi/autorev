/**
 * Daily Metrics Cron Job
 * 
 * Captures daily snapshots of content inventory, user metrics, and usage data.
 * Runs at midnight UTC via Vercel Cron.
 * 
 * @route GET /api/cron/daily-metrics
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request) {
  // Verify authorization
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const results = { success: true, captured: {}, errors: [] };
  
  try {
    // =========================================================================
    // 1. Capture Content Metrics
    // =========================================================================
    const { error: contentError } = await supabase.rpc('capture_daily_content_metrics');
    if (contentError) {
      results.errors.push({ task: 'content_metrics', error: contentError.message });
    } else {
      results.captured.content_metrics = true;
    }
    
    // =========================================================================
    // 2. Calculate and Store User Retention Metrics
    // =========================================================================
    const today = new Date();
    const d1Date = new Date(today);
    d1Date.setDate(d1Date.getDate() - 1);
    const d7Date = new Date(today);
    d7Date.setDate(d7Date.getDate() - 7);
    const d30Date = new Date(today);
    d30Date.setDate(d30Date.getDate() - 30);
    
    // Get users who signed up on each date
    const [d1Users, d7Users, d30Users, activeUsers] = await Promise.all([
      supabase.from('user_profiles')
        .select('id')
        .gte('created_at', d1Date.toISOString().split('T')[0])
        .lt('created_at', today.toISOString().split('T')[0]),
      supabase.from('user_profiles')
        .select('id')
        .gte('created_at', d7Date.toISOString().split('T')[0])
        .lt('created_at', d1Date.toISOString().split('T')[0]),
      supabase.from('user_profiles')
        .select('id')
        .gte('created_at', d30Date.toISOString().split('T')[0])
        .lt('created_at', d7Date.toISOString().split('T')[0]),
      // Users active in last 24 hours (from AL conversations or activity)
      supabase.from('al_conversations')
        .select('user_id')
        .gte('last_message_at', d1Date.toISOString()),
    ]);
    
    const d1UserIds = new Set((d1Users.data || []).map(u => u.id));
    const d7UserIds = new Set((d7Users.data || []).map(u => u.id));
    const d30UserIds = new Set((d30Users.data || []).map(u => u.id));
    const activeUserIds = new Set((activeUsers.data || []).map(u => u.user_id));
    
    // Calculate retention (users who came back)
    const d1Retained = [...d1UserIds].filter(id => activeUserIds.has(id)).length;
    const d7Retained = [...d7UserIds].filter(id => activeUserIds.has(id)).length;
    const d30Retained = [...d30UserIds].filter(id => activeUserIds.has(id)).length;
    
    // Store retention metrics
    const { error: retentionError } = await supabase
      .from('usage_metrics')
      .upsert([
        {
          metric_date: today.toISOString().split('T')[0],
          service_name: 'PLATFORM',
          metric_type: 'D1_RETENTION',
          metric_value: d1UserIds.size > 0 ? (d1Retained / d1UserIds.size) * 100 : 0,
          metadata: { cohort_size: d1UserIds.size, retained: d1Retained },
        },
        {
          metric_date: today.toISOString().split('T')[0],
          service_name: 'PLATFORM',
          metric_type: 'D7_RETENTION',
          metric_value: d7UserIds.size > 0 ? (d7Retained / d7UserIds.size) * 100 : 0,
          metadata: { cohort_size: d7UserIds.size, retained: d7Retained },
        },
        {
          metric_date: today.toISOString().split('T')[0],
          service_name: 'PLATFORM',
          metric_type: 'D30_RETENTION',
          metric_value: d30UserIds.size > 0 ? (d30Retained / d30UserIds.size) * 100 : 0,
          metadata: { cohort_size: d30UserIds.size, retained: d30Retained },
        },
        {
          metric_date: today.toISOString().split('T')[0],
          service_name: 'PLATFORM',
          metric_type: 'DAILY_ACTIVE_USERS',
          metric_value: activeUserIds.size,
          metadata: {},
        },
      ], { onConflict: 'metric_date,service_name,metric_type' });
    
    if (retentionError) {
      results.errors.push({ task: 'retention_metrics', error: retentionError.message });
    } else {
      results.captured.retention_metrics = {
        d1: { cohort: d1UserIds.size, retained: d1Retained },
        d7: { cohort: d7UserIds.size, retained: d7Retained },
        d30: { cohort: d30UserIds.size, retained: d30Retained },
        dau: activeUserIds.size,
      };
    }
    
    // =========================================================================
    // 3. Aggregate Daily API Costs from al_usage_logs
    // =========================================================================
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const { data: dailyUsage, error: usageError } = await supabase
      .from('al_usage_logs')
      .select('input_tokens, output_tokens, cost_cents')
      .gte('created_at', yesterday.toISOString().split('T')[0])
      .lt('created_at', today.toISOString().split('T')[0]);
    
    if (!usageError && dailyUsage) {
      const totalInputTokens = dailyUsage.reduce((sum, l) => sum + (l.input_tokens || 0), 0);
      const totalOutputTokens = dailyUsage.reduce((sum, l) => sum + (l.output_tokens || 0), 0);
      const totalCostCents = dailyUsage.reduce((sum, l) => sum + parseFloat(l.cost_cents || 0), 0);
      
      await supabase
        .from('usage_metrics')
        .upsert([
          {
            metric_date: yesterday.toISOString().split('T')[0],
            service_name: 'ANTHROPIC_API',
            metric_type: 'DAILY_INPUT_TOKENS',
            metric_value: totalInputTokens,
            estimated_cost_cents: 0,
          },
          {
            metric_date: yesterday.toISOString().split('T')[0],
            service_name: 'ANTHROPIC_API',
            metric_type: 'DAILY_OUTPUT_TOKENS',
            metric_value: totalOutputTokens,
            estimated_cost_cents: 0,
          },
          {
            metric_date: yesterday.toISOString().split('T')[0],
            service_name: 'ANTHROPIC_API',
            metric_type: 'DAILY_COST',
            metric_value: totalCostCents,
            estimated_cost_cents: totalCostCents,
          },
        ], { onConflict: 'metric_date,service_name,metric_type' });
      
      results.captured.api_usage = {
        input_tokens: totalInputTokens,
        output_tokens: totalOutputTokens,
        cost_cents: totalCostCents,
      };
    }
    
    // =========================================================================
    // 4. Count Daily Errors
    // =========================================================================
    const { count: errorCount, error: errorCountError } = await supabase
      .from('user_feedback')
      .select('*', { count: 'exact', head: true })
      .eq('category', 'auto-error')
      .gte('created_at', yesterday.toISOString().split('T')[0])
      .lt('created_at', today.toISOString().split('T')[0]);
    
    if (!errorCountError) {
      await supabase
        .from('usage_metrics')
        .upsert({
          metric_date: yesterday.toISOString().split('T')[0],
          service_name: 'PLATFORM',
          metric_type: 'DAILY_ERRORS',
          metric_value: errorCount || 0,
        }, { onConflict: 'metric_date,service_name,metric_type' });
      
      results.captured.daily_errors = errorCount || 0;
    }
    
    // =========================================================================
    // 5. Data Pipeline Status
    // =========================================================================
    const { data: pipelineStats } = await supabase
      .from('scrape_jobs')
      .select('status')
      .gte('created_at', yesterday.toISOString());
    
    if (pipelineStats) {
      const statusCounts = pipelineStats.reduce((acc, job) => {
        acc[job.status] = (acc[job.status] || 0) + 1;
        return acc;
      }, {});
      
      results.captured.pipeline = statusCounts;
    }
    
    results.success = results.errors.length === 0;
    results.timestamp = new Date().toISOString();
    
    return NextResponse.json(results);
    
  } catch (err) {
    console.error('[Daily Metrics Cron] Error:', err);
    return NextResponse.json({ 
      success: false, 
      error: err.message,
      captured: results.captured,
      errors: results.errors,
    }, { status: 500 });
  }
}

