import { redirect } from 'next/navigation';

/**
 * Redirect /browse-cars/[slug]/performance to /mod-planner?car=[slug]
 * The Mod Planner is now a standalone page.
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
