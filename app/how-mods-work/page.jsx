'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import styles from './page.module.css';
import { buildGoals, buildPaths, getUpgradeEducation, upgradeCategories, upgradeDetails, systems, nodes, edges } from '@/lib/educationData';

// Blob URL for hero image
const BLOB_BASE = 'https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com';
const heroImageUrl = `${BLOB_BASE}/pages/education/hero.webp`;

// =============================================================================
// ICONS
// =============================================================================
const Icons = {
  bolt: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  car: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/>
      <circle cx="6.5" cy="16.5" r="2.5"/>
      <circle cx="16.5" cy="16.5" r="2.5"/>
    </svg>
  ),
  flag: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
      <line x1="4" y1="22" x2="4" y2="15"/>
    </svg>
  ),
  brake: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="4"/>
    </svg>
  ),
  sound: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
    </svg>
  ),
  thermometer: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
    </svg>
  ),
  compass: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
    </svg>
  ),
  book: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  ),
  grid: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/>
      <rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  arrowRight: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  chevronRight: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  chevronDown: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  check: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  alert: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  link: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  ),
  info: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
  close: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  dollar: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  wrench: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  clock: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  // System Icons
  engine: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2h4"/>
      <path d="M12 14v-4"/>
      <path d="M4 10h16"/>
      <path d="M4 10a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2"/>
      <path d="M6 10V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4"/>
    </svg>
  ),
  fuel: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 22v-8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8"/>
      <path d="M6 12V7a2 2 0 0 1 2-2h3"/>
      <path d="M18 12V7a2 2 0 0 0-2-2h-3"/>
      <path d="M12 5V2"/>
      <path d="M12 17v-2"/>
    </svg>
  ),
  fire: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
    </svg>
  ),
  wind: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.8 19.6A2 2 0 1 0 14 16H2"/>
      <path d="M17.5 8a2.5 2.5 0 1 1 2 4H2"/>
      <path d="M9.8 4.4A2 2 0 1 1 11 8H2"/>
    </svg>
  ),
  fan: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 12m-10 0a10 10 0 1 0 20 0a10 10 0 1 0 -20 0"/>
      <path d="M12 12c2.5 -2.5 2.5 -7 0 -7"/>
      <path d="M12 12c2.5 2.5 7 2.5 7 0"/>
      <path d="M12 12c-2.5 2.5 -2.5 7 0 7"/>
      <path d="M12 12c-2.5 -2.5 -7 -2.5 -7 0"/>
    </svg>
  ),
  gears: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06 .06a2 2 0 0 1 0 2.83 2 2 0 0 1 -2.83 0l-.06 -.06a1.65 1.65 0 0 0 -1.82 -.33 1.65 1.65 0 0 0 -1 1.51V21a2 2 0 0 1 -2 2 2 2 0 0 1 -2 -2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0 -1.82 .33l-.06 .06a2 2 0 0 1 -2.83 0 2 2 0 0 1 0 -2.83l.06 -.06a1.65 1.65 0 0 0 .33 -1.82 1.65 1.65 0 0 0 -1.51 -1H3a2 2 0 0 1 -2 -2 2 2 0 0 1 2 -2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0 -.33 -1.82l-.06 -.06a2 2 0 0 1 0 -2.83 2 2 0 0 1 2.83 0l.06 .06a1.65 1.65 0 0 0 1.82 .33H9a1.65 1.65 0 0 0 1 -1.51V3a2 2 0 0 1 2 -2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82 -.33l.06 -.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06 .06a1.65 1.65 0 0 0 -.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1 -2 2h-.09a1.65 1.65 0 0 0 -1.51 1z"/>
    </svg>
  ),
  disc: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 2a10 10 0 0 1 10 10"/>
    </svg>
  ),
  spring: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 2v3"/>
      <path d="M5 2v3"/>
      <path d="M5 19v3"/>
      <path d="M19 19v3"/>
      <path d="M5 5h14"/>
      <path d="M5 19h14"/>
      <path d="M5 9h14"/>
      <path d="M5 15h14"/>
      <path d="M9 5v14"/>
      <path d="M15 5v14"/>
    </svg>
  ),
  wheel: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v4"/>
      <path d="M12 18v4"/>
      <path d="M2 12h4"/>
      <path d="M18 12h4"/>
      <path d="M4.93 4.93l2.83 2.83"/>
      <path d="M16.24 16.24l2.83 2.83"/>
      <path d="M19.07 4.93l-2.83 2.83"/>
      <path d="M7.76 16.24l-2.83 2.83"/>
    </svg>
  ),
  frame: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2"/>
      <path d="M6 18v2"/>
      <path d="M18 18v2"/>
      <path d="M6 4v2"/>
      <path d="M18 4v2"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
    </svg>
  ),
  air: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8h12"/>
      <path d="M4 12h16"/>
      <path d="M5 16h14"/>
      <path d="M12 3v1"/>
      <path d="M12 20v1"/>
    </svg>
  ),
  chip: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" ry="2"/>
      <rect x="9" y="9" width="6" height="6"/>
      <line x1="9" y1="1" x2="9" y2="4"/>
      <line x1="15" y1="1" x2="15" y2="4"/>
      <line x1="9" y1="20" x2="9" y2="23"/>
      <line x1="15" y1="20" x2="15" y2="23"/>
      <line x1="20" y1="9" x2="23" y2="9"/>
      <line x1="20" y1="14" x2="23" y2="14"/>
      <line x1="1" y1="9" x2="4" y2="9"/>
      <line x1="1" y1="14" x2="4" y2="14"/>
    </svg>
  ),
  shield: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  feather: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/>
      <line x1="16" y1="8" x2="2" y2="22"/>
      <line x1="17.5" y1="15" x2="9" y2="15"/>
    </svg>
  ),
};

