import { Inject, Injectable } from '@nestjs/common';
import { CreatePersonDto } from './persons.types';
import { Database, DrizzleProvider } from '../drizzle/drizzle.provider';
import { persons } from '../drizzle/schema';

@Injectable()
export class PersonsService {
  @Inject(DrizzleProvider) private db: Database;

  async create(createPersonDto: CreatePersonDto) {
    return (await this.db.insert(persons).values(createPersonDto).returning())[0];
  }

  async createWithNoConflict(createPersonDto: CreatePersonDto[]) {
    return this.db.insert(persons).values(createPersonDto).onConflictDoNothing().returning();
  }

  async findAllWithTmdbIds(ids: number[]) {
    if (ids.length === 0) return [];
    return await this.db.query.persons.findMany({
      where: (person, { inArray }) => inArray(person.tmdbId, ids),
    });
  }

  findOne(id: number) {
    return this.db.query.persons.findFirst({
      where: (person, { eq }) => eq(person.id, id),
    });
  }

  findOneNameBirthday(name: string, birthday: string | null) {
    return this.db.query.persons.findFirst({
      where: (person, { eq, and }) => and(eq(person.name, name), ...(birthday ? [eq(person.birthday, birthday)] : [])),
    });
  }
}
