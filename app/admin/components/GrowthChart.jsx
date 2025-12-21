'use client';

/**
 * GrowthChart Component
 * 
 * Area chart showing user growth over time.
 * CSS-only visualization with hover interactions.
 * 
 * Per data visualization rules:
 * - No gridlines by default (Rule 1.3)
 * - Interpretive title (Rule 4.1)
 * - Direct labeling at endpoint (Rule 4.2)
 */

import { useMemo, useState } from 'react';
import styles from './GrowthChart.module.css';

// Generate interpretive title based on data
function generateInterpretiveTitle(data, fallbackTitle) {
  if (!data || data.length < 2) return fallbackTitle;
  
  const first = data[0]?.count || 0;
  const last = data[data.length - 1]?.count || 0;
  const change = last - first;
  const percentChange = first > 0 ? Math.round((change / first) * 100) : 0;
  
  if (change > 0) {
    return `User base grew to ${last}, adding ${change} user${change !== 1 ? 's' : ''} (+${percentChange}%)`;
  } else if (change < 0) {
    return `User base at ${last}, down ${Math.abs(change)} user${Math.abs(change) !== 1 ? 's' : ''} (${percentChange}%)`;
  }
  return `User base stable at ${last} users`;
}

export function GrowthChart({ data, title = 'User Growth', height = 200 }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  
  // All hooks must be called before any conditional returns
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;
    
    const values = data.map(d => d.count);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    
    const points = values.map((val, i) => ({
      value: val,
      date: data[i].date,
      percentage: ((val - min) / range) * 100,
    }));
    
    // Calculate SVG path here to keep all hooks above returns
    const width = 100;
    const chartHeight = 100;
    const xStep = width / Math.max(points.length - 1, 1);
    
    const linePoints = points.map((p, i) => {
      const x = i * xStep;
      const y = chartHeight - (p.percentage * 0.85) - 8;
      return `${x},${y}`;
    }).join(' L ');
    
    const areaPath = `M 0,${chartHeight} L ${linePoints} L ${width},${chartHeight} Z`;
    const svgPath = { linePoints: `M ${linePoints}`, areaPath };
    
    return {
      points,
      max,
      min,
      svgPath,
    };
  }, [data]);
  
  // Generate interpretive title
  const interpretiveTitle = useMemo(() => {
    return generateInterpretiveTitle(data, title);
  }, [data, title]);
  
  // Now we can safely do conditional returns
  if (!chartData || chartData.points.length === 0) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.emptyState}>
          <span>No data available</span>
        </div>
      </div>
    );
  }
  
  const { points, max, svgPath } = chartData;
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>{interpretiveTitle}</h3>
        <span className={styles.maxValue}>Peak: {max.toLocaleString()}</span>
      </div>
      
      <div className={styles.chartWrapper} style={{ height }}>
        <svg 
          viewBox="0 0 100 100" 
          preserveAspectRatio="none" 
          className={styles.chart}
        >
          <defs>
            <linearGradient id="growthGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* No gridlines per Rule 1.3 - removed */}
          
          {/* Area fill */}
          <path d={svgPath.areaPath} fill="url(#growthGradient)" />
          
          {/* Line */}
          <path 
            d={svgPath.linePoints} 
            fill="none" 
            stroke="#3b82f6" 
            strokeWidth="2" 
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        
        {/* Interactive overlay */}
        <div className={styles.overlay}>
          {points.map((point, i) => (
            <div
              key={i}
              className={styles.hoverZone}
              style={{ left: `${(i / Math.max(points.length - 1, 1)) * 100}%` }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {hoveredIndex === i && (
                <div className={styles.tooltip}>
                  <span className={styles.tooltipDate}>
                    {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <span className={styles.tooltipValue}>{point.value.toLocaleString()} users</span>
                </div>
              )}
              <div 
                className={`${styles.dot} ${hoveredIndex === i ? styles.dotActive : ''}`}
                style={{ bottom: `${point.percentage * 0.85 + 8}%` }}
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* X-axis labels */}
      <div className={styles.xAxis}>
        <span>{new Date(points[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        <span>{new Date(points[points.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
      </div>
    </div>
  );
}

export default GrowthChart;