const iconMap = {
  bolt: Icons.bolt,
  car: Icons.car,
  flag: Icons.flag,
  brake: Icons.brake,
  sound: Icons.sound,
  thermometer: Icons.thermometer,
  // System Mappings
  powertrain: Icons.engine,
  fuel: Icons.fuel,
  ignition: Icons.fire,
  exhaust: Icons.wind,
  induction: Icons.fan,
  drivetrain: Icons.gears,
  brakeSystem: Icons.disc,
  suspension: Icons.spring,
  wheels: Icons.wheel,
  chassis: Icons.frame,
  aero: Icons.air,
  electronics: Icons.chip,
  cooling: Icons.thermometer,
  safety: Icons.shield,
  // Category Mappings (Modifications)
  power: Icons.engine,
  forcedInduction: Icons.fan,
  // exhaust is already mapped
  // suspension is already mapped
  brakes: Icons.disc,
  // wheels is already mapped
  // cooling is already mapped
  aerodynamics: Icons.air,
  // drivetrain is already mapped
  // safety is already mapped
  weightReduction: Icons.feather,
  engineSwap: Icons.engine,
};

// =============================================================================
// GOAL CARD COMPONENT
// =============================================================================
function GoalCard({ goal, isActive, onClick }) {
  const IconComponent = iconMap[goal.icon] || Icons.bolt;
  
  return (
    <button
      className={`${styles.goalCard} ${isActive ? styles.goalCardActive : ''}`}
      onClick={onClick}
      style={{ '--goal-color': goal.color }}
    >
      <div className={styles.goalCardIcon}>
        <IconComponent size={28} />
      </div>
      <h3 className={styles.goalCardTitle}>{goal.name}</h3>
      <p className={styles.goalCardDesc}>{goal.description}</p>
      <span className={styles.goalCardTagline}>{goal.tagline}</span>
    </button>
  );
}

