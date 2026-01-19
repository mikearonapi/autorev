'use client';

/**
 * Premium Build Detail Sheet
 * 
 * Shows rich build information including:
 * - Performance Metrics (HP, 0-60, Braking, Grip)
 * - Experience Scores (Comfort, Reliability, Sound)
 * - Parts/Mods Shopping List
 */

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getUpgradeByKey } from '@/lib/upgrades';
import { mapCarToPerformanceScores } from '@/data/performanceCategories';
import { applyUpgradeDeltas } from '@/lib/performance';
import styles from './BuildDetailSheet.module.css';

// Icons
const XIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const BoltIcon = ({ size = 18 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

const StopwatchIcon = ({ size = 18 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="14" r="8"/>
    <line x1="12" y1="14" x2="12" y2="10"/>
    <line x1="12" y1="2" x2="12" y2="4"/>
    <line x1="8" y1="2" x2="16" y2="2"/>
  </svg>
);

const BrakeIcon = ({ size = 18 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="3"/>
    <line x1="12" y1="5" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="19" y2="12"/>
  </svg>
);

const GaugeIcon = ({ size = 18 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 2a10 10 0 1 0 10 10"/>
    <path d="M12 12l3-3"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
);

const CartIcon = ({ size = 18 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="9" cy="21" r="1"/>
    <circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);

const CopyIcon = ({ size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

const CheckIcon = ({ size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const PLACEHOLDER_IMAGE = '/images/placeholder-car.jpg';

// Performance Metric Row with bar visualization
function MetricRow({ icon: IconComponent, label, stockValue, upgradedValue, unit, improvementPrefix = '+', isLowerBetter = false }) {
  const hasImproved = isLowerBetter 
    ? upgradedValue < stockValue 
    : upgradedValue > stockValue;
  const improvementVal = Math.abs(upgradedValue - stockValue);
  
  const formatValue = (val) => {
    if (val === null || val === undefined) return '-';
    if (unit === 's' || unit === 'g') return val.toFixed(1);
    if (unit === 'ft') return Math.round(val);
    return Math.round(val).toLocaleString();
  };
  
  const maxValues = { hp: 1200, s: 8, ft: 150, g: 1.6 };
  const maxValue = maxValues[unit.trim()] || maxValues.hp;
  
  const stockPercent = isLowerBetter 
    ? ((maxValue - stockValue) / maxValue) * 100 
    : (stockValue / maxValue) * 100;
  const upgradedPercent = isLowerBetter 
    ? ((maxValue - upgradedValue) / maxValue) * 100 
    : (upgradedValue / maxValue) * 100;

  return (
    <div className={styles.metricRow}>
      <div className={styles.metricHeader}>
        <div className={styles.metricLabel}>
          <IconComponent size={12} />
          {label}
        </div>
        <div className={styles.metricValues}>
          {hasImproved ? (
            <>
              <span className={styles.stockValue}>{formatValue(stockValue)}</span>
              <span className={styles.metricArrow}>→</span>
              <span className={styles.upgradedValue}>{formatValue(upgradedValue)}{unit}</span>
              <span className={styles.metricDelta}>
                {improvementPrefix}{formatValue(improvementVal)}
              </span>
            </>
          ) : (
            <span className={styles.currentValue}>{formatValue(stockValue)}{unit}</span>
          )}
        </div>
      </div>
      <div className={styles.metricTrack}>
        <div className={styles.metricFillStock} style={{ width: `${Math.min(100, stockPercent)}%` }} />
        {hasImproved && upgradedPercent > stockPercent && (
          <div 
            className={styles.metricFillUpgrade}
            style={{ 
              left: `${Math.min(100, stockPercent)}%`,
              width: `${Math.min(100 - stockPercent, upgradedPercent - stockPercent)}%` 
            }}
          />
        )}
      </div>
    </div>
  );
}

// Experience Score Bar
function ScoreBar({ label, stockScore, upgradedScore }) {
  const safeStock = stockScore ?? 7;
  const safeUpgraded = upgradedScore ?? safeStock;
  const hasImproved = safeUpgraded > safeStock;
  const delta = safeUpgraded - safeStock;
  
  return (
    <div className={styles.scoreRow}>
      <div className={styles.scoreHeader}>
        <span className={styles.scoreLabel}>{label}</span>
        <span className={styles.scoreValues}>
          {hasImproved ? (
            <>
              <span className={styles.stockVal}>{safeStock.toFixed(1)}</span>
              <span className={styles.arrow}>→</span>
              <span className={styles.upgradedVal}>{safeUpgraded.toFixed(1)}</span>
            </>
          ) : (
            <span className={styles.currentVal}>{safeStock.toFixed(1)}/10</span>
          )}
        </span>
      </div>
      <div className={styles.track}>
        <div className={styles.fillStock} style={{ width: `${(safeStock / 10) * 100}%` }} />
        {hasImproved && (
          <div className={styles.fillUpgrade} style={{ left: `${(safeStock / 10) * 100}%`, width: `${(delta / 10) * 100}%` }} />
        )}
      </div>
    </div>
  );
}

// Calculate performance improvements from upgrades
function calculatePerformanceImprovements(carData, selectedUpgrades) {
  let totalHpGain = 0;
  let totalZeroToSixtyImprovement = 0;
  let totalBrakingImprovement = 0;
  let totalLateralGImprovement = 0;
  
  for (const upgrade of selectedUpgrades) {
    if (upgrade.metricChanges) {
      totalHpGain += upgrade.metricChanges.hpGain || 0;
      totalZeroToSixtyImprovement += upgrade.metricChanges.zeroToSixtyImprovement || 0;
      totalBrakingImprovement += upgrade.metricChanges.brakingImprovement || 0;
      totalLateralGImprovement += upgrade.metricChanges.lateralGImprovement || 0;
    }
  }
  
  return {
    hp: (carData.hp || 0) + totalHpGain,
    zeroToSixty: carData.zero_to_sixty ? Math.max(2.0, carData.zero_to_sixty - totalZeroToSixtyImprovement) : null,
    braking60To0: carData.braking_60_0 ? Math.max(70, carData.braking_60_0 - totalBrakingImprovement) : null,
    lateralG: carData.lateral_g ? Math.min(1.6, parseFloat(carData.lateral_g) + totalLateralGImprovement) : null,
  };
}

export default function BuildDetailSheet({ 
  build, 
  images = [], 
  currentImageIndex = 0,
  onImageSelect,
  onClose 
}) {
  const [carData, setCarData] = useState(null);
  const [buildData, setBuildData] = useState(null);
  const [partsData, setPartsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Fetch full build details
  useEffect(() => {
    async function fetchBuildDetails() {
      if (!build?.slug) return;
      
      setIsLoading(true);
      try {
        // Fetch full build data from the detail API
        const res = await fetch(`/api/community/builds/${build.slug}`);
        if (res.ok) {
          const data = await res.json();
          setBuildData(data.buildData);
          setCarData(data.carData);
          setPartsData(data.parts || []);
        }
      } catch (err) {
        console.error('Failed to fetch build details:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchBuildDetails();
  }, [build?.slug]);

  // Parse selected upgrades
  const selectedUpgrades = useMemo(() => {
    if (!buildData?.selected_upgrades) return [];
    
    const upgradeKeys = Array.isArray(buildData.selected_upgrades)
      ? buildData.selected_upgrades
      : buildData.selected_upgrades?.upgrades || [];
    
    return upgradeKeys
      .map(key => typeof key === 'string' ? getUpgradeByKey(key) : key)
      .filter(Boolean);
  }, [buildData]);

  // Calculate performance metrics
  const performanceMetrics = useMemo(() => {
    if (!carData?.hp || selectedUpgrades.length === 0) return null;
    return calculatePerformanceImprovements(carData, selectedUpgrades);
  }, [carData, selectedUpgrades]);

  // Calculate experience scores
  const { stockScores, upgradedScores } = useMemo(() => {
    if (!carData) return { stockScores: {}, upgradedScores: {} };
    
    const stock = mapCarToPerformanceScores(carData);
    
    if (selectedUpgrades.length === 0) {
      return { stockScores: stock, upgradedScores: stock };
    }
    
    const upgraded = applyUpgradeDeltas(stock, selectedUpgrades);
    return { stockScores: stock, upgradedScores: upgraded };
  }, [carData, selectedUpgrades]);

  // Format mod name for display
  const formatModName = (mod) => {
    if (typeof mod === 'object') return mod.name || 'Mod';
    return mod.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Format cost
  const formatCost = (low, high) => {
    if (!low && !high) return null;
    const fmt = (n) => n >= 1000 ? `$${(n/1000).toFixed(0)}k` : `$${n}`;
    if (low && high && low !== high) return `${fmt(low)} - ${fmt(high)}`;
    return fmt(low || high);
  };

  // Total cost for display
  const totalCost = useMemo(() => {
    if (buildData?.total_cost_low || buildData?.total_cost_high) {
      return (buildData.total_cost_low + buildData.total_cost_high) / 2;
    }
    return 0;
  }, [buildData]);

  // Copy parts list
  const copyPartsList = async () => {
    const modsList = selectedUpgrades.map(u => u.name || formatModName(u.key)).join('\n');
    const partsList = partsData.map(p => `${p.brand_name || ''} ${p.product_name || p.mod_type}`).join('\n');
    const fullList = [modsList, partsList].filter(Boolean).join('\n');
    
    try {
      await navigator.clipboard.writeText(fullList || 'No parts specified');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!build) return null;

  const stockHp = carData?.hp || build.build_data?.stock_hp;
  const finalHp = buildData?.total_hp_gain 
    ? stockHp + buildData.total_hp_gain 
    : build.build_data?.final_hp;
  const hpGain = buildData?.total_hp_gain || build.build_data?.hp_gain;

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.sheet}>
        <div className={styles.sheetHandle} />
        <button className={styles.closeBtn} onClick={onClose}>
          <XIcon />
        </button>
        
        <div className={styles.sheetContent}>
          {/* Header */}
          <div className={styles.sheetHeader}>
            <div className={styles.sheetAvatar}>
              {build.author?.avatar_url ? (
                <Image src={build.author.avatar_url} alt="" width={44} height={44} />
              ) : (
                <span>{build.author?.display_name?.charAt(0) || 'A'}</span>
              )}
            </div>
            <div>
              <div className={styles.sheetUsername}>{build.author?.display_name}</div>
              <div className={styles.sheetCar}>{build.car_name}</div>
            </div>
          </div>
          
          <h3 className={styles.sheetTitle}>{build.title}</h3>
          
          {build.description && (
            <p className={styles.sheetDesc}>{build.description}</p>
          )}
          
          {/* Performance Metrics Section */}
          {(performanceMetrics || stockHp) && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h4 className={styles.sectionTitle}>
                  <BoltIcon size={16} />
                  Performance Metrics
                </h4>
                {totalCost > 0 && (
                  <span className={styles.costBadge}>${totalCost.toLocaleString()}</span>
                )}
              </div>
              
              <div className={styles.metricsGrid}>
                {/* HP */}
                <MetricRow
                  icon={BoltIcon}
                  label="HP"
                  stockValue={stockHp || carData?.hp || 300}
                  upgradedValue={finalHp || performanceMetrics?.hp || stockHp || 300}
                  unit=" hp"
                  improvementPrefix="+"
                  isLowerBetter={false}
                />
                
                {/* 0-60 */}
                {(carData?.zero_to_sixty || performanceMetrics?.zeroToSixty) && (
                  <MetricRow
                    icon={StopwatchIcon}
                    label="0-60"
                    stockValue={carData?.zero_to_sixty || 5.0}
                    upgradedValue={performanceMetrics?.zeroToSixty || carData?.zero_to_sixty || 5.0}
                    unit="s"
                    improvementPrefix="-"
                    isLowerBetter={true}
                  />
                )}
                
                {/* Braking */}
                {(carData?.braking_60_0 || performanceMetrics?.braking60To0) && (
                  <MetricRow
                    icon={BrakeIcon}
                    label="BRAKING"
                    stockValue={carData?.braking_60_0 || 110}
                    upgradedValue={performanceMetrics?.braking60To0 || carData?.braking_60_0 || 110}
                    unit="ft"
                    improvementPrefix="-"
                    isLowerBetter={true}
                  />
                )}
                
                {/* Grip */}
                {(carData?.lateral_g || performanceMetrics?.lateralG) && (
                  <MetricRow
                    icon={GaugeIcon}
                    label="GRIP"
                    stockValue={parseFloat(carData?.lateral_g) || 1.0}
                    upgradedValue={performanceMetrics?.lateralG || parseFloat(carData?.lateral_g) || 1.0}
                    unit="g"
                    improvementPrefix="+"
                    isLowerBetter={false}
                  />
                )}
              </div>
            </div>
          )}
          
          {/* Experience Scores Section */}
          {carData && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitleSimple}>Experience Scores</h4>
              <ScoreBar 
                label="Comfort" 
                stockScore={stockScores?.drivability ?? 7} 
                upgradedScore={upgradedScores?.drivability ?? 7} 
              />
              <ScoreBar 
                label="Reliability" 
                stockScore={stockScores?.reliabilityHeat ?? 7.5} 
                upgradedScore={upgradedScores?.reliabilityHeat ?? 7.5} 
              />
              <ScoreBar 
                label="Sound" 
                stockScore={stockScores?.soundEmotion ?? 8} 
                upgradedScore={upgradedScores?.soundEmotion ?? 8} 
              />
            </div>
          )}
          
          {/* Parts Shopping List Section */}
          {(selectedUpgrades.length > 0 || partsData.length > 0) && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h4 className={styles.sectionTitle}>
                  <CartIcon size={16} />
                  Parts Shopping List
                </h4>
                <span className={styles.partsCount}>
                  {partsData.length}/{selectedUpgrades.length + partsData.length} specified
                </span>
              </div>
              
              <button className={styles.copyBtn} onClick={copyPartsList}>
                {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
                {copied ? 'Copied!' : 'Copy List'}
              </button>
            </div>
          )}
          
          {/* Mods List */}
          {selectedUpgrades.length > 0 && (
            <div className={styles.modsSection}>
              <div className={styles.sectionLabel}>Modifications</div>
              <div className={styles.modsList}>
                {selectedUpgrades.map((upgrade, i) => (
                  <span key={i} className={styles.modChip}>
                    {upgrade.name || formatModName(upgrade.key)}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Legacy mods display (from build_data.mods) */}
          {!selectedUpgrades.length && build.build_data?.mods?.length > 0 && (
            <div className={styles.modsSection}>
              <div className={styles.sectionLabel}>Modifications</div>
              <div className={styles.modsList}>
                {build.build_data.mods.map((mod, i) => (
                  <span key={i} className={styles.modChip}>{formatModName(mod)}</span>
                ))}
              </div>
            </div>
          )}
          
          {/* Photos */}
          {images.length > 1 && (
            <div className={styles.photosSection}>
              <div className={styles.sectionLabel}>Photos ({images.length})</div>
              <div className={styles.photoGrid}>
                {images.map((img, idx) => (
                  <button 
                    key={img.id || idx} 
                    className={`${styles.photoThumb} ${idx === currentImageIndex ? styles.photoActive : ''}`} 
                    onClick={() => {
                      onImageSelect?.(idx);
                      onClose();
                    }}
                  >
                    <Image 
                      src={img.thumbnail_url || img.blob_url || PLACEHOLDER_IMAGE} 
                      alt="" 
                      fill 
                      sizes="80px" 
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* CTA */}
          <Link href={`/community/builds/${build.slug}`} className={styles.viewBtn}>
            View Full Build
          </Link>
        </div>
      </div>
    </>
  );
}
