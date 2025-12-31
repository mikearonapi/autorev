/**
 * SEO Metadata for Own/Garage Feature Page
 */
export const metadata = {
  title: 'My Garage — Digital Car Collection Manager | AutoRev',
  description: 'Track your sports car collection digitally. VIN decoder, recall alerts, maintenance schedules, service logs. Never miss a recall or scheduled service again.',
  keywords: [
    'car garage app',
    'VIN decoder',
    'car recall alerts',
    'maintenance tracker',
    'car collection manager',
    'service log app',
  ],
  openGraph: {
    title: 'My Garage — Your Digital Car Collection',
    description: 'VIN decoder, recall alerts, maintenance tracking. Everything you need to manage your sports car ownership.',
    url: '/features/own',
    images: [
      {
        url: '/images/onboarding/garage-01-hero.png',
        width: 1200,
        height: 630,
        alt: 'AutoRev digital garage interface',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'My Garage — Your Digital Car Collection',
    description: 'VIN decoder, recall alerts, maintenance tracking — all in one place.',
    images: ['/images/onboarding/garage-01-hero.png'],
  },
  alternates: {
    canonical: '/features/own',
  },
};


