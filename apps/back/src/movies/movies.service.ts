import { Inject, Injectable } from '@nestjs/common';
import { CreateAllocineRatingsDto, CreateCastDto, CreateCrewDto, CreateMovieDto, UpdateMovieDto } from './movies.types';
import { Database, DrizzleProvider } from '../drizzle/drizzle.provider';
import { allocineRatings, casts, crews, movies } from '../drizzle/schema';
import { and, asc, eq, or } from 'drizzle-orm';

@Injectable()
export class MoviesService {
  @Inject(DrizzleProvider) private db: Database;

  findAll() {
    return this.db.query.movies.findMany({ limit: 10 });
  }

  findOne(id: number) {
    return this.db.query.movies.findFirst({
      where: (movie, { eq }) => eq(movie.id, id),
      with: {
        allocineRatings: {
          columns: {
            critic: true,
            spectator: true,
            link: true,
          },
        },
        cast: {
          columns: { character: true, order: true },
          with: { person: true },
          orderBy: asc(casts.order),
          limit: 10,
        },
        crew: {
          columns: { job: true },
          with: { person: true },
        },
      },
    });
  }

  findByTmdbId(tmdbId: number) {
    return this.db.query.movies.findFirst({
      where: (movie, { eq }) => eq(movie.tmdbId, tmdbId),
    });
  }

  findOneByTitleAndDate(title: string, date: string) {
    return this.db.query.movies.findFirst({
      where: (movie, { eq, and }) => and(eq(movie.title, title), eq(movie.releaseDate, date)),
    });
  }

  async create(movieDto: CreateMovieDto) {
    return (await this.db.insert(movies).values(movieDto).returning())[0];
  }

  async update(movieDto: UpdateMovieDto) {
    return (
      await this.db
        .update(movies)
        .set(movieDto)
        .where(
          or(
            and(eq(movies.title, movieDto.title ?? ''), eq(movies.releaseDate, movieDto.releaseDate ?? '')),
            eq(movies.tmdbId, movieDto.tmdbId ?? 0),
          ),
        )
        .returning()
    )[0];
  }

  createCast(castDto: CreateCastDto[]) {
    return this.db.insert(casts).values(castDto).onConflictDoNothing().returning();
  }

  createCrew(crewDto: CreateCrewDto[]) {
    return this.db.insert(crews).values(crewDto).onConflictDoNothing().returning();
  }

  createAllocineRatings(allocineRatingsDto: CreateAllocineRatingsDto) {
    return this.db.insert(allocineRatings).values(allocineRatingsDto).returning();
  }

  remove(id: number) {
    return `This action removes a #${id} movie`;
  }
}
