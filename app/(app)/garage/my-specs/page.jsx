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
import { Skeleton } from '@/components/ui';
import EmptyState from '@/components/ui/EmptyState';
import { Icons } from '@/components/ui/Icons';
import { useCarsList, useCarBySlug, useCarMaintenance } from '@/hooks/useCarData';
import { useCarImages } from '@/hooks/useCarImages';
import { calculateAllModificationGains } from '@/lib/performanceCalculator';

import styles from './page.module.css';

/**
 * SpecRow - Semantic table row for spec display
 * Per SOURCE_OF_TRUTH.md: Use proper ARIA and semantic HTML
 */
function SpecRow({ label, value, unit = '', stockValue, modifiedValue, gain }) {
  // Handle missing values with "—" per audit requirements
  const displayValue = value !== undefined && value !== null ? value : '—';
  const hasModification = stockValue !== undefined && modifiedValue !== undefined;

  return (
    <tr className={styles.specTableRow}>
      <th scope="row" className={styles.specTableLabel}>
        {label}
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
  const confirmButtonRef = useRef(null);

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
    data: fullCarData,
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

  // Merge full car data with selected car for driving character fields
  const carWithDetails = useMemo(() => {
    if (!selectedCar) return null;
    return {
      ...selectedCar,
      // Override with full data if available (has driving character fields)
      ...(fullCarData || {}),
    };
  }, [selectedCar, fullCarData]);

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
  // NOTE: This must be called before any early returns (React hooks rules)
  const { hpGain, finalHp, hasBuildUpgrades } = useMemo(() => {
    const installedMods = userVehicle?.installedModifications || [];

    if (installedMods.length === 0) {
      return { hpGain: 0, finalHp: selectedCar?.hp || null, hasBuildUpgrades: false };
    }

    const modificationGains = calculateAllModificationGains(installedMods, selectedCar);
    const calculatedHpGain = modificationGains.hpGain || 0;
    const calculatedFinalHp = selectedCar?.hp ? selectedCar.hp + calculatedHpGain : null;

    return {
      hpGain: calculatedHpGain,
      finalHp: calculatedFinalHp,
      hasBuildUpgrades: calculatedHpGain > 0,
    };
  }, [userVehicle?.installedModifications, selectedCar]);

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
        {/* Specs Grid */}
        <div className={styles.specsGrid} role="region" aria-label="Vehicle Specifications">
          {/* Performance - Semantic table for accessibility */}
          <div className={styles.specCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle} id="performance-specs">
                <Icons.zap size={16} />
                Performance
              </h3>
            </div>
            <SpecTable caption="Performance specifications" aria-labelledby="performance-specs">
              {hasBuildUpgrades ? (
                <SpecRow
                  label="Horsepower"
                  stockValue={selectedCar.hp}
                  modifiedValue={finalHp}
                  gain={hpGain}
                  unit="HP"
                />
              ) : (
                <SpecRow label="Horsepower" value={selectedCar.hp} unit="HP" />
              )}
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

          {/* Track Capability - Uses definition list for description content */}
          {(carWithDetails?.trackReadiness || carWithDetails?.chassisDynamics) && (
            <div className={styles.specCard}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle} id="track-specs">
                  <Icons.flag size={16} />
                  Track Capability
                </h3>
              </div>
              <dl className={styles.specDescriptionList} aria-labelledby="track-specs">
                {carWithDetails?.trackReadiness && (
                  <div className={styles.specItemDescription}>
                    <dt className={styles.specLabel}>Track Ready</dt>
                    <dd className={styles.specDescription}>{carWithDetails.trackReadiness}</dd>
                  </div>
                )}
                {carWithDetails?.chassisDynamics && (
                  <div className={styles.specItemDescription}>
                    <dt className={styles.specLabel}>Chassis</dt>
                    <dd className={styles.specDescription}>{carWithDetails.chassisDynamics}</dd>
                  </div>
                )}
                {carWithDetails?.communityStrength && (
                  <div className={styles.specItemDescription}>
                    <dt className={styles.specLabel}>Community</dt>
                    <dd className={styles.specDescription}>{carWithDetails.communityStrength}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Fluids & Maintenance - Semantic table for accessibility */}
          {maintenanceData?.data?.specs && (
            <div className={styles.specCard}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle} id="fluids-specs">
                  <Icons.wrench size={16} />
                  Fluids & Maintenance
                </h3>
              </div>
              <SpecTable
                caption="Fluids and maintenance specifications"
                aria-labelledby="fluids-specs"
              >
                <SpecRow label="Oil Type" value={maintenanceData.data.specs.oil_viscosity} />
                <SpecRow
                  label="Oil Capacity"
                  value={maintenanceData.data.specs.oil_capacity_liters}
                  unit="L"
                />
                <SpecRow label="Coolant" value={maintenanceData.data.specs.coolant_type} />
                <SpecRow label="Brake Fluid" value={maintenanceData.data.specs.brake_fluid_type} />
                <SpecRow label="Spark Plugs" value={maintenanceData.data.specs.spark_plug_type} />
              </SpecTable>
            </div>
          )}

          {/* Wheels & Tires - Semantic table for accessibility */}
          {maintenanceData?.data?.specs &&
            (maintenanceData.data.specs.tire_size_front ||
              maintenanceData.data.specs.wheel_bolt_pattern) && (
              <div className={styles.specCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle} id="wheels-specs">
                    <Icons.tire size={16} />
                    Wheels & Tires
                  </h3>
                </div>
                <SpecTable caption="Wheels and tires specifications" aria-labelledby="wheels-specs">
                  <SpecRow label="Front Tires" value={maintenanceData.data.specs.tire_size_front} />
                  {maintenanceData.data.specs.tire_size_rear !==
                    maintenanceData.data.specs.tire_size_front && (
                    <SpecRow label="Rear Tires" value={maintenanceData.data.specs.tire_size_rear} />
                  )}
                  <SpecRow
                    label="Tire Pressure (F)"
                    value={maintenanceData.data.specs.tire_pressure_front_psi}
                    unit="PSI"
                  />
                  <SpecRow
                    label="Tire Pressure (R)"
                    value={maintenanceData.data.specs.tire_pressure_rear_psi}
                    unit="PSI"
                  />
                  <SpecRow
                    label="Bolt Pattern"
                    value={maintenanceData.data.specs.wheel_bolt_pattern}
                  />
                  <SpecRow
                    label="Center Bore"
                    value={maintenanceData.data.specs.wheel_center_bore_mm}
                    unit="mm"
                  />
                </SpecTable>
              </div>
            )}

          {/* Service Info - Battery, fluids, lug specs, wipers */}
          {maintenanceData?.data?.specs && (
            <div className={styles.specCard}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle} id="service-specs">
                  <Icons.settings size={16} />
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
                <SpecRow label="Trans Fluid" value={maintenanceData.data.specs.trans_fluid_type} />
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
                  value={maintenanceData.data.specs.spark_plug_gap}
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

          {/* Custom Specs - User's modifications to wheels/tires/etc */}
          {userVehicle?.hasCustomSpecs && userVehicle?.customSpecs && (
            <div className={styles.specCard}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>
                  <Icons.wrench size={16} />
                  My Custom Specs
                </h3>
                <Link
                  href={`/garage/my-build?car=${selectedCar?.slug}`}
                  className={styles.editLink}
                >
                  Edit
                </Link>
              </div>
              <div className={styles.specItems}>
                {/* Wheels */}
                {userVehicle.customSpecs.wheels && (
                  <>
                    {userVehicle.customSpecs.wheels.front && (
                      <div className={styles.specItem}>
                        <span>Front Wheels</span>
                        <span>
                          {userVehicle.customSpecs.wheels.front.size || ''}
                          {userVehicle.customSpecs.wheels.front.brand &&
                            ` ${userVehicle.customSpecs.wheels.front.brand}`}
                          {userVehicle.customSpecs.wheels.front.model &&
                            ` ${userVehicle.customSpecs.wheels.front.model}`}
                          {userVehicle.customSpecs.wheels.front.offset &&
                            ` (${userVehicle.customSpecs.wheels.front.offset})`}
                        </span>
                      </div>
                    )}
                    {userVehicle.customSpecs.wheels.rear &&
                      JSON.stringify(userVehicle.customSpecs.wheels.rear) !==
                        JSON.stringify(userVehicle.customSpecs.wheels.front) && (
                        <div className={styles.specItem}>
                          <span>Rear Wheels</span>
                          <span>
                            {userVehicle.customSpecs.wheels.rear.size || ''}
                            {userVehicle.customSpecs.wheels.rear.brand &&
                              ` ${userVehicle.customSpecs.wheels.rear.brand}`}
                            {userVehicle.customSpecs.wheels.rear.model &&
                              ` ${userVehicle.customSpecs.wheels.rear.model}`}
                            {userVehicle.customSpecs.wheels.rear.offset &&
                              ` (${userVehicle.customSpecs.wheels.rear.offset})`}
                          </span>
                        </div>
                      )}
                  </>
                )}
                {/* Tires */}
                {userVehicle.customSpecs.tires && (
                  <>
                    {userVehicle.customSpecs.tires.front && (
                      <div className={styles.specItem}>
                        <span>Front Tires</span>
                        <span>
                          {userVehicle.customSpecs.tires.front.size || ''}
                          {userVehicle.customSpecs.tires.front.brand &&
                            ` ${userVehicle.customSpecs.tires.front.brand}`}
                          {userVehicle.customSpecs.tires.front.model &&
                            ` ${userVehicle.customSpecs.tires.front.model}`}
                        </span>
                      </div>
                    )}
                    {userVehicle.customSpecs.tires.rear &&
                      JSON.stringify(userVehicle.customSpecs.tires.rear) !==
                        JSON.stringify(userVehicle.customSpecs.tires.front) && (
                        <div className={styles.specItem}>
                          <span>Rear Tires</span>
                          <span>
                            {userVehicle.customSpecs.tires.rear.size || ''}
                            {userVehicle.customSpecs.tires.rear.brand &&
                              ` ${userVehicle.customSpecs.tires.rear.brand}`}
                            {userVehicle.customSpecs.tires.rear.model &&
                              ` ${userVehicle.customSpecs.tires.rear.model}`}
                          </span>
                        </div>
                      )}
                  </>
                )}
                {/* Suspension */}
                {userVehicle.customSpecs.suspension && (
                  <>
                    {userVehicle.customSpecs.suspension.type && (
                      <div className={styles.specItem}>
                        <span>Suspension</span>
                        <span>
                          {userVehicle.customSpecs.suspension.brand &&
                            `${userVehicle.customSpecs.suspension.brand} `}
                          {userVehicle.customSpecs.suspension.type}
                        </span>
                      </div>
                    )}
                    {userVehicle.customSpecs.suspension.drop && (
                      <div className={styles.specItem}>
                        <span>Lowered</span>
                        <span>{userVehicle.customSpecs.suspension.drop}</span>
                      </div>
                    )}
                  </>
                )}
                {/* Brakes */}
                {userVehicle.customSpecs.brakes && (
                  <>
                    {userVehicle.customSpecs.brakes.front && (
                      <div className={styles.specItem}>
                        <span>Front Brakes</span>
                        <span>
                          {userVehicle.customSpecs.brakes.front.brand &&
                            `${userVehicle.customSpecs.brakes.front.brand} `}
                          {userVehicle.customSpecs.brakes.front.size ||
                            userVehicle.customSpecs.brakes.front.type ||
                            ''}
                        </span>
                      </div>
                    )}
                    {userVehicle.customSpecs.brakes.rear && (
                      <div className={styles.specItem}>
                        <span>Rear Brakes</span>
                        <span>
                          {userVehicle.customSpecs.brakes.rear.brand &&
                            `${userVehicle.customSpecs.brakes.rear.brand} `}
                          {userVehicle.customSpecs.brakes.rear.size ||
                            userVehicle.customSpecs.brakes.rear.type ||
                            ''}
                        </span>
                      </div>
                    )}
                  </>
                )}
                {/* Engine/Dyno */}
                {userVehicle.customSpecs.engine && (
                  <>
                    {userVehicle.customSpecs.engine.dynoWhp && (
                      <div className={styles.specItem}>
                        <span>Dyno WHP</span>
                        <span className={styles.customSpecHighlight}>
                          {userVehicle.customSpecs.engine.dynoWhp} WHP
                        </span>
                      </div>
                    )}
                    {userVehicle.customSpecs.engine.dynoWtq && (
                      <div className={styles.specItem}>
                        <span>Dyno WTQ</span>
                        <span className={styles.customSpecHighlight}>
                          {userVehicle.customSpecs.engine.dynoWtq} lb-ft
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pros & Cons - with proper list semantics */}
        {(selectedCar.pros?.length > 0 || selectedCar.cons?.length > 0) && (
          <div className={styles.prosConsRow}>
            {selectedCar.pros?.length > 0 && (
              <div className={styles.prosCard} role="region" aria-labelledby="pros-heading">
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle} id="pros-heading">
                    <Icons.thumbsUp size={16} />
                    Pros
                  </h3>
                </div>
                <ul className={styles.prosList} aria-label="Vehicle advantages">
                  {selectedCar.pros.slice(0, 5).map((pro, i) => (
                    <li key={i}>
                      <span aria-hidden="true">✓</span> {pro}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {selectedCar.cons?.length > 0 && (
              <div className={styles.consCard} role="region" aria-labelledby="cons-heading">
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle} id="cons-heading">
                    <Icons.thumbsDown size={16} />
                    Cons
                  </h3>
                </div>
                <ul className={styles.consList} aria-label="Vehicle disadvantages">
                  {selectedCar.cons.slice(0, 5).map((con, i) => (
                    <li key={i}>
                      <span aria-hidden="true">✗</span> {con}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Confirm Specs Section */}
        {isAuthenticated && userVehicle && (
          <div className={styles.confirmSection} ref={confirmButtonRef}>
            {specsConfirmed ? (
              <div className={styles.confirmedBanner}>
                <span className={styles.confirmedIcon}>✓</span>
                <div className={styles.confirmedText}>
                  <strong>Specs Confirmed</strong>
                  <span>
                    You&apos;ve verified these specifications are accurate for your vehicle
                  </span>
                </div>
              </div>
            ) : (
              <div className={styles.confirmPrompt}>
                <div className={styles.confirmText}>
                  <strong>Are these specs accurate?</strong>
                  <span>Review the specs above and confirm they match your {selectedCar.name}</span>
                </div>
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
                      Yes, These Specs Are Accurate
                    </>
                  )}
                </button>
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
