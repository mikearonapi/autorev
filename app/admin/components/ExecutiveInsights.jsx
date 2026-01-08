'use client';

/**
 * Executive Insights Component
 * 
 * AI-powered strategic insights for CEO/COO/CFO decision-making.
 * Uses Claude to analyze business data and generate actionable recommendations.
 * 
 * Features:
 * - Cached insights (24-hour TTL) to minimize API costs
 * - On-demand regeneration with cost tracking
 * - Fallback to rule-based insights if AI unavailable
 */

import { useState, useEffect, useCallback } from 'react';
import styles from './ExecutiveInsights.module.css';

// SVG Icons
const AlertIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22,4 12,14.01 9,11.01"/>
  </svg>
);

const TargetIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
);

const SparklesIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
    <path d="M21 3v5h-5"/>
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
    <path d="M8 16H3v5"/>
  </svg>
);

/**
 * Generate fallback insights using rule-based logic (no AI cost)
 */
function generateFallbackInsights(data, financials, health) {
  const insights = [];
  
  // User Growth Insights
  if (data?.users) {
    const { total, newThisPeriod, growthPercent } = data.users;
    
    if (total < 10) {
      insights.push({
        type: 'warning',
        category: 'Growth',
        title: 'Early Stage - Focus on User Acquisition',
        observation: `Only ${total} users.`,
        impact: 'Need critical mass for product validation.',
        recommendation: 'Consider launching referral program or paid acquisition tests.',
        priority: 'high',
      });
    } else if (growthPercent > 50) {
      insights.push({
        type: 'positive',
        category: 'Growth',
        title: 'Strong User Growth',
        observation: `${growthPercent}% growth with ${newThisPeriod} new users.`,
        impact: 'Momentum is building.',
        recommendation: 'Maintain and ensure infrastructure can scale.',
        priority: 'medium',
      });
    }
  }
  
  // Financial Insights
  if (financials?.pnl) {
    const revenue = (financials.pnl.revenue?.total || 0) / 100;
    const monthlyBurn = (financials.pnl.operatingExpenses?.total || 0) / 100;
    
    if (revenue === 0) {
      insights.push({
        type: 'info',
        category: 'Revenue',
        title: 'Pre-Revenue Phase',
        observation: 'No revenue yet.',
        impact: 'Focus on product-market fit before monetization.',
        recommendation: 'Define monetization timeline. Target first paying customer.',
        priority: 'medium',
      });
    }
    
    if (monthlyBurn > 0) {
      insights.push({
        type: 'info',
        category: 'Finance',
        title: 'Monthly Burn Rate',
        observation: `$${monthlyBurn.toFixed(2)}/month operating costs.`,
        impact: 'Track runway closely.',
        recommendation: 'Optimize costs where possible.',
        priority: 'medium',
      });
    }
  }
  
  // System Health
  if (health?.errors?.blocking > 0) {
    insights.push({
      type: 'critical',
      category: 'Operations',
      title: `${health.errors.blocking} Blocking Errors`,
      observation: 'Critical issues affecting user experience.',
      impact: 'Users may be impacted.',
      recommendation: 'Immediate attention required.',
      priority: 'critical',
    });
  }
  
  if (insights.length === 0) {
    insights.push({
      type: 'positive',
      category: 'Status',
      title: 'Systems Operating Normally',
      observation: 'No critical issues detected.',
      impact: 'Business is stable.',
      recommendation: 'Continue monitoring key metrics.',
      priority: 'low',
    });
  }
  
  return {
    insights,
    summary: 'Rule-based analysis. Click refresh for AI-powered insights.',
    meta: { source: 'fallback', cached: false },
  };
}

