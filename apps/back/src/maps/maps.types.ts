import { createInsertSchema } from 'drizzle-zod';

import { z } from 'zod';
import { map, moviesMaps } from '../drizzle/schema';

export const insertMapSchema = createInsertSchema(map);

export type CreateMapDto = z.infer<typeof insertMapSchema>;

export type UpdateMapDto = Omit<CreateMapDto, 'id'>;

export const insertMoviesMapsScheme = createInsertSchema(moviesMaps);

export type CreateMoviesMapsDto = z.infer<typeof insertMoviesMapsScheme>;
