'use client';

import styles from './MethodologyStrip.module.css';

/**
 * MethodologyStrip Component
 * 
 * A subtle, transparent explanation of how we research and validate car data.
 * Lists expert channels discretely while emphasizing real ownership experience.
 */

const expertChannels = [
  'Throttle House',
  'SavageGeese',
  'carwow',
  'Doug DeMuro',
  'The Smoking Tire',
  'Car and Driver',
  'MotorTrend',
  'Everyday Driver'
];

export default function MethodologyStrip() {
  return (
    <section className={styles.strip}>
      <div className={styles.container}>
        <div className={styles.content}>
          <p className={styles.statement}>
            Our recommendations combine <strong>hands-on ownership experience</strong> with 
            insights from <strong>hundreds of expert reviews</strong>—giving you perspective 
            that goes beyond spec sheets.
          </p>
          <div className={styles.sources}>
            <span className={styles.label}>Sources include:</span>
            <span className={styles.channels}>
              {expertChannels.join(' · ')}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
