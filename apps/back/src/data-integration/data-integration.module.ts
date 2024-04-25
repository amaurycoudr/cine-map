import { Module } from '@nestjs/common';
import { AllocineModule } from 'src/allocine/allocine.module';
import { MoviesModule } from 'src/movies/movies.module';
import { PersonsModule } from 'src/persons/persons.module';
import { TmdbModule } from 'src/tmdb/tmdb.module';
import { DataIntegrationController } from './data-integration.controller';
import { DataIntegrationService } from './data-integration.service';

@Module({
  providers: [DataIntegrationService],
  imports: [TmdbModule, MoviesModule, PersonsModule, AllocineModule],
  controllers: [DataIntegrationController],
  exports: [DataIntegrationService],
})
export class DataIntegrationModule {}
