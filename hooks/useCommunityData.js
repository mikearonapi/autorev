'use client';

/**
 * React Query Hooks for Community Data
 * 
 * Provides cached, deduplicated data fetching for community-related data.
 * Includes builds feed, build details, likes, and comments.
 * 
 * Uses apiClient for standardized error handling and cross-platform support.
 * 
 * @module hooks/useCommunityData
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';

import apiClient from '@/lib/apiClient';

import { CACHE_TIMES } from './useCarData';

// =============================================================================
// QUERY KEY FACTORIES
// =============================================================================

/**
 * Standardized query keys for community data.
 * Using factories ensures consistent cache invalidation.
 */
export const communityKeys = {
  all: ['community'],
  
  // Builds
  builds: () => [...communityKeys.all, 'builds'],
  buildsList: (filters) => [...communityKeys.builds(), 'list', filters],
  buildDetail: (slug) => [...communityKeys.builds(), 'detail', slug],
  
  // Posts (likes and comments)
  posts: () => [...communityKeys.all, 'posts'],
  postLike: (postId) => [...communityKeys.posts(), postId, 'like'],
  postComments: (postId) => [...communityKeys.posts(), postId, 'comments'],
  linkedPost: (buildId) => [...communityKeys.posts(), 'linked', buildId],
};

// =============================================================================
// FETCHER FUNCTIONS (using apiClient)
// =============================================================================

/**
 * Fetch community builds list
 */
async function fetchBuilds({ limit = 20, sort = 'algorithm', seed = null, cursor = null }) {
  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  params.append('sort', sort);
  if (seed) params.append('seed', seed);
  if (cursor) params.append('cursor', cursor);
  
  const data = await apiClient.get(`/api/community/builds?${params.toString()}`);
  return {
    builds: data.builds || [],
    nextCursor: data.nextCursor,
    hasMore: data.hasMore,
  };
}

/**
 * Fetch single build details
 */
async function fetchBuildDetail(slug) {
  return apiClient.get(`/api/community/builds/${slug}`);
}

/**
 * Fetch like status for a post
 */
async function fetchLikeStatus(postId) {
  const data = await apiClient.get(`/api/community/posts/${postId}/like`);
  return {
    liked: data.liked,
    count: data.likeCount,
  };
}

/**
 * Fetch comments for a post
 */
async function fetchComments(postId) {
  const data = await apiClient.get(`/api/community/posts/${postId}/comments`);
  return {
    comments: data.comments || [],
    guidance: data.guidance,
  };
}

// =============================================================================
// QUERY HOOKS
// =============================================================================

/**
 * Hook to fetch community builds feed
 * @param {object} options - Query options
 */
export function useCommunityBuilds({ limit = 20, sort = 'algorithm', seed = null } = {}, options = {}) {
  return useQuery({
    queryKey: communityKeys.buildsList({ limit, sort, seed }),
    queryFn: () => fetchBuilds({ limit, sort, seed }),
    staleTime: CACHE_TIMES.FAST,
    ...options,
  });
}

/**
 * Hook to fetch community builds with infinite scroll
 */
