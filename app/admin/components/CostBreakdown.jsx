'use client';

/**
 * CostBreakdown Component
 * 
 * Displays fixed, variable, and R&D costs with stacked bar visualization.
 * All values are validated to prevent NaN issues.
 * 
 * Per data visualization rules:
 * - Single-hue progression for 3-4 categories (Rule 3.3)
 * - No separate legend - use inline labels (Rule 1.3)
 * - Interpretive title (Rule 4.1)
 */

import { useMemo } from 'react';

import styles from './CostBreakdown.module.css';

// Single-hue blue progression for cost categories (Rule 3.3)
const CATEGORY_COLORS = {
  infrastructure: '#1e40af',  // blue-800
  development: '#2563eb',     // blue-600  
  ai: '#3b82f6',              // blue-500
  variable: '#60a5fa',        // blue-400
  other: '#93c5fd',           // blue-300
};

const CATEGORY_LABELS = {
  infrastructure: 'Infrastructure',
  development: 'Development Tools',
  ai: 'AI Services',
  variable: 'Variable',
  other: 'Other',
};

// Safe number conversion
const safeNum = (val, defaultVal = 0) => {
  if (val === null || val === undefined) return defaultVal;
  const n = Number(val);
  return isNaN(n) || !isFinite(n) ? defaultVal : n;
};

