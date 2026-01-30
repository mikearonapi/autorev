/**
 * Insights Page - Daily Briefing for Modification Enthusiasts
 *
 * Personalized, mod-focused insights showing:
 * - Performance recommendations (next mod, bottlenecks)
 * - Platform-specific reliability concerns (relevant to modding)
 * - Build progress toward goals
 *
 * NOT for: Generic maintenance reminders, oil changes, registrations.
 * Target audience: Car modification enthusiasts who want to build their cars.
 */

import { Suspense } from 'react';

import LoadingSpinner from '@/components/LoadingSpinner';

import InsightsClient from './InsightsClient';
import styles from './page.module.css';

export const metadata = {
  title: 'Insights | AutoRev',
  description:
    'Your daily briefing for vehicle modifications - performance recommendations, platform insights, and build progress.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function InsightsPage() {
  return (
    <Suspense fallback={<InsightsLoadingScreen />}>
      <InsightsClient />
    </Suspense>
  );
}

function InsightsLoadingScreen() {
  return (
    <div className={styles.page}>
      <LoadingSpinner
        variant="branded"
        text="Loading Your Insights"
        subtext="Preparing your daily briefing..."
        fullPage
      />
    </div>
  );
}
