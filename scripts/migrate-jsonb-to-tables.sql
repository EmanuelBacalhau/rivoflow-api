-- Step 1: Create new enums
CREATE TYPE "public"."generation_status" AS ENUM('PENDING', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');
CREATE TYPE "public"."quality" AS ENUM('0.5K', '1K', '2K', '4K');
CREATE TYPE "public"."aspect_ratio" AS ENUM('1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9');

-- Step 2: Create new tables
CREATE TABLE "prompt_node_data" (
  "node_id" text PRIMARY KEY REFERENCES "nodes"("id") ON DELETE CASCADE,
  "prompt" text NOT NULL DEFAULT ''
);

CREATE TABLE "file_node_data" (
  "node_id" text PRIMARY KEY REFERENCES "nodes"("id") ON DELETE CASCADE,
  "key" text,
  "input_type" text
);

CREATE TABLE "generation_node_data" (
  "node_id" text PRIMARY KEY REFERENCES "nodes"("id") ON DELETE CASCADE,
  "model" text NOT NULL,
  "status" "generation_status" NOT NULL DEFAULT 'PENDING',
  "attempts" integer NOT NULL DEFAULT 0,
  "output_node_id" text,
  "aspect_ratio" "aspect_ratio" NOT NULL DEFAULT '1:1',
  "quality" "quality" NOT NULL DEFAULT '1K'
);

-- Step 3: Migrate PROMPT nodes
INSERT INTO "prompt_node_data" ("node_id", "prompt")
SELECT id, COALESCE(data->>'prompt', '')
FROM nodes
WHERE node_type = 'PROMPT';

-- Step 4: Migrate IMAGE and RESULT_IMAGE nodes
INSERT INTO "file_node_data" ("node_id", "key", "input_type")
SELECT id, data->>'key', data->>'inputType'
FROM nodes
WHERE node_type IN ('IMAGE', 'RESULT_IMAGE');

-- Step 5: Migrate GENERATION_IMAGE nodes
INSERT INTO "generation_node_data" ("node_id", "model", "status", "attempts", "output_node_id", "aspect_ratio", "quality")
SELECT
  id,
  COALESCE(data->>'model', 'gemini-3-pro-image-preview'),
  COALESCE(data->>'status', 'PENDING')::generation_status,
  COALESCE((data->>'attempts')::integer, 0),
  data->>'outputNodeId',
  COALESCE((data->'parameters'->>'aspectRatio')::aspect_ratio, '1:1'::aspect_ratio),
  COALESCE((data->'parameters'->>'quality')::quality, '1K'::quality)
FROM nodes
WHERE node_type = 'GENERATION_IMAGE';

-- Step 6: Drop the JSONB column
ALTER TABLE "nodes" DROP COLUMN "data";
