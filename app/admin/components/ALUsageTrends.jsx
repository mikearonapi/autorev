'use client';

/**
 * AL Usage Trends Component
 * 
 * Visualizes AL (AI Assistant) usage trends over time.
 * Following data visualization rules:
 * - Line/Area charts for trends over time ✓
 * - Interpretive titles ✓
 * - Time range selector ✓
 * - Multi-scale perspectives ✓
 * - Direct labeling ✓
 */

import { useState, useMemo } from 'react';

import { useAdminALTrends } from '@/hooks/useAdminData';

import styles from './ALUsageTrends.module.css';

// SVG Icons
const BrainIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 4.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0-1.32 4.24 3 3 0 0 0 .34 5.58 2.5 2.5 0 0 0 2.96 3.08A2.5 2.5 0 0 0 12 19.5a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 12 4.5"/>
    <path d="m15.7 10.4-.9.4"/>
    <path d="m9.2 13.2-.9.4"/>
  </svg>
);

const TrendUpIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
    <polyline points="16 7 22 7 22 13"/>
  </svg>
);

const TrendDownIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/>
    <polyline points="16 17 22 17 22 11"/>
  </svg>
);

const MessageIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const TokenIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 6v12"/>
    <path d="M6 12h12"/>
  </svg>
);

// Metric type configuration
const METRIC_TYPES = [
  { key: 'tokens', label: 'Tokens', color: '#8B5CF6', icon: TokenIcon },
  { key: 'messages', label: 'Messages', color: '#3B82F6', icon: MessageIcon },
  { key: 'conversations', label: 'Conversations', color: '#22C55E', icon: MessageIcon },
  { key: 'uniqueUsers', label: 'Active Users', color: '#F59E0B', icon: null },
];

// Format numbers for display
function formatNumber(num) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

// Format date for display
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Generate interpretive title
function generateTitle(summary, selectedMetric, days) {
  if (!summary) return 'Loading AL usage trends...';
  
  const metricLabel = METRIC_TYPES.find(t => t.key === selectedMetric)?.label || selectedMetric;
  const growth = summary.growthPercent || 0;
  
  if (selectedMetric === 'tokens') {
    const totalTokens = formatNumber(summary.totalTokens);
    if (growth === 0) {
      return `${totalTokens} tokens consumed — stable usage over ${days} days`;
    }
    const direction = growth > 0 ? 'up' : 'down';
    return `Token usage is ${direction} ${Math.abs(growth)}% — ${totalTokens} total over ${days} days`;
  }
  
  if (selectedMetric === 'messages') {
    const total = summary.totalMessages;
    return `${formatNumber(total)} AL messages sent over ${days} days`;
  }
  
  if (selectedMetric === 'conversations') {
    const total = summary.totalConversations;
    return `${formatNumber(total)} AL conversations started in ${days} days`;
  }
  
  return `${metricLabel} trends over the last ${days} days`;
}

// Growth indicator badge
function GrowthBadge({ value }) {
  if (value === 0 || value === undefined) return <span className={styles.neutralBadge}>—</span>;
  
  const isPositive = value > 0;
  return (
    <span className={`${styles.growthBadge} ${isPositive ? styles.positive : styles.negative}`}>
      {isPositive ? <TrendUpIcon size={12} /> : <TrendDownIcon size={12} />}
      {Math.abs(value)}%
    </span>
  );
}

// Metric type selector
function MetricSelector({ selected, onSelect }) {
  return (
    <div className={styles.metricSelector}>
      {METRIC_TYPES.map(type => (
        <button
          key={type.key}
          className={`${styles.metricButton} ${selected === type.key ? styles.selected : ''}`}
          onClick={() => onSelect(type.key)}
          style={{ '--metric-color': type.color }}
        >
          <span className={styles.metricDot} style={{ backgroundColor: type.color }} />
          <span>{type.label}</span>
        </button>
      ))}
    </div>
  );
}

