/**
 * AI model and generation parameters by subscription plan and platform.
 * Per PLAN_two_tier_subscription: models from config by plan, not hardcoded.
 */

import type { Plan } from "@/lib/constants/plans";
import type { Platform } from "@/lib/constants/platforms";

/** Content Pack: one call per source, strict JSON. Temperature 0.0–0.2, max_tokens 800–1500 */
export const CONTENT_PACK_PARAMS = {
  model: "gpt-4o-mini",
  temperature: 0.2,
  maxTokens: 1500,
} as const;

/** Default generation model (fallback: gpt-3.5-turbo per plan) */
export const GENERATE_FALLBACK_MODEL = "gpt-3.5-turbo";

/** Transcription (Stage 4, plan text_audio) */
export const TRANSCRIPTION_MODEL = "whisper-1";

/** Whisper API cost estimate: USD per minute (for Transcript.costEstimate). */
export const WHISPER_COST_PER_MINUTE = 0.006;

/** When source length >= this, always use Content Pack (no fallback to raw text). */
export const LONG_TEXT_THRESHOLD_CHARS = 15_000;

/** Max concurrent platform generations per request (cost protection). */
export const GENERATION_CONCURRENCY = 3;

/** Per-platform max_tokens: LinkedIn 500–900, Email 800–1400, etc. */
export const MAX_TOKENS_BY_PLATFORM: Record<Platform, number> = {
  linkedin: 900,
  twitter: 500,
  email: 1400,
  instagram: 900,
  facebook: 1200,
  tiktok: 500,
  youtube: 1500,
};

/** Per-platform temperature: posts 0.7, email 0.5–0.7 */
export const TEMPERATURE_BY_PLATFORM: Record<Platform, number> = {
  linkedin: 0.7,
  twitter: 0.7,
  email: 0.6,
  instagram: 0.7,
  facebook: 0.7,
  tiktok: 0.7,
  youtube: 0.7,
};

/** Default generate model per plan (text tier; text_audio uses same until Stage 4) */
const GENERATE_MODEL_BY_PLAN: Record<Plan, string> = {
  free: "gpt-4o-mini",
  pro: "gpt-4o-mini",
  enterprise: "gpt-4o",
};

export type ModelConfig = {
  contentPack: {
    model: string;
    temperature: number;
    maxTokens: number;
  };
  generate: {
    defaultModel: string;
    fallbackModel: string;
    maxTokensByPlatform: Record<Platform, number>;
    temperatureByPlatform: Record<Platform, number>;
  };
  transcription?: {
    model: string;
  };
};

/**
 * Get model and generation params for a subscription plan.
 * Used in content-pack, generate, and (later) transcription.
 */
export function getModelConfig(plan: Plan): ModelConfig {
  return {
    contentPack: {
      model: CONTENT_PACK_PARAMS.model,
      temperature: CONTENT_PACK_PARAMS.temperature,
      maxTokens: CONTENT_PACK_PARAMS.maxTokens,
    },
    generate: {
      defaultModel: GENERATE_MODEL_BY_PLAN[plan],
      fallbackModel: GENERATE_FALLBACK_MODEL,
      maxTokensByPlatform: { ...MAX_TOKENS_BY_PLATFORM },
      temperatureByPlatform: { ...TEMPERATURE_BY_PLATFORM },
    },
    transcription: {
      model: TRANSCRIPTION_MODEL,
    },
  };
}

/** Get default generate model for plan */
export function getGenerateModel(plan: Plan): string {
  return getModelConfig(plan).generate.defaultModel;
}

/** Get max_tokens for a platform (from config) */
export function getMaxTokensForPlatform(plan: Plan, platform: Platform): number {
  return getModelConfig(plan).generate.maxTokensByPlatform[platform];
}

/** Get temperature for a platform (from config) */
export function getTemperatureForPlatform(plan: Plan, platform: Platform): number {
  return getModelConfig(plan).generate.temperatureByPlatform[platform];
}
