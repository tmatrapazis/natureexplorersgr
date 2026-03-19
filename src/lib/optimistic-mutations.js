/**
 * Optimistic UI Update Helpers for React Query Mutations
 * 
 * Provides reusable patterns for implementing optimistic updates across the app.
 * These helpers ensure immediate UI feedback while maintaining data consistency.
 */

/**
 * Creates an optimistic create mutation handler
 * @param {object} queryClient - React Query client instance
 * @param {string[]} queryKey - Query key to update
 * @param {Function} generateOptimisticData - Function to generate temporary data
 * @returns {object} - onMutate and onSettled handlers
 */
export function createOptimisticCreate(queryClient, queryKey, generateOptimisticData) {
  return {
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(queryKey);

      // Optimistically update cache
      queryClient.setQueryData(queryKey, (old) => {
        const optimisticItem = generateOptimisticData(newData);
        return Array.isArray(old) ? [...old, optimisticItem] : optimisticItem;
      });

      return { previousData };
    },
    onError: (err, newData, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSettled: () => {
      // Refetch to ensure sync
      queryClient.invalidateQueries({ queryKey });
    },
  };
}

/**
 * Creates an optimistic update mutation handler
 * @param {object} queryClient - React Query client instance
 * @param {string[]} queryKey - Query key to update
 * @param {Function} updateFn - Function to update the data
 * @returns {object} - onMutate and onSettled handlers
 */
export function createOptimisticUpdate(queryClient, queryKey, updateFn) {
  return {
    onMutate: async (updatedData) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old) => {
        if (Array.isArray(old)) {
          return old.map((item) => updateFn(item, updatedData));
        }
        return updateFn(old, updatedData);
      });

      return { previousData };
    },
    onError: (err, updatedData, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  };
}

/**
 * Creates an optimistic delete mutation handler
 * @param {object} queryClient - React Query client instance
 * @param {string[]} queryKey - Query key to update
 * @param {Function} filterFn - Function to filter out deleted item
 * @returns {object} - onMutate and onSettled handlers
 */
export function createOptimisticDelete(queryClient, queryKey, filterFn) {
  return {
    onMutate: async (deleteId) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old) => {
        if (Array.isArray(old)) {
          return old.filter((item) => filterFn(item, deleteId));
        }
        return null;
      });

      return { previousData };
    },
    onError: (err, deleteId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  };
}

/**
 * Generic optimistic mutation wrapper
 * @param {object} queryClient - React Query client instance
 * @param {string[]} queryKey - Query key to update
 * @param {object} options - Mutation options
 * @returns {object} - Complete mutation handlers
 */
export function createOptimisticMutation(queryClient, queryKey, options = {}) {
  const { onMutate, onError, onSuccess, onSettled } = options;

  return {
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);
      
      if (onMutate) {
        onMutate(variables, previousData, queryClient);
      }

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      if (onError) {
        onError(err, variables, context);
      }
    },
    onSuccess: (data, variables, context) => {
      if (onSuccess) {
        onSuccess(data, variables, context);
      }
    },
    onSettled: (data, error, variables, context) => {
      queryClient.invalidateQueries({ queryKey });
      if (onSettled) {
        onSettled(data, error, variables, context);
      }
    },
  };
}