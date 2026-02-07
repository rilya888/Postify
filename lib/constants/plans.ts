/**
 * Plan type for feature gating: text-only vs text + audio.
 * Used in UI and logic (lowercase).
 */
export type PlanType = "text" | "text_audio";

/** PlanType value as stored in DB (Subscription.planType enum) */
export type PlanTypeDB = "TEXT" | "TEXT_AUDIO" | "TEXT_AUDIO_VIDEO" | "CUSTOM";

/**
 * Plan limits for different subscription tiers.
 * Keys: trial (computed, not stored), free, pro, max, enterprise.
 */
export const PLAN_LIMITS = {
  /** Trial: 3 days from registration, 3 projects, text + audio */
  trial: {
    maxProjects: 3,
    maxOutputsPerProject: 5,
    maxCharactersPerContent: 5000,
    maxVariationsPerGeneration: 5,
    planType: "text_audio" as PlanType,
    audioMinutesPerMonth: 60,
    maxAudioFileSizeMb: 50,
  },
  /** Free: after trial or no trial; text only, no new projects */
  free: {
    maxProjects: 0,
    maxOutputsPerProject: 1,
    maxCharactersPerContent: 10000,
    maxVariationsPerGeneration: 3,
    planType: "text" as PlanType,
    audioMinutesPerMonth: null as number | null,
    maxAudioFileSizeMb: null as number | null,
  },
  /** Pro: paid, text only, no audio */
  pro: {
    maxProjects: 50,
    maxOutputsPerProject: 5,
    maxCharactersPerContent: 5000,
    maxVariationsPerGeneration: 5,
    planType: "text" as PlanType,
    audioMinutesPerMonth: null as number | null,
    maxAudioFileSizeMb: null as number | null,
  },
  /** Max: paid, between Pro and Enterprise, includes audio */
  max: {
    maxProjects: 75,
    maxOutputsPerProject: 7,
    maxCharactersPerContent: 7500,
    maxVariationsPerGeneration: 7,
    planType: "text_audio" as PlanType,
    audioMinutesPerMonth: 300,
    maxAudioFileSizeMb: 250,
  },
  /** Enterprise: paid, highest limits, includes audio */
  enterprise: {
    maxProjects: 150,
    maxOutputsPerProject: 12,
    maxCharactersPerContent: 15000,
    maxVariationsPerGeneration: 15,
    planType: "text_audio" as PlanType,
    audioMinutesPerMonth: 900,
    maxAudioFileSizeMb: 750,
  },
} as const;

/** Max outputs per project for Enterprise (used by validation and UI) */
export const MAX_OUTPUTS_PER_PROJECT_ENTERPRISE =
  PLAN_LIMITS.enterprise.maxOutputsPerProject;

/** Subscription plan identifier (effective or DB value) */
export type Plan = keyof typeof PLAN_LIMITS;

/** Map DB planType to UI/logic planType */
export const PLAN_TYPE_FROM_DB: Record<PlanTypeDB, PlanType> = {
  TEXT: "text",
  TEXT_AUDIO: "text_audio",
  TEXT_AUDIO_VIDEO: "text_audio",
  CUSTOM: "text_audio",
};

/** Valid plan values stored in DB (Subscription.plan) */
const DB_PLANS = ["free", "pro", "max", "enterprise"] as const;
export type PlanDB = (typeof DB_PLANS)[number];

export function isPlanDB(plan: string | null | undefined): plan is PlanDB {
  return plan != null && DB_PLANS.includes(plan as PlanDB);
}

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

/** Trial duration in milliseconds (3 days) */
const TRIAL_DURATION_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * Resolve effective plan from subscription and user registration date.
 * Trial: no paid plan and user created within last 3 days.
 * DB stores only "free" | "pro" | "max" | "enterprise"; "trial" is computed.
 */
export function getEffectivePlan(
  subscription: { plan?: string | null } | null,
  userCreatedAt: Date | string | null
): Plan {
  const plan = subscription?.plan;
  if (plan === "pro" || plan === "max" || plan === "enterprise") {
    return plan;
  }
  if (userCreatedAt != null) {
    const createdMs = typeof userCreatedAt === "string" ? new Date(userCreatedAt).getTime() : userCreatedAt.getTime();
    if (createdMs + TRIAL_DURATION_MS > Date.now()) {
      return "trial";
    }
  }
  return "free";
}

/** Map subscription plan to plan type (for feature checks) */
export function getPlanType(plan: Plan): PlanType {
  return PLAN_LIMITS[plan].planType;
}

export type PlanCapabilities = {
  canUseAudio: boolean;
  canUseSeries: boolean;
  canUsePostTone: boolean;
  canUseBrandVoice: boolean;
  maxPostsPerPlatform: number;
};

/** Resolve feature capabilities for a plan. */
export function getPlanCapabilities(plan: Plan): PlanCapabilities {
  const audioEnabled = getPlanType(plan) === "text_audio";
  const isEnterprise = plan === "enterprise";
  return {
    canUseAudio: audioEnabled,
    canUseSeries: isEnterprise,
    canUsePostTone: isEnterprise,
    canUseBrandVoice: isEnterprise,
    maxPostsPerPlatform: isEnterprise ? 3 : 1,
  };
}

/** Whether the plan allows audio upload and transcription */
export function canUseAudio(plan: Plan): boolean {
  return getPlanCapabilities(plan).canUseAudio;
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
