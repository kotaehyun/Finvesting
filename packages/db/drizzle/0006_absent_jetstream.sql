CREATE TABLE "audit_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"instrument_id" uuid NOT NULL,
	"fiscal_year" integer NOT NULL,
	"report_code" text DEFAULT '11011' NOT NULL,
	"auditor" text,
	"opinion" text,
	"emphasis" text,
	"key_audit_matters" text,
	"receipt_no" text,
	"settled_on" date,
	"source" text NOT NULL,
	"raw" jsonb,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_reports" ADD CONSTRAINT "audit_reports_instrument_id_instruments_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instruments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "audit_uq" ON "audit_reports" USING btree ("instrument_id","fiscal_year","report_code","source");--> statement-breakpoint
CREATE INDEX "audit_instrument_idx" ON "audit_reports" USING btree ("instrument_id");