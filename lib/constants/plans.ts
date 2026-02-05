/**
 * Plan type for feature gating: text-only vs text + audio (Stage 3).
 * Used in UI and logic (lowercase).
 */
export type PlanType = "text" | "text_audio";

/** PlanType value as stored in DB (Subscription.planType enum) */
export type PlanTypeDB = "TEXT" | "TEXT_AUDIO" | "TEXT_AUDIO_VIDEO" | "CUSTOM";

/** Subscription plan identifier (DB value) */
export type Plan = keyof typeof PLAN_LIMITS;

/** Map DB planType to UI/logic planType */
export const PLAN_TYPE_FROM_DB: Record<PlanTypeDB, PlanType> = {
  TEXT: "text",
  TEXT_AUDIO: "text_audio",
  TEXT_AUDIO_VIDEO: "text_audio",
  CUSTOM: "text_audio",
};

/** Get planType for checks from subscription (prefer DB planType, fallback to plan) */
export function getPlanTypeFromSubscription(
  subscription: { planType?: string | null; plan?: string | null } | null
): PlanType {
  if (subscription?.planType && subscription.planType in PLAN_TYPE_FROM_DB) {
    return PLAN_TYPE_FROM_DB[subscription.planType as PlanTypeDB];
  }
  const plan = (subscription?.plan || "free") as Plan;
  return getPlanType(plan);
}

/**
 * Plan limits for different subscription tiers.
 * For text_audio plans (pro, enterprise): audio limits apply when upload/transcription is used (Stage 4).
 */
export const PLAN_LIMITS = {
  free: {
    maxProjects: 3,
    maxOutputsPerProject: 1,
    maxCharactersPerContent: 10000,
    maxVariationsPerGeneration: 3,
    /** Plan type: text = no audio upload; text_audio = allow audio + transcription */
    planType: "text" as PlanType,
    /** Not applicable for text-only */
    audioMinutesPerMonth: null as number | null,
    maxAudioFileSizeMb: null as number | null,
  },
  pro: {
    maxProjects: 50,
    maxOutputsPerProject: 5,
    maxCharactersPerContent: 5000,
    maxVariationsPerGeneration: 5,
    planType: "text_audio" as PlanType,
    audioMinutesPerMonth: 120,
    maxAudioFileSizeMb: 100,
  },
  enterprise: {
    maxProjects: 500,
    maxOutputsPerProject: 10,
    maxCharactersPerContent: 10000,
    maxVariationsPerGeneration: 10,
    planType: "text_audio" as PlanType,
    audioMinutesPerMonth: 600,
    maxAudioFileSizeMb: 500,
  },
} as const;

/** Map subscription plan to plan type (for feature checks) */
export function getPlanType(plan: Plan): PlanType {
  return PLAN_LIMITS[plan].planType;
}

/** Whether the plan allows audio upload and transcription */
export function canUseAudio(plan: Plan): boolean {
  return getPlanType(plan) === "text_audio";
}

/** Get audio limits for the plan (null if text-only) */
export function getAudioLimits(plan: Plan): { audioMinutesPerMonth: number; maxAudioFileSizeMb: number } | null {
  const limits = PLAN_LIMITS[plan];
  if (limits.planType !== "text_audio" || limits.audioMinutesPerMonth == null || limits.maxAudioFileSizeMb == null) {
    return null;
  }
  return {
    audioMinutesPerMonth: limits.audioMinutesPerMonth,
    maxAudioFileSizeMb: limits.maxAudioFileSizeMb,
  };
}