import LeaderboardView from '../LeaderboardView';

/**
 * Community Leaderboard Page
 * 
 * Shows top contributors and enthusiasts by points earned.
 * Supports monthly and all-time views.
 * Tab bar navigation is provided by the parent layout.
 */

export const metadata = {
  title: 'Community Leaderboard',
  description: 'See top contributors and enthusiasts in the AutoRev community. Earn points by sharing builds, engaging with content, and participating in events.',
  keywords: [
    'leaderboard',
    'top contributors',
    'community points',
    'car enthusiasts',
    'community ranking',
  ],
  openGraph: {
    title: 'Community Leaderboard | AutoRev',
    description: 'See top contributors and enthusiasts in the AutoRev community.',
    url: '/community/leaderboard',
    type: 'website',
  },
  twitter: {
    title: 'Community Leaderboard | AutoRev',
    description: 'See top contributors and enthusiasts in the AutoRev community.',
  },
  alternates: {
    canonical: '/community/leaderboard',
  },
  robots: {
    index: false, // App route - marketing version would be indexed
    follow: true,
  },
};

export default function LeaderboardPage() {
  return <LeaderboardView />;
}
