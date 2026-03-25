ALTER TABLE "nodes" ALTER COLUMN "node_type" SET DATA TYPE text;--> statement-breakpoint
UPDATE "nodes" SET "node_type" = 'GENERATION_IMAGE_EDIT' WHERE "node_type" = 'GENERATION_IMAGE';--> statement-breakpoint
DROP TYPE "public"."node_type";--> statement-breakpoint
CREATE TYPE "public"."node_type" AS ENUM('PROMPT', 'IMAGE', 'VIDEO', 'GENERATION_IMAGE_EDIT', 'GENERATION_TEXT_TO_IMAGE', 'GENERATION_UPSCALE', 'GENERATION_REMOVE_BG', 'GENERATION_IMAGE_TO_VIDEO', 'GENERATION_MOTION_CONTROL', 'RESULT_IMAGE', 'RESULT_VIDEO');--> statement-breakpoint
ALTER TABLE "nodes" ALTER COLUMN "node_type" SET DATA TYPE "public"."node_type" USING "node_type"::"public"."node_type";
