import { redirect } from 'next/navigation';

/**
 * Redirect /explore to /browse-cars
 * The Explore gateway page has been removed - users now access pages directly.
 */

export const metadata = {
  title: 'Redirecting to Browse Cars',
  description: 'Redirecting to the Browse Cars page.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function ExploreRedirect() {
  redirect('/browse-cars');
}
