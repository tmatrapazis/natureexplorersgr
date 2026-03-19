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

/**
 * Optimistic trip creation handler for instant UI feedback
 * @param {object} queryClient - React Query client instance
 * @param {string} organizerCode - Organizer code for filtering
 * @returns {object} - Mutation handlers with optimistic updates
 */
export function createOptimisticTripCreate(queryClient, organizerCode) {
  return {
    onMutate: async (newTrip) => {
      await queryClient.cancelQueries({ queryKey: ['my-trips', organizerCode] });
      await queryClient.cancelQueries({ queryKey: ['hiking-trips'] });
      
      const previousMyTrips = queryClient.getQueryData(['my-trips', organizerCode]);
      const previousAllTrips = queryClient.getQueryData(['hiking-trips']);
      
      const optimisticTrip = {
        ...newTrip,
        id: 'temp-' + Date.now(),
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        view_count: 0,
        booked_clicks: 0,
      };
      
      queryClient.setQueryData(['my-trips', organizerCode], (old) =>
        Array.isArray(old) ? [optimisticTrip, ...old] : [optimisticTrip]
      );
      
      queryClient.setQueryData(['hiking-trips'], (old) =>
        Array.isArray(old) ? [optimisticTrip, ...old] : [optimisticTrip]
      );
      
      return { previousMyTrips, previousAllTrips };
    },
    onError: (err, newTrip, context) => {
      if (context?.previousMyTrips) {
        queryClient.setQueryData(['my-trips', organizerCode], context.previousMyTrips);
      }
      if (context?.previousAllTrips) {
        queryClient.setQueryData(['hiking-trips'], context.previousAllTrips);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['my-trips', organizerCode] });
      queryClient.invalidateQueries({ queryKey: ['hiking-trips'] });
    },
  };
}

/**
 * Optimistic trip update handler for instant UI feedback
 * @param {object} queryClient - React Query client instance
 * @param {string} tripId - Trip ID being updated
 * @param {string} organizerCode - Organizer code for filtering
 * @returns {object} - Mutation handlers with optimistic updates
 */
export function createOptimisticTripUpdate(queryClient, tripId, organizerCode) {
  return {
    onMutate: async (updatedData) => {
      await queryClient.cancelQueries({ queryKey: ['my-trips', organizerCode] });
      await queryClient.cancelQueries({ queryKey: ['hiking-trips'] });
      await queryClient.cancelQueries({ queryKey: ['trip', tripId] });
      
      const previousMyTrips = queryClient.getQueryData(['my-trips', organizerCode]);
      const previousAllTrips = queryClient.getQueryData(['hiking-trips']);
      const previousTrip = queryClient.getQueryData(['trip', tripId]);
      
      const updateFn = (old) => {
        if (Array.isArray(old)) {
          return old.map((trip) =>
            trip.id === tripId ? { ...trip, ...updatedData, updated_date: new Date().toISOString() } : trip
          );
        }
        return old;
      };
      
      queryClient.setQueryData(['my-trips', organizerCode], updateFn);
      queryClient.setQueryData(['hiking-trips'], updateFn);
      queryClient.setQueryData(['trip', tripId], (old) =>
        old ? { ...old, ...updatedData, updated_date: new Date().toISOString() } : old
      );
      
      return { previousMyTrips, previousAllTrips, previousTrip };
    },
    onError: (err, updatedData, context) => {
      if (context?.previousMyTrips) {
        queryClient.setQueryData(['my-trips', organizerCode], context.previousMyTrips);
      }
      if (context?.previousAllTrips) {
        queryClient.setQueryData(['hiking-trips'], context.previousAllTrips);
      }
      if (context?.previousTrip) {
        queryClient.setQueryData(['trip', tripId], context.previousTrip);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['my-trips', organizerCode] });
      queryClient.invalidateQueries({ queryKey: ['hiking-trips'] });
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
    },
  };
}

/**
 * Optimistic trip deletion handler for instant UI feedback
 * @param {object} queryClient - React Query client instance
 * @param {string} tripId - Trip ID being deleted
 * @param {string} organizerCode - Organizer code for filtering
 * @returns {object} - Mutation handlers with optimistic updates
 */
export function createOptimisticTripDelete(queryClient, tripId, organizerCode) {
  return {
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['my-trips', organizerCode] });
      await queryClient.cancelQueries({ queryKey: ['hiking-trips'] });
      
      const previousMyTrips = queryClient.getQueryData(['my-trips', organizerCode]);
      const previousAllTrips = queryClient.getQueryData(['hiking-trips']);
      
      const filterFn = (old) => {
        if (Array.isArray(old)) {
          return old.filter((trip) => trip.id !== tripId);
        }
        return old;
      };
      
      queryClient.setQueryData(['my-trips', organizerCode], filterFn);
      queryClient.setQueryData(['hiking-trips'], filterFn);
      
      return { previousMyTrips, previousAllTrips };
    },
    onError: (err, variables, context) => {
      if (context?.previousMyTrips) {
        queryClient.setQueryData(['my-trips', organizerCode], context.previousMyTrips);
      }
      if (context?.previousAllTrips) {
        queryClient.setQueryData(['hiking-trips'], context.previousAllTrips);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['my-trips', organizerCode] });
      queryClient.invalidateQueries({ queryKey: ['hiking-trips'] });
    },
  };
}