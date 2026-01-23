'use client';

/**
 * InstallPathSelector Component
 * 
 * "Choose Your Own Adventure" selection for installation:
 * - DIY: Self-installation with tools and video guidance
 * - Service Center: Find a professional shop nearby
 */

import React from 'react';
import { Icons } from '@/components/ui/Icons';
import styles from './InstallPathSelector.module.css';

/**
 * InstallPathSelector - Two prominent buttons for path selection
 * 
 * @param {'diy' | 'service' | null} activePath - Currently selected path
 * @param {function} onPathSelect - Callback when path is selected
 */
export default function InstallPathSelector({ activePath, onPathSelect }) {
  return (
    <div className={styles.container}>
      <h3 className={styles.title}>How would you like to proceed?</h3>
      
      <div className={styles.buttonGroup}>
        {/* DIY Button */}
        <button
          className={`${styles.pathButton} ${styles.diyButton} ${activePath === 'diy' ? styles.active : ''}`}
          onClick={() => onPathSelect(activePath === 'diy' ? null : 'diy')}
          aria-pressed={activePath === 'diy'}
        >
          <div className={styles.buttonIcon}>
            <Icons.wrench size={28} />
          </div>
          <div className={styles.buttonContent}>
            <span className={styles.buttonTitle}>Do It Yourself</span>
            <span className={styles.buttonDescription}>
              Tools, videos, and step-by-step guidance
            </span>
          </div>
          <div className={styles.buttonIndicator}>
            {activePath === 'diy' ? (
              <Icons.check size={20} />
            ) : (
              <Icons.chevronRight size={20} />
            )}
          </div>
        </button>
        
        {/* Service Center Button */}
        <button
          className={`${styles.pathButton} ${styles.serviceButton} ${activePath === 'service' ? styles.active : ''}`}
          onClick={() => onPathSelect(activePath === 'service' ? null : 'service')}
          aria-pressed={activePath === 'service'}
        >
          <div className={styles.buttonIcon}>
            <Icons.location size={28} />
          </div>
          <div className={styles.buttonContent}>
            <span className={styles.buttonTitle}>Find a Service Center</span>
            <span className={styles.buttonDescription}>
              Locate reputable shops near you
            </span>
          </div>
          <div className={styles.buttonIndicator}>
            {activePath === 'service' ? (
              <Icons.check size={20} />
            ) : (
              <Icons.chevronRight size={20} />
            )}
          </div>
        </button>
      </div>
    </div>
  );
}
