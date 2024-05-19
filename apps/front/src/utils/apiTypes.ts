import { contract } from '@cine-map/contract';
import { ClientInferResponseBody } from '@ts-rest/core';

export type Movie = ClientInferResponseBody<typeof contract.getMovies, 200>[number];
export type Crew = Movie['crew'];
