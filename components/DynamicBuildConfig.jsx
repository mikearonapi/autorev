'use client';

/**
 * DynamicBuildConfig Component
 * 
 * Clean, flat design for configuring selected upgrades.
 * Uses spacing and typography instead of nested boxes.
 */

import { useMemo } from 'react';

import EmptyState from '@/components/ui/EmptyState';
import { Icons } from '@/components/ui/Icons';
import { getUpgradeDetail } from '@/data/upgradeEducation';

import styles from './DynamicBuildConfig.module.css';
import UpgradeConfigPanel, { getDefaultConfig } from './UpgradeConfigPanel';


/**
 * Get upgrade data by key using the upgradeEducation lookup
 */
function getUpgradeByKey(upgradeKey) {
  return getUpgradeDetail(upgradeKey);
}

/**
 * DynamicBuildConfig Component
 */
export default function DynamicBuildConfig({
  selectedUpgrades = [],
  upgradeConfigs = {},
  onConfigChange,
}) {
  // Get all selected upgrades with their data
  const allSelectedUpgrades = useMemo(() => {
    return selectedUpgrades.map(upgradeKey => {
      const upgrade = getUpgradeByKey(upgradeKey);
      if (upgrade) {
        const hasConfig = upgrade.configOptions && Object.keys(upgrade.configOptions).length > 0;
        return {
          key: upgradeKey,
          name: upgrade.name,
          configOptions: upgrade.configOptions,
          hasConfig,
        };
      }
      // Fallback for upgrades not in upgradeEducation
      return {
        key: upgradeKey,
        name: upgradeKey.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        configOptions: null,
        hasConfig: false,
      };
    });
  }, [selectedUpgrades]);

  // Count how many have configuration options
  const configurableCount = allSelectedUpgrades.filter(u => u.hasConfig).length;

  // If no upgrades selected, show helpful message
  if (allSelectedUpgrades.length === 0) {
    return (
      <EmptyState
        icon={Icons.info}
        title="No Upgrades Selected"
        description="Select upgrades from the categories above to start building."
        variant="inline"
      />
    );
  }

  return (
    <div className={styles.dynamicConfigContainer}>
      {/* Simple summary line */}
      <div className={styles.configSummary}>
        <span className={styles.configSummaryText}>
          {allSelectedUpgrades.length} upgrade{allSelectedUpgrades.length !== 1 ? 's' : ''}
        </span>
        {configurableCount > 0 && (
          <span className={styles.configSummaryCount}>
            {configurableCount} to configure
          </span>
        )}
      </div>
      
      <div className={styles.configList}>
        {allSelectedUpgrades.map(upgrade => {
          if (upgrade.hasConfig) {
            const currentConfig = upgradeConfigs[upgrade.key] || getDefaultConfig(upgrade.configOptions);
            
            return (
              <div key={upgrade.key} className={styles.upgradeItem}>
                <div className={styles.upgradeHeader}>
                  <span className={styles.upgradeName}>{upgrade.name}</span>
                  <span className={styles.upgradeCheck}>
                    <Icons.check size={14} />
                  </span>
                </div>
                
                <div className={styles.upgradeConfig}>
                  <UpgradeConfigPanel
                    upgradeKey={upgrade.key}
                    configOptions={upgrade.configOptions}
                    currentConfig={currentConfig}
                    onChange={onConfigChange}
                    selectedUpgrades={selectedUpgrades}
                    compact={true}
                  />
                </div>
              </div>
            );
          } else {
            // Upgrade without configuration options
            return (
              <div key={upgrade.key} className={styles.upgradeSimpleCard}>
                <span className={styles.upgradeName}>{upgrade.name}</span>
                <span className={styles.selectedBadge}>
                  <Icons.check size={12} />
                </span>
              </div>
            );
          }
        })}
      </div>
      
      {configurableCount > 0 && (
        <div className={styles.configFooter}>
          <Icons.info size={14} />
          <span>Configure options for more accurate estimates.</span>
        </div>
      )}
    </div>
  );
}
