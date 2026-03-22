CREATE TYPE "public"."account_role" AS ENUM('USER', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."aspect_ratio" AS ENUM('1:1', '1:4', '1:8', '2:3', '3:2', '3:4', '4:1', '4:3', '4:5', '5:4', '8:1', '9:16', '16:9', '21:9');--> statement-breakpoint
CREATE TYPE "public"."generation_status" AS ENUM('PENDING', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."node_type" AS ENUM('PROMPT', 'IMAGE', 'GENERATION_IMAGE', 'GENERATION_TEXT_TO_IMAGE', 'GENERATION_UPSCALE', 'GENERATION_REMOVE_BG', 'GENERATION_IMAGE_TO_VIDEO', 'RESULT_IMAGE', 'RESULT_VIDEO');--> statement-breakpoint
CREATE TYPE "public"."quality" AS ENUM('0.5K', '1K', '2K', '4K');--> statement-breakpoint
CREATE TABLE "account_balances" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"lifetime_deposited" integer DEFAULT 0 NOT NULL,
	"lifetime_spent" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "account_balances_account_id_unique" UNIQUE("account_id")
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"provider" text NOT NULL,
	"external_id" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text,
	"picture" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"role" "account_role" DEFAULT 'USER' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "edges" (
	"id" text PRIMARY KEY NOT NULL,
	"flow_id" text NOT NULL,
	"source_node_id" text NOT NULL,
	"target_node_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "file_node_data" (
	"node_id" text PRIMARY KEY NOT NULL,
	"key" text,
	"input_type" text
);
--> statement-breakpoint
CREATE TABLE "flows" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"account_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "generation_node_data" (
	"node_id" text PRIMARY KEY NOT NULL,
	"model" text NOT NULL,
	"status" "generation_status" DEFAULT 'PENDING' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"output_node_id" text,
	"aspect_ratio" "aspect_ratio" DEFAULT '1:1' NOT NULL,
	"quality" "quality" DEFAULT '1K' NOT NULL,
	"consumed_credits" integer
);
--> statement-breakpoint
CREATE TABLE "image_to_video_node_data" (
	"node_id" text PRIMARY KEY NOT NULL,
	"model" text NOT NULL,
	"status" "generation_status" DEFAULT 'PENDING' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"output_node_id" text,
	"tier" text DEFAULT 'standard' NOT NULL,
	"duration" text DEFAULT '5' NOT NULL,
	"resolution" text DEFAULT '1080p' NOT NULL,
	"video_aspect_ratio" text DEFAULT '16:9' NOT NULL,
	"generate_audio" boolean DEFAULT true NOT NULL,
	"consumed_credits" integer
);
--> statement-breakpoint
CREATE TABLE "nodes" (
	"id" text PRIMARY KEY NOT NULL,
	"flow_id" text NOT NULL,
	"node_type" "node_type" NOT NULL,
	"position_x" real NOT NULL,
	"position_y" real NOT NULL,
	"is_executed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompt_node_data" (
	"node_id" text PRIMARY KEY NOT NULL,
	"prompt" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "remove_bg_node_data" (
	"node_id" text PRIMARY KEY NOT NULL,
	"model" text NOT NULL,
	"status" "generation_status" DEFAULT 'PENDING' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"output_node_id" text,
	"consumed_credits" integer
);
--> statement-breakpoint
CREATE TABLE "text_to_image_node_data" (
	"node_id" text PRIMARY KEY NOT NULL,
	"model" text NOT NULL,
	"status" "generation_status" DEFAULT 'PENDING' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"output_node_id" text,
	"aspect_ratio" "aspect_ratio" DEFAULT '1:1' NOT NULL,
	"quality" "quality" DEFAULT '1K' NOT NULL,
	"consumed_credits" integer
);
--> statement-breakpoint
CREATE TABLE "upscale_node_data" (
	"node_id" text PRIMARY KEY NOT NULL,
	"model" text NOT NULL,
	"status" "generation_status" DEFAULT 'PENDING' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"output_node_id" text,
	"scale" integer DEFAULT 2 NOT NULL,
	"consumed_credits" integer
);
--> statement-breakpoint
CREATE TABLE "video_file_node_data" (
	"node_id" text PRIMARY KEY NOT NULL,
	"key" text,
	"duration" real,
	"fps" real
);
--> statement-breakpoint
ALTER TABLE "account_balances" ADD CONSTRAINT "account_balances_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edges" ADD CONSTRAINT "edges_flow_id_flows_id_fk" FOREIGN KEY ("flow_id") REFERENCES "public"."flows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edges" ADD CONSTRAINT "edges_source_node_id_nodes_id_fk" FOREIGN KEY ("source_node_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edges" ADD CONSTRAINT "edges_target_node_id_nodes_id_fk" FOREIGN KEY ("target_node_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_node_data" ADD CONSTRAINT "file_node_data_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flows" ADD CONSTRAINT "flows_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generation_node_data" ADD CONSTRAINT "generation_node_data_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_to_video_node_data" ADD CONSTRAINT "image_to_video_node_data_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_flow_id_flows_id_fk" FOREIGN KEY ("flow_id") REFERENCES "public"."flows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_node_data" ADD CONSTRAINT "prompt_node_data_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "remove_bg_node_data" ADD CONSTRAINT "remove_bg_node_data_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "text_to_image_node_data" ADD CONSTRAINT "text_to_image_node_data_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upscale_node_data" ADD CONSTRAINT "upscale_node_data_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_file_node_data" ADD CONSTRAINT "video_file_node_data_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;