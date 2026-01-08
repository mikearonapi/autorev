'use client';

/**
 * Linked Build Upgrades
 * 
 * Displays the upgrades from a linked user_project (saved build).
 * Shows what modifications will be displayed on the community post
 * based on the linked build's selected_upgrades.
 */

import { useMemo } from 'react';
import Link from 'next/link';
import { getUpgradeByKey, getCanonicalCategories } from '@/lib/upgrades.js';
import styles from './LinkedBuildUpgrades.module.css';

// Category icons and colors matching BuildModsList
const CATEGORY_INFO = {
  intake: { label: 'Intake', icon: '🌀', color: '#60a5fa' },
  exhaust: { label: 'Exhaust', icon: '💨', color: '#f97316' },
  ecu: { label: 'ECU / Tune', icon: '🖥️', color: '#a78bfa' },
  turbo: { label: 'Turbo', icon: '🔄', color: '#f43f5e' },
  supercharger: { label: 'Supercharger', icon: '⚡', color: '#fbbf24' },
  intercooler: { label: 'Intercooler', icon: '❄️', color: '#38bdf8' },
  fuel: { label: 'Fuel System', icon: '⛽', color: '#fb923c' },
  engine: { label: 'Engine', icon: '🔧', color: '#ef4444' },
  suspension: { label: 'Suspension', icon: '🏎️', color: '#22c55e' },
  brakes: { label: 'Brakes', icon: '🛑', color: '#dc2626' },
  wheels: { label: 'Wheels', icon: '⭕', color: '#94a3b8' },
  tires: { label: 'Tires', icon: '🛞', color: '#475569' },
  aero: { label: 'Aero', icon: '🪽', color: '#06b6d4' },
  interior: { label: 'Interior', icon: '🪑', color: '#8b5cf6' },
  exterior: { label: 'Exterior', icon: '🎨', color: '#ec4899' },
  other: { label: 'Other', icon: '📦', color: '#6b7280' },
};

export default function LinkedBuildUpgrades({ buildData, carSlug, carName }) {
  // Resolve upgrade keys to full upgrade objects
  const resolvedUpgrades = useMemo(() => {
    if (!buildData?.selected_upgrades) return [];
    
    const rawUpgrades = Array.isArray(buildData.selected_upgrades) 
      ? buildData.selected_upgrades 
      : buildData.selected_upgrades?.upgrades || [];
    
    return rawUpgrades.map((rawUpgrade, idx) => {
      // Could be a key string or already an object
      if (typeof rawUpgrade === 'string') {
        const upgrade = getUpgradeByKey(rawUpgrade);
        if (upgrade) {
          return {
            ...upgrade,
            key: rawUpgrade,
          };
        }
        // Fallback
        return {
          key: rawUpgrade,
          name: rawUpgrade.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          category: 'other',
        };
      }
      return rawUpgrade;
    }).filter(Boolean);
  }, [buildData?.selected_upgrades]);

  // Get project parts
  const projectParts = buildData?.project_parts || [];

  // Group upgrades by category
  const upgradesByCategory = useMemo(() => {
    const grouped = {};
    resolvedUpgrades.forEach(upgrade => {
      const cat = upgrade.category || 'other';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(upgrade);
    });
    return grouped;
  }, [resolvedUpgrades]);

  const hasNoLinkedBuild = !buildData;
  const hasNoUpgrades = resolvedUpgrades.length === 0 && projectParts.length === 0;

  if (hasNoLinkedBuild) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>🔗</span>
          <h4>No Linked Build</h4>
          <p>
            This community post isn't linked to a saved build from your garage.
            Use the "Parts/Mods" tab to manually add your modifications.
          </p>
          {carSlug && (
            <Link href={`/tuning-shop/${carSlug}`} className={styles.linkBtn}>
              Create a Build for {carName || 'this car'}
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (hasNoUpgrades) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>🔧</span>
          <h4>No Upgrades Selected</h4>
          <p>
            Your linked build doesn't have any upgrades selected yet.
            Visit the Tuning Shop to add modifications to your build.
          </p>
          {carSlug && (
            <Link href={`/tuning-shop/${carSlug}`} className={styles.linkBtn}>
              Configure Build
            </Link>
          )}
        </div>
      </div>
    );
  }

  const totalHpGain = buildData.total_hp_gain || 0;
  const finalHp = buildData.final_hp || 0;

  return (
    <div className={styles.container}>
      {/* Build Summary */}
      <div className={styles.buildSummary}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryValue}>{resolvedUpgrades.length}</span>
          <span className={styles.summaryLabel}>Upgrades</span>
        </div>
        {totalHpGain > 0 && (
          <div className={styles.summaryItem}>
            <span className={styles.summaryValue}>+{totalHpGain}</span>
            <span className={styles.summaryLabel}>HP Gain</span>
          </div>
        )}
        {finalHp > 0 && (
          <div className={styles.summaryItem}>
            <span className={styles.summaryValue}>{finalHp}</span>
            <span className={styles.summaryLabel}>Final HP</span>
          </div>
        )}
        {projectParts.length > 0 && (
          <div className={styles.summaryItem}>
            <span className={styles.summaryValue}>{projectParts.length}</span>
            <span className={styles.summaryLabel}>Parts</span>
          </div>
        )}
      </div>

      <div className={styles.infoBox}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
        <p>
          These upgrades come from your saved build and will be automatically displayed 
          on your community post. Update your build in the Tuning Shop to change this list.
        </p>
      </div>

      {/* Upgrades by Category */}
      <div className={styles.categoryList}>
        {Object.entries(upgradesByCategory).map(([category, upgrades]) => {
          const info = CATEGORY_INFO[category] || CATEGORY_INFO.other;
          return (
            <div key={category} className={styles.categorySection}>
              <div className={styles.categoryHeader} style={{ '--category-color': info.color }}>
                <span className={styles.categoryIcon}>{info.icon}</span>
                <span className={styles.categoryName}>{info.label}</span>
                <span className={styles.categoryCount}>{upgrades.length}</span>
              </div>
              <div className={styles.upgradesList}>
                {upgrades.map((upgrade, idx) => (
                  <div key={upgrade.key || idx} className={styles.upgradeItem}>
                    <span className={styles.upgradeName}>{upgrade.name}</span>
                    {(upgrade.hpGain || upgrade.metricChanges?.hpGain) > 0 && (
                      <span className={styles.upgradeHp}>
                        +{upgrade.hpGain || upgrade.metricChanges?.hpGain}hp
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Project Parts */}
      {projectParts.length > 0 && (
        <div className={styles.projectPartsSection}>
          <h4 className={styles.sectionTitle}>Selected Products</h4>
          <p className={styles.sectionSubtitle}>Specific parts you've selected for your build</p>
          <div className={styles.partsList}>
            {projectParts.map((part, idx) => (
              <div key={part.id || idx} className={styles.partItem}>
                <div className={styles.partMain}>
                  <span className={styles.partName}>{part.part_name}</span>
                  {part.brand_name && (
                    <span className={styles.partBrand}>{part.brand_name}</span>
                  )}
                </div>
                {part.price_cents && (
                  <span className={styles.partPrice}>
                    ${(part.price_cents / 100).toLocaleString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Link to Tuning Shop */}
      {carSlug && (
        <div className={styles.actionBox}>
          <p>Want to update your build configuration?</p>
          <Link href={`/tuning-shop/${carSlug}`} className={styles.actionBtn}>
            Edit in Tuning Shop →
          </Link>
        </div>
      )}
    </div>
  );
}

