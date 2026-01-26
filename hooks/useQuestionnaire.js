/**
 * useQuestionnaire Hook
 * 
 * React Query hooks for the Enthusiast Profile questionnaire system.
 * Provides data fetching, caching, and mutation utilities.
 * 
 * @example
 * const { responses, summary, submitResponse, isLoading } = useQuestionnaire(userId);
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { 
  QUESTIONNAIRE_LIBRARY, 
  calculateCategoryCompletion,
  getNextQuestions,
} from '@/data/questionnaireLibrary';

// Query keys
export const questionnaireKeys = {
  all: ['questionnaire'],
  user: (userId) => [...questionnaireKeys.all, 'user', userId],
  responses: (userId) => [...questionnaireKeys.user(userId), 'responses'],
  summary: (userId) => [...questionnaireKeys.user(userId), 'summary'],
  nextQuestions: (userId, options) => [...questionnaireKeys.user(userId), 'next', options],
};

/**
 * Fetch all questionnaire data for a user
 */
async function fetchQuestionnaireData(userId) {
  const res = await fetch(`/api/users/${userId}/questionnaire`);
  if (!res.ok) {
    throw new Error('Failed to fetch questionnaire data');
  }
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch questionnaire data');
  }
  return data.data;
}

/**
 * Submit questionnaire responses
 */
async function submitQuestionnaireResponses(userId, responses) {
  const res = await fetch(`/api/users/${userId}/questionnaire`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ responses }),
  });
  if (!res.ok) {
    throw new Error('Failed to save responses');
  }
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to save responses');
  }
  return data;
}

/**
 * Fetch next recommended questions
 */
async function fetchNextQuestions(userId, options = {}) {
  const params = new URLSearchParams();
  if (options.count) params.set('count', options.count);
  if (options.category) params.set('category', options.category);
  if (options.excludeIds?.length) params.set('excludeIds', options.excludeIds.join(','));
  
  const res = await fetch(`/api/users/${userId}/questionnaire/next?${params}`);
  if (!res.ok) {
    throw new Error('Failed to fetch next questions');
  }
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch next questions');
  }
  return data;
}

/**
 * Main questionnaire hook - combines responses, summary, and next questions
 * 
 * @param {string} userId - User ID
 * @param {Object} options - Hook options
 * @returns {Object} Questionnaire data and methods
 */
export function useQuestionnaire(userId, options = {}) {
  const queryClient = useQueryClient();
  const { enabled = true, refetchOnMount = true } = options;
  
  // Main data query
  const query = useQuery({
    queryKey: questionnaireKeys.responses(userId),
    queryFn: () => fetchQuestionnaireData(userId),
    enabled: Boolean(userId) && enabled,
    refetchOnMount,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Submit mutation
  const mutation = useMutation({
    mutationFn: ({ questionId, answer }) => {
      const question = QUESTIONNAIRE_LIBRARY.find(q => q.id === questionId);
      return submitQuestionnaireResponses(userId, {
        [questionId]: {
          ...answer,
          category: question?.category || 'core',
        },
      });
    },
    onMutate: async ({ questionId, answer }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: questionnaireKeys.responses(userId) });
      
      // Snapshot previous value
      const previousData = queryClient.getQueryData(questionnaireKeys.responses(userId));
      
      // Optimistically update
      queryClient.setQueryData(questionnaireKeys.responses(userId), (old) => {
        if (!old) return old;
        
        const newResponses = { ...old.responses, [questionId]: answer };
        const answeredIds = new Set(Object.keys(newResponses));
        const categoryCompletion = calculateCategoryCompletion(answeredIds);
        
        return {
          ...old,
          responses: newResponses,
          summary: {
            ...old.summary,
            answeredCount: answeredIds.size,
            profileCompletenessPct: Math.min(100, Math.round((answeredIds.size / QUESTIONNAIRE_LIBRARY.length) * 100)),
            categoryCompletion,
          },
          nextQuestions: getNextQuestions(answeredIds, 5).map(q => ({
            id: q.id,
            category: q.category,
            question: q.question,
            hint: q.hint,
            type: q.type,
            options: q.options,
            points: q.points,
          })),
          categoryCompletion,
        };
      });
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(questionnaireKeys.responses(userId), context.previousData);
      }
    },
    onSettled: () => {
      // Refetch after mutation settles
      queryClient.invalidateQueries({ queryKey: questionnaireKeys.responses(userId) });
    },
  });
  
  // Batch submit mutation
  const batchMutation = useMutation({
    mutationFn: (responses) => submitQuestionnaireResponses(userId, responses),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionnaireKeys.responses(userId) });
    },
  });
  
  // Computed values from query data
  const data = query.data || {};
  const responses = data.responses || {};
  const summary = data.summary || null;
  const nextQuestions = data.nextQuestions || [];
  const categoryCompletion = data.categoryCompletion || summary?.categoryCompletion || {};
  
  return {
    // Data
    responses,
    summary,
    nextQuestions,
    categoryCompletion,
    categories: data.categories,
    totalQuestions: data.totalQuestions || QUESTIONNAIRE_LIBRARY.length,
    
    // Query state
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    
    // Mutations
    submitResponse: (questionId, answer) => mutation.mutateAsync({ questionId, answer }),
    submitResponses: (responses) => batchMutation.mutateAsync(responses),
    isSubmitting: mutation.isPending || batchMutation.isPending,
    
    // Refetch
    refetch: query.refetch,
  };
}

/**
 * Hook to fetch just next questions (lighter weight)
 */
export function useNextQuestions(userId, options = {}) {
  const { count = 5, category = null, excludeIds = [], enabled = true } = options;
  
  return useQuery({
    queryKey: questionnaireKeys.nextQuestions(userId, { count, category }),
    queryFn: () => fetchNextQuestions(userId, { count, category, excludeIds }),
    enabled: Boolean(userId) && enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook to fetch just the profile summary
 */
export function useProfileSummary(userId, options = {}) {
  const { enabled = true } = options;
  
  const query = useQuery({
    queryKey: questionnaireKeys.summary(userId),
    queryFn: async () => {
      const data = await fetchQuestionnaireData(userId);
      return data.summary;
    },
    enabled: Boolean(userId) && enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    select: (data) => data, // Return summary directly
  });
  
  return {
    summary: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

/**
 * Prefetch questionnaire data (useful for preloading)
 */
export function usePrefetchQuestionnaire(userId) {
  const queryClient = useQueryClient();
  
  return () => {
    if (!userId) return;
    queryClient.prefetchQuery({
      queryKey: questionnaireKeys.responses(userId),
      queryFn: () => fetchQuestionnaireData(userId),
      staleTime: 1000 * 60 * 5,
    });
  };
}

// Default export for convenience
export default useQuestionnaire;
