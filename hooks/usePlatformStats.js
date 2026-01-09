'use client';

import { useEffect, useState } from 'react';

/**
 * Hook to fetch platform-wide statistics
 * 
 * @returns {{ stats: Object|null, loading: boolean, error: string|null }}
 */
export function usePlatformStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchStats() {
      try {
        const res = await fetch('/api/stats', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch stats');
        const data = await res.json();
        if (isMounted) setStats(data);
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to fetch stats');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchStats();
    return () => {
      isMounted = false;
    };
  }, []);

  return { stats, loading, error };
}

/**
 * Hook to get the current car count from platform stats
 * Returns a formatted string like "190+" for display
 * 
 * @returns {{ carCount: string, loading: boolean }}
 */
export function useCarCount() {
  const { stats, loading } = usePlatformStats();
  // Round down to nearest 10 and add "+" for marketing-friendly display
  const count = stats?.cars || 190;
  const roundedCount = Math.floor(count / 10) * 10;
  return { 
    carCount: `${roundedCount}+`,
    exactCount: count,
    loading 
  };
}

/**
 * Hook to get the current event count from platform stats
 * 
 * @returns {{ eventCount: string, loading: boolean }}
 */
export function useEventCount() {
  const { stats, loading } = usePlatformStats();
  const count = stats?.events || 8000;
  // Round to nearest thousand for large numbers
  const roundedCount = count >= 1000 
    ? `${Math.floor(count / 1000).toLocaleString()},000+`
    : `${count}+`;
  return { 
    eventCount: roundedCount,
    exactCount: count,
    loading 
  };
}