// =============================================================================
// BUILD PATH STAGE COMPONENT
// =============================================================================
function BuildPathStage({ stage, goalColor, upgradesData, onUpgradeClick }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className={`${styles.stage} ${isExpanded ? styles.stageExpanded : ''}`}>
      <button 
        className={styles.stageHeader}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={styles.stageNumber} style={{ backgroundColor: goalColor }}>
          {stage.stage}
        </div>
        <div className={styles.stageInfo}>
          <h4 className={styles.stageName}>{stage.name}</h4>
          <p className={styles.stageDescription}>{stage.description}</p>
        </div>
        <div className={styles.stageMeta}>
          <span className={styles.stageBudget}>{stage.budget}</span>
          <span className={styles.stageGains}>{stage.expectedGains}</span>
        </div>
        <span className={styles.stageExpand}>
          {isExpanded ? <Icons.chevronDown size={20} /> : <Icons.chevronRight size={20} />}
        </span>
      </button>
      
      {isExpanded && (
        <div className={styles.stageContent}>
          {/* Concepts - shown contextually */}
          {stage.concepts && stage.concepts.length > 0 && (
            <div className={styles.stageConcepts}>
              {stage.concepts.map((concept, idx) => (
                <div 
                  key={idx} 
                  className={`${styles.conceptBadge} ${styles[`concept${concept.type}`]}`}
                >
                  {concept.type === 'REQUIRES' && <Icons.link size={14} />}
                  {concept.type === 'STRESSES' && <Icons.alert size={14} />}
                  {concept.type === 'PAIRS_WELL' && <Icons.check size={14} />}
                  {concept.type === 'INVALIDATES' && <Icons.info size={14} />}
                  {concept.type === 'COMPROMISES' && <Icons.alert size={14} />}
                  <span>{concept.text}</span>
                </div>
              ))}
            </div>
          )}
          
          {/* Prerequisites */}
          {stage.prerequisites && stage.prerequisites.length > 0 && (
            <div className={styles.stagePrereqs}>
              <strong>Before you start:</strong>
              <ul>
                {stage.prerequisites.map((prereq, idx) => (
                  <li key={idx}>{prereq}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Upgrades in this stage */}
          <div className={styles.stageUpgrades}>
            <h5>Upgrades in this stage:</h5>
            <div className={styles.upgradesList}>
              {stage.upgrades.map(upgradeKey => {
                const upgrade = upgradesData[upgradeKey];
                if (!upgrade) return null;
                
                const isPrimary = upgradeKey === stage.primaryUpgrade;
                
                return (
                  <button
                    key={upgradeKey}
                    className={`${styles.upgradeChip} ${isPrimary ? styles.upgradeChipPrimary : ''}`}
                    onClick={() => onUpgradeClick(upgrade)}
                  >
                    <span className={styles.upgradeName}>{upgrade.name}</span>
                    {upgrade.cost && (
                      <span className={styles.upgradeCost}>{upgrade.cost.range}</span>
                    )}
                    {isPrimary && <span className={styles.upgradeBadge}>Key Upgrade</span>}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Considerations */}
          {stage.considerations && stage.considerations.length > 0 && (
            <div className={styles.stageConsiderations}>
              <h5>Keep in mind:</h5>
              <ul>
                {stage.considerations.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// BUILD PATH COMPONENT
// =============================================================================
function BuildPath({ path, upgradesData, onUpgradeClick }) {
  return (
    <div className={styles.buildPath}>
      <div className={styles.pathHeader} style={{ '--path-color': path.goal.color }}>
        <div className={styles.pathIcon}>
          {iconMap[path.goal.icon] && React.createElement(iconMap[path.goal.icon], { size: 32 })}
        </div>
        <div className={styles.pathInfo}>
          <h3 className={styles.pathTitle}>{path.goal.name} Build Path</h3>
          <p className={styles.pathSubtitle}>{path.goal.description}</p>
        </div>
      </div>
      
      <div className={styles.pathStages}>
        {path.stages.map((stage, idx) => (
          <BuildPathStage
            key={idx}
            stage={stage}
            goalColor={path.goal.color}
            upgradesData={upgradesData}
            onUpgradeClick={onUpgradeClick}
          />
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// UPGRADE DETAIL MODAL
// =============================================================================
function UpgradeDetailModal({ upgrade, onClose }) {
  if (!upgrade) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalPanel} onClick={e => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose}>
          <Icons.close size={24} />
        </button>

        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{upgrade.name}</h2>
          <div className={styles.modalMeta}>
            {upgrade.cost && (
              <span className={styles.modalMetaItem}>
                <Icons.dollar size={16} />
                {upgrade.cost.range}
              </span>
            )}
            {upgrade.difficulty && (
              <span className={styles.modalMetaItem}>
                <Icons.wrench size={16} />
                {upgrade.difficulty}
              </span>
            )}
            {upgrade.installTime && (
              <span className={styles.modalMetaItem}>
                <Icons.clock size={16} />
                {upgrade.installTime}
              </span>
            )}
          </div>
        </div>

        <div className={styles.modalBody}>
          {upgrade.fullDescription && (
            <section className={styles.modalSection}>
              <h3>What It Is</h3>
              <p>{upgrade.fullDescription}</p>
            </section>
          )}

          {upgrade.howItWorks && (
            <section className={styles.modalSection}>
              <h3>How It Works</h3>
              <p>{upgrade.howItWorks}</p>
            </section>
          )}

          {upgrade.expectedGains && Object.keys(upgrade.expectedGains).length > 0 && (
            <section className={styles.modalSection}>
              <h3>Expected Gains</h3>
              <div className={styles.gainsGrid}>
                {upgrade.expectedGains.hp && (
                  <div className={styles.gainItem}>
                    <span className={styles.gainLabel}>Power</span>
                    <span className={styles.gainValue}>{upgrade.expectedGains.hp}</span>
                  </div>
                )}
                {upgrade.expectedGains.torque && (
                  <div className={styles.gainItem}>
                    <span className={styles.gainLabel}>Torque</span>
                    <span className={styles.gainValue}>{upgrade.expectedGains.torque}</span>
                  </div>
                )}
                {upgrade.expectedGains.handling && (
                  <div className={styles.gainItem}>
                    <span className={styles.gainLabel}>Handling</span>
                    <span className={styles.gainValue}>{upgrade.expectedGains.handling}</span>
                  </div>
                )}
              </div>
              {upgrade.expectedGains.note && (
                <p className={styles.gainNote}>{upgrade.expectedGains.note}</p>
              )}
            </section>
          )}

          {(upgrade.pros?.length > 0 || upgrade.cons?.length > 0) && (
            <section className={styles.modalSection}>
              <div className={styles.prosConsGrid}>
                {upgrade.pros?.length > 0 && (
                  <div className={styles.prosColumn}>
                    <h4><Icons.check size={16} /> Pros</h4>
                    <ul>
                      {upgrade.pros.map((pro, i) => <li key={i}>{pro}</li>)}
                    </ul>
                  </div>
                )}
                {upgrade.cons?.length > 0 && (
                  <div className={styles.consColumn}>
                    <h4><Icons.alert size={16} /> Cons</h4>
                    <ul>
                      {upgrade.cons.map((con, i) => <li key={i}>{con}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}

          {upgrade.bestFor?.length > 0 && (
            <section className={styles.modalSection}>
              <h3>Best For</h3>
              <div className={styles.tagList}>
                {upgrade.bestFor.map((item, i) => (
                  <span key={i} className={styles.tag}>{item}</span>
                ))}
              </div>
            </section>
          )}

          {upgrade.worksWellWith?.length > 0 && (
            <section className={styles.modalSection}>
              <h3>Works Well With</h3>
              <div className={styles.tagList}>
                {upgrade.worksWellWith.map((item, i) => (
                  <span key={i} className={styles.tagSecondary}>{item}</span>
                ))}
              </div>
            </section>
          )}

          {upgrade.considerations && (
            <section className={styles.modalSection}>
              <h3>Important Considerations</h3>
              <p className={styles.considerations}>{upgrade.considerations}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// EXPLORE MODE - CATEGORY BROWSER
// =============================================================================
function ExploreMode({ groupedUpgrades, onUpgradeClick }) {
  const [selectedCategory, setSelectedCategory] = useState('power');
  const currentCategory = groupedUpgrades[selectedCategory];

  // Map category keys to icon keys
  const categoryIconMap = {
    power: 'power',
    forcedInduction: 'forcedInduction',
    exhaust: 'exhaust',
    suspension: 'suspension',
    brakes: 'brakes',
    wheels: 'wheels',
    cooling: 'cooling',
    aerodynamics: 'aerodynamics',
    drivetrain: 'drivetrain',
    safety: 'safety',
    weightReduction: 'weightReduction',
    engineSwap: 'engineSwap',
  };

  return (
    <div className={styles.exploreMode}>
      <div className={styles.systemsHeader}>
        <h2>Learn About Modifications</h2>
        <p>
          Explore our complete encyclopedia of performance parts. 
          Understand what each upgrade does and how it improves your car.
        </p>
      </div>

      <div className={styles.exploreLayout}>
        <aside className={styles.exploreSidebar}>
          <h3 className={styles.sidebarTitle}>Categories</h3>
          <nav className={styles.categoryNav}>
            {Object.values(upgradeCategories).map(cat => {
              const isActive = selectedCategory === cat.key;
              const iconKey = categoryIconMap[cat.key] || 'bolt';
              const IconComponent = iconMap[iconKey] || Icons.bolt;

              return (
                <button
                  key={cat.key}
                  className={`${styles.categoryNavItem} ${isActive ? styles.categoryNavItemActive : ''}`}
                  onClick={() => setSelectedCategory(cat.key)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                >
                  <IconComponent size={18} />
                  {cat.name}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className={styles.exploreMain}>
          {currentCategory && (
            <>
              <div className={styles.categoryHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                  <div 
                    className={styles.systemCardIcon} 
                    style={{ 
                      backgroundColor: currentCategory.color || '#1a4d6e', 
                      width: '48px', 
                      height: '48px', 
                      borderRadius: '12px',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {(() => {
                      const iconKey = categoryIconMap[currentCategory.key] || 'bolt';
                      const IconComponent = iconMap[iconKey] || Icons.bolt;
                      return <IconComponent size={24} />;
                    })()}
                  </div>
                  <h3 className={styles.categoryTitle} style={{ marginBottom: 0 }}>{currentCategory.name}</h3>
                </div>
                <p className={styles.categoryDescription}>{currentCategory.description}</p>
              </div>
              
              <div className={styles.upgradesGrid}>
                {currentCategory.upgrades?.map(upgrade => (
                  <button
                    key={upgrade.key}
                    className={styles.upgradeCard}
                    onClick={() => onUpgradeClick(upgrade)}
                  >
                    <div className={styles.cardHeader}>
                      <h4>{upgrade.name}</h4>
                      {upgrade.cost && <span className={styles.cardCost}>{upgrade.cost.range}</span>}
                    </div>
                    <p className={styles.cardDescription}>{upgrade.shortDescription}</p>
                    <div className={styles.cardFooter}>
                      {upgrade.difficulty && (
                        <span className={styles.cardDifficulty}>
                          <Icons.wrench size={12} /> {upgrade.difficulty}
                        </span>
                      )}
                      <span className={styles.cardArrow}>
                        Learn more <Icons.chevronRight size={14} />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

// =============================================================================
// SYSTEM DETAIL MODAL
// =============================================================================
function SystemDetailModal({ system, nodes, onClose }) {
  if (!system) return null;

  const systemNodes = Object.values(nodes).filter(n => n.system === system.key);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalPanel} onClick={e => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose}>
          <Icons.close size={24} />
        </button>

        <div className={styles.modalHeader}>
          <div className={styles.systemModalTitleRow}>
            <div className={styles.systemModalIcon} style={{ backgroundColor: system.color }}>
              <Icons.bolt size={24} />
            </div>
            <div>
              <h2 className={styles.modalTitle} style={{ marginBottom: '0.25rem' }}>{system.name}</h2>
              <p className={styles.modalSubtitle}>{system.description}</p>
            </div>
          </div>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.componentsGrid}>
            {systemNodes.map(node => (
              <div key={node.key} className={styles.componentCard}>
                <h4 className={styles.componentName}>{node.name}</h4>
                <p className={styles.componentDesc}>{node.description}</p>
                {node.unit && (
                  <span className={styles.componentUnit}>Measured in: {node.unit}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// VEHICLE SYSTEMS REFERENCE
// =============================================================================
function VehicleSystemsReference() {
  const [selectedSystemKey, setSelectedSystemKey] = useState('powertrain');
  const systemsList = Object.values(systems);
  
  // Map system keys to icon keys
  const systemIconMap = {
    powertrain: 'powertrain',
    fuel: 'fuel',
    ignition: 'ignition',
    exhaust: 'exhaust',
    induction: 'induction',
    drivetrain: 'drivetrain',
    brakes: 'brakeSystem',
    suspension: 'suspension',
    tires_wheels: 'wheels',
    chassis: 'chassis',
    aerodynamics: 'aero',
    electronics: 'electronics',
    cooling: 'cooling',
    safety: 'safety',
  };

  const selectedSystem = systems[selectedSystemKey];
  const systemNodes = selectedSystem ? Object.values(nodes).filter(n => n.system === selectedSystem.key) : [];

  return (
    <div className={styles.systemsReference}>
      <div className={styles.systemsHeader}>
        <h2>Vehicle Systems Reference</h2>
        <p>
          Understand how your car works as an interconnected system. 
          Every modification affects multiple components.
        </p>
        <div className={styles.systemsStats}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{systemsList.length}</span>
            <span className={styles.statLabel}>Systems</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{Object.keys(nodes).length}</span>
            <span className={styles.statLabel}>Components</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{edges.length}+</span>
            <span className={styles.statLabel}>Relationships</span>
          </div>
        </div>
      </div>
      
      <div className={styles.exploreLayout}>
        <aside className={styles.exploreSidebar}>
          <h3 className={styles.sidebarTitle}>Systems</h3>
          <nav className={styles.categoryNav}>
            {systemsList.map(system => {
              const isActive = selectedSystemKey === system.key;
              const iconKey = systemIconMap[system.key] || 'bolt';
              const IconComponent = iconMap[iconKey] || Icons.bolt;

              return (
                <button
                  key={system.key}
                  className={`${styles.categoryNavItem} ${isActive ? styles.categoryNavItemActive : ''}`}
                  onClick={() => setSelectedSystemKey(system.key)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                >
                  <IconComponent size={18} />
                  {system.name}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className={styles.exploreMain}>
          {selectedSystem && (
            <>
              <div className={styles.categoryHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                  <div 
                    className={styles.systemCardIcon} 
                    style={{ 
                      backgroundColor: selectedSystem.color, 
                      width: '48px', 
                      height: '48px', 
                      borderRadius: '12px',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {(() => {
                      const iconKey = systemIconMap[selectedSystem.key] || 'bolt';
                      const IconComponent = iconMap[iconKey] || Icons.bolt;
                      return <IconComponent size={24} />;
                    })()}
                  </div>
                  <h3 className={styles.categoryTitle} style={{ marginBottom: 0 }}>{selectedSystem.name}</h3>
                </div>
                <p className={styles.categoryDescription}>{selectedSystem.description}</p>
              </div>
              
              <div className={styles.componentsGrid}>
                {systemNodes.map(node => (
                  <div key={node.key} className={styles.componentCard}>
                    <h4 className={styles.componentName}>{node.name}</h4>
                    <p className={styles.componentDesc}>{node.description}</p>
                    {node.unit && (
                      <span className={styles.componentUnit}>Measured in: {node.unit}</span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================
export default function EducationPage() {
  const [viewMode, setViewMode] = useState('goals'); // 'goals' | 'explore' | 'reference'
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [selectedUpgrade, setSelectedUpgrade] = useState(null);
  const [groupedUpgrades, setGroupedUpgrades] = useState({});
  const [dataSource, setDataSource] = useState('loading');
  
  const buildPathRef = useRef(null);
  
  // Fetch data on mount
  useEffect(() => {
    async function loadData() {
      const result = await getUpgradeEducation();
      setGroupedUpgrades(result.data);
      setDataSource(result.source);
    }
    loadData();
  }, []);
  
  // Handle goal selection
  const handleGoalSelect = (goalKey) => {
    setSelectedGoal(goalKey);
    setViewMode('goals');
    // Scroll to build path
    setTimeout(() => {
      buildPathRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleUpgradeClick = (upgrade) => {
    setSelectedUpgrade(upgrade);
  };
  
  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroImageWrapper}>
          <Image
            src={heroImageUrl}
            alt="Understanding car modifications and performance upgrades"
            fill
            priority
            quality={85}
            className={styles.heroImage}
            sizes="100vw"
          />
        </div>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Build Smarter,<br />
            <span className={styles.titleAccent}>Not Harder</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Every modification affects your car as a system. Learn what upgrades actually do, 
            which ones work together, and how to plan builds that make sense.
          </p>
        </div>
      </section>

      {/* Navigation Mode Selector */}
      <section className={styles.modeSelector}>
        <div className={styles.modeSelectorInner}>
          <button
            className={`${styles.modeBtn} ${viewMode === 'goals' ? styles.modeBtnActive : ''}`}
            onClick={() => setViewMode('goals')}
          >
            <Icons.flag size={18} />
            Build Paths
          </button>
          <button
            className={`${styles.modeBtn} ${viewMode === 'explore' ? styles.modeBtnActive : ''}`}
            onClick={() => setViewMode('explore')}
          >
            <Icons.compass size={18} />
            Modifications
          </button>
          <button
            className={`${styles.modeBtn} ${viewMode === 'reference' ? styles.modeBtnActive : ''}`}
            onClick={() => setViewMode('reference')}
          >
            <Icons.grid size={18} />
            Systems Reference
          </button>
        </div>
      </section>

      {/* Goal Selection - Always visible in goals mode */}
      {viewMode === 'goals' && (
        <section className={styles.goalsSection}>
          <div className={styles.container}>
            <div className={styles.goalsHeader}>
              <h2 className={styles.goalsTitle}>What Do You Want to Achieve?</h2>
              <p className={styles.goalsSubtitle}>
                Select your goal and we&apos;ll show you the path to get there
              </p>
            </div>
            
            <div className={styles.goalsGrid}>
              {Object.values(buildGoals).map(goal => (
                <GoalCard
                  key={goal.key}
                  goal={goal}
                  isActive={selectedGoal === goal.key}
                  onClick={() => handleGoalSelect(goal.key)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Build Path Display */}
      {viewMode === 'goals' && selectedGoal && buildPaths[selectedGoal] && (
        <section ref={buildPathRef} className={styles.buildPathSection}>
          <div className={styles.container}>
            <BuildPath
              path={buildPaths[selectedGoal]}
              upgradesData={upgradeDetails}
              onUpgradeClick={handleUpgradeClick}
            />
          </div>
        </section>
      )}

      {/* Explore Mode */}
      {viewMode === 'explore' && (
        <section className={styles.exploreSection}>
          <div className={styles.container}>
            <ExploreMode
              groupedUpgrades={groupedUpgrades}
              onUpgradeClick={handleUpgradeClick}
            />
          </div>
        </section>
      )}

      {/* Vehicle Systems Reference */}
      {viewMode === 'reference' && (
        <section className={styles.referenceSection}>
          <div className={styles.container}>
            <VehicleSystemsReference />
          </div>
        </section>
      )}


      {/* Upgrade Detail Modal */}
      {selectedUpgrade && (
        <UpgradeDetailModal
          upgrade={selectedUpgrade}
          onClose={() => setSelectedUpgrade(null)}
        />
      )}
    </div>
  );
}
