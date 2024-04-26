import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { z } from 'zod';
import { AllocineModule } from './allocine/allocine.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DataIntegrationModule } from './data-integration/data-integration.module';
import { DrizzleModule } from './drizzle/drizzle.module';
import { MapsModule } from './maps/maps.module';
import { MoviesModule } from './movies/movies.module';
import { PersonsModule } from './persons/persons.module';
import { TmdbModule } from './tmdb/tmdb.module';

const configSchema = z.object({
  DB_PASSWORD: z.string(),
  DB_USER: z.string(),
  DB_NAME: z.string(),
  DB_HOST: z.string(),
  REDIS_HOST: z.string(),
  REDIS_PORT: z.string(),
  TMDB_API_KEY: z.string(),
  TMDB_API_ACCESS_TOKEN: z.string(),
});
export type Config = z.infer<typeof configSchema>;
@Module({
  imports: [
    DrizzleModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => configSchema.parse(config),
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST,
        port: +process.env.REDIS_PORT!,
      },
    }),
    TmdbModule,
    MoviesModule,
    PersonsModule,
    MapsModule,
    DataIntegrationModule,
    AllocineModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