function InsightCard({ insight }) {
  const getIcon = () => {
    switch (insight.type) {
      case 'critical':
      case 'warning':
        return <AlertIcon />;
      case 'positive':
        return <CheckCircleIcon />;
      case 'info':
      default:
        return <TargetIcon />;
    }
  };
  
  return (
    <div className={`${styles.insightCard} ${styles[insight.type]}`}>
      <div className={styles.insightHeader}>
        <span className={styles.insightIcon}>{getIcon()}</span>
        <span className={styles.insightCategory}>{insight.category}</span>
        {insight.priority === 'critical' && (
          <span className={styles.criticalBadge}>CRITICAL</span>
        )}
      </div>
      <h4 className={styles.insightTitle}>{insight.title}</h4>
      <p className={styles.insightDetail}>{insight.observation}</p>
      {insight.impact && (
        <p className={styles.insightImpact}>{insight.impact}</p>
      )}
      <div className={styles.insightAction}>
        <span className={styles.actionLabel}>Action:</span>
        <span className={styles.actionText}>{insight.recommendation}</span>
      </div>
    </div>
  );
}

export function ExecutiveInsights({ 
  data, 
  financials, 
  health, 
  token,
  loading = false 
}) {
  const [aiInsights, setAiInsights] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [lastGenerated, setLastGenerated] = useState(null);
  
  // Fetch cached AI insights on mount
  useEffect(() => {
    if (token) {
      fetchCachedInsights();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);
  
  const fetchCachedInsights = async () => {
    try {
      const res = await fetch('/api/admin/insights', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.insights && data.insights.length > 0) {
          setAiInsights(data);
          setLastGenerated(data.meta?.generated_at);
        }
      }
    } catch (err) {
      console.error('[ExecutiveInsights] Failed to fetch cached insights:', err);
    }
  };
  
  const generateAiInsights = useCallback(async () => {
    if (!token || isGenerating) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const businessData = {
        users: data?.users,
        engagement: data?.engagement,
        financials: {
          pnl: financials?.pnl,
          executive: financials?.executive,
        },
        content: data?.content,
        health: health,
      };
      
      const res = await fetch('/api/admin/insights', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(businessData),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate insights');
      }
      
      const result = await res.json();
      setAiInsights(result);
      setLastGenerated(result.meta?.generated_at);
      
    } catch (err) {
      console.error('[ExecutiveInsights] Generation error:', err);
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  }, [token, data, financials, health, isGenerating]);
  
  if (loading) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>Key Insights</h3>
        <div className={styles.loading}>Analyzing data...</div>
      </div>
    );
  }
  
  // Use AI insights if available, otherwise fallback to rule-based
  const displayInsights = aiInsights?.insights?.length > 0 
    ? aiInsights 
    : generateFallbackInsights(data, financials, health);
  
  const isAiPowered = aiInsights?.insights?.length > 0;
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h3 className={styles.title}>Key Insights</h3>
          {isAiPowered && (
            <span className={styles.aiBadge}>
              <SparklesIcon /> AI
            </span>
          )}
        </div>
        <button 
          className={styles.refreshButton}
          onClick={generateAiInsights}
          disabled={isGenerating}
          title="Generate AI insights"
        >
          <RefreshIcon className={isGenerating ? styles.spinning : ''} />
          {isGenerating ? 'Analyzing...' : 'Refresh'}
        </button>
      </div>
      
      {/* Meta info */}
      {lastGenerated && (
        <div className={styles.meta}>
          <span>
            Generated {new Date(lastGenerated).toLocaleDateString()} at {new Date(lastGenerated).toLocaleTimeString()}
          </span>
          {aiInsights?.meta?.cost_usd && (
            <span className={styles.costBadge}>
              Cost: ${aiInsights.meta.cost_usd}
            </span>
          )}
          {aiInsights?.meta?.cached && (
            <span className={styles.cachedBadge}>Cached</span>
          )}
        </div>
      )}
      
      {/* Summary */}
      {displayInsights.summary && (
        <div className={styles.summary}>
          {displayInsights.summary}
        </div>
      )}
      
      {/* Error */}
      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}
      
      {/* Insights list */}
      <div className={styles.insightsList}>
        {(displayInsights.insights || []).slice(0, 5).map((insight, i) => (
          <InsightCard key={i} insight={insight} />
        ))}
      </div>
      
      {/* Footer note */}
      {!isAiPowered && (
        <div className={styles.footer}>
          <span className={styles.footerText}>
            Click refresh for AI-powered strategic analysis. Cost: ~$0.01-0.03 per generation.
          </span>
        </div>
      )}
    </div>
  );
}

export default ExecutiveInsights;
