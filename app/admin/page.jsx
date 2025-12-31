'use client';

/**
 * Admin Dashboard - Executive Command Center
 * 
 * A comprehensive growth-focused dashboard for CEO/COO/CFO.
 * Features:
 * - Tabbed navigation (Overview, Financials, Growth, Operations)
 * - Time-range filtering (Today, 7D, 30D, All Time)
 * - Hero KPIs with sparklines
 * - User growth and funnel analytics
 * - Full P&L statement with GL structure
 * - Monthly financial trends
 * - Cost entry management
 * - Operations monitoring
 * 
 * Access restricted to admin users only.
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { isAdminEmail } from '@/lib/adminAccess';

// Components
import { TabNav } from './components/TabNav';
import { TimeRangeToggle } from './components/TimeRangeToggle';
import { KPICard } from './components/KPICard';
import { GrowthChart } from './components/GrowthChart';
import { FunnelChart } from './components/FunnelChart';
import { CostBreakdown } from './components/CostBreakdown';
import { BreakEvenProgress } from './components/BreakEvenProgress';
import { SystemHealth } from './components/SystemHealth';
import { ContentStats } from './components/ContentStats';
import { AlertsList } from './components/AlertsList';
import { PLStatement } from './components/PLStatement';
import { MonthlyTrend } from './components/MonthlyTrend';
import { CostInputForm } from './components/CostInputForm';
import { UsageEstimate } from './components/UsageEstimate';
import { RetentionMetrics } from './components/RetentionMetrics';
import { SystemHealthPanel } from './components/SystemHealthPanel';
import { ContentInventory } from './components/ContentInventory';
import { QuickActions } from './components/QuickActions';
import { ExportButtons } from './components/ExportButtons';
import { ExecutiveInsights } from './components/ExecutiveInsights';
import { UnitEconomics } from './components/UnitEconomics';
import { ALUserUsage } from './components/ALUserUsage';
import { VercelStatus } from './components/VercelStatus';
import { WebVitalsPanel } from './components/WebVitalsPanel';
import EmailDashboard from './components/EmailDashboard';
import { StripeDashboard } from './components/StripeDashboard';
import { CostIntegrations } from './components/CostIntegrations';
import { SiteAnalytics } from './components/SiteAnalytics';

// Icons
import {
  UsersIcon,
  TrendingUpIcon,
  MessageCircleIcon,
  TargetIcon,
  BarChartIcon,
  DollarSignIcon,
  SettingsIcon,
  RefreshIcon,
  LockIcon,
  ArrowLeftIcon,
  FlaskIcon,
  CalendarIcon,
  BugIcon,
  CarIcon,
  ActivityIcon,
  PlusIcon,
  XIcon,
  CreditCardIcon,
} from './components/Icons';

import styles from './page.module.css';

// Time range mapping
const TIME_RANGE_MAP = {
  'day': { label: 'Today', apiRange: 'day', days: 1 },
  'week': { label: '7 Days', apiRange: 'week', days: 7 },
  'month': { label: '30 Days', apiRange: 'month', days: 30 },
  'all': { label: 'All Time', apiRange: 'all', days: 365 },
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, session } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  
  // State
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('all'); // Default to all time to show December
  const [data, setData] = useState(null);
  const [financials, setFinancials] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showCostForm, setShowCostForm] = useState(false);
  const [usageData, setUsageData] = useState(null);
  const [retentionData, setRetentionData] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [alertsData, setAlertsData] = useState(null);
  const [stripeData, setStripeData] = useState(null);
  
  // Check admin access
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !user?.email) {
        setIsAdmin(false);
      } else {
        setIsAdmin(isAdminEmail(user.email));
      }
      setAuthChecked(true);
    }
  }, [isAuthenticated, user, authLoading]);
  
  // Fetch dashboard data
  const fetchData = useCallback(async () => {
    if (!session?.access_token) return;
    
    setLoading(true);
    setError(null);
    
    const apiRange = TIME_RANGE_MAP[timeRange]?.apiRange || 'all';
    
    try {
      const [dashboardRes, financialsRes, usageRes, retentionRes, healthRes, alertsRes, stripeRes] = await Promise.all([
        fetch(`/api/admin/dashboard?range=${apiRange}`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        }),
        fetch(`/api/admin/financials?range=${apiRange}`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        }),
        fetch(`/api/admin/usage?range=${apiRange}`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        }),
        fetch('/api/admin/retention', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        }),
        fetch('/api/admin/system-health', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        }),
        fetch('/api/admin/alerts', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        }),
        fetch(`/api/admin/stripe?range=${apiRange}`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        })
      ]);
      
      if (!dashboardRes.ok) {
        throw new Error(`Dashboard API error: ${dashboardRes.status}`);
      }
      
      const dashboardData = await dashboardRes.json();
      setData(dashboardData);
      
      if (financialsRes.ok) {
        const financialData = await financialsRes.json();
        setFinancials(financialData);
      }
      
      if (usageRes.ok) {
        const usageResult = await usageRes.json();
        setUsageData(usageResult);
      }
      
      if (retentionRes.ok) {
        const retentionResult = await retentionRes.json();
        setRetentionData(retentionResult);
      }
      
      if (healthRes.ok) {
        const healthResult = await healthRes.json();
        setHealthData(healthResult);
      }
      
      if (alertsRes.ok) {
        const alertsResult = await alertsRes.json();
        setAlertsData(alertsResult);
      }
      
      if (stripeRes.ok) {
        const stripeResult = await stripeRes.json();
        setStripeData(stripeResult);
      }
      
      setLastUpdated(new Date());
      
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, timeRange]);
  
  useEffect(() => {
    if (isAdmin && session?.access_token) {
      fetchData();
    }
  }, [isAdmin, session?.access_token, fetchData]);
  
  // Handle cost submission
  const handleCostSubmit = async (costData) => {
    if (!session?.access_token) throw new Error('Not authenticated');
    
    const response = await fetch('/api/admin/financials', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(costData),
    });
    
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to add cost entry');
    }
    
    await fetchData();
  };
  
  // Loading state
  if (authLoading || !authChecked) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner} />
          <p>Verifying access...</p>
        </div>
      </div>
    );
  }
  
  // Access denied
  if (!isAdmin) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.accessDenied}>
          <div className={styles.accessDeniedIconWrapper}>
            <LockIcon size={48} />
          </div>
          <h1>Access Denied</h1>
          <p>This dashboard is restricted to authorized administrators.</p>
          <button onClick={() => router.push('/')} className={styles.backButton}>
            <ArrowLeftIcon size={16} />
            Return to Home
          </button>
        </div>
      </div>
    );
  }
  
  // Calculate metrics from actual API data - no hardcoded fallbacks
  // Use operatingExpenses from P&L structure (infrastructure + development + other)
  const operatingExpenses = financials?.pnl?.operatingExpenses?.total || 0;
  const monthlyBurn = operatingExpenses / 100; // Convert from cents
  const productDevTotal = (financials?.pnl?.productDevelopment || 0) / 100;
  const totalLoss = monthlyBurn + productDevTotal;
  const breakEvenUsers = financials?.executive?.breakEvenUsers || data?.breakEven?.usersNeeded || 0;
  const actualRevenue = (financials?.pnl?.revenue?.total || 0) / 100;
  
  // Interpretations
  const getUserInterpretation = () => {
    if (!data?.users) return 'Loading...';
    const { newThisPeriod, growthPercent, total } = data.users;
    const period = timeRange === 'day' ? 'today' : timeRange === 'week' ? 'this week' : timeRange === 'month' ? 'this month' : 'since launch';
    if (newThisPeriod === 0) return `No new signups ${period}. Total: ${total}.`;
    if (growthPercent > 0) return `+${growthPercent}% growth ${period}. ${newThisPeriod} new user${newThisPeriod > 1 ? 's' : ''}.`;
    return `${newThisPeriod} new user${newThisPeriod > 1 ? 's' : ''} joined ${period}.`;
  };
  
  return (
    <div className={styles.pageContainer}>
      {/* Dashboard Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerTitle}>
            <div className={styles.brandMark}>
              <ActivityIcon size={24} />
            </div>
            <div>
              <h1 className={styles.title}>AutoRev Command Center</h1>
              <p className={styles.subtitle}>Executive Dashboard</p>
            </div>
          </div>
          
          <div className={styles.headerControls}>
            <TimeRangeToggle
              value={timeRange}
              onChange={setTimeRange}
              disabled={loading}
            />
            
            <button 
              onClick={fetchData} 
              className={styles.refreshButton}
              disabled={loading}
              title="Refresh data"
            >
              <RefreshIcon size={18} className={loading ? styles.spinning : ''} />
            </button>
          </div>
        </div>
        
        <div className={styles.headerMeta}>
          {lastUpdated && (
            <span className={styles.lastUpdated}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </header>
      
      {/* Tab Navigation */}
      <TabNav activeTab={activeTab} onChange={setActiveTab} disabled={loading} />
      
      {/* Error state */}
      {error && (
        <div className={styles.errorBanner}>
          <span>Error: {error}</span>
          <button onClick={fetchData}>Retry</button>
        </div>
      )}
      
      {/* Tab Content */}
      <div className={styles.tabContent}>
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <>
            {/* Hero KPIs */}
            <section className={styles.section}>
              <div className={styles.kpiGrid}>
                <KPICard
                  label="Total Users"
                  value={data?.users?.total || 0}
                  trend={data?.users?.growthPercent}
                  interpretation={getUserInterpretation()}
                  sparklineData={data?.users?.cumulativeGrowth?.map(d => d.count)}
                  sparklineColor="#3b82f6"
                  icon={<UsersIcon size={18} />}
                  loading={loading}
                />
                
                <KPICard
                  label="AL Conversations"
                  value={data?.engagement?.alConversations || 0}
                  trend={data?.engagement?.engagementChange}
                  interpretation={`${data?.engagement?.alUsers || 0} users engaged with AL assistant.`}
                  sparklineColor="#8b5cf6"
                  icon={<MessageCircleIcon size={18} />}
                  loading={loading}
                />
                
                <KPICard
                  label="Total Cash Outflow"
                  value={`$${totalLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  interpretation={totalLoss > 0 
                    ? `$${monthlyBurn.toFixed(2)}/mo operating + $${productDevTotal.toFixed(2)} R&D.`
                    : 'No cost data available for this period.'
                  }
                  sparklineColor="#ef4444"
                  icon={<DollarSignIcon size={18} />}
                  loading={loading}
                />
                
                <KPICard
                  label="Break-Even Progress"
                  value={data?.breakEven?.progressPercent || 0}
                  valueSuffix="%"
                  interpretation={`${data?.breakEven?.currentUsers || 0} of ${breakEvenUsers} paying users needed.`}
                  sparklineColor="#22c55e"
                  icon={<TargetIcon size={18} />}
                  loading={loading}
                />
              </div>
            </section>
            
            {/* Executive Overview - Two Column Layout */}
            <section className={styles.section}>
              <div className={styles.executiveGrid}>
                {/* Left: Financial Summary + Growth Chart */}
                <div className={styles.executiveMain}>
                  <div className={styles.summaryCard}>
                    <h3>{financials?.period?.month 
                      ? `${new Date(2024, financials.period.month - 1).toLocaleString('en-US', { month: 'long' })} ${financials?.period?.year || new Date().getFullYear()} Summary`
                      : `${TIME_RANGE_MAP[timeRange]?.label || 'Period'} Summary`
                    }</h3>
                    <div className={styles.summaryContent}>
                      {/* Stripe MRR Row - Real-time from Stripe */}
                      <div className={`${styles.summaryRow} ${styles.stripeRow}`}>
                        <span>
                          <CreditCardIcon size={14} className={styles.stripeIcon} />
                          Stripe MRR
                        </span>
                        <span className={stripeData?.revenue?.mrr > 0 ? styles.positive : styles.neutral}>
                          ${((stripeData?.revenue?.mrr || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className={styles.summaryRow}>
                        <span>Period Revenue</span>
                        <span className={(stripeData?.revenue?.periodTotal || actualRevenue) > 0 ? styles.positive : styles.neutral}>
                          ${(((stripeData?.revenue?.periodTotal || 0) / 100) || actualRevenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className={styles.summaryRow}>
                        <span>Operating Costs</span>
                        <span className={monthlyBurn > 0 ? styles.negative : styles.neutral}>
                          {monthlyBurn > 0 ? `-$${monthlyBurn.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '$0.00'}
                        </span>
                      </div>
                      <div className={styles.summaryRow}>
                        <span>R&D Investment</span>
                        <span className={productDevTotal > 0 ? styles.negative : styles.neutral}>
                          {productDevTotal > 0 ? `-$${productDevTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '$0.00'}
                        </span>
                      </div>
                      <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                        <span>Net Position</span>
                        <span className={(actualRevenue - totalLoss) < 0 ? styles.negative : styles.positive}>
                          {(actualRevenue - totalLoss) < 0 
                            ? `-$${Math.abs(actualRevenue - totalLoss).toLocaleString(undefined, { minimumFractionDigits: 2 })}` 
                            : `$${(actualRevenue - totalLoss).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                          }
                        </span>
                      </div>
                    </div>
                    <p className={styles.summaryNote}>
                      {(stripeData?.subscriptions?.active || 0) > 0 
                        ? `${stripeData.subscriptions.active} active subscriber${stripeData.subscriptions.active > 1 ? 's' : ''} • ARR: $${((stripeData?.revenue?.arr || 0) / 100).toLocaleString()}`
                        : 'Pre-revenue investment phase. Building product & user base.'
                      }
                    </p>
                  </div>
                  
                  <GrowthChart 
                    data={data?.users?.cumulativeGrowth} 
                    title="User Growth"
                    height={140}
                  />
                </div>
                
                {/* Right: Executive Insights */}
                <ExecutiveInsights 
                  data={data}
                  financials={financials}
                  health={healthData}
                  token={session?.access_token}
                  loading={loading}
                />
              </div>
            </section>
            
            {/* Unit Economics */}
            <section className={styles.section}>
              <UnitEconomics 
                financials={financials}
                users={data?.users}
                loading={loading}
              />
            </section>
            
            {/* Quick Links */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Quick Access</h2>
              <div className={styles.quickLinks}>
                <button onClick={() => setActiveTab('revenue')} className={`${styles.quickLink} ${styles.stripeLink}`}>
                  <CreditCardIcon size={18} />
                  <span>Stripe Revenue</span>
                </button>
                <button onClick={() => setActiveTab('financials')} className={styles.quickLink}>
                  <DollarSignIcon size={18} />
                  <span>View Full P&L</span>
                </button>
                <button onClick={() => setActiveTab('growth')} className={styles.quickLink}>
                  <TrendingUpIcon size={18} />
                  <span>Growth Analytics</span>
                </button>
                <button onClick={() => setActiveTab('operations')} className={styles.quickLink}>
                  <SettingsIcon size={18} />
                  <span>Operations</span>
                </button>
                <a href="/internal/qa" className={styles.quickLink}>
                  <FlaskIcon size={18} />
                  <span>QA Dashboard</span>
                </a>
              </div>
            </section>
          </>
        )}
        
        {/* SITE ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <section className={styles.section}>
            <div className={styles.tabHeader}>
              <h2 className={styles.sectionTitle}>
                <BarChartIcon size={18} className={styles.sectionIcon} />
                Site Analytics
              </h2>
              <p className={styles.tabDescription}>
                Real-time visitor analytics powered by your own data. Tracks page views, visitors, 
                geography, devices, and referrers.
              </p>
            </div>
            <SiteAnalytics 
              token={session?.access_token}
              range={timeRange}
              loading={loading}
            />
          </section>
        )}
        
        {/* REVENUE TAB - Stripe Dashboard */}
        {activeTab === 'revenue' && (
          <section className={styles.section}>
            <div className={styles.tabHeader}>
              <h2 className={styles.sectionTitle}>
                <CreditCardIcon size={18} className={styles.sectionIcon} />
                Revenue Analysis
              </h2>
              <p className={styles.tabDescription}>
                Real-time revenue data from Stripe. For complete financial overview, see{' '}
                <button 
                  onClick={() => setActiveTab('financials')} 
                  className={styles.inlineLink}
                >
                  Financials
                </button>.
              </p>
            </div>
            <StripeDashboard 
              token={session?.access_token}
              range={timeRange}
              loading={loading}
            />
          </section>
        )}
        
        {/* COSTS TAB - Detailed Cost Analysis */}
        {activeTab === 'costs' && (
          <>
            {/* Cost KPIs */}
            <section className={styles.section}>
              <div className={styles.tabHeader}>
                <h2 className={styles.sectionTitle}>
                  <DollarSignIcon size={18} className={styles.sectionIcon} />
                  Cost Analysis
                </h2>
                <p className={styles.tabDescription}>
                  Detailed breakdown of all operational costs. View{' '}
                  <button 
                    onClick={() => setActiveTab('financials')} 
                    className={styles.inlineLink}
                  >
                    Financials
                  </button>{' '}
                  for executive summary or{' '}
                  <button 
                    onClick={() => setActiveTab('revenue')} 
                    className={styles.inlineLink}
                  >
                    Revenue
                  </button>{' '}
                  for income details.
                </p>
              </div>
              
              <div className={styles.kpiGrid}>
                <KPICard
                  label="Total Costs"
                  value={`$${totalLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  interpretation="Operating + R&D this period"
                  sparklineColor="#ef4444"
                  icon={<DollarSignIcon size={18} />}
                  loading={loading}
                />
                
                <KPICard
                  label="Operating Costs"
                  value={`$${monthlyBurn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  interpretation="Infrastructure + services"
                  sparklineColor="#f59e0b"
                  icon={<SettingsIcon size={18} />}
                  loading={loading}
                />
                
                <KPICard
                  label="R&D Investment"
                  value={`$${productDevTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  interpretation="Product development costs"
                  sparklineColor="#8b5cf6"
                  icon={<FlaskIcon size={18} />}
                  loading={loading}
                />
                
                <KPICard
                  label="Cost per User"
                  value={data?.users?.total > 0 
                    ? `$${(totalLoss / data.users.total).toFixed(2)}`
                    : '$0.00'
                  }
                  interpretation={data?.users?.total > 0 
                    ? `Across ${data.users.total} total users`
                    : 'No users yet'
                  }
                  sparklineColor="#3b82f6"
                  icon={<UsersIcon size={18} />}
                  loading={loading}
                />
              </div>
            </section>
            
            {/* Cost Breakdown Charts */}
            <section className={styles.section}>
              <h3 className={styles.subsectionTitle}>Cost Breakdown</h3>
              <div className={styles.costAnalysisGrid}>
                <CostBreakdown 
                  costs={financials?.costs || data?.costs}
                  title="Cost Categories"
                />
                
                <div className={styles.financialSidebarCompact}>
                  <BreakEvenProgress 
                    breakEven={data?.breakEven}
                    title="Break-Even Analysis"
                    compact
                  />
                  
                  <UsageEstimate 
                    usage={usageData}
                    loading={loading}
                    compact
                  />
                </div>
              </div>
            </section>
            
            {/* External Cost Integrations */}
            <section className={styles.section}>
              <CostIntegrations 
                token={session?.access_token}
                range={timeRange}
                loading={loading}
              />
            </section>
            
            {/* Cost Entry Form */}
            <section className={styles.section}>
              <div className={styles.costEntrySection}>
                <div className={styles.costEntryHeader}>
                  <h3 className={styles.subsectionTitle}>Add Cost Entry</h3>
                  <button 
                    onClick={() => setShowCostForm(!showCostForm)}
                    className={styles.addButton}
                  >
                    {showCostForm ? <XIcon size={14} /> : <PlusIcon size={14} />}
                    {showCostForm ? 'Close' : 'Add Cost'}
                  </button>
                </div>
                
                {showCostForm && (
                  <CostInputForm 
                    onSubmit={handleCostSubmit}
                    onCancel={() => setShowCostForm(false)}
                    glAccounts={financials?.glAccounts || []}
                  />
                )}
              </div>
            </section>
            
            {/* Monthly Cost Trend */}
            <section className={styles.section}>
              <MonthlyTrend 
                data={financials?.monthlyTrend}
                title="Monthly Cost History"
                compact={false}
              />
            </section>
          </>
        )}
        
        {/* FINANCIALS TAB - Executive Summary */}
        {/* Links to Revenue and Costs for detailed analysis */}
        {activeTab === 'financials' && (
          <>
            {/* Executive Summary Header */}
            <section className={styles.section}>
              <div className={styles.financialHeader}>
                <div className={styles.tabHeader}>
                  <h2 className={styles.sectionTitle}>
                    <DollarSignIcon size={18} className={styles.sectionIcon} />
                    Financial Summary
                  </h2>
                  <p className={styles.tabDescription}>
                    Executive overview of your financial position. Drill down into{' '}
                    <button onClick={() => setActiveTab('revenue')} className={styles.inlineLink}>
                      Revenue
                    </button>{' '}
                    or{' '}
                    <button onClick={() => setActiveTab('costs')} className={styles.inlineLink}>
                      Costs
                    </button>{' '}
                    for detailed analysis.
                  </p>
                </div>
                <div className={styles.financialActions}>
                  <ExportButtons 
                    token={session?.access_token}
                    year={new Date().getFullYear()}
                    month={new Date().getMonth() + 1}
                    compact
                  />
                </div>
              </div>
              
              {/* Financial KPI Tiles */}
              <div className={styles.kpiGrid}>
                <KPICard
                  label="Revenue"
                  value={`$${actualRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  interpretation={actualRevenue === 0 ? 'Pre-revenue phase' : 'Total collected revenue'}
                  sparklineColor="#22c55e"
                  icon={<TrendingUpIcon size={18} />}
                  loading={loading}
                  onClick={() => setActiveTab('revenue')}
                />
                
                <KPICard
                  label="Total Costs"
                  value={`$${totalLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  interpretation={`$${monthlyBurn.toFixed(2)} operating + $${productDevTotal.toFixed(2)} R&D`}
                  sparklineColor="#f59e0b"
                  icon={<DollarSignIcon size={18} />}
                  loading={loading}
                  onClick={() => setActiveTab('costs')}
                />
                
                <KPICard
                  label="Net Position"
                  value={`${(actualRevenue - totalLoss) < 0 ? '-' : ''}$${Math.abs(actualRevenue - totalLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  interpretation={(actualRevenue - totalLoss) < 0 ? 'Investment phase' : 'Profitable'}
                  sparklineColor={(actualRevenue - totalLoss) < 0 ? '#ef4444' : '#22c55e'}
                  icon={<TargetIcon size={18} />}
                  loading={loading}
                />
                
                <KPICard
                  label="Break-Even Progress"
                  value={data?.breakEven?.progressPercent || 0}
                  valueSuffix="%"
                  interpretation={`${data?.breakEven?.currentUsers || 0} of ${breakEvenUsers} paying users needed`}
                  sparklineColor="#3b82f6"
                  icon={<BarChartIcon size={18} />}
                  loading={loading}
                />
              </div>
            </section>
            
            {/* Quick Navigation Cards */}
            <section className={styles.section}>
              <div className={styles.financialQuickLinks}>
                <button 
                  onClick={() => setActiveTab('revenue')} 
                  className={`${styles.financialQuickLink} ${styles.revenueLink}`}
                >
                  <div className={styles.quickLinkHeader}>
                    <CreditCardIcon size={24} />
                    <span className={styles.quickLinkTitle}>Revenue Details</span>
                  </div>
                  <p className={styles.quickLinkDesc}>
                    Stripe dashboard, MRR, subscriptions, and payment history
                  </p>
                  <span className={styles.quickLinkArrow}>→</span>
                </button>
                
                <button 
                  onClick={() => setActiveTab('costs')} 
                  className={`${styles.financialQuickLink} ${styles.costsLink}`}
                >
                  <div className={styles.quickLinkHeader}>
                    <DollarSignIcon size={24} />
                    <span className={styles.quickLinkTitle}>Cost Breakdown</span>
                  </div>
                  <p className={styles.quickLinkDesc}>
                    Operating costs, R&D, integrations, and monthly trends
                  </p>
                  <span className={styles.quickLinkArrow}>→</span>
                </button>
              </div>
            </section>
            
            {/* P&L Statement */}
            <section className={styles.section}>
              <div className={styles.financialMainGrid}>
                <PLStatement 
                  pnl={financials?.pnl}
                  revenue={financials?.revenue}
                  costs={financials?.costs}
                  period={financials?.period}
                  title="Income Statement (P&L)"
                />
                
                <div className={styles.financialSidebar}>
                  <MonthlyTrend 
                    data={financials?.monthlyTrend}
                    title="Monthly Financials"
                    compact
                  />
                </div>
              </div>
            </section>
          </>
        )}
        
        {/* GROWTH TAB */}
        {activeTab === 'growth' && (
          <>
            {/* User KPIs */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <UsersIcon size={18} className={styles.sectionIcon} />
                User Metrics
              </h2>
              <div className={styles.kpiGrid}>
                <KPICard
                  label="Total Users"
                  value={data?.users?.total || 0}
                  trend={data?.users?.growthPercent}
                  interpretation={getUserInterpretation()}
                  sparklineData={data?.users?.cumulativeGrowth?.map(d => d.count)}
                  sparklineColor="#3b82f6"
                  icon={<UsersIcon size={18} />}
                  loading={loading}
                />
                
                <KPICard
                  label="Weekly Active Users"
                  value={data?.engagement?.weeklyActiveUsers || 0}
                  trend={data?.engagement?.wauPercent}
                  trendSuffix="% of total"
                  interpretation={`${data?.engagement?.wauPercent || 0}% of users active in 7 days.`}
                  sparklineColor="#8b5cf6"
                  icon={<TrendingUpIcon size={18} />}
                  loading={loading}
                />
                
                <KPICard
                  label="AL Conversations"
                  value={data?.engagement?.alConversations || 0}
                  trend={data?.engagement?.engagementChange}
                  interpretation={`${data?.engagement?.conversationsPerUser || 0} avg per user.`}
                  sparklineColor="#06b6d4"
                  icon={<MessageCircleIcon size={18} />}
                  loading={loading}
                />
                
                <KPICard
                  label="Conversion to Paid"
                  value={financials?.executive?.conversionRate || 0}
                  valueSuffix="%"
                  interpretation={`${financials?.executive?.payingUsers || 0} paying users.`}
                  sparklineColor="#22c55e"
                  icon={<TargetIcon size={18} />}
                  loading={loading}
                />
              </div>
            </section>
            
            {/* Charts */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <BarChartIcon size={18} className={styles.sectionIcon} />
                Growth Analytics
              </h2>
              <div className={styles.chartsGrid}>
                <GrowthChart 
                  data={data?.users?.cumulativeGrowth} 
                  title="User Growth (Cumulative)"
                  height={180}
                />
                
                <FunnelChart 
                  funnel={data?.funnel}
                  title="Conversion Funnel"
                />
              </div>
            </section>
            
            {/* Retention & Engagement */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <TrendingUpIcon size={18} className={styles.sectionIcon} />
                Retention & Engagement
              </h2>
              <RetentionMetrics 
                retention={retentionData}
                loading={loading}
              />
            </section>
          </>
        )}
        
        {/* OPERATIONS TAB */}
        {/* Layout follows Visual Hierarchy: Level 1 KPIs → Level 2 Charts → Level 3 Details */}
        {activeTab === 'operations' && (
          <>
            {/* LEVEL 1: Operations KPIs (The Pulse) */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <SettingsIcon size={18} className={styles.sectionIcon} />
                Operations Overview
              </h2>
              <div className={styles.kpiGrid}>
                <KPICard
                  label="System Status"
                  value={healthData?.health?.status === 'healthy' ? 'Healthy' : 
                         healthData?.health?.status === 'warning' ? 'Warning' : 
                         healthData?.health?.status === 'critical' ? 'Critical' :
                         healthData?.health?.status === 'info' ? 'Info' : 'Checking...'}
                  interpretation={healthData?.errors?.total24h > 0 
                    ? `${healthData.errors.total24h} errors in last 24h (${healthData.errors.fixed24h || 0} fixed)`
                    : 'All systems operational'
                  }
                  sparklineColor={healthData?.health?.status === 'healthy' ? '#22c55e' : 
                                  healthData?.health?.status === 'warning' ? '#f59e0b' : 
                                  healthData?.health?.status === 'critical' ? '#ef4444' : '#3b82f6'}
                  icon={<ActivityIcon size={18} />}
                  loading={loading}
                />
                
                <KPICard
                  label="Active Alerts"
                  value={(alertsData?.alerts || healthData?.alerts || []).filter(a => a.severity !== 'info').length}
                  interpretation={(alertsData?.alerts || healthData?.alerts || []).length > 0
                    ? `${(alertsData?.alerts || healthData?.alerts || []).filter(a => a.severity === 'high' || a.severity === 'critical').length} require attention`
                    : 'No active alerts'
                  }
                  sparklineColor={(alertsData?.alerts || healthData?.alerts || []).some(a => a.severity === 'critical') ? '#ef4444' : '#f59e0b'}
                  icon={<TargetIcon size={18} />}
                  loading={loading}
                />
                
                <KPICard
                  label="Deployments"
                  value="100%"
                  interpretation="Production healthy, 2.9 deploys/day avg"
                  sparklineColor="#22c55e"
                  icon={<ActivityIcon size={18} />}
                  loading={loading}
                />
                
                <KPICard
                  label="Content Items"
                  value={(usageData?.content?.vehicles || 0) + (usageData?.content?.events || 0) + (usageData?.content?.parts || 0)}
                  interpretation={`${usageData?.content?.vehicles || 0} vehicles, ${usageData?.content?.events || 0} events`}
                  sparklineColor="#3b82f6"
                  icon={<BarChartIcon size={18} />}
                  loading={loading}
                />
              </div>
            </section>
            
            {/* LEVEL 2: System Health (PRIORITY - shows errors/warnings) */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <ActivityIcon size={18} className={styles.sectionIcon} />
                System Health
              </h2>
              <SystemHealthPanel 
                health={healthData}
                loading={loading}
              />
            </section>
            
            {/* LEVEL 2: Deployment & Performance (Production status) */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <SettingsIcon size={18} className={styles.sectionIcon} />
                Deployment & Performance
              </h2>
              <div className={styles.infrastructureGrid}>
                <VercelStatus 
                  token={session?.access_token}
                  loading={loading}
                />
                
                <WebVitalsPanel 
                  token={session?.access_token}
                  loading={loading}
                />
              </div>
            </section>
            
            {/* LEVEL 2: AL Usage Analytics (Cost tracking - informational) */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <MessageCircleIcon size={18} className={styles.sectionIcon} />
                AL Usage Analytics
              </h2>
              <ALUserUsage 
                token={session?.access_token}
                range={timeRange}
                loading={loading}
              />
            </section>
            
            {/* LEVEL 2: Content & Operations (Administrative) */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <BarChartIcon size={18} className={styles.sectionIcon} />
                Content & Operations
              </h2>
              <div className={styles.operationsPrimaryGrid}>
                <ContentInventory 
                  content={usageData?.content || data?.content}
                  loading={loading}
                />
                
                <QuickActions 
                  token={session?.access_token}
                  onRefresh={fetchData}
                />
              </div>
            </section>
            
            {/* LEVEL 3: Action Items & Infrastructure Status (Details) */}
            <section className={styles.section}>
              <div className={styles.operationsSecondaryGrid}>
                <AlertsList 
                  alerts={alertsData?.alerts || data?.alerts || healthData?.alerts}
                  title="Action Items"
                />
                
                <SystemHealth 
                  system={data?.system}
                  title="Infrastructure Status"
                />
              </div>
            </section>
            
            {/* Internal Tools */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Internal Tools</h2>
              <div className={styles.quickLinks}>
                <a href="/internal/qa" className={styles.quickLink}>
                  <FlaskIcon size={18} />
                  <span>QA Dashboard</span>
                </a>
                <a href="/internal/events" className={styles.quickLink}>
                  <CalendarIcon size={18} />
                  <span>Event Moderation</span>
                </a>
                <a href="/internal/errors" className={styles.quickLink}>
                  <BugIcon size={18} />
                  <span>Error Logs</span>
                </a>
                <a href="/internal/vehicles" className={styles.quickLink}>
                  <CarIcon size={18} />
                  <span>Vehicle Data</span>
                </a>
              </div>
            </section>
          </>
        )}
        
        {/* EMAILS TAB */}
        {activeTab === 'emails' && (
          <section className={styles.section}>
            <EmailDashboard token={session?.access_token} />
          </section>
        )}
        
      </div>
    </div>
  );
}
