'use client';

/**
 * Wheel & Tire Configurator Component
 * 
 * Displays OEM baseline and upgrade wheel/tire fitment options.
 * Shows fitment warnings, recommended use cases, and estimated costs.
 * Allows selection to add to build.
 * 
 * @module components/tuning-shop/WheelTireConfigurator
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchCarFitments, getFitmentWarnings, getRecommendedForTags, estimateFitmentCost, formatWheelSpecs, formatTireSpecs, compareFitments } from '@/lib/fitmentService';
import styles from './WheelTireConfigurator.module.css';

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

const WarningIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const CheckIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const InfoIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);

const PlusIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

/**
 * @typedef {Object} WheelTireConfiguratorProps
 * @property {Object} car - Selected car object with slug
 * @property {Object|null} selectedFitment - Currently selected fitment option
 * @property {function} onSelect - Callback when a fitment is selected
 * @property {boolean} [defaultExpanded] - Start expanded
 * @property {boolean} [showCostEstimates] - Show cost estimates
 * @property {boolean} [disabled] - Disable selection
 */

/**
 * Wheel & Tire Configurator
 * @param {WheelTireConfiguratorProps} props
 */
export default function WheelTireConfigurator({
  car,
  selectedFitment,
  onSelect,
  defaultExpanded = true,
  showCostEstimates = true,
  disabled = false,
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fitmentData, setFitmentData] = useState(null);
  const [expandedOption, setExpandedOption] = useState(null);

  // Fetch fitment data when car changes
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
        }
        setIsLoading(false);
      }
    };

    loadData();
    
    return () => {
      cancelled = true;
    };
  }, [car?.slug]);

  // Handle option selection
  const handleSelect = useCallback((option) => {
    if (disabled) return;
    
    // If clicking the same option, deselect it
    if (selectedFitment?.id === option.id) {
      onSelect?.(null);
    } else {
      onSelect?.(option);
    }
  }, [selectedFitment, onSelect, disabled]);

  // Toggle option expansion for mobile
  const toggleOptionExpanded = useCallback((optionId) => {
    setExpandedOption(prev => prev === optionId ? null : optionId);
  }, []);

  // Check if we have data to show
  const hasData = fitmentData && (fitmentData.oem || fitmentData.options?.length > 0);
  
  // Group options by category for display
  const groupedOptions = useMemo(() => {
    if (!fitmentData?.options) return {};
    
    const groups = {};
    fitmentData.options.forEach(opt => {
      const type = opt.fitmentType || 'other';
      if (!groups[type]) groups[type] = [];
      groups[type].push(opt);
    });
    
    return groups;
  }, [fitmentData]);

  // Don't render if no car selected
  if (!car) return null;

  return (
    <div className={styles.container}>
      {/* Header */}
      <button 
        className={styles.header}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <div className={styles.headerLeft}>
          <WheelIcon />
          <span className={styles.headerTitle}>Wheels & Tires</span>
          {selectedFitment && (
            <span className={styles.selectedBadge}>
              <CheckIcon />
              Selected
            </span>
          )}
        </div>
        <div className={styles.headerRight}>
          {!isExpanded && selectedFitment && (
            <span className={styles.summaryText}>
              {selectedFitment.displayName}
            </span>
          )}
          <ChevronIcon isOpen={isExpanded} />
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className={styles.content}>
          {isLoading ? (
            <div className={styles.loading}>
              <div className={styles.spinner} />
              <span>Loading fitment options...</span>
            </div>
          ) : error ? (
            <div className={styles.error}>
              <WarningIcon />
              <span>{error}</span>
            </div>
          ) : !hasData ? (
            <div className={styles.noData}>
              <InfoIcon />
              <span>No wheel/tire fitment data available for this vehicle</span>
            </div>
          ) : (
            <>
              {/* OEM Baseline */}
              {fitmentData.oem && (
                <div className={styles.section}>
                  <h4 className={styles.sectionTitle}>OEM Stock</h4>
                  <FitmentOptionCard
                    option={fitmentData.oem}
                    isSelected={selectedFitment?.id === fitmentData.oem.id}
                    isExpanded={expandedOption === fitmentData.oem.id}
                    onSelect={() => handleSelect(fitmentData.oem)}
                    onToggleExpand={() => toggleOptionExpanded(fitmentData.oem.id)}
                    showCost={showCostEstimates}
                    disabled={disabled}
                    isOEM
                  />
                </div>
              )}

              {/* Upgrade Options */}
              {Object.keys(groupedOptions).length > 0 && (
                <div className={styles.section}>
                  <h4 className={styles.sectionTitle}>Upgrade Options</h4>
                  <div className={styles.optionsGrid}>
                    {Object.entries(groupedOptions).map(([type, options]) => (
                      options.map(option => (
                        <FitmentOptionCard
                          key={option.id}
                          option={option}
                          oemBaseline={fitmentData.oem}
                          isSelected={selectedFitment?.id === option.id}
                          isExpanded={expandedOption === option.id}
                          onSelect={() => handleSelect(option)}
                          onToggleExpand={() => toggleOptionExpanded(option.id)}
                          showCost={showCostEstimates}
                          disabled={disabled}
                        />
                      ))
                    ))}
                  </div>
                </div>
              )}

              {/* Info Footer */}
              <div className={styles.infoFooter}>
                <InfoIcon />
                <span>
                  Fitment data is community-sourced. Always verify with your wheel/tire shop.
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Individual Fitment Option Card
 */
function FitmentOptionCard({
  option,
  oemBaseline,
  isSelected,
  isExpanded,
  onSelect,
  onToggleExpand,
  showCost,
  disabled,
  isOEM = false,
}) {
  // Get warnings for this option
  const warnings = useMemo(() => getFitmentWarnings(option), [option]);
  
  // Get recommended-for tags
  const tags = useMemo(() => getRecommendedForTags(option.recommendedFor), [option.recommendedFor]);
  
  // Get comparison to OEM (for upgrade options)
  const comparison = useMemo(() => {
    if (isOEM || !oemBaseline) return null;
    return compareFitments(oemBaseline, option);
  }, [isOEM, oemBaseline, option]);
  
  // Get cost estimate
  const costEstimate = useMemo(() => {
    if (isOEM || !showCost) return null;
    return estimateFitmentCost(option);
  }, [isOEM, showCost, option]);

  return (
    <div 
      className={`
        ${styles.optionCard} 
        ${isSelected ? styles.optionCardSelected : ''} 
        ${isOEM ? styles.optionCardOEM : ''}
        ${warnings.length > 0 ? styles.optionCardHasWarnings : ''}
      `}
    >
      {/* Card Header */}
      <div className={styles.cardHeader} onClick={onToggleExpand}>
        <div className={styles.cardHeaderLeft}>
          <span className={styles.fitmentType}>{option.displayName}</span>
          {option.verified && (
            <span className={styles.verifiedBadge}>✓ Verified</span>
          )}
        </div>
        <ChevronIcon isOpen={isExpanded} />
      </div>

      {/* Key Specs (Always Visible) */}
      <div className={styles.keySpecs}>
        <div className={styles.specRow}>
          <span className={styles.specLabel}>Wheels</span>
          <span className={styles.specValue}>{formatWheelSpecs(option)}</span>
        </div>
        <div className={styles.specRow}>
          <span className={styles.specLabel}>Tires</span>
          <span className={styles.specValue}>{formatTireSpecs(option)}</span>
        </div>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className={styles.tags}>
          {tags.map(tag => (
            <span 
              key={tag.key} 
              className={styles.tag}
              style={{ '--tag-color': tag.color }}
            >
              {tag.label}
            </span>
          ))}
        </div>
      )}

      {/* Warnings (If Any) */}
      {warnings.length > 0 && (
        <div className={styles.warnings}>
          {warnings.map((warning, idx) => (
            <div key={idx} className={`${styles.warning} ${styles[`warning${warning.severity}`]}`}>
              <span className={styles.warningIcon}>{warning.icon}</span>
              <span className={styles.warningText}>{warning.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Expanded Details */}
      {isExpanded && (
        <div className={styles.expandedDetails}>
          {/* Comparison to OEM */}
          {comparison && (
            <div className={styles.comparison}>
              <h5 className={styles.detailsSubtitle}>vs. OEM Stock</h5>
              <div className={styles.comparisonGrid}>
                {comparison.wheelDiameterDiff !== 0 && (
                  <div className={styles.comparisonItem}>
                    <span>Diameter</span>
                    <span className={comparison.wheelDiameterDiff > 0 ? styles.positive : styles.negative}>
                      {comparison.wheelDiameterDiff > 0 ? '+' : ''}{comparison.wheelDiameterDiff}"
                    </span>
                  </div>
                )}
                {comparison.wheelWidthFrontDiff !== 0 && (
                  <div className={styles.comparisonItem}>
                    <span>Width (F)</span>
                    <span className={comparison.wheelWidthFrontDiff > 0 ? styles.positive : styles.neutral}>
                      {comparison.wheelWidthFrontDiff > 0 ? '+' : ''}{comparison.wheelWidthFrontDiff}"
                    </span>
                  </div>
                )}
                {comparison.wheelWidthRearDiff !== 0 && (
                  <div className={styles.comparisonItem}>
                    <span>Width (R)</span>
                    <span className={comparison.wheelWidthRearDiff > 0 ? styles.positive : styles.neutral}>
                      {comparison.wheelWidthRearDiff > 0 ? '+' : ''}{comparison.wheelWidthRearDiff}"
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Additional Specs */}
          <div className={styles.additionalSpecs}>
            {option.wheelBoltPattern && (
              <div className={styles.specRow}>
                <span className={styles.specLabel}>Bolt Pattern</span>
                <span className={styles.specValue}>{option.wheelBoltPattern}</span>
              </div>
            )}
            {option.wheelOffsetFront && (
              <div className={styles.specRow}>
                <span className={styles.specLabel}>Offset (F/R)</span>
                <span className={styles.specValue}>
                  +{option.wheelOffsetFront}mm / +{option.wheelOffsetRear || option.wheelOffsetFront}mm
                </span>
              </div>
            )}
            {option.speedometerErrorPercent && (
              <div className={styles.specRow}>
                <span className={styles.specLabel}>Speedo Error</span>
                <span className={styles.specValue}>{option.speedometerErrorPercent}%</span>
              </div>
            )}
            {option.popularityScore > 0 && (
              <div className={styles.specRow}>
                <span className={styles.specLabel}>Popularity</span>
                <span className={styles.specValue}>{option.popularityScore}/100</span>
              </div>
            )}
          </div>

          {/* Clearance Notes */}
          {option.clearanceNotes && (
            <div className={styles.notes}>
              <p>{option.clearanceNotes}</p>
            </div>
          )}

          {/* Cost Estimate */}
          {costEstimate && (
            <div className={styles.costEstimate}>
              <h5 className={styles.detailsSubtitle}>Estimated Cost</h5>
              <div className={styles.costRange}>
                ${costEstimate.low.toLocaleString()} – ${costEstimate.high.toLocaleString()}
              </div>
              <div className={styles.costBreakdown}>
                {Object.entries(costEstimate.breakdown).map(([key, range]) => (
                  <div key={key} className={styles.costItem}>
                    <span>{formatCostKey(key)}</span>
                    <span>${range.low} – ${range.high}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Select Button */}
      {!isOEM && (
        <button
          className={`${styles.selectBtn} ${isSelected ? styles.selectBtnSelected : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          disabled={disabled}
        >
          {isSelected ? (
            <>
              <CheckIcon />
              Selected
            </>
          ) : (
            <>
              <PlusIcon />
              Add to Build
            </>
          )}
        </button>
      )}
    </div>
  );
}

/**
 * Format cost breakdown keys for display
 */
function formatCostKey(key) {
  const labels = {
    wheels: 'Wheels',
    tires: 'Tires',
    wheelsTires: 'Wheels + Tires',
    spacers: 'Spacers',
    camberKit: 'Camber Kit',
    fenderWork: 'Fender Work',
    install: 'Installation',
  };
  return labels[key] || key;
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
  
  // Convert to build upgrade format
  const toBuildUpgrade = useCallback(() => {
    if (!selectedFitment) return null;
    
    return {
      type: 'wheel_tire',
      id: selectedFitment.id,
      displayName: selectedFitment.displayName,
      fitmentType: selectedFitment.fitmentType,
      wheelSpecs: formatWheelSpecs(selectedFitment),
      tireSpecs: formatTireSpecs(selectedFitment),
      warnings: getFitmentWarnings(selectedFitment),
      estimatedCost: estimateFitmentCost(selectedFitment),
    };
  }, [selectedFitment]);
  
  return {
    selectedFitment,
    selectFitment,
    clearSelection,
    toBuildUpgrade,
  };
}

