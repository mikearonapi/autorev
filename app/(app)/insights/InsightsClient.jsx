'use client';

/**
 * InsightsClient Component - Build Insights Dashboard
 *
 * PURPOSE: Provide a unified view of build progress across Power, Handling, and Reliability.
 *
 * WHAT WE SHOW:
 * - PERFORMANCE: Next recommended mod, bottleneck analysis, Stage recommendations
 * - RELIABILITY: Platform-specific issues relevant to modding (e.g., "B58 needs cooling at Stage 2")
 * - OPPORTUNITY: Deals, events, new content (future)
 *
 * WHAT WE DO NOT SHOW:
 * - Generic maintenance reminders (oil changes, tire rotations)
 * - Registration/inspection due dates
 * - "Log maintenance" actions (feature removed)
 * - Anything that doesn't serve the modification market
 *
 * Target audience: Enthusiasts who modify their vehicles for performance.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

import Link from 'next/link';

// Analysis components migrated from Data page
import BuildProgressAnalysis from '@/components/BuildProgressAnalysis';
import FeedbackDimensionsModal from '@/components/FeedbackDimensionsModal';
import { GarageVehicleSelector } from '@/components/garage';
import KnownIssuesAlert from '@/components/KnownIssuesAlert';
import LoadingSpinner from '@/components/LoadingSpinner';
import NextUpgradeRecommendation from '@/components/NextUpgradeRecommendation';
import PlatformInsights from '@/components/PlatformInsights';
import { useAuth } from '@/components/providers/AuthProvider';
import { useCarBySlug } from '@/hooks/useCarData';
import { useTuningProfile } from '@/hooks/useTuningProfile';
import { useUserInsights } from '@/hooks/useUserData';
import {
  calculateAllModificationGains,
  calculateMaxPotential,
  calculateHandlingScore,
  calculateReliabilityScore,
} from '@/lib/performanceCalculator';
import { calculateTunability } from '@/lib/tunabilityCalculator';

import BuildProgressRings from './components/BuildProgressRings';
import styles from './page.module.css';

// ==========================================================================
// INSIGHTS FILTER CONFIGURATION
// Each section that can be toggled on/off by the user
// ==========================================================================
const INSIGHT_SECTIONS = {
  buildProgress: { label: 'Build Progress', description: 'Power, handling, reliability rings' },
  // drivingCharacter removed - now accessible via info button on garage car image
  stageAnalysis: { label: 'Stage Analysis', description: 'Stage 1/2/3 progression' },
  nextUpgrade: { label: 'Next Upgrade', description: 'Recommended mods' },
  knownIssues: { label: 'Known Issues', description: 'Platform reliability alerts' },
  platformInsights: { label: 'Platform Insights', description: 'Strengths & weaknesses' },
  additionalInsights: { label: 'Additional Insights', description: 'Build tips' },
};

const STORAGE_KEY = 'autorev-insights-filters';

// Get default filters (all enabled)
const getDefaultFilters = () => {
  const defaults = {};
  Object.keys(INSIGHT_SECTIONS).forEach((key) => {
    defaults[key] = true;
  });
  return defaults;
};

// Load filters from localStorage
const loadFilters = () => {
  if (typeof window === 'undefined') return getDefaultFilters();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults in case new sections are added
      return { ...getDefaultFilters(), ...parsed };
    }
  } catch (e) {
    console.error('[InsightsClient] Error loading filters:', e);
  }
  return getDefaultFilters();
};

// Save filters to localStorage
const saveFilters = (filters) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  } catch (e) {
    console.error('[InsightsClient] Error saving filters:', e);
  }
};

// --- ICONS ---
const _UserIcon = ({ size = 20 }) => (
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
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
  </svg>
);
const _GarageIcon = ({ size = 18 }) => (
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
    <path d="M2 20v-8l10-6 10 6v8" />
    <path d="M4 20v-4a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v4" />
    <path d="M4 20h16" />
  </svg>
);
const _CarIcon = ({ size = 18 }) => (
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
    <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2" />
    <circle cx="6.5" cy="16.5" r="2.5" />
    <circle cx="16.5" cy="16.5" r="2.5" />
  </svg>
);
const _CheckIcon = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const _CheckCircleIcon = ({ size = 32 }) => (
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
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
const _ChevronDownIcon = ({ size = 16 }) => (
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
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const ChevronRightIcon = ({ size = 14 }) => (
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
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const BoltIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);
// ShieldIcon removed - no longer used (MAINTENANCE type removed for mod-focused app)
const ChartIcon = ({ size = 18 }) => (
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
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);
const AlertTriangleIcon = ({ size = 18 }) => (
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
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const SparklesIcon = ({ size = 18 }) => (
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
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
    <path d="M5 19l.5 1.5L7 21l-1.5.5L5 23l-.5-1.5L3 21l1.5-.5L5 19z" />
    <path d="M19 10l.5 1.5L21 12l-1.5.5-.5 1.5-.5-1.5L17 12l1.5-.5.5-1.5z" />
  </svg>
);
const ThumbsUpIcon = ({ size = 18, filled = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
  </svg>
);
const ThumbsDownIcon = ({ size = 18, filled = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
  </svg>
);
const _WrenchIcon = ({ size = 18 }) => (
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
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);
const SlidersIcon = ({ size = 18 }) => (
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
    <line x1="21" y1="4" x2="14" y2="4" />
    <line x1="10" y1="4" x2="3" y2="4" />
    <line x1="21" y1="12" x2="12" y2="12" />
    <line x1="8" y1="12" x2="3" y2="12" />
    <line x1="21" y1="20" x2="16" y2="20" />
    <line x1="12" y1="20" x2="3" y2="20" />
    <circle cx="12" cy="4" r="2" />
    <circle cx="10" cy="12" r="2" />
    <circle cx="14" cy="20" r="2" />
  </svg>
);
const XIcon = ({ size = 18 }) => (
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
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// --- COMPONENT: FILTER PANEL ---
const FilterPanel = ({ isOpen, onClose, filters, onToggle, onReset }) => {
  const panelRef = useRef(null);

  // Close filter panel on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleFilterPanelOutsideClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    };
    // Delay to prevent immediate close
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleFilterPanelOutsideClick);
    }, 100);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleFilterPanelOutsideClick);
    };
  }, [isOpen, onClose]);

  // Count how many are hidden
  const hiddenCount = Object.values(filters).filter((v) => !v).length;

  if (!isOpen) return null;

  return (
    <div className={styles.filterPanel} ref={panelRef}>
      <div className={styles.filterPanelHeader}>
        <h3 className={styles.filterPanelTitle}>Show/Hide Sections</h3>
        <button className={styles.filterPanelClose} onClick={onClose} aria-label="Close">
          <XIcon size={18} />
        </button>
      </div>

      <div className={styles.filterPanelBody}>
        {Object.entries(INSIGHT_SECTIONS).map(([key, { label, description }]) => (
          <label key={key} className={styles.filterOption}>
            <div className={styles.filterOptionInfo}>
              <span className={styles.filterOptionLabel}>{label}</span>
              <span className={styles.filterOptionDesc}>{description}</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={filters[key]}
              className={`${styles.filterToggle} ${filters[key] ? styles.filterToggleOn : ''}`}
              onClick={() => onToggle(key)}
            >
              <span className={styles.filterToggleThumb} />
            </button>
          </label>
        ))}
      </div>

      {hiddenCount > 0 && (
        <div className={styles.filterPanelFooter}>
          <button className={styles.filterResetBtn} onClick={onReset}>
            Show All Sections
          </button>
        </div>
      )}
    </div>
  );
};

// --- COMPONENT: INSIGHT CARD (Unified) ---
// Types: PERFORMANCE (upgrades/power), RELIABILITY (platform issues), COMMUNITY (builds/social), OPPORTUNITY (deals/events)
const SmartInsightCard = ({ type, title, body, subtext, action, onFeedback, id }) => {
  const [feedback, setFeedback] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitFeedback = async (rating, feedbackText = null) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setFeedback(rating);

    try {
      await onFeedback(type, id, rating, title, feedbackText);
      setSubmitted(true);
    } catch (err) {
      console.error('[SmartInsightCard] Feedback error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleThumbsUp = () => {
    if (isSubmitting || submitted) return;
    handleSubmitFeedback('up');
  };

  const handleThumbsDown = () => {
    if (isSubmitting || submitted) return;
    // Show the feedback modal for detailed negative feedback
    setFeedback('down');
    setShowFeedbackModal(true);
  };

  const handleModalSubmit = async ({ tags, feedbackText }) => {
    // Combine tags and text into a single feedback string
    const combinedFeedback = [
      tags.length > 0 ? `Tags: ${tags.join(', ')}` : '',
      feedbackText ? `Comment: ${feedbackText}` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    await handleSubmitFeedback('down', combinedFeedback || null);
    setShowFeedbackModal(false);
  };

  const handleModalClose = () => {
    // If modal is closed without submitting, reset the feedback state
    if (!submitted) {
      setFeedback(null);
    }
    setShowFeedbackModal(false);
  };

  const getIcon = () => {
    switch (type) {
      case 'PERFORMANCE':
        return <BoltIcon className="text-emerald-400" />;
      case 'RELIABILITY':
        return <AlertTriangleIcon className="text-amber-400" />;
      case 'COMMUNITY':
        return <ChartIcon className="text-blue-400" />;
      case 'OPPORTUNITY':
        return <SparklesIcon className="text-purple-400" />;
      default:
        return <BoltIcon />;
    }
  };

  const getAccentColor = () => {
    switch (type) {
      case 'PERFORMANCE':
        return 'var(--color-accent-teal, #10b981)';
      case 'RELIABILITY':
        return 'var(--color-accent-amber, #f59e0b)';
      case 'COMMUNITY':
        return 'var(--color-accent-blue, #3b82f6)';
      case 'OPPORTUNITY':
        return 'var(--color-accent-purple, #a855f7)';
      default:
        return 'var(--color-text-primary, #ffffff)';
    }
  };

  return (
    <>
      <div className={styles.smartCard}>
        <div className={styles.cardHeader}>
          <div
            className={styles.cardIconWrapper}
            style={{ color: getAccentColor(), background: `${getAccentColor()}15` }}
          >
            {getIcon()}
          </div>
          <span className={styles.cardType} style={{ color: getAccentColor() }}>
            {type}
          </span>
          <div className={styles.cardActions}>
            {submitted ? (
              <>
                <button
                  className={`${styles.feedbackBtn} ${feedback === 'up' ? styles.activeUp : styles.dimmed}`}
                  disabled
                  aria-label="Helpful - submitted"
                >
                  <ThumbsUpIcon size={14} filled={feedback === 'up'} />
                </button>
                <button
                  className={`${styles.feedbackBtn} ${feedback === 'down' ? styles.activeDown : styles.dimmed}`}
                  disabled
                  aria-label="Not helpful - submitted"
                >
                  <ThumbsDownIcon size={14} filled={feedback === 'down'} />
                </button>
              </>
            ) : (
              <>
                <button
                  className={`${styles.feedbackBtn} ${feedback === 'up' ? styles.activeUp : ''}`}
                  onClick={handleThumbsUp}
                  disabled={isSubmitting}
                  aria-label="This was helpful"
                >
                  <ThumbsUpIcon size={14} filled={feedback === 'up'} />
                </button>
                <button
                  className={`${styles.feedbackBtn} ${feedback === 'down' ? styles.activeDown : ''}`}
                  onClick={handleThumbsDown}
                  disabled={isSubmitting}
                  aria-label="Not helpful"
                >
                  <ThumbsDownIcon size={14} filled={feedback === 'down'} />
                </button>
              </>
            )}
          </div>
        </div>

        <div className={styles.cardBody}>
          <h3 className={styles.cardTitle}>{title}</h3>
          <p className={styles.cardText}>{body}</p>
          {subtext && <div className={styles.cardSubtext}>{subtext}</div>}
        </div>

        {action && (
          <Link href={action.href} className={styles.cardActionLink}>
            {action.label} <ChevronRightIcon />
          </Link>
        )}
      </div>

      {/* Feedback modal for detailed negative feedback */}
      <FeedbackDimensionsModal
        isOpen={showFeedbackModal}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        feedbackType="negative"
        subtitle="What went wrong? Your feedback helps us improve."
        showDimensionRatings={false}
      />
    </>
  );
};

