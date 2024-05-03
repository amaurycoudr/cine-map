ALTER TABLE "movie" ALTER COLUMN "poster" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "movie" ALTER COLUMN "originalLanguage" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "movie" ALTER COLUMN "overview" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "movie" ALTER COLUMN "overview" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "movie" ALTER COLUMN "tagline" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "movie" ALTER COLUMN "tagline" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "movie" ALTER COLUMN "duration" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "person" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "person" ALTER COLUMN "gender" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "person" ALTER COLUMN "known_for" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "movie" ADD COLUMN "backdrop" text;