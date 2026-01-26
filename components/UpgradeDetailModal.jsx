'use client';

import { useState, useEffect } from 'react';

import { createPortal } from 'react-dom';

import { Icons } from '@/components/ui/Icons';
import { useSafeAreaColor, SAFE_AREA_COLORS } from '@/hooks/useSafeAreaColor';
import { analyzeScenario } from '@/lib/dependencyChecker';

import InfoTooltip from './ui/InfoTooltip';
import styles from './UpgradeDetailModal.module.css';

/**
 * Determine which scenario explanation applies to an upgrade
 */
function getRelevantScenario(upgradeKey) {
  if (!upgradeKey) return null;

  // Boost/Tune upgrades -> boost_increase scenario
  if (
    upgradeKey.includes('tune') ||
    upgradeKey.includes('turbo') ||
    upgradeKey.includes('supercharger') ||
    upgradeKey.includes('pulley')
  ) {
    return 'boost_increase';
  }

  // Note: Tire compound selection is handled by WheelTireConfigurator

  // Lowering upgrades -> lowering scenario
  if (upgradeKey === 'lowering-springs' || upgradeKey.includes('coilovers')) {
    return 'lowering';
  }

  // BBK -> bbk scenario
  if (upgradeKey === 'big-brake-kit') {
    return 'bbk';
  }

  return null;
}

/**
 * Shared Upgrade Detail Modal Component
 *
 * Displays detailed information about an upgrade from the Upgrade Encyclopedia.
 * Used by both the UpgradeGuide and PerformanceHub components.
 *
 * @param {Object} upgrade - The upgrade object with encyclopedia data
 * @param {Function} onClose - Callback to close the modal
 * @param {Array} onAddToBuild - Optional callback when user clicks "Add to Build"
 * @param {boolean} showAddToBuild - Whether to show the Add to Build button
 */
