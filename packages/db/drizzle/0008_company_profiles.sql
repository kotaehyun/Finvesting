CREATE TABLE "company_overviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"instrument_id" uuid NOT NULL,
	"source" text NOT NULL,
	"corp_name" text,
	"corp_name_en" text,
	"stock_name" text,
	"ceo" text,
	"corp_class" text,
	"address" text,
	"homepage" text,
	"ir_url" text,
	"phone" text,
	"industry_code" text,
	"industry_name" text,
	"established_on" date,
	"fiscal_month" text,
	"items" jsonb,
	"raw" jsonb,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_year_facts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"instrument_id" uuid NOT NULL,
	"fiscal_year" integer NOT NULL,
	"report_code" text DEFAULT '11011' NOT NULL,
	"kind" text NOT NULL,
	"items" jsonb NOT NULL,
	"source" text NOT NULL,
	"raw" jsonb,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "company_overviews" ADD CONSTRAINT "company_overviews_instrument_id_instruments_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instruments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_year_facts" ADD CONSTRAINT "company_year_facts_instrument_id_instruments_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instruments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "company_overview_uq" ON "company_overviews" USING btree ("instrument_id","source");--> statement-breakpoint
CREATE INDEX "company_overview_instrument_idx" ON "company_overviews" USING btree ("instrument_id");--> statement-breakpoint
CREATE UNIQUE INDEX "company_year_fact_uq" ON "company_year_facts" USING btree ("instrument_id","fiscal_year","report_code","kind","source");--> statement-breakpoint
CREATE INDEX "company_year_fact_instrument_idx" ON "company_year_facts" USING btree ("instrument_id");