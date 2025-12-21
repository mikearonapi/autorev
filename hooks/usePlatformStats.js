'use client';

import { useEffect, useState } from 'react';

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












