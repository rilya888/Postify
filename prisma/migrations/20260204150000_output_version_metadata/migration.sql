-- AlterTable: add generationMetadata to output_versions (Stage 6)
ALTER TABLE "output_versions" ADD COLUMN IF NOT EXISTS "generationMetadata" JSONB;
