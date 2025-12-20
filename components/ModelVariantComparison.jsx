'use client';

/**
 * ModelVariantComparison Component
 * 
 * AI-powered comparison of similar car variants.
 * Shows the key differences between related models like:
 * - Porsche Cayman GTS vs Cayman GTS 4.0
 * - BMW M3 vs M3 Competition
 * - Corvette Stingray vs Z06
 * 
 * Helps users understand what makes each variant unique.
 */

import { useState, useMemo } from 'react';
import styles from './ModelVariantComparison.module.css';
import CarImage from './CarImage';
import { carData } from '@/data/cars';

// Icons
const Icons = {
  arrowRight: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  chevronDown: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  x: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  bolt: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  gauge: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  dollar: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  check: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
};

/**
 * Find related variants for a car
 * Uses brand, model line, and naming patterns
 */
function findRelatedVariants(car, allCars) {
  if (!car) return [];
  
  // Extract base model identifiers
  const nameParts = car.name.toLowerCase().split(' ');
  const brand = car.brand?.toLowerCase() || nameParts[0];
  
  // Find cars that share the same model base
  const related = allCars.filter(other => {
    if (other.slug === car.slug) return false;
    
    const otherBrand = other.brand?.toLowerCase() || other.name.split(' ')[0].toLowerCase();
    if (brand !== otherBrand) return false;
    
    // Check for similar model identifiers
    const otherName = other.name.toLowerCase();
    
    // Porsche patterns
    if (brand === 'porsche') {
      // Group by chassis code (718, 911, 991, 992, etc.)
      const chassisCodes = ['718', '911', '991', '992', '987', '981', '997', '996', '993'];
      const thisChassis = chassisCodes.find(c => car.name.includes(c));
      const otherChassis = chassisCodes.find(c => other.name.includes(c));
      if (thisChassis && otherChassis && thisChassis === otherChassis) return true;
      
      // Group Cayman/Boxster
      if ((car.name.includes('Cayman') || car.name.includes('Boxster')) &&
          (other.name.includes('Cayman') || other.name.includes('Boxster'))) {
        return true;
      }
    }
    
    // BMW patterns
    if (brand === 'bmw') {
      // Group by model (M2, M3, M4, etc.)
      const bmwModels = ['M2', 'M3', 'M4', 'M5', 'M8', '1M'];
      const thisModel = bmwModels.find(m => car.name.includes(m));
      const otherModel = bmwModels.find(m => other.name.includes(m));
      if (thisModel && otherModel && thisModel === otherModel) return true;
    }
    
    // Corvette patterns
    if (car.name.includes('Corvette') && other.name.includes('Corvette')) {
      // Group by generation (C7, C8)
      if ((car.name.includes('C7') || car.years?.includes('2014')) &&
          (other.name.includes('C7') || other.years?.includes('2014'))) return true;
      if ((car.name.includes('C8') || car.years?.includes('2020')) &&
          (other.name.includes('C8') || other.years?.includes('2020'))) return true;
    }
    
    // Toyota/Subaru patterns
    if ((car.name.includes('86') || car.name.includes('BRZ') || car.name.includes('GR86')) &&
        (other.name.includes('86') || other.name.includes('BRZ') || other.name.includes('GR86'))) {
      return true;
    }
    
    // Mustang/Camaro patterns
    if (car.name.includes('Mustang') && other.name.includes('Mustang')) return true;
    if (car.name.includes('Camaro') && other.name.includes('Camaro')) return true;
    
    // Nissan Z patterns
    if ((car.name.includes('370Z') || car.name.includes('350Z') || car.name.includes('Z ')) &&
        (other.name.includes('370Z') || other.name.includes('350Z') || other.name.includes('Z '))) {
      return true;
    }
    
    // GT-R patterns
    if (car.name.includes('GT-R') && other.name.includes('GT-R')) return true;
    
    // Generic pattern: first two words match
    if (nameParts.length >= 2) {
      const otherParts = otherName.split(' ');
      if (nameParts[0] === otherParts[0] && nameParts[1] === otherParts[1]) {
        return true;
      }
    }
    
    return false;
  });
  
  return related.slice(0, 6); // Limit to 6 variants
}

/**
 * Generate comparison data between two cars
 */
