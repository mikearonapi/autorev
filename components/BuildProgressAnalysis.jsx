'use client';

/**
 * Build Progress Analysis - Shows where you are in Stage 1/2/3 progression
 *
 * EXTREMELY VALUABLE: Users can see exactly what they've done,
 * what's left in their current stage, and what the next stage requires.
 * Includes cost estimates and HP gains for the path ahead.
 *
 * Stage definitions align with docs/UPGRADE-CATEGORY-LOGIC.md:
 * - Stage 1: Bolt-ons (intake, cat-back). Tune optional.
 * - Stage 2: Mods requiring tune (headers, downpipe, mild cams).
 * - Stage 3: Major power (forced induction, E85, nitrous). Upgraded fuel required.
 */

import React, { useMemo } from 'react';

import { generateStageProgressions } from '@/lib/stageProgressionGenerator';

import styles from './BuildProgressAnalysis.module.css';
import InfoTooltip from './ui/InfoTooltip';
import InsightFeedback from './ui/InsightFeedback';

// Icons
const RocketIcon = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </svg>
);

const CheckIcon = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const CircleIcon = ({ size = 14, filled = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10" />
  </svg>
);

const TargetIcon = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

// Normalize upgrade keys to match component naming
const normalizeUpgradeKey = (key) => {
  if (!key) return '';
  return key
    .toLowerCase()
    .replace(/[-_\s]+/g, '-')
    .trim();
};

// Mapping of component names to their possible mod key variations
const COMPONENT_ALIASES = {
  tune: ['tune', 'ecu', 'flash', 'piggyback', 'tuner', 'remap', 'chip'],
  intake: ['intake', 'cai', 'cold-air', 'air-filter'],
  exhaust: [
    'exhaust',
    'catback',
    'cat-back',
    'axle-back',
    'headers',
    'downpipe',
    'mid-pipe',
    'muffler',
  ],
  downpipe: ['downpipe', 'dp', 'catless', 'down-pipe'],
  headers: ['headers', 'header', 'exhaust-manifold', 'long-tube', 'shorty'],
  intercooler: ['intercooler', 'fmic', 'ic', 'charge-cooler'],
  turbo: ['turbo', 'turbo-upgrade', 'turbo-kit', 'turbocharger'],
  'bigger-turbo': ['turbo-kit', 'big-turbo', 'turbo-upgrade', 'hybrid-turbo'],
  supercharger: ['supercharger', 'sc', 'blower', 'roots', 'centrifugal'],
  'fuel-pump': ['fuel-pump', 'fuel', 'lpfp', 'hpfp', 'pump'],
  injectors: ['injectors', 'injector', 'fuel-injector'],
  coilovers: ['coilover', 'coilovers', 'suspension', 'lowering'],
  'sway-bar': ['sway', 'sway-bar', 'anti-roll', 'stabilizer'],
  brakes: ['brake', 'brakes', 'bbk', 'big-brake', 'pads', 'rotors'],
  clutch: ['clutch', 'flywheel', 'lsd'],
  'boost-controller': ['boost', 'boost-controller', 'mbc', 'ebc'],
  'air-intake': ['intake', 'cai', 'cold-air'],
  'cat-back-exhaust': ['catback', 'cat-back', 'exhaust'],
  fmic: ['fmic', 'intercooler', 'front-mount'],
  // Note: methanol-injection removed
  e85: ['e85', 'flex-fuel', 'ethanol'],
};

// Format a mod key into a readable display name
const formatModKeyForDisplay = (key) => {
  if (!key) return '';
  return key
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bExisting\b/i, '')
    .replace(/\bKit\b/i, 'Kit')
    .trim();
};

// Check if a mod key matches a component from stage progressions
const modMatchesComponent = (modKey, component) => {
  const normMod = normalizeUpgradeKey(modKey);
  const normComp = normalizeUpgradeKey(component);

  // Direct match
  if (normMod === normComp) return true;

  // Check if mod contains component name
  if (normMod.includes(normComp) || normComp.includes(normMod)) return true;

  // Check aliases for this component
  const aliases = COMPONENT_ALIASES[normComp];
  if (aliases) {
    for (const alias of aliases) {
      if (normMod.includes(alias) || alias.includes(normMod)) {
        return true;
      }
    }
  }

  // Reverse check - see if any alias set contains both
  for (const [category, categoryAliases] of Object.entries(COMPONENT_ALIASES)) {
    const modMatches = categoryAliases.some((a) => normMod.includes(a));
    const compMatches =
      categoryAliases.some((a) => normComp.includes(a)) || normComp.includes(category);
    if (modMatches && compMatches) {
      return true;
    }
  }

  return false;
};

