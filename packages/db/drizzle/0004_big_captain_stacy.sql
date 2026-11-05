CREATE TABLE "payroll_months" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"month" text NOT NULL,
	"base_amount" numeric(20, 0) DEFAULT '0' NOT NULL,
	"allowance_amount" numeric(20, 0) DEFAULT '0' NOT NULL,
	"bonus_amount" numeric(20, 0) DEFAULT '0' NOT NULL,
	"other_amount" numeric(20, 0) DEFAULT '0' NOT NULL,
	"gross_amount" numeric(20, 0) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(20, 0) DEFAULT '0' NOT NULL,
	"insurance_amount" numeric(20, 0) DEFAULT '0' NOT NULL,
	"net_amount" numeric(20, 0) DEFAULT '0' NOT NULL,
	"earnings" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payroll_months" ADD CONSTRAINT "payroll_months_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "payroll_months_user_month_uq" ON "payroll_months" USING btree ("user_id","month");