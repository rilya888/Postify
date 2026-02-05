import { prisma } from "@/lib/db/prisma";
import {
  PLAN_LIMITS,
  getEffectivePlan,
  getPlanType,
  getAudioLimits,
} from "@/lib/constants/plans";
import { Logger } from "@/lib/utils/logger";
import { addMonths } from "@/lib/utils/date";

const TRIAL_DURATION_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * Quota service: uses effective plan (trial from User.createdAt, or subscription plan).
 */
export async function checkProjectQuota(userId: string) {
  Logger.info("Checking project quota", { userId });

  const [user, subscription] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } }),
    prisma.subscription.findUnique({ where: { userId } }),
  ]);

  const effectivePlan = getEffectivePlan(subscription, user?.createdAt ?? null);
  const limits = PLAN_LIMITS[effectivePlan];
  const limit = limits.maxProjects;
  const planType = getPlanType(effectivePlan);

  const projectCount = await prisma.project.count({
    where: { userId },
  });

  const result = {
    canCreate: projectCount < limit,
    current: projectCount,
    limit,
    plan: effectivePlan,
    planType,
    canUseAudio: planType === "text_audio",
  };

  Logger.info("Quota check result", { userId, ...result });
  return result;
}

/**
 * Reset audio quota when period has ended (audioMinutesResetAt or currentPeriodEnd in the past).
 */
export async function resetAudioQuotaIfPeriodEnded(userId: string): Promise<void> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });
  if (!subscription || subscription.audioMinutesLimit == null) return;

  const now = new Date();
  const resetAt = subscription.audioMinutesResetAt ?? subscription.currentPeriodEnd;
  if (resetAt == null || now <= resetAt) return;

  await prisma.subscription.update({
    where: { userId },
    data: {
      audioMinutesUsedThisPeriod: 0,
      audioMinutesResetAt: addMonths(now, 1),
      updatedAt: now,
    },
  });
}

/**
 * Check audio transcription quota for trial/enterprise (text_audio) plans.
 * For trial without Subscription: returns allowed with limit from PLAN_LIMITS.trial, used 0.
 */
export async function checkAudioQuota(userId: string): Promise<{
  allowed: boolean;
  planType: "text" | "text_audio";
  usedMinutes: number;
  limitMinutes: number | null;
  canAddMinutes: (additionalMinutes: number) => boolean;
}> {
  const [user, subscription] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } }),
    prisma.subscription.findUnique({ where: { userId } }),
  ]);

  const effectivePlan = getEffectivePlan(subscription, user?.createdAt ?? null);
  const planType = getPlanType(effectivePlan);
  const audioLimits = getAudioLimits(effectivePlan);

  if (planType === "text" || !audioLimits) {
    return {
      allowed: false,
      planType,
      usedMinutes: 0,
      limitMinutes: null,
      canAddMinutes: () => false,
    };
  }

  // Trial without subscription: allow with plan limits, used = 0
  if (effectivePlan === "trial" && !subscription) {
    return {
      allowed: true,
      planType,
      usedMinutes: 0,
      limitMinutes: audioLimits.audioMinutesPerMonth,
      canAddMinutes: (additionalMinutes: number) => additionalMinutes <= audioLimits.audioMinutesPerMonth,
    };
  }

  await resetAudioQuotaIfPeriodEnded(userId);

  const subAfterReset = await prisma.subscription.findUnique({
    where: { userId },
  });
  const usedMinutes = subAfterReset?.audioMinutesUsedThisPeriod ?? 0;
  const limitMinutes = subAfterReset?.audioMinutesLimit ?? audioLimits.audioMinutesPerMonth;

  return {
    allowed: true,
    planType,
    usedMinutes,
    limitMinutes,
    canAddMinutes: (additionalMinutes: number) => usedMinutes + additionalMinutes <= limitMinutes,
  };
}

/**
 * Ensure subscription exists for trial user so we can track audio usage.
 * Call before incrementing when effective plan is trial and subscription is null.
 */
async function ensureTrialSubscriptionForAudio(userId: string, userCreatedAt: Date): Promise<void> {
  const trialEnd = new Date(userCreatedAt.getTime() + TRIAL_DURATION_MS);
  const limits = PLAN_LIMITS.trial;
  await prisma.subscription.upsert({
    where: { userId: userId },
    create: {
      userId,
      plan: "free",
      planType: "TEXT",
      status: "active",
      audioMinutesLimit: limits.audioMinutesPerMonth!,
      audioMinutesResetAt: trialEnd,
      audioMinutesUsedThisPeriod: 0,
    },
    update: {},
  });
}

/**
 * Increment audio minutes used this period after successful transcription.
 * For trial users without subscription, creates subscription with trial limits first.
 */
export async function incrementAudioMinutesUsed(
  userId: string,
  minutesUsed: number
): Promise<void> {
  const [user, subscription] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } }),
    prisma.subscription.findUnique({ where: { userId } }),
  ]);

  const effectivePlan = getEffectivePlan(subscription, user?.createdAt ?? null);
  const audioLimits = getAudioLimits(effectivePlan);

  if (!audioLimits) return;

  // Trial without subscription: create one with trial limits, then set used
  if (effectivePlan === "trial" && !subscription && user?.createdAt) {
    await ensureTrialSubscriptionForAudio(userId, user.createdAt);
    await prisma.subscription.update({
      where: { userId },
      data: {
        audioMinutesUsedThisPeriod: minutesUsed,
        updatedAt: new Date(),
      },
    });
    return;
  }

  await resetAudioQuotaIfPeriodEnded(userId);

  const subAfterReset = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subAfterReset || subAfterReset.audioMinutesLimit == null) return;

  const now = new Date();
  const resetAt = subAfterReset.audioMinutesResetAt ?? subAfterReset.currentPeriodEnd;
  if (resetAt != null && now > resetAt) return;

  const used = subAfterReset.audioMinutesUsedThisPeriod ?? 0;

  await prisma.subscription.update({
    where: { userId },
    data: {
      audioMinutesUsedThisPeriod: used + minutesUsed,
      updatedAt: now,
    },
  });
}
