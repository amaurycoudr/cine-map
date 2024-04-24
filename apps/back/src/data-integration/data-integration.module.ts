import { Module } from '@nestjs/common';
import { MoviesModule } from 'src/movies/movies.module';
import { PersonsModule } from 'src/persons/persons.module';
import { TmdbModule } from 'src/tmdb/tmdb.module';
import { DataIntegrationService } from './data-integration.service';
import { DataIntegrationController } from './data-integration.controller';

@Module({
  providers: [DataIntegrationService],
  imports: [TmdbModule, MoviesModule, PersonsModule],
  controllers: [DataIntegrationController],
})
export class DataIntegrationModule {}
