CREATE TYPE "public"."lead_priority" AS ENUM('hot', 'warm', 'cold');--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "priority" "lead_priority";--> statement-breakpoint
UPDATE "leads" SET "priority" = 'hot' WHERE "is_featured" = true;--> statement-breakpoint
ALTER TABLE "leads" DROP COLUMN "is_featured";--> statement-breakpoint
ALTER TABLE "leads" DROP COLUMN "is_favorite";