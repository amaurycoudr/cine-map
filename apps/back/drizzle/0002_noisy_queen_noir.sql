ALTER TABLE "movies_maps" DROP CONSTRAINT "movies_maps_map_id_person_id_fk";
--> statement-breakpoint
ALTER TABLE "map" ALTER COLUMN "title" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "map" ALTER COLUMN "title" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "map" ALTER COLUMN "description" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "map" ALTER COLUMN "description" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "map" ALTER COLUMN "is_draft" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "map" ALTER COLUMN "is_draft" SET NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "movies_maps" ADD CONSTRAINT "movies_maps_map_id_map_id_fk" FOREIGN KEY ("map_id") REFERENCES "map"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
