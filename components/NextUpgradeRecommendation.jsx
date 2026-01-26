'use client';

/**
 * Next Upgrade Recommendation - Suggests logical next upgrades based on current build
 * 
 * EXTREMELY VALUABLE: Users see what modifications make sense next,
 * with context about why and estimated costs. Helps users make informed
 * decisions rather than just adding random parts.
 */

import React, { useMemo } from 'react';

import Link from 'next/link';

import styles from './NextUpgradeRecommendation.module.css';
import InsightFeedback from './ui/InsightFeedback';

// Icons
const CompassIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
  </svg>
);

const ArrowRightIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

const ZapIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

const ShieldIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const DollarIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);

const AlertIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 8v4"/>
    <path d="M12 16h.01"/>
  </svg>
);

// Upgrade recommendation logic - prioritized mod paths
const UPGRADE_PATHS = [
  // Stage 1 basics (in order of importance)
  {
    id: 'tune',
    keys: ['tune', 'tune-stage-1', 'tune-stage-2', 'tune-e85', 'tune-track', 'ecu'],
    name: 'ECU Tune',
    description: 'The single highest-impact mod for most cars. Unlocks power hidden in the factory map.',
    cost: { low: 400, high: 900 },
    hpGain: { low: 15, high: 60 },
    requires: [],
    category: 'power',
    priority: 100,
  },
  {
    id: 'intake',
    keys: ['intake', 'cold-air-intake', 'cai'],
    name: 'Cold Air Intake',
    description: 'Improves airflow and adds induction sound. Best paired with a tune.',
    cost: { low: 200, high: 500 },
    hpGain: { low: 5, high: 20 },
    requires: [],
    category: 'power',
    priority: 90,
  },
  {
    id: 'exhaust',
    keys: ['exhaust-catback', 'exhaust-axleback', 'catback', 'axleback'],
    name: 'Cat-Back Exhaust',
    description: 'Frees up exhaust flow and gives your car a proper voice.',
    cost: { low: 500, high: 1500 },
    hpGain: { low: 5, high: 15 },
    requires: [],
    category: 'power',
    priority: 85,
  },
  
  // Stage 1.5 - Turbo cars
  {
    id: 'downpipe',
    keys: ['downpipe', 'dp', 'downpipes'],
    name: 'Downpipe',
    description: 'Major restriction on turbo cars. Can unlock significant power with a tune.',
    cost: { low: 400, high: 1000 },
    hpGain: { low: 20, high: 50 },
    requires: ['tune'],
    category: 'power',
    forTurbo: true,
    priority: 88,
  },
  {
    id: 'intercooler',
    keys: ['intercooler', 'intercooler-fmic', 'fmic'],
    name: 'Front-Mount Intercooler',
    description: 'Keeps intake temps down for consistent power. Essential for higher boost.',
    cost: { low: 500, high: 1500 },
    hpGain: { low: 0, high: 10 },
    requires: ['tune'],
    category: 'power',
    forTurbo: true,
    priority: 75,
    note: 'Maintains power on track rather than adding peak HP',
  },
  
  // Headers for NA cars
  {
    id: 'headers',
    keys: ['headers', 'header', 'long-tube-headers', 'shorty-headers'],
    name: 'Headers',
    description: 'Primary exhaust restriction on NA cars. Biggest power gain for naturally aspirated engines.',
    cost: { low: 800, high: 2000 },
    hpGain: { low: 15, high: 35 },
    requires: ['exhaust'],
    category: 'power',
    forNA: true,
    priority: 80,
  },
  
  // Suspension
  {
    id: 'coilovers',
    keys: ['coilovers', 'coilovers-street', 'coilovers-track'],
    name: 'Coilovers',
    description: 'Adjustable height and damping for improved handling and stance.',
    cost: { low: 1000, high: 3000 },
    hpGain: { low: 0, high: 0 },
    requires: [],
    category: 'handling',
    priority: 70,
    note: 'No HP gain but major handling improvement',
  },
  {
    id: 'sway-bars',
    keys: ['sway-bars', 'sway-bar-front', 'sway-bar-rear', 'swaybars'],
    name: 'Sway Bars',
    description: 'Reduces body roll and improves turn-in. Great value for handling.',
    cost: { low: 250, high: 600 },
    hpGain: { low: 0, high: 0 },
    requires: [],
    category: 'handling',
    priority: 65,
    note: 'No HP gain but noticeably sharper handling',
  },
  
  // Brakes
  {
    id: 'brake-pads',
    keys: ['brake-pads-track', 'brake-pads', 'track-pads'],
    name: 'Performance Brake Pads',
    description: 'Better stopping power and fade resistance. Essential before adding power.',
    cost: { low: 150, high: 400 },
    hpGain: { low: 0, high: 0 },
    requires: [],
    category: 'safety',
    priority: 60,
    note: 'No HP gain but critical for safety',
  },
  {
    id: 'big-brake-kit',
    keys: ['big-brake-kit', 'bbk', 'brake-upgrade'],
    name: 'Big Brake Kit',
    description: 'Serious stopping power for track use or high-power builds.',
    cost: { low: 1500, high: 4000 },
    hpGain: { low: 0, high: 0 },
    requires: ['brake-pads'],
    category: 'safety',
    priority: 40,
    note: 'Recommended for 400+ HP or track driving',
  },
  
  // Wheels/Tires
  {
    id: 'tires',
    keys: ['tires-track', 'tires-summer', 'tires-performance'],
    name: 'Performance Tires',
    description: 'The #1 mod for putting power down. Better rubber = more grip everywhere.',
    cost: { low: 400, high: 1200 },
    hpGain: { low: 0, high: 0 },
    requires: [],
    category: 'handling',
    priority: 95,
    note: 'Grip is everything—often more impactful than HP mods',
  },
  {
    id: 'wheels',
    keys: ['wheels-lightweight', 'wheels', 'forged-wheels'],
    name: 'Lightweight Wheels',
    description: 'Reduces unsprung weight for quicker acceleration and better handling.',
    cost: { low: 1500, high: 4000 },
    hpGain: { low: 0, high: 0 },
    requires: [],
    category: 'handling',
    priority: 50,
    note: 'Feels faster than it measures',
  },
  
  // Stage 2+
  {
    id: 'turbo-upgrade',
    keys: ['turbo-upgrade', 'bigger-turbo', 'hybrid-turbo'],
    name: 'Turbo Upgrade',
    description: 'Step up to more power with a larger or hybrid turbo. Requires supporting mods.',
    cost: { low: 2000, high: 5000 },
    hpGain: { low: 50, high: 150 },
    requires: ['tune', 'intercooler', 'downpipe'],
    category: 'power',
    forTurbo: true,
    priority: 30,
    note: 'Major power but also major investment',
  },
];

