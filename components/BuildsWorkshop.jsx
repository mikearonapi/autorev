'use client';

/**
 * BuildsWorkshop Component
 * 
 * A utility-focused builds management interface for the My Garage page.
 * Unlike My Collection/Favorites which showcase vehicle beauty, this component
 * is designed for build planning and comparison:
 * 
 * - Quick-glance build cards with key stats
 * - Build comparison feature (pricing, performance, parts)
 * - Grouped by vehicle for easy organization
 * - Direct access to build details, parts lists, tools required
 */

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import CarImage from './CarImage';
import { getUpgradeByKey, getCanonicalCategories, getCanonicalCategoryKey } from '@/lib/upgrades.js';
import { calculateBuildComplexity, getToolsForBuild, difficultyLevels } from '@/data/upgradeTools.js';
import styles from './BuildsWorkshop.module.css';

// Icons
const Icons = {
  wrench: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  bolt: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  dollar: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  clock: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v6l4 2"/>
    </svg>
  ),
  compare: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10"/>
      <path d="M12 20V4"/>
      <path d="M6 20v-6"/>
    </svg>
  ),
  list: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/>
      <line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/>
      <line x1="3" y1="12" x2="3.01" y2="12"/>
      <line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  ),
  grid: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/>
      <rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  plus: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  trash: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
  edit: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  eye: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  x: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  check: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  arrowRight: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  chevronDown: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  chevronUp: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15"/>
    </svg>
  ),
  tool: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h4l13-13a2.83 2.83 0 0 0-4-4L3 17v4z"/>
      <path d="M14.5 5.5L18.5 9.5"/>
    </svg>
  ),
  gauge: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  shoppingCart: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"/>
      <circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  ),
  alert: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
};

/**
 * Difficulty indicator badge
 */
function DifficultyBadge({ difficulty }) {
  const info = difficultyLevels[difficulty] || difficultyLevels.moderate;
  return (
    <span className={styles.difficultyBadge} style={{ borderColor: info.color, color: info.color }}>
      {info.name}
    </span>
  );
}

/**
 * Compact Build Card Component
 */
