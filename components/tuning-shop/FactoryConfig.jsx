'use client';

/**
 * Factory Configuration Component - Redesigned
 * 
 * Clean, editable interface for selecting factory-level configuration:
 * - Year / Trim
 * - Engine variant
 * - Transmission
 * - Drivetrain
 * 
 * @module components/tuning-shop/FactoryConfig
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import styles from './FactoryConfig.module.css';

/**
 * Log user configuration changes for analytics and gap detection
 * Helps identify where database has missing or incorrect data
 */
function logConfigChange(car, field, oldValue, newValue, carDefault) {
  // Skip if no actual change
  if (oldValue === newValue) return;
  
  const changeData = {
    timestamp: new Date().toISOString(),
    carSlug: car?.slug,
    carName: car ? `${car.year || ''} ${car.make} ${car.model}`.trim() : 'Unknown',
    field,
    oldValue,
    newValue,
    carDefault,
    isOverridingDefault: carDefault && newValue !== carDefault,
    isClearingOverride: newValue === null || newValue === '',
    // Flag if user is providing data we don't have
    isFillingGap: !carDefault && newValue,
  };
  
  // Log to console for development
  console.log('[FactoryConfig] User change detected:', changeData);
  
  // TODO: Send to analytics endpoint when ready
  // trackEvent('factory_config_change', changeData);
  
  // For now, store in sessionStorage for debugging
  try {
    const existingLogs = JSON.parse(sessionStorage.getItem('factoryConfigChanges') || '[]');
    existingLogs.push(changeData);
    // Keep last 50 changes
    if (existingLogs.length > 50) existingLogs.shift();
    sessionStorage.setItem('factoryConfigChanges', JSON.stringify(existingLogs));
  } catch (e) {
    // Ignore storage errors
  }
}

