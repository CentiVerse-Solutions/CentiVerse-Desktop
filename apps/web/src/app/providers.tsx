import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

/**
 * §5.3 -- the provider stack. Server state lives in TanStack Query; Context is
 * left holding only auth session, theme and toasts.
 */
export const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });

const QueryProvider = ({ children }: { children: ReactNode }) => {
  const [client] = useState(makeQueryClient);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

export default QueryProvider;