export default function InsightsClient() {
  const { user, profile, loading: authLoading } = useAuth();

  // ==========================================================================
  // REACT QUERY - Primary data fetching with automatic caching & refetching
  // Replaces manual fetch + useState for better performance and UX
  // Benefits:
  // - Shows cached data instantly while fetching fresh data in background
  // - Automatic retry on failure
  // - Window focus refetch (handles bfcache automatically)
  // - Request deduplication
  // ==========================================================================
  const {
    data: insightsData,
    isLoading: insightsLoading,
    error: insightsError,
    refetch: refetchInsights,
  } = useUserInsights(user?.id, {
    enabled: !authLoading && !!user?.id,
  });

  // Derive loading and error states
  const loading = authLoading || insightsLoading;
  const error = insightsError?.message || null;

  const [selectedVehicleId, setSelectedVehicleId] = useState(null); // Initialize as null, will set to first vehicle on load

  // Filter state - which sections to show/hide
  const [sectionFilters, setSectionFilters] = useState(getDefaultFilters);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);

  // Load saved filters on mount
  useEffect(() => {
    setSectionFilters(loadFilters());
  }, []);

  // Handle filter toggle
  const handleFilterToggle = useCallback((key) => {
    setSectionFilters((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      saveFilters(updated);
      return updated;
    });
  }, []);

  // Reset all filters to show all sections
  const handleFilterReset = useCallback(() => {
    const defaults = getDefaultFilters();
    setSectionFilters(defaults);
    saveFilters(defaults);
  }, []);

  // Count hidden sections for badge
  const hiddenSectionCount = useMemo(() => {
    return Object.values(sectionFilters).filter((v) => !v).length;
  }, [sectionFilters]);

  // Known issues state - fetched separately for full details
  const [knownIssues, setKnownIssues] = useState([]);
  const [issuesLoading, setIssuesLoading] = useState(false);

  // Build progress data for the rings visualization
  // Initial state uses baseline values (50% handling = stock, 100% reliability = stock)
  const [feedItems, setFeedItems] = useState([]);
  const [buildStats, setBuildStats] = useState({
    power: { current: 0, max: 100, percent: 0 },
    handling: { current: 50, max: 100, percent: 50 }, // Stock baseline
    reliability: { current: 100, max: 100, percent: 100, warnings: [], status: 'stock' },
    totalHp: 0,
    stockHp: 0,
    hpGain: 0,
    mods: 0,
  });

  const _avatarUrl =
    profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const firstName = profile?.display_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  const vehicles = useMemo(() => insightsData?.vehicles || [], [insightsData?.vehicles]);
  const insights = useMemo(() => insightsData?.insights || {}, [insightsData?.insights]);
  const summary = useMemo(() => insightsData?.summary || {}, [insightsData?.summary]);

  // Filter Data Helpers
  const selectedVehicle =
    selectedVehicleId !== 'all' ? vehicles.find((v) => v.id === selectedVehicleId) : null;

  const rawBuildProgress = selectedVehicle
    ? (insights.buildProgress || []).filter((b) => b.vehicleId === selectedVehicleId)
    : insights.buildProgress || [];

  // Summary Metrics
  const _displaySummary = selectedVehicle
    ? {
        totalHpGain:
          rawBuildProgress.find((b) => b.vehicleId === selectedVehicle.id)?.currentHpGain || 0,
        totalMods: (selectedVehicle.installed_modifications || []).length,
      }
    : {
        totalHpGain: summary.totalHpGain || 0,
        totalMods: summary.totalMods || 0,
      };

  // ==========================================================================
  // PERFORMANCE CALCULATION HELPER
  // SOURCE OF TRUTH: lib/performanceCalculator - ALWAYS calculate dynamically
  // ==========================================================================

  /**
   * Normalize installed_modifications to array of string keys
   * Handles both array of strings and array of objects { name, upgrade_key }
   */
  const normalizeModKeys = useCallback((mods) => {
    if (!mods || !Array.isArray(mods)) return [];
    return mods
      .map((mod) => {
        if (typeof mod === 'string') return mod;
        if (typeof mod === 'object' && mod !== null) {
          return mod.upgrade_key || mod.key || mod.id || null;
        }
        return null;
      })
      .filter(Boolean);
  }, []);

  const calculateVehiclePerformance = useCallback(
    (vehicle) => {
      if (!vehicle) {
        return {
          stockHp: 0,
          hpGain: 0,
          totalHp: 0,
          mods: 0,
          power: { current: 0, max: 100, percent: 0 },
          handling: { current: 0, max: 100, percent: 50 }, // Stock baseline
          reliability: { current: 100, max: 100, percent: 100, warnings: [], status: 'stock' },
        };
      }

      // Normalize mods to array of string keys
      const rawMods = vehicle.installed_modifications || [];
      const installedMods = normalizeModKeys(rawMods);
      const matchedCar = vehicle.matched_car || null;
      const stockHp = matchedCar?.hp || 0;
      const modCount = installedMods.length;

      // SOURCE OF TRUTH: Calculate HP gain dynamically using performanceCalculator
      // Never use stored values like total_hp_gain (they become stale)
      let hpGain = 0;
      if (modCount > 0 && matchedCar) {
        const gains = calculateAllModificationGains(installedMods, matchedCar);
        hpGain = gains.hpGain || 0;
      }

      // Calculate max potential for the vehicle
      const maxPotential = matchedCar
        ? calculateMaxPotential(matchedCar)
        : { maxHpGain: 200, maxTorqueGain: 200 };

      // Calculate power progress (HP gain vs max potential)
      const powerPercent =
        maxPotential.maxHpGain > 0 ? Math.round((hpGain / maxPotential.maxHpGain) * 100) : 0;
      const power = {
        current: hpGain,
        max: maxPotential.maxHpGain,
        percent: Math.min(powerPercent, 100),
      };

      // Calculate handling score - uses normalized mod keys
      const handling = calculateHandlingScore(installedMods);

      // Calculate reliability score - uses normalized mod keys and HP gain percentage
      const hpGainPercent = stockHp > 0 ? hpGain / stockHp : 0;
      const reliability = calculateReliabilityScore(installedMods, hpGainPercent);

      return {
        stockHp,
        hpGain,
        totalHp: stockHp + hpGain,
        mods: modCount,
        power,
        handling,
        reliability,
      };
    },
    [normalizeModKeys]
  );

  // ==========================================================================
  // INSIGHTS GENERATOR - Mod-focused, using real calculations
  // ==========================================================================
  // IMPORTANT: This feed should only show insights that ADD NEW INFORMATION
  // not already displayed in the dedicated sections above:
  // - BuildProgressRings shows: HP, Power %, Handling %, Reliability %
  // - BuildProgressAnalysis shows: Stage progression, what's next in current stage
  // - BuildValueAnalysis shows: Cost efficiency, investment breakdown
  // - NextUpgradeRecommendation shows: Recommended mods to add
  // - KnownIssuesAlert shows: Platform-specific reliability issues
  // - PlatformInsights shows: Strengths, weaknesses, community tips
  //
  // The SmartFeed should ONLY include:
  // - PERFORMANCE insights about build BALANCE (not just HP numbers)
  // - Any truly unique insights not covered by dedicated sections
  // ==========================================================================
  const generateSmartFeed = useCallback(
    (vehicleId) => {
      const items = [];
      // Default stats use baseline values (50% handling = stock, 100% reliability = stock)
      let stats = {
        power: { current: 0, max: 100, percent: 0 },
        handling: { current: 50, max: 100, percent: 50 }, // Stock baseline
        reliability: { current: 100, max: 100, percent: 100, warnings: [], status: 'stock' },
        totalHp: 0,
        stockHp: 0,
        hpGain: 0,
        mods: 0,
      };

      const currentVehicle = vehicleId !== 'all' ? vehicles.find((v) => v.id === vehicleId) : null;

      // --- ALL VEHICLES SUMMARY ---
      if (vehicleId === 'all') {
        // Calculate totals across all vehicles using SOURCE OF TRUTH
        let totalHpGain = 0;
        let totalMods = 0;
        let totalStockHp = 0;

        vehicles.forEach((v) => {
          const perf = calculateVehiclePerformance(v);
          totalHpGain += perf.hpGain;
          totalMods += perf.mods;
          totalStockHp += perf.stockHp;
        });

        // For "all vehicles" view, show aggregate stats
        stats = {
          power: {
            current: totalHpGain,
            max: Math.round(totalStockHp * 0.5),
            percent:
              totalStockHp > 0
                ? Math.min(100, Math.round((totalHpGain / (totalStockHp * 0.5)) * 100))
                : 0,
          },
          handling: { current: 0, max: 100, percent: 0 },
          reliability: { current: 100, max: 100, percent: 100, warnings: [], status: 'stock' },
          totalHp: totalStockHp + totalHpGain,
          stockHp: totalStockHp,
          hpGain: totalHpGain,
          mods: totalMods,
        };

        // For "all vehicles", just show a prompt to select a specific vehicle
        if (vehicles.length > 1) {
          const perfVehicle =
            vehicles.find((v) => ['Audi', 'BMW', 'Porsche', 'Mercedes-Benz'].includes(v.make)) ||
            vehicles[0];
          if (perfVehicle) {
            items.push({
              id: 'select-vehicle',
              type: 'PERFORMANCE',
              title: 'Select a Vehicle',
              body: `Select your ${perfVehicle.year} ${perfVehicle.make} ${perfVehicle.model} to see personalized insights, stage progression, and upgrade recommendations.`,
              action: { label: 'View Build', href: `/garage?vehicle=${perfVehicle.id}` },
            });
          }
        }
      }
      // --- SPECIFIC VEHICLE ---
      else if (currentVehicle) {
        // Calculate REAL performance using SOURCE OF TRUTH
        const perf = calculateVehiclePerformance(currentVehicle);
        const { stockHp, hpGain, totalHp, mods: modCount, power, handling, reliability } = perf;

        stats = {
          power,
          handling,
          reliability,
          totalHp,
          stockHp,
          hpGain,
          mods: modCount,
        };

        // =================================================================
        // FILTERED INSIGHTS - Only show what's NOT already in other sections
        // =================================================================

        // REMOVED: Power % insights - already shown in BuildProgressRings hero
        // REMOVED: HP numbers - already in rings + BuildValueAnalysis
        // REMOVED: "What mod to add next" - covered by NextUpgradeRecommendation
        // REMOVED: Reliability % and warnings - shown in rings + KnownIssuesAlert

        // --- PERFORMANCE: Only show BUILD BALANCE insights (not HP numbers) ---
        if (handling.percent <= 50 && power.percent > 30 && modCount > 1) {
          // User has added power but not handling - this is ACTIONABLE BUILD ADVICE
          // not just a repeat of percentages
          items.push({
            id: 'perf-balance',
            type: 'PERFORMANCE',
            title: `${power.percent}% Power Unlocked`,
            body: `Your ${currentVehicle.model} is making ${totalHp} HP (+${hpGain}). A Stage 2 tune would push you closer to max potential.`,
            action: { label: 'View Stage 2', href: '/garage/my-build?category=tune' },
          });
        }

        // --- RELIABILITY: Only show ACTIONABLE warnings not in KnownIssuesAlert ---
        // KnownIssuesAlert shows platform issues (timing chain, water pump, etc.)
        // We only add reliability insights here if they're BUILD-SPECIFIC advice
        if (
          reliability.warnings &&
          reliability.warnings.length > 0 &&
          reliability.status === 'at-risk'
        ) {
          // Only show the first warning as a summary card
          items.push({
            id: 'rel-warning',
            type: 'RELIABILITY',
            title: 'Reliability Note',
            body: reliability.warnings[0],
            subtext: `Reliability: ${reliability.percent}%`,
          });
        }
      }

      return { items, stats };
    },
    [vehicles, calculateVehiclePerformance]
  );

  // Generate feed when vehicle selection changes OR when vehicle data loads
  // Must include vehicles in dependency to recalculate when data arrives
  useEffect(() => {
    // Don't generate feed until we have vehicle data and a selected vehicle
    if (!selectedVehicleId || vehicles.length === 0) {
      return;
    }

    // Generate feed synchronously - no setTimeout needed
    // This runs immediately when data is ready, avoiding race conditions
    const data = generateSmartFeed(selectedVehicleId);
    setFeedItems(data.items);
    setBuildStats(data.stats);
  }, [selectedVehicleId, vehicles, generateSmartFeed]);

  // ==========================================================================
  // React Query handles data fetching automatically with:
  // - Caching: Shows cached data instantly while fetching fresh data
  // - Window focus refetch: Automatically refetches when user returns to tab
  // - Deduplication: Multiple components won't trigger duplicate requests
  // - Retry: Automatic retry on failure
  // - bfcache handling: refetchOnWindowFocus handles browser back/forward cache
  // ==========================================================================

  // Set default vehicle once data is loaded
  useEffect(() => {
    if (insightsData?.vehicles?.length > 0 && selectedVehicleId === null) {
      setSelectedVehicleId(insightsData.vehicles[0].id);
    }
  }, [insightsData, selectedVehicleId]);

  // Fetch known issues when vehicle selection changes
  // Uses the full issues API for detailed data (symptoms, prevention, costs)
  useEffect(() => {
    const fetchIssues = async () => {
      // Skip for "all vehicles" view or when no vehicle selected
      if (!selectedVehicleId || selectedVehicleId === 'all') {
        setKnownIssues([]);
        return;
      }

      const vehicle = vehicles.find((v) => v.id === selectedVehicleId);
      const carId = vehicle?.matchedCarId;
      // Get slug from matched_car object for API call (API route accepts slug)
      const carSlug = vehicle?.matched_car?.slug;

      if (!carId || !carSlug) {
        setKnownIssues([]);
        return;
      }

      setIssuesLoading(true);
      try {
        const response = await fetch(`/api/cars/${carSlug}/issues`);
        if (response.ok) {
          const data = await response.json();
          setKnownIssues(data.issues || []);
        } else {
          setKnownIssues([]);
        }
      } catch (err) {
        console.error('[InsightsClient] Error fetching known issues:', err);
        setKnownIssues([]);
      } finally {
        setIssuesLoading(false);
      }
    };

    fetchIssues();
  }, [selectedVehicleId, vehicles]);

  // Get selected vehicle's matched_car for tuning profile hook
  const selectedVehicleMatchedCar = useMemo(() => {
    if (!selectedVehicleId || selectedVehicleId === 'all') return null;
    const vehicle = vehicles.find((v) => v.id === selectedVehicleId);
    if (!vehicle) return null;
    // Create a minimal car object for the hook (needs id field)
    return vehicle.matched_car || (vehicle.matched_car_id ? { id: vehicle.matched_car_id } : null);
  }, [selectedVehicleId, vehicles]);

  // Fetch tuning profile using the hook (cached via React Query)
  const { profile: tuningProfile } = useTuningProfile(selectedVehicleMatchedCar);

  // ==========================================================================
  // ANALYSIS COMPONENT DATA - Computed values for Build Analysis sections
  // SOURCE OF TRUTH: performanceCalculator for all HP/performance calculations
  // ==========================================================================

  // Get the selected vehicle's installed modifications as an array of keys
  const installedUpgrades = useMemo(() => {
    if (!selectedVehicleId || selectedVehicleId === 'all') return [];
    const vehicle = vehicles.find((v) => v.id === selectedVehicleId);
    if (!vehicle) return [];

    const mods = vehicle.installed_modifications || [];
    // Normalize to array of string keys
    return mods
      .map((mod) => {
        if (typeof mod === 'string') return mod;
        if (typeof mod === 'object' && mod !== null) {
          return mod.upgrade_key || mod.key || mod.id || null;
        }
        return null;
      })
      .filter(Boolean);
  }, [selectedVehicleId, vehicles]);

  // Get stock HP and calculated HP for the selected vehicle
  const vehiclePerformanceData = useMemo(() => {
    if (!selectedVehicleId || selectedVehicleId === 'all') {
      return { stockHp: 0, estimatedHp: 0, hpGain: 0 };
    }
    const vehicle = vehicles.find((v) => v.id === selectedVehicleId);
    if (!vehicle) {
      return { stockHp: 0, estimatedHp: 0, hpGain: 0 };
    }

    const matchedCar = vehicle.matched_car || null;
    const stockHp = matchedCar?.hp || 0;

    // Calculate HP gain using performanceCalculator (SOURCE OF TRUTH)
    let hpGain = 0;
    if (installedUpgrades.length > 0 && matchedCar) {
      const gains = calculateAllModificationGains(installedUpgrades, matchedCar);
      hpGain = gains.hpGain || 0;
    }

    return {
      stockHp,
      hpGain,
      estimatedHp: stockHp + hpGain,
    };
  }, [selectedVehicleId, vehicles, installedUpgrades]);

  // Get car name and other metadata for display
  const selectedVehicleDetails = useMemo(() => {
    if (!selectedVehicleId || selectedVehicleId === 'all') return null;
    const vehicle = vehicles.find((v) => v.id === selectedVehicleId);
    if (!vehicle) return null;

    return {
      carName: `${vehicle.make} ${vehicle.model}`,
      carId: vehicle.matchedCarId,
      // Get slug from matched_car object for API calls that require slug
      carSlug: vehicle.matched_car?.slug,
      aspiration: vehicle.matched_car?.aspiration || 'NA',
      definingStrengths: vehicle.matched_car?.defining_strengths || [],
      honestWeaknesses: vehicle.matched_car?.honest_weaknesses || [],
      idealOwner: vehicle.matched_car?.ideal_owner,
      notIdealFor: vehicle.matched_car?.not_ideal_for,
      // Include matched_car for consistency validation
      matchedCar: vehicle.matched_car || null,
      // Include layout for stage progression generation
      carLayout: vehicle.matched_car?.layout || 'Front-Engine',
    };
  }, [selectedVehicleId, vehicles]);

  // Calculate tunability score for data consistency validation
  // This prevents contradictions like recommending ECU tune for platforms where tuning is impossible
  const vehicleTunability = useMemo(() => {
    if (!selectedVehicleDetails?.matchedCar) return null;
    const car = selectedVehicleDetails.matchedCar;
    // Build car object for tunability calculation
    const carForCalc = {
      name: selectedVehicleDetails.carName,
      engine: car.engine,
      aspirationType: selectedVehicleDetails.aspiration,
      aftermarketSupport: car.score_aftermarket,
      tier: car.tier,
      brand: car.brand,
    };
    return calculateTunability(carForCalc);
  }, [selectedVehicleDetails]);

  // Fetch full car details for driving character fields (engine feel, steering, sound)
  // Note: useCarBySlug requires slug, so we use carSlug from matched_car object
  const { data: _fullCarData } = useCarBySlug(selectedVehicleDetails?.carSlug, {
    enabled: !!selectedVehicleDetails?.carSlug,
  });

  const handleFeedback = useCallback(
    async (insightType, insightKey, rating, insightTitle = null, feedbackText = null) => {
      console.log('[InsightsClient] handleFeedback called:', {
        insightType,
        insightKey,
        rating,
        insightTitle,
        feedbackText,
        userId: user?.id,
      });

      if (!user?.id) {
        console.warn('[InsightsClient] No user ID, skipping feedback');
        return;
      }

      // Get the matchedCarId from the selected vehicle (car_id FK references cars table, not user_vehicles)
      let carId = null;
      if (selectedVehicleId && selectedVehicleId !== 'all') {
        const vehicle = vehicles.find((v) => v.id === selectedVehicleId);
        carId = vehicle?.matchedCarId || null;
      }

      try {
        const response = await fetch('/api/insights/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            insightType,
            insightKey,
            carId,
            rating,
            insightTitle,
            feedbackText,
          }),
        });

        const data = await response.json();
        console.log('[InsightsClient] Feedback response:', response.status, data);

        if (!response.ok) {
          console.error('[InsightsClient] Feedback API error:', data);
        }
      } catch (err) {
        console.error('[InsightsClient] Feedback error:', err);
      }
    },
    [user?.id, selectedVehicleId, vehicles]
  );

  // Not authenticated
  if (!authLoading && !user)
    return (
      <div className={styles.page}>
        <div className={styles.emptyState}>
          <h2>Sign in to view Insights</h2>
        </div>
      </div>
    );

  // Loading state - branded loading for consistent UX
  if (loading && !feedItems.length)
    return (
      <div className={styles.page}>
        <LoadingSpinner
          variant="branded"
          text="Loading Your Insights"
          subtext={authLoading ? 'Verifying your session...' : 'Analyzing your builds...'}
          fullPage
        />
      </div>
    );

  // Error state with retry
  if (error && !insightsData) {
    return (
      <div className={styles.page}>
        <div className={styles.emptyState}>
          <h2>Unable to Load Insights</h2>
          <p>{error}</p>
          <button onClick={() => refetchInsights()} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>{firstName}&apos;s Build Insights</h1>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.filterButtonWrapper}>
            <button
              className={`${styles.filterButton} ${hiddenSectionCount > 0 ? styles.filterButtonActive : ''}`}
              onClick={() => setFilterPanelOpen((prev) => !prev)}
              aria-label="Toggle sections"
            >
              <SlidersIcon size={18} />
              {hiddenSectionCount > 0 && (
                <span className={styles.filterBadge}>{hiddenSectionCount}</span>
              )}
            </button>
            <FilterPanel
              isOpen={filterPanelOpen}
              onClose={() => setFilterPanelOpen(false)}
              filters={sectionFilters}
              onToggle={handleFilterToggle}
              onReset={handleFilterReset}
            />
          </div>
        </div>
      </header>

      {/* Vehicle Selector - Uses shared component for consistency */}
      <div className={styles.vehicleSelectorWrapper}>
        <GarageVehicleSelector
          selectionMode="id"
          selectedVehicleId={selectedVehicleId}
          onSelect={setSelectedVehicleId}
        />
      </div>

      {/* Hero Section - Build Progress Rings */}
      {sectionFilters.buildProgress && (
        <section className={styles.summarySection}>
          <BuildProgressRings
            power={buildStats.power}
            handling={buildStats.handling}
            reliability={buildStats.reliability}
            stockHp={buildStats.stockHp}
            totalHp={buildStats.totalHp}
          />
        </section>
      )}

      {/* ============================================
          BUILD ANALYSIS SECTIONS
          Migrated from Data page Analysis tab
          ============================================ */}

      {/* Build Progress Analysis - Stage 1/2/3 progression */}
      {/* Build Progress Analysis - Stage 1/2/3 progression
          Now generates canonical stages from upgradeModules when car data available,
          aligned with docs/UPGRADE-CATEGORY-LOGIC.md definitions */}
      {sectionFilters.stageAnalysis &&
        selectedVehicleId &&
        selectedVehicleId !== 'all' &&
        selectedVehicleDetails?.matchedCar && (
          <section className={styles.analysisSection}>
            <BuildProgressAnalysis
              stageProgressions={tuningProfile?.stage_progressions}
              installedUpgrades={installedUpgrades}
              stockHp={vehiclePerformanceData.stockHp}
              currentHp={vehiclePerformanceData.estimatedHp}
              carName={selectedVehicleDetails?.carName}
              carId={selectedVehicleDetails?.carId}
              car={selectedVehicleDetails?.matchedCar}
              carLayout={selectedVehicleDetails?.carLayout}
              tuningProfile={tuningProfile}
              onFeedback={handleFeedback}
            />
          </section>
        )}

      {/* Recommended Next Upgrades */}
      {/* Now includes data consistency validation to prevent contradictions */}
      {sectionFilters.nextUpgrade && selectedVehicleId && selectedVehicleId !== 'all' && (
        <section className={styles.analysisSection}>
          <NextUpgradeRecommendation
            installedUpgrades={installedUpgrades}
            aspiration={selectedVehicleDetails?.aspiration || 'NA'}
            currentHp={vehiclePerformanceData.estimatedHp}
            carId={selectedVehicleDetails?.carId}
            vehicleId={selectedVehicleId}
            onFeedback={handleFeedback}
            // Data consistency validation props - prevents contradictory recommendations
            car={selectedVehicleDetails?.matchedCar}
            tuningProfile={tuningProfile}
            tunabilityScore={vehicleTunability?.score}
            carName={selectedVehicleDetails?.carName}
            // Data quality tier - shows disclaimer when data is limited
            dataQualityTier={tuningProfile?.data_quality_tier}
          />
        </section>
      )}

      {/* Known Issues - Critical issues to watch for this specific vehicle */}
      {/* MOVED UP: Issues are more actionable than general platform knowledge */}
      {sectionFilters.knownIssues &&
        selectedVehicleId &&
        selectedVehicleId !== 'all' &&
        !issuesLoading &&
        (knownIssues.length > 0 || !issuesLoading) && (
          <section className={styles.knownIssuesSection}>
            <KnownIssuesAlert
              issues={knownIssues}
              vehicleYear={selectedVehicle?.year}
              carName={
                selectedVehicle
                  ? `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`
                  : ''
              }
              onFeedback={handleFeedback}
            />
          </section>
        )}

      {/* Platform Insights - Strengths, Weaknesses, Community Tips */}
      {/* Now includes "Ask AL" button - PlatformRecommendationCard was REMOVED as redundant */}
      {sectionFilters.platformInsights &&
        selectedVehicleId &&
        selectedVehicleId !== 'all' &&
        (selectedVehicleDetails?.definingStrengths?.length > 0 ||
          selectedVehicleDetails?.honestWeaknesses?.length > 0 ||
          tuningProfile?.platform_insights) && (
          <section className={styles.analysisSection}>
            <PlatformInsights
              definingStrengths={selectedVehicleDetails?.definingStrengths || []}
              honestWeaknesses={selectedVehicleDetails?.honestWeaknesses || []}
              platformInsights={tuningProfile?.platform_insights || {}}
              idealOwner={selectedVehicleDetails?.idealOwner}
              notIdealFor={selectedVehicleDetails?.notIdealFor}
              carName={selectedVehicleDetails?.carName}
              onAskAL={() => {
                const vehicle = vehicles.find((v) => v.id === selectedVehicleId);
                if (vehicle) {
                  window.location.href = `/al?context=platform-insights&vehicle=${vehicle.id}`;
                }
              }}
              onFeedback={handleFeedback}
            />
          </section>
        )}

      {/* Smart Feed - Filtered to avoid redundancy with sections above */}
      {/* Only show insights that ADD NEW INFORMATION not already displayed */}
      {sectionFilters.additionalInsights && feedItems.length > 0 && (
        <div className={styles.feedContainer}>
          <div className={styles.feedHeader}>
            <h3 className={styles.feedTitle}>Additional Insights</h3>
            <span className={styles.feedCount}>{feedItems.length}</span>
          </div>

          <div className={styles.feedList}>
            {feedItems.map((item) => (
              <SmartInsightCard
                key={item.id}
                id={item.id}
                type={item.type}
                title={item.title}
                body={item.body}
                subtext={item.subtext}
                action={item.action}
                onFeedback={handleFeedback}
              />
            ))}
          </div>
        </div>
      )}

      {/* Driving Character section removed - now accessible via info button on garage car image */}
    </div>
  );
}
