/**
 * My Garage Page - Server Component
 * 
 * This is a Server Component that:
 * 1. Fetches user data (favorites, vehicles, builds) on the server
 * 2. Passes the initial data to GarageClient for client-side hydration
 * 3. Reduces time-to-content from 1-2s to <300ms
 * 
 * The actual interactive UI is in GarageClient.jsx (client component)
 */

import { Suspense } from 'react';
import { getGarageServerData } from '@/lib/garageServerData';
import GarageClient from './GarageClient';
import styles from './page.module.css';

// Metadata for the page
export const metadata = {
  title: 'My Garage | AutoRev',
  description: 'Your personal vehicle collection, favorites, and custom builds',
};

// Loading component shown during server-side data fetch
function GarageLoading() {
  return (
    <div className={styles.page}>
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner} />
        <p className={styles.loadingText}>Loading your garage...</p>
      </div>
    </div>
  );
}

// Server Component - fetches data and passes to client
async function GaragePage() {
  // Fetch all garage data on the server
  const serverData = await getGarageServerData();
  
  // Prepare initialData for client component
  // This will be used to hydrate the prefetch cache and skip client-side fetches
  const initialData = {
    userId: serverData.user?.id || null,
    user: serverData.user,
    profile: serverData.profile,
    favorites: serverData.favorites || [],
    vehicles: serverData.vehicles || [],
    builds: serverData.builds || [],
    hadError: !!serverData.error,
    // Include timestamp to help with cache invalidation
    fetchedAt: Date.now(),
  };

  return <GarageClient initialData={initialData} />;
}

// Export with Suspense boundary for streaming
export default function Page() {
  return (
    <Suspense fallback={<GarageLoading />}>
      <GaragePage />
    </Suspense>
  );
}
