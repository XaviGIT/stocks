CREATE TABLE "sector_metrics_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sector_id" uuid NOT NULL,
	"period_date" date NOT NULL,
	"avg_pe_ratio" numeric(10, 2),
	"avg_profit_margin" numeric(5, 2),
	"avg_revenue_growth" numeric(5, 2),
	"median_market_cap" bigint,
	"total_market_cap" bigint,
	"company_count" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sectors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"avg_pe_ratio" numeric(10, 2),
	"avg_profit_margin" numeric(5, 2),
	"avg_revenue_growth" numeric(5, 2),
	"market_cap_total" bigint,
	"total_companies" integer DEFAULT 0,
	"last_calculated" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sectors_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "sector_metrics_history" ADD CONSTRAINT "sector_metrics_history_sector_id_sectors_id_fk" FOREIGN KEY ("sector_id") REFERENCES "public"."sectors"("id") ON DELETE cascade ON UPDATE no action;