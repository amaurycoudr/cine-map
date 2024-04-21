import { initContract } from '@ts-rest/core';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

const c = initContract();

const mapSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  movies: z.array(
    z.object({
      id: z.number(),
      title: z.string(),
      posterPath: z.string().nullable().optional(),
      tmdbId: z.number().nullable(),
      releaseDate: z.string(),
      overview: z.string().nullable().optional(),
    }),
  ),
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
  createMap: {
    method: 'POST',
    path: '/maps',
    body: z.object({}),
    responses: {
      201: mapSchema,
    },
  },
  getMap: {
    method: 'GET',
    path: '/maps/:id',
    pathParams: z.object({ id: z.string().or(z.number()) }),
    responses: {
      200: mapSchema,
      404: z.object({ error: z.enum(['Not found']) }),
    },
  },
  patchMaps: {
    method: 'PATCH',
    path: '/maps/:id',
    pathParams: z.object({ id: z.string().or(z.number()) }),
    body: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      isDraft: z.boolean().optional(),
    }),
    responses: {
      200: mapSchema,
      400: z
        .object(
          { error: z.array(z.enum(['title', 'movies', 'description'])).openapi({ example: ['title', 'description'] }) },
          { description: 'Response returned when one/multiple filed are invalid and isDraft is switch to false. Returned the list of invalid filed' },
        )
        .or(z.object({ error: z.enum(['not editable map']) }, { description: 'Response returned when isDrat is false' })),

      404: z.object({ error: z.enum(['Not found']) }),
    },
  },
  addMovieToMap: {
    method: 'POST',
    path: '/maps/:id/movies',
    pathParams: z.object({ id: z.string().or(z.number()) }),
    body: z.object({ tmdbId: z.number() }),
    responses: {
      200: mapSchema,
      400: z.object({ error: z.enum(['not editable map']) }, { description: 'Response returned when isDrat is false' }),
      404: z.object({ error: z.enum(['Not found']) }),
    },
  },
  deleteMovieFromMap: {
    method: 'DELETE',
    path: '/maps/:id/movies/:movieId',
    pathParams: z.object({ id: z.string().or(z.number()), movieId: z.string().or(z.number()) }),
    body: z.object({}),
    responses: {
      200: mapSchema,
      400: z.object({ error: z.enum(['not editable map']) }, { description: 'Response returned when isDrat is false' }),
      404: z.object({ error: z.enum(['Not found']) }),
    },
  },
});
