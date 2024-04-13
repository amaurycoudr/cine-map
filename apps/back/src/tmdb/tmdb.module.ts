import { Module } from '@nestjs/common';

import { TmdbController } from './tmdb.controller';
import { TmdbService } from './tmdb.service';
import { PersonsModule } from '../persons/persons.module';
import { MoviesModule } from '../movies/movies.module';

@Module({
  imports: [MoviesModule, PersonsModule],
  providers: [TmdbService],
  exports: [TmdbService],
  controllers: [TmdbController],
})
export class TmdbModule {}
