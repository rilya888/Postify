import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { checkAudioQuota } from "@/lib/services/quota";
import { prisma } from "@/lib/db/prisma";
import { PLAN_LIMITS, getAudioLimits } from "@/lib/constants/plans";
import type { Plan } from "@/lib/constants/plans";

/**
 * GET /api/subscription/features
 * Returns plan features for the current user (Stage 3: text vs text_audio).
 * UI uses this to show PlanBadge, SubscriptionBlock, and "Upload audio" on generate page.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  });
  const rawPlan = subscription?.plan ?? "free";
  const plan = rawPlan in PLAN_LIMITS ? (rawPlan as Plan) : "free";
  const limits = PLAN_LIMITS[plan];
  const audio = await checkAudioQuota(session.user.id);
  const audioLimitsFromPlan = getAudioLimits(plan);

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
  });
}
