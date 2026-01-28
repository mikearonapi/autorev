'use client';

/**
 * UpgradeConfigPanel Component
 * 
 * Renders inline configuration options when an upgrade with configOptions is selected.
 * Supports radio groups, checkboxes, and displays warnings/notes contextually.
 * 
 * The config panel appears expanded below the upgrade checkbox when selected,
 * providing a seamless "progressive disclosure" UX pattern.
 */

import { useCallback, useMemo } from 'react';

import { Icons } from '@/components/ui/Icons';

import styles from './UpgradeConfigPanel.module.css';

// Local volume icons (not in shared lib)
const LocalIcons = {
  check: Icons.check,
  warning: Icons.warning,
  info: Icons.info,
  volumeLow: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    </svg>
  ),
  volumeMedium: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
    </svg>
  ),
  volumeHigh: Icons.sound,
  settings: Icons.settings,
};

// Get icon component by name
function getIcon(iconName, size = 14) {
  const iconMap = {
    'check': LocalIcons.check,
    'warning': LocalIcons.warning,
    'info': LocalIcons.info,
    'volume-low': LocalIcons.volumeLow,
    'volume-medium': LocalIcons.volumeMedium,
    'volume-high': LocalIcons.volumeHigh,
  };
  const IconComponent = iconMap[iconName] || LocalIcons.settings;
  return <IconComponent size={size} />;
}

/**
 * Calculate the HP modifier from the current config
 */
export function calculateConfigHpModifier(configOptions, currentConfig) {
  if (!configOptions || !currentConfig) return 0;
  
  let totalModifier = 0;
  
  for (const [optionKey, optionDef] of Object.entries(configOptions)) {
    const selectedValue = currentConfig[optionKey];
    
    if (optionDef.type === 'radio' && optionDef.options) {
      const selectedOption = optionDef.options.find(opt => opt.value === selectedValue);
      if (selectedOption?.hpModifier) {
        totalModifier += selectedOption.hpModifier;
      }
    } else if (optionDef.type === 'checkbox' && selectedValue && optionDef.hpModifier) {
      totalModifier += optionDef.hpModifier;
    }
  }
  
  return totalModifier;
}

/**
 * Get default config values for an upgrade
 */
export function getDefaultConfig(configOptions) {
  if (!configOptions) return {};
  
  const defaults = {};
  for (const [optionKey, optionDef] of Object.entries(configOptions)) {
    if (optionDef.default !== undefined) {
      defaults[optionKey] = optionDef.default;
    }
  }
  return defaults;
}

/**
 * Radio Group for config options
 */
