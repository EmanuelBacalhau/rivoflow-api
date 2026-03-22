ALTER TYPE "public"."aspect_ratio" ADD VALUE '1:4' BEFORE '2:3';--> statement-breakpoint
ALTER TYPE "public"."aspect_ratio" ADD VALUE '1:8' BEFORE '2:3';--> statement-breakpoint
ALTER TYPE "public"."aspect_ratio" ADD VALUE '4:1' BEFORE '4:3';--> statement-breakpoint
ALTER TYPE "public"."aspect_ratio" ADD VALUE '8:1' BEFORE '9:16';--> statement-breakpoint
ALTER TYPE "public"."node_type" ADD VALUE 'GENERATION_TEXT_TO_IMAGE' BEFORE 'RESULT_IMAGE';--> statement-breakpoint
ALTER TYPE "public"."node_type" ADD VALUE 'GENERATION_UPSCALE' BEFORE 'RESULT_IMAGE';--> statement-breakpoint
ALTER TYPE "public"."node_type" ADD VALUE 'GENERATION_REMOVE_BG' BEFORE 'RESULT_IMAGE';--> statement-breakpoint
ALTER TYPE "public"."node_type" ADD VALUE 'GENERATION_IMAGE_TO_VIDEO' BEFORE 'RESULT_IMAGE';--> statement-breakpoint
ALTER TYPE "public"."node_type" ADD VALUE 'RESULT_VIDEO';--> statement-breakpoint
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
	"face" boolean DEFAULT false NOT NULL,
	"upscale_model" text DEFAULT 'RealESRGAN_x4plus' NOT NULL,
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
ALTER TABLE "generation_node_data" ADD COLUMN "consumed_credits" integer;--> statement-breakpoint
ALTER TABLE "image_to_video_node_data" ADD CONSTRAINT "image_to_video_node_data_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "remove_bg_node_data" ADD CONSTRAINT "remove_bg_node_data_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "text_to_image_node_data" ADD CONSTRAINT "text_to_image_node_data_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upscale_node_data" ADD CONSTRAINT "upscale_node_data_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_file_node_data" ADD CONSTRAINT "video_file_node_data_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nodes" DROP COLUMN "total_tokens";--> statement-breakpoint
ALTER TABLE "nodes" DROP COLUMN "consumed_credits";