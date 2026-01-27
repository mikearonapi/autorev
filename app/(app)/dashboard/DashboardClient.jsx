'use client';

/**
 * DashboardClient Component
 *
 * Simple, Duolingo-inspired dashboard.
 * - Streak counter (the ONE number)
 * - Achievements as hero (real metrics)
 * - Weekly activity chart
 *
 * Uses React Query for data caching - dashboard data is prefetched
 * by AppDataPrefetcher at the layout level, so subsequent visits
 * render instantly from cache.
 */

import { useState, useEffect, useCallback } from 'react';

import Link from 'next/link';

import { useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/components/providers/AuthProvider';
import { FullscreenQuestionnaire } from '@/components/questionnaire';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { useProfileSummary } from '@/hooks/useQuestionnaire';
import { useDashboardData } from '@/hooks/useUserData';
import { userKeys } from '@/lib/queryKeys';

import { GearIcon } from './components/DashboardIcons';
import ImprovementActions from './components/ImprovementActions';
import LifetimeAchievements from './components/LifetimeAchievements';
import UserGreeting from './components/UserGreeting';
import WeeklyEngagement from './components/WeeklyEngagement';
import WeeklyPointsSummary from './components/WeeklyPointsSummary';
import styles from './page.module.css';

export default function DashboardClient() {
  const { user, profile, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);

  // Use React Query for cached dashboard data
  const {
    data: dashboardData,
    isLoading: dataLoading,
    error: dataError,
    refetch: refetchDashboard,
  } = useDashboardData(user?.id, {
    enabled: Boolean(user?.id) && !authLoading,
  });

  // Combined loading state
  const loading = authLoading || (dataLoading && !dashboardData);

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    if (!loading) {
      setLoadingTimedOut(false);
      return;
    }
    const timeout = setTimeout(() => {
      console.warn('[Dashboard] Loading timeout - showing content');
      setLoadingTimedOut(true);
    }, 6000);
    return () => clearTimeout(timeout);
  }, [loading]);

  // Fetch questionnaire profile summary for the button
  const { summary: questionnaireSummary } = useProfileSummary(user?.id, {
    enabled: Boolean(user?.id) && !authLoading,
  });

  const _avatarUrl =
    profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  const handleTitleChange = useCallback(
    async (newTitle) => {
      if (!user?.id) return;

      // Optimistic update - update React Query cache immediately
      queryClient.setQueryData([...userKeys.all, user.id, 'dashboard'], (prev) => ({
        ...prev,
        profile: { ...prev?.profile, selectedTitle: newTitle },
      }));

      try {
        await fetch(`/api/users/${user.id}/dashboard?action=update-title&title=${newTitle}`, {
          method: 'POST',
        });
      } catch (err) {
        console.error('Failed to update title:', err);
        // Refetch to restore correct state on error
        refetchDashboard();
      }
    },
    [user?.id, queryClient, refetchDashboard]
  );

  // Not logged in
  if (!authLoading && !user) {
    return (
      <div className={styles.emptyState}>
        <h2 className={styles.emptyTitle}>Sign in to view your Dashboard</h2>
        <p className={styles.emptyText}>Track your progress and achievements.</p>
      </div>
    );
  }

  // Loading - with safety timeout to prevent stuck state
  // Show loading only if we don't have cached data (stale-while-revalidate pattern)
  // ANDROID FIX: Use skeleton instead of spinner for faster perceived loading
  if (loading && !dashboardData && !loadingTimedOut) {
    return <DashboardSkeleton />;
  }

  // Error - only show if we have no data at all
  if (dataError && !dashboardData) {
    return (
      <div className={styles.error}>
        <p>{dataError.message || 'Failed to load dashboard'}</p>
        <button onClick={() => refetchDashboard()} className={styles.retryButton}>
          Try Again
        </button>
      </div>
    );
  }

  const {
    streak,
    points,
    engagement: _engagement,
    dailyActivity,
    monthlyActivity,
    yearlyActivity,
    achievements,
    profile: dashboardProfile,
    completion,
  } = dashboardData || {};

  // Map achievements for the component
  const mappedAchievements = (achievements || []).map((a) => ({
    ...a,
    achievement_type: a.type,
    display_value: a.displayValue,
  }));

  // Calculate weekly activity totals from daily activity
  const _weeklyActivity = (dailyActivity || []).reduce(
    (acc, day) => ({
      al: acc.al + (day?.al || 0),
      community: acc.community + (day?.community || 0),
      data: acc.data + (day?.data || 0),
      garage: acc.garage, // Garage uses completion score, not daily activity
    }),
    { al: 0, community: 0, data: 0, garage: 0 }
  );

  // Get garage score from completion data
  const _garageScore = completion?.garage_score || 0;

  // Get first name
  const firstName =
    dashboardProfile?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.pageTitle}>{firstName}&apos;s Dashboard</h1>
        <Link href="/settings" className={styles.profileLink} aria-label="Settings">
          <GearIcon size={20} />
        </Link>
      </header>

      {/* Personalized Greeting with Title */}
      <UserGreeting
        firstName={firstName}
        selectedTitle={dashboardProfile?.selectedTitle}
        unlockedTitles={dashboardProfile?.unlockedTitles || ['rookie']}
        onTitleChange={handleTitleChange}
      />

      {/* Fullscreen Questionnaire Modal */}
      {showQuestionnaire && (
        <FullscreenQuestionnaire
          userId={user?.id}
          onClose={() => setShowQuestionnaire(false)}
          onComplete={() => setShowQuestionnaire(false)}
        />
      )}

      {/* Weekly Points Summary - Simplified hero card */}
      <section className={styles.ringsSection}>
        <WeeklyPointsSummary
          points={{
            weekly: points?.weekly || 0,
            monthly: points?.monthly || 0,
            lifetime: points?.lifetime || 0,
          }}
          currentStreak={streak?.currentStreak || 0}
          animated={true}
        />
      </section>

      {/* Weekly Activity - Swipeable weekly/monthly/yearly views */}
      <section className={styles.engagementSection}>
        <WeeklyEngagement
          dailyActivity={dailyActivity || []}
          monthlyActivity={monthlyActivity || []}
          yearlyActivity={yearlyActivity || []}
          streak={{
            current: streak?.currentStreak || 0,
            longest: streak?.longestStreak || 0,
          }}
        />
      </section>

      {/* Lifetime Achievements - Core feature metrics */}
      <section className={styles.achievementsSection}>
        <LifetimeAchievements
          achievements={mappedAchievements}
          profileCompleteness={questionnaireSummary?.profileCompletenessPct || 0}
        />
      </section>

      {/* How to Earn Points - Ways to earn points */}
      <section className={styles.actionsSection}>
        <ImprovementActions title="How to Earn Points" />
      </section>
    </div>
  );
}
