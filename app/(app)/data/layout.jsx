import DataHeader from './DataHeader';
import styles from './layout.module.css';

/**
 * Data Layout - Shared wrapper for all data pages
 * 
 * Provides:
 * - Shared header with page title and tab bar navigation
 * - Vehicle selector that persists across tab changes (via URL params)
 * - Consistent container styling
 * - Base metadata (pages can override with their own)
 * 
 * Routes:
 * - /data → Virtual Dyno (main page)
 * - /data/track → Track Times page
 * 
 * CRITICAL: Vehicle selection is preserved via URL param (?vehicle=123)
 * When navigating between tabs, the vehicle selection persists.
 */

export const metadata = {
  title: {
    template: '%s | AutoRev Data',
    default: 'Virtual Dyno | Performance Data | AutoRev',
  },
  description: 'Your car data hub. View estimated horsepower and torque curves, estimate lap times, and log your actual dyno and track results.',
  keywords: [
    'car data logging',
    'virtual dyno',
    'lap time tracker',
    'dyno data',
    'car telemetry',
    'performance analytics',
    'track session logging',
    'car performance data',
  ],
  openGraph: {
    title: 'Data Hub | AutoRev',
    description: 'View performance estimates and log your actual results.',
    url: '/data',
    type: 'website',
  },
  twitter: {
    title: 'Data Hub | AutoRev',
    description: 'View performance estimates and log your results.',
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
  return (
    <div className={styles.container}>
      <DataHeader />
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
}
