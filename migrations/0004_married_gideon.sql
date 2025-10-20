CREATE TABLE "stock_stories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"content" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"last_edited" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "story_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"story_id" uuid NOT NULL,
	"content" jsonb NOT NULL,
	"version" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "stock_stories" ADD CONSTRAINT "stock_stories_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_versions" ADD CONSTRAINT "story_versions_story_id_stock_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stock_stories"("id") ON DELETE cascade ON UPDATE no action;