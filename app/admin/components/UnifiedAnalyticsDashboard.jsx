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
 * - Search analytics
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
  GlobeIcon,
  ClockIcon,
  LayersIcon,
  SearchIcon,
  StarIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  ZapIcon,
} from './Icons';

// SVG Icons for the dashboard (ones not in Icons.jsx)
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

// Real-time indicator
function LiveIndicator({ count }) {
  return (
    <div className={styles.liveIndicator}>
      <span className={styles.liveDot} />
      <span className={styles.liveText}>{count} online now</span>
    </div>
  );
}

// Stat card with icon
function MetricCard({ label, value, change, changeLabel, icon: Icon, color = 'blue' }) {
  const isPositive = change > 0;
  const isNegative = change < 0;
  
  return (
    <div className={`${styles.metricCard} ${styles[`metric${color}`]}`}>
      <div className={styles.metricIcon}>
        <Icon size={24} />
      </div>
      <div className={styles.metricContent}>
        <span className={styles.metricLabel}>{label}</span>
        <span className={styles.metricValue}>{value}</span>
        {change !== undefined && (
          <span className={`${styles.metricChange} ${isPositive ? styles.positive : isNegative ? styles.negative : ''}`}>
            {isPositive ? '↑' : isNegative ? '↓' : '→'} {Math.abs(change)}% {changeLabel || 'vs last period'}
          </span>
        )}
      </div>
    </div>
  );
}

