import { createInsertSchema } from 'drizzle-zod';
import { person } from '../drizzle/schema';
import { z } from 'zod';

export const insertPersonSchema = createInsertSchema(person);

export type CreatePersonDto = z.infer<typeof insertPersonSchema>;
