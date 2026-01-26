'use client';

/* eslint-disable react-hooks/rules-of-hooks */
/**
 * Full-Screen Build Detail View
 * 
 * Clean, focused view showing:
 * - User header with share button
 * - Performance Metrics
 * - Modifications/Parts list
 * 
 * Rendered via React Portal to document.body for proper stacking context.
 * 
 * Note: ESLint rule disabled due to false positive - all hooks are called unconditionally
 * before any early returns. The rule incorrectly flags useMemo as conditional.
 */

import { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

import Image from 'next/image';

import { TITLES } from '@/app/(app)/dashboard/components/UserGreeting';
import { useBuildDetail } from '@/hooks/useCommunityData';
import { useSafeAreaColor, SAFE_AREA_COLORS } from '@/hooks/useSafeAreaColor';
import { getUpgradeByKey } from '@/lib/upgrades';

import styles from './BuildDetailSheet.module.css';


// Icons
const BackIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
);

const ShareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
    <polyline points="16 6 12 2 8 6"/>
    <line x1="12" y1="2" x2="12" y2="15"/>
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
          <IconComponent size={14} />
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

// NOTE: Performance metrics are now stored in user_projects when the build is saved.
// We no longer recalculate here - we use the exact values the user saw when they saved.
// This ensures consistency between what the user sees and what's shared to community.

