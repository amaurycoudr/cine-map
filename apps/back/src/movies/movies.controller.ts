import { contract } from '@cine-map/contract';
import { Controller, Delete, Param } from '@nestjs/common';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { MoviesService } from './movies.service';

@Controller()
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @TsRestHandler(contract.getMovies)
  findAll() {
    return tsRestHandler(contract.getMovies, async () => {
      return { body: await this.moviesService.findAll(), status: 200 };
    });
  }

  @TsRestHandler(contract.getMovie)
  findOne() {
    return tsRestHandler(contract.getMovie, async ({ params: { id } }) => {
      const movie = await this.moviesService.findOne(+id);
      if (!movie) return { status: 404, body: { error: 'Not found' } };
      return { body: movie, status: 200 };
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.moviesService.remove(+id);
  }
}
