'use client';

/**
 * AL User Usage Dashboard Component
 * 
 * Displays AL usage analytics per user with horizontal bar charts.
 * Shows top 10 users by default, with expand option to see all.
 * 
 * Follows data visualization rules:
 * - Horizontal bars for category comparison ✓
 * - Interpretive titles ✓
 * - Direct/inline labeling (no separate legend) ✓
 * - Gray vs Orange for 2-category comparison ✓
 */

import { useState, useMemo } from 'react';

import { useAdminALUsage } from '@/hooks/useAdminData';

import styles from './ALUserUsage.module.css';

// SVG Icons
const ChevronDownIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
);

const ChevronUpIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m18 15-6-6-6 6"/>
  </svg>
);

const BrainIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 4.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0-1.32 4.24 3 3 0 0 0 .34 5.58 2.5 2.5 0 0 0 2.96 3.08A2.5 2.5 0 0 0 12 19.5a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 12 4.5"/>
    <path d="m15.7 10.4-.9.4"/>
    <path d="m9.2 13.2-.9.4"/>
    <path d="m13.6 15.7-.4-.9"/>
    <path d="m10.8 9.2-.4-.9"/>
    <path d="m15.7 13.5-.9-.4"/>
    <path d="m9.2 10.9-.9-.4"/>
    <path d="m10.4 15.7.4-.9"/>
    <path d="m13.1 9.2.4-.9"/>
  </svg>
);

const TrendUpIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
    <polyline points="16 7 22 7 22 13"/>
  </svg>
);

// Chart colors per visualization rules (2 categories: Gray vs Accent Orange)
const CHART_COLORS = {
  tokens: '#94A3B8',   // Gray/Slate - primary data
  cost: '#F97316',     // Orange - accent/highlight
};

// Format numbers for display
function formatNumber(num) {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toLocaleString();
}

// Format email for display (truncate if too long)
function formatEmail(email, maxLength = 24) {
  if (!email || email === 'Unknown') return 'Unknown User';
  if (email.length <= maxLength) return email;
  return email.slice(0, maxLength - 3) + '...';
}

// Get tier badge color
function getTierColor(tier) {
  switch (tier) {
    case 'tuner': return '#8b5cf6';
    case 'collector': return '#3b82f6';
    case 'free': 
    default: return '#64748b';
  }
}

// Generate interpretive title based on data
function generateInterpretiveTitle(data) {
  if (!data?.users || data.users.length === 0) {
    return 'No AL usage recorded yet';
  }
  
  const topUser = data.users[0];
  const userName = topUser.displayName || formatEmail(topUser.email, 15);
  const totalCost = data.totals.estimatedCostDollars;
  
  if (data.users.length === 1) {
    return `${userName} has used ${formatNumber(topUser.totalTokens)} tokens, costing $${totalCost}`;
  }
  
  return `${userName} leads with ${formatNumber(topUser.totalTokens)} tokens — $${totalCost} total AI cost`;
}

