import { redirect } from 'next/navigation';

/**
 * Redirect /cars/[slug]/performance to /mod-planner?car=[slug]
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

export default function CarPerformanceRedirect({ params }) {
  redirect(`/mod-planner?car=${params.slug}`);
}
