import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

import { z } from 'zod';
import { throttledPromises } from '../utils/utils';
import { TMDB_API_URL, TMDB_ENDPOINTS, tmdbMovieCreditSchema, tmdbMovieDetailsSchema, tmdbPersonDetailSchema, tmdbSearchMovie } from './tmdb.type';

export type PersonSpecificKey = 'job' | 'character';
export type Person<T extends string> = {
  [key in T]: unknown;
} & { tmdbId: number };

@Injectable()
export class TmdbService {
  private axiosClient: AxiosInstance;
  private PARALLEL_REQUEST = 20;
  constructor(private config: ConfigService) {
    this.axiosClient = axios.create({ baseURL: TMDB_API_URL });
    this.axiosClient.defaults.headers.common['Authorization'] = `Bearer ${this.config.get('TMDB_API_ACCESS_TOKEN')}`;
    this.axiosClient.defaults.params = {};
    this.axiosClient.defaults.params['language'] = 'fr-FR';
  }

  async getMovie(id: number) {
    const { data } = await this.axiosClient.get(TMDB_ENDPOINTS.movie(id));
    return tmdbMovieDetailsSchema.parse(data);
  }

  async getPerson(id: number) {
    const { data } = await this.axiosClient.get(TMDB_ENDPOINTS.person(id));
    return tmdbPersonDetailSchema.parse(data);
  }
  async getCredits(id: number) {
    const { data } = await this.axiosClient.get(TMDB_ENDPOINTS.credits(id));
    return tmdbMovieCreditSchema.parse(data);
  }
  async search(query: string) {
    const { data } = await this.axiosClient.get(TMDB_ENDPOINTS.searchMovie(), {
      params: { query },
    });
    return z.array(tmdbSearchMovie).parse(data.results);
  }

  async getPersons<T extends { tmdbId: number }>(persons: T[]) {
    return await throttledPromises(
      persons,
      async ({ tmdbId, ...rest }) => ({ person: await this.getPerson(tmdbId), ...rest }),
      this.PARALLEL_REQUEST,
    );
  }
}
