/**
 * Stripe Admin API
 * 
 * Fetches real-time Stripe metrics for the admin dashboard:
 * - Revenue (MRR, ARR, total)
 * - Subscriptions (active, churned, by tier)
 * - Payments (recent, by type)
 * - Customers (total, new, active)
 * - Balance (available, pending)
 * 
 * @route GET /api/admin/stripe
 */

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { isAdminEmail } from '@/lib/adminAccess';
import { createClient } from '@supabase/supabase-js';
import { 
  SUBSCRIPTION_TIERS, 
  AL_CREDIT_PACKS, 
  getTierFromPriceId,
  getCreditPackFromPriceId,
} from '@/lib/stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Get date range based on period
 */
function getDateRange(range) {
  const now = new Date();
  const endTime = Math.floor(now.getTime() / 1000);
  let startTime;

  switch (range) {
    case 'day':
      startTime = endTime - (24 * 60 * 60);
      break;
    case 'week':
      startTime = endTime - (7 * 24 * 60 * 60);
      break;
    case 'month':
      startTime = endTime - (30 * 24 * 60 * 60);
      break;
    case 'year':
      startTime = endTime - (365 * 24 * 60 * 60);
      break;
    case 'all':
    default:
      startTime = Math.floor(new Date('2024-01-01').getTime() / 1000);
      break;
  }

  return { startTime, endTime };
}

/**
 * Calculate MRR from active subscriptions
 */
function calculateMRR(subscriptions) {
  return subscriptions
    .filter(sub => sub.status === 'active' || sub.status === 'trialing')
    .reduce((total, sub) => {
      const item = sub.items?.data?.[0];
      if (!item) return total;
      
      const amount = item.price?.unit_amount || 0;
      const interval = item.price?.recurring?.interval;
      
      // Normalize to monthly
      if (interval === 'year') {
        return total + Math.round(amount / 12);
      }
      return total + amount;
    }, 0);
}

/**
 * Group subscriptions by tier
 */
function groupSubscriptionsByTier(subscriptions) {
  const tiers = {
    collector: { name: 'Enthusiast', count: 0, mrr: 0 },
    tuner: { name: 'Tuner', count: 0, mrr: 0 },
    unknown: { name: 'Other', count: 0, mrr: 0 },
  };

  for (const sub of subscriptions) {
    if (sub.status !== 'active' && sub.status !== 'trialing') continue;
    
    const priceId = sub.items?.data?.[0]?.price?.id;
    const tier = getTierFromPriceId(priceId) || 'unknown';
    const amount = sub.items?.data?.[0]?.price?.unit_amount || 0;
    
    if (tiers[tier]) {
      tiers[tier].count++;
      tiers[tier].mrr += amount;
    } else {
      tiers.unknown.count++;
      tiers.unknown.mrr += amount;
    }
  }

  return tiers;
}

/**
 * Group payments by type (subscription, credit pack, donation)
 */
