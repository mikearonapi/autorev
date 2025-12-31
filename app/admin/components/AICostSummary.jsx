'use client';

/**
 * AI Cost Summary Dashboard Component
 * 
 * Displays comprehensive AI cost analytics including:
 * - User-facing AI (COGS) - AL chat costs
 * - Backend AI (OpEx) - Scripts, crons, automation
 * - Total Anthropic spend
 * - Breakdown by purpose
 * 
 * Follows data visualization rules:
 * - Interpretive titles ✓
 * - Direct labeling (no separate legend) ✓
 * - Gray vs Orange for COGS vs OpEx comparison ✓
 */

import { useState, useEffect } from 'react';
import styles from './AICostSummary.module.css';

// SVG Icons
const DollarIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);

const BrainIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 4.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0-1.32 4.24 3 3 0 0 0 .34 5.58 2.5 2.5 0 0 0 2.96 3.08A2.5 2.5 0 0 0 12 19.5a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 12 4.5"/>
  </svg>
);

const ServerIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
    <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
    <line x1="6" y1="6" x2="6.01" y2="6"/>
    <line x1="6" y1="18" x2="6.01" y2="18"/>
  </svg>
);

const UserIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const AlertIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

// Chart colors per visualization rules
const CHART_COLORS = {
  cogs: '#3B82F6',      // Blue - User AI (COGS)
  opex: '#F97316',      // Orange - Backend AI (OpEx)
  total: '#8B5CF6',     // Purple - Total
  muted: '#64748B',     // Slate - secondary
};

// Purpose labels for readable display
const PURPOSE_LABELS = {
  user_chat: 'AL Chat (Users)',
  youtube_processing: 'YouTube Processing',
  youtube_enrichment: 'YouTube Enrichment',
  youtube_discovery: 'YouTube Discovery',
  car_research: 'Car Research Pipeline',
  car_backfill: 'Car Data Backfill',
  forum_extraction: 'Forum Insights',
  insight_extraction: 'Insight Extraction',
  content_generation: 'Content Generation',
  admin_insights: 'Admin Insights',
  unknown: 'Other',
};

