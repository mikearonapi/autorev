'use client';

/**
 * My Specs Page - Vehicle Specifications
 *
 * Shows full vehicle specifications for a selected vehicle.
 * Part of the My Garage suite:
 * - Specs: Vehicle specifications (this page)
 * - Build: Configure upgrades
 * - Performance: See performance impact
 * - Parts: Research and buy parts
 * - Photos: Manage vehicle photos
 *
 * URL: /garage/my-specs?car=<carSlug> or ?build=<buildId>
 */

import React, { useState, useEffect, Suspense, useCallback, useRef, useMemo } from 'react';

import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

import AuthModal, { useAuthModal } from '@/components/AuthModal';
import ErrorBoundary from '@/components/ErrorBoundary';
import { MyGarageSubNav, GarageVehicleSelector } from '@/components/garage';
import { useAuth } from '@/components/providers/AuthProvider';
import { useOwnedVehicles } from '@/components/providers/OwnedVehiclesProvider';
import { useSavedBuilds } from '@/components/providers/SavedBuildsProvider';
import { Skeleton, DataSourceBadge, PerformanceSourceSummary } from '@/components/ui';
import EmptyState from '@/components/ui/EmptyState';
import { Icons } from '@/components/ui/Icons';
import { useCarsList, useCarBySlug, useCarMaintenance } from '@/hooks/useCarData';
import { useCarImages } from '@/hooks/useCarImages';
import { calculateAllModificationGains } from '@/lib/performanceCalculator';
import { whpToCrankHp } from '@/lib/userDynoDataService';

import styles from './page.module.css';

/**
 * SpecRow - Semantic table row for spec display
 * Per SOURCE_OF_TRUTH.md: Use proper ARIA and semantic HTML
 *
 * Enhanced with data source badges to indicate measured vs estimated values
 */
function SpecRow({
  label,
  value,
  unit = '',
  stockValue,
  modifiedValue,
  gain,
  dataSource = null, // 'verified' | 'measured' | 'calibrated' | 'estimated' | null
  sourceDetail = null,
}) {
  // Handle missing values with "—" per audit requirements
  const displayValue = value !== undefined && value !== null ? value : '—';
  const hasModification = stockValue !== undefined && modifiedValue !== undefined;

  // Show badge for non-estimated data sources
  const showSourceBadge = dataSource && dataSource !== 'estimated';

  return (
    <tr className={styles.specTableRow}>
      <th scope="row" className={styles.specTableLabel}>
        {label}
        {showSourceBadge && (
          <DataSourceBadge source={dataSource} variant="minimal" detail={sourceDetail} />
        )}
      </th>
      <td className={styles.specTableValue}>
        {hasModification ? (
          <span className={styles.specValueWithGain}>
            <span className={styles.stockValue}>{stockValue}</span>
            <span className={styles.arrow} aria-hidden="true">
              →
            </span>
            <span className={styles.upgradedValue}>
              {modifiedValue} {unit}
            </span>
            {gain !== undefined && (
              <span className={styles.gainBadge} aria-label={`Gain of ${gain}`}>
                +{gain}
              </span>
            )}
          </span>
        ) : (
          <span>
            {displayValue}
            {displayValue !== '—' && unit ? ` ${unit}` : ''}
          </span>
        )}
      </td>
    </tr>
  );
}

/**
 * SpecTable - Semantic table wrapper for accessibility
 * Per SOURCE_OF_TRUTH.md Accessibility Requirements
 */
