'use client';

/**
 * React Query Provider
 * 
 * Provides global caching and data fetching state management.
 * Configured with sensible defaults for automotive data:
 * - 5 minute stale time (data considered fresh)
 * - 30 minute garbage collection (data kept in memory)
 * - No refetch on window focus (prevent unnecessary requests)
 * 
 * @module components/providers/QueryProvider
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

/**
 * Create a QueryClient with optimized defaults
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is fresh for 5 minutes
        staleTime: 5 * 60 * 1000,
        // Keep unused data in cache for 30 minutes
        gcTime: 30 * 60 * 1000,
        // Don't refetch when window regains focus
        refetchOnWindowFocus: false,
        // Don't refetch on reconnect by default
        refetchOnReconnect: false,
        // Retry failed requests once
        retry: 1,
        // Retry delay
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      },
      mutations: {
        // Retry mutations once
        retry: 1,
      },
    },
  });
}

// Browser: create client once and reuse
let browserQueryClient = undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always create a new client
    return makeQueryClient();
  } else {
    // Browser: reuse existing client
    if (!browserQueryClient) {
      browserQueryClient = makeQueryClient();
    }
    return browserQueryClient;
  }
}

/**
 * QueryProvider Component
 * 
 * Wraps the app with React Query's QueryClientProvider.
 * Handles SSR properly by creating new client on server,
 * reusing client on browser.
 */
export function QueryProvider({ children }) {
  // Use state to ensure we only create the client once on the client
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export default QueryProvider;

