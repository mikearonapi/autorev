'use client';

/**
 * Factory Configuration Component
 * 
 * Collapsible section for selecting factory-level options:
 * - Transmission (manual/auto/DCT)
 * - OEM wheel package
 * - Drivetrain variant
 * 
 * Selections persist to user's garage vehicle profile when saved.
 * 
 * @module components/tuning-shop/FactoryConfig
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import styles from './FactoryConfig.module.css';

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

const WheelIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="3"/>
    <line x1="12" y1="2" x2="12" y2="6"/>
    <line x1="12" y1="18" x2="12" y2="22"/>
    <line x1="2" y1="12" x2="6" y2="12"/>
    <line x1="18" y1="12" x2="22" y2="12"/>
  </svg>
);

const TransmissionIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <line x1="7" y1="8" x2="7" y2="16"/>
    <line x1="12" y1="8" x2="12" y2="16"/>
    <line x1="17" y1="8" x2="17" y2="16"/>
    <line x1="7" y1="12" x2="17" y2="12"/>
  </svg>
);

const DrivetrainIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5" cy="12" r="3"/>
    <circle cx="19" cy="12" r="3"/>
    <line x1="8" y1="12" x2="16" y2="12"/>
  </svg>
);

/**
 * @typedef {Object} FactoryConfigProps
 * @property {Object} car - Selected car object
 * @property {Object} [initialConfig] - Initial configuration (from owned vehicle)
 * @property {function} onChange - Callback when configuration changes
 * @property {boolean} [defaultExpanded] - Whether to start expanded
 * @property {boolean} [disabled] - Disable all inputs
 */

/**
 * @typedef {Object} FactoryConfiguration
 * @property {string|null} transmission - Selected transmission
 * @property {string|null} wheelPackageId - Selected wheel package ID
 * @property {string|null} drivetrain - Selected drivetrain
 * @property {string|null} trim - Selected trim level
 * @property {string|null} variantId - Selected variant ID (for exact spec matching)
 */

/**
 * Factory Configuration Section
 * @param {FactoryConfigProps} props
 */
