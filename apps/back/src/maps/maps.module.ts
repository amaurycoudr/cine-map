import { Module } from '@nestjs/common';
import { MapsService } from './maps.service';
import { MapsController } from './maps.controller';
import { TmdbModule } from 'src/tmdb/tmdb.module';

@Module({
  imports: [TmdbModule],
  controllers: [MapsController],
  providers: [MapsService],
})
export class MapsModule {}
