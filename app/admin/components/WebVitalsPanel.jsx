'use client';

/**
 * Web Vitals Panel Component
 * 
 * Displays Core Web Vitals data collected from Vercel Speed Insights Drain.
 * Shows LCP, INP, CLS and other metrics with ratings and trends.
 * 
 * Per data visualization rules:
 * - Interpretive title (Rule 4.1)
 * - Semantic status colors for ratings (Rule 3.1)
 * - Progress indicators for scores
 */

import { useState, useEffect, useMemo } from 'react';
import styles from './WebVitalsPanel.module.css';

// Icons
const ActivityIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);

const CheckCircleIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const AlertTriangleIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const XCircleIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" y1="9" x2="9" y2="15"/>
    <line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);

const LoaderIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.spinning}>
    <line x1="12" y1="2" x2="12" y2="6"/>
    <line x1="12" y1="18" x2="12" y2="22"/>
    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
    <line x1="2" y1="12" x2="6" y2="12"/>
    <line x1="18" y1="12" x2="22" y2="12"/>
    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
  </svg>
);

const ExternalLinkIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
);

// Rating colors
const RATING_COLORS = {
  good: { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e', border: 'rgba(34, 197, 94, 0.3)' },
  'needs-improvement': { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' },
  poor: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' },
};

// Get rating icon
function RatingIcon({ rating, size = 14 }) {
  if (rating === 'good') return <CheckCircleIcon size={size} />;
  if (rating === 'needs-improvement') return <AlertTriangleIcon size={size} />;
  return <XCircleIcon size={size} />;
}

// Format metric value for display
function formatMetricValue(value, unit) {
  if (unit === 'ms') {
    if (value >= 1000) return `${(value / 1000).toFixed(2)}s`;
    return `${Math.round(value)}ms`;
  }
  return value.toFixed(2);
}

// Generate interpretive title
function generateInterpretiveTitle(data) {
  if (!data?.configured) return 'Core Web Vitals not configured';
  if (!data?.hasData) return 'Waiting for performance data...';
  
  const score = data.overallScore;
  const rating = data.overallRating;
  
  if (rating === 'good') {
    return `Performance excellent — ${score}% passing Core Web Vitals`;
  }
  if (rating === 'needs-improvement') {
    return `Performance needs attention — ${score}% passing`;
  }
  return `Performance issues detected — ${score}% passing`;
}

// Setup instructions
function SetupInstructions({ setupInfo }) {
  return (
    <div className={styles.setupContainer}>
      <div className={styles.setupHeader}>
        <ActivityIcon size={24} />
        <h4>Set Up Speed Insights Drain</h4>
      </div>
      <p className={styles.setupDesc}>
        Connect Vercel Speed Insights to see real user performance data.
      </p>
      <ol className={styles.setupSteps}>
        <li>Go to Vercel Project → Settings → Drains</li>
        <li>Create new drain with type "Speed Insights"</li>
        <li>Set URL: <code>{setupInfo?.webhookUrl || '/api/webhooks/speed-insights'}</code></li>
        <li>Add <code>VERCEL_SPEED_INSIGHTS_SECRET</code> env var</li>
      </ol>
      <a 
        href={setupInfo?.docs || 'https://vercel.com/docs/drains/reference/speed-insights'} 
        target="_blank" 
        rel="noopener noreferrer"
        className={styles.setupLink}
      >
        View setup guide <ExternalLinkIcon size={12} />
      </a>
    </div>
  );
}

// Individual metric card
function MetricCard({ metric }) {
  const rating = metric.overallRating || 'needs-improvement';
  const colors = RATING_COLORS[rating];
  
  return (
    <div 
      className={styles.metricCard}
      style={{ borderColor: colors.border }}
    >
      <div className={styles.metricHeader}>
        <span className={styles.metricName}>{metric.shortName}</span>
        <span 
          className={styles.metricRating}
          style={{ color: colors.text }}
        >
          <RatingIcon rating={rating} size={12} />
          {metric.goodPct}% good
        </span>
      </div>
      <div className={styles.metricValue}>
        {formatMetricValue(metric.p75, metric.unit)}
      </div>
      <div className={styles.metricLabel}>
        p75 · {metric.description}
      </div>
      <div className={styles.metricBar}>
        <div 
          className={styles.metricBarFill}
          style={{ 
            width: `${metric.goodPct}%`,
            backgroundColor: colors.text,
          }}
        />
      </div>
      <div className={styles.metricSamples}>
        {metric.sampleCount.toLocaleString()} samples
      </div>
    </div>
  );
}

export function WebVitalsPanel({ token, loading: externalLoading }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function fetchVitals() {
      if (!token) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/admin/web-vitals?days=7', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const result = await response.json();
        setData(result);
        
        if (result.error) {
          setError(result.error);
        }
      } catch (err) {
        console.error('[WebVitalsPanel] Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchVitals();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchVitals, 300000);
    return () => clearInterval(interval);
  }, [token]);
  
  const interpretiveTitle = useMemo(() => {
    return generateInterpretiveTitle(data);
  }, [data]);
  
  // Core metrics to display (in priority order)
  const coreMetrics = useMemo(() => {
    if (!data?.metrics) return [];
    const order = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB'];
    return order
      .filter(name => data.metrics[name])
      .map(name => data.metrics[name]);
  }, [data]);
  
  if (loading || externalLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <ActivityIcon size={18} />
          <h3 className={styles.title}>Loading Core Web Vitals...</h3>
        </div>
        <div className={styles.loading}>
          <LoaderIcon size={20} />
        </div>
      </div>
    );
  }
  
  // Not configured or no data
  if (!data?.configured || !data?.hasData) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <ActivityIcon size={18} />
          <h3 className={styles.title}>Core Web Vitals</h3>
        </div>
        <SetupInstructions setupInfo={data?.setup} />
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <ActivityIcon size={18} />
          <h3 className={styles.title}>Core Web Vitals Error</h3>
        </div>
        <div className={styles.error}>
          <XCircleIcon size={16} />
          <span>{error}</span>
        </div>
      </div>
    );
  }
  
  const overallColors = RATING_COLORS[data.overallRating] || RATING_COLORS['needs-improvement'];
  
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerMain}>
          <ActivityIcon size={18} />
          <div className={styles.headerText}>
            <h3 className={styles.title}>{interpretiveTitle}</h3>
            <span className={styles.subtitle}>Core Web Vitals (7 days)</span>
          </div>
        </div>
        <span 
          className={styles.scoreBadge}
          style={{ 
            backgroundColor: overallColors.bg,
            color: overallColors.text,
            borderColor: overallColors.border,
          }}
        >
          <RatingIcon rating={data.overallRating} size={12} />
          {data.overallScore}%
        </span>
      </div>
      
      {/* Overall Score Ring */}
      <div className={styles.scoreSection}>
        <div className={styles.scoreRing}>
          <svg viewBox="0 0 100 100" className={styles.scoreRingSvg}>
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke={overallColors.text}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(data.overallScore / 100) * 264} 264`}
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className={styles.scoreRingValue}>
            <span className={styles.scoreNumber}>{data.overallScore}</span>
            <span className={styles.scoreLabel}>Score</span>
          </div>
        </div>
        <div className={styles.scoreMeta}>
          <span>{data.totalSamples.toLocaleString()} total samples</span>
        </div>
      </div>
      
      {/* Metrics Grid */}
      <div className={styles.metricsGrid}>
        {coreMetrics.map(metric => (
          <MetricCard key={metric.shortName} metric={metric} />
        ))}
      </div>
    </div>
  );
}

export default WebVitalsPanel;

