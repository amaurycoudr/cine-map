import { relations } from 'drizzle-orm';
import { boolean, date, integer, pgEnum, pgTable, primaryKey, serial, text, unique, varchar } from 'drizzle-orm/pg-core';
import { GENDERS, JOBS } from '../utils/transco';

export const genderEnum = pgEnum('gender', GENDERS);
export const jobEnum = pgEnum('job', JOBS);

export const movies = pgTable(
  'movie',
  {
    id: serial('id').primaryKey().notNull(),
    title: text('title').notNull(),
    releaseDate: date('releaseDate').notNull(),
    tmdbId: integer('tmdb_id'),
    poster: text('poster'),
    originalLanguage: varchar('originalLanguage', { length: 128 }),
    overview: text('overview'),
    tagLine: text('tagline'),
    duration: integer('duration'),
  },
  (t) => ({
    unq: unique('unq_movie').on(t.releaseDate, t.title),
  }),
);

export const moviesRelations = relations(movies, ({ many, one }) => ({
  cast: many(casts),
  crew: many(crews),
  maps: many(moviesMaps),
  allocineRatings: one(allocineRatings, {
    fields: [movies.id],
    references: [allocineRatings.movieId],
  }),
}));

export const casts = pgTable(
  'cast',

  {
    movieId: integer('movie_id')
      .notNull()
      .references(() => movies.id, { onDelete: 'cascade' }),
    personId: integer('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    character: varchar('character', { length: 256 }).notNull(),
    order: integer('order'),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.personId, t.movieId, t.character] }),
  }),
);
export const castsRelations = relations(casts, ({ one }) => ({
  movie: one(movies, { fields: [casts.movieId], references: [movies.id] }),
  person: one(persons, { fields: [casts.personId], references: [persons.id] }),
}));

export const crews = pgTable(
  'crew',
  {
    movieId: integer('movie_id')
      .notNull()
      .references(() => movies.id, { onDelete: 'cascade' }),
    personId: integer('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    job: jobEnum('job').notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.personId, t.movieId, t.job] }),
  }),
);
export const crewsRelations = relations(crews, ({ one }) => ({
  movie: one(movies, { fields: [crews.movieId], references: [movies.id] }),
  person: one(persons, { fields: [crews.personId], references: [persons.id] }),
}));

export const persons = pgTable(
  'person',
  {
    id: serial('id').primaryKey().notNull(),
    name: text('name'),
    birthday: date('birthday'),
    picture: text('picture'),
    deathday: date('deathday'),
    gender: genderEnum('gender'),
    tmdbId: integer('tmdb_id'),
    knownFor: jobEnum('known_for'),
  },
  (t) => ({
    unq: unique('unq_person').on(t.name, t.birthday).nullsNotDistinct(),
  }),
);

export const personsRelations = relations(persons, ({ many }) => ({
  acting_jobs: many(casts),
  production_jobs: many(crews),
}));

export const maps = pgTable('map', {
  id: serial('id').primaryKey().notNull(),
  title: text('title').notNull().default(''),
  description: text('description').notNull().default(''),
  isDraft: boolean('is_draft').notNull().default(true),
});

export const mapsRelations = relations(maps, ({ many }) => ({
  movies: many(moviesMaps),
}));

export const moviesMaps = pgTable(
  'movies_maps',
  {
    movieId: integer('movie_id')
      .notNull()
      .references(() => movies.id, { onDelete: 'cascade' }),
    mapId: integer('map_id')
      .notNull()
      .references(() => maps.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.mapId, t.movieId] }),
  }),
);

export const moviesMapsRelations = relations(moviesMaps, ({ one }) => ({
  movie: one(movies, { fields: [moviesMaps.movieId], references: [movies.id] }),
  map: one(maps, { fields: [moviesMaps.mapId], references: [maps.id] }),
}));

export const allocineRatings = pgTable('allocine_rating', {
  id: serial('id').primaryKey().notNull(),
  movieId: integer('movie_id')
    .references(() => movies.id, { onDelete: 'cascade' })
    .unique(),
  critic: integer('critic'),
  spectator: integer('spectator'),
  link: text('link'),
});