// Normalize key for matching
const normalizeKey = (key) => {
  if (!key) return '';
  return key.toLowerCase().replace(/[-_\s]+/g, '-').trim();
};

// Extended aliases for matching installed mods to upgrade recommendations
const UPGRADE_ALIASES = {
  'tune': ['tune', 'ecu', 'flash', 'piggyback', 'tuner', 'remap', 'chip', 'stage-1', 'stage-2', 'stage-3'],
  'intake': ['intake', 'cai', 'cold-air', 'air-filter', 'throttle-body'],
  'exhaust': ['exhaust', 'catback', 'cat-back', 'axle-back', 'muffler'],
  'downpipe': ['downpipe', 'dp', 'down-pipe', 'catless'],
  'intercooler': ['intercooler', 'fmic', 'ic', 'front-mount'],
  'headers': ['headers', 'header', 'long-tube', 'shorty', 'exhaust-manifold'],
  'coilovers': ['coilover', 'coilovers', 'suspension', 'lowering', 'springs'],
  'sway-bars': ['sway', 'sway-bar', 'anti-roll', 'stabilizer'],
  'brake-pads': ['brake-pad', 'track-pad', 'brake', 'pads'],
  'big-brake-kit': ['bbk', 'big-brake', 'brake-kit'],
  'tires': ['tire', 'tires', 'rubber'],
  'wheels': ['wheel', 'wheels', 'forged', 'rims'],
  'turbo-upgrade': ['turbo-upgrade', 'bigger-turbo', 'hybrid-turbo', 'turbo-kit', 'turbo'],
  'fuel': ['fuel', 'pump', 'injector', 'lpfp', 'hpfp'],
};

