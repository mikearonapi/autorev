'use client';

/**
 * Build Value Analysis - Shows total investment vs. performance gains
 * 
 * EXTREMELY VALUABLE: Users see the cost-efficiency of their build,
 * dollars-per-HP metrics, and comparison to buying a faster stock car.
 * This helps users understand if their modifications are worth it.
 */

import React, { useMemo } from 'react';

import styles from './BuildValueAnalysis.module.css';
import InsightFeedback from './ui/InsightFeedback';

// Efficiency rating colors - matching design system tokens
const EFFICIENCY_COLORS = {
  good: '#10b981',     // var(--color-accent-teal) - Good/Excellent
  warning: '#f59e0b',  // var(--color-warning) - Average/Below Average
  danger: '#ef4444',   // var(--color-error) - Diminishing Returns
};

// Icons
const TrendingUpIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);

const DollarIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);

const ZapIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

const ScaleIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
    <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
    <path d="M7 21h10"/>
    <path d="M12 3v18"/>
    <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>
  </svg>
);

const CheckCircleIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const XCircleIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="m15 9-6 6"/>
    <path d="m9 9 6 6"/>
  </svg>
);

// Upgrade cost estimates (rough averages)
const UPGRADE_COST_ESTIMATES = {
  // Engine
  'tune': { low: 400, high: 800 },
  'tune-stage-1': { low: 400, high: 700 },
  'tune-stage-2': { low: 500, high: 900 },
  'tune-e85': { low: 600, high: 1000 },
  'tune-track': { low: 600, high: 1000 },
  'intake': { low: 200, high: 500 },
  'cold-air-intake': { low: 250, high: 500 },
  'exhaust-catback': { low: 500, high: 1500 },
  'exhaust-axleback': { low: 300, high: 800 },
  'headers': { low: 800, high: 2000 },
  'downpipe': { low: 400, high: 1000 },
  'intercooler': { low: 500, high: 1500 },
  'intercooler-fmic': { low: 700, high: 2000 },
  'turbo-upgrade': { low: 2000, high: 5000 },
  'supercharger': { low: 4000, high: 8000 },
  'fuel-injectors': { low: 400, high: 1200 },
  'fuel-pump': { low: 200, high: 600 },
  'camshafts': { low: 800, high: 2000 },
  'ported-heads': { low: 1500, high: 3500 },
  'forged-internals': { low: 4000, high: 10000 },
  'built-motor': { low: 8000, high: 20000 },
  
  // Suspension
  'coilovers': { low: 1000, high: 3000 },
  'coilovers-street': { low: 800, high: 2000 },
  'coilovers-track': { low: 1500, high: 4000 },
  'lowering-springs': { low: 200, high: 500 },
  'sway-bars': { low: 250, high: 600 },
  'sway-bar-front': { low: 150, high: 350 },
  'sway-bar-rear': { low: 150, high: 350 },
  'control-arms': { low: 300, high: 800 },
  'camber-kit': { low: 150, high: 400 },
  
  // Brakes
  'big-brake-kit': { low: 1500, high: 4000 },
  'brake-pads-track': { low: 150, high: 400 },
  'brake-rotors': { low: 200, high: 600 },
  'brake-lines': { low: 80, high: 200 },
  'brake-fluid': { low: 30, high: 80 },
  
  // Wheels/Tires
  'wheels-lightweight': { low: 1500, high: 4000 },
  'tires-track': { low: 600, high: 1500 },
  'tires-summer': { low: 400, high: 1000 },
  
  // Aero
  'splitter': { low: 200, high: 600 },
  'wing': { low: 400, high: 1500 },
  'diffuser': { low: 300, high: 1000 },
  
  // Cooling
  'radiator-upgrade': { low: 300, high: 800 },
  'oil-cooler': { low: 300, high: 800 },
  'trans-cooler': { low: 200, high: 500 },
};

// Normalize key for matching
const normalizeKey = (key) => {
  if (!key) return '';
  return key.toLowerCase().replace(/[-_\s]+/g, '-').trim();
};

// Get cost estimate for an upgrade
const getUpgradeCost = (upgradeKey) => {
  const normalized = normalizeKey(upgradeKey);
  
  // Direct match
  if (UPGRADE_COST_ESTIMATES[normalized]) {
    return UPGRADE_COST_ESTIMATES[normalized];
  }
  
  // Partial matching
  for (const [key, cost] of Object.entries(UPGRADE_COST_ESTIMATES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return cost;
    }
  }
  
  // Default estimate for unknown upgrades
  return { low: 200, high: 500 };
};