function SpecTable({ caption, children, className = '' }) {
  return (
    <table className={`${styles.specTable} ${className}`} aria-label={caption}>
      <caption className={styles.srOnly}>{caption}</caption>
      <thead className={styles.srOnly}>
        <tr>
          <th scope="col">Specification</th>
          <th scope="col">Value</th>
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

/**
 * ErrorState - Error display with retry button
 * Per SOURCE_OF_TRUTH.md: Error states should use role="alert" aria-live="assertive"
 */
function ErrorState({ error, onRetry, title = 'Something went wrong' }) {
  return (
    <div className={styles.errorState} role="alert" aria-live="assertive">
      <div className={styles.errorIcon}>
        <Icons.alertCircle size={48} />
      </div>
      <h3 className={styles.errorTitle}>{title}</h3>
      <p className={styles.errorMessage}>
        {error?.message || 'Failed to load data. Please try again.'}
      </p>
      {onRetry && (
        <button className={styles.retryButton} onClick={onRetry} aria-label="Retry loading data">
          <Icons.refresh size={16} />
          Try Again
        </button>
      )}
    </div>
  );
}

/**
 * Skeleton loading state that matches the specs grid layout
 * Per SOURCE_OF_TRUTH.md: Use skeleton loaders that match content shape
 */
function SpecsCardSkeleton() {
  return (
    <div className={styles.skeletonCard}>
      <div className={styles.skeletonHeader}>
        <Skeleton width={100} height={14} variant="rounded" />
        <Skeleton width={70} height={44} variant="rounded" />
      </div>
      <div className={styles.skeletonItems}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={styles.skeletonRow}>
            <Skeleton width="40%" height={13} variant="rounded" />
            <Skeleton width="30%" height={13} variant="rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function MySpecsLoading() {
  return (
    <div className={styles.page}>
      {/* Skeleton for sub-nav */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Skeleton width={200} height={20} variant="rounded" />
      </div>

      {/* Skeleton for vehicle selector */}
      <div style={{ padding: '16px' }}>
        <Skeleton width="100%" height={60} variant="rounded" />
      </div>

      {/* Skeleton for specs grid */}
      <div className={styles.skeletonContent}>
        <div className={styles.skeletonGrid}>
          <SpecsCardSkeleton />
          <SpecsCardSkeleton />
          <SpecsCardSkeleton />
          <SpecsCardSkeleton />
        </div>

        {/* Skeleton for ratings card */}
        <div className={styles.skeletonCard} style={{ marginBottom: '12px' }}>
          <div className={styles.skeletonHeader}>
            <Skeleton width={120} height={14} variant="rounded" />
            <Skeleton width={70} height={44} variant="rounded" />
          </div>
          <div className={styles.skeletonItems}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={styles.skeletonRow}>
                <Skeleton width={80} height={12} variant="rounded" />
                <Skeleton width="50%" height={6} variant="rounded" />
                <Skeleton width={36} height={12} variant="rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MySpecsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedCar, setSelectedCar] = useState(null);
  const [currentBuildId, setCurrentBuildId] = useState(null);
  const [specsConfirmed, setSpecsConfirmed] = useState(false);
  const [confirmingSpecs, setConfirmingSpecs] = useState(false);
  const [confirmSuccess, setConfirmSuccess] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const confirmButtonRef = useRef(null);
  const feedbackTextareaRef = useRef(null);

  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const authModal = useAuthModal();
  const { builds, isLoading: buildsLoading } = useSavedBuilds();
  const { vehicles, refreshVehicles } = useOwnedVehicles();

  // Use cached cars data from React Query hook
  const {
    data: allCars = [],
    isLoading: _carsLoading,
    error: carsError,
    refetch: refetchCars,
  } = useCarsList();

  // Get URL params for fallback fetch
  const carSlugParam = searchParams.get('car');

  // Fallback: fetch single car in parallel with full list
  // This provides faster data when the full list is slow or unavailable
  const carFromList = carSlugParam ? allCars.find((c) => c.slug === carSlugParam) : null;
  const {
    data: fallbackCar,
    isLoading: fallbackLoading,
    error: fallbackError,
    refetch: refetchFallback,
  } = useCarBySlug(carSlugParam, {
    enabled: !!carSlugParam && !carFromList && !selectedCar,
  });

  // Check for action=confirm query param and scroll to confirm button
  const actionParam = searchParams.get('action');

  // Get user's hero image for this car
  const { heroImageUrl: _heroImageUrl } = useCarImages(selectedCar?.slug, {
    enabled: !!selectedCar?.slug,
  });

  // Fetch full car details for driving character fields (not in list view)
  const {
    data: _fullCarData,
    error: fullCarError,
    refetch: refetchFullCar,
  } = useCarBySlug(selectedCar?.slug, {
    enabled: !!selectedCar?.slug,
  });

  // Fetch maintenance specs (fluids, tires, etc.)
  const {
    data: maintenanceData,
    error: maintenanceError,
    refetch: refetchMaintenance,
  } = useCarMaintenance(selectedCar?.slug, {
    enabled: !!selectedCar?.slug,
  });

  // Combined error state for data fetching
  const dataError = carsError || fallbackError || fullCarError || maintenanceError;

  // Retry handler for error state
  const handleRetry = useCallback(() => {
    if (carsError) refetchCars();
    if (fallbackError) refetchFallback();
    if (fullCarError) refetchFullCar();
    if (maintenanceError) refetchMaintenance();
  }, [
    carsError,
    fallbackError,
    fullCarError,
    maintenanceError,
    refetchCars,
    refetchFallback,
    refetchFullCar,
    refetchMaintenance,
  ]);

  // Find the user's vehicle for this car (to get specs_confirmed status and vehicle ID)
  const userVehicle = vehicles?.find((v) => v.matchedCarSlug === selectedCar?.slug);

  // Initialize specs_confirmed state from vehicle data
  useEffect(() => {
    if (userVehicle) {
      setSpecsConfirmed(!!userVehicle.specsConfirmed || !!userVehicle.specs_confirmed);
    }
  }, [userVehicle]);

  // Scroll to confirm button when action=confirm
  useEffect(() => {
    if (actionParam === 'confirm' && confirmButtonRef.current && selectedCar) {
      // Wait for content to render
      setTimeout(() => {
        confirmButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Pulse animation to draw attention
        confirmButtonRef.current?.classList.add(styles.highlight);
        setTimeout(() => {
          confirmButtonRef.current?.classList.remove(styles.highlight);
        }, 2000);
      }, 500);
    }
  }, [actionParam, selectedCar]);

  // Handler to confirm specs
  const handleConfirmSpecs = useCallback(async () => {
    if (!user?.id || !userVehicle?.id) return;

    setConfirmingSpecs(true);
    try {
      const response = await fetch(`/api/users/${user.id}/vehicles/${userVehicle.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specs_confirmed: true }),
      });

      if (response.ok) {
        setSpecsConfirmed(true);
        setConfirmSuccess(true);
        // Refresh vehicles to update the provider
        if (refreshVehicles) {
          await refreshVehicles();
        }
        // Clear success message after 3 seconds
        setTimeout(() => setConfirmSuccess(false), 3000);
      } else {
        console.error('[MySpecs] Failed to confirm specs');
      }
    } catch (err) {
      console.error('[MySpecs] Error confirming specs:', err);
    } finally {
      setConfirmingSpecs(false);
    }
  }, [user?.id, userVehicle?.id, refreshVehicles]);

  // Handler to show feedback form when specs are inaccurate
  const handleSpecsInaccurate = useCallback(() => {
    setShowFeedbackForm(true);
    // Focus the textarea after it renders
    setTimeout(() => {
      feedbackTextareaRef.current?.focus();
    }, 100);
  }, []);

  // Handler to submit spec inaccuracy feedback
  const handleSubmitFeedback = useCallback(async () => {
    if (!feedbackText.trim()) return;

    setSubmittingFeedback(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback_type: 'bug',
          category: 'data',
          message: `[Spec Inaccuracy Report]\n\nVehicle: ${selectedCar?.name || 'Unknown'}\nSlug: ${selectedCar?.slug || 'Unknown'}\nUser: ${user?.email || user?.id || 'Anonymous'}\n\nIssue:\n${feedbackText}`,
          car_slug: selectedCar?.slug,
          page_url: typeof window !== 'undefined' ? window.location.href : null,
          page_title: `My Specs - ${selectedCar?.name || 'Unknown'}`,
          email: user?.email || null,
          tags: ['specs-inaccuracy', 'user-reported'],
          severity: 'minor',
          featureContext: 'garage-my-specs',
          userTier: user?.tier || 'free',
        }),
      });

      if (response.ok) {
        setFeedbackSubmitted(true);
        setFeedbackText('');
        setShowFeedbackForm(false);
      } else {
        console.error('[MySpecs] Failed to submit feedback');
      }
    } catch (err) {
      console.error('[MySpecs] Error submitting feedback:', err);
    } finally {
      setSubmittingFeedback(false);
    }
  }, [feedbackText, selectedCar, user]);

  // Get URL params
  const buildIdParam = searchParams.get('build');

  // Handle URL params - load build or car (with fallback support)
  useEffect(() => {
    // Try to get car from full list first
    if (allCars.length > 0) {
      if (buildIdParam) {
        if (buildsLoading) return;
        const build = builds.find((b) => b.id === buildIdParam);
        if (build) {
          const car = allCars.find((c) => c.slug === build.carSlug);
          if (car) {
            setSelectedCar(car);
            setCurrentBuildId(buildIdParam);
          }
        }
      } else if (carSlugParam) {
        const car = allCars.find((c) => c.slug === carSlugParam);
        if (car) {
          setSelectedCar(car);
          setCurrentBuildId(null);
        }
      }
    } else if (fallbackCar && carSlugParam) {
      // Fallback: use directly fetched car when list is unavailable
      setSelectedCar(fallbackCar);
      setCurrentBuildId(null);
    }
  }, [buildIdParam, carSlugParam, allCars, builds, buildsLoading, fallbackCar]);

  const handleBack = () => {
    router.push('/garage');
  };

  // Get current build for display
  const currentBuild = builds.find((b) => b.id === currentBuildId);
  const _buildName = currentBuild?.name;

  // SOURCE OF TRUTH: Calculate HP gain dynamically from installed mods
  // Never use stored values (currentBuild?.totalHpGain) - they can become stale
  // See docs/SOURCE_OF_TRUTH.md Rule 8
  //
  // IMPORTANT: When user has dyno data, that takes PRIORITY over calculations
  // NOTE: This must be called before any early returns (React hooks rules)
  const { hasUserDynoData, dynoData, performanceDataSources } =
    useMemo(() => {
      const installedMods = userVehicle?.installedModifications || [];
      const customSpecs = userVehicle?.customSpecs || {};

      // Check if user has dyno data - PRIORITY OVER CALCULATIONS
      const userDyno = customSpecs?.engine || customSpecs?.dyno;
      const hasDyno = userDyno?.dynoWhp && userDyno.dynoWhp > 0;

      if (hasDyno) {
        // User has dyno data - USE IT
        const dynoWhp = userDyno.dynoWhp;
        const dynoWtq = userDyno.dynoWtq;
        const isVerified = userDyno.isVerified || false;

        // Convert WHP to crank HP using drivetrain loss
        const crankHp = whpToCrankHp(dynoWhp, selectedCar?.drivetrain || 'RWD');
        const crankTq = dynoWtq ? whpToCrankHp(dynoWtq, selectedCar?.drivetrain || 'RWD') : null;

        const hpGainFromDyno = crankHp - (selectedCar?.hp || 0);

        return {
          hpGain: hpGainFromDyno,
          finalHp: crankHp,
          hasBuildUpgrades: hpGainFromDyno > 0,
          hasUserDynoData: true,
          dynoData: {
            whp: dynoWhp,
            wtq: dynoWtq,
            crankHp,
            crankTq,
            isVerified,
            dynoShop: userDyno.dynoShop,
            dynoDate: userDyno.dynoDate,
            boostPsi: userDyno.boostPsi,
            fuelType: userDyno.fuelType,
          },
          performanceDataSources: {
            hp: isVerified ? 'verified' : 'measured',
            torque: dynoWtq ? (isVerified ? 'verified' : 'measured') : 'estimated',
            whp: isVerified ? 'verified' : 'measured',
            wtq: dynoWtq ? (isVerified ? 'verified' : 'measured') : null,
          },
        };
      }

      // No dyno data - calculate from mods
      if (installedMods.length === 0) {
        return {
          hpGain: 0,
          finalHp: selectedCar?.hp || null,
          hasBuildUpgrades: false,
          hasUserDynoData: false,
          dynoData: null,
          performanceDataSources: null,
        };
      }

      const modificationGains = calculateAllModificationGains(installedMods, selectedCar);
      const calculatedHpGain = modificationGains.hpGain || 0;
      const calculatedFinalHp = selectedCar?.hp ? selectedCar.hp + calculatedHpGain : null;

      return {
        hpGain: calculatedHpGain,
        finalHp: calculatedFinalHp,
        hasBuildUpgrades: calculatedHpGain > 0,
        hasUserDynoData: false,
        dynoData: null,
        performanceDataSources: null,
      };
    }, [userVehicle?.installedModifications, userVehicle?.customSpecs, selectedCar]);

  // Loading state - only block on auth and build loading, NOT carsLoading
  // The fallbackCar mechanism ensures we have car data when needed
  // Per SOURCE_OF_TRUTH.md: Use skeleton loaders that match content shape
  const isLoadingBuild = buildIdParam && buildsLoading;
  const isLoadingCar = carSlugParam && !carFromList && !fallbackCar && fallbackLoading;
  if (authLoading || isLoadingBuild || isLoadingCar) {
    return <MySpecsLoading />;
  }

  // Error state with retry - per SOURCE_OF_TRUTH.md accessibility requirements
  if (dataError && !selectedCar) {
    return (
      <div className={styles.page}>
        <MyGarageSubNav carSlug={carSlugParam} buildId={buildIdParam} onBack={handleBack} />
        <ErrorState error={dataError} onRetry={handleRetry} title="Failed to Load Vehicle Data" />
        <AuthModal {...authModal.props} />
      </div>
    );
  }

  // No car selected
  if (!selectedCar) {
    return (
      <div className={styles.page}>
        <MyGarageSubNav carSlug={carSlugParam} buildId={buildIdParam} onBack={handleBack} />
        <EmptyState
          icon={Icons.gauge}
          title="Select a Vehicle"
          description="Choose a vehicle from your garage to view its specifications"
          action={{ label: 'Go to My Garage', href: '/garage' }}
          variant="centered"
          size="lg"
        />
        <AuthModal {...authModal.props} />
      </div>
    );
  }

  // Car selected - show specs
  return (
    <div className={styles.page}>
      <MyGarageSubNav carSlug={selectedCar.slug} buildId={currentBuildId} onBack={handleBack} />

      <GarageVehicleSelector selectedCarSlug={selectedCar.slug} buildId={currentBuildId} />

      <div className={styles.content}>
        {/* Data Source Summary - shows when user has dyno data */}
        {hasUserDynoData && (
          <PerformanceSourceSummary
            hasUserData={hasUserDynoData}
            primarySource={performanceDataSources?.hp || 'measured'}
            dynoShop={dynoData?.dynoShop}
            dynoDate={dynoData?.dynoDate}
          />
        )}

        {/* Specs Grid */}
        <div className={styles.specsGrid} role="region" aria-label="Vehicle Specifications">
          {/* Performance - Semantic table for accessibility */}
          <div className={styles.specCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle} id="performance-specs">
                <Icons.zap size={16} />
                Stock Performance
              </h3>
            </div>
            <SpecTable caption="Stock performance specifications" aria-labelledby="performance-specs">
              <SpecRow label="Horsepower" value={selectedCar.hp} unit="HP" />
              <SpecRow label="Torque" value={selectedCar.torque} unit="lb-ft" />
              <SpecRow label="0-60 mph" value={selectedCar.zeroToSixty} unit="s" />
              <SpecRow label="1/4 Mile" value={selectedCar.quarterMile} unit="s" />
              <SpecRow label="Top Speed" value={selectedCar.topSpeed} unit="mph" />
              <SpecRow label="60-0 Braking" value={selectedCar.braking60To0} unit="ft" />
              <SpecRow label="Lateral G" value={selectedCar.lateralG} unit="g" />
            </SpecTable>
          </div>

          {/* Engine & Drivetrain - Semantic table for accessibility */}
          <div className={styles.specCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle} id="engine-specs">
                <Icons.engine size={16} />
                Engine & Drivetrain
              </h3>
            </div>
            <SpecTable
              caption="Engine and drivetrain specifications"
              aria-labelledby="engine-specs"
            >
              <SpecRow label="Engine" value={selectedCar.engine} />
              <SpecRow label="Transmission" value={selectedCar.trans} />
              <SpecRow label="Drivetrain" value={selectedCar.drivetrain} />
              <SpecRow label="Layout" value={selectedCar.category} />
            </SpecTable>
          </div>

          {/* Chassis & Body - Semantic table for accessibility */}
          <div className={styles.specCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle} id="chassis-specs">
                <Icons.car size={16} />
                Chassis & Body
              </h3>
            </div>
            <SpecTable caption="Chassis and body specifications" aria-labelledby="chassis-specs">
              <SpecRow
                label="Curb Weight"
                value={selectedCar.curbWeight ? selectedCar.curbWeight.toLocaleString() : null}
                unit="lbs"
              />
              <SpecRow label="Seats" value={selectedCar.seats} />
              <SpecRow label="Origin" value={selectedCar.country} />
              <SpecRow label="Model Years" value={selectedCar.years} />
            </SpecTable>
          </div>

          {/* Service Info - All maintenance specs the user needs */}
          {maintenanceData?.data?.specs && (
            <div className={styles.specCard}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle} id="service-specs">
                  <Icons.wrench size={16} />
                  Service Info
                </h3>
              </div>
              <SpecTable
                caption="Service information specifications"
                aria-labelledby="service-specs"
              >
                <SpecRow
                  label="Battery Size"
                  value={maintenanceData.data.specs.battery_group_size}
                />
                <SpecRow label="Oil Type" value={maintenanceData.data.specs.oil_viscosity} />
                <SpecRow
                  label="Oil Capacity"
                  value={
                    maintenanceData.data.specs.oil_capacity_quarts
                      ? `${maintenanceData.data.specs.oil_capacity_quarts} qt`
                      : maintenanceData.data.specs.oil_capacity_liters
                        ? `${maintenanceData.data.specs.oil_capacity_liters} L`
                        : null
                  }
                />
                {/* Show trans fluid - auto and/or manual depending on what's available */}
                {maintenanceData.data.specs.trans_fluid_auto &&
                  maintenanceData.data.specs.trans_fluid_auto !== 'N/A' && (
                    <SpecRow
                      label="Trans Fluid (Auto)"
                      value={
                        maintenanceData.data.specs.trans_fluid_auto_capacity
                          ? `${maintenanceData.data.specs.trans_fluid_auto} (${maintenanceData.data.specs.trans_fluid_auto_capacity} qt)`
                          : maintenanceData.data.specs.trans_fluid_auto
                      }
                    />
                  )}
                {maintenanceData.data.specs.trans_fluid_manual &&
                  maintenanceData.data.specs.trans_fluid_manual !== 'N/A' && (
                    <SpecRow
                      label="Trans Fluid (Manual)"
                      value={
                        maintenanceData.data.specs.trans_fluid_manual_capacity
                          ? `${maintenanceData.data.specs.trans_fluid_manual} (${maintenanceData.data.specs.trans_fluid_manual_capacity} qt)`
                          : maintenanceData.data.specs.trans_fluid_manual
                      }
                    />
                  )}
                <SpecRow
                  label="Lug Pattern"
                  value={maintenanceData.data.specs.wheel_bolt_pattern}
                />
                <SpecRow
                  label="Lug Torque"
                  value={maintenanceData.data.specs.wheel_lug_torque_ft_lbs}
                  unit="ft-lb"
                />
                <SpecRow
                  label="Spark Plug Gap"
                  value={maintenanceData.data.specs.spark_plug_gap_mm}
                  unit="mm"
                />
                <SpecRow
                  label="Wipers"
                  value={
                    maintenanceData.data.specs.wiper_driver_size_inches ||
                    maintenanceData.data.specs.wiper_passenger_size_inches
                      ? `${maintenanceData.data.specs.wiper_driver_size_inches || '—'}" / ${maintenanceData.data.specs.wiper_passenger_size_inches || '—'}"${maintenanceData.data.specs.wiper_rear_size_inches ? ` / ${maintenanceData.data.specs.wiper_rear_size_inches}"` : ''}`
                      : null
                  }
                />
              </SpecTable>
            </div>
          )}

        </div>

        {/* Confirm Specs Section */}
        {isAuthenticated && userVehicle && (
          <div className={styles.confirmSection} ref={confirmButtonRef}>
            {feedbackSubmitted ? (
              <div className={styles.feedbackSubmittedBanner}>
                <span className={styles.confirmedIcon}>✓</span>
                <div className={styles.confirmedText}>
                  <strong>Thank You for Your Feedback!</strong>
                  <span>
                    We&apos;ve received your report and will review the specs for your{' '}
                    {selectedCar.name}. We&apos;ll update the data and notify you once corrected.
                  </span>
                </div>
              </div>
            ) : specsConfirmed ? (
              <div className={styles.confirmedBanner}>
                <span className={styles.confirmedIcon}>✓</span>
                <div className={styles.confirmedText}>
                  <strong>Specs Confirmed</strong>
                  <span>
                    You&apos;ve verified these specifications are accurate for your vehicle
                  </span>
                </div>
              </div>
            ) : showFeedbackForm ? (
              <div className={styles.feedbackForm}>
                <div className={styles.feedbackHeader}>
                  <strong>What&apos;s not accurate?</strong>
                  <span>
                    Help us improve the specs for your {selectedCar.name}. Please describe what
                    needs to be corrected.
                  </span>
                </div>
                <textarea
                  ref={feedbackTextareaRef}
                  className={styles.feedbackTextarea}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="e.g., The horsepower is listed as 300 but my model has 320hp. The torque spec also seems off..."
                  rows={4}
                  aria-label="Describe what specs are inaccurate"
                />
                <div className={styles.feedbackActions}>
                  <button
                    className={styles.cancelButton}
                    onClick={() => {
                      setShowFeedbackForm(false);
                      setFeedbackText('');
                    }}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className={styles.submitFeedbackButton}
                    onClick={handleSubmitFeedback}
                    disabled={submittingFeedback || !feedbackText.trim()}
                    type="button"
                  >
                    {submittingFeedback ? (
                      <>
                        <span className={styles.spinner} />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Icons.send size={16} />
                        Send Feedback
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.confirmPrompt}>
                <div className={styles.confirmText}>
                  <strong>Are these specs accurate?</strong>
                  <span>Review the specs above and confirm they match your {selectedCar.name}</span>
                </div>
                <div className={styles.confirmButtons}>
                  <button
                    className={styles.confirmButton}
                    onClick={handleConfirmSpecs}
                    disabled={confirmingSpecs}
                  >
                    {confirmingSpecs ? (
                      <>
                        <span className={styles.spinner} />
                        Confirming...
                      </>
                    ) : (
                      <>
                        <span className={styles.checkIcon}>✓</span>
                        Yes, Accurate
                      </>
                    )}
                  </button>
                  <button
                    className={styles.inaccurateButton}
                    onClick={handleSpecsInaccurate}
                    type="button"
                  >
                    <span className={styles.xIcon}>✗</span>
                    No, Something&apos;s Wrong
                  </button>
                </div>
              </div>
            )}
            {confirmSuccess && (
              <div className={styles.successToast}>
                Specs confirmed! Your garage score has been updated.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Continue to Build CTA */}
      {selectedCar && (
        <div className={styles.continueCtaContainer}>
          <Link
            href={
              currentBuildId
                ? `/garage/my-build?build=${currentBuildId}`
                : `/garage/my-build?car=${selectedCar.slug}`
            }
            className={styles.continueCta}
          >
            <div className={styles.ctaContent}>
              <span className={styles.ctaTitle}>Ready to configure upgrades?</span>
            </div>
            <div className={styles.ctaAction}>
              <span>Continue to Build</span>
              <Icons.chevronRight size={18} />
            </div>
          </Link>
        </div>
      )}

      <AuthModal {...authModal.props} />
    </div>
  );
}

export default function MySpecsPage() {
  return (
    <ErrorBoundary name="MySpecsPage" featureContext="garage-my-specs">
      <Suspense fallback={<MySpecsLoading />}>
        <MySpecsContent />
      </Suspense>
    </ErrorBoundary>
  );
}