// User Row Component with inline labeling (no separate legend)
function UserRow({ user, maxTokens, maxCost, rank }) {
  const tokenPercentage = maxTokens > 0 ? (user.totalTokens / maxTokens) * 100 : 0;
  const costPercentage = maxCost > 0 ? (user.estimatedCostCents / maxCost) * 100 : 0;
  
  return (
    <div className={styles.userRow}>
      <div className={styles.userInfo}>
        <span className={styles.rank}>#{rank}</span>
        <div className={styles.userDetails}>
          <span className={styles.userName} title={user.email}>
            {user.displayName || formatEmail(user.email)}
          </span>
          <div className={styles.userMeta}>
            <span 
              className={styles.tierBadge}
              style={{ backgroundColor: getTierColor(user.tier) }}
            >
              {user.tier}
            </span>
            <span className={styles.messageCount}>
              {user.messageCount} msg{user.messageCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
      
      <div className={styles.barsContainer}>
        {/* Token bar - inline label with color indicator */}
        <div className={styles.barGroup}>
          <div className={styles.barLabel}>
            <span 
              className={styles.colorDot} 
              style={{ backgroundColor: CHART_COLORS.tokens }} 
            />
            <span>{formatNumber(user.totalTokens)}</span>
          </div>
          <div className={styles.barTrack}>
            <div 
              className={styles.barFill} 
              style={{ 
                width: `${tokenPercentage}%`,
                backgroundColor: CHART_COLORS.tokens,
              }}
            />
          </div>
        </div>
        
        {/* Cost bar - inline label with color indicator */}
        <div className={styles.barGroup}>
          <div className={styles.barLabel}>
            <span 
              className={styles.colorDot} 
              style={{ backgroundColor: CHART_COLORS.cost }} 
            />
            <span>${user.estimatedCostDollars}</span>
          </div>
          <div className={styles.barTrack}>
            <div 
              className={styles.barFill} 
              style={{ 
                width: `${costPercentage}%`,
                backgroundColor: CHART_COLORS.cost,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Summary Stats Component with interpretive descriptions
function SummaryStats({ totals, topUser }) {
  // Generate interpretive insights for each KPI
  const activeUsersInsight = totals.users === 1 
    ? 'Single active user' 
    : `${totals.users} users engaged with AL`;
    
  const tokensInsight = totals.avgMessagesPerUser > 0
    ? `${formatNumber(Math.round(totals.totalTokens / totals.users))} avg per user`
    : 'No usage recorded';
    
  const costInsight = totals.messageCount > 0
    ? `~$${(totals.estimatedCostCents / totals.messageCount / 100).toFixed(3)}/message`
    : 'No cost yet';
    
  const messagesInsight = topUser
    ? `${topUser.displayName || 'Top user'}: ${topUser.messageCount} msgs`
    : 'No messages yet';

  return (
    <div className={styles.summaryStats}>
      <div className={styles.statCard}>
        <div className={styles.statMain}>
          <span className={styles.statValue}>{totals.users}</span>
          <span className={styles.statLabel}>Active Users</span>
        </div>
        <span className={styles.statInsight}>{activeUsersInsight}</span>
      </div>
      
      <div className={styles.statCard}>
        <div className={styles.statMain}>
          <span className={styles.statValue}>{formatNumber(totals.totalTokens)}</span>
          <span className={styles.statLabel}>Total Tokens</span>
        </div>
        <span className={styles.statInsight}>{tokensInsight}</span>
      </div>
      
      <div className={styles.statCard}>
        <div className={styles.statMain}>
          <span className={styles.statValue} style={{ color: CHART_COLORS.cost }}>
            ${totals.estimatedCostDollars}
          </span>
          <span className={styles.statLabel}>Est. AI Cost</span>
        </div>
        <span className={styles.statInsight}>{costInsight}</span>
      </div>
      
      <div className={styles.statCard}>
        <div className={styles.statMain}>
          <span className={styles.statValue}>{totals.messageCount}</span>
          <span className={styles.statLabel}>Messages</span>
        </div>
        <span className={styles.statInsight}>{messagesInsight}</span>
      </div>
    </div>
  );
}

// Main Component
export function ALUserUsage({ token: _token, range = 'month', loading: externalLoading }) {
  const [expanded, setExpanded] = useState(false);
  
  // Use React Query hook for AL usage
  const { 
    data, 
    isLoading: loading, 
    error: queryError,
  } = useAdminALUsage(range);
  
  const error = queryError?.message || null;
  
  // Determine which users to show
  const displayUsers = useMemo(() => {
    if (!data?.users) return [];
    return expanded ? data.users : data.topUsers;
  }, [data, expanded]);
  
  const hasMoreUsers = data?.users?.length > 10;
  const periodLabel = data?.period?.range === 'all' ? 'All Time' : 
                      data?.period?.range === 'month' ? 'This Month' :
                      data?.period?.range === 'week' ? 'Last 7 Days' : 'Today';
  
  if (loading || externalLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>Loading AL usage data...</h3>
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
          <h3 className={styles.title}>Unable to load AL usage data</h3>
        </div>
        <div className={styles.error}>
          <span>Error: {error}</span>
        </div>
      </div>
    );
  }
  
  if (!data || !data.users || data.users.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>No AL usage recorded yet</h3>
          <span className={styles.period}>{periodLabel}</span>
        </div>
        <div className={styles.emptyState}>
          <BrainIcon size={32} />
          <span>Users will appear here once they start using AL</span>
        </div>
      </div>
    );
  }
  
  // Generate interpretive title per visualization rules
  const interpretiveTitle = generateInterpretiveTitle(data);
  
  return (
    <div className={styles.container}>
      {/* Interpretive header per rules */}
      <div className={styles.header}>
        <div className={styles.headerMain}>
          <div className={styles.headerIcon}>
            <BrainIcon size={20} />
          </div>
          <div className={styles.headerText}>
            <h3 className={styles.title}>{interpretiveTitle}</h3>
            <span className={styles.subtitle}>AL Usage by User</span>
          </div>
        </div>
        <span className={styles.period}>{periodLabel}</span>
      </div>
      
      {/* Summary Stats with interpretive insights */}
      <SummaryStats totals={data.totals} topUser={data.users[0]} />
      
      {/* Inline legend explanation (not separate, part of section intro) */}
      <div className={styles.chartIntro}>
        <span>
          Bars show <span style={{ color: CHART_COLORS.tokens }}>tokens consumed</span> and{' '}
          <span style={{ color: CHART_COLORS.cost }}>estimated cost</span> per user
        </span>
      </div>
      
      {/* User List */}
      <div className={`${styles.userList} ${expanded ? styles.expanded : ''}`}>
        {displayUsers.map((user, idx) => (
          <UserRow 
            key={user.userId}
            user={user}
            maxTokens={data.maxTokens}
            maxCost={data.maxCost}
            rank={idx + 1}
          />
        ))}
      </div>
      
      {/* Expand/Collapse Button */}
      {hasMoreUsers && (
        <button 
          className={styles.expandButton}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronUpIcon size={16} />
              <span>Show Top 10</span>
            </>
          ) : (
            <>
              <ChevronDownIcon size={16} />
              <span>Show All {data.users.length} Users</span>
            </>
          )}
        </button>
      )}
      
      {/* Multi-scale perspective: Macro insight at bottom */}
      <div className={styles.macroInsight}>
        <TrendUpIcon size={14} />
        <span>
          Average: <strong>{formatNumber(Math.round(data.totals.totalTokens / data.totals.users || 0))} tokens</strong> and{' '}
          <strong>${data.totals.avgCostPerUser}</strong> per user
        </span>
      </div>
    </div>
  );
}

export default ALUserUsage;
