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
CREATE TABLE IF NOT EXISTS "cast" (
	"movie_id" integer NOT NULL,
	"person_id" integer NOT NULL,
	"character" varchar(256) NOT NULL,
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
	"title" text,
	"description" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "movie" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"releaseDate" date NOT NULL,
	"tmdb_id" integer,
	"posterPath" text,
	"originalLanguage" varchar(128),
	"overview" text,
	"tagline" text,
	"duration" integer,
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
	"name" text,
	"birthday" date,
	"deathday" date,
	"gender" "gender",
	"tmdb_id" integer,
	"known_for" "job",
	CONSTRAINT "unq_person" UNIQUE NULLS NOT DISTINCT("name","birthday")
);
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
 ALTER TABLE "movies_maps" ADD CONSTRAINT "movies_maps_map_id_person_id_fk" FOREIGN KEY ("map_id") REFERENCES "person"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
