import { QueryClient } from '@tanstack/react-query';


export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
			staleTime: 5 * 60 * 1000,  // 5 minutes — prevents refetch on navigation
			gcTime: 10 * 60 * 1000,    // 10 minutes — keep unused data in cache
		},
	},
});