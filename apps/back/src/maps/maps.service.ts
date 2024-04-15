import { Inject, Injectable } from '@nestjs/common';
import { map } from 'src/drizzle/schema';
import { ERRORS, NOT_FOUND } from 'src/utils/errors';
import { Database, DrizzleProvider } from '../drizzle/drizzle.provider';
import { UpdateMapDto } from './maps.types';
import { SelectMovie } from 'src/movies/movies.types';

type MapFind = NonNullable<Awaited<ReturnType<MapsService['findOne']>>>;

@Injectable()
export class MapsService {
  @Inject(DrizzleProvider) private db: Database;

  async create() {
    const newMap = (await this.db.insert(map).values({ isDraft: true }).returning())[0];
    return { ...newMap, movies: [] as SelectMovie[] };
  }

  findAll() {
    return `This action returns all maps`;
  }

  async findOne(id: number) {
    const res = await this.db.query.map.findFirst({
      where: (map, { eq }) => eq(map.id, id),
      with: {
        movies: { with: { movie: true }, columns: { mapId: false, movieId: false } },
      },
    });
    if (!res) return;

    return {
      ...res,
      movies: res.movies.map(({ movie }) => movie),
    };
  }

  private getInvalidAttributes(newMap: Omit<MapFind, 'id'>): ('title' | 'movies' | 'description')[] {
    const res: ('title' | 'movies' | 'description')[] = [];
    if ((newMap.title?.length || 0) < 3) res.push('title');
    if (newMap.movies.length < 3) res.push('movies');
    if (newMap.description.length < 10) res.push('description');

    return res;
  }

  async update(id: number, updateMapDto: UpdateMapDto) {
    const currentMap = await this.findOne(id);

    if (!currentMap) return { code: ERRORS.NOT_FOUND, res: NOT_FOUND } as const;
    const { description, isDraft, title } = updateMapDto;
    const { id: _id, ...rest } = currentMap;

    const newMap = {
      ...rest,
      ...(isDraft !== undefined ? { isDraft } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(title !== undefined ? { title } : {}),
    };

    const invalidAttributes = this.getInvalidAttributes(newMap);

    if (!newMap.isDraft && invalidAttributes.length > 0) return { code: ERRORS.INVALID_TO_SAVE, res: invalidAttributes };

    await this.db.update(map).set(newMap);

    return { code: ERRORS.VALID, res: { ...newMap, id } };
  }

  remove(id: number) {
    return `This action removes a #${id} map`;
  }
}
