import { Controller } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';

import { TmdbService } from './tmdb.service';
import { contract } from '@cine-map/contract';

@Controller()
export class TmdbController {
  constructor(private readonly tmdbService: TmdbService) {}

  @TsRestHandler(contract.searchTmdb)
  search() {
    return tsRestHandler(contract.searchTmdb, async ({ query: { q } }) => {
      return { body: await this.tmdbService.search(q), status: 200 };
    });
  }
}
