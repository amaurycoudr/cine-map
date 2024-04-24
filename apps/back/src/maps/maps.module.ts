import { Module } from '@nestjs/common';
import { DataIntegrationModule } from 'src/data-integration/data-integration.module';
import { MapsController } from './maps.controller';
import { MapsService } from './maps.service';

@Module({
  imports: [DataIntegrationModule],
  controllers: [MapsController],
  providers: [MapsService],
})
export class MapsModule {}
