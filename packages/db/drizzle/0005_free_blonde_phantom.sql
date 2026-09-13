CREATE TABLE "insurance_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"insurer" text,
	"kind" text DEFAULT 'other' NOT NULL,
	"monthly_premium" numeric(20, 0) DEFAULT '0' NOT NULL,
	"death_amount" numeric(20, 0) DEFAULT '0' NOT NULL,
	"medical_covered" boolean DEFAULT false NOT NULL,
	"cancer_amount" numeric(20, 0) DEFAULT '0' NOT NULL,
	"brain_amount" numeric(20, 0) DEFAULT '0' NOT NULL,
	"heart_amount" numeric(20, 0) DEFAULT '0' NOT NULL,
	"accident_amount" numeric(20, 0) DEFAULT '0' NOT NULL,
	"disability_amount" numeric(20, 0) DEFAULT '0' NOT NULL,
	"start_month" text,
	"end_month" text,
	"memo" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "insurance_policies" ADD CONSTRAINT "insurance_policies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "insurance_policies_user_idx" ON "insurance_policies" USING btree ("user_id");