function generateComparison(car1, car2) {
  const differences = [];
  const similarities = [];
  
  // Power comparison
  if (car1.hp && car2.hp) {
    const hpDiff = car2.hp - car1.hp;
    if (Math.abs(hpDiff) > 10) {
      differences.push({
        category: 'Power',
        icon: Icons.bolt,
        car1Value: `${car1.hp} hp`,
        car2Value: `${car2.hp} hp`,
        diff: hpDiff > 0 ? `+${hpDiff} hp` : `${hpDiff} hp`,
        winner: hpDiff > 0 ? 'car2' : 'car1',
      });
    } else {
      similarities.push(`Similar power output (~${car1.hp} hp)`);
    }
  }
  
  // Torque comparison
  if (car1.torque && car2.torque) {
    const torqueDiff = car2.torque - car1.torque;
    if (Math.abs(torqueDiff) > 10) {
      differences.push({
        category: 'Torque',
        icon: Icons.gauge,
        car1Value: `${car1.torque} lb-ft`,
        car2Value: `${car2.torque} lb-ft`,
        diff: torqueDiff > 0 ? `+${torqueDiff} lb-ft` : `${torqueDiff} lb-ft`,
        winner: torqueDiff > 0 ? 'car2' : 'car1',
      });
    }
  }
  
  // 0-60 comparison
  if (car1.zeroToSixty && car2.zeroToSixty) {
    const timeDiff = (car2.zeroToSixty - car1.zeroToSixty).toFixed(1);
    if (Math.abs(timeDiff) > 0.2) {
      differences.push({
        category: '0-60 mph',
        icon: Icons.gauge,
        car1Value: `${car1.zeroToSixty}s`,
        car2Value: `${car2.zeroToSixty}s`,
        diff: parseFloat(timeDiff) < 0 ? `${timeDiff}s faster` : `${timeDiff}s slower`,
        winner: parseFloat(timeDiff) < 0 ? 'car2' : 'car1',
      });
    } else {
      similarities.push(`Similar acceleration (~${car1.zeroToSixty}s 0-60)`);
    }
  }
  
  // Weight comparison
  if (car1.curbWeight && car2.curbWeight) {
    const weightDiff = car2.curbWeight - car1.curbWeight;
    if (Math.abs(weightDiff) > 50) {
      differences.push({
        category: 'Weight',
        icon: Icons.gauge,
        car1Value: `${car1.curbWeight.toLocaleString()} lbs`,
        car2Value: `${car2.curbWeight.toLocaleString()} lbs`,
        diff: weightDiff > 0 ? `+${weightDiff} lbs` : `${weightDiff} lbs`,
        winner: weightDiff < 0 ? 'car2' : 'car1', // Lighter is better
      });
    }
  }
  
  // Engine differences
  if (car1.engine && car2.engine && car1.engine !== car2.engine) {
    differences.push({
      category: 'Engine',
      icon: Icons.bolt,
      car1Value: car1.engine,
      car2Value: car2.engine,
      diff: 'Different engines',
      winner: null,
    });
  } else if (car1.engine) {
    similarities.push(`Same engine platform (${car1.engine})`);
  }
  
  // Drivetrain
  if (car1.drivetrain && car2.drivetrain) {
    if (car1.drivetrain !== car2.drivetrain) {
      differences.push({
        category: 'Drivetrain',
        icon: Icons.gauge,
        car1Value: car1.drivetrain,
        car2Value: car2.drivetrain,
        diff: 'Different drivetrain',
        winner: null,
      });
    } else {
      similarities.push(`Same drivetrain (${car1.drivetrain})`);
    }
  }
  
  // Price comparison
  if (car1.priceRange && car2.priceRange) {
    const extractPrice = (range) => {
      const match = range.match(/\$(\d+)k/i);
      return match ? parseInt(match[1]) * 1000 : 0;
    };
    const price1 = extractPrice(car1.priceRange);
    const price2 = extractPrice(car2.priceRange);
    
    if (price1 && price2 && Math.abs(price2 - price1) > 5000) {
      differences.push({
        category: 'Price Range',
        icon: Icons.dollar,
        car1Value: car1.priceRange,
        car2Value: car2.priceRange,
        diff: price2 > price1 ? 'Higher price' : 'Lower price',
        winner: price2 < price1 ? 'car2' : 'car1', // Lower is better for value
      });
    }
  }
  
  // Transmission
  if (car1.trans && car2.trans && car1.trans !== car2.trans) {
    differences.push({
      category: 'Transmission',
      icon: Icons.gauge,
      car1Value: car1.trans,
      car2Value: car2.trans,
      diff: 'Different transmission',
      winner: null,
    });
  }
  
  return { differences, similarities };
}

/**
 * Generate AI-like summary of the comparison
 */
function generateSummary(car1, car2, comparison) {
  const { differences, similarities } = comparison;
  
  if (differences.length === 0) {
    return `The ${car1.name} and ${car2.name} are very similar models with minor differences.`;
  }
  
  const mainDifferences = differences.slice(0, 3).map(d => d.category.toLowerCase()).join(', ');
  
  let summary = `The ${car2.name} differs from the ${car1.name} primarily in ${mainDifferences}. `;
  
  // Add specific insights
  const powerDiff = differences.find(d => d.category === 'Power');
  if (powerDiff) {
    summary += powerDiff.winner === 'car2' 
      ? `It offers ${powerDiff.diff} more power. `
      : `It has ${Math.abs(parseInt(powerDiff.diff))} hp less. `;
  }
  
  const priceDiff = differences.find(d => d.category === 'Price Range');
  if (priceDiff) {
    summary += priceDiff.winner === 'car2'
      ? `It also comes at a lower price point. `
      : `It comes at a premium. `;
  }
  
  if (similarities.length > 0) {
    summary += `They share ${similarities[0].toLowerCase()}.`;
  }
  
  return summary;
}

