import { Controller } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';

import { TmdbService } from './tmdb.service';
import { contract } from '@cine-map/contract';

@Controller()
export class TmdbController {
  constructor(private readonly tmdbService: TmdbService) {}

  @TsRestHandler(contract.postTmdbMovie)
  createOne() {
    return tsRestHandler(contract.postTmdbMovie, async ({ params: { id } }) => {
      const result = await this.tmdbService.handleMovie(+id);
      if (result) {
        return { body: result, status: 201 };
      } else {
        return { body: { error: 'Not found' }, status: 404 };
      }
    });
  }

  @TsRestHandler(contract.searchTmdb)
  search() {
    return tsRestHandler(contract.searchTmdb, async ({ query: { q } }) => {
      return { body: await this.tmdbService.search(q), status: 200 };
    });
  }
}