export default function UpgradeDetailModal({
  upgrade,
  onClose,
  onAddToBuild = null,
  showAddToBuild = false,
  carName = null,
  carSlug = null,
}) {
  // Set safe area color to match overlay background
  useSafeAreaColor(SAFE_AREA_COLORS.OVERLAY, { enabled: !!upgrade });

  // Portal mounting - required for SSR compatibility
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!upgrade || !isMounted) return null;

  // Handle keyboard escape
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
  };

  // Build the cost display
  const costDisplay = upgrade.cost?.range || upgrade.estimatedCost || 'Varies';

  const modalContent = (
    <div
      className={styles.overlay}
      onClick={onClose}
      onKeyDown={handleKeyDown}
      data-overlay-modal
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
    >
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
          <Icons.close size={24} />
        </button>

        {/* Header */}
        <div className={styles.header}>
          <h2 id="upgrade-modal-title" className={styles.title}>
            {upgrade.name}
          </h2>
          <div className={styles.metaRow}>
            <span className={styles.metaItem}>
              <Icons.dollar size={16} />
              {costDisplay}
            </span>
            {upgrade.difficulty && (
              <span className={styles.metaItem}>
                <Icons.wrench size={16} />
                <InfoTooltip topicKey="installDifficulty" carName={carName} carSlug={carSlug}>
                  <span>{upgrade.difficulty}</span>
                </InfoTooltip>
              </span>
            )}
            {upgrade.installTime && (
              <span className={styles.metaItem}>
                <Icons.clock size={16} />
                {upgrade.installTime}
              </span>
            )}
          </div>
          {upgrade.tier && (
            <span className={`${styles.tierBadge} ${styles[upgrade.tier]}`}>
              {upgrade.tier.replace(/([A-Z])/g, ' $1').trim()}
            </span>
          )}
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* What It Is */}
          {(upgrade.fullDescription || upgrade.description) && (
            <section className={styles.section}>
              <h3>What It Is</h3>
              <p>{upgrade.fullDescription || upgrade.description}</p>
            </section>
          )}

          {/* How It Works */}
          {upgrade.howItWorks && (
            <section className={styles.section}>
              <h3>How It Works</h3>
              <p>{upgrade.howItWorks}</p>
            </section>
          )}

          {/* Connected Tissue Scenario Explanation */}
          {(() => {
            const scenarioType = getRelevantScenario(upgrade.key);
            const scenario = scenarioType ? analyzeScenario(scenarioType) : null;

            if (!scenario) return null;

            return (
              <section className={styles.section}>
                <h3>
                  <Icons.chain size={16} /> Chain of Effects
                </h3>
                <p className={styles.scenarioDesc}>{scenario.description}</p>
                <div className={styles.chainContainer}>
                  {scenario.chainOfEffects.map((effect, idx) => (
                    <div key={idx} className={styles.chainStep}>
                      <div className={styles.chainStepHeader}>
                        <span className={styles.chainStepNum}>{effect.step}</span>
                        <span className={styles.chainStepAction}>{effect.action}</span>
                      </div>
                      <div className={styles.chainStepBody}>
                        <div className={styles.chainAffects}>
                          <span className={styles.chainLabel}>Affects:</span>
                          <span>{effect.affects}</span>
                        </div>
                        <div className={styles.chainConsequence}>
                          <Icons.arrowRight size={14} />
                          <span>{effect.consequence}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {scenario.recommendedUpgrades?.length > 0 && (
                  <div className={styles.scenarioRecs}>
                    <span className={styles.scenarioRecsLabel}>
                      Supporting upgrades to consider:
                    </span>
                    <div className={styles.tagList}>
                      {scenario.recommendedUpgrades.map((key, i) => (
                        <span key={i} className={styles.tagRecommended}>
                          {key}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            );
          })()}

          {/* Expected Gains */}
          {upgrade.expectedGains && (
            <section className={styles.section}>
              <h3>Expected Gains</h3>
              <div className={styles.gainsGrid}>
                {upgrade.expectedGains.hp && (
                  <div className={styles.gainItem}>
                    <span className={styles.gainLabel}>Power</span>
                    <span className={styles.gainValue}>{upgrade.expectedGains.hp}</span>
                  </div>
                )}
                {upgrade.expectedGains.torque && (
                  <div className={styles.gainItem}>
                    <span className={styles.gainLabel}>Torque</span>
                    <span className={styles.gainValue}>{upgrade.expectedGains.torque}</span>
                  </div>
                )}
                {upgrade.expectedGains.handling && (
                  <div className={styles.gainItem}>
                    <span className={styles.gainLabel}>Handling</span>
                    <span className={styles.gainValue}>{upgrade.expectedGains.handling}</span>
                  </div>
                )}
                {upgrade.expectedGains.grip && (
                  <div className={styles.gainItem}>
                    <span className={styles.gainLabel}>Grip</span>
                    <span className={styles.gainValue}>{upgrade.expectedGains.grip}</span>
                  </div>
                )}
                {upgrade.expectedGains.stopping && (
                  <div className={styles.gainItem}>
                    <span className={styles.gainLabel}>Stopping</span>
                    <span className={styles.gainValue}>{upgrade.expectedGains.stopping}</span>
                  </div>
                )}
              </div>
              {upgrade.expectedGains.note && (
                <p className={styles.gainNote}>{upgrade.expectedGains.note}</p>
              )}
            </section>
          )}

          {/* Metric Changes (from performance modules) - HP gain removed per design */}
          {upgrade.metricChanges &&
            (upgrade.metricChanges.zeroToSixtyImprovement ||
              upgrade.metricChanges.brakingImprovement ||
              upgrade.metricChanges.lateralGImprovement) && (
              <section className={styles.section}>
                <h3>Performance Impact</h3>
                <div className={styles.gainsGrid}>
                  {upgrade.metricChanges.zeroToSixtyImprovement && (
                    <div className={styles.gainItem}>
                      <span className={styles.gainLabel}>0-60 Improvement</span>
                      <span className={styles.gainValue}>
                        -{upgrade.metricChanges.zeroToSixtyImprovement}s
                      </span>
                    </div>
                  )}
                  {upgrade.metricChanges.brakingImprovement && (
                    <div className={styles.gainItem}>
                      <span className={styles.gainLabel}>Braking Improvement</span>
                      <span className={styles.gainValue}>
                        -{upgrade.metricChanges.brakingImprovement} ft
                      </span>
                    </div>
                  )}
                  {upgrade.metricChanges.lateralGImprovement && (
                    <div className={styles.gainItem}>
                      <span className={styles.gainLabel}>Lateral G Improvement</span>
                      <span className={styles.gainValue}>
                        +{upgrade.metricChanges.lateralGImprovement}g
                      </span>
                    </div>
                  )}
                </div>
              </section>
            )}

          {/* Pros & Cons */}
          {(upgrade.pros?.length > 0 || upgrade.cons?.length > 0) && (
            <section className={styles.section}>
              <div className={styles.prosConsGrid}>
                {upgrade.pros?.length > 0 && (
                  <div className={styles.prosColumn}>
                    <h4>
                      <Icons.check size={16} /> Pros
                    </h4>
                    <ul>
                      {upgrade.pros.map((pro, i) => (
                        <li key={i}>{pro}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {upgrade.cons?.length > 0 && (
                  <div className={styles.consColumn}>
                    <h4>
                      <Icons.x size={16} /> Cons
                    </h4>
                    <ul>
                      {upgrade.cons.map((con, i) => (
                        <li key={i}>{con}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Best For */}
          {upgrade.bestFor?.length > 0 && (
            <section className={styles.section}>
              <h3>Best For</h3>
              <div className={styles.tagList}>
                {upgrade.bestFor.map((item, i) => (
                  <span key={i} className={styles.tag}>
                    {item}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Works Well With */}
          {upgrade.worksWellWith?.length > 0 && (
            <section className={styles.section}>
              <h3>Works Well With</h3>
              <div className={styles.tagList}>
                {upgrade.worksWellWith.map((item, i) => (
                  <span key={i} className={styles.tagSecondary}>
                    {item}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Dependencies / Requirements */}
          {(upgrade.requires?.length > 0 || upgrade.stronglyRecommended?.length > 0) && (
            <section className={styles.section}>
              <h3>
                <Icons.alertTriangle size={16} /> Dependencies & Recommendations
              </h3>
              {upgrade.requires?.length > 0 && (
                <div className={styles.dependencyGroup}>
                  <span className={styles.depLabel}>Required:</span>
                  <div className={styles.tagList}>
                    {upgrade.requires.map((item, i) => (
                      <span key={i} className={styles.tagRequired}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {upgrade.stronglyRecommended?.length > 0 && (
                <div className={styles.dependencyGroup}>
                  <span className={styles.depLabel}>Strongly Recommended:</span>
                  <div className={styles.tagList}>
                    {upgrade.stronglyRecommended.map((item, i) => (
                      <span key={i} className={styles.tagRecommended}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Considerations */}
          {upgrade.considerations && (
            <section className={styles.section}>
              <h3>Important Considerations</h3>
              <p className={styles.considerations}>{upgrade.considerations}</p>
            </section>
          )}

          {/* Brands */}
          {upgrade.brands?.length > 0 && (
            <section className={styles.section}>
              <h3>Recommended Brands</h3>
              <div className={styles.brandsList}>
                {upgrade.brands.map((brand, i) => (
                  <span key={i} className={styles.brand}>
                    {brand}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Footer with optional Add to Build button */}
        {showAddToBuild && onAddToBuild && (
          <div className={styles.footer}>
            <button className={styles.addToBuildBtn} onClick={() => onAddToBuild(upgrade.key)}>
              Add to Build
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // Use portal to render at document body level
  return createPortal(modalContent, document.body);
}
