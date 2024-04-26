import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { AllocineService } from 'src/allocine/allocine.service';
import { MoviesService } from 'src/movies/movies.service';
import { PersonsService } from 'src/persons/persons.service';
import { TmdbService } from 'src/tmdb/tmdb.service';
import { JOBS_TRANSCO } from 'src/utils/transco';
import { isKeyOfObject } from 'src/utils/utils';

//get(DataIntegrationService).handleMovie(238, true)
@Processor('movie-integration')
export class DataIntegrationWorker extends WorkerHost {
  constructor(
    private readonly moviesService: MoviesService,
    private readonly personService: PersonsService,
    private readonly tmdbService: TmdbService,
    private readonly allocineService: AllocineService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<void> {
    if (job.name === 'credits' && isKeyOfObject('movieId' as const, job.data) && isKeyOfObject('tmdbId' as const, job.data)) {
      this.logStep(job.data.tmdbId, 'start inserting credits');
      await this.insertCredits(job.data.tmdbId, job.data.movieId);
    } else if (
      job.name === 'allocine' &&
      isKeyOfObject('id' as const, job.data) &&
      isKeyOfObject('title' as const, job.data) &&
      isKeyOfObject('tmdbId' as const, job.data)
    ) {
      this.logStep(job.data.tmdbId, 'start inserting allocine ratings');
      await this.insertAllocineRatings({ id: job.data.id, title: job.data.title }, job.data.tmdbId);
    } else {
      this.logger.log(`UNKNOWN JOB/INVALID PARAMS, name: ${job.name}`);
    }
  }

  private readonly logger = new Logger(DataIntegrationWorker.name);

  async insertCredits(tmdbId: number, movieId: number) {
    const { cast, crew } = await this.tmdbService.getCredits(tmdbId);
    const detailedCrew = await this.insertPersons(crew.filter(({ job }) => job !== JOBS_TRANSCO.unknown));
    await this.moviesService.createCrew(detailedCrew.map(({ job, personId }) => ({ movieId, personId, job })));
    this.logStep(tmdbId, 'crew inserted on the db');

    const detailedCast = await this.insertPersons(cast.sort((actor1, actor2) => -actor2.order + actor1.order));

    await this.moviesService.createCast(detailedCast.map(({ character, order, personId }) => ({ character, order, movieId, personId })));

    this.logStep(tmdbId, 'cast inserted on the db');
  }

  async insertPersons<T extends { tmdbId: number }>(tmdbIds: T[]) {
    const persons = await this.tmdbService.getPersons(tmdbIds);

    await this.personService.createWithNoConflict(persons.map(({ person }) => person));
    return (await this.personService.findAllWithTmdbIds(persons.map(({ person: { tmdbId } }) => tmdbId))).map(({ id, tmdbId }) => {
      const { person: _, ...rest } = persons.find(({ person: { tmdbId: comparatorId } }) => comparatorId === tmdbId)!;

      return { personId: id, ...rest };
    });
  }

  async insertAllocineRatings({ id, title }: { id: number; title: string }, tmdbId: number) {
    const { criticRating, spectatorRating, link } = await this.allocineService.getRatings(title);
    await this.moviesService.createAllocineRatings({ movieId: id, critic: criticRating, spectator: spectatorRating, link });
    this.logStep(tmdbId, 'allocine ratings inserted on the db');
  }

  private logStep(tmdbId: number, msg: string) {
    this.logger.log(`[MOVIE Tmdb Id: ${tmdbId}] ${msg}`);
  }
}
