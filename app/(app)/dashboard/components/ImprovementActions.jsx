'use client';

/**
 * ImprovementActions Component
 *
 * Shows ways users can earn more points, organized by category.
 * Design matches PointsExplainerModal for consistency.
 *
 * Categories (highest to lowest value):
 * - Growth (250): Referrals
 * - Community (100): Sharing builds
 * - Real Data (50): Installed upgrades, dyno, lap times
 * - Engagement (10): Planning, adding vehicles, comments
 * - Participation (5): Likes, photos
 *
 * Points MUST match lib/pointsService.js POINTS_CONFIG
 */

import { useState } from 'react';

import Link from 'next/link';

import { useReferralData } from '@/hooks/useUserData';
import { platform } from '@/lib/platform';

import styles from './ImprovementActions.module.css';

// Category Icons
const Icons = {
  growth: ({ size = 18 }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  community: ({ size = 18 }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  data: ({ size = 18 }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  garage: ({ size = 18 }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  al: ({ size = 18 }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  profile: ({ size = 18 }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  copy: ({ size = 16 }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  check: ({ size = 16 }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};

// Points configuration by category - MUST match lib/pointsService.js POINTS_CONFIG
// 5-tier system: Growth (250) > Community (100) > Real Data (50) > Engagement (10) > Participation (5)
// Colors use CSS custom property names from styles/tokens/colors.css
const POINTS_BY_CATEGORY = {
  growth: {
    label: 'Growth',
    icon: Icons.growth,
    colorClass: 'categoryColorGrowth',
    actions: [{ label: 'Refer a friend', points: 250, isReferral: true }],
  },
  community: {
    label: 'Community',
    icon: Icons.community,
    colorClass: 'categoryColorCommunity',
    actions: [
      { label: 'Share your build', points: 100, href: '/community' },
      { label: 'Post a comment', points: 10, href: '/community' },
      { label: 'Like a build', points: 5, href: '/community' },
    ],
  },
  data: {
    label: 'Data',
    icon: Icons.data,
    colorClass: 'categoryColorData',
    actions: [
      { label: 'Log dyno data', points: 50, href: '/data' },
      { label: 'Log track time', points: 50, href: '/data' },
    ],
  },
  garage: {
    label: 'Garage',
    icon: Icons.garage,
    colorClass: 'categoryColorGarage',
    actions: [
      { label: 'Install an upgrade', points: 50, href: '/garage' },
      { label: 'Add a vehicle', points: 10, href: '/garage' },
      { label: 'Plan an upgrade', points: 10, href: '/garage' },
      { label: 'Upload a photo', points: 5, href: '/garage' },
    ],
  },
  al: {
    label: 'AL',
    icon: Icons.al,
    colorClass: 'categoryColorAl',
    actions: [
      { label: 'Ask AL a question', points: 10, href: '/al' },
    ],
  },
  profile: {
    label: 'Profile',
    icon: Icons.profile,
    colorClass: 'categoryColorProfile',
    actions: [
      { label: '100% Profile Complete', points: 100, href: '/questionnaire' },
      { label: '50% Profile Complete', points: 50, href: '/questionnaire' },
      { label: 'Complete a category', points: 25, href: '/questionnaire' },
      { label: 'Answer a question', points: 5, href: '/questionnaire' },
    ],
  },
};

export default function ImprovementActions({ title = 'How to Earn Points', showIntro = true }) {
  const [referralCopied, setReferralCopied] = useState(false);

  // Fetch referral data for the copy link feature
  const { data: referralData } = useReferralData({ enabled: true });

  // Handle referral link copy
  const handleReferralCopy = async () => {
    if (!referralData?.referral_link) return;

    const success = await platform.copyToClipboard(referralData.referral_link);
    if (success) {
      setReferralCopied(true);
      // Reset after 4 seconds
      setTimeout(() => setReferralCopied(false), 4000);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
      </div>

      {showIntro && (
        <p className={styles.intro}>
          Earn points by using AutoRev. The more you build, log, and engage, the more points you
          earn!
        </p>
      )}

      <div className={styles.categories}>
        {Object.entries(POINTS_BY_CATEGORY).map(([key, category]) => {
          const IconComponent = category.icon;

          return (
            <div key={key} className={styles.category}>
              <div className={styles.categoryHeader}>
                <div className={`${styles.categoryIcon} ${styles[category.colorClass]}`}>
                  <IconComponent size={18} />
                </div>
                <span className={styles.categoryLabel}>{category.label}</span>
              </div>

              <ul className={styles.actionList}>
                {category.actions.map((action, idx) => {
                  // Make "Refer a friend" clickable to copy
                  if (action.isReferral) {
                    return (
                      <li key={idx} className={styles.actionItemReferral}>
                        <button
                          className={`${styles.referralButton} ${referralCopied ? styles.referralButtonCopied : ''}`}
                          onClick={handleReferralCopy}
                          disabled={!referralData?.referral_link}
                        >
                          <div className={styles.referralButtonContent}>
                            <span className={styles.referralIcon}>
                              {referralCopied ? (
                                <Icons.check size={16} />
                              ) : (
                                <Icons.copy size={16} />
                              )}
                            </span>
                            <span className={styles.referralLabel}>
                              {referralCopied ? 'Link copied!' : action.label}
                            </span>
                          </div>
                          <span className={`${styles.actionPoints} ${styles[category.colorClass]}`}>
                            +{action.points}
                          </span>
                        </button>
                        {referralCopied && (
                          <div className={styles.referralHint}>
                            Text this link to a friend. When they sign up, you both earn 250 points!
                          </div>
                        )}
                      </li>
                    );
                  }

                  // Regular action - link if href provided
                  if (action.href) {
                    return (
                      <li key={idx} className={styles.actionItem}>
                        <Link href={action.href} className={styles.actionLink}>
                          <span className={styles.actionLabel}>{action.label}</span>
                          <span className={`${styles.actionPoints} ${styles[category.colorClass]}`}>
                            +{action.points}
                          </span>
                        </Link>
                      </li>
                    );
                  }

                  // Non-link action
                  return (
                    <li key={idx} className={styles.actionItem}>
                      <span className={styles.actionLabel}>{action.label}</span>
                      <span className={`${styles.actionPoints} ${styles[category.colorClass]}`}>
                        +{action.points}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
