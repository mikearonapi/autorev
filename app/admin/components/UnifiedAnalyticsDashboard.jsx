'use client';

/**
 * Unified Analytics Dashboard
 * 
 * Comprehensive analytics view combining:
 * - Real-time metrics
 * - Traffic overview
 * - User journey & funnel
 * - Engagement depth
 * - Feature adoption
 * - User lifecycle
 * - Goal tracking
 */

import { useState, useEffect, useCallback } from 'react';
import styles from './UnifiedAnalyticsDashboard.module.css';
import {
  UsersIcon,
  FileTextIcon,
  UserIcon,
  DollarSignIcon,
  TrendingUpIcon,
  TargetIcon,
  BarChartIcon,
  ActivityIcon,
  ClockIcon,
  LayersIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  ZapIcon,
  InfoIcon,
} from './Icons';

// SVG Icons for the dashboard
function EyeIcon({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function MousePointerIcon({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
      <path d="M13 13l6 6" />
    </svg>
  );
}

function ScrollIcon({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4" />
      <path d="M19 17V5a2 2 0 0 0-2-2H4" />
    </svg>
  );
}

function TrophyIcon({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

function SearchQueryIcon({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function UserPlusIcon({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  );
}

function UserCheckIcon({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <polyline points="17 11 19 13 23 9" />
    </svg>
  );
}

function UserXIcon({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="18" y1="8" x2="23" y2="13" />
      <line x1="23" y1="8" x2="18" y2="13" />
    </svg>
  );
}

function LinkIcon({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

// Tooltip component with metric definitions
function Tooltip({ children, content, target }) {
  return (
    <div className={styles.tooltipWrapper}>
      {children}
      <div className={styles.tooltip}>
        <div className={styles.tooltipContent}>{content}</div>
        {target && <div className={styles.tooltipTarget}>Target: {target}</div>}
      </div>
    </div>
  );
}

// Metric definitions for tooltips
const METRIC_DEFINITIONS = {
  visitors: {
    content: 'Unique visitors based on session IDs during this period.',
    target: 'Growth > 10% week-over-week'
  },
  pageViews: {
    content: 'Total page loads tracked. Multiple views per visitor count separately.',
    target: '2-3× visitor count'
  },
  signups: {
    content: 'New user accounts created during this period.',
    target: '2-5% of visitors'
  },
  conversions: {
    content: 'Users who completed a paid action (subscription, purchase).',
    target: '5-10% of signups'
  },
  bounceRate: {
    content: 'Percentage of visitors who left after viewing only one page.',
    target: '< 40% (lower is better)'
  },
  avgSession: {
    content: 'Average time spent per visit across all sessions.',
    target: '> 2 minutes'
  },
  pagesPerSession: {
    content: 'Average number of pages viewed per session.',
    target: '> 2.5 pages'
  },
  scrollDepth: {
    content: 'How far down the page visitors scroll on average.',
    target: '> 50%'
  },
  timeOnPage: {
    content: 'Average time spent on individual pages.',
    target: '> 30 seconds'
  },
  clicksPerPage: {
    content: 'Average interactive clicks per page view.',
    target: '> 2 clicks'
  },
  engagementScore: {
    content: 'Composite score based on time, scroll, and interactions (0-10).',
    target: '> 5.0'
  },
  dau: {
    content: 'Daily Active Users - unique users active today.',
    target: '> 20% of total users'
  },
  wau: {
    content: 'Weekly Active Users - unique users active this week.',
    target: '> 40% of total users'
  },
  mau: {
    content: 'Monthly Active Users - unique users active this month.',
    target: '> 60% of total users'
  },
  healthScore: {
    content: 'User engagement health based on recent activity patterns.',
    target: '> 70/100'
  },
  atRisk: {
    content: 'Users showing declining engagement who may churn.',
    target: '< 10% of active users'
  },
  churned: {
    content: 'Users inactive for 30+ days.',
    target: '< 5% monthly'
  }
};

// Live indicator
function LiveIndicator({ count }) {
  return (
    <div className={styles.liveIndicator}>
      <span className={styles.liveDot} />
      <span className={styles.liveText}>{count} online</span>
    </div>
  );
}

// Compact metric card with tooltip
function MetricCard({ label, value, change, icon: Icon, color = 'blue', tooltip }) {
  const isPositive = change > 0;
  const isNegative = change < 0;
  
  const card = (
    <div className={`${styles.metricCard} ${styles[`metric${color}`]}`}>
      <div className={styles.metricIcon}><Icon size={20} /></div>
      <div className={styles.metricContent}>
        <span className={styles.metricLabel}>{label}</span>
        <span className={styles.metricValue}>{value}</span>
        {change !== undefined && (
          <span className={`${styles.metricChange} ${isPositive ? styles.positive : isNegative ? styles.negative : ''}`}>
            {isPositive ? '↑' : isNegative ? '↓' : '→'}{Math.abs(change)}%
          </span>
        )}
      </div>
    </div>
  );
  
  if (tooltip) {
    return <Tooltip content={tooltip.content} target={tooltip.target}>{card}</Tooltip>;
  }
  return card;
}

// Compact stat item with tooltip
function StatItem({ label, value, tooltip }) {
  const content = (
    <div className={styles.statItem}>
      <span className={styles.statLabel}>
        {label}
        {tooltip && <InfoIcon size={12} className={styles.infoIcon} />}
      </span>
      <span className={styles.statValue}>{value}</span>
    </div>
  );
  
  if (tooltip) {
    return <Tooltip content={tooltip.content} target={tooltip.target}>{content}</Tooltip>;
  }
  return content;
}

// Funnel visualization (compact)
function FunnelVisualization({ funnel }) {
  if (!funnel) return null;
  
  const stages = [
    { key: 'visitors', label: 'Visitors', count: funnel.visitors || 0, color: '#3b82f6' },
    { key: 'signups', label: 'Signups', count: funnel.signups || 0, color: '#8b5cf6' },
    { key: 'onboarded', label: 'Onboarded', count: funnel.onboarded || 0, color: '#06b6d4' },
    { key: 'activated', label: 'Activated', count: funnel.activated || 0, color: '#22c55e' },
    { key: 'converted', label: 'Converted', count: funnel.converted || 0, color: '#f59e0b' }
  ];
  
  const maxCount = Math.max(...stages.map(s => s.count), 1);
  
  return (
    <div className={styles.funnel}>
      {stages.map((stage, i) => {
        const widthPercent = (stage.count / maxCount) * 100;
        const conversionRate = i > 0 && stages[i-1].count > 0 
          ? ((stage.count / stages[i-1].count) * 100).toFixed(0)
          : null;
          
        return (
          <div key={stage.key} className={styles.funnelStage}>
            <div className={styles.funnelBar} style={{ 
              width: `${Math.max(widthPercent, 8)}%`,
              backgroundColor: stage.color 
            }}>
              <span className={styles.funnelLabel}>{stage.label}</span>
              <span className={styles.funnelCount}>{stage.count.toLocaleString()}</span>
            </div>
            {conversionRate && <span className={styles.funnelConversion}>{conversionRate}%</span>}
          </div>
        );
      })}
    </div>
  );
}

// Engagement bar (compact)
function EngagementBreakdown({ engagement }) {
  if (!engagement) return <div className={styles.emptyState}>No data</div>;
  
  const tiers = [
    { key: 'bounced', label: 'Bounced', color: '#ef4444', tip: 'Left after 1 page' },
    { key: 'light', label: 'Light', color: '#f59e0b', tip: 'Minimal interaction' },
    { key: 'engaged', label: 'Engaged', color: '#3b82f6', tip: 'Good interaction' },
    { key: 'deep', label: 'Deep', color: '#22c55e', tip: 'Highly engaged' }
  ];
  
  const total = tiers.reduce((sum, t) => sum + (engagement[t.key] || 0), 0) || 1;
  
  return (
    <div className={styles.engagementBreakdown}>
      <div className={styles.engagementBar}>
        {tiers.map(tier => {
          const percent = ((engagement[tier.key] || 0) / total) * 100;
          return (
            <Tooltip key={tier.key} content={tier.tip} target={tier.key === 'bounced' ? '< 30%' : tier.key === 'deep' ? '> 20%' : null}>
              <div 
                className={styles.engagementSegment}
                style={{ width: `${percent}%`, backgroundColor: tier.color }}
              />
            </Tooltip>
          );
        })}
      </div>
      <div className={styles.engagementLegend}>
        {tiers.map(tier => (
          <span key={tier.key} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ backgroundColor: tier.color }} />
            {tier.label} {Math.round(((engagement[tier.key] || 0) / total) * 100)}%
          </span>
        ))}
      </div>
    </div>
  );
}

// Feature list (compact)
function FeatureAdoption({ features }) {
  if (!features || features.length === 0) {
    return <div className={styles.emptyState}>No feature data</div>;
  }
  
  const maxUsage = Math.max(...features.map(f => f.usage_count || 0), 1);
  
  return (
    <div className={styles.featureList}>
      {features.slice(0, 8).map((feature, i) => {
        const percent = ((feature.usage_count || 0) / maxUsage) * 100;
        return (
          <div key={i} className={styles.featureRow}>
            <span className={styles.featureName}>{formatFeatureName(feature.feature_key)}</span>
            <div className={styles.featureBar}>
              <div className={styles.featureBarFill} style={{ width: `${percent}%` }} />
            </div>
            <span className={styles.featureCount}>{(feature.usage_count || 0).toLocaleString()}</span>
          </div>
        );
      })}
    </div>
  );
}

// Lifecycle grid (compact)
function LifecycleDistribution({ lifecycle }) {
  if (!lifecycle) return null;
  
  const statuses = [
    { key: 'new', label: 'New', color: '#3b82f6', tip: 'Recently signed up' },
    { key: 'active', label: 'Active', color: '#22c55e', tip: 'Engaged in last 7 days' },
    { key: 'at_risk', label: 'At Risk', color: '#f59e0b', tip: 'Declining engagement' },
    { key: 'churned', label: 'Churned', color: '#ef4444', tip: 'Inactive 30+ days' }
  ];
  
  const total = statuses.reduce((sum, s) => sum + (lifecycle[s.key] || 0), 0) || 1;
  
  return (
    <div className={styles.lifecycleGrid}>
      {statuses.map(status => (
        <Tooltip key={status.key} content={status.tip}>
          <div className={styles.lifecycleCard} style={{ borderColor: status.color }}>
            <span className={styles.lifecycleLabel}>{status.label}</span>
            <span className={styles.lifecycleValue}>{(lifecycle[status.key] || 0).toLocaleString()}</span>
            <span className={styles.lifecyclePercent}>{Math.round(((lifecycle[status.key] || 0) / total) * 100)}%</span>
          </div>
        </Tooltip>
      ))}
    </div>
  );
}

// Goals table (compact)
function GoalCompletions({ goals }) {
  if (!goals || goals.length === 0) {
    return <div className={styles.emptyState}>No goal data</div>;
  }
  
  return (
    <div className={styles.goalTable}>
      {goals.slice(0, 5).map((goal, i) => (
        <div key={i} className={styles.goalRow}>
          <span className={styles.goalName}>{formatGoalName(goal.goal_key)}</span>
          <span className={styles.goalCompletions}>{(goal.completions || 0).toLocaleString()}</span>
          <span className={styles.goalRate}>{(goal.conversion_rate || 0).toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
}

// Search list (compact)
function SearchInsights({ searches }) {
  if (!searches || searches.length === 0) {
    return <div className={styles.emptyState}>No search data</div>;
  }
  
  return (
    <div className={styles.searchList}>
      {searches.slice(0, 5).map((search, i) => (
        <div key={i} className={styles.searchRow}>
          <span className={styles.searchQuery}>{search.query}</span>
          <span className={styles.searchCount}>{search.count}×</span>
        </div>
      ))}
    </div>
  );
}

// Cohort heatmap (compact)
function CohortHeatmap({ cohorts }) {
  if (!cohorts || cohorts.length === 0) {
    return <div className={styles.emptyState}>No cohort data</div>;
  }
  
  const weeks = ['W0', 'W1', 'W2', 'W3', 'W4'];
  
  return (
    <div className={styles.cohortTable}>
      <div className={styles.cohortHeader}>
        <span>Cohort</span>
        {weeks.map(w => <span key={w}>{w}</span>)}
      </div>
      {cohorts.slice(0, 4).map((cohort, i) => (
        <div key={i} className={styles.cohortRow}>
          <span className={styles.cohortLabel}>{cohort.week}</span>
          {weeks.map((w, j) => {
            const retention = cohort[`week_${j}_retention`] || 0;
            return (
              <span 
                key={w}
                className={styles.cohortCell}
                style={{ 
                  backgroundColor: `rgba(59, 130, 246, ${retention / 100})`,
                  color: retention > 50 ? '#fff' : '#374151'
                }}
              >
                {retention > 0 ? `${retention}%` : '-'}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// Helper functions
function formatFeatureName(featureKey) {
  return featureKey?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '';
}

function formatGoalName(goalKey) {
  return goalKey?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '';
}

export function UnifiedAnalyticsDashboard({ token, range = '7d' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');
  
  const fetchData = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [siteRes, marketingRes, advancedRes, dashboardRes] = await Promise.all([
        fetch(`/api/admin/site-analytics?range=${range}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/admin/marketing-analytics?range=${range}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/admin/advanced-analytics?range=${range}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => ({ ok: false })),
        fetch(`/api/admin/dashboard?range=${range}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => ({ ok: false }))
      ]);
      
      const site = siteRes.ok ? await siteRes.json() : null;
      const marketing = marketingRes.ok ? await marketingRes.json() : null;
      const advanced = advancedRes.ok ? await advancedRes.json() : null;
      const dashboard = dashboardRes.ok ? await dashboardRes.json() : null;
      
      setData({ site, marketing, advanced, dashboard });
    } catch (err) {
      console.error('[UnifiedAnalytics] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, range]);
  
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);
  
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner} />
          <p>Loading...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <p>Error: {error}</p>
          <button onClick={fetchData} className={styles.retryButton}>Retry</button>
        </div>
      </div>
    );
  }
  
  const { site, marketing, advanced, dashboard } = data || {};
  const actualSignups = dashboard?.users?.newThisPeriod || 0;
  
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <BarChartIcon size={20} className={styles.headerIcon} />
          <h2 className={styles.title}>Analytics</h2>
        </div>
        <LiveIndicator count={site?.summary?.online || 0} />
      </div>
      
      {/* Quick Stats */}
      <div className={styles.quickStats}>
        <MetricCard 
          label="Visitors" 
          value={(site?.summary?.visitors || 0).toLocaleString()} 
          change={site?.summary?.visitorsChange}
          icon={UsersIcon}
          color="blue"
          tooltip={METRIC_DEFINITIONS.visitors}
        />
        <MetricCard 
          label="Page Views" 
          value={(site?.summary?.pageViews || 0).toLocaleString()}
          change={site?.summary?.pageViewsChange}
          icon={FileTextIcon}
          color="purple"
          tooltip={METRIC_DEFINITIONS.pageViews}
        />
        <MetricCard 
          label="Signups" 
          value={actualSignups.toLocaleString()}
          change={dashboard?.users?.growthPercent}
          icon={UserPlusIcon}
          color="green"
          tooltip={METRIC_DEFINITIONS.signups}
        />
        <MetricCard 
          label="Conversions" 
          value={(marketing?.funnel?.converted || 0).toLocaleString()}
          change={marketing?.funnel?.convertedChange}
          icon={DollarSignIcon}
          color="amber"
          tooltip={METRIC_DEFINITIONS.conversions}
        />
      </div>
      
      {/* Tab Navigation */}
      <div className={styles.sectionNav}>
        {[
          { id: 'overview', icon: TrendingUpIcon, label: 'Overview' },
          { id: 'funnel', icon: TargetIcon, label: 'Funnel' },
          { id: 'engagement', icon: ActivityIcon, label: 'Engage' },
          { id: 'features', icon: ZapIcon, label: 'Features' },
          { id: 'users', icon: UserIcon, label: 'Users' },
          { id: 'goals', icon: TrophyIcon, label: 'Goals' },
        ].map(tab => (
          <button 
            key={tab.id}
            className={`${styles.navButton} ${activeSection === tab.id ? styles.navActive : ''}`}
            onClick={() => setActiveSection(tab.id)}
          >
            <tab.icon size={14} />
            <span className={styles.navLabel}>{tab.label}</span>
          </button>
        ))}
      </div>
      
      {/* Content */}
      <div className={styles.sectionContent}>
        {activeSection === 'overview' && (
          <>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Traffic</h3>
              <div className={styles.statsGrid}>
                <StatItem 
                  label="Bounce Rate" 
                  value={`${site?.summary?.bounceRate || 0}%`}
                  tooltip={METRIC_DEFINITIONS.bounceRate}
                />
                <StatItem 
                  label="Avg Session" 
                  value={advanced?.engagement?.avgSessionDuration ? `${Math.round(advanced.engagement.avgSessionDuration / 60)}m` : '0m'}
                  tooltip={METRIC_DEFINITIONS.avgSession}
                />
                <StatItem 
                  label="Pages/Session" 
                  value={advanced?.engagement?.pagesPerSession?.toFixed(1) || '0'}
                  tooltip={METRIC_DEFINITIONS.pagesPerSession}
                />
              </div>
            </div>
            
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Engagement</h3>
              <EngagementBreakdown engagement={advanced?.engagement?.tiers} />
            </div>
            
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Sources</h3>
              {site?.referrers?.length > 0 ? (
                <div className={styles.sourceList}>
                  {site.referrers.slice(0, 4).map((ref, i) => (
                    <div key={i} className={styles.sourceRow}>
                      <span>{ref.source === 'Direct' ? 'Direct' : ref.source}</span>
                      <span>{ref.visitors}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>No data</div>
              )}
            </div>
          </>
        )}
        
        {activeSection === 'funnel' && (
          <>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Conversion Funnel</h3>
              <FunnelVisualization funnel={{ ...marketing?.funnel, signups: actualSignups }} />
            </div>
            
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Retention</h3>
              <CohortHeatmap cohorts={marketing?.cohorts} />
            </div>
          </>
        )}
        
        {activeSection === 'engagement' && (
          <>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Metrics</h3>
              <div className={styles.statsGrid}>
                <StatItem 
                  label="Scroll Depth" 
                  value={`${Math.round(advanced?.engagement?.avgScrollDepth || 0)}%`}
                  tooltip={METRIC_DEFINITIONS.scrollDepth}
                />
                <StatItem 
                  label="Time on Page" 
                  value={`${Math.round(advanced?.engagement?.avgTimeOnPage || 0)}s`}
                  tooltip={METRIC_DEFINITIONS.timeOnPage}
                />
                <StatItem 
                  label="Clicks/Page" 
                  value={advanced?.engagement?.avgClicksPerPage?.toFixed(1) || '0'}
                  tooltip={METRIC_DEFINITIONS.clicksPerPage}
                />
                <StatItem 
                  label="Score" 
                  value={`${advanced?.engagement?.avgScore?.toFixed(1) || '0'}/10`}
                  tooltip={METRIC_DEFINITIONS.engagementScore}
                />
              </div>
            </div>
            
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Top Searches</h3>
              <SearchInsights searches={advanced?.searches} />
            </div>
          </>
        )}
        
        {activeSection === 'features' && (
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Feature Adoption</h3>
            <FeatureAdoption features={advanced?.features} />
          </div>
        )}
        
        {activeSection === 'users' && (
          <>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Lifecycle</h3>
              <LifecycleDistribution lifecycle={advanced?.lifecycle} />
            </div>
            
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Activity</h3>
              <div className={styles.statsGrid}>
                <StatItem label="DAU" value={advanced?.activeUsers?.daily || 0} tooltip={METRIC_DEFINITIONS.dau} />
                <StatItem label="WAU" value={advanced?.activeUsers?.weekly || 0} tooltip={METRIC_DEFINITIONS.wau} />
                <StatItem label="MAU" value={advanced?.activeUsers?.monthly || 0} tooltip={METRIC_DEFINITIONS.mau} />
              </div>
            </div>
            
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Health</h3>
              <div className={styles.statsGrid}>
                <StatItem 
                  label="Avg Score" 
                  value={`${advanced?.userHealth?.avgScore?.toFixed(0) || 0}/100`}
                  tooltip={METRIC_DEFINITIONS.healthScore}
                />
                <StatItem 
                  label="At Risk" 
                  value={advanced?.userHealth?.atRiskCount || 0}
                  tooltip={METRIC_DEFINITIONS.atRisk}
                />
                <StatItem 
                  label="Churned" 
                  value={advanced?.userHealth?.churnedCount || 0}
                  tooltip={METRIC_DEFINITIONS.churned}
                />
              </div>
            </div>
          </>
        )}
        
        {activeSection === 'goals' && (
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Goal Completions</h3>
            <GoalCompletions goals={advanced?.goals} />
          </div>
        )}
      </div>
    </div>
  );
}

export default UnifiedAnalyticsDashboard;
