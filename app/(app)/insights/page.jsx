/**
 * Insights Page
 * 
 * Personalized vehicle insights showing:
 * - Known issues for user's garage vehicles
 * - Maintenance due/upcoming
 * - Upgrade suggestions based on user preferences
 * - Value trends
 * 
 * Design matches Dashboard layout for consistency.
 */

import { Suspense } from 'react';
import InsightsClient from './InsightsClient';
import styles from './page.module.css';

export const metadata = {
  title: 'Insights | AutoRev',
  description: 'Personalized insights for your garage vehicles - known issues, maintenance, upgrades, and more.',
};

export default function InsightsPage() {
  return (
    <Suspense fallback={<InsightsSkeleton />}>
      <InsightsClient />
    </Suspense>
  );
}

function InsightsSkeleton() {
  return (
    <div className={styles.page}>
      <div className={styles.skeleton}>
        <div className={styles.skeletonHeader} />
        <div className={styles.skeletonVehicleSelector} />
        <div className={styles.skeletonCard} />
        <div className={styles.skeletonCard} />
        <div className={styles.skeletonCard} />
      </div>
    </div>
  );
}
