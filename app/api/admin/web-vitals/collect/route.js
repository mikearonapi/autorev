/**
 * Web Vitals Collection API
 * 
 * Collects Core Web Vitals metrics from the frontend for historical analysis.
 * This endpoint:
 * 1. Receives CWV metrics from Speed Insights / client-side reporting
 * 2. Stores them in Supabase for historical trending
 * 3. Enables our own dashboards to show real performance data
 * 
 * POST /api/admin/web-vitals/collect
 * 
 * @module app/api/admin/web-vitals/collect
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withErrorLogging } from '@/lib/serverErrorLogger';

// Service role client for data storage
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Valid Web Vitals metrics
 */
const VALID_METRICS = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB', 'FID'];

/**
 * Rating thresholds for each metric (in ms, except CLS which is unitless)
 * Based on Google's recommendations
 */
const THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 },   // ms
  INP: { good: 200, needsImprovement: 500 },     // ms
  CLS: { good: 0.1, needsImprovement: 0.25 },    // unitless
  FCP: { good: 1800, needsImprovement: 3000 },   // ms
  TTFB: { good: 800, needsImprovement: 1800 },   // ms
  FID: { good: 100, needsImprovement: 300 },     // ms (deprecated, replaced by INP)
};

/**
 * Get rating for a metric value
 * @param {string} metric 
 * @param {number} value 
 */
function getRating(metric, value) {
  const threshold = THRESHOLDS[metric];
  if (!threshold) return 'unknown';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.needsImprovement) return 'needs-improvement';
  return 'poor';
}

/**
 * POST /api/admin/web-vitals/collect
 * 
 * Collect a Web Vitals metric
 * 
 * Body:
 * {
 *   name: string,       // Metric name (LCP, INP, CLS, FCP, TTFB, FID)
 *   value: number,      // Metric value
 *   id?: string,        // Unique metric ID
 *   delta?: number,     // Delta from previous value
 *   rating?: string,    // good | needs-improvement | poor
 *   navigationType?: string,
 *   path?: string,      // Page path
 *   connectionType?: string,
 *   deviceType?: string
 * }
 */
async function handlePost(request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || body.value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, value' },
        { status: 400 }
      );
    }
    
    // Validate metric name
    if (!VALID_METRICS.includes(body.name)) {
      return NextResponse.json(
        { error: `Invalid metric name. Valid metrics: ${VALID_METRICS.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Calculate rating if not provided
    const rating = body.rating || getRating(body.name, body.value);
    
    // Prepare record
    const record = {
      metric_name: body.name,
      metric_value: body.value,
      metric_id: body.id || null,
      delta: body.delta || null,
      rating,
      navigation_type: body.navigationType || null,
      page_path: body.path || null,
      connection_type: body.connectionType || null,
      device_type: body.deviceType || null,
      user_agent: request.headers.get('user-agent') || null,
      created_at: new Date().toISOString(),
    };
    
    // Store in database
    const { error } = await supabase
      .from('web_vitals')
      .insert(record);
    
    if (error) {
      // Table may not exist - create it on first use
      if (error.code === '42P01') {
        // Table doesn't exist - log and return success (we'll create it via migration)
        console.warn('[Web Vitals] Table "web_vitals" does not exist. Run migration to create it.');
        return NextResponse.json({ 
          success: true, 
          warning: 'Table not configured - metric not stored',
        });
      }
      
      console.error('[Web Vitals] Storage error:', error);
      return NextResponse.json(
        { error: 'Failed to store metric' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      rating,
    });
    
  } catch (error) {
    console.error('[Web Vitals] Collection error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/web-vitals/collect
 * 
 * Get aggregated Web Vitals metrics for dashboard
 * 
 * Query params:
 * - days: Number of days to look back (default: 7)
 * - path: Filter by specific page path
 */
async function handleGet(request) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '7', 10);
  const path = searchParams.get('path');
  
  // Calculate date range
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  try {
    // Build query
    let query = supabase
      .from('web_vitals')
      .select('metric_name, metric_value, rating, created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });
    
    if (path) {
      query = query.eq('page_path', path);
    }
    
    const { data, error } = await query;
    
    if (error) {
      if (error.code === '42P01') {
        // Table doesn't exist - return empty data
        return NextResponse.json({
          metrics: {},
          period: { days, start: startDate.toISOString(), end: new Date().toISOString() },
          warning: 'Table not configured',
        });
      }
      throw error;
    }
    
    // Aggregate metrics
    const metrics = {};
    for (const metric of VALID_METRICS) {
      const metricData = data?.filter(d => d.metric_name === metric) || [];
      const values = metricData.map(d => d.metric_value);
      
      if (values.length === 0) {
        metrics[metric] = null;
        continue;
      }
      
      // Calculate percentiles
      const sorted = [...values].sort((a, b) => a - b);
      const p50 = sorted[Math.floor(sorted.length * 0.5)];
      const p75 = sorted[Math.floor(sorted.length * 0.75)];
      const p95 = sorted[Math.floor(sorted.length * 0.95)];
      
      // Calculate rating distribution
      const ratings = { good: 0, 'needs-improvement': 0, poor: 0 };
      for (const item of metricData) {
        if (item.rating in ratings) {
          ratings[item.rating]++;
        }
      }
      
      metrics[metric] = {
        p50: Math.round(p50 * 100) / 100,
        p75: Math.round(p75 * 100) / 100,
        p95: Math.round(p95 * 100) / 100,
        count: values.length,
        ratings: {
          good: Math.round((ratings.good / values.length) * 100),
          needsImprovement: Math.round((ratings['needs-improvement'] / values.length) * 100),
          poor: Math.round((ratings.poor / values.length) * 100),
        },
      };
    }
    
    return NextResponse.json({
      metrics,
      period: {
        days,
        start: startDate.toISOString(),
        end: new Date().toISOString(),
      },
      totalMeasurements: data?.length || 0,
    });
    
  } catch (error) {
    console.error('[Web Vitals] Aggregation error:', error);
    return NextResponse.json(
      { error: 'Failed to aggregate metrics' },
      { status: 500 }
    );
  }
}

export const GET = withErrorLogging(handleGet, { route: 'admin/web-vitals/collect', feature: 'analytics' });
export const POST = withErrorLogging(handlePost, { route: 'admin/web-vitals/collect', feature: 'analytics' });
