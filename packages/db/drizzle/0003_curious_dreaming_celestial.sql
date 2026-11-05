CREATE TABLE "savings_contributions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"month" text NOT NULL,
	"amount" numeric(20, 0) NOT NULL,
	"memo" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "savings_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" uuid,
	"name" text NOT NULL,
	"institution" text,
	"kind" text DEFAULT 'installment' NOT NULL,
	"interest_rate" numeric(8, 4) DEFAULT '0' NOT NULL,
	"compounding" text DEFAULT 'simple' NOT NULL,
	"term_months" integer,
	"monthly_amount" numeric(20, 0),
	"start_month" text,
	"maturity_month" text,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "savings_contributions" ADD CONSTRAINT "savings_contributions_plan_id_savings_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."savings_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_contributions" ADD CONSTRAINT "savings_contributions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_plans" ADD CONSTRAINT "savings_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_plans" ADD CONSTRAINT "savings_plans_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "savings_contrib_plan_month_uq" ON "savings_contributions" USING btree ("plan_id","month");--> statement-breakpoint
CREATE INDEX "savings_contrib_user_idx" ON "savings_contributions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "savings_plans_user_idx" ON "savings_plans" USING btree ("user_id");