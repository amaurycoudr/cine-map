import { createInsertSchema } from 'drizzle-zod';

import { z } from 'zod';
import { map } from '../drizzle/schema';

export const insertMapSchema = createInsertSchema(map);

export type CreateMapDto = z.infer<typeof insertMapSchema>;

export type UpdateMapDto = Required<Omit<CreateMapDto, 'id'>>;
