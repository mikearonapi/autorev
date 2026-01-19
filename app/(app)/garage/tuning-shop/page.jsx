'use client';

/**
 * Tuning Shop Page - REDIRECT
 * 
 * This route has been moved to /garage/my-build as part of the
 * My Garage reorganization (My Build / My Performance / My Parts).
 * 
 * Redirects preserve URL parameters for seamless transition.
 */

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function TuningShopRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Build the new URL with preserved query params
    const params = searchParams.toString();
    const newUrl = params ? `/garage/my-build?${params}` : '/garage/my-build';
    
    // Use replace to avoid adding to browser history
    router.replace(newUrl);
  }, [router, searchParams]);
  
  // Return null while redirecting (instant redirect, no flash)
  return null;
}
