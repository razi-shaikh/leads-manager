ALTER TABLE "leads" ADD COLUMN "is_featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "is_favorite" boolean DEFAULT false NOT NULL;