/**
 * ModelVariantComparison Component
 */
export default function ModelVariantComparison({ car, onClose }) {
  const [selectedVariant, setSelectedVariant] = useState(null);
  
  // Find related variants
  const relatedVariants = useMemo(() => 
    findRelatedVariants(car, carData),
    [car]
  );
  
  // Generate comparison when variant selected
  const comparison = useMemo(() => {
    if (!selectedVariant) return null;
    return generateComparison(car, selectedVariant);
  }, [car, selectedVariant]);
  
  const summary = useMemo(() => {
    if (!selectedVariant || !comparison) return null;
    return generateSummary(car, selectedVariant, comparison);
  }, [car, selectedVariant, comparison]);
  
  if (relatedVariants.length === 0) {
    return null;
  }
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Compare Variants</h3>
        {onClose && (
          <button onClick={onClose} className={styles.closeBtn}>
            <Icons.x size={20} />
          </button>
        )}
      </div>
      
      <p className={styles.subtitle}>
        See how the {car.name} compares to similar models
      </p>
      
      {/* Variant Selection */}
      {!selectedVariant ? (
        <div className={styles.variantGrid}>
          {relatedVariants.map((variant) => (
            <button
              key={variant.slug}
              className={styles.variantCard}
              onClick={() => setSelectedVariant(variant)}
            >
              <div className={styles.variantImage}>
                <CarImage car={variant} variant="card" />
              </div>
              <div className={styles.variantInfo}>
                <span className={styles.variantName}>{variant.name}</span>
                <span className={styles.variantMeta}>
                  {variant.hp} hp • {variant.zeroToSixty}s
                </span>
              </div>
              <Icons.arrowRight size={16} className={styles.variantArrow} />
            </button>
          ))}
        </div>
      ) : (
        /* Comparison View */
        <div className={styles.comparisonView}>
          {/* Back button */}
          <button 
            className={styles.backBtn}
            onClick={() => setSelectedVariant(null)}
          >
            ← Choose different variant
          </button>
          
          {/* Cars header */}
          <div className={styles.carsHeader}>
            <div className={styles.carColumn}>
              <div className={styles.carThumb}>
                <CarImage car={car} variant="card" />
              </div>
              <h4>{car.name}</h4>
            </div>
            <div className={styles.vsIndicator}>VS</div>
            <div className={styles.carColumn}>
              <div className={styles.carThumb}>
                <CarImage car={selectedVariant} variant="card" />
              </div>
              <h4>{selectedVariant.name}</h4>
            </div>
          </div>
          
          {/* Summary */}
          {summary && (
            <div className={styles.summary}>
              <p>{summary}</p>
            </div>
          )}
          
          {/* Differences */}
          {comparison.differences.length > 0 && (
            <div className={styles.section}>
              <h5 className={styles.sectionTitle}>Key Differences</h5>
              <div className={styles.diffList}>
                {comparison.differences.map((diff, i) => {
                  const Icon = diff.icon;
                  return (
                    <div key={i} className={styles.diffRow}>
                      <div className={styles.diffCategory}>
                        <Icon size={16} />
                        <span>{diff.category}</span>
                      </div>
                      <div className={`${styles.diffValue} ${diff.winner === 'car1' ? styles.winner : ''}`}>
                        {diff.car1Value}
                      </div>
                      <div className={styles.diffIndicator}>
                        {diff.diff}
                      </div>
                      <div className={`${styles.diffValue} ${diff.winner === 'car2' ? styles.winner : ''}`}>
                        {diff.car2Value}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Similarities */}
          {comparison.similarities.length > 0 && (
            <div className={styles.section}>
              <h5 className={styles.sectionTitle}>In Common</h5>
              <ul className={styles.similaritiesList}>
                {comparison.similarities.map((sim, i) => (
                  <li key={i}>
                    <Icons.check size={14} />
                    <span>{sim}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Compact variant for car detail pages
 */
export function RelatedVariantsChips({ car, onSelectVariant }) {
  const relatedVariants = useMemo(() => 
    findRelatedVariants(car, carData),
    [car]
  );
  
  if (relatedVariants.length === 0) return null;
  
  return (
    <div className={styles.chipsContainer}>
      <span className={styles.chipsLabel}>Compare to:</span>
      <div className={styles.chips}>
        {relatedVariants.slice(0, 4).map((variant) => (
          <button
            key={variant.slug}
            className={styles.chip}
            onClick={() => onSelectVariant?.(variant)}
          >
            {variant.name}
          </button>
        ))}
      </div>
    </div>
  );
}



