// Bar chart for daily data (better for discrete daily data per viz rules)
function DailyBarChart({ data, selectedMetric, color, height = 180 }) {
  if (!data || data.length < 2) {
    return (
      <div className={styles.emptyChart} style={{ height }}>
        <span>Not enough data to display chart</span>
      </div>
    );
  }
  
  const values = data.map(d => d[selectedMetric] || 0);
  const max = Math.max(...values) || 1;
  
  // Show last 14 bars max for readability
  const displayData = data.slice(-14);
  
  return (
    <div className={styles.chartContainer} style={{ height }}>
      <div className={styles.barChart}>
        {displayData.map((d, i) => {
          const value = d[selectedMetric] || 0;
          const heightPercent = (value / max) * 100;
          const isToday = i === displayData.length - 1;
          
          return (
            <div key={d.date} className={styles.barColumn}>
              <div className={styles.barWrapper}>
                <div
                  className={`${styles.bar} ${isToday ? styles.today : ''}`}
                  style={{
                    height: `${heightPercent}%`,
                    backgroundColor: isToday ? color : `${color}80`,
                  }}
                >
                  {heightPercent > 20 && (
                    <span className={styles.barValue}>{formatNumber(value)}</span>
                  )}
                </div>
              </div>
              <span className={styles.barLabel}>
                {formatDate(d.date).split(' ')[1]}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Y-axis max label */}
      <div className={styles.yAxisLabel}>{formatNumber(max)}</div>
    </div>
  );
}

// Summary KPI cards
function SummaryKPIs({ summary, selectedMetric }) {
  if (!summary) return null;
  
  const config = METRIC_TYPES.find(t => t.key === selectedMetric);
  
  const getValue = () => {
    switch (selectedMetric) {
      case 'tokens': return summary.totalTokens;
      case 'messages': return summary.totalMessages;
      case 'conversations': return summary.totalConversations;
      case 'uniqueUsers': return summary.uniqueUsers;
      default: return 0;
    }
  };
  
  const getAvg = () => {
    switch (selectedMetric) {
      case 'tokens': return summary.avgTokensPerDay;
      case 'messages': return summary.avgMessagesPerDay;
      default: return Math.round(getValue() / (summary.activeDays || 1));
    }
  };
  
  return (
    <div className={styles.kpiGrid}>
      <div className={styles.kpiCard}>
        <span className={styles.kpiValue} style={{ color: config?.color }}>
          {formatNumber(getValue())}
        </span>
        <span className={styles.kpiLabel}>Total {config?.label}</span>
      </div>
      
      <div className={styles.kpiCard}>
        <span className={styles.kpiValue}>{formatNumber(getAvg())}</span>
        <span className={styles.kpiLabel}>Daily Average</span>
      </div>
      
      <div className={styles.kpiCard}>
        <span className={styles.kpiValue}>{summary.activeDays || 0}</span>
        <span className={styles.kpiLabel}>Active Days</span>
      </div>
      
      <div className={styles.kpiCard}>
        <GrowthBadge value={summary.growthPercent} />
        <span className={styles.kpiLabel}>Period Growth</span>
      </div>
    </div>
  );
}

// Breakdown section (purposes and sources)
function BreakdownSection({ breakdown }) {
  if (!breakdown?.purposes?.length && !breakdown?.sources?.length) return null;
  
  return (
    <div className={styles.breakdownSection}>
      {breakdown.purposes?.length > 0 && (
        <div className={styles.breakdownGroup}>
          <h4 className={styles.breakdownTitle}>Usage by Purpose</h4>
          <div className={styles.breakdownList}>
            {breakdown.purposes.slice(0, 5).map(p => (
              <div key={p.name} className={styles.breakdownItem}>
                <span className={styles.breakdownName}>{p.name}</span>
                <span className={styles.breakdownCount}>{formatNumber(p.count)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {breakdown.sources?.length > 0 && (
        <div className={styles.breakdownGroup}>
          <h4 className={styles.breakdownTitle}>Usage by Source</h4>
          <div className={styles.breakdownList}>
            {breakdown.sources.slice(0, 5).map(s => (
              <div key={s.name} className={styles.breakdownItem}>
                <span className={styles.breakdownName}>{s.name}</span>
                <span className={styles.breakdownCount}>{formatNumber(s.count)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Main component
export function ALUsageTrends({ token: _token }) {
  const [days, setDays] = useState(30);
  const [selectedMetric, setSelectedMetric] = useState('tokens');
  
  // Use React Query hook for AL trends
  const { 
    data, 
    isLoading: loading, 
    error: queryError,
  } = useAdminALTrends(days);
  
  const error = queryError?.message || null;
  
  const chartData = useMemo(() => data?.chartData || [], [data]);
  const selectedConfig = METRIC_TYPES.find(t => t.key === selectedMetric);
  const interpretiveTitle = generateTitle(data?.summary, selectedMetric, days);
  
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>Loading AL usage trends...</h3>
        </div>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner} />
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>Unable to load AL usage trends</h3>
        </div>
        <div className={styles.error}>Error: {error}</div>
      </div>
    );
  }
  
  if (!data || !data.chartData?.length) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>No AL usage data available</h3>
        </div>
        <div className={styles.emptyState}>
          <BrainIcon size={32} />
          <span>AL usage data will appear here once users start interacting with AL</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      {/* Header with interpretive title */}
      <div className={styles.header}>
        <div className={styles.headerMain}>
          <div className={styles.headerIcon}>
            <BrainIcon size={20} />
          </div>
          <div className={styles.headerText}>
            <h3 className={styles.title}>{interpretiveTitle}</h3>
            <span className={styles.subtitle}>AL Usage Trends</span>
          </div>
        </div>
        
        {/* Time range selector */}
        <div className={styles.rangeSelector}>
          {[7, 14, 30].map(d => (
            <button
              key={d}
              className={`${styles.rangeButton} ${days === d ? styles.active : ''}`}
              onClick={() => setDays(d)}
            >
              {d}D
            </button>
          ))}
        </div>
      </div>
      
      {/* Metric type selector */}
      <MetricSelector selected={selectedMetric} onSelect={setSelectedMetric} />
      
      {/* Bar chart */}
      <DailyBarChart
        data={chartData}
        selectedMetric={selectedMetric}
        color={selectedConfig?.color || '#8B5CF6'}
      />
      
      {/* Summary KPIs */}
      <SummaryKPIs summary={data.summary} selectedMetric={selectedMetric} />
      
      {/* Breakdown by purpose/source */}
      <BreakdownSection breakdown={data.breakdown} />
      
      {/* Peak day indicator */}
      {data.summary?.peakDay && (
        <div className={styles.peakDay}>
          <TrendUpIcon size={14} />
          <span>
            Peak usage: <strong>{formatNumber(data.summary.peakDay.tokens)} tokens</strong> on{' '}
            <strong>{formatDate(data.summary.peakDay.date)}</strong>
          </span>
        </div>
      )}
      
      {/* Footer */}
      <div className={styles.footer}>
        <span>{data.period?.dataPoints || 0} days tracked</span>
        <span>•</span>
        <span>Est. cost: ${data.summary?.totalCostDollars || '0.00'}</span>
      </div>
    </div>
  );
}

export default ALUsageTrends;









