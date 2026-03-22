CREATE TABLE "image_edit_node_data" (
	"node_id" text PRIMARY KEY NOT NULL,
	"model" text NOT NULL,
	"status" "generation_status" DEFAULT 'PENDING' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"output_node_id" text,
	"aspect_ratio" "aspect_ratio" DEFAULT '1:1' NOT NULL,
	"quality" "quality" DEFAULT '1K' NOT NULL,
	"consumed_credits" integer,
	"fal_request_id" text
);
--> statement-breakpoint
DROP TABLE "generation_node_data" CASCADE;--> statement-breakpoint
ALTER TABLE "image_edit_node_data" ADD CONSTRAINT "image_edit_node_data_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;