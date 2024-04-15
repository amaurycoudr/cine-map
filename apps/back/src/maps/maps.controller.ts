import { contract } from '@cine-map/contract';
import { Controller, Delete, Get, Param } from '@nestjs/common';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { MapsService } from './maps.service';
import { ERRORS } from 'src/utils/errors';

@Controller()
export class MapsController {
  constructor(private readonly mapsService: MapsService) {}

  @TsRestHandler(contract.createMap)
  create() {
    return tsRestHandler(contract.createMap, async () => {
      return { body: await this.mapsService.create(), status: 201 };
    });
  }

  @TsRestHandler(contract.patchMaps)
  update() {
    return tsRestHandler(contract.patchMaps, async ({ params: { id }, body }) => {
      const { code, res } = await this.mapsService.update(+id, body);
      if (code === ERRORS.VALID) return { body: res, status: 200 };
      if (code === ERRORS.NOT_FOUND) return { body: { error: res }, status: 404 };
      return { status: 400, body: { error: res } };
    });
  }
  @TsRestHandler(contract.getMap)
  findOne() {
    return tsRestHandler(contract.getMap, async ({ params: { id } }) => {
      const result = await this.mapsService.findOne(+id);
      if (!result) return { status: 404, body: { error: 'Not found' } };

      return { status: 200, body: result };
    });
  }

  @Get()
  findAll() {
    return this.mapsService.findAll();
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mapsService.remove(+id);
  }
}
