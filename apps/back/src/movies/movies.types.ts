import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { allocineRatings, casts, crews, movies } from '../drizzle/schema';
import { z } from 'zod';

export const insertMovieSchema = createInsertSchema(movies);

export type CreateMovieDto = z.infer<typeof insertMovieSchema>;
export type UpdateMovieDto = Partial<z.infer<typeof insertMovieSchema>>;

export const selectMovieSchema = createSelectSchema(movies);

export type SelectMovie = z.infer<typeof selectMovieSchema>;

export const insertCastSchema = createInsertSchema(casts);

export type CreateCastDto = z.infer<typeof insertCastSchema>;

export const insertCrewSchema = createInsertSchema(crews);

export type CreateCrewDto = z.infer<typeof insertCrewSchema>;

export const insertAllocineRatings = createInsertSchema(allocineRatings);

export type CreateAllocineRatingsDto = z.infer<typeof insertAllocineRatings>;
