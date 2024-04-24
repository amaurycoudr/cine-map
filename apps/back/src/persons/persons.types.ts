import { createInsertSchema } from 'drizzle-zod';
import { persons } from '../drizzle/schema';
import { z } from 'zod';

export const insertPersonSchema = createInsertSchema(persons);

export type CreatePersonDto = z.infer<typeof insertPersonSchema>;
