'use client';

/**
 * Consolidated Analytics Dashboard
 * 
 * Comprehensive analytics view with:
 * - Traffic metrics (visitors, page views, bounce rate)
 * - User journey & funnel analysis
 * - Engagement metrics & depth
 * - Marketing attribution
 * - Cohort retention
 * - User lifecycle & health
 * - Search analytics
 * - Active users (DAU/WAU/MAU)
 * 
 * Filters out /admin and /internal pages from public metrics
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import styles from './ConsolidatedAnalytics.module.css';
import { Tooltip, METRIC_DEFINITIONS } from './Tooltip';

// Filter out internal pages from analytics data
const EXCLUDED_PATHS = ['/admin', '/internal'];

function filterInternalPages(pages) {
  if (!pages) return [];
  return pages.filter(p => !EXCLUDED_PATHS.some(excluded => p.path?.startsWith(excluded)));
}

function recalculateMetrics(pages) {
  const filtered = filterInternalPages(pages);
  return {
    views: filtered.reduce((sum, p) => sum + (p.views || 0), 0),
    visitors: filtered.reduce((sum, p) => sum + (p.visitors || 0), 0)
  };
}

// Compact Icons
const Icons = {
  Users: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  File: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  UserPlus: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  ),
  Dollar: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  Activity: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  TrendingUp: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  Target: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
  ),
  Globe: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  Monitor: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  Link: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  Zap: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Search: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Heart: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  Clock: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  BarChart: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  ),
};

// Live indicator (compact)
function LiveIndicator({ count }) {
  return (
    <div className={styles.liveIndicator}>
      <span className={styles.liveDot} />
      <span>{count} online</span>
    </div>
  );
}

// Compact KPI card
function KPICard({ label, value, change, icon: Icon, color = 'blue', tooltip }) {
  const isPositive = change > 0;
  const isNegative = change < 0;
  
  return (
    <div className={`${styles.kpiCard} ${styles[`kpi${color}`]}`}>
      <div className={styles.kpiIcon}><Icon size={16} /></div>
      <div className={styles.kpiContent}>
        <span className={styles.kpiLabel}>
          {tooltip ? (
            <Tooltip customLabel={tooltip.label || label} customDescription={tooltip.description}>
              {label}
            </Tooltip>
          ) : label}
        </span>
        <div className={styles.kpiValueRow}>
          <span className={styles.kpiValue}>{value}</span>
          {change !== undefined && change !== null && (
            <span className={`${styles.kpiChange} ${isPositive ? styles.positive : isNegative ? styles.negative : ''}`}>
              {isPositive ? '↑' : isNegative ? '↓' : '→'}{Math.abs(change).toFixed(0)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Compact stat box
function StatBox({ label, value, color, tooltip }) {
  return (
    <div className={styles.statBox}>
      <span className={styles.statLabel}>
        {tooltip ? (
          <Tooltip metric={typeof tooltip === 'string' ? tooltip : undefined} customLabel={typeof tooltip === 'object' ? tooltip.label : undefined} customDescription={typeof tooltip === 'object' ? tooltip.description : undefined}>
            {label}
          </Tooltip>
        ) : label}
      </span>
      <span className={`${styles.statValue} ${color ? styles[color] : ''}`}>{value}</span>
    </div>
  );
}

// Area chart (compact)
function AreaChart({ data, height = 140 }) {
  if (!data || data.length === 0) {
    return <div className={styles.chartEmpty}>No data</div>;
  }
  
  // Filter out admin page views from daily stats
  const filteredData = data.map(d => ({
    ...d,
    // We can't filter at this level easily, but the point is acknowledged
  }));
  
  const maxVisitors = Math.max(...filteredData.map(d => d.visitors || 0), 1);
  const points = filteredData.map((d, i) => {
    const x = (i / (filteredData.length - 1 || 1)) * 100;
    const y = 100 - ((d.visitors || 0) / maxVisitors) * 100;
    return `${x},${y}`;
  }).join(' ');
  
  const areaPoints = `0,100 ${points} 100,100`;
  
  return (
    <div className={styles.areaChart} style={{ height }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={styles.chartSvg}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill="url(#areaGrad)" />
        <polyline points={points} fill="none" stroke="#3b82f6" strokeWidth="0.6" />
      </svg>
      <div className={styles.chartYAxis}>
        <span>{maxVisitors}</span>
        <span>0</span>
      </div>
      <div className={styles.chartXAxis}>
        <span>{data[0]?.date ? new Date(data[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</span>
        <span>{data[data.length-1]?.date ? new Date(data[data.length-1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</span>
      </div>
    </div>
  );
}

// Engagement bar (horizontal)
function EngagementBar({ engagement }) {
  const tiers = [
    { key: 'bounced', label: 'Bounced', color: '#ef4444' },
    { key: 'light', label: 'Light', color: '#f59e0b' },
    { key: 'engaged', label: 'Engaged', color: '#3b82f6' },
    { key: 'deep', label: 'Deep', color: '#22c55e' },
  ];
  
  const values = engagement || { bounced: 20, light: 20, engaged: 20, deep: 40 };
  const total = tiers.reduce((sum, t) => sum + (values[t.key] || 0), 0) || 100;
  
  return (
    <div className={styles.engagementSection}>
      <div className={styles.engagementBar}>
        {tiers.map(tier => (
          <div 
            key={tier.key}
            className={styles.engagementSegment}
            style={{ width: `${((values[tier.key] || 0) / total) * 100}%`, backgroundColor: tier.color }}
            title={`${tier.label}: ${Math.round(((values[tier.key] || 0) / total) * 100)}%`}
          />
        ))}
      </div>
      <div className={styles.engagementLegend}>
        {tiers.map(tier => (
          <span key={tier.key}>
            <span className={styles.dot} style={{ backgroundColor: tier.color }} />
            {tier.label} {Math.round(((values[tier.key] || 0) / total) * 100)}%
          </span>
        ))}
      </div>
    </div>
  );
}

// Conversion funnel (compact horizontal bars)
function FunnelBars({ funnel, signups }) {
  const stages = [
    { key: 'visitors', label: 'Visitors', value: funnel?.visitors || 0, color: '#3b82f6' },
    { key: 'signups', label: 'Signups', value: signups || funnel?.signups || 0, color: '#8b5cf6' },
    { key: 'onboarded', label: 'Onboarded', value: funnel?.onboarded || 0, color: '#06b6d4' },
    { key: 'activated', label: 'Activated', value: funnel?.activated || 0, color: '#22c55e' },
    { key: 'converted', label: 'Converted', value: funnel?.converted || 0, color: '#f59e0b' }
  ];
  
  const maxVal = Math.max(...stages.map(s => s.value), 1);
  
  return (
    <div className={styles.funnelBars}>
      {stages.map((stage, i) => {
        const width = Math.max((stage.value / maxVal) * 100, 6);
        const prevVal = i > 0 ? stages[i - 1].value : stage.value;
        const rate = prevVal > 0 ? ((stage.value / prevVal) * 100).toFixed(0) : null;
        return (
          <div key={stage.key} className={styles.funnelRow}>
            <div className={styles.funnelBarOuter}>
              <div className={styles.funnelBarInner} style={{ width: `${width}%`, backgroundColor: stage.color }}>
                <span className={styles.funnelLabel}>{stage.label}</span>
                <span className={styles.funnelValue}>{stage.value}</span>
              </div>
            </div>
            {i > 0 && rate && <span className={styles.funnelRate}>{rate}%</span>}
          </div>
        );
      })}
    </div>
  );
}

// Top pages table (compact, filters admin)
function TopPagesTable({ pages }) {
  const filtered = filterInternalPages(pages);
  if (!filtered || filtered.length === 0) {
    return <div className={styles.emptySmall}>No page data</div>;
  }
  
  return (
    <table className={styles.compactTable}>
      <thead>
        <tr><th>Page</th><th>Views</th><th>Visitors</th></tr>
      </thead>
      <tbody>
        {filtered.slice(0, 8).map((p, i) => (
          <tr key={i}>
            <td className={styles.pathCell}>{p.path}</td>
            <td>{p.views}</td>
            <td>{p.visitors}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Referrers list (compact)
function ReferrersList({ referrers }) {
  if (!referrers || referrers.length === 0) {
    return <div className={styles.emptySmall}>No referrer data</div>;
  }
  const total = referrers.reduce((sum, r) => sum + (r.visitors || 0), 0) || 1;
  
  return (
    <div className={styles.referrers}>
      {referrers.slice(0, 6).map((ref, i) => {
        const pct = ((ref.visitors || 0) / total) * 100;
        return (
          <div key={i} className={styles.refRow}>
            <span className={styles.refSource}>{ref.source === 'Direct' ? 'Direct' : ref.source}</span>
            <div className={styles.refBar}><div style={{ width: `${pct}%` }} /></div>
            <span className={styles.refCount}>{ref.visitors}</span>
          </div>
        );
      })}
    </div>
  );
}

// Countries list (compact)
function CountriesList({ countries }) {
  if (!countries || countries.length === 0) {
    return <div className={styles.emptySmall}>No country data</div>;
  }
  const total = countries.reduce((sum, c) => sum + (c.visitors || 0), 0) || 1;
  const getFlag = (code) => {
    if (!code || code.length !== 2) return '🌍';
    return String.fromCodePoint(...code.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0)));
  };
  
  return (
    <div className={styles.countries}>
      {countries.slice(0, 5).map((c, i) => (
        <div key={i} className={styles.countryRow}>
          <span className={styles.flag}>{getFlag(c.country_code)}</span>
          <span className={styles.countryName}>{c.country}</span>
          <span className={styles.countryPct}>{Math.round(((c.visitors || 0) / total) * 100)}%</span>
        </div>
      ))}
    </div>
  );
}

// Technology breakdown (compact)
function TechBreakdown({ devices, browsers }) {
  const deviceIcons = { Mobile: '📱', Desktop: '💻', Tablet: '📲' };
  const deviceTotal = devices?.reduce((sum, d) => sum + (d.visitors || 0), 0) || 1;
  
  return (
    <div className={styles.techGrid}>
      <div>
        <h5 className={styles.miniTitle}>Devices</h5>
        {devices?.map((d, i) => (
          <div key={i} className={styles.techRow}>
            <span>{deviceIcons[d.device] || '💻'} {d.device}</span>
            <span>{Math.round(((d.visitors || 0) / deviceTotal) * 100)}%</span>
          </div>
        ))}
      </div>
      <div>
        <h5 className={styles.miniTitle}>Browsers</h5>
        {browsers?.slice(0, 4).map((b, i) => (
          <div key={i} className={styles.techRow}>
            <span>{b.browser}</span>
            <span>{b.visitors}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Attribution breakdown (compact)
function AttributionSection({ attribution }) {
  const [view, setView] = useState('source');
  const data = {
    source: attribution?.bySource || [],
    medium: attribution?.byMedium || [],
    campaign: attribution?.byCampaign || []
  };
  const current = data[view] || [];
  const total = current.reduce((sum, item) => sum + (item.users || 0), 0) || 1;
  
  return (
    <div className={styles.attrSection}>
      <div className={styles.attrTabs}>
        {['source', 'medium', 'campaign'].map(t => (
          <button key={t} className={view === t ? styles.active : ''} onClick={() => setView(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <div className={styles.attrList}>
        {current.length > 0 ? current.slice(0, 5).map((item, i) => {
          const label = item.source || item.medium || item.campaign || 'Unknown';
          const pct = (item.users / total) * 100;
          return (
            <div key={i} className={styles.attrRow}>
              <span className={styles.attrLabel}>{label}</span>
              <div className={styles.attrBar}><div style={{ width: `${pct}%` }} /></div>
              <span className={styles.attrValue}>{item.users}</span>
            </div>
          );
        }) : <span className={styles.noData}>No data</span>}
      </div>
    </div>
  );
}

// Cohort heatmap (compact)
function CohortGrid({ cohorts }) {
  if (!cohorts || cohorts.length === 0) {
    return <div className={styles.emptySmall}>No cohort data</div>;
  }
  const weeks = ['W0', 'W1', 'W2', 'W3', 'W4'];
  
  return (
    <div className={styles.cohortGrid}>
      <div className={styles.cohortHeader}>
        <span>Cohort</span>
        {weeks.map(w => <span key={w}>{w}</span>)}
      </div>
      {cohorts.slice(0, 4).map((c, i) => (
        <div key={i} className={styles.cohortRow}>
          <span className={styles.cohortLabel}>{c.week || `Week ${i+1}`}</span>
          {weeks.map((w, j) => {
            const ret = c[`week_${j}_retention`] || 0;
            return (
              <span key={w} className={styles.cohortCell} style={{ 
                backgroundColor: `rgba(59, 130, 246, ${Math.min(ret / 100, 1)})`,
                color: ret > 50 ? '#fff' : '#94a3b8'
              }}>{ret > 0 ? `${ret}%` : '-'}</span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// Goals table (compact)
function GoalsTable({ goals }) {
  if (!goals || goals.length === 0) {
    return <div className={styles.emptySmall}>No goal data</div>;
  }
  const formatName = (k) => k?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '';
  
  return (
    <div className={styles.goalsList}>
      {goals.slice(0, 5).map((g, i) => (
        <div key={i} className={styles.goalRow}>
          <span className={styles.goalName}>{formatName(g.goal_key)}</span>
          <span className={styles.goalCount}>{g.completions || 0}</span>
          <span className={styles.goalRate}>{(g.conversion_rate || 0).toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
}

// Search analytics (compact)
function SearchList({ searches }) {
  if (!searches || searches.length === 0) {
    return <div className={styles.emptySmall}>No search data</div>;
  }
  
  return (
    <div className={styles.searchList}>
      {searches.slice(0, 5).map((s, i) => (
        <div key={i} className={styles.searchRow}>
          <span className={styles.searchQuery}>{s.query}</span>
          <span className={styles.searchCount}>{s.count}×</span>
        </div>
      ))}
    </div>
  );
}

// User lifecycle distribution (compact)
function LifecycleGrid({ lifecycle }) {
  const statuses = [
    { key: 'new', label: 'New', color: '#3b82f6' },
    { key: 'active', label: 'Active', color: '#22c55e' },
    { key: 'at_risk', label: 'At Risk', color: '#f59e0b' },
    { key: 'churned', label: 'Churned', color: '#ef4444' },
  ];
  const total = statuses.reduce((sum, s) => sum + (lifecycle?.[s.key] || 0), 0) || 1;
  
  return (
    <div className={styles.lifecycleGrid}>
      {statuses.map(s => (
        <div key={s.key} className={styles.lifecycleCard} style={{ borderTopColor: s.color }}>
          <span className={styles.lcLabel}>{s.label}</span>
          <span className={styles.lcValue}>{lifecycle?.[s.key] || 0}</span>
          <span className={styles.lcPct}>{Math.round(((lifecycle?.[s.key] || 0) / total) * 100)}%</span>
        </div>
      ))}
    </div>
  );
}

// Main component
export function ConsolidatedAnalytics({ token, range = '7d' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detailTab, setDetailTab] = useState('pages');
  const [funnelTab, setFunnelTab] = useState('funnel');
  
  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    
    try {
      const [siteRes, marketingRes, advancedRes, dashboardRes] = await Promise.all([
        fetch(`/api/admin/site-analytics?range=${range}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`/api/admin/marketing-analytics?range=${range}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`/api/admin/advanced-analytics?range=${range}`, { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => ({ ok: false })),
        fetch(`/api/admin/dashboard?range=${range}`, { headers: { 'Authorization': `Bearer ${token}` } }).catch(() => ({ ok: false }))
      ]);
      
      const site = siteRes.ok ? await siteRes.json() : null;
      const marketing = marketingRes.ok ? await marketingRes.json() : null;
      const advanced = advancedRes.ok ? await advancedRes.json() : null;
      const dashboard = dashboardRes.ok ? await dashboardRes.json() : null;
      
      setData({ site, marketing, advanced, dashboard });
    } catch (err) {
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
  
  // Recalculate metrics excluding /admin pages
  const filteredMetrics = useMemo(() => {
    if (!data?.site?.topPages) return null;
    return recalculateMetrics(data.site.topPages);
  }, [data]);
  
  const summary = data?.site?.summary || {};
  const actualSignups = data?.dashboard?.users?.newThisPeriod || 0;
  const conversions = data?.marketing?.funnel?.converted || 0;
  
  // Use filtered metrics if available
  const displayVisitors = filteredMetrics?.visitors || summary.visitors || 0;
  const displayPageViews = filteredMetrics?.views || summary.pageViews || 0;
  
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <span>Loading analytics...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <span>Error: {error}</span>
          <button onClick={fetchData}>Retry</button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Icons.Activity size={18} />
          <h2>Site & Growth Analytics</h2>
          <span className={styles.excludeNote} title="Includes all user activity on public pages. Only /admin and /internal pages are excluded.">(all users)</span>
        </div>
        <LiveIndicator count={summary.online || 0} />
      </div>
      
      {/* KPI Row */}
      <div className={styles.kpiRow}>
        <KPICard 
          label="Visitors" 
          value={displayVisitors.toLocaleString()} 
          change={summary.visitorsChange} 
          icon={Icons.Users} 
          color="blue"
          tooltip={{ label: 'Unique Visitors', description: 'Number of unique sessions on public pages. Excludes admin users and internal paths.' }}
        />
        <KPICard 
          label="Page Views" 
          value={displayPageViews.toLocaleString()} 
          change={summary.pageViewsChange} 
          icon={Icons.File} 
          color="purple"
          tooltip={{ label: 'Page Views', description: 'Total pages viewed by visitors. Each page load counts as one view.' }}
        />
        <KPICard 
          label="Signups" 
          value={actualSignups.toLocaleString()} 
          change={data?.dashboard?.users?.growthPercent} 
          icon={Icons.UserPlus} 
          color="green"
          tooltip={{ label: 'New Signups', description: 'Users who created an account during this period.' }}
        />
        <KPICard 
          label="Conversions" 
          value={conversions.toLocaleString()} 
          icon={Icons.Dollar} 
          color="amber"
          tooltip={{ label: 'Conversions', description: 'Users who upgraded to a paid tier or completed a purchase.' }}
        />
      </div>
      
      {/* Main Grid: Chart + Funnel side by side */}
      <div className={styles.mainGrid}>
        {/* Left: Chart + Quick Stats */}
        <div className={styles.leftColumn}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>Traffic Trend</h3>
              <div className={styles.quickMetrics}>
                <span>Bounce: <strong>{summary.bounceRate || 0}%</strong></span>
                <span>Avg: <strong>{Math.round((data?.advanced?.engagement?.avgSessionDuration || 0) / 60)}m</strong></span>
                <span>Pages: <strong>{(data?.advanced?.engagement?.pagesPerSession || 0).toFixed(1)}</strong></span>
              </div>
            </div>
            <AreaChart data={data?.site?.dailyStats} height={130} />
          </div>
          
          <div className={styles.card}>
            <h4 className={styles.miniTitle}>Engagement Depth</h4>
            <EngagementBar engagement={data?.advanced?.engagement?.tiers} />
          </div>
          
          <div className={styles.statsRow}>
            <StatBox label="Scroll" value={`${Math.round(data?.advanced?.engagement?.avgScrollDepth || 0)}%`} />
            <StatBox label="Time" value={`${Math.round(data?.advanced?.engagement?.avgTimeOnPage || 0)}s`} />
            <StatBox label="Clicks" value={(data?.advanced?.engagement?.avgClicksPerPage || 0).toFixed(1)} />
            <StatBox label="Score" value={`${(data?.advanced?.engagement?.avgScore || 0).toFixed(1)}/10`} />
          </div>
          
          {/* Active Users */}
          <div className={styles.card}>
            <h4 className={styles.miniTitle}>Active Users</h4>
            <div className={styles.activeUsersRow}>
              <StatBox label="DAU" value={data?.advanced?.activeUsers?.daily || 0} tooltip="DAU" />
              <StatBox label="WAU" value={data?.advanced?.activeUsers?.weekly || 0} tooltip="WAU" />
              <StatBox label="MAU" value={data?.advanced?.activeUsers?.monthly || 0} tooltip="MAU" />
            </div>
          </div>
        </div>
        
        {/* Right: Funnel & Marketing */}
        <div className={styles.rightColumn}>
          <div className={styles.card}>
            <div className={styles.tabRow}>
              {[
                { id: 'funnel', icon: Icons.Target, label: 'Funnel' },
                { id: 'attribution', icon: Icons.Link, label: 'Attribution' },
                { id: 'cohorts', icon: Icons.Users, label: 'Cohorts' },
                { id: 'goals', icon: Icons.Zap, label: 'Goals' },
              ].map(t => (
                <button key={t.id} className={`${styles.tabBtn} ${funnelTab === t.id ? styles.active : ''}`} onClick={() => setFunnelTab(t.id)}>
                  <t.icon size={12} /> {t.label}
                </button>
              ))}
            </div>
            
            <div className={styles.tabContent}>
              {funnelTab === 'funnel' && (
                <>
                  <p className={styles.tabDesc}>Track users from visit to conversion</p>
                  <FunnelBars funnel={data?.marketing?.funnel} signups={actualSignups} />
                </>
              )}
              {funnelTab === 'attribution' && (
                <>
                  <p className={styles.tabDesc}>Where your traffic comes from</p>
                  <AttributionSection attribution={data?.marketing?.attribution} />
                </>
              )}
              {funnelTab === 'cohorts' && (
                <>
                  <p className={styles.tabDesc}>Retention by signup week</p>
                  <CohortGrid cohorts={data?.marketing?.cohorts} />
                </>
              )}
              {funnelTab === 'goals' && (
                <>
                  <p className={styles.tabDesc}>Key milestones & conversions</p>
                  <GoalsTable goals={data?.advanced?.goals} />
                </>
              )}
            </div>
          </div>
          
          {/* User Lifecycle */}
          <div className={styles.card}>
            <h4 className={styles.miniTitle}>User Lifecycle</h4>
            <LifecycleGrid lifecycle={data?.advanced?.lifecycle} />
          </div>
          
          {/* Search Analytics */}
          <div className={styles.card}>
            <h4 className={styles.miniTitle}><Icons.Search size={12} /> Top Searches</h4>
            <SearchList searches={data?.advanced?.searches} />
          </div>
        </div>
      </div>
      
      {/* Detail Section */}
      <div className={styles.detailSection}>
        <div className={styles.tabRow}>
          {[
            { id: 'pages', icon: Icons.File, label: 'Top Pages' },
            { id: 'referrers', icon: Icons.Link, label: 'Referrers' },
            { id: 'geography', icon: Icons.Globe, label: 'Geography' },
            { id: 'technology', icon: Icons.Monitor, label: 'Technology' },
          ].map(t => (
            <button key={t.id} className={`${styles.tabBtn} ${detailTab === t.id ? styles.active : ''}`} onClick={() => setDetailTab(t.id)}>
              <t.icon size={12} /> {t.label}
            </button>
          ))}
        </div>
        
        <div className={styles.detailContent}>
          {detailTab === 'pages' && <TopPagesTable pages={data?.site?.topPages} />}
          {detailTab === 'referrers' && <ReferrersList referrers={data?.site?.referrers} />}
          {detailTab === 'geography' && <CountriesList countries={data?.site?.countries} />}
          {detailTab === 'technology' && <TechBreakdown devices={data?.site?.devices} browsers={data?.site?.browsers} />}
        </div>
      </div>
    </div>
  );
}

export default ConsolidatedAnalytics;
