ALTER TABLE "motion_control_node_data" ALTER COLUMN "character_orientation" SET DEFAULT 'video';--> statement-breakpoint
ALTER TABLE "generation_node_data" ADD COLUMN "fal_request_id" text;--> statement-breakpoint
ALTER TABLE "image_to_video_node_data" ADD COLUMN "fal_request_id" text;--> statement-breakpoint
ALTER TABLE "motion_control_node_data" ADD COLUMN "fal_request_id" text;--> statement-breakpoint
ALTER TABLE "remove_bg_node_data" ADD COLUMN "fal_request_id" text;--> statement-breakpoint
ALTER TABLE "text_to_image_node_data" ADD COLUMN "fal_request_id" text;--> statement-breakpoint
ALTER TABLE "upscale_node_data" ADD COLUMN "fal_request_id" text;