function categorizePayments(paymentIntents, charges) {
  const categories = {
    subscriptions: { count: 0, amount: 0 },
    creditPacks: { count: 0, amount: 0, credits: 0 },
    donations: { count: 0, amount: 0 },
    other: { count: 0, amount: 0 },
  };

  // Process payment intents
  for (const pi of paymentIntents) {
    if (pi.status !== 'succeeded') continue;
    
    const metadata = pi.metadata || {};
    const amount = pi.amount || 0;
    
    if (metadata.type === 'subscription' || pi.invoice) {
      categories.subscriptions.count++;
      categories.subscriptions.amount += amount;
    } else if (metadata.type === 'credit_pack' || metadata.credits) {
      categories.creditPacks.count++;
      categories.creditPacks.amount += amount;
      categories.creditPacks.credits += parseInt(metadata.credits) || 0;
    } else if (metadata.type === 'donation') {
      categories.donations.count++;
      categories.donations.amount += amount;
    } else {
      categories.other.count++;
      categories.other.amount += amount;
    }
  }

  return categories;
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
    // Verify user is admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { startTime, endTime } = getDateRange(range);

    // Fetch data from Stripe in parallel
    const [
      balance,
      subscriptions,
      paymentIntents,
      charges,
      customers,
      invoices,
      products,
    ] = await Promise.all([
      // Current balance
      stripe.balance.retrieve(),

      // All subscriptions (for MRR calculation)
      stripe.subscriptions.list({ limit: 100, status: 'all' }),

      // Payment intents in range
      stripe.paymentIntents.list({
        limit: 100,
        created: { gte: startTime, lte: endTime },
      }),

      // Charges in range
      stripe.charges.list({
        limit: 100,
        created: { gte: startTime, lte: endTime },
      }),

      // All customers
      stripe.customers.list({ limit: 100 }),

      // Recent invoices
      stripe.invoices.list({
        limit: 50,
        created: { gte: startTime, lte: endTime },
      }),

      // Products for reference
      stripe.products.list({ limit: 20, active: true }),
    ]);

    // Calculate metrics
    const allSubscriptions = subscriptions.data || [];
    const activeSubscriptions = allSubscriptions.filter(
      s => s.status === 'active' || s.status === 'trialing'
    );
    const canceledSubscriptions = allSubscriptions.filter(
      s => s.status === 'canceled'
    );
    
    // Revenue calculations
    const mrr = calculateMRR(allSubscriptions);
    const arr = mrr * 12;
    const subscriptionsByTier = groupSubscriptionsByTier(allSubscriptions);
    
    // Payment categorization
    const paymentCategories = categorizePayments(
      paymentIntents.data || [],
      charges.data || []
    );

    // Calculate total revenue in period
    const totalRevenueInPeriod = (paymentIntents.data || [])
      .filter(pi => pi.status === 'succeeded')
      .reduce((sum, pi) => sum + (pi.amount || 0), 0);

    // Customer metrics
    const allCustomers = customers.data || [];
    const newCustomersInPeriod = allCustomers.filter(
      c => c.created >= startTime && c.created <= endTime
    );

    // Recent payments for display
    const recentPayments = (paymentIntents.data || [])
      .filter(pi => pi.status === 'succeeded')
      .slice(0, 10)
      .map(pi => ({
        id: pi.id,
        amount: pi.amount,
        currency: pi.currency,
        created: new Date(pi.created * 1000).toISOString(),
        customer: pi.customer,
        description: pi.description,
        metadata: pi.metadata,
        receipt_email: pi.receipt_email,
      }));

    // Invoice metrics
    const allInvoices = invoices.data || [];
    const paidInvoices = allInvoices.filter(i => i.status === 'paid');
    const openInvoices = allInvoices.filter(i => i.status === 'open');
    const overdueInvoices = allInvoices.filter(
      i => i.status === 'open' && i.due_date && i.due_date < endTime
    );

    // Build response
    const response = {
      period: {
        range,
        startDate: new Date(startTime * 1000).toISOString(),
        endDate: new Date(endTime * 1000).toISOString(),
      },

      // Account balance
      balance: {
        available: balance.available?.reduce((sum, b) => sum + b.amount, 0) || 0,
        pending: balance.pending?.reduce((sum, b) => sum + b.amount, 0) || 0,
        currency: balance.available?.[0]?.currency || 'usd',
      },

      // Revenue metrics
      revenue: {
        mrr: mrr,
        arr: arr,
        periodTotal: totalRevenueInPeriod,
        byCategory: {
          subscriptions: paymentCategories.subscriptions.amount,
          creditPacks: paymentCategories.creditPacks.amount,
          donations: paymentCategories.donations.amount,
          other: paymentCategories.other.amount,
        },
      },

      // Subscription metrics
      subscriptions: {
        active: activeSubscriptions.length,
        trialing: allSubscriptions.filter(s => s.status === 'trialing').length,
        canceled: canceledSubscriptions.length,
        pastDue: allSubscriptions.filter(s => s.status === 'past_due').length,
        total: allSubscriptions.length,
        byTier: subscriptionsByTier,
        churnRate: allSubscriptions.length > 0
          ? ((canceledSubscriptions.length / allSubscriptions.length) * 100).toFixed(1)
          : 0,
      },

      // Customer metrics
      customers: {
        total: allCustomers.length,
        newInPeriod: newCustomersInPeriod.length,
        withSubscription: activeSubscriptions.length,
        conversionRate: allCustomers.length > 0
          ? ((activeSubscriptions.length / allCustomers.length) * 100).toFixed(1)
          : 0,
      },

      // Payment metrics
      payments: {
        count: paymentCategories.subscriptions.count +
               paymentCategories.creditPacks.count +
               paymentCategories.donations.count +
               paymentCategories.other.count,
        byType: {
          subscriptions: paymentCategories.subscriptions,
          creditPacks: {
            ...paymentCategories.creditPacks,
            totalCredits: paymentCategories.creditPacks.credits,
          },
          donations: paymentCategories.donations,
          other: paymentCategories.other,
        },
        recent: recentPayments,
      },

      // Invoice metrics
      invoices: {
        total: allInvoices.length,
        paid: paidInvoices.length,
        open: openInvoices.length,
        overdue: overdueInvoices.length,
        paidAmount: paidInvoices.reduce((sum, i) => sum + (i.amount_paid || 0), 0),
        openAmount: openInvoices.reduce((sum, i) => sum + (i.amount_due || 0), 0),
      },

      // Products
      products: (products.data || []).map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        active: p.active,
      })),

      // Stripe dashboard link
      dashboardUrl: 'https://dashboard.stripe.com',

      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);

  } catch (err) {
    console.error('[Stripe Admin API] Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch Stripe data', details: err.message },
      { status: 500 }
    );
  }
}

