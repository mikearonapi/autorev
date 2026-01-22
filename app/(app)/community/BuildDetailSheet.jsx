'use client';

/**
 * Full-Screen Build Detail View
 * 
 * Clean, focused view showing:
 * - User header with share button
 * - Performance Metrics
 * - Modifications/Parts list
 */

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { getUpgradeByKey } from '@/lib/upgrades';
import { mapCarToPerformanceScores } from '@/data/performanceCategories';
import { applyUpgradeDeltas } from '@/lib/performance';
import { useBuildDetail } from '@/hooks/useCommunityData';
import { TITLES } from '@/app/(app)/dashboard/components/UserGreeting';
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
  // React Query hook for build details
  const { data: detailData, isLoading } = useBuildDetail(build?.slug);
  
  // Extract data from query response
  const buildData = detailData?.buildData || null;
  const carData = detailData?.carData || null;
  const partsData = detailData?.parts || [];

  // Get upgrade keys for display (mods list)
  const allMods = useMemo(() => {
    if (!buildData?.selected_upgrades) {
      if (build?.build_data?.mods?.length > 0) {
        return build.build_data.mods.map(mod => ({
          key: mod,
          name: mod.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        }));
      }
      return [];
    }
    
    const upgradeKeys = Array.isArray(buildData.selected_upgrades)
      ? buildData.selected_upgrades
      : buildData.selected_upgrades?.upgrades || [];
    
    return upgradeKeys
      .map(key => {
        const upgrade = typeof key === 'string' ? getUpgradeByKey(key) : key;
        return upgrade || { key, name: key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) };
      })
      .filter(Boolean);
  }, [buildData, build]);

  // Format mod name
  const formatModName = (mod) => {
    if (typeof mod === 'object') return mod.name || 'Mod';
    return mod.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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

  if (!build) return null;

  // Use STORED performance metrics from buildData - single source of truth
  // These are the exact values the user saw when they saved their build
  // Fall back to carData (stock values) only if build metrics aren't stored
  const stockHp = buildData?.stock_hp || carData?.hp || build.car_specs?.hp || 0;
  const finalHp = buildData?.final_hp || (buildData?.total_hp_gain ? stockHp + buildData.total_hp_gain : stockHp);
  
  // Use stored values - no recalculation, just display what was saved
  const stockZeroToSixty = buildData?.stock_zero_to_sixty || carData?.zero_to_sixty || null;
  const finalZeroToSixty = buildData?.final_zero_to_sixty || stockZeroToSixty; // If no final stored, show stock
  
  const stockBraking = buildData?.stock_braking_60_0 || carData?.braking_60_0 || null;
  const finalBraking = buildData?.final_braking_60_0 || stockBraking;
  
  const stockLateralG = buildData?.stock_lateral_g || carData?.lateral_g || null;
  const finalLateralG = buildData?.final_lateral_g || stockLateralG;

  // DEBUG: Log values to identify why improvements aren't showing
  console.log('[BuildDetailSheet DEBUG]', {
    buildDataExists: !!buildData,
    buildData_final_zero_to_sixty: buildData?.final_zero_to_sixty,
    buildData_stock_zero_to_sixty: buildData?.stock_zero_to_sixty,
    stockZeroToSixty,
    finalZeroToSixty,
    hasImprovement_060: finalZeroToSixty < stockZeroToSixty,
    stockBraking,
    finalBraking,
    stockLateralG,
    finalLateralG,
  });

  return (
    <div className={styles.fullScreen}>
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
}
