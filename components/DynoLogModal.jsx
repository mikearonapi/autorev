'use client';

/**
 * Dyno Log Modal
 * 
 * Modal for logging dyno results to track actual vs predicted power.
 * Part of the "My Data" feedback loop vision - allows users to enter
 * real-world dyno results to compare against AutoRev predictions.
 * 
 * Database table: user_dyno_results
 * 
 * Brand Colors:
 * - Teal (#10b981): Positive/improvements, success actions
 * - Blue (#3b82f6): Baseline/stock data
 * - Lime (#d4ff00): Primary CTAs
 */

import { useState, useEffect, useRef } from 'react';
import styles from './DynoLogModal.module.css';
import { useSafeAreaColor, SAFE_AREA_COLORS } from '@/hooks/useSafeAreaColor';

// SVG Icons
const ChartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 3v18h18"/>
    <path d="M18 17V9"/>
    <path d="M13 17V5"/>
    <path d="M8 17v-3"/>
  </svg>
);

const UploadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const GaugeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 6v6l4 2"/>
  </svg>
);

const ThermometerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
  </svg>
);

const CloudIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
  </svg>
);

const MountainIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M8 3l4 8 5-5 5 15H2L8 3z"/>
  </svg>
);

// Dyno type options
const DYNO_TYPES = [
  { value: 'dynojet', label: 'Dynojet', description: 'Inertia dyno - typically reads higher' },
  { value: 'mustang', label: 'Mustang', description: 'Load-bearing dyno - more conservative' },
  { value: 'awd_dynopack', label: 'AWD Dynopack', description: 'Hub-mount AWD dyno' },
  { value: 'mainline', label: 'Mainline', description: 'Hub-mount dyno' },
  { value: 'dyno_dynamics', label: 'Dyno Dynamics', description: 'Hub-mount dyno' },
  { value: 'other', label: 'Other', description: '' },
];

// Fuel type options
const FUEL_TYPES = [
  { value: '91_pump', label: '91 Octane (Pump)' },
  { value: '93_pump', label: '93 Octane (Pump)' },
  { value: 'e85', label: 'E85' },
  { value: 'e50', label: 'E50 Mix' },
  { value: 'race_100', label: 'Race Gas (100 oct)' },
  { value: 'race_104', label: 'Race Gas (104 oct)' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'other', label: 'Other' },
];

// Correction factor options
const CORRECTION_FACTORS = [
  { value: 'sae', label: 'SAE J1349', description: 'Standard automotive correction' },
  { value: 'std', label: 'STD', description: 'Standard correction' },
  { value: 'din', label: 'DIN', description: 'European standard' },
  { value: 'uncorrected', label: 'Uncorrected', description: 'Raw numbers' },
];

