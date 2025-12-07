import React from 'react';
import styles from './LoadingSpinner.module.css';

/**
 * Reusable loading spinner component with optional text
 * @param {Object} props
 * @param {string} [props.text] - Optional loading text
 * @param {string} [props.size='medium'] - Size: 'small' | 'medium' | 'large'
 * @param {boolean} [props.fullPage=false] - Whether to center in full viewport
 */
export default function LoadingSpinner({ text = 'Loading...', size = 'medium', fullPage = false }) {
  return (
    <div className={`${styles.container} ${fullPage ? styles.fullPage : ''}`}>
      <div className={`${styles.spinner} ${styles[size]}`}>
        <div className={styles.ring}></div>
        <div className={styles.ring}></div>
        <div className={styles.ring}></div>
      </div>
      {text && <p className={styles.text}>{text}</p>}
    </div>
  );
}

