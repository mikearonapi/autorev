/**
 * Performance Page Layout
 * 
 * SEO metadata for the Performance tracking experience
 */

export const metadata = {
  title: 'Performance | Dyno & Track Data Hub',
  description: 'Track your build\'s real-world performance. View dyno estimates, log track sessions, upload dyno sheets, and compare estimated vs actual gains.',
  keywords: [
    'dyno results', 'track times', 'performance data', 'horsepower gains',
    'torque curves', 'lap times', 'dyno sheets', 'track day logging',
    'performance metrics', 'car performance tracking'
  ],
  openGraph: {
    title: 'Performance | Dyno & Track Data Hub',
    description: 'Track your build\'s real-world performance with dyno and track data.',
    url: '/performance',
    type: 'website',
  },
  twitter: {
    title: 'Performance Hub | AutoRev',
    description: 'Track dyno results, lap times, and real-world performance data.',
  },
  alternates: {
    canonical: '/performance',
  },
};

export default function PerformanceLayout({ children }) {
  return children;
}
