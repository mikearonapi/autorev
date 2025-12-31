/**
 * SEO Metadata for Connect/Community Feature Page
 */
export const metadata = {
  title: 'Car Events & Community | AutoRev',
  description: 'Discover local car events, track days, cars and coffee meetups, and automotive shows. Connect with fellow enthusiasts and never miss an event in your area.',
  keywords: [
    'car events near me',
    'cars and coffee',
    'track days',
    'car shows',
    'automotive events',
    'car meetups',
  ],
  openGraph: {
    title: 'Car Events & Community',
    description: 'Discover local car events, track days, and meetups. Connect with fellow enthusiasts.',
    url: '/features/connect',
    images: [
      {
        url: '/images/onboarding/community-01-events-list.png',
        width: 1200,
        height: 630,
        alt: 'AutoRev community events listing',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Car Events & Community',
    description: 'Discover local car events, track days, and meetups near you.',
    images: ['/images/onboarding/community-01-events-list.png'],
  },
  alternates: {
    canonical: '/features/connect',
  },
};

