import { redirect } from 'next/navigation';

// Redirect /advisory to /car-selector
// This ensures old links and bookmarks continue to work

export const metadata = {
  title: 'Redirecting to Car Selector',
  description: 'Redirecting to the Sports Car Selector tool.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function AdvisoryRedirect() {
  redirect('/car-selector');
}
