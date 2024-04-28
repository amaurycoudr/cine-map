import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { AxiosError } from 'axios';
import { Queue } from 'bullmq';
import { MoviesService } from 'src/movies/movies.service';
import { TmdbService } from 'src/tmdb/tmdb.service';
import { TmdbMovieDetails } from 'src/tmdb/tmdb.type';

//get(DataIntegrationService).handleMovie(238, true)
@Injectable()
export class DataIntegrationService {
  constructor(
    private readonly moviesService: MoviesService,
    private readonly tmdbService: TmdbService,
    @InjectQueue('movie-integration') private movieQueue: Queue,
  ) {}

  private readonly logger = new Logger(DataIntegrationService.name);

  async handleTmdbMovie(tmdbId: number, replace = false) {
    this.logStep(tmdbId, 'start integrating');

    const existingMovie = await this.moviesService.findByTmdbId(tmdbId);

    if (existingMovie && !replace) {
      this.logStep(tmdbId, 'already in DB');
      return { id: existingMovie.id };
    }
    let movieData: TmdbMovieDetails;
    try {
      movieData = await this.tmdbService.getMovie(tmdbId);
      this.logStep(tmdbId, 'gotten from TMDbB');
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status == 404) {
        this.logStep(tmdbId, 'not found on TMDB');
        return undefined;
      }

      throw error;
    }

    const { id, title, releaseDate } = (await this.insertMovie(movieData, replace && !!existingMovie)).movie;

    this.movieQueue.add('credits', { tmdbId, movieId: id });
    this.movieQueue.add('allocine', { id, title, tmdbId, releaseDate });

    return { id };
  }

  async insertMovie(movieData: TmdbMovieDetails, isReplaced: boolean) {
    const dto = {
      duration: movieData.runtime,
      tmdbId: movieData.tmdbId,
      originalLanguage: movieData.originalLanguage,
      title: movieData.title,
      overview: movieData.overview,
      poster: movieData.poster,
      releaseDate: movieData.releaseDate,
      tagLine: movieData.tagline,
    };

    const movie = await (isReplaced ? this.moviesService.update(dto) : this.moviesService.create(dto));

    this.logStep(movieData.tmdbId, 'inserted on the db');
    return { movie };
  }

  private logStep(tmdbId: number, msg: string) {
    this.logger.log(`[MOVIE Tmdb Id: ${tmdbId}] ${msg}`);
  }
}
