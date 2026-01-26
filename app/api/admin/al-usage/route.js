/**
 * AL Usage by User API
 * 
 * Returns aggregated AL usage data per user for admin analytics.
 * Shows tokens consumed, estimated costs, and usage patterns.
 * 
 * @route GET /api/admin/al-usage
 */

import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering - this route uses request.headers and request.url
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

import { isAdminEmail } from '@/lib/adminAccess';
import { ANTHROPIC_PRICING } from '@/lib/alConfig';
import { withErrorLogging } from '@/lib/serverErrorLogger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function handleGet(request) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || 'month';
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  
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
    // Verify user is admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    // Calculate date range
    const now = new Date();
    let startDate;
    switch (range) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'all':
        startDate = new Date('2024-01-01');
        break;
    }
    
    // Fetch all usage logs for the period
    const { data: usageLogs, error: logsError } = await supabase
      .from('al_usage_logs')
      .select('user_id, input_tokens, output_tokens, cost_cents, tool_calls, created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });
    
    if (logsError) {
      console.error('[AL Usage API] Error fetching logs:', logsError);
      return NextResponse.json({ error: 'Failed to fetch usage logs' }, { status: 500 });
    }
    
    // Get unique user IDs from logs
    const userIds = [...new Set(usageLogs?.map(log => log.user_id) || [])];
    
    // Fetch user profiles for these users
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, display_name, subscription_tier')
      .in('id', userIds);
    
    // Also fetch auth users for email (admin only operation via service role)
    const { data: authUsers, error: authUsersError } = await supabase.auth.admin.listUsers();
    
    // Build user lookup maps
    const profileMap = new Map();
    profiles?.forEach(p => profileMap.set(p.id, p));
    
    const emailMap = new Map();
    if (!authUsersError && authUsers?.users) {
      authUsers.users.forEach(u => emailMap.set(u.id, u.email));
    }
    
    // Aggregate usage by user
    const userUsageMap = new Map();
    
    usageLogs?.forEach(log => {
      const userId = log.user_id;
      if (!userId) return;
      
      if (!userUsageMap.has(userId)) {
        userUsageMap.set(userId, {
          userId,
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          costCents: 0,
          messageCount: 0,
          toolCalls: {},
          firstUsage: log.created_at,
          lastUsage: log.created_at,
        });
      }
      
      const userData = userUsageMap.get(userId);
      const inputTokens = log.input_tokens || 0;
      const outputTokens = log.output_tokens || 0;
      const costCents = parseFloat(log.cost_cents) || 0;
      
      userData.inputTokens += inputTokens;
      userData.outputTokens += outputTokens;
      userData.totalTokens += inputTokens + outputTokens;
      userData.costCents += costCents;
      userData.messageCount += 1;
      
      // Track first/last usage
      if (log.created_at < userData.firstUsage) {
        userData.firstUsage = log.created_at;
      }
      if (log.created_at > userData.lastUsage) {
        userData.lastUsage = log.created_at;
      }
      
      // Track tool calls
      if (log.tool_calls && Array.isArray(log.tool_calls)) {
        log.tool_calls.forEach(tool => {
          userData.toolCalls[tool] = (userData.toolCalls[tool] || 0) + 1;
        });
      }
    });
    
    // Convert to array and enrich with user info
    const userUsageArray = Array.from(userUsageMap.values()).map(usage => {
      const profile = profileMap.get(usage.userId);
      const email = emailMap.get(usage.userId);
      
      // ALWAYS calculate estimated cost from tokens for accurate display
      // (stored cost_cents may be 0 for unlimited users, or inaccurate from legacy data)
      const inputCostDollars = usage.inputTokens * ANTHROPIC_PRICING.inputPricePerToken;
      const outputCostDollars = usage.outputTokens * ANTHROPIC_PRICING.outputPricePerToken;
      const estimatedCostCents = Math.round((inputCostDollars + outputCostDollars) * 100 * 100) / 100;
      
      // Get top tools
      const topTools = Object.entries(usage.toolCalls)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tool, count]) => ({ tool, count }));
      
      return {
        userId: usage.userId,
        email: email || 'Unknown',
        displayName: profile?.display_name || null,
        tier: profile?.subscription_tier || 'free',
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        totalTokens: usage.totalTokens,
        costCents: usage.costCents,
        estimatedCostCents,
        estimatedCostDollars: (estimatedCostCents / 100).toFixed(4),
        messageCount: usage.messageCount,
        avgTokensPerMessage: usage.messageCount > 0 
          ? Math.round(usage.totalTokens / usage.messageCount) 
          : 0,
        avgCostPerMessage: usage.messageCount > 0 
          ? (estimatedCostCents / usage.messageCount / 100).toFixed(4) 
          : '0.0000',
        topTools,
        firstUsage: usage.firstUsage,
        lastUsage: usage.lastUsage,
      };
    });
    
    // Sort by total tokens (descending)
    userUsageArray.sort((a, b) => b.totalTokens - a.totalTokens);
    
    // Calculate totals
    const totals = userUsageArray.reduce(
      (acc, user) => {
        acc.inputTokens += user.inputTokens;
        acc.outputTokens += user.outputTokens;
        acc.totalTokens += user.totalTokens;
        acc.costCents += user.costCents;
        acc.estimatedCostCents += user.estimatedCostCents;
        acc.messageCount += user.messageCount;
        return acc;
      },
      { inputTokens: 0, outputTokens: 0, totalTokens: 0, costCents: 0, estimatedCostCents: 0, messageCount: 0 }
    );
    
    // Get max tokens for chart scaling
    const maxTokens = userUsageArray.length > 0 ? userUsageArray[0].totalTokens : 0;
    
    // Find the user with max cost for percentage calculations
    const maxCost = Math.max(...userUsageArray.map(u => u.estimatedCostCents), 0);
    
    return NextResponse.json({
      period: {
        range,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
      },
      
      // All users (for expanded view)
      users: userUsageArray,
      
      // Top 10 for default view
      topUsers: userUsageArray.slice(0, 10),
      
      // Totals
      totals: {
        users: userUsageArray.length,
        inputTokens: totals.inputTokens,
        outputTokens: totals.outputTokens,
        totalTokens: totals.totalTokens,
        costCents: totals.costCents,
        estimatedCostCents: totals.estimatedCostCents,
        estimatedCostDollars: (totals.estimatedCostCents / 100).toFixed(2),
        messageCount: totals.messageCount,
        avgCostPerUser: userUsageArray.length > 0 
          ? (totals.estimatedCostCents / userUsageArray.length / 100).toFixed(4)
          : '0.0000',
        avgMessagesPerUser: userUsageArray.length > 0 
          ? Math.round(totals.messageCount / userUsageArray.length)
          : 0,
      },
      
      // For chart scaling
      maxTokens,
      maxCost,
      
      timestamp: now.toISOString(),
    });
    
  } catch (err) {
    console.error('[AL Usage API] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch AL usage data' }, { status: 500 });
  }
}

export const GET = withErrorLogging(handleGet, { route: 'admin/al-usage', feature: 'internal' });

