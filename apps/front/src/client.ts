import { contract } from '@cine-map/contract';
import { QueryClient } from '@tanstack/react-query';
import envConfig from './utils/config';
import { initClient } from '@ts-rest/core';

export const client = initClient(contract, {
  baseUrl: envConfig.backendUrl,
  baseHeaders: {},
  throwOnUnknownStatus: true,
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000 },
  },
});
