-- Add industries table
CREATE TABLE IF NOT EXISTS "industries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(150) NOT NULL,
  "description" text,
  "sector_id" uuid,
  "avg_pe_ratio" numeric(10, 2),
  "avg_profit_margin" numeric(5, 2),
  "avg_revenue_growth" numeric(5, 2),
  "market_cap_total" bigint,
  "total_companies" integer DEFAULT 0,
  "last_calculated" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "industries_name_unique" UNIQUE("name")
);

CREATE TABLE IF NOT EXISTS "industry_metrics_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "industry_id" uuid NOT NULL,
  "period_date" date NOT NULL,
  "avg_pe_ratio" numeric(10, 2),
  "avg_profit_margin" numeric(5, 2),
  "avg_revenue_growth" numeric(5, 2),
  "median_market_cap" bigint,
  "total_market_cap" bigint,
  "company_count" integer,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Add industry_id to companies
ALTER TABLE "companies" ADD COLUMN "industry_id" uuid;

-- Add foreign keys
ALTER TABLE "industries"
  ADD CONSTRAINT "industries_sector_id_sectors_id_fk"
  FOREIGN KEY ("sector_id")
  REFERENCES "public"."sectors"("id")
  ON DELETE set null;

ALTER TABLE "companies"
  ADD CONSTRAINT "companies_industry_id_industries_id_fk"
  FOREIGN KEY ("industry_id")
  REFERENCES "public"."industries"("id")
  ON DELETE set null;

ALTER TABLE "industry_metrics_history"
  ADD CONSTRAINT "industry_metrics_history_industry_id_industries_id_fk"
  FOREIGN KEY ("industry_id")
  REFERENCES "public"."industries"("id")
  ON DELETE cascade;

-- Create indexes
CREATE INDEX IF NOT EXISTS "companies_industry_id_idx" ON "companies" ("industry_id");
CREATE INDEX IF NOT EXISTS "industry_metrics_history_industry_id_idx" ON "industry_metrics_history" ("industry_id");
CREATE INDEX IF NOT EXISTS "industry_metrics_history_period_date_idx" ON "industry_metrics_history" ("period_date");