import { Inject, Injectable } from '@nestjs/common';
import { map } from 'src/drizzle/schema';
import { ERRORS, NOT_FOUND } from 'src/utils/errors';
import { Database, DrizzleProvider } from '../drizzle/drizzle.provider';
import { UpdateMapDto } from './maps.types';

@Injectable()
export class MapsService {
  @Inject(DrizzleProvider) private db: Database;

  async create() {
    return (await this.db.insert(map).values({ isDraft: true }).returning())[0];
  }

  findAll() {
    return `This action returns all maps`;
  }

  async findOne(id: number) {
    return await this.db.query.map.findFirst({
      where: (map, { eq }) => eq(map.id, id),
      with: {
        movies: { with: { movie: true }, columns: { mapId: false, movieId: false } },
      },
    });
  }

  private getInvalidAttributes(newMap: NonNullable<Awaited<ReturnType<typeof this.findOne>>>): ('title' | 'movies' | 'description')[] {
    const res: ('title' | 'movies' | 'description')[] = [];
    if ((newMap.title?.length || 0) < 3) res.push('title');
    if (newMap.movies.length < 3) res.push('movies');
    if (newMap.description.length < 10) res.push('description');

    return res;
  }

  async update(id: number, updateMapDto: UpdateMapDto) {
    const currentMap = await this.findOne(id);

    if (!currentMap) return { code: ERRORS.NOT_FOUND, res: NOT_FOUND } as const;

    const newMap = { ...currentMap, ...updateMapDto };

    const invalidAttributes = this.getInvalidAttributes(newMap);

    if (!newMap.isDraft && invalidAttributes.length > 0) return { code: ERRORS.INVALID_TO_SAVE, res: invalidAttributes };

    await this.db.update(map).set(newMap);

    const res = { ...newMap, movies: newMap.movies.map(({ movie }) => movie) };

    return { code: ERRORS.VALID, res };
  }

  remove(id: number) {
    return `This action removes a #${id} map`;
  }
}
