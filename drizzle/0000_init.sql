CREATE TYPE "public"."lead_event_type" AS ENUM('import', 'status_change', 'note', 'edit', 'photo');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('new_lead', 'qualified', 'follow_up', 'negotiation', 'closed_won', 'closed_lost');--> statement-breakpoint
CREATE TABLE "lead_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"type" "lead_event_type" NOT NULL,
	"from_status" "lead_status",
	"to_status" "lead_status",
	"detail" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_id" text,
	"source" text NOT NULL,
	"lead_date" timestamp with time zone,
	"customer_name" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"brand_model" text DEFAULT '' NOT NULL,
	"reg_no" text DEFAULT '' NOT NULL,
	"year" integer,
	"photos" text[] DEFAULT '{}' NOT NULL,
	"km_driven" integer,
	"owners" integer,
	"location" text DEFAULT '' NOT NULL,
	"expected_price" integer,
	"status" "lead_status" DEFAULT 'new_lead' NOT NULL,
	"is_duplicate" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lead_events" ADD CONSTRAINT "lead_events_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;