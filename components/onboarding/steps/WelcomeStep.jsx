'use client';

import styles from './WelcomeStep.module.css';

/**
 * WelcomeStep Component
 * Step 1: Celebrate the user signing up!
 * 
 * This is their first impression after signing up.
 * Make them feel like they just joined something special.
 */
export default function WelcomeStep({ className }) {
  return (
    <div className={`${className || ''} ${styles.container}`}>
      {/* Brand Wordmark - At top like homepage */}
      <h1 className={styles.brand}>
        <span className={styles.brandAuto}>AUTO</span>
        <span className={styles.brandRev}>REV</span>
      </h1>
      
      {/* Content centered in remaining space */}
      <div className={styles.content}>
        {/* Celebration Message */}
        <div className={styles.celebration}>
          <h2 className={styles.headline}>
            <span className={styles.headlineAccent}>YOU'RE IN.</span>
          </h2>
          <p className={styles.subheadline}>
            Welcome to the garage.
          </p>
        </div>
      </div>
    </div>
  );
}
