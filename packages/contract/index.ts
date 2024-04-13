import { initContract } from '@ts-rest/core';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

const c = initContract();

export const contract = c.router({
  searchTmdb: {
    method: 'GET',
    path: '/tmdb/search',
    responses: {
      200: z.array(
        z.object({
          id: z.number(),
          originalTitle: z
            .string()
            .openapi({ example: 'The name of the rose' }),
          overview: z.string(),
          posterPath: z.string().nullable(),
          releaseDate: z.string(),
          title: z.string(),
        })
      ),
    },
    query: z.object({
      q: z.string(),
    }),
  },
  postTmdbMovie: {
    method: 'POST',
    path: '/tmdb/movie/:id',
    body: z.object({}),
    pathParams: z.object({ id: z.string() }),
    responses: {
      201: z.object({ id: z.number() }),
      404: z.object({ error: z.string() }),
    },
  },
});