export default function BuildDetailSheet({ 
  build, 
  images = [], 
  currentImageIndex = 0,
  onImageSelect,
  onClose 
}) {
  // Set safe area color to match overlay background when sheet is visible
  useSafeAreaColor(SAFE_AREA_COLORS.OVERLAY, { enabled: !!build });
  
  // Portal mounting - required for SSR compatibility
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // React Query hook for build details - always called (hooks must be unconditional)
  const { data: detailData, isLoading } = useBuildDetail(build?.slug);
  
  // Extract data from query response
  const buildData = detailData?.buildData || null;
  const carData = detailData?.carData || null;
  // NOTE: partsData and vehicleData available for future parts display enhancement
  const _partsData = detailData?.parts || [];
  const computedPerformance = detailData?.computedPerformance || null;
  const _vehicleData = detailData?.vehicleData || null;
  // Build status removed - was causing inconsistency between list and detail views

  // Get upgrade keys for display (mods list)
  // SOURCE OF TRUTH: Use computedPerformance.upgradeKeys (from vehicle's installed_modifications)
  // Fallback to buildData.selected_upgrades for other users' builds
  const allMods = useMemo(() => {
    // Helper to format upgrade key to display name (e.g., "stage1-tune" -> "Stage1 Tune")
    const formatKey = (key) => {
      if (!key || typeof key !== 'string') return 'Mod';
      return key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };
    
    // SOURCE OF TRUTH: Use upgradeKeys from computedPerformance (current vehicle mods)
    // This is the same data source used for HP calculation
    let upgradeKeys = [];
    if (computedPerformance?.upgradeKeys?.length > 0) {
      upgradeKeys = computedPerformance.upgradeKeys;
    } else if (buildData?.selected_upgrades) {
      // Fallback: Use stored selected_upgrades from the build snapshot
      upgradeKeys = Array.isArray(buildData.selected_upgrades)
        ? buildData.selected_upgrades
        : buildData.selected_upgrades?.upgrades || [];
    }
    
    if (upgradeKeys.length === 0) {
      return [];
    }
    
    return upgradeKeys
      .filter(key => key != null) // Filter out null/undefined entries
      .map(key => {
        // Case 1: key is already a full upgrade object (e.g., {key: "intake", name: "Cold Air Intake"})
        if (typeof key === 'object' && key !== null) {
          return {
            key: key.key || key.slug || 'mod',
            name: key.name || formatKey(key.key || key.slug || 'Mod')
          };
        }
        
        // Case 2: key is a string (e.g., "intake")
        if (typeof key === 'string') {
          const upgrade = getUpgradeByKey(key);
          return upgrade || { key, name: formatKey(key) };
        }
        
        // Fallback for unexpected types
        return null;
      })
      .filter(Boolean);
  }, [computedPerformance, buildData]);

  // Format mod name for display (used in render)
  const formatModName = (mod) => {
    if (!mod) return 'Mod';
    if (typeof mod === 'object') {
      if (mod.name) return mod.name;
      if (mod.key && typeof mod.key === 'string') {
        return mod.key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
      return 'Mod';
    }
    if (typeof mod === 'string') {
      return mod.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    return 'Mod';
  };

  // Share build
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/community/builds/${build.slug}`;
    const shareData = {
      title: `${build.title} - ${build.car_name}`,
      text: `Check out this ${build.car_name} build on AutoRev!`,
      url: shareUrl,
    };
    
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  if (!build || !isMounted) return null;

  // SOURCE OF TRUTH: Use computed performance from API when available.
  // Stored buildData final_* fields can become stale as our model improves.
  const stockHp = computedPerformance?.stock?.hp ?? buildData?.stock_hp ?? carData?.hp ?? build.car_specs?.hp ?? 0;
  const finalHp = computedPerformance?.upgraded?.hp ?? buildData?.final_hp ?? stockHp;
  // NOTE: hpGain available for future HP gain badge display
  const _hpGain = computedPerformance?.hpGain ?? (buildData?.total_hp_gain || 0);
  
  const stockZeroToSixty = computedPerformance?.stock?.zeroToSixty ?? buildData?.stock_zero_to_sixty ?? carData?.zero_to_sixty ?? null;
  const finalZeroToSixty = computedPerformance?.upgraded?.zeroToSixty ?? buildData?.final_zero_to_sixty ?? stockZeroToSixty;
  
  const stockBraking = computedPerformance?.stock?.braking60To0 ?? buildData?.stock_braking_60_0 ?? carData?.braking_60_0 ?? null;
  const finalBraking = computedPerformance?.upgraded?.braking60To0 ?? buildData?.final_braking_60_0 ?? stockBraking;
  
  const stockLateralG = computedPerformance?.stock?.lateralG ?? buildData?.stock_lateral_g ?? carData?.lateral_g ?? null;
  const finalLateralG = computedPerformance?.upgraded?.lateralG ?? buildData?.final_lateral_g ?? stockLateralG;

  const sheetContent = (
    <div className={styles.fullScreen} data-overlay-modal>
      {/* Top Navigation with User Info */}
      <div className={styles.topNav}>
        <button className={styles.backBtn} onClick={onClose}>
          <BackIcon />
        </button>
        
        <div className={styles.userInfo}>
          <div className={styles.userAvatar}>
            {build.author?.avatar_url ? (
              <Image src={build.author.avatar_url} alt="" width={36} height={36} />
            ) : (
              <span>{build.author?.display_name?.charAt(0) || 'A'}</span>
            )}
          </div>
          <div className={styles.userDetails}>
            <div className={styles.userNameRow}>
              <span className={styles.userName}>{build.author?.display_name}</span>
              {build.author?.selected_title && TITLES[build.author.selected_title] && (
                <span 
                  className={styles.userTitle}
                  style={{ color: TITLES[build.author.selected_title].color }}
                >
                  {TITLES[build.author.selected_title].display}
                </span>
              )}
            </div>
            <span className={styles.buildName}>{build.title}</span>
          </div>
        </div>
        
        <button className={styles.shareBtn} onClick={handleShare}>
          <ShareIcon />
        </button>
      </div>
      
      {/* Car Name Header */}
      <div className={styles.carHeader}>
        <h1 className={styles.carName}>{build.car_name}</h1>
      </div>
      
      {/* Content */}
      <div className={styles.content}>
        {isLoading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <span>Loading build details...</span>
          </div>
        ) : (
          <>
            {/* Performance Metrics Section */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>PERFORMANCE METRICS</h2>
              
              <div className={styles.metricsGrid}>
                {/* HP - Always show */}
                <MetricRow
                  icon={BoltIcon}
                  label="HP"
                  stockValue={stockHp}
                  upgradedValue={finalHp}
                  unit=" hp"
                  improvementPrefix="+"
                  isLowerBetter={false}
                />
                
                {/* 0-60 - Use stored values from buildData (single source of truth) */}
                <MetricRow
                  icon={StopwatchIcon}
                  label="0-60"
                  stockValue={parseFloat(stockZeroToSixty || 5.0)}
                  upgradedValue={parseFloat(finalZeroToSixty || stockZeroToSixty || 5.0)}
                  unit="s"
                  improvementPrefix="-"
                  isLowerBetter={true}
                />
                
                {/* Braking - Use stored values from buildData */}
                <MetricRow
                  icon={BrakeIcon}
                  label="BRAKING"
                  stockValue={stockBraking}
                  upgradedValue={finalBraking}
                  unit="ft"
                  improvementPrefix="-"
                  isLowerBetter={true}
                />
                
                {/* Grip - Use stored values from buildData */}
                <MetricRow
                  icon={GaugeIcon}
                  label="GRIP"
                  stockValue={parseFloat(stockLateralG)}
                  upgradedValue={parseFloat(finalLateralG)}
                  unit="g"
                  improvementPrefix="+"
                  isLowerBetter={false}
                />
              </div>
            </div>
            
            {/* Modifications List - Compact chips */}
            {allMods.length > 0 && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>MODIFICATIONS</h2>
                
                <div className={styles.modsList}>
                  {allMods.map((mod, i) => (
                    <span key={i} className={styles.modChip}>
                      {mod.name || formatModName(mod.key || mod)}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Photos */}
            {images.length > 1 && (
              <div className={styles.photosSection}>
                <h2 className={styles.sectionTitle}>PHOTOS</h2>
                <div className={styles.photoGrid}>
                  {images.map((img, idx) => (
                    <button 
                      key={img.id || idx} 
                      className={`${styles.photoThumb} ${idx === currentImageIndex ? styles.photoActive : ''}`} 
                      onClick={() => onImageSelect?.(idx)}
                    >
                      <Image 
                        src={img.thumbnail_url || img.blob_url} 
                        alt="" 
                        fill 
                        sizes="80px"
                        style={{ objectFit: 'cover' }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  // Use portal to render at document body level
  return createPortal(sheetContent, document.body);
}
