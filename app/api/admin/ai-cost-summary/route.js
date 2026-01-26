/**
 * AI Cost Summary API
 * 
 * Provides comprehensive AI cost analytics including:
 * - User-facing AI costs (COGS)
 * - Backend AI costs (OpEx)
 * - Breakdown by purpose/source
 * - Total Anthropic spend estimate
 * 
 * @route GET /api/admin/ai-cost-summary
 */

import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

import { requireAdmin } from '@/lib/adminAccess';
import { ANTHROPIC_PRICING, calculateTokenCost } from '@/lib/alConfig';
import { withErrorLogging } from '@/lib/serverErrorLogger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function handleGet(request) {
  // Verify admin access
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || 'month';
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Calculate date range
    const endDate = new Date();
    let startDate;
    switch (range) {
      case 'day':
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
      default:
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
        break;
      case 'all':
        startDate = new Date('2024-01-01');
        break;
    }
    
    // Fetch all usage logs
    const { data: usageLogs, error: logsError } = await supabase
      .from('al_usage_logs')
      .select('user_id, purpose, source, input_tokens, output_tokens, cost_cents, estimated_cost_cents, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());
    
    if (logsError) throw logsError;
    
    // Separate user and backend costs
    // User AI: has user_id, or purpose='user_chat'
    // Backend AI: no user_id, or purpose != 'user_chat'
    const userLogs = (usageLogs || []).filter(log => 
      log.user_id !== null || log.purpose === 'user_chat'
    );
    const backendLogs = (usageLogs || []).filter(log => 
      log.user_id === null && log.purpose !== 'user_chat'
    );
    
    // Calculate totals for each category
    // Use estimated_cost_cents for accurate cost (not cost_cents which may be 0 for unlimited users)
    const calcCategoryTotals = (logs) => {
      let inputTokens = 0;
      let outputTokens = 0;
      let costCents = 0;
      
      logs.forEach(log => {
        inputTokens += log.input_tokens || 0;
        outputTokens += log.output_tokens || 0;
        // Prefer estimated_cost_cents, fall back to calculating from tokens
        const logCost = parseFloat(log.estimated_cost_cents) || 
                        parseFloat(log.cost_cents) ||
                        calculateTokenCost(log.input_tokens || 0, log.output_tokens || 0);
        costCents += logCost;
      });
      
      return {
        inputTokens,
        outputTokens,
        costCents: Math.round(costCents * 100) / 100, // Round to 2 decimal places
        costDollars: (costCents / 100).toFixed(2),
        callCount: logs.length,
      };
    };
    
    const userTotals = calcCategoryTotals(userLogs);
    const backendTotals = calcCategoryTotals(backendLogs);
    const grandTotal = {
      inputTokens: userTotals.inputTokens + backendTotals.inputTokens,
      outputTokens: userTotals.outputTokens + backendTotals.outputTokens,
      costCents: userTotals.costCents + backendTotals.costCents,
      costDollars: ((userTotals.costCents + backendTotals.costCents) / 100).toFixed(2),
      callCount: userTotals.callCount + backendTotals.callCount,
    };
    
    // Group by purpose for breakdown
    const byPurpose = {};
    (usageLogs || []).forEach(log => {
      const purpose = log.purpose || 'unknown';
      if (!byPurpose[purpose]) {
        byPurpose[purpose] = {
          purpose,
          inputTokens: 0,
          outputTokens: 0,
          costCents: 0,
          callCount: 0,
        };
      }
      
      const cost = parseFloat(log.estimated_cost_cents) || 
                   parseFloat(log.cost_cents) ||
                   calculateTokenCost(log.input_tokens || 0, log.output_tokens || 0);
      
      byPurpose[purpose].inputTokens += log.input_tokens || 0;
      byPurpose[purpose].outputTokens += log.output_tokens || 0;
      byPurpose[purpose].costCents += cost;
      byPurpose[purpose].callCount++;
    });
    
    // Sort by cost descending
    const purposeList = Object.values(byPurpose)
      .map(p => ({
        ...p,
        costCents: Math.round(p.costCents * 100) / 100,
        tokens: p.inputTokens + p.outputTokens,
      }))
      .sort((a, b) => b.costCents - a.costCents);
    
    // Get user revenue (from al_user_credits spent this month)
    // This helps calculate profit margin on user AI
    const { data: creditData } = await supabase
      .from('al_user_credits')
      .select('spent_cents_this_month')
      .not('is_unlimited', 'eq', true);
    
    const userRevenueCents = (creditData || []).reduce((sum, row) => {
      return sum + (parseFloat(row.spent_cents_this_month) || 0);
    }, 0);
    
    return NextResponse.json({
      period: {
        range,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      
      // User AI (COGS)
      user: {
        ...userTotals,
        category: 'COGS',
        glCode: '5100',
      },
      
      // Backend AI (OpEx)
      backend: {
        ...backendTotals,
        category: 'Operating Expense',
        glCode: '5160',
      },
      
      // Grand Total
      total: grandTotal,
      
      // Breakdown by purpose
      byPurpose: purposeList,
      
      // User revenue for margin calculation
      userRevenue: {
        cents: userRevenueCents,
        dollars: (userRevenueCents / 100).toFixed(2),
      },
      
      // Model info
      model: {
        name: ANTHROPIC_PRICING.model,
        inputPricePer1K: ANTHROPIC_PRICING.inputPricePer1K,
        outputPricePer1K: ANTHROPIC_PRICING.outputPricePer1K,
      },
      
      timestamp: new Date().toISOString(),
    });
    
  } catch (err) {
    console.error('[AI Cost Summary API] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch AI cost summary' }, { status: 500 });
  }
}

export const GET = withErrorLogging(handleGet, { route: 'admin/ai-cost-summary', feature: 'admin' });










