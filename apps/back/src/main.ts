import { NestFactory } from '@nestjs/core';
import 'dotenv/config';

import { AppModule } from './app.module';
import { contract } from '@cine-map/contract';
import { SwaggerModule } from '@nestjs/swagger';
import { generateOpenApi } from '@ts-rest/open-api';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const document = generateOpenApi(contract, {
    info: {
      title: 'CINE APIs',
      version: '1.0.0',
    },
  });
  app.enableCors();
  SwaggerModule.setup('api', app, document);
  await app.listen(3000);
}

bootstrap();
