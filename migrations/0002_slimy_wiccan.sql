CREATE TABLE "company_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"ipo_date" date,
	"is_spinoff" boolean DEFAULT false,
	"spinoff_date" date,
	"parent_company" varchar(255),
	"market_cap_category" varchar(20),
	"peter_lynch_category" varchar(50),
	"is_business_stable" boolean DEFAULT false,
	"can_understand_debt" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "company_metadata" ADD CONSTRAINT "company_metadata_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;