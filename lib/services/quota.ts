import { prisma } from "@/lib/db/prisma";
import { PLAN_LIMITS, getPlanType, canUseAudio, getAudioLimits } from "@/lib/constants/plans";
import type { Plan } from "@/lib/constants/plans";
import { Logger } from "@/lib/utils/logger";

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

  const projectCount = await prisma.project.count({
    where: { userId },
  });

  const result = {
    canCreate: projectCount < limit,
    current: projectCount,
    limit,
    plan,
    planType: getPlanType(plan),
    canUseAudio: canUseAudio(plan),
  };

  Logger.info("Quota check result", { userId, ...result });
  return result;
}

/**
 * Check audio transcription quota for text_audio plan (Stage 3/4).
 * Returns used minutes this period and limit; caller should reject if adding duration would exceed limit.
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

  const plan = (subscription?.plan || "free") as Plan;
  const planType = getPlanType(plan);
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

  const usedMinutes = subscription?.audioMinutesUsedThisPeriod ?? 0;
  const limitMinutes = subscription?.audioMinutesLimit ?? audioLimits.audioMinutesPerMonth;

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
 * Call after transcription succeeds; resets usage when period has changed (currentPeriodEnd).
 */
export async function incrementAudioMinutesUsed(
  userId: string,
  minutesUsed: number
): Promise<void> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription || subscription.audioMinutesLimit == null) {
    return;
  }

  const now = new Date();
  const periodEnd = subscription.currentPeriodEnd;
  const used = subscription.audioMinutesUsedThisPeriod ?? 0;

  if (periodEnd != null && now > periodEnd) {
    return;
  }

  await prisma.subscription.update({
    where: { userId },
    data: {
      audioMinutesUsedThisPeriod: used + minutesUsed,
      updatedAt: now,
    },
  });
}