'use client';

/**
 * My Public Builds Section - Compact Version
 * 
 * Shows authenticated users a compact inline display of their builds
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
import styles from './MyBuildsSection.module.css';

export default function MyBuildsSection() {
  const { user, isAuthenticated } = useAuth();
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchMyBuilds();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function fetchMyBuilds() {
    try {
      // Query only published builds for this user
      const { data, error } = await supabase
        .from('community_posts')
        .select('id, title, slug, car_name, post_type')
        .eq('user_id', user.id)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setBuilds(data || []);
    } catch (err) {
      console.error('Error fetching my builds:', err);
    } finally {
      setLoading(false);
    }
  }

  // Don't render if not logged in or no builds or still loading
  if (!isAuthenticated || loading || builds.length === 0) {
    return null;
  }

  return (
    <div className={styles.compactSection}>
      <span className={styles.compactLabel}>My Public Builds: {builds.length}</span>
      <Link href="/garage/tuning-shop" className={styles.compactLink}>
        Edit
      </Link>
    </div>
  );
}

