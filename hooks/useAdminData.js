'use client';

/**
 * React Query Hooks for Admin Data
 * 
 * Provides cached, deduplicated data fetching for admin dashboard data.
 * Includes dashboard metrics, analytics, financials, and usage data.
 * 
 * Admin data is isolated from user-facing app, so lower risk.
 * Uses apiClient for standardized error handling and cross-platform support.
 * 
 * @module hooks/useAdminData
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/providers/AuthProvider';
import apiClient from '@/lib/apiClient';

// =============================================================================
// CACHING STRATEGY
// =============================================================================
// Admin data can be cached slightly longer since it's not user-facing

const ADMIN_CACHE_TIMES = {
  SHORT: 2 * 60 * 1000,    // 2 minutes - for frequently changing data
  STANDARD: 5 * 60 * 1000, // 5 minutes - for dashboard metrics
  LONG: 10 * 60 * 1000,    // 10 minutes - for slower-changing analytics
};

// =============================================================================
// QUERY KEY FACTORIES
// =============================================================================

export const adminKeys = {
  all: ['admin'],
  
  // Dashboard
  dashboard: (range) => [...adminKeys.all, 'dashboard', range],
  
  // Financials
  financials: (range) => [...adminKeys.all, 'financials', range],
  
  // Usage
  usage: (range) => [...adminKeys.all, 'usage', range],
  
  // Retention
  retention: () => [...adminKeys.all, 'retention'],
  
  // Stripe
  stripe: (range) => [...adminKeys.all, 'stripe', range],
  
  // Site Analytics
  siteAnalytics: (range) => [...adminKeys.all, 'site-analytics', range],
  
  // Marketing Analytics
  marketingAnalytics: (range) => [...adminKeys.all, 'marketing-analytics', range],
  
  // Advanced Analytics
  advancedAnalytics: (range) => [...adminKeys.all, 'advanced-analytics', range],
  
  // Emails
  emails: (view) => [...adminKeys.all, 'emails', view],
  
  // AL Trends
  alTrends: (days) => [...adminKeys.all, 'al-trends', days],
  
  // AL Usage
  alUsage: (range) => [...adminKeys.all, 'al-usage', range],
  
  // AI Cost Summary
  aiCostSummary: (range) => [...adminKeys.all, 'ai-cost-summary', range],
  
  // Content Growth
  contentGrowth: (days) => [...adminKeys.all, 'content-growth', days],
  
  // External Costs
  externalCosts: (range) => [...adminKeys.all, 'external-costs', range],
  
  // Users
  users: (filters) => [...adminKeys.all, 'users', filters],
  
  // Health
  health: () => [...adminKeys.all, 'health'],
  
  // Alerts
  alerts: () => [...adminKeys.all, 'alerts'],
};

// =============================================================================
// FETCHER FUNCTIONS (using apiClient)
// =============================================================================

/**
 * Generic authenticated admin API fetcher
 */
async function adminFetcher(url, token) {
  return apiClient.get(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Cache-Control': 'no-cache',
    },
  });
}

// =============================================================================
// QUERY HOOKS
// =============================================================================

/**
 * Hook to fetch admin dashboard data
 */
export function useAdminDashboard(range = '30d', options = {}) {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: adminKeys.dashboard(range),
    queryFn: () => adminFetcher(`/api/admin/dashboard?range=${range}`, session?.access_token),
    staleTime: ADMIN_CACHE_TIMES.STANDARD,
    enabled: !!session?.access_token,
    ...options,
  });
}

/**
 * Hook to fetch financials data
 */
export function useAdminFinancials(range = '30d', monthYear = null, options = {}) {
  const { session } = useAuth();
  const params = new URLSearchParams();
  params.append('range', range);
  if (monthYear) {
    params.append('month', monthYear.month.toString());
    params.append('year', monthYear.year.toString());
  }
  
  return useQuery({
    queryKey: adminKeys.financials({ range, monthYear }),
    queryFn: () => adminFetcher(`/api/admin/financials?${params.toString()}`, session?.access_token),
    staleTime: ADMIN_CACHE_TIMES.STANDARD,
    enabled: !!session?.access_token,
    ...options,
  });
}

/**
 * Hook to fetch usage data
 */
export function useAdminUsage(range = '30d', options = {}) {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: adminKeys.usage(range),
    queryFn: () => adminFetcher(`/api/admin/usage?range=${range}`, session?.access_token),
    staleTime: ADMIN_CACHE_TIMES.STANDARD,
    enabled: !!session?.access_token,
    ...options,
  });
}

/**
 * Hook to fetch retention data
 */
export function useAdminRetention(options = {}) {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: adminKeys.retention(),
    queryFn: () => adminFetcher('/api/admin/retention', session?.access_token),
    staleTime: ADMIN_CACHE_TIMES.LONG,
    enabled: !!session?.access_token,
    ...options,
  });
}

/**
 * Hook to fetch Stripe data
 */
export function useAdminStripe(range = '30d', options = {}) {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: adminKeys.stripe(range),
    queryFn: () => adminFetcher(`/api/admin/stripe?range=${range}`, session?.access_token),
    staleTime: ADMIN_CACHE_TIMES.STANDARD,
    enabled: !!session?.access_token,
    ...options,
  });
}

/**
 * Hook to fetch site analytics
 */
