import { Inject, Injectable } from '@nestjs/common';
import { CreateMapDto, UpdateMapDto } from './maps.types';
import { Database, DrizzleProvider } from '../drizzle/drizzle.provider';

@Injectable()
export class MapsService {
  @Inject(DrizzleProvider) private db: Database;

  create(createMapDto: CreateMapDto) {
    return 'This action adds a new map';
  }

  findAll() {
    return `This action returns all maps`;
  }

  findOne(id: number) {
    return `This action returns a #${id} map`;
  }

  update(id: number, updateMapDto: UpdateMapDto) {
    return `This action updates a #${id} map`;
  }

  remove(id: number) {
    return `This action removes a #${id} map`;
  }
}