// Funnel visualization
function FunnelVisualization({ funnel }) {
  if (!funnel) return null;
  
  const stages = [
    { key: 'visitors', label: 'Visitors', count: funnel.visitors || 0, color: '#3b82f6', icon: UsersIcon },
    { key: 'signups', label: 'Signups', count: funnel.signups || 0, color: '#8b5cf6', icon: UserPlusIcon },
    { key: 'onboarded', label: 'Onboarded', count: funnel.onboarded || 0, color: '#06b6d4', icon: UserCheckIcon },
    { key: 'activated', label: 'Activated', count: funnel.activated || 0, color: '#22c55e', icon: ZapIcon },
    { key: 'converted', label: 'Converted', count: funnel.converted || 0, color: '#f59e0b', icon: DollarSignIcon }
  ];
  
  const maxCount = Math.max(...stages.map(s => s.count), 1);
  
  return (
    <div className={styles.funnel}>
      {stages.map((stage, i) => {
        const widthPercent = (stage.count / maxCount) * 100;
        const conversionRate = i > 0 && stages[i-1].count > 0 
          ? ((stage.count / stages[i-1].count) * 100).toFixed(1)
          : null;
        const Icon = stage.icon;
          
        return (
          <div key={stage.key} className={styles.funnelStage}>
            <div className={styles.funnelBar} style={{ 
              width: `${Math.max(widthPercent, 10)}%`,
              backgroundColor: stage.color 
            }}>
              <span className={styles.funnelLabel}>
                <Icon size={14} className={styles.funnelIcon} />
                {stage.label}
              </span>
              <span className={styles.funnelCount}>{stage.count.toLocaleString()}</span>
            </div>
            {conversionRate && (
              <span className={styles.funnelConversion}>{conversionRate}%</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Engagement breakdown
function EngagementBreakdown({ engagement }) {
  if (!engagement) return null;
  
  const tiers = [
    { key: 'bounced', label: 'Bounced', color: '#ef4444' },
    { key: 'light', label: 'Light', color: '#f59e0b' },
    { key: 'engaged', label: 'Engaged', color: '#3b82f6' },
    { key: 'deep', label: 'Deep', color: '#22c55e' }
  ];
  
  const total = tiers.reduce((sum, t) => sum + (engagement[t.key] || 0), 0) || 1;
  
  return (
    <div className={styles.engagementBreakdown}>
      <div className={styles.engagementBar}>
        {tiers.map(tier => {
          const percent = ((engagement[tier.key] || 0) / total) * 100;
          return (
            <div 
              key={tier.key}
              className={styles.engagementSegment}
              style={{ width: `${percent}%`, backgroundColor: tier.color }}
              title={`${tier.label}: ${Math.round(percent)}%`}
            />
          );
        })}
      </div>
      <div className={styles.engagementLegend}>
        {tiers.map(tier => (
          <div key={tier.key} className={styles.engagementLegendItem}>
            <span className={styles.legendDot} style={{ backgroundColor: tier.color }} />
            <span>{tier.label}</span>
            <span className={styles.legendValue}>{Math.round(((engagement[tier.key] || 0) / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Feature adoption chart
function FeatureAdoption({ features }) {
  if (!features || features.length === 0) {
    return <div className={styles.emptyState}>No feature data yet</div>;
  }
  
  const maxUsage = Math.max(...features.map(f => f.usage_count || 0), 1);
  
  return (
    <div className={styles.featureList}>
      {features.slice(0, 10).map((feature, i) => {
        const percent = ((feature.usage_count || 0) / maxUsage) * 100;
        const Icon = getFeatureIcon(feature.feature_key);
        return (
          <div key={i} className={styles.featureRow}>
            <span className={styles.featureIcon}>
              <Icon size={18} />
            </span>
            <span className={styles.featureName}>{formatFeatureName(feature.feature_key)}</span>
            <div className={styles.featureBar}>
              <div 
                className={styles.featureBarFill}
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className={styles.featureCount}>{(feature.usage_count || 0).toLocaleString()}</span>
          </div>
        );
      })}
    </div>
  );
}

// User lifecycle distribution
function LifecycleDistribution({ lifecycle }) {
  if (!lifecycle) return null;
  
  const statuses = [
    { key: 'new', label: 'New', color: '#3b82f6', icon: UserPlusIcon },
    { key: 'active', label: 'Active', color: '#22c55e', icon: UserCheckIcon },
    { key: 'at_risk', label: 'At Risk', color: '#f59e0b', icon: AlertCircleIcon },
    { key: 'churned', label: 'Churned', color: '#ef4444', icon: UserXIcon }
  ];
  
  const total = statuses.reduce((sum, s) => sum + (lifecycle[s.key] || 0), 0) || 1;
  
  return (
    <div className={styles.lifecycleGrid}>
      {statuses.map(status => {
        const Icon = status.icon;
        return (
          <div key={status.key} className={styles.lifecycleCard} style={{ borderLeftColor: status.color }}>
            <div className={styles.lifecycleHeader}>
              <Icon size={16} />
              <span>{status.label}</span>
            </div>
            <div className={styles.lifecycleValue}>{(lifecycle[status.key] || 0).toLocaleString()}</div>
            <div className={styles.lifecyclePercent}>{Math.round(((lifecycle[status.key] || 0) / total) * 100)}%</div>
          </div>
        );
      })}
    </div>
  );
}

// Goal completion table
function GoalCompletions({ goals }) {
  if (!goals || goals.length === 0) {
    return <div className={styles.emptyState}>No goal data yet</div>;
  }
  
  return (
    <div className={styles.goalTable}>
      <div className={styles.goalHeader}>
        <span>Goal</span>
        <span>Completions</span>
        <span>Conv. Rate</span>
        <span>Value</span>
      </div>
      {goals.map((goal, i) => (
        <div key={i} className={styles.goalRow}>
          <span className={styles.goalName}>{formatGoalName(goal.goal_key)}</span>
          <span className={styles.goalCompletions}>{(goal.completions || 0).toLocaleString()}</span>
          <span className={styles.goalRate}>{(goal.conversion_rate || 0).toFixed(1)}%</span>
          <span className={styles.goalValue}>
            {goal.total_value_cents 
              ? `$${(goal.total_value_cents / 100).toFixed(0)}`
              : '-'
            }
          </span>
        </div>
      ))}
    </div>
  );
}

// Search analytics
function SearchInsights({ searches }) {
  if (!searches || searches.length === 0) {
    return <div className={styles.emptyState}>No search data yet</div>;
  }
  
  return (
    <div className={styles.searchList}>
      {searches.slice(0, 10).map((search, i) => (
        <div key={i} className={styles.searchRow}>
          <span className={styles.searchQuery}>"{search.query}"</span>
          <span className={styles.searchCount}>{search.count}×</span>
          <span className={styles.searchClickRate}>
            {search.click_rate ? `${(search.click_rate * 100).toFixed(0)}% CTR` : 'No clicks'}
          </span>
        </div>
      ))}
    </div>
  );
}

// Cohort heatmap
function CohortHeatmap({ cohorts }) {
  if (!cohorts || cohorts.length === 0) {
    return <div className={styles.emptyState}>No cohort data yet</div>;
  }
  
  const weeks = ['W0', 'W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7'];
  
  return (
    <div className={styles.cohortTable}>
      <div className={styles.cohortHeader}>
        <span className={styles.cohortLabel}>Cohort</span>
        {weeks.map(w => <span key={w}>{w}</span>)}
      </div>
      {cohorts.slice(0, 8).map((cohort, i) => (
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
                  color: retention > 50 ? '#fff' : '#1f2937'
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

// Helper functions - return icon components instead of emoji strings
function getFeatureIcon(featureKey) {
  const iconMap = {
    car_browse: EyeIcon,
    car_view: EyeIcon,
    car_search: SearchQueryIcon,
    car_filter: LayersIcon,
    car_favorite: TrophyIcon,
    car_compare: BarChartIcon,
    car_share: LinkIcon,
    garage: LayersIcon,
    profile: UserIcon,
    settings: LayersIcon,
    al_chat: ZapIcon,
    tuning_shop: ActivityIcon,
    mod_planner: LayersIcon,
    vehicle_health: CheckCircleIcon,
    events: GlobeIcon,
    community: UsersIcon,
    encyclopedia: FileTextIcon,
    daily_dose: FileTextIcon
  };
  return iconMap[featureKey] || BarChartIcon;
}

function formatFeatureName(featureKey) {
  return featureKey
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function formatGoalName(goalKey) {
  return goalKey
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
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
      // Fetch all analytics data in parallel
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
        // Also fetch dashboard data to get accurate signup counts from user_profiles
        fetch(`/api/admin/dashboard?range=${range}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => ({ ok: false }))
      ]);
      
      const site = siteRes.ok ? await siteRes.json() : null;
      const marketing = marketingRes.ok ? await marketingRes.json() : null;
      const advanced = advancedRes.ok ? await advancedRes.json() : null;
      const dashboard = dashboardRes.ok ? await dashboardRes.json() : null;
      
      setData({
        site,
        marketing,
        advanced,
        dashboard
      });
    } catch (err) {
      console.error('[UnifiedAnalytics] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, range]);
  
  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);
  
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner} />
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <p>Error loading analytics: {error}</p>
          <button onClick={fetchData} className={styles.retryButton}>Retry</button>
        </div>
      </div>
    );
  }
  
  const { site, marketing, advanced, dashboard } = data || {};
  
  // Use actual signups from dashboard (user_profiles created in period)
  const actualSignups = dashboard?.users?.newThisPeriod || 0;
  
  return (
    <div className={styles.container}>
      {/* Header with live indicator */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <BarChartIcon size={24} className={styles.headerIcon} />
          <h2 className={styles.title}>Analytics Dashboard</h2>
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
        />
        <MetricCard 
          label="Page Views" 
          value={(site?.summary?.pageViews || 0).toLocaleString()}
          change={site?.summary?.pageViewsChange}
          icon={FileTextIcon}
          color="purple"
        />
        <MetricCard 
          label="Signups" 
          value={actualSignups.toLocaleString()}
          change={dashboard?.users?.growthPercent}
          icon={UserPlusIcon}
          color="green"
        />
        <MetricCard 
          label="Conversions" 
          value={(marketing?.funnel?.converted || 0).toLocaleString()}
          change={marketing?.funnel?.convertedChange}
          icon={DollarSignIcon}
          color="amber"
        />
      </div>
      
      {/* Section Navigation */}
      <div className={styles.sectionNav}>
        <button 
          className={`${styles.navButton} ${activeSection === 'overview' ? styles.navActive : ''}`}
          onClick={() => setActiveSection('overview')}
        >
          <TrendingUpIcon size={16} />
          Overview
        </button>
        <button 
          className={`${styles.navButton} ${activeSection === 'funnel' ? styles.navActive : ''}`}
          onClick={() => setActiveSection('funnel')}
        >
          <TargetIcon size={16} />
          Funnel
        </button>
        <button 
          className={`${styles.navButton} ${activeSection === 'engagement' ? styles.navActive : ''}`}
          onClick={() => setActiveSection('engagement')}
        >
          <BarChartIcon size={16} />
          Engagement
        </button>
        <button 
          className={`${styles.navButton} ${activeSection === 'features' ? styles.navActive : ''}`}
          onClick={() => setActiveSection('features')}
        >
          <ZapIcon size={16} />
          Features
        </button>
        <button 
          className={`${styles.navButton} ${activeSection === 'users' ? styles.navActive : ''}`}
          onClick={() => setActiveSection('users')}
        >
          <UserIcon size={16} />
          Users
        </button>
        <button 
          className={`${styles.navButton} ${activeSection === 'goals' ? styles.navActive : ''}`}
          onClick={() => setActiveSection('goals')}
        >
          <TrophyIcon size={16} />
          Goals
        </button>
      </div>
      
      {/* Section Content */}
      <div className={styles.sectionContent}>
        {activeSection === 'overview' && (
          <div className={styles.overviewSection}>
            <div className={styles.twoColumn}>
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Traffic Overview</h3>
                <div className={styles.trafficStats}>
                  <div className={styles.trafficItem}>
                    <span className={styles.trafficLabel}>Bounce Rate</span>
                    <span className={styles.trafficValue}>{site?.summary?.bounceRate || 0}%</span>
                  </div>
                  <div className={styles.trafficItem}>
                    <span className={styles.trafficLabel}>Avg Session</span>
                    <span className={styles.trafficValue}>
                      {advanced?.engagement?.avgSessionDuration 
                        ? `${Math.round(advanced.engagement.avgSessionDuration / 60)}m`
                        : '0m'
                      }
                    </span>
                  </div>
                  <div className={styles.trafficItem}>
                    <span className={styles.trafficLabel}>Pages/Session</span>
                    <span className={styles.trafficValue}>
                      {advanced?.engagement?.pagesPerSession?.toFixed(1) || '0'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Engagement Distribution</h3>
                <EngagementBreakdown engagement={advanced?.engagement?.tiers} />
              </div>
            </div>
            
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Top Sources</h3>
              {site?.referrers?.length > 0 ? (
                <div className={styles.sourceList}>
                  {site.referrers.slice(0, 5).map((ref, i) => (
                    <div key={i} className={styles.sourceRow}>
                      <span className={styles.sourceLabel}>
                        <LinkIcon size={14} />
                        {ref.source === 'Direct' ? 'Direct' : ref.source}
                      </span>
                      <span className={styles.sourceValue}>{ref.visitors}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>No referrer data</div>
              )}
            </div>
          </div>
        )}
        
        {activeSection === 'funnel' && (
          <div className={styles.funnelSection}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Conversion Funnel</h3>
              <FunnelVisualization funnel={{
                ...marketing?.funnel,
                signups: actualSignups // Use actual signups from user_profiles
              }} />
            </div>
            
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Cohort Retention</h3>
              <CohortHeatmap cohorts={marketing?.cohorts} />
            </div>
            
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Attribution</h3>
              {marketing?.attribution?.length > 0 ? (
                <div className={styles.attributionList}>
                  {marketing.attribution.slice(0, 5).map((attr, i) => (
                    <div key={i} className={styles.attributionRow}>
                      <div className={styles.attributionSource}>
                        <strong>{attr.source || 'Direct'}</strong>
                        <span>{attr.medium || '-'}</span>
                      </div>
                      <div className={styles.attributionMetrics}>
                        <span>{attr.signups} signups</span>
                        <span>{attr.conversions} converts</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>No attribution data</div>
              )}
            </div>
          </div>
        )}
        
        {activeSection === 'engagement' && (
          <div className={styles.engagementSection}>
            <div className={styles.twoColumn}>
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Engagement Metrics</h3>
                <div className={styles.engagementStats}>
                  <div className={styles.engagementStatItem}>
                    <ScrollIcon size={24} className={styles.engagementStatIcon} />
                    <span className={styles.engagementStatLabel}>Avg Scroll Depth</span>
                    <span className={styles.engagementStatValue}>
                      {advanced?.engagement?.avgScrollDepth 
                        ? `${Math.round(advanced.engagement.avgScrollDepth)}%`
                        : '0%'
                      }
                    </span>
                  </div>
                  <div className={styles.engagementStatItem}>
                    <ClockIcon size={24} className={styles.engagementStatIcon} />
                    <span className={styles.engagementStatLabel}>Avg Time on Page</span>
                    <span className={styles.engagementStatValue}>
                      {advanced?.engagement?.avgTimeOnPage 
                        ? `${Math.round(advanced.engagement.avgTimeOnPage)}s`
                        : '0s'
                      }
                    </span>
                  </div>
                  <div className={styles.engagementStatItem}>
                    <MousePointerIcon size={24} className={styles.engagementStatIcon} />
                    <span className={styles.engagementStatLabel}>Avg Clicks/Page</span>
                    <span className={styles.engagementStatValue}>
                      {advanced?.engagement?.avgClicksPerPage?.toFixed(1) || '0'}
                    </span>
                  </div>
                  <div className={styles.engagementStatItem}>
                    <ActivityIcon size={24} className={styles.engagementStatIcon} />
                    <span className={styles.engagementStatLabel}>Engagement Score</span>
                    <span className={styles.engagementStatValue}>
                      {advanced?.engagement?.avgScore?.toFixed(1) || '0'}/10
                    </span>
                  </div>
                </div>
              </div>
              
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Top Searches</h3>
                <SearchInsights searches={advanced?.searches} />
              </div>
            </div>
          </div>
        )}
        
        {activeSection === 'features' && (
          <div className={styles.featuresSection}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Feature Adoption</h3>
              <FeatureAdoption features={advanced?.features} />
            </div>
          </div>
        )}
        
        {activeSection === 'users' && (
          <div className={styles.usersSection}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>User Lifecycle</h3>
              <LifecycleDistribution lifecycle={advanced?.lifecycle} />
            </div>
            
            <div className={styles.twoColumn}>
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>User Health</h3>
                <div className={styles.healthStats}>
                  <div className={styles.healthItem}>
                    <span>Average Health Score</span>
                    <span className={styles.healthValue}>
                      {advanced?.userHealth?.avgScore?.toFixed(1) || '0'}/100
                    </span>
                  </div>
                  <div className={styles.healthItem}>
                    <span>At-Risk Users</span>
                    <span className={styles.healthValue}>
                      {advanced?.userHealth?.atRiskCount || 0}
                    </span>
                  </div>
                  <div className={styles.healthItem}>
                    <span>Churned (30d)</span>
                    <span className={styles.healthValue}>
                      {advanced?.userHealth?.churnedCount || 0}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Active Users</h3>
                <div className={styles.activeUsers}>
                  <div className={styles.activeItem}>
                    <span>DAU</span>
                    <span>{advanced?.activeUsers?.daily || 0}</span>
                  </div>
                  <div className={styles.activeItem}>
                    <span>WAU</span>
                    <span>{advanced?.activeUsers?.weekly || 0}</span>
                  </div>
                  <div className={styles.activeItem}>
                    <span>MAU</span>
                    <span>{advanced?.activeUsers?.monthly || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeSection === 'goals' && (
          <div className={styles.goalsSection}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Goal Completions</h3>
              <GoalCompletions goals={advanced?.goals} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UnifiedAnalyticsDashboard;
