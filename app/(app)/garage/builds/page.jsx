'use client';

/**
 * My Garage - Builds Page (Redirect)
 * 
 * This page has been consolidated into the main garage page.
 * Redirects to /garage?view=list for backwards compatibility.
 * 
 * URL: /garage/builds → /garage?view=list
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BuildsPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to main garage page in list view
    router.replace('/garage?view=list');
  }, [router]);
  
  // Show nothing while redirecting
  return null;
}
