import { redirect } from 'next/navigation';

/**
 * Redirect /cars/[slug] to /browse-cars/[slug]
 * This ensures old links and bookmarks continue to work.
 */

export const metadata = {
  title: 'Redirecting...',
  description: 'Redirecting to the car detail page.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function CarDetailRedirect({ params }) {
  redirect(`/browse-cars/${params.slug}`);
}
