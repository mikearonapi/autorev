'use client';

/**
 * Upgrade Center Component - Ultra Compact Layout
 *
 * Features:
 * - Minimal scrolling with condensed UI
 * - Car-specific AI recommendations always visible
 * - Split layout: Categories left, Analytics right
 */

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';

import { Icons } from '@/components/ui/Icons';
import { checkUpgradeConflict } from '@/data/upgradeConflicts.js';
import { useLinkedPost } from '@/hooks/useCommunityData';
import { useTuningProfile } from '@/hooks/useTuningProfile';
import { validateUpgradeSelection, getRequiredUpgrades } from '@/lib/dependencyChecker.js';
import { useTierConfig } from '@/lib/hooks/useAppConfig.js';
import { getAvailableUpgrades, calculateTotalCost } from '@/lib/performance.js';
import {
  getPerformanceProfile,
  calculateReliabilityScore,
  calculateHandlingScore,
} from '@/lib/performanceCalculator';
import { calculateTunability } from '@/lib/tunabilityCalculator.js';
import { UPGRADE_CATEGORIES as SHARED_UPGRADE_CATEGORIES } from '@/lib/upgradeCategories.js';
import { getUpgradeByKey } from '@/lib/upgrades.js';

import { useAuth } from './providers/AuthProvider';
import { useOwnedVehicles } from './providers/OwnedVehiclesProvider';
import { useSavedBuilds } from './providers/SavedBuildsProvider';
import { CategoryNav } from './tuning-shop';
import styles from './UpgradeCenter.module.css';
import UpgradeConfigPanel, {
  calculateConfigHpModifier,
  getDefaultConfig,
} from './UpgradeConfigPanel';
import UpgradeDetailModal from './UpgradeDetailModal';
import VideoPlayer from './VideoPlayer';


// Add swap alias to Icons (not in shared library)
Icons.swap = ({ size = 16 }) => (
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
    <path d="M16 3l4 4-4 4" />
    <path d="M20 7H4" />
    <path d="M8 21l-4-4 4-4" />
    <path d="M4 17h16" />
  </svg>
);

// Build Recommendation configs (presets)
const BUILD_RECOMMENDATIONS = [
  { key: 'streetSport', label: 'Street' },
  { key: 'trackPack', label: 'Track' },
  { key: 'drag', label: 'Drag' },
];

// Custom option (separate from recommendations)
const CUSTOM_BUILD = { key: 'custom', label: 'Custom' };

// Legacy PACKAGES constant for backwards compatibility
const _PACKAGES = [...BUILD_RECOMMENDATIONS, CUSTOM_BUILD];

// Map icon names from shared categories to local Icon components
const ICON_NAME_TO_COMPONENT = {
  bolt: Icons.bolt,
  turbo: Icons.turbo,
  target: Icons.target,
  disc: Icons.disc,
  thermometer: Icons.thermometer,
  circle: Icons.circle,
  wind: Icons.wind,
  settings: Icons.settings,
  grid: Icons.settings, // fallback for 'other' category
};

/**
 * UPGRADE_CATEGORIES - derived from shared definitions
 * This ensures consistency with BuildModsList and other components.
 * Icon names are mapped to local Icon components for rendering.
 */
const UPGRADE_CATEGORIES = SHARED_UPGRADE_CATEGORIES.map((cat) => ({
  ...cat,
  icon: ICON_NAME_TO_COMPONENT[cat.icon] || Icons.settings,
}));

/* VirtualDynoChart extracted to components/VirtualDynoChart.jsx */

/* PowerBreakdown and CalculatedPerformance components removed - were only used in Advanced mode */

/**
 * Compact Metric Row
 */
