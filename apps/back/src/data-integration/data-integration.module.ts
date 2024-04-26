import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { AllocineModule } from 'src/allocine/allocine.module';
import { MoviesModule } from 'src/movies/movies.module';
import { PersonsModule } from 'src/persons/persons.module';
import { TmdbModule } from 'src/tmdb/tmdb.module';
import { DataIntegrationService } from './data-integration.service';
import { DataIntegrationWorker } from './data-integration.worker';

@Module({
  providers: [DataIntegrationService, DataIntegrationWorker],
  imports: [
    TmdbModule,
    MoviesModule,
    PersonsModule,
    AllocineModule,
    BullModule.registerQueue({
      name: 'movie-integration',
    }),
  ],
  exports: [DataIntegrationService],
})
export class DataIntegrationModule {}
