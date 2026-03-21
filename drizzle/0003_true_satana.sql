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
CREATE TABLE "video_file_node_data" (
	"node_id" text PRIMARY KEY NOT NULL,
	"key" text,
	"duration" real,
	"fps" real
);
--> statement-breakpoint
ALTER TABLE "image_to_video_node_data" ADD CONSTRAINT "image_to_video_node_data_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_file_node_data" ADD CONSTRAINT "video_file_node_data_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;