export function useCommunityBuildsInfinite({ limit = 20, sort = 'algorithm', seed = null } = {}, options = {}) {
  return useInfiniteQuery({
    queryKey: communityKeys.buildsList({ limit, sort, seed, infinite: true }),
    queryFn: ({ pageParam = null }) => fetchBuilds({ limit, sort, seed, cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    staleTime: CACHE_TIMES.FAST,
    ...options,
  });
}

/**
 * Hook to fetch a single build's details
 * @param {string} slug - Build slug
 * @param {object} options - React Query options
 */
export function useBuildDetail(slug, options = {}) {
  return useQuery({
    queryKey: communityKeys.buildDetail(slug),
    queryFn: () => fetchBuildDetail(slug),
    staleTime: CACHE_TIMES.STANDARD,
    enabled: !!slug,
    ...options,
  });
}

/**
 * Hook to fetch like status for a post
 * @param {string} postId - Post ID
 * @param {object} options - React Query options
 */
export function usePostLikeStatus(postId, options = {}) {
  return useQuery({
    queryKey: communityKeys.postLike(postId),
    queryFn: () => fetchLikeStatus(postId),
    staleTime: CACHE_TIMES.FAST,
    enabled: !!postId,
    ...options,
  });
}

/**
 * Hook to fetch comments for a post
 * @param {string} postId - Post ID
 * @param {object} options - React Query options
 */
export function usePostComments(postId, options = {}) {
  return useQuery({
    queryKey: communityKeys.postComments(postId),
    queryFn: () => fetchComments(postId),
    staleTime: CACHE_TIMES.FAST,
    enabled: !!postId,
    ...options,
  });
}

/**
 * Hook to fetch linked community post for a build
 * Used by UpgradeCenter to check if build has been shared
 * 
 * @param {string} buildId - Build ID
 * @param {object} options - React Query options
 * @example
 * const { data: linkedPost, isLoading } = useLinkedPost(buildId);
 */
export function useLinkedPost(buildId, options = {}) {
  return useQuery({
    queryKey: communityKeys.linkedPost(buildId),
    queryFn: async () => {
      const data = await apiClient.get(`/api/community/posts?buildId=${buildId}`);
      return data.post || null;
    },
    staleTime: CACHE_TIMES.FAST,
    enabled: !!buildId,
    ...options,
  });
}

// =============================================================================
// MUTATION HOOKS
// =============================================================================

/**
 * Hook to toggle like on a post
 */
export function useToggleLike() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ postId }) => {
      const res = await fetch(`/api/community/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        throw new Error('Failed to toggle like');
      }
      return res.json();
    },
    onMutate: async ({ postId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: communityKeys.postLike(postId) });
      
      // Snapshot previous value
      const previousLike = queryClient.getQueryData(communityKeys.postLike(postId));
      
      // Optimistically update
      if (previousLike) {
        queryClient.setQueryData(communityKeys.postLike(postId), {
          liked: !previousLike.liked,
          count: previousLike.liked ? previousLike.count - 1 : previousLike.count + 1,
        });
      }
      
      return { previousLike };
    },
    onError: (err, { postId }, context) => {
      // Rollback on error
      if (context?.previousLike) {
        queryClient.setQueryData(communityKeys.postLike(postId), context.previousLike);
      }
    },
    onSettled: (data, error, { postId }) => {
      // Always refetch after mutation settles
      queryClient.invalidateQueries({ queryKey: communityKeys.postLike(postId) });
    },
  });
}

/**
 * Hook to add a comment
 */
export function useAddComment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ postId, content }) => {
      const res = await fetch(`/api/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) {
        const error = new Error(data.reason || data.error || 'Failed to add comment');
        error.rejected = data.rejected;
        error.reason = data.reason;
        throw error;
      }
      return data;
    },
    onSuccess: (data, { postId }) => {
      queryClient.invalidateQueries({ queryKey: communityKeys.postComments(postId) });
    },
  });
}

/**
 * Hook to update a comment
 */
export function useUpdateComment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ postId, commentId, content }) => {
      const res = await fetch(`/api/community/posts/${postId}/comments`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, content }),
      });
      const data = await res.json();
      if (!res.ok) {
        const error = new Error(data.reason || data.error || 'Failed to update comment');
        error.rejected = data.rejected;
        error.reason = data.reason;
        throw error;
      }
      return data;
    },
    onSuccess: (data, { postId }) => {
      queryClient.invalidateQueries({ queryKey: communityKeys.postComments(postId) });
    },
  });
}

/**
 * Hook to delete a comment
 */
export function useDeleteComment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ postId, commentId }) => {
      const res = await fetch(`/api/community/posts/${postId}/comments?commentId=${commentId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete comment');
      }
      return res.json();
    },
    onSuccess: (data, { postId }) => {
      queryClient.invalidateQueries({ queryKey: communityKeys.postComments(postId) });
    },
  });
}
