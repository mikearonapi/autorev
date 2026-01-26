import EventsView from '../EventsView';

/**
 * Community Events Page
 * 
 * Displays car events and meets with search, filtering, and RSVP functionality.
 * Tab bar navigation is provided by the parent layout.
 */

export const metadata = {
  title: 'Car Events & Meets',
  description: 'Discover car meets, track days, and automotive events near you. RSVP to events and connect with local enthusiasts.',
  keywords: [
    'car events',
    'car meets',
    'track days',
    'cars and coffee',
    'automotive events',
    'car shows',
    'cruise events',
    'autocross',
  ],
  openGraph: {
    title: 'Car Events & Meets | AutoRev Community',
    description: 'Discover car meets, track days, and automotive events near you.',
    url: '/community/events',
    type: 'website',
  },
  twitter: {
    title: 'Car Events & Meets | AutoRev Community',
    description: 'Discover car meets, track days, and automotive events near you.',
  },
  alternates: {
    canonical: '/community/events',
  },
  robots: {
    index: false, // App route - marketing version would be indexed
    follow: true,
  },
};

export default function EventsPage() {
  return <EventsView />;
}
