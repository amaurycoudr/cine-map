import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DrizzleModule } from './drizzle/drizzle.module';
import { MapsModule } from './maps/maps.module';
import { MoviesModule } from './movies/movies.module';
import { PersonsModule } from './persons/persons.module';
import { TmdbModule } from './tmdb/tmdb.module';
import { zOA } from './utils/z';

const configSchema = zOA.object({
  DB_PASSWORD: zOA.string(),
  DB_USER: zOA.string(),
  DB_NAME: zOA.string(),
  DB_HOST: zOA.string(),
  TMDB_API_KEY: zOA.string(),
  TMDB_API_ACCESS_TOKEN: zOA.string(),
});
export type Config = zOA.infer<typeof configSchema>;
@Module({
  imports: [
    DrizzleModule,
    TmdbModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => configSchema.parse(config),
    }),
    MoviesModule,
    PersonsModule,
    MapsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
