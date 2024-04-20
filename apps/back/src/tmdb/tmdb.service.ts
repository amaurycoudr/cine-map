import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError, AxiosInstance } from 'axios';

import { tmdbMovieCreditSchema, TmdbMovieDetails, tmdbMovieDetailsSchema, tmdbPersonDetailSchema, tmdbSearchMovie } from './tmdb.type';
import { z } from 'zod';
import { PersonsService } from '../persons/persons.service';
import { MoviesService } from '../movies/movies.service';
import { throttledPromises } from '../utils/utils';
import { Jobs, JOBS_TRANSCO } from '../utils/transco';

const TMDB_API_URL = 'https://api.themoviedb.org/3/';

// let res = await get(TmdbService).handleMovie(238)

const TMDB_ENDPOINTS = {
  credits: (id: number) => `/movie/${id}/credits`,
  movie: (id: number) => `/movie/${id}`,
  person: (id: number) => `person/${id}`,
  searchMovie: () => '/search/movie',
};

@Injectable()
export class TmdbService {
  private axiosClient: AxiosInstance;

  constructor(
    private config: ConfigService,
    private readonly moviesService: MoviesService,
    private readonly personService: PersonsService,
  ) {
    this.axiosClient = axios.create({ baseURL: TMDB_API_URL });
    this.axiosClient.defaults.headers.common['Authorization'] = `Bearer ${this.config.get('TMDB_API_ACCESS_TOKEN')}`;
    this.axiosClient.defaults.params = {};
    this.axiosClient.defaults.params['language'] = 'fr-FR';
  }

  async findMovie(id: number) {
    const { data } = await this.axiosClient.get(TMDB_ENDPOINTS.movie(id));
    return tmdbMovieDetailsSchema.parse(data);
  }

  async findPerson(id: number) {
    const { data } = await this.axiosClient.get(TMDB_ENDPOINTS.person(id));
    return tmdbPersonDetailSchema.parse(data);
  }
  async findCredit(id: number) {
    const { data } = await this.axiosClient.get(TMDB_ENDPOINTS.credits(id));
    return tmdbMovieCreditSchema.parse(data);
  }

  async insertPersons(movieId: number) {
    const { cast, crew } = await this.findCredit(movieId);

    const tmdbCrew = await throttledPromises(
      crew.filter(({ job }) => job !== JOBS_TRANSCO.unknown),
      async ({ job, tmdbId }) => ({
        job,
        person: await this.findPerson(tmdbId),
      }),
      20,
    );

    await this.personService.createWithNoConflict(tmdbCrew.map(({ person }) => person));
    const detailedCrew = tmdbCrew.length
      ? (await this.personService.findAllWithTmdbIds(tmdbCrew.map(({ person: { tmdbId } }) => tmdbId))).map(({ id, tmdbId }) => ({
          personId: id,
          job: tmdbCrew.find(({ person: { tmdbId: comparisonTmdbId } }) => comparisonTmdbId === tmdbId)!.job,
        }))
      : [];

    const tmdbCast = await throttledPromises(
      cast,
      async ({ character, tmdbId }) => ({
        character,
        person: await this.findPerson(tmdbId),
      }),
      20,
    );

    await this.personService.createWithNoConflict(tmdbCast.map(({ person }) => person));

    const detailedCast = tmdbCast.length
      ? (await this.personService.findAllWithTmdbIds(tmdbCast.map(({ person: { tmdbId } }) => tmdbId))).map(({ id, tmdbId }) => ({
          personId: id,
          character: tmdbCast.find(({ person: { tmdbId: comparisonTmdbId } }) => comparisonTmdbId === tmdbId)!.character,
        }))
      : [];

    return { cast: detailedCast, crew: detailedCrew };
  }

  async insertCast(cast: { character: string; personId: number }[], crew: { personId: number; job: Jobs }[], movieId: number) {
    await this.moviesService.createCast(
      cast.map(({ character, personId }) => ({
        character,
        movieId: movieId,
        personId,
      })),
    );

    await this.moviesService.createCrew(
      crew.map(({ job, personId }) => ({
        movieId: movieId,
        personId,
        job,
      })),
    );
  }

  async insertMovie(movieData: TmdbMovieDetails) {
    const movieInDb = await this.moviesService.findOneByTitleAndDate(movieData.title, movieData.releaseDate);
    if (movieInDb) return { movie: movieInDb, isNew: false };

    const movie = await this.moviesService.create({
      duration: movieData.runtime,
      tmdbId: movieData.tmdbId,
      originalLanguage: movieData.originalLanguage,
      title: movieData.title,
      overview: movieData.overview,
      posterPath: movieData.posterPath,
      releaseDate: movieData.releaseDate,
      tagLine: movieData.tagline,
    });

    return { movie, isNew: true };
  }

  async handleMovie(tmdbId: number) {
    let movieData: TmdbMovieDetails;
    try {
      movieData = await this.findMovie(tmdbId);
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status == 404) {
        return undefined;
      }
      throw error;
    }

    const {
      movie: { id: dbMovieId },
      isNew,
    } = await this.insertMovie(movieData);

    if (isNew) {
      try {
        this.insertPersons(tmdbId).then(({ cast, crew }) => {
          this.insertCast(cast, crew, dbMovieId);
        });
      } catch (error) {
        console.error(error);
      }
    }
    return {
      id: dbMovieId,
      isNewMovie: isNew,
    };
  }

  async search(query: string) {
    const { data } = await this.axiosClient.get(TMDB_ENDPOINTS.searchMovie(), {
      params: { query },
    });
    return z.array(tmdbSearchMovie).parse(data.results);
  }
}