export default function FactoryConfig({
  car,
  initialConfig = {},
  onChange,
  defaultExpanded = false,
  disabled = false,
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [factoryOptions, setFactoryOptions] = useState(null);
  
  // Current selections
  const [config, setConfig] = useState({
    transmission: initialConfig.transmission || null,
    wheelPackageId: initialConfig.wheelPackageId || null,
    drivetrain: initialConfig.drivetrain || null,
    trim: initialConfig.trim || null,
    variantId: initialConfig.variantId || null,
  });

  // Fetch factory options when car changes
  useEffect(() => {
    if (!car?.slug) {
      setFactoryOptions(null);
      return;
    }

    let cancelled = false;
    
    const fetchOptions = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/cars/${car.slug}/factory-options`);
        const result = await response.json();
        
        if (!cancelled) {
          if (result.success) {
            setFactoryOptions(result.data);
          } else {
            setError(result.error || 'Failed to load options');
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load factory options');
          console.error('[FactoryConfig] Error:', err);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchOptions();
    
    return () => {
      cancelled = true;
    };
  }, [car?.slug]);

  // Reset config when car changes
  useEffect(() => {
    setConfig({
      transmission: initialConfig.transmission || null,
      wheelPackageId: initialConfig.wheelPackageId || null,
      drivetrain: initialConfig.drivetrain || null,
      trim: initialConfig.trim || null,
      variantId: initialConfig.variantId || null,
    });
  }, [car?.slug, initialConfig]);

  // Handle configuration changes
  const handleConfigChange = useCallback((key, value) => {
    setConfig(prev => {
      const newConfig = { ...prev, [key]: value };
      // Notify parent of change
      onChange?.(newConfig);
      return newConfig;
    });
  }, [onChange]);

  // Check if any config has changed from default/stock
  const hasChanges = useMemo(() => {
    return !!(config.transmission || config.wheelPackageId || config.drivetrain || config.trim);
  }, [config]);

  // Summary text for collapsed state
  const summaryText = useMemo(() => {
    if (!hasChanges) return 'Stock Configuration';
    
    const parts = [];
    if (config.transmission) parts.push(config.transmission);
    if (config.drivetrain) parts.push(config.drivetrain);
    if (config.wheelPackageId && factoryOptions?.wheelPackages) {
      const wp = factoryOptions.wheelPackages.find(p => p.id === config.wheelPackageId);
      if (wp) parts.push(wp.label);
    }
    
    return parts.length > 0 ? parts.join(' • ') : 'Stock Configuration';
  }, [hasChanges, config, factoryOptions]);

  // Don't render if no car selected
  if (!car) return null;

  // Check if there are any options to show
  const hasOptions = factoryOptions && (
    factoryOptions.transmissions?.length > 1 ||
    factoryOptions.wheelPackages?.length > 1 ||
    factoryOptions.drivetrains?.length > 1 ||
    factoryOptions.trims?.length > 1
  );

  return (
    <div className={`${styles.container} ${hasChanges ? styles.hasChanges : ''}`}>
      {/* Collapsible Header */}
      <button 
        className={styles.header}
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={disabled}
        aria-expanded={isExpanded}
      >
        <div className={styles.headerLeft}>
          <GearIcon />
          <span className={styles.headerTitle}>Factory Configuration</span>
          {hasChanges && <span className={styles.modifiedBadge}>Modified</span>}
        </div>
        <div className={styles.headerRight}>
          {!isExpanded && (
            <span className={styles.summaryText}>{summaryText}</span>
          )}
          <ChevronIcon isOpen={isExpanded} />
        </div>
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className={styles.content}>
          {isLoading ? (
            <div className={styles.loading}>
              <div className={styles.spinner} />
              <span>Loading options...</span>
            </div>
          ) : error ? (
            <div className={styles.error}>
              <span>{error}</span>
            </div>
          ) : !hasOptions ? (
            <div className={styles.noOptions}>
              <span>No factory variants available for this model</span>
            </div>
          ) : (
            <div className={styles.optionsGrid}>
              {/* Transmission Selector */}
              {factoryOptions.transmissions?.length > 1 && (
                <div className={styles.optionGroup}>
                  <label className={styles.optionLabel}>
                    <TransmissionIcon />
                    Transmission
                  </label>
                  <div className={styles.optionButtons}>
                    <button
                      className={`${styles.optionBtn} ${!config.transmission ? styles.optionBtnActive : ''}`}
                      onClick={() => handleConfigChange('transmission', null)}
                      disabled={disabled}
                    >
                      Stock
                    </button>
                    {factoryOptions.transmissions.map(t => (
                      <button
                        key={t.value}
                        className={`${styles.optionBtn} ${config.transmission === t.value ? styles.optionBtnActive : ''}`}
                        onClick={() => handleConfigChange('transmission', t.value)}
                        disabled={disabled}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Drivetrain Selector */}
              {factoryOptions.drivetrains?.length > 1 && (
                <div className={styles.optionGroup}>
                  <label className={styles.optionLabel}>
                    <DrivetrainIcon />
                    Drivetrain
                  </label>
                  <div className={styles.optionButtons}>
                    <button
                      className={`${styles.optionBtn} ${!config.drivetrain ? styles.optionBtnActive : ''}`}
                      onClick={() => handleConfigChange('drivetrain', null)}
                      disabled={disabled}
                    >
                      Stock
                    </button>
                    {factoryOptions.drivetrains.map(d => (
                      <button
                        key={d.value}
                        className={`${styles.optionBtn} ${config.drivetrain === d.value ? styles.optionBtnActive : ''}`}
                        onClick={() => handleConfigChange('drivetrain', d.value)}
                        disabled={disabled}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Wheel Package Selector */}
              {factoryOptions.wheelPackages?.length > 0 && (
                <div className={styles.optionGroup}>
                  <label className={styles.optionLabel}>
                    <WheelIcon />
                    OEM Wheel Package
                  </label>
                  <div className={styles.wheelPackages}>
                    {factoryOptions.wheelPackages.map(wp => (
                      <button
                        key={wp.id}
                        className={`${styles.wheelPackageBtn} ${config.wheelPackageId === wp.id ? styles.wheelPackageBtnActive : ''}`}
                        onClick={() => handleConfigChange('wheelPackageId', 
                          config.wheelPackageId === wp.id ? null : wp.id
                        )}
                        disabled={disabled}
                      >
                        <div className={styles.wheelPackageHeader}>
                          <span className={styles.wheelPackageName}>{wp.label}</span>
                          {wp.type === 'oem' && (
                            <span className={styles.stockBadge}>Stock</span>
                          )}
                        </div>
                        <div className={styles.wheelPackageSpecs}>
                          <span>{wp.tireSizeFront}</span>
                          {wp.tireSizeFront !== wp.tireSizeRear && (
                            <span>/ {wp.tireSizeRear}</span>
                          )}
                        </div>
                        {wp.recommendedFor?.length > 0 && (
                          <div className={styles.wheelPackageTags}>
                            {wp.recommendedFor.slice(0, 2).map(tag => (
                              <span key={tag} className={styles.tag}>{tag}</span>
                            ))}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Trim Selector (if multiple trims) */}
              {factoryOptions.trims?.length > 1 && (
                <div className={styles.optionGroup}>
                  <label className={styles.optionLabel}>
                    Trim Level
                  </label>
                  <select
                    className={styles.selectInput}
                    value={config.trim || ''}
                    onChange={(e) => handleConfigChange('trim', e.target.value || null)}
                    disabled={disabled}
                  >
                    <option value="">Stock / Base</option>
                    {factoryOptions.trims.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Reset Button */}
          {hasChanges && !disabled && (
            <div className={styles.actions}>
              <button
                className={styles.resetBtn}
                onClick={() => {
                  const resetConfig = {
                    transmission: null,
                    wheelPackageId: null,
                    drivetrain: null,
                    trim: null,
                    variantId: null,
                  };
                  setConfig(resetConfig);
                  onChange?.(resetConfig);
                }}
              >
                Reset to Stock
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Hook to get factory config from owned vehicle custom specs
 * @param {Object} vehicle - Owned vehicle object
 * @returns {FactoryConfiguration}
 */
export function getFactoryConfigFromVehicle(vehicle) {
  if (!vehicle?.customSpecs) {
    return {
      transmission: null,
      wheelPackageId: null,
      drivetrain: null,
      trim: vehicle?.trim || null,
      variantId: vehicle?.matchedCarVariantId || null,
    };
  }

  const specs = vehicle.customSpecs;
  return {
    transmission: specs.transmission || null,
    wheelPackageId: specs.wheelPackageId || null,
    drivetrain: specs.drivetrain || null,
    trim: specs.trim || vehicle?.trim || null,
    variantId: specs.variantId || vehicle?.matchedCarVariantId || null,
  };
}

/**
 * Convert factory config to custom specs format for saving
 * @param {FactoryConfiguration} config
 * @returns {Object} Custom specs object for OwnedVehiclesProvider
 */
export function factoryConfigToCustomSpecs(config) {
  return {
    transmission: config.transmission,
    wheelPackageId: config.wheelPackageId,
    drivetrain: config.drivetrain,
    trim: config.trim,
    variantId: config.variantId,
  };
}

