import { QueryClient } from '@tanstack/react-query';


export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
			staleTime: 60 * 1000,      // 1 minute — balances freshness with avoiding redundant fetches
			gcTime: 5 * 60 * 1000,     // 5 minutes — keep unused data in cache
		},
	},
});