'use client';

/**
 * Unit Economics Component
 * 
 * Key SaaS metrics for CFO-level financial analysis:
 * - CAC (Customer Acquisition Cost)
 * - LTV (Lifetime Value)
 * - ARPU (Average Revenue Per User)
 * - LTV:CAC Ratio
 * - Cash Runway
 * 
 * Per data visualization rules:
 * - Interpretive title (Rule 4.1)
 * - KPI cards with context (Rule 2)
 */

import { Tooltip } from './Tooltip';
import styles from './UnitEconomics.module.css';

function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '$0.00';
  return `$${parseFloat(amount).toFixed(2)}`;
}

function formatMonths(months) {
  if (months === Infinity || isNaN(months) || months < 0) return '∞';
  if (months >= 12) return `${(months / 12).toFixed(1)} years`;
  return `${months.toFixed(0)} months`;
}

// SVG Icons
const DollarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12,6 12,12 16,14"/>
  </svg>
);

const TrendIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/>
    <polyline points="17,6 23,6 23,12"/>
  </svg>
);

// Generate interpretive title (Rule 4.1)
function generateInterpretiveTitle(ltvCacRatio, runway, conversionRate, payingUsers) {
  if (ltvCacRatio >= 3) {
    return `Strong unit economics with ${ltvCacRatio.toFixed(1)}x LTV:CAC ratio`;
  }
  if (runway !== Infinity && runway < 6) {
    return `⚠️ Cash runway under 6 months — action needed`;
  }
  if (conversionRate > 0 && payingUsers > 0) {
    return `${conversionRate.toFixed(0)}% conversion to paid with ${payingUsers} paying user${payingUsers !== 1 ? 's' : ''}`;
  }
  if (ltvCacRatio > 0 && ltvCacRatio < 3) {
    return `Building economics: ${ltvCacRatio.toFixed(1)}x LTV:CAC, targeting 3x`;
  }
  return 'Pre-revenue phase — building user base';
}

