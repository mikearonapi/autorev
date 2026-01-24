'use client';

/**
 * StripeDashboard Component
 * 
 * Comprehensive Stripe revenue dashboard for the admin panel.
 * Displays:
 * - Revenue KPIs (MRR, ARR, Total)
 * - Subscription metrics by tier
 * - Recent payments
 * - Customer metrics
 * - Balance information
 */

import { useState } from 'react';
import styles from './StripeDashboard.module.css';
import { KPICard } from './KPICard';
import { useAdminStripe } from '@/hooks/useAdminData';

// Icons
const StripeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" />
    <path d="M9 12c0-1.5 1.5-2 3-2s2.5.5 2.5 2c0 1.5-1 2-2.5 2.5" />
    <path d="M12 17v.5" />
  </svg>
);

const DollarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const TrendingUpIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const UsersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const CreditCardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const WalletIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
    <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
  </svg>
);

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 4v6h-6" />
    <path d="M1 20v-6h6" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

// Format currency in dollars
function formatCurrency(cents, currency = 'usd') {
  const amount = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Format relative time
function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Subscription tier badge component
function TierBadge({ tier }) {
  const tierStyles = {
    collector: { bg: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' },
    tuner: { bg: 'rgba(168, 85, 247, 0.2)', color: '#a855f7' },
    unknown: { bg: 'rgba(148, 163, 184, 0.2)', color: '#94a3b8' },
  };

  const style = tierStyles[tier] || tierStyles.unknown;

  return (
    <span 
      className={styles.tierBadge} 
      style={{ background: style.bg, color: style.color }}
    >
      {tier === 'collector' ? 'Enthusiast' : tier === 'tuner' ? 'Tuner' : tier}
    </span>
  );
}

// Payment type badge
function PaymentTypeBadge({ type }) {
  const typeStyles = {
    subscription: { bg: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', label: 'Subscription' },
    creditPacks: { bg: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', label: 'Credits' },
    donations: { bg: 'rgba(236, 72, 153, 0.2)', color: '#ec4899', label: 'Donation' },
    other: { bg: 'rgba(148, 163, 184, 0.2)', color: '#94a3b8', label: 'Other' },
  };

  const style = typeStyles[type] || typeStyles.other;

  return (
    <span className={styles.paymentBadge} style={{ background: style.bg, color: style.color }}>
      {style.label}
    </span>
  );
}

export function StripeDashboard({ token, range = 'month', loading: parentLoading = false }) {
  // Use React Query hook for Stripe data
  const { 
    data, 
    isLoading: loading, 
    error: queryError,
    refetch: fetchStripeData,
  } = useAdminStripe(range);
  
  const error = queryError?.message || null;

  const isLoading = loading || parentLoading;
  
  // Check if error is a configuration issue
  const isConfigError = error?.includes('503') || error?.includes('not configured');

  if (error) {
    // Show a helpful configuration setup message
    if (isConfigError) {
      return (
        <div className={styles.configNeeded}>
          <div className={styles.configIcon}>
            <svg viewBox="0 0 60 25" className={styles.stripeLogoLarge}>
              <path fill="#635BFF" d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a10.34 10.34 0 0 1-4.56.95c-4.01 0-6.83-2.5-6.83-7.28 0-4.19 2.39-7.32 6.3-7.32 3.87 0 5.93 3.13 5.93 7.28 0 .4-.02 1.06-.03 1.45zm-6-4.84c-1.07 0-2 .8-2.2 2.52h4.33c-.11-1.65-.88-2.52-2.13-2.52zM39.88 17.9c-1.52 0-2.57-.38-3.48-1.01l-.05 4.34-4.14.88V5.87h3.67l.21 1.09c.93-.88 2.18-1.35 3.48-1.35 3.39 0 5.58 2.92 5.58 6.11 0 3.81-2.4 6.18-5.27 6.18zm-.72-8.46c-.92 0-1.61.32-2.12.85l.06 4.45c.49.5 1.16.81 2.06.81 1.55 0 2.58-1.32 2.58-3.08 0-1.74-1.03-3.03-2.58-3.03zM29.59 5.87v12.17h-4.15V5.87zm0-5.07v3.06h-4.15V.8zM24.13 5.87l-3.4 12.17H16.4l-1.54-6.01c-.07-.28-.11-.53-.15-.74l-.15.74-1.54 6.01H8.68L5.28 5.87h4.25l1.39 6.3.19.98.2-.98 1.7-6.3h3.57l1.7 6.3.2.98.19-.98 1.39-6.3zM0 10.96c0-3.02 2.42-4.9 6.62-4.9 1.58 0 3.09.27 4.46.81V9.8a8.7 8.7 0 0 0-3.48-.75c-1.54 0-2.4.42-2.4 1.13 0 2.23 6.53.76 6.53 5.56 0 2.92-2.31 4.9-6.62 4.9-1.97 0-4.02-.46-5.11-1.15v-3.03c1.27.74 3.12 1.27 4.59 1.27 1.58 0 2.42-.4 2.42-1.15C6.51 14.24 0 16.04 0 10.96z"/>
            </svg>
          </div>
          <h3 className={styles.configTitle}>Stripe Integration Required</h3>
          <p className={styles.configDesc}>
            To view revenue data, you need to connect your Stripe account.
          </p>
          
          <div className={styles.configSteps}>
            <h4>Setup Steps:</h4>
            <ol>
              <li>
                Go to your{' '}
                <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer">
                  Stripe Dashboard → Developers → API keys
                </a>
              </li>
              <li>Copy your <strong>Secret key</strong> (starts with <code>sk_</code>)</li>
              <li>
                Add to your <code>.env.local</code> file:
                <pre className={styles.configCode}>STRIPE_SECRET_KEY=sk_live_xxxxx</pre>
              </li>
              <li>Restart your development server</li>
            </ol>
          </div>
          
          <div className={styles.configActions}>
            <a 
              href="https://dashboard.stripe.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.stripeButton}
            >
              Open Stripe Dashboard <ExternalLinkIcon />
            </a>
            <button onClick={fetchStripeData} className={styles.retryButton}>
              <RefreshIcon /> Retry Connection
            </button>
          </div>
        </div>
      );
    }
    
    // General error state
    return (
      <div className={styles.errorState}>
        <p>Failed to load Stripe data: {error}</p>
        <button onClick={fetchStripeData} className={styles.retryButton}>
          <RefreshIcon /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <div className={styles.stripeLogoWrapper}>
            <svg viewBox="0 0 60 25" className={styles.stripeLogo}>
              <path fill="#635BFF" d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a10.34 10.34 0 0 1-4.56.95c-4.01 0-6.83-2.5-6.83-7.28 0-4.19 2.39-7.32 6.3-7.32 3.87 0 5.93 3.13 5.93 7.28 0 .4-.02 1.06-.03 1.45zm-6-4.84c-1.07 0-2 .8-2.2 2.52h4.33c-.11-1.65-.88-2.52-2.13-2.52zM39.88 17.9c-1.52 0-2.57-.38-3.48-1.01l-.05 4.34-4.14.88V5.87h3.67l.21 1.09c.93-.88 2.18-1.35 3.48-1.35 3.39 0 5.58 2.92 5.58 6.11 0 3.81-2.4 6.18-5.27 6.18zm-.72-8.46c-.92 0-1.61.32-2.12.85l.06 4.45c.49.5 1.16.81 2.06.81 1.55 0 2.58-1.32 2.58-3.08 0-1.74-1.03-3.03-2.58-3.03zM29.59 5.87v12.17h-4.15V5.87zm0-5.07v3.06h-4.15V.8zM24.13 5.87l-3.4 12.17H16.4l-1.54-6.01c-.07-.28-.11-.53-.15-.74l-.15.74-1.54 6.01H8.68L5.28 5.87h4.25l1.39 6.3.19.98.2-.98 1.7-6.3h3.57l1.7 6.3.2.98.19-.98 1.39-6.3zM0 10.96c0-3.02 2.42-4.9 6.62-4.9 1.58 0 3.09.27 4.46.81V9.8a8.7 8.7 0 0 0-3.48-.75c-1.54 0-2.4.42-2.4 1.13 0 2.23 6.53.76 6.53 5.56 0 2.92-2.31 4.9-6.62 4.9-1.97 0-4.02-.46-5.11-1.15v-3.03c1.27.74 3.12 1.27 4.59 1.27 1.58 0 2.42-.4 2.42-1.15C6.51 14.24 0 16.04 0 10.96z"/>
            </svg>
          </div>
          <div>
            <h3>Stripe Revenue</h3>
            <p>Real-time payment and subscription data</p>
          </div>
        </div>
        
        <div className={styles.headerActions}>
          <button 
            onClick={fetchStripeData} 
            className={styles.refreshButton}
            disabled={isLoading}
            title="Refresh data"
          >
            <RefreshIcon className={isLoading ? styles.spinning : ''} />
          </button>
          <a 
            href="https://dashboard.stripe.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.stripeLink}
          >
            Open Dashboard <ExternalLinkIcon />
          </a>
        </div>
      </div>

      {/* Revenue KPIs */}
      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Revenue Metrics</h4>
        <div className={styles.kpiGrid}>
          <KPICard
            label="MRR"
            value={formatCurrency(data?.revenue?.mrr || 0)}
            interpretation="Monthly Recurring Revenue from active subscriptions"
            sparklineColor="#22c55e"
            icon={<TrendingUpIcon />}
            loading={isLoading}
            compact
          />
          
          <KPICard
            label="ARR"
            value={formatCurrency(data?.revenue?.arr || 0)}
            interpretation="Annual Recurring Revenue (MRR × 12)"
            sparklineColor="#3b82f6"
            icon={<DollarIcon />}
            loading={isLoading}
            compact
          />
          
          <KPICard
            label="Period Revenue"
            value={formatCurrency(data?.revenue?.periodTotal || 0)}
            interpretation={`Total collected revenue this ${range === 'day' ? 'day' : range === 'week' ? 'week' : range === 'month' ? 'month' : 'period'}`}
            sparklineColor="#8b5cf6"
            icon={<CreditCardIcon />}
            loading={isLoading}
            compact
          />
          
          <KPICard
            label="Available Balance"
            value={formatCurrency(data?.balance?.available || 0)}
            interpretation={`${formatCurrency(data?.balance?.pending || 0)} pending`}
            sparklineColor="#f59e0b"
            icon={<WalletIcon />}
            loading={isLoading}
            compact
          />
        </div>
      </section>

      {/* Business Health Metrics */}
      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Business Health</h4>
        <div className={styles.kpiGrid}>
          <KPICard
            label="LTV"
            value={formatCurrency(data?.metrics?.ltv || 0)}
            interpretation="Customer Lifetime Value (ARPU / Churn)"
            sparklineColor="#10b981"
            icon={<TrendingUpIcon />}
            loading={isLoading}
            compact
          />
          
          <KPICard
            label="ARPU"
            value={formatCurrency(data?.metrics?.arpu || 0)}
            interpretation="Average Revenue Per User (monthly)"
            sparklineColor="#6366f1"
            icon={<DollarIcon />}
            loading={isLoading}
            compact
          />
          
          <KPICard
            label="Churn Rate"
            value={`${data?.subscriptions?.churnRate || data?.metrics?.churnRate || 0}%`}
            interpretation="Monthly subscription cancellation rate"
            sparklineColor={parseFloat(data?.subscriptions?.churnRate || 0) > 5 ? '#ef4444' : '#22c55e'}
            icon={<UsersIcon />}
            loading={isLoading}
            compact
          />
          
          <KPICard
            label="Trial Conversion"
            value={`${data?.metrics?.trialConversionRate || 0}%`}
            interpretation={`${data?.metrics?.trialConversions || 0} of ${data?.metrics?.totalTrials || 0} trials converted`}
            sparklineColor="#8b5cf6"
            icon={<TrendingUpIcon />}
            loading={isLoading}
            compact
          />
        </div>
      </section>

      {/* Subscriptions Section */}
      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Subscriptions</h4>
        <div className={styles.subscriptionsGrid}>
          {/* Subscription Stats */}
          <div className={styles.statsCard}>
            <div className={styles.statHeader}>
              <span className={styles.statLabel}>Overview</span>
            </div>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{data?.subscriptions?.active || 0}</span>
                <span className={styles.statLabel}>Active</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{data?.subscriptions?.trialing || 0}</span>
                <span className={styles.statLabel}>Trialing</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{data?.subscriptions?.pastDue || 0}</span>
                <span className={styles.statLabel}>Past Due</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{data?.subscriptions?.churnRate || 0}%</span>
                <span className={styles.statLabel}>Churn Rate</span>
              </div>
            </div>
          </div>

          {/* By Tier */}
          <div className={styles.tiersCard}>
            <div className={styles.statHeader}>
              <span className={styles.statLabel}>By Tier</span>
            </div>
            <div className={styles.tiersList}>
              {data?.subscriptions?.byTier && Object.entries(data.subscriptions.byTier).map(([tier, info]) => (
                info.count > 0 && (
                  <div key={tier} className={styles.tierRow}>
                    <div className={styles.tierInfo}>
                      <TierBadge tier={tier} />
                      <span className={styles.tierCount}>{info.count} subscribers</span>
                    </div>
                    <span className={styles.tierMRR}>{formatCurrency(info.mrr)}/mo</span>
                  </div>
                )
              ))}
              {(!data?.subscriptions?.byTier || 
                Object.values(data.subscriptions.byTier).every(t => t.count === 0)) && (
                <p className={styles.emptyState}>No active subscriptions yet</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Revenue Breakdown */}
      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Revenue Breakdown</h4>
        <div className={styles.breakdownGrid}>
          <div className={styles.breakdownCard}>
            <div className={styles.breakdownIcon} style={{ background: 'rgba(34, 197, 94, 0.2)' }}>
              <TrendingUpIcon style={{ color: '#22c55e' }} />
            </div>
            <div className={styles.breakdownContent}>
              <span className={styles.breakdownLabel}>Subscriptions</span>
              <span className={styles.breakdownValue}>
                {formatCurrency(data?.revenue?.byCategory?.subscriptions || 0)}
              </span>
              <span className={styles.breakdownSub}>
                {data?.payments?.byType?.subscriptions?.count || 0} payments
              </span>
            </div>
          </div>

          <div className={styles.breakdownCard}>
            <div className={styles.breakdownIcon} style={{ background: 'rgba(245, 158, 11, 0.2)' }}>
              <CreditCardIcon style={{ color: '#f59e0b' }} />
            </div>
            <div className={styles.breakdownContent}>
              <span className={styles.breakdownLabel}>AL Credit Packs</span>
              <span className={styles.breakdownValue}>
                {formatCurrency(data?.revenue?.byCategory?.creditPacks || 0)}
              </span>
              <span className={styles.breakdownSub}>
                {data?.payments?.byType?.creditPacks?.totalCredits || 0} credits sold
              </span>
            </div>
          </div>

          <div className={styles.breakdownCard}>
            <div className={styles.breakdownIcon} style={{ background: 'rgba(236, 72, 153, 0.2)' }}>
              <UsersIcon style={{ color: '#ec4899' }} />
            </div>
            <div className={styles.breakdownContent}>
              <span className={styles.breakdownLabel}>Donations</span>
              <span className={styles.breakdownValue}>
                {formatCurrency(data?.revenue?.byCategory?.donations || 0)}
              </span>
              <span className={styles.breakdownSub}>
                {data?.payments?.byType?.donations?.count || 0} supporters
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Metrics */}
      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Customers</h4>
        <div className={styles.customersGrid}>
          <div className={styles.customerStat}>
            <span className={styles.customerValue}>{data?.customers?.total || 0}</span>
            <span className={styles.customerLabel}>Total Customers</span>
          </div>
          <div className={styles.customerStat}>
            <span className={styles.customerValue}>{data?.customers?.newInPeriod || 0}</span>
            <span className={styles.customerLabel}>New This Period</span>
          </div>
          <div className={styles.customerStat}>
            <span className={styles.customerValue}>{data?.customers?.withSubscription || 0}</span>
            <span className={styles.customerLabel}>Subscribers</span>
          </div>
          <div className={styles.customerStat}>
            <span className={styles.customerValue}>{data?.customers?.conversionRate || 0}%</span>
            <span className={styles.customerLabel}>Conversion Rate</span>
          </div>
        </div>
      </section>

      {/* Recent Payments */}
      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Recent Payments</h4>
        <div className={styles.paymentsTable}>
          {data?.payments?.recent?.length > 0 ? (
            <div className={styles.tableWrapper}>
              <table>
                <thead>
                  <tr>
                    <th>Amount</th>
                    <th>Type</th>
                    <th>Customer</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payments.recent.map((payment) => (
                    <tr key={payment.id}>
                      <td className={styles.amountCell}>
                        {formatCurrency(payment.amount, payment.currency)}
                      </td>
                      <td>
                        <PaymentTypeBadge 
                          type={payment.metadata?.type || (payment.description?.includes('Subscription') ? 'subscription' : 'other')} 
                        />
                      </td>
                      <td className={styles.customerCell}>
                        {payment.receipt_email || payment.customer?.substring(0, 14) || '-'}
                      </td>
                      <td className={styles.timeCell}>
                        {formatRelativeTime(payment.created)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className={styles.emptyState}>
              {isLoading ? 'Loading payments...' : 'No payments in this period'}
            </p>
          )}
        </div>
      </section>

      {/* Charges & Refunds Summary */}
      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Charges & Refunds</h4>
        <div className={styles.chargesGrid}>
          <div className={styles.chargeStat}>
            <span className={styles.chargeValue}>{data?.charges?.successful || 0}</span>
            <span className={styles.chargeLabel}>Successful</span>
            <span className={styles.chargeAmount + ' ' + styles.positive}>
              {formatCurrency(data?.charges?.successAmount || 0)}
            </span>
          </div>
          <div className={styles.chargeStat}>
            <span className={styles.chargeValue}>{data?.charges?.failed || 0}</span>
            <span className={styles.chargeLabel}>Failed</span>
            <span className={styles.chargeAmount + ' ' + styles.warning}>
              {formatCurrency(data?.charges?.failedAmount || 0)}
            </span>
          </div>
          <div className={styles.chargeStat}>
            <span className={styles.chargeValue}>{data?.refunds?.count || 0}</span>
            <span className={styles.chargeLabel}>Refunded</span>
            <span className={styles.chargeAmount + ' ' + styles.negative}>
              -{formatCurrency(data?.refunds?.totalAmount || 0)}
            </span>
          </div>
          <div className={styles.chargeStat + ' ' + styles.netRevenue}>
            <span className={styles.chargeLabel}>Net Revenue</span>
            <span className={styles.chargeValue}>
              {formatCurrency(data?.netRevenue?.net || 0)}
            </span>
          </div>
        </div>
      </section>

      {/* Disputes (Chargebacks) */}
      {(data?.disputes?.open > 0 || data?.disputes?.lost > 0 || data?.disputes?.won > 0) && (
        <section className={styles.section}>
          <h4 className={styles.sectionTitle + ' ' + styles.warningTitle}>Disputes & Chargebacks</h4>
          <div className={styles.disputesGrid}>
            <div className={styles.disputeStat + (data?.disputes?.open > 0 ? ' ' + styles.urgent : '')}>
              <span className={styles.disputeValue}>{data?.disputes?.open || 0}</span>
              <span className={styles.disputeLabel}>Needs Response</span>
            </div>
            <div className={styles.disputeStat}>
              <span className={styles.disputeValue}>{data?.disputes?.won || 0}</span>
              <span className={styles.disputeLabel}>Won</span>
            </div>
            <div className={styles.disputeStat + (data?.disputes?.lost > 0 ? ' ' + styles.lost : '')}>
              <span className={styles.disputeValue}>{data?.disputes?.lost || 0}</span>
              <span className={styles.disputeLabel}>Lost</span>
            </div>
            <div className={styles.disputeStat}>
              <span className={styles.disputeLabel}>Total Disputed</span>
              <span className={styles.disputeValue}>{formatCurrency(data?.disputes?.totalAmount || 0)}</span>
            </div>
          </div>
        </section>
      )}

      {/* Invoice Summary */}
      {data?.invoices && (
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>Invoices</h4>
          <div className={styles.invoicesGrid}>
            <div className={styles.invoiceStat}>
              <span className={styles.invoiceValue}>{data.invoices.paid}</span>
              <span className={styles.invoiceLabel}>Paid</span>
              <span className={styles.invoiceAmount}>{formatCurrency(data.invoices.paidAmount)}</span>
            </div>
            <div className={styles.invoiceStat}>
              <span className={styles.invoiceValue}>{data.invoices.open}</span>
              <span className={styles.invoiceLabel}>Open</span>
              <span className={styles.invoiceAmount}>{formatCurrency(data.invoices.openAmount)}</span>
            </div>
            <div className={styles.invoiceStat + (data.invoices.overdue > 0 ? ` ${styles.overdue}` : '')}>
              <span className={styles.invoiceValue}>{data.invoices.overdue}</span>
              <span className={styles.invoiceLabel}>Overdue</span>
            </div>
          </div>
        </section>
      )}

      {/* Products with Pricing */}
      {data?.products?.length > 0 && (
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>Products & Pricing</h4>
          <div className={styles.productsGrid}>
            {data.products.map((product) => (
              <div key={product.id} className={styles.productCard}>
                <div className={styles.productHeader}>
                  <span className={styles.productName}>{product.name}</span>
                  {product.prices?.length > 0 && (
                    <span className={styles.productPrice}>
                      {product.prices[0].interval 
                        ? `${formatCurrency(product.prices[0].amount)}/${product.prices[0].interval}`
                        : formatCurrency(product.prices[0].amount)
                      }
                    </span>
                  )}
                </div>
                {product.description && (
                  <p className={styles.productDescription}>{product.description}</p>
                )}
                <span className={styles.productId}>{product.id}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Timestamp */}
      {data?.timestamp && (
        <div className={styles.footer}>
          <span>Last synced: {new Date(data.timestamp).toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}

export default StripeDashboard;

