 'use client';

import { useEffect, useMemo, useState } from 'react';
import AskALButton from '@/components/AskALButton';
import LoadingSpinner from '@/components/LoadingSpinner';
import styles from './VehicleHealthCard.module.css';

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

function computeHealth(health) {
  const today = new Date();
  const daysUntil = (d) => Math.floor((new Date(d) - today) / (1000 * 60 * 60 * 24));

  const issues = [];
  const warnings = [];

  if (health.next_oil_due_mileage && health.mileage) {
    const delta = health.next_oil_due_mileage - health.mileage;
    if (delta <= 0) issues.push('Oil change overdue');
    else if (delta <= 500) warnings.push('Oil change due soon');
  }

  if (health.registration_due_date) {
    const days = daysUntil(health.registration_due_date);
    if (days < 0) issues.push('Registration expired');
    else if (days <= 30) warnings.push('Registration due soon');
  }

  if (health.inspection_due_date) {
    const days = daysUntil(health.inspection_due_date);
    if (days < 0) issues.push('Inspection expired');
    else if (days <= 30) warnings.push('Inspection due soon');
  }

  if (health.battery_status === 'dead' || health.battery_status === 'weak') {
    issues.push('Battery health is poor');
  } else if (health.battery_status === 'fair') {
    warnings.push('Battery may need attention');
  }

  if (issues.length) return { tone: 'urgent', label: 'Urgent', message: issues[0], count: issues.length };
  if (warnings.length) return { tone: 'warn', label: 'Attention', message: warnings[0], count: warnings.length };
  return { tone: 'good', label: 'All Good', message: 'No urgent items', count: 0 };
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
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [baseline, setBaseline] = useState(null);
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

  const healthStatus = useMemo(() => computeHealth(baseline || {}), [baseline]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!userId || !vehicleId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/users/${userId}/vehicles/${vehicleId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Failed to load vehicle health');
        if (ignore) return;
        setBaseline(json);
        setForm({
          mileage: json.mileage ?? '',
          last_started_at: formatDateInput(json.last_started_at),
          battery_status: json.battery_status || 'unknown',
          last_oil_change_date: formatDateInput(json.last_oil_change_date),
          last_oil_change_mileage: json.last_oil_change_mileage ?? '',
          tire_installed_date: formatDateInput(json.tire_installed_date),
          tire_tread_32nds: json.tire_tread_32nds ?? '',
          registration_due_date: formatDateInput(json.registration_due_date),
          inspection_due_date: formatDateInput(json.inspection_due_date),
        });
      } catch (err) {
        if (!ignore) setError(err.message || 'Unable to load vehicle health');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [userId, vehicleId]);

  const handleChange = (key, value) => {
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

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/users/${userId}/vehicles/${vehicleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Update failed');
      setBaseline(json.vehicle || json);
      setForm({
        mileage: json.vehicle?.mileage ?? json.mileage ?? '',
        last_started_at: formatDateInput(json.vehicle?.last_started_at || json.last_started_at),
        battery_status: json.vehicle?.battery_status || json.battery_status || 'unknown',
        last_oil_change_date: formatDateInput(json.vehicle?.last_oil_change_date || json.last_oil_change_date),
        last_oil_change_mileage: json.vehicle?.last_oil_change_mileage ?? json.last_oil_change_mileage ?? '',
        tire_installed_date: formatDateInput(json.vehicle?.tire_installed_date || json.tire_installed_date),
        tire_tread_32nds: json.vehicle?.tire_tread_32nds ?? json.tire_tread_32nds ?? '',
        registration_due_date: formatDateInput(json.vehicle?.registration_due_date || json.registration_due_date),
        inspection_due_date: formatDateInput(json.vehicle?.inspection_due_date || json.inspection_due_date),
      });
      setSuccess('Saved');
    } catch (err) {
      setError(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
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
          <p className={styles.subtitle}>{vehicleName || 'Your vehicle'} • Tracking</p>
        </div>
        <div className={`${styles.badge} ${styles[healthStatus.tone]}`}>
          {healthStatus.label}
          {healthStatus.count > 0 ? ` • ${healthStatus.count}` : ''}
        </div>
      </div>

      <div>
        <p className={styles.sectionTitle}>Health Overview</p>
        <p className={styles.statusText}>{healthStatus.message}</p>
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
              onChange={(e) => handleChange('mileage', e.target.value === '' ? '' : Number(e.target.value))}
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
              onClick={() => handleChange('last_started_at', formatDateInput(new Date().toISOString()))}
            >
              Today
            </button>
          </div>
          <input
            className={styles.input}
            type="date"
            value={form.last_started_at}
            onChange={(e) => handleChange('last_started_at', e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <div className={styles.labelRow}>
            <span className={styles.label}>Battery Status</span>
          </div>
          <select
            className={styles.select}
            value={form.battery_status}
            onChange={(e) => handleChange('battery_status', e.target.value)}
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
            <span className={styles.label}>Last Oil Change</span>
            <div className={styles.twoCol}>
              <input
                className={styles.input}
                type="date"
                value={form.last_oil_change_date}
                onChange={(e) => handleChange('last_oil_change_date', e.target.value)}
              />
              <input
                className={styles.input}
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="Mileage"
                value={form.last_oil_change_mileage}
                onChange={(e) => handleChange('last_oil_change_mileage', e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Tires</span>
            <div className={styles.twoCol}>
              <input
                className={styles.input}
                type="date"
                value={form.tire_installed_date}
                onChange={(e) => handleChange('tire_installed_date', e.target.value)}
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
                onChange={(e) => handleChange('tire_tread_32nds', e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Registration Due</span>
            <input
              className={styles.input}
              type="date"
              value={form.registration_due_date}
              onChange={(e) => handleChange('registration_due_date', e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Inspection Due</span>
            <input
              className={styles.input}
              type="date"
              value={form.inspection_due_date}
              onChange={(e) => handleChange('inspection_due_date', e.target.value)}
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
              variant="compact"
              category="Vehicle Health"
              prompt={alPrompt}
              carName={vehicleName}
              className={styles.ghostButton}
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

