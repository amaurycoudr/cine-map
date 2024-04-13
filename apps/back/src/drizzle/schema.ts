import { relations } from 'drizzle-orm';
import { date, integer, pgEnum, pgTable, primaryKey, serial, text, unique, varchar } from 'drizzle-orm/pg-core';
import { GENDERS, JOBS } from '../utils/transco';

export const genderEnum = pgEnum('gender', GENDERS);
export const jobEnum = pgEnum('job', JOBS);

export const movie = pgTable(
  'movie',
  {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    releaseDate: date('releaseDate').notNull(),
    tmdbId: integer('tmdb_id'),
    posterPath: text('posterPath'),
    originalLanguage: varchar('originalLanguage', { length: 128 }),
    overview: text('overview'),
    tagLine: text('tagline'),
    duration: integer('duration'),
  },
  (t) => ({
    unq: unique('unq_movie').on(t.releaseDate, t.title),
  }),
);

export const movieRelations = relations(movie, ({ many }) => ({
  cast: many(cast),
  crew: many(crew),
  maps: many(moviesMaps),
}));

export const cast = pgTable(
  'cast',

  {
    movieId: integer('movie_id')
      .notNull()
      .references(() => movie.id, { onDelete: 'cascade' }),
    personId: integer('person_id')
      .notNull()
      .references(() => person.id, { onDelete: 'cascade' }),
    character: varchar('character', { length: 256 }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.personId, t.movieId, t.character] }),
  }),
);
export const castRelations = relations(cast, ({ one }) => ({
  movie: one(movie, { fields: [cast.movieId], references: [movie.id] }),
  person: one(person, { fields: [cast.personId], references: [person.id] }),
}));

export const crew = pgTable(
  'crew',
  {
    movieId: integer('movie_id')
      .notNull()
      .references(() => movie.id, { onDelete: 'cascade' }),
    personId: integer('person_id')
      .notNull()
      .references(() => person.id, { onDelete: 'cascade' }),
    job: jobEnum('job').notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.personId, t.movieId, t.job] }),
  }),
);
export const crewRelations = relations(crew, ({ one }) => ({
  movie: one(movie, { fields: [crew.movieId], references: [movie.id] }),
  person: one(person, { fields: [crew.personId], references: [person.id] }),
}));

export const person = pgTable(
  'person',
  {
    id: serial('id').primaryKey(),
    name: text('name'),
    birthday: date('birthday'),
    deathday: date('deathday'),
    gender: genderEnum('gender'),
    tmdbId: integer('tmdb_id'),
    knownFor: jobEnum('known_for'),
  },
  (t) => ({
    unq: unique('unq_person').on(t.name, t.birthday).nullsNotDistinct(),
  }),
);

export const personRelations = relations(person, ({ many }) => ({
  acting_jobs: many(cast),
  production_jobs: many(crew),
}));

export const map = pgTable('map', {
  id: serial('id').primaryKey(),
  title: text('title'),
  description: text('description'),
});

export const mapRelations = relations(map, ({ many }) => ({
  movies: many(moviesMaps),
}));

export const moviesMaps = pgTable(
  'movies_maps',
  {
    movieId: integer('movie_id')
      .notNull()
      .references(() => movie.id, { onDelete: 'cascade' }),
    mapId: integer('map_id')
      .notNull()
      .references(() => person.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.mapId, t.movieId] }),
  }),
);

export const moviesMapsRelations = relations(moviesMaps, ({ one }) => ({
  movie: one(movie, { fields: [moviesMaps.movieId], references: [movie.id] }),
  person: one(map, { fields: [moviesMaps.mapId], references: [map.id] }),
}));
