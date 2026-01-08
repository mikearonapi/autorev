/**
 * Financial Data API
 * 
 * Comprehensive financial reporting for the admin dashboard.
 * Provides P&L data, revenue breakdown, cost analysis, and monthly trends.
 * 
 * @route GET /api/admin/financials?range=month&year=2024&month=12
 * @route POST /api/admin/financials/cost - Add cost entry
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { isAdminEmail } from '@/lib/adminAccess';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Default cost structure (used when no database entries exist)
const DEFAULT_MONTHLY_COSTS = {
  infrastructure: {
    supabase: { name: 'Supabase Pro', amount: 4500, gl_code: '6110' },
    vercel: { name: 'Vercel Pro', amount: 2000, gl_code: '6120' },
    domain: { name: 'Domain & DNS', amount: 100, gl_code: '6130' },
  },
  development: {
    cursor: { name: 'Cursor Max', amount: 20000, gl_code: '6210' },
    claude: { name: 'Claude Pro', amount: 10000, gl_code: '6220' },
  },
  ai_services: {
    anthropic_api: { name: 'Anthropic API (Variable)', amount: 0, gl_code: '5100', variable: true },
    openai_api: { name: 'OpenAI Embeddings', amount: 200, gl_code: '5100', variable: true },
  },
};

// Revenue pricing
const SUBSCRIPTION_PRICING = {
  free: 0,
  collector: 499,      // $4.99/mo in cents
  tuner: 999,          // $9.99/mo in cents
  enterprise: 4999,    // $49.99/mo in cents
};

const AL_TOKEN_PRICING = {
  starter: { credits: 50, price: 499 },
  plus: { credits: 200, price: 1499 },
  pro: { credits: 500, price: 2999 },
};

// Helper: Get date range
function getDateRange(range, year, month) {
  const now = new Date();
  let startDate, endDate;
  
  switch (range) {
    case 'day':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = now;
      break;
    case 'week':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      endDate = now;
      break;
    case 'month':
      if (year && month) {
        startDate = new Date(year, month - 1, 1);
        endDate = new Date(year, month, 0, 23, 59, 59);
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
      }
      break;
    case 'year':
      startDate = new Date(year || now.getFullYear(), 0, 1);
      endDate = new Date(year || now.getFullYear(), 11, 31, 23, 59, 59);
      break;
    case 'all':
    default:
      startDate = new Date('2024-01-01');
      endDate = now;
      break;
  }
  
  return { start: startDate.toISOString(), end: endDate.toISOString() };
}

// Helper: Calculate estimated AI costs based on usage
function estimateAICosts(conversations, avgTokensPerConversation = 2000) {
  const inputCostPerMillion = 3;   // Claude Sonnet input
  const outputCostPerMillion = 15;  // Claude Sonnet output
  
  const totalTokens = conversations * avgTokensPerConversation;
  const inputTokens = totalTokens * 0.7;
  const outputTokens = totalTokens * 0.3;
  
  const cost = (
    (inputTokens / 1_000_000) * inputCostPerMillion +
    (outputTokens / 1_000_000) * outputCostPerMillion
  );
  
  return Math.round(cost * 100); // Return cents
}

// Helper: Build P&L structure
function buildPLStructure(revenue, costs, productDevCosts = 0) {
  const totalRevenue = Object.values(revenue).reduce((sum, v) => sum + v, 0);
  const totalCOGS = costs.cogs || 0;
  const grossProfit = totalRevenue - totalCOGS;
  
  // Sum all operating expense categories
  const operatingExpenses = (costs.infrastructure || 0) + 
                           (costs.development || 0) + 
                           (costs.marketing || 0) + 
                           (costs.professional || 0) +
                           (costs.insurance || 0) +
                           (costs.administrative || 0) +
                           (costs.personnel || 0) +
                           (costs.data_content || 0) +
                           (costs.ai_services || 0) +
                           (costs.other || 0);
  
  const operatingIncome = grossProfit - operatingExpenses;
  const incomeBeforeTax = operatingIncome - productDevCosts;
  
  // Estimate taxes (only on positive income)
  const taxRate = 0.25;
  const estimatedTax = incomeBeforeTax > 0 ? Math.round(incomeBeforeTax * taxRate) : 0;
  const netIncome = incomeBeforeTax - estimatedTax;
  
  return {
    revenue: {
      subscriptions: revenue.subscriptions || 0,
      alTokens: revenue.alTokens || 0,
      advertising: revenue.advertising || 0,
      other: revenue.other || 0,
      total: totalRevenue,
    },
    cogs: {
      aiServices: costs.cogs || 0,
      total: totalCOGS,
    },
    grossProfit,
    grossMargin: totalRevenue > 0 ? (grossProfit / totalRevenue * 100).toFixed(1) : 0,
    operatingExpenses: {
      infrastructure: costs.infrastructure || 0,
      development: costs.development || 0,
      marketing: costs.marketing || 0,
      professional: costs.professional || 0,
      insurance: costs.insurance || 0,
      administrative: costs.administrative || 0,
      personnel: costs.personnel || 0,
      data_content: costs.data_content || 0,
      ai_services: costs.ai_services || 0,
      other: costs.other || 0,
      total: operatingExpenses,
    },
    operatingIncome,
    operatingMargin: totalRevenue > 0 ? (operatingIncome / totalRevenue * 100).toFixed(1) : 0,
    productDevelopment: productDevCosts,
    incomeBeforeTax,
    taxRate,
    estimatedTax,
    netIncome,
    netMargin: totalRevenue > 0 ? (netIncome / totalRevenue * 100).toFixed(1) : 0,
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || 'month';
  const year = searchParams.get('year') ? parseInt(searchParams.get('year')) : new Date().getFullYear();
  const month = searchParams.get('month') ? parseInt(searchParams.get('month')) : new Date().getMonth() + 1;
  
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
    
    const dateRange = getDateRange(range, year, month);
    
    // Fetch data in parallel
    const [
      userProfilesResult,
      alConversationsResult,
      costEntriesResult,
      monthlyFinancialsResult,
      glAccountsResult,
    ] = await Promise.all([
      // User data for the period
      supabase.from('user_profiles')
        .select('id, subscription_tier, created_at')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end),
      
      // AL conversations for variable cost estimation
      supabase.from('al_conversations')
        .select('id, created_at')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end),
      
      // Cost entries with GL account info for proper categorization
      supabase.from('cost_entries')
        .select(`
          *,
          gl_account:gl_accounts(id, code, name, category, subcategory)
        `)
        .gte('entry_date', dateRange.start.split('T')[0])
        .lte('entry_date', dateRange.end.split('T')[0]),
      
      // Monthly summaries
      supabase.from('monthly_financials')
        .select('*')
        .order('fiscal_year', { ascending: false })
        .order('fiscal_month', { ascending: false })
        .limit(12),
      
      // GL Accounts for reference
      supabase.from('gl_accounts')
        .select('id, code, name, category')
        .eq('is_active', true),
    ]);
    
    const userProfiles = userProfilesResult.data || [];
    const alConversations = alConversationsResult.data || [];
    const costEntries = costEntriesResult.data || [];
    const monthlyFinancials = monthlyFinancialsResult.data || [];
    const glAccounts = glAccountsResult.data || [];
    
    // Get all users for metrics
    const allUsersResult = await supabase.from('user_profiles').select('subscription_tier');
    const allUsers = allUsersResult.data || [];
    
    // Calculate ACTUAL revenue from revenue_transactions table only
    // (Not from tier assignments - those don't mean payment was collected)
    const revenueResult = await supabase.from('revenue_transactions')
      .select('amount_cents, revenue_source')
      .gte('transaction_date', dateRange.start.split('T')[0])
      .lte('transaction_date', dateRange.end.split('T')[0]);
    
    const actualRevenue = (revenueResult.data || []).reduce((acc, txn) => {
      const source = txn.revenue_source?.toLowerCase() || 'other';
      if (source === 'subscription') acc.subscriptions += txn.amount_cents;
      else if (source === 'al_tokens') acc.alTokens += txn.amount_cents;
      else if (source === 'advertising') acc.advertising += txn.amount_cents;
      else acc.other += txn.amount_cents;
      return acc;
    }, { subscriptions: 0, alTokens: 0, advertising: 0, other: 0 });
    
    // Calculate POTENTIAL MRR (what we'd earn if paid tiers converted)
    // This is separate from actual revenue
    const potentialMRR = allUsers.reduce((total, user) => {
      const tier = user.subscription_tier || 'free';
      return total + (SUBSCRIPTION_PRICING[tier] || 0);
    }, 0);
    
    // Estimate variable AI costs
    const estimatedAICosts = estimateAICosts(alConversations.length);
    
    // =========================================================================
    // GL-BASED COST CATEGORIZATION
    // Use GL account category for bulletproof classification
    // =========================================================================
    
    // Categorize by GL account category (most reliable)
    // Normalize category to lowercase for consistent matching
    const costsByGLCategory = costEntries.reduce((acc, entry) => {
      // Use GL account category if available, fall back to is_product_development flag
      const rawCategory = entry.gl_account?.category || 
        (entry.is_product_development ? 'product_development' : 'operating_expenses');
      // Normalize to lowercase for consistent matching
      const glCategory = rawCategory.toLowerCase();
      
      if (!acc[glCategory]) {
        acc[glCategory] = { total: 0, entries: [] };
      }
      acc[glCategory].total += entry.amount_cents;
      acc[glCategory].entries.push(entry);
      return acc;
    }, {});
    
    // Operating expenses (GL category = operating_expenses, codes 6xxx)
    const operatingExpenses = costsByGLCategory['operating_expenses']?.total || 
                              costsByGLCategory['operating_expense']?.total || 0;
    
    // R&D / Product Development (GL category = product_development or r_and_d, codes 7xxx)
    const productDevCosts = costsByGLCategory['product_development']?.total || 
                            costsByGLCategory['r_and_d']?.total || 0;
    
    // COGS (GL category = cogs, codes 5xxx) - variable costs tied to usage
    const cogsCosts = (costsByGLCategory['cogs']?.total || 0) + estimatedAICosts;
    
    // Break down operating expenses by subcategory for detailed reporting
    const opExEntries = costsByGLCategory['operating_expenses']?.entries || 
                        costsByGLCategory['operating_expense']?.entries || [];
    const opExBySubcategory = opExEntries.reduce((acc, entry) => {
        const rawSubcategory = entry.gl_account?.subcategory || entry.cost_category || 'other';
        // Normalize to lowercase for consistent matching
        const subcategory = rawSubcategory.toLowerCase();
        acc[subcategory] = (acc[subcategory] || 0) + entry.amount_cents;
        return acc;
      }, {});
    
    // Fixed vs variable (for backwards compatibility)
    const fixedCosts = operatingExpenses;
    const variableCosts = cogsCosts;
    
    // Legacy costsByCategory for backwards compatibility (normalized to lowercase)
    const costsByCategory = {
      infrastructure: opExBySubcategory['infrastructure'] || 0,
      development: opExBySubcategory['development'] || opExBySubcategory['development_tools'] || 0,
      marketing: opExBySubcategory['marketing'] || 0,
      professional: opExBySubcategory['professional'] || opExBySubcategory['professional_services'] || 0,
      insurance: opExBySubcategory['insurance'] || opExBySubcategory['software'] || 0,
      administrative: opExBySubcategory['administrative'] || 0,
      personnel: opExBySubcategory['personnel'] || 0,
      data_content: opExBySubcategory['data_content'] || 0,
      ai_services: opExBySubcategory['ai_services'] || 0,
      other: opExBySubcategory['other'] || 0,
    };
    
    // Get detailed breakdown by vendor
    const costsByVendor = costEntries.reduce((acc, entry) => {
      const vendor = entry.vendor || 'Other';
      if (!acc[vendor]) {
        acc[vendor] = { amount: 0, glCode: entry.gl_account?.code, glCategory: entry.gl_account?.category, entries: [] };
      }
      acc[vendor].amount += entry.amount_cents;
      acc[vendor].entries.push({
        date: entry.entry_date,
        description: entry.description,
        amount: entry.amount_cents,
        type: entry.cost_type,
        glCode: entry.gl_account?.code,
        glAccount: entry.gl_account?.name,
        glCategory: entry.gl_account?.category,
      });
      return acc;
    }, {});
    
    // Build revenue structure from ACTUAL transactions only
    const revenue = {
      subscriptions: actualRevenue.subscriptions,
      alTokens: actualRevenue.alTokens,
      advertising: actualRevenue.advertising,
      other: actualRevenue.other,
    };
    
    // Build cost structure - use actual entries, fall back to defaults only if no entries
    const hasEntries = costEntries.length > 0;
    const costs = {
      cogs: estimatedAICosts,
      infrastructure: hasEntries ? (costsByCategory.infrastructure || 0) : 6600,
      development: hasEntries ? (costsByCategory.development || 0) : 30000,
      marketing: costsByCategory.marketing || 0,
      professional: costsByCategory.professional || 0,
      insurance: costsByCategory.insurance || 0,
      administrative: costsByCategory.administrative || 0,
      personnel: costsByCategory.personnel || 0,
      data_content: costsByCategory.data_content || 0,
      ai_services: costsByCategory.ai_services || 0,
      other: costsByCategory.other || 0,
    };
    
    // Build P&L
    const pnl = buildPLStructure(revenue, costs, productDevCosts);
    
    // Format cost entries for display
    const formattedCostEntries = costEntries.map(entry => ({
      id: entry.id,
      date: entry.entry_date,
      category: entry.cost_category,
      type: entry.cost_type,
      vendor: entry.vendor,
      amount: entry.amount_cents / 100,
      description: entry.description,
      isProductDev: entry.is_product_development,
      isRecurring: entry.is_recurring,
    }));
    
    // Monthly trend data
    const monthlyTrend = monthlyFinancials.map(m => ({
      period: `${m.fiscal_year}-${String(m.fiscal_month).padStart(2, '0')}`,
      year: m.fiscal_year,
      month: m.fiscal_month,
      revenue: m.total_revenue_cents / 100,
      costs: m.total_costs_cents / 100,
      productDev: m.product_dev_costs_cents / 100,
      netIncome: m.net_income_cents / 100,
      users: m.total_users,
      payingUsers: m.paying_users,
    }));
    
    // Executive metrics
    const totalUsers = allUsers.length;
    const payingUsers = allUsers.filter(u => u.subscription_tier && u.subscription_tier !== 'free').length;
    const actualMRR = actualRevenue.subscriptions; // Actual collected MRR
    const arr = actualMRR * 12; // Annual Recurring Revenue
    const burnRate = (costs.infrastructure + costs.development + costs.cogs) / 100;
    const runway = burnRate > 0 ? 'N/A (self-funded)' : 'Infinite';
    
    // Break-even analysis
    const avgRevenuePerPaidUser = 750; // $7.50 blended
    const monthlyFixedCosts = (costs.infrastructure + costs.development) / 100;
    const usersNeededForBreakeven = Math.ceil(monthlyFixedCosts / (avgRevenuePerPaidUser / 100));
    
    const response = {
      period: {
        range,
        year,
        month,
        startDate: dateRange.start,
        endDate: dateRange.end,
      },
      
      executive: {
        totalUsers,
        payingUsers,
        conversionRate: totalUsers > 0 ? ((payingUsers / totalUsers) * 100).toFixed(1) : 0,
        mrr: actualMRR / 100,           // Actual collected revenue
        potentialMRR: potentialMRR / 100, // What we'd earn if all tiers paid
        arr: arr / 100,
        burnRate,
        runway,
        breakEvenUsers: usersNeededForBreakeven,
        currentProgress: ((payingUsers / usersNeededForBreakeven) * 100).toFixed(1), // Based on paying users, not total
      },
      
      pnl,
      
      revenue: {
        bySource: {
          subscriptions: { amount: revenue.subscriptions / 100, percentage: revenue.subscriptions > 0 ? 100 : 0 },
          alTokens: { amount: revenue.alTokens / 100, percentage: 0 },
          advertising: { amount: revenue.advertising / 100, percentage: 0 },
          other: { amount: revenue.other / 100, percentage: 0 },
        },
        byTier: allUsers.reduce((acc, u) => {
          const tier = u.subscription_tier || 'free';
          acc[tier] = (acc[tier] || 0) + 1;
          return acc;
        }, {}),
        pricing: SUBSCRIPTION_PRICING,
        tokenPricing: AL_TOKEN_PRICING,
      },
      
      costs: {
        // GL-based categorization (primary source of truth)
        byGLCategory: {
          operatingExpenses: operatingExpenses / 100,  // 6xxx accounts
          cogs: cogsCosts / 100,                       // 5xxx accounts
          rAndD: productDevCosts / 100,                // 7xxx accounts
        },
        
        // Operating expense breakdown by subcategory
        operatingBreakdown: {
          infrastructure: (costsByCategory.infrastructure || 0) / 100,
          development: (costsByCategory.development || 0) / 100,
          marketing: (costsByCategory.marketing || 0) / 100,
          professional: (costsByCategory.professional || 0) / 100,
          software: (costsByCategory.software || 0) / 100,
          other: (costsByCategory.other || 0) / 100,
        },
        
        // Simplified structure for dashboard (all in dollars, not cents)
        fixed: {
          infrastructure: operatingExpenses > 0 ? (opExBySubcategory['INFRASTRUCTURE'] || costsByCategory.infrastructure || 6600) / 100 : 66,
          development: operatingExpenses > 0 ? (opExBySubcategory['DEVELOPMENT'] || costsByCategory.development || 30000) / 100 : 300,
          total: operatingExpenses > 0 ? operatingExpenses / 100 : 366,
        },
        variable: {
          aiServices: estimatedAICosts / 100,
          total: variableCosts / 100,
        },
        productDevelopment: productDevCosts / 100,
        totalAllCosts: (operatingExpenses + cogsCosts + productDevCosts) / 100,
        
        // Explicit fixed totals for dashboard
        fixedTotal: operatingExpenses > 0 ? operatingExpenses / 100 : 366,
        variableTotal: variableCosts / 100,
        
        // Detailed entries
        entries: formattedCostEntries,
        byVendor: Object.entries(costsByVendor).map(([vendor, data]) => ({
          vendor,
          amount: data.amount / 100,
          glCode: data.glCode,
          glCategory: data.glCategory,
          entries: data.entries.map(e => ({ ...e, amount: e.amount / 100 })),
        })),
        
        defaultStructure: DEFAULT_MONTHLY_COSTS,
      },
      
      monthlyTrend,
      
      glAccounts: glAccounts.map(gl => ({
        id: gl.id,
        code: gl.code,
        name: gl.name,
        category: gl.category,
      })),
      
      timestamp: new Date().toISOString(),
    };
    
    return NextResponse.json(response);
    
  } catch (err) {
    console.error('[Financials API] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch financial data' }, { status: 500 });
  }
}

// POST: Add cost entry
export async function POST(request) {
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
    
    const body = await request.json();
    const {
      entryDate,
      glAccountId,
      costCategory,
      costType,
      vendor,
      amountCents,
      description,
      isRecurring,
      recurrencePeriod,
      isProductDevelopment,
    } = body;
    
    // Validate required fields
    if (!entryDate || !costCategory || !costType || !amountCents || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const date = new Date(entryDate);
    
    const { data, error } = await supabase.from('cost_entries').insert({
      entry_date: entryDate,
      gl_account_id: glAccountId || null,
      cost_category: costCategory,
      cost_type: costType,
      vendor: vendor || null,
      amount_cents: amountCents,
      description,
      is_recurring: isRecurring || false,
      recurrence_period: recurrencePeriod || null,
      fiscal_month: date.getMonth() + 1,
      fiscal_year: date.getFullYear(),
      is_product_development: isProductDevelopment || false,
      created_by: user.id,
    }).select().single();
    
    if (error) {
      console.error('[Financials API] Insert error:', error);
      return NextResponse.json({ error: 'Failed to add cost entry' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, entry: data });
    
  } catch (err) {
    console.error('[Financials API] Error:', err);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

// PATCH: Update cost entry
export async function PATCH(request) {
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
    
    const body = await request.json();
    const {
      id,
      entryDate,
      glAccountId,
      costCategory,
      costType,
      vendor,
      amountCents,
      description,
      isRecurring,
      recurrencePeriod,
      isProductDevelopment,
    } = body;
    
    // Validate required fields
    if (!id) {
      return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 });
    }
    
    if (!entryDate || !costCategory || !costType || !amountCents || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const date = new Date(entryDate);
    
    const { data, error } = await supabase.from('cost_entries')
      .update({
        entry_date: entryDate,
        gl_account_id: glAccountId || null,
        cost_category: costCategory,
        cost_type: costType,
        vendor: vendor || null,
        amount_cents: amountCents,
        description,
        is_recurring: isRecurring || false,
        recurrence_period: recurrencePeriod || null,
        fiscal_month: date.getMonth() + 1,
        fiscal_year: date.getFullYear(),
        is_product_development: isProductDevelopment || false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('[Financials API] Update error:', error);
      return NextResponse.json({ error: 'Failed to update cost entry' }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({ error: 'Cost entry not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, entry: data });
    
  } catch (err) {
    console.error('[Financials API] Error:', err);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

// DELETE: Remove cost entry
export async function DELETE(request) {
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
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 });
    }
    
    const { error } = await supabase.from('cost_entries')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('[Financials API] Delete error:', error);
      return NextResponse.json({ error: 'Failed to delete cost entry' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, deleted: id });
    
  } catch (err) {
    console.error('[Financials API] Error:', err);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