// Safe currency formatting
const formatCurrency = (val) => {
  const n = safeNum(val);
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

// Generate interpretive title (Rule 4.1)
function generateInterpretiveTitle(breakdown) {
  if (!breakdown || breakdown.monthlyTotal === 0) return 'No costs recorded yet';
  
  const { infrastructure, development, monthlyTotal } = breakdown;
  const primaryCategory = infrastructure > development ? 'infrastructure' : 'development tools';
  const primaryAmount = Math.max(infrastructure, development);
  const percentage = Math.round((primaryAmount / monthlyTotal) * 100);
  
  return `${percentage}% of $${monthlyTotal}/mo goes to ${primaryCategory}`;
}

export function CostBreakdown({ costs, title = 'Fixed Cost Breakdown' }) {
  const breakdown = useMemo(() => {
    if (!costs) return null;
    
    // Handle different API response structures
    // financials API uses: costs.fixed.infrastructure, costs.fixed.development
    // dashboard API uses: costs.fixed.supabase, costs.fixed.cursor, etc.
    
    let infrastructure = 0;
    let development = 0;
    let aiServices = 0;
    let productDev = 0;
    
    // Try financials API structure first (amounts in dollars)
    if (costs.fixed?.infrastructure !== undefined) {
      infrastructure = safeNum(costs.fixed.infrastructure);
      development = safeNum(costs.fixed.development);
      aiServices = safeNum(costs.variable?.aiServices);
      productDev = safeNum(costs.productDevelopment);
    }
    // Fall back to dashboard API structure (amounts in dollars)
    else if (costs.fixed?.supabase) {
      // Sum up individual items
      const fixedItems = costs.fixed || {};
      Object.values(fixedItems).forEach(item => {
        if (item && typeof item === 'object') {
          if (item.category === 'infrastructure') {
            infrastructure += safeNum(item.amount);
          } else if (item.category === 'development') {
            development += safeNum(item.amount);
          } else if (item.category === 'ai') {
            aiServices += safeNum(item.amount);
          }
        }
      });
      
      // Add variable costs
      const varItems = costs.variable || {};
      Object.values(varItems).forEach(item => {
        if (item && typeof item === 'object') {
          if (item.category === 'ai') {
            aiServices += safeNum(item.amount);
          }
        }
      });
      
      productDev = safeNum(costs.rAndD);
    }
    // Check for byGLCategory structure from new financials API
    else if (costs.byGLCategory) {
      infrastructure = safeNum(costs.operatingBreakdown?.infrastructure);
      development = safeNum(costs.operatingBreakdown?.development);
      aiServices = safeNum(costs.variable?.total);
      productDev = safeNum(costs.byGLCategory?.rAndD);
    }
    
    // Build segments
    const segments = [];
    
    if (infrastructure > 0) {
      segments.push({
        category: 'infrastructure',
        label: 'Infrastructure',
        amount: infrastructure,
        color: CATEGORY_COLORS.infrastructure,
      });
    }
    
    if (development > 0) {
      segments.push({
        category: 'development',
        label: 'Development Tools',
        amount: development,
        color: CATEGORY_COLORS.development,
      });
    }
    
    if (aiServices > 0) {
      segments.push({
        category: 'variable',
        label: 'AI Services (Variable)',
        amount: aiServices,
        color: CATEGORY_COLORS.variable,
      });
    }
    
    // Calculate total
    const monthlyTotal = infrastructure + development;
    
    return { 
      segments, 
      monthlyTotal,
      totalFixed: monthlyTotal,
      totalVariable: aiServices,
      productDev,
      infrastructure,
      development,
      aiServices,
    };
  }, [costs]);
  
  // Generate interpretive title
  const interpretiveTitle = generateInterpretiveTitle(breakdown);
  
  if (!breakdown || breakdown.monthlyTotal === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>No cost data available</h3>
        </div>
        <div className={styles.emptyState}>Costs will appear once recorded</div>
      </div>
    );
  }
  
  const { segments, monthlyTotal, infrastructure, development, productDev } = breakdown;
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>{interpretiveTitle}</h3>
        <div className={styles.totalBadge}>
          <span className={styles.totalLabel}>Total</span>
          <span className={styles.totalValue}>{formatCurrency(monthlyTotal)}</span>
          <span className={styles.totalPeriod}>/mo</span>
        </div>
      </div>
      
      {/* Stacked bar with inline labels (Rule 1.3: no separate legend) */}
      {segments.length > 0 && monthlyTotal > 0 && (
        <div className={styles.barContainer}>
          <div className={styles.bar}>
            {segments.map((segment) => (
              <div
                key={segment.category}
                className={styles.segment}
                style={{
                  width: `${Math.max(1, (segment.amount / monthlyTotal) * 100)}%`,
                  backgroundColor: segment.color,
                }}
                title={`${segment.label}: ${formatCurrency(segment.amount)}`}
              >
                {/* Inline label if segment is wide enough */}
                {(segment.amount / monthlyTotal) > 0.15 && (
                  <span className={styles.segmentLabel}>{formatCurrency(segment.amount)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Inline legend row with values (Rule 4.2: direct labeling) */}
      <div className={styles.legend}>
        {segments.map((segment) => (
          <div key={segment.category} className={styles.legendItem}>
            <span 
              className={styles.legendDot} 
              style={{ backgroundColor: segment.color }}
            />
            <span className={styles.legendLabel}>{segment.label}</span>
            <span className={styles.legendValue}>{formatCurrency(segment.amount)}</span>
          </div>
        ))}
      </div>
      
      {/* Cost details */}
      <div className={styles.details}>
        <div className={styles.detailSection}>
          <h4 className={styles.detailTitle}>Fixed Costs ({formatCurrency(monthlyTotal)}/mo)</h4>
          <ul className={styles.detailList}>
            {infrastructure > 0 && (
              <li className={styles.detailItem}>
                <span>Infrastructure (Supabase, Vercel, Domain)</span>
                <span>{formatCurrency(infrastructure)}</span>
              </li>
            )}
            {development > 0 && (
              <li className={styles.detailItem}>
                <span>Development Tools (Cursor, Claude)</span>
                <span>{formatCurrency(development)}</span>
              </li>
            )}
          </ul>
        </div>
        
        {productDev > 0 && (
          <div className={styles.rndNote}>
            <span className={styles.rndLabel}>R&D Investment (One-time):</span>
            <span className={styles.rndValue}>{formatCurrency(productDev)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default CostBreakdown;
