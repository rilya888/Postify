import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { checkAudioQuota } from "@/lib/services/quota";
import { PLAN_LIMITS } from "@/lib/constants/plans";
import type { Plan } from "@/lib/constants/plans";

/**
 * GET /api/subscription/features
 * Returns plan features for the current user (Stage 3: text vs text_audio).
 * UI uses this to show/hide "Upload audio" and display limits.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const audio = await checkAudioQuota(session.user.id);
  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  });
  const plan = (subscription?.plan ?? "free") as Plan;
  const limits = PLAN_LIMITS[plan];

  return NextResponse.json({
    planType: audio.planType,
    canUseAudio: audio.allowed,
    plan,
    maxProjects: limits.maxProjects,
    maxCharactersPerContent: limits.maxCharactersPerContent,
    audioLimits:
      audio.limitMinutes != null
        ? { usedMinutes: audio.usedMinutes, limitMinutes: audio.limitMinutes }
        : null,
    maxAudioFileSizeMb: limits.maxAudioFileSizeMb ?? null,
  });
}
