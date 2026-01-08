/**
 * Event Submit Layout - SEO Metadata
 * 
 * URL: /events/submit
 * 
 * Provides metadata for the event submission page.
 */

export const metadata = {
  title: 'Submit a Car Event | Add Your Event to AutoRev',
  description: 'Submit your Cars & Coffee, track day, car show, or automotive event to reach thousands of enthusiasts. Free event listing for approved submissions.',
  keywords: [
    'submit car event',
    'add event listing',
    'car event submission',
    'list car show',
    'add cars and coffee',
    'submit track day',
    'event organizer',
    'automotive event listing',
  ],
  openGraph: {
    title: 'Submit a Car Event | AutoRev',
    description: 'Submit your car event to reach thousands of enthusiasts. Free listing for approved events.',
    url: '/events/submit',
    type: 'website',
  },
  twitter: {
    title: 'Submit a Car Event | AutoRev',
    description: 'Submit your car event to reach thousands of enthusiasts.',
  },
  alternates: {
    canonical: '/events/submit',
  },
};

export default function EventSubmitLayout({ children }) {
  return children;
}

