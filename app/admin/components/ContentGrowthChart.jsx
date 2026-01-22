'use client';

/**
 * Content Growth Chart Component
 * 
 * Visualizes content metrics growth over time using line/area charts.
 * Following data visualization rules:
 * - Line/Area charts for trends over time ✓
 * - Interpretive titles ✓
 * - Time range selector ✓
 * - Multi-scale perspectives (total, daily, peak) ✓
 * - Direct labeling ✓
 */

import { useState, useMemo } from 'react';
import styles from './ContentGrowthChart.module.css';
import { useAdminContentGrowth } from '@/hooks/useAdminData';

// SVG Icons
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

const ChartIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18"/>
    <path d="m19 9-5 5-4-4-3 3"/>
  </svg>
);

// Content type configuration
const CONTENT_TYPES = [
  { key: 'vehicles', label: 'Vehicles', color: '#3B82F6' },
  { key: 'events', label: 'Events', color: '#8B5CF6' },
  { key: 'videos', label: 'Videos', color: '#EF4444' },
  { key: 'insights', label: 'Insights', color: '#F59E0B' },
  { key: 'parts', label: 'Parts', color: '#22C55E' },
  { key: 'kbChunks', label: 'KB Chunks', color: '#06B6D4' },
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
function generateTitle(growth, selectedType, period) {
  if (!growth || !growth[selectedType]) return 'Loading content metrics...';
  
  const g = growth[selectedType];
  const typeLabel = CONTENT_TYPES.find(t => t.key === selectedType)?.label || selectedType;
  
  if (g.absolute === 0) {
    return `${typeLabel} remained stable over the last ${period} days`;
  }
  
  const direction = g.absolute > 0 ? 'grew' : 'decreased';
  const change = Math.abs(g.absolute);
  const percent = Math.abs(g.percent);
  
  return `${typeLabel} ${direction} by ${formatNumber(change)} (${percent}%) over ${period} days`;
}

// Mini sparkline component
function Sparkline({ data, color, height = 40 }) {
  if (!data || data.length < 2) return null;
  
  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  
  const width = 100;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d.value - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  
  // Create area path
  const areaPath = `M0,${height} L${points} L${width},${height} Z`;
  
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={styles.sparkline} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#gradient-${color.replace('#', '')})`} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Endpoint marker */}
      <circle
        cx={width}
        cy={height - ((values[values.length - 1] - min) / range) * (height - 4) - 2}
        r="3"
        fill={color}
      />
    </svg>
  );
}

// Growth indicator badge
function GrowthBadge({ value }) {
  if (value === 0) return <span className={styles.neutralBadge}>No change</span>;
  
  const isPositive = value > 0;
  return (
    <span className={`${styles.growthBadge} ${isPositive ? styles.positive : styles.negative}`}>
      {isPositive ? <TrendUpIcon size={12} /> : <TrendDownIcon size={12} />}
      {Math.abs(value)}%
    </span>
  );
}

// Content type selector button
function TypeButton({ type, selected, onClick, growth }) {
  const isSelected = selected === type.key;
  const g = growth?.[type.key];
  
  return (
    <button
      className={`${styles.typeButton} ${isSelected ? styles.selected : ''}`}
      onClick={() => onClick(type.key)}
      style={{ '--type-color': type.color }}
    >
      <span className={styles.typeDot} style={{ backgroundColor: type.color }} />
      <span className={styles.typeLabel}>{type.label}</span>
      {g && <GrowthBadge value={g.percent} />}
    </button>
  );
}

// Main line chart component
function LineChart({ data, selectedType, color, height = 200 }) {
  if (!data || data.length < 2) {
    return (
      <div className={styles.emptyChart} style={{ height }}>
        <span>Not enough data to display chart</span>
      </div>
    );
  }
  
  const values = data.map(d => d[selectedType] || 0);
  const min = Math.min(...values) * 0.95; // Add some padding
  const max = Math.max(...values) * 1.05;
  const range = max - min || 1;
  
  const width = 100;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d[selectedType] - min) / range) * (height - 40) - 20;
    return { x, y, date: d.date, value: d[selectedType] };
  });
  
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaD = `${pathD} L${width},${height - 20} L0,${height - 20} Z`;
  
  // Find first and last values for labels
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  
  return (
    <div className={styles.chartContainer} style={{ height }}>
      <svg viewBox={`0 0 ${width} ${height}`} className={styles.chart} preserveAspectRatio="none">
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Area fill */}
        <path d={areaD} fill="url(#areaGradient)" />
        
        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        
        {/* Start point */}
        <circle cx={firstPoint.x} cy={firstPoint.y} r="4" fill={color} />
        
        {/* End point */}
        <circle cx={lastPoint.x} cy={lastPoint.y} r="5" fill={color} />
      </svg>
      
      {/* Direct labels */}
      <div className={styles.chartLabels}>
        <div className={styles.startLabel}>
          <span className={styles.labelDate}>{formatDate(firstPoint.date)}</span>
          <span className={styles.labelValue}>{formatNumber(firstPoint.value)}</span>
        </div>
        <div className={styles.endLabel} style={{ color }}>
          <span className={styles.labelValue}>{formatNumber(lastPoint.value)}</span>
          <span className={styles.labelDate}>{formatDate(lastPoint.date)}</span>
        </div>
      </div>
    </div>
  );
}

