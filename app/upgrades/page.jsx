import { redirect } from 'next/navigation';

/**
 * Redirect /upgrades to /mod-planner
 * Upgrade planning is now part of the Mod Planner.
 */

export const metadata = {
  title: 'Redirecting to Mod Planner',
  description: 'Upgrade planning is now part of the Mod Planner.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function UpgradesRedirect() {
  redirect('/mod-planner');
}
