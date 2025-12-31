'use client';

/**
 * Consolidated Analytics Dashboard
 * 
 * Single unified view combining:
 * - Traffic metrics (visitors, page views, bounce rate)
 * - User journey & funnel analysis
 * - Engagement metrics
 * - Feature adoption
 * - Marketing attribution
 * - Cohort retention
 * 
 * Layout: Bento grid with visual hierarchy
 * Level 1 (Pulse): Hero KPIs at top
 * Level 2 (Context): Charts and visualizations
 * Level 3 (Grain): Detailed tables and lists
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import styles from './ConsolidatedAnalytics.module.css';

// Icons
function UsersIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function FileTextIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function UserPlusIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  );
}

function DollarSignIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function ActivityIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function TrendingUpIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function TargetIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function GlobeIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function MonitorIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

function LinkIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function ZapIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function InfoIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

// Tooltip component
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

// Live indicator
function LiveIndicator({ count }) {
  return (
    <div className={styles.liveIndicator}>
      <span className={styles.liveDot} />
      <span className={styles.liveText}>{count} online</span>
    </div>
  );
}

// Hero KPI Card
function HeroKPI({ label, value, change, subtext, icon: Icon, color = 'blue', tooltip }) {
  const isPositive = change > 0;
  const isNegative = change < 0;
  
  const content = (
    <div className={`${styles.heroKPI} ${styles[`kpi${color}`]}`}>
      <div className={styles.kpiIconWrapper}>
        <Icon size={22} />
      </div>
      <div className={styles.kpiContent}>
        <span className={styles.kpiLabel}>
          {label}
          {tooltip && <InfoIcon size={12} />}
        </span>
        <div className={styles.kpiValueRow}>
          <span className={styles.kpiValue}>{value}</span>
          {change !== undefined && change !== null && (
            <span className={`${styles.kpiChange} ${isPositive ? styles.positive : isNegative ? styles.negative : ''}`}>
              {isPositive ? '↑' : isNegative ? '↓' : '→'}{Math.abs(change)}%
            </span>
          )}
        </div>
        {subtext && <span className={styles.kpiSubtext}>{subtext}</span>}
      </div>
    </div>
  );
  
  if (tooltip) {
    return <Tooltip content={tooltip.content} target={tooltip.target}>{content}</Tooltip>;
  }
  return content;
}

// Large area chart for visitors over time
function VisitorAreaChart({ data, height = 240 }) {
  if (!data || data.length === 0) {
    return (
      <div className={styles.chartEmpty}>
        <ActivityIcon size={32} />
        <p>No visitor data for selected period</p>
      </div>
    );
  }
  
  const maxVisitors = Math.max(...data.map(d => d.visitors || 0), 1);
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1 || 1)) * 100;
    const y = 100 - ((d.visitors || 0) / maxVisitors) * 100;
    return `${x},${y}`;
  }).join(' ');
  
  // Create filled area
  const areaPoints = `0,100 ${points} 100,100`;
  
  return (
    <div className={styles.areaChart} style={{ height }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={styles.chartSvg}>
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill="url(#areaGradient)" />
        <polyline 
          points={points} 
          fill="none" 
          stroke="#3b82f6" 
          strokeWidth="0.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      
      {/* Overlay with data points on hover */}
      <div className={styles.chartOverlay}>
        {data.map((d, i) => {
          const left = (i / (data.length - 1 || 1)) * 100;
          return (
            <div 
              key={i} 
              className={styles.chartDataPoint}
              style={{ left: `${left}%` }}
              title={`${d.date}: ${d.visitors} visitors, ${d.views} views`}
            >
              <div className={styles.chartTooltip}>
                <strong>{d.visitors}</strong> visitors
                <span>{new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Y-axis labels */}
      <div className={styles.chartYAxis}>
        <span>{maxVisitors}</span>
        <span>{Math.round(maxVisitors / 2)}</span>
        <span>0</span>
      </div>
      
      {/* X-axis labels */}
      <div className={styles.chartXAxis}>
        {data.length > 0 && (
          <>
            <span>{new Date(data[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            {data.length > 2 && (
              <span>{new Date(data[Math.floor(data.length / 2)].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            )}
            <span>{new Date(data[data.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </>
        )}
      </div>
    </div>
  );
}

// Engagement breakdown bar
function EngagementBar({ engagement }) {
  if (!engagement) return null;
  
  const tiers = [
    { key: 'bounced', label: 'Bounced', color: '#ef4444', percent: engagement.bounced || 20 },
    { key: 'light', label: 'Light', color: '#f59e0b', percent: engagement.light || 20 },
    { key: 'engaged', label: 'Engaged', color: '#3b82f6', percent: engagement.engaged || 20 },
    { key: 'deep', label: 'Deep', color: '#22c55e', percent: engagement.deep || 40 },
  ];
  
  const total = tiers.reduce((sum, t) => sum + (t.percent || 0), 0) || 100;
  
  return (
    <div className={styles.engagementSection}>
      <h4 className={styles.miniTitle}>Engagement Depth</h4>
      <div className={styles.engagementBar}>
        {tiers.map(tier => {
          const width = (tier.percent / total) * 100;
          return (
            <Tooltip key={tier.key} content={`${tier.label}: ${Math.round(width)}% of visitors`}>
              <div 
                className={styles.engagementSegment}
                style={{ width: `${width}%`, backgroundColor: tier.color }}
              />
            </Tooltip>
          );
        })}
      </div>
      <div className={styles.engagementLegend}>
        {tiers.map(tier => (
          <span key={tier.key} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ backgroundColor: tier.color }} />
            {tier.label} {Math.round((tier.percent / total) * 100)}%
          </span>
        ))}
      </div>
    </div>
  );
}

// Funnel visualization (horizontal bars)
function ConversionFunnel({ funnel, signups }) {
  const stages = [
    { key: 'visitors', label: 'Visitors', count: funnel?.visitors || 0, color: '#3b82f6' },
    { key: 'signups', label: 'Signups', count: signups || funnel?.signups || 0, color: '#8b5cf6' },
    { key: 'onboarded', label: 'Onboarded', count: funnel?.onboarded || 0, color: '#06b6d4' },
    { key: 'activated', label: 'Activated', count: funnel?.activated || 0, color: '#22c55e' },
    { key: 'converted', label: 'Converted', count: funnel?.converted || 0, color: '#f59e0b' }
  ];
  
  const maxCount = Math.max(...stages.map(s => s.count), 1);
  
  return (
    <div className={styles.funnelSection}>
      {stages.map((stage, i) => {
        const widthPercent = Math.max((stage.count / maxCount) * 100, 5);
        const prevCount = i > 0 ? stages[i - 1].count : stage.count;
        const conversionRate = prevCount > 0 ? ((stage.count / prevCount) * 100).toFixed(0) : null;
        
        return (
          <div key={stage.key} className={styles.funnelRow}>
            <div 
              className={styles.funnelBar}
              style={{ width: `${widthPercent}%`, backgroundColor: stage.color }}
            >
              <span className={styles.funnelLabel}>{stage.label}</span>
              <span className={styles.funnelCount}>{stage.count.toLocaleString()}</span>
            </div>
            {i > 0 && conversionRate && (
              <span className={styles.funnelRate}>{conversionRate}%</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Top pages table
function TopPagesTable({ pages }) {
  if (!pages || pages.length === 0) {
    return <div className={styles.emptyState}>No page data yet</div>;
  }
  
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th>Page</th>
            <th className={styles.alignRight}>Views</th>
            <th className={styles.alignRight}>Visitors</th>
          </tr>
        </thead>
        <tbody>
          {pages.slice(0, 8).map((page, i) => (
            <tr key={i}>
              <td>
                <span className={styles.pathCell} title={page.path}>{page.path}</span>
              </td>
              <td className={styles.alignRight}>{page.views?.toLocaleString()}</td>
              <td className={styles.alignRight}>{page.visitors?.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Referrers list
function ReferrersList({ referrers }) {
  if (!referrers || referrers.length === 0) {
    return <div className={styles.emptyState}>No referrer data</div>;
  }
  
  const total = referrers.reduce((sum, r) => sum + (r.visitors || 0), 0) || 1;
  
  return (
    <div className={styles.referrersList}>
      {referrers.slice(0, 6).map((ref, i) => {
        const percent = ((ref.visitors || 0) / total) * 100;
        return (
          <div key={i} className={styles.referrerRow}>
            <span className={styles.referrerSource}>
              {ref.source === 'Direct' ? '🔗 Direct' : ref.source}
            </span>
            <div className={styles.referrerBar}>
              <div className={styles.referrerBarFill} style={{ width: `${percent}%` }} />
            </div>
            <span className={styles.referrerCount}>{ref.visitors}</span>
          </div>
        );
      })}
    </div>
  );
}

// Countries list
function CountriesList({ countries }) {
  if (!countries || countries.length === 0) {
    return <div className={styles.emptyState}>No country data</div>;
  }
  
  const total = countries.reduce((sum, c) => sum + (c.visitors || 0), 0) || 1;
  
  const getFlag = (code) => {
    if (!code || code.length !== 2) return '🌍';
    return String.fromCodePoint(...code.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0)));
  };
  
  return (
    <div className={styles.countriesList}>
      {countries.slice(0, 5).map((country, i) => {
        const percent = ((country.visitors || 0) / total) * 100;
        return (
          <div key={i} className={styles.countryRow}>
            <span className={styles.countryFlag}>{getFlag(country.country_code)}</span>
            <span className={styles.countryName}>{country.country}</span>
            <div className={styles.countryBar}>
              <div className={styles.countryBarFill} style={{ width: `${percent}%` }} />
            </div>
            <span className={styles.countryPercent}>{Math.round(percent)}%</span>
          </div>
        );
      })}
    </div>
  );
}

// Technology breakdown
function TechnologyBreakdown({ devices, browsers }) {
  const deviceTotal = devices?.reduce((sum, d) => sum + (d.visitors || 0), 0) || 1;
  
  const deviceIcons = {
    'Mobile': '📱',
    'Desktop': '💻',
    'Tablet': '📲'
  };
  
  return (
    <div className={styles.techGrid}>
      <div className={styles.techSection}>
        <h5 className={styles.techTitle}>Devices</h5>
        {devices?.length > 0 ? (
          devices.map((device, i) => {
            const percent = ((device.visitors || 0) / deviceTotal) * 100;
            return (
              <div key={i} className={styles.techRow}>
                <span className={styles.techIcon}>{deviceIcons[device.device] || '💻'}</span>
                <span className={styles.techName}>{device.device}</span>
                <span className={styles.techPercent}>{Math.round(percent)}%</span>
              </div>
            );
          })
        ) : (
          <span className={styles.noData}>No data</span>
        )}
      </div>
      
      <div className={styles.techSection}>
        <h5 className={styles.techTitle}>Browsers</h5>
        {browsers?.length > 0 ? (
          browsers.slice(0, 4).map((browser, i) => (
            <div key={i} className={styles.techRow}>
              <span className={styles.techName}>{browser.browser}</span>
              <span className={styles.techValue}>{browser.visitors}</span>
            </div>
          ))
        ) : (
          <span className={styles.noData}>No data</span>
        )}
      </div>
    </div>
  );
}

// Cohort retention heatmap
function CohortHeatmap({ cohorts }) {
  if (!cohorts || cohorts.length === 0) {
    return <div className={styles.emptyState}>No cohort data yet</div>;
  }
  
  const weeks = ['W0', 'W1', 'W2', 'W3', 'W4'];
  
  return (
    <div className={styles.cohortGrid}>
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
                  backgroundColor: `rgba(59, 130, 246, ${Math.min(retention / 100, 1)})`,
                  color: retention > 50 ? '#fff' : '#94a3b8'
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

// Goals table
function GoalsTable({ goals }) {
  if (!goals || goals.length === 0) {
    return <div className={styles.emptyState}>No goal tracking data</div>;
  }
  
  const formatGoalName = (key) => {
    return key?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Unknown';
  };
  
  return (
    <div className={styles.goalsTable}>
      {goals.slice(0, 5).map((goal, i) => (
        <div key={i} className={styles.goalRow}>
          <span className={styles.goalName}>{formatGoalName(goal.goal_key)}</span>
          <span className={styles.goalCount}>{goal.completions || 0}</span>
          <span className={styles.goalRate}>{(goal.conversion_rate || 0).toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
}

// Attribution breakdown
function AttributionBreakdown({ attribution }) {
  const [view, setView] = useState('source');
  
  const data = {
    source: attribution?.bySource || [],
    medium: attribution?.byMedium || [],
    campaign: attribution?.byCampaign || []
  };
  
  const currentData = data[view] || [];
  const total = currentData.reduce((sum, item) => sum + (item.users || 0), 0) || 1;
  
  return (
    <div className={styles.attributionSection}>
      <div className={styles.attributionTabs}>
        {['source', 'medium', 'campaign'].map(tab => (
          <button 
            key={tab}
            className={`${styles.attrTab} ${view === tab ? styles.attrTabActive : ''}`}
            onClick={() => setView(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
      
      <div className={styles.attributionList}>
        {currentData.length > 0 ? (
          currentData.slice(0, 5).map((item, i) => {
            const label = item.source || item.medium || item.campaign || 'Unknown';
            const percent = (item.users / total) * 100;
            return (
              <div key={i} className={styles.attrRow}>
                <span className={styles.attrLabel}>{label}</span>
                <div className={styles.attrBar}>
                  <div className={styles.attrBarFill} style={{ width: `${percent}%` }} />
                </div>
                <span className={styles.attrValue}>{item.users}</span>
              </div>
            );
          })
        ) : (
          <span className={styles.noData}>No attribution data</span>
        )}
      </div>
    </div>
  );
}

// Metric definitions
const METRIC_TOOLTIPS = {
  visitors: { content: 'Unique visitors based on session IDs.', target: '10%+ growth w/w' },
  pageViews: { content: 'Total page loads tracked.', target: '2-3× visitor count' },
  signups: { content: 'New user accounts created.', target: '2-5% of visitors' },
  conversions: { content: 'Users who became paying customers.', target: '5-10% of signups' },
  bounceRate: { content: 'Single page visits percentage.', target: '< 40%' },
  avgSession: { content: 'Average time per visit.', target: '> 2 minutes' }
};

// Main component
export function ConsolidatedAnalytics({ token, range = '7d' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState('pages');
  const [activeFunnelTab, setActiveFunnelTab] = useState('funnel');
  
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
      console.error('[ConsolidatedAnalytics] Error:', err);
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
  
  // Derived data
  const summary = useMemo(() => data?.site?.summary || {}, [data]);
  const actualSignups = data?.dashboard?.users?.newThisPeriod || 0;
  const conversions = data?.marketing?.funnel?.converted || 0;
  
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
          <p>Error: {error}</p>
          <button onClick={fetchData} className={styles.retryButton}>Retry</button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      {/* LEVEL 1: Hero KPIs (The Pulse) */}
      <div className={styles.heroSection}>
        <div className={styles.heroHeader}>
          <div className={styles.heroTitle}>
            <ActivityIcon size={22} />
            <h2>Site Analytics</h2>
          </div>
          <LiveIndicator count={summary.online || 0} />
        </div>
        
        <div className={styles.heroGrid}>
          <HeroKPI
            label="Visitors"
            value={(summary.visitors || 0).toLocaleString()}
            change={summary.visitorsChange}
            subtext="Unique sessions"
            icon={UsersIcon}
            color="blue"
            tooltip={METRIC_TOOLTIPS.visitors}
          />
          <HeroKPI
            label="Page Views"
            value={(summary.pageViews || 0).toLocaleString()}
            change={summary.pageViewsChange}
            subtext="Total views"
            icon={FileTextIcon}
            color="purple"
            tooltip={METRIC_TOOLTIPS.pageViews}
          />
          <HeroKPI
            label="Signups"
            value={actualSignups.toLocaleString()}
            change={data?.dashboard?.users?.growthPercent}
            subtext="+100%"
            icon={UserPlusIcon}
            color="green"
            tooltip={METRIC_TOOLTIPS.signups}
          />
          <HeroKPI
            label="Conversions"
            value={conversions.toLocaleString()}
            subtext="Paying users"
            icon={DollarSignIcon}
            color="amber"
            tooltip={METRIC_TOOLTIPS.conversions}
          />
        </div>
      </div>
      
      {/* LEVEL 2: Main Content Grid (The Context) */}
      <div className={styles.mainGrid}>
        {/* Left Column: Chart + Quick Stats */}
        <div className={styles.chartColumn}>
          {/* Large Visitor Chart */}
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3>Visitors Over Time</h3>
              <div className={styles.chartStats}>
                <span>Bounce: <strong>{summary.bounceRate || 0}%</strong></span>
                <span>Avg: <strong>{Math.round((data?.advanced?.engagement?.avgSessionDuration || 0) / 60)}m</strong></span>
                <span>Pages/Visit: <strong>{(data?.advanced?.engagement?.pagesPerSession || 0).toFixed(1)}</strong></span>
              </div>
            </div>
            <VisitorAreaChart data={data?.site?.dailyStats} height={220} />
          </div>
          
          {/* Engagement Bar */}
          <div className={styles.engagementCard}>
            <EngagementBar engagement={data?.advanced?.engagement?.tiers} />
          </div>
          
          {/* Quick Traffic Stats */}
          <div className={styles.quickStatsCard}>
            <div className={styles.quickStatItem}>
              <span className={styles.qsLabel}>Scroll Depth</span>
              <span className={styles.qsValue}>{Math.round(data?.advanced?.engagement?.avgScrollDepth || 0)}%</span>
            </div>
            <div className={styles.quickStatItem}>
              <span className={styles.qsLabel}>Time on Page</span>
              <span className={styles.qsValue}>{Math.round(data?.advanced?.engagement?.avgTimeOnPage || 0)}s</span>
            </div>
            <div className={styles.quickStatItem}>
              <span className={styles.qsLabel}>Clicks/Page</span>
              <span className={styles.qsValue}>{(data?.advanced?.engagement?.avgClicksPerPage || 0).toFixed(1)}</span>
            </div>
            <div className={styles.quickStatItem}>
              <span className={styles.qsLabel}>Engagement Score</span>
              <span className={styles.qsValue}>{(data?.advanced?.engagement?.avgScore || 0).toFixed(1)}/10</span>
            </div>
          </div>
        </div>
        
        {/* Right Column: Conversion Funnel */}
        <div className={styles.funnelColumn}>
          <div className={styles.funnelCard}>
            <div className={styles.funnelTabs}>
              {[
                { id: 'funnel', icon: TargetIcon, label: 'Funnel' },
                { id: 'attribution', icon: LinkIcon, label: 'Attribution' },
                { id: 'cohorts', icon: UsersIcon, label: 'Cohorts' },
                { id: 'goals', icon: ZapIcon, label: 'Goals' },
              ].map(tab => (
                <button 
                  key={tab.id}
                  className={`${styles.funnelTab} ${activeFunnelTab === tab.id ? styles.funnelTabActive : ''}`}
                  onClick={() => setActiveFunnelTab(tab.id)}
                >
                  <tab.icon size={14} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
            
            <div className={styles.funnelContent}>
              {activeFunnelTab === 'funnel' && (
                <>
                  <h4 className={styles.contentTitle}>Conversion Funnel</h4>
                  <p className={styles.contentDesc}>Track users from first visit through to conversion.</p>
                  <ConversionFunnel funnel={data?.marketing?.funnel} signups={actualSignups} />
                </>
              )}
              
              {activeFunnelTab === 'attribution' && (
                <>
                  <h4 className={styles.contentTitle}>Traffic Attribution</h4>
                  <p className={styles.contentDesc}>Where your users come from.</p>
                  <AttributionBreakdown attribution={data?.marketing?.attribution} />
                </>
              )}
              
              {activeFunnelTab === 'cohorts' && (
                <>
                  <h4 className={styles.contentTitle}>Cohort Retention</h4>
                  <p className={styles.contentDesc}>How well you retain users over time.</p>
                  <CohortHeatmap cohorts={data?.marketing?.cohorts} />
                </>
              )}
              
              {activeFunnelTab === 'goals' && (
                <>
                  <h4 className={styles.contentTitle}>Goal Completions</h4>
                  <p className={styles.contentDesc}>Key user actions and milestones.</p>
                  <GoalsTable goals={data?.advanced?.goals} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* LEVEL 3: Detailed Data (The Grain) */}
      <div className={styles.detailSection}>
        <div className={styles.detailTabs}>
          {[
            { id: 'pages', icon: FileTextIcon, label: 'Top Pages' },
            { id: 'referrers', icon: LinkIcon, label: 'Referrers' },
            { id: 'geography', icon: GlobeIcon, label: 'Geography' },
            { id: 'technology', icon: MonitorIcon, label: 'Technology' },
          ].map(tab => (
            <button 
              key={tab.id}
              className={`${styles.detailTab} ${activeDetailTab === tab.id ? styles.detailTabActive : ''}`}
              onClick={() => setActiveDetailTab(tab.id)}
            >
              <tab.icon size={14} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        
        <div className={styles.detailContent}>
          {activeDetailTab === 'pages' && <TopPagesTable pages={data?.site?.topPages} />}
          {activeDetailTab === 'referrers' && <ReferrersList referrers={data?.site?.referrers} />}
          {activeDetailTab === 'geography' && <CountriesList countries={data?.site?.countries} />}
          {activeDetailTab === 'technology' && <TechnologyBreakdown devices={data?.site?.devices} browsers={data?.site?.browsers} />}
        </div>
      </div>
    </div>
  );
}

export default ConsolidatedAnalytics;

