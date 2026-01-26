/**
 * Dashboard Page
 * 
 * Main gamification dashboard showing:
 * - Overall profile score with concentric rings
 * - Weekly engagement tracking
 * - Achievements showcase
 */

import { Suspense } from 'react';

import DashboardClient from './DashboardClient';
import styles from './page.module.css';

export const metadata = {
  title: 'Dashboard | AutoRev',
  description: 'Track your AutoRev progress, achievements, and engagement.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardPage() {
  return (
    <div className={styles.page}>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardClient />
      </Suspense>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className={styles.skeleton}>
      <div className={styles.skeletonRings} />
      <div className={styles.skeletonCard} />
      <div className={styles.skeletonCards}>
        <div className={styles.skeletonCardSmall} />
        <div className={styles.skeletonCardSmall} />
        <div className={styles.skeletonCardSmall} />
      </div>
    </div>
  );
}
