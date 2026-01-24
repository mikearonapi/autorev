/**
 * Insights Page - Daily Briefing for Modification Enthusiasts
 * 
 * Personalized, mod-focused insights showing:
 * - Performance recommendations (next mod, bottlenecks)
 * - Platform-specific reliability concerns (relevant to modding)
 * - Community standing (how your build compares)
 * - Build progress toward goals
 * 
 * NOT for: Generic maintenance reminders, oil changes, registrations.
 * Target audience: Car modification enthusiasts who want to build their cars.
 */

import { Suspense } from 'react';
import InsightsClient from './InsightsClient';
import styles from './page.module.css';

export const metadata = {
  title: 'Insights | AutoRev',
  description: 'Your daily briefing for vehicle modifications - performance recommendations, platform insights, and build progress.',
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
