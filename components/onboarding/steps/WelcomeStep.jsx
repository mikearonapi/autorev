'use client';

import Image from 'next/image';
import { LOGO_TRANSPARENT } from '@/lib/brandLogos';
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
      {/* Brand Logo - At top like homepage */}
      <div className={styles.brandContainer}>
        <Image
          src={LOGO_TRANSPARENT}
          alt="AutoRev"
          width={200}
          height={133}
          className={styles.brandLogo}
          priority
          unoptimized // CDN-hosted, already optimized
        />
      </div>
      
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
