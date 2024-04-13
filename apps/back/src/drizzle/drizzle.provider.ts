import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import 'dotenv/config';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import * as schema from './schema';
import { Config } from '../app.module';
import * as postgres from 'postgres';

export const DrizzleProvider = 'ASYNC_DrizzleProvider';

export const drizzleProvider = {
  provide: DrizzleProvider,
  useFactory: async (config: ConfigService<Config>) => {
    const queryClient = postgres({
      host: config.get('DB_HOST'),
      user: config.get('DB_USER'),
      password: config.get('DB_PASSWORD'),
      database: config.get('DB_NAME'),
    });
    const db = drizzle(queryClient, { schema: schema, logger: true });
    return db;
  },
  inject: [ConfigService],
} satisfies Provider;

export { schema };

export type Database = PostgresJsDatabase<typeof schema>;
