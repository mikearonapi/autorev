'use client';

/**
 * Garage Client Component
 * 
 * Contains all the interactive client-side logic for the /garage page.
 * Receives initialData from the Server Component to enable instant content.
 * 
 * This component:
 * - Wraps content with SSRDataProvider to hydrate prefetch cache
 * - Maintains all existing interactivity (tabs, modals, actions)
 * - Falls back gracefully if SSR data isn't available
 * 
 * @module app/garage/GarageClient
 */

import React, { Suspense } from 'react';
import { SSRDataProvider } from '@/components/providers/SSRDataProvider';
import LoadingSpinner from '@/components/LoadingSpinner';
import styles from './page.module.css';

// Dynamically import the heavy garage content to allow code splitting
// This is optional but can improve initial bundle size
import dynamic from 'next/dynamic';

const GarageContent = dynamic(() => import('./GarageContent'), {
  loading: () => <GarageLoading />,
  ssr: false, // Content is already SSR'd via initialData
});

/**
 * Loading fallback component
 */
function GarageLoading() {
  return (
    <div className={styles.page}>
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="large" />
      </div>
    </div>
  );
}

/**
 * Garage Client Component
 * 
 * @param {Object} props
 * @param {Object} props.initialData - SSR-fetched data from server component
 */
export default function GarageClient({ initialData }) {
  return (
    <SSRDataProvider initialData={initialData}>
      <Suspense fallback={<GarageLoading />}>
        <GarageContent initialData={initialData} />
      </Suspense>
    </SSRDataProvider>
  );
}

