import { Inject, Injectable } from '@nestjs/common';
import { CreateCastDto, CreateCrewDto, CreateMovieDto } from './movies.types';
import { Database, DrizzleProvider } from '../drizzle/drizzle.provider';
import { cast, crew, movie } from '../drizzle/schema';

@Injectable()
export class MoviesService {
  @Inject(DrizzleProvider) private db: Database;

  findAll() {
    return this.db.query.movie.findMany({ limit: 10 });
  }

  findOne(id: number) {
    return this.db.query.movie.findFirst({
      where: (movie, { eq }) => eq(movie.id, id),
      with: {
        cast: {
          columns: { character: true },
          with: { person: true },
        },
        crew: {
          columns: { job: true },
          with: { person: true },
        },
      },
    });
  }

  findOneByTitle(title: string) {
    return this.db.query.movie.findFirst({
      where: (movie, { eq }) => eq(movie.title, title),
    });
  }

  async create(movieDto: CreateMovieDto) {
    return (await this.db.insert(movie).values(movieDto).returning())[0];
  }

  createCast(castDto: CreateCastDto[]) {
    return this.db.insert(cast).values(castDto).onConflictDoNothing().returning();
  }

  createCrew(crewDto: CreateCrewDto[]) {
    return this.db.insert(crew).values(crewDto).onConflictDoNothing().returning();
  }

  remove(id: number) {
    return `This action removes a #${id} movie`;
  }
}
