import { z } from 'zod';
import { Gender, GENDERS, getJobFromTmbDepartment, getJobFromTmdb } from '../utils/transco';

export const tmdbMovieDetailsSchema = z
  .object({
    backdrop_path: z.string().nullable(),
    original_language: z.string(),
    original_title: z.string(),
    id: z.number(),
    overview: z.string(),
    poster_path: z.string().nullable(),
    release_date: z.string(),
    runtime: z.number(),
    tagline: z.string(),
    title: z.string(),
  })
  .transform(({ backdrop_path, original_language, original_title, id, overview, poster_path, release_date, runtime, tagline, title }) => ({
    backdropPath: backdrop_path,
    originalLanguage: original_language,
    tmdbId: id,
    originalTitle: original_title,
    overview,
    posterPath: poster_path,
    releaseDate: release_date,
    runtime,
    tagline,
    title,
  }));

export type TmdbMovieDetails = z.infer<typeof tmdbMovieDetailsSchema>;

export const tmdbMovieCreditSchema = z.object({
  cast: z.array(
    z
      .object({ id: z.number(), character: z.string(), order: z.number() })
      .transform(({ character, id, order }) => ({ tmdbId: id, character, order })),
  ),
  crew: z.array(z.object({ id: z.number(), job: z.string() }).transform(({ id, job }) => ({ tmdbId: id, job: getJobFromTmdb(job) }))),
});

export type TmdbMovieCredit = z.infer<typeof tmdbMovieCreditSchema>;

export const tmdbPersonDetailSchema = z
  .object({
    birthday: z.string().nullable(),
    deathday: z.string().nullable(),
    gender: z
      .number()
      .transform((i) => `${i}`)
      .refine((i): i is Gender => GENDERS.includes(i as Gender)),
    id: z.number(),
    known_for_department: z.string(),
    name: z.string(),
  })
  .transform(({ birthday, deathday, gender, id, known_for_department, name }) => ({
    birthday,
    deathday,
    gender: gender,
    tmdbId: id,
    knownFor: getJobFromTmbDepartment(known_for_department),
    name,
  }));
export type TmdbPersonDetail = z.infer<typeof tmdbPersonDetailSchema>;

export const tmdbSearchMovie = z
  .object({
    id: z.number(),
    original_title: z.string(),
    overview: z.string(),
    poster_path: z.string().nullable(),
    release_date: z.string(),
    title: z.string(),
  })
  .transform(({ release_date, poster_path, original_title, ...obj }) => ({
    ...obj,
    releaseDate: release_date,
    posterPath: poster_path,
    originalTitle: original_title,
  }));

export type TmdbSearchMovie = z.infer<typeof tmdbSearchMovie>;

export const TMDB_API_URL = 'https://api.themoviedb.org/3/';

export const TMDB_IMG_URL = 'https://image.tmdb.org/t/p/original/';

export const TMDB_ENDPOINTS = {
  credits: (id: number) => `/movie/${id}/credits`,
  movie: (id: number) => `/movie/${id}`,
  person: (id: number) => `person/${id}`,
  searchMovie: () => '/search/movie',
};
