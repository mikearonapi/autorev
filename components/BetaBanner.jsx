'use client';

import styles from './BetaBanner.module.css';

export default function BetaBanner() {
  return (
    <div className={styles.banner}>
      <div className={styles.content}>
        <span className={styles.badge}>BETA</span>
        <span className={styles.message}>All membership levels FREE during beta</span>
      </div>
    </div>
  );
}




