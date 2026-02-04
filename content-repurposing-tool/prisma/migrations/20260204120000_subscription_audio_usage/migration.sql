-- AlterTable: add audio usage fields to subscriptions (Stage 3: text_audio plan)
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "audioMinutesUsedThisPeriod" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "audioMinutesLimit" INTEGER;
