ALTER TYPE "public"."node_type" ADD VALUE 'GENERATION_TEXT_TO_IMAGE' BEFORE 'RESULT_IMAGE';--> statement-breakpoint
ALTER TYPE "public"."node_type" ADD VALUE 'GENERATION_UPSCALE' BEFORE 'RESULT_IMAGE';--> statement-breakpoint
ALTER TYPE "public"."node_type" ADD VALUE 'GENERATION_REMOVE_BG' BEFORE 'RESULT_IMAGE';--> statement-breakpoint
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
	"image_size" text DEFAULT 'landscape_4_3' NOT NULL,
	"guidance_scale" real DEFAULT 3.5 NOT NULL,
	"seed" integer,
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
ALTER TABLE "remove_bg_node_data" ADD CONSTRAINT "remove_bg_node_data_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "text_to_image_node_data" ADD CONSTRAINT "text_to_image_node_data_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upscale_node_data" ADD CONSTRAINT "upscale_node_data_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;