export function useAdminSiteAnalytics(range = '30d', options = {}) {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: adminKeys.siteAnalytics(range),
    queryFn: () => adminFetcher(`/api/admin/site-analytics?range=${range}`, session?.access_token),
    staleTime: ADMIN_CACHE_TIMES.STANDARD,
    enabled: !!session?.access_token,
    ...options,
  });
}

/**
 * Hook to fetch marketing analytics
 */
export function useAdminMarketingAnalytics(range = '30d', options = {}) {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: adminKeys.marketingAnalytics(range),
    queryFn: () => adminFetcher(`/api/admin/marketing-analytics?range=${range}`, session?.access_token),
    staleTime: ADMIN_CACHE_TIMES.STANDARD,
    enabled: !!session?.access_token,
    ...options,
  });
}

/**
 * Hook to fetch advanced analytics
 */
export function useAdminAdvancedAnalytics(range = '30d', options = {}) {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: adminKeys.advancedAnalytics(range),
    queryFn: () => adminFetcher(`/api/admin/advanced-analytics?range=${range}`, session?.access_token),
    staleTime: ADMIN_CACHE_TIMES.LONG,
    enabled: !!session?.access_token,
    ...options,
  });
}

/**
 * Hook to fetch email stats
 */
export function useAdminEmails(view = 'stats', options = {}) {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: adminKeys.emails(view),
    queryFn: () => adminFetcher(`/api/admin/emails?view=${view}`, session?.access_token),
    staleTime: ADMIN_CACHE_TIMES.SHORT,
    enabled: !!session?.access_token,
    ...options,
  });
}

/**
 * Hook to fetch AL trends
 */
export function useAdminALTrends(days = 30, options = {}) {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: adminKeys.alTrends(days),
    queryFn: () => adminFetcher(`/api/admin/al-trends?days=${days}`, session?.access_token),
    staleTime: ADMIN_CACHE_TIMES.STANDARD,
    enabled: !!session?.access_token,
    ...options,
  });
}

/**
 * Hook to fetch AL usage
 */
export function useAdminALUsage(range = '30d', options = {}) {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: adminKeys.alUsage(range),
    queryFn: () => adminFetcher(`/api/admin/al-usage?range=${range}`, session?.access_token),
    staleTime: ADMIN_CACHE_TIMES.STANDARD,
    enabled: !!session?.access_token,
    ...options,
  });
}

/**
 * Hook to fetch AI cost summary
 */
export function useAdminAICostSummary(range = '30d', options = {}) {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: adminKeys.aiCostSummary(range),
    queryFn: () => adminFetcher(`/api/admin/ai-cost-summary?range=${range}`, session?.access_token),
    staleTime: ADMIN_CACHE_TIMES.STANDARD,
    enabled: !!session?.access_token,
    ...options,
  });
}

/**
 * Hook to fetch content growth data
 */
export function useAdminContentGrowth(days = 30, options = {}) {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: adminKeys.contentGrowth(days),
    queryFn: () => adminFetcher(`/api/admin/content-growth?days=${days}`, session?.access_token),
    staleTime: ADMIN_CACHE_TIMES.STANDARD,
    enabled: !!session?.access_token,
    ...options,
  });
}

/**
 * Hook to fetch external costs
 */
export function useAdminExternalCosts(range = '30d', options = {}) {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: adminKeys.externalCosts(range),
    queryFn: () => adminFetcher(`/api/admin/external-costs?range=${range}`, session?.access_token),
    staleTime: ADMIN_CACHE_TIMES.STANDARD,
    enabled: !!session?.access_token,
    ...options,
  });
}

/**
 * Hook to fetch health metrics
 */
export function useAdminHealth(options = {}) {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: adminKeys.health(),
    queryFn: () => adminFetcher('/api/admin/health', session?.access_token),
    staleTime: ADMIN_CACHE_TIMES.SHORT,
    enabled: !!session?.access_token,
    ...options,
  });
}

/**
 * Hook to fetch alerts
 */
export function useAdminAlerts(options = {}) {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: adminKeys.alerts(),
    queryFn: () => adminFetcher('/api/admin/alerts', session?.access_token),
    staleTime: ADMIN_CACHE_TIMES.SHORT,
    enabled: !!session?.access_token,
    ...options,
  });
}

// =============================================================================
// MUTATION HOOKS
// =============================================================================

/**
 * Hook to delete a financial entry
 */
export function useDeleteFinancialEntry() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  
  return useMutation({
    mutationFn: async (entryId) => {
      const res = await fetch(`/api/admin/financials?id=${entryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });
      if (!res.ok) {
        throw new Error('Failed to delete entry');
      }
      return res.json();
    },
    onSuccess: () => {
      // Invalidate all financials queries
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}

/**
 * Hook to fetch multiple admin data sources in parallel
 * Useful for the main admin dashboard
 */
export function useAdminDashboardData(range = '30d', options = {}) {
  const { session } = useAuth();
  const token = session?.access_token;
  
  // Use multiple queries that will run in parallel
  const dashboard = useAdminDashboard(range, options);
  const financials = useAdminFinancials(range, null, options);
  const usage = useAdminUsage(range, options);
  const stripe = useAdminStripe(range, options);
  const siteAnalytics = useAdminSiteAnalytics(range, options);
  
  return {
    dashboard,
    financials,
    usage,
    stripe,
    siteAnalytics,
    isLoading: dashboard.isLoading || financials.isLoading || usage.isLoading,
    isError: dashboard.isError || financials.isError || usage.isError,
  };
}
