import { contract } from '@cine-map/contract';
import { QueryClient } from '@tanstack/react-query';
import { initClient } from '@ts-rest/core';

export const client = initClient(contract, {
  baseUrl: 'http://localhost:3000',
  baseHeaders: {},
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
    },
  },
});
