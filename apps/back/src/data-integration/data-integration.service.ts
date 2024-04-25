import { Injectable, Logger } from '@nestjs/common';
import { AxiosError } from 'axios';
import { AllocineService } from 'src/allocine/allocine.service';
import { MoviesService } from 'src/movies/movies.service';
import { PersonsService } from 'src/persons/persons.service';
import { TmdbService } from 'src/tmdb/tmdb.service';
import { TmdbMovieDetails } from 'src/tmdb/tmdb.type';
import { JOBS_TRANSCO } from 'src/utils/transco';

//get(DataIntegrationService).handleMovie(238, true)
@Injectable()
export class DataIntegrationService {
  constructor(
    private readonly moviesService: MoviesService,
    private readonly personService: PersonsService,
    private readonly tmdbService: TmdbService,
    private readonly allocineService: AllocineService,
  ) {}

  private readonly logger = new Logger(DataIntegrationService.name);

  async insertPersons<T extends { tmdbId: number }>(tmdbIds: T[]) {
    const persons = await this.tmdbService.getPersons(tmdbIds);

    await this.personService.createWithNoConflict(persons.map(({ person }) => person));
    return (await this.personService.findAllWithTmdbIds(persons.map(({ person: { tmdbId } }) => tmdbId))).map(({ id, tmdbId }) => {
      const { person: _, ...rest } = persons.find(({ person: { tmdbId: comparatorId } }) => comparatorId === tmdbId)!;

      return { personId: id, ...rest };
    });
  }
  async insertCredits(tmdbId: number, movieId: number) {
    const { cast, crew } = await this.tmdbService.getCredits(tmdbId);
    const detailedCrew = await this.insertPersons(crew.filter(({ job }) => job !== JOBS_TRANSCO.unknown));
    await this.moviesService.createCrew(detailedCrew.map(({ job, personId }) => ({ movieId, personId, job })));
    this.logStep(tmdbId, 'crew inserted on the db');

    const detailedCast = await this.insertPersons(cast);
    await this.moviesService.createCast(detailedCast.map(({ character, personId }) => ({ character, movieId, personId })));

    this.logStep(tmdbId, 'cast inserted on the db');
  }

  async insertMovie(movieData: TmdbMovieDetails, isReplaced: boolean) {
    const dto = {
      duration: movieData.runtime,
      tmdbId: movieData.tmdbId,
      originalLanguage: movieData.originalLanguage,
      title: movieData.title,
      overview: movieData.overview,
      posterPath: movieData.posterPath,
      releaseDate: movieData.releaseDate,
      tagLine: movieData.tagline,
    };

    const movie = await (isReplaced ? this.moviesService.update(dto) : this.moviesService.create(dto));

    this.logStep(movieData.tmdbId, 'inserted on the db');
    return { movie };
  }

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

    const { id } = (await this.insertMovie(movieData, replace && !!existingMovie)).movie;

    this.insertCredits(tmdbId, id);

    return { id };
  }
  async insertAllocineRatings({ id, title }: { id: number; title: string }, tmdbId: number) {
    const { criticRating, spectatorRating } = await this.allocineService.getRatings(title);
    await this.moviesService.createAllocineRatings({ movieId: id, critic: criticRating, spectator: spectatorRating });
    this.logStep(tmdbId, 'allocine ratings inserted on the db');
  }

  private logStep(tmdbId: number, msg: string) {
    this.logger.log(`[MOVIE Tmdb Id: ${tmdbId}] ${msg}`);
  }
}
