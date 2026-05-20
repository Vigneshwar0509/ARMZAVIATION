import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ENV } from '@/src/config/env';

const isExpectedConnectivityError = (error: any): boolean => {
  if (!error) {
    return false;
  }

  if (
    error.isFrontendOnly ||
    error.isMixedContent ||
    error.isCspBlocked ||
    error.isNetworkError ||
    error.isBackendUnavailable
  ) {
    return true;
  }

  const message = String(error.message || '').toLowerCase();
  return (
    message.includes('blocked insecure api call') ||
    message.includes('network error') ||
    message.includes('backend is temporarily unreachable')
  );
};

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Only show error toast for queries that have already loaded data
      // This prevents double-toasts on initial load failures
      if (query.state.data !== undefined) {
        toast.error(`Something went wrong: ${error.message}`);
      }

      if (!ENV.FRONTEND_ONLY && !isExpectedConnectivityError(error)) {
        console.error('Query error:', error);
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      if (!ENV.FRONTEND_ONLY && !isExpectedConnectivityError(error)) {
        console.error('Mutation error:', error);
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error: any) => {
        if (isExpectedConnectivityError(error)) {
          return false;
        }

        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: (failureCount, error: any) => {
        if (isExpectedConnectivityError(error)) {
          return false;
        }

        return failureCount < 1;
      },
      networkMode: 'offlineFirst',
    },
  },
});
