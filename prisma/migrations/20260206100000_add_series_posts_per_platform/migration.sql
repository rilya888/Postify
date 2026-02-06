-- AlterTable: add postsPerPlatform to projects (Enterprise: 1-3 posts per platform)
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "postsPerPlatform" INTEGER;

-- AlterTable: add seriesIndex to outputs (1-based post index in series; existing rows get 1)
ALTER TABLE "outputs" ADD COLUMN IF NOT EXISTS "seriesIndex" INTEGER NOT NULL DEFAULT 1;

-- Drop old unique constraint (one output per project+platform)
ALTER TABLE "outputs" DROP CONSTRAINT IF EXISTS "outputs_projectId_platform_key";

-- Add new unique constraint (one output per project+platform+seriesIndex)
ALTER TABLE "outputs" ADD CONSTRAINT "outputs_projectId_platform_seriesIndex_key" UNIQUE ("projectId", "platform", "seriesIndex");
