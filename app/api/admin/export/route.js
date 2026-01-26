/**
 * Financial Export API
 * 
 * Export financial data as CSV for reporting.
 * 
 * @route GET /api/admin/export?type=pl|costs|monthly&format=csv
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { isAdminEmail } from '@/lib/adminAccess';
import { withErrorLogging } from '@/lib/serverErrorLogger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Convert array of objects to CSV
function toCSV(data, columns) {
  if (!data || data.length === 0) return '';
  
  const headers = columns || Object.keys(data[0]);
  const rows = data.map(row => 
    headers.map(col => {
      const val = row[col];
      // Escape quotes and wrap in quotes if contains comma
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(',')
  );
  
  return [headers.join(','), ...rows].join('\n');
}

// Format cents to dollars
function centsToDollars(cents) {
  return (cents / 100).toFixed(2);
}

async function handleGet(request) {
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }
  
  // Verify admin access
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    const { searchParams } = new URL(request.url);
    const exportType = searchParams.get('type') || 'monthly';
    const format = searchParams.get('format') || 'csv';
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    
    let csvData = '';
    let filename = '';
    
    switch (exportType) {
      case 'monthly': {
        const FINANCIAL_COLS = 'id, fiscal_year, fiscal_month, revenue_cents, total_fixed_costs_cents, total_variable_costs_cents, net_income_cents, notes, created_at';
        
        // Export monthly financials
        const { data: monthly, error } = await supabase
          .from('monthly_financials')
          .select(FINANCIAL_COLS)
          .order('fiscal_year', { ascending: false })
          .order('fiscal_month', { ascending: false });
        
        if (error) throw error;
        
        const formatted = (monthly || []).map(m => ({
          'Year': m.fiscal_year,
          'Month': m.fiscal_month,
          'Total Revenue': centsToDollars(m.total_revenue_cents),
          'Subscription Revenue': centsToDollars(m.revenue_subscriptions_cents),
          'AI Token Revenue': centsToDollars(m.revenue_al_tokens_cents),
          'Advertising Revenue': centsToDollars(m.revenue_advertising_cents),
          'Other Revenue': centsToDollars(m.revenue_other_cents),
          'Infrastructure Costs': centsToDollars(m.cost_infrastructure_cents),
          'AI Services Costs': centsToDollars(m.cost_ai_services_cents),
          'Development Tools': centsToDollars(m.cost_development_tools_cents),
          'Marketing Costs': centsToDollars(m.cost_marketing_cents),
          'Personnel Costs': centsToDollars(m.cost_personnel_cents),
          'Other Costs': centsToDollars(m.cost_other_cents),
          'Total Fixed Costs': centsToDollars(m.total_fixed_costs_cents),
          'Total Variable Costs': centsToDollars(m.total_variable_costs_cents),
          'Product Development': centsToDollars(m.product_dev_costs_cents),
          'Gross Profit': centsToDollars(m.gross_profit_cents),
          'Operating Income': centsToDollars(m.operating_income_cents),
          'Net Income': centsToDollars(m.net_income_cents),
          'Total Users': m.total_users,
          'Paying Users': m.paying_users,
          'New Users': m.new_users,
          'ARPU': centsToDollars(m.arpu_cents),
        }));
        
        csvData = toCSV(formatted);
        filename = `autorev-monthly-financials-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      }
      
      case 'costs': {
        // Export cost entries
        let query = supabase
          .from('cost_entries')
          .select(`
            *,
            gl_account:gl_accounts(code, name, category, subcategory)
          `)
          .order('entry_date', { ascending: false });
        
        if (year && month) {
          query = query
            .eq('fiscal_year', parseInt(year))
            .eq('fiscal_month', parseInt(month));
        }
        
        const { data: costs, error } = await query;
        if (error) throw error;
        
        const formatted = (costs || []).map(c => ({
          'Date': c.entry_date,
          'GL Code': c.gl_account?.code || '',
          'GL Account': c.gl_account?.name || '',
          'Category': c.gl_account?.category || c.cost_category,
          'Vendor': c.vendor,
          'Amount': centsToDollars(c.amount_cents),
          'Description': c.description,
          'Is Recurring': c.is_recurring ? 'Yes' : 'No',
          'Is R&D': c.is_product_development ? 'Yes' : 'No',
          'Fiscal Year': c.fiscal_year,
          'Fiscal Month': c.fiscal_month,
        }));
        
        csvData = toCSV(formatted);
        filename = `autorev-costs-${year || 'all'}-${month || 'all'}-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      }
      
      case 'pl': {
        // Export P&L summary for a specific period
        const targetYear = year ? parseInt(year) : new Date().getFullYear();
        const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
        
        const FINANCIAL_DETAIL_COLS = 'id, fiscal_year, fiscal_month, revenue_cents, total_fixed_costs_cents, total_variable_costs_cents, net_income_cents, notes, created_at';
        
        const { data: monthData, error } = await supabase
          .from('monthly_financials')
          .select(FINANCIAL_DETAIL_COLS)
          .eq('fiscal_year', targetYear)
          .eq('fiscal_month', targetMonth)
          .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        
        const m = monthData || {};
        
        const plLines = [
          { 'Line Item': 'REVENUE', 'Amount': '' },
          { 'Line Item': '  Subscription Revenue', 'Amount': centsToDollars(m.revenue_subscriptions_cents || 0) },
          { 'Line Item': '  AI Token Revenue', 'Amount': centsToDollars(m.revenue_al_tokens_cents || 0) },
          { 'Line Item': '  Advertising Revenue', 'Amount': centsToDollars(m.revenue_advertising_cents || 0) },
          { 'Line Item': '  Other Revenue', 'Amount': centsToDollars(m.revenue_other_cents || 0) },
          { 'Line Item': 'TOTAL REVENUE', 'Amount': centsToDollars(m.total_revenue_cents || 0) },
          { 'Line Item': '', 'Amount': '' },
          { 'Line Item': 'COST OF GOODS SOLD', 'Amount': '' },
          { 'Line Item': '  AI Services', 'Amount': centsToDollars(m.cost_ai_services_cents || 0) },
          { 'Line Item': 'GROSS PROFIT', 'Amount': centsToDollars(m.gross_profit_cents || 0) },
          { 'Line Item': '', 'Amount': '' },
          { 'Line Item': 'OPERATING EXPENSES', 'Amount': '' },
          { 'Line Item': '  Infrastructure', 'Amount': centsToDollars(m.cost_infrastructure_cents || 0) },
          { 'Line Item': '  Development Tools', 'Amount': centsToDollars(m.cost_development_tools_cents || 0) },
          { 'Line Item': '  Marketing', 'Amount': centsToDollars(m.cost_marketing_cents || 0) },
          { 'Line Item': '  Personnel', 'Amount': centsToDollars(m.cost_personnel_cents || 0) },
          { 'Line Item': '  Other', 'Amount': centsToDollars(m.cost_other_cents || 0) },
          { 'Line Item': 'TOTAL OPERATING EXPENSES', 'Amount': centsToDollars(m.total_fixed_costs_cents || 0) },
          { 'Line Item': '', 'Amount': '' },
          { 'Line Item': 'RESEARCH & DEVELOPMENT', 'Amount': '' },
          { 'Line Item': '  Product Development', 'Amount': centsToDollars(m.product_dev_costs_cents || 0) },
          { 'Line Item': '', 'Amount': '' },
          { 'Line Item': 'OPERATING INCOME', 'Amount': centsToDollars(m.operating_income_cents || 0) },
          { 'Line Item': 'NET INCOME', 'Amount': centsToDollars(m.net_income_cents || 0) },
        ];
        
        csvData = toCSV(plLines);
        filename = `autorev-pl-${targetYear}-${String(targetMonth).padStart(2, '0')}.csv`;
        break;
      }
      
      case 'users': {
        // Export user growth data
        const { data: users, error } = await supabase
          .from('user_profiles')
          .select('id, created_at, subscription_tier, username')
          .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        const formatted = (users || []).map(u => ({
          'User ID': u.id,
          'Created At': u.created_at,
          'Username': u.username || '',
          'Subscription Tier': u.subscription_tier || 'free',
        }));
        
        csvData = toCSV(formatted);
        filename = `autorev-users-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      }
      
      case 'gl': {
        const ACCOUNT_COLS = 'id, code, name, category, description, is_active, created_at';
        
        // Export GL accounts
        const { data: accounts, error } = await supabase
          .from('gl_accounts')
          .select(ACCOUNT_COLS)
          .order('code', { ascending: true });
        
        if (error) throw error;
        
        const formatted = (accounts || []).map(a => ({
          'Code': a.code,
          'Name': a.name,
          'Category': a.category,
          'Subcategory': a.subcategory || '',
          'Account Type': a.account_type,
          'Description': a.description || '',
          'Active': a.is_active ? 'Yes' : 'No',
        }));
        
        csvData = toCSV(formatted);
        filename = `autorev-gl-chart-of-accounts.csv`;
        break;
      }
      
      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
    }
    
    // Return CSV response
    return new Response(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
    
  } catch (err) {
    console.error('[Export API] Error:', err);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}

export const GET = withErrorLogging(handleGet, { route: 'admin/export', feature: 'admin' });
