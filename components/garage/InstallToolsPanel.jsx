'use client';

/**
 * InstallToolsPanel Component
 * 
 * Aggregated view of ALL tools needed for the entire build.
 * Uses data/upgradeTools.js to compute tools across all upgrades.
 * Groups tools by category (Basic, Lifting, Specialized, etc.)
 * Distinguishes essential vs recommended tools.
 */

import React, { useMemo, useState } from 'react';
import { getToolsForBuild, calculateBuildComplexity, toolCategories, tools } from '@/data/upgradeTools';
import { Icons } from '@/components/ui/Icons';
import styles from './InstallToolsPanel.module.css';

// Map category keys to icons
const CATEGORY_ICONS = {
  basic: Icons.wrench,
  lifting: Icons.car,
  electrical: Icons.zap,
  diagnostic: Icons.settings,
  specialized: Icons.tool,
  fabrication: Icons.settings,
  fluid: Icons.droplet || Icons.circle,
  alignment: Icons.target,
};

/**
 * InstallToolsPanel - Aggregated tools display for entire build
 * 
 * @param {string[]} upgradeKeys - Array of upgrade keys from the build
 * @param {string} carName - Vehicle name for context
 * @param {boolean} defaultExpanded - Whether to start expanded
 */
export default function InstallToolsPanel({
  upgradeKeys = [],
  carName,
  defaultExpanded = true,
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  // Get all tools needed for this build
  const toolsData = useMemo(() => {
    if (upgradeKeys.length === 0) return null;
    return getToolsForBuild(upgradeKeys);
  }, [upgradeKeys]);
  
  // Get build complexity
  const complexity = useMemo(() => {
    if (upgradeKeys.length === 0) return null;
    return calculateBuildComplexity(upgradeKeys);
  }, [upgradeKeys]);
  
  // If no upgrades, show nothing
  if (!toolsData || (toolsData.essential.length === 0 && toolsData.recommended.length === 0)) {
    return null;
  }
  
  // Count total tools
  const totalTools = toolsData.essential.length + toolsData.recommended.length;
  const categories = Object.keys(toolsData.byCategory);
  
  return (
    <div className={styles.panel}>
      {/* Header */}
      <button 
        className={styles.header}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <div className={styles.headerLeft}>
          <Icons.tool size={20} />
          <div className={styles.headerText}>
            <span className={styles.headerTitle}>Tools Required</span>
            <span className={styles.headerMeta}>
              {totalTools} tools across {categories.length} categories
            </span>
          </div>
        </div>
        <span className={`${styles.chevron} ${isExpanded ? styles.chevronExpanded : ''}`}>
          <Icons.chevronDown size={20} />
        </span>
      </button>
      
      {/* Expanded Content */}
      {isExpanded && (
        <div className={styles.content}>
          {/* Build Complexity Summary - Time Estimate Only */}
          {complexity && complexity.timeEstimate && (
            <div className={styles.complexitySummary}>
              <div className={styles.complexityItem}>
                <span className={styles.complexityLabel}>Est. Time</span>
                <span className={styles.complexityValue}>
                  {complexity.timeEstimate.min}-{complexity.timeEstimate.max} hrs
                </span>
              </div>
            </div>
          )}
          
          {/* Essential Tools */}
          {toolsData.essential.length > 0 && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>
                <span className={styles.essentialDot} />
                Essential Tools
              </h4>
              <div className={styles.toolsGrid}>
                {toolsData.essential.map(tool => (
                  <ToolCard key={tool.key} tool={tool} variant="essential" />
                ))}
              </div>
            </div>
          )}
          
          {/* Recommended Tools */}
          {toolsData.recommended.length > 0 && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>
                <span className={styles.recommendedDot} />
                Recommended Tools
              </h4>
              <div className={styles.toolsGrid}>
                {toolsData.recommended.map(tool => (
                  <ToolCard key={tool.key} tool={tool} variant="recommended" />
                ))}
              </div>
            </div>
          )}
          
          {/* Tools by Category (collapsible) */}
          <CategoryBreakdown byCategory={toolsData.byCategory} />
        </div>
      )}
    </div>
  );
}

/**
 * Individual tool card
 */
function ToolCard({ tool, variant = 'essential' }) {
  const categoryInfo = toolCategories[tool.category] || {};
  
  return (
    <div className={`${styles.toolCard} ${styles[variant]}`}>
      <div className={styles.toolName}>{tool.name}</div>
      <div className={styles.toolDescription}>{tool.description}</div>
      <span className={styles.toolCategory} style={{ color: categoryInfo.color }}>
        {categoryInfo.name || tool.category}
      </span>
    </div>
  );
}

/**
 * Category breakdown accordion
 */
function CategoryBreakdown({ byCategory }) {
  const [expandedCategory, setExpandedCategory] = useState(null);
  
  const categoryEntries = Object.entries(byCategory).filter(
    ([_, data]) => data.essential.length > 0 || data.recommended.length > 0
  );
  
  if (categoryEntries.length === 0) return null;
  
  return (
    <div className={styles.categoryBreakdown}>
      <h4 className={styles.sectionTitle}>By Category</h4>
      <div className={styles.categoryList}>
        {categoryEntries.map(([categoryKey, data]) => {
          const categoryInfo = toolCategories[categoryKey] || {};
          const IconComponent = CATEGORY_ICONS[categoryKey] || Icons.circle;
          const isExpanded = expandedCategory === categoryKey;
          const totalCount = data.essential.length + data.recommended.length;
          
          return (
            <div key={categoryKey} className={styles.categoryItem}>
              <button
                className={styles.categoryHeader}
                onClick={() => setExpandedCategory(isExpanded ? null : categoryKey)}
                style={{ '--cat-color': categoryInfo.color }}
              >
                <span className={styles.categoryIcon}>
                  <IconComponent size={16} />
                </span>
                <span className={styles.categoryName}>{categoryInfo.name || categoryKey}</span>
                <span className={styles.categoryCount}>{totalCount}</span>
                <span className={`${styles.categoryChevron} ${isExpanded ? styles.categoryChevronExpanded : ''}`}>
                  <Icons.chevronDown size={14} />
                </span>
              </button>
              
              {isExpanded && (
                <div className={styles.categoryContent}>
                  {data.essential.map(tool => (
                    <div key={tool.key} className={styles.categoryTool}>
                      <span className={styles.categoryToolName}>{tool.name}</span>
                      <span className={styles.categoryToolBadge}>Essential</span>
                    </div>
                  ))}
                  {data.recommended.map(tool => (
                    <div key={tool.key} className={styles.categoryTool}>
                      <span className={styles.categoryToolName}>{tool.name}</span>
                      <span className={`${styles.categoryToolBadge} ${styles.recommended}`}>Nice to have</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