// Check if user has an upgrade installed
const hasUpgrade = (installedKeys, upgradeKeys) => {
  if (!installedKeys || installedKeys.length === 0) return false;
  if (!upgradeKeys || upgradeKeys.length === 0) return false;
  
  return installedKeys.some(installed => {
    const normInstalled = normalizeKey(installed);
    
    // Check direct match with upgrade keys
    const directMatch = upgradeKeys.some(key => {
      const normKey = normalizeKey(key);
      return normInstalled.includes(normKey) || normKey.includes(normInstalled);
    });
    
    if (directMatch) return true;
    
    // Check aliases
    for (const [category, aliases] of Object.entries(UPGRADE_ALIASES)) {
      const installedMatchesAlias = aliases.some(alias => normInstalled.includes(alias));
      const upgradeMatchesCategory = upgradeKeys.some(key => {
        const normKey = normalizeKey(key);
        return aliases.some(alias => normKey.includes(alias));
      });
      
      if (installedMatchesAlias && upgradeMatchesCategory) {
        return true;
      }
    }
    
    return false;
  });
};

// Check if prerequisites are met
const hasPrerequisites = (installedKeys, requires) => {
  if (!requires || requires.length === 0) return true;
  if (!installedKeys || installedKeys.length === 0) return false;
  
  return requires.every(reqId => {
    const reqUpgrade = UPGRADE_PATHS.find(u => u.id === reqId);
    if (!reqUpgrade) return true;
    return hasUpgrade(installedKeys, reqUpgrade.keys);
  });
};

