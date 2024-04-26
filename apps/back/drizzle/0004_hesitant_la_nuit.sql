ALTER TABLE "allocine_rating" ALTER COLUMN "movie_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "movie" ADD COLUMN "allocine_rating" integer;