function ConfigRadioGroup({ optionKey, option, value, onChange }) {
  return (
    <div className={styles.configGroup}>
      <div className={styles.configLabel}>
        <span className={styles.labelText}>{option.label}</span>
        {option.description && (
          <span className={styles.labelHint}>{option.description}</span>
        )}
      </div>
      <div className={styles.radioOptions}>
        {option.options.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <label 
              key={opt.value} 
              className={`${styles.radioOption} ${isSelected ? styles.selected : ''}`}
            >
              <input
                type="radio"
                name={optionKey}
                value={opt.value}
                checked={isSelected}
                onChange={() => onChange(optionKey, opt.value)}
                className={styles.radioInput}
              />
              <span className={styles.radioButton}>
                {isSelected && <span className={styles.radioDot} />}
              </span>
              <span className={styles.radioContent}>
                <span className={styles.radioLabel}>
                  {opt.icon && (
                    <span className={styles.optionIcon}>
                      {getIcon(opt.icon)}
                    </span>
                  )}
                  {opt.label}
                  {opt.hpModifier > 0 && (
                    <span className={styles.hpBadge}>+{opt.hpModifier}hp</span>
                  )}
                  {opt.costModifier > 0 && (
                    <span className={styles.costBadge}>+${opt.costModifier}</span>
                  )}
                  {opt.costModifier < 0 && (
                    <span className={styles.costBadgeSave}>${opt.costModifier}</span>
                  )}
                </span>
                {opt.description && (
                  <span className={styles.radioDescription}>{opt.description}</span>
                )}
                {opt.note && !opt.warning && (
                  <span className={styles.radioNote}>
                    <Icons.info size={12} />
                    {opt.note}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>
      
      {/* Show warning for selected option if it has one */}
      {option.options.find(opt => opt.value === value)?.warning && (
        <div className={styles.configWarning}>
          <Icons.warning size={14} />
          <span>{option.options.find(opt => opt.value === value).warning}</span>
        </div>
      )}
      
      {/* Show dependencies/recommendations */}
      {option.dependencies?.[value]?.warning && (
        <div className={styles.configDependency}>
          <Icons.info size={14} />
          <span>{option.dependencies[value].warning}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Checkbox for config options
 */
function ConfigCheckbox({ optionKey, option, value, onChange }) {
  return (
    <label className={`${styles.checkboxOption} ${value ? styles.checked : ''}`}>
      <input
        type="checkbox"
        checked={value || false}
        onChange={(e) => onChange(optionKey, e.target.checked)}
        className={styles.checkboxInput}
      />
      <span className={styles.checkboxBox}>
        {value && <Icons.check size={12} />}
      </span>
      <span className={styles.checkboxContent}>
        <span className={styles.checkboxLabel}>
          {option.label}
          {option.hpModifier > 0 && (
            <span className={styles.hpBadge}>+{option.hpModifier}hp</span>
          )}
          {option.costModifier > 0 && (
            <span className={styles.costBadge}>+${option.costModifier}</span>
          )}
        </span>
        {option.description && (
          <span className={styles.checkboxDescription}>{option.description}</span>
        )}
        {option.note && (
          <span className={styles.checkboxNote}>
            <Icons.info size={12} />
            {option.note}
          </span>
        )}
      </span>
    </label>
  );
}

/**
 * Main UpgradeConfigPanel Component
 * 
 * @param {boolean} compact - If true, removes outer border/container for flat design
 */
export default function UpgradeConfigPanel({
  upgradeKey,
  configOptions,
  currentConfig = {},
  onChange,
  selectedUpgrades: _selectedUpgrades = [],  // To check for dependency warnings
  compact = false,  // New: flat design without outer container
}) {
  // Handler for config changes
  const handleConfigChange = useCallback((optionKey, value) => {
    const newConfig = {
      ...currentConfig,
      [optionKey]: value,
    };
    onChange(upgradeKey, newConfig);
  }, [upgradeKey, currentConfig, onChange]);
  
  // Calculate current HP modifier for display
  const currentHpModifier = useMemo(() => 
    calculateConfigHpModifier(configOptions, currentConfig),
    [configOptions, currentConfig]
  );
  
  if (!configOptions || Object.keys(configOptions).length === 0) {
    return null;
  }
  
  // Compact mode - no outer container, just the config body
  if (compact) {
    return (
      <div className={styles.configBodyCompact}>
        {Object.entries(configOptions).map(([optionKey, option]) => {
          const value = currentConfig[optionKey] ?? option.default;
          
          if (option.type === 'radio') {
            return (
              <ConfigRadioGroup
                key={optionKey}
                optionKey={optionKey}
                option={option}
                value={value}
                onChange={handleConfigChange}
              />
            );
          }
          
          if (option.type === 'checkbox') {
            return (
              <ConfigCheckbox
                key={optionKey}
                optionKey={optionKey}
                option={option}
                value={value}
                onChange={handleConfigChange}
              />
            );
          }
          
          return null;
        })}
      </div>
    );
  }
  
  // Standard mode with full container
  return (
    <div className={styles.configPanel}>
      <div className={styles.configHeader}>
        <Icons.settings size={14} />
        <span>Configure</span>
        {currentHpModifier > 0 && (
          <span className={styles.totalModifier}>+{currentHpModifier}hp from config</span>
        )}
      </div>
      
      <div className={styles.configBody}>
        {Object.entries(configOptions).map(([optionKey, option]) => {
          const value = currentConfig[optionKey] ?? option.default;
          
          if (option.type === 'radio') {
            return (
              <ConfigRadioGroup
                key={optionKey}
                optionKey={optionKey}
                option={option}
                value={value}
                onChange={handleConfigChange}
              />
            );
          }
          
          if (option.type === 'checkbox') {
            return (
              <ConfigCheckbox
                key={optionKey}
                optionKey={optionKey}
                option={option}
                value={value}
                onChange={handleConfigChange}
              />
            );
          }
          
          return null;
        })}
      </div>
    </div>
  );
}
