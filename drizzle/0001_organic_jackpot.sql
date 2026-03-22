ALTER TYPE "public"."node_type" ADD VALUE 'GENERATION_MOTION_CONTROL' BEFORE 'RESULT_IMAGE';--> statement-breakpoint
CREATE TABLE "motion_control_node_data" (
	"node_id" text PRIMARY KEY NOT NULL,
	"model" text NOT NULL,
	"status" "generation_status" DEFAULT 'PENDING' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"output_node_id" text,
	"character_orientation" text DEFAULT 'image' NOT NULL,
	"keep_original_sound" boolean DEFAULT true NOT NULL,
	"consumed_credits" integer
);
--> statement-breakpoint
ALTER TABLE "motion_control_node_data" ADD CONSTRAINT "motion_control_node_data_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;