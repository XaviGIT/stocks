CREATE TABLE "valuations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"scenario_name" varchar(100) DEFAULT 'Base Case' NOT NULL,
	"discount_rate" numeric(5, 2) NOT NULL,
	"perpetual_growth_rate" numeric(5, 2) NOT NULL,
	"shares_outstanding" bigint NOT NULL,
	"fcf_year_1" bigint,
	"fcf_year_2" bigint,
	"fcf_year_3" bigint,
	"fcf_year_4" bigint,
	"fcf_year_5" bigint,
	"fcf_year_6" bigint,
	"fcf_year_7" bigint,
	"fcf_year_8" bigint,
	"fcf_year_9" bigint,
	"fcf_year_10" bigint,
	"total_discounted_fcf" bigint,
	"perpetuity_value" bigint,
	"discounted_perpetuity_value" bigint,
	"total_equity_value" bigint,
	"intrinsic_value_per_share" numeric(10, 2),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "valuations" ADD CONSTRAINT "valuations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;