function _MetricRow({ icon: Icon, label, stockValue, upgradedValue, unit, isLowerBetter = false }) {
  // Defensive: handle missing values
  const stock = stockValue ?? 0;
  const upgraded = upgradedValue ?? stock;

  const hasImproved = isLowerBetter ? upgraded < stock : upgraded > stock;
  const improvement = Math.abs(upgraded - stock);

  const formatValue = (val) => {
    if (val === undefined || val === null || isNaN(val)) return '—';
    if (unit === 'g') return val.toFixed(2);
    if (unit === 's') return val.toFixed(1);
    return Math.round(val);
  };

  const maxValues = { hp: 1200, s: 8, ft: 150, g: 1.6 };
  const maxValue = maxValues[unit === ' hp' ? 'hp' : unit] || 1200;

  const stockPercent = isLowerBetter
    ? ((maxValue - stock) / maxValue) * 100
    : (stock / maxValue) * 100;
  const upgradedPercent = isLowerBetter
    ? ((maxValue - upgraded) / maxValue) * 100
    : (upgraded / maxValue) * 100;

  return (
    <div className={styles.metric}>
      <div className={styles.metricHeader}>
        <span className={styles.metricLabel}>
          <Icon size={12} />
          {label}
        </span>
        <span className={styles.metricValues}>
          {hasImproved ? (
            <>
              <span className={styles.stockVal}>{formatValue(stock)}</span>
              <span className={styles.arrow}>→</span>
              <span className={styles.upgradedVal}>
                {formatValue(upgraded)}
                {unit}
              </span>
              <span className={styles.gain}>
                {isLowerBetter ? '-' : '+'}
                {formatValue(improvement)}
              </span>
            </>
          ) : (
            <span className={styles.currentVal}>
              {formatValue(stock)}
              {unit}
            </span>
          )}
        </span>
      </div>
      <div className={styles.track}>
        <div className={styles.fillStock} style={{ width: `${Math.min(100, stockPercent)}%` }} />
        {hasImproved && (
          <div
            className={styles.fillUpgrade}
            style={{
              left: `${stockPercent}%`,
              width: `${Math.abs(upgradedPercent - stockPercent)}%`,
            }}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Experience Score Bar
 */
function _ScoreBar({ label, stockScore, upgradedScore }) {
  // Safety checks - handle null/undefined scores
  const safeStockScore = stockScore ?? 7;
  const safeUpgradedScore = upgradedScore ?? safeStockScore;
  const hasImproved = safeUpgradedScore > safeStockScore;
  const delta = safeUpgradedScore - safeStockScore;

  return (
    <div className={styles.scoreRow}>
      <div className={styles.scoreHeader}>
        <span className={styles.scoreLabel}>{label}</span>
        <span className={styles.scoreValues}>
          {hasImproved ? (
            <>
              <span className={styles.stockVal}>{safeStockScore.toFixed(1)}</span>
              <span className={styles.arrow}>→</span>
              <span className={styles.upgradedVal}>{safeUpgradedScore.toFixed(1)}</span>
            </>
          ) : (
            <span className={styles.currentVal}>{safeStockScore.toFixed(1)}/10</span>
          )}
        </span>
      </div>
      <div className={styles.track}>
        <div className={styles.fillStock} style={{ width: `${(safeStockScore / 10) * 100}%` }} />
        {hasImproved && (
          <div
            className={styles.fillUpgrade}
            style={{ left: `${(safeStockScore / 10) * 100}%`, width: `${(delta / 10) * 100}%` }}
          />
        )}
      </div>
    </div>
  );
}

/* LapTimeEstimator extracted to components/LapTimeEstimator.jsx */
/* HandlingBalanceIndicator extracted to components/HandlingBalanceIndicator.jsx */
/* AeroBalanceChart extracted to components/AeroBalanceChart.jsx */
/* PowerLimitsAdvisory extracted to components/PowerLimitsAdvisory.jsx */

/**
 * Brand Recommendations - Shows popular brands from database
 */
function _BrandRecommendations({ brandRecs, category = 'all' }) {
  if (!brandRecs || Object.keys(brandRecs).length === 0) return null;

  // Map category keys to display names
  const categoryLabels = {
    turbo: 'Turbo/SC',
    exhaust: 'Exhaust',
    intake: 'Intake',
    suspension: 'Suspension',
    brakes: 'Brakes',
    wheels: 'Wheels',
    ecu: 'ECU Tuning',
    fuel: 'Fuel System',
    clutch: 'Clutch',
  };

  const filteredRecs = category === 'all' ? brandRecs : { [category]: brandRecs[category] };

  return (
    <div className={styles.brandRecs}>
      <div className={styles.brandRecsHeader}>
        <Icons.star size={16} />
        <span>Popular Brands</span>
      </div>

      <div className={styles.brandRecsList}>
        {Object.entries(filteredRecs).map(([cat, brands]) => {
          if (!brands || !Array.isArray(brands) || brands.length === 0) return null;

          return (
            <div key={cat} className={styles.brandRecCategory}>
              <span className={styles.brandRecCategoryLabel}>{categoryLabels[cat] || cat}</span>
              <div className={styles.brandRecBrands}>
                {brands.slice(0, 4).map((brand) => (
                  <span key={brand} className={styles.brandRecBrand}>
                    {brand}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Conflict Notification Toast
 */
function ConflictNotification({ message, onDismiss, replacedUpgrade: _replacedUpgrade }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className={styles.conflictToast}>
      <div className={styles.conflictToastIcon}>
        <Icons.swap size={16} />
      </div>
      <div className={styles.conflictToastContent}>
        <span className={styles.conflictToastTitle}>Upgrade Replaced</span>
        <span className={styles.conflictToastMessage}>{message}</span>
      </div>
      <button
        className={styles.conflictToastClose}
        onClick={onDismiss}
        aria-label="Dismiss notification"
      >
        <Icons.x size={14} />
      </button>
    </div>
  );
}

/**
 * Dependency Warnings Banner
 * Shows critical issues and warnings for the current upgrade selection
 */
function DependencyWarnings({ validation, requiredUpgrades, onAddUpgrade }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Don't render if no issues (only show for actual problems, not synergies)
  if (!validation || (validation.totalIssues === 0 && requiredUpgrades?.length === 0)) {
    return null;
  }

  const hasCritical = validation.critical?.length > 0 || requiredUpgrades?.length > 0;
  const _hasWarnings = validation.warnings?.length > 0;

  return (
    <div
      className={`${styles.dependencyWarnings} ${hasCritical ? styles.dependencyWarningsCritical : ''}`}
    >
      <button
        className={styles.dependencyWarningsHeader}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className={styles.dependencyWarningsTitle}>
          {hasCritical ? (
            <Icons.alertTriangle size={16} className={styles.criticalIcon} />
          ) : (
            <Icons.info size={16} className={styles.warningIcon} />
          )}
          <span>{hasCritical ? 'Build Issues Detected' : 'Build Recommendations'}</span>
          <span className={styles.dependencyWarningsCount}>
            {validation.totalIssues + (requiredUpgrades?.length || 0)}{' '}
            {validation.totalIssues + (requiredUpgrades?.length || 0) === 1 ? 'item' : 'items'}
          </span>
        </div>
        <Icons.chevronDown
          size={16}
          className={`${styles.collapseIcon} ${isCollapsed ? styles.collapsed : ''}`}
        />
      </button>

      {!isCollapsed && (
        <div className={styles.dependencyWarningsContent}>
          {/* Required Upgrades (Hard Dependencies) */}
          {requiredUpgrades?.length > 0 && (
            <div className={styles.warningSection}>
              <div className={styles.warningSectionTitle}>Required Supporting Mods</div>
              {requiredUpgrades.map((req, idx) => (
                <div key={idx} className={`${styles.warningItem} ${styles.warningItemCritical}`}>
                  <Icons.alertTriangle size={14} className={styles.criticalIcon} />
                  <div className={styles.warningItemContent}>
                    <span className={styles.warningItemMessage}>
                      <strong>{req.upgrade?.name || req.upgradeKey}</strong> is required for{' '}
                      {req.requiredBy}
                    </span>
                    <span className={styles.warningItemReason}>{req.reason}</span>
                  </div>
                  {onAddUpgrade && (
                    <button
                      className={styles.addRequiredBtn}
                      onClick={() => onAddUpgrade(req.upgradeKey)}
                    >
                      Add
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Critical Issues */}
          {validation.critical?.length > 0 && (
            <div className={styles.warningSection}>
              <div className={styles.warningSectionTitle}>Critical Issues</div>
              {validation.critical.map((issue, idx) => (
                <div key={idx} className={`${styles.warningItem} ${styles.warningItemCritical}`}>
                  <Icons.alertTriangle size={14} className={styles.criticalIcon} />
                  <div className={styles.warningItemContent}>
                    <span className={styles.warningItemMessage}>{issue.message}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Warnings */}
          {validation.warnings?.length > 0 && (
            <div className={styles.warningSection}>
              <div className={styles.warningSectionTitle}>Recommendations</div>
              {validation.warnings.map((warning, idx) => (
                <div key={idx} className={`${styles.warningItem} ${styles.warningItemWarning}`}>
                  <Icons.info size={14} className={styles.warningIcon} />
                  <div className={styles.warningItemContent}>
                    <span className={styles.warningItemMessage}>{warning.message}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Category Popup Modal
 * Now allows toggling upgrades regardless of package - auto-switches to Custom mode
 * Shows inline configuration panel for upgrades with configOptions
 */
function CategoryPopup({
  category,
  upgrades,
  selectedModules,
  onToggle,
  onClose,
  onInfoClick,
  isCustomMode: _isCustomMode,
  allUpgrades,
  upgradeConfigs, // Config state for all upgrades
  onConfigChange, // Handler for config changes
}) {
  const popupRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Helper to get upgrade name by key
  const getUpgradeName = useCallback(
    (key) => {
      const upgrade = allUpgrades?.find((u) => u.key === key);
      return upgrade?.name || key;
    },
    [allUpgrades]
  );

  // Check which upgrades would be replaced for each unselected upgrade
  // Fixed: use conflictsWith instead of conflictingUpgrades
  const getReplacementInfo = useCallback(
    (upgradeKey) => {
      if (selectedModules.includes(upgradeKey)) return null;

      try {
        const conflict = checkUpgradeConflict(upgradeKey, selectedModules);
        if (!conflict) return null;

        // Use conflictsWith (the correct property name from checkUpgradeConflict)
        const conflictingKeys = conflict.conflictsWith || [];

        return {
          ...conflict,
          conflictingUpgrades: conflictingKeys,
          names: conflictingKeys.map((key) => getUpgradeName(key)),
        };
      } catch {
        // Defensive: if conflict detection fails, return null
        return null;
      }
    },
    [selectedModules, getUpgradeName]
  );

  const Icon = category.icon;

  return (
    <div className={styles.popupOverlay}>
      <div
        className={styles.categoryPopup}
        ref={popupRef}
        style={{ '--cat-color': category.color }}
      >
        <div className={styles.popupHeader}>
          <div className={styles.popupTitle}>
            <Icon size={16} />
            <span>{category.label}</span>
            <span className={styles.popupCount}>{upgrades.length}</span>
          </div>
          <button
            className={styles.popupClose}
            onClick={onClose}
            aria-label="Close upgrade options"
          >
            <Icons.x size={14} />
          </button>
        </div>
        <div className={styles.popupContent}>
          {upgrades.map((upgrade) => {
            const isSelected = selectedModules.includes(upgrade.key);
            const replacementInfo = !isSelected ? getReplacementInfo(upgrade.key) : null;
            const hasConflict = replacementInfo !== null;
            const hasConfigOptions =
              upgrade.configOptions && Object.keys(upgrade.configOptions).length > 0;
            const currentConfig = upgradeConfigs?.[upgrade.key] || {};

            return (
              <div
                key={upgrade.key}
                className={`${styles.upgradeRow} ${isSelected ? styles.upgradeRowSelected : ''} ${hasConflict ? styles.upgradeRowConflict : ''}`}
              >
                <div className={styles.upgradeMainRow}>
                  <button
                    type="button"
                    className={styles.upgradeToggle}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Pass the full upgrade object so we can check for configOptions
                      onToggle(upgrade.key, upgrade.name, replacementInfo, upgrade);
                    }}
                    aria-label={`${isSelected ? 'Deselect' : 'Select'} ${upgrade.name}`}
                    aria-checked={isSelected}
                    role="checkbox"
                  >
                    <span className={styles.checkbox} aria-hidden="true">
                      {isSelected && <Icons.check size={10} />}
                    </span>
                    <span className={styles.upgradeName}>{upgrade.name}</span>
                  </button>
                  {hasConflict && (
                    <span
                      className={styles.conflictBadge}
                      title={`Replaces: ${replacementInfo.names.join(', ')}`}
                    >
                      <Icons.swap size={10} />
                    </span>
                  )}
                  <button
                    type="button"
                    className={styles.infoBtn}
                    onClick={() => onInfoClick(upgrade)}
                    aria-label={`Learn more about ${upgrade.name}`}
                    title={`Learn more about ${upgrade.name}`}
                  >
                    <Icons.info size={16} />
                  </button>
                </div>

                {/* Inline config panel - shows when upgrade is selected and has configOptions */}
                {isSelected && hasConfigOptions && (
                  <UpgradeConfigPanel
                    upgradeKey={upgrade.key}
                    configOptions={upgrade.configOptions}
                    currentConfig={currentConfig}
                    onChange={onConfigChange}
                    selectedUpgrades={selectedModules}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Main Upgrade Center Component
 */
export default function UpgradeCenter({
  car,
  initialBuildId = null,
  onChangeCar = null,
  onBuildSummaryUpdate = null,
  factoryConfig = null,
  onFactoryConfigChange: _onFactoryConfigChange = null,
  selectedWheelFitment = null,
  onWheelFitmentChange: _onWheelFitmentChange = null,
  openSaveModalOnMount = false,
  onSaveModalOpened = null,
}) {
  const { isAuthenticated: _isAuthenticated, user: _user } = useAuth();
  const { saveBuild, updateBuild, getBuildById, canSave } = useSavedBuilds();
  const { vehicles, applyModifications, addVehicle } = useOwnedVehicles();
  const { tierConfig } = useTierConfig();

  // Vehicle-specific tuning profile (safe additive enhancement)
  const {
    profile: _tuningProfile,
    hasProfile: _hasTuningProfile,
    loading: _tuningProfileLoading,
  } = useTuningProfile(car);

  // All useState hooks must be called unconditionally (before any early returns)
  const [selectedPackage, setSelectedPackage] = useState('stock');
  const [selectedModules, setSelectedModules] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedUpgradeForModal, setSelectedUpgradeForModal] = useState(null);
  const [currentBuildId, setCurrentBuildId] = useState(initialBuildId);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [buildName, setBuildName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveToGarage, setSaveToGarage] = useState(false);
  const [selectedGarageVehicle, setSelectedGarageVehicle] = useState(null);
  const [conflictNotification, setConflictNotification] = useState(null);
  const [isAddingToGarage, setIsAddingToGarage] = useState(false);
  const [vehicleAddedSuccess, setVehicleAddedSuccess] = useState(false);

  // Selected parts for builds (loaded from saved builds, UI removed)
  const [selectedParts, setSelectedParts] = useState([]);

  // Upgrade configurations - stores config for upgrades with configOptions
  // e.g., { 'downpipe': { type: 'catless' }, 'coilovers': { springRate: 'sport' } }
  const [upgradeConfigs, setUpgradeConfigs] = useState({});

  // Build photos - stored separately and linked to build ID
  const [buildImages, setBuildImages] = useState([]);

  // Track if current build has a linked community post (React Query)
  const {
    data: linkedCommunityPost,
    isLoading: checkingCommunityPost,
    refetch: refetchLinkedPost,
  } = useLinkedPost(currentBuildId, { enabled: !!currentBuildId });

  // Toggle for whether to share to / keep in community when saving
  const [shareToNewCommunity, setShareToNewCommunity] = useState(false);

  // Separate community title (public name like "My Stormtrooper") from build name (internal)
  const [communityTitle, setCommunityTitle] = useState('');

  // Video player state
  const [selectedVideo, setSelectedVideo] = useState(null);

  // Track which build ID we've already loaded to prevent re-loading on every getBuildById change
  // This fixes a bug where auto-save causes getBuildById reference to change, triggering the
  // load effect which resets selectedModules to the (stale) saved value
  const loadedBuildIdRef = useRef(null);

  // Note: Advanced Tuning mode has been removed - all users use Basic mode

  // Defensive: use safe car slug for effects - prevents crashes if car is undefined
  const safeCarSlug = car?.slug || '';

  // Reset upgrade state when car changes
  // Reset state when car changes
  useEffect(() => {
    setSelectedModules([]);
    setSelectedPackage('stock');
    setCurrentBuildId(null);
    setActiveCategory(null);
    // Reset the loaded build tracker so a new build can be loaded for this car
    loadedBuildIdRef.current = null;
  }, [safeCarSlug]);

  // Load initial build if provided
  // IMPORTANT: Only load ONCE per build ID to prevent auto-save from triggering a reload
  // that would reset selectedModules to the stale saved value
  useEffect(() => {
    if (initialBuildId && safeCarSlug) {
      // Skip if we've already loaded this build
      if (loadedBuildIdRef.current === initialBuildId) {
        return;
      }

      const build = getBuildById(initialBuildId);
      if (build && build.carSlug === safeCarSlug) {
        // Mark this build as loaded BEFORE setting state to prevent race conditions
        loadedBuildIdRef.current = initialBuildId;

        // IMPORTANT: Normalize upgrades to string keys
        // Database may store full objects or just keys depending on how the build was saved
        const normalizedUpgrades = (build.upgrades || [])
          .map((u) => (typeof u === 'string' ? u : u?.key))
          .filter(Boolean);

        setSelectedModules(normalizedUpgrades);
        setSelectedParts(build.parts || build.selectedParts || []);
        setSelectedPackage('custom');
        setCurrentBuildId(initialBuildId);
        // Load saved build name
        if (build.name) {
          setBuildName(build.name);
        }
        // Load upgrade configurations (e.g., catless downpipe, coilover spring rates)
        if (build.upgradeConfigs) {
          setUpgradeConfigs(build.upgradeConfigs);
        }
      }
    }
  }, [initialBuildId, getBuildById, safeCarSlug]);

  // Load build images when build ID changes
  // Load build images via API route for native app compatibility
  // Includes images linked by car_slug for cross-feature sharing with garage
  useEffect(() => {
    async function loadBuildImages() {
      if (!currentBuildId) {
        setBuildImages([]);
        return;
      }

      try {
        // Build URL with optional carSlug for cross-feature sharing
        let url = `/api/builds/${currentBuildId}/images`;
        if (safeCarSlug) {
          url += `?carSlug=${encodeURIComponent(safeCarSlug)}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
          console.error('[UpgradeCenter] Error loading build images:', response.statusText);
          setBuildImages([]);
          return;
        }

        const { images } = await response.json();
        setBuildImages(images || []);
      } catch (err) {
        console.error('[UpgradeCenter] Error loading build images:', err);
        setBuildImages([]);
      }
    }

    loadBuildImages();
  }, [currentBuildId, safeCarSlug]);

  // Sync form state when linked community post data changes
  useEffect(() => {
    if (linkedCommunityPost) {
      setShareToNewCommunity(linkedCommunityPost.is_published !== false);
      if (linkedCommunityPost.title) {
        setCommunityTitle(linkedCommunityPost.title);
      }
    } else if (!checkingCommunityPost && currentBuildId) {
      // No linked post found - reset form state
      setShareToNewCommunity(false);
      setCommunityTitle('');
    }
  }, [linkedCommunityPost, checkingCommunityPost, currentBuildId]);

  // Open save modal on mount if requested (e.g., from Projects share button)
  // This unifies sharing through the save modal's community toggle
  useEffect(() => {
    if (openSaveModalOnMount && currentBuildId && !checkingCommunityPost) {
      // Set default build name if not already set
      if (!buildName && car) {
        setBuildName(`${car.name} Build`);
      }
      setShowSaveModal(true);
      // Notify parent that modal has been opened
      onSaveModalOpened?.();
    }
  }, [
    openSaveModalOnMount,
    currentBuildId,
    checkingCommunityPost,
    buildName,
    car,
    onSaveModalOpened,
  ]);

  // Guard: return empty upgrades structure if no car
  const availableUpgrades = useMemo(() => {
    if (!car) return { packages: [], modulesByCategory: {} };
    return getAvailableUpgrades(car);
  }, [car]);

  const packageUpgrades = useMemo(() => {
    if (selectedPackage === 'stock') return [];
    if (selectedPackage === 'custom') return selectedModules;
    const pkg = availableUpgrades.packages?.find((p) => p.key === selectedPackage);
    return pkg?.includedUpgradeKeys || [];
  }, [selectedPackage, selectedModules, availableUpgrades.packages]);

  const effectiveModules = useMemo(() => {
    if (selectedPackage === 'stock') return [];
    if (selectedPackage === 'custom') return selectedModules;
    return packageUpgrades;
  }, [selectedPackage, selectedModules, packageUpgrades]);

  // Guard: return safe defaults if no car
  const profile = useMemo(() => {
    if (!car) {
      return {
        stockMetrics: { hp: 0, zeroToSixty: 0, braking60To0: 0, lateralG: 0 },
        upgradedMetrics: { hp: 0, zeroToSixty: 0, braking60To0: 0, lateralG: 0 },
        stockScores: { drivability: 0, reliabilityHeat: 0, soundEmotion: 0 },
        upgradedScores: { drivability: 0, reliabilityHeat: 0, soundEmotion: 0 },
        selectedUpgrades: [],
      };
    }
    const baseProfile = getPerformanceProfile(car, effectiveModules);

    // Calculate HP bonus from upgrade configurations (e.g., catless downpipe vs catted)
    let configHpBonus = 0;
    effectiveModules.forEach((moduleKey) => {
      const upgrade = getUpgradeByKey(moduleKey);
      if (upgrade?.configOptions && upgradeConfigs[moduleKey]) {
        configHpBonus += calculateConfigHpModifier(
          upgrade.configOptions,
          upgradeConfigs[moduleKey]
        );
      }
    });

    // Apply config HP bonus to upgraded metrics
    if (configHpBonus > 0) {
      baseProfile.upgradedMetrics = {
        ...baseProfile.upgradedMetrics,
        hp: (baseProfile.upgradedMetrics.hp || 0) + configHpBonus,
      };
    }

    // Apply tire compound grip bonus to lateralG
    const tireGripBonus = selectedWheelFitment?.gripBonus || 0;
    if (tireGripBonus > 0 && baseProfile.upgradedMetrics.lateralG) {
      baseProfile.upgradedMetrics = {
        ...baseProfile.upgradedMetrics,
        lateralG: Math.min(1.6, baseProfile.upgradedMetrics.lateralG + tireGripBonus),
      };
      // Also slightly improve braking with better grip
      if (baseProfile.upgradedMetrics.braking60To0) {
        const brakingImprovement = tireGripBonus * 5; // ~5ft improvement per 0.1g grip
        baseProfile.upgradedMetrics.braking60To0 = Math.max(
          85, // minimum realistic braking distance
          baseProfile.upgradedMetrics.braking60To0 - brakingImprovement
        );
      }
    }

    return baseProfile;
  }, [car, effectiveModules, selectedWheelFitment, upgradeConfigs]);

  const totalCost = useMemo(() => {
    if (!car) return { low: 0, high: 0, confidence: 'estimated', confidencePercent: 0 };
    return calculateTotalCost(profile.selectedUpgrades, car);
  }, [profile.selectedUpgrades, car]);

  const hpGain = profile.upgradedMetrics.hp - profile.stockMetrics.hp;
  // Show upgrades if any package selected OR if tire compound affects grip
  const tireGripBonus = selectedWheelFitment?.gripBonus || 0;
  const hasUpgradeEffects = selectedPackage !== 'stock' || tireGripBonus > 0;
  const _showUpgrade = hasUpgradeEffects;
  const isCustomMode = selectedPackage === 'custom';

  // HP values from the standard performanceCalculator (Basic mode only)
  const effectiveHpGain = hpGain;
  const effectiveFinalHp = profile.upgradedMetrics.hp;

  // Dependency Validation - Check for required/recommended supporting mods
  const dependencyValidation = useMemo(() => {
    if (!car || effectiveModules.length === 0) {
      return { isValid: true, critical: [], warnings: [], info: [], synergies: [], totalIssues: 0 };
    }
    return validateUpgradeSelection(effectiveModules, car, { usageProfile: 'mixed' });
  }, [effectiveModules, car]);

  // Get required upgrades (hard dependencies)
  const requiredUpgrades = useMemo(() => {
    if (!car || effectiveModules.length === 0) return [];
    return getRequiredUpgrades(effectiveModules, car);
  }, [effectiveModules, car]);

  // Tunability & Recommendations (with guards for missing car)
  const _tunability = useMemo(() => {
    if (!car) return { score: 0, label: 'Unknown' };
    return calculateTunability(car);
  }, [car]);

  const upgradesByCategory = useMemo(() => {
    const result = {};
    UPGRADE_CATEGORIES.forEach((cat) => {
      const modules = availableUpgrades.modulesByCategory?.[cat.key] || [];
      result[cat.key] = modules;
    });
    return result;
  }, [availableUpgrades.modulesByCategory]);

  const selectedByCategory = useMemo(() => {
    const result = {};
    UPGRADE_CATEGORIES.forEach((cat) => {
      const categoryUpgrades = upgradesByCategory[cat.key] || [];
      result[cat.key] = categoryUpgrades.filter((u) => effectiveModules.includes(u.key)).length;
    });
    return result;
  }, [upgradesByCategory, effectiveModules]);

  // Goal-filtered and sorted categories
  // Categories filtered to those with available upgrades
  const sortedCategories = useMemo(() => {
    return UPGRADE_CATEGORIES.filter(
      (cat) => cat.key !== 'wheels' && (upgradesByCategory[cat.key]?.length || 0) > 0
    );
  }, [upgradesByCategory]);

  // Construct build summary object - Single Source of Truth
  const buildSummary = useMemo(() => {
    const upgradesArray = profile.selectedUpgrades.map((key) => {
      const upgrade = getUpgradeByKey(key);
      return {
        key,
        name: upgrade?.name || key,
        hpGain: upgrade?.hp || 0,
        cost: upgrade?.costLow || 0,
        category: upgrade?.category || 'other',
      };
    });

    return {
      totalHpGain: effectiveHpGain,
      totalTqGain: 0,
      totalCost: totalCost.low || 0,
      upgradeCount: profile.selectedUpgrades.length,
      selectedUpgrades: upgradesArray,
    };
  }, [effectiveHpGain, totalCost.low, profile.selectedUpgrades]);

  // Calculate reliability and handling scores using performanceCalculator (SOURCE OF TRUTH)
  const reliabilityData = useMemo(() => {
    const hpGainPercent = car?.hp && effectiveHpGain > 0 ? effectiveHpGain / car.hp : 0;
    return calculateReliabilityScore(effectiveModules, hpGainPercent);
  }, [effectiveModules, effectiveHpGain, car?.hp]);

  const handlingData = useMemo(() => {
    return calculateHandlingScore(effectiveModules);
  }, [effectiveModules]);

  // Performance metrics for BuildDashboard - MUST match Performance Metrics page exactly
  // Uses profile.upgradedMetrics directly (SOURCE OF TRUTH from calculateUpgradedMetrics)
  // NOT effectiveHpGain/effectiveFinalHp which differ in advanced mode
  const _dashboardMetrics = useMemo(
    () => ({
      stockHp: profile.stockMetrics.hp,
      finalHp: profile.upgradedMetrics.hp,
      hpGain: profile.upgradedMetrics.hp - profile.stockMetrics.hp,
      stockZeroToSixty: profile.stockMetrics.zeroToSixty,
      finalZeroToSixty: profile.upgradedMetrics.zeroToSixty,
      reliabilityScore: reliabilityData.percent,
      handlingScore: handlingData.percent,
    }),
    [
      profile.stockMetrics.hp,
      profile.stockMetrics.zeroToSixty,
      profile.upgradedMetrics.hp,
      profile.upgradedMetrics.zeroToSixty,
      reliabilityData.percent,
      handlingData.percent,
    ]
  );

  // Notify parent of build summary changes
  useEffect(() => {
    if (onBuildSummaryUpdate) {
      onBuildSummaryUpdate(buildSummary);
    }
  }, [onBuildSummaryUpdate, buildSummary]);

  // Listen for save/clear/share events from header buttons and BuildSummaryBar
  useEffect(() => {
    const handleSaveEvent = () => {
      // Open save modal - allow saving even with no upgrades for car configs
      setShowSaveModal(true);
    };

    const handleShareEvent = () => {
      // Open save modal with community sharing enabled
      setShareToNewCommunity(true);
      if (!communityTitle && buildName) {
        setCommunityTitle(buildName);
      }
      setShowSaveModal(true);
    };

    const handleClearEvent = () => {
      setSelectedPackage('stock');
      setSelectedModules([]);
    };

    document.addEventListener('tuning-shop:save-build', handleSaveEvent);
    document.addEventListener('tuning-shop:share-build', handleShareEvent);
    document.addEventListener('tuning-shop:clear-build', handleClearEvent);

    return () => {
      document.removeEventListener('tuning-shop:save-build', handleSaveEvent);
      document.removeEventListener('tuning-shop:share-build', handleShareEvent);
      document.removeEventListener('tuning-shop:clear-build', handleClearEvent);
    };
  }, [communityTitle, buildName]);

  // Flatten all upgrades for name lookups
  const allUpgradesFlat = useMemo(() => {
    return Object.values(upgradesByCategory).flat();
  }, [upgradesByCategory]);

  const handlePackageSelect = (pkgKey) => {
    setSelectedPackage(pkgKey);
    if (pkgKey !== 'custom') setSelectedModules([]);
  };

  const handleModuleToggle = useCallback(
    (moduleKey, moduleName, replacementInfo, upgrade) => {
      // When switching from a package to Custom, preserve the package's upgrades
      const switchingToCustom = !isCustomMode;

      setSelectedModules((prev) => {
        // If switching from a package, start with the package's upgrades instead of empty array
        let baseModules =
          switchingToCustom && packageUpgrades.length > 0 ? [...packageUpgrades] : [...prev];

        // If already selected, remove it
        if (baseModules.includes(moduleKey)) {
          // Also clear the config for this upgrade
          setUpgradeConfigs((prevConfigs) => {
            const newConfigs = { ...prevConfigs };
            delete newConfigs[moduleKey];
            return newConfigs;
          });
          return baseModules.filter((k) => k !== moduleKey);
        }

        // Check for conflicts and resolve them
        if (replacementInfo && replacementInfo.conflictingUpgrades?.length > 0) {
          const replacedNames = replacementInfo.names?.join(' and ') || '';
          if (replacedNames) {
            setConflictNotification({
              message: `"${replacedNames}" has been replaced with "${moduleName}"`,
              replacedUpgrade: replacedNames,
            });
          }

          // Remove conflicting upgrades and add the new one
          const conflictingKeys = replacementInfo.conflictingUpgrades || [];
          baseModules = baseModules.filter((k) => !conflictingKeys.includes(k));

          // Also clear configs for conflicting upgrades
          setUpgradeConfigs((prevConfigs) => {
            const newConfigs = { ...prevConfigs };
            conflictingKeys.forEach((key) => delete newConfigs[key]);
            return newConfigs;
          });
        }

        // If the upgrade has configOptions, initialize with defaults
        if (upgrade?.configOptions) {
          const defaultConfig = getDefaultConfig(upgrade.configOptions);
          if (Object.keys(defaultConfig).length > 0) {
            setUpgradeConfigs((prevConfigs) => ({
              ...prevConfigs,
              [moduleKey]: defaultConfig,
            }));
          }
        }

        return [...baseModules, moduleKey];
      });

      // Switch to custom mode after updating modules
      if (switchingToCustom) {
        setSelectedPackage('custom');
      }
    },
    [isCustomMode, packageUpgrades]
  );

  // Handler for upgrade configuration changes
  const handleUpgradeConfigChange = useCallback((upgradeKey, config) => {
    setUpgradeConfigs((prev) => ({
      ...prev,
      [upgradeKey]: config,
    }));
  }, []);

  const handleSaveBuild = async () => {
    if (!canSave) {
      setSaveError('Please sign in');
      return;
    }
    if (!buildName.trim()) {
      setSaveError('Enter a build name');
      return;
    }
    if (shareToNewCommunity && !communityTitle.trim() && !buildName.trim()) {
      setSaveError('Enter a community title');
      return;
    }
    if (saveToGarage && !selectedGarageVehicle) {
      setSaveError('Select a vehicle from your garage');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      // Use the pre-computed effectiveHpGain and effectiveFinalHp (single source of truth)
      console.log('[UpgradeCenter] Save HP values:', {
        basicHpGain: hpGain,
        effectiveHpGain,
        effectiveFinalHp,
      });

      // Ensure upgrades are always saved as string keys, not full objects
      const normalizedUpgrades = effectiveModules
        .map((u) => (typeof u === 'string' ? u : u?.key))
        .filter(Boolean);

      const buildData = {
        carSlug: car.slug,
        carName: car.name,
        name: buildName.trim(),
        selectedUpgrades: normalizedUpgrades,
        selectedParts,
        upgradeConfigs: upgradeConfigs, // Include upgrade configurations (catless, etc.)
        // Use the pre-computed HP values (single source of truth)
        totalHpGain: effectiveHpGain,
        totalCostLow: totalCost.low,
        totalCostHigh: totalCost.high,
        finalHp: effectiveFinalHp,
        selectedPackage,
        // Include factory configuration and wheel fitment from props
        factoryConfig: factoryConfig || null,
        wheelFitment: selectedWheelFitment || null,
        // Note: Hero image is now stored as is_primary on user_uploaded_images

        // Performance metrics snapshot (for consistent community display)
        stockHp: profile.stockMetrics.hp || car.hp || null,
        stockZeroToSixty: profile.stockMetrics.zeroToSixty || car.zero_to_sixty || null,
        stockBraking60To0: profile.stockMetrics.braking60To0 || car.braking_60_0 || null,
        stockLateralG: profile.stockMetrics.lateralG || car.lateral_g || null,
        finalZeroToSixty: profile.upgradedMetrics.zeroToSixty || null,
        finalBraking60To0: profile.upgradedMetrics.braking60To0 || null,
        finalLateralG: profile.upgradedMetrics.lateralG || null,
        zeroToSixtyImprovement:
          profile.stockMetrics.zeroToSixty && profile.upgradedMetrics.zeroToSixty
            ? Math.round(
                (profile.stockMetrics.zeroToSixty - profile.upgradedMetrics.zeroToSixty) * 100
              ) / 100
            : null,
        brakingImprovement:
          profile.stockMetrics.braking60To0 && profile.upgradedMetrics.braking60To0
            ? Math.round(profile.stockMetrics.braking60To0 - profile.upgradedMetrics.braking60To0)
            : null,
        lateralGImprovement:
          profile.stockMetrics.lateralG && profile.upgradedMetrics.lateralG
            ? Math.round(
                (profile.upgradedMetrics.lateralG - profile.stockMetrics.lateralG) * 1000
              ) / 1000
            : null,
      };

      const result = currentBuildId
        ? await updateBuild(currentBuildId, buildData)
        : await saveBuild(buildData);

      if (result.error) {
        setSaveError(result.error.message || 'Failed to save');
      } else {
        const savedBuildId = result.data?.id || currentBuildId;

        // Link uploaded images to the new build (if any were uploaded before saving)
        // This ensures images uploaded on phone show up when viewing on desktop
        if (savedBuildId && buildImages.length > 0) {
          const unlinkedImages = buildImages.filter((img) => !img.user_build_id);
          if (unlinkedImages.length > 0) {
            try {
              const linkResponse = await fetch('/api/uploads', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  imageIds: unlinkedImages.map((img) => img.id),
                  buildId: savedBuildId,
                }),
              });

              if (linkResponse.ok) {
                console.log(
                  `[UpgradeCenter] Linked ${unlinkedImages.length} images to build ${savedBuildId}`
                );
                // Update local state to reflect the link
                setBuildImages((prev) =>
                  prev.map((img) => ({
                    ...img,
                    user_build_id: savedBuildId,
                  }))
                );
              } else {
                console.error('[UpgradeCenter] Failed to link images to build');
              }
            } catch (err) {
              console.error('[UpgradeCenter] Error linking images:', err);
            }
          }
        }

        // If saving to garage, apply the modifications to the selected vehicle
        if (saveToGarage && selectedGarageVehicle && savedBuildId) {
          const modResult = await applyModifications(selectedGarageVehicle, {
            upgrades: effectiveModules,
            totalHpGain: effectiveHpGain, // Use the same effective HP as saved
            buildId: savedBuildId,
          });

          if (modResult.error) {
            setSaveError('Project saved but failed to apply to garage vehicle');
          }
        }

        // Handle community post based on toggle state
        if (linkedCommunityPost && !shareToNewCommunity) {
          // Unpublish existing post via API (includes cache invalidation)
          try {
            const response = await fetch('/api/community/posts', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                postId: linkedCommunityPost.id,
                isPublished: false,
              }),
            });

            if (response.ok) {
              // Refetch to update the linked post state
              refetchLinkedPost();
            } else {
              console.error('[UpgradeCenter] Error unpublishing community post');
            }
          } catch (err) {
            console.error('[UpgradeCenter] Error unpublishing community post:', err);
          }
        } else if (!linkedCommunityPost && shareToNewCommunity && savedBuildId) {
          // Create new community post - use communityTitle or fall back to buildName
          const postTitle = (communityTitle || buildName).trim();
          try {
            const response = await fetch('/api/community/posts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                postType: 'build',
                title: postTitle,
                description: '',
                buildId: savedBuildId,
                carSlug: car.slug,
                carName: car.name,
                imageIds: [], // Will use images already linked to build
              }),
            });

            if (response.ok) {
              const postData = await response.json();
              console.log('[UpgradeCenter] Created community post:', postData);
              // Will be loaded on next check
            } else {
              console.error('[UpgradeCenter] Error creating community post');
            }
          } catch (err) {
            console.error('[UpgradeCenter] Error creating community post:', err);
          }
        } else if (linkedCommunityPost && shareToNewCommunity) {
          // Update existing post via API (includes cache invalidation)
          // Also update title if user changed it
          const postTitle = (communityTitle || buildName).trim();
          try {
            await fetch('/api/community/posts', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                postId: linkedCommunityPost.id,
                isPublished: true,
                title: postTitle, // Update title in case user changed it
              }),
            });
          } catch (err) {
            console.error('[UpgradeCenter] Error updating community post:', err);
          }
        }

        if (result.data && !currentBuildId) setCurrentBuildId(savedBuildId);
        setShowSaveModal(false);
        setBuildName('');
        setSaveToGarage(false);
        setSelectedGarageVehicle(null);
        setVehicleAddedSuccess(false);
        setSelectedGarageVehicle(null);
      }
    } catch {
      setSaveError('Error saving build');
    } finally {
      setIsSaving(false);
    }
  };

  // Early return AFTER all hooks to satisfy React Rules of Hooks
  // This ensures hooks are called in the same order on every render
  if (!car || !safeCarSlug) {
    console.warn('[UpgradeCenter] Missing or invalid car prop');
    return (
      <div className={styles.section}>
        <p style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', padding: '40px' }}>
          Unable to load upgrade center. Please select a car.
        </p>
        {onChangeCar && (
          <button
            onClick={onChangeCar}
            style={{
              margin: '0 auto',
              display: 'block',
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #d4af37, #b8973a)',
              border: 'none',
              borderRadius: '8px',
              color: '#000',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Select a Car
          </button>
        )}
      </div>
    );
  }

  const _tierInfo = tierConfig[car.tier] || {};
  const activeCategoryData = UPGRADE_CATEGORIES.find((c) => c.key === activeCategory);

  // Get user's selected hero image (is_primary = true) or fall back to stock
  return (
    <div className={styles.upgradeCenter}>
      {/* ═══════════════════════════════════════════════════════════════════════
          BUILD RECOMMENDATIONS - Quick presets
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className={styles.buildRecommendationsSection}>
        <div className={styles.buildRecommendationsCard}>
          <div className={styles.buildRecommendationsHeader}>
            <Icons.settings size={16} />
            <span>Build Recommendations</span>
          </div>
          {/* Street, Track, Drag on first row */}
          <div className={styles.buildRecommendationsGrid}>
            {BUILD_RECOMMENDATIONS.map((pkg) => (
              <button
                key={pkg.key}
                className={`${styles.buildRecBtn} ${selectedPackage === pkg.key ? styles.buildRecBtnActive : ''}`}
                onClick={() => handlePackageSelect(pkg.key)}
              >
                {pkg.label}
              </button>
            ))}
          </div>
          {/* Custom on second row */}
          <div className={styles.buildRecommendationsCustomRow}>
            <button
              className={`${styles.buildRecBtnCustomFull} ${selectedPackage === 'custom' ? styles.buildRecBtnActive : ''}`}
              onClick={() => handlePackageSelect('custom')}
            >
              <Icons.settings size={14} />
              <span>Custom Build</span>
              <span className={styles.customBuildHint}>Pick your own upgrades</span>
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          WORKSPACE - Build configuration (sidebar only, no performance panel)
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className={styles.workspace}>
        {/* Sidebar - Build Configuration */}
        <div className={styles.sidebarFull}>
          {/* ═══════════════════════════════════════════════════════════════
              UPGRADE CATEGORIES
              ═══════════════════════════════════════════════════════════════ */}

          {/* Upgrade Categories Card */}
          <div className={styles.sidebarCard}>
            <div className={styles.sidebarCardHeader}>
              <Icons.bolt size={16} />
              <span className={styles.sidebarCardTitle}>Upgrade Categories</span>
            </div>
            <div className={styles.sidebarCardContent}>
              <div className={styles.categoryList}>
                <CategoryNav
                  categories={sortedCategories.map((c) => c.key)}
                  activeCategory={activeCategory}
                  onCategoryChange={setActiveCategory}
                  selectedCounts={selectedByCategory}
                  variant="list"
                />
              </div>
            </div>
          </div>

          {/* NOTE: Wheels & Tires section removed - fitment data not available */}
          {/* NOTE: Advanced Tuning section removed - using Basic mode only */}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            NOTE: Performance Metrics, Experience Scores, and Shopping List
            have been moved to dedicated pages (Data and Parts)
            ═══════════════════════════════════════════════════════════════ */}
      </div>

      {/* NOTE: Save Build button removed from bottom - now located in top nav (MyGarageSubNav) */}

      {/* ═══════════════════════════════════════════════════════════════════════
          BUILD ISSUES - Shown at bottom so users see them before continuing
          Moved here from top to prevent users from missing issues after scrolling
          ═══════════════════════════════════════════════════════════════════════ */}
      {effectiveModules.length > 0 && (
        <DependencyWarnings
          validation={dependencyValidation}
          requiredUpgrades={requiredUpgrades}
          onAddUpgrade={(upgradeKey) => {
            // Add the required upgrade by toggling it on
            const upgrade = getUpgradeByKey(upgradeKey);
            handleModuleToggle(upgradeKey, upgrade?.name || upgradeKey, null, upgrade);
          }}
        />
      )}

      {/* Popups */}
      {activeCategory && activeCategoryData && (
        <CategoryPopup
          category={activeCategoryData}
          upgrades={upgradesByCategory[activeCategory] || []}
          selectedModules={effectiveModules}
          onToggle={handleModuleToggle}
          onClose={() => setActiveCategory(null)}
          onInfoClick={(u) => setSelectedUpgradeForModal(getUpgradeByKey(u.key) || u)}
          isCustomMode={isCustomMode}
          allUpgrades={allUpgradesFlat}
          upgradeConfigs={upgradeConfigs}
          onConfigChange={handleUpgradeConfigChange}
        />
      )}

      {conflictNotification && (
        <ConflictNotification
          message={conflictNotification.message}
          replacedUpgrade={conflictNotification.replacedUpgrade}
          onDismiss={() => setConflictNotification(null)}
        />
      )}

      {selectedUpgradeForModal && (
        <UpgradeDetailModal
          upgrade={selectedUpgradeForModal}
          onClose={() => setSelectedUpgradeForModal(null)}
          showAddToBuild={false}
        />
      )}

      {/* Video Player Modal */}
      {selectedVideo && (
        <VideoPlayer video={selectedVideo} onClose={() => setSelectedVideo(null)} autoPlay={true} />
      )}

      {showSaveModal && (
        <div className={styles.modalOverlay} onClick={() => setShowSaveModal(false)}>
          <div className={styles.saveModal} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className={styles.saveModalHeader}>
              <div className={styles.saveModalTitleGroup}>
                <Icons.save size={20} className={styles.saveModalIcon} />
                <h3 className={styles.saveModalTitle}>Save Build</h3>
              </div>
              <button
                className={styles.saveModalClose}
                onClick={() => setShowSaveModal(false)}
                aria-label="Close save build modal"
              >
                <Icons.x size={16} />
              </button>
            </div>

            {/* Body */}
            <div className={styles.saveModalBody}>
              {/* Build Name Input */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Build Name</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={buildName}
                  onChange={(e) => setBuildName(e.target.value)}
                  placeholder="e.g., Street Build, Track Setup"
                  autoFocus
                />
              </div>

              {/* Build Summary */}
              <div className={styles.buildSummaryCard}>
                <div className={styles.buildSummaryRow}>
                  <span className={styles.buildSummaryLabel}>Vehicle</span>
                  <span className={styles.buildSummaryValue}>{car?.name}</span>
                </div>
                <div className={styles.buildSummaryRow}>
                  <span className={styles.buildSummaryLabel}>Upgrades</span>
                  <span className={styles.buildSummaryValue}>
                    {effectiveModules.length} selected
                  </span>
                </div>
                {effectiveHpGain > 0 && (
                  <div className={styles.buildSummaryRow}>
                    <span className={styles.buildSummaryLabel}>HP Gain</span>
                    <span className={styles.buildSummaryValueGain}>+{effectiveHpGain} hp</span>
                  </div>
                )}
                <div className={styles.buildSummaryRow}>
                  <span className={styles.buildSummaryLabel}>Est. Cost</span>
                  <span className={styles.buildSummaryValue}>
                    ${(totalCost.low || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Save to Garage Option - Always show */}
              <div className={styles.garageOptionSection}>
                <label
                  className={styles.garageCheckboxLabel}
                  onClick={() => setSaveToGarage(!saveToGarage)}
                >
                  <div
                    className={`${styles.customCheckbox} ${saveToGarage ? styles.customCheckboxChecked : ''}`}
                  >
                    {saveToGarage && <Icons.check size={12} />}
                  </div>
                  <span>Apply to a vehicle in my garage</span>
                </label>

                {saveToGarage &&
                  (() => {
                    const matchingVehicles =
                      vehicles?.filter((v) => v.matchedCarSlug === car.slug) || [];

                    // Show select if we have matching vehicles OR if we already selected one (just added)
                    if (matchingVehicles.length > 0 || selectedGarageVehicle) {
                      return (
                        <>
                          <select
                            className={styles.garageVehicleSelect}
                            value={selectedGarageVehicle || ''}
                            onChange={(e) => setSelectedGarageVehicle(e.target.value)}
                          >
                            <option value="">Select vehicle...</option>
                            {matchingVehicles.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.nickname || `${v.year} ${v.make} ${v.model}`}
                                {v.trim ? ` ${v.trim}` : ''}
                              </option>
                            ))}
                            {/* If selectedGarageVehicle is set but not in the list yet, show it */}
                            {selectedGarageVehicle &&
                              !matchingVehicles.find((v) => v.id === selectedGarageVehicle) && (
                                <option value={selectedGarageVehicle}>
                                  {car.year} {car.make} {car.model} (just added)
                                </option>
                              )}
                          </select>
                          {vehicleAddedSuccess && (
                            <div className={styles.vehicleAddedSuccess}>
                              <Icons.check size={12} />
                              Vehicle added to garage!
                            </div>
                          )}
                        </>
                      );
                    }

                    // No matching vehicles - show add button
                    return (
                      <div className={styles.addToGaragePrompt}>
                        <p className={styles.addToGarageText}>No {car.name} in your garage yet</p>
                        <button
                          className={styles.addToGarageBtn}
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsAddingToGarage(true);
                            setSaveError(null);
                            try {
                              // Parse year from car.years field (e.g., "2017-2024")
                              const yearMatch = car.years?.match(/(\d{4})/);
                              const year = yearMatch
                                ? parseInt(yearMatch[1])
                                : new Date().getFullYear();

                              // Extract make and model from car.name (e.g., "Nissan GT-R")
                              let make = '';
                              let model = car.name || '';

                              // Handle Porsche models that start with numbers
                              if (
                                car.name?.startsWith('718') ||
                                car.name?.startsWith('911') ||
                                car.name?.startsWith('981') ||
                                car.name?.startsWith('997') ||
                                car.name?.startsWith('987') ||
                                car.name?.startsWith('991') ||
                                car.name?.startsWith('992')
                              ) {
                                make = 'Porsche';
                              } else if (car.name) {
                                const parts = car.name.split(' ');
                                make = parts[0] || '';
                                model = parts.slice(1).join(' ') || car.name;
                              }

                              const newVehicle = {
                                year,
                                make,
                                model,
                                matchedCarSlug: car.slug,
                                nickname: '',
                              };
                              console.log('[SaveModal] Adding vehicle:', newVehicle);
                              const result = await addVehicle(newVehicle);
                              console.log('[SaveModal] Add vehicle result:', result);

                              if (result?.error) {
                                setSaveError(result.error.message || 'Failed to add vehicle');
                              } else if (result?.data) {
                                const vehicleId = result.data.id;
                                console.log('[SaveModal] Setting selected vehicle:', vehicleId);
                                setSelectedGarageVehicle(vehicleId);
                                setVehicleAddedSuccess(true);
                                // Clear success after 3 seconds
                                setTimeout(() => setVehicleAddedSuccess(false), 3000);
                              } else {
                                setSaveError('Vehicle added but no ID returned');
                              }
                            } catch (err) {
                              console.error('[SaveModal] Failed to add vehicle:', err);
                              setSaveError('Failed to add vehicle to garage');
                            }
                            setIsAddingToGarage(false);
                          }}
                          disabled={isAddingToGarage}
                          type="button"
                        >
                          {isAddingToGarage ? (
                            <>
                              <span className={styles.savingSpinner} />
                              Adding...
                            </>
                          ) : (
                            <>
                              <Icons.plus size={14} />
                              Add {car.name} to Garage
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })()}
              </div>

              {/* Community Sharing Toggle - Always show */}
              <div className={styles.communityToggleSection}>
                <div className={styles.communityToggleRow}>
                  <div className={styles.communityToggleInfo}>
                    <Icons.globe size={16} />
                    <div className={styles.communityToggleText}>
                      <span className={styles.communityToggleLabel}>
                        {linkedCommunityPost ? 'Shared to Community' : 'Share to Community'}
                      </span>
                      {linkedCommunityPost && (
                        <a
                          href={`/community/builds/${linkedCommunityPost.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.communityToggleLink}
                        >
                          View Post <Icons.externalLink size={10} />
                        </a>
                      )}
                      {!linkedCommunityPost && (
                        <span className={styles.communityToggleHint}>
                          Make this build visible to everyone
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`${styles.toggleSwitch} ${shareToNewCommunity ? styles.toggleSwitchOn : ''}`}
                    onClick={() => {
                      const newValue = !shareToNewCommunity;
                      setShareToNewCommunity(newValue);
                      // Default community title to build name if enabling and title is empty
                      if (newValue && !communityTitle) {
                        setCommunityTitle(buildName);
                      }
                    }}
                    aria-label={
                      shareToNewCommunity
                        ? 'Disable sharing to community'
                        : 'Enable sharing to community'
                    }
                    aria-pressed={shareToNewCommunity}
                  >
                    <span className={styles.toggleKnob} />
                  </button>
                </div>

                {/* Community Title Input - shown when sharing is enabled */}
                {shareToNewCommunity && (
                  <div className={styles.communityTitleInput}>
                    <label className={styles.communityTitleLabel}>Community Title</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={communityTitle}
                      onChange={(e) => setCommunityTitle(e.target.value)}
                      placeholder="e.g., My Stormtrooper, Weekend Track Weapon"
                    />
                    <span className={styles.communityTitleHint}>
                      This is the public name shown on Community Builds
                    </span>
                  </div>
                )}

                {linkedCommunityPost && !shareToNewCommunity && (
                  <p className={styles.communityToggleWarning}>
                    ⚠️ This build will be removed from the community when you save.
                  </p>
                )}
              </div>

              {saveError && (
                <div className={styles.saveErrorMessage}>
                  <Icons.alertCircle size={14} />
                  {saveError}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className={styles.saveModalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowSaveModal(false)}>
                Cancel
              </button>
              <button
                className={styles.confirmBtn}
                onClick={handleSaveBuild}
                disabled={isSaving || !buildName.trim()}
              >
                {isSaving ? (
                  <>
                    <span className={styles.savingSpinner} />
                    Saving...
                  </>
                ) : linkedCommunityPost && shareToNewCommunity ? (
                  <>
                    <Icons.save size={14} />
                    Save & Update Community Post
                  </>
                ) : linkedCommunityPost && !shareToNewCommunity ? (
                  <>
                    <Icons.save size={14} />
                    Save & Remove from Community
                  </>
                ) : shareToNewCommunity ? (
                  <>
                    <Icons.save size={14} />
                    Save & Share to Community
                  </>
                ) : (
                  <>
                    <Icons.save size={14} />
                    Save Build
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