// Icons
const ChevronIcon = ({ isOpen }) => (
  <svg 
    width={16} 
    height={16} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
  >
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const GearIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const EditIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const CheckIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

/**
 * Factory Configuration Section
 */
export default function FactoryConfig({
  car,
  initialConfig,
  onChange,
  defaultExpanded = true,
  disabled = false,
  compact = false,
}) {
  const safeInitialConfig = initialConfig || {};
  
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isEditing, setIsEditing] = useState(false);
  
  // Configuration state - with car defaults
  const [config, setConfig] = useState({
    year: safeInitialConfig.year || null,
    trim: safeInitialConfig.trim || null,
    engine: safeInitialConfig.engine || null,
    transmission: safeInitialConfig.transmission || null,
    drivetrain: safeInitialConfig.drivetrain || null,
    hp: safeInitialConfig.hp || null,
    torque: safeInitialConfig.torque || null,
  });

  // Reset config when car changes
  useEffect(() => {
    const safe = initialConfig || {};
    setConfig({
      year: safe.year || null,
      trim: safe.trim || null,
      engine: safe.engine || null,
      transmission: safe.transmission || null,
      drivetrain: safe.drivetrain || null,
      hp: safe.hp || null,
      torque: safe.torque || null,
    });
    setIsEditing(false);
  }, [car?.slug, initialConfig]);

  // Get effective values (user override or car default)
  const effectiveConfig = useMemo(() => ({
    year: config.year || car?.years || car?.year || 'TBD',
    trim: config.trim || car?.trim || 'Base',
    engine: config.engine || car?.engine || 'TBD',
    transmission: config.transmission || car?.trans || 'TBD',
    drivetrain: config.drivetrain || car?.drivetrain || 'TBD',
    hp: config.hp || car?.hp || 'TBD',
    torque: config.torque || car?.torque || 'TBD',
  }), [config, car]);

  // Check if any config has changed from car default
  const hasChanges = useMemo(() => {
    return !!(config.year || config.trim || config.engine || 
              config.transmission || config.drivetrain || 
              config.hp || config.torque);
  }, [config]);

  // Handle configuration changes with logging
  const handleConfigChange = useCallback((key, value) => {
    setConfig(prev => {
      const oldValue = prev[key];
      const carDefault = car?.[key === 'transmission' ? 'trans' : key];
      
      // Log the change for analytics
      logConfigChange(car, key, oldValue, value || null, carDefault);
      
      const newConfig = { ...prev, [key]: value || null };
      onChange?.(newConfig);
      return newConfig;
    });
  }, [onChange, car]);

  // Reset to defaults
  const handleReset = useCallback(() => {
    const resetConfig = {
      year: null,
      trim: null,
      engine: null,
      transmission: null,
      drivetrain: null,
      hp: null,
      torque: null,
    };
    setConfig(resetConfig);
    onChange?.(resetConfig);
    setIsEditing(false);
  }, [onChange]);

  if (!car) return null;

  // Available options (could come from database in future)
  const transmissionOptions = getTransmissionOptions(car?.trans);
  const drivetrainOptions = getDrivetrainOptions(car?.drivetrain);

  return (
    <div className={`${styles.container} ${hasChanges ? styles.hasChanges : ''} ${compact ? styles.compact : ''}`}>
      {/* Header */}
      <div className={styles.header}>
        <button 
          className={styles.headerToggle}
          onClick={() => setIsExpanded(!isExpanded)}
          disabled={disabled}
          aria-expanded={isExpanded}
        >
          <div className={styles.headerLeft}>
            <GearIcon />
            <span className={styles.headerTitle}>Factory Configuration</span>
            {hasChanges && <span className={styles.modifiedBadge}>Modified</span>}
          </div>
        </button>
        <div className={styles.headerRight}>
          {isExpanded && (
            <button
              className={`${styles.headerEditBtn} ${isEditing ? styles.headerEditBtnActive : ''}`}
              onClick={(e) => { e.stopPropagation(); setIsEditing(!isEditing); }}
            >
              {isEditing ? <CheckIcon /> : <EditIcon />}
              <span className={styles.headerEditLabel}>{isEditing ? 'Done' : 'Edit'}</span>
            </button>
          )}
          <button 
            className={styles.chevronBtn}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <ChevronIcon isOpen={isExpanded} />
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className={styles.content}>
          {/* Reset Button - only when editing and has changes */}
          {isEditing && hasChanges && (
            <div className={styles.editToggle}>
              <button className={styles.resetBtn} onClick={handleReset}>
                Reset to Stock
              </button>
            </div>
          )}

          {/* Configuration Grid */}
          <div className={styles.configGrid}>
            {/* Year */}
            <ConfigField
              label="Model Year"
              value={effectiveConfig.year}
              isEditing={isEditing}
              onChange={(val) => handleConfigChange('year', val)}
              placeholder={car?.years || car?.year || 'e.g., 2024'}
              disabled={disabled}
            />

            {/* Trim */}
            <ConfigField
              label="Trim Level"
              value={effectiveConfig.trim}
              isEditing={isEditing}
              onChange={(val) => handleConfigChange('trim', val)}
              placeholder="e.g., Premium, NISMO"
              disabled={disabled}
            />

            {/* Engine */}
            <ConfigField
              label="Engine"
              value={effectiveConfig.engine}
              isEditing={isEditing}
              onChange={(val) => handleConfigChange('engine', val)}
              placeholder={car?.engine || 'e.g., 3.8L Twin Turbo V6'}
              disabled={disabled}
            />

            {/* Transmission */}
            <ConfigField
              label="Transmission"
              value={effectiveConfig.transmission}
              isEditing={isEditing}
              onChange={(val) => handleConfigChange('transmission', val)}
              options={transmissionOptions}
              placeholder={car?.trans || 'Select...'}
              disabled={disabled}
            />

            {/* Drivetrain */}
            <ConfigField
              label="Drivetrain"
              value={effectiveConfig.drivetrain}
              isEditing={isEditing}
              onChange={(val) => handleConfigChange('drivetrain', val)}
              options={drivetrainOptions}
              placeholder={car?.drivetrain || 'Select...'}
              disabled={disabled}
            />

            {/* Power */}
            <ConfigField
              label="Horsepower"
              value={effectiveConfig.hp}
              isEditing={isEditing}
              onChange={(val) => handleConfigChange('hp', val)}
              placeholder={car?.hp ? `${car.hp}` : 'e.g., 565'}
              suffix="hp"
              type="number"
              disabled={disabled}
            />
          </div>

          {/* Info Note */}
          <div className={styles.infoNote}>
            <span>
              {isEditing 
                ? "Update your specific factory specs. This helps us provide more accurate upgrade recommendations."
                : "These are your vehicle's factory specifications. Click 'Edit Config' to customize."
              }
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Individual Config Field Component
 */
function ConfigField({ 
  label, 
  value, 
  isEditing, 
  onChange, 
  options = null, 
  placeholder = '', 
  suffix = '',
  type = 'text',
  disabled = false 
}) {
  const displayValue = value === 'TBD' || !value ? placeholder : value;
  const isTBD = value === 'TBD' || !value;

  if (!isEditing) {
    return (
      <div className={styles.configField}>
        <span className={styles.fieldLabel}>{label}</span>
        <span className={`${styles.fieldValue} ${isTBD ? styles.fieldValueTBD : ''}`}>
          {displayValue}{suffix && !isTBD && ` ${suffix}`}
        </span>
      </div>
    );
  }

  // Editing mode
  if (options && options.length > 0) {
    return (
      <div className={styles.configField}>
        <label className={styles.fieldLabel}>{label}</label>
        <select
          className={styles.fieldSelect}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        >
          <option value="">{placeholder}</option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className={styles.configField}>
      <label className={styles.fieldLabel}>{label}</label>
      <div className={styles.fieldInputWrapper}>
        <input
          type={type}
          className={styles.fieldInput}
          value={value === 'TBD' ? '' : (value || '')}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
        />
        {suffix && <span className={styles.fieldSuffix}>{suffix}</span>}
      </div>
    </div>
  );
}

/**
 * Get transmission options from car data
 */
function getTransmissionOptions(transStr) {
  if (!transStr) return [];
  
  const options = [];
  const normalized = transStr.toLowerCase();
  
  // Common transmission types
  if (normalized.includes('mt') || normalized.includes('manual')) {
    const match = transStr.match(/(\d+)/);
    options.push({ value: 'manual', label: match ? `${match[1]}-Speed Manual` : 'Manual' });
  }
  if (normalized.includes('dct')) {
    const match = transStr.match(/(\d+)/);
    options.push({ value: 'dct', label: match ? `${match[1]}-Speed DCT` : 'DCT' });
  }
  if (normalized.includes('pdk')) {
    const match = transStr.match(/(\d+)/);
    options.push({ value: 'pdk', label: match ? `${match[1]}-Speed PDK` : 'PDK' });
  }
  if (normalized.includes('auto') || normalized.includes('at')) {
    const match = transStr.match(/(\d+)/);
    options.push({ value: 'auto', label: match ? `${match[1]}-Speed Auto` : 'Automatic' });
  }
  if (normalized.includes('cvt')) {
    options.push({ value: 'cvt', label: 'CVT' });
  }
  
  // If no specific matches, add the raw value
  if (options.length === 0 && transStr) {
    options.push({ value: transStr, label: transStr });
  }
  
  return options;
}

/**
 * Get drivetrain options
 */
function getDrivetrainOptions(drivetrainStr) {
  // Common drivetrains
  const allOptions = [
    { value: 'RWD', label: 'RWD (Rear-Wheel Drive)' },
    { value: 'FWD', label: 'FWD (Front-Wheel Drive)' },
    { value: 'AWD', label: 'AWD (All-Wheel Drive)' },
    { value: '4WD', label: '4WD (Four-Wheel Drive)' },
  ];
  
  // If car has a specific drivetrain, put it first
  if (drivetrainStr) {
    const normalized = drivetrainStr.toUpperCase();
    const matchingOption = allOptions.find(opt => opt.value === normalized);
    if (matchingOption) {
      return [matchingOption, ...allOptions.filter(opt => opt.value !== normalized)];
    }
  }
  
  return allOptions;
}

/**
 * Hook to get factory config from owned vehicle custom specs
 */
export function getFactoryConfigFromVehicle(vehicle) {
  if (!vehicle?.customSpecs) {
    return {
      year: vehicle?.year || null,
      trim: vehicle?.trim || null,
      engine: null,
      transmission: null,
      drivetrain: null,
      hp: null,
      torque: null,
    };
  }

  const specs = vehicle.customSpecs;
  return {
    year: specs.year || vehicle?.year || null,
    trim: specs.trim || vehicle?.trim || null,
    engine: specs.engine || null,
    transmission: specs.transmission || null,
    drivetrain: specs.drivetrain || null,
    hp: specs.hp || null,
    torque: specs.torque || null,
  };
}

/**
 * Convert factory config to custom specs format for saving
 */
export function factoryConfigToCustomSpecs(config) {
  return {
    year: config.year,
    trim: config.trim,
    engine: config.engine,
    transmission: config.transmission,
    drivetrain: config.drivetrain,
    hp: config.hp,
    torque: config.torque,
  };
}
