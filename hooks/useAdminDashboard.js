/**
 * useAdminDashboard Hook
 * 
 * Fetches and manages admin dashboard data with time range filtering.
 * Includes memoization for performance and proper error handling.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const CACHE_DURATION = 60000; // 1 minute cache

export function useAdminDashboard(initialRange = 'week') {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState(initialRange);
  const [lastFetch, setLastFetch] = useState(null);
  
  const fetchDashboardData = useCallback(async (range, force = false) => {
    // Check cache unless forced
    if (!force && lastFetch && Date.now() - lastFetch < CACHE_DURATION && data?.timeRange === range) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Get current session for auth
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(`/api/admin/dashboard?range=${range}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const dashboardData = await response.json();
      setData(dashboardData);
      setLastFetch(Date.now());
      
    } catch (err) {
      console.error('[useAdminDashboard] Error:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [data?.timeRange, lastFetch]);
  
  // Fetch on mount and when time range changes
  useEffect(() => {
    fetchDashboardData(timeRange);
  }, [timeRange, fetchDashboardData]);
  
  // Change time range handler
  const changeTimeRange = useCallback((newRange) => {
    if (['day', 'week', 'month', 'all'].includes(newRange)) {
      setTimeRange(newRange);
    }
  }, []);
  
  // Manual refresh handler
  const refresh = useCallback(() => {
    fetchDashboardData(timeRange, true);
  }, [fetchDashboardData, timeRange]);
  
  // Memoized computed values
  const computedStats = useMemo(() => {
    if (!data) return null;
    
    const { users, engagement, costs, breakEven } = data;
    
    // Calculate burn rate (monthly)
    const burnRate = costs.totalMonthly;
    
    // Projected revenue at different conversion rates
    const projectedRevenue = {
      '5%': Math.round(users.total * 0.05 * 7.5),
      '10%': Math.round(users.total * 0.10 * 7.5),
      '15%': Math.round(users.total * 0.15 * 7.5),
    };
    
    // Runway (months until break-even at current growth)
    const monthsToBreakEven = users.newThisPeriod > 0 
      ? Math.ceil((breakEven.usersNeeded - users.total) / users.newThisPeriod)
      : null;
    
    // User health score (0-100)
    const healthScore = Math.round(
      (engagement.wauPercent * 0.4) + 
      (Math.min(engagement.conversationsPerUser * 10, 30)) +
      (Math.min(users.growthPercent, 30))
    );
    
    return {
      burnRate,
      projectedRevenue,
      monthsToBreakEven,
      healthScore,
    };
  }, [data]);
  
  // Memoized sparkline data (limit to last 14 points for display)
  const sparklineData = useMemo(() => {
    if (!data) return { users: [], conversations: [] };
    
    const limitPoints = (arr, limit = 14) => {
      if (arr.length <= limit) return arr;
      const step = Math.ceil(arr.length / limit);
      return arr.filter((_, i) => i % step === 0).slice(-limit);
    };
    
    return {
      users: limitPoints(data.users.byDay),
      conversations: limitPoints(data.engagement.byDay),
    };
  }, [data]);
  
  return {
    // Raw data
    data,
    
    // Loading/error states
    loading,
    error,
    
    // Time range controls
    timeRange,
    changeTimeRange,
    
    // Actions
    refresh,
    
    // Computed values
    computedStats,
    sparklineData,
    
    // Metadata
    lastUpdated: data?.timestamp ? new Date(data.timestamp) : null,
  };
}

export default useAdminDashboard;

