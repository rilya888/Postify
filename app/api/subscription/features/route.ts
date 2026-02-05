import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { checkAudioQuota } from "@/lib/services/quota";
import { prisma } from "@/lib/db/prisma";
import { PLAN_LIMITS, getEffectivePlan, getAudioLimits } from "@/lib/constants/plans";

const TRIAL_DURATION_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * GET /api/subscription/features
 * Returns plan features for the current user (effective plan: trial / free / pro / enterprise).
 * UI uses this for PlanBadge, SubscriptionBlock, and "Upload audio" on generate page.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [user, subscription] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { createdAt: true },
    }),
    prisma.subscription.findUnique({
      where: { userId: session.user.id },
    }),
  ]);

  const plan = getEffectivePlan(subscription, user?.createdAt ?? null);
  const limits = PLAN_LIMITS[plan];
  const audio = await checkAudioQuota(session.user.id);
  const audioLimitsFromPlan = getAudioLimits(plan);

  const trialEndAt =
    plan === "trial" && user?.createdAt
      ? new Date(new Date(user.createdAt).getTime() + TRIAL_DURATION_MS).toISOString()
      : null;

  return NextResponse.json({
    plan,
    planType: audio.planType,
    canUseAudio: audio.allowed,
    maxProjects: limits?.maxProjects ?? 0,
    maxCharactersPerContent: limits?.maxCharactersPerContent ?? 0,
    audioLimits:
      audio.limitMinutes != null
        ? { usedMinutes: audio.usedMinutes, limitMinutes: audio.limitMinutes }
        : null,
    maxAudioFileSizeMb: audioLimitsFromPlan?.maxAudioFileSizeMb ?? null,
    isTrial: plan === "trial",
    trialEndAt,
  });
}
