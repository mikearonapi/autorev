'use client';

/**
 * VehicleBuildPanel
 * 
 * Wrapper component for BuildEditor that handles:
 * - Fetching turbo options from database
 * - Saving build data to user_vehicles
 * - Displaying the current build status
 */

import { useState, useEffect, useCallback } from 'react';
import BuildEditor from './BuildEditor';
import styles from './VehicleBuildPanel.module.css';

export default function VehicleBuildPanel({
  vehicleId,
  carSlug,
  stockHp = 0,
  stockTorque = 0,
  installedMods = [],
  customSpecs = {},
  onUpdateBuild,
  onEstimateChange,
}) {
  const [turboOptions, setTurboOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch turbo options on mount
  useEffect(() => {
    async function fetchTurboOptions() {
      try {
        const response = await fetch(`/api/vehicles/${vehicleId}/build`);
        if (response.ok) {
          const data = await response.json();
          setTurboOptions(data.turboOptions || []);
        }
      } catch (err) {
        console.error('Failed to fetch turbo options:', err);
      } finally {
        setLoading(false);
      }
    }

    if (vehicleId) {
      fetchTurboOptions();
    } else {
      setLoading(false);
    }
  }, [vehicleId]);

  // Handle save
  const handleSave = useCallback(async (buildData) => {
    if (!vehicleId) {
      setError('No vehicle selected');
      return;
    }

    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const response = await fetch(`/api/vehicles/${vehicleId}/build`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildData),
      });

      if (!response.ok) {
        throw new Error('Failed to save build');
      }

      const result = await response.json();
      
      // Notify parent of the update
      if (onUpdateBuild) {
        onUpdateBuild(result.vehicle);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }, [vehicleId, onUpdateBuild]);

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
