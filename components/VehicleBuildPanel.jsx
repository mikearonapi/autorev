'use client';

/**
 * VehicleBuildPanel
 *
 * Wrapper component for BuildEditor that handles:
 * - Fetching turbo options from database
 * - Saving build data to user_vehicles
 * - Displaying the current build status
 */

import { useState, useCallback } from 'react';

import { useVehicleBuild, useUpdateVehicleBuild } from '@/hooks/useUserData';

import BuildEditor from './BuildEditor';
import styles from './VehicleBuildPanel.module.css';

export default function VehicleBuildPanel({
  vehicleId,
  carId,
  carSlug,
  stockHp = 0,
  stockTorque: _stockTorque = 0,
  installedMods = [],
  customSpecs = {},
  onUpdateBuild,
  onEstimateChange,
}) {
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch turbo options via React Query
  const { data: buildData, isLoading: loading } = useVehicleBuild(vehicleId);
  const turboOptions = buildData?.turboOptions || [];

  // Mutation for saving build
  const updateBuildMutation = useUpdateVehicleBuild();
  const _saving = updateBuildMutation.isPending;

  // Handle save
  const handleSave = useCallback(
    async (buildData) => {
      if (!vehicleId) {
        setError('No vehicle selected');
        return;
      }

      setError(null);
      setSaveSuccess(false);

      try {
        const result = await updateBuildMutation.mutateAsync({ vehicleId, buildData });

        // Notify parent of the update
        if (onUpdateBuild) {
          onUpdateBuild(result.vehicle);
        }

        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } catch (err) {
        setError(err.message);
      }
    },
    [vehicleId, onUpdateBuild, updateBuildMutation]
  );

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <span>Loading build options...</span>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      {error && (
        <div className={styles.error}>
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {saveSuccess && (
        <div className={styles.success}>
          <span>✓ Build saved successfully</span>
        </div>
      )}

      <BuildEditor
        vehicleId={vehicleId}
        carId={carId}
        carSlug={carSlug}
        initialMods={installedMods}
        initialCustomSpecs={customSpecs}
        turboOptions={turboOptions}
        stockHp={stockHp}
        onSave={handleSave}
        onEstimateChange={onEstimateChange}
      />
    </div>
  );
}
