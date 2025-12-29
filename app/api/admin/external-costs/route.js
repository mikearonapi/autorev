/**
 * External Cost Tracking API
 * 
 * Aggregates cost data from external services that support billing APIs:
 * - Anthropic Admin API (usage & cost reports)
 * - Google Cloud Billing API (if configured)
 * 
 * Services without APIs (Cursor, Claude Pro subscription, Vercel Pro) must be
 * tracked via manual cost entries in the cost_entries table.
 * 
 * @route GET /api/admin/external-costs
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { isAdminEmail } from '@/lib/adminAccess';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// External API keys
const ANTHROPIC_ADMIN_KEY = process.env.ANTHROPIC_ADMIN_API_KEY;
const GOOGLE_CLOUD_BILLING_KEY = process.env.GOOGLE_CLOUD_BILLING_KEY;
const GOOGLE_CLOUD_PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID;

/**
 * Fetch cost report from Anthropic Admin API
 * Requires ANTHROPIC_ADMIN_API_KEY (different from regular API key)
 * @see https://docs.anthropic.com/en/api/admin-api/usage-cost/get-cost-report
 */
async function fetchAnthropicCosts(startDate, endDate) {
  if (!ANTHROPIC_ADMIN_KEY) {
    return {
      available: false,
      reason: 'ANTHROPIC_ADMIN_API_KEY not configured',
      setupUrl: 'https://console.anthropic.com/settings/admin-api-keys',
      setupSteps: [
        'Go to Anthropic Console → Settings → Admin API Keys',
        'Create a new Admin API key',
        'Add ANTHROPIC_ADMIN_API_KEY to your environment variables',
      ],
    };
  }

  try {
    // Format dates for Anthropic API (YYYY-MM-DD)
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];

    const response = await fetch(
      `https://api.anthropic.com/v1/admin/cost_report?start_date=${start}&end_date=${end}`,
      {
        headers: {
          'x-api-key': ANTHROPIC_ADMIN_KEY,
          'anthropic-version': '2023-06-01',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    // Sum up costs from the report
    const totalCostUSD = data.cost_report?.reduce((sum, entry) => {
      return sum + (entry.cost_usd || 0);
    }, 0) || 0;

    const totalInputTokens = data.cost_report?.reduce((sum, entry) => {
      return sum + (entry.input_tokens || 0);
    }, 0) || 0;

    const totalOutputTokens = data.cost_report?.reduce((sum, entry) => {
      return sum + (entry.output_tokens || 0);
    }, 0) || 0;

    return {
      available: true,
      source: 'anthropic_admin_api',
      period: { start, end },
      totalCostCents: Math.round(totalCostUSD * 100),
      totalCostUSD: totalCostUSD.toFixed(2),
      breakdown: {
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        totalTokens: totalInputTokens + totalOutputTokens,
      },
      byModel: data.cost_report?.reduce((acc, entry) => {
        const model = entry.model || 'unknown';
        if (!acc[model]) {
          acc[model] = { costUSD: 0, inputTokens: 0, outputTokens: 0 };
        }
        acc[model].costUSD += entry.cost_usd || 0;
        acc[model].inputTokens += entry.input_tokens || 0;
        acc[model].outputTokens += entry.output_tokens || 0;
        return acc;
      }, {}) || {},
      raw: data,
    };
  } catch (err) {
    console.error('[External Costs] Anthropic API error:', err);
    return {
      available: false,
      reason: err.message,
      error: true,
    };
  }
}

/**
 * Fetch billing data from Google Cloud Billing API
 * Requires service account with Billing Viewer role
 * @see https://cloud.google.com/billing/docs/reference/rest
 */
async function fetchGoogleCloudCosts(startDate, endDate) {
  if (!GOOGLE_CLOUD_BILLING_KEY || !GOOGLE_CLOUD_PROJECT_ID) {
    return {
      available: false,
      reason: 'Google Cloud Billing not configured',
      setupUrl: 'https://cloud.google.com/billing/docs/how-to/export-data-bigquery',
      setupSteps: [
        'Enable Cloud Billing API in Google Cloud Console',
        'Create a service account with Billing Viewer role',
        'Export billing to BigQuery for detailed analysis',
        'Add GOOGLE_CLOUD_BILLING_KEY and GOOGLE_CLOUD_PROJECT_ID to env',
      ],
    };
  }

  // Note: Google Cloud Billing API requires OAuth2 or service account auth
  // This is a placeholder - real implementation would use google-auth-library
  return {
    available: false,
    reason: 'Google Cloud Billing integration requires additional setup',
    setupUrl: 'https://cloud.google.com/billing/docs/reference/rest/v1/projects.billingInfo',
  };
}

/**
 * Get estimated costs from internal usage tracking
 * This uses our own al_usage_logs table for more granular tracking
 */
async function getInternalUsageEstimates(supabase, startDate, endDate) {
  try {
    const { data: usageLogs, error } = await supabase
      .from('al_usage_logs')
      .select('input_tokens, output_tokens, cost_cents, estimated_cost_cents, created_at, model, purpose')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) throw error;

    // Separate user-facing AI (COGS) from admin AI (OpEx)
    const userUsage = usageLogs?.filter(log => log.purpose !== 'admin_insights') || [];
    const adminUsage = usageLogs?.filter(log => log.purpose === 'admin_insights') || [];

    const calculateTotals = (logs) => ({
      inputTokens: logs.reduce((sum, log) => sum + (log.input_tokens || 0), 0),
      outputTokens: logs.reduce((sum, log) => sum + (log.output_tokens || 0), 0),
      costCents: logs.reduce((sum, log) => sum + (parseFloat(log.estimated_cost_cents) || parseFloat(log.cost_cents) || 0), 0),
      logCount: logs.length,
    });

    return {
      available: true,
      source: 'internal_tracking',
      userAI: {
        ...calculateTotals(userUsage),
        category: 'COGS',
        glCode: '5100',
      },
      adminAI: {
        ...calculateTotals(adminUsage),
        category: 'Operating Expense',
        glCode: '5160',
      },
      total: {
        ...calculateTotals(usageLogs || []),
      },
    };
  } catch (err) {
    console.error('[External Costs] Internal tracking error:', err);
    return {
      available: false,
      reason: err.message,
    };
  }
}

/**
 * Get manual cost entries from database
 */
async function getManualCostEntries(supabase, startDate, endDate) {
  try {
    const { data, error } = await supabase
      .from('cost_entries')
      .select(`
        *,
        gl_account:gl_accounts(code, name, category, subcategory)
      `)
      .gte('entry_date', startDate.toISOString().split('T')[0])
      .lte('entry_date', endDate.toISOString().split('T')[0]);

    if (error) throw error;

    // Group by vendor
    const byVendor = (data || []).reduce((acc, entry) => {
      const vendor = entry.vendor || 'Other';
      if (!acc[vendor]) {
        acc[vendor] = { amountCents: 0, entries: [] };
      }
      acc[vendor].amountCents += entry.amount_cents;
      acc[vendor].entries.push({
        date: entry.entry_date,
        description: entry.description,
        amountCents: entry.amount_cents,
        category: entry.gl_account?.subcategory || entry.cost_category,
      });
      return acc;
    }, {});

    return {
      available: true,
      source: 'manual_entries',
      totalCents: (data || []).reduce((sum, e) => sum + e.amount_cents, 0),
      byVendor,
      entryCount: (data || []).length,
    };
  } catch (err) {
    console.error('[External Costs] Manual entries error:', err);
    return { available: false, reason: err.message };
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || 'month';

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

    // Fetch all cost sources in parallel
    const [anthropicCosts, googleCloudCosts, internalUsage, manualEntries] = await Promise.all([
      fetchAnthropicCosts(startDate, endDate),
      fetchGoogleCloudCosts(startDate, endDate),
      getInternalUsageEstimates(supabase, startDate, endDate),
      getManualCostEntries(supabase, startDate, endDate),
    ]);

    // Calculate totals
    const automatedCostsCents = 
      (anthropicCosts.available ? anthropicCosts.totalCostCents : 0) +
      (googleCloudCosts.available ? googleCloudCosts.totalCostCents || 0 : 0);

    const internalEstimateCents = internalUsage.available ? internalUsage.total?.costCents || 0 : 0;
    const manualCostsCents = manualEntries.available ? manualEntries.totalCents : 0;

    // Configuration status
    const configStatus = {
      anthropicAdminApi: {
        configured: !!ANTHROPIC_ADMIN_KEY,
        status: anthropicCosts.available ? 'connected' : 'not_configured',
        ...(anthropicCosts.setupUrl && { setupUrl: anthropicCosts.setupUrl }),
        ...(anthropicCosts.setupSteps && { setupSteps: anthropicCosts.setupSteps }),
      },
      googleCloudBilling: {
        configured: !!GOOGLE_CLOUD_BILLING_KEY && !!GOOGLE_CLOUD_PROJECT_ID,
        status: googleCloudCosts.available ? 'connected' : 'not_configured',
        ...(googleCloudCosts.setupUrl && { setupUrl: googleCloudCosts.setupUrl }),
        ...(googleCloudCosts.setupSteps && { setupSteps: googleCloudCosts.setupSteps }),
      },
      internalTracking: {
        configured: true,
        status: 'active',
        description: 'Token usage tracked per AL conversation in al_usage_logs table',
      },
      manualEntries: {
        configured: true,
        status: 'active',
        description: 'Manual cost entries via admin dashboard',
      },
    };

    // Services that need manual tracking
    const manualTrackingRequired = [
      {
        service: 'Cursor Pro/Max',
        reason: 'No public billing API',
        currentCost: '$20-$200/month (fixed)',
        recommendation: 'Add monthly cost entry on billing date',
      },
      {
        service: 'Claude Pro (Anthropic subscription)',
        reason: 'Subscription billing, not API',
        currentCost: '$20/month (fixed)',
        recommendation: 'Add monthly cost entry on billing date',
      },
      {
        service: 'Vercel Pro',
        reason: 'No billing API access',
        currentCost: '$20/month (fixed)',
        recommendation: 'Add monthly cost entry on billing date',
      },
      {
        service: 'Domain Registration',
        reason: 'Annual billing',
        currentCost: '$12/year (amortized $1/month)',
        recommendation: 'Add annual cost entry, amortize monthly',
      },
    ];

    return NextResponse.json({
      period: {
        range,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },

      // Automated cost sources (real-time)
      automated: {
        anthropic: anthropicCosts,
        googleCloud: googleCloudCosts,
      },

      // Internal tracking (our own logs)
      internalTracking: internalUsage,

      // Manual cost entries
      manual: manualEntries,

      // Summary
      summary: {
        automatedCostsCents,
        automatedCostsUSD: (automatedCostsCents / 100).toFixed(2),
        internalEstimateCents,
        internalEstimateUSD: (internalEstimateCents / 100).toFixed(2),
        manualCostsCents,
        manualCostsUSD: (manualCostsCents / 100).toFixed(2),
        totalTrackedCents: automatedCostsCents + manualCostsCents,
        totalTrackedUSD: ((automatedCostsCents + manualCostsCents) / 100).toFixed(2),
        note: internalEstimateCents > automatedCostsCents
          ? 'Internal tracking shows higher usage than external API. Review for discrepancies.'
          : 'Cost tracking aligned between internal and external sources.',
      },

      // Configuration status
      configStatus,

      // Services requiring manual tracking
      manualTrackingRequired,

      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error('[External Costs API] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch external costs' }, { status: 500 });
  }
}


