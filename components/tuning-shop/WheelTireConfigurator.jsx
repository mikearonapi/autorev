'use client';

/**
 * Wheel & Tire Configurator - Redesigned
 * 
 * Clean, intuitive interface for wheel and tire selection
 * with performance impact visualization.
 * 
 * @module components/tuning-shop/WheelTireConfigurator
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchCarFitments, formatWheelSpecs, formatTireSpecs } from '@/lib/fitmentService';
import styles from './WheelTireConfigurator.module.css';

/**
 * Log wheel/tire configuration changes for analytics and gap detection
 * Helps identify where database has missing or incorrect fitment data
 */
function logWheelTireChange(car, field, oldValue, newValue, oemValue) {
  // Skip if no actual change
  if (oldValue === newValue) return;
  
  const changeData = {
    timestamp: new Date().toISOString(),
    carSlug: car?.slug,
    carName: car ? `${car.year || ''} ${car.make} ${car.model}`.trim() : 'Unknown',
    field,
    oldValue,
    newValue,
    oemValue,
    isOverridingOEM: oemValue && newValue !== oemValue,
    // Flag if user is providing data we don't have
    isFillingGap: !oemValue && newValue,
    // Special flag for compound changes (always important for performance)
    affectsPerformance: field === 'compound',
  };
  
  // Log to console for development
  console.log('[WheelTireConfig] User change detected:', changeData);
  
  // TODO: Send to analytics endpoint when ready
  // trackEvent('wheel_tire_config_change', changeData);
  
  // Store in sessionStorage for debugging
  try {
    const existingLogs = JSON.parse(sessionStorage.getItem('wheelTireChanges') || '[]');
    existingLogs.push(changeData);
    // Keep last 50 changes
    if (existingLogs.length > 50) existingLogs.shift();
    sessionStorage.setItem('wheelTireChanges', JSON.stringify(existingLogs));
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

const WheelIcon = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="3"/>
    <line x1="12" y1="2" x2="12" y2="6"/>
    <line x1="12" y1="18" x2="12" y2="22"/>
    <line x1="2" y1="12" x2="6" y2="12"/>
    <line x1="18" y1="12" x2="22" y2="12"/>
  </svg>
);

const CheckIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const EditIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

// Tire compound options with performance impact
const TIRE_COMPOUNDS = [
  { 
    id: 'all-season', 
    label: 'All-Season', 
    desc: 'Year-round versatility',
    grip: 0,
    wear: '+',
    icon: '🌤️'
  },
  { 
    id: 'summer', 
    label: 'Summer Performance', 
    desc: 'Better dry & wet grip',
    grip: 0.05,
    wear: '',
    icon: '☀️'
  },
  { 
    id: 'max-performance', 
    label: 'Max Performance Summer', 
    desc: 'Track-ready street tire',
    grip: 0.10,
    wear: '-',
    icon: '🔥'
  },
  { 
    id: 'track', 
    label: '200TW Track Tire', 
    desc: 'Competition compound',
    grip: 0.20,
    wear: '--',
    icon: '🏁'
  },
];

// Lightweight wheels upgrade info
const LIGHTWEIGHT_WHEELS = {
  key: 'wheels-lightweight',
  name: 'Lightweight Wheels',
  description: 'Forged/flow-formed wheels reduce unsprung mass',
  cost: '$2,000 - $4,000',
};

/**
 * Wheel & Tire Configurator
 */
export default function WheelTireConfigurator({
  car,
  selectedFitment,
  onSelect,
  defaultExpanded = true,
  disabled = false,
  compact = false,
  // Upgrade integration
  selectedUpgrades = [],
  onUpgradeToggle,
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fitmentData, setFitmentData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Configuration state
  // Default to 'all-season' as the baseline stock compound
  const [wheelConfig, setWheelConfig] = useState({
    // Wheel specs
    diameterFront: '',
    diameterRear: '',
    widthFront: '',
    widthRear: '',
    // Tire specs
    tireSizeFront: '',
    tireSizeRear: '',
    // Tire compound - all-season is stock baseline (0 grip bonus)
    compound: 'all-season',
    // Setup type
    isStaggered: false,
  });

  // Fetch OEM fitment data when car changes
  useEffect(() => {
    if (!car?.slug) {
      setFitmentData(null);
      return;
    }

    let cancelled = false;
    
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await fetchCarFitments(car.slug);
      
      if (!cancelled) {
        if (fetchError) {
          setError(fetchError.message || 'Failed to load fitment data');
        } else {
          setFitmentData(data);
          
          // Initialize with OEM specs if available
          if (data?.oem) {
            initializeFromOEM(data.oem);
          }
        }
        setIsLoading(false);
      }
    };

    loadData();
    
    return () => { cancelled = true; };
  }, [car?.slug]);

  // Initialize wheel config from OEM data
  const initializeFromOEM = useCallback((oem) => {
    if (!oem) return;
    
    // Parse wheel specs like "20×9.5" and "20×10.5"
    const parseFront = parseWheelSize(oem.wheelSizeFront);
    const parseRear = parseWheelSize(oem.wheelSizeRear || oem.wheelSizeFront);
    
    setWheelConfig({
      diameterFront: parseFront.diameter || '',
      diameterRear: parseRear.diameter || '',
      widthFront: parseFront.width || '',
      widthRear: parseRear.width || '',
      tireSizeFront: oem.tireSizeFront || '',
      tireSizeRear: oem.tireSizeRear || oem.tireSizeFront || '',
      compound: 'summer',
      isStaggered: oem.wheelSizeFront !== oem.wheelSizeRear,
    });
  }, []);

  // Initialize from selected fitment
  useEffect(() => {
    if (selectedFitment && !selectedFitment.isCustom) {
      initializeFromOEM(selectedFitment);
    }
  }, [selectedFitment, initializeFromOEM]);

  // Handle config changes with logging
  const handleConfigChange = useCallback((field, value) => {
    setWheelConfig(prev => {
      const oldValue = prev[field];
      
      // Get OEM value if available for comparison
      const oemValue = fitmentData?.oem ? (
        field === 'compound' ? 'all-season' :
        field === 'diameterFront' ? parseWheelSize(fitmentData.oem.wheelSizeFront).diameter :
        field === 'diameterRear' ? parseWheelSize(fitmentData.oem.wheelSizeRear || fitmentData.oem.wheelSizeFront).diameter :
        field === 'widthFront' ? parseWheelSize(fitmentData.oem.wheelSizeFront).width :
        field === 'widthRear' ? parseWheelSize(fitmentData.oem.wheelSizeRear || fitmentData.oem.wheelSizeFront).width :
        field === 'tireSizeFront' ? fitmentData.oem.tireSizeFront :
        field === 'tireSizeRear' ? fitmentData.oem.tireSizeRear || fitmentData.oem.tireSizeFront :
        null
      ) : null;
      
      // Log the change for analytics
      logWheelTireChange(car, field, oldValue, value, oemValue);
      
      const updated = { ...prev, [field]: value };
      
      // Auto-sync rear to front if not staggered
      if (!prev.isStaggered) {
        if (field === 'diameterFront') updated.diameterRear = value;
        if (field === 'widthFront') updated.widthRear = value;
        if (field === 'tireSizeFront') updated.tireSizeRear = value;
      }
      
      return updated;
    });
  }, [car, fitmentData]);

  // Apply configuration and notify parent
  const applyConfig = useCallback(() => {
    const compound = TIRE_COMPOUNDS.find(c => c.id === wheelConfig.compound);
    
    const fitment = {
      id: 'custom',
      fitmentType: 'custom',
      displayName: 'Current Setup',
      wheelSizeFront: `${wheelConfig.diameterFront}×${wheelConfig.widthFront}`,
      wheelSizeRear: `${wheelConfig.diameterRear}×${wheelConfig.widthRear}`,
      tireSizeFront: wheelConfig.tireSizeFront,
      tireSizeRear: wheelConfig.tireSizeRear,
      tireCompound: wheelConfig.compound,
      isCustom: true,
      // Performance impact from compound
      gripBonus: compound?.grip || 0,
      recommendedFor: compound?.id === 'track' ? ['track', 'competition'] : 
                       compound?.id === 'max-performance' ? ['spirited', 'track'] :
                       compound?.id === 'summer' ? ['street', 'spirited'] :
                       ['daily', 'street'],
    };
    
    onSelect?.(fitment);
    setIsEditing(false);
  }, [wheelConfig, onSelect]);

  // Reset to OEM
  const resetToOEM = useCallback(() => {
    if (fitmentData?.oem) {
      initializeFromOEM(fitmentData.oem);
      onSelect?.(fitmentData.oem);
    }
    setIsEditing(false);
  }, [fitmentData, initializeFromOEM, onSelect]);

  // Calculate performance impact
  const performanceImpact = useMemo(() => {
    const compound = TIRE_COMPOUNDS.find(c => c.id === wheelConfig.compound);
    return {
      gripGain: compound?.grip || 0,
      label: compound?.grip > 0.15 ? 'Significant' : 
             compound?.grip > 0.05 ? 'Moderate' : 
             compound?.grip > 0 ? 'Slight' : 'Baseline',
    };
  }, [wheelConfig.compound]);

  // Auto-apply compound changes immediately (affects performance metrics)
  useEffect(() => {
    const compound = TIRE_COMPOUNDS.find(c => c.id === wheelConfig.compound);
    
    // Only auto-apply if we have valid fitment data
    if (wheelConfig.diameterFront || fitmentData?.oem) {
      const fitment = {
        id: 'current',
        fitmentType: 'current',
        displayName: 'Current Setup',
        wheelSizeFront: wheelConfig.diameterFront 
          ? `${wheelConfig.diameterFront}×${wheelConfig.widthFront}`
          : fitmentData?.oem?.wheelSizeFront || '',
        wheelSizeRear: wheelConfig.diameterRear 
          ? `${wheelConfig.diameterRear}×${wheelConfig.widthRear}`
          : fitmentData?.oem?.wheelSizeRear || '',
        tireSizeFront: wheelConfig.tireSizeFront || fitmentData?.oem?.tireSizeFront || '',
        tireSizeRear: wheelConfig.tireSizeRear || fitmentData?.oem?.tireSizeRear || '',
        tireCompound: wheelConfig.compound,
        // Performance impact from compound - this is what affects metrics
        gripBonus: compound?.grip || 0,
        recommendedFor: compound?.id === 'track' ? ['track', 'competition'] : 
                        compound?.id === 'max-performance' ? ['spirited', 'track'] :
                        compound?.id === 'summer' ? ['street', 'spirited'] :
                        ['daily', 'street'],
      };
      
      onSelect?.(fitment);
    }
  }, [wheelConfig.compound, wheelConfig.diameterFront, wheelConfig.widthFront, 
      wheelConfig.diameterRear, wheelConfig.widthRear, wheelConfig.tireSizeFront,
      wheelConfig.tireSizeRear, fitmentData?.oem, onSelect]);

  if (!car) return null;

  return (
    <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
      {/* Header */}
      <div className={styles.header}>
        <button 
          className={styles.headerToggle}
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
        >
          <div className={styles.headerLeft}>
            <WheelIcon />
            <span className={styles.headerTitle}>Wheels & Tires</span>
            {performanceImpact.gripGain > 0 && (
              <span className={styles.performanceBadge}>
                +{(performanceImpact.gripGain * 100).toFixed(0)}% grip
              </span>
            )}
            <span className={styles.headerHint}>Affects handling, grip & performance</span>
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
          {isLoading ? (
            <div className={styles.loading}>
              <div className={styles.spinner} />
              <span>Loading fitment data...</span>
            </div>
          ) : error ? (
            <div className={styles.errorState}>
              <span>{error}</span>
            </div>
          ) : (
            <>
              {/* Reset Button - only when editing and OEM data available */}
              {isEditing && fitmentData?.oem && (
                <div className={styles.editToggle}>
                  <button className={styles.resetBtn} onClick={resetToOEM}>
                    Reset to OEM
                  </button>
                </div>
              )}

              {/* Wheel & Tire Specs Section */}
              <div className={styles.specsSection}>
                {/* Staggered Toggle */}
                <div className={styles.staggeredToggle}>
                  <span className={styles.toggleLabel}>Setup Type:</span>
                  <div className={styles.toggleButtons}>
                    <button
                      className={`${styles.toggleBtn} ${!wheelConfig.isStaggered ? styles.toggleBtnActive : ''}`}
                      onClick={() => handleConfigChange('isStaggered', false)}
                      disabled={!isEditing}
                    >
                      Square
                    </button>
                    <button
                      className={`${styles.toggleBtn} ${wheelConfig.isStaggered ? styles.toggleBtnActive : ''}`}
                      onClick={() => handleConfigChange('isStaggered', true)}
                      disabled={!isEditing}
                    >
                      Staggered
                    </button>
                  </div>
                </div>

                {/* Wheel Specs Grid */}
                <div className={styles.specsGrid}>
                  {/* Front Wheels */}
                  <div className={styles.specGroup}>
                    <h4 className={styles.specGroupTitle}>
                      {wheelConfig.isStaggered ? 'Front' : 'All Corners'}
                    </h4>
                    <div className={styles.specRow}>
                      <SpecField
                        label="Diameter"
                        value={wheelConfig.diameterFront}
                        onChange={(v) => handleConfigChange('diameterFront', v)}
                        suffix='"'
                        placeholder="20"
                        isEditing={isEditing}
                        disabled={disabled}
                      />
                      <SpecField
                        label="Width"
                        value={wheelConfig.widthFront}
                        onChange={(v) => handleConfigChange('widthFront', v)}
                        suffix='"'
                        placeholder="9.5"
                        isEditing={isEditing}
                        disabled={disabled}
                      />
                    </div>
                    <div className={styles.tireSpecRow}>
                      <SpecField
                        label="Tire Size"
                        value={wheelConfig.tireSizeFront}
                        onChange={(v) => handleConfigChange('tireSizeFront', v)}
                        placeholder="255/40ZR20"
                        isEditing={isEditing}
                        disabled={disabled}
                        fullWidth
                      />
                    </div>
                  </div>

                  {/* Rear Wheels (if staggered) */}
                  {wheelConfig.isStaggered && (
                    <div className={styles.specGroup}>
                      <h4 className={styles.specGroupTitle}>Rear</h4>
                      <div className={styles.specRow}>
                        <SpecField
                          label="Diameter"
                          value={wheelConfig.diameterRear}
                          onChange={(v) => handleConfigChange('diameterRear', v)}
                          suffix='"'
                          placeholder="20"
                          isEditing={isEditing}
                          disabled={disabled}
                        />
                        <SpecField
                          label="Width"
                          value={wheelConfig.widthRear}
                          onChange={(v) => handleConfigChange('widthRear', v)}
                          suffix='"'
                          placeholder="10.5"
                          isEditing={isEditing}
                          disabled={disabled}
                        />
                      </div>
                      <div className={styles.tireSpecRow}>
                        <SpecField
                          label="Tire Size"
                          value={wheelConfig.tireSizeRear}
                          onChange={(v) => handleConfigChange('tireSizeRear', v)}
                          placeholder="285/35ZR20"
                          isEditing={isEditing}
                          disabled={disabled}
                          fullWidth
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tire Compound Selection */}
              <div className={styles.compoundSection}>
                <h4 className={styles.sectionTitle}>
                  Tire Compound
                  <span className={styles.performanceTag}>
                    Affects Grip
                  </span>
                </h4>
                {/* Icon Row - always interactive for compound selection */}
                <div className={styles.compoundIconRow}>
                  {TIRE_COMPOUNDS.map(compound => (
                    <button
                      key={compound.id}
                      className={`${styles.compoundIconBtn} ${wheelConfig.compound === compound.id ? styles.compoundIconBtnActive : ''}`}
                      onClick={() => handleConfigChange('compound', compound.id)}
                      disabled={disabled}
                      title={`${compound.label}${compound.grip > 0 ? ` (+${(compound.grip * 100).toFixed(0)}% grip)` : ' (stock)'}`}
                    >
                      <span className={styles.compoundIconEmoji}>{compound.icon}</span>
                    </button>
                  ))}
                </div>
                {/* Selected Compound Info */}
                {(() => {
                  const selected = TIRE_COMPOUNDS.find(c => c.id === wheelConfig.compound);
                  return selected && (
                    <div className={styles.compoundInfo}>
                      <span className={styles.compoundInfoLabel}>{selected.label}</span>
                      <span className={styles.compoundInfoDesc}>{selected.desc}</span>
                      {selected.grip > 0 ? (
                        <span className={styles.compoundInfoGrip}>
                          +{(selected.grip * 100).toFixed(0)}% grip
                        </span>
                      ) : (
                        <span className={styles.compoundInfoStock}>Stock</span>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Lightweight Wheels Upgrade */}
              {onUpgradeToggle && (
                <div className={styles.upgradeSection}>
                  <h4 className={styles.upgradeSectionTitle}>Wheel Upgrade</h4>
                  <button
                    className={`${styles.upgradeToggle} ${selectedUpgrades.includes(LIGHTWEIGHT_WHEELS.key) ? styles.upgradeToggleActive : ''}`}
                    onClick={() => onUpgradeToggle(LIGHTWEIGHT_WHEELS.key)}
                    disabled={disabled}
                  >
                    <div className={`${styles.upgradeCheckbox} ${selectedUpgrades.includes(LIGHTWEIGHT_WHEELS.key) ? styles.upgradeCheckboxActive : ''}`}>
                      <CheckIcon />
                    </div>
                    <div className={styles.upgradeInfo}>
                      <div className={styles.upgradeName}>{LIGHTWEIGHT_WHEELS.name}</div>
                      <div className={styles.upgradeDesc}>{LIGHTWEIGHT_WHEELS.description}</div>
                    </div>
                    <div className={styles.upgradeMeta}>
                      <span className={styles.upgradeCost}>{LIGHTWEIGHT_WHEELS.cost}</span>
                      <span className={styles.upgradeGain}>+0.5 grip</span>
                    </div>
                  </button>
                </div>
              )}

              {/* Apply Button (when editing) */}
              {isEditing && (
                <button className={styles.applyBtn} onClick={applyConfig}>
                  <CheckIcon />
                  Apply Configuration
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Individual Spec Field Component
 */
function SpecField({ 
  label, 
  value, 
  onChange, 
  suffix = '', 
  placeholder = '',
  isEditing = false,
  disabled = false,
  fullWidth = false,
}) {
  if (!isEditing) {
    return (
      <div className={`${styles.specField} ${fullWidth ? styles.specFieldFull : ''}`}>
        <span className={styles.specLabel}>{label}</span>
        <span className={styles.specValue}>
          {value || placeholder}
          {suffix && value && suffix}
        </span>
      </div>
    );
  }

  return (
    <div className={`${styles.specField} ${fullWidth ? styles.specFieldFull : ''}`}>
      <label className={styles.specLabel}>{label}</label>
      <div className={styles.specInputWrapper}>
        <input
          type="text"
          className={styles.specInput}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
        />
        {suffix && <span className={styles.specSuffix}>{suffix}</span>}
      </div>
    </div>
  );
}

/**
 * Parse wheel size string like "20×9.5" into diameter and width
 */
function parseWheelSize(sizeStr) {
  if (!sizeStr) return { diameter: '', width: '' };
  
  // Try to match patterns like "20×9.5", "20x9.5", "20 x 9.5"
  const match = sizeStr.match(/(\d+\.?\d*)\s*[×x]\s*(\d+\.?\d*)/i);
  if (match) {
    return { diameter: match[1], width: match[2] };
  }
  
  return { diameter: '', width: '' };
}

/**
 * Hook to manage wheel/tire selection state
 */
export function useWheelTireSelection(initialFitment = null) {
  const [selectedFitment, setSelectedFitment] = useState(initialFitment);
  
  const selectFitment = useCallback((fitment) => {
    setSelectedFitment(fitment);
  }, []);
  
  const clearSelection = useCallback(() => {
    setSelectedFitment(null);
  }, []);
  
  return {
    selectedFitment,
    selectFitment,
    clearSelection,
  };
}
