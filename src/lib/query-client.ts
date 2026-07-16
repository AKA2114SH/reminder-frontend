import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error: any) => {
        // Only retry up to 3 times
        if (failureCount >= 3) return false;
        
        // Don't retry on client side status errors (400, 401, 403, 404, etc.)
        if (error?.statusCode >= 400 && error?.statusCode < 500) {
          return false;
        }
        
        return true;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      refetchOnWindowFocus: false, // Prevents aggressive refetching when switching tabs
    },
  },
});
