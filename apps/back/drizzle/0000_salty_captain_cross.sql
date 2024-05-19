DO $$ BEGIN
 CREATE TYPE "gender" AS ENUM('0', '1', '2', '3');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "job" AS ENUM('0', '1', '2', '3', '4', '5', '6', '7');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "allocine_rating" (
	"id" serial PRIMARY KEY NOT NULL,
	"movie_id" integer,
	"critic" integer,
	"spectator" integer,
	"link" text,
	CONSTRAINT "allocine_rating_movie_id_unique" UNIQUE("movie_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cast" (
	"movie_id" integer NOT NULL,
	"person_id" integer NOT NULL,
	"character" varchar(256) NOT NULL,
	"order" integer,
	CONSTRAINT "cast_person_id_movie_id_character_pk" PRIMARY KEY("person_id","movie_id","character")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "crew" (
	"movie_id" integer NOT NULL,
	"person_id" integer NOT NULL,
	"job" "job" NOT NULL,
	CONSTRAINT "crew_person_id_movie_id_job_pk" PRIMARY KEY("person_id","movie_id","job")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "map" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"is_draft" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "movie" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"releaseDate" date NOT NULL,
	"tmdb_id" integer,
	"poster" text NOT NULL,
	"backdrop" text,
	"originalLanguage" varchar(128) NOT NULL,
	"overview" text DEFAULT '' NOT NULL,
	"tagline" text DEFAULT '' NOT NULL,
	"duration" integer NOT NULL,
	CONSTRAINT "unq_movie" UNIQUE("releaseDate","title")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "movies_maps" (
	"movie_id" integer NOT NULL,
	"map_id" integer NOT NULL,
	CONSTRAINT "movies_maps_map_id_movie_id_pk" PRIMARY KEY("map_id","movie_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "person" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"birthday" date,
	"picture" text,
	"deathday" date,
	"gender" "gender" NOT NULL,
	"tmdb_id" integer,
	"known_for" "job" NOT NULL,
	CONSTRAINT "unq_person" UNIQUE NULLS NOT DISTINCT("name","birthday")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "allocine_rating" ADD CONSTRAINT "allocine_rating_movie_id_movie_id_fk" FOREIGN KEY ("movie_id") REFERENCES "movie"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cast" ADD CONSTRAINT "cast_movie_id_movie_id_fk" FOREIGN KEY ("movie_id") REFERENCES "movie"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cast" ADD CONSTRAINT "cast_person_id_person_id_fk" FOREIGN KEY ("person_id") REFERENCES "person"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "crew" ADD CONSTRAINT "crew_movie_id_movie_id_fk" FOREIGN KEY ("movie_id") REFERENCES "movie"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "crew" ADD CONSTRAINT "crew_person_id_person_id_fk" FOREIGN KEY ("person_id") REFERENCES "person"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "movies_maps" ADD CONSTRAINT "movies_maps_movie_id_movie_id_fk" FOREIGN KEY ("movie_id") REFERENCES "movie"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "movies_maps" ADD CONSTRAINT "movies_maps_map_id_map_id_fk" FOREIGN KEY ("map_id") REFERENCES "map"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
