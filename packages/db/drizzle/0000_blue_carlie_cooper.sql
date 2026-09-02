CREATE TYPE "public"."account_type" AS ENUM('checking', 'savings', 'installment', 'brokerage', 'crypto', 'card', 'cash', 'pension', 'loan');--> statement-breakpoint
CREATE TYPE "public"."txn_category" AS ENUM('salary', 'bonus', 'interest', 'dividend', 'other_income', 'housing', 'utilities', 'insurance', 'subscription', 'food', 'transport', 'shopping', 'leisure', 'health', 'education', 'misc', 'saving', 'investment', 'loan_repayment', 'transfer', 'uncategorized');--> statement-breakpoint
CREATE TYPE "public"."txn_direction" AS ENUM('in', 'out', 'transfer');--> statement-breakpoint
CREATE TYPE "public"."asset_class" AS ENUM('stock', 'etf', 'bond', 'crypto', 'fund', 'other');--> statement-breakpoint
CREATE TYPE "public"."trade_side" AS ENUM('buy', 'sell');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text DEFAULT 'me' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"institution" text,
	"type" "account_type" NOT NULL,
	"currency" text DEFAULT 'KRW' NOT NULL,
	"balance" numeric(20, 4) DEFAULT '0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"date" date NOT NULL,
	"amount" numeric(20, 4) NOT NULL,
	"direction" "txn_direction" NOT NULL,
	"category" "txn_category" DEFAULT 'uncategorized' NOT NULL,
	"merchant" text,
	"memo" text,
	"counter_account_id" uuid,
	"source" text,
	"raw" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investment_incomes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"instrument_id" uuid,
	"kind" text NOT NULL,
	"gross" numeric(20, 4) NOT NULL,
	"withheld_tax" numeric(20, 4) DEFAULT '0' NOT NULL,
	"paid_on" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instruments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"symbol" text NOT NULL,
	"market" text NOT NULL,
	"name" text NOT NULL,
	"asset_class" "asset_class" NOT NULL,
	"currency" text DEFAULT 'KRW' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "research_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"instrument_id" uuid,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"tags" text[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"instrument_id" uuid NOT NULL,
	"side" "trade_side" NOT NULL,
	"quantity" numeric(24, 8) NOT NULL,
	"price" numeric(20, 4) NOT NULL,
	"fee" numeric(20, 4) DEFAULT '0' NOT NULL,
	"tax" numeric(20, 4) DEFAULT '0' NOT NULL,
	"fx_rate" numeric(12, 4),
	"traded_at" timestamp with time zone NOT NULL,
	"memo" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "economic_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"country" text,
	"scheduled_at" timestamp with time zone NOT NULL,
	"importance" text,
	"actual" text,
	"forecast" text,
	"previous" text,
	"source" text NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "macro_indicators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"date" date NOT NULL,
	"value" numeric(20, 6) NOT NULL,
	"unit" text,
	"source" text NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market_news" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"publisher" text,
	"published_at" timestamp with time zone,
	"summary" text,
	"symbols" text[],
	"source" text NOT NULL,
	"raw" jsonb,
	"embedding" vector(768),
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market_quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"instrument_id" uuid NOT NULL,
	"date" date NOT NULL,
	"open" numeric(20, 4),
	"high" numeric(20, 4),
	"low" numeric(20, 4),
	"close" numeric(20, 4) NOT NULL,
	"volume" numeric(24, 0),
	"source" text NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "watchlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"instrument_id" uuid NOT NULL,
	"note" text,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"monthly_net_income" numeric(20, 0),
	"monthly_fixed_cost" numeric(20, 0),
	"emergency_fund_months" integer DEFAULT 6 NOT NULL,
	"risk_tolerance" text DEFAULT 'moderate' NOT NULL,
	"target_allocation" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "financial_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "financial_statements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"instrument_id" uuid NOT NULL,
	"fiscal_year" integer NOT NULL,
	"fiscal_period" text NOT NULL,
	"statement" text NOT NULL,
	"consolidated" text DEFAULT 'CFS' NOT NULL,
	"currency" text DEFAULT 'KRW' NOT NULL,
	"period_end" date,
	"items" jsonb NOT NULL,
	"raw" jsonb,
	"source" text NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instrument_fundamentals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"instrument_id" uuid NOT NULL,
	"date" date NOT NULL,
	"market_cap" numeric(24, 0),
	"per" numeric(12, 4),
	"forward_per" numeric(12, 4),
	"pbr" numeric(12, 4),
	"eps" numeric(20, 4),
	"roe" numeric(10, 4),
	"dividend_yield" numeric(10, 4),
	"revenue_ttm" numeric(24, 0),
	"net_income_ttm" numeric(24, 0),
	"debt_to_equity" numeric(12, 4),
	"beta" numeric(8, 4),
	"extra" jsonb,
	"source" text NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instrument_identifiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"instrument_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"external_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment_incomes" ADD CONSTRAINT "investment_incomes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment_incomes" ADD CONSTRAINT "investment_incomes_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment_incomes" ADD CONSTRAINT "investment_incomes_instrument_id_instruments_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instruments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_notes" ADD CONSTRAINT "research_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_notes" ADD CONSTRAINT "research_notes_instrument_id_instruments_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instruments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_instrument_id_instruments_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instruments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_quotes" ADD CONSTRAINT "market_quotes_instrument_id_instruments_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instruments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlist" ADD CONSTRAINT "watchlist_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlist" ADD CONSTRAINT "watchlist_instrument_id_instruments_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instruments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_profiles" ADD CONSTRAINT "financial_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_statements" ADD CONSTRAINT "financial_statements_instrument_id_instruments_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instruments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instrument_fundamentals" ADD CONSTRAINT "instrument_fundamentals_instrument_id_instruments_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instruments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instrument_identifiers" ADD CONSTRAINT "instrument_identifiers_instrument_id_instruments_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instruments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_user_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "txn_user_date_idx" ON "transactions" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "txn_account_idx" ON "transactions" USING btree ("account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "instruments_symbol_market_uq" ON "instruments" USING btree ("symbol","market");--> statement-breakpoint
CREATE INDEX "trades_user_idx" ON "trades" USING btree ("user_id","traded_at");--> statement-breakpoint
CREATE UNIQUE INDEX "events_title_time_uq" ON "economic_events" USING btree ("title","scheduled_at");--> statement-breakpoint
CREATE UNIQUE INDEX "macro_code_date_uq" ON "macro_indicators" USING btree ("code","date");--> statement-breakpoint
CREATE UNIQUE INDEX "news_url_uq" ON "market_news" USING btree ("url");--> statement-breakpoint
CREATE INDEX "news_published_idx" ON "market_news" USING btree ("published_at");--> statement-breakpoint
CREATE UNIQUE INDEX "quotes_instrument_date_uq" ON "market_quotes" USING btree ("instrument_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "watchlist_user_instrument_uq" ON "watchlist" USING btree ("user_id","instrument_id");--> statement-breakpoint
CREATE UNIQUE INDEX "fs_uq" ON "financial_statements" USING btree ("instrument_id","fiscal_year","fiscal_period","statement","consolidated","source");--> statement-breakpoint
CREATE INDEX "fs_instrument_idx" ON "financial_statements" USING btree ("instrument_id");--> statement-breakpoint
CREATE UNIQUE INDEX "fund_uq" ON "instrument_fundamentals" USING btree ("instrument_id","date","source");--> statement-breakpoint
CREATE UNIQUE INDEX "ident_uq" ON "instrument_identifiers" USING btree ("provider","external_id");--> statement-breakpoint
CREATE INDEX "ident_instrument_idx" ON "instrument_identifiers" USING btree ("instrument_id");