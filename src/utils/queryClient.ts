
import { QueryClient } from "@tanstack/react-query";

/**
 * Shared Query Client instance with default configuration
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});
