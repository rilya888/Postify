-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('TEXT', 'TEXT_AUDIO', 'TEXT_AUDIO_VIDEO', 'CUSTOM');

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN "planType" "PlanType" NOT NULL DEFAULT 'TEXT';
ALTER TABLE "subscriptions" ADD COLUMN "audioMinutesResetAt" TIMESTAMP(3);

-- Backfill planType from plan
UPDATE "subscriptions"
SET "planType" = CASE
  WHEN "plan" = 'free' THEN 'TEXT'::"PlanType"
  WHEN "plan" IN ('pro', 'enterprise') THEN 'TEXT_AUDIO'::"PlanType"
  ELSE 'TEXT'::"PlanType"
END;

-- Set audioMinutesResetAt = currentPeriodEnd where available
UPDATE "subscriptions"
SET "audioMinutesResetAt" = "currentPeriodEnd"
WHERE "currentPeriodEnd" IS NOT NULL;
