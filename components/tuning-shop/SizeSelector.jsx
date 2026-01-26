'use client';

/**
 * Size Selector Component
 * 
 * For parts that have size variants (brake rotors, wheel spacers, 
 * coilover springs, intercoolers, etc.), this component displays
 * available sizes and allows selection before adding to build.
 * 
 * Size options can come from:
 * 1. Part's attributes.source.variants array
 * 2. Part's attributes.sizeOptions object (explicit sizes)
 * 3. Category-based defaults (e.g., spacer mm options)
 * 
 * @module components/tuning-shop/SizeSelector
 */

import { useState, useMemo, useCallback } from 'react';

import styles from './SizeSelector.module.css';

// Categories that commonly have size variants
const SIZE_VARIANT_CATEGORIES = {
  brakes: {
    types: ['rotor', 'caliper', 'pad'],
    sizeLabel: 'Rotor Size',
    sizeUnit: 'mm',
    defaultOptions: ['330mm', '345mm', '355mm', '365mm', '380mm'],
  },
  suspension: {
    types: ['coilover', 'spring', 'damper'],
    sizeLabel: 'Spring Rate',
    sizeUnit: 'lbs/in',
    defaultOptions: ['400', '500', '600', '700', '800'],
  },
  wheels_tires: {
    types: ['spacer'],
    sizeLabel: 'Thickness',
    sizeUnit: 'mm',
    defaultOptions: ['5mm', '10mm', '12mm', '15mm', '20mm', '25mm'],
  },
  forced_induction: {
    types: ['intercooler', 'turbo'],
    sizeLabel: 'Size',
    sizeUnit: '',
    defaultOptions: ['Stock Replacement', 'Stage 1', 'Stage 2', 'Big'],
  },
};

/**
 * @typedef {Object} PartVariant
 * @property {string|number} id - Variant ID
 * @property {string} sku - SKU code
 * @property {string} title - Display name (often indicates size)
 * @property {string} price - Price string
 * @property {boolean} available - In stock
 */

/**
 * @typedef {Object} SizeSelectorProps
 * @property {Object} part - Part object with attributes
 * @property {PartVariant|null} selectedVariant - Currently selected variant
 * @property {function} onSelect - Callback when variant is selected
 * @property {boolean} [showPrice] - Show variant prices
 * @property {boolean} [compact] - Compact display mode
 * @property {boolean} [disabled] - Disable selection
 */

/**
 * Extract size variants from a part's attributes
 * @param {Object} part - Part object
 * @returns {{ variants: PartVariant[], sizeLabel: string, hasSizes: boolean }}
 */
export function extractSizeVariants(part) {
  if (!part?.attributes) {
    return { variants: [], sizeLabel: 'Option', hasSizes: false };
  }

  const attrs = part.attributes;
  
  // Check for explicit variants in source
  if (attrs.source?.variants && Array.isArray(attrs.source.variants)) {
    const variants = attrs.source.variants.map(v => ({
      id: v.id,
      sku: v.sku || '',
      title: v.title || 'Default',
      price: v.price || '0',
      available: v.available !== false,
    }));
    
    // Only consider it as having sizes if there's more than one variant
    // or if the single variant has a meaningful title
    const hasSizes = variants.length > 1 || 
      (variants.length === 1 && variants[0].title !== 'Default Title');
    
    return {
      variants,
      sizeLabel: getSizeLabelForPart(part),
      hasSizes,
    };
  }
  
  // Check for explicit sizeOptions
  if (attrs.sizeOptions && Array.isArray(attrs.sizeOptions)) {
    const variants = attrs.sizeOptions.map((opt, idx) => ({
      id: `size-${idx}`,
      sku: opt.sku || '',
      title: opt.label || opt.value || opt,
      price: opt.price || '0',
      available: opt.available !== false,
    }));
    
    return {
      variants,
      sizeLabel: attrs.sizeLabel || 'Size',
      hasSizes: variants.length > 1,
    };
  }
  
  // Check category defaults
  const categoryConfig = SIZE_VARIANT_CATEGORIES[part.category];
  if (categoryConfig) {
    const partName = (part.name || '').toLowerCase();
    const matchesType = categoryConfig.types.some(type => partName.includes(type));
    
    if (matchesType && attrs.requiresSize) {
      const variants = categoryConfig.defaultOptions.map((opt, idx) => ({
        id: `default-${idx}`,
        sku: '',
        title: opt,
        price: '0',
        available: true,
      }));
      
      return {
        variants,
        sizeLabel: categoryConfig.sizeLabel,
        hasSizes: true,
      };
    }
  }
  
  return { variants: [], sizeLabel: 'Option', hasSizes: false };
}

/**
 * Get appropriate size label for a part based on its category/type
 */
function getSizeLabelForPart(part) {
  const name = (part.name || '').toLowerCase();
  
  if (name.includes('rotor') || name.includes('brake')) return 'Rotor Size';
  if (name.includes('spacer')) return 'Thickness';
  if (name.includes('spring') || name.includes('coilover')) return 'Spring Rate';
  if (name.includes('intercooler')) return 'Core Size';
  if (name.includes('turbo')) return 'Frame Size';
  if (name.includes('exhaust')) return 'Pipe Size';
  
  return 'Option';
}

