'use client';

import { useEffect, useMemo, useState } from 'react';
import AskALButton from '@/components/AskALButton';
import LoadingSpinner from '@/components/LoadingSpinner';
import styles from './VehicleHealthCard.module.css';
import { useUserVehicle, useUpdateVehicle } from '@/hooks/useUserData';

const BATTERY_OPTIONS = ['good', 'fair', 'weak', 'dead', 'unknown'];

function formatDateInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function parseDateInput(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function computeHealth(health, maintenanceSpecs) {
  const today = new Date();
  const daysUntil = (d) => Math.floor((new Date(d) - today) / (1000 * 60 * 60 * 24));

  const issues = [];
  const warnings = [];
  const details = [];

  // Oil change tracking
  if (health.next_oil_due_mileage && health.mileage) {
    const delta = health.next_oil_due_mileage - health.mileage;
    if (delta <= 0) {
      issues.push(`Oil change overdue by ${Math.abs(delta).toLocaleString()} mi`);
    } else if (delta <= 500) {
      warnings.push(`Oil change due in ${delta.toLocaleString()} mi`);
    } else {
      details.push(`Oil change in ${delta.toLocaleString()} mi`);
    }
  } else if (maintenanceSpecs?.oil_change_interval_miles && !health.last_oil_change_mileage) {
    // Has interval data but no tracking started
    warnings.push(`Oil tracking not started (interval: ${maintenanceSpecs.oil_change_interval_miles.toLocaleString()} mi)`);
  }

  if (health.registration_due_date) {
    const days = daysUntil(health.registration_due_date);
    if (days < 0) issues.push(`Registration expired ${Math.abs(days)} days ago`);
    else if (days <= 30) warnings.push(`Registration due in ${days} days`);
    else details.push(`Registration due: ${new Date(health.registration_due_date).toLocaleDateString()}`);
  }

  if (health.inspection_due_date) {
    const days = daysUntil(health.inspection_due_date);
    if (days < 0) issues.push(`Inspection expired ${Math.abs(days)} days ago`);
    else if (days <= 30) warnings.push(`Inspection due in ${days} days`);
    else details.push(`Inspection due: ${new Date(health.inspection_due_date).toLocaleDateString()}`);
  }

  if (health.battery_status === 'dead' || health.battery_status === 'weak') {
    issues.push('Battery health is poor');
  } else if (health.battery_status === 'fair') {
    warnings.push('Battery may need attention');
  }

  if (issues.length) return { tone: 'urgent', label: 'Urgent', message: issues[0], count: issues.length, allIssues: issues, allWarnings: warnings };
  if (warnings.length) return { tone: 'warn', label: 'Attention', message: warnings[0], count: warnings.length, allIssues: issues, allWarnings: warnings };
  if (details.length) return { tone: 'good', label: 'All Good', message: details[0], count: 0, allIssues: [], allWarnings: [] };
  return { tone: 'good', label: 'All Good', message: 'No urgent items', count: 0, allIssues: [], allWarnings: [] };
}

function buildPatchPayload(form, baseline) {
  const payload = {};
  Object.entries(form).forEach(([key, value]) => {
    const base = baseline?.[key];
    // For numbers and strings, only send when changed
    if (value !== base && value !== undefined) {
      payload[key] = value === '' ? null : value;
    }
  });
  return payload;
}

export default function VehicleHealthCard({
  userId,
  vehicleId,
  vehicleName,
  initialMileage,
  maintenanceSpecs, // Car-specific maintenance specs from vehicle_maintenance_specs table
}) {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState({
    mileage: initialMileage || '',
    last_started_at: '',
    battery_status: 'unknown',
    last_oil_change_date: '',
    last_oil_change_mileage: '',
    tire_installed_date: '',
    tire_tread_32nds: '',
    registration_due_date: '',
    inspection_due_date: '',
  });
  
  // React Query hooks
  const { 
    data: baseline,
    isLoading: loading,
    error: loadError,
  } = useUserVehicle(userId, vehicleId);
  
  const updateVehicle = useUpdateVehicle();
  const saving = updateVehicle.isPending;
  
  // Update form when vehicle data loads
  useEffect(() => {
    if (baseline) {
      setForm({
        mileage: baseline.mileage ?? '',
        last_started_at: formatDateInput(baseline.last_started_at),
        battery_status: baseline.battery_status || 'unknown',
        last_oil_change_date: formatDateInput(baseline.last_oil_change_date),
        last_oil_change_mileage: baseline.last_oil_change_mileage ?? '',
        tire_installed_date: formatDateInput(baseline.tire_installed_date),
        tire_tread_32nds: baseline.tire_tread_32nds ?? '',
        registration_due_date: formatDateInput(baseline.registration_due_date),
        inspection_due_date: formatDateInput(baseline.inspection_due_date),
      });
    }
  }, [baseline]);
  
  // Set error from load error
  useEffect(() => {
    if (loadError) {
      setError(loadError.message || 'Unable to load vehicle health');
    }
  }, [loadError]);

  const healthStatus = useMemo(() => computeHealth(baseline || {}, maintenanceSpecs), [baseline, maintenanceSpecs]);

  const handleHealthFieldChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSuccess('');
    setError('');
  };

  const handleSave = async () => {
    if (!userId || !vehicleId) {
      setError('User authentication required.');
      return;
    }
    const payload = buildPatchPayload(
      {
        ...form,
        last_started_at: parseDateInput(form.last_started_at),
        last_oil_change_date: parseDateInput(form.last_oil_change_date),
        tire_installed_date: parseDateInput(form.tire_installed_date),
        registration_due_date: parseDateInput(form.registration_due_date),
        inspection_due_date: parseDateInput(form.inspection_due_date),
      },
      {
        ...baseline,
        last_started_at: baseline?.last_started_at,
        last_oil_change_date: baseline?.last_oil_change_date,
        tire_installed_date: baseline?.tire_installed_date,
        registration_due_date: baseline?.registration_due_date,
        inspection_due_date: baseline?.inspection_due_date,
      },
    );

    if (Object.keys(payload).length === 0) {
      setSuccess('No changes to save.');
      return;
    }

    setError('');
    setSuccess('');
    try {
      await updateVehicle.mutateAsync({ userId, vehicleId, updates: payload });
      setSuccess('Saved');
    } catch (err) {
      setError(err.message || 'Failed to save changes');
    }
  };

  const alPrompt = useMemo(() => {
    const parts = [];
    const name = vehicleName || 'my vehicle';
    if (baseline?.mileage) parts.push(`Mileage: ${baseline.mileage.toLocaleString()}`);
    if (baseline?.next_oil_due_mileage)
      parts.push(`Next oil due mileage: ${baseline.next_oil_due_mileage.toLocaleString()}`);
    if (baseline?.battery_status) parts.push(`Battery: ${baseline.battery_status}`);
    if (baseline?.registration_due_date)
      parts.push(`Registration due: ${formatDateInput(baseline.registration_due_date)}`);
    if (baseline?.inspection_due_date)
      parts.push(`Inspection due: ${formatDateInput(baseline.inspection_due_date)}`);
    return `Analyze maintenance status for ${name}. ${parts.join(' | ') || 'No tracking data yet.'} Provide next best actions.`;
  }, [baseline, vehicleName]);

  return (
    <div className={styles.card}>
      <div className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <p className={styles.title}>Vehicle Health</p>
          <p className={styles.subtitle}>{vehicleName || 'Your vehicle'}</p>
        </div>
        <div className={`${styles.badge} ${styles[healthStatus.tone]}`}>
          {healthStatus.label}{healthStatus.count > 0 ? ` • ${healthStatus.count}` : ''}
        </div>
      </div>

      <div className={styles.healthOverview}>
        {/* Combined alerts - show all issues and warnings in one list */}
        {(healthStatus.allIssues?.length > 0 || healthStatus.allWarnings?.length > 0) ? (
          <div className={styles.alertList}>
            {healthStatus.allIssues?.map((issue, i) => (
              <p key={`issue-${i}`} className={styles.alertItem} data-type="urgent">⚠️ {issue}</p>
            ))}
            {healthStatus.allWarnings?.map((warn, i) => (
              <p key={`warn-${i}`} className={styles.alertItem} data-type="warn">⚡ {warn}</p>
            ))}
          </div>
        ) : (
          <p className={styles.statusText}>✓ {healthStatus.message}</p>
        )}
        
        {/* Car-specific maintenance schedule - compact */}
        {maintenanceSpecs && (maintenanceSpecs.oil_change_interval_miles || maintenanceSpecs.coolant_change_interval_miles || maintenanceSpecs.brake_fluid_change_interval_years) && (
          <div className={styles.scheduleBox}>
            <p className={styles.scheduleTitle}>Maintenance Schedule</p>
            <div className={styles.scheduleItems}>
              {maintenanceSpecs.oil_change_interval_miles && (
                <span className={styles.scheduleItem}>
                  🛢️ Oil: {maintenanceSpecs.oil_change_interval_miles.toLocaleString()} mi
                  {maintenanceSpecs.oil_viscosity && ` (${maintenanceSpecs.oil_viscosity})`}
                </span>
              )}
              {maintenanceSpecs.coolant_change_interval_miles && (
                <span className={styles.scheduleItem}>
                  🧊 Coolant: {maintenanceSpecs.coolant_change_interval_miles.toLocaleString()} mi
                </span>
              )}
              {maintenanceSpecs.brake_fluid_change_interval_years && (
                <span className={styles.scheduleItem}>
                  🔴 Brake Fluid: {maintenanceSpecs.brake_fluid_change_interval_years} yr
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className={styles.grid}>
        <div className={styles.field}>
          <div className={styles.labelRow}>
            <span className={styles.label}>Mileage</span>
          </div>
          <div className={styles.inputRow}>
            <input
              className={styles.input}
              type="number"
              inputMode="numeric"
              min={0}
              value={form.mileage}
              onChange={(e) => handleHealthFieldChange('mileage', e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Enter mileage"
            />
          </div>
        </div>

        <div className={styles.field}>
          <div className={styles.labelRow}>
            <span className={styles.label}>Last Started</span>
            <button
              className={`${styles.smallButton} ${styles.secondary}`}
              type="button"
              onClick={() => handleHealthFieldChange('last_started_at', formatDateInput(new Date().toISOString()))}
            >
              Today
            </button>
          </div>
          <input
            className={styles.input}
            type="date"
            value={form.last_started_at}
            onChange={(e) => handleHealthFieldChange('last_started_at', e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <div className={styles.labelRow}>
            <span className={styles.label}>Battery Status</span>
          </div>
          <select
            className={styles.select}
            value={form.battery_status}
            onChange={(e) => handleHealthFieldChange('battery_status', e.target.value)}
          >
            {BATTERY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <p className={styles.helper}>Enum: good, fair, weak, dead, unknown</p>
        </div>
      </div>

      <div className={styles.collapseHeader} onClick={() => setExpanded((v) => !v)}>
        <span className={styles.collapseTitle}>Service Tracking</span>
        <span className={`${styles.chevron} ${expanded ? styles.open : ''}`}>⌄</span>
      </div>

      {expanded && (
        <div className={styles.grid}>
          <div className={styles.field}>
            <div className={styles.labelRow}>
              <span className={styles.label}>Last Oil Change</span>
              {maintenanceSpecs?.oil_change_interval_miles && (
                <span className={styles.intervalHint}>
                  Interval: {maintenanceSpecs.oil_change_interval_miles.toLocaleString()} mi
                </span>
              )}
            </div>
            <div className={styles.twoCol}>
              <input
                className={styles.input}
                type="date"
                value={form.last_oil_change_date}
                onChange={(e) => handleHealthFieldChange('last_oil_change_date', e.target.value)}
              />
              <input
                className={styles.input}
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="Mileage"
                value={form.last_oil_change_mileage}
                onChange={(e) => handleHealthFieldChange('last_oil_change_mileage', e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
            {baseline?.next_oil_due_mileage && (
              <p className={styles.helper}>
                Next due: {baseline.next_oil_due_mileage.toLocaleString()} mi
              </p>
            )}
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Tires</span>
            <div className={styles.twoCol}>
              <input
                className={styles.input}
                type="date"
                value={form.tire_installed_date}
                onChange={(e) => handleHealthFieldChange('tire_installed_date', e.target.value)}
              />
              <input
                className={styles.input}
                type="number"
                inputMode="numeric"
                min={0}
                max={11}
                step="1"
                placeholder="Tread (32nds)"
                value={form.tire_tread_32nds}
                onChange={(e) => handleHealthFieldChange('tire_tread_32nds', e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Registration Due</span>
            <input
              className={styles.input}
              type="date"
              value={form.registration_due_date}
              onChange={(e) => handleHealthFieldChange('registration_due_date', e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Inspection Due</span>
            <input
              className={styles.input}
              type="date"
              value={form.inspection_due_date}
              onChange={(e) => handleHealthFieldChange('inspection_due_date', e.target.value)}
            />
          </div>
        </div>
      )}

      <div className={styles.actionsRow}>
        {error && <p className={styles.error}>{error}</p>}
        {success && <p className={styles.success}>{success}</p>}
        {saving ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LoadingSpinner size="small" />
            <span className={styles.statusText}>Saving...</span>
          </div>
        ) : (
          <>
            <button className={styles.primaryButton} type="button" onClick={handleSave}>
              Save Changes
            </button>
            <AskALButton
              variant="header"
              category="Vehicle Health"
              prompt={alPrompt}
              carName={vehicleName}
            />
          </>
        )}
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LoadingSpinner size="small" />
          <span className={styles.statusText}>Loading vehicle health...</span>
        </div>
      )}
    </div>
  );
}

