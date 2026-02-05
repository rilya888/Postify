import { prisma } from "@/lib/db/prisma";
import {
  PLAN_LIMITS,
  getPlanTypeFromSubscription,
  getAudioLimits,
} from "@/lib/constants/plans";
import type { Plan } from "@/lib/constants/plans";
import { Logger } from "@/lib/utils/logger";
import { addMonths } from "@/lib/utils/date";

/**
 * Quota service for checking user limits (Stage 3: plan type text / text_audio).
 */
export async function checkProjectQuota(userId: string) {
  Logger.info("Checking project quota", { userId });

  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  const plan = (subscription?.plan || "free") as Plan;
  const limit = PLAN_LIMITS[plan].maxProjects;
  const planType = getPlanTypeFromSubscription(subscription);

  const projectCount = await prisma.project.count({
    where: { userId },
  });

  const result = {
    canCreate: projectCount < limit,
    current: projectCount,
    limit,
    plan,
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
 * Check audio transcription quota for text_audio plan (Stage 3/4).
 * Returns used minutes this period and limit; caller should reject if adding duration would exceed limit.
 * Resets quota when period has ended (audioMinutesResetAt in the past).
 */
export async function checkAudioQuota(userId: string): Promise<{
  allowed: boolean;
  planType: "text" | "text_audio";
  usedMinutes: number;
  limitMinutes: number | null;
  canAddMinutes: (additionalMinutes: number) => boolean;
}> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  const planType = getPlanTypeFromSubscription(subscription);
  const plan = (subscription?.plan || "free") as Plan;
  const audioLimits = getAudioLimits(plan);

  if (planType === "text" || !audioLimits) {
    return {
      allowed: false,
      planType,
      usedMinutes: 0,
      limitMinutes: null,
      canAddMinutes: () => false,
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
 * Increment audio minutes used this period after successful transcription (Stage 4).
 * Resets quota when period has ended, then increments.
 */
export async function incrementAudioMinutesUsed(
  userId: string,
  minutesUsed: number
): Promise<void> {
  await resetAudioQuotaIfPeriodEnded(userId);

  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription || subscription.audioMinutesLimit == null) {
    return;
  }

  const now = new Date();
  const resetAt = subscription.audioMinutesResetAt ?? subscription.currentPeriodEnd;
  if (resetAt != null && now > resetAt) {
    return;
  }

  const used = subscription.audioMinutesUsedThisPeriod ?? 0;

  await prisma.subscription.update({
    where: { userId },
    data: {
      audioMinutesUsedThisPeriod: used + minutesUsed,
      updatedAt: now,
    },
  });
}