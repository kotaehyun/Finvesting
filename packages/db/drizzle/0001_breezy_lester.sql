ALTER TYPE "public"."txn_category" ADD VALUE 'phone' BEFORE 'food';--> statement-breakpoint
ALTER TYPE "public"."txn_category" ADD VALUE 'income_tax' BEFORE 'food';--> statement-breakpoint
ALTER TYPE "public"."txn_category" ADD VALUE 'health_insurance' BEFORE 'food';--> statement-breakpoint
CREATE TABLE "income_tax_months" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"month" text NOT NULL,
	"amount" numeric(20, 0) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recurring_costs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"amount" numeric(20, 0) NOT NULL,
	"day_of_month" integer,
	"memo" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "financial_profiles" ADD COLUMN "monthly_gross_income" numeric(20, 0);--> statement-breakpoint
ALTER TABLE "financial_profiles" ADD COLUMN "monthly_income_tax" numeric(20, 0);--> statement-breakpoint
ALTER TABLE "financial_profiles" ADD COLUMN "monthly_health_insurance" numeric(20, 0);--> statement-breakpoint
ALTER TABLE "income_tax_months" ADD CONSTRAINT "income_tax_months_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_costs" ADD CONSTRAINT "recurring_costs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "income_tax_months_user_month_uq" ON "income_tax_months" USING btree ("user_id","month");--> statement-breakpoint
CREATE INDEX "recurring_costs_user_idx" ON "recurring_costs" USING btree ("user_id");