export function UnitEconomics({ 
  financials, 
  users, 
  cashBalance = 0, // Would come from actual bank integration
  loading = false 
}) {
  if (loading) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>Calculating unit economics...</h3>
        <div className={styles.loading}>Analyzing metrics</div>
      </div>
    );
  }
  
  // Calculate metrics
  const totalUsers = users?.total || 0;
  const payingUsers = financials?.executive?.payingUsers || 0;
  const monthlyRevenue = ((financials?.pnl?.revenue?.total || 0) / 100);
  const monthlyOpex = ((financials?.pnl?.operatingExpenses?.total || 0) / 100);
  const marketingSpend = ((financials?.pnl?.operatingExpenses?.marketing || 0) / 100);
  
  // ARPU (Average Revenue Per User) - monthly
  const arpu = totalUsers > 0 ? monthlyRevenue / totalUsers : 0;
  
  // CAC (Customer Acquisition Cost)
  // In early stage, use total marketing spend / new users acquired
  const newUsers = users?.newThisPeriod || totalUsers;
  const cac = newUsers > 0 ? marketingSpend / newUsers : 0;
  
  // LTV (Lifetime Value) - simplified: ARPU * expected lifetime (assume 24 months)
  const expectedLifetimeMonths = 24;
  const ltv = arpu * expectedLifetimeMonths;
  
  // LTV:CAC Ratio
  const ltvCacRatio = cac > 0 ? ltv / cac : ltv > 0 ? Infinity : 0;
  
  // Conversion Rate
  const conversionRate = totalUsers > 0 ? (payingUsers / totalUsers * 100) : 0;
  
  // Cash Runway (months until cash runs out at current burn)
  const monthlyBurn = monthlyOpex - monthlyRevenue;
  const runway = monthlyBurn > 0 ? cashBalance / monthlyBurn : Infinity;
  
  // Health indicators
  const getLtvCacHealth = (ratio) => {
    if (ratio >= 3) return { status: 'healthy', label: 'Healthy (3x+)' };
    if (ratio >= 1) return { status: 'warning', label: 'Improving' };
    return { status: 'critical', label: 'Below 1x' };
  };
  
  const getRunwayHealth = (months) => {
    if (months === Infinity) return { status: 'healthy', label: 'Sustainable' };
    if (months >= 12) return { status: 'healthy', label: '12+ months' };
    if (months >= 6) return { status: 'warning', label: '6-12 months' };
    return { status: 'critical', label: '<6 months' };
  };
  
  const ltvCacHealth = getLtvCacHealth(ltvCacRatio);
  const runwayHealth = getRunwayHealth(runway);
  
  // Generate interpretive title (no useMemo needed - simple calculation)
  const interpretiveTitle = generateInterpretiveTitle(ltvCacRatio, runway, conversionRate, payingUsers);
  
  return (
    <div className={styles.container}>
      <h3 className={styles.title}>{interpretiveTitle}</h3>
      <span className={styles.subtitle}>Unit Economics</span>
      
      {/* Primary Metrics */}
      <div className={styles.metricsGrid}>
        <div className={styles.metric}>
          <div className={styles.metricHeader}>
            <span className={styles.metricIcon}><DollarIcon /></span>
            <span className={styles.metricLabel}>
              <Tooltip metric="ARPU">ARPU</Tooltip>
            </span>
          </div>
          <span className={styles.metricValue}>{formatCurrency(arpu)}</span>
          <span className={styles.metricSubtext}>per user/month</span>
        </div>
        
        <div className={styles.metric}>
          <div className={styles.metricHeader}>
            <span className={styles.metricIcon}><DollarIcon /></span>
            <span className={styles.metricLabel}>
              <Tooltip metric="LTV">LTV</Tooltip>
            </span>
          </div>
          <span className={styles.metricValue}>{formatCurrency(ltv)}</span>
          <span className={styles.metricSubtext}>24-month projected</span>
        </div>
        
        <div className={styles.metric}>
          <div className={styles.metricHeader}>
            <span className={styles.metricIcon}><DollarIcon /></span>
            <span className={styles.metricLabel}>
              <Tooltip metric="CAC">CAC</Tooltip>
            </span>
          </div>
          <span className={styles.metricValue}>{cac > 0 ? formatCurrency(cac) : '$0'}</span>
          <span className={styles.metricSubtext}>{marketingSpend > 0 ? 'per acquired user' : 'organic growth'}</span>
        </div>
        
        <div className={styles.metric}>
          <div className={styles.metricHeader}>
            <span className={styles.metricIcon}><TrendIcon /></span>
            <span className={styles.metricLabel}>
              <Tooltip metric="CONVERSION">Conversion</Tooltip>
            </span>
          </div>
          <span className={styles.metricValue}>{conversionRate.toFixed(1)}%</span>
          <span className={styles.metricSubtext}>{payingUsers} of {totalUsers} users</span>
        </div>
      </div>
      
      {/* Key Ratios */}
      <div className={styles.ratios}>
        <div className={`${styles.ratioCard} ${styles[ltvCacHealth.status]}`}>
          <div className={styles.ratioHeader}>
            <span className={styles.ratioLabel}>
              <Tooltip metric="LTV_CAC">LTV:CAC Ratio</Tooltip>
            </span>
            <span className={`${styles.ratioBadge} ${styles[ltvCacHealth.status]}`}>
              {ltvCacHealth.label}
            </span>
          </div>
          <span className={styles.ratioValue}>
            {ltvCacRatio === Infinity ? '∞' : ltvCacRatio.toFixed(1)}x
          </span>
          <span className={styles.ratioNote}>
            {cac === 0 
              ? 'No marketing spend yet - organic acquisition' 
              : ltvCacRatio >= 3 
                ? 'Strong unit economics' 
                : 'Improve acquisition efficiency'
            }
          </span>
        </div>
        
        <div className={`${styles.ratioCard} ${styles[runwayHealth.status]}`}>
          <div className={styles.ratioHeader}>
            <span className={styles.ratioLabel}>
              <Tooltip metric="RUNWAY">Cash Runway</Tooltip>
            </span>
            <span className={`${styles.ratioBadge} ${styles[runwayHealth.status]}`}>
              {runwayHealth.label}
            </span>
          </div>
          <span className={styles.ratioValue}>
            <ClockIcon /> {formatMonths(runway)}
          </span>
          <span className={styles.ratioNote}>
            {monthlyBurn <= 0 
              ? 'Revenue covers operating costs'
              : `at ${formatCurrency(monthlyBurn)}/mo burn rate`
            }
          </span>
        </div>
      </div>
      
      {/* Footer Note */}
      <div className={styles.footer}>
        <span className={styles.footerText}>
          Metrics based on current period data. LTV assumes 24-month average customer lifetime.
        </span>
      </div>
    </div>
  );
}

export default UnitEconomics;

