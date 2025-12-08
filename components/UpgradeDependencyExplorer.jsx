'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import styles from './UpgradeDependencyExplorer.module.css';
import { 
  systems, 
  nodes, 
  upgradeNodeMap, 
  checkDependencies,
} from '@/data/connectedTissueMatrix';

// Icons
const Icons = {
  bolt: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  check: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  alert: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  search: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  close: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  plus: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  minus: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  link: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  ),
  lock: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  unlock: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
    </svg>
  ),
  star: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  layers: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
      <polyline points="2 17 12 22 22 17"/>
      <polyline points="2 12 12 17 22 12"/>
    </svg>
  ),
  trash: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
  info: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
  arrowRight: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
};

// Upgrade categories
const upgradeCategories = {
  power: { name: 'Power & Engine', color: '#e74c3c', shortName: 'Power' },
  forcedInduction: { name: 'Forced Induction', color: '#9b59b6', shortName: 'FI' },
  exhaust: { name: 'Exhaust & Sound', color: '#8e44ad', shortName: 'Exhaust' },
  suspension: { name: 'Suspension & Chassis', color: '#3498db', shortName: 'Susp' },
  brakes: { name: 'Brakes & Stopping', color: '#f39c12', shortName: 'Brakes' },
  wheels: { name: 'Wheels & Tires', color: '#2ecc71', shortName: 'Wheels' },
  cooling: { name: 'Cooling & Reliability', color: '#1abc9c', shortName: 'Cooling' },
  aero: { name: 'Aerodynamics', color: '#34495e', shortName: 'Aero' },
  drivetrain: { name: 'Drivetrain', color: '#e67e22', shortName: 'Drive' },
  safety: { name: 'Safety & Track Prep', color: '#c0392b', shortName: 'Safety' },
  internals: { name: 'Engine Internals', color: '#2c3e50', shortName: 'Internals' },
};

// Helper to categorize upgrades
function categorizeUpgrade(key) {
  if (key.includes('tune') || key.includes('intake') || key.includes('throttle') || 
      key.includes('manifold') || key.includes('piggyback') || key.includes('ecu')) {
    return 'power';
  }
  if (key.includes('turbo') || key.includes('supercharger') || key.includes('intercooler') || 
      key.includes('pulley') || key.includes('charge-pipe') || key.includes('hpfp') || 
      key.includes('fuel-system') || key.includes('flex-fuel') || key.includes('methanol') ||
      key.includes('heat-exchanger')) {
    return 'forcedInduction';
  }
  if (key.includes('exhaust') || key.includes('downpipe') || key.includes('header') || 
      key.includes('muffler') || key.includes('resonator') || key.includes('cat-back')) {
    return 'exhaust';
  }
  if (key.includes('coilover') || key.includes('spring') || key.includes('sway') || 
      key.includes('bushing') || key.includes('control-arm') || key.includes('strut') ||
      key.includes('chassis-bracing') || key.includes('subframe') || key.includes('alignment')) {
    return 'suspension';
  }
  if (key.includes('brake') || key.includes('rotor') || key.includes('caliper') || key.includes('bbk')) {
    return 'brakes';
  }
  if (key.includes('tire') || key.includes('wheel') || key.includes('spacer')) {
    return 'wheels';
  }
  if (key.includes('cooler') || key.includes('radiator') || key.includes('fluid')) {
    return 'cooling';
  }
  if (key.includes('splitter') || key.includes('wing') || key.includes('diffuser') || 
      key.includes('canard') || key.includes('aero') || key.includes('undertray') ||
      key.includes('carbon-fiber-hood')) {
    return 'aero';
  }
  if (key.includes('clutch') || key.includes('flywheel') || key.includes('diff') || 
      key.includes('axle') || key.includes('driveshaft') || key.includes('dct') ||
      key.includes('shifter')) {
    return 'drivetrain';
  }
  if (key.includes('roll') || key.includes('harness') || key.includes('seat') || 
      key.includes('fire') || key.includes('helmet') || key.includes('cage')) {
    return 'safety';
  }
  if (key.includes('cam') || key.includes('head') || key.includes('forged') || 
      key.includes('stroker') || key.includes('engine-') || key.includes('ported')) {
    return 'internals';
  }
  return 'power';
}

