CREATE TABLE "player_watchlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scouting_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"target_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shared_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"view_type" text NOT NULL,
	"view_config" jsonb NOT NULL,
	"title" text,
	"expires_at" timestamp,
	"view_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "shared_views_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "transfer_scenarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"data" jsonb NOT NULL,
	"share_token" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"ai_model" text DEFAULT 'claude-sonnet-4-20250514',
	"max_tokens" integer DEFAULT 4096,
	"temperature" real DEFAULT 0.7,
	"notify_contracts" boolean DEFAULT true,
	"notify_reports" boolean DEFAULT true,
	"notify_scouting" boolean DEFAULT true,
	"notify_risk" boolean DEFAULT true,
	"density" text DEFAULT 'normal',
	"language" text DEFAULT 'pt-BR',
	"sound_enabled" boolean DEFAULT false,
	"haptic_enabled" boolean DEFAULT true,
	"sound_volume" real DEFAULT 0.3,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "neural_analyses" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "onboarding_completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "scouting_targets" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "player_watchlist" ADD CONSTRAINT "player_watchlist_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_watchlist" ADD CONSTRAINT "player_watchlist_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_watchlist" ADD CONSTRAINT "player_watchlist_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scouting_comments" ADD CONSTRAINT "scouting_comments_target_id_scouting_targets_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."scouting_targets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scouting_comments" ADD CONSTRAINT "scouting_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scouting_comments" ADD CONSTRAINT "scouting_comments_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_views" ADD CONSTRAINT "shared_views_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_views" ADD CONSTRAINT "shared_views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_scenarios" ADD CONSTRAINT "transfer_scenarios_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_scenarios" ADD CONSTRAINT "transfer_scenarios_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_watchlist_player_user" ON "player_watchlist" USING btree ("player_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_watchlist_user" ON "player_watchlist" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_sc_target" ON "scouting_comments" USING btree ("target_id");--> statement-breakpoint
CREATE INDEX "idx_sc_org" ON "scouting_comments" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_sv_token" ON "shared_views" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_sv_org" ON "shared_views" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_scenarios_org" ON "transfer_scenarios" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_scenarios_user" ON "transfer_scenarios" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_prefs_user_org" ON "user_preferences" USING btree ("user_id","org_id");--> statement-breakpoint
CREATE INDEX "idx_agentruns_org_created" ON "agent_runs" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_apikeys_active_expires" ON "api_keys" USING btree ("is_active","expires_at");--> statement-breakpoint
CREATE INDEX "idx_reports_published" ON "reports" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "idx_reports_type" ON "reports" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_transfers_date" ON "transfers" USING btree ("transfer_date");