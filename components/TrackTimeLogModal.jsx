'use client';

/**
 * Track Time Log Modal
 * 
 * Modal for logging actual track/lap times to compare against predictions.
 * Part of the "My Data" feedback loop vision.
 * 
 * Database table: user_track_times
 * 
 * Brand Colors:
 * - Teal (#10b981): Positive/improvements, success actions
 * - Blue (#3b82f6): Baseline/stock data
 * - Lime (#d4ff00): Primary CTAs
 */

import { useState, useEffect } from 'react';

import { createPortal } from 'react-dom';

import styles from './TrackTimeLogModal.module.css';

// SVG Icons
const FlagIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
    <line x1="4" y1="22" x2="4" y2="15"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
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

// Common tracks - user can also type custom
const POPULAR_TRACKS = [
  'Laguna Seca',
  'Road Atlanta',
  'Watkins Glen',
  'Virginia International Raceway (VIR)',
  'Road America',
  'Buttonwillow',
  'Thunderhill',
  'Sebring',
  'Mid-Ohio',
  'Barber Motorsports Park',
  'Nürburgring Nordschleife',
  'Spa-Francorchamps',
  'Circuit of the Americas (COTA)',
  'Sonoma Raceway',
  'Portland International Raceway',
  'Other',
];

// Tire compound options
const TIRE_COMPOUNDS = [
  { value: 'all-season', label: 'All-Season' },
  { value: 'summer', label: 'Summer Performance' },
  { value: 'max-performance-summer', label: 'Max Performance Summer' },
  { value: 'r-compound', label: 'R-Compound / Track' },
  { value: 'slicks', label: 'Slicks' },
];

// Session type options
const SESSION_TYPES = [
  { value: 'track_day', label: 'Track Day' },
  { value: 'time_attack', label: 'Time Attack' },
  { value: 'practice', label: 'Practice' },
  { value: 'competition', label: 'Competition' },
  { value: 'autocross', label: 'Autocross' },
  { value: 'driving_school', label: 'Driving School / HPDE' },
];

// Track conditions
const CONDITIONS = [
  { value: 'dry', label: 'Dry' },
  { value: 'damp', label: 'Damp' },
  { value: 'wet', label: 'Wet' },
  { value: 'cold', label: 'Cold Track (<60°F)' },
  { value: 'hot', label: 'Hot Track (>90°F)' },
  { value: 'optimal', label: 'Optimal' },
];

// Timing systems
const TIMING_SYSTEMS = [
  { value: '', label: 'Not specified' },
  { value: 'aim', label: 'AIM' },
  { value: 'racecapture', label: 'RaceCapture' },
  { value: 'trackaddict', label: 'TrackAddict' },
  { value: 'harrys_laptimer', label: "Harry's LapTimer" },
  { value: 'racechrono', label: 'RaceChrono' },
  { value: 'circuit_timing', label: 'Circuit Official Timing' },
  { value: 'other', label: 'Other' },
];

/**
 * Convert seconds to MM:SS.mmm format
 */
function formatLapTime(seconds) {
  if (!seconds) return '';
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3);
  return `${mins}:${secs.padStart(6, '0')}`;
}

/**
 * Parse MM:SS.mmm or SS.mmm to seconds
 */
function parseLapTime(timeStr) {
  if (!timeStr) return null;
  
  // Handle MM:SS.mmm format
  if (timeStr.includes(':')) {
    const [mins, secs] = timeStr.split(':');
    return (parseInt(mins) * 60) + parseFloat(secs);
  }
  
  // Just seconds
  return parseFloat(timeStr);
}

