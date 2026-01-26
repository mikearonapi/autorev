'use client';

/**
 * DashboardClient Component
 *
 * Simple, Duolingo-inspired dashboard.
 * - Streak counter (the ONE number)
 * - Achievements as hero (real metrics)
 * - Weekly activity chart
 */

import { useState, useEffect, useCallback } from 'react';

import Link from 'next/link';

import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/components/providers/AuthProvider';
import { FullscreenQuestionnaire } from '@/components/questionnaire';
import { useProfileSummary } from '@/hooks/useQuestionnaire';

import { GearIcon, MessageIcon } from './components/DashboardIcons';
import ImprovementActions from './components/ImprovementActions';
import LifetimeAchievements from './components/LifetimeAchievements';
import UserGreeting from './components/UserGreeting';
import WeeklyEngagement from './components/WeeklyEngagement';
import WeeklyPointsSummary from './components/WeeklyPointsSummary';
import styles from './page.module.css';

export default function DashboardClient() {
  const { user, profile, loading: authLoading } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    if (!loading && !authLoading) {
      setLoadingTimedOut(false);
      return;
    }
    const timeout = setTimeout(() => {
      console.warn('[Dashboard] Loading timeout - showing content');
      setLoadingTimedOut(true);
    }, 6000);
    return () => clearTimeout(timeout);
  }, [loading, authLoading]);

  // Fetch questionnaire profile summary for the button
  const { summary: questionnaireSummary } = useProfileSummary(user?.id, {
    enabled: Boolean(user?.id) && !authLoading,
  });

  const _avatarUrl =
    profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  const fetchDashboardData = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/users/${user.id}/dashboard`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to fetch dashboard data');

      setDashboardData(result.data);
      setLoading(false);
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        setError('Loading took too long. Please try again.');
      } else {
        console.error('Dashboard fetch error:', err);
        setError(err.message);
      }
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) {
      setLoading(false);
      return;
    }
    fetchDashboardData();
  }, [user?.id, authLoading, fetchDashboardData]);

  const handleTitleChange = useCallback(
    async (newTitle) => {
      if (!user?.id) return;

      setDashboardData((prev) => ({
        ...prev,
        profile: { ...prev?.profile, selectedTitle: newTitle },
      }));

      try {
        await fetch(`/api/users/${user.id}/dashboard?action=update-title&title=${newTitle}`, {
          method: 'POST',
        });
      } catch (err) {
        console.error('Failed to update title:', err);
      }
    },
    [user?.id]
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
  if ((loading || authLoading) && !loadingTimedOut) {
    return (
      <LoadingSpinner
        variant="branded"
        text="Loading Dashboard"
        subtext="Fetching your progress..."
        fullPage
      />
    );
  }

  // Error
  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <button onClick={fetchDashboardData} className={styles.retryButton}>
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