export default function BuildValueAnalysis({ 
  installedUpgrades, 
  stockHp, 
  currentHp, 
  carName,
  buildCostLow,
  buildCostHigh,
  onFeedback,
}) {
  const analysis = useMemo(() => {
    const upgrades = installedUpgrades
      .map(u => typeof u === 'string' ? u : u?.key)
      .filter(Boolean);
    
    if (upgrades.length === 0) {
      return null;
    }

    // Calculate total estimated cost from upgrades if not provided
    let totalLow = buildCostLow || 0;
    let totalHigh = buildCostHigh || 0;
    
    if (!buildCostLow && !buildCostHigh) {
      upgrades.forEach(upgrade => {
        const cost = getUpgradeCost(upgrade);
        totalLow += cost.low;
        totalHigh += cost.high;
      });
    }

    const hpGain = currentHp - stockHp;
    const avgCost = (totalLow + totalHigh) / 2;
    const dollarsPerHp = hpGain > 0 ? Math.round(avgCost / hpGain) : 0;
    const hpPerThousand = hpGain > 0 ? Math.round((hpGain / avgCost) * 1000) : 0;
    
    // Determine efficiency rating
    let efficiencyRating = 'Good';
    let efficiencyColor = '#10b981';
    let efficiencyNote = 'Solid value for the performance gains';
    
    if (dollarsPerHp < 30) {
      efficiencyRating = 'Excellent';
      efficiencyColor = '#10b981';
      efficiencyNote = 'Outstanding cost-per-HP ratio';
    } else if (dollarsPerHp < 50) {
      efficiencyRating = 'Good';
      efficiencyColor = '#10b981';
      efficiencyNote = 'Solid value for the performance gains';
    } else if (dollarsPerHp < 80) {
      efficiencyRating = 'Average';
      efficiencyColor = '#f59e0b';
      efficiencyNote = 'Typical cost-per-HP for this build level';
    } else if (dollarsPerHp < 120) {
      efficiencyRating = 'Below Average';
      efficiencyColor = EFFICIENCY_COLORS.warning;
      efficiencyNote = 'Consider higher-impact mods for better value';
    } else {
      efficiencyRating = 'Diminishing Returns';
      efficiencyColor = EFFICIENCY_COLORS.danger;
      efficiencyNote = 'High cost per HP—common for advanced builds';
    }

    // Calculate what percentage increase
    const percentIncrease = Math.round((hpGain / stockHp) * 100);

    // Break down costs by category
    const categoryBreakdown = {};
    upgrades.forEach(upgrade => {
      const cost = getUpgradeCost(upgrade);
      let category = 'Other';
      const norm = normalizeKey(upgrade);
      
      if (norm.includes('tune') || norm.includes('intake') || norm.includes('exhaust') || 
          norm.includes('header') || norm.includes('downpipe') || norm.includes('turbo') ||
          norm.includes('intercooler') || norm.includes('fuel') || norm.includes('cam')) {
        category = 'Engine';
      } else if (norm.includes('coilover') || norm.includes('spring') || norm.includes('sway') ||
                 norm.includes('control') || norm.includes('camber')) {
        category = 'Suspension';
      } else if (norm.includes('brake')) {
        category = 'Brakes';
      } else if (norm.includes('wheel') || norm.includes('tire')) {
        category = 'Wheels/Tires';
      } else if (norm.includes('splitter') || norm.includes('wing') || norm.includes('diffuser')) {
        category = 'Aero';
      } else if (norm.includes('radiator') || norm.includes('cooler')) {
        category = 'Cooling';
      }
      
      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = { low: 0, high: 0, count: 0 };
      }
      categoryBreakdown[category].low += cost.low;
      categoryBreakdown[category].high += cost.high;
      categoryBreakdown[category].count += 1;
    });

    return {
      totalLow,
      totalHigh,
      avgCost,
      hpGain,
      dollarsPerHp,
      hpPerThousand,
      percentIncrease,
      upgradeCount: upgrades.length,
      efficiencyRating,
      efficiencyColor,
      efficiencyNote,
      categoryBreakdown,
    };
  }, [installedUpgrades, stockHp, currentHp, buildCostLow, buildCostHigh]);

  if (!analysis) {
    return (
      <div className={styles.buildValue}>
        <div className={styles.header}>
          <TrendingUpIcon size={18} />
          <span className={styles.headerTitle}>Build Value Analysis</span>
          {onFeedback && (
            <InsightFeedback 
              insightType="value-analysis"
              insightKey="value-analysis-empty"
              insightTitle="Build Value Analysis (Empty)"
              onFeedback={onFeedback}
              variant="inline"
            />
          )}
        </div>
        <div className={styles.noData}>
          <p>Add modifications to see cost-per-HP analysis</p>
        </div>
      </div>
    );
  }

  const { 
    totalLow, totalHigh, hpGain, dollarsPerHp, hpPerThousand, 
    percentIncrease, upgradeCount, efficiencyRating, efficiencyColor, 
    efficiencyNote, categoryBreakdown 
  } = analysis;

  return (
    <div className={styles.buildValue}>
      <div className={styles.header}>
        <TrendingUpIcon size={18} />
        <span className={styles.headerTitle}>Build Value Analysis</span>
        {onFeedback && (
          <InsightFeedback 
            insightType="value-analysis"
            insightKey="value-analysis"
            insightTitle="Build Value Analysis"
            onFeedback={onFeedback}
            variant="inline"
          />
        )}
      </div>

      {/* Main Stats */}
      <div className={styles.mainStats}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <DollarIcon size={20} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Total Investment</span>
            <span className={styles.statValue}>
              ${totalLow.toLocaleString()} – ${totalHigh.toLocaleString()}
            </span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <ZapIcon size={20} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Power Gained</span>
            <span className={styles.statValueGain}>
              +{hpGain} hp <span className={styles.percentGain}>(+{percentIncrease}%)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Efficiency Rating */}
      <div className={styles.efficiencyCard}>
        <div className={styles.efficiencyHeader}>
          <ScaleIcon size={16} />
          <span>Cost Efficiency</span>
          <span 
            className={styles.efficiencyBadge}
            style={{ backgroundColor: efficiencyColor }}
          >
            {efficiencyRating}
          </span>
        </div>
        
        <div className={styles.efficiencyMetrics}>
          <div className={styles.efficiencyMetric}>
            <span className={styles.metricValue}>${dollarsPerHp}</span>
            <span className={styles.metricLabel}>per HP gained</span>
          </div>
          <div className={styles.efficiencyDivider} />
          <div className={styles.efficiencyMetric}>
            <span className={styles.metricValue}>{hpPerThousand}</span>
            <span className={styles.metricLabel}>HP per $1,000</span>
          </div>
        </div>
        
        <p className={styles.efficiencyNote}>{efficiencyNote}</p>
      </div>

      {/* Category Breakdown */}
      <div className={styles.categoryBreakdown}>
        <div className={styles.breakdownHeader}>Investment by Category</div>
        <div className={styles.categories}>
          {Object.entries(categoryBreakdown)
            .sort((a, b) => (b[1].low + b[1].high) - (a[1].low + a[1].high))
            .map(([category, data]) => {
              const avgCategoryCost = (data.low + data.high) / 2;
              const totalAvg = (totalLow + totalHigh) / 2;
              const percentage = Math.round((avgCategoryCost / totalAvg) * 100);
              
              return (
                <div key={category} className={styles.categoryRow}>
                  <div className={styles.categoryInfo}>
                    <span className={styles.categoryName}>{category}</span>
                    <span className={styles.categoryParts}>{data.count} part{data.count > 1 ? 's' : ''}</span>
                  </div>
                  <div className={styles.categoryBar}>
                    <div 
                      className={styles.categoryFill}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className={styles.categoryCost}>
                    ~${Math.round((data.low + data.high) / 2).toLocaleString()}
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Value Insights */}
      <div className={styles.insights}>
        <div className={styles.insightsHeader}>Value Insights</div>
        <div className={styles.insightsList}>
          {dollarsPerHp < 50 && (
            <div className={styles.insight + ' ' + styles.positive}>
              <CheckCircleIcon size={14} />
              <span>Great dollar-per-HP ratio for a street build</span>
            </div>
          )}
          {percentIncrease >= 20 && (
            <div className={styles.insight + ' ' + styles.positive}>
              <CheckCircleIcon size={14} />
              <span>Significant power improvement over stock ({percentIncrease}%)</span>
            </div>
          )}
          {upgradeCount <= 5 && hpGain >= 50 && (
            <div className={styles.insight + ' ' + styles.positive}>
              <CheckCircleIcon size={14} />
              <span>Efficient build with focused modifications</span>
            </div>
          )}
          {dollarsPerHp > 100 && (
            <div className={styles.insight + ' ' + styles.neutral}>
              <XCircleIcon size={14} />
              <span>Higher cost-per-HP typical at this power level</span>
            </div>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <p className={styles.disclaimer}>
        Cost estimates based on typical market prices. Actual costs vary by brand, labor, and location.
      </p>
    </div>
  );
}
