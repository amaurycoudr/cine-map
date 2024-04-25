import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

(async () => {
  const sql = postgres({
    host: process.env.DB_HOST ?? '',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME ?? '',
    max: 1,
  });
  const db = drizzle(sql);

  await migrate(db, { migrationsFolder: 'drizzle' });
  await sql.end();
})();