export default function BuildProgressAnalysis({
  stageProgressions: propStageProgressions,
  installedUpgrades,
  stockHp,
  currentHp: _currentHp,
  carName = null,
  carSlug = null,
  car = null,
  carLayout = null,
  tuningProfile = null,
  onFeedback,
}) {
  // Generate canonical stage progressions when car data is available
  // This ensures alignment with docs/UPGRADE-CATEGORY-LOGIC.md Stage 1/2/3 definitions
  const stageProgressions = useMemo(() => {
    // If we have car and layout, generate canonical stages
    if (car && carLayout) {
      return generateStageProgressions(car, carLayout, { tuningProfile });
    }
    // Fall back to provided stage progressions (from tuning profile)
    return propStageProgressions || [];
  }, [car, carLayout, tuningProfile, propStageProgressions]);

  // Analyze build progress across all stages
  const analysis = useMemo(() => {
    if (!stageProgressions || stageProgressions.length === 0) {
      return null;
    }

    // Normalize installed upgrades to strings
    const installedKeys = installedUpgrades
      .map((u) => (typeof u === 'string' ? u : u?.key))
      .filter(Boolean);

    // Collect all stage components to find mods beyond stages
    const allStageComponents = new Set();
    stageProgressions.forEach((stage) => {
      (stage.components || []).forEach((comp) => allStageComponents.add(comp));
    });

    // Track which installed mods matched any stage component
    const matchedMods = new Set();

    // Analyze each stage
    const stages = stageProgressions.map((stage, idx) => {
      const components = stage.components || [];
      // Use componentKeys for matching if available (from canonical generator)
      const componentKeys = stage.componentKeys || [];

      const completedComponents = components.filter((comp, compIdx) => {
        // If we have componentKeys, use the corresponding key for matching
        const keyToMatch = componentKeys[compIdx] || comp;
        const matched = installedKeys.some((mod) => {
          const matches = modMatchesComponent(mod, keyToMatch) || modMatchesComponent(mod, comp);
          if (matches) matchedMods.add(mod);
          return matches;
        });
        return matched;
      });
      const remainingComponents = components.filter((comp, compIdx) => {
        const keyToMatch = componentKeys[compIdx] || comp;
        return !installedKeys.some(
          (mod) => modMatchesComponent(mod, keyToMatch) || modMatchesComponent(mod, comp)
        );
      });

      const progress =
        components.length > 0
          ? Math.round((completedComponents.length / components.length) * 100)
          : 0;

      return {
        stage: stage.stage || `Stage ${idx + 1}`,
        notes: stage.notes,
        components,
        completedComponents,
        remainingComponents,
        progress,
        isComplete: progress === 100,
        // Handle both camelCase (from generator/templates) and snake_case (from DB)
        costLow: stage.costLow || stage.cost_low || 0,
        costHigh: stage.costHigh || stage.cost_high || 0,
        hpGainLow: stage.hpGainLow || stage.hp_gain_low || 0,
        hpGainHigh: stage.hpGainHigh || stage.hp_gain_high || 0,
      };
    });

    // Find mods that don't match any stage component (beyond standard stages)
    const beyondStageMods = installedKeys.filter((mod) => !matchedMods.has(mod));

    // Determine current stage
    let currentStageIdx = 0;
    for (let i = 0; i < stages.length; i++) {
      if (stages[i].progress > 0 && !stages[i].isComplete) {
        currentStageIdx = i;
        break;
      }
      if (stages[i].isComplete) {
        currentStageIdx = Math.min(i + 1, stages.length - 1);
      }
    }

    // Calculate remaining investment to complete current stage
    const currentStage = stages[currentStageIdx];
    const remainingInCurrentStage = currentStage?.remainingComponents?.length || 0;
    const percentRemainingInStage = currentStage?.components?.length
      ? remainingInCurrentStage / currentStage.components.length
      : 0;

    // Estimate remaining cost (proportional to remaining components)
    const estimatedRemainingCost = {
      low: Math.round((currentStage?.costLow || 0) * percentRemainingInStage),
      high: Math.round((currentStage?.costHigh || 0) * percentRemainingInStage),
    };

    // Calculate total potential HP at each stage
    let cumulativeHp = stockHp;
    const hpAtStage = stages.map((stage) => {
      const avgGain = (stage.hpGainLow + stage.hpGainHigh) / 2;
      cumulativeHp += avgGain;
      return Math.round(cumulativeHp);
    });

    return {
      stages,
      currentStageIdx,
      currentStage: stages[currentStageIdx],
      estimatedRemainingCost,
      hpAtStage,
      totalStages: stages.length,
      allComplete: stages.every((s) => s.isComplete),
      beyondStageMods, // Mods that don't fit any stage component
      hasBeyondStageMods: beyondStageMods.length > 0,
    };
  }, [stageProgressions, installedUpgrades, stockHp]);

  if (!analysis) {
    return (
      <div className={styles.buildProgress}>
        <div className={styles.header}>
          <RocketIcon size={18} />
          <span className={styles.headerTitle}>Build Progression</span>
          {onFeedback && (
            <InsightFeedback
              insightType="build-progress"
              insightKey="build-progress-empty"
              insightTitle="Build Progression (Empty)"
              onFeedback={onFeedback}
              variant="inline"
            />
          )}
        </div>
        <div className={styles.noData}>
          <p>Stage progression data not available for this platform</p>
        </div>
      </div>
    );
  }

  const {
    stages,
    currentStageIdx,
    currentStage,
    estimatedRemainingCost,
    hpAtStage,
    allComplete,
    beyondStageMods,
    hasBeyondStageMods,
  } = analysis;

  return (
    <div className={styles.buildProgress}>
      <div className={styles.header}>
        <RocketIcon size={18} />
        <InfoTooltip topicKey="stageProgression" carName={carName} carSlug={carSlug}>
          <span className={styles.headerTitle}>Build Progression</span>
        </InfoTooltip>
        {allComplete && <span className={styles.maxedBadge}>Maxed Out!</span>}
        {onFeedback && (
          <InsightFeedback
            insightType="build-progress"
            insightKey="build-progress"
            insightTitle="Build Progression"
            onFeedback={onFeedback}
            variant="inline"
          />
        )}
      </div>

      {/* Visual Stage Progress */}
      <div className={styles.stageTrack}>
        {stages.map((stage, idx) => (
          <div
            key={idx}
            className={`${styles.stageNode} ${stage.isComplete ? styles.complete : ''} ${idx === currentStageIdx && !stage.isComplete ? styles.current : ''}`}
          >
            <div className={styles.stageNumber}>
              {stage.isComplete ? <CheckIcon size={12} /> : idx + 1}
            </div>
            <div className={styles.stageName}>{stage.stage}</div>
            {idx < stages.length - 1 && (
              <div
                className={`${styles.stageConnector} ${stage.isComplete ? styles.complete : ''}`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Current Stage Details */}
      {currentStage && !allComplete && (
        <div className={styles.currentStageCard}>
          <div className={styles.currentStageHeader}>
            <TargetIcon size={16} />
            <span className={styles.currentStageTitle}>{currentStage.stage}</span>
            <span className={styles.currentStageProgress}>{currentStage.progress}% Complete</span>
          </div>

          {currentStage.notes && <p className={styles.stageNotes}>{currentStage.notes}</p>}

          {/* Progress Bar */}
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${currentStage.progress}%` }} />
          </div>

          {/* Components Checklist */}
          <div className={styles.componentsList}>
            {currentStage.completedComponents.map((comp, idx) => (
              <div key={`done-${idx}`} className={`${styles.componentItem} ${styles.completed}`}>
                <CheckIcon size={12} />
                <span>{comp}</span>
              </div>
            ))}
            {currentStage.remainingComponents.map((comp, idx) => (
              <div key={`todo-${idx}`} className={`${styles.componentItem} ${styles.pending}`}>
                <CircleIcon size={12} />
                <span>{comp}</span>
              </div>
            ))}
          </div>

          {/* Cost & HP Estimates to Complete */}
          {currentStage.remainingComponents.length > 0 && (
            <div className={styles.completionEstimate}>
              <div className={styles.estimateItem}>
                <span className={styles.estimateLabel}>Est. to complete stage</span>
                <span className={styles.estimateValue}>
                  ${estimatedRemainingCost.low.toLocaleString()} – $
                  {estimatedRemainingCost.high.toLocaleString()}
                </span>
              </div>
              <div className={styles.estimateItem}>
                <span className={styles.estimateLabel}>HP at completion</span>
                <span className={styles.estimateValue}>~{hpAtStage[currentStageIdx]} hp</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* All Complete State */}
      {allComplete && (
        <div className={styles.completedCard}>
          <div className={styles.completedIcon}>🏆</div>
          <p className={styles.completedText}>
            You've completed all documented stages for this platform!
          </p>
          <p className={styles.completedSubtext}>
            Beyond this point requires custom builds and engine work. Consult a professional tuner.
          </p>
        </div>
      )}

      {/* Stages Overview */}
      <div className={styles.stagesOverview}>
        <div className={styles.overviewHeader}>All Stages</div>
        {stages.map((stage, idx) => (
          <div
            key={idx}
            className={`${styles.overviewRow} ${stage.isComplete ? styles.complete : ''} ${idx === currentStageIdx ? styles.current : ''}`}
          >
            <div className={styles.overviewStage}>
              <span className={styles.overviewStageName}>{stage.stage}</span>
              {stage.isComplete && <CheckIcon size={10} />}
            </div>
            <div className={styles.overviewStats}>
              <span className={styles.overviewHp}>
                +{stage.hpGainLow}–{stage.hpGainHigh} hp
              </span>
              <span className={styles.overviewCost}>
                ${stage.costLow.toLocaleString()}–${stage.costHigh.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Beyond Standard Stages - Mods not part of defined stage progressions */}
      {hasBeyondStageMods && (
        <div className={styles.beyondStagesSection}>
          <div className={styles.beyondStagesHeader}>
            <span className={styles.beyondStagesTitle}>Beyond Standard Stages</span>
            <span className={styles.beyondStagesBadge}>+{beyondStageMods.length}</span>
          </div>
          <p className={styles.beyondStagesDesc}>
            You&apos;ve added advanced modifications beyond the typical build path:
          </p>
          <div className={styles.beyondStagesList}>
            {beyondStageMods.map((mod, idx) => (
              <div key={idx} className={styles.beyondStagesMod}>
                <CheckIcon size={12} />
                <span>{formatModKeyForDisplay(mod)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