/**
 * Size Selector Component
 * @param {SizeSelectorProps} props
 */
export default function SizeSelector({
  part,
  selectedVariant,
  onSelect,
  showPrice = true,
  compact = false,
  disabled = false,
}) {
  const { variants, sizeLabel, hasSizes } = useMemo(
    () => extractSizeVariants(part),
    [part]
  );

  // Move useCallback BEFORE early return to follow Rules of Hooks
  const handleSelect = useCallback((variant) => {
    if (disabled) return;
    onSelect?.(variant);
  }, [disabled, onSelect]);

  // If no size options, render nothing
  if (!hasSizes || variants.length === 0) {
    return null;
  }

  // Check if a variant is selected
  const isSelected = (variant) => {
    if (!selectedVariant) return false;
    return selectedVariant.id === variant.id;
  };

  if (compact) {
    return (
      <div className={styles.compactContainer}>
        <label className={styles.compactLabel}>{sizeLabel}:</label>
        <select
          className={styles.compactSelect}
          value={selectedVariant?.id || ''}
          onChange={(e) => {
            const variant = variants.find(v => String(v.id) === e.target.value);
            handleSelect(variant);
          }}
          disabled={disabled}
        >
          <option value="">Select {sizeLabel.toLowerCase()}</option>
          {variants.map(variant => (
            <option 
              key={variant.id} 
              value={variant.id}
              disabled={!variant.available}
            >
              {variant.title}
              {showPrice && variant.price && variant.price !== '0' && ` - $${variant.price}`}
              {!variant.available && ' (Out of Stock)'}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <label className={styles.label}>{sizeLabel}</label>
      <div className={styles.options}>
        {variants.map(variant => (
          <button
            key={variant.id}
            className={`${styles.option} ${isSelected(variant) ? styles.optionSelected : ''} ${!variant.available ? styles.optionUnavailable : ''}`}
            onClick={() => handleSelect(variant)}
            disabled={disabled || !variant.available}
          >
            <span className={styles.optionTitle}>{variant.title}</span>
            {showPrice && variant.price && variant.price !== '0' && (
              <span className={styles.optionPrice}>${variant.price}</span>
            )}
            {!variant.available && (
              <span className={styles.optionStock}>Out of Stock</span>
            )}
          </button>
        ))}
      </div>
      {!selectedVariant && (
        <p className={styles.hint}>Select a {sizeLabel.toLowerCase()} to continue</p>
      )}
    </div>
  );
}

/**
 * Inline size selector for use within part cards
 * Shows as a dropdown in a compact form factor
 */
export function InlineSizeSelector({
  part,
  selectedVariant,
  onSelect,
  disabled = false,
}) {
  const { variants, sizeLabel, hasSizes } = useMemo(
    () => extractSizeVariants(part),
    [part]
  );

  if (!hasSizes) return null;

  return (
    <div className={styles.inlineContainer}>
      <select
        className={styles.inlineSelect}
        value={selectedVariant?.id || ''}
        onChange={(e) => {
          const variant = variants.find(v => String(v.id) === e.target.value);
          onSelect?.(variant);
        }}
        disabled={disabled}
      >
        <option value="">{sizeLabel}...</option>
        {variants.map(variant => (
          <option 
            key={variant.id} 
            value={variant.id}
            disabled={!variant.available}
          >
            {variant.title}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Hook to manage size selection state for multiple parts
 */
export function useSizeSelections(parts = []) {
  const [selections, setSelections] = useState({});

  const setSelection = useCallback((partId, variant) => {
    setSelections(prev => ({
      ...prev,
      [partId]: variant,
    }));
  }, []);

  const getSelection = useCallback((partId) => {
    return selections[partId] || null;
  }, [selections]);

  const clearSelection = useCallback((partId) => {
    setSelections(prev => {
      const next = { ...prev };
      delete next[partId];
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setSelections({});
  }, []);

  // Check which parts need size selection but don't have one
  const missingSelections = useMemo(() => {
    return parts
      .filter(part => {
        const { hasSizes } = extractSizeVariants(part);
        return hasSizes && !selections[part.id];
      })
      .map(part => part.id);
  }, [parts, selections]);

  // Format selections for saving to build
  const toUpgradeFormat = useCallback(() => {
    return Object.entries(selections).map(([partId, variant]) => ({
      partId,
      variantId: variant.id,
      variantSku: variant.sku,
      variantTitle: variant.title,
      variantPrice: variant.price,
    }));
  }, [selections]);

  return {
    selections,
    setSelection,
    getSelection,
    clearSelection,
    clearAll,
    missingSelections,
    toUpgradeFormat,
    hasMissingSelections: missingSelections.length > 0,
  };
}

/**
 * Check if a part requires size selection
 * @param {Object} part - Part object
 * @returns {boolean}
 */
export function partRequiresSizeSelection(part) {
  const { hasSizes } = extractSizeVariants(part);
  return hasSizes;
}

