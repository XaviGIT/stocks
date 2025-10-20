ALTER TABLE "companies" ADD COLUMN "sector_id" uuid;--> statement-breakpoint
ALTER TABLE "sectors" ADD COLUMN "industry" varchar(100);--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_sector_id_sectors_id_fk" FOREIGN KEY ("sector_id") REFERENCES "public"."sectors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" DROP COLUMN "sector";