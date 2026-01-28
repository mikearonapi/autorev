'use client';

/**
 * BuildProgressRings Component
 *
 * Apple Watch-style concentric rings showing build progress across 3 dimensions:
 * - Power (outer ring) - HP gain vs max potential
 * - Handling (middle ring) - Handling mods score
 * - Reliability (inner ring) - Supporting mods balance
 *
 * Shows: Stock → Current → Max Potential breakdown
 * Based on Dashboard's ConcentricRings component for visual consistency.
 */

import { useEffect, useState } from 'react';

import { createPortal } from 'react-dom';

import { Icons } from '@/components/ui/Icons';
import { useSafeAreaColor, SAFE_AREA_COLORS } from '@/hooks/useSafeAreaColor';

import styles from './BuildProgressRings.module.css';

// Info icon component
const InfoIcon = ({ size = 12 }) => (
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
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

// Ring info content
// Colors use CSS custom property values for design system consistency
const RING_INFO = {
  power: {
    title: 'Power',
    icon: Icons.zap,
    colorVar: '--color-error',
    colorFallback: '#ef4444',
    description:
      "How much of your vehicle's performance potential you've unlocked through modifications.",
    breakdown: [
      { label: '0%', desc: 'Stock power - no modifications' },
      { label: '25%', desc: 'Light mods - intake, exhaust' },
      { label: '50%', desc: 'Stage 1-2 tune with bolt-ons' },
      { label: '75%', desc: 'Stage 2+ with supporting mods' },
      { label: '100%', desc: 'Max potential without engine internals' },
    ],
    tip: 'The max potential is based on your engine type. Turbo engines have more headroom than naturally aspirated.',
  },
  handling: {
    title: 'Handling',
    icon: Icons.target,
    colorVar: '--color-accent-teal',
    colorFallback: '#10b981',
    description: "Your vehicle's cornering and control capability compared to its full potential.",
    breakdown: [
      { label: '50%', desc: 'Stock - your car handles fine from the factory' },
      { label: '65%', desc: 'Lowering springs or basic suspension' },
      { label: '75%', desc: 'Quality coilovers and sway bars' },
      { label: '90%', desc: 'Full suspension + brake upgrades' },
      { label: '100%', desc: 'Track-ready setup with R-compound tires' },
    ],
    tip: 'Stock cars start at 50% because factory handling is good - upgrades enhance it further.',
  },
  reliability: {
    title: 'Reliability',
    icon: Icons.shield,
    colorVar: '--color-accent-blue',
    colorFallback: '#3b82f6',
    description:
      'How well-supported your power modifications are. More power without support = more stress.',
    breakdown: [
      { label: '100%', desc: 'Stock or well-supported build' },
      { label: '85%', desc: 'Moderate power with some support' },
      { label: '70%', desc: 'High power, needs more cooling/fuel' },
      { label: '<60%', desc: 'At risk - missing critical support mods' },
    ],
    tip: 'Add intercooler, oil cooler, and fuel system upgrades to maintain reliability as you add power.',
  },
};

// Helper to get CSS variable value with fallback
const getCssColor = (colorVar, fallback) => `var(${colorVar}, ${fallback})`;

// Info Modal Component - Professional design matching app patterns
const RingInfoModal = ({ ring, onClose, data }) => {
  if (!ring) return null;

  const info = RING_INFO[ring];
  if (!info) return null;

  const color = getCssColor(info.colorVar, info.colorFallback);
  const IconComponent = info.icon;

  return (
    <div className={styles.modalOverlay} onClick={onClose} data-overlay-modal>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <div
              className={styles.modalIconWrapper}
              style={{ backgroundColor: `${info.colorFallback}20`, color }}
            >
              <IconComponent size={22} />
            </div>
            <h3 className={styles.modalTitle} style={{ color }}>
              {info.title}
            </h3>
          </div>
          <span className={styles.modalPercent} style={{ color }}>
            {data?.percent || 0}%
          </span>
          <button className={styles.modalClose} onClick={onClose} aria-label="Close">
            <Icons.x size={20} />
          </button>
        </div>

        {/* Divider */}
        <div
          className={styles.modalDivider}
          style={{ backgroundColor: `${info.colorFallback}30` }}
        />

        {/* Description */}
        <p className={styles.modalDescription}>{info.description}</p>

        {/* Breakdown */}
        <div className={styles.modalBreakdown}>
          <h4 className={styles.breakdownTitle}>What the percentages mean:</h4>
          <div className={styles.breakdownList}>
            {info.breakdown.map((item, idx) => (
              <div key={idx} className={styles.breakdownItem}>
                <span className={styles.breakdownLabel} style={{ color }}>
                  {item.label}
                </span>
                <span className={styles.breakdownDesc}>{item.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pro Tip */}
        <div className={styles.modalTip}>
          <div className={styles.tipIconWrapper}>
            <Icons.lightbulb size={16} />
          </div>
          <span className={styles.tipText}>{info.tip}</span>
        </div>
      </div>
    </div>
  );
};

// Ring configuration - outer to inner
// Colors are semantic: Power (red/energy), Handling (green/control), Reliability (blue/trust)
// Using CSS custom properties with fallbacks for design system consistency
const RINGS = [
  {
    key: 'power',
    label: 'Power',
    colorVar: '--color-error',
    colorFallback: '#ef4444',
    baselineColor: null,
  },
  {
    key: 'handling',
    label: 'Handling',
    colorVar: '--color-accent-teal',
    colorFallback: '#10b981',
    baselineColorVar: '--color-accent-teal',
    baselineOpacity: '40',
  },
  {
    key: 'reliability',
    label: 'Reliable',
    colorVar: '--color-accent-blue',
    colorFallback: '#3b82f6',
    baselineColor: null,
  },
];

// Reliability status colors - using CSS custom properties
const RELIABILITY_COLORS = {
  excellent: { colorVar: '--color-accent-teal', fallback: '#10b981' }, // Green - well balanced
  good: { colorVar: '--color-accent-blue', fallback: '#3b82f6' }, // Blue - healthy
  monitor: { colorVar: '--color-accent-amber', fallback: '#f59e0b' }, // Amber - needs attention
  'at-risk': { colorVar: '--color-error', fallback: '#ef4444' }, // Red - risky
  stock: { colorVar: '--color-accent-blue', fallback: '#3b82f6' }, // Blue - stock
};

export default function BuildProgressRings({
  power = { current: 0, max: 100, percent: 0 },
  handling = { current: 0, max: 100, percent: 0 },
  reliability = { current: 0, max: 100, percent: 0 },
  stockHp = 0,
  totalHp = 0,
  size = 180,
  animated = true,
}) {
  const [animatedProgress, setAnimatedProgress] = useState(
    animated
      ? { power: 0, handling: 0, reliability: 0 }
      : { power: power.percent, handling: handling.percent, reliability: reliability.percent }
  );
  const [animatedTotalHp, setAnimatedTotalHp] = useState(animated ? stockHp : totalHp);
  const [activeInfoModal, setActiveInfoModal] = useState(null);
  const [mounted, setMounted] = useState(false);

  // Set safe area color when info modal is open
  useSafeAreaColor(SAFE_AREA_COLORS.OVERLAY, { enabled: !!activeInfoModal });

  // Portal mounting - required for SSR compatibility
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get ring data for modal
  const getRingData = (key) => {
    switch (key) {
      case 'power':
        return power;
      case 'handling':
        return handling;
      case 'reliability':
        return reliability;
      default:
        return { percent: 0 };
    }
  };

  // Animate ring progress
  useEffect(() => {
    if (!animated) {
      setAnimatedProgress({
        power: power.percent,
        handling: handling.percent,
        reliability: reliability.percent,
      });
      return;
    }

    const duration = 1000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic

      setAnimatedProgress({
        power: power.percent * eased,
        handling: handling.percent * eased,
        reliability: reliability.percent * eased,
      });

      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [power.percent, handling.percent, reliability.percent, animated]);

  // Animate HP count-up from stock to total
  useEffect(() => {
    if (!animated || totalHp === 0) {
      setAnimatedTotalHp(totalHp);
      return;
    }

    const duration = 1200;
    const startTime = Date.now();
    const startValue = stockHp; // Start from stock HP for dramatic effect

    const animateValue = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setAnimatedTotalHp(Math.round(startValue + (totalHp - startValue) * eased));

      if (progress < 1) requestAnimationFrame(animateValue);
    };

    requestAnimationFrame(animateValue);
  }, [totalHp, stockHp, animated]);

  // Ring dimensions - each ring is progressively smaller
  const strokeWidth = 10;
  const gap = 4;
  const ringSpacing = strokeWidth + gap;

  // Calculate ring properties
  const getRingProps = (index) => {
    const radius = size / 2 - strokeWidth / 2 - index * ringSpacing;
    const circumference = 2 * Math.PI * radius;
    return { radius, circumference };
  };

  // Get progress for each ring
  const getProgress = (key) => {
    return Math.min(animatedProgress[key] || 0, 100);
  };

  // Get the appropriate color for reliability based on status
  // Returns both CSS variable form and hex fallback for SVG opacity manipulation
  const getReliabilityColorConfig = () => {
    const colorConfig = RELIABILITY_COLORS[reliability.status] || RELIABILITY_COLORS['good'];
    return {
      cssVar: getCssColor(colorConfig.colorVar, colorConfig.fallback),
      hex: colorConfig.fallback,
    };
  };

  // Get ring color config (dynamic for reliability)
  // Returns both CSS variable form and hex fallback for SVG opacity manipulation
  const getRingColorConfig = (ring) => {
    if (ring.key === 'reliability') {
      return getReliabilityColorConfig();
    }
    return {
      cssVar: getCssColor(ring.colorVar, ring.colorFallback),
      hex: ring.colorFallback,
    };
  };

  // Calculate performance metrics
  const hpGain = power.current;
  const remainingPotential = power.max - power.current;

  // Handling baseline (stock level = 50%)
  const HANDLING_BASELINE = 50;

  return (
    <div className={styles.wrapper}>
      {/* Rings */}
      <div className={styles.ringsContainer}>
        <div className={styles.container} style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={styles.svg}>
            {RINGS.map((ring, index) => {
              const { radius, circumference } = getRingProps(index);
              const progress = getProgress(ring.key);
              const offset = circumference - (progress / 100) * circumference;
              const colorConfig = getRingColorConfig(ring);

              // For handling, calculate baseline and upgrade portions separately
              const isHandling = ring.key === 'handling';
              const baselineProgress = isHandling ? HANDLING_BASELINE : 0;
              const baselineOffset = circumference - (baselineProgress / 100) * circumference;

              return (
                <g key={ring.key}>
                  {/* Background ring - use hex with opacity suffix for SVG */}
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={`${colorConfig.hex}15`}
                    strokeWidth={strokeWidth}
                  />

                  {/* For handling: show baseline (stock) in dimmer color */}
                  {isHandling && baselineProgress > 0 && (
                    <circle
                      cx={size / 2}
                      cy={size / 2}
                      r={radius}
                      fill="none"
                      stroke={`${colorConfig.hex}50`}
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={baselineOffset}
                      className={styles.ringProgress}
                    />
                  )}

                  {/* Progress ring - use CSS variable for main stroke */}
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={colorConfig.cssVar}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className={styles.ringProgress}
                    style={{
                      filter: progress > 0 ? `drop-shadow(0 0 4px ${colorConfig.hex}40)` : 'none',
                    }}
                  />
                </g>
              );
            })}
          </svg>

          {/* Center - HP display */}
          <div className={styles.center}>
            <div className={styles.centerDisplay}>
              <span className={styles.centerValue}>{animatedTotalHp}</span>
              <span className={styles.centerLabel}>HP</span>
            </div>
          </div>
        </div>

        {/* Horizontal Legend Row */}
        <div className={styles.legendRow}>
          {RINGS.map((ring) => {
            const progress = Math.round(getProgress(ring.key));
            const colorConfig = getRingColorConfig(ring);
            return (
              <div key={ring.key} className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: colorConfig.cssVar }} />
                <span className={styles.legendLabel}>{ring.label}</span>
                <span className={styles.legendPercent} style={{ color: colorConfig.cssVar }}>
                  {progress}%
                </span>
                <button
                  className={styles.infoButton}
                  onClick={() => setActiveInfoModal(ring.key)}
                  aria-label={`Learn about ${ring.label}`}
                >
                  <InfoIcon size={10} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Metrics Row - Stock + Gained = Current | Available */}
        <div className={styles.metricsRow}>
          <div className={styles.metric}>
            <span className={styles.metricValue}>{stockHp}</span>
            <span className={styles.metricLabel}>Stock</span>
          </div>
          <span className={styles.metricArrow}>+</span>
          <div className={styles.metric}>
            <span
              className={styles.metricValue}
              style={{ color: hpGain > 0 ? 'var(--color-error)' : 'var(--color-text-tertiary)' }}
            >
              {hpGain}
            </span>
            <span className={styles.metricLabel}>Gained</span>
          </div>
          <span className={styles.metricArrow}>=</span>
          <div className={styles.metric}>
            <span className={styles.metricValue} style={{ color: 'var(--color-accent-teal)' }}>
              {totalHp}
            </span>
            <span className={styles.metricLabel}>Current</span>
          </div>
          {remainingPotential > 0 && (
            <>
              <span className={styles.metricDivider}>|</span>
              <div className={styles.metric}>
                <span
                  className={styles.metricValue}
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  +{remainingPotential}
                </span>
                <span className={styles.metricLabel}>Avail</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Info Modal - rendered via portal to avoid z-index stacking issues */}
      {activeInfoModal &&
        mounted &&
        createPortal(
          <RingInfoModal
            ring={activeInfoModal}
            data={getRingData(activeInfoModal)}
            onClose={() => setActiveInfoModal(null)}
          />,
          document.body
        )}
    </div>
  );
}