export default function NextUpgradeRecommendation({ 
  installedUpgrades, 
  aspiration = 'NA',
  currentHp = 300,
  carSlug,
  vehicleId,
  onFeedback,
}) {
  const recommendations = useMemo(() => {
    const installedKeys = installedUpgrades
      .map(u => typeof u === 'string' ? u : u?.key)
      .filter(Boolean);
    
    const isTurbo = aspiration?.toLowerCase().includes('turbo') || 
                    aspiration?.toLowerCase().includes('supercharge') ||
                    aspiration?.toLowerCase() === 'forced';
    
    // Filter and score available upgrades
    const available = UPGRADE_PATHS
      .filter(upgrade => {
        // Already installed
        if (hasUpgrade(installedKeys, upgrade.keys)) return false;
        
        // Platform-specific
        if (upgrade.forTurbo && !isTurbo) return false;
        if (upgrade.forNA && isTurbo) return false;
        
        // Prerequisites met
        if (!hasPrerequisites(installedKeys, upgrade.requires)) return false;
        
        return true;
      })
      .map(upgrade => ({
        ...upgrade,
        // Adjust priority based on current build state
        adjustedPriority: upgrade.priority + (
          // Boost priority if prerequisites just completed
          upgrade.requires?.length > 0 && hasPrerequisites(installedKeys, upgrade.requires) ? 10 : 0
        ),
      }))
      .sort((a, b) => b.adjustedPriority - a.adjustedPriority)
      .slice(0, 3);
    
    return available;
  }, [installedUpgrades, aspiration]);

  // Build link for tuning shop with this upgrade
  const getBuildLink = (upgradeId) => {
    if (!carSlug) return '/garage?tab=build';
    return `/cars/${carSlug}/build${vehicleId ? `?vehicle=${vehicleId}` : ''}`;
  };

  if (recommendations.length === 0) {
    return (
      <div className={styles.nextUpgrade}>
        <div className={styles.header}>
          <CompassIcon size={18} />
          <span className={styles.headerTitle}>Next Steps</span>
          {onFeedback && (
            <InsightFeedback 
              insightType="next-upgrade"
              insightKey="next-upgrade-complete"
              insightTitle="Next Steps (Complete)"
              onFeedback={onFeedback}
              variant="inline"
            />
          )}
        </div>
        <div className={styles.completeState}>
          <div className={styles.completeIcon}>🎯</div>
          <p className={styles.completeText}>
            Your build is well-equipped for this power level!
          </p>
          <p className={styles.completeSubtext}>
            Consider track time to refine your setup, or consult a tuner for advanced builds.
          </p>
        </div>
      </div>
    );
  }

  const primaryRec = recommendations[0];
  const secondaryRecs = recommendations.slice(1);

  return (
    <div className={styles.nextUpgrade}>
      <div className={styles.header}>
        <CompassIcon size={18} />
        <span className={styles.headerTitle}>Recommended Next Upgrades</span>
        {onFeedback && (
          <InsightFeedback 
            insightType="next-upgrade"
            insightKey={`next-upgrade-${primaryRec.id}`}
            insightTitle={`Recommended: ${primaryRec.name}`}
            onFeedback={onFeedback}
            variant="inline"
          />
        )}
      </div>

      {/* Primary Recommendation */}
      <div className={styles.primaryRec}>
        <div className={styles.primaryHeader}>
          <span className={styles.primaryLabel}>Top Pick</span>
          <span className={styles.primaryCategory}>
            {primaryRec.category === 'power' && <ZapIcon size={12} />}
            {primaryRec.category === 'handling' && <CompassIcon size={12} />}
            {primaryRec.category === 'safety' && <ShieldIcon size={12} />}
            {primaryRec.category}
          </span>
        </div>
        
        <h4 className={styles.primaryName}>{primaryRec.name}</h4>
        <p className={styles.primaryDescription}>{primaryRec.description}</p>
        
        <div className={styles.primaryStats}>
          <div className={styles.stat}>
            <DollarIcon size={14} />
            <span>${primaryRec.cost.low.toLocaleString()} – ${primaryRec.cost.high.toLocaleString()}</span>
          </div>
          {primaryRec.hpGain.high > 0 && (
            <div className={styles.stat + ' ' + styles.hpStat}>
              <ZapIcon size={14} />
              <span>+{primaryRec.hpGain.low}–{primaryRec.hpGain.high} HP</span>
            </div>
          )}
        </div>
        
        {primaryRec.note && (
          <p className={styles.primaryNote}>
            <AlertIcon size={12} />
            {primaryRec.note}
          </p>
        )}

        <Link href={getBuildLink(primaryRec.id)} className={styles.addBtn}>
          Add to Build
          <ArrowRightIcon size={14} />
        </Link>
      </div>

      {/* Secondary Recommendations */}
      {secondaryRecs.length > 0 && (
        <div className={styles.secondaryRecs}>
          <div className={styles.secondaryHeader}>Also Consider</div>
          {secondaryRecs.map(rec => (
            <div key={rec.id} className={styles.secondaryRec}>
              <div className={styles.secondaryInfo}>
                <span className={styles.secondaryName}>{rec.name}</span>
                <span className={styles.secondaryCost}>
                  ${rec.cost.low.toLocaleString()}–${rec.cost.high.toLocaleString()}
                </span>
              </div>
              <div className={styles.secondaryMeta}>
                {rec.hpGain.high > 0 ? (
                  <span className={styles.secondaryHp}>+{rec.hpGain.low}–{rec.hpGain.high} HP</span>
                ) : (
                  <span className={styles.secondaryCategory}>{rec.category}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className={styles.disclaimer}>
        Recommendations based on typical build order. Your goals may differ.
      </p>
    </div>
  );
}
