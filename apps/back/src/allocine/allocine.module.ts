import { Module } from '@nestjs/common';
import { AllocineService } from './allocine.service';

@Module({
  providers: [AllocineService],
  exports: [AllocineService],
})
export class AllocineModule {}
