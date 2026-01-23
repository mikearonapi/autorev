'use client';

/**
 * Profile Page - Redirect to Settings
 * 
 * Legacy route - redirects to /settings
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/settings');
  }, [router]);
  
  return null;
}
