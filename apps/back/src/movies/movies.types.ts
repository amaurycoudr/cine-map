import { createInsertSchema } from 'drizzle-zod';
import { cast, crew, movie } from '../drizzle/schema';
import { z } from 'zod';

export const insertMovieSchema = createInsertSchema(movie);

export type CreateMovieDto = z.infer<typeof insertMovieSchema>;

export const insertCastSchema = createInsertSchema(cast);

export type CreateCastDto = z.infer<typeof insertCastSchema>;

export const insertCrewSchema = createInsertSchema(crew);

export type CreateCrewDto = z.infer<typeof insertCrewSchema>;
