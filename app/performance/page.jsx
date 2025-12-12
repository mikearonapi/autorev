import { redirect } from 'next/navigation';

/**
 * Redirect /performance to /mod-planner
 * This ensures old links and bookmarks continue to work.
 */

export const metadata = {
  title: 'Redirecting to Mod Planner',
  description: 'Redirecting to the Mod Planner page.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function PerformanceRedirect() {
  redirect('/mod-planner');
}
