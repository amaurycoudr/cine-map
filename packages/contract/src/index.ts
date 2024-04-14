import { initContract } from '@ts-rest/core';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

const c = initContract();

const mapSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  movies: z.array(z.object({ id: z.number(), title: z.string(), posterPath: z.string() })),
  description: z.string().optional(),
  isDraft: z.boolean().optional(),
});

export const contract = c.router({
  searchTmdb: {
    method: 'GET',
    path: '/tmdb/search',
    responses: {
      200: z.array(
        z.object({
          id: z.number(),
          originalTitle: z.string().openapi({ example: 'The name of the rose' }),
          overview: z.string(),
          posterPath: z.string().nullable(),
          releaseDate: z.string(),
          title: z.string(),
        }),
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
  createMaps: {
    method: 'POST',
    path: '/maps',
    body: z.object({}),
    responses: {
      201: z.object({ id: z.number() }),
    },
  },
  patchMaps: {
    method: 'PATCH',
    path: '/maps/:id',
    body: z.object({
      title: z.string().min(3).optional(),
      description: z.string().min(5).optional(),
      isDraft: z.boolean().optional(),
    }),
    responses: {
      200: mapSchema,
      400: z.object({ error: z.enum(['invalidToSave']) }),
    },
  },
  addMovieToMap: {
    method: 'POST',
    path: '/maps/:id/movies',
    body: z.object({ tmdbId: z.number() }),
    responses: { 200: mapSchema },
  },
});
