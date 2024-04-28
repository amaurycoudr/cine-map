import { initContract } from '@ts-rest/core';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { z } from 'zod';

import { GENDERS, GENDERS_TRANSCO, Gender, JOBS, JOBS_TRANSCO, Jobs, getJobFromTmbDepartment, getJobFromTmdb } from './transco';

export { GENDERS, GENDERS_TRANSCO, Gender, JOBS, JOBS_TRANSCO, Jobs, getJobFromTmbDepartment, getJobFromTmdb };

extendZodWithOpenApi(z);

const c = initContract();

const mapSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  movies: z.array(
    z.object({
      id: z.number(),
      title: z.string(),
      poster: z.string().nullable().optional(),
      tmdbId: z.number().nullable(),
      releaseDate: z.string(),
      overview: z.string().nullable().optional(),
    }),
  ),
  description: z.string().optional(),
  isDraft: z.boolean().optional(),
});

const personSchema = z.object({
  id: z.number(),
  name: z.string(),
  birthday: z.string().nullable(),
  picture: z.string().nullable(),
  deathday: z.string().nullable(),
  gender: z.string(),
  knownFor: z.string(),
});

const castsSchema = z.object({
  cast: z.array(
    z.object({
      character: z.string(),
      person: personSchema,
    }),
  ),
});
const crewSchema = z.object({
  crew: z.array(
    z.object({
      person: personSchema,
      job: z.enum(['0', '1', '2', '3', '4', '5', '6', '7']),
    }),
  ),
});
const allocineRatings = z.object({
  allocineRatings: z.object({ critic: z.number().nullable(), spectator: z.number().nullable(), link: z.string().nullable() }),
});
const movieSchema = z.object({
  id: z.number(),
  title: z.string(),
  releaseDate: z.string(),
  poster: z.string(),
  originalLanguage: z.string(),
  overview: z.string(),
  duration: z.number(),
  tagLine: z.string(),
});

export const contract = c.router(
  {
    searchTmdb: {
      method: 'GET',
      path: '/tmdb/search',
      responses: {
        200: z.array(
          z.object({
            id: z.number(),
            originalTitle: z.string().openapi({ example: 'The name of the rose' }),
            overview: z.string(),
            poster: z.string().nullable(),
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
            {
              description: 'Response returned when one/multiple filed are invalid and isDraft is switch to false. Returned the list of invalid filed',
            },
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
    getMovie: {
      method: 'GET',
      path: '/movies/:id',
      pathParams: z.object({ id: z.string().or(z.number()) }),
      responses: {
        200: movieSchema.and(castsSchema).and(crewSchema).and(allocineRatings),
        404: z.object({ error: z.enum(['Not found']) }),
      },
    },
    getMovies: {
      method: 'GET',
      path: '/movies',
      responses: {
        200: z.array(movieSchema.and(allocineRatings).and(crewSchema).and(castsSchema)),
      },
    },
  },
  { pathPrefix: '/api/v1' },
);
