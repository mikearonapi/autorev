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

// Real-time indicator
function LiveIndicator({ count }) {
  return (
    <div className={styles.liveIndicator}>
      <span className={styles.liveDot} />
      <span className={styles.liveText}>{count} online now</span>
    </div>
  );
}

// Stat card with trend
function MetricCard({ label, value, change, changeLabel, icon, color = 'blue' }) {
  const isPositive = change > 0;
  const isNegative = change < 0;
  
  return (
    <div className={`${styles.metricCard} ${styles[`metric${color}`]}`}>
      <div className={styles.metricIcon}>{icon}</div>
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
          ? ((stage.count / stages[i-1].count) * 100).toFixed(1)
          : null;
          
        return (
          <div key={stage.key} className={styles.funnelStage}>
            <div className={styles.funnelBar} style={{ 
              width: `${Math.max(widthPercent, 10)}%`,
              backgroundColor: stage.color 
            }}>
              <span className={styles.funnelLabel}>{stage.label}</span>
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
        return (
          <div key={i} className={styles.featureRow}>
            <span className={styles.featureIcon}>
              {getFeatureIcon(feature.feature_key)}
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
    { key: 'new', label: 'New', color: '#3b82f6', icon: '🆕' },
    { key: 'active', label: 'Active', color: '#22c55e', icon: '✅' },
    { key: 'at_risk', label: 'At Risk', color: '#f59e0b', icon: '⚠️' },
    { key: 'churned', label: 'Churned', color: '#ef4444', icon: '💤' }
  ];
  
  const total = statuses.reduce((sum, s) => sum + (lifecycle[s.key] || 0), 0) || 1;
  
  return (
    <div className={styles.lifecycleGrid}>
      {statuses.map(status => (
        <div key={status.key} className={styles.lifecycleCard} style={{ borderLeftColor: status.color }}>
          <div className={styles.lifecycleHeader}>
            <span>{status.icon}</span>
            <span>{status.label}</span>
          </div>
          <div className={styles.lifecycleValue}>{(lifecycle[status.key] || 0).toLocaleString()}</div>
          <div className={styles.lifecyclePercent}>{Math.round(((lifecycle[status.key] || 0) / total) * 100)}%</div>
        </div>
      ))}
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

// Helper functions
function getFeatureIcon(featureKey) {
  const icons = {
    car_browse: '🚗',
    car_view: '👁️',
    car_search: '🔍',
    car_filter: '⚙️',
    car_favorite: '❤️',
    car_compare: '⚖️',
    car_share: '📤',
    garage: '🏠',
    profile: '👤',
    settings: '⚙️',
    al_chat: '🤖',
    tuning_shop: '🔧',
    mod_planner: '📋',
    vehicle_health: '🏥',
    events: '📅',
    community: '👥',
    encyclopedia: '📚',
    daily_dose: '📰'
  };
  return icons[featureKey] || '📊';
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
      const [siteRes, marketingRes, advancedRes] = await Promise.all([
        fetch(`/api/admin/site-analytics?range=${range}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/admin/marketing-analytics?range=${range}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/admin/advanced-analytics?range=${range}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => ({ ok: false })) // May not exist yet
      ]);
      
      const site = siteRes.ok ? await siteRes.json() : null;
      const marketing = marketingRes.ok ? await marketingRes.json() : null;
      const advanced = advancedRes.ok ? await advancedRes.json() : null;
      
      setData({
        site,
        marketing,
        advanced
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
  
  const { site, marketing, advanced } = data || {};
  
  return (
    <div className={styles.container}>
      {/* Header with live indicator */}
      <div className={styles.header}>
        <h2 className={styles.title}>📊 Analytics Dashboard</h2>
        <LiveIndicator count={site?.summary?.online || 0} />
      </div>
      
      {/* Quick Stats */}
      <div className={styles.quickStats}>
        <MetricCard 
          label="Visitors" 
          value={(site?.summary?.visitors || 0).toLocaleString()} 
          change={site?.summary?.visitorsChange}
          icon="👥"
          color="blue"
        />
        <MetricCard 
          label="Page Views" 
          value={(site?.summary?.pageViews || 0).toLocaleString()}
          change={site?.summary?.pageViewsChange}
          icon="📄"
          color="purple"
        />
        <MetricCard 
          label="Signups" 
          value={(marketing?.funnel?.signups || 0).toLocaleString()}
          change={marketing?.funnel?.signupsChange}
          icon="✍️"
          color="green"
        />
        <MetricCard 
          label="Conversions" 
          value={(marketing?.funnel?.converted || 0).toLocaleString()}
          change={marketing?.funnel?.convertedChange}
          icon="💰"
          color="amber"
        />
      </div>
      
      {/* Section Navigation */}
      <div className={styles.sectionNav}>
        <button 
          className={`${styles.navButton} ${activeSection === 'overview' ? styles.navActive : ''}`}
          onClick={() => setActiveSection('overview')}
        >
          📈 Overview
        </button>
        <button 
          className={`${styles.navButton} ${activeSection === 'funnel' ? styles.navActive : ''}`}
          onClick={() => setActiveSection('funnel')}
        >
          🎯 Funnel
        </button>
        <button 
          className={`${styles.navButton} ${activeSection === 'engagement' ? styles.navActive : ''}`}
          onClick={() => setActiveSection('engagement')}
        >
          📊 Engagement
        </button>
        <button 
          className={`${styles.navButton} ${activeSection === 'features' ? styles.navActive : ''}`}
          onClick={() => setActiveSection('features')}
        >
          ⭐ Features
        </button>
        <button 
          className={`${styles.navButton} ${activeSection === 'users' ? styles.navActive : ''}`}
          onClick={() => setActiveSection('users')}
        >
          👤 Users
        </button>
        <button 
          className={`${styles.navButton} ${activeSection === 'goals' ? styles.navActive : ''}`}
          onClick={() => setActiveSection('goals')}
        >
          🏆 Goals
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
                        : '-'
                      }
                    </span>
                  </div>
                  <div className={styles.trafficItem}>
                    <span className={styles.trafficLabel}>Pages/Session</span>
                    <span className={styles.trafficValue}>
                      {advanced?.engagement?.pagesPerSession?.toFixed(1) || '-'}
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
                      <span>{ref.source === 'Direct' ? '🔗 Direct' : ref.source}</span>
                      <span>{ref.visitors}</span>
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
              <FunnelVisualization funnel={marketing?.funnel} />
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
                    <span className={styles.engagementIcon}>📜</span>
                    <span className={styles.engagementStatLabel}>Avg Scroll Depth</span>
                    <span className={styles.engagementStatValue}>
                      {advanced?.engagement?.avgScrollDepth 
                        ? `${Math.round(advanced.engagement.avgScrollDepth)}%`
                        : '-'
                      }
                    </span>
                  </div>
                  <div className={styles.engagementStatItem}>
                    <span className={styles.engagementIcon}>⏱️</span>
                    <span className={styles.engagementStatLabel}>Avg Time on Page</span>
                    <span className={styles.engagementStatValue}>
                      {advanced?.engagement?.avgTimeOnPage 
                        ? `${Math.round(advanced.engagement.avgTimeOnPage)}s`
                        : '-'
                      }
                    </span>
                  </div>
                  <div className={styles.engagementStatItem}>
                    <span className={styles.engagementIcon}>👆</span>
                    <span className={styles.engagementStatLabel}>Avg Clicks/Page</span>
                    <span className={styles.engagementStatValue}>
                      {advanced?.engagement?.avgClicksPerPage?.toFixed(1) || '-'}
                    </span>
                  </div>
                  <div className={styles.engagementStatItem}>
                    <span className={styles.engagementIcon}>📊</span>
                    <span className={styles.engagementStatLabel}>Engagement Score</span>
                    <span className={styles.engagementStatValue}>
                      {advanced?.engagement?.avgScore?.toFixed(1) || '-'}/10
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
                      {advanced?.userHealth?.avgScore?.toFixed(1) || '-'}/100
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