function BuildCard({ 
  build, 
  car, 
  isSelected, 
  onSelect, 
  onViewDetails, 
  onEdit, 
  onDelete,
  compareMode,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Calculate build complexity
  const complexity = useMemo(() => 
    calculateBuildComplexity(build.upgrades || []),
    [build.upgrades]
  );
  
  // Get upgrade details grouped by category
  const upgradesByCategory = useMemo(() => {
    const categories = getCanonicalCategories();
    const grouped = {};
    
    (build.upgrades || []).forEach(key => {
      const upgrade = getUpgradeByKey(key);
      if (!upgrade) return;
      
      const catKey = getCanonicalCategoryKey(upgrade.category) || 'power';
      if (!grouped[catKey]) {
        grouped[catKey] = {
          ...categories[catKey],
          items: [],
        };
      }
      grouped[catKey].items.push(upgrade);
    });
    
    return Object.values(grouped);
  }, [build.upgrades]);
  
  // Get tools count
  const toolsData = useMemo(() => 
    getToolsForBuild(build.upgrades || []),
    [build.upgrades]
  );
  
  const handleCardClick = useCallback(() => {
    if (compareMode) {
      onSelect?.();
    }
  }, [compareMode, onSelect]);
  
  return (
    <div 
      className={`${styles.buildCard} ${isSelected ? styles.buildCardSelected : ''} ${compareMode ? styles.buildCardSelectable : ''}`}
      onClick={handleCardClick}
    >
      {/* Selection checkbox for compare mode */}
      {compareMode && (
        <div className={styles.selectCheckbox}>
          {isSelected ? <Icons.check size={16} /> : null}
        </div>
      )}
      
      {/* Header with car thumbnail and build name */}
      <div className={styles.cardHeader}>
        <div className={styles.cardThumbnail}>
          {car ? (
            <CarImage car={car} variant="card" className={styles.thumbnailImage} />
          ) : (
            <div className={styles.thumbnailPlaceholder}>
              <Icons.wrench size={24} />
            </div>
          )}
        </div>
        <div className={styles.cardTitleArea}>
          <h3 className={styles.buildName}>{build.name || 'Untitled Build'}</h3>
          <p className={styles.carName}>{car?.name || build.carName || 'Unknown Car'}</p>
        </div>
        <DifficultyBadge difficulty={complexity.difficulty} />
      </div>
      
      {/* Key Stats Row */}
      <div className={styles.statsRow}>
        <div className={styles.statItem}>
          <Icons.bolt size={14} />
          <span className={styles.statValue}>+{build.totalHpGain || 0}</span>
          <span className={styles.statLabel}>HP</span>
        </div>
        <div className={styles.statItem}>
          <Icons.wrench size={14} />
          <span className={styles.statValue}>{build.upgrades?.length || 0}</span>
          <span className={styles.statLabel}>Mods</span>
        </div>
        <div className={styles.statItem}>
          <Icons.dollar size={14} />
          <span className={styles.statValue}>${(build.totalCostLow || 0).toLocaleString()}</span>
          <span className={styles.statLabel}>Est.</span>
        </div>
        <div className={styles.statItem}>
          <Icons.clock size={14} />
          <span className={styles.statValue}>{complexity.timeEstimate?.display || '—'}</span>
          <span className={styles.statLabel}>Time</span>
        </div>
      </div>
      
      {/* Expand/Collapse for upgrade preview */}
      <button 
        className={styles.expandToggle}
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
      >
        <span>{isExpanded ? 'Hide Details' : 'Show Upgrades'}</span>
        {isExpanded ? <Icons.chevronUp size={16} /> : <Icons.chevronDown size={16} />}
      </button>
      
      {/* Expanded upgrade preview */}
      {isExpanded && (
        <div className={styles.expandedContent}>
          {/* Upgrades by category */}
          <div className={styles.upgradesPreview}>
            {upgradesByCategory.map(cat => (
              <div key={cat.key} className={styles.categoryGroup}>
                <span className={styles.categoryLabel}>{cat.name}</span>
                <ul className={styles.upgradeList}>
                  {cat.items.map(upgrade => (
                    <li key={upgrade.key} className={styles.upgradeItem}>
                      <Icons.check size={12} />
                      <span>{upgrade.name}</span>
                      {upgrade.metricChanges?.hpGain > 0 && (
                        <span className={styles.hpGain}>+{upgrade.metricChanges.hpGain}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          {/* Tools summary */}
          <div className={styles.toolsSummary}>
            <Icons.tool size={14} />
            <span>{toolsData.essential.length} essential tools</span>
            {toolsData.recommended.length > 0 && (
              <span className={styles.toolsExtra}>+ {toolsData.recommended.length} recommended</span>
            )}
          </div>
          
          {/* DIY Assessment */}
          <div className={styles.diyAssessment} data-feasibility={complexity.diyFeasibility}>
            <span className={styles.diyLabel}>
              {complexity.diyFeasibility === 'fully-diy' && <><Icons.check size={14} /> DIY Friendly</>}
              {complexity.diyFeasibility === 'partial-diy' && <><Icons.bolt size={14} /> Partial DIY</>}
              {complexity.diyFeasibility === 'shop-recommended' && <><Icons.alert size={14} /> Shop Recommended</>}
              {complexity.diyFeasibility === 'mostly-shop' && <><Icons.wrench size={14} /> Professional Install</>}
            </span>
          </div>
        </div>
      )}
      
      {/* Action buttons */}
      <div className={styles.cardActions}>
        <button 
          className={styles.actionBtn}
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails?.(build);
          }}
          title="View Full Details"
        >
          <Icons.eye size={16} />
          <span>Details</span>
        </button>
        <Link 
          href={`/tuning-shop?car=${car?.slug || build.carSlug}&build=${build.id}`}
          className={styles.actionBtnPrimary}
          onClick={(e) => e.stopPropagation()}
          title="Modify Build"
        >
          <Icons.edit size={16} />
          <span>Modify</span>
        </Link>
        <button 
          className={styles.actionBtnDelete}
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(build);
          }}
          title="Delete Build"
        >
          <Icons.trash size={16} />
        </button>
      </div>
    </div>
  );
}

/**
 * Build Comparison Modal
 */
function CompareModal({ builds, cars, onClose }) {
  if (builds.length < 2) return null;
  
  // Get full data for each build
  const buildsData = builds.map(build => {
    const car = cars[build.carSlug];
    const complexity = calculateBuildComplexity(build.upgrades || []);
    const toolsData = getToolsForBuild(build.upgrades || []);
    const upgrades = (build.upgrades || []).map(key => getUpgradeByKey(key)).filter(Boolean);
    
    return {
      build,
      car,
      complexity,
      toolsData,
      upgrades,
      baseHp: car?.hp || 0,
      finalHp: (car?.hp || 0) + (build.totalHpGain || 0),
    };
  });
  
  // Get all unique upgrade keys across builds
  const allUpgradeKeys = new Set();
  buildsData.forEach(data => {
    (data.build.upgrades || []).forEach(key => allUpgradeKeys.add(key));
  });
  
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.compareModal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Build Comparison</h2>
          <button className={styles.modalClose} onClick={onClose}>
            <Icons.x size={24} />
          </button>
        </div>
        
        <div className={styles.compareGrid}>
          {/* Header row with build names */}
          <div className={styles.compareRow}>
            <div className={styles.compareLabelCell}></div>
            {buildsData.map(data => (
              <div key={data.build.id} className={styles.compareHeaderCell}>
                <div className={styles.compareBuildThumb}>
                  {data.car && <CarImage car={data.car} variant="card" />}
                </div>
                <h3>{data.build.name}</h3>
                <p>{data.car?.name || data.build.carName}</p>
              </div>
            ))}
          </div>
          
          {/* Performance Comparison */}
          <div className={styles.compareSectionTitle}>
            <Icons.gauge size={16} />
            <span>Performance</span>
          </div>
          
          <div className={styles.compareRow}>
            <div className={styles.compareLabelCell}>Base HP</div>
            {buildsData.map(data => (
              <div key={data.build.id} className={styles.compareValueCell}>
                {data.baseHp} hp
              </div>
            ))}
          </div>
          
          <div className={styles.compareRow}>
            <div className={styles.compareLabelCell}>HP Gain</div>
            {buildsData.map(data => (
              <div key={data.build.id} className={styles.compareValueCell}>
                <span className={styles.gainValue}>+{data.build.totalHpGain || 0} hp</span>
              </div>
            ))}
          </div>
          
          <div className={styles.compareRow}>
            <div className={styles.compareLabelCell}>Final HP</div>
            {buildsData.map(data => (
              <div key={data.build.id} className={styles.compareValueCell}>
                <strong>{data.finalHp} hp</strong>
              </div>
            ))}
          </div>
          
          {/* Cost Comparison */}
          <div className={styles.compareSectionTitle}>
            <Icons.dollar size={16} />
            <span>Estimated Cost</span>
          </div>
          
          <div className={styles.compareRow}>
            <div className={styles.compareLabelCell}>Low Estimate</div>
            {buildsData.map(data => (
              <div key={data.build.id} className={styles.compareValueCell}>
                ${(data.build.totalCostLow || 0).toLocaleString()}
              </div>
            ))}
          </div>
          
          <div className={styles.compareRow}>
            <div className={styles.compareLabelCell}>High Estimate</div>
            {buildsData.map(data => (
              <div key={data.build.id} className={styles.compareValueCell}>
                ${(data.build.totalCostHigh || 0).toLocaleString()}
              </div>
            ))}
          </div>
          
          <div className={styles.compareRow}>
            <div className={styles.compareLabelCell}>Cost per HP</div>
            {buildsData.map(data => {
              const hpGain = data.build.totalHpGain || 1;
              const costPerHp = Math.round((data.build.totalCostLow || 0) / hpGain);
              return (
                <div key={data.build.id} className={styles.compareValueCell}>
                  ${costPerHp}/hp
                </div>
              );
            })}
          </div>
          
          {/* Complexity Comparison */}
          <div className={styles.compareSectionTitle}>
            <Icons.wrench size={16} />
            <span>Installation</span>
          </div>
          
          <div className={styles.compareRow}>
            <div className={styles.compareLabelCell}># of Mods</div>
            {buildsData.map(data => (
              <div key={data.build.id} className={styles.compareValueCell}>
                {data.build.upgrades?.length || 0}
              </div>
            ))}
          </div>
          
          <div className={styles.compareRow}>
            <div className={styles.compareLabelCell}>Difficulty</div>
            {buildsData.map(data => (
              <div key={data.build.id} className={styles.compareValueCell}>
                <DifficultyBadge difficulty={data.complexity.difficulty} />
              </div>
            ))}
          </div>
          
          <div className={styles.compareRow}>
            <div className={styles.compareLabelCell}>Est. Time</div>
            {buildsData.map(data => (
              <div key={data.build.id} className={styles.compareValueCell}>
                {data.complexity.timeEstimate?.display || '—'}
              </div>
            ))}
          </div>
          
          <div className={styles.compareRow}>
            <div className={styles.compareLabelCell}>Tools Needed</div>
            {buildsData.map(data => (
              <div key={data.build.id} className={styles.compareValueCell}>
                {data.toolsData.essential.length} essential
              </div>
            ))}
          </div>
          
          <div className={styles.compareRow}>
            <div className={styles.compareLabelCell}>DIY Assessment</div>
            {buildsData.map(data => (
              <div key={data.build.id} className={styles.compareValueCell}>
                <span className={styles.diyIndicator} data-feasibility={data.complexity.diyFeasibility}>
                  {data.complexity.diyFeasibility === 'fully-diy' && 'DIY Friendly'}
                  {data.complexity.diyFeasibility === 'partial-diy' && 'Partial DIY'}
                  {data.complexity.diyFeasibility === 'shop-recommended' && 'Shop Recommended'}
                  {data.complexity.diyFeasibility === 'mostly-shop' && 'Professional'}
                </span>
              </div>
            ))}
          </div>
          
          {/* Upgrades Comparison */}
          <div className={styles.compareSectionTitle}>
            <Icons.list size={16} />
            <span>Upgrades Included</span>
          </div>
          
          {Array.from(allUpgradeKeys).map(key => {
            const upgrade = getUpgradeByKey(key);
            if (!upgrade) return null;
            
            return (
              <div key={key} className={styles.compareRow}>
                <div className={styles.compareLabelCell}>
                  {upgrade.name}
                </div>
                {buildsData.map(data => {
                  const hasUpgrade = (data.build.upgrades || []).includes(key);
                  return (
                    <div 
                      key={data.build.id} 
                      className={`${styles.compareValueCell} ${hasUpgrade ? styles.hasUpgrade : styles.missingUpgrade}`}
                    >
                      {hasUpgrade ? <Icons.check size={16} /> : '—'}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Empty State Component
 */
function EmptyState({ onCreateBuild }) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>
        <Icons.wrench size={48} />
      </div>
      <h3>No Projects Yet</h3>
      <p>Start planning your perfect build. Create mod configurations for any car and save them here to track your progress.</p>
      {onCreateBuild ? (
        <button onClick={onCreateBuild} className={styles.emptyAction}>
          <Icons.plus size={18} />
          Start Your First Project
        </button>
      ) : (
        <Link href="/tuning-shop" className={styles.emptyAction}>
          <Icons.plus size={18} />
          Start Your First Project
        </Link>
      )}
    </div>
  );
}

/**
 * Main BuildsWorkshop Component
 */
export default function BuildsWorkshop({ 
  builds = [], 
  cars = [],
  onViewDetails, 
  onDeleteBuild,
  onNewProject,
}) {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [groupByVehicle, setGroupByVehicle] = useState(true);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  
  // Create car lookup map
  const carMap = useMemo(() => {
    const map = {};
    (cars || []).forEach(car => {
      map[car.slug] = car;
    });
    return map;
  }, [cars]);
  
  // Group builds by vehicle
  const groupedBuilds = useMemo(() => {
    if (!groupByVehicle) {
      return [{ carSlug: null, carName: 'All Projects', builds }];
    }
    
    const groups = {};
    builds.forEach(build => {
      const key = build.carSlug || 'unknown';
      if (!groups[key]) {
        const car = carMap[key];
        groups[key] = {
          carSlug: key,
          carName: car?.name || build.carName || 'Unknown Vehicle',
          car,
          builds: [],
        };
      }
      groups[key].builds.push(build);
    });
    
    return Object.values(groups).sort((a, b) => b.builds.length - a.builds.length);
  }, [builds, groupByVehicle, carMap]);
  
  // Handle build selection for comparison
  const handleSelectForCompare = useCallback((build) => {
    setSelectedForCompare(prev => {
      const isSelected = prev.some(b => b.id === build.id);
      if (isSelected) {
        return prev.filter(b => b.id !== build.id);
      }
      // Max 3 builds for comparison
      if (prev.length >= 3) {
        return [...prev.slice(1), build];
      }
      return [...prev, build];
    });
  }, []);
  
  // Handle compare button click
  const handleCompare = useCallback(() => {
    if (selectedForCompare.length >= 2) {
      setShowCompareModal(true);
    }
  }, [selectedForCompare]);
  
  // Exit compare mode
  const exitCompareMode = useCallback(() => {
    setCompareMode(false);
    setSelectedForCompare([]);
  }, []);
  
  // Handle delete with confirmation
  const handleDelete = useCallback((build) => {
    if (typeof window === 'undefined') return;
    if (window.confirm(`Delete "${build.name}"? This cannot be undone.`)) {
      onDeleteBuild?.(build.id);
    }
  }, [onDeleteBuild]);
  
  if (builds.length === 0) {
    return <EmptyState onCreateBuild={onNewProject} />;
  }
  
  return (
    <div className={styles.workshop}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <span className={styles.buildCount}>{builds.length} Project{builds.length !== 1 ? 's' : ''}</span>
          
          <button 
            className={`${styles.toolbarBtn} ${groupByVehicle ? styles.active : ''}`}
            onClick={() => setGroupByVehicle(!groupByVehicle)}
            title={groupByVehicle ? 'Show all' : 'Group by vehicle'}
          >
            <Icons.list size={16} />
            <span>{groupByVehicle ? 'Grouped' : 'All'}</span>
          </button>
        </div>
        
        <div className={styles.toolbarRight}>
          {/* Compare mode controls */}
          {compareMode ? (
            <>
              <span className={styles.compareStatus}>
                {selectedForCompare.length} selected
              </span>
              <button 
                className={styles.compareBtn}
                onClick={handleCompare}
                disabled={selectedForCompare.length < 2}
              >
                <Icons.compare size={16} />
                Compare
              </button>
              <button className={styles.cancelBtn} onClick={exitCompareMode}>
                Cancel
              </button>
            </>
          ) : (
            <button 
              className={styles.toolbarBtn}
              onClick={() => setCompareMode(true)}
              disabled={builds.length < 2}
              title="Compare builds"
            >
              <Icons.compare size={16} />
              <span>Compare</span>
            </button>
          )}
          
          {/* View mode toggle */}
          <div className={styles.viewToggle}>
            <button 
              className={viewMode === 'grid' ? styles.active : ''}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              <Icons.grid size={16} />
            </button>
            <button 
              className={viewMode === 'list' ? styles.active : ''}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              <Icons.list size={16} />
            </button>
          </div>
          
          {onNewProject ? (
            <button onClick={onNewProject} className={styles.newBuildBtn}>
              <Icons.plus size={16} />
              <span>New Project</span>
            </button>
          ) : (
            <Link href="/tuning-shop" className={styles.newBuildBtn}>
              <Icons.plus size={16} />
              <span>New Project</span>
            </Link>
          )}
        </div>
      </div>
      
      {/* Compare mode instructions */}
      {compareMode && (
        <div className={styles.compareModeBar}>
          <Icons.compare size={18} />
          <span>Select 2-3 projects to compare pricing, performance, and parts</span>
        </div>
      )}
      
      {/* Build Groups/Cards */}
      <div className={`${styles.buildsContainer} ${styles[viewMode]}`}>
        {groupedBuilds.map(group => (
          <div key={group.carSlug || 'all'} className={styles.buildGroup}>
            {groupByVehicle && group.carSlug && (
              <div className={styles.groupHeader}>
                <div className={styles.groupThumb}>
                  {group.car && <CarImage car={group.car} variant="card" />}
                </div>
                <div className={styles.groupInfo}>
                  <h3>{group.carName}</h3>
                  <span>{group.builds.length} project{group.builds.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            )}
            
            <div className={styles.buildsGrid}>
              {group.builds.map(build => (
                <BuildCard
                  key={build.id}
                  build={build}
                  car={carMap[build.carSlug]}
                  isSelected={selectedForCompare.some(b => b.id === build.id)}
                  onSelect={() => handleSelectForCompare(build)}
                  onViewDetails={onViewDetails}
                  onEdit={() => {}}
                  onDelete={handleDelete}
                  compareMode={compareMode}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {/* Compare Modal */}
      {showCompareModal && (
        <CompareModal 
          builds={selectedForCompare}
          cars={carMap}
          onClose={() => setShowCompareModal(false)}
        />
      )}
    </div>
  );
}
