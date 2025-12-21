'use client';

/**
 * Usage Estimate Component
 * 
 * Displays real-time variable cost estimates based on actual platform usage.
 */

import styles from './UsageEstimate.module.css';

function formatCurrency(amount) {
  return `$${parseFloat(amount).toFixed(2)}`;
}

function formatNumber(num) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function ProgressBar({ value, max, color = '#3b82f6' }) {
  const percentage = Math.min((value / max) * 100, 100);
  return (
    <div className={styles.progressBar}>
      <div 
        className={styles.progressFill} 
        style={{ width: `${percentage}%`, backgroundColor: color }}
      />
    </div>
  );
}

export function UsageEstimate({ usage, loading = false, compact = false }) {
  if (loading) {
    return (
      <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
        <div className={styles.header}>
          <h3 className={styles.title}>Variable Cost Estimate</h3>
        </div>
        <div className={styles.loading}>Calculating usage...</div>
      </div>
    );
  }
  
  if (!usage) {
    return (
      <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
        <div className={styles.header}>
          <h3 className={styles.title}>Variable Cost Estimate</h3>
        </div>
        <div className={styles.emptyState}>No usage data available</div>
      </div>
    );
  }
  
  const { anthropic, openai, supabase } = usage.usage || {};
  const totals = usage.totals?.currentPeriod || {};
  const projections = usage.projections || {};
  
  // Compact mode: simplified view
  if (compact) {
    return (
      <div className={`${styles.container} ${styles.compact}`}>
        <div className={styles.header}>
          <h3 className={styles.title}>Variable Costs</h3>
        </div>
        
        <div className={styles.compactSummary}>
          <div className={styles.compactTotal}>
            <span className={styles.compactLabel}>Period Total</span>
            <span className={styles.compactValue}>{formatCurrency(totals.total || 0)}</span>
          </div>
          <div className={styles.compactTotal}>
            <span className={styles.compactLabel}>Monthly Est.</span>
            <span className={styles.compactValue}>{formatCurrency(projections.monthly?.estimatedCost || 0)}</span>
          </div>
        </div>
        
        <div className={styles.compactServices}>
          <div className={styles.compactService}>
            <span className={styles.compactServiceName}>Anthropic</span>
            <span className={styles.compactServiceCost}>{formatCurrency(anthropic?.costBreakdown?.total || 0)}</span>
          </div>
          <div className={styles.compactService}>
            <span className={styles.compactServiceName}>OpenAI</span>
            <span className={styles.compactServiceCost}>{formatCurrency(openai?.cost || 0)}</span>
          </div>
          <div className={styles.compactService}>
            <span className={styles.compactServiceName}>Supabase</span>
            <span className={styles.compactServiceCost}>{formatCurrency(supabase?.storageCost || 0)}</span>
          </div>
        </div>
        
        <div className={styles.compactProjection}>
          <span>At {projections.atScale?.users?.toLocaleString() || '1,000'} users: </span>
          <span className={styles.compactProjectionValue}>~{formatCurrency(projections.atScale?.estimatedMonthlyCost || 0)}/mo</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Variable Cost Estimate</h3>
        <span className={styles.period}>{usage.period?.range || 'Current Period'}</span>
      </div>
      
      {/* Current Usage Summary */}
      <div className={styles.summary}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Period Total</span>
          <span className={styles.summaryValue}>{formatCurrency(totals.total || 0)}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Monthly Projection</span>
          <span className={styles.summaryValue}>{formatCurrency(projections.monthly?.estimatedCost || 0)}</span>
        </div>
      </div>
      
      {/* Service Breakdown */}
      <div className={styles.services}>
        {/* Anthropic API */}
        <div className={styles.service}>
          <div className={styles.serviceHeader}>
            <span className={styles.serviceName}>
              Anthropic (Claude)
              {anthropic?.dataSource === 'actual' && (
                <span className={styles.actualBadge}>ACTUAL</span>
              )}
            </span>
            <span className={styles.serviceCost}>{formatCurrency(anthropic?.costBreakdown?.total || 0)}</span>
          </div>
          <div className={styles.serviceDetails}>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Messages</span>
              <span className={styles.metricValue}>{anthropic?.messages || 0}</span>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Input Tokens</span>
              <span className={styles.metricValue}>{formatNumber(anthropic?.inputTokens || 0)}</span>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Output Tokens</span>
              <span className={styles.metricValue}>{formatNumber(anthropic?.outputTokens || 0)}</span>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Usage Logs</span>
              <span className={styles.metricValue}>{anthropic?.usageLogs || 0}</span>
            </div>
          </div>
          <div className={styles.rates}>
            <span>
              {anthropic?.dataSource === 'actual' 
                ? `Actual cost tracked from ${anthropic?.usageLogs} API calls`
                : `Est. rates: $${anthropic?.rates?.inputPerMillion}/M in, $${anthropic?.rates?.outputPerMillion}/M out`
              }
            </span>
          </div>
        </div>
        
        {/* OpenAI */}
        <div className={styles.service}>
          <div className={styles.serviceHeader}>
            <span className={styles.serviceName}>OpenAI (Embeddings)</span>
            <span className={styles.serviceCost}>{formatCurrency(openai?.cost || 0)}</span>
          </div>
          <div className={styles.serviceDetails}>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Est. Tokens</span>
              <span className={styles.metricValue}>{formatNumber(openai?.estimatedEmbeddingTokens || 0)}</span>
            </div>
          </div>
        </div>
        
        {/* Supabase */}
        <div className={styles.service}>
          <div className={styles.serviceHeader}>
            <span className={styles.serviceName}>Supabase (Storage)</span>
            <span className={styles.serviceCost}>{formatCurrency(supabase?.storageCost || 0)}</span>
          </div>
          <div className={styles.serviceDetails}>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>DB Size</span>
              <span className={styles.metricValue}>{supabase?.databaseSizeGB || 0} GB</span>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Included</span>
              <span className={styles.metricValue}>{supabase?.includedStorageGB || 8} GB</span>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Overage</span>
              <span className={styles.metricValue}>{supabase?.overageGB || 0} GB</span>
            </div>
          </div>
          <ProgressBar 
            value={parseFloat(supabase?.databaseSizeGB || 0)} 
            max={supabase?.includedStorageGB || 8}
            color={parseFloat(supabase?.overageGB || 0) > 0 ? '#f59e0b' : '#22c55e'}
          />
        </div>
      </div>
      
      {/* Scale Projection */}
      <div className={styles.projection}>
        <h4 className={styles.projectionTitle}>At Scale Projection</h4>
        <div className={styles.projectionContent}>
          <div className={styles.projectionRow}>
            <span>At {projections.atScale?.users?.toLocaleString() || '1,000'} users</span>
            <span className={styles.projectionValue}>
              ~{formatCurrency(projections.atScale?.estimatedMonthlyCost || 0)}/mo
            </span>
          </div>
          <p className={styles.projectionNote}>
            {projections.atScale?.note || 'Assumes linear scaling'}
          </p>
        </div>
      </div>
      
      {/* Content Metrics */}
      {usage.content && (
        <div className={styles.contentSection}>
          <h4 className={styles.projectionTitle}>Content Inventory</h4>
          <div className={styles.contentGrid}>
            <div className={styles.contentItem}>
              <span className={styles.contentValue}>{usage.content.vehicles || 0}</span>
              <span className={styles.contentLabel}>Vehicles</span>
            </div>
            <div className={styles.contentItem}>
              <span className={styles.contentValue}>{usage.content.events || 0}</span>
              <span className={styles.contentLabel}>Events</span>
            </div>
            <div className={styles.contentItem}>
              <span className={styles.contentValue}>{usage.content.videos || 0}</span>
              <span className={styles.contentLabel}>Videos</span>
            </div>
            <div className={styles.contentItem}>
              <span className={styles.contentValue}>{usage.content.insights || 0}</span>
              <span className={styles.contentLabel}>Insights</span>
            </div>
            <div className={styles.contentItem}>
              <span className={styles.contentValue}>{usage.content.parts || 0}</span>
              <span className={styles.contentLabel}>Parts</span>
            </div>
            <div className={styles.contentItem}>
              <span className={styles.contentValue}>{formatNumber(usage.content.kbChunks || 0)}</span>
              <span className={styles.contentLabel}>KB Docs</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsageEstimate;

