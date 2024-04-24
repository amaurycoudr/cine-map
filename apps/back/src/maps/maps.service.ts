import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DataIntegrationService } from 'src/data-integration/data-integration.service';
import { maps, moviesMaps } from 'src/drizzle/schema';
import { SelectMovie } from 'src/movies/movies.types';
import { ERRORS, NOT_FOUND } from 'src/utils/errors';
import { Database, DrizzleProvider } from '../drizzle/drizzle.provider';
import { CreateMoviesMapsDto, UpdateMapDto } from './maps.types';

type MapFind = NonNullable<Awaited<ReturnType<MapsService['findOne']>>>;

@Injectable()
export class MapsService {
  @Inject(DrizzleProvider) private db: Database;

  constructor(private readonly dataIntegrationService: DataIntegrationService) {}

  async create() {
    const newMap = (await this.db.insert(maps).values({ isDraft: true }).returning())[0];
    return { ...newMap, movies: [] as SelectMovie[] };
  }

  findAll() {
    return `This action returns all maps`;
  }

  async findOne(id: number) {
    const res = await this.db.query.maps.findFirst({
      where: (map, { eq }) => eq(map.id, id),
      with: { movies: { with: { movie: true }, columns: { mapId: false, movieId: false } } },
    });

    if (!res) return;

    return { ...res, movies: res.movies.map(({ movie }) => movie) };
  }

  private getInvalidAttributes(newMap: Omit<MapFind, 'id'>): ('title' | 'movies' | 'description')[] {
    const res: ('title' | 'movies' | 'description')[] = [];

    if ((newMap.title?.length || 0) < 3) res.push('title');
    if (newMap.movies.length < 3) res.push('movies');
    if (newMap.description.length < 10) res.push('description');

    return res;
  }

  private async getMapAndCheckDraft(id: number) {
    const currentMap = await this.findOne(id);

    if (!currentMap) return { code: ERRORS.NOT_FOUND, res: NOT_FOUND } as const;
    if (!currentMap.isDraft) return { code: ERRORS.NOT_EDITABLE, res: undefined };

    return { code: ERRORS.VALID, res: currentMap };
  }
  async update(id: number, updateMapDto: UpdateMapDto) {
    const result = await this.getMapAndCheckDraft(id);

    if (result.code !== ERRORS.VALID) return result;

    const currentMap = result.res;

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

    await this.db.update(maps).set(newMap).where(eq(maps.id, id));

    return { code: ERRORS.VALID, res: { ...newMap, id } };
  }

  createMoviesMaps(moviesMapsDto: CreateMoviesMapsDto) {
    return this.db.insert(moviesMaps).values(moviesMapsDto).onConflictDoNothing().returning();
  }

  removeMoviesMaps({ mapId, movieId }: CreateMoviesMapsDto) {
    return this.db.delete(moviesMaps).where(and(eq(moviesMaps.mapId, mapId), eq(moviesMaps.movieId, movieId)));
  }

  async addMovie(id: number, tmdbId: number) {
    const mapCheck = await this.getMapAndCheckDraft(id);
    if (mapCheck.code !== ERRORS.VALID) return mapCheck;
    const currentMap = mapCheck.res;

    const insertedMovie = await this.dataIntegrationService.handleMovie(tmdbId);

    if (!insertedMovie) return { code: ERRORS.NOT_FOUND, res: NOT_FOUND } as const;

    await this.createMoviesMaps({ mapId: currentMap.id, movieId: insertedMovie.id });

    const updatedMap = await this.findOne(id);

    return { code: ERRORS.VALID, res: updatedMap! };
  }

  async removeMovie(mapId: number, movieId: number) {
    const result = await this.getMapAndCheckDraft(mapId);
    if (result.code !== ERRORS.VALID) return result;
    await this.removeMoviesMaps({ mapId, movieId });

    const updatedMap = await this.findOne(mapId);

    if (!updatedMap) return { code: ERRORS.NOT_FOUND, res: NOT_FOUND } as const;

    return { code: ERRORS.VALID, res: updatedMap! };
  }

  remove(id: number) {
    return `This action removes a #${id} map`;
  }
}
