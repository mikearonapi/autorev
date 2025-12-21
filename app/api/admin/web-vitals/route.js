/**
 * Core Web Vitals API
 * 
 * Fetches aggregated Core Web Vitals data for the admin command center.
 * Data comes from Vercel Speed Insights Drain stored in Supabase.
 * 
 * @route GET /api/admin/web-vitals
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { isAdminEmail } from '@/lib/adminAccess';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Core Web Vitals thresholds for display
const METRIC_INFO = {
  LCP: {
    name: 'Largest Contentful Paint',
    shortName: 'LCP',
    unit: 'ms',
    good: 2500,
    poor: 4000,
    description: 'Loading performance',
  },
  FID: {
    name: 'First Input Delay',
    shortName: 'FID',
    unit: 'ms',
    good: 100,
    poor: 300,
    description: 'Interactivity (legacy)',
  },
  INP: {
    name: 'Interaction to Next Paint',
    shortName: 'INP',
    unit: 'ms',
    good: 200,
    poor: 500,
    description: 'Interactivity',
  },
  CLS: {
    name: 'Cumulative Layout Shift',
    shortName: 'CLS',
    unit: '',
    good: 0.1,
    poor: 0.25,
    description: 'Visual stability',
  },
  TTFB: {
    name: 'Time to First Byte',
    shortName: 'TTFB',
    unit: 'ms',
    good: 800,
    poor: 1800,
    description: 'Server response',
  },
  FCP: {
    name: 'First Contentful Paint',
    shortName: 'FCP',
    unit: 'ms',
    good: 1800,
    poor: 3000,
    description: 'Initial render',
  },
};

export async function GET(request) {
  // Verify admin access
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    // Parse query params
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7', 10);
    
    // Get summary data (last N days)
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);
    
    // Fetch aggregated metrics
    const { data: summaryData, error: summaryError } = await supabase
      .from('web_vitals')
      .select('metric_name, metric_value, metric_rating')
      .gte('event_time', sinceDate.toISOString());
      
    if (summaryError) {
      // Table might not exist yet
      if (summaryError.code === '42P01') {
        return NextResponse.json({
          configured: false,
          message: 'Web Vitals table not created yet. Run migration 029.',
          setup: {
            step1: 'Run: supabase db push',
            step2: 'Set up Speed Insights Drain in Vercel Dashboard',
            step3: 'Add VERCEL_SPEED_INSIGHTS_SECRET env var',
          },
        });
      }
      throw summaryError;
    }
    
    // Check if we have data
    if (!summaryData || summaryData.length === 0) {
      return NextResponse.json({
        configured: true,
        hasData: false,
        message: 'No Web Vitals data yet. Set up Speed Insights Drain in Vercel.',
        setup: {
          url: 'https://vercel.com/[team]/[project]/settings/drains',
          webhookUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://autorev.app'}/api/webhooks/speed-insights`,
          docs: 'https://vercel.com/docs/drains/reference/speed-insights',
        },
        metrics: {},
      });
    }
    
    // Aggregate metrics
    const metrics = {};
    const metricGroups = {};
    
    summaryData.forEach(row => {
      const name = row.metric_name;
      if (!metricGroups[name]) {
        metricGroups[name] = [];
      }
      metricGroups[name].push(row);
    });
    
    // Calculate stats for each metric
    Object.entries(metricGroups).forEach(([name, rows]) => {
      const values = rows.map(r => parseFloat(r.metric_value)).filter(v => !isNaN(v));
      
      if (values.length === 0) return;
      
      const sorted = values.sort((a, b) => a - b);
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = sum / values.length;
      const p75Index = Math.floor(values.length * 0.75);
      const p75 = sorted[p75Index] || sorted[sorted.length - 1];
      
      const ratingCounts = { good: 0, 'needs-improvement': 0, poor: 0 };
      rows.forEach(r => {
        if (r.metric_rating && ratingCounts[r.metric_rating] !== undefined) {
          ratingCounts[r.metric_rating]++;
        }
      });
      
      const goodPct = (ratingCounts.good / rows.length) * 100;
      let overallRating = 'needs-improvement';
      if (goodPct >= 75) overallRating = 'good';
      else if (ratingCounts.poor / rows.length >= 0.25) overallRating = 'poor';
      
      const info = METRIC_INFO[name] || { name, shortName: name, unit: '', description: '' };
      
      metrics[name] = {
        ...info,
        sampleCount: values.length,
        avg: Math.round(avg * 100) / 100,
        p75: Math.round(p75 * 100) / 100,
        min: Math.round(Math.min(...values) * 100) / 100,
        max: Math.round(Math.max(...values) * 100) / 100,
        goodPct: Math.round(goodPct),
        ratings: ratingCounts,
        overallRating,
      };
    });
    
    // Get daily trend for charts
    const { data: dailyData, error: dailyError } = await supabase
      .from('web_vitals')
      .select('metric_name, metric_value, event_time')
      .gte('event_time', sinceDate.toISOString())
      .order('event_time', { ascending: true });
      
    // Group by day and metric
    const dailyTrend = {};
    if (dailyData) {
      dailyData.forEach(row => {
        const date = row.event_time.split('T')[0];
        const key = `${date}-${row.metric_name}`;
        if (!dailyTrend[key]) {
          dailyTrend[key] = { date, metric: row.metric_name, values: [] };
        }
        dailyTrend[key].values.push(parseFloat(row.metric_value));
      });
    }
    
    const trend = Object.values(dailyTrend).map(d => ({
      date: d.date,
      metric: d.metric,
      avg: Math.round(d.values.reduce((a, b) => a + b, 0) / d.values.length),
      samples: d.values.length,
    }));
    
    // Calculate overall score (weighted average based on Core Web Vitals)
    const coreMetrics = ['LCP', 'INP', 'CLS'];
    let overallScore = 0;
    let scoredMetrics = 0;
    
    coreMetrics.forEach(name => {
      if (metrics[name]) {
        const rating = metrics[name].overallRating;
        const score = rating === 'good' ? 100 : rating === 'needs-improvement' ? 50 : 0;
        overallScore += score;
        scoredMetrics++;
      }
    });
    
    const finalScore = scoredMetrics > 0 ? Math.round(overallScore / scoredMetrics) : null;
    
    return NextResponse.json({
      configured: true,
      hasData: true,
      period: { days, since: sinceDate.toISOString() },
      totalSamples: summaryData.length,
      overallScore: finalScore,
      overallRating: finalScore >= 75 ? 'good' : finalScore >= 50 ? 'needs-improvement' : 'poor',
      metrics,
      trend,
      timestamp: new Date().toISOString(),
    });
    
  } catch (err) {
    console.error('[Web Vitals API] Error:', err);
    return NextResponse.json({ 
      error: err.message,
      configured: false,
    }, { status: 500 });
  }
}

