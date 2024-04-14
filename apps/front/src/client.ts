import { contract } from '@cine-map/contract';
import { initClient } from '@ts-rest/core';

export const client = initClient(contract, {
  baseUrl: 'http://localhost:3000',
  baseHeaders: {},
});
