import 'dotenv/config';
import type { Config } from 'drizzle-kit';

export default {
  schema: 'apps/cine-map-back/src/drizzle/schema.ts',
  out: 'apps/cine-map-back/drizzle',
  driver: 'pg',
  dbCredentials: {
    host: process.env.DB_HOST ?? '',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME ?? '',
  },
  verbose: true,
  strict: true,
} satisfies Config;