// Format upgrade key to display name
function formatUpgradeName(key) {
  return key
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace(/Sc /g, 'SC ')
    .replace(/Ecu /g, 'ECU ')
    .replace(/Hpfp/g, 'HPFP')
    .replace(/Dct/g, 'DCT')
    .replace(/Bbk/g, 'BBK')
    .replace(/E85/g, 'E85');
}

// Impact type styling
const impactTypeConfig = {
  improves: { label: 'Improves', color: '#27ae60', icon: '↑' },
  modifies: { label: 'Modifies', color: '#3498db', icon: '~' },
  stresses: { label: 'Stresses', color: '#f39c12', icon: '⚠' },
  invalidates: { label: 'Invalidates', color: '#9b59b6', icon: '✗' },
  compromises: { label: 'Compromises', color: '#e74c3c', icon: '!' },
  requires: { label: 'Requires', color: '#c0392b', icon: '●' },
  recommends: { label: 'Recommends', color: '#1abc9c', icon: '★' },
};

// Get all upgrades
function getAllUpgrades() {
  return Object.entries(upgradeNodeMap)
    .map(([key, data]) => ({
      key,
      name: formatUpgradeName(key),
      category: categorizeUpgrade(key),
      impacts: data,
      requires: data.requires || [],
      recommends: data.recommends || [],
      hasRequirements: (data.requires?.length || 0) > 0,
      hasRecommendations: (data.recommends?.length || 0) > 0,
      totalImpacts: (data.improves?.length || 0) + (data.modifies?.length || 0) + 
                    (data.stresses?.length || 0) + (data.invalidates?.length || 0) +
                    (data.compromises?.length || 0),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Build Analysis Component - Shows cumulative impacts of selected upgrades
function BuildAnalysis({ selectedUpgrades, allUpgrades, onRemove, onClear }) {
  const analysis = useMemo(() => {
    const selected = allUpgrades.filter(u => selectedUpgrades.has(u.key));
    
    // Aggregate impacts
    const totalImpacts = { improves: [], modifies: [], stresses: [], invalidates: [], compromises: [] };
    const systemsAffected = new Set();
    const missingRequirements = [];
    const recommendations = [];
    
    selected.forEach(upgrade => {
      ['improves', 'modifies', 'stresses', 'invalidates', 'compromises'].forEach(type => {
        (upgrade.impacts[type] || []).forEach(nodeKey => {
          if (!totalImpacts[type].includes(nodeKey)) {
            totalImpacts[type].push(nodeKey);
          }
          systemsAffected.add(nodeKey.split('.')[0]);
        });
      });
      
      // Check requirements
      (upgrade.requires || []).forEach(req => {
        if (!selectedUpgrades.has(req) && !missingRequirements.find(m => m.upgrade === upgrade.key && m.requires === req)) {
          missingRequirements.push({ upgrade: upgrade.key, upgradeName: upgrade.name, requires: req, requiresName: formatUpgradeName(req) });
        }
      });
      
      // Collect recommendations
      (upgrade.recommends || []).forEach(rec => {
        if (!selectedUpgrades.has(rec) && !recommendations.find(r => r.recommends === rec)) {
          recommendations.push({ from: upgrade.name, recommends: rec, recommendsName: formatUpgradeName(rec) });
        }
      });
    });
    
    // Check for dependency warnings
    const warnings = checkDependencies(Array.from(selectedUpgrades));
    
    return {
      count: selected.length,
      selected,
      totalImpacts,
      systemsAffected: systemsAffected.size,
      missingRequirements,
      recommendations: recommendations.slice(0, 5), // Top 5
      warnings,
      improvesCount: totalImpacts.improves.length,
      stressesCount: totalImpacts.stresses.length + totalImpacts.invalidates.length,
    };
  }, [selectedUpgrades, allUpgrades]);
  
  if (analysis.count === 0) {
    return (
      <div className={styles.buildEmpty}>
        <div className={styles.buildEmptyIcon}>
          <Icons.layers size={32} />
        </div>
        <h4>Build Your Mod List</h4>
        <p>Click upgrades to add them to your build and see combined effects</p>
        <div className={styles.buildEmptyHints}>
          <span><span className={styles.hintKey}>Click</span> to add/remove</span>
          <span><span className={styles.hintKey}>Hover</span> for details</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.buildAnalysis}>
      {/* Build Header */}
      <div className={styles.buildHeader}>
        <div className={styles.buildTitle}>
          <Icons.layers size={18} />
          <span>Your Build</span>
          <span className={styles.buildCount}>{analysis.count} mods</span>
        </div>
        <button className={styles.clearBuildBtn} onClick={onClear}>
          <Icons.trash size={14} />
          Clear
        </button>
      </div>
      
      {/* Selected Upgrades Pills */}
      <div className={styles.selectedUpgrades}>
        {analysis.selected.map(upgrade => (
          <button 
            key={upgrade.key}
            className={styles.selectedPill}
            style={{ '--cat-color': upgradeCategories[upgrade.category]?.color }}
            onClick={() => onRemove(upgrade.key)}
          >
            <span className={styles.pillDot} />
            <span>{upgrade.name}</span>
            <Icons.close size={12} />
          </button>
        ))}
      </div>
      
      {/* Quick Stats */}
      <div className={styles.buildStats}>
        <div className={styles.buildStat} data-type="good">
          <span className={styles.statIcon}>↑</span>
          <span className={styles.statValue}>{analysis.improvesCount}</span>
          <span className={styles.statLabel}>Improvements</span>
        </div>
        <div className={styles.buildStat} data-type="warn">
          <span className={styles.statIcon}>⚠</span>
          <span className={styles.statValue}>{analysis.stressesCount}</span>
          <span className={styles.statLabel}>Stress Points</span>
        </div>
        <div className={styles.buildStat} data-type="info">
          <span className={styles.statIcon}>◉</span>
          <span className={styles.statValue}>{analysis.systemsAffected}</span>
          <span className={styles.statLabel}>Systems</span>
        </div>
      </div>
      
      {/* Missing Requirements Warning */}
      {analysis.missingRequirements.length > 0 && (
        <div className={styles.buildWarning}>
          <div className={styles.warningHeader}>
            <Icons.lock size={14} />
            <span>Missing Requirements</span>
          </div>
          <div className={styles.warningList}>
            {analysis.missingRequirements.map((req, idx) => (
              <div key={idx} className={styles.warningItem}>
                <span className={styles.warningFrom}>{req.upgradeName}</span>
                <Icons.arrowRight size={12} />
                <span className={styles.warningNeed}>{req.requiresName}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Dependency Warnings */}
      {analysis.warnings.length > 0 && (
        <div className={styles.buildAlerts}>
          <div className={styles.alertHeader}>
            <Icons.alert size={14} />
            <span>Build Warnings</span>
          </div>
          {analysis.warnings.slice(0, 3).map((warning, idx) => (
            <div key={idx} className={styles.alertItem} data-severity={warning.severity}>
              {warning.message}
            </div>
          ))}
        </div>
      )}
      
      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <div className={styles.buildRecommendations}>
          <div className={styles.recHeader}>
            <Icons.star size={14} />
            <span>Recommended Additions</span>
          </div>
          <div className={styles.recList}>
            {analysis.recommendations.map((rec, idx) => (
              <span key={idx} className={styles.recItem}>
                {rec.recommendsName}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Upgrade Node - Individual upgrade in the grid
function UpgradeNode({ upgrade, isSelected, isHovered, isLocked, isRecommended, onSelect, onHover, selectedUpgrades }) {
  const category = upgradeCategories[upgrade.category];
  
  // Check if this upgrade would unlock something
  const wouldUnlock = useMemo(() => {
    if (isSelected) return [];
    const potentialSelected = new Set([...selectedUpgrades, upgrade.key]);
    return upgrade.recommends?.filter(rec => !selectedUpgrades.has(rec)) || [];
  }, [upgrade, isSelected, selectedUpgrades]);
  
  return (
    <button
      className={`${styles.upgradeNode} ${isSelected ? styles.selected : ''} ${isHovered ? styles.hovered : ''} ${isLocked ? styles.locked : ''} ${isRecommended ? styles.recommended : ''}`}
      style={{ '--cat-color': category?.color || '#666' }}
      onClick={() => onSelect(upgrade.key)}
      onMouseEnter={() => onHover(upgrade)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Status Indicator */}
      <div className={styles.nodeStatus}>
        {isSelected && <Icons.check size={12} />}
        {isLocked && !isSelected && <Icons.lock size={12} />}
        {isRecommended && !isSelected && !isLocked && <Icons.star size={12} />}
      </div>
      
      {/* Category dot */}
      <span className={styles.nodeDot} />
      
      {/* Name */}
      <span className={styles.nodeName}>{upgrade.name}</span>
      
      {/* Impact indicators */}
      <div className={styles.nodeIndicators}>
        {upgrade.hasRequirements && (
          <span className={styles.indicator} data-type="requires" title="Has requirements">●</span>
        )}
        {upgrade.hasRecommendations && (
          <span className={styles.indicator} data-type="recommends" title="Has recommendations">★</span>
        )}
        {upgrade.totalImpacts > 0 && (
          <span className={styles.impactBadge}>{upgrade.totalImpacts}</span>
        )}
      </div>
      
      {/* Connection line when selected */}
      {isSelected && (
        <div className={styles.nodeConnection}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            <circle cx="90" cy="50" r="4" fill="var(--cat-color)" />
          </svg>
        </div>
      )}
    </button>
  );
}

// Hover Tooltip
function UpgradeTooltip({ upgrade, position }) {
  if (!upgrade) return null;
  
  const category = upgradeCategories[upgrade.category];
  const impacts = upgrade.impacts;
  
  return (
    <div 
      className={styles.tooltip}
      style={{ 
        top: position.y,
        left: position.x,
      }}
    >
      <div className={styles.tooltipHeader}>
        <span className={styles.tooltipDot} style={{ backgroundColor: category?.color }} />
        <span className={styles.tooltipName}>{upgrade.name}</span>
      </div>
      
      {/* Quick Impact Summary */}
      <div className={styles.tooltipImpacts}>
        {impacts.improves?.length > 0 && (
          <span className={styles.tooltipImpact} data-type="improves">
            ↑ {impacts.improves.length} improvements
          </span>
        )}
        {impacts.stresses?.length > 0 && (
          <span className={styles.tooltipImpact} data-type="stresses">
            ⚠ {impacts.stresses.length} stress points
          </span>
        )}
        {impacts.requires?.length > 0 && (
          <span className={styles.tooltipImpact} data-type="requires">
            ● Requires: {impacts.requires.map(formatUpgradeName).join(', ')}
          </span>
        )}
        {impacts.recommends?.length > 0 && (
          <span className={styles.tooltipImpact} data-type="recommends">
            ★ Pairs with: {impacts.recommends.slice(0, 2).map(formatUpgradeName).join(', ')}
            {impacts.recommends.length > 2 && ` +${impacts.recommends.length - 2} more`}
          </span>
        )}
      </div>
      
      <div className={styles.tooltipHint}>
        Click to {upgrade.isSelected ? 'remove from' : 'add to'} build
      </div>
    </div>
  );
}

// Impact Detail Panel - Shows when upgrade is hovered
function ImpactDetailPanel({ upgrade, selectedUpgrades }) {
  if (!upgrade) return null;
  
  const category = upgradeCategories[upgrade.category];
  const impacts = upgrade.impacts;
  
  // Group by system
  const systemImpacts = useMemo(() => {
    const bySystem = {};
    ['improves', 'modifies', 'stresses', 'invalidates', 'compromises'].forEach(type => {
      (impacts[type] || []).forEach(nodeKey => {
        const systemKey = nodeKey.split('.')[0];
        if (!bySystem[systemKey]) {
          bySystem[systemKey] = { system: systems[systemKey], impacts: [] };
        }
        bySystem[systemKey].impacts.push({
          type,
          nodeKey,
          nodeName: nodes[nodeKey]?.name || nodeKey,
        });
      });
    });
    return Object.values(bySystem);
  }, [impacts]);
  
  const isSelected = selectedUpgrades.has(upgrade.key);
  
  return (
    <div className={styles.detailPanel}>
      {/* Header */}
      <div className={styles.detailHeader}>
        <span className={styles.detailDot} style={{ backgroundColor: category?.color }} />
        <h3>{upgrade.name}</h3>
        <span className={`${styles.detailStatus} ${isSelected ? styles.inBuild : ''}`}>
          {isSelected ? 'In Build' : 'Preview'}
        </span>
      </div>
      
      {/* Requirements & Recommendations */}
      {(impacts.requires?.length > 0 || impacts.recommends?.length > 0) && (
        <div className={styles.detailDeps}>
          {impacts.requires?.length > 0 && (
            <div className={styles.depSection} data-type="requires">
              <span className={styles.depLabel}>
                <span className={styles.depIcon}>●</span>
                Requires:
              </span>
              <div className={styles.depTags}>
                {impacts.requires.map(req => {
                  const hasIt = selectedUpgrades.has(req);
                  return (
                    <span 
                      key={req} 
                      className={`${styles.depTag} ${hasIt ? styles.satisfied : ''}`}
                    >
                      {hasIt && <Icons.check size={10} />}
                      {formatUpgradeName(req)}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
          {impacts.recommends?.length > 0 && (
            <div className={styles.depSection} data-type="recommends">
              <span className={styles.depLabel}>
                <span className={styles.depIcon}>★</span>
                Pairs well:
              </span>
              <div className={styles.depTags}>
                {impacts.recommends.map(rec => {
                  const hasIt = selectedUpgrades.has(rec);
                  return (
                    <span 
                      key={rec} 
                      className={`${styles.depTag} ${hasIt ? styles.satisfied : ''}`}
                    >
                      {hasIt && <Icons.check size={10} />}
                      {formatUpgradeName(rec)}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* System Impacts Grid */}
      <div className={styles.detailSystems}>
        <h4>System Impacts</h4>
        {systemImpacts.length === 0 ? (
          <p className={styles.noImpacts}>No mapped system impacts</p>
        ) : (
          <div className={styles.systemGrid}>
            {systemImpacts.map(({ system, impacts: sysImpacts }) => (
              <div 
                key={system?.key || 'unknown'}
                className={styles.systemCard}
                style={{ '--system-color': system?.color || '#666' }}
              >
                <div className={styles.systemHeader}>
                  <span>{system?.name || 'System'}</span>
                  <span className={styles.systemCount}>{sysImpacts.length}</span>
                </div>
                <div className={styles.systemImpacts}>
                  {sysImpacts.map((impact, idx) => (
                    <div key={idx} className={styles.impactRow}>
                      <span 
                        className={styles.impactIcon}
                        style={{ color: impactTypeConfig[impact.type]?.color }}
                      >
                        {impactTypeConfig[impact.type]?.icon}
                      </span>
                      <span className={styles.impactName}>{impact.nodeName}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Main Component
export default function UpgradeDependencyExplorer() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedUpgrades, setSelectedUpgrades] = useState(new Set());
  const [hoveredUpgrade, setHoveredUpgrade] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  
  const allUpgrades = useMemo(() => getAllUpgrades(), []);
  
  // Filter upgrades
  const filteredUpgrades = useMemo(() => {
    let filtered = allUpgrades;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(u => 
        u.name.toLowerCase().includes(term) ||
        u.key.toLowerCase().includes(term)
      );
    }
    
    if (selectedCategory) {
      filtered = filtered.filter(u => u.category === selectedCategory);
    }
    
    return filtered;
  }, [allUpgrades, searchTerm, selectedCategory]);
  
  // Group by category for display
  const groupedUpgrades = useMemo(() => {
    const groups = {};
    filteredUpgrades.forEach(upgrade => {
      if (!groups[upgrade.category]) {
        groups[upgrade.category] = [];
      }
      groups[upgrade.category].push(upgrade);
    });
    return groups;
  }, [filteredUpgrades]);
  
  // Determine upgrade states
  const getUpgradeState = useCallback((upgrade) => {
    const isSelected = selectedUpgrades.has(upgrade.key);
    const isLocked = upgrade.requires?.some(req => !selectedUpgrades.has(req)) || false;
    const isRecommended = Array.from(selectedUpgrades).some(key => {
      const u = allUpgrades.find(a => a.key === key);
      return u?.recommends?.includes(upgrade.key);
    });
    return { isSelected, isLocked: !isSelected && isLocked, isRecommended: !isSelected && isRecommended };
  }, [selectedUpgrades, allUpgrades]);
  
  // Toggle selection
  const toggleUpgrade = useCallback((key) => {
    setSelectedUpgrades(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);
  
  // Handle hover with tooltip position
  const handleHover = useCallback((upgrade, event) => {
    if (upgrade && event) {
      const rect = event.target.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (containerRect) {
        setTooltipPosition({
          x: rect.right - containerRect.left + 10,
          y: rect.top - containerRect.top,
        });
      }
    }
    setHoveredUpgrade(upgrade);
  }, []);
  
  // Stats
  const stats = useMemo(() => ({
    total: allUpgrades.length,
    withRequirements: allUpgrades.filter(u => u.hasRequirements).length,
    systems: Object.keys(systems).length,
    components: Object.keys(nodes).length,
  }), [allUpgrades]);
  
  return (
    <div className={styles.explorer} ref={containerRef}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>
            <Icons.layers size={24} />
            Build Planner
          </h2>
          <p className={styles.subtitle}>
            Select upgrades to build your mod list. See dependencies, conflicts, and recommendations in real-time.
          </p>
        </div>
        <div className={styles.headerStats}>
          <div className={styles.stat}>
            <span className={styles.statNum}>{stats.total}</span>
            <span className={styles.statLabel}>Upgrades</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNum}>{stats.systems}</span>
            <span className={styles.statLabel}>Systems</span>
          </div>
        </div>
      </div>
      
      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.searchBox}>
          <Icons.search size={16} />
          <input
            type="text"
            placeholder="Search upgrades..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className={styles.clearBtn}>
              <Icons.close size={14} />
            </button>
          )}
        </div>
        
        <div className={styles.categoryTabs}>
          <button
            className={`${styles.categoryTab} ${!selectedCategory ? styles.active : ''}`}
            onClick={() => setSelectedCategory(null)}
          >
            All
          </button>
          {Object.entries(upgradeCategories).map(([key, cat]) => {
            const count = allUpgrades.filter(u => u.category === key).length;
            if (count === 0) return null;
            return (
              <button
                key={key}
                className={`${styles.categoryTab} ${selectedCategory === key ? styles.active : ''}`}
                style={{ '--cat-color': cat.color }}
                onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
              >
                <span className={styles.tabDot} />
                {cat.shortName}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Main Content */}
      <div className={styles.content}>
        {/* Upgrade Grid */}
        <div className={styles.upgradeGrid}>
          {Object.entries(groupedUpgrades).map(([category, upgrades]) => (
            <div key={category} className={styles.categoryGroup}>
              <div className={styles.categoryHeader}>
                <span 
                  className={styles.categoryDot}
                  style={{ backgroundColor: upgradeCategories[category]?.color }}
                />
                <span>{upgradeCategories[category]?.name}</span>
                <span className={styles.categoryCount}>{upgrades.length}</span>
              </div>
              <div className={styles.upgradeNodes}>
                {upgrades.map(upgrade => {
                  const state = getUpgradeState(upgrade);
                  return (
                    <UpgradeNode
                      key={upgrade.key}
                      upgrade={upgrade}
                      isSelected={state.isSelected}
                      isLocked={state.isLocked}
                      isRecommended={state.isRecommended}
                      isHovered={hoveredUpgrade?.key === upgrade.key}
                      onSelect={toggleUpgrade}
                      onHover={(u) => handleHover(u, window.event)}
                      selectedUpgrades={selectedUpgrades}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        
        {/* Right Panel */}
        <div className={styles.rightPanel}>
          {hoveredUpgrade ? (
            <ImpactDetailPanel 
              upgrade={hoveredUpgrade} 
              selectedUpgrades={selectedUpgrades}
            />
          ) : (
            <BuildAnalysis
              selectedUpgrades={selectedUpgrades}
              allUpgrades={allUpgrades}
              onRemove={toggleUpgrade}
              onClear={() => setSelectedUpgrades(new Set())}
            />
          )}
        </div>
      </div>
      
      {/* Legend */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={styles.legendIcon} data-type="selected"><Icons.check size={12} /></span>
          <span>Selected</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendIcon} data-type="locked"><Icons.lock size={12} /></span>
          <span>Needs Prereq</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendIcon} data-type="recommended"><Icons.star size={12} /></span>
          <span>Recommended</span>
        </div>
        <div className={styles.legendSep} />
        <div className={styles.legendItem}>
          <span className={styles.legendBadge} style={{ backgroundColor: '#c0392b' }}>●</span>
          <span>Has Requirements</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendBadge} style={{ backgroundColor: '#1abc9c' }}>★</span>
          <span>Has Recommendations</span>
        </div>
      </div>
    </div>
  );
}