// Format currency
function formatDollars(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatNumber(num) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

// Generate interpretive title based on data
function generateInterpretiveTitle(data) {
  if (!data) return 'Loading AI cost data...';
  
  const totalDollars = (data.total?.costCents || 0) / 100;
  const userPercent = data.total?.costCents > 0 
    ? Math.round((data.user?.costCents || 0) / data.total.costCents * 100)
    : 0;
  
  if (totalDollars === 0) {
    return 'No AI costs recorded in this period';
  }
  
  if (userPercent > 70) {
    return `$${totalDollars.toFixed(2)} AI spend, ${userPercent}% from user conversations`;
  }
  
  if (userPercent < 30) {
    return `$${totalDollars.toFixed(2)} AI spend, primarily from backend automation`;
  }
  
  return `$${totalDollars.toFixed(2)} total AI spend (${userPercent}% user, ${100-userPercent}% backend)`;
}

// Cost Card Component
function CostCard({ title, icon: Icon, costCents, tokens, calls, color, subtitle }) {
  return (
    <div className={styles.costCard}>
      <div className={styles.cardHeader}>
        <div className={styles.cardIcon} style={{ color }}>
          <Icon size={20} />
        </div>
        <div className={styles.cardTitles}>
          <span className={styles.cardTitle}>{title}</span>
          {subtitle && <span className={styles.cardSubtitle}>{subtitle}</span>}
        </div>
      </div>
      <div className={styles.cardMetrics}>
        <div className={styles.primaryMetric}>
          <span className={styles.metricValue} style={{ color }}>
            {formatDollars(costCents)}
          </span>
          <span className={styles.metricLabel}>Est. Cost</span>
        </div>
        <div className={styles.secondaryMetrics}>
          <div className={styles.miniMetric}>
            <span className={styles.miniValue}>{formatNumber(tokens)}</span>
            <span className={styles.miniLabel}>tokens</span>
          </div>
          <div className={styles.miniMetric}>
            <span className={styles.miniValue}>{formatNumber(calls)}</span>
            <span className={styles.miniLabel}>calls</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Purpose Breakdown Row
function PurposeRow({ purpose, costCents, tokens, maxCost }) {
  const percentage = maxCost > 0 ? (costCents / maxCost) * 100 : 0;
  const label = PURPOSE_LABELS[purpose] || purpose;
  const isUserChat = purpose === 'user_chat';
  const color = isUserChat ? CHART_COLORS.cogs : CHART_COLORS.opex;
  
  return (
    <div className={styles.purposeRow}>
      <div className={styles.purposeInfo}>
        <span 
          className={styles.purposeColorDot}
          style={{ backgroundColor: color }}
        />
        <span className={styles.purposeName}>{label}</span>
      </div>
      <div className={styles.purposeBar}>
        <div className={styles.barTrack}>
          <div 
            className={styles.barFill}
            style={{ width: `${percentage}%`, backgroundColor: color }}
          />
        </div>
        <span className={styles.purposeCost}>{formatDollars(costCents)}</span>
      </div>
    </div>
  );
}

// Main Component
export function AICostSummary({ token, range = 'month', loading: externalLoading }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function fetchData() {
      if (!token) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/admin/ai-cost-summary?range=${range}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }
        
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('[AICostSummary] Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [token, range]);
  
  const periodLabel = range === 'all' ? 'All Time' : 
                      range === 'month' ? 'This Month' :
                      range === 'week' ? 'Last 7 Days' : 'Today';
  
  if (loading || externalLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>Loading AI cost data...</h3>
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
          <h3 className={styles.title}>Unable to load AI cost data</h3>
        </div>
        <div className={styles.error}>
          <AlertIcon size={18} />
          <span>Error: {error}</span>
        </div>
      </div>
    );
  }
  
  const interpretiveTitle = generateInterpretiveTitle(data);
  
  // Calculate max cost for bar chart scaling
  const maxPurposeCost = Math.max(
    ...(data?.byPurpose?.map(p => p.costCents) || [0])
  );
  
  // Calculate profit margin indicator
  const userRevenue = data?.userRevenue?.cents || 0;
  const userCost = data?.user?.costCents || 0;
  const margin = userRevenue > 0 
    ? Math.round((userRevenue - userCost) / userRevenue * 100)
    : null;
  
  return (
    <div className={styles.container}>
      {/* Interpretive Header */}
      <div className={styles.header}>
        <div className={styles.headerMain}>
          <div className={styles.headerIcon}>
            <DollarIcon size={20} />
          </div>
          <div className={styles.headerText}>
            <h3 className={styles.title}>{interpretiveTitle}</h3>
            <span className={styles.subtitle}>AI Cost Analytics</span>
          </div>
        </div>
        <span className={styles.period}>{periodLabel}</span>
      </div>
      
      {/* Profit/Margin Alert (if applicable) */}
      {margin !== null && (
        <div className={`${styles.marginAlert} ${margin < 0 ? styles.negative : styles.positive}`}>
          <AlertIcon size={16} />
          <span>
            {margin >= 0 
              ? `User AI margin: ${margin}% (Revenue ${formatDollars(userRevenue)} - Cost ${formatDollars(userCost)})`
              : `User AI at ${Math.abs(margin)}% loss (Cost exceeds revenue by ${formatDollars(userCost - userRevenue)})`
            }
          </span>
        </div>
      )}
      
      {/* Cost Cards */}
      <div className={styles.costCards}>
        <CostCard
          title="User AI"
          subtitle="COGS - AL Chat"
          icon={UserIcon}
          costCents={data?.user?.costCents || 0}
          tokens={(data?.user?.inputTokens || 0) + (data?.user?.outputTokens || 0)}
          calls={data?.user?.callCount || 0}
          color={CHART_COLORS.cogs}
        />
        <CostCard
          title="Backend AI"
          subtitle="OpEx - Automation"
          icon={ServerIcon}
          costCents={data?.backend?.costCents || 0}
          tokens={(data?.backend?.inputTokens || 0) + (data?.backend?.outputTokens || 0)}
          calls={data?.backend?.callCount || 0}
          color={CHART_COLORS.opex}
        />
        <CostCard
          title="Total AI"
          subtitle="Anthropic Spend"
          icon={BrainIcon}
          costCents={data?.total?.costCents || 0}
          tokens={(data?.total?.inputTokens || 0) + (data?.total?.outputTokens || 0)}
          calls={data?.total?.callCount || 0}
          color={CHART_COLORS.total}
        />
      </div>
      
      {/* Purpose Breakdown */}
      {data?.byPurpose?.length > 0 && (
        <div className={styles.breakdownSection}>
          <div className={styles.sectionHeader}>
            <h4 className={styles.sectionTitle}>Cost Breakdown by Purpose</h4>
            <span className={styles.sectionSubtitle}>
              <span style={{ color: CHART_COLORS.cogs }}>■</span> User vs{' '}
              <span style={{ color: CHART_COLORS.opex }}>■</span> Backend
            </span>
          </div>
          <div className={styles.purposeList}>
            {data.byPurpose.map(item => (
              <PurposeRow
                key={item.purpose}
                purpose={item.purpose}
                costCents={item.costCents}
                tokens={item.tokens}
                maxCost={maxPurposeCost}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Cost Attribution Note */}
      <div className={styles.attributionNote}>
        <span>
          💡 <strong>User AI</strong> = charged to users (COGS) • <strong>Backend AI</strong> = your operating cost (OpEx)
        </span>
      </div>
    </div>
  );
}

export default AICostSummary;

