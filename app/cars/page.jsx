import { redirect } from 'next/navigation';

/**
 * Redirect /cars to /browse-cars
 * This ensures old links and bookmarks continue to work.
 */

export const metadata = {
  title: 'Redirecting to Browse Cars',
  description: 'Redirecting to the Browse Cars page.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function CarsRedirect() {
  redirect('/browse-cars');
}
