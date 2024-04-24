import { Injectable } from '@nestjs/common';
import { AxiosError } from 'axios';
import { MoviesService } from 'src/movies/movies.service';
import { PersonsService } from 'src/persons/persons.service';
import { TmdbService } from 'src/tmdb/tmdb.service';
import { TmdbMovieDetails } from 'src/tmdb/tmdb.type';
import { Jobs, JOBS_TRANSCO } from 'src/utils/transco';

@Injectable()
export class DataIntegrationService {
  constructor(
    private readonly moviesService: MoviesService,
    private readonly personService: PersonsService,
    private readonly tmdbService: TmdbService,
  ) {}

  async insertPersons<T extends { tmdbId: number }>(tmdbIds: T[]) {
    const persons = await this.tmdbService.getPersons(tmdbIds);

    await this.personService.createWithNoConflict(persons.map(({ person }) => person));
    return (await this.personService.findAllWithTmdbIds(persons.map(({ person: { tmdbId } }) => tmdbId))).map(({ id, tmdbId }) => {
      const { person: _, ...rest } = persons.find(({ person: { tmdbId: comparatorId } }) => comparatorId === tmdbId)!;

      return { personId: id, ...rest };
    });
  }
  async insertAllMoviePersons(movieId: number) {
    const { cast, crew } = await this.tmdbService.getCredits(movieId);

    const detailedCrew = await this.insertPersons(crew.filter(({ job }) => job !== JOBS_TRANSCO.unknown));

    const detailedCast = await this.insertPersons(cast);

    return { cast: detailedCast, crew: detailedCrew };
  }

  async insertCredits(cast: { character: string; personId: number }[], crew: { personId: number; job: Jobs }[], movieId: number) {
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
      movieData = await this.tmdbService.getMovie(tmdbId);
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
        this.insertAllMoviePersons(tmdbId).then(({ cast, crew }) => {
          this.insertCredits(cast, crew, dbMovieId);
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
}
