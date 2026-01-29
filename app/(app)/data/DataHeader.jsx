'use client';

/**
 * DataHeader - Shared header for Data pages
 *
 * Contains:
 * - Page title with user's first name
 * - Vehicle selector dropdown (uses shared GarageVehicleSelector)
 * - Tab bar navigation (DataNav)
 *
 * CRITICAL: Vehicle selection state is persisted via URL params (?vehicle=123)
 * to maintain selection across route changes (Dyno ↔ Track).
 */

import { useMemo, useEffect, useCallback, Suspense } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { GarageVehicleSelector } from '@/components/garage';
import { useAuth } from '@/components/providers/AuthProvider';
import { useOwnedVehicles } from '@/components/providers/OwnedVehiclesProvider';

import styles from './DataHeader.module.css';
import DataNav from './DataNav';

function DataHeaderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, profile } = useAuth();
  const { vehicles, isLoading: vehiclesLoading } = useOwnedVehicles();

  // Get user's first name for personalized title
  const firstName =
    profile?.display_name?.split(' ')[0] ||
    user?.user_metadata?.full_name?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    'My';

  // Get vehicle ID from URL params or localStorage
  const vehicleIdFromUrl = searchParams.get('vehicle');

  // Determine selected vehicle ID with fallback logic
  const selectedVehicleId = useMemo(() => {
    if (!vehicles || vehicles.length === 0) return null;

    // Check if URL param vehicle exists
    if (vehicleIdFromUrl) {
      const vehicleExists = vehicles.some((v) => v.id === vehicleIdFromUrl);
      if (vehicleExists) return vehicleIdFromUrl;
    }

    // Check localStorage
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem('autorev_data_selected_vehicle');
      if (storedId) {
        const vehicleExists = vehicles.some((v) => v.id === storedId);
        if (vehicleExists) return storedId;
      }
    }

    // Default to first vehicle
    return vehicles[0]?.id || null;
  }, [vehicles, vehicleIdFromUrl]);

  // Sync URL with selected vehicle (if not already in URL)
  useEffect(() => {
    if (selectedVehicleId && !vehicleIdFromUrl && isAuthenticated && vehicles?.length > 0) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('vehicle', selectedVehicleId);
      router.replace(newUrl.pathname + newUrl.search, { scroll: false });
    }
  }, [selectedVehicleId, vehicleIdFromUrl, isAuthenticated, vehicles?.length, router]);

  // Handler for selecting a vehicle - updates URL and localStorage
  const handleSelectVehicle = useCallback(
    (vehicleId) => {
      if (!vehicleId) return;

      // Update URL with current pathname (preserve current tab)
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('vehicle', vehicleId);
      router.replace(newUrl.pathname + newUrl.search, { scroll: false });

      // Store in localStorage
      localStorage.setItem('autorev_data_selected_vehicle', vehicleId);
    },
    [router]
  );

  // Don't render header content if not authenticated or loading
  if (!isAuthenticated) {
    return (
      <header className={styles.header}>
        <div className={styles.headerRow}>
          <h1 className={styles.title}>Data Hub</h1>
          <DataNav />
        </div>
      </header>
    );
  }

  // No vehicles - show simplified header (title + subtitle, no tab bar)
  // This matches the original page behavior
  if (isAuthenticated && !vehiclesLoading && vehicles?.length === 0) {
    return (
      <header className={styles.header}>
        <div className={styles.headerSimple}>
          <h1 className={styles.title}>{firstName}&apos;s Data</h1>
          <p className={styles.subtitle}>Performance insights for your vehicles</p>
        </div>
      </header>
    );
  }

  return (
    <header className={styles.header}>
      {/* Title Row with Tab Bar */}
      <div className={styles.headerRow}>
        <h1 className={styles.title}>{firstName}&apos;s Data</h1>
        <DataNav />
      </div>

      {/* Vehicle Selector - Uses shared component for consistency */}
      {vehicles?.length > 0 && (
        <GarageVehicleSelector
          selectionMode="id"
          selectedVehicleId={selectedVehicleId}
          onSelect={handleSelectVehicle}
        />
      )}
    </header>
  );
}

// Wrap in Suspense for useSearchParams
export default function DataHeader() {
  return (
    <Suspense
      fallback={
        <header className={styles.header}>
          <div className={styles.headerRow}>
            <div className={styles.titleSkeleton} />
            <div className={styles.navSkeleton} />
          </div>
        </header>
      }
    >
      <DataHeaderContent />
    </Suspense>
  );
}