export default function DynoLogModal({
  isOpen,
  onClose,
  onSave,
  vehicleInfo,
  predictedWhp,
  editingResult = null,
  currentBuildInfo = null, // { upgrades: [], totalHpGain, estimatedHp }
}) {
  // Set safe area color to match overlay background when modal is open
  useSafeAreaColor(SAFE_AREA_COLORS.OVERLAY, { enabled: isOpen });
  
  const [formData, setFormData] = useState({
    whp: '',
    wtq: '',
    boostPsi: '',
    fuelType: '93_pump',
    dynoType: 'dynojet',
    dynoDate: new Date().toISOString().split('T')[0],
    dynoShop: '',
    dynoSheetUrl: '',
    ambientTempF: '',
    humidityPercent: '',
    altitudeFt: '',
    correctionFactor: 'sae',
    notes: '',
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingSheet, setUploadingSheet] = useState(false);
  const fileInputRef = useRef(null);

  // Initialize form for editing
  useEffect(() => {
    if (editingResult) {
      setFormData({
        whp: editingResult.whp || '',
        wtq: editingResult.wtq || '',
        boostPsi: editingResult.boost_psi || '',
        fuelType: editingResult.fuel_type || '93_pump',
        dynoType: editingResult.dyno_type || 'dynojet',
        dynoDate: editingResult.dyno_date || new Date().toISOString().split('T')[0],
        dynoShop: editingResult.dyno_shop || '',
        dynoSheetUrl: editingResult.dyno_sheet_url || '',
        ambientTempF: editingResult.ambient_temp_f || '',
        humidityPercent: editingResult.humidity_percent || '',
        altitudeFt: editingResult.altitude_ft || '',
        correctionFactor: editingResult.correction_factor || 'sae',
        notes: editingResult.notes || '',
      });
    } else {
      // Reset for new entry
      setFormData({
        whp: '',
        wtq: '',
        boostPsi: '',
        fuelType: '93_pump',
        dynoType: 'dynojet',
        dynoDate: new Date().toISOString().split('T')[0],
        dynoShop: '',
        dynoSheetUrl: '',
        ambientTempF: '',
        humidityPercent: '',
        altitudeFt: '',
        correctionFactor: 'sae',
        notes: '',
      });
    }
  }, [editingResult, isOpen]);

  // Calculate difference from prediction
  const whpDiff = formData.whp && predictedWhp 
    ? parseInt(formData.whp) - predictedWhp 
    : null;

  // Validate form
  const validate = () => {
    const newErrors = {};
    
    if (!formData.whp || parseInt(formData.whp) < 1) {
      newErrors.whp = 'Wheel horsepower is required';
    }
    if (!formData.dynoDate) {
      newErrors.dynoDate = 'Dyno date is required';
    }
    if (formData.whp && parseInt(formData.whp) > 3000) {
      newErrors.whp = 'Value seems too high. Please verify.';
    }
    if (formData.wtq && parseInt(formData.wtq) > 3000) {
      newErrors.wtq = 'Value seems too high. Please verify.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle file upload (placeholder - would integrate with storage)
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, upload: 'Please upload an image or PDF' }));
      return;
    }
    
    // File size limit (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, upload: 'File must be under 10MB' }));
      return;
    }
    
    setUploadingSheet(true);
    
    try {
      // TODO: Implement actual upload to Supabase storage
      // For now, just show the filename
      setFormData(prev => ({ 
        ...prev, 
        dynoSheetUrl: URL.createObjectURL(file) // Temporary preview URL
      }));
      setErrors(prev => {
        const { upload, ...rest } = prev;
        return rest;
      });
    } catch (err) {
      console.error('[DynoLogModal] Upload error:', err);
      setErrors(prev => ({ ...prev, upload: 'Upload failed. Please try again.' }));
    } finally {
      setUploadingSheet(false);
    }
  };

  // Handle submit
  const handleDynoRunSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    
    try {
      await onSave({
        whp: parseInt(formData.whp),
        wtq: formData.wtq ? parseInt(formData.wtq) : null,
        boostPsi: formData.boostPsi ? parseFloat(formData.boostPsi) : null,
        fuelType: formData.fuelType,
        dynoType: formData.dynoType,
        dynoDate: formData.dynoDate,
        dynoShop: formData.dynoShop || null,
        dynoSheetUrl: formData.dynoSheetUrl || null,
        ambientTempF: formData.ambientTempF ? parseInt(formData.ambientTempF) : null,
        humidityPercent: formData.humidityPercent ? parseInt(formData.humidityPercent) : null,
        altitudeFt: formData.altitudeFt ? parseInt(formData.altitudeFt) : null,
        correctionFactor: formData.correctionFactor,
        notes: formData.notes || null,
      });
      
      onClose();
    } catch (err) {
      console.error('[DynoLogModal] Error saving:', err);
      setErrors({ submit: 'Failed to save dyno result. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose} data-overlay-modal>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <span className={styles.titleIcon}><ChartIcon /></span>
            <h2 className={styles.title}>
              {editingResult ? 'Edit Dyno Result' : 'Log Dyno Result'}
            </h2>
          </div>
          {vehicleInfo && (
            <p className={styles.vehicleInfo}>
              {vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}
            </p>
          )}
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">×</button>
        </div>

        <form onSubmit={handleDynoRunSubmit} className={styles.form}>
          {/* Prediction Comparison Banner */}
          {predictedWhp && (
            <div className={styles.predictionBanner}>
              <div className={styles.predictionInfo}>
                <span className={styles.predictionLabel}>AutoRev Prediction</span>
                <span className={styles.predictionValue}>{predictedWhp} WHP</span>
              </div>
              {whpDiff !== null && (
                <div className={`${styles.predictionDiff} ${whpDiff >= 0 ? styles.positive : styles.negative}`}>
                  {whpDiff >= 0 ? '+' : ''}{whpDiff} WHP
                </div>
              )}
            </div>
          )}
          
          {/* Current Build Snapshot (read-only) */}
          {currentBuildInfo && currentBuildInfo.upgrades && currentBuildInfo.upgrades.length > 0 && !editingResult && (
            <div className={styles.buildSnapshot}>
              <span className={styles.buildSnapshotLabel}>Build at time of dyno:</span>
              <span className={styles.buildSnapshotValue}>
                {currentBuildInfo.upgrades.length} mods (+{currentBuildInfo.totalHpGain || 0} HP)
              </span>
            </div>
          )}

          {/* Power Numbers Section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <GaugeIcon />
              Power Numbers
            </h3>
            <div className={styles.powerGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Wheel HP *</label>
                <div className={styles.inputWithSuffix}>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={formData.whp}
                    onChange={(e) => setFormData(prev => ({ ...prev, whp: e.target.value }))}
                    className={`${styles.input} ${styles.largeInput}`}
                    placeholder="0"
                    autoFocus
                  />
                  <span className={styles.suffix}>WHP</span>
                </div>
                {errors.whp && <span className={styles.error}>{errors.whp}</span>}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Wheel TQ</label>
                <div className={styles.inputWithSuffix}>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={formData.wtq}
                    onChange={(e) => setFormData(prev => ({ ...prev, wtq: e.target.value }))}
                    className={`${styles.input} ${styles.largeInput}`}
                    placeholder="0"
                  />
                  <span className={styles.suffix}>WTQ</span>
                </div>
                {errors.wtq && <span className={styles.error}>{errors.wtq}</span>}
              </div>

              {/* Boost PSI - only show if applicable */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Boost</label>
                <div className={styles.inputWithSuffix}>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={formData.boostPsi}
                    onChange={(e) => setFormData(prev => ({ ...prev, boostPsi: e.target.value }))}
                    className={styles.input}
                    placeholder="0"
                  />
                  <span className={styles.suffix}>PSI</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dyno Details Section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Dyno Details</h3>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Dyno Type *</label>
                <select
                  value={formData.dynoType}
                  onChange={(e) => setFormData(prev => ({ ...prev, dynoType: e.target.value }))}
                  className={styles.select}
                >
                  {DYNO_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Fuel Type</label>
                <select
                  value={formData.fuelType}
                  onChange={(e) => setFormData(prev => ({ ...prev, fuelType: e.target.value }))}
                  className={styles.select}
                >
                  {FUEL_TYPES.map(fuel => (
                    <option key={fuel.value} value={fuel.value}>{fuel.label}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Dyno Date *</label>
                <input
                  type="date"
                  value={formData.dynoDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dynoDate: e.target.value }))}
                  className={styles.input}
                  max={new Date().toISOString().split('T')[0]}
                />
                {errors.dynoDate && <span className={styles.error}>{errors.dynoDate}</span>}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Dyno Shop</label>
                <input
                  type="text"
                  value={formData.dynoShop}
                  onChange={(e) => setFormData(prev => ({ ...prev, dynoShop: e.target.value }))}
                  className={styles.input}
                  placeholder="Shop name"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Correction Factor</label>
                <select
                  value={formData.correctionFactor}
                  onChange={(e) => setFormData(prev => ({ ...prev, correctionFactor: e.target.value }))}
                  className={styles.select}
                >
                  {CORRECTION_FACTORS.map(cf => (
                    <option key={cf.value} value={cf.value}>{cf.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Conditions Section (Collapsible) */}
          <details className={styles.detailsSection}>
            <summary className={styles.detailsSummary}>
              <span className={styles.detailsIcon}><ThermometerIcon /></span>
              Ambient Conditions (Optional)
            </summary>
            <div className={styles.conditionsGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <ThermometerIcon /> Temperature
                </label>
                <div className={styles.inputWithSuffix}>
                  <input
                    type="number"
                    value={formData.ambientTempF}
                    onChange={(e) => setFormData(prev => ({ ...prev, ambientTempF: e.target.value }))}
                    className={styles.input}
                    placeholder="70"
                  />
                  <span className={styles.suffix}>°F</span>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <CloudIcon /> Humidity
                </label>
                <div className={styles.inputWithSuffix}>
                  <input
                    type="number"
                    value={formData.humidityPercent}
                    onChange={(e) => setFormData(prev => ({ ...prev, humidityPercent: e.target.value }))}
                    className={styles.input}
                    placeholder="50"
                    max="100"
                  />
                  <span className={styles.suffix}>%</span>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <MountainIcon /> Altitude
                </label>
                <div className={styles.inputWithSuffix}>
                  <input
                    type="number"
                    value={formData.altitudeFt}
                    onChange={(e) => setFormData(prev => ({ ...prev, altitudeFt: e.target.value }))}
                    className={styles.input}
                    placeholder="500"
                  />
                  <span className={styles.suffix}>ft</span>
                </div>
              </div>
            </div>
          </details>

          {/* Dyno Sheet & Notes - Collapsible */}
          <details className={styles.detailsSection}>
            <summary className={styles.detailsSummary}>
              <span className={styles.detailsIcon}><UploadIcon /></span>
              Dyno Sheet & Notes (Optional)
            </summary>
            <div className={styles.optionalContent}>
              {/* Dyno Sheet Upload */}
              <div className={styles.uploadArea} onClick={() => fileInputRef.current?.click()}>
                {formData.dynoSheetUrl ? (
                  <div className={styles.uploadedFile}>
                    <span className={styles.uploadedIcon}>✓</span>
                    <span className={styles.uploadedText}>Dyno sheet attached</span>
                    <button 
                      type="button"
                      className={styles.removeFileBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData(prev => ({ ...prev, dynoSheetUrl: '' }));
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <UploadIcon />
                    <span className={styles.uploadText}>
                      {uploadingSheet ? 'Uploading...' : 'Tap to upload dyno sheet'}
                    </span>
                    <span className={styles.uploadHint}>PNG, JPG, PDF (max 10MB)</span>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className={styles.fileInput}
                />
              </div>
              {errors.upload && <span className={styles.error}>{errors.upload}</span>}

              {/* Notes */}
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className={styles.textarea}
                placeholder="Tuner notes, conditions, issues..."
                rows={2}
              />
            </div>
          </details>

          {/* Error Message */}
          {errors.submit && (
            <div className={styles.submitError}>{errors.submit}</div>
          )}
        </form>

        {/* Actions - Outside form for proper flex positioning */}
        <div className={styles.actions}>
          <button 
            type="button" 
            className={styles.cancelBtn}
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            type="button"
            className={styles.saveBtn}
            disabled={isSubmitting}
            onClick={handleDynoRunSubmit}
          >
            {isSubmitting ? 'Saving...' : editingResult ? 'Update Result' : 'Log Result'}
          </button>
        </div>
      </div>
    </div>
  );
}
