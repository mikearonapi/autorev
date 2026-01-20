export const metadata = {
  title: 'Data Hub | Track Sessions & Performance Analytics | AutoRev',
  description: 'Your car data hub. Track sessions, lap times, OBD2 logging, telemetry uploads, and performance analytics—all in one place. Visualize your dyno data and lap time progress.',
  keywords: [
    'car data logging',
    'OBD2 logging',
    'lap time tracker',
    'dyno data',
    'car telemetry',
    'performance analytics',
    'track session logging',
    'car performance data',
  ],
  openGraph: {
    title: 'Data Hub | AutoRev',
    description: 'Track sessions, lap times, OBD2 logging, and performance analytics.',
    url: '/data',
    type: 'website',
  },
  twitter: {
    title: 'Data Hub | AutoRev',
    description: 'Track sessions, lap times, and performance analytics.',
  },
  alternates: {
    canonical: '/data',
  },
  robots: {
    index: false, // User-specific data page
    follow: true,
  },
};

export default function DataLayout({ children }) {
  return children;
}
