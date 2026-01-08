/**
 * AL Usage Trends API
 * 
 * Fetches AL usage data aggregated by day for trend visualization.
 * @route GET /api/admin/al-trends?days=30
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { isAdminEmail } from '@/lib/adminAccess';
import { withErrorLogging } from '@/lib/serverErrorLogger';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function handleGet(request) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30', 10);
  
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
    
    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString();
    
    // Fetch daily AL usage from al_usage_logs
    const { data: usageLogs, error: usageError } = await supabase
      .from('al_usage_logs')
      .select('created_at, input_tokens, output_tokens, cost_cents, estimated_cost_cents, user_id, purpose, source')
      .gte('created_at', startDateStr)
      .order('created_at', { ascending: true });
    
    if (usageError) {
      console.error('[AL Trends] Usage logs error:', usageError);
      return NextResponse.json({ error: 'Failed to fetch usage logs' }, { status: 500 });
    }
    
    // Fetch daily AL conversations from al_conversations
    const { data: conversations, error: convoError } = await supabase
      .from('al_conversations')
      .select('created_at, user_id')
      .gte('created_at', startDateStr)
      .order('created_at', { ascending: true });
    
    if (convoError) {
      console.error('[AL Trends] Conversations error:', convoError);
    }
    
    // Fetch daily_metrics_snapshot for additional context
    const { data: dailySnapshots, error: snapshotError } = await supabase
      .from('daily_metrics_snapshot')
      .select('snapshot_date, al_conversations_today, al_messages_today, dau, wau, mau')
      .gte('snapshot_date', startDate.toISOString().split('T')[0])
      .order('snapshot_date', { ascending: true });
    
    if (snapshotError) {
      console.error('[AL Trends] Snapshot error:', snapshotError);
    }
    
    // Aggregate usage logs by day
    const usageByDay = {};
    (usageLogs || []).forEach(log => {
      const date = new Date(log.created_at).toISOString().split('T')[0];
      if (!usageByDay[date]) {
        usageByDay[date] = {
          messages: 0,
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          costCents: 0,
          uniqueUsers: new Set(),
          purposes: {},
          sources: {},
        };
      }
      usageByDay[date].messages += 1;
      usageByDay[date].inputTokens += log.input_tokens || 0;
      usageByDay[date].outputTokens += log.output_tokens || 0;
      usageByDay[date].totalTokens += (log.input_tokens || 0) + (log.output_tokens || 0);
      usageByDay[date].costCents += log.cost_cents || log.estimated_cost_cents || 0;
      if (log.user_id) usageByDay[date].uniqueUsers.add(log.user_id);
      if (log.purpose) {
        usageByDay[date].purposes[log.purpose] = (usageByDay[date].purposes[log.purpose] || 0) + 1;
      }
      if (log.source) {
        usageByDay[date].sources[log.source] = (usageByDay[date].sources[log.source] || 0) + 1;
      }
    });
    
    // Aggregate conversations by day
    const convosByDay = {};
    (conversations || []).forEach(c => {
      const date = new Date(c.created_at).toISOString().split('T')[0];
      if (!convosByDay[date]) {
        convosByDay[date] = { count: 0, uniqueUsers: new Set() };
      }
      convosByDay[date].count += 1;
      if (c.user_id) convosByDay[date].uniqueUsers.add(c.user_id);
    });
    
    // Build chart data for each day in the range
    const chartData = [];
    const endDate = new Date();
    let totalMessages = 0;
    let totalTokens = 0;
    let totalCostCents = 0;
    let totalConversations = 0;
    const allUsers = new Set();
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const usage = usageByDay[dateStr];
      const convos = convosByDay[dateStr];
      const snapshot = dailySnapshots?.find(s => s.snapshot_date === dateStr);
      
      const dayData = {
        date: dateStr,
        messages: usage?.messages || 0,
        tokens: usage?.totalTokens || 0,
        inputTokens: usage?.inputTokens || 0,
        outputTokens: usage?.outputTokens || 0,
        costCents: usage?.costCents || 0,
        costDollars: ((usage?.costCents || 0) / 100).toFixed(2),
        conversations: convos?.count || snapshot?.al_conversations_today || 0,
        uniqueUsers: usage?.uniqueUsers?.size || convos?.uniqueUsers?.size || 0,
        dau: snapshot?.dau || 0,
      };
      
      chartData.push(dayData);
      totalMessages += dayData.messages;
      totalTokens += dayData.tokens;
      totalCostCents += dayData.costCents;
      totalConversations += dayData.conversations;
      if (usage?.uniqueUsers) {
        usage.uniqueUsers.forEach(u => allUsers.add(u));
      }
    }
    
    // Calculate summary stats
    const activeDays = chartData.filter(d => d.messages > 0).length;
    const avgMessagesPerDay = activeDays > 0 ? Math.round(totalMessages / activeDays) : 0;
    const avgTokensPerDay = activeDays > 0 ? Math.round(totalTokens / activeDays) : 0;
    const avgTokensPerMessage = totalMessages > 0 ? Math.round(totalTokens / totalMessages) : 0;
    
    // Find peak usage day
    const peakDay = chartData.reduce((max, d) => d.tokens > (max?.tokens || 0) ? d : max, null);
    
    // Calculate growth (compare first half vs second half of period)
    const midPoint = Math.floor(chartData.length / 2);
    const firstHalf = chartData.slice(0, midPoint);
    const secondHalf = chartData.slice(midPoint);
    
    const firstHalfTokens = firstHalf.reduce((sum, d) => sum + d.tokens, 0);
    const secondHalfTokens = secondHalf.reduce((sum, d) => sum + d.tokens, 0);
    const growthPercent = firstHalfTokens > 0 
      ? Math.round(((secondHalfTokens - firstHalfTokens) / firstHalfTokens) * 100)
      : (secondHalfTokens > 0 ? 100 : 0);
    
    // Aggregate purposes and sources
    const allPurposes = {};
    const allSources = {};
    Object.values(usageByDay).forEach(day => {
      Object.entries(day.purposes || {}).forEach(([k, v]) => {
        allPurposes[k] = (allPurposes[k] || 0) + v;
      });
      Object.entries(day.sources || {}).forEach(([k, v]) => {
        allSources[k] = (allSources[k] || 0) + v;
      });
    });
    
    return NextResponse.json({
      chartData,
      summary: {
        totalMessages,
        totalTokens,
        totalCostCents,
        totalCostDollars: (totalCostCents / 100).toFixed(2),
        totalConversations,
        uniqueUsers: allUsers.size,
        activeDays,
        avgMessagesPerDay,
        avgTokensPerDay,
        avgTokensPerMessage,
        peakDay: peakDay ? { date: peakDay.date, tokens: peakDay.tokens } : null,
        growthPercent,
      },
      breakdown: {
        purposes: Object.entries(allPurposes)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
        sources: Object.entries(allSources)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
      },
      period: {
        days,
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
        dataPoints: chartData.length,
      },
      timestamp: new Date().toISOString(),
    });
    
  } catch (err) {
    console.error('[AL Trends] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch AL trends data' }, { status: 500 });
  }
}

export const GET = withErrorLogging(handleGet, { route: 'admin/al-trends', feature: 'internal' });









