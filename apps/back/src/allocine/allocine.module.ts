import { Module } from '@nestjs/common';
import { AllocineService } from './allocine.service';

@Module({
  providers: [AllocineService],
})
export class AllocineModule {}