// Summary stats component
function SummaryStats({ summary, growth, selectedType }) {
  if (!summary) return null;
  
  const typeConfig = CONTENT_TYPES.find(t => t.key === selectedType);
  const g = growth?.[selectedType];
  
  const getValueForType = (type) => {
    switch (type) {
      case 'vehicles': return summary.totalVehicles;
      case 'events': return summary.totalEvents;
      case 'videos': return summary.totalVideos;
      case 'insights': return summary.totalInsights;
      case 'parts': return summary.totalParts;
      case 'kbChunks': return summary.kbChunks;
      default: return 0;
    }
  };
  
  const currentValue = getValueForType(selectedType);
  
  return (
    <div className={styles.summaryStats}>
      <div className={styles.statCard}>
        <span className={styles.statValue} style={{ color: typeConfig?.color }}>
          {formatNumber(currentValue)}
        </span>
        <span className={styles.statLabel}>Current Total</span>
      </div>
      
      <div className={styles.statCard}>
        <span className={styles.statValue}>
          {g?.absolute > 0 ? '+' : ''}{formatNumber(g?.absolute || 0)}
        </span>
        <span className={styles.statLabel}>Change</span>
      </div>
      
      <div className={styles.statCard}>
        <GrowthBadge value={g?.percent || 0} />
        <span className={styles.statLabel}>Growth Rate</span>
      </div>
    </div>
  );
}

// Main component
export function ContentGrowthChart({ token }) {
  const [days, setDays] = useState(30);
  const [selectedType, setSelectedType] = useState('vehicles');
  
  // Use React Query hook for content growth
  const { 
    data, 
    isLoading: loading, 
    error: queryError,
  } = useAdminContentGrowth(days);
  
  const error = queryError?.message || null;
  
  // Prepare chart data for selected type
  const chartData = useMemo(() => {
    if (!data?.metrics) return [];
    return data.metrics.map(m => ({
      date: m.date,
      vehicles: m.vehicles,
      events: m.events,
      videos: m.videos,
      insights: m.insights,
      parts: m.parts,
      kbChunks: m.kbChunks,
    }));
  }, [data]);
  
  // Prepare sparkline data for each content type
  const sparklineData = useMemo(() => {
    if (!chartData.length) return {};
    return CONTENT_TYPES.reduce((acc, type) => {
      acc[type.key] = chartData.map(d => ({ value: d[type.key] || 0 }));
      return acc;
    }, {});
  }, [chartData]);
  
  const selectedConfig = CONTENT_TYPES.find(t => t.key === selectedType);
  const interpretiveTitle = generateTitle(data?.growth, selectedType, days);
  
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>Loading content growth data...</h3>
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
          <h3 className={styles.title}>Unable to load content growth data</h3>
        </div>
        <div className={styles.error}>Error: {error}</div>
      </div>
    );
  }
  
  if (!data || !data.metrics?.length) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>No historical content data available</h3>
        </div>
        <div className={styles.emptyState}>
          <ChartIcon size={32} />
          <span>Content metrics will appear here once snapshots are recorded</span>
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
            <ChartIcon size={20} />
          </div>
          <div className={styles.headerText}>
            <h3 className={styles.title}>{interpretiveTitle}</h3>
            <span className={styles.subtitle}>Content Growth Over Time</span>
          </div>
        </div>
        
        {/* Time range selector per visualization rules */}
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
      
      {/* Content type selector */}
      <div className={styles.typeSelector}>
        {CONTENT_TYPES.map(type => (
          <TypeButton
            key={type.key}
            type={type}
            selected={selectedType}
            onClick={setSelectedType}
            growth={data.growth}
          />
        ))}
      </div>
      
      {/* Main chart */}
      <LineChart
        data={chartData}
        selectedType={selectedType}
        color={selectedConfig?.color || '#3B82F6'}
      />
      
      {/* Summary stats - multi-scale perspective */}
      <SummaryStats
        summary={data.summary}
        growth={data.growth}
        selectedType={selectedType}
      />
      
      {/* Mini sparklines for quick comparison */}
      <div className={styles.sparklineGrid}>
        {CONTENT_TYPES.filter(t => t.key !== selectedType).slice(0, 3).map(type => (
          <div key={type.key} className={styles.sparklineCard}>
            <div className={styles.sparklineHeader}>
              <span className={styles.sparklineLabel}>{type.label}</span>
              <GrowthBadge value={data.growth?.[type.key]?.percent || 0} />
            </div>
            <Sparkline data={sparklineData[type.key]} color={type.color} height={32} />
          </div>
        ))}
      </div>
      
      {/* Data freshness indicator */}
      <div className={styles.footer}>
        <span>{data.period?.dataPoints || 0} data points</span>
        <span>•</span>
        <span>Last snapshot: {data.summary?.snapshotDate || 'N/A'}</span>
      </div>
    </div>
  );
}

export default ContentGrowthChart;









