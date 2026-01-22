'use client';

/**
 * BuildDetailView Component
 * 
 * Comprehensive view of a saved build showing everything needed to understand
 * and execute the build:
 * - All upgrades organized by category
 * - Build complexity and difficulty assessment
 * - Tools and equipment required
 * - Systems affected with stress indicators
 * - Synergies and warnings
 * - Cost breakdown
 * - Link to modify in Performance Hub
 */

import { useMemo } from 'react';
import Link from 'next/link';
import CarImage from './CarImage';
import { getUpgradeByKey, getCanonicalCategories, getCanonicalCategoryKey } from '@/lib/upgrades.js';
import { validateUpgradeSelection, getSystemImpactOverview, SEVERITY } from '@/lib/dependencyChecker.js';
import { getToolsForBuild, calculateBuildComplexity, difficultyLevels, toolCategories } from '@/data/upgradeTools.js';
import { Icons } from '@/components/ui/Icons';
import styles from './BuildDetailView.module.css';

/**
 * Build Summary Header Card
 */
function BuildSummaryCard({ build, car, complexity }) {
  const partsCount = (build?.parts?.length || build?.selectedParts?.length || 0);
  return (
    <div className={styles.summaryCard}>
      <div className={styles.summaryImage}>
        <CarImage car={car} variant="hero" />
      </div>
      <div className={styles.summaryContent}>
        <div className={styles.summaryHeader}>
          <h2 className={styles.buildName}>{build?.name || 'Untitled Build'}</h2>
          <span className={styles.buildDate}>
            Saved {build?.createdAt ? new Date(build.createdAt).toLocaleDateString() : '—'}
          </span>
        </div>
        <p className={styles.carName}>{car.name}</p>
        
        <div className={styles.summaryStats}>
          <div className={styles.summaryStat}>
            <Icons.wrench size={16} />
            <span className={styles.summaryStatValue}>{build?.upgrades?.length || 0}</span>
            <span className={styles.summaryStatLabel}>Upgrades</span>
          </div>
          <div className={styles.summaryStat}>
            <Icons.list size={16} />
            <span className={styles.summaryStatValue}>{partsCount}</span>
            <span className={styles.summaryStatLabel}>Parts</span>
          </div>
          <div className={styles.summaryStat}>
            <Icons.bolt size={16} />
            <span className={styles.summaryStatValue}>+{build?.totalHpGain || 0}</span>
            <span className={styles.summaryStatLabel}>HP Gain</span>
          </div>
          <div className={styles.summaryStat}>
            <Icons.clock size={16} />
            <span className={styles.summaryStatValue}>{complexity.timeEstimate?.display || '—'}</span>
            <span className={styles.summaryStatLabel}>Est. Time</span>
          </div>
          <div className={styles.summaryStat}>
            <Icons.dollar size={16} />
            <span className={styles.summaryStatValue}>${(Number(build?.totalCostLow) || 0).toLocaleString()}</span>
            <span className={styles.summaryStatLabel}>Est. Cost</span>
          </div>
        </div>

        <div className={styles.summaryActions}>
          <Link 
            href={`/garage/my-build?car=${car.slug}&build=${build.id}`}
            className={styles.modifyButton}
          >
            <Icons.tool size={16} />
            Modify Build
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Difficulty Badge Component
 */
function DifficultyBadge({ difficulty }) {
  const info = difficultyLevels[difficulty] || difficultyLevels.moderate;
  
  return (
    <div className={styles.difficultyBadge} data-difficulty={difficulty}>
      <span className={styles.difficultyDot} style={{ backgroundColor: info.color }} />
      <span className={styles.difficultyName}>{info.name}</span>
    </div>
  );
}

/**
 * Build Complexity Section
 */
function BuildComplexitySection({ complexity }) {
  const info = complexity.difficultyInfo || difficultyLevels.moderate;
  
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>
        <Icons.gauge size={18} />
        Build Complexity
      </h3>
      
      <div className={styles.complexityCard}>
        <div className={styles.complexityHeader}>
          <DifficultyBadge difficulty={complexity.difficulty} />
          <span className={styles.complexityTime}>
            <Icons.clock size={14} />
            {complexity.timeEstimate?.display || 'Variable'}
          </span>
        </div>
        
        <p className={styles.complexityDescription}>{info.description}</p>
        
        <div className={styles.complexityMeta}>
          <div className={styles.complexityMetaItem}>
            <Icons.home size={14} />
            <span>{info.garageRequirement}</span>
          </div>
        </div>
        
        <div className={styles.diyAssessment} data-feasibility={complexity.diyFeasibility}>
          <div className={styles.diyAssessmentIcon}>
            {complexity.diyFeasibility === 'fully-diy' && <Icons.check size={16} />}
            {complexity.diyFeasibility === 'partial-diy' && <Icons.info size={16} />}
            {(complexity.diyFeasibility === 'shop-recommended' || complexity.diyFeasibility === 'mostly-shop') && <Icons.alert size={16} />}
          </div>
          <div className={styles.diyAssessmentContent}>
            <span className={styles.diyAssessmentLabel}>
              {complexity.diyFeasibility === 'fully-diy' && 'DIY Friendly'}
              {complexity.diyFeasibility === 'partial-diy' && 'Partial DIY'}
              {complexity.diyFeasibility === 'shop-recommended' && 'Shop Recommended'}
              {complexity.diyFeasibility === 'mostly-shop' && 'Professional Install'}
            </span>
            <p className={styles.diyAssessmentMessage}>{complexity.diyMessage}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Upgrades List Section - Organized by category
 */
function UpgradesListSection({ upgrades, upgradeDetails }) {
  const categories = getCanonicalCategories();
  
  // Group upgrades by category
  const upgradesByCategory = useMemo(() => {
    const grouped = {};
    
    upgradeDetails.forEach(upgrade => {
      if (!upgrade) return;
      const catKey = getCanonicalCategoryKey(upgrade.category) || 'power';
      if (!grouped[catKey]) {
        grouped[catKey] = {
          ...categories[catKey],
          upgrades: [],
        };
      }
      grouped[catKey].upgrades.push(upgrade);
    });
    
    return Object.values(grouped).filter(cat => cat.upgrades.length > 0);
  }, [upgradeDetails, categories]);
  
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>
        <Icons.list size={18} />
        Build Plan ({upgrades.length} Upgrades)
      </h3>
      
      <div className={styles.upgradesGrid}>
        {upgradesByCategory.map(category => (
          <div key={category.key} className={styles.categoryCard}>
            <h4 className={styles.categoryTitle}>{category.name}</h4>
            <ul className={styles.upgradeList}>
              {category.upgrades.map(upgrade => (
                <li key={upgrade.key} className={styles.upgradeItem}>
                  <Icons.check size={14} className={styles.upgradeCheck} />
                  <div className={styles.upgradeInfo}>
                    <span className={styles.upgradeName}>{upgrade.name}</span>
                    {upgrade.metricChanges?.hpGain > 0 && (
                      <span className={styles.upgradeGain}>+{upgrade.metricChanges.hpGain} hp</span>
                    )}
                  </div>
                  {(upgrade.estimatedCostLow || upgrade.cost?.low) && (
                    <span className={styles.upgradeCost}>
                      ${(upgrade.estimatedCostLow || upgrade.cost?.low || 0).toLocaleString()}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Tools Required Section
 */
function ToolsSection({ toolsData }) {
  const { essential, recommended, byCategory } = toolsData;
  
  if (essential.length === 0 && recommended.length === 0) {
    return null;
  }
  
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>
        <Icons.wrench size={18} />
        Tools & Equipment Required
      </h3>
      
      <div className={styles.toolsGrid}>
        {Object.values(byCategory).map(category => (
          <div key={category.key} className={styles.toolCategory}>
            <h4 className={styles.toolCategoryTitle}>
              {category.name}
            </h4>
            <ul className={styles.toolList}>
              {category.tools.map(tool => (
                <li key={tool.key} className={styles.toolItem}>
                  <span className={styles.toolName}>{tool.name}</span>
                  {tool.essential && (
                    <span className={styles.toolEssential}>Essential</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      
      {essential.length > 0 && (
        <div className={styles.toolsSummary}>
          <strong>{essential.length}</strong> essential tools • 
          <strong> {recommended.length}</strong> recommended
        </div>
      )}
    </section>
  );
}

/**
 * Systems Impact Section
 */
function SystemsImpactSection({ impacts, validation }) {
  if (!impacts || impacts.length === 0) {
    return null;
  }
  
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>
        <Icons.gauge size={18} />
        Systems Affected
      </h3>
      
      <div className={styles.systemsGrid}>
        {impacts.map(impact => (
          <div 
            key={impact.system.key} 
            className={styles.systemCard}
            data-has-stress={(impact.stresses + impact.compromises) > 0}
          >
            <h4 className={styles.systemName}>{impact.system.name}</h4>
            <div className={styles.systemStats}>
              {impact.improves > 0 && (
                <span className={styles.systemImproves}>
                  +{impact.improves} improvements
                </span>
              )}
              {(impact.stresses + impact.compromises) > 0 && (
                <span className={styles.systemStress}>
                  {impact.stresses + impact.compromises} stress point{(impact.stresses + impact.compromises) > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Synergies */}
      {validation?.synergies?.length > 0 && (
        <div className={styles.synergiesBox}>
          <div className={styles.synergiesHeader}>
            <Icons.star size={16} filled />
            <span>Great Combinations</span>
          </div>
          {validation.synergies.map((synergy, idx) => (
            <p key={idx} className={styles.synergyItem}>
              <strong>{synergy.name}:</strong> {synergy.message}
            </p>
          ))}
        </div>
      )}
      
      {/* Warnings */}
      {(validation?.warnings?.length > 0 || validation?.critical?.length > 0) && (
        <div className={styles.warningsBox}>
          <div className={styles.warningsHeader}>
            <Icons.alert size={16} />
            <span>Build Notes</span>
          </div>
          {validation.critical?.map((issue, idx) => (
            <p key={`critical-${idx}`} className={styles.warningItem} data-severity="critical">
              {issue.message}
            </p>
          ))}
          {validation.warnings?.map((issue, idx) => (
            <p key={`warning-${idx}`} className={styles.warningItem}>
              {issue.message}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * Installation Notes Section
 */
function InstallationNotesSection({ complexity }) {
  const notes = complexity.notes || [];
  
  if (notes.length === 0) {
    return null;
  }
  
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>
        <Icons.info size={18} />
        Installation Notes
      </h3>
      
      <ul className={styles.notesList}>
        {notes.map((item, idx) => (
          <li key={idx} className={styles.noteItem}>
            <strong>{item.upgrade}:</strong> {item.note}
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Selected Parts Section - snapshot list (fitment/pricing)
 */
function PartsListSection({ parts }) {
  if (!Array.isArray(parts) || parts.length === 0) return null;

  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>
        <Icons.list size={18} />
        Selected Parts
      </h3>

      <div className={styles.partsGrid}>
        {parts.map((p) => (
          <div key={p.id} className={styles.partCard}>
            <div className={styles.partHeader}>
              <div className={styles.partName}>{p.name}</div>
              {p.productUrl && (
                <a className={styles.partLink} href={p.productUrl} target="_blank" rel="noopener noreferrer">
                  View
                </a>
              )}
            </div>
            <div className={styles.partMeta}>
              <span>{p.brandName || '—'}</span>
              {p.partNumber && <span className={styles.dot}>•</span>}
              {p.partNumber && <span>PN {p.partNumber}</span>}
              {p.category && <span className={styles.dot}>•</span>}
              {p.category && <span>{p.category}</span>}
            </div>
            <div className={styles.partBadges}>
              {p.verified && <span className={styles.badgeVerified}>Verified</span>}
              {typeof p.confidence === 'number' && <span className={styles.badge}>Conf {Math.round(p.confidence * 100)}%</span>}
              {p.requiresTune && <span className={styles.badgeWarn}>Requires tune</span>}
              {p.installDifficulty && <span className={styles.badge}>{p.installDifficulty}</span>}
              {Number.isFinite(p.priceCents) && <span className={styles.badgePrice}>${Math.round(p.priceCents / 100).toLocaleString()}</span>}
            </div>
            {p.fitmentNotes && <div className={styles.partNotes}>{p.fitmentNotes}</div>}
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Main BuildDetailView Component
 */
export default function BuildDetailView({ build, car, onBack }) {
  // Memoize derived values to prevent unnecessary recalculations
  const buildUpgrades = useMemo(() => 
    Array.isArray(build?.upgrades) ? build.upgrades : [], 
    [build?.upgrades]
  );
  const safeCar = useMemo(() => car || {}, [car]);

  // Resolve upgrade keys to full upgrade objects
  const upgradeDetails = useMemo(() => {
    return buildUpgrades.map(key => getUpgradeByKey(key)).filter(Boolean);
  }, [buildUpgrades]);
  
  // Calculate build complexity
  const complexity = useMemo(() => {
    return calculateBuildComplexity(buildUpgrades);
  }, [buildUpgrades]);
  
  // Get tools required
  const toolsData = useMemo(() => {
    return getToolsForBuild(buildUpgrades);
  }, [buildUpgrades]);
  
  // Get system impacts
  const impacts = useMemo(() => {
    return getSystemImpactOverview(buildUpgrades);
  }, [buildUpgrades]);
  
  // Validate build
  const validation = useMemo(() => {
    return validateUpgradeSelection(buildUpgrades, safeCar);
  }, [buildUpgrades, safeCar]);

  const selectedParts = useMemo(() => {
    const raw = build?.parts || build?.selectedParts || [];
    if (!Array.isArray(raw)) return [];
    return raw
      .map((p) => {
        const id = p?.partId || p?.part_id || p?.id;
        if (!id) return null;

        const latestPrice = p?.latest_price || p?.latestPrice || null;
        const fitment = p?.fitment || null;

        return {
          id,
          name: p?.partName || p?.part_name || p?.name || 'Part',
          brandName: p?.brandName || p?.brand_name || p?.brand || null,
          partNumber: p?.partNumber || p?.part_number || null,
          category: p?.category || null,
          vendorName: p?.vendorName || p?.vendor_name || latestPrice?.vendor_name || null,
          productUrl: p?.productUrl || p?.product_url || latestPrice?.product_url || null,
          currency: p?.currency || latestPrice?.currency || null,
          priceCents: Number.isFinite(Number(p?.priceCents))
            ? Number(p.priceCents)
            : (Number.isFinite(Number(p?.price_cents)) ? Number(p.price_cents) : (Number.isFinite(Number(latestPrice?.price_cents)) ? Number(latestPrice.price_cents) : null)),
          requiresTune: typeof p?.requiresTune === 'boolean' ? p.requiresTune : (typeof p?.requires_tune === 'boolean' ? p.requires_tune : (typeof fitment?.requires_tune === 'boolean' ? fitment.requires_tune : null)),
          installDifficulty: p?.installDifficulty || p?.install_difficulty || fitment?.install_difficulty || null,
          verified: typeof p?.fitmentVerified === 'boolean' ? p.fitmentVerified : (typeof p?.fitment_verified === 'boolean' ? p.fitment_verified : (typeof fitment?.verified === 'boolean' ? fitment.verified : null)),
          confidence: p?.fitmentConfidence ?? p?.fitment_confidence ?? fitment?.confidence ?? null,
          fitmentNotes: p?.fitmentNotes || p?.fitment_notes || fitment?.fitment_notes || null,
        };
      })
      .filter(Boolean);
  }, [build?.parts, build?.selectedParts]);

  if (!build || !car) {
    return null;
  }

  return (
    <div className={styles.container}>
      {/* Back Navigation */}
      <div className={styles.backNav}>
        <button onClick={onBack} className={styles.backButton}>
          <Icons.arrowLeft size={16} />
          Back to Builds
        </button>
      </div>
      
      {/* Summary Card */}
      <BuildSummaryCard build={build} car={car} complexity={complexity} />
      
      {/* Build Complexity */}
      <BuildComplexitySection complexity={complexity} />
      
      {/* Upgrades List */}
      <UpgradesListSection 
        upgrades={build.upgrades || []} 
        upgradeDetails={upgradeDetails} 
      />

      {/* Selected Parts */}
      <PartsListSection parts={selectedParts} />
      
      {/* Tools Required */}
      <ToolsSection toolsData={toolsData} />
      
      {/* Systems Impact */}
      <SystemsImpactSection impacts={impacts} validation={validation} />
      
      {/* Installation Notes */}
      <InstallationNotesSection complexity={complexity} />
      
      {/* Bottom CTA */}
      <div className={styles.bottomCta}>
        <Link 
          href={`/garage/my-build?car=${car.slug}&build=${build.id}`}
          className={styles.ctaButton}
        >
          <Icons.tool size={18} />
          Modify This Build
          <Icons.arrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
