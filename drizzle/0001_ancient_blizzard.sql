ALTER TYPE "public"."aspect_ratio" ADD VALUE '1:4' BEFORE '2:3';--> statement-breakpoint
ALTER TYPE "public"."aspect_ratio" ADD VALUE '1:8' BEFORE '2:3';--> statement-breakpoint
ALTER TYPE "public"."aspect_ratio" ADD VALUE '4:1' BEFORE '4:3';--> statement-breakpoint
ALTER TYPE "public"."aspect_ratio" ADD VALUE '8:1' BEFORE '9:16';--> statement-breakpoint
ALTER TABLE "generation_node_data" ADD COLUMN "consumed_credits" integer;--> statement-breakpoint
ALTER TABLE "nodes" DROP COLUMN "total_tokens";--> statement-breakpoint
ALTER TABLE "nodes" DROP COLUMN "consumed_credits";