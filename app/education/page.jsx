import { redirect } from 'next/navigation';

/**
 * Redirect /education to /how-mods-work
 * This ensures old links and bookmarks continue to work.
 */

export const metadata = {
  title: 'Redirecting to How Mods Work',
  description: 'Redirecting to the How Mods Work page.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function EducationRedirect() {
  redirect('/how-mods-work');
}