export default function TrackTimeLogModal({
  isOpen,
  onClose,
  onSave,
  vehicleInfo,
  predictedTime,      // Predicted lap time in seconds for comparison
  selectedTrack,      // Pre-selected track if any
  editingResult = null,
  currentBuildInfo = null, // { upgrades: [], totalHpGain, estimatedHp }
}) {
  // Portal mounting - required for SSR compatibility
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Prevent body scroll when open (matches OnboardingPopup)
  // Critical for iOS when keyboard appears - prevents content from peeking through safe areas
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Directly set safe area backgrounds to charcoal for full immersion
      // This ensures coverage even if :has() selector timing is delayed
      document.documentElement.style.setProperty('--safe-area-top-bg', '#1a1a1a');
      document.documentElement.style.setProperty('--safe-area-bottom-bg', '#1a1a1a');
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      // Reset safe area backgrounds to default
      document.documentElement.style.removeProperty('--safe-area-top-bg');
      document.documentElement.style.removeProperty('--safe-area-bottom-bg');
    };
  }, [isOpen]);
  
  const [formData, setFormData] = useState({
    trackName: '',
    trackConfig: '',
    lapTimeMinutes: '',
    lapTimeSeconds: '',
    sessionDate: new Date().toISOString().split('T')[0],
    sessionType: 'track_day',
    conditions: 'dry',
    tireCompound: 'summer',
    ambientTempF: '',
    trackTempF: '',
    timingSystem: '',
    notes: '',
    highlights: '',
    areasToImprove: '',
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCustomTrack, setShowCustomTrack] = useState(false);

  // Calculate lap time in seconds
  const lapTimeSeconds = formData.lapTimeMinutes && formData.lapTimeSeconds
    ? (parseInt(formData.lapTimeMinutes) * 60) + parseFloat(formData.lapTimeSeconds)
    : formData.lapTimeSeconds
      ? parseFloat(formData.lapTimeSeconds)
      : null;

  // Calculate difference from prediction
  const timeDiff = lapTimeSeconds && predictedTime 
    ? lapTimeSeconds - predictedTime 
    : null;

  // Initialize form for editing
  useEffect(() => {
    if (editingResult) {
      const totalSeconds = editingResult.lap_time_seconds;
      const mins = Math.floor(totalSeconds / 60);
      const secs = (totalSeconds % 60).toFixed(3);
      
      setFormData({
        trackName: editingResult.track_name || '',
        trackConfig: editingResult.track_config || '',
        lapTimeMinutes: mins > 0 ? mins.toString() : '',
        lapTimeSeconds: secs,
        sessionDate: editingResult.session_date || new Date().toISOString().split('T')[0],
        sessionType: editingResult.session_type || 'track_day',
        conditions: editingResult.conditions || 'dry',
        tireCompound: editingResult.tire_compound || 'summer',
        ambientTempF: editingResult.ambient_temp_f || '',
        trackTempF: editingResult.track_temp_f || '',
        timingSystem: editingResult.timing_system || '',
        notes: editingResult.notes || '',
        highlights: editingResult.highlights || '',
        areasToImprove: editingResult.areas_to_improve || '',
      });
      
      // Check if track is custom
      if (editingResult.track_name && !POPULAR_TRACKS.includes(editingResult.track_name)) {
        setShowCustomTrack(true);
      }
    } else {
      // Reset for new entry
      setFormData({
        trackName: selectedTrack || '',
        trackConfig: '',
        lapTimeMinutes: '',
        lapTimeSeconds: '',
        sessionDate: new Date().toISOString().split('T')[0],
        sessionType: 'track_day',
        conditions: 'dry',
        tireCompound: 'summer',
        ambientTempF: '',
        trackTempF: '',
        timingSystem: '',
        notes: '',
        highlights: '',
        areasToImprove: '',
      });
      setShowCustomTrack(false);
    }
  }, [editingResult, isOpen, selectedTrack]);

  // Handle track selection
  const handleTrackChange = (e) => {
    const value = e.target.value;
    if (value === 'Other') {
      setShowCustomTrack(true);
      setFormData(prev => ({ ...prev, trackName: '' }));
    } else {
      setShowCustomTrack(false);
      setFormData(prev => ({ ...prev, trackName: value }));
    }
  };

  // Validate form
  const validate = () => {
    const newErrors = {};
    
    if (!formData.trackName.trim()) {
      newErrors.trackName = 'Track name is required';
    }
    
    if (!lapTimeSeconds || lapTimeSeconds < 20) {
      newErrors.lapTime = 'Valid lap time is required (minimum 20 seconds)';
    }
    
    if (lapTimeSeconds > 1200) {
      newErrors.lapTime = 'Lap time seems too long. Please verify (max 20 minutes)';
    }
    
    if (!formData.sessionDate) {
      newErrors.sessionDate = 'Session date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleLapTimeSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    
    try {
      await onSave({
        trackName: formData.trackName.trim(),
        trackConfig: formData.trackConfig || null,
        lapTimeSeconds,
        sessionDate: formData.sessionDate,
        sessionType: formData.sessionType,
        conditions: formData.conditions,
        tireCompound: formData.tireCompound,
        ambientTempF: formData.ambientTempF ? parseInt(formData.ambientTempF) : null,
        trackTempF: formData.trackTempF ? parseInt(formData.trackTempF) : null,
        timingSystem: formData.timingSystem || null,
        notes: formData.notes || null,
        highlights: formData.highlights || null,
        areasToImprove: formData.areasToImprove || null,
      });
      
      onClose();
    } catch (err) {
      console.error('[TrackTimeLogModal] Error saving:', err);
      setErrors({ submit: 'Failed to save track time. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't render until mounted (SSR) or if not open
  if (!isMounted || !isOpen) return null;

  const modalContent = (
    <div className={styles.overlay} onClick={onClose} data-overlay-modal>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <span className={styles.titleIcon}><FlagIcon /></span>
            <h2 className={styles.title}>
              {editingResult ? 'Edit Lap Time' : 'Log Lap Time'}
            </h2>
          </div>
          {vehicleInfo && (
            <p className={styles.vehicleInfo}>
              {vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}
            </p>
          )}
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">×</button>
        </div>

        <form onSubmit={handleLapTimeSubmit} className={styles.form}>
          {/* Track & Time Section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <FlagIcon />
              Track & Time
            </h3>
            
            <div className={styles.formGrid}>
              {/* Track Selection */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Track *</label>
                {!showCustomTrack ? (
                  <select
                    value={formData.trackName}
                    onChange={handleTrackChange}
                    className={styles.select}
                  >
                    <option value="">Select a track...</option>
                    {POPULAR_TRACKS.map(track => (
                      <option key={track} value={track}>{track}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.trackName}
                    onChange={(e) => setFormData(prev => ({ ...prev, trackName: e.target.value }))}
                    className={styles.input}
                    placeholder="Enter track name"
                    autoFocus
                  />
                )}
                {showCustomTrack && (
                  <button 
                    type="button"
                    className={styles.switchBtn}
                    onClick={() => {
                      setShowCustomTrack(false);
                      setFormData(prev => ({ ...prev, trackName: '' }));
                    }}
                  >
                    ← Choose from list
                  </button>
                )}
                {errors.trackName && <span className={styles.error}>{errors.trackName}</span>}
              </div>

              {/* Track Configuration */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Configuration</label>
                <input
                  type="text"
                  value={formData.trackConfig}
                  onChange={(e) => setFormData(prev => ({ ...prev, trackConfig: e.target.value }))}
                  className={styles.input}
                  placeholder="e.g., Full Course, GP Circuit"
                />
              </div>
            </div>

            {/* Lap Time Input */}
            <div className={styles.lapTimeSection}>
              <label className={styles.label}>Lap Time *</label>
              <div className={styles.lapTimeInputs}>
                <div className={styles.lapTimeField}>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={formData.lapTimeMinutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, lapTimeMinutes: e.target.value }))}
                    className={`${styles.input} ${styles.lapTimeInput}`}
                    placeholder="0"
                  />
                  <span className={styles.lapTimeUnit}>min</span>
                </div>
                <span className={styles.lapTimeSeparator}>:</span>
                <div className={styles.lapTimeField}>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    max="59.999"
                    value={formData.lapTimeSeconds}
                    onChange={(e) => setFormData(prev => ({ ...prev, lapTimeSeconds: e.target.value }))}
                    className={`${styles.input} ${styles.lapTimeInput}`}
                    placeholder="00.000"
                  />
                  <span className={styles.lapTimeUnit}>sec</span>
                </div>
              </div>
              {lapTimeSeconds && (
                <div className={styles.lapTimePreview}>
                  {formatLapTime(lapTimeSeconds)}
                </div>
              )}
              {errors.lapTime && <span className={styles.error}>{errors.lapTime}</span>}
            </div>
          </div>

          {/* Session Details */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Session Details</h3>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Session Date *</label>
                <input
                  type="date"
                  value={formData.sessionDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, sessionDate: e.target.value }))}
                  className={styles.input}
                  max={new Date().toISOString().split('T')[0]}
                />
                {errors.sessionDate && <span className={styles.error}>{errors.sessionDate}</span>}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Session Type</label>
                <select
                  value={formData.sessionType}
                  onChange={(e) => setFormData(prev => ({ ...prev, sessionType: e.target.value }))}
                  className={styles.select}
                >
                  {SESSION_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Track Conditions</label>
                <select
                  value={formData.conditions}
                  onChange={(e) => setFormData(prev => ({ ...prev, conditions: e.target.value }))}
                  className={styles.select}
                >
                  {CONDITIONS.map(cond => (
                    <option key={cond.value} value={cond.value}>{cond.label}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Tire Compound</label>
                <select
                  value={formData.tireCompound}
                  onChange={(e) => setFormData(prev => ({ ...prev, tireCompound: e.target.value }))}
                  className={styles.select}
                >
                  {TIRE_COMPOUNDS.map(tire => (
                    <option key={tire.value} value={tire.value}>{tire.label}</option>
                  ))}
                </select>
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Timing System</label>
                <select
                  value={formData.timingSystem}
                  onChange={(e) => setFormData(prev => ({ ...prev, timingSystem: e.target.value }))}
                  className={styles.select}
                >
                  {TIMING_SYSTEMS.map(sys => (
                    <option key={sys.value} value={sys.value}>{sys.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Conditions Section (Collapsible) */}
          <details className={styles.detailsSection}>
            <summary className={styles.detailsSummary}>
              <span className={styles.detailsIcon}><ThermometerIcon /></span>
              Weather Conditions (Optional)
            </summary>
            <div className={styles.conditionsGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <ThermometerIcon /> Ambient Temp
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
                  <CloudIcon /> Track Temp
                </label>
                <div className={styles.inputWithSuffix}>
                  <input
                    type="number"
                    value={formData.trackTempF}
                    onChange={(e) => setFormData(prev => ({ ...prev, trackTempF: e.target.value }))}
                    className={styles.input}
                    placeholder="85"
                  />
                  <span className={styles.suffix}>°F</span>
                </div>
              </div>
            </div>
          </details>

          {/* Notes Section */}
          <details className={styles.detailsSection}>
            <summary className={styles.detailsSummary}>
              <span className={styles.detailsIcon}><ClockIcon /></span>
              Session Notes (Optional)
            </summary>
            <div className={styles.notesSection}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className={styles.textarea}
                  placeholder="Car felt great today, brake fade on lap 5..."
                  rows={3}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Highlights</label>
                <input
                  type="text"
                  value={formData.highlights}
                  onChange={(e) => setFormData(prev => ({ ...prev, highlights: e.target.value }))}
                  className={styles.input}
                  placeholder="Personal best! First time under 2 minutes"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Areas to Improve</label>
                <input
                  type="text"
                  value={formData.areasToImprove}
                  onChange={(e) => setFormData(prev => ({ ...prev, areasToImprove: e.target.value }))}
                  className={styles.input}
                  placeholder="Late braking into T3, more aggression in T7"
                />
              </div>
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
            onClick={handleLapTimeSubmit}
          >
            {isSubmitting ? 'Saving...' : editingResult ? 'Update Time' : 'Log Time'}
          </button>
        </div>
      </div>
    </div>
  );

  // Use portal to render at document body level (above all other content including PWA nav)
  return createPortal(modalContent, document.body);
}
